/* Koomzo Queue — shell. One state owner; mode decides which face of the system shows. */
const Q_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "display",
  "preset": "salon",
  "theme": "midnight",
  "device": "desktop"
}/*EDITMODE-END*/;

const PEERS = {
  salon: [
    { name: 'Wall TV · reception', mode: 'Display', block: 'read only', icon: 'tv-outline', online: true },
    { name: 'Chair 1 tablet', mode: 'Serve', block: 'numbers 141–240', icon: 'tablet-portrait-outline', online: true },
    { name: 'Front desk iPad', mode: 'Intake', block: 'numbers 241–340', icon: 'phone-portrait-outline', online: false, pending: 3 },
  ],
  bank: [
    { name: 'Lobby screen', mode: 'Display', block: 'read only', icon: 'tv-outline', online: true },
    { name: 'Counter 2 terminal', mode: 'Serve', block: 'numbers 141–240', icon: 'desktop-outline', online: true },
    { name: 'Entrance kiosk', mode: 'Intake', block: 'numbers 241–340', icon: 'tablet-portrait-outline', online: true },
  ],
  kitchen: [
    { name: 'Pass screen', mode: 'Display', block: 'read only', icon: 'tv-outline', online: true },
    { name: 'Grill tablet', mode: 'Serve', block: 'numbers 141–240', icon: 'tablet-portrait-outline', online: true },
    { name: 'Till', mode: 'Intake', block: 'numbers 241–340', icon: 'desktop-outline', online: true },
  ],
  support: [
    { name: 'Hall display', mode: 'Display', block: 'read only', icon: 'tv-outline', online: true },
    { name: 'Desk 3 PC', mode: 'Serve', block: 'numbers 141–240', icon: 'desktop-outline', online: true },
    { name: 'Intake tablet', mode: 'Intake', block: 'numbers 241–340', icon: 'tablet-portrait-outline', online: false, pending: 1 },
  ],
};

