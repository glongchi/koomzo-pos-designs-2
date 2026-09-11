/* ============================================================
   Koomzo POS Suite — KITCHEN DISPLAY (KDS)
   Three working views:
     Expo     — ticket kanban (To Cook · Ready · Served) + per-station progress
     Station  — one station's own items only, grouped by ticket, oldest first
     All day  — aggregated pending quantities per dish, for batching
   SLA timers, item ticks, bump / recall.
   ============================================================ */

const STATION_KEYS = () => Object.keys(window.RK_STATIONS).filter((k) => k !== 'none');
const STATION_ICONS = { grill: 'flame-outline', fry: 'thermometer-outline', cold: 'snow-outline', pizza: 'flame-outline',
  pasta: 'restaurant-outline', dessert: 'ice-cream-outline', bar: 'beer-outline', none: 'ellipse-outline' };
const COURSE_ORDER = { starters: 0, mains: 1, grills: 1, sides: 2, desserts: 3, drinks: 4, snacks: 2, beer: 3, wine: 3, cocktails: 3, spirits: 3, shots: 3 };
const courseOf = (name, menu) => {
  const m = (menu || []).find((x) => x.name === name);
  return m ? m.cat : null;
};
/* per-station progress for one ticket: [{station, total, done}] */
function stationProgress(t) {
  const map = {};
  t.items.forEach((it) => {
    const k = it.station || 'none';
    if (!map[k]) map[k] = { station: k, total: 0, done: 0 };
    map[k].total += 1;
    if (it.done) map[k].done += 1;
  });
  return Object.values(map);
}

function StationPills({ t }) {
  const rows = stationProgress(t);
  if (rows.length < 2) return null;
  return (
    <div className="kprog">
      {rows.map((r) => {
        const st = window.RK_STATIONS[r.station] || window.RK_STATIONS.none;
        const clear = r.done === r.total;
        return (
          <span key={r.station} className={'kprog__p' + (clear ? ' clear' : '')}
            style={clear ? null : { background: st.wash, color: st.color }}>
            {clear && <ion-icon name="checkmark-outline"></ion-icon>}
            {st.label} {r.done}/{r.total}
          </span>
        );
      })}
    </div>
  );
}

function KdsTicketCard({ t, now, warn, late, onBump, onRecall, onToggleItem }) {
  const mins = elapsedMin(t.firedAt, now);
  const cls = slaClass(mins, warn, late);
  const urgent = t.status !== 'done' && cls === 'late';
  const warnish = t.status !== 'done' && cls === 'warn';
  const fl = window.RK_FLOORS.find((f) => f.id === t.floor);
  const tLabel = fl ? (fl.tables.find((x) => x.id === t.table)?.label || t.table) : t.table;
  const bumpLabel = t.status === 'cook' ? 'Mark Ready' : t.status === 'ready' ? 'Served' : 'Done';
  return (
    <div className={'kcard' + (urgent ? ' urgent' : warnish ? ' warnish' : '')}>
      <div className="kcard__top">
        <span className="kcard__table"><ion-icon name="grid-outline" style={{ fontSize: 15, color: 'var(--kz-accent)' }}></ion-icon>Table {tLabel}<span className="no">#{t.no}</span></span>
        <span className="kcard__guests"><ion-icon name="people-outline"></ion-icon>{t.guests}</span>
        <span className={'kcard__timer ' + cls}><ion-icon name="time-outline"></ion-icon>{elapsedLabel(t.firedAt, now)}</span>
      </div>
      <div className="kcard__server"><ion-icon name="person-outline"></ion-icon>{t.server}</div>
      <StationPills t={t} />
      <div className="kcard__items">
        {t.items.map((it, i) => {
          const st = window.RK_STATIONS[it.station] || window.RK_STATIONS.none;
          return (
            <div key={i} className={'kitem' + (it.done ? ' done' : '')} onClick={() => onToggleItem(t.id, i)} style={{ cursor: 'pointer' }}>
              <span className="kitem__qty" style={{ background: st.wash, color: st.color }}>{it.qty}×</span>
              <div className="kitem__body">
                <div className="kitem__name">
                  {it.name}
                  <span className="kstation"><i style={{ background: st.color }}></i>{st.label}</span>
                  {it.tags && it.tags.length > 0 && <TagChips tags={it.tags} size="k" />}
                </div>
                {it.notes && <div className="kitem__note"><ion-icon name="alert-circle-outline"></ion-icon>{it.notes}</div>}
              </div>
              {it.done && <ion-icon name="checkmark-circle" style={{ fontSize: 18, color: 'var(--kz-success)' }}></ion-icon>}
            </div>
          );
        })}
      </div>
      <div className="kcard__foot">
        <button className={'kcard__bump ' + t.status} onClick={() => onBump(t.id)}>
          <ion-icon name={t.status === 'cook' ? 'checkmark-done-outline' : t.status === 'ready' ? 'walk-outline' : 'checkmark-outline'}></ion-icon>{bumpLabel}
        </button>
        <button className="kcard__recall" onClick={() => onRecall(t.id)} title="Recall"><ion-icon name="arrow-undo-outline"></ion-icon></button>
      </div>
    </div>
  );
}

