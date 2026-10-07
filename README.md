# Sivaram Vangavolu Portfolio

Static portfolio for a data analyst and AI engineer, built with HTML, CSS and vanilla JavaScript. Published at https://sivram04.github.io. The current design ("Lineage") dates from October 2026.

## Local preview

Run from this directory with Docker:

```powershell
docker compose up -d
```

Open http://localhost:8765. Stop it with `docker compose down`.

Without Docker, an existing Python runtime serves the same preview with no packages to install:

```powershell
python preview_server.py --directory D:/Portfolio --bind 127.0.0.1 --port 8765
```

Use only one server on port 8765. It serves the homepage, stylesheet, script and `assets/` only, with caching disabled.

The stylesheet and script URLs in `index.html` carry content-hash query versions. After editing `style.css` or `script.js`, set its `v=` value to the first 12 lowercase characters of the file's SHA-256 hash.

## Files

- `index.html`: all content. Sections in order: header, summary (with education), skills, experience, projects, certificates, leadership, contact.
- `style.css`: tokens, page furniture, sections, charts and states.
- `script.js`: the line graph, chart reveals, the "follow a line" filter, the certificate viewer and the contact form.
- `assets/`: portrait (`Portrait.jpg`), certificate images and the downloadable résumé (`Sivaram_Resume.pdf`).
- `compose.yaml`, `preview_server.py`: local preview only.
- `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`: working notes kept beside the site locally (who it is for, the visual system as built, how to preview). They are not committed.

## How the design works

Four lines run the whole page: Analytics, AI and imaging, Cloud and DevOps, Software. They start in the hero as a map of the career from 2019 to now, turn through two bends and run down the left gutter. Every role, project and certificate is a station on the lines it used.

- An item's lines come from its `data-lanes` attribute (`a`, `i`, `c`, `s`, space separated). A single bullet uses `data-lane`, and `data-gate` turns its marker into a diamond for quality and governance work.
- `script.js` measures those elements and draws the graph into one SVG overlay. Add an item with a `data-lanes` value and its station appears; nothing else needs editing.
- The four dots in the top bar, and "Follow this line" in Skills, dim everything that is not on the chosen line.
- Charts use two forms only. A measured change is a pair of lines from one origin (`.pair`, with each line's length set by `--v` between 0 and 1). A count is one mark each: a run of stations (`.stops`, set by `--n`) or squares in blocks of one hundred (`canvas.units`, set by `data-n`).
- Without JavaScript the page is complete and readable; the lines and chart reveals are an enhancement. With reduced motion, everything is drawn at once.

Content follows the résumé. Keep the scope attached to each number: the Community Dreams figures are from a private beta, and identity fidelity is a share of the achievable ceiling. Charts show only numbers that the text states, with one exception: the Lakshyaa 13-week forecast is demo data and its caption says so.

## Checks

```powershell
node --check script.js
git diff --check
```

In a browser: read the page at desktop and phone widths; scroll from top to bottom and confirm the lines reach the contact heading; try each "follow" dot; open and close a certificate; tab through the page; and check the page with reduced motion turned on.

The contact form posts to a live Formspree endpoint. Do not submit it while testing.

## Publishing

GitHub Pages builds the site from the `main` branch, root folder. Every push to `main` republishes https://sivram04.github.io within a minute or two; local edits change nothing until they are pushed. Pages serves every committed file, so keep working notes and personal files out of the repository.
