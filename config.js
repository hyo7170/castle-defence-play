window.CONFIG = {
  "world": {
    "width": 1600,
    "height": 1200,
    "baseHeight": 540,
    "minZoom": 0.55,
    "maxZoom": 2,
    "zoom": 1.2,
    "zoomStep": 1.2
  },
  "keep": {
    "x": 530,
    "y": 310,
    "hp": 2000,
    "body": {
      "x": 450,
      "y": 220,
      "w": 160,
      "h": 130
    },
    "roof": {
      "x": 470,
      "y": 180,
      "w": 120,
      "h": 60
    },
    "label": {
      "x": 530,
      "y": 280
    }
  },
  "walls": [
    {
      "id": "남쪽 외벽",
      "lane": "south",
      "x": 530,
      "y": 780,
      "hp": 900
    },
    {
      "id": "남쪽 내벽",
      "lane": "south",
      "x": 530,
      "y": 560,
      "hp": 1200
    },
    {
      "id": "동쪽 외벽",
      "lane": "east",
      "x": 1190,
      "y": 310,
      "hp": 900
    },
    {
      "id": "동쪽 내벽",
      "lane": "east",
      "x": 870,
      "y": 310,
      "hp": 1200
    }
  ],
  "lanes": {
    "south": {
      "spawn": {
        "x": 530,
        "y": 1150
      }
    },
    "east": {
      "spawn": {
        "x": 1560,
        "y": 310
      }
    }
  },
  "enemies": {
    "goblin": {
      "hp": 100,
      "speed": 38,
      "damage": 14,
      "interval": 1.1,
      "color": "#91b65a",
      "size": 50
    },
    "orc": {
      "hp": 220,
      "speed": 25,
      "damage": 24,
      "interval": 1.3,
      "color": "#b87854",
      "size": 62
    },
    "wolf": {"name":"늑대","hp": 70,"speed": 72,"damage": 10,"interval": 0.8,"color": "#9aa0b5","size": 46},
    "golem": {"name":"공성 골렘","hp": 900,"speed": 16,"damage": 30,"interval": 1.6,"color": "#8d8478","size": 78,
      "wallDamage": 2,"ignoresDefenders": true}
  },
  "units": {
    "infantry": {
      "damage": 35,
      "range": 85,
      "interval": 0.8,
      "color": "#d6b46b",
      "hp": 400,
      "cost":70
    },
    "archer": {
      "damage": 27,
      "range": 270,
      "interval": 0.8,
      "color": "#78a9bc",
      "hp": 220,
      "cost":90
    },
    "mage": {"damage": 30,"range": 220,"interval": 1.6,"splash": 60,"color": "#d98a5a","hp": 180,"cost": 140}
  },
  "defenders": [
    {
      "type": "infantry",
      "x": 530,
      "y": 835,
      "wallId": "남쪽 외벽",
      "lane": "south"
    },
    {
      "type": "archer",
      "x": 410,
      "y": 625,
      "wallId": "남쪽 외벽",
      "lane": "south"
    },
    {
      "type": "infantry",
      "x": 1245,
      "y": 310,
      "wallId": "동쪽 외벽",
      "lane": "east"
    },
    {
      "type": "archer",
      "x": 1000,
      "y": 400,
      "wallId": "동쪽 외벽",
      "lane": "east"
    }
  ],
  "waves": [
    {
      "south": [
        [
          "goblin",
          8
        ],
        [
          "orc",
          2
        ]
      ],
      "east": [
        [
          "goblin",
          5
        ],
        [
          "orc",
          2
        ]
      ]
    },
    {
      "south": [
        [
          "goblin",
          12
        ],
        [
          "orc",
          5
        ]
      ],
      "east": [
        [
          "goblin",
          8
        ],
        [
          "orc",
          5
        ]
      ]
    },
    {"south": [["goblin",14],["wolf",8],["orc",6]], "east": [["goblin",10],["wolf",6],["orc",7]]},
    {"south": [["goblin",20],["wolf",10],["orc",10]], "east": [["goblin",12],["wolf",8],["orc",10]]},
    {"south": [["goblin",22],["orc",12],["golem",2]], "east": [["wolf",12],["orc",14],["golem",2]]},
    {"south": [["goblin",22],["wolf",13],["orc",16]], "east": [["wolf",10],["orc",17],["golem",1]]},
    {"south": [["goblin",32],["wolf",13],["orc",17]], "east": [["goblin",22],["wolf",10],["orc",17]]},
    {"south": [["goblin",17],["orc",17],["golem",5]], "east": [["wolf",10],["orc",17],["golem",5]]},
    {"south": [["goblin",32],["wolf",17],["orc",22],["golem",1]], "east": [["goblin",22],["wolf",16],["orc",22],["golem",1]]},
    {"south": [["goblin",26],["orc",22],["golem",3],["boss",1]], "east": [["wolf",17],["orc",22],["golem",3],["boss",1]]}
  ],
  "spawnInterval": 0.8,
  "field": {
    "river": {
      "y": 950,
      "height": 95,
      "color": "#386c78",
      "bank": "#747969",
      "ripple": "#60909a"
    },
    "bridge": {
      "x": 450,
      "width": 160,
      "rail": "#827969"
    },
    "waterSpacing": 80,
    "roads": [
      {
        "x": 450,
        "y": 300,
        "w": 160,
        "h": 800
      },
      {
        "x": 530,
        "y": 250,
        "w": 1070,
        "h": 120
      }
    ],
    "courtyards": [
      {
        "x": 360,
        "y": 140,
        "w": 340,
        "h": 340,
        "label": "중앙 마당"
      },
      {
        "x": 360,
        "y": 610,
        "w": 340,
        "h": 140,
        "label": "남쪽 군영"
      },
      {
        "x": 940,
        "y": 200,
        "w": 200,
        "h": 260,
        "label": "동쪽 군영"
      }
    ],
    "houses": [
      {
        "x": 300,
        "y": 370
      },
      {
        "x": 310,
        "y": 480
      },
      {
        "x": 710,
        "y": 440
      }
    ],
    "wallStyle": {
      "length": 260,
      "depth": 45,
      "gate": 76,
      "stone": "#97958a",
      "edge": "#555950",
      "roof": "#425a6a",
      "rubble": "#6d6657"
    },
    "grass": {
      "path": "assets/field/tiles/grass-v1.png",
      "tileSize": 256,
      "color": "#677644"
    },
    "southWallSprite": {
      "path": "assets/field/walls/stone-gate-south-v1.png",
      "width": 260,
      "height": 87,
      "top": -65
    }
  },
  "combat": {
    "engageRange": 80,
    "meleeDistance": 35,
    "gateDistance": 45,
    "collapseDamageFraction": 0.25,
    "retreatDuration": 4,
    "retreatOffsets": {
      "south": {
        "infantry": {
          "x": 0,
          "y": 55
        },
        "archer": {
          "x": -60,
          "y": -80
        },
        "mage": {"x": 60, "y": -110}
      },
      "east": {
        "infantry": {
          "x": 55,
          "y": 0
        },
        "archer": {
          "x": -100,
          "y": 55
        },
        "mage": {"x": -130, "y": -55}
      }
    },
    "gateSlotSpacing": 10,
    "maxAttackersPerDefender": 3,
    "gateOpening": 56,
    "effectSeconds": 0.45,
    "projectileSeconds": 0.16,
    "killMarkerSeconds": 0.9,
    "maxEffects": 140,
    "spawnSlots": 5,
    "spawnSlotSpacing": 16,
    "maxStep": 0.05,
    "maxFrameDelta": 0.25,
    "forcedAdvanceAfter": 150,
    "betweenWaveRecoveryFraction": 0.2,
    "keepRetreatOffsets": {
      "south": {
        "infantry": {
          "x": 0,
          "y": 95
        },
        "archer": {
          "x": -70,
          "y": 105
        },
        "mage": {"x": 70, "y": 120}
      },
      "east": {
        "infantry": {
          "x": 110,
          "y": 0
        },
        "archer": {
          "x": 100,
          "y": -70
        },
        "mage": {"x": 130, "y": 70}
      }
    }
  },
  "economy": {
    "initial": {"gold":650,"wood":140,"stone":80},
    "waveReward": {"gold":200,"wood":60,"stone":30},
    "killGold": {"goblin":2,"orc":4,"wolf":2,"golem":15,"boss":80}
  },
  "construction": {
    "plotRadius":32,
    "tapSlop":8,
    "minTapSize":44,
    "buildings": {
      "archerTower": {"name":"궁수탑","cost":{"gold":150,"wood":40,"stone":0},"hp":500,"damage":12,"interval":0.8,"range":300,"splash":0,"color":"#6a91ab"},
      "magicTower": {"name":"마법탑","cost":{"gold":220,"wood":30,"stone":25},"hp":450,"damage":25,"interval":1.6,"range":270,"splash":70,"color":"#aa84c0"},
      "barracks": {"name":"병영","cost":{"gold":200,"wood":60,"stone":0},"hp":650,"troopCapacity":4,"color":"#b78c58"},
      "repair": {"name":"수리소","cost":{"gold":130,"wood":30,"stone":40},"hp":450,"repairRate":2,"range":300,"color":"#809b80"}
    },
    "plots": [
      {"id":"S1","lane":"south","x":420,"y":720,"allowed":["archerTower","magicTower"]},
      {"id":"S2","lane":"south","x":640,"y":720,"allowed":["archerTower","magicTower"]},
      {"id":"S3","lane":"south","x":650,"y":630,"allowed":["barracks","repair","hospital"]},
      {"id":"E1","lane":"east","x":1120,"y":220,"allowed":["archerTower","magicTower"]},
      {"id":"E2","lane":"east","x":1120,"y":410,"allowed":["archerTower","magicTower"]},
      {"id":"E3","lane":"east","x":980,"y":450,"allowed":["barracks","repair","hospital"]},
      {"id":"C1","lane":"central","x":680,"y":320,"allowed":["barracks","repair","hospital","mercenary"]},
      {"id":"C2","lane":"central","x":745,"y":465,"allowed":["barracks","repair","hospital","mercenary"]},
      {"id":"V1","lane":"village","x":905,"y":640,"allowed":["market","warehouse"]},
      {"id":"V2","lane":"village","x":1015,"y":640,"allowed":["market","warehouse"]},
      {"id":"V3","lane":"village","x":905,"y":790,"allowed":["market","warehouse"]},
      {"id":"V4","lane":"village","x":1015,"y":790,"allowed":["market","warehouse"]}
    ]
  },
  "recruitment": {
    "baseCapacity":6,
    "maxCapacity":18,
    "laneCapacity":8,
    "types":["infantry","archer","mage"],
    "names":{"infantry":"보병","archer":"궁수","mage":"마법사"},
    "lanes":["south","east","central"],
    "formationOffsets":[0,-24,24,-48,48,-72,72,96]
  },
  "orders": {
    "reserve":{"id":"RESERVE","name":"중앙 예비대","lane":"central","x":530,"y":450,
      "offsets":{"infantry":{"x":0,"y":40},"archer":{"x":0,"y":0},"mage":{"x":12,"y":20}}},
    "reserveCapacity":6,
    "wallTransferSeconds":4,
    "reserveTransferSeconds":6,
    "holdDefenseFactor":1.2,
    "laneNames":{"south":"남쪽","east":"동쪽","central":"중앙 예비대"}
  },
  "camera": {
    "warningHpFraction": 0.3,
    "compactStart": {"maxHeight": 384, "x": 900, "y": 564, "zoom": 0.55},
    "start": {
      "x": 900,
      "y": 560,
      "zoom": 0.62
    },
    "presets": {
      "south": {
        "x": 530,
        "y": 780
      },
      "east": {
        "x": 1190,
        "y": 310
      },
      "keep": {
        "x": 530,
        "y": 310
      }
    }
  }
};
// Enemy display names used by reports.
window.CONFIG.enemies.goblin.name = "고블린";
window.CONFIG.enemies.orc.name = "오크";
// Heroes are units with their own stats; "formation" picks the shared formation row.
Object.assign(window.CONFIG.units, {
  "windArcher": {"hero": true, "name": "바람의 궁수", "grade": "rare", "cost": 270, "formation": "archer", "size": 64,
    "damage": 34, "range": 290, "interval": 0.7, "hp": 320, "color": "#9fe0d0",
    "skill": {"kind": "slow", "name": "돌풍", "duration": 6, "factor": 0.75, "text": "같은 전선의 적을 6초간 25% 둔화"}},
  "scaleKnight": {"hero": true, "name": "용린 수호기사", "grade": "rare", "cost": 270, "formation": "infantry", "size": 64,
    "damage": 45, "range": 85, "interval": 0.8, "hp": 800, "color": "#7fc9b1",
    "skill": {"kind": "guard", "name": "용린 방벽", "duration": 8, "factor": 0.5, "text": "8초간 같은 부대가 받는 피해 50% 감소"}},
  "stormMage": {"hero": true, "name": "폭풍의 마법사", "grade": "hero", "cost": 480, "formation": "mage", "size": 64,
    "damage": 40, "range": 240, "interval": 1.5, "splash": 70, "hp": 300, "color": "#8fb8ff",
    "skill": {"kind": "storm", "name": "번개 폭풍", "range": 320, "radius": 150, "damage": 120, "stun": 1, "text": "광역 피해 120과 1초 기절"}}
});
window.CONFIG.construction.buildings.mercenary = {"name": "용병소", "cost": {"gold": 180, "wood": 50, "stone": 0}, "hp": 500, "color": "#c9a24b"};
window.CONFIG.mercenary = {
  "gradeNames": {"rare": "희귀", "hero": "영웅"},
  "levels": [
    {"candidates": 2, "odds": {"rare": 100}, "heroLimit": 1},
    {"candidates": 3, "odds": {"rare": 60, "hero": 40}, "heroLimit": 2, "fromWave": 4, "cost": {"gold": 135, "wood": 38, "stone": 0}}
  ],
  "rerollCost": 60, "reviveFraction": 0.35, "skillCooldown": 40
};
window.CONFIG.wallRepair = {
  "step": 100, "stepCost": {"gold": 15, "stone": 5},
  "emergency": {"cost": {"gold": 25, "stone": 10}, "hp": 150, "cooldown": 30},
  "rebuild": {"outer": {"gold": 150, "stone": 40}, "inner": {"gold": 220, "stone": 60}},
  "rebuildFraction": 0.6,
  "fortify": {"hpFactor": [1, 1.5, 2], "cost": [{"gold": 120, "stone": 50}, {"gold": 200, "stone": 90}]}
};
window.CONFIG.scouting = {"volume": [[12,"적음"],[22,"보통"],[Infinity,"많음"]], "siege": [[0,"없음"],[2,"주의"],[Infinity,"높음"]]};

