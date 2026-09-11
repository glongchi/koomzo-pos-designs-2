/* Koomzo Queue — display board (read-only) + serve console + intake + supervise. */
const { useState, useMemo, useEffect, useRef } = React;
const QD = window.QD;

const qfmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
const up5 = (m) => Math.max(0, Math.ceil(m / 5) * 5);
const THEMES = [
  { id: 'midnight', name: 'Midnight', sw: ['#1a1d2b', '#252939', '#6a61bf'] },
  { id: 'daylight', name: 'Daylight', sw: ['#f4f6f9', '#ffffff', '#6a61bf'] },
  { id: 'brand', name: 'Brand', sw: ['#6a61bf', '#8079cd', '#ffffff'] },
  { id: 'contrast', name: 'Contrast', sw: ['#000000', '#101014', '#ffffff'] },
];

function QDisplay({ q, theme }) {
  const [page, setPage] = useState(0);
  const [beat, setBeat] = useState(0);
  useEffect(() => { const i = setInterval(() => setBeat((b) => b + 1), 1000); return () => clearInterval(i); }, []);
  const lanes = q.lanes;
  const waiting = q.items.filter((x) => x.state === 'waiting').sort((a, b) => (b.pri - a.pri) || (a.created - b.created));
  const PER = 4, pages = Math.max(1, Math.ceil(waiting.length / PER));
  useEffect(() => { if (pages < 2) { setPage(0); return; } const i = setInterval(() => setPage((p) => (p + 1) % pages), 8000); return () => clearInterval(i); }, [pages]);
  const shown = waiting.slice(page * PER, page * PER + PER);
  const openLanes = lanes.filter((l) => l.state === 'open').length;
  const avg = q.cats.reduce((s, c) => s + c.dur, 0) / q.cats.length;
  const eta = (i) => up5(Math.round(((i + 1) / Math.max(1, openLanes)) * avg));

  return (
    <div className={'qd t-' + theme}>
      <header className="qd__top">
        <div className="qd__venue"><b>{q.preset.venue}</b><small>Now serving</small></div>
        <div className="sp"></div>
        <div className="qd__stat"><span className="k">Waiting</span><b>{waiting.length}</b></div>
        <div className="qd__stat"><span className="k">{q.preset.laneTermPl} open</span><b>{openLanes}</b></div>
        <div className="qd__clock"><i className={beat % 2 ? 'dim' : ''}></i>{qfmt(QD.now)}</div>
      </header>

      <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(7px,.8cqw,14px)' }}>
        <h2 className="qd__lbl">{q.preset.laneTermPl}</h2>
        <div className="qd__lanes">
          {lanes.map((l) => {
            const it = q.items.find((x) => x.lane === l.id && (x.state === 'serving' || x.state === 'called'));
            const cat = it ? q.cats.find((c) => c.id === it.cat) : null;
            const cls = l.state !== 'open' ? l.state : it ? (it.state === 'called' ? 'called' : '') : 'idle';
            return (
              <article className={'ql ' + cls} key={l.id}>
                <div className="ql__hd">
                  <span className="ql__badge">{l.short}</span>
                  <span className="ql__name">{l.name}</span>
                </div>
                <div className="ql__mid">
                  <div className="ql__num">
                    {l.state === 'paused' ? 'Paused' : l.state === 'closed' ? 'Closed' : it ? it.num : '—'}
                  </div>
                  {it && l.state === 'open' && <div className="ql__who">{cat.name}{it.label ? ' · ' + it.label : ''}</div>}
                  {!it && l.state === 'open' && <div className="ql__who">Free — next {q.preset.itemTerm.toLowerCase()} please</div>}
                </div>
                <div className="ql__ft">
                  {l.state !== 'open' ? <><ion-icon name="pause-circle-outline"></ion-icon>Back shortly</>
                    : it ? (it.state === 'called'
                      ? <><ion-icon name="megaphone-outline"></ion-icon>{q.preset.msg.called}</>
                      : <><ion-icon name="ellipse" style={{ fontSize: 'clamp(7px,.6cqw,10px)' }}></ion-icon>In progress</>)
                    : <><ion-icon name="checkmark-circle-outline"></ion-icon>{q.preset.msg.free}</>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="qd__next">
        <div className="qd__nexthd">
          <h2 className="qd__lbl">Next up</h2>
          <div className="sp"></div>
          {pages > 1 && <div className="qd__dots">{Array.from({ length: pages }).map((_, i) => <i key={i} className={i === page ? 'on' : ''}></i>)}</div>}
        </div>
        <div className="qd__q">
          {shown.map((x, i) => {
            const idx = page * PER + i;
            return (
              <div className={'qq' + (x.pri ? ' pri' : '')} key={x.id}>
                <span className="qq__n">{x.num}</span>
                <span className="qq__b"><small>{q.cats.find((c) => c.id === x.cat).name}</small></span>
                <span className="qq__w">~{eta(idx)}m</span>
              </div>
            );
          })}
          {!waiting.length && <div className="qq empty">No queue — step up to any open {q.preset.laneTerm.toLowerCase()}.</div>}
        </div>
      </section>

      <footer className="qd__foot">
        <ion-icon name="ticket-outline"></ion-icon>
        <span>{q.preset.msg.foot}</span>
        <div className="sp"></div>
        <span className="hide-s">{q.peers.length + 1} devices in sync</span>
      </footer>
    </div>
  );
}

Object.assign(window, { QDisplay, qfmt, up5, THEMES });
