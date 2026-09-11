/* Koomzo POS — Form Builder (multilingual): field registry + preview.
   Field-type names are i18n (UI chrome); field default content is authored
   as i18n values via mk(en, fr) so newly-dropped fields arrive pre-translated.
   Reads i18n helpers from window (builder-i18n.jsx loads first). */
const { mk: _mk, tx: _tx, txf: _txf, isI18n: _isI18n } = window;

/* ---- field type registry (palette source of truth) ---- */
const FB_TYPES = {
  text:     { name: { en: 'Text',      fr: 'Texte' },        icon: 'text-outline',            group: 'basic',  defaults: { label: _mk('Text field', 'Champ texte'), placeholder: _mk('Enter text…', 'Saisir du texte…') } },
  email:    { name: { en: 'Email',     fr: 'E-mail' },       icon: 'mail-outline',            group: 'basic',  defaults: { label: _mk('Email address', 'Adresse e-mail'), placeholder: _mk('name@email.com', 'nom@email.com') } },
  number:   { name: { en: 'Number',    fr: 'Nombre' },       icon: 'calculator-outline',      group: 'basic',  defaults: { label: _mk('Number', 'Nombre'), placeholder: _mk('0', '0') } },
  phone:    { name: { en: 'Phone',     fr: 'Téléphone' },    icon: 'call-outline',            group: 'basic',  defaults: { label: _mk('Phone', 'Téléphone'), placeholder: _mk('+237 6 00 00 00 00', '+237 6 00 00 00 00') } },
  textarea: { name: { en: 'Paragraph', fr: 'Paragraphe' },   icon: 'reorder-four-outline',    group: 'basic',  defaults: { label: _mk('Message', 'Message'), placeholder: _mk('Type here…', 'Écrivez ici…') } },
  select:   { name: { en: 'Dropdown',  fr: 'Liste' },        icon: 'chevron-down-circle-outline', group: 'choice', defaults: { label: _mk('Choose one', 'Choisir une option'), options: [{ label: _mk('Option 1', 'Option 1') }, { label: _mk('Option 2', 'Option 2') }, { label: _mk('Option 3', 'Option 3') }] } },
  radio:    { name: { en: 'Radio',     fr: 'Boutons radio' },icon: 'radio-button-on-outline', group: 'choice', defaults: { label: _mk('Pick one', 'Choisir une option'), options: [{ label: _mk('Option A', 'Option A') }, { label: _mk('Option B', 'Option B') }] } },
  checkbox: { name: { en: 'Checkbox',  fr: 'Cases à cocher' },icon: 'checkbox-outline',       group: 'choice', defaults: { label: _mk('Select all that apply', "Cochez tout ce qui s'applique"), options: [{ label: _mk('Choice 1', 'Choix 1') }, { label: _mk('Choice 2', 'Choix 2') }] } },
  toggle:   { name: { en: 'Toggle',    fr: 'Interrupteur' }, icon: 'toggle-outline',          group: 'choice', defaults: { label: _mk('Enable option', "Activer l'option"), help: _mk('Off by default', 'Désactivé par défaut') } },
  date:     { name: { en: 'Date',      fr: 'Date' },         icon: 'calendar-outline',        group: 'advanced', defaults: { label: _mk('Select date', 'Choisir une date'), placeholder: _mk('mm / dd / yyyy', 'jj / mm / aaaa') } },
  time:     { name: { en: 'Time',      fr: 'Heure' },        icon: 'time-outline',            group: 'advanced', defaults: { label: _mk('Select time', 'Choisir une heure'), placeholder: _mk('--:--', '--:--') } },
  range:    { name: { en: 'Slider',    fr: 'Curseur' },      icon: 'options-outline',         group: 'advanced', defaults: { label: _mk('Amount', 'Montant') } },
  file:     { name: { en: 'Upload',    fr: 'Fichier' },      icon: 'cloud-upload-outline',    group: 'advanced', defaults: { label: _mk('Attach file', 'Joindre un fichier'), help: _mk('PDF, PNG or JPG up to 10MB', 'PDF, PNG ou JPG jusqu’à 10 Mo') } },
  rating:   { name: { en: 'Rating',    fr: 'Évaluation' },   icon: 'star-outline',            group: 'advanced', defaults: { label: _mk('Rate your experience', 'Évaluez votre expérience') } },
  heading:  { name: { en: 'Heading',   fr: 'Titre' },        icon: 'text',                    group: 'layout', defaults: { label: _mk('Section title', 'Titre de section'), help: _mk('Optional description for this section.', 'Description facultative de cette section.') } },
  divider:  { name: { en: 'Divider',   fr: 'Séparateur' },   icon: 'remove-outline',          group: 'layout', defaults: { label: _mk('Divider', 'Séparateur') } },
  paragraph:{ name: { en: 'Text block',fr: 'Bloc de texte' },icon: 'document-text-outline',   group: 'layout', defaults: { label: _mk('Static text', 'Texte statique'), help: _mk('Add instructions or terms for the person filling out this form.', 'Ajoutez des instructions ou des conditions pour la personne qui remplit ce formulaire.') } },
};
const typeName = (type, ui) => (FB_TYPES[type].name[ui] || FB_TYPES[type].name.en);

