/* Koomzo POS — Workspace Home (launcher)
   The "main screen" of the suite: one hub from which every Koomzo app
   opens. Presented in the shared device chrome (desktop / tablet / phone)
   so it sits naturally beside the other module mockups. Every app card is
   a real link into its standalone page. */
const { useState, useLayoutEffect } = React;

const KH_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "showKpis": true,
  "iconStyle": "filled"
}/*EDITMODE-END*/;

const KH_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

/* ---- the suite ---- */
const WORKSPACE = { name: 'Groupe Bilongue', plan: 'Business · 3 sites · Douala' };

const MODULES = [
  { id: 'pos',        group: 'floor', name: 'Point of Sale',        desc: 'Ring up sales at the front counter.',        icon: 'cart-outline',            href: 'Koomzo POS.html',                     chip: { label: 'Register open', tone: 'success' } },
  { id: 'restaurant', group: 'floor', name: 'Restaurant & Bar',     desc: 'Tables, kitchen tickets & bar tabs.',          icon: 'restaurant-outline',      href: 'Koomzo POS - Restaurant & Bar.html',  chip: { label: '7 open tickets', tone: 'primary' } },
  { id: 'mobile',     group: 'floor', name: 'Mobile Register',      desc: 'Take orders on phone & tablet.',               icon: 'phone-portrait-outline',  href: 'Koomzo POS - Mobile.html',            chip: { label: '3 devices paired', tone: 'muted' } },
  { id: 'products',   group: 'admin', name: 'Products & Inventory', desc: 'Catalog, stock levels & suppliers.',           icon: 'pricetags-outline',       href: 'Koomzo POS - Products.html',          chip: { label: '3 low on stock', tone: 'warning' } },
  { id: 'mrp',        group: 'admin', name: 'Manufacturing (MRP)', desc: 'BOMs, work orders, planning & yield.',       icon: 'hammer-outline',          href: 'Koomzo POS - MRP.html',               chip: { label: '1 job blocked', tone: 'warning' } },
  { id: 'barcode',    group: 'admin', name: 'Barcode Labels',        desc: 'Design & print barcode labels.',               icon: 'barcode-outline',         href: 'Koomzo POS - Barcode Labels.html',    chip: { label: '1 template', tone: 'muted' } },
  { id: 'invoicing',  group: 'admin', name: 'Invoicing',             desc: 'Build, send & track client invoices.',         icon: 'receipt-outline',         href: 'Koomzo POS - Invoicing.html',         chip: { label: '1 overdue', tone: 'warning' } },
  { id: 'forms',      group: 'admin', name: 'Forms & Inputs',        desc: 'Simple & multi-step form templates.',          icon: 'document-text-outline',   href: 'Koomzo POS - Forms.html',             chip: { label: '2 templates', tone: 'muted' } },
  { id: 'builder',    group: 'admin', name: 'Form Builder',          desc: 'Drag & drop to build dynamic forms.',          icon: 'construct-outline',       href: 'Koomzo POS - Form Builder.html',      chip: { label: 'Builder', tone: 'primary' } },
  { id: 'multilang',  group: 'admin', name: 'Multilingual Forms',    desc: 'Translate forms into multiple languages.',     icon: 'language-outline',        href: 'Koomzo POS - Form Builder Multilingual.html', chip: { label: 'Localize', tone: 'muted' } },
  { id: 'submissions',group: 'admin', name: 'Form Submissions',      desc: 'Review responses & completed records.',        icon: 'albums-outline',          href: 'Koomzo POS - Form Submissions.html',  chip: { label: 'Responses', tone: 'muted' } },
  { id: 'workflow',   group: 'admin', name: 'Workflow Orchestrator', desc: 'Automate processes across forms, apps & APIs.', icon: 'git-network-outline',     href: 'Koomzo POS - Workflow Orchestrator.html', chip: { label: 'Automation', tone: 'primary' } },
  { id: 'automations',group: 'admin', name: 'Workflows',             desc: 'All automation workflows & their status.',     icon: 'layers-outline',          href: 'Koomzo POS - Automations.html',       chip: { label: 'Manage', tone: 'muted' } },
  { id: 'runs',       group: 'admin', name: 'Workflow Runs',         desc: 'Live & historical execution logs.',            icon: 'pulse-outline',           href: 'Koomzo POS - Workflow Runs.html',     chip: { label: 'Run history', tone: 'muted' } },
  { id: 'flowdesign', group: 'admin', name: 'Flow Designer',         desc: 'Diagram workflows with flowchart shapes.',     icon: 'shapes-outline',          href: 'Koomzo POS - Flow Designer.html',     chip: { label: 'Diagram', tone: 'muted' } },
  { id: 'record',     group: 'admin', name: 'Form Record',           desc: 'Completed form — print & download as PDF.',    icon: 'print-outline',           href: 'Koomzo POS - Form Record.html',       chip: { label: 'Printable', tone: 'muted' } },
  { id: 'users',      group: 'admin', name: 'Users & Roles',        desc: 'Staff accounts & permissions.',                icon: 'people-outline',          href: 'Koomzo POS - Users.html',             chip: { label: '14 users', tone: 'muted' } },
  { id: 'apps',       group: 'admin', name: 'Apps & Modules',       desc: 'Install & manage add-ons.',                    icon: 'apps-outline',            href: 'Koomzo POS - Apps.html',              chip: { label: '9 active', tone: 'muted' } },
  { id: 'settings',   group: 'admin', name: 'Settings',             desc: 'Taxes, receipts, printers & devices.',         icon: 'settings-outline',        href: 'Koomzo POS - Settings.html',          chip: { label: 'All synced', tone: 'success' } },
  { id: 'salon',      group: 'floor', name: 'Salon',                desc: 'Appointment book, tasks & team.',              icon: 'cut-outline',             href: 'Koomzo Salon - Appointments, Tasks, Team.html', chip: { label: 'Book open', tone: 'primary' } },
  { id: 'hotel',      group: 'floor', name: 'Hotel',                desc: 'Room rack, folios & housekeeping.',            icon: 'bed-outline',             href: 'Koomzo Hotel - Rooms, Folio & Housekeeping.html', chip: { label: '6 to clean', tone: 'warning' } },
  { id: 'grocery',    group: 'floor', name: 'Grocery',              desc: 'Till, dates, labels & shelf gaps.',            icon: 'basket-outline',          href: 'Koomzo Grocery - Till, Dates & Shelf.html', chip: { label: '4 lots due', tone: 'warning' } },
  { id: 'queue',      group: 'floor', name: 'Queue',                desc: 'Call the next person waiting.',                icon: 'people-circle-outline',   href: 'Koomzo Queue Management.html',        chip: { label: 'Now serving', tone: 'muted' } },
];
/* The launcher is a view of the capability service, not a list of files: a tile
   whose module is off — or whose capability is hidden — is not a tile at all.
   Two-part gates name a capability inside a module. */
