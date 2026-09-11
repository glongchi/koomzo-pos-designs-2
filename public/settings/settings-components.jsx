/* Koomzo POS — Settings: presentational components.
   Desktop/tablet: nav rail + topbar + two-pane (section nav + content panel).
   Phone: blue header + grouped scrolling list (matches the reference).
   State is owned by the app shell; these render + emit changes. */

/* ---- avatar (icon-on-tint vocabulary, initials, no image dep) ---- */
function SetAvatar({ profile, size }) {
  const s = size || 44;
  return (
    <div className="set-av" style={{ width: s, height: s, background: profile.tint.bg, color: profile.tint.fg, fontSize: Math.round(s * 0.38) }}>
      {profile.initials}
    </div>
  );
}

/* ============================================================
   ROW ATOMS (desktop / tablet)
   ============================================================ */
function SetGroup({ label, children }) {
  return (
    <>
      {label && <div className="set-grouplabel">{label}</div>}
      <div className="set-group">{children}</div>
    </>
  );
}

function RowIcon({ icon, variant }) {
  return <div className={'set-row__ic' + (variant ? ' ' + variant : '')}><ion-icon name={icon}></ion-icon></div>;
}

function SelectRow({ icon, label, sub, value, options, onChange }) {
  return (
    <div className="set-row">
      <RowIcon icon={icon} />
      <div className="set-row__t"><b>{label}</b>{sub && <small>{sub}</small>}</div>
      <div className="set-row__ctrl">
        <span className="set-select">
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </span>
      </div>
    </div>
  );
}

function ToggleRow({ icon, variant, label, sub, value, onChange }) {
  return (
    <div className="set-row">
      <RowIcon icon={icon} variant={variant} />
      <div className="set-row__t"><b>{label}</b>{sub && <small>{sub}</small>}</div>
      <div className="set-row__ctrl">
        <button className={'set-toggle' + (value ? ' on' : '')} onClick={() => onChange(!value)} aria-pressed={value}></button>
      </div>
    </div>
  );
}

function NavRow({ icon, variant, label, sub, value, badge, badgeKind, onClick }) {
  return (
    <button className="set-row btn" onClick={onClick}>
      <RowIcon icon={icon} variant={variant} />
      <div className="set-row__t"><b>{label}</b>{sub && <small>{sub}</small>}</div>
      <div className="set-row__ctrl">
        {value && <span className="set-val">{value}</span>}
        {badge && <span className={'set-badge ' + (badgeKind || 'off')}>{badge}</span>}
        <ion-icon className="set-chev" name="chevron-forward-outline"></ion-icon>
      </div>
    </button>
  );
}

/* ============================================================
   DESKTOP / TABLET — chrome
   ============================================================ */
function SetRail() {
  const items = [
    { icon: 'cart-outline', label: 'Register' },
    { icon: 'receipt-outline', label: 'Orders' },
    { icon: 'pricetags-outline', label: 'Products' },
    { icon: 'people-outline', label: 'Customers' },
    { icon: 'grid-outline', label: 'Apps' },
    { icon: 'bar-chart-outline', label: 'Reports' },
  ];
  return (
    <nav className="pa-rail">
      <div className="pa-rail__mark"><ion-icon name="storefront"></ion-icon></div>
      {items.map((it) => (
        <button key={it.label} className="pa-rail__item"><ion-icon name={it.icon}></ion-icon>{it.label}</button>
      ))}
      <div className="pa-rail__spacer" />
      <button className="pa-rail__item active"><ion-icon name="settings-outline"></ion-icon>Settings</button>
    </nav>
  );
}

