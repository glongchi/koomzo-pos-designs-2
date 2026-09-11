/* Koomzo MRP — job costing roll-up and the module's setup / tier picker. */
const { useState: cS } = React;

function CostsView({ caps }) {
  const [sel, setSel] = cS('OF-2418');
  const c = MR.cost(sel);
  const totals = MRP_COST.reduce((a, x) => {
    ['mat','lab','eng','ovh'].forEach((k) => { a.std[k] += x.std[k] * x.qty; a.act[k] += x.act[k] * x.qty; });
    return a;
  }, { std:{ mat:0, lab:0, eng:0, ovh:0 }, act:{ mat:0, lab:0, eng:0, ovh:0 } });
  const stdT = MR.sum(totals.std), actT = MR.sum(totals.act);

  return (
    <div className="scroll">
      <div className="numstrip" style={{ marginBottom: 14 }}>
        <Num k={'Std ' + L('Costs').toLowerCase()} v={xafBig(stdT)} s={MRP_COST.length + ' closed jobs'} />
        <Num k={L('Actual')} v={xafBig(actT)} tone={actT > stdT ? 'bad' : 'good'} />
        <Num k={L('Variance')} v={xafBig(actT - stdT)} s={pct(Math.abs(actT - stdT) / stdT) + ' of standard'} tone={actT > stdT ? 'bad' : 'good'} />
        <Num k={L('Energy')} v={xafBig(totals.act.eng)} s={'std ' + xafBig(totals.std.eng)} tone={totals.act.eng > totals.std.eng ? 'warn' : ''} />
        <Num k="Worst yield" v={pct(Math.min(...MRP_COST.map((x) => x.yieldAct)))} tone="warn" />
      </div>

      <div className="rowsplit">
        <div className="stackcols">
          <div className="plan">
            <div className="planhd"><span>Job</span><span className="r c-onh">Qty</span><span className="r c-alloc">{L('Standard')}</span><span className="r c-inc">{L('Actual')}</span><span className="r">{L('Variance')}</span><span className="r">{L('Yield')}</span></div>
            {MRP_COST.map((x) => {
              const p = MR.part(x.p), s = MR.sum(x.std), a = MR.sum(x.act), d = a - s;
              return (
                <button className={'planrow' + (sel === x.wo ? ' on' : '')} key={x.wo} onClick={() => setSel(x.wo)}>
                  <span className="nm"><PartAv p={p} size={34} />
                    <span style={{ minWidth: 0 }}><span className="t">{x.wo}</span><span className="s">{p.name}</span></span></span>
                  <span className="n r c-onh">{q(x.qty, p.unit)}</span>
                  <span className="n r c-alloc">{xaf(s)}</span>
                  <span className="n r c-inc">{xaf(a)}</span>
                  <span className={'n r' + (d > 0 ? ' gap' : '')}>{(d > 0 ? '+' : '') + xaf(d)}</span>
                  <span className="act"><St tone={x.yieldAct < x.yieldStd ? 'warn' : 'good'}>{pct(x.yieldAct)}</St></span>
                </button>
              );
            })}
          </div>
          <Hint icon="flash-outline">
            <b>Energy is a variance, not an overhead.</b> Generator hours cost ~38% more than grid hours, so a job that
            slipped into the afternoon window shows it here — the single clearest lever a Douala plant manager has.
          </Hint>
        </div>

        <div className="card">
          <div className="secbar"><h3>{sel}</h3><span className="sub">{MR.part(c.p).name}</span></div>
          <CostBlock c={c} />
        </div>
      </div>
    </div>
  );
}

