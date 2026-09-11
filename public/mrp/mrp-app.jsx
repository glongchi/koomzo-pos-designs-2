/* Koomzo MRP — shell. Off / Lite / Full is the same data model; the tier only
   decides which screens exist. Language is a global the render reads. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "full",
  "device": "desktop",
  "lang": "en",
  "net": "online"
}/*EDITMODE-END*/;

const CAPS_FULL = MRP_CAPS.reduce((a, c) => ({ ...a, [c.key]: true }), {});
const CAPS_LITE = MRP_CAPS.reduce((a, c) => ({ ...a, [c.key]: MRP_LITE.includes(c.key) }), {});
const CAPS_OFF = MRP_CAPS.reduce((a, c) => ({ ...a, [c.key]: false }), {});

const NAV = [
  { id:'plan',   label:'Plan',      icon:'git-commit-outline',      cap:'planning' },
  { id:'orders', label:'Orders',    icon:'construct-outline' },
  { id:'boms',   label:'BOMs',      icon:'git-network-outline' },
  { id:'floor',  label:'Floor',     icon:'phone-portrait-outline',  cap:'floor' },
  { id:'mats',   label:'Materials', icon:'cube-outline' },
  { id:'cap',    label:'Capacity',  icon:'speedometer-outline',     cap:'capacity' },
  { id:'qc',     label:'Quality',   icon:'checkmark-done-outline',  cap:'quality' },
  { id:'costs',  label:'Costs',     icon:'calculator-outline',      cap:'costing' },
];

function App() {
  const boot = window.MR_BOOT || {};
  const [t, setTweak] = useTweaks(Object.assign({}, TWEAK_DEFAULTS, boot.tweaks || {}));
  const [caps, setCaps] = useState(() => ({ ...(t.mode === 'lite' ? CAPS_LITE : t.mode === 'off' ? CAPS_OFF : CAPS_FULL) }));
  const [view, setView] = useState(boot.view || 'plan');
  const [orders, setOrders] = useState(MRP_WOS);
  const [queued, setQueued] = useState(3);

  window.MR_LANG = t.lang;

  const setMode = (m) => {
    setTweak('mode', m);
    setCaps({ ...(m === 'lite' ? CAPS_LITE : m === 'off' ? CAPS_OFF : CAPS_FULL) });
    setView(m === 'off' ? 'setup' : m === 'lite' ? 'orders' : 'plan');
  };
  useEffect(() => { setCaps({ ...(t.mode === 'lite' ? CAPS_LITE : t.mode === 'off' ? CAPS_OFF : CAPS_FULL) }); }, [t.mode]);

  const nav = t.mode === 'off' ? [] : NAV.filter((n) => !n.cap || caps[n.cap]);
  useEffect(() => { if (view !== 'setup' && !nav.some((n) => n.id === view)) setView(nav.length ? nav[0].id : 'setup'); }, [caps, t.mode]);

  const patchWo = (id, fields) => setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, ...fields } : o)));

  const titles = {
    plan:   [L('Plan'), L('Planning board')],
    orders: [L('Orders'), L('Work orders')],
    boms:   [L('BOMs'), L('Bills of material')],
    floor:  [L('Floor'), L('Shop floor')],
    mats:   [L('Materials'), L('Materials & coverage')],
    cap:    [L('Capacity'), L('Work centres')],
    qc:     [L('Quality'), L('Quality & traceability')],
    costs:  [L('Costs'), L('Job costing')],
    setup:  [L('Setup'), L('Mode & capabilities')],
  };
  const blocked = orders.filter((o) => o.status === 'blocked').length;

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap">
        <div className="rt">
          <nav className="rail">
            <div className="rail__mark"><Ico n="hammer" /></div>
            {nav.map((n) => (
              <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)} style={{ position:'relative' }}>
                <Ico n={n.icon} /><span>{n.label}</span>
                {n.id === 'orders' && blocked > 0 && <span className="dot">{blocked}</span>}
              </button>
            ))}
            <div className="rail__sp"></div>
            <button className={'railsetup' + (view === 'setup' ? ' on' : '')} onClick={() => setView('setup')}>
              <Ico n="options-outline" /><span>{L('Setup')}</span>
            </button>
          </nav>

          <div className="main">
            <header className="top">
              <div className="top__title">{titles[view][0]}<small>{titles[view][1]}</small></div>
              <div className="top__sp"></div>
              <button className="profchip"><Ico n="business-outline" /><span className="lname">{MRP_PLANT.name}</span></button>
              <SyncChip state={t.net === 'offline' ? 'off' : 'on'} queued={t.net === 'offline' ? queued : 0} onClick={() => setTweak('net', t.net === 'offline' ? 'online' : 'offline')} />
              <div className="langsw">
                <button className={t.lang === 'en' ? 'on' : ''} onClick={() => setTweak('lang', 'en')}>EN</button>
                <button className={t.lang === 'fr' ? 'on' : ''} onClick={() => setTweak('lang', 'fr')}>FR</button>
              </div>
              <button className={'topsetup' + (view === 'setup' ? ' on' : '')} onClick={() => setView('setup')} aria-label={L('Setup')}><Ico n="options-outline" /></button>
              <span className={'modechip' + (t.mode === 'full' ? ' full' : '')}>{t.mode}</span>
              <div className="avatar">MR</div>
            </header>

            {t.mode === 'off' && view !== 'setup' && <Blank icon="close-circle-outline" title="Manufacturing is off" sub="Turn on Lite or Full in Setup." />}
            {view === 'plan' && <PlanView caps={caps} />}
            {view === 'orders' && <OrdersView caps={caps} orders={orders} onPatch={patchWo} />}
            {view === 'boms' && <BomView caps={caps} />}
            {view === 'floor' && <FloorView />}
            {view === 'mats' && <MaterialsView caps={caps} />}
            {view === 'cap' && <CapacityView caps={caps} />}
            {view === 'qc' && <QualityView caps={caps} />}
            {view === 'costs' && <CostsView caps={caps} />}
            {view === 'setup' && <SetupView caps={caps} mode={t.mode} lang={t.lang}
              onMode={setMode} onLang={(v) => setTweak('lang', v)} onCap={(k) => setCaps((c) => ({ ...c, [k]: !c[k] }))} />}
          </div>

          <TweaksPanel>
            <TweakSection label="Module" />
            <TweakRadio label="Tier" value={t.mode}
              options={[{ value:'off', label:'Off' }, { value:'lite', label:'Lite' }, { value:'full', label:'Full' }]}
              onChange={setMode} />
            <TweakRadio label="Language" value={t.lang}
              options={[{ value:'en', label:'EN' }, { value:'fr', label:'FR' }]}
              onChange={(v) => setTweak('lang', v)} />
            <TweakRadio label="Connectivity" value={t.net}
              options={[{ value:'online', label:'Online' }, { value:'offline', label:'Offline' }]}
              onChange={(v) => setTweak('net', v)} />
            <TweakSection label="Preview" />
            <TweakRadio label="Device" value={t.device}
              options={[{ value:'desktop', label:'Desktop' }, { value:'tablet', label:'Tablet' }, { value:'phone', label:'Phone' }]}
              onChange={(v) => setTweak('device', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