function SetTopbar({ section }) {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="settings-outline"></ion-icon>
        Settings
        <ion-icon name="chevron-forward-outline"></ion-icon>
        <b>{section.label}</b>
      </div>
      <div className="pa-topbar__right">
        <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
        <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
        <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* ---- left section nav ---- */
function SettingsNav({ sections, active, onSelect, profile, onSignOut }) {
  return (
    <aside className="set-nav">
      <div className="set-profcard">
        <SetAvatar profile={profile} size={40} />
        <div className="set-prof-t">
          <b>{profile.name}</b>
          <span>{profile.email}</span>
        </div>
      </div>
      <div className="set-navlist">
        {sections.map((s) => (
          <button key={s.id} className={'set-navitem' + (active === s.id ? ' active' : '')} onClick={() => onSelect(s.id)}>
            <ion-icon name={s.icon}></ion-icon>{s.label}
            <ion-icon className="chev" name="chevron-forward-outline"></ion-icon>
          </button>
        ))}
      </div>
      <div className="set-nav__foot">
        <button className="set-signout" onClick={onSignOut}><ion-icon name="log-out-outline"></ion-icon>Sign out</button>
      </div>
    </aside>
  );
}

/* ============================================================
   PANELS (one per section)
   ============================================================ */
function PanelHead({ section }) {
  return <div className="set-panel__head"><h2>{section.label}</h2><p>{section.desc}</p></div>;
}

function ProfilePanel({ profile, draft, onField, onSave, dirty, opt }) {
  return (
    <div className="set-panel">
      <div className="set-prof-hero">
        <SetAvatar profile={profile} size={84} />
        <div className="set-prof-hero__t">
          <h3>{draft.name || 'Your name'}</h3>
          <div className="sub">{draft.email}</div>
          <span className="rolepill"><ion-icon name="shield-checkmark"></ion-icon>{profile.role} · {profile.store}</span>
        </div>
        <button className="set-prof-hero__photobtn" onClick={() => alert('Upload a new profile photo.')}><ion-icon name="camera-outline"></ion-icon>Change photo</button>
      </div>

      <SetGroup label="Account">
        <div className="set-textrow"><label>Full name</label><input value={draft.name} onChange={(e) => onField('name', e.target.value)} /></div>
        <div className="set-textrow"><label>Email address</label><input value={draft.email} onChange={(e) => onField('email', e.target.value)} /></div>
        <div className="set-textrow"><label>Phone</label><input value={draft.phone} onChange={(e) => onField('phone', e.target.value)} /></div>
      </SetGroup>

      <SetGroup label="Role">
        <NavRow icon="shield-checkmark-outline" variant="tint" label="Owner" sub="Full access to every register and setting" badge="You" badgeKind="on" onClick={() => alert('Roles are managed in Users & Roles.')} />
      </SetGroup>

      <div className="set-savebar">
        <span className="note"><ion-icon name="cloud-done-outline"></ion-icon>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <span className="spacer" />
        <button className="set-save" onClick={onSave} disabled={!dirty}><ion-icon name="checkmark-outline"></ion-icon>Save changes</button>
      </div>
    </div>
  );
}

function GeneralPanel({ section, s, set, opt }) {
  return (
    <div className="set-panel">
      <PanelHead section={section} />
      <SetGroup label="Language & region">
        <SelectRow icon="language-outline" label="Language" sub="Display language for this register" value={s.language} options={opt.language} onChange={(v) => set('language', v)} />
        <SelectRow icon="flag-outline" label="Country / region" value={s.region} options={opt.region} onChange={(v) => set('region', v)} />
        <SelectRow icon="time-outline" label="Time zone" value={s.timezone} options={opt.timezone} onChange={(v) => set('timezone', v)} />
      </SetGroup>
      <SetGroup label="Date & time">
        <SelectRow icon="calendar-outline" label="Date format" value={s.dateFormat} options={opt.dateFormat} onChange={(v) => set('dateFormat', v)} />
        <SelectRow icon="today-outline" label="First day of week" value={s.firstDay} options={opt.firstDay} onChange={(v) => set('firstDay', v)} />
        <ToggleRow icon="volume-medium-outline" label="Interface sounds" sub="Play a tick on scan and a chime on payment" value={s.sounds} onChange={(v) => set('sounds', v)} />
      </SetGroup>
    </div>
  );
}

function StorePanel({ section, s, set, opt }) {
  return (
    <div className="set-panel">
      <PanelHead section={section} />
      <SetGroup label="Business">
        <div className="set-textrow"><label>Store name</label><input value={s.storeName} onChange={(e) => set('storeName', e.target.value)} /></div>
        <SelectRow icon="cash-outline" label="Currency" sub="Used across tickets, receipts, and reports" value={s.currency} options={opt.currency} onChange={(v) => set('currency', v)} />
      </SetGroup>
      <SetGroup label="Tax">
        <SelectRow icon="calculator-outline" label="Default tax rate" value={s.taxRate} options={opt.taxRate} onChange={(v) => set('taxRate', v)} />
        <SelectRow icon="pricetag-outline" label="Tax handling" value={s.taxMode} options={opt.taxMode} onChange={(v) => set('taxMode', v)} />
      </SetGroup>
      <SetGroup label="Receipts">
        <SelectRow icon="receipt-outline" label="Receipt format" value={s.receipt} options={opt.receipt} onChange={(v) => set('receipt', v)} />
        <ToggleRow icon="image-outline" label="Show store logo" sub="Print the Koomzo mark at the top of receipts" value={s.showLogo} onChange={(v) => set('showLogo', v)} />
        <div className="set-textrow"><label>Receipt footer message</label><textarea rows={2} value={s.receiptFooter} onChange={(e) => set('receiptFooter', e.target.value)} /></div>
      </SetGroup>
    </div>
  );
}

function PaymentsPanel({ section, s, set, opt, methods }) {
  return (
    <div className="set-panel">
      <PanelHead section={section} />
      <SetGroup label="Accepted tenders">
        {methods.map((m) => (
          <ToggleRow key={m.id} icon={m.icon} label={m.label} sub={m.sub} value={s['pay_' + m.id]} onChange={(v) => set('pay_' + m.id, v)} />
        ))}
      </SetGroup>
      <SetGroup label="At checkout">
        <ToggleRow icon="cash-outline" variant="tint" label="Prompt for tips" sub="Show tip presets on the payment screen" value={s.tipping} onChange={(v) => set('tipping', v)} />
        <SelectRow icon="swap-vertical-outline" label="Cash rounding" sub="Round cash totals to the nearest unit" value={s.rounding} options={opt.rounding} onChange={(v) => set('rounding', v)} />
        <NavRow icon="hardware-chip-outline" label="Card terminals" sub="Pair and manage payment hardware" value="2 paired" onClick={() => alert('Manage paired card terminals.')} />
      </SetGroup>
    </div>
  );
}

function NotifyPanel({ section, s, set }) {
  return (
    <div className="set-panel">
      <PanelHead section={section} />
      <SetGroup label="Operations">
        <ToggleRow icon="receipt-outline" label="New orders" sub="Alert when an order comes in online" value={s.notif_orders} onChange={(v) => set('notif_orders', v)} />
        <ToggleRow icon="cube-outline" variant="warn" label="Low stock" sub="When an item drops below its reorder point" value={s.notif_lowstock} onChange={(v) => set('notif_lowstock', v)} />
        <ToggleRow icon="arrow-undo-outline" label="Refunds & voids" sub="When a cashier refunds or voids a ticket" value={s.notif_refunds} onChange={(v) => set('notif_refunds', v)} />
      </SetGroup>
      <SetGroup label="Digests">
        <ToggleRow icon="mail-outline" label="Daily sales summary" sub="Emailed end-of-day totals at close" value={s.notif_summary} onChange={(v) => set('notif_summary', v)} />
        <ToggleRow icon="megaphone-outline" label="Product news & tips" sub="Occasional updates from Koomzo" value={s.notif_marketing} onChange={(v) => set('notif_marketing', v)} />
      </SetGroup>
      <SetGroup label="Delivery">
        <ToggleRow icon="notifications-outline" label="Sound alerts" sub="Play a sound for high-priority alerts" value={s.notif_sound} onChange={(v) => set('notif_sound', v)} />
      </SetGroup>
    </div>
  );
}

function SecurityPanel({ section, s, set, opt }) {
  return (
    <div className="set-panel">
      <PanelHead section={section} />
      <SetGroup label="Sign-in">
        <NavRow icon="key-outline" label="Change password" sub="Last changed 3 months ago" onClick={() => alert('Open the change-password flow.')} />
        <ToggleRow icon="shield-checkmark-outline" variant="tint" label="Two-factor authentication" sub="Require a code from your phone at sign-in" value={s.twoFactor} onChange={(v) => set('twoFactor', v)} />
      </SetGroup>
      <SetGroup label="Register lock">
        <ToggleRow icon="lock-closed-outline" label="PIN lock" sub="Require a 4-digit PIN to switch cashiers" value={s.pinLock} onChange={(v) => set('pinLock', v)} />
        <SelectRow icon="timer-outline" label="Auto-lock after" value={s.autoLock} options={['1 minute', '5 minutes', '15 minutes', 'Never']} onChange={(v) => set('autoLock', v)} />
      </SetGroup>
      <SetGroup label="Sessions">
        <NavRow icon="phone-portrait-outline" label="Active devices" sub="3 devices signed in to this account" value="Manage" onClick={() => alert('Review and revoke active sessions.')} />
        <NavRow icon="document-text-outline" label="Sign-in activity" sub="Recent logins and locations" onClick={() => alert('View the sign-in activity log.')} />
      </SetGroup>
    </div>
  );
}

function HelpPanel({ section }) {
  return (
    <div className="set-panel">
      <PanelHead section={section} />
      <SetGroup label="Get help">
        <NavRow icon="help-circle-outline" label="Help center" sub="Guides and how-tos for every feature" onClick={() => alert('Open the Koomzo help center.')} />
        <NavRow icon="chatbubbles-outline" label="Contact support" sub="Chat with the Koomzo team" value="Online" badge="24/7" badgeKind="on" onClick={() => alert('Start a support conversation.')} />
        <NavRow icon="bulb-outline" label="Frequent questions" sub="Answers to common setup questions" onClick={() => alert('Browse frequent questions.')} />
      </SetGroup>
      <SetGroup label="Feedback">
        <NavRow icon="star-outline" variant="warn" label="Rate Koomzo POS" sub="Tell us how we're doing" onClick={() => alert('Leave a rating.')} />
        <NavRow icon="document-text-outline" label="Terms & privacy" onClick={() => alert('Open terms and privacy policy.')} />
      </SetGroup>
      <div className="set-about">
        <div className="mk"><ion-icon name="storefront"></ion-icon></div>
        <div className="t">
          <b>koomzo<span> · POS</span></b>
          <small>Version 7.4.0 · Build 1180</small>
        </div>
        <span className="upd"><ion-icon name="checkmark-circle"></ion-icon>Up to date</span>
      </div>
    </div>
  );
}

function SettingsPanel(props) {
  switch (props.section.id) {
    case 'profile':  return <ProfilePanel {...props} />;
    case 'general':  return <GeneralPanel {...props} />;
    case 'store':    return <StorePanel {...props} />;
    case 'payments': return <PaymentsPanel {...props} />;
    case 'notify':   return <NotifyPanel {...props} />;
    case 'security': return <SecurityPanel {...props} />;
    case 'help':     return <HelpPanel {...props} />;
    default:         return null;
  }
}

Object.assign(window, {
  SetAvatar, SetGroup, SelectRow, ToggleRow, NavRow, RowIcon,
  SetRail, SetTopbar, SettingsNav, PanelHead, SettingsPanel,
  ProfilePanel, GeneralPanel, StorePanel, PaymentsPanel, NotifyPanel, SecurityPanel, HelpPanel,
});
