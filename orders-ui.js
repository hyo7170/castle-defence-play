window.createOrdersUI = function(config,getState,onOpen,canvas,getView){
  let source='RESERVE',destination='RESERVE',lastKey='';
  const panel=document.createElement('section');panel.id='orders-panel';panel.hidden=true;
  panel.setAttribute('aria-label','부대 지휘');
  const header=document.createElement('div');header.className='construction-header';
  const heading=document.createElement('strong');heading.textContent='부대 지휘';
  const close=document.createElement('button');close.textContent='닫기';close.setAttribute('aria-label','지휘 패널 닫기');
  header.append(heading,close);
  const sourceLabel=document.createElement('label');
  const select=document.createElement('select');select.setAttribute('aria-label','지휘할 부대');sourceLabel.append(select);
  const info=document.createElement('p');
  const targetLabel=document.createElement('label');targetLabel.textContent='준비 단계 배치 위치';
  const target=document.createElement('select');target.setAttribute('aria-label','배치 위치');targetLabel.append(target);
  const actions=document.createElement('div');actions.className='order-actions';
  const notice=document.createElement('p');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const hint=document.createElement('p');hint.textContent='증원은 중앙 예비대 전체를 보냅니다. 이동 중에는 공격하지 않으며 후퇴 중에는 적의 공격을 받지 않습니다.';
  const wallInfo=document.createElement('p');wallInfo.id='wall-info';wallInfo.hidden=true;
  panel.append(header,sourceLabel,info,wallInfo,targetLabel,actions,notice,hint);document.body.append(panel);
  const toggle=document.createElement('button');toggle.textContent='지휘';toggle.setAttribute('aria-expanded','false');
  document.querySelector('#controls').append(toggle);
  function hide(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');notice.textContent='';lastKey='';}
  close.onclick=hide;
  toggle.onclick=()=>{
    if(!panel.hidden){hide();return;}
    onOpen();panel.hidden=false;toggle.setAttribute('aria-expanded','true');lastKey='';update();
  };
  document.addEventListener('construction-opened',hide);
  // Tapping a wall on the battlefield opens its commands directly.
  if(canvas){
    const active=new Set();let tap=null;
    canvas.addEventListener('pointerdown',e=>{active.add(e.pointerId);tap=active.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;});
    canvas.addEventListener('pointermove',e=>{if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>config.construction.tapSlop)tap=null;});
    const cancel=e=>{active.delete(e.pointerId);tap=null};
    canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
    canvas.addEventListener('pointerup',e=>{
      active.delete(e.pointerId);const candidate=tap;tap=null;
      if(!candidate||candidate.id!==e.pointerId||active.size)return;
      const rect=canvas.getBoundingClientRect(),v=getView(),scale=rect.height/v.h;
      const x=v.x+(e.clientX-rect.left)/scale,y=v.y+(e.clientY-rect.top)/scale;
      const plotRadius=Math.max(config.construction.minTapSize/2/scale,config.construction.plotRadius);
      if(config.construction.plots.some(p=>Math.hypot(p.x-x,p.y-y)<=plotRadius))return;
      // A soldier under the finger selects his whole group.
      const reach=Math.max(config.construction.minTapSize/2/scale,28);
      const soldier=getState().units.filter(u=>u.hp>0&&Math.hypot(u.x-x,u.y-y)<=reach).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
      if(soldier){onOpen();source=window.unitPost(soldier);panel.hidden=false;toggle.setAttribute('aria-expanded','true');notice.textContent='';lastKey='';update();return;}
      const s=config.field.wallStyle,pad=Math.max(0,config.construction.minTapSize/2/scale-s.depth);
      const wall=getState().walls.find(w=>{const vertical=config.lanes[w.lane].axis==='y';const along=vertical?x-w.x:y-w.y,across=vertical?y-w.y:x-w.x;
        return Math.abs(along)<=s.length/2 && Math.abs(across)<=s.depth+pad;});
      if(!wall)return;
      onOpen();source=wall.id;panel.hidden=false;toggle.setAttribute('aria-expanded','true');notice.textContent='';lastKey='';update();
    });
  }
  select.onchange=()=>{source=select.value;notice.textContent='';lastKey='';update()};
  target.onchange=()=>{destination=target.value;notice.textContent='';lastKey='';update()};
  function update(){
    if(panel.hidden)return;
    const state=getState(),alive=state.units.filter(u=>u.hp>0);
    const key=JSON.stringify([state.phase,source,destination,state.walls.map(w=>w.hp>0),alive.map(u=>[
      window.unitPost(u),u.type,Boolean(u.retreat||u.movement),Boolean(u.holding)])]);
    const wall=state.walls.find(w=>w.id===source);
    const wallStatus=wall?['repair','rebuild','emergency','fortify'].map(a=>{const r=window.wallActionStatus(state,config,source,a);return [a,r.ok,r.ok?'':r.reason]}):[];
    wallInfo.hidden=!wall;
    if(wall){const text=`성벽 Lv.${wall.level||1} · HP ${Math.ceil(wall.hp)}/${window.wallMaxHp(config,wall)}${wall.hp<=0?' (붕괴)':''}`;
      if(wallInfo.textContent!==text)wallInfo.textContent=text;}
    const fullKey=key+JSON.stringify(wallStatus);
    if(fullKey===lastKey)return;lastKey=fullKey;
    const posts=window.unitPosts(state,config).filter(p=>p.kind!=='keep'||
      !state.walls.some(w=>w.lane===p.lane&&w.hp>0)||alive.some(u=>window.unitPost(u)===p.id));
    if(!posts.some(p=>p.id===source))source='RESERVE';
    select.replaceChildren();target.replaceChildren();
    for(const post of posts){
      const count=alive.filter(u=>window.unitPost(u)===post.id).length;
      const option=document.createElement('option');option.value=post.id;option.textContent=`${post.name} · ${count}명${post.available?'':' (붕괴)'}`;
      select.append(option);
      if(post.available){const dest=document.createElement('option');dest.value=post.id;dest.textContent=post.name;target.append(dest);}
    }
    select.value=source;
    if(!posts.some(p=>p.id===destination&&p.available))destination='RESERVE';
    target.value=destination;
    const group=alive.filter(u=>window.unitPost(u)===source), waiting=group.filter(u=>!u.retreat&&!u.movement);
    const reserve=alive.filter(u=>u.wallId==='RESERVE');
    info.textContent=`대기 ${waiting.length}명 / 이동 ${group.length-waiting.length}명 · 중앙 예비대 ${reserve.length}/${config.orders.reserveCapacity}명`;
    const preparing=['ready','settlement'].includes(state.phase);
    const enabled=preparing||state.phase==='combat';
    targetLabel.hidden=!preparing;actions.replaceChildren();
    function button(name,action){
      const b=document.createElement('button');b.textContent=name;b.disabled=!enabled;
      b.onclick=()=>{const result=action();notice.textContent=result.reason;lastKey='';update()};actions.append(b);
    }
    if(preparing)button('배치 실행',()=>window.issueGroupOrder(getState(),config,source,destination,'deploy'));
    button(waiting.length&&waiting.every(u=>u.holding)?'사수 해제':'사수',()=>window.holdGroup(getState(),config,source));
    if(!preparing){
      button('후퇴',()=>window.issueGroupOrder(getState(),config,source,null,'retreat'));
      for(const lane of window.laneList(config))
        button(`${config.lanes[lane].name} 증원`,()=>window.issueGroupOrder(getState(),config,'RESERVE',lane,'reinforce'));
    }
    if(wall){
      const rules=config.wallRepair, outer=state.walls.filter(w=>w.lane===wall.lane)[0]===wall;
      const fortifyCost=rules.fortify.cost[(wall.level||1)-1];
      const options=preparing?(wall.hp>0?[['repair',`성벽 수리 +${rules.step}`,rules.stepCost],...(fortifyCost?[['fortify',`성벽 강화 Lv.${(wall.level||1)+1}`,fortifyCost]]:[])]:[['rebuild','성벽 재건',rules.rebuild[outer?'outer':'inner']]]):
        [['emergency',`긴급 수리 +${rules.emergency.hp}`,rules.emergency.cost]];
      for(const [action,name,cost] of options){
        const status=wallStatus.find(s=>s[0]===action);
        button(name,()=>window.wallAction(getState(),config,source,action));
        const b=actions.lastChild;b.disabled=!status[1];b.title=status[2]||window.wallCostText(cost);
        b.setAttribute('aria-label',name.replace(/ \+\d+$/,'').replace(/ Lv\.\d$/,''));
        const small=document.createElement('small');small.textContent=status[1]?window.wallCostText(cost):status[2];b.append(document.createElement('br'),small);
      }
    }
  }
  function draw(ctx){
    const p=config.orders.reserve;ctx.save();ctx.strokeStyle='#9da991';ctx.setLineDash([6,6]);
    ctx.strokeRect(p.x-90,p.y-20,180,90);ctx.setLineDash([]);ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e1e6cb';
    ctx.fillText('중앙 예비대',p.x,p.y-28);ctx.restore();
  }
  return {update,close:hide,draw};
};
