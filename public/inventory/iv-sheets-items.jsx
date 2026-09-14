/* Koomzo Inventory — action sheets: New item, Import, New supplier, Email supplier. */

/* ============ NEW ITEM ============
   Six fields, no scroll on a phone, one primary button. The Type selector is gone on
   purpose: a dropdown makes every user read four options and choose, when 95% of them
   want the one thing. Services, bundles and non-stock are separate entry points behind
   the Add item caret, and each only exists when its capability is on — so a Lite shop
   sees a plain button with no caret at all.

   SKU is generated and shown quietly, editable behind Edit identity. A shopkeeper
   naming their first item should not have to learn what a SKU is to save it. */

const ITEM_KIND = {
  product:   { title: 'New item',     sub: 'A stock item \u2014 quantity, price, and where it sits', icon: 'cube-outline',
               note: 'Holds stock per location. Every later change goes through a movement.' },
  service:   { title: 'New service',  sub: 'Sells time, not units', icon: 'time-outline',
               note: 'No stock. Carries duration and staff, and may consume back-bar product when performed.' },
  composite: { title: 'New bundle',   sub: 'One thing made of several items', icon: 'layers-outline',
               note: 'Holds no stock of its own \u2014 add the components after creating it. Selling it depletes them.' },
  nonstock:  { title: 'New non-stock item', sub: 'Never counted, never ordered', icon: 'card-outline',
               note: 'Gift cards, deposits, fees. Value is entered at the register.' },
};

function skuFor(catId) {
  const p = (window.IV_CATS.find((c) => c.id === catId) || {}).label || 'GEN';
  const pre = p.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
  const n = window.IV_ITEMS.filter((i) => (i.sku || '').indexOf(pre) === 0).length + 1;
  return pre + '-' + String(n * 3 + 100).slice(0, 3);
}

