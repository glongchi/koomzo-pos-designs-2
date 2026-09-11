/* ============================================================
   Koomzo POS Suite — root composition + Tweaks
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "purple",
  "device": "desktop",
  "serviceCharge": 0,
  "slaWarn": 6,
  "slaLate": 10,
  "startScreen": "home"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  purple: { base: 'var(--kz-primary)', shade: 'var(--kz-primary-shade)', tint: 'var(--kz-primary-tint)', wash: 'var(--kz-primary-wash)' },
  terra:  { base: 'var(--kz-terra)',   shade: 'var(--kz-terra-shade)',   tint: 'var(--kz-terra-tint)',   wash: 'var(--kz-terra-wash)' },
  wine:   { base: 'var(--kz-wine)',    shade: 'var(--kz-wine-shade)',    tint: 'var(--kz-wine-tint)',    wash: 'var(--kz-wine-wash)' },
};

function SuiteRoot() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  /* apply accent theme to :root */
  useEffect(() => {
    const a = ACCENT_MAP[t.accent] || ACCENT_MAP.purple;
    const root = document.documentElement;
    const r = root.style;
    // disable transitions for one frame so already-painted backgrounds
    // repaint to the new accent immediately (avoids stale-paint on
    // .active nav/chip elements whose transition covers `background`).
    root.classList.add('accent-swapping');
    r.setProperty('--kz-accent', a.base);
    r.setProperty('--kz-accent-shade', a.shade);
    r.setProperty('--kz-accent-tint', a.tint);
    r.setProperty('--kz-accent-wash', a.wash);
    void root.offsetWidth; // force reflow
    const id = requestAnimationFrame(() => root.classList.remove('accent-swapping'));
    return () => cancelAnimationFrame(id);
  }, [t.accent]);

  return (
    <SuiteProvider tweaks={t}>
      <div className="stage" data-device={t.device || 'desktop'}>
        <div className="frame">
          <Suite t={t} setTweak={setTweak} />
        </div>
      </div>
    </SuiteProvider>
  );
}

function RestaurantSetup() {
  return (
    <div className="screen">
      <div className="screen__bd" style={{ padding: 22, overflowY: 'auto' }}>
        <ModuleSetup mid="restaurant" />
      </div>
    </div>
  );
}

function Suite({ t, setTweak }) {
  const { screen, setScreen } = useSuite();
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current && t.startScreen && t.startScreen !== 'home') { setScreen(t.startScreen); }
    didInit.current = true;
  }, []);

  let Screen;
  if (screen === 'register') Screen = Register;
  else if (screen === 'kitchen') Screen = Kitchen;
  else if (screen === 'floor') Screen = Floor;
  else if (screen === 'kiosk') Screen = Kiosk;
  else if (screen === 'setup') Screen = RestaurantSetup;
  else Screen = Home;

  return (
    <div className="suite">
      <NavRail />
      <Screen />

      <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={t.device || 'desktop'}
          options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]}
          onChange={(v) => setTweak('device', v)} />
        <TweakSection label="Brand" />
        <TweakRadio label="Accent" value={t.accent}
          options={[{ value: 'purple', label: 'Koomzo' }, { value: 'terra', label: 'Terracotta' }, { value: 'wine', label: 'Wine' }]}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Service" />
        <TweakSlider label="Service charge" value={t.serviceCharge} min={0} max={20} step={1} unit="%"
          onChange={(v) => setTweak('serviceCharge', v)} />
        <TweakSection label="Kitchen SLA (minutes)" />
        <TweakSlider label="Warn after" value={t.slaWarn} min={2} max={12} step={1} unit="m"
          onChange={(v) => setTweak('slaWarn', v)} />
        <TweakSlider label="Late after" value={t.slaLate} min={6} max={25} step={1} unit="m"
          onChange={(v) => setTweak('slaLate', v)} />
        <TweakSection label="Start on" />
        <TweakSelect label="Screen" value={t.startScreen}
          options={[{ value: 'home', label: 'Today' }, { value: 'register', label: 'Order entry' }, { value: 'kitchen', label: 'Kitchen' }, { value: 'floor', label: 'Floor' }, { value: 'kiosk', label: 'Kiosk' }]}
          onChange={(v) => setTweak('startScreen', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SuiteRoot />);
