# Revised Implementation Plan: Reciter Bio Profiles, Uninterrupted Audio, Custom Controls & List Indexing

Ensure seamless audio streaming that never pauses when searching or navigating, add reciter avatars with biographical information sheets, implement golden ordinal list indexing with total station counters, expand the mobile audio player with custom volume and flexible sleep timers, ensure smooth touch-swipe category scrolling on mobile devices, and update the official website link.

## User Decisions & Architecture Alignment

- **Uninterrupted Audio**: Audio playback is decoupled from search input and category filter state. Re-rendering the station list during search/filtering never triggers player reset or reload.
- **Reciter Avatars & Biography Profiles**:
  - Enrich stations with reciter metadata (full name, country of origin, lifespan/active era, recitation style, and portrait avatar/calligraphy emblem).
  - Add an info button on each station card to open an informative **Reciter Bio Sheet** with their photo, biography, historical significance, and recitation رواية.
- **Station List Indexing**:
  - Golden ordinal badge on every station card (e.g., `#01`, `#02`, `#150`).
  - Total station counter chip above the list (e.g., `150 إذاعة متاحة` / `150 Stations Available`).
- **Full Player with Custom Volume & Sleep Timer**:
  - Full-screen sheet on mobile (and sticky desktop player) with precise volume slider, custom sleep timer (preset chips + custom minute input with live countdown), previous/next station, and loved-station offline cache toggle.
- **Mobile Touch-Swipe Category Navbar**:
  - Momentum touch scrolling with `touch-action: pan-x`, smooth drag gesture support, and centered auto-scroll to the active category.
- **Official Website Link**:
  - Set to `https://quran-radio.apod9875.workers.dev/` in both the Web application and the Android app.

---

## 1. Web Application (`web/`)

### A. Reciter Directory & Metadata (`web/js/reciters.js` & `web/js/app.js`)
- Create curated reciter profiles for major reciters (e.g., Sheikh Abdulbasit Abdussamad, Mohamed Siddiq El-Minshawi, Mahmoud Khalil Al-Husary, Mishary Rashid Alafasy, Maher Al-Muaiqly, Saad Al-Ghamdi, Abdul Rahman Al-Sudais, Saud Al-Shuraim, Abu Bakr Al-Shatri, Yasser Al-Dosari, etc.) with bio details, country, riwayah, and avatar image.
- Match stations to reciters dynamically; display reciter avatar or fallback Islamic calligraphy emblem.
- Clicking the info icon triggers an elegant **Reciter Biography Modal** displaying their portrait, Islamic biography, recorded mushafs, and station metadata.

### B. Uninterrupted Search & List Indexing (`web/js/app.js`)
- Maintain player singleton state (`AudioStreamPlayer`) completely independent of UI filters: typing in search or clicking chips only updates DOM list items via differential matching without stopping or resetting audio.
- Render golden ordinal index (`#01`, `#02`, ...) on each card.
- Add live count chip next to the search bar (e.g., `عرض 24 من 150 إذاعة`).

### C. Expandable Mobile Player & Custom Controls (`web/js/player.js` & `web/index.html`)
- Floating mini-player bar on mobile expands to full-screen player modal with:
  - Custom volume slider (0% to 100%).
  - Sleep timer with custom minute input plus quick chips (15, 30, 45, 60, 90, 120 min).
  - Favorite / Loved offline caching toggle with toast message.
- Update official web link to `https://quran-radio.apod9875.workers.dev/`.

### D. Touch-Swipe Category Bar & CSS Styling (`web/css/styles.css`)
- Configure `.categories-bar` with `-webkit-overflow-scrolling: touch; touch-action: pan-x; overflow-x: auto; scrollbar-width: none;` and JS drag-to-scroll.
- Add styles for the ordinal index badge, reciter avatar thumbnail, reciter info modal, and mobile full-screen player overlay.

---

## 2. Android Application (`app/`)

### A. Reciter Model & Profiles (`app/src/main/java/com/example/data/model/ReciterProfile.kt`)
- Define reciter biographical details and metadata lookup helper.

### B. Station Card with Ordinal Index & Bio Sheet (`app/src/main/java/com/example/ui/components/StationCard.kt`)
- Add golden index badge (`#01`, `#02`, ...) to each card.
- Add reciter avatar and info button triggering a `ReciterBioDialog`.

### C. RadioScreen & State Management (`app/src/main/java/com/example/ui/screens/RadioScreen.kt`)
- Ensure search query updates filter state without touching `playerState`.
- Add station counter chip in the header.
- Update official web URL in `AboutDialog.kt` to `https://quran-radio.apod9875.workers.dev/`.

---

## 3. Verification & Deployment

1. **Audio Continuity**: Verify searching, filtering, and clicking around while audio is playing does not interrupt playback.
2. **Reciter Bio Modal**: Verify clicking reciter info opens the profile sheet with photo and bio.
3. **List Indexing**: Verify station cards display ordinal numbers `#01`, `#02`, etc., and the total counter reflects active filters.
4. **Mobile Touch Swipe**: Verify horizontal touch swipe on categories operates smoothly on mobile.
5. **Compilation**: Run `compile_applet` to confirm flawless build.