/* ---------- Station view: one station, its items only ---------- */
function StationBoard({ tickets, station, now, warn, late, onToggleItem, onBump, menu }) {
  const st = window.RK_STATIONS[station];
  const groups = tickets
    .filter((t) => t.status !== 'done' && t.items.some((it) => it.station === station))
    .sort((a, b) => a.firedAt - b.firedAt)
    .map((t) => {
      const fl = window.RK_FLOORS.find((f) => f.id === t.floor);
      const idx = t.items.map((it, i) => ({ it, i })).filter((x) => x.it.station === station)
        .sort((a, b) => (COURSE_ORDER[courseOf(a.it.name, menu)] ?? 9) - (COURSE_ORDER[courseOf(b.it.name, menu)] ?? 9));
      return { t, label: fl ? (fl.tables.find((x) => x.id === t.table)?.label || t.table) : t.table, rows: idx };
    });

  return (
    <div className="sboard">
      <div className="sboard__hd">
        <span className="sboard__ic" style={{ background: st.wash, color: st.color }}><ion-icon name={STATION_ICONS[station] || 'ellipse-outline'}></ion-icon></span>
        <div>
          <div className="sboard__n">{st.label} station</div>
          <div className="sboard__m">{groups.reduce((s, g) => s + g.rows.filter((r) => !r.it.done).length, 0)} items to make · {groups.length} tickets · oldest first</div>
        </div>
      </div>
      {groups.length === 0 && (
        <div className="klane__empty" style={{ marginTop: 30 }}><ion-icon name="checkmark-done-outline"></ion-icon><p>{st.label} is clear</p></div>
      )}
      <div className="sboard__grid">
        {groups.map(({ t, label, rows }) => {
          const mins = elapsedMin(t.firedAt, now);
          const cls = slaClass(mins, warn, late);
          const clear = rows.every((r) => r.it.done);
          return (
            <div className={'sgrp' + (cls === 'late' ? ' urgent' : cls === 'warn' ? ' warnish' : '') + (clear ? ' clear' : '')} key={t.id}>
              <div className="sgrp__hd">
                <span className="sgrp__t">Table {label}<span className="no">#{t.no}</span></span>
                <span className={'kcard__timer ' + cls}><ion-icon name="time-outline"></ion-icon>{elapsedLabel(t.firedAt, now)}</span>
              </div>
              <div className="sgrp__rows">
                {rows.map(({ it, i }) => (
                  <button key={i} className={'srow' + (it.done ? ' done' : '')} onClick={() => onToggleItem(t.id, i)}>
                    <span className="srow__q" style={{ background: st.wash, color: st.color }}>{it.qty}×</span>
                    <span className="srow__b">
                      <span className="srow__n">{it.name}
                        {it.tags && it.tags.length > 0 && <TagChips tags={it.tags} size="k" />}
                      </span>
                      {(() => { const c = courseOf(it.name, menu); return c ? <span className="srow__c">{c}</span> : null; })()}
                      {it.notes && <span className="kitem__note"><ion-icon name="alert-circle-outline"></ion-icon>{it.notes}</span>}
                    </span>
                    <span className={'srow__tick' + (it.done ? ' on' : '')}><ion-icon name="checkmark-outline"></ion-icon></span>
                  </button>
                ))}
              </div>
              {clear && (
                <button className="sgrp__bump" onClick={() => onBump(t.id)}>
                  <ion-icon name="arrow-forward-outline"></ion-icon>{st.label} done — send to pass
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- All-day view: aggregated pending quantities ---------- */
function AllDayBoard({ tickets, station, now }) {
  const rows = {};
  tickets.filter((t) => t.status !== 'done').forEach((t) => {
    t.items.forEach((it) => {
      if (it.done) return;
      if (station !== 'all' && it.station !== station) return;
      const k = it.name;
      if (!rows[k]) rows[k] = { name: it.name, station: it.station, qty: 0, tickets: 0, oldest: t.firedAt, tags: it.tags };
      rows[k].qty += it.qty;
      rows[k].tickets += 1;
      rows[k].oldest = Math.min(rows[k].oldest, t.firedAt);
    });
  });
  const list = Object.values(rows).sort((a, b) => b.qty - a.qty || a.oldest - b.oldest);
  const max = list.length ? list[0].qty : 1;
  const total = list.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="sboard">
      <div className="sboard__hd">
        <span className="sboard__ic" style={{ background: 'var(--kz-accent-wash)', color: 'var(--kz-accent)' }}><ion-icon name="albums-outline"></ion-icon></span>
        <div>
          <div className="sboard__n">All day</div>
          <div className="sboard__m">{total} portions outstanding across {list.length} dishes — batch the big ones</div>
        </div>
      </div>
      {!list.length && <div className="klane__empty" style={{ marginTop: 30 }}><ion-icon name="checkmark-done-outline"></ion-icon><p>Nothing outstanding</p></div>}
      <div className="adlist">
        {list.map((r) => {
          const st = window.RK_STATIONS[r.station] || window.RK_STATIONS.none;
          return (
            <div className="adrow" key={r.name}>
              <span className="adrow__q" style={{ background: st.wash, color: st.color }}>{r.qty}</span>
              <span className="adrow__b">
                <span className="adrow__n">{r.name}{r.tags && r.tags.length > 0 && <TagChips tags={r.tags} size="k" />}</span>
                <span className="adrow__m">
                  <span className="kstation"><i style={{ background: st.color }}></i>{st.label}</span>
                  {r.tickets + (r.tickets > 1 ? ' tickets' : ' ticket') + ' · oldest ' + elapsedLabel(r.oldest, now)}
                </span>
              </span>
              {max > 1 && <span className="adrow__bar"><i style={{ width: (r.qty / max * 100) + '%', background: st.color }}></i></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kitchen() {
  const { tickets, now, bumpTicket, recallTicket, toggleItemDone, tweaks, counts, menu } = useSuite();
  const warn = tweaks.slaWarn ?? 6;
  const late = tweaks.slaLate ?? 10;
  const [floorFilter, setFloorFilter] = useState('all');
  const [view, setView] = useState('expo');
  const [station] = useState('all');

  const filtered = tickets.filter((t) => floorFilter === 'all' || t.floor === floorFilter);
  const lanes = [
    { id: 'cook', label: 'To Cook' },
    { id: 'ready', label: 'Ready' },
    { id: 'done', label: 'Served' },
  ];
  const byLane = (id) => filtered.filter((t) => t.status === id).sort((a, b) => a.firedAt - b.firedAt);
  const pendingAt = (k) => tickets.filter((t) => t.status !== 'done')
    .reduce((s, t) => s + t.items.filter((it) => it.station === k && !it.done).length, 0);

  return (
    <div className="screen">
      <div className="kds">
        <div className="kbar">
          <span className="kbar__title"><ion-icon name="restaurant-outline"></ion-icon><span className="klbl">Kitchen Display</span></span>
          <div className="kbar__filter">
            {[['expo', 'Expo', 'albums-outline'], ['allday', 'All day', 'stats-chart-outline']].map(([v, l, ic]) => (
              <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                <ion-icon name={ic}></ion-icon>{l}
              </button>
            ))}
          </div>
          {view === 'expo' && (
            <div className="kbar__counts">
              <span className="kcount cook"><span className="n">{counts.cook}</span>To cook</span>
              <span className="kcount ready"><span className="n">{counts.ready}</span>Ready</span>
              <span className="kcount done"><span className="n">{counts.done}</span>Served</span>
            </div>
          )}
          <div className="kbar__right">
            {counts.late > 0 && <span className="kcount" style={{ color: 'var(--kz-sla-late)', borderColor: 'var(--kz-sla-late)' }}><ion-icon name="alert-circle-outline" style={{ fontSize: 16 }}></ion-icon>{counts.late} over SLA</span>}
            {view === 'expo' && (
              <div className="kbar__filter">
                <button className={floorFilter === 'all' ? 'active' : ''} onClick={() => setFloorFilter('all')}><ion-icon name="apps-outline"></ion-icon>All</button>
                {window.RK_FLOORS.map((f) => (
                  <button key={f.id} className={floorFilter === f.id ? 'active' : ''} onClick={() => setFloorFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {view === 'expo' && (
          <div className="klanes">
            {lanes.map((lane) => {
              const items = byLane(lane.id);
              return (
                <div key={lane.id} className={'klane ' + lane.id}>
                  <div className="klane__head">
                    <span className="klane__dot"></span>
                    <span className="klane__title">{lane.label}</span>
                    <span className="klane__n">{items.length}</span>
                  </div>
                  <div className="klane__scroll">
                    {items.length === 0 && (
                      <div className="klane__empty"><ion-icon name="ellipse-outline"></ion-icon><p>Nothing here</p></div>
                    )}
                    {items.map((t) => (
                      <KdsTicketCard key={t.id} t={t} now={now} warn={warn} late={late}
                        onBump={bumpTicket} onRecall={recallTicket} onToggleItem={toggleItemDone} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'allday' && <AllDayBoard tickets={tickets} station={station} now={now} />}
      </div>
    </div>
  );
}

Object.assign(window, { Kitchen, KdsTicketCard, StationBoard, AllDayBoard, StationPills, courseOf, stationProgress, STATION_ICONS });
