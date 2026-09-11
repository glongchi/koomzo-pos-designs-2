/* Koomzo Signage — presentational components.
   The centrepiece is SgScreen: it renders what a player is actually showing by
   resolving a board's QUERY against the live catalogue, the same way the real
   engine does. Nothing here stores a price. */

const SGF = window.KZ_SG_FMT;
const sgAsset = (id) => window.KZ_SG_ASSETS.find((a) => a.id === id);
const sgBoard = (id) => window.KZ_SG_BOARDS.find((b) => b.id === id);
const sgPlaylist = (id) => window.KZ_SG_PLAYLISTS.find((p) => p.id === id);
const sgSite = (id) => (window.KZ_SG_SITES.find((s) => s.id === id) || { name: '—' }).name;

const SG_ITEM_KIND = {
  media:      { label:'Media',       icon:'image-outline' },
  board:      { label:'Board',       icon:'pricetags-outline' },
  ticker:     { label:'Price ticker', icon:'pricetag-outline' },
  nowserving: { label:'Now serving', icon:'megaphone-outline' },
  notice:     { label:'Notice',      icon:'reader-outline' },
};

/* item weight, used by the publish guard */
const sgItemBytes = (it) => it.kind === 'media' ? (sgAsset(it.ref) || {}).bytes || 0 : 40_000;
const sgWeight = (pl) => pl.items.reduce((s, it) => s + sgItemBytes(it), 0);

/* ============================================================
   THE SCREEN — one component, every surface a player can show
   ============================================================ */