function NewItemSheet({ kind, loc, caps, onClose, onCreated }) {
  const type = kind || 'product';
  const meta = ITEM_KIND[type] || ITEM_KIND.product;
  const tracks = type === 'product';
  const [ident, setIdent] = useState(false);
  const [more, setMore] = useState(false);
  const [f, setF] = useState(() => ({
    type, name: '', sku: skuFor('retail'), barcode: '', cat: 'retail', brand: '',
    price: 0, cost: 0, reorder: 0, par: 0, unit: 'each', supplier: '',
    opening: 0, openingLoc: loc === 'all' ? 'dt' : loc, posShow: true, backbar: false, duration: 30,
  }));
  const set = (k) => (v) => setF((c) => Object.assign({}, c, { [k]: v }));
  const dupe = f.sku.trim() && window.IV_ITEMS.some((i) => (i.sku || '').toUpperCase() === f.sku.trim().toUpperCase());
  const err = !f.name.trim() ? 'Name is required' : !f.sku.trim() ? 'SKU is required' : dupe ? 'SKU already exists' : null;
  const margin = f.price > 0 && f.cost > 0 ? Math.round((1 - f.cost / f.price) * 100) : null;
  const locList = caps.locations ? window.IV_LOCATIONS : window.IV_LOCATIONS.slice(0, 1);

  return (
    <Sheet w="wide" title={meta.title} sub={meta.sub} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!!err}
          onClick={() => { const it = window.IVS.createItem(f); onCreated && onCreated(it.id); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>{err || 'Save'}</button>
      </>}>

      <div className="nirow">
        <div className="niphoto"><ion-icon name="camera-outline"></ion-icon></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Field label="Name" value={f.name} onChange={set('name')} placeholder="What staff will read at the register" />
          <button className="nisku" onClick={() => setIdent((v) => !v)}>
            <span>{f.sku}</span><ion-icon name={ident ? 'chevron-up-outline' : 'create-outline'}></ion-icon>
            {!ident && <em>Edit identity</em>}
          </button>
        </div>
      </div>

      {ident && (
        <div className="grp">
          <span className="grp__t">Identity</span>
          <div className="fgrid">
            <div>
              <label className="flab">SKU</label>
              <div className="field">
                <input value={f.sku} placeholder="HC-300" onChange={(e) => set('sku')(e.target.value)} />
                <button className="minibtn" onClick={() => set('sku')(skuFor(f.cat))}>Generate</button>
              </div>
              {dupe && <div className="fhint err">Already used by {window.IV_ITEMS.find((i) => i.sku.toUpperCase() === f.sku.toUpperCase()).name}</div>}
            </div>
            <Sel label="Category" value={f.cat} onChange={(v) => { set('cat')(v); }}>
              {window.IV_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Sel>
          </div>
        </div>
      )}

      <div className="fgrid">
        <Field label="Sell price" prefix="F" type="number" value={f.price} onChange={set('price')} />
        {tracks && <Field label="Cost" prefix="F" type="number" value={f.cost} onChange={set('cost')}
          hint={margin != null ? 'Margin ' + margin + '%' : 'Re-averaged on every receipt'} />}
        {type === 'service' && <Field label="Duration" suffix="min" type="number" value={f.duration} onChange={set('duration')} />}
      </div>

      {tracks && (
        <div className="fgrid">
          <Field label="Quantity on hand" type="number" value={f.opening} onChange={set('opening')}
            hint={f.opening > 0 ? 'Posts a found-stock movement so the number has an origin' : 'Leave at zero and stock it in later'} />
          {caps.locations
            ? <Sel label="At location" value={f.openingLoc} onChange={set('openingLoc')}>
                {locList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Sel>
            : <Field label="Barcode" value={f.barcode} onChange={set('barcode')} placeholder="Scan or leave empty" />}
        </div>
      )}
      {tracks && caps.locations && <Field label="Barcode" value={f.barcode} onChange={set('barcode')} placeholder="Scan or leave empty" />}
      {!tracks && <Field label="Barcode" value={f.barcode} onChange={set('barcode')} placeholder="Scan or leave empty" />}

      <button className="nimore" onClick={() => setMore((v) => !v)}>
        <ion-icon name={more ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
        {more ? 'Fewer options' : 'More options'}
      </button>

      {more && <>
        <Warn icon={meta.icon}>{meta.note}</Warn>
        {!ident && <Sel label="Category" value={f.cat} onChange={set('cat')}>
          {window.IV_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Sel>}
        <Field label="Brand" value={f.brand} onChange={set('brand')} placeholder="Optional" />

        {/* these two sections exist only when the capability that needs them is on \u2014
            a section that materialises teaches; a disabled field only frustrates */}
        {tracks && (caps.reorder || caps.purchase) && (
          <div className="grp">
            <span className="grp__t">Reordering</span>
            <div className="fgrid">
              <Field label="Reorder point" type="number" value={f.reorder} onChange={set('reorder')} hint="At or below this, the item asks to be ordered" />
              <Field label="Par level" type="number" value={f.par} onChange={set('par')} hint="Suggestions top up to here" />
            </div>
            {caps.suppliers && <Sel label="Supplier" value={f.supplier} onChange={set('supplier')} hint="Needed before this item can appear in a reorder suggestion">
              <option value="">\u2014 none yet \u2014</option>
              {window.IV_SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Sel>}
          </div>
        )}
        {tracks && (
          <div className="optrow">
            <div><div className="t">Back-bar item</div><div className="d">Consumed by services, never sold at the register.</div></div>
            <div className="sp"></div><Toggle on={f.backbar} onChange={() => set('backbar')(!f.backbar)} />
          </div>
        )}
        <div className="optrow">
          <div><div className="t">Show in POS catalogue</div><div className="d">Off keeps it stockable but unsellable.</div></div>
          <div className="sp"></div><Toggle on={f.posShow} onChange={() => set('posShow')(!f.posShow)} />
        </div>
      </>}
    </Sheet>
  );
}

/* ============ IMPORT ============ */
const IMP_SAMPLE = `name,sku,barcode,category,cost,price,qty
Curl Cream 200ml,HC-410,8412 0031 9,hair,3800,9000,24
Scalp Scrub,SK-045,,skin,5200,12000,10
Repair Shampoo,HC-300,,hair,4300,9900,0
Wide Tooth Comb,TL-012,,tools,900,2600,36`;

function ImportSheet({ loc, caps, onClose }) {
  const [raw, setRaw] = useState('');
  const [locId, setLocId] = useState(loc === 'all' ? 'wh' : loc);
  const [overwrite, setOverwrite] = useState(true);
  const [skips, setSkips] = useState({});

  const parsed = useMemo(() => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    const head = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const need = ['name', 'sku'];
    const missing = need.filter((n) => head.indexOf(n) === -1);
    const col = (n) => head.indexOf(n);
    const rows = lines.slice(1).map((line, n) => {
      const c = line.split(',').map((x) => x.trim());
      const sku = (c[col('sku')] || '').toUpperCase();
      const name = c[col('name')] || '';
      const catRaw = (c[col('category')] || '').toLowerCase();
      const cat = window.IV_CATS.find((x) => x.id === catRaw || x.label.toLowerCase() === catRaw);
      const num = (k) => { const v = c[col(k)]; if (v === undefined || v === '') return null; const f = +v.replace(/\s/g, ''); return isNaN(f) ? NaN : f; };
      const cost = num('cost'), price = num('price'), qty = num('qty');
      const exists = window.IV_ITEMS.find((i) => (i.sku || '').toUpperCase() === sku);
      const issues = [];
      if (!name) issues.push('no name');
      if (!sku) issues.push('no SKU');
      if (!cat && catRaw) issues.push('unknown category “' + catRaw + '”');
      if (isNaN(cost) || isNaN(price) || isNaN(qty)) issues.push('non-numeric value');
      if (exists && !overwrite) issues.push('SKU exists');
      return {
        n: n + 1, name, sku, barcode: c[col('barcode')] || '', cat: cat ? cat.id : 'retail',
        cost, price, qty: qty || 0, exists: !!exists, issues,
        mode: issues.length ? 'skip' : exists ? 'update' : 'create',
      };
    });
    return { head, missing, rows };
  }, [raw, overwrite]);

  const rows = parsed ? parsed.rows.map((r) => skips[r.n] ? Object.assign({}, r, { mode: 'skip' }) : r) : [];
  const cre = rows.filter((r) => r.mode === 'create').length;
  const upd = rows.filter((r) => r.mode === 'update').length;
  const skp = rows.filter((r) => r.mode === 'skip').length;
  const opening = rows.filter((r) => r.mode === 'create' && r.qty > 0).reduce((a, r) => a + r.qty * (r.cost || 0), 0);
  const blocked = !parsed || parsed.missing.length > 0 || (cre + upd) === 0;

  return (
    <Sheet w="xl" title="Import items" sub="CSV — name and SKU are required, everything else optional" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={blocked}
          onClick={() => { window.IVS.importItems(rows, locId); onClose(); }}>
          <ion-icon name="cloud-upload-outline"></ion-icon>
          {blocked ? 'Nothing to import' : 'Import ' + (cre + upd) + ' row' + (cre + upd === 1 ? '' : 's')}</button>
      </>}>
      {!raw && <Warn icon="information-circle-outline">
        Paste the sheet or choose a file. SKU is the key: a row whose SKU already exists <b>updates</b> that item rather than creating a second one.
      </Warn>}
      <div className="impbar">
        <label className="btn">
          <ion-icon name="document-attach-outline"></ion-icon>Choose file
          <input type="file" accept=".csv,text/csv,text/plain" style={{ display: 'none' }}
            onChange={(e) => { const fl = e.target.files[0]; if (!fl) return; const rd = new FileReader(); rd.onload = () => setRaw(String(rd.result)); rd.readAsText(fl); }} />
        </label>
        <button className="btn" onClick={() => setRaw(IMP_SAMPLE)}><ion-icon name="flask-outline"></ion-icon>Load sample</button>
        <div className="sp" style={{ flex: 1 }}></div>
        {raw && <button className="btn" onClick={() => { setRaw(''); setSkips({}); }}>Clear</button>}
      </div>
      <textarea className="csvin" value={raw} spellCheck="false" onChange={(e) => setRaw(e.target.value)}
        placeholder={'name,sku,barcode,category,cost,price,qty\nCurl Cream 200ml,HC-410,,hair,3800,9000,24'} />

      {parsed && parsed.missing.length > 0 &&
        <Warn tone="bad" icon="close-circle-outline">Missing required column{parsed.missing.length > 1 ? 's' : ''}: <b>{parsed.missing.join(', ')}</b>. Add a header row naming them.</Warn>}

      {parsed && !parsed.missing.length && <>
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 0 }}>
          <div className="kpi"><div className="k">Create</div><div className="v">{cre}</div></div>
          <div className="kpi"><div className="k">Update</div><div className="v">{upd}</div></div>
          <div className="kpi"><div className="k">Skip</div><div className="v" style={{ color: skp ? '#a3761c' : 'var(--kz-ink)' }}>{skp}</div></div>
          <div className="kpi"><div className="k">Opening value</div><div className="v">{money(opening)}</div></div>
        </div>
        <div className="lned">
          <div className="lnh imp"><div>Row</div><div>Item</div><div className="r">Cost</div><div className="r">Price</div><div className="r">Qty</div><div>Result</div></div>
          {rows.map((r) => (
            <div className={'lnr imp' + (r.mode === 'skip' ? ' off' : '')} key={r.n}>
              <div className="ln__s">{r.n}</div>
              <div><div className="ln__n">{r.name || <i>—</i>}</div><div className="ln__s">{r.sku || 'no SKU'} · {(window.IV_CATS.find((c) => c.id === r.cat) || {}).label}</div></div>
              <div className="r">{r.cost == null || isNaN(r.cost) ? '—' : money(r.cost)}</div>
              <div className="r">{r.price == null || isNaN(r.price) ? '—' : money(r.price)}</div>
              <div className="r">{r.qty || '—'}</div>
              <div>
                {r.issues.length
                  ? <Risk tone="high">{r.issues[0]}</Risk>
                  : <button className="linkbtn" onClick={() => setSkips((s) => Object.assign({}, s, { [r.n]: !s[r.n] }))}>
                      <Risk tone={r.mode === 'update' ? 'watch' : 'low'}>{r.mode === 'skip' ? 'Skipped' : r.mode === 'update' ? 'Update' : 'Create'}</Risk>
                    </button>}
              </div>
            </div>
          ))}
        </div>
        <div className="fgrid">
          <Sel label="Opening balances land at" value={locId} onChange={setLocId}
            hint="Rows with a qty post a found-stock movement here">
            {(caps.locations ? window.IV_LOCATIONS : window.IV_LOCATIONS.slice(0, 1)).map((l) =>
              <option key={l.id} value={l.id}>{l.name}</option>)}
          </Sel>
          <div className="optrow" style={{ alignSelf: 'end' }}>
            <div><div className="t">Update on SKU match</div><div className="d">Off makes an existing SKU an error instead.</div></div>
            <div className="sp"></div><Toggle on={overwrite} onChange={() => setOverwrite(!overwrite)} />
          </div>
        </div>
      </>}
    </Sheet>
  );
}

/* ============ NEW PARTNER ============ */
function NewSupplierSheet({ onClose, onCreated }) {
  const [f, setF] = useState({ name: '', roles: ['supplier'], contact: '', email: '', phone: '+237 ', terms: 'Net 30', lead: 7, moq: 0, note: '' });
  const set = (k) => (v) => setF((c) => Object.assign({}, c, { [k]: v }));
  const toggleRole = (r) => setF((c) => {
    const has = c.roles.indexOf(r) > -1;
    /* a partner with no role is a contact nobody can use — the last one does not come off */
    if (has && c.roles.length === 1) return c;
    return Object.assign({}, c, { roles: has ? c.roles.filter((x) => x !== r) : c.roles.concat([r]) });
  });
  const supplies = f.roles.indexOf('supplier') > -1;
  const dupe = f.name.trim() && window.IV_PARTNERS.some((s) => s.name.toLowerCase() === f.name.trim().toLowerCase());
  const err = !f.name.trim() ? 'Name is required' : dupe ? 'A partner with this name already exists' : null;
  return (
    <Sheet w="wide" title="New partner" sub="One record, one or more roles — the same account can buy and sell" onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!!err}
          onClick={() => { const s = window.IVS.createPartner(f); onCreated && onCreated(s.id); onClose(); }}>
          <ion-icon name="checkmark-outline"></ion-icon>Add partner</button>
      </>}>
      <div>
        <span className="lbl">Role</span>
        <div className="opts">
          {['supplier', 'customer'].map((r) => (
            <button key={r} className={'opt' + (f.roles.indexOf(r) > -1 ? ' on' : '')} style={{ height: 40 }} onClick={() => toggleRole(r)}>
              <ion-icon name={window.IV_ROLE[r].icon} style={{ fontSize: 15 }}></ion-icon>{window.IV_ROLE[r].label}</button>
          ))}
        </div>
        <div className="fhint">Pick both when the same business supplies you and buys from you — one account, not two that drift apart.</div>
      </div>
      <Field label="Business name" value={f.name} onChange={set('name')} placeholder="As it appears on the invoice" />
      <div className="fgrid">
        <Field label="Contact" value={f.contact} onChange={set('contact')} placeholder="Who answers the phone" />
        <Field label="Phone" value={f.phone} onChange={set('phone')} />
      </div>
      <Field label="Email" value={f.email} onChange={set('email')} placeholder="orders@partner.com"
        hint={supplies ? 'Purchase orders and chasers go here' : 'Statements and confirmations go here'} />
      <Opts label="Payment terms" value={f.terms} onChange={set('terms')} small
        options={[['Prepaid', 'Prepaid'], ['Net 7', 'Net 7'], ['Net 14', 'Net 14'], ['Net 30', 'Net 30'], ['Net 60', 'Net 60']]} />
      {/* lead time and minimum order are facts about buying FROM someone — meaningless
          on a customer-only record, so they are absent rather than zeroed */}
      {supplies && <div className="fgrid">
        <Field label="Lead time" suffix="days" type="number" value={f.lead} onChange={set('lead')}
          hint="Sets the expected date on every order" />
        <Field label="Minimum order" prefix="F" type="number" value={f.moq} onChange={set('moq')}
          hint="Suggestions below this are flagged, never blocked" />
      </div>}
      <Field label="Note" value={f.note} onChange={set('note')} placeholder="Freight rules, who to chase, anything staff should know" />
      {err && <div className="fhint err">{err}</div>}
    </Sheet>
  );
}

