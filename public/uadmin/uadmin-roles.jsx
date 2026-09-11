/* Koomzo POS — Users admin: Roles surface
   Same generic list shell applied to a second item type. Desktop roles table +
   shared role detail (permission matrix) + phone role card list. */

function permCount(perms) { return Object.values(perms).filter(Boolean).length; }

/* ============================================================
   DESKTOP — roles table
   ============================================================ */
function RolesTable({ rows, counts, onOpen }) {
  const areas = window.KZ_UA_PERM_AREAS;
  return (
    <table className="pa-table">
      <thead>
        <tr>
          <th style={{ width: 24 }}></th>
          <th>Role</th>
          <th>Access level</th>
          <th>Members</th>
          <th>Permissions</th>
          <th style={{ width: 96, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const n = counts[r.id] || 0;
          const pc = permCount(r.perms);
          const enabled = areas.filter((a) => r.perms[a.id]);
          return (
            <tr key={r.id} onClick={() => onOpen(r.id)}>
              <td></td>
              <td>
                <div className="ua-rolecell">
                  <div className="rc-ico" style={{ background: r.tint.bg }}><ion-icon name={r.icon} style={{ color: r.tint.fg }}></ion-icon></div>
                  <div className="t">
                    <b>{r.label}{r.system && <span className="sysbadge">System</span>}</b>
                    <small>{r.desc}</small>
                  </div>
                </div>
              </td>
              <td><span className="ua-level">{r.level}</span></td>
              <td>
                <span className="ua-by" style={{ gap: 10 }}>
                  <span className="ua-cell-mono" style={{ fontWeight: 700, color: 'var(--kz-ink)', fontSize: 14 }}>{n}</span>
                  <span className="ua-cell-muted">{n === 1 ? 'member' : 'members'}</span>
                </span>
              </td>
              <td>
                <div className="ua-permsum">
                  <div className="top"><b>{pc}/{areas.length}</b><span>{enabled.slice(0, 2).map((a) => a.label.split(' ')[0]).join(' · ') || 'None'}</span></div>
                  <div className="track"><div className="fill" style={{ width: Math.round((pc / areas.length) * 100) + '%', background: r.tint.fg }} /></div>
                </div>
              </td>
              <td>
                <div className="pa-rowact">
                  <button className="pa-rowbtn" title="Duplicate" onClick={(e) => { e.stopPropagation(); alert('Duplicate “' + r.label + '” role'); }}><ion-icon name="copy-outline"></ion-icon></button>
                  <button className="pa-rowbtn" title="Edit" onClick={(e) => { e.stopPropagation(); onOpen(r.id); }}><ion-icon name="create-outline"></ion-icon></button>
                  <button className={'pa-rowbtn' + (r.system ? '' : ' danger')} title={r.system ? 'System role' : 'Delete'} disabled={r.system} onClick={(e) => { e.stopPropagation(); if (!r.system) alert('Delete “' + r.label + '” role?'); }} style={r.system ? { opacity: .4, cursor: 'not-allowed' } : {}}><ion-icon name={r.system ? 'lock-closed-outline' : 'trash-outline'}></ion-icon></button>
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
   SHARED — role detail (drawer body / full screen)
   ============================================================ */
function RoleDetail({ draft, members, isNew, isPhone, swatches, onField, onSwatch, onTogglePerm, onClose, onSave, onDelete }) {
  const areas = window.KZ_UA_PERM_AREAS;
  const pc = permCount(draft.perms);

  return (
    <div className="pd">
      <div className="pd__head">
        {isPhone ? <button className="pd__back" onClick={onClose}><ion-icon name="chevron-back-outline"></ion-icon></button> : null}
        <div>
          <div className="eyebrow">{isNew ? 'New role' : (draft.system ? 'System role' : 'Edit role')}</div>
          <h2>{isNew ? 'Create role' : draft.label}</h2>
        </div>
        {!isPhone && <button className="pd__close" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>}
      </div>

      <div className="pd__body">
        <div className="pd__hero">
          <div className="pd__photo" style={{ background: draft.tint.bg }}><ion-icon name={draft.icon} style={{ color: draft.tint.fg }}></ion-icon></div>
          <div className="pd__hero-t">
            <h3>{draft.label || 'Untitled role'}</h3>
            <div className="pd__hero-meta">
              <span className="ua-level">{draft.level}</span>
              <span className="ua-cell-muted">{pc} of {areas.length} areas</span>
            </div>
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="pricetag-outline"></ion-icon>Details</div>
          <div className="pd__field">
            <label>Role name</label>
            <input className="pd__input" value={draft.label} disabled={draft.system} onChange={(e) => onField('label', e.target.value)} placeholder="e.g. Shift Lead" />
          </div>
          <div className="pd__field">
            <label>Description</label>
            <input className="pd__input" value={draft.desc} onChange={(e) => onField('desc', e.target.value)} placeholder="What can this role do?" />
          </div>
          <div className="pd__field">
            <label>Color</label>
            <div className="ua-swatches">
              {swatches.map((sw, i) => (
                <button key={i} className={draft.tint.fg === sw.fg ? 'on' : ''} onClick={() => onSwatch(sw)}><i style={{ background: sw.fg }} /></button>
              ))}
            </div>
          </div>
        </div>

        <div className="pd__section">
          <div className="pd__section-h"><ion-icon name="key-outline"></ion-icon>Permissions</div>
          {areas.map((a) => {
            const on = !!draft.perms[a.id];
            return (
              <div className="ua-perm" key={a.id}>
                <div className="ua-perm-ico"><ion-icon name={a.icon}></ion-icon></div>
                <div className="ua-perm-t"><b>{a.label}</b><small>{a.desc}</small></div>
                <button className={'ua-toggle' + (on ? ' on' : '')} disabled={draft.system} onClick={() => !draft.system && onTogglePerm(a.id)} title={draft.system ? 'Locked' : 'Toggle'}></button>
              </div>
            );
          })}
        </div>

        {!isNew && (
          <div className="pd__section">
            <div className="pd__section-h"><ion-icon name="people-outline"></ion-icon>Members <span style={{ marginLeft: 'auto', color: 'var(--kz-muted-2)', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>{members.length}</span></div>
            {members.length === 0 ? (
              <div className="ua-cell-muted" style={{ padding: '6px 0' }}>No members assigned.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="ua-stack">
                  {members.slice(0, 6).map((m) => <Avatar key={m.id} user={m} size={32} />)}
                  {members.length > 6 && <span className="ua-stack-more" style={{ width: 32, height: 32 }}>+{members.length - 6}</span>}
                </div>
                <button className="pa-link" style={{ padding: 0 }} onClick={() => alert('View ' + members.length + ' members in “' + draft.label + '”')}>View all<ion-icon name="chevron-forward-outline"></ion-icon></button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pd__foot">
        {!isNew && !draft.system && <button className="ghost" title="Delete role" onClick={onDelete}><ion-icon name="trash-outline"></ion-icon></button>}
        {isPhone ? <button className="pd__cancel" onClick={onClose}>Cancel</button> : null}
        <button className="pd__save" onClick={onSave} disabled={draft.system && !isNew} style={draft.system && !isNew ? { opacity: .5 } : {}}>
          <ion-icon name={isNew ? 'add-outline' : 'checkmark-outline'}></ion-icon>{isNew ? 'Create role' : (draft.system ? 'System role' : 'Save changes')}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PHONE — role card list
   ============================================================ */
function MobileRoleList({ rows, counts, query, onQuery, onOpen, onAdd, segment }) {
  const areas = window.KZ_UA_PERM_AREAS;
  return (
    <div className="pam">
      <header className="pam__head">
        <div className="mk"><ion-icon name="storefront"></ion-icon></div>
        <div className="ht">
          <h1>Roles</h1>
          <span className="sub">{rows.length} roles · {areas.length} permission areas</span>
        </div>
        <button className="pam__iconbtn" title="New role" onClick={onAdd}><ion-icon name="add-outline"></ion-icon></button>
      </header>

      {segment}

      <label className="pam__search">
        <ion-icon name="search-outline"></ion-icon>
        <input placeholder="Search roles" value={query} onChange={(e) => onQuery(e.target.value)} />
        {query && <button style={{ border: 'none', background: 'transparent', color: 'var(--kz-muted-3)' }} onClick={() => onQuery('')}><ion-icon name="close-circle"></ion-icon></button>}
      </label>

      <div className="pam__list" style={{ paddingTop: 12 }}>
        {rows.length === 0 && (
          <div className="pa-empty" style={{ paddingTop: 60 }}><ion-icon name="shield-outline"></ion-icon><p>No roles match.</p></div>
        )}
        {rows.map((r) => {
          const n = counts[r.id] || 0;
          const pc = permCount(r.perms);
          return (
            <button key={r.id} className="ua-rolecard" onClick={() => onOpen(r.id)}>
              <div className="rc-ico" style={{ background: r.tint.bg }}><ion-icon name={r.icon} style={{ color: r.tint.fg }}></ion-icon></div>
              <div className="rc-body">
                <div className="nm">{r.label}{r.system && <span className="sysbadge" style={{ font: '600 9.5px var(--kz-font-sans)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--kz-muted-2)', background: 'var(--kz-surface-2)', border: '1px solid var(--kz-border)', borderRadius: 5, padding: '1px 5px' }}>System</span>}</div>
                <div className="ds">{r.desc}</div>
                <div className="mt">
                  <span className="rc-members"><ion-icon name="people-outline"></ion-icon>{n}</span>
                  <span className="rc-members"><ion-icon name="key-outline"></ion-icon>{pc}/{areas.length}</span>
                  <span className="ua-level" style={{ height: 22 }}>{r.level}</span>
                </div>
              </div>
              <ion-icon name="chevron-forward-outline" style={{ fontSize: 20, color: 'var(--kz-muted-3)', flexShrink: 0 }}></ion-icon>
            </button>
          );
        })}
      </div>

      <button className="pam__fab" onClick={onAdd}><ion-icon name="add-outline"></ion-icon>New role</button>
    </div>
  );
}

Object.assign(window, {
  permCount, RolesTable, RoleDetail, MobileRoleList,
});
