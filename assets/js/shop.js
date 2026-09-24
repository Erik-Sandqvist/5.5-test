/* Ramverk – kollektionssidan med filter, sortering och täthet. */
(function () {
  const RV = window.RV;
  const { $, $$, esc, fmt, icon } = RV;

  const SORTS = [
    ['pop', 'Populärast'],
    ['new', 'Nyast'],
    ['rating', 'Bäst betyg'],
    ['price-asc', 'Pris, lägst först'],
    ['price-desc', 'Pris, högst först'],
  ];
  const PRICE_MIN = 99;
  const PRICE_MAX = 279;

  const st = { scope: null, colors: new Set(), max: PRICE_MAX, sale: false, limited: false, sort: 'pop', cols: RV.store.get('cols', 3) };

  function scopeInfo(scope) {
    if (!scope) return { title: 'Alla posters', blurb: 'Hela sortimentet, från 21 × 30 till 70 × 100 cm. Alla motiv finns med eller utan ram.' };
    if (RV.cat(scope)) return { title: RV.cat(scope).name, blurb: RV.cat(scope).blurb, crumb: RV.cat(scope).name };
    if (scope === 'favoriter') return { title: 'Din önskelista', blurb: 'Motiv du sparat med hjärtat. Listan finns kvar i den här webbläsaren.' };
    if (scope.startsWith('konstnar-')) {
      const name = Object.keys(RV.artists).find((a) => RV.artistSlug(a) === scope.slice(9));
      if (name) return { title: name, blurb: RV.artists[name].bio, crumb: 'Konstnärer', artist: name };
    }
    if (scope.startsWith('farg-')) {
      const c = RV.colors.find((x) => x.id === scope.slice(5));
      if (c) return { title: `${c.name} posters`, blurb: `Motiv där ${c.name.toLowerCase()} är den bärande färgen.`, crumb: c.name };
    }
    if (RV.collections[scope]) return { title: RV.collections[scope].name, blurb: RV.collections[scope].blurb };
    return { title: 'Alla posters', blurb: '' };
  }

  function inScope(p, scope) {
    if (!scope) return true;
    if (RV.cat(scope)) return p.cat === scope;
    if (scope === 'favoriter') return RV.wish.has(p.id);
    if (scope === 'nyheter') return RV.isNew(p);
    if (scope === 'mest-salda') return p.pop >= 90;
    if (scope === 'rea') return !!p.sale;
    if (scope === 'limited') return !!p.limited;
    if (scope.startsWith('konstnar-')) return RV.artistSlug(p.artist) === scope.slice(9);
    if (scope.startsWith('farg-')) return p.color === scope.slice(5);
    return true;
  }

  function results() {
    let list = RV.products.filter((p) => inScope(p, st.scope));
    const base = list;
    if (st.colors.size) list = list.filter((p) => st.colors.has(p.color));
    if (st.sale) list = list.filter((p) => p.sale);
    if (st.limited) list = list.filter((p) => p.limited);
    list = list.filter((p) => RV.fromPrice(p) <= st.max);
    const by = {
      pop: (a, b) => b.pop - a.pop,
      new: (a, b) => b.added.localeCompare(a.added),
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      'price-asc': (a, b) => RV.fromPrice(a) - RV.fromPrice(b),
      'price-desc': (a, b) => RV.fromPrice(b) - RV.fromPrice(a),
    }[st.sort];
    return { list: list.slice().sort(by), base };
  }

  const activeCount = () => st.colors.size + (st.sale ? 1 : 0) + (st.limited ? 1 : 0) + (st.max < PRICE_MAX ? 1 : 0);

  function filtersHTML(base) {
    const colorCount = (id) => base.filter((p) => p.color === id).length;
    return `
      <div class="filters__head"><h2>Filter</h2><button class="icon-btn" type="button" data-filters-close aria-label="Stäng filter">${icon('close')}</button></div>
      <div class="fgroup">
        <h3>Färg</h3>
        <div class="color-list">${RV.colors
          .map((c) => `<button class="swatch" type="button" style="--sw:${c.hex}" data-fcolor="${c.id}" aria-pressed="${st.colors.has(c.id)}" aria-label="${c.name} (${colorCount(c.id)})" title="${c.name} · ${colorCount(c.id)}"${colorCount(c.id) ? '' : ' disabled'}></button>`)
          .join('')}</div>
      </div>
      <div class="fgroup">
        <h3><label for="f-price">Pris från</label> <span class="tabular muted" data-price-out>upp till ${fmt(st.max)}</span></h3>
        <input class="range" id="f-price" type="range" min="${PRICE_MIN}" max="${PRICE_MAX}" step="10" value="${st.max}" data-fprice>
        <div class="range-val"><span>${fmt(PRICE_MIN)}</span><span>${fmt(PRICE_MAX)}</span></div>
      </div>
      <div class="fgroup">
        <h3>Visa</h3>
        <label class="check"><input type="checkbox" id="f-sale" data-fsale${st.sale ? ' checked' : ''}><span>Endast rea</span><small>${base.filter((p) => p.sale).length}</small></label>
        <label class="check"><input type="checkbox" id="f-ltd" data-fltd${st.limited ? ' checked' : ''}><span>Limited edition</span><small>${base.filter((p) => p.limited).length}</small></label>
      </div>
      <div class="fgroup">
        <h3>Kategori</h3>
        <div class="chips">${RV.categories.map((c) => `<a class="chip" href="#kollektion-${c.id}"${st.scope === c.id ? ' aria-current="true"' : ''}>${esc(c.name)}</a>`).join('')}</div>
      </div>
      <div class="filters__foot"><button class="btn btn--primary btn--block" type="button" data-filters-close>Visa resultat</button></div>`;
  }

  function activeHTML() {
    const chips = [];
    st.colors.forEach((id) => chips.push(`<button class="chip" type="button" data-clear="color:${id}">${esc(RV.colors.find((c) => c.id === id).name)} ${icon('close')}</button>`));
    if (st.max < PRICE_MAX) chips.push(`<button class="chip" type="button" data-clear="max">Upp till ${fmt(st.max)} ${icon('close')}</button>`);
    if (st.sale) chips.push(`<button class="chip" type="button" data-clear="sale">Rea ${icon('close')}</button>`);
    if (st.limited) chips.push(`<button class="chip" type="button" data-clear="limited">Limited ${icon('close')}</button>`);
    if (chips.length > 1) chips.push(`<button class="chip" type="button" data-clear="all">Rensa alla</button>`);
    return chips.join('');
  }

  const promoHTML = () => `<a class="promo-tile" href="#studio">
      <div><p class="eyebrow" style="color:inherit;opacity:.7">Gallerivägg-studion</p><h3>Tre tavlor eller fler? Få 20 % paketpris.</h3></div>
      ${RV.roomHTML({ wall: '#BFC6B2', items: [{ p: RV.byId('horisont'), x: 22, y: 12, w: 17, frame: 'oak' }, { p: RV.byId('fjallvarld'), x: 41, y: 6, w: 22, frame: 'oak', mat: true }, { p: RV.byId('bjorkskog'), x: 65, y: 12, w: 17, frame: 'oak' }], furniture: [{ type: 'sofa', x: 18, b: 9, w: 64 }], style: '--floor-h:10%' })}
      <span class="link-arrow">Öppna studion ${icon('arrow')}</span></a>`;

  function gridHTML(list) {
    if (!list.length) {
      const fav = st.scope === 'favoriter' && !activeCount();
      return `<div class="empty" style="grid-column:1/-1">
        <div class="empty__art">${RV.frameHTML(RV.byId('horisont'), { frame: 'white', mat: true })}</div>
        <h3>${fav ? 'Inga sparade motiv än' : 'Inga motiv matchar filtret'}</h3>
        <p>${fav ? 'Tryck på hjärtat på ett motiv så hamnar det här.' : 'Ta bort något filter eller höj prisgränsen för att se fler motiv.'}</p>
        ${fav ? '<a class="btn btn--primary" href="#kollektion">Utforska posters</a>' : '<button class="btn btn--primary" type="button" data-clear="all">Rensa filter</button>'}</div>`;
    }
    const cards = list.map(RV.cardHTML);
    if (!st.scope && !activeCount() && st.sort === 'pop' && cards.length > 6) cards.splice(st.cols === 4 ? 7 : 5, 0, promoHTML());
    return cards.join('');
  }

  function render() {
    const view = $('#view-shop');
    const info = scopeInfo(st.scope);
    const { list, base } = results();
    const n = activeCount();
    view.innerHTML = `
      <div class="container">
        <header class="shop-hero">
          <ol class="crumbs"><li><a href="#">Start</a></li><li><a href="#kollektion">Posters</a></li>${info.crumb ? `<li>${esc(info.crumb)}</li>` : ''}</ol>
          <div class="shop-hero__row">
            <div><h1 class="display-2">${esc(info.title)}</h1>${info.blurb ? `<p class="lead" style="margin-top:14px">${esc(info.blurb)}</p>` : ''}</div>
            <p class="shop-hero__count" data-count>${list.length} av ${base.length} motiv</p>
          </div>
          <nav class="catbar" aria-label="Kategorier">
            <a class="chip" href="#kollektion"${!st.scope ? ' aria-current="true"' : ''}>Alla <small>${RV.products.length}</small></a>
            ${RV.categories.map((c) => `<a class="chip" href="#kollektion-${c.id}"${st.scope === c.id ? ' aria-current="true"' : ''}>${esc(c.name)} <small>${RV.products.filter((p) => p.cat === c.id).length}</small></a>`).join('')}
            ${Object.entries(RV.collections).map(([id, c]) => `<a class="chip" href="#kollektion-${id}"${st.scope === id ? ' aria-current="true"' : ''}>${esc(c.name)}</a>`).join('')}
          </nav>
        </header>
        <div class="toolbar">
          <div class="toolbar__left">
            <button class="chip filter-btn" type="button" data-filters-open aria-controls="filters">${icon('filter')} Filter ${n ? `<span class="dot">${n}</span>` : ''}</button>
            <div class="select"><label class="sr-only" for="f-sort">Sortera</label><select id="f-sort" data-sort>${SORTS.map(([v, l]) => `<option value="${v}"${st.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select>${icon('chev')}</div>
          </div>
          <div class="toolbar__right">
            <div class="density" role="group" aria-label="Antal kolumner">
              ${[2, 3, 4].map((c) => `<button type="button" data-cols="${c}" aria-pressed="${st.cols === c}" aria-label="${c} kolumner">${icon(`grid${c}`)}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="shop-layout">
          <aside class="filters" id="filters" aria-label="Filter" tabindex="-1" data-filters>${filtersHTML(base)}</aside>
          <div>
            <div class="active-filters" data-active>${activeHTML()}</div>
            <div class="grid" data-cols="${st.cols}" data-grid>${gridHTML(list)}</div>
          </div>
        </div>
      </div>`;
  }

  /* Uppdatera bara resultat och filterstatus – behåller fokus i reglage. */
  function refresh() {
    const { list, base } = results();
    $('[data-grid]').innerHTML = gridHTML(list);
    $('[data-count]').textContent = `${list.length} av ${base.length} motiv`;
    $('[data-active]').innerHTML = activeHTML();
    const n = activeCount();
    const btn = $('[data-filters-open]');
    btn.innerHTML = `${icon('filter')} Filter ${n ? `<span class="dot">${n}</span>` : ''}`;
    $$('[data-fcolor]').forEach((b) => b.setAttribute('aria-pressed', st.colors.has(b.dataset.fcolor)));
    $('[data-fsale]').checked = st.sale;
    $('[data-fltd]').checked = st.limited;
    $('[data-fprice]').value = st.max;
    $('[data-price-out]').textContent = `upp till ${fmt(st.max)}`;
  }

  function bind() {
    const view = $('#view-shop');
    view.addEventListener('click', (e) => {
      const t = e.target;
      const col = t.closest('[data-fcolor]');
      if (col) {
        const id = col.dataset.fcolor;
        if (st.colors.has(id)) st.colors.delete(id);
        else st.colors.add(id);
        refresh();
        return;
      }
      const clr = t.closest('[data-clear]');
      if (clr) {
        const v = clr.dataset.clear;
        if (v === 'all') { st.colors.clear(); st.sale = false; st.limited = false; st.max = PRICE_MAX; }
        else if (v === 'max') st.max = PRICE_MAX;
        else if (v === 'sale') st.sale = false;
        else if (v === 'limited') st.limited = false;
        else if (v.startsWith('color:')) st.colors.delete(v.slice(6));
        refresh();
        return;
      }
      const dens = t.closest('[data-cols]:not([data-grid])');
      if (dens && dens.tagName === 'BUTTON') {
        st.cols = +dens.dataset.cols;
        RV.store.set('cols', st.cols);
        $$('.density [data-cols]').forEach((b) => b.setAttribute('aria-pressed', b === dens));
        $('[data-grid]').dataset.cols = st.cols;
        refresh();
        return;
      }
      if (t.closest('[data-filters-open]')) {
        RV.openPanel($('[data-filters]'), t.closest('[data-filters-open]'));
        return;
      }
      if (t.closest('[data-filters-close]')) RV.closePanel();
    });
    view.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-sort]')) { st.sort = t.value; refresh(); }
      if (t.matches('[data-fsale]')) { st.sale = t.checked; refresh(); }
      if (t.matches('[data-fltd]')) { st.limited = t.checked; refresh(); }
    });
    view.addEventListener('input', (e) => {
      if (e.target.matches('[data-fprice]')) { st.max = +e.target.value; refresh(); }
    });
    document.addEventListener('rv:wish', () => { if (st.scope === 'favoriter' && !$('#view-shop').hidden) refresh(); });
  }

  RV.showShop = (scope) => {
    if (scope !== st.scope) {
      st.colors.clear();
      st.sale = false;
      st.limited = false;
      st.max = PRICE_MAX;
    }
    st.scope = scope || null;
    render();
    return scopeInfo(st.scope).title;
  };
  RV.initShop = bind;
})();
