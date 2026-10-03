/* ==========================================================
   杭州探索録3｜夜行杭州
   GAME Ver.0.8

   MULTI MAP + CHARACTER REDESIGN

   MAP 01 : 钱江新城
   MAP 02 : 杭州旧城区

   world.js Ver.0.8 専用
========================================================== */


/* ==========================================================
   CANVAS / UI
========================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const interactionBox =
  document.getElementById("interaction");

const interactionText =
  document.getElementById("interactionText");

const locationTitle =
  document.getElementById("locationTitle");

const locationSub =
  document.getElementById("locationSub");

let W = 0;
let H = 0;

const DPR = Math.min(
  window.devicePixelRatio || 1,
  2
);

function resize() {

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W * DPR;
  canvas.height = H * DPR;

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(
    DPR, 0,
    0, DPR,
    0, 0
  );
}

window.addEventListener(
  "resize",
  resize
);

resize();


/* ==========================================================
   STATE
========================================================== */

let currentMapId = START_MAP;

applyMapGlobals(
  currentMapId
);

let scene = "city";

let currentInterior = null;

let interactionTarget = null;

let returnPosition = {
  mapId: START_MAP,
  x: MAPS[START_MAP].playerSpawn.x,
  y: MAPS[START_MAP].playerSpawn.y
};


/* ==========================================================
   TRANSITION
========================================================== */

const transition = {

  active: false,

  phase: "idle",

  alpha: 0,

  timer: 0,

  targetMap: null,

  targetX: 0,

  targetY: 0,

  title: "",

  subtitle: "",

  chapter: "",

  weather: "",

  clock: ""
};


/* ==========================================================
   PLAYER
========================================================== */

const player = {

  x: MAPS[START_MAP].playerSpawn.x,

  y: MAPS[START_MAP].playerSpawn.y,

  radius: 18,

  speed: 270,

  moving: false,

  step: 0,

  direction: "up",

  type: "player",

  gender: "male",

  palette: "player",

  action: "walk"
};


const camera = {

  x: player.x,
  y: player.y
};


/* ==========================================================
   INPUT
========================================================== */

const keys = {};

let ePressed = false;

window.addEventListener(
  "keydown",
  event => {

    const key =
      event.key.toLowerCase();

    keys[key] = true;

    if (
      key === "e" &&
      !event.repeat
    ) {

      ePressed = true;
    }

    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright"
      ].includes(key)
    ) {

      event.preventDefault();
    }
  }
);

window.addEventListener(
  "keyup",
  event => {

    keys[
      event.key.toLowerCase()
    ] = false;
  }
);


/* ==========================================================
   HELPERS
========================================================== */

function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function distance(
  x1,
  y1,
  x2,
  y2
) {

  return Math.hypot(
    x2 - x1,
    y2 - y1
  );
}


function noise(n) {

  const x =
    Math.sin(
      n * 12.9898
    ) *
    43758.5453;

  return x -
    Math.floor(x);
}


function glow(
  color,
  blur
) {

  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}


function noGlow() {

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}


function roundRectPath(
  x,
  y,
  w,
  h,
  r
) {

  r = Math.min(
    r,
    w / 2,
    h / 2
  );

  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.lineTo(
    x + w - r,
    y
  );

  ctx.quadraticCurveTo(
    x + w,
    y,
    x + w,
    y + r
  );

  ctx.lineTo(
    x + w,
    y + h - r
  );

  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r,
    y + h
  );

  ctx.lineTo(
    x + r,
    y + h
  );

  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r
  );

  ctx.lineTo(
    x,
    y + r
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  );

  ctx.closePath();
}


function getCurrentMap() {

  return MAPS[currentMapId];
}


function isOnScreen(
  p,
  margin = 300
) {

  return !(
    p.x < -margin ||
    p.x > W + margin ||
    p.y < -margin ||
    p.y > H + margin
  );
}


/* ==========================================================
   PROJECTION
========================================================== */

const VIEW = {

  playerScreenY: .70,

  depthScale: .51,

  perspective: .00029
};


function project(
  x,
  y,
  z = 0
) {

  const dy =
    y - camera.y;

  let scale =
    1 +
    dy *
    VIEW.perspective;

  scale =
    clamp(
      scale,
      .46,
      1.54
    );

  return {

    x:
      W / 2 +
      (
        x -
        camera.x
      ) *
      scale,

    y:
      H *
      VIEW.playerScreenY +
      dy *
      VIEW.depthScale -
      z *
      scale,

    scale
  };
}


/* ==========================================================
   COLLISION
========================================================== */

function circleRectCollision(
  cx,
  cy,
  radius,
  rect
) {

  const closestX =
    clamp(
      cx,
      rect.x,
      rect.x + rect.w
    );

  const closestY =
    clamp(
      cy,
      rect.y,
      rect.y + rect.h
    );

  const dx =
    cx -
    closestX;

  const dy =
    cy -
    closestY;

  return (
    dx * dx +
    dy * dy
    <
    radius * radius
  );
}


function getCityColliders() {

  return BUILDINGS.map(
    building => ({

      x: building.x,

      y: building.y,

      w: building.w,

      h: building.h
    })
  );
}


function getInteriorColliders() {

  if (
    currentInterior ===
    "convenience"
  ) {

    return [

      {x:130,y:190,w:150,h:390},

      {x:355,y:190,w:120,h:390},

      {x:575,y:190,w:120,h:390},

      {x:790,y:190,w:130,h:390},

      {x:120,y:70,w:800,h:90},

      {x:630,y:610,w:300,h:70}
    ];
  }


  if (
    currentInterior ===
    "restaurant"
  ) {

    return [

      {x:100,y:80,w:850,h:120},

      {x:140,y:260,w:600,h:80},

      {x:780,y:260,w:150,h:300},

      {x:130,y:470,w:140,h:100},

      {x:340,y:470,w:140,h:100},

      {x:550,y:470,w:140,h:100}
    ];
  }


  if (
    currentInterior ===
    "office"
  ) {

    return [

      {x:120,y:100,w:860,h:100},

      {x:150,y:300,w:250,h:120},

      {x:700,y:300,w:250,h:120},

      {x:170,y:520,w:220,h:90},

      {x:710,y:520,w:220,h:90}
    ];
  }


  if (
    currentInterior ===
    "noodle"
  ) {

    return [

      {x:100,y:80,w:800,h:130},

      {x:120,y:270,w:590,h:80},

      {x:760,y:250,w:130,h:300},

      {x:130,y:470,w:150,h:90},

      {x:350,y:470,w:150,h:90},

      {x:570,y:470,w:150,h:90}
    ];
  }


  if (
    currentInterior ===
    "tea"
  ) {

    return [

      {x:100,y:80,w:800,h:120},

      {x:130,y:260,w:220,h:110},

      {x:650,y:260,w:220,h:110},

      {x:160,y:500,w:180,h:90},

      {x:660,y:500,w:180,h:90}
    ];
  }


  return [];
}


/* ==========================================================
   MAP EXIT DETECTION
========================================================== */

function pointInsideRect(
  x,
  y,
  rect
) {

  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}


function findMapExit(
  x,
  y
) {

  const map =
    getCurrentMap();

  for (
    const exit of
    map.exits || []
  ) {

    if (
      pointInsideRect(
        x,
        y,
        exit
      )
    ) {

      return exit;
    }
  }

  return null;
}


/* ==========================================================
   MOVEMENT
========================================================== */

function canMoveTo(
  x,
  y
) {

  if (
    scene === "city"
  ) {

    /*
       Exit zones are allowed to touch
       the actual world boundary.
    */

    const exit =
      findMapExit(
        x,
        y
      );

    if (
      !exit &&
      (
        x < 35 ||
        y < 35 ||
        x > WORLD.width - 35 ||
        y > WORLD.height - 35
      )
    ) {

      return false;
    }


    for (
      const rect of
      getCityColliders()
    ) {

      if (
        circleRectCollision(
          x,
          y,
          player.radius,
          rect
        )
      ) {

        return false;
      }
    }

    return true;
  }


  const interior =
    INTERIORS[
      currentInterior
    ];


  if (
    !interior
  ) {

    return false;
  }


  if (
    x < 50 ||
    y < 50 ||
    x >
    interior.width - 50 ||
    y >
    interior.height - 50
  ) {

    return false;
  }


  for (
    const rect of
    getInteriorColliders()
  ) {

    if (
      circleRectCollision(
        x,
        y,
        player.radius,
        rect
      )
    ) {

      return false;
    }
  }


  return true;
}


/* ==========================================================
   PLAYER UPDATE
========================================================== */

function updatePlayer(dt) {

  if (
    transition.active
  ) {

    return;
  }


  let dx = 0;
  let dy = 0;


  if (
    keys["w"] ||
    keys["arrowup"]
  ) {

    dy--;

    player.direction =
      "up";
  }


  if (
    keys["s"] ||
    keys["arrowdown"]
  ) {

    dy++;

    player.direction =
      "down";
  }


  if (
    keys["a"] ||
    keys["arrowleft"]
  ) {

    dx--;

    player.direction =
      "left";
  }


  if (
    keys["d"] ||
    keys["arrowright"]
  ) {

    dx++;

    player.direction =
      "right";
  }


  player.moving =
    dx !== 0 ||
    dy !== 0;


  if (
    player.moving
  ) {

    const len =
      Math.hypot(
        dx,
        dy
      );


    dx /= len;
    dy /= len;


    const nx =
      player.x +
      dx *
      player.speed *
      dt;


    const ny =
      player.y +
      dy *
      player.speed *
      dt;


    if (
      canMoveTo(
        nx,
        player.y
      )
    ) {

      player.x = nx;
    }


    if (
      canMoveTo(
        player.x,
        ny
      )
    ) {

      player.y = ny;
    }


    player.step +=
      dt * 10.5;
  }


  camera.x +=
    (
      player.x -
      camera.x
    ) *
    .11;


  camera.y +=
    (
      player.y -
      camera.y
    ) *
    .10;


  if (
    scene === "city"
  ) {

    const exit =
      findMapExit(
        player.x,
        player.y
      );


    if (
      exit &&
      !transition.active
    ) {

      beginMapTransition(
        exit
      );
    }
  }
}


/* ==========================================================
   MAP TRANSITION
========================================================== */

function beginMapTransition(
  exit
) {

  const target =
    MAPS[
      exit.targetMap
    ];


  if (
    !target
  ) {

    return;
  }


  transition.active = true;

  transition.phase =
    "fadeOut";

  transition.alpha = 0;

  transition.timer = 0;

  transition.targetMap =
    exit.targetMap;

  transition.targetX =
    exit.targetX;

  transition.targetY =
    exit.targetY;

  transition.title =
    target.name;

  transition.subtitle =
    target.district;

  transition.chapter =
    target.chapter;

  transition.weather =
    target.weather;

  transition.clock =
    target.time;


  player.moving = false;
}


function applyMapTransition() {

  currentMapId =
    transition.targetMap;


  applyMapGlobals(
    currentMapId
  );


  player.x =
    transition.targetX;

  player.y =
    transition.targetY;


  camera.x =
    player.x;

  camera.y =
    player.y;


  const map =
    getCurrentMap();


  locationTitle.textContent =
    map.name;


  locationSub.textContent =
    `${map.englishName} · ${map.district}`;


  transition.phase =
    "title";

  transition.timer = 0;
}


function updateTransition(dt) {

  if (
    !transition.active
  ) {

    return;
  }


  if (
    transition.phase ===
    "fadeOut"
  ) {

    transition.alpha +=
      dt * 2.3;


    if (
      transition.alpha >= 1
    ) {

      transition.alpha = 1;

      applyMapTransition();
    }
  }


  else if (
    transition.phase ===
    "title"
  ) {

    transition.timer += dt;


    if (
      transition.timer >
      1.55
    ) {

      transition.phase =
        "fadeIn";
    }
  }


  else if (
    transition.phase ===
    "fadeIn"
  ) {

    transition.alpha -=
      dt * 1.65;


    if (
      transition.alpha <= 0
    ) {

      transition.alpha = 0;

      transition.active = false;

      transition.phase =
        "idle";
    }
  }
}


/* ==========================================================
   BUILDING INTERACTION
========================================================== */

function updateInteraction() {

  interactionTarget = null;


  if (
    transition.active
  ) {

    interactionBox
      .classList
      .add("hidden");

    ePressed = false;

    return;
  }


  if (
    scene === "city"
  ) {

    for (
      const building of
      BUILDINGS
    ) {

      if (
        !building.enter ||
        !building.entrance
      ) {

        continue;
      }


      if (
        distance(
          player.x,
          player.y,
          building.entrance.x,
          building.entrance.y
        ) <
        105
      ) {

        interactionTarget = {

          type: "enter",

          building
        };

        break;
      }
    }
  }


  else {

    const interior =
      INTERIORS[
        currentInterior
      ];


    if (
      interior &&
      distance(
        player.x,
        player.y,
        interior.exit.x,
        interior.exit.y
      ) <
      78
    ) {

      interactionTarget = {
        type: "exit"
      };
    }
  }


  if (
    interactionTarget
  ) {

    interactionBox
      .classList
      .remove("hidden");


    if (
      interactionTarget.type ===
      "enter"
    ) {

      interactionText.textContent =
        interactionTarget
          .building
          .sign +
        " に入る";
    }

    else {

      interactionText.textContent =
        "街へ出る";
    }
  }


  else {

    interactionBox
      .classList
      .add("hidden");
  }


  if (
    ePressed &&
    interactionTarget
  ) {

    if (
      interactionTarget.type ===
      "enter"
    ) {

      enterBuilding(
        interactionTarget
          .building
      );
    }

    else {

      exitBuilding();
    }
  }


  ePressed = false;
}


/* ==========================================================
   ENTER / EXIT
========================================================== */

