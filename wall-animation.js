// Presentation only: HP0 already opens the gate and starts retreat in combat.
// These sprites never block, damage, delay progression or consume battle RNG.
(() => {
  const duration = s => s && s.frames > 0 && s.ms > 0 ? s.frames*s.ms/1000 : 0;
  window.createWallAnimator = function(config,assets){
    let records=new Map(),active=[],surface;
    const observe=state=>{for(const w of state.walls)if(!records.has(w.id))records.set(w.id,{hp:w.hp,stamp:w.visualCollapse||null});};
    const debris=wall=>{
      const layout=window.fortressLayout?.(config)||{segments:[],towers:[]},points=[];
      for(const s of layout.segments.filter(s=>s.owner===wall.id)){
        const count=Math.max(1,Math.ceil((s.end-s.start)/128));
        for(let i=0;i<count;i++){const at=s.start+(i+.5)*(s.end-s.start)/count;points.push({x:s.axis==='h'?at:s.fixed,y:s.axis==='h'?s.fixed:at});}
      }
      points.push(...layout.towers.filter(t=>t.owner===wall.id).map(t=>({x:t.x,y:t.y})));
      const limit=Math.max(0,Math.floor(assets.wallCollapse?.maxDebrisPerWall??12));
      return points.length<=limit?points:Array.from({length:limit},(_,i)=>points[Math.floor(i*points.length/limit)]);
    };
    return {
      get active(){return active;},get surface(){return surface;},
      clear(){records=new Map();active=[];},observe,
      update(state,dt,suspended=false){
        if(suspended||state.phase==='paused'||!Number.isFinite(dt)||dt<0)return;
        observe(state);for(const e of active)e.age+=dt;
        active=active.filter(e=>state.walls.some(w=>w.id===e.id&&w.hp<=0)&&e.age+1e-7<e.duration);
        for(const w of state.walls){
          const previous=records.get(w.id),stamp=w.visualCollapse,fresh=stamp&&stamp!==previous.stamp&&Number.isFinite(stamp.at)&&stamp.at<=state.timer;
          if(w.hp<=0&&(fresh||previous.hp>0)){
            const gate=assets.wallCollapse?.gates?.[w.lane],curtain=assets.wallCollapse?.curtain,length=Math.max(duration(gate),duration(curtain)),age=fresh?Math.max(0,state.timer-stamp.at):0;
            if(length&&age+1e-7<length){active=active.filter(e=>e.id!==w.id);active.push({id:w.id,lane:w.lane,x:w.x,y:w.y,level:w.level||1,age,duration:length,gate,curtain,points:debris(w)});}
          }
          previous.hp=w.hp;previous.stamp=stamp;
        }
        const limit=Math.max(0,Math.floor(assets.wallCollapse?.maxActiveWalls??config.walls.length));active=limit?active.slice(-limit):[];
      },
      draw(ctx){
        if(!active.length)return;
        if(!surface){surface=document.createElement('canvas');surface.width=config.world.width;surface.height=config.world.height;surface.getContext('2d').imageSmoothingEnabled=false;}
        const p=surface.getContext('2d');p.clearRect(0,0,surface.width,surface.height);
        const stamp=(sheet,age,x,y,opacity)=>{
          if(!duration(sheet))return;const sampled=window.sampleSpriteAnimation(sheet,age);if(sampled.done)return;
          const image=window.assetImage(sheet.src);if(!image||image.naturalWidth!==sheet.frameWidth*sheet.frames||image.naturalHeight!==sheet.frameHeight)return;
          p.globalAlpha=opacity;p.drawImage(image,sampled.frame*sheet.frameWidth,0,sheet.frameWidth,sheet.frameHeight,x+sheet.offsetX,y+sheet.offsetY,sheet.width,sheet.height);
        };
        for(const e of active){const fade=Math.min(1,Math.max(0,(e.duration-e.age)/(e.duration/3)));
          for(const point of e.points)stamp(e.curtain,e.age,point.x,point.y,fade*.85);stamp(e.gate,e.age,e.x,e.y,fade);
        }
        // Union of erased portal rectangles; overlapping south gates stay clear.
        // A single reused canvas avoids even-odd clip holes toggling each other.
        p.save();p.globalAlpha=1;p.globalCompositeOperation='destination-out';p.fillStyle='#000';
        const half=config.field.wallStyle.gate/2;
        for(const w of config.walls){const gate=assets.wallCollapse?.gates?.[w.lane],art=assets.walls[w.lane];
          if(config.lanes[w.lane].axis==='y'){const reach=Math.max(gate?.height||0,art?.height||0,assets.wallCollapse?.curtain?.height||0);p.fillRect(w.x-half,w.y-reach,half*2+1,reach*2);}
          else{const reach=Math.max(gate?.width||0,art?.width||0,assets.wallCollapse?.curtain?.width||0);p.fillRect(w.x-reach,w.y-half,reach*2,half*2+1);}
        }
        p.restore();ctx.save();ctx.globalAlpha=1;ctx.drawImage(surface,0,0);ctx.restore();
      }
    };
  };
})();
