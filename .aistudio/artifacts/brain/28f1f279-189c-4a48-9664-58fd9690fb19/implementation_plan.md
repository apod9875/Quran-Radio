# Full Responsive Width & Station Card Alignment Plan

Align search bar, category tabs, and radio station cards to full responsive width matching header margins, with auto-fit single-row card layouts and clean text truncation across all mobile screen sizes.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following layout decisions were confirmed during the clarification step:
> - **Width Behavior on Mobile:** Full responsive width matching header margins (`box-sizing: border-box`, matching horizontal padding across viewport).
> - **Station Card Adaptation:** Auto-fit single-row layout where reciter/surah title and badges cleanly truncate (`ellipsis`), keeping playback and action buttons fully visible and accessible without wrapping or overflowing.

---

### 1. Overview & Core Concept

- **What It Delivers**: Precise margin and width alignment between the top sticky navigation header and the main content area (search input, category filters, and live station feed), ensuring zero horizontal scrolling and pixel-perfect responsiveness on phones (such as Honor 600, Galaxy devices, Xiaomi, Pixel, and iPhones).
- **Target Experience**: Clean, modern Islamic audio streaming interface where users on any screen size have uniform edge gutters, easily legible station titles, and instant tap targets.

---

### 2. User Experience & Visual Design

#### Mobile Layout System
```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Logo + Title]                   [10GB] [🌐] [ℹ️]  │ <- Horizontal Margin: 10px / 12px
├─────────────────────────────────────────────────────────────┤
│ Search Input: [ 🔍 ابحث عن قارئ أو إذاعة...             ] │ <- Aligned 100% width
│ Categories:   [ الكل ] [ قراء ] [ روايات ] [ أذكار ] ...    │ <- Seamless edge fade scroll
├─────────────────────────────────────────────────────────────┤
│ Station Card (Single-Row Auto-Fit):                         │
│ [1] [Reciter Pic]  مشاري راشد العفاسي... [💾] [ℹ️] [❤️] [▶] │ <- Title truncates cleanly
│ [2] [Reciter Pic]  عبدالباسط عبدالصمد... [💾] [ℹ️] [❤️] [▶] │ <- No horizontal overflow
├─────────────────────────────────────────────────────────────┤
│ Floating Mini Player: [Title / Live]               [⏸] [✕] │ <- Padded bottom dock
└─────────────────────────────────────────────────────────────┘
```

#### Visual Polish & Spatial Math
- **Consistent Viewport Gutter**: Sync `.app-header` and `.main-wrapper` horizontal margins at breakpoints (16px on desktop, 12px on tablet, 10px on standard mobile, 8px on narrow screens <= 380px).
- **Strict Box Sizing**: Enforce `box-sizing: border-box` and `max-width: 100%` on `.search-box`, `.search-input`, `.categories-container`, `.catalog-column`, `.stations-list`, and `.station-card`.
- **Flex Child Containment**: Apply `min-width: 0` and `flex: 1 1 auto` to `.station-left` and `.station-details`, preventing long reciter names from forcing cards wider than the screen.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Width Unified Margins vs. Fixed Container Width**
  - *Chosen Approach*: Full responsive width matching the header margins.
  - *Rationale*: A fixed container width (like 400px or 480px) feels disconnected on screens with different aspect ratios or zoom levels (Honor 600 default display scaling), whereas matching percentage/margin alignment looks native on every device.
- **Decision 2: Auto-Fit Single Row vs. Two-Row Stacked Cards**
  - *Chosen Approach*: Single-row with CSS text-overflow ellipsis for station names and flex-shrink controls on buttons.
  - *Rationale*: Preserves high information density and natural scanning rhythm without making list items excessively tall.

---

### 4. Technical Architecture & Component Implementation

```
[ viewport / window ]
  │
  ├── .app-header (padding: 8px 10px; box-sizing: border-box)
  │     └── .header-container (width: 100%; max-width: 1400px)
  │
  └── .main-wrapper (padding: 8px 10px; width: 100%; box-sizing: border-box)
        └── .layout-grid (width: 100%; box-sizing: border-box)
              └── .catalog-column (width: 100%; min-width: 0)
                    ├── .search-box (width: 100%; box-sizing: border-box)
                    │     └── .search-input (width: 100%; box-sizing: border-box)
                    ├── .categories-container (width: 100%; overflow: hidden)
                    │     └── .categories-bar (width: 100%; overflow-x: auto)
                    └── #stationsList (width: 100%; display: flex; flex-direction: column)
                          └── .station-card (width: 100%; box-sizing: border-box; overflow: hidden)
                                ├── .station-left (flex: 1 1 auto; min-width: 0)
                                │     ├── .station-index-badge (flex-shrink: 0)
                                │     ├── .reciter-thumb (flex-shrink: 0)
                                │     └── .station-details (flex: 1 1 auto; min-width: 0)
                                │           ├── .station-name (ellipsis; overflow: hidden)
                                │           └── .station-meta (flex-wrap: nowrap or controlled)
                                └── .station-actions (flex-shrink: 0; display: flex)
```

#### Detailed Execution Steps
1. **Normalize Padding & Margin Variables**:
   - Align horizontal padding of `.app-header` and `.main-wrapper` across all CSS media queries (`max-width: 768px`, `max-width: 600px`, `max-width: 420px`).
2. **Constrain Search Box & Input**:
   - Ensure `.search-box` and `.search-input` have `box-sizing: border-box`, `width: 100%`, and no rigid min-width or margin overrides.
3. **Card Container & Flex Flow**:
   - Ensure `.catalog-column` and `.stations-list` have `width: 100%`, `min-width: 0`.
   - Ensure `.station-card` has `width: 100%`, `box-sizing: border-box`, `max-width: 100%`, `overflow: hidden`.
   - Ensure `.station-left` has `min-width: 0; flex: 1 1 auto; overflow: hidden;` and `.station-details` has `overflow: hidden; min-width: 0;`.
   - Ensure `.station-name` has `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`.
   - Scale button sizes on action bar smoothly (`30px - 34px`) so four action buttons comfortably fit alongside the reciter name on narrow screens.
4. **Android Compose Parity**:
   - Ensure Jetpack Compose screen components in `MainActivity.kt` follow the same full-width responsive padding guidelines.
5. **Compilation & Validation**:
   - Run `compile_applet` to ensure full build success.
