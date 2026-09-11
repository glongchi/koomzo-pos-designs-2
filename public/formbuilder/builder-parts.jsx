/* Koomzo POS — Form Builder: field registry + preview renderers.
   Each field type maps to an Ionic-style control. Exported to window. */

/* ---- field type registry (palette source of truth) ---- */
const FB_TYPES = {
  text:     { label: 'Text',        icon: 'text-outline',            group: 'basic',  defaults: { label: 'Text field', placeholder: 'Enter text…' } },
  email:    { label: 'Email',       icon: 'mail-outline',            group: 'basic',  defaults: { label: 'Email address', placeholder: 'name@email.com' } },
  number:   { label: 'Number',      icon: 'calculator-outline',      group: 'basic',  defaults: { label: 'Number', placeholder: '0' } },
  phone:    { label: 'Phone',       icon: 'call-outline',            group: 'basic',  defaults: { label: 'Phone', placeholder: '+237 6 00 00 00 00' } },
  textarea: { label: 'Paragraph',   icon: 'reorder-four-outline',    group: 'basic',  defaults: { label: 'Message', placeholder: 'Type here…' } },
  select:   { label: 'Dropdown',    icon: 'chevron-down-circle-outline', group: 'choice', defaults: { label: 'Choose one', options: [{ label: 'Option 1' }, { label: 'Option 2' }, { label: 'Option 3' }] } },
  radio:    { label: 'Radio',       icon: 'radio-button-on-outline', group: 'choice', defaults: { label: 'Pick one', options: [{ label: 'Option A' }, { label: 'Option B' }] } },
  checkbox: { label: 'Checkbox',    icon: 'checkbox-outline',        group: 'choice', defaults: { label: 'Select all that apply', options: [{ label: 'Choice 1' }, { label: 'Choice 2' }] } },
  toggle:   { label: 'Toggle',      icon: 'toggle-outline',          group: 'choice', defaults: { label: 'Enable option', help: 'Off by default' } },
  date:     { label: 'Date',        icon: 'calendar-outline',        group: 'advanced', defaults: { label: 'Select date', placeholder: 'mm / dd / yyyy' } },
  time:     { label: 'Time',        icon: 'time-outline',            group: 'advanced', defaults: { label: 'Select time', placeholder: '--:--' } },
  range:    { label: 'Slider',      icon: 'options-outline',         group: 'advanced', defaults: { label: 'Amount' } },
  file:     { label: 'Upload',      icon: 'cloud-upload-outline',    group: 'advanced', defaults: { label: 'Attach file', help: 'PDF, PNG or JPG up to 10MB' } },
  rating:   { label: 'Rating',      icon: 'star-outline',            group: 'advanced', defaults: { label: 'Rate your experience' } },
  heading:  { label: 'Heading',     icon: 'text',                    group: 'layout', defaults: { label: 'Section title', help: 'Optional description for this section.' } },
  divider:  { label: 'Divider',     icon: 'remove-outline',          group: 'layout', defaults: { label: 'Divider' } },
  paragraph:{ label: 'Text block',  icon: 'document-text-outline',   group: 'layout', defaults: { label: 'Static text', help: 'Add instructions or terms for the person filling out this form.' } },
};

const FB_GROUPS = [
  { key: 'basic',    label: 'Basic fields' },
  { key: 'choice',   label: 'Choice fields' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'layout',   label: 'Layout' },
];

let fbId = 100;
const fbNewField = (type) => ({
  id: 'f' + (++fbId),
  type,
  required: false,
  width: 'full',
  ...JSON.parse(JSON.stringify(FB_TYPES[type].defaults)),
});

/* ---- static preview of a field (non-interactive look-alike) ---- */
function FbPreview({ f }) {
  const t = f.type;
  if (t === 'heading') return <div className="fb-pv-section">{f.label || 'Section title'}{f.help && <span className="sub">{f.help}</span>}</div>;
  if (t === 'divider') return <div className="fb-pv-divider"></div>;
  if (t === 'paragraph') return <div style={{ font: '400 13.5px/1.6 var(--kz-font-sans)', color: 'var(--kz-muted)' }}>{f.help || f.label}</div>;

  const label = (
    <div className="fb-flabel">{f.label || FB_TYPES[t].label}{f.required && <span className="req">*</span>}</div>
  );
  let control = null;
  if (['text', 'email', 'number', 'phone'].includes(t))
    control = <div className="fb-pv-input"><ion-icon name={FB_TYPES[t].icon}></ion-icon>{f.placeholder || 'Enter value'}</div>;
  else if (t === 'textarea')
    control = <div className="fb-pv-input area">{f.placeholder || 'Type here…'}</div>;
  else if (t === 'select')
    control = <div className="fb-pv-input">{(f.options && f.options[0] && f.options[0].label) || 'Choose…'}<ion-icon className="chev" name="chevron-down-outline"></ion-icon></div>;
  else if (t === 'date' || t === 'time')
    control = <div className="fb-pv-input"><ion-icon name={FB_TYPES[t].icon}></ion-icon>{f.placeholder}</div>;
  else if (t === 'radio' || t === 'checkbox')
    control = (
      <div className="fb-pv-opts">
        {(f.options || []).map((o, i) => (
          <div className="fb-pv-opt" key={i}><span className={'box' + (t === 'radio' ? ' radio' : '')}></span>{o.label}</div>
        ))}
      </div>
    );
  else if (t === 'toggle')
    control = <div className="fb-pv-toggle"><span className="sw"></span><span style={{ font: '500 13.5px var(--kz-font-sans)', color: 'var(--kz-ink-2)' }}>{f.help || 'Off'}</span></div>;
  else if (t === 'range')
    control = <div className="fb-pv-range"></div>;
  else if (t === 'file')
    control = <div className="fb-pv-input" style={{ height: 60, borderStyle: 'dashed', justifyContent: 'center', flexDirection: 'column', gap: 2 }}><ion-icon name="cloud-upload-outline" style={{ fontSize: 22 }}></ion-icon><span style={{ fontSize: 12 }}>Drag a file or browse</span></div>;
  else if (t === 'rating')
    control = <div style={{ display: 'flex', gap: 6 }}>{[1,2,3,4,5].map((i) => <ion-icon key={i} name="star-outline" style={{ fontSize: 24, color: 'var(--kz-warning)' }}></ion-icon>)}</div>;

  return (
    <div className="fb-pv">
      {label}
      {control}
      {f.help && !['toggle','heading','paragraph','file'].includes(t) && <div className="fb-fhelp">{f.help}</div>}
    </div>
  );
}

Object.assign(window, { FB_TYPES, FB_GROUPS, fbNewField, FbPreview });
