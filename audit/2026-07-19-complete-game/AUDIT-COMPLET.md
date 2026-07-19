# Yomi no Kage — audit complet du jeu

**Date de l’audit :** 19 juillet 2026  
**Base auditée :** `20260719-street-composition-v2`  
**Périmètre :** parcours neuf, prologue, briefing, dōjō, jeu 2D, deux intérieurs FPS, combat, IA, animations, arsenal, sauvegarde, audio, accessibilité, desktop et mobile.

> **Statut important :** les corrections de la passe du 19 juillet sont **VALIDÉES LOCALEMENT**. Les tests automatisés, les parcours UI desktop/mobile et les nouvelles captures comparatives passent. Le déploiement public reste la dernière validation externe.
>
> Les constats et captures P0 décrivent **l’état de départ de cette passe**, avant les modifications concurrentes. Certains liens peuvent donc déjà montrer une valeur corrigée en cours de travail ; cela ne constitue pas une validation finale.

## Verdict exécutif

`Yomi no Kage` possède désormais une identité visuelle forte, un prologue crédible, une base de combat nettement plus riche qu’un simple bouton d’attaque, une architecture de sprites modulaire et six zones 2D composées à la main. L’écran titre, la cinématique et l’entrée du village donnent l’impression d’un vrai jeu.

En revanche, **la campagne jouable reste un vertical slice** :

