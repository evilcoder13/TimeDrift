import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Canonical 12 tags from docs/content/TAGS.md
const TAGS = [
  { slug: "calm", nameEn: "Calm", nameVi: "Bình yên" },
  { slug: "sleepy", nameEn: "Sleepy", nameVi: "Buồn ngủ" },
  { slug: "focus", nameEn: "Focus", nameVi: "Tập trung" },
  { slug: "cozy", nameEn: "Cozy", nameVi: "Ấm cúng" },
  { slug: "nostalgic", nameEn: "Nostalgic", nameVi: "Hoài niệm" },
  { slug: "rainy", nameEn: "Rainy", nameVi: "Mưa" },
  { slug: "dreamy", nameEn: "Dreamy", nameVi: "Mơ màng" },
  { slug: "warm", nameEn: "Warm", nameVi: "Ấm áp" },
  { slug: "peaceful", nameEn: "Peaceful", nameVi: "Thanh thản" },
  { slug: "morning", nameEn: "Morning", nameVi: "Buổi sáng" },
  { slug: "night", nameEn: "Night", nameVi: "Đêm" },
  { slug: "nature", nameEn: "Nature", nameVi: "Thiên nhiên" },
];

// Seed scenes S1–S5 from docs/content/SEED_CONTENT.md and docs/ba/P1_URD.md
const SCENES = [
  {
    id: "s1",
    name: "Lantern Village",
    description: "Hillside village; villagers stroll, lanterns glow at night, wind chime sways",
    prompt: "A quiet hillside village at dusk with warm paper lanterns lighting up slowly.",
    sourcePath: "seed/scenes/s1.ts",
    bundlePath: "storage/scenes/s1.bundle.js",
    model: "handcrafted",
    status: "READY",
    published: true,
    isSeed: true,
    tags: ["nostalgic", "night", "warm"],
  },
  {
    id: "s2",
    name: "Rainy Street",
    description: "Umbrella walker crosses slowly; rain streaks, puddle ripples",
    prompt: "Delicate rain streaks falling over pavement as an umbrella walker crosses peacefully.",
    sourcePath: "seed/scenes/s2.ts",
    bundlePath: "storage/scenes/s2.bundle.js",
    model: "handcrafted",
    status: "READY",
    published: true,
    isSeed: true,
    tags: ["rainy", "calm", "nostalgic"],
  },
  {
    id: "s3",
    name: "Riverside Morning",
    description: "River, boat drifting, fisherman, birds",
    prompt: "A tranquil river at dawn with a gently drifting sampan boat and birds in peaceful arcs.",
    sourcePath: "seed/scenes/s3.ts",
    bundlePath: "storage/scenes/s3.bundle.js",
    model: "handcrafted",
    status: "READY",
    published: true,
    isSeed: true,
    tags: ["morning", "peaceful", "nature"],
  },
  {
    id: "s4",
    name: "Window Desk",
    description: "Desk with tea steam, cat on sill, sky changes outside",
    prompt: "An open desk windowsill with rising tea steam and a resting cat breathing peacefully.",
    sourcePath: "seed/scenes/s4.ts",
    bundlePath: "storage/scenes/s4.bundle.js",
    model: "handcrafted",
    status: "READY",
    published: true,
    isSeed: true,
    tags: ["focus", "cozy", "calm"],
  },
  {
    id: "s5",
    name: "Starry Hill",
    description: "Hill, single tree, fireflies, slow stars",
    prompt: "A quiet hill with a swaying pine tree, drifting fireflies, and slow breathing stars.",
    sourcePath: "seed/scenes/s5.ts",
    bundlePath: "storage/scenes/s5.bundle.js",
    model: "handcrafted",
    status: "READY",
    published: true,
    isSeed: true,
    tags: ["sleepy", "night", "dreamy"],
  },
];

