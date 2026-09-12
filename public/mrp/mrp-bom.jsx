/* Koomzo MRP — bills of material & routings. */
const { useState: bS } = React;

function BomView({ caps }) {
  const [sel, setSel] = bS('b6');
  const [pane, setPane] = bS(true);
  const [tab, setTab] = bS('comp');
  const b = MR.bom(sel), out = MR.part(b.out);
  const tree = MR.explode(b.id, b.qty);
  const rolled = MR.bomCost(b.id);
  const mins = MR.opMinutes(b.id);

  return (
    <div className="scroll">
      <div className="mdgrid wide" style={pane ? undefined : { gridTemplateColumns: '1fr' }}>
        <div className="stackcols">
          <div className="plan">
            <div className="planhd"><span>Output</span><span className="r c-onh">Batch</span><span className="r c-alloc">{L('Yield')}</span><span className="r c-inc">{L('Operations')}</span><span className="r">Cost / {'unit'}</span><span className="r">Rév</span></div>
            {MRP_BOMS.map((x) => {
              const o = MR.part(x.out);
              return (
                <button className={'planrow' + (sel === x.id ? ' on' : '')} key={x.id} onClick={() => { setSel(x.id); setPane(true); }}>
                  <span className="nm"><PartAv p={o} size={34} />
                    <span style={{ minWidth: 0 }}><span className="t">{o.name}</span>
                      <span className="s">{x.name}<span className={'kchip ' + (x.kind === 'process' ? 'wip' : 'finished')}>{x.kind === 'process' ? 'Process' : 'Pack'}</span></span></span></span>
                  <span className="n r c-onh">{x.batch}</span>
                  <span className={'n r c-alloc' + (x.yield < 0.9 ? ' gap' : '')}>{pct(x.yield)}</span>
                  <span className="n r c-inc">{MR.opMinutes(x.id)} min</span>
                  <span className="n r">{xaf(MR.bomCost(x.id))}</span>
                  <span className="act"><St tone="mute">{x.rev}</St></span>
                </button>
              );
            })}
          </div>
          <Hint icon="information-circle-outline">
            <b>Yield is the whole game in a process plant.</b> 1 000 kg of beans leaves as 800 kg of nibs and 180 kg of
            shell — so the BOM plans the input, not the output, and the co-product carries a credit against cost.
          </Hint>
        </div>

        {pane && <aside className="mdpane pushed">
          <div className="mdpane__hd">
            <PartAv p={out} size={46} />
            <div style={{ minWidth: 0 }}><h3>{out.name}</h3><p>{b.name} · rév {b.rev} · {b.batch}</p></div>
            <div className="sp"></div>
            <button className="mini ghost" onClick={() => setPane(false)}><Ico n="close-outline" /></button>
          </div>
          <div className="mdtabs">
            <button className={tab === 'comp' ? 'on' : ''} onClick={() => setTab('comp')}>{L('Components')}</button>
            {caps.routing && <button className={tab === 'ops' ? 'on' : ''} onClick={() => setTab('ops')}>{L('Routing')}</button>}
            <button className={tab === 'cost' ? 'on' : ''} onClick={() => setTab('cost')}>Cost roll-up</button>
          </div>
          <div className="mdbd">
            {tab === 'comp' && (
              <>
                <div className="numstrip">
                  <Num k="Output" v={q(b.qty, out.unit)} />
                  <Num k={L('Yield')} v={pct(b.yield)} tone={b.yield < 0.9 ? 'bad' : ''} />
                  <Num k={L('Operations')} v={mins + ' min'} />
                </div>
                <div className="tree">
                  <div className="trow hd"><span>Component</span><span className="r">Per batch</span><span className="r c-avail">{L('Available')}</span><span className="r c-cost">Value</span></div>
                  {tree.map((ln, i) => (
                    <div className={'trow' + (ln.made ? ' made' : '')} key={i}>
                      <span className="lf">
                        {ln.depth > 0 && <span className="tdepth" style={{ paddingLeft: (ln.depth - 1) * 12 }}><Ico n="return-down-forward-outline" /></span>}
                        <span style={{ minWidth: 0 }}><span className="t">{ln.name}</span><span className="c">{MR.part(ln.p).code}</span></span>
                        {ln.made && <span className="kchip wip">{L('Make')}</span>}
                        {MR.part(ln.p).src === 'import' && <span className="kchip import">{L('Import')}</span>}
                      </span>
                      <span className="r">{q(ln.need, ln.unit)}</span>
                      <span className={'r c-avail' + (ln.avail < ln.need ? ' short' : '')}>{q(ln.avail, ln.unit)}</span>
                      <span className="r c-cost">{xafBig(ln.cost)}</span>
                    </div>
                  ))}
                </div>
                {b.co && (
                  <div className="grp">
                    <div className="grp__t">{L('Co-products')}</div>
                    {b.co.map((c, i) => (
                      <div className="rcp" key={i}>
                        <div className="rcp__ic" style={{ background: MT.oak.bg, color: MT.oak.fg }}><Ico n="git-merge-outline" /></div>
                        <div><div className="nm">{c.name}</div><div className="ds">credit {xaf(c.value)} / {c.unit}</div></div>
                        <div className="sp"></div>
                        <div className="qt">{q(c.qty, c.unit)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'ops' && (
              <div className="ops">
                {(b.ops || []).map((o) => {
                  const wc = MR.wc(o.wc);
                  return (
                    <div className="op" key={o.n}>
                      <div className="op__n">{o.n}</div>
                      <div className="op__b">
                        <div className="op__t">{o.name}</div>
                        <div className="op__m"><span>{wc.name}</span><span>·</span><span>{wc.rate} {wc.unit}</span><span>·</span><span>setup {wc.setup} min</span></div>
                        {o.note && <div className="tiny" style={{ marginTop: 4 }}>{o.note}</div>}
                        {caps.quality && o.check && <div className="op__chk"><Ico n="checkmark-done-outline" />{o.check}</div>}
                      </div>
                      <div className="op__min">{o.min} min</div>
                    </div>
                  );
                })}
                <Kv k="Total run time" v={mins + ' min'} num />
                {caps.power && <Hint icon="flash-outline">Mill and roaster run on grid + generator, so this routing can be scheduled outside the {MRP_PLANT.gridHours} grid window at a higher energy cost.</Hint>}
              </div>
            )}

            {tab === 'cost' && (
              <>
                <div className="numstrip">
                  <Num k="Rolled cost" v={xaf(rolled)} s={'per ' + out.unit} />
                  <Num k="Std cost" v={xaf(out.cost)} s="on the part" />
                  <Num k="Delta" v={xaf(rolled - out.cost)} tone={rolled > out.cost ? 'bad' : 'good'} />
                </div>
                <div className="grp">
                  <div className="grp__t">Where the cost sits</div>
                  {b.lines.map((ln) => {
                    const p = MR.part(ln.p), gross = b.lines.reduce((s, l) => s + l.qty * MR.part(l.p).cost, 0);
                    const v = ln.qty * p.cost;
                    return (
                      <div className="hbar" key={ln.p} style={{ marginBottom: 7 }}>
                        <span className="nm">{p.name}</span>
                        <span className="track"><i style={{ width: Math.max(3, (v / gross) * 100) + '%' }}></i></span>
                        <span className="v">{xafBig(v)}</span>
                      </div>
                    );
                  })}
                </div>
                {b.co && <Hint icon="git-merge-outline">Co-product credit of {xafBig(b.co.reduce((s, c) => s + c.qty * (c.value || 0), 0))} is netted off before the unit cost — otherwise every press run looks unprofitable.</Hint>}
              </>
            )}
          </div>
          <div className="mdfoot">
            <button className="btn primary"><Ico n="construct-outline" />Create work order</button>
            <button className="btn"><Ico n="copy-outline" />New revision</button>
          </div>
        </aside>}
      </div>
    </div>
  );
}

Object.assign(window, { BomView });
