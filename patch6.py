import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Checkbox to UI
arch_ui_old = '''            <div class="input-group">
                <label>Architecture</label>
                <select id="arch-type" onchange="updateArchUI()">'''
arch_ui_new = '''            <div class="input-group" style="margin-bottom: 5px;">
                <label>Correcteur <input type="checkbox" id="arch-use-corr" checked style="float:right; transform: scale(1.5); margin-right: 10px;" onchange="window.runArchitect()"></label>
            </div>
            <div class="input-group">
                <label>Architecture</label>
                <select id="arch-type" onchange="updateArchUI()">'''
if "arch-use-corr" not in content:
    content = content.replace(arch_ui_old, arch_ui_new)

# 2. Update runArchitect to respect checkbox
run_arch_old = '''        if (type === 'newton') {'''
run_arch_new = '''        let useCorr = document.getElementById('arch-use-corr') ? document.getElementById('arch-use-corr').checked : true;
        if (!useCorr) {
            corrType = "Aucun (Foyer natif)";
            corrPos = 0; corrDiam = 0; corrGlass = "-";
            lenses = [];
        } else if (type === 'newton') {'''
if "Aucun (Foyer natif)" not in content:
    content = content.replace(run_arch_old, run_arch_new)

# 3. Draw Camera Sensor & Update Spacer Rings
# In generic 2D blueprint:
generic_draw_old = '''                // CPL et Correcteur standard (Cas, RC, DK)
                if(CPL > 0) {
                    ctx.beginPath(); ctx.moveTo(fX, axisY - (CPL*scale)/2); ctx.lineTo(fX, axisY + (CPL*scale)/2); 
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", fX + 5, axisY - (CPL*scale)/2);
                }'''
generic_draw_new = '''                // CPL et Correcteur standard (Cas, RC, DK)
                if(CPL > 0) {
                    ctx.beginPath(); ctx.moveTo(fX, axisY - (CPL*scale)/2); ctx.lineTo(fX, axisY + (CPL*scale)/2); 
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", fX + 5, axisY - (CPL*scale)/2 - 15);
                }
                // Capteur Camera
                ctx.fillStyle = "#555"; ctx.fillRect(fX, axisY - 15*scale, 8*scale, 30*scale);
                ctx.fillStyle = "#ffaa00"; ctx.fillRect(fX, axisY - (CPL>0 ? CPL*scale/2 : 10*scale), 2*scale, (CPL>0 ? CPL*scale : 20*scale));
                ctx.fillStyle = "#ffaa00"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CAPTEUR", fX + 10*scale, axisY + 4);'''
content = content.replace(generic_draw_old, generic_draw_new)

# In Nasmyth generic blueprint:
nasmyth_draw_old = '''                // CPL et Correcteur Nasmyth
                if(CPL > 0) {
                    ctx.beginPath(); ctx.moveTo(m3X - (CPL*scale)/2, sideFocusY); ctx.lineTo(m3X + (CPL*scale)/2, sideFocusY); 
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", m3X + (CPL*scale)/2 + 5, sideFocusY + 3);
                }'''
nasmyth_draw_new = '''                // CPL et Correcteur Nasmyth
                if(CPL > 0) {
                    ctx.beginPath(); ctx.moveTo(m3X - (CPL*scale)/2, sideFocusY); ctx.lineTo(m3X + (CPL*scale)/2, sideFocusY); 
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", m3X + (CPL*scale)/2 + 5, sideFocusY - 10);
                }
                // Capteur Camera Nasmyth
                ctx.fillStyle = "#555"; ctx.fillRect(m3X - 15*scale, sideFocusY, 30*scale, 8*scale);
                ctx.fillStyle = "#ffaa00"; ctx.fillRect(m3X - (CPL>0 ? CPL*scale/2 : 10*scale), sideFocusY, (CPL>0 ? CPL*scale : 20*scale), 2*scale);
                ctx.fillStyle = "#ffaa00"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CAPTEUR", m3X + 15*scale, sideFocusY + 12);'''
content = content.replace(nasmyth_draw_old, nasmyth_draw_new)

# In Corrector Theme (make rings overlap lenses slightly so they "touch"):
spacer_old = '''                if (l.d > 0) {
                    // Spacer ring (Bague d'espacement) between lenses
                    let gapX = currentX;
                    let gapW = l.d * scaleCorr;
                    ctx.fillStyle = "#666677";
                    ctx.fillRect(gapX, topInnerY, gapW, ringThick);
                    ctx.fillRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    ctx.strokeRect(gapX, topInnerY, gapW, ringThick);
                    ctx.strokeRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    
                    dDim(`d=${l.d.toFixed(1)}`, currentX, currentX + gapW, topInnerY - 10);
                }'''
spacer_new = '''                if (l.d > 0) {
                    // Spacer ring (Bague d'espacement) between lenses - slightly wider to touch lens curves
                    let overlap = 4 * scaleCorr; // visual overlap
                    let gapX = currentX - overlap;
                    let gapW = l.d * scaleCorr + 2*overlap;
                    ctx.fillStyle = "#666677";
                    ctx.fillRect(gapX, topInnerY, gapW, ringThick);
                    ctx.fillRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    ctx.strokeRect(gapX, topInnerY, gapW, ringThick);
                    ctx.strokeRect(gapX, botInnerY - ringThick, gapW, ringThick);
                    
                    dDim(`d=${l.d.toFixed(1)}`, currentX, currentX + l.d * scaleCorr, topInnerY - 10);
                }'''
content = content.replace(spacer_old, spacer_new)

front_ring_old = '''            // Front Retaining Ring
            let frontRingWidth = 5 * scaleCorr;
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
            ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth=1;
            ctx.strokeRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
            
            currentX += frontRingWidth;'''
front_ring_new = '''            // Front Retaining Ring
            let frontRingWidth = 5 * scaleCorr;
            let overlap = 2 * scaleCorr;
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, frontRingWidth + overlap, ringThick);
            ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth=1;
            ctx.strokeRect(currentX, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, frontRingWidth + overlap, ringThick);
            
            currentX += frontRingWidth;'''
content = content.replace(front_ring_old, front_ring_new)

back_ring_old = '''            // Back Retaining Ring
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);
            ctx.strokeRect(currentX, topInnerY, frontRingWidth, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, frontRingWidth, ringThick);'''
back_ring_new = '''            // Back Retaining Ring
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX - overlap, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.fillRect(currentX - overlap, botInnerY - ringThick, frontRingWidth + overlap, ringThick);
            ctx.strokeRect(currentX - overlap, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.strokeRect(currentX - overlap, botInnerY - ringThick, frontRingWidth + overlap, ringThick);'''
content = content.replace(back_ring_old, back_ring_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 6 done.")
