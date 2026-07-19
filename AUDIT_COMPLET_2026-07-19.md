# Yomi no Kage — audit complet vers le jeu final

**Date :** 19 juillet 2026
**État inspecté :** `styles.css?v=28`, `save.js?v=5`,
`level-data.js?v=13`, `game.js?v=41`, `campaign-ui.js?v=2`,
`cinematic.js?v=13`

**Build principal déclaré :** `20260719-complete-campaign-v2`

**Build campagne déclaré :** `20260719-seven-act-runtime-v5`
**Périmètre :** campagne, niveaux, objectifs, FPS, animations, armes, combat,
IA, progression, sauvegarde, UI/UX, mobile, audio, performances, lore et QA.

> Cet audit décrit le dépôt local inspecté. Il ne valide ni un déploiement de
> production, ni une durée commerciale, ni un playthrough naturel complet.
> Les tests automatiques vérifient des contrats précis ; ils ne remplacent pas
> une inspection visuelle, un test sur appareil réel ou une écoute humaine.

## Verdict

`Yomi no Kage` a franchi un cap important : le projet contient maintenant une
route runtime de **7 actes et 28 zones**, avec une fin, 7 missions FPS
obligatoires, 28 objectifs persistants, un refuge et une progression
fonctionnelle. Il est plus juste de parler de **campagne alpha jouable** que de
prototype.

Le jeu n’est pourtant pas encore complet. Les cinq écarts principaux sont :

1. les 105 ennemis passent le pipeline huit directions sans fusion, mais les
   vues historiques avant/arrière restent des projections de la latérale et
   non huit dessins réellement authored ;
2. les armes et pièces détachables doivent encore être contrôlées
   anatomiquement frame par frame ;
3. la route existe, mais sa densité ne prouve pas une durée de 8 à 10 heures ;
4. les objectifs et systèmes sont fonctionnels, mais manquent encore de mise
   en scène, de variété et d’équilibrage par playtest ;
5. aucun run complet naturel, test mobile physique, audit audio humain ou
   profilage de performance n’a encore fermé la version.

## État mesuré de la campagne

| Mesure | Valeur |
|---|---:|
| Actes | 7 |
| Zones 2D runtime | 28 |
| Liens canoniques | 27 |
| Portails runtime de campagne | 62 |
| Objectifs | 28 |
| Checkpoints | 28 |
| Props placés | 552 |
| Plateformes | 154 |
| Placements ennemis | 152 |
| Objectifs de boss | 9 |
| Objectifs non-boss authored | 19 |
| Cibles d’interaction | 25 |
| Largeur cumulée | 86 400 px |

Répartition des 28 objectifs :

| Méthode de complétion | Nombre |
|---|---:|
| Mort d’un ennemi ou boss ciblé | 9 |
| Cibles manuelles | 14 |
| Checkpoint atteint | 4 |
| Zone nettoyée | 1 |

Les cibles manuelles couvrent destruction de nœuds, purification, sauvetage,
refuge, récupération, amélioration et changement d’état du monde. Leur état
est sauvegardé cible par cible et une cible déjà activée ne doit pas compter
deux fois.

### Structure par acte

| Acte | Identité | Zones | Mission FPS | Boss liés aux objectifs |
|---|---|---:|---:|---|
| I | Forêt de Kai | 3 | 1 | Take-Mori |
| II | Bambouseraie de Shigure | 3 | 1 | Kumo |
| III | Rizières de Tsuru | 4 | 1 | Shiro-Kabuto |
| IV | Kurokawa | 4 | 1 | Brigadier Engeki |
| V | Château et faille | 5 | 1 | Daimyō corrompu, Yomi-no-Kanrei |
| VI | Japon contemporain | 4 | 1 | Colosse de la ligne Yomi |
| VII | Neo-Edo cyberpunk | 5 | 1 | Kannushi du réseau, Shogun Zero |

La route principale commence à `kai-forest-pass` et se termine à
`cyber-shogun-core`. Les anciens passages qui court-circuitaient la campagne
sont identifiés comme raccourcis de compatibilité et exclus de la nouvelle
chronique.

