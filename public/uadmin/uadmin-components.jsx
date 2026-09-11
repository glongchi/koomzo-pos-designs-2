/* Koomzo POS — Users admin: presentational components (Users surface)
   Desktop data table + shared user detail + phone card list.
   Avatars reuse the POS icon-on-tint vocabulary (no image deps). */

const uaInt = (n) => Number(n).toLocaleString('fr-FR');

/* ---- shared atoms ---- */
function Avatar({ user, size, className }) {
  const s = size || 40;
  const cls = 'ua-av' + (className ? ' ' + className : '');
  if (user.icon) {
    return (
      <div className={cls} style={{ width: s, height: s, background: user.av.bg }}>
        <ion-icon name={user.icon} style={{ color: user.av.fg, fontSize: Math.round(s * 0.52) }}></ion-icon>
      </div>
    );
  }
  return (
    <div className={cls} style={{ width: s, height: s, background: user.av.bg, color: user.av.fg, fontSize: Math.round(s * 0.38) }}>
      {user.initials}
    </div>
  );
}

function RoleChips({ roles, max }) {
  const meta = window.KZ_UA_ROLES;
  const show = max ? roles.slice(0, max) : roles;
  const extra = max ? roles.length - show.length : 0;
  return (
    <span className="ua-roles">
      {show.map((r) => {
        const m = meta[r];
        if (!m) return null;
        return <span key={r} className="ua-role" style={{ background: m.tint.bg, color: m.tint.fg }}>{m.label}</span>;
      })}
      {extra > 0 && <span className="ua-role more">+{extra}</span>}
    </span>
  );
}

function StatusPill({ status, mode }) {
  const s = window.KZ_UA_STATUS[status];
  return (
    <span className={'ua-status' + (mode === 'dot' ? ' asdot' : '')} style={{ background: s.wash, color: s.ink }}>
      <i style={{ background: s.dot }} />{s.label}
    </span>
  );
}

function UaCheck({ on }) {
  return <span className={'pa-check' + (on ? ' on' : '')}><ion-icon name="checkmark-outline"></ion-icon></span>;
}

/* ============================================================
   DESKTOP — chrome
   ============================================================ */
function UaRail({ view }) {
  const items = [
    { icon: 'cart-outline', label: 'Register' },
    { icon: 'receipt-outline', label: 'Orders' },
    { icon: 'pricetags-outline', label: 'Products' },
    { icon: 'people-outline', label: 'Users', active: true },
    { icon: 'bar-chart-outline', label: 'Reports' },
  ];
  return (
    <nav className="pa-rail">
      <div className="pa-rail__mark"><ion-icon name="storefront"></ion-icon></div>
      {items.map((it) => (
        <button key={it.label} className={'pa-rail__item' + (it.active ? ' active' : '')}>
          <ion-icon name={it.icon}></ion-icon>{it.label}
        </button>
      ))}
      <div className="pa-rail__spacer" />
      <button className="pa-rail__item"><ion-icon name="settings-outline"></ion-icon>Settings</button>
    </nav>
  );
}

