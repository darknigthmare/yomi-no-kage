# Yomi no Kage — L'Ombre du Shogun

Chapitre jouable en pixel-art qui alterne combat latéral 2D et FPS rétro
raycast dans un Japon féodal frappé par une épidémie de morts-vivants.

La version actuelle comprend une chronique sauvegardable, onze zones 2D
reliées par 28 passages, cinq intérieurs FPS — deux principaux et trois
missions secondaires persistantes —, des checkpoints consommables, un boss
massif et un endgame temporel Château → Japon contemporain → Neo-Edo.
La cible de campagne 8–10 heures reste décrite dans
[`GAME_DESIGN_ROADMAP.md`](GAME_DESIGN_ROADMAP.md) ; les règles historiques et
surnaturelles sont fixées dans [`LORE_BIBLE.md`](LORE_BIBLE.md).

## Lancer le jeu

Depuis ce dossier :

```powershell
py -m http.server 8765
```

Puis ouvrir `http://127.0.0.1:8765/`.

L'artbook interactif est disponible sur
`http://127.0.0.1:8765/assets.html`.

## Pack visuel OpenAI modulaire

Le jeu utilise un pack original en pixel-art 16-bit généré avec OpenAI
ImageGen puis découpé en assets de production indépendants :

- 103 personnages : Akio et 102 adversaires ;
- 22 ennemis ordinaires, 24 spéciaux, 20 sous-boss, 20 boss et 10 boss massifs ;
- 5 planches par personnage (`idle`, `move`, `attack`, `hurt`, `death`) ;
- 6 frames PNG par planche, soit 515 planches et 3 090 frames individuelles ;
- 5 planches FPS dédiées à Akio (`idle`, `move`, `attack`, `hurt`, `death`),
  soit 30 frames subjectives complètes générées avec OpenAI ImageGen ;
- 96 ennemis historiques possèdent 480 planches FPS et 2 880 frames ; leurs
  vues face/dos restent des synthèses de profils, pas huit directions dessinées ;
- les cinq planches 2D d'Akio utilisent des cellules `192x160`, une palette
  commune de 96 couleurs et une seule échelle pour les 30 poses ;
- les cinq planches FPS d'Akio utilisent des cellules natives `960x640` :
  elles correspondent exactement au backing store haute définition du Canvas
  et ne subissent plus le double agrandissement de l'ancien pack `240x160` ;
- 10 sprites FPS de sabres entièrement séparés, interchangeables sur les
  mêmes bras grâce à 30 points de prise ajustés image par image ;
- 58 assets d'armes modulaires et un arsenal jouable de 53 armes ;
- 6 000 poses d'armes normalisées : 3 060 ennemis 2D, 2 880 ennemis FPS
  historiques et 60 poses pour Akio ;
- 7 identités environnementales — forêt, bambouseraie, champs, Kurokawa,
  château, Japon contemporain et Neo-Edo cyberpunk — pour 218 sprites de
  décor repositionnables.

Les corps ne contiennent aucune arme fusionnée. Le jeu superpose l'arme sur
un point de prise normalisé et charge à la demande les cinq planches des seuls
ennemis visibles. Aka-Ushi possède en plus un `neckRig` de 30 ancres pour son
joug détachable. Les maisons, murs, tours, foyers, torii, ponts, arbres,
plateformes et premiers plans restent repositionnables séparément.

Les rigs historiques ont été produits par détection de contour puis validés
structurellement. Cette automatisation empêche les armes de repasser derrière
le corps, mais ne remplace pas encore des sockets de mains dessinés et vérifiés
anatomiquement pour chaque direction FPS.

Les exports finaux se trouvent dans `assets/modular/`. `registry.json` est le
registre destiné au moteur et `catalog.json` alimente l'artbook interactif.
Les manifests JSON conservent noms, lore, rôle de gameplay, prompts et outil de
génération.

## Commandes

- `A` / `D` : déplacement
- `W` / `S` : avancer / reculer en FPS
- `Espace` : saut en 2D
- `J` ou clic gauche : combo léger avec l'arme active
- `L` : attaque lourde
- `U` (maintenir) : garde et fenêtre de parade parfaite
- `H` : esquive
- `K`, `3` ou clic droit : projectile préparé
- `1` / `2` / `Q` : arme principale, secondaire ou permutation
- `I` : ouvrir le dōjō
- `E` : ouvrir une entrée en 2D / sceller un autel en FPS
- `V` : raccourci de seuil, uniquement près d'une entrée
- `Échap` ou `P` : pause
- `M` : couper / réactiver le son

Les contrôles tactiles apparaissent automatiquement sur mobile et proposent
le combo, le lourd, la garde maintenue, l'esquive, le tir et une zone de glisse
pour tourner en FPS.

Une nouvelle chronique commence au col forestier de Kai avec Kurokage, le
wakizashi et les kunai. Les
53 armes restent visibles au dōjō ; les autres se débloquent selon leur
provenance (boss, chapitre, contrat, secret ou artisan). La Maison des malades,
la Chapelle de route et les Archives du daimyō offrent chacune une arme et des
ressources sans modifier la progression des deux sceaux principaux.

## Prologue cinématique

La chronique s'ouvre sur six plans originaux générés avec OpenAI ImageGen :
l'apparition de la peste, la dernière cloche de Kurokawa, les deux foyers,
l'ordre du shogun, le serment d'Akio et son arrivée au col de Kai, face à la
forêt, la bambouseraie, les rizières et Kurokawa au loin. Chaque plan est un
asset 16:9 indépendant dans `assets/generated/cinematics/`.

- clic, `Espace`, `Entrée` ou flèche droite : plan suivant ;
- flèche gauche : plan précédent ;
- `P` ou le bouton Pause : suspendre/reprendre la lecture automatique ;
- `Échap` ou le bouton « Passer le prologue » : accéder directement au briefing.

L'auto-défilement est désactivé lorsque la réduction des mouvements est active.

## Vérification

```powershell
node --check game.js
node --check audio.js
node --check cinematic.js
node audio-smoke-test.js
node cinematic-smoke-test.js
node visual-data-smoke-test.js
node --check assets-gallery.js
py tools/build_hero_sheets_v2.py
py tools/validate-fps-player.py
node tools/build-modular-catalog.mjs
node tools/validate-modular-pack.mjs
node tools/verify-modular-registry.mjs
py tools/clean-modular-atlas-bleed.py
py tools/sprite_pipeline.py validate --root assets/modular
node smoke-test.js
node expansion-smoke-test.js
node coherence-smoke-test.js
node campaign-expansion-smoke-test.js
node endgame-environments-smoke-test.js
py tools/validate-2d-spatial.py
py tools/build-weapon-rigs.py --check
node tools/verify-http-assets.mjs http://127.0.0.1:8765/
```

Le jeu ne dépend d'aucune bibliothèque externe.
