/* ==========================================================
   杭州探索録3｜夜行杭州
   WORLD DATA Ver.0.8

   MULTI MAP SYSTEM

   MAP 01 : 钱江新城
   MAP 02 : 杭州旧城区

   game.js Ver.0.8 専用
========================================================== */


/* ==========================================================
   MAP SYSTEM
========================================================== */

const START_MAP = "qianjiang";


const MAPS = {

  /* ========================================================
     MAP 01
     钱江新城
  ======================================================== */

  qianjiang: {

    id: "qianjiang",

    chapter: "MAP 01",

    name: "钱江新城",

    englishName: "QIANJIANG NEW CITY",

    district: "杭州 · 上城区",

    weather: "小雨",

    time: "23:48",

    width: 3800,

    height: 3900,

    ambience: "future",

    playerSpawn: {
      x: 1800,
      y: 3500
    },


    /* ======================================================
       ROADS
    ====================================================== */

    roads: [

      {
        x: 1450,
        y: 0,
        w: 720,
        h: 3900,
        type: "main"
      },

      {
        x: 0,
        y: 1450,
        w: 3800,
        h: 650,
        type: "main"
      },

      {
        x: 450,
        y: 650,
        w: 2900,
        h: 420,
        type: "main"
      },

      {
        x: 470,
        y: 2050,
        w: 430,
        h: 1450,
        type: "alley"
      },

      {
        x: 2850,
        y: 1950,
        w: 430,
        h: 1500,
        type: "alley"
      },

      {
        x: 470,
        y: 2550,
        w: 1200,
        h: 380,
        type: "backstreet"
      },

      {
        x: 1950,
        y: 2500,
        w: 1330,
        h: 400,
        type: "backstreet"
      },

      {
        x: 720,
        y: 900,
        w: 370,
        h: 700,
        type: "alley"
      },

      {
        x: 2650,
        y: 900,
        w: 370,
        h: 700,
        type: "alley"
      },

      /* west transition avenue */

      {
        x: 0,
        y: 2190,
        w: 650,
        h: 360,
        type: "transition"
      }
    ],


    /* ======================================================
       PLAZAS
    ====================================================== */

    plazas: [

      {
        x: 1050,
        y: 1080,
        w: 380,
        h: 330,
        type: "modern"
      },

      {
        x: 2200,
        y: 1080,
        w: 420,
        h: 330,
        type: "modern"
      },

      {
        x: 960,
        y: 2940,
        w: 420,
        h: 400,
        type: "commercial"
      },

      {
        x: 2180,
        y: 2940,
        w: 610,
        h: 420,
        type: "commercial"
      },

      {
        x: 320,
        y: 2160,
        w: 570,
        h: 390,
        type: "old"
      }
    ],


    /* ======================================================
       BUILDINGS
    ====================================================== */

    buildings: [

      {
        id: "westTower",

        x: 180,
        y: 160,
        w: 1100,
        h: 440,

        floors: 17,

        sign: "钱江未来中心",

        neon: "#49e8ff",

        visualType: "glassOffice"
      },


      {
        id: "northCenter",

        x: 1240,
        y: 100,
        w: 1100,
        h: 470,

        floors: 26,

        sign: "HANGZHOU 2049",

        neon: "#d85cff",

        visualType: "megaTower"
      },


      {
        id: "northEast",

        x: 2470,
        y: 160,
        w: 1000,
        h: 430,

        floors: 21,

        sign: "城市数据中心",

        neon: "#ff58ba",

        visualType: "dataCenter"
      },


      {
        id: "westBlock",

        x: 100,
        y: 1110,
        w: 1160,
        h: 290,

        floors: 9,

        sign: "夜杭州",

        neon: "#ff5c58",

        visualType: "oldMixed"
      },


      {
        id: "westMiddle",

        x: 80,
        y: 1910,
        w: 350,
        h: 590,

        floors: 11,

        sign: "夜行街区",

        neon: "#d75cff",

        visualType: "oldMixed"
      },


      {
        id: "westSouthA",

        x: 930,
        y: 2130,
        w: 430,
        h: 340,

        floors: 6,

        sign: "钱塘生活",

        neon: "#ff9b55",

        visualType: "residential"
      },


      {
        id: "restaurant",

        x: 930,
        y: 2980,
        w: 430,
        h: 330,

        floors: 4,

        sign: "钱塘深夜食堂",

        neon: "#ff574f",

        visualType: "dinerBuilding",

        enter: "restaurant",

        entrance: {
          x: 1145,
          y: 3325,
          side: "south"
        }
      },


      {
        id: "eastBlock",

        x: 2330,
        y: 1110,
        w: 1200,
        h: 290,

        floors: 13,

        sign: "未来通信",

        neon: "#48e8ff",

        visualType: "techOffice"
      },


      {
        id: "eastMiddle",

        x: 3330,
        y: 1970,
        w: 350,
        h: 970,

        floors: 18,

        sign: "钱江国际",

        neon: "#47e9ff",

        visualType: "glassOffice"
      },


      {
        id: "convenience",

        x: 2200,
        y: 2180,
        w: 520,
        h: 300,

        floors: 7,

        sign: "24H 便利店",

        neon: "#48eaff",

        visualType: "apartmentStore",

        enter: "convenience",

        entrance: {
          x: 2460,
          y: 2495,
          side: "south"
        }
      },


      {
        id: "office",

        x: 2200,
        y: 3000,
        w: 650,
        h: 420,

        floors: 16,

        sign: "未来都市研究所",

        neon: "#d75cff",

        visualType: "futureLab",

        enter: "office",

        entrance: {
          x: 2525,
          y: 3435,
          side: "south"
        }
      },


      {
        id: "southWest",

        x: 100,
        y: 3450,
        w: 1250,
        h: 350,

        floors: 13,

        sign: "杭州生活",

        neon: "#ff9a52",

        visualType: "residential"
      }
    ],


    /* ======================================================
       TREES
    ====================================================== */

    trees: [

      {x:1370,y:390},
      {x:2250,y:430},

      {x:1370,y:820},
      {x:2250,y:850},

      {x:1370,y:1220},
      {x:2250,y:1230},

      {x:1370,y:2210},
      {x:2250,y:2220},

      {x:1370,y:2670},
      {x:2180,y:2700},

      {x:1380,y:3400},
      {x:2170,y:3400},

      {x:500,y:1510},
      {x:850,y:1510},
      {x:1150,y:1510},

      {x:2520,y:1510},
      {x:2900,y:1510},
      {x:3300,y:1510}
    ],


    /* ======================================================
       STREET LIGHTS
    ====================================================== */

    streetLights: [

      {x:1400,y:620},
      {x:2210,y:670},

      {x:1400,y:1160},
      {x:2210,y:1160},

      {x:1400,y:2180},
      {x:2210,y:2180},

      {x:1400,y:2780},
      {x:2210,y:2780},

      {x:1400,y:3420},
      {x:2210,y:3420},

      {x:680,y:1420},
      {x:1080,y:1420},

      {x:2570,y:1420},
      {x:3060,y:1420}
    ],


    /* ======================================================
       STREET SIGNS
    ====================================================== */

    streetSigns: [

      {
        x:1400,
        y:1860,

        text:"← 夜市　钱江新城 →",

        color:"#49eaff"
      },

      {
        x:2200,
        y:890,

        text:"市民中心 ↑",

        color:"#49eaff"
      },

      {
        x:890,
        y:2760,

        text:"深夜食堂 ↓",

        color:"#ff574f"
      },

      {
        x:2800,
        y:2620,

        text:"24H · 商业街",

        color:"#49eaff"
      },

      {
        x:470,
        y:2310,

        text:"← 旧城区",

        color:"#ffc55e"
      }
    ],


    /* ======================================================
       NPCs

       type:
       office
       student
       delivery
       street
       umbrella
       diner
       security
       shopkeeper
    ====================================================== */

    npcs: [

      {
        x:1580,
        y:1800,

        type:"office",

        gender:"male",

        palette:"navy",

        action:"phone"
      },

      {
        x:1980,
        y:1700,

        type:"office",

        gender:"female",

        palette:"charcoal",

        action:"walk"
      },

      {
        x:720,
        y:2700,

        type:"student",

        gender:"female",

        palette:"purple",

        action:"phone"
      },

      {
        x:2950,
        y:2700,

        type:"delivery",

        gender:"male",

        palette:"yellow",

        action:"idle"
      },

      {
        x:1600,
        y:800,

        type:"street",

        gender:"male",

        palette:"green",

        action:"walk"
      },

      {
        x:2010,
        y:1110,

        type:"umbrella",

        gender:"female",

        palette:"gray",

        action:"umbrella"
      },

      {
        x:1570,
        y:3150,

        type:"office",

        gender:"male",

        palette:"black",

        action:"walk"
      },

      {
        x:2280,
        y:2580,

        type:"student",

        gender:"male",

        palette:"cyan",

        action:"phone"
      },

      {
        x:1250,
        y:2810,

        type:"diner",

        gender:"male",

        palette:"brown",

        action:"eat"
      },

      {
        x:2740,
        y:2260,

        type:"delivery",

        gender:"female",

        palette:"blue",

        action:"phone"
      },

      {
        x:1840,
        y:2250,

        type:"security",

        gender:"male",

        palette:"navy",

        action:"idle"
      },

      {
        x:1040,
        y:1640,

        type:"street",

        gender:"female",

        palette:"red",

        action:"walk"
      }
    ],


    /* ======================================================
       PROPS
    ====================================================== */

    props: [

      {type:"bike",x:1020,y:2550},
      {type:"bike",x:1070,y:2565},
      {type:"bike",x:1120,y:2550},

      {type:"bike",x:2330,y:2510},
      {type:"bike",x:2380,y:2520},

      {type:"scooter",x:780,y:2250},
      {type:"scooter",x:2920,y:2320},
      {type:"scooter",x:3010,y:2350},

      {type:"vending",x:910,y:2880},
      {type:"vending",x:2790,y:2910},

      {type:"trash",x:850,y:2470},
      {type:"trash",x:2780,y:2440},

      {type:"boxes",x:870,y:3010},
      {type:"boxes",x:2760,y:3030},

      {type:"plant",x:940,y:2850},
      {type:"plant",x:2690,y:2870},

      {type:"bench",x:1280,y:1370},
      {type:"bench",x:2310,y:1370},

      {type:"barrier",x:1840,y:2860},
      {type:"cone",x:1770,y:2860},
      {type:"cone",x:1910,y:2860},

      {type:"utility",x:820,y:2180},
      {type:"utility",x:2860,y:2200},

      {type:"umbrella",x:1180,y:1590},

      {type:"drain",x:1530,y:2450},
      {type:"drain",x:2050,y:2450},

      {type:"acstack",x:850,y:2140},
      {type:"acstack",x:2820,y:2150}
    ],


    /* ======================================================
       STALLS
    ====================================================== */

    stalls: [

      {
        x:610,
        y:2230,

        name:"烤冷面",

        color:"#ff6959"
      },

      {
        x:610,
        y:2390,

        name:"小笼包",

        color:"#ffc56b"
      },

      {
        x:3130,
        y:2180,

        name:"夜宵",

        color:"#ff5d91"
      }
    ],


    /* ======================================================
       MAP EXITS
    ====================================================== */

    exits: [

      {
        id:"toOldTown",

        x:0,
        y:2160,
        w:120,
        h:430,

        direction:"west",

        targetMap:"oldtown",

        targetX:3470,
        targetY:2020,

        label:"← 杭州旧城区"
      }
    ]
  },


  /* ========================================================
     MAP 02
     杭州旧城区
  ======================================================== */

  oldtown: {

    id:"oldtown",

    chapter:"MAP 02",

    name:"杭州旧城区",

    englishName:"OLD HANGZHOU",

    district:"杭州 · 上城旧街",

    weather:"小雨",

    time:"00:07",

    width:3600,

    height:3600,

    ambience:"oldtown",

    playerSpawn:{
      x:3400,
      y:2020
    },


    /* ======================================================
       ROADS
    ====================================================== */

    roads:[

      /* main east-west old street */

      {
        x:0,
        y:1740,
        w:3600,
        h:500,
        type:"oldmain"
      },


      /* north-south market street */

      {
        x:1520,
        y:0,
        w:520,
        h:3600,
        type:"oldmain"
      },


      /* western alley */

      {
        x:540,
        y:400,
        w:310,
        h:2850,
        type:"alley"
      },


      /* eastern residential alley */

      {
        x:2740,
        y:360,
        w:300,
        h:2920,
        type:"alley"
      },


      /* upper backstreet */

      {
        x:360,
        y:850,
        w:2860,
        h:310,
        type:"backstreet"
      },


      /* lower backstreet */

      {
        x:300,
        y:2660,
        w:2940,
        h:330,
        type:"backstreet"
      },


      /* tiny lane */

      {
        x:950,
        y:1140,
        w:260,
        h:620,
        type:"tiny"
      },


      {
        x:2300,
        y:2180,
        w:250,
        h:500,
        type:"tiny"
      },


      /* transition road to qianjiang */

      {
        x:3160,
        y:1820,
        w:440,
        h:360,
        type:"transition"
      }
    ],


    /* ======================================================
       PLAZAS
    ====================================================== */

    plazas:[

      {
        x:1280,
        y:1280,
        w:900,
        h:410,
        type:"old"
      },

      {
        x:1260,
        y:2290,
        w:930,
        h:320,
        type:"old"
      },

      {
        x:290,
        y:1190,
        w:580,
        h:470,
        type:"old"
      }
    ],


    /* ======================================================
       BUILDINGS
    ====================================================== */

    buildings:[

      {
        id:"oldNorthWest",

        x:120,
        y:120,
        w:1220,
        h:610,

        floors:6,

        sign:"杭州人家",

        neon:"#e16b4c",

        visualType:"oldResidentialDense"
      },


      {
        id:"oldNorthCenter",

        x:880,
        y:1190,
        w:560,
        h:430,

        floors:5,

        sign:"老杭州杂货",

        neon:"#ffc25c",

        visualType:"oldShop"
      },


      {
        id:"oldNorthEast",

        x:2160,
        y:120,
        w:1260,
        h:620,

        floors:7,

        sign:"上城生活",

        neon:"#55c8b9",

        visualType:"oldResidentialDense"
      },


      {
        id:"fruitShop",

        x:2080,
        y:1190,
        w:580,
        h:430,

        floors:4,

        sign:"阿姨水果店",

        neon:"#ff9450",

        visualType:"fruitShop"
      },


      {
        id:"westApartments",

        x:100,
        y:2300,
        w:400,
        h:1150,

        floors:8,

        sign:"清河坊居民楼",

        neon:"#dd6850",

        visualType:"oldResidentialDense"
      },


      {
        id:"eastApartments",

        x:3090,
        y:2300,
        w:400,
        h:1120,

        floors:9,

        sign:"旧街公寓",

        neon:"#58c9b8",

        visualType:"oldResidentialDense"
      },


      {
        id:"noodleShop",

        x:880,
        y:2310,
        w:520,
        h:310,

        floors:4,

        sign:"西北牛肉面",

        neon:"#ff5349",

        visualType:"noodleShop",

        enter:"noodle",

        entrance:{
          x:1140,
          y:2635,
          side:"south"
        }
      },


      {
        id:"teaShop",

        x:2190,
        y:2310,
        w:480,
        h:310,

        floors:4,

        sign:"龙井茶庄",

        neon:"#68c988",

        visualType:"teaShop",

        enter:"tea",

        entrance:{
          x:2430,
          y:2635,
          side:"south"
        }
      },


      {
        id:"southWestHomes",

        x:880,
        y:3050,
        w:620,
        h:400,

        floors:6,

        sign:"南街里弄",

        neon:"#e46d51",

        visualType:"oldResidentialDense"
      },


      {
        id:"southEastHomes",

        x:2110,
        y:3040,
        w:650,
        h:410,

        floors:6,

        sign:"吴山人家",

        neon:"#d16a50",

        visualType:"oldResidentialDense"
      }
    ],


    /* ======================================================
       TREES
    ====================================================== */

    trees:[

      {x:1460,y:900},
      {x:2100,y:900},

      {x:1460,y:1670},
      {x:2110,y:1670},

      {x:1450,y:2280},
      {x:2110,y:2280},

      {x:1450,y:2990},
      {x:2110,y:2990},

      {x:900,y:1770},
      {x:2600,y:1770}
    ],


    /* ======================================================
       STREET LIGHTS
    ====================================================== */

    streetLights:[

      {x:1450,y:1210},
      {x:2100,y:1210},

      {x:1450,y:1690},
      {x:2100,y:1690},

      {x:1450,y:2300},
      {x:2100,y:2300},

      {x:1450,y:3000},
      {x:2100,y:3000},

      {x:760,y:1700},
      {x:2840,y:1700}
    ],


    /* ======================================================
       SIGNS
    ====================================================== */

    streetSigns:[

      {
        x:3070,
        y:2010,

        text:"钱江新城 →",

        color:"#55eaff"
      },

      {
        x:1480,
        y:1640,

        text:"↑ 清河坊 · 老街",

        color:"#ffc45e"
      },

      {
        x:2100,
        y:2280,

        text:"南街 ↓",

        color:"#ff705b"
      },

      {
        x:830,
        y:1710,

        text:"← 里弄",

        color:"#ffc45e"
      }
    ],


    /* ======================================================
       NPCs
    ====================================================== */

    npcs:[

      {
        x:1180,
        y:1840,

        type:"shopkeeper",

        gender:"female",

        palette:"red",

        action:"idle"
      },

      {
        x:1330,
        y:1980,

        type:"street",

        gender:"elderMale",

        palette:"brown",

        action:"walk"
      },

      {
        x:1670,
        y:1520,

        type:"student",

        gender:"female",

        palette:"cream",

        action:"phone"
      },

      {
        x:1900,
        y:1870,

        type:"delivery",

        gender:"male",

        palette:"yellow",

        action:"phone"
      },

      {
        x:2250,
        y:1940,

        type:"street",

        gender:"female",

        palette:"green",

        action:"umbrella"
      },

      {
        x:2570,
        y:1830,

        type:"shopkeeper",

        gender:"male",

        palette:"brown",

        action:"idle"
      },

      {
        x:690,
        y:1150,

        type:"street",

        gender:"elderFemale",

        palette:"purple",

        action:"walk"
      },

      {
        x:2900,
        y:1160,

        type:"delivery",

        gender:"female",

        palette:"blue",

        action:"idle"
      },

      {
        x:1130,
        y:2780,

        type:"diner",

        gender:"male",

        palette:"gray",

        action:"eat"
      },

      {
        x:2420,
        y:2780,

        type:"street",

        gender:"female",

        palette:"red",

        action:"walk"
      },

      {
        x:1650,
        y:3150,

        type:"umbrella",

        gender:"male",

        palette:"navy",

        action:"umbrella"
      },

      {
        x:1950,
        y:3270,

        type:"student",

        gender:"male",

        palette:"black",

        action:"phone"
      },

      {
        x:590,
        y:2050,

        type:"shopkeeper",

        gender:"male",

        palette:"green",

        action:"idle"
      },

      {
        x:2830,
        y:2070,

        type:"street",

        gender:"elderMale",

        palette:"gray",

        action:"walk"
      }
    ],


    /* ======================================================
       PROPS
    ====================================================== */

    props:[

      /* bicycles */

      {type:"bike",x:1010,y:1700},
      {type:"bike",x:1060,y:1710},
      {type:"bike",x:1110,y:1700},

      {type:"bike",x:2460,y:1700},
      {type:"bike",x:2510,y:1710},

      {type:"bike",x:680,y:920},
      {type:"bike",x:710,y:940},


      /* scooters */

      {type:"scooter",x:880,y:1900},
      {type:"scooter",x:920,y:1950},

      {type:"scooter",x:2650,y:1900},

      {type:"scooter",x:700,y:2740},
      {type:"scooter",x:2820,y:2750},


      /* AC stacks */

      {type:"acstack",x:860,y:1230},
      {type:"acstack",x:2700,y:1230},

      {type:"acstack",x:850,y:2380},
      {type:"acstack",x:2720,y:2390},

      {type:"acstack",x:620,y:760},
      {type:"acstack",x:2960,y:760},


      /* boxes */

      {type:"boxes",x:850,y:1660},
      {type:"boxes",x:2710,y:1660},

      {type:"boxes",x:620,y:2700},
      {type:"boxes",x:2950,y:2700},


      /* trash */

      {type:"trash",x:910,y:1600},
      {type:"trash",x:2660,y:1600},

      {type:"trash",x:630,y:2400},
      {type:"trash",x:2960,y:2420},


      /* plants */

      {type:"plant",x:1200,y:1660},
      {type:"plant",x:2350,y:1660},

      {type:"plant",x:930,y:2700},
      {type:"plant",x:2620,y:2700},

      {type:"plant",x:700,y:1110},
      {type:"plant",x:2870,y:1110},


      /* vending */

      {type:"vending",x:850,y:2160},
      {type:"vending",x:2720,y:2160},


      /* utility */

      {type:"utility",x:580,y:1300},
      {type:"utility",x:3000,y:1300},

      {type:"utility",x:580,y:2500},
      {type:"utility",x:2990,y:2500},


      /* benches */

      {type:"bench",x:1370,y:1340},
      {type:"bench",x:2180,y:1340},

      {type:"bench",x:1370,y:2450},
      {type:"bench",x:2180,y:2450},


      /* street drains */

      {type:"drain",x:1580,y:2100},
      {type:"drain",x:1980,y:2100},

      {type:"drain",x:1580,y:2810},
      {type:"drain",x:1980,y:2810},


      /* construction */

      {type:"barrier",x:1800,y:980},
      {type:"cone",x:1730,y:980},
      {type:"cone",x:1870,y:980},


      /* umbrellas */

      {type:"umbrella",x:1260,y:2100},
      {type:"umbrella",x:2350,y:2100}
    ],


    /* ======================================================
       OLD TOWN STALLS
    ====================================================== */

    stalls:[

      {
        x:1280,
        y:1760,

        name:"葱包桧",

        color:"#ff7656"
      },

      {
        x:1450,
        y:1760,

        name:"小馄饨",

        color:"#ffb85a"
      },

      {
        x:2110,
        y:1760,

        name:"臭豆腐",

        color:"#ff6055"
      },

      {
        x:2280,
        y:1760,

        name:"烤串",

        color:"#ff764d"
      },

      {
        x:1280,
        y:2260,

        name:"豆浆",

        color:"#ffc56d"
      },

      {
        x:2290,
        y:2260,

        name:"烧饼",

        color:"#ff985b"
      }
    ],


    /* ======================================================
       CLOTHES LINES

       game.js で旧城区専用描画
    ====================================================== */

    clothesLines:[

      {
        x1:880,
        y1:1300,

        x2:1430,
        y2:1300,

        z:180
      },

      {
        x1:2100,
        y1:1320,

        x2:2680,
        y2:1320,

        z:190
      },

      {
        x1:860,
        y1:2440,

        x2:1400,
        y2:2440,

        z:170
      },

      {
        x1:2170,
        y1:2460,

        x2:2700,
        y2:2460,

        z:180
      }
    ],


    /* ======================================================
       OVERHEAD WIRES
    ====================================================== */

    wires:[

      {
        x1:830,
        y1:1050,

        x2:1450,
        y2:1050,

        z:230
      },

      {
        x1:2100,
        y1:1050,

        x2:2760,
        y2:1050,

        z:240
      },

      {
        x1:820,
        y1:2290,

        x2:1450,
        y2:2290,

        z:220
      },

      {
        x1:2110,
        y1:2300,

        x2:2770,
        y2:2300,

        z:230
      },

      {
        x1:1500,
        y1:1680,

        x2:2050,
        y2:1680,

        z:260
      }
    ],


    /* ======================================================
       MAP EXIT
    ====================================================== */

    exits:[

      {
        id:"toQianjiang",

        x:3480,
        y:1810,
        w:120,
        h:440,

        direction:"east",

        targetMap:"qianjiang",

        targetX:160,
        targetY:2330,

        label:"钱江新城 →"
      }
    ]
  }
};


