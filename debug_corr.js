const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
let jsCode = html.match(/<script>([\s\S]*?)<\/script>/)[1];

global.window = {
    addEventListener: () => {},
    devicePixelRatio: 1,
    THREE: {}
};
global.document = {
    getElementById: (id) => {
        return {
            value: (id === 'arch-type') ? 'newton' :
                   (id === 'an-diameter' || id === 'arch-d') ? '200' : 
                   (id === 'arch-f1') ? '800' :
                   (id === 'arch-m') ? '3' :
                   (id === 'arch-sep') ? '600' :
                   (id === 'arch-b') ? '100' : '0',
            checked: true,
            innerText: '',
            style: {},
            classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} },
            appendChild: ()=>{},
            offsetWidth: 800,
            offsetHeight: 600,
            parentElement: { getBoundingClientRect: () => ({width:800, height:600}) },
            getContext: () => ({ 
                scale:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, 
                stroke:()=>{}, fill:()=>{}, arc:()=>{}, closePath:()=>{}, fillText:()=>{}, save:()=>{}, restore:()=>{}, 
                translate:()=>{}, setLineDash: ()=>{}, clearRect: ()=>{} , textAlign: ''
            })
        };
    }
};

jsCode = jsCode.replace(/window\.updateArch3D\(\)/g, "null");
eval(jsCode);

['newton', 'cassegrain', 'dk', 'rc', 'nasmyth', 'sct'].forEach(t => {
    global.document.getElementById = (id) => {
        return {
            value: (id === 'arch-type') ? t :
                   (id === 'an-diameter' || id === 'arch-d') ? '200' : 
                   (id === 'arch-f1') ? '800' :
                   (id === 'arch-m') ? '3' :
                   (id === 'arch-sep') ? '600' :
                   (id === 'arch-b') ? '100' : '0',
            checked: true,
            innerText: '',
            style: {},
            classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} },
            appendChild: ()=>{},
            offsetWidth: 800,
            offsetHeight: 600,
            parentElement: { getBoundingClientRect: () => ({width:800, height:600}) },
            getContext: () => ({ 
                scale:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, 
                stroke:()=>{}, fill:()=>{}, arc:()=>{}, closePath:()=>{}, fillText:()=>{}, save:()=>{}, restore:()=>{}, 
                translate:()=>{}, setLineDash: ()=>{}, clearRect: ()=>{} , textAlign: ''
            })
        };
    };
    try {
        window.runArchitect();
        window.vizModeArch = 'corr';
        window.redrawCurrentBlueprint();
        console.log(`Corrector drawing OK for ${t}`);
    } catch(e) {
        console.error(`ERROR for ${t}:`, e.stack);
    }
});
