# Yomi no Kage — audit complet après l’extension du monde

**Date :** 19 juillet 2026
**État audité :** `level-data.js?v=12`, `game.js?v=37`, `cinematic.js?v=10`
**Build spatial :** `20260719-world-expansion-v3`
**Périmètre :** cohérence des niveaux, profondeur, gameplay, durée, progression, animations 2D/FPS, armes, boss massifs, UI/UX, mobile, audio, lore, sauvegarde, performance et QA.

> Les validations automatiques prouvent la structure des données et certains parcours runtime. Les captures prouvent quelques états visuels ciblés. Elles ne remplacent pas un playthrough naturel complet, un test sur téléphone réel, une écoute humaine ni un profilage de performance.

## Verdict

`Yomi no Kage` a quitté le stade du petit prototype à une rue : il possède maintenant une vraie route de campagne jouable allant du col de Kai à Neo-Edo, onze zones 2D reliées, cinq missions FPS, sept identités environnementales, une sauvegarde persistante et un boss massif équipé d’une pièce détachable.

Le projet reste cependant une **vertical slice étendue**, pas encore un jeu complet de 8 à 10 heures. Les défauts les plus importants ne sont plus des props flottants ou des armes systématiquement derrière les corps. Ce sont désormais :

1. les directions ennemies FPS encore synthétisées depuis des profils ;
2. les sockets d’armes calculés par détection de contour au lieu d’être dessinés anatomiquement ;
3. les cinq nouveaux biomes qui servent surtout de zones vitrines linéaires ;
4. l’absence d’un vrai chapitre complet avec embranchements, intérieurs, setpieces, sous-boss, boss, extraction et retour transformé ;
5. l’absence de Yomi-no-Kanrei et de boss propres au Japon contemporain et cyberpunk.

## Livraison réellement présente

### Monde et cohérence spatiale

- 11 zones 2D runtime.
- 31 600 px de largeur cumulée.
- 245 props, 73 plateformes, 66 ennemis, 28 passages et 7 checkpoints.
- Départ d’une nouvelle chronique : `kai-forest-pass`.
- Progression :
  `forêt → bambouseraie → rizières → Kurokawa → château → Japon contemporain → Neo-Edo`.
- Retours explicites :
  bambouseraie → forêt, champs → bambouseraie, Kurokawa → champs,
  contemporain → château et cyberpunk → contemporain.
- Objectif authored par zone grâce à `objectivePortalId`.
- Minicarte ajustée aux nouvelles coordonnées négatives et positives.
- Continuité visuelle contextuelle :
  forêt, rideau de bambou, horizon rural, façades urbaines et murs historiques.
- Validation spatiale automatisée :
  11 zones, 245 placements, 102 sprites uniques et 109 modules de mur, sans erreur.

La tour de guet et le foyer d’incendie du plan jouable sont maintenant des sprites orthographiques de face. Les anciennes variantes 3/4 sont conservées comme sources ou éléments d’arrière-plan, sans collision de gameplay.

### Profondeur et plateformes

Kurokawa possède des murs continus derrière les bâtiments, des portes lisibles et un tri par baseline. Les plateformes correspondent à des objets plausibles : toits, échafaudages, charrettes, auvents, remparts et véhicules.

La profondeur reste surtout simulée. La majorité des zones n’a qu’un long segment de sol et cinq plateformes `oneWay`. Les portes relient des zones, mais il manque encore :

- rues parallèles réellement explorables ;
- cours, caves, étages et arrière-boutiques ;
- raccourcis persistants ;
- boucles rejoignant une même zone par un autre niveau ;
- fosses, eau, pentes et ponts cassés comme vraies contraintes de navigation.

### Prologue et lore

Le prologue, le briefing, le lore, le spawn et la sauvegarde commencent désormais tous au col forestier de Kai.

Le sixième plan a été régénéré avec OpenAI ImageGen :

- Akio reste fidèle à son identité visuelle ;
- forêt de cèdres au premier plan ;
- bambouseraie et rizières en profondeur ;
- Kurokawa brûle seulement au loin ;
- l’ancien torii urbain n’indique plus qu’Akio est déjà entré dans la ville.

