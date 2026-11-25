(()=>{
 const menu=document.querySelector('#nav-switch'),nav=document.querySelector('#devnav');
 function close(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}
 menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))};
 document.addEventListener('click',e=>{if(!e.target.closest('.topnav'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();if(nav.contains(document.activeElement))menu.focus()}});
 const input=document.querySelector('#project-search'),buttons=[...document.querySelectorAll('[data-filter]')],cards=[...document.querySelectorAll('.directory-card')];let category='all';
 function update(){const q=input.value.trim().toLocaleLowerCase();let count=0;cards.forEach(card=>{const show=(category==='all'||card.dataset.category===category)&&card.textContent.toLocaleLowerCase().includes(q);card.hidden=!show;if(show)count++});document.querySelector('.empty').hidden=count>0;document.querySelector('.result-count').textContent=`${count} 个项目`;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)))}
 input.addEventListener('input',update);buttons.forEach(b=>b.onclick=()=>{category=b.dataset.filter;update()});update();
})();
