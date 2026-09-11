/* Koomzo Hotel — availability, rates and restrictions (the ARI grid).
   Room type × 14 nights. Availability is DERIVED, never stored: rooms of the
   type, less anything off sale, less stays that cover the night. A number
   nobody types cannot drift from the rack. Rate and restriction overrides are
   the only writes, and they are sparse — keyed type|day, absent means default. */

const ARI_DAYS = 14;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/* today is Sunday 16 August 2026 — day 0. Offsets walk the month forward. */
const ariDay = (d) => {
  const n = HT.dayNo + d;
  return { d, dow: DOW[(0 + d) % 7], no: n > 31 ? n - 31 : n, month: n > 31 ? 'Sep' : HT.month, wk: (0 + d) % 7 === 0 || (0 + d) % 7 === 6 };
};
const ARI_WEEK = Array.from({ length: ARI_DAYS }, (_, d) => ariDay(d));
const kXaf = (n) => n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);
const ariKey = (type, d) => type + '|' + d;

/* rooms of a type that can be sold at all */
const ariRooms = (type, st) => HT.rooms.filter((r) => r.type === type &&
  !st.maint.some((m) => m.no === r.no && m.ooo && m.state !== 'fixed'));

/* how many of a type are taken on night d */
const ariTaken = (type, d, st) => st.stays.filter((s) => {
  if (s.status === 'out' || s.status === 'cxl') return false;
  const r = roomOf(s.no);
  if (!r || r.type !== type) return false;
  return d >= s.from && d < s.from + s.nights;
}).length;

