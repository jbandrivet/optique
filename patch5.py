import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's replace the theme === 'corr' block to add bagues (spacer rings and retaining rings)
corr_draw_old = '''            corrData.lenses.forEach((l, i) => {
                currentX += l.d * scaleCorr;
                let cx = currentX + (l.t * scaleCorr) / 2;
                drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1 * scaleCorr, l.r2 * scaleCorr, l.t * scaleCorr);
                
                ctx.fillStyle = C_TEXT; ctx.font = "12px Orbitron"; ctx.textAlign = "center";
                ctx.fillText(`L${i+1}: ${l.glass}`, cx, axisY + (outerDiam * scaleCorr)/2 + 25);
                let r1Txt = l.r1 === Infinity ? "Plan" : l.r1.toFixed(1);
                let r2Txt = l.r2 === Infinity ? "Plan" : l.r2.toFixed(1);
                ctx.fillText(`R1:${r1Txt} R2:${r2Txt}`, cx, axisY + (outerDiam * scaleCorr)/2 + 40);
                ctx.fillText(`ép:${l.t.toFixed(1)}`, cx, axisY + (outerDiam * scaleCorr)/2 + 55);
                
                if (l.d > 0) dDim(`d=${l.d.toFixed(1)}`, currentX - l.d * scaleCorr, currentX, axisY - (corrData.diam * scaleCorr)/2 - 10);
                currentX += l.t * scaleCorr;
            });'''

corr_draw_new = '''            let ringThick = (corrData.diam * scaleCorr) * 0.10; // Epaisseur des bagues (10% diam)
            let topInnerY = axisY - (corrData.diam * scaleCorr) / 2;
            let botInnerY = axisY + (corrData.diam * scaleCorr) / 2;
            
            // Front Retaining Ring
            let frontRingWidth = 5 * scaleCorr;
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
            ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth=1;
            ctx.strokeRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
            
            currentX += frontRingWidth;

            corrData.lenses.forEach((l, i) => {
                if (l.d > 0) {
                    // Spacer ring (Bague d'espacement) between lenses
                    let gapX = currentX;
                    let gapW = l.d * scaleCorr;
                    ctx.fillStyle = "#666677";
                    ctx.fillRect(gapX, topInnerY, gapW, ringThick);
                    ctx.fillRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    ctx.strokeRect(gapX, topInnerY, gapW, ringThick);
                    ctx.strokeRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    
                    dDim(`d=${l.d.toFixed(1)}`, currentX, currentX + gapW, topInnerY - 10);
                }
                
                currentX += l.d * scaleCorr;
                let cx = currentX + (l.t * scaleCorr) / 2;
                drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1 * scaleCorr, l.r2 * scaleCorr, l.t * scaleCorr);
                
                ctx.fillStyle = C_TEXT; ctx.font = "12px Orbitron"; ctx.textAlign = "center";
                ctx.fillText(`L${i+1}: ${l.glass}`, cx, axisY + (outerDiam * scaleCorr)/2 + 25);
                let r1Txt = l.r1 === Infinity ? "Plan" : l.r1.toFixed(1);
                let r2Txt = l.r2 === Infinity ? "Plan" : l.r2.toFixed(1);
                ctx.fillText(`R1:${r1Txt} R2:${r2Txt}`, cx, axisY + (outerDiam * scaleCorr)/2 + 40);
                ctx.fillText(`ép:${l.t.toFixed(1)}`, cx, axisY + (outerDiam * scaleCorr)/2 + 55);
                
                currentX += l.t * scaleCorr;
            });
            
            // Back Retaining Ring
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
            ctx.strokeRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
'''
content = content.replace(corr_draw_old, corr_draw_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 5 done.")
