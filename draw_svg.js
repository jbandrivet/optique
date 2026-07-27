const fs = require('fs');

function lensSVG(cx, cy, d, r1, r2, t) {
    let d_half = d / 2;
    if (r1 !== Infinity && r1 !== 0) d_half = Math.min(d_half, Math.abs(r1) * 0.99);
    if (r2 !== Infinity && r2 !== 0) d_half = Math.min(d_half, Math.abs(r2) * 0.99);
    
    let v1_x = cx - t/2; 
    let v2_x = cx + t/2; 
    
    let path = `M `;
    
    // Left face (Top to bottom)
    if (r1 === Infinity || r1 === 0) {
        path += `${v1_x},${cy - d_half} L ${v1_x},${cy + d_half} `;
    } else {
        let A = Math.asin(d_half / Math.abs(r1));
        let startAngle, endAngle, ccw;
        if (r1 > 0) {
            startAngle = Math.PI + A;
            endAngle = Math.PI - A;
            ccw = true;
            // center = v1_x + r1
            let startX = (v1_x + r1) + Math.abs(r1) * Math.cos(startAngle);
            let startY = cy + Math.abs(r1) * Math.sin(startAngle);
            let endX = (v1_x + r1) + Math.abs(r1) * Math.cos(endAngle);
            let endY = cy + Math.abs(r1) * Math.sin(endAngle);
            path += `${startX},${startY} A ${Math.abs(r1)},${Math.abs(r1)} 0 0,0 ${endX},${endY} `;
        } else {
            startAngle = -A;
            endAngle = A;
            ccw = false;
            let startX = (v1_x + r1) + Math.abs(r1) * Math.cos(startAngle);
            let startY = cy + Math.abs(r1) * Math.sin(startAngle);
            let endX = (v1_x + r1) + Math.abs(r1) * Math.cos(endAngle);
            let endY = cy + Math.abs(r1) * Math.sin(endAngle);
            path += `${startX},${startY} A ${Math.abs(r1)},${Math.abs(r1)} 0 0,1 ${endX},${endY} `;
        }
    }
    
    // Right face (Bottom to top)
    if (r2 === Infinity || r2 === 0) {
        path += `L ${v2_x},${cy + d_half} L ${v2_x},${cy - d_half} `;
    } else {
        let A = Math.asin(d_half / Math.abs(r2));
        if (r2 > 0) {
            startAngle = Math.PI - A;
            endAngle = Math.PI + A;
            ccw = false;
            let startX = (v2_x + r2) + Math.abs(r2) * Math.cos(startAngle);
            let startY = cy + Math.abs(r2) * Math.sin(startAngle);
            let endX = (v2_x + r2) + Math.abs(r2) * Math.cos(endAngle);
            let endY = cy + Math.abs(r2) * Math.sin(endAngle);
            // arc to endX, endY
            path += `L ${startX},${startY} A ${Math.abs(r2)},${Math.abs(r2)} 0 0,1 ${endX},${endY} `;
        } else {
            startAngle = A;
            endAngle = -A;
            ccw = true;
            let startX = (v2_x + r2) + Math.abs(r2) * Math.cos(startAngle);
            let startY = cy + Math.abs(r2) * Math.sin(startAngle);
            let endX = (v2_x + r2) + Math.abs(r2) * Math.cos(endAngle);
            let endY = cy + Math.abs(r2) * Math.sin(endAngle);
            path += `L ${startX},${startY} A ${Math.abs(r2)},${Math.abs(r2)} 0 0,0 ${endX},${endY} `;
        }
    }
    
    path += `Z`;
    return `<path d="${path}" fill="rgba(0,200,255,0.4)" stroke="#0088ff" stroke-width="1" />`;
}

let cD = 50;
let svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">`;
let currentX = 50;
let cy = 100;

// Newton Lenses
let lenses = [
    {r1: cD * 3.0, r2: -cD * 3.0, t: cD * 0.3, d: 0},
    {r1: -cD * 1.6, r2: cD * 1.6, t: cD * 0.1, d: cD * 0.2},
    {r1: cD * 4.0, r2: -cD * 4.0, t: cD * 0.24, d: cD * 0.3}
];

lenses.forEach(l => {
    currentX += l.d;
    let cx = currentX + l.t/2;
    svg += lensSVG(cx, cy, cD, l.r1, l.r2, l.t) + "\n";
    currentX += l.t;
});

svg += `</svg>`;
fs.writeFileSync('lenses.svg', svg);
