let w = 1000;
let h = 1000;
let ox = 0;
let oy = 0;
let s = 1;

function zoom(xs, ys, dY) {
    let old = s;
    s = s * (dY > 0 ? 0.9 : 1.1);
    let r = s / old;
    ox = xs - w/2 - (xs - w/2 - ox) * r;
    oy = ys - h/2 - (ys - h/2 - oy) * r;
}

// target point is (100, 100) screen
let pt_screen = {x: 100, y: 100};
let pt_model_x = (pt_screen.x - w/2 - ox) / s + w/2;
console.log("Model X under mouse: ", pt_model_x);

zoom(100, 100, -1);
console.log("Zooming in at 100, 100...");
console.log("New S:", s, " New Ox:", ox);

let new_screen_x = (pt_model_x - w/2) * s + w/2 + ox;
console.log("Screen X after zoom:", new_screen_x);
