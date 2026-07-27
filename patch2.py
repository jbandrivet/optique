import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace drawLens with the arc-based version
old_drawLens = '''        function drawLens(cx, cy, d, r1, r2, t) {
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
        }'''

new_drawLens = '''        function drawLens(cx, cy, d, r1, r2, t) {
            ctx.beginPath();
            let d_half = d / 2;
            if (r1 !== Infinity && r1 !== 0) d_half = Math.min(d_half, Math.abs(r1) * 0.99);
            if (r2 !== Infinity && r2 !== 0) d_half = Math.min(d_half, Math.abs(r2) * 0.99);
            
            let v1_x = cx - t/2; 
            let v2_x = cx + t/2; 

            if (r1 === Infinity || r1 === 0) {
                ctx.moveTo(v1_x, cy - d_half);
                ctx.lineTo(v1_x, cy + d_half);
            } else {
                let A = Math.asin(d_half / Math.abs(r1));
                if (r1 > 0) {
                    ctx.arc(v1_x + r1, cy, Math.abs(r1), Math.PI + A, Math.PI - A, true);
                } else {
                    ctx.arc(v1_x + r1, cy, Math.abs(r1), -A, A, false);
                }
            }

            if (r2 === Infinity || r2 === 0) {
                ctx.lineTo(v2_x, cy + d_half);
                ctx.lineTo(v2_x, cy - d_half);
            } else {
                let A = Math.asin(d_half / Math.abs(r2));
                if (r2 > 0) {
                    ctx.arc(v2_x + r2, cy, Math.abs(r2), Math.PI - A, Math.PI + A, false);
                } else {
                    ctx.arc(v2_x + r2, cy, Math.abs(r2), A, -A, true);
                }
            }
            
            ctx.closePath();
            ctx.fillStyle = "rgba(0, 200, 255, 0.4)"; ctx.fill();
            ctx.strokeStyle = "#0088ff"; ctx.lineWidth = (theme === 'screen' || theme === 'corr') ? 1/viewState.scale : 1; ctx.stroke();
        }'''
content = content.replace(old_drawLens, new_drawLens)

# 2. Add createLens3D inside updateArch3D
createLens3D_str = '''
        function createLens3D(diam, r1, r2, t, mat) {
            const pts = []; const rMax = diam/2; const segments = 16;
            for(let i=0; i<=segments; i++) {
                let r = rMax * (i/segments);
                let sag2 = (r2 === Infinity || r2 === 0) ? 0 : (r*r)/(2*Math.abs(r2));
                let z2 = (r2 < 0) ? -t/2 + sag2 : -t/2 - sag2;
                pts.push(new THREE.Vector2(r, z2));
            }
            for(let i=segments; i>=0; i--) {
                let r = rMax * (i/segments);
                let sag1 = (r1 === Infinity || r1 === 0) ? 0 : (r*r)/(2*Math.abs(r1));
                let z1 = (r1 > 0) ? t/2 - sag1 : t/2 + sag1;
                pts.push(new THREE.Vector2(r, z1));
            }
            const geo = new THREE.LatheGeometry(pts, 32); geo.computeVertexNormals();
            return new THREE.Mesh(geo, mat);
        }
'''
content = content.replace("const matLens = new THREE.MeshStandardMaterial({color: 0x00ffff, opacity:0.4, transparent:true, roughness: 0.1, metalness:0.1});", "const matLens = new THREE.MeshStandardMaterial({color: 0x00ffff, opacity:0.4, transparent:true, roughness: 0.1, metalness:0.1});\n" + createLens3D_str)

# 3. Replace Nasmyth 3D corrector
nasmyth_3d_old = '''                // Correcteur Nasmyth 3D
                if(corrData && corrData.pos > 0) {
                    const side_focus_X = currentData.B + m3_z_pos;
                    const cZ = side_focus_X - corrData.pos;
                    const lens = new THREE.Mesh(new THREE.CylinderGeometry(corrData.diam/2, corrData.diam/2, 6, 32), matLens);
                    lens.rotation.z = Math.PI/2;
                    lens.position.set(cZ, 0, m3_z_pos);
                    grp.add(lens);
                }'''
nasmyth_3d_new = '''                // Correcteur Nasmyth 3D
                if(corrData && corrData.pos > 0 && corrData.lenses) {
                    const side_focus_X = currentData.B + m3_z_pos;
                    const corrX = side_focus_X - corrData.pos;
                    const lGrp = new THREE.Group();
                    let curY = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0) / 2;
                    corrData.lenses.forEach(l => {
                        curY += l.d;
                        const lMesh = createLens3D(corrData.diam, l.r1, l.r2, l.t, matLens);
                        lMesh.position.y = curY + l.t/2;
                        curY += l.t;
                        lGrp.add(lMesh);
                    });
                    lGrp.rotation.z = -Math.PI/2; 
                    lGrp.position.set(corrX, 0, m3_z_pos);
                    grp.add(lGrp);
                }'''
