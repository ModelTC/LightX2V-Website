import {cp, mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
const base='/LightX2V-Website/';
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){await walk(file);continue}if(!/\.(html|js|css)$/.test(file))continue;let text=await readFile(file,'utf8');
if(file.endsWith('.html')){
 text=text.replace(/<base\b[^>]*>/gi,'');
 text=text.replace(/(<head\b[^>]*>)/i,`$1<base href="${base}">`);
 if (/^(?:en\/)?(?:index|community|sparks)\.html$/.test(path.relative('dist',file))) text=text.replace(/(<base\b[^>]*>)/i,`$1<script src="${base}language-preference.js?v=2"></script>`);
 if(!/<base /i.test(text))text=text.replace(/(<html[^>]*>)/i,`$1<base href="${base}">`);
}
// Root-relative local URLs in markup, CSS and dynamic JavaScript assets.
text=text.replace(/((?:href|src|poster)=["'])\/(?!\/|LightX2V-Website\/)/g,`$1${base}`);
text=text.replace(/(["'`])\/(?=(?:en\/|showcase-|milestones\.en\.json))/g,`$1${base}`);
text=text.replace(/location\.origin\s*\+\s*['"]\/['"]/g,`location.origin+'${base}'`);
text=text.replace(/url\((["']?)\/(?!\/|LightX2V-Website\/)/g,`url($1${base}`);
text=text.replace(/href="\/LightX2V-Website\/(en\/)?(community|sparks)"/g,'href="/LightX2V-Website/$1$2.html"');
if(file.endsWith('.html')&&!/rel=["']icon/.test(text))text=text.replace(/(<base\b[^>]*>)/i,`$1<link rel="icon" href="${base}mark.svg">`);
await writeFile(file,text);
}}
await walk('dist');
await writeFile('dist/.nojekyll','');
// Preserve old clean URLs without depending on server rewrite rules.
for(const route of ['sparks','community','en/sparks','en/community']){await mkdir(`dist/${route}`,{recursive:true});await writeFile(`dist/${route}/index.html`,`<!doctype html><meta charset="utf-8"><script>location.replace(${JSON.stringify(base+route+'.html')}+location.search+location.hash)</script><a href="${base+route+'.html'}">Continue</a>`)}
await mkdir('_site',{recursive:true});await cp('dist',`_site${base}`,{recursive:true});
console.log(`Built dist for https://light-ai.top${base}`);