function getExteriorReturnPosition(
  building
) {

  const entrance =
    building.entrance;


  const gap = 72;


  switch (
    entrance.side
  ) {

    case "north":

      return {
        x: entrance.x,
        y: building.y - gap
      };


    case "south":

      return {
        x: entrance.x,
        y:
          building.y +
          building.h +
          gap
      };


    case "west":

      return {
        x:
          building.x -
          gap,

        y:
          entrance.y
      };


    case "east":

      return {
        x:
          building.x +
          building.w +
          gap,

        y:
          entrance.y
      };


    default:

      return {
        x: entrance.x,
        y: entrance.y + gap
      };
  }
}


function enterBuilding(
  building
) {

  const outside =
    getExteriorReturnPosition(
      building
    );


  returnPosition = {

    mapId:
      currentMapId,

    x:
      outside.x,

    y:
      outside.y
  };


  currentInterior =
    building.enter;


  scene =
    "interior";


  const interior =
    INTERIORS[
      currentInterior
    ];


  if (
    !interior
  ) {

    console.error(
      "Unknown interior:",
      currentInterior
    );

    scene = "city";

    currentInterior = null;

    return;
  }


  player.x =
    interior.spawn.x;

  player.y =
    interior.spawn.y;


  camera.x =
    player.x;

  camera.y =
    player.y;


  locationTitle.textContent =
    interior.title;


  locationSub.textContent =
    interior.sub;
}


function exitBuilding() {

  scene = "city";


  currentMapId =
    returnPosition.mapId;


  applyMapGlobals(
    currentMapId
  );


  currentInterior = null;


  player.x =
    returnPosition.x;

  player.y =
    returnPosition.y;


  camera.x =
    player.x;

  camera.y =
    player.y;


  const map =
    getCurrentMap();


  locationTitle.textContent =
    map.name;


  locationSub.textContent =
    `${map.englishName} · ${map.district}`;
}


/* ==========================================================
   NIGHT BACKGROUND
========================================================== */

function drawNightBackground() {

  const map =
    getCurrentMap();


  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      H
    );


  if (
    scene === "city" &&
    map.ambience ===
    "oldtown"
  ) {

    gradient.addColorStop(
      0,
      "#050608"
    );

    gradient.addColorStop(
      .35,
      "#0d1012"
    );

    gradient.addColorStop(
      .72,
      "#171512"
    );

    gradient.addColorStop(
      1,
      "#090908"
    );
  }

  else {

    gradient.addColorStop(
      0,
      "#01030a"
    );

    gradient.addColorStop(
      .34,
      "#06101a"
    );

    gradient.addColorStop(
      .72,
      "#10131d"
    );

    gradient.addColorStop(
      1,
      "#07090e"
    );
  }


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );
}


/* ==========================================================
   FLOOR
========================================================== */

function drawGroundQuad(
  rect,
  fill,
  stroke =
    "rgba(100,130,138,.15)"
) {

  const a =
    project(
      rect.x,
      rect.y
    );

  const b =
    project(
      rect.x +
      rect.w,
      rect.y
    );

  const c =
    project(
      rect.x +
      rect.w,
      rect.y +
      rect.h
    );

  const d =
    project(
      rect.x,
      rect.y +
      rect.h
    );


  ctx.fillStyle =
    fill;


  ctx.beginPath();

  ctx.moveTo(
    a.x,
    a.y
  );

  ctx.lineTo(
    b.x,
    b.y
  );

  ctx.lineTo(
    c.x,
    c.y
  );

  ctx.lineTo(
    d.x,
    d.y
  );

  ctx.closePath();

  ctx.fill();


  ctx.strokeStyle =
    stroke;

  ctx.lineWidth = 1;

  ctx.stroke();
}


function drawPlaza(
  plaza
) {

  let fill =
    "#182126";


  if (
    plaza.type ===
    "commercial"
  ) {

    fill =
      "#141b20";
  }


  if (
    plaza.type ===
    "old"
  ) {

    fill =
      "#191713";
  }


  drawGroundQuad(
    plaza,
    fill
  );


  const step = 70;


  for (
    let xx =
      plaza.x + 20;

    xx <
      plaza.x +
      plaza.w;

    xx += step
  ) {

    const p1 =
      project(
        xx,
        plaza.y
      );

    const p2 =
      project(
        xx,
        plaza.y +
        plaza.h
      );


    ctx.strokeStyle =
      "rgba(140,145,140,.045)";


    ctx.beginPath();

    ctx.moveTo(
      p1.x,
      p1.y
    );

    ctx.lineTo(
      p2.x,
      p2.y
    );

    ctx.stroke();
  }


  for (
    let yy =
      plaza.y + 20;

    yy <
      plaza.y +
      plaza.h;

    yy += step
  ) {

    const p1 =
      project(
        plaza.x,
        yy
      );

    const p2 =
      project(
        plaza.x +
        plaza.w,
        yy
      );


    ctx.beginPath();

    ctx.moveTo(
      p1.x,
      p1.y
    );

    ctx.lineTo(
      p2.x,
      p2.y
    );

    ctx.stroke();
  }
}


function drawCityFloor() {

  const map =
    getCurrentMap();


  ctx.fillStyle =
    map.ambience ===
    "oldtown"
    ? "#171713"
    : "#11171c";


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  for (
    const road of
    ROADS
  ) {

    let fill =
      "#0a1015";


    if (
      road.type ===
      "alley"
    ) {

      fill =
        map.ambience ===
        "oldtown"
        ? "#11110f"
        : "#0b0e11";
    }


    else if (
      road.type ===
      "backstreet"
    ) {

      fill =
        map.ambience ===
        "oldtown"
        ? "#15130f"
        : "#0d1012";
    }


    else if (
      road.type ===
      "oldmain"
    ) {

      fill =
        "#151411";
    }


    else if (
      road.type ===
      "tiny"
    ) {

      fill =
        "#0e0f0d";
    }


    else if (
      road.type ===
      "transition"
    ) {

      fill =
        "#11161a";
    }


    drawGroundQuad(
      road,
      fill
    );
  }


  PLAZAS.forEach(
    drawPlaza
  );


  drawRoadDetails();

  drawPuddles();
}


/* ==========================================================
   ROAD DETAILS
========================================================== */

function drawRoadDetails() {

  const map =
    getCurrentMap();


  if (
    map.ambience ===
    "future"
  ) {

    for (
      const x of
      [
        1600,
        1810,
        2020
      ]
    ) {

      for (
        let y = 80;
        y < 3850;
        y += 155
      ) {

        const a =
          project(
            x,
            y
          );

        const b =
          project(
            x,
            y + 72
          );


        ctx.strokeStyle =
          "rgba(210,220,221,.25)";


        ctx.lineWidth =
          Math.max(
            1,
            4 *
            a.scale
          );


        ctx.beginPath();

        ctx.moveTo(
          a.x,
          a.y
        );

        ctx.lineTo(
          b.x,
          b.y
        );

        ctx.stroke();
      }
    }
  }


  else {

    /*
       旧城区の割れた舗装・補修跡
    */

    for (
      let i = 0;
      i < 170;
      i++
    ) {

      const x =
        noise(
          i * 37
        ) *
        WORLD.width;


      const y =
        noise(
          i * 79
        ) *
        WORLD.height;


      const p =
        project(
          x,
          y
        );


      if (
        !isOnScreen(
          p,
          50
        )
      ) {

        continue;
      }


      ctx.strokeStyle =
        i % 5 === 0
        ? "rgba(166,119,77,.09)"
        : "rgba(255,255,255,.025)";


      ctx.lineWidth =
        Math.max(
          .5,
          p.scale
        );


      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y
      );

      ctx.lineTo(
        p.x +
        8 *
        p.scale,

        p.y +
        17 *
        p.scale
      );

      ctx.lineTo(
        p.x -
        4 *
        p.scale,

        p.y +
        27 *
        p.scale
      );

      ctx.stroke();
    }
  }


  /*
     manholes
  */

  for (
    let i = 0;
    i < 24;
    i++
  ) {

    const x =
      map.ambience ===
      "future"
      ? (
          1520 +
          noise(
            i * 61
          ) *
          560
        )
      : (
          300 +
          noise(
            i * 61
          ) *
          3000
        );


    const y =
      180 +
      i * 140;


    const p =
      project(
        x,
        y
      );


    if (
      !isOnScreen(
        p,
        50
      )
    ) {

      continue;
    }


    ctx.fillStyle =
      "#1d2525";


    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y,

      16 *
      p.scale,

      7 *
      p.scale,

      0,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
      "#394644";

    ctx.stroke();
  }
}


/* ==========================================================
   PUDDLES
========================================================== */

function drawPuddles() {

  const old =
    getCurrentMap()
      .ambience ===
    "oldtown";


  const puddles =
    old
    ? [

        {
          x:1750,
          y:2050,
          rx:120,
          ry:31,
          color:"#ff7658"
        },

        {
          x:1150,
          y:1900,
          rx:90,
          ry:25,
          color:"#ffc15d"
        },

        {
          x:2400,
          y:1950,
          rx:105,
          ry:28,
          color:"#ff5e55"
        },

        {
          x:1800,
          y:2780,
          rx:120,
          ry:28,
          color:"#e57451"
        }
      ]

    : [

        {
          x:1670,
          y:2300,
          rx:100,
          ry:30,
          color:"#4be8ff"
        },

        {
          x:2020,
          y:1770,
          rx:130,
          ry:36,
          color:"#d45cff"
        },

        {
          x:1150,
          y:2700,
          rx:80,
          ry:24,
          color:"#ff5c55"
        },

        {
          x:2590,
          y:2660,
          rx:90,
          ry:28,
          color:"#55eaff"
        }
      ];


  puddles.forEach(
    (
      puddle,
      index
    ) => {

      const p =
        project(
          puddle.x,
          puddle.y
        );


      const s =
        p.scale;


      ctx.fillStyle =
        "rgba(3,8,10,.70)";


      ctx.beginPath();

      ctx.ellipse(
        p.x,
        p.y,

        puddle.rx *
        s,

        puddle.ry *
        s,

        noise(index) *
        .2,

        0,
        Math.PI * 2
      );

      ctx.fill();


      glow(
        puddle.color,
        8 * s
      );


      ctx.strokeStyle =
        puddle.color +
        "45";


      ctx.lineWidth =
        Math.max(
          1,
          s
        );


      ctx.beginPath();

      ctx.ellipse(
        p.x,
        p.y,

        puddle.rx *
        .70 *
        s,

        puddle.ry *
        .38 *
        s,

        0,
        0,
        Math.PI * 2
      );

      ctx.stroke();


      noGlow();
    }
  );
}


/* ==========================================================
   BUILDING STYLE
========================================================== */

function getBuildingStyle(
  building
) {

  switch (
    building.visualType
  ) {

    case "megaTower":

      return {

        wall:"#101827",
        wall2:"#090f1c",

        frame:"#44395c",

        glass:"#15283b",

        neon:
          building.neon,

        warmChance:.18,

        acChance:.04,

        pipes:false,

        fireEscape:false,

        megaScreen:true,

        old:false,

        dense:false
      };


    case "dataCenter":

      return {

        wall:"#121c22",
        wall2:"#091116",

        frame:"#39484e",

        glass:"#10232d",

        neon:
          building.neon,

        warmChance:.08,

        acChance:.22,

        pipes:true,

        fireEscape:true,

        megaScreen:false,

        old:false,

        dense:false
      };


    case "oldMixed":

      return {

        wall:"#25201e",
        wall2:"#121110",

        frame:"#55433b",

        glass:"#1e2425",

        neon:
          building.neon,

        warmChance:.52,

        acChance:.47,

        pipes:true,

        fireEscape:true,

        megaScreen:false,

        old:true,

        dense:false
      };


    case "dinerBuilding":

      return {

        wall:"#2d211d",
        wall2:"#16110f",

        frame:"#60463b",

        glass:"#272322",

        neon:
          building.neon,

        warmChance:.68,

        acChance:.52,

        pipes:true,

        fireEscape:true,

        megaScreen:false,

        old:true,

        dense:false
      };


    case "apartmentStore":

      return {

        wall:"#20292a",
        wall2:"#111718",

        frame:"#465457",

        glass:"#16282d",

        neon:
          building.neon,

        warmChance:.58,

        acChance:.50,

        pipes:true,

        fireEscape:false,

        megaScreen:false,

        old:true,

        dense:false
      };


    case "futureLab":

      return {

        wall:"#12192c",
        wall2:"#090d19",

        frame:"#383d65",

        glass:"#122d3c",

        neon:
          building.neon,

        warmChance:.12,

        acChance:.02,

        pipes:false,

        fireEscape:false,

        megaScreen:true,

        old:false,

        dense:false
      };


    case "residential":

      return {

        wall:"#292521",
        wall2:"#151412",

        frame:"#504a43",

        glass:"#252729",

        neon:
          building.neon,

        warmChance:.66,

        acChance:.55,

        pipes:true,

        fireEscape:true,

        megaScreen:false,

        old:true,

        dense:false
      };


    case "techOffice":

      return {

        wall:"#10232a",
        wall2:"#081418",

        frame:"#34515a",

        glass:"#10313d",

        neon:
          building.neon,

        warmChance:.16,

        acChance:.20,

        pipes:true,

        fireEscape:false,

        megaScreen:true,

        old:false,

        dense:false
      };


    case "oldResidentialDense":

      return {

        wall:"#302923",
        wall2:"#171512",

        frame:"#625247",

        glass:"#202525",

        neon:
          building.neon,

        warmChance:.72,

        acChance:.72,

        pipes:true,

        fireEscape:true,

        megaScreen:false,

        old:true,

        dense:true
      };


    case "oldShop":

      return {

        wall:"#322820",
        wall2:"#18130f",

        frame:"#735643",

        glass:"#292522",

        neon:
          building.neon,

        warmChance:.75,

        acChance:.60,

        pipes:true,

        fireEscape:false,

        megaScreen:false,

        old:true,

        dense:true
      };


    case "fruitShop":

      return {

        wall:"#33281f",
        wall2:"#19130f",

        frame:"#795b42",

        glass:"#29251f",

        neon:
          building.neon,

        warmChance:.85,

        acChance:.45,

        pipes:true,

        fireEscape:false,

        megaScreen:false,

        old:true,

        dense:true
      };


    case "noodleShop":

      return {

        wall:"#38231d",
        wall2:"#1b110e",

        frame:"#70453a",

        glass:"#2a211f",

        neon:
          building.neon,

        warmChance:.90,

        acChance:.50,

        pipes:true,

        fireEscape:false,

        megaScreen:false,

        old:true,

        dense:true
      };


    case "teaShop":

      return {

        wall:"#252b21",
        wall2:"#131711",

        frame:"#53614a",

        glass:"#202820",

        neon:
          building.neon,

        warmChance:.78,

        acChance:.38,

        pipes:true,

        fireEscape:false,

        megaScreen:false,

        old:true,

        dense:true
      };


    default:

      return {

        wall:"#13252c",
        wall2:"#091419",

        frame:"#38535b",

        glass:"#12313d",

        neon:
          building.neon,

        warmChance:.23,

        acChance:.13,

        pipes:false,

        fireEscape:false,

        megaScreen:false,

        old:false,

        dense:false
      };
  }
}