## Durée et densité

Les 28 zones totalisent 86 400 px de largeur. Aux vitesses définies dans le
moteur :

- marche à 112 px/s : environ **12 min 51 s** de déplacement théorique ;
- sprint à 178 px/s : environ **8 min 05 s**.

Ce calcul ne comprend pas combats, plateformes, objectifs, FPS, refuge,
cinématiques ou hésitations. Il prouve toutefois que le nombre de zones ne
suffit pas à démontrer une campagne longue. Les durées de `275`, `412` et
`533` minutes présentes dans le contrat de campagne sont des **cibles de
design**, pas des temps observés.

Pour annoncer honnêtement 8 à 10 heures, il reste à :

- faire au moins cinq playtests aveugles complets ;
- mesurer chaque acte séparément ;
- identifier le temps réellement consacré à de nouvelles décisions ;
- développer les actes trop courts avec branches, intérieurs, setpieces,
  retours transformés et conséquences ;
- publier la médiane observée, même si elle est inférieure à la cible.

## Level design, profondeur et props

### Points désormais solides

- toutes les zones possèdent au moins un objectif et un checkpoint ;
- chaque zone contient au moins quatre ennemis et deux plateformes ;
- Kurokawa utilise des murs continus derrière les bâtiments ;
- les deux props critiques, tour et foyer, ont une projection frontale pour le
  plan jouable ;
- les variantes trois-quarts sont réservées à l’arrière-plan ;
- le rendu trie les acteurs et props selon leur baseline et leur profondeur ;
- les portes `solidDoor` sont prises en compte par le joueur et la navigation
  ennemie ;
- les portes FPS optionnelles ne bloquent plus la rue ;
- les barrières d’arène d’Aka-Ushi disparaissent après le combat ;
- deux patrouilles qui coupaient des portes ont été bornées.

### Limites restantes

Le total de 552 props mesure une quantité de placements, pas leur qualité
visuelle. Plusieurs zones de campagne sont composées depuis des patrons
réutilisés. Elles doivent encore être inspectées à l’écran :

- début, milieu et fin de chaque zone ;
- continuité des murs et bâtiments ;
- contact réel avec le sol ;
- orientation frontale des éléments jouables ;
- cohérence de parallaxe ;
- colliders visibles ;
- sortie claire de chaque plateforme ;
- absence de prop de premier plan masquant une porte ou un ennemi.

Il manque également davantage de routes de profondeur : cours, rues
parallèles, caves, étages, arrière-boutiques, toits reliés et raccourcis
persistants. Une ville 2D crédible ne doit pas dépendre d’empilements verticaux
arbitraires.

## FPS

### Contenu présent

- 7 missions obligatoires, une par acte ;
- 5 missions historiques conservées ;
- 12 missions référencées au total ;
- entrée manuelle avec `E` ;
- purification persistante ;
- portes de retour et verrous de progression ;
- matériaux sémantiques pour sols, murs, portes et autels ;
- 24 matériaux FPS sémantiques ;
- 16 tuiles dédiées au contemporain et au cyberpunk ;
- 8 cellules de porte dédiées ;
- projection du sol en coordonnées monde ;
- atlas OpenAI spécifiques :
  `fps-modern-texture-atlas.png` et `fps-cyber-texture-atlas.png`.

Les sept missions de campagne s’appuient encore sur cinq géométries de base.
Le contemporain et Neo-Edo réemploient une géométrie avec deux profils de
matériaux distincts. Cette méthode est cohérente pour l’alpha, mais une version
finale demande des plans de salles et des setpieces propres aux lieux majeurs.

### Pipeline huit directions

Les manifests déclarent 105 ennemis :

| Famille | Nombre |
|---|---:|
| Ordinaires | 22 |
| Spéciaux | 24 |
| Sous-boss | 21 |
| Boss | 22 |
| Boss massifs | 10 |
| Historiques | 6 |
| **Total** | **105** |

Le contrat visé est :

