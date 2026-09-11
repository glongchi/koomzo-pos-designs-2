/* Koomzo Invoicing — the intra-module rail and the screens its capabilities open.
   Before this, the rail linked sideways to other modules; a module's own rail now
   holds its own work, gated by the capability service, exactly like Retail or Salon. */

function InvNavRail({ view, onView, counts }) {
  const g = (k) => !window.KZ || window.KZ.on('invoicing', k);
  const items = [
    ['list', 'receipt-outline', 'Invoices', true, counts.overdue],
    ['recurring', 'repeat-outline', 'Recurring', g('recurring'), 0],
    ['approvals', 'shield-checkmark-outline', 'Approve', g('approvals'), counts.pending],
    ['statements', 'stats-chart-outline', 'Ageing', g('statements'), 0],
    ['clients', 'people-outline', 'Clients', g('customers'), 0],
  ].filter((x) => x[3]);
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="document-text"></ion-icon></a>
      {items.map(([id, icon, label, , n]) => (
        <button key={id} className={'pa-rail__item' + (view === id ? ' active' : '')} onClick={() => onView(id)}>
          <ion-icon name={icon}></ion-icon>{label}
          {n > 0 && <em className="padot">{n > 99 ? '99+' : n}</em>}
        </button>
      ))}
      <div className="pa-rail__spacer" />
      <button className={'pa-rail__item' + (view === 'setup' ? ' active' : '')} onClick={() => onView('setup')}>
        <ion-icon name="options-outline"></ion-icon>Setup</button>
    </nav>
  );
}

const invMoney = (n) => window.KZ_LOCALE.short(n);

