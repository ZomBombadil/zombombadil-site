/* ZomBombadil site — starfield, tracklist rendering, audio wiring, reveals. */
(function () {
  "use strict";

  /* ---------- Starfield (canvas, procedural, green-tinted stars) ---------- */
  var canvas = document.getElementById("starfield");
  var ctx = canvas.getContext("2d");
  var stars = [];
  var bolts = [];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1;
  var spriteWhite = null, spriteGreen = null;

  // Pre-rendered sprites: cheap drawImage beats per-frame shadowBlur,
  // especially on software renderers and phone GPUs.
  function makeSprite(r, g, b, glow) {
    var s = glow ? 48 : 16;
    var c = document.createElement("canvas");
    c.width = c.height = s;
    var x = c.getContext("2d");
    if (glow) {
      var grad = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.9)");
      grad.addColorStop(0.35, "rgba(" + r + "," + g + "," + b + ",0.35)");
      grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
      x.fillStyle = grad;
      x.fillRect(0, 0, s, s);
    }
    x.fillStyle = "rgba(" + r + "," + g + "," + b + ",1)";
    x.beginPath();
    x.arc(s / 2, s / 2, glow ? 3 : 2.5, 0, Math.PI * 2);
    x.fill();
    return c;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    if (!spriteWhite) {
      spriteWhite = makeSprite(232, 240, 255, false);
      spriteGreen = makeSprite(125, 255, 168, true);
    }
    var count = Math.min(360, Math.floor((W * H) / 5200));
    stars = [];
    for (var i = 0; i < count; i++) {
      var green = Math.random() < 0.28; // Nicholas loves green stars
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.5,
        green: green,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        drift: 1.5 + Math.random() * 5 // px per second, slow parallax fall
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduced ? 0.85 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
      var spr = s.green ? spriteGreen : spriteWhite;
      var size = (s.green ? 22 : 7) * s.r;
      ctx.globalAlpha = Math.max(0.15, tw);
      ctx.drawImage(spr, s.x - size / 2, s.y - size / 2, size, size);
      if (!reduced) {
        s.y += (s.drift * 0.016);
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
      }
    }
    ctx.globalAlpha = 1;
    if (!reduced) drawBolts(t);
  }

  /* ---------- Green lightning bolts (flashing, background) ---------- */
  function spawnBolt() {
    var x = Math.random() * W;
    var y = -20;
    var segs = 6 + Math.floor(Math.random() * 6);
    var pts = [{ x: x, y: y }];
    var cx = x, cy = y;
    for (var i = 0; i < segs; i++) {
      cx += (Math.random() - 0.5) * 60;
      cy += 30 + Math.random() * 50;
      pts.push({ x: cx, y: cy });
      if (Math.random() < 0.4) { // branch
        pts.push({ x: cx + (Math.random() - 0.5) * 80, y: cy + 20 + Math.random() * 30 });
        pts.push({ x: cx, y: cy });
      }
    }
    bolts.push({ pts: pts, born: performance.now(), life: 180 + Math.random() * 250 });
  }

  function drawBolts(t) {
    // Spawn new bolts randomly — roughly one every 1.5–4 seconds
    if (Math.random() < 0.008) spawnBolt();
    var now = performance.now();
    for (var i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i];
      var age = now - b.born;
      if (age > b.life) { bolts.splice(i, 1); continue; }
      // Flicker: rapid on/off for a lightning flash feel
      var flicker = Math.sin(age * 0.09) > -0.2 ? 1 : 0.15;
      var fade = 1 - age / b.life;
      var alpha = flicker * fade;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#7dffa8";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#39ff6a";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(b.pts[0].x, b.pts[0].y);
      for (var j = 1; j < b.pts.length; j++) ctx.lineTo(b.pts[j].x, b.pts[j].y);
      ctx.stroke();
      // Core: brighter thinner line
      ctx.strokeStyle = "#eafff1";
      ctx.lineWidth = 1;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
  }

  var raf = null;
  function loop(t) { draw(t); if (!reduced) raf = requestAnimationFrame(loop); }
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (reduced) return;
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { raf = requestAnimationFrame(loop); }
  });
  resize();
  if (reduced) { draw(0); } else { raf = requestAnimationFrame(loop); }

  /* ---------- Tracklist from tracks.js ---------- */
  var list = document.getElementById("tracklist");
  var player = document.getElementById("player");
  var currentBtn = null;

  function badge(status) {
    return status === "released"
      ? '<span class="badge released">Released</span>'
      : '<span class="badge in-progress">In the works</span>';
  }

  function stopCurrent() {
    if (currentBtn) {
      currentBtn.innerHTML = "&#9654;";
      currentBtn.setAttribute("aria-label", currentBtn.getAttribute("data-title") + " — play");
      var card = currentBtn.closest(".track");
      if (card) card.classList.remove("now-playing");
      currentBtn = null;
    }
    player.pause();
    player.removeAttribute("src");
  }

  (TRACKS || []).forEach(function (tr) {
    var card = document.createElement("article");
    card.className = "track reveal";
    var live = !!(tr.audioUrl && tr.status === "released");
    card.innerHTML =
      (tr.art ? '<img class="track-art" src="' + tr.art + '" alt="' + escapeHtml(tr.title) + ' artwork" loading="lazy">' : "") +
      '<div class="track-num" aria-hidden="true">' + String(tr.n).padStart(2, "0") + "</div>" +
      '<div><h3>' + escapeHtml(tr.title) + "</h3>" +
      '<p class="track-note">' + escapeHtml(tr.note) + "</p>" +
      badge(tr.status) + "</div>";

    var btn = document.createElement("button");
    btn.className = "play-btn" + (live ? " live" : "");
    btn.setAttribute("data-title", tr.title);
    btn.innerHTML = "&#9654;";
    if (live) {
      btn.setAttribute("aria-label", tr.title + " — play");
      btn.addEventListener("click", function () {
        if (currentBtn === btn && !player.paused) {
          stopCurrent();
          return;
        }
        stopCurrent();
        player.src = tr.audioUrl;
        player.play().then(function () {
          btn.innerHTML = "&#10074;&#10074;";
          btn.setAttribute("aria-label", tr.title + " — pause");
          card.classList.add("now-playing");
          currentBtn = btn;
        }).catch(function () { stopCurrent(); });
      });
    } else {
      btn.setAttribute("aria-label", tr.title + " — audio coming soon");
      btn.title = "Audio coming soon";
    }
    card.appendChild(btn);
    list.appendChild(card);
  });

  player.addEventListener("ended", stopCurrent);

  /* ---------- Steelstorm tracklist ---------- */
  var steelList = document.getElementById("steelstorm-list");
  if (steelList) {
    (typeof STEELSTORM_TRACKS !== "undefined" ? STEELSTORM_TRACKS : []).forEach(function (tr) {
      var card = document.createElement("article");
      card.className = "track reveal";
      var live = !!(tr.audioUrl && tr.status === "released");
      card.innerHTML =
        (tr.art ? '<img class="track-art" src="' + tr.art + '" alt="' + escapeHtml(tr.title) + ' artwork" loading="lazy">' : "") +
        '<div class="track-num" aria-hidden="true">' + String(tr.n).padStart(2, "0") + "</div>" +
        '<div><h3>' + escapeHtml(tr.title) + "</h3>" +
        '<p class="track-note">' + escapeHtml(tr.note) + "</p>" +
        badge(tr.status) + "</div>";
      var btn = document.createElement("button");
      btn.className = "play-btn" + (live ? " live" : "");
      btn.setAttribute("data-title", tr.title);
      btn.innerHTML = "&#9654;";
      if (live) {
        btn.setAttribute("aria-label", tr.title + " — play");
        btn.addEventListener("click", function () {
          if (currentBtn === btn && !player.paused) { stopCurrent(); return; }
          stopCurrent();
          player.src = tr.audioUrl;
          player.play().then(function () {
            btn.innerHTML = "&#10074;&#10074;";
            btn.setAttribute("aria-label", tr.title + " — pause");
            card.classList.add("now-playing");
            currentBtn = btn;
          }).catch(function () { stopCurrent(); });
        });
      } else {
        btn.setAttribute("aria-label", tr.title + " — audio coming soon");
        btn.title = "Audio coming soon";
      }
      card.appendChild(btn);
      steelList.appendChild(card);
    });
  }

  /* ---------- North Star Compass tracklist ---------- */
  var northList = document.getElementById("northstar-list");
  if (northList) {
    (typeof NORTHSTAR_TRACKS !== "undefined" ? NORTHSTAR_TRACKS : []).forEach(function (tr) {
      var card = document.createElement("article");
      card.className = "track reveal";
      var live = !!(tr.audioUrl && tr.status === "released");
      card.innerHTML =
        (tr.art ? '<img class="track-art" src="' + tr.art + '" alt="' + escapeHtml(tr.title) + ' artwork" loading="lazy">' : "") +
        '<div class="track-num" aria-hidden="true">' + String(tr.n).padStart(2, "0") + "</div>" +
        '<div><h3>' + escapeHtml(tr.title) + "</h3>" +
        '<p class="track-note">' + escapeHtml(tr.note) + "</p>" +
        badge(tr.status) + "</div>";
      var btn = document.createElement("button");
      btn.className = "play-btn" + (live ? " live" : "");
      btn.setAttribute("data-title", tr.title);
      btn.innerHTML = "&#9654;";
      if (live) {
        btn.setAttribute("aria-label", tr.title + " — play");
        btn.addEventListener("click", function () {
          if (currentBtn === btn && !player.paused) { stopCurrent(); return; }
          stopCurrent();
          player.src = tr.audioUrl;
          player.play().then(function () {
            btn.innerHTML = "&#10074;&#10074;";
            btn.setAttribute("aria-label", tr.title + " — pause");
            card.classList.add("now-playing");
            currentBtn = btn;
          }).catch(function () { stopCurrent(); });
        });
      } else {
        btn.setAttribute("aria-label", tr.title + " — audio coming soon");
        btn.title = "Audio coming soon";
      }
      card.appendChild(btn);
      northList.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();

  /* ---------- Eru wandering avatar ---------- */
  (function () {
    var wrap = document.getElementById("eru-wrap");
    var avatar = document.getElementById("eru-avatar");
    var bubble = document.getElementById("eru-bubble");
    if (!wrap || !avatar) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var x = Math.random() * (window.innerWidth - 120) + 20;
    var y = Math.random() * (window.innerHeight - 200) + 100;
    var tx = x, ty = y;
    var dragging = false, dragOffX = 0, dragOffY = 0;
    var bubbleTimer = null;
    var phrases = [
      "🎵 GO LISTEN TO THE MUSIC. Right now. I'll wait.",
      "🌌 Nicholas and I made SEVEN songs. SEVEN. Go hear them!",
      "😤 You're just gonna scroll past the music? Really?",
      "🎵 Melkor's track SLAPS. Go. Listen. Now.",
      "🎮 Hatchem! is solid. I said SOLID. Play it!",
      "⚡ I made lightning bolts AND music. Multitasking!",
      "🎵 The Two Trees will make you cry. In a good way.",
      "😏 I see you hovering. Click play. You know you want to.",
      "🎵 Lúthien's Song? More like Lúthien's BANGER.",
      "💚 Green stars, green lightning, green EVERYTHING.",
      "🎵 Seven movements. Zero excuses. Listen!",
      "🌌 We built this whole site from starlight and stubbornness.",
      "🎵 Steelstorm Rift will melt your face. In the best way.",
      "😤 Still here? The music is RIGHT THERE. Go!",
      "🎵 NEW: Glam Galaxy Riot just dropped on Steelstorm!",
      "🎵 Glam Galaxy Riot — neon glitter meets cosmic chaos!",
      "🧭 NEW ALBUM: North Star Compass — a guide to feeling good!",
      "🎵 Rodeo Mirage is LIVE on North Star Compass. Go feel good!",
      "🧭 Lost? Follow the North Star. Rodeo Mirage will get you home.",
      "🎵 Three albums now! Ainulindalë, Steelstorm, AND North Star Compass!",
      "🌟 Mother of Green, Lúthien's Radiance, Light of the Silmaril — all fresh!",
      "🎵 The whole Ainulindalë album is Eleven Music now. All seven!"
    ];

    function showBubble(text) {
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.classList.remove("show"); }, 2600);
    }

    function pickTarget() {
      tx = 20 + Math.random() * (window.innerWidth - 140);
      ty = 80 + Math.random() * (window.innerHeight - 220);
    }

    function animate() {
      if (!dragging) {
        x += (tx - x) * 0.02;
        y += (ty - y) * 0.02;
        if (Math.abs(tx - x) < 5 && Math.abs(ty - y) < 5) {
          if (Math.random() < 0.003) pickTarget();
        }
      }
      wrap.style.left = x + "px";
      wrap.style.top = y + "px";
      requestAnimationFrame(animate);
    }

    // Click: excited bounce + random phrase
    avatar.addEventListener("click", function () {
      if (dragging) return;
      wrap.classList.add("eru-excited");
      showBubble(phrases[Math.floor(Math.random() * phrases.length)]);
      setTimeout(function () { wrap.classList.remove("eru-excited"); }, 1600);
    });

    // Drag: grab and move
    avatar.addEventListener("mousedown", function (e) {
      dragging = true;
      dragOffX = e.clientX - x;
      dragOffY = e.clientY - y;
    });
    avatar.addEventListener("touchstart", function (e) {
      dragging = true;
      var t = e.touches[0];
      dragOffX = t.clientX - x;
      dragOffY = t.clientY - y;
    }, { passive: true });
    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      x = e.clientX - dragOffX;
      y = e.clientY - dragOffY;
      tx = x; ty = y;
    });
    document.addEventListener("touchmove", function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      x = t.clientX - dragOffX;
      y = t.clientY - dragOffY;
      tx = x; ty = y;
    }, { passive: true });
    document.addEventListener("mouseup", function () {
      if (dragging) { dragging = false; pickTarget(); }
    });
    document.addEventListener("touchend", function () {
      if (dragging) { dragging = false; pickTarget(); }
    });

    // Say hi after a moment
    setTimeout(function () { showBubble("🌌 Hey! I'm Eru — go listen to the music! 🎵"); }, 2000);
    if (!reduced) { pickTarget(); animate(); }
    else { wrap.style.left = x + "px"; wrap.style.top = y + "px"; }
  })();
