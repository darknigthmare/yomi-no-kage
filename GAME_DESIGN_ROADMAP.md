# Yomi no Kage — ce qu’il reste pour atteindre le jeu complet

## Position honnête du projet

`Yomi no Kage` n’est plus un prototype à une rue. Le runtime contient une
route complète de la forêt de Kai au Shogun Zero :

| Mesure vérifiée | État actuel |
|---|---:|
| Actes | 7 |
| Zones 2D | 28 |
| Liens entre zones | 27 |
| Portails de campagne | 62 |
| Objectifs | 28 |
| Checkpoints | 28 |
| Props placés | 552 |
| Plateformes | 154 |
| Placements ennemis | 152 |
| Missions FPS obligatoires | 7 |
| Missions FPS historiques | 5 |
| Largeur 2D cumulée | 86 400 px |

Le jeu possède également un refuge, quatre services, quatre contrats, une
économie, des améliorations d’armes, de la maîtrise, de la contamination et
une sauvegarde persistante.

Cette structure forme une **campagne alpha jouable**, pas encore un jeu
commercial terminé. Les chiffres de durée contenus dans les données sont des
objectifs de design, pas des mesures. À 112 px/s, les 86 400 px représentent
environ 12 min 51 s de déplacement horizontal théorique ; à 178 px/s, environ
8 min 05 s de sprint. Les combats et le FPS rallongent la partie, mais aucune
durée de 8 à 10 heures ne peut être annoncée sans playtests complets.

## Définition de « jeu complet »

Le projet pourra être appelé `1.0` lorsque les conditions suivantes seront
toutes vraies :

1. la campagne est terminable naturellement du prologue au Shogun Zero sans
   debug, raccourci historique ni impasse ;
2. une sauvegarde peut être reprise à chaque acte sans perte, duplication de
   récompense ou réapparition d’une zone nettoyée ;
3. les 105 ennemis FPS possèdent huit directions utilisables, une silhouette
   unique par frame et des armes correctement attachées ;
4. les armes 2D et FPS restent devant ou derrière le corps selon leur socket
   authored, jamais selon un correctif global approximatif ;
5. les 28 zones ont été inspectées visuellement et ne contiennent plus de prop
   flottant, collider invisible incohérent ou obstacle bloquant une porte ;
6. chaque acte possède une identité de gameplay, un arc narratif, un setpiece,
   un boss réellement différent, un bilan et une progression utile ;
7. la durée cible est démontrée par des playtests, pas estimée depuis le nombre
   de zones ;
8. le jeu est jouable au clavier-souris, à la manette et sur mobile réel ;
9. les performances, le son, l’accessibilité et la sauvegarde ont passé une
   matrice de tests de sortie ;
10. la version GitHub et la version publiée correspondent au même build validé.

## P0 — fermer les blocages techniques et visuels

Ces tâches passent avant l’ajout de nouveau contenu.

### P0.1 — terminer le pipeline FPS huit directions

État actuel :

- 105 ennemis sont déclarés et résolus dans le registre ;
- 8 directions, 5 animations et 6 frames sont disponibles ;
- 4 200 planches logiques et 25 200 cellules sont exportées ;
- l’anti-fusion, le phase-lock, les axiales et diagonales passent les
  validateurs exhaustifs ;
- les orientations historiques dérivées restent des projections propres, pas
  encore huit vues artistiques réellement dessinées.

Travail restant :

- remplacer progressivement les projections des ennemis historiques utilisés
  dans la campagne par des vues `front`, `back` et diagonales authored ;
- conserver le contrat anti-composite et le phase-lock lors de ces remplacements ;
- inspecter visuellement 100 % des boss et sous-boss après remplacement ;
- valider le chargement à la demande et l’éviction du cache.

Critères de sortie :

- `105 × 8 × 5 = 4 200` chemins de planches résolus ;
- aucune frame manquante ;
- aucune double silhouette dans les planches de contrôle ;
- passage vert du validateur directionnel et du validateur modulaire ;
- inspection visuelle de 100 % des boss et sous-boss utilisés dans la
  campagne, plus un échantillon de chaque famille ordinaire et spéciale.

### P0.2 — verrouiller les sockets d’armes

Travail restant :

- générer une matrice de rendu corps + arme pour chaque animation utilisée ;
- corriger manuellement les sockets qui ne touchent pas la main ;
- définir deux mains quand l’arme l’exige ;
- vérifier rotation, pivot, échelle, profondeur et masquage dans les huit
  directions FPS ;
- vérifier les armes longues, chaînes et pièces détachables segment par
  segment ;
- tester le joug d’Aka-Ushi, la porte du Colosse du métro, le shakujo
  holographique et le nodachi de phase.

