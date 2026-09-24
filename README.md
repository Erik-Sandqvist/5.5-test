# Ramverk – posters och konsttryck (demobutik)

En modern, fristående butikssajt för posters. Fokus ligger på startsidan och på
ett genomarbetat utseende i hela flödet: start → kollektion → produkt → varukorg.
Alla motiv, konstnärer, priser och omdömen är påhittade.

## Kom igång

Sajten är ren HTML, CSS och JavaScript utan byggsteg.

```bash
npm run serve        # eller: python3 -m http.server 5173
```

Öppna sedan <http://localhost:5173>. Det går också att öppna `index.html` direkt i webbläsaren.

## Vad som finns

**Startsidan**
- Hero där rubriken sitter som vinyltext på en vägg, med en gallerivägg ovanför en soffa.
  Tavlorna "hängs upp" med en kort gungning när sidan laddas. Besökaren kan byta väggfärg,
  och klickbara punkter på tavlorna visar produkt och pris.
- Kategorikort med solfjäderformade posterhögar som fälls ut vid hover.
- Topplista (mest sålda, nyheter, rea) som horisontell karusell med förloppsindikator.
- **Gallerivägg-studion:** välj upplägg (trio, rutnät, salong), tema, ram och väggfärg,
  klicka på en tavla för att byta motiv och lägg hela väggen i varukorgen med paketpris.
- Månadens konstnär, provtrycksdetalj med skärmärken och CMYK-list, omdömen med
  betygsfördelning, #ramverkhemma-galleri och nyhetsbrev.

**Kollektion** (`#kollektion`, `#kollektion-abstrakt`, `#kollektion-rea` …)
- Filter på färg, pris, rea och limited edition, sortering och val av 2, 3 eller 4 kolumner.
- Produktkort som byter till en rumsbild vid hover, med snabbköp per storlek och önskelista.

**Produktsida** (`#produkt-<id>`)
- Storlek (21 × 30 till 70 × 100 cm), sex ramar, passepartout och antal med livepris.
- Fyra vyer: tavlan i vald ram, en **skalenlig rumsvy** ovanför en 220 cm bred soffa,
  närbild med pappersstruktur och en detalj av ramhörnet.
- Leveransberäkning, limited edition-upplaga, dragspel med tryck- och måttdata,
  "häng den i en trio"-paket, relaterade och senast visade motiv, fast köpknapp på mobil.

**Övergripande:** sticky header med megameny, sök (tryck `/` eller `Ctrl/⌘ + K`),
varukorgslåda med fri frakt-mätare och merförsäljning, notiser, ljust och mörkt tema,
responsiv layout ned till 320 px och stöd för `prefers-reduced-motion`.

## Postermotiven

De 28 motiven i `assets/posters/` är mockade bilder som genereras av
`scripts/generate-posters.mjs`. Skriptet ritar varje motiv som SVG och gör om all text
till vektorbanor, så bilderna ser likadana ut på alla enheter. Kör om det så här:

```bash
npm install
npm run posters
```

Typsnitten hämtas från Google Fonts vid första körningen och cachas i `scripts/.font-cache/`.

## Struktur

```
index.html              Skal, startsida och overlays
assets/css/styles.css   Designsystem och alla komponenter
assets/js/data.js       Produkter, kategorier, storlekar, ramar, omdömen
assets/js/ui.js         Priser, ramar, rum och möbler, kort, varukorg, sök, notiser
assets/js/home.js       Startsidans sektioner och gallerivägg-studion
assets/js/shop.js       Kollektionssidan
assets/js/product.js    Produktsidan
assets/js/main.js       Hash-router och uppstart
assets/posters/*.svg    Genererade postermotiv
scripts/                Generator för motiven
```

Varukorg, önskelista och senast visade sparas i webbläsarens `localStorage`.
Kassan är inte kopplad.
