import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

corr_draw_old_pattern = r"        if \(theme === 'corr'\) \{.*?\n        \}"
# We'll just replace the whole theme === 'corr' block since we know exactly what it should be.

# Let's extract the block to be sure we replace the right thing
match = re.search(r"(        if \(theme === 'corr'\) \{.*?\n        \})", content, re.DOTALL)
if not match:
    print("Could not find theme === 'corr' block")
    exit(1)

corr_draw_old = match.group(1)

corr_draw_new = '''        if (theme === 'corr') {
            if (!corrData || !corrData.lenses || corrData.lenses.length === 0) {
                ctx.fillStyle = C_TEXT; ctx.font = "20px Orbitron"; ctx.textAlign="center"; ctx.fillText("AUCUN CORRECTEUR", width/2, height/2);
                ctx.restore(); return;
            }
            let totalLensesLen = corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0);
            let frontRingW = 10; // 10 mm
            let backRingW = 10; // 10 mm
            let extraMargin = 10; // 5 mm empty space each side
            let tubeLength = totalLensesLen + frontRingW + backRingW + extraMargin;
            
            let tubeThickness = Math.max(corrData.diam * 0.05, 3);
            let outerDiam = corrData.diam + 2 * tubeThickness;
            
            let totalLenDraw = tubeLength + 150;
            let scaleCorr = (width - 200) / totalLenDraw;
            if (scaleCorr > (height - 200) / outerDiam) scaleCorr = (height - 200) / outerDiam;
            
            let startXTube = width/2 - (tubeLength * scaleCorr)/2;
            let endXTube = width/2 + (tubeLength * scaleCorr)/2;
            
            // Draw axis
            ctx.beginPath(); ctx.moveTo(-1000, axisY); ctx.lineTo(width+1000, axisY); ctx.setLineDash([5,5]); ctx.strokeStyle=C_AXIS; ctx.stroke(); ctx.setLineDash([]);
            
            // Draw Tube (housing)
            ctx.fillStyle = "#333344";
            let topInnerY = axisY - (corrData.diam * scaleCorr) / 2;
            let botInnerY = axisY + (corrData.diam * scaleCorr) / 2;
            let topOuterY = axisY - (outerDiam * scaleCorr) / 2;
            let botOuterY = axisY + (outerDiam * scaleCorr) / 2;
            
            ctx.fillRect(startXTube, topOuterY, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            ctx.fillRect(startXTube, botInnerY, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            
            ctx.strokeStyle = "#555566"; ctx.lineWidth = 2;
            ctx.strokeRect(startXTube, topOuterY, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            ctx.strokeRect(startXTube, botInnerY, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            
            // Tube dimensions
            dDim(`L. TUBE: ${tubeLength.toFixed(1)} mm`, startXTube, endXTube, topOuterY - 25);
            dDim(`Ø INT: ${corrData.diam.toFixed(1)} mm`, endXTube + 20, endXTube + 20, topInnerY, botInnerY); 
            ctx.beginPath(); ctx.moveTo(endXTube + 20, topInnerY); ctx.lineTo(endXTube + 20, botInnerY);
            ctx.moveTo(endXTube + 15, topInnerY); ctx.lineTo(endXTube + 25, topInnerY);
            ctx.moveTo(endXTube + 15, botInnerY); ctx.lineTo(endXTube + 25, botInnerY);
            ctx.strokeStyle=C_DIM; ctx.lineWidth=1; ctx.stroke();
            ctx.fillStyle=C_TEXT; ctx.font="12px Orbitron"; ctx.textAlign="left"; ctx.fillText(`Ø EXT: ${outerDiam.toFixed(1)} mm`, endXTube + 30, axisY);
            
            // Mechanics
            let currentX = startXTube + (extraMargin/2) * scaleCorr;
            let ringThick = (corrData.diam * scaleCorr) * 0.10; // Epaisseur des bagues (10% diam)
            let overlap = 3 * scaleCorr; // visual overlap
            
            // Front Retaining Ring
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, (frontRingW * scaleCorr) + overlap, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, (frontRingW * scaleCorr) + overlap, ringThick);
            ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth=1;
            ctx.strokeRect(currentX, topInnerY, (frontRingW * scaleCorr) + overlap, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, (frontRingW * scaleCorr) + overlap, ringThick);
            
            currentX += (frontRingW * scaleCorr);

            corrData.lenses.forEach((l, i) => {
                if (l.d > 0) {
                    let gapX = currentX - overlap;
                    let gapW = l.d * scaleCorr + 2*overlap;
                    ctx.fillStyle = "#666677";
                    ctx.fillRect(gapX, topInnerY, gapW, ringThick);
                    ctx.fillRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    ctx.strokeRect(gapX, topInnerY, gapW, ringThick);
                    ctx.strokeRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    
                    dDim(`d=${l.d.toFixed(1)}`, currentX, currentX + l.d * scaleCorr, topInnerY - 10);
                }
                
                currentX += l.d * scaleCorr;
                let cx = currentX + (l.t * scaleCorr) / 2;
                drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1 * scaleCorr, l.r2 * scaleCorr, l.t * scaleCorr);
                
                ctx.fillStyle = C_TEXT; ctx.font = "12px Orbitron"; ctx.textAlign = "center";
                ctx.fillText(`L${i+1}: ${l.glass}`, cx, botOuterY + 25);
                let r1Txt = l.r1 === Infinity ? "Plan" : l.r1.toFixed(1);
                let r2Txt = l.r2 === Infinity ? "Plan" : l.r2.toFixed(1);
                ctx.fillText(`R1:${r1Txt} R2:${r2Txt}`, cx, botOuterY + 40);
                ctx.fillText(`ép:${l.t.toFixed(1)}`, cx, botOuterY + 55);
                
                currentX += l.t * scaleCorr;
            });
            
            // Back Retaining Ring
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX - overlap, topInnerY, (backRingW * scaleCorr) + overlap, ringThick);
            ctx.fillRect(currentX - overlap, botInnerY - ringThick, (backRingW * scaleCorr) + overlap, ringThick);
            ctx.strokeRect(currentX - overlap, topInnerY, (backRingW * scaleCorr) + overlap, ringThick);
            ctx.strokeRect(currentX - overlap, botInnerY - ringThick, (backRingW * scaleCorr) + overlap, ringThick);
            
            ctx.restore(); return;
        }'''

