/* Koomzo POS — shared data for the Forms admin list + Submissions history screens.
   Plain JS (loaded before the Babel app scripts). Attached to window. */

/* ---- form publish status meta ---- */
const FORM_STATUS = {
  published: { label: 'Published', color: '#1f7a44', bg: 'var(--kz-success-wash)', bd: '#bfe6cd', dot: 'var(--kz-success)' },
  draft:     { label: 'Draft',     color: '#9a7016', bg: 'var(--kz-warning-wash)', bd: '#f0d9a8', dot: 'var(--kz-warning)' },
  closed:    { label: 'Closed',    color: 'var(--kz-muted)', bg: 'var(--kz-surface-2)', bd: 'var(--kz-border)', dot: 'var(--kz-muted-3)' },
};

/* ---- submission status meta ---- */
const SUB_STATUS = {
  in_progress: { label: 'In progress', color: 'var(--kz-primary)', bg: 'var(--kz-primary-wash)', bd: 'var(--kz-primary-tint)', dot: 'var(--kz-primary)', icon: 'create-outline' },
  completed:   { label: 'Completed',   color: '#1f7a44', bg: 'var(--kz-success-wash)', bd: '#bfe6cd', dot: 'var(--kz-success)', icon: 'checkmark-circle-outline' },
  abandoned:   { label: 'Abandoned',   color: 'var(--kz-discount)', bg: 'var(--kz-discount-wash)', bd: '#f3c3b4', dot: 'var(--kz-discount)', icon: 'close-circle-outline' },
};

/* ---- answer/field row status (submission detail) ---- */
const ANS_STATUS = {
  answered: { color: 'var(--kz-success)', label: 'Answered' },
  current:  { color: 'var(--kz-primary)', label: 'On this step' },
  empty:    { color: 'var(--kz-muted-3)', label: 'Not filled' },
};

/* short helper for an answered field */
const A = (icon, label, status, value) => ({ icon, label, status, value });

/* form-type accent (by primary field / purpose) — reuse trigger-ish coloring */
const FORM_KIND = {
  intake:   { label: 'Intake',   icon: 'clipboard-outline',     color: 'var(--kz-primary)', wash: 'var(--kz-primary-wash)' },
  survey:   { label: 'Survey',   icon: 'stats-chart-outline',   color: 'var(--kz-info)',    wash: 'var(--kz-info-wash)' },
  request:  { label: 'Request',  icon: 'document-text-outline', color: 'var(--kz-warning)', wash: 'var(--kz-warning-wash)' },
  checkout: { label: 'Checkout', icon: 'card-outline',          color: 'var(--kz-success)', wash: 'var(--kz-success-wash)' },
};

/* ============================================================
   FORMS — authored forms
   ============================================================ */
const FORMS = [
  { id: 'f1', name: 'Wholesale account application', desc: 'Collect business details, tax ID and expected volume to open a wholesale account.',
    status: 'published', kind: 'intake', fields: 12, steps: 3, subs30d: 148, completionRate: 82.4, avgTime: '4m 10s', lastSub: '8 min ago', updated: 'Jul 1, 2026', owner: 'Mireille R.' },
  { id: 'f2', name: 'Customer onboarding', desc: 'First-purchase capture: name, email and marketing consent for new customers.',
    status: 'published', kind: 'intake', fields: 5, steps: 1, subs30d: 1032, completionRate: 94.1, avgTime: '48s', lastSub: '3 min ago', updated: 'Jun 28, 2026', owner: 'Danielle N.' },
  { id: 'f3', name: 'Product setup', desc: 'Internal form to add a product — details, pricing and publish toggle.',
    status: 'published', kind: 'request', fields: 8, steps: 3, subs30d: 214, completionRate: 97.6, avgTime: '2m 05s', lastSub: '26 min ago', updated: 'Jun 24, 2026', owner: 'Samuel T.' },
  { id: 'f4', name: 'Refund request', desc: 'Customer-facing refund claim with order lookup, reason and evidence upload.',
    status: 'published', kind: 'request', fields: 7, steps: 2, subs30d: 96, completionRate: 71.2, avgTime: '3m 22s', lastSub: '1 hr ago', updated: 'Jun 19, 2026', owner: 'Mireille R.' },
  { id: 'f5', name: 'Post-purchase survey', desc: 'Short satisfaction survey emailed after fulfillment — rating plus comments.',
    status: 'published', kind: 'survey', fields: 6, steps: 1, subs30d: 604, completionRate: 63.8, avgTime: '1m 12s', lastSub: '12 min ago', updated: 'Jun 14, 2026', owner: 'Danielle N.' },
  { id: 'f6', name: 'Support request', desc: 'Help ticket intake: category, priority and description with optional attachment.',
    status: 'published', kind: 'request', fields: 6, steps: 1, subs30d: 331, completionRate: 88.5, avgTime: '1m 44s', lastSub: '34 min ago', updated: 'Jun 09, 2026', owner: 'Samuel T.' },
  { id: 'f7', name: 'Catering booking', desc: 'Event catering inquiry — date, headcount, menu preferences and contact.',
    status: 'draft', kind: 'intake', fields: 9, steps: 2, subs30d: 0, completionRate: null, avgTime: '—', lastSub: 'Never', updated: 'Jul 2, 2026', owner: 'You' },
  { id: 'f8', name: 'Loyalty sign-up', desc: 'Join the rewards program — phone, birthday and preferences.',
    status: 'draft', kind: 'checkout', fields: 4, steps: 1, subs30d: 0, completionRate: null, avgTime: '—', lastSub: 'Never', updated: 'Jun 30, 2026', owner: 'You' },
  { id: 'f9', name: 'Vendor NPS 2025', desc: 'Annual supplier satisfaction survey — closed after the review cycle.',
    status: 'closed', kind: 'survey', fields: 10, steps: 2, subs30d: 0, completionRate: 78.0, avgTime: '5m 30s', lastSub: 'Mar 2, 2026', owner: 'Mireille R.' },
];