// Map dressing: the south-east quarter is the village with farmland, and the
// surface extends past the world so wide screens never show blank margins.
Object.assign(window.CONFIG.field, {
  "margin": {"x": 420, "y": 240},
  "scatter": 70,
  "ponds": [{"x": 1385, "y": 500, "rx": 62, "ry": 30}, {"x": 215, "y": 700, "rx": 46, "ry": 24}],
  "farms": [
    {"x": 1150, "y": 590, "w": 190, "h": 110, "colors": ["#b9a24c", "#a8923f", "#e3cf74"]},
    {"x": 1370, "y": 590, "w": 180, "h": 110, "colors": ["#7d9a45", "#6f8b3c", "#a9c66a"]},
    {"x": 1150, "y": 740, "w": 400, "h": 110, "colors": ["#8f7a4b", "#806c40", "#c5ad6e"]}
  ],
  "forests": [
    {"x": 1210, "y": 395, "w": 120, "h": 60}, {"x": 1470, "y": 400, "w": 130, "h": 120},
    {"x": 760, "y": 560, "w": 70, "h": 40, "density": 0.7}, {"x": 115, "y": 770, "w": 230, "h": 100},
    {"x": 110, "y": 560, "w": 60, "h": 90, "density": 0.7}, {"x": 715, "y": 835, "w": 60, "h": 40, "density": 0.7},
    {"x": 760, "y": 110, "w": 780, "h": 70, "density": 0.6}
  ]
});
window.CONFIG.field.roads.push({"x": 610, "y": 695, "w": 520, "h": 44});
window.CONFIG.field.houses.push(
  {"x": 820, "y": 665, "roof": "#7a4a3a"}, {"x": 1090, "y": 660, "roof": "#5a5f7a"},
  {"x": 820, "y": 815}, {"x": 1090, "y": 815, "roof": "#7a4a3a"}, {"x": 960, "y": 860, "roof": "#5a5f7a"},
  {"x": 250, "y": 560, "roof": "#5a5f7a"});

