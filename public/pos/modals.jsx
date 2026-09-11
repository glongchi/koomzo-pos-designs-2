/* Koomzo POS — charge / tender sheet */
const { useState: useStateM } = React;

function ChargeSheet({ total, onDone, onClose }) {
  const [tender, setTender] = useStateM('card');
  const [paid, setPaid] = useStateM(false);

  if (paid) {
    return (
      <div className="scrim" onClick={onDone}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="paid">
            <div className="paid__icon"><ion-icon name="checkmark-circle"></ion-icon></div>
            <h3 className="sheet__title">Payment Successful</h3>
            <p className="sheet__sub">{money(total)} · {tender === 'card' ? 'Card' : tender === 'cash' ? 'Cash' : 'Loyalty'}</p>
          </div>
          <div className="sheet__actions">
            <button className="btn-fill" style={{ flex: 1 }} onClick={onDone}>New Order</button>
          </div>
        </div>
      </div>
    );
  }

  const tenders = [
    { id: 'cash', label: 'Cash', icon: 'cash-outline' },
    { id: 'card', label: 'Card', icon: 'card-outline' },
    { id: 'wallet', label: 'Wallet', icon: 'phone-portrait-outline' },
    { id: 'loyalty', label: 'Loyalty', icon: 'star-outline' },
  ];

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="sheet__title">Charge Order</h3>
        <p className="sheet__sub">Select a payment method to tender.</p>
        <div className="sheet__display">{money(total)}</div>
        <div className="tenders">
          {tenders.map((t) => (
            <button key={t.id} className={'tender' + (tender === t.id ? ' sel' : '')} onClick={() => setTender(t.id)}>
              <ion-icon name={t.icon}></ion-icon>{t.label}
            </button>
          ))}
        </div>
        <div className="sheet__actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-fill" onClick={() => setPaid(true)}>Validate {money(total)}</button>
        </div>
      </div>
    </div>
  );
}

window.ChargeSheet = ChargeSheet;
