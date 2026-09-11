/* Koomzo POS — Apps marketplace: presentational components.
   Desktop/tablet: nav rail + topbar + category board of selectable cards
   + app detail drawer. Phone: header + chips + stacked card sections.
   Selection state lives in the app shell; these are presentational. */

/* ---- small atoms ---- */
function AppFlag({ app }) {
  if (app.core) return <span className="am-flag core">Core</span>;
  if (app.flag === 'popular') return <span className="am-flag popular">Popular</span>;
  if (app.flag === 'new') return <span className="am-flag new">New</span>;
  return null;
}

function AppPrice({ app }) {
  if (app.price == null) {
    return <span className="am-incl"><ion-icon name="checkmark-circle"></ion-icon>Included</span>;
  }
  return <span className="am-price">{window.KZ_LOCALE.short(app.price)}<small>/mo · register</small></span>;
}

/* ============================================================
   DESKTOP / TABLET — chrome
   ============================================================ */
function AmRail() {
  const items = [
    { icon: 'cart-outline', label: 'Register' },
    { icon: 'receipt-outline', label: 'Orders' },
    { icon: 'pricetags-outline', label: 'Products' },
    { icon: 'people-outline', label: 'Customers' },
    { icon: 'grid-outline', label: 'Apps', active: true },
    { icon: 'bar-chart-outline', label: 'Reports' },
  ];
  return (
    <nav className="pa-rail">
      <div className="pa-rail__mark"><ion-icon name="storefront"></ion-icon></div>
      {items.map((it) => (
        <button key={it.label} className={'pa-rail__item' + (it.active ? ' active' : '')}>
          <ion-icon name={it.icon}></ion-icon>{it.label}
        </button>
      ))}
      <div className="pa-rail__spacer" />
      <button className="pa-rail__item"><ion-icon name="settings-outline"></ion-icon>Settings</button>
    </nav>
  );
}

