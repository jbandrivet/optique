import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update runArchitect to compute custom corrector lenses
lens_gen_old = '''        if (type === 'newton') {
            corrType = "Corr. Coma (Wynne 3L)";
            corrPos = 50; 
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / N-F2 / N-BK7";
            lenses = [
                {r1: 150, r2: -150, t: 15, d: 0, glass: "N-BK7"},
                {r1: -100, r2: 120, t: 8, d: 20, glass: "N-F2"},
                {r1: 200, r2: -250, t: 12, d: 25, glass: "N-BK7"}
            ];
        } else if (type === 'dk') {
            corrType = "Corr. Sous-ouverture (Coma/Astig)";
            corrPos = 100;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / Silice Fondue";
            lenses = [
                {r1: 80, r2: Infinity, t: 10, d: 0, glass: "N-BK7"},
                {r1: -120, r2: 90, t: 8, d: 30, glass: "Silice Fondue"}
            ];
        } else if (type === 'rc') {
            corrType = "Aplanisseur (Astigmatisme)";
            corrPos = 60;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "Silice Fondue (x2)";
            lenses = [
                {r1: 200, r2: Infinity, t: 10, d: 0, glass: "Silice Fondue"},
                {r1: Infinity, r2: 150, t: 10, d: 15, glass: "Silice Fondue"}
            ];
        } else if (type === 'cassegrain') {
            corrType = "Aplanisseur de Champ";
            corrPos = 50;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7";
            lenses = [
                {r1: Infinity, r2: 100, t: 12, d: 0, glass: "N-BK7"}
            ];
        } else if (type === 'nasmyth') {
            corrType = "Aplanisseur Nasmyth";
            corrPos = 60;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / Silice Fondue";
            lenses = [
                {r1: 150, r2: -150, t: 10, d: 0, glass: "N-BK7"},
                {r1: -120, r2: Infinity, t: 8, d: 20, glass: "Silice Fondue"}
            ];
        } else if (type === 'sct') {
            corrType = "Lame de Schmidt (Correctrice)";
            corrPos = Sep + B; // A l'entrée
            corrDiam = D;
            corrGlass = "N-BK7 ou B270";
            lenses = [
                {r1: Infinity, r2: Infinity, t: 15, d: 0, glass: "N-BK7", special: "schmidt"}
            ];
        }

        let scaleLenses = corrDiam / 50;
        if(scaleLenses < 0.5) scaleLenses = 0.5;
        lenses.forEach(l => {
            if(l.r1 !== Infinity) l.r1 *= scaleLenses;
            if(l.r2 !== Infinity) l.r2 *= scaleLenses;
            l.t *= scaleLenses;
            l.d *= scaleLenses;
        });'''

lens_gen_new = '''        if (type === 'newton') {
            corrType = "Corr. Coma (Wynne 3L)";
            corrPos = 50; 
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / N-F2 / N-BK7";
            let cD = corrDiam;
            lenses = [
                {r1: F1 * 0.15, r2: -F1 * 0.15, t: cD * 0.25, d: 0, glass: "N-BK7"},
                {r1: -F1 * 0.10, r2: F1 * 0.12, t: cD * 0.15, d: cD * 0.35, glass: "N-F2"},
                {r1: F1 * 0.20, r2: -F1 * 0.25, t: cD * 0.20, d: cD * 0.45, glass: "N-BK7"}
            ];
        } else if (type === 'dk') {
            corrType = "Corr. Sous-ouverture (Coma/Astig)";
            corrPos = 100;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / Silice Fondue";
            let cD = corrDiam;
            lenses = [
                {r1: F_sys * 0.05, r2: Infinity, t: cD * 0.2, d: 0, glass: "N-BK7"},
                {r1: -F_sys * 0.08, r2: F_sys * 0.06, t: cD * 0.15, d: cD * 0.5, glass: "Silice Fondue"}
            ];
        } else if (type === 'rc') {
            corrType = "Aplanisseur (Astigmatisme)";
            corrPos = 60;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "Silice Fondue (x2)";
            let cD = corrDiam;
            lenses = [
                {r1: F_sys * 0.1, r2: Infinity, t: cD * 0.2, d: 0, glass: "Silice Fondue"},
                {r1: Infinity, r2: F_sys * 0.08, t: cD * 0.2, d: cD * 0.3, glass: "Silice Fondue"}
            ];
        } else if (type === 'cassegrain') {
            corrType = "Aplanisseur de Champ";
            corrPos = 50;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7";
            let cD = corrDiam;
            lenses = [
                {r1: Infinity, r2: F_sys * 0.05, t: cD * 0.25, d: 0, glass: "N-BK7"}
            ];
        } else if (type === 'nasmyth') {
            corrType = "Aplanisseur Nasmyth";
            corrPos = 60;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / Silice Fondue";
            let cD = corrDiam;
            lenses = [
                {r1: F_sys * 0.06, r2: -F_sys * 0.06, t: cD * 0.2, d: 0, glass: "N-BK7"},
                {r1: -F_sys * 0.05, r2: Infinity, t: cD * 0.15, d: cD * 0.4, glass: "Silice Fondue"}
            ];
        } else if (type === 'sct') {
            corrType = "Lame de Schmidt (Correctrice)";
            corrPos = Sep + B; // A l'entrée
            corrDiam = D;
            corrGlass = "N-BK7 ou B270";
            lenses = [
                {r1: Infinity, r2: Infinity, t: D * 0.05, d: 0, glass: "N-BK7", special: "schmidt"}
            ];
        }'''
