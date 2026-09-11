/* Koomzo MRP — shared primitives. Exported on window for the other babel scripts. */
const { useState, useMemo, useEffect, useRef } = React;

const Ico = ({ n, s }) => <ion-icon name={n} style={s ? { fontSize: s } : undefined}></ion-icon>;

function St({ tone, children, icon, live }) {
  return <span className={'st ' + (tone || '') + (live ? ' live' : '')}>{live ? <i className="dot"></i> : icon ? <Ico n={icon} /> : null}{children}</span>;
}

function KindChip({ p }) {
  const label = { raw:'Raw', wip:'WIP', finished:'Finished', packaging:'Pack' }[p.kind] || p.kind;
  return (
    <>
      <span className={'kchip ' + p.kind}>{label}</span>
      {p.src === 'import' && <span className="kchip import">{L('Import')}</span>}
    </>
  );
}

function PartAv({ p, size }) {
  const t = p.tint || MT.slate;
  const st = { background: t.bg, color: t.fg };
  if (size) { st.width = size; st.height = size; }
  return <div className="itav" style={st}><Ico n={p.icon || 'cube-outline'} /></div>;
}

function WoState({ o }) {
  const tone = WO_TONE[o.status] || 'mute';
  return <St tone={tone} live={o.status === 'progress'}>{L(WO_LABEL[o.status])}</St>;
}

function PowerChip({ mode }) {
  const m = mode === 'grid+gen' ? 'both' : mode;
  const label = { grid:'Grid', gen:L('Generator'), both:'Grid + gen' }[m];
  return <span className={'pwr ' + m}><Ico n={m === 'gen' ? 'battery-charging-outline' : 'flash-outline'} />{label}</span>;
}

/* connectivity chip — the plant loses grid and line often enough that this is
   permanent furniture, not a toast */
function SyncChip({ state, queued, onClick }) {
  if (state === 'off') return <button className="sync off" onClick={onClick}><Ico n="cloud-offline-outline" />{L('Offline')}{queued ? <b>· {queued}</b> : null}</button>;
  if (queued) return <button className="sync q" onClick={onClick}><Ico n="cloud-upload-outline" />{L('Queued')} <b>{queued}</b></button>;
  return <button className="sync" onClick={onClick}><Ico n="cloud-done-outline" />{L('All synced')}</button>;
}

function Gauge({ v, mark }) {
  const cls = v > 1 ? 'over' : v > 0.85 ? 'hot' : '';
  return <span className="gauge"><i className={cls} style={{ width: Math.min(100, v * 100) + '%' }}></i>{mark ? <b style={{ left: mark * 100 + '%' }}></b> : null}</span>;
}

function Num({ k, v, s, tone }) {
  return <div><div className="k">{k}</div><div className={'v' + (tone ? ' ' + tone : '')}>{v}</div>{s && <div className="s">{s}</div>}</div>;
}

function Bar({ done, scrap, total, tone }) {
  const d = total ? Math.min(100, (done / total) * 100) : 0;
  const s = total ? Math.min(100 - d, (scrap / total) * 100) : 0;
  return <span className={'wobar' + (tone ? ' ' + tone : '')}><i style={{ width: d + '%' }}></i><i className="scrap" style={{ width: s + '%' }}></i></span>;
}

function MiniSeg({ tabs, value, onChange }) {
  return (
    <div className="seg" style={{ marginBottom: 0 }}>
      {tabs.map(([id, label, n]) => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>{label}{n ? <i>{n}</i> : null}</button>
      ))}
    </div>
  );
}

function Hint({ icon, tone, children }) {
  return <div className={'hint' + (tone ? ' ' + tone : '')}><Ico n={icon || 'information-circle-outline'} /><div>{children}</div></div>;
}

function Kv({ k, v, num }) {
  return <div className="kv"><span className="k">{k}</span><span className={'v' + (num ? ' num' : '')}>{v}</span></div>;
}

function Blank({ icon, title, sub }) {
  return (
    <div className="empty" style={{ padding: '52px 24px' }}>
      <Ico n={icon} />
      <p><b style={{ display:'block', color:'var(--kz-ink-2)', font:'600 14px var(--kz-font-sans)' }}>{title}</b>{sub}</p>
    </div>
  );
}

/* a part row used in materials + plan detail */
function PartLine({ p, right }) {
  return (
    <div className="flrow">
      <PartAv p={p} size={34} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="nm">{p.name}</div>
        <div className="mt">{p.code} · {q(MR.avail(p), p.unit)} {L('Available').toLowerCase()}</div>
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { Ico, St, KindChip, PartAv, WoState, PowerChip, SyncChip, Gauge, Num, Bar, MiniSeg, Hint, Kv, Blank, PartLine });