// Economy and support buildings, building levels (GDD 4.1-4.2).
Object.assign(window.CONFIG.construction.buildings, {
  "market": {"name": "시장", "cost": {"gold": 120, "wood": 40, "stone": 0}, "hp": 400, "color": "#d9a441", "income": {"gold": 50},
    "levels": [{}, {"income": {"gold": 85}}, {"income": {"gold": 120}}]},
  "warehouse": {"name": "보급창고", "cost": {"gold": 120, "wood": 35, "stone": 15}, "hp": 400, "color": "#9a7b55", "income": {"wood": 15, "stone": 10},
    "levels": [{}, {"income": {"wood": 25, "stone": 15}}, {"income": {"wood": 35, "stone": 20}}]},
  "hospital": {"name": "치료소", "cost": {"gold": 180, "wood": 45, "stone": 20}, "hp": 450, "color": "#d7dfe6", "heal": 0.15,
    "levels": [{}, {"heal": 0.25}, {"heal": 0.35}]}
});
window.CONFIG.construction.buildings.archerTower.levels = [{}, {"damage": 18}, {"damage": 24, "interval": 0.65}];
window.CONFIG.construction.buildings.magicTower.levels = [{}, {"damage": 33}, {"damage": 42, "splash": 77}];
window.CONFIG.construction.buildings.barracks.levels = [{}, {"troopCapacity": 6}, {"troopCapacity": 8}];
window.CONFIG.construction.buildings.repair.levels = [{}, {"repairRate": 3}, {"repairRate": 4}];
window.CONFIG.construction.upgradeCostFactor = [0.75, 1.1];
window.CONFIG.construction.demolishRefund = 0.7;