// Seed music M1–M5 from docs/content/SEED_CONTENT.md and seed/audio-manifest.json
const MUSIC = [
  {
    id: "m1",
    name: "Rainy Window",
    type: "piano",
    prompt: "soft solo piano, gentle rain mood, 65 bpm, warm reverb, sparse melody, no vocals, loopable, soft dynamics",
    seconds: 45,
    durationSec: 30.0,
    file: "storage/audio/m1.ogg",
    status: "READY",
    published: true,
    tags: ["rainy", "calm", "nostalgic"],
  },
  {
    id: "m2",
    name: "Paper Lanterns",
    type: "ambient",
    prompt: "ambient pad, slow evolving synth, distant chimes, 55 bpm, airy, no drums, no vocals, loopable",
    seconds: 60,
    durationSec: 30.0,
    file: "storage/audio/m2.ogg",
    status: "READY",
    published: true,
    tags: ["night", "sleepy", "dreamy"],
  },
  {
    id: "m3",
    name: "Morning Tea",
    type: "acoustic",
    prompt: "fingerpicked acoustic guitar, light shaker, 75 bpm, warm, cozy, peaceful, no vocals, loopable",
    seconds: 45,
    durationSec: 30.0,
    file: "storage/audio/m3.ogg",
    status: "READY",
    published: true,
    tags: ["morning", "peaceful", "cozy", "warm"],
  },
  {
    id: "m4",
    name: "Study Room",
    type: "lofi",
    prompt: "lofi hip hop, mellow rhodes, soft vinyl crackle, muted kick, 72 bpm, no vocals, loopable",
    seconds: 60,
    durationSec: 30.0,
    file: "storage/audio/m4.ogg",
    status: "READY",
    published: true,
    tags: ["focus", "cozy", "calm"],
  },
  {
    id: "m5",
    name: "Village Dusk",
    type: "strings",
    prompt: "slow string quartet, pastoral, 60 bpm, warm legato, no percussion, no vocals, loopable",
    seconds: 45,
    durationSec: 30.0,
    file: "storage/audio/m5.ogg",
    status: "READY",
    published: true,
    tags: ["nostalgic", "warm", "night"],
  },
];

// Seed templates T1–T5 from docs/content/SEED_CONTENT.md and docs/ba/P1_URD.md
// Sharing >= 2 tags
const TEMPLATES = [
  {
    id: "t1",
    name: "Lantern Evening",
    sceneId: "s1",
    musicId: "m5",
    published: true,
    tags: ["nostalgic", "warm"],
  },
  {
    id: "t2",
    name: "Rain on the Street",
    sceneId: "s2",
    musicId: "m1",
    published: true,
    tags: ["rainy", "calm", "nostalgic"],
  },
  {
    id: "t3",
    name: "River Dawn",
    sceneId: "s3",
    musicId: "m3",
    published: true,
    tags: ["morning", "peaceful"],
  },
  {
    id: "t4",
    name: "Deep Focus",
    sceneId: "s4",
    musicId: "m4",
    published: true,
    tags: ["focus", "cozy", "calm"],
  },
  {
    id: "t5",
    name: "Under the Stars",
    sceneId: "s5",
    musicId: "m2",
    published: true,
    tags: ["night", "sleepy", "dreamy"],
  },
];

export async function seed() {
  console.log("🌱 Starting TimeDrift canonical seed...");

  // 1. Seed Tags
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {
        nameEn: tag.nameEn,
        nameVi: tag.nameVi,
      },
      create: {
        slug: tag.slug,
        nameEn: tag.nameEn,
        nameVi: tag.nameVi,
      },
    });
  }
  console.log(`✓ Seeded ${TAGS.length} canonical tags`);

  // 2. Seed Scenes
  for (const scene of SCENES) {
    const { tags, ...sceneData } = scene;
    await prisma.scene.upsert({
      where: { id: scene.id },
      update: {
        ...sceneData,
        tags: {
          set: tags.map((slug) => ({ slug })),
        },
      },
      create: {
        ...sceneData,
        tags: {
          connect: tags.map((slug) => ({ slug })),
        },
      },
    });
  }
  console.log(`✓ Seeded ${SCENES.length} canonical scenes (S1–S5)`);

  // 3. Seed Music
  for (const music of MUSIC) {
    const { tags, ...musicData } = music;
    await prisma.music.upsert({
      where: { id: music.id },
      update: {
        ...musicData,
        tags: {
          set: tags.map((slug) => ({ slug })),
        },
      },
      create: {
        ...musicData,
        tags: {
          connect: tags.map((slug) => ({ slug })),
        },
      },
    });
  }
  console.log(`✓ Seeded ${MUSIC.length} canonical music tracks (M1–M5)`);

  // 4. Seed Templates
  for (const tpl of TEMPLATES) {
    const { tags, ...tplData } = tpl;
    await prisma.template.upsert({
      where: { id: tpl.id },
      update: {
        ...tplData,
        tags: {
          set: tags.map((slug) => ({ slug })),
        },
      },
      create: {
        ...tplData,
        tags: {
          connect: tags.map((slug) => ({ slug })),
        },
      },
    });
  }
  console.log(`✓ Seeded ${TEMPLATES.length} canonical templates (T1–T5)`);

  console.log("✅ Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
