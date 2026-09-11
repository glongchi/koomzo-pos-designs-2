/* Koomzo POS — Barcode Labels: shared presentational pieces
   • Barcode / QR — live code rendering via JsBarcode + qrcode-generator
   • LabelRender  — composes an item + template into a printable label
   • BcRail / BcTopbar — admin shell chrome (reuses padmin .pa-rail / .pa-topbar)
   Loaded as a Babel module; exports to window for sibling scripts. */

const { useRef, useEffect, useState, useMemo } = React;

const fmtOf = (label) => {
  const s = (window.BC_SYMBOLOGIES || []).find((x) => x.label === label);
  return s ? s.fmt : 'CODE128';
};

/* ---- live 1D barcode ---- */
function Barcode({ value, symbology, bar = 1.8 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.JsBarcode) return;
    const fmt = fmtOf(symbology);
    const opts = { displayValue: false, height: 60, width: bar, margin: 0, background: 'transparent' };
    try {
      window.JsBarcode(el, String(value || '0'), { ...opts, format: fmt });
    } catch (e) {
      try { window.JsBarcode(el, String(value || '0'), { ...opts, format: 'CODE128' }); } catch (_) {}
    }
    const w = +el.getAttribute('width') || 200;
    const h = +el.getAttribute('height') || 60;
    el.setAttribute('viewBox', `0 0 ${w} ${h}`);
    el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    el.removeAttribute('width');
    el.removeAttribute('height');
  }, [value, symbology, bar]);
  return <svg ref={ref} className="bc-svg"></svg>;
}

/* ---- live QR code ---- */
function QRCode({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.qrcode) return;
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(String(value || ' '));
      qr.make();
      el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      const svg = el.querySelector('svg');
      if (svg) { svg.removeAttribute('width'); svg.removeAttribute('height'); svg.style.width = '100%'; svg.style.height = '100%'; svg.style.display = 'block'; }
    } catch (e) {}
  }, [value]);
  return <div ref={ref} className="bc-qr"></div>;
}

/* ---- one composed label (item × template) ----
   pxmm = px per mm (controls render scale). outline draws the die-cut edge. */
function LabelRender({ item, tpl, pxmm = 3.4, outline = false, className }) {
  const it = item || window.BC_SAMPLE_ITEM;
  const W = Math.round(tpl.paper.w * pxmm);
  const H = Math.round(tpl.paper.h * pxmm);
  const header = tpl.header ? window.bcAttrValue(it, tpl.header) : '';
  const footerL = tpl.footerL ? window.bcAttrValue(it, tpl.footerL) : '';
  const footerR = tpl.footerR ? window.bcAttrValue(it, tpl.footerR) : '';
  const pad = Math.max(5, Math.round(W * 0.05));
  const isQR = tpl.kind === 'qr';
  const fs = (tpl.fontSize || 10) * (pxmm / 3.4);

  return (
    <div className={'bc-label' + (outline ? ' is-outline' : '') + (className ? ' ' + className : '')}
      style={{ width: W, height: H, padding: pad }}>
      {header && (
        <div className="bc-label__hd" style={{ fontWeight: tpl.bold ? 700 : 600, textAlign: tpl.align || 'center', fontSize: Math.max(7, fs) }}>
          {header}
        </div>
      )}
      <div className={'bc-label__code' + (isQR ? ' is-qr' : '')}>
        {isQR ? <QRCode value={it.barcode} /> : <Barcode value={it.barcode} symbology={tpl.symbology} />}
      </div>
      {tpl.showNumber && <div className="bc-label__num" style={{ fontSize: Math.max(6, fs * 0.78) }}>{it.barcode}</div>}
      {(footerL || footerR) && (
        <div className="bc-label__ft" style={{ fontSize: Math.max(6, fs * 0.82) }}>
          <span className="l">{footerL}</span>
          <span className="r">{footerR}</span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ADMIN SHELL CHROME
   ============================================================ */
function BcRail() {
  const items = [
    { icon: 'grid-outline', label: 'Home', href: 'Koomzo POS - Home.html' },
    { icon: 'cart-outline', label: 'Sell', href: 'Koomzo POS.html' },
    { icon: 'pricetags-outline', label: 'Items', href: 'Koomzo POS - Products.html' },
    { icon: 'barcode-outline', label: 'Labels', active: true },
    { icon: 'people-outline', label: 'Team', href: 'Koomzo POS - Users.html' },
    { icon: 'apps-outline', label: 'Apps', href: 'Koomzo POS - Apps.html' },
  ];
  return (
    <nav className="pa-rail">
      <a className="pa-rail__mark" href="Koomzo POS - Home.html"><ion-icon name="storefront"></ion-icon></a>
      {items.map((it) => (
        it.active
          ? <button key={it.label} className="pa-rail__item active"><ion-icon name={it.icon}></ion-icon>{it.label}</button>
          : <a key={it.label} className="pa-rail__item" href={it.href}><ion-icon name={it.icon}></ion-icon>{it.label}</a>
      ))}
      <div className="pa-rail__spacer"></div>
      <a className="pa-rail__item" href="Koomzo POS - Settings.html"><ion-icon name="settings-outline"></ion-icon>Settings</a>
    </nav>
  );
}

function BcTopbar({ crumb }) {
  return (
    <header className="pa-topbar">
      <div className="pa-topbar__crumb">
        <ion-icon name="barcode-outline"></ion-icon>
        Barcode Labels
        <ion-icon name="chevron-forward-outline"></ion-icon>
        <b>{crumb || 'Print Items'}</b>
      </div>
      <div className="pa-topbar__right">
        <span className="pa-topbar__sync"><ion-icon name="cloud-done-outline"></ion-icon>Synced</span>
        <button className="pa-btn icon" title="User guide"><ion-icon name="help-circle-outline"></ion-icon></button>
        <button className="pa-btn icon" title="Notifications"><ion-icon name="notifications-outline"></ion-icon></button>
        <div className="pa-avatar"><ion-icon name="person"></ion-icon></div>
      </div>
    </header>
  );
}

/* small paper-size descriptor chip */
function PaperChip({ paper, onClick }) {
  const dims = `${paper.w} × ${paper.h} mm`;
  return (
    <button className="bc-paperchip" onClick={onClick}>
      <ion-icon name={paper.type === 'thermal' ? 'receipt-outline' : paper.type === 'custom' ? 'resize-outline' : 'grid-outline'}></ion-icon>
      <span className="nm">{paper.name}</span>
      <span className="dm">{dims}</span>
      <ion-icon name="chevron-down-outline" style={{ fontSize: 14 }}></ion-icon>
    </button>
  );
}

Object.assign(window, { Barcode, QRCode, LabelRender, BcRail, BcTopbar, PaperChip, fmtOf });
