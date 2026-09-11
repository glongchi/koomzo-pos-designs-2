/* Koomzo MRP — work orders, capacity, quality & traceability. */
const { useState: wS, useMemo: wM } = React;

function OrdersView({ caps, orders, onPatch }) {
  const [filter, setFilter] = wS('open');
  const [sel, setSel] = wS(null);

  const open = orders.filter((o) => o.status !== 'done');
  const list = filter === 'all' ? orders : filter === 'open' ? open
    : filter === 'blocked' ? orders.filter((o) => o.status === 'blocked')
    : orders.filter((o) => o.status === 'done');
  const o = sel ? orders.find((x) => x.id === sel) : null;

  return (
    <div className="scroll">
      <div className="secbar">
        <MiniSeg value={filter} onChange={setFilter} tabs={[['open', 'Open', open.length], ['blocked', L('Blocked'), orders.filter((x) => x.status === 'blocked').length], ['done', L('Done'), orders.filter((x) => x.status === 'done').length], ['all', 'All', orders.length]]} />
        <span className="sp"></span>
        <button className="btn primary"><Ico n="add-outline" />New order</button>
      </div>

      <div className="numstrip" style={{ marginBottom: 14 }}>
        <Num k="Released" v={orders.filter((x) => ['released','progress','paused'].includes(x.status)).length} />
        <Num k={L('In progress')} v={orders.filter((x) => x.status === 'progress').length} tone="good" />
        <Num k={L('Blocked')} v={orders.filter((x) => x.status === 'blocked').length} tone="bad" />
        <Num k="Units due this week" v={q(open.reduce((s, x) => s + x.qty, 0))} />
        <Num k={L('Scrap')} v={q(orders.reduce((s, x) => s + x.scrap, 0))} s="units this month" tone="warn" />
      </div>

      <div className="mdgrid wide">
        <div className="wolist">
          {list.map((x) => {
            const b = MR.bom(x.bom), p = MR.part(b.out), wc = MR.wc(x.wc);
            return (
              <button className={'wo' + (sel === x.id ? ' on' : '')} key={x.id} onClick={() => setSel(x.id)}>
                <div className="wo__top">
                  <span className="wo__no">{x.no}</span>
                  {x.prio === 'high' && <St tone="warn" icon="flame-outline">Priority</St>}
                  <span className="wo__sp"></span>
                  <WoState o={x} />
                </div>
                <div>
                  <div className="wo__nm">{p.name}</div>
                  <div className="wo__mt"><span>{q(x.qty, p.unit)}</span><span className="sep">·</span><span>{wc.name}</span><span className="sep">·</span><span>due {x.due}</span>{caps.lots && x.lot !== '—' && <><span className="sep">·</span><span>{x.lot}</span></>}</div>
                </div>
                <Bar done={x.done} scrap={x.scrap} total={x.qty} tone={x.status === 'done' ? 'done' : ''} />
                <div className="wo__ft"><b>{q(x.done, p.unit)}</b> of {q(x.qty, p.unit)}
                  <span className="wo__sp"></span>{x.scrap ? <span style={{ color:'var(--kz-discount)' }}>{q(x.scrap)} {L('Scrap').toLowerCase()}</span> : <span>{pct(MR.woPct(x))}</span>}</div>
                {x.block && <div className="wo__blk"><Ico n="alert-circle-outline" />{x.block}</div>}
              </button>
            );
          })}
          {!list.length && <Blank icon="construct-outline" title="No orders here" sub="Change the filter or create one from a BOM." />}
        </div>

        {o && <WoPane o={o} caps={caps} onClose={() => setSel(null)} onPatch={onPatch} />}
      </div>
    </div>
  );
}

