(()=>{
const ns='http://www.w3.org/2000/svg';
function replace(node){
 if(node.nodeType!==3||!node.parentElement||node.parentElement.closest('script,style,svg,textarea,.ui-symbol'))return;
 const text=node.nodeValue;if(!/[↗▶⏸]/u.test(text))return;
 const fragment=document.createDocumentFragment();
 for(const part of text.split(/([↗▶⏸]\uFE0F?)/u)){
  if(part.startsWith('↗')){const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 20 20');svg.setAttribute('class','ui-arrow');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(ns,'path');path.setAttribute('d','M5 15 15 5M5 5h10v10');svg.append(path);fragment.append(svg)}
  else if(/^[▶⏸]/u.test(part)){const span=document.createElement('span');span.className='ui-symbol';span.textContent=part.replace(/\uFE0F/g,'')+'\uFE0E';fragment.append(span)}
  else fragment.append(document.createTextNode(part));
 }
 node.replaceWith(fragment);
}
function scan(root){if(root.nodeType===3)return replace(root);if(root.nodeType!==1)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(replace)}
scan(document.body);new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')replace(record.target);else record.addedNodes.forEach(scan)}}).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
