# Yomi no Kage — feuille de route vers le jeu complet

## Vision

`Yomi no Kage` doit devenir une campagne d'action-horreur de 8 à 10 heures,
avec 10 à 12 heures pour tout découvrir. L'alternance 2D/FPS n'est pas un
gadget : elle structure chaque mission.

Boucle principale :

```text
Refuge et renseignement
→ choix de l'équipement
→ exploration et combats 2D
→ bâtiment ou souterrain FPS
→ retour dans une zone 2D transformée
→ sous-boss, décision et extraction
→ butin, artisans, conséquences et mission suivante
```

## Équipement

Le joueur prépare une configuration avant chaque mission :

- un katana parmi les dix sabres uniques ;
- une armure ;
- une école d'ofuda ;
- deux omamori ;
- deux objets rapides ;
- une technique de combat.

Chaque katana reçoit des données jouables :

```text
puissance, cadence, portée, coût de Ki, dégâts de posture,
recul, bonus chair/armure/esprit/boss et passif unique
```

Les dix katanas ne sont plus tous disponibles au départ. Kurokage accompagne
Akio lors du prologue ; les autres sont obtenus par boss, contrats, secrets ou
artisans. Les 48 armes ennemies donnent d'abord des composants, trophées et
recettes plutôt que de devenir automatiquement jouables.

Ressources recommandées :

- mon : services et achats ;
- tamahagane : katanas et armures ;
- cendre du Yomi : ofuda, omamori et purification ;
- yomogi : soins et antidotes.

Le forgeron Kaji et une miko constituent les deux premiers artisans. Les objets
nommés restent uniques ; la rareté concerne surtout armures, charmes et
composants : Usé, Éprouvé, Magistral, Héritage et Souillé.

## Combat

Le combat doit dépasser le coup unique actuel :

- combo léger de trois coups ;
- attaque lourde chargée ;
- garde et parade parfaite ;
- esquive ;
- jauge de posture et exécution ;
- Ki consommé par attaque, défense, sprint et esquive ;
- anti-stunlock pour les boss et les élites.

Les réactions deviennent systémiques :

- chair : saignement, recul et sang ;
- armure : étincelles, son métallique et dégâts de posture ;
- esprit : distorsion, fumée du Yomi et faiblesse aux ofuda.

Les dix katanas doivent modifier le style de jeu, pas seulement la couleur de la
lame. Les ennemis reçoivent des statistiques et comportements structurés au
lieu d'une description uniquement textuelle.

## Niveaux

Objectif par chapitre :

- 45 à 75 minutes lors d'une première partie ;
- 6 000 à 9 000 pixels de largeur 2D ;
- 5 à 7 chunks ;
- 10 à 14 écrans de progression ;
- une route principale et deux courtes branches ;
- un bâtiment FPS obligatoire et un autre optionnel ;
- trois secrets ;
- un checkpoint toutes les 5 à 8 minutes ;
- un sous-boss ou setpiece, puis un boss principal.

Une mission suit cette structure :

1. approche 2D et landmark visible ;
2. rencontre qui introduit une mécanique ;
3. embranchement en diamant ;
4. bâtiment FPS ;
5. retour dans le même extérieur, désormais transformé ;
6. setpiece ou sous-boss ;
7. checkpoint ;
8. boss et décision de purification ;
9. extraction et bilan.

Les bâtiments FPS utilisent des cartes de `18×18` à `28×20`, organisées par
fonction réelle : kura, caserne, sanctuaire, prison, résidence ou carrière.
Les bâtiments importants possèdent deux ou trois cartes reliées simulant
rez-de-chaussée, étage, cave ou toit. L'entrée se fait toujours par une action
explicite avec `E`.

## Profondeur et cohérence du monde

Le sol 2D devient une liste de segments, plateformes, pentes, fosses et ponts,
au lieu d'un rectangle continu.

Chaque élément de décor possède des métadonnées :

```text
pivot, taille canonique, couche, profondeur, collider,
surface, danger, portail, destructible et occlusion
```

Types de collision :

```text
none, solid, oneWay, slope, hazard, portal, destructible
```

Profondeurs visuelles :

- ciel : `0` ;
- relief lointain : `0.02–0.04` ;
- architecture distante : `0.07–0.12` ;
- décor intermédiaire : `0.18–0.25` ;
- premier plan : `0.35–0.50` ;
- branches occultantes : `0.65–0.85` ;
- éléments jouables : coordonnées du monde.

