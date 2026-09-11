/* Koomzo MRP — shop floor. Phone first: one job, one number, big targets.
   Works offline; every action lands in a queue that drains when the line returns. */
const { useState: fS } = React;

function FloorView({ standalone }) {
  const [tab, setTab] = fS('jobs');
  const [queue, setQueue] = fS(2);
  const [online, setOnline] = fS(true);
  const [jobs, setJobs] = fS(MRP_FLOOR_QUEUE);
  const [active, setActive] = fS('OF-2418');
  const [entry, setEntry] = fS('');
  const [scrapMode, setScrapMode] = fS(false);
  const [toast, setToast] = fS(null);

  const job = jobs.find((j) => j.wo === active) || jobs[0];
  const bump = (n) => setQueue((x) => (online ? x : x + n));
  const push = (msg) => { setToast(msg); setQueue((x) => x + 1); setTimeout(() => setToast(null), 2200); };

  const patch = (wo, fn) => setJobs((cur) => cur.map((j) => (j.wo === wo ? { ...j, ...fn(j) } : j)));
  const commit = () => {
    const n = +entry || 0; if (!n) return;
    patch(job.wo, (j) => (scrapMode ? { scrap: (j.scrap || 0) + n } : { done: j.done + n }));
    setEntry(''); push((scrapMode ? 'Scrap ' : 'Output ') + q(n) + ' logged on ' + job.wo);
    setTab('jobs');
  };
  const key = (k) => setEntry((e) => (k === 'del' ? e.slice(0, -1) : k === 'c' ? '' : (e + k).slice(0, 6)));

  const wc = MR.wc(job ? job.wc : 'c8');

  return (
    <div className="fl">
      <div className="fl__top">
        <div className="op-ic" style={{ background:'var(--kz-primary-wash)', color:'var(--kz-primary)', width:38, height:38 }}><Ico n="person-outline" /></div>
        <div className="fl__id">Ekani Josué<small>{wc.name} · {L('Shift')} 1</small></div>
        <div className="fl__sp"></div>
        <SyncChip state={online ? 'on' : 'off'} queued={queue} onClick={() => { setOnline((o) => !o); if (!online) setQueue(0); }} />
      </div>

      <div className="fl__bd">
        {queue > 0 && (
          <div className="qbanner">
            <Ico n={online ? 'cloud-upload-outline' : 'cloud-offline-outline'} />
            <div className="sp">{online ? <><b>{queue}</b> {L('Queued').toLowerCase()} — uploading now.</> : <><b>{queue}</b> actions held on this phone. Keep working; they post when the line returns.</>}</div>
            {online && <button className="btn" onClick={() => setQueue(0)}>Sync</button>}
          </div>
        )}

        {tab === 'jobs' && jobs.map((j) => {
          const b = MR.bom(MR.wo(j.wo) ? MR.wo(j.wo).bom : 'b6'), p = MR.part(b.out);
          const on = j.wo === active;
          return (
            <div className={'jc' + (j.state === 'run' ? ' run' : j.state === 'blocked' ? ' blocked' : '')} key={j.wo}>
              <div className="jc__hd">
                <div style={{ minWidth: 0 }}>
                  <div className="jc__no">{j.wo}</div>
                  <div className="jc__st">{j.step} · {MR.wc(j.wc).name}</div>
                </div>
                <div className="jc__sp"></div>
                {j.state === 'run' ? <St tone="pri" live>{L('In progress')}</St> : j.state === 'blocked' ? <St tone="bad" icon="alert-circle-outline">{L('Blocked')}</St> : <St tone="info">{L('Released')}</St>}
              </div>

              {j.state === 'blocked' ? (
                <>
                  <div className="wo__blk"><Ico n="alert-circle-outline" />{j.block}</div>
                  <div className="jc__acts"><button className="fbtn wide warn" onClick={() => push('Supervisor called for ' + j.wo)}><Ico n="megaphone-outline" />Call supervisor</button></div>
                </>
              ) : (
                <>
                  <div className="big"><b>{q(j.done)}</b><span>/ {q(j.target, p.unit)} {L('Output').toLowerCase()}</span></div>
                  <Bar done={j.done} scrap={j.scrap || 0} total={j.target} />
                  <div className="jc__acts">
                    {j.state === 'run'
                      ? <button className="fbtn" onClick={() => { patch(j.wo, () => ({ state:'paused' })); push(j.wo + ' paused'); }}><Ico n="pause-outline" />{L('Pause')}</button>
                      : <button className="fbtn go" onClick={() => { patch(j.wo, () => ({ state:'run', since:'now' })); setActive(j.wo); push(j.wo + ' started'); }}><Ico n="play-outline" />{j.state === 'paused' ? L('Resume') : L('Start')}</button>}
                    <button className="fbtn pri" onClick={() => { setActive(j.wo); setScrapMode(false); setTab('log'); }}><Ico n="keypad-outline" />{L('Log output')}</button>
                    {j.done >= j.target && <button className="fbtn wide go" onClick={() => { patch(j.wo, () => ({ state:'done' })); push(j.wo + ' finished'); }}><Ico n="checkmark-done-outline" />{L('Finish')}</button>}
                  </div>
                  {j.since && j.state === 'run' && <div className="tiny">Running since {j.since} · {q(j.scrap || 0)} {L('Scrap').toLowerCase()}</div>}
                </>
              )}
            </div>
          );
        })}

        {tab === 'log' && job && (
          <>
            <div className="jc">
              <div className="jc__hd">
                <div><div className="jc__no">{job.wo}</div><div className="jc__st">{job.step}</div></div>
                <div className="jc__sp"></div>
                <MiniSeg value={scrapMode ? 'scrap' : 'out'} onChange={(v) => setScrapMode(v === 'scrap')} tabs={[['out', L('Output')], ['scrap', L('Scrap')]]} />
              </div>
              <div className="readout">
                <div className="lb">{scrapMode ? L('Scrap') : L('Output')} — {MR.part(MR.bom(MR.wo(job.wo) ? MR.wo(job.wo).bom : 'b6').out).unit}</div>
                <div className="vv">{entry ? q(+entry) : '0'}<small>{scrapMode ? 'rebut' : 'this log'}</small></div>
              </div>
              <div className="pad">
                {['1','2','3','4','5','6','7','8','9'].map((k) => <button key={k} onClick={() => key(k)}>{k}</button>)}
                <button className="alt" onClick={() => key('c')}>C</button>
                <button onClick={() => key('0')}>0</button>
                <button className="alt" onClick={() => key('del')}>⌫</button>
              </div>
              <div className="jc__acts">
                <button className="fbtn" onClick={() => setTab('jobs')}>Cancel</button>
                <button className="fbtn pri" disabled={!entry} onClick={commit}><Ico n="checkmark-outline" />Post</button>
              </div>
              <div className="tiny">Posting works offline. The lot ({MR.wo(job.wo) ? MR.wo(job.wo).lot : '—'}) is stamped on the phone, not the server, so the record survives a dropped line.</div>
            </div>
          </>
        )}

        {tab === 'qc' && (
          <>
            <div className="jc">
              <div className="jc__hd"><div><div className="jc__no">{L('Check')}</div><div className="jc__st">{job ? job.wo + ' · ' + job.step : ''}</div></div></div>
              {[['Net weight 500 g ± 4 g', '496–504 g'], ['Seal integrity', 'Visual'], ['Lot code legible', 'Visual']].map(([c, s]) => (
                <div className="flrow" key={c}>
                  <div style={{ minWidth: 0 }}><div className="nm">{c}</div><div className="mt">{s}</div></div>
                  <div className="sp"></div>
                  <div style={{ display:'flex', gap:7 }}>
                    <button className="mini" onClick={() => push(c + ' — ' + L('Pass'))} style={{ height:38, minWidth:56, justifyContent:'center' }}><Ico n="checkmark-outline" /></button>
                    <button className="mini" onClick={() => push(c + ' — ' + L('Fail'))} style={{ height:38, minWidth:56, justifyContent:'center', color:'var(--kz-discount)' }}><Ico n="close-outline" /></button>
                  </div>
                </div>
              ))}
            </div>
            {MRP_QC.slice(0, 3).map((c) => (
              <div className="jc" key={c.id} style={{ padding:13, gap:8 }}>
                <div className="flrow" style={{ borderBottom:'none', padding:0 }}>
                  <div className="op-ic" style={c.state === 'pass' ? { background:'var(--kz-success-wash)', color:'var(--kz-success)' } : { background:'var(--kz-discount-wash)', color:'var(--kz-discount)' }}>
                    <Ico n={c.state === 'pass' ? 'checkmark-outline' : 'close-outline'} /></div>
                  <div style={{ minWidth: 0 }}><div className="nm">{c.check}</div><div className="mt">{c.val} · {c.wo} · {c.at}</div></div>
                  <div className="sp"></div>
                  <St tone={c.state === 'pass' ? 'good' : 'bad'}>{c.state === 'pass' ? L('Pass') : L('Fail')}</St>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'mat' && job && (
          <div className="jc">
            <div className="jc__hd"><div><div className="jc__no">{L('Material')}</div><div className="jc__st">{job.wo} · pick list</div></div></div>
            {MR.explode(MR.wo(job.wo) ? MR.wo(job.wo).bom : 'b6', job.target).filter((l) => !l.made).slice(0, 6).map((ln, i) => (
              <div className="flrow" key={i}>
                <PartAv p={MR.part(ln.p)} size={34} />
                <div style={{ minWidth: 0 }}><div className="nm">{ln.name}</div><div className="mt">{q(ln.need, ln.unit)} required · {q(ln.avail, ln.unit)} {L('Available').toLowerCase()}</div></div>
                <div className="sp"></div>
                {ln.avail < ln.need ? <St tone="bad">Short</St>
                  : <button className="mini" onClick={() => push('Picked ' + ln.name)} style={{ height:38 }}><Ico n="cube-outline" />Pick</button>}
              </div>
            ))}
            <div className="tiny">Scan replaces this list on a rugged handset; the layout is the same either way.</div>
          </div>
        )}

        {toast && (
          <div className="qbanner" style={{ background:'var(--kz-success-wash)', borderColor:'#bfe4cd', color:'#1f7a45' }}>
            <Ico n="checkmark-circle-outline" style={{ color:'#2e9e5b' }} /><div className="sp">{toast}</div>
          </div>
        )}
      </div>

      <div className="fltabs">
        {[['jobs','Jobs','construct-outline'], ['log', L('Log output'), 'keypad-outline'], ['mat', L('Material'), 'cube-outline'], ['qc', L('Quality'), 'checkmark-done-outline']].map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><Ico n={icon} /><span>{label}</span></button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { FloorView });
