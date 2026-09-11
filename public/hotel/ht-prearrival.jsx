/* Koomzo Hotel — pre-arrival check-in.
   The guest fills the registration card on their own phone before they travel;
   the desk verifies once and the statutory register writes itself. The point is
   not convenience — it is that the slowest task at reception (copying a CNI by
   hand while a queue forms) stops happening at arrival time. */

const PA = {
  not_sent:  { label:'Not sent',   icon:'ellipse-outline',        tone:'' },
  sent:      { label:'Link sent',  icon:'paper-plane-outline',    tone:'' },
  opened:    { label:'Opened',     icon:'eye-outline',            tone:'' },
  submitted: { label:'To verify',  icon:'document-text-outline',  tone:'wrn' },
  verified:  { label:'Verified',   icon:'shield-checkmark-outline', tone:'ok' },
  declined:  { label:'At the desk', icon:'close-circle-outline',  tone:'' },
};
const paOf = (st, stayId) => st.prearr.find((p) => p.stayId === stayId);
/* register-critical fields the card collects — the reason this feature exists */
const PA_REG = HT.prearrFields.filter((f) => f.register).map((f) => f.id);
const paComplete = (p) => !!p && PA_REG.every((f) => f === 'name' || f === 'sig' || f === 'idShot' ? true : p[f]);