function AmTopbar() {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="construct-outline"></ion-icon>
        Setup
        <ion-icon name="chevron-forward-outline"></ion-icon>
        <b>Apps</b>
      </div>
      <div className="pa-topbar__right">
        <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
        <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
        <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* ============================================================
   DESKTOP / TABLET — app card
   ============================================================ */
function AppCard({ app, on, installed, onToggle, onInfo }) {
  return (
    <div className={'am-card' + (on ? ' on' : '')} onClick={() => onToggle(app.id)}>
      <div className="am-card__ico" style={{ background: app.tint.bg, color: app.tint.fg }}>
        <ion-icon name={app.icon}></ion-icon>
      </div>
      <div className="am-card__body">
        <div className="am-card__name">{app.name}<AppFlag app={app} /></div>
        <div className="am-card__desc">{app.desc}</div>
        <div className="am-card__meta">
          {installed
            ? <span className="am-installed"><ion-icon name="checkmark-circle"></ion-icon>Installed</span>
            : <AppPrice app={app} />}
          <span className="am-dot" />
          <span className="am-card__tag" style={{ font: '600 11px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{app.tag}</span>
        </div>
      </div>
      <span className="am-check"><ion-icon name="checkmark-outline"></ion-icon></span>
      <button className="am-info" title="App details" onClick={(e) => { e.stopPropagation(); onInfo(app.id); }}>
        <ion-icon name="information-outline"></ion-icon>
      </button>
    </div>
  );
}

/* ============================================================
   DESKTOP / TABLET — category board
   ============================================================ */
function AmBoard({ categories, appsByCat, selected, installedSet, onToggle, onInfo, onSelectAll, query, cardStyle }) {
  const visibleCats = categories
    .map((c) => ({ cat: c, apps: appsByCat(c.id).filter((a) => matchesQuery(a, query)) }))
    .filter((g) => g.apps.length > 0);

  if (visibleCats.length === 0) {
    return (
      <div className="pa-empty" style={{ paddingTop: 80 }}>
        <ion-icon name="search-outline"></ion-icon>
        <p>No apps match “{query}”.</p>
      </div>
    );
  }

  return (
    <div className={'am-board' + (cardStyle === 'minimal' ? ' am-min' : '')}>
      {visibleCats.map(({ cat, apps }) => {
        const onCount = apps.filter((a) => selected.has(a.id)).length;
        const allOn = onCount === apps.length;
        return (
          <section className="am-cat" key={cat.id}>
            <div className="am-cat__head">
              <div className="am-cat__ico"><ion-icon name={cat.icon}></ion-icon></div>
              <div className="am-cat__t">
                <h2>{cat.label}<span className="n">{onCount}/{apps.length}</span></h2>
                <span className="blurb">{cat.blurb}</span>
              </div>
              <div className="am-cat__line" />
              <button className="am-cat__all" onClick={() => onSelectAll(apps.map((a) => a.id), !allOn)}>
                <ion-icon name={allOn ? 'remove-circle-outline' : 'add-circle-outline'}></ion-icon>
                {allOn ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="am-grid">
              {apps.map((a) => (
                <AppCard key={a.id} app={a} on={selected.has(a.id)} installed={installedSet.has(a.id)}
                  onToggle={onToggle} onInfo={onInfo} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function matchesQuery(app, q) {
  const s = (q || '').trim().toLowerCase();
  if (!s) return true;
  return (app.name + ' ' + app.desc + ' ' + app.tag + ' ' + app.long).toLowerCase().includes(s);
}

/* ============================================================
   SHARED — app detail (drawer body on desktop, full screen on phone)
   ============================================================ */
function AppDetail({ app, on, installed, isPhone, onToggle, onClose }) {
  return (
    <div className="pd">
      <div className="pd__head">
        {isPhone ? <button className="pd__back" onClick={onClose}><ion-icon name="chevron-back-outline"></ion-icon></button> : null}
        <div>
          <div className="eyebrow">App details</div>
          <h2>{app.name}</h2>
        </div>
        {!isPhone && <button className="pd__close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>}
      </div>

      <div className="pd__body">
        <div className="amd-hero">
          <div className="amd-hero__ico" style={{ background: app.tint.bg, color: app.tint.fg }}>
            <ion-icon name={app.icon}></ion-icon>
          </div>
          <div className="amd-hero__t">
            <h3>{app.name}</h3>
            <div className="amd-hero__meta">
              {installed && <span className="am-installed"><ion-icon name="checkmark-circle"></ion-icon>Installed</span>}
              <AppFlag app={app} />
              <span className="am-flag core" style={{ background: 'var(--kz-surface-2)' }}>{app.tag}</span>
            </div>
          </div>
        </div>

        <p className="amd-long">{app.long}</p>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="sparkles-outline"></ion-icon>What's included</div>
          {app.feats.map((f) => (
            <div className="amd-feat" key={f}>
              <span className="amd-feat__ck"><ion-icon name="checkmark-outline"></ion-icon></span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div className="amd-pricerow">
          <span className="k">{app.price == null ? 'Plan' : 'Add-on price'}</span>
          {app.price == null
            ? <span className="v free">Included</span>
            : <span className="v">{window.KZ_LOCALE.short(app.price)}<small> /mo · per register</small></span>}
        </div>
      </div>

      <div className="pd__foot">
        {isPhone ? <button className="pd__cancel" onClick={onClose}>Close</button> : null}
        <button className={'pd__toggle' + (on ? ' on' : '')} onClick={() => onToggle(app.id)}>
          <ion-icon name={on ? 'checkmark-outline' : 'add-outline'}></ion-icon>
          {on ? (installed ? 'Installed — remove' : 'Selected — remove') : (installed ? 'Re-add to install' : 'Add to selection')}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PHONE — app sections
   ============================================================ */
function MobileApps({ categories, appsByCat, selected, installedSet, query, onQuery, activeCat, onCat,
                      onToggle, onInfo, pending, addCount, totalActive, onApply, segment }) {
  const cats = activeCat === 'all' ? categories : categories.filter((c) => c.id === activeCat);
  const groups = cats
    .map((c) => ({ cat: c, apps: appsByCat(c.id).filter((a) => matchesQuery(a, query)) }))
    .filter((g) => g.apps.length > 0);

  return (
    <div className="amm">
      <header className="amm__head">
        <div className="mk"><ion-icon name="storefront"></ion-icon></div>
        <div className="ht">
          <h1>Apps</h1>
          <span className="sub">{totalActive} active · {window.KZ_APPS.length} available</span>
        </div>
      </header>

      <label className="amm__search">
        <ion-icon name="search-outline"></ion-icon>
        <input placeholder="Search apps" value={query} onChange={(e) => onQuery(e.target.value)} />
        {query && <button style={{ border: 'none', background: 'transparent', color: 'var(--kz-muted-3)' }} onClick={() => onQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
      </label>

      <div className="amm__cats">
        <button className={'amm__chip' + (activeCat === 'all' ? ' active' : '')} onClick={() => onCat('all')}>
          <ion-icon name="grid-outline"></ion-icon>All
        </button>
        {categories.map((c) => (
          <button key={c.id} className={'amm__chip' + (activeCat === c.id ? ' active' : '')} onClick={() => onCat(c.id)}>
            <ion-icon name={c.icon}></ion-icon>{c.label}
          </button>
        ))}
      </div>

      <div className="amm__list">
        {groups.length === 0 && (
          <div className="pa-empty" style={{ paddingTop: 70 }}><ion-icon name="search-outline"></ion-icon><p>No apps match.</p></div>
        )}
        {groups.map(({ cat, apps }) => {
          const onCount = apps.filter((a) => selected.has(a.id)).length;
          return (
            <section className="amm__sec" key={cat.id}>
              <div className="amm__sec-h">
                <ion-icon name={cat.icon}></ion-icon>
                <b>{cat.label}</b>
                <span className="n">{onCount}/{apps.length}</span>
              </div>
              {apps.map((a) => {
                const isOn = selected.has(a.id);
                const inst = installedSet.has(a.id);
                return (
                  <div key={a.id} className={'amm__card' + (isOn ? ' on' : '')} onClick={() => onToggle(a.id)}>
                    <div className="amm__card-ico" style={{ background: a.tint.bg, color: a.tint.fg }}>
                      <ion-icon name={a.icon}></ion-icon>
                    </div>
                    <div className="amm__card-body" onClick={(e) => { e.stopPropagation(); onInfo(a.id); }}>
                      <div className="nm">{a.name}<AppFlag app={a} /></div>
                      <div className="ds">{a.desc}</div>
                      <div className="mt">
                        {inst
                          ? <span className="am-installed"><ion-icon name="checkmark-circle"></ion-icon>Installed</span>
                          : <AppPrice app={a} />}
                      </div>
                    </div>
                    <span className="amm__card-check"><ion-icon name="checkmark-outline"></ion-icon></span>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <div className="amm__bar">
        <div className="amm__bar-sum">
          <b>{totalActive} active</b>
          <span>{pending > 0 ? `${addCount > 0 ? '+' + addCount + ' to add' : ''}${addCount > 0 && pending - addCount > 0 ? ' · ' : ''}${pending - addCount > 0 ? (pending - addCount) + ' to remove' : ''}` : 'No pending changes'}</span>
        </div>
        <button className="amm__bar-btn" disabled={pending === 0} onClick={onApply}>
          <ion-icon name="checkmark-done-outline"></ion-icon>{pending > 0 ? 'Apply' : 'Saved'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  AppFlag, AppPrice, AmRail, AmTopbar, AppCard, AmBoard, AppDetail, MobileApps, matchesQuery,
});
