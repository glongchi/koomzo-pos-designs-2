/* Koomzo POS — Forms kit: reusable form-control components.
   Each mirrors an Ionic form control (ion-input, ion-textarea, ion-select,
   ion-checkbox, ion-radio, ion-toggle, ion-range, ion-datetime, ion-segment,
   ion-searchbar, ion-progress-bar) in the Koomzo visual language.
   Exported to window for the app file to consume. */
const { useState: kfUseState, useRef: kfUseRef } = React;

const KF_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const KF_DOW = ['S','M','T','W','T','F','S'];

/* ---------- field shell: label + control + note ---------- */
function KfField({ label, required, optional, note, noteErr, children }) {
  return (
    <div className="kf-field">
      {label && (
        <div className="kf-label">
          {label}{required && <span className="req">*</span>}
          {optional && <span className="opt">Optional</span>}
        </div>
      )}
      {children}
      {note && (
        <div className={'kf-note' + (noteErr ? ' err' : '')}>
          <ion-icon name={noteErr ? 'alert-circle-outline' : 'information-circle-outline'}></ion-icon>{note}
        </div>
      )}
    </div>
  );
}

/* ---------- text input (with optional leading icon / $ affix / suffix) ---------- */
function KfInput({ value, onChange, placeholder, type = 'text', icon, affix, suffix, mono }) {
  const wrapCls = 'kf-inwrap' + (icon ? ' has-ic' : '') + (affix ? ' has-affix' : '');
  return (
    <div className={wrapCls}>
      {icon && <ion-icon name={icon}></ion-icon>}
      {affix && <span className="kf-affix">{affix}</span>}
      <input className={'kf-input' + (mono ? ' mono' : '')} type={type} value={value}
        placeholder={placeholder} onChange={(e) => onChange && onChange(e.target.value)} />
      {suffix && <span className="kf-suffix">{suffix}</span>}
    </div>
  );
}

/* ---------- textarea with char counter ---------- */
function KfTextarea({ value, onChange, placeholder, max = 240 }) {
  return (
    <>
      <textarea className="kf-input" value={value} placeholder={placeholder} maxLength={max}
        onChange={(e) => onChange && onChange(e.target.value)} />
      <div className="kf-counter">{(value || '').length} / {max}</div>
    </>
  );
}

