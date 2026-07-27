import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add tab for Corrector
content = content.replace(
'''            <div class="view-tabs">
                <div class="view-tab active" onclick="setVizMode('arch','2d')" id="tab-arch-2d">PLAN 2D EXACT</div>
                <div class="view-tab" onclick="setVizMode('arch','3d')" id="tab-arch-3d">RAYTRACING 3D</div>
            </div>''',
'''            <div class="view-tabs">
                <div class="view-tab active" onclick="setVizMode('arch','2d')" id="tab-arch-2d">PLAN 2D EXACT</div>
                <div class="view-tab" onclick="setVizMode('arch','3d')" id="tab-arch-3d">RAYTRACING 3D</div>
                <div class="view-tab" onclick="setVizMode('arch','corr')" id="tab-arch-corr">SCHÉMA CORRECTEUR</div>
            </div>''')

# 2. Add corr-lenses-info div
content = content.replace(
'''                    <div class="result-row"><span>Verres Optimaux</span><div class="res-val" id="res-corr-glass" style="font-size:0.8rem; color:var(--neon-cyan)">-</div></div>
                </div>''',
'''                    <div class="result-row"><span>Verres Optimaux</span><div class="res-val" id="res-corr-glass" style="font-size:0.8rem; color:var(--neon-cyan)">-</div></div>
                    <div id="corr-lenses-info" style="margin-top: 15px; font-size: 0.8rem; color: var(--text-dim); border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;"></div>
                </div>''')

# 3. Update setVizMode
content = content.replace(
'''        } else {
            vizModeArch = mode;
            document.getElementById('tab-arch-2d').classList.toggle('active', mode==='2d'); document.getElementById('tab-arch-3d').classList.toggle('active', mode==='3d');
            document.getElementById('blueprint-canvas').style.display = mode==='2d'?'block':'none'; document.getElementById('zoom-controls-2d').style.display = mode==='2d'?'flex':'none';
            document.getElementById('container3d_arch').style.display = mode==='3d'?'block':'none'; document.getElementById('cam-arch').style.display = mode==='3d'?'flex':'none';
            if(mode==='2d') window.redrawCurrentBlueprint(); else window.updateArch3D();
        }''',
'''        } else {
            vizModeArch = mode;
            document.getElementById('tab-arch-2d').classList.toggle('active', mode==='2d');
            document.getElementById('tab-arch-3d').classList.toggle('active', mode==='3d');
            let tCorr = document.getElementById('tab-arch-corr'); if(tCorr) tCorr.classList.toggle('active', mode==='corr');
            document.getElementById('blueprint-canvas').style.display = (mode==='2d'||mode==='corr')?'block':'none';
            document.getElementById('zoom-controls-2d').style.display = (mode==='2d'||mode==='corr')?'flex':'none';
            document.getElementById('container3d_arch').style.display = mode==='3d'?'block':'none';
            document.getElementById('cam-arch').style.display = mode==='3d'?'flex':'none';
            if(mode==='2d'||mode==='corr') window.redrawCurrentBlueprint(); else window.updateArch3D();
        }''')

# 4. redrawCurrentBlueprint
content = content.replace(
'''        drawBlueprintGeneric(ctx, rect.width, rect.height, currentData.type.toLowerCase(), currentData.D, currentData.F1, currentData.VizSep || currentData.Sep, currentData.B, currentData.D2, currentData.F, currentData.Hole, currentData.CPL, 'screen', currentData.Corrector);''',
'''        let theme = vizModeArch === 'corr' ? 'corr' : 'screen';
        drawBlueprintGeneric(ctx, rect.width, rect.height, currentData.type.toLowerCase(), currentData.D, currentData.F1, currentData.VizSep || currentData.Sep, currentData.B, currentData.D2, currentData.F, currentData.Hole, currentData.CPL, theme, currentData.Corrector);''')