function WoPane({ o, caps, onClose, onPatch }) {
  const b = MR.bom(o.bom), p = MR.part(b.out), wc = MR.wc(o.wc);
  const [tab, setTab] = wS('prog');
  const checks = MRP_QC.filter((c) => c.wo === o.no);
  const cost = MR.cost(o.no);
  return (
    <aside className="mdpane overlay">
      <div className="mdpane__hd">
        <PartAv p={p} size={46} />
        <div style={{ minWidth: 0 }}><h3>{o.no}</h3><p>{p.name} · {q(o.qty, p.unit)}</p></div>
        <div className="sp"></div>
        <button className="mini ghost" onClick={onClose}><Ico n="close-outline" /></button>
      </div>
      <div className="mdtabs">
        <button className={tab === 'prog' ? 'on' : ''} onClick={() => setTab('prog')}>Progress</button>
        <button className={tab === 'mat' ? 'on' : ''} onClick={() => setTab('mat')}>{L('Material')}</button>
        {caps.quality && <button className={tab === 'qc' ? 'on' : ''} onClick={() => setTab('qc')}>{L('Quality')}{checks.length ? ' · ' + checks.length : ''}</button>}
        {caps.costing && cost && <button className={tab === 'cost' ? 'on' : ''} onClick={() => setTab('cost')}>{L('Costs')}</button>}
      </div>
      <div className="mdbd">
        {tab === 'prog' && (
          <>
            <div className="numstrip">
              <Num k={L('Output')} v={q(o.done, p.unit)} s={'of ' + q(o.qty, p.unit)} />
              <Num k={L('Scrap')} v={q(o.scrap, p.unit)} tone={o.scrap ? 'bad' : ''} />
              <Num k={L('Yield')} v={o.done ? pct(o.done / (o.done + o.scrap)) : '—'} />
            </div>
            <div><Bar done={o.done} scrap={o.scrap} total={o.qty} tone={o.status === 'done' ? 'done' : ''} /></div>
            {o.block && <Hint icon="alert-circle-outline" tone="pri"><b>{L('Blocked')}.</b> {o.block} — release the upstream job or short-pick with a supervisor override.</Hint>}
            {o.steps && (
              <div className="ops">
                {o.steps.map((s) => (
                  <div className="op" key={s.n}>
                    <div className="op__n" style={s.state === 'done' ? { background:'var(--kz-success-wash)', color:'var(--kz-success)' } : s.state === 'run' ? undefined : { background:'var(--kz-surface-2)', color:'var(--kz-muted-3)' }}>
                      {s.state === 'done' ? <Ico n="checkmark-outline" /> : s.n}
                    </div>
                    <div className="op__b">
                      <div className="op__t">{s.name}</div>
                      <div className="op__m"><span>{MR.wc(s.wc).name}</span>{s.out ? <><span>·</span><span>{q(s.out, p.unit)} out</span></> : null}</div>
                    </div>
                    <div className="op__min">{s.state === 'run' ? <St tone="pri" live>{L('In progress')}</St> : s.state === 'done' ? <St tone="good">{L('Done')}</St> : <St tone="mute">Wait</St>}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="grp">
              <div className="grp__t">Order</div>
              <Kv k={L('Operator')} v={o.op} />
              <Kv k={L('Machine')} v={wc.name} />
              <Kv k="Due" v={o.due} />
              {caps.lots && <Kv k={L('Lot')} v={o.lot} num />}
              <Kv k="BOM" v={b.name + ' · rév ' + b.rev} />
            </div>
          </>
        )}

        {tab === 'mat' && (
          <div className="tree">
            <div className="trow hd"><span>Component</span><span className="r">Required</span><span className="r c-avail">{L('Available')}</span><span className="r c-cost">Value</span></div>
            {MR.explode(o.bom, o.qty).map((ln, i) => (
              <div className={'trow' + (ln.made ? ' made' : '')} key={i}>
                <span className="lf">
                  {ln.depth > 0 && <span className="tdepth" style={{ paddingLeft: (ln.depth - 1) * 12 }}><Ico n="return-down-forward-outline" /></span>}
                  <span style={{ minWidth: 0 }}><span className="t">{ln.name}</span></span>
                  {ln.avail < ln.need && <span className="kchip import">{L('Material short')}</span>}
                </span>
                <span className="r">{q(ln.need, ln.unit)}</span>
                <span className={'r c-avail' + (ln.avail < ln.need ? ' short' : '')}>{q(ln.avail, ln.unit)}</span>
                <span className="r c-cost">{xafBig(ln.cost)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'qc' && (
          <>
            {checks.length ? checks.map((c) => (
              <div className="gnode" key={c.id}>
                <div className="op-ic" style={c.state === 'pass' ? { background:'var(--kz-success-wash)', color:'var(--kz-success)' } : { background:'var(--kz-discount-wash)', color:'var(--kz-discount)' }}>
                  <Ico n={c.state === 'pass' ? 'checkmark-outline' : 'close-outline'} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="lot" style={{ fontFamily:'var(--kz-font-sans)' }}>{c.check}</div>
                  <div className="mt">{c.spec} → <b>{c.val}</b> · {c.at} · {c.by}</div>
                  {c.act && <div className="tiny" style={{ marginTop: 4 }}>{c.act}</div>}
                </div>
                <div className="sp"></div>
                <St tone={c.state === 'pass' ? 'good' : 'bad'}>{c.state === 'pass' ? L('Pass') : L('Fail')}</St>
              </div>
            )) : <Blank icon="checkmark-done-outline" title="No checks logged" sub="Checkpoints appear as each operation closes." />}
          </>
        )}

        {tab === 'cost' && cost && <CostBlock c={cost} />}
      </div>
      <div className="mdfoot">
        {o.status === 'progress' ? <button className="btn" onClick={() => onPatch(o.id, { status:'paused' })}><Ico n="pause-outline" />{L('Pause')}</button>
          : o.status === 'done' ? <button className="btn"><Ico n="document-text-outline" />Report</button>
          : <button className="btn primary" onClick={() => onPatch(o.id, { status:'progress', start:'now' })}><Ico n="play-outline" />{L('Start')}</button>}
        {o.status !== 'done' && <button className="btn primary" onClick={() => onPatch(o.id, { status:'done', done:o.qty })}><Ico n="checkmark-outline" />{L('Finish')}</button>}
      </div>
    </aside>
  );
}

function CostBlock({ c }) {
  const p = MR.part(c.p), stdT = MR.sum(c.std), actT = MR.sum(c.act);
  const seg = (o, k) => (MR.sum(o) ? (o[k] / MR.sum(o)) * 100 : 0);
  const rows = [['mat', L('Material')], ['lab', L('Labour')], ['eng', L('Energy')], ['ovh', L('Overhead')]];
  return (
    <>
      <div className="numstrip">
        <Num k={L('Standard')} v={xaf(stdT)} s={'per ' + p.unit} />
        <Num k={L('Actual')} v={xaf(actT)} s={'per ' + p.unit} tone={actT > stdT ? 'bad' : 'good'} />
        <Num k={L('Variance')} v={xaf(actT - stdT)} tone={actT > stdT ? 'bad' : 'good'} />
      </div>
      <div>
        <div className="stack">
          {rows.map(([k]) => <i key={k} className={k} style={{ width: seg(c.act, k) + '%' }}></i>)}
        </div>
        <div className="legend">
          <span><i style={{ background:'var(--kz-primary)' }}></i>{L('Material')}</span>
          <span><i style={{ background:'#8f88d4' }}></i>{L('Labour')}</span>
          <span><i style={{ background:'var(--kz-warning)' }}></i>{L('Energy')}</span>
          <span><i style={{ background:'var(--kz-border-strong)' }}></i>{L('Overhead')}</span>
        </div>
      </div>
      <div>
        <div className="vrow hd"><span>Element</span><span className="r">{L('Standard')}</span><span className="r">{L('Actual')}</span><span className="r c-var">{L('Variance')}</span></div>
        {rows.map(([k, label]) => {
          const d = c.act[k] - c.std[k];
          return (
            <div className="vrow" key={k}>
              <span className="k">{label}</span>
              <span className="r">{xaf(c.std[k])}</span>
              <span className="r">{xaf(c.act[k])}</span>
              <span className={'r c-var ' + (d > 0 ? 'up' : d < 0 ? 'dn' : '')}>{d ? xaf(d) : '—'}</span>
            </div>
          );
        })}
        <div className="vrow"><span className="k" style={{ fontWeight:700 }}>{L('Yield')}</span><span className="r">{pct(c.yieldStd)}</span>
          <span className="r">{pct(c.yieldAct)}</span>
          <span className={'r c-var ' + (c.yieldAct < c.yieldStd ? 'up' : 'dn')}>{(c.yieldAct - c.yieldStd >= 0 ? '+' : '') + ((c.yieldAct - c.yieldStd) * 100).toFixed(1)} pt</span></div>
      </div>
      {c.note && <Hint icon="information-circle-outline">{c.note}</Hint>}
    </>
  );
}

function CapacityView({ caps }) {
  const hottest = [...MRP_WC].sort((a, b) => b.load - a.load)[0];
  return (
    <div className="scroll">
      <div className="numstrip" style={{ marginBottom: 14 }}>
        <Num k="Centres" v={MRP_WC.length} s={MRP_WC.filter((c) => c.down).length + ' down'} />
        <Num k="Bottleneck" v={hottest.code} s={pct(hottest.load) + ' load'} tone="warn" />
        <Num k="Shifts" v={MRP_PLANT.shifts + ' × ' + MRP_PLANT.hoursPerShift + ' h'} />
        <Num k="Grid window" v={MRP_PLANT.gridHours} s="tariff hours" />
        <Num k={L('Generator')} v={MRP_PLANT.genHours} s="+38% energy cost" tone="warn" />
      </div>

      {caps.power && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="secbar"><h3>Day shape</h3><span className="sub">Grid first, generator second, cold overnight</span></div>
          <div className="daystrip">
            {['06','07','08','09','10','11','12','13'].map((h) => <span className="g" key={h}>{h}</span>)}
            {['14','15','16','17','18','19','20','21'].map((h) => <span className="n" key={h}>{h}</span>)}
            {['22','23','00'].map((h) => <span className="x" key={h}>{h}</span>)}
          </div>
          <div className="legend"><span><i style={{ background:'#dbe8fb' }}></i>Grid</span><span><i style={{ background:'#fbf2dd' }}></i>{L('Generator')}</span><span><i style={{ background:'var(--kz-surface-2)' }}></i>Idle</span></div>
          <div className="tiny" style={{ marginTop: 9 }}>The planner schedules the mill and roaster inside the grid window; press and packing tolerate generator hours. Energy variance lands on the job, not a monthly overhead pool.</div>
        </div>
      )}

      <div className="caps">
        {MRP_WC.map((c) => {
          const load = c.down ? 0 : c.load;
          return (
            <div className="cap" key={c.id}>
              <div className="cap__hd">
                <div className="op-ic" style={{ background: c.down ? 'var(--kz-discount-wash)' : 'var(--kz-primary-wash)', color: c.down ? 'var(--kz-discount)' : 'var(--kz-primary)' }}><Ico n={c.icon} /></div>
                <div><div className="cap__nm">{c.name}</div><div className="cap__cd">{c.code} · {c.rate} {c.unit}</div></div>
                <div className="cap__sp"></div>
                {c.down ? <St tone="bad" icon="build-outline">Down</St> : <St tone={load > 0.9 ? 'warn' : 'mute'}>{pct(load)}</St>}
              </div>
              <Gauge v={load} mark={0.85} />
              <div className="cap__rows">
                <div className="cap__r"><span>{L('Load')} today</span><b>{c.down ? '—' : Math.round(load * c.hours) + ' / ' + c.hours + ' h'}</b></div>
                <div className="cap__r"><span>Changeover</span><b>{c.setup} min</b></div>
                <div className="cap__r"><span>Crew</span><b>{c.staff}</b></div>
              </div>
              <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
                <PowerChip mode={c.power} />
                {c.note && <span className="tiny" style={{ flex:1, minWidth: 120 }}>{c.note}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QualityView({ caps }) {
  const [tab, setTab] = wS(caps.quality ? 'checks' : 'trace');
  const [lot, setLot] = wS('SPR-2408-11');
  const fails = MRP_QC.filter((c) => c.state === 'fail');
  const node = MR.lot(lot);

  return (
    <div className="scroll">
      <div className="secbar">
        <MiniSeg value={tab} onChange={setTab} tabs={[...(caps.quality ? [['checks', L('Check') + 's', MRP_QC.length]] : []), ...(caps.trace ? [['trace', L('Traceability')]] : [])]} />
        <span className="sp"></span>
        {tab === 'checks' && <St tone={fails.length ? 'bad' : 'good'}>{fails.length} {L('Fail').toLowerCase()}</St>}
      </div>

      {tab === 'checks' ? (
        <div className="stackcols">
          <div className="numstrip">
            <Num k="Checks logged" v={MRP_QC.length} s="last 7 days" />
            <Num k="First-pass rate" v={pct((MRP_QC.length - fails.length) / MRP_QC.length)} tone={fails.length > 1 ? 'warn' : 'good'} />
            <Num k="Open non-conformities" v={fails.length} tone="bad" />
            <Num k="Lots held" v="1" s="LIQ-2408-14 re-milled" />
          </div>
          <div className="plan">
            {MRP_QC.map((c) => (
              <div className="planrow" key={c.id} style={{ gridTemplateColumns:'minmax(200px,2fr) 120px 110px 120px', cursor:'default' }}>
                <span className="nm">
                  <div className="op-ic" style={c.state === 'pass' ? { background:'var(--kz-success-wash)', color:'var(--kz-success)' } : { background:'var(--kz-discount-wash)', color:'var(--kz-discount)' }}>
                    <Ico n={c.state === 'pass' ? 'checkmark-outline' : 'close-outline'} /></div>
                  <span style={{ minWidth: 0 }}><span className="t">{c.check}</span><span className="s">{c.wo} · {c.lot} · {c.by}</span></span>
                </span>
                <span className="n r">{c.spec}</span>
                <span className="n r">{c.val}</span>
                <span className="act"><St tone={c.state === 'pass' ? 'good' : 'bad'}>{c.state === 'pass' ? L('Pass') : L('Fail')}</St></span>
                {c.act && <span className="why">{c.act}</span>}
              </div>
            ))}
          </div>
          <Hint icon="checkmark-done-outline">A failed check holds the lot: the next operation cannot be started on the floor phone until a supervisor releases or reworks it.</Hint>
        </div>
      ) : (
        <div className="rowsplit">
          <div className="card">
            <div className="secbar"><h3>{L('Genealogy')}</h3><span className="sub">{lot}</span></div>
            {node ? (
              <div className="gene">
                {(node.src || []).map((s) => {
                  const sn = MR.lot(s);
                  return (
                    <div key={s}>
                      <div className="gnode">
                        <div className="op-ic"><Ico n={sn ? MR.part(sn.p).icon : 'cube-outline'} /></div>
                        <div><div className="lot">{s}</div><div className="mt">{sn ? MR.part(sn.p).name + ' · ' + q(sn.qty, sn.unit) + ' · ' + sn.from : 'Received lot'}</div></div>
                        <div className="sp"></div>
                        <button className="mini ghost" onClick={() => sn && setLot(s)}><Ico n="chevron-forward-outline" /></button>
                      </div>
                      <div className="glink"><Ico n="arrow-down-outline" />consumed into</div>
                    </div>
                  );
                })}
                <div className="gnode here">
                  <PartAv p={MR.part(node.p)} size={34} />
                  <div><div className="lot">{node.lot}</div><div className="mt">{MR.part(node.p).name} · {q(node.qty, node.unit)} · {node.from} · {node.at}</div></div>
                  <div className="sp"></div>
                  <St tone="pri">Here</St>
                </div>
                {(node.into || []).length > 0 && <div className="glink"><Ico n="arrow-down-outline" />issued to</div>}
                <div className="gind">
                  {(node.into || []).map((t) => {
                    const tn = MR.lot(t);
                    return (
                      <div className="gnode" key={t} style={{ marginBottom: 8 }}>
                        <div className="op-ic"><Ico n={tn ? MR.part(tn.p).icon : 'exit-outline'} /></div>
                        <div><div className="lot">{t}</div><div className="mt">{tn ? MR.part(tn.p).name + ' · ' + q(tn.qty, tn.unit) : 'Shipped on ' + t}</div></div>
                        <div className="sp"></div>
                        {tn && <button className="mini ghost" onClick={() => setLot(t)}><Ico n="chevron-forward-outline" /></button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <Blank icon="git-branch-outline" title="Unknown lot" sub="Pick a lot from the list." />}
          </div>
          <div className="stackcols">
            <div className="card">
              <div className="secbar"><h3>Lots</h3></div>
              {MRP_LOTS.map((l) => (
                <button className="flrow" key={l.id} onClick={() => setLot(l.lot)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', borderBottom:'1px solid var(--kz-border)' }}>
                  <PartAv p={MR.part(l.p)} size={32} />
                  <div style={{ minWidth: 0 }}><div className="nm">{l.lot}</div><div className="mt">{MR.part(l.p).name} · {l.at}</div></div>
                  <div className="sp"></div>
                  <div className="n">{q(l.qty, l.unit)}</div>
                </button>
              ))}
            </div>
            <Hint icon="shield-checkmark-outline">
              <b>Recall in one move.</b> Pick a finished lot and the tree walks back to the bean delivery note, or forward
              to the customer orders it shipped on — the record an export buyer and a food-safety audit both ask for.
            </Hint>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { OrdersView, WoPane, CostBlock, CapacityView, QualityView });
