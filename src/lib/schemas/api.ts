import { z } from "zod";

/**
 * Zod Schemas for Public & Pro APIs (BE-7 / P3_URD §3.3.2)
 */

export const SessionCreateSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
  type: z.enum(["TEMPLATE", "CUSTOM", "PLAYLIST"]),
  minutes: z.number().int("Duration must be an integer"),
});

export const PlaylistItemSchema = z
  .object({
    id: z.string().optional(),
    templateId: z.string().nullish(),
    sceneId: z.string().nullish(),
    musicId: z.string().nullish(),
    order: z.number().int().min(0).optional(),
    durationMinutes: z.number().int().min(3).max(720).optional(),
    minutes: z.number().int().min(3).max(720).optional(),
  })
  .refine(
    (data) => Boolean(data.durationMinutes ?? data.minutes),
    { message: "Duration between 3 and 720 minutes is required", path: ["durationMinutes"] }
  )
  .refine(
    (data) => {
      const hasTemplate = Boolean(data.templateId);
      const hasCustom = Boolean(data.sceneId && data.musicId);
      return (hasTemplate && !hasCustom) || (!hasTemplate && hasCustom);
    },
    {
      message: "Either templateId or both sceneId and musicId must be provided (mutually exclusive)",
      path: ["templateId"],
    }
  );

export const PlaylistCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100),
    items: z.array(PlaylistItemSchema).min(1, "At least 1 item is required").max(50, "Maximum 50 items allowed"),
  })
  .refine(
    (data) => {
      const total = data.items.reduce((sum, item) => sum + (item.durationMinutes ?? item.minutes ?? 0), 0);
      return total <= 720;
    },
    { message: "Total playlist duration cannot exceed 720 minutes (Rule R5)", path: ["items"] }
  );

export const PlaylistUpdateSchema = PlaylistCreateSchema;
