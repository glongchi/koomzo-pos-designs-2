/* Koomzo — Business profile. One instrument, three audiences (merchant, sales, support).
   Asks about the BUSINESS, never the software. Output is a reviewable diff, never a commit. */

const QUESTIONS = [
  { id:'trade', q:'What kind of business is this?', help:'Sets which modules are even offered.',
    kind:'one', opts:[
      ['shop','Shop or counter','storefront-outline'],
      ['salon','Salon, spa or barber','cut-outline'],
      ['food','Restaurant, café or bar','restaurant-outline'],
      ['hotel','Hotel, lodge or furnished apartments','bed-outline'],
      ['grocery','Grocery or convenience store','basket-outline'],
      ['service','Service desk or clinic','people-outline'],
    ] },
  { id:'rooms', q:'How many rooms or units do you let?', help:'Only asked because it changes what the front desk sees.',
    kind:'one', opts:[['0','None','close-circle-outline'],['8','Up to 8','home-outline'],['40','9 to 40','bed-outline'],['99','More than 40','business-outline']] },
  { id:'stay', q:'How long do people stay?', help:'A month changes the billing, not just the length.',
    kind:'one', opts:[['night','A night or two','moon-outline'],['week','A week or so','calendar-outline'],['month','By the month','key-outline']] },
  { id:'fnb', q:'Do you serve food or drinks on site?', kind:'one',
    opts:[['no','No','close-circle-outline'],['bar','A bar only','wine-outline'],['rest','A kitchen and a bar','restaurant-outline']] },
  { id:'staff', q:'How many people ring up sales?', help:'Two or more means the money needs a name against it.',
    kind:'one', opts:[['1','Just me','person-outline'],['2','2 to 4','people-outline'],['5','5 or more','people-circle-outline']] },
  { id:'sites', q:'How many places do you trade from?', help:'More than one turns on transfers and roll-up reporting.',
    kind:'one', opts:[['1','One','home-outline'],['2','Two or three','business-outline'],['4','Four or more','globe-outline']] },
  { id:'stock', q:'Do you count what is on the shelf?', help:'The honest answer is often "not really" — that is a valid answer.',
    kind:'one', opts:[['no','Not really','close-circle-outline'],['yes','Yes, roughly','cube-outline'],['room','Yes, and we keep a stockroom','business-outline']] },
  { id:'order', q:'Do you order from suppliers?', help:'On paper today is still a yes.',
    kind:'one', opts:[['no','No','close-circle-outline'],['paper','Yes, on paper or by phone','call-outline'],['system','Yes, and we track it','receipt-outline']] },
  { id:'returns', q:'Do you accept returns or exchanges?', kind:'one',
    opts:[['no','No','close-circle-outline'],['yes','Yes','refresh-outline']] },
  { id:'book', q:'Do customers book time with you?', kind:'one',
    opts:[['no','No','close-circle-outline'],['yes','Yes, by appointment','calendar-outline'],['walk','They queue and wait','people-outline']] },
  { id:'invoice', q:'Do you invoice anyone on account?', help:'Trade customers who pay later rather than at the till.',
    kind:'one', opts:[['no','No','close-circle-outline'],['some','A few','document-text-outline'],['many','Regularly','repeat-outline']] },
];

