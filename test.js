const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const jsCode = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const window = {
    addEventListener: () => {},
    devicePixelRatio: 1,
    THREE: {
        Scene: class { add(){} },
        PerspectiveCamera: class { constructor(){this.position={set:()=>{}};} updateProjectionMatrix(){} },
        WebGLRenderer: class { constructor(){this.domElement={};} setSize(){} setPixelRatio(){} render(){} },
        OrbitControls: class { update(){} },
        AmbientLight: class {}, DirectionalLight: class { constructor(){this.position={set:()=>{}};} }, PointLight: class { constructor(){this.position={set:()=>{}};} },
        Color: class {},
        Group: class { constructor(){this.position={set:()=>{}, z:0, y:0, x:0}; this.rotation={z:0, x:0, y:0}; this.scale={x:1, y:1, z:1};} add(){} },
        Vector2: class { constructor(x,y){this.x=x;this.y=y;} clone(){return this;} }, Vector3: class { constructor(x,y,z){} distanceTo(){return 1;} addVectors(){return this;} multiplyScalar(){return this;} },
        LatheGeometry: class { constructor(pts){ this.pts = pts; } computeVertexNormals(){} }, CylinderGeometry: class {}, CircleGeometry: class {}, BoxGeometry: class {}, TorusGeometry: class {}, BufferGeometry: class { setFromPoints(){return this;} },
        MeshStandardMaterial: class {}, LineBasicMaterial: class {},
        Mesh: class { constructor(geo, mat){this.geo=geo; this.mat=mat; this.position={set:()=>{}, copy:()=>{}, z:0, y:0, x:0}; this.rotation={z:0, x:0, y:0}; this.scale={x:1, y:1, z:1};} lookAt(){} rotateX(){} },
        LineSegments: class {},
        DoubleSide: 2
    }
};

const document = {
    getElementById: (id) => {
        return {
            value: (id === 'arch-type') ? 'newton' :
                   (id === 'an-diameter' || id === 'arch-d') ? '200' : 
                   (id === 'arch-f1') ? '800' :
                   (id === 'arch-m') ? '3' :
                   (id === 'arch-sep') ? '600' :
                   (id === 'arch-b') ? '100' : '0',
            innerText: '',
            style: {},
            classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} },
            appendChild: ()=>{},
            offsetWidth: 800,
            offsetHeight: 600,
            parentElement: { getBoundingClientRect: () => ({width:800, height:600}) }
        };
    },
    createElement: () => ({ getContext: () => ({ scale:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{}, fill:()=>{}, arc:()=>{}, closePath:()=>{}, fillText:()=>{}, save:()=>{}, restore:()=>{}, translate:()=>{}, setLineDash: ()=>{} }), width: 800, height: 600 })
};

eval(jsCode.replace(/window\.redrawCurrentBlueprint\(\)/g, "null").replace(/window\.updateArch3D\(\)/g, "null"));

['newton', 'dk', 'rc', 'cassegrain', 'nasmyth', 'sct'].forEach(t => {
    document.getElementById = (id) => {
        return {
            value: (id === 'arch-type') ? t :
                   (id === 'an-diameter' || id === 'arch-d') ? '200' : 
                   (id === 'arch-f1') ? '800' :
                   (id === 'arch-m') ? '3' :
                   (id === 'arch-sep') ? '600' :
                   (id === 'arch-b') ? '100' : '0',
            innerText: '',
            style: {},
            classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} },
            appendChild: ()=>{},
            offsetWidth: 800,
            offsetHeight: 600,
            parentElement: { getBoundingClientRect: () => ({width:800, height:600}) }
        };
    };
    try {
        window.runArchitect();
        window.scenes = { arch: new window.THREE.Scene() };
        window.updateArch3D();
        console.log(`3D OK for ${t}`);
    } catch(e) {
        console.error(`ERROR for ${t}:`, e);
    }
});
