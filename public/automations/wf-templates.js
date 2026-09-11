/* Koomzo POS — ready-made WORKFLOW templates, grouped by industry.
   Cloning a template seeds a new draft workflow the operator can tweak
   in the Flow Designer. Plain JS (loaded before the Babel app). On window. */

/* industry meta — icon + color chip */
const WF_INDUSTRIES = {
  banking:     { label: 'Banking',     icon: 'card-outline',        color: 'var(--kz-indigo)',   wash: 'var(--kz-indigo-wash)' },
  healthcare:  { label: 'Healthcare',  icon: 'medkit-outline',      color: 'var(--kz-success)',  wash: 'var(--kz-success-wash)' },
  telecom:     { label: 'Telecom',     icon: 'cellular-outline',    color: 'var(--kz-info)',     wash: 'var(--kz-info-wash)' },
  insurance:   { label: 'Insurance',   icon: 'umbrella-outline',    color: 'var(--kz-primary)',  wash: 'var(--kz-primary-wash)' },
  retail:      { label: 'Retail',      icon: 'storefront-outline',  color: 'var(--kz-warning)',  wash: 'var(--kz-warning-wash)' },
  hospitality: { label: 'Hospitality', icon: 'restaurant-outline',  color: 'var(--kz-discount)', wash: 'var(--kz-discount-wash)' },
};

/* Each template: id, name, desc, industry, trigger (maps to TRIGGERS), steps count,
   popular flag, and a short preview of the step sequence. */
const WF_TEMPLATES = [
  /* ---- Banking ---- */
  { id: 'wt-bank-1', industry: 'banking', trigger: 'form', name: 'Loan approval routing', popular: true, steps: 8,
    desc: 'Route loan applications through credit check and tiered manager sign-off, then notify the applicant.',
    preview: ['Application received', 'Pull credit score', 'Amount > threshold?', 'Underwriter review', 'Manager approval', 'Notify applicant'] },
  { id: 'wt-bank-2', industry: 'banking', trigger: 'form', name: 'KYC verification', popular: true, steps: 7,
    desc: 'Verify identity documents, run sanctions/PEP screening and flag exceptions for compliance.',
    preview: ['ID submitted', 'Verify document', 'Sanctions screening', 'PEP check', 'Flag exceptions', 'Approve account'] },
  { id: 'wt-bank-3', industry: 'banking', trigger: 'webhook', name: 'Fraud alert triage', steps: 6,
    desc: 'Score inbound transaction alerts, freeze the card on high risk and open a case for review.',
    preview: ['Alert received', 'Risk score', 'High risk?', 'Freeze card', 'Notify cardholder', 'Open case'] },

  /* ---- Healthcare ---- */
  { id: 'wt-health-1', industry: 'healthcare', trigger: 'form', name: 'Patient intake to EHR', popular: true, steps: 6,
    desc: 'Sync a completed intake form to the EHR, verify insurance eligibility and assign a provider.',
    preview: ['Intake submitted', 'Create EHR record', 'Insurance eligibility', 'Assign provider', 'Confirm to patient'] },
  { id: 'wt-health-2', industry: 'healthcare', trigger: 'schedule', name: 'Appointment reminders', steps: 4,
    desc: 'Send SMS and email reminders 24 hours before each appointment with a confirm/reschedule link.',
    preview: ['Daily · 08:00', 'Find tomorrow’s visits', 'Send SMS + email', 'Log delivery'] },
  { id: 'wt-health-3', industry: 'healthcare', trigger: 'webhook', name: 'Lab result notification', steps: 5,
    desc: 'On a new lab result, route abnormal values to the provider and release normal ones to the portal.',
    preview: ['Result received', 'Abnormal?', 'Notify provider', 'Release to portal', 'Log outcome'] },

  /* ---- Telecom ---- */
  { id: 'wt-tel-1', industry: 'telecom', trigger: 'form', name: 'Service activation provisioning', popular: true, steps: 7,
    desc: 'Provision a new line — credit check, number assignment, SIM/device push and welcome message.',
    preview: ['Order received', 'Credit check', 'Assign number', 'Provision SIM', 'Activate line', 'Welcome SMS'] },
  { id: 'wt-tel-2', industry: 'telecom', trigger: 'webhook', name: 'Outage escalation', steps: 6,
    desc: 'Cluster inbound outage reports, open a NOC incident and post status-page updates automatically.',
    preview: ['Report received', 'Cluster by area', 'Threshold hit?', 'Open NOC incident', 'Update status page'] },
  { id: 'wt-tel-3', industry: 'telecom', trigger: 'schedule', name: 'Churn win-back', steps: 5,
    desc: 'Weekly, find at-risk subscribers and send a targeted retention offer, logging responses to CRM.',
    preview: ['Weekly · Mon 09:00', 'Score churn risk', 'Pick offer', 'Send offer', 'Log to CRM'] },

  /* ---- Insurance ---- */
  { id: 'wt-ins-1', industry: 'insurance', trigger: 'form', name: 'Claim FNOL routing', popular: true, steps: 9,
    desc: 'Triage first notice of loss, assign an adjuster by line of business and set reserve, then acknowledge.',
    preview: ['FNOL submitted', 'Validate policy', 'Classify loss', 'Assign adjuster', 'Set reserve', 'Acknowledge claim'] },
  { id: 'wt-ins-2', industry: 'insurance', trigger: 'schedule', name: 'Policy renewal reminder', steps: 4,
    desc: 'Notify policyholders 30 days before expiry with their renewal quote and a one-tap renew link.',
    preview: ['Daily · 07:00', 'Find expiring policies', 'Generate quote', 'Email renewal'] },
  { id: 'wt-ins-3', industry: 'insurance', trigger: 'form', name: 'Underwriting approval', steps: 8,
    desc: 'Run rules-based underwriting, request missing docs and escalate edge cases to a senior underwriter.',
    preview: ['Quote submitted', 'Run rules', 'Docs complete?', 'Request docs', 'Underwriter review', 'Issue policy'] },

  /* ---- Retail (native Koomzo domain) ---- */
  { id: 'wt-ret-1', industry: 'retail', trigger: 'order', name: 'Wholesale order fulfillment', popular: true, steps: 9,
    desc: 'Route large orders through finance approval, sync to ERP and notify the warehouse.',
    preview: ['Order over 180 000 F', 'Collect PO details', 'Finance approval', 'Sync to ERP', 'Notify warehouse', 'Fulfilled'] },
  { id: 'wt-ret-2', industry: 'retail', trigger: 'webhook', name: 'Abandoned cart nudge', steps: 5,
    desc: 'Catch a dropped online cart and follow up with a reminder plus discount after one hour.',
    preview: ['Cart abandoned', 'Wait 1 hour', 'Still unpaid?', 'Send reminder', 'Log outcome'] },

  /* ---- Hospitality ---- */
  { id: 'wt-hosp-1', industry: 'hospitality', trigger: 'order', name: 'VIP loyalty reward', steps: 6,
    desc: 'When a VIP member checks out, award bonus points and email a personal thank-you.',
    preview: ['VIP checkout', 'Is VIP?', 'Award points', 'Update CRM', 'Send thank-you'] },
  { id: 'wt-hosp-2', industry: 'hospitality', trigger: 'schedule', name: 'Staff shift reminder', steps: 3,
    desc: 'Message the roster the evening before each shift with times and assigned stations.',
    preview: ['Daily · 18:00', 'Find tomorrow’s shifts', 'Message roster'] },
];

Object.assign(window, { WF_INDUSTRIES, WF_TEMPLATES });
