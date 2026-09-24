/* Ramverk – startsidan: hero-vägg, kategorier, topplista, gallerivägg-studion m.m. */
(function () {
  const RV = window.RV;
  const { $, $$, esc, fmt, icon } = RV;
  const P = (id) => RV.byId(id);

  /* ------------------------------------------------------------- hero */
  const HERO = [
    { id: 'valv', x: 14, y: 10, w: 16, frame: 'black', mat: true },
    { id: 'bauhaus-studie-07', x: 14, y: 36.5, w: 16, frame: 'black' },
    { id: 'solnedgang-no-3', x: 33, y: 8, w: 30, frame: 'oak' },
    { id: 'blomstermarknad', x: 66, y: 15, w: 21, frame: 'white', mat: true },
  ];

  function renderHero() {
    const scene = $('[data-hero]');
    const room = $('[data-hero-room]');
    room.innerHTML = RV.roomHTML({
      items: HERO.map((h) => ({ ...h, p: P(h.id) })),
      furniture: [
        { type: 'sofa', x: 20, w: 62 },
        { type: 'plant', x: 87, w: 14 },
      ],
      floor: false,
      hotspots: true,
      cls: 'is-hanging',
    }).replace('class="room ', 'class="hero__wall ');
    // Rummet ärver väggfärgen från scenen; ta bort egen bakgrund.
    const wall = room.firstElementChild;
    wall.style.position = 'absolute';
    wall.style.inset = '0';
    // Möblerna står på scenens golv, oavsett hur hög textkolumnen blir.
    $$('.room__furn', wall).forEach((f) => { f.style.bottom = 'calc(var(--floor-px) - 2px)'; });

    const swatches = $('[data-hero-walls]');
    swatches.innerHTML = RV.walls
      .map((w, i) => `<button class="swatch" type="button" style="--sw:${w.hex}" data-wall="${w.id}" aria-pressed="${i === 0}" aria-label="Väggfärg ${w.name}" title="${w.name}"></button>`)
      .join('');
    swatches.addEventListener('click', (e) => {
      const b = e.target.closest('[data-wall]');
      if (!b) return;
      const w = RV.walls.find((x) => x.id === b.dataset.wall);
      scene.style.setProperty('--wall', w.hex);
      scene.dataset.tone = w.tone;
      $$('[data-wall]', swatches).forEach((s) => s.setAttribute('aria-pressed', s === b));
    });

    // Hotspots – visa ett litet produktkort vid tavlan.
    let card = null;
    const close = () => { card?.remove(); card = null; };
    room.addEventListener('click', (e) => {
      const hs = e.target.closest('[data-hotspot]');
      if (!hs) return;
      e.stopPropagation();
      const same = card && card.dataset.for === hs.dataset.hotspot;
      close();
      if (same) return;
      const p = P(hs.dataset.hotspot);
      card = document.createElement('div');
      card.className = 'hotspot-card';
      card.dataset.for = p.id;
      card.innerHTML = `${RV.frameHTML(p, { frame: 'none' })}<div><strong>${esc(p.title)}</strong><span>${esc(p.artist)} · från ${fmt(RV.fromPrice(p))}</span><a class="link-arrow" href="#produkt-${p.id}">Visa tavlan ${icon('arrow')}</a></div>`;
      const item = hs.closest('.room__item');
      const r = item.getBoundingClientRect();
      const base = scene.getBoundingClientRect();
      let left = r.right - base.left - 40;
      if (left + 260 > base.width) left = r.left - base.left - 250 + 40;
      card.style.left = `${Math.max(8, left)}px`;
      card.style.top = `${r.bottom - base.top - 30}px`;
      scene.appendChild(card);
    });
    document.addEventListener('click', (e) => { if (card && !card.contains(e.target)) close(); });
  }

  /* ------------------------------------------------------- categories */
  function renderCategories() {
    $('[data-cat-grid]').innerHTML = RV.categories
      .map((c) => {
        const items = RV.products.filter((p) => p.cat === c.id).sort((a, b) => b.pop - a.pop);
        const stack = [items[1] || items[0], items[2] || items[0], items[0]];
        return `<a class="cat" href="#kollektion-${c.id}" style="--tint:${c.tint}">
          <div class="cat__stack">${stack.map((p) => RV.frameHTML(p, { frame: 'none' })).join('')}</div>
          <div class="cat__label"><div><p class="cat__name">${esc(c.name)}</p><p class="cat__count">${items.length} motiv</p></div><span class="cat__arrow">${icon('arrow')}</span></div>
        </a>`;
      })
      .join('');
  }

  /* ------------------------------------------------------------- rail */
  function railItems(tab) {
    if (tab === 'nyheter') return RV.newest.map(P);
    if (tab === 'rea') return RV.products.filter((p) => p.sale).concat(RV.products.filter((p) => p.limited));
    return RV.products.slice().sort((a, b) => b.pop - a.pop).slice(0, 10);
  }
  function renderRail(tab = 'mest-salda') {
    const rail = $('[data-rail]');
    rail.innerHTML = railItems(tab).map(RV.cardHTML).join('');
    rail.scrollLeft = 0;
    updateRail();
  }
  function updateRail() {
    const rail = $('[data-rail]');
    const max = rail.scrollWidth - rail.clientWidth;
    const bar = $('[data-rail-progress]');
    const share = rail.clientWidth / rail.scrollWidth;
    bar.style.width = `${Math.min(100, share * 100)}%`;
    bar.style.transform = `translateX(${max > 0 ? (rail.scrollLeft / max) * ((1 - share) / share) * 100 : 0}%)`;
    $('[data-rail-prev]').disabled = rail.scrollLeft < 4;
    $('[data-rail-next]').disabled = rail.scrollLeft > max - 4;
  }
  function bindRail() {
    const rail = $('[data-rail]');
    rail.addEventListener('scroll', () => requestAnimationFrame(updateRail), { passive: true });
    window.addEventListener('resize', updateRail);
    const step = (d) => rail.scrollBy({ left: d * rail.clientWidth * 0.8, behavior: RV.reduced() ? 'auto' : 'smooth' });
    $('[data-rail-prev]').addEventListener('click', () => step(-1));
    $('[data-rail-next]').addEventListener('click', () => step(1));
    const tabs = $('[data-rail-tabs]');
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      $$('[data-tab]', tabs).forEach((t) => t.setAttribute('aria-selected', t === b));
      renderRail(b.dataset.tab);
    });
  }

  /* ----------------------------------------------------------- studio */
  const LAYOUTS = {
    trio: {
      name: 'Trio',
      slots: [
        { x: 22, y: 16, w: 14, size: '30x40' },
        { x: 39, y: 6, w: 22, size: '50x70' },
        { x: 64, y: 16, w: 14, size: '30x40' },
      ],
    },
    rutnat: {
      name: 'Rutnät',
      slots: [
        { x: 33, y: 6, w: 10, size: '21x30' },
        { x: 45, y: 6, w: 10, size: '21x30' },
        { x: 57, y: 6, w: 10, size: '21x30' },
        { x: 33, y: 32, w: 10, size: '21x30' },
        { x: 45, y: 32, w: 10, size: '21x30' },
        { x: 57, y: 32, w: 10, size: '21x30' },
      ],
    },
    salong: {
      name: 'Salong',
      slots: [
        { x: 25, y: 6, w: 12, size: '30x40' },
        { x: 28, y: 35, w: 9, size: '21x30' },
        { x: 40, y: 8, w: 20, size: '50x70' },
        { x: 63, y: 10, w: 9, size: '21x30' },
        { x: 63, y: 32, w: 12, size: '30x40' },
      ],
    },
  };
  const THEMES = {
    lugn: { name: 'Lugn natur', ids: ['fjallvarld', 'skargard', 'horisont', 'bjorkskog', 'manfaser', 'dyner', 'kebnekaise-topografi', 'aura-04'] },
    farg: { name: 'Färgstark', ids: ['solnedgang-no-3', 'utklipp-i-juni', 'bauhaus-studie-07', 'blomstermarknad', 'citrus', 'valv', 'rutor-i-rorelse', 'memphis-86'] },
    svartvitt: { name: 'Svartvitt', ids: ['pulsar', 'op-art-21', 'kebnekaise-topografi', 'bjorkskog', 'form-1968', 'lagom', 'ljus-och-skugga', 'horisont'] },
    kok: { name: 'Kök och fika', ids: ['fika', 'citrus', 'blomstermarknad', 'gronska', 'lagom', 'terrazzo', 'tennisklubben-1974', 'funkis-1932'] },
  };
  const STUDIO_FRAMES = ['black', 'white', 'oak', 'walnut', 'brass'];
  const BUNDLE = 0.2;
  const st = { layout: 'trio', theme: 'lugn', frame: 'oak', wall: 'salvia', picks: [] };

  function pickFor(layout, theme, keep = false) {
    const pool = THEMES[theme].ids;
    const n = LAYOUTS[layout].slots.length;
    if (keep) return pool.slice(0, n);
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  function renderStudioRoom() {
    const room = $('[data-studio-room]');
    const wall = RV.walls.find((w) => w.id === st.wall);
    room.style.setProperty('--wall', wall.hex);
    room.dataset.tone = wall.tone;
    const slots = LAYOUTS[st.layout].slots;
    const inner = RV.roomHTML({
      items: slots.map((s, i) => ({ ...s, p: P(st.picks[i]), frame: st.frame, mat: s.size !== '21x30' })),
      furniture: [{ type: 'sofa', x: 27, b: 10, w: 46 }, { type: 'lamp', x: 76, b: 10, w: 8 }],
    });
    const tmp = document.createElement('div');
    tmp.innerHTML = inner;
    room.innerHTML = tmp.firstElementChild.innerHTML;
    $$('.room__item', room).forEach((el, i) => {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Byt motiv, nu ${P(st.picks[i]).title}`);
    });
  }

  function renderStudioSummary() {
    const slots = LAYOUTS[st.layout].slots;
    const lines = slots.map((s, i) => {
      const p = P(st.picks[i]);
      const mat = s.size !== '21x30';
      return { p, s, mat, price: RV.unitPrice(p, s.size, st.frame, mat) };
    });
    const total = lines.reduce((a, l) => a + l.price, 0);
    const bundle = total * (1 - BUNDLE);
    $('[data-studio-summary]').innerHTML = `
      <ul class="studio__lines">${lines.map((l) => `<li><span>${esc(l.p.title)} · ${RV.size(l.s.size).label}</span><span>${fmt(l.price)}</span></li>`).join('')}</ul>
      <div class="studio__total"><span><span class="studio__save">Paketpris –${BUNDLE * 100} %</span></span><span><s>${fmt(total)}</s><strong>${fmt(bundle)}</strong></span></div>
      <p class="muted" style="font-size:.875rem">${lines.length} tavlor med ${RV.frame(st.frame).name.toLowerCase()}ram${lines.some((l) => l.mat) ? ' och passepartout' : ''}. Upphängningsmall ingår.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn--primary btn--xl" type="button" data-studio-buy style="flex:1">Lägg hela väggen i varukorgen</button>
        <button class="btn btn--ghost btn--xl" type="button" data-studio-shuffle aria-label="Blanda motiv">${icon('shuffle')} Blanda</button>
      </div>`;
  }

  function renderStudioControls() {
    $('[data-studio-layouts]').innerHTML = Object.entries(LAYOUTS)
      .map(([id, l]) => {
        const map = l.slots.map((s) => `<i style="left:${((s.x - 20) / 60) * 100}%;top:${(s.y / 64) * 100}%;width:${(s.w / 60) * 100}%;height:${((s.w * 2.24) / 64) * 100}%"></i>`).join('');
        return `<button class="layout-btn" type="button" data-layout="${id}" aria-pressed="${st.layout === id}"><div class="layout-btn__map">${map}</div><span>${l.name} · ${l.slots.length} st</span></button>`;
      })
      .join('');
    $('[data-studio-themes]').innerHTML = Object.entries(THEMES)
      .map(([id, t]) => `<button class="chip" type="button" data-theme-id="${id}" aria-pressed="${st.theme === id}">${t.name}</button>`)
      .join('');
    $('[data-studio-frames]').innerHTML = STUDIO_FRAMES.map((id) => {
      const f = RV.frame(id);
      return `<button class="swatch${f.material === 'wood' ? ' swatch--wood' : ''}" type="button" style="--sw:${f.color}" data-sframe="${id}" aria-pressed="${st.frame === id}" aria-label="${f.name}" title="${f.name}"></button>`;
    }).join('');
    $('[data-studio-walls]').innerHTML = RV.walls
      .map((w) => `<button class="swatch" type="button" style="--sw:${w.hex}" data-swall="${w.id}" aria-pressed="${st.wall === w.id}" aria-label="${w.name}" title="${w.name}"></button>`)
      .join('');
  }

  function renderStudio({ animate = false } = {}) {
    renderStudioControls();
    renderStudioRoom();
    renderStudioSummary();
    if (animate && !RV.reduced()) $$('[data-studio-room] .room__item').forEach((el, i) => { el.style.animationDelay = `${i * 60}ms`; el.classList.add('swap'); });
  }

  function bindStudio() {
    const section = $('#studio');
    section.addEventListener('click', (e) => {
      const t = e.target;
      const lay = t.closest('[data-layout]');
      const th = t.closest('[data-theme-id]');
      const fr = t.closest('[data-sframe]');
      const wa = t.closest('[data-swall]');
      const item = t.closest('[data-studio-room] .room__item');
      if (lay) { st.layout = lay.dataset.layout; st.picks = pickFor(st.layout, st.theme, true); renderStudio({ animate: true }); }
      else if (th) { st.theme = th.dataset.themeId; st.picks = pickFor(st.layout, st.theme, true); renderStudio({ animate: true }); }
      else if (fr) { st.frame = fr.dataset.sframe; renderStudio(); }
      else if (wa) { st.wall = wa.dataset.swall; renderStudio(); }
      else if (t.closest('[data-studio-shuffle]')) { st.picks = pickFor(st.layout, st.theme); renderStudio({ animate: true }); }
      else if (item) swapSlot(+item.dataset.slot);
      else if (t.closest('[data-studio-buy]')) {
        const slots = LAYOUTS[st.layout].slots;
        RV.addToCart(slots.map((s, i) => ({ id: st.picks[i], size: s.size, frame: st.frame, mat: s.size !== '21x30', disc: BUNDLE })), { open: true });
      }
    });
    section.addEventListener('keydown', (e) => {
      const item = e.target.closest('[data-studio-room] .room__item');
      if (item && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        swapSlot(+item.dataset.slot);
        $(`[data-studio-room] [data-slot="${item.dataset.slot}"]`).focus();
      }
    });
  }
  function swapSlot(i) {
    const pool = THEMES[st.theme].ids;
    const used = new Set(st.picks);
    let idx = pool.indexOf(st.picks[i]);
    for (let k = 0; k < pool.length; k++) {
      idx = (idx + 1) % pool.length;
      if (!used.has(pool[idx])) break;
    }
    st.picks[i] = pool[idx];
    renderStudioRoom();
    renderStudioSummary();
    const el = $(`[data-studio-room] [data-slot="${i}"]`);
    if (el && !RV.reduced()) el.classList.add('swap');
  }

  /* ----------------------------------------------------------- artist */
  function renderArtist() {
    const works = RV.products.filter((p) => p.artist === 'Ines Morell');
    $('[data-artist-count]').textContent = works.length;
    const room = $('[data-artist-room]');
    const tmp = document.createElement('div');
    tmp.innerHTML = RV.roomHTML({
      items: [
        { p: P('skargard'), x: 20, y: 12, w: 27, frame: 'walnut', mat: true },
        { p: P('dyner'), x: 53, y: 12, w: 27, frame: 'walnut', mat: true },
      ],
      furniture: [{ type: 'bench', x: 14, b: 11, w: 72 }],
    });
    room.innerHTML = tmp.firstElementChild.innerHTML;
    room.dataset.tone = 'light';
    $('[data-artist-works]').innerHTML = works
      .map((p) => `<a href="#produkt-${p.id}"><div>${RV.frameHTML(p, { frame: 'none' })}</div><strong>${esc(p.title)}</strong><span>från ${fmt(RV.fromPrice(p))}</span></a>`)
      .join('');
    const counts = {};
    RV.products.forEach((p) => { counts[p.artist] = (counts[p.artist] || 0) + 1; });
    $('[data-artist-index]').innerHTML = `<span class="mono-label">Alla konstnärer</span>${Object.keys(RV.artists)
      .map((a) => `<a class="chip" href="#kollektion-konstnar-${RV.artistSlug(a)}">${esc(a)} <small>${counts[a] || 0}</small></a>`)
      .join('')}`;
  }

  /* ---------------------------------------------------------- reviews */
  function renderReviews() {
    $('[data-reviews]').innerHTML = RV.reviews
      .map((r) => {
        const p = P(r.product);
        return `<article class="review">
          <div class="review__head"><span class="stars" aria-label="${r.stars} av 5 stjärnor">${RV.stars(r.stars)}</span><span class="verified">${icon('check')} Verifierat köp</span></div>
          <p>”${esc(r.text)}”</p>
          <div class="review__foot"><a class="review__thumb" href="#produkt-${p.id}" aria-label="${esc(p.title)}">${RV.frameHTML(p, { frame: 'oak' })}</a><div><strong>${esc(r.name)}, ${esc(r.city)}</strong><span>Köpte ${esc(p.title)}</span></div></div>
        </article>`;
      })
      .join('');
  }

  /* -------------------------------------------------------------- ugc */
  const UGC = [
    { handle: '@hemma.hos.hedda', wall: '#BFC6B2', items: [['fjallvarld', 30, 10, 40, 'oak', true]], furn: [['sideboard', 18, 8, 64], ['plant', 82, 8, 14]] },
    { handle: '@lindqvist.bor', wall: '#35373A', tone: 'dark', items: [['pulsar', 30, 12, 40, 'black', true]], furn: [['sideboard', 16, 8, 68]] },
    { handle: '@kok.i.kungsholmen', wall: '#E7E3DA', items: [['fika', 18, 12, 30, 'white'], ['citrus', 52, 12, 30, 'white']], furn: [['bench', 10, 8, 80]] },
    { handle: '@nordvast.rum', wall: '#B6C1CB', items: [['stjarnkarta', 30, 10, 40, 'brass', true]], furn: [['lamp', 76, 8, 14], ['sideboard', 8, 8, 60]] },
    { handle: '@sara.och.sofa', wall: '#D6BDA8', items: [['blomstermarknad', 18, 10, 30, 'walnut', true], ['valv', 52, 10, 30, 'walnut', true]], furn: [['sofa', 6, 8, 88]] },
  ];
  function renderUgc() {
    $('[data-ugc]').innerHTML = UGC.map((u) => {
      const first = u.items[0][0];
      return `<div class="ugc__tile">${RV.roomHTML({
        wall: u.wall,
        tone: u.tone || 'light',
        items: u.items.map(([id, x, y, w, frame, mat]) => ({ p: P(id), x, y, w, frame, mat })),
        furniture: u.furn.map(([type, x, b, w]) => ({ type, x, b, w })),
        style: '--floor-h:8%',
      })}<span class="ugc__tag">${esc(u.handle)}</span><a class="ugc__shop" href="#produkt-${first}">Handla looken</a></div>`;
    }).join('');
  }

  /* ------------------------------------------------------- newsletter */
  function bindNews() {
    const form = $('[data-news]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const msg = form.querySelector('[data-news-msg]');
      if (!input.value || !input.checkValidity()) {
        msg.textContent = 'Skriv en giltig e-postadress, till exempel namn@epost.se.';
        msg.classList.add('news__msg');
        input.focus();
        return;
      }
      form.querySelector('.news__row').outerHTML = `<p class="news__msg" style="font-size:1.25rem">Tack! Rabattkoden VÄGG15 är din.</p>`;
      msg.textContent = 'I en riktig butik hade koden skickats till din inkorg också.';
    });
  }

  /* --------------------------------------------------------- announce */
  function rotateAnnounce() {
    const msgs = $$('[data-announce] .announce__msg');
    let i = 0;
    if (RV.reduced()) return;
    setInterval(() => {
      msgs[i].classList.remove('is-active');
      i = (i + 1) % msgs.length;
      msgs[i].classList.add('is-active');
    }, 4500);
  }

  RV.initHome = () => {
    $$('[data-stars]').forEach((el) => { el.innerHTML = RV.stars(+el.dataset.stars); });
    renderHero();
    renderCategories();
    renderRail();
    bindRail();
    st.picks = pickFor(st.layout, st.theme, true);
    renderStudio();
    bindStudio();
    renderArtist();
    renderReviews();
    renderUgc();
    bindNews();
    rotateAnnounce();
  };
  RV.refreshHomeCards = () => {
    const sel = $('[data-rail-tabs] [aria-selected="true"]');
    const left = $('[data-rail]').scrollLeft;
    renderRail(sel ? sel.dataset.tab : 'mest-salda');
    $('[data-rail]').scrollLeft = left;
  };
})();
