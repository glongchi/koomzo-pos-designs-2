/* Koomzo POS — Form submissions history. One unified log covering both
   in-progress submissions (saved to continue later) and finished ones
   (completed / abandoned). A detail drawer shows the answered fields. */
const { useState, useMemo, useLayoutEffect } = React;

const FS_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "density": "comfortable"
}/*EDITMODE-END*/;

const FS_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};
const subLive = (st) => st === 'in_progress';

function useFit(w, h) {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const f = () => setS(Math.min(1, (window.innerWidth - 52) / w, (window.innerHeight - 108) / h));
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, [w, h]);
  return s;
}
function Stage({ w, h, scale, className, children }) {
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}
function Rail() {
  const items = [
    { icon: 'grid-outline', label: 'Home', href: 'Koomzo POS - Home.html' },
    { icon: 'cart-outline', label: 'Register', href: 'Koomzo POS.html' },
    { icon: 'pricetags-outline', label: 'Products', href: 'Koomzo POS - Products.html' },
    { icon: 'document-text-outline', label: 'Forms', active: true },
    { icon: 'people-outline', label: 'Customers', href: 'Koomzo POS - Users.html' },
  ];
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="storefront"></ion-icon></a>
      {items.map((it) => (
        it.href
          ? <a key={it.label} className="pa-rail__item" href={it.href}><ion-icon name={it.icon}></ion-icon>{it.label}</a>
          : <button key={it.label} className={'pa-rail__item' + (it.active ? ' active' : '')}><ion-icon name={it.icon}></ion-icon>{it.label}</button>
      ))}
      <div className="pa-rail__spacer" />
      <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
    </nav>
  );
}

function SubStatusPill({ status }) {
  const m = SUB_STATUS[status];
  return <span className="au-pill" style={{ color: m.color, background: m.bg, borderColor: m.bd }}>
    <ion-icon name={m.icon}></ion-icon>{m.label}
  </span>;
}
function KindCell({ kind }) {
  const k = FORM_KIND[kind];
  return <span className="au-trig">
    <span className="au-trig__ic" style={{ background: k.wash, color: k.color }}><ion-icon name={k.icon}></ion-icon></span>
    <b>{k.label}</b>
  </span>;
}
const progColor = (st) => st === 'completed' ? 'var(--kz-success)' : st === 'abandoned' ? 'var(--kz-discount)' : 'var(--kz-primary)';

/* map answer status → timeline item class (reuses au-timeline styles) */
const ansClass = (st) => st === 'answered' ? 'done' : st === 'current' ? 'running' : 'pending';

