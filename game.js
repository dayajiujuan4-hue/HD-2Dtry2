/* ==========================================================
   杭州探索録3｜夜行杭州
   GAME Ver.0.9.1

   WORLD : Ver.0.9

   ★ VISUAL RESTORATION BUILD

   ・Ver.0.8系の高密度都市描画へ復帰
   ・デフォルメ人物はVer.0.9を維持
   ・NPC生活行動
   ・钱江新城 / 杭州旧城区
   ・建物入室
   ・雨
   ・濡れた路面
   ・ネオン反射
   ・室内が見える窓
   ・室外機
   ・配管
   ・非常階段
   ・屋上設備
   ・店舗ファサード
   ・旧城区の生活感
========================================================== */


/* ==========================================================
   CANVAS / UI
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
  DPR = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
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

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function rgba(hex, alpha) {
  let h = hex.replace("#", "");

  if (h.length === 3) {
    h = h.split("").map(v => v + v).join("");
  }

  const n = parseInt(h, 16);

  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;

  return `rgba(${r},${g},${b},${alpha})`;
}

function glow(color, blur = 12) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function noGlow() {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function roundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + rr, y);

  ctx.arcTo(
    x + w, y,
    x + w, y + h,
    rr
  );

  ctx.arcTo(
    x + w, y + h,
    x, y + h,
    rr
  );

  ctx.arcTo(
    x, y + h,
    x, y,
    rr
  );

  ctx.arcTo(
    x, y,
    x + w, y,
    rr
  );

  ctx.closePath();
}

function pointInRect(x, y, r) {
  return (
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}


/* ==========================================================
   MAP / SCENE
========================================================== */

let currentMapId = START_MAP;
let currentMap = MAPS[currentMapId];

applyMapGlobals(currentMapId);

let scene = "city";
let currentInterior = null;
let returnData = null;
let interactionTarget = null;
let transitionLock = 0;


/* ==========================================================
   PLAYER
========================================================== */

const player = {
  x: currentMap.playerSpawn.x,
  y: currentMap.playerSpawn.y,

  radius: 17,
  speed: 255,

  direction: "down",
  moving: false,
  step: 0,

  type: "player",
  palette: "player"
};


/* ==========================================================
   CAMERA / PROJECTION
========================================================== */

const camera = {
  x: player.x,
  y: player.y
};

const VIEW = {
  playerScreenY: 0.70,
  depthScale: 0.51,
  perspective: 0.00029
};

function project(x, y, z = 0) {
  const dy = y - camera.y;

  let scale =
    1 +
    dy * VIEW.perspective;

  scale = clamp(scale, 0.46, 1.54);

  return {
    x:
      W / 2 +
      (x - camera.x) * scale,

    y:
      H * VIEW.playerScreenY +
      dy * VIEW.depthScale -
      z * scale,

    scale
  };
}


/* ==========================================================
   INPUT
========================================================== */

const keys = {};

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();

  keys[k] = true;

  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright"
    ].includes(k)
  ) {
    e.preventDefault();
  }

  if (k === "e" && !e.repeat) {
    interact();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});


/* ==========================================================
   COLLISION
========================================================== */

function circleRectCollision(x, y, radius, rect) {
  const cx =
    clamp(
      x,
      rect.x,
      rect.x + rect.w
    );

  const cy =
    clamp(
      y,
      rect.y,
      rect.y + rect.h
    );

  const dx = x - cx;
  const dy = y - cy;

  return dx * dx + dy * dy < radius * radius;
}