const KH_GATE = {
  pos:['retail'], mobile:['retail'], restaurant:['restaurant'], products:['inventory'],
  salon:['salon'], hotel:['hotel'], grocery:['grocery'], queue:['queue'],
  invoicing:['invoicing'], forms:['forms'], automations:['automations'],
  builder:['forms','builder'], multilang:['forms','multilingual'],
  submissions:['forms','submissions'], record:['forms','submissions'],
  runs:['automations','runs'], workflow:['automations','designer'], flowdesign:['automations','designer'],
};
function khOK(m) {
  const g = KH_GATE[m.id];
  if (!g || !window.KZ) return true;
  if (!window.KZ.moduleOn(g[0])) return false;
  return g.length < 2 || window.KZ.on(g[0], g[1]);
}
const FLOOR = () => MODULES.filter((m) => m.group === 'floor' && khOK(m));
const ADMIN = () => MODULES.filter((m) => m.group === 'admin' && khOK(m));

const KPIS = [
  { id: 'sales',   icon: 'cash-outline',     tone: 'success', val: '1 735 000 F', lbl: 'Net sales today',  delta: { dir: 'up', v: '12.4%' } },
  { id: 'tickets', icon: 'receipt-outline',  tone: 'primary', val: '7',      lbl: 'Open tickets',     sub: 'across 5 tables' },
  { id: 'stock',   icon: 'alert-circle-outline', tone: 'warning', val: '3',  lbl: 'Items low on stock', sub: 'need reorder' },
  { id: 'staff',   icon: 'people-outline',   tone: 'info',    val: '5', lblB: '5', lbl: 'Staff on shift', sub: 'of 14 total' },
];