- le trajet complet est estimé à **4–6 minutes en connaissant la route**, **10–18 minutes lors d’une première partie**, ou **15–25 minutes en combattant et explorant davantage** ;
- un rang S demande encore de terminer en moins de **360 secondes**, ce qui confirme une durée de démonstration ([`game.js`, rang de fin](../../game.js#L4492-L4507)) ;
- il n’existe que **deux cartes FPS de 15×15**, **un seul encounter 2D scripté**, **deux checkpoints persistants** et **trois portes FPS affichées mais non jouables** ;
- les 97 personnages et les 53 armes donnent une forte impression de contenu dans les fichiers, mais une faible part devient réellement distinctive ou accessible pendant la chronique.

La priorité n’est donc plus d’ajouter des centaines de sprites. La priorité est de transformer Kurokawa en **chapitre complet de 45–60 minutes**, avec une boucle refuge → mission → transformation du monde → boss → bilan → récompense.

## Résultat de la passe corrective

Cette passe ne prétend pas transformer à elle seule le vertical slice en campagne de 8–10 heures. Elle retire toutefois plusieurs marqueurs visibles de prototype :

- les trois portes auparavant factices lancent maintenant **Maison des malades**, **Chapelle de route** et **Archives du daimyō** ;
- le jeu possède désormais **cinq cartes FPS** : deux missions principales et trois secondaires ;
- ces missions ajoutent **29 ennemis et un sous-boss**, des objectifs, rosters, matériaux et récompenses propres ;
- leurs purifications persistent dans `save.secrets`, débloquent trois armes et ne modifient jamais les deux sceaux principaux ;
- le briefing conserve son bouton d’action à l’écran à 1280×720 ;
- le dōjō portrait est devenu un parcours vertical avec cartes d’armes en deux colonnes ;
- le viewmodel FPS est passé de `480×320` à `280×188`, abaissé en bas du champ ;
- une nouvelle partie demande confirmation lorsqu’une chronique existe ;
- les paramètres sont accessibles en pause et restituent correctement le focus ;
- les libellés de reprise indiquent désormais le dernier foyer ;
- les pas 2D déclenchent la banque audio selon la surface.

Les lacunes de fond restent réelles : directions FPS dessinées, vocabulaire d’animation complet, boss final en deux formes, refuge/débrief, progression de 45–60 minutes et variété systémique des rencontres.

## Baromètre de santé

| Axe | État | Constat |
|---|---|---|
| Direction artistique | **Solide** | Titre, prologue et entrée 2D cohérents et mémorables. |
| Cohérence historique et lore | **Bonne fondation, fin incohérente** | Kan’ei 15, Kai, contamination physique + Yomi bien cadrés ; la phase finale canonique n’est pas jouée. |
| Composition des niveaux | **Mitigée** | 186 props et 48 plateformes, mais progression majoritairement horizontale et peu de séquences obligatoires. |
| Combat | **Prometteur mais incomplet** | Combo, lourd, garde, parade, esquive, posture et réactions matière existent ; les armes et ennemis restent trop homogènes. |
| IA | **Fonctionnelle mais peu différenciée** | Patrouille, vue, ouïe, mémoire et poursuite existent ; 96 profils artistiques sont ramenés à cinq familles. |
| Animation | **Insuffisante pour les verbes jouables** | Cinq états de six frames ne couvrent pas saut, sprint, garde, parade, esquive, changement d’arme, etc. |
| FPS | **Bloquant pour la qualité cible** | Viewmodel envahissant, directions ennemies simulées, seulement deux petites cartes et objectifs identiques. |
| Arsenal et progression | **Très incomplet** | 53 armes visibles, trois disponibles au départ et seulement deux récompenses de déblocage dans la chronique. |
| UI/UX desktop | **Bonne présentation, plusieurs pièges** | Briefing trop haut, suppression silencieuse de sauvegarde, libellés de reprise ambigus. |
| Mobile | **P0** | Jeu portrait très réduit et dōjō en trois colonnes illisible. |
| Audio et accessibilité | **Bonne architecture, intégration partielle** | Réglages et synthèse audio solides ; plusieurs hooks ne sont pas employés par le gameplay. |
| Longévité | **Critique** | Pas de refuge, débrief, contrats, difficulté, NG+, défis ou deuxième chapitre jouable. |

## Preuves visuelles

Les captures suivantes proviennent du parcours local réellement exécuté pendant l’audit.

| Capture | Ce qu’elle démontre |
|---|---|
| [01 — titre, nouveau joueur](./01-title-new-player.png) | Présentation de niveau commercial, key art et hiérarchie clairs. |
| [02 — ouverture du prologue](./02-prologue-opening.png) | Cinématique cohérente, cadrage 16:9 et ton horrifique convaincant. |
| [03 — briefing et commandes](./03-briefing-controls.png) | À 1280×720, le bouton de préparation se trouvait sous le pli avant la correction en cours. Treize commandes sont montrées d’un coup. |
| [04 — dōjō desktop](./04-dojo-loadout.png) | Arsenal riche et lisible sur grand écran, mais densité élevée et très nombreux éléments verrouillés. |
| [05 — entrée 2D](./05-gameplay-2d-entry.png) | La composition actuelle de la rue est cohérente ; le rendu n’est plus un simple alignement aléatoire de props. |
| [06 — mort après inactivité](./06-death-after-idle.png) | Le joueur peut mourir très vite au début ; la capture a été obtenue après environ 23 secondes sans interaction. |
| [07 — sanctuaire FPS](./07-gameplay-fps-sanctuary.png) | Les bras occupent presque tout le champ de vision et le katana masque l’espace de combat. |
| [08 — jeu 2D portrait](./08-mobile-2d-controls.png) | Le Canvas 16:9 n’occupe qu’une petite bande en haut, tandis que les commandes consomment le bas de l’écran. |
| [09 — jeu 2D paysage mobile](./09-mobile-landscape-2d.png) | Le paysage est la configuration mobile la plus viable visuellement. |
| [10 — dōjō portrait](./10-mobile-dojo.png) | Le dōjō conserve trois colonnes comprimées : listes, cartes et détails deviennent difficilement lisibles. |
| [11 — viewmodel FPS corrigé](./11-fps-viewmodel-after.png) | Les bras sont abaissés et le centre de visée redevient lisible. |
| [12 — dōjō mobile corrigé](./12-mobile-dojo-after.png) | Les slots, filtres, cartes en deux colonnes et détails restent lisibles à 390×844. |
| [13 — briefing corrigé](./13-briefing-after.png) | Le contenu central défile tandis que l’action de préparation reste visible à 1280×720. |
| [14 — comparaison avant/après](./14-before-after-comparison.png) | Comparaison à viewport équivalent du FPS, du dōjō portrait et du briefing. |

## Mesures exactes du contenu jouable

Les nombres ci-dessous ont été recalculés à partir de `KageLevels.areas`, et non estimés depuis les captures.

| Zone 2D | Largeur | Route principale | Ennemis | Plateformes | Props | Portails | Pickups | Encounters |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Grande rue de Kurokawa | 2 500 | 2 420 | 6 | 15 | 46 | 3 | 3 | 0 |
| Ruelle des puits | 2 500 | 2 360 | 6 | 6 | 38 | 3 | 3 | 0 |
| Marché est | 2 500 | 2 320 | 4 | 2 | 34 | 4 | 2 | 1 |
| Cour basse | 2 500 | 1 420 | 5 | 12 | 25 | 2 | 3 | 0 |
| Résidence | 2 400 | 2 180 | 5 | 6 | 21 | 3 | 3 | 0 |
| Donjon | 2 500 | 2 240 | 5 | 7 | 22 | 2 | 3 | 0 |
| **Total** | **14 900** | **12 940** | **31** | **48** | **186** | **17** | **17** | **1** |

Sources : définition de campagne et canon dans [`level-data.js`](../../level-data.js#L264-L305), définition d’Aka-Ushi et de son encounter dans [`level-data.js`](../../level-data.js#L1296-L1337), checkpoints dans [`level-data.js`](../../level-data.js#L1319-L1325) et [`level-data.js`](../../level-data.js#L2054-L2060).

Conséquences :

- densité moyenne : **2,4 ennemis par 1 000 pixels de route principale** ;
- cinq zones sur six n’ont aucun encounter scripté ;
- Aka-Ushi est la seule rencontre 2D qui verrouille réellement la progression vers la suite ;
- les 48 plateformes créent des variantes ponctuelles, mais la majorité des routes principales reste un sol horizontal continu ;
- le volume graphique est important, mais le volume de décisions, rencontres, transformations et récompenses reste faible.

## Audit P0 — bloqueurs à corriger avant de parler de « jeu complet »

### P0.1 — Durée et boucle de mission

La cible de design annonce **45–75 minutes par chapitre**, un bâtiment FPS obligatoire, un optionnel, trois secrets, un checkpoint toutes les 5–8 minutes, un sous-boss, un boss et un bilan ([`GAME_DESIGN_ROADMAP.md`](../../GAME_DESIGN_ROADMAP.md#L77-L107)). La version auditée ne possède que :

- 31 ennemis 2D répartis sur 12 940 pixels de route ;
- 1 encounter 2D ;
- 2 intérieurs FPS ;
- 2 checkpoints ;
- aucune phase refuge, renseignement, extraction, débrief ou décision de purification ;
- aucune transformation visible d’une zone déjà visitée après la purification.

Presque tous les combats ordinaires peuvent être contournés. Les portails latéraux vérifient surtout un boss ou un encounter explicitement déclaré, pas la sécurisation générale du quartier ([`game.js`, verrouillage des portails](../../game.js#L1895-L1921)). Cela réduit fortement le temps de jeu et empêche les combats d’avoir une fonction de progression.

**Correction attendue :**

1. structurer Kurokawa en trois actes internes ;
2. rendre obligatoires seulement les rencontres qui introduisent ou concluent une mécanique ;
3. ajouter trois checkpoints fiables ;
4. transformer les zones après chaque foyer ;
5. terminer par un écran de bilan, une décision et une récompense garantie.

### P0.2 — Trois portes FPS sont de faux contenus

Les portes suivantes sont visibles, nommées et présentées comme interactives, mais leurs missions sont des chaînes de caractères alors que le moteur n’accepte que des indices numériques :

- Maison des malades : [`level-data.js`](../../level-data.js#L1056-L1076) ;
- Chapelle de route : [`level-data.js`](../../level-data.js#L1254-L1274) ;
- Archives scellées : [`level-data.js`](../../level-data.js#L1784-L1804).

Le moteur répond alors « cet intérieur sera ouvert par une mission secondaire » au lieu de lancer un contenu ([`game.js`](../../game.js#L4368-L4394)). Pour un joueur, ces trois portes ressemblent à du contenu coupé ou à un bug.

**Correction attendue :** soit livrer les trois intérieurs avec objectif et récompense persistante, soit retirer leur affordance interactive de la version publique. Une porte clairement annoncée comme accessible ne doit jamais être une promesse vide.

**Résolu dans cette passe :** les trois portails conservent leur identifiant lore et utilisent maintenant `missionIndex` 2, 3 et 4. Le smoke test de cohérence les ouvre, les purifie, contrôle leur retour 2D, leur secret persistant, leur arme débloquée et l’absence de sceau principal.

### P0.3 — Le FPS n’a pas encore une qualité de jeu complète

Le moteur ne déclare que deux cartes de **15×15** ([`game.js`](../../game.js#L1261-L1296)), contre une cible documentée de **18×18 à 28×20** avec plusieurs étages ou sous-cartes pour les lieux importants ([`GAME_DESIGN_ROADMAP.md`](../../GAME_DESIGN_ROADMAP.md#L103-L107)). Les deux missions utilisent la même boucle : tuer tout le monde, approcher l’autel, appuyer sur `E` ([`game.js`](../../game.js#L4397-L4437)).

Lors de la capture de référence, le viewmodel utilisait un rectangle logique de **480×320** sur un Canvas de **640×360**, soit 75 % de la largeur et près de 89 % de la hauteur. La capture [07](./07-gameplay-fps-sanctuary.png) confirme que les bras et la lame empêchaient de lire l’espace. Cette valeur est en cours de réduction dans [`game.js`](../../game.js#L487) et son rendu associé ([`game.js`](../../game.js#L6118-L6131)) ; elle doit encore être validée visuellement.

Les ennemis ne disposent pas de véritables planches frontales, dorsales et latérales. Le moteur :

1. calcule une direction ;
2. fabrique la face et le dos en assemblant deux moitiés miroir ;
3. dessine artificiellement deux yeux pour la face.

Preuve : [`game.js`, direction](../../game.js#L7029-L7042) et [`game.js`, reconstruction front/dos](../../game.js#L7045-L7119). C’est la cause structurelle des ennemis qui semblent ne pas regarder le joueur.

**Correction attendue :**

- réduire et abaisser le viewmodel ;
- produire de vraies vues `front`, `back`, `left`, `right` pour les ennemis réellement utilisés dans le chapitre ;
- distinguer visuellement et mécaniquement chaque intérieur ;
- ajouter des objectifs FPS différents : sauver, trouver, résister, escorter, choisir, extraire ;
- créer des projectiles ennemis visibles et esquivables pour les familles distance/esprit.

**Partiellement résolu dans cette passe :** cinq cartes FPS sont maintenant jouables et le viewmodel est réduit à `280×188`. Les vraies directions dessinées et les objectifs autres que combat + autel restent à produire.

### P0.4 — Le boss final contredit le canon du projet

La bible fixe le daimyō corrompu comme boss du château, puis `Yomi-no-Kanrei` comme **sa seconde forme**, pas comme une autre entité ([`LORE_BIBLE.md`](../../LORE_BIBLE.md#L68-L77)). `level-data.js` déclare d’ailleurs cette identité et trois phases ([`level-data.js`](../../level-data.js#L293-L297), [`level-data.js`](../../level-data.js#L2553-L2578)).

Dans le jeu, la deuxième mission FPS équipe encore le boss `06-daimyo-corrupted` ([`game.js`](../../game.js#L1170-L1184)), avec 26 PV et un seul bloc de comportement ([`game.js`](../../game.js#L1797-L1808)). Sa mort termine immédiatement la chronique et marque uniquement `06-daimyo-corrupted` comme vaincu ([`game.js`](../../game.js#L4508-L4516)).

**Correction attendue :** combat en deux formes avec transition mise en scène :

1. daimyō corrompu, duel lisible et humain ;
2. agrégation `Yomi-no-Kanrei`, boss massif occupant une large part de l’écran ;
3. décision finale de purifier, brûler ou prélever.

### P0.5 — La progression d’arsenal est surtout déclarative

L’arsenal jouable contient **53 armes** et 34 types de déclencheur passif pour 44 effets distincts. La chronique commence avec seulement trois armes : Kurokage, wakizashi et kunai ([`save.js`](../../save.js#L42-L53)). Deux récompenses supplémentaires seulement sont câblées :

- `naginata-lourde` après Aka-Ushi ;
- `06-kegare-kiri` après le daimyō.

Preuve : [`game.js`](../../game.js#L4221-L4245). La chronique permet donc d’atteindre **5 armes sur 53 au maximum** sans manipulation de sauvegarde.

Le moteur applique quelques catégories de passifs dans le calcul d’attaque ([`game.js`](../../game.js#L682-L744)), mais la majorité des déclencheurs, cooldowns et promesses textuelles de l’arsenal n’a pas de boucle événementielle dédiée. Le dōjō ne permet de sélectionner que trois slots d’arme, alors que la sauvegarde contient aussi armure, omamori, technique et objets rapides ([`save.js`](../../save.js#L69-L86), [`index.html`](../../index.html#L311-L354)).

**Correction attendue :**

- ajouter un bus d’événements de combat pour les passifs ;
- tester chaque effet avec un scénario reproductible ;
- distribuer des recettes, composants et armes par boss, secret, contrat et artisan ;
- ouvrir dans le dōjō les armures, omamori, techniques et objets rapides ;
- afficher clairement la source de déblocage et le progrès vers celle-ci.

### P0.6 — Mobile et premier démarrage

Le portrait force le shell de jeu à conserver un ratio 16:9 ([`styles.css`](../../styles.css#L1243-L1258)). Sur un écran 390×844, le monde n’utilise donc qu’environ 219 pixels de hauteur, ce que confirme la capture [08](./08-mobile-2d-controls.png).

Le dōjō reste organisé en trois colonnes même sous 720 px ([`styles.css`](../../styles.css#L1192-L1240)). En portrait, la liste d’armes tombe à une seule colonne sans transformer le parcours global ; la capture [10](./10-mobile-dojo.png) est pratiquement inexploitable.

Le briefing desktop présente treize commandes avant même d’avoir joué ([`index.html`](../../index.html#L264-L280)). À 1280×720, son bouton final se trouvait sous le pli dans la capture [03](./03-briefing-controls.png).

**Correction attendue :**

- dōjō mobile en parcours vertical : slots → filtres/liste → détails → validation ;
- orientation paysage recommandée pour le jeu, avec message explicite en portrait ;
- tutoriel jouable progressif qui introduit déplacement, frappe, garde, esquive, interaction puis FPS ;
- zone de sécurité au spawn pour éviter une mort pendant la lecture initiale.

**Partiellement résolu dans cette passe :** le briefing et le dōjō portrait sont corrigés et validés aux viewports cibles. Le tutoriel jouable et une expérience de combat portrait complète restent à concevoir.

### P0.7 — Risque de perte de sauvegarde et libellés trompeurs

`Nouvelle chronique` appelle une remise à zéro de la sauvegarde sans confirmation ([`game.js`](../../game.js#L2291-L2303)). Le bouton de fin affiche « Rejouer la chronique », mais `restartGame()` reprend la sauvegarde existante si elle existe ([`game.js`](../../game.js#L2278-L2282), [`index.html`](../../index.html#L378-L390)).

**Correction attendue :**

- confirmation avant l’effacement d’une chronique existante ;
- sauvegarde de secours de la dernière version valide ;
- libellés distincts : « reprendre au dernier foyer », « recommencer la mission », « nouvelle chronique » ;
- à la victoire, offrir explicitement le retour au refuge ou un vrai nouveau départ.

**Partiellement résolu dans cette passe :** une modale accessible protège désormais la chronique existante ; annulation, confirmation, focus et lancement du prologue sont testés. Les boutons de mort/pause annoncent explicitement la reprise au dernier foyer.

## Audit P1 — nécessaire pour que Kurokawa ressemble à un chapitre fini

### P1.1 — Cohérence et profondeur des niveaux

Point positif : le registre n’est plus utilisé comme placement spatial aléatoire. Le code précise que les layouts écrits dans `level-data.js` sont la source de vérité ([`game.js`](../../game.js#L1016-L1023)). La capture [05](./05-gameplay-2d-entry.png) montre une rue plus cohérente que les anciennes compositions.

Les problèmes restants sont de structure :

- trop de longues portions horizontales avec la même intensité ;
- plateformes souvent optionnelles et sans récompense ou danger propre ;
- peu de portes qui mènent à une vraie pièce, une rue secondaire ou un étage ;
- absence de raccourcis persistants ouvrant une nouvelle lecture du niveau ;
- peu de retours dans une zone transformée ;
- props dits destructibles qui ne possèdent pas de santé ni de réaction : ils restent affichés tant que le boss de l’arène vit, puis disparaissent ([`game.js`](../../game.js#L5419-L5422)).

Chaque chunk devrait avoir une fonction claire : approche, tutoriel, tension, combat, respiration, secret, retour, setpiece ou récompense. Un puits, un brasero, une charrette ou un toit doit justifier son placement par la circulation, la couverture, un accès ou une narration environnementale.

### P1.2 — Variété ennemie et IA

La base IA est réelle : patrouille, perception visuelle, bruit, mémoire, investigation, retour au poste et leash sont présents ([`game.js`](../../game.js#L2920-L3068)). Cependant, les 96 ennemis artistiques sont automatiquement réduits à cinq familles :

- mêlée : 51 ;
- charge : 27 ;
- esprit : 7 ;
- distance : 6 ;
- bouclier : 5.

La classification elle-même est dérivée de mots-clés dans le nom, le texte de gameplay et l’arme ([`game.js`](../../game.js#L1039-L1062)). Les profils de combat ont ensuite cinq gabarits principaux ([`game.js`](../../game.js#L2593-L2657)).

Autre limite : les attaques distance/esprit testent la portée et infligent directement les dégâts au moment actif de l’animation. Elles ne créent pas de projectile ennemi traçable et esquivable ([`game.js`](../../game.js#L2960-L2985), [`game.js`](../../game.js#L3687-L3706)).

**Cible chapitre 1 :** ne pas utiliser 32 silhouettes interchangeables. Retenir 10 à 12 ennemis, chacun avec une fonction claire, des timings, un projectile ou une contrainte propre, une animation de télégraphe et une synergie de groupe.

### P1.3 — Montures d’armes ennemies

Les corps et armes sont correctement séparés. En revanche, les `sprite.json` possèdent une monture par état, par exemple [`boss-01-geoliere-sekimon/sprite.json`](../../assets/modular/characters/boss/boss-01-geoliere-sekimon/sprite.json#L412-L434), tandis que le moteur emploie encore des montures globales `WEAPON_MOUNTS`, un profil directionnel générique et une petite oscillation commune aux six frames ([`game.js`](../../game.js#L5865-L5924)).

Cette architecture explique les rotations et glissements encore visibles sur certaines armes.

**Correction attendue :**

- exporter les montures propres au personnage dans le registre ;
- stocker position, rotation, échelle et visibilité par vue, état et frame ;
- valider automatiquement que la poignée reste dans la main ;
- permettre `weapon hidden`, `weapon dropped` et parties détachables pendant blessure/mort.

### P1.4 — Manque d’animations

Le registre contient exactement :

- 97 personnages ;
- 485 planches 2D ;
- 2 910 frames 2D ;
- 480 planches FPS ennemies, soit 2 880 frames ;
- 5 planches FPS joueur, soit 30 frames.

Source : [`assets/modular/registry.json`](../../assets/modular/registry.json#L4-L29). Le standard est limité à `idle`, `move`, `attack`, `hurt`, `death`, six frames chacun.

Or le gameplay contient marche, course, sprint, saut, combo léger en trois coups, lourd, garde, parade, contre, esquive, attaque à distance, changement d’arme, interaction, posture brisée et transitions 2D/FPS. Le moteur visuel ramène ces actions aux cinq états communs ([`game.js`](../../game.js#L747-L755), [`game.js`, pose FPS](../../game.js#L6096-L6115)).

**Cible minimale pour Akio :**

- locomotion : idle, départ, marche, course, sprint, freinage ;
- verticalité : saut départ, montée, apex, chute, réception ;
- défense : entrée garde, garde boucle, impact garde, parade, contre, posture brisée ;
- mobilité : esquive départ, invulnérabilité, récupération ;
- armes : dégainer, rengainer, changer, léger 1/2/3, lourd charge/boucle/libération ;
- contexte : projectile, interaction, porte, autel, soin, blessure, mort ;
- FPS : même vocabulaire pour les bras, avec montures de chaque famille d’arme.

Pour les ennemis, produire d’abord les états supplémentaires des 10–12 adversaires réellement présents dans Kurokawa, pas ceux des 96 profils à la fois.

### P1.5 — HUD, onboarding et feedback de progression

Le HUD communique santé, endurance, arme, munitions, objectif et foyer, mais pas clairement :

- posture du joueur hors situation critique ;
- armure, omamori et technique actifs ;
- deux objets rapides ;
- mon, tamahagane, cendre du Yomi et yomogi ;
- progression d’un secret ou d’un déblocage ;
- récompense sécurisée/non sécurisée.

La mort rapide de la capture [06](./06-death-after-idle.png) montre également que le jeu suppose la maîtrise immédiate de treize commandes.

**Correction attendue :** tutoriel en situation, objectifs en trois niveaux (immédiat, quartier, mission), journal léger, notifications de récompense et résumé au foyer.

### P1.6 — Audio, musique et game feel

L’architecture audio est un point fort :

- impacts chair/armure/esprit ;
- familles d’armes distinctes ;
- parade, garde, esquive, porte et checkpoint ;
- pas par terre, pierre, bois, tatami et eau ;
- bus, volume, sourdine et spatialisation.

Preuve : [`audio.js`](../../audio.js#L320-L447).

Mais plusieurs capacités ne sont pas appelées depuis le gameplay : aucun hook de pas n’est déclenché par `game.js`, les transitions de porte et la spatialisation ne sont pas systématiques, et la musique n’est pas explicitement suspendue quand la partie est en pause.

**Correction attendue :**

- pas synchronisés aux frames de locomotion ;
- sons de portes, toits, puits, braseros et autels spatialisés ;
- ducking pendant dialogue, mort et pause ;
- couches musicales par zone, combat, boss, purification et retour transformé ;
- test de lisibilité sonore sans regarder l’écran.

### P1.7 — Accessibilité et navigation

Points présents :

- volume maître, musique, SFX et sourdine ;
- réduction des mouvements ;
- désactivation du tremblement ;
- contraste élevé ;
- taille de texte ;
- focus et modales structurées ;
- contrôles tactiles et zone de glisse FPS ([`index.html`](../../index.html#L394-L417)).

Points manquants :

- remappage des touches ;
- prise en charge manette ;
- option de maintien/bascule pour garde et sprint ;
- vitesse et inversion de visée ;
- sous-titres/indications pour les signaux uniquement sonores ;
- navigation fléchée du `tablist` du dōjō : les slots ont `role="tab"`, mais le gestionnaire clavier ne traite que `Escape` ([`loadout.js`](../../loadout.js#L104-L122), [`loadout.js`](../../loadout.js#L450-L457)).

## Audit P2 — longévité et finition après Kurokawa définitif

- trois niveaux de difficulté avec changements de comportement, pas seulement de PV ;
- contrats optionnels réutilisant les boss non retenus dans la campagne ;
- meilleurs rangs par chapitre, avec critères adaptés à 45–75 minutes ;
- secrets persistants, journal des infectés et artbook relié au jeu ;
- NG+ avec nouvelles compositions, pas un simple multiplicateur ;
- boss rush séparé du canon de campagne ;
- mode arcade 60–90 minutes ;
- défis sans soin, parade parfaite, armes imposées ;
- slots de sauvegarde ou au minimum sauvegarde automatique + sauvegarde de secours ;
- écran de chargement et indicateur de sauvegarde ;
- télémétrie locale de durée par chunk, morts, esquives, parades et armes utilisées.

Ces objectifs correspondent à la feuille de route existante ([`GAME_DESIGN_ROADMAP.md`](../../GAME_DESIGN_ROADMAP.md#L238-L252)) mais doivent venir **après** un premier chapitre réellement fini.

## Corrections de cette passe — APPLIQUÉES ET VALIDÉES LOCALEMENT

Les éléments suivants ont été exécutés et contrôlés :

1. **Briefing :** bouton de préparation visible, contenu central seul défilant.
2. **Pause :** paramètres accessibles, retour de focus contrôlé.
3. **Dōjō mobile :** parcours vertical et cartes en deux colonnes.
4. **Viewmodel FPS :** bras réduits et abaissés, katana recentré.
5. **Contenu FPS :** trois missions secondaires jouables et persistantes.
6. **Sauvegarde :** confirmation de nouvelle chronique et reprise au foyer clarifiée.
7. **Audio :** pas synchronisés au déplacement 2D et différenciés par surface.
8. **Revalidation locale :** toutes les suites Node passent ; briefing, dōjō, pause/paramètres et confirmation ont été rejoués dans le navigateur intégré.

## Roadmap réaliste vers un vrai jeu

### Jalon A — stabilisation de la passe actuelle

- fermer tous les P0 UI/FPS/sauvegarde ;
- revalider chaque porte et checkpoint ;
- test complet sans commandes de debug ;
- captures desktop 1280×720, portrait 390×844 et paysage mobile ;
- aucune arme flottante ou derrière un corps sur les ennemis utilisés.

**Sortie du jalon :** vertical slice propre, sans fausse porte ni écran inutilisable.

### Jalon B — Kurokawa définitif, 45–60 minutes

- refuge jouable et préparation complète ;
- tutoriel intégré à la grande rue ;
- trois routes courtes avec raccourcis persistants ;
- un FPS obligatoire et un FPS optionnel substantiels ;
- trois secrets et trois checkpoints ;
- 10–12 ennemis réellement distincts ;
- Aka-Ushi comme setpiece intermédiaire ;
- daimyō + Yomi-no-Kanrei en deux formes ;
- transformation des zones après chaque foyer ;
- purification/brûler/prélever ;
- bilan, butin, artisan et amélioration garantie.

**Sortie du jalon :** chapitre représentatif de la qualité et de la durée du jeu final.

### Jalon C — premier acte, 2–3 heures

- Kurokawa, sanctuaire du bambou et poste de Sekisho ;
- refuge évolutif avec Kaji et une miko ;
- trois familles ennemies complètes et testées ;
- économie réellement dépensable ;
- blessures, contamination, contrats et conséquences ;
- instrumentation des durées et de l’équilibrage.

### Jalon D — campagne 8–10 heures

- cinq chapitres supplémentaires ;
- 7–8 boss de campagne, 8–10 sous-boss et 3–4 boss massifs ;
- choix persistants et fins influencées ;
- difficulté Ronin, Samouraï et Shura ;
- revue historique et lore sur chaque roster régional.

La cible globale est déjà documentée dans [`GAME_DESIGN_ROADMAP.md`](../../GAME_DESIGN_ROADMAP.md#L159-L177). Le principal changement de méthode doit être le suivant : **chaque nouveau sprite entre en production seulement avec une rencontre, une animation, un comportement, une récompense et un test qui justifient son existence.**

## Plan de vérification obligatoire

Le dépôt possède déjà une bonne base de vérification statique et de smoke tests ([`README.md`](../../README.md#L96-L116)). Pour déclarer une version « jeu » et non « prototype », ajouter ou maintenir les contrôles suivants :

1. `node --check` sur tous les scripts modifiés ;
2. smoke tests gameplay, extension, cohérence, cinématique et audio ;
3. validation du registre modulaire et de tous les assets HTTP ;
4. test automatisé des 17 portails, avec destination et retour ;
5. test des deux checkpoints sur mort et rechargement de page ;
6. test frame par frame des montures d’armes joueur/ennemis ;
7. test FPS de direction front/dos/gauche/droite ;
8. parcours complet neuf, reprise, mort, victoire et nouvelle chronique ;
9. test mobile coarse pointer réel, pas seulement viewport réduit ;
10. captures comparatives des six zones 2D et de chaque intérieur FPS ;
11. vérification du temps réel du chapitre sur plusieurs parcours ;
12. contrôle du build public après déploiement.

## Définition de « jeu complet » pour le prochain audit

Kurokawa pourra être qualifié de chapitre fini seulement si :

- aucune entrée visible ne mène à un message de contenu futur ;
- le chapitre dure réellement au moins 45 minutes lors d’une première partie ;
- chaque combat obligatoire introduit, combine ou conclut une mécanique ;
- toutes les armes obtenables ont un effet fonctionnel et testable ;
- Akio dispose d’animations correspondant à tous ses verbes majeurs ;
- les ennemis FPS possèdent de vraies directions ;
- les niveaux changent après les purifications ;
- mobile paysage et dōjō portrait sont utilisables ;
- mort, reprise, checkpoint et nouvelle partie ne sont jamais ambigus ;
- le daimyō et Yomi-no-Kanrei respectent la continuité canonique ;
- le joueur reçoit un bilan, une récompense et une raison claire de lancer la mission suivante.
