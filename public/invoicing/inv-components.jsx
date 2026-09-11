/* Koomzo POS — Invoicing: presentational components
   List (management) · Builder · Print-ready document · phone surfaces.
   Money/date helpers + totals math shared across all three surfaces. */

/* XAF has no minor unit: whole francs, space-grouped, never a decimal point */
const money = (n) => window.KZ_LOCALE.money(n);
const num2 = (n) => String(Number(n) || 0).replace('.', ',');
const moneyS = (n) => window.KZ_LOCALE.short(n);

const fmtDate = (iso) => window.KZ_LOCALE.fmtDate(iso);
const daysTo = (iso) => Math.round((new Date(iso + 'T00:00:00') - new Date('2026-07-19T00:00:00')) / 86400000);

function calcTotals(inv) {
  const subtotal = inv.items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
  const discount = Number(inv.discount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  /* rounded to the franc — there is nothing smaller to settle in */
  const tax = Math.round(taxable * (Number(inv.taxRate) || 0) / 100);
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}

/* ---- checkbox (mirrors padmin's) ---- */
function Check({ on }) {
  return <span className={'pa-check' + (on ? ' on' : '')}><ion-icon name="checkmark-outline"></ion-icon></span>;
}

/* ---- status pill ---- */
function StatusPill({ status }) {
  const s = window.KZ_INV_STATUS[status];
  return <span className="inv-pill" style={{ background: s.wash, color: s.ink }}><i style={{ background: s.dot }} />{s.label}</span>;
}

/* ============================================================
   SHELL — rail + topbar (invoicing variant of the padmin chrome)
   ============================================================ */
function InvRail({ onSetup, setupOn }) {
  const items = [
    { icon: 'grid-outline', label: 'Home', href: 'Koomzo POS - Home.html' },
    { icon: 'cart-outline', label: 'Register', href: 'Koomzo POS.html' },
    { icon: 'pricetags-outline', label: 'Products', href: 'Koomzo POS - Products.html' },
    { icon: 'receipt-outline', label: 'Invoices', active: true },
    { icon: 'people-outline', label: 'Customers', href: 'Koomzo POS - Users.html' },
  ];
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="storefront"></ion-icon></a>
      {items.map((it) => (
        it.href
          ? <a key={it.label} className="pa-rail__item" href={it.href}><ion-icon name={it.icon}></ion-icon>{it.label}</a>
          : <button key={it.label} className={'pa-rail__item' + (it.active && !setupOn ? ' active' : '')}><ion-icon name={it.icon}></ion-icon>{it.label}</button>
      ))}
      <div className="pa-rail__spacer" />
      {onSetup && <button className={'pa-rail__item' + (setupOn ? ' active' : '')} onClick={onSetup}>
        <ion-icon name="options-outline"></ion-icon>Setup</button>}
      <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
    </nav>
  );
}