const ATTENTION = [
  { icon: 'alert-circle-outline', tone: 'warning', title: '3 items low on stock', sub: 'Riz parfumé, Huile de palme & 1 more', href: 'Koomzo POS - Products.html' },
  { icon: 'person-add-outline',   tone: 'info',    title: '2 staff invites pending', sub: 'Awaiting first sign-in', href: 'Koomzo POS - Users.html' },
  { icon: 'phone-portrait-outline', tone: 'muted', title: 'MoMo terminal needs update', sub: 'Caisse 1 · 2 min', href: 'Koomzo POS - Settings.html' },
];

const ACTIVITY = [
  { tone: 'success', text: ['Order ', '#1042', ' · 9 500 F paid'], time: '2 min ago' },
  { tone: 'primary', text: ['Updated ', 'Ndolé poisson', ' price'], time: '18 min ago' },
  { tone: 'info',    text: ['New user ', 'Danielle N.', ' invited'], time: '1 hr ago' },
];

function Chip({ chip }) {
  return <span className={'kh-chip tone-' + chip.tone}><i></i>{chip.label}</span>;
}

/* ============================================================
   DESKTOP / TABLET HOME
   ============================================================ */
function RailLink({ icon, label, active }) {
  return (
    <a className={'pa-rail__item' + (active ? ' active' : '')} href={active ? undefined : '#'}>
      <ion-icon name={icon}></ion-icon>{label}
    </a>
  );
}

