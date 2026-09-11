/* Koomzo POS — Workflow Orchestrator: node registry, node card, connector geometry.
   Exported to window. Node = a step in a business process; forms and external
   tools/URLs are first-class node types. */

const WF_NW = 216, WF_NH = 66;   // node width/height (for port + connector math)

/* category palette (token-based) */
const WF_CAT = {
  trigger:     { color: 'var(--kz-success)', wash: 'var(--kz-success-wash)', label: 'Trigger' },
  form:        { color: 'var(--kz-primary)', wash: 'var(--kz-primary-wash)', label: 'Form' },
  human:       { color: 'var(--kz-indigo)',  wash: 'var(--kz-indigo-wash)',  label: 'Human task' },
  integration: { color: 'var(--kz-info)',    wash: 'var(--kz-info-wash)',    label: 'Integration' },
  logic:       { color: 'var(--kz-warning)', wash: 'var(--kz-warning-wash)', label: 'Logic' },
  end:         { color: 'var(--kz-muted-2)',  wash: 'var(--kz-surface-2)',   label: 'End' },
};

/* node type registry */
const WF_TYPES = {
  /* triggers */
  'trig.order':    { cat: 'trigger', icon: 'cart-outline',          label: 'New order',        sub: 'When an order is placed' },
  'trig.form':     { cat: 'trigger', icon: 'document-text-outline',  label: 'Form submitted',   sub: 'Inbound form response' },
  'trig.schedule': { cat: 'trigger', icon: 'time-outline',           label: 'On schedule',      sub: 'Every day · 09:00' },
  'trig.webhook':  { cat: 'trigger', icon: 'flash-outline',          label: 'Webhook',          sub: 'Inbound HTTP request' },
  /* human / form */
  'form':          { cat: 'form',    icon: 'create-outline',         label: 'Collect via form', sub: 'Customer onboarding' },
  'approval':      { cat: 'human',   icon: 'shield-checkmark-outline',label: 'Approval',        sub: 'Manager sign-off' },
  'task':          { cat: 'human',   icon: 'person-outline',         label: 'Assign task',      sub: 'To a team member' },
  /* integrations / external tools + URLs */
  'http':          { cat: 'integration', icon: 'globe-outline',      label: 'Call API / URL',   sub: 'POST  https://…' },
  'email':         { cat: 'integration', icon: 'mail-outline',       label: 'Send email',       sub: 'Transactional message' },
  'slack':         { cat: 'integration', icon: 'chatbubbles-outline',label: 'Send message',     sub: 'WhatsApp Business · #channel' },
  'sheets':        { cat: 'integration', icon: 'grid-outline',       label: 'Add to sheet',     sub: 'Append a row' },
  'payment':       { cat: 'integration', icon: 'card-outline',       label: 'Charge payment',   sub: 'Capture funds' },
  'crm':           { cat: 'integration', icon: 'people-circle-outline', label: 'Update CRM',     sub: 'Create / update record' },
  /* logic */
  'condition':     { cat: 'logic',   icon: 'git-branch-outline',     label: 'Condition',        sub: 'Branch on a rule' },
  'delay':         { cat: 'logic',   icon: 'hourglass-outline',      label: 'Wait',             sub: 'Pause the process' },
  'end':           { cat: 'end',     icon: 'flag-outline',           label: 'End',              sub: 'Process complete' },
};

