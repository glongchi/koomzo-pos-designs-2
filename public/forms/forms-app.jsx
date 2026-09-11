/* Koomzo POS — Forms & Inputs screen.
   A template page showcasing the full Ionic form-control vocabulary in the
   Koomzo language: a Simple form ("Add customer") and a Multi-step wizard
   ("New product setup") with a breadcrumb stepper + progress bar. Presented
   in the shared device chrome (desktop / tablet / phone). */
const { useState, useLayoutEffect } = React;

const KF_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "density": "comfortable",
  "showNotes": true
}/*EDITMODE-END*/;

const KF_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

const WIZARD_STEPS = [
  { label: 'Details' }, { label: 'Pricing' }, { label: 'Options' }, { label: 'Review' },
];

/* ============================================================
   STAGE (scaled device frame) — matches the other modules
   ============================================================ */
function Stage({ w, h, className, children }) {
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

/* shared left nav rail (Forms active) */
function Rail() {
  const items = [
    { icon: 'grid-outline', label: 'Home', href: 'Koomzo POS - Home.html' },
    { icon: 'cart-outline', label: 'Sell', href: 'Koomzo POS.html' },
    { icon: 'pricetags-outline', label: 'Items', href: 'Koomzo POS - Products.html' },
    { icon: 'document-text-outline', label: 'Forms', active: true },
    { icon: 'people-outline', label: 'Team', href: 'Koomzo POS - Users.html' },
  ];
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="storefront"></ion-icon></a>
      {items.map((it) => (
        it.href
          ? <a key={it.label} className="pa-rail__item" href={it.href}><ion-icon name={it.icon}></ion-icon>{it.label}</a>
          : <button key={it.label} className={'pa-rail__item' + (it.active ? ' active' : '')}><ion-icon name={it.icon}></ion-icon>{it.label}</button>
      ))}
      <div className="pa-rail__spacer"></div>
      <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
    </nav>
  );
}

/* ============================================================
   FORM BODIES (shared between desktop + phone chrome)
   ============================================================ */
const GROUPS = ['Retail', 'Wholesale', 'VIP member', 'Staff', 'Online'];
const CATEGORIES = ['Plats cuisinés', 'Boulangerie', 'Boissons', 'Épicerie', 'Produits ménagers'];

