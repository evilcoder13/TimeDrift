# TimeDrift Glossary & Translation Specification (Owner: BA)

**Version:** 1.0.0  
**Status:** Approved for P1 Scaffolding & i18n Parity  
**Task Reference:** BA-2  
**Related Documents:** [docs/ba/REQUIREMENTS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/REQUIREMENTS.md), [docs/content/TAGS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/content/TAGS.md), [docs/design/TOKENS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/TOKENS.md), [docs/design/COMPONENTS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/COMPONENTS.md), [docs/design/WIREFRAMES.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/WIREFRAMES.md)

---

## 1. Brand Voice & Translation Philosophy

TimeDrift is an unhurried, serene sanctuary. The language must mirror ink dissolving gently in water:
- **Tone:** Calm, gentle, poetic, contemplative, grounded, and concise. No aggressive marketing hooks, no noisy hype, and strictly **no exclamation marks** (`!`).
- **Second Person:** In Vietnamese, address the user warmly as **"bạn"** (gentle companion), avoiding robotic or cold terminology (e.g. avoid "Người dùng", avoid harsh imperative commands like "Hãy làm ngay").
- **Phrasing:** Natural Vietnamese literary phrasing instead of stiff literal machine translation (e.g. translate *“Drift into stillness”* as *“Trôi vào tĩnh lặng”*, *“Session Complete”* as *“Thời khắc trọn vẹn”* or *“Buổi thư giãn đã hoàn thành”*).
- **Parity & Consistency:** Every key present in English (`en`) has an exact counterpart in Vietnamese (`vi`).

---

## 2. Core Feeling Tags (ADR-008, 12 Canonical Tags)

Shared across music compositions, animated line-art scenes, and curated templates:

| Slug | English (EN) | Tiếng Việt (VI) | Context & Nuance |
|---|---|---|---|
| `calm` | Calm | Bình yên | Quiet equilibrium, soft breath |
| `sleepy` | Sleepy | Buồn ngủ | Drowsy, evening eyelids sinking |
| `focus` | Focus | Tập trung | Flow state, deep undisturbed thought |
| `cozy` | Cozy | Ấm cúng | Warm blanket, sheltered corner |
| `nostalgic` | Nostalgic | Hoài niệm | Distant memories, sepia rain, familiar past |
| `rainy` | Rainy | Mưa | Gentle patter on eaves, water ripples |
| `dreamy` | Dreamy | Mơ màng | Ethereal, floating half-awake |
| `warm` | Warm | Ấm áp | Soft lantern glow, mug of fresh tea |
| `peaceful` | Peaceful | Thanh thản | Inner ease, releasing tension |
| `morning` | Morning | Buổi sáng | First light, birds chirping, gentle dawn |
| `night` | Night | Đêm | Deep charcoal silence, starry ember |
| `nature` | Nature | Thiên nhiên | Rustling leaves, bamboo rock, running brook |

---

## 3. Navigation & App Chrome

| Concept | English (EN) | Tiếng Việt (VI) | Description / Usage |
|---|---|---|---|
| App Tagline | Open, press play, drift. | Mở ra, chạm khẽ, trôi vào an yên. | Primary header / brand essence |
| Home Navigation | Sanctuary / Home | Trang chủ | Main landing view |
| Custom Pair | Custom Pair | Phối ngẫu hứng | Pro feature: combine custom scene & track |
| Journeys (Playlists) | Journeys | Hành trình | Pro feature: multi-track playlists |
| Account / Profile | Sanctuary Pass / Account | Tài khoản | User details and Pro membership status |
| Day Theme | Day (Parchment) | Ban ngày | Sunlit parchment paper palette |
| Night Theme | Night (Charcoal) | Ban đêm | Midnight charcoal and lantern glow |
| Fullscreen Enter | Enter Fullscreen | Toàn màn hình | Expand to full display |
| Fullscreen Exit | Exit Fullscreen | Thu nhỏ màn hình | Restore normal window size |
| Language Switcher | Language | Ngôn ngữ | Locale toggle (EN / VI) |

---

## 4. Player Controls & Receding Chrome