# 5. runArchitect Lens Generation
old_lens_gen = '''        // --- CALCUL DES CORRECTEURS ET VERRES OPTIQUES ---
        let corrType = "-", corrPos = 0, corrDiam = 0, corrGlass = "-";
        const F_sys = F > 0 ? F : 1; 

        if (type === 'newton') {
            corrType = "Corr. Coma (Wynne 3L / Ross 2L)";
            corrPos = 50; 
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / N-F2 / N-BK7";
        } else if (type === 'dk') {
            corrType = "Corr. Sous-ouverture (Coma/Astig)";
            corrPos = 100;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / Silice Fondue";
        } else if (type === 'rc') {
            corrType = "Aplanisseur (Astigmatisme)";
            corrPos = 60;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "Silice Fondue (x2)";
        } else if (type === 'cassegrain') {
            corrType = "Aplanisseur de Champ";
            corrPos = 50;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 (Plano-concave)";
        } else if (type === 'nasmyth') {
            corrType = "Aplanisseur Nasmyth";
            corrPos = 60;
            corrDiam = CPL + corrPos * (D / F_sys);
            corrGlass = "N-BK7 / Silice Fondue";
        } else if (type === 'sct') {
            corrType = "Lame de Schmidt (Correctrice)";
            corrPos = Sep + B; // A l'entrée
            corrDiam = D;
            corrGlass = "N-BK7 ou B270";
        }

        currentData = {'''

new_lens_gen = '''        // --- CALCUL DES CORRECTEURS ET VERRES OPTIQUES ---
        let corrType = "-", corrPos = 0, corrDiam = 0, corrGlass = "-";
        let lenses = [];
        const F_sys = F > 0 ? F : 1; 

        if (type === 'newton') {
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
        });

        currentData = {'''
content = content.replace(old_lens_gen, new_lens_gen)

# 6. runArchitect UI Update for lenses text
ui_old = '''            document.getElementById('res-corr-glass').innerText = corrGlass;
        }

        document.getElementById('res-corr-type').innerText = corrType;
        document.getElementById('res-corr-pos').innerText = (corrPos > 0) ? corrPos.toFixed(1) + " mm" : "-";
        document.getElementById('res-corr-diam').innerText = (corrDiam > 0) ? corrDiam.toFixed(1) + " mm" : "-";
        document.getElementById('res-corr-glass').innerText = corrGlass;
    }
    window.runArchitect = runArchitect;'''

ui_new = '''            document.getElementById('res-corr-glass').innerText = corrGlass;
        }

        document.getElementById('res-corr-type').innerText = corrType;
        document.getElementById('res-corr-pos').innerText = (corrPos > 0) ? corrPos.toFixed(1) + " mm" : "-";
        document.getElementById('res-corr-diam').innerText = (corrDiam > 0) ? corrDiam.toFixed(1) + " mm" : "-";
        document.getElementById('res-corr-glass').innerText = corrGlass;
        
        let lensesInfo = document.getElementById('corr-lenses-info');
        if (lensesInfo) {
            lensesInfo.innerHTML = "";
            if (currentData.Corrector.lenses && currentData.Corrector.lenses.length > 0) {
                let html = "<strong>Détail Lentilles :</strong><br>";
                currentData.Corrector.lenses.forEach((l, i) => {
                    let r1Txt = l.r1 === Infinity ? "Plan" : l.r1.toFixed(1);
                    let r2Txt = l.r2 === Infinity ? "Plan" : l.r2.toFixed(1);
                    html += `L${i+1} (${l.glass}) : R1=${r1Txt}, R2=${r2Txt}, Ép=${l.t.toFixed(1)}<br>`;
                    if (l.d > 0) html += `<span style="color:#0088ff">Espacement : ${l.d.toFixed(1)} mm</span><br>`;
                });
                lensesInfo.innerHTML = html;
            }
        }
    }
    window.runArchitect = runArchitect;'''
content = content.replace(ui_old, ui_new)
content = content.replace("Corrector: { name: corrType, pos: corrPos, diam: corrDiam, glass: corrGlass }", "Corrector: { name: corrType, pos: corrPos, diam: corrDiam, glass: corrGlass, lenses: lenses }")


# 7. drawBlueprintGeneric: Add drawLens function and handle 'corr' mode, and modify existing correctors.
# We will inject the new code at the beginning of drawBlueprintGeneric
blueprint_old = '''    function drawBlueprintGeneric(ctx, width, height, type, D, F1, Sep, B, D2, F_sys, holeDiam, CPL, theme, corrData) {
        D = Math.abs(D)||1; F1 = F1||1; Sep = Math.abs(Sep)||0; B = Math.abs(B)||0; D2 = Math.abs(D2)||1; holeDiam = Math.abs(holeDiam)||0; CPL = Math.abs(CPL)||0;
        ctx.clearRect(0,0, width, height); ctx.save();'''

