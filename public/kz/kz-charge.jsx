/* Koomzo — the charge flow every register shares.

   The MODEL lives here (useCharge): phases, the tenders array, persistence,
   the pending countdown, attest capture. The three registers keep their own
   markup because their CSS vocabularies differ — but none of them owns a rule.

   Changes 5 and 6 of the register change plan. */

function useCharge(total, opts) {
  const T = window.KZ_TENDER, P = T.PHASE;
  const o = opts || {};
  const [tenders, setTenders] = React.useState(() => (o.ticketNo ? T.store.load(o.ticketNo) : []));
  const [tender, setTender] = React.useState(T.DEFAULT);
  const [phase, setPhase] = React.useState(P.IDLE);
  const [cash, setCash] = React.useState(0);
  const [part, setPart] = React.useState(null);
  /* a split is a SHARE, not a payment method: picking one still leaves the
     operator to say which tender takes it */
  const [splitting, setSplitting] = React.useState(false);
  const [left, setLeft] = React.useState(T.WINDOW);
  const [last4, setLast4] = React.useState('');

  const balance = T.balance(total, tenders);
  const take = part == null ? balance : Math.max(0, Math.min(part, balance));
  const paid = tenders.length > 0 && balance === 0;
  const mode = T.modeFor(tender);
  const change = Math.max(0, cash - take);
  const busy = phase === P.PENDING || phase === P.REQUESTED;

  const commit = (extra) => {
    const list = T.capture(tenders, Object.assign({ id: tender, amount: take, phase: P.OK }, extra || {}));
    setTenders(list);
    /* decision 20.2 — persisted the moment the money is taken, not at the end */
    if (o.ticketNo) T.store.save(o.ticketNo, list);
    setPhase(P.IDLE); setPart(null); setCash(0); setLast4('');
    /* THE commit point: the balance just reached zero, so the ticket is paid. Stock
       moves here — not when the cashier later taps "New order", which is a different
       event and may never happen. Money in and stock out are one transaction. */
    if (T.balance(total, list) === 0 && o.onPaid) o.onPaid(list);
  };

  const request = () => {
    if (take <= 0) return;
    if (T.isWallet(tender) && mode === 'push') { setLeft(T.WINDOW); setPhase(P.PENDING); return; }
    commit(mode === 'attest'
      ? { attested: true, mode: mode, providerRef: last4 ? '···' + last4 : null }
      : { mode: mode });
  };

  React.useEffect(() => {
    if (phase !== P.PENDING) return;
    const tick = setInterval(() => setLeft((s) => s - 1), 1000);
    /* stands in for the provider callback; production also polls the reference */
    const cb = setTimeout(() => commit({ providerRef: T.ref(), mode: 'push' }), 3600);
    return () => { clearInterval(tick); clearTimeout(cb); };
  }, [phase]);

  React.useEffect(() => { if (phase === P.PENDING && left <= 0) setPhase(P.EXPIRED); }, [left, phase]);

  return {
    T: T, P: P, tender: tender,
    setTender: (id) => {
      if (busy) return;
      if (id === 'split') { setSplitting(true); return; }
      setTender(id); setPhase(P.IDLE); setCash(0);
    },
    splitting: splitting,
    chooseShare: (amount) => { setPart(amount); setSplitting(false); setCash(0); },
    clearShare: () => { setPart(null); setSplitting(false); },
    tenders: tenders, phase: phase, mode: mode, busy: busy, paid: paid,
    balance: balance, take: take, cash: cash, setCash: setCash, change: change,
    part: part, setPart: setPart, left: left, last4: last4, setLast4: setLast4,
    list: T.list(o.extras || { loyalty: true, split: true }),
    notes: T.quickCash(take),
    request: request,
    /* cancel is the ONLY escape from a live push — never a manual "mark paid" */
    cancel: () => { setPhase(P.IDLE); setLeft(T.WINDOW); },
    retry: () => { setLeft(T.WINDOW); setPhase(P.PENDING); },
    /* the polling path, for an outcome we could not read */
    checkStatus: () => commit({ providerRef: T.ref(), mode: 'push' }),
    finish: () => { if (o.ticketNo) T.store.clear(o.ticketNo); if (o.onDone) o.onDone(); },
    locked: tenders.length > 0,
  };
}

