/* Koomzo POS — Settings: phone surface.
   A blue header + grouped scrolling list, matching the reference layout
   but in the Koomzo language (proper labels, tinted icon tiles, switches). */

function MGroup({ label, children }) {
  return (
    <>
      <div className="setm__label">{label}</div>
      <div className="setm__group">{children}</div>
    </>
  );
}

function MRow({ icon, danger, label, sub, onClick, children }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className="setm__row" onClick={onClick}>
      <div className={'ic' + (danger ? ' danger' : '')}><ion-icon name={icon}></ion-icon></div>
      <div className="tx"><b>{label}</b>{sub && <small>{sub}</small>}</div>
      <div className="rt">{children}</div>
    </Tag>
  );
}

function MSelect({ value, options, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} onClick={(e) => e.stopPropagation()}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function MToggle({ value, onChange }) {
  return <button className={'set-toggle' + (value ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onChange(!value); }}></button>;
}

function MobileSettings({ profile, s, set, opt, methods, onEditProfile, onSignOut }) {
  return (
    <div className="setm">
      <header className="setm__top">
        <button className="back" onClick={() => alert('Back to the register.')}><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h1>Settings</h1>
      </header>

      <div className="setm__scroll">
        <div className="setm__prof">
          <SetAvatar profile={profile} size={56} />
          <div className="pt">
            <b>{profile.name}</b>
            <span>{profile.email}</span>
            <div><button className="edit" onClick={onEditProfile}>Edit profile<ion-icon name="chevron-forward-outline"></ion-icon></button></div>
          </div>
          <button className="out" onClick={onSignOut}><ion-icon name="log-out-outline"></ion-icon></button>
        </div>

        <MGroup label="General">
          <MRow icon="language-outline" label="Language"><MSelect value={s.language} options={opt.language} onChange={(v) => set('language', v)} /></MRow>
          <MRow icon="flag-outline" label="Country / region"><MSelect value={s.region} options={opt.region} onChange={(v) => set('region', v)} /></MRow>
          <MRow icon="time-outline" label="Time zone"><MSelect value={s.timezone} options={opt.timezone} onChange={(v) => set('timezone', v)} /></MRow>
          <MRow icon="volume-medium-outline" label="Interface sounds"><MToggle value={s.sounds} onChange={(v) => set('sounds', v)} /></MRow>
        </MGroup>

        <MGroup label="Store">
          <MRow icon="storefront-outline" label="Store name" onClick={onEditProfile}><span className="v">{s.storeName}</span><ion-icon name="chevron-forward-outline"></ion-icon></MRow>
          <MRow icon="cash-outline" label="Currency"><MSelect value={s.currency} options={opt.currency} onChange={(v) => set('currency', v)} /></MRow>
          <MRow icon="calculator-outline" label="Tax rate"><MSelect value={s.taxRate} options={opt.taxRate} onChange={(v) => set('taxRate', v)} /></MRow>
          <MRow icon="receipt-outline" label="Receipt format"><MSelect value={s.receipt} options={opt.receipt} onChange={(v) => set('receipt', v)} /></MRow>
        </MGroup>

        <MGroup label="Payments">
          {methods.slice(0, 3).map((m) => (
            <MRow key={m.id} icon={m.icon} label={m.label}><MToggle value={s['pay_' + m.id]} onChange={(v) => set('pay_' + m.id, v)} /></MRow>
          ))}
          <MRow icon="cash-outline" label="Prompt for tips"><MToggle value={s.tipping} onChange={(v) => set('tipping', v)} /></MRow>
          <MRow icon="swap-vertical-outline" label="Cash rounding"><MSelect value={s.rounding} options={opt.rounding} onChange={(v) => set('rounding', v)} /></MRow>
        </MGroup>

        <MGroup label="Notifications">
          <MRow icon="receipt-outline" label="New orders"><MToggle value={s.notif_orders} onChange={(v) => set('notif_orders', v)} /></MRow>
          <MRow icon="cube-outline" label="Low stock"><MToggle value={s.notif_lowstock} onChange={(v) => set('notif_lowstock', v)} /></MRow>
          <MRow icon="mail-outline" label="Daily summary"><MToggle value={s.notif_summary} onChange={(v) => set('notif_summary', v)} /></MRow>
          <MRow icon="notifications-outline" label="Sound alerts"><MToggle value={s.notif_sound} onChange={(v) => set('notif_sound', v)} /></MRow>
        </MGroup>

        <MGroup label="Security">
          <MRow icon="key-outline" label="Change password" onClick={() => alert('Open the change-password flow.')}><ion-icon name="chevron-forward-outline"></ion-icon></MRow>
          <MRow icon="shield-checkmark-outline" label="Two-factor auth"><MToggle value={s.twoFactor} onChange={(v) => set('twoFactor', v)} /></MRow>
          <MRow icon="lock-closed-outline" label="PIN lock"><MToggle value={s.pinLock} onChange={(v) => set('pinLock', v)} /></MRow>
        </MGroup>

        <MGroup label="Help & Feedback">
          <MRow icon="help-circle-outline" label="Help center" onClick={() => alert('Open the Koomzo help center.')}><ion-icon name="chevron-forward-outline"></ion-icon></MRow>
          <MRow icon="bulb-outline" label="Frequent questions" onClick={() => alert('Browse frequent questions.')}><ion-icon name="chevron-forward-outline"></ion-icon></MRow>
          <MRow icon="star-outline" label="Rate Koomzo POS" onClick={() => alert('Leave a rating.')}><ion-icon name="chevron-forward-outline"></ion-icon></MRow>
        </MGroup>

        <div className="setm__group" style={{ marginTop: 20 }}>
          <MRow icon="log-out-outline" danger label="Sign out" onClick={onSignOut}><ion-icon name="chevron-forward-outline"></ion-icon></MRow>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0 4px', font: '500 12px var(--kz-font-num)', color: 'var(--kz-muted-3)' }}>
          koomzo · POS · v7.4.0 (1180)
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MGroup, MRow, MSelect, MToggle, MobileSettings });
