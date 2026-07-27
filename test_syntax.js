const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const jsCode = html.match(/<script>([\s\S]*?)<\/script>/)[1];
try {
    eval(jsCode);
    console.log("Syntax OK");
} catch(e) {
    if (e instanceof SyntaxError) {
        console.error("Syntax Error:", e);
    } else {
        console.log("Syntax OK (Runtime error expected due to missing DOM)");
    }
}