// Final-wave boss: slow, very tough, strikes every defender near its target.
window.CONFIG.enemies.boss = {"name": "황혼의 성문장", "hp": 3200, "speed": 15, "damage": 55, "interval": 1.5, "color": "#7b4b8a", "size": 96,
  "wallDamage": 2, "cleave": 70};

// ---- Third front: the western postern, a raid lane that opens late ----
// axis: the coordinate enemies travel along; sign: direction of travel on it.
Object.assign(window.CONFIG.lanes.south, {"axis": "y", "sign": -1, "name": "남쪽"});
Object.assign(window.CONFIG.lanes.east, {"axis": "x", "sign": -1, "name": "동쪽"});
window.CONFIG.lanes.west = {"spawn": {"x": -180, "y": 310}, "axis": "x", "sign": 1, "name": "서쪽", "raid": true};
window.CONFIG.walls.push({"id": "서쪽 암문", "lane": "west", "x": 250, "y": 310, "hp": 700});
window.CONFIG.combat.retreatOffsets.west = {"infantry": {"x": -55, "y": 0}, "archer": {"x": 75, "y": -60}, "mage": {"x": 95, "y": 60}};
window.CONFIG.combat.keepRetreatOffsets.west = {"infantry": {"x": -110, "y": 0}, "archer": {"x": -100, "y": 75}, "mage": {"x": -130, "y": -75}};
window.CONFIG.recruitment.lanes = ["south", "east", "west", "central"];
window.CONFIG.orders.laneNames.west = "서쪽";
window.CONFIG.camera.presets.west = {"x": 250, "y": 310};
window.CONFIG.construction.plots.push(
  {"id": "W1", "lane": "west", "x": 355, "y": 195, "allowed": ["archerTower", "magicTower"]},
  {"id": "W2", "lane": "west", "x": 355, "y": 425, "allowed": ["archerTower", "magicTower"]});
