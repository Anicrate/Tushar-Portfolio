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

### Scroll animations
Cinematic, scroll-driven motion uses CSS scroll-driven animations (`animation-timeline`),
supported in Chrome and Edge. Other browsers get the full static design.
Visitors with "reduce motion" turned on see a static page.

### Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

### Before launch
Fill in every `[BRACKETED]` placeholder (mascot name, prices, launch date, refund policy,
project screenshots), wire the email forms to a provider, and add the legal pages linked in the footer.
