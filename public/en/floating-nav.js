const header=document.querySelector('.topnav');
let pending=false;
const update=()=>{header.classList.toggle('is-scrolled',scrollY>40);pending=false};
addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update)}},{passive:true});update();