blueprint_new = '''    function drawBlueprintGeneric(ctx, width, height, type, D, F1, Sep, B, D2, F_sys, holeDiam, CPL, theme, corrData) {
        D = Math.abs(D)||1; F1 = F1||1; Sep = Math.abs(Sep)||0; B = Math.abs(B)||0; D2 = Math.abs(D2)||1; holeDiam = Math.abs(holeDiam)||0; CPL = Math.abs(CPL)||0;
        
        function drawLens(cx, cy, d, r1, r2, t) {
            let s1 = (r1 === Infinity || r1 === 0) ? 0 : (d*d)/(8*Math.abs(r1));
            let s2 = (r2 === Infinity || r2 === 0) ? 0 : (d*d)/(8*Math.abs(r2));
            let edgeL_x = (r1 > 0) ? cx - t/2 + s1 : cx - t/2;
            let cL_x = (r1 > 0) ? cx - t/2 : cx - t/2 + s1;
            let edgeR_x = (r2 < 0) ? cx + t/2 - s2 : cx + t/2;
            let cR_x = (r2 < 0) ? cx + t/2 : cx + t/2 - s2;
            ctx.beginPath();
            ctx.moveTo(edgeL_x, cy - d/2);
            if (r1 === Infinity || r1 === 0) { ctx.lineTo(edgeL_x, cy + d/2); } 
            else { ctx.quadraticCurveTo(cL_x - (edgeL_x - cL_x), cy, edgeL_x, cy + d/2); }
            ctx.lineTo(edgeR_x, cy + d/2);
            if (r2 === Infinity || r2 === 0) { ctx.lineTo(edgeR_x, cy - d/2); } 
            else { ctx.quadraticCurveTo(cR_x - (edgeR_x - cR_x), cy, edgeR_x, cy - d/2); }
            ctx.closePath();
            ctx.fillStyle = "rgba(0, 200, 255, 0.4)"; ctx.fill();
            ctx.strokeStyle = "#0088ff"; ctx.lineWidth = (theme === 'screen' || theme === 'corr') ? 1/viewState.scale : 1; ctx.stroke();
        }

        ctx.clearRect(0,0, width, height); ctx.save();'''
content = content.replace(blueprint_old, blueprint_new)

# Handle theme == 'corr'
theme_corr_injection_old = '''        const C_AXIS="#cccccc"; const C_DIM="#0000ff"; const C_TEXT="#000000"; const C_M1="#ff8800"; const C_M2="#00aa00"; const C_M3="#0088ff"; const C_RAY="rgba(0,0,0,0.2)"; const C_BAFFLE="#333333";
        let totalLen = (type==='newton') ? Math.abs(F1)*1.3 : (Math.abs(Sep)+Math.abs(B))*1.2;
        if(totalLen<=0) totalLen=500;
        
        let scale = (width-120)/totalLen; if(scale<=0) scale=0.1;
        const startX = 60; const axisY = height/2;
        
        ctx.beginPath(); ctx.moveTo(-1000, axisY); ctx.lineTo(width+1000, axisY); ctx.setLineDash([5,5]); ctx.strokeStyle=C_AXIS; ctx.stroke(); ctx.setLineDash([]);
        
        function dDim(l,x1,x2,y){
            ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.moveTo(x1,y-5); ctx.lineTo(x1,y+5); ctx.moveTo(x2,y-5); ctx.lineTo(x2,y+5); ctx.strokeStyle=C_DIM; ctx.lineWidth=1/viewState.scale; ctx.stroke(); ctx.fillStyle=C_TEXT; ctx.font=theme==='screen'?"12px Orbitron":"10px Helvetica"; ctx.textAlign="center"; ctx.fillText(l,x1+(x2-x1)/2,y-5);
        }'''

theme_corr_injection_new = theme_corr_injection_old + '''

        if (theme === 'corr') {
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
                drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1, l.r2, l.t * scaleCorr);
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
        }
'''
content = content.replace(theme_corr_injection_old, theme_corr_injection_new)


# Now, replace the old corrector drawing blocks with the new drawLens calls.
# 1. Newton
newton_old = '''            if(corrData && corrData.pos > 0) {
                const corrY = focusY + corrData.pos * scale; // Vers M2
                const cRad = (corrData.diam * scale)/2;
                ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(m2X - cRad, corrY - 2*scale, cRad*2, 4*scale);
                ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText(corrData.name.split(" ")[0], m2X + cRad + 5, corrY + 3);
            }'''