const FB_GROUPS = [
  { key: 'basic',    uiKey: 'g_basic' },
  { key: 'choice',   uiKey: 'g_choice' },
  { key: 'advanced', uiKey: 'g_advanced' },
  { key: 'layout',   uiKey: 'g_layout' },
];

let fbId = 100;
const fbNewField = (type) => ({
  id: 'f' + (++fbId),
  type,
  required: false,
  width: 'full',
  ...JSON.parse(JSON.stringify(FB_TYPES[type].defaults)),
});

/* ---- static preview of a field, rendered in `lang`.
   `primary` is the source language; when a value is missing in `lang`,
   it falls back to the primary value and (if `hi`) flags it amber. ---- */
function FbPreview({ f, lang, primary, hi }) {
  const t = f.type;
  /* T() returns a renderable for an i18n value with fallback + highlight */
  const T = (v) => {
    const s = _tx(v, lang);
    if (s) return s;
    const fb = _tx(v, primary);
    if (!fb) return '';
    return hi ? <span className="fb-fallback" title="Falls back to source language">{fb}</span> : fb;
  };
  const txt = (v, dflt) => { const s = _tx(v, lang) || _tx(v, primary); return s || dflt; };

  if (t === 'heading') return <div className="fb-pv-section">{T(f.label) || 'Section'}{_txf(f.help, lang, primary) && <span className="sub">{T(f.help)}</span>}</div>;
  if (t === 'divider') return <div className="fb-pv-divider"></div>;
  if (t === 'paragraph') return <div style={{ font: '400 13.5px/1.6 var(--kz-font-sans)', color: 'var(--kz-muted)' }}>{T(f.help) || T(f.label)}</div>;

  const label = (
    <div className="fb-flabel">{T(f.label) || typeName(t, lang)}{f.required && <span className="req">*</span>}</div>
  );
  let control = null;
  if (['text', 'email', 'number', 'phone'].includes(t))
    control = <div className="fb-pv-input"><ion-icon name={FB_TYPES[t].icon}></ion-icon>{T(f.placeholder) || 'Enter value'}</div>;
  else if (t === 'textarea')
    control = <div className="fb-pv-input area">{T(f.placeholder) || 'Type here…'}</div>;
  else if (t === 'select')
    control = f.source
      ? <div className="fb-pv-input">{(window.dsResolve(window.dsFind(f.source.id), f.source, lang, primary)[0] || {}).label || 'Choose…'}<ion-icon className="chev" name="chevron-down-outline"></ion-icon></div>
      : <div className="fb-pv-input">{(f.options && f.options[0] && T(f.options[0].label)) || 'Choose…'}<ion-icon className="chev" name="chevron-down-outline"></ion-icon></div>;
  else if (t === 'date' || t === 'time')
    control = <div className="fb-pv-input"><ion-icon name={FB_TYPES[t].icon}></ion-icon>{T(f.placeholder)}</div>;
  else if (t === 'radio' || t === 'checkbox')
    control = (
      <div className="fb-pv-opts">
        {(f.source ? window.dsResolve(window.dsFind(f.source.id), f.source, lang, primary).slice(0, 5).map((o) => o.label) : (f.options || []).map((o) => T(o.label))).map((lbl, i) => (
          <div className="fb-pv-opt" key={i}><span className={'box' + (t === 'radio' ? ' radio' : '')}></span>{lbl}</div>
        ))}
      </div>
    );
  else if (t === 'toggle')
    control = <div className="fb-pv-toggle"><span className="sw"></span><span style={{ font: '500 13.5px var(--kz-font-sans)', color: 'var(--kz-ink-2)' }}>{T(f.help) || 'Off'}</span></div>;
  else if (t === 'range')
    control = <div className="fb-pv-range"></div>;
  else if (t === 'file')
    control = <div className="fb-pv-input" style={{ height: 60, borderStyle: 'dashed', justifyContent: 'center', flexDirection: 'column', gap: 2 }}><ion-icon name="cloud-upload-outline" style={{ fontSize: 22 }}></ion-icon><span style={{ fontSize: 12 }}>{lang === 'fr' ? 'Glissez un fichier ou parcourez' : 'Drag a file or browse'}</span></div>;
  else if (t === 'rating')
    control = <div style={{ display: 'flex', gap: 6 }}>{[1, 2, 3, 4, 5].map((i) => <ion-icon key={i} name="star-outline" style={{ fontSize: 24, color: 'var(--kz-warning)' }}></ion-icon>)}</div>;

  return (
    <div className="fb-pv">
      {label}
      {control}
      {f.source && <div className="fb-fhelp" style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--kz-primary)' }}><ion-icon name="server-outline"></ion-icon>{(() => { const d = window.dsFind(f.source.id); return d ? _tx(d.name, lang) || _tx(d.name, primary) : ''; })()}</div>}
      {_txf(f.help, lang, primary) && !['toggle', 'heading', 'paragraph', 'file'].includes(t) && <div className="fb-fhelp">{T(f.help)}</div>}
    </div>
  );
}

Object.assign(window, { FB_TYPES, FB_GROUPS, fbNewField, FbPreview, typeName });
