const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);
let jsCode = jsMatch[1];
// Mock redrawCurrentBlueprint so it doesn't crash
jsCode = jsCode.replace('window.redrawCurrentBlueprint();', '/* window.redrawCurrentBlueprint(); */');
jsCode = jsCode.replace('const rect = canvas.parentElement.getBoundingClientRect();', 'const rect = {width:800, height:600};');

const mJS = `
const THREE = {
  Scene: class { background = {} },
  PerspectiveCamera: class { constructor(){this.position={set:()=>{}};} updateProjectionMatrix(){} },
  WebGLRenderer: class { constructor(){this.domElement={};} setSize(){} setPixelRatio(){} render(){} },
  OrbitControls: class { update(){} },
  AmbientLight: class {}, DirectionalLight: class { constructor(){this.position={set:()=>{}};} }, PointLight: class { constructor(){this.position={set:()=>{}};} },
  Color: class {},
  Group: class { constructor(){this.position={set:()=>{}, z:0, y:0, x:0}; this.rotation={z:0, x:0, y:0}; this.scale={x:1, y:1, z:1};} add(){} },
  Vector2: class { constructor(x,y){this.x=x;this.y=y;} clone(){return this;} }, Vector3: class { constructor(x,y,z){} distanceTo(){return 1;} addVectors(){return this;} multiplyScalar(){return this;} },
  LatheGeometry: class { computeVertexNormals(){} }, CylinderGeometry: class {}, CircleGeometry: class {}, BoxGeometry: class {}, TorusGeometry: class {}, BufferGeometry: class { setFromPoints(){return this;} },
  MeshStandardMaterial: class {}, LineBasicMaterial: class {},
  Mesh: class { constructor(){this.position={set:()=>{}, copy:()=>{}, z:0, y:0, x:0}; this.rotation={z:0, x:0, y:0}; this.scale={x:1, y:1, z:1};} lookAt(){} rotateX(){} },
  LineSegments: class {},
  DoubleSide: 2
};

const window = {
    addEventListener: () => {},
    devicePixelRatio: 1,
    THREE: THREE
};
const document = {
    getElementById: (id) => {
        return {
            value: (id === 'an-diameter' || id === 'arch-d') ? '200' : 
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

${jsCode}

try {
    let type = document.getElementById('arch-type') ? document.getElementById('arch-type').value : 'newton';
    if (!window.runArchitect) throw new Error("runArchitect is undefined");
    window.runArchitect();
    window.updateArch3D();
    console.log("No error in 3D");
} catch(e) {
    console.error("ERROR IN 3D:", e.stack);
}
`;
fs.writeFileSync('test3d.js', mJS);
