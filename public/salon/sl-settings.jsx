/* Koomzo Salon — Settings. Device + account settings that really belong to the product
   (kiosk lock, per-user landing screen, text size), not to the design-review panel. */

function SettingsView({ api }) {
  const [pin, setPin] = useState(null);
  const [kiosk, setKiosk] = useState(false);
  const me = api.me, manager = api.role === 'manager';
  const s = api.settings;
  const views = [['today', 'Today', 'today-outline'], ['register', 'Sell', 'cart-outline'], ['calendar', 'Book', 'calendar-number-outline'],
    ['tasks', 'Tasks', 'checkbox-outline'], ['team', 'Team', 'people-outline'], ['time', 'Hours', 'time-outline']];

  useEffect(() => {
    if (pin && pin.length === 4) {
      const who = SL.staff.find((x) => x.pin === pin);
      if (who) { api.signIn(who.id); setPin(null); }
    }
  }, [pin]);

  return (
    <div className="view">
      <div className="view__head">
        <div><h2>Settings</h2><p>This device · {me.first}’s preferences{manager ? ' · salon setup' : ''}</p></div>
      </div>

      {window.ModuleSetup && <div style={{ marginBottom: 14 }}><ModuleSetup mid="salon" embedded /></div>}

      <div className="cols2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <section className="panel">
            <div className="panel__hd"><div><h3>Signed in</h3><p>Your role comes from this account</p></div></div>
            <div className="prof2" style={{ borderBottom: 'none' }}>
              <Av s={me} size="xl" />
              <div style={{ minWidth: 0 }}>
                <div className="prof2__n">{me.name}</div>
                <div className="prof2__r">
                  <span>{me.role}</span>
                  <span className={'badge ' + (manager ? 'pri' : '')}>{manager ? 'Manager access' : 'Staff access'}</span>
                </div>
              </div>
              <div className="sp" style={{ flex: 1 }}></div>
              <div className="chiprow">
                <button className="sbtn" onClick={() => setPin('')}><ion-icon name="swap-horizontal-outline"></ion-icon>Switch user</button>
                <button className="sbtn gh" onClick={() => api.toast('Signed out — PIN required to return')}><ion-icon name="log-out-outline"></ion-icon>Sign out</button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__hd"><div><h3>After you sign in</h3><p>Where {me.first} lands — saved per person, not per device</p></div></div>
            <div className="panel__bd">
              <div className="pickgrid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' }}>
                {views.map(([v, label, ic]) => (
                  <button key={v} className={'pk' + (s.landing === v ? ' on' : '')} onClick={() => api.setSetting('landing', v)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <ion-icon name={ic} style={{ fontSize: 19, color: s.landing === v ? 'var(--kz-primary)' : 'var(--kz-muted-3)' }}></ion-icon>
                    <div className="pk__n">{label}</div>
                  </button>
                ))}
              </div>
              <div className="trow2" style={{ marginTop: 12 }}>
                <div className="trow2__ic"><ion-icon name="time-outline"></ion-icon></div>
                <div style={{ flex: 1 }}><div className="trow2__t">Clock in when I sign in</div><div className="trow2__d">Starts your timesheet automatically at the start of a shift</div></div>
                <button className={'sw2' + (s.autoClock ? ' on' : '')} onClick={() => api.setSetting('autoClock', !s.autoClock)}></button>
              </div>
              <div className="trow2">
                <div className="trow2__ic"><ion-icon name="funnel-outline"></ion-icon></div>
                <div style={{ flex: 1 }}><div className="trow2__t">Show only my appointments</div><div className="trow2__d">Opens Today filtered to your own column</div></div>
                <button className={'sw2' + (s.mineOnly ? ' on' : '')} onClick={() => api.setSetting('mineOnly', !s.mineOnly)}></button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__hd"><div><h3>Display</h3><p>Applies to this device only</p></div></div>
            <div className="panel__bd">
              <div className="dlr" style={{ borderBottom: 'none', paddingTop: 0 }}>
                <span className="k">Text size</span>
                <div style={{ marginLeft: 'auto' }}>
                  <Seg value={api.density} options={[{ v: 'comfortable', label: 'Standard' }, { v: 'compact', label: 'Compact' }]} onChange={api.setDensity} />
                </div>
              </div>
              <div className="trow2">
                <div className="trow2__ic"><ion-icon name="volume-medium-outline"></ion-icon></div>
                <div style={{ flex: 1 }}><div className="trow2__t">Sound on new check-in</div><div className="trow2__d">Chime when a walk-in joins the queue</div></div>
                <button className={'sw2' + (s.sound ? ' on' : '')} onClick={() => api.setSetting('sound', !s.sound)}></button>
              </div>
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <section className="panel">
            <div className="panel__hd"><div><h3>This device</h3><p>{s.deviceName}</p></div></div>
            <div className="panel__bd">
              <div className="kioskcard">
                <div className="kioskcard__ic"><ion-icon name="tablet-portrait-outline"></ion-icon></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="trow2__t">Kiosk mode</div>
                  <div className="trow2__d">Locks this device to customer self check-in. Staff exit with a register PIN.</div>
                </div>
                <button className="sbtn pri" onClick={() => setKiosk(true)}><ion-icon name="lock-closed-outline"></ion-icon>Start kiosk</button>
              </div>
              <div className="kioskcard">
                <div className="kioskcard__ic"><ion-icon name="tv-outline"></ion-icon></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="trow2__t">Queue display</div>
                  <div className="trow2__d">Turns this device into a waiting-room board — who’s in the chair and who’s next.</div>
                </div>
                <button className="sbtn" onClick={api.startDisplay}><ion-icon name="play-outline"></ion-icon>Start display</button>
              </div>
              <div className="dl" style={{ marginTop: 6 }}>
                <div className="dlr"><span className="k">Device name</span><span className="v">{s.deviceName}</span></div>
                <div className="dlr"><span className="k">Paired reader</span><span className="v">{s.reader}</span></div>
                <div className="dlr"><span className="k">Receipt printer</span><span className="v">{s.printer}</span></div>
                <div className="dlr"><span className="k">App version</span><span className="v num">2.14.0</span></div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__hd"><div><h3>Notify me</h3><p>Push to this device</p></div></div>
            <div className="panel__bd">
              {[['nTask', 'A task is assigned to me', 'checkbox-outline'],
                ['nAppt', 'My next client checks in', 'person-outline'],
                ['nShift', 'My rota changes', 'calendar-outline'],
                ...(manager ? [['nHours', 'Timesheets need approval', 'time-outline'], ['nStock', 'Retail stock runs low', 'cube-outline']] : [])].map(([k, label, ic]) => (
                <div className={'trow2' + (s[k] ? ' on' : '')} key={k}>
                  <div className="trow2__ic"><ion-icon name={ic}></ion-icon></div>
                  <div style={{ flex: 1 }}><div className="trow2__t">{label}</div></div>
                  <button className={'sw2' + (s[k] ? ' on' : '')} onClick={() => api.setSetting(k, !s[k])}></button>
                </div>
              ))}
            </div>
          </section>

          {manager && (
            <section className="panel">
              <div className="panel__hd"><div><h3>Salon</h3><p>Applies everywhere · manager only</p></div></div>
              <div className="panel__bd">
                <div className="dl">
                  <div className="dlr"><span className="k">Opening hours</span><span className="v num">{fmtS(SL.open)} – {fmtS(SL.close)}</span></div>
                  <div className="dlr"><span className="k">TVA</span><span className="v num">{window.KZ_POLICY.taxLabelFor('salon')}</span></div>
                  <div className="dlr"><span className="k">Pay week ends</span><span className="v">Sunday</span></div>
                </div>
                <div className="trow2" style={{ marginTop: 8 }}>
                  <div className="trow2__ic"><ion-icon name="walk-outline"></ion-icon></div>
                  <div style={{ flex: 1 }}><div className="trow2__t">Accept walk-ins</div><div className="trow2__d">Turn off to hide the kiosk walk-in path when fully booked</div></div>
                  <button className={'sw2' + (s.walkIns ? ' on' : '')} onClick={() => api.setSetting('walkIns', !s.walkIns)}></button>
                </div>
                <div className="trow2">
                  <div className="trow2__ic"><ion-icon name="cash-outline"></ion-icon></div>
                  <div style={{ flex: 1 }}><div className="trow2__t">Ask for a tip at checkout</div><div className="trow2__d">Split to the stylist on each service line</div></div>
                  <button className={'sw2' + (s.tips ? ' on' : '')} onClick={() => api.setSetting('tips', !s.tips)}></button>
                </div>
                <div className="trow2">
                  <div className="trow2__ic"><ion-icon name="chatbubble-outline"></ion-icon></div>
                  <div style={{ flex: 1 }}><div className="trow2__t">Text appointment reminders</div><div className="trow2__d">Sent the evening before</div></div>
                  <button className={'sw2' + (s.reminders ? ' on' : '')} onClick={() => api.setSetting('reminders', !s.reminders)}></button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {kiosk && (
        <div className="scrim" onClick={() => setKiosk(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head">
              <div><h3>Start kiosk mode</h3><p>{s.deviceName}</p></div>
              <div className="sp"></div>
              <button className="icbtn" onClick={() => setKiosk(false)}><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div className="sheet__body">
              <div className="note info"><ion-icon name="information-circle-outline"></ion-icon>
                This device shows only customer self check-in. The register, rota and reports are hidden until a staff PIN is entered.
              </div>
              <div className="dl">
                <div className="dlr"><span className="k">Walk-ins</span><span className="v">{s.walkIns ? 'Accepted' : 'Paused'}</span></div>
                <div className="dlr"><span className="k">Exit with</span><span className="v">Any register PIN</span></div>
                <div className="dlr"><span className="k">Set by</span><span className="v">{me.name}</span></div>
              </div>
            </div>
            <div className="sheet__foot">
              <button className="btn" onClick={() => setKiosk(false)}>Cancel</button>
              <button className="btn primary" onClick={() => { setKiosk(false); api.startKiosk(); }}><ion-icon name="lock-closed-outline"></ion-icon>Lock to kiosk</button>
            </div>
          </div>
        </div>
      )}

      {pin !== null && (
        <div className="scrim" onClick={() => setPin(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head">
              <div><h3>Switch user</h3><p>Enter your register PIN — permissions follow the account</p></div>
              <div className="sp"></div>
              <button className="icbtn" onClick={() => setPin(null)}><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div className="sheet__body">
              <div className="pindots">{[0, 1, 2, 3].map((i) => <i key={i} className={pin.length > i ? 'on' : ''}></i>)}</div>
              {pin.length === 4 && !SL.staff.some((x) => x.pin === pin) && <div className="note"><ion-icon name="alert-circle-outline"></ion-icon>PIN not recognised.</div>}
              <div className="kpad tight">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (
                  <button key={i} disabled={!k} style={!k ? { visibility: 'hidden' } : null}
                    onClick={() => setPin((p) => k === 'del' ? p.slice(0, -1) : (p + k).slice(0, 4))}>
                    {k === 'del' ? <ion-icon name="backspace-outline"></ion-icon> : k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SettingsView });