/* ---------- recurring schedules ---------- */
function InvRecurring({ invoices, onOpen, onToast }) {
  const rows = invoices.slice(0, 6).map((inv, i) => ({
    inv, every: ['Monthly', 'Monthly', 'Quarterly', 'Weekly', 'Monthly', 'Quarterly'][i],
    next: ['1 Sep', '3 Sep', '1 Oct', '23 Aug', '15 Sep', '1 Nov'][i],
    runs: [7, 3, 2, 11, 1, 4][i], state: i === 4 ? 'paused' : 'active',
  }));
  return (
    <>
      <div className="pa-pagehead">
        <div className="pa-pagehead__t"><span className="pa-eyebrow">Billing</span>
          <h1>Recurring <span className="count">{rows.filter((r) => r.state === 'active').length}</span></h1></div>
        <div className="pa-pagehead__actions">
          <button className="pa-btn primary" onClick={() => onToast('New schedule · pick a client, a template and a cadence')}>
            <ion-icon name="add-outline"></ion-icon>New schedule</button>
        </div>
      </div>
      <div className="pa-tablewrap">
        <table className="pa-table">
          <thead><tr><th>Client</th><th>Template</th><th>Every</th><th>Next issue</th><th>Issued</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const c = window.KZ_INV_CLIENT_OF(r.inv.clientId);
              const t = calcTotals(r.inv);
              return (
                <tr key={r.inv.id}>
                  <td><b>{c.name}</b><small style={{ display:'block', color:'var(--kz-muted-2)' }}>{c.contact}</small></td>
                  <td>{r.inv.number} · {invMoney(t.total)}</td>
                  <td>{r.every}</td>
                  <td>{r.state === 'paused' ? <span className="inv-pill" style={{ background:'#eceef2', color:'#5d6573' }}>Paused</span> : r.next}</td>
                  <td>{r.runs} issued</td>
                  <td style={{ textAlign:'right' }}>
                    <button className="pa-btn" onClick={() => onOpen(r.inv.id)}><ion-icon name="eye-outline"></ion-icon>Open</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="kzflag warn" style={{ margin:'14px 22px' }}><ion-icon name="hourglass-outline"></ion-icon>
        <span>Winding this capability down stops future issues and leaves the schedules visible until each one ends. Nothing already issued is touched.</span></div>
    </>
  );
}

/* ---------- approvals ---------- */
function InvApprovals({ invoices, onOpen, onApprove, threshold }) {
  const pending = invoices.filter((i) => i.status === 'draft' && calcTotals(i).total >= threshold);
  return (
    <>
      <div className="pa-pagehead">
        <div className="pa-pagehead__t"><span className="pa-eyebrow">Control</span>
          <h1>Awaiting approval <span className="count">{pending.length}</span></h1></div>
        <div className="pa-pagehead__actions">
          <span className="pa-btn" style={{ pointerEvents:'none' }}><ion-icon name="funnel-outline"></ion-icon>Over {invMoney(threshold)}</span>
        </div>
      </div>
      <div className="pa-tablewrap">
        {!pending.length
          ? <div className="pa-empty"><ion-icon name="checkmark-done-outline"></ion-icon><p>Nothing is waiting on a second signature.</p></div>
          : (
            <table className="pa-table">
              <thead><tr><th>Invoice</th><th>Client</th><th>Raised by</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {pending.map((inv) => {
                  const c = window.KZ_INV_CLIENT_OF(inv.clientId);
                  return (
                    <tr key={inv.id}>
                      <td><b>{inv.number}</b></td>
                      <td>{c.name}</td>
                      <td>Danielle N. · sales</td>
                      <td><b>{invMoney(calcTotals(inv).total)}</b></td>
                      <td style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                        <button className="pa-btn" onClick={() => onOpen(inv.id)}><ion-icon name="eye-outline"></ion-icon>Review</button>
                        <button className="pa-btn primary" style={{ marginLeft:8 }} onClick={() => onApprove(inv.id)}>
                          <ion-icon name="checkmark-outline"></ion-icon>Approve &amp; send</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </>
  );
}

/* ---------- statements & ageing ---------- */
function InvStatements({ invoices }) {
  const buckets = ['Current', '1–30', '31–60', '60+'];
  const byClient = window.KZ_INV_CLIENTS.map((c) => {
    const mine = invoices.filter((i) => i.clientId === c.id && i.status !== 'paid' && i.status !== 'draft');
    const owed = mine.reduce((s, i) => s + calcTotals(i).total, 0);
    const ag = [0, 0, 0, 0];
    mine.forEach((i, ix) => { ag[i.status === 'overdue' ? (ix % 2 ? 2 : 1) : 0] += calcTotals(i).total; });
    return { c, owed, ag, n: mine.length };
  }).filter((r) => r.n);
  const tot = buckets.map((_, i) => byClient.reduce((s, r) => s + r.ag[i], 0));
  return (
    <>
      <div className="pa-pagehead">
        <div className="pa-pagehead__t"><span className="pa-eyebrow">Reporting</span>
          <h1>Ageing <span className="count">{byClient.length}</span></h1></div>
        <div className="pa-pagehead__actions">
          <button className="pa-btn"><ion-icon name="download-outline"></ion-icon>Export</button>
        </div>
      </div>
      <div className="pa-tablewrap">
        <table className="pa-table">
          <thead><tr><th>Account</th>{buckets.map((b) => <th key={b} style={{ textAlign:'right' }}>{b}</th>)}<th style={{ textAlign:'right' }}>Owed</th></tr></thead>
          <tbody>
            {byClient.map((r) => (
              <tr key={r.c.id}>
                <td><b>{r.c.name}</b><small style={{ display:'block', color:'var(--kz-muted-2)' }}>{r.n} open</small></td>
                {r.ag.map((v, i) => <td key={i} style={{ textAlign:'right', color: i > 1 && v ? 'var(--kz-discount)' : 'inherit' }}>{v ? invMoney(v) : '—'}</td>)}
                <td style={{ textAlign:'right' }}><b>{invMoney(r.owed)}</b></td>
              </tr>
            ))}
            <tr>
              <td><b>Total</b></td>
              {tot.map((v, i) => <td key={i} style={{ textAlign:'right' }}><b>{v ? invMoney(v) : '—'}</b></td>)}
              <td style={{ textAlign:'right' }}><b>{invMoney(tot.reduce((s, v) => s + v, 0))}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="kzflag ok" style={{ margin:'14px 22px' }}><ion-icon name="information-circle-outline"></ion-icon>
        <span>The series starts where the data starts. Ageing is computed from issue dates held on each document, never estimated for months before this capability was switched on.</span></div>
    </>
  );
}

/* ---------- clients ---------- */
function InvClients({ invoices, onOpen }) {
  return (
    <>
      <div className="pa-pagehead">
        <div className="pa-pagehead__t"><span className="pa-eyebrow">Reference</span>
          <h1>Clients <span className="count">{window.KZ_INV_CLIENTS.length}</span></h1></div>
        <div className="pa-pagehead__actions">
          <button className="pa-btn primary"><ion-icon name="add-outline"></ion-icon>New client</button>
        </div>
      </div>
      <div className="pa-tablewrap">
        <table className="pa-table">
          <thead><tr><th>Account</th><th>Contact</th><th>Invoices</th><th style={{ textAlign:'right' }}>Billed</th><th></th></tr></thead>
          <tbody>
            {window.KZ_INV_CLIENTS.map((c) => {
              const mine = invoices.filter((i) => i.clientId === c.id);
              const billed = mine.reduce((s, i) => s + calcTotals(i).total, 0);
              return (
                <tr key={c.id}>
                  <td><b>{c.name}</b><small style={{ display:'block', color:'var(--kz-muted-2)' }}>{c.addr[0]}</small></td>
                  <td>{c.contact}<small style={{ display:'block', color:'var(--kz-muted-2)' }}>{c.email}</small></td>
                  <td>{mine.length}</td>
                  <td style={{ textAlign:'right' }}><b>{invMoney(billed)}</b></td>
                  <td style={{ textAlign:'right' }}>
                    {mine[0] && <button className="pa-btn" onClick={() => onOpen(mine[0].id)}><ion-icon name="eye-outline"></ion-icon>Latest</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

Object.assign(window, { InvNavRail, InvRecurring, InvApprovals, InvStatements, InvClients, invMoney });
