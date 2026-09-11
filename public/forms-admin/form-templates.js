/* Koomzo POS — ready-made FORM templates, grouped by industry.
   Cloning a template seeds a new draft form the operator can tweak.
   Plain JS (loaded before the Babel app script). Attached to window. */

/* industry meta — icon + color chip */
const INDUSTRIES = {
  banking:     { label: 'Banking',     icon: 'card-outline',        color: 'var(--kz-indigo)',   wash: 'var(--kz-indigo-wash)' },
  healthcare:  { label: 'Healthcare',  icon: 'medkit-outline',      color: 'var(--kz-success)',  wash: 'var(--kz-success-wash)' },
  telecom:     { label: 'Telecom',     icon: 'cellular-outline',    color: 'var(--kz-info)',     wash: 'var(--kz-info-wash)' },
  insurance:   { label: 'Insurance',   icon: 'umbrella-outline',    color: 'var(--kz-primary)',  wash: 'var(--kz-primary-wash)' },
  retail:      { label: 'Retail',      icon: 'storefront-outline',  color: 'var(--kz-warning)',  wash: 'var(--kz-warning-wash)' },
  hospitality: { label: 'Hospitality', icon: 'restaurant-outline',  color: 'var(--kz-discount)', wash: 'var(--kz-discount-wash)' },
};

/* Each template: id, name, desc, industry, kind (maps to FORM_KIND), fields, steps,
   popular flag, and a short preview list of the key fields it ships with. */
const FORM_TEMPLATES = [
  /* ---- Banking ---- */
  { id: 't-bank-1', industry: 'banking', kind: 'intake', name: 'Account opening (KYC)', popular: true,
    desc: 'Open a personal or business account — identity, address, ID upload and KYC checks.',
    fields: 14, steps: 4, preview: ['Full legal name', 'Date of birth', 'Government ID', 'SSN / Tax ID', 'Proof of address'] },
  { id: 't-bank-2', industry: 'banking', kind: 'request', name: 'Loan application', popular: true,
    desc: 'Personal, auto or mortgage loan intake with income, employment and consent to credit pull.',
    fields: 18, steps: 5, preview: ['Loan type & amount', 'Employment', 'Annual income', 'Existing debts', 'Credit-check consent'] },
  { id: 't-bank-3', industry: 'banking', kind: 'request', name: 'Dispute a transaction',
    desc: 'Cardholder dispute claim — transaction lookup, reason code and supporting evidence.',
    fields: 9, steps: 2, preview: ['Card last 4', 'Transaction', 'Dispute reason', 'Amount', 'Evidence upload'] },

  /* ---- Healthcare ---- */
  { id: 't-health-1', industry: 'healthcare', kind: 'intake', name: 'New patient intake', popular: true,
    desc: 'First-visit registration — demographics, insurance, medical history and pharmacy.',
    fields: 16, steps: 4, preview: ['Patient details', 'Insurance carrier', 'Medical history', 'Allergies', 'Primary pharmacy'] },
  { id: 't-health-2', industry: 'healthcare', kind: 'request', name: 'Appointment request',
    desc: 'Book a visit — provider, reason, preferred times and symptom summary.',
    fields: 8, steps: 2, preview: ['Provider', 'Reason for visit', 'Preferred dates', 'Symptoms', 'Contact method'] },
  { id: 't-health-3', industry: 'healthcare', kind: 'intake', name: 'Consent & HIPAA authorization',
    desc: 'Treatment consent and release-of-information authorization with e-signature.',
    fields: 7, steps: 2, preview: ['Consent to treat', 'Release recipients', 'Info to release', 'Expiry date', 'Signature'] },

  /* ---- Telecom ---- */
  { id: 't-tel-1', industry: 'telecom', kind: 'intake', name: 'New service activation', popular: true,
    desc: 'Activate mobile or broadband — plan, SIM/device, address and credit check.',
    fields: 11, steps: 3, preview: ['Plan', 'Device / SIM', 'Service address', 'Number port-in', 'Credit consent'] },
  { id: 't-tel-2', industry: 'telecom', kind: 'request', name: 'Report an outage',
    desc: 'Log a service disruption — account, service type, symptoms and affected area.',
    fields: 6, steps: 1, preview: ['Account number', 'Service affected', 'Issue started', 'Symptoms', 'Callback number'] },
  { id: 't-tel-3', industry: 'telecom', kind: 'request', name: 'Plan upgrade request',
    desc: 'Move to a higher tier — current plan, target plan and add-ons.',
    fields: 7, steps: 2, preview: ['Current plan', 'New plan', 'Add-ons', 'Effective date', 'Billing consent'] },

  /* ---- Insurance ---- */
  { id: 't-ins-1', industry: 'insurance', kind: 'request', name: 'Claim submission (FNOL)', popular: true,
    desc: 'First notice of loss — policy, incident details, parties and photo evidence.',
    fields: 15, steps: 4, preview: ['Policy number', 'Date of loss', 'Incident description', 'Parties involved', 'Photo evidence'] },
  { id: 't-ins-2', industry: 'insurance', kind: 'intake', name: 'Policy quote request',
    desc: 'Get a quote — coverage type, insured details, risk profile and start date.',
    fields: 12, steps: 3, preview: ['Coverage type', 'Insured details', 'Risk profile', 'Coverage amount', 'Start date'] },
  { id: 't-ins-3', industry: 'insurance', kind: 'request', name: 'Beneficiary update',
    desc: 'Change beneficiaries on a policy — verification and allocation split.',
    fields: 6, steps: 2, preview: ['Policy number', 'Policyholder ID', 'Beneficiary', 'Relationship', 'Allocation %'] },

  /* ---- Retail (native Koomzo domain) ---- */
  { id: 't-ret-1', industry: 'retail', kind: 'intake', name: 'Wholesale account application', popular: true,
    desc: 'Open a wholesale account — business details, tax ID and expected volume.',
    fields: 12, steps: 3, preview: ['Business name', 'Business type', 'Tax ID (NIU)', 'Monthly volume', 'Attestation de non-redevance'] },
  { id: 't-ret-2', industry: 'retail', kind: 'checkout', name: 'Loyalty sign-up',
    desc: 'Join the rewards program — phone, birthday and marketing preferences.',
    fields: 4, steps: 1, preview: ['Phone', 'Birthday', 'Email', 'Marketing consent'] },
  { id: 't-ret-3', industry: 'retail', kind: 'survey', name: 'Post-purchase survey',
    desc: 'Short satisfaction survey emailed after fulfillment — rating plus comments.',
    fields: 6, steps: 1, preview: ['Overall rating', 'Would recommend', 'Delivery speed', 'Quality', 'Comments'] },

  /* ---- Hospitality ---- */
  { id: 't-hosp-1', industry: 'hospitality', kind: 'intake', name: 'Catering booking',
    desc: 'Event catering inquiry — date, headcount, menu preferences and contact.',
    fields: 9, steps: 2, preview: ['Event date', 'Headcount', 'Menu preferences', 'Dietary needs', 'Contact'] },
  { id: 't-hosp-2', industry: 'hospitality', kind: 'request', name: 'Table reservation',
    desc: 'Reserve a table — party size, seating preference and special requests.',
    fields: 6, steps: 1, preview: ['Party size', 'Date & time', 'Seating preference', 'Occasion', 'Special requests'] },
];

Object.assign(window, { INDUSTRIES, FORM_TEMPLATES });
