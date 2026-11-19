# Data Model (Owner: Backend)

```prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum Role      { USER ADMIN }
enum GenStatus { QUEUED RUNNING VALIDATING READY FAILED }

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  role      Role      @default(USER)
  isPro     Boolean   @default(false)
  proUntil  DateTime?
  locale    String    @default("en")
  playlists Playlist[]
  createdAt DateTime  @default(now())
  // + Auth.js Account/Session/VerificationToken models
}

model Tag {
  id     String  @id @default(cuid())
  slug   String  @unique
  nameEn String
  nameVi String
  music  Music[]
  scenes Scene[]
  templates Template[]
}

model Music {
  id          String    @id @default(cuid())
  name        String
  type        String            // see AUDIO_GUIDE §3 types
  prompt      String
  seconds     Int               // 30 | 45 | 60
  file        String?           // storage path
  durationSec Float?
  status      GenStatus @default(QUEUED)
  published   Boolean   @default(false)
  tags        Tag[]
  createdAt   DateTime  @default(now())
}

model Scene {
  id          String    @id @default(cuid())
  name        String
  description String
  prompt      String
  sourcePath  String?
  bundlePath  String?
  model       String?           // LLM that produced it
  status      GenStatus @default(QUEUED)
  published   Boolean   @default(false)
  isSeed      Boolean   @default(false)
  tags        Tag[]
  createdAt   DateTime  @default(now())
}

model Template {
  id        String  @id @default(cuid())
  name      String
  musicId   String
  sceneId   String
  music     Music   @relation(fields: [musicId], references: [id], onDelete: Restrict)
  scene     Scene   @relation(fields: [sceneId], references: [id], onDelete: Restrict)
  tags      Tag[]
  published Boolean @default(false)
}

model Playlist {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  name   String
  items  PlaylistItem[]
}

model PlaylistItem {
  id         String  @id @default(cuid())
  playlistId String
  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  order      Int
  templateId String?           // XOR (musicId + sceneId)
  musicId    String?
  sceneId    String?
  minutes    Int               // 3..720
  @@index([playlistId, order])
}

model GenJob {
  id        String    @id @default(cuid())
  kind      String              // "music" | "scene"
  targetId  String
  status    GenStatus @default(QUEUED)
  attempts  Int       @default(0)
  model     String?
  log       String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```
Invariants enforced in `src/server/rules.ts` (cite R-IDs): R5 XOR on PlaylistItem, total ≤ 720, R8 publish cascade, R12 delete restrict.
