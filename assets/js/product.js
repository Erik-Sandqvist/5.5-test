/* Ramverk – produktsidan: storlek, ram, passepartout, skalenlig rumsvy. */
(function () {
  const RV = window.RV;
  const { $, $$, esc, fmt, icon } = RV;

  const st = { id: null, size: '50x70', frame: 'black', mat: false, qty: 1, view: 'poster' };
  const VIEWS = [
    ['poster', 'Tavlan'],
    ['room', 'I rummet'],
    ['detail', 'Närbild'],
    ['corner', 'Ramen'],
  ];
  // Rumsvyn är skalenlig: utsnittet av väggen är 290 cm brett, soffan 220 cm.
  // Höjden följer scenens bildformat (4:4,6).
  const WALL_W = 290;
  const WALL_H = WALL_W * 1.15;
  const FLOOR = 7;

  const p = () => RV.byId(st.id);

  function roomItem() {
    const s = RV.size(st.size);
    const f = RV.frame(st.frame);
    const pad = f.mult ? 4 : 0;
    const w = ((s.w + pad) / WALL_W) * 100;
    const h = ((s.h * 1.02 + pad) / WALL_H) * 100;
    const sofaTop = 100 - FLOOR - (85 / WALL_H) * 100;
    const y = sofaTop - 8 - h;
    return { x: 50 - w / 2, y, w };
  }

  function stageHTML(view) {
    const prod = p();
    const f = st.frame;
    if (view === 'room') {
      const it = roomItem();
      const s = RV.size(st.size);
      return `<div class="stage__view stage__room">${RV.roomHTML({
        wall: prod.wall,
        items: [{ p: prod, ...it, frame: f, mat: st.mat, eager: true }],
        furniture: [
          { type: 'sofa', x: 50 - (220 / WALL_W) * 50, b: FLOOR - 0.6, w: (220 / WALL_W) * 100 },
          { type: 'plant', x: 87, b: FLOOR - 0.6, w: 12 },
        ],
        style: `--floor-h:${FLOOR}%`,
      })}<p class="scale-note">${icon('check')} Skalenligt: ${s.label} ovanför en soffa på 220 cm</p></div>`;
    }
    if (view === 'detail') {
      return `<div class="stage__view stage__detail" data-zoom><img src="${RV.src(prod.id)}" alt="Närbild av ${esc(prod.title)}"><span class="stage__tag">250 g/m² · matt</span></div>`;
    }
    if (view === 'corner') {
      const fr = st.frame === 'none' ? 'oak' : st.frame;
      return `<div class="stage__view stage__corner">${RV.frameHTML(prod, { frame: fr, mat: st.mat || st.frame === 'none', eager: true })}<span class="stage__tag">${RV.frame(fr).name}</span></div>`;
    }
    const widths = { '21x30': 42, '30x40': 50, '50x70': 58, '70x100': 64 };
    return `<div class="stage__view stage__studio"><div style="width:${widths[st.size]}%;transition:width .5s">${RV.frameHTML(prod, { frame: f, mat: st.mat, eager: true, alt: `${prod.title} av ${prod.artist}` })}</div></div>`;
  }

  function thumbHTML([id, label]) {
    const prod = p();
    let inner = '';
    if (id === 'poster') inner = RV.frameHTML(prod, { frame: st.frame, mat: st.mat });
    if (id === 'room') inner = RV.roomHTML({ wall: prod.wall, items: [{ p: prod, x: 36, y: 12, w: 28, frame: st.frame }], furniture: [{ type: 'sofa', x: 10, b: 8, w: 80 }], style: '--floor-h:10%' });
    if (id === 'detail') inner = `<img src="${RV.src(prod.id)}" alt="" style="position:absolute;width:260%;max-width:none;left:-80%;top:-40%">`;
    if (id === 'corner') inner = `<div style="position:absolute;width:300%;left:18%;top:14%">${RV.frameHTML(prod, { frame: st.frame === 'none' ? 'oak' : st.frame, mat: true })}</div>`;
    return `<button class="thumb" type="button" data-view="${id}" aria-pressed="${st.view === id}" aria-label="Visa ${label.toLowerCase()}">${inner}<span class="thumb__label">${label}</span></button>`;
  }

  function priceNow() {
    return RV.unitPrice(p(), st.size, st.frame, st.mat) * st.qty;
  }
  function priceOrig() {
    return RV.unitPrice(p(), st.size, st.frame, st.mat, { original: true }) * st.qty;
  }

  function delivery() {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(15, 0, 0, 0);
    const weekday = now.getDay() > 0 && now.getDay() < 6;
    const addBusiness = (d, n) => {
      const x = new Date(d);
      while (n > 0) {
        x.setDate(x.getDate() + 1);
        if (x.getDay() > 0 && x.getDay() < 6) n--;
      }
      return x;
    };
    const shipsToday = weekday && now < cutoff;
    const from = addBusiness(now, shipsToday ? 1 : 2);
    const to = addBusiness(now, shipsToday ? 3 : 4);
    const df = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    const mins = Math.max(0, Math.round((cutoff - now) / 60000));
    const lead = shipsToday ? `Beställ inom <strong>${Math.floor(mins / 60)} h ${mins % 60} min</strong> så skickas den i dag.` : 'Skickas nästa vardag.';
    const day = (d) => df.format(d).replace(/\.$/, '');
    return `${lead} Levereras ${day(from)} – ${day(to)}.`;
  }

  function sizesHTML() {
    const prod = p();
    return RV.sizes
      .map((s) => {
        const rw = Math.round(s.w * 0.36), rh = Math.round(s.h * 0.36);
        return `<div class="size-opt"><input type="radio" name="pdp-size" id="size-${s.id}" value="${s.id}"${st.size === s.id ? ' checked' : ''}>
        <label for="size-${s.id}"><span class="size-pics"><span class="size-opt__rect" style="--rw:${rw};--rh:${rh}"></span></span><strong>${s.w} × ${s.h}</strong><small>${fmt(RV.printPrice(prod, s.id))}</small></label></div>`;
      })
      .join('');
  }

  function framesHTML() {
    return RV.frames
      .map((f) => {
        const add = f.mult ? `+${fmt(RV.framePrice(st.size, f.id))}` : '';
        return `<div class="frame-opt"><label title="${f.name} ${add}"><input type="radio" name="pdp-frame" id="frame-${f.id}" value="${f.id}"${st.frame === f.id ? ' checked' : ''}><span class="swatch${f.material === 'wood' ? ' swatch--wood' : ''}${f.id === 'none' ? ' swatch--none' : ''}" style="--sw:${f.color || 'transparent'}" aria-hidden="true"></span><span class="sr-only">${f.name} ${add}</span></label></div>`;
      })
      .join('');
  }

  function render() {
    const prod = p();
    const cat = RV.cat(prod.cat);
    const artist = RV.artists[prod.artist];
    const sameCat = RV.products.filter((x) => x.cat === prod.cat && x.id !== prod.id).sort((a, b) => b.pop - a.pop);
    const setItems = [sameCat[0], prod, sameCat[1] || RV.products.find((x) => x.id !== prod.id)];
    const related = sameCat.concat(RV.products.filter((x) => x.cat !== prod.cat && x.color === prod.color)).slice(0, 8);
    const recent = RV.store.get('recent', []).filter((id) => id !== prod.id && RV.byId(id)).slice(0, 6);
    const wished = RV.wish.has(prod.id);

    $('#view-product').innerHTML = `
      <div class="container">
        <ol class="crumbs" style="padding-top:20px"><li><a href="#">Start</a></li><li><a href="#kollektion">Posters</a></li><li><a href="#kollektion-${cat.id}">${esc(cat.name)}</a></li><li aria-current="page">${esc(prod.title)}</li></ol>
        <div class="pdp">
          <div class="pdp__media">
            <div class="thumbs" role="group" aria-label="Bildvisning" data-thumbs>${VIEWS.map(thumbHTML).join('')}</div>
            <div class="stage crop" data-stage>${stageHTML(st.view)}</div>
          </div>
          <div class="pdp__info">
            <div class="pdp__head">
              <p class="eyebrow">${esc(cat.name)}${prod.limited ? ' · Limited edition' : ''}</p>
              <h1 class="display pdp__title">${esc(prod.title)}</h1>
              <p class="pdp__artist">av <a href="#kollektion-konstnar-${RV.artistSlug(prod.artist)}">${esc(prod.artist)}</a> · ${esc(artist.city)}</p>
              <a class="pdp__rating" href="#omdomen-pdp"><span class="stars" aria-hidden="true">${RV.stars(prod.rating)}</span> <strong>${String(prod.rating).replace('.', ',')}</strong> <span>(${prod.reviews} omdömen)</span></a>
            </div>
            <div class="pdp__price" data-price></div>
            <p class="pdp__klarna" data-split></p>
            ${prod.limited ? `<div class="edition"><div style="display:flex;justify-content:space-between"><strong>Upplaga ${prod.limited.edition} ex · numrerad och signerad</strong><span class="muted">${prod.limited.left} kvar</span></div><div class="edition__bar"><i style="width:${100 - (prod.limited.left / prod.limited.edition) * 100}%"></i></div></div>` : ''}
            <fieldset class="opt"><legend>Storlek <span data-size-label>${RV.size(st.size).label}</span></legend><div class="sizes">${sizesHTML()}</div></fieldset>
            <fieldset class="opt"><legend>Ram <span data-frame-label>${RV.frame(st.frame).name}</span></legend><div class="frames-opts" data-frames>${framesHTML()}</div></fieldset>
            <label class="toggle-row${st.frame === 'none' ? ' is-disabled' : ''}" data-mat-row for="pdp-mat">
              <div><strong>Passepartout</strong><small>Vit kartong mellan tryck och ram · +${fmt(RV.MAT_PRICE)}</small></div>
              <span class="switch"><input type="checkbox" id="pdp-mat" data-mat${st.mat ? ' checked' : ''}${st.frame === 'none' ? ' disabled' : ''}><i></i></span>
            </label>
            <div class="buy" data-buy>
              <div class="qty qty--lg"><button type="button" data-pqty="-1" aria-label="Minska antal">${icon('minus')}</button><output data-qty-out aria-live="polite">${st.qty}</output><button type="button" data-pqty="1" aria-label="Öka antal">${icon('plus')}</button></div>
              <button class="btn btn--primary btn--xl" type="button" data-add></button>
              <button class="wish-lg" type="button" data-wish="${prod.id}" aria-pressed="${wished}" aria-label="Spara i önskelistan">${icon('heart')}</button>
            </div>
            <p class="stock"><i></i><span>${delivery()}</span></p>
            <ul class="perks">
              <li>${icon('truck')}<span><strong>Fri frakt</strong> över ${fmt(RV.FREE_SHIPPING)}</span></li>
              <li>${icon('return')}<span><strong>30 dagar</strong> öppet köp</span></li>
              <li>${icon('leaf')}<span><strong>Tryckt i Borås</strong> på FSC-papper</span></li>
            </ul>
            <div class="acc">
              <details open><summary>Om motivet ${icon('plus')}</summary><div class="acc__body"><p>${esc(prod.desc)}</p><p class="muted">${esc(artist.bio)}</p></div></details>
              <details><summary>Tryck och papper ${icon('plus')}</summary><div class="acc__body"><table><tbody>
                <tr><th scope="row">Papper</th><td>250 g/m² matt fine art, syrafritt</td></tr>
                <tr><th scope="row">Tryck</th><td>Giclée, 12 pigmentfärger</td></tr>
                <tr><th scope="row">Kant</th><td>5 mm vit marginal runt motivet</td></tr>
                <tr><th scope="row">Artikelnr</th><td>RV-${prod.id.slice(0, 3).toUpperCase()}-${String(RV.products.indexOf(prod) + 101)}</td></tr>
              </tbody></table></div></details>
              <details><summary>Mått med ram ${icon('plus')}</summary><div class="acc__body"><table><thead><tr><th>Tryck</th><th>Med ram</th><th>Med passepartout</th></tr></thead><tbody>
                ${RV.sizes.map((s) => `<tr><td>${s.label}</td><td>${s.w + 4} × ${s.h + 4} cm</td><td>${s.w + 14} × ${s.h + 14} cm</td></tr>`).join('')}
              </tbody></table><p class="muted" style="font-size:.875rem">Ramdjup 2,5 cm. Upphängningsbeslag och akrylglas ingår.</p></div></details>
              <details><summary>Frakt och retur ${icon('plus')}</summary><div class="acc__body"><p>Vi skickar inom ett dygn från tryckeriet. Frakt kostar 59 kr och är fri över ${fmt(RV.FREE_SHIPPING)}. Oinramade tryck kan returneras fritt inom 30 dagar.</p></div></details>
            </div>
          </div>
        </div>

        <section class="section" style="padding-top:clamp(24px,3vw,48px)" aria-labelledby="set-title">
          <div class="set">
            <div class="room set__room" data-set-room></div>
            <div>
              <p class="eyebrow">Komplettera väggen</p>
              <h2 class="h2" id="set-title">Häng den i en trio</h2>
              <ul class="set__list">${setItems.map((x) => `<li><span>${RV.frameHTML(x, { frame: 'black' })}</span><span>${esc(x.title)} · ${x.id === prod.id ? '50 × 70' : '30 × 40'}</span><span>${fmt(RV.unitPrice(x, x.id === prod.id ? '50x70' : '30x40', 'black', false))}</span></li>`).join('')}</ul>
              <button class="btn btn--primary btn--xl" type="button" data-buy-set>Köp trion med 20 % rabatt</button>
            </div>
          </div>
        </section>

        <section class="section" id="omdomen-pdp" aria-labelledby="rel-title">
          <div class="section-head"><div><p class="eyebrow">Fler motiv</p><h2 class="h2" id="rel-title">Du kanske också gillar</h2></div><a class="link-arrow" href="#kollektion-${cat.id}">Allt i ${esc(cat.name.toLowerCase())} ${icon('arrow')}</a></div>
          <div class="rail">${related.map(RV.cardHTML).join('')}</div>
        </section>
        ${recent.length ? `<section class="section" aria-labelledby="recent-title"><div class="section-head"><h2 class="h2" id="recent-title">Senast visade</h2></div><div class="rail">${recent.map((id) => RV.cardHTML(RV.byId(id))).join('')}</div></section>` : ''}
      </div>`;

    const setRoom = $('[data-set-room]');
    const tmp = document.createElement('div');
    tmp.innerHTML = RV.roomHTML({
      wall: prod.wall,
      items: [
        { p: setItems[0], x: 23, y: 16, w: 14, frame: 'black' },
        { p: setItems[1], x: 39, y: 6, w: 22, frame: 'black', mat: true },
        { p: setItems[2], x: 63, y: 16, w: 14, frame: 'black' },
      ],
      furniture: [{ type: 'sideboard', x: 25, b: 9, w: 50 }],
      style: '--floor-h:9%',
    });
    setRoom.innerHTML = tmp.firstElementChild.innerHTML;
    setRoom.style.setProperty('--wall', prod.wall);
    setRoom.dataset.set = setItems.map((x) => x.id).join(',');

    updatePrice();
    renderBuybar();
  }

  function updatePrice() {
    const prod = p();
    const now = priceNow();
    const orig = priceOrig();
    $('[data-price]').innerHTML = `<strong>${fmt(now)}</strong>${orig > now + 0.5 ? `<s>${fmt(orig)}</s><span class="badge badge--sale">–${Math.round(prod.sale * 100)} % på trycket</span>` : ''}<small>inkl. moms</small>`;
    $('[data-split]').textContent = `Eller dela upp betalningen: 3 × ${fmt(Math.ceil(now / 3))}, räntefritt.`;
    $('[data-add]').innerHTML = `Lägg i varukorgen<span class="btn__price">&nbsp;· ${fmt(now)}</span>`;
    $('[data-size-label]').textContent = RV.size(st.size).label;
    $('[data-frame-label]').textContent = `${RV.frame(st.frame).name}${st.frame !== 'none' ? ` · +${fmt(RV.framePrice(st.size, st.frame))}` : ''}`;
    const bar = $('[data-buybar]');
    if (!bar.hidden) bar.querySelector('[data-bb-price]').textContent = `${RV.size(st.size).label} · ${fmt(now)}`;
  }

  function updateMedia() {
    $('[data-stage]').innerHTML = stageHTML(st.view);
    $('[data-thumbs]').innerHTML = VIEWS.map(thumbHTML).join('');
  }

  function renderBuybar() {
    const bar = $('[data-buybar]');
    bar.hidden = false;
    bar.innerHTML = `<div class="buybar__inner"><div class="buybar__info"><strong>${esc(p().title)}</strong><span data-bb-price>${RV.size(st.size).label} · ${fmt(priceNow())}</span></div><button class="btn btn--primary" type="button" data-add-bb>Lägg i varukorgen</button></div>`;
    observer?.disconnect();
    observer = new IntersectionObserver(([entry]) => bar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe($('[data-buy]'));
  }
  let observer = null;

  function add() {
    RV.addToCart({ id: st.id, size: st.size, frame: st.frame, mat: st.mat, qty: st.qty });
  }

  function bind() {
    const view = $('#view-product');
    view.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'pdp-size') {
        st.size = t.value;
        $('[data-frames]').innerHTML = framesHTML();
        updateMedia();
        updatePrice();
      }
      if (t.name === 'pdp-frame') {
        st.frame = t.value;
        if (st.frame === 'none') st.mat = false;
        const mat = $('[data-mat]');
        mat.disabled = st.frame === 'none';
        mat.checked = st.mat;
        $('[data-mat-row]').classList.toggle('is-disabled', st.frame === 'none');
        if (st.view === 'detail') st.view = 'poster';
        updateMedia();
        updatePrice();
      }
      if (t.matches('[data-mat]')) {
        st.mat = t.checked;
        updateMedia();
        updatePrice();
      }
    });
    view.addEventListener('click', (e) => {
      const t = e.target;
      const v = t.closest('[data-view]');
      if (v) {
        st.view = v.dataset.view;
        updateMedia();
        return;
      }
      const q = t.closest('[data-pqty]');
      if (q) {
        st.qty = Math.max(1, Math.min(20, st.qty + +q.dataset.pqty));
        $('[data-qty-out]').textContent = st.qty;
        updatePrice();
        return;
      }
      if (t.closest('[data-add]')) add();
      if (t.closest('[data-buy-set]')) {
        const ids = $('[data-set-room]').dataset.set.split(',');
        RV.addToCart(ids.map((id) => ({ id, size: id === st.id ? '50x70' : '30x40', frame: 'black', disc: 0.2 })), { open: true });
      }
    });
    view.addEventListener('pointermove', (e) => {
      const z = e.target.closest('[data-zoom]');
      if (!z) return;
      const r = z.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const img = z.querySelector('img');
      img.style.setProperty('--tx', `${-15 - x * 70}%`);
      img.style.setProperty('--ty', `${-15 - y * 70}%`);
    });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-add-bb]')) add(); });
  }

  RV.showProduct = (id) => {
    if (!RV.byId(id)) return null;
    if (st.id !== id) Object.assign(st, { id, size: '50x70', frame: 'black', mat: false, qty: 1, view: 'poster' });
    render();
    const recent = [id].concat(RV.store.get('recent', []).filter((x) => x !== id)).slice(0, 8);
    RV.store.set('recent', recent);
    return RV.byId(id).title;
  };
  RV.hideProduct = () => {
    const bar = $('[data-buybar]');
    bar.hidden = true;
    bar.classList.remove('is-visible');
    observer?.disconnect();
  };
  RV.initProduct = bind;
})();
