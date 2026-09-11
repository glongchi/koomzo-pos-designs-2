/* Koomzo Salon — queue display. Unattended wall board: no interaction, no scrolling.
   Names are abbreviated for privacy; waits round up to 5 min. Scales counter tablet → TV. */

const shortName = (n) => {
  const p = n.trim().split(/\s+/);
  return p.length > 1 ? p[0] + ' ' + p[1][0] + '.' : p[0];
};
const roundUp5 = (m) => Math.ceil(m / 5) * 5;

function DisplayView({ api }) {
  const [page, setPage] = useState(0);
  const [beat, setBeat] = useState(0);
  useEffect(() => { const i = setInterval(() => setBeat((b) => b + 1), 1000); return () => clearInterval(i); }, []);

  const chairs = SL.staff.filter((s) => s.status !== 'off' && !/Front desk/.test(s.role));
  const inChair = (id) => api.appts.find((a) => a.staff === id && a.status === 'chair');
  const upNext = api.appts
    .filter((a) => a.status !== 'done' && a.status !== 'noshow' && a.status !== 'chair' && a.start + a.dur > SL.now)
    .sort((a, b) => a.start - b.start);

  const PER = 4;
  const pages = Math.max(1, Math.ceil(upNext.length / PER));
  useEffect(() => {
    if (pages < 2) { setPage(0); return; }
    const i = setInterval(() => setPage((p) => (p + 1) % pages), 8000);
    return () => clearInterval(i);
  }, [pages]);
  const shown = upNext.slice(page * PER, page * PER + PER);
  const houseWait = chairs.length ? Math.min(...chairs.map((s) => waitFor(api.appts, s.id))) : 0;

  return (
    <div className="disp">
      <header className="disp__top">
        <div className="disp__brand"><span className="disp__mark"><ion-icon name="cut-outline"></ion-icon></span>{SL.shop}</div>
        <div className="sp"></div>
        <div className="disp__wait">
          <span className="k">Walk-in wait</span>
          <b>{houseWait ? '~' + roundUp5(houseWait) + ' min' : 'No wait'}</b>
        </div>
        <div className="disp__clock">
          <i className={beat % 2 ? 'dim' : ''}></i>{fmt(SL.now)}
        </div>
      </header>

      <section className="disp__now">
        <h2 className="disp__lbl">In the chair</h2>
        <div className="disp__chairs">
          {chairs.map((s) => {
            const a = inChair(s.id);
            const done = a ? a.start + a.dur : null;
            const pct = a ? Math.min(100, Math.max(4, ((SL.now - a.start) / a.dur) * 100)) : 0;
            const over = a && SL.now > done;
            return (
              <article className={'ch' + (a ? '' : ' free')} key={s.id}>
                <div className="ch__who">
                  <span className={'av lg ' + s.tone}>{s.init}</span>
                  <span className="ch__stf">{s.first}</span>
                </div>
                {a ? (
                  <>
                    <div className="ch__cli">{shortName(a.client)}</div>
                    <div className="ch__svc">{a.service}</div>
                    <div className="ch__bar"><i style={{ width: pct + '%' }} className={over ? 'late' : ''}></i></div>
                    <div className="ch__eta">{over ? 'Finishing up' : 'Until ' + fmt(done)}</div>
                  </>
                ) : (
                  <>
                    <div className="ch__cli free">Free now</div>
                    <div className="ch__svc">Ready for the next client</div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="disp__next">
        <div className="disp__nexthd">
          <h2 className="disp__lbl">Up next</h2>
          <div className="sp"></div>
          {pages > 1 && <div className="disp__dots">{Array.from({ length: pages }).map((_, i) => <i key={i} className={i === page ? 'on' : ''}></i>)}</div>}
        </div>
        <div className="disp__q">
          {shown.map((a, i) => {
            const pos = page * PER + i + 1;
            const wait = Math.max(0, a.start - SL.now);
            return (
              <div className={'qr' + (pos === 1 ? ' first' : '')} key={a.id}>
                <span className="qr__p">{pos}</span>
                <span className="qr__b">
                  <b>{shortName(a.client)}</b>
                  <small>{a.service} · {staffOf(a.staff).first}</small>
                </span>
                <span className="qr__w">
                  {pos === 1 && wait <= 5 ? <em>You’re next</em> : <>~{roundUp5(wait)}<small>min</small></>}
                </span>
              </div>
            );
          })}
          {!upNext.length && <div className="qr empty">Nobody waiting — walk in and we’ll see you now.</div>}
        </div>
      </section>

      <footer className="disp__foot">
        <ion-icon name="tablet-portrait-outline"></ion-icon>
        Walk-ins: check in at the desk screen · we’ll text you when your chair is ready
      </footer>
    </div>
  );
}

Object.assign(window, { DisplayView, shortName, roundUp5 });
