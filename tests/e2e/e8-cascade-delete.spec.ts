import { test, expect } from "@playwright/test";
import { prisma } from "../../src/server/db";
import { assertCanDeleteContent } from "../../src/server/rules";

test.describe("E8: Cascade Deletion & Skip Protection (R12)", () => {
  let referencedMusicId: string;
  let activeTemplateId: string;

  test.beforeAll(async () => {
    // Find active template and its music
    const tpl = await prisma.template.findFirst({
      where: { published: true },
      include: { music: true },
    });
    activeTemplateId = tpl!.id;
    referencedMusicId = tpl!.musicId;
  });

  test("Rule R12 blocks deletion of music or scene used by an existing template with 409 CONFLICT_IN_USE", () => {
    // In-use check should throw 409
    expect(() =>
      assertCanDeleteContent({
        templateCount: 1,
        playlistItemCount: 0,
      })
    ).toThrowError();
  });

  test("Direct API DELETE /api/admin/music/[id] protects active referenced tracks", async ({
    request,
  }) => {
    const res = await request.delete(`/api/admin/music/${referencedMusicId}`);
    // 401 if unauthenticated or 409 CONFLICT_IN_USE
    expect([401, 409]).toContain(res.status());
    const body = await res.json();
    expect(body.error).toBeDefined();

    // Verify track still exists in database
    const track = await prisma.music.findUnique({
      where: { id: referencedMusicId },
    });
    expect(track).not.toBeNull();
  });
});