/* ==========================================================
   INTERIORS
========================================================== */

const INTERIORS = {


  /* ========================================================
     QIANJIANG
  ======================================================== */

  convenience: {

    id:"convenience",

    title:"24H 便利店",

    sub:"QIANJIANG · CONVENIENCE STORE",

    width:1050,

    height:800,

    spawn:{
      x:525,
      y:690
    },

    exit:{
      x:525,
      y:735
    }
  },


  restaurant: {

    id:"restaurant",

    title:"钱塘深夜食堂",

    sub:"LATE NIGHT DINER",

    width:1050,

    height:800,

    spawn:{
      x:525,
      y:690
    },

    exit:{
      x:525,
      y:735
    }
  },


  office: {

    id:"office",

    title:"未来都市研究所",

    sub:"FUTURE CITY LAB · LOBBY",

    width:1100,

    height:850,

    spawn:{
      x:550,
      y:735
    },

    exit:{
      x:550,
      y:790
    }
  },


  /* ========================================================
     OLD TOWN
  ======================================================== */

  noodle: {

    id:"noodle",

    title:"西北牛肉面",

    sub:"OLD HANGZHOU · NOODLE SHOP",

    width:1000,

    height:780,

    spawn:{
      x:500,
      y:670
    },

    exit:{
      x:500,
      y:720
    }
  },


  tea: {

    id:"tea",

    title:"龙井茶庄",

    sub:"LONGJING TEA HOUSE",

    width:1000,

    height:780,

    spawn:{
      x:500,
      y:670
    },

    exit:{
      x:500,
      y:720
    }
  }
};