/* ============ EMAIL SUPPLIER ============ */
const MAIL_TPL = {
  quote: { label: 'Request a quote', subject: (s) => 'Quote request — ' + s.name,
    body: (s) => 'Hello ' + (s.contact || 'there') + ',\n\nPlease quote your current trade price and lead time for the items below. We order on ' + s.terms + ' terms.\n\n· \n· \n\nThank you,\nKoomzo — Downtown Store' },
  chase: { label: 'Chase an order', subject: (s, po) => 'Order status — ' + (po ? po.no : 'outstanding orders'),
    body: (s, po) => 'Hello ' + (s.contact || 'there') + ',\n\nCould you confirm the dispatch date for ' + (po ? po.no + ', raised ' + po.created + ' and expected ' + po.expected : 'our outstanding orders') + '?\n\nThank you,\nKoomzo — Downtown Store' },
  statement: { label: 'Request statement', subject: (s) => 'Statement request — ' + s.name,
    body: (s) => 'Hello ' + (s.contact || 'there') + ',\n\nPlease send a statement of account for the current period so we can reconcile against our receipts.\n\nThank you,\nKoomzo — Downtown Store' },
  custom: { label: 'Blank', subject: () => '', body: () => '' },
};

function EmailSheet({ supplier, onClose }) {
  const s = supplier;
  const openPOs = window.IV_POS.filter((p) => p.supplier === s.id && p.status !== 'received');
  const [tpl, setTpl] = useState('quote');
  const [attach, setAttach] = useState(openPOs.length ? openPOs[0].id : '');
  const po = window.IV_POS.find((p) => p.id === attach);
  const [f, setF] = useState({ to: s.email, cc: '', subject: MAIL_TPL.quote.subject(s), body: MAIL_TPL.quote.body(s) });
  const set = (k) => (v) => setF((c) => Object.assign({}, c, { [k]: v }));
  const pick = (t) => { setTpl(t); setF((c) => Object.assign({}, c, { subject: MAIL_TPL[t].subject(s, po), body: MAIL_TPL[t].body(s, po) })); };
  const online = navigator.onLine !== false;
  const err = !f.to.trim() ? 'No address — add one on the supplier record' : !f.subject.trim() ? 'Subject is required' : null;

  return (
    <Sheet w="wide" title={'Email ' + s.name} sub={s.contact + ' · ' + (s.email || 'no address on file')} onClose={onClose}
      foot={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!!err}
          onClick={() => { window.IVS.queueEmail({ supplier: s.id, to: f.to, subject: f.subject, body: f.body, kind: tpl, ref: po ? po.no : null }); onClose(); }}>
          <ion-icon name={online ? 'send-outline' : 'time-outline'}></ion-icon>{online ? 'Send' : 'Queue'}</button>
      </>}>
      <Opts label="Template" value={tpl} onChange={pick} small
        options={Object.keys(MAIL_TPL).map((k) => [k, MAIL_TPL[k].label])} />
      <div className="fgrid">
        <Field label="To" value={f.to} onChange={set('to')} />
        <Field label="Cc" value={f.cc} onChange={set('cc')} placeholder="Optional" />
      </div>
      <Field label="Subject" value={f.subject} onChange={set('subject')} />
      <div>
        <label className="flab">Message</label>
        <textarea className="csvin msg" value={f.body} onChange={(e) => set('body')(e.target.value)} />
      </div>
      {openPOs.length > 0 && (
        <Sel label="Attach order" value={attach} onChange={setAttach} hint="Attaches the printable order as a PDF">
          <option value="">— no attachment —</option>
          {openPOs.map((p) => <option key={p.id} value={p.id}>{p.no} · {money(IV.poTotal(p))} · {IV_PO_STATUS[p.status].label}</option>)}
        </Sel>
      )}
      {!online && <Warn tone="warn" icon="cloud-offline-outline">
        The device is offline. The message is <b>queued on this device</b> and sends itself when the connection returns — nothing is lost and nothing is sent twice.
      </Warn>}
      {err && <div className="fhint err">{err}</div>}
    </Sheet>
  );
}

Object.assign(window, { NewItemSheet, ImportSheet, NewSupplierSheet, EmailSheet, ITEM_KIND, skuFor });
