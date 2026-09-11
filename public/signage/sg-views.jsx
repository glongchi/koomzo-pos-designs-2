/* Koomzo Signage — the five non-core views plus the phone surface.
   Phone monitors, desktop authors: on a phone this file serves Screens, Media
   and Proof only; authoring views are not reachable there. */

/* ============================================================
   PLAYLISTS  (schema: loop)
   ============================================================ */
function SgPlaylists({ playlists, onPublish, onToast, players }) {
  const [sel, setSel] = React.useState(playlists[0].id);
  const pl = playlists.find((p) => p.id === sel) || playlists[0];
  const [preview, setPreview] = React.useState(0);
  React.useEffect(() => setPreview(0), [sel]);

  const weight = window.sgWeight(pl);
  const thinnest = Math.min(...players.filter((p) => p.state !== 'unpaired').map((p) => (p.cacheCapMb - p.cacheMb) * 1_000_000));
  const tooHeavy = weight > thinnest;
  const item = pl.items[Math.min(preview, pl.items.length - 1)];
  const schedOn = !window.KZ || window.KZ.on('signage', 'schedule');
  const approvalsOn = !window.KZ || window.KZ.on('signage', 'approvals');

  return (
    <div className="sg-cols">
      <div className="sg-list">
        {playlists.map((p) => (
          <button key={p.id} className={'sg-listitem' + (p.id === sel ? ' on' : '')} onClick={() => setSel(p.id)}>
            <span className="n">{p.name}</span>
            <span className="m">
              <span>{p.items.length} éléments</span>
              {p.status === 'published'
                ? <span className="sg-chip" style={{ height: 20 }}>v{p.version}</span>
                : <span className="sg-chip warn" style={{ height: 20 }}>Brouillon</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="sg-pane">
        <div className="sg-pane__hd">
          <h3>{pl.name}</h3>
          <div className="r">
            <button className="pa-btn" onClick={() => onToast('Ajouter un élément')}><ion-icon name="add-outline"></ion-icon>Ajouter</button>
            {approvalsOn && pl.status === 'draft'
              ? <button className="pa-btn primary" disabled={tooHeavy} onClick={() => onToast('Envoyé au responsable pour validation')}><ion-icon name="shield-checkmark-outline"></ion-icon>Demander validation</button>
              : <button className="pa-btn primary" disabled={tooHeavy} onClick={() => { onPublish(pl.id); onToast('Publiée — version ' + (pl.version + 1)); }}><ion-icon name="cloud-upload-outline"></ion-icon>Publier</button>}
          </div>
        </div>

        <div className="sg-pane__b">
          <div className={'sg-weigh' + (tooHeavy ? ' bad' : '')}>
            <ion-icon name={tooHeavy ? 'alert-circle-outline' : 'server-outline'} style={{ fontSize: 17 }}></ion-icon>
            {tooHeavy
              ? <span>Trop lourde : <b>{window.SGF.bytes(weight)}</b> contre <b>{window.SGF.bytes(thinnest)}</b> libres sur l’écran le plus juste. Publication bloquée — retirez une vidéo.</span>
              : <span>Poids <b>{window.SGF.bytes(weight)}</b> · l’écran le plus juste a <b>{window.SGF.bytes(thinnest)}</b> libres</span>}
          </div>

          {pl.items.map((it, n) => {
            const k = window.SG_ITEM_KIND[it.kind];
            const a = it.kind === 'media' ? window.sgAsset(it.ref) : null;
            const b = it.kind === 'board' ? window.sgBoard(it.ref) : null;
            return (
              <div key={it.id} className="sg-item" onClick={() => setPreview(n)} style={{ borderColor: n === preview ? '#8d3fb0' : undefined, cursor: 'pointer' }}>
                <ion-icon className="sg-item__grip" name="reorder-two-outline"></ion-icon>
                <div className="sg-item__th"><window.SgItemRender item={it} /></div>
                <div className="sg-item__t">
                  <div className="n">{a ? a.name : b ? b.name : k.label}</div>
                  <div className="m">
                    <span className="sg-chip" style={{ height: 20 }}><ion-icon name={k.icon}></ion-icon>{k.label}</span>
                    {b && <span>lié à « {window.KZ_SG_CATALOG[b.source].name} »</span>}
                    {schedOn && it.cond && <span className="sg-chip warn" style={{ height: 20 }}><ion-icon name="time-outline"></ion-icon>{it.cond}</span>}
                  </div>
                </div>
                <div className="sg-item__d">{it.kind === 'nowserving' ? 'live' : window.SGF.secs(it.ms)}</div>
                <button className="sg-item__x" onClick={(e) => { e.stopPropagation(); onToast('Élément retiré'); }}><ion-icon name="close-outline"></ion-icon></button>
              </div>
            );
          })}
        </div>

        <div className="sg-preview"><window.SgItemRender item={item} /></div>
      </div>
    </div>
  );
}

/* ============================================================
   MEDIA
   ============================================================ */
function SgMedia({ onToast }) {
  return (
    <div className="sg-media">
      <button className="sg-drop" onClick={() => onToast('Sélectionnez une image ou une vidéo')}>
        <ion-icon name="cloud-upload-outline"></ion-icon>
        <span>Ajouter un fichier</span>
        <em>Depuis le téléphone, devant l’écran</em>
      </button>
      {window.KZ_SG_ASSETS.map((a) => {
        const used = window.KZ_SG_PLAYLISTS.filter((p) => p.items.some((i) => i.ref === a.id)).length;
        return (
          <div key={a.id} className="sg-asset">
            <div className="sg-asset__th" style={{ background: a.tone }}>
              <span className="sg-asset__k"><ion-icon name={a.kind === 'video' ? 'videocam-outline' : 'image-outline'}></ion-icon>{a.kind === 'video' ? window.SGF.secs(a.ms) : 'Image'}</span>
              <ion-icon name={a.kind === 'video' ? 'play-circle-outline' : 'image-outline'}></ion-icon>
            </div>
            <div className="sg-asset__b">
              <div className="n">{a.name}</div>
              <div className="m">
                <span>{window.SGF.bytes(a.bytes)}</span><span>{a.w}×{a.h}</span>
              </div>
              <div className="m">
                {used > 0
                  ? <span className="sg-chip pl"><ion-icon name="albums-outline"></ion-icon>{used + (used > 1 ? ' playlists' : ' playlist')}</span>
                  : <span className="sg-chip">Non utilisé</span>}
                {a.expires && <span className="sg-chip warn"><ion-icon name="time-outline"></ion-icon>Expire {a.expires.slice(8)}/{a.expires.slice(5, 7)}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   BOARDS — the differentiator: bind, don't retype
   ============================================================ */
function SgBoards({ onToast }) {
  const [sel, setSel] = React.useState('b1');
  const [boards, setBoards] = React.useState(window.KZ_SG_BOARDS);
  const b = boards.find((x) => x.id === sel);
  const set = (k, v) => setBoards((cur) => cur.map((x) => x.id === sel ? { ...x, [k]: v } : x));
  const cat = window.KZ_SG_CATALOG[b.source];
  const outCount = cat.items.filter((i) => i.stock === 0).length;
  const zonesOn = !window.KZ || window.KZ.on('signage', 'zones');

  return (
    <div className="sg-cols">
      <div className="sg-list">
        {boards.map((x) => (
          <button key={x.id} className={'sg-listitem' + (x.id === sel ? ' on' : '')} onClick={() => setSel(x.id)}>
            <span className="n">{x.name}</span>
            <span className="m"><span>{x.kind === 'menu' ? 'Menu' : x.kind === 'rate' ? 'Tarifs' : 'Prix'}</span><span>·</span><span>{window.KZ_SG_CATALOG[x.source].name}</span></span>
          </button>
        ))}
      </div>
      <div className="sg-pane">
        <div className="sg-pane__hd">
          <h3>{b.name}</h3>
          <div className="r"><button className="pa-btn primary" onClick={() => onToast('Board enregistré — les écrans suivront au prochain battement')}><ion-icon name="checkmark-outline"></ion-icon>Enregistrer</button></div>
        </div>
        <div className="sg-pane__b">
          <div className="sg-note">
            <ion-icon name="link-outline"></ion-icon>
            <div>Ce board ne contient aucun prix. Il est lié à <b>« {cat.name} »</b> et se résout à la diffusion — modifiez un prix à la caisse et le mur suit au prochain battement, sans republier.</div>
          </div>
          <div className="sg-bind">
            <div className="sg-field">
              <label>Catégorie liée</label>
              <div className="sg-seg">
                {Object.entries(window.KZ_SG_CATALOG).map(([id, c]) => (
                  <button key={id} className={b.source === id ? 'on' : ''} onClick={() => set('source', id)}>{c.name}</button>
                ))}
              </div>
            </div>
            {zonesOn && (
              <div className="sg-field">
                <label>Gabarit et zones</label>
                <div className="sg-seg">
                  {[['list', 'Une colonne'], ['two-col', 'Deux colonnes'], ['hero', 'Plat en vedette'], ['grid', 'Grille prix'], ['rates', 'Tarifs chambres']].map(([id, l]) => (                    <button key={id} className={b.template === id ? 'on' : ''} onClick={() => set('template', id)}>{l}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="sg-field">
              <label>{b.kind === 'rate' ? 'Complet' : 'Rupture de stock'} — {outCount} {b.kind === 'rate' ? 'type' + (outCount > 1 ? 's' : '') + ' sans disponibilité' : 'article' + (outCount > 1 ? 's' : '') + ' à zéro'}</label>
              <div className="sg-seg">
                {[['grey', 'Grisé'], ['strike', 'Barré'], ['hide', 'Masqué']].map(([id, l]) => (
                  <button key={id} className={b.soldOut === id ? 'on' : ''} onClick={() => set('soldOut', id)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="sg-field">
              <label>Fond</label>
              <div className="sg-seg">
                {['#8d3fb0', '#303b57', '#2e9e5b', '#ec603a'].map((c) => (
                  <button key={c} className={b.accent === c ? 'on' : ''} onClick={() => set('accent', c)} style={{ width: 44, background: c, borderColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="sg-preview"><window.SgBoardRender board={b} /></div>
      </div>
    </div>
  );
}

/* ============================================================
   SCHEDULE — precedence, conflicts, and a time simulator
   ============================================================ */
function SgSchedule({ onToast, takeover, onTakeover }) {
  const [hour, setHour] = React.useState(11);
  const rules = window.KZ_SG_RULES;
  const lanes = [...new Set(rules.map((r) => r.scopeLabel))];
  const resolved = takeover
    ? 'Prise de contrôle — Fermeture exceptionnelle'
    : (rules.filter((r) => r.kind === 'daypart' && hour >= parseInt(r.when) && hour < parseInt(r.when.slice(-5)))
        .sort((a, b) => b.priority - a.priority)[0] || rules.find((r) => r.kind === 'default'));

  return (
    <div className="sg-sched">
      <div className="sg-sim">
        <span className="sg-sim__l">Simuler</span>
        <input type="range" min="0" max="23" value={hour} onChange={(e) => setHour(+e.target.value)} />
        <span className="sg-sim__v">{String(hour).padStart(2, '0')}:00</span>
        <span className="sg-sim__r"><ion-icon name="play-outline"></ion-icon>
          {typeof resolved === 'string' ? resolved : window.sgPlaylist(resolved.playlistId).name + ' · ' + resolved.detail}
        </span>
      </div>

      {lanes.map((lane) => {
        const rs = rules.filter((r) => r.scopeLabel === lane);
        return (
          <div key={lane} className="sg-lane">
            <div className="sg-lane__hd">
              <ion-icon name="albums-outline" style={{ color: '#8d3fb0', fontSize: 17 }}></ion-icon>
              <span className="n">{lane}</span>
              <button className="pa-btn" style={{ height: 34, padding: '0 11px', fontSize: 12.5 }} onClick={() => onToast('Nouvelle règle')}>
                <ion-icon name="add-outline"></ion-icon>Règle
              </button>
            </div>
            {rs.map((r) => (
              <div key={r.id} className={'sg-rule' + (r.conflict ? ' clash' : '')}>
                <div className="sg-rule__k"><ion-icon name={r.kind === 'dated' ? 'calendar-outline' : r.kind === 'daypart' ? 'time-outline' : 'repeat-outline'}></ion-icon></div>
                <div className="sg-rule__t">
                  <div className="n">{window.sgPlaylist(r.playlistId).name} — {r.detail}</div>
                  <div className="m">{r.when} · {r.dow} · priorité {r.priority}</div>
                </div>
                {r.conflict && <span className="sg-chip" style={{ background: '#fff', borderColor: '#f3c9bc', color: '#a8412a' }}><ion-icon name="alert-circle-outline"></ion-icon>Chevauche la règle par défaut</span>}
              </div>
            ))}
          </div>
        );
      })}

      <div className="sg-lane">
        <div className="sg-lane__hd">
          <ion-icon name="warning-outline" style={{ color: '#8d3fb0', fontSize: 17 }}></ion-icon>
          <span className="n">Prise de contrôle</span>
        </div>
        <div className="sg-note">
          <ion-icon name="information-circle-outline"></ion-icon>
          <div>Une prise de contrôle passe devant toutes les règles, sur tout le périmètre choisi. Sans heure de fin, elle reste signalée sur la liste des écrans jusqu’à ce qu’un responsable y mette fin.</div>
        </div>
        {takeover
          ? <button className="pa-btn" onClick={() => { onTakeover(false); onToast('Diffusion normale rétablie'); }}><ion-icon name="stop-outline"></ion-icon>Mettre fin à la prise de contrôle</button>
          : <button className="pa-btn" onClick={() => { onTakeover(true); onToast('Prise de contrôle active sur tous les sites'); }}><ion-icon name="megaphone-outline"></ion-icon>Démarrer une prise de contrôle</button>}
      </div>
    </div>
  );
}

/* ============================================================
   PROOF OF PLAY — gaps reported as gaps
   ============================================================ */
function SgProof() {
  const tones = ['#8d3fb0', '#4b4ad9', '#2e9e5b', '#e0a32e'];
  return (
    <div className="sg-proof">
      <div className="sg-note" style={{ margin: 0 }}>
        <ion-icon name="information-circle-outline"></ion-icon>
        <div>Les relevés sont écrits sur l’écran puis remontés par lots. Une coupure est déclarée comme telle : rien n’est reconstitué ni estimé.</div>
      </div>
      {window.KZ_SG_PROOF.map((row) => {
        const total = row.items.reduce((s, i) => s + i[1], 0);
        return (
          <div key={row.playerId} className="sg-prow">
            <div className="sg-prow__hd">
              <span className="n">{row.label}</span>
              <div className="r">
                <span className="sg-chip"><ion-icon name="play-outline"></ion-icon>{row.plays} diffusions</span>
                <span className="sg-chip"><ion-icon name="time-outline"></ion-icon>{row.hours} h</span>
                {row.gapMin > 0
                  ? <span className="sg-chip warn"><ion-icon name="cloud-offline-outline"></ion-icon>Coupure {row.gapMin} min</span>
                  : <span className="sg-chip" style={{ background: 'var(--kz-success-wash)', borderColor: '#bfe3cd', color: '#217844' }}><ion-icon name="checkmark-outline"></ion-icon>Complet</span>}
              </div>
            </div>
            <div className="sg-stack">
              {row.items.map((it, n) => (
                <i key={it[0]} style={{ width: (it[1] / total * 100) + '%', background: tones[n % 4] }}>{it[1] / total > .16 ? it[2] + ' min' : ''}</i>
              ))}
            </div>
            <div className="sg-legend">
              {row.items.map((it, n) => (
                <span key={it[0]}><i style={{ background: tones[n % 4] }} />{it[0]} <b>{it[1]}×</b></span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   PHONE — monitor, not author
   ============================================================ */
function SgPhone({ players, view, onView, onOpen, takeover, onToast }) {
  const off = players.filter((p) => p.state === 'offline' || p.state === 'stale_cache');
  return (
    <div className="sg-phone">
      <div className="sg-phone__hd">
        <div className="e">Signage</div>
        <h1>{view === 'media' ? 'Media' : view === 'proof' ? 'Diffusions' : 'Écrans'}</h1>
      </div>
      <div className="sg-phone__b">
        {view === 'screens' && (
          <>
            {takeover && <div className="sg-alert over"><ion-icon name="megaphone-outline"></ion-icon><div><b>Prise de contrôle active</b> — sans heure de fin</div></div>}
            {off.length > 0 && (
              <div className={'sg-alert ' + (off.some((p) => p.state === 'offline') ? 'bad' : 'warn')}>
                <ion-icon name="alert-circle-outline"></ion-icon>
                <div><b>{off.length} écran{off.length > 1 ? 's' : ''}</b> à vérifier</div>
              </div>
            )}
            {players.map((p) => <window.SgCard key={p.id} p={p} onOpen={onOpen} takeover={takeover} />)}
          </>
        )}
        {view === 'media' && <SgMedia onToast={onToast} />}
        {view === 'proof' && <SgProof />}
      </div>
      <div className="sg-phone__tabs">
        {[['screens', 'tv-outline', 'Écrans'], ['media', 'images-outline', 'Media'], ['proof', 'stats-chart-outline', 'Diffusions']].map(([id, ic, l]) => (
          <button key={id} className={view === id ? 'on' : ''} onClick={() => onView(id)}><ion-icon name={ic}></ion-icon>{l}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SgPlaylists, SgMedia, SgBoards, SgSchedule, SgProof, SgPhone });