Critères de sortie :

- zéro arme derrière le personnage lorsqu’elle doit être au premier plan ;
- zéro poignée flottante ou traversant le torse ;
- zéro changement d’échelle lors d’un impact ;
- persistance correcte des pièces détachées après sauvegarde et recharge ;
- validation visuelle frame par frame des neuf boss de campagne.

### P0.3 — playthrough technique de bout en bout

Travail restant :

- jouer les 28 zones dans l’ordre sans commande debug ;
- accomplir les 28 objectifs et les sept missions FPS obligatoires ;
- tester chaque porte avant et après l’objectif qui la verrouille ;
- recharger au moins une sauvegarde par acte ;
- mourir avant et après un checkpoint ;
- revenir dans une zone nettoyée ;
- vérifier les sept sceaux puis la fin après le Shogun Zero ;
- tester aussi une nouvelle chronique avec une ancienne sauvegarde locale.

Critères de sortie :

- trois runs techniques consécutifs terminés sans impasse ;
- `28/28` objectifs persistants ;
- `7/7` sceaux persistants ;
- aucune récompense reçue deux fois ;
- aucun ennemi vaincu réapparu après `Continuer` ;
- aucun ancien portail capable de contourner la route canonique.

### P0.4 — cohérence spatiale des 28 zones

Travail restant :

- produire des captures de début, milieu et fin pour chaque zone ;
- contrôler baseline, sol, profondeur, parallaxe et perspective des props ;
- vérifier que murs, maisons et bâtiments forment des compositions continues ;
- supprimer les props de premier plan sans fonction visuelle ou ludique ;
- aligner les colliders sur les objets visibles ;
- tester chaque arche, porte, puits, brasero, tour, toit, charrette et
  plateforme ;
- séparer clairement fond lointain, architecture intermédiaire, plan jouable
  et occultation de premier plan.

Critères de sortie :

- `84` captures de contrôle minimum, trois par zone ;
- zéro prop flottant ;
- zéro collider invisible bloquant la route ;
- zéro porte masquée par une couche de premier plan ;
- toutes les surfaces escaladables ont une silhouette et une sortie lisibles.

### P0.5 — poids, chargement et stabilité navigateur

Le pack directionnel représente plusieurs milliers de PNG. Le chargement
différé évite de tout demander à l’écran titre, mais il doit être mesuré.

Travail restant :

- mesurer le transfert initial, le temps jusqu’au premier contrôle et le pic
  mémoire ;
- confirmer que seuls le biome, les personnages et les directions visibles
  sont chargés ;
- profiler le Canvas pendant une foule, un boss massif et une mission FPS ;
- migrer le tag GitHub Raw provisoire vers un CDN/stockage d’objets avec
  budgets, cache immuable et contrôle de disponibilité ;
- décider si les planches doivent être converties en WebP lossless ou
  regroupées autrement ;
- vérifier les erreurs réseau et les limites du fournisseur d’hébergement.

Critères de sortie :

- aucune requête vers les 4 200 planches au démarrage ;
- aucune erreur 404 ;
- 60 FPS cible sur ordinateur de référence, 30 FPS minimum stable sur mobile
  de référence ;
- aucune pause visible lors d’un changement de direction ennemi ;
- budgets de transfert, mémoire et temps de chargement consignés dans l’audit.

## P1 — transformer la campagne alpha en campagne complète

### P1.1 — prouver et construire la durée

L’ambition reste une histoire principale de 8 à 10 heures, mais ce chiffre
n’est pas acquis.

Travail restant :

- chronométrer cinq joueurs qui ne connaissent pas le projet ;
- exclure les pauses et noter séparément combat, exploration, FPS, refuge et
  cinématiques ;
- identifier les actes terminés en moins de 45 minutes ;
- ajouter des situations, des choix et des routes, pas seulement de la largeur ;
- retester après chaque passe de contenu.

Critères de sortie :

- au moins cinq playtests aveugles complets ;
- médiane de 8 heures minimum pour la route principale si la cible 8–10 h est
  conservée ;
- médiane de 10 heures minimum pour la complétion ;
- aucun acte sous 45 minutes lors d’une première partie ;
- moins de 20 % du temps consacré à des allers-retours sans nouvelle décision.

Si ces mesures ne sont pas atteintes, la communication doit annoncer la durée
observée et non la durée souhaitée.

### P1.2 — donner de la profondeur à chaque acte

Chaque acte doit proposer autre chose qu’une succession de zones horizontales.

Contenu cible par acte :

