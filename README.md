# Tushar-Portfolio
Portfolio
Go Live at : https://tushar-portfolio-2sx.pages.dev/

## Redesign — Notebook × Blueprint

Notebook paper for where I'm headed (notes, strategy), blueprint for where I come from (engineering).
Plain static HTML/CSS — no build step.

| Page | File | Status |
|---|---|---|
| Home | `index.html` | live |
| Shop (pre-launch, "announcing soon") | `shop.html` | live |
| Free resources | `free.html` | live |
| Mentorship (waitlist) | `mentorship.html` | live |
| Notes / blog | `notes.html` | live |
| Shop after launch | `shop-launch.html` | draft · unlinked · noindex |
| Product page (QA Visual Notes) | `product.html` | draft · unlinked · noindex |

### Motion
All motion lives in `assets/motion.js` + `assets/motion.css` and works in every modern browser:
- **Smooth scrolling** with [Lenis](https://github.com/darkroomengineering/lenis).
- **Scroll-scrubbed animation** with [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/):
  every animation follows the scroll with easing, so it never jerks.
- **Sheets**: each section is a sheet of paper or blueprint; as the next one slides up, the
  current one sinks back and darkens, so sections hand over instead of just scrolling past.
- **Cinematic scene** on Home: a pinned blueprint sheet that zooms through "THE BUILD LOG".
- **Page curtain**: a blueprint sheet wipes between pages, labelled with the page you're going to.
- **Pencil thread**: an amber line down the notebook margin traces your progress through the page.

Libraries are vendored in `assets/vendor/` (no third-party CDN at runtime).
Visitors with "reduce motion" turned on get the static design with no animation.

### Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

### Before launch
Fill in every `[BRACKETED]` placeholder (mascot name, prices, launch date, refund policy,
project screenshots), wire the email forms to a provider, and add the legal pages linked in the footer.
