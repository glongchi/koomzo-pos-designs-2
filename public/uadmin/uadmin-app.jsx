/* Koomzo POS — Users & Roles admin: app state, device presenter, composition.
   One file drives Users + Roles, each across three surfaces (desktop table +
   drawer · tablet · phone list + full-screen detail) on a shared store. */
const { useState, useMemo, useEffect, useLayoutEffect } = React;

const UA_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#6a61bf",
  "density": "comfortable",
  "statusStyle": "pill"
}/*EDITMODE-END*/;

const UA_DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Desktop', icon: 'desktop-outline' },
  tablet:  { w: 1180, h: 820, label: 'Tablet',  icon: 'tablet-landscape-outline' },
  phone:   { w: 390,  h: 844, label: 'Phone',   icon: 'phone-portrait-outline' },
};

const UA_SWATCHES = [
  { bg: '#eeecf8', fg: '#6a61bf' }, { bg: '#ececfb', fg: '#4b4ad9' },
  { bg: '#e8f0fd', fg: '#3f78c9' }, { bg: '#e4f4ea', fg: '#23824a' },
  { bg: '#fbf2dd', fg: '#a9781b' }, { bg: '#f1ece2', fg: '#9a7647' },
  { bg: '#fdeae4', fg: '#cc4b27' }, { bg: '#eceef2', fg: '#5d6573' },
];

let UA_UID = 100;