function PreArrivalView({ api }) {
  const st = api.st;
  const [sel, setSel] = useState(null);
  const [phone, setPhone] = useState(true);
  /* everyone arriving or booked ahead — the desk works this list backwards from arrival */
  const rows = st.stays.filter((s) => s.status === 'arr' || s.status === 'booked')
    .map((s) => ({ s, p: paOf(st, s.id) }))
    .sort((a, b) => a.s.from - b.s.from);
  const toVerify = rows.filter((r) => r.p && r.p.state === 'submitted');
  const done = rows.filter((r) => r.p && r.p.state === 'verified');
  const waiting = rows.filter((r) => r.p && (r.p.state === 'sent' || r.p.state === 'opened'));
  const none = rows.filter((r) => !r.p || r.p.state === 'not_sent');

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Pre-arrival</h2><p>{rows.length} arrivals ahead · {done.length} verified · {toVerify.length} waiting on the desk</p></div>
        <div className="sp"></div>
        <button className="btn" onClick={() => setPhone(!phone)}>
          <ion-icon name={phone ? 'phone-portrait-outline' : 'eye-outline'}></ion-icon>{phone ? 'Hide guest view' : 'Guest view'}</button>
        {none.length > 0 && <button className="btn primary" onClick={() => { api.paSendAll(); api.toast('Link sent to ' + none.length + ' guest' + (none.length > 1 ? 's' : '') + ' over WhatsApp'); }}>
          <ion-icon name="logo-whatsapp"></ion-icon>Send {none.length} link{none.length > 1 ? 's' : ''}</button>}
      </div>

      {toVerify.length > 0 && (
        <div className="htbanner">
          <ion-icon name="document-text-outline"></ion-icon>
          <span><b>{toVerify.length} card{toVerify.length > 1 ? 's' : ''} to verify.</b> Check the ID photo against the number, then the register line writes itself at check-in.</span>
          <div className="sp"></div>
          <button className="sbtn" onClick={() => setSel(toVerify[0].s.id)}>Open first</button>
        </div>
      )}

      <div className={'htpa' + (phone ? '' : ' full')}>
        <div>
          <div className="htkpi" style={{ marginBottom: 12 }}>
            <div className="htk"><div className="k">Verified</div><div className="v">{done.length}</div><div className="s">Check-in is one tap</div></div>
            <div className="htk"><div className="k">To verify</div><div className="v">{toVerify.length}</div><div className="s">{toVerify.length ? 'Desk action' : 'Nothing waiting'}</div></div>
            <div className="htk"><div className="k">Link out</div><div className="v">{waiting.length}</div><div className="s">Sent, not returned</div></div>
            <div className="htk"><div className="k">Register saved</div><div className="v">{done.reduce((n, r) => n + r.s.adults, 0)}</div><div className="s">Guests, no retyping</div></div>
          </div>

          <section className="panel">
            <table className="httable">
              <thead><tr><th>Arrival</th><th>Guest</th><th>Room</th><th>Card</th><th>ID on file</th><th>ETA</th><th></th></tr></thead>
              <tbody>
                {rows.map(({ s, p }) => {
                  const state = p ? p.state : 'not_sent';
                  const m = PA[state];
                  return (
                    <tr key={s.id} onClick={() => setSel(s.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>{s.from === 0 ? <b>Today</b> : HT.dayNo + s.from + ' ' + HT.month}</td>
                      <td><b>{s.guest}</b>{s.company && <div style={{ font: '500 11.5px var(--kz-font-sans)', color: 'var(--kz-muted-3)' }}>{s.company}</div>}</td>
                      <td>{s.no}</td>
                      <td><span className={'htst' + (m.tone === 'wrn' ? ' wrn' : '')}>
                        <ion-icon name={m.icon} style={{ fontSize: 15, color: m.tone === 'wrn' ? 'var(--kz-warning)' : m.tone === 'ok' ? 'var(--kz-success)' : 'var(--kz-muted-3)' }}></ion-icon>
                        {m.label}</span></td>
                      <td style={{ color: 'var(--kz-muted-2)' }}>{p && p.idNo ? p.idType + ' ' + p.idNo : <span className="badge wrn">Missing</span>}</td>
                      <td style={{ color: 'var(--kz-muted-2)' }}>{p && p.eta ? p.eta : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {state === 'submitted' && <button className="sbtn" onClick={(e) => { e.stopPropagation(); setSel(s.id); }}>Verify</button>}
                        {state === 'verified' && s.status === 'arr' && <button className="sbtn" onClick={(e) => { e.stopPropagation(); api.checkIn(s.id); api.toast(s.guest + ' checked in · register line written'); }}>Check in</button>}
                        {(state === 'not_sent' || state === 'declined') && <button className="sbtn" onClick={(e) => { e.stopPropagation(); api.paSend(s.id); api.toast('Link sent to ' + s.guest); }}>Send link</button>}
                        {(state === 'sent' || state === 'opened') && <button className="sbtn" onClick={(e) => { e.stopPropagation(); api.toast('Reminder sent to ' + s.guest); }}>Remind</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="note info" style={{ margin: 15 }}><ion-icon name="information-circle-outline"></ion-icon>
              A verified card is not a check-in. The guest still presents the physical ID at the desk — the card only means nobody has to type it.</div>
          </section>
        </div>

        {phone && <GuestCardPreview />}
      </div>

      {sel && <PaSheet stayId={sel} api={api} onClose={() => setSel(null)} />}
    </div>
  );
}

/* ---------------- what the guest sees on their own phone ---------------- */
function GuestCardPreview() {
  const [step, setStep] = useState(1);
  const steps = [['Identité', 4], ['Photo de la pièce', 1], ['Séjour', 3], ['Signature', 1]];
  return (
    <div className="htphone">
      <div className="htphone__top">
        <span>{HT.prop}</span>
        <small>Enregistrement en ligne</small>
      </div>
      <div className="htphone__b">
        <div className="htpa__prog">
          {steps.map(([l], i) => <i key={l} className={i + 1 <= step ? 'on' : ''}></i>)}
        </div>
        <div className="htpa__st">Étape {step} sur 4 · {steps[step - 1][0]}</div>

        {step === 1 && <>
          {HT.prearrFields.filter((f) => ['name', 'phone', 'idType', 'idNo'].indexOf(f.id) > -1).map((f) => (
            <div className="htpa__f" key={f.id}>
              <label>{f.label}{f.required && <em>*</em>}</label>
              {f.kind === 'choice'
                ? <div className="htpa__ch">{f.options.map((o) => <span key={o} className={o === 'CNI' ? 'on' : ''}>{o}</span>)}</div>
                : <div className="htpa__in">{f.id === 'name' ? 'Kouam Emmanuel' : f.id === 'phone' ? '+237 6 78 …' : '1198 4407 221'}</div>}
            </div>
          ))}
        </>}

        {step === 2 && <>
          <div className="htpa__shot">
            <ion-icon name="camera-outline"></ion-icon>
            <span>Photographiez le recto de votre CNI</span>
            <em>Posez la pièce à plat, sans reflet</em>
          </div>
          <div className="htpa__ok"><ion-icon name="checkmark-circle-outline"></ion-icon>Recto reçu · lisible</div>
        </>}

        {step === 3 && <>
          {HT.prearrFields.filter((f) => ['country', 'dob', 'addr', 'purpose', 'eta'].indexOf(f.id) > -1).map((f) => (
            <div className="htpa__f" key={f.id}>
              <label>{f.label}{f.required && <em>*</em>}</label>
              {f.kind === 'choice'
                ? <div className="htpa__ch">{f.options.slice(0, 4).map((o) => <span key={o} className={o === 'Cameroun' || o === 'Affaires' ? 'on' : ''}>{o}</span>)}</div>
                : <div className="htpa__in">{f.id === 'dob' ? '04/07/1991' : f.id === 'addr' ? 'Yaoundé · Bastos' : '15:30'}</div>}
            </div>
          ))}
        </>}

        {step === 4 && <>
          <div className="htpa__f"><label>Signature<em>*</em></label><div className="htpa__sig"><span>Signez ci-dessus</span></div></div>
          <p className="htpa__legal">Ces informations alimentent le registre des étrangers exigé par la loi et ne sont conservées que le temps prévu.</p>
        </>}
      </div>
      <div className="htphone__ft">
        {step > 1 && <button className="htpa__nav" onClick={() => setStep(step - 1)}>Retour</button>}
        <button className="htpa__nav pri" onClick={() => setStep(step < 4 ? step + 1 : 1)}>
          {step < 4 ? 'Continuer' : 'Envoyer la fiche'}</button>
      </div>
    </div>
  );
}

/* ---------------- verify one card ---------------- */
function PaSheet({ stayId, api, onClose }) {
  const st = api.st;
  const s = st.stays.find((x) => x.id === stayId);
  const p = paOf(st, stayId);
  const state = p ? p.state : 'not_sent';
  const [fix, setFix] = useState(false);

  const foot = [<button key="c" className="btn" onClick={onClose}>Close</button>];
  if (state === 'submitted') foot.push(
    <button key="r" className="btn" onClick={() => { api.paReject(stayId); api.toast('Sent back to ' + s.guest + ' — photo unreadable'); onClose(); }}>
      <ion-icon name="refresh-outline"></ion-icon>Ask again</button>,
    <button key="v" className="btn primary" onClick={() => { api.paVerify(stayId); api.toast('Card verified · register line ready for check-in'); onClose(); }}>
      <ion-icon name="shield-checkmark-outline"></ion-icon>Verify</button>);
  else if (state === 'verified' && s.status === 'arr') foot.push(
    <button key="i" className="btn primary" onClick={() => { api.checkIn(stayId); api.toast(s.guest + ' checked in · register line written'); onClose(); }}>
      <ion-icon name="log-in-outline"></ion-icon>Check in</button>);
  else foot.push(
    <button key="s" className="btn primary" onClick={() => { api.paSend(stayId); api.toast('Link sent to ' + s.guest + ' over WhatsApp'); onClose(); }}>
      <ion-icon name="logo-whatsapp"></ion-icon>{state === 'not_sent' ? 'Send the link' : 'Send again'}</button>);

  return (
    <HtSheet title={s.guest} sub={'Room ' + s.no + ' · ' + (s.from === 0 ? 'arrives today' : 'arrives ' + (HT.dayNo + s.from) + ' ' + HT.month) + ' · ' + PA[state].label}
      onClose={onClose} foot={foot}>
      {p && p.flag && (
        <div className="htbanner" style={{ marginBottom: 14 }}>
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span>{p.flag}</span>
        </div>
      )}

      {p && p.idNo ? <>
        <div className="htpa__idr">
          <div className="htpa__id">
            <ion-icon name="card-outline"></ion-icon>
            <span>{p.idType}</span>
            <small>Photo attached {p.idShot ? '· front & back' : '· missing'}</small>
          </div>
          <div className="htpa__sigr">
            <ion-icon name="create-outline"></ion-icon>
            <span>Signed</span>
            <small>{p.doneAt}</small>
          </div>
        </div>

        <div className="htfacts" style={{ marginTop: 14 }}>
          {[['ID number', p.idNo], ['Nationality', p.country], ['Date of birth', p.dob],
            ['Purpose', p.purpose || '—'], ['Vehicle', p.plate || '—'], ['Expected', p.eta || '—'],
            ['Submitted', p.doneAt]]
            .map(([k, v]) => <div key={k}><div className="k">{k}</div><div className="v">{v}</div></div>)}
        </div>
        {/* free-text guest input on its own row — a register field must never be
            clipped or ellipsised on the screen where it is verified */}
        <div className="htpa__addr">
          <div className="k">Usual address</div>
          <div className="v">{p.addr}</div>
        </div>

        <div className="note info" style={{ marginTop: 14 }}><ion-icon name="shield-checkmark-outline"></ion-icon>
          {PA_REG.length} of these fields are the ones the statutory register needs. Verify once and they are written at check-in — the desk never retypes a passport.</div>

        {state === 'submitted' && (
          <button className="htari__t" style={{ marginTop: 12 }} onClick={() => setFix(!fix)}>
            <ion-icon name={fix ? 'checkbox-outline' : 'square-outline'}></ion-icon>
            <div><div className="nm">ID seen in person too</div><div className="ar">Tick when the physical document is presented at the desk</div></div>
          </button>
        )}
      </> : (
        <div className="emptybox">
          {state === 'declined'
            ? <>Guest asked to fill the card at the desk. {p && p.note}</>
            : state === 'not_sent'
              ? <>No link sent yet. Sending it puts the registration card on the guest’s own phone before they travel.</>
              : <>Link {state === 'opened' ? 'opened' : 'sent'} {p && p.sentAt} — nothing returned yet.</>}
        </div>
      )}
    </HtSheet>
  );
}

Object.assign(window, { PreArrivalView, GuestCardPreview, PaSheet, PA, paOf, PA_REG });
