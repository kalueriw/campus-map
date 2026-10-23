# BiUH Campus Map

A four-page, static campus map built for the **Web Technologies 2026** personal project.

The site is a schematic map of the campus — the sports field, teaching buildings, training building, student center, dormitories, lake and teacher center — with English and Chinese names.

## Pages

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Introduction, campus overview, preview illustration |
| Map | `map.html` | Interactive SVG map: select a building, search, filter by category |
| Buildings | `buildings.html` | Every place as a card, grouped by category, with a link back to the map |
| About | `about.html` | Why and how the site was built, plus credits |

## Project structure

```
campus-map/
├── index.html
├── map.html
├── buildings.html
├── about.html
├── style.css          one shared stylesheet
├── map.js             map data + interactions (vanilla JavaScript)
├── images/
│   ├── og-image.jpg          1200 × 630, under 100 KB
│   ├── favicon-32.png        32 × 32
│   ├── apple-touch-icon.png  180 × 180
│   └── icon-512.png          source icon, 512 × 512
├── screenshots/
│   ├── desktop-home.png      1920 × 1080 (submission draft)
│   └── mobile-home.png       375 × 812 (submission draft)
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
- **Short description:** A hand-drawn campus map with clickable buildings, search, and English and Chinese names.
- **Long description:** Start from the About page: why you built it, what the four pages do, how the map works, and what you would add next. Aim for 3–5 paragraphs.
- **Status:** Completed

## Built with

- Semantic HTML, one shared CSS file, and vanilla JavaScript.
- An inline **SVG** map drawn by hand with a `viewBox`, so it scales with its container.
- No server, no database, no libraries, no tracking.
- System fonts and CSS custom properties for colour.

## Credits

The map is a schematic drawn from scratch in SVG for this project. No third-party photographs, map tiles or icon sets are used. Campus names were taken from the campus plan and checked on site.

Built for Web Technologies 2026 at BiUH.
