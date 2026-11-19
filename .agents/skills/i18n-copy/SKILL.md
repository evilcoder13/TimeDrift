---
name: i18n-copy
description: Add or edit user-facing text in TimeDrift with next-intl, keeping EN and VI in sync and on-tone. Use whenever UI strings, error messages or content names are added.
---
# i18n Copy

## Files
`messages/en.json`, `messages/vi.json`. Keys are namespaced by screen: `home.*`, `player.*`, `duration.*`, `end.*`, `custom.*`, `playlists.*`, `account.*`, `upsell.*`, `admin.*`, `errors.<CODE>`.

## Steps
1. Add the key to **both** files in the same commit. Use ICU plurals for counts: `"{n, plural, one {# minute} other {# minutes}}"`.
2. In components use `const t = useTranslations('player')`. Never put string literals in JSX.
3. Run the key-parity check: `npm run i18n:check` (fails if a key is missing from either file).

## Tone
Calm, short, second person. No exclamation marks. VI uses "bạn" and natural phrasing, not word-for-word translation.
| EN | VI |
|---|---|
| Start | Bắt đầu |
| Time's up. Take a breath. | Hết giờ rồi. Hít thở nhẹ nhé. |
| Replay | Phát lại |
| Unlock longer sessions with Pro | Mở khoá phiên dài hơn với Pro |
Content names (tags, scenes, music) are stored in the DB as `nameEn` and `nameVi`, not in the messages files.
