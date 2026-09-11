/* Koomzo Signage — presenter. One page, seven views, derived rail.
   Screens is the core and can never be hidden; every other view is a capability,
   so a Lite tenant simply has fewer rail items — no dead links, no empty pages. */
const { useState, useMemo, useEffect } = React;

const SG_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#8d3fb0",
  "device": "desktop",
  "site": "all"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(SG_TWEAKS);
  const device = t.device;
  const isPhone = device === 'phone';
  const [view, setView] = useState('screens');
  const [phoneView, setPhoneView] = useState('screens');
  const [toast, setToast] = useState(null);
  const [players, setPlayers] = useState(window.KZ_SG_PLAYERS);
  const [playlists, setPlaylists] = useState(window.KZ_SG_PLAYLISTS);
  const [openId, setOpenId] = useState(null);
  const [takeover, setTakeover] = useState(false);
  const [site, setSite] = useState('all');
  const [filter, setFilter] = useState(null);
  const [, bumpCaps] = useState(0);

  useEffect(() => { if (!window.KZ) return; return window.KZ.subscribe(() => bumpCaps((n) => n + 1)); }, []);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2600); return () => clearTimeout(i); }, [toast]);
  useEffect(() => { setView('screens'); setOpenId(null); }, [device]);

  /* a capability that closes takes its view with it — never a dead rail item */
  const capOf = { loops:'loops', media:'media', boards:'boards', schedule:'schedule', proof:'proofofplay' };
  useEffect(() => {
    const need = capOf[view];
    if (need && window.KZ && !window.KZ.on('signage', need)) setView('screens');
  });

  const shown = useMemo(() => players.filter((p) => (site === 'all' || p.siteId === site) && (!filter || p.state === filter)), [players, site, filter]);
  const inSite = site === 'all' ? players : players.filter((p) => p.siteId === site);
  const offline = inSite.filter((p) => p.state === 'offline');
  const stale = inSite.filter((p) => p.state === 'stale_cache');
  const unpaired = inSite.filter((p) => p.state === 'unpaired');
  const openPlayer = openId ? players.find((p) => p.id === openId) : null;

  /* attention: three rules, each gated by the screen it lands on (Screens = core) */
  const badges = { screens: players.filter((p) => p.state === 'offline' || p.state === 'stale_cache').length + (takeover ? 1 : 0) };

  const assign = (pid, plid) => setPlayers((cur) => cur.map((p) => p.id === pid ? { ...p, playlistId: plid, state: p.state === 'stale_cache' ? 'playing' : p.state } : p));
  const publish = (plid) => setPlaylists((cur) => cur.map((p) => p.id === plid ? { ...p, status: 'published', version: p.version + 1 } : p));

  const crumb = { screens:'Écrans', loops:'Playlists', media:'Media', boards:'Boards', schedule:'Horaires', proof:'Diffusions', setup:'Setup' }[view];
  const accentStyle = { '--kz-primary': t.accent };

  if (isPhone) {
    return (
      <div className="stage phone" style={accentStyle}>
        <div className="rt-wrap">
          <div className="pa-app sg-app is-phone" style={accentStyle}>
            <window.SgPhone players={shown} view={phoneView} onView={setPhoneView} onOpen={setOpenId} takeover={takeover} onToast={setToast} />
            <window.SgDrawer p={openPlayer} onClose={() => setOpenId(null)} onAssign={assign} onToast={setToast} />
            <SgTweaks t={t} setTweak={setTweak} />
            {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
      <div className="rt-wrap">
        <div className={'pa-app sg-app' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>
          <KzPaRail mid="signage" active={view === 'setup' ? 'screens' : view} badges={badges} inPage
            onView={(v) => { setView(v); setOpenId(null); }} setupOn={view === 'setup'} />

          <div className="pa-main">
            <window.SgTopbar crumb={crumb} />

            {view === 'setup' && <div className="pa-setupwrap"><ModuleSetup mid="signage" embedded /></div>}

            {view !== 'setup' && (
              <div className="pa-pagehead">
                <div className="pa-pagehead__t">
                  <span className="pa-eyebrow">{view === 'screens' ? 'Parc d’écrans' : view === 'proof' ? 'Historique' : 'Contenu'}</span>
                  <h1>{crumb}{view === 'screens' && <span className="count">{shown.length}</span>}</h1>
                </div>
                <div className="pa-pagehead__actions">
                  {view === 'screens' && (
                    <>
                      <select className="pa-select" value={site} onChange={(e) => setSite(e.target.value)} style={{ height: 42 }}>
                        <option value="all">Tous les sites</option>
                        {window.KZ_SG_SITES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button className="pa-btn primary" onClick={() => setToast('Un code s’affichera sur l’écran')}><ion-icon name="add-outline"></ion-icon>Apparier un écran</button>
                    </>
                  )}
                  {view === 'proof' && <button className="pa-btn" onClick={() => setToast('Export CSV')}><ion-icon name="download-outline"></ion-icon>Exporter</button>}
                </div>
              </div>
            )}

            {view === 'screens' && (
              <>
                <div className="sg-scroll">
                <window.SgStats players={shown} />
                {(takeover || offline.length > 0 || stale.length > 0 || unpaired.length > 0) && (
                  <div className="sg-alerts">
                    {takeover && (
                      <div className="sg-alert over">
                        <ion-icon name="megaphone-outline"></ion-icon>
                        <div><b>Prise de contrôle active</b> sur tous les sites — aucune heure de fin définie.</div>
                        <div className="sg-alert__act"><button onClick={() => { setTakeover(false); setToast('Diffusion normale rétablie'); }}>Y mettre fin</button></div>
                      </div>
                    )}
                    {offline.length > 0 && (
                      <div className="sg-alert bad">
                        <ion-icon name="cloud-offline-outline"></ion-icon>
                        <div>
                          <b>{offline.length === 1 ? offline[0].label : offline.length + ' écrans hors ligne'}</b>
                          {offline.length === 1 ? ' — aucun battement depuis ' + window.SGF.ago(offline[0].lastSeenMin) + '.' : ' — plus aucun battement.'} Chacun joue son cache, rien n’est noir.
                        </div>
                        <div className="sg-alert__act"><button className={filter === 'offline' ? 'on' : ''} onClick={() => setFilter(filter === 'offline' ? null : 'offline')}>{filter === 'offline' ? 'Tout voir' : 'Voir'}</button></div>
                      </div>
                    )}
                    {stale.length > 0 && (
                      <div className="sg-alert warn">
                        <ion-icon name="warning-outline"></ion-icon>
                        <div>
                          <b>{stale.length === 1 ? stale[0].label : stale.length + ' écrans'}</b> {stale.length === 1 ? 'joue' : 'jouent'} encore une version précédente — cache presque plein.
                        </div>
                        <div className="sg-alert__act"><button className={filter === 'stale_cache' ? 'on' : ''} onClick={() => setFilter(filter === 'stale_cache' ? null : 'stale_cache')}>{filter === 'stale_cache' ? 'Tout voir' : 'Voir'}</button></div>
                      </div>
                    )}
                    {unpaired.length > 0 && (
                      <div className="sg-alert">
                        <ion-icon name="link-outline" style={{ color: 'var(--kz-muted-2)' }}></ion-icon>
                        <div><b>{unpaired.length === 1 ? unpaired[0].label : unpaired.length + ' écrans'}</b> {unpaired.length === 1 ? 'attend' : 'attendent'} un code — il expire dans 10 minutes.</div>
                        <div className="sg-alert__act"><button className={filter === 'unpaired' ? 'on' : ''} onClick={() => setFilter(filter === 'unpaired' ? null : 'unpaired')}>{filter === 'unpaired' ? 'Tout voir' : 'Apparier'}</button></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="sg-fleet">
                  {shown.map((p) => <window.SgCard key={p.id} p={p} onOpen={setOpenId} takeover={takeover} />)}
                </div>
                </div>
              </>
            )}

            {view === 'loops' && <window.SgPlaylists playlists={playlists} players={players} onPublish={publish} onToast={setToast} />}
            {view === 'media' && <window.SgMedia onToast={setToast} />}
            {view === 'boards' && <window.SgBoards onToast={setToast} />}
            {view === 'schedule' && <window.SgSchedule onToast={setToast} takeover={takeover} onTakeover={setTakeover} />}
            {view === 'proof' && <window.SgProof />}
          </div>

          <window.SgDrawer p={openPlayer} onClose={() => setOpenId(null)} onAssign={assign} onToast={setToast} />
          <SgTweaks t={t} setTweak={setTweak} />
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
        </div>
      </div>
    </div>
  );
}

function SgTweaks({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Preview" />
      <TweakRadio label="Device" value={t.device}
        options={[{ value:'desktop', label:'Desktop' }, { value:'tablet', label:'Tablet' }, { value:'phone', label:'Phone' }]}
        onChange={(v) => setTweak('device', v)} />
      <TweakSection label="Brand" />
      <TweakColor label="App accent" value={t.accent}
        options={['#8d3fb0', '#6a61bf', '#4b4ad9', '#303b57']}
        onChange={(v) => setTweak('accent', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
