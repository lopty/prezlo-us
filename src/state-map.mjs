import { readFileSync } from 'node:fs';

const atlas = JSON.parse(readFileSync(new URL('./state-atlas.json', import.meta.url), 'utf8'));
const {scale,translate} = atlas.transform;
const arcs = atlas.arcs.map(arc => {
  let x = 0;
  let y = 0;
  return arc.map(([dx,dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

function ringPoints(ring) {
  return ring.flatMap((id,index) => {
    const points = id < 0 ? [...arcs[~id]].reverse() : arcs[id];
    return index ? points.slice(1) : points;
  });
}

function center(points) {
  let area = 0;
  let x = 0;
  let y = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax,ay] = points[i-1];
    const [bx,by] = points[i];
    const cross = ax*by-bx*ay;
    area += cross;
    x += (ax+bx)*cross;
    y += (ay+by)*cross;
  }
  return {area:Math.abs(area),x:x/(3*area),y:y/(3*area)};
}

const shapes = new Map(atlas.objects.states.geometries.map(geometry => {
  const polygons = geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs;
  const rings = polygons.map(polygon => polygon.map(ringPoints));
  const path = rings.flat().map(points => 'M'+points.map(([x,y]) => x.toFixed(1)+','+y.toFixed(1)).join('L')+'Z').join('');
  const label = rings.map(([outer]) => center(outer)).sort((a,b) => b.area-a.area)[0];
  return [geometry.properties.name,{path,label}];
}));

const callouts = {
  VT:[858,18], NH:[915,18], MA:[971,108], RI:[981,142],
  CT:[954,173], NJ:[929,208], DE:[913,247], MD:[891,277]
};

export function renderStateMap(states) {
  const items = states.map(state => {
    const shape = shapes.get(state.name);
    if (!shape) throw new Error('Missing map boundary for '+state.name);
    return {...state,...shape};
  });

  const links = items.map(state => `<a class="atlas-state ${state.area.toLowerCase()}" href="${state.route}" aria-label="${state.name}, map" data-map-code="${state.code}"><title>${state.name}</title><path d="${state.path}" fill-rule="evenodd"/></a>`).join('');
  const labels = items.map(({code,route,label:{x,y}}) => {
    const point = callouts[code];
    if (!point) return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${code}</text>`;
    const [left,top] = point;
    return `<path d="M${x.toFixed(1)},${y.toFixed(1)} L${left},${top}"/><a class="atlas-callout" href="${route}" tabindex="-1"><rect x="${left-17}" y="${top-12}" width="34" height="24" rx="5"/><text x="${left}" y="${top}">${code}</text></a>`;
  }).join('');

  return `<svg class="atlas-map" viewBox="-75 -5 1090 630" role="group" aria-label="Map of the 50 United States">
    ${links}<g class="atlas-labels" aria-hidden="true">${labels}</g>
  </svg>`;
}