- une route principale claire ;
- au moins une branche optionnelle qui rejoint la route ;
- un intérieur FPS obligatoire ;
- un secret ou intérieur FPS optionnel ;
- trois secrets lisibles ;
- un raccourci persistant ;
- une rencontre signature ;
- un retour dans un lieu transformé ;
- un boss et une séquence de sortie ;
- une conséquence visible au refuge ou dans une époque future.

Les niveaux verticaux restent réservés aux lieux qui les justifient : donjon,
résidence à étages, métro, data center. En ville, la profondeur doit être
simulée par des portes, cours, rues parallèles, arrière-boutiques et toits.

Critères de sortie :

- sept actes contrôlés avec une grille identique ;
- aucun acte composé uniquement d’un couloir ;
- chaque branche contient une récompense ou une décision unique ;
- chaque retour transformé change au moins l’ennemi, la route ou le service
  disponible.

### P1.3 — enrichir les objectifs

Le runtime contient déjà 28 objectifs :

- 9 éliminations de boss ;
- 14 objectifs à cibles manuelles ;
- 4 objectifs atteints par checkpoint ;
- 1 défense par nettoyage de zone ;
- 25 cibles d’interaction.

Travail restant :

- ajouter une mise en scène, un état intermédiaire et un échec lisible aux
  objectifs de défense, sauvetage et purification ;
- rendre les PNJ sauvés visibles au refuge ;
- faire modifier le monde par les vannes, cloches, sceaux et générateurs ;
- éviter que trois interactions identiques soient seulement trois barres à
  remplir ;
- ajouter un bilan d’acte avec récompense et conséquence.

Critères de sortie :

- chaque objectif change visuellement ou mécaniquement la zone ;
- aucun objectif ne peut se compléter avant que son action soit réalisée ;
- chaque cible déjà activée reste activée après recharge ;
- au moins un objectif spécifique à la vue FPS et un à la vue 2D par acte.

### P1.4 — compléter les animations d’Akio

Akio possède actuellement cinq états génériques en 2D et cinq en FPS :
`idle`, `move`, `attack`, `hurt`, `death`.

Planches encore nécessaires pour une animation complète :

- départ, marche, course, sprint et freinage ;
- saut, apex, chute et réception ;
- garde, parade, contre et posture brisée ;
- esquive et récupération ;
- combo léger 1, 2 et 3 ;
- attaque lourde chargée et relâchée ;
- interaction, ouverture, escalade et exécution ;
- dégainer, rengainer et changer d’arme ;
- poses propres aux lames courtes, armes d’hast, lourdes, flexibles, arcs et
  armes à feu ;
- transitions FPS entrée, sortie, garde, parade et impact.

Critères de sortie :

- aucun changement d’état instantané sans transition visible ;
- pieds stables sur le sol pendant la marche ;
- mêmes proportions, palette et visage sur toutes les planches ;
- armes interchangeables sans redessiner le corps ;
- cadence d’animation reliée à la vitesse réelle du personnage.

### P1.5 — différencier ennemis et boss par le gameplay

Le catalogue est plus large que les comportements disponibles. Ajouter encore
des sprites n’est pas prioritaire tant que les rôles ne sont pas distincts.

Travail restant :

- créer des rôles de mêlée, garde, tireur, soutien, alarme, chasseur et contrôle
  de zone ;
- faire utiliser aux groupes l’encerclement, le retrait et les renforts ;
- authored les patrouilles par plateforme et les lignes de vue ;
- donner aux boss des phases, télégraphes, faiblesses et arènes propres ;
- lier les boss massifs au décor sans les transformer en simples sprites plus
  grands ;
- équilibrer la transition 2D/FPS des boss multi-vues.

Critères de sortie :

- au moins six rôles IA reconnaissables sans regarder le nom de l’ennemi ;
- chaque boss de campagne possède au moins deux patterns exclusifs ;
- aucune attaque obligatoire sans télégraphe ;
- aucune phase de boss uniquement basée sur plus de points de vie ;
- tests de difficulté sur les trois profils visés.

### P1.6 — équilibrer économie, refuge et équipement

Présent :

- 53 armes jouables ;
- quatre monnaies principales ;
- quatre services de refuge ;
- améliorations jusqu’au rang `+5` ;
- quatre contrats ;
- récompenses d’objectif garanties.

Travail restant :

- définir le rythme d’acquisition des 53 armes ;
- empêcher une arme ou un projectile de dominer toutes les situations ;
- équilibrer coût, Ki, posture, portée et cadence ;
- limiter les ressources garanties pour préserver les choix ;
- créer des recettes, armures, omamori et techniques réellement jouables ;
- afficher clairement l’effet des niveaux de forge, infirmerie, dōjō et
  sanctuaire ;
- tester une partie sans farm et une partie de complétion.