function QueueApp() {
  const [t, setTweak] = useTweaks(Q_DEFAULTS);
  const [preset, setPreset] = useState(t.preset);
  const [theme, setTheme] = useState(t.theme);
  const [items, setItems] = useState(() => QD.build(t.preset));
  const [lanes, setLanes] = useState(() => QD.presets[t.preset].lanes.map((l) => ({ ...l })));
  const [nextSeq, setNextSeq] = useState(60);
  const [toast, setToast] = useState(null);

  useEffect(() => { setPreset(t.preset); }, [t.preset]);
  useEffect(() => { setTheme(t.theme); }, [t.theme]);
  useEffect(() => {
    setItems(QD.build(preset));
    setLanes(QD.presets[preset].lanes.map((l) => ({ ...l })));
    setTheme(QD.presets[preset].theme);
  }, [preset]);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => setToast(null), 2400); return () => clearTimeout(i); }, [toast]);

  const p = QD.presets[preset];
  const q = { key: preset, preset: p, cats: p.cats, lanes, items, peers: PEERS[preset] };
  const say = (m) => setToast(m);
  const patch = (id, d) => setItems((c) => c.map((x) => x.id === id ? { ...x, ...d } : x));

  const api = {
    toast: say,
    callNext: (laneId) => {
      const lane = lanes.find((l) => l.id === laneId);
      const next = items.filter((x) => x.state === 'waiting' && lane.serves.includes(x.cat))
        .sort((a, b) => (b.pri - a.pri) || (a.created - b.created))[0];
      if (!next) return;
      patch(next.id, { state: 'called', lane: laneId, called: QD.now });
      say(next.num + ' called to ' + lane.name);
    },
    start: (id) => patch(id, { state: 'serving', started: QD.now }),
    complete: (id) => { const it = items.find((x) => x.id === id); patch(id, { state: 'done', finished: QD.now }); say(it.num + ' completed'); },
    noShow: (id) => { const it = items.find((x) => x.id === id); patch(id, { state: 'noshow' }); say(it.num + ' marked no-show'); },
    recall: (id) => { const it = items.find((x) => x.id === id); patch(id, { called: QD.now }); say(it.num + ' called again'); },
    void: (id) => { const it = items.find((x) => x.id === id); patch(id, { state: 'noshow' }); say(it.num + ' voided'); },
    transfer: (id) => {
      const it = items.find((x) => x.id === id);
      const to = lanes.find((l) => l.state === 'open' && l.id !== it.lane && l.serves.includes(it.cat));
      if (!to) { say('No other open ' + p.laneTerm.toLowerCase() + ' can take ' + it.num); return; }
      patch(id, { state: 'called', lane: to.id, called: QD.now, started: null });
      say(it.num + ' transferred to ' + to.name);
    },
    toggleLane: (id) => setLanes((c) => c.map((l) => l.id === id ? { ...l, state: l.state === 'open' ? 'paused' : 'open' } : l)),
    take: (catId, pri, label) => {
      const c = p.cats.find((x) => x.id === catId);
      const item = { id: 'n' + Date.now(), num: c.code + '-' + String(nextSeq).padStart(3, '0'), cat: catId, lane: null,
        state: 'waiting', created: QD.now, label, pri, called: null, started: null, seq: nextSeq };
      setItems((cur) => [...cur, item]);
      setNextSeq((n) => n + 1);
      return item;
    },
    resetDay: () => { setItems(items.filter((x) => x.state === 'serving' || x.state === 'called')); setNextSeq(60); say('Day reset · finished tickets cleared'); },
  };

  const modes = [['display', 'Display', 'tv-outline'], ['serve', 'Serve', 'megaphone-outline'],
    ['intake', 'Intake', 'ticket-outline'], ['supervise', 'Supervise', 'eye-outline'],
    ['setup', 'Setup', 'options-outline']]
    .filter(([id]) => id === 'serve' || id === 'setup' || !window.KZ || window.KZ.on('queue', id === 'intake' ? 'lanes' : id));
  const waiting = items.filter((x) => x.state === 'waiting').length;

  const panel = (
    <TweaksPanel>
      <TweakSection label="Device mode" />
      <TweakRadio label="Mode" value={t.mode}
        options={[{ value: 'display', label: 'Display' }, { value: 'serve', label: 'Serve' },
          { value: 'intake', label: 'Intake' }, { value: 'supervise', label: 'Supervise' }]}
        onChange={(v) => setTweak('mode', v)} />
      <TweakSection label="Configuration" />
      <TweakSelect label="Business" value={t.preset}
        options={Object.entries(QD.presets).map(([k, x]) => ({ value: k, label: x.label }))}
        onChange={(v) => setTweak('preset', v)} />
      <TweakSelect label="Display theme" value={theme}
        options={THEMES.map((x) => ({ value: x.id, label: x.name }))}
        onChange={(v) => { setTheme(v); setTweak('theme', v); }} />
      <TweakSection label="Preview" />
      <TweakRadio label="Screen" value={t.device}
        options={[{ value: 'desktop', label: 'Large' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]}
        onChange={(v) => setTweak('device', v)} />
    </TweaksPanel>
  );

  if (t.mode === 'display') {
    return (
      <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
        <div className="rt-wrap"><div className="rt">
          <QDisplay q={q} theme={theme} />
          {panel}
        </div></div>
      </div>
    );
  }

  return (
    <div className={'stage ' + (t.device === 'desktop' ? 'full' : t.device)}>
      <div className="rt-wrap"><div className="rt">
        <div className="qwrap">
          <header className="qtop">
            <div className="qbrand"><span className="qmark"><ion-icon name="layers-outline"></ion-icon></span>Koomzo Queue <em>· {p.label}</em></div>
            <div className="qmode">
              <ion-icon name={(modes.find((m) => m[0] === t.mode) || modes[0])[2]}></ion-icon>
              {(modes.find((m) => m[0] === t.mode) || modes[0])[1]}
            </div>
            <div className="sp"></div>
            <div className="qsync"><i></i>{q.peers.filter((x) => x.online).length + 1} peers</div>
            <div className={'qsync' + (q.peers.some((x) => !x.online) ? ' off' : '')}>
              <ion-icon name="git-compare-outline" style={{ fontSize: 14 }}></ion-icon>
              {q.peers.some((x) => !x.online) ? 'Sync pending' : 'All synced'}
            </div>
            <div className="qsync"><b>{waiting}</b> waiting</div>
          </header>
          <div className="qbody">
            {t.mode === 'serve' && <ServeView q={q} api={api} />}
            {t.mode === 'intake' && <IntakeView q={q} api={api} />}
            {t.mode === 'setup' && <div className="view" style={{ overflowY: 'auto' }}><ModuleSetup mid="queue" /></div>}
            {t.mode === 'supervise' && <SuperviseView q={q} api={api} theme={theme}
              onTheme={(v) => { setTheme(v); setTweak('theme', v); }}
              preset={preset} onPreset={(v) => { setPreset(v); setTweak('preset', v); }} />}
          </div>
          {toast && <div className="toast"><ion-icon name="checkmark-circle"></ion-icon>{toast}</div>}
        </div>
        {panel}
      </div></div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<QueueApp />);
