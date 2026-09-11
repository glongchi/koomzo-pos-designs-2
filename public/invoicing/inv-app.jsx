/* Koomzo POS — Invoicing app.
   One presenter drives three views (list · builder · preview) across
   three devices (desktop / tablet / phone). The Orchestrator-style
   toolbar switches devices; the page-head actions switch views. */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const IV_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "docAccent": "purple",
  "density": "comfortable",
  "device": "desktop"
}/*EDITMODE-END*/;

const IV_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

let IV_UID = 1050;

const blankInvoice = () => ({
  id: 'new', number: 'INV-' + (IV_UID++), clientId: window.KZ_INV_CLIENTS[0].id, status: 'draft',
  issue: '2026-07-19', due: '2026-08-03', taxRate: 19.25, discount: 0, po: '',
  items: [{ id: 'l' + Math.random().toString(36).slice(2, 8), desc: '', qty: 1, price: 0 }],
  notes: 'Paiement à 15 jours. Mobile money accepté.',
});

const DOC_ACCENTS = { purple: '#6a61bf', indigo: '#4b4ad9', ink: '#303b57', green: '#2e9e5b' };

function App() {
  const [t, setTweak] = useTweaks(IV_TWEAKS);
  const device = t.device;
  const [view, setView] = useState('list'); // list | builder | preview | recurring | approvals | statements | clients | setup
  const [toast, setToast] = useState(null);
  const [invoices, setInvoices] = useState(window.KZ_INVOICES);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [, bumpCaps] = useState(0);
  const [draft, setDraft] = useState(null);       // builder working copy
  const [activeId, setActiveId] = useState(null); // preview target

  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';

  useEffect(() => { setView('list'); setSelected(new Set()); setDraft(null); }, [device]);
  useEffect(() => { if (!window.KZ) return; return window.KZ.subscribe(() => bumpCaps((n) => n + 1)); }, []);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2600); return () => clearTimeout(i); }, [toast]);
  /* a capability that closes takes its screen with it — never a dead rail item */
  const capOf = { recurring:'recurring', approvals:'approvals', statements:'statements', clients:'customers' };
  useEffect(() => {
    const need = capOf[view];
    if (need && window.KZ && !window.KZ.on('invoicing', need)) setView('list');
  });

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const c = window.KZ_INV_CLIENT_OF(inv.clientId);
      const inStatus = statusFilter === 'all' || inv.status === statusFilter;
      const q = query.trim().toLowerCase();
      const inQ = !q || (inv.number + ' ' + c.name + ' ' + c.contact).toLowerCase().includes(q);
      return inStatus && inQ;
    });
  }, [invoices, statusFilter, query]);

  const counts = useMemo(() => ({
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
  }), [invoices]);

  const activeInv = activeId ? invoices.find((i) => i.id === activeId) : null;
  const pendingApproval = invoices.filter((i) => i.status === 'draft' && calcTotals(i).total >= 300000).length;

  /* ---- selection ---- */
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id)));
  const clearSel = () => setSelected(new Set());

  /* ---- navigation ---- */
  const openBuilder = (id) => { const inv = invoices.find((x) => x.id === id); setDraft(inv ? { ...inv, items: inv.items.map((l) => ({ ...l })) } : blankInvoice()); setView('builder'); };
  const openNew = () => { setDraft(blankInvoice()); setView('builder'); };
  const openPreview = (id) => { setActiveId(id); setView('preview'); };
  const backToList = () => { setView('list'); setDraft(null); };

  /* ---- draft editing ---- */
  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setLine = (id, k, v) => setDraft((d) => ({ ...d, items: d.items.map((l) => l.id === id ? { ...l, [k]: v } : l) }));
  const addLine = () => setDraft((d) => ({ ...d, items: [...d.items, { id: 'l' + Math.random().toString(36).slice(2, 8), desc: '', qty: 1, price: 0 }] }));
  const delLine = (id) => setDraft((d) => ({ ...d, items: d.items.length > 1 ? d.items.filter((l) => l.id !== id) : d.items }));

  const commitDraft = (status) => {
    const rec = { ...draft, status: status || draft.status };
    if (draft.id === 'new') { rec.id = 'i' + (IV_UID++); setInvoices((cur) => [rec, ...cur]); }
    else { setInvoices((cur) => cur.map((i) => i.id === rec.id ? rec : i)); }
    return rec;
  };
  const saveDraft = () => { commitDraft('draft'); backToList(); };
  const sendDraft = () => { const r = commitDraft('sent'); setActiveId(r.id); setView('preview'); setDraft(null); };
  const previewDraft = () => { const r = commitDraft(); setActiveId(r.id); setView('preview'); setDraft(null); };

  const accentStyle = { '--kz-primary': t.accent, '--inv-doc-accent': DOC_ACCENTS[t.docAccent] };
  const dev = IV_DEVICES[device];
  const appClass = `pa-app inv-app ${isTablet ? 'is-tablet' : ''} ${isPhone ? 'is-phone' : ''} ${t.density === 'compact' ? 'pa-rowcompact' : ''}`;

  const statusTabs = [
    { id: 'all', label: 'All', n: counts.all }, { id: 'draft', label: 'Draft', n: counts.draft },
    { id: 'sent', label: 'Sent', n: counts.sent }, { id: 'overdue', label: 'Overdue', n: counts.overdue },
    { id: 'paid', label: 'Paid', n: counts.paid },
  ];

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
      <div className="rt-wrap">
        <div className={appClass} style={accentStyle}>
          {isPhone ? (
            <PhoneFlow
              view={view} invoices={invoices} filtered={filtered} statusFilter={statusFilter}
              draft={draft} activeInv={activeInv}
              onFilter={setStatusFilter} onOpenPreview={openPreview} onNew={openNew} onBack={backToList}
              onSendDraft={sendDraft}
            />
          ) : (
            <>
              <InvNavRail view={view} onView={(v) => { setView(v); setSelected(new Set()); }}
                counts={{ overdue: counts.overdue, pending: pendingApproval }} />
              <div className="pa-main">
                <InvTopbar crumb={view === 'setup' ? 'Setup' : view === 'list' ? 'Invoices'
                  : view === 'recurring' ? 'Recurring' : view === 'approvals' ? 'Approvals'
                  : view === 'statements' ? 'Ageing' : view === 'clients' ? 'Clients'
                  : view === 'builder' ? (draft && draft.id === 'new' ? 'New invoice' : 'Edit invoice') : 'Preview'} />

                {view === 'setup' && (
                  <div className="pa-setupwrap"><ModuleSetup mid="invoicing" embedded /></div>
                )}

                {view === 'recurring' && <InvRecurring invoices={invoices} onOpen={openPreview} onToast={setToast} />}
                {view === 'approvals' && <InvApprovals invoices={invoices} threshold={300000} onOpen={openPreview}
                  onApprove={(id) => { setInvoices((cur) => cur.map((i) => i.id === id ? { ...i, status:'sent' } : i)); setToast('Approved and sent'); }} />}
                {view === 'statements' && <InvStatements invoices={invoices} />}
                {view === 'clients' && <InvClients invoices={invoices} onOpen={openPreview} />}

                {view === 'list' && (
                  <>
                    <div className="pa-pagehead">
                      <div className="pa-pagehead__t">
                        <span className="pa-eyebrow">Billing</span>
                        <h1>Invoices <span className="count">{counts.all}</span></h1>
                      </div>
                      <div className="pa-pagehead__actions">
                        <button className="pa-btn primary" onClick={openNew}><ion-icon name="add-outline"></ion-icon>New invoice</button>
                        <button className="pa-btn" onClick={() => alert('Export invoices to CSV')}><ion-icon name="download-outline"></ion-icon>Export</button>
                      </div>
                    </div>

                    <InvStats invoices={invoices} />

                    {selected.size > 0 ? (
                      <div className="pa-bulk" style={accentStyle}>
                        <b>{selected.size} selected</b>
                        <div className="pa-bulk__sep" />
                        <button onClick={() => alert('Send ' + selected.size + ' invoices')}><ion-icon name="paper-plane-outline"></ion-icon>Send</button>
                        <button onClick={() => alert('Mark ' + selected.size + ' as paid')}><ion-icon name="checkmark-circle-outline"></ion-icon>Mark paid</button>
                        <button onClick={() => alert('Export ' + selected.size)}><ion-icon name="download-outline"></ion-icon>Export</button>
                        <button className="danger" onClick={() => { setInvoices((cur) => cur.filter((i) => !selected.has(i.id))); clearSel(); }}><ion-icon name="trash-outline"></ion-icon>Delete</button>
                        <button className="pa-bulk__x" onClick={clearSel}><ion-icon name="close-outline"></ion-icon></button>
                      </div>
                    ) : (
                      <div className="pa-toolbar">
                        <label className="pa-search">
                          <ion-icon name="search-outline"></ion-icon>
                          <input placeholder="Search invoice # or client" value={query} onChange={(e) => setQuery(e.target.value)} />
                          {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
                        </label>
                        {statusTabs.map((tb) => (
                          <button key={tb.id} className={'pa-filter' + (statusFilter === tb.id ? ' active' : '')} onClick={() => setStatusFilter(tb.id)}>
                            {tb.label}{tb.id !== 'all' && tb.n > 0 && ` (${tb.n})`}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="pa-tablewrap">
                      {filtered.length === 0 ? (
                        <div className="pa-empty"><ion-icon name="receipt-outline"></ion-icon><p>No invoices match your filters.</p></div>
                      ) : (
                        <InvTable rows={filtered} selected={selected} onToggle={toggle} onToggleAll={toggleAll} onOpen={openBuilder} onPreview={openPreview} />
                      )}
                    </div>

                    <div className="pa-footer">
                      <div className="pa-footer__view">View<select className="pa-select" defaultValue="25"><option>25</option><option>50</option></select>per page</div>
                      <div className="pa-footer__range">1–{filtered.length} of {filtered.length}</div>
                      <div className="pa-pager"><button disabled><ion-icon name="chevron-back-outline"></ion-icon></button><button disabled><ion-icon name="chevron-forward-outline"></ion-icon></button></div>
                    </div>
                  </>
                )}

                {view === 'builder' && draft && (
                  <>
                    <div className="pa-pagehead">
                      <div className="pa-pagehead__t">
                        <button className="pa-link" onClick={backToList} style={{ padding: 0, marginBottom: 2 }}><ion-icon name="chevron-back-outline"></ion-icon>Invoices</button>
                        <h1>{draft.id === 'new' ? 'New invoice' : draft.number}</h1>
                      </div>
                      <div className="pa-pagehead__actions">
                        <button className="pa-btn" onClick={backToList}><ion-icon name="close-outline"></ion-icon>Cancel</button>
                      </div>
                    </div>
                    <InvBuilder
                      draft={draft} isTablet={isTablet}
                      onField={setField} onLine={setLine} onAddLine={addLine} onDelLine={delLine}
                      onCancel={backToList} onSave={saveDraft} onSend={sendDraft} onPreview={previewDraft}
                    />
                  </>
                )}

                {view === 'preview' && activeInv && (
                  <>
                    <div className="pa-pagehead">
                      <div className="pa-pagehead__t">
                        <button className="pa-link" onClick={backToList} style={{ padding: 0, marginBottom: 2 }}><ion-icon name="chevron-back-outline"></ion-icon>Invoices</button>
                        <h1>{activeInv.number} <StatusPill status={activeInv.status} /></h1>
                      </div>
                      <div className="pa-pagehead__actions">
                        <button className="pa-btn" onClick={() => openBuilder(activeInv.id)}><ion-icon name="create-outline"></ion-icon>Edit</button>
                        <button className="pa-btn" onClick={() => window.print()}><ion-icon name="download-outline"></ion-icon>Download PDF</button>
                        <button className="pa-btn primary" onClick={() => { setInvoices((cur) => cur.map((i) => i.id === activeInv.id ? { ...i, status: 'sent' } : i)); alert('Invoice sent to client'); }}><ion-icon name="paper-plane-outline"></ion-icon>Send</button>
                      </div>
                    </div>
                    <div className="inv-preview">
                      <div className="inv-paper"><InvDoc inv={activeInv} /></div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <TweaksPanel>
            <TweakSection label="Preview" />
            <TweakRadio label="Device" value={t.device}
              options={[{ value:'desktop', label:'Desktop' }, { value:'tablet', label:'Tablet' }, { value:'phone', label:'Phone' }]}
              onChange={(v) => setTweak('device', v)} />
            <TweakSection label="Brand" />
            <TweakColor label="App accent" value={t.accent}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('accent', v)} />
            <TweakSection label="Invoice document" />
            <TweakRadio label="Density" value={t.density}
              options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
              onChange={(v) => setTweak('density', v)} />
          </TweaksPanel>
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---- phone: pick the right surface for the current view ---- */
function PhoneFlow({ view, invoices, filtered, statusFilter, draft, activeInv, onFilter, onOpenPreview, onNew, onBack, onSendDraft }) {
  if (view === 'preview' && activeInv) return <InvMobileDoc inv={activeInv} onBack={onBack} onSend={() => { onSendDraft && onSendDraft(); }} />;
  if (view === 'builder' && draft) {
    // phone builder is a focused summary → jump to preview to keep the flow simple on a small screen
    return <InvMobileDoc inv={draft} onBack={onBack} onSend={onSendDraft} />;
  }
  return (
    <InvMobileList invoices={invoices} filter={statusFilter} onFilter={onFilter}
      onOpen={onOpenPreview} onPreview={onOpenPreview} onNew={onNew} />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
