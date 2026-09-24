/* Ramverk – start och enkel hash-router (#kollektion, #kollektion-<urval>, #produkt-<id>). */
(function () {
  const RV = window.RV;
  const { $, $$, esc } = RV;
  const views = { home: $('#view-home'), shop: $('#view-shop'), product: $('#view-product') };
  let current = null;

  function show(name) {
    Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });
    if (name !== 'product') RV.hideProduct();
    current = name;
  }

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    RV.closePanel({ restore: false });
    RV.closeSearch();
    let title = null;

    if (hash.startsWith('produkt-')) {
      title = RV.showProduct(hash.slice(8));
      if (title) {
        show('product');
        window.scrollTo(0, 0);
      }
    } else if (hash === 'kollektion' || hash.startsWith('kollektion-')) {
      const prev = current;
      title = RV.showShop(hash.slice(11) || null);
      show('shop');
      if (prev !== 'shop' || window.scrollY > 400) window.scrollTo(0, 0);
    }

    if (!title) {
      const wasHome = current === 'home';
      show('home');
      title = null;
      const target = hash && document.getElementById(hash);
      if (target && views.home.contains(target)) {
        requestAnimationFrame(() => target.scrollIntoView({ behavior: wasHome && !RV.reduced() ? 'smooth' : 'auto' }));
      } else if (!wasHome || !hash) {
        window.scrollTo(0, 0);
      }
    }
    document.title = title ? `${title} · Ramverk` : 'Ramverk Posters';
    $$('.hdr__nav .nav-link').forEach((a) => {
      if (a.getAttribute('href').slice(1) === hash) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function renderMega() {
    const counts = (fn) => RV.products.filter(fn).length;
    const feat = ['solnedgang-no-3', 'fjallvarld'].map(RV.byId);
    $('[data-mega]').innerHTML = `<div class="container mega__inner">
      <div><h3>Kategorier</h3><ul>${RV.categories.map((c) => `<li><a href="#kollektion-${c.id}">${esc(c.name)} <span>${counts((p) => p.cat === c.id)}</span></a></li>`).join('')}</ul></div>
      <div><h3>Urval</h3><ul>${Object.entries(RV.collections).map(([id, c]) => `<li><a href="#kollektion-${id}">${esc(c.name)}</a></li>`).join('')}<li><a href="#kollektion">Alla posters <span>${RV.products.length}</span></a></li></ul></div>
      <div><h3>Färg</h3><ul>${RV.colors.slice(0, 6).map((c) => `<li><a href="#kollektion-farg-${c.id}">${esc(c.name)} <span>${counts((p) => p.color === c.id)}</span></a></li>`).join('')}</ul></div>
      <div class="mega__feature">${feat.map((p) => `<a class="mega__card" href="#produkt-${p.id}"><div class="mega__card-media">${RV.frameHTML(p, { frame: 'oak', mat: true })}</div><strong>${esc(p.title)}</strong><span>${esc(p.artist)}</span></a>`).join('')}</div>
    </div>`;
    $('[data-mmenu-cats]').innerHTML = RV.categories.map((c) => `<a class="chip" href="#kollektion-${c.id}">${esc(c.name)}</a>`).join('');
    // Stäng megamenyn direkt efter klick.
    $('[data-mega]').addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        const nav = $('.hdr__nav');
        nav.style.pointerEvents = 'none';
        document.activeElement?.blur();
        setTimeout(() => { nav.style.pointerEvents = ''; }, 400);
      }
    });
  }

  function headerState() {
    const hdr = $('[data-header]');
    const announce = $('.announce');
    const onScroll = () => {
      const y = window.scrollY;
      hdr.classList.toggle('is-scrolled', y > (announce?.offsetHeight || 0));
      document.documentElement.style.setProperty('--announce-h', `${Math.max(0, (announce?.offsetHeight || 0) - y)}px`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  RV.initHome();
  RV.initShop();
  RV.initProduct();
  renderMega();
  headerState();
  RV.renderCart();
  RV.updateCounts();
  window.addEventListener('hashchange', route);
  route();

  // Uppdatera hjärtan på kort när önskelistan ändras.
  document.addEventListener('rv:wish', () => {
    RV.updateCounts();
  });
})();
