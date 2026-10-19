# Implementation Plan: Modern Polished SVG Icons

Replace all generic emojis with modern, crisp, golden-filled SVG vectors featuring subtle glow effects across the entire web application and PWA.

## User Decisions & Visual Aesthetics

- **Style**: Polished golden filled vectors with subtle glow (`drop-shadow(0 0 6px rgba(226, 186, 85, 0.35))`).
- **Icons to Modernize**:
  - **Playback**: Play, Pause, Loading spinner, Skip Next, Skip Previous.
  - **Actions**: Heart Favorite (filled & outlined states), Share, Info, Sleep Timer (crescent moon), Volume Low/High.
  - **Navigation & Brand**: Install (phone with download arrow), Language (globe with meridians), Search (magnifying glass), Clear (close X).
  - **Modals**: Developer (terminal/code brackets), GitHub (official octocat mark), Web (globe/link), Prayer/Dedication (sacred heart emblem).

---

## 1. Web Assets & SVG System (`web/`)

### A. Centralized SVG Icon Helper (`web/js/icons.js`)
- Provide a clean, reusable helper `getSvgIcon(name, options)` returning crisp, scalable inline SVGs with:
  - `viewBox="0 0 24 24"`, `width`, `height`, `fill="currentColor"`.
  - Polished paths for: `play`, `pause`, `spinner`, `prev`, `next`, `heartOutline`, `heartFilled`, `volumeLow`, `volumeHigh`, `moon`, `share`, `info`, `search`, `close`, `install`, `globe`, `github`, `externalLink`.

### B. HTML Markup Update (`web/index.html`)
- Replace hardcoded emoji buttons in the header, search bar, player controls, and modal headers with the corresponding modern SVG markup.
- Ensure all icon buttons retain accessible `aria-label` and `title` attributes.

### C. Stylesheet Refinements (`web/css/styles.css`)
- Style SVG icons with smooth CSS transitions (`transition: transform 0.2s, filter 0.2s;`).
- Add golden glow class `.svg-gold-glow` (`filter: drop-shadow(0 0 8px rgba(226, 186, 85, 0.4));`).
- Ensure all SVG icons scale responsively without pixelation or layout shifts.

### D. Dynamic Station Cards & Player UI (`web/js/app.js`)
- Update dynamic card rendering to inject SVG icons for the play button, info action, and favorite toggle.
- Update play/pause toggle states to transition between SVG play and SVG pause icons seamlessly.

---

## 2. Verification & Testing

1. **Visual Inspection**: Verify that all icons render cleanly with sharp edges on both high-DPI (Retina) and standard displays.
2. **Interactive States**: Verify that hover, active, and play/pause state changes switch SVG vectors instantly without flickering.
3. **No Audio Disruption**: Confirm that switching icons does not impact audio streaming continuity.
4. **Compilation & Deployment**: Run `compile_applet` to confirm overall workspace integrity.