/* ---- submission detail drawer ---- */
function SubDetail({ sub, onClose, onAction }) {
  return (
    <>
      <div className="pa-scrim" onClick={onClose}></div>
      <aside className="pa-drawer">
        <div className="pd">
          <div className="pd__head">
            <span className="eyebrow" style={{ marginRight: 'auto' }}>Submission</span>
            <button className="pd__close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
          </div>
          <div className="pd__body">
            <div className="au-runhero">
              <div className="au-runhero__id">
                <b>{sub.id}</b><SubStatusPill status={sub.status} />
              </div>
              <div className="au-runhero__wf">{sub.form}</div>
              <div className="au-runhero__meta">
                <div className="au-metacell"><div className="k">Respondent</div><div className="v">{sub.respondent}</div></div>
                <div className="au-metacell"><div className="k">Reference</div><div className="v mono">{sub.email}</div></div>
                <div className="au-metacell"><div className="k">Started</div><div className="v">{sub.startedAt}</div></div>
                <div className="au-metacell"><div className="k">{subLive(sub.status) ? 'Idle' : 'Time to complete'}</div><div className="v">{sub.elapsed}</div></div>
                <div className="au-metacell" style={{ gridColumn: '1 / -1' }}><div className="k">Source</div><div className="v">{sub.source}</div></div>
              </div>
            </div>

            <div className="pd__section">
              <div className="pd__section-h"><ion-icon name="list-outline"></ion-icon>Fields · {sub.filled}/{sub.total} filled</div>
              <div className="au-timeline">
                {sub.answers.map((a, i) => {
                  const am = ANS_STATUS[a.status];
                  const showBadge = a.status !== 'answered';
                  return (
                    <div key={i} className={'au-tl-item ' + ansClass(a.status)}>
                      <div className="au-tl-rail">
                        <div className="au-tl-node"><ion-icon name={a.status === 'answered' ? 'checkmark' : a.icon}></ion-icon></div>
                        <div className="au-tl-line"></div>
                      </div>
                      <div className="au-tl-body">
                        <div className="hd">
                          <b>{a.label}</b>
                          {showBadge && <span className="au-tl-badge" style={{ color: am.color, background: am.color === 'var(--kz-muted-3)' ? 'var(--kz-surface-2)' : `color-mix(in srgb, ${am.color} 14%, transparent)` }}>{am.label}</span>}
                        </div>
                        <div className="dt" style={a.status === 'answered' ? { color: 'var(--kz-ink-2)', fontWeight: 500 } : null}>{a.value || '—'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pd__foot">
            <div className="au-runfoot" style={{ width: '100%' }}>
              {subLive(sub.status) && <button className="ghost" onClick={() => onAction('remind', sub)}><ion-icon name="mail-outline"></ion-icon>Send reminder</button>}
              {sub.status === 'completed' && <button className="ghost" onClick={() => onAction('export', sub)}><ion-icon name="download-outline"></ion-icon>Export</button>}
              <a className="ghost" href="Koomzo POS - Form Builder.html"><ion-icon name="document-text-outline"></ion-icon>Open form</a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* =================== APP =================== */
function App() {
  const [t, setTweak] = useTweaks(FS_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const dev = FS_DEVICES[device];
  const fit = useFit(dev.w, dev.h);

  const [subs] = useState(SUBMISSIONS);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const counts = useMemo(() => ({
    all: subs.length,
    in_progress: subs.filter((r) => r.status === 'in_progress').length,
    completed: subs.filter((r) => r.status === 'completed').length,
    abandoned: subs.filter((r) => r.status === 'abandoned').length,
  }), [subs]);

  const avgComplete = useMemo(() => {
    const done = subs.filter((r) => r.status === 'completed');
    const parse = (s) => { let t = 0; const m = (s || '').match(/(\d+)m/), sec = (s || '').match(/(\d+)s/); if (m) t += +m[1] * 60; if (sec) t += +sec[1]; return t; };
    const avg = done.length ? Math.round(done.reduce((a, r) => a + parse(r.elapsed), 0) / done.length) : 0;
    const mm = Math.floor(avg / 60), ss = avg % 60;
    return mm ? `${mm}m ${String(ss).padStart(2, '0')}s` : `${ss}s`;
  }, [subs]);

  const formNames = useMemo(() => Array.from(new Set(subs.map((s) => s.form))), [subs]);

  const filtered = useMemo(() => subs.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (formFilter !== 'all' && r.form !== formFilter) return false;
    if (query.trim()) { const q = query.toLowerCase(); return (r.id + ' ' + r.form + ' ' + r.respondent + ' ' + r.email).toLowerCase().includes(q); }
    return true;
  }), [subs, tab, formFilter, query]);

  const openSub = subs.find((r) => r.id === openId) || null;

  const onAction = (kind, sub) => {
    if (kind === 'remind') flash(`Reminder sent to ${sub.respondent}`);
    if (kind === 'export') flash(`${sub.id} exported`);
  };

  const accentStyle = { '--kz-primary': t.accent };
  const compact = t.density === 'compact';

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={'pa-app' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>
          <KzPaRail mid="forms" active="subs" />
          <div className="pa-main">
            <header className="pa-topbar">
              <div className="pa-topbar__crumb">
                <ion-icon name="document-text-outline"></ion-icon><a href="Koomzo POS - Forms.html" style={{ color: 'inherit', textDecoration: 'none' }}>Forms</a>
                <ion-icon name="chevron-forward-outline"></ion-icon><b>Submissions</b>
              </div>
              <div className="pa-topbar__right">
                <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Live</span>
                <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
                <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
              </div>
            </header>

            <div className="pa-pagehead">
              <div className="pa-pagehead__t">
                <span className="pa-eyebrow">Forms</span>
                <h1>Submissions <span className="count">{counts.all}</span></h1>
              </div>
              <div className="pa-pagehead__actions">
                <a className="pa-btn" href="Koomzo POS - Forms.html"><ion-icon name="arrow-back-outline"></ion-icon>Forms</a>
                <button className="pa-btn" onClick={() => flash('Exported all submissions')}><ion-icon name="download-outline"></ion-icon>Export CSV</button>
              </div>
            </div>

            <div className="au-stats">
              <div className="au-statcard"><div className="k"><ion-icon name="albums-outline"></ion-icon>Total</div><div className="v">{counts.all}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="checkmark-circle-outline"></ion-icon>Completed</div><div className="v ok">{counts.completed}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="create-outline"></ion-icon>In progress</div><div className="v run">{counts.in_progress}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="close-circle-outline"></ion-icon>Abandoned</div><div className="v bad">{counts.abandoned}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="timer-outline"></ion-icon>Avg. time</div><div className="v">{avgComplete}</div></div>
            </div>

            <div className="pa-toolbar">
              <div className="pa-search">
                <ion-icon name="search-outline"></ion-icon>
                <input placeholder="Search by ID, form, respondent…" value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
              </div>
              <select className="au-input" style={{ width: 200, height: 40 }} value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
                <option value="all">All forms</option>
                {formNames.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="au-tabs">
                {[['all', 'All'], ['in_progress', 'In progress'], ['completed', 'Completed'], ['abandoned', 'Abandoned']].map(([k, label]) => (
                  <button key={k} className={'au-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
                    {label}<span className="n">{counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pa-tablewrap">
              {filtered.length === 0 ? (
                <div className="pa-empty"><ion-icon name="albums-outline"></ion-icon><p>No submissions match your filters.</p></div>
              ) : (
                <table className={'pa-table' + (compact ? ' pa-rowcompact' : '')} style={{ minWidth: 1080 }}>
                  <thead>
                    <tr>
                      <th>Submission</th>
                      <th>Form</th>
                      <th>Type</th>
                      <th>Started</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th style={{ width: 46 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const pct = Math.round((r.filled / r.total) * 100);
                      return (
                        <tr key={r.id} className={openId === r.id ? 'sel' : ''} onClick={() => setOpenId(r.id)}>
                          <td>
                            <div className="pa-name"><b className="au-mono" style={{ fontSize: 14 }}>{r.id}</b><small className="au-entity">{r.respondent} · {r.email}</small></div>
                          </td>
                          <td><span className="au-sub" style={{ color: 'var(--kz-ink-2)', fontWeight: 600 }}>{r.form}</span></td>
                          <td><KindCell kind={r.kind} /></td>
                          <td><span className="au-sub">{r.startedAt}</span></td>
                          <td>
                            <div className="au-prog">
                              <div className="au-prog__top"><b>{r.filled}/{r.total}</b>{subLive(r.status) && <span>{r.currentStep}</span>}</div>
                              <div className="au-prog__track"><div className="au-prog__fill" style={{ width: pct + '%', background: progColor(r.status) }}></div></div>
                            </div>
                          </td>
                          <td><SubStatusPill status={r.status} /></td>
                          <td><div className="pa-rowact"><span className="pa-rowbtn" style={{ pointerEvents: 'none' }}><ion-icon name="chevron-forward-outline"></ion-icon></span></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pa-footer">
              <div className="pa-footer__view">
                <ion-icon name="ellipse" style={{ fontSize: 9, color: 'var(--kz-primary)' }}></ion-icon>
                In-progress submissions are saved drafts respondents can resume · click any row to see the answers
              </div>
              <div className="pa-footer__range">{filtered.length} of {subs.length} submissions</div>
            </div>
          </div>

          {openSub && <SubDetail sub={openSub} onClose={() => setOpenId(null)} onAction={onAction} />}
          {toast && <div className="au-toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }]} onChange={setDevice} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent} options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Table" />
        <TweakRadio label="Row density" value={t.density}
          options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