// Raids: fast, light enemies only. Wave numbers are 1-based keys.
window.CONFIG.waves[6].west = [["wolf",16], ["goblin",16]];
window.CONFIG.waves[8].west = [["wolf",22], ["goblin",18], ["orc",6]];
window.CONFIG.scouting.omens = {
  "5": "서쪽 절벽에서 굴 파는 소리가 들립니다",
  "6": "서쪽 암문 밖에 발자국이 늘었습니다 — 다음 웨이브에 서쪽 기습이 예상됩니다"
};
// West road through the cliffs, and houses moved clear of the postern.
window.CONFIG.field.roads.push({"x": -420, "y": 250, "w": 780, "h": 120});
Object.assign(window.CONFIG.field.houses[0], {"x": 190, "y": 490});
Object.assign(window.CONFIG.field.houses[1], {"x": 345, "y": 535});
Object.assign(window.CONFIG.field.houses[window.CONFIG.field.houses.length - 1], {"x": 265, "y": 590});
// ---- Dark-fantasy direction: calendar, weather, the long night, and hope ----
// One wave per month. "darkness" is how much of the field the night swallows (0-1).
window.CONFIG.calendar = {"era": "왕국력", "year": 323, "month": 1,
  "weatherNames": {"clear": "맑음", "snow": "눈", "rain": "비", "storm": "폭풍우", "fog": "안개", "ash": "재"},
  "months": [
    {"weather": "snow", "darkness": 0.2}, {"weather": "snow", "darkness": 0.28}, {"weather": "rain", "darkness": 0.34},
    {"weather": "fog", "darkness": 0.42}, {"weather": "clear", "darkness": 0.48}, {"weather": "rain", "darkness": 0.55},
    {"weather": "storm", "darkness": 0.62}, {"weather": "ash", "darkness": 0.66}, {"weather": "rain", "darkness": 0.72},
    {"weather": "snow", "darkness": 0.8}
  ]};
window.CONFIG.hope = {"start": 30, "max": 100, "waveCleared": 8, "flawless": 5, "wallLost": -10, "unitLost": -1,
  "keepStep": 200, "keepLoss": -3,
  "tiers": [
    {"min": 0, "name": "꺼져 가는 불", "recovery": 0.5},
    {"min": 30, "name": "버티는 불"},
    {"min": 60, "name": "타오르는 불", "attackSpeed": 1.1},
    {"min": 85, "name": "꺼지지 않는 불", "attackSpeed": 1.1, "recoveryBonus": 0.1}
  ],
  "beacon": {"cost": 20, "heal": 0.2, "seconds": 20}};
