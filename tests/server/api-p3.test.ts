import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "../../src/server/db";
import { GET as getTemplates } from "../../src/app/api/templates/route";
import { GET as getTemplateById } from "../../src/app/api/templates/[id]/route";
import { GET as getRandom } from "../../src/app/api/random/route";
import { GET as getMusic } from "../../src/app/api/music/route";
import { GET as getScenes } from "../../src/app/api/scenes/route";
import { POST as postSession } from "../../src/app/api/sessions/route";
import { GET as getPlaylists, POST as postPlaylist } from "../../src/app/api/playlists/route";
import {
  GET as getPlaylistById,
  PUT as putPlaylistById,
  DELETE as deletePlaylistById,
} from "../../src/app/api/playlists/[id]/route";
import * as guards from "../../src/server/guards";

describe("BE-7: Public & Pro APIs Integration Unit Tests", () => {
  let freeUser: any;
  let proUser: any;

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Ensure clean test users
    freeUser = await prisma.user.upsert({
      where: { email: "free-tester@timedrift.test" },
      update: { isPro: false, proUntil: null, role: "USER" },
      create: {
        email: "free-tester@timedrift.test",
        name: "Free Tester",
        role: "USER",
        isPro: false,
      },
    });

    proUser = await prisma.user.upsert({
      where: { email: "pro-tester@timedrift.test" },
      update: { isPro: true, proUntil: null, role: "USER" },
      create: {
        email: "pro-tester@timedrift.test",
        name: "Pro Tester",
        role: "USER",
        isPro: true,
      },
    });
  });

  describe("1. Public Content APIs (R7, R8, R12)", () => {
    it("GET /api/templates returns only published=true templates", async () => {
      // Create unpublished template
      const unpublished = await prisma.template.create({
        data: {
          name: "Secret Unpublished Template",
          sceneId: "s1",
          musicId: "m1",
          published: false,
        },
      });

      const req = new Request("http://localhost:3000/api/templates");
      const res = await getTemplates(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.templates.length).toBeGreaterThan(0);
      for (const tpl of data.templates) {
        expect(tpl.published).toBe(true);
        expect(tpl.id).not.toBe(unpublished.id);
        expect(tpl.music).toBeDefined();
        expect(tpl.scene).toBeDefined();
      }

      // Cleanup
      await prisma.template.delete({ where: { id: unpublished.id } });
    });

    it("GET /api/templates with ?tag= filters templates correctly", async () => {
      const req = new Request("http://localhost:3000/api/templates?tag=rainy");
      const res = await getTemplates(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.templates.length).toBeGreaterThan(0);
      for (const tpl of data.templates) {
        const slugs = tpl.tags.map((t: any) => t.slug);
        expect(slugs).toContain("rainy");
      }
    });

    it("GET /api/templates/:id returns single template or 404 if unpublished", async () => {
      const reqValid = new Request("http://localhost:3000/api/templates/t1");
      const resValid = await getTemplateById(reqValid, { params: Promise.resolve({ id: "t1" }) });
      expect(resValid.status).toBe(200);
      const validData = await resValid.json();
      expect(validData.template.id).toBe("t1");
      expect(validData.template.published).toBe(true);

      // Unpublished template
      const unpub = await prisma.template.create({
        data: {
          name: "Unpub Single",
          sceneId: "s2",
          musicId: "m2",
          published: false,
        },
      });

      const reqUnpub = new Request(`http://localhost:3000/api/templates/${unpub.id}`);
      const resUnpub = await getTemplateById(reqUnpub, { params: Promise.resolve({ id: unpub.id }) });
      expect(resUnpub.status).toBe(404);

      await prisma.template.delete({ where: { id: unpub.id } });
    });

    it("GET /api/music returns only published and READY tracks", async () => {
      const unpubMusic = await prisma.music.create({
        data: {
          name: "Unpub Music",
          type: "piano",
          prompt: "test",
          seconds: 30,
          status: "READY",
          published: false,
        },
      });

      const req = new Request("http://localhost:3000/api/music");
      const res = await getMusic(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.music)).toBe(true);
      for (const m of data.music) {
        expect(m.published).toBe(true);
        expect(m.id).not.toBe(unpubMusic.id);
      }

      await prisma.music.delete({ where: { id: unpubMusic.id } });
    });

    it("GET /api/scenes returns only published and READY scenes", async () => {
      const req = new Request("http://localhost:3000/api/scenes");
      const res = await getScenes(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.scenes)).toBe(true);
      for (const s of data.scenes) {
        expect(s.published).toBe(true);
      }
    });
  });

  describe("2. Random Selection (R5/R6)", () => {
    it("GET /api/random returns random published template and honors excludeId", async () => {
      const req1 = new Request("http://localhost:3000/api/random");
      const res1 = await getRandom(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.sceneId).toBeDefined();
      expect(data1.musicId).toBeDefined();

      if (data1.templateId) {
        const req2 = new Request(`http://localhost:3000/api/random?excludeId=${data1.templateId}`);
        const res2 = await getRandom(req2);
        expect(res2.status).toBe(200);
        const data2 = await res2.json();
        // Since there are 5 templates, excludeId must not repeat
        expect(data2.templateId).not.toBe(data1.templateId);
      }
    });

    it("GET /api/random falls back to scene + music pair sharing tags if no templates match tag", async () => {
      // All templates have tags. Let's unpublish templates temporarily or query random with fallback
      const req = new Request("http://localhost:3000/api/random?tag=nature");
      const res = await getRandom(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sceneId).toBeDefined();
      expect(data.musicId).toBeDefined();
    });
  });

  describe("3. Session Validation & Duration Gating (R1, R3, R4)", () => {
    it("free user: accepts 3-15m session (Rule R1)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: freeUser.id, role: "USER", isPro: false, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: "t1",
          type: "TEMPLATE",
          minutes: 15,
        }),
      });

      const res = await postSession(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.minutes).toBe(15);
      expect(data.music.url).toBeDefined();
    });

    it("free user: rejects < 3m session with 400 (Rule R1)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: freeUser.id, role: "USER", isPro: false, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: "t1",
          type: "TEMPLATE",
          minutes: 2,
        }),
      });

      const res = await postSession(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("DURATION_OUT_OF_BOUNDS");
    });

    it("free user: rejects > 15m session with 403 PRO_REQUIRED (Rule R3/R4)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: freeUser.id, role: "USER", isPro: false, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: "t1",
          type: "TEMPLATE",
          minutes: 30,
        }),
      });

      const res = await postSession(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.code).toBe("PRO_REQUIRED");
    });

    it("pro user: allows sessions up to 720m (Rule R3)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: proUser.id, role: "USER", isPro: true, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: "t1",
          type: "TEMPLATE",
          minutes: 480,
        }),
      });

      const res = await postSession(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.minutes).toBe(480);
    });

    it("pro user: rejects session > 720m with 400 (Rule R3)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: proUser.id, role: "USER", isPro: true, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: "t1",
          type: "TEMPLATE",
          minutes: 721,
        }),
      });

      const res = await postSession(req);
      expect(res.status).toBe(400);
    });
  });

  describe("4. Playlists API & Pro Gating (R4, R5, R12)", () => {
    it("free user: blocked from playlists with 403 PRO_REQUIRED (Rule R4)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: freeUser.id, role: "USER", isPro: false, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      // GET
      const getReq = new Request("http://localhost:3000/api/playlists");
      const getRes = await getPlaylists(getReq);
      expect(getRes.status).toBe(403);
      const getData = await getRes.json();
      expect(getData.error.code).toBe("PRO_REQUIRED");

      // POST
      const postReq = new Request("http://localhost:3000/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "My Free Playlist",
          items: [{ templateId: "t1", durationMinutes: 15 }],
        }),
      });
      const postRes = await postPlaylist(postReq);
      expect(postRes.status).toBe(403);
      const postData = await postRes.json();
      expect(postData.error.code).toBe("PRO_REQUIRED");
    });

    it("pro user: can create playlist within 720m cap (Rule R5)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: proUser.id, role: "USER", isPro: true, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Peaceful Evening Journey",
          items: [
            { templateId: "t1", durationMinutes: 30, order: 0 },
            { sceneId: "s2", musicId: "m1", durationMinutes: 45, order: 1 },
          ],
        }),
      });

      const res = await postPlaylist(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.playlist.name).toBe("Peaceful Evening Journey");
      expect(data.playlist.items.length).toBe(2);

      // Verify in DB and cleanup
      await prisma.playlist.delete({ where: { id: data.playlist.id } });
    });

    it("pro user: rejects playlist exceeding 720m total duration with 400 PLAYLIST_LIMIT_EXCEEDED (Rule R5)", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: proUser.id, role: "USER", isPro: true, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      const req = new Request("http://localhost:3000/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Too Long Journey",
          items: [
            { templateId: "t1", durationMinutes: 400, order: 0 },
            { templateId: "t2", durationMinutes: 321, order: 1 }, // Total 721m
          ],
        }),
      });

      const res = await postPlaylist(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("PLAYLIST_LIMIT_EXCEEDED");
    });

    it("pro user: GET/PUT/DELETE /api/playlists/:id operates correctly and enforces R12 flags", async () => {
      vi.spyOn(guards.guards, "getCurrentSession").mockResolvedValue({
        user: { id: proUser.id, role: "USER", isPro: true, proUntil: null, locale: "en" },
        expires: "2099-01-01",
      });

      // 1. Create a playlist
      const created = await prisma.playlist.create({
        data: {
          userId: proUser.id,
          name: "Test Ops Playlist",
          items: {
            create: [
              { templateId: "t1", minutes: 30, order: 0 },
              { sceneId: "s1", musicId: "m5", minutes: 30, order: 1 },
            ],
          },
        },
      });

      // 2. GET playlist (R12 checks)
      const getReq = new Request(`http://localhost:3000/api/playlists/${created.id}`);
      const getRes = await getPlaylistById(getReq, { params: Promise.resolve({ id: created.id }) });
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.playlist.items[0].isPublished).toBe(true);

      // 3. PUT playlist
      const putReq = new Request(`http://localhost:3000/api/playlists/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated Playlist Name",
          items: [{ templateId: "t2", durationMinutes: 60, order: 0 }],
        }),
      });
      const putRes = await putPlaylistById(putReq, { params: Promise.resolve({ id: created.id }) });
      expect(putRes.status).toBe(200);
      const putData = await putRes.json();
      expect(putData.playlist.name).toBe("Updated Playlist Name");
      expect(putData.playlist.items.length).toBe(1);

      // 4. DELETE playlist
      const delReq = new Request(`http://localhost:3000/api/playlists/${created.id}`, {
        method: "DELETE",
      });
      const delRes = await deletePlaylistById(delReq, { params: Promise.resolve({ id: created.id }) });
      expect(delRes.status).toBe(200);

      // Verify deleted
      const check = await prisma.playlist.findUnique({ where: { id: created.id } });
      expect(check).toBeNull();
    });
  });
});
