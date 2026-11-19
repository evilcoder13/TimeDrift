/**
 * TimeDrift Business Rules Engine (R1–R12)
 *
 * Single authoritative source of truth for business rules on the server.
 * Reference: docs/ba/REQUIREMENTS.md and docs/ba/P1_URD.md §2.4.
 */

export interface RuleErrorDetails {
  code: string;
  message: string;
  rule: string;
  details?: Record<string, unknown>;
}

export interface RuleErrorResponse {
  error: RuleErrorDetails;
}

export class RuleViolationError extends Error {
  statusCode: number;
  code: string;
  rule: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    rule: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "RuleViolationError";
    this.statusCode = statusCode;
    this.code = code;
    this.rule = rule;
    this.details = details;
  }

  toResponse(): RuleErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        rule: this.rule,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

// ---------------------------------------------------------------------------
// R9: Pro Status Evaluation & Mid-Session Expiry
// isProActive(user) <=> user.isPro = true AND (user.proUntil = null OR user.proUntil > now)
// ---------------------------------------------------------------------------
export function isProActive(
  user?: { isPro?: boolean | null; proUntil?: Date | string | null } | null,
  now: Date = new Date()
): boolean {
  if (!user || !user.isPro) return false;
  if (user.proUntil == null) return true; // Lifetime pro or null expiry
  const until = typeof user.proUntil === "string" ? new Date(user.proUntil) : user.proUntil;
  return until.getTime() > now.getTime();
}

// ---------------------------------------------------------------------------
// R1 & R3: Session Duration Bounds
// R1 Free/Guest: 3 <= minutes <= 15
// R3 Pro: 3 <= minutes <= 720
// ---------------------------------------------------------------------------
export function validateSessionDuration(
  minutes: number,
  isPro: boolean = false
): { valid: true; minutes: number } {
  if (!Number.isInteger(minutes)) {
    throw new RuleViolationError(
      400,
      "DURATION_NOT_INTEGER",
      "Duration minutes must be an integer.",
      isPro ? "R3" : "R1",
      { requested: minutes }
    );
  }

  if (isPro) {
    if (minutes < 3 || minutes > 720) {
      throw new RuleViolationError(
        400,
        "DURATION_OUT_OF_BOUNDS",
        "Pro sessions must be between 3 and 720 minutes.",
        "R3",
        { min: 3, max: 720, requested: minutes }
      );
    }
  } else {
    if (minutes < 3 || minutes > 15) {
      throw new RuleViolationError(
        400,
        "DURATION_OUT_OF_BOUNDS",
        "Free sessions must be between 3 and 15 minutes.",
        "R1",
        { min: 3, max: 15, requested: minutes }
      );
    }
  }

  return { valid: true, minutes };
}

// ---------------------------------------------------------------------------
// R4: Pro-Gated Routes & Features
// ---------------------------------------------------------------------------
export function assertProAccess(isPro: boolean): void {
  if (!isPro) {
    throw new RuleViolationError(
      403,
      "PRO_REQUIRED",
      "Custom pairing and playlists require an active Pro subscription.",
      "R4"
    );
  }
}

// ---------------------------------------------------------------------------
// R5: Playlist Constraints
// Bounds: 1 <= items.length <= 50
// Item duration: 3 <= item.minutes <= 720
// Cumulative duration: sum(item.minutes) <= 720
// Target structure XOR: either templateId OR (musicId AND sceneId)
// ---------------------------------------------------------------------------
export interface PlaylistItemInput {
  templateId?: string | null;
  musicId?: string | null;
  sceneId?: string | null;
  minutes: number;
}

