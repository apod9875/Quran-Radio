# Implementation Plan: Universal Canonical Responsiveness & Supported Devices Matrix

Deliver universal canonical responsiveness across every device form factor (compact phones 320px–480px, phablets & foldables 480px–768px, tablets 768px–1024px, laptops 1024px–1440px, and ultrawide desktops up to 4K), accompanied by a dedicated interactive **Supported Devices & Screen Compatibility Modal** displaying real-time screen detection and multi-device support verification.

## User Decisions & Architectural Alignment

- **Layout Paradigm**: Canonical adaptive layouts:
  - **Phones (<600px)**: Single column, touch-optimized cards, floating bottom player with expandable full-screen sheet.
  - **Foldables & Tablets (600px–960px)**: Multi-column responsive card grid with supporting side dock / navigation rail.
  - **Desktops & Ultrawide (>960px)**: Dual-pane layout (Station list + sticky Hero Player) bounded to `max-width: 1440px` with centered alignment.
- **Supported Devices Modal**: Interactive dialog displaying:
  - Real-time live screen detector (Current viewport resolution, screen density, category, orientation, and touch capability).
  - Comprehensive device support breakdown (Phones, Foldables, Tablets, Laptops, Desktops, In-Car & TV browsers) with 100% verified status badges.

---

## 1. Web Application (`web/`)

### A. Responsive CSS Architecture (`web/css/styles.css`)
- Rebuild media queries with standard Material 3 / CSS breakpoints:
  - `@media (max-width: 480px)`: Ultra-compact phones (safe-area padding, font scaling, 44px touch targets).
  - `@media (min-width: 481px) and (max-width: 768px)`: Phablets & Foldables (2-column card grid when space permits).
  - `@media (min-width: 769px) and (max-width: 1024px)`: Tablets (Adaptive side panel or dual column with comfortable margins).
  - `@media (min-width: 1025px)`: Desktop dual-pane canonical layout.
  - `@media (min-width: 1600px)`: 2K/4K Ultrawide centering with max-width containment.
- Fix any potential overflow bugs (`overflow-x: hidden` on root, flexible `min-width: 0` on flex items, word-break prevention).

### B. Supported Devices Modal Markup (`web/index.html`)
- Add a new "الأجهزة المدعومة" (Supported Devices) button in the header.
- Add the `#devicesModal` component containing:
  - Live screen detection dashboard: `[عرض الشاشة الحالي: 390x844 | النوع: هاتف ذكي | الكثافة: 3x]`.
  - Grid of supported hardware categories with modern SVG icons.

### C. Live Device Detection Engine (`web/js/devices.js` & `web/js/app.js`)
- Dynamically detect viewport dimensions, DPR (Device Pixel Ratio), device type, and orientation on window resize and display in real time.
- Wire up open/close triggers for the Devices modal.

---

## 2. Android Application (`app/`)

### A. Compose WindowSizeClass & Canonical Layout (`app/src/main/java/com/example/ui/screens/RadioScreen.kt`)
- Use `BoxWithConstraints` to dynamically adapt between Compact (<600dp), Medium (600–840dp), and Expanded (>840dp) screen widths.
- Ensure proper `WindowInsets.safeDrawing` and navigation bar padding.
- Add supported devices matrix dialog in Android as well.

---

## 3. Verification & Testing

1. **Resolution Testing**: Test across 320px (iPhone SE), 375px (iPhone mini), 412px (Pixel/Galaxy), 768px (iPad portrait), 1024px (iPad landscape), 1280px (MacBook), and 1920px (Full HD).
2. **Live Matrix Verification**: Verify that the Devices Modal updates its live screen resolution and category immediately when resizing the window.
3. **No Audio Disruption**: Confirm audio plays smoothly during resize, orientation change, or opening the devices modal.
4. **Compilation**: Run `compile_applet` to confirm flawless build.
