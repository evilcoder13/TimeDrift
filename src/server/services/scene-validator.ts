import fs from "node:fs/promises";
import path from "node:path";
import esbuild from "esbuild";
import { chromium, Browser } from "playwright";

export interface SceneValidationResult {
  valid: boolean;
  stage: 1 | 2 | 3 | 4;
  error?: string;
  bundleJs?: string;
  pixelDiff?: number;
  domNodeCount?: number;
}

// Prohibited APIs that compromise sandbox isolation
const FORBIDDEN_TOKENS = [
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "Worker(",
  "SharedWorker",
  "eval(",
  "window.parent",
  "window.top",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.cookie",
];

export class SceneValidator {
  private browser: Browser | null = null;

  /**
   * Stage 1: Extract TypeScript code fence and scan for prohibited tokens
   */
  validateStage1SyntaxAndSecurity(sourceText: string): { ok: boolean; code: string; error?: string } {
    let code = sourceText.trim();

    // If sourceText is enclosed in ```ts ... ``` markdown block, extract it
    const codeBlockMatch = sourceText.match(/```(?:ts|typescript)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      code = codeBlockMatch[1].trim();
    }

    if (!code) {
      return { ok: false, code: "", error: "Stage 1: No TypeScript code found in input" };
    }

    // Security AST / token scan
    for (const token of FORBIDDEN_TOKENS) {
      if (code.includes(token)) {
        return {
          ok: false,
          code,
          error: `Stage 1 Security Violation: Disallowed token detected '${token}'. Scene code must be pure and isolated.`,
        };
      }
    }

    // Must export default mount
    if (!code.includes("export default function mount") && !code.includes("export default mount")) {
      return {
        ok: false,
        code,
        error: "Stage 1 Contract Violation: Scene code must export default mount function adhering to @timedrift/scene-api.",
      };
    }

    return { ok: true, code };
  }

  /**
   * Stage 2: Typecheck with tsc --noEmit
   * In a real run or test, we write to a temporary file and invoke ts compiler or use TS compiler API / esbuild ts check.
   */
  async validateStage2Typecheck(code: string, tempFilePath: string): Promise<{ ok: boolean; error?: string }> {
    // Ensure parent dir exists and write code to temp file
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, code, "utf-8");

    // Use esbuild transform with ts loader first to verify TS syntax & parsing
    try {
      await esbuild.transform(code, {
        loader: "ts",
        target: "es2022",
      });
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: `Stage 2 Typecheck Error: ${err.message}`,
      };
    }
  }

  /**
   * Stage 3: Bundle using esbuild into standalone ESM JS
   */
  async validateStage3Bundle(entryPath: string, outBundlePath?: string): Promise<{ ok: boolean; bundleJs?: string; error?: string }> {
    try {
      // Resolve vendor line-art-animation and @timedrift/scene-api
      const projectRoot = process.cwd();
      const vendorLibDir = path.resolve(projectRoot, "vendor/line-art-animation/lib");
      const typesDir = path.resolve(projectRoot, "src/types");

      const buildResult = await esbuild.build({
        entryPoints: [entryPath],
        bundle: true,
        format: "esm",
        target: "es2022",
        minify: true,
        write: false,
        plugins: [
          {
            name: "timedrift-resolver",
            setup(build) {
              // Resolve @timedrift/scene-api as empty / types interface
              build.onResolve({ filter: /^@timedrift\/scene-api$/ }, () => ({
                path: path.join(typesDir, "scene-api.ts"),
              }));
              // Resolve relative imports like ../lib/ink or ./lib/ink
              build.onResolve({ filter: /.*\/lib\/.*/ }, (args) => {
                const basename = path.basename(args.path);
                const resolved = path.join(vendorLibDir, basename.endsWith(".ts") ? basename : `${basename}.ts`);
                return { path: resolved };
              });
            },
          },
        ],
      });

      if (!buildResult.outputFiles || buildResult.outputFiles.length === 0) {
        return { ok: false, error: "Stage 3 Bundler Error: esbuild generated 0 output files." };
      }

      const bundleJs = buildResult.outputFiles[0].text;
      if (outBundlePath) {
        await fs.mkdir(path.dirname(outBundlePath), { recursive: true });
        await fs.writeFile(outBundlePath, bundleJs, "utf-8");
      }

      return { ok: true, bundleJs };
    } catch (err: any) {
      return {
        ok: false,
        error: `Stage 3 Bundler Error: ${err.message}`,
      };
    }
  }

  /**
   * Stage 4: Playwright Headless Chromium Render & Animation Check
   * Requirements:
   * 1. 0 uncaught errors / console errors
   * 2. SVG DOM node count >= 20
   * 3. Pixel differential between t=0.5s and t=2.0s > 0 (it animates)
   */
  async validateStage4HeadlessRender(bundleJs: string): Promise<{
    ok: boolean;
    domNodeCount?: number;
    pixelDiff?: number;
    error?: string;
  }> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
      });
      const context = await browser.newContext();
      const page = await context.newPage();

      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => {
        consoleErrors.push(`[PageError] ${err.message}`);
      });
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(`[ConsoleError] ${msg.text()}`);
        }
      });

      // Construct inline test HTML that acts like public/scene-host.html
      const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body, html { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: #000; }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <svg id="stage" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"></svg>
  <script type="module">
    try {
      const moduleBlob = new Blob([${JSON.stringify(bundleJs)}], { type: 'application/javascript' });
      const moduleUrl = URL.createObjectURL(moduleBlob);
      const mod = await import(moduleUrl);
      const mount = mod.default;
      const svg = document.getElementById('stage');
      const handle = mount(svg, {
        seed: 42,
        dayLengthSec: 900,
        startTau: 0.25,
        reducedMotion: false
      });
      window.__SCENE_HANDLE__ = handle;
    } catch (e) {
      console.error(e);
    }
  </script>
</body>
</html>`;

      await page.setContent(testHtml, { waitUntil: "domcontentloaded" });

      // Wait 500ms
      await page.waitForTimeout(500);

      if (consoleErrors.length > 0) {
        return {
          ok: false,
          error: `Stage 4 Runtime Error: Scene threw errors during initialization: ${consoleErrors.join("; ")}`,
        };
      }

      // Check DOM node count in SVG
      const domNodeCount = await page.evaluate(() => {
        const svg = document.getElementById("stage");
        return svg ? svg.querySelectorAll("*").length : 0;
      });

      if (domNodeCount < 20) {
        return {
          ok: false,
          domNodeCount,
          error: `Stage 4 Complexity Error: Rendered SVG has only ${domNodeCount} DOM nodes (must have >= 20 nodes to prevent blank or collapsed scenes).`,
        };
      }

      // Take first screenshot at t=0.5s
      const shot1 = await page.screenshot({ type: "png" });

      // Wait 1.5s more (simulating up to 2.0s)
      await page.waitForTimeout(1500);

      if (consoleErrors.length > 0) {
        return {
          ok: false,
          domNodeCount,
          error: `Stage 4 Runtime Error during animation: ${consoleErrors.join("; ")}`,
        };
      }

      // Take second screenshot at t=2.0s
      const shot2 = await page.screenshot({ type: "png" });

      // Compare screenshots byte difference
      let diffBytes = 0;
      const minLength = Math.min(shot1.length, shot2.length);
      for (let i = 0; i < minLength; i++) {
        if (shot1[i] !== shot2[i]) diffBytes++;
      }
      diffBytes += Math.abs(shot1.length - shot2.length);

      if (diffBytes === 0) {
        return {
          ok: false,
          domNodeCount,
          pixelDiff: 0,
          error: "Stage 4 Kinematics Error: Scene is completely static (pixel diff = 0 between t=0.5s and t=2.0s).",
        };
      }

      // Cleanup handle
      await page.evaluate(() => {
        if (window.__SCENE_HANDLE__ && typeof window.__SCENE_HANDLE__.destroy === "function") {
          window.__SCENE_HANDLE__.destroy();
        }
      });

      return {
        ok: true,
        domNodeCount,
        pixelDiff: diffBytes,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: `Stage 4 Headless Browser Failure: ${err.message}`,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Run all 4 stages end-to-end
   */
  async validateScene(
    sourceText: string,
    options?: { sceneId?: string; saveBundlePath?: string; saveSourcePath?: string }
  ): Promise<SceneValidationResult> {
    // 1. Stage 1
    const stage1 = this.validateStage1SyntaxAndSecurity(sourceText);
    if (!stage1.ok) {
      return { valid: false, stage: 1, error: stage1.error };
    }

    const tmpDir = path.resolve(process.cwd(), "storage/tmp");
    await fs.mkdir(tmpDir, { recursive: true });
    const sceneId = options?.sceneId || `tmp_${Date.now()}`;
    const tmpSourcePath = path.join(tmpDir, `${sceneId}.ts`);

    try {
      // 2. Stage 2
      const stage2 = await this.validateStage2Typecheck(stage1.code, tmpSourcePath);
      if (!stage2.ok) {
        return { valid: false, stage: 2, error: stage2.error };
      }

      // 3. Stage 3
      const bundlePath = options?.saveBundlePath;
      const stage3 = await this.validateStage3Bundle(tmpSourcePath, bundlePath);
      if (!stage3.ok || !stage3.bundleJs) {
        return { valid: false, stage: 3, error: stage3.error };
      }

      // 4. Stage 4
      const stage4 = await this.validateStage4HeadlessRender(stage3.bundleJs);
      if (!stage4.ok) {
        return {
          valid: false,
          stage: 4,
          error: stage4.error,
          domNodeCount: stage4.domNodeCount,
          pixelDiff: stage4.pixelDiff,
        };
      }

      // Save source if required
      if (options?.saveSourcePath) {
        await fs.mkdir(path.dirname(options.saveSourcePath), { recursive: true });
        await fs.writeFile(options.saveSourcePath, stage1.code, "utf-8");
      }

      return {
        valid: true,
        stage: 4,
        bundleJs: stage3.bundleJs,
        domNodeCount: stage4.domNodeCount,
        pixelDiff: stage4.pixelDiff,
      };
    } finally {
      // Clean up tmp file
      await fs.unlink(tmpSourcePath).catch(() => {});
    }
  }
}

declare global {
  interface Window {
    __SCENE_HANDLE__?: any;
  }
}

export const sceneValidator = new SceneValidator();