L’ancien plan est conservé sous
`assets/generated/cinematics/prologue-06-kurokawa-town-source.png`.
Le prompt et la provenance sont consignés dans
`assets/generated/cinematics/manifest.json`.

Le mode d’aperçu `?preview=prologue-6` ignorait auparavant le preview lorsqu’une sauvegarde existait. Cette régression est corrigée. Le dernier bouton annonce maintenant « Ouvrir le briefing ».

### Progression et sauvegarde

La progression runtime et le contrat de campagne sont distincts :

- le runtime livre 11 zones et 28 passages ;
- `campaign-expansion.js` décrit un plan futur de 7 actes, 28 zones et 24 nouveaux ennemis ;
- ce contrat de production n’est volontairement pas chargé comme gameplay.

La sauvegarde conserve maintenant :

- zone, chapitre et checkpoint ;
- zones visitées ;
- objets déjà ramassés ;
- checkpoints déjà consommés ;
- ennemis vaincus ;
- score et nombre de victimes ;
- missions FPS secondaires terminées ;
- équipement et progression des sceaux.

Les checkpoints ne peuvent plus soigner indéfiniment par aller-retour.

L’endgame impose :

1. vaincre le Daimyō dans le FPS du donjon ;
2. poser le second sceau ;
3. revenir au donjon 2D ;
4. confirmer l’entrée dans la faille temporelle ;
5. nettoyer le Japon contemporain avant Neo-Edo ;
6. nettoyer Neo-Edo ;
7. confirmer le scellement du cœur du Yomi.

Les deux actions irréversibles utilisent une double confirmation en moins de 4,5 secondes. Le rang S a été recalibré pour la campagne longue : santé ≥ 70, 40 victimes et moins de 10 800 secondes.

### Armes et montage aux mains

Le pack contient :

- 58 assets d’armes modulaires ;
- 53 armes dans l’arsenal jouable ;
- 3 060 rigs ennemis 2D ;
- 2 880 rigs ennemis FPS historiques ;
- 30 rigs joueur 2D et 30 rigs joueur FPS ;
- 6 000 poses d’arme au total.

Politique runtime :

- poses vivantes : `front-body` ;
- mort : `hidden` ;
- les armes ne repassent plus derrière le corps par défaut ;
- une arme ennemie FPS de face/dos est masquée lorsqu’aucun socket directionnel fiable n’existe.

Cette correction supprime le défaut grossier de couche. Elle ne prouve pas une prise anatomique parfaite. Le générateur trouve les mains par heuristique de contour opaque. Il faut encore créer des sockets manuels pour chaque personnage réellement utilisé et chaque direction FPS.

### Aka-Ushi et son joug

Aka-Ushi possède maintenant :

- un joug frontal séparé ;
- un `neckRig` complet : 5 animations × 6 frames = 30 ancres ;
- synchronisation entre `sprite.json`, `registry.json` et `catalog.json` ;
- suivi image par image de l’ancre, de l’échelle et de la couche ;
- détachement à la transition de phase 2 ;
- création d’un hazard persistant dans l’arène ;
- collision, dégâts, rendu et snapshot debug du joug détaché.

Limite restante : l’état du hazard détaché n’est pas encore sauvegardé lors d’une recharge ou d’un changement de zone.

### Personnages et animations

Le catalogue contient :

| Élément | Mesure confirmée |
|---|---:|
| Personnages | 103 |
| Ennemis | 102 |
| Planches 2D | 515 |
| Frames 2D | 3 090 |
| Ennemis historiques avec FPS | 96 |
| Planches ennemies FPS | 480 |
| Frames ennemies FPS | 2 880 |
| Planches joueur FPS | 5 |
| Frames joueur FPS | 30 |
| Sprites environnementaux | 218 |
| Assets uniques du catalogue | 379 |

Six ennemis ont été ajoutés pour le contemporain et le cyberpunk :