/* answers → a proposed configuration. Business language in, capability keys out. */
function propose(a) {
  const p = { modules: {} }, why = [];
  const M = (id) => (p.modules[id] = p.modules[id] || { caps: {} });

  /* retail */
  const retail = M('retail');
  if (a.trade) retail.tier = a.trade === 'salon' ? 'lite' : a.trade === 'hotel' ? 'off' : 'mid';
  if (a.staff && a.staff !== '1') {
    retail.caps.shift = true; why.push([a.staff === '2' ? '2 to 4 people ring up sales' : '5 or more ring up sales', 'Shift & drawer, per-user reporting']);
  }
  if (a.returns === 'yes') { retail.caps.returns = true; why.push(['Returns accepted', 'Returns, receipt lookup']); }
  if (a.returns === 'no') retail.caps.returns = false;
  if (a.invoice && a.invoice !== 'no') { retail.caps.customers = true; }

  /* inventory */
  const inv = M('inventory');
  if (a.stock === 'no') { inv.tier = 'off'; why.push(['Stock is not counted', 'Inventory hidden — a fixed product list instead']); }
  else if (a.stock === 'yes') { inv.tier = 'lite'; why.push(['Stock counted roughly', 'Inventory Lite — a quantity per item']); }
  else if (a.stock === 'room') { inv.tier = 'mid'; why.push(['A stockroom is kept', 'Inventory Mid — movement log and reorder points']); }
  if (a.order === 'paper' || a.order === 'system') {
    inv.tier = inv.tier === 'off' ? 'mid' : inv.tier;
    inv.caps.purchase = true; inv.caps.suppliers = true;
    why.push([a.order === 'paper' ? 'Ordering on paper today' : 'Supplier orders tracked', 'Purchase orders, suppliers, reorder points']);
  }
  if (a.sites && a.sites !== '1') {
    inv.tier = 'full'; inv.caps.locations = true; inv.caps.transfers = true;
    why.push([a.sites === '2' ? 'Two or three sites' : 'Four or more sites', 'Multi-location, transfers, roll-up reporting']);
  }

  /* salon */
  if (a.trade === 'salon' || a.book === 'yes') {
    const sl = M('salon'); sl.tier = a.staff === '1' ? 'lite' : 'mid';
    why.push([a.trade === 'salon' ? 'Salon, spa or barber' : 'Customers book time', 'Appointment book, services' + (a.staff !== '1' ? ', team' : '')]);
    if (a.staff === '5') { sl.caps.time = true; sl.caps.commission = true; why.push(['5 or more staff', 'Timesheet and commission']); }
  } else if (a.trade || a.book) { M('salon').tier = 'off'; }

  /* restaurant — a lodge kitchen is the same module, reused */
  if (a.trade === 'food' || a.fnb === 'rest' || a.fnb === 'bar') {
    const r = M('restaurant'); r.tier = a.fnb === 'bar' ? 'lite' : 'mid';
    why.push([a.trade === 'food' ? 'Restaurant, café or bar' : a.fnb === 'bar' ? 'A bar on site' : 'A kitchen and a bar',
      a.fnb === 'bar' ? 'Order entry and a bar tab' : 'Floor plan, course firing, kitchen display']);
    if (a.trade === 'hotel' || (a.rooms && a.rooms !== '0')) {
      r.caps.roomcharge = true;
      why.push(['Rooms and a kitchen under one roof', 'Charge to room — the server picks a room instead of taking payment']);
    }
  } else if (a.trade) { M('restaurant').tier = 'off'; }

  /* hotel — rooms are the only trigger; the restaurant stays the restaurant module */
  const lets = a.rooms && a.rooms !== '0';
  if (a.trade === 'hotel' || lets) {
    const h = M('hotel');
    h.tier = a.rooms === '8' ? 'lite' : a.rooms === '99' ? 'full' : 'mid';
    why.push([a.rooms === '8' ? 'Up to 8 units' : a.rooms === '99' ? 'More than 40 rooms' : 'A small hotel',
      h.tier === 'lite' ? 'Room rack, bookings, cleaning' : h.tier === 'mid' ? 'Folio, rates, guest register, maintenance' : 'Night audit, deposits, long stays, occupancy reporting']);
    if (a.stay === 'month' || a.stay === 'week') {
      h.caps.longstay = true; h.caps.rates = true; h.caps.deposits = true;
      why.push([a.stay === 'month' ? 'Guests stay by the month' : 'Guests stay about a week',
        'Weekly and monthly rate plans, deposits, utilities billed on']);
    }
    if (a.fnb === 'rest' || a.fnb === 'bar') h.caps.fnb = true;
  } else if (a.trade || a.rooms) { M('hotel').tier = 'off'; }

  /* grocery — the Retail register with grocery behaviours, never a second till */
  if (a.trade === 'grocery') {
    const gr = M('grocery'); gr.tier = 'mid';
    retail.tier = 'mid';
    why.push(['Grocery or convenience store', 'Weighed items, PLU codes, age prompts, promotions and waste']);
    if (a.stock === 'room' || a.order !== 'no') { gr.caps.gaps = true; why.push(['A stockroom and supplier ordering', 'Shelf-gap ordering walked from the aisle']); }
  } else if (a.trade) { M('grocery').tier = 'off'; }

  /* queue */
  if (a.book === 'walk' || a.trade === 'service') {
    const q = M('queue'); q.tier = 'mid';
    why.push([a.book === 'walk' ? 'Customers queue and wait' : 'Service desk or clinic', 'Queue lanes, categories, wall display']);
  } else if (a.trade || a.book) { M('queue').tier = 'off'; }

  /* invoicing */
  const iv = M('invoicing');
  if (!a.invoice) { /* unanswered — propose nothing */ }
  else if (a.invoice === 'no') { iv.tier = 'off'; }
  else if (a.invoice === 'some') { iv.tier = 'lite'; why.push(['A few accounts invoiced', 'Invoicing Lite']); }
  else if (a.invoice === 'many') { iv.tier = 'mid'; iv.caps.reminders = true; iv.caps.recurring = true; why.push(['Regular invoicing', 'Invoicing with reminders and recurring']); }

  return { p, why };
}

