/* ZomBombadil site — starfield, tracklist rendering, audio wiring, reveals. */
(function () {
  "use strict";

  /* ---------- Starfield (canvas, procedural, green-tinted stars) ---------- */
  var canvas = document.getElementById("starfield");
  var ctx = canvas.getContext("2d");
  var stars = [];
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