- `new-modern-commuter`
- `new-modern-riot-host`
- `new-modern-response-officer`
- `new-cyber-neon-shinobi`
- `new-cyber-drone-corpse`
- `new-cyber-oni-frame`

Chacun possède cinq planches 2D de six frames avec corps et arme séparés. Aucun de ces six ennemis ne possède encore de banque FPS.

Les 103 personnages n’ont que cinq états génériques :
`idle`, `move`, `attack`, `hurt`, `death`.
Cela ne suffit pas pour un jeu final.

Akio a encore besoin de :

- départ, freinage, marche, course et sprint ;
- saut, apex, chute et réception ;
- garde, parade, contre et posture brisée ;
- esquive et récupération ;
- combo léger 1/2/3 ;
- lourd chargé ;
- interaction, ouverture, escalade et exécution ;
- dégainer, rengainer et changement d’arme ;
- animations propres aux grandes familles d’armes.

### FPS

Le FPS possède cinq missions et des sols texturés cohérents par matériau. Le son distingue maintenant bois, pierre, tatami, eau, métal, asphalte, technologie et terre. Le contemporain et le cyberpunk ont leurs propres états musicaux.

Les problèmes critiques encore ouverts :

- seulement quatre orientations logiques sont affichées ;
- face et dos restent des transformations de profils latéraux ;
- les silhouettes ne regardent donc pas toujours réellement le joueur ;
- les six ennemis modernes/cyber n’ont aucun contenu FPS ;
- les armes face/dos sont masquées, ce qui évite le flottement mais révèle un manque d’animation ;
- les missions historiques ne disposent pas encore d’une passe complète de composition architecturale par pièce.

La qualité cible demande huit directions dessinées par état :
`front`, `front-left`, `left`, `back-left`, `back`, `back-right`, `right`, `front-right`,
avec deux sockets de mains par frame.

### IA et combat

L’IA 2D possède une vraie machine à états :

- patrouille ;
- poursuite ;
- investigation ;
- retour au poste ;
- vision, audition, mémoire et leash ;
- borne de patrouille par plateforme ;
- aggro à l’impact ;
- attaque limitée au demi-plan regardé ;
- navigation sous les plateformes hautes.

Ce socle est correct, mais les ennemis manquent encore de rôles de groupe :

- alarme et renforts ;
- soutien, encerclement et retrait ;
- tireurs cherchant une ligne de vue ;
- ennemis utilisant portes, échelles et routes de profondeur ;
- comportement spécifique à l’eau, au feu, au brouillard et aux failles ;
- setpieces authored au lieu de simples vagues alignées.

Le feedback de coup utilise sang, étincelles, impact d’armure, recul et son adapté. Les ennemis ne grossissent plus lorsqu’ils sont touchés.

### UI/UX, mobile et accessibilité

Présent :

- objectifs par zone ;
- minicarte adaptée à l’extension ;
- briefing, pause, paramètres et dojo ;
- zone tactile de rotation FPS ;
- boutons de combat mobile ;
- réduction des mouvements ;
- contraste renforcé et échelle de texte ;
- navigation clavier des overlays.

Encore à valider ou construire :

- remapping ;
- manette ;
- taille et espacement sur plusieurs téléphones réels ;
- retours haptiques ;
- mode daltonisme ;
- sous-titres et visualisation directionnelle des sons ;
- lisibilité du HUD pendant les boss ;
- audit lecteur d’écran complet ;
- reprise après mise en veille mobile.

### Audio et performance

Les musiques et SFX sont générés par Web Audio. Les matériaux, les coups et les deux époques futures ont des profils distincts.

Il n’existe encore :

- aucune écoute humaine comparative sur casque et téléphone ;
- aucun mix final ;
- aucun thème de boss contemporain/cyber authored ;
- aucune mesure de CPU Canvas ;
- aucun profil mémoire ;
- aucun budget batterie mobile ;
- aucun test de temps de chargement à réseau lent.

## Mesures du level design