function UaStage({ w, h, className, children }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - 52;
      const availH = window.innerHeight - 56 - 52;
      setScale(Math.min(1, availW / w, availH / h));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="stage">
      <div className="dev-holder" style={{ width: w * scale, height: h * scale }}>
        <div className={'device ' + className} style={{ width: w, height: h, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const blankUser = () => ({
  id: 'new', name: '', title: '', email: '', phone: '', roles: ['cashier'], status: 'invited',
  initials: '', av: UA_SWATCHES[3], createdAt: 'Jun 12, 2026', createdBy: 'You', lastActive: '—', signIns: 0,
});
const blankRole = () => ({
  id: 'new', label: '', desc: '', tint: UA_SWATCHES[0], icon: 'shield-outline', level: 'Standard', system: false,
  perms: { register: true, refunds: false, products: false, reports: false, users: false, settings: false },
});

function App() {
  const [t, setTweak] = useTweaks(UA_TWEAKS);
  const [device, setDevice] = useState('desktop');
  const [view, setView] = useState('users'); // users | roles

  const [users, setUsers] = useState(window.KZ_UA_USERS);
  const [roles, setRoles] = useState(window.KZ_UA_ROLE_LIST);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | invited | suspended
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [selected, setSelected] = useState(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  const [detailId, setDetailId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState(null);
  const [draftKind, setDraftKind] = useState('user');

  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';

  useEffect(() => { setDetailId(null); setIsNew(false); setSelected(new Set()); setMenuOpen(false); }, [device, view]);
  useEffect(() => { setQuery(''); setRoleFilter('all'); setStatusFilter('all'); }, [view]);

  const roleCounts = useMemo(() => window.ua_roleCounts(users), [users]);

  /* ---- users filter + sort ---- */
  const filteredUsers = useMemo(() => {
    let list = users.filter((u) => {
      const inRole = roleFilter === 'all' || u.roles.includes(roleFilter);
      const inStatus = statusFilter === 'all' || u.status === statusFilter;
      const q = query.trim().toLowerCase();
      const inQ = !q || (u.name + ' ' + u.email + ' ' + u.title + ' ' + u.roles.join(' ')).toLowerCase().includes(q);
      return inRole && inStatus && inQ;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key])) * dir);
    return list;
  }, [users, roleFilter, statusFilter, query, sort]);

  const userCounts = useMemo(() => ({
    total: users.length,
    invited: users.filter((u) => u.status === 'invited').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  }), [users]);

  /* ---- roles filter ---- */
  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roles.filter((r) => !q || (r.label + ' ' + r.desc + ' ' + r.level).toLowerCase().includes(q));
  }, [roles, query]);

  /* ---- selection (users only) ---- */
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => s.size === filteredUsers.length ? new Set() : new Set(filteredUsers.map((u) => u.id)));
  const clearSel = () => setSelected(new Set());
  const onSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  /* ---- detail open / edit ---- */
  const openUser = (id) => { const u = users.find((x) => x.id === id); if (!u) return; setDraft({ ...u, roles: [...u.roles] }); setDraftKind('user'); setDetailId(id); setIsNew(false); };
  const openNewUser = () => { setDraft(blankUser()); setDraftKind('user'); setDetailId('new'); setIsNew(true); };
  const openRole = (id) => { const r = roles.find((x) => x.id === id); if (!r) return; setDraft({ ...r, perms: { ...r.perms }, tint: { ...r.tint } }); setDraftKind('role'); setDetailId(id); setIsNew(false); };
  const openNewRole = () => { setDraft(blankRole()); setDraftKind('role'); setDetailId('new'); setIsNew(true); };
  const closeDetail = () => { setDetailId(null); setIsNew(false); setDraft(null); };

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const toggleRole = (rid) => setDraft((d) => { const has = d.roles.includes(rid); return { ...d, roles: has ? d.roles.filter((x) => x !== rid) : [...d.roles, rid] }; });
  const setStatus = (s) => setDraft((d) => ({ ...d, status: s }));
  const togglePerm = (pid) => setDraft((d) => ({ ...d, perms: { ...d.perms, [pid]: !d.perms[pid] } }));
  const setSwatch = (sw) => setDraft((d) => ({ ...d, tint: { ...sw } }));

  const saveUser = () => {
    const rec = { ...draft };
    if (!rec.roles.length) rec.roles = ['viewer'];
    rec.initials = rec.initials || window.byInitials(rec.name || 'New');
    delete rec.icon;
    if (isNew) { rec.id = 'u' + (UA_UID++); setUsers((cur) => [rec, ...cur]); }
    else setUsers((cur) => cur.map((u) => u.id === rec.id ? rec : u));
    closeDetail();
  };
  const deleteUser = () => { setUsers((cur) => cur.filter((u) => u.id !== draft.id)); closeDetail(); };

  const saveRole = () => {
    const lvl = (() => { const pc = window.permCount(draft.perms); return pc >= 5 ? 'Full access' : pc >= 3 ? 'Elevated' : pc <= 1 ? 'Read-only' : 'Standard'; })();
    const rec = { ...draft, level: draft.system ? draft.level : lvl };
    if (isNew) { rec.id = 'r' + (UA_UID++); setRoles((cur) => [...cur, rec]); }
    else setRoles((cur) => cur.map((r) => r.id === rec.id ? rec : r));
    closeDetail();
  };
  const deleteRole = () => { setRoles((cur) => cur.filter((r) => r.id !== draft.id)); closeDetail(); };

  const accentStyle = { '--kz-primary': t.accent };
  const statusMode = t.statusStyle;
  const dev = UA_DEVICES[device];
  const appClass = `pa-app ${isTablet ? 'is-tablet' : ''} ${t.density === 'compact' ? 'pa-rowcompact' : ''}`;

  const segDesktop = (
    <div className="ua-seg">
      <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>
        <ion-icon name="people-outline"></ion-icon>Users<span className="seg-count">{users.length}</span>
      </button>
      <button className={view === 'roles' ? 'active' : ''} onClick={() => setView('roles')}>
        <ion-icon name="shield-checkmark-outline"></ion-icon>Roles<span className="seg-count">{roles.length}</span>
      </button>
    </div>
  );
  const segMobile = (
    <div className="ua-mseg">
      <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}><ion-icon name="people-outline"></ion-icon>Users</button>
      <button className={view === 'roles' ? 'active' : ''} onClick={() => setView('roles')}><ion-icon name="shield-checkmark-outline"></ion-icon>Roles</button>
    </div>
  );

  const draftMembers = draftKind === 'role' && draft ? users.filter((u) => u.roles.includes(draft.id)) : [];

  const detailNode = draft && (draftKind === 'user'
    ? <UserDetail draft={draft} isNew={isNew} isPhone={isPhone} onField={setField} onToggleRole={toggleRole} onStatus={setStatus} onClose={closeDetail} onSave={saveUser} onDelete={deleteUser} />
    : <RoleDetail draft={draft} members={draftMembers} isNew={isNew} isPhone={isPhone} swatches={UA_SWATCHES} onField={setField} onSwatch={setSwatch} onTogglePerm={togglePerm} onClose={closeDetail} onSave={saveRole} onDelete={deleteRole} />
  );

  return (
    <div className={'stage ' + (device === 'desktop' ? 'full' : device)} style={accentStyle}>
            <div className="rt-wrap">
        <div className={appClass} style={accentStyle}>
          {isPhone ? (
            <>
              {view === 'users' ? (
                <MobileUserList
                  rows={filteredUsers} counts={userCounts} roleList={roles} activeRole={roleFilter}
                  query={query} onQuery={setQuery} onRole={setRoleFilter}
                  onOpen={openUser} onAdd={openNewUser} statusMode={statusMode} segment={segMobile}
                />
              ) : (
                <MobileRoleList
                  rows={filteredRoles} counts={roleCounts} query={query} onQuery={setQuery}
                  onOpen={openRole} onAdd={openNewRole} segment={segMobile}
                />
              )}
              {draft && <div className="pam__detail">{detailNode}</div>}
            </>
          ) : (
            <>
              <UaRail view={view} />
              <div className="pa-main">
                <UaTopbar view={view} />

                <div className="pa-pagehead">
                  <div className="pa-pagehead__t">
                    <span className="pa-eyebrow">Access Control</span>
                    <h1>{view === 'users' ? 'Team members' : 'Roles'} <span className="count">{view === 'users' ? userCounts.total : roles.length}</span></h1>
                  </div>
                  {segDesktop}
                  <div className="pa-pagehead__actions">
                    {view === 'users' ? (
                      <>
                        <button className="pa-btn primary split" onClick={openNewUser}>
                          <ion-icon name="person-add-outline"></ion-icon>Invite User
                          <span className="div" /><span className="caret"><ion-icon name="chevron-down-outline" style={{ fontSize: 15 }}></ion-icon></span>
                        </button>
                        <button className="pa-btn" onClick={() => alert('Bulk-import members from a CSV.')}>
                          <ion-icon name="cloud-upload-outline"></ion-icon>Import CSV
                        </button>
                      </>
                    ) : (
                      <button className="pa-btn primary" onClick={openNewRole}>
                        <ion-icon name="add-outline"></ion-icon>New Role
                      </button>
                    )}
                    <div style={{ position: 'relative' }}>
                      <button className="pa-btn icon" onClick={() => setMenuOpen((m) => !m)}><ion-icon name="ellipsis-horizontal"></ion-icon></button>
                      {menuOpen && <UaMenu view={view} onClose={() => setMenuOpen(false)} />}
                    </div>
                  </div>
                </div>

                {view === 'users' && selected.size > 0 ? (
                  <div className="pa-bulk" style={accentStyle}>
                    <b>{selected.size} selected</b>
                    <div className="pa-bulk__sep" />
                    <button onClick={() => alert('Assign a role to ' + selected.size + ' members')}><ion-icon name="shield-outline"></ion-icon>Assign role</button>
                    <button onClick={() => alert('Resend invite to ' + selected.size + ' members')}><ion-icon name="mail-outline"></ion-icon>Resend invite</button>
                    <button onClick={() => { setUsers((cur) => cur.map((u) => selected.has(u.id) ? { ...u, status: 'suspended' } : u)); clearSel(); }}><ion-icon name="ban-outline"></ion-icon>Suspend</button>
                    <button className="danger" onClick={() => { setUsers((cur) => cur.filter((u) => !selected.has(u.id))); clearSel(); }}><ion-icon name="trash-outline"></ion-icon>Delete</button>
                    <button className="pa-bulk__x" onClick={clearSel}><ion-icon name="close-outline"></ion-icon></button>
                  </div>
                ) : (
                  <div className="pa-toolbar">
                    <label className="pa-search">
                      <ion-icon name="search-outline"></ion-icon>
                      <input placeholder={view === 'users' ? 'Search by name, email, or role' : 'Search roles'} value={query} onChange={(e) => setQuery(e.target.value)} />
                      {query && <button className="clr" onClick={() => setQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
                    </label>
                    {view === 'users' && (
                      <>
                        <button className={'pa-filter' + (statusFilter === 'invited' ? ' active' : '')} onClick={() => setStatusFilter((f) => f === 'invited' ? 'all' : 'invited')}>
                          <ion-icon name="mail-unread-outline"></ion-icon>Invited{userCounts.invited > 0 && ` (${userCounts.invited})`}
                        </button>
                        <button className={'pa-filter' + (statusFilter === 'suspended' ? ' active' : '')} onClick={() => setStatusFilter((f) => f === 'suspended' ? 'all' : 'suspended')}>
                          <ion-icon name="ban-outline"></ion-icon>Suspended{userCounts.suspended > 0 && ` (${userCounts.suspended})`}
                        </button>
                      </>
                    )}
                    <div className="pa-toolbar__right">
                      <button className="pa-link"><ion-icon name="share-outline"></ion-icon>Export</button>
                    </div>
                  </div>
                )}

                <div className="pa-tablewrap">
                  {view === 'users' ? (
                    filteredUsers.length === 0 ? (
                      <div className="pa-empty"><ion-icon name="people-outline"></ion-icon><p>No members match your filters.</p></div>
                    ) : (
                      <UaTable
                        rows={filteredUsers} selected={selected} sort={sort} onSort={onSort}
                        onToggle={toggle} onToggleAll={toggleAll} onOpen={openUser}
                        statusMode={statusMode} isTablet={isTablet}
                      />
                    )
                  ) : (
                    filteredRoles.length === 0 ? (
                      <div className="pa-empty"><ion-icon name="shield-outline"></ion-icon><p>No roles match.</p></div>
                    ) : (
                      <RolesTable rows={filteredRoles} counts={roleCounts} onOpen={openRole} />
                    )
                  )}
                </div>

                <div className="pa-footer">
                  <div className="pa-footer__view">
                    View
                    <select className="pa-select" defaultValue="100"><option>25</option><option>50</option><option>100</option></select>
                    per page
                  </div>
                  <div className="pa-footer__range">
                    1–{view === 'users' ? filteredUsers.length : filteredRoles.length} of {view === 'users' ? filteredUsers.length : filteredRoles.length}
                  </div>
                  <div className="pa-pager">
                    <button disabled><ion-icon name="chevron-back-outline"></ion-icon></button>
                    <button disabled><ion-icon name="chevron-forward-outline"></ion-icon></button>
                  </div>
                </div>
              </div>

              {draft && (
                <>
                  <div className="pa-scrim" onClick={closeDetail} />
                  <div className="pa-drawer" style={accentStyle}>{detailNode}</div>
                </>
              )}
            </>
          )}

          <TweaksPanel>
        <TweakSection label="Preview" />
        <TweakRadio label="Device" value={device} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }]} onChange={setDevice} />
            <TweakSection label="Brand" />
            <TweakColor label="Accent color" value={t.accent}
              options={['#6a61bf', '#4b4ad9', '#2e9e5b', '#303b57']}
              onChange={(v) => setTweak('accent', v)} />
            <TweakSection label="Table" />
            <TweakRadio label="Row density" value={t.density}
              options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
              onChange={(v) => setTweak('density', v)} />
            <TweakRadio label="Status display" value={t.statusStyle}
              options={[{ value: 'pill', label: 'Pill' }, { value: 'dot', label: 'Dot' }]}
              onChange={(v) => setTweak('statusStyle', v)} />
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

/* overflow menu */
function UaMenu({ view, onClose }) {
  const items = view === 'users'
    ? [
        { icon: 'download-outline', label: 'Export members' },
        { icon: 'mail-outline', label: 'Resend all invites' },
        { icon: 'time-outline', label: 'Sign-in activity log' },
        { icon: 'trash-outline', label: 'Recently removed' },
      ]
    : [
        { icon: 'copy-outline', label: 'Duplicate a role' },
        { icon: 'shield-outline', label: 'Permission templates' },
        { icon: 'document-text-outline', label: 'Audit role changes' },
      ];
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 48, right: 0, zIndex: 45, width: 230, background: '#fff', border: '1px solid var(--kz-border)', borderRadius: 12, boxShadow: 'var(--kz-shadow-lg)', padding: 6 }}>
        {items.map((it) => (
          <button key={it.label} onClick={() => { onClose(); alert(it.label); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 12px', border: 'none', background: 'transparent', borderRadius: 8, font: '500 14px var(--kz-font-sans)', color: 'var(--kz-ink-2)', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--kz-surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <ion-icon name={it.icon} style={{ fontSize: 18, color: 'var(--kz-muted)' }}></ion-icon>{it.label}
          </button>
        ))}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
