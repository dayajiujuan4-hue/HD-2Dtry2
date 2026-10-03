/* ==========================================================
   杭州探索録3
   夜行杭州

   HIGH DENSITY DISTRICT
   Ver.0.7
========================================================== */

const WORLD = {
  width: 3800,
  height: 3900
};


/* ==========================================================
   ROADS
========================================================== */

const ROADS = [

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
    type:"street"
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
    type:"street"
  },

  {
    x:1950,
    y:2500,
    w:1330,
    h:400,
    type:"street"
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

  /* 新しい細街路 */

  {
    x:1050,
    y:2050,
    w:250,
    h:1000,
    type:"backstreet"
  },

  {
    x:2480,
    y:2050,
    w:250,
    h:950,
    type:"backstreet"
  },

  {
    x:500,
    y:3200,
    w:2800,
    h:250,
    type:"backstreet"
  }
];


/* ==========================================================
   PLAZAS
========================================================== */

const PLAZAS = [

  {
    x:1200,
    y:1150,
    w:500,
    h:300,
    type:"city"
  },

  {
    x:2170,
    y:2050,
    w:600,
    h:400,
    type:"commercial"
  },

  {
    x:900,
    y:2920,
    w:500,
    h:350,
    type:"old"
  }
];


/* ==========================================================
   BUILDINGS
========================================================== */

const BUILDINGS = [

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
    w:570,
    h:290,
    floors:9,
    sign:"夜杭州",
    neon:"#ff5757",
    visualType:"oldMixed"
  },

  {
    id:"westBlock2",
    x:1110,
    y:1080,
    w:300,
    h:310,
    floors:6,
    sign:"小河里",
    neon:"#ffb14d",
    visualType:"residential"
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
    id:"westAlleyA",
    x:930,
    y:2110,
    w:300,
    h:380,
    floors:5,
    sign:"阿良修理",
    neon:"#ff8b55",
    visualType:"oldMixed"
  },

  {
    id:"westAlleyB",
    x:1280,
    y:2140,
    w:140,
    h:350,
    floors:4,
    sign:"住宿",
    neon:"#d35cff",
    visualType:"residential"
  },

  {
    id:"restaurant",
    x:930,
    y:2960,
    w:430,
    h:230,
    floors:4,
    sign:"钱塘深夜食堂",
    neon:"#ff5a55",
    visualType:"dinerBuilding",

    enter:"restaurant",

    entrance:{
      x:1145,
      y:3205
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
    id:"eastAlleyA",
    x:2210,
    y:2110,
    w:220,
    h:350,
    floors:5,
    sign:"手机维修",
    neon:"#50ddff",
    visualType:"oldMixed"
  },

  {
    id:"eastAlleyB",
    x:2760,
    y:2110,
    w:70,
    h:350,
    floors:4,
    sign:"咖啡",
    neon:"#ff9c5b",
    visualType:"residential"
  },

  {
    id:"convenience",
    x:2200,
    y:2930,
    w:520,
    h:260,
    floors:7,
    sign:"24H 便利店",
    neon:"#43e8ff",
    visualType:"apartmentStore",

    enter:"convenience",

    entrance:{
      x:2460,
      y:3205
    }
  },

  {
    id:"office",
    x:2200,
    y:3450,
    w:650,
    h:350,
    floors:16,
    sign:"未来都市研究所",
    neon:"#d55cff",
    visualType:"futureLab",

    enter:"office",

    entrance:{
      x:2525,
      y:3435
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
  },

  {
    id:"southTinyA",
    x:930,
    y:3260,
    w:190,
    h:160,
    floors:3,
    sign:"烟酒",
    neon:"#ff5d55",
    visualType:"oldMixed"
  },

  {
    id:"southTinyB",
    x:1160,
    y:3260,
    w:190,
    h:160,
    floors:3,
    sign:"面馆",
    neon:"#ffb34e",
    visualType:"dinerBuilding"
  },

  {
    id:"eastSouthTiny",
    x:2890,
    y:3000,
    w:360,
    h:180,
    floors:5,
    sign:"快递站",
    neon:"#4fd9ff",
    visualType:"oldMixed"
  }
];


/* ==========================================================
   STREET TREES
========================================================== */

const TREES = [

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
];


/* ==========================================================
   STREET LIGHTS
========================================================== */

const STREET_LIGHTS = [

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
];


/* ==========================================================
   HIGH DENSITY STREET PROPS
========================================================== */

const PROPS = [

  /* bicycles */

  {type:"bike",x:1320,y:2340},
  {type:"bike",x:1320,y:2380},
  {type:"bike",x:1320,y:2420},

  {type:"bike",x:2290,y:2700},
  {type:"bike",x:2290,y:2740},

  {type:"bike",x:3050,y:2140},

  /* scooters */

  {type:"scooter",x:890,y:2280},
  {type:"scooter",x:2740,y:2300},
  {type:"scooter",x:1300,y:3080},

  /* vending machines */

  {type:"vending",x:890,y:2150},
  {type:"vending",x:2780,y:2440},
  {type:"vending",x:1380,y:1320},

  /* trash */

  {type:"trash",x:940,y:2500},
  {type:"trash",x:1270,y:2510},
  {type:"trash",x:2780,y:2520},

  /* cardboard */

  {type:"boxes",x:1010,y:2500},
  {type:"boxes",x:2670,y:2480},
  {type:"boxes",x:3100,y:2950},

  /* plants */

  {type:"plant",x:900,y:2670},
  {type:"plant",x:950,y:2670},
  {type:"plant",x:1000,y:2670},

  {type:"plant",x:2730,y:2700},
  {type:"plant",x:2780,y:2700},

  /* benches */

  {type:"bench",x:1260,y:1300},
  {type:"bench",x:2460,y:2300},

  /* construction */

  {type:"barrier",x:3100,y:1600},
  {type:"barrier",x:3170,y:1600},
  {type:"cone",x:3060,y:1640},
  {type:"cone",x:3220,y:1640},

  /* utility boxes */

  {type:"utility",x:1330,y:2230},
  {type:"utility",x:2260,y:2250},

  /* umbrellas */

  {type:"umbrella",x:1050,y:2750},

  /* drains */

  {type:"drain",x:1550,y:2350},
  {type:"drain",x:2050,y:2650},

  /* alley AC units */

  {type:"acstack",x:900,y:2450},
  {type:"acstack",x:2760,y:2400}
];


/* ==========================================================
   FOOD STALLS
========================================================== */

const STALLS = [

  {
    x:1030,
    y:2790,
    name:"烤串",
    color:"#ff654d"
  },

  {
    x:1190,
    y:2790,
    name:"葱包桧",
    color:"#ffb64e"
  },

  {
    x:2600,
    y:2320,
    name:"夜咖啡",
    color:"#d75cff"
  }
];


/* ==========================================================
   STREET SIGNS
========================================================== */

const STREET_SIGNS = [

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
  }
];


