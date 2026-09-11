/* Koomzo POS — Settings: app state, device presenter, composition.
   Desktop/tablet two-pane (section nav + content); phone grouped list.
   Settings live in one store; the profile section edits a separate draft. */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const SET_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf"
}/*EDITMODE-END*/;

const SET_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

function SetStage({ w, h, className, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - 52;
      const availH = window.innerHeight - 56 - 52;
      setScale(Math.min(1, availW / w, availH / h));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(SET_TWEAKS);
  const [device, setDevice] = useState('desktop');

  const profile = window.KZ_SET_PROFILE;
  const sections = window.KZ_SET_SECTIONS;
  const opt = window.KZ_SET_OPTIONS;
  const methods = window.KZ_SET_PAYMETHODS;

  const [s, setS] = useState(window.KZ_SET_DEFAULTS);
  const [active, setActive] = useState('profile');
  const set = (k, v) => setS((cur) => ({ ...cur, [k]: v }));

  // profile draft (edited inline; saved into profile-like values)
  const [draft, setDraft] = useState({ name: profile.name, email: profile.email, phone: profile.phone });
  const onField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const [savedProfile, setSavedProfile] = useState({ name: profile.name, email: profile.email, phone: profile.phone });
  const dirty = draft.name !== savedProfile.name || draft.email !== savedProfile.email || draft.phone !== savedProfile.phone;
  const saveProfile = () => { setSavedProfile({ ...draft }); };

  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';
  const section = sections.find((x) => x.id === active) || sections[0];

  const [phoneEdit, setPhoneEdit] = useState(false);
  useEffect(() => { setPhoneEdit(false); }, [device]);

  const signOut = () => alert('Sign out of Koomzo POS?');

  const accentStyle = { '--kz-primary': t.accent };
  const dev = SET_DEVICES[device];
  const appClass = `pa-app ${isTablet ? 'is-tablet' : ''}`;
  const liveProfile = { ...profile, name: savedProfile.name, email: savedProfile.email };

  const panelProps = { section, s, set, opt, methods, profile: liveProfile, draft, onField, onSave: saveProfile, dirty };

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={appClass} style={accentStyle}>
          {isPhone ? (
            <>
              <MobileSettings
                profile={liveProfile} s={s} set={set} opt={opt} methods={methods}
                onEditProfile={() => setPhoneEdit(true)} onSignOut={signOut}
              />
              {phoneEdit && (
                <div className="setm__detail">
                  <MobileProfileEdit profile={liveProfile} draft={draft} onField={onField}
                    onSave={() => { saveProfile(); setPhoneEdit(false); }} onClose={() => setPhoneEdit(false)} />
                </div>
              )}
            </>
          ) : (
            <>
              <SetRail />
              <div className="pa-main">
                <SetTopbar section={section} />
                <div className="pa-pagehead">
                  <div className="pa-pagehead__t">
                    <span className="pa-eyebrow">Account</span>
                    <h1>Settings</h1>
                  </div>
                </div>
                <div className="set-layout">
                  <SettingsNav sections={sections} active={active} onSelect={setActive} profile={liveProfile} onSignOut={signOut} />
                  <div className="set-content">
                    <SettingsPanel {...panelProps} />
                  </div>
                </div>
              </div>
            </>
          )}

          <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]} onChange={setDevice} />
            <TweakSection label="Brand" />
            <TweakColor label="Accent color" value={t.accent}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('accent', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

/* phone full-screen profile editor (reuses the .pd shell) */
function MobileProfileEdit({ profile, draft, onField, onSave, onClose }) {
  return (
    <div className="pd">
      <div className="pd__head">
        <button className="pd__back" onClick={onClose}><ion-icon name="chevron-back-outline"></ion-icon></button>
        <div>
          <div className="eyebrow">Account</div>
          <h2>Edit profile</h2>
        </div>
      </div>
      <div className="pd__body">
        <div className="set-prof-hero" style={{ paddingTop: 0 }}>
          <SetAvatar profile={profile} size={72} />
          <div className="set-prof-hero__t">
            <h3 style={{ fontSize: 19 }}>{draft.name}</h3>
            <span className="rolepill"><ion-icon name="shield-checkmark"></ion-icon>{profile.role}</span>
          </div>
        </div>
        <div className="pd__section">
          <div className="pd__field"><label>Full name</label><input className="pd__input" value={draft.name} onChange={(e) => onField('name', e.target.value)} /></div>
          <div className="pd__field"><label>Email address</label><input className="pd__input" value={draft.email} onChange={(e) => onField('email', e.target.value)} /></div>
          <div className="pd__field"><label>Phone</label><input className="pd__input mono" value={draft.phone} onChange={(e) => onField('phone', e.target.value)} /></div>
        </div>
      </div>
      <div className="pd__foot">
        <button className="pd__cancel" onClick={onClose}>Cancel</button>
        <button className="pd__save" onClick={onSave}><ion-icon name="checkmark-outline"></ion-icon>Save changes</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