| Action / State | English (EN) | Tiếng Việt (VI) | Description / Usage |
|---|---|---|---|
| Play | Play | Bắt đầu phát | Resume animation and sound |
| Pause | Pause | Tạm dừng | Freeze animation and pause sound |
| Exit Drift | Exit Drift | Rời không gian | Exit player viewport to sanctuary |
| Time Remaining | `{time} remaining` | `Còn lại {time}` | Monospace countdown readout |
| Volume | Sound level | Âm lượng | Master gain control slider |
| Mute | Mute | Tắt âm | Mute audio output |
| Unmute | Unmute | Bật âm | Restore audio output |
| Drift Next (Random) | Next Drift | Không gian ngẫu nhiên | Immediate R6 switch during playback |
| Sound Crossfading | Dissolving... | Âm thanh đang hòa quyện... | 3s playlist audio crossfade state |

---

## 5. End Screen (Rule R2)

When a drift session completes its planned timer, the 10-second fade finishes, line-art pauses, and the End Screen modal emerges softly:

| Element | English (EN) | Tiếng Việt (VI) | Tone & Intent |
|---|---|---|---|
| Header | Session Complete | Thời khắc trọn vẹn | Acknowledgment of finished timer |
| Subtext | May peace remain with you as you return. | Chúc bạn giữ mãi sự an yên khi trở về với nhịp sống. | Grounding, peaceful farewell |
| Replay CTA | Replay Session | Lặp lại buổi này | Replays identical scene & track for same duration |
| Random CTA | Drift to Another Scene | Sang một không gian khác | Picks new random pair according to R6 |
| Home CTA | Return to Sanctuary | Trở về trang chủ | Cleans player state and routes to `/` |

---

## 6. Duration Picker Presets & Sliders (Rules R1, R3)

| Element | English (EN) | Tiếng Việt (VI) | Notes |
|---|---|---|---|
| Sheet Title | Choose Duration | Chọn thời gian thả trôi | Modal / drawer title |
| Free Presets | 3 min, 5 min, 10 min, 15 min | 3 phút, 5 phút, 10 phút, 15 phút | Free allowed range (R1) |
| Standard Default | 15 min (Standard) | 15 phút (Mặc định) | Default preset for quick drift |
| Pro Presets | 30 min, 1 hour, 2 hours, 4 hours, 8 hours, 12 hours | 30 phút, 1 giờ, 2 giờ, 4 giờ, 8 giờ, 12 giờ | Pro extended durations (R3) |
| Free Slider Helper | 3 to 15 minutes | 3 đến 15 phút | Free tier range slider bounds |
| Pro Slider Helper | Up to 12 hours (720 min) | Lên đến 12 giờ (720 phút) | Pro tier range slider bounds |
| Start Button | Begin Drift | Bắt đầu trôi | Primary CTA to initiate run |

---

## 7. Pro Sanctuary Value Proposition & Upsell (Rules R3, R4, R5)

| Message Context | English (EN) | Tiếng Việt (VI) |
|---|---|---|
| Modal Title | Enter the Deeper Sanctuary | Bước vào Không Gian Tĩnh Tại (Pro) |
| Modal Subtitle | Unhurried time for deep work, uninterrupted rest, and personal harmony. | Thêm thời gian cho sự tập trung sâu, giấc ngủ trọn vẹn và sự hòa quyện tự do. |
| Feature 1 (Timers) | Extended Sessions up to 12 Hours | Phiên thả trôi kéo dài đến 12 giờ |
| Feature 1 Desc | Continuous ambient drift without interruption for sleep and long workdays. | Không gian phát êm dịu liên tục không ngắt quãng cho giấc ngủ và ngày làm việc. |
| Feature 2 (Custom) | Custom Line-Art & Melody Pairs | Tự do phối tranh vẽ và giai điệu |
| Feature 2 Desc | Harmonize any artwork with any acoustic track of your choice. | Kết hợp bất kỳ bức tranh nét vẽ nào với khúc nhạc bạn yêu thích. |
| Feature 3 (Playlists) | Curated Journeys & Playlists | Chuỗi hành trình không đứt đoạn |
| Feature 3 Desc | Build multi-scene journeys with smooth 3-second acoustic transitions. | Thiết lập danh sách phát nhiều cảnh với chuyển tiếp âm thanh êm dịu 3 giây. |
| Upgrade CTA | Unlock Pro Sanctuary | Mở khóa Không Gian Pro |
| Dismiss CTA | Stay in Gentle Drift | Tiếp tục phiên thông thường |
| Active Badge | Pro Sanctuary Active | Đang hoạt động Không Gian Pro |
| Expiry Note | Pro active until {date} | Hạn dùng Pro đến {date} |

---

## 8. Business Rule Violations & Error Messages (R1–R12)