/* ---------- select ---------- */
function KfSelect({ value, onChange, options, placeholder }) {
  return (
    <select className="kf-input" value={value} onChange={(e) => onChange && onChange(e.target.value)}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

/* ---------- searchbar ---------- */
function KfSearch({ value, onChange, placeholder }) {
  return (
    <div className="kf-search">
      <ion-icon name="search-outline"></ion-icon>
      <input value={value} placeholder={placeholder || 'Search'} onChange={(e) => onChange && onChange(e.target.value)} />
      {value && <button className="clr" onClick={() => onChange('')}><ion-icon name="close-circle"></ion-icon></button>}
    </div>
  );
}

/* ---------- segment (single-select pill row) ---------- */
function KfSegment({ value, onChange, options }) {
  return (
    <div className="kf-segment">
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        const ic = typeof o === 'object' ? o.icon : null;
        return (
          <button key={v} className={value === v ? 'active' : ''} onClick={() => onChange && onChange(v)}>
            {ic && <ion-icon name={ic}></ion-icon>}{l}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- checkbox list (multi) ---------- */
function KfCheckList({ value = [], onChange, options }) {
  const toggle = (v) => {
    const set = new Set(value);
    set.has(v) ? set.delete(v) : set.add(v);
    onChange && onChange([...set]);
  };
  return (
    <div className="kf-options">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} className={'kf-opt' + (on ? ' on' : '')} onClick={() => toggle(o.value)}>
            <span className="kf-opt__box"><ion-icon name="checkmark-outline"></ion-icon></span>
            <span className="kf-opt__t"><b>{o.label}</b>{o.desc && <span>{o.desc}</span>}</span>
            {o.price && <span className="kf-opt__price">{o.price}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- radio group (single) ---------- */
function KfRadioList({ value, onChange, options }) {
  return (
    <div className="kf-options">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} className={'kf-opt' + (on ? ' on' : '')} onClick={() => onChange && onChange(o.value)}>
            <span className="kf-opt__radio"></span>
            <span className="kf-opt__t"><b>{o.label}</b>{o.desc && <span>{o.desc}</span>}</span>
            {o.price && <span className="kf-opt__price">{o.price}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- toggle row ---------- */
function KfToggleRow({ value, onChange, title, desc, purple }) {
  return (
    <div className="kf-toggrow">
      <div className="kf-toggrow__t"><b>{title}</b>{desc && <span>{desc}</span>}</div>
      <button className={'kf-switch' + (value ? ' on' : '') + (purple ? ' purple' : '')}
        role="switch" aria-checked={!!value} onClick={() => onChange && onChange(!value)}><i></i></button>
    </div>
  );
}

/* ---------- range slider ---------- */
function KfRange({ value, onChange, min = 0, max = 100, step = 1, unit = '', label }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="kf-range">
      <div className="kf-range__top">
        <span style={{ font: '500 13px var(--kz-font-sans)', color: 'var(--kz-muted)' }}>{label}</span>
        <span className="kf-range__val">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        style={{ '--kf-pct': pct + '%' }}
        onChange={(e) => onChange && onChange(Number(e.target.value))} />
      <div className="kf-range__ticks"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

/* ---------- progress bar ---------- */
function KfProgress({ value, label }) {
  return (
    <div className="kf-progress">
      <div className="kf-progress__top"><span className="k">{label}</span><span className="v">{Math.round(value)}%</span></div>
      <div className="kf-progress__track"><div className="kf-progress__fill" style={{ width: value + '%' }}></div></div>
    </div>
  );
}

/* ---------- datetime: trigger + inline calendar popover ---------- */
function KfDatetime({ value, onChange, placeholder, withTime }) {
  const [open, setOpen] = kfUseState(false);
  const today = new Date();
  const init = value ? new Date(value) : today;
  const [view, setView] = kfUseState({ y: init.getFullYear(), m: init.getMonth() });
  const sel = value ? new Date(value) : null;

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const prevDays = new Date(view.y, view.m, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push({ d: prevDays - first + 1 + i, muted: true });
  for (let d = 1; d <= days; d++) cells.push({ d, muted: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - (first + days) + 1, muted: true });

  const fmt = (dt) => dt ? `${KF_MONTHS[dt.getMonth()].slice(0,3)} ${dt.getDate()}, ${dt.getFullYear()}` : null;
  const isSel = (d) => sel && !d.muted && sel.getFullYear() === view.y && sel.getMonth() === view.m && sel.getDate() === d.d;
  const isToday = (d) => !d.muted && today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d.d;
  const shift = (dir) => setView((v) => { let m = v.m + dir, y = v.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  const pick = (d) => { if (d.muted) return; const dt = new Date(view.y, view.m, d.d); onChange && onChange(dt.toISOString()); };

  const time = sel || today;
  const hour = time.getHours();

  return (
    <div className="kf-dt">
      <button className={'kf-dt__trigger' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)}>
        <ion-icon name="calendar-outline"></ion-icon>
        {value ? <span>{fmt(sel)}{withTime && ` · ${String(hour).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`}</span>
               : <span className="ph">{placeholder || 'Select date'}</span>}
        <ion-icon className="chev" name={open ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
      </button>
      {open && (
        <div className="kf-cal">
          <div className="kf-cal__head">
            <b>{KF_MONTHS[view.m]} {view.y}</b>
            <div className="kf-cal__nav">
              <button onClick={() => shift(-1)}><ion-icon name="chevron-back-outline"></ion-icon></button>
              <button onClick={() => shift(1)}><ion-icon name="chevron-forward-outline"></ion-icon></button>
            </div>
          </div>
          <div className="kf-cal__grid">
            {KF_DOW.map((d, i) => <div className="kf-cal__dow" key={'h' + i}>{d}</div>)}
            {cells.map((c, i) => (
              <button key={i} className={'kf-cal__day' + (c.muted ? ' muted' : '') + (isToday(c) ? ' today' : '') + (isSel(c) ? ' sel' : '')}
                onClick={() => pick(c)}>{c.d}</button>
            ))}
          </div>
          {withTime && (
            <div className="kf-cal__time">
              <ion-icon name="time-outline" style={{ fontSize: 16, color: 'var(--kz-muted)' }}></ion-icon>
              <span className="lbl">Time</span>
              <select className="kf-timesel" defaultValue={String(hour).padStart(2,'0')}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2,'0')).map((h) => <option key={h}>{h}</option>)}</select>
              <select className="kf-timesel" defaultValue={String(time.getMinutes()).padStart(2,'0')}>{['00','15','30','45'].map((m) => <option key={m}>{m}</option>)}</select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- multi-step stepper (breadcrumb) ---------- */
function KfStepper({ steps, current }) {
  return (
    <div className="kf-stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={'kf-step' + (i === current ? ' active' : '') + (i < current ? ' done' : '')}>
            <div className="kf-step__num">{i < current ? <ion-icon name="checkmark-outline"></ion-icon> : i + 1}</div>
            <div className="kf-step__t">
              <span className="lbl">{s.label}</span>
              <span className="meta">Step {i + 1}</span>
            </div>
          </div>
          {i < steps.length - 1 && <div className={'kf-step__line' + (i < current ? ' filled' : '')}></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, {
  KfField, KfInput, KfTextarea, KfSelect, KfSearch, KfSegment,
  KfCheckList, KfRadioList, KfToggleRow, KfRange, KfProgress,
  KfDatetime, KfStepper, KF_MONTHS,
});