/* ============================================================
   SUBMISSIONS — history (completed + in-progress "saved to continue")
   ============================================================ */
const SUBMISSIONS = [
  { id: 'S-9042', formId: 'f1', form: 'Wholesale account application', kind: 'intake', respondent: 'Café Bilongue Sarl', email: 'ops@cafebilongue.cm',
    startedAt: 'Today · 09:40', status: 'in_progress', filled: 7, total: 12, elapsed: '2 days idle', currentStep: 'Step 2 · Tax & volume', source: 'Web · shared link',
    answers: [
      A('business-outline', 'Business name', 'answered', 'Café Bilongue Sarl'),
      A('mail-outline', 'Contact email', 'answered', 'ops@cafebilongue.cm'),
      A('call-outline', 'Phone', 'answered', '+237 6 55 41 08 22'),
      A('location-outline', 'Address', 'answered', 'Rue Njo-Njo, Bonapriso · Douala'),
      A('pricetags-outline', 'Business type', 'answered', 'Retail café'),
      A('people-outline', 'Est. monthly volume', 'answered', '1 440 000 F–2 880 000 F'),
      A('card-outline', 'Tax ID (NIU)', 'answered', '84-27••••'),
      A('document-text-outline', 'Attestation de non-redevance', 'current', 'Awaiting upload'),
      A('calendar-outline', 'Preferred start date', 'empty', ''),
      A('chatbox-outline', 'Notes', 'empty', ''),
    ] },
  { id: 'S-9041', formId: 'f2', form: 'Customer onboarding', kind: 'intake', respondent: 'Nadège Fotso', email: 'nadege.fotso@cafebilongue.cm',
    startedAt: 'Today · 09:38', status: 'completed', filled: 5, total: 5, elapsed: '41s', currentStep: '', source: 'POS · Caisse 2',
    answers: [
      A('person-outline', 'Full name', 'answered', 'Nadège Fotso'),
      A('mail-outline', 'Email', 'answered', 'nadege.fotso@cafebilongue.cm'),
      A('call-outline', 'Phone', 'answered', '+237 6 78 44 90 11'),
      A('pricetags-outline', 'Customer group', 'answered', 'Retail'),
      A('checkmark-circle-outline', 'Marketing consent', 'answered', 'Yes'),
    ] },
  { id: 'S-9040', formId: 'f4', form: 'Refund request', kind: 'request', respondent: 'Thomas Ngwa', email: 'thomas.ngwa@gmail.com',
    startedAt: 'Today · 09:20', status: 'in_progress', filled: 4, total: 7, elapsed: '22 min idle', currentStep: 'Step 2 · Evidence', source: 'Web · email link',
    answers: [
      A('receipt-outline', 'Order number', 'answered', '#0987'),
      A('mail-outline', 'Email on order', 'answered', 'thomas.ngwa@gmail.com'),
      A('list-outline', 'Reason', 'answered', 'Item arrived damaged'),
      A('cash-outline', 'Refund amount', 'answered', '53 500 F'),
      A('cloud-upload-outline', 'Photo evidence', 'current', 'Uploading…'),
      A('card-outline', 'Refund method', 'empty', ''),
      A('chatbox-outline', 'Additional notes', 'empty', ''),
    ] },
  { id: 'S-9039', formId: 'f3', form: 'Product setup', kind: 'request', respondent: 'Samuel T.', email: 'samuel.t@koomzo.cm',
    startedAt: 'Today · 08:51', status: 'completed', filled: 8, total: 8, elapsed: '2m 05s', currentStep: '', source: 'Admin · internal',
    answers: [
      A('cube-outline', 'Product name', 'answered', 'Jus de bissap · 1 L'),
      A('pricetags-outline', 'Category', 'answered', 'Boissons'),
      A('barcode-outline', 'SKU', 'answered', 'BIS-1L-01'),
      A('cash-outline', 'Unit cost', 'answered', '1 100 F'),
      A('pricetag-outline', 'Sell price', 'answered', '3 100 F'),
      A('calculator-outline', 'Tax rate', 'answered', 'TVA 19,25 %'),
      A('layers-outline', 'Initial stock', 'answered', '120'),
      A('checkmark-circle-outline', 'Publish immediately', 'answered', 'Yes'),
    ] },
  { id: 'S-9038', formId: 'f5', form: 'Post-purchase survey', kind: 'survey', respondent: 'Anonymous', email: 'order #1038',
    startedAt: 'Today · 08:44', status: 'completed', filled: 6, total: 6, elapsed: '58s', currentStep: '', source: 'Email · post-fulfillment',
    answers: [
      A('star-outline', 'Overall rating', 'answered', '★★★★★ (5)'),
      A('happy-outline', 'Would recommend', 'answered', 'Yes'),
      A('timer-outline', 'Delivery speed', 'answered', 'Very fast'),
      A('cube-outline', 'Product quality', 'answered', 'Excellent'),
      A('chatbox-outline', 'Comments', 'answered', '“Packaging was lovely.”'),
      A('mail-outline', 'Follow-up okay?', 'answered', 'No'),
    ] },
  { id: 'S-9037', formId: 'f6', form: 'Support request', kind: 'request', respondent: 'Blaise Nkoulou', email: 'b.nkoulou@gmail.com',
    startedAt: 'Today · 08:30', status: 'completed', filled: 6, total: 6, elapsed: '1m 30s', currentStep: '', source: 'Web · help center',
    answers: [
      A('person-outline', 'Name', 'answered', 'Blaise Nkoulou'),
      A('mail-outline', 'Email', 'answered', 'b.nkoulou@gmail.com'),
      A('list-outline', 'Category', 'answered', 'Billing'),
      A('flag-outline', 'Priority', 'answered', 'High'),
      A('chatbox-outline', 'Description', 'answered', 'Charged twice for order #1021'),
      A('cloud-upload-outline', 'Attachment', 'answered', 'receipt.pdf'),
    ] },
  { id: 'S-9036', formId: 'f5', form: 'Post-purchase survey', kind: 'survey', respondent: 'Anonymous', email: 'order #1035',
    startedAt: 'Today · 08:02', status: 'abandoned', filled: 2, total: 6, elapsed: 'Left after 2 fields', currentStep: '', source: 'Email · post-fulfillment',
    answers: [
      A('star-outline', 'Overall rating', 'answered', '★★★☆☆ (3)'),
      A('happy-outline', 'Would recommend', 'answered', 'Maybe'),
      A('timer-outline', 'Delivery speed', 'empty', ''),
      A('cube-outline', 'Product quality', 'empty', ''),
      A('chatbox-outline', 'Comments', 'empty', ''),
      A('mail-outline', 'Follow-up okay?', 'empty', ''),
    ] },
  { id: 'S-9035', formId: 'f1', form: 'Wholesale account application', kind: 'intake', respondent: 'Torréfaction Wouri', email: 'comptes@wouri.cm',
    startedAt: 'Yesterday · 17:22', status: 'completed', filled: 12, total: 12, elapsed: '4m 40s', currentStep: '', source: 'Web · shared link',
    answers: [
      A('business-outline', 'Business name', 'answered', 'Torréfaction Wouri Sarl'),
      A('mail-outline', 'Contact email', 'answered', 'comptes@wouri.cm'),
      A('call-outline', 'Phone', 'answered', '+237 6 90 22 71 55'),
      A('location-outline', 'Address', 'answered', 'Zone industrielle Bonabéri · Douala'),
      A('pricetags-outline', 'Business type', 'answered', 'Torréfacteur en gros'),
      A('people-outline', 'Est. monthly volume', 'answered', '2 880 000 F+'),
      A('card-outline', 'Tax ID (NIU)', 'answered', '92-55••••'),
      A('document-text-outline', 'Attestation de non-redevance', 'answered', 'resale-cert.pdf'),
      A('calendar-outline', 'Preferred start date', 'answered', 'Jul 15, 2026'),
      A('chatbox-outline', 'Notes', 'answered', 'Net-30 terms requested'),
    ] },
  { id: 'S-9034', formId: 'f2', form: 'Customer onboarding', kind: 'intake', respondent: 'Ir. Njike Paul', email: 'p.njike@gmail.com',
    startedAt: 'Yesterday · 16:05', status: 'completed', filled: 5, total: 5, elapsed: '37s', currentStep: '', source: 'POS · Caisse 1',
    answers: [
      A('person-outline', 'Full name', 'answered', 'Ir. Njike Paul'),
      A('mail-outline', 'Email', 'answered', 'p.njike@gmail.com'),
      A('call-outline', 'Phone', 'answered', '+237 6 55 80 12 40'),
      A('pricetags-outline', 'Customer group', 'answered', 'VIP member'),
      A('checkmark-circle-outline', 'Marketing consent', 'answered', 'No'),
    ] },
  { id: 'S-9033', formId: 'f4', form: 'Refund request', kind: 'request', respondent: 'Mme Awono Régine', email: 'r.awono@gmail.com',
    startedAt: 'Yesterday · 14:48', status: 'in_progress', filled: 3, total: 7, elapsed: '1 day idle', currentStep: 'Step 1 · Order lookup', source: 'Web · email link',
    answers: [
      A('receipt-outline', 'Order number', 'answered', '#0971'),
      A('mail-outline', 'Email on order', 'answered', 'r.awono@gmail.com'),
      A('list-outline', 'Reason', 'answered', 'Wrong item'),
      A('cash-outline', 'Refund amount', 'empty', ''),
      A('cloud-upload-outline', 'Photo evidence', 'empty', ''),
      A('card-outline', 'Refund method', 'empty', ''),
      A('chatbox-outline', 'Additional notes', 'empty', ''),
    ] },
  { id: 'S-9032', formId: 'f6', form: 'Support request', kind: 'request', respondent: 'Danielle N.', email: 'danielle.n@koomzo.cm',
    startedAt: 'Yesterday · 11:19', status: 'completed', filled: 6, total: 6, elapsed: '2m 10s', currentStep: '', source: 'Web · help center',
    answers: [
      A('person-outline', 'Name', 'answered', 'Danielle N.'),
      A('mail-outline', 'Email', 'answered', 'danielle.n@koomzo.cm'),
      A('list-outline', 'Category', 'answered', 'Hardware'),
      A('flag-outline', 'Priority', 'answered', 'Medium'),
      A('chatbox-outline', 'Description', 'answered', 'MoMo terminal firmware update failing'),
      A('cloud-upload-outline', 'Attachment', 'answered', '—'),
    ] },
  { id: 'S-9031', formId: 'f5', form: 'Post-purchase survey', kind: 'survey', respondent: 'Anonymous', email: 'order #1029',
    startedAt: 'Yesterday · 09:03', status: 'completed', filled: 6, total: 6, elapsed: '1m 05s', currentStep: '', source: 'Email · post-fulfillment',
    answers: [
      A('star-outline', 'Overall rating', 'answered', '★★★★☆ (4)'),
      A('happy-outline', 'Would recommend', 'answered', 'Yes'),
      A('timer-outline', 'Delivery speed', 'answered', 'Fast'),
      A('cube-outline', 'Product quality', 'answered', 'Good'),
      A('chatbox-outline', 'Comments', 'answered', '“Great value.”'),
      A('mail-outline', 'Follow-up okay?', 'answered', 'Yes'),
    ] },
];

Object.assign(window, { FORM_STATUS, SUB_STATUS, ANS_STATUS, FORM_KIND, FORMS, SUBMISSIONS });