function DesktopHome({ t }) {
  const filled = t.iconStyle === 'filled';
  return (
    <div className="pa-app">
      <nav className="pa-rail">
        <div className="pa-rail__mark"><ion-icon name="storefront"></ion-icon></div>
        <RailLink icon="grid-outline" label="Home" active />
        <a className="pa-rail__item" href="Koomzo POS.html"><ion-icon name="cart-outline"></ion-icon>Sell</a>
        <a className="pa-rail__item" href="Koomzo POS - Restaurant & Bar.html"><ion-icon name="restaurant-outline"></ion-icon>Tables</a>
        <a className="pa-rail__item" href="Koomzo POS - Products.html"><ion-icon name="pricetags-outline"></ion-icon>Items</a>
        <a className="pa-rail__item" href="Koomzo POS - Barcode Labels.html"><ion-icon name="barcode-outline"></ion-icon>Labels</a>
        <a className="pa-rail__item" href="Koomzo POS - Users.html"><ion-icon name="people-outline"></ion-icon>Team</a>
        <a className="pa-rail__item" href="Koomzo POS - Apps.html"><ion-icon name="apps-outline"></ion-icon>Apps</a>
        <div className="pa-rail__spacer"></div>
        <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
      </nav>

      <div className="pa-main">
        <header className="pa-topbar">
          <div className="kh-ws">
            <div className="kh-ws__mk"><ion-icon name="storefront"></ion-icon></div>
            <div className="kh-ws__txt"><b>{WORKSPACE.name}</b><span>{WORKSPACE.plan}</span></div>
            <ion-icon name="chevron-down"></ion-icon>
          </div>
          <label className="kh-topsearch">
            <ion-icon name="search-outline"></ion-icon>
            <input placeholder="Search apps, orders, products…" />
            <kbd>⌘K</kbd>
          </label>
          <div className="pa-topbar__right">
            <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
            <button className="pa-btn icon kh-bell" title="Notifications"><ion-icon name="notifications-outline"></ion-icon><span className="dot">3</span></button>
            <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
          </div>
        </header>

        <div className="kh-scroll">
          <div className="kh-pad">
            <div className="kh-greet">
              <div className="kh-greet__t">
                <span className="kh-greet__date">Sunday · 16 August 2026</span>
                <h1>Good morning, <span>Nadège</span></h1>
              </div>
              <div className="kh-greet__actions">
                <a className="pa-btn" href="Koomzo POS - Restaurant & Bar.html"><ion-icon name="receipt-outline"></ion-icon>Open tickets</a>
                <a className="pa-btn primary" href="Koomzo POS.html"><ion-icon name="cart-outline"></ion-icon>Open register</a>
              </div>
            </div>

            {t.showKpis && (
              <div className="kh-kpis">
                {KPIS.map((k) => (
                  <div className="kh-kpi" key={k.id}>
                    <div className="kh-kpi__top">
                      <div className={'kh-kpi__ic tone-' + k.tone}><ion-icon name={k.icon}></ion-icon></div>
                      {k.delta && <span className={'kh-kpi__delta ' + (k.delta.dir === 'up' ? 'up' : 'flat')}><ion-icon name="trending-up-outline"></ion-icon>{k.delta.v}</span>}
                    </div>
                    <div className="kh-kpi__val">{k.val}{k.lblB && <span style={{ font: '500 16px var(--kz-font-num)', color: 'var(--kz-muted-3)' }}> / 14</span>}</div>
                    <div className="kh-kpi__lbl">{k.lbl}{k.sub && <> · <span style={{ color: 'var(--kz-muted-2)' }}>{k.sub}</span></>}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="kh-cols">
              <div>
                <div className="kh-block">
                  <div className="kh-secthead"><h2>Run the floor</h2><span>Sell &amp; serve customers right now</span></div>
                  <div className="kh-grid-floor">
                    {FLOOR().map((m) => (
                      <a className={'kh-app floor' + (filled ? '' : ' icon-outline')} href={m.href} key={m.id}>
                        <div className="kh-app__ic"><ion-icon name={m.icon}></ion-icon></div>
                        <div className="kh-app__body"><h3>{m.name}</h3><p>{m.desc}</p></div>
                        <div className="kh-app__foot"><Chip chip={m.chip} /></div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="kh-block">
                  <div className="kh-secthead"><h2>Manage the business</h2><span>Set up &amp; administer your store</span></div>
                  <div className="kh-grid-admin">
                    {ADMIN().map((m) => (
                      <a className="kh-app admin" href={m.href} key={m.id}>
                        <div className="kh-app__ic"><ion-icon name={m.icon}></ion-icon></div>
                        <div className="kh-app__body"><h3>{m.name}</h3><p>{m.desc}</p></div>
                        <div className="kh-app__foot"><Chip chip={m.chip} /></div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="kh-aside">
                <div className="kh-card">
                  <div className="kh-card__head">
                    <ion-icon name="flag-outline" style={{ fontSize: 18, color: 'var(--kz-warning)' }}></ion-icon>
                    <h3>Needs attention</h3><span className="num">3</span>
                  </div>
                  {ATTENTION.map((a, i) => (
                    <a className="kh-attn" href={a.href} key={i}>
                      <div className={'kh-attn__ic tone-' + a.tone}><ion-icon name={a.icon}></ion-icon></div>
                      <div className="kh-attn__t"><b>{a.title}</b><span>{a.sub}</span></div>
                      <ion-icon name="chevron-forward"></ion-icon>
                    </a>
                  ))}
                </div>

                <div className="kh-card">
                  <div className="kh-card__head">
                    <ion-icon name="pulse-outline" style={{ fontSize: 18, color: 'var(--kz-primary)' }}></ion-icon>
                    <h3>Recent activity</h3>
                  </div>
                  {ACTIVITY.map((a, i) => (
                    <div className="kh-act" key={i}>
                      <span className={'kh-act__dot tone-' + a.tone} style={{ background: 'currentColor' }}></span>
                      <div className="kh-act__t"><b>{a.text[0]}<em>{a.text[1]}</em>{a.text[2]}</b><span>{a.time}</span></div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PHONE HOME — the redesigned "main screen"
   ============================================================ */
function PhoneHome({ t }) {
  return (
    <div className="kh-phone">
      <div className="kh-phone__bar">
        <div className="kh-ws">
          <div className="kh-ws__mk"><ion-icon name="storefront"></ion-icon></div>
          <div className="kh-ws__txt"><b>Groupe Bilongue</b><span>Douala</span></div>
        </div>
        <button className="kh-iconbtn kh-bell"><ion-icon name="notifications-outline"></ion-icon><span className="dot">3</span></button>
        <div className="kh-avatar">N</div>
      </div>

      <div className="kh-phone__scroll">
        <div className="kh-phone__greet">
          <div className="d">Sunday · 16 August</div>
          <h1>Good morning, <span>Nadège</span></h1>
        </div>

        {t.showKpis && (
          <div className="kh-pkpis">
            <div className="kh-pkpi">
              <div className="kh-pkpi__top"><div className="kh-pkpi__ic tone-success"><ion-icon name="cash-outline"></ion-icon></div><span className="kh-pkpi__lbl">Net sales</span></div>
              <div className="kh-pkpi__val">1 735 000 F</div>
            </div>
            <div className="kh-pkpi">
              <div className="kh-pkpi__top"><div className="kh-pkpi__ic tone-primary"><ion-icon name="receipt-outline"></ion-icon></div><span className="kh-pkpi__lbl">Open tickets</span></div>
              <div className="kh-pkpi__val">7</div>
            </div>
            <div className="kh-pkpi">
              <div className="kh-pkpi__top"><div className="kh-pkpi__ic tone-warning"><ion-icon name="alert-circle-outline"></ion-icon></div><span className="kh-pkpi__lbl">Low stock</span></div>
              <div className="kh-pkpi__val">3</div>
            </div>
            <div className="kh-pkpi">
              <div className="kh-pkpi__top"><div className="kh-pkpi__ic tone-info"><ion-icon name="people-outline"></ion-icon></div><span className="kh-pkpi__lbl">On shift</span></div>
              <div className="kh-pkpi__val">5</div>
            </div>
          </div>
        )}

        <div className="kh-psec"><h2>Run the floor</h2></div>
        <div className="kh-pgrid">
          {FLOOR().map((m) => (
            <a className="kh-papp floor" href={m.href} key={m.id}>
              <div className="kh-papp__ic"><ion-icon name={m.icon}></ion-icon></div>
              <h3>{m.name}</h3>
              <Chip chip={m.chip} />
            </a>
          ))}
        </div>

        <div className="kh-psec" style={{ marginTop: 22 }}><h2>Manage</h2></div>
        <div className="kh-pgrid">
          {ADMIN().map((m) => (
            <a className="kh-papp admin" href={m.href} key={m.id}>
              <div className="kh-papp__ic"><ion-icon name={m.icon}></ion-icon></div>
              <h3>{m.name}</h3>
              <Chip chip={m.chip} />
            </a>
          ))}
        </div>
      </div>

      <nav className="kh-tabbar">
        <a className="kh-tab active" href="#"><ion-icon name="home"></ion-icon>Home</a>
        <a className="kh-tab" href="Koomzo POS - Apps.html"><ion-icon name="apps-outline"></ion-icon>Apps</a>
        <a className="kh-tab" href="Koomzo POS - Restaurant & Bar.html"><ion-icon name="pulse-outline"></ion-icon>Activity</a>
        <a className="kh-tab" href="Koomzo POS - Settings.html"><ion-icon name="person-outline"></ion-icon>Account</a>
      </nav>
    </div>
  );
}

/* ============================================================
   PRESENTER
   ============================================================ */
function Stage({ w, h, className, children }) {
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
  const [t, setTweak] = useTweaks(KH_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const dev = KH_DEVICES[device];
  const accentStyle = { '--kz-primary': t.accent };

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div style={{ ...accentStyle, width: '100%', height: '100%' }}>
          {device === 'phone' ? <PhoneHome t={t} /> : <DesktopHome t={t} />}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]} onChange={setDevice} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent}
          options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Home layout" />
        <TweakToggle label="Show stats strip" value={t.showKpis} onChange={(v) => setTweak('showKpis', v)} />
        <TweakRadio label="Floor app icons" value={t.iconStyle}
          options={[{ value: 'filled', label: 'Filled' }, { value: 'outline', label: 'Tinted' }]}
          onChange={(v) => setTweak('iconStyle', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