/* ==========================================================
   NPCS
========================================================== */

const NPCS = [

  {
    x:1580,
    y:1800,
    color:"#526c7a",
    type:"phone"
  },

  {
    x:1980,
    y:1700,
    color:"#704d69",
    type:"walk"
  },

  {
    x:720,
    y:2700,
    color:"#536e5e",
    type:"umbrella"
  },

  {
    x:2950,
    y:2700,
    color:"#67556e",
    type:"walk"
  },

  {
    x:1600,
    y:800,
    color:"#6b654e",
    type:"walk"
  },

  {
    x:2010,
    y:1110,
    color:"#466174",
    type:"phone"
  },

  {
    x:1570,
    y:3150,
    color:"#574d67",
    type:"walk"
  },

  {
    x:1060,
    y:2830,
    color:"#795244",
    type:"eat"
  },

  {
    x:1210,
    y:2840,
    color:"#536477",
    type:"eat"
  },

  {
    x:2620,
    y:2380,
    color:"#75516e",
    type:"sit"
  }
];


/* ==========================================================
   INTERIORS
========================================================== */

const INTERIORS = {

  convenience: {

    title:"24H 便利店",

    sub:
      "QIANJIANG · CONVENIENCE STORE",

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

    title:"钱塘深夜食堂",

    sub:
      "LATE NIGHT DINER",

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

    title:"未来都市研究所",

    sub:
      "FUTURE CITY LAB · LOBBY",

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
  }
};