function SimpleForm({ s, set, showNotes }) {
  const note = (txt, err) => (showNotes ? { note: txt, noteErr: err } : {});
  return (
    <>
      <div className="kf-card">
        <div className="kf-card__head"><div className="ic"><ion-icon name="person-outline"></ion-icon></div><h2>Account</h2><span className="sub">Required details</span></div>

        <KfField label="Account type">
          <KfSegment value={s.accountType} onChange={(v) => set('accountType', v)}
            options={[{ value: 'individual', label: 'Individual', icon: 'person-outline' }, { value: 'business', label: 'Business', icon: 'business-outline' }]} />
        </KfField>

        <KfField label="Full name" required {...note('As it should appear on receipts.')}>
          <KfInput value={s.name} onChange={(v) => set('name', v)} placeholder="e.g. Nadège Fotso" icon="person-outline" />
        </KfField>

        <div className="kf-grid2">
          <KfField label="Email" required>
            <KfInput value={s.email} onChange={(v) => set('email', v)} type="email" placeholder="name@email.com" icon="mail-outline" />
          </KfField>
          <KfField label="Phone" optional>
            <KfInput value={s.phone} onChange={(v) => set('phone', v)} type="tel" placeholder="+237 6 00 00 00 00" icon="call-outline" />
          </KfField>
        </div>

        <KfField label="Customer group">
          <KfSelect value={s.group} onChange={(v) => set('group', v)} options={GROUPS} placeholder="Choose a group" />
        </KfField>
      </div>

      <div className="kf-card">
        <div className="kf-card__head"><div className="ic"><ion-icon name="options-outline"></ion-icon></div><h2>Preferences</h2></div>

        <KfField label="Preferred contact method">
          <KfRadioList value={s.contact} onChange={(v) => set('contact', v)}
            options={[
              { value: 'email', label: 'Email', desc: 'Receipts and offers by email' },
              { value: 'sms', label: 'Text message', desc: 'Order updates via SMS' },
              { value: 'phone', label: 'Phone call', desc: 'For large or wholesale orders' },
            ]} />
        </KfField>

        <KfField label="Subscriptions" {...note('Customer can change these any time.')}>
          <KfCheckList value={s.consent} onChange={(v) => set('consent', v)}
            options={[
              { value: 'promos', label: 'Marketing emails', desc: 'Weekly specials & new items' },
              { value: 'receipts', label: 'Digital receipts', desc: 'Emailed after every purchase' },
              { value: 'loyalty', label: 'Loyalty program', desc: 'Earn points on every order' },
            ]} />
        </KfField>

        <KfField>
          <KfToggleRow value={s.active} onChange={(v) => set('active', v)} title="Active account" desc="Customer can be charged and earn points" />
        </KfField>
        <KfField>
          <KfToggleRow value={s.taxExempt} onChange={(v) => set('taxExempt', v)} purple title="Tax exempt" desc="Skip TVA on this customer’s orders" />
        </KfField>
      </div>

      <div className="kf-card">
        <div className="kf-card__head"><div className="ic"><ion-icon name="pricetag-outline"></ion-icon></div><h2>Loyalty</h2></div>
        <KfField label="Standing discount" {...note('Applied automatically at checkout.')}>
          <KfRange value={s.discount} onChange={(v) => set('discount', v)} min={0} max={25} step={1} unit="%" label="Off every order" />
        </KfField>
        <KfField label="Member since" optional>
          <KfDatetime value={s.memberSince} onChange={(v) => set('memberSince', v)} placeholder="Select join date" />
        </KfField>
      </div>

      <div className="kf-card">
        <div className="kf-card__head"><div className="ic"><ion-icon name="create-outline"></ion-icon></div><h2>Notes</h2></div>
        <KfField label="Internal notes" optional {...note('Visible to staff only — never printed.')}>
          <KfTextarea value={s.notes} onChange={(v) => set('notes', v)} placeholder="Allergies, preferences, account history…" max={240} />
        </KfField>
      </div>
    </>
  );
}