```text
105 × 8 directions × 5 animations = 4 200 planches
4 200 × 6 frames = 25 200 cellules
```

Les 4 200 planches runtime sont présentes physiquement, dont 525 planches de
base et 3 675 planches dans les banques directionnelles. Elles représentent
227,98 MiB. Les 25 200 frames individuelles sont des exports dérivés,
régénérables et volontairement exclus de Git/Vercel ; les planches complètes
restent versionnées.

**État de validation : PASS technique sur `105/105`.**
Le contrôle exhaustif couvre 840 banques, 4 200 planches, 25 200 frames et
25 200 rigs. L’anti-composite, les axiales, les diagonales et le phase-lock
passent sans erreur. Une passe visuelle indépendante des neuf personnages
cross-era et d’un large échantillon historique ne trouve plus de double corps,
de membre fantôme ou de rupture de contact au sol.

Cette validation ferme la fusion gauche/droite. Elle ne transforme toutefois
pas les projections historiques en huit vues artistiques réellement dessinées,
travail qui reste nécessaire pour une version 1.0.

## Personnages et animations

Les 106 personnages déclarés par les manifests, joueur compris, possèdent cinq
états 2D de six frames :

```text
idle, move, attack, hurt, death
```

Cela correspond à 530 planches et 3 180 frames 2D attendues après
synchronisation du registre.

Akio possède également cinq planches FPS de six frames. La résolution et la
cohérence de base sont suffisantes pour l’alpha, mais cinq états ne couvrent
pas un jeu final.

Manquent encore pour Akio :

- marche, course, sprint, départ et freinage distincts ;
- saut, apex, chute et réception ;
- garde, parade, contre et posture brisée ;
- esquive et récupération ;
- combo léger 1/2/3 et lourd chargé ;
- interaction, ouverture, escalade et exécution ;
- dégainer, rengainer et changement d’arme ;
- animations par grande famille d’arme ;
- transitions FPS de garde, parade, impact et équipement.

Pour les ennemis, les cinq états génériques doivent être complétés selon le
rôle : alarme, garde, tir, rechargement, invocation, poursuite, saut,
télégraphe et phases de boss.

## Armes et cohérence aux mains

### Présent

- 61 sprites d’armes déclarés dans les manifests ;
- 53 armes intégrées à l’arsenal jouable ;
- 10 katanas ;
- trois armes débloquées au départ ;
- armes séparées des corps ;
- profils de rendu pour katana, lame courte, arme d’hast, lourde, bâton,
  flexible, arc, arme à feu, projectile, éventail et capture ;
- rangs d’amélioration jusqu’à `+5` ;
- dégâts, posture, coût de Ki, cadence et portée affectés par l’amélioration ;
- armes nouvelles pour le contemporain et Neo-Edo ;
- `neckRig` et phase détachable pour Aka-Ushi.

### À fermer

Les rigs automatiques réduisent les erreurs de couche, mais ne prouvent pas une
prise anatomique. Il reste à contrôler :

- poignée réellement au contact de la main ;
- seconde main pour les armes longues ;
- rotation cohérente en mouvement et attaque ;
- pivot et longueur des chaînes ;
- couche avant/arrière selon la direction ;
- persistance des pièces détachées ;
- neuf boss de campagne, frame par frame.

Une matrice de rendu corps + arme doit devenir une preuve de sortie, pas
seulement un fichier JSON valide.

## Combat et IA

### Présent

- combo léger ;
- lourd ;
- garde et parade parfaite ;
- esquive ;
- Ki et posture ;
- feedback chair, armure et esprit ;
- sang, étincelles, recul et sons d’impact ;
- les ennemis ne grossissent plus à l’impact ;
- machine à états 2D : patrouille, poursuite, investigation et retour ;
- vision, audition, mémoire, leash et aggro à l’impact ;
- attaque limitée au demi-plan regardé ;
- patrouilles bornées par les plateformes.

### À développer

