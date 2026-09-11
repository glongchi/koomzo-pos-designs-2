/* Koomzo — one rail definition for the padmin-era modules and their child pages.
   A module's screen list lives HERE, once, so a parent page and its children can
   never disagree about what exists or where it lives. Every entry is a
   capability: hidden means unreachable, from any page. */
const KZ_PARAIL = {
  forms: { mark: 'clipboard', home: 'Koomzo POS - Forms.html', items: [
    ['list', 'clipboard-outline', 'Forms', null, 'Koomzo POS - Forms.html'],
    ['subs', 'albums-outline', 'Submissions', 'submissions', 'Koomzo POS - Form Submissions.html'],
    ['builder', 'construct-outline', 'Builder', 'builder', 'Koomzo POS - Form Builder.html'],
    ['ml', 'language-outline', 'Languages', 'multilingual', 'Koomzo POS - Form Builder Multilingual.html'],
  ] },
  automations: { mark: 'git-network', home: 'Koomzo POS - Automations.html', items: [
    ['list', 'git-network-outline', 'Recipes', null, 'Koomzo POS - Automations.html'],
    ['runs', 'pulse-outline', 'Runs', 'runs', 'Koomzo POS - Workflow Runs.html'],
    ['designer', 'construct-outline', 'Designer', 'designer', 'Koomzo POS - Flow Designer.html'],
    ['orch', 'options-outline', 'Orchestrator', 'designer', 'Koomzo POS - Workflow Orchestrator.html'],
  ] },
  /* Signage is one page with seven in-page views: the parent owns every screen,
     so the rail's hrefs all resolve to it and onView does the switching. */
  signage: { mark: 'tv', home: 'Koomzo Signage - Screens.html', items: [
    ['screens', 'tv-outline', 'Screens', null, 'Koomzo Signage - Screens.html'],
    ['loops', 'albums-outline', 'Playlists', 'loops', 'Koomzo Signage - Screens.html'],
    ['media', 'images-outline', 'Media', 'media', 'Koomzo Signage - Screens.html'],
    ['boards', 'pricetags-outline', 'Boards', 'boards', 'Koomzo Signage - Screens.html'],
    ['schedule', 'time-outline', 'Schedule', 'schedule', 'Koomzo Signage - Screens.html'],
    ['proof', 'stats-chart-outline', 'Proof of play', 'proofofplay', 'Koomzo Signage - Screens.html'],
  ] },
};

/* active: the id of the screen this page IS. onView/setupOn are for the parent
   page, which owns its own in-page views (list, setup) and passes them in. */
/* inPage: this module lives on ONE page, so every item is a view switch rather
   than a link — a reload would otherwise throw the user back to the core screen. */
function KzPaRail({ mid, active, badges, onView, setupOn, inPage }) {
  const def = KZ_PARAIL[mid];
  const g = (k) => !k || !window.KZ || window.KZ.on(mid, k);
  const items = def.items.filter((x) => g(x[3]));
  const b = badges || {};
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name={def.mark}></ion-icon></a>
      {items.map(([id, icon, label, , href]) => {
        const isHere = id === active;
        const cls = 'pa-rail__item' + (isHere && !setupOn ? ' active' : '');
        const dot = b[id] > 0 ? <em className="padot">{b[id] > 99 ? '99+' : b[id]}</em> : null;
        /* the page you are on is not a link to itself; an in-page view is a button */
        return (isHere || inPage) && onView
          ? <button key={id} className={cls} onClick={() => onView(id)}><ion-icon name={icon}></ion-icon>{label}{dot}</button>
          : <a key={id} className={cls} href={href}><ion-icon name={icon}></ion-icon>{label}{dot}</a>;
      })}
      <div className="pa-rail__spacer" />
      {onView
        ? <button className={'pa-rail__item' + (setupOn ? ' active' : '')} onClick={() => onView('setup')}>
            <ion-icon name="options-outline"></ion-icon>Setup</button>
        : <a className="pa-rail__item" href={def.home + '#setup'}><ion-icon name="options-outline"></ion-icon>Setup</a>}
    </nav>
  );
}
Object.assign(window, { KZ_PARAIL, KzPaRail });