Les panoramas non raccordables ne doivent plus être répétés. Ils défilent de
façon bornée ou sont assemblés avec plusieurs chunks différents. Les ennemis 2D
utilisent un graphe de plateformes et connaissent leurs capacités de saut,
descente, escalade ou tir.

## Alternance 2D/FPS

Une porte possède :

- un socket visuel ;
- une zone d'interaction ;
- un collider ;
- un état fermé, ouvert ou brisé ;
- une destination FPS ;
- un point de retour 2D ;
- un identifiant de rencontre persistant.

La santé, les ressources, les blessures, les morts et les récompenses restent
cohérentes entre les deux vues. Une retraite par l'entrée est possible, avec
réinitialisation partielle de la salle. Certains boss peuvent changer de vue
entre deux phases prévues, jamais au hasard.

## Campagne

Structure cible :

| Chapitre | Zone principale | Durée |
|---|---|---:|
| 1 | Kurokawa, village des cendres | 60 min |
| 2 | Sanctuaire du bambou brisé | 60–75 min |
| 3 | Route et poste de Sekisho | 55–70 min |
| 4 | Mines et fosses de quarantaine | 70–80 min |
| 5 | Domaine fluvial noyé | 60–75 min |
| 6 | Ville-prison de Kurokawa | 70–85 min |
| 7 | Donjon du daimyō | 75–90 min |
| 8 | Porte du Yomi | 90–120 min |

La campagne principale utilise 7 à 8 boss, 8 à 10 sous-boss et 3 à 4 géants.
Les autres boss et géants alimentent les contrats optionnels, le NG+, le boss
rush et les variantes de difficulté. Cela évite de transformer chaque niveau
en succession épuisante de boss.

## Sauvegarde et conséquences

La sauvegarde versionnée `yomi-no-kage-save-v1` conserve :

- chapitre et checkpoint ;
- équipement, monnaies, recettes et améliorations ;
- secrets, boss vaincus et meilleurs rangs ;
- artisans sauvés ;
- décisions et niveau de contamination ;
- butin non sécurisé de la mission active.

Chaque foyer propose un choix :

- purifier : réduit la contamination et protège les survivants ;
- brûler : réduit fortement la menace mais détruit certaines ressources ;
- prélever : donne de la cendre et du matériel souillé, avec une conséquence
  future.

La mort conserve l'équipement unique et la progression narrative, mais fait
perdre une partie du butin non sécurisé avant le dernier checkpoint.

## Ordre de production

### Phase 1 — fondations

- données structurées des katanas et ennemis ;
- calcul centralisé des dégâts ;
- combo, lourd, parade, esquive et posture ;
- écran de préparation ;
- inventaire et sauvegarde ;
- chunks de niveau, segments de sol et métadonnées de props ;
- portails 2D/FPS persistants.

### Phase 2 — Kurokawa définitif

Construire un chapitre complet de 45 à 60 minutes avec :

- refuge et sélection d'équipement ;
- trois routes courtes ;
- un kura FPS obligatoire ;
- un sanctuaire FPS optionnel ;
- trois secrets ;
- trois checkpoints ;
- un sous-boss ;
- un boss en plusieurs phases ;
- une décision de purification ;
- un écran de récompense et une amélioration garantie.

Cette phase remplace le vertical slice actuel. Elle devient la référence de
qualité et de durée pour tous les chapitres suivants.

### Phase 3 — premier acte

- Kurokawa, bambouseraie et Sekisho ;
- Kaji et la miko ;
- trois familles d'ennemis réellement différentes ;
- premier géant ;
- deux à trois heures de campagne validées.

### Phase 4 — campagne complète

- cinq chapitres supplémentaires ;
- blessures et contamination ;
- contrats optionnels ;
- fins influencées par les décisions ;
- difficulté Ronin, Samouraï et Shura.

### Phase 5 — longévité

- NG+ ;
- boss rush ;
- mode arcade de 60 à 90 minutes ;
- maîtrise des dix sabres ;
- défis sans soin, parade parfaite et rangs par chapitre.

## Priorité immédiate

Ne plus produire de grandes familles de sprites avant que leurs différences
soient jouables. La prochaine livraison doit être `Kurokawa définitif`, avec le
loadout, le nouveau combat, les checkpoints, le premier vrai boss et une durée
minimum de 45 minutes.