- rôles de groupe réellement distincts ;
- alarme et renforts ;
- encerclement et retrait ;
- tireurs cherchant une ligne de vue ;
- utilisation des portes, échelles et routes de profondeur ;
- réactions spécifiques à l’eau, au feu, au brouillard et aux failles ;
- anti-stunlock et télégraphes homogènes ;
- phases de boss qui changent les règles, pas seulement les statistiques ;
- équilibrage des trois niveaux de difficulté.

Le catalogue contient beaucoup plus d’identités visuelles que de comportements
uniques. Le prochain gain de qualité vient de l’IA et des rencontres authored,
pas d’une nouvelle augmentation du roster.

## Refuge, économie et sauvegarde

### Fonctionnel

- sauvegarde schéma `2` ;
- zones visitées et nettoyées ;
- objectifs et cibles d’interaction ;
- boss et état runtime des boss ;
- checkpoints consommés ;
- équipement et déblocages ;
- monnaies, munitions et contamination ;
- refuge du Pin Noir ;
- quatre services : forge, infirmerie, dōjō, sanctuaire ;
- quatre contrats ;
- maîtrise et rangs d’armes ;
- récompenses idempotentes ;
- sept sceaux de campagne séparés des deux sceaux historiques ;
- fin reconnue dans `cyber-shogun-core`.

Le test de progression confirme notamment :

- amélioration d’arme jusqu’au niveau 4 testée dans le moteur ;
- multiplicateur de dōjō au niveau 5 ;
- réduction de contamination par les services ;
- checkpoint idempotent ;
- budget garanti de campagne ;
- conservation d’une zone nettoyée après recharge.

### Non équilibré

- rythme réel des gains et dépenses ;
- intérêt comparé des 53 armes ;
- coût des services du refuge ;
- cadence des déblocages ;
- valeur des contrats ;
- contamination sur une partie complète ;
- économie sans farm ;
- récompense de complétion.

Le système fonctionne, mais seule une télémétrie de playtest peut dire s’il
produit des choix intéressants.

## Lore et narration

Le prologue en six plans présente le Kegare, l’ordre du shogun et l’arrivée
d’Akio au col de Kai. La progression traverse ensuite Kurokawa, le château,
Tokyo contemporain et Neo-Edo, avec la faille du Yomi comme fil conducteur.

La cohérence macro est lisible, mais le milieu de campagne manque encore de
mise en scène :

- introductions et bilans d’acte ;
- dialogues de survivants ;
- antagonistes annoncés avant leur combat ;
- conséquences visibles au refuge ;
- échos entre les trois époques ;
- journaux et indices ;
- décisions ayant un effet sur la fin.

Le joueur doit pouvoir comprendre le récit sans lire les fichiers de design.

## UI/UX, mobile et accessibilité

### Présent

- HUD d’objectif ;
- sept sceaux de campagne affichés ;
- écran de campagne et refuge ;
- contrat, services et amélioration d’arme ;
- dōjō et sélection d’équipement ;
- pause et paramètres ;
- commandes tactiles ;
- zone de glisse FPS ;
- réduction des mouvements ;
- réglage de contraste et d’échelle du texte ;
- navigation clavier partielle des overlays.

### Restant

- remapping ;
- prise en charge manette complète ;
- glyphes dynamiques ;
- test sur téléphones physiques ;
- reprise après veille ;
- retours haptiques ;
- daltonisme ;
- sous-titres complets ;
- indicateurs directionnels des sons ;
- audit lecteur d’écran ;
- lisibilité du HUD pendant les boss massifs.

## Audio

Le moteur génère musiques et SFX avec Web Audio. Les pas et impacts distinguent
plusieurs matériaux et les époques moderne/cyber possèdent des profils
musicaux.

Il manque encore :

- une écoute comparative sur casque, ordinateur et téléphone ;
- un mix final ;
- des thèmes authored par acte et boss ;
- des transitions musicales de combat ;
- des curseurs séparés ;
- une vérification des télégraphes audio ;
- des sous-titres pour les informations essentielles.

## Performance et poids

Le chargement des images a été rendu différé : créer un objet image ne lance
plus immédiatement la requête et le moteur expose des métriques de chargement.
Cette correction est importante avec les banques directionnelles.