content = content.replace(lens_gen_old, lens_gen_new)


# 2. Draw Corrector Tube and Dimensions in theme === 'corr'
corr_draw_old = '''        if (theme === 'corr') {
            if (!corrData || !corrData.lenses || corrData.lenses.length === 0) {
                ctx.fillStyle = C_TEXT; ctx.font = "20px Orbitron"; ctx.fillText("AUCUN CORRECTEUR", width/2 - 100, height/2);
                ctx.restore(); return;
            }
            let totalLenCorr = corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0) + 50;
            let scaleCorr = (width - 100) / totalLenCorr;
            if (scaleCorr > (height - 100) / corrData.diam) scaleCorr = (height - 100) / corrData.diam;
            let currentX = width/2 - (totalLenCorr*scaleCorr)/2 + 25*scaleCorr;
            corrData.lenses.forEach((l, i) => {
                currentX += l.d * scaleCorr;
                let cx = currentX + (l.t * scaleCorr) / 2;
                drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1 * scaleCorr, l.r2 * scaleCorr, l.t * scaleCorr);
                ctx.fillStyle = C_TEXT; ctx.font = "12px Orbitron"; ctx.textAlign = "center";
                ctx.fillText(`L${i+1}: ${l.glass}`, cx, axisY + (corrData.diam * scaleCorr)/2 + 20);
                let r1Txt = l.r1 === Infinity ? "Plan" : l.r1.toFixed(1);
                let r2Txt = l.r2 === Infinity ? "Plan" : l.r2.toFixed(1);
                ctx.fillText(`R1:${r1Txt} R2:${r2Txt}`, cx, axisY + (corrData.diam * scaleCorr)/2 + 35);
                ctx.fillText(`ép:${l.t.toFixed(1)}mm`, cx, axisY + (corrData.diam * scaleCorr)/2 + 50);
                if (l.d > 0) dDim(`d=${l.d.toFixed(1)}`, currentX - l.d * scaleCorr, currentX, axisY - (corrData.diam * scaleCorr)/2 - 20);
                currentX += l.t * scaleCorr;
            });
            ctx.restore(); return;
        }'''

corr_draw_new = '''        if (theme === 'corr') {
            if (!corrData || !corrData.lenses || corrData.lenses.length === 0) {
                ctx.fillStyle = C_TEXT; ctx.font = "20px Orbitron"; ctx.fillText("AUCUN CORRECTEUR", width/2 - 100, height/2);
                ctx.restore(); return;
            }
            let totalLensesLen = corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0);
            let tubeLength = totalLensesLen + (corrData.diam * 0.2); // extra margin for tube
            let tubeThickness = Math.max(corrData.diam * 0.05, 2);
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
            let topYTube = axisY - (outerDiam * scaleCorr) / 2;
            let botYTube = axisY + (corrData.diam * scaleCorr) / 2;
            ctx.fillRect(startXTube, topYTube, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            ctx.fillRect(startXTube, botYTube, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            
            ctx.strokeStyle = "#555566"; ctx.lineWidth = 2;
            ctx.strokeRect(startXTube, topYTube, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            ctx.strokeRect(startXTube, botYTube, tubeLength * scaleCorr, tubeThickness * scaleCorr);
            
            // Tube dimensions
            dDim(`L. TUBE: ${tubeLength.toFixed(1)} mm`, startXTube, endXTube, topYTube - 25);
            dDim(`Ø INT: ${corrData.diam.toFixed(1)} mm`, endXTube + 20, endXTube + 20, axisY - (corrData.diam * scaleCorr) / 2, axisY + (corrData.diam * scaleCorr) / 2); // custom vertical
            // Draw vertical dim line
            ctx.beginPath(); ctx.moveTo(endXTube + 20, axisY - (corrData.diam * scaleCorr) / 2); ctx.lineTo(endXTube + 20, axisY + (corrData.diam * scaleCorr) / 2);
            ctx.moveTo(endXTube + 15, axisY - (corrData.diam * scaleCorr) / 2); ctx.lineTo(endXTube + 25, axisY - (corrData.diam * scaleCorr) / 2);
            ctx.moveTo(endXTube + 15, axisY + (corrData.diam * scaleCorr) / 2); ctx.lineTo(endXTube + 25, axisY + (corrData.diam * scaleCorr) / 2);
            ctx.strokeStyle=C_DIM; ctx.lineWidth=1; ctx.stroke();
            ctx.fillStyle=C_TEXT; ctx.font="12px Orbitron"; ctx.textAlign="left"; ctx.fillText(`Ø EXT: ${outerDiam.toFixed(1)} mm`, endXTube + 30, axisY);
            
            let currentX = startXTube + (tubeLength - totalLensesLen) * scaleCorr / 2;
            
            corrData.lenses.forEach((l, i) => {
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
            });
            ctx.restore(); return;
        }'''
content = content.replace(corr_draw_old, corr_draw_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 4 done.")
