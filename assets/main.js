/* Portfolio — scripts communs : langue FR/EN, apparitions au défilement, frise, visionneuse */
(function () {
  var racine = document.documentElement;

  // ---- Langue : FR par défaut, mémorisée pour ce visiteur ----
  var langue = "fr";
  try { langue = localStorage.getItem("langue") || (navigator.language || "fr").slice(0, 2); } catch (e) {}
  if (langue !== "en") langue = "fr";
  function appliquerLangue(l) {
    racine.lang = l;
    document.querySelectorAll(".langue").forEach(function (b) {
      b.textContent = l === "fr" ? "EN" : "FR";
      b.setAttribute("aria-label", l === "fr" ? "Switch to English" : "Passer en français");
    });
    try { localStorage.setItem("langue", l); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langue", { detail: l }));
  }
  appliquerLangue(langue);
  document.querySelectorAll(".langue").forEach(function (b) {
    b.addEventListener("click", function () { appliquerLangue(racine.lang === "fr" ? "en" : "fr"); });
  });

  // ---- Apparitions discrètes ----
  var elements = document.querySelectorAll(".revele");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    elements.forEach(function (el) { io.observe(el); });
  } else {
    elements.forEach(function (el) { el.classList.add("vu"); });
  }

  // ---- Frise interactive ----
  var frise = document.querySelector(".frise");
  if (frise) {
    var boutons = frise.querySelectorAll("button");
    function choisir(b) {
      boutons.forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      document.querySelectorAll(".etape").forEach(function (p) { p.hidden = p.id !== b.getAttribute("aria-controls"); });
    }
    boutons.forEach(function (b) { b.addEventListener("click", function () { choisir(b); }); });
    var actif = frise.querySelector('[aria-selected="true"]') || boutons[0];
    if (actif) choisir(actif);
  }

  // ---- Visionneuse d'images (galeries et captures) ----
  document.addEventListener("click", function (e) {
    var img = e.target.closest("[data-zoom] img");
    if (!img) return;
    var fig = img.closest("figure");
    var leg = fig && fig.querySelector("figcaption " + (racine.lang === "fr" ? ".fr" : ".en"));
    var v = document.createElement("div");
    v.className = "visionneuse";
    v.setAttribute("role", "dialog");
    v.innerHTML = '<button aria-label="Fermer">×</button><div><img alt=""><p></p></div>';
    v.querySelector("img").src = img.currentSrc || img.src;
    v.querySelector("img").alt = img.alt;
    v.querySelector("p").textContent = leg ? leg.textContent : (fig && fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent : "");
    function fermer() { v.remove(); document.removeEventListener("keydown", clavier); }
    function clavier(ev) { if (ev.key === "Escape") fermer(); }
    v.addEventListener("click", function (ev) { if (ev.target === v || ev.target.tagName === "BUTTON") fermer(); });
    document.addEventListener("keydown", clavier);
    document.body.appendChild(v);
    v.querySelector("button").focus();
  });
})();
