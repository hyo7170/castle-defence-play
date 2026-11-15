window.buildOnPlot = function(state, config, plotId, type) {
  const fail = reason => ({ok:false,reason});
  if (!['ready','settlement'].includes(state.phase)) return fail('건설은 준비 단계에서만 가능합니다.');
  const plot = config.construction.plots.find(p=>p.id===plotId);
  const stats = config.construction.buildings[type];
  if (!plot || !stats || !plot.allowed.includes(type)) return fail('이 부지에는 건설할 수 없습니다.');
  if (stats.unique && (state.buildings || []).some(b=>b.type===type)) return fail(`${stats.name}은(는) 하나만 지을 수 있습니다.`);
  if ((state.buildings || []).some(b=>b.plotId===plotId)) return fail('이미 건물이 있는 부지입니다.');
  if (!state.resources || Object.entries(stats.cost).some(([key,cost])=>!Number.isFinite(state.resources[key]) || state.resources[key]<cost))
    return fail('자원이 부족합니다.');
  // Validate every constraint before making any change.
  for (const [key,cost] of Object.entries(stats.cost)) state.resources[key]-=cost;
  state.buildings ||= [];
  state.buildings.push({plotId,type,lane:plot.lane,x:plot.x,y:plot.y,hp:stats.hp,cool:0,level:1,invested:{...stats.cost}});
  if(stats.trap)state.buildings[state.buildings.length-1].charges=stats.trap.charges;
  if(type==='mercenary'){const built=state.buildings[state.buildings.length-1];built.level=1;window.refreshMercenaries(state,config,built);}
  return {ok:true,reason:`${plotId}에 ${stats.name} 건설 완료`};
};

// The blocking fieldwork an enemy has to break next: the nearest one still ahead of it on its lane.
window.laneObstacle = function(state, config, enemy) {
  const info=config.lanes[enemy.lane];
  let best=null,bestGap=Infinity;
  for(const b of state.buildings||[]){
    if(b.hp<=0||b.lane!==enemy.lane||!config.construction.buildings[b.type].blocks)continue;
    const gap=(b[info.axis]-enemy[info.axis])*info.sign;
    if(gap>-config.fieldworks.standDistance-4&&gap<bestGap){best=b;bestGap=gap;}
  }
  return best;
};
window.advanceBuildings = function(state, config, dt) {
  const spent=[];
  for (const building of state.buildings || []) {
    if (building.hp<=0) continue;
    const stats=window.buildingStats(config,building);
    if(stats.trap){
      // Traps act on enemies crossing the site: within a shallow band along the lane, across the whole road.
      const info=config.lanes[building.lane],lateral=info.axis==='x'?'y':'x',rules=config.fieldworks;
      const power=window.researchBonus?.(state,config,'trapDamage')??1;
      const crossing=state.enemies.filter(e=>e.hp>0&&e.lane===building.lane&&Math.abs(e[info.axis]-building[info.axis])<=rules.triggerDepth&&
        Math.abs(e[lateral]-building[lateral])<=rules.lateralReach);
      if(stats.trap.radius){
        if(!crossing.length)continue;
        for(const enemy of state.enemies)if(enemy.hp>0&&Math.hypot(enemy.x-building.x,enemy.y-building.y)<=stats.trap.radius)
          enemy.hp=Math.max(0,enemy.hp-stats.trap.damage*power);
        window.addEffect?.(state,config,building,building,'mage',stats.trap.radius);
        building.charges=0;
      }else for(const enemy of crossing){
        if(building.charges<=0)break;
        if((enemy.trapsHit||(enemy.trapsHit=[])).includes(building.plotId))continue;
        enemy.trapsHit.push(building.plotId);
        enemy.hp=Math.max(0,enemy.hp-stats.trap.damage*power);
        enemy.slowUntil=state.timer+stats.trap.slowSeconds;enemy.slowFactor=stats.trap.slowFactor;
        building.charges--;
      }
      if(building.charges<=0)spent.push(building);
      continue;
    }
    if(stats.repairRate){
      for(const wall of state.walls){
        if(wall.hp<=0 || (config.lanes[building.lane] && wall.lane!==building.lane) ||
          Math.hypot(wall.x-building.x,wall.y-building.y)>stats.range)continue;
        const max=window.wallMaxHp(config,wall);
        wall.hp=Math.min(max,wall.hp+stats.repairRate*dt);
      }
      continue;
    }
    if(!stats.damage)continue;
    building.cool-=dt;
    if (building.cool>0) continue;
    const targets=state.enemies.filter(e=>e.hp>0 && Math.hypot(e.x-building.x,e.y-building.y)<=stats.range)
      .sort((a,b)=>Math.hypot(a.x-building.x,a.y-building.y)-Math.hypot(b.x-building.x,b.y-building.y));
    if (!targets.length) continue;
    const target=targets[0];
    for (const enemy of state.enemies) {
      if (enemy.hp>0 && (enemy===target || (stats.splash>0 && Math.hypot(enemy.x-target.x,enemy.y-target.y)<=stats.splash*(window.researchBonus?.(state,config,'splashRadius')??1))))
        enemy.hp=Math.max(0,enemy.hp-stats.damage*(window.researchBonus?.(state,config,stats.splash?'arcaneDamage':'towerDamage')??1));
    }
    window.addEffect?.(state,config,{x:building.x,y:building.y-40},target,building.type,stats.splash);
    building.cool=stats.interval;
  }
  // Spent traps leave their site free for a new one.
  if(spent.length)state.buildings=state.buildings.filter(b=>!spent.includes(b));
};