// Light radii in world pixels for the night rendering.
window.CONFIG.lights = {"keep": 250, "keepPerTier": 45, "gate": 170, "tower": 120, "building": 130, "lantern": 85, "unit": 62, "house": 70, "beaconBoost": 0.25};
// ---- The lord's decisions: one event between months ----
// options: resources (negative = cost), hope, capacity, revive, wallHeal, allWallsHeal, recruits.
window.CONFIG.decisions = [
  {"id": "refugees", "title": "성문 앞의 피난민", "text": "잿더미가 된 마을에서 온 사람들이 문을 두드립니다.",
    "options": [{"label": "받아들인다", "resources": {"gold": -60}, "hope": 10, "capacity": 1}, {"label": "돌려보낸다", "hope": -6}]},
  {"id": "wounded", "title": "부상병의 청원", "text": "쓰러졌던 병사가 다시 싸우게 해 달라고 청합니다.", "needs": "fallen",
    "options": [{"label": "치료한다", "resources": {"gold": -40}, "revive": 1}, {"label": "쉬게 둔다", "hope": 2}]},
  {"id": "merchant", "title": "상인의 마지막 수레", "text": "길이 끊기기 전 마지막 수레가 도착했습니다.",
    "options": [{"label": "물자를 산다", "resources": {"gold": -120, "wood": 80, "stone": 40}}, {"label": "호위해 보낸다", "hope": 5}]},
  {"id": "vigil", "title": "밤의 기도", "text": "사람들이 성화 아래 모여 밤을 새우려 합니다.",
    "options": [{"label": "함께한다", "resources": {"gold": -30}, "hope": 12}, {"label": "성벽을 돈다", "wallHeal": 200}]},
  {"id": "deserter", "title": "붙잡힌 탈영병", "text": "달아나던 병사가 붙잡혀 왔습니다.",
    "options": [{"label": "용서한다", "hope": 4, "recruits": ["infantry"]}, {"label": "벌금을 물린다", "resources": {"gold": 60}, "hope": -8}]},
  {"id": "tithe", "title": "겨울 세금", "text": "창고가 비어 갑니다. 마을에서 더 걷을 수 있습니다.",
    "options": [{"label": "걷는다", "resources": {"gold": 120}, "hope": -7}, {"label": "면제한다", "hope": 6}]},
  {"id": "mason", "title": "늙은 석공", "text": "떠돌이 석공이 성문을 손봐 주겠다고 합니다.", "needs": "damagedWall",
    "options": [{"label": "삯을 준다", "resources": {"gold": -80}, "allWallsHeal": 150}, {"label": "돌만 받는다", "resources": {"stone": 30}}]},
  {"id": "lanterns", "title": "아이들의 등불", "text": "아이들이 등불을 만들어 성벽에 걸고 싶어 합니다.",
    "options": [{"label": "장작을 내준다", "resources": {"wood": -30}, "hope": 9}, {"label": "장작을 아낀다", "resources": {"wood": 20}, "hope": -3}]},
  {"id": "freeCompany", "title": "떠돌이 용병단", "text": "갈 곳 없는 용병들이 일자리를 찾습니다.",
    "options": [{"label": "고용한다", "resources": {"gold": -150}, "recruits": ["infantry", "archer"]}, {"label": "거절한다"}]},
  {"id": "relic", "title": "폐허에서 찾은 성물", "text": "순찰대가 오래된 성물을 가져왔습니다.",
    "options": [{"label": "예배당에 모신다", "hope": 8}, {"label": "판다", "resources": {"gold": 150}, "hope": -5}]}
];
// ---- Fieldworks: traps and forward bases on fixed sites along the approach roads ----
// trap: triggers on enemies crossing the site; blocks: enemies must break it before they pass.
Object.assign(window.CONFIG.construction.buildings, {
  "spikes": {"name": "가시 함정", "fieldwork": true, "cost": {"gold": 40, "wood": 10, "stone": 0}, "hp": 1, "color": "#8d8f86",
    "trap": {"damage": 30, "slowFactor": 0.6, "slowSeconds": 3, "charges": 25}},
  "mine": {"name": "지뢰", "fieldwork": true, "cost": {"gold": 60, "wood": 0, "stone": 10}, "hp": 1, "color": "#3a3530",
    "trap": {"damage": 160, "radius": 90, "charges": 1}},
  "barricade": {"name": "목책", "fieldwork": true, "blocks": true, "cost": {"gold": 50, "wood": 30, "stone": 0}, "hp": 350, "color": "#7a5a3a"},
  "outpost": {"name": "전진기지", "fieldwork": true, "blocks": true, "cost": {"gold": 220, "wood": 80, "stone": 30}, "hp": 800, "color": "#6a7f95",
    "damage": 16, "interval": 0.8, "range": 280, "splash": 0, "levels": [{}, {"damage": 24}, {"damage": 32}]}
});
window.CONFIG.construction.plots.push(
  {"id": "TS1", "lane": "south", "field": true, "x": 530, "y": 890, "allowed": ["spikes", "mine", "barricade"]},
  {"id": "TS2", "lane": "south", "field": true, "x": 530, "y": 975, "allowed": ["spikes", "mine", "barricade"]},
  {"id": "OS", "lane": "south", "field": true, "x": 530, "y": 1112, "allowed": ["outpost", "barricade"]},
  {"id": "TE1", "lane": "east", "field": true, "x": 1295, "y": 310, "allowed": ["spikes", "mine", "barricade"]},
  {"id": "TE2", "lane": "east", "field": true, "x": 1385, "y": 310, "allowed": ["spikes", "mine", "barricade"]},
  {"id": "OE", "lane": "east", "field": true, "x": 1480, "y": 310, "allowed": ["outpost", "barricade"]},
  {"id": "TW1", "lane": "west", "field": true, "x": 120, "y": 310, "allowed": ["spikes", "mine", "barricade"]},
  {"id": "TW2", "lane": "west", "field": true, "x": 10, "y": 310, "allowed": ["spikes", "mine", "barricade"]});