| Zone | Largeur | Props | Plateformes | Ennemis | Passages | Checkpoints |
|---|---:|---:|---:|---:|---:|---:|
| Grande rue de Kurokawa | 2 500 | 46 | 15 | 6 | 4 | 0 |
| Ruelle des puits | 2 500 | 38 | 6 | 6 | 3 | 0 |
| Marché oriental | 2 500 | 34 | 2 | 4 | 4 | 1 |
| Cour basse du château | 2 500 | 25 | 12 | 5 | 2 | 0 |
| Résidence du daimyō | 2 400 | 21 | 6 | 5 | 3 | 0 |
| Donjon supérieur | 2 500 | 22 | 7 | 5 | 3 | 1 |
| Forêt noyée de Kai | 3 300 | 12 | 5 | 7 | 1 | 1 |
| Bambouseraie de Shigure | 3 200 | 11 | 5 | 7 | 2 | 1 |
| Rizières de Tsuru | 3 400 | 12 | 5 | 7 | 2 | 1 |
| Tokyo contemporain | 3 300 | 12 | 5 | 7 | 2 | 1 |
| Neo-Edo cyberpunk | 3 500 | 12 | 5 | 7 | 2 | 1 |
| **Total** | **31 600** | **245** | **73** | **66** | **28** | **7** |

Les zones ajoutées restent courtes et très horizontales. La route marchable cumulée mesurée lors de la composition est d’environ 29 240 px. À 112 px/s, cela représente environ 4 min 21 s de marche pure ; à 178 px/s, 2 min 44 s de sprint. Les combats allongent cette durée, mais la géométrie actuelle ne peut pas soutenir seule une campagne de 8 à 10 heures.

Une zone vitrine devient un chapitre lorsqu’elle possède :

- 5 à 7 chunks aux fonctions distinctes ;
- 10 à 14 écrans de gameplay ;
- une route principale et deux branches ;
- un intérieur FPS obligatoire et un optionnel ;
- trois secrets ;
- un setpiece ;
- une rencontre de sous-boss ;
- un boss ;
- un retour transformé ;
- une extraction, une récompense et un bilan.

## Priorités

### P0 — qualité visuelle et combat

1. Dessiner huit directions FPS pour les ennemis réellement présents dans le premier chapitre.
2. Poser manuellement les sockets de mains de ces directions.
3. Produire les banques complètes d’Akio par famille d’arme.
4. Sauvegarder l’état du joug détaché d’Aka-Ushi.
5. Jouer Yomi-no-Kanrei comme seconde forme réelle, pas comme simple entrée de catalogue.

### P1 — transformer les biomes en chapitres

1. Développer forêt, bambouseraie et champs en un premier acte de 60 à 90 minutes.
2. Ajouter routes de profondeur, intérieurs, raccourcis et retours transformés.
3. Construire une rencontre signature et un boss par biome.
4. Développer Kurokawa comme chapitre de référence.
5. Donner au contemporain et au cyberpunk leurs propres intérieurs FPS, boss et objectifs.

### P2 — systèmes de longévité

1. Refuge vivant et artisans.
2. Choix purifier / brûler / prélever.
3. Contamination évolutive de la carte.
4. Fins multiples et NG+.
5. Contrats, boss rush et mode arcade.
6. Difficultés, remapping, manette, localisation et accessibilité.

## Updates de design recommandées

1. **Échos temporels**
   Une décision prise en 1638 modifie le même lieu dans le Japon contemporain et Neo-Edo.

2. **Arsenal de chasse**
   Les pièces détachées des boss deviennent des composants. Chaque famille d’arme débloque une animation et un contre propres.

3. **Boss multi-vues authored**
   Une phase 2D détruit des pièces, une transition cinématique change l’espace, puis une phase FPS exploite les conséquences.

4. **Contamination dynamique**
   Les zones ignorées changent de roster, ferment une route ou contaminent un marchand.

5. **Refuge vivant**
   Les survivants et artisans réagissent aux choix, aux armes rapportées et aux quartiers sauvés.

