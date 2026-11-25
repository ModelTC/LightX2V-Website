(()=>{
const root=document.querySelector('.lora-showcase');if(!root)return;
const en=document.documentElement.lang.startsWith('en');
const models=[
 ['MiniMax H3',en?'VIDEO':'视频生成','T2V / FL2V / REF2V'],
 ['Qwen Image',en?'IMAGE':'图像创作',en?'Image generation and editing':'图像生成与编辑'],
 ['Wan2.2-Distill',en?'VIDEO':'视频生成',en?'Distilled video generation':'蒸馏加速视频生成'],
 ['RelayVSR_X2',en?'RESTORATION':'画质修复',en?'Video super-resolution':'视频超分辨率']
];
const tabs=root.querySelector('.showcase-tabs'),video=root.querySelector('video'),empty=root.querySelector('.showcase-empty');
const image=root.querySelector('.showcase-image');image.src='/showcase-qwen-image.png';image.alt=en?'Qwen Image example: overhead workspace and illustrated object diagram':'Qwen Image 作品：俯拍工作空间与物件图解';image.loading='lazy';
video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');video.preload='auto';video.src='/showcase-minimax-h3-v2-web.mp4';video.poster='/showcase-minimax-h3-v2.jpg';
video.addEventListener('error',()=>{if(!video.hidden){empty.hidden=false;empty.querySelector('small').textContent=en?'Video unavailable. Please reload to retry.':'视频暂时无法加载，请刷新重试。'}});

const repo='https://github.com/ModelTC/LightX2V';
const t=(zh,enText)=>en?enText:zh;
let h3Case='FL2V';
const h3Clips={T2V:'minimax-t2v',FL2V:'minimax-h3-v2',REF2V:'minimax-ref2v-v2'};
function loadClip(clip){
 const src='/showcase-'+clip+'-web.mp4';
 if(video.getAttribute('src')===src)return;
 video.pause();empty.hidden=true;video.src=src;video.poster='/showcase-'+clip+'.jpg';video.muted=true;video.defaultMuted=true;video.load();
}
const specifications=[
 {url:'https://huggingface.co/lightx2v/Minimax-h3-Turbo',path:'minimax_h3',metric:'8',unit:t('步 · 本案例','STEPS · THIS CASE'),intro:t('8 步生成，音画同步。','8-step generation with synchronized audio.'),rows:[[t('29 → 8 步 · 减少约 72%','29 → 8 steps · ~72% fewer'),t('相对公开对比中的原版采样步数；并非端到端测速。','Versus the base model in the published comparison; not an end-to-end timing.')],[t('8 步 vs 29 步 · 画质对比','8 vs 29 steps · visual comparison'),t('v1.2 精选案例展示与原版的画面质量及提示词遵循对比。','Selected v1.2 examples compare visual quality and prompt adherence with the base model.')],[t('FP8 / INT8 · 量化部署','FP8 / INT8 · quantized deployment'),t('提供量化与 CPU 卸载配置；显存需求随分辨率和配置变化。','Quantized and CPU-offload configurations; VRAM needs vary with resolution and setup.')]],tags:['T2V','FL2V','REF2V']},
 {url:'https://huggingface.co/lightx2v/Qwen-Image-Lightning',path:'qwen_image',metric:'8',unit:t('步 · 仓库示例','STEPS · REPO EXAMPLE'),intro:t('蒸馏 LoRA，让图像生成更轻快。','Distilled LoRA for fewer-step image generation.'),rows:[['Lightning LoRA',t('在 Qwen-Image 基础模型上加载加速权重。','Load acceleration weights onto Qwen-Image.')],[t('示例设置','Example settings'),t('模型卡示例：1024 × 1024，CFG 1.0。','Model-card example: 1024 × 1024, CFG 1.0.')],[t('接入方式','Integration'),t('可用 Diffusers 推理，也可接入 LightX2V。','Run with Diffusers or integrate with LightX2V.')]],tags:['LoRA','Diffusers'],note:t('这里展示仓库能力，不代表这张图的实际生成参数。','Repository capabilities; not the settings used for this image.')},
 {url:'https://huggingface.co/lightx2v/Wan2.2-Distill-Models',path:'wan22',metric:'4',unit:t('步 · 蒸馏模型','STEPS · DISTILLED'),intro:t('更少采样步数，支持文生视频与图生视频。','Fewer sampling steps for text- and image-to-video.'),rows:[ [t('双噪声模型','Dual-noise models'),t('高噪声与低噪声权重配合，覆盖不同去噪阶段。','High- and low-noise weights cover different denoising stages.')],[t('精度可选','Precision options'),t('BF16，或 FP8 / INT8 量化权重。','BF16 or quantized FP8 / INT8 weights.')],[t('部署选择','Deployment'),t('支持 CPU 卸载；提供 RTX 4090 配置及 ComfyUI 工作流。','CPU offload, RTX 4090 configuration and a ComfyUI workflow.')]],tags:['BF16','FP8','INT8'],note:t('参数来自蒸馏模型卡，不代表当前视频的实测配置。','Specifications from the distilled model card, not measurements of this clip.')},
 {url:'https://huggingface.co/lightx2v/RelayVSR_X2',path:'relayvsr',metric:'2×',unit:t('原生超分辨率','NATIVE UPSCALING'),intro:t('放大画面，也让连续帧更稳定。','Upscale video with greater temporal consistency.'),rows:[[t('宽高各提升 2 倍','Twice the width and height'),t('固定 2× 超分，适合生成视频的后期增强。','Fixed 2× super-resolution for generated-video post-processing.')],[t('抑制时序闪烁','Temporal consistency'),t('减轻超分过程放大的帧间闪烁。','Alleviate temporal flicker amplified during upscaling.')],[t('仓库测试 · 45.44 FPS','Benchmark · 45.44 FPS'),t('单卡 H100 80GB，243 帧用时 5.348 秒。','Single H100 80GB; 243 frames in 5.348 seconds.')]],tags:['2×','LightX2V'],note:t('测试输入 1024 × 768，输出 2048 × 1536；预热后单次结果，非当前案例测速。','1024 × 768 input → 2048 × 1536 output. One warmed-up run, not a timing of this clip.')}

];
const specs=document.createElement('aside');specs.className='showcase-specs';specs.setAttribute('aria-label',t('模型能力与案例说明','Model capabilities and example details'));root.querySelector('.showcase-theater').append(specs);
function updateSpecs(i){
 const config={...specifications[i]};

 if(i===0&&h3Case==='REF2V'){
  config.url='https://huggingface.co/lightx2v/Minimax-H3-Turbo-Fusion';
  config.intro=t('8 步生成，多路融合。','8 steps. Fused adapters.');
  config.rows=[[t('29 → 8 步 · 减少约 72%','29 → 8 steps · ~72% fewer'),t('提供原版、Pika 与 Fusion 的同题视频对比。','Published side-by-side examples of the base model, Pika and Fusion.')],[t('3 → 1 · 单个 LoRA','3 → 1 · one LoRA'),t('融合 LightX2V、Pika 与 Larry 的适配器，无需运行时叠加。','Combines LightX2V, Pika and Larry adapters without runtime stacking.')],[t('Lite r32 · 97.80%','Lite r32 · 97.80%'),t('8 步轻量版保留 Full 更新的谱能量；这是权重统计，不是画质分数。','The 8-step Lite retains 97.80% of Full update spectral energy—a weight statistic, not a visual quality score.')]];
 }
 specs.replaceChildren();
 const metric=document.createElement('div');metric.className='spec-metric';
 const number=document.createElement('strong'),unit=document.createElement('span');number.textContent=config.metric;unit.textContent=config.unit;metric.append(number,unit);
 const intro=document.createElement('p');intro.className='spec-intro';intro.textContent=config.intro;
 const tags=document.createElement('div');tags.className='spec-tags';for(const value of config.tags){const tag=document.createElement(i===0?'button':'span');tag.textContent=value;
 if(i===0){tag.type='button';tag.dataset.mode=value;tag.setAttribute('aria-pressed',String(value===h3Case));tag.setAttribute('aria-label',t('查看 ','View ')+value+t(' 案例',' example'));tag.onclick=()=>{h3Case=value;loadClip(h3Clips[value]);updateSpecs(0);specs.querySelector('[data-mode="'+value+'"]').focus({preventScroll:true})}}
 tags.append(tag)}
 const list=document.createElement('dl');list.className='spec-readouts';
 for(const [label,value] of config.rows){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);list.append(row)}
 const eyebrow=document.createElement('span');eyebrow.className='spec-eyebrow';eyebrow.textContent=t('模型亮点','Model highlights');
 specs.append(eyebrow,metric,intro);
 if(i===0){const hint=document.createElement('p');hint.className='spec-switch-hint';hint.textContent=t('点击切换视频案例 ↓','Switch video example ↓');specs.append(hint);tags.setAttribute('role','group');tags.setAttribute('aria-label',t('视频案例','Video examples'))}
 specs.append(tags,list);
 if(i===0){const source=document.createElement('a');source.className='spec-evidence';source.href=h3Case==='REF2V'?config.url+'#ref2va-showcase':config.url+'#video-comparison';source.target='_blank';source.rel='noopener';source.textContent=t('查看画质对比与数据来源 ↗','View comparisons & sources ↗');specs.append(source)}
 if(config.note){const note=document.createElement('p');note.className='spec-note';note.textContent=config.note;specs.append(note)}
 const links=document.createElement('div');links.className='spec-links';
 for(const [label,url] of [[config.linkLabel||t('模型仓库 ↗','Model repository ↗'),config.url],[t('部署指南 ↗','Deployment ↗'),repo+'/tree/main/scripts/'+config.path]]){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener';if(url===config.url)a.className='spec-repository';links.append(a)}
 specs.append(links);
}
models.forEach(([name,category,description],i)=>{const b=document.createElement('button');b.type='button';const label=document.createElement('strong'),caption=document.createElement('span');label.textContent=name;caption.textContent=description;b.append(label,caption);b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>{tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));root.querySelector('h3').textContent=name;root.querySelector('.showcase-category').textContent=category;root.querySelector('.showcase-description').textContent=description;video.pause();const clip=i===3?'swiftvr':i===2?'wan22':h3Clips[h3Case];if(i!==1)loadClip(clip);video.hidden=i===1;image.hidden=i!==1;empty.hidden=true;updateSpecs(i);empty.querySelector('small').textContent=en?'Selected works coming soon':'精选作品即将上线'};tabs.append(b);if(i===0)b.click()});
const navigation=document.createElement('div');navigation.className='showcase-navigation';tabs.before(navigation);navigation.append(tabs);
const actions=document.createElement('div');actions.className='showcase-actions';
for(const [label,url,kind] of [[t('探索更多','Explore more'),'https://huggingface.co/lightx2v/models','explore'],[t('直接试用','Try Studio'),'https://x2v.light-ai.top/','studio']]){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.className='showcase-action '+kind;const text=document.createElement('span');text.textContent=label;const arrow=document.createElement('span');arrow.className='action-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';a.append(text,arrow);actions.append(a)}
navigation.append(actions);
})();
