# Yomi no Kage — L'Ombre du Shogun

Prototype jouable en pixel-art qui alterne combat latéral 2D et FPS rétro
raycast dans un Japon féodal frappé par une épidémie de morts-vivants.

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

- 97 personnages : Akio, 6 ennemis historiques et 90 nouveaux adversaires ;
- 20 ennemis ordinaires, 20 spéciaux, 20 sous-boss, 20 boss et 10 boss géants ;
- 5 planches par personnage (`idle`, `move`, `attack`, `hurt`, `death`) ;
- 6 frames PNG par planche, soit 485 planches et 2 910 frames individuelles ;
- 48 nouvelles armes interchangeables, plus les 10 sabres de lore d'Akio ;
- 3 zones composées chacune de 4 fonds de parallaxe, 12 accessoires et
  12 tuiles de plateforme, soit 84 sprites de décor finaux.

Les corps ne contiennent aucune arme fusionnée. Le jeu superpose l'arme sur
un point de prise normalisé et charge à la demande les cinq planches des seuls
ennemis visibles. Les maisons, torii, ponts, arbres, plateformes et premiers
plans restent repositionnables séparément.

Les exports finaux se trouvent dans `assets/modular/`. `registry.json` est le
registre destiné au moteur et `catalog.json` alimente l'artbook interactif.
Les manifests JSON conservent noms, lore, rôle de gameplay, prompts et outil de
génération.

## Commandes

- `A` / `D` : déplacement
- `W` / `S` : avancer / reculer en FPS
- `Espace` : saut en 2D
- `J` ou clic gauche : katana
- `K` ou clic droit : ofuda
- `1` à `0` : équiper l'un des 10 sabres d'Akio
- `E` : interagir / sceller
- `V` : changer de perspective
- `Échap` ou `P` : pause
- `M` : couper / réactiver le son

Les contrôles tactiles apparaissent automatiquement sur mobile.

## Vérification

```powershell
node --check game.js
node --check audio.js
node --check assets-gallery.js
node tools/build-modular-catalog.mjs
node tools/validate-modular-pack.mjs
node tools/verify-modular-registry.mjs
py tools/clean-modular-atlas-bleed.py
py tools/sprite_pipeline.py validate --root assets/modular
node smoke-test.js
```

Le jeu ne dépend d'aucune bibliothèque externe.
