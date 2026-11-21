"""Génère radiographies.html (URL stable du projet phare, utilisée par le QR code du poster)
à partir de la section marquée <!-- PROJET:DEBUT --> ... <!-- PROJET:FIN --> d'index.html.
Usage : python outils/generer_radiographies.py   (à relancer après toute modification du chapitre 5)
"""
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
index = (RACINE / "index.html").read_text(encoding="utf-8")
projet = re.search(r"<!-- PROJET:DEBUT -->(.*?)<!-- PROJET:FIN -->", index, re.S).group(1)
tete = index.split("</head>")[0] + "</head>"
remplacements = {
    "<title>Lamiae Andof — IA explicable, Computer Vision, IA en santé</title>": "<title>Où regarde une IA quand elle lit une radiographie ? — Lamiae Andof</title>",
    'content="Lamiae Andof, ingénieure d\'État en Data Science et IA (ENSA Tétouan, 2026). Computer Vision, IA générative et IA explicable appliquée à l\'imagerie médicale."':
        'content="Projet de Lamiae Andof : DenseNet-121 et Grad-CAM sur 5 856 radiographies pédiatriques, évaluation honnête sur 624 images de test, analyse des erreurs et d\'un biais. Projet pédagogique, pas un outil de diagnostic."',
    'href="https://lamiaeandof.github.io/"': 'href="https://lamiaeandof.github.io/radiographies.html"',
    'content="https://lamiaeandof.github.io/"': 'content="https://lamiaeandof.github.io/radiographies.html"',
    'content="Lamiae Andof — IA explicable et IA en santé"': 'content="Où regarde une IA quand elle lit une radiographie ?"',
    "content=\"Ingénieure en IA. Je construis des systèmes d'IA, et je veux comprendre ce qu'ils voient vraiment. Projet phare : IA explicable sur radiographies thoraciques.\"":
        "content=\"DenseNet-121, Grad-CAM, 624 radiographies de test : les résultats, les erreurs et le piège que j'ai découvert. Projet pédagogique de Lamiae Andof.\"",
    "og-image.jpg": "og-radiographies.jpg",
    '<link rel="preload" as="image" href="img/profil.webp" fetchpriority="high">': "",
}
for a, b in remplacements.items():
    assert a in tete, a[:60]
    tete = tete.replace(a, b)
tete = re.sub(r'<script type="application/ld\+json">.*?</script>', "", tete, flags=re.S)
corps = index.split("<body>", 1)[1]
entete = re.search(r'(<a class="evitement".*?<nav class="menu-mobile".*?</nav>)', corps, re.S).group(1)
entete = re.sub(r'href="#(origines|construit|sante|projets|engagement|certificats|vise|contact|moi)"', r'href="index.html#\1"', entete)
dialogues = re.search(r'(<dialog class="visionneuse".*?</dialog>)', corps, re.S).group(1)
pied = re.search(r"(<footer>.*?</footer>)", corps, re.S).group(1)
scripts = corps[corps.index('<script src="vendor/gsap.min.js"'):]
retour = """<section class="chapitre" style="padding-top:0"><div class="wrap" style="text-align:center">
  <h2 style="font-size:clamp(1.8rem,4vw,3rem)"><span class="fr">Ce projet fait partie d'une histoire plus longue.</span><span class="en">This project is part of a longer story.</span></h2>
  <div class="boutons" style="justify-content:center"><a class="btn plein" href="index.html"><span class="fr">Découvrir mon parcours</span><span class="en">Discover my path</span> <span class="fleche" aria-hidden="true">→</span></a>
  <a class="btn" href="index.html#contact"><span class="fr">Me contacter</span><span class="en">Contact me</span></a></div>
</div></section>"""
page = (f"<!doctype html>\n<html lang=\"fr\" data-theme=\"dark\">\n{tete.split('<html lang=\"fr\" data-theme=\"dark\">', 1)[1]}\n<body>\n{entete}\n"
        f"<main id=\"contenu\" style=\"padding-top:var(--nav-h)\">{projet}{retour}</main>\n{pied}\n{dialogues}\n{scripts}")
page = page.replace('<a class="monogramme" href="#moi"', '<a class="monogramme" href="index.html"')
(RACINE / "radiographies.html").write_text(page, encoding="utf-8")
print("radiographies.html :", len(page) // 1024, "Ko")
