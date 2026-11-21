# Portfolio de Lamiae Andof

Site personnel publié sur https://lamiaeandof.github.io.
Projet phare (URL stable, utilisée par le QR code du poster) : https://lamiaeandof.github.io/radiographies.html
Code du projet : https://github.com/LamiaeAndof/chest-xray-explainable-ai

## Structure
- `index.html` : le récit en chapitres (FR/EN, thème sombre/clair).
- `radiographies.html` : générée à partir du chapitre 5 d'`index.html` (`python outils/generer_radiographies.py`, à relancer après toute modification de ce chapitre).
- `assets/` : styles et scripts ; `vendor/` : three.js r128, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13 (versions figées) ; `fonts/` : Sora et Inter (SIL OFL), hébergées localement.
- `projet/` : vraies données du test (probabilités, distribution des formats) et vraies cartes Grad-CAM, exportées depuis le dépôt du projet.

Le projet radiographies est pédagogique et expérimental : ce n'est pas un dispositif médical.