window.CONFIG.fieldworks = {"standDistance": 30, "lateralReach": 85, "triggerDepth": 18, "maxLateralOffset": 60};
window.CONFIG.hope.outpostLost = -5;
// ---- Workshops: smithy, arcane laboratory, engineering laboratory ----
Object.assign(window.CONFIG.construction.buildings, {
  "smithy": {"name": "대장간", "lab": "smithy", "forge": true, "unique": true, "cost": {"gold": 200, "wood": 40, "stone": 40}, "hp": 500, "color": "#8a5a3a",
    "text": "병사의 무기·갑옷 연구, 영웅 장비 제작"},
  "arcaneLab": {"name": "마탑 연구소", "lab": "arcaneLab", "unique": true, "cost": {"gold": 220, "wood": 50, "stone": 30}, "hp": 450, "color": "#7b5fb5",
    "text": "마법 피해·폭발 범위·성화 연구"},
  "engineerLab": {"name": "건설 연구소", "lab": "engineerLab", "unique": true, "cost": {"gold": 200, "wood": 60, "stone": 60}, "hp": 500, "color": "#6f8a6a",
    "text": "성문·함정·탑 연구"}
});
window.CONFIG.construction.plots.push(
  {"id": "K1", "lane": "central", "x": 665, "y": 215, "allowed": ["smithy", "arcaneLab", "engineerLab"]},
  {"id": "K2", "lane": "central", "x": 650, "y": 445, "allowed": ["smithy", "arcaneLab", "engineerLab"]},
  {"id": "K3", "lane": "central", "x": 1050, "y": 480, "allowed": ["smithy", "arcaneLab", "engineerLab"]});
