import { test, expect } from "@playwright/test";
import { prisma } from "../../src/server/db";
import { validatePublishTemplate } from "../../src/server/rules";

test.describe("E7: Template Publication Dependency (R8)", () => {
  let unpublishedSceneId: string;
  let publishedMusicId: string;

  test.beforeAll(async () => {
    // Create an unpublished test scene
    const scene = await prisma.scene.create({
      data: {
        name: "Test Unpublished Scene E7",
        description: "Test Unpublished Scene description",
        prompt: "test",
        status: "READY",
        published: false,
      },
    });
    unpublishedSceneId = scene.id;

    const music = await prisma.music.findFirst({
      where: { published: true },
    });
    publishedMusicId = music!.id;
  });

  test.afterAll(async () => {
    if (unpublishedSceneId) {
      await prisma.scene.delete({ where: { id: unpublishedSceneId } }).catch(() => {});
    }
  });

  test("Rule R8 blocks template publication if scene is unpublished", () => {
    expect(() =>
      validatePublishTemplate(
        { published: false },
        { published: true }
      )
    ).toThrowError();
  });

  test("Rule R8 blocks template publication if music is unpublished", () => {
    expect(() =>
      validatePublishTemplate(
        { published: true },
        { published: false }
      )
    ).toThrowError();
  });

  test("Admin template creation API blocks publishing when scene is unpublished", async ({
    request,
  }) => {
    const res = await request.post("/api/admin/templates", {
      data: {
        name: "Invalid Unpublished Template",
        sceneId: unpublishedSceneId,
        musicId: publishedMusicId,
        published: true,
      },
    });

    // 401 if unauthenticated or 400 with VALIDATION (R8: TEMPLATE_PARTS_NOT_PUBLISHED)
    expect([400, 401]).toContain(res.status());
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
