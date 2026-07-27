import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace mechanics block inside theme === 'corr'
pattern = r"(// Mechanics\s+let currentX = startXTube \+ \(extraMargin/2\) \* scaleCorr;).*?(// Back Retaining Ring.*?ctx\.strokeRect\(.*?\);\s+ctx\.restore\(\); return;\s+\})"
match = re.search(pattern, content, re.DOTALL)

if match:
    new_code = '''// Mechanics
            let ringThick = (corrData.diam * scaleCorr) * 0.10; // Epaisseur des bagues (10% diam)
            
            let edgePositions = [];
            let cxList = [];
            let tempX = startXTube + (extraMargin/2) * scaleCorr + (frontRingW * scaleCorr);
            corrData.lenses.forEach(l => {
                tempX += l.d * scaleCorr;
                let cx = tempX + (l.t * scaleCorr) / 2;
                
                let d_half = corrData.diam * scaleCorr / 2;
                let r1_s = l.r1 * scaleCorr;
                let r2_s = l.r2 * scaleCorr;
                
                if (r1_s !== Infinity && r1_s !== 0) d_half = Math.min(d_half, Math.abs(r1_s) * 0.99);
                if (r2_s !== Infinity && r2_s !== 0) d_half = Math.min(d_half, Math.abs(r2_s) * 0.99);
                
                let v1_x = cx - (l.t * scaleCorr)/2;
                let v2_x = cx + (l.t * scaleCorr)/2;
                
                let edge_left = v1_x;
                if (r1_s > 0) {
                    edge_left = v1_x + Math.abs(r1_s) - Math.sqrt(Math.pow(r1_s, 2) - Math.pow(d_half, 2));
                } else if (r1_s < 0) {
                    edge_left = v1_x - Math.abs(r1_s) + Math.sqrt(Math.pow(r1_s, 2) - Math.pow(d_half, 2));
                }
                
                let edge_right = v2_x;
                if (r2_s < 0) { 
                    edge_right = v2_x - Math.abs(r2_s) + Math.sqrt(Math.pow(r2_s, 2) - Math.pow(d_half, 2));
                } else if (r2_s > 0) { 
                    edge_right = v2_x + Math.abs(r2_s) - Math.sqrt(Math.pow(r2_s, 2) - Math.pow(d_half, 2));
                }
                
                edgePositions.push({left: edge_left, right: edge_right});
                cxList.push(cx);
                tempX += l.t * scaleCorr;
            });

            // Draw Front Ring
            let frontRingStart = startXTube + (extraMargin/2) * scaleCorr;
            let frontRingEnd = edgePositions.length > 0 ? edgePositions[0].left : frontRingStart + frontRingW * scaleCorr;
            ctx.fillStyle = "#888899";
            ctx.fillRect(frontRingStart, topInnerY, frontRingEnd - frontRingStart, ringThick);
            ctx.fillRect(frontRingStart, botInnerY - ringThick, frontRingEnd - frontRingStart, ringThick);
            ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth=1;
            ctx.strokeRect(frontRingStart, topInnerY, frontRingEnd - frontRingStart, ringThick);
            ctx.strokeRect(frontRingStart, botInnerY - ringThick, frontRingEnd - frontRingStart, ringThick);

            // Draw Spacers and Lenses
            let currentX = startXTube + (extraMargin/2) * scaleCorr + frontRingW * scaleCorr;
            corrData.lenses.forEach((l, i) => {
                if (i > 0) {
                    let gapStart = edgePositions[i-1].right;
                    let gapEnd = edgePositions[i].left;
                    if (gapEnd > gapStart) {
                        ctx.fillStyle = "#666677";
                        ctx.fillRect(gapStart, topInnerY, gapEnd - gapStart, ringThick);
                        ctx.fillRect(gapStart, botInnerY - ringThick, gapEnd - gapStart, ringThick);
                        ctx.strokeRect(gapStart, topInnerY, gapEnd - gapStart, ringThick);
                        ctx.strokeRect(gapStart, botInnerY - ringThick, gapEnd - gapStart, ringThick);
                        dDim(`d=${l.d.toFixed(1)}`, gapStart, gapEnd, topInnerY - 10);
                    }
                }
                
                currentX += l.d * scaleCorr;
                let cx = currentX + (l.t * scaleCorr) / 2;
                drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1 * scaleCorr, l.r2 * scaleCorr, l.t * scaleCorr);
                
                // Text Labels (Alternating top/bottom)
                let textY = (i % 2 === 0) ? botOuterY + 25 : topOuterY - 40;
                ctx.fillStyle = C_TEXT; ctx.font = "12px Orbitron"; ctx.textAlign = "center";
                ctx.fillText(`L${i+1}: ${l.glass}`, cx, textY);
                let r1Txt = l.r1 === Infinity ? "Plan" : l.r1.toFixed(1);
                let r2Txt = l.r2 === Infinity ? "Plan" : l.r2.toFixed(1);
                ctx.fillText(`R1:${r1Txt} R2:${r2Txt}`, cx, textY + 15);
                ctx.fillText(`ép:${l.t.toFixed(1)}`, cx, textY + 30);
                
                currentX += l.t * scaleCorr;
            });
            
            // Draw Back Ring
            if (edgePositions.length > 0) {
                let backRingStart = edgePositions[edgePositions.length - 1].right;
                let backRingEnd = currentX + backRingW * scaleCorr;
                ctx.fillStyle = "#888899";
                ctx.fillRect(backRingStart, topInnerY, backRingEnd - backRingStart, ringThick);
                ctx.fillRect(backRingStart, botInnerY - ringThick, backRingEnd - backRingStart, ringThick);
                ctx.strokeRect(backRingStart, topInnerY, backRingEnd - backRingStart, ringThick);
                ctx.strokeRect(backRingStart, botInnerY - ringThick, backRingEnd - backRingStart, ringThick);
            }
            
            ctx.restore(); return;
        }'''
    
    content = content.replace(match.group(0), new_code)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patch OK")
else:
    print("Pattern not found!")