function InvTopbar({ crumb }) {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="receipt-outline"></ion-icon>
        Billing
        <ion-icon name="chevron-forward-outline"></ion-icon>
        <b>{crumb}</b>
      </div>
      <div className="pa-topbar__right">
        <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
        <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
        <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* ============================================================
   LIST — summary stats
   ============================================================ */
function InvStats({ invoices }) {
  const sum = (arr) => arr.reduce((s, i) => s + calcTotals(i).total, 0);
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const overdue = invoices.filter((i) => i.status === 'overdue');
  const paidMonth = invoices.filter((i) => i.status === 'paid' && i.issue >= '2026-06-01');
  const drafts = invoices.filter((i) => i.status === 'draft');
  const cards = [
    { k: 'Outstanding', v: moneyS(sum(outstanding)), sub: `${outstanding.length} open invoices`, icon: 'hourglass-outline', tint: { bg: '#e8f0fd', fg: '#528cef' } },
    { k: 'Overdue', v: moneyS(sum(overdue)), sub: `${overdue.length} past due`, icon: 'alert-circle-outline', tint: { bg: '#fdeae4', fg: '#ec603a' }, alert: true },
    { k: 'Paid this month', v: moneyS(sum(paidMonth)), sub: `${paidMonth.length} invoices`, icon: 'checkmark-circle-outline', tint: { bg: '#e4f4ea', fg: '#2e9e5b' } },
    { k: 'Drafts', v: String(drafts.length), sub: 'Not yet sent', icon: 'create-outline', tint: { bg: '#eceef2', fg: '#5d6573' } },
  ];
  return (
    <div className="inv-stats">
      {cards.map((c) => (
        <div key={c.k} className={'inv-stat' + (c.alert ? ' is-alert' : '')}>
          <div className="inv-stat__top">
            <div className="inv-stat__ico" style={{ background: c.tint.bg, color: c.tint.fg }}><ion-icon name={c.icon}></ion-icon></div>
            <div className="inv-stat__k">{c.k}</div>
          </div>
          <div className="inv-stat__v">{c.v}</div>
          <div className="inv-stat__sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ---- list table ---- */
function InvTable({ rows, selected, onToggle, onToggleAll, onOpen, onPreview }) {
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.id));
  return (
    <table className="pa-table">
      <thead>
        <tr>
          <th className="pa-th-check"><button style={{ border: 'none', background: 'transparent', padding: 0 }} onClick={onToggleAll}><Check on={allOn} /></button></th>
          <th>Invoice</th>
          <th>Client</th>
          <th>Issued</th>
          <th>Due</th>
          <th className="num">Amount</th>
          <th>Status</th>
          <th style={{ width: 96, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((inv) => {
          const c = window.KZ_INV_CLIENT_OF(inv.clientId);
          const { total } = calcTotals(inv);
          const on = selected.has(inv.id);
          const late = inv.status === 'overdue';
          return (
            <tr key={inv.id} className={on ? 'sel' : ''} onClick={() => onOpen(inv.id)}>
              <td onClick={(e) => { e.stopPropagation(); onToggle(inv.id); }}><Check on={on} /></td>
              <td><span className="inv-num">{inv.number}</span></td>
              <td>
                <div className="inv-client">
                  <div className="inv-avatar" style={{ background: c.tint.bg, color: c.tint.fg }}><ion-icon name={c.icon}></ion-icon></div>
                  <div className="inv-client__t"><b>{c.name}</b><small>{c.contact}</small></div>
                </div>
              </td>
              <td><span className="pa-mono">{fmtDate(inv.issue)}</span></td>
              <td><span className={'pa-mono inv-due' + (late ? ' is-late' : '')}>{fmtDate(inv.due)}</span></td>
              <td className="num"><span className="pa-money">{moneyS(total)}</span></td>
              <td><StatusPill status={inv.status} /></td>
              <td>
                <div className="pa-rowact">
                  <button className="pa-rowbtn" title="Preview" onClick={(e) => { e.stopPropagation(); onPreview(inv.id); }}><ion-icon name="eye-outline"></ion-icon></button>
                  <button className="pa-rowbtn" title="Edit" onClick={(e) => { e.stopPropagation(); onOpen(inv.id); }}><ion-icon name="create-outline"></ion-icon></button>
                  <button className="pa-rowbtn danger" title="Delete" onClick={(e) => { e.stopPropagation(); alert('Delete ' + inv.number + '?'); }}><ion-icon name="trash-outline"></ion-icon></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ============================================================
   BUILDER
   ============================================================ */
function InvBuilder({ draft, isTablet, onField, onLine, onAddLine, onDelLine, onCancel, onSave, onSend, onPreview }) {
  const client = window.KZ_INV_CLIENT_OF(draft.clientId);
  const t = calcTotals(draft);
  return (
    <div className="inv-build">
      <div className="inv-build__form">
        {/* Parties */}
        <div className="inv-parties">
          <div className="inv-card">
            <div className="inv-card__h"><ion-icon name="storefront-outline"></ion-icon>From</div>
            <div className="inv-clientpick">
              <div className="inv-avatar" style={{ background: 'var(--kz-primary)', color: '#fff' }}><ion-icon name="storefront"></ion-icon></div>
              <div className="inv-clientpick__t"><b>{window.KZ_INV_ORG.name}</b><small>{window.KZ_INV_ORG.email} · {window.KZ_INV_ORG.taxId}</small></div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-card__h"><ion-icon name="person-outline"></ion-icon>Bill to<span className="spacer" /></div>
            <div className="inv-field">
              <label>Client</label>
              <select className="inv-input" value={draft.clientId} onChange={(e) => onField('clientId', e.target.value)}>
                {window.KZ_INV_CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="inv-clientpick">
              <div className="inv-avatar" style={{ background: client.tint.bg, color: client.tint.fg }}><ion-icon name={client.icon}></ion-icon></div>
              <div className="inv-clientpick__t"><b>{client.contact}</b><small>{client.email}</small></div>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="inv-card">
          <div className="inv-card__h"><ion-icon name="document-text-outline"></ion-icon>Invoice details</div>
          <div className="inv-grid2">
            <div className="inv-field"><label>Invoice number</label><input className="inv-input mono" value={draft.number} onChange={(e) => onField('number', e.target.value)} /></div>
            <div className="inv-field"><label>Purchase order</label><input className="inv-input mono" value={draft.po || ''} placeholder="Optional" onChange={(e) => onField('po', e.target.value)} /></div>
            <div className="inv-field"><label>Issue date</label><input className="inv-input mono" type="date" value={draft.issue} onChange={(e) => onField('issue', e.target.value)} /></div>
            <div className="inv-field"><label>Due date</label><input className="inv-input mono" type="date" value={draft.due} onChange={(e) => onField('due', e.target.value)} /></div>
          </div>
        </div>

        {/* Line items */}
        <div className="inv-card">
          <div className="inv-card__h"><ion-icon name="list-outline"></ion-icon>Line items<span className="spacer" /></div>
          <table className="inv-lines">
            <thead>
              <tr>
                <th className="inv-col-desc">Description</th>
                <th className="inv-col-qty num">Qty</th>
                <th className="inv-col-price num">Unit price</th>
                <th className="inv-col-amt num">Amount</th>
                <th className="inv-col-x"></th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((l) => (
                <tr key={l.id}>
                  <td><input className="inv-lc-input" value={l.desc} placeholder="Item or service" onChange={(e) => onLine(l.id, 'desc', e.target.value)} /></td>
                  <td><input className="inv-lc-input num" type="number" min="0" value={l.qty} onChange={(e) => onLine(l.id, 'qty', e.target.value)} /></td>
                  <td><input className="inv-lc-input num" type="number" min="0" step="0.01" value={l.price} onChange={(e) => onLine(l.id, 'price', e.target.value)} /></td>
                  <td className="inv-lc-amount">{money((Number(l.qty) || 0) * (Number(l.price) || 0))}</td>
                  <td><button className="inv-lc-del" title="Remove" onClick={() => onDelLine(l.id)}><ion-icon name="close-outline"></ion-icon></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="inv-addline" onClick={onAddLine}><ion-icon name="add-outline"></ion-icon>Add line item</button>
        </div>

        {/* Notes */}
        <div className="inv-card">
          <div className="inv-card__h"><ion-icon name="chatbox-ellipses-outline"></ion-icon>Notes &amp; terms</div>
          <div className="inv-field"><label>Note to client</label><textarea className="inv-input" value={draft.notes || ''} placeholder="Payment terms, thank-you note, or instructions…" onChange={(e) => onField('notes', e.target.value)} /></div>
        </div>
      </div>

      {/* Summary rail */}
      <aside className="inv-build__side">
        <div className="inv-side__h">
          <div className="eyebrow">Summary</div>
          <h3>{draft.number}</h3>
        </div>
        <div className="inv-side__body">
          <div className="inv-sum-row">Subtotal<b>{money(t.subtotal)}</b></div>
          <div className="inv-side__rateedit">
            <div className="inv-field" style={{ margin: 0 }}><label>Discount (FCFA)</label><input className="inv-input mono" type="number" min="0" step="100" value={draft.discount} onChange={(e) => onField('discount', e.target.value)} /></div>
            <div className="inv-field" style={{ margin: 0 }}><label>Tax rate (%)</label><input className="inv-input mono" type="number" min="0" step="0.01" value={draft.taxRate} onChange={(e) => onField('taxRate', e.target.value)} /></div>
          </div>
          {t.discount > 0 && <div className="inv-sum-row is-neg">Discount<b>−{money(t.discount)}</b></div>}
          <div className="inv-sum-row">TVA ({num2(draft.taxRate)} %)<b>{money(t.tax)}</b></div>
          <div className="inv-sum-div" />
          <div className="inv-sum-total"><span className="k">Total due</span><span className="v">{money(t.total)}</span></div>
        </div>
        <div className="inv-side__foot">
          <button className="inv-btn-primary" onClick={onSend}><ion-icon name="paper-plane-outline"></ion-icon>Save &amp; Send</button>
          <div className="inv-btn-row">
            <button className="inv-btn-ghost" onClick={onSave}><ion-icon name="save-outline"></ion-icon>Save draft</button>
            <button className="inv-btn-ghost" onClick={onPreview}><ion-icon name="eye-outline"></ion-icon>Preview</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================
   PRINT-READY DOCUMENT
   ============================================================ */
function InvDoc({ inv }) {
  const org = window.KZ_INV_ORG;
  const c = window.KZ_INV_CLIENT_OF(inv.clientId);
  const t = calcTotals(inv);
  return (
    <div className="inv-doc">
      <div className="inv-doc__top">
        <div className="inv-doc__brand">
          <div className="inv-doc__mark"><ion-icon name="storefront"></ion-icon></div>
          <div className="inv-doc__org"><b>{org.name}</b><span>{org.tagline}</span></div>
        </div>
        <div className="inv-doc__title">
          <h1>Invoice</h1>
          <div className="num">{inv.number}</div>
          <StatusPill status={inv.status} />
        </div>
      </div>

      <div className="inv-doc__meta">
        <div className="inv-doc__block">
          <div className="lbl">From</div>
          <div className="nm">{org.name}</div>
          <p>{org.addr.map((ln, i) => <React.Fragment key={i}>{ln}<br /></React.Fragment>)}{org.email}<br />{org.phone}</p>
        </div>
        <div className="inv-doc__block">
          <div className="lbl">Bill to</div>
          <div className="nm">{c.name}</div>
          <p>{c.contact}<br />{c.addr.map((ln, i) => <React.Fragment key={i}>{ln}<br /></React.Fragment>)}{c.email}</p>
        </div>
        <div className="inv-doc__dates">
          <div className="drow"><span>Invoice #</span><b>{inv.number}</b></div>
          <div className="drow"><span>Issue date</span><b>{fmtDate(inv.issue)}</b></div>
          <div className="drow due"><span>Due date</span><b>{fmtDate(inv.due)}</b></div>
          {inv.po && <div className="drow"><span>PO number</span><b>{inv.po}</b></div>}
        </div>
      </div>

      <table className="inv-doc__table">
        <thead>
          <tr><th style={{ width: '52%' }}>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          {inv.items.map((l) => (
            <tr key={l.id}>
              <td><span className="d-desc">{l.desc || '—'}</span></td>
              <td className="num">{l.qty}</td>
              <td className="num">{money(l.price)}</td>
              <td className="num">{money((Number(l.qty) || 0) * (Number(l.price) || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-doc__foot">
        <div className="inv-doc__pay">
          <div className="lbl">Payment details</div>
          <p><b>{org.bank.name}</b></p>
          <p>Compte {org.bank.acct} · RIB {org.bank.routing}</p>
          <p>{org.momo}</p>
          <p style={{ marginTop: 10 }}>{org.terms}</p>
        </div>
        <div className="inv-doc__totals">
          <div className="inv-doc__trow">Subtotal<b>{money(t.subtotal)}</b></div>
          {t.discount > 0 && <div className="inv-doc__trow is-neg">Discount<b>−{money(t.discount)}</b></div>}
          <div className="inv-doc__trow">TVA ({num2(inv.taxRate)} %)<b>{money(t.tax)}</b></div>
          <div className="inv-doc__grand"><span className="k">Total due</span><span className="v">{money(t.total)}</span></div>
        </div>
      </div>

      {inv.notes && (
        <div className="inv-doc__note"><div className="lbl">Notes</div><p>{inv.notes}</p></div>
      )}
      <div className="inv-doc__thanks">Thank you for your business.</div>
    </div>
  );
}

/* ============================================================
   PHONE — list
   ============================================================ */
function InvMobileList({ invoices, filter, onFilter, onOpen, onPreview, onNew }) {
  const sum = (arr) => arr.reduce((s, i) => s + calcTotals(i).total, 0);
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const overdue = invoices.filter((i) => i.status === 'overdue');
  const tabs = [
    { id: 'all', label: 'All' }, { id: 'draft', label: 'Draft' }, { id: 'sent', label: 'Sent' },
    { id: 'overdue', label: 'Overdue' }, { id: 'paid', label: 'Paid' },
  ];
  const rows = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);
  return (
    <div className="invm">
      <header className="invm__head">
        <div className="mk"><ion-icon name="receipt"></ion-icon></div>
        <div className="ht"><h1>Invoices</h1><span className="sub">{invoices.length} total · {overdue.length} overdue</span></div>
        <button className="invm__back" title="Search" style={{ marginLeft: 'auto' }}><ion-icon name="search-outline"></ion-icon></button>
      </header>

      <div className="invm__hero">
        <div className="k">Outstanding</div>
        <div className="v">{moneyS(sum(outstanding))}</div>
        <div className="sub"><ion-icon name="alert-circle-outline"></ion-icon>{moneyS(sum(overdue))} overdue · {outstanding.length} open</div>
      </div>

      <div className="invm__tabs">
        {tabs.map((tb) => <button key={tb.id} className={'invm__tab' + (filter === tb.id ? ' active' : '')} onClick={() => onFilter(tb.id)}>{tb.label}</button>)}
      </div>

      <div className="invm__list">
        {rows.map((inv) => {
          const c = window.KZ_INV_CLIENT_OF(inv.clientId);
          const { total } = calcTotals(inv);
          const late = inv.status === 'overdue';
          return (
            <button key={inv.id} className="invm__card" onClick={() => onOpen(inv.id)}>
              <div className="inv-avatar" style={{ width: 44, height: 44, background: c.tint.bg, color: c.tint.fg }}><ion-icon name={c.icon} style={{ fontSize: 22 }}></ion-icon></div>
              <div className="invm__card-body">
                <div className="top"><span className="num">{inv.number}</span><StatusPill status={inv.status} /></div>
                <div className="nm">{c.name}</div>
                <div className="row2"><span className="amt">{money(total)}</span><span className={'due' + (late ? ' is-late' : '')}>Due {fmtDate(inv.due)}</span></div>
              </div>
            </button>
          );
        })}
      </div>
      <button className="invm__fab" onClick={onNew}><ion-icon name="add-outline"></ion-icon>New</button>
    </div>
  );
}

/* phone — document view */
function InvMobileDoc({ inv, onBack, onSend }) {
  return (
    <div className="invm">
      <header className="invm__head">
        <button className="invm__back" onClick={onBack}><ion-icon name="chevron-back-outline"></ion-icon></button>
        <div className="ht"><h1>{inv.number}</h1><span className="sub">Preview</span></div>
        <button className="invm__back" title="Download" style={{ marginLeft: 'auto' }} onClick={() => window.print()}><ion-icon name="download-outline"></ion-icon></button>
      </header>
      <div className="invm__scroll">
        <div className="invm__paper"><InvDoc inv={inv} /></div>
      </div>
      <div className="invm__barbtns">
        <button className="inv-btn-ghost" style={{ background: '#fff' }} onClick={onBack}><ion-icon name="create-outline"></ion-icon>Edit</button>
        <button className="inv-btn-primary" style={{ flex: 1 }} onClick={onSend}><ion-icon name="paper-plane-outline"></ion-icon>Send invoice</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  money, moneyS, num2, fmtDate, daysTo, calcTotals,
  StatusPill, InvRail, InvTopbar, InvStats, InvTable,
  InvBuilder, InvDoc, InvMobileList, InvMobileDoc,
});