newton_new = '''            if(corrData && corrData.pos > 0) {
                const corrY = focusY + corrData.pos * scale; // Vers M2
                if (corrData.lenses && corrData.lenses.length > 0) {
                    ctx.save(); ctx.translate(m2X, corrY); ctx.rotate(Math.PI/2);
                    let currentX = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0)*scale / 2;
                    corrData.lenses.forEach(l => {
                        currentX += l.d * scale; let cx = currentX + (l.t * scale)/2;
                        drawLens(cx, 0, corrData.diam * scale, l.r1, l.r2, l.t * scale); currentX += l.t * scale;
                    });
                    ctx.restore();
                    ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText(corrData.name.split(" ")[0], m2X + (corrData.diam*scale)/2 + 5, corrY + 3);
                } else {
                    const cRad = (corrData.diam * scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(m2X - cRad, corrY - 2*scale, cRad*2, 4*scale);
                    ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText(corrData.name.split(" ")[0], m2X + cRad + 5, corrY + 3);
                }
            }'''
content = content.replace(newton_old, newton_new)

# 2. Nasmyth
nasmyth_old = '''                if(corrData && corrData.pos > 0) {
                    const corrY = sideFocusY - corrData.pos * scale; // Vers M3
                    const cRad = (corrData.diam * scale)/2;
                    ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(m3X - cRad, corrY - 2*scale, cRad*2, 4*scale);
                }'''
nasmyth_new = '''                if(corrData && corrData.pos > 0) {
                    const corrY = sideFocusY - corrData.pos * scale; // Vers M3
                    if (corrData.lenses && corrData.lenses.length > 0) {
                        ctx.save(); ctx.translate(m3X, corrY); ctx.rotate(Math.PI/2);
                        let currentX = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0)*scale / 2;
                        corrData.lenses.forEach(l => {
                            currentX += l.d * scale; let cx = currentX + (l.t * scale)/2;
                            drawLens(cx, 0, corrData.diam * scale, l.r1, l.r2, l.t * scale); currentX += l.t * scale;
                        });
                        ctx.restore();
                    } else {
                        const cRad = (corrData.diam * scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(m3X - cRad, corrY - 2*scale, cRad*2, 4*scale);
                    }
                }'''
content = content.replace(nasmyth_old, nasmyth_new)

# 3. SCT and generic
generic_old = '''                if(corrData) {
                    if (type === 'sct') { // Lame à l'entrée
                        const cRad = (D*scale)/2;
                        ctx.fillStyle = "rgba(0, 200, 255, 0.4)"; ctx.fillRect(m2X - 2*scale, axisY - cRad, 4*scale, cRad*2);
                        ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText("Lame Schmidt", m2X, axisY - cRad - 10);
                    } else if (corrData.pos > 0) {
                        const corrX = fX - corrData.pos * scale; // Vers M1
                        const cRad = (corrData.diam * scale)/2;
                        ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(corrX - 2*scale, axisY - cRad, 4*scale, cRad*2);
                        ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText(corrData.name.split(" ")[0], corrX, axisY - cRad - 10);
                    }
                }'''
generic_new = '''                if(corrData) {
                    if (type === 'sct') { // Lame à l'entrée
                        if (corrData.lenses && corrData.lenses.length > 0) {
                            drawLens(m2X, axisY, corrData.diam * scale, corrData.lenses[0].r1, corrData.lenses[0].r2, corrData.lenses[0].t * scale);
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText("Lame Schmidt", m2X, axisY - (corrData.diam*scale)/2 - 10);
                        } else {
                            const cRad = (D*scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.4)"; ctx.fillRect(m2X - 2*scale, axisY - cRad, 4*scale, cRad*2);
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText("Lame Schmidt", m2X, axisY - cRad - 10);
                        }
                    } else if (corrData.pos > 0) {
                        const corrX = fX - corrData.pos * scale; // Vers M1
                        if (corrData.lenses && corrData.lenses.length > 0) {
                            ctx.save(); ctx.translate(corrX, axisY);
                            let currentX = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0)*scale / 2;
                            corrData.lenses.forEach(l => {
                                currentX += l.d * scale; let cx = currentX + (l.t * scale)/2;
                                drawLens(cx, 0, corrData.diam * scale, l.r1, l.r2, l.t * scale); currentX += l.t * scale;
                            });
                            ctx.restore();
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText(corrData.name.split(" ")[0], corrX, axisY - (corrData.diam*scale)/2 - 10);
                        } else {
                            const cRad = (corrData.diam * scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(corrX - 2*scale, axisY - cRad, 4*scale, cRad*2);
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText(corrData.name.split(" ")[0], corrX, axisY - cRad - 10);
                        }
                    }
                }'''
content = content.replace(generic_old, generic_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patching done.")
