/* Koomzo POS — Flow Designer: geometry, SVG shape renderer, JSON highlight.
   Mirrors the workflow-ui control model: { id, type, cordinate:{x,y}, nextId, data }.
   Shapes: circle (Start/End ellipse) · activity (rect) · condition (diamond). */

const FD_SIZES = {
  activity: { w: 150, h: 54 },
  circle:   { w: 84,  h: 46 },
  condition:{ w: 124, h: 84 },
};

/* bounding box — activity stores top-left; circle/condition store center (repo convention) */
function fdBox(c) {
  const s = FD_SIZES[c.type];
  if (c.type === 'activity') {
    const left = c.cordinate.x, top = c.cordinate.y;
    return { left, top, w: s.w, h: s.h, cx: left + s.w / 2, cy: top + s.h / 2 };
  }
  const cx = c.cordinate.x, cy = c.cordinate.y;
  return { left: cx - s.w / 2, top: cy - s.h / 2, w: s.w, h: s.h, cx, cy };
}

function fdSide(box, side) {
  switch (side) {
    case 'top':    return { x: box.cx, y: box.top };
    case 'bottom': return { x: box.cx, y: box.top + box.h };
    case 'left':   return { x: box.left, y: box.cy };
    case 'right':  return { x: box.left + box.w, y: box.cy };
    default:       return { x: box.cx, y: box.cy };
  }
}

/* pick a sensible source side toward a target */
function fdAutoSide(from, to) {
  if (to.cy > from.cy + 20) return 'bottom';
  if (to.cx > from.cx) return 'right';
  if (to.cx < from.cx) return 'left';
  return 'bottom';
}
const fdOpposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/* orthogonal elbow path between two side points */
function fdLinkPath(a, b, fromSide) {
  if (fromSide === 'bottom' || fromSide === 'top') {
    const my = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${b.y}`;
  }
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} L ${mx} ${a.y} L ${mx} ${b.y} L ${b.x} ${b.y}`;
}

/* triangle handle points for a side */
function fdHandlePts(p, side) {
  switch (side) {
    case 'top':    return `${p.x},${p.y - 10} ${p.x - 6},${p.y - 1} ${p.x + 6},${p.y - 1}`;
    case 'bottom': return `${p.x},${p.y + 10} ${p.x - 6},${p.y + 1} ${p.x + 6},${p.y + 1}`;
    case 'left':   return `${p.x - 10},${p.y} ${p.x - 1},${p.y - 6} ${p.x - 1},${p.y + 6}`;
    case 'right':  return `${p.x + 10},${p.y} ${p.x + 1},${p.y - 6} ${p.x + 1},${p.y + 6}`;
  }
}

/* the SVG node */
function FdShape({ c, selected, running, connecting, isTarget, armedSide, onShapeDown, onSelect, onHandleDown }) {
  const box = fdBox(c);
  const label = c.data.Id;
  const isCond = c.type === 'condition';
  const sides = isCond ? ['bottom', 'right'] : ['top', 'right', 'bottom', 'left'];

  let shapeEl;
  if (c.type === 'activity') {
    shapeEl = <rect className={'fd-shape-rect' + (selected ? ' sel' : '') + (isTarget ? ' target' : '')} x={box.left} y={box.top} width={box.w} height={box.h} rx="3" ry="3" />;
  } else if (c.type === 'circle') {
    shapeEl = <ellipse className={'fd-shape-ellipse' + (selected ? ' sel' : '') + (isTarget ? ' target' : '')} cx={box.cx} cy={box.cy} rx={box.w / 2} ry={box.h / 2} />;
  } else {
    const pts = `${box.cx},${box.top} ${box.left + box.w},${box.cy} ${box.cx},${box.top + box.h} ${box.left},${box.cy}`;
    shapeEl = <polygon className={'fd-shape-diamond' + (selected ? ' sel' : '') + (isTarget ? ' target' : '')} points={pts} />;
  }

  return (
    <g className={'fd-shape-g' + (running ? ' running' : '')}>
      <g onPointerDown={(e) => onShapeDown(e, c.id)} onClick={(e) => { e.stopPropagation(); onSelect(c.id); }}>
        {shapeEl}
        <text className="fd-ctext" x={box.cx} y={box.cy} dominantBaseline="middle">{label}</text>
      </g>
      {/* condition branch labels */}
      {isCond && (
        <>
          <text className="fd-branchlabel" style={{ fill: 'var(--kz-success)' }} x={box.cx + 6} y={box.top + box.h + 16}>Yes</text>
          <text className="fd-branchlabel" x={box.left + box.w + 4} y={box.cy - 6}>No</text>
        </>
      )}
      {/* connection handles when selected */}
      {selected && sides.map((side) => {
        const p = fdSide(box, side);
        return <polygon key={side} className={'fd-handle' + (armedSide === side ? ' arming' : '')} points={fdHandlePts(p, side)}
          onPointerDown={(e) => { e.stopPropagation(); onHandleDown(c.id, side); }} />;
      })}
    </g>
  );
}

/* syntax-highlight JSON */
function fdHighlight(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="n">$1</span>');
}

Object.assign(window, { FD_SIZES, fdBox, fdSide, fdAutoSide, fdOpposite, fdLinkPath, fdHandlePts, FdShape, fdHighlight });