window.troopCapacity = function(state,config){
  const bonus=(state.buildings||[]).filter(b=>b.hp>0)
    .reduce((total,b)=>total+(window.buildingStats(config,b).troopCapacity||0),0);
  return Math.min(config.recruitment.maxCapacity,config.recruitment.baseCapacity+bonus+(state.capacityBonus||0));
};

window.recruitmentStatus = function(state,config,plotId,type,lane){
  const fail=reason=>({ok:false,reason});
  if(!['ready','settlement'].includes(state.phase))return fail('생산은 준비 단계에서만 가능합니다.');
  const barracks=(state.buildings||[]).find(b=>b.plotId===plotId && b.type==='barracks');
  if(!barracks || barracks.hp<=0)return fail('사용 가능한 병영이 없습니다.');
  if(!config.recruitment.types.includes(type) || !config.recruitment.lanes.includes(lane))return fail('지원하지 않는 병종 또는 전선입니다.');
  const alive=state.units.filter(u=>u.hp>0 && !config.units[u.type].hero);
  if(alive.length>=window.troopCapacity(state,config))return fail('전체 병력 한도에 도달했습니다.');
  const laneCapacity=lane==='central'?config.orders.reserveCapacity:config.recruitment.laneCapacity;
  if(alive.filter(u=>u.lane===lane).length>=laneCapacity)return fail('해당 전선의 병력 한도에 도달했습니다.');
  if(!Number.isFinite(state.resources?.gold) || state.resources.gold<config.units[type].cost)return fail('골드가 부족합니다.');
  return {ok:true,reason:''};
};

window.recruitUnit = function(state,config,plotId,type,lane){
  const status=window.recruitmentStatus(state,config,plotId,type,lane);
  if(!status.ok)return status;
  const postId=lane==='central'?'RESERVE':window.frontPost(state,lane);
  const slot=window.freeFormationSlot(state,config,postId,type);
  if(slot<0)return {ok:false,reason:'배치 가능한 자리가 없습니다.'};
  const post=window.unitPosts(state,config).find(p=>p.id===postId);
  const unit={type,lane,wallId:post.kind==='keep'?'KEEP':postId,formationSlot:slot,hp:config.units[type].hp,cool:0,
    ...window.unitDestination(config,post,type,slot)};
  state.resources.gold-=config.units[type].cost;
  state.units.push(unit);
  return {ok:true,reason:`${config.recruitment.names[type]} 생산 완료 · ${config.orders.laneNames[lane]} 배치`};
};

