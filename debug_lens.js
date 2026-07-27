const fs = require('fs');

function drawLensParams(d, r1, r2, t) {
    let d_half = d / 2;
    if (r1 !== Infinity && r1 !== 0) d_half = Math.min(d_half, Math.abs(r1) * 0.99);
    if (r2 !== Infinity && r2 !== 0) d_half = Math.min(d_half, Math.abs(r2) * 0.99);
    
    let sag1 = 0, sag2 = 0;
    if (r1 !== Infinity && r1 !== 0) {
        sag1 = Math.abs(r1) - Math.sqrt(Math.pow(r1, 2) - Math.pow(d_half, 2));
    }
    if (r2 !== Infinity && r2 !== 0) {
        sag2 = Math.abs(r2) - Math.sqrt(Math.pow(r2, 2) - Math.pow(d_half, 2));
    }
    console.log(`d=${d}, r1=${r1}, r2=${r2}, t=${t}`);
    console.log(`  sag1=${sag1.toFixed(2)}, sag2=${sag2.toFixed(2)}`);
    console.log(`  edge thickness = ${(t - sag1 - sag2).toFixed(2)}`);
}

let cD = 50;
console.log("NEWTON:");
drawLensParams(cD, cD*3.0, -cD*3.0, cD*0.3);
drawLensParams(cD, -cD*1.6, cD*1.6, cD*0.1);
drawLensParams(cD, cD*4.0, -cD*4.0, cD*0.24);