/* ==========================================================
   HELPERS FOR GAME.JS
========================================================== */

function getMap(mapId) {

  return MAPS[mapId];
}


function getBuilding(mapId, buildingId) {

  const map =
    MAPS[mapId];


  if (!map) {
    return null;
  }


  return (
    map.buildings.find(
      building =>
        building.id === buildingId
    ) || null
  );
}


function getEnterableBuildings(mapId) {

  const map =
    MAPS[mapId];


  if (!map) {
    return [];
  }


  return map.buildings.filter(
    building =>
      building.enter &&
      building.entrance
  );
}


/* ==========================================================
   COMPATIBILITY

   game.js Ver.0.8では基本的に
   getCurrentMap() を使いますが、
   移行時のデバッグ用として残します。
========================================================== */

let WORLD = {

  width:
    MAPS[START_MAP].width,

  height:
    MAPS[START_MAP].height
};


let ROADS =
  MAPS[START_MAP].roads;


let PLAZAS =
  MAPS[START_MAP].plazas;


let BUILDINGS =
  MAPS[START_MAP].buildings;


let TREES =
  MAPS[START_MAP].trees;


let STREET_LIGHTS =
  MAPS[START_MAP].streetLights;


let STREET_SIGNS =
  MAPS[START_MAP].streetSigns;


let NPCS =
  MAPS[START_MAP].npcs;


let PROPS =
  MAPS[START_MAP].props;


let STALLS =
  MAPS[START_MAP].stalls;


/* ==========================================================
   APPLY MAP

   game.js側でマップ切替時に呼ぶ
========================================================== */

function applyMapGlobals(mapId) {

  const map =
    MAPS[mapId];


  if (!map) {

    console.error(
      "Unknown map:",
      mapId
    );

    return;
  }


  WORLD = {

    width:map.width,

    height:map.height
  };


  ROADS =
    map.roads || [];


  PLAZAS =
    map.plazas || [];


  BUILDINGS =
    map.buildings || [];


  TREES =
    map.trees || [];


  STREET_LIGHTS =
    map.streetLights || [];


  STREET_SIGNS =
    map.streetSigns || [];


  NPCS =
    map.npcs || [];


  PROPS =
    map.props || [];


  STALLS =
    map.stalls || [];
}
