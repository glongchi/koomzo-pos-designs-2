/* Koomzo user guide — "one restaurant, several devices" diagram.
   One order of events loops; the Internet toggle shows that service never waits on the cloud.
   Strings follow <html lang>: en (default) or fr. */
/* page links: project names in the editor, short names once published (index.html, fr.html, hotel.html, fr-hotel.html …) */
(function () {
  const published = !/Koomzo/.test(decodeURIComponent(location.pathname));
  const NAME = { restaurant: 'Restaurant', hotel: 'Hotel', retail: 'Retail Flex', inventory: 'Inventory', signage: 'Signage', salon: 'Salon', gym: 'Gym', queue: 'Queue' };
  const href = (lang, page) => {
    if (published) return (lang === 'fr' ? (page === 'hub' ? 'fr' : 'fr-' + page) : (page === 'hub' ? 'index' : page)) + '.html';
    const base = lang === 'fr' ? 'Koomzo Guide utilisateur' : 'Koomzo User Guide';
    return base + (page === 'hub' ? '' : ' - ' + NAME[page]) + '.html';
  };
  const here = document.body.dataset.page || 'hub';
  const lang = (document.documentElement.lang || 'en').slice(0, 2);
  document.querySelectorAll('[data-lang-link]').forEach((a) => { a.href = href(a.dataset.langLink, here) + location.hash; });
  document.querySelectorAll('a[data-page]').forEach((a) => {
    const m = /#.*/.exec(a.getAttribute('href') || '');
    a.href = href(lang, a.dataset.page) + (m ? m[0] : '');
  });
  /* old links into the single-page guide (#rk…, #s-…) now live on the Restaurant page */
  if (here === 'hub' && /^#(rk|s-)/.test(location.hash)) location.replace(href(lang, 'restaurant') + location.hash);
})();

(function () {
  const root = document.getElementById('net');
  if (!root) return;
  const dot = root.querySelector('.dot');
  const cap = root.querySelector('.net__cap span:not(.net__n)');
  const num = root.querySelector('.net__n');
  const badge = root.querySelector('.node.main .node__badge');
  const netChip = root.querySelector('.net__net');
  const btn = root.querySelector('.net__btn');
  const P = {};
  root.querySelectorAll('.node').forEach((n) => { P[n.dataset.id] = { x: parseFloat(n.style.left), y: parseFloat(n.style.top), el: n }; });

  const L = {
    en: {
      steps: [
        'Grace takes Table 4\u2019s order on her phone and taps Send.',
        'The main device saves it and the kitchen screen shows it at once.',
        'At the counter, a customer orders a Poulet DG on the kiosk.',
        'It joins the same kitchen queue, in order.',
        'The cook taps Ready.',
        'Grace\u2019s phone shows Table 4 is ready to serve.',
        'Table 4 pays 9 500 F by MoMo and cash. The table is cleared.',
        'Mama changes a price \u2014 the menu board on the TV updates.',
        'Everything is backed up to the Koomzo cloud.',
      ],
      waiting: (n) => n + ' waiting',
      offline: 'No internet \u2014 saved on the main device and waiting. Service carries on.',
      back: (n) => 'Back online \u2014 ' + n + ' waiting change' + (n > 1 ? 's' : '') + ' sent automatically.',
      cut: 'Cut the internet', restore: 'Bring the internet back', on: 'Internet on', off: 'Internet off',
    },
    fr: {
      steps: [
        'Grace prend la commande de la table 4 sur son t\u00e9l\u00e9phone et appuie sur Envoyer.',
        'L\u2019appareil principal l\u2019enregistre et l\u2019\u00e9cran cuisine l\u2019affiche aussit\u00f4t.',
        'Au comptoir, un client commande un Poulet DG sur la borne.',
        'La commande rejoint la m\u00eame file en cuisine, dans l\u2019ordre.',
        'Le cuisinier appuie sur Pr\u00eat.',
        'Le t\u00e9l\u00e9phone de Grace indique que la table 4 est pr\u00eate \u00e0 servir.',
        'La table 4 paie 9 500 F en MoMo et en esp\u00e8ces. La table est lib\u00e9r\u00e9e.',
        'Mama change un prix \u2014 l\u2019\u00e9cran menu sur la t\u00e9l\u00e9 se met \u00e0 jour.',
        'Tout est sauvegard\u00e9 dans le cloud Koomzo.',
      ],
      waiting: (n) => n + ' en attente',
      offline: 'Pas d\u2019internet \u2014 enregistr\u00e9 sur l\u2019appareil principal, en attente. Le service continue.',
      back: (n) => 'Internet revenu \u2014 ' + n + ' modification' + (n > 1 ? 's' : '') + ' envoy\u00e9e' + (n > 1 ? 's' : '') + ' automatiquement.',
      cut: 'Couper internet', restore: 'R\u00e9tablir internet', on: 'Internet actif', off: 'Internet coup\u00e9',
    },
  };
  const T = L[(document.documentElement.lang || 'en').slice(0, 2)] || L.en;
  const ROUTE = [['phone', 'main'], ['main', 'kitchen'], ['kiosk', 'main'], ['main', 'kitchen'], ['kitchen', 'main'], ['main', 'phone'], ['phone', 'main', 'money'], ['main', 'tv'], ['main', 'cloud']];

  let i = 0, waiting = 0, online = true, timer = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const line = (a, b) => root.querySelector('line[data-l="' + [a, b].sort().join('-') + '"]');
  const place = (id) => { dot.style.left = P[id].x + '%'; dot.style.top = P[id].y + '%'; };
  const clear = () => { root.querySelectorAll('line.on').forEach((l) => l.classList.remove('on')); root.querySelectorAll('.node.hot').forEach((n) => n.classList.remove('hot')); };
  const setBadge = () => { badge.textContent = T.waiting(waiting); badge.classList.toggle('show', waiting > 0); };
  const ic = (name, text) => '<ion-icon name="' + name + '"></ion-icon>' + text;

  function step() {
    const [a, b, kind] = ROUTE[i];
    clear();
    num.textContent = i + 1;
    dot.classList.toggle('money', kind === 'money');
    dot.style.transition = 'none'; place(a); void dot.offsetWidth; dot.style.transition = '';
    dot.classList.add('show');
    P[a].el.classList.add('hot');
    if (b === 'cloud' && !online) {
      waiting += 3; setBadge();
      cap.textContent = T.offline;
      setTimeout(() => { dot.style.left = (P.main.x + P.cloud.x) / 2 + '%'; dot.style.top = (P.main.y + P.cloud.y) / 2 + '%'; }, 40);
      setTimeout(() => dot.classList.remove('show'), 950);
    } else {
      const l = line(a, b);
      if (l) l.classList.add('on');
      cap.textContent = T.steps[i];
      setTimeout(() => place(b), reduce ? 0 : 40);
      setTimeout(() => { P[b].el.classList.add('hot'); dot.classList.remove('show'); }, reduce ? 300 : 950);
    }
    i = (i + 1) % ROUTE.length;
    timer = setTimeout(step, 2300);
  }

  btn.addEventListener('click', () => {
    online = !online;
    btn.classList.toggle('on', !online);
    btn.innerHTML = online ? ic('cloud-offline-outline', T.cut) : ic('cloud-done-outline', T.restore);
    netChip.classList.toggle('off', !online);
    netChip.innerHTML = online ? ic('cloud-done-outline', T.on) : ic('cloud-offline-outline', T.off);
    line('main', 'cloud').classList.toggle('cut', !online);
    if (online && waiting) {
      clearTimeout(timer); clear();
      line('main', 'cloud').classList.add('on');
      cap.textContent = T.back(waiting);
      dot.style.transition = 'none'; place('main'); void dot.offsetWidth; dot.style.transition = '';
      dot.classList.add('show'); setTimeout(() => place('cloud'), 40);
      setTimeout(() => { dot.classList.remove('show'); waiting = 0; setBadge(); }, 950);
      timer = setTimeout(step, 2600);
    }
  });

  step();
})();
