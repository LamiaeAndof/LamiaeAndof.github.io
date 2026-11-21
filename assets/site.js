/* Portfolio Lamiae Andof — animations et interactions.
   Tout le contenu est visible sans JavaScript ; les états cachés ne sont posés qu'ici. */
(function () {
  "use strict";
  var racine = document.documentElement;
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finPointeur = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  if (G && ST) G.registerPlugin(ST);
  var anime = !!(G && ST) && !reduit;

  // ================= Langue =================
  function lang() { return racine.lang === "en" ? "en" : "fr"; }
  function nombre(x, dec) {
    return x.toLocaleString(lang() === "fr" ? "fr-FR" : "en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  var l0 = "fr";
  try { l0 = localStorage.getItem("langue") || ((navigator.language || "fr").slice(0, 2) === "en" ? "en" : "fr"); } catch (e) {}
  function appliquerLangue(l) {
    racine.lang = l;
    document.querySelectorAll(".langue").forEach(function (b) {
      b.textContent = l === "fr" ? "EN" : "FR";
      b.setAttribute("aria-label", l === "fr" ? "Switch to English" : "Passer en français");
    });
    try { localStorage.setItem("langue", l); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langue"));
    if (ST) ST.refresh();
  }
  appliquerLangue(l0 === "en" ? "en" : "fr");
  document.querySelectorAll(".langue").forEach(function (b) {
    b.addEventListener("click", function () { appliquerLangue(lang() === "fr" ? "en" : "fr"); });
  });

  // ================= Défilement doux (Lenis) =================
  var lenis = null;
  if (anime && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var cible = document.querySelector(a.getAttribute("href"));
      if (!cible) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(cible, { offset: -10 }); else cible.scrollIntoView({ behavior: reduit ? "auto" : "smooth" });
    });
  });

  // Barre de progression + chapitre actif
  var barre = document.querySelector(".progression");
  var liensChap = Array.prototype.slice.call(document.querySelectorAll(".chapitres a"));
  function majDefilement() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (barre) barre.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    var actif = null;
    liensChap.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s && s.getBoundingClientRect().top < innerHeight * 0.4) actif = a;
    });
    liensChap.forEach(function (a) { a.classList.toggle("actif", a === actif); });
  }
  addEventListener("scroll", majDefilement, { passive: true });
  majDefilement();

  // ================= Texte mot par mot =================
  function decouper(el) {
    var noeuds = Array.prototype.slice.call(el.childNodes);
    noeuds.forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (m) {
          if (!m) return;
          if (/^\s+$/.test(m)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span"); w.className = "mot";
          var i = document.createElement("span"); i.textContent = m; w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && (n.classList.contains("fr") || n.classList.contains("en"))) {
        decouper(n);
      } else if (n.nodeType === 1 && n.classList.contains("grad")) {
        // Texte en dégradé : découpé mot par mot, chaque mot garde le dégradé
        var f2 = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (m) {
          if (!m) return;
          if (/^\s+$/.test(m)) { f2.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span"); w.className = "mot";
          var i = document.createElement("span"); i.className = "grad"; i.textContent = m; w.appendChild(i); f2.appendChild(w);
        });
        n.replaceWith(f2);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        var w2 = document.createElement("span"); w2.className = "mot";
        n.replaceWith(w2); var i2 = document.createElement("span"); i2.appendChild(n); w2.appendChild(i2);
      }
    });
  }
  document.querySelectorAll("[data-mots]").forEach(function (el) {
    decouper(el);
    if (!anime) return;
    G.from(el.querySelectorAll(".mot > span"), {
      yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  // ================= Apparitions =================
  if (anime) {
    G.utils.toArray(".apparait").forEach(function (el) {
      G.from(el, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    G.utils.toArray("[data-serie]").forEach(function (groupe) {
      G.from(groupe.children, { y: 60, opacity: 0, rotateX: -12, duration: 0.9, ease: "power3.out", stagger: 0.14,
        scrollTrigger: { trigger: groupe, start: "top 82%" } });
    });
    G.utils.toArray("[data-parallaxe]").forEach(function (el) {
      var v = parseFloat(el.getAttribute("data-parallaxe"));
      G.fromTo(el, { yPercent: -v * 100 }, { yPercent: v * 100, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // Accueil : entrée
    G.from(".photo-halo", { scale: 0.85, opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.2 });
    G.from(".accueil .accroche, .accueil .boutons", { y: 30, opacity: 0, duration: 1, stagger: 0.15, delay: 0.6, ease: "power3.out" });
  }

  // ================= Compteurs =================
  function rendreCompteur(el, v) {
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    el.textContent = (el.getAttribute("data-avant") || "") + nombre(v, dec) + (el.getAttribute("data-apres") || "");
  }
  document.querySelectorAll("[data-compteur]").forEach(function (el) {
    var fin = parseFloat(el.getAttribute("data-compteur"));
    var etat = { v: anime ? 0 : fin };
    rendreCompteur(el, etat.v);
    if (anime) {
      G.to(etat, { v: fin, duration: 2, ease: "power2.out", onUpdate: function () { rendreCompteur(el, etat.v); },
        scrollTrigger: { trigger: el, start: "top 92%" } });
    }
    document.addEventListener("langue", function () { rendreCompteur(el, etat.v); });
  });

  // ================= Graphique des notes =================
  var courbe = document.getElementById("courbe-notes");
  if (courbe && anime) {
    var long = courbe.getTotalLength();
    G.set(courbe, { strokeDasharray: long, strokeDashoffset: long });
    var tl = G.timeline({ scrollTrigger: { trigger: "#notes", start: "top 75%", end: "bottom 55%", scrub: 1 } });
    tl.to(courbe, { strokeDashoffset: 0, ease: "none", duration: 3 })
      .from("#notes .aire", { opacity: 0, duration: 1 }, 0.6);
    document.querySelectorAll("#notes .point").forEach(function (p, i) {
      tl.from(p, { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.5 }, i * 1.2);
    });
  }

  // ================= Défilement horizontal (chapitre 4) =================
  if (anime) {
    var mm = G.matchMedia();
    mm.add("(min-width: 861px)", function () {
      var piste = document.querySelector(".piste-h");
      if (!piste) return;
      var distance = function () { return piste.scrollWidth - innerWidth; };
      G.to(piste, { x: function () { return -distance(); }, ease: "none",
        scrollTrigger: { trigger: ".horizontal", start: "top top", end: function () { return "+=" + distance(); },
                         pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    });
  }

  // ================= Curseur personnalisé =================
  if (finPointeur && !reduit && G) {
    var point = document.querySelector(".curseur"), anneau = document.querySelector(".anneau");
    var px = G.quickTo(point, "x", { duration: 0.08 }), py = G.quickTo(point, "y", { duration: 0.08 });
    var ax = G.quickTo(anneau, "x", { duration: 0.4, ease: "power3" }), ay = G.quickTo(anneau, "y", { duration: 0.4, ease: "power3" });
    addEventListener("mousemove", function (e) { racine.classList.add("curseur-actif"); px(e.clientX); py(e.clientY); ax(e.clientX); ay(e.clientY); });
    document.addEventListener("mouseleave", function () { racine.classList.remove("curseur-actif"); });
    document.addEventListener("mouseover", function (e) {
      anneau.classList.toggle("survol", !!e.target.closest("a, button, input, summary, [data-tilt], [data-zoom] img"));
    });
  }

  // ================= Inclinaison 3D légère des cartes =================
  if (finPointeur && !reduit && G) {
    document.querySelectorAll("[data-tilt]").forEach(function (c) {
      var lueur = document.createElement("span"); lueur.className = "lueur"; c.appendChild(lueur);
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
        G.to(c, { rotateY: (x - 0.5) * 8, rotateX: (0.5 - y) * 8, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      });
      c.addEventListener("mouseleave", function () { G.to(c, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out" }); });
    });
  }

  // ================= Cartes d'expérience (détails au clic) =================
  document.querySelectorAll(".exp").forEach(function (c) {
    c.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      c.setAttribute("aria-expanded", c.getAttribute("aria-expanded") === "true" ? "false" : "true");
      setTimeout(function () { if (ST) ST.refresh(); }, 500);
    });
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.click(); } });
  });
  document.querySelectorAll("details").forEach(function (d) { d.addEventListener("toggle", function () { if (ST) ST.refresh(); }); });

  // ================= Carrousels =================
  document.querySelectorAll(".carrousel").forEach(function (c) {
    var rail = c.querySelector(".rail");
    var sec = c.closest("section") || document;
    sec.querySelectorAll('[data-rail="' + c.id + '"]').forEach(function (b) {
      b.addEventListener("click", function () {
        rail.scrollBy({ left: (b.getAttribute("data-sens") === "1" ? 1 : -1) * rail.clientWidth * 0.8, behavior: reduit ? "auto" : "smooth" });
      });
    });
  });

  // ================= Visionneuse d'images =================
  document.addEventListener("click", function (e) {
    var img = e.target.closest("[data-zoom] img");
    if (!img) return;
    var fig = img.closest("figure"), cap = fig && fig.querySelector("figcaption ." + lang());
    var v = document.createElement("div");
    v.className = "visionneuse"; v.setAttribute("role", "dialog");
    v.innerHTML = '<button type="button" aria-label="Fermer">×</button><div><img alt=""><p></p></div>';
    v.querySelector("img").src = img.currentSrc || img.src;
    v.querySelector("img").alt = img.alt;
    v.querySelector("p").textContent = cap ? cap.textContent : "";
    function fermer() { v.remove(); document.removeEventListener("keydown", clav); if (lenis) lenis.start(); }
    function clav(ev) { if (ev.key === "Escape") fermer(); }
    v.addEventListener("click", function (ev) { if (ev.target === v || ev.target.tagName === "BUTTON") fermer(); });
    document.addEventListener("keydown", clav);
    document.body.appendChild(v);
    if (lenis) lenis.stop();
    v.querySelector("button").focus();
  });

  // ================= Fond animé : réseau de neurones lumineux =================
  (function reseau() {
    var cv = document.getElementById("reseau");
    if (!cv) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 1.5), W, H, pts = [], souris = { x: -999, y: -999 }, visible = true, raf;
    function init() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(80, (W * H) / 17000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.6 + 0.6 });
    }
    function dessiner() {
      ctx.clearRect(0, 0, W, H);
      var D = 140;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        if (!reduit) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) {
            var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            var al = (1 - d / D) * 0.35;
            g.addColorStop(0, "rgba(123,108,255," + al + ")"); g.addColorStop(1, "rgba(58,215,255," + al + ")");
            ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        var dm = Math.hypot(a.x - souris.x, a.y - souris.y);
        if (dm < 180) {
          ctx.strokeStyle = "rgba(58,215,255," + (1 - dm / 180) * 0.5 + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(souris.x, souris.y); ctx.stroke();
        }
        ctx.fillStyle = i % 3 ? "rgba(58,215,255,.85)" : "rgba(160,150,255,.9)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function boucle() { dessiner(); raf = requestAnimationFrame(boucle); }
    init(); dessiner();
    addEventListener("resize", function () { init(); dessiner(); });
    cv.parentElement.addEventListener("mousemove", function (e) { var r = cv.getBoundingClientRect(); souris.x = e.clientX - r.left; souris.y = e.clientY - r.top; });
    if (reduit) return;
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !raf) boucle(); else if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    }).observe(cv);
  })();

  // ================= Scène 3D : radiographie + Grad-CAM =================
  (function scene3d() {
    var boite = document.getElementById("scene3d"), canvas = document.getElementById("canvas3d");
    if (!boite || !canvas || !window.THREE) return;
    try { var t0 = document.createElement("canvas"); if (!(t0.getContext("webgl") || t0.getContext("experimental-webgl"))) return; } catch (e) { return; }
    var T = window.THREE, rendu;
    try { rendu = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
    rendu.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 3.5);
    var groupe = new T.Group(); groupe.rotation.x = -0.18; scene.add(groupe);
    var geo = new T.PlaneGeometry(1.7, 1.7);
    var matR = new T.MeshBasicMaterial({ color: 0xffffff }), matC = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    var radio = new T.Mesh(geo, matR), cam = new T.Mesh(geo, matC); cam.position.z = 0.004;
    var cadre = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.8 })); cadre.position.z = 0.006;
    // Ligne de balayage lumineuse
    var balai = new T.Mesh(new T.PlaneGeometry(1.74, 0.012), new T.MeshBasicMaterial({ color: 0x3ad7ff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    balai.position.z = 0.01;
    var halo = new T.Mesh(new T.PlaneGeometry(1.74, 0.16), new T.MeshBasicMaterial({ color: 0x7b6cff, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false }));
    halo.position.z = 0.009;
    groupe.add(radio, cam, cadre, balai, halo);
    // Poussière lumineuse autour de la plaque
    var n = 260, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 3.4; pos[i * 3 + 1] = (Math.random() - 0.5) * 3.4; pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6 - 0.3; }
    var geoP = new T.BufferGeometry(); geoP.setAttribute("position", new T.BufferAttribute(pos, 3));
    var poussiere = new T.Points(geoP, new T.PointsMaterial({ color: 0x8fb8ff, size: 0.012, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }));
    scene.add(poussiere);

    var pret = 0, raf = null, visible = true, sx = 0, sy = 0;
    function dessiner(t) {
      if (pret < 2) return;
      t = t || 0;
      if (reduit) { groupe.rotation.y = -0.28; matC.opacity = 0.65; balai.visible = halo.visible = false; }
      else {
        groupe.rotation.y += ((Math.sin(t * 0.00022) * 0.4 + sx * 0.25) - groupe.rotation.y) * 0.06;
        groupe.rotation.x += ((-0.18 + sy * 0.15) - groupe.rotation.x) * 0.06;
        groupe.position.y = Math.sin(t * 0.0008) * 0.03;
        var cycle = (t * 0.00018) % 1, yb = 0.85 - cycle * 1.7;
        balai.position.y = halo.position.y = yb;
        matC.opacity = Math.min(0.95, Math.max(0, 0.5 - 0.5 * Math.cos(t * 0.00055)) * 1.05);
        poussiere.rotation.y = t * 0.00004;
      }
      rendu.render(scene, camera);
    }
    function boucle(t) { dessiner(t); raf = requestAnimationFrame(boucle); }
    function demarrer() { if (!raf && !reduit && visible && !document.hidden) raf = requestAnimationFrame(boucle); }
    function arreter() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function taille() { var w = boite.clientWidth, h = boite.clientHeight; rendu.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dessiner(0); }
    function charge() { pret++; if (pret === 2) { racine.classList.add("webgl"); taille(); dessiner(0); demarrer(); } }
    var ch = new T.TextureLoader();
    ch.load("projet/xray.jpg", function (t) { matR.map = t; matR.needsUpdate = true; charge(); });
    ch.load("projet/gradcam.png", function (t) { matC.map = t; matC.needsUpdate = true; charge(); });
    taille();
    if (window.ResizeObserver) new ResizeObserver(taille).observe(boite);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? demarrer() : arreter(); }).observe(boite);
    document.addEventListener("visibilitychange", function () { document.hidden ? arreter() : demarrer(); });
    boite.addEventListener("mousemove", function (e) { var r = boite.getBoundingClientRect(); sx = (e.clientX - r.left) / r.width - 0.5; sy = (e.clientY - r.top) / r.height - 0.5; });
    boite.addEventListener("mouseleave", function () { sx = sy = 0; });
  })();

  // ================= Explorateur Grad-CAM (4 cas) =================
  var CAS = {
    VP: { p: "P = 1,000", fr: ["Pneumonie détectée", "La zone chaude couvre le haut du poumon droit. Une électrode s'y trouve aussi : à cette résolution (7×7), je ne peux pas dire lequel des deux a compté."],
          en: ["Pneumonia detected", "The hot area covers the upper right lung. An electrode sits there too: at this resolution (7×7), I cannot tell which one mattered."] },
    VN: { p: "P = 0,000", fr: ["Normale reconnue", "Pour dire « normal », le modèle regarde le cœur et le cou, pas les poumons. C'est moins intuitif."],
          en: ["Normal recognised", "To say \"normal\", the model looks at the heart and neck, not the lungs. Less intuitive."] },
    FP: { p: "P = 1,000", fr: ["Fausse alerte", "Radio normale, mais grise et peu contrastée. Mon hypothèse : ce voile ressemble à des opacités pour le modèle."],
          en: ["False alarm", "A normal X-ray, but grey and low-contrast. My hypothesis: this haze looks like opacities to the model."] },
    FN: { p: "P = 0,006", fr: ["Pneumonie ratée", "Pour un œil non médical, les poumons paraissent normaux. Anomalie subtile ou étiquette discutable ? Seul un radiologue pourrait trancher."],
          en: ["Missed pneumonia", "To a non-medical eye the lungs look normal. Subtle anomaly or debatable label? Only a radiologist could tell."] }
  };
  var casActif = "VP";
  function afficherCas(k) {
    casActif = k;
    var aa = document.getElementById("aa");
    if (!aa) return;
    aa.querySelector(".avant").src = "projet/cas/" + k + "_radio.jpg";
    aa.querySelector(".apres").src = "projet/cas/" + k + "_cam.jpg";
    document.querySelectorAll(".choix-cas button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-cas") === k ? "true" : "false"); });
    var c = CAS[k][lang()], z = document.querySelector(".lecture-cas");
    z.querySelector("h4").textContent = c[0];
    z.querySelector(".proba").textContent = lang() === "fr" ? CAS[k].p : CAS[k].p.replace(",", ".");
    z.querySelector("p").textContent = c[1];
    if (anime) G.fromTo(z, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 });
  }
  document.querySelectorAll(".avantapres").forEach(function (b) {
    var r = b.querySelector("input");
    function maj() { b.style.setProperty("--pos", r.value + "%"); }
    r.addEventListener("input", maj); maj();
  });
  document.querySelectorAll(".choix-cas button").forEach(function (b) { b.addEventListener("click", function () { afficherCas(b.getAttribute("data-cas")); }); });
  if (document.getElementById("aa")) { afficherCas("VP"); document.addEventListener("langue", function () { afficherCas(casActif); }); }

  // ================= Laboratoire de seuil (vraies probabilités du test) =================
  (function labo() {
    var zone = document.getElementById("labo"), svg = document.getElementById("roc");
    if (!zone || !svg) return;
    var NS = "http://www.w3.org/2000/svg", COUL = { densenet121: "#3ad7ff", baseline: "#ff8a5c" };
    var etat = { m: "densenet121", s: 0.5 }, D, chemins = {}, pt, curseur = document.getElementById("seuil");
    var L = 380, H = 340, M = { g: 46, d: 14, h: 14, b: 42 };
    function X(v) { return M.g + v * (L - M.g - M.d); } function Y(v) { return H - M.b - v * (H - M.h - M.b); }
    function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
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
    function maj() {
      var r = compter(etat.m, etat.s);
      document.getElementById("val-seuil").textContent = nombre(etat.s, 3);
      document.getElementById("l-fn").textContent = r.fn;
      document.getElementById("l-fp").textContent = r.fp;
      document.getElementById("l-sens").textContent = nombre(r.sens, 3);
      document.getElementById("l-spec").textContent = nombre(r.spec, 3);
      ["baseline", "densenet121"].forEach(function (m) { chemins[m].setAttribute("stroke-width", m === etat.m ? 3 : 1.4); chemins[m].setAttribute("opacity", m === etat.m ? 1 : 0.35); });
      pt.setAttribute("cx", X(1 - r.spec)); pt.setAttribute("cy", Y(r.sens)); pt.setAttribute("fill", COUL[etat.m]);
    }
    function regler(s) { etat.s = Math.min(0.999, Math.max(0.001, s)); curseur.value = etat.s; maj(); }
    fetch("projet/donnees_test.json").then(function (r) { return r.json(); }).then(function (d) {
      D = d;
      svg.setAttribute("viewBox", "0 0 " + L + " " + H);
      for (var t = 0; t <= 1.0001; t += 0.25) {
        el("line", { x1: X(t), x2: X(t), y1: Y(0), y2: Y(1), stroke: "rgba(255,255,255,.07)" });
        el("line", { x1: X(0), x2: X(1), y1: Y(t), y2: Y(t), stroke: "rgba(255,255,255,.07)" });
        el("text", { x: X(t), y: H - M.b + 18, "text-anchor": "middle" }).textContent = String(t);
        el("text", { x: M.g - 8, y: Y(t) + 4, "text-anchor": "end" }).textContent = String(t);
      }
      el("line", { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), stroke: "rgba(255,255,255,.2)", "stroke-dasharray": "4 5" });
      var tx = el("text", { x: (X(0) + X(1)) / 2, y: H - 6, "text-anchor": "middle" });
      var ty = el("text", { x: 14, y: (Y(0) + Y(1)) / 2, "text-anchor": "middle", transform: "rotate(-90 14 " + (Y(0) + Y(1)) / 2 + ")" });
      ["baseline", "densenet121"].forEach(function (m) {
        chemins[m] = el("path", { d: roc(m).map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(""),
                                  fill: "none", stroke: COUL[m], "stroke-linejoin": "round" });
      });
      pt = el("circle", { r: 8, stroke: "#05070d", "stroke-width": 3 });
      function etiq() { tx.textContent = lang() === "fr" ? "1 − spécificité (fausses alertes)" : "1 − specificity (false alarms)"; ty.textContent = lang() === "fr" ? "Sensibilité" : "Sensitivity"; maj(); }
      curseur.addEventListener("input", function () { etat.s = parseFloat(curseur.value); maj(); });
      zone.querySelectorAll("[data-modele]").forEach(function (b) {
        b.addEventListener("click", function () {
          etat.m = b.getAttribute("data-modele");
          zone.querySelectorAll("[data-modele]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          maj();
        });
      });
      zone.querySelectorAll("[data-preset]").forEach(function (b) {
        b.addEventListener("click", function () { var v = b.getAttribute("data-preset"); regler(v === "hs" ? D.seuils_haute_sensibilite[etat.m] : parseFloat(v)); });
      });
      document.addEventListener("langue", etiq);
      regler(0.5); etiq();
    }).catch(function () { zone.insertAdjacentHTML("afterbegin", '<p class="petit">Données indisponibles.</p>'); });
  })();

  // ================= Le piège : forme des images (vraies données) =================
  (function forme() {
    var svg = document.getElementById("forme");
    if (!svg) return;
    var NS = "http://www.w3.org/2000/svg", L = 520, H = 300, M = { g: 20, d: 20, h: 26, b: 40 };
    fetch("projet/forme.json").then(function (r) { return r.json(); }).then(function (d) {
      svg.setAttribute("viewBox", "0 0 " + L + " " + H);
      var b = d.bins, x0 = b[0], x1 = b[b.length - 1], ymax = Math.max.apply(null, d.densites.NORMAL.concat(d.densites.PNEUMONIA)) * 1.1;
      function X(v) { return M.g + (v - x0) / (x1 - x0) * (L - M.g - M.d); } function Y(v) { return H - M.b - v / ymax * (H - M.h - M.b); }
      function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
      var defs = el("defs", {});
      [["gN", "#3ad7ff"], ["gP", "#7b6cff"]].forEach(function (g) {
        var lg = document.createElementNS(NS, "linearGradient"); lg.setAttribute("id", g[0]); lg.setAttribute("x1", 0); lg.setAttribute("x2", 0); lg.setAttribute("y1", 0); lg.setAttribute("y2", 1);
        lg.innerHTML = '<stop offset="0" stop-color="' + g[1] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + g[1] + '" stop-opacity="0"/>';
        defs.appendChild(lg);
      });
      el("line", { x1: M.g, x2: L - M.d, y1: Y(0), y2: Y(0), stroke: "rgba(255,255,255,.15)" });
      [1, 1.5, 2, 2.5].forEach(function (v) { el("text", { x: X(v), y: H - M.b + 18, "text-anchor": "middle" }).textContent = String(v); });
      var aires = [];
      [["NORMAL", "#3ad7ff", "gN"], ["PNEUMONIA", "#7b6cff", "gP"]].forEach(function (c) {
        var pts = d.densites[c[0]].map(function (v, i) { return [X((b[i] + b[i + 1]) / 2), Y(v)]; });
        var ligne = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L");
        var aire = el("path", { d: ligne + "L" + pts[pts.length - 1][0] + " " + Y(0) + "L" + pts[0][0] + " " + Y(0) + "Z", fill: "url(#" + c[2] + ")" });
        var trait = el("path", { d: ligne, fill: "none", stroke: c[1], "stroke-width": 2.5, "stroke-linejoin": "round" });
        var med = d.mediane[c[0]];
        el("line", { x1: X(med), x2: X(med), y1: Y(0), y2: M.h, stroke: c[1], "stroke-dasharray": "3 4", opacity: 0.7 });
        var t = el("text", { x: X(med) + 6, y: M.h + 10, fill: c[1] }); t.style.fill = c[1];
        t.textContent = c[0] === "NORMAL" ? "normales · " + String(med) : "pneumonies · " + String(med);
        t.setAttribute("data-classe", c[0]);
        aires.push(aire, trait);
      });
      var ax = el("text", { x: L / 2, y: H - 4, "text-anchor": "middle" });
      function etiq() {
        ax.textContent = lang() === "fr" ? "rapport largeur / hauteur de l'image d'origine" : "width / height ratio of the original image";
        svg.querySelectorAll("[data-classe]").forEach(function (t) {
          var med = d.mediane[t.getAttribute("data-classe")], fr = lang() === "fr";
          t.textContent = (t.getAttribute("data-classe") === "NORMAL" ? (fr ? "normales" : "normal") : (fr ? "pneumonies" : "pneumonia")) + " · " + nombre(med, 2);
        });
      }
      etiq(); document.addEventListener("langue", etiq);
      if (anime) G.from(aires, { scaleY: 0, transformOrigin: "50% 100%", duration: 1.4, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: svg, start: "top 80%" } });
    });
  })();

  if (ST) addEventListener("load", function () { ST.refresh(); });
})();
