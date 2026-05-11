const fs = require('fs');

const cssPath = 'c:/Users/Paul/Rescuenect/mobile/client/global.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace @theme rgb(var(...)) with var(...)
css = css.replace(/rgb\(var\((.*?)\)\)/g, 'var($1)');

// Replace RGB values with HEX values based on comments
// Example: --color-primary-500: 14 165 233; /* #0ea5e9 in RGB */
css = css.replace(/:\s*\d+\s+\d+\s+\d+\s*;\s*\/\*\s*(#[0-9a-fA-F]{6})\b[^*]*\*\//g, ': $1; /* $1 */');

// Also handle the case where it's not "in RGB" but just the hex
css = css.replace(/:\s*\d+\s+\d+\s+\d+\s*;\s*\/\*\s*(#[0-9a-fA-F]{6})\s*\*\//g, ': $1; /* $1 */');

// Fix HeroUI tokens
// --color-surface: 255 255 255; -> #ffffff
css = css.replace(/--color-surface:\s*255\s+255\s+255;/g, '--color-surface: #ffffff;');
css = css.replace(/--color-surface:\s*38\s+38\s+38;/g, '--color-surface: #262626;');
css = css.replace(/--color-accent-foreground:\s*255\s+255\s+255;/g, '--color-accent-foreground: #ffffff;');
css = css.replace(/--color-danger-foreground:\s*255\s+255\s+255;/g, '--color-danger-foreground: #ffffff;');

fs.writeFileSync(cssPath, css);
console.log('Done!');
