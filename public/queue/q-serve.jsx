/* Koomzo Queue — Serve console (one lane), Intake, Supervise. */

function ServeView({ q, api }) {
  const [laneId, setLaneId] = useState(q.lanes[0].id);
  const lane = q.lanes.find((l) => l.id === laneId) || q.lanes[0];
  const mine = q.items.find((x) => x.lane === lane.id && (x.state === 'called' || x.state === 'serving'));
  const cat = mine ? q.cats.find((c) => c.id === mine.cat) : null;
  const allowed = q.items.filter((x) => x.state === 'waiting' && lane.serves.includes(x.cat))
    .sort((a, b) => (b.pri - a.pri) || (a.created - b.created));
  const others = q.items.filter((x) => x.state === 'waiting' && !lane.serves.includes(x.cat)).length;
  const doneToday = q.items.filter((x) => x.state === 'done' && x.lane === lane.id).length;
  const avgHandle = 11;

  return (
    <div>
      <div className="rowbar">
        <div className="lanepick" style={{ flex: 1 }}>
          {q.lanes.map((l) => {
            const w = q.items.filter((x) => x.state === 'waiting' && l.serves.includes(x.cat)).length;
            return (
              <button key={l.id} className={'lp' + (l.id === laneId ? ' on' : '')} onClick={() => setLaneId(l.id)}>
                <div className="lp__n">{l.name}</div>
                <div className="lp__m">{l.state === 'open' ? w + ' can be served' : l.state === 'paused' ? 'Paused' : 'Closed'}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="qsplit">
        <div className="serve">
          <div className="serve__hd">
            <div className="serve__ln">{lane.name}<small>{q.preset.laneTerm} · serves {lane.serves.map((c) => q.cats.find((x) => x.id === c).code).join(' · ')}</small></div>
            <div className="sp" style={{ flex: 1 }}></div>
            <span className={'badge ' + (lane.state === 'open' ? 'ok' : 'wrn')}>{lane.state === 'open' ? 'Open' : lane.state === 'paused' ? 'Paused' : 'Closed'}</span>
            <button className="sbtn" onClick={() => api.toggleLane(lane.id)}>
              <ion-icon name={lane.state === 'open' ? 'pause-outline' : 'play-outline'}></ion-icon>
              {lane.state === 'open' ? 'Pause' : 'Resume'}
            </button>
          </div>

          <div className={'nowcard' + (!mine ? ' idle' : mine.state === 'called' ? ' wait' : '')}>
            {mine ? (
              <>
                <span className="k">{mine.state === 'called' ? 'Called — waiting to arrive' : 'Serving now'}</span>
                <span className="n">{mine.num}</span>
                <span className="w">{cat.name}{mine.label ? ' · ' + mine.label : ''}</span>
                <span className="t">
                  {mine.state === 'serving'
                    ? 'Started ' + qfmt(mine.started) + ' · ' + (QD.now - mine.started) + ' min in · usually ' + cat.dur + ' min'
                    : 'Called ' + qfmt(mine.called) + ' · waited ' + (mine.called - mine.created) + ' min'}
                </span>
              </>
            ) : (
              <>
                <span className="k">{lane.name}</span>
                <span className="idlemsg">{allowed.length ? allowed.length + ' waiting for this ' + q.preset.laneTerm.toLowerCase() : 'Nobody waiting'}</span>
                <span className="t">{allowed.length ? 'Next: ' + allowed[0].num + ' · waited ' + (QD.now - allowed[0].created) + ' min' : others ? others + ' in the pool this ' + q.preset.laneTerm.toLowerCase() + ' can’t serve' : 'Queue is clear'}</span>
              </>
            )}
          </div>

          <div className="acts">
            {!mine && <button className="abtn pri full" disabled={!allowed.length || lane.state !== 'open'} onClick={() => api.callNext(lane.id)}>
              <ion-icon name="megaphone-outline"></ion-icon>Call next{allowed.length ? ' · ' + allowed[0].num : ''}
            </button>}
            {mine && mine.state === 'called' && <>
              <button className="abtn go" onClick={() => api.start(mine.id)}><ion-icon name="play-outline"></ion-icon>Arrived — start</button>
              <button className="abtn warn" onClick={() => api.noShow(mine.id)}><ion-icon name="close-circle-outline"></ion-icon>No-show</button>
              <button className="abtn full" onClick={() => api.recall(mine.id)}><ion-icon name="volume-high-outline"></ion-icon>Call again</button>
            </>}
            {mine && mine.state === 'serving' && <>
              <button className="abtn go full" onClick={() => api.complete(mine.id)}><ion-icon name="checkmark-outline"></ion-icon>Complete</button>
              <button className="abtn" onClick={() => api.transfer(mine.id)}><ion-icon name="git-branch-outline"></ion-icon>Transfer</button>
              <button className="abtn warn" onClick={() => api.void(mine.id)}><ion-icon name="trash-outline"></ion-icon>Void</button>
            </>}
          </div>

          <div className="qstats">
            <div className="qstat"><div className="k">Served today</div><div className="v">{doneToday + 6}</div></div>
            <div className="qstat"><div className="k">Avg handling</div><div className="v">{avgHandle}<span style={{ font: '500 11px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}> min</span></div></div>
            <div className="qstat"><div className="k">Longest wait</div><div className="v">{allowed.length ? QD.now - allowed[allowed.length - 1].created : 0}<span style={{ font: '500 11px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}> min</span></div></div>
          </div>
        </div>

        <section className="panel">
          <div className="panel__hd"><div><h3>Waiting for {lane.name}</h3><p>{allowed.length} of {q.items.filter((x) => x.state === 'waiting').length} in the pool</p></div></div>
          <div className="qlist">
            {allowed.map((x, i) => (
              <div className={'qrow' + (i === 0 ? ' mine' : '')} key={x.id}>
                <span className="qrow__n">{x.num}</span>
                <span className="qrow__b">
                  <span className="qrow__t">{q.cats.find((c) => c.id === x.cat).name}{x.pri ? ' · priority' : ''}</span>
                  <span className="qrow__m">{x.label || 'No name given'}</span>
                </span>
                <span className="qrow__w">{QD.now - x.created}m</span>
              </div>
            ))}
            {!allowed.length && <div className="emptybox">Nothing this {q.preset.laneTerm.toLowerCase()} can take.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function IntakeView({ q, api }) {
  const [cat, setCat] = useState(null);
  const [pri, setPri] = useState(false);
  const [label, setLabel] = useState('');
  const [issued, setIssued] = useState(null);
  const waiting = q.items.filter((x) => x.state === 'waiting');
  const openLanes = q.lanes.filter((l) => l.state === 'open');
  const waitFor = (c) => {
    const lanes = openLanes.filter((l) => l.serves.includes(c.id)).length || 1;
    const ahead = waiting.filter((x) => x.cat === c.id).length;
    return up5(Math.round(((ahead + 1) / lanes) * c.dur));
  };

  if (issued) {
    const c = q.cats.find((x) => x.id === issued.cat);
    const pos = waiting.filter((x) => x.created <= issued.created).length;
    return (
      <div>
        <div className="ticket">
          <span className="k">{q.preset.venue}</span>
          <span className="num">{issued.num}</span>
          <span className="svc">{c.name}{issued.pri ? ' · priority' : ''}</span>
          <div className="ticket__grid">
            <div><div className="k">Position</div><div className="v">{pos}</div></div>
            <div><div className="k">Est. wait</div><div className="v">~{waitFor(c)}m</div></div>
          </div>
          <div className="dashcut"></div>
          <span className="k" style={{ marginTop: 8 }}>Watch the display — numbers are called in order</span>
        </div>
        <div className="chiprow" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn" onClick={() => { setIssued(null); setCat(null); setPri(false); setLabel(''); }}>
            <ion-icon name="add-outline"></ion-icon>Next {q.preset.itemTerm.toLowerCase()}
          </button>
          <button className="btn primary" onClick={() => api.toast('Ticket printed')}><ion-icon name="print-outline"></ion-icon>Print ticket</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qsplit">
      <div>
        <div className="sechead" style={{ marginBottom: 10 }}><h3>What do you need?</h3><span>{waiting.length} waiting · {openLanes.length} {q.preset.laneTermPl.toLowerCase()} open</span></div>
        <div className="icats">
          {q.cats.map((c) => (
            <button key={c.id} className="ic" onClick={() => { setCat(c.id); }} style={cat === c.id ? { borderColor: 'var(--kz-primary)', boxShadow: '0 0 0 3px var(--kz-primary-wash)' } : null}>
              <span className={'ic__code ' + c.tone}>{c.code}</span>
              <span className="ic__n">{c.name}</span>
              <span className="ic__m">about {c.dur} min</span>
              <span className="ic__w">~{waitFor(c)} min wait</span>
            </button>
          ))}
        </div>
        <div className="cols2" style={{ marginTop: 16 }}>
          <div>
            <span className="flab">Name or reference (optional)</span>
            <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={q.key === 'kitchen' ? 'Table 4' : 'First name'} />
          </div>
          <div>
            <span className="flab">Priority</span>
            <div className="chiprow">
              <button className={'chip' + (!pri ? ' on' : '')} onClick={() => setPri(false)}>Standard</button>
              <button className={'chip' + (pri ? ' on' : '')} onClick={() => setPri(true)}><ion-icon name="star-outline"></ion-icon>Priority</button>
            </div>
          </div>
        </div>
        <button className="abtn pri full" style={{ marginTop: 16, minHeight: 58 }} disabled={!cat}
          onClick={() => setIssued(api.take(cat, pri, label.trim()))}>
          <ion-icon name="ticket-outline"></ion-icon>Take a ticket
        </button>
      </div>

      <section className="panel">
        <div className="panel__hd"><div><h3>In the queue</h3><p>Longest wait first</p></div></div>
        <div className="qlist">
          {waiting.slice(0, 8).map((x) => (
            <div className="qrow" key={x.id}>
              <span className="qrow__n">{x.num}</span>
              <span className="qrow__b">
                <span className="qrow__t">{q.cats.find((c) => c.id === x.cat).name}</span>
                <span className="qrow__m">{x.label || '—'}</span>
              </span>
              <span className="qrow__w">{QD.now - x.created}m</span>
            </div>
          ))}
          {!waiting.length && <div className="emptybox">Queue is empty.</div>}
        </div>
      </section>
    </div>
  );
}

function SuperviseView({ q, api, theme, onTheme, preset, onPreset }) {
  return (
    <div className="cols2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <section className="panel">
          <div className="panel__hd"><div><h3>Business profile</h3><p>Renames the model and loads its {q.preset.catTerm.toLowerCase()} list</p></div></div>
          <div className="panel__bd">
            <div className="pickgrid">
              {Object.entries(QD.presets).map(([k, p]) => (
                <button key={k} className={'pk' + (preset === k ? ' on' : '')} onClick={() => onPreset(k)}>
                  <div className="pk__n">{p.label}</div>
                  <div className="pk__m">{p.laneTermPl} · {p.itemTermPl}</div>
                </button>
              ))}
            </div>
            <div className="dl" style={{ marginTop: 12 }}>
              <div className="dlr"><span className="k">{q.preset.laneTerm}</span><span className="v">{q.lanes.length} configured</span></div>
              <div className="dlr"><span className="k">{q.preset.catTerm}</span><span className="v">{q.cats.length} types</span></div>
              <div className="dlr"><span className="k">Numbering</span><span className="v num">code + 3 digits</span></div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__hd"><div><h3>{q.preset.laneTermPl}</h3><p>Which {q.preset.catTerm.toLowerCase()} types each one serves</p></div></div>
          <div>
            {q.lanes.map((l) => (
              <div className="cfgrow" key={l.id}>
                <span className="ql__badge" style={{ minWidth: 30, height: 30, borderRadius: 9, fontSize: 13, background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}>{l.short}</span>
                <div className="cfgrow__b">
                  <div className="cfgrow__n">{l.name}</div>
                  <div className="cfgrow__m">{l.serves.map((c) => q.cats.find((x) => x.id === c).name).join(' · ')}</div>
                </div>
                <span className={'badge ' + (l.state === 'open' ? 'ok' : l.state === 'paused' ? 'wrn' : '')}>
                  {l.state === 'open' ? 'Open' : l.state === 'paused' ? 'Paused' : 'Closed'}
                </span>
                <button className="sbtn" onClick={() => api.toggleLane(l.id)}>
                  <ion-icon name={l.state === 'open' ? 'pause-outline' : 'play-outline'}></ion-icon>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__hd"><div><h3>{q.preset.catTerm} types</h3><p>Code drives the ticket number · duration drives the estimate</p></div></div>
          <div>
            {q.cats.map((c) => (
              <div className="cfgrow" key={c.id}>
                <span className={'ic__code ' + c.tone} style={{ width: 32, height: 32, borderRadius: 9, fontSize: 14, marginBottom: 0 }}>{c.code}</span>
                <div className="cfgrow__b">
                  <div className="cfgrow__n">{c.name}</div>
                  <div className="cfgrow__m">{c.dur} min typical · served by {q.lanes.filter((l) => l.serves.includes(c.id)).length} {q.preset.laneTermPl.toLowerCase()}</div>
                </div>
                <span className="qrow__w">{q.items.filter((x) => x.state === 'waiting' && x.cat === c.id).length} waiting</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <section className="panel">
          <div className="panel__hd"><div><h3>Display theme</h3><p>Surface and ink only — layout never changes</p></div></div>
          <div className="panel__bd">
            <div className="themes">
              {THEMES.map((t) => (
                <button key={t.id} className={'th' + (theme === t.id ? ' on' : '')} onClick={() => onTheme(t.id)}>
                  <span className="th__sw" style={{ background: t.sw[0] }}>
                    <i style={{ background: t.sw[1] }}></i><i style={{ background: t.sw[1] }}></i><i style={{ background: t.sw[2], flex: '0 0 8px' }}></i>
                  </span>
                  <span className="th__n">{t.name}</span>
                </button>
              ))}
            </div>
            <div className="note info" style={{ marginTop: 12 }}>
              <ion-icon name="information-circle-outline"></ion-icon>
              Contrast is the accessibility default: maximum contrast, largest type, no decoration.
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__hd"><div><h3>Devices on this network</h3><p>Peer-to-peer · no server required</p></div></div>
          <div className="panel__bd">
            <div className="peer">
              <div className="peer__ic" style={{ background: 'var(--kz-primary-wash)', color: 'var(--kz-primary)' }}><ion-icon name="desktop-outline"></ion-icon></div>
              <div className="peer__b"><div className="peer__n">This device</div><div className="peer__m">Supervise · numbers 041–140</div></div>
              <span className="badge ok">Host of record</span>
            </div>
            {q.peers.map((p) => (
              <div className="peer" key={p.name}>
                <div className="peer__ic"><ion-icon name={p.icon}></ion-icon></div>
                <div className="peer__b"><div className="peer__n">{p.name}</div><div className="peer__m">{p.mode} · {p.block}</div></div>
                <span className={'badge ' + (p.online ? '' : 'wrn')}>{p.online ? 'In sync' : p.pending + ' pending'}</span>
              </div>
            ))}
            <div className="dl" style={{ marginTop: 8 }}>
              <div className="dlr"><span className="k">Last exchange</span><span className="v num">2 s ago</span></div>
              <div className="dlr"><span className="k">Conflict rule</span><span className="v">Monotonic state · last write</span></div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__hd"><div><h3>Day</h3><p>{QD.today}</p></div></div>
          <div className="panel__bd">
            <div className="qstats">
              <div className="qstat"><div className="k">Issued</div><div className="v">{q.items.length}</div></div>
              <div className="qstat"><div className="k">Done</div><div className="v">{q.items.filter((x) => x.state === 'done').length}</div></div>
              <div className="qstat"><div className="k">No-show</div><div className="v">{q.items.filter((x) => x.state === 'noshow').length}</div></div>
            </div>
            <button className="sbtn" style={{ marginTop: 12, width: '100%', height: 42 }} onClick={api.resetDay}>
              <ion-icon name="refresh-outline"></ion-icon>Reset day &amp; restart numbering
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { ServeView, IntakeView, SuperviseView });