// effect keys: unitDamage, unitArmor, arcaneDamage, splashRadius, towerDamage, trapDamage, wallHp (multipliers); beaconDiscount (hope).
window.CONFIG.research = {
  "smithy": [
    {"id": "steel", "name": "강철 무기", "text": "병사와 영웅의 공격 +15%", "cost": {"gold": 180, "stone": 40}, "effect": {"unitDamage": 1.15}},
    {"id": "plate", "name": "판금 갑옷", "text": "병사와 영웅이 받는 피해 −15%", "cost": {"gold": 200, "stone": 60}, "effect": {"unitArmor": 0.85}}
  ],
  "arcaneLab": [
    {"id": "focus", "name": "비전 증폭", "text": "마법사와 마법탑의 피해 +25%", "cost": {"gold": 200, "wood": 40}, "effect": {"arcaneDamage": 1.25}},
    {"id": "wide", "name": "넓은 폭발", "text": "범위 공격의 반경 +25%", "cost": {"gold": 160, "wood": 60}, "effect": {"splashRadius": 1.25}},
    {"id": "ember", "name": "성화 연구", "text": "성화를 올리는 희망 −8", "cost": {"gold": 150}, "effect": {"beaconDiscount": 8}}
  ],
  "engineerLab": [
    {"id": "masonry", "name": "견고한 석공술", "text": "모든 성문의 최대 HP +25%", "cost": {"gold": 200, "stone": 80}, "effect": {"wallHp": 1.25}},
    {"id": "trapworks", "name": "함정 개량", "text": "가시 함정과 지뢰의 피해 +40%", "cost": {"gold": 140, "wood": 40}, "effect": {"trapDamage": 1.4}},
    {"id": "ballistics", "name": "탄도학", "text": "궁수탑과 전진기지의 피해 +25%", "cost": {"gold": 180, "wood": 50}, "effect": {"towerDamage": 1.25}}
  ]
};
// Hero gear forged at the smithy: one item per hero.
window.CONFIG.items = [
  {"id": "runeblade", "name": "룬 검", "text": "공격 +30%", "cost": {"gold": 160, "stone": 30}, "effect": {"damage": 1.3}},
  {"id": "scalemail", "name": "용린 갑옷", "text": "받는 피해 −30%", "cost": {"gold": 160, "stone": 40}, "effect": {"armor": 0.7}},
  {"id": "windcharm", "name": "바람 부적", "text": "스킬 대기 −12초", "cost": {"gold": 140, "wood": 40}, "effect": {"cooldown": 12}}
];
// ---- The continuing campaign: each year held makes the next one harder ----
window.CONFIG.campaign = {
  "yearScaling": {"hp": 0.3, "damage": 0.2, "count": 0.1},
  "winter": {"fallenWallFraction": 0.6, "stipend": {"gold": 300, "wood": 80, "stone": 60}}
};
// The keep's guard: archers on the keep shoot the nearest enemies, so the last stand wears down gradually.
window.CONFIG.keepGuard = {"damage": 18, "interval": 0.7, "range": 230, "volley": 2};
// Playtest option: ?waves=2 plays a shorter game with the first N waves.
if (typeof location !== "undefined") {
  const requested = Number(new URLSearchParams(location.search).get("waves"));
  if (Number.isInteger(requested) && requested >= 1 && requested < window.CONFIG.waves.length)
    window.CONFIG.waves.length = requested;
}

// Render-only fortress composition. Gate/keep/plot/unit coordinates and combat
// remain unchanged; the southern village wing wraps around the existing V plots.
window.CONFIG.field.fortress = {
  northY: 145, villageStepX: 740, villageSouthY: 910, farmStartX: 1240,
  gateOverlap: 6,
  horizontal: {width:128, height:48, foot:16, overlap:4},
  vertical: {width:64, height:128, overlap:12},
  tower: {width:96, height:112, foot:20},
  wards: [
    {x:285,y:175,w:540,h:345,kind:'floor'},
    {x:300,y:590,w:410,h:155,kind:'yard'},
    {x:925,y:170,w:225,h:335,kind:'yard'},
    {x:775,y:570,w:365,h:320,kind:'yard'}
  ],
  paths: [
    {x:310,y:190,w:32,h:340}, {x:710,y:330,w:32,h:210},
    {x:310,y:655,w:415,h:28}, {x:790,y:740,w:345,h:28}, {x:940,y:570,w:28,h:310}
  ],
  props: [
    {type:'tent',x:365,y:650}, {type:'dummy',x:430,y:675}, {type:'weapons',x:710,y:680},
    {type:'crates',x:730,y:630}, {type:'tent',x:1010,y:245}, {type:'dummy',x:1030,y:415},
    {type:'cart',x:990,y:540}, {type:'lumber',x:1080,y:570}, {type:'barrels',x:1090,y:740},
    {type:'banner',x:815,y:500}
  ],
  housePlacements: [{index:0,x:770,y:245}, {index:1,x:330,y:510}, {index:2,x:775,y:400}, {index:8,x:330,y:725}]
};
for (const {index,x,y} of window.CONFIG.field.fortress.housePlacements)
  Object.assign(window.CONFIG.field.houses[index], {x,y});

// Medieval field dressing v2: decorative only, no new building/physics rules.
window.CONFIG.field.fortress.medievalProps = [
  {type:'fence',x:820,y:690}, {type:'fence',x:1090,y:690},
  {type:'hay',x:860,y:870}, {type:'hay',x:1120,y:870}, {type:'hay',x:1260,y:860},
  {type:'hitch',x:660,y:865}, {type:'fence',x:668,y:890}, {type:'fence',x:1340,y:875},
  {type:'awning',x:1010,y:575}, {type:'stump',x:1140,y:740},
  {type:'brazier',x:430,y:490}, {type:'brazier',x:1060,y:450}, {type:'pennants',x:960,y:765}
];
window.CONFIG.field.fortress.wards.push({x:625,y:825,w:95,h:65,kind:'yard'});
window.CONFIG.field.fortress.paths.push({x:610,y:840,w:100,h:24});
Object.assign(window.CONFIG.field.fortress.props.find(p=>p.type==='cart'), {x:1110,y:500});
Object.assign(window.CONFIG.field.fortress.props.find(p=>p.type==='lumber'), {x:1120,y:575});
