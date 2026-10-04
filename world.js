/* ==========================================================
   杭州探索録3｜夜行杭州
   WORLD DATA Ver.0.9

   MAP 01 : 钱江新城
   MAP 02 : 杭州旧城区

   Ver.0.9
   ・デフォルメNPC対応
   ・NPC生活行動
   ・巡回範囲
   ・店員 / 配達員 / 学生 / 住民
   ・マップ間移動
========================================================== */

const START_MAP = "qianjiang";


/* ==========================================================
   NPC FACTORY

   homeX / homeY
     NPCの基準位置

   roamX / roamY
     その位置から歩ける範囲

   behavior
     wander   : 周辺を歩く
     phone    : 歩く→スマホ
     shop     : 店先中心
     delivery : 配達員
     eat      : 食事中心
     umbrella : 傘を差して歩く
     idle     : ほぼ静止
========================================================== */

function NPC(
  x,
  y,
  type,
  palette,
  behavior,
  roamX = 100,
  roamY = 100,
  extra = {}
) {

  return {

    x,
    y,

    homeX: x,
    homeY: y,

    type,
    palette,
    behavior,

    roamX,
    roamY,

    action:
      behavior === "umbrella"
        ? "umbrella"
        : "idle",

    direction: "down",

    speed:
      type === "elder"
        ? 26
        : type === "delivery"
          ? 45
          : 34,

    ...extra
  };
}


/* ==========================================================
   MAP DATA
========================================================== */

