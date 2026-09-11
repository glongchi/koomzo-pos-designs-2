/* Koomzo POS — Apps marketplace: app state, device presenter, composition.
   "Choose your apps" board across three surfaces (desktop / tablet / phone)
   on a shared selection store seeded from the installed baseline. */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const AM_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "cardStyle": "tinted"
}/*EDITMODE-END*/;

const AM_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

function AmStage({ w, h, className, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - 52;
      const availH = window.innerHeight - 56 - 52;
      setScale(Math.min(1, availW / w, availH / h));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(AM_TWEAKS);
  const [device, setDevice] = useState('desktop');

  const categories = window.KZ_APP_CATEGORIES;
  const apps = window.KZ_APPS;
  const installedSet = useMemo(() => new Set(window.kz_installedIds()), []);

  // active selection (seeded from installed). this is the working set.
  const [selected, setSelected] = useState(() => new Set(window.kz_installedIds()));
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all'); // phone only
  const [detailId, setDetailId] = useState(null);

  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';

  useEffect(() => { setDetailId(null); }, [device]);
  useEffect(() => { if (!isPhone) setActiveCat('all'); }, [isPhone]);

  const appsByCat = (catId) => apps.filter((a) => a.cat === catId);

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectMany = (ids, on) => setSelected((s) => {
    const n = new Set(s);
    ids.forEach((id) => on ? n.add(id) : n.delete(id));
    return n;
  });

  /* delta vs installed baseline */
  const { addCount, remCount, pending, totalActive } = useMemo(() => {
    let add = 0, rem = 0;
    selected.forEach((id) => { if (!installedSet.has(id)) add++; });
    installedSet.forEach((id) => { if (!selected.has(id)) rem++; });
    return { addCount: add, remCount: rem, pending: add + rem, totalActive: selected.size };
  }, [selected, installedSet]);

  const reset = () => setSelected(new Set(window.kz_installedIds()));
  const apply = () => {
    if (pending === 0) return;
    const parts = [];
    if (addCount) parts.push(`install ${addCount} app${addCount > 1 ? 's' : ''}`);
    if (remCount) parts.push(`remove ${remCount} app${remCount > 1 ? 's' : ''}`);
    alert(`Applying changes: ${parts.join(' and ')}.\nYour register will reload with ${totalActive} active app${totalActive > 1 ? 's' : ''}.`);
  };

  const openDetail = (id) => setDetailId(id);
  const closeDetail = () => setDetailId(null);
  const detailApp = detailId ? apps.find((a) => a.id === detailId) : null;

  const accentStyle = { '--kz-primary': t.accent };
  const dev = AM_DEVICES[device];
  const appClass = `pa-app ${isTablet ? 'is-tablet' : ''}`;

  const detailNode = detailApp && (
    <AppDetail app={detailApp} on={selected.has(detailApp.id)} installed={installedSet.has(detailApp.id)}
      isPhone={isPhone} onToggle={toggle} onClose={closeDetail} />
  );

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={appClass} style={accentStyle}>
          {isPhone ? (
            <>
              <MobileApps
                categories={categories} appsByCat={appsByCat} selected={selected} installedSet={installedSet}
                query={query} onQuery={setQuery} activeCat={activeCat} onCat={setActiveCat}
                onToggle={toggle} onInfo={openDetail}
                pending={pending} addCount={addCount} totalActive={totalActive} onApply={apply}
              />
              {detailApp && <div className="amm__detail">{detailNode}</div>}
            </>
          ) : (
            <>
              <AmRail />
              <div className="pa-main">
                <AmTopbar />

                <div className="pa-pagehead">
                  <div className="pa-pagehead__t">
                    <span className="pa-eyebrow">Setup</span>
                    <h1>Choose your apps <span className="count">{totalActive} active</span></h1>
                  </div>
                  <div className="pa-pagehead__actions">
                    <button className="pa-btn" onClick={() => alert('Browse the full Koomzo app store.')}>
                      <ion-icon name="storefront-outline"></ion-icon>App store
                    </button>
                    <button className="pa-btn" onClick={() => alert('Filter by what is already installed.')}>
                      <ion-icon name="options-outline"></ion-icon>Installed only
                    </button>
                  </div>
                </div>

                <div className="pa-toolbar">
                  <label className="pa-search">
                    <ion-icon name="search-outline"></ion-icon>
                    <input placeholder="Search apps by name or what they do" value={query} onChange={(e) => setQuery(e.target.value)} />
                    {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
                  </label>
                  <div className="pa-toolbar__right">
                    <span style={{ font: '500 13px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>
                      {window.KZ_APPS.length} apps · {categories.length} categories
                    </span>
                  </div>
                </div>

                <AmBoard
                  categories={categories} appsByCat={appsByCat} selected={selected} installedSet={installedSet}
                  onToggle={toggle} onInfo={openDetail} onSelectAll={selectMany}
                  query={query} cardStyle={t.cardStyle}
                />

                <div className={'am-bar' + (pending > 0 ? ' pending' : '')}>
                  {pending > 0 ? (
                    <>
                      <div className="am-bar__sum">
                        <div className="am-bar__count">
                          <b>{totalActive}</b>
                          <span>apps will be active</span>
                        </div>
                        <div className="am-bar__chips">
                          {addCount > 0 && <span className="am-delta add"><ion-icon name="add-outline"></ion-icon>{addCount} to install</span>}
                          {remCount > 0 && <span className="am-delta rem"><ion-icon name="remove-outline"></ion-icon>{remCount} to remove</span>}
                        </div>
                      </div>
                      <div className="am-bar__actions">
                        <button className="am-bar__reset" onClick={reset}><ion-icon name="refresh-outline"></ion-icon>Reset</button>
                        <button className="am-bar__apply" onClick={apply}><ion-icon name="checkmark-done-outline"></ion-icon>Apply changes</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="am-bar__sum">
                        <div className="am-bar__count">
                          <b>{totalActive}</b>
                          <span>apps active on this register</span>
                        </div>
                      </div>
                      <div className="am-bar__actions">
                        <span className="am-bar__saved"><ion-icon name="checkmark-circle"></ion-icon>All changes saved</span>
                        <button className="am-bar__manage" onClick={() => alert('Manage billing for installed add-ons.')}>
                          <ion-icon name="card-outline"></ion-icon>Manage plan
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {detailApp && (
                <>
                  <div className="pa-scrim" onClick={closeDetail} />
                  <div className="pa-drawer" style={accentStyle}>{detailNode}</div>
                </>
              )}
            </>
          )}

          <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]} onChange={setDevice} />
            <TweakSection label="Brand" />
            <TweakColor label="Accent color" value={t.accent}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('accent', v)} />
            <TweakSection label="App cards" />
            <TweakRadio label="Icon style" value={t.cardStyle}
              options={[{ value: 'tinted', label: 'Tinted tile' }, { value: 'minimal', label: 'Outlined' }]}
              onChange={(v) => setTweak('cardStyle', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
