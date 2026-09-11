/* ============================================================
   Koomzo POS Suite — shell: nav rail, home launcher, top bar
   ============================================================ */

/* Order of the rail follows the recent modules: the core screen first, then the
   capability-gated screens in the order the day uses them, Setup pinned last.
   No launcher tile in the rail — a module lands on its own core job. */
const SCREENS = [
  { id: 'register', label: 'Order',   icon: 'cart-outline' },
  { id: 'floor',    label: 'Floor',   icon: 'grid-outline' },
  { id: 'kitchen',  label: 'Kitchen', icon: 'restaurant-outline' },
  { id: 'kiosk',    label: 'Kiosk',   icon: 'tablet-portrait-outline' },
  { id: 'home',     label: 'Today',   icon: 'today-outline' },
  { id: 'setup',    label: 'Setup',   icon: 'options-outline' },
];

function NavRail() {
  const { screen, setScreen, counts } = useSuite();
  const [clock, setClock] = useState('');
  const [, bumpCaps] = useState(0);
  useEffect(() => {
    const fmt = () => setClock(window.KZ_LOCALE.fmtTime(new Date()));
    fmt();
    const t = setInterval(fmt, 10000);
    return () => clearInterval(t);
  }, []);
  /* the rail redraws itself when a capability changes, like every other module */
  useEffect(() => { if (window.KZ) return window.KZ.subscribe(() => bumpCaps((n) => n + 1)); }, []);
  /* one badge per item, and it counts what that screen shows when opened */
  const badge = (id) => (id === 'kitchen' ? counts.late || counts.active
    : id === 'floor' ? counts.occupied : 0);
  const core = { register: 1, home: 1, setup: 1 };
  const items = SCREENS.filter((s) => core[s.id] || !window.KZ || window.KZ.on('restaurant', s.id));
  const main = items.filter((s) => s.id !== 'setup');
  return (
    <nav className="rail">
      <div className="rail__mark"><ion-icon name="restaurant"></ion-icon></div>
      <div className="rail__nav">
        {main.map((s) => (
          <button key={s.id} className={'rail__btn' + (screen === s.id ? ' active' : '')} onClick={() => setScreen(s.id)}>
            <ion-icon name={s.icon}></ion-icon>
            <span>{s.label}</span>
            {badge(s.id) > 0 && <span className="dot">{badge(s.id)}</span>}
          </button>
        ))}
      </div>
      <div className="rail__spacer"></div>
      <button className={'rail__btn' + (screen === 'setup' ? ' active' : '')} onClick={() => setScreen('setup')}>
        <ion-icon name="options-outline"></ion-icon><span>Setup</span>
      </button>
    </nav>
  );
}

/* vertical switcher used in screen top bars */
function VerticalSwitch() {
  const { vertical, setVertical } = useSuite();
  return (
    <div className="vertseg">
      {Object.values(window.RK_VERTICALS).map((v) => (
        <button key={v.id} className={vertical === v.id ? 'active' : ''} onClick={() => setVertical(v.id)}>
          <ion-icon name={v.icon}></ion-icon>{v.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   HOME / LAUNCHER
   ============================================================ */
function Home() {
  const { setScreen, counts, vertical, verticalCfg } = useSuite();
  const tiles = [
    { id: 'register', icon: 'cart-outline', name: 'Register', tint: { bg: 'var(--kz-accent-wash)', fg: 'var(--kz-accent)' },
      desc: 'Build orders, fire to the kitchen, take payment. Configurable for restaurant, bar or retail.' },
    { id: 'kitchen', icon: 'restaurant-outline', name: 'Kitchen Display', tint: { bg: '#fdeae4', fg: '#ec603a' },
      desc: 'Live ticket lanes with prep-time SLAs. Bump items as they’re cooked, plated and served.',
      badge: counts.active > 0 ? { txt: counts.active + ' active', bg: '#fdeae4', fg: '#ec603a' } : null },
    { id: 'floor', icon: 'grid-outline', name: 'Floor Plan', tint: { bg: '#e4f4ea', fg: '#2e9e5b' },
      desc: 'Multi-floor table map. Seat guests, track turn times, open a table’s order in a tap.',
      badge: { txt: counts.occupied + '/' + counts.totalTables + ' seated', bg: '#e4f4ea', fg: '#2e9e5b' } },
    { id: 'kiosk', icon: 'tablet-portrait-outline', name: 'Self-Service Kiosk', tint: { bg: '#e8f0fd', fg: '#528cef' },
      desc: 'Customer-facing ordering. Dine-in or takeaway, loyalty sign-in, pay and send to kitchen.' },
  ];
  return (
    <div className="home">
      <div className="home__head">
        <div className="home__eyebrow"><span className="mk"><ion-icon name="restaurant"></ion-icon></span>Koomzo POS Suite</div>
        <h1 className="home__title">Good service starts <span>here.</span></h1>
        <p className="home__lede">One connected system for front of house, kitchen and counter. Orders flow from the register and kiosk straight to the line and onto the floor — currently configured for <b>{verticalCfg.label}</b>.</p>
      </div>

      <div className="home__stats">
        <div className="statcard"><div className="k"><ion-icon name="flame-outline"></ion-icon>On the line</div><div className="v">{counts.cook}<small> tickets</small></div></div>
        <div className="statcard"><div className="k"><ion-icon name="checkmark-done-outline"></ion-icon>Ready to run</div><div className="v">{counts.ready}<small> tickets</small></div></div>
        <div className="statcard"><div className="k"><ion-icon name="people-outline"></ion-icon>Tables seated</div><div className="v">{counts.occupied}<small> / {counts.totalTables}</small></div></div>
        <div className="statcard"><div className="k"><ion-icon name="timer-outline"></ion-icon>Over SLA</div><div className="v" style={counts.late ? { color: 'var(--kz-sla-late)' } : null}>{counts.late}<small> late</small></div></div>
      </div>

      <div className="home__grid">
        {tiles.map((t) => (
          <button key={t.id} className="launch" onClick={() => setScreen(t.id)}>
            {t.badge && <span className="launch__badge" style={{ background: t.badge.bg, color: t.badge.fg }}>{t.badge.txt}</span>}
            <div className="launch__icon" style={{ background: t.tint.bg, color: t.tint.fg }}><ion-icon name={t.icon}></ion-icon></div>
            <div className="launch__name">{t.name}</div>
            <div className="launch__desc">{t.desc}</div>
            <div className="launch__go">Open<ion-icon name="arrow-forward-outline"></ion-icon></div>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SCREENS, NavRail, VerticalSwitch, Home });