content = content.replace(corr_draw_old, corr_draw_new)

# Also fix the fallback issue when corrector is OFF but type is SCT
sct_fallback_old = '''                    if (type === 'sct') { // Lame à l'entrée
                        if (corrData.lenses && corrData.lenses.length > 0) {
                            drawLens(m2X, axisY, corrData.diam * scale, corrData.lenses[0].r1 * scale, corrData.lenses[0].r2 * scale, corrData.lenses[0].t * scale);
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText("Lame Schmidt", m2X, axisY - (corrData.diam*scale)/2 - 10);
                        } else {
                            const cRad = (D*scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.4)"; ctx.fillRect(m2X - 2*scale, axisY - cRad, 4*scale, cRad*2);
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText("Lame Schmidt", m2X, axisY - cRad - 10);
                        }
                    } else if (corrData.pos > 0) {'''

sct_fallback_new = '''                    if (type === 'sct' && corrData.lenses && corrData.lenses.length > 0) { // Lame à l'entrée
                        drawLens(m2X, axisY, corrData.diam * scale, corrData.lenses[0].r1 * scale, corrData.lenses[0].r2 * scale, corrData.lenses[0].t * scale);
                        ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText("Lame Schmidt", m2X, axisY - (corrData.diam*scale)/2 - 10);
                    } else if (corrData.pos > 0 && corrData.lenses && corrData.lenses.length > 0) {'''

content = content.replace(sct_fallback_old, sct_fallback_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 7 done.")