export function validatePlaylist(
  items: PlaylistItemInput[],
  isPro: boolean = true
): { valid: true; totalMinutes: number; itemCount: number } {
  assertProAccess(isPro);

  if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
    throw new RuleViolationError(
      400,
      "PLAYLIST_ITEM_COUNT_INVALID",
      "A playlist must contain between 1 and 50 items.",
      "R5",
      { count: items ? items.length : 0, min: 1, max: 50 }
    );
  }

  let totalMinutes = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!Number.isInteger(item.minutes) || item.minutes < 3 || item.minutes > 720) {
      throw new RuleViolationError(
        400,
        "PLAYLIST_ITEM_DURATION_INVALID",
        `Playlist item at index ${i} must have duration between 3 and 720 minutes.`,
        "R5",
        { index: i, minutes: item.minutes, min: 3, max: 720 }
      );
    }

    totalMinutes += item.minutes;

    const hasTemplate = Boolean(item.templateId);
    const hasCustomPair = Boolean(item.musicId && item.sceneId);

    // Mutual exclusivity XOR: either templateId OR (musicId AND sceneId)
    if (!((hasTemplate && !hasCustomPair) || (!hasTemplate && hasCustomPair))) {
      throw new RuleViolationError(
        400,
        "PLAYLIST_ITEM_TARGET_INVALID",
        `Playlist item at index ${i} must specify either templateId OR (both musicId and sceneId).`,
        "R5",
        {
          index: i,
          templateId: item.templateId ?? null,
          musicId: item.musicId ?? null,
          sceneId: item.sceneId ?? null,
        }
      );
    }
  }

  if (totalMinutes > 720) {
    throw new RuleViolationError(
      400,
      "PLAYLIST_DURATION_EXCEEDED",
      "Total playlist duration cannot exceed 720 minutes (12 hours).",
      "R5",
      { totalMinutes, max: 720 }
    );
  }

  return { valid: true, totalMinutes, itemCount: items.length };
}

// ---------------------------------------------------------------------------
// R7: Template Suggestion Score (Jaccard Index)
// Jaccard(S, M) = |S_tags ∩ M_tags| / |S_tags ∪ M_tags|
// ---------------------------------------------------------------------------
export function calculateJaccardScore(
  sceneTags: string[],
  musicTags: string[]
): number {
  const setS = new Set(sceneTags);
  const setM = new Set(musicTags);

  const union = new Set([...setS, ...setM]);
  if (union.size === 0) return 0;

  let intersectionCount = 0;
  for (const tag of setS) {
    if (setM.has(tag)) {
      intersectionCount++;
    }
  }

  return intersectionCount / union.size;
}

// Alias for backwards/forward compatibility with suggest route
export const jaccardTags = calculateJaccardScore;

// ---------------------------------------------------------------------------
// R6: Deterministic Random Selection Algorithm
// Steps:
// 1. Published templates pool. If > 1, exclude lastPlayedTemplateId. Pick uniformly at random.
// 2. If no templates: query published scenes. If > 1, exclude lastPlayedSceneId. Pick scene S.
// 3. Query published music sharing >= 1 tag with S. If found, pick random. If not, pick any published music.
// 4. If content empty, throw NO_PUBLISHED_CONTENT.
// ---------------------------------------------------------------------------
export interface DriftContentSource {
  templates: Array<{ id: string; published: boolean; sceneId: string; musicId: string }>;
  scenes: Array<{ id: string; published: boolean; tags: string[] }>;
  music: Array<{ id: string; published: boolean; tags: string[] }>;
}

export interface DriftSelectionResult {
  type: "template" | "pair";
  templateId?: string;
  sceneId: string;
  musicId: string;
}