Les 227,98 MiB de planches ennemies FPS restent dans le tag GitHub immuable.
Vercel ne reçoit que le moteur, l’interface et le key art, soit environ
3,05 MiB estimés avant publication. Les assets sont chargés à la demande depuis
GitHub en production.

Risques encore ouverts :

- dépendance provisoire à GitHub Raw au lieu d’un stockage d’assets dédié ;
- débit et cache froid des 227,98 MiB de banques disponibles ;
- plusieurs milliers de fichiers dans le dépôt source ;
- pic mémoire après plusieurs actes ;
- cache d’images et éviction non profilés sur une partie longue ;
- débit mobile et cache froid non mesurés ;
- coût Canvas d’un boss massif avec plusieurs ennemis ;
- budget batterie inconnu.

Il faut mesurer avant de choisir entre PNG, WebP lossless, atlas plus compacts
ou streaming par acte.

## QA exécutée sur cet état

| Contrôle | Résultat |
|---|---|
| `campaign-runtime-smoke-test.js` | PASS — 7 actes, 28 zones |
| `campaign-fps-smoke-test.js` | PASS — 7 missions campagne, 5 historiques |
| `campaign-objective-runtime-smoke-test.js` | PASS — persistance et anti-doublon |
| `campaign-save-smoke-test.js` | PASS — schéma 2 et récupération backup |
| `progression-integrity-smoke-test.js` | PASS |
| `fps-era-materials-smoke-test.js` | PASS — 16 tuiles dédiées |
| `coherence-smoke-test.js` | PASS |
| `visual-data-smoke-test.js` | PASS — 28 zones, 552 props |
| `fps-directional-runtime-smoke-test.js` | PASS — 105/105, 840 banques, 4 200 planches |

Ces résultats ne valident pas :

- un playthrough complet sans debug ;
- la durée ;
- toutes les diagonales FPS ;
- chaque socket d’arme ;
- les 84 captures de contrôle des zones ;
- un téléphone réel ;
- une manette ;
- l’audio humain ;
- la charge réseau ;
- le CPU, la mémoire et la batterie ;
- un déploiement de production.

## Priorités de fermeture

### P0 — bloquant avant content lock

1. remplacer les projections historiques prioritaires par de vraies vues
   authored, sans réintroduire de double silhouette ;
2. sockets d’armes contrôlés sur les boss et familles utilisées ;
3. trois playthroughs techniques complets sans impasse ;
4. audit visuel des 28 zones ;
5. profilage du chargement différé et du poids statique ;
6. cache-busting cohérent entre HTML, données et moteur.

### P1 — contenu nécessaire au jeu complet

1. durée prouvée par cinq playtests aveugles ;
2. branches, secrets, raccourcis et retours transformés par acte ;
3. géométries FPS propres aux lieux majeurs ;
4. animations complètes d’Akio et états spécifiques des ennemis ;
5. IA de groupe et boss réellement différenciés ;
6. économie, refuge et progression équilibrés ;
7. narration et conséquences visibles sur les sept actes.

### P2 — finition et sortie

1. manette, remapping, accessibilité et tests mobile ;
2. musique, SFX et mix final ;
3. compatibilité navigateurs et migration de sauvegarde ;
4. difficulté, localisation et polish UI ;
5. bêta externe et correction des retours ;
6. publication depuis un commit validé ;
7. NG+, boss rush et arcade après la campagne 1.0.

## Conclusion

La structure de campagne demandée est désormais dans le runtime : 7 actes,
28 zones, 7 missions FPS obligatoires, progression persistante et fin
cyberpunk. Ce qui reste n’est plus principalement « ajouter des zones », mais
**valider chaque asset en situation, densifier les actes, compléter les
animations, différencier les rencontres et prouver la durée par le jeu réel**.

Le projet pourra être présenté comme jeu complet lorsque le P0 sera fermé, que
la grille P1 sera satisfaite pour les sept actes et qu’une bêta aura démontré
durée, stabilité et lisibilité sur les supports visés.
