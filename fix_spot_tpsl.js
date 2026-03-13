const fs = require('fs');
const path = 'c:/Users/rexco/Downloads/triv/src/views/TradeView.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\{spotTPSL/g, '{(spotTPSL || [])');
fs.writeFileSync(path, content);
console.log('Fixed spotTPSL in TradeView.tsx');