export function selectRandomDrift(
  source: DriftContentSource,
  options?: {
    lastPlayedTemplateId?: string;
    lastPlayedSceneId?: string;
    randomFn?: () => number;
  }
): DriftSelectionResult {
  const rng = options?.randomFn ?? Math.random;

  // Step 1: published templates
  const publishedTemplates = source.templates.filter((t) => t.published);

  if (publishedTemplates.length > 0) {
    let eligible = publishedTemplates;
    if (publishedTemplates.length > 1 && options?.lastPlayedTemplateId) {
      eligible = publishedTemplates.filter((t) => t.id !== options.lastPlayedTemplateId);
      if (eligible.length === 0) eligible = publishedTemplates;
    }
    const index = Math.floor(rng() * eligible.length);
    const chosen = eligible[index];
    return {
      type: "template",
      templateId: chosen.id,
      sceneId: chosen.sceneId,
      musicId: chosen.musicId,
    };
  }

  // Step 2 & 3: fallback to scenes + music pairing
  const publishedScenes = source.scenes.filter((s) => s.published);
  const publishedMusic = source.music.filter((m) => m.published);

  if (publishedScenes.length === 0 || publishedMusic.length === 0) {
    throw new RuleViolationError(
      404,
      "NO_PUBLISHED_CONTENT",
      "No published content available for random selection.",
      "R6"
    );
  }

  let eligibleScenes = publishedScenes;
  if (publishedScenes.length > 1 && options?.lastPlayedSceneId) {
    eligibleScenes = publishedScenes.filter((s) => s.id !== options.lastPlayedSceneId);
    if (eligibleScenes.length === 0) eligibleScenes = publishedScenes;
  }
  const sceneIdx = Math.floor(rng() * eligibleScenes.length);
  const chosenScene = eligibleScenes[sceneIdx];

  // Look for music sharing >= 1 tag with scene
  const sceneTagsSet = new Set(chosenScene.tags);
  const matchingMusic = publishedMusic.filter((m) =>
    m.tags.some((tag) => sceneTagsSet.has(tag))
  );

  let chosenMusic;
  if (matchingMusic.length > 0) {
    const musicIdx = Math.floor(rng() * matchingMusic.length);
    chosenMusic = matchingMusic[musicIdx];
  } else {
    const musicIdx = Math.floor(rng() * publishedMusic.length);
    chosenMusic = publishedMusic[musicIdx];
  }

  return {
    type: "pair",
    sceneId: chosenScene.id,
    musicId: chosenMusic.id,
  };
}

// ---------------------------------------------------------------------------
// R8: Publication Integrity Constraints
// A Template cannot be published unless both its scene and music are published.
// ---------------------------------------------------------------------------
export function validatePublishTemplate(scene: { published: boolean }, music: { published: boolean }): void {
  if (!scene.published || !music.published) {
    throw new RuleViolationError(
      409,
      "UNPUBLISHED_DEPENDENCY",
      "A template can only be published if both its scene and music are published.",
      "R8",
      {
        scenePublished: Boolean(scene.published),
        musicPublished: Boolean(music.published),
      }
    );
  }
}

// ---------------------------------------------------------------------------
// R10 & R11: Music and Scene Ready-Before-Publish Gates
// ---------------------------------------------------------------------------
export function validatePublishMusic(music: { status: string; seconds: number }): void {
  if (![30, 45, 60].includes(music.seconds)) {
    throw new RuleViolationError(
      400,
      "INVALID_AUDIO_DURATION",
      "Music duration seconds must strictly be 30, 45, or 60.",
      "R10",
      { seconds: music.seconds }
    );
  }
  if (music.status !== "READY") {
    throw new RuleViolationError(
      409,
      "CONTENT_NOT_READY",
      "Music can only be published if status is READY.",
      "R10",
      { currentStatus: music.status }
    );
  }
}

export function validatePublishScene(scene: { status: string }): void {
  if (scene.status !== "READY") {
    throw new RuleViolationError(
      409,
      "CONTENT_NOT_READY",
      "Scene can only be published if status is READY.",
      "R11",
      { currentStatus: scene.status }
    );
  }
}

// ---------------------------------------------------------------------------
// R12: Deletion & Unpublishing Cascades
// Hard deletion blocked if referenced by any Template or Playlist item.
// ---------------------------------------------------------------------------
export function assertCanDeleteContent(usage: {
  templateCount: number;
  playlistItemCount: number;
}): void {
  if (usage.templateCount > 0 || usage.playlistItemCount > 0) {
    throw new RuleViolationError(
      409,
      "CONFLICT_IN_USE",
      "Cannot delete content that is in use by templates or playlists.",
      "R12",
      {
        templateCount: usage.templateCount,
        playlistItemCount: usage.playlistItemCount,
      }
    );
  }
}
