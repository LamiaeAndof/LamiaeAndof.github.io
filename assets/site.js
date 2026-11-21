/* Portfolio Lamiae Andof — interactions et animations.
   Le contenu reste visible sans JavaScript : les états cachés ne sont posés qu'ici. */
(function () {
  "use strict";
  var racine = document.documentElement;
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finPointeur = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  if (G && ST) G.registerPlugin(ST);
  var anime = !!(G && ST) && !reduit;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function lang() { return racine.lang === "en" ? "en" : "fr"; }
  function nombre(x, dec) { return x.toLocaleString(lang() === "fr" ? "fr-FR" : "en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  function rafraichir() { if (ST) ST.refresh(); }
  function memoriser(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ================= Langue =================
  function appliquerLangue(l, init) {
    racine.lang = l;
    $$(".langue").forEach(function (b) {
      b.querySelector(".txt-l").textContent = l === "fr" ? "EN" : "FR";
      b.setAttribute("aria-label", l === "fr" ? "Switch to English" : "Passer en français");
    });
    memoriser("langue", l);
    document.dispatchEvent(new CustomEvent("langue"));
    if (!init) rafraichir();
  }
  appliquerLangue(lang(), true);
  $$(".langue").forEach(function (b) { b.addEventListener("click", function () { appliquerLangue(lang() === "fr" ? "en" : "fr"); }); });

  // ================= Thème sombre / clair =================
  function majBoutonTheme() {
    var clair = racine.getAttribute("data-theme") === "light";
    $$(".theme").forEach(function (b) {
      b.setAttribute("aria-pressed", clair ? "true" : "false");
      b.setAttribute("aria-label", lang() === "fr" ? (clair ? "Passer au thème sombre" : "Passer au thème clair") : (clair ? "Switch to dark theme" : "Switch to light theme"));
    });
  }
  majBoutonTheme();
  document.addEventListener("langue", majBoutonTheme);
  $$(".theme").forEach(function (b) {
    b.addEventListener("click", function () {
      var clair = racine.getAttribute("data-theme") !== "light";
      if (!reduit) { racine.classList.add("transition-theme"); setTimeout(function () { racine.classList.remove("transition-theme"); }, 500); }
      racine.setAttribute("data-theme", clair ? "light" : "dark");
      memoriser("theme", clair ? "light" : "dark");
      var mc = $('meta[name="theme-color"]'); if (mc) mc.setAttribute("content", clair ? "#f5f7fc" : "#05070d");
      majBoutonTheme();
      document.dispatchEvent(new CustomEvent("theme"));
    });
  });

  // ================= Défilement doux (Lenis) et ancres =================
  var lenis = null;
  var hautNav = function () { var n = $(".nav"); return n ? n.offsetHeight : 0; };
  if (anime && window.Lenis && finPointeur) {   // défilement doux : souris et pavés tactiles seulement ; natif au doigt
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  function allerA(cible) {
    if (lenis) lenis.scrollTo(cible, { offset: -hautNav() + 2 });
    else window.scrollTo({ top: cible.getBoundingClientRect().top + scrollY - hautNav() + 2, behavior: reduit ? "auto" : "smooth" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    var cible = document.getElementById(a.getAttribute("href").slice(1));
    if (!cible) return;
    e.preventDefault();
    fermerMenu();
    allerA(cible);
    if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
    if (a.classList.contains("evitement")) { cible.setAttribute("tabindex", "-1"); cible.focus({ preventScroll: true }); }
  });

  // Barre de progression, en-tête opaque et lien actif
  var barre = $(".progression"), nav = $(".nav");
  var liens = $$(".chapitres a, .menu-mobile a");
  function majDefilement() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (barre) barre.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    if (nav) nav.classList.toggle("solide", scrollY > 30);
    var actif = null;
    liens.forEach(function (a) {
      var s = document.getElementById((a.getAttribute("href") || "").split("#")[1] || "");
      if (s && s.getBoundingClientRect().top < innerHeight * 0.35) actif = a.getAttribute("href");
    });
    liens.forEach(function (a) {
      var on = a.getAttribute("href") === actif;
      a.classList.toggle("actif", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  addEventListener("scroll", majDefilement, { passive: true });
  majDefilement();

  // Menu mobile
  var burger = $(".burger"), menu = $(".menu-mobile");
  function fermerMenu() { if (menu && !menu.hidden) { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); } }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var ouvrir = menu.hidden;
      menu.hidden = !ouvrir;
      burger.setAttribute("aria-expanded", ouvrir ? "true" : "false");
      if (ouvrir) { var p = menu.querySelector("a"); if (p) p.focus(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { fermerMenu(); burger.focus(); } });
    document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target) && !burger.contains(e.target)) fermerMenu(); });
  }

  // ================= Titres révélés mot par mot =================
  function mot(texte, classe) {
    var w = document.createElement("span"); w.className = "mot";
    var i = document.createElement("span"); if (classe) i.className = classe; i.textContent = texte; w.appendChild(i); return w;
  }
  function decouper(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (m) { if (!m) return; f.appendChild(/^\s+$/.test(m) ? document.createTextNode(" ") : mot(m)); });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && (n.classList.contains("fr") || n.classList.contains("en"))) {
        decouper(n);
      } else if (n.nodeType === 1 && n.classList.contains("grad")) {
        var f2 = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (m) { if (!m) return; f2.appendChild(/^\s+$/.test(m) ? document.createTextNode(" ") : mot(m, "grad")); });
        n.replaceWith(f2);
      }
    });
  }
  $$("[data-mots]").forEach(function (el) {
    var etiquette = el.textContent.replace(/\s+/g, " ").trim();
    decouper(el);
    if (!anime) return;
    G.from(el.querySelectorAll(".mot > span"), { yPercent: 110, duration: 0.85, ease: "power4.out", stagger: 0.04, scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  // ================= Apparitions, séries, parallaxe =================
  if (anime) {
    $$(".apparait").forEach(function (el) { G.from(el, { y: 36, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }); });
    $$("[data-serie]").forEach(function (g) {
      G.from(g.children, { y: 50, opacity: 0, rotateX: -10, duration: 0.85, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: g, start: "top 85%" } });
    });
    $$("[data-parallaxe]").forEach(function (el) {
      var v = parseFloat(el.getAttribute("data-parallaxe"));
      G.fromTo(el, { yPercent: -v * 100 }, { yPercent: v * 100, ease: "none", scrollTrigger: { trigger: el.closest("figure") || el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // Entrée de l'accueil : rapide, pour ne pas retarder l'affichage du contenu
    G.from(".accueil h1 + .specialites, .accueil .accroche, .accueil .accroche-2, .accueil .boutons", { y: 22, opacity: 0, duration: 0.6, stagger: 0.08, delay: 0.1, ease: "power3.out" });
    G.from(".photo-halo", { scale: 0.94, duration: 1.1, ease: "power3.out" });
    G.to(".photo-halo img", { y: -8, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  // ================= Compteurs =================
  $$("[data-compteur]").forEach(function (el) {
    var fin = parseFloat(el.getAttribute("data-compteur")), dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var etat = { v: anime ? 0 : fin };
    function rendre() { el.textContent = nombre(etat.v, dec); }
    rendre();
    if (anime) G.to(etat, { v: fin, duration: 1.8, ease: "power2.out", onUpdate: rendre, scrollTrigger: { trigger: el, start: "top 94%" } });
    document.addEventListener("langue", rendre);
  });

  // ================= Graphique des notes =================
  var courbe = $("#courbe-notes");
  if (courbe && anime) {
    var long = courbe.getTotalLength();
    G.set(courbe, { strokeDasharray: long, strokeDashoffset: long });
    var tl = G.timeline({ scrollTrigger: { trigger: "#notes", start: "top 78%", end: "bottom 60%", scrub: 1 } });
    tl.to(courbe, { strokeDashoffset: 0, ease: "none", duration: 3 }).from("#notes .aire", { opacity: 0, duration: 1 }, 0.6);
    $$("#notes .point").forEach(function (p, i) { tl.from(p, { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.5 }, i * 1.2); });
  }

  // ================= Chapitre 4 : frise verticale (fil lumineux + étapes allumées) =================
  (function chrono() {
    var bloc = $(".chrono"), fil = $(".chrono .fil span"), etapes = $$(".etape-c");
    if (!bloc || !fil) return;
    var attente = false;
    function maj() {
      attente = false;
      var r = bloc.getBoundingClientRect(), repere = innerHeight * 0.6;
      var p = Math.max(0, Math.min(1, (repere - r.top) / r.height));
      fil.style.setProperty("--p", p.toFixed(4));
      etapes.forEach(function (e) {
        var n = e.querySelector(".noeud").getBoundingClientRect();
        e.classList.toggle("allume", n.top + n.height / 2 < repere);
      });
    }
    addEventListener("scroll", function () { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });
    addEventListener("resize", maj); maj();
    if (anime) {
      etapes.forEach(function (e, i) {
        var t = e.querySelector(".texte-c"), m = e.querySelector(".media-c"), sens = i % 2 ? 1 : -1;
        G.from(t, { x: 40 * sens, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 80%" } });
        G.from(m, { x: -40 * sens, y: 20, scale: 0.96, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 80%" } });
      });
    }
  })();

  // ================= Curseur personnalisé + inclinaison des cartes =================
  if (finPointeur && !reduit && G) {
    var point = $(".curseur"), anneau = $(".anneau");
    var px = G.quickTo(point, "x", { duration: 0.08 }), py = G.quickTo(point, "y", { duration: 0.08 });
    var ax = G.quickTo(anneau, "x", { duration: 0.4, ease: "power3" }), ay = G.quickTo(anneau, "y", { duration: 0.4, ease: "power3" });
    addEventListener("mousemove", function (e) { racine.classList.add("curseur-actif"); px(e.clientX); py(e.clientY); ax(e.clientX); ay(e.clientY); });
    document.addEventListener("mouseleave", function () { racine.classList.remove("curseur-actif"); });
    document.addEventListener("mouseover", function (e) { anneau.classList.toggle("survol", !!e.target.closest("a, button, input, summary, [data-tilt]")); });
    $$("[data-tilt]").forEach(function (c) {
      var l = document.createElement("span"); l.className = "lueur"; l.setAttribute("aria-hidden", "true"); c.appendChild(l);
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
        G.to(c, { rotateY: (x - 0.5) * 6, rotateX: (0.5 - y) * 6, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      });
      c.addEventListener("mouseleave", function () { G.to(c, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out" }); });
    });
  }

  // ================= Expériences : « Explorer la mission » =================
  $$(".explorer").forEach(function (b) {
    var p = document.getElementById(b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      var ouvert = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", ouvert ? "true" : "false");
      p.classList.toggle("ouvert", ouvert);
      p.setAttribute("aria-hidden", ouvert ? "false" : "true");
      setTimeout(rafraichir, 480);
    });
  });

  // ================= Carrousels (flèches, clavier, filtres) =================
  $$(".carrousel").forEach(function (c) {
    var rail = $(".rail", c), sec = c.closest("section") || document;
    var fl = $$('[data-rail="' + c.id + '"]', sec);
    function pas() { var k = rail.querySelector(":scope > :not([hidden])"); return k ? k.getBoundingClientRect().width + 18 : rail.clientWidth * 0.8; }
    function maj() {
      var m = rail.scrollWidth - rail.clientWidth;
      fl.forEach(function (b) { b.disabled = b.getAttribute("data-sens") === "1" ? rail.scrollLeft >= m - 4 : rail.scrollLeft <= 4; });
    }
    fl.forEach(function (b) { b.addEventListener("click", function () { rail.scrollBy({ left: (b.getAttribute("data-sens") === "1" ? 1 : -1) * pas(), behavior: reduit ? "auto" : "smooth" }); }); });
    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); rail.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * pas(), behavior: reduit ? "auto" : "smooth" }); }
    });
    rail.addEventListener("scroll", maj, { passive: true }); addEventListener("resize", maj); maj();
    $$("[data-filtre]", sec).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filtre");
        $$("[data-filtre]", sec).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$(":scope > [data-famille]", rail).forEach(function (k) { k.hidden = f !== "tout" && k.getAttribute("data-famille") !== f; });
        rail.scrollLeft = 0; maj();
      });
    });
  });

  // ================= Visionneuse accessible (dialog natif) =================
  var vis = $("#visionneuse");
  function ouvrirVisionneuse(src, alt, legende, pdf) {
    if (!vis || !vis.showModal) { window.open(pdf || src, "_blank", "noopener"); return; }
    $("img", vis).src = src; $("img", vis).alt = alt || "";
    $(".texte p", vis).textContent = legende || "";
    var lien = $(".texte a", vis); lien.hidden = !pdf; if (pdf) lien.href = pdf;
    vis.showModal(); if (lenis) lenis.stop();
  }
  if (vis) {
    vis.addEventListener("close", function () { if (lenis) lenis.start(); });
    vis.addEventListener("click", function (e) { if (e.target === vis) vis.close(); });
    $(".fermer", vis).addEventListener("click", function () { vis.close(); });
  }
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-agrandir]");
    if (!d) return;
    e.preventDefault();
    var img = d.querySelector("img") || d;
    var leg = d.getAttribute("data-legende-" + lang()) || img.alt;
    ouvrirVisionneuse(d.getAttribute("data-agrandir") || img.currentSrc || img.src, img.alt, leg, d.getAttribute("data-pdf"));
  });

  // Fiches détaillées (projets)
  $$("[data-fiche]").forEach(function (b) {
    var dlg = document.getElementById(b.getAttribute("data-fiche"));
    if (!dlg || !dlg.showModal) return;
    b.addEventListener("click", function () { dlg.showModal(); if (lenis) lenis.stop(); });
    dlg.addEventListener("close", function () { if (lenis) lenis.start(); b.focus({ preventScroll: true }); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    $(".fermer", dlg).addEventListener("click", function () { dlg.close(); });
  });

  // Certificats : tous / sélection
  var plusC = $("#tous-certifs");
  if (plusC) plusC.addEventListener("click", function () {
    var ouvrir = plusC.getAttribute("aria-expanded") !== "true";
    plusC.setAttribute("aria-expanded", ouvrir ? "true" : "false");
    $$(".certif-extra").forEach(function (x) { x.hidden = !ouvrir; });
    rafraichir();
  });

  // Bandeau de logos : pause au toucher
  var band = $(".bandeau");
  if (band) band.addEventListener("click", function () { band.classList.toggle("pause"); });

  // ================= Fond animé : réseau lumineux =================
  (function reseau() {
    var cv = $("#reseau");
    if (!cv) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 1.5), W, H, pts = [], souris = { x: -999, y: -999 }, raf = null, ca, cb, al;
    function couleurs() { var s = getComputedStyle(racine); ca = s.getPropertyValue("--reseau-a").trim(); cb = s.getPropertyValue("--reseau-b").trim(); al = parseFloat(s.getPropertyValue("--reseau-p")) || 0.3; }
    function init() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(W < 700 ? 34 : 72, (W * H) / 18000)); pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: Math.random() * 1.5 + 0.7 });
    }
    function dessiner() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        if (!reduit) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) { ctx.strokeStyle = "rgba(" + (j % 2 ? ca : cb) + "," + (1 - d / 140) * al + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        var dm = Math.hypot(a.x - souris.x, a.y - souris.y);
        if (dm < 170) { ctx.strokeStyle = "rgba(" + cb + "," + (1 - dm / 170) * al * 1.4 + ")"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(souris.x, souris.y); ctx.stroke(); }
        ctx.fillStyle = "rgba(" + (i % 3 ? cb : ca) + "," + Math.min(1, al * 2.4) + ")"; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function boucle() { dessiner(); raf = requestAnimationFrame(boucle); }
    couleurs(); init();
    document.addEventListener("theme", function () { couleurs(); dessiner(); });
    addEventListener("resize", function () { init(); dessiner(); });
    cv.parentElement.addEventListener("mousemove", function (e) { var r = cv.getBoundingClientRect(); souris.x = e.clientX - r.left; souris.y = e.clientY - r.top; });
    // Démarrage après le chargement de la page, pour laisser la priorité au contenu
    function lancer() {
      dessiner();
      if (reduit) return;
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && !raf) boucle(); else if (!e[0].isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
      }).observe(cv);
    }
    if (document.readyState === "complete") setTimeout(lancer, 300); else addEventListener("load", function () { setTimeout(lancer, 300); });
    if (reduit) return;
    document.addEventListener("visibilitychange", function () { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; } });
  })();

  // ================= Scène 3D (three.js chargé à l'approche) =================
  (function scene3d() {
    var boite = $("#scene3d"), canvas = $("#canvas3d");
    if (!boite || !canvas) return;
    function webgl() { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } }
    if (!webgl()) return;
    var charge = false;
    new IntersectionObserver(function (e, obs) {
      if (!e[0].isIntersecting || charge) return;
      charge = true; obs.disconnect();
      if (window.THREE) return demarrer3d();
      var s = document.createElement("script"); s.src = "vendor/three.min.js"; s.onload = demarrer3d; document.head.appendChild(s);
    }, { rootMargin: "700px 0px" }).observe(boite);
    function demarrer3d() {
      var T = window.THREE, rendu;
      try { rendu = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
      rendu.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0, 3.5);
      var groupe = new T.Group(); groupe.rotation.x = -0.18; scene.add(groupe);
      var geo = new T.PlaneGeometry(1.7, 1.7);
      var matR = new T.MeshBasicMaterial({ color: 0xffffff }), matC = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      var cam = new T.Mesh(geo, matC); cam.position.z = 0.004;
      var cadre = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.8 })); cadre.position.z = 0.006;
      var balai = new T.Mesh(new T.PlaneGeometry(1.74, 0.012), new T.MeshBasicMaterial({ color: 0x3ad7ff, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
      var halo = new T.Mesh(new T.PlaneGeometry(1.74, 0.16), new T.MeshBasicMaterial({ color: 0x7b6cff, transparent: true, opacity: 0.1, blending: T.AdditiveBlending, depthWrite: false }));
      balai.position.z = 0.01; halo.position.z = 0.009;
      groupe.add(new T.Mesh(geo, matR), cam, cadre, balai, halo);
      var n = 220, pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 3.4; pos[i * 3 + 1] = (Math.random() - 0.5) * 3.4; pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6 - 0.3; }
      var gp = new T.BufferGeometry(); gp.setAttribute("position", new T.BufferAttribute(pos, 3));
      var poussiere = new T.Points(gp, new T.PointsMaterial({ color: 0x8fb8ff, size: 0.012, transparent: true, opacity: 0.65, blending: T.AdditiveBlending, depthWrite: false }));
      scene.add(poussiere);
      var pret = 0, raf = null, visible = true, sx = 0, sy = 0;
      function dessiner(t) {
        if (pret < 2) return; t = t || 0;
        if (reduit) { groupe.rotation.y = -0.28; matC.opacity = 0.65; balai.visible = halo.visible = false; }
        else {
          groupe.rotation.y += ((Math.sin(t * 0.00022) * 0.4 + sx * 0.25) - groupe.rotation.y) * 0.06;
          groupe.rotation.x += ((-0.18 + sy * 0.15) - groupe.rotation.x) * 0.06;
          groupe.position.y = Math.sin(t * 0.0008) * 0.03;
          var yb = 0.85 - ((t * 0.00018) % 1) * 1.7; balai.position.y = halo.position.y = yb;
          matC.opacity = Math.min(0.95, Math.max(0, 0.5 - 0.5 * Math.cos(t * 0.00055)) * 1.05);
          poussiere.rotation.y = t * 0.00004;
        }
        rendu.render(scene, camera);
      }
      function boucle(t) { dessiner(t); raf = requestAnimationFrame(boucle); }
      function lancer() { if (!raf && !reduit && visible && !document.hidden) raf = requestAnimationFrame(boucle); }
      function arreter() { if (raf) cancelAnimationFrame(raf); raf = null; }
      function taille() { var w = boite.clientWidth, h = boite.clientHeight; rendu.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dessiner(0); }
      function ok() { pret++; if (pret === 2) { racine.classList.add("webgl"); taille(); dessiner(0); lancer(); } }
      var ch = new T.TextureLoader();
      ch.load("projet/xray.jpg", function (t) { matR.map = t; matR.needsUpdate = true; ok(); });
      ch.load("projet/gradcam.png", function (t) { matC.map = t; matC.needsUpdate = true; ok(); });
      taille();
      if (window.ResizeObserver) new ResizeObserver(taille).observe(boite);
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? lancer() : arreter(); }).observe(boite);
      document.addEventListener("visibilitychange", function () { document.hidden ? arreter() : lancer(); });
      boite.addEventListener("mousemove", function (e) { var r = boite.getBoundingClientRect(); sx = (e.clientX - r.left) / r.width - 0.5; sy = (e.clientY - r.top) / r.height - 0.5; });
      boite.addEventListener("mouseleave", function () { sx = sy = 0; });
    }
  })();

  // ================= Comparateur radiographie / Grad-CAM =================
  var CAS = {
    VP: { p: 1.0, pred: 1, vrai: 1,
      fr: ["Pneumonie détectée", "La zone chaude couvre le haut du poumon droit. Une électrode s'y trouve aussi : à la résolution de Grad-CAM (7×7), je ne peux pas dire lequel des deux a compté."],
      en: ["Pneumonia detected", "The hot area covers the upper right lung. An electrode sits there too: at Grad-CAM's resolution (7×7), I cannot tell which one mattered."] },
    VN: { p: 0.0, pred: 0, vrai: 0,
      fr: ["Normale reconnue", "Pour conclure « normal », la carte se porte sur le cœur et le cou plutôt que sur les poumons. C'est moins intuitif à lire."],
      en: ["Normal recognised", "To conclude \"normal\", the map focuses on the heart and neck rather than the lungs. It is harder to read."] },
    FP: { p: 1.0, pred: 1, vrai: 0,
      fr: ["Fausse alerte", "Une radio grise et peu contrastée. Mon hypothèse : ce voile ressemble à des opacités pour le modèle. Je ne peux pas le confirmer sans avis médical."],
      en: ["False alarm", "A grey, low-contrast X-ray. My hypothesis: the haze looks like opacities to the model. I cannot confirm it without a medical opinion."] },
    FN: { p: 0.006, pred: 0, vrai: 1,
      fr: ["Pneumonie manquée", "Pour un œil non médical, les poumons paraissent normaux, et la carte regarde le cou. Anomalie subtile ou étiquette discutable : seul un radiologue pourrait trancher."],
      en: ["Missed pneumonia", "To a non-medical eye the lungs look normal, and the map looks at the neck. Subtle anomaly or debatable label: only a radiologist could tell."] }
  };
  var aa = $("#aa"), casActif = "VP";
  function classe(c) { return c ? (lang() === "fr" ? "Pneumonie" : "Pneumonia") : (lang() === "fr" ? "Normale" : "Normal"); }
  function afficherCas(k) {
    if (!aa) return;
    casActif = k;
    var c = CAS[k], t = c[lang()], z = $(".lecture-cas");
    $(".avant", aa).src = "projet/cas/" + k + "_radio.jpg";
    $(".apres", aa).src = "projet/cas/" + k + "_cam.jpg";
    $$(".choix-cas button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-cas") === k ? "true" : "false"); });
    $("h4", z).textContent = t[0];
    $("#cas-pred", z).textContent = classe(c.pred) + " · P = " + nombre(c.p, 3);
    $("#cas-pred", z).classList.toggle("err", c.pred !== c.vrai);
    $("#cas-vrai", z).textContent = classe(c.vrai);
    $("p.obs", z).textContent = t[1];
    if (anime) G.fromTo(z, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45 });
  }
  if (aa) {
    var rg = $("input", aa);
    function poser(v) { v = Math.max(0, Math.min(100, v)); rg.value = v; aa.style.setProperty("--pos", v + "%"); }
    rg.addEventListener("input", function () { poser(parseFloat(rg.value)); });
    var tire = false;
    function depuis(e) { var r = aa.getBoundingClientRect(); poser((e.clientX - r.left) / r.width * 100); }
    aa.addEventListener("pointerdown", function (e) { tire = true; aa.setPointerCapture(e.pointerId); depuis(e); rg.focus({ preventScroll: true }); });
    aa.addEventListener("pointermove", function (e) { if (tire) depuis(e); });
    aa.addEventListener("pointerup", function () { tire = false; });
    aa.addEventListener("pointercancel", function () { tire = false; });
    poser(50);
    $$(".choix-cas button").forEach(function (b) { b.addEventListener("click", function () { afficherCas(b.getAttribute("data-cas")); }); });
    afficherCas("VP");
    document.addEventListener("langue", function () { afficherCas(casActif); });
  }

  // ================= Simulateur de seuil (vraies probabilités du test) =================
  (function labo() {
    var zone = $("#labo"), svg = $("#roc");
    if (!zone || !svg) return;
    var NS = "http://www.w3.org/2000/svg", etat = { m: "densenet121", s: 0.5 }, D, chemins = {}, pt, curseur = $("#seuil");
    var L = 380, H = 340, M = { g: 50, d: 14, h: 14, b: 46 };
    function X(v) { return M.g + v * (L - M.g - M.d); } function Y(v) { return H - M.b - v * (H - M.h - M.b); }
    function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
    function couleur(m) { var s = getComputedStyle(racine); return m === "densenet121" ? s.getPropertyValue("--cyan").trim() : s.getPropertyValue("--chaud").trim(); }
    function compter(m, s) {
      var vp = 0, fn = 0, vn = 0, fp = 0;
      for (var i = 0; i < D.label.length; i++) { var pos = D[m][i] >= s; if (D.label[i] === 1) { pos ? vp++ : fn++; } else { pos ? fp++ : vn++; } }
      return { vp: vp, fn: fn, vn: vn, fp: fp, sens: vp / (vp + fn), spec: vn / (vn + fp) };
    }
    function roc(m) {
      var idx = D[m].map(function (p, i) { return i; }).sort(function (a, b) { return D[m][b] - D[m][a]; });
      var P = D.label.filter(function (v) { return v === 1; }).length, N = D.label.length - P, vp = 0, fp = 0, out = [[0, 0]];
      for (var k = 0; k < idx.length; k++) { D.label[idx[k]] === 1 ? vp++ : fp++; if (k === idx.length - 1 || D[m][idx[k + 1]] !== D[m][idx[k]]) out.push([fp / N, vp / P]); }
      return out;
    }
    function texte(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
    function maj() {
      var r = compter(etat.m, etat.s);
      texte("val-seuil", nombre(etat.s, 3)); texte("l-fn", r.fn); texte("l-fp", r.fp); texte("l-sens", nombre(r.sens, 3)); texte("l-spec", nombre(r.spec, 3));
      texte("m-vn", r.vn); texte("m-fp", r.fp); texte("m-fn", r.fn); texte("m-vp", r.vp);
      ["baseline", "densenet121"].forEach(function (m) {
        chemins[m].setAttribute("stroke", couleur(m)); chemins[m].setAttribute("stroke-width", m === etat.m ? 3 : 1.5); chemins[m].setAttribute("opacity", m === etat.m ? 1 : 0.4);
      });
      pt.setAttribute("cx", X(1 - r.spec)); pt.setAttribute("cy", Y(r.sens)); pt.setAttribute("fill", couleur(etat.m));
      curseur.setAttribute("aria-valuetext", (lang() === "fr" ? "Seuil " : "Threshold ") + nombre(etat.s, 3) + " : " + r.fn + (lang() === "fr" ? " pneumonies manquées, " : " missed pneumonias, ") + r.fp + (lang() === "fr" ? " fausses alertes" : " false alarms"));
    }
    function regler(s) { etat.s = Math.min(0.999, Math.max(0.001, s)); curseur.value = etat.s; maj(); }
    fetch("projet/donnees_test.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      D = d;
      svg.setAttribute("viewBox", "0 0 " + L + " " + H);
      for (var t = 0; t <= 1.0001; t += 0.25) {
        el("line", { x1: X(t), x2: X(t), y1: Y(0), y2: Y(1), "class": "grille" }); el("line", { x1: X(0), x2: X(1), y1: Y(t), y2: Y(t), "class": "grille" });
        el("text", { x: X(t), y: H - M.b + 20, "text-anchor": "middle" }).textContent = String(t);
        el("text", { x: M.g - 8, y: Y(t) + 4, "text-anchor": "end" }).textContent = String(t);
      }
      el("line", { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), "class": "grille", "stroke-dasharray": "4 5" });
      var tx = el("text", { x: (X(0) + X(1)) / 2, y: H - 6, "text-anchor": "middle" });
      var ty = el("text", { x: 15, y: (Y(0) + Y(1)) / 2, "text-anchor": "middle", transform: "rotate(-90 15 " + (Y(0) + Y(1)) / 2 + ")" });
      ["baseline", "densenet121"].forEach(function (m) {
        chemins[m] = el("path", { d: roc(m).map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(""), fill: "none", "stroke-linejoin": "round" });
      });
      pt = el("circle", { r: 8, stroke: "#fff", "stroke-width": 3 });
      function etiq() { tx.textContent = lang() === "fr" ? "1 − spécificité (taux de fausses alertes)" : "1 − specificity (false-alarm rate)"; ty.textContent = lang() === "fr" ? "Sensibilité" : "Sensitivity"; maj(); }
      curseur.addEventListener("input", function () { etat.s = parseFloat(curseur.value); maj(); });
      $$("[data-modele]", zone).forEach(function (b) {
        b.addEventListener("click", function () { etat.m = b.getAttribute("data-modele"); $$("[data-modele]", zone).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); maj(); });
      });
      $$("[data-preset]", zone).forEach(function (b) {
        b.addEventListener("click", function () { var v = b.getAttribute("data-preset"); regler(v === "hs" ? D.seuils_haute_sensibilite[etat.m] : parseFloat(v)); });
      });
      document.addEventListener("langue", etiq); document.addEventListener("theme", maj);
      var att = $("#labo-etat"); if (att) att.hidden = true;
      regler(0.5); etiq();
    }).catch(function () { var att = $("#labo-etat"); if (att) { att.hidden = false; att.querySelector(".fr").textContent = "Les données du simulateur n'ont pas pu être chargées."; att.querySelector(".en").textContent = "The simulator data could not be loaded."; } });
  })();

  // ================= Le piège : distribution des formats (vraies données) =================
  (function forme() {
    var svg = $("#forme");
    if (!svg) return;
    var NS = "http://www.w3.org/2000/svg", L = 520, H = 300, M = { g: 20, d: 20, h: 30, b: 44 };
    fetch("projet/forme.json").then(function (r) { return r.json(); }).then(function (d) {
      svg.setAttribute("viewBox", "0 0 " + L + " " + H);
      var b = d.bins, x0 = b[0], x1 = b[b.length - 1], ymax = Math.max.apply(null, d.densites.NORMAL.concat(d.densites.PNEUMONIA)) * 1.12;
      function X(v) { return M.g + (v - x0) / (x1 - x0) * (L - M.g - M.d); } function Y(v) { return H - M.b - v / ymax * (H - M.h - M.b); }
      function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
      var defs = el("defs", {});
      [["gN", "--cyan"], ["gP", "--violet"]].forEach(function (g) {
        var lg = document.createElementNS(NS, "linearGradient"); lg.setAttribute("id", g[0]); lg.setAttribute("x1", 0); lg.setAttribute("x2", 0); lg.setAttribute("y1", 0); lg.setAttribute("y2", 1);
        lg.innerHTML = '<stop offset="0" stop-color="var(' + g[1] + ')" stop-opacity=".5"/><stop offset="1" stop-color="var(' + g[1] + ')" stop-opacity="0"/>'; defs.appendChild(lg);
      });
      el("line", { x1: M.g, x2: L - M.d, y1: Y(0), y2: Y(0), "class": "grille" });
      [1, 1.5, 2, 2.5].forEach(function (v) { el("line", { x1: X(v), x2: X(v), y1: Y(0), y2: Y(0) + 5, "class": "grille" }); el("text", { x: X(v), y: H - M.b + 20, "text-anchor": "middle" }).textContent = nombre(v, 1); });
      var aires = [], etiquettes = [];
      [["NORMAL", "--cyan", "gN"], ["PNEUMONIA", "--violet", "gP"]].forEach(function (c, k) {
        var pts = d.densites[c[0]].map(function (v, i) { return [X((b[i] + b[i + 1]) / 2), Y(v)]; });
        var ligne = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L");
        aires.push(el("path", { d: ligne + "L" + pts[pts.length - 1][0] + " " + Y(0) + "L" + pts[0][0] + " " + Y(0) + "Z", fill: "url(#" + c[2] + ")" }));
        var tr = el("path", { d: ligne, fill: "none", "stroke-width": 2.5, "stroke-linejoin": "round" }); tr.style.stroke = "var(" + c[1] + ")"; aires.push(tr);
        var med = d.mediane[c[0]];
        var ml = el("line", { x1: X(med), x2: X(med), y1: Y(0), y2: M.h - 4, "stroke-dasharray": "3 4", "stroke-width": 1.5 }); ml.style.stroke = "var(" + c[1] + ")";
        var t = el("text", { x: X(med) + (k ? 6 : -6), y: M.h + 8, "text-anchor": k ? "start" : "end" }); t.style.fill = "var(" + c[1] + ")"; t.style.fontWeight = "600";
        etiquettes.push([t, med]);
      });
      var ax = el("text", { x: L / 2, y: H - 6, "text-anchor": "middle" });
      function etiq() {
        ax.textContent = lang() === "fr" ? "rapport largeur / hauteur de l'image d'origine" : "width / height ratio of the original image";
        etiquettes.forEach(function (e) { e[0].textContent = (lang() === "fr" ? "médiane " : "median ") + nombre(e[1], 2); });
      }
      etiq(); document.addEventListener("langue", etiq);
      if (anime) G.from(aires, { scaleY: 0, transformOrigin: "50% 100%", duration: 1.3, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: svg, start: "top 82%" } });
    });
  })();

  addEventListener("load", rafraichir);
})();