window.rewardBattle = function(state, config, deadEnemies, completed) {
  if (!state.resources) return;
  for (const enemy of deadEnemies) {
    const gold=config.economy.killGold[enemy.type] || 0;
    state.resources.gold+=gold;
    if(state.waveStats)state.waveStats.gold+=gold;
  }
  if (completed) {
    // Base supply plus the income of every surviving market and warehouse.
    const reward={...config.economy.waveReward};
    for(const building of (state.buildings||[]).filter(b=>b.hp>0))
      for(const [key,amount] of Object.entries(window.buildingStats(config,building).income||{}))reward[key]=(reward[key]||0)+amount;
    for (const [key,amount] of Object.entries(reward)) state.resources[key]+=amount;
    state.lastReward=reward;
  }
};

// Stats of a building at its current level.
window.buildingStats = function(config,building){
  const base=config.construction.buildings[building.type];
  return {...base,...((base.levels||[])[(building.level||1)-1]||{})};
};
window.buildingUpgradeCost = function(config,building){
  const base=config.construction.buildings[building.type], factor=config.construction.upgradeCostFactor[(building.level||1)-1];
  if(!base.levels || !factor || (building.level||1)>=base.levels.length)return null;
  return Object.fromEntries(Object.entries(base.cost).map(([key,value])=>[key,Math.ceil(value*factor)]));
};
// Upgrade, demolish or rebuild a building during preparation.
window.buildingActionStatus = function(state,config,plotId,action){
  const fail=reason=>({ok:false,reason});
  const building=(state.buildings||[]).find(b=>b.plotId===plotId);
  if(!building)return fail('건물이 없습니다.');
  if(!['ready','settlement'].includes(state.phase))return fail('준비 단계에서만 가능합니다.');
  const base=config.construction.buildings[building.type];
  const can=cost=>Object.entries(cost).every(([key,value])=>state.resources[key]>=value);
  if(action==='upgrade'){
    if(building.hp<=0)return fail('파괴된 건물은 먼저 재건해야 합니다.');
    const cost=window.buildingUpgradeCost(config,building);
    if(!cost)return fail(base.levels?'최고 단계입니다.':'강화할 수 없는 건물입니다.');
    if(!can(cost))return fail('자원이 부족합니다.');
    return {ok:true,reason:'',cost};
  }
  if(action==='rebuild'){
    if(building.hp>0)return fail('파괴된 건물만 재건할 수 있습니다.');
    if(!can(base.cost))return fail('자원이 부족합니다.');
    return {ok:true,reason:'',cost:base.cost};
  }
  if(action==='demolish'){
    if(building.type==='mercenary' && window.hiredHeroes?.(state,config).length)return fail('영웅을 고용한 용병소는 철거할 수 없습니다.');
    const refund=building.hp>0?Object.fromEntries(Object.entries(building.invested||base.cost)
      .map(([key,value])=>[key,Math.floor(value*config.construction.demolishRefund)])):{};
    return {ok:true,reason:'',refund};
  }
  return fail('지원하지 않는 명령입니다.');
};
window.buildingAction = function(state,config,plotId,action){
  const status=window.buildingActionStatus(state,config,plotId,action);
  if(!status.ok)return status;
  const building=state.buildings.find(b=>b.plotId===plotId), base=config.construction.buildings[building.type];
  building.invested ||= {...base.cost};
  if(action==='upgrade'){
    for(const [key,value] of Object.entries(status.cost)){state.resources[key]-=value;building.invested[key]=(building.invested[key]||0)+value;}
    building.level=(building.level||1)+1;
    return {ok:true,reason:`${base.name} Lv.${building.level} 강화 완료`};
  }
  if(action==='rebuild'){
    for(const [key,value] of Object.entries(status.cost))state.resources[key]-=value;
    Object.assign(building,{hp:base.hp,level:1,cool:0,invested:{...base.cost}});
    if(building.type==='mercenary')window.refreshMercenaries(state,config,building);
    return {ok:true,reason:`${base.name} 재건 완료`};
  }
  for(const [key,value] of Object.entries(status.refund))state.resources[key]+=value;
  state.buildings=state.buildings.filter(b=>b!==building);
  const text=Object.entries(status.refund).filter(([,value])=>value).map(([key,value])=>`${{gold:'골드',wood:'목재',stone:'석재'}[key]} ${value}`).join(' · ');
  return {ok:true,reason:`${base.name} 철거${text?` · 반환 ${text}`:''}`};
};