let wfId = 100;
const wfNewNode = (type, x, y) => {
  const def = WF_TYPES[type];
  return {
    id: 'n' + (++wfId), type, x, y,
    title: def.label, sub: def.sub,
    config: defaultConfig(type),
  };
};
function defaultConfig(type) {
  switch (type) {
    case 'http':       return { method: 'POST', url: 'https://api.example.com/v1/orders', auth: 'Bearer token' };
    case 'trig.webhook': return { method: 'POST', url: 'https://hooks.koomzo.app/in/abc123' };
    case 'form':       return { formRef: 'Customer onboarding' };
    case 'approval':   return { approver: 'Store manager', sla: '24 hours' };
    case 'task':       return { assignee: 'Floor team', due: '2 days' };
    case 'email':      return { to: '{{customer.email}}', template: 'Welcome' };
    case 'slack':      return { channel: '#orders', account: 'Koomzo Workspace' };
    case 'sheets':     return { account: 'Google Sheets', sheet: 'Orders 2026' };
    case 'payment':    return { account: 'MTN MoMo API', amount: '{{order.total}}' };
    case 'crm':        return { account: 'HubSpot', object: 'Contact' };
    case 'condition':  return { field: 'order.total', op: '>', value: '500' };
    case 'delay':      return { amount: '1', unit: 'hours' };
    case 'trig.schedule': return { freq: 'Daily', at: '09:00' };
    default:           return {};
  }
}

/* ---- ports (model coords) ---- */
const wfInPort  = (n) => ({ x: n.x + WF_NW / 2, y: n.y });
const wfOutPort = (n, branch) => {
  if (n.type === 'condition') return { x: n.x + WF_NW * (branch === 'no' ? 0.72 : 0.28), y: n.y + WF_NH };
  return { x: n.x + WF_NW / 2, y: n.y + WF_NH };
};

/* ---- bezier connector path between two points ---- */
function wfPath(a, b) {
  const dy = Math.max(34, Math.abs(b.y - a.y) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`;
}

/* ---- node card ---- */
function WfNode({ n, selected, running, connectTarget, onPointerDown, onSelect, onDelete, onPortDown, armed }) {
  const def = WF_TYPES[n.type];
  const cat = WF_CAT[def.cat];
  const isCond = n.type === 'condition';
  const isTrigger = def.cat === 'trigger';
  return (
    <div className={'wf-node' + (selected ? ' selected' : '') + (running ? ' running' : '') + (connectTarget ? ' connect-target' : '')}
      style={{ left: n.x, top: n.y, '--nc': cat.color, '--ncw': cat.wash }}
      onPointerDown={(e) => onPointerDown(e, n.id)} onClick={(e) => { e.stopPropagation(); onSelect(n.id); }}>
      <div className="wf-node__top"></div>
      <button className="wf-node__del" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}><ion-icon name="close-outline"></ion-icon></button>
      <div className="wf-node__body">
        <div className="wf-node__ic"><ion-icon name={def.icon}></ion-icon></div>
        <div className="wf-node__t">
          <div className="wf-node__cat">{cat.label}</div>
          <div className="wf-node__title">{n.title}</div>
          <div className="wf-node__sub">{n.sub}</div>
        </div>
      </div>

      {/* input port (not for triggers) */}
      {!isTrigger && <span className="wf-port in"></span>}

      {/* output ports */}
      {n.type === 'end' ? null : isCond ? (
        <>
          <span className={'wf-port out yes' + (armed === 'yes' ? ' arming' : '')} title="Yes branch"
            onPointerDown={(e) => { e.stopPropagation(); onPortDown(n.id, 'yes'); }}></span>
          <span className="wf-portlbl yes">Yes</span>
          <span className={'wf-port out no' + (armed === 'no' ? ' arming' : '')} title="No branch"
            onPointerDown={(e) => { e.stopPropagation(); onPortDown(n.id, 'no'); }}></span>
          <span className="wf-portlbl no">No</span>
        </>
      ) : (
        <span className={'wf-port out' + (armed === 'out' ? ' arming' : '')}
          onPointerDown={(e) => { e.stopPropagation(); onPortDown(n.id, 'out'); }}></span>
      )}
    </div>
  );
}

/* ---- syntax-highlight JSON for debug drawer ---- */
function wfHighlight(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="n">$1</span>');
}

Object.assign(window, { WF_TYPES, WF_CAT, WF_NW, WF_NH, wfNewNode, wfInPort, wfOutPort, wfPath, WfNode, wfHighlight });
