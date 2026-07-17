# Pipeline modulaire — Yomi no Kage

Ce dossier remplace les illustrations aplaties par des assets exploitables
directement dans le moteur.

## Inventaire final

- 97 personnages, dont 96 adversaires ;
- 485 planches d'animation et 2 910 frames PNG individuelles ;
- 48 armes modulaires avec point de prise, plus 10 katanas de lore existants ;
- 84 sprites de décor : 12 couches, 36 accessoires et 36 plateformes.

`registry.json` est le registre moteur complet. `catalog.json` expose les mêmes
assets à l'artbook avec leurs noms, lore, prompts, chemins et usages.

## Personnages

Chaque personnage possède un master sans arme, organisé en grille stricte :

- 6 colonnes, une pose par frame ;
- 5 lignes : `idle`, `move`, `attack`, `hurt`, `death` ;
- Akio tourné vers la droite et adversaires tournés vers la gauche ; le moteur
  applique le miroir horizontal selon la direction de déplacement ;
- même cadrage, même échelle et mêmes proportions dans les 30 cellules ;
- fond chroma `#ff00ff`, ensuite converti en alpha.

Le pipeline exporte ensuite :

```text
characters/<tier>/<id>/
  master.png
  sheets/idle.png
  sheets/move.png
  sheets/attack.png
  sheets/hurt.png
  sheets/death.png
  frames/<animation>/00.png ... 05.png
  sprite.json
```

Les armes ne sont jamais fusionnées avec les personnages. `sprite.json`
déclare un point d’ancrage de main par animation afin que n’importe quelle arme
compatible puisse être équipée sans régénérer le personnage.

Le moteur charge ces planches à la demande depuis le registre et ne garde en
mémoire que les personnages effectivement présents dans la scène.

## Décors

Chaque zone est composée de quatre couches indépendantes :

1. `sky` — ciel et astres, image opaque répétable ;
2. `far` — reliefs lointains, PNG transparent ;
3. `mid` — silhouettes d’architecture/végétation, PNG transparent ;
4. `near` — premier plan atmosphérique, PNG transparent.

Maisons, tours, torii, arbres, plateformes et accessoires sont exportés en PNG
individuels. Les collisions et positions restent des données du niveau.

## Catégories du roster

- `player` : Akio ;
- `legacy` : les 6 infectés déjà présents dans le prototype ;
- `regular` : 20 infectés standards ;
- `special` : 20 infectés à mécanique spéciale ;
- `miniboss` : 20 sous-boss ;
- `boss` : 20 boss ;
- `giant` : 10 boss géants inspirés par la lisibilité et les phases des grands
  combats d’arcade, avec designs originaux adaptés au Japon de 1638.

## Contraintes visuelles

- pixel-art 16-bit, pixels carrés nets, sans lissage ;
- Japon de l’ère Kan’ei, 1638 ;
- palette encre, indigo, rouge laque, os, vert contaminé et braise ;
- aucune arme fusionnée dans une silhouette de personnage ;
- aucun texte, logo, filigrane, ombre portée ou décor dans les sprites ;
- gore contenu et lisibilité prioritaire à petite taille.

## Validation

```powershell
node tools/build-modular-catalog.mjs
node tools/validate-modular-pack.mjs
node tools/verify-modular-registry.mjs
py tools/clean-modular-atlas-bleed.py
py tools/sprite_pipeline.py validate --root assets/modular
```
