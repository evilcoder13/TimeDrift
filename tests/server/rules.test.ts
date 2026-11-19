import { describe, it, expect } from "vitest";
import {
  validateSessionDuration,
  assertProAccess,
  validatePlaylist,
  calculateJaccardScore,
  selectRandomDrift,
  validatePublishTemplate,
  validatePublishMusic,
  validatePublishScene,
  assertCanDeleteContent,
  isProActive,
  RuleViolationError,
} from "../../src/server/rules";

describe("Business Rules Engine (R1–R12)", () => {
  // -------------------------------------------------------------------------
  // R1: Free Run Duration Bounds (3..15 min)
  // -------------------------------------------------------------------------
  describe("R1: Free Session Duration Bounds", () => {
    it("accepts valid boundary durations for free users (3, 10, 15)", () => {
      expect(validateSessionDuration(3, false)).toEqual({ valid: true, minutes: 3 });
      expect(validateSessionDuration(10, false)).toEqual({ valid: true, minutes: 10 });
      expect(validateSessionDuration(15, false)).toEqual({ valid: true, minutes: 15 });
    });

    it("rejects durations below 3 minutes (P1-QA-02)", () => {
      expect(() => validateSessionDuration(2, false)).toThrowError(RuleViolationError);
      try {
        validateSessionDuration(2, false);
      } catch (e: any) {
        expect(e.statusCode).toBe(400);
        expect(e.code).toBe("DURATION_OUT_OF_BOUNDS");
        expect(e.rule).toBe("R1");
        expect(e.details).toEqual({ min: 3, max: 15, requested: 2 });
      }
    });

    it("rejects durations above 15 minutes (P1-QA-01)", () => {
      expect(() => validateSessionDuration(16, false)).toThrowError(RuleViolationError);
      try {
        validateSessionDuration(16, false);
      } catch (e: any) {
        expect(e.statusCode).toBe(400);
        expect(e.code).toBe("DURATION_OUT_OF_BOUNDS");
        expect(e.rule).toBe("R1");
        expect(e.details).toEqual({ min: 3, max: 15, requested: 16 });
      }
    });

    it("rejects non-integer durations", () => {
      expect(() => validateSessionDuration(7.5, false)).toThrowError(RuleViolationError);
      try {
        validateSessionDuration(7.5, false);
      } catch (e: any) {
        expect(e.code).toBe("DURATION_NOT_INTEGER");
        expect(e.rule).toBe("R1");
      }
    });
  });

  // -------------------------------------------------------------------------
  // R3: Pro Run Duration Bounds (3..720 min)
  // -------------------------------------------------------------------------
  describe("R3: Pro Session Duration Bounds", () => {
    it("accepts durations up to 720 minutes for Pro users (P1-QA-03)", () => {
      expect(validateSessionDuration(3, true)).toEqual({ valid: true, minutes: 3 });
      expect(validateSessionDuration(60, true)).toEqual({ valid: true, minutes: 60 });
      expect(validateSessionDuration(720, true)).toEqual({ valid: true, minutes: 720 });
    });

    it("rejects durations > 720 minutes for Pro users", () => {
      expect(() => validateSessionDuration(721, true)).toThrowError(RuleViolationError);
      try {
        validateSessionDuration(721, true);
      } catch (e: any) {
        expect(e.statusCode).toBe(400);
        expect(e.code).toBe("DURATION_OUT_OF_BOUNDS");
        expect(e.rule).toBe("R3");
        expect(e.details).toEqual({ min: 3, max: 720, requested: 721 });
      }
    });

    it("rejects durations < 3 minutes for Pro users", () => {
      expect(() => validateSessionDuration(1, true)).toThrowError(RuleViolationError);
      try {
        validateSessionDuration(1, true);
      } catch (e: any) {
        expect(e.statusCode).toBe(400);
        expect(e.code).toBe("DURATION_OUT_OF_BOUNDS");
        expect(e.rule).toBe("R3");
      }
    });
  });

  // -------------------------------------------------------------------------
  // R4: Pro-Gated Routes & Features
  // -------------------------------------------------------------------------
  describe("R4: Pro-Gated Feature Assertion", () => {
    it("passes when isPro is true", () => {
      expect(() => assertProAccess(true)).not.toThrow();
    });

    it("throws 403 PRO_REQUIRED when isPro is false (P1-QA-04)", () => {
      expect(() => assertProAccess(false)).toThrowError(RuleViolationError);
      try {
        assertProAccess(false);
      } catch (e: any) {
        expect(e.statusCode).toBe(403);
        expect(e.code).toBe("PRO_REQUIRED");
        expect(e.rule).toBe("R4");
      }
    });
  });

  // -------------------------------------------------------------------------
  // R5: Playlist Constraints
  // -------------------------------------------------------------------------
  describe("R5: Playlist Constraints", () => {
    it("rejects non-pro playlist attempts with R4 guard", () => {
      expect(() =>
        validatePlaylist([{ templateId: "t1", minutes: 10 }], false)
      ).toThrowError(RuleViolationError);
    });

    it("accepts valid playlist with template item", () => {
      const result = validatePlaylist(
        [
          { templateId: "t1", minutes: 30 },
          { templateId: "t2", minutes: 45 },
        ],
        true
      );
      expect(result).toEqual({ valid: true, totalMinutes: 75, itemCount: 2 });
    });

    it("accepts valid playlist with custom pair item", () => {
      const result = validatePlaylist(
        [
          { musicId: "m1", sceneId: "s1", minutes: 20 },
        ],
        true
      );
      expect(result).toEqual({ valid: true, totalMinutes: 20, itemCount: 1 });
    });

    it("rejects empty playlist (count < 1)", () => {
      expect(() => validatePlaylist([], true)).toThrowError(RuleViolationError);
      try {
        validatePlaylist([], true);
      } catch (e: any) {
        expect(e.code).toBe("PLAYLIST_ITEM_COUNT_INVALID");
        expect(e.rule).toBe("R5");
      }
    });

    it("rejects playlist exceeding 50 items (count > 50)", () => {
      const items = Array.from({ length: 51 }, () => ({
        templateId: "t1",
        minutes: 3,
      }));
      expect(() => validatePlaylist(items, true)).toThrowError(RuleViolationError);
      try {
        validatePlaylist(items, true);
      } catch (e: any) {
        expect(e.code).toBe("PLAYLIST_ITEM_COUNT_INVALID");
      }
    });

    it("rejects item violating XOR structure (neither or both specified)", () => {
      // Neither
      expect(() =>
        validatePlaylist([{ minutes: 10 }], true)
      ).toThrowError(RuleViolationError);
      try {
        validatePlaylist([{ minutes: 10 }], true);
      } catch (e: any) {
        expect(e.code).toBe("PLAYLIST_ITEM_TARGET_INVALID");
        expect(e.rule).toBe("R5");
      }

      // Both template and custom pair
      expect(() =>
        validatePlaylist(
          [{ templateId: "t1", musicId: "m1", sceneId: "s1", minutes: 10 }],
          true
        )
      ).toThrowError(RuleViolationError);

      // Only music without scene
      expect(() =>
        validatePlaylist([{ musicId: "m1", minutes: 10 }], true)
      ).toThrowError(RuleViolationError);
    });

    it("rejects item with invalid duration bounds", () => {
      expect(() =>
        validatePlaylist([{ templateId: "t1", minutes: 2 }], true)
      ).toThrowError(RuleViolationError);
      try {
        validatePlaylist([{ templateId: "t1", minutes: 2 }], true);
      } catch (e: any) {
        expect(e.code).toBe("PLAYLIST_ITEM_DURATION_INVALID");
      }
    });

    it("rejects total duration exceeding 720 minutes (P1-QA-05)", () => {
      const items = [
        { templateId: "t1", minutes: 250 },
        { templateId: "t2", minutes: 250 },
        { templateId: "t3", minutes: 250 }, // Total = 750 > 720
      ];
      expect(() => validatePlaylist(items, true)).toThrowError(RuleViolationError);
      try {
        validatePlaylist(items, true);
      } catch (e: any) {
        expect(e.code).toBe("PLAYLIST_DURATION_EXCEEDED");
        expect(e.rule).toBe("R5");
        expect(e.details).toEqual({ totalMinutes: 750, max: 720 });
      }
    });
  });

  // -------------------------------------------------------------------------
  // R6: Deterministic Random Selection Algorithm
  // -------------------------------------------------------------------------
  describe("R6: Deterministic Random Selection Algorithm", () => {
    const dummySource = {
      templates: [
        { id: "t1", published: true, sceneId: "s1", musicId: "m1" },
        { id: "t2", published: true, sceneId: "s2", musicId: "m2" },
        { id: "t3", published: true, sceneId: "s3", musicId: "m3" },
      ],
      scenes: [
        { id: "s1", published: true, tags: ["calm", "rainy"] },
        { id: "s2", published: true, tags: ["focus"] },
      ],
      music: [
        { id: "m1", published: true, tags: ["rainy"] },
        { id: "m2", published: true, tags: ["sleepy"] },
      ],
    };

    it("selects template uniformly and never repeats lastPlayedTemplateId (P1-QA-06)", () => {
      let lastId: string | undefined = "t1";
      for (let i = 0; i < 50; i++) {
        const result = selectRandomDrift(dummySource, {
          lastPlayedTemplateId: lastId,
        });
        expect(result.type).toBe("template");
        expect(result.templateId).not.toBe(lastId);
        lastId = result.templateId;
      }
    });

    it("falls back to scene + music pair when no published templates exist", () => {
      const fallbackSource = {
        templates: [],
        scenes: [
          { id: "s1", published: true, tags: ["calm", "rainy"] },
        ],
        music: [
          { id: "m1", published: true, tags: ["rainy"] }, // shares "rainy"
          { id: "m2", published: true, tags: ["cozy"] },
        ],
      };

      const result = selectRandomDrift(fallbackSource);
      expect(result.type).toBe("pair");
      expect(result.sceneId).toBe("s1");
      expect(result.musicId).toBe("m1"); // Shared tag matched
    });

    it("throws 404 NO_PUBLISHED_CONTENT if neither templates nor scenes/music exist", () => {
      expect(() =>
        selectRandomDrift({ templates: [], scenes: [], music: [] })
      ).toThrowError(RuleViolationError);
      try {
        selectRandomDrift({ templates: [], scenes: [], music: [] });
      } catch (e: any) {
        expect(e.statusCode).toBe(404);
        expect(e.code).toBe("NO_PUBLISHED_CONTENT");
        expect(e.rule).toBe("R6");
      }
    });
  });

  // -------------------------------------------------------------------------
  // R7: Template Suggestion Score (Jaccard Index)
  // -------------------------------------------------------------------------
  describe("R7: Jaccard Similarity Calculation", () => {
    it("returns 1.0 for identical tag sets (P1-QA-07)", () => {
      const tagsS = ["nostalgic", "night", "warm"];
      const tagsM = ["nostalgic", "warm", "night"];
      expect(calculateJaccardScore(tagsS, tagsM)).toBe(1.0);
    });

    it("returns 0.20 for 1 shared tag out of 5 unique tags (P1-QA-07)", () => {
      const tagsS = ["morning", "peaceful"];
      const tagsM = ["morning", "sleepy", "focus", "cozy"];
      // Intersection = 1 ("morning"), Union = 5 ("morning", "peaceful", "sleepy", "focus", "cozy")
      expect(calculateJaccardScore(tagsS, tagsM)).toBe(0.2);
    });

    it("returns 0 for disjoint tag sets", () => {
      expect(calculateJaccardScore(["calm"], ["focus"])).toBe(0);
      expect(calculateJaccardScore([], [])).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // R8: Publication Integrity Constraints
  // -------------------------------------------------------------------------
  describe("R8: Template Publication Constraints", () => {
    it("allows publication when both scene and music are published", () => {
      expect(() =>
        validatePublishTemplate({ published: true }, { published: true })
      ).not.toThrow();
    });

    it("rejects publication when scene or music is unpublished (P1-QA-08)", () => {
      expect(() =>
        validatePublishTemplate({ published: false }, { published: true })
      ).toThrowError(RuleViolationError);

      try {
        validatePublishTemplate({ published: false }, { published: true });
      } catch (e: any) {
        expect(e.statusCode).toBe(409);
        expect(e.code).toBe("UNPUBLISHED_DEPENDENCY");
        expect(e.rule).toBe("R8");
        expect(e.details).toEqual({ scenePublished: false, musicPublished: true });
      }

      expect(() =>
        validatePublishTemplate({ published: true }, { published: false })
      ).toThrowError(RuleViolationError);
    });
  });

  // -------------------------------------------------------------------------
  // R9: Pro Status Evaluation & Mid-Session Expiry
  // -------------------------------------------------------------------------
  describe("R9: Pro Status Evaluation & Mid-Session Expiry", () => {
    it("evaluates true for active pro with no expiry (lifetime)", () => {
      expect(isProActive({ isPro: true, proUntil: null })).toBe(true);
    });

    it("evaluates true for future proUntil (P1-QA-09)", () => {
      const future = new Date(Date.now() + 60000);
      expect(isProActive({ isPro: true, proUntil: future })).toBe(true);
    });

    it("evaluates false for past proUntil", () => {
      const past = new Date(Date.now() - 60000);
      expect(isProActive({ isPro: true, proUntil: past })).toBe(false);
    });

    it("evaluates false when isPro is false or null", () => {
      expect(isProActive(null)).toBe(false);
      expect(isProActive({ isPro: false })).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // R10 & R11: Music & Scene Ready Gate
  // -------------------------------------------------------------------------
  describe("R10 & R11: Music and Scene Ready Verification", () => {
    it("validates music duration and ready status", () => {
      expect(() =>
        validatePublishMusic({ status: "READY", seconds: 45 })
      ).not.toThrow();

      // Invalid duration
      expect(() =>
        validatePublishMusic({ status: "READY", seconds: 50 })
      ).toThrowError(RuleViolationError);

      // Not READY
      expect(() =>
        validatePublishMusic({ status: "VALIDATING", seconds: 30 })
      ).toThrowError(RuleViolationError);
    });

    it("validates scene ready status before publishing", () => {
      expect(() => validatePublishScene({ status: "READY" })).not.toThrow();

      expect(() =>
        validatePublishScene({ status: "VALIDATING" })
      ).toThrowError(RuleViolationError);
      try {
        validatePublishScene({ status: "QUEUED" });
      } catch (e: any) {
        expect(e.statusCode).toBe(409);
        expect(e.code).toBe("CONTENT_NOT_READY");
        expect(e.rule).toBe("R11");
      }
    });
  });

  // -------------------------------------------------------------------------
  // R12: Cascade Deletion Guards
  // -------------------------------------------------------------------------
  describe("R12: Hard Deletion Cascade Guards", () => {
    it("permits deletion when content has 0 dependents", () => {
      expect(() =>
        assertCanDeleteContent({ templateCount: 0, playlistItemCount: 0 })
      ).not.toThrow();
    });

    it("blocks deletion when in use by templates or playlists (P1-QA-10)", () => {
      expect(() =>
        assertCanDeleteContent({ templateCount: 2, playlistItemCount: 1 })
      ).toThrowError(RuleViolationError);

      try {
        assertCanDeleteContent({ templateCount: 2, playlistItemCount: 1 });
      } catch (e: any) {
        expect(e.statusCode).toBe(409);
        expect(e.code).toBe("CONFLICT_IN_USE");
        expect(e.rule).toBe("R12");
        expect(e.details).toEqual({ templateCount: 2, playlistItemCount: 1 });
      }
    });
  });
});