/* ==========================================================
   WINDOW
========================================================== */

function drawWindowRoom(
  x,
  y,
  w,
  h,
  seed,
  style,
  s
) {

  const active =
    noise(seed) >
    .30;


  const warm =
    noise(
      seed + 14
    ) <
    style.warmChance;


  ctx.fillStyle =
    active
    ? (
        warm
        ? "rgba(183,112,59,.33)"
        : "rgba(31,103,128,.27)"
      )
    : "rgba(2,7,10,.91)";


  ctx.fillRect(
    x,
    y,
    w,
    h
  );


  if (
    active
  ) {

    /*
       back wall
    */

    ctx.fillStyle =
      warm
      ? "rgba(98,63,42,.22)"
      : "rgba(31,67,79,.20)";


    ctx.fillRect(
      x + w * .07,
      y + h * .08,
      w * .86,
      h * .78
    );


    /*
       ceiling light
    */

    ctx.fillStyle =
      warm
      ? "rgba(255,219,162,.72)"
      : "rgba(153,231,255,.54)";


    ctx.fillRect(
      x + w * .24,
      y + h * .11,
      w * .50,
      Math.max(
        1,
        2 * s
      )
    );


    /*
       desk
    */

    if (
      noise(
        seed + 70
      ) >
      .28
    ) {

      ctx.fillStyle =
        "rgba(13,17,18,.86)";


      ctx.fillRect(
        x + w * .13,
        y + h * .66,
        w * .67,
        h * .07
      );


      ctx.fillRect(
        x + w * .18,
        y + h * .72,
        w * .05,
        h * .17
      );


      ctx.fillRect(
        x + w * .70,
        y + h * .72,
        w * .05,
        h * .17
      );
    }


    /*
       monitor
    */

    if (
      noise(
        seed + 31
      ) >
      .50
    ) {

      const cyan =
        noise(
          seed + 91
        ) >
        .42;


      glow(
        cyan
        ? "#57eaff"
        : "#c65cff",

        5 * s
      );


      ctx.fillStyle =
        cyan
        ? "rgba(70,225,255,.70)"
        : "rgba(199,86,255,.62)";


      ctx.fillRect(
        x + w * .34,
        y + h * .43,
        w * .23,
        h * .18
      );


      noGlow();
    }


    /*
       silhouette
    */

    if (
      noise(
        seed + 25
      ) >
      .74
    ) {

      const px =
        x +
        w *
        (
          .30 +
          noise(
            seed + 120
          ) *
          .35
        );


      const py =
        y +
        h * .52;


      ctx.fillStyle =
        "rgba(4,7,9,.84)";


      ctx.beginPath();

      ctx.arc(
        px,
        py,

        Math.max(
          2,
          4 * s
        ),

        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.fillRect(
        px -
        4 * s,

        py +
        4 * s,

        8 * s,

        15 * s
      );
    }


    /*
       old town curtain
    */

    if (
      style.dense &&
      noise(
        seed + 401
      ) >
      .62
    ) {

      ctx.fillStyle =
        "rgba(135,82,61,.24)";


      ctx.fillRect(
        x,
        y,
        w * .19,
        h
      );


      ctx.fillRect(
        x +
        w * .81,
        y,
        w * .19,
        h
      );
    }
  }


  /*
     reflection
  */

  ctx.fillStyle =
    "rgba(152,232,255,.045)";


  ctx.beginPath();

  ctx.moveTo(
    x +
    w * .07,
    y
  );

  ctx.lineTo(
    x +
    w * .27,
    y
  );

  ctx.lineTo(
    x +
    w * .70,
    y + h
  );

  ctx.lineTo(
    x +
    w * .49,
    y + h
  );

  ctx.closePath();

  ctx.fill();


  ctx.strokeStyle =
    "rgba(92,124,132,.44)";


  ctx.lineWidth =
    Math.max(
      1,
      1.2 * s
    );


  ctx.strokeRect(
    x,
    y,
    w,
    h
  );
}


/* ==========================================================
   AC
========================================================== */

function drawAC(
  x,
  y,
  s,
  seed
) {

  const w =
    40 * s;

  const h =
    22 * s;


  ctx.fillStyle =
    "#899395";


  ctx.fillRect(
    x,
    y,
    w,
    h
  );


  ctx.fillStyle =
    "#606b6d";


  ctx.fillRect(
    x + 4 * s,
    y + 4 * s,
    20 * s,
    13 * s
  );


  ctx.strokeStyle =
    "#30393c";


  ctx.lineWidth =
    Math.max(
      1,
      s
    );


  ctx.beginPath();

  ctx.arc(
    x + 14 * s,
    y + 10.5 * s,
    6 * s,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  const rotation =
    noise(seed) *
    Math.PI;


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const angle =
      rotation +
      i *
      Math.PI / 2;


    ctx.beginPath();

    ctx.moveTo(
      x + 14 * s,
      y + 10.5 * s
    );

    ctx.lineTo(
      x +
      14 * s +
      Math.cos(angle) *
      5 * s,

      y +
      10.5 * s +
      Math.sin(angle) *
      5 * s
    );

    ctx.stroke();
  }


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x +
      28 * s +
      i *
      2 * s,

      y +
      4 * s
    );

    ctx.lineTo(
      x +
      28 * s +
      i *
      2 * s,

      y +
      17 * s
    );

    ctx.stroke();
  }


  ctx.strokeStyle =
    "#4e595b";


  ctx.beginPath();

  ctx.moveTo(
    x +
    5 * s,
    y + h
  );

  ctx.lineTo(
    x +
    5 * s,
    y +
    h +
    6 * s
  );

  ctx.lineTo(
    x +
    16 * s,
    y +
    h +
    6 * s
  );

  ctx.stroke();


  /*
     drain hose
  */

  ctx.strokeStyle =
    "rgba(130,140,138,.55)";


  ctx.beginPath();

  ctx.moveTo(
    x + w,
    y + h * .7
  );

  ctx.lineTo(
    x +
    w +
    8 * s,

    y +
    h *
    .7
  );

  ctx.lineTo(
    x +
    w +
    8 * s,

    y +
    h +
    12 * s
  );

  ctx.stroke();
}


/* ==========================================================
   PIPES
========================================================== */

function drawPipes(
  x,
  y,
  width,
  height,
  s,
  seed,
  dense = false
) {

  const amount =
    dense
    ? 3
    : 2;


  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const side =
      noise(
        seed +
        i * 90
      ) >
      .5;


    const px =
      side
      ? (
          x +
          width *
          (
            .08 +
            i * .025
          )
        )
      : (
          x +
          width *
          (
            .92 -
            i * .025
          )
        );


    ctx.strokeStyle =
      i === 0
      ? "rgba(111,121,121,.72)"
      : "rgba(82,91,90,.62)";


    ctx.lineWidth =
      Math.max(
        1,
        (
          3 -
          i * .5
        ) *
        s
      );


    ctx.beginPath();

    ctx.moveTo(
      px,
      y -
      height *
      (
        .82 -
        i * .08
      )
    );

    ctx.lineTo(
      px,
      y -
      42 * s
    );

    ctx.lineTo(
      px +
      (
        side
        ? 17
        : -17
      ) *
      s,

      y -
      25 * s
    );

    ctx.stroke();
  }
}


/* ==========================================================
   FIRE ESCAPE
========================================================== */

function drawFireEscape(
  x,
  y,
  width,
  height,
  s
) {

  const fx =
    x +
    width -
    55 * s;


  const top =
    y -
    height * .70;


  const bottom =
    y -
    150 * s;


  ctx.strokeStyle =
    "rgba(100,109,110,.68)";


  ctx.lineWidth =
    Math.max(
      1,
      2 * s
    );


  for (
    let yy = top;
    yy < bottom;
    yy += 78 * s
  ) {

    ctx.strokeRect(
      fx - 34 * s,
      yy,
      64 * s,
      10 * s
    );


    ctx.beginPath();

    ctx.moveTo(
      fx - 27 * s,
      yy + 10 * s
    );

    ctx.lineTo(
      fx + 21 * s,
      yy + 72 * s
    );

    ctx.stroke();
  }
}


/* ==========================================================
   OLD TOWN BALCONIES
========================================================== */

function drawOldBalconies(
  x,
  y,
  width,
  height,
  s,
  seed
) {

  const rows =
    3;


  for (
    let i = 0;
    i < rows;
    i++
  ) {

    if (
      noise(
        seed +
        i * 51
      ) <
      .28
    ) {

      continue;
    }


    const yy =
      y -
      height *
      (
        .32 +
        i * .16
      );


    const bx =
      x +
      width *
      (
        .16 +
        noise(
          seed +
          i * 19
        ) *
        .46
      );


    const bw =
      Math.min(
        115 * s,
        width * .25
      );


    ctx.fillStyle =
      "rgba(33,32,29,.92)";


    ctx.fillRect(
      bx,
      yy,
      bw,
      9 * s
    );


    ctx.strokeStyle =
      "rgba(104,102,94,.68)";


    ctx.lineWidth =
      Math.max(
        1,
        1.4 * s
      );


    for (
      let k = 0;
      k < 6;
      k++
    ) {

      const rx =
        bx +
        k *
        bw / 5;


      ctx.beginPath();

      ctx.moveTo(
        rx,
        yy
      );

      ctx.lineTo(
        rx,
        yy -
        22 * s
      );

      ctx.stroke();
    }


    ctx.beginPath();

    ctx.moveTo(
      bx,
      yy -
      22 * s
    );

    ctx.lineTo(
      bx +
      bw,
      yy -
      22 * s
    );

    ctx.stroke();


    /*
       hanging clothes
    */

    if (
      noise(
        seed +
        i * 101
      ) >
      .48
    ) {

      const colors = [
        "#9b5b4d",
        "#c1b59b",
        "#405c68",
        "#776279"
      ];


      for (
        let c = 0;
        c < 3;
        c++
      ) {

        ctx.fillStyle =
          colors[
            (
              c +
              i
            ) %
            colors.length
          ];


        ctx.fillRect(
          bx +
          15 * s +
          c *
          24 * s,

          yy -
          19 * s,

          14 * s,
          21 * s
        );
      }
    }
  }
}


/* ==========================================================
   GROUND FLOOR
========================================================== */

