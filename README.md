# Yomi no Kage — L’Ombre du Shogun

`Yomi no Kage` est un jeu d’action-horreur en pixel art qui alterne combat
latéral 2D et exploration FPS rétro dans un Japon féodal ravagé par le Kegare,
puis dans deux époques contaminées par la même faille du Yomi.

Le dépôt contient désormais une campagne jouable de bout en bout sur le plan
des données et de la progression. Ce n’est cependant pas encore une version
commerciale terminée : la durée réelle, la qualité visuelle exhaustive, les
performances et l’équilibrage doivent encore être validés par des playtests.
La liste mesurable de ce qu’il reste à produire se trouve dans
[`GAME_DESIGN_ROADMAP.md`](GAME_DESIGN_ROADMAP.md).

## État actuel

| Système | Contenu présent |
|---|---:|
| Actes | 7 |
| Zones 2D runtime | 28 |
| Largeur 2D cumulée | 86 400 px |
| Liens de route | 27 |
| Portails de campagne | 62 |
| Objectifs | 28 |
| Checkpoints | 28 |
| Props placés | 552 |
| Plateformes | 154 |
| Placements ennemis | 152 |
| Missions FPS de campagne | 7, une par acte |
| Missions FPS historiques conservées | 5 |
| Boss liés aux objectifs | 9 |

La route principale traverse :

1. la forêt de Kai ;
2. la bambouseraie de Shigure ;
3. les rizières de Tsuru ;
4. Kurokawa ;
5. le château et la faille du Yomi ;
6. le Japon contemporain ;
7. Neo-Edo cyberpunk.

Les entrées de bâtiment et les changements de vue demandent une action
explicite. Les anciens raccourcis incompatibles avec la route de campagne sont
masqués dans une nouvelle chronique.

## Gameplay disponible

- combo léger, attaque lourde, garde, parade parfaite et esquive ;
- Ki, posture, recul et réactions distinctes pour chair, armure et esprit ;
- arsenal modulaire de 53 armes jouables, dont 10 katanas ;
- armes séparées des corps pour le joueur et les ennemis ;
- équipement principal, secondaire et à distance interchangeable ;
- progression des armes jusqu’au rang `+5` ;
- maîtrise d’arme et bonus du dōjō ;
- quatre services au refuge : forge, infirmerie, dōjō et sanctuaire ;
- quatre contrats persistants avec ressources et déblocages ;
- contamination, monnaies, munitions, zones nettoyées et objectifs sauvegardés ;
- 28 objectifs authored : 9 boss et 19 objectifs non-boss ;
- 25 cibles d’interaction réparties entre purification, sauvetage, destruction,
  récupération et changement d’état du monde ;
- sept sceaux de campagne, séparés des deux sceaux historiques ;
- prologue cinématique en six plans et fin après le Shogun Zero ;
- commandes tactiles, zone de glisse pour regarder en FPS et réduction des
  mouvements.

La sauvegarde utilise le schéma `2`. Une zone déjà nettoyée ne doit pas
repeupler ses ennemis après `Continuer`, et les récompenses d’objectif sont
idempotentes.

## FPS et matériaux

Les sept missions obligatoires utilisent une mission dédiée par acte. Les cinq
missions historiques restent disponibles pour compatibilité et contenu
secondaire, soit douze missions FPS référencées au total.

Les sols, murs, portes et autels utilisent des matériaux sémantiques. Le Japon
contemporain et Neo-Edo possèdent leurs propres atlas OpenAI, sans mélange
aléatoire avec les tuiles féodales.

Le pipeline directionnel couvre les 105 ennemis déclarés dans les manifests :

```text
105 ennemis × 8 directions × 5 animations × 6 frames
= 4 200 planches logiques et 25 200 cellules d’animation
```

