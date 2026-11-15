// Every image the game can draw is listed here. Slots left out fall back to the
// built-in placeholder drawing, so art can be added one file at a time.
// Paths are relative to index.html. Sprite sheets are horizontal strips.
//   sheet: {src, frame: square frame size in px, frames: count, ms: frame duration}
// Optional unit/enemy drawSize/offsetY (world px) let weapon-reaching poses keep the
// old body/ground height; these affect drawing only, never combat size or range.
window.ASSETS = {
  // Render-only corpse cap. Timings live beside each optional sheet.
  animation: {maxCorpses: 48},
  // Rectangular presentation strips: frameWidth/Height, frames, ms, width/height, offsetX/Y.
  // All fortification levels share these stone effects. HP0 opens gates immediately.
  wallCollapse: {
    "gates": {
      "south": {
        "src": "assets/field/wall-collapse-v1/south.png",
        "frameWidth": 260,
        "frameHeight": 128,
        "frames": 6,
        "ms": 140,
        "width": 260,
        "height": 128,
        "offsetX": -130,
        "offsetY": -85
      },
      "east": {
        "src": "assets/field/wall-collapse-v1/east.png",
        "frameWidth": 128,
        "frameHeight": 260,
        "frames": 6,
        "ms": 140,
        "width": 128,
        "height": 260,
        "offsetX": -64,
        "offsetY": -130
      },
      "west": {
        "src": "assets/field/wall-collapse-v1/west.png",
        "frameWidth": 112,
        "frameHeight": 200,
        "frames": 6,
        "ms": 140,
        "width": 112,
        "height": 200,
        "offsetX": -56,
        "offsetY": -100
      }
    },
    "curtain": {
      "src": "assets/field/wall-collapse-v1/curtain.png",
      "frameWidth": 96,
      "frameHeight": 96,
      "frames": 6,
      "ms": 140,
      "width": 96,
      "height": 96,
      "offsetX": -48,
      "offsetY": -72
    },
    "maxActiveWalls": 5,
    "maxDebrisPerWall": 12
  },
  // Defenders and heroes. "idle" is required; "attack" plays briefly after each attack.
  // Optional units.*.directions: {s,e,n,w: {idle,walk,attack,hurt,death,skill}}.
  // skill is an optional hero-only presentation; its effects happen in heroes.js.
  // Directional sheets are individually drawn; never mirror shield/sword hands.
  units: {
    "infantry": {
      "idle": {
        "src": "assets/units/fantasy/N01/unit_N01_idle_se.png",
        "frame": 48,
        "frames": 2,
        "ms": 320
      },
      "attack": {
        "src": "assets/units/fantasy/N01/unit_N01_attack_se.png",
        "frame": 48,
        "frames": 2,
        "ms": 120
      },
      "directions": {
        "s": {
          "idle": {
            "src": "assets/units/infantry-directions-v1/idle-s.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "walk": {
            "src": "assets/units/infantry-directions-v1/walk-s.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/infantry-directions-v1/attack-s.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 61.838,
            "offsetY": -4.509
          },
          "hurt": {
            "src": "assets/units/infantry-directions-v1/hurt-s.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 52,
            "offsetY": 0
          },
          "death": {
            "src": "assets/units/infantry-directions-v1/death-s.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 53.209,
            "offsetY": -0.554
          }
        },
        "e": {
          "idle": {
            "src": "assets/units/infantry-directions-v1/idle-e.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "walk": {
            "src": "assets/units/infantry-directions-v1/walk-e.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "attack": {
            "src": "assets/units/infantry-directions-v1/attack-e.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 76.267,
            "offsetY": -11.122
          },
          "hurt": {
            "src": "assets/units/infantry-directions-v1/hurt-e.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "death": {
            "src": "assets/units/infantry-directions-v1/death-e.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 53.209,
            "offsetY": -0.554
          }
        },
        "n": {
          "idle": {
            "src": "assets/units/infantry-directions-v1/idle-n.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 52,
            "offsetY": 0
          },
          "walk": {
            "src": "assets/units/infantry-directions-v1/walk-n.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/infantry-directions-v1/attack-n.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 57.2,
            "offsetY": -2.383
          },
          "hurt": {
            "src": "assets/units/infantry-directions-v1/hurt-n.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 54.476,
            "offsetY": -1.135
          },
          "death": {
            "src": "assets/units/infantry-directions-v1/death-n.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 58.667,
            "offsetY": -3.056
          }
        },
        "w": {
          "idle": {
            "src": "assets/units/infantry-directions-v1/idle-w.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "walk": {
            "src": "assets/units/infantry-directions-v1/walk-w.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 55.805,
            "offsetY": -1.744
          },
          "attack": {
            "src": "assets/units/infantry-directions-v1/attack-w.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 60.211,
            "offsetY": -3.763
          },
          "hurt": {
            "src": "assets/units/infantry-directions-v1/hurt-w.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 55.805,
            "offsetY": -1.744
          },
          "death": {
            "src": "assets/units/infantry-directions-v1/death-w.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 67.294,
            "offsetY": -7.01
          }
        }
      }
    },
    "archer": {
      "idle": {
        "src": "assets/units/fantasy/N05/unit_N05_idle_se.png",
        "frame": 48,
        "frames": 2,
        "ms": 320
      },
      "attack": {
        "src": "assets/units/fantasy/N05/unit_N05_attack_se.png",
        "frame": 48,
        "frames": 2,
        "ms": 120
      },
      "directions": {
        "s": {
          "idle": {
            "src": "assets/units/archer-directions-v1/idle-s.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "walk": {
            "src": "assets/units/archer-directions-v1/walk-s.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "attack": {
            "src": "assets/units/archer-directions-v1/attack-s.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 69.333,
            "offsetY": -7.944
          },
          "hurt": {
            "src": "assets/units/archer-directions-v1/hurt-s.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "death": {
            "src": "assets/units/archer-directions-v1/death-s.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 57.2,
            "offsetY": -2.383
          }
        },
        "e": {
          "idle": {
            "src": "assets/units/archer-directions-v1/idle-e.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 52,
            "offsetY": 0
          },
          "walk": {
            "src": "assets/units/archer-directions-v1/walk-e.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/archer-directions-v1/attack-e.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 71.5,
            "offsetY": -8.938
          },
          "hurt": {
            "src": "assets/units/archer-directions-v1/hurt-e.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "death": {
            "src": "assets/units/archer-directions-v1/death-e.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 58.667,
            "offsetY": -3.056
          }
        },
        "n": {
          "idle": {
            "src": "assets/units/archer-directions-v1/idle-n.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "walk": {
            "src": "assets/units/archer-directions-v1/walk-n.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/archer-directions-v1/attack-n.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 55.805,
            "offsetY": -1.744
          },
          "hurt": {
            "src": "assets/units/archer-directions-v1/hurt-n.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "death": {
            "src": "assets/units/archer-directions-v1/death-n.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 54.476,
            "offsetY": -1.135
          }
        },
        "w": {
          "idle": {
            "src": "assets/units/archer-directions-v1/idle-w.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "walk": {
            "src": "assets/units/archer-directions-v1/walk-w.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "attack": {
            "src": "assets/units/archer-directions-v1/attack-w.png",
            "frame": 48,
            "frames": 4,
            "ms": 100,
            "drawSize": 57.2,
            "offsetY": -2.383
          },
          "hurt": {
            "src": "assets/units/archer-directions-v1/hurt-w.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.844,
            "offsetY": 0.53
          },
          "death": {
            "src": "assets/units/archer-directions-v1/death-w.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 58.667,
            "offsetY": -3.056
          }
        }
      }
    },
    "mage": {
      "idle": {
        "src": "assets/units/fantasy/N03/unit_N03_idle_se.png",
        "frame": 48,
        "frames": 2,
        "ms": 320
      },
      "attack": {
        "src": "assets/units/fantasy/N03/unit_N03_attack_se.png",
        "frame": 48,
        "frames": 2,
        "ms": 120
      },
      "directions": {
        "s": {
          "idle": {
            "src": "assets/units/mage-directions-v1/idle-s.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 52,
            "offsetY": 0
          },
          "walk": {
            "src": "assets/units/mage-directions-v1/walk-s.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/mage-directions-v1/attack-s.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "hurt": {
            "src": "assets/units/mage-directions-v1/hurt-s.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "death": {
            "src": "assets/units/mage-directions-v1/death-s.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 54.6,
            "offsetY": -1.083
          }
        },
        "e": {
          "idle": {
            "src": "assets/units/mage-directions-v1/idle-e.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 52,
            "offsetY": 0
          },
          "walk": {
            "src": "assets/units/mage-directions-v1/walk-e.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/mage-directions-v1/attack-e.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "hurt": {
            "src": "assets/units/mage-directions-v1/hurt-e.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "death": {
            "src": "assets/units/mage-directions-v1/death-e.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 56,
            "offsetY": -1.667
          }
        },
        "n": {
          "idle": {
            "src": "assets/units/mage-directions-v1/idle-n.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "walk": {
            "src": "assets/units/mage-directions-v1/walk-n.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/mage-directions-v1/attack-n.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "hurt": {
            "src": "assets/units/mage-directions-v1/hurt-n.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "death": {
            "src": "assets/units/mage-directions-v1/death-n.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 50.791,
            "offsetY": 0.504
          }
        },
        "w": {
          "idle": {
            "src": "assets/units/mage-directions-v1/idle-w.png",
            "frame": 48,
            "frames": 2,
            "ms": 320,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "walk": {
            "src": "assets/units/mage-directions-v1/walk-w.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/mage-directions-v1/attack-w.png",
            "frame": 48,
            "frames": 4,
            "ms": 140,
            "drawSize": 52,
            "offsetY": 0
          },
          "hurt": {
            "src": "assets/units/mage-directions-v1/hurt-w.png",
            "frame": 48,
            "frames": 2,
            "ms": 80,
            "drawSize": 50.791,
            "offsetY": 0.504
          },
          "death": {
            "src": "assets/units/mage-directions-v1/death-w.png",
            "frame": 48,
            "frames": 6,
            "ms": 140,
            "drawSize": 56,
            "offsetY": -1.667
          }
        }
      }
    },
    "windArcher": {
      "idle": {
        "src": "assets/units/fantasy/R05/unit_R05_idle_se.png",
        "frame": 64,
        "frames": 2,
        "ms": 320
      },
      "attack": {
        "src": "assets/units/fantasy/R05/unit_R05_attack_se.png",
        "frame": 64,
        "frames": 2,
        "ms": 120
      },
      "directions": {
        "s": {
          "idle": {
            "src": "assets/units/wind-archer-directions-v1/idle-s.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/wind-archer-directions-v1/walk-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "attack": {
            "src": "assets/units/wind-archer-directions-v1/attack-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 100,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "hurt": {
            "src": "assets/units/wind-archer-directions-v1/hurt-s.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "death": {
            "src": "assets/units/wind-archer-directions-v1/death-s.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "skill": {
            "src": "assets/units/wind-archer-skill-v1/skill-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 74.667,
            "offsetY": -4.5
          }
        },
        "e": {
          "idle": {
            "src": "assets/units/wind-archer-directions-v1/idle-e.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/wind-archer-directions-v1/walk-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 62.877,
            "offsetY": 0.474
          },
          "attack": {
            "src": "assets/units/wind-archer-directions-v1/attack-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 100,
            "drawSize": 74.667,
            "offsetY": -4.5
          },
          "hurt": {
            "src": "assets/units/wind-archer-directions-v1/hurt-e.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 64,
            "offsetY": 0
          },
          "death": {
            "src": "assets/units/wind-archer-directions-v1/death-e.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "skill": {
            "src": "assets/units/wind-archer-skill-v1/skill-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 64,
            "offsetY": 0
          }
        },
        "n": {
          "idle": {
            "src": "assets/units/wind-archer-directions-v1/idle-n.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/wind-archer-directions-v1/walk-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 64,
            "offsetY": 0
          },
          "attack": {
            "src": "assets/units/wind-archer-directions-v1/attack-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 100,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "hurt": {
            "src": "assets/units/wind-archer-directions-v1/hurt-n.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 64,
            "offsetY": 0
          },
          "death": {
            "src": "assets/units/wind-archer-directions-v1/death-n.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "skill": {
            "src": "assets/units/wind-archer-skill-v1/skill-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 62.877,
            "offsetY": 0.474
          }
        },
        "w": {
          "idle": {
            "src": "assets/units/wind-archer-directions-v1/idle-w.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/wind-archer-directions-v1/walk-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 70.275,
            "offsetY": -2.647
          },
          "attack": {
            "src": "assets/units/wind-archer-directions-v1/attack-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 100,
            "drawSize": 76.255,
            "offsetY": -5.17
          },
          "hurt": {
            "src": "assets/units/wind-archer-directions-v1/hurt-w.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 64,
            "offsetY": 0
          },
          "death": {
            "src": "assets/units/wind-archer-directions-v1/death-w.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "skill": {
            "src": "assets/units/wind-archer-skill-v1/skill-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 64,
            "offsetY": 0
          }
        }
      }
    },
    "scaleKnight": {
      "idle": {
        "src": "assets/units/fantasy/R07/unit_R07_idle_se.png",
        "frame": 64,
        "frames": 2,
        "ms": 320
      },
      "attack": {
        "src": "assets/units/fantasy/R07/unit_R07_attack_se.png",
        "frame": 64,
        "frames": 2,
        "ms": 120
      },
      "directions": {
        "s": {
          "idle": {
            "src": "assets/units/scale-knight-directions-v1/idle-s.png",
            "frame": 64,
            "frames": 2,
            "ms": 320
          },
          "walk": {
            "src": "assets/units/scale-knight-directions-v1/walk-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 140
          },
          "attack": {
            "src": "assets/units/scale-knight-directions-v1/attack-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 100
          },
          "hurt": {
            "src": "assets/units/scale-knight-directions-v1/hurt-s.png",
            "frame": 64,
            "frames": 2,
            "ms": 80
          },
          "death": {
            "src": "assets/units/scale-knight-directions-v1/death-s.png",
            "frame": 64,
            "frames": 6,
            "ms": 140
          },
          "skill": {
            "src": "assets/units/scale-knight-skill-v1/skill-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 54.237,
            "offsetY": 4.424
          }
        },
        "e": {
          "idle": {
            "src": "assets/units/scale-knight-directions-v1/idle-e.png",
            "frame": 64,
            "frames": 2,
            "ms": 320
          },
          "walk": {
            "src": "assets/units/scale-knight-directions-v1/walk-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 140
          },
          "attack": {
            "src": "assets/units/scale-knight-directions-v1/attack-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 100
          },
          "hurt": {
            "src": "assets/units/scale-knight-directions-v1/hurt-e.png",
            "frame": 64,
            "frames": 2,
            "ms": 80
          },
          "death": {
            "src": "assets/units/scale-knight-directions-v1/death-e.png",
            "frame": 64,
            "frames": 6,
            "ms": 140
          },
          "skill": {
            "src": "assets/units/scale-knight-skill-v1/skill-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 55.172,
            "offsetY": 4
          }
        },
        "n": {
          "idle": {
            "src": "assets/units/scale-knight-directions-v1/idle-n.png",
            "frame": 64,
            "frames": 2,
            "ms": 320
          },
          "walk": {
            "src": "assets/units/scale-knight-directions-v1/walk-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 140
          },
          "attack": {
            "src": "assets/units/scale-knight-directions-v1/attack-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 100
          },
          "hurt": {
            "src": "assets/units/scale-knight-directions-v1/hurt-n.png",
            "frame": 64,
            "frames": 2,
            "ms": 80
          },
          "death": {
            "src": "assets/units/scale-knight-directions-v1/death-n.png",
            "frame": 64,
            "frames": 6,
            "ms": 140
          },
          "skill": {
            "src": "assets/units/scale-knight-skill-v1/skill-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 59.17,
            "offsetY": 2.189
          }
        },
        "w": {
          "idle": {
            "src": "assets/units/scale-knight-directions-v1/idle-w.png",
            "frame": 64,
            "frames": 2,
            "ms": 320
          },
          "walk": {
            "src": "assets/units/scale-knight-directions-v1/walk-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 140
          },
          "attack": {
            "src": "assets/units/scale-knight-directions-v1/attack-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 100
          },
          "hurt": {
            "src": "assets/units/scale-knight-directions-v1/hurt-w.png",
            "frame": 64,
            "frames": 2,
            "ms": 80
          },
          "death": {
            "src": "assets/units/scale-knight-directions-v1/death-w.png",
            "frame": 64,
            "frames": 6,
            "ms": 140
          },
          "skill": {
            "src": "assets/units/scale-knight-skill-v1/skill-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 120,
            "drawSize": 53.153,
            "offsetY": 4.915
          }
        }
      }
    },
    "stormMage": {
      "idle": {
        "src": "assets/units/fantasy/H01/unit_H01_idle_se.png",
        "frame": 64,
        "frames": 2,
        "ms": 320
      },
      "attack": {
        "src": "assets/units/fantasy/H01/unit_H01_attack_se.png",
        "frame": 64,
        "frames": 2,
        "ms": 120
      },
      "directions": {
        "s": {
          "idle": {
            "src": "assets/units/storm-mage-directions-v1/idle-s.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 62.877,
            "offsetY": 0.474
          },
          "walk": {
            "src": "assets/units/storm-mage-directions-v1/walk-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 62.877,
            "offsetY": 0.474
          },
          "attack": {
            "src": "assets/units/storm-mage-directions-v1/attack-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "hurt": {
            "src": "assets/units/storm-mage-directions-v1/hurt-s.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "death": {
            "src": "assets/units/storm-mage-directions-v1/death-s.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 68.923,
            "offsetY": -2.077
          },
          "skill": {
            "src": "assets/units/storm-mage-skill-v1/skill-s.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 67.535,
            "offsetY": -1.491
          }
        },
        "e": {
          "idle": {
            "src": "assets/units/storm-mage-directions-v1/idle-e.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/storm-mage-directions-v1/walk-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 62.877,
            "offsetY": 0.474
          },
          "attack": {
            "src": "assets/units/storm-mage-directions-v1/attack-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 73.143,
            "offsetY": -3.857
          },
          "hurt": {
            "src": "assets/units/storm-mage-directions-v1/hurt-e.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "death": {
            "src": "assets/units/storm-mage-directions-v1/death-e.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 71.68,
            "offsetY": -3.24
          },
          "skill": {
            "src": "assets/units/storm-mage-skill-v1/skill-e.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 68.923,
            "offsetY": -2.077
          }
        },
        "n": {
          "idle": {
            "src": "assets/units/storm-mage-directions-v1/idle-n.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/storm-mage-directions-v1/walk-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "attack": {
            "src": "assets/units/storm-mage-directions-v1/attack-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 62.877,
            "offsetY": 0.474
          },
          "hurt": {
            "src": "assets/units/storm-mage-directions-v1/hurt-n.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "death": {
            "src": "assets/units/storm-mage-directions-v1/death-n.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 67.623,
            "offsetY": -1.528
          },
          "skill": {
            "src": "assets/units/storm-mage-skill-v1/skill-n.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 67.623,
            "offsetY": -1.529
          }
        },
        "w": {
          "idle": {
            "src": "assets/units/storm-mage-directions-v1/idle-w.png",
            "frame": 64,
            "frames": 2,
            "ms": 320,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "walk": {
            "src": "assets/units/storm-mage-directions-v1/walk-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "attack": {
            "src": "assets/units/storm-mage-directions-v1/attack-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 77.913,
            "offsetY": -5.87
          },
          "hurt": {
            "src": "assets/units/storm-mage-directions-v1/hurt-w.png",
            "frame": 64,
            "frames": 2,
            "ms": 80,
            "drawSize": 61.793,
            "offsetY": 0.931
          },
          "death": {
            "src": "assets/units/storm-mage-directions-v1/death-w.png",
            "frame": 64,
            "frames": 6,
            "ms": 140,
            "drawSize": 71.68,
            "offsetY": -3.24
          },
          "skill": {
            "src": "assets/units/storm-mage-skill-v1/skill-w.png",
            "frame": 64,
            "frames": 4,
            "ms": 140,
            "drawSize": 67.623,
            "offsetY": -1.529
          }
        }
      }
    }
  },
  // Enemies. "walk_e" (facing east) is required and is mirrored for the east lane,
  // where enemies march west. Optional "walk_n" (facing north, seen from behind)
  // is used on the south lane, where enemies march up the screen.
  // Optional attack_e/n, hurt_e/n and death_e/n use the same sheet format. Attack frame0
  // is contact; the combat simulation owns damage. Death frames play once.
  enemies: {
    "goblin": {
      "walk_e": {
        "src": "assets/enemies/goblin-v2/goblin-walk-e.png",
        "frame": 48,
        "frames": 4,
        "ms": 120
      },
      "walk_n": {
        "src": "assets/enemies/goblin-v2/goblin-walk-n.png",
        "frame": 48,
        "frames": 4,
        "ms": 120
      },
      "attack_e": {
        "src": "assets/enemies/goblin-animation-v1/attack-e.png",
        "frame": 48,
        "frames": 4,
        "ms": 100
      },
      "attack_n": {
        "src": "assets/enemies/goblin-animation-v1/attack-n.png",
        "frame": 48,
        "frames": 4,
        "ms": 100
      },
      "death_e": {
        "src": "assets/enemies/goblin-animation-v1/death-e.png",
        "frame": 48,
        "frames": 6,
        "ms": 100
      },
      "death_n": {
        "src": "assets/enemies/goblin-animation-v1/death-n.png",
        "frame": 48,
        "frames": 6,
        "ms": 100
      },
      "hurt_e": {
        "src": "assets/enemies/goblin-hurt-v1/hurt-e.png",
        "frame": 48,
        "frames": 2,
        "ms": 80,
        "drawSize": 50,
        "offsetY": 0
      },
      "hurt_n": {
        "src": "assets/enemies/goblin-hurt-v1/hurt-n.png",
        "frame": 48,
        "frames": 2,
        "ms": 80,
        "drawSize": 50,
        "offsetY": 0
      }
    },
    "orc": {
      "walk_e": {
        "src": "assets/enemies/citadel-v1/orc-walk-e.png",
        "frame": 64,
        "frames": 4,
        "ms": 120
      },
      "walk_n": {
        "src": "assets/enemies/citadel-v1/orc-walk-n.png",
        "frame": 64,
        "frames": 4,
        "ms": 120
      },
      "attack_e": {
        "src": "assets/enemies/orc-animation-v1/attack-e.png",
        "frame": 64,
        "frames": 4,
        "ms": 120,
        "drawSize": 83.628,
        "offsetY": -9.8
      },
      "attack_n": {
        "src": "assets/enemies/orc-animation-v1/attack-n.png",
        "frame": 64,
        "frames": 4,
        "ms": 120,
        "drawSize": 81.727,
        "offsetY": -8.939
      },
      "death_e": {
        "src": "assets/enemies/orc-animation-v1/death-e.png",
        "frame": 64,
        "frames": 6,
        "ms": 110,
        "drawSize": 66.593,
        "offsetY": -2.081
      },
      "death_n": {
        "src": "assets/enemies/orc-animation-v1/death-n.png",
        "frame": 64,
        "frames": 6,
        "ms": 110,
        "drawSize": 66.593,
        "offsetY": -2.081
      },
      "hurt_e": {
        "src": "assets/enemies/orc-hurt-v1/hurt-e.png",
        "frame": 64,
        "frames": 2,
        "ms": 80,
        "drawSize": 79.911,
        "offsetY": -8.116
      },
      "hurt_n": {
        "src": "assets/enemies/orc-hurt-v1/hurt-n.png",
        "frame": 64,
        "frames": 2,
        "ms": 80,
        "drawSize": 65.382,
        "offsetY": -1.532
      }
    },
    "wolf": {
      "walk_e": {
        "src": "assets/enemies/citadel-v1/wolf-walk-e.png",
        "frame": 48,
        "frames": 4,
        "ms": 90
      },
      "walk_n": {
        "src": "assets/enemies/citadel-v1/wolf-walk-n.png",
        "frame": 48,
        "frames": 4,
        "ms": 90
      },
      "attack_e": {
        "src": "assets/enemies/wolf-animation-v1/attack-e.png",
        "frame": 48,
        "frames": 4,
        "ms": 80,
        "drawSize": 46,
        "offsetY": 0
      },
      "attack_n": {
        "src": "assets/enemies/wolf-animation-v1/attack-n.png",
        "frame": 48,
        "frames": 4,
        "ms": 80,
        "drawSize": 50.842,
        "offsetY": -2.118
      },
      "death_e": {
        "src": "assets/enemies/wolf-animation-v1/death-e.png",
        "frame": 48,
        "frames": 6,
        "ms": 90,
        "drawSize": 46,
        "offsetY": 0
      },
      "death_n": {
        "src": "assets/enemies/wolf-animation-v1/death-n.png",
        "frame": 48,
        "frames": 6,
        "ms": 90,
        "drawSize": 46,
        "offsetY": 0
      },
      "hurt_e": {
        "src": "assets/enemies/wolf-hurt-v1/hurt-e.png",
        "frame": 48,
        "frames": 2,
        "ms": 80,
        "drawSize": 48.421,
        "offsetY": -1.059
      },
      "hurt_n": {
        "src": "assets/enemies/wolf-hurt-v1/hurt-n.png",
        "frame": 48,
        "frames": 2,
        "ms": 80,
        "drawSize": 64.4,
        "offsetY": -8.05
      }
    },
    "golem": {
      "walk_e": {
        "src": "assets/enemies/citadel-v1/golem-walk-e.png",
        "frame": 96,
        "frames": 4,
        "ms": 160
      },
      "walk_n": {
        "src": "assets/enemies/citadel-v1/golem-walk-n.png",
        "frame": 96,
        "frames": 4,
        "ms": 160
      },
      "attack_e": {
        "src": "assets/enemies/golem-animation-v1/attack-e.png",
        "frame": 96,
        "frames": 4,
        "ms": 160,
        "drawSize": 99.387,
        "offsetY": -10.025
      },
      "attack_n": {
        "src": "assets/enemies/golem-animation-v1/attack-n.png",
        "frame": 96,
        "frames": 4,
        "ms": 160,
        "drawSize": 105.677,
        "offsetY": -12.974
      },
      "death_e": {
        "src": "assets/enemies/golem-animation-v1/death-e.png",
        "frame": 96,
        "frames": 6,
        "ms": 140,
        "drawSize": 78,
        "offsetY": 0
      },
      "death_n": {
        "src": "assets/enemies/golem-animation-v1/death-n.png",
        "frame": 96,
        "frames": 6,
        "ms": 140,
        "drawSize": 79.902,
        "offsetY": -0.892
      },
      "hurt_e": {
        "src": "assets/enemies/golem-hurt-v1/hurt-e.png",
        "frame": 96,
        "frames": 2,
        "ms": 80,
        "drawSize": 96.281,
        "offsetY": -8.569
      },
      "hurt_n": {
        "src": "assets/enemies/golem-hurt-v1/hurt-n.png",
        "frame": 96,
        "frames": 2,
        "ms": 80,
        "drawSize": 94.957,
        "offsetY": -7.949
      }
    },
    "boss": {
      "walk_e": {
        "src": "assets/enemies/citadel-v1/boss-walk-e.png",
        "frame": 96,
        "frames": 4,
        "ms": 160
      },
      "walk_n": {
        "src": "assets/enemies/citadel-v1/boss-walk-n.png",
        "frame": 96,
        "frames": 4,
        "ms": 160
      },
      "attack_e": {
        "src": "assets/enemies/boss-animation-v1/attack-e.png",
        "frame": 96,
        "frames": 4,
        "ms": 140,
        "drawSize": 155.077,
        "offsetY": -27.692
      },
      "attack_n": {
        "src": "assets/enemies/boss-animation-v1/attack-n.png",
        "frame": 96,
        "frames": 4,
        "ms": 140,
        "drawSize": 101.647,
        "offsetY": -2.647
      },
      "death_e": {
        "src": "assets/enemies/boss-animation-v1/death-e.png",
        "frame": 96,
        "frames": 6,
        "ms": 140,
        "drawSize": 100.8,
        "offsetY": -2.25
      },
      "death_n": {
        "src": "assets/enemies/boss-animation-v1/death-n.png",
        "frame": 96,
        "frames": 6,
        "ms": 140,
        "drawSize": 109.367,
        "offsetY": -6.266
      },
      "hurt_e": {
        "src": "assets/enemies/boss-hurt-v1/hurt-e.png",
        "frame": 96,
        "frames": 2,
        "ms": 80,
        "drawSize": 98.341,
        "offsetY": -1.097
      },
      "hurt_n": {
        "src": "assets/enemies/boss-hurt-v1/hurt-n.png",
        "frame": 96,
        "frames": 2,
        "ms": 80,
        "drawSize": 96,
        "offsetY": 0
      }
    }
  },
  // Buildings: one image per level and one ruin. Drawn width x height in world
  // pixels with the bottom centre placed "foot" pixels below the plot centre.
  // Example: archerTower: {levels: ['a1.png', 'a2.png', 'a3.png'], ruin: 'a-ruin.png', width: 72, height: 104, foot: 20}
  buildings: {
    "archerTower": {
      "levels": [
        "assets/buildings/cohesion-v4/archer-tower-lv1.png",
        "assets/buildings/cohesion-v4/archer-tower-lv2.png",
        "assets/buildings/cohesion-v4/archer-tower-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/archer-tower-ruin.png",
      "width": 64,
      "height": 96,
      "foot": 20
    },
    "magicTower": {
      "levels": [
        "assets/buildings/cohesion-v4/magic-tower-lv1.png",
        "assets/buildings/cohesion-v4/magic-tower-lv2.png",
        "assets/buildings/cohesion-v4/magic-tower-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/magic-tower-ruin.png",
      "width": 64,
      "height": 104,
      "foot": 20
    },
    "barracks": {
      "levels": [
        "assets/buildings/cohesion-v4/barracks-lv1.png",
        "assets/buildings/cohesion-v4/barracks-lv2.png",
        "assets/buildings/cohesion-v4/barracks-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/barracks-ruin.png",
      "width": 88,
      "height": 72,
      "foot": 14
    },
    "repair": {
      "levels": [
        "assets/buildings/cohesion-v4/repair-lv1.png",
        "assets/buildings/cohesion-v4/repair-lv2.png",
        "assets/buildings/cohesion-v4/repair-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/repair-ruin.png",
      "width": 80,
      "height": 64,
      "foot": 14
    },
    "hospital": {
      "levels": [
        "assets/buildings/cohesion-v4/hospital-lv1.png",
        "assets/buildings/cohesion-v4/hospital-lv2.png",
        "assets/buildings/cohesion-v4/hospital-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/hospital-ruin.png",
      "width": 80,
      "height": 64,
      "foot": 14
    },
    "mercenary": {
      "levels": [
        "assets/buildings/cohesion-v4/mercenary-lv1.png",
        "assets/buildings/cohesion-v4/mercenary-lv2.png",
        "assets/buildings/cohesion-v4/mercenary-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/mercenary-ruin.png",
      "width": 88,
      "height": 80,
      "foot": 14
    },
    "market": {
      "levels": [
        "assets/buildings/cohesion-v4/market-lv1.png",
        "assets/buildings/cohesion-v4/market-lv2.png",
        "assets/buildings/cohesion-v4/market-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/market-ruin.png",
      "width": 80,
      "height": 64,
      "foot": 14
    },
    "warehouse": {
      "levels": [
        "assets/buildings/cohesion-v4/warehouse-lv1.png",
        "assets/buildings/cohesion-v4/warehouse-lv2.png",
        "assets/buildings/cohesion-v4/warehouse-lv3.png"
      ],
      "ruin": "assets/buildings/cohesion-v4/warehouse-ruin.png",
      "width": 80,
      "height": 64,
      "foot": 14
    },
    "spikes": {
      "levels": [
        "assets/buildings/fieldworks-v3/spikes.png"
      ],
      "ruin": "assets/buildings/fieldworks-v3/spikes-spent.png",
      "width": 88,
      "height": 32,
      "foot": 10
    },
    "mine": {
      "levels": [
        "assets/buildings/fieldworks-v3/mine.png"
      ],
      "ruin": "assets/buildings/fieldworks-v3/mine-spent.png",
      "width": 32,
      "height": 28,
      "foot": 8
    },
    "barricade": {
      "levels": [
        "assets/buildings/fieldworks-v3/barricade.png"
      ],
      "ruin": "assets/buildings/fieldworks-v3/barricade-ruin.png",
      "width": 96,
      "height": 48,
      "foot": 10
    },
    "outpost": {
      "levels": [
        "assets/buildings/fieldworks-v3/outpost-lv1.png",
        "assets/buildings/fieldworks-v3/outpost-lv2.png",
        "assets/buildings/fieldworks-v3/outpost-lv3.png"
      ],
      "ruin": "assets/buildings/fieldworks-v3/outpost-ruin.png",
      "width": 96,
      "height": 112,
      "foot": 14
    },
    "smithy": {
      "levels": [
        "assets/buildings/workshops-v3/smithy-normal.png"
      ],
      "ruin": "assets/buildings/workshops-v3/smithy-ruin.png",
      "width": 88,
      "height": 80,
      "foot": 14
    },
    "arcaneLab": {
      "levels": [
        "assets/buildings/workshops-v3/arcane-lab-normal.png"
      ],
      "ruin": "assets/buildings/workshops-v3/arcane-lab-ruin.png",
      "width": 88,
      "height": 112,
      "foot": 14
    },
    "engineerLab": {
      "levels": [
        "assets/buildings/workshops-v3/engineer-lab-normal.png"
      ],
      "ruin": "assets/buildings/workshops-v3/engineer-lab-ruin.png",
      "width": 96,
      "height": 88,
      "foot": 14
    }
  },
  // Medieval field dressing. Boundary-stitched repeat surfaces have exact edge joins.
  medieval: {
    "props": {
      "fence": {
        "src": "assets/field/medieval-v2/fence.png",
        "width": 80,
        "height": 32
      },
      "hay": {
        "src": "assets/field/medieval-v2/hay.png",
        "width": 56,
        "height": 40
      },
      "hitch": {
        "src": "assets/field/medieval-v2/hitch.png",
        "width": 72,
        "height": 48
      },
      "well": {
        "src": "assets/field/medieval-v2/well.png",
        "width": 64,
        "height": 72
      },
      "awning": {
        "src": "assets/field/medieval-v2/awning.png",
        "width": 88,
        "height": 64
      },
      "stump": {
        "src": "assets/field/medieval-v2/stump.png",
        "width": 32,
        "height": 32
      },
      "brazier": {
        "src": "assets/field/medieval-v2/brazier.png",
        "width": 28,
        "height": 48
      },
      "pennants": {
        "src": "assets/field/medieval-v2/pennants.png",
        "width": 96,
        "height": 48
      }
    }
  },
  // Continuous curtain-wall kit. Layout is render-only CONFIG.field.fortress.
  // vertical.sourceInsetX crops the transparent side fringe before drawing64px wide.
  fortress: {
    "horizontal": {
      "levels": [
        "assets/field/fortress-kit-v1/horizontal-lv1.png",
        "assets/field/fortress-kit-v1/horizontal-lv2.png",
        "assets/field/fortress-kit-v1/horizontal-lv3.png"
      ],
      "ruin": "assets/field/fortress-kit-v1/horizontal-ruin.png"
    },
    "vertical": {
      "sourceInsetX": 3,
      "levels": [
        "assets/field/fortress-kit-v1/vertical-lv1.png",
        "assets/field/fortress-kit-v1/vertical-lv2.png",
        "assets/field/fortress-kit-v1/vertical-lv3.png"
      ],
      "ruin": "assets/field/fortress-kit-v1/vertical-ruin.png"
    },
    "tower": {
      "levels": [
        "assets/field/fortress-kit-v1/tower-lv1.png",
        "assets/field/fortress-kit-v1/tower-lv2.png",
        "assets/field/fortress-kit-v1/tower-lv3.png"
      ],
      "ruin": "assets/field/fortress-kit-v1/tower-ruin.png"
    },
    "props": {
      "tent": {
        "src": "assets/field/fortress-kit-v1/tent.png",
        "width": 96,
        "height": 80
      },
      "dummy": {
        "src": "assets/field/fortress-kit-v1/dummy.png",
        "width": 32,
        "height": 56
      },
      "weapons": {
        "src": "assets/field/fortress-kit-v1/weapons.png",
        "width": 64,
        "height": 48
      },
      "crates": {
        "src": "assets/field/fortress-kit-v1/crates.png",
        "width": 56,
        "height": 48
      },
      "cart": {
        "src": "assets/field/fortress-kit-v1/cart.png",
        "width": 80,
        "height": 56
      },
      "lumber": {
        "src": "assets/field/fortress-kit-v1/lumber.png",
        "width": 64,
        "height": 40
      },
      "barrels": {
        "src": "assets/field/fortress-kit-v1/barrels.png",
        "width": 48,
        "height": 48
      },
      "banner": {
        "src": "assets/field/fortress-kit-v1/banner.png",
        "width": 40,
        "height": 80
      }
    }
  },
  // Walls. south: seen from the front, runs left-right (260 wide). east: runs
  // up-down (260 tall). levels = intact art per fortification level; damaged =
  // same, shown at or below half HP; ruin = collapsed with the gateway open.
  // Optional connectionHalf: underlay gap half-length; bodyClip:{y,height} is
  // a render-only world-pixel clip around the gatehouse. Continuous wall tails
  // are drawn underneath, so masonry/walkway widths stay consistent.
  // Example: east: {levels: ['e1.png'], damaged: ['e1d.png'], ruin: 'e-ruin.png', width: 90, height: 300, offsetX: -45, offsetY: -170}
  walls: {
    west: {levels: [1,2,3].map(l=>'assets/field/postern-v2/west-lv'+l+'.png'), damaged: [1,2,3].map(l=>'assets/field/postern-v2/west-lv'+l+'-damaged.png'), ruin:'assets/field/postern-v2/west-ruin.png',width:80,height:200,offsetX:-40,offsetY:-100},
    south: {levels: ['assets/field/fortifications-v2/south-lv1.png', ...[2,3].map(l=>'assets/field/fortifications-v1/south-lv'+l+'.png')], damaged: [1,2,3].map(l=>'assets/field/fortifications-v1/south-lv'+l+'-damaged.png'), ruin:'assets/field/fortifications-v1/south-ruin.png', width:260,height:87,offsetX:-130,offsetY:-65},
    east: {levels: [1,2,3].map(l=>'assets/field/medieval-v2/east-lv'+l+'.png'), damaged: [1,2,3].map(l=>'assets/field/medieval-v2/east-lv'+l+'-damaged.png'), ruin:'assets/field/medieval-v2/east-ruin.png', width:90,height:260,offsetX:-45,offsetY:-130, connectionHalf:46, bodyClip:{y:-64,height:128}}
  },
  // Keep: {src, damaged, width, height, offsetX, offsetY} relative to the keep position.
  // "damaged" (optional) is shown at or below half HP.
  keep: {src:'assets/field/dark-citadel-v5/keep.png',damaged:'assets/field/dark-citadel-v5/keep-damaged.png',width:200,height:200,offsetX:-100,offsetY:-160},
  // Props drawn into the terrain. house/tree entries: {src, width, height}; picked by position.
  props: {house: [1,2,3].map(i=>({src:'assets/field/dark-citadel-v5/house-'+i+'.png',width:80,height:80})), tree: [1,2,3].map(i=>({src:'assets/field/dark-citadel-v5/tree-'+i+'.png',width:40,height:56})).concat([{src:'assets/field/dark-props-v3/dead-tree-1.png',width:40,height:56},{src:'assets/field/dark-props-v3/dead-tree-2.png',width:40,height:56},{src:'assets/field/dark-props-v3/stump.png',width:32,height:24}]),
    // Optional: bridge over the river {src, width, height} drawn with its top-left at (bridge.x - 10, river.y - 12);
    // fixed = single props at world positions [{src, x, y, width, height}] with (x, y) at the bottom centre.
    bridge: {src:'assets/field/bridge-v3/bridge-transparent.png',width:180,height:119}, fixed: [{src:'assets/field/terrain-v2/cave.png',x:-190,y:372,width:120,height:110},{src:'assets/field/medieval-v2/well.png',x:960,y:720,width:64,height:72},{src:'assets/field/terrain-v2/signpost.png',x:150,y:372,width:28,height:44}]},
  // HUD icons (optional, square, about 32px): {gold: 'path.png', wood: 'path.png', stone: 'path.png'}.
  // Hero skill buttons show units.<hero>.portrait when given, otherwise the first idle frame.
  icons: {gold:'assets/field/dark-props-v3/gold.png',wood:'assets/field/dark-props-v3/wood.png',stone:'assets/field/dark-props-v3/stone.png'},
  // Hope icon beside the hope value, gear icons on the smithy buttons, decision card art (by event id).
  hopeIcon: 'assets/field/hope-unwired-v3/hope.png',
  items: {runeblade: 'assets/gear-v3/runeblade.png', scalemail: 'assets/gear-v3/scalemail.png', windcharm: 'assets/gear-v3/windcharm.png'},
  decisions: {refugees: 'refugees', wounded: 'wounded', merchant: 'merchant', vigil: 'vigil', deserter: 'deserter', tithe: 'tithe',
    mason: 'mason', lanterns: 'lanterns', freeCompany: 'free-company', relic: 'relic'},
  decisionPath: 'assets/decisions-v3/',
  // Snow lying on roofs in snowy months. Each overlay has the same frame as the art it covers.
  // Building overlays were drawn for one level only ("level"); other levels stay bare.
  snow: {
    keep: 'assets/field/hope-unwired-v3/snow-keep.png',
    houses: ['assets/field/hope-unwired-v3/snow-house-1.png', 'assets/field/hope-unwired-v3/snow-house-2.png', 'assets/field/hope-unwired-v3/snow-house-3.png'],
    buildings: {
      barracks: {src: 'assets/field/hope-unwired-v3/snow-barracks.png', level: 1}, repair: {src: 'assets/field/hope-unwired-v3/snow-repair.png', level: 1}, hospital: {src: 'assets/field/hope-unwired-v3/snow-hospital.png', level: 1},
      mercenary: {src: 'assets/field/hope-unwired-v3/snow-mercenary.png', level: 1}, market: {src: 'assets/field/hope-unwired-v3/snow-market.png', level: 1}, warehouse: {src: 'assets/field/hope-unwired-v3/snow-warehouse.png', level: 1},
      archerTower: {src: 'assets/field/hope-unwired-v3/snow-archer-tower.png', level: 1}, magicTower: {src: 'assets/field/hope-unwired-v3/snow-magic-tower.png', level: 1}, outpost: {src: 'assets/field/hope-unwired-v3/snow-outpost.png', level: 3},
      smithy: {src: 'assets/field/hope-unwired-v3/snow-smithy.png', level: 1}, arcaneLab: {src: 'assets/field/hope-unwired-v3/snow-arcane-lab.png', level: 1}, engineerLab: {src: 'assets/field/hope-unwired-v3/snow-engineer-lab.png', level: 1}
    }
  },
  // Effect sheets: horizontal strips of w x h frames. "size" is the drawn width in
  // world pixels. Projectiles and beams point right (east) and are rotated in flight.
  fx: {
    arrow:     {src: 'assets/fx/arrow.png', w: 24, h: 24, frames: 3, fps: 8, size: 30},
    magicBolt: {src: 'assets/fx/magic_bolt.png', w: 24, h: 24, frames: 3, fps: 8, size: 34},
    hit:       {src: 'assets/fx/hit_spark.png', w: 32, h: 32, frames: 5, fps: 20, size: 36},
    hitMagic:  {src: 'assets/fx/hit_magic.png', w: 32, h: 32, frames: 5, fps: 20, size: 44},
    explosion: {src: 'assets/fx/explosion_small.png', w: 64, h: 64, frames: 5, fps: 15, size: 110},
    lightning: {src: 'assets/fx/lightning.png', w: 32, h: 16, frames: 4, fps: 8, size: 0},
    death:     {src: 'assets/fx/death_poof.png', w: 48, h: 48, frames: 5, fps: 15, size: 56}
  },
  // Which sheets an attacker uses: projectile (flies to the target), beam (stretched
  // from attacker to target) and impact (played at the target). All optional.
  attackFx: {
    infantry: {impact: 'hit'}, scaleKnight: {impact: 'hit'},
    archer: {projectile: 'arrow', impact: 'hit'}, archerTower: {projectile: 'arrow', impact: 'hit'}, windArcher: {projectile: 'arrow', impact: 'hit'},
    mage: {projectile: 'magicBolt', impact: 'explosion'}, magicTower: {projectile: 'magicBolt', impact: 'explosion'}, stormMage: {projectile: 'magicBolt', impact: 'hitMagic'},
    storm: {beam: 'lightning', impact: 'explosion'}
  },
  // Repeating 64px ground tiles and the grass texture. Optional: cliff (rock face of the
  // north and west escarpments) and water (river surface); placeholders are drawn when absent.
  // grassSize: world pixels one grass tile covers (default 256).
  tiles: {
    grassSize: 256,
    grass: 'assets/field/dark-terrain-v3/grass.png',
    floor: 'assets/field/dark-terrain-v3/floor.png',
    road: 'assets/field/dark-terrain-v3/road.png',
    yard: 'assets/field/dark-terrain-v3/yard.png',
    cliff: 'assets/field/terrain-v2/cliff.png',
    water: 'assets/field/terrain-v2/water.png'
  }
};
