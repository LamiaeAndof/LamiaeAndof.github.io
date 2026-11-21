/* Page projet radiographies : 3D, curseurs avant/après, laboratoire de seuil (vraies probabilités du test) */
(function () {
  // ---------- 1. Ouverture 3D (repli 2D automatique) ----------
  (function scene3d() {
    var boite = document.getElementById("visuel3d");
    var canvas = document.getElementById("scene");
    if (!boite || !canvas || !window.THREE) return;
    try {
      var c = document.createElement("canvas");
      if (!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")))) return;
    } catch (e) { return; }
    var reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var rendu;
    try { rendu = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 3.4);
    var groupe = new THREE.Group();
    groupe.rotation.x = -0.2;
    scene.add(groupe);
    var geo = new THREE.PlaneGeometry(1.7, 1.7);
    var matRadio = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var matCam = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    var cam = new THREE.Mesh(geo, matCam);
    cam.position.z = 0.004;
    var bord = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x7f9cc8 }));
    bord.position.z = 0.006;
    groupe.add(new THREE.Mesh(geo, matRadio), cam, bord);

    var pret = 0, dernier = 0, raf = null, visible = true;
    function dessiner(t) {
      if (pret < 2) return;
      t = t || 0; dernier = t;
      if (reduit) { groupe.rotation.y = -0.28; matCam.opacity = 0.6; }
      else {
        groupe.rotation.y = Math.sin(t * 0.00022) * 0.42;     // rotation lente, aller-retour
        matCam.opacity = 0.45 - 0.45 * Math.cos(t * 0.0006);  // fondu 0 -> 0,9 -> 0
      }
      rendu.render(scene, camera);
    }
    function boucle(t) { dessiner(t); raf = requestAnimationFrame(boucle); }
    function demarrer() { if (!raf && !reduit && visible && !document.hidden) raf = requestAnimationFrame(boucle); }
    function arreter() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function taille() {
      var w = boite.clientWidth, h = boite.clientHeight;
      rendu.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dessiner(dernier);
    }
    function charge() {
      pret += 1;
      if (pret === 2) { document.documentElement.classList.add("webgl"); taille(); dessiner(0); demarrer(); }
    }
    var chargeur = new THREE.TextureLoader();
    chargeur.load("projet/xray.jpg", function (t) { matRadio.map = t; matRadio.needsUpdate = true; charge(); });
    chargeur.load("projet/gradcam.png", function (t) { matCam.map = t; matCam.needsUpdate = true; charge(); });
    taille();
    if (window.ResizeObserver) new ResizeObserver(taille).observe(boite);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? demarrer() : arreter(); }).observe(boite);
    document.addEventListener("visibilitychange", function () { document.hidden ? arreter() : demarrer(); });
  })();

  // ---------- 2. Curseurs avant / après ----------
  document.querySelectorAll(".avantapres").forEach(function (b) {
    var r = b.querySelector("input");
    function maj() { b.style.setProperty("--pos", r.value + "%"); }
    r.addEventListener("input", maj); maj();
  });

  // ---------- 3. Laboratoire de seuil ----------
  var labo = document.getElementById("labo");
  if (!labo) return;
  var NS = "http://www.w3.org/2000/svg";
  var COUL = { densenet121: "#2a78d6", baseline: "#eb6834" };
  var etat = { modele: "densenet121", seuil: 0.5 };
  var D = null, rocs = {};
  var curseur = document.getElementById("seuil");
  var svg = document.getElementById("roc");

  function fmt(x, n) {
    var s = x.toFixed(n);
    return document.documentElement.lang === "fr" ? s.replace(".", ",") : s;
  }
  function compter(modele, s) {
    var p = D[modele], y = D.label, vp = 0, fn = 0, vn = 0, fp = 0;
    for (var i = 0; i < y.length; i++) {
      var pos = p[i] >= s;
      if (y[i] === 1) { pos ? vp++ : fn++; } else { pos ? fp++ : vn++; }
    }
    return { vp: vp, fn: fn, vn: vn, fp: fp, sens: vp / (vp + fn), spec: vn / (vn + fp) };
  }
  function courbeRoc(modele) {
    // Tous les seuils possibles : chaque probabilité distincte (ordre décroissant)
    var idx = D[modele].map(function (p, i) { return i; }).sort(function (a, b) { return D[modele][b] - D[modele][a]; });
    var P = D.label.filter(function (v) { return v === 1; }).length, N = D.label.length - P;
    var vp = 0, fp = 0, pts = [[0, 0]];
    for (var k = 0; k < idx.length; k++) {
      if (D.label[idx[k]] === 1) vp++; else fp++;
      if (k === idx.length - 1 || D[modele][idx[k + 1]] !== D[modele][idx[k]]) pts.push([fp / N, vp / P]);
    }
    return pts;
  }
  // Repère du graphique ROC
  var M = { g: 46, d: 12, h: 12, b: 40 }, L = 360, H = 320;
  function X(v) { return M.g + v * (L - M.g - M.d); }
  function Y(v) { return H - M.b - v * (H - M.h - M.b); }
  function el(nom, attrs, parent) {
    var e = document.createElementNS(NS, nom);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e); return e;
  }
  var chemins = {}, point;
  function construireRoc() {
    svg.setAttribute("viewBox", "0 0 " + L + " " + H);
    for (var t = 0; t <= 1.0001; t += 0.25) {
      el("line", { x1: X(t), x2: X(t), y1: Y(0), y2: Y(1), stroke: "#e7e6e1" });
      el("line", { x1: X(0), x2: X(1), y1: Y(t), y2: Y(t), stroke: "#e7e6e1" });
      el("text", { x: X(t), y: H - M.b + 16, "text-anchor": "middle" }).textContent = t.toFixed(2).replace(/\.?0+$/, "") || "0";
      el("text", { x: M.g - 8, y: Y(t) + 4, "text-anchor": "end" }).textContent = t.toFixed(2).replace(/\.?0+$/, "") || "0";
    }
    el("line", { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), stroke: "#b9b8b1", "stroke-dasharray": "4 4" });
    var tx = el("text", { x: (X(0) + X(1)) / 2, y: H - 6, "text-anchor": "middle", class: "ax" });
    var ty = el("text", { x: 14, y: (Y(0) + Y(1)) / 2, "text-anchor": "middle", transform: "rotate(-90 14 " + (Y(0) + Y(1)) / 2 + ")", class: "ax" });
    ["baseline", "densenet121"].forEach(function (m) {
      var d = rocs[m].map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join("");
      chemins[m] = el("path", { d: d, fill: "none", stroke: COUL[m], "stroke-width": 2, "stroke-linejoin": "round" });
    });
    point = el("circle", { r: 7, fill: COUL.densenet121, stroke: "#fff", "stroke-width": 2.5 });
    function etiquettes() {
      var fr = document.documentElement.lang === "fr";
      tx.textContent = fr ? "1 − spécificité (fausses alertes)" : "1 − specificity (false alarms)";
      ty.textContent = fr ? "Sensibilité" : "Sensitivity";
    }
    etiquettes();
    document.addEventListener("langue", etiquettes);
  }
  function maj() {
    var r = compter(etat.modele, etat.seuil);
    document.getElementById("val-seuil").textContent = fmt(etat.seuil, 3);
    document.getElementById("l-fn").textContent = r.fn;
    document.getElementById("l-fp").textContent = r.fp;
    document.getElementById("l-sens").textContent = fmt(r.sens, 3);
    document.getElementById("l-spec").textContent = fmt(r.spec, 3);
    document.getElementById("m-vn").textContent = r.vn;
    document.getElementById("m-fp").textContent = r.fp;
    document.getElementById("m-fn").textContent = r.fn;
    document.getElementById("m-vp").textContent = r.vp;
    document.getElementById("auc").textContent = fmt(D.auc[etat.modele], 3);
    ["baseline", "densenet121"].forEach(function (m) {
      chemins[m].setAttribute("stroke-width", m === etat.modele ? 3 : 1.5);
      chemins[m].setAttribute("opacity", m === etat.modele ? 1 : 0.45);
    });
    point.setAttribute("cx", X(1 - r.spec)); point.setAttribute("cy", Y(r.sens));
    point.setAttribute("fill", COUL[etat.modele]);
    svg.setAttribute("aria-label", "ROC : sensibilité " + fmt(r.sens, 3) + ", spécificité " + fmt(r.spec, 3));
  }
  function regler(s) { etat.seuil = Math.min(0.999, Math.max(0.001, s)); curseur.value = etat.seuil; maj(); }

  fetch("projet/donnees_test.json").then(function (r) { return r.json(); }).then(function (d) {
    D = d;
    rocs.densenet121 = courbeRoc("densenet121");
    rocs.baseline = courbeRoc("baseline");
    construireRoc();
    curseur.addEventListener("input", function () { etat.seuil = parseFloat(curseur.value); maj(); });
    labo.querySelectorAll("[data-modele]").forEach(function (b) {
      b.addEventListener("click", function () {
        etat.modele = b.getAttribute("data-modele");
        labo.querySelectorAll("[data-modele]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        maj();
      });
    });
    labo.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-preset");
        regler(v === "hs" ? D.seuils_haute_sensibilite[etat.modele] : parseFloat(v));
      });
    });
    document.addEventListener("langue", maj);
    labo.hidden = false;
    document.getElementById("labo-attente").hidden = true;
    regler(0.5);
  }).catch(function () {
    document.getElementById("labo-attente").textContent = "Données indisponibles (ouvrir la page via un serveur web).";
  });
})();