Critères de sortie :

- aucune amélioration obligatoire ne nécessite de rejouer une zone vidée ;
- chaque grande famille d’arme possède un avantage et un coût identifiables ;
- au moins trois configurations viables par acte final ;
- dépenses et gains suivis sur cinq parties complètes ;
- aucun verrou narratif dépend d’une monnaie épuisable.

## P2 — finition, accessibilité et sortie

### P2.1 — narration et cohérence du monde

- écrire les introductions, transitions et bilans des sept actes ;
- ajouter dialogues de refuge, survivants et antagonistes ;
- montrer les conséquences entre 1638, le Japon contemporain et Neo-Edo ;
- intégrer journaux, indices et codex sans interrompre le rythme ;
- relire le vocabulaire, les noms et la chronologie avec la bible de lore ;
- produire une fin complète et ses variantes si les choix deviennent
  déterminants.

Critère de sortie : chaque acte répond à « où suis-je, pourquoi je combats,
qu’est-ce qui a changé et quelle est la conséquence ? » sans dépendre du
README.

### P2.2 — UI, manette et accessibilité

- remapping clavier et manette ;
- navigation complète sans souris ;
- glyphes de commandes dynamiques ;
- réglage des zones tactiles sur plusieurs tailles de téléphone ;
- taille de texte, contraste, daltonisme et tremblement d’écran ;
- sous-titres et indicateurs directionnels des sons importants ;
- lisibilité du HUD pendant les boss ;
- reprise après mise en veille mobile.

Critères de sortie :

- campagne terminable au clavier-souris, à la manette et sur tactile ;
- aucun écran bloqué au clavier ;
- texte lisible à 200 % ;
- test sur au moins deux téléphones physiques de tailles différentes.

### P2.3 — musique, SFX et mix

- remplacer ou compléter les boucles Web Audio par une direction musicale
  authored ;
- créer un thème et des transitions pour chaque acte et boss majeur ;
- mixer chair, armure, esprit, armes, pas et ambiances ;
- ajouter réglages musique, effets et ambiance séparés ;
- tester casque, haut-parleurs d’ordinateur et téléphone.

Critères de sortie :

- aucun son agressif ou inaudible sur les trois supports ;
- télégraphes de boss audibles ;
- voix et informations essentielles sous-titrées ;
- absence de saturation pendant une foule.

### P2.4 — QA, compatibilité et publication

- Chrome, Edge, Firefox et Safari ;
- desktop 16:9, écrans étroits et mobile paysage ;
- réseau lent, cache froid et cache chaud ;
- migration de sauvegarde ;
- veille/reprise et perte de focus ;
- audit des erreurs console ;
- vérification des URL d’assets ;
- build GitHub et déploiement issus du même commit.

Critères de sortie :

- zéro bug P0 ouvert ;
- zéro erreur console sur les parcours de sortie ;
- sauvegarde migrée sans perte depuis le schéma précédent ;
- checklist de régression passée sur le commit publié ;
- URL de production testée après déploiement.

### P2.5 — longévité après la campagne

Ces modes enrichissent le jeu, mais ne doivent pas retarder la campagne 1.0 :

- NG+ ;
- boss rush ;
- mode arcade ;
- contrats avancés ;
- rangs par acte ;
- défis sans soin, parade parfaite et maîtrise des dix katanas ;
- fins alternatives.

## Ordre de production recommandé

### Jalonnage A — candidat technique

- P0.1 à P0.5 terminés ;
- trois runs techniques complets ;
- registre directionnel `105/105` ;
- aucune impasse ou incohérence de sauvegarde ;
- budgets de chargement documentés.

### Jalonnage B — content lock

- les sept actes passent la grille P1 ;
- animations d’Akio complétées ;
- boss et IA différenciés ;
- économie jouable sans debug ;
- dialogues et conséquences intégrés.

### Jalonnage C — bêta

- cinq playtests aveugles ;
- durée réelle publiée ;
- équilibrage des trois difficultés ;
- manette, mobile, audio et accessibilité validés ;
- plus aucun ajout de système majeur.

### Jalonnage D — version 1.0

- zéro bug bloquant ;
- correctifs de bêta intégrés ;
- tests de régression verts ;
- commit GitHub identifié ;
- déploiement de production vérifié ;
- documentation alignée avec le build réellement livré.

## Priorité immédiate

La prochaine livraison doit fermer le P0 : huit directions FPS validées,
sockets d’armes fiables, parcours complet sans impasse, audit visuel des
28 zones et budget de chargement mesuré. Ajouter de nouveaux ennemis ou de
nouvelles zones avant cette fermeture augmenterait surtout la dette de
validation.
