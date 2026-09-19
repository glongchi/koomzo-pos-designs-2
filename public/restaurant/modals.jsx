/* ============================================================
   Koomzo POS Suite — modals: Charge · Split bill · Note/Allergen
   ============================================================ */

/* ---------------- CHARGE / TENDER ---------------- */
function ChargeSheet({ total, onDone, onClose, orderNo }) {
  const [room, setRoom] = useState(null);
  /* Charge to room only exists when the capability is on AND a hotel is
     actually publishing occupied rooms. No hotel, no tender. */
  const canRoom = !!(window.KZFolio && KZFolio.available() && window.KZ && KZ.on('restaurant', 'roomcharge'));
  const guestRooms = canRoom ? KZFolio.rooms() : [];
  /* phases, tenders array and persistence all come from kz/kz-charge.jsx */
  const ch = window.useCharge(total, { ticketNo: orderNo, extras: { loyalty: true, room: canRoom, split: true }, onDone: onDone });
  const T = ch.T, P = ch.P;
  const tenders = ch.list;
  const tender = ch.tender, setTender = ch.setTender, paid = ch.paid;
  const blocked = tender === 'room' && !room;
  const settle = () => {
    if (tender === 'room') {
      KZFolio.post({ stayId: room.stayId, no: room.no, kind: 'fnb', amount: total, ccy: 'XAF',
        desc: 'Restaurant · order ' + (orderNo || '—'), src: 'Lodge Restaurant', ref: orderNo });
    }
    ch.request();
  };
  if (paid) {
    return (
      <div className="scrim" onClick={onDone}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet__pad">
            <div className="paid">
              <div className="paid__icon"><ion-icon name="checkmark-circle"></ion-icon></div>
              <h3 className="sheet__title">{tender === 'room' ? 'Charged to the room' : 'Payment Successful'}</h3>
              <p className="sheet__sub">{money(total)} · {tender === 'room'
                ? 'Room ' + room.no + ' · ' + room.guest + ' — settles at checkout'
                : T.label((ch.tenders[ch.tenders.length - 1] || {}).id)}</p>
            </div>
            <div className="sheet__actions">
              <button className="btn-fill accent" style={{ flex: 1 }} onClick={ch.finish}>New Order</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">Charge Order</h3>
          <p className="sheet__sub">{orderNo ? 'Order ' + window.KZ_TICKET.short(orderNo) + ' · ' : ''}
            {ch.tenders.length ? money(ch.balance) + ' still to take' : 'Select a payment method to tender.'}</p>
          <div className="sheet__display">{money(ch.take)}</div>
          {ch.phase === P.PENDING && (
            <div style={{ border: '1px solid #e8d6a8', background: 'var(--kz-warning-wash)', borderRadius: 'var(--kz-radius)', padding: '14px 15px', marginBottom: 16 }}>
              <div style={{ font: '700 13px var(--kz-font-sans)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <ion-icon name="phone-portrait-outline" style={{ color: '#8a6414', fontSize: 16 }}></ion-icon>
                Requested · {T.label(tender)}</div>
              <p style={{ margin: '5px 0 0', font: '400 12.5px/1.55 var(--kz-font-sans)', color: 'var(--kz-muted)' }}>{T.pendingCopy(tender)}</p>
              <div style={{ font: '700 26px var(--kz-font-num)', color: '#8a6414', marginTop: 8 }}>{Math.max(0, ch.left)}s</div>
            </div>
          )}
          <div className="tenders" style={ch.phase === P.PENDING ? { display: 'none' } : null}>
            {tenders.map((t) => (
              <button key={t.id} className={'tender' + (tender === t.id ? ' sel' : '')} onClick={() => setTender(t.id)}>
                <ion-icon name={t.icon}></ion-icon>{t.label}
              </button>
            ))}
          </div>
          {tender === 'room' && (
            <div style={{ marginBottom: 18 }}>
              <p className="sheet__sub" style={{ marginBottom: 8 }}>Which room? The guest signs; the bill lands on their folio.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {guestRooms.map((r) => (
                  <button key={r.stayId} className={'tender' + (room && room.stayId === r.stayId ? ' sel' : '')}
                    style={{ height: 54, flexDirection: 'row', gap: 8, padding: '0 14px', width: 'auto' }}
                    onClick={() => setRoom(r)}>
                    <b style={{ font: '700 15px var(--kz-font-num)' }}>{r.no}</b>
                    <span style={{ font: '500 13px var(--kz-font-sans)' }}>{r.guest}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="sheet__actions">
            <button className="btn-ghost" onClick={ch.busy ? ch.cancel : onClose}>{ch.busy ? 'Cancel request' : 'Cancel'}</button>
            <button className="btn-fill" disabled={blocked || ch.busy} style={blocked || ch.busy ? { opacity: .45 } : null} onClick={settle}>
              {ch.busy ? 'Waiting…' : tender === 'room' ? (room ? 'Charge to ' + room.no : 'Pick a room') : T.cta(tender, ch.take)}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SPLIT BILL ---------------- */
function SplitSheet({ order, guests, onClose }) {
  const seatCount = Math.max(2, guests || 2);
  const [assign, setAssign] = useState(() => order.map(() => 0)); // each line → seat index
  const seatTotals = useMemo(() => {
    const arr = Array(seatCount).fill(0);
    order.forEach((o, i) => {
      const unit = o.priceOverride != null ? o.priceOverride : o.price;
      arr[assign[i]] += unit * o.qty * (1 - (o.discPct || 0) / 100);
    });
    return arr;
  }, [assign, order, seatCount]);
  const [activeSeat, setActiveSeat] = useState(0);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet sheet--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad" style={{ paddingBottom: 16 }}>
          <h3 className="sheet__title">Split the Bill</h3>
          <p className="sheet__sub">Assign each item to a guest. Tap a seat number on a line to move it.</p>
        </div>
        <div className="split">
          <div className="split__seats">
            {seatTotals.map((amt, s) => (
              <button key={s} className={'splseat' + (activeSeat === s ? ' active' : '')} onClick={() => setActiveSeat(s)}>
                <div className="lbl">Guest {s + 1}</div>
                <div className="amt">{money(amt)}</div>
              </button>
            ))}
          </div>
          <div className="split__items">
            {order.map((o, i) => {
              const unit = o.priceOverride != null ? o.priceOverride : o.price;
              return (
                <div key={o.uid} className="splitem">
                  <span className="splitem__name">{o.qty}× {o.name}</span>
                  <span className="splitem__price">{money(unit * o.qty)}</span>
                  <div className="splitem__assign">
                    {Array.from({ length: seatCount }).map((_, s) => (
                      <button key={s} className={assign[i] === s ? 'on' : ''}
                        onClick={() => setAssign((a) => a.map((v, idx) => idx === i ? s : v))}>{s + 1}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="sheet__pad" style={{ paddingTop: 16 }}>
          <div className="sheet__actions">
            <button className="btn-ghost" onClick={onClose}>Close</button>
            <button className="btn-fill accent" onClick={onClose}>Charge Guest {activeSeat + 1} · {money(seatTotals[activeSeat])}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- NOTE + ALLERGEN SHEET ---------------- */
const QUICK_NOTES = ['No onion', 'Extra spicy', 'On the side', 'Well done', 'No ice', 'Allergy — check', 'Gluten-free swap', 'To share'];

function NoteSheet({ line, onSave, onClose }) {
  const [note, setNote] = useState(line.notes || '');
  const [tags, setTags] = useState(line.tags || []);
  const allTags = ['v', 'vg', 'gf', 'spicy', 'nuts', 'shellfish', 'dairy'];
  const toggle = (id) => setTags((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__pad">
          <h3 className="sheet__title">{line.name}</h3>
          <p className="sheet__sub">Add a kitchen note and flag allergens / dietary info.</p>
          <textarea className="noteinput" placeholder="Kitchen note…" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="notequick">
            {QUICK_NOTES.map((q) => <button key={q} onClick={() => setNote((n) => n ? n + ', ' + q : q)}>{q}</button>)}
          </div>
          <div className="optset">
            {allTags.map((id) => {
              const tg = window.RK_TAGS[id];
              return (
                <button key={id} className={'optset__chip' + (tags.includes(id) ? ' on' : '')} onClick={() => toggle(id)}>
                  <ion-icon name={tg.icon}></ion-icon>{tg.label}
                </button>
              );
            })}
          </div>
          <div className="sheet__actions">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-fill accent" onClick={() => onSave({ notes: note.trim(), tags })}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChargeSheet, SplitSheet, NoteSheet });
