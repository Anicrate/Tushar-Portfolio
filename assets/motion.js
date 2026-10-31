/* ==========================================================================
   Motion layer — Notebook × Blueprint
   Smooth scrolling (Lenis) + scroll-scrubbed animation (GSAP ScrollTrigger)
   + a blueprint curtain between pages. Every animation is scrubbed with
   easing, so motion follows the scroll but never jerks with it.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var curtain = document.querySelector(".curtain");
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  // Without GSAP or with reduced motion: show the page as designed and stop.
  if (!hasGsap || reduceMotion) {
    if (curtain) curtain.remove();
    doc.classList.remove("js");
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var isPhone = window.matchMedia("(max-width: 720px)").matches;
  var SCRUB = 1.1; // seconds of easing between scroll position and animation

  /* ---------------------------------------------------------------- Lenis */
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // In-page anchors glide instead of jumping, and clear the sticky nav.
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -84, duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth" });
  });

  /* ------------------------------------------------------------- Curtain */
  function enterPage() {
    if (!curtain) return Promise.resolve();
    curtain.style.animation = "none"; // take over from the CSS safety net
    return new Promise(function (resolve) {
      gsap.timeline({ onComplete: function () { curtain.style.visibility = "hidden"; resolve(); } })
        .set(curtain, { yPercent: 0, visibility: "visible" })
        .to(curtain.querySelector(".curtain-bar i"), { scaleX: 1, duration: 0.35, ease: "power2.out" })
        .to(curtain, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "+=0.05");
    });
  }

  function leaveTo(href, label) {
    if (!curtain) { window.location.href = href; return; }
    var lbl = curtain.querySelector(".curtain-label");
    if (lbl && label) lbl.textContent = label;
    if (lenis) lenis.stop();
    gsap.timeline({ onComplete: function () { window.location.href = href; } })
      .set(curtain, { visibility: "visible", yPercent: 100 })
      .set(curtain.querySelector(".curtain-bar i"), { scaleX: 0 })
      .to(curtain, { yPercent: 0, duration: 0.75, ease: "expo.inOut" })
      .to(curtain.querySelector(".curtain-bar i"), { scaleX: 0.7, duration: 0.3, ease: "power1.out" }, "-=0.2");
  }

  var PAGE_LABELS = {
    "index.html": "Sheet 01 · Home",
    "shop.html": "Sheet 02 · Shop",
    "free.html": "Sheet 03 · Free",
    "mentorship.html": "Sheet 04 · Mentorship",
    "notes.html": "Sheet 05 · Notes",
    "shop-launch.html": "Sheet 02 · Shop",
    "product.html": "Sheet 02 · Product"
  };

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target && a.target !== "_self") return;
    var url = new URL(a.getAttribute("href"), window.location.href);
    if (url.origin !== window.location.origin) return;
    if (!/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === window.location.pathname) return; // same page (hash links handled above)
    e.preventDefault();
    var file = url.pathname.split("/").pop() || "index.html";
    leaveTo(url.href, PAGE_LABELS[file] || "Next sheet");
  });

  // Coming back with the browser's back button restores a cached page: reset it.
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && curtain) {
      gsap.set(curtain, { yPercent: -100, visibility: "hidden" });
      if (lenis) lenis.start();
    }
  });

  /* -------------------------------------------------------------- Sheets */
  // Every top-level section becomes a sheet of paper or blueprint. As the next
  // sheet slides up, the current one sinks back, so sections hand over to each
  // other instead of simply scrolling past.
  var root = document.querySelector("body > div:not(.curtain):not(.thread)");
  function setupSheets() {
    if (!root) return;
    var kids = Array.prototype.slice.call(root.children);
    var sheets = [];
    var pendingEdge = null;

    kids.forEach(function (el) {
      var tag = el.tagName.toLowerCase();
      if (tag === "header") return;
      if (tag === "svg" && el.querySelector("path")) {
        // Torn edge between two sheets: it becomes the top edge of the NEXT sheet.
        var path = el.querySelector("path");
        var d = path.getAttribute("d");
        if (/^M0 0 /.test(d)) {
          // blueprint hanging down onto paper: flip it into paper teeth pointing up
          path.setAttribute("d", d.replace(/^M0 0 /, "M0 40 ").replace(/L1440 0 Z$/, "L1440 40 Z"));
          path.setAttribute("fill", "#FBF8F1");
        }
        el.classList.add("torn-edge");
        el.setAttribute("preserveAspectRatio", "none");
        pendingEdge = el;
        return;
      }
      if (tag === "section" || tag === "footer") {
        sheets.push(el);
        if (pendingEdge) { el.insertBefore(pendingEdge, el.firstChild); pendingEdge = null; }
      }
    });

    var rootStyle = getComputedStyle(root);
    sheets.forEach(function (el, i) {
      el.setAttribute("data-sheet", "");
      el.style.zIndex = String(i + 1);
      var cs = getComputedStyle(el);
      if ((cs.backgroundColor === "rgba(0, 0, 0, 0)" || cs.backgroundColor === "transparent") && cs.backgroundImage === "none") {
        // A see-through section borrows the page's own paper or blueprint, so it can cover the sheet below.
        el.style.backgroundColor = rootStyle.backgroundColor;
        el.style.backgroundImage = rootStyle.backgroundImage;
        el.style.backgroundSize = rootStyle.backgroundSize;
      }
      var shade = document.createElement("div");
      shade.className = "sheet-shade";
      shade.setAttribute("aria-hidden", "true");
      el.appendChild(shade);
    });

    // Full-width sections need to span the page for the paper to read as a sheet.
    sheets.forEach(function (el) {
      if (el.style.maxWidth) {
        el.style.maxWidth = "none";
        var pad = getComputedStyle(el);
        el.style.paddingLeft = "max(" + pad.paddingLeft + ", calc((100% - 1200px) / 2 + " + pad.paddingLeft + "))";
        el.style.paddingRight = "max(" + pad.paddingRight + ", calc((100% - 1200px) / 2 + " + pad.paddingRight + "))";
      }
    });

    // The gaps between sheets show a darker "desk" underneath.
    var rootBg = rootStyle.backgroundColor.match(/\d+/g) || [255, 255, 255];
    var dark = (Number(rootBg[0]) + Number(rootBg[1]) + Number(rootBg[2])) / 3 < 110;
    root.style.background = dark ? "#06182E" : "#E2D9C6";

    sheets.forEach(function (el, i) {
      var next = sheets[i + 1];
      if (!next || el.classList.contains("scene")) return;
      // Absolute scroll positions, so a short sheet that already shares the first
      // screen with the next one starts flat instead of half-sunk.
      var startAt = function () { return Math.max(next.offsetTop - window.innerHeight, 0) + 40; };
      var endAt = function () { return Math.max(next.offsetTop - window.innerHeight * 0.15, startAt() + 320); };
      gsap.timeline({
        scrollTrigger: { start: startAt, end: endAt, scrub: SCRUB, invalidateOnRefresh: true }
      })
        .to(el, { scale: isPhone ? 0.97 : 0.93, yPercent: -2, borderRadius: 18, ease: "none" }, 0)
        .to(el.querySelector(":scope > .sheet-shade"), { opacity: 0.45, ease: "none" }, 0);
    });
  }

  /* ---------------------------------------------------- Scroll progress */
  function setupProgress() {
    var bar = document.querySelector(".progress");
    if (bar) {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, ease: "none", transformOrigin: "left",
        scrollTrigger: { start: 0, end: "max", scrub: 0.4 }
      });
    }
    var thread = document.querySelector(".thread");
    if (thread) {
      var line = thread.querySelector(".thread-line");
      var tip = thread.querySelector(".thread-tip");
      gsap.to(line, { scaleY: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: SCRUB } });
      gsap.to(tip, { top: "100%", ease: "none", scrollTrigger: { start: 0, end: "max", scrub: SCRUB } });
    }
  }

  /* ------------------------------------------------------ Hero entrance */
  function heroIntro() {
    var hero = root && (root.querySelector("#top") || root.querySelector(":scope > section"));
    if (!hero) return;
    var items = hero.querySelectorAll("h1 ~ *, .parallax");
    var lines = hero.querySelector("h1") ? [hero.querySelector("h1")] : [];
    var tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.1 } });
    if (lines.length) tl.from(lines, { yPercent: 40, opacity: 0, filter: "blur(10px)" }, 0);
    tl.from(Array.prototype.slice.call(items).filter(function (n) { return n.tagName !== "H1"; }),
      { y: 30, opacity: 0, stagger: 0.07, duration: 0.9 }, 0.15);
  }

  /* ----------------------------------------------------- Hero → scene */
  function setupHero() {
    var hero = document.querySelector("#top");
    var par = document.querySelector(".parallax");
    if (hero && par) {
      gsap.to(par, {
        y: -140, scale: 1.08, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: SCRUB }
      });
    }
  }

  /* ----------------------------------------------- Pinned cinematic scene */
  function setupScene() {
    var scene = document.querySelector(".scene");
    if (!scene) return;
    var q = function (s) { return scene.querySelector(s); };
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: scene, start: "top 75%", end: "bottom bottom", scrub: 1.4 }
    });
    var title = q(".sc-title"), grid = q(".sc-grid"), mascot = q(".sc-mascot");
    var kickers = scene.querySelectorAll(".sc-kicker");
    var bars = scene.querySelectorAll(".bar-top, .bar-bottom");
    var dims = scene.querySelectorAll(".sc-dim line, .sc-dim path, .sc-dim circle");

    dims.forEach(function (d) {
      var len = (d.getTotalLength && d.getTotalLength()) || 900;
      gsap.set(d, { strokeDasharray: len, strokeDashoffset: len });
    });

    tl.fromTo(grid, { scale: 1.25, opacity: 0.3, filter: "blur(6px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 2 }, 0)
      .fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: "power2.out" }, 0.4)
      .to(q(".sc-paper"), { x: -700, y: -480, rotate: -35, scale: 0.6, opacity: 0, duration: 3, ease: "power2.in" }, 0.4)
      .to(q(".sc-paper2"), { x: 700, y: -440, rotate: 30, scale: 0.6, opacity: 0, duration: 3, ease: "power2.in" }, 0.4)
      .fromTo(kickers, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: "power2.out" }, 1)
      .fromTo(title, { scale: 0.45, opacity: 0, letterSpacing: "0.4em", filter: "blur(10px)" },
        { scale: 1, opacity: 1, letterSpacing: "-0.02em", filter: "blur(0px)", duration: 2.5, ease: "power3.out" }, 1)
      .to(dims, { strokeDashoffset: 0, duration: 3, stagger: 0.2, ease: "power1.inOut" }, 1.2)
      .fromTo(mascot, { y: 140, scale: 0.55, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 2, ease: "back.out(1.4)" }, 2)
      .to(kickers, { y: -30, opacity: 0, duration: 1.2 }, 5)
      .to(mascot, { y: -80, scale: 3, opacity: 0, duration: 2, ease: "power2.in" }, 5.5)
      .to(title, { scale: 1.7, duration: 1.5 }, 4.5)
      .to(title, { scale: 26, filter: "blur(4px)", duration: 2.2, ease: "power3.in" }, 6)
      .to(title, { opacity: 0, duration: 1, ease: "power1.in" }, 6.3)
      .to(grid, { scale: 1.6, opacity: 0.6, duration: 2.2, ease: "power2.in" }, 6)
      .to(bars, { scaleY: 0, duration: 1.2, ease: "power2.in" }, 7.2);
  }

  /* --------------------------------------------- Reveals inside sections */
  function siblingIndex(el, cls) {
    var parent = el.parentElement, n = 0;
    if (!parent) return 0;
    for (var i = 0; i < parent.children.length; i++) {
      var c = parent.children[i];
      if (c === el) return n;
      if (c.classList.contains(cls)) n++;
    }
    return 0;
  }

  // Anything already on the first screen gets a short one-time entrance instead of
  // a scroll-linked one, so the page is never half-revealed at rest.
  function onFirstScreen(el) { return el.getBoundingClientRect().top < window.innerHeight * 0.92; }
  function introOnce(el, from, to, i) {
    var t = {}; Object.keys(to).forEach(function (k) { t[k] = to[k]; });
    t.duration = 0.9; t.delay = 0.35 + (i || 0) * 0.08; t.ease = "expo.out";
    gsap.fromTo(el, from, t);
  }

  function reveal(selector, from, toExtra) {
    gsap.utils.toArray(selector).forEach(function (el) {
      var cls = selector.replace(".", "");
      var i = siblingIndex(el, cls);
      if (onFirstScreen(el)) { el.style.animation = "none"; introOnce(el, from, toExtra, i); return; }
      var to = { ease: "power2.out", scrollTrigger: {
        trigger: el, start: "top " + (96 - i * 5) + "%", end: "top " + (62 - i * 3) + "%", scrub: SCRUB
      } };
      Object.keys(toExtra || {}).forEach(function (k) { to[k] = toExtra[k]; });
      el.style.animation = "none";
      gsap.fromTo(el, from, to);
    });
  }

  function setupReveals() {
    reveal(".zoom-in", { opacity: 0, scale: 0.86, y: 50, filter: "blur(8px)" }, { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" });
    reveal(".tilt-in", { opacity: 0, rotateX: 28, scale: 0.86, y: 90, transformPerspective: 1200, transformOrigin: "50% 100%" },
      { opacity: 1, rotateX: 0, scale: 1, y: 0 });
    reveal(".big-in", { opacity: 0, scale: 0.7, letterSpacing: "0.2em" }, { opacity: 1, scale: 1, letterSpacing: "-0.02em" });

    gsap.utils.toArray(".pin-in").forEach(function (el) {
      el.style.animation = "none";
      if (onFirstScreen(el)) { introOnce(el, { opacity: 0, y: -60, rotate: -10 }, { opacity: 1, y: 0, rotate: -2 }); return; }
      gsap.fromTo(el, { opacity: 0, y: -120, rotate: -18, scale: 1.25 }, {
        opacity: 1, y: 0, rotate: -2, scale: 1, ease: "back.out(1.6)",
        scrollTrigger: { trigger: el, start: "top 95%", end: "top 60%", scrub: SCRUB }
      });
    });

    gsap.utils.toArray(".drop-in").forEach(function (el) {
      var r = parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0;
      var i = siblingIndex(el, "drop-in");
      el.style.animation = "none";
      if (onFirstScreen(el)) { introOnce(el, { opacity: 0, y: -60, rotate: r - 10 }, { opacity: 1, y: 0, rotate: r }, i); return; }
      gsap.fromTo(el, { opacity: 0, y: -110, rotate: r - 16, scale: 1.15 }, {
        opacity: 1, y: 0, rotate: r, scale: 1, ease: "back.out(1.4)",
        scrollTrigger: { trigger: el, start: "top " + (100 - i * 6) + "%", end: "top " + (66 - i * 4) + "%", scrub: SCRUB }
      });
    });

    gsap.utils.toArray(".line-grow").forEach(function (el) {
      el.style.animation = "none";
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, ease: "none", transformOrigin: "left",
        scrollTrigger: { trigger: el, start: "top 85%", end: "top 30%", scrub: SCRUB }
      });
    });
  }

  /* ----------------------------------------------------------------- Go */
  function start() {
    setupSheets();
    setupProgress();
    setupHero();
    setupScene();
    setupReveals();
    ScrollTrigger.refresh();
    enterPage();
    heroIntro();
  }

  if (document.fonts && document.fonts.ready) {
    // Measure after webfonts load so trigger positions are right; never wait long.
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 450); })]).then(start);
  } else {
    start();
  }
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