function UaTopbar({ view }) {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="shield-checkmark-outline"></ion-icon>
        Access Control
        <ion-icon name="chevron-forward-outline"></ion-icon>
        <b>{view === 'roles' ? 'Roles' : 'Users'}</b>
      </div>
      <div className="pa-topbar__right">
        <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
        <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
        <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* ============================================================
   DESKTOP — users table
   ============================================================ */
const UA_COLS = [
  { id: 'name',       label: 'Name',       sort: true },
  { id: 'email',      label: 'Email' },
  { id: 'roles',      label: 'Roles' },
  { id: 'status',     label: 'Status',     sort: true },
  { id: 'createdAt',  label: 'Created at', sort: true, min: 'desktop' },
  { id: 'createdBy',  label: 'Created by', min: 'desktop' },
  { id: 'lastActive', label: 'Last active', min: 'tablet' },
];

function byInitials(name) {
  return name.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() || '·';
}

function UaTable({ rows, selected, sort, onSort, onToggle, onToggleAll, onOpen, statusMode, isTablet }) {
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const cols = UA_COLS.filter((c) => !(isTablet && c.min === 'desktop'));
  return (
    <table className="pa-table">
      <thead>
        <tr>
          <th className="pa-th-check"><button style={{ border: 'none', background: 'transparent', padding: 0 }} onClick={onToggleAll}><UaCheck on={allOn} /></button></th>
          <th style={{ width: 56 }}>Photo</th>
          {cols.map((c) => (
            <th key={c.id} className={sort.key === c.id ? 'sorted' : ''}>
              {c.sort ? (
                <span className="sorth" onClick={() => onSort(c.id)}>
                  {c.label}
                  <ion-icon name={sort.key === c.id ? (sort.dir === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline') : 'swap-vertical-outline'}></ion-icon>
                </span>
              ) : c.label}
            </th>
          ))}
          <th style={{ width: 110, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((u) => {
          const on = selected.has(u.id);
          const suspended = u.status === 'suspended';
          return (
            <tr key={u.id} className={on ? 'sel' : ''} onClick={() => onOpen(u.id)}>
              <td onClick={(e) => { e.stopPropagation(); onToggle(u.id); }}><UaCheck on={on} /></td>
              <td><Avatar user={u} size={40} /></td>
              <td>
                <div className="pa-name"><b>{u.name}</b><small>{u.title}</small></div>
              </td>
              <td><span className="ua-email">{u.email}</span></td>
              <td><RoleChips roles={u.roles} max={2} /></td>
              <td><StatusPill status={u.status} mode={statusMode} /></td>
              {cols.find((c) => c.id === 'createdAt') && <td><span className="ua-cell-mono">{u.createdAt}</span></td>}
              {cols.find((c) => c.id === 'createdBy') && (
                <td>
                  <span className="ua-by">
                    <Avatar user={u.createdBy === 'System' ? { icon: 'cog-outline', av: window.KZ_UA_ROLES.viewer.tint } : { initials: byInitials(u.createdBy), av: window.KZ_UA_ROLES.manager.tint }} size={22} />
                    <span className="ua-cell-muted">{u.createdBy}</span>
                  </span>
                </td>
              )}
              <td><span className={'ua-cell-muted' + (u.lastActive === '—' ? ' ua-dash' : '')}>{u.lastActive}</span></td>
              <td>
                <div className="pa-rowact">
                  <button className="pa-rowbtn" title="Reset password" onClick={(e) => { e.stopPropagation(); alert('Send password reset to ' + u.name); }}><ion-icon name="key-outline"></ion-icon></button>
                  <button className="pa-rowbtn" title="Edit" onClick={(e) => { e.stopPropagation(); onOpen(u.id); }}><ion-icon name="create-outline"></ion-icon></button>
                  <button className="pa-rowbtn danger" title={suspended ? 'Delete' : 'Suspend'} onClick={(e) => { e.stopPropagation(); alert((suspended ? 'Delete ' : 'Suspend ') + u.name + '?'); }}><ion-icon name={suspended ? 'trash-outline' : 'ban-outline'}></ion-icon></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ============================================================
   SHARED — user detail (drawer body on desktop, full screen on phone)
   ============================================================ */
function UserDetail({ draft, isNew, isPhone, onField, onToggleRole, onStatus, onClose, onSave, onDelete }) {
  const roleList = window.KZ_UA_ROLE_LIST;
  const statuses = ['active', 'invited', 'suspended'];
  const primaryRole = draft.roles[0] ? window.KZ_UA_ROLES[draft.roles[0]] : null;

  return (
    <div className="pd">
      <div className="pd__head">
        {isPhone ? <button className="pd__back" onClick={onClose}><ion-icon name="chevron-back-outline"></ion-icon></button> : null}
        <div>
          <div className="eyebrow">{isNew ? 'Invite member' : 'Edit member'}</div>
          <h2>{isNew ? 'New user' : draft.name}</h2>
        </div>
        {!isPhone && <button className="pd__close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>}
      </div>

      <div className="pd__body">
        <div className="pd__hero">
          <Avatar user={draft.icon || draft.initials ? draft : { ...draft, initials: byInitials(draft.name || 'New') }} size={76} className="pd__photo-av" />
          <div className="pd__hero-t">
            <h3>{draft.name || 'New user'}</h3>
            <div className="pd__hero-meta">
              <StatusPill status={draft.status} />
              {primaryRole && <span className="ua-role" style={{ background: primaryRole.tint.bg, color: primaryRole.tint.fg }}>{primaryRole.label}</span>}
            </div>
          </div>
        </div>

        {draft.status === 'invited' && !isNew && (
          <div className="ua-invite">
            <ion-icon name="mail-unread-outline"></ion-icon>
            <div className="t"><b>Invitation pending</b><small>Sent to {draft.email || 'this address'}</small></div>
            <button onClick={() => alert('Invitation re-sent to ' + draft.email)}>Resend</button>
          </div>
        )}

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="person-outline"></ion-icon>Profile</div>
          <div className="pd__field">
            <label>Full name</label>
            <input className="pd__input" value={draft.name} onChange={(e) => onField('name', e.target.value)} placeholder="e.g. Amara Okonkwo" />
          </div>
          <div className="pd__field">
            <label>Job title</label>
            <input className="pd__input" value={draft.title} onChange={(e) => onField('title', e.target.value)} placeholder="e.g. Floor Manager" />
          </div>
          <div className="pd__field">
            <label>Email address</label>
            <input className="pd__input" value={draft.email} onChange={(e) => onField('email', e.target.value)} placeholder="name@koomzo.store" />
          </div>
          <div className="pd__field">
            <label>Phone</label>
            <input className="pd__input mono" value={draft.phone} onChange={(e) => onField('phone', e.target.value)} placeholder="+1 …" />
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="shield-checkmark-outline"></ion-icon>Roles</div>
          <div className="ua-rolepick">
            {roleList.map((r) => {
              const on = draft.roles.includes(r.id);
              return (
                <button key={r.id} className={on ? 'on' : ''} onClick={() => onToggleRole(r.id)}>
                  <i className="swatch" style={{ background: r.tint.fg }} />{r.label}
                  {on && <ion-icon name="checkmark-outline" style={{ fontSize: 16 }}></ion-icon>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="pulse-outline"></ion-icon>Status</div>
          <div className="ua-statpick">
            {statuses.map((s) => {
              const m = window.KZ_UA_STATUS[s];
              const on = draft.status === s;
              return (
                <button key={s} className={on ? 'on' : ''} onClick={() => onStatus(s)}
                  style={on ? { borderColor: m.dot, background: m.wash, color: m.ink } : {}}>
                  <i style={{ background: m.dot }} />{m.label}
                </button>
              );
            })}
          </div>
        </div>

        {!isNew && (
          <div className="pd__section">
            <div className="pd__section-h"><ion-icon name="time-outline"></ion-icon>Activity</div>
            <div className="ua-info"><span className="k"><ion-icon name="calendar-outline"></ion-icon>Created</span><span className="v">{draft.createdAt}</span></div>
            <div className="ua-info"><span className="k"><ion-icon name="person-add-outline"></ion-icon>Created by</span><span className="v">{draft.createdBy}</span></div>
            <div className="ua-info"><span className="k"><ion-icon name="finger-print-outline"></ion-icon>Last active</span><span className="v">{draft.lastActive}</span></div>
            <div className="ua-info"><span className="k"><ion-icon name="log-in-outline"></ion-icon>Total sign-ins</span><span className="v">{uaInt(draft.signIns)}</span></div>
          </div>
        )}
      </div>

      <div className="pd__foot">
        {!isNew && <button className="ghost" title="Remove user" onClick={onDelete}><ion-icon name="trash-outline"></ion-icon></button>}
        {isPhone ? <button className="pd__cancel" onClick={onClose}>Cancel</button> : null}
        <button className="pd__save" onClick={onSave}><ion-icon name={isNew ? 'paper-plane-outline' : 'checkmark-outline'}></ion-icon>{isNew ? 'Send invite' : 'Save changes'}</button>
      </div>
    </div>
  );
}

/* ============================================================
   PHONE — user card list
   ============================================================ */
function MobileUserList({ rows, counts, roleList, activeRole, query, onQuery, onRole, onOpen, onAdd, statusMode, segment }) {
  return (
    <div className="pam">
      <header className="pam__head">
        <div className="mk"><ion-icon name="storefront"></ion-icon></div>
        <div className="ht">
          <h1>Users</h1>
          <span className="sub">{counts.total} members · {counts.invited + counts.suspended} need attention</span>
        </div>
        <button className="pam__iconbtn" title="Invite" onClick={onAdd}><ion-icon name="person-add-outline"></ion-icon></button>
      </header>

      {segment}

      <label className="pam__search">
        <ion-icon name="search-outline"></ion-icon>
        <input placeholder="Search name, email, role" value={query} onChange={(e) => onQuery(e.target.value)} />
        {query && <button style={{ border: 'none', background: 'transparent', color: 'var(--kz-muted-3)' }} onClick={() => onQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
      </label>

      <div className="pam__cats">
        <button className={'pam__chip' + (activeRole === 'all' ? ' active' : '')} onClick={() => onRole('all')}>
          <ion-icon name="people-outline"></ion-icon>All
        </button>
        {roleList.map((r) => (
          <button key={r.id} className={'pam__chip' + (activeRole === r.id ? ' active' : '')} onClick={() => onRole(r.id)}>
            <ion-icon name={r.icon}></ion-icon>{r.label}
          </button>
        ))}
      </div>

      <div className="pam__sum">
        <div className="pam__stat"><div className="k">Members</div><div className="v">{counts.total}</div></div>
        <div className="pam__stat"><div className="k">Invited</div><div className="v low">{counts.invited}</div></div>
        <div className="pam__stat"><div className="k">Suspended</div><div className="v out">{counts.suspended}</div></div>
      </div>

      <div className="pam__list">
        {rows.length === 0 && (
          <div className="pa-empty" style={{ paddingTop: 60 }}><ion-icon name="people-outline"></ion-icon><p>No members match.</p></div>
        )}
        {rows.map((u) => (
          <button key={u.id} className="pam__card" onClick={() => onOpen(u.id)}>
            <Avatar user={u} size={50} />
            <div className="pam__card-body">
              <div className="nm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {u.name}
                <StatusPill status={u.status} mode={statusMode} />
              </div>
              <div className="sku" style={{ fontFamily: 'var(--kz-font-sans)' }}>{u.email}</div>
              <RoleChips roles={u.roles} max={3} />
            </div>
            <div className="pam__card-right">
              <ion-icon name="chevron-forward-outline" style={{ fontSize: 20, color: 'var(--kz-muted-3)' }}></ion-icon>
            </div>
          </button>
        ))}
      </div>

      <button className="pam__fab" onClick={onAdd}><ion-icon name="person-add-outline"></ion-icon>Invite</button>
    </div>
  );
}

Object.assign(window, {
  uaInt, byInitials, Avatar, RoleChips, StatusPill, UaCheck,
  UaRail, UaTopbar, UaTable, UA_COLS, UserDetail, MobileUserList,
});
