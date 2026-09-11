/* Koomzo POS — Workflow run history. One unified execution log covering both
   in-progress runs (running / waiting, with a live elapsed timer + current step)
   and finished runs (completed / failed). A detail drawer shows the step timeline. */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const RUN_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "density": "comfortable"
}/*EDITMODE-END*/;

const RUN_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
};

/* seconds <-> label */
const parseDur = (s) => { if (!s || s === '—') return 0; let t = 0; const m = s.match(/(\d+)m/), sec = s.match(/(\d+)s/); if (m) t += +m[1] * 60; if (sec) t += +sec[1]; return t; };
const fmtDur = (s) => { const m = Math.floor(s / 60), r = s % 60; return m ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`; };
const isLive = (st) => st === 'running' || st === 'waiting';

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
    { icon: 'git-network-outline', label: 'Flows', active: true },
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

function RunStatusPill({ status }) {
  const m = RUN_STATUS[status];
  return <span className={'au-pill' + (status === 'running' ? ' spin' : '')} style={{ color: m.color, background: m.bg, borderColor: m.bd }}>
    <ion-icon name={m.icon}></ion-icon>{m.label}
  </span>;
}
function TriggerCell({ trigger }) {
  const t = TRIGGERS[trigger];
  return <span className="au-trig">
    <span className="au-trig__ic" style={{ background: t.wash, color: t.color }}><ion-icon name={t.icon}></ion-icon></span>
    <b>{t.label}</b>
  </span>;
}
const progColor = (st) => st === 'completed' ? 'var(--kz-success)' : st === 'failed' ? 'var(--kz-discount)' : st === 'waiting' ? 'var(--kz-warning)' : 'var(--kz-primary)';

/* ---- run detail drawer ---- */
function RunDetail({ run, liveSecs, onClose, onAction }) {
  const m = RUN_STATUS[run.status];
  const durLabel = isLive(run.status) ? fmtDur(liveSecs) : run.elapsed;
  return (
    <>
      <div className="pa-scrim" onClick={onClose}></div>
      <aside className="pa-drawer">
        <div className="pd">
          <div className="pd__head">
            <span className="eyebrow" style={{ marginRight: 'auto' }}>Run detail</span>
            <button className="pd__close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
          </div>
          <div className="pd__body">
            <div className="au-runhero">
              <div className="au-runhero__id">
                <b>{run.id}</b><RunStatusPill status={run.status} />
              </div>
              <div className="au-runhero__wf">{run.wf}</div>
              <div className="au-runhero__meta">
                <div className="au-metacell"><div className="k">Trigger</div><div className="v">{TRIGGERS[run.trigger].label}</div></div>
                <div className="au-metacell"><div className="k">Started</div><div className="v">{run.startedAt}</div></div>
                <div className="au-metacell"><div className="k">{isLive(run.status) ? 'Elapsed' : 'Duration'}</div><div className="v mono">{durLabel}</div></div>
                <div className="au-metacell"><div className="k">Initiator</div><div className="v">{run.initiator}</div></div>
                <div className="au-metacell" style={{ gridColumn: '1 / -1' }}><div className="k">Record</div><div className="v mono">{run.entity}</div></div>
              </div>
            </div>

            <div className="pd__section">
              <div className="pd__section-h"><ion-icon name="list-outline"></ion-icon>Steps · {run.stepsDone}/{run.stepsTotal} complete</div>
              <div className="au-timeline">
                {run.steps.map((s, i) => {
                  const sm = STEP_STATUS[s.status];
                  const showBadge = s.status === 'running' || s.status === 'waiting' || s.status === 'failed' || s.status === 'skipped';
                  return (
                    <div key={i} className={'au-tl-item ' + s.status}>
                      <div className="au-tl-rail">
                        <div className="au-tl-node"><ion-icon name={s.status === 'failed' ? 'close' : s.status === 'done' ? 'checkmark' : s.icon}></ion-icon></div>
                        <div className="au-tl-line"></div>
                      </div>
                      <div className="au-tl-body">
                        <div className="hd">
                          <b>{s.label}</b>
                          {showBadge && <span className="au-tl-badge" style={{ color: sm.color, background: sm.color === 'var(--kz-muted-3)' ? 'var(--kz-surface-2)' : `color-mix(in srgb, ${sm.color} 14%, transparent)` }}>{sm.label}</span>}
                          {s.at && <span className="t">{s.at}{s.dur && s.dur !== '—' ? ` · ${s.dur}` : ''}</span>}
                        </div>
                        {s.detail && <div className="dt">{s.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pd__foot">
            <div className="au-runfoot" style={{ width: '100%' }}>
              {run.status === 'failed' && <button className="ghost" onClick={() => onAction('retry', run)}><ion-icon name="refresh-outline"></ion-icon>Retry run</button>}
              {isLive(run.status) && <button className="ghost danger" onClick={() => onAction('cancel', run)}><ion-icon name="stop-circle-outline"></ion-icon>Cancel run</button>}
              <a className="ghost" href="Koomzo POS - Workflow Orchestrator.html"><ion-icon name="git-network-outline"></ion-icon>Open workflow</a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---- template gallery: browse ready-made workflows by industry, clone & tweak ---- */
function TemplateGallery({ onClone, onClose }) {
  const [industry, setIndustry] = useState('all');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [done, setDone] = useState(false);

  const counts = useMemo(() => {
    const c = { all: WF_TEMPLATES.length };
    Object.keys(WF_INDUSTRIES).forEach((k) => { c[k] = WF_TEMPLATES.filter((t) => t.industry === k).length; });
    return c;
  }, []);

  const list = useMemo(() => WF_TEMPLATES.filter((t) => {
    if (industry !== 'all' && t.industry !== industry) return false;
    if (query.trim()) { const q = query.toLowerCase(); return (t.name + ' ' + t.desc).toLowerCase().includes(q); }
    return true;
  }), [industry, query]);

  const startClone = (t) => { setPicked(t); setName(t.name + ' (copy)'); setDesc(t.desc); setDone(false); };
  const confirmClone = () => { onClone(picked, { name: name.trim() || picked.name, desc: desc.trim() || picked.desc }); setDone(true); };

  return (
    <div className="au-modal-scrim" onClick={onClose}>
      <div className="au-modal tpl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="au-modal__head">
          <div className="ic"><ion-icon name={picked ? (done ? 'checkmark-circle-outline' : 'copy-outline') : 'albums-outline'}></ion-icon></div>
          <div style={{ flex: 1 }}>
            <h2>{picked ? (done ? 'Draft workflow created' : 'Clone & customize') : 'Start from a template'}</h2>
            <p>{picked ? (done ? 'Open it in the Flow Designer to wire up your integrations.' : 'Tweak the name and description — the steps come pre-built.') : 'Ready-made workflows across industries. Clone one and make it yours.'}</p>
          </div>
          <button className="pd__close" onClick={onClose} style={{ marginLeft: 'auto' }}><ion-icon name="close-outline"></ion-icon></button>
        </div>

        {picked ? (
          <>
            <div className="tpl-clone">
              <div className="tpl-clone__src">
                <div className="ic" style={{ background: WF_INDUSTRIES[picked.industry].wash, color: WF_INDUSTRIES[picked.industry].color }}>
                  <ion-icon name={WF_INDUSTRIES[picked.industry].icon}></ion-icon>
                </div>
                <div className="tt">
                  <b>{done ? name : picked.name}</b>
                  <small>{WF_INDUSTRIES[picked.industry].label} · {TRIGGERS[picked.trigger].label} · {picked.steps} steps</small>
                </div>
              </div>
              {done ? (
                <div className="tpl-clone__note">
                  <ion-icon name="git-network-outline"></ion-icon>
                  <span>Cloned as a <b>draft</b> with all {picked.steps} steps. It won’t run until you review the steps and set it live in the Flow Designer.</span>
                </div>
              ) : (
                <>
                  <div className="au-field">
                    <label>Workflow name</label>
                    <input className="au-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="au-field">
                    <label>Description</label>
                    <textarea className="au-input" value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
                  </div>
                  <div className="tpl-clone__note">
                    <ion-icon name="sparkles-outline"></ion-icon>
                    <span>All {picked.steps} steps are copied in as a <b>draft</b>. Open the Flow Designer to adjust logic and connect your apps, then set it live.</span>
                  </div>
                </>
              )}
            </div>
            <div className="au-modal__foot">
              {done ? (
                <>
                  <button className="au-mbtn" onClick={onClose}>Close</button>
                  <div className="spacer"></div>
                  <a className="au-mbtn" href="Koomzo POS - Automations.html"><ion-icon name="list-outline"></ion-icon>View workflows</a>
                  <a className="au-mbtn primary" href="Koomzo POS - Flow Designer.html"><ion-icon name="git-network-outline"></ion-icon>Open in Flow Designer</a>
                </>
              ) : (
                <>
                  <button className="au-mbtn" onClick={() => setPicked(null)}><ion-icon name="arrow-back-outline"></ion-icon>Back to templates</button>
                  <div className="spacer"></div>
                  <button className="au-mbtn primary" onClick={confirmClone}><ion-icon name="copy-outline"></ion-icon>Clone to draft</button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="tpl-toolbar">
              <div className="tpl-searchrow">
                <div className="tpl-search">
                  <ion-icon name="search-outline"></ion-icon>
                  <input placeholder="Search templates…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <span className="tpl-count">{list.length} template{list.length === 1 ? '' : 's'}</span>
              </div>
              <div className="tpl-filters">
                <button className={'tpl-chip' + (industry === 'all' ? ' active' : '')} onClick={() => setIndustry('all')}>
                  <ion-icon name="grid-outline"></ion-icon>All<span className="n">{counts.all}</span>
                </button>
                {Object.keys(WF_INDUSTRIES).map((k) => (
                  <button key={k} className={'tpl-chip' + (industry === k ? ' active' : '')} onClick={() => setIndustry(k)}>
                    <ion-icon name={WF_INDUSTRIES[k].icon}></ion-icon>{WF_INDUSTRIES[k].label}<span className="n">{counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="tpl-scroll">
              <div className="tpl-grid">
                {list.length === 0 ? (
                  <div className="tpl-empty"><ion-icon name="albums-outline"></ion-icon><p>No templates match your search.</p></div>
                ) : list.map((t) => {
                  const ind = WF_INDUSTRIES[t.industry];
                  const tr = TRIGGERS[t.trigger];
                  return (
                    <div key={t.id} className="tpl-card">
                      <div className="tpl-card__top">
                        <div className="tpl-card__ic" style={{ background: ind.wash, color: ind.color }}><ion-icon name={ind.icon}></ion-icon></div>
                        <div className="tpl-card__tt">
                          <div className="nm">
                            <b>{t.name}</b>
                            {t.popular && <span className="tpl-pop"><ion-icon name="flame"></ion-icon>Popular</span>}
                          </div>
                          <small>{t.desc}</small>
                        </div>
                      </div>
                      <div className="tpl-card__meta">
                        <span className="tpl-tag" style={{ background: ind.wash, color: ind.color }}><ion-icon name={ind.icon}></ion-icon>{ind.label}</span>
                        <span className="tpl-metaitem"><ion-icon name={tr.icon}></ion-icon>{tr.label}</span>
                        <span className="tpl-metasep"></span>
                        <span className="tpl-metaitem"><ion-icon name="git-network-outline"></ion-icon>{t.steps} steps</span>
                      </div>
                      <div className="tpl-steps">
                        {t.preview.slice(0, 3).map((p, i) => <span key={i} className="tpl-steppill">{p}</span>)}
                        {t.preview.length > 3 && <span className="tpl-steppill more">+{t.preview.length - 3} more</span>}
                      </div>
                      <div className="tpl-card__foot">
                        <button className="tpl-use" onClick={() => startClone(t)}><ion-icon name="copy-outline"></ion-icon>Use template</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =================== APP =================== */
function App() {
  const [t, setTweak] = useTweaks(RUN_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const dev = RUN_DEVICES[device];
  const fit = useFit(dev.w, dev.h);

  const [runs, setRuns] = useState(RUNS);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0);

  /* live elapsed clock for in-progress runs */
  useEffect(() => {
    const anyLive = runs.some((r) => isLive(r.status));
    if (!anyLive) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [runs]);
  const liveSecs = (r) => parseDur(r.elapsed) + (isLive(r.status) ? tick : 0);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const counts = useMemo(() => ({
    all: runs.length,
    inprogress: runs.filter((r) => isLive(r.status)).length,
    completed: runs.filter((r) => r.status === 'completed').length,
    failed: runs.filter((r) => r.status === 'failed').length,
  }), [runs]);

  const stats = useMemo(() => {
    const done = runs.filter((r) => r.status === 'completed' || r.status === 'failed');
    const avg = done.length ? Math.round(done.reduce((a, r) => a + parseDur(r.elapsed), 0) / done.length) : 0;
    return { total: runs.length, succeeded: counts.completed, inprogress: counts.inprogress, failed: counts.failed, avg: fmtDur(avg) };
  }, [runs, counts]);

  const filtered = useMemo(() => runs.filter((r) => {
    if (tab === 'inprogress' && !isLive(r.status)) return false;
    if (tab === 'completed' && r.status !== 'completed') return false;
    if (tab === 'failed' && r.status !== 'failed') return false;
    if (query.trim()) { const q = query.toLowerCase(); return (r.id + ' ' + r.wf + ' ' + r.entity).toLowerCase().includes(q); }
    return true;
  }), [runs, tab, query]);

  const openRun = runs.find((r) => r.id === openId) || null;

  const onAction = (kind, run) => {
    if (kind === 'cancel') { setRuns((rs) => rs.map((r) => r.id === run.id ? { ...r, status: 'failed', currentStep: '', steps: r.steps.map((s) => s.status === 'running' || s.status === 'waiting' ? { ...s, status: 'failed', detail: 'Cancelled by operator' } : s.status === 'pending' ? { ...s, status: 'skipped', detail: 'Not reached' } : s) } : r)); flash(`${run.id} cancelled`); }
    if (kind === 'retry') { flash(`${run.id} queued for retry`); }
  };

  const accentStyle = { '--kz-primary': t.accent };
  const compact = t.density === 'compact';

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={'pa-app' + (device === 'tablet' ? ' is-tablet' : '')} style={accentStyle}>
          <KzPaRail mid="automations" active="runs" />
          <div className="pa-main">
            <header className="pa-topbar">
              <div className="pa-topbar__crumb">
                <ion-icon name="git-network-outline"></ion-icon><a href="Koomzo POS - Automations.html" style={{ color: 'inherit', textDecoration: 'none' }}>Automations</a>
                <ion-icon name="chevron-forward-outline"></ion-icon><b>Run history</b>
              </div>
              <div className="pa-topbar__right">
                <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Live</span>
                <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
                <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
              </div>
            </header>

            <div className="pa-pagehead">
              <div className="pa-pagehead__t">
                <span className="pa-eyebrow">Automations</span>
                <h1>Run history <span className="count">{counts.all}</span></h1>
              </div>
              <div className="pa-pagehead__actions">
                <a className="pa-btn" href="Koomzo POS - Automations.html"><ion-icon name="arrow-back-outline"></ion-icon>Workflows</a>
                <button className="pa-btn" onClick={() => flash('Refreshed')}><ion-icon name="refresh-outline"></ion-icon>Refresh</button>
              </div>
            </div>

            <div className="au-stats">
              <div className="au-statcard"><div className="k"><ion-icon name="pulse-outline"></ion-icon>Total runs</div><div className="v">{stats.total}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="checkmark-circle-outline"></ion-icon>Succeeded</div><div className="v ok">{stats.succeeded}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="sync-outline"></ion-icon>In progress</div><div className="v run">{stats.inprogress}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="alert-circle-outline"></ion-icon>Failed</div><div className="v bad">{stats.failed}</div></div>
              <div className="au-statcard"><div className="k"><ion-icon name="timer-outline"></ion-icon>Avg duration</div><div className="v">{stats.avg}</div></div>
            </div>

            <div className="pa-toolbar">
              <div className="pa-search">
                <ion-icon name="search-outline"></ion-icon>
                <input placeholder="Search by run ID, workflow or record…" value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
              </div>
              <div className="au-tabs">
                {[['all', 'All'], ['inprogress', 'In progress'], ['completed', 'Completed'], ['failed', 'Failed']].map(([k, label]) => (
                  <button key={k} className={'au-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
                    {label}<span className="n">{k === 'all' ? counts.all : counts[k]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pa-tablewrap">
              {filtered.length === 0 ? (
                <div className="pa-empty"><ion-icon name="pulse-outline"></ion-icon><p>No runs match your filters.</p></div>
              ) : (
                <table className={'pa-table' + (compact ? ' pa-rowcompact' : '')} style={{ minWidth: 1040 }}>
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Workflow</th>
                      <th>Trigger</th>
                      <th>Started</th>
                      <th>Progress</th>
                      <th className="num">{'Duration'}</th>
                      <th>Status</th>
                      <th style={{ width: 46 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const pct = Math.round((r.stepsDone / r.stepsTotal) * 100);
                      const dur = isLive(r.status) ? fmtDur(liveSecs(r)) : r.elapsed;
                      return (
                        <tr key={r.id} className={openId === r.id ? 'sel' : ''} onClick={() => setOpenId(r.id)}>
                          <td>
                            <div className="pa-name"><b className="au-mono" style={{ fontSize: 14 }}>{r.id}</b><small className="au-entity">{r.entity}</small></div>
                          </td>
                          <td><span className="au-sub" style={{ color: 'var(--kz-ink-2)', fontWeight: 600 }}>{r.wf}</span></td>
                          <td><TriggerCell trigger={r.trigger} /></td>
                          <td><span className="au-sub">{r.startedAt}</span></td>
                          <td>
                            <div className="au-prog">
                              <div className="au-prog__top"><b>{r.stepsDone}/{r.stepsTotal}</b>{isLive(r.status) && <span>{r.currentStep}</span>}</div>
                              <div className="au-prog__track"><div className="au-prog__fill" style={{ width: pct + '%', background: progColor(r.status) }}></div></div>
                            </div>
                          </td>
                          <td className="num"><span className="au-mono">{dur}</span></td>
                          <td><RunStatusPill status={r.status} /></td>
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
                In-progress runs update live · click any run to inspect its step timeline
              </div>
              <div className="pa-footer__range">{filtered.length} of {runs.length} runs</div>
            </div>
          </div>

          {openRun && <RunDetail run={openRun} liveSecs={liveSecs(openRun)} onClose={() => setOpenId(null)} onAction={onAction} />}
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
