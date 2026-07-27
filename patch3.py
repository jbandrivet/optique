import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix wheel event (central zoom)
wheel_old = '''cvs.addEventListener('wheel', (e) => {
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
wheel_new = '''cvs.addEventListener('wheel', (e) => {
                e.preventDefault();
                let zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                viewState.scale *= zoomFactor;
                if(viewState.scale < 0.1) viewState.scale = 0.1;
                if(viewState.scale > 10) viewState.scale = 10;
                window.redrawCurrentBlueprint();
            });'''
content = content.replace(wheel_old, wheel_new)

# 2. Fix missing scaling for r1 and r2 in drawLens calls

# Schema Corrector tab
corr_schema_old = '''drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1, l.r2, l.t * scaleCorr);'''
corr_schema_new = '''drawLens(cx, axisY, corrData.diam * scaleCorr, l.r1 * scaleCorr, l.r2 * scaleCorr, l.t * scaleCorr);'''
content = content.replace(corr_schema_old, corr_schema_new)

# Newton, Nasmyth, and Generic 2D blueprint calls
draw_lens_old = '''drawLens(cx, 0, corrData.diam * scale, l.r1, l.r2, l.t * scale);'''
draw_lens_new = '''drawLens(cx, 0, corrData.diam * scale, l.r1 * scale, l.r2 * scale, l.t * scale);'''
content = content.replace(draw_lens_old, draw_lens_new)

draw_lens_sct_old = '''drawLens(m2X, axisY, corrData.diam * scale, corrData.lenses[0].r1, corrData.lenses[0].r2, corrData.lenses[0].t * scale);'''
draw_lens_sct_new = '''drawLens(m2X, axisY, corrData.diam * scale, corrData.lenses[0].r1 * scale, corrData.lenses[0].r2 * scale, corrData.lenses[0].t * scale);'''
content = content.replace(draw_lens_sct_old, draw_lens_sct_new)


# Also the user said "ca doit etre en 1:1 pour le corecteur"
# For the schema correcteur, right now I calculate:
# let scaleCorr = (width - 100) / totalLenCorr;
# if (scaleCorr > (height - 100) / corrData.diam) scaleCorr = (height - 100) / corrData.diam;
# This automatically fits it to the screen. If they want 1:1 meaning exact aspect ratio, this does that. 
# If they mean scale = 1, it might be tiny. Let's keep it fitted but maybe they meant aspect ratio 1:1, which is solved by passing r1*scaleCorr and r2*scaleCorr! Because without that, it was distorted (diam scaled but not radii).

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 3 done.")
