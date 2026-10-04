/* ==========================================================
   杭州探索録3｜夜行杭州
   GAME Ver.0.9

   対応:
   ・world.js Ver.0.9
   ・2マップ
   ・デフォルメNPC
   ・NPC生活行動
   ・マップ切替
   ・建物入室
   ・雨 / 夜 / ネオン
========================================================== */


/* ==========================================================
   CANVAS
========================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const locationTitle = document.getElementById("locationTitle");
const locationSub = document.getElementById("locationSub");

const interactionBox = document.getElementById("interaction");
const interactionText = document.getElementById("interactionText");

let W = 0;
let H = 0;
let DPR = 1;

function resize() {

  DPR = Math.min(
    window.devicePixelRatio || 1,
    2
  );

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

window.addEventListener("resize", resize);
resize();


/* ==========================================================
   HELPERS
========================================================== */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {

  const dx = x2 - x1;
  const dy = y2 - y1;

  return Math.sqrt(
    dx * dx +
    dy * dy
  );
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function chance(v) {
  return Math.random() < v;
}

function rectContainsPoint(r, x, y) {

  return (
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function roundedRect(
  x,
  y,
  w,
  h,
  r
) {

  const radius =
    Math.min(
      r,
      w / 2,
      h / 2
    );

  ctx.beginPath();

  ctx.moveTo(
    x + radius,
    y
  );

  ctx.arcTo(
    x + w,
    y,
    x + w,
    y + h,
    radius
  );

  ctx.arcTo(
    x + w,
    y + h,
    x,
    y + h,
    radius
  );

  ctx.arcTo(
    x,
    y + h,
    x,
    y,
    radius
  );

  ctx.arcTo(
    x,
    y,
    x + w,
    y,
    radius
  );

  ctx.closePath();
}

function glow(
  color,
  blur = 15
) {

  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function noGlow() {

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}


/* ==========================================================
   CURRENT MAP
========================================================== */

let currentMapId = START_MAP;
let currentMap = MAPS[currentMapId];

applyMapGlobals(currentMapId);


/* ==========================================================
   SCENE
========================================================== */

let scene = "city";

let currentInterior = null;

let returnData = null;

let interactionTarget = null;

let transitionLock = 0;


/* ==========================================================
   PLAYER
========================================================== */

const player = {

  x:
    currentMap.playerSpawn.x,

  y:
    currentMap.playerSpawn.y,

  radius: 17,

  speed: 255,

  direction: "down",

  moving: false,

  step: 0,

  palette: "player",

  type: "player"
};


/* ==========================================================
   CAMERA
========================================================== */

const camera = {

  x: player.x,
  y: player.y
};


/* ==========================================================
   PROJECTION
========================================================== */

const VIEW = {

  playerScreenY: 0.70,

  depthScale: 0.51,

  perspective: 0.00029
};

function project(
  x,
  y,
  z = 0
) {

  const dy =
    y -
    camera.y;

  let scale =
    1 +
    dy *
    VIEW.perspective;

  scale =
    clamp(
      scale,
      0.46,
      1.54
    );

  return {

    x:
      W / 2 +
      (x - camera.x) *
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
   INPUT
========================================================== */

const keys = {};

window.addEventListener(
  "keydown",
  e => {

    const key =
      e.key.toLowerCase();

    keys[key] = true;

    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " "
      ].includes(key)
    ) {

      e.preventDefault();
    }

    if (
      key === "e" &&
      !e.repeat
    ) {

      interact();
    }
  }
);

window.addEventListener(
  "keyup",
  e => {

    keys[
      e.key.toLowerCase()
    ] = false;
  }
);


/* ==========================================================
   COLLISION
========================================================== */

function circleRectCollision(
  x,
  y,
  radius,
  rect
) {

  const nearestX =
    clamp(
      x,
      rect.x,
      rect.x + rect.w
    );

  const nearestY =
    clamp(
      y,
      rect.y,
      rect.y + rect.h
    );

  const dx =
    x -
    nearestX;

  const dy =
    y -
    nearestY;

  return (
    dx * dx +
    dy * dy <
    radius * radius
  );
}

function cityBlocked(
  x,
  y,
  radius = player.radius
) {

  for (
    const building
    of BUILDINGS
  ) {

    const pad = 8;

    if (
      circleRectCollision(
        x,
        y,
        radius,
        {
          x:
            building.x -
            pad,

          y:
            building.y -
            pad,

          w:
            building.w +
            pad * 2,

          h:
            building.h +
            pad * 2
        }
      )
    ) {

      return true;
    }
  }

  return false;
}


/* ==========================================================
   INTERIOR COLLISION
========================================================== */

function interiorBlocked(
  x,
  y
) {

  if (!currentInterior) {
    return false;
  }

  const data =
    INTERIORS[currentInterior];

  if (!data) {
    return false;
  }

  if (
    x < 45 ||
    y < 45 ||
    x >
      data.width - 45 ||
    y >
      data.height - 45
  ) {

    return true;
  }

  const blocks = [];

  if (
    currentInterior ===
    "convenience"
  ) {

    blocks.push(
      {
        x:100,
        y:100,
        w:170,
        h:420
      },
      {
        x:780,
        y:100,
        w:170,
        h:420
      },
      {
        x:360,
        y:170,
        w:330,
        h:80
      },
      {
        x:360,
        y:340,
        w:330,
        h:80
      }
    );
  }

  if (
    currentInterior ===
    "restaurant"
  ) {

    blocks.push(
      {
        x:90,
        y:90,
        w:870,
        h:130
      },
      {
        x:130,
        y:300,
        w:240,
        h:100
      },
      {
        x:680,
        y:300,
        w:240,
        h:100
      }
    );
  }

  if (
    currentInterior ===
    "office"
  ) {

    blocks.push(
      {
        x:120,
        y:100,
        w:860,
        h:110
      },
      {
        x:130,
        y:310,
        w:300,
        h:100
      },
      {
        x:670,
        y:310,
        w:300,
        h:100
      }
    );
  }

  if (
    currentInterior ===
    "noodle"
  ) {

    blocks.push(
      {
        x:90,
        y:80,
        w:820,
        h:120
      },
      {
        x:140,
        y:310,
        w:220,
        h:90
      },
      {
        x:640,
        y:310,
        w:220,
        h:90
      }
    );
  }

  if (
    currentInterior ===
    "tea"
  ) {

    blocks.push(
      {
        x:100,
        y:80,
        w:800,
        h:110
      },
      {
        x:170,
        y:320,
        w:200,
        h:100
      },
      {
        x:630,
        y:320,
        w:200,
        h:100
      }
    );
  }

  for (
    const b
    of blocks
  ) {

    if (
      circleRectCollision(
        x,
        y,
        player.radius,
        b
      )
    ) {

      return true;
    }
  }

  return false;
}


/* ==========================================================
   PLAYER MOVEMENT
========================================================== */

function updatePlayer(dt) {

  let dx = 0;
  let dy = 0;

  if (
    keys["w"] ||
    keys["arrowup"]
  ) {

    dy -= 1;
  }

  if (
    keys["s"] ||
    keys["arrowdown"]
  ) {

    dy += 1;
  }

  if (
    keys["a"] ||
    keys["arrowleft"]
  ) {

    dx -= 1;
  }

  if (
    keys["d"] ||
    keys["arrowright"]
  ) {

    dx += 1;
  }

  const len =
    Math.hypot(
      dx,
      dy
    );

  player.moving =
    len > 0;

  if (
    len > 0
  ) {

    dx /= len;
    dy /= len;

    if (
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      player.direction =
        dx < 0
          ? "left"
          : "right";

    } else {

      player.direction =
        dy < 0
          ? "up"
          : "down";
    }

    player.step +=
      dt * 9;
  }

  const amount =
    player.speed *
    dt;

  if (
    scene ===
    "city"
  ) {

    const nx =
      player.x +
      dx * amount;

    if (
      !cityBlocked(
        nx,
        player.y
      )
    ) {

      player.x =
        clamp(
          nx,
          22,
          WORLD.width - 22
        );
    }

    const ny =
      player.y +
      dy * amount;

    if (
      !cityBlocked(
        player.x,
        ny
      )
    ) {

      player.y =
        clamp(
          ny,
          22,
          WORLD.height - 22
        );
    }

  } else {

    const nx =
      player.x +
      dx * amount;

    if (
      !interiorBlocked(
        nx,
        player.y
      )
    ) {

      player.x = nx;
    }

    const ny =
      player.y +
      dy * amount;

    if (
      !interiorBlocked(
        player.x,
        ny
      )
    ) {

      player.y = ny;
    }
  }
}


/* ==========================================================
   NPC RUNTIME
========================================================== */

function initializeNPCs() {

  for (
    const npc
    of NPCS
  ) {

    if (
      npc.runtimeReady
    ) {
      continue;
    }

    npc.runtimeReady = true;

    npc.targetX =
      npc.x;

    npc.targetY =
      npc.y;

    npc.wait =
      rand(
        0.3,
        2.4
      );

    npc.walkPhase =
      rand(
        0,
        Math.PI * 2
      );

    npc.actionTimer =
      rand(
        1,
        4
      );
  }
}

initializeNPCs();


function chooseNPCTarget(
  npc
) {

  npc.targetX =
    clamp(
      npc.homeX +
      rand(
        -npc.roamX,
        npc.roamX
      ),
      30,
      WORLD.width - 30
    );

  npc.targetY =
    clamp(
      npc.homeY +
      rand(
        -npc.roamY,
        npc.roamY
      ),
      30,
      WORLD.height - 30
    );
}


/* ==========================================================
   NPC BEHAVIOUR
========================================================== */

function updateNPCs(dt) {

  if (
    scene !==
    "city"
  ) {
    return;
  }

  for (
    const npc
    of NPCS
  ) {

    if (
      !npc.runtimeReady
    ) {

      npc.runtimeReady = true;

      npc.targetX =
        npc.x;

      npc.targetY =
        npc.y;

      npc.wait =
        rand(
          0,
          2
        );

      npc.walkPhase =
        rand(
          0,
          6
        );
    }


    /* ---------------------------
       固定系
    --------------------------- */

    if (
      npc.behavior ===
      "idle"
    ) {

      npc.action =
        "idle";

      continue;
    }


    if (
      npc.behavior ===
      "eat"
    ) {

      npc.action =
        "eat";

      continue;
    }


    if (
      npc.behavior ===
      "shop"
    ) {

      const d =
        distance(
          npc.x,
          npc.y,
          npc.homeX,
          npc.homeY
        );

      if (
        d > 45
      ) {

        moveNPCTo(
          npc,
          npc.homeX,
          npc.homeY,
          dt
        );

      } else {

        npc.action =
          "shop";

        npc.wait -= dt;

        if (
          npc.wait <= 0
        ) {

          npc.direction =
            chance(0.5)
              ? "left"
              : "right";

          npc.wait =
            rand(
              2,
              5
            );
        }
      }

      continue;
    }


    /* ---------------------------
       移動 / 待機
    --------------------------- */

    if (
      npc.wait > 0
    ) {

      npc.wait -= dt;

      if (
        npc.behavior ===
        "phone"
      ) {

        npc.action =
          "phone";

      } else if (
        npc.behavior ===
        "umbrella"
      ) {

        npc.action =
          "umbrella";

      } else if (
        npc.behavior ===
        "delivery"
      ) {

        npc.action =
          "deliveryIdle";

      } else {

        npc.action =
          "idle";
      }

      continue;
    }


    const d =
      distance(
        npc.x,
        npc.y,
        npc.targetX,
        npc.targetY
      );


    if (
      d < 12
    ) {

      npc.wait =
        rand(
          1.2,
          4.5
        );

      chooseNPCTarget(
        npc
      );

      continue;
    }


    npc.action =
      npc.behavior ===
      "umbrella"
        ? "umbrellaWalk"
        : "walk";


    moveNPCTo(
      npc,
      npc.targetX,
      npc.targetY,
      dt
    );
  }
}


/* ==========================================================
   NPC MOVEMENT
========================================================== */

function moveNPCTo(
  npc,
  tx,
  ty,
  dt
) {

  const dx =
    tx -
    npc.x;

  const dy =
    ty -
    npc.y;

  const len =
    Math.hypot(
      dx,
      dy
    );

  if (
    len < 1
  ) {
    return;
  }

  const nx =
    dx / len;

  const ny =
    dy / len;

  if (
    Math.abs(nx) >
    Math.abs(ny)
  ) {

    npc.direction =
      nx < 0
        ? "left"
        : "right";

  } else {

    npc.direction =
      ny < 0
        ? "up"
        : "down";
  }

  const amount =
    npc.speed *
    dt;

  const nextX =
    npc.x +
    nx * amount;

  const nextY =
    npc.y +
    ny * amount;


  /*
     建物に入らないようにする。
  */

  if (
    !cityBlocked(
      nextX,
      npc.y,
      10
    )
  ) {

    npc.x =
      nextX;
  }

  if (
    !cityBlocked(
      npc.x,
      nextY,
      10
    )
  ) {

    npc.y =
      nextY;
  }


  npc.walkPhase +=
    dt * 8;
}


/* ==========================================================
   CAMERA
========================================================== */

function updateCamera(dt) {

  const speed =
    1 -
    Math.pow(
      0.001,
      dt
    );

  camera.x =
    lerp(
      camera.x,
      player.x,
      speed
    );

  camera.y =
    lerp(
      camera.y,
      player.y,
      speed
    );
}


/* ==========================================================
   INTERACTION
========================================================== */

function updateInteraction() {

  interactionTarget = null;

  if (
    scene ===
    "city"
  ) {

    let nearest =
      Infinity;

    for (
      const building
      of BUILDINGS
    ) {

      if (
        !building.enter ||
        !building.entrance
      ) {
        continue;
      }

      const e =
        building.entrance;

      const d =
        distance(
          player.x,
          player.y,
          e.x,
          e.y
        );

      if (
        d < 100 &&
        d < nearest
      ) {

        nearest = d;

        interactionTarget = {

          type:"building",

          building
        };
      }
    }

  } else {

    const interior =
      INTERIORS[
        currentInterior
      ];

    if (
      interior
    ) {

      const d =
        distance(
          player.x,
          player.y,
          interior.exit.x,
          interior.exit.y
        );

      if (
        d < 100
      ) {

        interactionTarget = {
          type:"exit"
        };
      }
    }
  }


  if (
    interactionTarget
  ) {

    interactionBox.classList.remove(
      "hidden"
    );

    if (
      interactionTarget.type ===
      "building"
    ) {

      interactionText.textContent =
        interactionTarget
          .building
          .sign ||
        "入る";

    } else {

      interactionText.textContent =
        "外へ出る";
    }

  } else {

    interactionBox.classList.add(
      "hidden"
    );
  }
}


function interact() {

  if (
    !interactionTarget
  ) {
    return;
  }

  if (
    interactionTarget.type ===
    "building"
  ) {

    enterBuilding(
      interactionTarget.building
    );
  }

  if (
    interactionTarget.type ===
    "exit"
  ) {

    leaveBuilding();
  }
}


/* ==========================================================
   BUILDING ENTRY
========================================================== */

function enterBuilding(
  building
) {

  if (
    !building.enter ||
    !INTERIORS[
      building.enter
    ]
  ) {
    return;
  }

  returnData = {

    mapId:
      currentMapId,

    x:
      building.entrance.x,

    y:
      building.entrance.y,

    side:
      building.entrance.side ||
      "south"
  };


  currentInterior =
    building.enter;

  scene =
    "interior";

  const interior =
    INTERIORS[
      currentInterior
    ];

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


function leaveBuilding() {

  if (
    !returnData
  ) {
    return;
  }

  scene =
    "city";

  currentInterior =
    null;

  switchMapData(
    returnData.mapId
  );

  let x =
    returnData.x;

  let y =
    returnData.y;

  const gap = 55;

  switch (
    returnData.side
  ) {

    case "north":
      y -= gap;
      break;

    case "south":
      y += gap;
      break;

    case "west":
      x -= gap;
      break;

    case "east":
      x += gap;
      break;
  }

  player.x = x;
  player.y = y;

  camera.x = x;
  camera.y = y;

  updateLocationUI();

  returnData = null;
}


/* ==========================================================
   MAP SWITCHING
========================================================== */

function switchMapData(
  mapId
) {

  currentMapId =
    mapId;

  currentMap =
    MAPS[
      currentMapId
    ];

  applyMapGlobals(
    currentMapId
  );

  initializeNPCs();
}


function checkMapExits(dt) {

  if (
    scene !==
    "city"
  ) {
    return;
  }

  if (
    transitionLock > 0
  ) {

    transitionLock -= dt;
    return;
  }

  for (
    const exit
    of currentMap.exits || []
  ) {

    if (
      rectContainsPoint(
        exit,
        player.x,
        player.y
      )
    ) {

      changeMap(exit);
      return;
    }
  }
}


/* ==========================================================
   FADE TRANSITION
========================================================== */

let fade = {

  active:false,

  alpha:0,

  phase:"none",

  target:null
};


function changeMap(
  exit
) {

  if (
    fade.active
  ) {
    return;
  }

  fade.active = true;

  fade.alpha = 0;

  fade.phase =
    "out";

  fade.target =
    exit;
}


function updateFade(dt) {

  if (
    !fade.active
  ) {
    return;
  }

  if (
    fade.phase ===
    "out"
  ) {

    fade.alpha +=
      dt * 2.8;

    if (
      fade.alpha >= 1
    ) {

      fade.alpha = 1;

      performMapChange();

      fade.phase =
        "in";
    }

  } else {

    fade.alpha -=
      dt * 1.7;

    if (
      fade.alpha <= 0
    ) {

      fade.alpha = 0;

      fade.active = false;

      fade.phase =
        "none";

      fade.target =
        null;
    }
  }
}


function performMapChange() {

  const exit =
    fade.target;

  switchMapData(
    exit.targetMap
  );

  player.x =
    exit.targetX;

  player.y =
    exit.targetY;

  camera.x =
    player.x;

  camera.y =
    player.y;

  transitionLock =
    1.3;

  updateLocationUI();

  showDistrictCard();
}


/* ==========================================================
   LOCATION UI
========================================================== */

function updateLocationUI() {

  locationTitle.textContent =
    currentMap.name;

  locationSub.textContent =
    `${currentMap.englishName} · ${currentMap.time} · ${currentMap.weather}`;
}


/* ==========================================================
   DISTRICT CARD
========================================================== */

let districtCard = {

  alpha:0,

  timer:0
};


function showDistrictCard() {

  districtCard.alpha = 1;

  districtCard.timer = 2.8;
}


function updateDistrictCard(dt) {

  if (
    districtCard.timer > 0
  ) {

    districtCard.timer -= dt;

    if (
      districtCard.timer < 0.8
    ) {

      districtCard.alpha =
        clamp(
          districtCard.timer /
          0.8,
          0,
          1
        );
    }
  }
}


function drawDistrictCard() {

  if (
    districtCard.alpha <= 0
  ) {
    return;
  }

  ctx.save();

  ctx.globalAlpha =
    districtCard.alpha;

  const cx =
    W / 2;

  const cy =
    H * 0.38;

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "rgba(235,244,250,.92)";

  ctx.font =
    "500 13px sans-serif";

  ctx.fillText(
    "杭州探索録",
    cx,
    cy - 54
  );

  ctx.font =
    "700 30px sans-serif";

  ctx.fillText(
    currentMap.name,
    cx,
    cy - 10
  );

  ctx.font =
    "400 13px sans-serif";

  ctx.fillStyle =
    "rgba(210,225,235,.75)";

  ctx.fillText(
    `${currentMap.district}　${currentMap.time}　${currentMap.weather}`,
    cx,
    cy + 24
  );

  ctx.restore();
}


/* ==========================================================
   BACKGROUND
========================================================== */

function drawBackground() {

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      H
    );

  if (
    currentMap.ambience ===
    "oldtown"
  ) {

    gradient.addColorStop(
      0,
      "#101319"
    );

    gradient.addColorStop(
      0.55,
      "#17181c"
    );

    gradient.addColorStop(
      1,
      "#0b0c10"
    );

  } else {

    gradient.addColorStop(
      0,
      "#07101a"
    );

    gradient.addColorStop(
      0.55,
      "#0b111a"
    );

    gradient.addColorStop(
      1,
      "#06090e"
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
   WORLD POLYGON
========================================================== */

function drawWorldRect(
  x,
  y,
  w,
  h,
  color
) {

  const a =
    project(
      x,
      y
    );

  const b =
    project(
      x + w,
      y
    );

  const c =
    project(
      x + w,
      y + h
    );

  const d =
    project(
      x,
      y + h
    );

  ctx.fillStyle =
    color;

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
}


/* ==========================================================
   PLAZAS
========================================================== */

function drawPlazas() {

  for (
    const plaza
    of PLAZAS
  ) {

    let color =
      "#20262c";

    if (
      plaza.type ===
      "old"
    ) {

      color =
        "#282624";
    }

    if (
      plaza.type ===
      "commercial"
    ) {

      color =
        "#20242b";
    }

    drawWorldRect(
      plaza.x,
      plaza.y,
      plaza.w,
      plaza.h,
      color
    );


    /*
       舗装タイル
    */

    for (
      let x =
        plaza.x + 40;
      x <
        plaza.x +
        plaza.w;
      x += 90
    ) {

      const p1 =
        project(
          x,
          plaza.y
        );

      const p2 =
        project(
          x,
          plaza.y +
          plaza.h
        );

      ctx.strokeStyle =
        "rgba(255,255,255,.035)";

      ctx.lineWidth = 1;

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
}


/* ==========================================================
   ROADS
========================================================== */

function drawRoads() {

  for (
    const road
    of ROADS
  ) {

    let color =
      "#151b22";

    if (
      currentMap.ambience ===
      "oldtown"
    ) {

      color =
        "#1d1c1c";
    }

    if (
      road.type ===
      "alley" ||
      road.type ===
      "tiny"
    ) {

      color =
        currentMap.ambience ===
        "oldtown"
          ? "#22201f"
          : "#181c20";
    }

    drawWorldRect(
      road.x,
      road.y,
      road.w,
      road.h,
      color
    );


    /*
       濡れた道路の反射
    */

    const cx =
      road.x +
      road.w / 2;

    const cy =
      road.y +
      road.h / 2;

    const p =
      project(
        cx,
        cy
      );

    const length =
      Math.max(
        road.w,
        road.h
      ) *
      p.scale *
      0.11;

    const grad =
      ctx.createLinearGradient(
        p.x - length,
        p.y,
        p.x + length,
        p.y
      );

    grad.addColorStop(
      0,
      "rgba(40,220,255,0)"
    );

    grad.addColorStop(
      .45,
      "rgba(40,220,255,.045)"
    );

    grad.addColorStop(
      .55,
      "rgba(255,70,170,.04)"
    );

    grad.addColorStop(
      1,
      "rgba(255,70,170,0)"
    );

    ctx.fillStyle =
      grad;

    ctx.fillRect(
      p.x - length,
      p.y - 10,
      length * 2,
      20
    );
  }
}


/* ==========================================================
   PUDDLES
========================================================== */

function drawPuddles() {

  const count =
    currentMapId ===
    "oldtown"
      ? 18
      : 13;

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const x =
      300 +
      ((i * 731) %
        (WORLD.width - 600));

    const y =
      500 +
      ((i * 977) %
        (WORLD.height - 800));

    const p =
      project(
        x,
        y
      );

    if (
      p.x < -100 ||
      p.x > W + 100 ||
      p.y < -100 ||
      p.y > H + 100
    ) {
      continue;
    }

    ctx.save();

    ctx.globalAlpha =
      .15;

    ctx.fillStyle =
      i % 3 === 0
        ? "#45e9ff"
        : i % 3 === 1
          ? "#ff5f9f"
          : "#ffb85a";

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y,
      30 * p.scale,
      4 * p.scale,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }
}


/* ==========================================================
   BUILDINGS
========================================================== */

function buildingColors(
  building
) {

  switch (
    building.visualType
  ) {

    case "glassOffice":
      return {
        front:"#111c28",
        side:"#0a1119",
        roof:"#182530"
      };

    case "megaTower":
      return {
        front:"#151828",
        side:"#0d0f1a",
        roof:"#202438"
      };

    case "dataCenter":
      return {
        front:"#171821",
        side:"#0d0e14",
        roof:"#25242d"
      };

    case "oldResidentialDense":
      return {
        front:"#302d2a",
        side:"#1e1b19",
        roof:"#39342f"
      };

    case "oldShop":
    case "fruitShop":
    case "noodleShop":
    case "teaShop":
      return {
        front:"#352e28",
        side:"#211b18",
        roof:"#40362e"
      };

    case "residential":
      return {
        front:"#24252a",
        side:"#17181c",
        roof:"#303138"
      };

    case "dinerBuilding":
      return {
        front:"#2b2524",
        side:"#1b1717",
        roof:"#37302d"
      };

    default:
      return {
        front:"#19202a",
        side:"#10151c",
        roof:"#252d37"
      };
  }
}


function drawBuilding(
  building
) {

  const height =
    Math.min(
      170 +
      building.floors * 20,
      620
    );

  const a =
    project(
      building.x,
      building.y
    );

  const b =
    project(
      building.x +
      building.w,
      building.y
    );

  const c =
    project(
      building.x +
      building.w,
      building.y +
      building.h
    );

  const d =
    project(
      building.x,
      building.y +
      building.h
    );

  const at =
    project(
      building.x,
      building.y,
      height
    );

  const bt =
    project(
      building.x +
      building.w,
      building.y,
      height
    );

  const ct =
    project(
      building.x +
      building.w,
      building.y +
      building.h,
      height
    );

  const dt =
    project(
      building.x,
      building.y +
      building.h,
      height
    );

  const colors =
    buildingColors(
      building
    );


  /* side */

  ctx.fillStyle =
    colors.side;

  ctx.beginPath();

  ctx.moveTo(
    b.x,
    b.y
  );

  ctx.lineTo(
    c.x,
    c.y
  );

  ctx.lineTo(
    ct.x,
    ct.y
  );

  ctx.lineTo(
    bt.x,
    bt.y
  );

  ctx.closePath();
  ctx.fill();


  /* front */

  ctx.fillStyle =
    colors.front;

  ctx.beginPath();

  ctx.moveTo(
    d.x,
    d.y
  );

  ctx.lineTo(
    c.x,
    c.y
  );

  ctx.lineTo(
    ct.x,
    ct.y
  );

  ctx.lineTo(
    dt.x,
    dt.y
  );

  ctx.closePath();
  ctx.fill();


  /* roof */

  ctx.fillStyle =
    colors.roof;

  ctx.beginPath();

  ctx.moveTo(
    at.x,
    at.y
  );

  ctx.lineTo(
    bt.x,
    bt.y
  );

  ctx.lineTo(
    ct.x,
    ct.y
  );

  ctx.lineTo(
    dt.x,
    dt.y
  );

  ctx.closePath();
  ctx.fill();


  drawBuildingWindows(
    building,
    height
  );

  drawBuildingDetails(
    building,
    height
  );

  drawGroundFloor(
    building
  );

  drawBuildingSign(
    building,
    height
  );
}


/* ==========================================================
   WINDOWS
========================================================== */

function drawBuildingWindows(
  building,
  height
) {

  const rows =
    clamp(
      Math.floor(
        building.floors / 2
      ),
      3,
      11
    );

  const cols =
    clamp(
      Math.floor(
        building.w / 150
      ),
      3,
      8
    );

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
        building.x +
        50 +
        (
          building.w - 100
        ) *
        (
          col /
          Math.max(
            cols - 1,
            1
          )
        );

      const z =
        55 +
        row *
        (
          height - 100
        ) /
        rows;

      const p =
        project(
          wx,
          building.y +
          building.h +
          2,
          z
        );

      const lit =
        (
          row * 7 +
          col * 13 +
          building.id.length
        ) % 5 !== 0;

      const ww =
        Math.max(
          12,
          34 * p.scale
        );

      const wh =
        Math.max(
          8,
          22 * p.scale
        );

      ctx.fillStyle =
        lit
          ? (
            currentMap.ambience ===
            "oldtown"
              ? "rgba(255,192,116,.48)"
              : "rgba(116,206,235,.31)"
          )
          : "rgba(8,12,17,.9)";

      ctx.fillRect(
        p.x - ww / 2,
        p.y - wh,
        ww,
        wh
      );


      /*
         室内の気配
      */

      if (
        lit &&
        (
          row +
          col
        ) % 4 === 0
      ) {

        ctx.fillStyle =
          "rgba(20,18,18,.55)";

        ctx.fillRect(
          p.x - ww * .25,
          p.y - wh * .55,
          ww * .18,
          wh * .55
        );
      }
    }
  }
}


/* ==========================================================
   BUILDING DETAIL
========================================================== */

function drawBuildingDetails(
  building,
  height
) {

  const old =
    currentMap.ambience ===
    "oldtown" ||
    [
      "oldResidentialDense",
      "oldShop",
      "fruitShop",
      "noodleShop",
      "teaShop"
    ].includes(
      building.visualType
    );


  /*
     AC units
  */

  const acCount =
    old
      ? Math.min(
          7,
          Math.floor(
            building.w / 150
          )
        )
      : 3;

  for (
    let i = 0;
    i < acCount;
    i++
  ) {

    const x =
      building.x +
      70 +
      i *
      (
        building.w - 140
      ) /
      Math.max(
        acCount - 1,
        1
      );

    const z =
      90 +
      (
        i % 3
      ) * 60;

    drawACUnit(
      x,
      building.y +
      building.h +
      5,
      z
    );
  }


  /*
     pipes
  */

  if (
    old ||
    building.visualType ===
    "oldMixed"
  ) {

    for (
      let i = 0;
      i < 2;
      i++
    ) {

      const x =
        building.x +
        55 +
        i *
        Math.max(
          90,
          building.w - 110
        );

      const bottom =
        project(
          x,
          building.y +
          building.h +
          7,
          20
        );

      const top =
        project(
          x,
          building.y +
          building.h +
          7,
          Math.min(
            height - 30,
            280
          )
        );

      ctx.strokeStyle =
        "rgba(130,120,105,.48)";

      ctx.lineWidth =
        Math.max(
          1,
          3 * bottom.scale
        );

      ctx.beginPath();

      ctx.moveTo(
        bottom.x,
        bottom.y
      );

      ctx.lineTo(
        top.x,
        top.y
      );

      ctx.stroke();
    }
  }


  /*
     rooftop equipment
  */

  const roof =
    project(
      building.x +
      building.w * .65,
      building.y +
      building.h * .45,
      height + 18
    );

  ctx.fillStyle =
    "#151a1e";

  ctx.fillRect(
    roof.x - 22 * roof.scale,
    roof.y - 18 * roof.scale,
    44 * roof.scale,
    18 * roof.scale
  );

  ctx.strokeStyle =
    "rgba(255,255,255,.12)";

  ctx.strokeRect(
    roof.x - 22 * roof.scale,
    roof.y - 18 * roof.scale,
    44 * roof.scale,
    18 * roof.scale
  );
}


/* ==========================================================
   AC UNIT
========================================================== */

function drawACUnit(
  x,
  y,
  z
) {

  const p =
    project(
      x,
      y,
      z
    );

  const w =
    30 *
    p.scale;

  const h =
    17 *
    p.scale;

  ctx.fillStyle =
    "#a7aa9f";

  ctx.fillRect(
    p.x - w / 2,
    p.y - h,
    w,
    h
  );

  ctx.fillStyle =
    "#535a58";

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - h / 2,
    5 * p.scale,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeStyle =
    "rgba(20,20,20,.45)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - h / 2,
    7 * p.scale,
    0,
    Math.PI * 2
  );

  ctx.stroke();
}


/* ==========================================================
   GROUND FLOOR
========================================================== */

function drawGroundFloor(
  building
) {

  const frontY =
    building.y +
    building.h +
    5;

  const center =
    project(
      building.x +
      building.w / 2,
      frontY,
      35
    );

  const width =
    Math.min(
      260,
      building.w * .55
    ) *
    center.scale;

  const height =
    48 *
    center.scale;

  const warm =
    currentMap.ambience ===
    "oldtown" ||
    [
      "dinerBuilding",
      "oldShop",
      "fruitShop",
      "noodleShop",
      "teaShop"
    ].includes(
      building.visualType
    );

  ctx.fillStyle =
    warm
      ? "rgba(255,181,92,.46)"
      : "rgba(74,219,255,.20)";

  ctx.fillRect(
    center.x - width / 2,
    center.y - height,
    width,
    height
  );

  ctx.fillStyle =
    "rgba(15,15,17,.82)";

  ctx.fillRect(
    center.x - 15 * center.scale,
    center.y - 42 * center.scale,
    30 * center.scale,
    42 * center.scale
  );


  /*
     awning
  */

  if (
    currentMap.ambience ===
    "oldtown"
  ) {

    ctx.fillStyle =
      building.neon ||
      "#d65d4b";

    ctx.fillRect(
      center.x - width * .52,
      center.y - height - 9 * center.scale,
      width * 1.04,
      9 * center.scale
    );
  }
}


/* ==========================================================
   BUILDING SIGN
========================================================== */

function drawBuildingSign(
  building,
  height
) {

  if (
    !building.sign
  ) {
    return;
  }

  const p =
    project(
      building.x +
      building.w * .5,
      building.y +
      building.h +
      8,
      Math.min(
        height * .55,
        210
      )
    );

  ctx.save();

  glow(
    building.neon ||
    "#44e8ff",
    10
  );

  ctx.fillStyle =
    building.neon ||
    "#44e8ff";

  ctx.font =
    `${Math.max(
      10,
      15 * p.scale
    )}px sans-serif`;

  ctx.textAlign =
    "center";

  ctx.fillText(
    building.sign,
    p.x,
    p.y
  );

  ctx.restore();
}


/* ==========================================================
   TREES
========================================================== */

function drawTree(
  tree
) {

  const p =
    project(
      tree.x,
      tree.y
    );

  ctx.strokeStyle =
    "#423d34";

  ctx.lineWidth =
    7 *
    p.scale;

  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  ctx.lineTo(
    p.x,
    p.y -
    65 * p.scale
  );

  ctx.stroke();

  const canopyY =
    p.y -
    80 * p.scale;

  ctx.fillStyle =
    currentMap.ambience ===
    "oldtown"
      ? "#26372d"
      : "#18362f";

  ctx.beginPath();

  ctx.arc(
    p.x,
    canopyY,
    30 * p.scale,
    0,
    Math.PI * 2
  );

  ctx.arc(
    p.x -
    20 * p.scale,
    canopyY +
    8 * p.scale,
    22 * p.scale,
    0,
    Math.PI * 2
  );

  ctx.arc(
    p.x +
    21 * p.scale,
    canopyY +
    6 * p.scale,
    23 * p.scale,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* ==========================================================
   STREET LIGHT
========================================================== */

function drawStreetLight(
  light
) {

  const base =
    project(
      light.x,
      light.y
    );

  const top =
    project(
      light.x,
      light.y,
      135
    );

  ctx.strokeStyle =
    "#555b61";

  ctx.lineWidth =
    Math.max(
      1,
      4 * base.scale
    );

  ctx.beginPath();

  ctx.moveTo(
    base.x,
    base.y
  );

  ctx.lineTo(
    top.x,
    top.y
  );

  ctx.stroke();

  ctx.save();

  glow(
    "#ffd58a",
    18
  );

  ctx.fillStyle =
    "#ffd58a";

  ctx.beginPath();

  ctx.arc(
    top.x,
    top.y,
    5 * top.scale,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  /*
     light pool
  */

  ctx.save();

  ctx.globalAlpha =
    .07;

  ctx.fillStyle =
    "#ffd890";

  ctx.beginPath();

  ctx.ellipse(
    base.x,
    base.y,
    55 * base.scale,
    11 * base.scale,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}


/* ==========================================================
   STREET SIGNS
========================================================== */

function drawStreetSign(
  sign
) {

  const p =
    project(
      sign.x,
      sign.y,
      100
    );

  ctx.save();

  ctx.fillStyle =
    "rgba(8,13,17,.88)";

  ctx.strokeStyle =
    sign.color ||
    "#4ce8ff";

  ctx.lineWidth =
    Math.max(
      1,
      2 * p.scale
    );

  const w =
    150 *
    p.scale;

  const h =
    30 *
    p.scale;

  ctx.fillRect(
    p.x - w / 2,
    p.y - h,
    w,
    h
  );

  ctx.strokeRect(
    p.x - w / 2,
    p.y - h,
    w,
    h
  );

  ctx.fillStyle =
    sign.color ||
    "#4ce8ff";

  ctx.font =
    `${Math.max(
      9,
      11 * p.scale
    )}px sans-serif`;

  ctx.textAlign =
    "center";

  ctx.fillText(
    sign.text,
    p.x,
    p.y -
    10 * p.scale
  );

  ctx.restore();
}


/* ==========================================================
   PROPS
========================================================== */

function drawProp(
  prop
) {

  const p =
    project(
      prop.x,
      prop.y
    );

  const s =
    p.scale;

  ctx.save();

  switch (
    prop.type
  ) {

    case "bike":

      ctx.strokeStyle =
        "#8e989c";

      ctx.lineWidth =
        Math.max(
          1,
          2 * s
        );

      ctx.beginPath();

      ctx.arc(
        p.x - 10 * s,
        p.y - 6 * s,
        7 * s,
        0,
        Math.PI * 2
      );

      ctx.arc(
        p.x + 11 * s,
        p.y - 6 * s,
        7 * s,
        0,
        Math.PI * 2
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        p.x - 10 * s,
        p.y - 6 * s
      );

      ctx.lineTo(
        p.x,
        p.y - 18 * s
      );

      ctx.lineTo(
        p.x + 11 * s,
        p.y - 6 * s
      );

      ctx.stroke();

      break;


    case "scooter":

      ctx.fillStyle =
        "#252c31";

      ctx.fillRect(
        p.x - 16 * s,
        p.y - 11 * s,
        31 * s,
        10 * s
      );

      ctx.fillStyle =
        "#7a8990";

      ctx.fillRect(
        p.x + 6 * s,
        p.y - 30 * s,
        3 * s,
        22 * s
      );

      ctx.fillStyle =
        "#ffcf4f";

      ctx.fillRect(
        p.x - 12 * s,
        p.y - 21 * s,
        14 * s,
        10 * s
      );

      break;


    case "vending":

      ctx.fillStyle =
        "#d7d9dc";

      ctx.fillRect(
        p.x - 15 * s,
        p.y - 47 * s,
        30 * s,
        47 * s
      );

      glow(
        "#71dcff",
        8
      );

      ctx.fillStyle =
        "#78d8ef";

      ctx.fillRect(
        p.x - 10 * s,
        p.y - 39 * s,
        20 * s,
        20 * s
      );

      noGlow();

      break;


    case "trash":

      ctx.fillStyle =
        "#404a4d";

      ctx.fillRect(
        p.x - 10 * s,
        p.y - 20 * s,
        20 * s,
        20 * s
      );

      break;


    case "boxes":

      ctx.fillStyle =
        "#8d6b45";

      ctx.fillRect(
        p.x - 14 * s,
        p.y - 13 * s,
        24 * s,
        13 * s
      );

      ctx.fillStyle =
        "#705235";

      ctx.fillRect(
        p.x - 4 * s,
        p.y - 24 * s,
        20 * s,
        12 * s
      );

      break;


    case "plant":

      ctx.fillStyle =
        "#59483b";

      ctx.fillRect(
        p.x - 7 * s,
        p.y - 10 * s,
        14 * s,
        10 * s
      );

      ctx.fillStyle =
        "#426d4d";

      ctx.beginPath();

      ctx.arc(
        p.x,
        p.y - 17 * s,
        10 * s,
        0,
        Math.PI * 2
      );

      ctx.fill();

      break;


    case "bench":

      ctx.fillStyle =
        "#655443";

      ctx.fillRect(
        p.x - 28 * s,
        p.y - 13 * s,
        56 * s,
        8 * s
      );

      ctx.fillRect(
        p.x - 23 * s,
        p.y - 5 * s,
        5 * s,
        8 * s
      );

      ctx.fillRect(
        p.x + 18 * s,
        p.y - 5 * s,
        5 * s,
        8 * s
      );

      break;


    case "cone":

      ctx.fillStyle =
        "#ff7748";

      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y - 23 * s
      );

      ctx.lineTo(
        p.x - 9 * s,
        p.y
      );

      ctx.lineTo(
        p.x + 9 * s,
        p.y
      );

      ctx.closePath();
      ctx.fill();

      break;


    case "barrier":

      ctx.strokeStyle =
        "#ff8b52";

      ctx.lineWidth =
        4 * s;

      ctx.beginPath();

      ctx.moveTo(
        p.x - 26 * s,
        p.y - 17 * s
      );

      ctx.lineTo(
        p.x + 26 * s,
        p.y - 17 * s
      );

      ctx.stroke();

      break;


    case "utility":

      ctx.fillStyle =
        "#536066";

      ctx.fillRect(
        p.x - 13 * s,
        p.y - 34 * s,
        26 * s,
        34 * s
      );

      break;


    case "umbrella":

      ctx.strokeStyle =
        "#697278";

      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y
      );

      ctx.lineTo(
        p.x,
        p.y - 26 * s
      );

      ctx.stroke();

      ctx.fillStyle =
        "rgba(87,99,110,.75)";

      ctx.beginPath();

      ctx.arc(
        p.x,
        p.y - 29 * s,
        18 * s,
        Math.PI,
        Math.PI * 2
      );

      ctx.fill();

      break;


    case "drain":

      ctx.strokeStyle =
        "rgba(140,150,155,.4)";

      ctx.strokeRect(
        p.x - 15 * s,
        p.y - 4 * s,
        30 * s,
        7 * s
      );

      break;


    case "acstack":

      ctx.fillStyle =
        "#949995";

      ctx.fillRect(
        p.x - 15 * s,
        p.y - 19 * s,
        30 * s,
        19 * s
      );

      ctx.fillStyle =
        "#4d5554";

      ctx.beginPath();

      ctx.arc(
        p.x,
        p.y - 10 * s,
        5 * s,
        0,
        Math.PI * 2
      );

      ctx.fill();

      break;
  }

  ctx.restore();
}


/* ==========================================================
   STALL
========================================================== */

function drawStall(
  stall
) {

  const p =
    project(
      stall.x,
      stall.y
    );

  const s =
    p.scale;

  ctx.save();

  /*
     warm pool
  */

  ctx.globalAlpha =
    .10;

  ctx.fillStyle =
    stall.color;

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y,
    55 * s,
    12 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.globalAlpha = 1;


  /*
     stall
  */

  ctx.fillStyle =
    "#292421";

  ctx.fillRect(
    p.x - 31 * s,
    p.y - 39 * s,
    62 * s,
    39 * s
  );

  glow(
    stall.color,
    12
  );

  ctx.fillStyle =
    stall.color;

  ctx.fillRect(
    p.x - 37 * s,
    p.y - 50 * s,
    74 * s,
    12 * s
  );

  noGlow();


  /*
     label
  */

  ctx.fillStyle =
    "#fff4dc";

  ctx.textAlign =
    "center";

  ctx.font =
    `${Math.max(
      8,
      10 * s
    )}px sans-serif`;

  ctx.fillText(
    stall.name,
    p.x,
    p.y - 41 * s
  );


  /*
     steam
  */

  const t =
    performance.now() *
    .001;

  ctx.strokeStyle =
    "rgba(230,235,235,.20)";

  ctx.lineWidth =
    2 * s;

  for (
    let i = 0;
    i < 2;
    i++
  ) {

    const sx =
      p.x +
      (
        i * 13 - 7
      ) * s;

    ctx.beginPath();

    ctx.moveTo(
      sx,
      p.y - 52 * s
    );

    ctx.bezierCurveTo(
      sx +
      Math.sin(
        t * 2 +
        i
      ) * 6,
      p.y - 66 * s,

      sx - 5,
      p.y - 73 * s,

      sx + 2,
      p.y - 82 * s
    );

    ctx.stroke();
  }

  ctx.restore();
}


/* ==========================================================
   CHARACTER PALETTE
========================================================== */

function getCharacterPalette(
  name
) {

  const palettes = {

    player:{
      hair:"#17232d",
      skin:"#e0b58e",
      body:"#182b37",
      body2:"#203c49",
      accent:"#49e4ff",
      legs:"#182027",
      shoes:"#dce5e8"
    },

    navy:{
      hair:"#252525",
      skin:"#d8aa83",
      body:"#263645",
      body2:"#31495c",
      accent:"#7199ad",
      legs:"#242a31",
      shoes:"#afb6ba"
    },

    charcoal:{
      hair:"#2b2425",
      skin:"#e0b28c",
      body:"#404147",
      body2:"#55565c",
      accent:"#8e9298",
      legs:"#292b30",
      shoes:"#a9adb0"
    },

    purple:{
      hair:"#30252f",
      skin:"#deb08c",
      body:"#55405f",
      body2:"#6a5077",
      accent:"#b48aca",
      legs:"#30303a",
      shoes:"#b8b7c0"
    },

    yellow:{
      hair:"#282727",
      skin:"#d7aa85",
      body:"#d6a82d",
      body2:"#f0c846",
      accent:"#fff09b",
      legs:"#31363a",
      shoes:"#c6c9c9"
    },

    blue:{
      hair:"#20272d",
      skin:"#d9ad89",
      body:"#315d78",
      body2:"#3e7698",
      accent:"#76cbed",
      legs:"#27323b",
      shoes:"#b8c2c6"
    },

    green:{
      hair:"#292722",
      skin:"#d6aa84",
      body:"#425d4b",
      body2:"#55735f",
      accent:"#8cb296",
      legs:"#2c332f",
      shoes:"#aaa99f"
    },

    gray:{
      hair:"#34312f",
      skin:"#d9ad88",
      body:"#53575a",
      body2:"#676c70",
      accent:"#9ca4a8",
      legs:"#303337",
      shoes:"#b8b9b6"
    },

    red:{
      hair:"#312724",
      skin:"#dbad86",
      body:"#71433e",
      body2:"#8d5149",
      accent:"#dc8274",
      legs:"#332e2e",
      shoes:"#b6aca8"
    },

    brown:{
      hair:"#302823",
      skin:"#d5a680",
      body:"#624c3d",
      body2:"#79604d",
      accent:"#ae896b",
      legs:"#37312d",
      shoes:"#b5aa9d"
    },

    cream:{
      hair:"#342c28",
      skin:"#e1b48e",
      body:"#b5a78f",
      body2:"#c9baa1",
      accent:"#e6d5b6",
      legs:"#45413e",
      shoes:"#d6d0c6"
    },

    black:{
      hair:"#1f2022",
      skin:"#d7aa86",
      body:"#292b31",
      body2:"#353840",
      accent:"#737983",
      legs:"#202226",
      shoes:"#a8acb0"
    },

    cyan:{
      hair:"#20272c",
      skin:"#ddb08a",
      body:"#2e5c66",
      body2:"#397581",
      accent:"#5be4eb",
      legs:"#27353a",
      shoes:"#c4d2d4"
    }
  };

  return (
    palettes[name] ||
    palettes.gray
  );
}


/* ==========================================================
   DEFORMED GAME CHARACTER

   ★ Ver.0.9の中心部分

   ・2〜2.5頭身
   ・顔を描き込まない
   ・大きい頭
   ・短い腕脚
   ・服の色面で判別
   ・持ち物で職業を表現
========================================================== */

function drawCharacter(
  char,
  isPlayer = false
) {

  const p =
    project(
      char.x,
      char.y
    );

  const s =
    p.scale;

  const palette =
    getCharacterPalette(
      isPlayer
        ? "player"
        : char.palette
    );

  const moving =
    isPlayer
      ? player.moving
      : (
        char.action ===
        "walk" ||
        char.action ===
        "umbrellaWalk"
      );

  const phase =
    isPlayer
      ? player.step
      : char.walkPhase || 0;

  const bob =
    moving
      ? Math.abs(
          Math.sin(
            phase
          )
        ) *
        2.2 *
        s
      : 0;

  const foot =
    moving
      ? Math.sin(
          phase
        ) *
        5 *
        s
      : 0;

  const dir =
    char.direction ||
    "down";


  ctx.save();


  /* ========================================================
     SHADOW
  ======================================================== */

  ctx.fillStyle =
    "rgba(0,0,0,.32)";

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y + 1,
    17 * s,
    5 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* wet reflection */

  ctx.save();

  ctx.globalAlpha =
    .055;

  ctx.fillStyle =
    isPlayer
      ? "#49e4ff"
      : "#d8e4e7";

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y + 9 * s,
    11 * s,
    18 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  /* ========================================================
     CHARACTER ORIGIN
  ======================================================== */

  ctx.translate(
    p.x,
    p.y - bob
  );


  /*
     全体として約70px。
     頭をかなり大きくする。
  */

  const headY =
    -55 * s;

  const bodyY =
    -34 * s;


  /* ========================================================
     BACK ACCESSORIES
  ======================================================== */

  if (
    char.type ===
    "student"
  ) {

    ctx.fillStyle =
      "#303943";

    roundedRect(
      -14 * s,
      -40 * s,
      28 * s,
      27 * s,
      6 * s
    );

    ctx.fill();
  }


  if (
    char.type ===
    "delivery"
  ) {

    ctx.fillStyle =
      "#d9b32f";

    roundedRect(
      -17 * s,
      -43 * s,
      34 * s,
      31 * s,
      4 * s
    );

    ctx.fill();

    ctx.fillStyle =
      "#fff0a2";

    ctx.fillRect(
      -11 * s,
      -36 * s,
      22 * s,
      4 * s
    );
  }


  /* ========================================================
     LEGS
  ======================================================== */

  ctx.fillStyle =
    palette.legs;

  roundedRect(
    -11 * s,
    -19 * s,
    8 * s,
    20 * s + foot,
    3 * s
  );

  ctx.fill();

  roundedRect(
    3 * s,
    -19 * s,
    8 * s,
    20 * s - foot,
    3 * s
  );

  ctx.fill();


  /* shoes */

  ctx.fillStyle =
    palette.shoes;

  roundedRect(
    -13 * s,
    -2 * s + foot,
    11 * s,
    5 * s,
    2 * s
  );

  ctx.fill();

  roundedRect(
    2 * s,
    -2 * s - foot,
    11 * s,
    5 * s,
    2 * s
  );

  ctx.fill();


  /* ========================================================
     BODY
  ======================================================== */

  ctx.fillStyle =
    palette.body;

  roundedRect(
    -17 * s,
    bodyY,
    34 * s,
    25 * s,
    8 * s
  );

  ctx.fill();


  /*
     jacket lower block
  */

  ctx.fillStyle =
    palette.body2;

  ctx.beginPath();

  ctx.moveTo(
    -15 * s,
    -23 * s
  );

  ctx.lineTo(
    15 * s,
    -23 * s
  );

  ctx.lineTo(
    12 * s,
    -10 * s
  );

  ctx.lineTo(
    -12 * s,
    -10 * s
  );

  ctx.closePath();

  ctx.fill();


  /*
     主人公のシアンライン
  */

  if (
    isPlayer
  ) {

    ctx.fillStyle =
      palette.accent;

    glow(
      palette.accent,
      5
    );

    ctx.fillRect(
      -2 * s,
      -32 * s,
      4 * s,
      20 * s
    );

    noGlow();
  }


  /* ========================================================
     ARMS
  ======================================================== */

  let armSwing =
    moving
      ? Math.sin(
          phase
        ) *
        4 *
        s
      : 0;


  ctx.fillStyle =
    palette.body2;


  roundedRect(
    -21 * s,
    -31 * s + armSwing,
    7 * s,
    21 * s,
    3 * s
  );

  ctx.fill();


  roundedRect(
    14 * s,
    -31 * s - armSwing,
    7 * s,
    21 * s,
    3 * s
  );

  ctx.fill();


  /* ========================================================
     HEAD

     円形ではなく角丸ブロック。
     人間らしすぎない。
  ======================================================== */

  ctx.fillStyle =
    palette.skin;

  roundedRect(
    -16 * s,
    headY - 12 * s,
    32 * s,
    29 * s,
    10 * s
  );

  ctx.fill();


  /* ========================================================
     HAIR
  ======================================================== */

  ctx.fillStyle =
    palette.hair;

  ctx.beginPath();

  ctx.moveTo(
    -16 * s,
    headY - 1 * s
  );

  ctx.quadraticCurveTo(
    -16 * s,
    headY - 17 * s,
    0,
    headY - 18 * s
  );

  ctx.quadraticCurveTo(
    17 * s,
    headY - 17 * s,
    16 * s,
    headY - 1 * s
  );

  ctx.lineTo(
    11 * s,
    headY - 6 * s
  );

  ctx.lineTo(
    7 * s,
    headY - 2 * s
  );

  ctx.lineTo(
    2 * s,
    headY - 7 * s
  );

  ctx.lineTo(
    -3 * s,
    headY - 2 * s
  );

  ctx.lineTo(
    -8 * s,
    headY - 7 * s
  );

  ctx.closePath();

  ctx.fill();


  /*
     後ろ向きの場合は顔を完全に消す。
  */

  if (
    dir !== "up"
  ) {

    /*
       顔は「点2つ」にしない。
       小さな影だけ。
       これで人形っぽくなる。
    */

    ctx.fillStyle =
      "rgba(70,50,45,.22)";

    ctx.fillRect(
      -5 * s,
      headY + 6 * s,
      10 * s,
      2 * s
    );
  }


  /* ========================================================
     TYPE DETAILS
  ======================================================== */


  /* --------------------------
     STUDENT
  -------------------------- */

  if (
    char.type ===
    "student"
  ) {

    ctx.strokeStyle =
      palette.accent;

    ctx.lineWidth =
      2 * s;

    ctx.beginPath();

    ctx.moveTo(
      -11 * s,
      -31 * s
    );

    ctx.lineTo(
      -8 * s,
      -13 * s
    );

    ctx.stroke();
  }


  /* --------------------------
     OFFICE
  -------------------------- */

  if (
    char.type ===
    "office"
  ) {

    ctx.fillStyle =
      "#b5c0c6";

    ctx.fillRect(
      -2 * s,
      -33 * s,
      4 * s,
      11 * s
    );

    ctx.fillStyle =
      "#252b30";

    roundedRect(
      14 * s,
      -19 * s,
      12 * s,
      15 * s,
      2 * s
    );

    ctx.fill();
  }


  /* --------------------------
     SECURITY
  -------------------------- */

  if (
    char.type ===
    "security"
  ) {

    ctx.fillStyle =
      "#7696a5";

    ctx.fillRect(
      -10 * s,
      -30 * s,
      20 * s,
      4 * s
    );

    ctx.fillStyle =
      "#1f2d35";

    ctx.fillRect(
      -14 * s,
      headY - 17 * s,
      28 * s,
      5 * s
    );
  }


  /* --------------------------
     ELDER
  -------------------------- */

  if (
    char.type ===
    "elder"
  ) {

    ctx.fillStyle =
      "#92908a";

    ctx.fillRect(
      -12 * s,
      headY - 15 * s,
      24 * s,
      6 * s
    );

    ctx.strokeStyle =
      "#7c6d5a";

    ctx.lineWidth =
      2 * s;

    ctx.beginPath();

    ctx.moveTo(
      20 * s,
      -19 * s
    );

    ctx.lineTo(
      23 * s,
      1 * s
    );

    ctx.stroke();
  }


  /* ========================================================
     PHONE
  ======================================================== */

  if (
    char.action ===
    "phone"
  ) {

    ctx.save();

    glow(
      "#79dcff",
      8
    );

    ctx.fillStyle =
      "#8de5ff";

    roundedRect(
      12 * s,
      -40 * s,
      7 * s,
      12 * s,
      1 * s
    );

    ctx.fill();

    ctx.restore();
  }


  /* ========================================================
     SHOPKEEPER
  ======================================================== */

  if (
    char.type ===
    "shopkeeper"
  ) {

    ctx.fillStyle =
      "#c8b69c";

    ctx.beginPath();

    ctx.moveTo(
      -10 * s,
      -28 * s
    );

    ctx.lineTo(
      10 * s,
      -28 * s
    );

    ctx.lineTo(
      12 * s,
      -10 * s
    );

    ctx.lineTo(
      -12 * s,
      -10 * s
    );

    ctx.closePath();

    ctx.fill();
  }


  /* ========================================================
     EATING
  ======================================================== */

  if (
    char.action ===
    "eat"
  ) {

    ctx.fillStyle =
      "#d9d2bd";

    ctx.beginPath();

    ctx.ellipse(
      15 * s,
      -26 * s,
      8 * s,
      4 * s,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
      "#9a8062";

    ctx.lineWidth =
      1.5 * s;

    ctx.beginPath();

    ctx.moveTo(
      10 * s,
      -31 * s
    );

    ctx.lineTo(
      22 * s,
      -40 * s
    );

    ctx.stroke();
  }


  /* ========================================================
     UMBRELLA

     キャラより大きくして
     「雨の杭州」を一目で分かるようにする。
  ======================================================== */

  if (
    char.action ===
      "umbrella" ||
    char.action ===
      "umbrellaWalk"
  ) {

    ctx.strokeStyle =
      "#89949c";

    ctx.lineWidth =
      2 * s;

    ctx.beginPath();

    ctx.moveTo(
      15 * s,
      -24 * s
    );

    ctx.lineTo(
      13 * s,
      -74 * s
    );

    ctx.stroke();


    ctx.save();

    ctx.globalAlpha =
      .78;

    ctx.fillStyle =
      "#3d5260";

    ctx.beginPath();

    ctx.moveTo(
      -24 * s,
      -69 * s
    );

    ctx.quadraticCurveTo(
      13 * s,
      -102 * s,
      50 * s,
      -69 * s
    );

    ctx.quadraticCurveTo(
      35 * s,
      -74 * s,
      24 * s,
      -69 * s
    );

    ctx.quadraticCurveTo(
      13 * s,
      -75 * s,
      2 * s,
      -69 * s
    );

    ctx.quadraticCurveTo(
      -10 * s,
      -75 * s,
      -24 * s,
      -69 * s
    );

    ctx.fill();

    ctx.restore();
  }


  /* ========================================================
     DELIVERY HELMET
  ======================================================== */

  if (
    char.type ===
    "delivery"
  ) {

    ctx.fillStyle =
      char.palette ===
      "blue"
        ? "#58bce6"
        : "#f0c733";

    ctx.beginPath();

    ctx.arc(
      0,
      headY - 8 * s,
      17 * s,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillRect(
      -17 * s,
      headY - 8 * s,
      34 * s,
      4 * s
    );
  }


  /* ========================================================
     SMALL NEON EDGE

     リアルなライティングではなく
     「ゲームキャラとして背景から抜く」ための縁。
  ======================================================== */

  ctx.globalAlpha =
    .28;

  ctx.strokeStyle =
    isPlayer
      ? "#50eaff"
      : (
        currentMap.ambience ===
        "oldtown"
          ? "#ffb35f"
          : "#5bdcf4"
      );

  ctx.lineWidth =
    1.2 * s;

  ctx.beginPath();

  ctx.moveTo(
    -17 * s,
    -35 * s
  );

  ctx.lineTo(
    -18 * s,
    -14 * s
  );

  ctx.stroke();

  ctx.globalAlpha = 1;

  ctx.restore();
}


/* ==========================================================
   WIRES
========================================================== */

function drawWires() {

  const wires =
    currentMap.wires ||
    [];

  for (
    const wire
    of wires
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

    ctx.strokeStyle =
      "rgba(20,20,23,.75)";

    ctx.lineWidth =
      2;

    ctx.beginPath();

    ctx.moveTo(
      a.x,
      a.y
    );

    ctx.quadraticCurveTo(
      (
        a.x +
        b.x
      ) / 2,
      Math.max(
        a.y,
        b.y
      ) + 18,
      b.x,
      b.y
    );

    ctx.stroke();
  }
}


/* ==========================================================
   CLOTHES LINES
========================================================== */

function drawClothesLines() {

  const lines =
    currentMap.clothesLines ||
    [];

  for (
    const line
    of lines
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

    ctx.strokeStyle =
      "rgba(120,120,115,.65)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
      a.x,
      a.y
    );

    ctx.lineTo(
      b.x,
      b.y + 6
    );

    ctx.stroke();


    const colors = [
      "#a35e52",
      "#5c7183",
      "#b39a70",
      "#6c7b62"
    ];

    for (
      let i = 1;
      i <= 4;
      i++
    ) {

      const t =
        i / 5;

      const x =
        lerp(
          a.x,
          b.x,
          t
        );

      const y =
        lerp(
          a.y,
          b.y + 6,
          t
        );

      ctx.fillStyle =
        colors[
          i - 1
        ];

      ctx.fillRect(
        x - 5,
        y,
        10,
        11
      );
    }
  }
}


/* ==========================================================
   CITY OBJECT SORT
========================================================== */

function drawCityObjects() {

  const objects = [];


  for (
    const building
    of BUILDINGS
  ) {

    objects.push({
      y:
        building.y +
        building.h,

      draw:
        () =>
          drawBuilding(
            building
          )
    });
  }


  for (
    const tree
    of TREES
  ) {

    objects.push({
      y:tree.y,

      draw:
        () =>
          drawTree(
            tree
          )
    });
  }


  for (
    const light
    of STREET_LIGHTS
  ) {

    objects.push({
      y:light.y,

      draw:
        () =>
          drawStreetLight(
            light
          )
    });
  }


  for (
    const sign
    of STREET_SIGNS
  ) {

    objects.push({
      y:sign.y,

      draw:
        () =>
          drawStreetSign(
            sign
          )
    });
  }


  for (
    const prop
    of PROPS
  ) {

    objects.push({
      y:prop.y,

      draw:
        () =>
          drawProp(
            prop
          )
    });
  }


  for (
    const stall
    of STALLS
  ) {

    objects.push({
      y:stall.y,

      draw:
        () =>
          drawStall(
            stall
          )
    });
  }


  for (
    const npc
    of NPCS
  ) {

    objects.push({
      y:npc.y,

      draw:
        () =>
          drawCharacter(
            npc,
            false
          )
    });
  }


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


  for (
    const object
    of objects
  ) {

    object.draw();
  }
}


/* ==========================================================
   INTERIOR BACKGROUND
========================================================== */

function drawInteriorFloor(
  data,
  color = "#262526"
) {

  ctx.fillStyle =
    "#101216";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const topLeft =
    project(
      0,
      0
    );

  const bottomRight =
    project(
      data.width,
      data.height
    );

  ctx.fillStyle =
    color;

  ctx.fillRect(
    topLeft.x,
    topLeft.y,
    bottomRight.x -
    topLeft.x,
    bottomRight.y -
    topLeft.y
  );
}


/* ==========================================================
   INTERIOR FURNITURE
========================================================== */

function drawInteriorRect(
  x,
  y,
  w,
  h,
  color
) {

  const p =
    project(
      x,
      y
    );

  const s =
    p.scale;

  ctx.fillStyle =
    color;

  ctx.fillRect(
    p.x -
    w *
    s /
    2,
    p.y -
    h *
    s,
    w * s,
    h * s
  );
}


/* ==========================================================
   CONVENIENCE
========================================================== */

function drawConvenienceInterior() {

  const data =
    INTERIORS.convenience;

  drawInteriorFloor(
    data,
    "#2b2d2f"
  );

  drawInteriorRect(
    185,
    310,
    160,
    330,
    "#d5d8d4"
  );

  drawInteriorRect(
    865,
    310,
    160,
    330,
    "#d5d8d4"
  );

  drawInteriorRect(
    525,
    210,
    310,
    65,
    "#a6a99f"
  );

  drawInteriorRect(
    525,
    380,
    310,
    65,
    "#a6a99f"
  );

  const sign =
    project(
      525,
      90,
      40
    );

  ctx.save();

  glow(
    "#54e6ff",
    15
  );

  ctx.fillStyle =
    "#6deaff";

  ctx.font =
    "18px sans-serif";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "24H",
    sign.x,
    sign.y
  );

  ctx.restore();

  drawCharacter(
    player,
    true
  );
}


/* ==========================================================
   RESTAURANT
========================================================== */

function drawRestaurantInterior() {

  const data =
    INTERIORS.restaurant;

  drawInteriorFloor(
    data,
    "#302824"
  );

  drawInteriorRect(
    525,
    130,
    850,
    100,
    "#5b4435"
  );

  drawInteriorRect(
    250,
    350,
    220,
    70,
    "#684b36"
  );

  drawInteriorRect(
    800,
    350,
    220,
    70,
    "#684b36"
  );

  const lamp =
    project(
      525,
      260,
      90
    );

  ctx.save();

  glow(
    "#ffb05b",
    24
  );

  ctx.fillStyle =
    "#ffbd6c";

  ctx.beginPath();

  ctx.arc(
    lamp.x,
    lamp.y,
    7,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

  drawCharacter(
    player,
    true
  );
}


/* ==========================================================
   OFFICE
========================================================== */

function drawOfficeInterior() {

  const data =
    INTERIORS.office;

  drawInteriorFloor(
    data,
    "#22282e"
  );

  drawInteriorRect(
    550,
    150,
    820,
    80,
    "#39434b"
  );

  drawInteriorRect(
    280,
    350,
    280,
    80,
    "#303b43"
  );

  drawInteriorRect(
    820,
    350,
    280,
    80,
    "#303b43"
  );

  const logo =
    project(
      550,
      110,
      65
    );

  ctx.save();

  glow(
    "#bd63ff",
    16
  );

  ctx.fillStyle =
    "#d28aff";

  ctx.font =
    "17px sans-serif";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "未来都市研究所",
    logo.x,
    logo.y
  );

  ctx.restore();

  drawCharacter(
    player,
    true
  );
}


/* ==========================================================
   NOODLE SHOP
========================================================== */

function drawNoodleInterior() {

  const data =
    INTERIORS.noodle;

  drawInteriorFloor(
    data,
    "#302722"
  );

  drawInteriorRect(
    500,
    130,
    800,
    95,
    "#654431"
  );

  drawInteriorRect(
    250,
    350,
    200,
    70,
    "#75513a"
  );

  drawInteriorRect(
    750,
    350,
    200,
    70,
    "#75513a"
  );

  const sign =
    project(
      500,
      110,
      55
    );

  ctx.save();

  glow(
    "#ff5b4f",
    15
  );

  ctx.fillStyle =
    "#ff7968";

  ctx.font =
    "18px sans-serif";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "西北牛肉面",
    sign.x,
    sign.y
  );

  ctx.restore();

  drawCharacter(
    player,
    true
  );
}


/* ==========================================================
   TEA SHOP
========================================================== */

function drawTeaInterior() {

  const data =
    INTERIORS.tea;

  drawInteriorFloor(
    data,
    "#252b25"
  );

  drawInteriorRect(
    500,
    125,
    790,
    85,
    "#4e5a45"
  );

  drawInteriorRect(
    270,
    370,
    180,
    85,
    "#5d4936"
  );

  drawInteriorRect(
    730,
    370,
    180,
    85,
    "#5d4936"
  );

  const sign =
    project(
      500,
      100,
      55
    );

  ctx.save();

  glow(
    "#79d795",
    12
  );

  ctx.fillStyle =
    "#9be5aa";

  ctx.font =
    "18px sans-serif";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "龙井茶庄",
    sign.x,
    sign.y
  );

  ctx.restore();

  drawCharacter(
    player,
    true
  );
}


/* ==========================================================
   INTERIOR DRAW
========================================================== */

function drawInterior() {

  switch (
    currentInterior
  ) {

    case "convenience":
      drawConvenienceInterior();
      break;

    case "restaurant":
      drawRestaurantInterior();
      break;

    case "office":
      drawOfficeInterior();
      break;

    case "noodle":
      drawNoodleInterior();
      break;

    case "tea":
      drawTeaInterior();
      break;
  }
}


/* ==========================================================
   RAIN
========================================================== */

const rainDrops = [];

function initializeRain() {

  rainDrops.length = 0;

  for (
    let i = 0;
    i < 120;
    i++
  ) {

    rainDrops.push({

      x:
        Math.random() *
        W,

      y:
        Math.random() *
        H,

      len:
        rand(
          8,
          20
        ),

      speed:
        rand(
          500,
          900
        )
    });
  }
}

initializeRain();

window.addEventListener(
  "resize",
  initializeRain
);


function updateRain(dt) {

  for (
    const drop
    of rainDrops
  ) {

    drop.y +=
      drop.speed *
      dt;

    drop.x -=
      drop.speed *
      dt *
      .16;

    if (
      drop.y >
      H + 30 ||
      drop.x <
      -30
    ) {

      drop.x =
        Math.random() *
        W +
        100;

      drop.y =
        -20;
    }
  }
}


function drawRain() {

  if (
    scene !==
    "city"
  ) {
    return;
  }

  ctx.save();

  ctx.strokeStyle =
    "rgba(165,195,210,.22)";

  ctx.lineWidth =
    1;

  ctx.beginPath();

  for (
    const drop
    of rainDrops
  ) {

    ctx.moveTo(
      drop.x,
      drop.y
    );

    ctx.lineTo(
      drop.x -
      drop.len *
      .18,
      drop.y +
      drop.len
    );
  }

  ctx.stroke();

  ctx.restore();
}


/* ==========================================================
   ATMOSPHERE
========================================================== */

function drawAtmosphere() {

  if (
    scene !==
    "city"
  ) {
    return;
  }

  const gradient =
    ctx.createLinearGradient(
      0,
      H * .2,
      0,
      H
    );

  gradient.addColorStop(
    0,
    "rgba(18,31,42,.06)"
  );

  gradient.addColorStop(
    .65,
    "rgba(20,24,31,.02)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,.16)"
  );

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
   FADE DRAW
========================================================== */

function drawFade() {

  if (
    fade.alpha <= 0
  ) {
    return;
  }

  ctx.fillStyle =
    `rgba(3,5,8,${fade.alpha})`;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );
}


/* ==========================================================
   UPDATE
========================================================== */

function update(dt) {

  updatePlayer(dt);

  if (
    scene ===
    "city"
  ) {

    updateNPCs(dt);

    checkMapExits(dt);

    updateRain(dt);
  }

  updateCamera(dt);

  updateInteraction();

  updateFade(dt);

  updateDistrictCard(dt);
}


/* ==========================================================
   DRAW
========================================================== */

function draw() {

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  drawBackground();


  if (
    scene ===
    "city"
  ) {

    drawPlazas();

    drawRoads();

    drawPuddles();

    drawCityObjects();

    drawWires();

    drawClothesLines();

    drawAtmosphere();

    drawRain();

  } else {

    drawInterior();
  }


  drawDistrictCard();

  drawFade();
}


/* ==========================================================
   GAME LOOP
========================================================== */

let lastTime =
  performance.now();

function loop(time) {

  let dt =
    (
      time -
      lastTime
    ) /
    1000;

  lastTime =
    time;

  /*
     タブ復帰時などの巨大なdtを防止。
  */

  dt =
    Math.min(
      dt,
      0.05
    );

  update(dt);

  draw();

  requestAnimationFrame(
    loop
  );
}


/* ==========================================================
   START
========================================================== */

updateLocationUI();

showDistrictCard();

requestAnimationFrame(
  loop
);
