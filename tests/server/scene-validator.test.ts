import { describe, it, expect, vi, beforeEach } from "vitest";
import { SceneValidator } from "../../src/server/services/scene-validator";

describe("BE-6: SceneValidator", () => {
  let validator: SceneValidator;

  beforeEach(() => {
    validator = new SceneValidator();
  });

  describe("Stage 1: Syntax & Security Scan", () => {
    it("extracts code from markdown code fences", () => {
      const markdown = "```typescript\nexport default function mount(svg, opts) { return { pause(){}, resume(){}, setSpeed(){}, destroy(){} }; }\n```";
      const result = validator.validateStage1SyntaxAndSecurity(markdown);
      expect(result.ok).toBe(true);
      expect(result.code).toContain("export default function mount");
    });

    it("rejects code containing forbidden tokens (e.g. fetch, eval, localStorage)", () => {
      const maliciousCode = "export default function mount(svg, opts) { fetch('http://evil.com'); return { pause(){}, resume(){}, setSpeed(){}, destroy(){} }; }";
      const result = validator.validateStage1SyntaxAndSecurity(maliciousCode);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Stage 1 Security Violation: Disallowed token detected 'fetch('");
    });

    it("rejects code containing window.parent", () => {
      const maliciousCode = "export default function mount(svg, opts) { window.parent.postMessage('steal', '*'); return { pause(){}, resume(){}, setSpeed(){}, destroy(){} }; }";
      const result = validator.validateStage1SyntaxAndSecurity(maliciousCode);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("window.parent");
    });

    it("rejects code missing default mount export", () => {
      const invalidContract = "export function render() {}";
      const result = validator.validateStage1SyntaxAndSecurity(invalidContract);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Stage 1 Contract Violation");
    });
  });

  describe("Stage 2: Typecheck & Parse", () => {
    it("rejects syntax error in typescript", async () => {
      const badTs = "export default function mount( { let x = ; }";
      const res = await validator.validateStage2Typecheck(badTs, "storage/tmp/test_bad.ts");
      expect(res.ok).toBe(false);
      expect(res.error).toContain("Stage 2 Typecheck Error");
    });
  });
});
