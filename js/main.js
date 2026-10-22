/* Aarthi S portfolio: interactions */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Toast ---------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  /* ---------- Theme toggle ---------- */
  var themeBtn = $("#themeToggle");
  function syncThemeLabel() {
    var dark = root.getAttribute("data-theme") === "dark";
    if (themeBtn) themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0b1a1a" : "#0f5c57");
  }
  syncThemeLabel();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
      syncThemeLabel();
      document.dispatchEvent(new Event("themechange"));
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $("#menuToggle");
  var nav = $("#nav");
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) setMenu(false); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
  }

  /* ---------- Scroll progress ---------- */
  var bar = $("#progress");
  var ticking = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (bar) bar.style.transform = "scaleX(" + p + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---------- Scroll spy ---------- */
  var links = $$(".nav a");
  var sections = links.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Skill filter tabs ---------- */
  var tabs = $$(".tab");
  var chips = $$("#chips .chip");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var f = tab.getAttribute("data-filter");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      chips.forEach(function (c) {
        var show = f === "all" || c.getAttribute("data-group") === f;
        c.classList.toggle("is-hidden", !show);
        c.classList.remove("is-entering");
        if (show && !reduceMotion) {
          void c.offsetWidth; /* restart animation */
          c.classList.add("is-entering");
        }
      });
    });
  });

  /* ---------- Project dialogs ---------- */
  $$("[data-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dlg = document.getElementById(btn.getAttribute("data-open"));
      if (!dlg) return;
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    });
  });
  $$("dialog.dlg").forEach(function (dlg) {
    function close() { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }
    $$("[data-close]", dlg).forEach(function (b) { b.addEventListener("click", close); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); }); /* click on backdrop */
  });

  /* ---------- Copy buttons ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { toast("Copied " + text); },
          function () { toast(fallbackCopy(text) ? "Copied " + text : "Copy failed. Select the text instead."); }
        );
      } else {
        toast(fallbackCopy(text) ? "Copied " + text : "Copy failed. Select the text instead.");
      }
    });
  });

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  var form = $("#contactForm");
  var errorEl = $("#formError");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var msg = form.elements.message;
      var problems = [];
      [name, email, msg].forEach(function (f) { f.removeAttribute("aria-invalid"); });
      if (!name.value.trim()) { problems.push("your name"); name.setAttribute("aria-invalid", "true"); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { problems.push("a valid email address"); email.setAttribute("aria-invalid", "true"); }
      if (!msg.value.trim()) { problems.push("a message"); msg.setAttribute("aria-invalid", "true"); }
      if (problems.length) {
        errorEl.textContent = "Please add " + problems.join(", ") + ".";
        errorEl.hidden = false;
        var firstBad = $('[aria-invalid="true"]', form);
        if (firstBad) firstBad.focus();
        return;
      }
      errorEl.hidden = true;
      var subject = "Portfolio enquiry from " + name.value.trim();
      var body = msg.value.trim() + "\n\n" + name.value.trim() + "\n" + email.value.trim();
      window.location.href = "mailto:aarthiseenuva241@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      toast("Opening your email app");
    });
  }

  /* ---------- Footer year ---------- */
  var y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Hero network canvas ----------
     Drifting nodes joined by lines; lines near the pointer light up in the accent colour. */
  var canvas = $("#net");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1, nodes = [], raf = null, visible = true;
    var pointer = { x: -9999, y: -9999 };
    var colors = { net: "15,92,87", accent: "232,150,46" };

    function readColors() {
      var cs = getComputedStyle(root);
      var net = cs.getPropertyValue("--net").trim();
      var acc = cs.getPropertyValue("--accent").trim();
      if (net) colors.net = net;
      if (/^#[0-9a-f]{6}$/i.test(acc)) {
        colors.accent = parseInt(acc.slice(1, 3), 16) + "," + parseInt(acc.slice(3, 5), 16) + "," + parseInt(acc.slice(5, 7), 16);
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(24, Math.min(70, Math.round((w * h) / 22000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
          r: 1.6 + Math.random() * 1.6
        });
      }
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var link = 130, near = 170, i, j, a, b, dx, dy, d, alpha;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < link) {
            var mx = (a.x + b.x) / 2 - pointer.x, my = (a.y + b.y) / 2 - pointer.y;
            var lit = Math.sqrt(mx * mx + my * my) < near;
            alpha = (1 - d / link) * (lit ? .85 : .28);
            ctx.strokeStyle = "rgba(" + (lit ? colors.accent : colors.net) + "," + alpha + ")";
            ctx.lineWidth = lit ? 1.4 : 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - pointer.x; dy = a.y - pointer.y;
        var hot = Math.sqrt(dx * dx + dy * dy) < near;
        ctx.fillStyle = "rgba(" + (hot ? colors.accent : colors.net) + "," + (hot ? .95 : .5) + ")";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function step() {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    function start() { if (!reduceMotion && !raf && visible && !document.hidden) raf = requestAnimationFrame(step); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    var hero = $("#home");
    hero.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      if (reduceMotion) draw();
    });
    hero.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; if (reduceMotion) draw(); });

    var resizeTimer;
    window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
    document.addEventListener("themechange", function () { readColors(); draw(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(hero);
    }

    readColors();
    resize();
    start();
  }
})();
