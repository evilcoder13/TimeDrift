import path from "node:path";
import fs from "node:fs/promises";
import esbuild from "esbuild";

const SEED_SCENES = ["s1", "s2", "s3", "s4", "s5"];
const SEED_AUDIO = ["m1.ogg", "m2.ogg", "m3.ogg", "m4.ogg", "m5.ogg"];

async function main() {
  const root = process.cwd();
  const outScenesDir = path.resolve(root, "storage/scenes");
  const outBundlesDir = path.resolve(root, "storage/bundles");
  const outAudioDir = path.resolve(root, "storage/audio");

  await fs.mkdir(outScenesDir, { recursive: true });
  await fs.mkdir(outBundlesDir, { recursive: true });
  await fs.mkdir(outAudioDir, { recursive: true });

  console.log("📦 Building seed scene bundles (s1..s5)...");
  for (const id of SEED_SCENES) {
    const entry = path.resolve(root, `seed/scenes/${id}.ts`);
    const outFile = path.resolve(outScenesDir, `${id}.bundle.js`);
    await esbuild.build({
      entryPoints: [entry],
      outfile: outFile,
      bundle: true,
      format: "esm",
      target: "es2022",
      minify: true,
    });
    console.log(`  ✓ Built ${path.relative(root, outFile)}`);
  }

  console.log("🎵 Copying seed audio tracks (m1..m5)...");
  for (const file of SEED_AUDIO) {
    const src = path.resolve(root, "seed/audio", file);
    const dst = path.resolve(outAudioDir, file);
    await fs.copyFile(src, dst);
    console.log(`  ✓ Copied ${path.relative(root, dst)}`);
  }

  console.log("✅ All seed assets built into storage/");
}

main().catch((err) => {
  console.error("❌ Failed to build seed assets:", err);
  process.exit(1);
});
