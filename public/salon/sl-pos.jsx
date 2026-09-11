/* Koomzo Salon — point of sale: register board, tender, and service management.
   Uses the shared POS shell classes from retailflex/rx.css (board / cart / tiles / sheets). */

function RegisterView({ api }) {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [line, setLine] = useState(null);
  const cats = [['all', 'All', 'grid-outline'], ['Hair', 'Hair', 'cut-outline'], ['Colour', 'Colour', 'color-palette-outline'],
    ['Barber', 'Barber', 'man-outline'], ['Care', 'Care', 'water-outline'], ['Retail', 'Retail', 'pricetag-outline']];
  const items = [...SL.services.map((s) => ({ ...s, kind: 'service' })), ...SL.products.map((p) => ({ ...p, kind: 'product', dur: 0 }))]
    .filter((x) => (cat === 'all' || x.cat === cat) && (!q || x.name.toLowerCase().includes(q.toLowerCase())));
  const tk = api.ticket, T = api.totals;

  return (
    <div className="board">
      <section className="cat">
        <div className="entry">
          <div className="scanbox plain">
            <ion-icon name="search-outline"></ion-icon>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services, products or client" />
          </div>
          <button className="entry__btn" onClick={() => api.setView('calendar')}><ion-icon name="calendar-outline"></ion-icon><span>Book</span></button>
          <button className="entry__btn" onClick={() => api.setView('services')}><ion-icon name="options-outline"></ion-icon><span>Services</span></button>
        </div>
        <div className="cats">
          {cats.map(([id, label, ic]) => (
            <button key={id} className={'chip' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>
              <ion-icon name={ic}></ion-icon>{label}
            </button>
          ))}
        </div>
        <div className="scroll">
          {api.finished.length > 0 && cat === 'all' && !q && (
            <>
              <div className="sechead"><h3>Finished in the chair</h3><span>tap to add to the ticket</span></div>
              <div className="grid list" style={{ marginBottom: 18 }}>
                {api.finished.map((a) => {
                  const s = staffOf(a.staff);
                  return (
                    <button className="tile" key={a.id} onClick={() => api.fromAppt(a)}>
                      <div className="tile__art" style={{ background: 'var(--kz-success-wash)' }}><ion-icon name="checkmark-circle-outline" style={{ color: 'var(--kz-success)' }}></ion-icon></div>
                      <div className="tile__meta">
                        <div><div className="tile__name">{a.client}</div><div className="tile__sub">{a.service} · {s.first} · {fmt(a.start)}</div></div>
                        <div className="tile__price">{money(a.price)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="sechead"><h3>{cat === 'all' ? 'Services & retail' : cat}</h3><span>{items.length} items</span></div>
          <div className="grid">
            {items.map((x) => {
              const n = tk.lines.filter((l) => l.ref === x.id).reduce((s, l) => s + l.qty, 0);
              return (
                <button className="tile" key={x.id} onClick={() => api.addLine(x)}>
                  <div className="tile__art" style={{ background: x.kind === 'service' ? 'var(--kz-primary-wash)' : 'var(--kz-surface-2)' }}>
                    <ion-icon name={x.icon} style={{ color: x.kind === 'service' ? 'var(--kz-primary)' : 'var(--kz-muted)' }}></ion-icon>
                  </div>
                  {!!n && <span className="tile__badge">{n}</span>}
                  {x.kind === 'product' && x.stock != null && x.stock <= 4 && <span className="tile__flag warn"><ion-icon name="alert-circle-outline"></ion-icon>{x.stock} left</span>}
                  <div className="tile__meta">
                    <div className="tile__name">{x.name}</div>
                    <div className="tile__sub">{x.kind === 'service' ? x.dur + ' min' : x.stock != null ? x.stock + ' in stock' : 'Any value'}</div>
                    <div className="tile__price">{money(x.price)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className={'cart' + (api.cartOpen ? ' open' : '')}>
        <div className="cart__head">
          <div className="cart__no">Ticket #{api.ticketNo}<small>{tk.lines.length ? tk.lines.length + ' line' + (tk.lines.length > 1 ? 's' : '') : 'Empty'}</small></div>
          <div className="sp"></div>
          {!!tk.lines.length && <button className="icbtn" onClick={api.clearTicket}><ion-icon name="trash-outline"></ion-icon></button>}
          <button className="icbtn drawer-only" onClick={() => api.setCartOpen(false)}><ion-icon name="chevron-forward-outline"></ion-icon></button>
        </div>
        <button className="custrow" onClick={() => api.setClient()}>
          <ion-icon name={tk.client ? 'person-circle-outline' : 'person-add-outline'}></ion-icon>
          <span className="nm">{tk.client || 'Add client'}</span>
          {tk.apptId && <span className="pts">Appointment</span>}
        </button>

        <div className="lines">
          {!tk.lines.length && (
            <div className="empty">
              <ion-icon name="cut-outline"></ion-icon>
              <p>No items yet — tap a service, or pull a finished appointment from the left.</p>
            </div>
          )}
          {tk.lines.map((l) => {
            const s = l.staff ? staffOf(l.staff) : null;
            return (
              <div className={'line' + (line === l.uid ? ' sel' : '')} key={l.uid}>
                <div className="line__body" onClick={() => setLine(l.uid)} style={{ cursor: 'pointer' }}>
                  <div className="line__top">
                    <span className="line__name">{l.name}</span>
                    <span className="line__amt">{money(l.price * l.qty * (1 - l.disc / 100))}</span>
                  </div>
                  <div className="line__sub">
                    <b>{money(l.price)}</b>
                    {l.kind === 'service' ? (s ? <span className="pill var">{s.first}</span> : <span className="pill wt">Assign stylist</span>) : <span className="pill sn">Retail</span>}
                    {!!l.disc && <span className="pill disc">−{l.disc}%</span>}
                  </div>
                </div>
                <div className="stepper">
                  <button onClick={() => api.setQty(l.uid, -1)}><ion-icon name="remove-outline"></ion-icon></button>
                  <span className="q">{l.qty}</span>
                  <button onClick={() => api.setQty(l.uid, 1)}><ion-icon name="add-outline"></ion-icon></button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="quick">
          <button onClick={() => tk.lines.length && setLine(tk.lines[tk.lines.length - 1].uid)}>Stylist</button>
          <button onClick={() => tk.lines.length && setLine(tk.lines[tk.lines.length - 1].uid)}>Discount</button>
          <button onClick={() => { const gc = SL.products.find((p) => p.id === 'p7'); api.addLine({ id: gc.id, name: gc.name, price: gc.price, kind: 'product', icon: gc.icon }); }}>{SL.products.find((p) => p.id === 'p7').name}</button>
          <button onClick={api.holdTicket}>Hold</button>
        </div>
        <div className="totals">
          <div className="trow"><span className="k">Subtotal</span><span className="v">{money(T.net)}</span></div>
          {!!T.discount && <div className="trow"><span className="k">Discounts</span><span className="v" style={{ color: 'var(--kz-discount)' }}>−{money(T.discount)}</span></div>}
          <div className="trow"><span className="k">TVA (19,25 %)</span><span className="v">{money(T.tax)}</span></div>
          <div className="trow big"><span className="k">Total</span><span className="v">{money(T.total)}</span></div>
        </div>
        <div className="paybar">
          <button className="pay" disabled={!tk.lines.length} onClick={() => api.openTender()}>
            <ion-icon name="card-outline"></ion-icon>Charge <span className="amt">{money(T.total)}</span>
          </button>
        </div>
      </aside>

      {!api.cartOpen && (
        <div className="dockbar">
          <div className="sum">{money(T.total)}<small>{tk.lines.length} line{tk.lines.length === 1 ? '' : 's'} · Ticket #{api.ticketNo}</small></div>
          <button className="go" onClick={() => api.setCartOpen(true)}><ion-icon name="receipt-outline"></ion-icon>Ticket</button>
        </div>
      )}

      {line && <LineSheet l={tk.lines.find((x) => x.uid === line)} api={api} onClose={() => setLine(null)} />}
    </div>
  );
}

function LineSheet({ l, api, onClose }) {
  if (!l) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{l.name}</h3><p>{money(l.price)} · {l.kind === 'service' ? 'service' : 'retail'}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          {l.kind === 'service' && (
            <div>
              <span className="lbl">Performed by</span>
              <div className="pickgrid" style={{ marginTop: 8, gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
                {SL.staff.filter((s) => !/Front desk/.test(s.role)).map((s) => (
                  <button key={s.id} className={'pk' + (l.staff === s.id ? ' on' : '')} onClick={() => api.setLineStaff(l.uid, s.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Av s={s} size="sm" />
                    <div><div className="pk__n">{s.first}</div><div className="pk__m">{s.role}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="lbl">Discount</span>
            <div className="opts" style={{ marginTop: 8 }}>
              {[0, 10, 20, 50].map((d) => (
                <button key={d} className={'opt' + (l.disc === d ? ' on' : '')} onClick={() => api.setLineDisc(l.uid, d)}>{d ? d + '%' : 'None'}</button>
              ))}
            </div>
          </div>
          {api.role !== 'manager' && l.disc > 20 && (
            <div className="note"><ion-icon name="lock-closed-outline"></ion-icon>Discounts over 20% need a manager PIN at the register.</div>
          )}
        </div>
        <div className="sheet__foot">
          <button className="btn danger" onClick={() => { api.removeLine(l.uid); onClose(); }}><ion-icon name="trash-outline"></ion-icon>Remove</button>
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* the platform list, minus bank cards a salon does not take, plus gift cards */
const SL_TENDERS = window.KZ_LOCALE.tenderList
  .filter((t) => t.id !== 'card')
  .map((t) => [t.id, t.label, t.icon])
  .concat([['gift', 'Carte cadeau', 'gift-outline']]);
const tenderLabel = (v) => (SL_TENDERS.find((t) => t[0] === v) || [, '—'])[1];

function TenderSheet({ api, onClose }) {
  const T = api.totals;
  const [tip, setTip] = useState(0);
  const [method, setMethod] = useState('momo');
  const [done, setDone] = useState(false);
  const tipAmt = tip;
  const grand = T.total + tipAmt;
  const svcStaff = [...new Set(api.ticket.lines.filter((l) => l.kind === 'service' && l.staff).map((l) => l.staff))];

  if (done) {
    return (
      <div className="scrim">
        <div className="sheet">
          <div className="sheet__body" style={{ paddingTop: 24 }}>
            <div className="done">
              <div className="done__ic"><ion-icon name="checkmark-outline"></ion-icon></div>
              <h4>{money(grand)} paid</h4>
              <p>{tenderLabel(method)} · receipt sent{tipAmt ? ' · ' + money(tipAmt) + ' tip' + (svcStaff.length ? ' split to ' + svcStaff.map((s) => staffOf(s).first).join(', ') : '') : ''}</p>
            </div>
            <div className="chiprow" style={{ justifyContent: 'center' }}>
              <button className="sbtn" onClick={() => { api.finishSale(grand, tipAmt, method); onClose(); api.setView('calendar'); }}><ion-icon name="calendar-outline"></ion-icon>Rebook client</button>
            </div>
          </div>
          <div className="sheet__foot">
            <button className="btn primary wide" onClick={() => { api.finishSale(grand, tipAmt, method); onClose(); }}>New sale</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>Take payment</h3><p>{api.ticket.client || 'Walk-in'} · Ticket #{api.ticketNo}</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          {api.settings.tips && (
          <div>
            <span className="lbl">Tip {svcStaff.length ? '· to ' + svcStaff.map((s) => staffOf(s).first).join(' & ') : ''}</span>
            <div className="opts" style={{ marginTop: 8 }}>
              {[0, 500, 1000, 2000].map((p) => (
                <button key={p} className={'opt' + (tip === p ? ' on' : '')} onClick={() => setTip(p)}>
                  {p ? money(p) : 'No tip'}
                </button>
              ))}
            </div>
          </div>
          )}
          <div>
            <span className="lbl">Method</span>
            <div className="tenders" style={{ marginTop: 8 }}>
              {SL_TENDERS.map(([v, l, ic]) => (
                <button key={v} className={'tender' + (method === v ? ' on' : '')} onClick={() => setMethod(v)}>
                  <ion-icon name={ic}></ion-icon>{l}
                </button>
              ))}
            </div>
          </div>
          <div className="sumbox">
            <div className="r"><span>Services & retail</span><b>{money(T.net)}</b></div>
            <div className="r"><span>TVA</span><b>{money(T.tax)}</b></div>
            {api.settings.tips && <div className="r"><span>Tip</span><b>{money(tipAmt)}</b></div>}
            <div className="r big"><span>To pay</span><b>{money(grand)}</b></div>
          </div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Back</button>
          <button className="btn primary" style={{ background: 'var(--kz-success)', borderColor: 'var(--kz-success)', boxShadow: '0 6px 14px rgba(46,158,91,.28)' }}
            onClick={() => setDone(true)}><ion-icon name="checkmark-outline"></ion-icon>Charge {money(grand)}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- service management ---------------- */
function ServicesView({ api }) {
  const [tab, setTab] = useState('services');
  const [edit, setEdit] = useState(null);
  const svc = api.services;
  const groups = ['Hair', 'Colour', 'Barber', 'Care'];
  const avg = (svc.reduce((s, x) => s + x.price, 0) / svc.length).toFixed(0);
  const top = [...svc].sort((a, b) => b.book - a.book)[0];

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Services</h2><p>Price list, duration and who performs each service</p></div>
        <div className="sp"></div>
        <Seg value={tab} options={[{ v: 'services', label: 'Services' }, { v: 'retail', label: 'Retail' }]} onChange={setTab} />
        {tab === 'services' && <button className="btn primary" onClick={() => setEdit({})}><ion-icon name="add-outline"></ion-icon>New service</button>}
      </div>

      {tab === 'services' ? (
        <>
          <div className="kpis">
            <div className="kpi"><div className="k">Services</div><div className="v">{svc.length}</div></div>
            <div className="kpi"><div className="k">Average price</div><div className="v">{money(avg)}</div></div>
            <div className="kpi"><div className="k">Most booked</div><div className="v" style={{ fontSize: 17 }}>{top.name}<small style={{ font: '500 12.5px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}> · {top.book} this month</small></div></div>
            <div className="kpi"><div className="k">Bookable online</div><div className="v">{svc.filter((x) => x.online).length} / {svc.length}</div></div>
          </div>
          {groups.map((g) => {
            const rows = svc.filter((x) => x.cat === g);
            if (!rows.length) return null;
            return (
              <section className="panel" key={g} style={{ marginBottom: 12 }}>
                <div className="panel__hd"><div><h3>{g}</h3><p>{rows.length} services</p></div></div>
                <div>
                  {rows.map((x) => (
                    <div className="svrow" key={x.id}>
                      <div className="svrow__ic"><ion-icon name={x.icon}></ion-icon></div>
                      <div className="svrow__b">
                        <div className="svrow__n">{x.name}</div>
                        <div className="svrow__m">{x.dur} min · {x.book} booked this month</div>
                      </div>
                      <div className="svrow__who">
                        {x.who.map((id) => <Av key={id} s={staffOf(id)} size="sm" title={staffOf(id).name} />)}
                      </div>
                      <div className="svrow__p">{money(x.price)}</div>
                      <div className="svrow__on">
                        <span className={'badge ' + (x.online ? 'ok' : '')}>{x.online ? 'Online' : 'In salon'}</span>
                      </div>
                      <button className="sbtn" onClick={() => setEdit(x)}><ion-icon name="create-outline"></ion-icon><span className="lbl-h">Edit</span></button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : (
        <section className="panel">
          <div className="panel__hd"><div><h3>Retail</h3><p>{SL.products.length} products · sold at the register</p></div></div>
          <div>
            {SL.products.map((p) => (
              <div className="svrow" key={p.id}>
                <div className="svrow__ic" style={{ background: 'var(--kz-surface-2)', color: 'var(--kz-muted)' }}><ion-icon name={p.icon}></ion-icon></div>
                <div className="svrow__b"><div className="svrow__n">{p.name}</div><div className="svrow__m">{p.stock != null ? p.stock + ' in stock' : 'Open value'}</div></div>
                <div className="svrow__p">{money(p.price)}</div>
                <div className="svrow__on">{p.stock != null && p.stock <= 4 && <span className="badge wrn">Reorder</span>}</div>
                <button className="sbtn" onClick={() => api.toast('Retail editing lives in Products')}><ion-icon name="create-outline"></ion-icon><span className="lbl-h">Edit</span></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {edit && <ServiceSheet svc={edit} api={api} onClose={() => setEdit(null)} />}
    </div>
  );
}

function ServiceSheet({ svc, api, onClose }) {
  const isNew = !svc.id;
  const [name, setName] = useState(svc.name || '');
  const [cat, setCat] = useState(svc.cat || 'Hair');
  const [dur, setDur] = useState(svc.dur || 30);
  const [price, setPrice] = useState(svc.price != null ? svc.price : 40);
  const [who, setWho] = useState(svc.who || []);
  const [online, setOnline] = useState(svc.online != null ? svc.online : true);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>{isNew ? 'New service' : name}</h3><p>Shows in the register, online booking and the calendar</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div>
            <span className="flab">Name</span>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cut & finish" />
          </div>
          <div className="fgrid">
            <div>
              <span className="flab">Category</span>
              <div className="chiprow">
                {['Hair', 'Colour', 'Barber', 'Care'].map((c) => (
                  <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="flab">Price</span>
              <div className="chiprow">
                {[1500, 3000, 5000, 12000, 25000].map((p) => (
                  <button key={p} className={'chip' + (price === p ? ' on' : '')} onClick={() => setPrice(p)}>{money(p)}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className="flab">Chair time</span>
            <div className="slots" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(70px,1fr))' }}>
              {[20, 30, 45, 60, 90, 150].map((d) => (
                <button key={d} className={'slot' + (dur === d ? ' on' : '')} onClick={() => setDur(d)}>{d} min</button>
              ))}
            </div>
          </div>
          <div>
            <span className="lbl">Who performs it</span>
            <div className="pickgrid" style={{ marginTop: 8, gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
              {SL.staff.filter((s) => !/Front desk/.test(s.role)).map((s) => (
                <button key={s.id} className={'pk' + (who.includes(s.id) ? ' on' : '')}
                  onClick={() => setWho(who.includes(s.id) ? who.filter((x) => x !== s.id) : [...who, s.id])}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Av s={s} size="sm" />
                  <div><div className="pk__n">{s.first}</div><div className="pk__m">{s.role}</div></div>
                </button>
              ))}
            </div>
          </div>
          <div className="trow2">
            <div className="trow2__ic"><ion-icon name="globe-outline"></ion-icon></div>
            <div style={{ flex: 1 }}><div className="trow2__t">Bookable online</div><div className="trow2__d">Clients can pick this service themselves</div></div>
            <button className={'sw2' + (online ? ' on' : '')} onClick={() => setOnline(!online)}></button>
          </div>
          <div className="sumbox">
            <div className="r"><span>{dur} min at {money(price)}</span><b>{money(price / dur * 60)} / hr</b></div>
            <div className="r"><span>Performed by</span><b>{who.length ? who.map((id) => staffOf(id).first).join(', ') : 'Nobody yet'}</b></div>
          </div>
        </div>
        <div className="sheet__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!name.trim() || !who.length} style={!name.trim() || !who.length ? { opacity: .45 } : null}
            onClick={() => { api.saveService({ id: svc.id, name: name.trim(), cat, dur, price, who, online, icon: svc.icon || 'cut-outline', book: svc.book || 0 }); onClose(); }}>
            {isNew ? 'Add service' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RegisterView, LineSheet, TenderSheet, ServicesView, ServiceSheet, ClientSheet });

function ClientSheet({ api, onClose }) {
  const [q, setQ] = useState('');
  const list = SL.clients.filter((c) => !q || c.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div><h3>Client</h3><p>Attach the ticket so the visit lands on their history</p></div>
          <div className="sp"></div>
          <button className="icbtn" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sheet__body">
          <div className="field"><ion-icon name="search-outline"></ion-icon>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or mobile" />
          </div>
          <div className="table">
            {list.map((c) => (
              <button className="trw" key={c} onClick={() => { api.pickClient(c); onClose(); }}>
                <div className="av pri">{c.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                <div><div className="nm">{c}</div><div className="mt">{c === 'Walk-in' ? 'No record kept' : 'Member · last visit 6 weeks ago'}</div></div>
                <div className="sp"></div>
                <ion-icon name="chevron-forward-outline" style={{ color: 'var(--kz-muted-3)' }}></ion-icon>
              </button>
            ))}
            {q && !list.length && (
              <button className="trw" onClick={() => { api.pickClient(q); onClose(); }}>
                <div className="av suc"><ion-icon name="person-add-outline"></ion-icon></div>
                <div><div className="nm">Add “{q}”</div><div className="mt">New client record</div></div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