function drawGroundFloor(
  building,
  style,
  x,
  y,
  width,
  s
) {

  const floorH =
    118 * s;


  ctx.fillStyle =
    style.old
    ? "#100d0b"
    : "#061014";


  ctx.fillRect(
    x,
    y -
    floorH,
    width,
    floorH
  );


  const bays =
    clamp(
      Math.floor(
        width /
        (
          125 * s
        )
      ),
      2,
      9
    );


  const bayW =
    width /
    bays;


  for (
    let i = 0;
    i < bays;
    i++
  ) {

    const bx =
      x +
      i *
      bayW +
      7 * s;


    const bw =
      bayW -
      14 * s;


    const seed =
      building.x +
      building.y +
      i * 811;


    const warm =
      style.old ||
      noise(seed) >
      .52;


    ctx.fillStyle =
      warm
      ? "rgba(203,125,64,.22)"
      : "rgba(48,166,190,.18)";


    ctx.fillRect(
      bx,
      y -
      86 * s,
      bw,
      64 * s
    );


    /*
       shelves / store interior
    */

    if (
      noise(
        seed + 9
      ) >
      .38
    ) {

      ctx.fillStyle =
        "rgba(18,22,23,.78)";


      ctx.fillRect(
        bx +
        bw * .13,
        y -
        46 * s,
        bw * .67,
        6 * s
      );


      for (
        let j = 0;
        j < 5;
        j++
      ) {

        ctx.fillStyle =
          [
            "#ba8053",
            "#528c9a",
            "#a05265",
            "#708c55",
            "#d3b45b"
          ][j];


        ctx.fillRect(
          bx +
          bw * .17 +
          j *
          bw * .11,

          y -
          57 * s,

          4 * s,
          10 * s
        );
      }
    }


    ctx.fillStyle =
      "rgba(142,230,250,.05)";


    ctx.beginPath();

    ctx.moveTo(
      bx,
      y -
      86 * s
    );

    ctx.lineTo(
      bx +
      bw * .25,
      y -
      86 * s
    );

    ctx.lineTo(
      bx +
      bw * .72,
      y -
      22 * s
    );

    ctx.lineTo(
      bx +
      bw * .48,
      y -
      22 * s
    );

    ctx.closePath();

    ctx.fill();


    ctx.strokeStyle =
      style.old
      ? "rgba(124,94,72,.48)"
      : "rgba(83,130,140,.40)";


    ctx.strokeRect(
      bx,
      y -
      86 * s,
      bw,
      64 * s
    );
  }


  /*
     entrance
  */

  const doorX =
    x +
    width * .5;


  ctx.fillStyle =
    style.old
    ? "#17120f"
    : "#0d2229";


  ctx.fillRect(
    doorX -
    33 * s,
    y -
    88 * s,
    66 * s,
    88 * s
  );


  ctx.fillStyle =
    style.old
    ? "rgba(225,156,94,.14)"
    : "rgba(77,182,202,.17)";


  ctx.fillRect(
    doorX -
    27 * s,
    y -
    81 * s,
    25 * s,
    73 * s
  );


  ctx.fillRect(
    doorX +
    2 * s,
    y -
    81 * s,
    25 * s,
    73 * s
  );


  ctx.strokeStyle =
    building.enter
    ? style.neon
    : (
        style.old
        ? "#765b47"
        : "#46646c"
      );


  ctx.lineWidth =
    Math.max(
      1,
      2 * s
    );


  ctx.strokeRect(
    doorX -
    33 * s,
    y -
    88 * s,
    66 * s,
    88 * s
  );


  if (
    building.enter
  ) {

    glow(
      style.neon,
      18 * s
    );


    ctx.strokeStyle =
      style.neon;


    ctx.strokeRect(
      doorX -
      37 * s,
      y -
      92 * s,
      74 * s,
      92 * s
    );


    noGlow();
  }


  /*
     old awning
  */

  if (
    style.old
  ) {

    ctx.fillStyle =
      building.visualType ===
      "teaShop"
      ? "#324b38"
      : (
          building.visualType ===
          "fruitShop"
          ? "#735333"
          : "#6d342b"
        );


    ctx.fillRect(
      x +
      15 * s,
      y -
      119 * s,
      width -
      30 * s,
      18 * s
    );


    ctx.fillStyle =
      style.neon;


    ctx.fillRect(
      x +
      15 * s,
      y -
      102 * s,
      width -
      30 * s,
      3 * s
    );
  }


  /*
     fruit display
  */

  if (
    building.visualType ===
    "fruitShop"
  ) {

    for (
      let i = 0;
      i < 5;
      i++
    ) {

      ctx.fillStyle =
        [
          "#d35b42",
          "#d7a63e",
          "#7c9e48",
          "#db7d3e",
          "#b74e54"
        ][i];


      ctx.beginPath();

      ctx.arc(
        x +
        40 * s +
        i *
        28 * s,

        y -
        18 * s,

        9 * s,

        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
}


/* ==========================================================
   SIGNS
========================================================== */

function drawBuildingSigns(
  building,
  style,
  x,
  y,
  width,
  height,
  s
) {

  const signW =
    Math.min(
      width * .52,
      320 * s
    );


  const sx =
    x +
    25 * s;


  const sy =
    y -
    149 * s;


  glow(
    style.neon,
    14 * s
  );


  ctx.strokeStyle =
    style.neon;


  ctx.lineWidth =
    Math.max(
      1,
      2 * s
    );


  ctx.strokeRect(
    sx,
    sy,
    signW,
    39 * s
  );


  noGlow();


  ctx.fillStyle =
    "#edffff";


  ctx.font =
    `bold ${
      Math.max(
        8,
        13 * s
      )
    }px sans-serif`;


  ctx.textAlign =
    "left";


  ctx.fillText(
    building.sign,
    sx +
    10 * s,
    sy +
    25 * s
  );


  if (
    style.old
  ) {

    const vx =
      x +
      width -
      48 * s;


    const vh =
      Math.min(
        height * .31,
        250 * s
      );


    const vy =
      y -
      height * .52;


    glow(
      style.neon,
      12 * s
    );


    ctx.fillStyle =
      "rgba(7,7,6,.92)";


    ctx.fillRect(
      vx,
      vy,
      35 * s,
      vh
    );


    ctx.strokeStyle =
      style.neon;


    ctx.strokeRect(
      vx,
      vy,
      35 * s,
      vh
    );


    noGlow();


    const chars =
      building.sign
        .replace(
          /\s/g,
          ""
        )
        .slice(
          0,
          6
        )
        .split("");


    ctx.fillStyle =
      style.neon;


    ctx.font =
      `bold ${
        12 * s
      }px sans-serif`;


    ctx.textAlign =
      "center";


    chars.forEach(
      (
        char,
        index
      ) => {

        ctx.fillText(
          char,
          vx +
          17.5 * s,

          vy +
          25 * s +
          index *
          24 * s
        );
      }
    );
  }


  if (
    style.megaScreen
  ) {

    const mw =
      Math.min(
        width * .42,
        290 * s
      );


    const mh =
      125 * s;


    const mx =
      x +
      width -
      mw -
      28 * s;


    const my =
      y -
      height * .58;


    const gradient =
      ctx.createLinearGradient(
        mx,
        my,
        mx + mw,
        my + mh
      );


    gradient.addColorStop(
      0,
      "rgba(38,217,255,.72)"
    );


    gradient.addColorStop(
      .48,
      "rgba(115,70,255,.56)"
    );


    gradient.addColorStop(
      1,
      "rgba(237,62,183,.65)"
    );


    glow(
      style.neon,
      22 * s
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      mx,
      my,
      mw,
      mh
    );


    noGlow();


    ctx.fillStyle =
      "rgba(240,255,255,.94)";


    ctx.textAlign =
      "center";


    ctx.font =
      `bold ${
        17 * s
      }px sans-serif`;


    ctx.fillText(
      "HANGZHOU",
      mx +
      mw / 2,
      my +
      45 * s
    );


    ctx.font =
      `${
        9 * s
      }px monospace`;


    ctx.fillText(
      "CITY // 2049",
      mx +
      mw / 2,
      my +
      69 * s
    );
  }
}


/* ==========================================================
   ROOF
========================================================== */

function drawRoofDetails(
  building,
  x,
  roofY,
  width,
  s,
  time,
  style
) {

  ctx.fillStyle =
    style.old
    ? "#302c27"
    : "#1c3037";


  ctx.fillRect(
    x +
    width * .13,

    roofY -
    44 * s,

    width * .19,

    44 * s
  );


  for (
    let i = 0;
    i < (
      style.dense
      ? 4
      : 3
    );
    i++
  ) {

    const ax =
      x +
      width *
      (
        .40 +
        i * .11
      );


    ctx.fillStyle =
      style.old
      ? "#625e55"
      : "#47565b";


    ctx.fillRect(
      ax,
      roofY -
      23 * s,
      34 * s,
      23 * s
    );


    ctx.strokeStyle =
      "#1b282c";


    ctx.beginPath();

    ctx.arc(
      ax +
      17 * s,
      roofY -
      11 * s,
      7 * s,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }


  const antennaX =
    x +
    width * .86;


  ctx.strokeStyle =
    "#53676d";


  ctx.lineWidth =
    Math.max(
      1,
      2 * s
    );


  ctx.beginPath();

  ctx.moveTo(
    antennaX,
    roofY
  );

  ctx.lineTo(
    antennaX,
    roofY -
    105 * s
  );

  ctx.stroke();


  if (
    Math.floor(
      time / 700
    ) % 2 === 0
  ) {

    glow(
      "#ff3b51",
      10 * s
    );


    ctx.fillStyle =
      "#ff4056";


    ctx.beginPath();

    ctx.arc(
      antennaX,
      roofY -
      107 * s,
      4 * s,
      0,
      Math.PI * 2
    );

    ctx.fill();


    noGlow();
  }
}


/* ==========================================================
   BUILDING
========================================================== */

function drawBuilding(
  building,
  time
) {

  const style =
    getBuildingStyle(
      building
    );


  const p =
    project(
      building.x +
      building.w / 2,

      building.y +
      building.h
    );


  if (
    p.y < -1400 ||
    p.y > H + 1000
  ) {

    return;
  }


  const s =
    p.scale;


  const width =
    building.w *
    s;


  const height =
    (
      195 +
      building.floors *
      30
    ) *
    s;


  const x =
    p.x -
    width / 2;


  const y =
    p.y;


  ctx.fillStyle =
    "rgba(0,0,0,.56)";


  ctx.beginPath();

  ctx.ellipse(
    p.x +
    38 * s,
    y +
    14 * s,

    width * .51,
    33 * s,

    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  const facade =
    ctx.createLinearGradient(
      x,
      y -
      height,

      x +
      width,
      y
    );


  facade.addColorStop(
    0,
    style.wall
  );


  facade.addColorStop(
    .52,
    style.wall2
  );


  facade.addColorStop(
    1,
    style.old
    ? "#100d0b"
    : "#071014"
  );


  ctx.fillStyle =
    facade;


  ctx.fillRect(
    x,
    y -
    height,
    width,
    height
  );


  const depthX =
    74 * s;


  const depthY =
    39 * s;


  ctx.fillStyle =
    style.old
    ? "#0d0c0a"
    : "#061015";


  ctx.beginPath();

  ctx.moveTo(
    x +
    width,
    y -
    height
  );

  ctx.lineTo(
    x +
    width +
    depthX,
    y -
    height -
    depthY
  );

  ctx.lineTo(
    x +
    width +
    depthX,
    y -
    depthY
  );

  ctx.lineTo(
    x +
    width,
    y
  );

  ctx.closePath();

  ctx.fill();


  const upperTop =
    y -
    height +
    55 * s;


  const upperBottom =
    y -
    166 * s;


  const availableH =
    upperBottom -
    upperTop;


  const cols =
    clamp(
      Math.floor(
        building.w /
        (
          style.dense
          ? 120
          : 150
        )
      ),
      2,
      style.dense
      ? 11
      : 9
    );


  const rows =
    clamp(
      Math.floor(
        building.floors *
        (
          style.dense
          ? .70
          : .52
        )
      ),
      2,
      style.dense
      ? 12
      : 11
    );


  const marginX =
    27 * s;


  const gapX =
    (
      style.dense
      ? 8
      : 11
    ) *
    s;


  const gapY =
    (
      style.dense
      ? 8
      : 11
    ) *
    s;


  const cellW =
    (
      width -
      marginX * 2 -
      gapX *
      (
        cols - 1
      )
    ) /
    cols;


  const cellH =
    (
      availableH -
      gapY *
      (
        rows - 1
      )
    ) /
    rows;


  if (
    cellW > 4 &&
    cellH > 4
  ) {

    for (
      let row = 0;
      row < rows;
      row++
    ) {

      for (
        let col = 0;
        col < cols;
        col++
      ) {

        const wx =
          x +
          marginX +
          col *
          (
            cellW +
            gapX
          );


        const wy =
          upperTop +
          row *
          (
            cellH +
            gapY
          );


        const seed =
          building.x *
          1.31 +
          building.y *
          .77 +
          row *
          137 +
          col *
          67;


        drawWindowRoom(
          wx,
          wy,
          cellW,
          cellH,
          seed,
          style,
          s
        );


        if (
          noise(
            seed +
            200
          ) <
          style.acChance
        ) {

          drawAC(
            wx +
            cellW -
            30 * s,

            wy +
            cellH -
            2 * s,

            s * .68,

            seed
          );
        }
      }
    }
  }


  if (
    style.pipes
  ) {

    drawPipes(
      x,
      y,
      width,
      height,
      s,
      building.x +
      building.y,
      style.dense
    );
  }


  if (
    style.fireEscape &&
    width >
    180 * s
  ) {

    drawFireEscape(
      x,
      y,
      width,
      height,
      s
    );
  }


  if (
    style.dense
  ) {

    drawOldBalconies(
      x,
      y,
      width,
      height,
      s,
      building.x +
      building.y
    );
  }


  drawGroundFloor(
    building,
    style,
    x,
    y,
    width,
    s
  );


  drawBuildingSigns(
    building,
    style,
    x,
    y,
    width,
    height,
    s
  );


  /*
     roof
  */

  ctx.fillStyle =
    style.old
    ? "#302c27"
    : "#1a2c32";


  ctx.beginPath();

  ctx.moveTo(
    x,
    y -
    height
  );

  ctx.lineTo(
    x +
    width,
    y -
    height
  );

  ctx.lineTo(
    x +
    width +
    depthX,
    y -
    height -
    depthY
  );

  ctx.lineTo(
    x +
    depthX,
    y -
    height -
    depthY
  );

  ctx.closePath();

  ctx.fill();


  ctx.strokeStyle =
    style.old
    ? "rgba(120,104,88,.34)"
    : "rgba(88,130,140,.38)";

  ctx.stroke();


  drawRoofDetails(
    building,
    x,
    y -
    height,
    width,
    s,
    time,
    style
  );
}


/* ==========================================================
   TREE
========================================================== */

function drawTree(
  tree,
  time
) {

  const p =
    project(
      tree.x,
      tree.y
    );


  const s =
    p.scale;


  const sway =
    Math.sin(
      time *
      .001 +
      tree.y *
      .01
    ) *
    3 *
    s;


  ctx.fillStyle =
    "rgba(0,0,0,.34)";


  ctx.beginPath();

  ctx.ellipse(
    p.x +
    18 * s,
    p.y +
    4 * s,

    49 * s,
    14 * s,

    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.strokeStyle =
    "#263a30";


  ctx.lineWidth =
    9 * s;


  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  ctx.lineTo(
    p.x +
    sway,
    p.y -
    78 * s
  );

  ctx.stroke();


  const leaves = [

    [-28,-91,29],

    [7,-108,36],

    [38,-90,27],

    [-8,-71,32],

    [26,-122,24],

    [-35,-115,20]
  ];


  leaves.forEach(
    (
      leaf,
      index
    ) => {

      ctx.fillStyle =
        index % 2
        ? "#153a32"
        : "#21483d";


      ctx.beginPath();

      ctx.arc(
        p.x +
        leaf[0] *
        s +
        sway,

        p.y +
        leaf[1] *
        s,

        leaf[2] *
        s,

        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  );
}


/* ==========================================================
   STREET LIGHT
========================================================== */

function drawStreetLight(
  light
) {

  const p =
    project(
      light.x,
      light.y
    );


  const s =
    p.scale;


  ctx.strokeStyle =
    getCurrentMap()
      .ambience ===
      "oldtown"
    ? "#4a4941"
    : "#384a50";


  ctx.lineWidth =
    5 * s;


  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  ctx.lineTo(
    p.x,
    p.y -
    118 * s
  );

  ctx.lineTo(
    p.x +
    31 * s,
    p.y -
    118 * s
  );

  ctx.stroke();


  const color =
    getCurrentMap()
      .ambience ===
      "oldtown"
    ? "#ffd99c"
    : "#dff9ff";


  glow(
    color,
    17 * s
  );


  ctx.fillStyle =
    color;


  ctx.beginPath();

  ctx.ellipse(
    p.x +
    34 * s,
    p.y -
    118 * s,

    10 * s,
    5 * s,

    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  noGlow();
}


/* ==========================================================
   STREET SIGN
========================================================== */

function drawStreetSign(
  sign
) {

  const p =
    project(
      sign.x,
      sign.y
    );


  const s =
    p.scale;


  ctx.strokeStyle =
    "#354950";


  ctx.lineWidth =
    5 * s;


  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  ctx.lineTo(
    p.x,
    p.y -
    98 * s
  );

  ctx.stroke();


  glow(
    sign.color,
    11 * s
  );


  ctx.fillStyle =
    "#071419";


  ctx.fillRect(
    p.x -
    88 * s,
    p.y -
    125 * s,
    176 * s,
    34 * s
  );


  ctx.strokeStyle =
    sign.color;


  ctx.lineWidth =
    2 * s;


  ctx.strokeRect(
    p.x -
    88 * s,
    p.y -
    125 * s,
    176 * s,
    34 * s
  );


  noGlow();


  ctx.fillStyle =
    sign.color;


  ctx.font =
    `${
      Math.max(
        7,
        10 * s
      )
    }px sans-serif`;


  ctx.textAlign =
    "center";


  ctx.fillText(
    sign.text,
    p.x,
    p.y -
    103 * s
  );
}


/* ==========================================================
   CHARACTER PALETTES
========================================================== */

const CHARACTER_PALETTES = {

  player: {

    coat:"#172a34",

    coat2:"#254b59",

    pants:"#111820",

    shoes:"#d6e4e6",

    accent:"#55eaff",

    hair:"#101318",

    skin:"#c98f70"
  },


  navy: {

    coat:"#25394c",

    coat2:"#354f67",

    pants:"#171e27",

    shoes:"#252b31",

    accent:"#73c7e8",

    hair:"#151619",

    skin:"#c99473"
  },


  charcoal: {

    coat:"#34373c",

    coat2:"#4a4d52",

    pants:"#1b1c20",

    shoes:"#27292d",

    accent:"#d4d8dc",

    hair:"#171416",

    skin:"#d09a7b"
  },


  purple: {

    coat:"#51405f",

    coat2:"#6d5480",

    pants:"#24202a",

    shoes:"#d0ced4",

    accent:"#d777ff",

    hair:"#191419",

    skin:"#ce9678"
  },


  yellow: {

    coat:"#d4a62c",

    coat2:"#f0c54b",

    pants:"#22272a",

    shoes:"#272b2e",

    accent:"#ffe870",

    hair:"#161719",

    skin:"#c88f6d"
  },


  blue: {

    coat:"#2b78a1",

    coat2:"#3c9ac5",

    pants:"#20272d",

    shoes:"#20262a",

    accent:"#73e4ff",

    hair:"#15171a",

    skin:"#ce9471"
  },


  green: {

    coat:"#365d4b",

    coat2:"#4d7963",

    pants:"#222923",

    shoes:"#252b28",

    accent:"#8ed0a5",

    hair:"#171512",

    skin:"#c99472"
  },


  red: {

    coat:"#71403c",

    coat2:"#94534c",

    pants:"#292022",

    shoes:"#302729",

    accent:"#ff897b",

    hair:"#191516",

    skin:"#cf9877"
  },


  brown: {

    coat:"#5c493b",

    coat2:"#77604d",

    pants:"#29241f",

    shoes:"#302923",

    accent:"#d7b283",

    hair:"#191613",

    skin:"#c89370"
  },


  gray: {

    coat:"#53575a",

    coat2:"#6d7275",

    pants:"#282b2d",

    shoes:"#303335",

    accent:"#bfc6c8",

    hair:"#3b3a37",

    skin:"#c68f6f"
  },


  cream: {

    coat:"#b7a98e",

    coat2:"#d0c1a3",

    pants:"#49413b",

    shoes:"#34302c",

    accent:"#efe0bb",

    hair:"#241c19",

    skin:"#d09b79"
  },


  black: {

    coat:"#22252a",

    coat2:"#343941",

    pants:"#14171b",

    shoes:"#25282d",

    accent:"#89939d",

    hair:"#0d0f12",

    skin:"#c78e6e"
  }
};


/* ==========================================================
   CHARACTER CONFIG
========================================================== */

function getCharacterConfig(
  character,
  isPlayer
) {

  const type =
    isPlayer
    ? "player"
    : (
        character.type ||
        "street"
      );


  const config = {

    height: 88,

    head: 10,

    shoulder: 25,

    coatLength: 34,

    bag: false,

    backpack: false,

    deliveryBox: false,

    helmet: false,

    apron: false,

    tie: false,

    hood: false,

    umbrella:
      character.action ===
      "umbrella",

    phone:
      character.action ===
      "phone",

    eating:
      character.action ===
      "eat",

    elderly:
      String(
        character.gender
      )
      .startsWith(
        "elder"
      )
  };


  if (
    type === "player"
  ) {

    config.height = 94;

    config.shoulder = 27;

    config.coatLength = 38;
  }


  else if (
    type === "office"
  ) {

    config.height = 91;

    config.shoulder = 25;

    config.bag = true;

    config.tie = true;
  }


  else if (
    type === "student"
  ) {

    config.height = 87;

    config.shoulder = 26;

    config.backpack = true;

    config.hood = true;
  }


  else if (
    type === "delivery"
  ) {

    config.height = 90;

    config.shoulder = 28;

    config.deliveryBox = true;

    config.helmet = true;
  }


  else if (
    type === "shopkeeper"
  ) {

    config.height = 86;

    config.shoulder = 26;

    config.apron = true;
  }


  else if (
    type === "security"
  ) {

    config.height = 92;

    config.shoulder = 29;

    config.cap = true;
  }


  else if (
    type === "diner"
  ) {

    config.height = 86;

    config.shoulder = 25;
  }


  if (
    config.elderly
  ) {

    config.height -= 5;

    config.shoulder -= 2;
  }


  return config;
}


/* ==========================================================
   CHARACTER REFLECTION
========================================================== */

function drawCharacterReflection(
  p,
  s,
  palette,
  config,
  alpha = .13
) {

  ctx.save();

  ctx.globalAlpha =
    alpha;


  ctx.translate(
    p.x,
    p.y +
    7 * s
  );


  ctx.scale(
    1,
    -.58
  );


  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      -80 * s
    );


  gradient.addColorStop(
    0,
    palette.accent
  );


  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    -9 * s,
    0,
    18 * s,
    config.height *
    s *
    .72
  );


  ctx.restore();
}


/* ==========================================================
   CHARACTER SHADOW
========================================================== */

function drawCharacterShadow(
  p,
  s
) {

  ctx.fillStyle =
    "rgba(0,0,0,.46)";


  ctx.beginPath();

  ctx.ellipse(
    p.x +
    2 * s,
    p.y +
    3 * s,

    17 * s,
    6 * s,

    0,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* ==========================================================
   CHARACTER
========================================================== */

function drawCharacter(
  character,
  isPlayer = false
) {

  const x =
    isPlayer
    ? player.x
    : character.x;


  const y =
    isPlayer
    ? player.y
    : character.y;


  const p =
    project(
      x,
      y
    );


  if (
    !isOnScreen(
      p,
      150
    )
  ) {

    return;
  }


  const s =
    p.scale;


  const palette =
    CHARACTER_PALETTES[
      isPlayer
      ? "player"
      : (
          character.palette ||
          "gray"
        )
    ] ||
    CHARACTER_PALETTES.gray;


  const config =
    getCharacterConfig(
      character,
      isPlayer
    );


  const moving =
    isPlayer
    ? player.moving
    : (
        character.action ===
        "walk"
      );


  const seed =
    isPlayer
    ? player.step
    : (
        performance.now() *
        .0017 +
        x *
        .013 +
        y *
        .007
      );


  const walk =
    moving
    ? Math.sin(
        seed * 1.9
      )
    : 0;


  const bob =
    moving
    ? Math.abs(
        Math.sin(
          seed * 1.9
        )
      ) *
      1.7 *
      s
    : 0;


  const legSwing =
    walk *
    7 *
    s;


  const armSwing =
    walk *
    6 *
    s;


  /*
     wet road reflection
  */

  if (
    scene === "city"
  ) {

    drawCharacterReflection(
      p,
      s,
      palette,
      config,
      isPlayer
      ? .16
      : .09
    );
  }


  drawCharacterShadow(
    p,
    s
  );


  ctx.save();

  ctx.translate(
    p.x,
    p.y -
    bob
  );


  /*
     elderly posture
  */

  if (
    config.elderly
  ) {

    ctx.rotate(
      .035
    );
  }


  /*
     delivery box / backpack behind body
  */

  if (
    config.deliveryBox
  ) {

    ctx.fillStyle =
      "#d9b52d";


    roundRectPath(
      -18 * s,
      -68 * s,
      36 * s,
      37 * s,
      4 * s
    );

    ctx.fill();


    ctx.fillStyle =
      "#292d2d";


    ctx.fillRect(
      -12 * s,
      -62 * s,
      24 * s,
      5 * s
    );


    ctx.fillStyle =
      "#fff0a0";


    ctx.font =
      `bold ${
        6 * s
      }px sans-serif`;


    ctx.textAlign =
      "center";


    ctx.fillText(
      "外卖",
      0,
      -43 * s
    );
  }


  else if (
    config.backpack
  ) {

    ctx.fillStyle =
      "#252c32";


    roundRectPath(
      -15 * s,
      -62 * s,
      30 * s,
      31 * s,
      7 * s
    );

    ctx.fill();


    ctx.strokeStyle =
      "#56616a";


    ctx.lineWidth =
      2 * s;


    ctx.beginPath();

    ctx.moveTo(
      -11 * s,
      -58 * s
    );

    ctx.lineTo(
      -18 * s,
      -38 * s
    );

    ctx.moveTo(
      11 * s,
      -58 * s
    );

    ctx.lineTo(
      18 * s,
      -38 * s
    );

    ctx.stroke();
  }


  /*
     rear leg
  */

  ctx.strokeStyle =
    palette.pants;


  ctx.lineWidth =
    8 * s;


  ctx.lineCap =
    "round";


  ctx.beginPath();

  ctx.moveTo(
    -5 * s,
    -29 * s
  );

  ctx.lineTo(
    -6 * s -
    legSwing,
    -7 * s
  );

  ctx.stroke();


  /*
     rear shoe
  */

  ctx.strokeStyle =
    palette.shoes;


  ctx.lineWidth =
    6 * s;


  ctx.beginPath();

  ctx.moveTo(
    -7 * s -
    legSwing,
    -5 * s
  );

  ctx.lineTo(
    -12 * s -
    legSwing,
    -2 * s
  );

  ctx.stroke();


  /*
     rear arm
  */

  ctx.strokeStyle =
    palette.coat2;


  ctx.lineWidth =
    7 * s;


  ctx.beginPath();

  ctx.moveTo(
    -config.shoulder *
    .42 *
    s,

    -58 * s
  );

  ctx.lineTo(
    -13 * s +
    armSwing,
    -34 * s
  );

  ctx.stroke();


  /*
     body / jacket
  */

  const bodyTop =
    -65 * s;


  const bodyBottom =
    -29 * s;


  const shoulder =
    config.shoulder *
    s;


  const coatGradient =
    ctx.createLinearGradient(
      -shoulder,
      bodyTop,
      shoulder,
      bodyBottom
    );


  coatGradient.addColorStop(
    0,
    palette.coat2
  );


  coatGradient.addColorStop(
    .55,
    palette.coat
  );


  coatGradient.addColorStop(
    1,
    "#11171b"
  );


  ctx.fillStyle =
    coatGradient;


  ctx.beginPath();

  ctx.moveTo(
    -shoulder / 2,
    bodyTop
  );

  ctx.quadraticCurveTo(
    -shoulder,
    bodyTop +
    10 * s,

    -shoulder *
    .72,
    bodyBottom
  );

  ctx.lineTo(
    shoulder *
    .72,
    bodyBottom
  );

  ctx.quadraticCurveTo(
    shoulder,
    bodyTop +
    10 * s,

    shoulder / 2,
    bodyTop
  );

  ctx.closePath();

  ctx.fill();


  /*
     jacket seam
  */

  ctx.strokeStyle =
    "rgba(220,235,238,.15)";


  ctx.lineWidth =
    1 * s;


  ctx.beginPath();

  ctx.moveTo(
    0,
    bodyTop +
    6 * s
  );

  ctx.lineTo(
    0,
    bodyBottom -
    2 * s
  );

  ctx.stroke();


  /*
     tie
  */

  if (
    config.tie
  ) {

    ctx.fillStyle =
      "#11181f";


    ctx.beginPath();

    ctx.moveTo(
      -2 * s,
      -61 * s
    );

    ctx.lineTo(
      2 * s,
      -61 * s
    );

    ctx.lineTo(
      3 * s,
      -44 * s
    );

    ctx.lineTo(
      0,
      -39 * s
    );

    ctx.lineTo(
      -3 * s,
      -44 * s
    );

    ctx.closePath();

    ctx.fill();
  }


  /*
     hoodie
  */

  if (
    config.hood
  ) {

    ctx.strokeStyle =
      palette.coat2;


    ctx.lineWidth =
      4 * s;


    ctx.beginPath();

    ctx.arc(
      0,
      -63 * s,
      11 * s,
      .15,
      Math.PI -
      .15
    );

    ctx.stroke();
  }


  /*
     apron
  */

  if (
    config.apron
  ) {

    ctx.fillStyle =
      "rgba(219,211,190,.72)";


    ctx.beginPath();

    ctx.moveTo(
      -9 * s,
      -55 * s
    );

    ctx.lineTo(
      9 * s,
      -55 * s
    );

    ctx.lineTo(
      12 * s,
      -31 * s
    );

    ctx.lineTo(
      -12 * s,
      -31 * s
    );

    ctx.closePath();

    ctx.fill();


    ctx.strokeStyle =
      "#71695c";


    ctx.beginPath();

    ctx.moveTo(
      -7 * s,
      -55 * s
    );

    ctx.lineTo(
      0,
      -65 * s
    );

    ctx.lineTo(
      7 * s,
      -55 * s
    );

    ctx.stroke();
  }


  /*
     front leg
  */

  ctx.strokeStyle =
    palette.pants;


  ctx.lineWidth =
    8 * s;


  ctx.beginPath();

  ctx.moveTo(
    5 * s,
    -29 * s
  );

  ctx.lineTo(
    6 * s +
    legSwing,
    -7 * s
  );

  ctx.stroke();


  ctx.strokeStyle =
    palette.shoes;


  ctx.lineWidth =
    6 * s;


  ctx.beginPath();

  ctx.moveTo(
    7 * s +
    legSwing,
    -5 * s
  );

  ctx.lineTo(
    13 * s +
    legSwing,
    -2 * s
  );

  ctx.stroke();


  /*
     neck
  */

  ctx.fillStyle =
    palette.skin;


  ctx.fillRect(
    -4 * s,
    -72 * s,
    8 * s,
    9 * s
  );


  /*
     head
  */

  ctx.fillStyle =
    palette.skin;


  ctx.beginPath();

  ctx.ellipse(
    0,
    -80 * s,

    10.5 * s,
    12 * s,

    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /*
     ear
  */

  ctx.beginPath();

  ctx.arc(
    -10 * s,
    -80 * s,
    2.2 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    10 * s,
    -80 * s,
    2.2 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /*
     hair
  */

  ctx.fillStyle =
    palette.hair;


  ctx.beginPath();

  ctx.moveTo(
    -10 * s,
    -82 * s
  );

  ctx.quadraticCurveTo(
    -8 * s,
    -95 * s,
    2 * s,
    -94 * s
  );

  ctx.quadraticCurveTo(
    11 * s,
    -91 * s,
    10 * s,
    -80 * s
  );

  ctx.lineTo(
    6 * s,
    -85 * s
  );

  ctx.lineTo(
    3 * s,
    -82 * s
  );

  ctx.lineTo(
    -1 * s,
    -87 * s
  );

  ctx.lineTo(
    -5 * s,
    -82 * s
  );

  ctx.closePath();

  ctx.fill();


  /*
     elderly gray hair
  */

  if (
    config.elderly
  ) {

    ctx.fillStyle =
      "#77736c";


    ctx.beginPath();

    ctx.arc(
      0,
      -85 * s,
      9 * s,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();
  }


  /*
     helmet
  */

  if (
    config.helmet
  ) {

    ctx.fillStyle =
      palette.coat2;


    ctx.beginPath();

    ctx.arc(
      0,
      -85 * s,
      12 * s,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
      "#22292d";


    ctx.lineWidth =
      2 * s;


    ctx.beginPath();

    ctx.moveTo(
      8 * s,
      -84 * s
    );

    ctx.lineTo(
      9 * s,
      -74 * s
    );

    ctx.stroke();
  }


  /*
     security cap
  */

  if (
    config.cap
  ) {

    ctx.fillStyle =
      "#182938";


    ctx.fillRect(
      -11 * s,
      -92 * s,
      22 * s,
      6 * s
    );


    ctx.fillRect(
      -4 * s,
      -86 * s,
      16 * s,
      3 * s
    );
  }


  /*
     front arm
  */

  ctx.strokeStyle =
    palette.coat;


  ctx.lineWidth =
    7 * s;


  ctx.beginPath();

  ctx.moveTo(
    config.shoulder *
    .42 *
    s,

    -58 * s
  );


  if (
    config.phone
  ) {

    ctx.lineTo(
      12 * s,
      -45 * s
    );

    ctx.lineTo(
      9 * s,
      -60 * s
    );
  }

  else if (
    config.eating
  ) {

    ctx.lineTo(
      13 * s,
      -45 * s
    );

    ctx.lineTo(
      7 * s,
      -69 * s
    );
  }

  else {

    ctx.lineTo(
      13 * s -
      armSwing,
      -34 * s
    );
  }


  ctx.stroke();


  /*
     hand
  */

  ctx.fillStyle =
    palette.skin;


  if (
    config.phone
  ) {

    ctx.beginPath();

    ctx.arc(
      9 * s,
      -60 * s,
      3 * s,
      0,
      Math.PI * 2
    );

    ctx.fill();


    glow(
      "#63e8ff",
      5 * s
    );


    ctx.fillStyle =
      "#77edff";


    ctx.fillRect(
      9 * s,
      -68 * s,
      5 * s,
      9 * s
    );


    noGlow();
  }


  /*
     shoulder bag
  */

  if (
    config.bag
  ) {

    ctx.strokeStyle =
      "#15191c";


    ctx.lineWidth =
      3 * s;


    ctx.beginPath();

    ctx.moveTo(
      -8 * s,
      -61 * s
    );

    ctx.lineTo(
      17 * s,
      -31 * s
    );

    ctx.stroke();


    ctx.fillStyle =
      "#252a2d";


    roundRectPath(
      12 * s,
      -38 * s,
      18 * s,
      20 * s,
      3 * s
    );

    ctx.fill();
  }


  /*
     umbrella
  */

  if (
    config.umbrella
  ) {

    ctx.strokeStyle =
      "#78878b";


    ctx.lineWidth =
      2 * s;


    ctx.beginPath();

    ctx.moveTo(
      15 * s,
      -37 * s
    );

    ctx.lineTo(
      15 * s,
      -111 * s
    );

    ctx.stroke();


    ctx.fillStyle =
      "rgba(58,72,82,.82)";


    ctx.beginPath();

    ctx.arc(
      15 * s,
      -111 * s,

      34 * s,

      Math.PI,
      Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
      "rgba(130,155,165,.62)";


    ctx.beginPath();

    ctx.moveTo(
      -19 * s,
      -111 * s
    );

    ctx.lineTo(
      15 * s,
      -111 * s
    );

    ctx.lineTo(
      49 * s,
      -111 * s
    );

    ctx.stroke();
  }


  /*
     neon rim light
  */

  const rimColor =
    getCurrentMap()
      .ambience ===
      "oldtown"
    ? "#ff9b62"
    : palette.accent;


  glow(
    rimColor,
    isPlayer
    ? 9 * s
    : 4 * s
  );


  ctx.strokeStyle =
    rimColor;


  ctx.globalAlpha =
    isPlayer
    ? .72
    : .28;


  ctx.lineWidth =
    isPlayer
    ? 1.8 * s
    : 1 * s;


  ctx.beginPath();

  ctx.moveTo(
    -shoulder / 2,
    bodyTop +
    3 * s
  );

  ctx.quadraticCurveTo(
    -shoulder,
    bodyTop +
    12 * s,

    -shoulder *
    .72,
    bodyBottom
  );

  ctx.stroke();


  ctx.globalAlpha = 1;

  noGlow();


  ctx.restore();
}


/* ==========================================================
   PROP DRAWING
========================================================== */

function drawBike(
  prop,
  index
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.strokeStyle =
    index % 2
    ? "#55c7c9"
    : "#d7b74f";


  ctx.lineWidth =
    Math.max(
      1,
      2 * s
    );


  ctx.beginPath();

  ctx.arc(
    p.x -
    10 * s,
    p.y,
    8 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    p.x +
    10 * s,
    p.y,
    8 * s,
    0,
    Math.PI * 2
  );

  ctx.moveTo(
    p.x -
    10 * s,
    p.y
  );

  ctx.lineTo(
    p.x,
    p.y -
    13 * s
  );

  ctx.lineTo(
    p.x +
    10 * s,
    p.y
  );

  ctx.lineTo(
    p.x -
    2 * s,
    p.y
  );

  ctx.closePath();

  ctx.stroke();
}


function drawScooter(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "rgba(0,0,0,.35)";


  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y +
    2 * s,

    27 * s,
    7 * s,

    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "#26373d";


  ctx.fillRect(
    p.x -
    17 * s,
    p.y -
    20 * s,
    32 * s,
    16 * s
  );


  ctx.fillStyle =
    "#426873";


  ctx.fillRect(
    p.x +
    8 * s,
    p.y -
    33 * s,
    11 * s,
    23 * s
  );


  ctx.fillStyle =
    "#101417";


  ctx.beginPath();

  ctx.arc(
    p.x -
    14 * s,
    p.y,
    7 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    p.x +
    15 * s,
    p.y,
    7 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


function drawVending(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  const w =
    34 * s;


  const h =
    76 * s;


  ctx.fillStyle =
    "#aab6b9";


  ctx.fillRect(
    p.x -
    w / 2,
    p.y -
    h,
    w,
    h
  );


  glow(
    "#58e8ff",
    12 * s
  );


  ctx.fillStyle =
    "#93efff";


  ctx.fillRect(
    p.x -
    w * .36,

    p.y -
    h +
    8 * s,

    w * .72,

    31 * s
  );


  noGlow();
}


function drawTrash(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#29363a";


  ctx.fillRect(
    p.x -
    11 * s,
    p.y -
    27 * s,
    22 * s,
    27 * s
  );


  ctx.fillStyle =
    "#4b5a5e";


  ctx.fillRect(
    p.x -
    13 * s,
    p.y -
    31 * s,
    26 * s,
    5 * s
  );
}


function drawBoxes(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#74563a";


  ctx.fillRect(
    p.x -
    20 * s,
    p.y -
    22 * s,
    28 * s,
    22 * s
  );


  ctx.fillStyle =
    "#8b6847";


  ctx.fillRect(
    p.x +
    2 * s,
    p.y -
    34 * s,
    24 * s,
    34 * s
  );
}


function drawPlant(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#604c39";


  ctx.beginPath();

  ctx.moveTo(
    p.x -
    9 * s,
    p.y -
    16 * s
  );

  ctx.lineTo(
    p.x +
    9 * s,
    p.y -
    16 * s
  );

  ctx.lineTo(
    p.x +
    6 * s,
    p.y
  );

  ctx.lineTo(
    p.x -
    6 * s,
    p.y
  );

  ctx.closePath();

  ctx.fill();


  ctx.fillStyle =
    "#315e45";


  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const angle =
      -1.8 +
      i * .65;


    ctx.beginPath();

    ctx.ellipse(
      p.x +
      Math.cos(angle) *
      8 * s,

      p.y -
      24 * s +
      Math.sin(angle) *
      7 * s,

      6 * s,
      13 * s,

      angle,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}


function drawBench(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#55483a";


  ctx.fillRect(
    p.x -
    35 * s,
    p.y -
    21 * s,
    70 * s,
    8 * s
  );


  ctx.fillRect(
    p.x -
    35 * s,
    p.y -
    39 * s,
    70 * s,
    8 * s
  );


  ctx.strokeStyle =
    "#2e383b";


  ctx.lineWidth =
    4 * s;


  ctx.beginPath();

  ctx.moveTo(
    p.x -
    27 * s,
    p.y -
    14 * s
  );

  ctx.lineTo(
    p.x -
    27 * s,
    p.y
  );

  ctx.moveTo(
    p.x +
    27 * s,
    p.y -
    14 * s
  );

  ctx.lineTo(
    p.x +
    27 * s,
    p.y
  );

  ctx.stroke();
}


function drawBarrier(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#d7d7d0";


  ctx.fillRect(
    p.x -
    32 * s,
    p.y -
    26 * s,
    64 * s,
    13 * s
  );


  ctx.fillStyle =
    "#c64e42";


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    ctx.save();

    ctx.translate(
      p.x -
      27 * s +
      i *
      18 * s,

      p.y -
      20 * s
    );

    ctx.rotate(
      -.45
    );

    ctx.fillRect(
      -3 * s,
      -8 * s,
      6 * s,
      17 * s
    );

    ctx.restore();
  }
}


function drawCone(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#e06b37";


  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y -
    28 * s
  );

  ctx.lineTo(
    p.x -
    11 * s,
    p.y
  );

  ctx.lineTo(
    p.x +
    11 * s,
    p.y
  );

  ctx.closePath();

  ctx.fill();


  ctx.fillStyle =
    "#e5ded1";


  ctx.fillRect(
    p.x -
    7 * s,
    p.y -
    12 * s,
    14 * s,
    4 * s
  );
}


function drawUtility(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#526064";


  ctx.fillRect(
    p.x -
    17 * s,
    p.y -
    48 * s,
    34 * s,
    48 * s
  );


  ctx.strokeStyle =
    "#242e31";


  ctx.strokeRect(
    p.x -
    17 * s,
    p.y -
    48 * s,
    34 * s,
    48 * s
  );


  ctx.fillStyle =
    "#d0ad4c";


  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y -
    38 * s
  );

  ctx.lineTo(
    p.x -
    5 * s,
    p.y -
    27 * s
  );

  ctx.lineTo(
    p.x +
    5 * s,
    p.y -
    27 * s
  );

  ctx.closePath();

  ctx.fill();
}


function drawUmbrellaProp(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.strokeStyle =
    "#68777c";


  ctx.lineWidth =
    2 * s;


  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  ctx.lineTo(
    p.x,
    p.y -
    39 * s
  );

  ctx.stroke();


  ctx.fillStyle =
    "#533d5e";


  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y -
    39 * s,
    23 * s,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();
}


function drawDrain(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "#11181b";


  ctx.fillRect(
    p.x -
    25 * s,
    p.y -
    5 * s,
    50 * s,
    10 * s
  );


  ctx.strokeStyle =
    "#465257";


  ctx.lineWidth =
    1 * s;


  for (
    let i = 0;
    i < 8;
    i++
  ) {

    ctx.beginPath();

    ctx.moveTo(
      p.x -
      20 * s +
      i *
      6 * s,
      p.y -
      4 * s
    );

    ctx.lineTo(
      p.x -
      20 * s +
      i *
      6 * s,
      p.y +
      4 * s
    );

    ctx.stroke();
  }
}


function drawACStack(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );


  const s =
    p.scale;


  for (
    let i = 0;
    i < 2;
    i++
  ) {

    const yy =
      p.y -
      i *
      31 * s;


    ctx.fillStyle =
      "#7c8789";


    ctx.fillRect(
      p.x -
      22 * s,
      yy -
      25 * s,
      44 * s,
      25 * s
    );


    ctx.strokeStyle =
      "#303a3c";


    ctx.beginPath();

    ctx.arc(
      p.x -
      7 * s,
      yy -
      13 * s,
      8 * s,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }
}


function drawProp(
  prop,
  index
) {

  switch (
    prop.type
  ) {

    case "bike":

      drawBike(
        prop,
        index
      );

      break;


    case "scooter":

      drawScooter(
        prop
      );

      break;


    case "vending":

      drawVending(
        prop
      );

      break;


    case "trash":

      drawTrash(
        prop
      );

      break;


    case "boxes":

      drawBoxes(
        prop
      );

      break;


    case "plant":

      drawPlant(
        prop
      );

      break;


    case "bench":

      drawBench(
        prop
      );

      break;


    case "barrier":

      drawBarrier(
        prop
      );

      break;


    case "cone":

      drawCone(
        prop
      );

      break;


    case "utility":

      drawUtility(
        prop
      );

      break;


    case "umbrella":

      drawUmbrellaProp(
        prop
      );

      break;


    case "drain":

      drawDrain(
        prop
      );

      break;


    case "acstack":

      drawACStack(
        prop
      );

      break;
  }
}


/* ==========================================================
   STALL
========================================================== */

function drawStall(
  stall,
  time
) {

  const p =
    project(
      stall.x,
      stall.y
    );


  const s =
    p.scale;


  ctx.fillStyle =
    "rgba(0,0,0,.40)";


  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y +
    5 * s,
    50 * s,
    13 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "#42332a";


  ctx.fillRect(
    p.x -
    43 * s,
    p.y -
    48 * s,
    86 * s,
    48 * s
  );


  ctx.strokeStyle =
    "#545e60";


  ctx.lineWidth =
    3 * s;


  ctx.beginPath();

  ctx.moveTo(
    p.x -
    38 * s,
    p.y -
    48 * s
  );

  ctx.lineTo(
    p.x -
    38 * s,
    p.y -
    112 * s
  );

  ctx.moveTo(
    p.x +
    38 * s,
    p.y -
    48 * s
  );

  ctx.lineTo(
    p.x +
    38 * s,
    p.y -
    112 * s
  );

  ctx.stroke();


  ctx.fillStyle =
    "#5d302e";


  ctx.beginPath();

  ctx.moveTo(
    p.x -
    48 * s,
    p.y -
    112 * s
  );

  ctx.lineTo(
    p.x +
    48 * s,
    p.y -
    112 * s
  );

  ctx.lineTo(
    p.x +
    40 * s,
    p.y -
    93 * s
  );

  ctx.lineTo(
    p.x -
    40 * s,
    p.y -
    93 * s
  );

  ctx.closePath();

  ctx.fill();


  glow(
    stall.color,
    15 * s
  );


  ctx.fillStyle =
    stall.color;


  ctx.fillRect(
    p.x -
    29 * s,
    p.y -
    91 * s,
    58 * s,
    20 * s
  );


  noGlow();


  ctx.fillStyle =
    "#fff2de";


  ctx.font =
    `bold ${
      Math.max(
        7,
        10 * s
      )
    }px sans-serif`;


  ctx.textAlign =
    "center";


  ctx.fillText(
    stall.name,
    p.x,
    p.y -
    77 * s
  );


  /*
     steam
  */

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const life =
      (
        time *
        .00025 +
        i *
        .24
      ) % 1;


    ctx.fillStyle =
      `rgba(
        225,
        225,
        215,
        ${
          .15 *
          (
            1 -
            life
          )
        }
      )`;


    ctx.beginPath();

    ctx.arc(
      p.x -
      18 * s +
      i *
      12 * s +
      Math.sin(
        time *
        .001 +
        i
      ) *
      5,

      p.y -
      57 * s -
      life *
      50 * s,

      (
        5 +
        life *
        8
      ) *
      s,

      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}


/* ==========================================================
   WIRES
========================================================== */

function drawWire(
  wire,
  index
) {

  const a =
    project(
      wire.x1,
      wire.y1,
      wire.z
    );


  const b =
    project(
      wire.x2,
      wire.y2,
      wire.z
    );


  const sag =
    24 +
    index *
    2;


  ctx.strokeStyle =
    "rgba(12,14,14,.92)";


  ctx.lineWidth =
    Math.max(
      1,
      2 *
      (
        a.scale +
        b.scale
      ) /
      2
    );


  ctx.beginPath();

  ctx.moveTo(
    a.x,
    a.y
  );


  ctx.quadraticCurveTo(
    (
      a.x +
      b.x
    ) /
    2,

    (
      a.y +
      b.y
    ) /
    2 +
    sag,

    b.x,
    b.y
  );

  ctx.stroke();
}


/* ==========================================================
   CLOTHES LINE
========================================================== */

function drawClothesLine(
  line,
  index
) {

  const a =
    project(
      line.x1,
      line.y1,
      line.z
    );


  const b =
    project(
      line.x2,
      line.y2,
      line.z
    );


  const sag = 18;


  ctx.strokeStyle =
    "rgba(110,110,103,.72)";


  ctx.lineWidth =
    Math.max(
      1,
      1.4 *
      (
        a.scale +
        b.scale
      ) /
      2
    );


  ctx.beginPath();

  ctx.moveTo(
    a.x,
    a.y
  );


  ctx.quadraticCurveTo(
    (
      a.x +
      b.x
    ) /
    2,

    (
      a.y +
      b.y
    ) /
    2 +
    sag,

    b.x,
    b.y
  );

  ctx.stroke();


  const colors = [
    "#a95d50",
    "#d0c2a7",
    "#526e79",
    "#6f5d78",
    "#817c5b"
  ];


  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    const t =
      i / 6;


    const x =
      a.x +
      (
        b.x -
        a.x
      ) *
      t;


    const y =
      a.y +
      (
        b.y -
        a.y
      ) *
      t +
      Math.sin(
        Math.PI *
        t
      ) *
      sag;


    const s =
      (
        a.scale +
        b.scale
      ) /
      2;


    ctx.fillStyle =
      colors[
        (
          i +
          index
        ) %
        colors.length
      ];


    ctx.fillRect(
      x -
      8 * s,
      y,
      16 * s,
      23 * s
    );
  }
}


/* ==========================================================
   CITY OBJECTS
========================================================== */

function drawCityObjects(
  time
) {

  const objects = [];


  BUILDINGS.forEach(
    building => {

      objects.push({

        y:
          building.y +
          building.h,

        draw:
          () =>
            drawBuilding(
              building,
              time
            )
      });
    }
  );


  TREES.forEach(
    tree => {

      objects.push({

        y:
          tree.y,

        draw:
          () =>
            drawTree(
              tree,
              time
            )
      });
    }
  );


  STREET_LIGHTS.forEach(
    light => {

      objects.push({

        y:
          light.y,

        draw:
          () =>
            drawStreetLight(
              light
            )
      });
    }
  );


  STREET_SIGNS.forEach(
    sign => {

      objects.push({

        y:
          sign.y,

        draw:
          () =>
            drawStreetSign(
              sign
            )
      });
    }
  );


  PROPS.forEach(
    (
      prop,
      index
    ) => {

      objects.push({

        y:
          prop.y,

        draw:
          () =>
            drawProp(
              prop,
              index
            )
      });
    }
  );


  STALLS.forEach(
    stall => {

      objects.push({

        y:
          stall.y,

        draw:
          () =>
            drawStall(
              stall,
              time
            )
      });
    }
  );


  NPCS.forEach(
    npc => {

      objects.push({

        y:
          npc.y,

        draw:
          () =>
            drawCharacter(
              npc,
              false
            )
      });
    }
  );


  objects.push({

    y:
      player.y,

    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });


  objects.sort(
    (
      a,
      b
    ) =>
      a.y -
      b.y
  );


  objects.forEach(
    object =>
      object.draw()
  );


  /*
     overhead layers
  */

  const map =
    getCurrentMap();


  if (
    map.wires
  ) {

    map.wires.forEach(
      drawWire
    );
  }


  else if (
    currentMapId ===
    "qianjiang"
  ) {

    const wires = [

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
    ];


    wires.forEach(
      drawWire
    );
  }


  if (
    map.clothesLines
  ) {

    map.clothesLines.forEach(
      drawClothesLine
    );
  }
}


/* ==========================================================
   INTERIOR FLOOR
========================================================== */

function drawInteriorFloor(
  interior,
  theme
) {

  ctx.fillStyle =
    theme.floor;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  const tile = 80;


  for (
    let x = 0;
    x < interior.width;
    x += tile
  ) {

    for (
      let y = 0;
      y < interior.height;
      y += tile
    ) {

      const a =
        project(
          x,
          y
        );

      const b =
        project(
          x + tile,
          y
        );

      const c =
        project(
          x + tile,
          y + tile
        );

      const d =
        project(
          x,
          y + tile
        );


      ctx.fillStyle =
        (
          (
            x / tile +
            y / tile
          ) % 2 === 0
        )
        ? theme.tileA
        : theme.tileB;


      ctx.beginPath();

      ctx.moveTo(
        a.x,
        a.y
      );

      ctx.lineTo(
        b.x,
        b.y
      );

      ctx.lineTo(
        c.x,
        c.y
      );

      ctx.lineTo(
        d.x,
        d.y
      );

      ctx.closePath();

      ctx.fill();


      ctx.strokeStyle =
        "rgba(255,255,255,.035)";

      ctx.stroke();
    }
  }
}


/* ==========================================================
   FURNITURE
========================================================== */

function drawFurniture(
  rect,
  options = {}
) {

  const centerX =
    rect.x +
    rect.w / 2;


  const bottomY =
    rect.y +
    rect.h;


  const p =
    project(
      centerX,
      bottomY
    );


  const s =
    p.scale;


  const w =
    rect.w *
    s;


  const visualH =
    (
      options.height ||
      80
    ) *
    s;


  const x =
    p.x -
    w / 2;


  const y =
    p.y;


  ctx.fillStyle =
    options.side ||
    "#192329";


  ctx.fillRect(
    x,
    y -
    visualH,
    w,
    visualH
  );


  ctx.fillStyle =
    options.top ||
    "#33434a";


  ctx.beginPath();

  ctx.moveTo(
    x,
    y -
    visualH
  );

  ctx.lineTo(
    x +
    w,
    y -
    visualH
  );

  ctx.lineTo(
    x +
    25 * s +
    w,

    y -
    visualH -
    14 * s
  );

  ctx.lineTo(
    x +
    25 * s,

    y -
    visualH -
    14 * s
  );

  ctx.closePath();

  ctx.fill();


  if (
    options.glow
  ) {

    glow(
      options.glow,
      10 * s
    );


    ctx.strokeStyle =
      options.glow;


    ctx.strokeRect(
      x +
      6 * s,

      y -
      visualH +
      8 * s,

      w -
      12 * s,

      15 * s
    );


    noGlow();
  }
}


/* ==========================================================
   EXIT MARKER
========================================================== */

function drawExitMarker(
  x,
  y
) {

  const p =
    project(
      x,
      y
    );


  glow(
    "#55eaff",
    13 *
    p.scale
  );


  ctx.strokeStyle =
    "rgba(85,234,255,.75)";


  ctx.lineWidth =
    2 *
    p.scale;


  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y,

    38 *
    p.scale,

    12 *
    p.scale,

    0,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  noGlow();
}


/* ==========================================================
   GENERIC INTERIOR CHARACTER
========================================================== */

function interiorCharacter(
  x,
  y,
  type,
  palette,
  action = "idle",
  gender = "male"
) {

  drawCharacter(
    {
      x,
      y,
      type,
      palette,
      action,
      gender
    },
    false
  );
}


/* ==========================================================
   CONVENIENCE
========================================================== */

function drawConvenience() {

  const interior =
    INTERIORS.convenience;


  drawInteriorFloor(
    interior,
    {
      floor:"#11191c",
      tileA:"#182226",
      tileB:"#151e22"
    }
  );


  const objects = [];


  const shelves = [

    {x:130,y:190,w:150,h:390},

    {x:355,y:190,w:120,h:390},

    {x:575,y:190,w:120,h:390},

    {x:790,y:190,w:130,h:390}
  ];


  shelves.forEach(
    (
      shelf,
      index
    ) => {

      objects.push({

        y:
          shelf.y +
          shelf.h,

        draw:
          () =>
            drawFurniture(
              shelf,
              {
                height:78,

                side:"#283236",

                top:"#47565b",

                glow:
                  index % 2
                  ? "#45e7ff"
                  : "#ff536c"
              }
            )
      });
    }
  );


  objects.push({

    y:680,

    draw:
      () =>
        drawFurniture(
          {
            x:630,
            y:610,
            w:300,
            h:70
          },
          {
            height:90,
            side:"#26353a",
            top:"#56676c",
            glow:"#ff536c"
          }
        )
  });


  objects.push({

    y:590,

    draw:
      () =>
        interiorCharacter(
          780,
          590,
          "shopkeeper",
          "red",
          "idle",
          "female"
        )
  });


  objects.push({

    y:
      player.y,

    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });


  objects.sort(
    (
      a,
      b
    ) =>
      a.y -
      b.y
  );


  objects.forEach(
    object =>
      object.draw()
  );


  drawExitMarker(
    interior.exit.x,
    interior.exit.y
  );
}


/* ==========================================================
   RESTAURANT
========================================================== */

function drawRestaurant(
  time
) {

  const interior =
    INTERIORS.restaurant;


  drawInteriorFloor(
    interior,
    {
      floor:"#17100d",
      tileA:"#241713",
      tileB:"#20130f"
    }
  );


  const objects = [];


  objects.push({

    y:200,

    draw:
      () =>
        drawFurniture(
          {
            x:100,
            y:80,
            w:850,
            h:120
          },
          {
            height:150,
            side:"#332522",
            top:"#5a4037"
          }
        )
  });


  objects.push({

    y:340,

    draw:
      () =>
        drawFurniture(
          {
            x:140,
            y:260,
            w:600,
            h:80
          },
          {
            height:78,
            side:"#4c2d22",
            top:"#7c4b35",
            glow:"#ff604e"
          }
        )
  });


  [
    {x:130,y:470,w:140,h:100},

    {x:340,y:470,w:140,h:100},

    {x:550,y:470,w:140,h:100}
  ]
  .forEach(
    table => {

      objects.push({

        y:
          table.y +
          table.h,

        draw:
          () =>
            drawFurniture(
              table,
              {
                height:55,
                side:"#3c281f",
                top:"#704936"
              }
            )
      });
    }
  );


  objects.push({

    y:230,

    draw:
      () =>
        interiorCharacter(
          520,
          230,
          "shopkeeper",
          "cream"
        )
  });


  objects.push({

    y:430,

    draw:
      () =>
        interiorCharacter(
          310,
          430,
          "diner",
          "navy",
          "eat"
        )
  });


  objects.push({

    y:610,

    draw:
      () =>
        interiorCharacter(
          620,
          610,
          "diner",
          "brown",
          "eat"
        )
  });


  objects.push({

    y:
      player.y,

    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });


  objects.sort(
    (
      a,
      b
    ) =>
      a.y -
      b.y
  );


  objects.forEach(
    object =>
      object.draw()
  );


  drawExitMarker(
    interior.exit.x,
    interior.exit.y
  );
}


/* ==========================================================
   OFFICE
========================================================== */

function drawOffice() {

  const interior =
    INTERIORS.office;


  drawInteriorFloor(
    interior,
    {
      floor:"#0d151a",
      tileA:"#152127",
      tileB:"#111b20"
    }
  );


  const objects = [];


  objects.push({

    y:200,

    draw:
      () =>
        drawFurniture(
          {
            x:120,
            y:100,
            w:860,
            h:100
          },
          {
            height:170,
            side:"#15262e",
            top:"#29424b",
            glow:"#d55cff"
          }
        )
  });


  objects.push({

    y:420,

    draw:
      () =>
        drawFurniture(
          {
            x:150,
            y:300,
            w:250,
            h:120
          },
          {
            height:85,
            side:"#25333a",
            top:"#52646b",
            glow:"#48e6ff"
          }
        )
  });


  [
    {x:170,y:520,w:220,h:90},

    {x:710,y:520,w:220,h:90}
  ]
  .forEach(
    sofa => {

      objects.push({

        y:
          sofa.y +
          sofa.h,

        draw:
          () =>
            drawFurniture(
              sofa,
              {
                height:65,
                side:"#25323b",
                top:"#3e505a"
              }
            )
      });
    }
  );


  objects.push({

    y:285,

    draw:
      () =>
        interiorCharacter(
          275,
          285,
          "office",
          "navy"
        )
  });


  objects.push({

    y:
      player.y,

    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });


  objects.sort(
    (
      a,
      b
    ) =>
      a.y -
      b.y
  );


  objects.forEach(
    object =>
      object.draw()
  );


  drawExitMarker(
    interior.exit.x,
    interior.exit.y
  );
}


/* ==========================================================
   NOODLE SHOP
========================================================== */

function drawNoodleShop(
  time
) {

  const interior =
    INTERIORS.noodle;


  drawInteriorFloor(
    interior,
    {
      floor:"#1b130f",
      tileA:"#2a1c16",
      tileB:"#241812"
    }
  );


  const objects = [];


  objects.push({

    y:210,

    draw:
      () =>
        drawFurniture(
          {
            x:100,
            y:80,
            w:800,
            h:130
          },
          {
            height:145,
            side:"#3b271f",
            top:"#6d4936",
            glow:"#ff5d4d"
          }
        )
  });


  objects.push({

    y:350,

    draw:
      () =>
        drawFurniture(
          {
            x:120,
            y:270,
            w:590,
            h:80
          },
          {
            height:72,
            side:"#4a2d22",
            top:"#77503a"
          }
        )
  });


  [
    {x:130,y:470,w:150,h:90},

    {x:350,y:470,w:150,h:90},

    {x:570,y:470,w:150,h:90}
  ]
  .forEach(
    table => {

      objects.push({

        y:
          table.y +
          table.h,

        draw:
          () =>
            drawFurniture(
              table,
              {
                height:52,
                side:"#402b22",
                top:"#79523d"
              }
            )
      });
    }
  );


  objects.push({

    y:235,

    draw:
      () =>
        interiorCharacter(
          480,
          235,
          "shopkeeper",
          "cream",
          "idle",
          "male"
        )
  });


  objects.push({

    y:590,

    draw:
      () =>
        interiorCharacter(
          430,
          590,
          "diner",
          "gray",
          "eat",
          "male"
        )
  });


  objects.push({

    y:
      player.y,

    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });


  objects.sort(
    (
      a,
      b
    ) =>
      a.y -
      b.y
  );


  objects.forEach(
    object =>
      object.draw()
  );


  /*
     steam
  */

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const p =
      project(
        400 +
        i * 30,
        245,
        45
      );


    const life =
      (
        time *
        .0002 +
        i * .18
      ) % 1;


    ctx.fillStyle =
      `rgba(
        230,
        225,
        215,
        ${
          .14 *
          (
            1 -
            life
          )
        }
      )`;


    ctx.beginPath();

    ctx.arc(
      p.x +
      Math.sin(
        time *
        .001 +
        i
      ) *
      7,

      p.y -
      life *
      65,

      (
        7 +
        life *
        14
      ) *
      p.scale,

      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  drawExitMarker(
    interior.exit.x,
    interior.exit.y
  );
}


/* ==========================================================
   TEA HOUSE
========================================================== */

function drawTeaHouse() {

  const interior =
    INTERIORS.tea;


  drawInteriorFloor(
    interior,
    {
      floor:"#151811",
      tileA:"#20271a",
      tileB:"#1a2116"
    }
  );


  const objects = [];


  objects.push({

    y:200,

    draw:
      () =>
        drawFurniture(
          {
            x:100,
            y:80,
            w:800,
            h:120
          },
          {
            height:145,
            side:"#283326",
            top:"#4d6249",
            glow:"#69c989"
          }
        )
  });


  [
    {x:130,y:260,w:220,h:110},

    {x:650,y:260,w:220,h:110},

    {x:160,y:500,w:180,h:90},

    {x:660,y:500,w:180,h:90}
  ]
  .forEach(
    table => {

      objects.push({

        y:
          table.y +
          table.h,

        draw:
          () =>
            drawFurniture(
              table,
              {
                height:55,
                side:"#38412f",
                top:"#657258"
              }
            )
      });
    }
  );


  objects.push({

    y:250,

    draw:
      () =>
        interiorCharacter(
          500,
          250,
          "shopkeeper",
          "green",
          "idle",
          "female"
        )
  });


  objects.push({

    y:
      player.y,

    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });


  objects.sort(
    (
      a,
      b
    ) =>
      a.y -
      b.y
  );


  objects.forEach(
    object =>
      object.draw()
  );


  /*
     tea jars
  */

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const p =
      project(
        210 +
        i * 90,
        170,
        60
      );


    ctx.fillStyle =
      i % 2
      ? "#6f5b3c"
      : "#53664a";


    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y,
      11 *
      p.scale,
      16 *
      p.scale,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  drawExitMarker(
    interior.exit.x,
    interior.exit.y
  );
}


/* ==========================================================
   RAIN
========================================================== */

function drawRain(
  time
) {

  ctx.save();


  ctx.strokeStyle =
    "rgba(165,215,225,.14)";


  ctx.lineWidth = 1;


  for (
    let i = 0;
    i < 95;
    i++
  ) {

    const x =
      (
        noise(
          i * 91
        ) *
        W +
        time * .05
      ) %
      W;


    const y =
      (
        noise(
          i * 37
        ) *
        H +
        time * .13
      ) %
      H;


    const len =
      8 +
      noise(i) *
      12;


    ctx.beginPath();

    ctx.moveTo(
      x,
      y
    );

    ctx.lineTo(
      x - 3,
      y + len
    );

    ctx.stroke();
  }


  ctx.restore();
}


/* ==========================================================
   ATMOSPHERE
========================================================== */

function drawAtmosphere() {

  ctx.save();

  ctx.globalCompositeOperation =
    "screen";


  const old =
    getCurrentMap()
      .ambience ===
    "oldtown";


  let gradient =
    ctx.createRadialGradient(
      W * .12,
      H * .60,
      0,

      W * .12,
      H * .60,
      W * .45
    );


  gradient.addColorStop(
    0,
    old
    ? "rgba(224,104,53,.055)"
    : "rgba(33,180,220,.075)"
  );


  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  gradient =
    ctx.createRadialGradient(
      W * .88,
      H * .48,
      0,

      W * .88,
      H * .48,
      W * .40
    );


  gradient.addColorStop(
    0,
    old
    ? "rgba(255,173,73,.045)"
    : "rgba(205,48,180,.065)"
  );


  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  ctx.restore();
}


/* ==========================================================
   MAP EDGE HINT
========================================================== */

function drawMapExitHints() {

  const map =
    getCurrentMap();


  for (
    const exit of
    map.exits || []
  ) {

    let x =
      exit.x +
      exit.w / 2;


    let y =
      exit.y +
      exit.h / 2;


    if (
      distance(
        player.x,
        player.y,
        x,
        y
      ) >
      600
    ) {

      continue;
    }


    const p =
      project(
        x,
        y,
        30
      );


    const pulse =
      .65 +
      Math.sin(
        performance.now() *
        .004
      ) *
      .18;


    ctx.globalAlpha =
      pulse;


    glow(
      "#ffc86a",
      14 *
      p.scale
    );


    ctx.fillStyle =
      "rgba(15,15,13,.88)";


    roundRectPath(
      p.x -
      90 * p.scale,

      p.y -
      55 * p.scale,

      180 * p.scale,

      34 * p.scale,

      8 * p.scale
    );

    ctx.fill();


    ctx.strokeStyle =
      "#ffc86a";


    ctx.lineWidth =
      1.5 *
      p.scale;


    ctx.stroke();


    noGlow();


    ctx.fillStyle =
      "#ffe0a1";


    ctx.font =
      `bold ${
        Math.max(
          8,
          11 *
          p.scale
        )
      }px sans-serif`;


    ctx.textAlign =
      "center";


    ctx.fillText(
      exit.label,
      p.x,
      p.y -
      33 * p.scale
    );


    ctx.globalAlpha = 1;
  }
}


/* ==========================================================
   CITY
========================================================== */

function drawCity(
  time
) {

  drawNightBackground();

  drawCityFloor();

  drawCityObjects(
    time
  );

  drawMapExitHints();

  drawRain(
    time
  );

  drawAtmosphere();
}


/* ==========================================================
   INTERIOR
========================================================== */

function drawInterior(
  time
) {

  drawNightBackground();


  if (
    currentInterior ===
    "convenience"
  ) {

    drawConvenience();
  }


  else if (
    currentInterior ===
    "restaurant"
  ) {

    drawRestaurant(
      time
    );
  }


  else if (
    currentInterior ===
    "office"
  ) {

    drawOffice();
  }


  else if (
    currentInterior ===
    "noodle"
  ) {

    drawNoodleShop(
      time
    );
  }


  else if (
    currentInterior ===
    "tea"
  ) {

    drawTeaHouse();
  }
}


/* ==========================================================
   TRANSITION OVERLAY
========================================================== */

function drawTransitionOverlay() {

  if (
    !transition.active
  ) {

    return;
  }


  ctx.save();


  ctx.fillStyle =
    `rgba(
      3,
      4,
      6,
      ${transition.alpha}
    )`;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  if (
    transition.phase ===
    "title" ||
    transition.phase ===
    "fadeIn"
  ) {

    const titleAlpha =
      transition.phase ===
      "title"
      ? Math.min(
          1,
          transition.timer *
          2.2
        )
      : transition.alpha;


    ctx.globalAlpha =
      titleAlpha;


    ctx.textAlign =
      "center";


    ctx.fillStyle =
      "rgba(255,255,255,.52)";


    ctx.font =
      "12px sans-serif";


    ctx.fillText(
      transition.chapter,
      W / 2,
      H / 2 -
      88
    );


    ctx.fillStyle =
      "#f4f6f5";


    ctx.font =
      "bold 32px sans-serif";


    ctx.fillText(
      transition.title,
      W / 2,
      H / 2 -
      38
    );


    ctx.fillStyle =
      "rgba(230,235,232,.72)";


    ctx.font =
      "14px sans-serif";


    ctx.fillText(
      transition.subtitle,
      W / 2,
      H / 2 -
      5
    );


    ctx.fillStyle =
      "rgba(255,211,145,.68)";


    ctx.font =
      "12px monospace";


    ctx.fillText(
      `${transition.clock}  ·  ${transition.weather}`,
      W / 2,
      H / 2 +
      38
    );


    ctx.strokeStyle =
      "rgba(255,199,102,.34)";


    ctx.lineWidth = 1;


    ctx.beginPath();

    ctx.moveTo(
      W / 2 -
      80,
      H / 2 +
      58
    );

    ctx.lineTo(
      W / 2 +
      80,
      H / 2 +
      58
    );

    ctx.stroke();
  }


  ctx.restore();
}


/* ==========================================================
   DRAW
========================================================== */

function draw(
  time
) {

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  if (
    scene === "city"
  ) {

    drawCity(
      time
    );
  }

  else {

    drawInterior(
      time
    );
  }


  drawTransitionOverlay();
}


/* ==========================================================
   INITIAL LOCATION UI
========================================================== */

function initializeLocationUI() {

  const map =
    getCurrentMap();


  locationTitle.textContent =
    map.name;


  locationSub.textContent =
    `${map.englishName} · ${map.district}`;
}


initializeLocationUI();


/* ==========================================================
   LOOP
========================================================== */

let previous =
  performance.now();


function loop(
  time
) {

  const dt =
    Math.min(
      (
        time -
        previous
      ) /
      1000,

      .05
    );


  previous =
    time;


  updatePlayer(
    dt
  );


  updateInteraction();


  updateTransition(
    dt
  );


  draw(
    time
  );


  requestAnimationFrame(
    loop
  );
}


requestAnimationFrame(
  loop
);
