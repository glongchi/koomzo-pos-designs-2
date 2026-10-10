/* Koomzo user guide — step animations.
   Markup:  <figure class="anim" data-ms="2600"> <div class="anim__stage">…scene…</div>
            <ol class="anim__steps"><li data-set="k=v k2=v2" data-put='{"#id":"text"}' data-hot="selector">Caption</li>…</ol></figure>
   data-set and data-put are cumulative (replayed from step 1, so stepping back is exact);
   data-hot marks elements for the current step only. Captions live in the page, so EN/FR need no strings here.
   Autoplays only while on screen; reduced motion = no autoplay, no movement; print = last step + all captions. */
(function () {
  const FR = (document.documentElement.lang || 'en').slice(0, 2) === 'fr';
  const L = FR ? { play: 'Lecture', pause: 'Pause', prev: 'Étape précédente', next: 'Étape suivante' }
    : { play: 'Play', pause: 'Pause', prev: 'Previous step', next: 'Next step' };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ic = (n) => '<ion-icon name="' + n + '"></ion-icon>';

  document.querySelectorAll('figure.anim').forEach((root) => {
    const stage = root.querySelector('.anim__stage');
    const steps = [...root.querySelectorAll('.anim__steps > li')];
    if (!stage || !steps.length) return;
    const ms = +root.dataset.ms || 2600;
    const keys = new Set();
    steps.forEach((li) => (li.dataset.set || '').split(/\s+/).filter(Boolean).forEach((kv) => keys.add(kv.split('=')[0])));
    const initial = {};
    stage.querySelectorAll('[id]').forEach((el) => { initial['#' + el.id] = el.textContent; });

    const bar = document.createElement('div');
    bar.className = 'anim__bar';
    bar.innerHTML = '<span class="anim__n">1</span><span class="anim__cap"></span>' +
      '<span class="anim__ctl"><button type="button" class="prev" aria-label="' + L.prev + '">' + ic('chevron-back') + '</button>' +
      '<button type="button" class="play" aria-label="' + L.pause + '">' + ic('pause') + '</button>' +
      '<button type="button" class="next" aria-label="' + L.next + '">' + ic('chevron-forward') + '</button>' +
      '<em class="anim__of">1 / ' + steps.length + '</em></span>';
    root.insertBefore(bar, root.querySelector('.anim__steps'));
    const num = bar.querySelector('.anim__n'), cap = bar.querySelector('.anim__cap'), of = bar.querySelector('.anim__of');
    const playBtn = bar.querySelector('.play');

    let i = 0, timer = null, playing = !reduce, visible = false;
    function show(n) {
      i = (n + steps.length) % steps.length;
      const st = {}, txt = Object.assign({}, initial);
      for (let j = 0; j <= i; j++) {
        (steps[j].dataset.set || '').split(/\s+/).filter(Boolean).forEach((kv) => { const p = kv.split('='); st[p[0]] = p.slice(1).join('='); });
        if (steps[j].dataset.put) { try { Object.assign(txt, JSON.parse(steps[j].dataset.put)); } catch (e) {} }
      }
      keys.forEach((k) => { if (st[k] != null) root.setAttribute('data-' + k, st[k]); else root.removeAttribute('data-' + k); });
      Object.keys(txt).forEach((sel) => { const el = stage.querySelector(sel); if (el) el.textContent = txt[sel]; });
      stage.querySelectorAll('.hot').forEach((el) => el.classList.remove('hot'));
      if (steps[i].dataset.hot) stage.querySelectorAll(steps[i].dataset.hot).forEach((el) => el.classList.add('hot'));
      steps.forEach((li, j) => li.classList.toggle('on', j === i));
      num.textContent = i + 1; of.textContent = (i + 1) + ' / ' + steps.length;
      cap.innerHTML = steps[i].innerHTML;
    }
    function tick() { clearTimeout(timer); if (playing && visible) timer = setTimeout(() => { show(i + 1); tick(); }, ms); }
    function setPlay(p) { playing = p; playBtn.innerHTML = ic(p ? 'pause' : 'play'); playBtn.setAttribute('aria-label', p ? L.pause : L.play); tick(); }
    bar.querySelector('.prev').addEventListener('click', () => { setPlay(false); show(i - 1); });
    bar.querySelector('.next').addEventListener('click', () => { setPlay(false); show(i + 1); });
    playBtn.addEventListener('click', () => setPlay(!playing));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; tick(); }, { threshold: 0.35 }).observe(root);
    } else { visible = true; }
    window.addEventListener('beforeprint', () => { clearTimeout(timer); show(steps.length - 1); });
    if (reduce) { playing = false; playBtn.innerHTML = ic('play'); }
    show(0); tick();
  });
})();
