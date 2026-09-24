/* Ramverk – delade komponenter: priser, ramar, rum, kort, varukorg, sök och notiser. */
(function () {
  const RV = window.RV;

  /* ------------------------------------------------------------ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nf = new Intl.NumberFormat('sv-SE');
  const fmt = (n) => `${nf.format(Math.round(n))} kr`;
  const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(`ramverk:${key}`);
        return v ? JSON.parse(v) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(`ramverk:${key}`, JSON.stringify(value));
      } catch (e) {
        /* lagring saknas – sidan fungerar ändå */
      }
    },
  };

  Object.assign(RV, { $, $$, esc, fmt, fold, slug, icon, store, reduced });

  /* ------------------------------------------------------------- lookup */
  RV.byId = (id) => RV.products.find((p) => p.id === id);
  RV.size = (id) => RV.sizes.find((s) => s.id === id) || RV.sizes[2];
  RV.frame = (id) => RV.frames.find((f) => f.id === id) || RV.frames[0];
  RV.cat = (id) => RV.categories.find((c) => c.id === id);
  RV.src = (id) => `assets/posters/${id}.svg`;
  RV.artistSlug = (name) => slug(name);
  RV.newest = RV.products.slice().sort((a, b) => b.added.localeCompare(a.added)).slice(0, 8).map((p) => p.id);
  RV.isNew = (p) => RV.newest.includes(p.id);

  /* ------------------------------------------------------------ pricing */
  const nice = (v) => Math.max(9, Math.round((v + 1) / 10) * 10 - 1);
  RV.printPrice = (p, sizeId, { original = false } = {}) => {
    let v = RV.size(sizeId).price * (p.limited ? RV.LIMITED_FACTOR : 1);
    if (p.sale && !original) v *= 1 - p.sale;
    return p.limited || (p.sale && !original) ? nice(v) : v;
  };
  RV.framePrice = (sizeId, frameId) => {
    const f = RV.frame(frameId);
    return f.mult ? nice(RV.size(sizeId).frame * f.mult) : 0;
  };
  RV.unitPrice = (p, sizeId, frameId, mat, opts) =>
    RV.printPrice(p, sizeId, opts) + RV.framePrice(sizeId, frameId) + (mat && frameId !== 'none' ? RV.MAT_PRICE : 0);
  RV.fromPrice = (p) => RV.printPrice(p, '21x30');

  RV.stars = (value = 5) => {
    let out = '';
    for (let i = 1; i <= 5; i++) out += icon(value >= i - 0.25 ? 'star' : 'star-o');
    return out;
  };

  /* ------------------------------------------------------ frame & room */
  RV.frameHTML = (p, { frame = 'black', mat = false, eager = false, alt = '' } = {}) => {
    const f = RV.frame(frame);
    return `<div class="frame" data-frame="${f.id}"${mat && f.id !== 'none' ? ' data-mat' : ''}${f.color ? ` style="--fc:${f.color}"` : ''}>
      <div class="frame__border"><div class="frame__mat"><div class="frame__art"><img src="${RV.src(p.id)}" alt="${esc(alt)}" width="500" height="700" decoding="async" loading="${eager ? 'eager' : 'lazy'}"></div></div></div></div>`;
  };

  RV.furniture = {
    sofa: `<svg viewBox="0 0 440 172" aria-hidden="true"><ellipse class="fu-shadow" cx="220" cy="166" rx="222" ry="7"/>
      <rect class="fu-fabric-d" x="16" y="6" width="408" height="96" rx="28"/>
      <rect class="fu-fabric" x="34" y="14" width="182" height="82" rx="22"/><rect class="fu-fabric" x="224" y="14" width="182" height="82" rx="22"/>
      <rect class="fu-accent" x="62" y="42" width="72" height="62" rx="16" transform="rotate(-9 98 73)"/>
      <rect class="fu-fabric-d" x="0" y="56" width="60" height="98" rx="24"/><rect class="fu-fabric-d" x="380" y="56" width="60" height="98" rx="24"/>
      <rect class="fu-fabric" x="44" y="94" width="352" height="52" rx="16"/><path class="fu-line" d="M220 98v44"/>
      <rect class="fu-leg" x="40" y="150" width="9" height="18"/><rect class="fu-leg" x="391" y="150" width="9" height="18"/></svg>`,
    sideboard: `<svg viewBox="0 0 300 190" aria-hidden="true"><ellipse class="fu-shadow" cx="150" cy="186" rx="150" ry="5"/>
      <path d="M62 76c-10-26-4-54 6-70M66 76c2-22 14-40 30-52M60 76c-8-18-24-28-40-30" stroke="#5E6B4C" stroke-width="2.2" fill="none"/>
      <ellipse cx="68" cy="8" rx="5" ry="10" fill="#6F7F5A" transform="rotate(20 68 8)"/><ellipse cx="94" cy="24" rx="5" ry="10" fill="#7E8E66" transform="rotate(60 94 24)"/><ellipse cx="22" cy="46" rx="5" ry="10" fill="#6F7F5A" transform="rotate(-70 22 46)"/><ellipse cx="80" cy="40" rx="4" ry="9" fill="#7E8E66" transform="rotate(40 80 40)"/><ellipse cx="44" cy="44" rx="4" ry="9" fill="#6F7F5A" transform="rotate(-40 44 44)"/>
      <path d="M52 110c-6-10-4-24 4-30h20c8 6 10 20 4 30z" fill="#E9E4DA"/><rect x="58" y="72" width="16" height="10" rx="3" fill="#DCD6CA"/>
      <rect x="196" y="98" width="62" height="7" fill="#2F3A45"/><rect x="200" y="91" width="54" height="7" fill="#C9573A"/><rect x="194" y="84" width="58" height="7" fill="#E3D8C6"/>
      <circle cx="226" cy="76" r="8" fill="#B9A58A"/>
      <rect class="fu-wood-d" x="0" y="108" width="300" height="6"/><rect class="fu-wood" x="4" y="114" width="292" height="56"/>
      <path class="fu-line" d="M101 116v52M199 116v52"/><rect x="90" y="136" width="3" height="14" fill="rgba(0,0,0,.25)"/><rect x="207" y="136" width="3" height="14" fill="rgba(0,0,0,.25)"/>
      <rect class="fu-leg" x="16" y="170" width="6" height="16"/><rect class="fu-leg" x="278" y="170" width="6" height="16"/></svg>`,
    plant: `<svg viewBox="0 0 130 280" aria-hidden="true"><ellipse class="fu-shadow" cx="65" cy="276" rx="44" ry="5"/>
      <path d="M65 214V120M65 170l-24-40M65 150l26-48M65 190l30-26" stroke="#4E5B3E" stroke-width="3" fill="none"/>
      <g fill="#4F6B43"><ellipse cx="40" cy="116" rx="17" ry="30" transform="rotate(-28 40 116)"/><ellipse cx="94" cy="96" rx="17" ry="30" transform="rotate(30 94 96)"/><ellipse cx="62" cy="84" rx="17" ry="32"/><ellipse cx="100" cy="158" rx="15" ry="26" transform="rotate(52 100 158)"/></g>
      <g fill="#6A8A58"><ellipse cx="30" cy="160" rx="15" ry="26" transform="rotate(-50 30 160)"/><ellipse cx="76" cy="126" rx="14" ry="26" transform="rotate(16 76 126)"/><ellipse cx="46" cy="60" rx="13" ry="24" transform="rotate(-18 46 60)"/><ellipse cx="84" cy="52" rx="13" ry="24" transform="rotate(22 84 52)"/></g>
      <path d="M30 212h70l-9 64H39z" fill="#D9D3C7"/><path d="M30 212h70v8H30z" fill="#CCC5B7"/></svg>`,
    lamp: `<svg viewBox="0 0 110 330" aria-hidden="true"><ellipse class="fu-shadow" cx="55" cy="326" rx="34" ry="4"/>
      <radialGradient id="lampglow"><stop offset="0" stop-color="#FFF4DA" stop-opacity=".9"/><stop offset="1" stop-color="#FFF4DA" stop-opacity="0"/></radialGradient>
      <circle cx="55" cy="70" r="60" fill="url(#lampglow)"/>
      <path d="M53 70h4v250h-4z" fill="#2B2724"/><ellipse cx="55" cy="322" rx="26" ry="5" fill="#2B2724"/>
      <path d="M26 20h58l14 56H12z" fill="#EFE6D4"/><path d="M26 20h58l2 6H24z" fill="#DCCFB7"/></svg>`,
    bench: `<svg viewBox="0 0 320 120" aria-hidden="true"><ellipse class="fu-shadow" cx="160" cy="116" rx="160" ry="5"/>
      <rect x="40" y="36" width="66" height="10" fill="#C9573A"/><rect x="46" y="26" width="58" height="10" fill="#2F3A45"/><rect x="42" y="18" width="62" height="8" fill="#E9E1D2"/>
      <path d="M160 46c20-16 60-16 80 0z" fill="#B8A58C"/><rect x="190" y="18" width="4" height="30" fill="#5E6B4C"/><circle cx="192" cy="14" r="9" fill="#7E8E66"/>
      <rect class="fu-wood" x="0" y="46" width="320" height="16"/><rect class="fu-wood-d" x="0" y="60" width="320" height="4"/>
      <rect class="fu-wood-d" x="16" y="64" width="12" height="48"/><rect class="fu-wood-d" x="292" y="64" width="12" height="48"/></svg>`,
  };

  RV.roomHTML = ({ wall = '#E7E3DA', tone = 'light', items = [], furniture = [], cls = '', floor = true, hotspots = false, style = '' } = {}) => `
    <div class="room ${cls}" style="--wall:${wall};${style}" data-tone="${tone}">
      ${floor ? '<div class="room__floor"></div>' : ''}
      ${items.map((it, i) => `<div class="room__item" style="--i:${i};left:${it.x}%;top:${it.y}%;width:${it.w}%" data-slot="${i}" data-id="${it.p.id}">${RV.frameHTML(it.p, it)}${hotspots ? `<button class="hotspot" type="button" data-hotspot="${it.p.id}" aria-label="Visa ${esc(it.p.title)}"></button>` : ''}</div>`).join('')}
      ${furniture.map((f) => `<div class="room__furn" style="left:${f.x}%;bottom:${f.b ?? 0}%;width:${f.w}%">${RV.furniture[f.type]}</div>`).join('')}
    </div>`;

  /* Litet rum bakom produktkortet – byggs först vid hover. */
  RV.cardRoomHTML = (p) =>
    RV.roomHTML({
      wall: p.wall,
      items: [{ p, x: 33, y: 13, w: 34, frame: 'oak', mat: true }],
      furniture: [{ type: 'sideboard', x: 12, b: 7, w: 76 }],
      style: '--floor-h:9%',
    });

  /* ------------------------------------------------------------- cards */
  RV.cardHTML = (p) => {
    const sale = p.sale ? `<span class="badge badge--sale">–${Math.round(p.sale * 100)} %</span>` : '';
    const nu = RV.isNew(p) ? '<span class="badge badge--new">Nyhet</span>' : '';
    const ltd = p.limited ? '<span class="badge badge--ltd">Limited</span>' : '';
    const wished = RV.wish.has(p.id);
    const price = p.sale
      ? `<s>${fmt(RV.printPrice(p, '21x30', { original: true }))}</s><span class="is-sale">Från ${fmt(RV.fromPrice(p))}</span>`
      : `<span>Från ${fmt(RV.fromPrice(p))}</span>`;
    return `<article class="card" data-card="${p.id}">
      <div class="card__box">
        <a class="card__media" href="#produkt-${p.id}" tabindex="-1" aria-hidden="true">
          <div class="card__print">${RV.frameHTML(p, { frame: 'none' })}</div>
          <div class="card__room"></div>
        </a>
        <div class="card__badges">${sale}${nu}${ltd}</div>
        <button class="card__wish" type="button" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Spara ${esc(p.title)} i önskelistan">${icon('heart')}</button>
        <div class="card__quickbar" role="group" aria-label="Snabbköp ${esc(p.title)}">
          <span>Köp</span>
          ${RV.sizes.map((s) => `<button type="button" data-quick="${p.id}" data-size="${s.id}" aria-label="Lägg ${esc(p.title)} ${s.label} i varukorgen">${s.w}×${s.h}</button>`).join('')}
        </div>
      </div>
      <div class="card__info">
        <h3 class="card__title"><a href="#produkt-${p.id}">${esc(p.title)}</a></h3>
        <p class="card__artist">${esc(p.artist)}</p>
        <p class="card__price">${price}</p>
      </div>
    </article>`;
  };

  function prepareCardRoom(card) {
    const slot = card.querySelector('.card__room');
    if (!slot || slot.dataset.built) return;
    slot.dataset.built = '1';
    slot.innerHTML = RV.cardRoomHTML(RV.byId(card.dataset.card));
    const img = slot.querySelector('img');
    const ready = () => slot.classList.add('is-ready');
    if (img.complete) ready();
    else img.addEventListener('load', ready, { once: true });
  }
  document.addEventListener('pointerover', (e) => {
    const card = e.target.closest?.('.card');
    if (card && e.pointerType !== 'touch') prepareCardRoom(card);
  });
  document.addEventListener('focusin', (e) => {
    const card = e.target.closest?.('.card');
    if (card) prepareCardRoom(card);
  });

  /* ------------------------------------------------------------ wishlist */
  RV.wish = new Set(store.get('wish', []));
  RV.toggleWish = (id) => {
    const on = !RV.wish.has(id);
    if (on) RV.wish.add(id);
    else RV.wish.delete(id);
    store.set('wish', [...RV.wish]);
    $$(`[data-wish="${id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', on);
      b.classList.remove('pop');
      void b.offsetWidth;
      b.classList.add('pop');
    });
    RV.updateCounts();
    const p = RV.byId(id);
    RV.toast({ p, title: on ? 'Sparad i önskelistan' : 'Borttagen ur önskelistan', text: p.title, action: on ? { label: 'Visa', href: '#kollektion-favoriter' } : null });
    document.dispatchEvent(new CustomEvent('rv:wish'));
  };

  /* ---------------------------------------------------------------- cart */
  RV.cart = store.get('cart', []).filter((l) => RV.byId(l.id));
  const lineKey = (l) => `${l.id}|${l.size}|${l.frame}|${l.mat ? 1 : 0}|${l.disc || 0}`;
  const saveCart = () => store.set('cart', RV.cart);

  RV.linePrice = (l) => {
    const p = RV.byId(l.id);
    return RV.unitPrice(p, l.size, l.frame, l.mat) * (1 - (l.disc || 0));
  };
  RV.cartTotals = () => {
    let sub = 0, save = 0, count = 0;
    RV.cart.forEach((l) => {
      const p = RV.byId(l.id);
      const full = RV.unitPrice(p, l.size, l.frame, l.mat, { original: true });
      const now = RV.linePrice(l);
      sub += now * l.qty;
      save += (full - now) * l.qty;
      count += l.qty;
    });
    return { sub, save, count };
  };

  RV.addToCart = (items, { silent = false, open = false } = {}) => {
    const list = Array.isArray(items) ? items : [items];
    list.forEach((it) => {
      const line = { id: it.id, size: it.size || '50x70', frame: it.frame || 'none', mat: !!it.mat && it.frame !== 'none', qty: it.qty || 1, disc: it.disc || 0 };
      const found = RV.cart.find((l) => lineKey(l) === lineKey(line));
      if (found) found.qty += line.qty;
      else RV.cart.push(line);
    });
    saveCart();
    RV.renderCart();
    RV.updateCounts(true);
    if (open) RV.openCart();
    else if (!silent) {
      const first = list[0];
      const p = RV.byId(first.id);
      const s = RV.size(first.size || '50x70');
      const f = RV.frame(first.frame || 'none');
      RV.toast({
        p,
        frame: first.frame,
        title: list.length > 1 ? `${list.length} tavlor i varukorgen` : 'Lagd i varukorgen',
        text: list.length > 1 ? 'Gallerivägg med paketrabatt' : `${p.title} · ${s.label}${f.mult ? ` · ${f.short}` : ''}`,
        action: { label: 'Till kassan', run: RV.openCart },
      });
    }
  };

  RV.updateCounts = (bump = false) => {
    const { count } = RV.cartTotals();
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count || '';
      el.toggleAttribute('data-zero', !count);
    });
    $$('[data-wish-count]').forEach((el) => {
      el.textContent = RV.wish.size || '';
      el.toggleAttribute('data-zero', !RV.wish.size);
    });
    if (bump) {
      const btn = $('[data-cart-btn]');
      btn.classList.remove('bump');
      void btn.offsetWidth;
      btn.classList.add('bump');
    }
  };

  RV.renderCart = () => {
    const { sub, save, count } = RV.cartTotals();
    $('[data-cart-heading-count]').textContent = count ? `(${count})` : '';
    const left = Math.max(0, RV.FREE_SHIPPING - sub);
    const ship = $('[data-ship]');
    ship.classList.toggle('is-free', left === 0);
    ship.innerHTML = count
      ? `${left > 0 ? `Handla för <strong>${fmt(left)}</strong> till så får du fri frakt.` : '<strong>Du har fri frakt.</strong> Vi skickar inom ett dygn.'}<div class="ship__bar"><i style="width:${Math.min(100, (sub / RV.FREE_SHIPPING) * 100)}%"></i></div>`
      : `Fri frakt på beställningar över ${fmt(RV.FREE_SHIPPING)}.<div class="ship__bar"><i style="width:0"></i></div>`;

    const body = $('[data-cart-body]');
    const foot = $('[data-cart-foot]');
    if (!count) {
      body.innerHTML = `<div class="empty">
        <div class="empty__art">${RV.frameHTML(RV.byId('horisont'), { frame: 'white', mat: true })}</div>
        <h3>Varukorgen är tom</h3><p>Börja med en storsäljare eller komponera en hel vägg i studion.</p>
        <a class="btn btn--primary" href="#kollektion-mest-salda" data-close>Se mest sålda</a></div>`;
      foot.innerHTML = '';
      return;
    }
    const inCart = new Set(RV.cart.map((l) => l.id));
    const ups = RV.products.filter((p) => !inCart.has(p.id)).sort((a, b) => b.pop - a.pop).slice(0, 3);
    body.innerHTML =
      RV.cart
        .map((l, i) => {
          const p = RV.byId(l.id);
          const s = RV.size(l.size);
          const f = RV.frame(l.frame);
          const full = RV.unitPrice(p, l.size, l.frame, l.mat, { original: true }) * l.qty;
          const now = RV.linePrice(l) * l.qty;
          return `<div class="line">
            <a class="line__thumb" href="#produkt-${p.id}" data-close>${RV.frameHTML(p, { frame: l.frame, mat: l.mat })}</a>
            <div>
              <div class="line__top">
                <div><a class="line__title" href="#produkt-${p.id}" data-close>${esc(p.title)}</a>
                <p class="line__meta">${s.label} · ${f.name}${l.mat ? ' · Passepartout' : ''}${l.disc ? ' · Gallerivägg' : ''}</p></div>
                <p class="line__price">${full > now + 0.5 ? `<s>${fmt(full)}</s>` : ''}${fmt(now)}</p>
              </div>
              <div class="line__bottom">
                <div class="qty"><button type="button" data-qty="${i}" data-d="-1" aria-label="Minska antal">${icon('minus')}</button><output aria-live="polite">${l.qty}</output><button type="button" data-qty="${i}" data-d="1" aria-label="Öka antal">${icon('plus')}</button></div>
                <button class="remove" type="button" data-remove="${i}">Ta bort</button>
              </div>
            </div>
          </div>`;
        })
        .join('') +
      `<div class="upsell"><h3>Passar bra ihop med</h3><div class="upsell__row">${ups
        .map((p) => `<div class="upsell__item"><a href="#produkt-${p.id}" data-close>${RV.frameHTML(p, { frame: 'none' })}</a><strong>${esc(p.title)}</strong><span class="muted">${fmt(RV.printPrice(p, '30x40'))} · 30×40</span><button type="button" data-quick="${p.id}" data-size="30x40">Lägg till</button></div>`)
        .join('')}</div></div>`;

    foot.innerHTML = `<div class="totals">
        <div><span>Delsumma</span><span>${fmt(sub + save)}</span></div>
        ${save > 0.5 ? `<div class="save"><span>Du sparar</span><span>–${fmt(save)}</span></div>` : ''}
        <div><span>Frakt</span><span>${sub >= RV.FREE_SHIPPING ? 'Fri' : fmt(59)}</span></div>
        <div class="grand"><span>Totalt inkl. moms</span><span>${fmt(sub + (sub >= RV.FREE_SHIPPING ? 0 : 59))}</span></div>
      </div>
      <button class="btn btn--primary btn--xl btn--block" type="button" data-checkout>Till kassan ${icon('arrow')}</button>
      <p class="checkout-note" data-checkout-note hidden>Det här är en demobutik, så kassan är inte kopplad. Varukorgen sparas i din webbläsare.</p>`;
  };

  /* ------------------------------------------------------------ overlays */
  let openPanel = null;
  let lastFocus = null;
  const scrim = () => $('[data-scrim]');

  RV.openPanel = (el, trigger) => {
    if (openPanel && openPanel !== el) RV.closePanel({ restore: false });
    lastFocus = trigger || document.activeElement;
    openPanel = el;
    const sc = scrim();
    sc.hidden = false;
    requestAnimationFrame(() => sc.classList.add('is-open'));
    el.classList.add('is-open');
    document.body.classList.add('is-locked');
    $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => el.focus({ preventScroll: true }), 50);
  };
  RV.closePanel = ({ restore = true } = {}) => {
    if (!openPanel) return;
    const el = openPanel;
    openPanel = null;
    el.classList.remove('is-open');
    $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    const sc = scrim();
    sc.classList.remove('is-open');
    setTimeout(() => { if (!openPanel) sc.hidden = true; }, 300);
    document.body.classList.remove('is-locked');
    if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  RV.openCart = () => {
    RV.closeSearch();
    $$('[data-toasts] .toast').forEach((t) => t.remove());
    RV.openPanel($('[data-cart]'));
  };

  /* ---------------------------------------------------------------- toast */
  RV.toast = ({ p, frame = 'none', title, text, action }) => {
    const region = $('[data-toasts]');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="toast__check">${p ? RV.frameHTML(p, { frame, eager: true }) : icon('check')}</div>
      <div><strong>${esc(title)}</strong>${text ? `<span>${esc(text)}</span>` : ''}</div>
      ${action ? `<button type="button">${esc(action.label)}</button>` : '<span></span>'}`;
    if (action) {
      el.querySelector('button').addEventListener('click', () => {
        dismiss();
        if (action.href) location.hash = action.href;
        if (action.run) action.run();
      });
    }
    region.appendChild(el);
    while (region.children.length > 2) region.firstElementChild.remove();
    let timer = setTimeout(dismiss, 4200);
    el.addEventListener('pointerenter', () => clearTimeout(timer));
    el.addEventListener('pointerleave', () => { timer = setTimeout(dismiss, 2000); });
    function dismiss() {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 300);
    }
  };

  /* --------------------------------------------------------------- search */
  const searchIndex = RV.products.map((p) => ({
    p,
    hay: fold([p.title, p.artist, RV.cat(p.cat).name, RV.colors.find((c) => c.id === p.color).name, p.desc, RV.artists[p.artist]?.city].join(' ')),
  }));
  const highlight = (text, q) => {
    if (!q) return esc(text);
    const i = fold(text).indexOf(fold(q));
    if (i < 0) return esc(text);
    return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
  };
  const resultHTML = (p, q) => `<a class="sres" href="#produkt-${p.id}" data-close>
      <div>${RV.frameHTML(p, { frame: 'none' })}</div>
      <div><strong>${highlight(p.title, q)}</strong><span>${highlight(p.artist, q)} · ${esc(RV.cat(p.cat).name)}</span></div>
      <span class="tabular">${fmt(RV.fromPrice(p))}</span></a>`;

  RV.renderSearch = (q = '') => {
    const body = $('[data-search-body]');
    const term = q.trim();
    if (!term) {
      const pop = RV.products.slice().sort((a, b) => b.pop - a.pop).slice(0, 6);
      body.innerHTML = `<div><p class="mono-label" style="margin-bottom:12px">Populära sökningar</p>
        <div class="chips">${['Fjäll', 'Botaniskt', 'Svartvitt', 'Kök', 'Retro', 'Ines Morell', 'Blå'].map((t) => `<button class="chip" type="button" data-suggest="${t}">${t}</button>`).join('')}</div></div>
        <div><p class="mono-label" style="margin-bottom:12px">Mest sökta motiv</p><div class="search__results">${pop.map((p) => resultHTML(p)).join('')}</div></div>`;
      return;
    }
    const words = fold(term).split(/\s+/).filter(Boolean);
    const alias = { kok: 'citrus fika', svartvitt: 'svartvitt', fjall: 'fjäll kebnekaise' };
    const hits = searchIndex
      .filter(({ hay }) => words.every((w) => hay.includes(w) || (alias[w] && fold(alias[w]).split(' ').some((a) => hay.includes(a)))))
      .map(({ p }) => p);
    const cats = RV.categories.filter((c) => fold(c.name).includes(fold(term)));
    body.innerHTML = `
      ${cats.length ? `<div class="chips">${cats.map((c) => `<a class="chip" href="#kollektion-${c.id}" data-close>${esc(c.name)} ${icon('arrow')}</a>`).join('')}</div>` : ''}
      ${hits.length
        ? `<div><p class="mono-label" style="margin-bottom:12px">${hits.length} ${hits.length === 1 ? 'motiv' : 'motiv'}</p><div class="search__results">${hits.map((p) => resultHTML(p, term)).join('')}</div></div>`
        : `<p class="search__empty">Inga motiv matchar ”${esc(term)}”. Prova en färg, en konstnär eller ett ord som ”hav”.</p>`}`;
  };
  RV.openSearch = () => {
    RV.closePanel({ restore: false });
    const s = $('[data-search]');
    s.hidden = false;
    document.body.classList.add('is-locked');
    const input = $('[data-search-input]');
    RV.renderSearch(input.value);
    setTimeout(() => input.focus(), 30);
  };
  RV.closeSearch = () => {
    const s = $('[data-search]');
    if (s.hidden) return;
    s.hidden = true;
    if (!openPanel) document.body.classList.remove('is-locked');
  };

  /* ------------------------------------------------------------- events */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const quick = t.closest('[data-quick]');
    if (quick) {
      e.preventDefault();
      RV.addToCart({ id: quick.dataset.quick, size: quick.dataset.size, frame: 'none' });
      return;
    }
    const wish = t.closest('[data-wish]');
    if (wish) {
      e.preventDefault();
      RV.toggleWish(wish.dataset.wish);
      return;
    }
    const qty = t.closest('[data-qty]');
    if (qty) {
      const line = RV.cart[+qty.dataset.qty];
      line.qty = Math.max(1, Math.min(20, line.qty + +qty.dataset.d));
      saveCart();
      RV.renderCart();
      RV.updateCounts();
      return;
    }
    const rm = t.closest('[data-remove]');
    if (rm) {
      RV.cart.splice(+rm.dataset.remove, 1);
      saveCart();
      RV.renderCart();
      RV.updateCounts();
      return;
    }
    if (t.closest('[data-checkout]')) {
      $('[data-checkout-note]').hidden = false;
      return;
    }
    const sug = t.closest('[data-suggest]');
    if (sug) {
      const input = $('[data-search-input]');
      input.value = sug.dataset.suggest;
      RV.renderSearch(input.value);
      input.focus();
      return;
    }
    const act = t.closest('[data-action]');
    if (act) {
      const a = act.dataset.action;
      if (a === 'cart') RV.openCart();
      if (a === 'search') RV.openSearch();
      if (a === 'menu') RV.openPanel($('[data-mmenu]'), act);
      return;
    }
    if (t.closest('[data-close]') || t === $('[data-scrim]')) {
      RV.closePanel({ restore: !t.closest('a') });
      RV.closeSearch();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      RV.closeSearch();
      RV.closePanel();
    }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      RV.openSearch();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-search-input]')) RV.renderSearch(e.target.value);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[data-search-input]')) {
      const first = $('[data-search-body] .sres');
      if (first) first.click();
    }
  });
})();