const MAPS = {


/* ==========================================================
   MAP 01
   钱江新城
========================================================== */

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


  /* --------------------------------------------------------
     ROADS
  -------------------------------------------------------- */

  roads: [

    {
      x:1450,
      y:0,
      w:720,
      h:3900,
      type:"main"
    },

    {
      x:0,
      y:1450,
      w:3800,
      h:650,
      type:"main"
    },

    {
      x:450,
      y:650,
      w:2900,
      h:420,
      type:"main"
    },

    {
      x:470,
      y:2050,
      w:430,
      h:1450,
      type:"alley"
    },

    {
      x:2850,
      y:1950,
      w:430,
      h:1500,
      type:"alley"
    },

    {
      x:470,
      y:2550,
      w:1200,
      h:380,
      type:"backstreet"
    },

    {
      x:1950,
      y:2500,
      w:1330,
      h:400,
      type:"backstreet"
    },

    {
      x:720,
      y:900,
      w:370,
      h:700,
      type:"alley"
    },

    {
      x:2650,
      y:900,
      w:370,
      h:700,
      type:"alley"
    },

    {
      x:0,
      y:2190,
      w:650,
      h:360,
      type:"transition"
    }
  ],


  /* --------------------------------------------------------
     PLAZAS
  -------------------------------------------------------- */

  plazas: [

    {
      x:1050,
      y:1080,
      w:380,
      h:330,
      type:"modern"
    },

    {
      x:2200,
      y:1080,
      w:420,
      h:330,
      type:"modern"
    },

    {
      x:960,
      y:2940,
      w:420,
      h:400,
      type:"commercial"
    },

    {
      x:2180,
      y:2940,
      w:610,
      h:420,
      type:"commercial"
    },

    {
      x:320,
      y:2160,
      w:570,
      h:390,
      type:"old"
    }
  ],


  /* --------------------------------------------------------
     BUILDINGS
  -------------------------------------------------------- */

  buildings: [

    {
      id:"westTower",

      x:180,
      y:160,
      w:1100,
      h:440,

      floors:17,

      sign:"钱江未来中心",

      neon:"#43e8ff",

      visualType:"glassOffice"
    },

    {
      id:"northCenter",

      x:1240,
      y:100,
      w:1100,
      h:470,

      floors:26,

      sign:"HANGZHOU 2049",

      neon:"#d45cff",

      visualType:"megaTower"
    },

    {
      id:"northEast",

      x:2470,
      y:160,
      w:1000,
      h:430,

      floors:21,

      sign:"城市数据中心",

      neon:"#ff4d9f",

      visualType:"dataCenter"
    },

    {
      id:"westBlock",

      x:100,
      y:1110,
      w:1160,
      h:290,

      floors:9,

      sign:"夜杭州",

      neon:"#ff5757",

      visualType:"oldMixed"
    },

    {
      id:"westMiddle",

      x:80,
      y:1910,
      w:350,
      h:590,

      floors:11,

      sign:"夜行街区",

      neon:"#e154ff",

      visualType:"oldMixed"
    },

    {
      id:"westSouthA",

      x:930,
      y:2130,
      w:430,
      h:340,

      floors:6,

      sign:"钱塘生活",

      neon:"#ff9b55",

      visualType:"residential"
    },

    {
      id:"restaurant",

      x:930,
      y:2980,
      w:430,
      h:330,

      floors:4,

      sign:"钱塘深夜食堂",

      neon:"#ff5a55",

      visualType:"dinerBuilding",

      enter:"restaurant",

      entrance:{
        x:1145,
        y:3325,
        side:"south"
      }
    },

    {
      id:"eastBlock",

      x:2330,
      y:1110,
      w:1200,
      h:290,

      floors:13,

      sign:"未来通信",

      neon:"#43e8ff",

      visualType:"techOffice"
    },

    {
      id:"eastMiddle",

      x:3330,
      y:1970,
      w:350,
      h:970,

      floors:18,

      sign:"钱江国际",

      neon:"#46e5ff",

      visualType:"glassOffice"
    },

    {
      id:"convenience",

      x:2200,
      y:2180,
      w:520,
      h:300,

      floors:7,

      sign:"24H 便利店",

      neon:"#43e8ff",

      visualType:"apartmentStore",

      enter:"convenience",

      entrance:{
        x:2460,
        y:2495,
        side:"south"
      }
    },

    {
      id:"office",

      x:2200,
      y:3000,
      w:650,
      h:420,

      floors:16,

      sign:"未来都市研究所",

      neon:"#d55cff",

      visualType:"futureLab",

      enter:"office",

      entrance:{
        x:2525,
        y:3435,
        side:"south"
      }
    },

    {
      id:"southWest",

      x:100,
      y:3450,
      w:1250,
      h:350,

      floors:13,

      sign:"杭州生活",

      neon:"#ffae45",

      visualType:"residential"
    }
  ],


  /* --------------------------------------------------------
     TREES
  -------------------------------------------------------- */

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


  /* --------------------------------------------------------
     STREET LIGHTS
  -------------------------------------------------------- */

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


  /* --------------------------------------------------------
     STREET SIGNS
  -------------------------------------------------------- */

  streetSigns: [

    {
      x:1400,
      y:1860,

      text:"← 夜市　钱江新城 →",

      color:"#45e7ff"
    },

    {
      x:2200,
      y:890,

      text:"市民中心 ↑",

      color:"#52eaff"
    },

    {
      x:890,
      y:2760,

      text:"深夜食堂 ↓",

      color:"#ff5555"
    },

    {
      x:2800,
      y:2620,

      text:"24H · 商业街",

      color:"#44e8ff"
    },

    {
      x:470,
      y:2310,

      text:"← 杭州旧城区",

      color:"#ffc55e"
    }
  ],


  /* --------------------------------------------------------
     NPCs

     今回の大きな変更点。
  -------------------------------------------------------- */

  npcs: [

    NPC(
      1580,
      1800,
      "office",
      "navy",
      "phone",
      130,
      150,
      {
        gender:"male"
      }
    ),

    NPC(
      1980,
      1700,
      "office",
      "charcoal",
      "wander",
      170,
      120,
      {
        gender:"female"
      }
    ),

    NPC(
      720,
      2700,
      "student",
      "purple",
      "phone",
      110,
      150,
      {
        gender:"female"
      }
    ),

    NPC(
      2950,
      2700,
      "delivery",
      "yellow",
      "delivery",
      150,
      170,
      {
        gender:"male"
      }
    ),

    NPC(
      1600,
      800,
      "street",
      "green",
      "wander",
      180,
      120
    ),

    NPC(
      2010,
      1110,
      "street",
      "gray",
      "umbrella",
      160,
      100,
      {
        gender:"female"
      }
    ),

    NPC(
      1570,
      3150,
      "office",
      "black",
      "wander",
      130,
      160
    ),

    NPC(
      2280,
      2580,
      "student",
      "cyan",
      "phone",
      100,
      90
    ),

    NPC(
      1250,
      2810,
      "street",
      "brown",
      "eat",
      30,
      30
    ),

    NPC(
      2740,
      2260,
      "delivery",
      "blue",
      "delivery",
      100,
      100
    ),

    NPC(
      1840,
      2250,
      "security",
      "navy",
      "idle",
      35,
      35
    ),

    NPC(
      1040,
      1640,
      "street",
      "red",
      "umbrella",
      170,
      90
    ),

    /*
       追加NPC
    */

    NPC(
      1730,
      2740,
      "student",
      "cream",
      "wander",
      140,
      100
    ),

    NPC(
      2060,
      2840,
      "office",
      "navy",
      "phone",
      80,
      80
    ),

    NPC(
      3130,
      2220,
      "shopkeeper",
      "red",
      "shop",
      45,
      35
    )
  ],


  /* --------------------------------------------------------
     PROPS
  -------------------------------------------------------- */

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


  /* --------------------------------------------------------
     STALLS
  -------------------------------------------------------- */

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


  /* --------------------------------------------------------
     WIRES
  -------------------------------------------------------- */

  wires: [

    {
      x1:860,
      y1:2130,
      x2:1370,
      y2:2130,
      z:210
    },

    {
      x1:2210,
      y1:2120,
      x2:2820,
      y2:2120,
      z:210
    },

    {
      x1:900,
      y1:2960,
      x2:1380,
      y2:2960,
      z:210
    }
  ],


  /* --------------------------------------------------------
     EXIT
  -------------------------------------------------------- */

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


/* ==========================================================
   MAP 02
   杭州旧城区
========================================================== */

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


  /* --------------------------------------------------------
     ROADS
  -------------------------------------------------------- */

  roads: [

    {
      x:0,
      y:1740,
      w:3600,
      h:500,
      type:"oldmain"
    },

    {
      x:1520,
      y:0,
      w:520,
      h:3600,
      type:"oldmain"
    },

    {
      x:540,
      y:400,
      w:310,
      h:2850,
      type:"alley"
    },

    {
      x:2740,
      y:360,
      w:300,
      h:2920,
      type:"alley"
    },

    {
      x:360,
      y:850,
      w:2860,
      h:310,
      type:"backstreet"
    },

    {
      x:300,
      y:2660,
      w:2940,
      h:330,
      type:"backstreet"
    },

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

    {
      x:3160,
      y:1820,
      w:440,
      h:360,
      type:"transition"
    }
  ],


  /* --------------------------------------------------------
     PLAZAS
  -------------------------------------------------------- */

  plazas: [

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


  /* --------------------------------------------------------
     BUILDINGS
  -------------------------------------------------------- */

  buildings: [

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


  /* --------------------------------------------------------
     TREES
  -------------------------------------------------------- */

  trees: [

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


  /* --------------------------------------------------------
     STREET LIGHTS
  -------------------------------------------------------- */

  streetLights: [

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


  /* --------------------------------------------------------
     STREET SIGNS
  -------------------------------------------------------- */

  streetSigns: [

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


  /* --------------------------------------------------------
     NPCs

     旧城区は生活感を強める。
  -------------------------------------------------------- */

  npcs: [

    /*
       雑貨店の店主
    */

    NPC(
      1180,
      1670,
      "shopkeeper",
      "red",
      "shop",
      55,
      40,
      {
        gender:"female"
      }
    ),

    /*
       散歩するおじいさん
    */

    NPC(
      1330,
      1980,
      "elder",
      "brown",
      "wander",
      150,
      80,
      {
        gender:"elderMale"
      }
    ),

    /*
       学生
    */

    NPC(
      1670,
      1520,
      "student",
      "cream",
      "phone",
      130,
      100,
      {
        gender:"female"
      }
    ),

    /*
       外卖配達員
    */

    NPC(
      1900,
      1870,
      "delivery",
      "yellow",
      "delivery",
      170,
      120,
      {
        gender:"male"
      }
    ),

    /*
       傘の女性
    */

    NPC(
      2250,
      1940,
      "street",
      "green",
      "umbrella",
      170,
      100,
      {
        gender:"female"
      }
    ),

    /*
       果物屋店主
    */

    NPC(
      2570,
      1670,
      "shopkeeper",
      "brown",
      "shop",
      60,
      45,
      {
        gender:"male"
      }
    ),

    /*
       路地のおばあさん
    */

    NPC(
      690,
      1150,
      "elder",
      "purple",
      "wander",
      90,
      140,
      {
        gender:"elderFemale"
      }
    ),

    /*
       東路地の配達員
    */

    NPC(
      2900,
      1160,
      "delivery",
      "blue",
      "delivery",
      80,
      130,
      {
        gender:"female"
      }
    ),

    /*
       牛肉面を食べている客
    */

    NPC(
      1130,
      2780,
      "street",
      "gray",
      "eat",
      25,
      25,
      {
        gender:"male"
      }
    ),

    /*
       茶庄付近
    */

    NPC(
      2420,
      2780,
      "street",
      "red",
      "wander",
      110,
      70,
      {
        gender:"female"
      }
    ),

    /*
       南街の傘
    */

    NPC(
      1650,
      3150,
      "street",
      "navy",
      "umbrella",
      150,
      80,
      {
        gender:"male"
      }
    ),

    /*
       深夜の学生
    */

    NPC(
      1950,
      3270,
      "student",
      "black",
      "phone",
      130,
      60,
      {
        gender:"male"
      }
    ),

    /*
       西路地の店主
    */

    NPC(
      590,
      2050,
      "shopkeeper",
      "green",
      "shop",
      45,
      45,
      {
        gender:"male"
      }
    ),

    /*
       東路地のおじいさん
    */

    NPC(
      2830,
      2070,
      "elder",
      "gray",
      "wander",
      90,
      110,
      {
        gender:"elderMale"
      }
    ),


    /* ======================================================
       追加NPC
       街の密度を増加
    ====================================================== */

    NPC(
      1460,
      1860,
      "street",
      "cream",
      "wander",
      100,
      70
    ),

    NPC(
      2140,
      2070,
      "student",
      "purple",
      "phone",
      80,
      60
    ),

    NPC(
      1380,
      2260,
      "shopkeeper",
      "red",
      "shop",
      50,
      35
    ),

    NPC(
      2260,
      2260,
      "shopkeeper",
      "brown",
      "shop",
      50,
      35
    ),

    NPC(
      1750,
      2800,
      "elder",
      "green",
      "wander",
      90,
      60,
      {
        gender:"elderFemale"
      }
    ),

    NPC(
      2040,
      2860,
      "delivery",
      "yellow",
      "delivery",
      120,
      80
    )
  ],


  /* --------------------------------------------------------
     PROPS
  -------------------------------------------------------- */

  props: [

    {type:"bike",x:1010,y:1700},
    {type:"bike",x:1060,y:1710},
    {type:"bike",x:1110,y:1700},

    {type:"bike",x:2460,y:1700},
    {type:"bike",x:2510,y:1710},

    {type:"bike",x:680,y:920},
    {type:"bike",x:710,y:940},

    {type:"scooter",x:880,y:1900},
    {type:"scooter",x:920,y:1950},

    {type:"scooter",x:2650,y:1900},

    {type:"scooter",x:700,y:2740},
    {type:"scooter",x:2820,y:2750},

    {type:"acstack",x:860,y:1230},
    {type:"acstack",x:2700,y:1230},

    {type:"acstack",x:850,y:2380},
    {type:"acstack",x:2720,y:2390},

    {type:"acstack",x:620,y:760},
    {type:"acstack",x:2960,y:760},

    {type:"boxes",x:850,y:1660},
    {type:"boxes",x:2710,y:1660},

    {type:"boxes",x:620,y:2700},
    {type:"boxes",x:2950,y:2700},

    {type:"trash",x:910,y:1600},
    {type:"trash",x:2660,y:1600},

    {type:"trash",x:630,y:2400},
    {type:"trash",x:2960,y:2420},

    {type:"plant",x:1200,y:1660},
    {type:"plant",x:2350,y:1660},

    {type:"plant",x:930,y:2700},
    {type:"plant",x:2620,y:2700},

    {type:"plant",x:700,y:1110},
    {type:"plant",x:2870,y:1110},

    {type:"vending",x:850,y:2160},
    {type:"vending",x:2720,y:2160},

    {type:"utility",x:580,y:1300},
    {type:"utility",x:3000,y:1300},

    {type:"utility",x:580,y:2500},
    {type:"utility",x:2990,y:2500},

    {type:"bench",x:1370,y:1340},
    {type:"bench",x:2180,y:1340},

    {type:"bench",x:1370,y:2450},
    {type:"bench",x:2180,y:2450},

    {type:"drain",x:1580,y:2100},
    {type:"drain",x:1980,y:2100},

    {type:"drain",x:1580,y:2810},
    {type:"drain",x:1980,y:2810},

    {type:"barrier",x:1800,y:980},

    {type:"cone",x:1730,y:980},
    {type:"cone",x:1870,y:980},

    {type:"umbrella",x:1260,y:2100},
    {type:"umbrella",x:2350,y:2100}
  ],


  /* --------------------------------------------------------
     STALLS
  -------------------------------------------------------- */

  stalls: [

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


  /* --------------------------------------------------------
     CLOTHES LINES
  -------------------------------------------------------- */

  clothesLines: [

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


  /* --------------------------------------------------------
     WIRES
  -------------------------------------------------------- */

  wires: [

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


  /* --------------------------------------------------------
     EXIT
  -------------------------------------------------------- */

  exits: [

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
   MAP HELPERS
========================================================== */

function getMap(
  mapId
) {

  return MAPS[
    mapId
  ];
}


function getBuilding(
  mapId,
  buildingId
) {

  const map =
    MAPS[
      mapId
    ];


  if (
    !map
  ) {

    return null;
  }


  return (
    map.buildings.find(
      building =>
        building.id ===
        buildingId
    ) ||
    null
  );
}


function getEnterableBuildings(
  mapId
) {

  const map =
    MAPS[
      mapId
    ];


  if (
    !map
  ) {

    return [];
  }


  return map.buildings.filter(
    building =>
      building.enter &&
      building.entrance
  );
}


/* ==========================================================
   COMPATIBILITY GLOBALS
========================================================== */

let WORLD = {

  width:
    MAPS[
      START_MAP
    ].width,

  height:
    MAPS[
      START_MAP
    ].height
};


let ROADS =
  MAPS[
    START_MAP
  ].roads;


let PLAZAS =
  MAPS[
    START_MAP
  ].plazas;


let BUILDINGS =
  MAPS[
    START_MAP
  ].buildings;


let TREES =
  MAPS[
    START_MAP
  ].trees;


let STREET_LIGHTS =
  MAPS[
    START_MAP
  ].streetLights;


let STREET_SIGNS =
  MAPS[
    START_MAP
  ].streetSigns;


let NPCS =
  MAPS[
    START_MAP
  ].npcs;


let PROPS =
  MAPS[
    START_MAP
  ].props;


let STALLS =
  MAPS[
    START_MAP
  ].stalls;


/* ==========================================================
   APPLY MAP
========================================================== */

function applyMapGlobals(
  mapId
) {

  const map =
    MAPS[
      mapId
    ];


  if (
    !map
  ) {

    console.error(
      "Unknown map:",
      mapId
    );

    return;
  }


  WORLD = {

    width:
      map.width,

    height:
      map.height
  };


  ROADS =
    map.roads ||
    [];


  PLAZAS =
    map.plazas ||
    [];


  BUILDINGS =
    map.buildings ||
    [];


  TREES =
    map.trees ||
    [];


  STREET_LIGHTS =
    map.streetLights ||
    [];


  STREET_SIGNS =
    map.streetSigns ||
    [];


  NPCS =
    map.npcs ||
    [];


  PROPS =
    map.props ||
    [];


  STALLS =
    map.stalls ||
    [];
}
