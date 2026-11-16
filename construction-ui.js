window.createConstructionUI = function(canvas,config,getState,getView) {
  let selected=null, chosen=null, lastKey='', deployLane='south', armed=null, picking=null;
  const resources=document.createElement('span'); resources.id='resources';
  document.querySelector('#hud').insertBefore(resources,document.querySelector('#keep'));
  const panel=document.createElement('section');panel.id='construction-panel';panel.hidden=true;
  panel.setAttribute('aria-label','건설 부지');
  const header=document.createElement('div');header.className='construction-header';
  const title=document.createElement('strong');
  const closeButton=document.createElement('button');closeButton.textContent='닫기';closeButton.setAttribute('aria-label','건설 패널 닫기');
  header.append(title,closeButton);
  const info=document.createElement('p'), cards=document.createElement('div');cards.className='construction-cards';
  const confirm=document.createElement('button');confirm.textContent='건설 확정';
  const notice=document.createElement('p');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  panel.append(header,info,cards,confirm,notice);document.body.append(panel);
  function close(){selected=null;chosen=null;armed=null;picking=null;lastKey='';panel.hidden=true;notice.textContent='';}
  // Build menu: choose a building first, then the plots that can take it light up.
  const eligible=(state,type)=>window.plotList(state,config).filter(p=>p.allowed.includes(type)&&!state.buildings.some(b=>b.plotId===p.id));
  function pickType(type){close();picking=type;return eligible(getState(),type);}
  closeButton.onclick=close;
  function update() {
    const state=getState(), r=state.resources;
    // One span per resource so each can carry an icon; the visible text stays "골드 n · 목재 n · 석재 n".
    if(!resources.firstChild){
      for(const [i,key] of ['gold','wood','stone'].entries()){
        if(i)resources.append(' · ');
        const span=document.createElement('span');span.className='res';span.dataset.res=key;
        const icon=window.ASSETS.icons?.[key];
        if(icon){span.classList.add('has-icon');span.style.setProperty('--icon',`url("${icon}")`);}
        resources.append(span);
      }
    }
    for(const span of resources.querySelectorAll('.res')){
      const text=`${{gold:'골드',wood:'목재',stone:'석재'}[span.dataset.res]} ${r[span.dataset.res]}`;
      if(span.textContent!==text)span.textContent=text;
    }
    if(!selected)return;
    const building=state.buildings.find(b=>b.plotId===selected.id);
    const alive=state.units.filter(u=>u.hp>0 && !config.units[u.type].hero), capacity=window.troopCapacity(state,config);
    const heroes=window.hiredHeroes(state,config);
    const key=[selected.id,selected.x,selected.y,chosen,deployLane,state.phase,state.wave,r.gold,r.wood,r.stone,building?.hp,building?.type,alive.length,capacity,building?.level,building?.rerolled,(building?.candidates||[]).join(),heroes.map(u=>u.type+(u.hp>0)+(u.item||'')).join(),(state.research||[]).join()].join(':');
    if(key===lastKey)return; lastKey=key;
    title.textContent=selected.draft?`${selected.zone.name} · 새 자리`:`${selected.id} · ${building?'건물 정보':'건설 부지'}`;
    cards.replaceChildren();
    cards.classList.remove('recruitment-cards','mercenary-cards');panel.classList.remove('wide');
    confirm.hidden=Boolean(building);
    if(building){
      const stats=window.buildingStats(config,building);
      const manage=()=>{
        // Upgrade, rebuild and demolish are offered for every building.
        cards.classList.add(cards.classList.contains('mercenary-cards')?'mercenary-cards':'recruitment-cards');
        const add=(label,aria,action,detail)=>{
          const status=window.buildingActionStatus(state,config,selected.id,action);
          const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',aria);
          button.disabled=!status.ok;button.title=status.reason;
          const small=document.createElement('small');small.textContent=status.ok?detail(status):status.reason;button.append(document.createElement('br'),small);
          button.onclick=()=>{
            // Demolition needs a second tap so a slip does not destroy a building.
            if(action==='demolish'&&armed!==selected.id){armed=selected.id;notice.textContent='철거하려면 한 번 더 누르세요.';lastKey='';update();return;}
            armed=null;
            const result=window.buildingAction(getState(),config,selected.id,action);notice.textContent=result.reason;lastKey='';
            if(action==='demolish'&&result.ok){chosen=selected.allowed.find(type=>config.construction.buildings[type]);}update()};
          cards.append(button);
        };
        const text=cost=>Object.entries(cost).filter(([,v])=>v).map(([k,v])=>`${{gold:'골드',wood:'목재',stone:'석재'}[k]} ${v}`).join(' · ')||'반환 없음';
        if(building.hp<=0)add('재건','건물 재건','rebuild',s=>text(s.cost));
        else if(building.type!=='mercenary' && stats.levels && (building.level||1)<stats.levels.length)
          add(`Lv.${(building.level||1)+1} 강화`,'건물 강화','upgrade',s=>text(s.cost));
        add(armed===selected.id?'철거 확인':'철거','건물 철거','demolish',s=>building.hp>0?`반환 ${text(s.refund)}`:'잔해 정리');
      };
      info.textContent=`${stats.name} Lv.${building.level||1} · HP ${Math.ceil(building.hp)}/${stats.hp}${building.hp<=0?' · 파괴됨':''}`;
      if(stats.repairRate) info.textContent+=` · 인접 생존 성벽 초당 ${stats.repairRate}HP 회복`;
      if(stats.damage) info.textContent+=` · 공격 ${stats.damage} / ${stats.interval}초${stats.splash?' · 범위':''}`;
      if(stats.trap) info.textContent=`${stats.name} · 남은 횟수 ${building.charges} · ${stats.trap.radius?`밟으면 반경 ${stats.trap.radius}에 피해 ${stats.trap.damage}`:`지나가는 적에게 피해 ${stats.trap.damage}, ${stats.trap.slowSeconds}초간 둔화`}`;
      if(stats.blocks) info.textContent+=' · 적이 부숴야 지나갈 수 있습니다';
      if(stats.income) info.textContent+=` · 웨이브마다 ${Object.entries(stats.income).map(([k,v])=>`${{gold:'골드',wood:'목재',stone:'석재'}[k]} +${v}`).join(' · ')}`;
      if(stats.heal) info.textContent+=` · 정산 때 ${building.lane==='central'?'모든':'이 전선'} 병력 HP ${Math.round(stats.heal*100)}% 추가 회복`;
      if(building.type==='mercenary' && building.hp>0){
        const rules=config.mercenary, level=rules.levels[building.level-1];
        info.textContent=`용병소 Lv.${building.level} · 영웅 ${heroes.length}/${window.heroLimit(state,config)}명 · 배치: ${config.orders.laneNames[deployLane]}`;
        cards.classList.add('mercenary-cards');panel.classList.add('wide');
        const add=(label,aria,status,run,detail)=>{
          const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',aria);
          button.disabled=!status.ok;button.title=status.reason||detail||'';
          if(detail||!status.ok){const small=document.createElement('small');small.textContent=status.ok?detail:status.reason;button.append(document.createElement('br'),small);}
          button.onclick=()=>{const result=run();notice.textContent=result.reason;lastKey='';update()};cards.append(button);
        };
        for(const lane of config.recruitment.lanes){
          const button=document.createElement('button');button.textContent=`${config.orders.laneNames[lane]} 배치`;
          button.setAttribute('aria-pressed',String(deployLane===lane));
          button.onclick=()=>{deployLane=lane;notice.textContent='';lastKey='';update()};cards.append(button);
        }
        for(const type of building.candidates||[]){
          const hero=config.units[type];
          add(`${hero.name} 고용 · ${hero.cost}G`,`${hero.name} 고용`,window.mercenaryStatus(state,config,selected.id,'hire',type,deployLane),
            ()=>window.mercenaryAction(getState(),config,selected.id,'hire',type,deployLane),`${rules.gradeNames[hero.grade]} · ${hero.skill.name}: ${hero.skill.text}`);
        }
        for(const unit of heroes.filter(u=>u.hp<=0)){
          const hero=config.units[unit.type], gold=Math.ceil(hero.cost*rules.reviveFraction/10)*10;
          add(`${hero.name} 부활 · ${gold}G`,`${hero.name} 부활`,window.mercenaryStatus(state,config,selected.id,'revive',unit.type),
            ()=>window.mercenaryAction(getState(),config,selected.id,'revive',unit.type));
        }
        add(`재모집 · ${rules.rerollCost}G`,'용병 재모집',window.mercenaryStatus(state,config,selected.id,'reroll'),
          ()=>window.mercenaryAction(getState(),config,selected.id,'reroll'));
        const next=rules.levels[building.level];
        if(next)add(`Lv.${building.level+1} 강화 · ${next.cost.gold}G/목재 ${next.cost.wood}`,'용병소 강화',window.mercenaryStatus(state,config,selected.id,'upgrade'),
          ()=>window.mercenaryAction(getState(),config,selected.id,'upgrade'),`후보 ${next.candidates}명 · 영웅 한도 ${next.heroLimit}명`);
        if(!(building.candidates||[]).length && !notice.textContent)notice.textContent='고용할 수 있는 후보가 없습니다.';
        manage();return;
      }
      if(stats.lab && building.hp>0){
        // Research list, and at the smithy gear for each hired hero.
        const list=config.research[stats.lab]||[], doneCount=list.filter(r=>state.research.includes(r.id)).length;
        info.textContent=`${stats.name} · 연구 ${doneCount}/${list.length} · ${stats.text}`;
        cards.classList.add('mercenary-cards');panel.classList.add('wide');
        const add=(label,aria,status,run,detail)=>{
          const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',aria);button.disabled=!status.ok;
          const small=document.createElement('small');small.textContent=status.ok?detail:`${detail} · ${status.reason}`;button.append(document.createElement('br'),small);
          button.onclick=()=>{const result=run();notice.textContent=result.reason;lastKey='';update()};cards.append(button);
        };
        for(const r of list)add(`${r.name} · ${window.costText(r.cost)}`,`${r.name} 연구`,window.researchStatus(state,config,selected.id,r.id),
          ()=>window.doResearch(getState(),config,selected.id,r.id),r.text);
        if(stats.forge)for(const unit of heroes)for(const item of config.items)
          {add(`${config.units[unit.type].name}: ${item.name} · ${window.costText(item.cost)}`,`${config.units[unit.type].name} ${item.name} 제작`,
            window.craftStatus(state,config,selected.id,item.id,unit.type),()=>window.craftItem(getState(),config,selected.id,item.id,unit.type),item.text);
            const icon=window.ASSETS.items?.[item.id];
            if(icon){const img=document.createElement('img');img.src=icon;img.alt='';img.className='item-icon';cards.lastChild.prepend(img);}}
        if(stats.forge&&!heroes.length&&!notice.textContent)notice.textContent='영웅을 고용하면 여기서 장비를 만들 수 있습니다.';
        manage();return;
      }
      if(stats.troopCapacity){
        // Barracks raise the troop limit; troops are trained from the army panel.
        info.textContent+=` · 병력 한도 +${stats.troopCapacity} (지금 ${alive.length}/${capacity}) · 병사는 하단 '병력'에서 뽑습니다`;
      }
      manage();return;
    }
    const types=selected.allowed.filter(type=>config.construction.buildings[type]);
    for(const type of types){
      const button=document.createElement('button');button.textContent=config.construction.buildings[type].name;
      button.setAttribute('aria-pressed',String(type===chosen));
      button.onclick=()=>{chosen=type;notice.textContent='';update()};cards.append(button);
    }
    const stats=config.construction.buildings[chosen];
    if(!stats){info.textContent='이 부지의 시설은 다음 단계에서 추가됩니다.';confirm.hidden=true;return;}
    const cost=stats.cost;
    const preparing=['ready','settlement'].includes(state.phase);
    const affordable=Object.entries(cost).every(([key,value])=>r[key]>=value);
    const effect=stats.repairRate?`생존 성벽 ${stats.repairRate}HP/초 회복, 범위 ${stats.range}`:
      stats.lab?stats.text:
      stats.trap?(stats.trap.radius?`밟으면 폭발: 반경 ${stats.trap.radius}에 피해 ${stats.trap.damage} · 1회용`:`지나가는 적에게 피해 ${stats.trap.damage}와 ${stats.trap.slowSeconds}초 둔화 · ${stats.trap.charges}회`):
      stats.blocks&&!stats.damage?`적이 부숴야 지나갑니다 · HP ${stats.hp}`:
      stats.blocks?`길을 막고 화살을 쏩니다 · HP ${stats.hp} · 공격 ${stats.damage}, 사거리 ${stats.range}`:
      stats.troopCapacity?`병력 한도 +${stats.troopCapacity}`:
      chosen==='mercenary'?'영웅 후보 공개 및 고용 · 스킬은 전투 중 직접 사용':
      stats.income?`웨이브마다 ${Object.entries(stats.income).map(([k,v])=>`${{gold:'골드',wood:'목재',stone:'석재'}[k]} +${v}`).join(' · ')}`:
      stats.heal?`정산 때 병력 HP ${Math.round(stats.heal*100)}% 추가 회복`:
      `공격 ${stats.damage}, 사거리 ${stats.range}${stats.splash?' · 범위 피해':''}`;
    info.textContent=`${stats.name} · ${cost.gold}G / 목재 ${cost.wood} / 석재 ${cost.stone} · ${effect}`;
    confirm.disabled=!preparing||!affordable;
    if(!preparing) notice.textContent='건설은 준비 단계에서만 가능합니다.';
    else if(!affordable) notice.textContent='자원이 부족합니다.';
    else notice.textContent='';
    if(selected.draft){
      const status=window.placementStatus(state,config,chosen,selected.x,selected.y);
      if(!status.ok){confirm.disabled=true;notice.textContent=`${status.reason} 마당의 다른 곳을 눌러 보세요.`;}
      else if(preparing&&affordable)notice.textContent='이 자리에 짓습니다. 다른 곳을 누르면 자리가 옮겨집니다.';
    }
  }
  confirm.onclick=()=>{
    if(selected.draft){
      const result=window.placeBuilding(getState(),config,chosen,selected.x,selected.y);
      if(result.ok){selected=window.findPlot(getState(),config,result.plotId);picking=null;}
      notice.textContent=result.reason;lastKey='';update();return;
    }
    const result=window.buildOnPlot(getState(),config,selected.id,chosen);
    notice.textContent=result.reason;lastKey='';update();
  };
  const active=new Set();let tap=null;
  canvas.addEventListener('pointerdown',event=>{
    active.add(event.pointerId);
    tap=active.size===1?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
  });
  canvas.addEventListener('pointermove',event=>{
    if(tap && Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>config.construction.tapSlop)tap=null;
  });
  canvas.addEventListener('pointerup',event=>{
    active.delete(event.pointerId);const candidate=tap;tap=null;
    if(!candidate||candidate.id!==event.pointerId||active.size)return;
    const rect=canvas.getBoundingClientRect(),v=getView();
    const radius=Math.max(config.construction.minTapSize/2,config.construction.plotRadius*rect.height/v.h);
    const hit=window.plotList(getState(),config).map(plot=>({plot,distance:Math.hypot(
      rect.left+(plot.x-v.x)*rect.width/v.w-event.clientX,
      rect.top+(plot.y-v.y)*rect.height/v.h-event.clientY)}))
      .filter(p=>p.distance<=radius&&(!picking||p.plot.allowed.includes(picking)||getState().buildings.some(b=>b.plotId===p.plot.id)))
      .sort((a,b)=>a.distance-b.distance)[0];
    if(!hit){
      // While a building is being placed, a tap inside its zone opens a new site right there.
      if(!picking)return;
      const world={x:v.x+(event.clientX-rect.left)*v.w/rect.width,y:v.y+(event.clientY-rect.top)*v.h/rect.height};
      const status=window.placementStatus(getState(),config,picking,world.x,world.y);
      if(!status.zone)return;
      armed=null;chosen=picking;
      selected={id:'새 부지',draft:true,x:status.x,y:status.y,lane:status.zone.lane,zone:status.zone,allowed:[picking]};
      notice.textContent='';lastKey='';panel.hidden=false;update();
      document.dispatchEvent(new Event('construction-opened'));
      return;
    }
    armed=null;selected=hit.plot;chosen=picking&&selected.allowed.includes(picking)?picking:selected.allowed.find(type=>config.construction.buildings[type]);picking=null;
    deployLane=config.lanes[selected.lane]?selected.lane:'south';
    notice.textContent='';lastKey='';panel.hidden=false;update();
    document.dispatchEvent(new Event('construction-opened'));
  });
  const cancel=event=>{active.delete(event.pointerId);tap=null};
  canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
  function draw(ctx){
    const state=getState();ctx.save();
    const selectedBuilding=selected && state.buildings.find(b=>b.plotId===selected.id);
    const previewType=selectedBuilding?.type || chosen;
    if(selected && previewType && Number.isFinite(config.construction.buildings[previewType].range) &&
      (!selectedBuilding || selectedBuilding.hp>0) && ['ready','settlement'].includes(state.phase)){
      ctx.beginPath();ctx.arc(selected.x,selected.y,config.construction.buildings[previewType].range,0,Math.PI*2);
      ctx.fillStyle='#c9d99818';ctx.fill();ctx.strokeStyle='#c9d998';ctx.stroke();
    }
    for(const plot of window.plotList(state,config)){
      const building=state.buildings.find(b=>b.plotId===plot.id);
      ctx.textAlign='center';ctx.font='bold 15px sans-serif';
      if(!building){
        const usable=plot.allowed.some(type=>config.construction.buildings[type]);
        const hint=!usable?'준비 중':plot.allowed.includes('smithy')?'공방':plot.allowed.includes('outpost')?'전초':plot.allowed.includes('mine')?'함정':plot.allowed.includes('archerTower')?'탑':plot.allowed.includes('mercenary')?'본부':plot.allowed.includes('market')?'마을':'지원';
        const open=usable && ['ready','settlement'].includes(state.phase);
        ctx.globalAlpha=open?1:.55;
        // Field sites on the roads are smaller and only shown while preparing, so the lanes stay readable in battle.
        if(plot.field&&!open){ctx.globalAlpha=1;continue;}
        const half=plot.field?19:24;
        if(picking&&open){   // the chosen building's plots glow, the rest fade back
          if(plot.allowed.includes(picking)){const pulse=0.55+0.45*Math.sin(performance.now()/180);ctx.save();ctx.globalAlpha=pulse;ctx.strokeStyle='#ffd76a';ctx.lineWidth=5;ctx.strokeRect(plot.x-half-6,plot.y-half-6,half*2+12,half*2+12);ctx.restore();}
          else ctx.globalAlpha=.3;
        }
        ctx.fillStyle=selected?.id===plot.id?'#bdb07b':plot.field?'#5d4a3acc':'#726c4d';
        ctx.fillRect(plot.x-half,plot.y-half,half*2,half*2);ctx.strokeStyle=open?(plot.field?'#ffb84d':'#ffe9a8'):'#d1c398';ctx.setLineDash([5,4]);
        ctx.strokeRect(plot.x-half,plot.y-half,half*2,half*2);ctx.setLineDash([]);
        ctx.fillStyle='#fff1cd';
        ctx.font=`bold ${plot.field?12:usable?16:12}px sans-serif`;ctx.fillText(usable?`+${hint}`:hint,plot.x,plot.y+(plot.field?4:6));
        ctx.globalAlpha=1;ctx.font='bold 15px sans-serif';
      }
    }
    ctx.restore();
  }
  // One building, drawn by the game in depth order with soldiers and enemies.
  function drawBuilding(ctx,building){
    const plot=building;ctx.save();
    const stats=config.construction.buildings[building.type];
    const art=window.ASSETS.buildings[building.type];
    const image=art && window.assetImage(building.hp>0?(art.levels[(building.level||1)-1]||art.levels[art.levels.length-1]):art.ruin);
    if(image){
      ctx.drawImage(image,plot.x-art.width/2,plot.y+(art.foot??14)-art.height,art.width,art.height);
      const snow=window.ASSETS.snow?.buildings?.[building.type];
      if(snow&&building.hp>0&&(building.level||1)===snow.level)window.snowRoof?.(ctx,getState(),snow.src,plot.x-art.width/2,plot.y+(art.foot??14)-art.height,art.width,art.height);
    }else if(stats.fieldwork&&building.hp>0){
      // Placeholder fieldworks until art arrives.
      const x=plot.x,y=plot.y,b=(dx,dy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+dx,y+dy,w,h)};
      if(building.type==='spikes'){b(-34,4,68,6,'#3b3a36');for(let i=-30;i<=26;i+=8){b(i,-8,4,13,'#b9bbb2');b(i+1,-11,2,4,'#e2e4dc');}}
      else if(building.type==='mine'){ctx.fillStyle='#00000040';ctx.beginPath();ctx.ellipse(x,y+6,13,5,0,0,Math.PI*2);ctx.fill();b(-10,-6,20,12,'#3a3530');b(-7,-9,14,4,'#55504a');b(-2,-12,4,4,'#d2362a');}
      else if(building.type==='barricade'){b(-44,6,88,5,'#00000040');for(let i=-40;i<=32;i+=9){b(i,-22,7,30,'#7a5a3a');b(i,-26,7,5,'#c9a878');}b(-42,-10,84,4,'#5c432b');b(-42,0,84,4,'#5c432b');}
      else{b(-46,10,92,6,'#00000040');for(let i=-44;i<=36;i+=8){b(i,-26,7,36,'#6b5136');b(i,-30,7,5,'#b89668');}b(-16,-64,32,44,'#7b6a52');b(-20,-72,40,10,'#93805f');for(const i of[-20,-6,8])b(i,-80,10,9,'#93805f');b(-3,-52,6,14,'#23262b');b(18,-98,2,28,'#3a3530');b(20,-98,16,10,'#3f6fb5');}
    }else if(building.hp>0){
      ctx.fillStyle='#66665c';ctx.fillRect(plot.x-26,plot.y-38,52,52);
      ctx.fillStyle=stats.color;ctx.fillRect(plot.x-32,plot.y-56,64,22);
      ctx.fillStyle='#ded2b1';ctx.fillRect(plot.x-8,plot.y-24,16,20);
    }else{
      ctx.fillStyle='#625849';ctx.fillRect(plot.x-26,plot.y-10,18,18);ctx.fillRect(plot.x+2,plot.y-6,20,15);
    }
    // Bars sit just above the art, whatever its height.
    if(stats.trap){   // traps show remaining uses instead of an HP bar
      ctx.fillStyle='#172019cc';ctx.fillRect(plot.x-16,plot.y-30,32,14);ctx.fillStyle='#fff1cd';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
      ctx.fillText(`×${building.charges}`,plot.x,plot.y-19);ctx.restore();return;
    }
    const top=image?plot.y+(art.foot??14)-art.height-9:stats.fieldwork?plot.y-(building.type==='outpost'?90:40):plot.y-65;
    if(building.hp>0)for(let i=0;i<(building.level||1);i++){ctx.fillStyle='#ffd76a';ctx.fillRect(plot.x-22+i*10,top-9,7,7);}
    ctx.fillStyle='#3b302c';ctx.fillRect(plot.x-25,top,50,5);
    ctx.fillStyle='#aacd8a';ctx.fillRect(plot.x-25,top,50*building.hp/stats.hp,5);
    ctx.restore();
  }
  // Y of the building's base line, used for depth sorting.
  function buildingBase(building){const art=window.ASSETS.buildings[building.type];return building.y+(art?.foot??14);}
  // Zones and the new-site ghost go above the scene and the night, so they read clearly.
  function drawPlacement(ctx){
    const state=getState();ctx.save();
    const zoneType=picking||(selected?.draft&&chosen);
    if(zoneType&&['ready','settlement'].includes(state.phase)){
      // The zones that take the chosen building glow; the building can go anywhere inside.
      const pulse=0.75+0.25*Math.sin(performance.now()/220);
      for(const z of window.zonesFor(config,zoneType)){
        const pad=26;ctx.fillStyle='#ffd76a22';ctx.fillRect(z.x-pad,z.y-pad,z.w+pad*2,z.h+pad*2);
        ctx.save();ctx.globalAlpha=pulse;ctx.strokeStyle='#ffd76a';ctx.lineWidth=5;ctx.setLineDash([14,8]);
        ctx.strokeRect(z.x-pad,z.y-pad,z.w+pad*2,z.h+pad*2);ctx.restore();
        ctx.fillStyle='#fff1cd';ctx.font='bold 18px sans-serif';ctx.textAlign='left';ctx.fillText(z.name,z.x-pad+6,z.y-pad+16);
      }
    }
    if(selected?.draft){
      // The new site: where the building would stand, green if it fits.
      const ok=window.placementStatus(state,config,chosen,selected.x,selected.y).ok;
      const w=(config.construction.placement.footprint[chosen]||config.construction.placement.footprint.default);
      ctx.fillStyle=ok?'#7fd08a44':'#e0605044';ctx.fillRect(selected.x-w/2,selected.y-27,w,54);
      ctx.strokeStyle=ok?'#9fe0a8':'#f08070';ctx.lineWidth=3;ctx.strokeRect(selected.x-w/2,selected.y-27,w,54);ctx.lineWidth=1;
      const art=window.ASSETS.buildings[chosen], image=art&&window.assetImage(art.levels[0]);
      if(image){ctx.globalAlpha=.6;ctx.drawImage(image,selected.x-art.width/2,selected.y+(art.foot??14)-art.height,art.width,art.height);ctx.globalAlpha=1;}
    }
    ctx.restore();
  }
  function drawLabels(ctx){
    drawPlacement(ctx);
    ctx.save();ctx.textAlign='center';ctx.font='bold 15px sans-serif';
    for(const building of getState().buildings){
      const text=`${building.plotId} ${config.construction.buildings[building.type].name}${building.hp<=0?' (파괴)':''}`;
      const width=ctx.measureText(text).width+8;
      ctx.fillStyle='#172019dd';ctx.fillRect(building.x-width/2,building.y+20,width,19);
      ctx.fillStyle='#fff1cd';ctx.fillText(text,building.x,building.y+34);
    }
    ctx.restore();
  }
  return {update,draw,drawLabels,drawBuilding,buildingBase,close,pickType,eligible:type=>eligible(getState(),type),get picking(){return picking;},cancelPick(){picking=null;}};
};