function SgBoardRender({ board, at }) {
  const cat = window.KZ_SG_CATALOG[board.source] || { name: '—', items: [] };
  const hide = board.soldOut === 'hide';
  const items = hide ? cat.items.filter((i) => i.stock > 0) : cat.items;
  const outCls = (i) => i.stock > 0 ? '' : ' out' + (board.soldOut === 'strike' ? ' strike' : '');
  const bg = board.accent;
  const eyebrow = board.kind === 'menu' ? 'Menu' : board.kind === 'rate' ? 'Tarifs' : 'Prix';

  /* RATES — reception's wall. Read from across a lobby: the rate is the hero, and
     availability sits beside it because "what does it cost" and "have you got one"
     are the same question. Sold out here means the type is full tonight. */
  if (board.template === 'rates') {
    const unit = cat.unit || 'nuit';
    return (
      <div className="sg-scr sg-scr--rates" style={{ background: bg }}>
        <div className="sg-scr__hd">
          <div className="sg-scr__ttl">{cat.name.split(' — ')[0]}</div>
          <div className="sg-scr__eyebrow">{eyebrow} · par {unit}</div>
        </div>
        <div className="sg-scr__body">
          {items.slice(0, 4).map((i) => (
            <div key={i.id} className={'sg-rate' + outCls(i)}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sg-rate__n">{i.name}</div>
                {i.desc && <div className="sg-line__d">{i.desc}</div>}
              </div>
              <div className="sg-rate__r">
                <div className="sg-rate__p">{SGF.money(i.price)}</div>
                <div className="sg-rate__a">{i.stock > 0 ? i.stock + ' libre' + (i.stock > 1 ? 's' : '') : 'Complet'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="sg-scr__tick"><i />Mobile money accepté · Arrivée dès 14h</div>
      </div>
    );
  }

  /* CLASSES — the club's entrance wall. The hour is the anchor a member scans for,
     the places left answers "can I still get in" without asking anyone. */
  if (board.template === 'classes') {
    return (
      <div className="sg-scr sg-scr--classes" style={{ background: bg }}>
        <div className="sg-scr__hd">
          <div className="sg-scr__ttl">{cat.name}</div>
          <div className="sg-scr__eyebrow">Réservez à l’accueil</div>
        </div>
        <div className="sg-scr__body">
          {items.slice(0, 4).map((i) => (
            <div key={i.id} className={'sg-cls' + (i.stock > 0 ? '' : ' out')}>
              <div className="sg-cls__t">{i.at}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sg-rate__n">{i.name}</div>
                {i.desc && <div className="sg-line__d">{i.desc}</div>}
              </div>
              <div className="sg-rate__r">
                <div className="sg-cls__p">{i.price > 0 ? SGF.money(i.price) : 'Inclus'}</div>
                <div className="sg-rate__a">{i.stock > 0 ? i.stock + ' place' + (i.stock > 1 ? 's' : '') : 'Complet'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="sg-scr__tick"><i />Annulation gratuite jusqu’à 4 h avant le cours</div>
      </div>
    );
  }

  /* OCCUPANCY — how busy the club is, by zone. One number big enough to read from
     the door, so a member decides before they change. */
  if (board.template === 'occupancy') {
    const cap = cat.cap || 0;
    const free = items.reduce((a, i) => a + i.stock, 0);
    return (
      <div className="sg-scr sg-scr--occ" style={{ background: bg }}>
        <div className="sg-scr__hd">
          <div className="sg-scr__ttl">{cat.name}</div>
          <div className="sg-scr__eyebrow">en direct</div>
        </div>
        <div className="sg-scr__body">
          <div className="sg-occ__big">{free}<span>places libres sur {cap}</span></div>
          <div className="sg-occ__z">
            {items.map((i) => (
              <div key={i.id} className={'sg-occ__c' + (i.stock > 0 ? '' : ' out')}>
                <b>{i.stock > 0 ? i.stock : 'Complet'}</b>
                <span>{i.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sg-scr__tick"><i />Mis à jour à chaque passage au tourniquet</div>
      </div>
    );
  }

  if (board.template === 'grid') {
    return (
      <div className="sg-scr sg-scr--grid" style={{ background: bg }}>
        <div className="sg-scr__hd"><div className="sg-scr__ttl">{cat.name}</div><div className="sg-scr__eyebrow">{eyebrow}</div></div>
        <div className="sg-scr__body">
          {items.slice(0, 4).map((i) => (
            <div key={i.id} className={'sg-cell' + (i.stock > 0 ? '' : ' out')}>
              <div className="n">{i.name}</div>
              <div className="p">{i.was && <span className="sg-line__was">{SGF.money(i.was)}</span>}{SGF.money(i.price)}</div>
            </div>
          ))}
        </div>
        <div className="sg-scr__tick"><i />Prix valables jusqu’au 15 septembre · Mobile money accepté</div>
      </div>
    );
  }
  if (board.template === 'hero') {
    const hero = items[0] || { name: '—', price: 0 };
    return (
      <div className="sg-scr sg-scr--hero" style={{ background: bg }}>
        <div className="sg-scr__hd"><div className="sg-scr__eyebrow" style={{ marginLeft: 0 }}>{cat.name}</div></div>
        <div className="sg-scr__body">
          <div className="sg-hero">{hero.name}</div>
          {items.slice(1, 4).map((i) => (
            <div key={i.id} className={'sg-line' + outCls(i)}>
              <div className="sg-line__n">{i.name}</div><div className="sg-line__dot" />
              <div className="sg-line__p">{SGF.money(i.price)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const twoCol = board.template === 'two-col';
  return (
    <div className={'sg-scr' + (twoCol ? ' sg-scr--two' : '')} style={{ background: bg }}>
      <div className="sg-scr__hd"><div className="sg-scr__ttl">{cat.name}</div><div className="sg-scr__eyebrow">{eyebrow}</div></div>
      <div className="sg-scr__body">
        {items.slice(0, twoCol ? 6 : 5).map((i) => (
          <div key={i.id} className={'sg-line' + outCls(i)}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sg-line__n">{i.name}</div>
              {i.desc && <div className="sg-line__d">{i.desc}</div>}
            </div>
            {!twoCol && <div className="sg-line__dot" />}
            <div className="sg-line__p">{SGF.money(i.price)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SgScreen({ item, state, pairCode, staleVersion }) {
  if (state === 'unpaired') {
    return (
      <div className="sg-off" style={{ gap: 10 }}>
        <span style={{ color: '#8e94a8' }}>Code d’appariement</span>
        <div className="sg-code">{pairCode}</div>
        <div className="sg-off__hint">Saisissez ce code ici pour lier l’écran</div>
      </div>
    );
  }
  if (state === 'offline') {
    return (
      <>
        <SgItemRender item={item} />
        <div className="sg-veil"><ion-icon name="cloud-offline-outline"></ion-icon>Cache — dernière version complète</div>
      </>
    );
  }
  return (
    <>
      <SgItemRender item={item} />
      {state === 'stale_cache' && <div className="sg-veil" style={{ background: 'rgba(224,163,46,.42)' }}><ion-icon name="warning-outline"></ion-icon>Version {staleVersion} — pas à jour</div>}
    </>
  );
}

function SgItemRender({ item }) {
  if (!item) return <div className="sg-off"><ion-icon name="tv-outline"></ion-icon><span>Aucune playlist</span></div>;
  if (item.kind === 'board') {
    const b = sgBoard(item.ref);
    return b ? <SgBoardRender board={b} /> : null;
  }
  if (item.kind === 'media') {
    const a = sgAsset(item.ref);
    if (!a) return null;
    return (
      <div className="sg-scr sg-scr--media" style={{ background: a.tone }}>
        <div className="t">{a.name}</div>
        <div className="k">{a.kind === 'video' ? 'Vidéo · ' + SGF.secs(a.ms) : 'Affiche'}</div>
      </div>
    );
  }
  if (item.kind === 'nowserving') {
    return (
      <div className="sg-scr sg-scr--now" style={{ background: '#303b57' }}>
        <div className="lbl">Nous servons</div>
        <div className="no">A-24</div>
        <div className="who">Chaise 2 · Marceline</div>
      </div>
    );
  }
  if (item.kind === 'ticker') {
    return (
      <div className="sg-scr" style={{ background: '#ec603a', justifyContent: 'flex-end' }}>
        <div className="sg-scr__hd"><div className="sg-scr__ttl">Baisses du jour</div></div>
        <div className="sg-scr__body">
          {window.KZ_SG_CATALOG['cat.shelf'].items.slice(0, 3).map((i) => (
            <div key={i.id} className="sg-line">
              <div className="sg-line__n">{i.name}</div><div className="sg-line__dot" />
              <div className="sg-line__p"><span className="sg-line__was">{SGF.money(i.was)}</span>{SGF.money(i.price)}</div>
            </div>
          ))}
        </div>
        <div className="sg-scr__tick"><i />Jusqu’à −18% sur l’épicerie sèche</div>
      </div>
    );
  }
  return <div className="sg-off"><ion-icon name="reader-outline"></ion-icon><span>Note</span></div>;
}

/* ============================================================
   CHROME
   ============================================================ */
function SgTopbar({ crumb }) {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="tv-outline"></ion-icon>Signage
        <ion-icon name="chevron-forward-outline"></ion-icon><b>{crumb}</b>
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
   FLEET CARD
   ============================================================ */
function SgCard({ p, onOpen, takeover }) {
  const st = window.KZ_SG_STATES[takeover && p.state !== 'unpaired' ? 'takeover' : p.state];
  const kind = window.KZ_SG_KINDS[p.kind];
  const pl = p.playlistId ? sgPlaylist(p.playlistId) : null;
  const item = pl ? pl.items.find((i) => i.id === p.nowItem) || pl.items[0] : null;
  const cachePct = Math.round(p.cacheMb / p.cacheCapMb * 100);
  const hot = cachePct >= 90;
  const takeoverItem = { kind: 'media', ref: 'a4' };

  return (
    <div className={'sg-card' + (p.orientation === 'portrait' ? ' portrait' : '')}>
      <div className="sg-card__scr">
        <span className="sg-card__badge"><i style={{ background: st.dot }} />{st.label}</span>
        {p.state === 'playing' && !takeover && <span className="sg-card__live">{SGF.secs(item ? item.ms : 0)}</span>}
        {takeover && p.state !== 'unpaired'
          ? <div className="sg-scr sg-scr--media" style={{ background: '#8d3fb0' }}><div className="t">Fermeture exceptionnelle à 18h</div><div className="k">Message prioritaire</div></div>
          : <SgScreen item={item} state={p.state} pairCode={p.pairCode} staleVersion={p.staleVersion} />}
      </div>
      <div className="sg-card__body">
        <div className="sg-card__hd">
          <div style={{ minWidth: 0 }}>
            <div className="sg-card__nm">{p.label}</div>
            <div className="sg-card__sub"><ion-icon name="location-outline"></ion-icon>{sgSite(p.siteId)} · {p.res}</div>
          </div>
          <div className="sg-card__kind" title={kind.label}><ion-icon name={kind.icon}></ion-icon></div>
        </div>

        {p.state === 'unpaired' ? (
          <div className="sg-card__meta"><span className="sg-chip"><ion-icon name="hardware-chip-outline"></ion-icon>{kind.label}</span><span className="sg-chip">Aucune playlist</span></div>
        ) : (
          <>
            <div className="sg-card__meta">
              <span className="sg-chip pl"><ion-icon name="albums-outline"></ion-icon>{pl ? pl.name : '—'}</span>
              {p.idleHandover && <span className="sg-chip"><ion-icon name="swap-horizontal-outline"></ion-icon>Relais inactif</span>}
              {p.state === 'offline'
                ? <span className="sg-chip warn"><ion-icon name="cloud-offline-outline"></ion-icon>Vu il y a {SGF.ago(p.lastSeenMin)}</span>
                : <span className="sg-chip"><ion-icon name="pulse-outline"></ion-icon>{SGF.ago(p.lastSeenMin)}</span>}
            </div>
            <div>
              <div className={'sg-bar' + (hot ? ' hot' : '')}><i style={{ width: cachePct + '%' }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, font: '500 11px var(--kz-font-sans)', color: 'var(--kz-muted-2)' }}>
                <span>Cache {SGF.mb(p.cacheMb)} / {SGF.mb(p.cacheCapMb)}</span><span>v{p.version}</span>
              </div>
            </div>
          </>
        )}

        <div className="sg-card__foot">
          {p.state === 'unpaired'
            ? <button className="pa-btn primary" onClick={() => onOpen(p.id)} style={{ flex: 1, justifyContent: 'center' }}><ion-icon name="link-outline"></ion-icon>Apparier</button>
            : <>
                <button className="pa-btn" onClick={() => onOpen(p.id)}><ion-icon name="eye-outline"></ion-icon>Détails</button>
                <button className="pa-btn" onClick={() => onOpen(p.id)}><ion-icon name="swap-horizontal-outline"></ion-icon>Réaffecter</button>
              </>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PLAYER DRAWER
   ============================================================ */
function SgDrawer({ p, onClose, onAssign, onToast }) {
  if (!p) return null;
  const pl = p.playlistId ? sgPlaylist(p.playlistId) : null;
  const item = pl ? pl.items.find((i) => i.id === p.nowItem) || pl.items[0] : null;
  const st = window.KZ_SG_STATES[p.state];
  const kind = window.KZ_SG_KINDS[p.kind];
  return (
    <div className="sg-drawer" onClick={onClose}>
      <div className="sg-drawer__p" onClick={(e) => e.stopPropagation()}>
        <div className="sg-drawer__hd">
          <h3>{p.label}</h3>
          <button className="x" onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
        </div>
        <div className="sg-drawer__b">
          <div className="sg-drawer__scr"><SgScreen item={item} state={p.state} pairCode={p.pairCode} staleVersion={p.staleVersion} /></div>
          <div className="sg-kv">
            <div className="sg-kv__r">État<b style={{ color: st.ink }}>{st.label}</b></div>
            <div className="sg-kv__r">Type<b>{kind.label}</b></div>
            <div className="sg-kv__r">Site<b>{sgSite(p.siteId)}</b></div>
            <div className="sg-kv__r">Résolution<b>{p.res} · {p.orientation === 'portrait' ? 'portrait' : 'paysage'}</b></div>
            <div className="sg-kv__r">Dernier battement<b>{p.state === 'unpaired' ? '—' : 'il y a ' + SGF.ago(p.lastSeenMin)}</b></div>
            <div className="sg-kv__r">Cache<b>{SGF.mb(p.cacheMb)} / {SGF.mb(p.cacheCapMb)}</b></div>
            <div className="sg-kv__r">Version app<b>v{p.version}</b></div>
          </div>
          {p.state === 'unpaired' ? (
            <div className="sg-note"><ion-icon name="information-circle-outline"></ion-icon><div>Le code expire dans 10 minutes et ne sert qu’une fois. L’écran sera lié au site <b>{sgSite(p.siteId)}</b> — pour le déplacer, il faudra l’apparier à nouveau.</div></div>
          ) : (
            <div className="sg-field">
              <label>Playlist affectée</label>
              <div className="sg-seg">
                {window.KZ_SG_PLAYLISTS.filter((x) => x.status === 'published').map((x) => (
                  <button key={x.id} className={x.id === p.playlistId ? 'on' : ''} onClick={() => { onAssign(p.id, x.id); onToast('« ' + x.name +' » affectée à ' + p.label); }}>{x.name}</button>
                ))}
              </div>
            </div>
          )}
          {p.state === 'stale_cache' && (
            <div className="sg-note" style={{ background: 'var(--kz-warning-wash)', borderColor: '#efdcae' }}>
              <ion-icon name="warning-outline" style={{ color: '#c98a20' }}></ion-icon>
              <div>Cet écran joue encore la version {p.staleVersion}. Le cache est à {Math.round(p.cacheMb / p.cacheCapMb * 100)} % — libérez de la place ou allégez la playlist avant de republier.</div>
            </div>
          )}
        </div>
        <div className="sg-drawer__ft">
          {p.state === 'unpaired'
            ? <button className="pa-btn primary" onClick={() => { onToast('Écran apparié'); onClose(); }}><ion-icon name="link-outline"></ion-icon>Apparier cet écran</button>
            : <>
                <button className="pa-btn" onClick={() => onToast('Playlist renvoyée à ' + p.label)}><ion-icon name="refresh-outline"></ion-icon>Renvoyer</button>
                <button className="pa-btn primary" onClick={() => { onToast('Diffusion immédiate'); onClose(); }}><ion-icon name="play-outline"></ion-icon>Diffuser</button>
              </>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STATS STRIP
   ============================================================ */
function SgStats({ players }) {
  const live = players.filter((p) => p.state === 'playing').length;
  const off = players.filter((p) => p.state === 'offline').length;
  const stale = players.filter((p) => p.state === 'stale_cache').length;
  const unpaired = players.filter((p) => p.state === 'unpaired').length;
  return (
    <div className="sg-stats">
      <div className="sg-stat"><span className="l">En diffusion</span><span className="v">{live}</span><span className="s">sur {players.length} écrans</span></div>
      <div className={'sg-stat' + (off ? ' bad' : '')}><span className="l">Hors ligne</span><span className="v">{off}</span><span className="s">{off ? 'cache en lecture' : 'tous joignables'}</span></div>
      <div className={'sg-stat' + (stale ? ' warn' : '')}><span className="l">Cache non à jour</span><span className="v">{stale}</span><span className="s">{stale ? 'version précédente' : 'à jour'}</span></div>
      <div className="sg-stat"><span className="l">À apparier</span><span className="v">{unpaired}</span><span className="s">{unpaired ? 'code affiché' : 'aucun'}</span></div>
    </div>
  );
}

Object.assign(window, {
  SGF, sgAsset, sgBoard, sgPlaylist, sgSite, sgItemBytes, sgWeight, SG_ITEM_KIND,
  SgScreen, SgItemRender, SgBoardRender, SgTopbar, SgCard, SgDrawer, SgStats,
});
