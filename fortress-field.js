// Visual enclosure only: the five existing gates remain the only wall targets.
(() => {
  window.fortressLayout = function(config) {
    const f=config.field.fortress;if(!f)return {segments:[],towers:[],gates:[]};
    const south=config.walls.filter(w=>w.lane==='south'),east=config.walls.filter(w=>w.lane==='east');
    const west=config.walls.find(w=>w.lane==='west');if(!south[1]||!east[1]||!west)return {segments:[],towers:[],gates:[]};
    const [s0,s1]=south,[e0,e1]=east,top=f.northY,left=west.x,right=e0.x,step=f.villageStepX,bottom=f.villageSouthY;
    const segments=[],towers=[];
    function line(axis,start,end,fixed,owner=null,gate=null){
      const add=(a,b)=>{if(b>a)segments.push({axis,start:a,end:b,fixed,owner:owner?.id||null});};
      if(gate){const art=window.ASSETS.walls[gate.lane],half=art.connectionHalf ?? (axis==='h'?art.width:art.height)/2-f.gateOverlap,center=axis==='h'?gate.x:gate.y;add(start,center-half);add(center+half,end);}
      else add(start,end);
    }
    line('h',left,right,top);line('v',top,bottom,right,e0,e0);
    line('h',step,right,bottom,e0);line('v',s0.y,bottom,step,s0);
    line('h',left,step,s0.y,s0,s0);line('v',top,s0.y,left,west,west);
    line('v',top,s1.y,e1.x,e1,e1);line('h',left,e1.x,s1.y,s1,s1);
    for(const [x,y,owner] of [[left,top,null],[right,top,e0],[right,bottom,e0],[step,bottom,e0],[step,s0.y,s0],[left,s0.y,s0],[e1.x,top,null],[e1.x,s1.y,e1],[left,s1.y,west]])towers.push({x,y,owner:owner?.id||null});
    return {segments,towers,gates:[s0,s1,e0,e1,west]};
  };
  window.fortressFootprint = function(config,x,y,padding=0){
    const layout=window.fortressLayout(config),f=config.field.fortress;if(!f)return false;
    return layout.segments.some(s=>s.axis==='h' ? x>=s.start-padding&&x<=s.end+padding&&Math.abs(y-s.fixed)<32+padding : y>=s.start-padding&&y<=s.end+padding&&Math.abs(x-s.fixed)<f.vertical.width/2+padding) ||
      layout.towers.some(t=>Math.abs(x-t.x)<f.tower.width/2+padding&&Math.abs(y-t.y)<f.tower.height/2+padding);
  };
  let surface,lastKey;
  window.drawFortressCurtains = function(ctx,config,walls){
    const f=config.field.fortress,A=window.ASSETS.fortress;if(!f||!A)return;
    const state=new Map(walls.map(w=>[w.id,w]));
    const image=(kind,wall)=>window.assetImage(wall?.hp<=0?A[kind].ruin:A[kind].levels[Math.min(2,Math.max(0,(wall?.level||1)-1))]);
    const key=walls.map(w=>`${w.id}:${w.level||1}:${w.hp<=0?'r':w.hp<=w.max/2?'d':'n'}`).join('|')+
      ['horizontal','vertical','tower'].flatMap(k=>[...A[k].levels,A[k].ruin]).map(src=>window.assetImage(src)?.naturalWidth||0).join(':');
    if(!surface||lastKey!==key){
      surface=document.createElement('canvas');surface.width=config.world.width;surface.height=config.world.height;
      const p=surface.getContext('2d');p.imageSmoothingEnabled=false;
      const layout=window.fortressLayout(config);
      for(const s of layout.segments){
        const wall=state.get(s.owner),kind=s.axis==='h'?'horizontal':'vertical',art=image(kind,wall),spec=f[kind],rubble=wall?.hp<=0;
        const height=kind==='horizontal'&&rubble?28:spec.height;
        const x=s.axis==='h'?s.start:s.fixed-spec.width/2,y=s.axis==='h'?s.fixed+spec.foot-height:s.start;
        const width=s.axis==='h'?s.end-s.start:spec.width,h=s.axis==='h'?height:s.end-s.start;
        p.fillStyle='#4b493b55';p.fillRect(x-6,y+height*.6,width+12,Math.max(12,h-height*.6));
        p.save();p.beginPath();p.rect(x,y,width,h);p.clip();
        const stride=(s.axis==='h'?spec.width:spec.height)-spec.overlap;
        for(let at=s.start;at<s.end;at+=stride){
          const px=s.axis==='h'?at:x,py=s.axis==='h'?y:at;
          if(art){
            const inset=A[kind].sourceInsetX || 0;
            p.drawImage(art,inset,0,art.naturalWidth-inset*2,art.naturalHeight,px,py,spec.width,height);
          }
          else{p.fillStyle=rubble?'#827b68':'#938d79';p.fillRect(px,py,spec.width,height);p.strokeStyle='#585648';p.strokeRect(px,py,spec.width,height);}
        }
        if(wall&&wall.hp>0&&wall.hp<=wall.max/2){
          p.strokeStyle='#453e32';p.lineWidth=2;
          for(let at=s.start+22;at<s.end;at+=67){const px=s.axis==='h'?at:x+20,py=s.axis==='h'?y+16:at;p.beginPath();p.moveTo(px,py);p.lineTo(px+6,py+7);p.lineTo(px+2,py+15);p.lineTo(px+8,py+22);p.stroke();}
        }
        p.restore();
      }
      for(const t of layout.towers){const wall=state.get(t.owner),art=image('tower',wall),height=wall?.hp<=0?76:f.tower.height;
        if(art)p.drawImage(art,t.x-f.tower.width/2,t.y+f.tower.foot-height,f.tower.width,height);
        else{p.fillStyle='#8b8776';p.fillRect(t.x-32,t.y-64,64,80);}
      }
      lastKey=key;
    }
    ctx.drawImage(surface,0,0);
  };
})();
