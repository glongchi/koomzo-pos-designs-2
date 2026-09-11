/* Koomzo MRP — planning run + materials coverage. */
const { useState: uS, useMemo: uM } = React;

function riskTone(r) { return r === 'high' ? 'bad' : r === 'watch' ? 'warn' : 'mute'; }

function PlanView({ caps, onOpenWo }) {
  const [tab, setTab] = uS('short');
  const [approved, setApproved] = uS({});
  const [ranAt, setRanAt] = uS(MRP_RUN.at);
  const [busy, setBusy] = uS(false);
  const [firm, setFirm] = uS(false);
  const [open, setOpen] = uS(null);

  const rows = MRP_RUN.short.filter((r) => (caps.import ? true : MR.part(r.p).src !== 'import'));
  const buys = rows.filter((r) => r.act === 'buy');
  const makes = rows.filter((r) => r.act === 'make');
  const demand = MRP_DEMAND.filter((d) => (firm ? d.firm : true));
  const buyVal = buys.reduce((s, r) => s + r.cost, 0);
  const makeVal = makes.reduce((s, r) => s + r.cost, 0);
  const atRisk = demand.filter((d) => d.days <= 14 && d.firm).reduce((s, d) => s + d.value, 0);
  const nApproved = Object.keys(approved).length;

  const run = () => { setBusy(true); setTimeout(() => { setBusy(false); setRanAt('Just now'); }, 900); };
  const approve = (k) => setApproved((a) => ({ ...a, [k]: true }));
  const approveAll = (list) => setApproved((a) => { const n = { ...a }; list.forEach((r) => { n[r.p] = true; }); return n; });

  const Row = ({ r }) => {
    const p = MR.part(r.p), sup = MR.sup(r.sup), on = open === r.p, ok = approved[r.p];
    const lead = r.act === 'buy' ? MR.lead(p) : Math.ceil(MR.opMinutes(p.bom || '') / 60);
    return (
      <>
        <button className={'planrow' + (on ? ' on' : '')} onClick={() => setOpen(on ? null : r.p)}>
          <span className="nm">
            <PartAv p={p} size={34} />
            <span style={{ minWidth: 0 }}>
              <span className="t">{p.name}</span>
              <span className="s">{p.code}<KindChip p={p} /></span>
            </span>
          </span>
          <span className="n r c-onh">{q(p.onHand, p.unit)}</span>
          <span className="n r c-alloc">{q(p.alloc, p.unit)}</span>
          <span className="n r c-inc">{p.incoming ? q(p.incoming, p.unit) : '—'}</span>
          <span className="n r gap">−{q(r.need - MR.avail(p) > 0 ? r.need - MR.avail(p) : r.need, p.unit)}</span>
          <span className="act">
            <St tone={riskTone(r.risk)}>{r.by}</St>
            {ok ? <span className="mini on"><Ico n="checkmark-outline" />{L('Sent')}</span>
              : <span className="mini pri" onClick={(e) => { e.stopPropagation(); approve(r.p); }}>
                  <Ico n={r.act === 'buy' ? 'cart-outline' : 'construct-outline'} />{r.act === 'buy' ? L('Buy') : L('Make')}</span>}
          </span>
          {on && <span className="why">{r.why}</span>}
        </button>
        {on && (
          <div style={{ padding: '13px 15px 15px 49px', background:'#fbfcfd', borderBottom:'1px solid var(--kz-border)' }}>
            <div className="numstrip" style={{ marginBottom: 12 }}>
              <Num k={L('Need by')} v={r.by} s={r.days + ' d'} />
              <Num k={r.act === 'buy' ? L('Supplier') : 'BOM'} v={r.act === 'buy' ? sup.name : MR.bom(r.bom).name} s={r.act === 'buy' ? sup.terms : 'rév. ' + MR.bom(r.bom).rev} />
              <Num k={L('Lead time')} v={lead + (r.act === 'buy' ? ' d' : ' h')} s={r.act === 'buy' && sup.buffer ? '+' + sup.buffer + ' d ' + L('Port buffer').toLowerCase() : (r.act === 'buy' ? L('Local') : L('Operations').toLowerCase())} tone={r.act === 'buy' && lead > r.days ? 'bad' : ''} />
              <Num k={L('Order qty')} v={q(r.qty, p.unit)} />
              <Num k="Value" v={xafBig(r.cost)} />
            </div>
            {r.act === 'buy' && lead > r.days && (
              <Hint icon="boat-outline" tone="pri">
                <b>{lead} {L('Lead time').toLowerCase()} vs {r.days} d to need date.</b> {sup.kind === 'import'
                  ? 'Landed lead time already carries a ' + sup.buffer + '-day Douala port buffer. Options: air-freight the gap, cut the batch, or substitute a local grade.'
                  : 'Split the order — take a part delivery now and the balance on the normal run.'}
              </Hint>
            )}
            {r.act === 'make' && (
              <div className="tree" style={{ marginTop: 2 }}>
                <div className="trow hd"><span>{L('Components')} — {q(r.qty, p.unit)}</span><span className="r">Need</span><span className="r c-avail">{L('Available')}</span><span className="r c-cost">Value</span></div>
                {MR.explode(r.bom, r.qty).slice(0, 6).map((ln, i) => (
                  <div className={'trow' + (ln.made ? ' made' : '')} key={i}>
                    <span className="lf">
                      {ln.depth > 0 && <span className="tdepth" style={{ paddingLeft: (ln.depth - 1) * 12 }}><Ico n="return-down-forward-outline" /></span>}
                      <span style={{ minWidth: 0 }}><span className="t">{ln.name}</span></span>
                      {ln.made && <span className="kchip wip">{L('Make')}</span>}
                    </span>
                    <span className="r">{q(ln.need, ln.unit)}</span>
                    <span className={'r c-avail' + (ln.avail < ln.need ? ' short' : '')}>{q(ln.avail, ln.unit)}</span>
                    <span className="r c-cost">{xafBig(ln.cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="scroll">
      <div className="secbar">
        <h3>{L('Planning board')}</h3>
        <span className="sub">{L('Last run')} · {ranAt} · {L('horizon')} {MRP_RUN.horizon} d</span>
        <span className="sp"></span>
        <button className="mini" onClick={() => setFirm((f) => !f)}>
          <Ico n={firm ? 'checkbox-outline' : 'square-outline'} />{L('Firm demand only')}
        </button>
        <button className="btn primary" onClick={run} disabled={busy}>
          <Ico n={busy ? 'sync-outline' : 'git-commit-outline'} />{busy ? '…' : L('Run plan')}
        </button>
      </div>

      <div className="numstrip" style={{ marginBottom: 14 }}>
        <Num k={L('Shortages')} v={rows.length} s={rows.filter((r) => r.risk === 'high').length + ' ' + L('critical')} tone="bad" />
        <Num k={L('Suggested purchases')} v={xafBig(buyVal)} s={buys.length + ' ' + L('lines')} />
        <Num k={L('Suggested work orders')} v={xafBig(makeVal)} s={makes.length + ' ' + L('jobs')} />
        <Num k={L('Demand at risk')} v={xafBig(atRisk)} s={L('firm, ≤ 14 d')} tone="bad" />
        <Num k={L('Capacity')} v={MRP_RUN.capacity.length} s={L('flags')} tone="warn" />
        <Num k={L('Approve')} v={nApproved} s={L('approved this run')} tone={nApproved ? 'good' : ''} />
      </div>

      {caps.capacity && MRP_RUN.capacity.map((c, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <Hint icon={c.over ? 'speedometer-outline' : 'build-outline'}>{c.note}</Hint>
        </div>
      ))}

      <div className="secbar" style={{ marginTop: 16 }}>
        <MiniSeg value={tab} onChange={setTab} tabs={[['short', L('Shortages'), rows.length], ['buy', L('Buy'), buys.length], ['make', L('Make'), makes.length], ['dem', L('Contracts'), demand.length]]} />
        <span className="sp"></span>
        {tab !== 'dem' && <button className="mini" onClick={() => approveAll(tab === 'buy' ? buys : tab === 'make' ? makes : rows)}><Ico n="checkmark-done-outline" />{L('Approve all')}</button>}
      </div>

      {tab === 'dem' ? (
        <div className="plan">
          <div className="planhd"><span>{L('Contracts')}</span><span className="r c-onh">Qty</span><span className="r c-alloc">Value</span><span className="r c-inc">Cover</span><span className="r">{L('Need by')}</span><span className="r">Status</span></div>
          {demand.map((d) => {
            const p = MR.part(d.p), cover = MR.avail(p);
            const ok = cover >= d.qty;
            return (
              <div className="planrow" key={d.id}>
                <span className="nm"><PartAv p={p} size={34} />
                  <span style={{ minWidth: 0 }}><span className="t">{d.ref} · {d.cust}</span><span className="s">{p.name} · {d.kind}</span></span></span>
                <span className="n r c-onh">{q(d.qty, d.unit)}</span>
                <span className="n r c-alloc">{xafBig(d.value)}</span>
                <span className={'n r c-inc' + (ok ? '' : ' gap')}>{q(cover, p.unit)}</span>
                <span className="n r">{d.due}</span>
                <span className="act">{d.firm ? <St tone={ok ? 'good' : 'bad'}>{ok ? 'Covered' : 'Short'}</St> : <St tone="mute">{L('Forecast')}</St>}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="plan">
          <div className="planhd">
            <span>{L('Part')}</span><span className="r c-onh">{L('On hand')}</span><span className="r c-alloc">{L('Allocated')}</span>
            <span className="r c-inc">{L('Incoming')}</span><span className="r">{L('Gap')}</span><span className="r">{L('Action')}</span>
          </div>
          {(tab === 'buy' ? buys : tab === 'make' ? makes : rows).map((r) => <Row key={r.p} r={r} />)}
        </div>
      )}

      <Hint icon="bulb-outline" tone="pri">
        <b>Why the run matters here.</b> Two thirds of a Douala plant's stockouts are lead-time, not demand: an
        import line is 40 days at sea plus a port buffer, while the same part is 12 days locally at a worse price.
        The run nets both against firm contracts so the buyer sees the decision, not the spreadsheet.
      </Hint>
    </div>
  );
}

function MaterialsView({ caps }) {
  const [kind, setKind] = uS('all');
  const [term, setTerm] = uS('');
  const [sel, setSel] = uS(null);

  const list = uM(() => MRP_PARTS.filter((p) => (kind === 'all' || p.kind === kind) &&
    (!term || (p.name + p.code).toLowerCase().includes(term.toLowerCase()))), [kind, term]);
  const p = sel ? MR.part(sel) : null;
  const counts = { all: MRP_PARTS.length, raw:0, wip:0, finished:0, packaging:0 };
  MRP_PARTS.forEach((x) => { counts[x.kind]++; });

  return (
    <div className="scroll">
      <div className="fbar">
        <div className="field"><Ico n="search-outline" /><input value={term} placeholder={L('Search') + '…'} onChange={(e) => setTerm(e.target.value)} /></div>
        <select className="sel" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">All parts ({counts.all})</option>
          <option value="raw">Raw material ({counts.raw})</option>
          <option value="wip">Work in progress ({counts.wip})</option>
          <option value="packaging">Packaging ({counts.packaging})</option>
          <option value="finished">Finished goods ({counts.finished})</option>
        </select>
      </div>

      <div className={'mdgrid' + (sel ? '' : ' solo')} style={sel ? undefined : { gridTemplateColumns: '1fr' }}>
        <div className="plan">
          <div className="planhd">
            <span>{L('Part')}</span><span className="r c-onh">{L('On hand')}</span><span className="r c-alloc">{L('Allocated')}</span>
            <span className="r c-inc">{L('Incoming')}</span><span className="r">{L('Available')}</span><span className="r">{L('Lead time')}</span>
          </div>
          {list.map((x) => {
            const s = MR.status(x), lead = MR.lead(x);
            return (
              <button className={'planrow' + (sel === x.id ? ' on' : '')} key={x.id} onClick={() => setSel(sel === x.id ? null : x.id)}>
                <span className="nm"><PartAv p={x} size={34} />
                  <span style={{ minWidth: 0 }}><span className="t">{x.name}</span><span className="s">{x.code}<KindChip p={x} /></span></span></span>
                <span className="n r c-onh">{q(x.onHand, x.unit)}</span>
                <span className="n r c-alloc">{q(x.alloc, x.unit)}</span>
                <span className="n r c-inc">{x.incoming ? q(x.incoming, x.unit) : '—'}</span>
                <span className={'n r' + (s === 'out' ? ' gap' : '')}>{q(MR.avail(x), x.unit)}</span>
                <span className="act">{x.bom ? <St tone="info" icon="construct-outline">{L('Make')}</St>
                  : <St tone={x.src === 'import' ? 'warn' : 'mute'}>{lead} d</St>}</span>
              </button>
            );
          })}
        </div>

        {p && (
          <aside className="mdpane overlay">
            <div className="mdpane__hd">
              <PartAv p={p} size={46} />
              <div style={{ minWidth: 0 }}><h3>{p.name}</h3><p>{p.code} · {p.unit}</p></div>
              <div className="sp"></div>
              <button className="mini ghost" onClick={() => setSel(null)}><Ico n="close-outline" /></button>
            </div>
            <div className="mdbd">
              <div className="numstrip">
                <Num k={L('On hand')} v={q(p.onHand, p.unit)} />
                <Num k={L('Available')} v={q(MR.avail(p), p.unit)} tone={MR.status(p) === 'out' ? 'bad' : MR.status(p) === 'low' ? '' : 'good'} />
                <Num k="Std cost" v={xaf(p.cost)} s={'per ' + p.unit} />
              </div>
              <div className="grp">
                <div className="grp__t">{p.bom ? L('Make') : 'Replenishment'}</div>
                {p.bom ? (
                  <>
                    <Kv k="BOM" v={MR.bom(p.bom).name + ' · rév ' + MR.bom(p.bom).rev} />
                    <Kv k={L('Yield')} v={pct(MR.bom(p.bom).yield)} num />
                    <Kv k={L('Operations')} v={MR.opMinutes(p.bom) + ' min / batch'} num />
                    <Kv k="Rolled cost" v={xaf(MR.bomCost(p.bom))} num />
                  </>
                ) : (
                  <>
                    <Kv k={L('Supplier')} v={MR.sup(p.sup).name} />
                    <Kv k={L('Lead time')} v={MR.sup(p.sup).lead + ' d'} num />
                    {caps.import && MR.sup(p.sup).buffer > 0 && <Kv k={L('Port buffer')} v={'+' + MR.sup(p.sup).buffer + ' d'} num />}
                    <Kv k="Planning lead" v={MR.lead(p) + ' d'} num />
                    <Kv k="Terms" v={MR.sup(p.sup).terms} />
                    <Kv k="Reorder / par" v={q(p.reorder, p.unit) + ' / ' + q(p.par, p.unit)} num />
                  </>
                )}
              </div>
              <div className="grp">
                <div className="grp__t">{L('Where used')}</div>
                {MRP_BOMS.filter((b) => b.lines.some((l) => l.p === p.id)).map((b) => {
                  const out = MR.part(b.out), ln = b.lines.find((l) => l.p === p.id);
                  return (
                    <div className="rcp" key={b.id}>
                      <div className="rcp__ic" style={{ background:(out.tint||MT.slate).bg, color:(out.tint||MT.slate).fg }}><Ico n={out.icon} /></div>
                      <div><div className="nm">{out.name}</div><div className="ds">{b.name} · rév {b.rev}</div></div>
                      <div className="sp"></div>
                      <div className="qt">{q(ln.qty, ln.unit)} / {q(b.qty, out.unit)}</div>
                    </div>
                  );
                })}
                {!MRP_BOMS.some((b) => b.lines.some((l) => l.p === p.id)) && <div className="tiny">Not a component of any BOM — this is an output.</div>}
              </div>
              {p.note && <Hint icon="information-circle-outline">{p.note}</Hint>}
              {caps.lots && p.lot && <Hint icon="pricetags-outline">Lot controlled. Every receipt and output carries a lot; traceability walks it both ways.</Hint>}
            </div>
            <div className="mdfoot">
              {p.bom ? <button className="btn primary"><Ico n="construct-outline" />{L('Make')}</button>
                : <button className="btn primary"><Ico n="cart-outline" />{L('Buy')}</button>}
              <button className="btn"><Ico n="stats-chart-outline" />History</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PlanView, MaterialsView });