function cityBlocked(x, y, radius = player.radius) {
  for (const b of BUILDINGS) {
    if (
      circleRectCollision(
        x,
        y,
        radius,
        {
          x: b.x - 7,
          y: b.y - 7,
          w: b.w + 14,
          h: b.h + 14
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

function getInteriorBlocks() {
  if (!currentInterior) return [];

  switch (currentInterior) {
    case "convenience":
      return [
        { x: 100, y: 100, w: 170, h: 420 },
        { x: 780, y: 100, w: 170, h: 420 },
        { x: 360, y: 170, w: 330, h: 80 },
        { x: 360, y: 340, w: 330, h: 80 }
      ];

    case "restaurant":
      return [
        { x: 90, y: 90, w: 870, h: 130 },
        { x: 130, y: 300, w: 240, h: 100 },
        { x: 680, y: 300, w: 240, h: 100 }
      ];

    case "office":
      return [
        { x: 120, y: 100, w: 860, h: 110 },
        { x: 130, y: 310, w: 300, h: 100 },
        { x: 670, y: 310, w: 300, h: 100 }
      ];

    case "noodle":
      return [
        { x: 90, y: 80, w: 820, h: 120 },
        { x: 140, y: 310, w: 220, h: 90 },
        { x: 640, y: 310, w: 220, h: 90 }
      ];

    case "tea":
      return [
        { x: 100, y: 80, w: 800, h: 110 },
        { x: 170, y: 320, w: 200, h: 100 },
        { x: 630, y: 320, w: 200, h: 100 }
      ];
  }

  return [];
}

function interiorBlocked(x, y) {
  if (!currentInterior) return false;

  const data = INTERIORS[currentInterior];

  if (
    x < 45 ||
    y < 45 ||
    x > data.width - 45 ||
    y > data.height - 45
  ) {
    return true;
  }

  for (const block of getInteriorBlocks()) {
    if (
      circleRectCollision(
        x,
        y,
        player.radius,
        block
      )
    ) {
      return true;
    }
  }

  return false;
}


/* ==========================================================
   PLAYER UPDATE
========================================================== */

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  const len = Math.hypot(dx, dy);

  player.moving = len > 0;

  if (len > 0) {
    dx /= len;
    dy /= len;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.direction =
        dx < 0 ? "left" : "right";
    } else {
      player.direction =
        dy < 0 ? "up" : "down";
    }

    player.step += dt * 9;
  }

  const amount =
    player.speed * dt;

  if (scene === "city") {
    const nx =
      player.x + dx * amount;

    if (!cityBlocked(nx, player.y)) {
      player.x =
        clamp(
          nx,
          22,
          WORLD.width - 22
        );
    }

    const ny =
      player.y + dy * amount;

    if (!cityBlocked(player.x, ny)) {
      player.y =
        clamp(
          ny,
          22,
          WORLD.height - 22
        );
    }
  } else {
    const nx =
      player.x + dx * amount;

    if (!interiorBlocked(nx, player.y)) {
      player.x = nx;
    }

    const ny =
      player.y + dy * amount;

    if (!interiorBlocked(player.x, ny)) {
      player.y = ny;
    }
  }
}


/* ==========================================================
   NPC RUNTIME
========================================================== */

function initNPCs() {
  for (const npc of NPCS) {
    if (npc.runtimeReady) continue;

    npc.runtimeReady = true;

    npc.targetX = npc.x;
    npc.targetY = npc.y;

    npc.wait = rand(0.5, 3);
    npc.walkPhase = rand(0, Math.PI * 2);
  }
}

initNPCs();

function chooseNPCTarget(npc) {
  npc.targetX =
    clamp(
      npc.homeX +
      rand(-npc.roamX, npc.roamX),
      25,
      WORLD.width - 25
    );

  npc.targetY =
    clamp(
      npc.homeY +
      rand(-npc.roamY, npc.roamY),
      25,
      WORLD.height - 25
    );
}

function moveNPCTo(npc, tx, ty, dt) {
  const dx = tx - npc.x;
  const dy = ty - npc.y;

  const len =
    Math.hypot(dx, dy);

  if (len < 1) return;

  const vx = dx / len;
  const vy = dy / len;

  if (Math.abs(vx) > Math.abs(vy)) {
    npc.direction =
      vx < 0 ? "left" : "right";
  } else {
    npc.direction =
      vy < 0 ? "up" : "down";
  }

  const speed =
    npc.speed * dt;

  const nx =
    npc.x + vx * speed;

  const ny =
    npc.y + vy * speed;

  if (!cityBlocked(nx, npc.y, 10)) {
    npc.x = nx;
  }

  if (!cityBlocked(npc.x, ny, 10)) {
    npc.y = ny;
  }

  npc.walkPhase += dt * 8;
}

function updateNPCs(dt) {
  if (scene !== "city") return;

  for (const npc of NPCS) {
    if (!npc.runtimeReady) {
      npc.runtimeReady = true;
      npc.targetX = npc.x;
      npc.targetY = npc.y;
      npc.wait = rand(0.5, 2);
      npc.walkPhase = rand(0, 6);
    }

    if (npc.behavior === "idle") {
      npc.action = "idle";
      continue;
    }

    if (npc.behavior === "eat") {
      npc.action = "eat";
      continue;
    }

    if (npc.behavior === "shop") {
      const d =
        dist(
          npc.x,
          npc.y,
          npc.homeX,
          npc.homeY
        );

      if (d > 40) {
        npc.action = "walk";

        moveNPCTo(
          npc,
          npc.homeX,
          npc.homeY,
          dt
        );
      } else {
        npc.action = "shop";

        npc.wait -= dt;

        if (npc.wait <= 0) {
          npc.direction =
            Math.random() < .5
              ? "left"
              : "right";

          npc.wait = rand(2, 5);
        }
      }

      continue;
    }

    if (npc.wait > 0) {
      npc.wait -= dt;

      if (npc.behavior === "phone") {
        npc.action = "phone";
      } else if (npc.behavior === "umbrella") {
        npc.action = "umbrella";
      } else if (npc.behavior === "delivery") {
        npc.action = "deliveryIdle";
      } else {
        npc.action = "idle";
      }

      continue;
    }

    const d =
      dist(
        npc.x,
        npc.y,
        npc.targetX,
        npc.targetY
      );

    if (d < 12) {
      npc.wait = rand(1.2, 4);

      chooseNPCTarget(npc);

      continue;
    }

    npc.action =
      npc.behavior === "umbrella"
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
   CAMERA
========================================================== */

function updateCamera(dt) {
  const t =
    1 -
    Math.pow(0.001, dt);

  camera.x =
    lerp(
      camera.x,
      player.x,
      t
    );

  camera.y =
    lerp(
      camera.y,
      player.y,
      t
    );
}


/* ==========================================================
   MAP SWITCH
========================================================== */

let fade = {
  active: false,
  alpha: 0,
  phase: "none",
  target: null
};

let districtCard = {
  timer: 0,
  alpha: 0
};

function switchMapData(mapId) {
  currentMapId = mapId;
  currentMap = MAPS[mapId];

  applyMapGlobals(mapId);

  initNPCs();
}

function checkMapExits(dt) {
  if (scene !== "city") return;

  if (transitionLock > 0) {
    transitionLock -= dt;
    return;
  }

  if (fade.active) return;

  for (const exit of currentMap.exits || []) {
    if (
      pointInRect(
        player.x,
        player.y,
        exit
      )
    ) {
      fade.active = true;
      fade.phase = "out";
      fade.alpha = 0;
      fade.target = exit;

      return;
    }
  }
}

function performMapChange() {
  const exit = fade.target;

  switchMapData(exit.targetMap);

  player.x = exit.targetX;
  player.y = exit.targetY;

  camera.x = player.x;
  camera.y = player.y;

  transitionLock = 1.3;

  updateLocationUI();
  showDistrictCard();
}

function updateFade(dt) {
  if (!fade.active) return;

  if (fade.phase === "out") {
    fade.alpha += dt * 2.8;

    if (fade.alpha >= 1) {
      fade.alpha = 1;

      performMapChange();

      fade.phase = "in";
    }
  } else {
    fade.alpha -= dt * 1.7;

    if (fade.alpha <= 0) {
      fade.alpha = 0;
      fade.active = false;
      fade.phase = "none";
      fade.target = null;
    }
  }
}


/* ==========================================================
   BUILDING ENTRY
========================================================== */

function updateInteraction() {
  interactionTarget = null;

  if (scene === "city") {
    let nearest = Infinity;

    for (const building of BUILDINGS) {
      if (
        !building.enter ||
        !building.entrance
      ) {
        continue;
      }

      const e =
        building.entrance;

      const d =
        dist(
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
          type: "building",
          building
        };
      }
    }
  } else {
    const interior =
      INTERIORS[currentInterior];

    if (interior) {
      if (
        dist(
          player.x,
          player.y,
          interior.exit.x,
          interior.exit.y
        ) < 100
      ) {
        interactionTarget = {
          type: "exit"
        };
      }
    }
  }

  if (interactionTarget) {
    interactionBox.classList.remove("hidden");

    if (
      interactionTarget.type ===
      "building"
    ) {
      interactionText.textContent =
        interactionTarget.building.sign ||
        "入る";
    } else {
      interactionText.textContent =
        "外へ出る";
    }
  } else {
    interactionBox.classList.add("hidden");
  }
}

function interact() {
  if (!interactionTarget) return;

  if (
    interactionTarget.type ===
    "building"
  ) {
    enterBuilding(
      interactionTarget.building
    );
  } else if (
    interactionTarget.type ===
    "exit"
  ) {
    leaveBuilding();
  }
}

function enterBuilding(building) {
  if (
    !building.enter ||
    !INTERIORS[building.enter]
  ) {
    return;
  }

  returnData = {
    mapId: currentMapId,
    buildingId: building.id,
    side:
      building.entrance.side ||
      "south"
  };

  currentInterior =
    building.enter;

  scene = "interior";

  const interior =
    INTERIORS[currentInterior];

  player.x =
    interior.spawn.x;

  player.y =
    interior.spawn.y;

  camera.x = player.x;
  camera.y = player.y;

  locationTitle.textContent =
    interior.title;

  locationSub.textContent =
    interior.sub;
}

function leaveBuilding() {
  if (!returnData) return;

  const mapId =
    returnData.mapId;

  const building =
    getBuilding(
      mapId,
      returnData.buildingId
    );

  scene = "city";
  currentInterior = null;

  switchMapData(mapId);

  if (building) {
    const e =
      building.entrance;

    let x = e.x;
    let y = e.y;

    const gap = 60;

    switch (e.side) {
      case "north":
        y = building.y - gap;
        break;

      case "south":
        y =
          building.y +
          building.h +
          gap;
        break;

      case "west":
        x =
          building.x -
          gap;
        break;

      case "east":
        x =
          building.x +
          building.w +
          gap;
        break;
    }

    player.x = x;
    player.y = y;
  }

  camera.x = player.x;
  camera.y = player.y;

  returnData = null;

  updateLocationUI();
}


/* ==========================================================
   UI
========================================================== */

function updateLocationUI() {
  locationTitle.textContent =
    currentMap.name;

  locationSub.textContent =
    `${currentMap.englishName} · ${currentMap.time} · ${currentMap.weather}`;
}

function showDistrictCard() {
  districtCard.timer = 3;
  districtCard.alpha = 1;
}

function updateDistrictCard(dt) {
  if (districtCard.timer <= 0) {
    districtCard.alpha = 0;
    return;
  }

  districtCard.timer -= dt;

  if (districtCard.timer < .8) {
    districtCard.alpha =
      clamp(
        districtCard.timer / .8,
        0,
        1
      );
  }
}

function drawDistrictCard() {
  if (districtCard.alpha <= 0) return;

  ctx.save();

  ctx.globalAlpha =
    districtCard.alpha;

  ctx.textAlign = "center";

  const x = W / 2;
  const y = H * .37;

  ctx.fillStyle =
    "rgba(235,243,246,.94)";

  ctx.font =
    "500 12px sans-serif";

  ctx.fillText(
    currentMap.chapter,
    x,
    y - 58
  );

  ctx.font =
    "700 31px sans-serif";

  ctx.fillText(
    currentMap.name,
    x,
    y - 15
  );

  ctx.fillStyle =
    "rgba(205,218,225,.75)";

  ctx.font =
    "400 12px sans-serif";

  ctx.fillText(
    `${currentMap.district}　${currentMap.time}　${currentMap.weather}`,
    x,
    y + 18
  );

  ctx.restore();
}


/* ==========================================================
   WORLD RECT
========================================================== */

function drawWorldRect(x, y, w, h, color) {
  const a = project(x, y);
  const b = project(x + w, y);
  const c = project(x + w, y + h);
  const d = project(x, y + h);

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);

  ctx.closePath();
  ctx.fill();
}


/* ==========================================================
   BACKGROUND
========================================================== */

function drawBackground() {
  const g =
    ctx.createLinearGradient(
      0, 0,
      0, H
    );

  if (
    currentMapId ===
    "oldtown"
  ) {
    g.addColorStop(
      0,
      "#111318"
    );

    g.addColorStop(
      .55,
      "#15171a"
    );

    g.addColorStop(
      1,
      "#080a0d"
    );
  } else {
    g.addColorStop(
      0,
      "#07101a"
    );

    g.addColorStop(
      .55,
      "#0a111a"
    );

    g.addColorStop(
      1,
      "#05080d"
    );
  }

  ctx.fillStyle = g;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );
}


/* ==========================================================
   PLAZAS
========================================================== */

function drawPlazas() {
  for (const plaza of PLAZAS) {
    let color = "#20262c";

    if (plaza.type === "old") {
      color = "#282522";
    }

    if (plaza.type === "commercial") {
      color = "#20242a";
    }

    drawWorldRect(
      plaza.x,
      plaza.y,
      plaza.w,
      plaza.h,
      color
    );

    for (
      let x = plaza.x + 35;
      x < plaza.x + plaza.w;
      x += 75
    ) {
      const a =
        project(
          x,
          plaza.y
        );

      const b =
        project(
          x,
          plaza.y + plaza.h
        );

      ctx.strokeStyle =
        "rgba(255,255,255,.035)";

      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      ctx.stroke();
    }

    for (
      let y = plaza.y + 35;
      y < plaza.y + plaza.h;
      y += 75
    ) {
      const a =
        project(
          plaza.x,
          y
        );

      const b =
        project(
          plaza.x + plaza.w,
          y
        );

      ctx.strokeStyle =
        "rgba(255,255,255,.025)";

      ctx.beginPath();

      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      ctx.stroke();
    }
  }
}


/* ==========================================================
   ROADS
========================================================== */

function roadColor(type) {
  if (currentMapId === "oldtown") {
    if (
      type === "alley" ||
      type === "tiny"
    ) {
      return "#24211f";
    }

    if (type === "backstreet") {
      return "#211f1e";
    }

    return "#1b1b1c";
  }

  if (type === "alley") {
    return "#181d21";
  }

  if (type === "backstreet") {
    return "#171c21";
  }

  return "#131a21";
}

function drawRoads() {
  for (const road of ROADS) {
    drawWorldRect(
      road.x,
      road.y,
      road.w,
      road.h,
      roadColor(road.type)
    );

    drawRoadTexture(road);

    if (
      road.type === "main" ||
      road.type === "oldmain"
    ) {
      drawRoadMarkings(road);
    }
  }
}

function drawRoadTexture(road) {
  for (let i = 0; i < 18; i++) {
    const rx =
      road.x +
      hash(
        road.x * .02 +
        road.y * .01 +
        i * 9
      ) *
      road.w;

    const ry =
      road.y +
      hash(
        road.x * .01 +
        road.y * .03 +
        i * 17
      ) *
      road.h;

    const p =
      project(rx, ry);

    ctx.fillStyle =
      "rgba(255,255,255,.025)";

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y,
      5 * p.scale,
      1.2 * p.scale,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}

function drawRoadMarkings(road) {
  const horizontal =
    road.w > road.h;

  ctx.strokeStyle =
    "rgba(225,230,225,.13)";

  ctx.lineWidth = 2;

  ctx.setLineDash([18, 20]);

  if (horizontal) {
    const y =
      road.y +
      road.h / 2;

    const a =
      project(
        road.x + 30,
        y
      );

    const b =
      project(
        road.x +
        road.w -
        30,
        y
      );

    ctx.beginPath();

    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    ctx.stroke();
  } else {
    const x =
      road.x +
      road.w / 2;

    const a =
      project(
        x,
        road.y + 30
      );

    const b =
      project(
        x,
        road.y +
        road.h -
        30
      );

    ctx.beginPath();

    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    ctx.stroke();
  }

  ctx.setLineDash([]);
}


/* ==========================================================
   ROAD REFLECTIONS
========================================================== */

function drawRoadReflections() {
  for (
    let i = 0;
    i < STREET_SIGNS.length;
    i++
  ) {
    const sign =
      STREET_SIGNS[i];

    const p =
      project(
        sign.x,
        sign.y + 35
      );

    const color =
      sign.color ||
      "#4beaff";

    const g =
      ctx.createLinearGradient(
        p.x,
        p.y,
        p.x,
        p.y + 80 * p.scale
      );

    g.addColorStop(
      0,
      rgba(color, .15)
    );

    g.addColorStop(
      1,
      rgba(color, 0)
    );

    ctx.fillStyle = g;

    ctx.beginPath();

    ctx.moveTo(
      p.x - 8 * p.scale,
      p.y
    );

    ctx.lineTo(
      p.x + 8 * p.scale,
      p.y
    );

    ctx.lineTo(
      p.x + 25 * p.scale,
      p.y + 90 * p.scale
    );

    ctx.lineTo(
      p.x - 22 * p.scale,
      p.y + 90 * p.scale
    );

    ctx.closePath();
    ctx.fill();
  }

  for (
    let i = 0;
    i < STALLS.length;
    i++
  ) {
    const stall =
      STALLS[i];

    const p =
      project(
        stall.x,
        stall.y + 20
      );

    ctx.fillStyle =
      rgba(
        stall.color,
        .09
      );

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y + 16 * p.scale,
      45 * p.scale,
      8 * p.scale,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}


/* ==========================================================
   PUDDLES
========================================================== */

function drawPuddles() {
  const count =
    currentMapId ===
    "oldtown"
      ? 25
      : 19;

  for (let i = 0; i < count; i++) {
    const x =
      250 +
      hash(i * 91 + currentMapId.length) *
      (WORLD.width - 500);

    const y =
      300 +
      hash(i * 137 + 7) *
      (WORLD.height - 600);

    const p =
      project(x, y);

    if (
      p.x < -80 ||
      p.x > W + 80 ||
      p.y < -80 ||
      p.y > H + 80
    ) {
      continue;
    }

    const color =
      i % 4 === 0
        ? "#48e7ff"
        : i % 4 === 1
          ? "#d55cff"
          : i % 4 === 2
            ? "#ff5d7f"
            : "#ffc46b";

    ctx.fillStyle =
      rgba(color, .09);

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y,
      (18 + hash(i) * 32) * p.scale,
      (2.5 + hash(i + 20) * 3) * p.scale,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
      "rgba(190,210,215,.06)";

    ctx.lineWidth = 1;

    ctx.stroke();
  }
}


/* ==========================================================
   BUILDING STYLE
========================================================== */

function getBuildingStyle(building) {
  switch (building.visualType) {
    case "glassOffice":
      return {
        front: "#101b26",
        side: "#091119",
        roof: "#182631",
        frame: "#293b49",
        window: "#4e899e",
        warm: false
      };

    case "megaTower":
      return {
        front: "#141827",
        side: "#0b0e18",
        roof: "#20273a",
        frame: "#353952",
        window: "#6a73a5",
        warm: false
      };

    case "dataCenter":
      return {
        front: "#181923",
        side: "#0d0e15",
        roof: "#252630",
        frame: "#34343e",
        window: "#8a597d",
        warm: false
      };

    case "techOffice":
    case "futureLab":
      return {
        front: "#111d26",
        side: "#0b131a",
        roof: "#1c2a33",
        frame: "#29414e",
        window: "#4c92a8",
        warm: false
      };

    case "oldResidentialDense":
      return {
        front: "#39332e",
        side: "#211e1b",
        roof: "#433c35",
        frame: "#62574d",
        window: "#d0925d",
        warm: true
      };

    case "oldMixed":
      return {
        front: "#312d2b",
        side: "#1d1a19",
        roof: "#3d3733",
        frame: "#5c5048",
        window: "#c58c63",
        warm: true
      };

    case "oldShop":
    case "fruitShop":
    case "noodleShop":
    case "teaShop":
      return {
        front: "#3a312a",
        side: "#211b18",
        roof: "#493d33",
        frame: "#665345",
        window: "#d9a069",
        warm: true
      };

    case "residential":
    case "apartmentStore":
      return {
        front: "#28282b",
        side: "#18191d",
        roof: "#333439",
        frame: "#48494e",
        window: "#c69d71",
        warm: true
      };

    case "dinerBuilding":
      return {
        front: "#302724",
        side: "#1d1716",
        roof: "#40332e",
        frame: "#64473b",
        window: "#e0a066",
        warm: true
      };

    default:
      return {
        front: "#19212a",
        side: "#10161d",
        roof: "#27313b",
        frame: "#374651",
        window: "#628a99",
        warm: false
      };
  }
}

function getBuildingHeight(building) {
  return Math.min(
    185 +
    building.floors * 21,
    650
  );
}


/* ==========================================================
   BUILDING SHELL
========================================================== */

function drawBuilding(building) {
  const height =
    getBuildingHeight(building);

  const style =
    getBuildingStyle(building);

  const a =
    project(
      building.x,
      building.y
    );

  const b =
    project(
      building.x + building.w,
      building.y
    );

  const c =
    project(
      building.x + building.w,
      building.y + building.h
    );

  const d =
    project(
      building.x,
      building.y + building.h
    );

  const at =
    project(
      building.x,
      building.y,
      height
    );

  const bt =
    project(
      building.x + building.w,
      building.y,
      height
    );

  const ct =
    project(
      building.x + building.w,
      building.y + building.h,
      height
    );

  const dt =
    project(
      building.x,
      building.y + building.h,
      height
    );


  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,.22)";

  ctx.beginPath();

  ctx.moveTo(
    d.x + 8,
    d.y + 8
  );

  ctx.lineTo(
    c.x + 15,
    c.y + 8
  );

  ctx.lineTo(
    c.x + 50,
    c.y + 30
  );

  ctx.lineTo(
    d.x + 25,
    d.y + 30
  );

  ctx.closePath();
  ctx.fill();


  /* right side */

  ctx.fillStyle =
    style.side;

  ctx.beginPath();

  ctx.moveTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(ct.x, ct.y);
  ctx.lineTo(bt.x, bt.y);

  ctx.closePath();
  ctx.fill();


  /* front */

  ctx.fillStyle =
    style.front;

  ctx.beginPath();

  ctx.moveTo(d.x, d.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(ct.x, ct.y);
  ctx.lineTo(dt.x, dt.y);

  ctx.closePath();
  ctx.fill();


  /* roof */

  ctx.fillStyle =
    style.roof;

  ctx.beginPath();

  ctx.moveTo(at.x, at.y);
  ctx.lineTo(bt.x, bt.y);
  ctx.lineTo(ct.x, ct.y);
  ctx.lineTo(dt.x, dt.y);

  ctx.closePath();
  ctx.fill();


  /* edge lines */

  ctx.strokeStyle =
    "rgba(200,215,220,.09)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(dt.x, dt.y);
  ctx.lineTo(ct.x, ct.y);
  ctx.lineTo(c.x, c.y);

  ctx.stroke();


  drawFacadeGrid(
    building,
    height,
    style
  );

  drawSideWindows(
    building,
    height,
    style
  );

  drawACRows(
    building,
    height
  );

  drawFacadePipes(
    building,
    height
  );

  drawFireEscape(
    building,
    height
  );

  drawGroundFloorFacade(
    building,
    style
  );

  drawRoofEquipment(
    building,
    height
  );

  drawBuildingSign(
    building,
    height
  );
}


/* ==========================================================
   WINDOWS + IMPLIED INTERIORS
========================================================== */

function drawFacadeGrid(
  building,
  height,
  style
) {
  const cols =
    clamp(
      Math.floor(
        building.w / 115
      ),
      3,
      10
    );

  const rows =
    clamp(
      Math.floor(
        building.floors * .65
      ),
      3,
      13
    );

  const usableHeight =
    height - 95;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x =
        building.x +
        45 +
        (
          building.w - 90
        ) *
        (
          (col + .5) /
          cols
        );

      const z =
        70 +
        usableHeight *
        (
          (row + .35) /
          rows
        );

      const p =
        project(
          x,
          building.y +
          building.h +
          3,
          z
        );

      if (
        p.x < -100 ||
        p.x > W + 100 ||
        p.y < -100 ||
        p.y > H + 100
      ) {
        continue;
      }

      const seed =
        building.id.length * 31 +
        row * 19 +
        col * 43;

      const lit =
        hash(seed) > .22;

      drawWindowRoom(
        p,
        style,
        lit,
        seed,
        building.visualType
      );
    }
  }
}

function drawWindowRoom(
  p,
  style,
  lit,
  seed,
  visualType
) {
  const s = p.scale;

  const w =
    42 * s;

  const h =
    28 * s;

  ctx.fillStyle =
    "rgba(4,7,9,.88)";

  ctx.fillRect(
    p.x - w / 2 - 2 * s,
    p.y - h - 2 * s,
    w + 4 * s,
    h + 4 * s
  );

  if (!lit) {
    ctx.fillStyle =
      "rgba(8,12,15,.95)";

    ctx.fillRect(
      p.x - w / 2,
      p.y - h,
      w,
      h
    );

    if (hash(seed + 4) > .72) {
      ctx.fillStyle =
        "rgba(45,65,75,.18)";

      ctx.fillRect(
        p.x - w / 2 + 2 * s,
        p.y - h + 2 * s,
        w - 4 * s,
        3 * s
      );
    }

    return;
  }

  const warm =
    style.warm ||
    hash(seed + 9) > .55;

  const roomColor =
    warm
      ? "rgba(241,177,105,.56)"
      : "rgba(102,194,225,.38)";

  ctx.fillStyle = roomColor;

  ctx.fillRect(
    p.x - w / 2,
    p.y - h,
    w,
    h
  );


  /* back wall gradient-ish panel */

  ctx.fillStyle =
    warm
      ? "rgba(255,221,170,.08)"
      : "rgba(180,235,255,.07)";

  ctx.fillRect(
    p.x - w / 2 + 2 * s,
    p.y - h + 2 * s,
    w - 4 * s,
    h * .4
  );


  /* desk */

  if (hash(seed + 2) > .32) {
    ctx.fillStyle =
      "rgba(35,28,24,.65)";

    ctx.fillRect(
      p.x - 14 * s,
      p.y - 8 * s,
      28 * s,
      3 * s
    );

    ctx.fillRect(
      p.x - 11 * s,
      p.y - 6 * s,
      2 * s,
      6 * s
    );

    ctx.fillRect(
      p.x + 9 * s,
      p.y - 6 * s,
      2 * s,
      6 * s
    );
  }


  /* monitor */

  if (hash(seed + 7) > .40) {
    ctx.save();

    const monitorColor =
      hash(seed + 11) > .5
        ? "#72dfff"
        : "#b58cff";

    glow(
      monitorColor,
      4
    );

    ctx.fillStyle =
      rgba(
        monitorColor,
        .75
      );

    ctx.fillRect(
      p.x - 7 * s,
      p.y - 17 * s,
      12 * s,
      7 * s
    );

    ctx.restore();
  }


  /* chair */

  if (hash(seed + 13) > .55) {
    ctx.fillStyle =
      "rgba(24,26,28,.55)";

    ctx.fillRect(
      p.x + 8 * s,
      p.y - 12 * s,
      5 * s,
      9 * s
    );
  }


  /* plant */

  if (hash(seed + 20) > .78) {
    ctx.fillStyle =
      "rgba(38,72,48,.7)";

    ctx.beginPath();

    ctx.arc(
      p.x - 13 * s,
      p.y - 12 * s,
      4 * s,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "rgba(80,55,38,.7)";

    ctx.fillRect(
      p.x - 15 * s,
      p.y - 7 * s,
      4 * s,
      5 * s
    );
  }


  /* silhouette */

  if (hash(seed + 30) > .82) {
    ctx.fillStyle =
      "rgba(17,17,19,.58)";

    ctx.beginPath();

    ctx.arc(
      p.x + 8 * s,
      p.y - 17 * s,
      3 * s,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillRect(
      p.x + 5 * s,
      p.y - 14 * s,
      6 * s,
      10 * s
    );
  }


  /* curtains */

  if (
    visualType ===
      "residential" ||
    visualType ===
      "oldResidentialDense" ||
    visualType ===
      "apartmentStore"
  ) {
    if (hash(seed + 45) > .48) {
      ctx.fillStyle =
        "rgba(70,56,50,.25)";

      ctx.fillRect(
        p.x - w / 2,
        p.y - h,
        5 * s,
        h
      );

      ctx.fillRect(
        p.x + w / 2 - 5 * s,
        p.y - h,
        5 * s,
        h
      );
    }
  }


  /* mullions */

  ctx.strokeStyle =
    "rgba(20,28,31,.55)";

  ctx.lineWidth =
    Math.max(
      1,
      1.2 * s
    );

  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y - h
  );

  ctx.lineTo(
    p.x,
    p.y
  );

  ctx.stroke();


  /* glass reflection */

  ctx.strokeStyle =
    "rgba(220,245,255,.12)";

  ctx.beginPath();

  ctx.moveTo(
    p.x - w * .35,
    p.y - h * .85
  );

  ctx.lineTo(
    p.x + w * .1,
    p.y - h * .65
  );

  ctx.stroke();
}


/* ==========================================================
   SIDE WINDOWS
========================================================== */

function drawSideWindows(
  building,
  height,
  style
) {
  if (building.h < 250) return;

  const rows =
    clamp(
      Math.floor(
        building.floors / 2
      ),
      2,
      8
    );

  const cols =
    clamp(
      Math.floor(
        building.h / 170
      ),
      2,
      5
    );

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const y =
        building.y +
        45 +
        (
          building.h - 90
        ) *
        (
          (col + .5) /
          cols
        );

      const z =
        80 +
        (
          height - 120
        ) *
        (
          (row + .5) /
          rows
        );

      const p =
        project(
          building.x +
          building.w +
          3,
          y,
          z
        );

      const seed =
        row * 53 +
        col * 29 +
        building.id.length;

      ctx.fillStyle =
        hash(seed) > .35
          ? (
            style.warm
              ? "rgba(224,160,95,.30)"
              : "rgba(80,150,175,.25)"
          )
          : "rgba(5,8,10,.75)";

      ctx.fillRect(
        p.x - 12 * p.scale,
        p.y - 17 * p.scale,
        22 * p.scale,
        14 * p.scale
      );
    }
  }
}


/* ==========================================================
   AC UNITS
========================================================== */

function drawACRows(
  building,
  height
) {
  const old =
    currentMapId === "oldtown" ||
    building.visualType === "oldMixed" ||
    building.visualType === "oldResidentialDense";

  const count =
    old
      ? clamp(
          Math.floor(
            building.w / 150
          ),
          2,
          8
        )
      : clamp(
          Math.floor(
            building.w / 320
          ),
          1,
          4
        );

  for (let i = 0; i < count; i++) {
    const x =
      building.x +
      55 +
      (
        building.w - 110
      ) *
      (
        (i + .5) /
        count
      );

    const z =
      70 +
      (
        i % 3
      ) *
      65;

    drawAC(
      x,
      building.y +
      building.h +
      6,
      z
    );
  }

  if (
    old &&
    height > 320
  ) {
    for (
      let i = 0;
      i < Math.min(4, count);
      i++
    ) {
      const x =
        building.x +
        80 +
        i *
        Math.max(
          90,
          (
            building.w - 160
          ) /
          Math.max(
            count - 1,
            1
          )
        );

      drawAC(
        x,
        building.y +
        building.h +
        6,
        250 +
        (i % 2) * 60
      );
    }
  }
}

function drawAC(x, y, z) {
  const p =
    project(x, y, z);

  const s = p.scale;

  ctx.fillStyle =
    "#9ca19d";

  ctx.fillRect(
    p.x - 15 * s,
    p.y - 17 * s,
    30 * s,
    17 * s
  );

  ctx.fillStyle =
    "#535957";

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - 8.5 * s,
    5 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeStyle =
    "rgba(30,35,35,.6)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - 8.5 * s,
    7 * s,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.strokeStyle =
    "rgba(150,150,140,.35)";

  ctx.beginPath();

  ctx.moveTo(
    p.x + 15 * s,
    p.y - 5 * s
  );

  ctx.lineTo(
    p.x + 22 * s,
    p.y + 2 * s
  );

  ctx.stroke();
}


/* ==========================================================
   PIPES
========================================================== */

function drawFacadePipes(
  building,
  height
) {
  const old =
    currentMapId === "oldtown" ||
    building.visualType === "oldMixed" ||
    building.visualType === "oldResidentialDense";

  if (!old) {
    if (
      building.visualType !==
      "residential"
    ) {
      return;
    }
  }

  const pipeCount =
    old ? 3 : 1;

  for (
    let i = 0;
    i < pipeCount;
    i++
  ) {
    const x =
      building.x +
      45 +
      (
        building.w - 90
      ) *
      (
        (i + .5) /
        pipeCount
      );

    const bottom =
      project(
        x,
        building.y +
        building.h +
        8,
        15
      );

    const top =
      project(
        x,
        building.y +
        building.h +
        8,
        Math.min(
          height - 25,
          340
        )
      );

    ctx.strokeStyle =
      i % 2 === 0
        ? "rgba(122,116,104,.55)"
        : "rgba(73,80,82,.52)";

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


    /* pipe joint */

    const mid =
      project(
        x,
        building.y +
        building.h +
        8,
        150
      );

    ctx.fillStyle =
      "rgba(130,125,112,.5)";

    ctx.fillRect(
      mid.x - 4 * mid.scale,
      mid.y - 2 * mid.scale,
      8 * mid.scale,
      4 * mid.scale
    );
  }
}


/* ==========================================================
   FIRE ESCAPE
========================================================== */

function drawFireEscape(
  building,
  height
) {
  const shouldDraw =
    (
      currentMapId === "oldtown" &&
      building.floors >= 6
    ) ||
    building.visualType === "oldMixed";

  if (!shouldDraw) return;

  const x =
    building.x +
    building.w * .82;

  const frontY =
    building.y +
    building.h +
    10;

  const levels =
    Math.min(
      4,
      Math.floor(
        building.floors / 2
      )
    );

  for (let i = 0; i < levels; i++) {
    const z =
      85 +
      i * 70;

    if (z > height - 30) break;

    const p =
      project(
        x,
        frontY,
        z
      );

    const s =
      p.scale;

    ctx.strokeStyle =
      "rgba(110,115,112,.58)";

    ctx.lineWidth =
      Math.max(
        1,
        2 * s
      );

    ctx.strokeRect(
      p.x - 28 * s,
      p.y - 4 * s,
      56 * s,
      8 * s
    );

    ctx.beginPath();

    ctx.moveTo(
      p.x - 23 * s,
      p.y + 4 * s
    );

    ctx.lineTo(
      p.x + 20 * s,
      p.y + 35 * s
    );

    ctx.stroke();
  }
}


/* ==========================================================
   GROUND FLOOR FACADE
========================================================== */

function drawGroundFloorFacade(
  building,
  style
) {
  const y =
    building.y +
    building.h +
    8;

  const p =
    project(
      building.x +
      building.w / 2,
      y,
      43
    );

  const s =
    p.scale;

  const storefront =
    [
      "oldShop",
      "fruitShop",
      "noodleShop",
      "teaShop",
      "dinerBuilding",
      "apartmentStore"
    ].includes(
      building.visualType
    );

  const width =
    Math.min(
      building.w * .72,
      330
    ) *
    s;

  const height =
    storefront
      ? 64 * s
      : 50 * s;


  /* frame */

  ctx.fillStyle =
    storefront
      ? "#191515"
      : "#10171d";

  ctx.fillRect(
    p.x - width / 2 - 4 * s,
    p.y - height - 4 * s,
    width + 8 * s,
    height + 4 * s
  );


  /* glass */

  ctx.fillStyle =
    style.warm
      ? "rgba(245,174,94,.50)"
      : "rgba(70,205,235,.22)";

  ctx.fillRect(
    p.x - width / 2,
    p.y - height,
    width,
    height
  );


  /* shop interior shelves */

  if (storefront) {
    ctx.fillStyle =
      "rgba(40,27,20,.48)";

    for (let i = 0; i < 3; i++) {
      ctx.fillRect(
        p.x -
        width * .4,
        p.y -
        height +
        12 * s +
        i * 14 * s,
        width * .8,
        3 * s
      );
    }


    /* bottles / goods */

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle =
        i % 3 === 0
          ? "rgba(170,70,55,.65)"
          : i % 3 === 1
            ? "rgba(80,120,70,.65)"
            : "rgba(190,150,75,.65)";

      ctx.fillRect(
        p.x -
        width * .34 +
        i * width * .085,
        p.y -
        height +
        19 * s,
        4 * s,
        8 * s
      );
    }
  }


  /* window mullions */

  ctx.strokeStyle =
    "rgba(20,25,26,.65)";

  ctx.lineWidth =
    Math.max(
      1,
      2 * s
    );

  for (let i = 1; i < 4; i++) {
    const xx =
      p.x -
      width / 2 +
      width * i / 4;

    ctx.beginPath();

    ctx.moveTo(
      xx,
      p.y - height
    );

    ctx.lineTo(
      xx,
      p.y
    );

    ctx.stroke();
  }


  /* door */

  ctx.fillStyle =
    "rgba(8,12,14,.86)";

  ctx.fillRect(
    p.x - 14 * s,
    p.y - 48 * s,
    28 * s,
    48 * s
  );

  ctx.fillStyle =
    "rgba(190,225,230,.28)";

  ctx.fillRect(
    p.x - 10 * s,
    p.y - 43 * s,
    20 * s,
    22 * s
  );


  /* awning */

  if (storefront) {
    const color =
      building.neon ||
      "#e26750";

    ctx.fillStyle =
      rgba(color, .85);

    ctx.fillRect(
      p.x - width * .53,
      p.y - height - 12 * s,
      width * 1.06,
      11 * s
    );

    ctx.fillStyle =
      "rgba(245,230,210,.35)";

    for (let i = 0; i < 5; i++) {
      ctx.fillRect(
        p.x -
        width * .5 +
        i * width / 5,
        p.y -
        height -
        12 * s,
        width / 10,
        11 * s
      );
    }
  }


  /* fruit shop crates */

  if (
    building.visualType ===
    "fruitShop"
  ) {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle =
        "#6e4930";

      ctx.fillRect(
        p.x -
        75 * s +
        i * 38 * s,
        p.y - 10 * s,
        30 * s,
        9 * s
      );

      ctx.fillStyle =
        i % 2 === 0
          ? "#c85b42"
          : "#d6a943";

      for (let k = 0; k < 4; k++) {
        ctx.beginPath();

        ctx.arc(
          p.x -
          67 * s +
          i * 38 * s +
          k * 5 * s,
          p.y - 12 * s,
          3 * s,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }
  }
}


/* ==========================================================
   ROOFTOP DETAILS
========================================================== */

function drawRoofEquipment(
  building,
  height
) {
  const items =
    clamp(
      Math.floor(
        building.w / 450
      ),
      1,
      4
    );

  for (let i = 0; i < items; i++) {
    const x =
      building.x +
      building.w *
      (
        .25 +
        .5 *
        (
          i /
          Math.max(
            items - 1,
            1
          )
        )
      );

    const y =
      building.y +
      building.h *
      (
        .3 +
        hash(
          building.id.length +
          i
        ) *
        .35
      );

    const p =
      project(
        x,
        y,
        height + 20
      );

    const s = p.scale;

    ctx.fillStyle =
      "#161d21";

    ctx.fillRect(
      p.x - 22 * s,
      p.y - 20 * s,
      44 * s,
      20 * s
    );

    ctx.strokeStyle =
      "rgba(180,200,205,.14)";

    ctx.strokeRect(
      p.x - 22 * s,
      p.y - 20 * s,
      44 * s,
      20 * s
    );

    if (i === 0) {
      ctx.strokeStyle =
        "#515d62";

      ctx.lineWidth =
        2 * s;

      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y - 20 * s
      );

      ctx.lineTo(
        p.x,
        p.y - 55 * s
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.arc(
        p.x,
        p.y - 55 * s,
        6 * s,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }


  /* water tank on old buildings */

  if (
    currentMapId === "oldtown" &&
    building.floors >= 6
  ) {
    const p =
      project(
        building.x +
        building.w * .72,
        building.y +
        building.h * .42,
        height + 38
      );

    ctx.fillStyle =
      "#3f4b4d";

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y - 20 * p.scale,
      15 * p.scale,
      5 * p.scale,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillRect(
      p.x - 15 * p.scale,
      p.y - 20 * p.scale,
      30 * p.scale,
      20 * p.scale
    );
  }
}


/* ==========================================================
   BUILDING SIGNAGE
========================================================== */

function drawBuildingSign(
  building,
  height
) {
  if (!building.sign) return;

  const color =
    building.neon ||
    "#48eaff";

  const front =
    project(
      building.x +
      building.w * .5,
      building.y +
      building.h +
      10,
      Math.min(
        height * .55,
        230
      )
    );

  ctx.save();

  glow(color, 12);

  ctx.fillStyle = color;

  ctx.textAlign = "center";

  ctx.font =
    `600 ${Math.max(
      10,
      15 * front.scale
    )}px sans-serif`;

  ctx.fillText(
    building.sign,
    front.x,
    front.y
  );

  ctx.restore();


  /* vertical side sign */

  const oldOrShop =
    currentMapId === "oldtown" ||
    [
      "oldMixed",
      "oldShop",
      "fruitShop",
      "noodleShop",
      "teaShop",
      "dinerBuilding"
    ].includes(
      building.visualType
    );

  if (oldOrShop) {
    const p =
      project(
        building.x +
        building.w -
        30,
        building.y +
        building.h +
        12,
        120
      );

    const s =
      p.scale;

    const chars =
      building.sign
        .replace(/\s/g, "")
        .slice(0, 5)
        .split("");

    ctx.save();

    glow(color, 9);

    ctx.fillStyle =
      "rgba(20,16,15,.90)";

    ctx.fillRect(
      p.x - 14 * s,
      p.y - 22 * s,
      28 * s,
      (chars.length * 17 + 12) * s
    );

    ctx.strokeStyle = color;

    ctx.lineWidth =
      1.5 * s;

    ctx.strokeRect(
      p.x - 14 * s,
      p.y - 22 * s,
      28 * s,
      (chars.length * 17 + 12) * s
    );

    ctx.fillStyle = color;

    ctx.textAlign = "center";

    ctx.font =
      `${Math.max(
        8,
        11 * s
      )}px sans-serif`;

    chars.forEach(
      (ch, i) => {
        ctx.fillText(
          ch,
          p.x,
          p.y +
          i * 17 * s
        );
      }
    );

    ctx.restore();
  }
}


/* ==========================================================
   TREES
========================================================== */

function drawTree(tree) {
  const p =
    project(
      tree.x,
      tree.y
    );

  const s = p.scale;

  ctx.strokeStyle =
    "#41392f";

  ctx.lineWidth =
    7 * s;

  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  ctx.lineTo(
    p.x,
    p.y - 65 * s
  );

  ctx.stroke();

  ctx.fillStyle =
    currentMapId === "oldtown"
      ? "#25382c"
      : "#17382f";

  const cy =
    p.y - 82 * s;

  ctx.beginPath();

  ctx.arc(
    p.x,
    cy,
    29 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    p.x - 20 * s,
    cy + 7 * s,
    21 * s,
    0,
    Math.PI * 2
  );

  ctx.arc(
    p.x + 21 * s,
    cy + 6 * s,
    22 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "rgba(90,130,90,.10)";

  ctx.beginPath();

  ctx.arc(
    p.x - 8 * s,
    cy - 8 * s,
    15 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* ==========================================================
   STREET LIGHTS
========================================================== */

function drawStreetLight(light) {
  const base =
    project(
      light.x,
      light.y
    );

  const top =
    project(
      light.x,
      light.y,
      145
    );

  ctx.strokeStyle =
    "#4e575c";

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
    "#ffd28a",
    20
  );

  ctx.fillStyle =
    "#ffd68e";

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


  /* ground pool */

  const g =
    ctx.createRadialGradient(
      base.x,
      base.y,
      0,
      base.x,
      base.y,
      65 * base.scale
    );

  g.addColorStop(
    0,
    "rgba(255,205,130,.09)"
  );

  g.addColorStop(
    1,
    "rgba(255,205,130,0)"
  );

  ctx.fillStyle = g;

  ctx.beginPath();

  ctx.ellipse(
    base.x,
    base.y,
    65 * base.scale,
    15 * base.scale,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* ==========================================================
   STREET SIGNS
========================================================== */

function drawStreetSign(sign) {
  const p =
    project(
      sign.x,
      sign.y,
      105
    );

  const s = p.scale;

  const color =
    sign.color ||
    "#4beaff";

  ctx.save();

  glow(color, 9);

  ctx.fillStyle =
    "rgba(8,13,17,.93)";

  ctx.strokeStyle = color;

  ctx.lineWidth =
    Math.max(
      1,
      1.5 * s
    );

  const w =
    160 * s;

  const h =
    30 * s;

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

  ctx.fillStyle = color;

  ctx.textAlign = "center";

  ctx.font =
    `${Math.max(
      9,
      11 * s
    )}px sans-serif`;

  ctx.fillText(
    sign.text,
    p.x,
    p.y - 10 * s
  );

  ctx.restore();
}


/* ==========================================================
   PROPS
========================================================== */

function drawProp(prop) {
  const p =
    project(
      prop.x,
      prop.y
    );

  const s = p.scale;

  ctx.save();

  switch (prop.type) {
    case "bike":
      ctx.strokeStyle =
        "#8b969a";

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

      ctx.lineTo(
        p.x - 3 * s,
        p.y - 6 * s
      );

      ctx.lineTo(
        p.x - 10 * s,
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
        "#7c878c";

      ctx.fillRect(
        p.x + 6 * s,
        p.y - 31 * s,
        3 * s,
        23 * s
      );

      ctx.fillStyle =
        "#d5b52f";

      ctx.fillRect(
        p.x - 13 * s,
        p.y - 23 * s,
        15 * s,
        12 * s
      );

      break;


    case "vending":
      ctx.fillStyle =
        "#d4d7d6";

      ctx.fillRect(
        p.x - 15 * s,
        p.y - 48 * s,
        30 * s,
        48 * s
      );

      ctx.save();

      glow(
        "#69dfff",
        9
      );

      ctx.fillStyle =
        "#6edaf2";

      ctx.fillRect(
        p.x - 10 * s,
        p.y - 40 * s,
        20 * s,
        22 * s
      );

      ctx.restore();

      ctx.fillStyle =
        "#43494a";

      for (let i = 0; i < 3; i++) {
        ctx.fillRect(
          p.x - 7 * s,
          p.y -
          36 * s +
          i * 6 * s,
          14 * s,
          2 * s
        );
      }

      break;


    case "trash":
      ctx.fillStyle =
        "#41494b";

      ctx.fillRect(
        p.x - 10 * s,
        p.y - 20 * s,
        20 * s,
        20 * s
      );

      ctx.fillStyle =
        "#262d2e";

      ctx.fillRect(
        p.x - 11 * s,
        p.y - 22 * s,
        22 * s,
        4 * s
      );

      break;


    case "boxes":
      ctx.fillStyle =
        "#8b6742";

      ctx.fillRect(
        p.x - 14 * s,
        p.y - 13 * s,
        24 * s,
        13 * s
      );

      ctx.fillStyle =
        "#705136";

      ctx.fillRect(
        p.x - 4 * s,
        p.y - 25 * s,
        20 * s,
        13 * s
      );

      ctx.strokeStyle =
        "rgba(50,35,25,.4)";

      ctx.strokeRect(
        p.x - 4 * s,
        p.y - 25 * s,
        20 * s,
        13 * s
      );

      break;


    case "plant":
      ctx.fillStyle =
        "#57463a";

      ctx.fillRect(
        p.x - 7 * s,
        p.y - 10 * s,
        14 * s,
        10 * s
      );

      ctx.fillStyle =
        "#3f6d4c";

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();

        ctx.ellipse(
          p.x +
          (i - 1.5) * 4 * s,
          p.y -
          18 * s -
          (i % 2) * 5 * s,
          5 * s,
          10 * s,
          (i - 1.5) * .3,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      break;


    case "bench":
      ctx.fillStyle =
        "#665343";

      ctx.fillRect(
        p.x - 29 * s,
        p.y - 14 * s,
        58 * s,
        8 * s
      );

      ctx.fillRect(
        p.x - 29 * s,
        p.y - 25 * s,
        58 * s,
        7 * s
      );

      ctx.fillStyle =
        "#3d4244";

      ctx.fillRect(
        p.x - 23 * s,
        p.y - 7 * s,
        4 * s,
        9 * s
      );

      ctx.fillRect(
        p.x + 19 * s,
        p.y - 7 * s,
        4 * s,
        9 * s
      );

      break;


    case "barrier":
      ctx.strokeStyle =
        "#ff8b52";

      ctx.lineWidth =
        4 * s;

      ctx.beginPath();

      ctx.moveTo(
        p.x - 27 * s,
        p.y - 18 * s
      );

      ctx.lineTo(
        p.x + 27 * s,
        p.y - 18 * s
      );

      ctx.stroke();

      ctx.strokeStyle =
        "#ddd4bd";

      ctx.lineWidth =
        2 * s;

      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();

        ctx.moveTo(
          p.x +
          i * 11 * s -
          4 * s,
          p.y - 22 * s
        );

        ctx.lineTo(
          p.x +
          i * 11 * s +
          4 * s,
          p.y - 14 * s
        );

        ctx.stroke();
      }

      break;


    case "cone":
      ctx.fillStyle =
        "#ff7648";

      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y - 24 * s
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

      ctx.fillStyle =
        "#ddd8c9";

      ctx.fillRect(
        p.x - 6 * s,
        p.y - 11 * s,
        12 * s,
        3 * s
      );

      break;


    case "utility":
      ctx.fillStyle =
        "#515e62";

      ctx.fillRect(
        p.x - 13 * s,
        p.y - 35 * s,
        26 * s,
        35 * s
      );

      ctx.strokeStyle =
        "rgba(200,210,210,.25)";

      ctx.strokeRect(
        p.x - 13 * s,
        p.y - 35 * s,
        26 * s,
        35 * s
      );

      ctx.fillStyle =
        "#262e31";

      ctx.fillRect(
        p.x + 5 * s,
        p.y - 19 * s,
        3 * s,
        5 * s
      );

      break;


    case "umbrella":
      ctx.strokeStyle =
        "#6f797e";

      ctx.lineWidth =
        1.5 * s;

      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y
      );

      ctx.lineTo(
        p.x,
        p.y - 27 * s
      );

      ctx.stroke();

      ctx.fillStyle =
        "rgba(76,90,100,.78)";

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
        "rgba(130,145,150,.45)";

      ctx.strokeRect(
        p.x - 15 * s,
        p.y - 4 * s,
        30 * s,
        7 * s
      );

      for (let i = -10; i <= 10; i += 5) {
        ctx.beginPath();

        ctx.moveTo(
          p.x + i * s,
          p.y - 4 * s
        );

        ctx.lineTo(
          p.x + i * s,
          p.y + 3 * s
        );

        ctx.stroke();
      }

      break;


    case "acstack":
      drawAC(
        prop.x,
        prop.y,
        18
      );
      break;
  }

  ctx.restore();
}


/* ==========================================================
   STALLS
========================================================== */

function drawStall(stall) {
  const p =
    project(
      stall.x,
      stall.y
    );

  const s = p.scale;

  ctx.save();

  const light =
    ctx.createRadialGradient(
      p.x,
      p.y - 25 * s,
      0,
      p.x,
      p.y - 10 * s,
      70 * s
    );

  light.addColorStop(
    0,
    rgba(
      stall.color,
      .18
    )
  );

  light.addColorStop(
    1,
    rgba(
      stall.color,
      0
    )
  );

  ctx.fillStyle = light;

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y,
    70 * s,
    22 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* legs */

  ctx.strokeStyle =
    "#4e4035";

  ctx.lineWidth =
    3 * s;

  ctx.beginPath();

  ctx.moveTo(
    p.x - 28 * s,
    p.y - 38 * s
  );

  ctx.lineTo(
    p.x - 28 * s,
    p.y
  );

  ctx.moveTo(
    p.x + 28 * s,
    p.y - 38 * s
  );

  ctx.lineTo(
    p.x + 28 * s,
    p.y
  );

  ctx.stroke();


  /* counter */

  ctx.fillStyle =
    "#322722";

  ctx.fillRect(
    p.x - 31 * s,
    p.y - 37 * s,
    62 * s,
    37 * s
  );

  ctx.fillStyle =
    "#71523a";

  ctx.fillRect(
    p.x - 33 * s,
    p.y - 39 * s,
    66 * s,
    5 * s
  );


  /* food trays */

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle =
      i % 2
        ? "#c27b45"
        : "#9f5540";

    ctx.fillRect(
      p.x -
      19 * s +
      i * 19 * s,
      p.y - 32 * s,
      13 * s,
      5 * s
    );
  }


  /* canopy */

  ctx.save();

  glow(
    stall.color,
    12
  );

  ctx.fillStyle =
    stall.color;

  ctx.fillRect(
    p.x - 38 * s,
    p.y - 53 * s,
    76 * s,
    13 * s
  );

  ctx.restore();


  /* sign */

  ctx.fillStyle =
    "#fff2da";

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
    p.y - 44 * s
  );


  /* steam */

  const t =
    performance.now() *
    .001;

  ctx.strokeStyle =
    "rgba(235,240,240,.22)";

  ctx.lineWidth =
    1.5 * s;

  for (let i = 0; i < 3; i++) {
    const sx =
      p.x +
      (
        i - 1
      ) *
      13 * s;

    ctx.beginPath();

    ctx.moveTo(
      sx,
      p.y - 54 * s
    );

    ctx.bezierCurveTo(
      sx +
      Math.sin(
        t * 2 +
        i
      ) *
      5,
      p.y - 65 * s,

      sx - 4,
      p.y - 72 * s,

      sx +
      Math.sin(
        t * 1.5 +
        i
      ) *
      4,
      p.y - 82 * s
    );

    ctx.stroke();
  }

  ctx.restore();
}


/* ==========================================================
   CHARACTER PALETTES
========================================================== */

function getCharacterPalette(name) {
  const palettes = {
    player: {
      hair: "#17232d",
      skin: "#dfb58e",
      body: "#182b37",
      body2: "#203d49",
      accent: "#49e4ff",
      legs: "#182027",
      shoes: "#dce5e8"
    },

    navy: {
      hair: "#27282a",
      skin: "#d8aa83",
      body: "#293947",
      body2: "#344d5e",
      accent: "#779aab",
      legs: "#252b31",
      shoes: "#adb4b8"
    },

    charcoal: {
      hair: "#292526",
      skin: "#deb08b",
      body: "#404247",
      body2: "#55575c",
      accent: "#8e9298",
      legs: "#292c30",
      shoes: "#aaadaf"
    },

    purple: {
      hair: "#302630",
      skin: "#deb08b",
      body: "#574161",
      body2: "#6a5077",
      accent: "#b58aca",
      legs: "#303039",
      shoes: "#b9b7c0"
    },

    yellow: {
      hair: "#292827",
      skin: "#d7aa85",
      body: "#d4a62c",
      body2: "#efc743",
      accent: "#fff09b",
      legs: "#30363a",
      shoes: "#c6c9c9"
    },

    blue: {
      hair: "#20272d",
      skin: "#d9ad89",
      body: "#315d78",
      body2: "#3e7698",
      accent: "#76cbed",
      legs: "#27323b",
      shoes: "#b8c2c6"
    },

    green: {
      hair: "#292722",
      skin: "#d6aa84",
      body: "#425d4b",
      body2: "#55735f",
      accent: "#8cb296",
      legs: "#2c332f",
      shoes: "#aaa99f"
    },

    gray: {
      hair: "#34312f",
      skin: "#d9ad88",
      body: "#53575a",
      body2: "#676c70",
      accent: "#9ca4a8",
      legs: "#303337",
      shoes: "#b8b9b6"
    },

    red: {
      hair: "#312724",
      skin: "#dbad86",
      body: "#71433e",
      body2: "#8d5149",
      accent: "#dc8274",
      legs: "#332e2e",
      shoes: "#b6aca8"
    },

    brown: {
      hair: "#302823",
      skin: "#d5a680",
      body: "#624c3d",
      body2: "#79604d",
      accent: "#ae896b",
      legs: "#37312d",
      shoes: "#b5aa9d"
    },

    cream: {
      hair: "#342c28",
      skin: "#e1b48e",
      body: "#b5a78f",
      body2: "#c9baa1",
      accent: "#e6d5b6",
      legs: "#45413e",
      shoes: "#d6d0c6"
    },

    black: {
      hair: "#1f2022",
      skin: "#d7aa86",
      body: "#292b31",
      body2: "#353840",
      accent: "#737983",
      legs: "#202226",
      shoes: "#a8acb0"
    },

    cyan: {
      hair: "#20272c",
      skin: "#ddb08a",
      body: "#2e5c66",
      body2: "#397581",
      accent: "#5be4eb",
      legs: "#27353a",
      shoes: "#c4d2d4"
    }
  };

  return (
    palettes[name] ||
    palettes.gray
  );
}


/* ==========================================================
   DEFORMED GAME CHARACTER

   街は高密度。
   人物は意図的にシンプル。
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

  const s = p.scale;

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
        char.action === "walk" ||
        char.action === "umbrellaWalk"
      );

  const phase =
    isPlayer
      ? player.step
      : (
        char.walkPhase || 0
      );

  const bob =
    moving
      ? Math.abs(
          Math.sin(phase)
        ) * 2 * s
      : 0;

  const step =
    moving
      ? Math.sin(phase) * 4 * s
      : 0;

  ctx.save();


  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,.34)";

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y + 1,
    16 * s,
    5 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* tiny reflection */

  ctx.fillStyle =
    isPlayer
      ? "rgba(70,225,255,.055)"
      : "rgba(220,225,225,.035)";

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y + 11 * s,
    10 * s,
    17 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.translate(
    p.x,
    p.y - bob
  );


  /* backpack */

  if (
    char.type === "student"
  ) {
    ctx.fillStyle =
      "#303841";

    roundedRect(
      -14 * s,
      -40 * s,
      28 * s,
      28 * s,
      6 * s
    );

    ctx.fill();
  }


  /* delivery box */

  if (
    char.type === "delivery"
  ) {
    ctx.fillStyle =
      char.palette === "blue"
        ? "#397a9a"
        : "#d4ac2c";

    roundedRect(
      -17 * s,
      -44 * s,
      34 * s,
      31 * s,
      4 * s
    );

    ctx.fill();
  }


  /* legs */

  ctx.fillStyle =
    palette.legs;

  roundedRect(
    -11 * s,
    -19 * s,
    8 * s,
    20 * s + step,
    3 * s
  );

  ctx.fill();

  roundedRect(
    3 * s,
    -19 * s,
    8 * s,
    20 * s - step,
    3 * s
  );

  ctx.fill();


  /* shoes */

  ctx.fillStyle =
    palette.shoes;

  roundedRect(
    -13 * s,
    -2 * s + step,
    11 * s,
    5 * s,
    2 * s
  );

  ctx.fill();

  roundedRect(
    2 * s,
    -2 * s - step,
    11 * s,
    5 * s,
    2 * s
  );

  ctx.fill();


  /* torso */

  ctx.fillStyle =
    palette.body;

  roundedRect(
    -17 * s,
    -36 * s,
    34 * s,
    27 * s,
    8 * s
  );

  ctx.fill();

  ctx.fillStyle =
    palette.body2;

  ctx.fillRect(
    -14 * s,
    -24 * s,
    28 * s,
    13 * s
  );


  /* player stripe */

  if (isPlayer) {
    ctx.save();

    glow(
      palette.accent,
      5
    );

    ctx.fillStyle =
      palette.accent;

    ctx.fillRect(
      -2 * s,
      -34 * s,
      4 * s,
      21 * s
    );

    ctx.restore();
  }


  /* arms */

  const arm =
    moving
      ? Math.sin(phase) * 3 * s
      : 0;

  ctx.fillStyle =
    palette.body2;

  roundedRect(
    -21 * s,
    -32 * s + arm,
    7 * s,
    21 * s,
    3 * s
  );

  ctx.fill();

  roundedRect(
    14 * s,
    -32 * s - arm,
    7 * s,
    21 * s,
    3 * s
  );

  ctx.fill();


  /* head */

  ctx.fillStyle =
    palette.skin;

  roundedRect(
    -16 * s,
    -68 * s,
    32 * s,
    30 * s,
    10 * s
  );

  ctx.fill();


  /* hair */

  ctx.fillStyle =
    palette.hair;

  ctx.beginPath();

  ctx.moveTo(
    -16 * s,
    -56 * s
  );

  ctx.quadraticCurveTo(
    -16 * s,
    -73 * s,
    0,
    -74 * s
  );

  ctx.quadraticCurveTo(
    17 * s,
    -73 * s,
    16 * s,
    -56 * s
  );

  ctx.lineTo(
    11 * s,
    -61 * s
  );

  ctx.lineTo(
    6 * s,
    -57 * s
  );

  ctx.lineTo(
    1 * s,
    -62 * s
  );

  ctx.lineTo(
    -4 * s,
    -57 * s
  );

  ctx.lineTo(
    -9 * s,
    -62 * s
  );

  ctx.closePath();

  ctx.fill();


  /* face = almost nothing */

  if (
    char.direction !== "up"
  ) {
    ctx.fillStyle =
      "rgba(75,52,44,.20)";

    ctx.fillRect(
      -5 * s,
      -47 * s,
      10 * s,
      2 * s
    );
  }


  /* office */

  if (
    char.type === "office"
  ) {
    ctx.fillStyle =
      "#b6c0c5";

    ctx.fillRect(
      -2 * s,
      -34 * s,
      4 * s,
      10 * s
    );

    ctx.fillStyle =
      "#262b30";

    roundedRect(
      15 * s,
      -19 * s,
      12 * s,
      15 * s,
      2 * s
    );

    ctx.fill();
  }


  /* shopkeeper apron */

  if (
    char.type === "shopkeeper"
  ) {
    ctx.fillStyle =
      "#c4b298";

    ctx.beginPath();

    ctx.moveTo(
      -10 * s,
      -29 * s
    );

    ctx.lineTo(
      10 * s,
      -29 * s
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


  /* elder */

  if (
    char.type === "elder"
  ) {
    ctx.fillStyle =
      "#92918b";

    ctx.fillRect(
      -12 * s,
      -70 * s,
      24 * s,
      6 * s
    );

    ctx.strokeStyle =
      "#7d6e59";

    ctx.lineWidth =
      2 * s;

    ctx.beginPath();

    ctx.moveTo(
      20 * s,
      -20 * s
    );

    ctx.lineTo(
      23 * s,
      1 * s
    );

    ctx.stroke();
  }


  /* security */

  if (
    char.type === "security"
  ) {
    ctx.fillStyle =
      "#7695a4";

    ctx.fillRect(
      -10 * s,
      -31 * s,
      20 * s,
      4 * s
    );

    ctx.fillStyle =
      "#1f2c34";

    ctx.fillRect(
      -14 * s,
      -72 * s,
      28 * s,
      5 * s
    );
  }


  /* phone */

  if (
    char.action === "phone"
  ) {
    ctx.save();

    glow(
      "#78ddff",
      7
    );

    ctx.fillStyle =
      "#8ce5ff";

    roundedRect(
      12 * s,
      -41 * s,
      7 * s,
      12 * s,
      1 * s
    );

    ctx.fill();

    ctx.restore();
  }


  /* food bowl */

  if (
    char.action === "eat"
  ) {
    ctx.fillStyle =
      "#d8d1bc";

    ctx.beginPath();

    ctx.ellipse(
      15 * s,
      -27 * s,
      8 * s,
      4 * s,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  /* umbrella */

  if (
    char.action === "umbrella" ||
    char.action === "umbrellaWalk"
  ) {
    ctx.strokeStyle =
      "#89949b";

    ctx.lineWidth =
      2 * s;

    ctx.beginPath();

    ctx.moveTo(
      14 * s,
      -25 * s
    );

    ctx.lineTo(
      13 * s,
      -75 * s
    );

    ctx.stroke();

    ctx.fillStyle =
      "rgba(55,74,86,.82)";

    ctx.beginPath();

    ctx.moveTo(
      -24 * s,
      -70 * s
    );

    ctx.quadraticCurveTo(
      13 * s,
      -102 * s,
      50 * s,
      -70 * s
    );

    ctx.quadraticCurveTo(
      37 * s,
      -75 * s,
      25 * s,
      -70 * s
    );

    ctx.quadraticCurveTo(
      13 * s,
      -76 * s,
      1 * s,
      -70 * s
    );

    ctx.quadraticCurveTo(
      -11 * s,
      -76 * s,
      -24 * s,
      -70 * s
    );

    ctx.fill();
  }


  /* delivery helmet */

  if (
    char.type === "delivery"
  ) {
    const helmet =
      char.palette === "blue"
        ? "#59bce6"
        : "#f0c733";

    ctx.fillStyle =
      helmet;

    ctx.beginPath();

    ctx.arc(
      0,
      -63 * s,
      17 * s,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillRect(
      -17 * s,
      -63 * s,
      34 * s,
      4 * s
    );
  }


  /* subtle rim */

  ctx.globalAlpha = .24;

  ctx.strokeStyle =
    isPlayer
      ? "#50eaff"
      : (
        currentMapId === "oldtown"
          ? "#ffb56b"
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
    -13 * s
  );

  ctx.stroke();

  ctx.restore();
}


/* ==========================================================
   OVERHEAD WIRES
========================================================== */

function drawWires() {
  for (
    const wire
    of currentMap.wires || []
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
      "rgba(12,14,16,.82)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(a.x, a.y);

    ctx.quadraticCurveTo(
      (a.x + b.x) / 2,
      Math.max(a.y, b.y) + 18,
      b.x,
      b.y
    );

    ctx.stroke();


    /* cable highlight */

    ctx.strokeStyle =
      "rgba(100,110,110,.12)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
      a.x,
      a.y - 1
    );

    ctx.quadraticCurveTo(
      (a.x + b.x) / 2,
      Math.max(a.y, b.y) + 17,
      b.x,
      b.y - 1
    );

    ctx.stroke();
  }
}


/* ==========================================================
   CLOTHES LINES
========================================================== */

function drawClothesLines() {
  for (
    const line
    of currentMap.clothesLines || []
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
      "rgba(130,125,115,.72)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(a.x, a.y);

    ctx.quadraticCurveTo(
      (a.x + b.x) / 2,
      Math.max(a.y, b.y) + 6,
      b.x,
      b.y
    );

    ctx.stroke();

    const colors = [
      "#a25d52",
      "#667989",
      "#b49b72",
      "#65775f",
      "#a07d92"
    ];

    for (let i = 1; i <= 5; i++) {
      const t =
        i / 6;

      const x =
        lerp(
          a.x,
          b.x,
          t
        );

      const y =
        lerp(
          a.y,
          b.y,
          t
        ) +
        Math.sin(
          t * Math.PI
        ) * 5;

      ctx.fillStyle =
        colors[i - 1];

      if (i % 2 === 0) {
        ctx.fillRect(
          x - 6,
          y,
          12,
          12
        );
      } else {
        ctx.beginPath();

        ctx.moveTo(
          x - 6,
          y
        );

        ctx.lineTo(
          x + 6,
          y
        );

        ctx.lineTo(
          x + 4,
          y + 14
        );

        ctx.lineTo(
          x - 4,
          y + 14
        );

        ctx.closePath();
        ctx.fill();
      }
    }
  }
}


/* ==========================================================
   SORTED CITY OBJECTS
========================================================== */

function drawCityObjects() {
  const objects = [];

  for (const b of BUILDINGS) {
    objects.push({
      y:
        b.y + b.h,
      draw:
        () => drawBuilding(b)
    });
  }

  for (const tree of TREES) {
    objects.push({
      y: tree.y,
      draw:
        () => drawTree(tree)
    });
  }

  for (const light of STREET_LIGHTS) {
    objects.push({
      y: light.y,
      draw:
        () => drawStreetLight(light)
    });
  }

  for (const sign of STREET_SIGNS) {
    objects.push({
      y: sign.y,
      draw:
        () => drawStreetSign(sign)
    });
  }

  for (const prop of PROPS) {
    objects.push({
      y: prop.y,
      draw:
        () => drawProp(prop)
    });
  }

  for (const stall of STALLS) {
    objects.push({
      y: stall.y,
      draw:
        () => drawStall(stall)
    });
  }

  for (const npc of NPCS) {
    objects.push({
      y: npc.y,
      draw:
        () =>
          drawCharacter(
            npc,
            false
          )
    });
  }

  objects.push({
    y: player.y,
    draw:
      () =>
        drawCharacter(
          player,
          true
        )
  });

  objects.sort(
    (a, b) =>
      a.y - b.y
  );

  for (const obj of objects) {
    obj.draw();
  }
}


/* ==========================================================
   INTERIORS
========================================================== */

function drawInteriorBase(
  data,
  floorColor,
  wallColor
) {
  ctx.fillStyle =
    "#0b0d10";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const a =
    project(
      40,
      40
    );

  const b =
    project(
      data.width - 40,
      data.height - 40
    );

  ctx.fillStyle =
    floorColor;

  ctx.fillRect(
    a.x,
    a.y,
    b.x - a.x,
    b.y - a.y
  );


  /* back wall */

  const w1 =
    project(
      70,
      90,
      110
    );

  const w2 =
    project(
      data.width - 70,
      90,
      110
    );

  const w3 =
    project(
      data.width - 70,
      90,
      0
    );

  const w4 =
    project(
      70,
      90,
      0
    );

  ctx.fillStyle =
    wallColor;

  ctx.beginPath();

  ctx.moveTo(
    w1.x,
    w1.y
  );

  ctx.lineTo(
    w2.x,
    w2.y
  );

  ctx.lineTo(
    w3.x,
    w3.y
  );

  ctx.lineTo(
    w4.x,
    w4.y
  );

  ctx.closePath();
  ctx.fill();
}

function drawInteriorBox(
  x,
  y,
  w,
  h,
  color
) {
  const p =
    project(x, y);

  const s = p.scale;

  ctx.fillStyle =
    color;

  ctx.fillRect(
    p.x -
    w * s / 2,
    p.y -
    h * s,
    w * s,
    h * s
  );
}

function drawConvenienceInterior() {
  const data =
    INTERIORS.convenience;

  drawInteriorBase(
    data,
    "#2a2d2e",
    "#d6d8d4"
  );

  drawInteriorBox(
    185,
    310,
    160,
    330,
    "#c8cbc7"
  );

  drawInteriorBox(
    865,
    310,
    160,
    330,
    "#c8cbc7"
  );

  drawInteriorBox(
    525,
    210,
    310,
    65,
    "#999f9b"
  );

  drawInteriorBox(
    525,
    380,
    310,
    65,
    "#999f9b"
  );

  for (let i = 0; i < 5; i++) {
    const p =
      project(
        525 +
        (i - 2) * 45,
        210,
        30
      );

    ctx.fillStyle =
      i % 2
        ? "#d86c5a"
        : "#5d8c72";

    ctx.fillRect(
      p.x - 4,
      p.y - 8,
      8,
      8
    );
  }

  drawCharacter(
    player,
    true
  );
}

function drawRestaurantInterior() {
  const data =
    INTERIORS.restaurant;

  drawInteriorBase(
    data,
    "#302721",
    "#5a3c2e"
  );

  drawInteriorBox(
    525,
    130,
    850,
    100,
    "#604332"
  );

  drawInteriorBox(
    250,
    350,
    220,
    70,
    "#6f4c35"
  );

  drawInteriorBox(
    800,
    350,
    220,
    70,
    "#6f4c35"
  );

  drawCharacter(
    player,
    true
  );
}

function drawOfficeInterior() {
  const data =
    INTERIORS.office;

  drawInteriorBase(
    data,
    "#22282e",
    "#303a43"
  );

  drawInteriorBox(
    550,
    150,
    820,
    80,
    "#3b4650"
  );

  drawInteriorBox(
    280,
    350,
    280,
    80,
    "#303b43"
  );

  drawInteriorBox(
    820,
    350,
    280,
    80,
    "#303b43"
  );

  drawCharacter(
    player,
    true
  );
}

function drawNoodleInterior() {
  const data =
    INTERIORS.noodle;

  drawInteriorBase(
    data,
    "#302722",
    "#63422f"
  );

  drawInteriorBox(
    500,
    130,
    800,
    95,
    "#684733"
  );

  drawInteriorBox(
    250,
    350,
    200,
    70,
    "#795239"
  );

  drawInteriorBox(
    750,
    350,
    200,
    70,
    "#795239"
  );

  drawCharacter(
    player,
    true
  );
}

function drawTeaInterior() {
  const data =
    INTERIORS.tea;

  drawInteriorBase(
    data,
    "#252b25",
    "#42503e"
  );

  drawInteriorBox(
    500,
    125,
    790,
    85,
    "#4e5a45"
  );

  drawInteriorBox(
    270,
    370,
    180,
    85,
    "#5d4936"
  );

  drawInteriorBox(
    730,
    370,
    180,
    85,
    "#5d4936"
  );

  drawCharacter(
    player,
    true
  );
}

function drawInterior() {
  switch (currentInterior) {
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

const rain = [];

function resetRain() {
  rain.length = 0;

  for (let i = 0; i < 150; i++) {
    rain.push({
      x: Math.random() * W,
      y: Math.random() * H,
      len: rand(8, 20),
      speed: rand(520, 920),
      alpha: rand(.08, .26)
    });
  }
}

resetRain();

window.addEventListener(
  "resize",
  resetRain
);

function updateRain(dt) {
  for (const drop of rain) {
    drop.y +=
      drop.speed * dt;

    drop.x -=
      drop.speed *
      .16 *
      dt;

    if (
      drop.y > H + 30 ||
      drop.x < -30
    ) {
      drop.x =
        Math.random() *
        W +
        80;

      drop.y = -20;
    }
  }
}

function drawRain() {
  if (scene !== "city") return;

  ctx.save();

  ctx.lineWidth = 1;

  for (const drop of rain) {
    ctx.strokeStyle =
      `rgba(170,200,215,${drop.alpha})`;

    ctx.beginPath();

    ctx.moveTo(
      drop.x,
      drop.y
    );

    ctx.lineTo(
      drop.x -
      drop.len * .18,
      drop.y +
      drop.len
    );

    ctx.stroke();
  }

  ctx.restore();
}


/* ==========================================================
   NIGHT ATMOSPHERE
========================================================== */

function drawAtmosphere() {
  if (scene !== "city") return;

  const g =
    ctx.createLinearGradient(
      0,
      0,
      0,
      H
    );

  g.addColorStop(
    0,
    "rgba(12,24,34,.08)"
  );

  g.addColorStop(
    .55,
    "rgba(8,13,18,.01)"
  );

  g.addColorStop(
    1,
    "rgba(0,0,0,.18)"
  );

  ctx.fillStyle = g;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /* distant haze */

  const haze =
    ctx.createLinearGradient(
      0,
      H * .15,
      0,
      H * .55
    );

  haze.addColorStop(
    0,
    "rgba(95,130,150,.04)"
  );

  haze.addColorStop(
    1,
    "rgba(95,130,150,0)"
  );

  ctx.fillStyle = haze;

  ctx.fillRect(
    0,
    H * .1,
    W,
    H * .5
  );
}


/* ==========================================================
   FOREGROUND LEAVES
========================================================== */

function drawForegroundLeaves() {
  if (
    scene !== "city" ||
    currentMapId !== "oldtown"
  ) {
    return;
  }

  ctx.save();

  ctx.globalAlpha = .20;

  ctx.fillStyle =
    "#0e2018";

  for (let i = 0; i < 8; i++) {
    const x =
      i % 2 === 0
        ? 15 + i * 5
        : W - 30 - i * 6;

    const y =
      80 +
      i * 75;

    ctx.beginPath();

    ctx.ellipse(
      x,
      y,
      24,
      10,
      i * .7,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.restore();
}


/* ==========================================================
   FADE
========================================================== */

function drawFade() {
  if (fade.alpha <= 0) return;

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

  if (scene === "city") {
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

  if (scene === "city") {
    drawPlazas();

    drawRoads();

    drawRoadReflections();

    drawPuddles();

    drawCityObjects();

    /*
       空中にあるものはY-sort後。
       キャラの頭上を横切る。
    */

    drawWires();
    drawClothesLines();

    drawAtmosphere();

    drawRain();

    drawForegroundLeaves();
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

  lastTime = time;

  dt =
    Math.min(
      dt,
      .05
    );

  update(dt);

  draw();

  requestAnimationFrame(loop);
}


/* ==========================================================
   START
========================================================== */

updateLocationUI();

showDistrictCard();

requestAnimationFrame(loop);