/* compare a proposal against live state → a human-readable diff */
function diffProposal(p) {
  const s = KZ.state(), rows = [];
  Object.keys(p.modules).forEach((mid) => {
    const m = KZ.mod(mid), want = p.modules[mid], ms = s.modules[mid];
    if (want.tier && want.tier !== ms.tier) {
      rows.push({ mid, kind: KZ.TIER_IX[want.tier] > KZ.TIER_IX[ms.tier] ? 'up' : 'down',
        what: m.name, detail: ms.tier + ' → ' + want.tier });
    }
    Object.keys(want.caps || {}).forEach((k) => {
      const c = KZ.cap(mid, k); if (!c) return;
      const nowOn = !!ms.switches[k];
      const willTier = (want.tier || ms.tier);
      const byTier = willTier !== 'off' && KZ.TIER_IX[c.tier] <= KZ.TIER_IX[willTier];
      if (want.caps[k] && !nowOn && !byTier) rows.push({ mid, kind:'add', what: m.name + ' · ' + c.name, detail: c.desc });
      if (!want.caps[k] && nowOn) rows.push({ mid, kind:'rm', what: m.name + ' · ' + c.name, detail: 'Hidden' });
    });
  });
  return rows;
}

function BusinessProfile({ onApplied }) {
  const [a, setA] = kzUse({});
  const [done, setDone] = kzUse(false);
  const answered = QUESTIONS.filter((q) => a[q.id]).length;
  const complete = answered === QUESTIONS.length;
  const { p, why } = propose(a);
  const rows = diffProposal(p);

  if (done) return (
    <div className="kzdone">
      <div className="ic"><ion-icon name="checkmark-circle"></ion-icon></div>
      <h3>Configuration applied</h3>
      <p>Every module now shows only what this business runs. Re-run the profile any time — it produces a fresh diff and never reverts a choice made by hand.</p>
      <button className="kzbtn pri" onClick={() => { setDone(false); setA({}); }}><ion-icon name="refresh-outline"></ion-icon>Start again</button>
    </div>
  );

  return (
    <div className="kzprofile">
      <div className="kzq">
        <div className="kzq__bar"><i style={{ width: (answered / QUESTIONS.length * 100) + '%' }}></i></div>
        <div className="kzq__n">{answered} of {QUESTIONS.length} answered</div>
        {QUESTIONS.map((q) => (
          <div className="kzqrow" key={q.id}>
            <div className="kzqrow__q">{q.q}{q.help && <em>{q.help}</em>}</div>
            <div className="kzopts">
              {q.opts.map(([v, l, ic]) => (
                <button key={v} className={'kzopt' + (a[q.id] === v ? ' on' : '')}
                  onClick={() => setA((x) => ({ ...x, [q.id]: v }))}>
                  <ion-icon name={ic}></ion-icon>{l}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="kzdiff">
        <div className="kzdiff__hd">
          <div><h3>Proposed setup</h3><p>Review before anything changes</p></div>
        </div>
        <div className="kzdiff__bd">
          {!answered && <div className="kzempty">Answer a question and the proposal builds itself here.</div>}

          {why.length > 0 && (
            <div className="kzwhy">
              {why.map(([because, then], i) => (
                <div className="kzwhy__r" key={i}>
                  <div className="b">{because}</div>
                  <ion-icon name="arrow-forward-outline"></ion-icon>
                  <div className="t">{then}</div>
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && <>
            <div className="kzdiff__t">Changes to your current setup</div>
            {rows.map((r, i) => (
              <div className={'kzdrow ' + r.kind} key={i}>
                <span className="s">{r.kind === 'rm' || r.kind === 'down' ? '−' : '+'}</span>
                <div><div className="t">{r.what}</div><div className="d">{r.detail}</div></div>
              </div>
            ))}
          </>}

          {answered > 0 && !rows.length && <div className="kzempty">Your setup already matches these answers. Nothing to change.</div>}
        </div>
        <div className="kzdiff__ft">
          <button className="kzbtn" onClick={() => setA({})}>Clear</button>
          <button className="kzbtn pri" disabled={!answered || !rows.length}
            onClick={() => { KZ.applyProposal(p); setDone(true); onApplied && onApplied(); }}>
            <ion-icon name="checkmark-outline"></ion-icon>Apply {rows.length ? rows.length + ' change' + (rows.length === 1 ? '' : 's') : ''}</button>
        </div>
        {!complete && answered > 0 && <div className="kzhint">You can apply a partial profile and finish later — nothing is lost either way.</div>}
      </div>
    </div>
  );
}

Object.assign(window, { BusinessProfile, QUESTIONS, propose, diffProposal });
