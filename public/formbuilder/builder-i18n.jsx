/* Koomzo POS — Form Builder · internationalization layer.
   Scales to N languages: add an entry to LANGS and a block to UI.
   Everything authored in the builder (field labels, placeholders, help,
   options, the form name, step titles) is stored as an i18n value:
       { en: 'Full name', fr: 'Nom complet' }
   Helpers below read/write those values for the active language and fall
   back to the primary language when a translation is missing. */

/* ---- supported languages (ordered; primary is whichever tweak picks) ---- */
const LANGS = [
  { code: 'en', short: 'EN', native: 'English',  name: { en: 'English', fr: 'Anglais' } },
  { code: 'fr', short: 'FR', native: 'Français', name: { en: 'French',  fr: 'Français' } },
  /* to add Spanish later: { code:'es', short:'ES', native:'Español', name:{en:'Spanish',fr:'Espagnol',es:'Español'} } */
];
const langName = (code, ui) => { const l = LANGS.find((x) => x.code === code); return l ? (l.name[ui] || l.native) : code; };

/* ---- i18n value helpers ---- */
const isI18n = (v) => v && typeof v === 'object' && !Array.isArray(v);
const mk = (en, fr) => ({ en: en || '', fr: fr || '' });           // build an i18n value
const tx = (v, lang) => (isI18n(v) ? (v[lang] || '') : (v || ''));  // raw value for lang (no fallback)
const txf = (v, lang, primary) => tx(v, lang) || tx(v, primary);    // value with fallback to primary
const setLangVal = (v, lang, val) => ({ ...(isI18n(v) ? v : {}), [lang]: val });

/* translatable keys on a field (text props); options handled separately */
const FIELD_TX_KEYS = ['label', 'placeholder', 'help'];

/* does `field` still need a translation for `lang`, given `primary` as source? */
function fieldMissing(field, lang, primary) {
  if (lang === primary) return false;
  for (const k of FIELD_TX_KEYS) {
    const v = field[k];
    if (isI18n(v) && tx(v, primary).trim() && !tx(v, lang).trim()) return true;
  }
  if (Array.isArray(field.options)) {
    for (const o of field.options) {
      if (isI18n(o.label) && tx(o.label, primary).trim() && !tx(o.label, lang).trim()) return true;
    }
  }
  return false;
}

/* ---- UI chrome strings (the builder itself) ---- */
const UI = {
  en: {
    formBuilder: 'Form Builder', multilingual: 'Multilingual', desktop: 'Desktop', tablet: 'Tablet',
    fields: 'Fields', properties: 'Properties',
    g_basic: 'Basic fields', g_choice: 'Choice fields', g_advanced: 'Advanced', g_layout: 'Layout',
    dragHint: 'Drag a field onto the canvas, or double-click to add.',
    noFieldSelected: 'No field selected',
    selectFieldHint: 'Select a field on the canvas to edit its label, options, and rules.',
    label: 'Label', textLbl: 'Text', placeholder: 'Placeholder', helpText: 'Help text',
    helpHint: 'Optional hint shown under the field', bodyText: 'Body text',
    options: 'Options', addOption: 'Add option', newOption: 'New option',
    layoutRules: 'Layout & rules', fieldWidth: 'Field width', full: 'Full', half: 'Half',
    required: 'Required', requiredHint: 'Must be filled to submit', deleteField: 'Delete field',
    simple: 'Simple', multiStep: 'Multi-step', preview: 'Preview', save: 'Save',
    backToEditor: 'Back to editor',
    dropFieldsHere: 'Drop fields here', dragAnyField: 'Drag any field from the palette to begin',
    dragToBuild: 'Drag fields from the left to build your form.',
    stepOf: (a, b) => `Step ${a} of ${b}`, stepWord: 'Step',
    back: 'Back', continueW: 'Continue', submit: 'Submit', submitForm: 'Submit form',
    untitledForm: 'Untitled form',
    /* translation status */
    editingIn: 'Editing in', sourceLang: 'Source',
    needs: (l) => `Needs ${l}`, allTranslated: 'Fully translated',
    fieldsNeed: (n, l) => `${n} ${n === 1 ? 'field needs' : 'fields need'} ${l}`,
    source: 'Source text', useSource: 'Copy source', notTranslated: 'Not translated yet',
    saved: 'Form schema saved (all languages).',
    completion: 'translated',
  },
  fr: {
    formBuilder: 'Générateur de formulaire', multilingual: 'Multilingue', desktop: 'Bureau', tablet: 'Tablette',
    fields: 'Champs', properties: 'Propriétés',
    g_basic: 'Champs de base', g_choice: 'Champs à choix', g_advanced: 'Avancé', g_layout: 'Mise en page',
    dragHint: 'Glissez un champ sur le canevas, ou double-cliquez pour ajouter.',
    noFieldSelected: 'Aucun champ sélectionné',
    selectFieldHint: 'Sélectionnez un champ sur le canevas pour modifier son libellé, ses options et ses règles.',
    label: 'Libellé', textLbl: 'Texte', placeholder: 'Texte indicatif', helpText: "Texte d'aide",
    helpHint: 'Indication facultative affichée sous le champ', bodyText: 'Corps du texte',
    options: 'Options', addOption: 'Ajouter une option', newOption: 'Nouvelle option',
    layoutRules: 'Mise en page et règles', fieldWidth: 'Largeur du champ', full: 'Pleine', half: 'Demi',
    required: 'Obligatoire', requiredHint: 'Doit être rempli pour envoyer', deleteField: 'Supprimer le champ',
    simple: 'Simple', multiStep: 'Multi-étapes', preview: 'Aperçu', save: 'Enregistrer',
    backToEditor: "Retour à l'éditeur",
    dropFieldsHere: 'Déposez les champs ici', dragAnyField: 'Glissez un champ depuis la palette pour commencer',
    dragToBuild: 'Glissez les champs depuis la gauche pour construire votre formulaire.',
    stepOf: (a, b) => `Étape ${a} sur ${b}`, stepWord: 'Étape',
    back: 'Retour', continueW: 'Continuer', submit: 'Envoyer', submitForm: 'Envoyer le formulaire',
    untitledForm: 'Formulaire sans titre',
    editingIn: 'Édition en', sourceLang: 'Source',
    needs: (l) => `${l} manquant`, allTranslated: 'Entièrement traduit',
    fieldsNeed: (n, l) => `${n} ${n === 1 ? 'champ à traduire en' : 'champs à traduire en'} ${l}`,
    source: 'Texte source', useSource: 'Copier la source', notTranslated: 'Pas encore traduit',
    saved: 'Schéma du formulaire enregistré (toutes les langues).',
    completion: 'traduit',
  },
};

Object.assign(window, {
  LANGS, langName, isI18n, mk, tx, txf, setLangVal,
  FIELD_TX_KEYS, fieldMissing, UI,
});