function AriGrid({ api }) {
  const st = api.st;
  const [ov, setOv] = useState({});                 /* sparse overrides, type|day → {rate,minLos,cta,ctd,stop} */
  const [cell, setCell] = useState(null);
  const restrictOn = gate('restrictions');

  const at = (type, d) => ov[ariKey(type, d)] || {};
  const rateAt = (type, d) => {
    const o = at(type, d);
    if (o.rate) return o.rate;
    const base = typeOf(type).rate;
    return ARI_WEEK[d].wk ? Math.round(base * 1.15) : base;   /* weekend uplift, as the rate sheet says */
  };
  const freeAt = (type, d) => Math.max(0, ariRooms(type, st).length - ariTaken(type, d, st));

  const write = (type, days, patch) => setOv((c) => {
    const next = { ...c };
    days.forEach((d) => { next[ariKey(type, d)] = { ...(next[ariKey(type, d)] || {}), ...patch }; });
    return next;
  });

  const tonight = HT.types.reduce((n, t) => n + freeAt(t.id, 0), 0);
  const weekFree = ARI_WEEK.slice(0, 7).reduce((n, w) => n + HT.types.reduce((m, t) => m + freeAt(t.id, w.d), 0), 0);
  const stopped = Object.values(ov).filter((o) => o.stop).length;

  return (
    <>
      <div className="htkpi" style={{ marginBottom: 12 }}>
        <div className="htk"><div className="k">Free tonight</div><div className="v">{tonight}<small> · of {HT.rooms.length}</small></div><div className="s">{ARI_WEEK[0].dow} {ARI_WEEK[0].no} {ARI_WEEK[0].month}</div></div>
        <div className="htk"><div className="k">Room nights left</div><div className="v">{weekFree}</div><div className="s">Next seven nights</div></div>
        <div className="htk"><div className="k">Off sale</div><div className="v">{HT.rooms.length - HT.types.reduce((n, t) => n + ariRooms(t.id, st).length, 0)}</div><div className="s">Maintenance holds</div></div>
        <div className="htk"><div className="k">Stop sells</div><div className="v">{stopped}</div><div className="s">{stopped ? 'Manual holds set' : 'None set'}</div></div>
      </div>

      <div className="htari">
        <div className="htari__g" style={{ gridTemplateColumns: '196px repeat(' + ARI_DAYS + ', minmax(64px, 1fr))' }}>
          <div className="htari__h">
            <div className="htari__hd corner">Room type</div>
            {ARI_WEEK.map((w) => (
              <div key={w.d} className={'htari__hd' + (w.d === 0 ? ' today' : '') + (w.wk ? ' wk' : '')}>
                {w.dow}<b>{w.no}</b>
              </div>
            ))}
          </div>

          {HT.types.map((t) => (
            <div className="htari__r" key={t.id}>
              <div className="htari__rn">
                <span>{t.name}</span>
                <small>{ariRooms(t.id, st).length} sellable</small>
              </div>
              {ARI_WEEK.map((w) => {
                const o = at(t.id, w.d);
                const free = freeAt(t.id, w.d);
                const cls = o.stop ? ' stop' : free === 0 ? ' sold' : free <= 1 ? ' tight' : '';
                return (
                  <button key={w.d} className={'htari__c' + cls + (w.wk ? ' wk' : '')}
                    onClick={() => setCell({ type: t.id, d: w.d })}
                    title={t.name + ' · ' + w.dow + ' ' + w.no + ' ' + w.month}>
                    <span className="av">{o.stop ? '—' : free}</span>
                    <span className="rt">{kXaf(rateAt(t.id, w.d))}</span>
                    {restrictOn && (
                      <span className="fl">
                        {o.minLos > 1 && <i title={'Minimum ' + o.minLos + ' nights'}>{o.minLos}+</i>}
                        {o.cta && <i title="Closed to arrival">CTA</i>}
                        {o.ctd && <i title="Closed to departure">CTD</i>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="htlegend" style={{ marginTop: 10 }}>
        <span><i className="htdot vac"></i>Rooms free that night</span>
        <span><i className="htdot due"></i>One left</span>
        <span><i className="htdot occ"></i>Sold out</span>
        {restrictOn && <span><b style={{ font: '700 10px var(--kz-font-num)' }}>2+</b> minimum nights</span>}
        {restrictOn && <span><b style={{ font: '700 10px var(--kz-font-num)' }}>CTA</b> closed to arrival</span>}
        {restrictOn && <span><b style={{ font: '700 10px var(--kz-font-num)' }}>CTD</b> closed to departure</span>}
      </div>

      {gate('channelsync') && (
        <div className="htbanner" style={{ marginTop: 12 }}>
          <ion-icon name="globe-outline"></ion-icon>
          <span>Availability and restrictions push to connected channels at the next sync. <b>Rates never push</b> — an OTA rate is stored as it arrives, so commission stays visible on the folio.</span>
        </div>
      )}

      {cell && <AriSheet cell={cell} rateAt={rateAt} freeAt={freeAt} at={at} write={write} api={api}
        restrictOn={restrictOn} onClose={() => setCell(null)} />}
    </>
  );
}

/* ---------------- write a cell, a week, or the fortnight ---------------- */
function AriSheet({ cell, rateAt, freeAt, at, write, api, restrictOn, onClose }) {
  const { type, d } = cell;
  const t = typeOf(type);
  const w = ARI_WEEK[d];
  const o = at(type, d);
  const [span, setSpan] = useState('day');
  const [rate, setRate] = useState(rateAt(type, d));
  const [minLos, setMinLos] = useState(o.minLos || 1);
  const [cta, setCta] = useState(!!o.cta);
  const [ctd, setCtd] = useState(!!o.ctd);
  const [stop, setStop] = useState(!!o.stop);

  /* the span decides which nights the write touches — same edit, three reaches */
  const days = span === 'day' ? [d]
    : span === 'week' ? ARI_WEEK.filter((x) => x.d >= d && x.d < d + 7).map((x) => x.d)
    : ARI_WEEK.filter((x) => x.d >= d).map((x) => x.d);
  const spanLabel = span === 'day' ? 'this night' : span === 'week' ? days.length + ' nights' : 'all ' + days.length + ' remaining nights';

  return (
    <HtSheet title={t.name} sub={w.dow + ' ' + w.no + ' ' + w.month + ' · ' + freeAt(type, d) + ' of ' + ariRooms(type, api.st).length + ' free'}
      onClose={onClose}
      foot={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="s" className="btn primary" onClick={() => {
          write(type, days, { rate, minLos, cta, ctd, stop });
          api.toast(t.name + ' · ' + spanLabel + ' updated' + (gate('channelsync') ? ' — channels at next sync' : ''));
          onClose();
        }}><ion-icon name="checkmark-outline"></ion-icon>Apply to {spanLabel}</button>,
      ]}>
      <div style={{ marginBottom: 14 }}>
        <span className="lbl">Apply to</span>
        <div style={{ marginTop: 7 }}>
          <HtSeg value={span} onChange={setSpan} options={[
            { v:'day', label:'This night' }, { v:'week', label:'This week' }, { v:'all', label:'Rest of fortnight' }]} />
        </div>
      </div>

      <div>
        <span className="lbl">Nightly rate</span>
        <div className="field" style={{ marginTop: 7 }}><ion-icon name="pricetag-outline"></ion-icon>
          <input type="number" step="500" value={rate} onChange={(e) => setRate(+e.target.value || 0)} />
          <span style={{ font: '600 12px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>{HT.ccy}</span></div>
        <p className="htnote">Default {xaf(typeOf(type).rate)}{w.wk ? ' · +15% weekend' : ''}. A rate change never rewrites a folio — the stay keeps the rate it was sold at.</p>
      </div>

      {restrictOn ? (
        <>
          <div style={{ marginTop: 14 }}>
            <span className="lbl">Minimum length of stay</span>
            <div style={{ marginTop: 7 }}>
              <HtSeg value={String(minLos)} onChange={(v) => setMinLos(+v)} options={[
                { v:'1', label:'None' }, { v:'2', label:'2 nights' }, { v:'3', label:'3 nights' }, { v:'7', label:'A week' }]} />
            </div>
          </div>
          <div className="htari__sw">
            <button className={'htari__t' + (cta ? ' on' : '')} onClick={() => setCta(!cta)}>
              <ion-icon name={cta ? 'checkbox-outline' : 'square-outline'}></ion-icon>
              <div><div className="nm">Closed to arrival</div><div className="ar">No new check-in on this night</div></div>
            </button>
            <button className={'htari__t' + (ctd ? ' on' : '')} onClick={() => setCtd(!ctd)}>
              <ion-icon name={ctd ? 'checkbox-outline' : 'square-outline'}></ion-icon>
              <div><div className="nm">Closed to departure</div><div className="ar">No check-out on this night</div></div>
            </button>
            <button className={'htari__t' + (stop ? ' on' : '')} onClick={() => setStop(!stop)}>
              <ion-icon name={stop ? 'checkbox-outline' : 'square-outline'}></ion-icon>
              <div><div className="nm">Stop sell</div><div className="ar">Hold the type off sale entirely</div></div>
            </button>
          </div>
          <p className="htnote">Restrictions never cancel a booking already taken. They only close the type to new business.</p>
        </>
      ) : (
        <div className="htbanner" style={{ marginTop: 14 }}>
          <ion-icon name="lock-closed-outline"></ion-icon>
          <span>Minimum stay and arrival restrictions are part of the <b>Standard</b> plan. Rates and availability work here on every plan.</span>
        </div>
      )}
    </HtSheet>
  );
}

Object.assign(window, { AriGrid, AriSheet, ARI_WEEK, ariRooms, ariTaken });