content = content.replace(nasmyth_3d_old, nasmyth_3d_new)

# 4. Replace Cassegrain/RC/DK/SCT 3D corrector
cassegrain_3d_old = '''                // Correcteur 3D (Cas, DK, RC, SCT)
                if(currentData.type === 'SCT') {
                    const lens = new THREE.Mesh(new THREE.CylinderGeometry(currentData.D/2, currentData.D/2, 4, 32), matLens);
                    lens.rotation.x = Math.PI/2; lens.position.z = Sep; grp.add(lens);
                } else if(corrData && corrData.pos > 0) {
                    const Z_foc = -currentData.B;
                    const lens = new THREE.Mesh(new THREE.CylinderGeometry(corrData.diam/2, corrData.diam/2, 8, 32), matLens);
                    lens.rotation.x = Math.PI/2; lens.position.z = Z_foc + corrData.pos; grp.add(lens);
                }'''
cassegrain_3d_new = '''                // Correcteur 3D (Cas, DK, RC, SCT)
                if(currentData.type === 'SCT') {
                    if (corrData && corrData.lenses && corrData.lenses.length > 0) {
                        const l = corrData.lenses[0];
                        const lens = createLens3D(currentData.D, l.r1, l.r2, l.t, matLens);
                        lens.rotation.x = Math.PI/2; lens.position.z = Sep; grp.add(lens);
                    }
                } else if(corrData && corrData.pos > 0 && corrData.lenses) {
                    const Z_foc = -currentData.B;
                    const corrZ = Z_foc + corrData.pos;
                    const lGrp = new THREE.Group();
                    let curY = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0) / 2;
                    corrData.lenses.forEach(l => {
                        curY += l.d;
                        const lMesh = createLens3D(corrData.diam, l.r1, l.r2, l.t, matLens);
                        lMesh.position.y = curY + l.t/2;
                        curY += l.t;
                        lGrp.add(lMesh);
                    });
                    lGrp.rotation.x = Math.PI/2;
                    lGrp.position.z = corrZ;
                    grp.add(lGrp);
                }'''
content = content.replace(cassegrain_3d_old, cassegrain_3d_new)

# 5. Replace Newton 3D corrector
newton_3d_old = '''            // Correcteur Coma 3D Newton
            if(corrData && corrData.pos > 0) {
                const lens = new THREE.Mesh(new THREE.CylinderGeometry(corrData.diam/2, corrData.diam/2, 8, 32), matLens);
                lens.position.set(0, Y_exit - corrData.pos, Sep);
                grp.add(lens);
            }'''
newton_3d_new = '''            // Correcteur Coma 3D Newton
            if(corrData && corrData.pos > 0 && corrData.lenses) {
                const corrY = Y_exit - corrData.pos;
                const lGrp = new THREE.Group();
                let curY = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0) / 2;
                corrData.lenses.forEach(l => {
                    curY += l.d;
                    const lMesh = createLens3D(corrData.diam, l.r1, l.r2, l.t, matLens);
                    lMesh.position.y = curY + l.t/2;
                    curY += l.t;
                    lGrp.add(lMesh);
                });
                lGrp.position.set(0, corrY, Sep);
                grp.add(lGrp);
            }'''
content = content.replace(newton_3d_old, newton_3d_new)

# 6. Replace Mouse Wheel Event
wheel_old = "cvs.addEventListener('wheel', (e) => { e.preventDefault(); window.zoomBlueprint(e.deltaY > 0 ? -0.1 : 0.1); });"
wheel_new = '''cvs.addEventListener('wheel', (e) => {
                e.preventDefault();
                const rect = cvs.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const wx = (mouseX - cx - viewState.offsetX) / viewState.scale;
                const wy = (mouseY - cy - viewState.offsetY) / viewState.scale;
                
                let zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                let newScale = viewState.scale * zoomFactor;
                if(newScale < 0.1) newScale = 0.1;
                if(newScale > 10) newScale = 10;
                
                viewState.offsetX = mouseX - cx - wx * newScale;
                viewState.offsetY = mouseY - cy - wy * newScale;
                viewState.scale = newScale;
                window.redrawCurrentBlueprint();
            });'''
content = content.replace(wheel_old, wheel_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 2 done.")