Les huit directions sont `front`, `front-left`, `left`, `back-left`, `back`,
`back-right`, `right` et `front-right`. Le registre, les 840 banques, les 4 200
planches et les contrôles anti-fusion passent sur `105/105`. Les anciens
personnages utilisent encore des projections propres de leur vue latérale pour
certaines orientations : elles ne sont plus fusionnées, mais devront être
remplacées par de vraies vues dessinées pour la version 1.0. L’inspection
anatomique de tous les sockets d’armes reste également à terminer.

## Pack visuel modulaire

Les manifests sources déclarent :

- 1 joueur et 105 ennemis ;
- 22 ennemis ordinaires ;
- 24 ennemis spéciaux ;
- 21 sous-boss ;
- 22 boss ;
- 10 boss massifs ;
- 6 personnages historiques conservés ;
- 5 planches 2D par personnage (`idle`, `move`, `attack`, `hurt`, `death`) ;
- 6 frames par planche ;
- 61 sprites d’armes disponibles dans les manifests, dont 53 intégrés à
  l’arsenal jouable ;
- 7 identités environnementales ;
- des bâtiments, murs, tours, foyers, plateformes et objets de premier plan
  indépendants.

Akio possède cinq planches 2D et cinq planches FPS de base, chacune en six
frames. Ce socle est cohérent pour l’alpha, mais le jeu final demande encore
des animations dédiées à la course, au saut, à la réception, aux combos, à la
parade, au changement d’arme, aux interactions et aux grandes familles
d’armes.

Les assets originaux générés avec OpenAI ImageGen conservent leurs sources et
leur provenance dans les manifests. Les exports runtime se trouvent dans
`assets/modular/`, tandis que `registry.json` alimente le moteur et
`catalog.json` l’artbook interactif.

En local, le jeu lit directement ces fichiers. Sur Vercel, `asset-runtime.js`
résout les assets lourds depuis le tag GitHub immuable
`complete-campaign-v2`. Le moteur et l’interface restent ainsi sous la limite
du plan Hobby, tandis que les planches servies correspondent exactement au
commit de publication. Les frames PNG unitaires ne sont pas versionnées :
elles se régénèrent depuis les planches complètes avec le pipeline.

## Lancer le jeu

Depuis ce dossier :

```powershell
py -m http.server 8765
```

Puis ouvrir `http://127.0.0.1:8765/`.

L’artbook interactif est disponible sur
`http://127.0.0.1:8765/assets.html`.

## Commandes

- `A` / `D` : déplacement latéral ;
- `W` / `S` : avancer / reculer en FPS ;
- `Espace` : saut en 2D ;
- `J` ou clic gauche : combo léger ;
- `L` : attaque lourde ;
- `U` maintenu : garde et parade parfaite ;
- `H` : esquive ;
- `K`, `3` ou clic droit : projectile ;
- `1` / `2` / `Q` : sélectionner ou permuter les armes ;
- `I` : ouvrir le dōjō et l’interface de campagne ;
- `E` : interagir, entrer, activer une cible ou sceller un autel ;
- `V` : raccourci de seuil près d’une entrée ;
- `Échap` ou `P` : pause ;
- `M` : couper ou réactiver le son.

## Vérification locale

Les contrôles principaux sont :

```powershell
node --check game.js
node --check level-data.js
node --check save.js
node asset-runtime-smoke-test.js
node campaign-runtime-smoke-test.js
node campaign-fps-smoke-test.js
node campaign-objective-runtime-smoke-test.js
node campaign-save-smoke-test.js
node progression-integrity-smoke-test.js
node fps-era-materials-smoke-test.js
node fps-directional-runtime-smoke-test.js
node coherence-smoke-test.js
node visual-data-smoke-test.js
py tools/validate-fps-player.py
py tools/validate-fps-enemies.py
py tools/validate-2d-spatial.py
node tools/validate-modular-pack.mjs
node tools/verify-modular-registry.mjs
py tools/sprite_pipeline.py validate --root assets/modular
```

Un test automatisé valide un contrat de données ; il ne remplace pas un
playthrough naturel, une inspection frame par frame, un test sur téléphone
réel, une écoute humaine ou un profilage de performance.

Le jeu ne dépend d’aucune bibliothèque externe.