/* A top-up, a tab settlement or a membership joining fee is money on a push
   rail, but it is not a ticket: there is no balance to split and nothing to
   persist between captures. It still must not be marked taken before the
   customer has approved it — so it gets the phase machine and nothing else. */
function useSingleCharge(amount, opts) {
  const T = window.KZ_TENDER, P = T.PHASE;
  const o = opts || {};
  const [tender, setTenderRaw] = React.useState(o.tender || T.DEFAULT);
  const [phase, setPhase] = React.useState(P.IDLE);
  const [left, setLeft] = React.useState(T.WINDOW);
  const mode = T.modeFor(tender);
  const busy = phase === P.PENDING;
  const done = phase === P.OK;

  /* one capture, so settling IS being paid — the caller's onDone is the commit point */
  const settle = () => { setPhase(P.OK); if (o.onDone) o.onDone(tender, mode); };
  const request = () => {
    /* an internal balance needs no rail and no waiting */
    if (T.isInternal(tender) || !T.isWallet(tender) || mode !== 'push') return settle();
    setLeft(T.WINDOW); setPhase(P.PENDING);
  };
  React.useEffect(() => {
    if (phase !== P.PENDING) return;
    const tick = setInterval(() => setLeft((s) => s - 1), 1000);
    const cb = setTimeout(settle, 3600);
    return () => { clearInterval(tick); clearTimeout(cb); };
  }, [phase]);
  React.useEffect(() => { if (phase === P.PENDING && left <= 0) setPhase(P.EXPIRED); }, [left, phase]);

  return {
    T: T, P: P, tender: tender, setTender: (id) => { if (!busy) { setTenderRaw(id); setPhase(P.IDLE); } },
    phase: phase, mode: mode, busy: busy, done: done, left: left,
    request: request, cancel: () => { setPhase(P.IDLE); setLeft(T.WINDOW); },
    retry: () => { setLeft(T.WINDOW); setPhase(P.PENDING); },
    cta: () => (busy ? 'Waiting…' : T.cta(tender, amount)),
  };
}

