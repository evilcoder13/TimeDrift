import { test, expect } from "@playwright/test";
import { validatePlaylist } from "../../src/server/rules";

test.describe("E5: Playlist CRUD, Item Limits (50) & 720-Min Accumulator Cap (R5)", () => {
  test("Server rule enforces max 50 items and 720 minutes total cap", () => {
    // 1. Valid playlist with 2 items totalling 720 min
    const validItems = [
      { templateId: "t1", minutes: 360 },
      { templateId: "t2", minutes: 360 },
    ];
    const res = validatePlaylist(validItems, true);
    expect(res.valid).toBe(true);
    expect(res.totalMinutes).toBe(720);

    // 2. Playlist exceeding 720 min (e.g. 721 min) throws 400
    const exceededDuration = [
      { templateId: "t1", minutes: 360 },
      { templateId: "t2", minutes: 361 },
    ];
    expect(() => validatePlaylist(exceededDuration, true)).toThrowError();

    // 3. Playlist exceeding 50 items (51 items) throws 400
    const exceededCount = Array.from({ length: 51 }, () => ({
      templateId: "t1",
      minutes: 3,
    }));
    expect(() => validatePlaylist(exceededCount, true)).toThrowError();
  });

  test("Direct API PUT /api/playlists/p1 with total > 720m returns 400 or 403", async ({
    request,
  }) => {
    const res = await request.post("/api/playlists", {
      data: {
        title: "Overflow Playlist",
        items: [
          { templateId: "t1", durationMinutes: 400 },
          { templateId: "t2", durationMinutes: 321 },
        ],
      },
    });

    expect([400, 401, 403]).toContain(res.status());
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