function WizardForm({ step, p, set, showNotes }) {
  const note = (txt) => (showNotes ? { note: txt } : {});
  if (step === 0) return (
    <div className="kf-card">
      <div className="kf-card__head"><div className="ic"><ion-icon name="cube-outline"></ion-icon></div><h2>Product details</h2></div>
      <KfField label="Product name" required>
        <KfInput value={p.name} onChange={(v) => set('name', v)} placeholder="e.g. Ndolé poisson" icon="cube-outline" />
      </KfField>
      <div className="kf-grid2">
        <KfField label="SKU" {...note('Auto-generated — edit if needed.')}>
          <KfInput value={p.sku} onChange={(v) => set('sku', v)} mono icon="barcode-outline" />
        </KfField>
        <KfField label="Category" required>
          <KfSelect value={p.category} onChange={(v) => set('category', v)} options={CATEGORIES} placeholder="Choose category" />
        </KfField>
      </div>
      <KfField label="Sell as">
        <KfSegment value={p.kind} onChange={(v) => set('kind', v)}
          options={[{ value: 'single', label: 'Single', icon: 'cafe-outline' }, { value: 'variant', label: 'Variants', icon: 'layers-outline' }, { value: 'bundle', label: 'Bundle', icon: 'gift-outline' }]} />
      </KfField>
    </div>
  );
  if (step === 1) return (
    <div className="kf-card">
      <div className="kf-card__head"><div className="ic"><ion-icon name="cash-outline"></ion-icon></div><h2>Pricing & stock</h2></div>
      <div className="kf-grid2">
        <KfField label="Unit cost" required>
          <KfInput value={p.cost} onChange={(v) => set('cost', v)} type="number" affix="F" mono />
        </KfField>
        <KfField label="Selling price" required>
          <KfInput value={p.price} onChange={(v) => set('price', v)} type="number" affix="F" mono />
        </KfField>
      </div>
      <KfField label="Tax rate">
        <KfRange value={p.tax} onChange={(v) => set('tax', v)} min={0} max={20} step={0.5} unit="%" label="TVA applied" />
      </KfField>
      <KfField>
        <KfToggleRow value={p.track} onChange={(v) => set('track', v)} purple title="Track inventory" desc="Decrement stock as units sell" />
      </KfField>
      <KfField label="Available from" optional {...note('Item stays hidden until this date & time.')}>
        <KfDatetime value={p.availFrom} onChange={(v) => set('availFrom', v)} placeholder="Select date & time" withTime />
      </KfField>
    </div>
  );
  if (step === 2) return (
    <div className="kf-card">
      <div className="kf-card__head"><div className="ic"><ion-icon name="construct-outline"></ion-icon></div><h2>Options</h2></div>
      <KfField label="Sales channels">
        <KfCheckList value={p.channels} onChange={(v) => set('channels', v)}
          options={[
            { value: 'instore', label: 'In-store register', desc: 'Front counter POS' },
            { value: 'online', label: 'Online store', desc: 'Web & mobile ordering' },
            { value: 'kiosk', label: 'Self-service kiosk', desc: 'Lobby kiosks' },
          ]} />
      </KfField>
      <KfField label="Fulfillment">
        <KfRadioList value={p.fulfillment} onChange={(v) => set('fulfillment', v)}
          options={[
            { value: 'counter', label: 'Made to order', desc: 'Prepared at the counter' },
            { value: 'shelf', label: 'Off the shelf', desc: 'Pre-packaged, grab & go' },
          ]} />
      </KfField>
      <KfField label="Supplier" optional>
        <KfSearch value={p.supplier} onChange={(v) => set('supplier', v)} placeholder="Search suppliers…" />
      </KfField>
      <KfField label="Description" optional>
        <KfTextarea value={p.desc} onChange={(v) => set('desc', v)} placeholder="Shown on the online store and kiosk…" max={300} />
      </KfField>
    </div>
  );
  /* review */
  const money = (v) => window.KZ_LOCALE.short(v);
  const margin = (Number(p.price) - Number(p.cost)) || 0;
  return (
    <div className="kf-card">
      <div className="kf-banner">
        <ion-icon name="checkmark-circle"></ion-icon>
        <div><b>Ready to publish</b><span>Review the details below, then create the item.</span></div>
      </div>
      <div className="kf-review">
        <div className="kf-review__row"><span className="k">Name</span><span className="v">{p.name || '—'}</span></div>
        <div className="kf-review__row"><span className="k">SKU</span><span className="v mono">{p.sku}</span></div>
        <div className="kf-review__row"><span className="k">Category</span><span className="v">{p.category || '—'}</span></div>
        <div className="kf-review__row"><span className="k">Price</span><span className="v mono">{money(p.price)}</span></div>
        <div className="kf-review__row"><span className="k">Margin / unit</span><span className="v mono" style={{ color: margin >= 0 ? 'var(--kz-success)' : 'var(--kz-discount)' }}>{money(margin)}</span></div>
        <div className="kf-review__row"><span className="k">Tax rate</span><span className="v mono">{p.tax}%</span></div>
        <div className="kf-review__row"><span className="k">Channels</span><span className="v">{p.channels.length ? p.channels.length + ' selected' : 'None'}</span></div>
      </div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
const blankCust = { accountType: 'individual', name: '', email: '', phone: '', group: '', contact: 'email', consent: ['receipts', 'loyalty'], active: true, taxExempt: false, discount: 5, memberSince: new Date().toISOString(), notes: '' };
const blankProd = { name: '', sku: 'SKU-' + Math.random().toString(36).slice(2, 8).toUpperCase(), category: '', kind: 'single', cost: '2.10', price: '4.50', tax: 8, track: true, availFrom: '', channels: ['instore'], fulfillment: 'counter', supplier: '', desc: '' };

function App() {
  const [t, setTweak] = useTweaks(KF_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const [mode, setMode] = useState('simple');
  const [cust, setCust] = useState(blankCust);
  const [prod, setProd] = useState(blankProd);
  const [step, setStep] = useState(0);

  const setC = (k, v) => setCust((s) => ({ ...s, [k]: v }));
  const setP = (k, v) => setProd((s) => ({ ...s, [k]: v }));

  const dev = KF_DEVICES[device];
  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';
  const accentStyle = { '--kz-primary': t.accent };
  const wrapClass = 'kf-wrap' + (t.density === 'compact' ? ' kf-compact' : '') + (t.showNotes ? '' : ' kf-nonotes');
  const progress = ((step + 1) / WIZARD_STEPS.length) * 100;

  const ModeSwitch = () => (
    <div className="kf-modeseg">
      <button className={mode === 'simple' ? 'active' : ''} onClick={() => setMode('simple')}><ion-icon name="reader-outline"></ion-icon>Simple form</button>
      <button className={mode === 'wizard' ? 'active' : ''} onClick={() => setMode('wizard')}><ion-icon name="git-branch-outline"></ion-icon>Multi-step</button>
    </div>
  );

  /* ----- DESKTOP / TABLET ----- */
  const desktop = (
    <div className={'pa-app' + (isTablet ? ' is-tablet' : '') + (t.density === 'compact' ? ' kf-compact' : '')} style={accentStyle}>
      <Rail />
      <div className="pa-main">
        <header className="pa-topbar">
          <div className="pa-topbar__crumb">
            <ion-icon name="document-text-outline"></ion-icon>
            Library
            <ion-icon name="chevron-forward-outline"></ion-icon>
            <b>Forms &amp; inputs</b>
          </div>
          <div className="pa-topbar__right">
            <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Draft saved</span>
            <a className="pa-btn icon" href="Koomzo POS - Form Builder.html" title="Open form builder"><ion-icon name="construct-outline"></ion-icon></a>
            <a className="pa-btn icon" href="Koomzo POS - Form Record.html" title="View printable record"><ion-icon name="print-outline"></ion-icon></a>
            <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
            <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
          </div>
        </header>

        <div className="pa-pagehead">
          <div className="pa-pagehead__t">
            <span className="pa-eyebrow">Form templates</span>
            <h1>{mode === 'simple' ? 'Add customer' : 'New product'}</h1>
          </div>
          <div className="pa-pagehead__actions"><ModeSwitch /></div>
        </div>

        <div className="kf-scroll">
          <div className={wrapClass}>
            {mode === 'simple' ? (
              <>
                <SimpleForm s={cust} set={setC} showNotes={t.showNotes} />
                <div className="kf-actions">
                  <button className="kf-btn ghost" onClick={() => setCust(blankCust)}><ion-icon name="refresh-outline"></ion-icon>Reset</button>
                  <div className="spacer"></div>
                  <button className="kf-btn" onClick={() => alert('Saved as draft')}>Save draft</button>
                  <button className="kf-btn primary" onClick={() => alert('Customer created')}><ion-icon name="checkmark-outline"></ion-icon>Create customer</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 22 }}><KfProgress value={progress} label={`Step ${step + 1} of ${WIZARD_STEPS.length} · ${WIZARD_STEPS[step].label}`} /></div>
                <KfStepper steps={WIZARD_STEPS} current={step} />
                <WizardForm step={step} p={prod} set={setP} showNotes={t.showNotes} />
                <div className="kf-actions">
                  <button className="kf-btn ghost" disabled={step === 0} style={{ opacity: step === 0 ? .4 : 1 }} onClick={() => setStep((x) => Math.max(0, x - 1))}><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
                  <div className="spacer"></div>
                  {step < WIZARD_STEPS.length - 1
                    ? <button className="kf-btn primary" onClick={() => setStep((x) => x + 1)}>Continue<ion-icon name="chevron-forward-outline"></ion-icon></button>
                    : <button className="kf-btn success" onClick={() => alert('Product published')}><ion-icon name="checkmark-outline"></ion-icon>Publish item</button>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ----- PHONE ----- */
  const phone = (
    <div className="kfm" style={accentStyle}>
      <div className="kfm__bar">
        <button className="back"><ion-icon name="chevron-back-outline"></ion-icon></button>
        <h1>{mode === 'simple' ? 'Add customer' : 'New product'}</h1>
        <button className="save" onClick={() => alert(mode === 'simple' ? 'Saved' : 'Saved draft')}>Save</button>
      </div>
      <div className="kfm__seg">
        <button className={mode === 'simple' ? 'active' : ''} onClick={() => setMode('simple')}>Simple form</button>
        <button className={mode === 'wizard' ? 'active' : ''} onClick={() => setMode('wizard')}>Multi-step</button>
      </div>
      {mode === 'wizard' && (
        <div className="kfm__steptrack"><KfProgress value={progress} label={`Step ${step + 1} of ${WIZARD_STEPS.length} · ${WIZARD_STEPS[step].label}`} /></div>
      )}
      <div className="kfm__scroll">
        <div className={'kf-wrap' + (t.showNotes ? '' : ' kf-nonotes')} style={{ padding: '14px 16px 20px' }}>
          {mode === 'simple'
            ? <SimpleForm s={cust} set={setC} showNotes={t.showNotes} />
            : <WizardForm step={step} p={prod} set={setP} showNotes={t.showNotes} />}
        </div>
      </div>
      <div className="kfm__bottombar">
        {mode === 'simple' ? (
          <button className="kf-btn primary" onClick={() => alert('Customer created')}><ion-icon name="checkmark-outline"></ion-icon>Create customer</button>
        ) : (
          <>
            {step > 0 && <button className="kf-btn ghost" style={{ flex: '0 0 auto' }} onClick={() => setStep((x) => x - 1)}><ion-icon name="chevron-back-outline"></ion-icon></button>}
            {step < WIZARD_STEPS.length - 1
              ? <button className="kf-btn primary" onClick={() => setStep((x) => x + 1)}>Continue</button>
              : <button className="kf-btn success" onClick={() => alert('Product published')}><ion-icon name="checkmark-outline"></ion-icon>Publish item</button>}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="present" style={accentStyle}>
      <div className="present__bar">
        <div className="present__brand">
          <div className="mk"><ion-icon name="storefront"></ion-icon></div>
          <b>koomzo<span> · POS</span></b>
        </div>
        <span className="present__tag">Forms &amp; inputs</span>
        <div className="devseg">
          {Object.keys(KF_DEVICES).map((k) => (
            <button key={k} className={device === k ? 'active' : ''} onClick={() => setDevice(k)}>
              <ion-icon name={KF_DEVICES[k].icon}></ion-icon>{KF_DEVICES[k].label}
            </button>
          ))}
        </div>
        <span className="present__dim">{dev.w} × {dev.h}</span>
      </div>

      <Stage w={dev.w} h={dev.h} className={device}>
        {isPhone ? phone : desktop}
      </Stage>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent color" value={t.accent}
          options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Form" />
        <TweakRadio label="Field density" value={t.density}
          options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
          onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="Show helper notes" value={t.showNotes} onChange={(v) => setTweak('showNotes', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
