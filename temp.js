    let currentData = {};
    let viewState = { scale: 1, offsetX: 0, offsetY: 0, isDragging: false, lastX: 0, lastY: 0 };
    let calculationMode = 'f1'; let anMode = 'R'; let vizModeAn = '2d'; let vizModeArch = '2d';
    
    const scenes = { an: null, arch: null }; const renderers = { an: null, arch: null };
    const cameras = { an: null, arch: null }; const controlsList = { an: null, arch: null };
    const meshes = { anGroup: null, archGroup: null };

    function clearGroup3D(scene, groupName) {
        if(meshes[groupName]) {
            scene.remove(meshes[groupName]);
            meshes[groupName].traverse(function(child) {
                if(child.geometry) { child.geometry.dispose(); }
                if(child.material) {
                    if(Array.isArray(child.material)) {
                        for(let i=0; i<child.material.length; i++) { child.material[i].dispose(); }
                    } else { child.material.dispose(); }
                }
            });
            meshes[groupName] = null;
        }
    }

    // --- MOTEUR DE DESSIN 2D (BLUEPRINT EXACT) ---
    function drawBlueprintGeneric(ctx, width, height, type, D, F1, Sep, B, D2, F_sys, holeDiam, CPL, theme, corrData) {
        D = Math.abs(D)||1; F1 = F1||1; Sep = Math.abs(Sep)||0; B = Math.abs(B)||0; D2 = Math.abs(D2)||1; holeDiam = Math.abs(holeDiam)||0; CPL = Math.abs(CPL)||0;
        
        function drawLens(cx, cy, d, r1, r2, t) {
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
        }

        ctx.clearRect(0,0, width, height); ctx.save();
        if(theme === 'screen') { 
            const dpr = window.devicePixelRatio || 1;
            ctx.translate(viewState.offsetX, viewState.offsetY); ctx.translate(width/2, height/2); 
            ctx.scale(viewState.scale, viewState.scale); ctx.translate(-width/2, -height/2); 
        }
        
        const C_AXIS="#cccccc"; const C_DIM="#0000ff"; const C_TEXT="#000000"; const C_M1="#ff8800"; const C_M2="#00aa00"; const C_M3="#0088ff"; const C_RAY="rgba(0,0,0,0.2)"; const C_BAFFLE="#333333";
        let totalLen = (type==='newton') ? Math.abs(F1)*1.3 : (Math.abs(Sep)+Math.abs(B))*1.2;
        if(totalLen<=0) totalLen=500;
        
        let scale = (width-120)/totalLen; if(scale<=0) scale=0.1;
        const startX = 60; const axisY = height/2;
        
        ctx.beginPath(); ctx.moveTo(-1000, axisY); ctx.lineTo(width+1000, axisY); ctx.setLineDash([5,5]); ctx.strokeStyle=C_AXIS; ctx.stroke(); ctx.setLineDash([]);
        
        function dDim(l,x1,x2,y){
            ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.moveTo(x1,y-5); ctx.lineTo(x1,y+5); ctx.moveTo(x2,y-5); ctx.lineTo(x2,y+5); ctx.strokeStyle=C_DIM; ctx.lineWidth=1/viewState.scale; ctx.stroke(); ctx.fillStyle=C_TEXT; ctx.font=theme==='screen'?"12px Orbitron":"10px Helvetica"; ctx.textAlign="center"; ctx.fillText(l,x1+(x2-x1)/2,y-5);
        }

        if (theme === 'corr') {
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
            
            let ringThick = (corrData.diam * scaleCorr) * 0.10; // Epaisseur des bagues (10% diam)
            let topInnerY = axisY - (corrData.diam * scaleCorr) / 2;
            let botInnerY = axisY + (corrData.diam * scaleCorr) / 2;
            
            // Front Retaining Ring
            let frontRingWidth = 5 * scaleCorr;
            let overlap = 2 * scaleCorr;
            ctx.fillStyle = "#888899";
            ctx.fillRect(currentX, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.fillRect(currentX, botInnerY - ringThick, frontRingWidth + overlap, ringThick);
            ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth=1;
            ctx.strokeRect(currentX, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.strokeRect(currentX, botInnerY - ringThick, frontRingWidth + overlap, ringThick);
            
            currentX += frontRingWidth;

            corrData.lenses.forEach((l, i) => {
                if (l.d > 0) {
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
            ctx.fillRect(currentX - overlap, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.fillRect(currentX - overlap, botInnerY - ringThick, frontRingWidth + overlap, ringThick);
            ctx.strokeRect(currentX - overlap, topInnerY, frontRingWidth + overlap, ringThick);
            ctx.strokeRect(currentX - overlap, botInnerY - ringThick, frontRingWidth + overlap, ringThick);

            ctx.restore(); return;
        }


        if(type === 'newton') {
            const m1X = startX+F1*scale; const m1Rad = (D*scale)/2;
            const R_draw = m1Rad * 4; const Rcx = m1X - R_draw; const aO = Math.asin(Math.min(1, m1Rad / R_draw));
            ctx.beginPath(); ctx.arc(Rcx, axisY, R_draw, -aO, aO); ctx.strokeStyle=C_M1; ctx.lineWidth=3; ctx.stroke();
            
            const tubeR = (D/2)*scale * 1.15; const intercept = (Sep > 0) ? Sep*scale : (F1*scale - tubeR - B*scale); 
            const m2X = m1X - intercept; const m2Size = (D2*scale); 
            
            ctx.beginPath(); ctx.moveTo(m2X - m2Size/2, axisY - m2Size/2); ctx.lineTo(m2X + m2Size/2, axisY + m2Size/2); ctx.strokeStyle=C_M2; ctx.lineWidth=3; ctx.stroke();
            
            const F_scale = F1 * scale; const focusX = m1X - F_scale; 
            const ray_y = m1Rad * 0.95; 
            
            const t_top = (m2X - m1X - ray_y) / (focusX - m1X - ray_y);
            const x_int_top = m1X + t_top * (focusX - m1X); const y_int_top = (axisY - ray_y) + t_top * ray_y;

            const t_bot = (m2X - m1X + ray_y) / (focusX - m1X + ray_y);
            const x_int_bot = m1X + t_bot * (focusX - m1X); const y_int_bot = (axisY + ray_y) - t_bot * ray_y;

            ctx.strokeStyle=C_RAY; ctx.beginPath(); 
            ctx.moveTo(startX, axisY - ray_y); ctx.lineTo(m1X, axisY - ray_y); ctx.moveTo(startX, axisY + ray_y); ctx.lineTo(m1X, axisY + ray_y);
            ctx.moveTo(m1X, axisY - ray_y); ctx.lineTo(x_int_top, y_int_top); ctx.moveTo(m1X, axisY + ray_y); ctx.lineTo(x_int_bot, y_int_bot);
            
            const focH = tubeR + B*scale; const focusY = axisY - focH;
            ctx.moveTo(x_int_top, y_int_top); ctx.lineTo(m2X, focusY); ctx.moveTo(x_int_bot, y_int_bot); ctx.lineTo(m2X, focusY);
            ctx.stroke();
            
            dDim("F1", m2X, m1X, axisY+m1Rad+30); dDim("BACK FOCUS", m2X, m2X, focusY - 10);

            // CPL et Correcteur Newton (Horizontal)
            if(CPL > 0) {
                ctx.beginPath(); ctx.moveTo(m2X - (CPL*scale)/2, focusY); ctx.lineTo(m2X + (CPL*scale)/2, focusY); 
                ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", m2X + (CPL*scale)/2 + 5, focusY + 3);
            }
            if(corrData && corrData.pos > 0) {
                const corrY = focusY + corrData.pos * scale; // Vers M2
                if (corrData.lenses && corrData.lenses.length > 0) {
                    ctx.save(); ctx.translate(m2X, corrY); ctx.rotate(Math.PI/2);
                    let currentX = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0)*scale / 2;
                    corrData.lenses.forEach(l => {
                        currentX += l.d * scale; let cx = currentX + (l.t * scale)/2;
                        drawLens(cx, 0, corrData.diam * scale, l.r1 * scale, l.r2 * scale, l.t * scale); currentX += l.t * scale;
                    });
                    ctx.restore();
                    ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText(corrData.name.split(" ")[0], m2X + (corrData.diam*scale)/2 + 5, corrY + 3);
                } else {
                    const cRad = (corrData.diam * scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(m2X - cRad, corrY - 2*scale, cRad*2, 4*scale);
                    ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText(corrData.name.split(" ")[0], m2X + cRad + 5, corrY + 3);
                }
            }

        } else {
            const m2X = startX; const m1X = startX+Sep*scale; const fX = m1X+B*scale; const nasmyth = (type === 'nasmyth');
            const m1Rad = (D*scale)/2; const m2Rad = (D2*scale)/2; 
            const margin_hole = 5 * scale; const baffle_wall = 2 * scale; const opticalHoleRad = (holeDiam*scale)/2; let physicalHoleRad = opticalHoleRad + margin_hole; 
            
            let b1_len_val = (Sep * 0.4); if (nasmyth) { b1_len_val = (Sep * 0.25); }
            const b1_len = b1_len_val * scale; 
            const r_beam_at_baffle_tip = (CPL/2) + ( (D2/2) - (CPL/2) ) * ( (B + b1_len_val) / (B + Sep) );
            let b1Rad_val = r_beam_at_baffle_tip + 2; if(b1Rad_val < holeDiam/2) { b1Rad_val = holeDiam/2 + 1; }
            const b1Rad = b1Rad_val * scale; const b1OuterRad = b1Rad + baffle_wall;

            ctx.fillStyle = "#333"; ctx.fillRect(m1X - b1_len, axisY - b1OuterRad, b1_len, b1OuterRad*2);
            ctx.strokeStyle = "#555"; ctx.lineWidth = 1; ctx.strokeRect(m1X - b1_len, axisY - b1OuterRad, b1_len, b1OuterRad*2);

            const b2_len_val = (Sep * 0.15); const b2_len = b2_len_val * scale; const b2Rad_base = m2Rad + 2*scale; 
            const r1_opt = (D/2); const r2_opt = (D2/2); const r_beam_at_tip = r2_opt + ( (r1_opt - r2_opt) * (b2_len_val / Sep) ); const b2Rad_tip = (r_beam_at_tip + 2) * scale; 
            
            ctx.beginPath(); ctx.moveTo(m2X, axisY - b2Rad_base); ctx.lineTo(m2X + b2_len, axisY - b2Rad_tip); ctx.lineTo(m2X + b2_len, axisY + b2Rad_tip); ctx.lineTo(m2X, axisY + b2Rad_base); ctx.closePath();
            ctx.fillStyle = "rgba(50,50,50,0.8)"; ctx.fill(); ctx.strokeStyle = "#555"; ctx.stroke();

            let R_draw = m1Rad*4; if(R_draw===0) R_draw=10; const Rcx = m1X-R_draw; 
            if(physicalHoleRad < b1OuterRad + 2*scale) { physicalHoleRad = b1OuterRad + 2*scale; }

            const aO = Math.asin(Math.min(1,m1Rad/R_draw)); const aI = Math.asin(Math.min(1,physicalHoleRad/R_draw));
            ctx.beginPath(); ctx.arc(Rcx, axisY, R_draw, -aO, -aI); ctx.strokeStyle=C_M1; ctx.lineWidth=3; ctx.stroke();
            ctx.beginPath(); ctx.arc(Rcx, axisY, R_draw, aI, aO); ctx.stroke();
            
            let R2d = m2Rad*4; if(R2d===0) R2d=10; const R2cx = m2X-R2d; const aM2 = Math.asin(Math.min(1,m2Rad/R2d));
            ctx.beginPath(); ctx.arc(R2cx, axisY, R2d, -aM2, aM2); ctx.strokeStyle=C_M2; ctx.lineWidth=3; ctx.stroke();
            
            if (nasmyth) {
                const m3_dist_from_m1 = Sep * 0.25; const m3X = m1X - (m3_dist_from_m1 * scale); const m3Size = (D2 * 0.9) * scale; 
                ctx.beginPath(); ctx.moveTo(m3X - m3Size/2, axisY + m3Size/2); ctx.lineTo(m3X + m3Size/2, axisY - m3Size/2); ctx.strokeStyle = C_M3; ctx.lineWidth = 4; ctx.stroke();
                
                ctx.strokeStyle=C_RAY; ctx.beginPath(); 
                ctx.moveTo(startX-30,axisY-m1Rad); ctx.lineTo(m1X,axisY-m1Rad); ctx.moveTo(startX-30,axisY+m1Rad); ctx.lineTo(m1X,axisY+m1Rad); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(m1X,axisY-m1Rad); ctx.lineTo(m2X,axisY-m2Rad); ctx.moveTo(m1X,axisY+m1Rad); ctx.lineTo(m2X,axisY+m2Rad); ctx.stroke();
                
                const L = fX - m2X; const slope = m2Rad / L; 
                const x_int_top = (m3X + m2Rad + (slope*m2X)) / (1 + slope); const y_int_top = axisY - x_int_top + m3X;
                const x_int_bot = (m2Rad + (slope*m2X) - m3X) / (slope - 1); const y_int_bot = axisY - x_int_bot + m3X;

                ctx.beginPath(); ctx.moveTo(m2X, axisY-m2Rad); ctx.lineTo(x_int_top, y_int_top); ctx.moveTo(m2X, axisY+m2Rad); ctx.lineTo(x_int_bot, y_int_bot); ctx.stroke();
                
                const dist_rem = fX - m3X; const sideFocusY = axisY - dist_rem; 
                ctx.beginPath(); ctx.moveTo(x_int_bot, y_int_bot); ctx.lineTo(m3X, sideFocusY); ctx.moveTo(x_int_top, y_int_top); ctx.lineTo(m3X, sideFocusY); ctx.stroke();
                dDim("SIDE FOCUS", m3X, m3X + 40, sideFocusY);

                // CPL et Correcteur Nasmyth
                if(CPL > 0) {
                    ctx.beginPath(); ctx.moveTo(m3X - (CPL*scale)/2, sideFocusY); ctx.lineTo(m3X + (CPL*scale)/2, sideFocusY); 
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", m3X + (CPL*scale)/2 + 5, sideFocusY - 10);
                }
                // Capteur Camera Nasmyth
                ctx.fillStyle = "#555"; ctx.fillRect(m3X - 15*scale, sideFocusY, 30*scale, 8*scale);
                ctx.fillStyle = "#ffaa00"; ctx.fillRect(m3X - (CPL>0 ? CPL*scale/2 : 10*scale), sideFocusY, (CPL>0 ? CPL*scale : 20*scale), 2*scale);
                ctx.fillStyle = "#ffaa00"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CAPTEUR", m3X + 15*scale, sideFocusY + 12);
                if(corrData && corrData.pos > 0) {
                    const corrY = sideFocusY - corrData.pos * scale; // Vers M3
                    if (corrData.lenses && corrData.lenses.length > 0) {
                        ctx.save(); ctx.translate(m3X, corrY); ctx.rotate(Math.PI/2);
                        let currentX = -corrData.lenses.reduce((acc, l) => acc + l.d + l.t, 0)*scale / 2;
                        corrData.lenses.forEach(l => {
                            currentX += l.d * scale; let cx = currentX + (l.t * scale)/2;
                            drawLens(cx, 0, corrData.diam * scale, l.r1 * scale, l.r2 * scale, l.t * scale); currentX += l.t * scale;
                        });
                        ctx.restore();
                    } else {
                        const cRad = (corrData.diam * scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(m3X - cRad, corrY - 2*scale, cRad*2, 4*scale);
                    }
                }

            } else {
                ctx.strokeStyle=C_RAY; ctx.beginPath(); ctx.moveTo(startX-30,axisY-m1Rad); ctx.lineTo(m1X,axisY-m1Rad); ctx.lineTo(m2X,axisY-m2Rad); ctx.lineTo(fX,axisY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(startX-30,axisY+m1Rad); ctx.lineTo(m1X,axisY+m1Rad); ctx.lineTo(m2X,axisY+m2Rad); ctx.lineTo(fX,axisY); ctx.stroke();
                dDim("BACK FOCUS",m1X,fX,axisY+m1Rad+30);

                // CPL et Correcteur standard (Cas, RC, DK)
                if(CPL > 0) {
                    ctx.beginPath(); ctx.moveTo(fX, axisY - (CPL*scale)/2); ctx.lineTo(fX, axisY + (CPL*scale)/2); 
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CPL Ø" + CPL + "mm", fX + 5, axisY - (CPL*scale)/2 - 15);
                }
                // Capteur Camera
                ctx.fillStyle = "#555"; ctx.fillRect(fX, axisY - 15*scale, 8*scale, 30*scale);
                ctx.fillStyle = "#ffaa00"; ctx.fillRect(fX, axisY - (CPL>0 ? CPL*scale/2 : 10*scale), 2*scale, (CPL>0 ? CPL*scale : 20*scale));
                ctx.fillStyle = "#ffaa00"; ctx.font = "10px Orbitron"; ctx.textAlign="left"; ctx.fillText("CAPTEUR", fX + 10*scale, axisY + 4);
                if(corrData) {
                    if (type === 'sct') { // Lame à l'entrée
                        if (corrData.lenses && corrData.lenses.length > 0) {
                            drawLens(m2X, axisY, corrData.diam * scale, corrData.lenses[0].r1 * scale, corrData.lenses[0].r2 * scale, corrData.lenses[0].t * scale);
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
                                drawLens(cx, 0, corrData.diam * scale, l.r1 * scale, l.r2 * scale, l.t * scale); currentX += l.t * scale;
                            });
                            ctx.restore();
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText(corrData.name.split(" ")[0], corrX, axisY - (corrData.diam*scale)/2 - 10);
                        } else {
                            const cRad = (corrData.diam * scale)/2; ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.fillRect(corrX - 2*scale, axisY - cRad, 4*scale, cRad*2);
                            ctx.fillStyle = "rgba(0, 200, 255, 1)"; ctx.font = "10px Orbitron"; ctx.textAlign="center"; ctx.fillText(corrData.name.split(" ")[0], corrX, axisY - cRad - 10);
                        }
                    }
                }
            }
            dDim("SEPARATION",m2X,m1X,axisY-m1Rad-30); 
            if(holeDiam>0){ const dHx=m1X-15; ctx.beginPath(); ctx.moveTo(dHx,axisY-physicalHoleRad); ctx.lineTo(dHx,axisY+physicalHoleRad); ctx.setLineDash([1,2]); ctx.strokeStyle="#ff0055"; ctx.lineWidth=1; ctx.stroke(); ctx.setLineDash([]); }
        }
        ctx.restore();
    }

    function redrawCurrentBlueprint() {
        if(!currentData.type) return;
        const canvas = document.getElementById('blueprint-canvas');
        if (!canvas) return; 
        const rect = canvas.parentElement.getBoundingClientRect();
        if(rect.width === 0 || rect.height === 0) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr);
        let theme = vizModeArch === 'corr' ? 'corr' : 'screen';
        drawBlueprintGeneric(ctx, rect.width, rect.height, currentData.type.toLowerCase(), currentData.D, currentData.F1, currentData.VizSep || currentData.Sep, currentData.B, currentData.D2, currentData.F, currentData.Hole, currentData.CPL, theme, currentData.Corrector);
    }
    window.redrawCurrentBlueprint = redrawCurrentBlueprint;

    function switchTab(tabId) {
        document.querySelectorAll('.interface-container').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        const btns = document.querySelectorAll('.tab-btn');
        btns.forEach(b => { if(b.getAttribute('onclick').includes(tabId)) b.classList.add('active'); });
        if(tabId === 'architect') setTimeout(window.runArchitect, 100);
    }
    window.switchTab = switchTab;

    function setAnMode(mode) {
        if(mode === anMode) return;
        const input = document.getElementById('an-curvature-val'); const val = parseFloat(input.value);
        if(mode === 'F') { input.value = (val / 2).toFixed(2); document.getElementById('mode-an-R').classList.remove('active'); document.getElementById('mode-an-F').classList.add('active'); } 
        else { input.value = (val * 2).toFixed(2); document.getElementById('mode-an-F').classList.remove('active'); document.getElementById('mode-an-R').classList.add('active'); }
        anMode = mode; window.runAnalyzer();
    }
    window.setAnMode = setAnMode;

    function setVizMode(ctx, mode) {
        if(ctx === 'an') {
            vizModeAn = mode;
            document.getElementById('tab-an-2d').classList.toggle('active', mode==='2d'); document.getElementById('tab-an-3d').classList.toggle('active', mode==='3d');
            document.getElementById('visualizer').style.display = mode==='2d'?'block':'none'; document.getElementById('container3d_an').style.display = mode==='3d'?'block':'none'; document.getElementById('cam-an').style.display = mode==='3d'?'flex':'none';
            if(mode==='2d') window.runAnalyzer(); else window.updateAn3D();
        } else {
            vizModeArch = mode;
            document.getElementById('tab-arch-2d').classList.toggle('active', mode==='2d');
            document.getElementById('tab-arch-3d').classList.toggle('active', mode==='3d');
            let tCorr = document.getElementById('tab-arch-corr'); if(tCorr) tCorr.classList.toggle('active', mode==='corr');
            document.getElementById('blueprint-canvas').style.display = (mode==='2d'||mode==='corr')?'block':'none';
            document.getElementById('zoom-controls-2d').style.display = (mode==='2d'||mode==='corr')?'flex':'none';
            document.getElementById('container3d_arch').style.display = mode==='3d'?'block':'none';
            document.getElementById('cam-arch').style.display = mode==='3d'?'flex':'none';
            if(mode==='2d'||mode==='corr') window.redrawCurrentBlueprint(); else window.updateArch3D();
        }
    }
    window.setVizMode = setVizMode;

    function resetCamera(ctx, view) {
        if(!cameras[ctx] || !controlsList[ctx]) return;
        const cam = cameras[ctx]; const ctr = controlsList[ctx]; ctr.reset();
        if (ctx === 'an') {
            if(view === 'front') { cam.position.set(0, 500, 0); } else if(view === 'back') { cam.position.set(0, -500, 0); } else if(view === 'side') { cam.position.set(0, 50, 500); } else { cam.position.set(0, 300, 500); } 
        } else {
            if(view === 'front') { cam.position.set(0, 0, 1500); } else if(view === 'side') { cam.position.set(1500, 0, -500); } else { cam.position.set(800, 500, 1000); } 
        }
        cam.lookAt(0,0,0); ctr.update();
    }
    window.resetCamera = resetCamera;

    function onDiameterChange() {
        const D = parseFloat(document.getElementById('an-diameter').value)||0;
        if(D > 0) {
            document.getElementById('an-thickness').value = (D * 0.15).toFixed(1);
            if(anMode === 'F') { document.getElementById('an-curvature-val').value = (D * 5).toFixed(1); } 
            else { document.getElementById('an-curvature-val').value = (D * 10).toFixed(1); }
        }
        autoCalcZones();
    }
    window.onDiameterChange = onDiameterChange;

    /* ----------------------------------------------------------------------
       LE CŒUR MATHÉMATIQUE SÉCURISÉ
       Les calculs s'exécutent TOUJOURS avant les tentatives de rendu 2D/3D
    ----------------------------------------------------------------------- */
    function runAnalyzer() {
        const D = parseFloat(document.getElementById('an-diameter').value)||0; 
        const holeD = parseFloat(document.getElementById('an-hole').value)||0; 
        const thick = parseFloat(document.getElementById('an-thickness').value)||0;
        const R_val = parseFloat(document.getElementById('an-curvature-val').value)||0; 
        const R = (anMode === 'F') ? R_val * 2 : R_val;
        
        // Exactement la logique de l'Astro Master
        const K = parseFloat(document.getElementById('an-kfactor').value);
        const zonesStr = document.getElementById('an-zones').value; 
        const zones = zonesStr.split(',').map(Number).filter(n=>n);

        const tbody = document.getElementById('an-results'); tbody.innerHTML="";
        const r_cm = (D/2)/10; const h_cm = thick/10; const rh_cm = (holeD/2)/10; const zmax_cm = (R>0)?((D/2)*(D/2)/(2*R))/10 : 0;
        const vol = (Math.PI*r_cm*r_cm*h_cm) - (Math.PI*rh_cm*rh_cm*h_cm) - (0.5*Math.PI*r_cm*r_cm*zmax_cm);
        
        document.getElementById('an-weight').innerText = (vol*2.53/1000).toFixed(2)+" kg";
        document.getElementById('an-fd').innerText = (D>0 && R>0) ? "f/" + (R/(2*D)).toFixed(1) : "-";

        // GÉNÉRATION DU TABLEAU (Priorité absolue)
        const c = (R>0)?1/R:0;
        zones.forEach((S,i)=>{
            const term = 1-(K+1)*Math.pow(c*S,2); let err = ""; 
            if(S>D/2) err="HORS MIROIR"; else if(S<holeD/2) err="DANS TROU"; else if(term<0) err="ERR GEOM";
            if(err) { tbody.innerHTML+=`<tr><td>${i+1}</td><td>${S}</td><td colspan="3" style="color:red">${err}</td></tr>`; } 
            else {
                const z = (c*S*S)/(1+Math.sqrt(term)); const A = c*z*(K+1); const Y = -K*z*(3+A*(A-3)); const X = (-S*c*K*z*(2+A*(A-3)))/(1-A);
                tbody.innerHTML+=`<tr><td style="color:#00f3ff">Z${i+1}</td><td>${S}</td><td>${z.toFixed(3)}</td><td>${Y.toFixed(3)}</td><td style="color:#00f3ff; font-weight:bold">${X.toFixed(3)}</td></tr>`;
            }
        });

        // TENTATIVE DE DESSIN ENCADRÉE
        try {
            if (vizModeAn === '2d') {
                const cvs = document.getElementById('visualizer'); 
                const dpr = window.devicePixelRatio || 1;
                if (cvs && cvs.parentElement) {
                    const rect = cvs.parentElement.getBoundingClientRect();
                    // On dessine si le panneau est visible (width > 0)
                    if (rect.width > 0 && rect.height > 0) {
                        cvs.width = rect.width * dpr; cvs.height = rect.height * dpr;
                        const ctx = cvs.getContext('2d'); ctx.scale(dpr, dpr);
                        ctx.clearRect(0,0,rect.width,rect.height); ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,rect.width,rect.height); 
                        
                        const W = rect.width; const H = rect.height; const midX = W/2; const pad = 20; 
                        const maxR_face = Math.max(0, Math.min(midX, H)/2 - pad); const scFace = (D>0) ? maxR_face/(D/2) : 1; const cxF = midX/2; const cyF = H/2;
                        
                        ctx.beginPath(); ctx.arc(cxF, cyF, Math.max(0, (D/2)*scFace), 0, Math.PI*2); ctx.fillStyle="#f0f0f0"; ctx.fill(); ctx.strokeStyle="#333"; ctx.lineWidth=2; ctx.stroke();
                        if(holeD>0) { ctx.beginPath(); ctx.arc(cxF, cyF, Math.max(0, (holeD/2)*scFace), 0, Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle="#333"; ctx.lineWidth=1; ctx.stroke(); }
                        zones.forEach(z=>{ ctx.beginPath(); ctx.arc(cxF, cyF, Math.max(0, z*scFace), 0, Math.PI*2); ctx.strokeStyle="#0000ff"; ctx.lineWidth=1; ctx.stroke(); });
                        ctx.fillStyle="#000"; ctx.font="12px Orbitron"; ctx.textAlign="center"; ctx.fillText("VUE DE FACE", cxF, H - 10);

                        const cxC = midX + midX/2; const cyC = H/2; const scCoupe = scFace * 0.8; 
                        ctx.beginPath(); ctx.moveTo(cxC-maxR_face, cyC); ctx.lineTo(cxC+maxR_face, cyC); ctx.setLineDash([5,5]); ctx.strokeStyle="#ccc"; ctx.stroke(); ctx.setLineDash([]);
                        
                        const rad = D/2; const hRad = holeD/2;
                        
                        ctx.beginPath(); const z_edge = (rad*rad)/(2*R); ctx.moveTo(cxC + rad*scCoupe, cyC - z_edge*scCoupe); 
                        for(let x=rad; x>=hRad; x-=1) { let z_val = (x*x)/(2*R); ctx.lineTo(cxC + x*scCoupe, cyC - z_val*scCoupe); }
                        ctx.lineTo(cxC + hRad*scCoupe, cyC + thick*scCoupe); ctx.lineTo(cxC + rad*scCoupe, cyC + thick*scCoupe); ctx.closePath();
                        ctx.fillStyle="#ddd"; ctx.fill(); ctx.strokeStyle="#000"; ctx.stroke();

                        ctx.beginPath(); ctx.moveTo(cxC - rad*scCoupe, cyC - z_edge*scCoupe);
                        for(let x2=rad; x2>=hRad; x2-=1) { let z_val2 = (x2*x2)/(2*R); ctx.lineTo(cxC - x2*scCoupe, cyC - z_val2*scCoupe); }
                        ctx.lineTo(cxC - hRad*scCoupe, cyC + thick*scCoupe); ctx.lineTo(cxC - rad*scCoupe, cyC + thick*scCoupe); ctx.closePath();
                        ctx.fillStyle="#ddd"; ctx.fill(); ctx.strokeStyle="#000"; ctx.stroke();

                        ctx.fillStyle="#999"; ctx.beginPath(); ctx.moveTo(cxC+rad*scCoupe, cyC - z_edge*scCoupe); ctx.lineTo(cxC+rad*scCoupe-5, cyC - z_edge*scCoupe + 5); ctx.lineTo(cxC+rad*scCoupe, cyC - z_edge*scCoupe + 10); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(cxC-rad*scCoupe, cyC - z_edge*scCoupe); ctx.lineTo(cxC-rad*scCoupe+5, cyC - z_edge*scCoupe + 5); ctx.lineTo(cxC-rad*scCoupe, cyC - z_edge*scCoupe + 10); ctx.fill();
                        ctx.fillStyle="#000"; ctx.fillText("PROFIL (Z x1)", cxC, H - 10);
                    }
                }
            } else { 
                if(typeof window.updateAn3D === 'function') window.updateAn3D(); 
            }
        } catch(e) {
            console.error("L'Astro Master a capturé une erreur graphique, mais les mathématiques sont sauves :", e);
        }
    }
    window.runAnalyzer = runAnalyzer;

    function updateAnalyzerK() {
        const type = document.getElementById('an-type').value; const kInput = document.getElementById('an-kfactor');
        if(type === 'custom') { kInput.disabled = false; kInput.style.backgroundColor = 'rgba(255,255,255,0.15)'; } 
        else { kInput.disabled = true; kInput.style.backgroundColor = 'rgba(255,255,255,0.05)';
            if(type === 'parabola') kInput.value = -1; else if(type === 'sphere') kInput.value = 0; else if(type === 'hyperbola') kInput.value = -1.1; else if(type === 'ellipse') kInput.value = -0.5; }
    }
    window.updateAnalyzerK = updateAnalyzerK;
    
    function setCalcMode(mode) {
        calculationMode = mode;
        const f1 = document.getElementById('arch-F1'); const sep = document.getElementById('arch-Sep'); const fSys = document.getElementById('arch-F');
        document.getElementById('mode-f1').classList.remove('active'); document.getElementById('mode-sep').classList.remove('active'); document.getElementById('mode-auto').classList.remove('active'); document.getElementById('mode-free').classList.remove('active');

        if(mode==='f1'){ f1.disabled = false; sep.disabled = true; fSys.disabled = false; document.getElementById('lock-f1').style.display='inline'; document.getElementById('lock-sep').style.display='none'; document.getElementById('mode-f1').classList.add('active'); fSys.style.opacity = '1'; }
        else if(mode==='sep'){ f1.disabled = true; sep.disabled = false; fSys.disabled = false; document.getElementById('lock-f1').style.display='none'; document.getElementById('lock-sep').style.display='inline'; document.getElementById('mode-sep').classList.add('active'); fSys.style.opacity = '1'; }
        else if(mode==='auto'){ f1.disabled = true; sep.disabled = true; fSys.disabled = false; document.getElementById('lock-f1').style.display='none'; document.getElementById('lock-sep').style.display='none'; document.getElementById('mode-auto').classList.add('active'); fSys.style.opacity = '1'; }
        else if(mode==='free'){ f1.disabled = false; sep.disabled = false; fSys.disabled = true; fSys.style.opacity = '0.5'; document.getElementById('lock-f1').style.display='none'; document.getElementById('lock-sep').style.display='none'; document.getElementById('mode-free').classList.add('active'); }
    }
    window.setCalcMode = setCalcMode;

    function updateArchUI() {
        const type = document.getElementById('arch-type').value;
        if(type === 'newton') { document.getElementById('calc-mode-container').style.opacity='0.3'; document.getElementById('calc-mode-container').style.pointerEvents='none'; window.setCalcMode('f1'); document.getElementById('sec-card').style.opacity='0.3'; } 
        else { document.getElementById('calc-mode-container').style.opacity='1'; document.getElementById('calc-mode-container').style.pointerEvents='all'; document.getElementById('sec-card').style.opacity='1'; }
        window.runArchitect();
    }
    window.updateArchUI = updateArchUI;

    function runArchitect() {
        const type = document.getElementById('arch-type').value;
        const D = parseFloat(document.getElementById('arch-D').value) || 0; 
        const B = parseFloat(document.getElementById('arch-B').value) || 0;
        const CPL = parseFloat(document.getElementById('arch-CPL').value) || 0;
        let F=0, F1=0, Sep=0, M=0, VizSep=0, R1=0, K1=0, R2=0, K2=0, s1="-", s2="-", D2_val=0, hD=0;

        if(type === 'newton') {
            const inputF = parseFloat(document.getElementById('arch-F').value) || 0; const inputF1 = parseFloat(document.getElementById('arch-F1').value) || 0;
            if(currentData.type === 'NEWTON') { if (inputF !== currentData.F) { F = inputF; } else if (inputF1 !== currentData.F1) { F = inputF1; } else { F = inputF; } } else { F = inputF; }
            F1 = F; document.getElementById('arch-F').value = F.toFixed(2); document.getElementById('arch-F1').value = F1.toFixed(2);
            Sep = 0; M = 1; if (F > 0) { let L = (D/2) + B; D2_val = ((D - CPL) * L) / F + CPL; } else { D2_val = 0; }
            if(D2_val <= 0) D2_val = 10; VizSep = Math.max(0, F - (D/2 + B));
        } else {
            if(calculationMode === 'free') {
                F1 = parseFloat(document.getElementById('arch-F1').value)||0; Sep = parseFloat(document.getElementById('arch-Sep').value)||0; VizSep = Sep;
                if(F1 > 0 && Sep >= F1) { alert("ERREUR GÉOMÉTRIQUE : La séparation ne peut pas être plus grande que la focale primaire (F1)."); return; }
                if(F1 - Sep !== 0) { M = (Sep + B) / (F1 - Sep); } else { M = 0; }
                F = F1 * M; document.getElementById('arch-F').value = F.toFixed(2);
            } else {
                F = parseFloat(document.getElementById('arch-F').value) || 0;
                
                if(calculationMode === 'auto') { 
                    if (F <= 0 || !isFinite(F)) { 
                        F = D * 10; 
                        document.getElementById('arch-F').value = F.toFixed(2); 
                    }
                    F1 = D * 3.5; 
                    document.getElementById('arch-F1').value = F1.toFixed(2); 
                    M = (F1 > 0) ? F / F1 : 0; 
                    Sep = (M * F1 - B) / (M + 1); 
                    document.getElementById('arch-Sep').value = Sep.toFixed(2); 
                }
                else if(calculationMode === 'f1') { 
                    F1 = parseFloat(document.getElementById('arch-F1').value)||0; M = (F1>0) ? F/F1 : 0; 
                    Sep = (M*F1 - B)/(M+1); document.getElementById('arch-Sep').value = Sep.toFixed(2); 
                } 
                else { 
                    Sep = parseFloat(document.getElementById('arch-Sep').value)||0; M = (Sep>0) ? (F-B-Sep)/Sep : 0; 
                    if(M<=0){ alert("ERREUR GÉOMÉTRIQUE : Séparation ou Focale invalide."); return; } 
                    F1 = F/M; document.getElementById('arch-F1').value = F1.toFixed(2); 
                }
                VizSep = Sep;
            }
        }

        R1 = 2*F1; 
        if(type==='newton') { K1=-1; R2=0; K2=0; s1="Parabole"; s2="Plan"; hD=0; } 
        else if(F1 > 0) {
            if(M === 1) { R2 = 0; } else { R2 = (2*Sep*M)/(M-1); }
            
            // INTÉGRATION EXACTE DU CHAMP DE PLEINE LUMIÈRE (CPL)
            const p = F1 - Sep;
            const D2_min = (D * p) / F1; 
            D2_val = D2_min + CPL * (p / F1);
            hD = (D2_val * B) / (Sep + B) + CPL * (Sep / (Sep + B));

            if(type==='cassegrain') { K1=-1; s1="Parabole"; const t=(M+1)/(M-1); K2=-(t*t); s2="Hyperbole"; } 
            else if(type==='dk') { K2=0; s2="Sphère"; const p_val=Sep+B; const t2=(Math.pow(M,2)-1)/Math.pow(M,3); K1=-1+t2*(p_val/F1); s1="Ellipse Prolate"; }
            else if(type==='rc' || type==='nasmyth') { K1=-1-(2*(Sep+B))/(Math.pow(M,3)*Sep); K2=-Math.pow((M+1)/(M-1),2)-(4*M*(M+1))/((M-1)*Math.pow(M,2))*((Sep+B)/Sep); s1="Hyperbole"; s2="Hyperbole"; }
            else if(type==='sct') { K1=0; K2=0; s1="Sphère"; s2="Sphère"; }
            else { K1=0; K2=0; s1="Sphère"; s2="Sphère"; }
        }

        const baffle_margin = 4; let D_obs = 0;
        if(type === 'newton') { D_obs = Math.abs(D2_val) + baffle_margin; } else { const r2_opt = Math.abs(D2_val) / 2; const b2_baseR = r2_opt + 2; D_obs = b2_baseR * 2; }
        const Deff = Math.sqrt(Math.max(0, Math.pow(D, 2) - Math.pow(D_obs, 2))).toFixed(1);
        
        // --- CALCUL DES CORRECTEURS ET VERRES OPTIQUES ---
        let corrType = "-", corrPos = 0, corrDiam = 0, corrGlass = "-";
        let lenses = [];
        const F_sys = F > 0 ? F : 1; 

        let useCorr = document.getElementById('arch-use-corr') ? document.getElementById('arch-use-corr').checked : true;
        if (!useCorr) {
            corrType = "Aucun (Foyer natif)";
            corrPos = 0; corrDiam = 0; corrGlass = "-";
            lenses = [];
        } else if (type === 'newton') {
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
        }

        currentData = { 
            type: type.toUpperCase(), D: D, F: F, F1: F1, B: B, Sep: Sep, VizSep: VizSep, M: M, R1: R1, K1: K1, Shape1: s1, Hole: hD, 
            R2: Math.abs(R2), K2: K2, Shape2: s2, D2: Math.abs(D2_val), Deff: Deff, CPL: CPL,
            Corrector: { name: corrType, pos: corrPos, diam: corrDiam, glass: corrGlass, lenses: lenses }
        };

        // UI Updates M1/M2/Stats
        document.getElementById('res-fd').innerText = (D>0 && F>0) ? "f/" + (F/D).toFixed(1) : "-"; document.getElementById('res-mag').innerText = (isFinite(M) && M>0) ? M.toFixed(2) + "x" : "Err"; document.getElementById('res-obst').innerText = (D>0) ? (D_obs/D*100).toFixed(1) + "%" : "-"; document.getElementById('res-d-eff').innerText = Deff + " mm"; const resArc = (D>0) ? (116/D).toFixed(2) + '"' : "-"; document.getElementById('res-resol').innerText = resArc;
        document.getElementById('res-r1').innerText = R1.toFixed(2); document.getElementById('res-f1-out').innerText = F1.toFixed(2); document.getElementById('res-k1').innerText = K1.toFixed(4); document.getElementById('res-shape1').innerText = s1; document.getElementById('res-hole').innerText = hD>0 ? hD.toFixed(1)+" mm" : "N/A"; document.getElementById('res-shape2').innerText = s2;

        if(type !== 'newton') { 
            document.getElementById('res-r2').innerText = (isFinite(R2) && M>0) ? Math.abs(R2).toFixed(2) : "-"; 
            document.getElementById('res-sep-out').innerText = Sep.toFixed(2); 
            document.getElementById('res-k2').innerText = isFinite(K2) ? K2.toFixed(4) : "-"; 
            document.getElementById('res-d2').innerText = Math.abs(D2_val).toFixed(1);
            const D2_min = (D * (F1 - Sep)) / F1;
            const cplMargin = Math.abs(D2_val) - D2_min;
            document.getElementById('res-cpl-margin').innerText = cplMargin > 0 ? "+" + cplMargin.toFixed(1) + " mm" : "0 mm";
        } 
        else { 
            document.getElementById('res-r2').innerText = "-"; 
            document.getElementById('res-sep-out').innerText = "-"; 
            document.getElementById('res-k2').innerText = "-"; 
            document.getElementById('res-d2').innerText = Math.abs(D2_val).toFixed(1); 
            const L = (D/2) + B;
            const D2_min_newton = (D * L) / F;
            const cplMargin = Math.abs(D2_val) - D2_min_newton;
            document.getElementById('res-cpl-margin').innerText = cplMargin > 0 ? "+" + cplMargin.toFixed(1) + " mm" : "0 mm";
        }
        
        // Correcteur UI
        document.getElementById('res-corr-type').innerText = corrType;
        document.getElementById('res-corr-pos').innerText = (type==='sct') ? "Entrée Tube" : "-" + corrPos + " mm (Foyer)";
        document.getElementById('res-corr-diam').innerText = corrDiam > 0 ? corrDiam.toFixed(1) + " mm" : "-";
        document.getElementById('res-corr-glass').innerText = corrGlass;

        try {
            if(vizModeArch === '2d') { window.redrawCurrentBlueprint(); } else { window.updateArch3D(); }
        } catch(e) { console.error(e); }
    }
    window.runArchitect = runArchitect;

    function zoomBlueprint(delta) { viewState.scale += delta; if(viewState.scale < 0.1) viewState.scale = 0.1; if(viewState.scale > 5) viewState.scale = 5; window.redrawCurrentBlueprint(); }
    window.zoomBlueprint = zoomBlueprint;
    function resetZoom() { viewState.scale = 1; viewState.offsetX = 0; viewState.offsetY = 0; window.redrawCurrentBlueprint(); }
    window.resetZoom = resetZoom;
    
    function downloadPDF() {
        const { jsPDF } = window.jspdf; const doc = new jsPDF(); const pName = document.getElementById('project-name').value || "Projet Optique";
        doc.setFontSize(22); doc.text("MONSIEUR ANDRIVET // RAPPORT v2", 20, 20); doc.setFontSize(16); doc.setTextColor(0, 86, 179); doc.text(pName, 20, 30); doc.setFontSize(10); doc.setTextColor(0,0,0); doc.text("Date: "+new Date().toLocaleDateString(), 150, 20);
        const cvs = document.createElement('canvas'); cvs.width=2000; cvs.height=1000; const ctx = cvs.getContext('2d'); ctx.fillStyle="#fff"; ctx.fillRect(0,0,2000,1000);
        const oldState = {...viewState}; viewState={scale:1, offsetX:0, offsetY:0}; drawBlueprintGeneric(ctx, 2000, 1000, currentData.type.toLowerCase(), currentData.D, currentData.F1, currentData.VizSep || currentData.Sep, currentData.B, currentData.D2, currentData.F, currentData.Hole, currentData.CPL, 'print', currentData.Corrector); viewState = oldState;
        doc.addImage(cvs.toDataURL("image/png"), 'PNG', 10, 40, 190, 95);
        const y=150; doc.line(10,y,200,y); doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text("DONNÉES", 10, y-5); doc.setFontSize(10); doc.setFont("helvetica","normal");
        doc.text(`Diamètre: ${currentData.D} mm`, 15, y+10); doc.text(`Diamètre Pur: ${currentData.Deff} mm`, 15, y+20); doc.text(`Focale: ${currentData.F} mm (f/${(currentData.F/currentData.D).toFixed(1)})`, 15, y+30); doc.text(`PRIMAIRE (R1): ${currentData.R1.toFixed(2)} mm (K=${currentData.K1.toFixed(4)})`, 80, y+10);
        if(currentData.type!=='NEWTON'){ doc.text(`SECONDAIRE (R2): ${currentData.R2.toFixed(2)} mm (K=${currentData.K2.toFixed(4)})`, 80, y+20); doc.text(`Séparation: ${currentData.Sep.toFixed(2)} mm`, 80, y+30); }
        doc.text(`CORRECTEUR: ${currentData.Corrector.name} | Verres: ${currentData.Corrector.glass}`, 15, y+45);
        doc.save("Rapport_Monsieur_Andrivet.pdf");
    }
    window.downloadPDF = downloadPDF;

    function downloadCoursePDF() {
        const { jsPDF } = window.jspdf; const doc = new jsPDF();
        const addWrappedText = (text, x, y, maxWidth, lineHeight) => { const lines = doc.splitTextToSize(text, maxWidth); doc.text(lines, x, y); return lines.length * lineHeight; };
        doc.setFontSize(22); doc.setTextColor(0,0,0); doc.text("MONSIEUR ANDRIVET // COURS OPTIQUE", 20, 20); doc.setFontSize(16); doc.setTextColor(0, 86, 179); doc.text("THÉORIE DE LA CAUSTIQUE & ARCHITECTURE", 20, 35); doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.text("Auteur : Monsieur Andrivet", 20, 45); doc.setFontSize(11); doc.setTextColor(0,0,0);
        let y = 60; y += addWrappedText("1. LE TEST DE LA CAUSTIQUE (PLATZECK-GAVIOLA)\n\nLes miroirs paraboliques ou hyperboliques ne focalisent pas la lumière en un point unique lorsqu'on les teste depuis leur centre de courbure (contrairement à une sphère). Chaque zone du miroir a un point de convergence différent (la caustique). Ce logiciel calcule les coordonnées (X, Y) pour le test de Foucault.", 20, y, 170, 7);
        y += 10; doc.setFont("helvetica", "bold"); doc.text("2. FORMULES (Cornejo & Malacara)", 20, y); y+=10; doc.setFont("courier", "normal"); doc.text("c = 1 / R", 25, y); y+=7; doc.text("z = (c * S^2) / (1 + sqrt(1 - (K+1)*c^2*S^2))", 25, y); y+=7; doc.text("Y = -K*z * [3 + c*z*(K+1)*(c*z*(K+1)-3)]", 25, y); y+=7; doc.text("X = -S*c*K*z * [2 + ... ] / (1 - ...)", 25, y); y+=15; doc.setFont("helvetica", "bold"); doc.text("3. ARCHITECTURE (Schwarzschild)", 20, y); y+=10; doc.setFont("helvetica", "normal"); y += addWrappedText("Le module Architecte utilise les equations du 3ème ordre pour éliminer l'aberration sphérique et la coma. Pour un Dall-Kirkham, le primaire est une ellipse prolate compensant un secondaire sphérique.", 20, y, 170, 7);
        doc.save("Cours_Optique_Monsieur_Andrivet_v2.pdf");
    }
    window.downloadCoursePDF = downloadCoursePDF;

    function autoCalcZones() {
        const D = parseFloat(document.getElementById('an-diameter').value)||0; const holeD = parseFloat(document.getElementById('an-hole').value)||0;
        const R_val = parseFloat(document.getElementById('an-curvature-val').value)||0; const R = (anMode === 'F') ? R_val * 2 : R_val;
        let forcedN = parseInt(document.getElementById('an-nb-zones').value); if(!D || !R) return;
        const width_mm = 4.53 * Math.pow(((R/2)/D) * Math.pow(R/10, 2), 1/3) * 0.1;
        const radiusMirror = D / 2; const radiusHole = holeD / 2; const usefulRadius = radiusMirror - radiusHole;
        if(usefulRadius <= 0) { document.getElementById('an-zones').value = ""; window.runAnalyzer(); return; }
        const numZones = (forcedN > 0) ? forcedN : Math.ceil(usefulRadius / width_mm);
        if(isNaN(forcedN) || forcedN <= 0) { document.getElementById('an-nb-zones').placeholder = numZones; if(document.getElementById('an-nb-zones').value !== "") { document.getElementById('an-nb-zones').value = ""; } }
        const actualWidth = usefulRadius / numZones; const zoneCenters = [];
        for(let i=0; i<numZones; i++) { const center = radiusHole + (i * actualWidth) + (actualWidth/2); zoneCenters.push(center.toFixed(1)); }
        document.getElementById('an-zones').value = zoneCenters.join(', '); document.getElementById('an-maxw').innerText = width_mm.toFixed(1) + " mm";
        window.runAnalyzer();
    }
    window.autoCalcZones = autoCalcZones;

    // --- 3D ENGINE ---
    function init3D(type) {
        const container = document.getElementById(type === 'an' ? 'container3d_an' : 'container3d_arch');
        const w = container.offsetWidth; const h = container.offsetHeight;
        const sc = new THREE.Scene(); sc.background = new THREE.Color(0xffffff); 
        const cam = new THREE.PerspectiveCamera(45, w/h, 1, 10000); 
        if(type==='an') { cam.position.set(0, 300, 500); } else { cam.position.set(500, 500, 1000); }
        const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setSize(w, h); ren.setPixelRatio(window.devicePixelRatio);
        container.innerHTML = ""; container.appendChild(ren.domElement);
        const ctr = new THREE.OrbitControls(cam, ren.domElement); ctr.enableDamping=true; 
        sc.add(new THREE.AmbientLight(0xffffff, 0.6)); const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(500,1000,500); sc.add(dl);
        const pl = new THREE.PointLight(0xccccff, 0.5); pl.position.set(-200, 200, 200); sc.add(pl);
        scenes[type] = sc; cameras[type] = cam; renderers[type] = ren; controlsList[type] = ctr;
        const animate = function() { requestAnimationFrame(animate); ctr.update(); ren.render(sc, cam); }; animate();
    }
    window.init3D = init3D;

    function updateAn3D() {
        if(!scenes.an) window.init3D('an'); const sc = scenes.an; clearGroup3D(sc, 'anGroup');
        const D = parseFloat(document.getElementById('an-diameter').value) || 0; const thick = parseFloat(document.getElementById('an-thickness').value) || 0; 
        const holeD = parseFloat(document.getElementById('an-hole').value) || 0; const R_val = parseFloat(document.getElementById('an-curvature-val').value) || 0; 
        if (D <= 0 || R_val === 0) return;
        const R = (anMode === 'F') ? R_val * 2 : R_val;
        meshes.anGroup = new THREE.Group(); sc.add(meshes.anGroup); const grp = meshes.anGroup;
        const points = []; const segments = 40; const radius = D/2; const holeR = holeD/2; const sagEdge = (radius*radius)/(2*R);
        points.push(new THREE.Vector2(holeR, 0)); points.push(new THREE.Vector2(radius, 0)); points.push(new THREE.Vector2(radius, thick));
        for(let i=0; i<=segments; i++) { let r = radius - (i/segments)*(radius-holeR); let sagLocal = (r*r)/(2*R); let y = thick - (sagEdge - sagLocal); points.push(new THREE.Vector2(r, y)); }
        points.push(new THREE.Vector2(holeR, 0)); 
        const geo = new THREE.LatheGeometry(points, 64); geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness:0.8, roughness:0.2, side:THREE.DoubleSide });
        grp.add(new THREE.Mesh(geo, mat));
    }
    window.updateAn3D = updateAn3D;

    function updateArch3D() {
        if(!scenes.arch) window.init3D('arch'); const sc = scenes.arch;
        clearGroup3D(sc, 'archGroup');
        if(!currentData.type) return;

        meshes.archGroup = new THREE.Group(); sc.add(meshes.archGroup); const grp = meshes.archGroup;
        let visualSep = currentData.VizSep || currentData.Sep; if (visualSep > currentData.F1) visualSep = currentData.F1 * 0.95;

        let physicalHoleR = 0; let b1_len_val = 0; let b1_outerR = 0;
        const CPL = currentData.CPL || 0;
        const corrData = currentData.Corrector;
        const matLens = new THREE.MeshStandardMaterial({color: 0x00ffff, opacity:0.4, transparent:true, roughness: 0.1, metalness:0.1});

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


        if(currentData.type !== 'NEWTON') {
            const opticalHoleR = currentData.Hole / 2; b1_len_val = (currentData.Sep * 0.4); 
            if (currentData.type === 'NASMYTH') { b1_len_val = (currentData.Sep * 0.25); }
            const dist_focus_to_tip = currentData.B + b1_len_val; const dist_focus_to_m2 = currentData.B + currentData.Sep;
            
            const r_beam_at_tip = (CPL/2) + ( (currentData.D2/2) - (CPL/2) ) * (dist_focus_to_tip / dist_focus_to_m2);
            let b1_innerR = r_beam_at_tip + 2; if(b1_innerR < opticalHoleR) b1_innerR = opticalHoleR + 1;
            const b1_thick = 2; b1_outerR = b1_innerR + b1_thick; physicalHoleR = b1_outerR + 2; 
        }

        const R1 = currentData.D/2; const H1 = physicalHoleR; const thick1 = currentData.D/6; const pts1 = [];
        pts1.push(new THREE.Vector2(H1, 0)); pts1.push(new THREE.Vector2(R1, 0)); pts1.push(new THREE.Vector2(R1, thick1)); 
        for(let i=0; i<=40; i++){ let r = R1 - (i/40)*(R1-H1); let sag = (r*r)/(4*currentData.F1); pts1.push(new THREE.Vector2(r, thick1 - ( (R1*R1)/(4*currentData.F1) - sag ))); }
        pts1.push(new THREE.Vector2(H1, 0)); 
        const m1Mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness:0.8, roughness:0.2, side:THREE.DoubleSide });
        const m1 = new THREE.Mesh(new THREE.LatheGeometry(pts1, 64), m1Mat); m1.rotation.x = Math.PI/2; grp.add(m1);

        const cellMat = new THREE.MeshStandardMaterial({color: 0x2a2a2a, roughness: 0.8, metalness: 0.5});
        const m1CellPts = []; m1CellPts.push(new THREE.Vector2(H1, 0)); m1CellPts.push(new THREE.Vector2(R1*1.05, 0)); m1CellPts.push(new THREE.Vector2(R1*1.05, -25)); m1CellPts.push(new THREE.Vector2(H1, -25)); m1CellPts.push(new THREE.Vector2(H1, 0));
        const m1Cell = new THREE.Mesh(new THREE.LatheGeometry(m1CellPts, 64), cellMat); m1Cell.rotation.x = Math.PI/2; grp.add(m1Cell);

        if(currentData.type !== 'NEWTON') {
            const R2 = currentData.D2/2; const Sep = visualSep; const thick2 = Math.max(R2/3, 10); const pts2 = [];
            pts2.push(new THREE.Vector2(0, thick2)); pts2.push(new THREE.Vector2(R2, thick2)); 
            const r2_abs = Math.abs(currentData.R2); const sag_edge = (r2_abs > 0) ? (R2*R2)/(2*r2_abs) : 0; pts2.push(new THREE.Vector2(R2, sag_edge)); 
            for(let i=0; i<=40; i++){ let r_loop = R2 * (1 - i/40); let sag2 = (r2_abs > 0) ? (r_loop*r_loop)/(2*r2_abs) : 0; pts2.push(new THREE.Vector2(r_loop, sag2)); }
            const m2 = new THREE.Mesh(new THREE.LatheGeometry(pts2, 64), m1Mat); m2.rotation.x = Math.PI/2; m2.position.z = Sep; grp.add(m2);

            const m2CellPts = []; m2CellPts.push(new THREE.Vector2(0, thick2)); m2CellPts.push(new THREE.Vector2(R2*1.05, thick2)); m2CellPts.push(new THREE.Vector2(R2*1.05, thick2 + 15)); m2CellPts.push(new THREE.Vector2(0, thick2 + 15));
            const m2CellObj = new THREE.Mesh(new THREE.LatheGeometry(m2CellPts, 64), cellMat); m2CellObj.rotation.x = Math.PI/2; m2CellObj.position.z = Sep; grp.add(m2CellObj);

            const baffleGroup = new THREE.Group(); const matBaffle = new THREE.MeshStandardMaterial({color: 0x151515, side: THREE.DoubleSide, roughness: 1.0, metalness: 0.1});
            
            const lenB1 = b1_len_val; 
            const meshB1 = new THREE.Mesh(new THREE.CylinderGeometry(b1_outerR, b1_outerR, lenB1, 32, 1, true), matBaffle); 
            meshB1.rotation.x = Math.PI/2; meshB1.position.z = lenB1/2; 
            baffleGroup.add(meshB1);
            
            const b2_baseR = R2 + 2; 
            const lenB2 = Sep * 0.15; 
            const r1_opt = currentData.D / 2;
            const r_beam_at_m2_tip = R2 + (r1_opt - R2) * (lenB2 / Sep);
            const b2_tipR = r_beam_at_m2_tip + 2; 
            
            const meshB2 = new THREE.Mesh(new THREE.CylinderGeometry(b2_baseR, b2_tipR, lenB2, 32, 1, true), matBaffle); 
            meshB2.rotation.x = Math.PI/2; meshB2.position.z = Sep - lenB2/2; 
            baffleGroup.add(meshB2);
            grp.add(baffleGroup);

            const nasmyth = (currentData.type === 'NASMYTH'); const m3_z_pos = currentData.Sep * 0.25; 
            if (nasmyth) {
                let supportRad = physicalHoleR - 2; if (supportRad < 5) supportRad = 5; 
                const m3_minor_axis = currentData.D2 * 0.8; 
                
                const supportStart = -20; const supportEnd = m3_z_pos - (m3_minor_axis/2 * 0.707) - 15; const supportLen = supportEnd - supportStart;
                const supp = new THREE.Mesh(new THREE.CylinderGeometry(supportRad, supportRad, supportLen, 32), cellMat); supp.rotation.x = Math.PI/2; supp.position.z = supportStart + supportLen / 2; grp.add(supp);
                
                const m3Group = new THREE.Group(); m3Group.position.z = m3_z_pos; m3Group.rotation.y = -3 * Math.PI / 4; 
                const m3 = new THREE.Mesh(new THREE.CircleGeometry(m3_minor_axis/2, 64), m1Mat); m3.scale.x = 1.414; m3Group.add(m3);
                const m3Cell = new THREE.Mesh(new THREE.CylinderGeometry(m3_minor_axis/2 * 0.9, m3_minor_axis/2 * 0.9, 10, 32), cellMat); m3Cell.rotation.x = Math.PI/2; m3Cell.scale.x = 1.414; m3Cell.position.z = -5; m3Group.add(m3Cell);
                grp.add(m3Group);

                // Correcteur Nasmyth 3D
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
                }

            } else {
                // Correcteur 3D (Cas, DK, RC, SCT)
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
                }
            }

            const numRays = 16; const ptsAll = []; const Z_start = Sep + 500; const Z_m1 = thick1; const Z_foc = -currentData.B;
            for(let i=0; i<numRays; i++) {
                const angle = (i/numRays) * Math.PI * 2; const x = Math.cos(angle) * R1; const y = Math.sin(angle) * R1;
                const ratio = Math.max(0, (currentData.F1 - Sep) / currentData.F1); const x2_ray = x * ratio; const y2_ray = y * ratio;
                const ray_sag = (r2_abs > 0) ? (Math.pow(Math.sqrt(x2_ray*x2_ray + y2_ray*y2_ray), 2))/(2*r2_abs) : 0; const Z_m2_ray = Sep - ray_sag;
                
                ptsAll.push(new THREE.Vector3(x, y, Z_start)); ptsAll.push(new THREE.Vector3(x, y, Z_m1)); ptsAll.push(new THREE.Vector3(x, y, Z_m1)); ptsAll.push(new THREE.Vector3(x2_ray, y2_ray, Z_m2_ray));
                
                if(nasmyth) {
                    const t_val = (m3_z_pos - x2_ray - Z_m2_ray) / (Z_foc - Z_m2_ray - x2_ray);
                    const x3 = x2_ray * (1 - t_val); const y3 = y2_ray * (1 - t_val); const z3 = Z_m2_ray + t_val * (Z_foc - Z_m2_ray);
                    ptsAll.push(new THREE.Vector3(x2_ray, y2_ray, Z_m2_ray)); ptsAll.push(new THREE.Vector3(x3, y3, z3));
                    const side_focus_X = currentData.B + m3_z_pos; ptsAll.push(new THREE.Vector3(x3, y3, z3)); ptsAll.push(new THREE.Vector3(side_focus_X, 0, m3_z_pos)); 
                } else { ptsAll.push(new THREE.Vector3(x2_ray, y2_ray, Z_m2_ray)); ptsAll.push(new THREE.Vector3(0, 0, Z_foc)); }
            }
            const lRays = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ptsAll), new THREE.LineBasicMaterial({ color: 0xaa00ff, opacity: 0.6, transparent: true })); grp.add(lRays);
            
            const camRad = 35; const camLen = 40; const camGeo = new THREE.CylinderGeometry(camRad, camRad, camLen, 32); const camMat = new THREE.MeshStandardMaterial({color: 0xcc0000, metalness:0.6, roughness:0.2}); const cam = new THREE.Mesh(camGeo, camMat);
            if(nasmyth) { cam.rotation.z = -Math.PI/2; const side_focus_X = currentData.B + m3_z_pos; cam.position.set(side_focus_X + camLen/2, 0, m3_z_pos); } 
            else { cam.rotation.x = Math.PI/2; cam.position.z = Z_foc - (camLen/2); }
            grp.add(cam);

            const trussGroup = new THREE.Group(); const boxR = (R1*1.15); const matTruss = new THREE.MeshStandardMaterial({color: 0x222222, roughness:0.9});
            for(let i=0; i<8; i++) {
                const a1 = (Math.floor(i/2)*90)*(Math.PI/180); const a2 = (i%2===1 ? a1+Math.PI/4 : a1-Math.PI/4);
                const v1 = new THREE.Vector3(Math.cos(a1)*boxR, Math.sin(a1)*boxR, 0); const v2 = new THREE.Vector3(Math.cos(a2)*boxR, Math.sin(a2)*boxR, Sep); const dist = v1.distanceTo(v2);
                const tube = new THREE.Mesh(new THREE.CylinderGeometry(5,5,dist,8), matTruss); tube.position.copy(new THREE.Vector3().addVectors(v1,v2).multiplyScalar(0.5)); tube.lookAt(v2); tube.rotateX(Math.PI/2); trussGroup.add(tube);
            }
            const spiderZ = Sep + thick2 + 7.5; const spiderV = new THREE.Mesh(new THREE.BoxGeometry(4, boxR*2, 20), matTruss); spiderV.position.z = spiderZ; trussGroup.add(spiderV);
            const spiderH = new THREE.Mesh(new THREE.BoxGeometry(boxR*2, 4, 20), matTruss); spiderH.position.z = spiderZ; trussGroup.add(spiderH);
            const cage = new THREE.Mesh(new THREE.TorusGeometry(boxR,5,16,100), matTruss); cage.position.z = Sep; trussGroup.add(cage); grp.add(trussGroup);

        } else {
            // NEWTON 3D
            const Sep = visualSep; 
            const tubeR = (R1*1.15); const Y_exit = tubeR + currentData.B; 
            
            const m2Group = new THREE.Group(); m2Group.position.z = Sep; m2Group.rotation.x = -3 * Math.PI / 4; 
            const m2 = new THREE.Mesh(new THREE.CircleGeometry(currentData.D2/2, 64), m1Mat); m2.scale.y = 1.414; m2Group.add(m2);
            const m2Cell = new THREE.Mesh(new THREE.CylinderGeometry(currentData.D2/2 * 0.9, currentData.D2/2 * 0.9, 15, 32), cellMat); m2Cell.rotation.x = Math.PI/2; m2Cell.scale.z = 1.414; m2Cell.position.z = -7.5; m2Group.add(m2Cell);
            grp.add(m2Group);

            const spiderZ = Sep + currentData.D2/2 * 0.707 + 25; 
            const spiderV = new THREE.Mesh(new THREE.BoxGeometry(2, tubeR * 2, 10), cellMat); spiderV.position.set(0, 0, spiderZ); spiderV.rotation.z = Math.PI / 4; grp.add(spiderV);
            const spiderH = new THREE.Mesh(new THREE.BoxGeometry(tubeR * 2, 2, 10), cellMat); spiderH.position.set(0, 0, spiderZ); spiderH.rotation.z = Math.PI / 4; grp.add(spiderH);
            const stalkLen = spiderZ - Sep; const stalk = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, stalkLen, 32), cellMat); stalk.rotation.x = Math.PI/2; stalk.position.set(0, 0, Sep + stalkLen/2); grp.add(stalk);

            // Correcteur Coma 3D Newton
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
            }

            const numRays = 16; const ptsAll = []; const Z_start = Sep + 500; const Z_m1 = thick1; 
            for(let i=0; i<numRays; i++) {
                const angle = (i/numRays) * Math.PI * 2; const x = Math.cos(angle) * R1; const y = Math.sin(angle) * R1;
                const t_val = (Sep - Z_m1 + y) / (currentData.F1 - Z_m1 + y);
                const xi = x * (1 - t_val); const yi = y * (1 - t_val); const zi = Z_m1 + t_val * (currentData.F1 - Z_m1);

                ptsAll.push(new THREE.Vector3(x, y, Z_start)); ptsAll.push(new THREE.Vector3(x, y, Z_m1));
                ptsAll.push(new THREE.Vector3(x, y, Z_m1)); ptsAll.push(new THREE.Vector3(xi, yi, zi));
                ptsAll.push(new THREE.Vector3(xi, yi, zi)); ptsAll.push(new THREE.Vector3(0, Y_exit, Sep));
            }
            const lRays = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ptsAll), new THREE.LineBasicMaterial({ color: 0xaa00ff, opacity: 0.6, transparent: true })); grp.add(lRays);

            const tubeGeo = new THREE.CylinderGeometry(tubeR, tubeR, Sep + 100, 32, 1, true); const tubeMat = new THREE.MeshStandardMaterial({color: 0x222222, side: THREE.DoubleSide, opacity:0.3, transparent:true}); const tube = new THREE.Mesh(tubeGeo, tubeMat); tube.rotation.x = Math.PI/2; tube.position.z = Sep/2; grp.add(tube);
            const focGeo = new THREE.CylinderGeometry(25, 25, currentData.B, 16); const focMat = new THREE.MeshStandardMaterial({color: 0x111111}); const foc = new THREE.Mesh(focGeo, focMat); foc.position.set(0, tubeR + currentData.B/2, Sep); grp.add(foc); 
            const camRad = 35; const camLen = 40; const camGeo = new THREE.CylinderGeometry(camRad, camRad, camLen, 32); const camMat = new THREE.MeshStandardMaterial({color: 0xcc0000, metalness:0.6, roughness:0.2}); const cam = new THREE.Mesh(camGeo, camMat); cam.position.set(0, tubeR + currentData.B + camLen/2, Sep); grp.add(cam);
        }
    }

    // --- EVENTS & INIT ---
    window.addEventListener('DOMContentLoaded', () => {
        const cvs = document.getElementById('blueprint-canvas');
        if(cvs) {
            cvs.addEventListener('mousedown', (e) => { viewState.isDragging = true; viewState.lastX = e.clientX; viewState.lastY = e.clientY; });
            window.addEventListener('mouseup', () => { viewState.isDragging = false; });
            cvs.addEventListener('mousemove', (e) => {
                if (!viewState.isDragging) return;
                viewState.offsetX += e.clientX - viewState.lastX; viewState.offsetY += e.clientY - viewState.lastY;
                viewState.lastX = e.clientX; viewState.lastY = e.clientY; window.redrawCurrentBlueprint();
            });
            cvs.addEventListener('wheel', (e) => {
                e.preventDefault();
                let zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                viewState.scale *= zoomFactor;
                if(viewState.scale < 0.1) viewState.scale = 0.1;
                if(viewState.scale > 10) viewState.scale = 10;
                window.redrawCurrentBlueprint();
            });
        }
        if (typeof window.autoCalcZones === 'function') { window.autoCalcZones(); }
        setTimeout(window.runArchitect, 200); 
    });

    window.addEventListener('resize', () => {
        if(vizModeArch === '2d') window.redrawCurrentBlueprint();
        if(vizModeAn === '2d') window.runAnalyzer();
        ['an', 'arch'].forEach(type => {
            const container = document.getElementById(type === 'an' ? 'container3d_an' : 'container3d_arch');
            if(container && cameras[type] && renderers[type] && container.offsetWidth > 0) {
                cameras[type].aspect = container.offsetWidth / container.offsetHeight;
                cameras[type].updateProjectionMatrix();
                renderers[type].setSize(container.offsetWidth, container.offsetHeight);
            }
        });
    });