/* the pending strip, for module sheets that are not register chrome */
function PushPending({ c, amount }) {
  if (c.phase !== c.P.PENDING && c.phase !== c.P.EXPIRED) return null;
  const late = c.phase === c.P.EXPIRED;
  return (
    <div style={{ border: '1px solid ' + (late ? '#f2c4b4' : '#e8d6a8'),
      background: late ? 'var(--kz-discount-wash)' : 'var(--kz-warning-wash)',
      borderRadius: 'var(--kz-radius)', padding: '13px 15px', marginBottom: 12 }}>
      <div style={{ font: '700 13px var(--kz-font-sans)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <ion-icon name={late ? 'alert-circle-outline' : 'phone-portrait-outline'}
          style={{ color: late ? '#b8401f' : '#8a6414', fontSize: 16 }}></ion-icon>
        {late ? 'No answer' : 'Requested ' + window.money(amount) + ' · ' + c.T.label(c.tender)}
      </div>
      <p style={{ margin: '5px 0 0', font: '400 12.5px/1.55 var(--kz-font-sans)', color: 'var(--kz-muted)' }}>
        {late ? c.T.phaseCopy(c.P.EXPIRED, c.tender) : c.T.pendingCopy(c.tender)}</p>
      {!late && <div style={{ font: '700 24px var(--kz-font-num)', color: '#8a6414', marginTop: 6 }}>{Math.max(0, c.left)}s</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {late && <button className="btn primary" onClick={c.retry}><ion-icon name="refresh-outline"></ion-icon>Request again</button>}
        <button className="btn" onClick={c.cancel}>{late ? 'Switch tender' : 'Cancel & switch tender'}</button>
      </div>
    </div>
  );
}

/* ---- captured tenders, and what is left to take ---- */
function ChargeLedger({ ch }) {
  if (!ch.tenders.length) return null;
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card__t">Taken so far</div>
      <div style={{ marginTop: 8, display: 'grid', gap: 7 }}>
        {ch.tenders.map((x, i) => (
          <div className="trow" key={i}>
            <span className="k"><ion-icon name="checkmark-circle" style={{ color: 'var(--kz-success)', marginRight: 6, verticalAlign: '-2px' }}></ion-icon>
              {ch.T.label(x.id)}{x.attested ? ' · attested' : ''}</span>
            <span className="v">{window.money(x.amount)}</span>
          </div>
        ))}
      </div>
      <div className="card__row"><span className="card__t">Balance</span><span className="v">{window.money(ch.balance)}</span></div>
      <div className="card__s" style={{ marginTop: 6 }}>Kept as it happens — a restart resumes here, not from zero.</div>
    </div>
  );
}

/* ---- the pending / declined / expired panel ---- */
function ChargePhase({ ch }) {
  const P = ch.P;
  if (ch.phase === P.PENDING) return (
    <div className="card" style={{ borderColor: 'var(--kz-warning)', background: 'var(--kz-warning-wash)' }}>
      <div className="card__t" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ion-icon name="phone-portrait-outline" style={{ color: '#8a6414' }}></ion-icon>
        Requested {window.money(ch.take)} · {ch.T.label(ch.tender)}</div>
      <div className="card__s" style={{ marginTop: 4 }}>{ch.T.pendingCopy(ch.tender)}</div>
      <div className="trow" style={{ marginTop: 10 }}>
        <span className="k">Expires in</span>
        <span className="v" style={{ font: '700 20px var(--kz-font-num)', color: '#8a6414' }}>{Math.max(0, ch.left)}s</span>
      </div>
      <button className="btn wide" style={{ marginTop: 10 }} onClick={ch.cancel}>
        <ion-icon name="close-outline"></ion-icon>Cancel &amp; switch tender</button>
    </div>
  );
  const copy = ch.T.phaseCopy(ch.phase, ch.tender);
  if (!copy) return null;
  return (
    <div className="card" style={{ borderColor: 'var(--kz-discount)' }}>
      <div className="card__t" style={{ color: 'var(--kz-discount)' }}>
        {ch.phase === P.EXPIRED ? 'No answer' : ch.phase === P.DECLINED ? 'Refused' : 'Outcome unclear'}</div>
      <div className="card__s" style={{ marginTop: 4 }}>{copy}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {ch.phase === P.UNKNOWN
          ? <button className="btn primary" onClick={ch.checkStatus}><ion-icon name="sync-outline"></ion-icon>Check status</button>
          : <button className="btn primary" onClick={ch.retry}><ion-icon name="refresh-outline"></ion-icon>Request again</button>}
        <button className="btn" onClick={ch.cancel}>Switch tender</button>
      </div>
    </div>
  );
}

/* ---- the body of the sheet, in retail / flex chrome ---- */
function ChargeBody({ ch }) {
  const P = ch.P;
  return (
    <>
      <ChargeLedger ch={ch} />
      {ch.phase !== P.IDLE ? <ChargePhase ch={ch} /> : (
        <>
          {ch.splitting ? (
            <>
              <div className="display"><small>How much of {window.money(ch.balance)}</small>{window.money(ch.take)}</div>
              <div className="quickcash">
                {[0.25, 0.5, 0.75].map((f) => (
                  <button key={f} onClick={() => ch.chooseShare(Math.round(ch.balance * f / 5) * 5)}>
                    {(f * 100) + '%'}</button>
                ))}
                <button onClick={() => ch.clearShare()}>All</button>
              </div>
              <div className="note info"><ion-icon name="git-branch-outline"></ion-icon>
                A split is a share, not a payment method — pick the share, then say which tender takes it.
                Each capture is kept separately.</div>
            </>
          ) : (
          <>
          {ch.part != null && (
            <div className="trow" style={{ marginBottom: 12 }}>
              <span className="k"><ion-icon name="git-branch-outline" style={{ marginRight: 6, verticalAlign: '-2px', color: 'var(--kz-primary)' }}></ion-icon>
                Part payment · {window.money(ch.take)} of {window.money(ch.balance)}</span>
              <span className="sp"></span>
              <button className="btn" onClick={ch.clearShare}>Take it all</button>
            </div>
          )}
          <div className="tenders">
            {ch.list.map((t) => (
              <button key={t.id}
                className={'tender' + ((t.id === 'split' ? ch.part != null : ch.tender === t.id) ? ' on' : '')}
                onClick={() => ch.setTender(t.id)}>
                <ion-icon name={t.icon}></ion-icon>{t.label}
              </button>
            ))}
          </div>
          {ch.tender === 'cash' ? (
            <>
              <div className="display"><small>Cash tendered</small>{window.money(ch.cash)}</div>
              <div className="quickcash">{ch.notes.map((n) => <button key={n} onClick={() => ch.setCash(n)}>{window.money(n)}</button>)}</div>
              <div className="trow"><span className="k">Change due</span>
                <span className="v" style={{ font: '700 18px var(--kz-font-num)', color: ch.change ? 'var(--kz-success)' : 'var(--kz-muted)' }}>{window.money(ch.change)}</span></div>
            </>
          ) : null}
          {ch.mode === 'attest' && (
            <div className="field" style={{ marginTop: 10 }}>
              <ion-icon name="call-outline"></ion-icon>
              <input value={ch.last4} maxLength={4} inputMode="numeric" placeholder="Last 4 of the customer's number — optional"
                onChange={(e) => ch.setLast4(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}
          {ch.T.hint(ch.tender) && <div className="note info">
            <ion-icon name={ch.T.hintIcon(ch.tender)}></ion-icon>{ch.T.hint(ch.tender)}</div>}
          </>
          )}
        </>
      )}
    </>
  );
}

function ChargePaidBody({ ch, total }) {
  const last = ch.tenders[ch.tenders.length - 1] || {};
  return (
    <>
      <div className="done">
        <div className="done__ic"><ion-icon name="checkmark-outline"></ion-icon></div>
        <h4>Paid {window.money(total)}</h4>
        <p>{ch.T.paidLine(last.id, { change: ch.change })}</p>
      </div>
      {ch.tenders.length > 1 && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card__t">Settled on {ch.tenders.length} tenders</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {ch.tenders.map((x, i) => (
              <div className="trow" key={i}><span className="k">{ch.T.label(x.id)}</span><span className="v">{window.money(x.amount)}</span></div>
            ))}
          </div>
        </div>
      )}
      <button className="btn wide"><ion-icon name="mail-outline"></ion-icon>Email receipt to customer</button>
    </>
  );
}

/* ---- change 8 · the approval step, shown inside the keypad sheet ---- */
function ApprovalStep({ kind, value, moduleId, onCancel, onApprove }) {
  const Pol = window.KZ_POLICY;
  const [reason, setReason] = React.useState(null);
  const [who, setWho] = React.useState(Pol.supervisors[0]);
  return (
    <>
      <div className="note" style={{ background: 'var(--kz-warning-wash)', borderColor: '#e8d6a8', marginBottom: 12, display: 'flex', gap: 10, padding: '13px 15px', borderRadius: 'var(--kz-radius)', border: '1px solid #e8d6a8' }}>
        <ion-icon name="shield-checkmark-outline" style={{ color: '#8a6414', fontSize: 17 }}></ion-icon>
        <span style={{ font: '400 13px/1.6 var(--kz-font-sans)' }}>{Pol.ceilingCopy(kind, moduleId)} Both names are recorded on the ticket and in the shift report.</span>
      </div>
      <div className="card__t">Reason</div>
      <div className="opts" style={{ marginTop: 8 }}>
        {Pol.reasons.map((r) => (
          <button key={r} className={'opt' + (reason === r ? ' on' : '')} onClick={() => setReason(r)}>{r}</button>
        ))}
      </div>
      <div className="card__t" style={{ marginTop: 14 }}>Approved by</div>
      <div className="opts" style={{ marginTop: 8 }}>
        {Pol.supervisors.map((s) => (
          <button key={s} className={'opt' + (who === s ? ' on' : '')} onClick={() => setWho(s)}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
        <button className="btn" onClick={onCancel}>Back</button>
        <button className="btn primary" disabled={!reason} style={!reason ? { opacity: .45 } : null}
          onClick={() => onApprove({ reason: reason, by: who })}>Approve &amp; apply</button>
      </div>
    </>
  );
}

Object.assign(window, { useCharge, useSingleCharge, PushPending, ChargeBody, ChargeLedger, ChargePhase, ChargePaidBody, ApprovalStep });
