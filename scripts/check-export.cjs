const fs = require('fs');
const idx = fs.readFileSync('out/index.html', 'utf8');
console.log('--- index.html 跳转 ---');
const meta = idx.match(/<meta[^>]*refresh[^>]*>/i);
console.log(meta ? meta[0] : '(无 meta refresh)');
const canonical = idx.match(/href="([^"]*make-money[^"]*)"/);
console.log('canonical/链接:', canonical ? canonical[1] : '(无)');

const page = fs.readFileSync('out/make-money/index.html', 'utf8');
console.log('--- 资源路径 ---');
const css = page.match(/\/whatever\/_next\/[^"]*\.css/);
console.log('css:', css ? css[0] : '(未找到)');
const js = page.match(/\/whatever\/_next\/[^"]*\.js/);
console.log('js:', js ? js[0] : '(未找到)');
const bare = page.match(/[^a-zA-Z0-9.]\/_next/g);
console.log('裸 /_next 出现次数(应为0):', bare ? bare.length : 0);
