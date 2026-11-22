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

La première vague haute fidélité couvre sept ennemis fréquents. Pour chacun,
six vues (`front`, les quatre trois-quarts et `back`) possèdent un atlas OpenAI
distinct réellement dessiné, sans miroir, fusion, projection ni interpolation.
Les profils `left/right` historiques restent deux banques séparées ; ils sont
recalibrés phase par phase depuis une archive pristine versionnée et vérifiée,
mais ne sont pas comptés
comme des vues nouvellement dessinées. Le dépôt contient donc 42 atlas authored
prêts sur les 630 requis pour convertir les 105 ennemis, avec 588 atlas encore
à produire. La file reproductible et les prompts se trouvent dans
`assets/modular/manifests/directional-authoring-prompts.json`.

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
`authored-fps-v1`. Le moteur et l’interface restent ainsi sous la limite
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

Les dix actions (attaque, attaque lourde, garde, esquive, tir, interaction,
bascule 2D/FPS, pause, refuge, arsenal) sont remappables dans **Paramètres →
Commandes** : cliquez une touche, appuyez sur la nouvelle, `Échap` annule.
Les liaisons sont conservées dans `localStorage` (`yomi-no-kage-bindings-v1`) et
« RÉTABLIR LES COMMANDES » retrouve les valeurs d’origine. Les déplacements
restent sur `WASD`/flèches et le stick gauche.

La manette standard (W3C) est reconnue sans configuration : A esquive, B
interagit/revient, X attaque, Y attaque lourde, LB garde, RB tir, LT refuge, RT
arsenal, Back bascule 2D/FPS, Start pause ; la croix et le stick gauche se
déplacent, le stick droit oriente la caméra en FPS. Dans le refuge, la croix
déplace le focus, A valide et B referme — l’écran reste aussi navigable aux
flèches et à `Tab`, sans souris.

## Vérification locale

Une seule commande matérialise le cache de frames ignoré par Git, puis exécute
les 22 smoke tests :

```bash
node tools/verify-all.mjs
```

Options : `--skip-assets` (tests sans assets uniquement), `--recheck-assets`
(force la matérialisation), `--only <motif>`, `--list`, `--json`,
`--with-validators`, `--with-browser` (parcours navigateur), `--fail-fast`,
`--timeout <secondes>`.

Codes de sortie : `0` tout est vert, `1` au moins un test échoue, `2` usage,
`3` prérequis manquant (Node, Python, Pillow, espace disque), `4` cache de
frames en échec. Les logs sont écrits dans `tmp/verify/<horodatage>/`.

Le premier passage matérialise environ 28 000 frames (quelques minutes) ; les
suivants sont sautés tant que les sources n'ont pas changé. Les tests restent
exécutables seuls (`node coherence-smoke-test.js`), et les validateurs de
`tools/` s'ajoutent avec `--with-validators`.

Le codex jouable (`codex-data.js`) est généré depuis le canon machine : ne
l’éditez pas à la main, régénérez-le après toute modification du canon.

```bash
node tools/build-codex-data.mjs
```

`codex-smoke-test.js` échoue si le fichier versionné diverge du générateur.

Un test automatisé valide un contrat de données ; il ne remplace pas un
playthrough naturel, une inspection frame par frame, un test sur téléphone
réel, une écoute humaine ou un profilage de performance.

### Harnais navigateur (P0.3)

Le parcours de campagne se prouve aussi dans la vraie page, avec Chromium :

```bash
npm install
npx playwright install chromium   # une seule fois (~125 Mio)
node tools/browser-harness.mjs
```

Le harnais coupe `requestAnimationFrame` et avance le jeu à pas fixe
(`KageGame.debug.step`), déplace le joueur par de vrais événements clavier,
verrouille puis ouvre les portes par le runtime, recharge la sauvegarde à
chaque fin d’acte et échoue sur toute erreur console ou réponse HTTP en
erreur. Il vérifie 28 zones, 7 objectifs par zone via leur méthode authored,
7 actes et 7 sceaux de chronique, avec une reprise au bon endroit après
rechargement.

Sans Chromium, `campaign-objective-runtime-smoke-test.js` couvre déjà la règle
du sceau : clore un acte par son dernier objectif ouvre le sceau de chronique
dans le codex, et ce sceau survit à un rechargement de sauvegarde.

Options : `--json`, `--headed`, `--only <zone>`, `--timeout <secondes>`,
`--out <dossier>`. Le rapport est écrit dans `tmp/browser-harness/report.json`.

Limites explicites : le combat n’est pas simulé (les rencontres sont résolues
par les points d’entrée de debug, comme la position du joueur à l’autel FPS) et
le rendu des pixels n’est pas inspecté. Un playthrough humain reste requis pour
la difficulté et les critères visuels.

Sous Linux, Chromium a besoin des bibliothèques système :
`npx playwright install --with-deps chromium` (droits administrateur) ou
l’équivalent fourni par votre distribution.

Pour l’inclure dans la chaîne :

```bash
node tools/verify-all.mjs --with-browser
```

`browser-harness-smoke-test.js` vérifie le plan des 28 zones, des sept
rechargements, les arguments, les types MIME et le serveur statique sans
ouvrir de navigateur ; il fait partie des 22 tests découverts par
`verify-all`.

Le jeu lui-même ne dépend d’aucune bibliothèque externe : Playwright est une
dépendance de développement réservée au harnais.
