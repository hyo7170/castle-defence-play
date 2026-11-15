// Maximum HP of a wall at its fortification level.
window.wallMaxHp = (config,wall) => Math.round(config.walls.find(w=>w.id===wall.id).hp * (config.wallRepair?.fortify?.hpFactor[(wall.level||1)-1] ?? 1) * (wall.hpFactor || 1));
// Lanes: list and geometry helpers. Lateral = the coordinate across the lane.
window.laneList = config => Object.keys(config.lanes);
window.laneLateral = (config,lane) => config.lanes[lane]?.axis === 'x' ? 'y' : 'x';
window.formationOf = (config,type) => config.units[type].formation || type;
window.unitPost = unit => unit.wallId==='KEEP' ? `KEEP:${unit.lane}` : unit.wallId;

window.unitPosts = function(state,config){
  return [
    ...state.walls.map(w=>({id:w.id,name:w.id,lane:w.lane,x:w.x,y:w.y,kind:'wall',available:w.hp>0})),
    {...config.orders.reserve,kind:'reserve',available:true},
    ...window.laneList(config).map(lane=>({id:`KEEP:${lane}`,name:`본관 ${config.orders.laneNames[lane]}`,lane,
      x:config.keep.x,y:config.keep.y,kind:'keep',available:state.keep>0}))
  ];
};

window.frontPost = function(state,lane){
  return state.walls.find(w=>w.lane===lane && w.hp>0)?.id || `KEEP:${lane}`;
};

window.freeFormationSlot = function(state,config,postId,type,exclude=[],planned=[]){
  const kind=window.formationOf(config,type);
  const used=state.units.filter(u=>u.hp>0 && !exclude.includes(u) && window.unitPost(u)===postId && window.formationOf(config,u.type)===kind)
    .map(u=>u.formationSlot||0);
  used.push(...planned.filter(p=>window.formationOf(config,p.type)===kind).map(p=>p.slot));
  return config.recruitment.formationOffsets.findIndex((_,index)=>!used.includes(index));
};

window.unitDestination = function(config,post,type,slot){
  const kind=window.formationOf(config,type);
  const offset=post.kind==='reserve'?config.orders.reserve.offsets[kind]:
    (post.kind==='keep'?config.combat.keepRetreatOffsets:config.combat.retreatOffsets)[post.lane][kind];
  const spread=config.recruitment.formationOffsets[slot];
  const lateral=window.laneLateral(config,post.lane);
  return {x:post.x+offset.x+(lateral==='x'?spread:0),y:post.y+offset.y+(lateral==='y'?spread:0)};
};

window.groupOrderPlan = function(state,config,source,target,kind='deploy'){
  const fail=reason=>({ok:false,reason});
  if(!['ready','settlement','combat'].includes(state.phase))return fail('현재 단계에서는 지휘할 수 없습니다.');
  const preparing=state.phase!=='combat';
  if(!['deploy','reinforce','retreat'].includes(kind))return fail('지원하지 않는 명령입니다.');
  if(kind==='deploy' && !preparing)return fail('자유 재배치는 준비 단계에서만 가능합니다.');
  const posts=window.unitPosts(state,config), from=posts.find(p=>p.id===source);
  if(!from)return fail('부대 위치가 올바르지 않습니다.');
  if(kind==='reinforce'){
    if(source!=='RESERVE' || !config.lanes[target])return fail('중앙 예비대에서 전선을 선택해 주세요.');
    target=window.frontPost(state,target);
  }
  if(kind==='retreat'){
    if(from.kind==='reserve')return fail('중앙 예비대는 이미 후방에 있습니다.');
    const walls=state.walls.filter(w=>w.lane===from.lane);
    const index=walls.findIndex(w=>w.id===source);
    target=index===0?(walls.slice(1).find(w=>w.hp>0)?.id || `KEEP:${from.lane}`):'RESERVE';
  }
  const post=posts.find(p=>p.id===target);
  if(!post || !post.available)return fail('이동할 방어선이 없거나 파괴되었습니다.');
  if(source===target)return fail('같은 위치입니다.');
  const group=state.units.filter(u=>u.hp>0 && window.unitPost(u)===source && !u.retreat && !u.movement);
  if(!group.length)return fail('명령할 대기 병력이 없습니다.');
  // Reserve places before movement starts: in-transit troops already count here.
  const others=state.units.filter(u=>u.hp>0 && !group.includes(u) && !config.units[u.type].hero);
  const capacity=post.kind==='reserve'?config.orders.reserveCapacity:config.recruitment.laneCapacity;
  const occupants=others.filter(u=>post.kind==='reserve'?window.unitPost(u)==='RESERVE':u.lane===post.lane);
  if(occupants.length+group.filter(u=>!config.units[u.type].hero).length>capacity)return fail('목적지의 병력 한도가 부족합니다.');
  const plans=[];
  for(const unit of group){
    const slot=window.freeFormationSlot(state,config,post.id,unit.type,group,plans);
    if(slot<0)return fail('목적지 진형에 빈자리가 없습니다.');
    plans.push({unit,type:unit.type,slot,to:window.unitDestination(config,post,unit.type,slot)});
  }
  const duration=preparing?0:(from.kind==='reserve'||post.kind==='reserve'?config.orders.reserveTransferSeconds:config.orders.wallTransferSeconds);
  return {ok:true,reason:'',post,plans,duration,kind};
};

window.issueGroupOrder = function(state,config,source,target,kind='deploy'){
  const plan=window.groupOrderPlan(state,config,source,target,kind);
  if(!plan.ok)return plan;
  for(const {unit,slot,to} of plan.plans){
    unit.lane=plan.post.lane;unit.wallId=plan.post.kind==='keep'?'KEEP':plan.post.id;
    unit.formationSlot=slot;unit.holding=false;
    if(!plan.duration){Object.assign(unit,to);continue;}
    const move={from:{x:unit.x,y:unit.y},to,elapsed:0,duration:plan.duration};
    if(kind==='retreat')unit.retreat=move;else unit.movement=move;
  }
  return {ok:true,reason:`${plan.plans.length}명 ${plan.post.name} ${plan.duration?'이동 시작':'배치 완료'}`};
};

window.holdGroup = function(state,config,source){
  if(!['ready','settlement','combat'].includes(state.phase))return {ok:false,reason:'현재 단계에서는 지휘할 수 없습니다.'};
  const group=state.units.filter(u=>u.hp>0 && window.unitPost(u)===source && !u.retreat && !u.movement);
  if(!group.length)return {ok:false,reason:'사수할 대기 병력이 없습니다.'};
  const holding=!group.every(u=>u.holding);
  group.forEach(u=>{u.holding=holding});
  return {ok:true,reason:holding?`사수: 방어력 ${Math.round((config.orders.holdDefenseFactor-1)*100)}% 증가`:'사수 해제'};
};