| Rule / Condition | Error Code | English (EN) | Tiếng Việt (VI) |
|---|---|---|---|
| R1 Free Timer Cap | `TIMER_LIMIT_FREE` | Free sessions are limited to between 3 and 15 minutes. | Phiên tiêu chuẩn chỉ từ 3 đến 15 phút. Bạn có thể mở khóa Pro để kéo dài hơn. |
| R3 Pro Timer Cap | `TIMER_LIMIT_PRO` | Sessions cannot exceed 720 minutes (12 hours). | Thời lượng phiên tối đa là 720 phút (12 giờ). |
| R4 Pro Gate | `PRO_REQUIRED` | This sanctuary feature is reserved for Pro members. | Tính năng này dành riêng cho thành viên Pro. |
| R5 Playlist Items | `PLAYLIST_ITEM_LIMIT` | A journey can contain between 1 and 50 scenes. | Một hành trình có thể chứa từ 1 đến 50 phân đoạn. |
| R5 Playlist Cap | `PLAYLIST_TOTAL_CAP` | Total journey duration cannot exceed 720 minutes (12 hours). | Tổng thời lượng hành trình không thể vượt quá 720 phút (12 giờ). |
| R6 No Content | `NO_PUBLISHED_CONTENT` | No serene spaces are currently open. Please check back soon. | Hiện chưa có không gian nào được phát hành. Vui lòng quay lại sau ít phút. |
| R8 Publishing | `UNPUBLISHED_DEPENDENCY` | A template can only be published when both its scene and melody are published. | Khung mẫu chỉ có thể phát hành khi cả tranh vẽ và bản nhạc đều đã xuất bản. |
| R10 Music Unready | `MUSIC_NOT_READY` | Melody loop processing is still completing. | Bản nhạc vẫn đang được xử lý vòng lặp. |
| R11 Scene Invalid | `SCENE_INVALID` | Scene animation failed verification checks. | Cảnh vẽ chưa vượt qua bước kiểm định an toàn và hiệu năng. |
| R12 Delete Blocked | `ITEM_IN_USE` | This item cannot be deleted because active templates or journeys depend on it. | Không thể xóa mục này vì đang được dùng trong khung mẫu hoặc hành trình khác. |
| Generic Auth | `UNAUTHORIZED` | Please sign in to access your sanctuary. | Vui lòng đăng nhập để bước vào không gian của bạn. |
| Forbidden | `FORBIDDEN` | Access to this area is restricted. | Bạn không có quyền truy cập khu vực này. |
| Network Loss | `NETWORK_DISCONNECTED` | Connection paused. Stillness remains while reconnecting... | Kết nối gián đoạn. Không gian vẫn được giữ nguyên trong lúc kết nối lại... |
| Service Offline | `SERVICE_UNAVAILABLE` | The sanctuary is momentarily resting. We will be back shortly. | Hệ thống đang tạm nghỉ trong giây lát. Bạn vui lòng quay lại sau nhé. |

---

## 9. Generation Pipeline & Queue States (Admin / Ops)

| Job State | English (EN) | Tiếng Việt (VI) | Description |
|---|---|---|---|
| Queued | Resting in queue... | Đang trong hàng chờ... | Waiting for execution worker |
| Running (Music) | Composing acoustic melody... | Đang sáng tác giai điệu mộc... | MusicGen CPU generation active |
| Running (Scene) | Inking line-art strokes... | Đang phác thảo nét mực... | LLM code synthesis active |
| Validating | Verifying smoothness and safety... | Đang kiểm định chuyển động và an toàn... | Headless browser + typecheck |
| Ready | Ready to publish | Đã sẵn sàng phát hành | Ready for Director review |
| Failed | Creation paused due to an error | Quá trình tạo gặp trở ngại | Validation or generation failed |
| Rebuilding | Re-inking scene... | Đang vẽ lại phân cảnh... | Manual code recompile |

---

## 10. Verification Checklist for Copy
- [x] No exclamation marks (`!`) anywhere in user-facing copy.
- [x] Calm, respectful second-person pronoun "bạn" used consistently across Vietnamese copy.
- [x] Exact key mirror between `messages/en.json` and `messages/vi.json`.
- [x] ICU syntax used for plural forms and variable interpolations (e.g. `{n, plural, one {# minute} other {# minutes}}`).
- [x] Business rules R1–R12 clearly reflected in validation messages and constraints.