function SetupView({ caps, mode, onMode, onCap, lang, onLang }) {
  const tiers = [
    { id:'off',  name:'Off',  desc:'No manufacturing. Items are bought and sold; POS and inventory only.', icon:'close-circle-outline' },
    { id:'lite', name:'Lite', desc:'Recipes and work orders. A bakery or soap workshop that just needs a build.', icon:'git-network-outline' },
    { id:'full', name:'Full', desc:'Planning run, routings, capacity, quality, traceability and job costing.', icon:'layers-outline' },
  ];
  return (
    <div className="scroll">
      <div className="secbar"><h3>Manufacturing control</h3><span className="sub">Same data model at every tier — nothing to migrate when a plant grows</span></div>
      <div className="cards" style={{ marginBottom: 18 }}>
        {tiers.map((t) => (
          <button className={'card' + (mode === t.id ? '' : '')} key={t.id} onClick={() => onMode(t.id)}
            style={{ textAlign:'left', borderColor: mode === t.id ? 'var(--kz-primary)' : undefined, boxShadow: mode === t.id ? '0 0 0 3px var(--kz-primary-wash)' : undefined }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div className="op-ic" style={{ background: mode === t.id ? 'var(--kz-primary-wash)' : undefined, color: mode === t.id ? 'var(--kz-primary)' : undefined }}><Ico n={t.icon} /></div>
              <div className="card__t">{t.name}</div>
              <div style={{ flex:1 }}></div>
              {mode === t.id && <St tone="pri">On</St>}
            </div>
            <div className="tiny">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="rowsplit">
        <div className="card">
          <div className="secbar"><h3>Capabilities</h3><span className="sub">{mode === 'off' ? 'Module off' : mode === 'lite' ? 'Lite fixes the first three' : 'Toggle any screen off'}</span></div>
          {MRP_CAPS.map((c) => {
            const locked = mode === 'off' || (mode === 'lite' && !MRP_LITE.includes(c.key));
            return (
              <div className="selrow" key={c.key} style={{ opacity: locked ? 0.5 : 1 }}>
                <div className="op-ic"><Ico n={c.icon} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font:'600 13px var(--kz-font-sans)' }}>{c.name}{c.always && <span className="kchip" style={{ marginLeft:7 }}>Core</span>}</div>
                  <div className="tiny">{c.desc}</div>
                </div>
                <div className="sp"></div>
                <Toggle on={!!caps[c.key]} onChange={() => !locked && !c.always && onCap(c.key)} />
              </div>
            );
          })}
        </div>

        <div className="stackcols">
          <div className="card">
            <div className="secbar"><h3>Plant</h3></div>
            <Kv k="Site" v={MRP_PLANT.name} />
            <Kv k="Location" v={MRP_PLANT.site} />
            <Kv k="Shifts" v={MRP_PLANT.shifts + ' × ' + MRP_PLANT.hoursPerShift + ' h'} num />
            <Kv k="Grid window" v={MRP_PLANT.gridHours} num />
            <Kv k={L('Generator')} v={MRP_PLANT.genHours} num />
            <Kv k="Currency" v="XAF · F CFA · no minor unit" />
            <Kv k="Default port buffer" v="18 d (Douala) · 14 d (Kribi)" num />
            <div className="selrow" style={{ borderBottom:'none' }}>
              <div className="op-ic"><Ico n="language-outline" /></div>
              <div><div style={{ font:'600 13px var(--kz-font-sans)' }}>Interface language</div><div className="tiny">Operators read French; head office reads English.</div></div>
              <div className="sp"></div>
              <div className="langsw">
                <button className={lang === 'en' ? 'on' : ''} onClick={() => onLang('en')}>EN</button>
                <button className={lang === 'fr' ? 'on' : ''} onClick={() => onLang('fr')}>FR</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="secbar"><h3>How this fits the rest of Koomzo</h3></div>
            <div className="flowmap">
              {[['Inventory owns the quantity', 'MRP never keeps a second stock number. A work order posts movements into the same stock card the store sees.'],
                ['A BOM is an Item with components', 'Finished goods are Items, so a spread jar can carry Show-in-POS and land on a register tile the day it is made.'],
                ['Purchasing is one queue', 'Suggested buys drop into the existing purchase-order screen — the buyer works one list, not two.'],
                ['Lots follow the sale', 'A POS return can be walked back to the batch and the bean delivery note.']].map(([t, d], i) => (
                <React.Fragment key={t}>
                  <div className="flowstep"><div className="flowstep__i">{i + 1}</div><div><div className="flowstep__t">{t}</div><div className="flowstep__d">{d}</div></div></div>
                  {i < 3 && <div className="flowline"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) { return <button className={'sw2' + (on ? ' on' : '')} onClick={onChange} aria-pressed={on}></button>; }

Object.assign(window, { CostsView, SetupView, Toggle });
