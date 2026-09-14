/* Koomzo Inventory — the movement sheet and the ledger it writes into.

   Stock in, Stock out, Move and Adjust are ONE operation with four presets. They differ
   by three things and nothing else: where stock comes from, where it goes, and what the
   quantity column means. Writing them as four screens is how four near-identical forms
   drift apart; writing them as one preset switch is how the operator still gets four
   plainly-named tasks.

   The rule this file exists to enforce: the result of a posting is never arithmetic the
   operator has to do in their head. Every line shows `12 → 9` as it is typed, and the
   quantity column is labelled per kind — because an absolute "new count" and a relative
   "quantity" in the same visual position, unlabelled, is the defect that makes an
   adjustment screen dangerous. */

const MOVE_KINDS = [
  ['in',     'Stock in',  'arrow-down-outline'],
  ['out',    'Stock out', 'arrow-up-outline'],
  ['move',   'Move',      'arrow-forward-outline'],
  ['adjust', 'Adjust',    'swap-vertical-outline'],
];

function MovementSheet({ kind, loc, caps, itemId, onClose, onPosted }) {
  const multi = !!caps.locations;
  const [k, setK] = useState(kind || 'in');
  const [at, setAt] = useState(loc === 'all' ? 'dt' : loc);
  const [from, setFrom] = useState('wh');
  const [to, setTo] = useState(loc === 'all' || loc === 'wh' ? 'dt' : loc);
  const [partner, setPartner] = useState('');
  const [reason, setReason] = useState('recount');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [lines, setLines] = useState(() => {
    const it = itemId && IV.item(itemId);
    if (!it || !it.stock) return [];
    const held = it.stock[loc === 'all' ? 'dt' : loc] || 0;
    return [{ id: it.id, qty: (kind || 'in') === 'adjust' ? held : 1 }];
  });
  const dk = IV_DOC_KIND[k];
  const kinds = MOVE_KINDS.filter(([id]) => id !== 'move' || multi);

  /* switching preset re-seeds the quantity column, because its MEANING changed:
     an adjust line carries the new count, every other kind carries what moved */
  const seed = (id, forKind) => {
    const it = IV.item(id);
    const held = it && it.stock ? (it.stock[forKind === 'move' ? from : at] || 0) : 0;
    return forKind === 'adjust' ? held : 1;
  };
  const switchKind = (nk) => {
    setK(nk);
    setLines((ls) => ls.map((l) => ({ ...l, qty: seed(l.id, nk) })));
    /* the partner list is role-filtered, so a name picked as a supplier is not
       necessarily in the customer list — clear it rather than submit a stale one */
    setPartner((p) => {
      if (!p || nk === 'move' || nk === 'adjust') return nk === 'move' || nk === 'adjust' ? '' : p;
      const want = nk === 'in' ? 'supplier' : 'customer';
      const hit = window.IV_PARTNERS.find((x) => x.name === p);
      return hit && hit.roles.indexOf(want) === -1 ? '' : p;
    });
    setPin('');
  };
  const add = (it) => setLines((ls) => ls.concat([{ id: it.id, qty: seed(it.id, k) }]));
  const setQty = (id, v) => setLines((ls) => ls.map((l) => l.id === id ? { ...l, qty: v === '' ? '' : Math.max(k === 'adjust' ? 0 : 1, +v || 0) } : l));
  const drop = (id) => setLines((ls) => ls.filter((l) => l.id !== id));

  const srcLoc = k === 'move' ? from : at;
  const rows = lines.map((l) => {
    const it = IV.item(l.id);
    const held = it.stock ? (it.stock[srcLoc] || 0) : 0;
    const q = +l.qty || 0;
    const after = k === 'in' ? held + q : k === 'out' ? held - q : k === 'move' ? held - q : q;
    return { l, it, held, q, after, delta: after - held };
  });
  const negative = rows.some((r) => r.after < 0);
  const units = rows.reduce((a, r) => a + Math.abs(k === 'adjust' ? r.delta : r.q), 0);
  const value = rows.reduce((a, r) => a + Math.abs(k === 'adjust' ? r.delta : r.q) * (r.it.cost || 0), 0);
  const sameLoc = k === 'move' && from === to;
  const blocked = !rows.length || sameLoc || (negative && pin.length < 4) ||
    rows.every((r) => (k === 'adjust' ? r.delta === 0 : r.q === 0));

  const qtyHead = k === 'adjust' ? 'New count' : 'Quantity';
  const locList = multi ? IV_LOCATIONS : IV_LOCATIONS.filter((l) => l.id === 'dt');

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet wide mvsheet" onClick={(e) => e.stopPropagation()} style={{ '--mv': dk.c }}>
        <div className="sheet__head mvhead">
          <div className="mvhead__ic"><ion-icon name={dk.icon}></ion-icon></div>
          <div><h3 style={{ color: dk.c }}>{dk.label}</h3>
            <p>{k === 'move' ? 'One document, two postings' : k === 'adjust' ? 'Type what is actually on the shelf' : 'Writes one movement per line'}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="mvrule"></div>

        <div className="sheet__body">
          <div className="mvkinds">
            {kinds.map(([id, label, icon]) => (
              <button key={id} className={'mvk' + (k === id ? ' on ' + id : '')} onClick={() => switchKind(id)}>
                <ion-icon name={icon}></ion-icon>{label}
              </button>
            ))}
          </div>

          <div className="fgrid">
            {k === 'move' ? (
              <>
                <Sel label="From" value={from} onChange={(v) => setFrom(v)}>
                  {locList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Sel>
                <Sel label="To" value={to} onChange={(v) => setTo(v)}>
                  {locList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Sel>
              </>
            ) : (
              <>
                {multi
                  ? <Sel label="Location" value={at} onChange={setAt}>
                      {locList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Sel>
                  : <Field label="Location" value={IV.loc('dt').name} />}
                {(k === 'in' || k === 'out') && (caps.suppliers
                  ? <Sel label="Partner" value={partner} onChange={setPartner}
                      hint={k === 'in' ? 'Who it came from' : 'Who it went to'}>
                      <option value="">— none —</option>
                      {IV_PARTNERS.filter((p) => p.roles.indexOf(k === 'in' ? 'supplier' : 'customer') > -1)
                        .map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </Sel>
                  : <Field label="Partner" value={partner} onChange={setPartner}
                      placeholder={k === 'in' ? 'Optional — who it came from' : 'Optional — who it went to'} />)}
                {k === 'adjust' && <div>
                  <label className="flab">Date</label>
                  <div className="field"><input value="Now" readOnly /></div>
                </div>}
              </>
            )}
          </div>
          {sameLoc && <Warn tone="bad" icon="alert-circle-outline">Source and destination are the same location. A move needs two places.</Warn>}

          {k === 'adjust' && (
            <div>
              <span className="lbl">Reason</span>
              <div className="opts">
                {IV_REASONS.map((x) => (
                  <button key={x.id} className={'opt' + (reason === x.id ? ' on' : '')} style={{ height: 38, fontSize: 12.5 }}
                    onClick={() => setReason(x.id)}>{x.label}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="lbl">Items</span>
            <ItemAdd filter={(i) => !!i.stock} exclude={lines.map((l) => l.id)} onAdd={add}
              placeholder="Search by name, SKU or barcode" />
          </div>

          {rows.length > 0 && (
            <div className="mvlines">
              <div className="mvlh"><div>Item</div><div className="r">On hand</div><div className="r">{qtyHead}</div><div className="r">Result</div><div></div></div>
              {rows.map((r) => (
                <div className="mvlr" key={r.l.id}>
                  <div className="mvnm"><Av item={r.it} size={32} />
                    <div style={{ minWidth: 0 }}><div className="ln__n">{r.it.name}</div><div className="ln__s">{r.it.sku}</div></div></div>
                  <div className="r ln__s">{qtyFmt(r.held)}</div>
                  <div><input className={'numin' + (r.after < 0 ? ' badv' : '')} value={r.l.qty}
                    onChange={(e) => setQty(r.l.id, e.target.value)} /></div>
                  <div className="r mvres">
                    <span className="b">{r.held}</span>
                    <ion-icon name="arrow-forward-outline"></ion-icon>
                    <span className={'a' + (r.after < 0 ? ' neg' : r.delta > 0 ? ' pos' : '')}>{r.after}</span>
                  </div>
                  <div><button className="icbtn sm" onClick={() => drop(r.l.id)}><ion-icon name="trash-outline"></ion-icon></button></div>
                </div>
              ))}
              <div className="mvtot">
                <span>{rows.length} line{rows.length === 1 ? '' : 's'}</span>
                <div className="sp"></div>
                <span className="ln__s">{money(value)} at cost</span>
                <b style={{ color: dk.c }}>{units} unit{units === 1 ? '' : 's'}</b>
              </div>
            </div>
          )}

          {k === 'move' && rows.length > 0 && (
            <div className="hint"><ion-icon name="airplane-outline"></ion-icon>
              <span>Posts both halves at once: decrements <b>{locName(from)}</b> and credits <b>{locName(to)}</b> against one document. For stock that travels overnight and must be checked at the far end, raise it on <b>Stock → In transit</b> instead — that leaves the quantity in transit until someone receives it.</span></div>
          )}

          <Field label="Note" value={note} onChange={setNote} placeholder="Delivery note number, who carried it, why" />

          {negative && <>
            <Warn tone="bad" icon="lock-closed-outline">
              This takes a location below zero. Negative stock is allowed — the shelf is the truth, not the system — but it needs an owner's authorisation so the variance has a name against it.
            </Warn>
            <Field label="Owner PIN" value={pin} placeholder="····"
              onChange={(v) => setPin(String(v).replace(/\D/g, '').slice(0, 4))}
              hint="Mock backend accepts any four digits. Production checks it against the owner's PIN and the role allowed to authorise a negative." />
          </>}
        </div>

        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={blocked} style={blocked ? null : { background: dk.c, borderColor: dk.c, boxShadow: 'none' }}
            onClick={() => {
              const no = window.IVS.postMovement({ kind: k, loc: at, from, to, partner,
                lines: lines.map((l) => ({ id: l.id, qty: +l.qty || 0 })), reason: k === 'adjust' ? reason : null, note });
              if (onPosted && no) onPosted(no);
              onClose();
            }}>
            <ion-icon name="checkmark-outline"></ion-icon>
            {blocked && !rows.length ? 'Add an item' : 'Post ' + dk.label.toLowerCase()}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- the ledger ---------- */
/* A row is a DOCUMENT, not a movement: one Stock in of three lines reads as one entry.
   Anatomy, in reading order: verb, when and who, how much, who it was with, where.
   `locName` guards every location lookup: a ledger row must never be able to take the
   module down because one document is missing a side. */
const locName = (id) => (IV.loc(id) || {}).name || '—';

function LedgerRow({ d, on, onClick }) {
  const dk = IV_DOC_KIND[d.kind];
  const first = IV.item(d.lines[0].item);
  return (
    <button className={'lgr' + (on ? ' on' : '')} onClick={onClick}>
      <div className="lgr__ic" style={{ background: dk.wash, color: dk.c }}><ion-icon name={dk.icon}></ion-icon></div>
      <div className="lgr__b">
        <div className="lgr__t"><span className="v" style={{ color: dk.c }}>{dk.label}</span>
          <div className="sp"></div><span className="w">{d.at}</span></div>
        <div className="lgr__s">{d.items.length} item{d.items.length === 1 ? '' : 's'} / {qtyFmt(d.units)}{d.partner ? ' · ' + d.partner : ''}</div>
        <div className="lgr__i">{first ? first.name : '—'}{d.items.length > 1 ? ' +' + (d.items.length - 1) : ''}</div>
        <div className="lgr__f">
          {d.kind === 'move'
            ? <><span className="tag from">From</span>{locName(d.from)}<ion-icon name="arrow-forward-outline"></ion-icon>{locName(d.to)}
                {d.inTransit && <span className="tag transit">In transit</span>}</>
            : <><span className={'tag ' + (d.net >= 0 ? 'to' : 'from')}>{d.net >= 0 ? 'To' : 'From'}</span>{locName(d.loc)}</>}
          <div className="sp"></div><span className="w">{d.who}</span>
        </div>
      </div>
    </button>
  );
}

function LedgerPane({ d, pushed, onBack }) {
  const dk = IV_DOC_KIND[d.kind];
  /* A move posts twice for one physical quantity, so the destination side is the one an
     operator checks ("did it arrive"). Until it arrives there IS no destination side —
     the outbound half is the whole document, and showing it is the point: an operator
     asking "where is my stock right now" gets an answer. */
  const shown = d.kind === 'move' && !d.inTransit ? d.lines.filter((l) => l.qty > 0) : d.lines;
  return (
    <div className={'mdpane' + (pushed ? ' pushed' : '')} style={{ '--mv': dk.c }}>
      <div className="mdpane__hd">
        <button className="icbtn backbtn" onClick={onBack}><ion-icon name="chevron-back-outline"></ion-icon></button>
        <div className="av" style={{ background: dk.wash, color: dk.c }}><ion-icon name={dk.icon}></ion-icon></div>
        <div><h3 style={{ color: dk.c }}>{dk.label}</h3><p>{d.no}{d.inTransit ? ' · in transit' : ''}</p></div>
      </div>
      <div className="mvrule"></div>
      <div className="mdscroll">
        <div className="mdbd">
          {d.kind === 'move'
            ? <><KV k="From" v={locName(d.from)} /><KV k="To" v={locName(d.to)} /></>
            : <KV k="Location" v={locName(d.loc)} />}
          <KV k="Date" v={d.at} />
          {d.partner && <KV k="Partner" v={d.partner} />}
          <KV k="Posted by" v={d.who} />
          <KV k="Reference" v={d.ref} />
          {d.reason && <KV k="Reason" v={(IV_REASONS.find((r) => r.id === d.reason) || {}).label || d.reason} />}
        </div>
        <div className="mvlines flat">
          <div className="mvlh doc"><div>Name</div><div className="r">On hand</div><div className="r">Change</div></div>
          {shown.map((l) => {
            const it = IV.item(l.item);
            const before = l.before != null ? l.before : null;
            return (
              <div className="mvlr doc" key={l.id}>
                <div className="mvnm"><Av item={it} size={32} />
                  <div style={{ minWidth: 0 }}><div className="ln__n">{it.name}</div>
                    <div className="ln__s">{money(it.cost || 0)} / {money(it.price || 0)} · {it.sku}</div></div></div>
                <div className="r mvres">
                  {before == null ? <span className="a">—</span> : <>
                    <span className="b">{before}</span><ion-icon name="arrow-forward-outline"></ion-icon>
                    <span className={'a' + (before + l.qty < 0 ? ' neg' : '')}>{before + l.qty}</span></>}
                </div>
                <div className={'r mvchg ' + (l.qty > 0 ? 'pos' : 'neg')}>{l.qty > 0 ? '+' : '−'}{qtyFmt(Math.abs(l.qty))}</div>
              </div>
            );
          })}
          <div className="mvtot">
            <span>{shown.length} item{shown.length === 1 ? '' : 's'}</span>
            <div className="sp"></div>
            <b className={d.kind === 'move' ? '' : (d.net > 0 ? 'pos' : 'neg')} style={d.kind === 'move' ? { color: dk.c } : null}>
              {d.kind === 'move' ? qtyFmt(d.units) : (d.net > 0 ? '+' : '−') + qtyFmt(Math.abs(d.net))}</b>
          </div>
        </div>
        <div className="op-bd">
          {d.inTransit && <div className="hint warn"><ion-icon name="airplane-outline"></ion-icon>
            <span>Only the outbound half has posted. These quantities have left <b>{locName(d.from)}</b> and are not yet on hand at {locName(d.to)} — owned, visible in valuation, and sellable at neither end. Receive it on <b>Stock → In transit</b>.</span></div>}
          <div className="hint"><ion-icon name="lock-closed-outline"></ion-icon>
            <span>Posted documents are immutable. A mistake is corrected by a new adjustment, never by editing this one — that is what makes the ledger evidence.</span></div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MOVE_KINDS, MovementSheet, LedgerRow, LedgerPane, locName });