6. **Rencontres signature**

   - forêt : traque, pluie et visibilité réduite ;
   - bambouseraie : sons directionnels et attaques à travers les tiges ;
   - champs : eau, digues, feu et cavaliers ;
   - ville : ruelles, toits, maisons et routes parallèles ;
   - château : étages, portes, défenses et raccourcis ;
   - contemporain : métro, alarmes et évacuation ;
   - cyberpunk : drones, réseau et géométrie altérée.

## QA exécutée

Validations confirmées dans cette passe :

- syntaxe JS des fichiers runtime et validateurs modifiés ;
- `smoke-test.js` ;
- `expansion-smoke-test.js` ;
- `coherence-smoke-test.js` ;
- `campaign-expansion-smoke-test.js` ;
- `endgame-environments-smoke-test.js` ;
- `tools/validate-modular-pack.mjs` ;
- `tools/verify-modular-registry.mjs` ;
- `tools/validate-fps-player.py` ;
- `tools/validate-fps-enemies.py` ;
- `tools/build-weapon-rigs.py --check` ;
- `tools/build-endgame-environments.py --check` ;
- `tools/validate-2d-spatial.py` ;
- `tools/sprite_pipeline.py validate --root assets/modular` ;
- `tools/verify-http-assets.mjs http://127.0.0.1:8765/`.

Résultats modulaires confirmés :

- 103 personnages ;
- 515 planches et 3 090 frames 2D ;
- 480 planches et 2 880 frames ennemies FPS ;
- 5 planches et 30 frames joueur FPS ;
- 30 ancres `neckRig` pour Aka-Ushi ;
- 218 sprites d’environnement ;
- 379 assets uniques ;
- 7 646 PNG et 251 JSON dans le pipeline global ;
- 1 320 URL runtime contrôlées par HTTP ;
- zéro erreur des validateurs modulaires, spatiaux, sprites et HTTP.

Preuves visuelles principales :

| Capture | Preuve |
|---|---|
| `05-forest-runtime.png` | forêt runtime |
| `06-fields-runtime.png` | rizières runtime |
| `07-contemporary-runtime.png` | Japon contemporain |
| `08-cyberpunk-runtime.png` | Neo-Edo |
| `10-boss-yoke-final.png` | joug frontal d’Aka-Ushi |
| `11-front-tower-fire-runtime.png` | tour et foyer frontaux |
| `14-mobile-landscape-forest.png` | contrôles mobile |
| `18-before-after-comparison.png` | Kurokawa avant/après |
| `19-weapon-front-layer-final.png` | couche d’arme 2D |
| `20-fps-direction-safe-weapon-final.png` | sécurité des armes FPS |
| `22-prologue-kai-final.png` | dernier plan cohérent dans le runtime |
| `23-prologue-before-after-final.png` | comparaison du prologue |

Contrôles non réalisés :

- playthrough naturel complet sans debug ;
- chronométrage réel de chaque chapitre ;
- matrice visuelle exhaustive des 6 000 rigs ;
- test tactile sur téléphone réel ;
- écoute humaine ;
- Lighthouse ;
- profilage CPU, mémoire et batterie ;
- persistance du joug détaché après sauvegarde/recharge ;
- validation de huit directions FPS dessinées, puisqu’elles n’existent pas encore.

## Définition de « jeu complet » pour le prochain audit

Le projet pourra quitter le statut de vertical slice lorsque :

- chaque acte possède début, transformation, boss, décision, extraction et récompense ;
- aucun passage ne crée d’impasse ;
- les durées sont prouvées par des playtests ;
- chaque zone utilise ses props pour du gameplay ;
- les armes sont vérifiées visuellement sur chaque frame réellement utilisée ;
- les ennemis FPS utilisés possèdent huit vraies directions et des sockets manuels ;
- Akio possède une banque adaptée à chaque grande famille d’arme ;
- le joug suit Aka-Ushi et persiste après recharge ;
- Yomi-no-Kanrei est réellement joué ;
- les 28 zones planifiées sont consommées par le runtime ;
- desktop, mobile, audio, performance et accessibilité sont testés sur leurs supports réels.
