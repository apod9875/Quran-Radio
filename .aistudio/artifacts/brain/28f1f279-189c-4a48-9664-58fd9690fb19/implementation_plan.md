# MP3Quran Live Radio Mobile & Adaptive Application

Transform the MP3Quran Live Radio web application ([GitHub: `apod9875/mp3quran-live-radio`](https://github.com/apod9875/mp3quran-live-radio), [Live: `mp3quran-live-radio.apod9875.workers.dev`](https://mp3quran-live-radio.apod9875.workers.dev/)) into a native Android application built with Kotlin and Jetpack Compose. The application delivers continuous live audio streaming across mobile, foldable, tablet, and desktop/Chromebook displays.

## User Review & Critical Decisions

> [!IMPORTANT]
> The application directly connects to the MP3Quran live radio API and stream servers, providing high-fidelity audio playback, reciter search, favorites persistence, sleep timer, bilingual Arabic/English interface, and responsive dual-pane desktop/tablet layouts. Click **Proceed** to build the application.

- **Source Reference**: Faithfully replicates and elevates the features of `apod9875/mp3quran-live-radio` into a high-performance native Android application.
- **Cross-Form-Factor & Desktop/Tablet Support**: Responsive layout using Material 3 Window Size Classes (`Compact`, `Medium`, `Expanded`) delivering a single-pane player sheet on phones and an expansive master-detail dual pane with persistent audio controls on tablets, foldables, and desktop/Chromebook screens.
- **Audio Engine**: Native `android.media.MediaPlayer` integration with buffering management, audio focus, wake lock for continuous background listening, and animated audio waveforms.
- **Persistence**: Room Database to persist user bookmarks/favorites and recently listened radio stations.
- **Bilingual Experience**: Built-in language switcher supporting Arabic (العربية - default) and English (English), localized station names, and RTL support.

---

## 1. Overview & Core Concept

### What It Does
An elegant, continuous live Quran radio streaming application that allows users to listen to live Holy Quran recitations 24/7. Users can:
- Browse 150+ live radio streams by world-renowned reciters (e.g., Mishary Rashid Alafasy, Abdulbasit Abdussamad, Maher Al-Muaiqly, Saud Al-Shuraim, Mohamed Siddiq El-Minshawi, Mahmoud Khalil Al-Husary, Saad Al-Ghamdi, and more).
- Explore specialized thematic stations including Tafseer, Ruqyah Shariah, Fatwas, and Quran recitations with verse-by-verse translations in over 20 languages.
- Real-time instant search by reciter name or station topic.
- Bookmark favorite stations with one tap, stored locally in Room.
- Configurable sleep timer (15, 30, 45, 60, 90, 120 minutes) with auto-stop.
- Bilingual interface (Arabic / English) with instantaneous switching.

### Target Audience & Persona
- Daily listeners looking for Quranic recitation on mobile phones during commutes, reflection, or prayer.
- Desktop, Chromebook, and tablet users who want a distraction-free, dedicated audio client with a dual-pane layout.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Station Catalog & Categorization**:
   - Filter chips: **All (الكل)**, **Popular Reciters (مشاهير القراء)**, **Recitations / Riwayat (الروايات)**, **Tafseer & Fatwa (تفسير وفتاوى)**, **Translations (ترجمات المعاني)**, and **Favorites (المفضلة)**.
   - Search bar with instant real-time filtering.
2. **Instant Live Audio Playback**:
   - Tapping any station card starts the stream immediately with buffer telemetry and animated sound wave visualizer.
   - Active station card highlights with a glowing golden border and playing indicator.
3. **Player Bar & Hero Player Sheet/Panel**:
   - Mobile: Floating bottom player bar with expand action opening the full-screen hero player.
   - Tablet / Desktop: Dual-column layout with station list on the left and full-featured persistent hero player on the right.
4. **Sleep Timer**:
   - Quick selector dialog for 15, 30, 45, 60, 90, or 120 minutes with a live countdown chip and cancel option.
5. **Language Switcher**:
   - Header button to switch between Arabic and English, updating both the UI strings and fetching localized station titles from the API.

### Visual Identity & Theme
- **Theme Concept**: *Sacred Emerald & Warm Gold*
  - Background: Night Jade `#0B1B17` / Deep Emerald `#0E231E`
  - Cards & Containers: Celestial Slate `#142F28` with subtle border `#1E4339`
  - Accents: Warm Gold `#E2B857` / `#D4AF37`, Emerald Mint `#52B788`
  - Text: High contrast `#F0FDF4` and muted gold `#CBD5E1`
- **Animations**: Fluid sinusoidal waveform animations while streaming, smooth expand/collapse transitions, and responsive ripple feedback.

---

## 3. Key Product Decisions & Trade-Offs

- **Native Compose Implementation**:
  - Rebuilding the web application natively in Jetpack Compose ensures seamless background audio streaming, instant startup, zero webview overhead, and true offline capability for favorites and station caching.
- **Adaptive Master-Detail Architecture**:
  - Automatically switches between single-column (smartphones) and two-column dual pane (foldables, tablets, desktop/Chromebook) when window width exceeds 600dp.
- **Zero-Dependency Audio Streaming**:
  - Utilizes Android's rock-solid standard `android.media.MediaPlayer` with `AudioAttributes.CONTENT_TYPE_MUSIC` and `AudioAttributes.USAGE_MEDIA`, eliminating heavy external dependencies while guaranteeing seamless live HTTP/HTTPS streaming.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Jetpack Compose UI Layer                        │
│                                                                        │
│   ┌──────────────────────────────────┐  ┌───────────────────────────┐  │
│   │       RadioStationListPane       │  │      HeroPlayerPane       │  │
│   │   - TopAppBar & Language Toggle  │  │   - Station Details       │  │
│   │   - SearchTextField & Chips      │  │   - Waveform Visualizer   │  │
│   │   - StationCards & Favorites     │  │   - Play / Pause / Buffer │  │
│   │   - MiniPlayerBar (on mobile)    │  │   - Sleep Timer & Volume  │  │
│   └─────────────────┬────────────────┘  └─────────────┬─────────────┘  │
│                     │                                 │                │
│                     └────────────────┬────────────────┘                │
│                                      │                                 │
│                          ┌───────────▼───────────┐                     │
│                          │    RadioViewModel     │                     │
│                          └───────────┬───────────┘                     │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼─────────────────────────────────┐
│                           Core / Domain Layer                          │
│                                                                        │
│   ┌───────────────────────────────┐   ┌─────────────────────────────┐  │
│   │      AudioPlayerManager       │   │       RadioRepository       │  │
│   │   - MediaPlayer live stream   │   │   - Retrofit MP3Quran API   │  │
│   │   - Buffer & Error states     │   │   - Fallback offline data   │  │
│   │   - Sleep timer coroutine     │   │   - Room Database           │  │
│   └───────────────────────────────┘   └──────────────┬──────────────┘  │
└──────────────────────────────────────────────────────┼─────────────────┘
                                                       │
                                    ┌──────────────────┴─────────────────┐
                                    │                                    │
                         ┌──────────▼──────────┐              ┌──────────▼──────────┐
                         │   MP3Quran API v3   │              │    Room Database    │
                         │   (radios?lang=)    │              │   (Favorites/Recs)  │
                         └─────────────────────┘              └─────────────────────┘
```

### Data Entities & Schema
- `RadioStation`: `id: Int`, `name: String`, `url: String`, `category: StationCategory`, `isFavorite: Boolean`
- `FavoriteEntity`: `@Entity(tableName = "favorites")` with `id: Int (PK)`, `name: String`, `url: String`, `addedAt: Long`
- `RadioDto`: JSON mapping for `{ "id": Int, "name": String, "url": String }`
- `PlayerState`: `Idle`, `Buffering(station)`, `Playing(station)`, `Paused(station)`, `Error(station, message)`
- `SleepTimerState`: `Inactive`, `Active(remainingSeconds: Long)`

---

## Verification Plan

### Automated Build & Unit Tests
1. **Compilation Check**: Run `compile_applet` to verify compilation of Kotlin code, Room schemas, and Jetpack Compose layouts.
2. **Local JVM Testing**: Run `gradle :app:testDebugUnitTest` to test Repository parsing, station categorization, search filtering, and state transitions.

### User Acceptance Scenarios
1. **Live Stream Playback**: Select any radio station (e.g., Mishary Alafasy, Abdulbasit) -> Stream buffers and plays audio with active animated waveforms.
2. **Search & Filter**: Search reciter names in Arabic or English -> Results filter in real-time.
3. **Favorites Management**: Tap heart icon on any card -> Station adds to Favorites tab, persisting across app restarts.
4. **Sleep Timer**: Select 15 minutes -> Timer countdown starts, pausing playback when time expires.
5. **Adaptive Tablet/Desktop Display**: On screens wider than 600dp, list and player display side-by-side.
