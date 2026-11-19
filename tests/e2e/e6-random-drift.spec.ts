import { test, expect } from "@playwright/test";
import { selectRandomDrift } from "../../src/server/rules";
import { prisma } from "../../src/server/db";

test.describe("E6: Random Drift Determinism & Non-Consecutive Selection (R6)", () => {
  test("20 consecutive random calls never repeat the immediate prior item and select only published content", async () => {
    // Fetch all published templates
    const publishedTemplates = await prisma.template.findMany({
      where: { published: true },
      include: {
        tags: true,
        scene: { include: { tags: true } },
        music: { include: { tags: true } },
      },
    });

    expect(publishedTemplates.length).toBeGreaterThanOrEqual(2);

    let lastId: string | undefined = undefined;
    const history: string[] = [];

    for (let i = 0; i < 20; i++) {
      const selection = selectRandomDrift(
        {
          templates: publishedTemplates as any,
          scenes: publishedTemplates.map((t) => t.scene) as any,
          music: publishedTemplates.map((t) => t.music) as any,
        },
        {
          lastPlayedTemplateId: lastId,
        }
      );
      expect(selection).toBeDefined();

      if (selection.type === "template") {
        expect(selection.templateId).toBeDefined();
        expect(selection.templateId).not.toBe(lastId);
        lastId = selection.templateId;
        history.push(selection.templateId!);
      } else {
        expect(selection.sceneId).toBeDefined();
        expect(selection.musicId).toBeDefined();
        lastId = selection.sceneId;
        history.push(selection.sceneId);
      }
    }

    expect(history.length).toBe(20);
    // Assert no two consecutive items are identical
    for (let i = 1; i < history.length; i++) {
      expect(history[i]).not.toBe(history[i - 1]);
    }
  });

  test("API /api/random excludes prior item when ?excludeId is provided", async ({
    request,
  }) => {
    const res1 = await request.get("/api/random");
    expect(res1.status()).toBe(200);
    const data1 = await res1.json();
    const firstId = data1.template?.id || data1.scene?.id;
    expect(firstId).toBeDefined();

    // Call again with excludeId
    const res2 = await request.get(`/api/random?excludeId=${firstId}`);
    expect(res2.status()).toBe(200);
    const data2 = await res2.json();
    const secondId = data2.template?.id || data2.scene?.id;
    expect(secondId).not.toBe(firstId);
  });
});
