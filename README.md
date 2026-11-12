# BiUH Campus Map

A five-page, static campus map built for the **Web Technologies 2026** personal project.

The site is a schematic map of the campus — the sports field, teaching buildings, training building, student center, dormitories, lake and Lakeside Restaurant — with English and Chinese names. Click a building and its photograph opens in the column beside the map, with the details below it; small markers open the places inside a building (the canteen, the gyms, the shops along the dormitories).

## Pages

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Introduction, campus overview, preview illustration |
| Map | `map.html` | Interactive SVG map: select a building or a place inside it, see its photo, search, filter by category |
| 3D Campus | `campus.html` | The campus in three dimensions: fly round it, click a building for its photo, jump to teaching, lake, sport or dorms |
| Buildings | `buildings.html` | Every place as a card with its photo, grouped by category, with a link back to the map |
| About | `about.html` | Why and how the site was built, plus credits |
| Not found | `404.html` | Shown by GitHub Pages for any missing address, with a way back |

Every page has an **EN / 中文** switch in the header. English appears in the markup; the Chinese lives in `data-zh` attributes, and `i18n.js` swaps them. The choice is stored in `localStorage` and the first visit follows the browser language. `?lang=zh` or `?lang=en` forces one.

Every page also has a **light / dark** switch. The first visit follows the system setting; a small script in `<head>` applies the theme before the page paints, so a dark page never flashes white. The map drawing keeps its own printed-map colours in both themes.

## Project structure

```
campus-map/
├── index.html
├── map.html
├── buildings.html
├── about.html
├── campus.html        the 3D campus
├── 404.html           "not on the map" page for missing addresses
├── sitemap.xml
├── robots.txt
├── style.css          one shared stylesheet
├── data.js            the places: names, descriptions, photos — the one copy
├── map.js             map interactions (vanilla JavaScript), reads data.js
├── buildings.js       builds the buildings page cards from data.js
├── lightbox.js        the photo dialog, shared by map.html, buildings.html and campus.html
├── scene.css          the 3D page's own stylesheet
├── scene3d/           the 3D campus (ES modules)
│   ├── main.js          renderer, camera flights, labels, the panel
│   ├── data.js          the buildings: names, photos, text
│   ├── buildings.js     the building models (facades drawn on canvas)
│   ├── site.js          the site in 3D: lawn, roads, kerbs, crossings,
│   │                    paving, the track, the courts, the lake, the walls
│   └── props.js         trees, shrubs, hedges, the boundary belt
├── vendor/three/      three.js and OrbitControls, kept local (no CDN)
├── tools/             the measuring scripts that read the master plan
│                      (plan-coords.md holds the result), the photo cropper,
│                      and a headless screenshot helper
├── i18n.js            the English / 中文 switch, shared by every page
├── site.js            the light / dark switch and the header shadow
├── photos/
│   ├── README.md              which photo was taken where
│   ├── *.jpg                  25 originals, 4080 × 3060 or 4096 × 3072, 82.2 MB
│   └── thumbs/*.jpg           640 × 480 previews for the cards and photo column, 1.4 MB
├── images/
│   ├── og-image.jpg          1200 × 630, under 100 KB
│   ├── favicon-32.png        32 × 32
│   ├── apple-touch-icon.png  180 × 180
│   └── icon-512.png          source icon, 512 × 512
├── screenshots/
│   ├── desktop-home.png      1920 × 1080 (submission draft)
│   ├── mobile-home.png       375 × 812 (submission draft)
│   ├── desktop-map.png       1440 × 1000
│   └── mobile-map.png        375 × 812
└── README.md
```

## Run it locally

Option 1: open `index.html` in a browser.

Option 2 (recommended): in VS Code, right-click `index.html` → **Open with Live Server**.

Option 3: from this folder, run `python -m http.server 8000`, then open <http://localhost:8000>.

## Deploy

The site is designed for **GitHub Pages**:

1. Push this folder to its own public GitHub repository.
2. In the repository: **Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save**.
3. The site appears at `https://kalueriw.github.io/campus-map/`.
4. Every push updates the live site.


## Before you hand in

- [ ] Rewrite the About page and the building descriptions in your own words — the course requires AI-assisted text to be edited and owned by you.
- [ ] Take a desktop screenshot at **1920 × 1080** and a mobile screenshot at **375 × 812** using DevTools:
  - Desktop: DevTools → `Ctrl+Shift+P` → **Capture screenshot**
  - Mobile: DevTools → device toolbar `Ctrl+Shift+M` → set 375 × 812 → **Capture screenshot**
- [ ] Upload to the course platform: favicon, cover/OG image, desktop screenshot, mobile screenshot.
- [ ] open both the live URL and the repository on campus Wi-Fi and on mobile data.
- [ ] Test the OG card with <https://opengraph.xyz> after the site is live.
- [ ] Keep committing as the site grows — the Git history is graded.

## Hand-in copy (draft)

Suggested text for the course platform — edit it so the words are yours.

- **Title:** BiUH Campus Map
- **Short description:** A campus map where every building opens its own photo, with English and Chinese names.
- **Long description:** Start from the About page: why you built it, what the four pages do, how the map works, and what you would add next. Aim for 3–5 paragraphs.
- **Status:** Completed

## Built with

- Semantic HTML, one shared CSS file, and vanilla JavaScript.
- One data file (`data.js`) for both the map and the buildings page, so the two can never disagree.
- An inline **SVG** map with a `viewBox`, so it scales with its container.
- No server, no database, no libraries, no tracking.
- System fonts and CSS custom properties for colour, which is also how the dark theme works.
- Page-to-page and theme cross-fades with the View Transitions API; browsers without it simply switch, and nothing moves when the system asks for reduced motion.

## Credits

The map is a schematic drawn from scratch in SVG for this project. No third-party map tiles or icon sets are used. Campus names were taken from the campus plan and checked on site.

The photographs in `photos/` were taken by me around campus in November 2026. They are kept at full size; the pages show the 640 × 480 copies in `photos/thumbs/`, and the original loads only when a photo is opened in the viewer.

Built for Web Technologies 2026 at BiUH.
