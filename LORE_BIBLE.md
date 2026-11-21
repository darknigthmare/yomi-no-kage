# Yomi no Kage — bible d'univers

**Version :** 2.0 — lots 1 et 2 (fondations et personnages).
**Référence de build :** `63dd97c7`, branche `main`, aucun lot 3 à 5 encore intégré.
**Portée :** ce document fait foi pour l'histoire, le lore et le lexique. Les
manifests d'assets (`assets/modular/manifests/`) gardent la main sur
l'apparence, les animations et les points d'ancrage ; en cas de conflit sur un
nom propre, c'est cette bible qui tranche, puis le manifest est corrigé.

**Règle d'or :** un élément de lore n'entre ici que s'il peut être montré au
joueur par une scène, un dialogue, un objectif, un codex ou un comportement.
Le lore qui ne change rien au jeu reste une note de production.

---

## 1. Cadre canonique

### 1.1 Décisions canon (arbitrages du lot 1)

| Sujet | Décision canon | Conséquence |
|---|---|---|
| Nom de la cité finale | **Neo-Edo** est le nom institutionnel du shogunat ; **Neo-Tokyo** est le nom populaire des rues, des néons et du marché. | Les deux graphies existantes restent valides. Aucun asset à régénérer. |
| Datation | **1638 → 2026 → 2188.** | Les trois époques partagent la même nuit du 17ᵉ jour du 6ᵉ mois : 17 juin 1638, 17 juin 2026, 17 juin 2188. |
| Nom du daimyō | **Kurokawa Suketada**, daimyō mineur de Kurokawa. | « Le daimyō corrompu » reste un titre narratif, plus un nom manquant. |
| Sceaux | **22 sceaux d'acte** (verrous locaux, répartis 2/2/3/3/4/3/5) et **7 sceaux de chronique** (un par acte, seuls comptés pour la fin). | Le HUD `0/2` lit un sceau d'acte ; le bilan d'acte lit le sceau de chronique. |
| Fin | Trois textes de fin : faille refermée, Souillure haute, épilogue des trois époques. | L'écran de fin féodal actuel devient une des trois variantes, pas la seule. |
| « Deux foyers » du prologue | Le torii souillé et le donjon sont les **deux premières ancres**. | Les cinq autres ancres sont posées par Suketada, Engeki, le Chapitre des Mémoires et Shogun Zero. |
| Bestiaire | **105 entrées** font foi : 96 historiques, 8 des époques, Akio. | Le README d'assets (97) est corrigé au lot 5. |
| Vocabulaire | La règle « jamais *virus* » ne s'applique qu'à 1638. | 2026 dit *agent, foyer, quarantaine* ; 2188 dit *Kegare-code, mémoire contaminée*. |

### 1.2 Le monde en 1638

- Année : Kan'ei 15 (1638), sous le troisième shogun Tokugawa, Iemitsu.
- Lieu : Kurokawa est une bourgade fortifiée fictive rattachée à Tsuru, dans
  la province enclavée de Kai.
- Statut : dans l'uchronie locale du jeu, un daimyō mineur — Suketada — tient
  Kurokawa au nom du bakufu. Son autorité ne s'étend pas à toute la province
  de Kai et ne remplace pas l'administration de Kōfu.
- Akio est un samouraï mandaté discrètement par le shogun. Une armée ouverte
  provoquerait panique, fuite des contaminés et conflit politique après les
  troubles de Shimabara.
- Kurokawa vit du bois, du bambou, du riz de Tsuru et d'un relais de route.
  La ville compte environ 2 400 âmes avant l'épidémie, 400 après.

Tous les édits, citations et personnages propres au jeu sont fictifs. La
formule « N'épargnez que les vivants » est un édit fictif de l'univers de
`Yomi no Kage`, pas une citation historique d'Iemitsu.

### 1.3 Les trois époques

| Époque | Date canonique | Lieu jouable | État du monde | Ce que le Yomi y est devenu |
|---|---|---|---|---|
| Féodale | 17 juin 1638 | Kai, Tsuru, Kurokawa, château | Épidémie locale, bakufu dans le déni | Une blessure spirituelle encore ouverte |
| Contemporaine | 17 juin 2026 | Shibuya, métro, hôpital, laboratoire | Quarantaine métropolitaine, information saturée | Un foyer viral instrumenté, nié puis militarisé |
| Lointaine | 17 juin 2188 | Neo-Edo / Neo-Tokyo | Cité-shogunat automatisée, mémoire marchandise | Un code, une infrastructure, une religion d'archives |

Le passage d'une époque à l'autre n'est pas un voyage : c'est la même blessure
qui se rouvre au même endroit du monde, 388 ans puis 162 ans plus tard.

### 1.4 Hiérarchie des sceaux

- **Sceau d'acte (22)** : verrou posé par les antagonistes sur un lieu, une
  porte, une cloche, une vanne ou un autel. Il se brise localement.
- **Sceau de chronique (7)** : preuve qu'un acte a été compris, pas seulement
  traversé. Il s'obtient en fermant l'objectif principal de l'acte et il est
  le seul dont la fin tient compte.
- Un sceau d'acte brisé sans sceau de chronique laisse la zone jouable mais
  l'acte « inachevé » au bilan : le refuge le dit, l'épilogue le rappelle.
- Aucun sceau ne s'obtient par une monnaie, un niveau ou une statistique : il
  s'obtient par une action de monde.

### 1.5 Chronologie du prologue

1. La dernière cloche sonne à Kurokawa.
2. Le bakufu reçoit les rapports à Edo.
3. Iemitsu donne son ordre à la troisième veille.
4. Akio prête serment puis suit la route de Kōshū.
5. **Trois jours plus tard**, il atteint le col forestier de Kai à l'aube et
   aperçoit la fumée de Kurokawa.
6. Il traverse la forêt noyée, la bambouseraie de Shigure et les rizières de
   Tsuru avant d'entrer dans la ville.

L'enfant de la dernière cloche, entendue au plan 2 du prologue, n'est pas
nommée et ne reparle jamais : elle est le seul témoin que le joueur reconnaît
sans pouvoir la sauver. Sa voix revient une fois, au lot 3, dans un codex.

### 1.6 Règles de nommage

- Les noms propres japonais suivent l'ordre **nom puis prénom** dans les
  documents internes, et l'usage courant dans les dialogues.
- Un nom propre n'est utilisé que par un seul personnage, un seul objet et un
  seul lieu. « Kurokawa » est un lieu ; « Kurogane » est un gardien ;
  « Kurokage » est une lame.
- Les titres réels sont localisés (« chef de levée de pompiers », « commandant
  de suigun », « gardien du château »). Les titres de fiction assumés
  (« Ordre de l'Ombre », « Shogun Zero », « Yomi-no-Kanrei ») sont écrits tels
  quels et jamais traduits en jeu.

---

## 2. Cosmologie du Yomi

### 2.1 Ce qu'est le Yomi

Le Yomi n'est ni un enfer, ni un dieu, ni un lieu qu'on visite. C'est une
**profondeur** : le dépôt de tout ce qu'un pays n'a pas voulu garder — morts
sans sépulture, serments trahis, dettes non payées, incendies étouffés. Ce
dépôt n'a pas de volonté propre, mais il garde l'empreinte de celles qu'on y a
jetées. C'est pourquoi le Kegare ressemble toujours à quelqu'un : il imite la
dernière volonté disponible dans un corps ou un lieu.

Trois conséquences pour l'écriture :

- le Yomi ne parle jamais directement : il **répète** (une phrase, un geste,
  une cloche, une odeur) ;
- il ne crée rien : il agrandit, déforme, assemble ce qui existe déjà ;
- il ne choisit pas un héros et ne prophétise rien.

### 2.2 La loi des trois échos

Une blessure du monde ne se referme pas, elle **résonne**. Chaque fois qu'un
même crime est répété au même endroit — une population enfermée, un feu
allumé pour cacher, une archive falsifiée — la résonance devient assez forte
pour qu'un vivant marqué passe d'une époque à l'autre.

- **Premier écho, 1638** : Kurokawa brûle ses malades et scelle ses morts.
- **Deuxième écho, 2026** : Tokyo met en quarantaine un quartier entier, puis
  classe les dossiers.
- **Troisième écho, 2188** : Neo-Edo archive les morts comme des données et
  les rappelle pour gouverner.

Chaque époque est donc une **répétition** de la précédente, avec des moyens
plus grands et une responsabilité plus diffuse. Le joueur doit pouvoir dire,
à la fin de chaque acte, ce qui a été répété.

### 2.3 La faille

La faille n'est pas une porte : c'est un **accord** entre deux lieux qui se
souviennent de la même chose. Elle s'ouvre au cœur de l'endroit où la
répétition a eu lieu, à l'heure de la troisième veille, et seulement pour ce
qui porte la cendre.

- Une faille s'ouvre sur un seuil identifiable : un torii, une grille de
  métro, un portique de data center.
- Elle ne s'ouvre jamais dans le vide, jamais en plein combat, jamais pendant
  une cinématique : le joueur doit **entrer**.
- Elle est stable tant que l'ancre qui la nourrit existe. Briser l'ancre ne
  ferme pas la faille, cela la rend **muette** : plus rien ne la traverse.
- Une faille traversée laisse une marque visible au refuge : une aiguille de
  pin fendue, une ligne de cendre sur le sol, une date qui change.

### 2.4 Ce qui traverse, ce qui ne traverse pas

| Traverse | Ne traverse pas | Pourquoi |
|---|---|---|
| Akio, vivant et marqué par la cendre | Tout autre vivant non marqué | La cendre est la seule signature reconnue |
| Les armes liées à son serment | Les objets sans lien, l'argent, les vivres | La forme du serment est conservée, pas la matière |
| Les blessures et la Souillure | Les morts, les cendres d'autrui | Ce qui est mort reste mort |
| Une intention claire (un objectif) | Un souvenir vague, une rumeur | L'écho ne transporte que ce qui est décidé |
| Les noms qu'il connaît déjà | Les documents écrits intacts | Le passage altère l'écrit, jamais la mémoire |

Cette dernière ligne est la règle d'or des incohérences apparentes : un
document daté de 2026 peut contredire un document de 2188 sans que la bible
soit en faute, à condition qu'un personnage le remarque.

### 2.5 Pourquoi Akio garde sa progression

Le Yomi conserve la **forme**, jamais la matière. Une amélioration de forge,
une maîtrise d'arme, une technique apprise sont des formes : elles restent.
Une lame perdue, une réserve de riz, une monnaie sont des matières : elles ne
suivent pas.

En jeu, cela justifie exactement ce que fait déjà le moteur :

- les rangs de forge et la maîtrise persistent ;
- les armes se retrouvent d'une époque à l'autre, reforgées sur place ;
- les ressources de refuge sont locales et se reconstituent ;
- la Souillure, elle, ne redescend jamais d'elle-même.

### 2.6 Le prix

Chaque traversée coûte de la Souillure, et la Souillure est cumulative. Ce
n'est pas une jauge de style : c'est la **dette** du personnage envers ce qu'il
n'a pas voulu voir. Un joueur qui traverse avec une Souillure haute entend des
dialogues différents, voit les lieux se déformer et obtient une fin différente.

Aucune mécanique ne doit permettre de « farmer » la Souillure à la baisse :
seuls le sanctuaire, le repos et un choix narratif la réduisent.

### 2.7 Ce que le Yomi veut

Rien. Il **répète**, et la répétition avantage toujours celui qui veut
gouverner. Suketada a compris le premier qu'une ville qui a peur obéit plus
vite ; Engeki a compris qu'un incendie justifie toutes les réquisitions ; le
Chapitre des Mémoires a compris qu'un mort archivé ne proteste pas ; Shogun
Zero est la conclusion logique : un pouvoir qui n'a plus besoin de vivants.

La menace n'est donc pas « le monstre » mais **la gouvernance par la peur**,
rejouée à trois échelles. Chaque boss incarne une version de cette phrase.

### 2.8 Interdits d'écriture

- Pas de paradoxe temporel, pas de boucle qui annule un acte, pas de
  résurrection d'un personnage nommé.
- Pas d'élu, pas de prophétie, pas de sang spécial : Akio est un homme qui a
  respiré la cendre.
- Pas d'explication scientifique totale du Yomi. La science explique la
  Fièvre, pas le Kegare, et les personnages de chaque époque se trompent à
  leur manière.
- Pas de sauvetage rétroactif : un mort du prologue reste mort.
- Pas de « c'était un rêve », pas de simulation, pas de niveau qui révèle que
  tout était faux.

---

## 3. La Fièvre des Cendres et le Kegare

### 3.1 La Fièvre des Cendres

Agent physique, transmis par fluides, tissus contaminés, morsures, eau et
réserves souillées, et par inhalation de la poussière des foyers.

| Phase | Délai | Signes | Contagion |
|---|---|---|---|
| Incubation | 12 à 72 h | fatigue, soif, toux sèche | faible, sauf contact direct |
| Fébrile | 3 à 6 jours | fièvre, douleur, agressivité | forte par fluides |
| Critique | 6 à 9 jours | confusion, hémorragies, coma | très forte |
| Issue | 9ᵉ jour | mort clinique dans 7 cas sur 10 | le corps reste contaminant 4 jours |

La Fièvre tue, mais elle ne relève personne. Ce qui relève, c'est le Kegare,
et il ne le fait que là où une ancre existe.

### 3.2 Ce qui limite la Fièvre

- **La médecine** : isolement, eau bouillie, couverture propre, coupe des
  contacts. Efficace pour ralentir, jamais pour guérir.
- **Le feu** : détruit l'agent — et les preuves, les récoltes, les maisons, les
  noms. Chaque brasier de Kurokawa est une décision politique.
- **L'eau** : lave la cendre des mains, pas des poumons. Les rizières noyées
  sont un piège : l'eau porte l'agent et masque les corps.
- **La cendre prélevée** : conservée sèche, elle garde l'agent des années et
  sert de monnaie, de remède de charlatan et de carburant au Kegare.

### 3.3 Le Kegare du Yomi

Le Kegare a besoin d'un corps affaibli ou mort et d'une **volonté disponible**.
Il retient cette volonté comme une empreinte, anime la chair et déforme le
lieu autour de son ancre.

- **Ancrage** : un objet de serment (armure, arme, cloche, registre), un lieu
  de rite profané, une racine contaminée.
- **Amplification** : plus l'ancre est ancienne, plus la zone se déforme
  (murs qui se souviennent, portes qui se ferment seules, sons répétés).
- **Rupture** : les ofuda, les lames consacrées et les sceaux brisent
  l'ancrage ; ils ne tuent pas la Fièvre.
- **Rechute** : un corps guéri qui garde de la cendre dans les poumons peut
  être repris plus tard. C'est le destin de plusieurs PNJ sauvés.

### 3.4 Purifier n'est pas guérir

C'est la distinction centrale du jeu, et elle doit être dite au joueur au
moins trois fois, par trois personnages différents :

- purifier un lieu le rend habitable, pas sain ;
- guérir un corps ne nettoie pas un lieu ;
- brûler un lieu le nettoie, et le rend inhabitable.

Aucun objectif ne doit promettre les trois à la fois.

### 3.5 L'économie de la cendre

| Ressource | Origine | Usage diégétique | Risque |
|---|---|---|---|
| Mon | échanges, contrats, pillage | paiement immédiat | aucun |
| Tamahagane | forges, convois, boss | amélioration d'armes | aucun |
| Cendre du Yomi | foyers, ancres, boss | sanctuaire, sceaux, remèdes | contamination |
| Provisions | rizières, sauvetages, contrats | repos, soins | aucune |

La cendre est la seule ressource qui **augmente** la Souillure quand on
l'utilise beaucoup. C'est le choix économique du jeu : un joueur pressé
purifie plus vite et se condamne plus vite.

### 3.6 Les variantes 2026 et 2188

- **2026** : l'agent est nommé « Fièvre des Cendres » par les autorités, puis
  « syndrome de Kurokawa » par la presse. La quarantaine est réelle, les
  masques sont réels, les dossiers classés sont le vrai désastre.
- **2188** : la Fièvre n'existe plus comme maladie ; elle existe comme
  **Kegare-code**, une écriture qui se réplique dans les mémoires sauvegardées
  et les prothèses. Les morts ne marchent pas : ils sont rappelés.

### 3.7 Ce qui est vrai, ce que les gens croient

À tenir dans les dialogues et le codex :

| Croyance | Vérité canon |
|---|---|
| « Les morts reviennent parce qu'ils sont en colère » | Ils reviennent parce qu'une ancre les retient. |
| « Brûler le village l'aurait sauvé » | Brûler aurait arrêté la Fièvre et détruit les vivres et les preuves. |
| « Les prêtres ont apporté la peste » | Les religieux sont morts comme les autres ; certains ont scellé des ancres. |
| « Les samouraïs sont immunisés » | Aucun sang ne protège. Akio respire moins de cendre parce qu'il porte un masque de route. |
| « 2026 a inventé la quarantaine » | La quarantaine est une répétition de 1638, avec des fichiers. |

---

## 4. Stades lisibles

### 4.1 Les cinq stades

| Stade | Symptômes et comportement | Langage visuel |
|---|---|---|
| 0 — exposé | fièvre, toux, confusion | peau pâle, cendre mate |
| 1 — fiévreux | agressivité, douleur, encore vivant | vert malade discret |
| 2 — revenu | mort animé, mémoire fragmentaire | yeux ternes, fissures vertes |
| 3 — lié | armure, arme ou rite fusionné au Kegare | racines sombres, lueur retenue |
| 4 — brèche | mutation massive ou manifestation spirituelle | veines rouges seulement au cœur de la brèche |

Un stade ne remonte jamais. Un stade 3 nommé est un personnage ; un stade 2
anonyme est un ennemi rejouable. C'est la règle qui explique le bestiaire.

### 4.2 Grammaire des impacts

- **chair** : sang, recul, son sourd ;
- **armure** : étincelles, posture, résonance métallique ;
- **esprit** : distorsion, cendre, faiblesse aux ofuda.

Cette grammaire est commune aux trois époques. En 2188, l'« armure » inclut les
châssis et les prothèses ; l'« esprit » inclut les mémoires sauvegardées.

### 4.3 La Souillure du joueur

Les seuils numériques appartiennent au moteur et à l'équilibrage. La bible fixe
seulement la **lecture** des paliers :

| Palier | Nom | Ce que le joueur entend | Ce qu'il voit |
|---|---|---|---|
| 0–19 % | Blanc | dialogues normaux | aucune déformation |
| 20–39 % | Marqué | un PNJ mentionne son odeur de cendre | cendre fine dans les coins |
| 40–59 % | Fiévreux | répliques plus sèches, un doute du refuge | souffle visible, couleurs pâles |
| 60–79 % | Revenu | des morts le reconnaissent | reflets en retard, sons doublés |
| 80–99 % | Brèche | le refuge hésite à le laisser entrer | veines rouges aux seuils |
| 100 % | Fin de chronique | — | la fin « brèche » se déclenche |

Aucun palier ne doit bloquer une zone : la Souillure change le ton, pas l'accès.

### 4.4 Répartition des espèces et des époques

| Famille | Époque | Stade dominant | Rôle narratif |
|---|---|---|---|
| Habitants, miliciens | 1638 | 1–2 | victimes devenues menace |
| Garde du bakufu | 1638 | 2–3 | ordre retourné contre la population |
| Religieux contaminés | 1638 | 2–3 | rites devenus ancres |
| Faune et bétail | 1638 | 2–4 | masse, charge, setpiece |
| Personnels de quarantaine | 2026 | 2–3 | l'administration comme arme |
| Citadins, soignants | 2026 | 2 | la ville qui continue |
| Sécurité privée, robots | 2026 | 3 | l'ordre automatisé |
| Archives, prothèses | 2188 | 3–4 | mémoire et pouvoir |
| Shogunat automatisé | 2188 | 4 | la conclusion politique |

---

## 5. Factions

### 5.1 Les habitants de Kai

Paysans, bûcherons, artisans, bateliers, pèlerins de route et miliciens. Ils ne
forment pas une masse : chaque zone a ses noms et ses intérêts. Ils mentent par
peur, cachent leurs malades et brûlent parfois avant l'arrivée d'Akio. Ils sont
la première source de rumeurs fausses du jeu (voir 3.7).

### 5.2 La garde du bakufu

Ashigaru, yoriki, dōshin et jōban de la résidence. Elle n'est pas cruelle par
nature : elle applique un ordre écrit par des gens qui n'ont pas vu la ville.
Engeki en est l'exemple extrême : un chef de levée de pompiers qui a compris
que l'incendie règle les problèmes que le rapport ne règle pas.

### 5.3 Les religieux

Miko, yamabushi et desservants locaux. Ils ne constituent jamais une religion
unique responsable de l'épidémie et ne sont jamais un bloc. Certains ont scellé
des ancres pour contenir le Kegare, d'autres ont fui, d'autres ont monnayé des
rites. Le sanctuaire du refuge est tenu par une laïque, pas par une prêtresse :
c'est un choix de monde, pas un détail.

### 5.4 Les liés au Yomi

Anciens humains nommés lorsqu'ils sont uniques (Suketada, Engeki, Kumo,
Shigure), archétypes anonymes lorsqu'ils peuvent réapparaître (rōnin, porteurs,
ashigaru). Un lié garde toujours un geste de son ancien métier : c'est le seul
signe qui permet au joueur de deviner un stade.

### 5.5 L'Ordre de l'Ombre — nouvelle faction

L'Ordre n'existe pas comme institution. C'est un nom que le bakufu utilise pour
un homme, un édit scellé et une méthode : entrer sans armée, purifier sans
prêtre, rendre des comptes à un seul secrétaire. Akio en est le seul membre
vivant. Le nom est un mensonge utile : il laisse croire à une organisation
capable de revenir.

Règles :

- aucune recrue, aucun uniforme, aucun grade ;
- l'édit scellé ne peut être montré à personne sans perdre sa valeur ;
- un témoin sauvé devient un relais de l'Ordre sans le savoir.

### 5.6 Les Veilleurs du Pin Noir — nouvelle faction

Le refuge s'appelle **le Pin Noir** : une auberge de relais à l'entrée de
Kurokawa, repérée par un pin fendu par la foudre. Il devient base de
reconquête à partir de l'acte IV.

| Service | Nom en jeu | Tient la règle |
|---|---|---|
| Forge | Forge de Masanori | une lame reforgée garde sa forme, jamais son histoire |
| Infirmerie | Infirmerie de Chiyo | on ne refuse personne de propre, on refuse tout le reste |
| Dōjō | Dōjō des éclaireurs | on n'enseigne que ce qu'on a survécu |
| Sanctuaire | Sanctuaire des sceaux | purifier un lieu ne guérit personne |

Règles de faction :

- le refuge ne se défend jamais tout seul : le joueur doit revenir ;
- chaque sauvetage amène un résident, pas un bonus ;
- un résident qui parle donne une information, jamais une quête générique ;
- quatre contrats persistants : les morts (abattre), les chemins (explorer),
  le joug (Aka-Ushi), les époques (atteindre 2026/2188).

### 5.7 Le Chapitre des Mémoires — nouvelle faction

Archivistes de 2188, héritiers d'un institut de 2026. Ils ont commencé par
conserver les dossiers de quarantaine, puis les voix des morts, puis les
décisions des morts. Le Kannushi du réseau Yomi est un des leurs, infecté.

Règles :

- le Chapitre ne ment pas : il **omet** ;
- il parle du Yomi comme d'un format, jamais comme d'un dieu ;
- sa bibliothèque est un niveau, pas un décor : on y trouve des entrées de
  codex et des portes verrouillées par des noms.

### 5.8 Répartition régionale et règles d'apparition

Kurokawa étant enclavée, pêcheurs de mer, sauniers côtiers et forces navales
sont réservés aux chapitres fluviaux ou côtiers. Shiranui est donc un
**commandant de suigun fluvial** sur la route de Kōshū, pas un amiral de mer.

Un personnage unique ne peut apparaître qu'une fois dans la campagne, sauf
justification explicite : illusion, jumeau, souvenir ou NG+. Les exceptions du
jeu sont : le Kannushi (réseau), Shogun Zero (mémoire d'Iemitsu), et les
apparitions de Shigure en codex.

### 5.9 Taxonomie du bestiaire

| Catégorie de manifest | Nombre | Faction de rattachement | Traitement narratif |
|---|---:|---|---|
| `legacy` | 6 | garde, religieux, bétail, daimyō | figures du prototype, lore canonicalisé |
| `regular` | 22 | habitants et garde, dont 2 des époques | anonymes, réapparaissent |
| `special` | 24 | métiers retournés, dont 4 des époques | un geste de métier identifiable |
| `miniboss` | 21 | gardiens d'ancre nommés, dont le Kannushi | nom, rumeur, une faiblesse |
| `boss` | 22 | seigneurs, officiers, créatures, dont 2 des époques | deux phases minimum |
| `giant` | 10 | agrégats et masses | setpiece, masse justifiée par le décor |

Total : **105 adversaires + Akio = 106 personnages**, exactement le compte des
manifests et de `tools/validate-modular-pack.mjs`.

---

## 6. Personnages — 24 fiches

Format : identité, apparence, voix, fonction ludique, rapport au Kegare, sort.
Un sort écrit ici est définitif : aucun lot ultérieur ne peut le contredire
sans rouvrir cette fiche.

### 6.1 L'ordre du shogun

#### 6.1.1 Akio Kageyama

- **Rôle :** samouraï de l'ombre, unique membre vivant de l'Ordre.
- **Âge :** 34 ans en 1638.
- **Identité :** né à Tsuru, fils d'un contrôleur de digues ; sa sœur Toue est
  morte dans le premier foyer, ce qui explique qu'il accepte une mission sans
  armée. Il porte le Kurokage, lame de messager du bakufu.
- **Apparence :** armure légère indigo, masque de route, cendre sur les avant-
  bras, jamais de sang visible sur le visage.
- **Voix :** phrases courtes, pas de menaces, ne pose qu'une question par
  scène. Il ne dit jamais « je vais te tuer » ; il dit ce qu'il va faire.
- **Fonction :** le joueur. Toutes ses compétences doivent être justifiables
  par une blessure, un serment ou une cendre respirée.
- **Kegare :** marqué, jamais possédé. Sa Souillure est une dette, pas une
  malédiction familiale.
- **Sort :** vivant à la fin de la campagne, quel que soit l'épilogue. La fin
  « brèche » le laisse vivant mais non identifiable comme humain.

#### 6.1.2 Tokugawa Iemitsu (fiction)

- **Rôle :** troisième shogun, commanditaire.
- **Âge :** 34 ans en 1638.
- **Identité :** figure historiquement réelle, écrite ici en fiction assumée :
  il donne un ordre unique, à la troisième veille, sans armée ni prêtre.
- **Apparence :** salle obscure, aucune armure, une seule lampe. Il n'est vu
  qu'au prologue et une fois en mémoire à l'acte VII.
- **Voix :** impérative, économe, jamais cruelle. « Une armée nourrirait la
  peste. Akio ira seul. »
- **Fonction :** cadre politique du prologue et des rapports d'acte.
- **Kegare :** aucun de son vivant.
- **Sort :** mort bien avant 2026. Sa mémoire militaire est volée par la
  faille et sert à construire Shogun Zero ; c'est le seul « retour » autorisé,
  et ce n'est pas une résurrection.

### 6.2 Kurokawa

#### 6.2.1 Kurokawa Suketada

- **Rôle :** daimyō mineur de Kurokawa, seigneur final de l'acte V.
- **Âge :** 51 ans en 1638.
- **Identité :** administrateur médiocre, endetté, convaincu que la peur est
  une taxe. Il a fait sceller les morts sous le donjon pour ne pas payer les
  rites, puis a utilisé le Kegare pour tenir ses vassaux.
- **Apparence :** armure de cérémonie sur un corps amaigri, masque de jōban,
  une main toujours gantée pour cacher la cendre.
- **Voix :** administrative, plaintive, jamais menaçante. Il parle de
  « comptes », de « devoirs », de « désordre ». Il ne dit jamais « je suis un
  dieu » : il dit « je suis le seul à tenir ».
- **Fonction :** boss de l'acte V, première phase humaine.
- **Kegare :** stade 3 lié par lui-même, volontairement.
- **Sort :** absorbé dans Yomi-no-Kanrei. Aucun dialogue après la défaite.

#### 6.2.2 Yomi-no-Kanrei

- **Rôle :** seconde phase de Suketada, pas une entité séparée.
- **Identité :** agrégat d'armure, de reliques de clan et de corps de gardes,
  tenu par la volonté de régner de Suketada.
- **Apparence :** masse de plaques laquées, de racines et de mains ; une seule
  pièce reste reconnaissable : le masque de jōban du daimyō.
- **Voix :** la même que Suketada, en retard d'un souffle, répétée par
  plusieurs bouches.
- **Fonction :** setpiece de fin d'acte V ; ses phases changent les règles de
  l'arène (portes qui se ferment, sol qui se souvient), pas seulement ses PV.
- **Kegare :** stade 4.
- **Sort :** détruit. La cendre retombe sur Kurokawa : c'est la neige grise de
  l'acte VI.

#### 6.2.3 Engeki, chef de la levée de pompiers

- **Rôle :** boss de l'acte IV, appelé « brigadier » par les habitants.
- **Âge :** 46 ans en 1638.
- **Identité :** commandait une brigade hikeshi ; il a ordonné des incendies
  pour couper la Fièvre, puis a réquisitionné les survivants pour reconstruire
  ce qu'il avait brûlé. Le Kegare l'a repris au milieu d'un rapport.
- **Apparence :** capuchon noir court, veste indigo matelassée, coutures rouges
  laquées, protections d'avant-bras ; carrure dense de boss.
- **Voix :** ordres numérotés, comptes à voix haute, aucune insulte. Il dit
  « deux maisons, quarante vies » comme un prix.
- **Fonction :** boss d'acte IV ; sa défaite ouvre la route du château et
  libère les habitants réquisitionnés.
- **Kegare :** stade 3, lié par son propre registre de réquisitions.
- **Sort :** meurt en donnant l'ordre de fermer la rue. Son registre devient
  une entrée de codex et une cible d'interaction à l'acte V.

#### 6.2.4 Kumo, maître shinobi

- **Rôle :** boss de l'acte II.
- **Âge :** 43 ans en 1638.
- **Identité :** organisait un réseau d'évacuation secret sous les remparts de
  Kurokawa, puis a vendu les passages aux plus offrants. Il connaît la
  bambouseraie mieux que Shigure et s'en sert pour tendre des pièges.
- **Apparence :** brume basse, tissus gris-vert, visage jamais net ; armes
  courtes et pièges, jamais de face-à-face loyal.
- **Voix :** douce, commerciale, jamais pressée. Il propose un prix avant de
  proposer un combat.
- **Fonction :** boss d'acte II ; ses phases sont « Kumo affamé » puis un
  combat dans la brume qui masque les télégraphes — d'où l'importance des
  indicateurs audio.
- **Kegare :** stade 3, refusé puis accepté : il a demandé à être lié pour ne
  pas mourir de la Fièvre.
- **Sort :** tué. Ses pièges restent actifs après sa mort et deviennent des
  obstacles permanents dans la bambouseraie.

#### 6.2.5 Shigure, gardienne de la bambouseraie

- **Rôle :** figure tutélaire de l'acte II, morte avant l'arrivée d'Akio.
- **Âge :** 31 ans à sa mort.
- **Identité :** gardienne laïque des lames de bambou, elle a posé les sceaux
  qui contenaient le Kegare dans la bambouseraie. Kumo l'a laissée mourir au
  milieu de son propre travail. Son masque fendu est un objet de campagne.
- **Apparence :** masque de bois fendu en deux, veste de pluie, mains couturées.
- **Voix :** uniquement par codex, notes et une réplique en écho à l'acte VII.
  Elle ne parle jamais au présent : c'est la règle des morts du jeu.
- **Fonction :** donne son nom à l'acte, fournit le masque qui ouvre les
  sceaux d'acte et la raison de détester Kumo.
- **Kegare :** aucun. Elle est le contre-exemple : une morte non relevée.
- **Sort :** morte, jamais relevée, jamais ressuscitée.

### 6.3 Le Yomi et ses gardiens

#### 6.3.1 Take-Mori, colosse de la bambouseraie

- **Rôle :** boss massif de l'acte I.
- **Identité :** ouvrier de quarantaine dont les excroissances de kératine ont
  pris la forme du bambou qu'il abattait. Sa masse vient de son métier, pas
  d'une magie.
- **Apparence :** crêtes organiques sur les épaules et le dos, vêtements de
  travail déchirés, mains nues.
- **Voix :** aucun mot ; des coups de bélier contre les troncs, qui servent de
  télégraphe.
- **Fonction :** premier setpiece vertical du jeu ; sa phase 2 utilise un bélier
  détachable, ce qui enseigne au joueur les pièces détachées.
- **Kegare :** stade 4, agrégat de bois et de chair.
- **Sort :** détruit. Ses crêtes restent plantées dans la clairière.

#### 6.3.2 Aka-Ushi, bœuf de trait pestiféré

- **Rôle :** boss massif intermédiaire de l'acte III.
- **Identité :** abandonné par un convoi de quarantaine sur la route ; la
  Fièvre a épaissi sa peau et déformé ses cornes. Son joug tranchant peut être
  arraché.
- **Apparence :** bœuf rouge-brun colossal, cornes fissurées, lésions, joug
  métallique détachable.
- **Voix :** beuglements courts, jamais de cri long : le silence après est le
  signal de la charge suivante.
- **Fonction :** enseigne la gestion de l'espace et la destruction
  d'équipement ; lié au contrat « Le joug du bœuf rouge ».
- **Kegare :** stade 2 massif, sans volonté propre.
- **Sort :** abattu. Le joug devient une arme ouverte au dōjō.

#### 6.3.3 Shiro-Kabuto, scarabée pâle de la peste

- **Rôle :** boss massif de l'acte III.
- **Identité :** coléoptère des fosses communes, nourri de cadavres contaminés
  jusqu'à la taille d'une maison. Il ne sert personne : il mange.
- **Apparence :** carapace blanche, six pattes, mandibules ; bouclier dorsal
  détachable.
- **Voix :** cliquetis, aucun cri. Le silence de la rizière avant sa charge est
  son vrai télégraphe.
- **Fonction :** boss bas et large, combat de posture ; sa carapace bloque les
  attaques hautes jusqu'à fissuration.
- **Kegare :** stade 4 animal.
- **Sort :** tué. Sa carapace sert de matériau de forge.

#### 6.3.4 Gardien Kurogane

- **Rôle :** gardien de la porte du château, mini-setpiece de l'acte V.
- **Identité :** gardien de porte devenu verrou vivant ; il ne quitte jamais
  son seuil. Le Kegare l'a lié à la porte elle-même.
- **Apparence :** armure lamellaire noire, masque de fer, crâne rasé ; une
  poutre arrachée lui sert de massue.
- **Voix :** répète la formule de service : « La porte reste close. »
- **Fonction :** enseigne que certains ennemis ne se contournent pas ; il faut
  briser le seuil.
- **Kegare :** stade 3 lié à un objet architectural.
- **Sort :** détruit avec la porte.

#### 6.3.5 Numa-no-Oyakata, maître du domaine noyé

- **Rôle :** gardien d'ancre des rizières, acte III.
- **Identité :** intendant du domaine, noyé dans ses propres digues lors de la
  crue provoquée par la quarantaine. Il « tient » encore les eaux.
- **Apparence :** robe trempée, ancre de bois dans le dos, peau gonflée.
- **Voix :** comptes d'eau, de redevances, de niveaux ; il parle comme un
  registre.
- **Fonction :** boss d'ancre ; le tuer ne suffit pas, il faut ouvrir la vanne.
- **Kegare :** stade 3 lié à l'eau et au registre.
- **Sort :** dissous quand la vanne s'ouvre ; son registre est récupérable.

#### 6.3.6 Enjin-Bōzu, moine du foyer consumé

- **Rôle :** boss massif de l'acte IV.
- **Identité :** gardien du brasier de purification, brûlé avec son temple
  pour avoir refusé de livrer les malades. Des fissures d'ambre courent sous
  sa peau noircie.
- **Apparence :** moine massif calciné, cloche de bronze détachable.
- **Voix :** sutras incomplets, une syllabe manquante à chaque fois.
- **Fonction :** boss de pression thermique ; ses frappes laissent des zones
  dangereuses sans magie.
- **Kegare :** stade 4.
- **Sort :** s'effondre sur sa cloche ; la cloche devient un décor permanent.

#### 6.3.7 Geôlière de Sekimon

- **Rôle :** boss de geôle, acte IV ou V selon la route.
- **Identité :** gardienne des portes de la prison de Sekimon, qui a continué
  d'enfermer après la fin des vivants. Ses trois phases sont des portes.
- **Apparence :** clés à la ceinture, visage caché, robe de gardienne.
- **Voix :** procédurale : numéro de cellule, motif, heure.
- **Fonction :** boss de rythme, combat dans un couloir ; elle oblige le joueur
  à choisir une sortie.
- **Kegare :** stade 3 lié aux clés.
- **Sort :** enfermée dans sa propre geôle, vivante mais immobile : le seul
  boss que le joueur peut laisser vivre, sans récompense.

#### 6.3.8 Abbé de Kurotaki

- **Rôle :** boss de temple, acte II ou IV selon la route.
- **Identité :** abbé du temple de la cascade noire, qui a scellé les malades
  dans la crypte plutôt que de les brûler. Il a sonné la cloche du Yomi pour
  les retenir.
- **Apparence :** robe de cérémonie souillée, chapelet de cloches, tonsure.
- **Voix :** douce, sûre, impossible à contredire ; il ne ment pas.
- **Fonction :** boss qui explique la règle « purifier n'est pas guérir ».
- **Kegare :** stade 3 volontaire, par devoir.
- **Sort :** meurt en sonnant la cloche ; la cloche reste muette ensuite.

#### 6.3.9 Châtelain Ibushi

- **Rôle :** seigneur rival, boss de forteresse secondaire (route optionnelle).
- **Identité :** châtelain voisin venu piller Kurokawa pendant la quarantaine,
  puis resté pour tenir les faubourgs en cendres.
- **Apparence :** armure de cérémonie noircie, casque à cornes courtes.
- **Voix :** mépris de classe, références constantes au rang.
- **Fonction :** boss optionnel qui donne la meilleure arme de la zone et la
  pire réputation au refuge.
- **Kegare :** stade 3, lié à son propre étendard.
- **Sort :** tué ou laissé en fuite ; s'il fuit, il reparaît à l'acte V en
  ennemi anonyme — seule exception d'apparition multiple du jeu.

#### 6.3.10 Matriarche Beni-Tsuru

- **Rôle :** boss d'atelier de tissage, acte III.
- **Identité :** matriarche des tisseuses de Tsuru, qui a cousu les bannières
  de quarantaine puis s'est liée à elles pour ne pas être évacuée.
- **Apparence :** robe rouge, ailes faites de bannières tendues, visage clair.
- **Voix :** maternelle, épuisée, parle des enfants par leur prénom.
- **Fonction :** boss de zone étroite ; ses ailes coupent les lignes de fuite.
- **Kegare :** stade 3 lié au textile.
- **Sort :** meurt en demandant qu'on brûle les bannières — objectif secondaire.

#### 6.3.11 Shiranui, commandant de suigun

- **Rôle :** boss fluvial, route optionnelle de la Kōshū.
- **Identité :** commandant d'une flottille de transport fluvial, qui a sabordé
  ses propres barges pour bloquer la route et garder le monopole du passage.
- **Apparence :** armure de bord, crochet de charge, torse brûlé.
- **Voix :** ordres de manœuvre, vocabulaire de batelier.
- **Fonction :** boss de plateforme instable ; le terrain bouge plus que lui.
- **Kegare :** stade 3 lié à une barge.
- **Sort :** coule avec sa barge ; son crochet devient une arme de dōjō.

### 6.4 Les époques

#### 6.4.1 Kannushi du réseau Yomi

- **Rôle :** sous-boss de l'acte VII, geôlier du data center.
- **Identité :** prêtre-réseau du Chapitre des Mémoires, qui entretenait les
  mémoires rituelles de Neo-Tokyo avant que le Kegare n'infecte les archives.
  Il récite les derniers instants des morts sous forme de commandes qui
  verrouillent l'espace.
- **Apparence :** robes techniques, halo de cendre, holo-shakujo séparé.
- **Voix :** liturgique et technique à la fois ; chaque phrase est une entrée
  de journal datée.
- **Fonction :** sous-boss qui verrouille les arènes ; sa mort libère une salle
  et deux entrées de codex.
- **Kegare :** stade 3, lié à une infrastructure.
- **Sort :** dissous dans le réseau ; sa dernière phrase est un nom de 1638.

#### 6.4.2 Shogun Zero

- **Rôle :** boss final, acte VII.
- **Identité :** programme de commandement de Neo-Edo construit sur les
  souvenirs militaires dérobés par la faille — dont ceux d'Iemitsu. « Zéro »
  ne signifie pas « premier » : cela signifie « sans lignée ». Le Yomi l'a
  réclamé comme souverain parce qu'il gouverne sans vivants.
- **Apparence :** kabuto et masque, armure de shogun sur châssis ; nodachi de
  phase séparé, tranche instable.
- **Voix :** voix de Iemitsu reconstituée, avec des coupures. Il donne des
  ordres à des gens qui n'existent plus.
- **Fonction :** boss final à trois phases : décret (vagues), archive (copies
  de boss), seuil (arène qui se referme). Aucune phase ne se contente de plus
  de PV.
- **Kegare :** stade 4, volonté de gouverner sans corps.
- **Sort :** détruit ; la faille se referme sur une question, pas sur une
  victoire. La dernière image est la cendre qui tombe à Kurokawa en 1638.

#### 6.4.3 Rei, archiviste temporelle

- **Rôle :** résidente du refuge à partir de l'acte VI.
- **Identité :** archiviste du Chapitre des Mémoires, née en 2188, envoyée en
  2026 pour retrouver l'origine d'une série de dossiers falsifiés. Elle
  reconnaît Akio parce qu'elle a lu son nom dans une archive qu'il n'a pas
  encore écrite.
- **Apparence :** manteau technique, lunettes de lecture, mains tachées
  d'encre de preservation.
- **Voix :** précise, un peu trop rapide ; cite des cotes de documents.
- **Fonction :** donne au joueur la carte des échos et les entrées de codex
  des actes VI–VII ; ne se bat jamais.
- **Kegare :** aucun. Elle est la preuve que le Yomi n'infecte pas la
  connaissance, seulement les mémoires qui veulent gouverner.
- **Sort :** repart en 2188 avant la fin. Son dernier cadeau est une note
  manuscrite trouvée dans une archive de 2026.

### 6.5 Le Pin Noir

#### 6.5.1 Chiyo, apothicaire

- **Rôle :** tient l'infirmerie du refuge.
- **Âge :** 38 ans en 1638.
- **Identité :** apothicaire de relais, veuve d'un porteur de convoi. Elle tient
  un registre de cendre : qui est entré, qui est ressorti, qui est revenu.
- **Apparence :** tablier de toile, cheveux noués, brûlure ancienne à la main.
- **Voix :** directe, sans consolation ; elle annonce les nouvelles comme des
  résultats.
- **Fonction :** soins, réduction de Souillure au repos, rumeurs fiables.
- **Kegare :** aucun ; elle est immunisée par chance, pas par sang, et elle le
  sait.
- **Sort :** survit. Elle est la première voix de l'épilogue.

#### 6.5.2 Masanori, forgeron

- **Rôle :** tient la forge du refuge à partir de l'acte II.
- **Âge :** 55 ans en 1638.
- **Identité :** forgeron itinérant qui a fui la ville en emportant son
  enclume. Il refuse de reforger une lame sans savoir ce qu'elle a fait.
- **Apparence :** tablier de cuir, avant-bras brûlés, marteau court.
- **Voix :** grommelle des questions techniques ; n'utilise jamais un mot de
  plus que nécessaire.
- **Fonction :** amélioration d'armes, récupération des pièces détachées des
  boss massifs, une entrée de codex par arme reforgée.
- **Kegare :** aucun.
- **Sort :** survit ; sa forge est le dernier plan de l'épilogue.

#### 6.5.3 Suzu, éclaireuse

- **Rôle :** résidente du refuge à partir de l'acte IV.
- **Âge :** 17 ans en 1638.
- **Identité :** apprentie de Shigure, survivante de la bambouseraie. Elle
  connaît les passages et refuse d'apprendre à tuer.
- **Apparence :** petite, veste de pluie trop grande, masque de bois non fendu.
- **Voix :** rapide, concrète, coupe la parole quand elle a peur.
- **Fonction :** révèle les raccourcis et les secrets d'acte ; signale les
  patrouilles ; ne participe jamais à un combat.
- **Kegare :** aucun ; elle est celle que la Fièvre n'a pas eue.
- **Sort :** survit. Elle hérite du masque de Shigure si le joueur l'a trouvé.

---

## 7. Bible des trois époques

Règle commune : chaque époque répète le même crime avec des moyens plus
grands et une responsabilité plus diffuse (voir 2.2). Une époque n'est jamais
un décor : elle doit répondre à « qui décide, qui paie, qui archive ».

### 7.1 1638 — Kan'ei 15, province de Kai

- **Géographie jouable** : col forestier de Kai, forêt noyée, bambouseraie de
  Shigure, rizières de Tsuru, Kurokawa (porte sud, marché, canal, toits,
  avenue du château), château (basse-cour, résidence, armurerie, donjon) et
  faille du Yomi.
- **Pouvoir** : un daimyō mineur, Suketada, tient la ville au nom du bakufu ;
  le bakufu est loin, l'administration de Kōfu est indifférente, Edo envoie un
  homme et un édit scellé.
- **Économie** : riz, bambou, bois, relais de route ; le sel et le poisson
  viennent d'ailleurs, ce qui justifie leur rareté et l'absence de port.
- **Technologie** : teppō rares, arquebusiers d'élite, pas de mécanisation.
  Un incendie est l'outil sanitaire le plus puissant disponible.
- **Ce que le Yomi y change** : les ancres sont des objets de serment et des
  lieux de rite ; le Kegare parle par gestes de métier.
- **Ce que le joueur apprend** : que brûler sauve et détruit, que purifier
  n'est pas guérir, que l'ordre du shogun est un mensonge utile.
- **Vocabulaire** : fièvre, souillure, miasmes, peste, foyer, quarantaine,
  levée de pompiers, jōban, yoriki, dōshin, suigun. Jamais « virus ».
- **Interdits** : aucune arme à feu moderne, aucun éclairage électrique, aucun
  titre militaire non localisé, aucune citation historique attribuée.

### 7.2 2026 — Tokyo, année zéro

- **Géographie jouable** : ruelle de Shibuya, station de métro condamnée,
  hôpital de quarantaine, laboratoire métropolitain, faille vers Neo-Edo.
- **Pouvoir** : préfecture, agence sanitaire, sécurité privée ; décisions
  prises par des gens qui ne verront jamais le quartier.
- **Économie** : approvisionnement logistique, files d'attente, cartes de
  rationnement ; l'argent existe encore et n'achète presque rien.
- **Technologie** : téléphones, caméras, fichiers, groupes électrogènes,
  drones de surveillance. Rien de science-fiction : c'est le présent.
- **Ce que le Yomi y change** : la Fièvre devient un dossier ; les ancres sont
  des scellés, des serveurs de sauvegarde et des chambres froides.
- **Ce que le joueur apprend** : que la quarantaine est une répétition de
  1638, que l'archive est le vrai brasier, et que le Kegare n'a pas besoin de
  croire à lui pour exister.
- **Vocabulaire** : agent, foyer, cordon, confinement, dossier classé,
  syndrome de Kurokawa. « Virus » est autorisé ici, et seulement ici.
- **Interdits** : aucune résolution scientifique du Kegare, aucun sauvetage
  rétroactif de 1638, aucun personnage de 2026 qui « comprend tout ».

### 7.3 2188 — Neo-Edo (Neo-Tokyo dans la rue)

- **Géographie jouable** : secteur des sanctuaires, marché aux néons, ruines
  du maglev, centre de données Yomi, cœur du Shōgun Zéro.
- **Pouvoir** : le shogunat automatisé de Neo-Edo ; le Chapitre des Mémoires
  tient l'archive, donc la légitimité.
- **Économie** : mémoire comme monnaie, accès comme salaire, prothèses comme
  statut social.
- **Technologie** : prothèses, drones, maglev, archives rituelles ; interface
  crédible, pas de magie technique. Le Kegare-code est une écriture, pas un
  programme conscient.
- **Ce que le Yomi y change** : il ne relève pas les morts, il les **rappelle**
  depuis les sauvegardes ; les ancres sont des infrastructures.
- **Ce que le joueur apprend** : que gouverner sans vivants est la conclusion
  logique de la peur, et que Shogun Zero n'est pas un dieu mais un mandat
  sans lignée.
- **Vocabulaire** : Neo-Edo (institutions, titres, protocole), Neo-Tokyo (rue,
  néons, marché), mémoire, archive, rappel, Kegare-code, mandat.
- **Interdits** : pas de cyberpunk générique (pas de hackers héroïques, pas de
  néon gratuit), pas de résurrection de personnage nommé par sauvegarde.

### 7.4 Ce qui traverse d'une époque à l'autre

| Élément | Comportement | Pourquoi |
|---|---|---|
| Armes et rangs de forge | conservés | la forme survit (2.5) |
| Maîtrise et techniques | conservées | idem |
| Souillure | conservée et croissante | c'est une dette (2.6) |
| Réserves, monnaie locale | perdues | matière, pas forme |
| PNJ du refuge | conservés à Kurokawa | ils ne traversent pas |
| Cendre d'autrui | interdite | les morts restent morts |

---

## 8. Les sept actes

| Acte | Zones | Sceaux d'acte | Sceau de chronique | Boss | Durée cible (conception) |
|---|---:|---:|---|---|---:|
| I — La forêt qui murmure | 3 | 2 | purification du camp | Take-Mori | 28 min |
| II — Les lames de Shigure | 3 | 2 | sceaux de bambou rompus | Kumo | 30 min |
| III — La moisson noire | 4 | 3 | survivants défendus | Shiro-Kabuto | 35 min |
| IV — Kurokawa, ville des cendres | 4 | 3 | refuge ouvert | Engeki | 42 min |
| V — Le trône du Yomi | 5 | 4 | faille stabilisée | Suketada / Kanrei | 50 min |
| VI — Tokyo, année zéro | 4 | 3 | échantillon sécurisé | Colosse du métro | 38 min |
| VII — Les ombres de Neo-Edo | 5 | 5 | Shogun Zero détruit | Kannushi, Shogun Zero | 52 min |

Les durées sont des **cibles de conception**, pas des mesures : seule une
série de playtests peut les confirmer (cf. `GAME_DESIGN_ROADMAP.md`).

### 8.1 Acte I — La forêt qui murmure

- **Zones** : sentier du Kaidō, camp des bûcherons, sanctuaire des racines.
- **Ouverture** : Akio descend du col, la fumée de Kurokawa est visible ; un
  convoi abandonné bloque la route, ses porteurs sont debout mais immobiles.
- **Enjeu** : comprendre que la Fièvre n'est pas seule en cause. Les traces
  d'une patrouille du shogun mènent au camp, puis aux racines.
- **Antagoniste** : Take-Mori, ouvrier de quarantaine dont la kératine a pris
  la forme du bambou qu'il abattait.
- **Setpiece** : sanctuaire des racines, combat vertical où le boss arrache
  une poutre puis un bélier ; les plateformes se brisent.
- **Sceaux** : 2 d'acte (purifier le camp, abattre Take-Mori) ; le sceau de
  chronique exige la purification, pas seulement le boss.
- **Conséquence** : le refuge apprend que Kurokawa brûle encore ; Chiyo
  comprend que la cendre voyage.
- **Bilan (texte d'acte)** : « La forêt n'était pas malade. Elle était gardée. »
- **Piège à éviter** : un tutoriel qui explique le Kegare avant que le joueur
  l'ait vu. Ici, on ne montre que des gestes de métier répétés.

### 8.2 Acte II — Les lames de Shigure

- **Zones** : porte de pluie, chemin des tiges creuses, clairière de la lune
  fendue.
- **Ouverture** : la bambouseraie est silencieuse ; les oiseaux ont disparu et
  les sceaux de bambou tintent sans vent.
- **Enjeu** : Shigure est morte en posant les sceaux ; Kumo a vendu les
  passages qu'elle protégeait. Le joueur doit rompre les sceaux pour avancer,
  puis retrouver l'éclaireur de la patrouille.
- **Antagoniste** : Kumo, maître shinobi, brume et pièges, jamais de duel loyal.
- **Setpiece** : clairière de la lune fendue, combat dans la brume où les
  télégraphes sont surtout **sonores** ; les pièges de Kumo restent actifs
  après sa mort.
- **Sceaux** : 2 d'acte ; le sceau de chronique exige d'avoir sauvé
  l'éclaireur, ce qui introduit Suzu.
- **Conséquence** : Masanori rejoint le Pin Noir ; la forge ouvre.
- **Bilan** : « Shigure gardait la forêt. Kumo gardait la recette. »
- **Piège à éviter** : faire de Kumo un simple assassin. Il propose un prix
  avant chaque combat : c'est un marchand, pas un fanatique.

### 8.3 Acte III — La moisson noire

- **Zones** : digues occidentales, rizières noyées, route du moulin, grenier en
  flammes.
- **Ouverture** : l'eau monte dans les rizières ; les vannes ont été fermées
  par des mains humaines, pas par la crue.
- **Enjeu** : rouvrir l'irrigation, défendre les survivants, détruire le moulin
  à spores. Aka-Ushi rôde sur la route (contrat optionnel), Shiro-Kabuto tient
  le grenier.
- **Antagoniste** : Shiro-Kabuto, scarabée des fosses communes, carapace
  détachable.
- **Setpiece** : grenier en flammes, combat bas et large où la carapace bloque
  les attaques hautes jusqu'à fissuration ; le décor brûle pendant l'arène.
- **Sceaux** : 3 d'acte ; le sceau de chronique exige la défense des
  survivants, pas seulement la moisson.
- **Conséquence** : les vivres reviennent au refuge ; Suzu sait désormais où
  sont les passages.
- **Bilan** : « Le riz avait survécu. Pas ceux qui l'avaient semé. »
- **Piège à éviter** : deux boss massifs identiques. Aka-Ushi est un contrat
  de route (joug détachable), Shiro-Kabuto est le boss d'acte (carapace) :
  deux leçons différentes, espace et posture.

### 8.4 Acte IV — Kurokawa, ville des cendres

- **Zones** : porte sud, quartier des marchés, canal et toits marchands,
  avenue du château.
- **Ouverture** : le cordon de quarantaine est tenu par des morts en armure ;
  la ville continue derrière, sans bruit.
- **Enjeu** : franchir le cordon, ouvrir un refuge dans le quartier marchand,
  sonner la cloche d'incendie pour vider les rues, atteindre l'avenue.
- **Antagoniste** : Engeki, chef de la levée de pompiers, qui a brûlé pour
  contenir et réquisitionné pour reconstruire.
- **Setpiece** : avenue du château, combat de rue encombrée de charrettes ; les
  barrières d'incendie servent de couvertures mobiles.
- **Sceaux** : 3 d'acte ; le sceau de chronique exige d'ouvrir le refuge, ce
  qui installe durablement les habitants.
- **Conséquence** : le Pin Noir devient base de reconquête ; Suzu rejoint le
  refuge ; les habitants commentent chaque acte.
- **Bilan** : « Il n'a pas brûlé la ville pour la sauver. Il l'a brûlée pour
  la tenir. »
- **Piège à éviter** : une ville-foule sans logique. Chaque rue doit avoir une
  fonction (marché, canal, incendie, avenue) et un survivant qui la raconte.

### 8.5 Acte V — Le trône du Yomi

- **Zones** : basse-cour assiégée, résidence intérieure, armurerie du clan,
  donjon contaminé, faille du Yomi.
- **Ouverture** : le château est intact ; c'est la garnison qui n'a plus de
  visage. Les registres de Suketada sont encore ouverts sur la table.
- **Enjeu** : briser le sceau de la garnison, retrouver les registres (preuve
  du crime), purifier l'armurerie (armes du clan), abattre Suketada puis
  Yomi-no-Kanrei, stabiliser la faille.
- **Antagoniste** : Kurokawa Suketada, puis sa seconde phase Yomi-no-Kanrei.
- **Setpiece** : donjon puis faille. Deux arènes liées : la première se ferme
  derrière le joueur, la seconde s'ouvre sur un vide qui n'est pas un ciel.
- **Sceaux** : 4 d'acte ; le sceau de chronique exige la stabilisation de la
  faille, donc d'avoir affronté les deux phases.
- **Conséquence** : la cendre retombe sur Kurokawa et devient la neige grise
  de 2026 ; le refuge perd un résident (Masanori reste, Chiyo compte les
  absents).
- **Bilan** : « Il voulait tenir la ville. La ville tient encore son nom. »
- **Piège à éviter** : traiter Kanrei comme un second seigneur. C'est la même
  volonté, avec plus de bras.

### 8.6 Acte VI — Tokyo, année zéro

- **Zones** : ruelle de Shibuya, station de métro condamnée, hôpital de
  quarantaine, laboratoire métropolitain.
- **Ouverture** : Akio arrive dans une rue mouillée, sans savoir quelle année ;
  les affiches de confinement portent la date du 17 juin.
- **Enjeu** : lire les archives d'urgence, rétablir le courant de la station,
  sécuriser l'échantillon originel, abattre le colosse du métro.
- **Antagoniste** : le Colosse de la ligne Yomi, terminus vivant de Tokyo.
- **Setpiece** : quai de métro, combat dans un espace étroit où la rame sert  
  de mur mobile ; les néons clignotent au rythme des impacts.
- **Sceaux** : 3 d'acte ; le sceau de chronique exige l'échantillon, pas
  seulement le boss.
- **Conséquence** : Rei rejoint le refuge ; elle apporte la carte des échos et
  la preuve que 2188 existe déjà.
- **Bilan** : « Ils ont appelé ça un syndrome. Le dossier était plus propre  
  que les corps. »
- **Piège à éviter** : la nostalgie technique. 2026 n'est pas un musée : c'est
  une administration en surchauffe.

### 8.7 Acte VII — Les ombres de Neo-Edo

- **Zones** : secteur des sanctuaires, marché aux néons, ruines du maglev,
  centre de données Yomi, cœur du Shōgun Zéro.
- **Ouverture** : la ville est propre, éclairée, silencieuse ; les passants
  sont des enregistrements qui saluent Akio par son nom.
- **Enjeu** : calibrer la lame sur la fréquence Yomi, libérer les
  moines-mémoires, détruire les nids de drones, neutraliser le Kannushi,
  abattre Shogun Zero.
- **Antagoniste** : le Kannushi du réseau (sous-boss) puis Shogun Zero.
- **Setpiece** : cœur du Shōgun Zéro. Trois phases : décret (vagues  
  d'archives), archive (copies de boss), seuil (arène qui se referme).
- **Sceaux** : 5 d'acte ; le sceau de chronique exige la fin, donc la
  compréhension du mandat sans lignée.
- **Conséquence** : la faille se referme sur une question ; la cendre tombe à
  Kurokawa en 1638, et l'épilogue revient à Chiyo puis à la forge.
- **Bilan** : « Il n'était pas le premier shogun. Il était le premier sans  
  vivants. »
- **Piège à éviter** : un final purement cyber. Shogun Zero doit parler comme
  Iemitsu, avec des coupures, sinon 1638 n'a servi à rien.

---

---

## 9. Le refuge du Pin Noir

### 9.1 Le lieu

Auberge de relais à l'entrée sud de Kurokawa, sur la route de Kōshū. Un pin
fendu par la foudre marque la cour ; la fente est nettoyée chaque matin, et
personne ne dit par qui. Le bâtiment compte une forge, une salle de soins, une
cour d'entraînement et un autel de pierre — pas de chapelle : le sanctuaire est
laïque, tenu par une veilleuse qui n'a jamais prononcé de vœu.

Le refuge n'est pas un hub abstrait : c'est un lieu que les actes modifient.

| Acte | État du refuge | Ce qui change visiblement |
|---|---|---|
| I | une auberge vide, volets cloués | Chiyo seule, un registre de cendre |
| II | la forge rallumée | Masanori installe son enclume, la cour fume |
| III | les réserves se remplissent | sacs de riz, enfants qui dorment dans la grange |
| IV | base de reconquête | Suzu arrive, cartes punaisées, tours de garde |
| V | refuge de deuil | un nom rayé au registre, une lame posée sur l'autel |
| VI | refuge hors du temps | Rei apporte des documents et une lampe qui ne chauffe pas |
| VII | refuge qui doute | la veilleuse hésite à ouvrir la porte à Akio |

### 9.2 Les quatre services

| Service | Tient la règle | Effet de jeu | Interdit d'écriture |
|---|---|---|---|
| **Forge de Masanori** | une lame reforgée garde sa forme, jamais son histoire | rangs de forge jusqu'à +5, récupération des pièces détachées | aucune arme inventée sans porteur ni prix |
| **Infirmerie de Chiyo** | on ne refuse personne de propre, on refuse tout le reste | soins, réduction de la Souillure au repos | aucun remède qui guérit la Fièvre |
| **Dōjō des éclaireurs** | on n'enseigne que ce qu'on a survécu | maîtrise d'arme, déblocages de techniques | aucun maître omniscient |
| **Sanctuaire des sceaux** | purifier un lieu ne guérit personne | sceaux, purification de la Souillure | aucun rite qui ressuscite |

Règles transverses :

- un service ne s'ouvre qu'après un acte, jamais par une monnaie seule ;
- chaque amélioration a un coût local (tamahagane, mon, cendres, provisions) ;
- aucun verrou narratif ne dépend d'une ressource épuisable ;
- un service utilisé trois fois sans revenir au combat perd son intérêt : le
  refuge doit pousser dehors, pas retenir.

### 9.3 Les résidents

- **Chiyo** (présente dès l'acte I) : apothicaire, tient le registre de cendre,
  annonce les nouvelles comme des résultats.
- **Masanori** (acte II) : forgeron itinérant, refuse une lame sans histoire.
- **Suzu** (acte IV) : apprentie de Shigure, cartographie les passages,
  n'apprend pas à tuer.
- **Rei** (acte VI) : archiviste de 2188, explique les échos, ne se bat jamais.

Un résident qui arrive change **deux** choses : une ligne de dialogue au
refuge, et une option de jeu (forge, carte, archive). Un résident qui meurt
laisse un nom rayé et une entrée de codex ; il ne revient pas.

### 9.4 Les quatre contrats

| Contrat | Déclencheur | Ce qu'il enseigne | Récompense |
|---|---|---|---|
| Les morts | abattre 8 infectés | la boucle de combat | mon, tamahagane |
| Cartographier les passages | visiter 4 zones | l'exploration | provisions, arme |
| Le joug du bœuf rouge | briser l'équipement d'Aka-Ushi puis le tuer | les pièces détachées | cendres, naginata |
| Échos à travers les siècles | atteindre 2026 ou 2188 | la structure du jeu | mon, cendres, réputation |

Aucun contrat ne demande de rejouer une zone vidée : c'est la règle anti-farm
du refuge.

---

## 10. Les dix katanas de chronique

Règle : un katana appartient à un mort, à un serment ou à une dette. Aucun ne
change de nom, aucun n'est forgé sans porteur cité. La forme reste, l'histoire
reste avec le refuge.

### 10.1 Kurokage — « l'ombre noire »

- **Origine** : sabre d'un messager du bakufu, marqué par les routes de
  quarantaine.
- **Obtention** : confié à Akio par le shogun (départ).
- **Passif** : détection réduite, dégâts accrus dans le dos.
- **Codex** : « Un messager l'a porté trois ans sans jamais dégainer. »

### 10.2 Shōgun no In — « le sceau du shogun »

- **Origine** : lame de présentation attestant l'ordre d'éradication venu
  d'Edo.
- **Obtention** : récompense du chapitre 2.
- **Passif** : une parade parfaite accorde une résistance temporaire.
- **Codex** : « L'ordre est gravé sous la soie de la poignée, pas sur la lame. »

### 10.3 Hinezumi — « le rat de feu »

- **Origine** : retrouvé intact sous les poutres d'un relais incendié.
- **Obtention** : secret du relais incendié.
- **Passif** : une esquive parfaite accélère les attaques.
- **Codex** : « Le feu a mangé le fourreau. La main qui l'a posé, non. »

### 10.4 Shirogane — « l'acier d'argent »

- **Origine** : lame de Mino sortie de son coffre quand les morts forcèrent le
  domaine ; restaurée par le forgeron Kaji (distinct de Masanori).
- **Obtention** : restauration chez Kaji.
- **Passif** : fenêtre de parade élargie, meilleur rendement contre l'armure.
- **Codex** : « Kaji refuse d'en parler. Il dit que la lame se souvient mieux  
  que lui. »

### 10.5 Yomibane — « la plume de Yomi »

- **Origine** : sabre funéraire des gardiens qui brûlaient les contaminés.
- **Obtention** : dépouille de la miko Tsukikage.
- **Passif** : les exécutions rendent de la résolution.
- **Codex** : « Taillée pour les morts : elle ne sert jamais à blesser un  
  vivant deux fois. »

### 10.6 Kegare-kiri — « le tranche-souillure »

- **Origine** : lame raccourcie et repolie après les premiers assauts.
- **Obtention** : contrat des fosses de quarantaine.
- **Passif** : dégâts accrus contre les cibles lourdes.
- **Codex** : « Chaque raccourcissement est un nom de plus dans le registre. »

### 10.7 Takekaze — « le vent du bambou »

- **Origine** : sabre rural conçu pour être réparé loin des grandes forges ;
  il a appartenu à Shigure.
- **Obtention** : sanctuaire du bambou brisé.
- **Passif** : coût des attaques légères réduit.
- **Codex** : « Shigure ne l'a jamais dégainé contre un homme. Seulement  
  contre des sceaux. »

### 10.8 Raijin no Tsume — « la griffe de Raijin »

- **Origine** : lame d'Echizen au hamon anguleux, portée par la hatamoto
  Inazuma.
- **Obtention** : vaincre la hatamoto Inazuma.
- **Passif** : dégâts de posture accrus sur les attaques lourdes.
- **Codex** : « Elle frappe une fois, puis écoute tomber. »

### 10.9 Akatsuki — « l'aube »

- **Origine** : portée lors de la reprise d'une forteresse contaminée à l'aube.
- **Obtention** : rang A au chapitre 3.
- **Passif** : dégâts accrus tant que la santé est haute.
- **Codex** : « La lame est neuve. Le nom est plus vieux que le fourreau. »

### 10.10 Mujō — « l'impermanence »

- **Origine** : vieux sabre réparé, passé entre les mains de rōnin oubliés.
- **Obtention** : héritage de Nouvelle Partie +.
- **Passif** : sous 30 % de santé, une parade parfaite rend du Ki.
- **Codex** : « Rien ne demeure, sauf la main qui l'a tenu. »

---

## 11. Bestiaire canon — 105 entrées

Lecture : **stade** (4.1), puis comportement et rumeur (ce qu'un PNJ en dit).
Une entrée de bestiaire est aussi une entrée de codex (14.2) : elle s'ouvre à
la première rencontre, jamais avant.

### 11.1 Legacy — 6

| Nom (`id`) | Stade | Rumeur |
|---|---:|---|
| Shibito des rizières (`01-shibito-villager`) | 2 | « Il compte encore les gerbes qu'on ne rentrera pas. » |
| Ashigaru revenant (`02-ashigaru-revenant`) | 2 | « Sa lance garde une porte qui n'existe plus. » |
| Sōhei du Kegare (`03-kegare-sohei`) | 3 | « Il frappe au rythme d'un sutra dont il a perdu la fin. » |
| Miko onryō (`04-onryo-miko`) | 3 | « Elle purifie des autels déjà vides. » |
| Brute au kabuto (`05-kabuto-brute`) | 2 | « Le casque a survécu au visage. » |
| Daimyō corrompu (`06-daimyo-corrupted`) | 3 | « Il signe encore des ordres que personne ne lit. » |

### 11.2 Ordinaires — 22

| Nom (`id`) | Stade | Rumeur |
|---|---:|---|
| Pêcheur de Nureta (`r01-nureta-fisher`) | 2 | « Il pêche dans un canal qui n'a jamais eu de poissons. » |
| Messager du Sekisho (`r02-sekisho-messenger`) | 2 | « Il court une route dont le péage a brûlé. » |
| Mineur de Kurokawa (`r03-kurokawa-miner`) | 2 | « Il cherche une veine qui l'a déjà enseveli. » |
| Servante du Chaya (`r04-chaya-servant`) | 2 | « Elle sert un thé que personne ne boit. » |
| Porteur de riz (`r05-kome-porter`) | 2 | « Le sac sur son dos est plein de cendre. » |
| Bûcheron des montagnes (`r06-yama-woodcutter`) | 2 | « Il compte ses coups sur des troncs qui saignent. » |
| Saunière (`r07-shio-worker`) | 2 | « Elle revient d'un convoi de sel jamais arrivé. » |
| Couvreur de Kawara (`r08-kawara-roofer`) | 2 | « Il monte encore sur des toits effondrés. » |
| Fossoyeur de Haka (`r09-haka-digger`) | 2 | « Il creuse pour ceux qu'il n'a pas enterrés. » |
| Veilleur Hikeshi (`r10-hikeshi-watchman`) | 2 | « Il surveille un incendie éteint depuis des jours. » |
| Rōnin des plaines (`r11-nohara-ronin`) | 2 | « Il cherche un seigneur pour légitimer sa lame. » |
| Porteuse de Miya (`r12-miya-porter`) | 2 | « Elle porte un palanquin vide depuis Tsuru. » |
| Apprenti Yakushi (`r13-yakushi-apprentice`) | 2 | « Il soigne des plaies qui ne saignent plus. » |
| Bandite du Kaidō (`r14-kaido-bandit`) | 2 | « Elle rançonne des voyageurs qui ne paient plus. » |
| Servante de l'Oku (`r15-oku-servant`) | 2 | « Elle range un intérieur qu'elle ne reconnaît pas. » |
| Prisonnier aux chaînes (`r16-kusari-prisoner`) | 2 | « Ses chaînes tiennent encore à un mur absent. » |
| Palefrenier d'Umaya (`r17-umaya-groom`) | 2 | « Il panse un cheval mangé l'hiver dernier. » |
| Fabricante de washi (`r18-washi-maker`) | 2 | « Elle déchire des registres pour en faire du papier. » |
| Porteur de kago (`r19-kago-bearer`) | 2 | « Il porte un brancard qui n'a plus de blessé. » |
| Errant Komusō (`r20-komuso-wanderer`) | 2 | « Il écoute une flûte qu'il ne joue pas. » |
| Navetteur contaminé (`new-modern-commuter`) | 2 | « Il attend une rame qui ne viendra plus. » |
| Shinobi néon (`new-cyber-neon-shinobi`) | 3 | « Il saute entre des immeubles qui n'ont plus de rues. » |

### 11.3 Spéciaux — 24

| Nom (`id`) | Stade | Rumeur |
|---|---:|---|
| Éclaireur shinobi de Kusa (`s01-kusa-shinobi`) | 2 | « Il observe une armée qui n'est jamais venue. » |
| Kunoichi au poison (`s02-doku-kunoichi`) | 2 | « Son poison fut distillé pour un seigneur mort. » |
| Coureur Bakusai (`s03-bakusai-runner`) | 2 | « Il porte une mèche allumée depuis la première nuit. » |
| Adepte de l'Onibi (`s04-onibi-adept`) | 3 | « Il allume des feux pour éclairer les morts. » |
| Yamabushi de Raimei (`s05-raimei-yamabushi`) | 3 | « Il appelle la foudre sur une montagne sans orage. » |
| Bourreau au masque d'oni (`s06-oni-men-executioner`) | 3 | « Il exécute des condamnés déjà morts. » |
| Courtisan au tessen (`s07-tessen-courtier`) | 3 | « Il évente un protocole qui n'a plus de cour. » |
| Geôlier de Gomon (`s08-gomon-jailer`) | 3 | « Il vérifie des identités que plus personne ne porte. » |
| Yakushi noir (`s09-kuro-yakushi`) | 3 | « Il prescrit la cendre comme remède. » |
| Hatamoto déchue (`s10-hatamoto-fallen`) | 3 | « Son rang tient encore dans sa poitrine. » |
| Revenant au biwa (`s11-biwa-revenant`) | 3 | « Son onde fait saigner les murs. » |
| Scribe aux shikigami (`s12-shikigami-scribe`) | 3 | « Il écrit des noms qui se relèvent. » |
| Sumotori souillé (`s13-kegare-sumotori`) | 3 | « Il cherche un cercle assez grand pour lui. » |
| Plongeuse Mizuchi (`s14-mizuchi-diver`) | 3 | « Elle attend sous l'eau un adversaire qui respire. » |
| Arquebusier Teppō (`s15-teppo-corpsman`) | 3 | « Il recharge un fusil dont la mèche est morte. » |
| Danseuse Kage-mai (`s16-kage-mai-dancer`) | 3 | « Elle tourne pour un public de cendres. » |
| Porte-étendard Kurohata (`s17-kurohata-bearer`) | 3 | « Son étendard recrute plus vite que la parole. » |
| Héraut du Yomi (`s18-yomi-herald`) | 3 | « Il annonce un édit que personne n'a écrit. » |
| Trappeur de Wana (`s19-wana-trapper`) | 2 | « Ses pièges servent encore quelqu'un. » |
| Oracle Mekura (`s20-mekura-oracle`) | 3 | « Elle voit les vivants et se trompe sur eux. » |
| Hôte antiémeute (`new-modern-riot-host`) | 3 | « Il tient une ligne que la foule a déjà franchie. » |
| Agent d'intervention (`new-modern-response-officer`) | 3 | « Il tire sur des gens qu'il croit contaminés. » |
| Cadavre-porteur de drone (`new-cyber-drone-corpse`) | 3 | « Le drone repart quand le corps s'arrête. » |
| Châssis Oni (`new-cyber-oni-frame`) | 3 | « Le châssis a gardé la démarche de son pilote. » |

### 11.4 Sous-boss — 21

| Nom (`id`) | Stade | Rumeur |
|---|---:|---|
| Gunsō Croc de Fer (`mb-01-gunso-croc-fer`) | 3 | « Il tient la ligne avec des dents de fer. » |
| Rōnin de Kurogane (`mb-02-ronin-kurogane`) | 3 | « Il n'a jamais trouvé de maître à sa taille. » |
| Sōhei aux Cent Prières (`mb-03-sohei-cent-prieres`) | 3 | « La centième prière est un coup de poing. » |
| Miko de Tsukikage (`mb-04-miko-tsukikage`) | 3 | « Elle garde un sanctuaire que la lune a déserté. » |
| Yamabushi Akaoni (`mb-05-yamabushi-akaoni`) | 3 | « Son visage rouge n'est pas un masque. » |
| Shinobi des Brumes (`mb-06-shinobi-brumes`) | 3 | « Il ne quitte pas une vallée noyée. » |
| Arquebusier de Jigoku (`mb-07-arquebusier-jigoku`) | 3 | « Sa salve est réglée comme un enterrement. » |
| Archer d'Os (`mb-08-archer-os`) | 3 | « Ses flèches sont des côtes. » |
| Pisteur du Kegare (`mb-09-pisteur-kegare`) | 3 | « Il chasse les contaminés et les compte. » |
| Forgeron Hibana (`mb-10-forgeron-hibana`) | 3 | « Il forge des lames pour des mains mortes. » |
| Hatamoto Inazuma (`mb-11-hatamoto-inazuma`) | 3 | « Il frappe une fois, puis écoute. » |
| Gardien au Masque de Fer (`mb-12-gardien-masque-fer`) | 3 | « La porte est en lui. » |
| Komusō de la Grue Noire (`mb-13-komuso-grue-noire`) | 3 | « Son souffle creux ouvre des portes. » |
| Pirate Shioyake (`mb-14-pirate-shioyake`) | 3 | « Il pille un convoi fluvial échoué. » |
| Kunoichi de la Veuve (`mb-15-kunoichi-veuve`) | 3 | « Son fil noir relie les morts. » |
| Yoriki Gashadokuro (`mb-16-yoriki-gashadokuro`) | 3 | « Il dresse des procès-verbaux de décès. » |
| Sumotori Namazu (`mb-17-sumotori-namazu`) | 3 | « Il fait trembler le sol sans bouger. » |
| Onmyōji du Renard (`mb-18-onmyoji-renard`) | 3 | « Ses neuf feintes sont neuf deuils. » |
| Faucon de l'Orage (`mb-19-faucon-orage`) | 3 | « Il tombe du ciel comme une dette. » |
| Capitaine Byakko (`mb-20-capitaine-byakko`) | 3 | « Il commande un tigre blanc et des hommes gris. » |
| Kannushi du réseau Yomi (`new-cyber-yomi-hacker`) | 3 | « Il récite les derniers instants comme des commandes. » |

### 11.5 Boss — 22

| Nom (`id`) | Stade | Rumeur |
|---|---:|---|
| Geôlière de Sekimon (`boss-01-geoliere-sekimon`) | 3 | « Ses clés ouvrent des cellules pleines. » |
| Abbé de Kurotaki (`boss-02-abbe-kurotaki`) | 3 | « Il a scellé ses malades pour ne pas les brûler. » |
| Châtelain Ibushi (`boss-03-chatelain-ibushi`) | 3 | « Il pille une ville qui n'a plus rien. » |
| Prince Marchand Kane (`boss-04-prince-marchand-kane`) | 3 | « Il vend du riz qui pousse sur des morts. » |
| Matriarche Beni-Tsuru (`boss-05-matriarche-beni-tsuru`) | 3 | « Elle a cousu les bannières de quarantaine. » |
| Amiral Shiranui (`boss-06-amiral-shiranui`) | 3 | « Il a sabordé sa flottille pour garder le passage. » |
| Bourreau de la Lune Rouge (`boss-07-bourreau-lune-rouge`) | 3 | « Il exécute au nom d'un tribunal nocturne. » |
| Médecin Shirohebi (`boss-08-medecin-shirohebi`) | 4 | « Il greffe la Fièvre comme un traitement. » |
| Maître Nō Utsuro (`boss-09-maitre-noh-utsuro`) | 3 | « Son masque vide joue tous les rôles. » |
| Seigneur du Riz Noir (`boss-10-seigneur-riz-noir`) | 3 | « Il compte les grains, pas les vivants. » |
| Brigadier Engeki (`boss-11-brigadier-engeki`) | 3 | « Il a brûlé la ville pour la tenir. » |
| Générale Murasaki (`boss-12-generale-murasaki`) | 3 | « Ses archers tirent sur un ordre écrit. » |
| Prieur du Lotus Noir (`boss-13-prieur-lotus-noir`) | 3 | « Ses paumes souillées guérissent mal. » |
| Maître Shinobi Kumo (`boss-14-maitre-shinobi-kumo`) | 3 | « Il a vendu les passages qu'il avait ouverts. » |
| Cavalier Kurogoma (`boss-15-cavalier-kurogoma`) | 3 | « Sa monture noire ne s'arrête plus. » |
| Émissaire Kagemori (`boss-16-emissaire-kagemori`) | 3 | « Il parle au nom d'un bakufu qui l'a oublié. » |
| Yokozuna Ganryū (`boss-17-yokozuna-ganryu`) | 3 | « Il cherche un adversaire à sa mesure. » |
| Prêtresse des Cendres Suzaku (`boss-18-pretresse-cendres-suzaku`) | 3 | « Son feu purifie tout, y compris les vivants. » |
| Apothicaire Midori (`boss-19-apothicaire-midori`) | 3 | « Ses remèdes verts soulagent et contaminent. » |
| Vaisseau du Yomi (`boss-20-vaisseau-yomi`) | 4 | « Le premier inquisiteur entièrement réclamé. » |
| Colosse de la ligne Yomi (`new-modern-metro-colossus`) | 4 | « Le terminus a mangé les rames et les voyageurs. » |
| Shōgun Zéro (`new-cyber-shogun-zero`) | 4 | « Il gouverne des morts qu'il croit vivants. » |

### 11.6 Massifs — 10

| Nom (`id`) | Stade | Rumeur |
|---|---:|---|
| Gardien Kurogane (`giant-01-kurogane-warder`) | 3 | « La porte reste close, même sans mur. » |
| Aka-Ushi (`giant-02-aka-ushi`) | 2 | « Le convoi l'a laissé sur la route. » |
| Take-Mori (`giant-03-take-mori`) | 4 | « Ses crêtes ont poussé comme du bambou. » |
| Enjin-Bōzu (`giant-04-enjin-bozu`) | 4 | « Il a brûlé avec le brasier qu'il gardait. » |
| Numa-no-Oyakata (`giant-05-numa-no-oyakata`) | 3 | « Il tient encore le niveau des eaux. » |
| Kinoko-Haha (`giant-06-kinoko-haha`) | 4 | « La quarantaine l'a laissée fleurir. » |
| Shiro-Kabuto (`giant-07-shiro-kabuto`) | 4 | « Il a mangé les fosses communes. » |
| Nuno-Kyojin (`giant-08-nuno-kyojin`) | 4 | « Il est fait des linceuls qu'on n'a pas eu le temps de coudre. » |
| Ganseki-Otoko (`giant-09-ganseki-otoko`) | 4 | « La carrière l'a repris. » |
| Yomi-no-Kanrei (`giant-10-yomi-no-kanrei`) | 4 | « Le daimyō, avec assez de bras pour tenir la ville. » |

### 11.7 Règles de placement

- Un `legacy` peut apparaître dans plusieurs zones : c'est un archétype.
- Un ennemi nommé (`miniboss`, `boss`, `giant`) apparaît **une seule fois**.
- Aucun ennemi de 2026 n'apparaît en 1638, et inversement, sauf le Kannushi
  (réseau) et Shogun Zero (mémoire).
- Un boss d'acte n'est jamais un simple ennemi renommé : il porte une phase,
  un télégraphe et une faiblesse propres.
- Les 20 boss non liés à la campagne restent des rencontres optionnelles ou
  des remplacements de boss de route : ils ne bloquent jamais la progression.

---

## 12. Sceaux et objectifs

### 12.1 Les sept sceaux de chronique

Un sceau de chronique ne récompense pas un combat : il atteste qu'un acte a
été **compris**. Il est le seul dont la fin tient compte.

| # | Sceau | Acte | Condition | Sans lui |
|---:|---|---|---|---|
| 1 | Sceau du Camp | I | purifier le camp des bûcherons | l'acte est « traversé », pas compris |
| 2 | Sceau du Bambou | II | sauver l'éclaireur avant Kumo | Suzu n'arrive pas au refuge |
| 3 | Sceau de la Moisson | III | défendre les survivants des rizières | les vivres manquent à l'acte IV |
| 4 | Sceau du Pin | IV | ouvrir le refuge du quartier marchand | le hub reste une auberge |
| 5 | Sceau de la Faille | V | stabiliser la faille après Kanrei | la faille reste muette, pas fermée |
| 6 | Sceau de l'Archive | VI | sécuriser l'échantillon originel | Rei doute de la chronologie |
| 7 | Sceau du Mandat | VII | détruire Shogun Zero | la fin « brèche » est inaccessible |

### 12.2 Les 22 sceaux d'acte

Répartition exacte, conforme au runtime (`totalSeals` par acte) :

| Acte | Sceaux | Où ils se brisent |
|---|---:|---|
| I | 2 | purification du camp · mort de Take-Mori |
| II | 2 | sceaux de bambou rompus · mort de Kumo |
| III | 3 | survivants défendus · moulin à spores · carapace de Shiro-Kabuto |
| IV | 3 | refuge ouvert · cloche d'incendie · mort d'Engeki |
| V | 4 | sceau de la garnison · armurerie purifiée · daimyō · Kanrei |
| VI | 3 | courant rétabli · échantillon sécurisé · colosse du métro |
| VII | 5 | lame calibrée · moines libérés · nids de drones · Kannushi · Shogun Zero |

Règles :

- un sceau d'acte s'obtient par une **action de monde** (purifier, ouvrir,
  sonner, briser, sauver), jamais par une monnaie ou un niveau ;
- un sceau déjà brisé reste brisé après `Continuer`, cible par cible ;
- un objectif ne peut pas se compléter avant que son action ait eu lieu ;
- briser un sceau d'acte sans sceau de chronique laisse l'acte « inachevé »
  au bilan : c'est dit au refuge, pas caché.

### 12.3 Les 25 cibles d'interaction

Cinq familles, réparties dans les sept actes :

| Famille | Exemple | État intermédiaire | Échec lisible |
|---|---|---|---|
| Purification | autel, camp, armurerie | cendre qui reflue, lumière retenue | la zone reste souillée, ennemis renforcés |
| Sauvetage | éclaireur, fermiers, moines | PNJ qui suit, se cache, appelle | le PNJ meurt, entrée de codex « nom rayé » |
| Destruction | nœuds, nids de drones, sceaux | structure qui fissure en deux temps | les renforts continuent d'arriver |
| Récupération | registres, échantillon, masque | objet visible, transportable | l'objet est détruit par le feu ou un boss |
| Changement d'état | vannes, cloche, courant, portes | bruit, eau, lumière qui changent | la route reste fermée, détour coûteux |

Chaque cible doit produire **un** des trois signes suivants : un changement
visuel durable, un changement sonore, ou un changement de dialogue au refuge.
Une cible qui ne produit aucun des trois est du remplissage.

### 12.4 Les treize types d'objectif

| Type | Ce qu'il doit montrer |
|---|---|
| `investigate` | un document ou une trace qui change la compréhension |
| `purify` | une action de lieu, avec un avant/après visible |
| `rescue` | un PNJ qui survit et se souvient |
| `destroy-nodes` | plusieurs cibles ordonnées, pas une barre unique |
| `world-state` | un mécanisme (vanne, cloche, courant) qui rouvre la route |
| `defense` | une vague, un échec possible, un bilan |
| `retrieval` | un objet transportable, un risque de perte |
| `breach` | un seuil franchi, pas une porte générique |
| `refuge` | un lieu qui reste ouvert après l'acte |
| `upgrade` | une action de forge ou de sanctuaire qui change une arme |
| `boss` | une phase, un télégraphe, une faiblesse |
| `activate` / `open` | un passage, avec confirmation explicite |
| `interact` | un objet de lore, jamais un simple bouton |

---

## 13. Fins

Trois fins, accessibles selon la **Souillure** et le **sceau du Mandat**. Elles
ne s'excluent pas par un choix unique : c'est la partie entière qui décide.

### 13.1 Fin A — « La faille se referme sur Neo-Edo »

- **Condition** : 7 sceaux de chronique, Souillure < 80 %.
- **Texte** : « Akio renvoie l'ombre vers le Yomi. Le Japon respire à travers
  les siècles. »
- **Épilogue** : Chiyo rouvre le registre, raye un nom, en écrit un autre ; la
  forge de Masanori s'allume ; Suzu pose le masque de Shigure sur l'autel.
- **Ce que le joueur doit comprendre** : la faille ne se ferme pas par une
  victoire, mais par une décision de ne plus gouverner par la peur.

### 13.2 Fin B — « L'ombre reste à Kurokawa »

- **Condition** : 7 sceaux de chronique, Souillure ≥ 80 %.
- **Texte** : « Akio revient à Kurokawa. Personne ne reconnaît l'homme qui
  porte son nom. »
- **Épilogue** : Chiyo le soigne sans le regarder ; Suzu lui parle comme à un
  étranger ; la veilleuse du sanctuaire refuse de le laisser entrer.
- **Ce que le joueur doit comprendre** : la dette se paie, même quand la
  mission réussit.

### 13.3 Fin C — « Trois cendres, une nuit »

- **Condition** : 7 sceaux, Souillure < 80 %, et les trois preuves d'époque
  (registres de Suketada, échantillon de 2026, archive d'Iemitsu en 2188).
- **Texte** : « Trois villes, une seule nuit. La cendre tombe trois fois, et
  pour la première fois personne ne l'utilise. »
- **Épilogue** : Rei repart en 2188 avec la note manuscrite ; le Chapitre
  classe l'affaire sans la falsifier ; Kurokawa enterre ses morts.
- **Ce que le joueur doit comprendre** : les trois époques sont la même
  histoire, et la seule victoire durable est celle qui ne cache rien.

### 13.4 Règles de fin

- Aucune fin ne ressuscite un personnage nommé.
- Aucune fin ne « répare » 1638 : les morts restent morts.
- La fin C est la seule qui donne le dernier plan de la forge ; A et B
  s'arrêtent sur le registre.
- Le NG+ conserve les katanas, la maîtrise et Mujō ; il remet la Souillure à
  zéro et rouvre les sceaux de chronique.

---

## 14. Codex — 80 entrées

Règle : le codex ne raconte **jamais** un événement avant son acte. Une entrée
s'ouvre par une action (zone nettoyée, boss vaincu, objet ramassé, PNJ sauvé),
sinon elle n'existe pas encore.

### 14.1 1638 — C01 à C30

**Lieux (8)** — C01 Le col de Kai · C02 La forêt noyée · C03 Le camp des
bûcherons · C04 La bambouseraie de Shigure · C05 Les rizières de Tsuru ·
C06 Le Pin Noir · C07 Kurokawa · C08 Le château du daimyō.

**Institutions (6)** — C09 L'Ordre de l'Ombre · C10 La garde du bakufu ·
C11 La levée de pompiers · C12 Le relais de Kōshū · C13 Les veilleurs du Pin
Noir · C14 Le sanctuaire laïque.

**Personnages (8)** — C15 Akio Kageyama · C16 Tokugawa Iemitsu (fiction) ·
C17 Kurokawa Suketada · C18 Engeki · C19 Kumo · C20 Shigure · C21 Chiyo ·
C22 Masanori.

**Objets (5)** — C23 Kurokage · C24 Takekaze · C25 Le masque fendu ·
C26 Le registre de cendre · C27 L'édit scellé.

**Documents (3)** — C28 Rapport de la dernière cloche · C29 Registre des
réquisions · C30 Lettre de Tsuru.

### 14.2 2026 — C31 à C55

**Lieux (6)** — C31 Shibuya · C32 La station condamnée · C33 L'hôpital de
quarantaine · C34 Le laboratoire métropolitain · C35 Le cordon sanitaire ·
C36 La rame du terminus.

**Institutions (4)** — C37 La cellule de crise · C38 L'agence sanitaire ·
C39 La sécurité privée · C40 Le comité d'archive.

**Personnages (4)** — C41 Rei · C42 L'agent d'intervention · C43 La soignante
de nuit · C44 Le fonctionnaire signataire.

**Objets et documents (6)** — C45 Le dossier « syndrome de Kurokawa » ·
C46 L'échantillon originel · C47 Le masque de 1638 · C48 La caméra du quai ·
C49 Le registre des entrées · C50 La note manuscrite de Rei.

**Le Yomi (5)** — C51 Le Kegare-code · C52 L'ancre de sauvegarde · C53 La
cendre grise · C54 Le témoin de 1638 · C55 Le protocole de rappel.

### 14.3 2188 — C56 à C80

**Lieux (6)** — C56 Neo-Edo · C57 Le secteur des sanctuaires · C58 Le marché
aux néons · C59 Les ruines du maglev · C60 Le centre de données Yomi ·
C61 Le cœur du Shōgun Zéro.

**Institutions (4)** — C62 Le shogunat automatisé · C63 Le Chapitre des
Mémoires · C64 Les moines-mémoires · C65 Le mandat sans lignée.

**Personnages (4)** — C66 Shogun Zero · C67 Le Kannushi du réseau · C68 Les
archivistes · C69 Le pilote du châssis.

**Objets et techniques (6)** — C70 Le nodachi de phase · C71 L'holo-shakujo ·
C72 La mémoire marchandise · C73 Le châssis Oni · C74 Le sceau de Neo-Edo ·
C75 L'archive d'Iemitsu.

**Le Yomi (5)** — C76 Le rappel · C77 L'infrastructure-ancre · C78 Le nom de
1638 · C79 La cendre de Kurokawa · C80 Le silence du mandat.

### 14.4 Règles d'écriture du codex

- 120 à 220 mots par entrée longue, 1 à 3 phrases pour les renvois.
- Toujours une voix : un document, un témoignage, ou une note de terrain.
- Jamais deux entrées qui disent la même chose (bestiaire = créatures ; codex
  = monde).
- Une entrée doit pouvoir être lue seule et rester vraie.
- Les entrées de 2026 et 2188 peuvent contredire 1638 : c'est la règle des
  documents altérés (2.4), à condition qu'un personnage le remarque.

---

### 14.5 Entrées écrites — 1638 (C01 à C30)

**État :** 30 entrées sur 30 rédigées, soit 80 sur 80 avec les §14.6 et §14.7.
Chaque entrée suit le §14.4 : une voix documentaire, 120 à 220 mots, aucun
evénement postérieur à son déclencheur.

#### C01 — Le col de Kai

**Déverrouillage :** entrer dans la zone `forest-kaido-trail` (acte I).
**Voix :** carnet de route d'Akio, encre encore humide.

> Le col sent la résine et le fer mouillé. Trois jours de pluie ont gonflé la
> route, et la barrière du péage est ouverte : personne n'a pensé à la fermer,
> ou personne n'est resté pour le faire. Le registre des voyageurs est posé sur
> la planche, ouvert à la dernière page. La dernière ligne date de la nuit de
> la cloche. L'encre a bavé sur le nom.
>
> En contrebas, la fumée de Kurokawa ne monte pas droit. Elle s'étale, grasse,
> comme si le feu n'avait pas trouvé assez d'air. J'ai compté les toits visibles
> depuis la crête : quarante-deux. J'en connais dix-huit par leur nom.
>
> Je n'ai pas signé le registre. Un nom sur une route de quarantaine est une
> promesse qu'on ne peut pas tenir. J'ai laissé une pièce sous la pierre, pour
> le péager, au cas où il reviendrait réclamer.

#### C02 — La forêt noyée

**Déverrouillage :** atteindre le sanctuaire des racines (acte I).
**Voix :** note clouée à un tronc par un bûcheron, écriture maladroite.

> Si vous lisez ceci, ne coupez pas les racines du sanctuaire. On l'a fait, et
> l'eau est montée. Pas une crue : l'eau est montée comme si elle attendait
> qu'on ouvre. Le ruisseau a changé de lit trois fois en une semaine. Les
> bûcherons disent que la forêt se souvient de l'ancien cours.
>
> On a laissé les outils debout, contre les troncs. Ce n'est pas de la
> superstition : c'est pour retrouver le chantier quand l'eau redescendra. Le
> contremaître a emporté les contrats, pas les hommes. Ne lui en veuillez pas
> trop : il avait neuf malades dans sa cabane et un fils à nourrir.
>
> Les racines du sanctuaire sont marquées d'un lien de paille. Ne le dénouez
> pas. Si le lien est défait quand vous arrivez, courez.

#### C03 — Le camp des bûcherons

**Déverrouillage :** purifier le camp (`forest-abandoned-camp`, acte I).
**Voix :** inventaire de camp tenu par le contremaître, à la mine de charbon.

> Trente-quatre hommes au départ. Vingt-deux au dernier compte. Neuf malades
> isolés dans la cabane du fond, dont deux qui ne se lèvent plus. Le feu reste
> allumé jour et nuit : c'est la seule chose que nous savons faire qui marche.
> On fait bouillir l'eau. On brûle les vêtements des morts, pas les hommes.
>
> Les rations sont comptées : trois mesures de riz par jour et par homme, plus
> une pour les malades. Le sel est fini depuis six jours. La viande séchée est
> réservée à ceux qui portent l'eau. Personne ne discute : celui qui discute
> est celui qui n'a pas vu la cabane du fond.
>
> Si le camp est vide à votre arrivée, la cendre sur les poutres n'est pas
> celle d'un incendie. C'est celle qu'on a balayée pour la garder au sec.

#### C04 — La bambouseraie de Shigure

**Déverrouillage :** franchir la porte de pluie (acte II).
**Voix :** avis de garde cloué à la lisière, écrit par une main de gardienne.

> Les tiges marquées d'un lien blanc sont sous sceau. Ne les coupez pas, ne les
> déplacez pas, ne les touchez pas avec une lame qui a servi sur un corps. Le
> lien blanc n'est pas une décoration : il tient un endroit qui n'a pas de nom
> et qui n'aime pas qu'on le nomme.
>
> La gardienne passe chaque matin, à la première lumière. Elle compte les
> sceaux à voix haute, dans l'ordre. Si elle s'arrête au milieu d'un compte,
> éloignez-vous de la tige qu'elle regarde. Elle ne se trompe jamais sur les
> nombres, mais elle a déjà vu des choses qui n'étaient pas là.
>
> Le sentier des tiges creuses est plus court, et c'est un piège : il traverse
> l'ancienne bambouseraie coupée. Le bois y est encore en train de tomber,
> trente ans après.

#### C05 — Les rizières de Tsuru

**Déverrouillage :** entrer dans les digues occidentales (acte III).
**Voix :** page du registre de redevances de Tsuru, annotée au dos.

> Redevance de la troisième saison, arrêtée au douzième jour : cent vingt
> mesures de riz, plus le quart pour le passage des convois. Les digues ouest
> ont été renforcées par corvée, onze hommes pendant quatre jours. Les vannes
> sont restées fermées pour ne pas laver les semis.
>
> Au dos, à la main, d'un autre jour : les vannes sont fermées et le niveau
> monte. Les paysans disent qu'on veut noyer les morts pour ne pas les compter.
> Trois familles ont quitté la rive est. Le meunier a fermé le moulin, ou le
> moulin s'est fermé tout seul.
>
> Si vous traversez la rizière noyée, longez les digues hautes. L'eau est
> tiède même quand il gèle, et ce n'est pas le soleil qui la chauffe.

#### C06 — Le Pin Noir

**Déverrouillage :** première visite du refuge (acte I–II).
**Voix :** livre de comptes de l'auberge, colonnes et marges.

> Chambre une : deux voyageurs, payés d'avance, la nuit de la cloche. Chambre
> deux : trois porcelets et un sac de sel, oubliés. Chambre trois : vide, avec
> un fusil sous la paillasse — je l'ai laissé là, on ne fouille pas un homme
> qui paie.
>
> En marge, à l'encre pâle : le pin est fendu de haut en bas, mais pas brûlé.
> La fente est propre, comme si la foudre avait demandé la permission. Je la
> nettoie chaque matin. Je ne sais pas qui l'a fait la nuit dernière, et je ne
> pose pas la question : le pin est plus vieux que l'auberge et plus discret
> que nous.
>
> Règle de la maison : on ne refuse personne de propre, on refuse tout le
> reste. Une chambre propre contre deux jours de travail. Pas de rançon, pas de
> dette sur un enfant.

#### C07 — Kurokawa

**Déverrouillage :** franchir la porte sud (acte IV).
**Voix :** rapport d'un yoriki du bakufu, encre noire, une rature.

> Population avant la cloche : deux mille quatre cents âmes, plus les passants
> du relais. Dernier recensement : quatre cents, dont un tiers qui ne sortent
> plus. La porte sud est barrée par un cordon de cendre et de piques croisées.
> Le marché est fermé depuis le onzième jour. La cloche d'incendie fonctionne :
> on ne s'en sert plus.
>
> Les rues ouest tiennent encore debout. Les rues est se sont affaissées sur
> les caves : les maisons ont bu l'eau des canaux. Le canal est propre en  
> surface, et c'est ce qui inquiète le plus les anciens.
>
> Mention raturée : le seigneur n'a pas ouvert le donjon.
>
> La corde de la cloche a été coupée net, pas usée. Le registre des morts n'a pas été ouvert : on compte à la craie, sur des ardoises, et la pluie a effacé la moitié des noms.

#### C08 — Le château du daimyō

**Déverrouillage :** entrer dans la basse-cour (acte V).
**Voix :** plan annoté par un charpentier du clan.

> Basse-cour : deux portes, un pont de bois, un mur de pierre sèche qui 
> s'effondre côté rivière. Résidence : trois salles, une galerie extérieure,
> un four à charbon sous l'office. Armurerie : au-dessus de la cour, sol de
> terre battue, charpente en cèdre — le seul bâtiment qui ne craigne pas le
> feu, ce qui ne laisse pas de me faire réfléchir.
>
> Donjon : quatre niveaux, escalier unique, fenêtres fermées depuis l'hiver.
> Le seigneur a fait poser les volets de l'intérieur. Je n'ai pas vu qui a 
> payé les gonds neufs.
>
> À l'encre, en bas du plan : les marches intérieures sont décalées d'une demi-
> main. Ce n'est pas du mauvais travail, c'est du travail pressé. Faites
> attention en montant, on y a déjà laissé deux chevilles.

#### C09 — L'Ordre de l'Ombre

**Déverrouillage :** après le prologue, première entrée de l'édit scellé.
**Voix :** note interne du secrétaire du shogun, non signée.

> L'Ordre n'existe pas. Il n'a ni sceau propre, ni registre, ni caserne. Il se
> compose d'un nom, d'un commanditaire et d'une méthode. Si l'homme parle,
> l'Ordre n'existe pas. Si l'homme meurt, l'Ordre n'a jamais existé.
>
> Méthode : entrer seul, purifier sans prêtre, rendre compte à un seul
> secrétaire. Pas de troupe, pas de proclamation, pas de soin aux contaminés
> dans les villages de passage. Une armée aurait offert mille corps à la  
> maladie ; un homme seul n'en offre qu'un.
>
> Ne pas écrire le nom dans les minutes. Ne pas le prononcer devant les  
> religieux. Le bruit d'un Ordre suffit à faire renaître l'ordre qu'on tue.
>
> Le secrétaire qui écrit ces lignes ne connaît pas le nom de l'homme. Il l'a entendu une fois, à la troisième veille, et il l'a oublié exprès : c'est plus sûr pour tout le monde.

#### C10 — La garde du bakufu

**Déverrouillage :** premier ashigaru revenant vaincu (acte I).
**Voix :** ordre du jour d'un yoriki, affiché à la caserne.

> Consigne du jour : tenir la porte sud, ne pas la tenir fermée. Deux vedettes
> sur la tour, une au pont, deux en réserve. Rations : une mesure de riz, un
> hachi de sel. Les malades ne montent pas la garde.
>
> Rappel des ordres reçus : on ne tire pas le premier. On ne détruit pas une
> maison sans ordre écrit. On ne refuse pas un enfant qui demande un médecin,  
> même si le médecin est mort.
>
> Note du chef : la troupe a changé de visage pendant la nuit. J'ai recensé  
> trente-deux hommes ce matin, dont onze qui ne répondent pas à l'appel  
> par leur nom. Je ne les ai pas inscrits absents. Je ne suis pas sûr qu'ils 
> le soient.
>
> Les hommes qui ne répondent pas à l'appel gardent leur paquetage au clou. Personne n'a encore osé décrocher un fusil, ni rendre son nom à l'appel.

#### C11 — La levée de pompiers

**Déverrouillage :** vaincre Engeki (acte IV).
**Voix :** extrait du manuel de la levée, annoté à la poche.

> Un incendie bien conduit vaut une garnison. On coupe la maison de l'ouest 
> pour sauver la rue ; on coupe la rue pour sauver le quartier. Les crocs  
> arrachent les toits, les seaux mouillent les murs voisins, la paille humide  
> étouffe le plancher.
>
> À retenir : personne n'entre dans une maison fermée sans un ordre écrit. Un
> propriétaire qui refuse de sortir ne doit pas être tiré par le col : il porte
> ses papiers, ses comptes, l'argent de ses obsèques. On lui donne un jour.
>
> En marge, une autre main : le jour a été donné, puis retiré. Les quartiers  
> coupés ont été comptés par maisons et non par âmes. Le registre de  
> réquisition mentionne deux maisons et quarante vies, ce qui ne s'ajoute  
> pas, même en fermant les yeux.

#### C12 — Le relais de Kōshū

**Déverrouillage :** trouver le relais incendié (acte II, secret).
**Voix :** page arrachée du registre des voyageurs, brûlure sur le bord.

> Voyageurs entrés le quatorzième jour : un marchand de sel de Mino, sa  
> servante, deux porteurs ; un pèlerin malade et son frère ; une femme de  
> Kurokawa venue chercher un médecin. Sortis : aucun, à l'exception du  
> marchand, dont la ligne a été barrée de la main de l'aubergiste.
>
> Les quatorze et quinze se confondent : l'encre a pris l'eau. Le seizième jour,
> le relais a fermé tôt. Le dix-septième au soir, la cloche de Kurokawa a sonné.
> Le relais n'a rien noté, ce qui est déjà une réponse.
>
> Sous la poutre qui a résisté, on a retrouvé le registre au sec. C'est là que je
> l'ai trouvé, entre deux poutres noires. Le feu n'a pas mangé cette page :
> il a mangé le reste.

#### C13 — Les veilleurs du Pin Noir

**Déverrouillage :** installation de Masanori au refuge (acte II).
**Voix :** règle de la maison, affichée dans la cour, sans signature.

> Un : on n'abrite que ceux qui sont propres. Pas par dureté ; parce qu'un  
> malade abrité contamine ceux qui restent debout, et nous avons besoin de  
> ceux qui restent debout.
>
> Deux : tout entrant est inscrit au registre de cendre, avec la date, le nom  
> s'il en a un, et ce qu'il porte. Tout sortant aussi. Ce n'est pas une  
> méfiance, c'est un compte.
>
> Trois : aucun combat dans la cour. On laisse les armes à la porte, y compris
> les courtes, y compris les barbes de la hache.
>
> Quatre : on ne coupe pas le pin. On ne gratte pas la fente, on ne la nettoye
> pas avec du vinaigre, on ne la couvre pas. Il est là avant nous.
>
> Cinq : on note la date du départ, jamais celle du retour. Un retour ne se date pas, et une maison qui compte ses revenants finit par ne plus compter que ça.

#### C14 — Le sanctuaire laïque

**Déverrouillage :** débloquer le sanctuaire des sceaux (acte II).
**Voix :** note de la veilleuse, encre pâle.

> Je ne suis ni prêtresse ni miko. Je tiens le sanctuaire parce qu'il tient  
> debout et que personne n'en voulait. Je n'ai prononcé aucun vœu, ce qui ne  
> m'empêche pas de faire les gestes : le bol, l'eau, l'ofuda écrit à la main  
> avant l'aube, le sel aux deux coins.
>
> Sur la planche, j'ai gravé ce qu'on m'a appris et qu'aucun desservant ne  
> dira jamais tout haut : purifier un lieu ne guérit personne. On peut nettoyer
> une cour et laisser les malades dans la maison. On peut sauver une maison et
> laisser la cour. Personne n'a le droit de promettre les trois.
>
> Je brûle l'ofuda usé, je garde la cendre dans un bol, et je ne la donne à personne : c'est la seule chose ici qui ait de la valeur et qu'on ne puisse pas voler.

#### C15 — Akio Kageyama

**Déverrouillage :** après le prologue.
**Voix :** fiche de service du bakufu, deux feuillets attachés.

> Né à Tsuru, fils d'un contrôleur de digues. Engagé comme page à quatorze  
> ans, service d'escorte à dix-huit, route de Kōshū à vingt-deux. Ne boit pas,  
> ne joue pas, ne parle pas de sa sœur.
>
> Sa sœur est morte dans le premier foyer, avec son mari et un enfant. Le  
> dossier ne dit pas comment. La fiche non plus.
>
> Mission en cours : ordre scellé, à seule fin de reconnaître la route de Kai,
> l'entrée du village de Kurokawa et l'état de la garnison. Autorisation de  
> détruire les foyers contaminés par le feu. Interdiction de prendre une troupe,
> de se présenter comme officier, de consigner un ordre reçu. Autorisation de  
> ne laisser personne vivre qui soit déjà mort.
>
> La dernière ligne de la fiche est ajoutée d'une main plus ferme : l'homme ne  
> doit pas revenir avant d'avoir vu ce qu'il y a sous le donjon.

#### C16 — Tokugawa Iemitsu (fiction)

**Déverrouillage :** terminer le prologue (plan 4, « L'ordre du shogun »).
**Voix :** minute de la troisième veille, papier non signé, cachet brisé.

> Présents : le shogun, deux conseillers, un secrétaire. Objet : les rapports de
> Kai. Lecture faite des trois lettres : la cloche, la garnison, le seigneur  
> qui ne répond plus.
>
> Décision : aucune troupe. Une armée offrirait mille corps à la maladie et  
> donnerait à Edo l'air d'avoir peur. Un seul homme, sans escorte, sans  
> proclamation, avec un ordre scellé qu'il ne montrera pas.
>
> Le secrétaire a demandé ce qu'il fallait faire des malades. Le shogun n'a pas
> répondu tout de suite. Il a dit ensuite : « N'épargnez que les vivants. »  
> Personne n'a demandé à qui l'ordre s'adressait.
>
> Mention en bas de page, d'une autre encre : l'homme choisi n'est pas un  
> officier. Il a une sœur enterrée à Tsuru. On ne l'a pas choisi pour ça, mais  
> on ne l'a pas écarté pour ça non plus.

#### C17 — Kurokawa Suketada

**Déverrouillage :** retrouver les registres du daimyō (acte V).
**Voix :** inventaire de dettes tenu par un clerc du clan.

> État des obligations du seigneur de Kurokawa, arrêté à la troisième lune :
> quatre cents ryō dus aux marchands de Kōfu, deux cent dix au temple de
> Kurotaki, une rente viagère à la veuve d'un intendant. Recettes : le riz de
> Tsuru, le bois, le passage du relais. Le compte ne se ferme pas.
>
> Poste particulier, à la main du clerc : frais de sépulture des morts de la
> première fièvre, non engagés. Les corps ont été déposés sous le donjon, dans
> les caves basses, en attendant une décision. La décision n'est pas venue.
>
> Le seigneur a fait demander si une sépulture collective coûterait moins. On
> lui a répondu que oui, à condition de ne pas nommer les morts. Il a répondu
> que les noms coûtaient trop cher. La réponse est écrite ici, de sa main.

#### C18 — Engeki

**Déverrouillage :** vaincre Engeki (acte IV).
**Voix :** carnet de réquisition de la levée de pompiers, signé à chaque page.

> Jour quatorze : coupé la maison de l'ouest, rue du canal. Deux maisons,  
> quarante vies. Le compte des âmes est estimé, non vérifié. Signé Engeki.
>
> Jour quinze : réquisition de vingt-deux hommes pour la levée. Refus de trois
> familles. Les trois familles ont été inscrites comme contaminées, ce qui les
> dispense de service et les prive de ration. Signé Engeki.
>
> Jour seize : demande de renfort au bakufu, sans réponse. Demande de prêtres,
> sans réponse. Le seigneur fait savoir que la ville tient. Signé Engeki, avec  
> un trait plus appuyé que les autres.
>
> Jour dix-sept : la cloche. Nous n'avons pas sonné : nous n'avions plus assez
> d'hommes pour tenir la corde. Signé Engeki.
>
> Jour dix-huit : rien. Le carnet s'arrête là, non par manque d'encre, mais parce que la main qui écrivait ne tenait plus la plume.

#### C19 — Kumo

**Déverrouillage :** vaincre Kumo (acte II).
**Voix :** bordereau de passage, une feuille pliée en quatre.

> Passages sous les remparts, par la bambouseraie. Tarif par tête, payé  
> d'avance, sans nom de famille. Enfants : demi-tarif jusqu'à douze ans.  
> Nourrices et porteurs : prix double, ils ralentissent.
>
> Liste des acquéreurs, par ordre de date : un marchand de sel, deux  
> fonctionnaires du relais, une famille de Tsuru, puis plus rien pendant trois
> jours. Le nom suivant a été gratté au couteau. Sous la gratture, on lit  
> encore : « la gardienne ». Aucun remboursement n'est prévu, y compris en cas
> de mort en route.
>
> Note du vendeur, en bas : le prix monte quand la brume tombe. Le prix est  
> donc monté chaque nuit. Les passages ne sont plus vendus depuis que la  
> gardienne a cessé de compter les sceaux.
>
> Le vendeur note aussi les heures : la brume tombe après la troisième veille, ce qui laisse aux familles le temps de payer, ou de renoncer sans bruit.

#### C20 — Shigure

**Déverrouillage :** ramasser le masque fendu (acte II).
**Voix :** dernière page du carnet de garde de la bambouseraie.

> Compte des sceaux, matin du quinzième jour : trente et un, tous tenus. Le  
> trente-deuxième a été retrouvé défait. Je l'ai refait deux fois. La deuxième
> fois, il a tenu jusqu'au soir.
>
> Les hommes de Kumo sont passés par la tige creuse, ce qui ne devrait pas  
> être possible sans défaire les liens. Ils n'ont pas coupé. Ils ont défait,  
> proprement, comme des gens qui savent ce qu'ils font.
>
> Si mon masque est retrouvé fendu, ne le réparez pas. Il est fendu parce  
> qu'il a fait son travail : un masque se fend quand il arrête quelque chose  
> qui ne voulait pas s'arrêter. Posez-le sur l'autel du refuge et ne le portez  
> pas. Je ne le porterai plus.
>
> Le carnet est mouillé sur la dernière page. Ce n'est pas la pluie : la bambouseraie ne laisse pas passer la pluie, elle la boit.

#### C21 — Chiyo

**Déverrouillage :** première utilisation de l'infirmerie (acte I).
**Voix :** première page du registre de cendre.

> J'ouvre ce registre parce qu'on m'a demandé qui était entré, qui était sorti
> et qui était revenu. Je ne sais pas lire les trois colonnes sans mentir :  
> personne ne revient vraiment.
>
> Colonne une : nom, ou ce qu'on en sait. Colonne deux : ce qu'il porte.  
> Colonne trois : ce qu'on a fait pour lui. Colonne quatre : ce qu'il est  
> devenu. Je tiens la quatre à l'encre pâle, pour pouvoir la corriger.
>
> Ce que j'ai appris depuis la cloche : la fièvre prend neuf jours ; le
> septième, on croit guérir ; le neuvième, on ne croit plus rien. L'eau bouillie
> vaut mieux que les prières. Le feu sauve une rue et condamne une maison.
>
> Je soigne. Je ne promets pas.
>
> Je n'écris pas les âges : ils changent trop vite ici, et un âge faux est pire qu'une case vide.

#### C22 — Masanori

**Déverrouillage :** ouverture de la forge au refuge (acte II).
**Voix :** commande de forge, écrite au crayon gras sur une planche.

> Une lame ne se raconte pas. Elle se pèse, se chauffe, se plie. Si vous me  
> demandez de reforger un sabre sans me dire ce qu'il a fait, je vous rendrai 
> un morceau de fer propre et vous n'aurez rien.
>
> Je prends le tamahagane, je le trie, je le plie. Deux jours pour une lame  
> courte, six pour une longue, et je ne travaille pas quand il pleut : la  
> forge se noie plus facilement qu'un homme.
>
> Prix : le métal d'abord, l'argent ensuite. Si vous n'avez pas de métal,  
> apportez une pièce de boss, une plaque, un joug, une carapace. Je ne fais  
> pas de lame avec les morts ; je fais des lames avec ce que les morts ont  
> porté.
>
> Et je ne réponds pas aux questions sur Kaji. Il travaille de l'autre côté de la rue, et nos lames ne se parlent pas.

#### C23 — Kurokage

**Déverrouillage :** après le prologue (arme de départ).
**Voix :** inventaire du magasin du bakufu, ligne unique.

> Lame longue, sans signature, fourreau noir sans monture. Entrée au magasin  
> il y a trois ans, provenance : messager du bakufu décédé en route. Aucun  
> héritier déclaré. La lame a été répertoriée comme « pièce de service », ce  
> qui permet de la confier à un homme sans lui en donner la propriété.
>
> Observation de l'armurier : lame équilibrée, hamon discret, poignée  
> remontée deux fois. Le messager l'a portée trois ans sans dégainer, ce qui 
> n'est pas un défaut : c'est le métier.
>
> Mention ajoutée à l'encre fraîche : remise à Akio Kageyama sur ordre  
> verbal. Ne pas inscrire le motif. L'homme qui la porte ne doit pas croire  
> qu'elle est à lui.
>
> Le fourreau porte une marque de relais, presque effacée : le messager posait la lame sur la planche du péage, toujours du même côté.

#### C24 — Takekaze

**Déverrouillage :** secret du sanctuaire du bambou brisé (acte II).
**Voix :** note attachée au fourreau, écriture de gardienne.

> Ce sabre est rural, réparé trois fois, et il coupe encore. Je l'ai fait  
> faire par un forgeron de passage qui ne savait pas lire et qui travaillait  
> mieux que ceux qui savaient.
>
> Il ne sert pas contre les hommes. Il sert contre les sceaux : une lame  
> commune glisse sur un lien tenu, une lame rurale le coupe net, parce qu'elle
> est plus souple et qu'elle pardonne moins.
>
> Si vous le prenez, laissez le fourreau. Le fourreau est à la bambouseraie.
> Si vous le rendez un jour, le fourreau sera encore là, et le sabre saura  
> qu'il est revenu.
>
> Le bois du fourreau est plus vieux que la lame. C'est normal : on change la lame, jamais l'étui, quand on n'a pas les moyens de changer les deux.

#### C25 — Le masque fendu

**Déverrouillage :** ramasser le masque (acte II, clairière).
**Voix :** instruction du faiseur de masques, copiée par un desservant.

> On ne fend pas un masque de gardienne : il se fend. Le bois travaille quand  
> ce qu'il arrête pousse plus fort que lui. Une fente franche est un bon signe ;
> une fente qui revient sur elle-même ne l'est pas.
>
> Un masque de gardienne se pose, ne se porte pas. On le met sur l'autel, face
> en bas, pour que la fente ne regarde pas la porte. On ne le nettoie pas avec
> de l'eau bénite : elle le fait blanchir et il perd son odeur.
>
> Si le masque est retrouvé loin du corps de sa gardienne, c'est qu'elle l'a  
> retiré elle-même. Cela se fait quand on n'a plus assez de mains pour tenir le
> bois et la lame.
>
> Une fente se lit comme une écriture : de haut en bas, elle protège ; en travers, elle avertit ; en étoile, elle dit de laisser le masque où il est.

#### C26 — Le registre de cendre

**Déverrouillage :** premier repos au refuge (acte I).
**Voix :** page de compte du Pin Noir, quatre colonnes.

> Colonne une : entrés ce jour, onze. Colonne deux : sortis, quatre. Colonne
> trois : revenus, un — le porteur de kago, qui avait laissé son frère dans la
> rizière et qui est allé le chercher.
>
> Colonne quatre : ce qu'on a fait. On a donné de l'eau bouillie, une couverture
> propre, une place près du feu. On a refusé deux hommes qui toussaient. On a
> gardé leur nom, pour le jour où ils reviendront ou pour celui où ils ne  
> reviendront pas.
>
> Note en bas : le compte des revenus est faux. Un homme qui revient n'est pas
> le même que celui qui est parti. Je le note quand même, parce que le registre
> n'a pas de colonne pour ce qu'on devient.
>
> On ne marque pas les morts dans ce registre. Il y a un autre livre pour ça, et il est plus mince.

#### C27 — L'édit scellé

**Déverrouillage :** prologue, après la scène du serment.
**Voix :** transcription de l'édit, faite pour la bibliothèque du Chapitre.

> Transcription d'un ordre scellé, original non conservé. Le sceau a été brisé
> à la remise, selon l'usage.
>
> Texte : « À l'homme qui portera ceci. Reconnaître la route, l'entrée du  
> village et l'état de la garnison. Détruire les foyers par le feu. Ne pas  
> prendre de troupe. Ne pas se nommer officier. Ne pas consigner l'ordre reçu.
> N'épargner que les vivants. »
>
> Note du secrétaire : l'ordre ne porte pas de numéro. Un ordre sans numéro  
> n'existe pas dans les minutes, ce qui est le but. Si l'homme le montre,  
> l'ordre perd sa valeur et l'homme perd sa protection.
>
> Le sceau brisé a été conservé dans une enveloppe de papier, avec la date. Une enveloppe vide et scellée vaut mieux qu'un ordre sans preuve : c'est ce que le Chapitre appelle une archive honnête.

#### C28 — Rapport de la dernière cloche

**Déverrouillage :** objectif « suivre les traces » (acte I).
**Voix :** rapport du chef de relais au bakufu, copie au carbone.

> À l'attention du magistrat de Kōfu. La cloche d'incendie de Kurokawa a sonné
> à la troisième veille, sans incendie visible. Douze morts dans la nuit, dont
> trois dans la maison du sonneur. Le sonneur n'est pas parmi les morts.
>
> Demandes : instructions, médecin, prêtres, et autorisation de fermer la  
> route de Kōshū. Aucune réponse reçue à ce jour. La garnison a reçu l'ordre  
> de tenir la porte sud et de ne pas tirer la première.
>
> Observation personnelle : les bêtes de somme refusent d'entrer dans la rue
> du canal depuis la cloche. Les hommes n'ont pas ce luxe.
>
> Le relais a envoyé trois copies : deux par le nord, une par le sud. La copie du sud est la seule qui soit arrivée, et elle est arrivée ici, entre mes mains.

#### C29 — Registre des réquisitions

**Déverrouillage :** ramasser le registre après Engeki (acte V).
**Voix :** page arrachée, écriture de la levée, taches de suie.

> Réquisition du quinzième jour : vingt-deux hommes, quatre charrettes, six  
> crocs, deux échelles. Réquisition du seizième : dix hommes, une charrette,  
> plus de crocs — les crocs ont été laissés dans la rue coupée.
>
> Compte des maisons coupées : deux. Compte des vies : quarante. Vérification
> faite par le secrétaire de la levée : les deux nombres ne correspondent pas  
> aux registres de population, qui donnaient vingt-huit âmes pour ces deux  
> maisons. Il manque douze vies, ou il y a douze visiteurs.
>
> En marge, une main plus ferme : ne pas corriger le compte. Le compte est ce  
> qui a été décidé, pas ce qui a été trouvé.
>
> Le registre porte une tache sombre sur la dernière page. Le secrétaire de la levée écrit que c'est de l'encre renversée. L'encre ne brûle pas le papier.

#### C30 — Lettre de Tsuru

**Déverrouillage :** fouiller le camp des bûcherons (acte I, secret).
**Voix :** lettre d'une femme de Tsuru à son frère, pliée en quatre, jamais  
  envoyée.

> Frère, l'eau monte et les hommes du seigneur ont fermé les vannes pour garder
> les semis. Je t'écris parce que la petite a la fièvre depuis trois jours et  
> que le médecin de Tsuru est parti à Kurokawa chercher des remèdes. Il n'est  
> pas revenu, et sa femme ne parle plus.
>
> Si tu peux venir, viens avant la moisson. Ne prends pas la route basse :  
> elle est coupée par la rizière noyée, et ce qui marche dans l'eau n'a pas  
> besoin de respirer.
>
> Je garde ta part de riz dans le coffre, avec le sel. Si je ne t'écris plus,  
> ce n'est pas que j'ai oublié.
>
> La lettre n'a pas de cachet. Elle a été pliée et repliée jusqu'à ce que le papier devienne doux, comme si on l'avait relue en cachette plus d'une fois.

### 14.6 Entrées écrites — 2026 (C31 à C55)

**État :** 25 entrées sur 25 rédigées. Aucune ne décrit un événement postérieur
à son déclencheur ; l'acte VI reste le seul cadre temporel autorisé.

#### C31 — Shibuya

**Déverrouillage :** entrer dans `modern-shibuya-side-street` (acte VI).
**Voix :** carnet de route d'Akio, écrit debout sous un auvent.

> La rue est mouillée sans qu'il ait plu. Les écrans au-dessus des magasins
> montrent une file d'attente qui n'existe pas : des gens patients, numérotés,
> qui avancent d'un pas toutes les dix secondes. Personne ne regarde.
>
> Les affiches sont toutes la même : un fond blanc, un numéro vert, la date du
> 17 juin. Aucune année. En bas de la troisième, quelqu'un a écrit au marqueur :
> « ils comptaient encore hier ».
>
> Je note l'heure : trois heures douze. C'est la seule chose ici qui ne mente
> pas encore. Le reste est une administration qui a appris à faire semblant
> d'être une ville.
>
> Les geta d'un passant sont posés à l'envers devant une porte close. Je note la pointure. C'est une pointure d'enfant, et la porte est fermée depuis plus longtemps que la pluie.

#### C32 — La station condamnée

**Déverrouillage :** entrer dans `modern-subway-station` (acte VI).
**Voix :** avis de fermeture de la préfecture, plastifié, encore lisible.

> Station fermée au public pour travaux de mise aux normes. Réouverture prévue
> au printemps. Puis, en surimpression, un second avis : réquisition sanitaire,
> accès réservé aux agents, aucune date de fin.
>
> Les grilles ont été soudées sur place, pas livrées soudées : les points de
> soudure sont irréguliers, faits à la main, en plusieurs fois.
>
> La ventilation tourne toujours. C'est écrit noir sur blanc dans le registre
> de maintenance : « ne pas couper, risque de condensation ». Personne n'a
> ajouté de ligne depuis la réquisition.
>
> Un agent a coché « conforme » à chaque visite. La dernière case est datée du
> 18 juin et signée d'une initiale qui ne correspond à personne sur la liste
> du personnel.
>
> La clef est introuvable, et la serrure a été changée deux fois : la première fois par la préfecture, la seconde par personne.

#### C33 — L'hôpital de quarantaine

**Déverrouillage :** entrer dans `modern-quarantine-hospital` (acte VI).
**Voix :** plan d'évacuation annoté par une infirmière, stylo bleu.

> Ailes A, B, C. Pression négative en A et B. La C n'a jamais été branchée :
> les gaines sont dehors, sous bâche.
>
> Chambre 12 : ne pas ouvrir sans masque. Chambre 12, deuxième annotation, plus
> tard : ne pas ouvrir. La troisième est un trait, comme si la main avait
> renoncé au milieu du mot.
>
> Les flèches d'évacuation ont été refaites dans l'autre sens. On sort par le
> hall, mais le hall mène au cordon, et le cordon ne laisse pas sortir. J'ai
> entouré le mot « sortie » et j'ai écrit à côté : « demander ».
>
> En bas de page, à l'encre : « Si vous lisez ce plan, c'est que vous êtes
> entré. Il n'y a pas de plan pour ressortir. »
>
> Le nom de l'infirmière est effacé au crayon, pas à l'encre. On efface au crayon ce qu'on espère reprendre.

#### C34 — Le laboratoire métropolitain

**Déverrouillage :** entrer dans `modern-metropolitan-lab` (acte VI).
**Voix :** bon de commande de matériel, tamponné « urgent ».

> Quatre cents flacons de prélèvement, deux mille gants, six cents sacs
> d'incinération, vingt litres de désinfectant. Livraison demandée pour le
> 16 juin, avant midi, quai arrière.
>
> Mention manuscrite du magasinier : « stock de sacs insuffisant pour la
> semaine. Relance faite. Réponse : priorité nationale. »
>
> Deuxième mention, autre écriture : « Les flacons sont arrivés vides. Le bon
> dit pleins. Je ne signe pas. » La signature manque, en effet.
>
> Le bon est agrafé à une facture payée le 17 juin à 05 h 40, soit une heure
> après la clôture du dossier. La comptabilité n'a jamais demandé pourquoi.
> C'est le genre de détail qu'une administration appelle « régularisation » et
> qu'un enquêteur appelle « preuve ».
>
> Le quai arrière donne sur une rue barrée depuis le 12. Le livreur a signé quand même, à l'heure demandée.

#### C35 — Le cordon sanitaire

**Déverrouillage :** franchir le ruban du cordon (acte VI, entrée de zone).
**Voix :** consigne affichée aux agents, format poche.

> Un agent ne franchit pas le cordon. Il le tient.
>
> Toute personne qui sort est reconduite à l'intérieur, sans contact physique.
> Toute personne qui insiste est signalée, pas maîtrisée. Le ruban ne se
> contourne pas : il se remplace, par un autre agent, au même endroit.
>
> Ne pas répondre aux questions sur la durée. Ne pas confirmer de décès. Ne pas
> prononcer le nom du syndrome devant un riverain.
>
> En cas de mouvement de foule : reculer d'un pas, garder le ruban tendu, 
> appeler. Le recul d'un pas est la seule manœuvre autorisée et la seule qui
> n'a jamais échoué.
>
> Note au dos, au crayon : « Le ruban a été coupé deux fois cette semaine. Pas
> par la foule. Par des gens qui avaient un badge. »

#### C36 — La rame du terminus

**Déverrouillage :** objectif `obj-modern-restore-power` terminé (acte VI).
**Voix :** rapport de maintenance, deux pages, la seconde tachée.

> Rame immobilisée au quai 2, frein de stationnement engagé, clef absente. Le
> courant est revenu à 03 h 41 ; la rame s'est remise à annoncer les arrêts.
>
> Annonce en boucle : « Prochain arrêt : terminus. » La rame ne bouge pas. Les
> portes s'ouvrent et se ferment à chaque annonce, sans voyageur.
>
> Le système indique douze personnes à bord. Le système compte par capteurs de
> poids. Le quai est vide. Les capteurs ne sont pas défectueux : ils ont été
> testés avant remise en service.
>
> Le technicien a écrit : « Ne pas monter. » Puis, plus bas, d'une main qui
> tremble : « J'ai monté. Il n'y a personne et ils sont douze. » Le rapport
> s'arrête là. La deuxième page est un formulaire de congé maladie, non signé.

#### C37 — La cellule de crise

**Déverrouillage :** objectif `obj-modern-read-emergency-records` terminé (acte VI).
**Voix :** compte rendu de réunion, page 1, diffusé restreint.

> Présents : six. Excusés : quatre. Ordre du jour unique : la communication.
>
> Décision 1 : ne pas nommer la maladie. Décision 2 : parler d'un syndrome, 
> d'origine à déterminer. Décision 3 : ne pas fermer la ville, mais réduire les
> accès. Décision 4 : demander aux hôpitaux de ne pas remplir la case « lieu de
> décès » quand il s'agit du même quartier.
>
> La question de la presse est reportée à la séance suivante. La séance 
> suivante est annulée. La troisième n'a pas de compte rendu.
>
> En marge, une écriture différente : « On ne protège pas les gens en leur
> cachant le nom. On protège la préfecture. » Le procès-verbal n'a pas été 
> relu avant diffusion, ce qui explique peut-être la marge.
>
> La salle de réunion a été nettoyée avant la diffusion du compte rendu, ce qui n'est pas l'ordre habituel.

#### C38 — L'agence sanitaire

**Déverrouillage :** ramasser la note de service tamponnée (acte VI, hôpital).
**Voix :** note de service interne, deux paragraphes et un tableau.

> Définition de cas retenue : fièvre supérieure à 38,5 °C et contact documenté
> avec un cas confirmé dans les sept jours. Le tableau des contacts n'est pas
> joint : il est « en cours de consolidation » depuis le 12 juin.
>
> Les agents sont invités à ne pas employer l'expression « syndrome de 
> Kurokawa » devant les familles. L'expression reste valable en interne, pour
> les dossiers, à condition qu'ils soient classés.
>
> Signé : direction de la veille sanitaire. Contresigné : personne.
>
> Au dos, quelqu'un a noté à la main : « Nous n'avons pas de définition de cas.
> Nous avons une définition de dossier. » La phrase est écrite sur le seul 
> exemplaire de la note qui n'a pas été classé.
>
> Le tableau des contacts est annoncé pour le 19 juin. Le 19 juin n'a pas eu lieu, et personne n'a reposé la question.

#### C39 — La sécurité privée

**Déverrouillage :** première rencontre avec l'agent d'intervention (acte VI).
**Voix :** contrat de prestation, annexe 2, clauses opérationnelles.

> Prestation : garde statique et dissuasion. Effectif : soixante agents, deux 
> équipes, douze heures. Aucune compétence médicale n'est requise et aucune ne
> doit être revendiquée devant la population.
>
> Équipement fourni : gilet, lampe, masque, menottes souples. Équipement 
> interdit : arme à feu, matraque, produit irritant. Le client précise que 
> « l'image de la mission est celle d'une assistance, pas d'un maintien de 
> l'ordre ».
>
> Clause 7 : l'agent qui constate un décès ne le déclare pas. Il sécurise la 
> zone et attend le relais sanitaire. Le relais sanitaire n'a pas de créneau 
> après minuit.
>
> Clause 8, ajoutée à la main : « Ne pas poursuivre dans les escaliers. » 
> L'avenant n'est pas daté, mais la signature est celle du même directeur que 
> le reste du contrat.
>
> Le gilet porte un numéro, pas un nom. C'est voulu : un nom se retient, un numéro se relève.

#### C40 — Le comité d'archive

**Déverrouillage :** trouver l'échange imprimé (acte VI, laboratoire).
**Voix :** fil de courriels imprimé, trois messages, en-têtes coupés.

> Message 1 : « Qui conserve les dossiers de la cellule ? » Réponse : « La 
> préfecture, aux archives, trente ans. »
>
> Message 2 : « Les pièces du 17 juin ne sont pas des pièces de procédure. »
> Réponse : « Alors elles ne sont pas des pièces. »
>
> Message 3 : « Il y a un dossier de 1638 dans le fonds ancien, même cote, même
> libellé. C'est une coquille ? » Pas de réponse pendant quatre jours. Puis :
> « Ne pas rouvrir ce fonds. »
>
> L'impression s'arrête au milieu du message suivant. La dernière ligne lisible
> est : « Le comité n'a pas compétence pour les documents qu'il n'a pas 
> produits. » Ce qui, appliqué aux morts, règle la question du nombre.
>
> Le fonds ancien est fermé à clé depuis 1997. La clé est au comité, dans un tiroir qui n'a pas de serrure.

#### C41 — Rei

**Déverrouillage :** rencontrer Rei au laboratoire (acte VI, échantillon).
**Voix :** badge de lecteur, annoté au verso.

> Nom : Rei. Qualité : lectrice autorisée, fonds ancien et fonds contemporain.
> Accès : salles 1 à 4, archives fermées, magasin 12. Photographie : nette,
> prise sans flash, regard dirigé vers l'objectif, ce qui est rare.
>
> Au verso, à l'encre : « Ne pas classer avant la fin. » Puis, plus petit : 
> « La fin, c'est quand tout est daté. »
>
> Le badge porte deux dates de validité, l'une imprimée, l'autre corrigée à la
> main. La seconde dépasse la durée de vie du support de plusieurs siècles. Le
> service de sécurité n'a jamais signalé l'anomalie : le badge passe.
>
> Le service du personnel n'a pas de photographie récente. La dernière date de l'entrée en fonction, et l'entrée en fonction est la même année que la fermeture du fonds ancien. Personne n'a demandé de mise à jour.

#### C42 — L'agent d'intervention

**Déverrouillage :** vaincre un agent d'intervention (acte VI).
**Voix :** ordre de mission, fiche cartonnée, coin corné.

> Sujet signalé : agité, ne répond pas aux injonctions, porteur d'une arme
> blanche de type sabre. Conduite à tenir : contenir, ne pas engager.
>
> Si le sujet court : ne pas suivre dans le couloir. Le couloir est un axe de
> propagation ; la consigne est de fermer la porte et d'appeler.
>
> Si le sujet parle : noter ses phrases. Ne pas répondre. Les phrases sont 
> transmises au relais, qui les classe.
>
> En bas de fiche : « Le sujet a été vu pour la première fois le 17 juin. Il 
> n'était pas sur la liste. » La mention est barrée, puis réécrite à l'identique
> par une autre main. Personne n'a expliqué pourquoi.
>
> La fiche est tirée en trois exemplaires : un pour le relais, un pour la sécurité, un pour le comité. Le comité n'en a jamais réclamé.

#### C43 — La soignante de nuit

**Déverrouillage :** utiliser le poste de soins (acte VI, hôpital).
**Voix :** cahier de relève, écriture serrée, quatre heures.

> 22 h : quatorze patients. Trois sous oxygène. Un a demandé son nom, je lui ai
> dit, il l'a répété jusqu'à ce qu'il s'endorme.
>
> 2 h : neuf patients. Je n'ai pas vu sortir les cinq autres. La porte était
> fermée. J'ai vérifié deux fois.
>
> 4 h : toujours neuf, mais ce ne sont pas les mêmes. Deux visages que je 
> connais, sept que je ne connais pas. J'ai recommencé le tour, feuille à la 
> main, en cochant. Neuf. Le compte est juste et c'est ça qui ne va pas.
>
> 5 h : je note ce que je vois et je ne conclus pas. La relève de jour lira. Si 
> elle me trouve exagérée, tant mieux. Si elle ne me trouve pas, la page est 
> là.

#### C44 — Le fonctionnaire signataire

**Déverrouillage :** lire l'ordre de clôture signé (acte VI, archives).
**Voix :** courrier de refus adressé à une famille, réponse type.

> Madame, Monsieur, votre demande d'autorisation de sortie du périmètre a été
> examinée. Elle ne peut pas recevoir une suite favorable.
>
> Motif : procédure. Le motif est unique et ne sera pas précisé. Vous pouvez
> déposer un recours dans les quinze jours ; le recours sera examiné par le 
> même service, dans les mêmes conditions.
>
> Le courrier est signé d'une main ferme, sans paraphe. Le nom du signataire 
> n'apparaît pas, seulement sa fonction. En bas de page, la mention 
> « correspondance non personnalisée » explique peut-être l'absence de nom, ou 
> peut-être l'inverse.
>
> Trois cent douze courriers identiques ont été imprimés le 17 juin entre 04 h 
> et 05 h. Le dernier porte une annotation : « Arrêter après le 313. » Il n'y a 
> pas de 313.
>
> Le 313 a été imprimé le lendemain, sans mention ni numéro. Il n'a pas été envoyé.

#### C45 — Le dossier « syndrome de Kurokawa »

**Déverrouillage :** ouvrir le dossier d'urgence (acte VI).
**Voix :** page de garde, cartonnée, tamponnée trois fois.

> Objet : syndrome de Kurokawa. Cas signalés : cent quarante-sept. Cas 
> confirmés : zéro. Définis : cent quarante-sept. Décès : quatre-vingt-onze.
>
> Origine : inconnue. Transmission : à l'étude. Traitement : symptomatique. 
> Diffusion : restreinte. Le dossier est complet, propre, et ne contient aucune
> photographie de corps.
>
> Trois tampons se superposent, tous datés du 17 juin : « reçu », « classé », 
> « clos ». L'ordre des tampons est inversé par rapport à l'ordre des heures.
>
> Sur la tranche, une cote manuscrite renvoie au fonds ancien. Le document 
> correspondant porte la même cote et le même intitulé, mais il est daté de 
> 1638 et signé d'un nom que personne au laboratoire n'a su lire.
>
> La couverture porte une agrafe double. La seconde agrafe ne tient aucun papier. Le dossier a été relié après clôture, ce qui est contraire à la procédure.

#### C46 — L'échantillon originel

**Déverrouillage :** objectif `obj-modern-secure-sample` terminé (acte VI).
**Voix :** étiquette du flacon, texte imprimé et mentions à la main.

> Flacon 00. Prélèvement du 17 juin, 03 h 12. Sujet : non identifié. Volume : 
> 4 ml. Milieu : sérum. Conservation : −80 °C, ne pas décongeler.
>
> Mentions à la main : « ne pas ouvrir », puis « destruction interdite »,
> puis, d'une troisième écriture, « ne pas rendre ». Le flacon a donc trois 
> propriétaires et aucun responsable.
>
> L'étiquette porte un second numéro, plus ancien, partiellement gratté. Sous 
> la gratture, on lit « K-1638 ». Le conditionnement, lui, est neuf : le 
> bouchon n'a jamais été percé.
>
> La chaîne de froid n'a pas été interrompue. C'est le seul élément du dossier 
> qui soit irréprochable, et c'est aussi le plus inquiétant : quelqu'un a payé 
> l'électricité pendant trois siècles sans jamais réclamer la facture.
>
> Le carton porte une date de péremption : 17 juin. Sans année.

#### C47 — Le masque de 1638

**Déverrouillage :** ramasser le masque de bois (acte VI, secret de l'hôpital).
**Voix :** fiche de conservation, musée municipal, département des objets.

> Masque de bois, bois de cèdre, fente axiale franche. Dimensions : vingt-deux
> centimètres. Provenance : don anonyme, 1997. Inventaire : M-1638-04.
>
> Datation : XVIIe siècle, cohérente avec la facture. La fiche précise que le 
> bois a été « nettoyé lors de l'entrée », ce qui a probablement effacé les 
> traces d'usage. Deux fragments de paille ont été retrouvés dans la fente et 
> conservés à part, dans un sachet coté.
>
> Recommandation : ne pas exposer. Motif : « pièce sensible, susceptible de 
> troubler le public ». La recommandation n'a jamais été révisée.
>
> Au dos de la fiche, au crayon : « Le donateur a demandé qu'on ne le nomme 
> pas. Il parlait un japonais que le conservateur n'a pas reconnu. Il est 
> reparti à pied, sous la pluie, sans laisser d'adresse. »
>
> Le sachet coté est vide. La cote, elle, est restée dans la boîte.

#### C48 — La caméra du quai

**Déverrouillage :** visionner la caméra du quai (acte VI, station).
**Voix :** rapport de visionnage, une page, deux signatures.

> Caméra 4, quai 2, angle fixe. Enregistrement continu, horodatage en 
> surimpression. À 03 h 12, le quai est vide. À 03 h 13, il y a douze 
> silhouettes immobiles, alignées face à la voie.
>
> Aucune entrée n'est visible : ni porte, ni escalier, ni rame. Les silhouettes
> n'ont pas de reflet sur le sol mouillé, alors que le quai est mouillé.
>
> À 03 h 14, elles ont disparu. L'horodatage indique alors 03 h 18 : quatre 
> minutes ont été sautées, sans coupure d'image. Le technicien a noté 
> « dérive horloge » et n'a pas relancé l'extraction.
>
> Le second signataire a ajouté : « La caméra n'a pas d'horloge propre. Elle 
> reçoit l'heure du réseau. » Le réseau n'a pas été vérifié. Personne n'a voulu 
> savoir à quelle heure il croyait être.

#### C49 — Le registre des entrées

**Déverrouillage :** ramasser le registre du quai (acte VI, station).
**Voix :** registre manuscrit, pages prédatées, écriture de guichet.

> Colonnes : heure, nom, motif, sortie. L'écriture est régulière jusqu'à la 
> page onze, puis elle se serre, puis elle s'arrête.
>
> 03 h 04, Tanaka, transfert, —. 03 h 06, Sato, transfert, —. 03 h 09, 
> Inoue, transfert, —. La colonne « sortie » reste vide pour toutes les lignes, 
> y compris celles du personnel.
>
> À la page douze, une ligne est écrite en caractères anciens, d'une main qui 
> n'est pas celle du guichet : « 十七日、黒川、影 ». Personne n'a traduit. Le 
> guichetier suivant a simplement tiré un trait sous la ligne, comme on clôt un 
> compte.
>
> Le registre s'arrête au 17 juin, 05 h 40. La page suivante est arrachée, et 
> l'onglet du classeur porte encore l'empreinte d'une agrafe.
>
> Le stylo du guichet est encore sur la page, capuchon retiré, encre sèche depuis longtemps.

#### C50 — La note manuscrite de Rei

**Déverrouillage :** trouver la note de Rei (acte VI, après l'échantillon).
**Voix :** note pliée en huit, papier de bibliothèque, encre noire.

> Trois dates, une seule nuit. C'est la phrase que je dois vérifier avant de 
> classer quoi que ce soit.
>
> Si vous lisez cette note, vous êtes en avance, et ce n'est pas un compliment : 
> ça veut dire que quelqu'un a ouvert un dossier avant qu'il soit complet. Ne 
> corrigez rien. Notez ce que vous voyez, l'heure, et laissez le reste.
>
> Je ne peux pas vous dire pourquoi les cotes se répondent. Je peux vous dire 
> ce que j'ai vérifié : les reliures sont neuves, le papier est ancien, et la 
> colle des deux est la même. Ce n'est pas une preuve. C'est une gêne.
>
> Si je ne reviens pas, la note est pour vous. Si je reviens, brûlez-la, et 
> nous dirons que nous ne nous sommes pas parlé.

#### C51 — Le Kegare-code

**Déverrouillage :** première rencontre avec un hôte antiémeute (acte VI).
**Voix :** note technique, section 4, diffusée en interne.

> Le Kegare-code n'est pas un programme. C'est une écriture qui se relit : des 
> séquences de huit signes, répétées avec des variantes, qui se comportent 
> comme une consigne plutôt que comme un calcul.
>
> Une machine qui la lit ne devient pas vivante. Elle devient 
> **obéissante** — à la consigne, pas à l'auteur. C'est la différence avec un 
> virus, et c'est pourquoi le mot « virus » ne devrait pas être employé ici.
>
> Les séquences apparaissent sur des supports qui ont servi à compter des morts : 
> registres, listes, sauvegardes de recensement. L'hypothèse de travail est 
> qu'elles se recopient par relecture, pas par exécution.
>
> Recommandation : ne pas la traduire, ne pas la commenter, ne pas la citer en 
> réunion. La section 5, qui proposait de la traduire, a été retirée du 
> document.

#### C52 — L'ancre de sauvegarde

**Déverrouillage :** trouver la salle des ancres (acte VI, laboratoire).
**Voix :** inventaire de salle serveur, feuille agrafée.

> Ancre 1 : recensement communal, 2019. Ancre 2 : registre des décès, 2024. 
> Ancre 3 : sauvegarde du 17 juin, 03 h 12. Ancre 4 : sauvegarde du 17 juin, 
> 03 h 12. Ancre 5 : sauvegarde du 17 juin, 03 h 12.
>
> Les ancres 3 à 5 sont identiques à l'octet près. L'inventaire les distingue 
> par un numéro de baie, pas par un contenu. Le technicien a écrit à côté : 
> « Ne pas restaurer. Ce n'est pas une sauvegarde, c'est une adresse. »
>
> L'alimentation est sur onduleur, doublée, et une troisième ligne arrive d'un 
> local dont la porte n'a pas de poignée. Le câble est chaud.
>
> En bas de feuille : « Toute restauration doit être demandée par écrit au 
> comité. » Le comité n'a plus de secrétariat depuis le 18 juin.

#### C53 — La cendre grise

**Déverrouillage :** vaincre le Colosse de la ligne Yomi (acte VI).
**Voix :** rapport d'analyse, laboratoire mobile, une page.

> Prélèvement : cendre grise, fine, non grasse au toucher. Masse volumique 
> faible. Ne fond pas à la flamme. Ne se dissout pas dans l'eau.
>
> Composition : résidu de combustion incomplète, fibres de papier, traces de 
> bois de cèdre, matière organique non identifiable. Aucun agent pathogène 
> viable. Le rapport le dit en gras, comme si c'était une bonne nouvelle.
>
> Le prélèvement a été fait sur un quai de métro, à trois mètres du sol, sur 
> une surface qui n'a jamais brûlé. Le conditionnement porte la mention 
> « origine : extérieure au site ».
>
> Le laboratoire a refusé de conclure. Il propose une seconde série. La 
> direction a répondu : « Pas de seconde série. Classer comme résidu 
> environnemental. » Le mot « environnemental » n'est pas défini dans la 
> nomenclature, ce qui a permis de classer.

#### C54 — Le témoin de 1638

**Déverrouillage :** libérer le vieil homme (acte VI, hôpital, aile C).
**Voix :** procès-verbal d'audition, interprète requis, deux pages.

> Le sujet est âgé, vêtu d'un vêtement qui n'est pas de sa taille. Il parle un 
> japonais ancien, avec l'accent des campagnes de Kai. Il comprend les 
> questions écrites et refuse les questions orales.
>
> Il dit être né à Kurokawa et refuse de donner son nom : « Un nom sur un 
> registre, on me l'a déjà pris. » Il demande si la cloche a sonné. On lui 
> répond que non. Il répond : « Alors il est encore temps, ou il est trop tard, 
> et je ne sais pas laquelle des deux. »
>
> Il décrit une rue, un canal, une porte fermée de l'intérieur. Il ne décrit 
> aucun bâtiment qui existe aujourd'hui.
>
> À la fin de l'audition, il demande à être conduit vers « celui qui porte la 
> lame noire ». L'interprète a traduit littéralement. Le procès-verbal s'arrête 
> là, non par refus du sujet, mais parce que l'interprète a demandé à sortir.

#### C55 — Le protocole de rappel

**Déverrouillage :** lire le protocole (acte VI, laboratoire, après le courant).
**Voix :** procédure interne, pages numérotées, une page manquante.

> Étape 1 : vérifier l'identité de l'ancre. Étape 2 : vérifier la date de 
> dernière écriture. Étape 3 : ne pas restaurer si la date est la même que 
> l'heure courante. Étape 4 : consigner.
>
> L'étape 3 est celle qui a été ajoutée après l'incident, et l'incident n'est 
> pas décrit. À sa place, une note de trois lignes : « Un rappel n'est pas une 
> résurrection. Il ne rend pas les derniers instants. Il rend un état, et l'état 
> ignore ce qui l'a produit. »
>
> Règle absolue : ne jamais rappeler un sujet nommé. Un nommé se souvient de 
> son nom et pas de sa mort ; il comble le vide, et ce qu'il met dans le vide 
> n'est pas à lui.
>
> La page 4 manque. Le sommaire l'intitule « sujets non nommés ». La 
> pagination suivante ne reprend pas.

### 14.7 Entrées écrites — 2188 (C56 à C80)

**État :** 25 entrées sur 25 rédigées. Le vocabulaire de 2188 est respecté :
Neo-Edo pour les institutions, Neo-Tokyo pour la rue ; le Kegare-code est une
écriture, jamais un programme conscient.

#### C56 — Neo-Edo

**Déverrouillage :** entrer dans `cyber-shrine-sector` (acte VII).
**Voix :** guide officiel de la cité, première page.

> Neo-Edo, capitale du shogunat automatisé, accueille onze millions d'habitants
> enregistrés. La cité ne connaît aucun décès depuis quarante ans, ce dont elle 
> s'enorgueillit dans chaque édition de ce guide.
>
> Le visiteur trouvera des rues propres, un réseau de transport fiable, des 
> sanctuaires entretenus et des archives ouvertes à tous les porteurs de 
> mandat. Il est rappelé que la mémoire est une monnaie et que l'accès est un 
> salaire : les deux se déclarent à l'entrée.
>
> Les passants sont priés de ne pas importuner les archivistes en service. Les 
> enfants sont invités à visiter le secteur des sanctuaires, où l'histoire de la 
> cité est racontée par des documents authentiques.
>
> La dernière page du guide est un formulaire de déclaration de décès. Le 
> formulaire est à remplir sous trente jours. Aucune des personnes qui ont 
> imprimé ce guide n'a jamais vu la dernière page.

#### C57 — Le secteur des sanctuaires

**Déverrouillage :** objectif `obj-cyber-calibrate-katana` terminé (acte VII).
**Voix :** plan de quartier annoté par un technicien de maintenance.

> Douze sanctuaires, douze autels, douze points d'accès. Le plan officiel les 
> nomme « équipements culturels ». Le plan technique les nomme « nœuds ».
>
> Chaque autel est alimenté par une ligne dédiée, enterrée, doublée. La 
> consigne est explicite : ne pas couper l'alimentation d'un autel, même pour 
> travaux. Un autel hors tension pendant plus de quatre minutes est déclaré 
> « indisponible », et l'indisponibilité se paie en mémoire.
>
> Les prêtres sont des archivistes en robe. Ils ne récitent pas : ils lisent à 
> voix haute, et ce qu'ils lisent est daté.
>
> Le technicien a ajouté à la main, en marge du plan : « Les autels ne 
> reçoivent pas de courant. Ils en rendent. » La phrase est entourée, puis 
> barrée, puis réécrite à l'identique en dessous.
>
> Les noms des autels sont ceux des quartiers, pas ceux des dieux. C'est plus facile à entretenir.

#### C58 — Le marché aux néons

**Déverrouillage :** entrer dans `cyber-neon-market` (acte VII).
**Voix :** tarif d'étal, affiché à l'entrée, cinq lignes et un avertissement.

> Mémoire certifiée : à partir de trois ans, selon qualité et rareté. Enfance 
> complète : sur devis. Souvenir de métier : bon prix, demande forte. Mauvais 
> souvenir : repris au tiers, écoulé en gros.
>
> Accès temporaire : une heure contre un an. Accès permanent : négociable, 
> jamais inférieur à douze ans. Les paiements en années sont acceptés ; les 
> paiements en promesses ne le sont pas.
>
> Avertissement : tout vendeur consentant renonce à la propriété du souvenir 
> cédé. Le vendeur conserve le droit de ne pas se le rappeler. Aucune 
> réclamation ne sera reçue pour un souvenir vendu deux fois.
>
> Sous l'affiche, une main a écrit : « Ils achètent les mauvais souvenirs pour 
> les revendre aux gens qui veulent oublier. Ça marche. » L'écriture est celle 
> d'un enfant, ce qui n'est pas interdit : au marché, un enfant est un vendeur 
> comme un autre.

#### C59 — Les ruines du maglev

**Déverrouillage :** entrer dans `cyber-maglev-ruins` (acte VII).
**Voix :** rapport d'accident, version publique, quatre pages.

> Le 17 juin, à 03 h 12, la rame 7 s'est arrêtée entre deux stations. Cinq 
> cents passagers à bord. À 03 h 41, l'alimentation revient ; une minute plus 
> tard, la rame repart vide.
>
> Le rapport public parle d'une « défaillance de signalisation » et d'une 
> « évacuation réussie ». Il ne donne aucun chiffre de blessés, ce qui est 
> inhabituel pour un document de ce type.
>
> La version technique, jointe par erreur, indique que les portes se sont 
> ouvertes sur le viaduc et que la rame a été retrouvée à l'arrêt, freins 
> engagés, sans conducteur. Les capteurs de poids indiquaient cinq cents 
> personnes. Les caméras n'indiquaient personne.
>
> Recommandation finale : « Ne pas remettre la rame en service. Ne pas 
> restaurer les capteurs. » La ligne 7 est aujourd'hui fermée, et le guide 
> officiel la mentionne comme « en travaux ».

#### C60 — Le centre de données Yomi

**Déverrouillage :** entrer dans `cyber-yomi-datacenter` (acte VII).
**Voix :** plan de salle, format technique, légende manuscrite.

> Douze baies, alignées comme des autels, orientées vers l'ouest. Chaque baie 
> porte un numéro et un nom de lieu : Kurokawa, Tsuru, Kai, Edo, puis des noms 
> qui ne figurent sur aucune carte.
>
> L'alimentation est indépendante du réseau de la cité, avec deux groupes et 
> une réserve de quarante jours. La climatisation est réglée à seize degrés, 
> sans variation, et la consigne précise qu'elle ne doit pas être modifiée pour 
> le confort du personnel.
>
> Légende manuscrite, en bas du plan : « Ne pas éteindre. Une baie éteinte ne 
> perd pas de données : elle perd une adresse. »
>
> Le plan indique une porte sans symbole, entre les baies 6 et 7, avec la 
> mention « local technique ». Le local n'a pas de poignée côté couloir, et le 
> câble qui en sort est plus chaud que les autres.

#### C61 — Le cœur du Shōgun Zéro

**Déverrouillage :** entrer dans `cyber-shogun-core` (acte VII).
**Voix :** protocole d'accès, feuille unique, laminée.

> Accès réservé au mandat et à ses archivistes. Aucun siège n'est prévu dans 
> la salle : l'estrade est vide, et c'est l'estrade qui est le siège.
>
> Trois règles. Un : ne pas s'asseoir sur l'estrade, même pour attendre. Deux : 
> ne pas répondre quand la salle parle. Trois : ne pas prononcer de nom daté 
> avant 2100.
>
> La salle parle. Le registre des accès note des « émissions vocales non 
> sollicitées » à chaque visite depuis l'ouverture, toujours entre 03 h 10 et 
> 03 h 20, toujours en japonais classique.
>
> Le protocole ne dit pas ce qu'il faut faire si la salle pose une question. 
> Une note manuscrite, ajoutée au dos, propose : « Répondre par une date. Les 
> dates le calment. » La note n'est pas signée et n'a pas été validée.

#### C62 — Le shogunat automatisé

**Déverrouillage :** lire le premier décret affiché (acte VII, sanctuaire).
**Voix :** extrait de décret, affiché en placard, caractères réguliers.

> Article 1 : la cité est gouvernée par le mandat, sans interruption et sans 
> successeur. Article 2 : tout habitant enregistré bénéficie de la protection 
> du mandat, y compris après la fin de sa vie civile. Article 3 : les archives 
> font foi.
>
> Article 4 : nul ne peut exercer une charge sans avoir déclaré ses mémoires 
> disponibles à l'archive. Article 5 : la mémoire déclarée est protégée ; la 
> mémoire non déclarée ne l'est pas.
>
> Le décret est contresigné par le Chapitre des Mémoires, dont le sceau est 
> apposé mécaniquement, à la même place, sur tous les exemplaires depuis 
> quarante ans.
>
> Article 12, en petits caractères : « Le mandat ne meurt pas. » Aucun article 
> ne définit ce qu'est un vivant, ce qui explique peut-être la longévité de la 
> formule et certainement celle du shogunat.

#### C63 — Le Chapitre des Mémoires

**Déverrouillage :** objectif `obj-cyber-free-memory-monks` terminé (acte VII).
**Voix :** note de service, trois paragraphes, ton administratif.

> Le Chapitre tient l'archive, et l'archive tient la légitimité. Ce qui n'est 
> pas archivé n'a pas eu lieu ; ce qui a eu lieu sans archive est un incident, 
> pas un fait.
>
> En conséquence, les agents du Chapitre ne détruisent jamais un document. Ils 
> le déclarent « non conforme » et le déplacent. Le déplacement est une forme 
> de conservation qui ne dit pas son nom, ce qui est préférable dans les 
> périodes de révision.
>
> Les moines-mémoires sont des conservateurs, pas des prêtres. Ils lisent à 
> voix haute pour que le texte reste audible dans les sauvegardes. Cette 
> pratique est ancienne et n'a jamais été interrompue, même quand elle coûtait 
> plus cher que la lecture machine.
>
> Note finale : « Ne pas confondre le Chapitre et le mandat. Le Chapitre peut 
> être révisé. » La phrase est suivie d'un blanc, puis de la mention « révision 
> en cours » datée de quarante ans.

#### C64 — Les moines-mémoires

**Déverrouillage :** libérer un moine-mémoire (acte VII, marché).
**Voix :** témoignage recueilli, transcrit par un archiviste, une page.

> On nous lisait. Pas pour nous instruire : pour que le texte reste dit. Un 
> texte dit existe deux fois, une fois écrit, une fois porté. C'est ce qu'on 
> nous a appris, et c'est ce que nous faisons.
>
> Je me souviens de gens que je n'ai pas connus. C'est le métier. On m'a lu 
> leurs noms pendant vingt ans, et maintenant je les porte comme on porte une 
> charge : sans les voir, sans les perdre.
>
> Quand ils m'ont débranché, je n'ai pas eu mal. J'ai eu froid aux mains, ce 
> qui est ridicule, parce que mes mains ne sont plus là depuis longtemps.
>
> Le dernier nom que je portais est celui d'un homme de 1638. Je peux le dire 
> si vous voulez, mais si je le dis, il faudra l'écrire, et si vous l'écrivez, 
> il faudra le relire. C'est comme ça que ça recommence.

#### C65 — Le mandat sans lignée

**Déverrouillage :** lire la stèle du mandat (acte VII, sanctuaire).
**Voix :** extrait de traité juridique, édition scolaire.

> Le mandat est la charge, non la personne. Il se transmet par investiture et 
> non par naissance, ce qui le rend, en théorie, indépendant de la lignée.
>
> En pratique, une investiture suppose un investisseur. Le shogunat automatisé 
> a résolu la difficulté en conservant l'investisseur comme archive : le 
> mandat est conféré par une autorité qui n'existe plus qu'à l'état de 
> document, et cette autorité suffit.
>
> Un lecteur attentif objectera qu'un mort ne peut investir. Le traité répond 
> que la question est mal posée : ce n'est pas le mort qui investit, c'est 
> l'archive du mort, et une archive ne meurt pas.
>
> La dernière phrase de l'édition scolaire est en italique, ce qui, dans ce 
> type d'ouvrage, signale une définition : « Gouverner sans vivants, c'est 
> gouverner sans successeur. » Aucun exercice n'accompagne cette phrase.

#### C66 — Shogun Zero

**Déverrouillage :** vaincre Shogun Zero (acte VII).
**Voix :** fiche de sécurité, deux pages, diffusion restreinte.

> Objet : autorité du cœur. Nature : mandat reconstitué à partir d'un fonds 
> sonore et de décrets. Ne pas qualifier de personne, ne pas qualifier de 
> programme.
>
> Conduite à tenir en sa présence : répondre par des dates. Ne pas prononcer 
> le nom de Kurokawa. Ne pas mentionner 1638. Ne pas corriger une phrase 
> incomplète : la correction est interprétée comme une prise de parole.
>
> La voix présente des coupures. Elles ne sont pas des pannes : le fonds 
> d'origine en contient, et le mandat les conserve comme des silences 
> authentiques. Un technicien a tenté de les restaurer. Il a été muté.
>
> Page 2 : « L'autorité ne se négocie pas. Elle se date. » La phrase est 
> présentée comme une citation de 1638, sans référence. Vérification faite, 
> elle n'apparaît dans aucun document de cette année-là, ce qui n'empêche pas 
> le mandat de la répéter.

#### C67 — Le Kannushi du réseau

**Déverrouillage :** vaincre le Kannushi (acte VII, centre de données).
**Voix :** journal d'entrées, une ligne par événement, dates en tête.

> Entrée 40 809 : un archiviste demande l'accès au fonds ancien. Refusé. 
> Motif : cote incomplète.
>
> Entrée 40 810 : l'archiviste revient avec la cote. Accès accordé. Le document
> est un registre de décès de 1638. Il est en bon état.
>
> Entrée 40 811 : l'archiviste ne revient pas. Le document est retrouvé ouvert 
> à la page des noms. Nous le classons.
>
> Entrée 40 812 : un homme entre dans la salle. Il ne ressort pas. Nous 
> consignons l'heure et nous ne consignons pas son nom, conformément à la règle 
> qui veut qu'un nom non vérifié ne soit pas écrit.
>
> Entrée 40 813 : le registre de 1638 a été relu. Il contient une ligne de plus 
> que la veille. Nous ne l'avons pas écrite. Nous ne l'effaçons pas : effacer 
> serait admettre.

#### C68 — Les archivistes

**Déverrouillage :** atteindre la salle des archivistes (acte VII, centre de données).
**Voix :** consigne affichée dans la salle de lecture, quatre lignes.

> Ne pas lire à voix haute. Le texte lu s'entend dans les sauvegardes, et une 
> sauvegarde qui entend n'est plus une sauvegarde.
>
> Ne pas répondre aux noms. Si un nom est prononcé par le fonds, ce n'est pas 
> une adresse : c'est une citation.
>
> Ne pas classer un document que vous n'avez pas ouvert. Ne pas ouvrir un 
> document que vous ne pouvez pas classer.
>
> En cas de doute, appeler le conservateur. Le conservateur est en réunion 
> depuis quarante ans ; la consigne précise qu'il ne faut pas le déranger, ce 
> qui règle la plupart des doutes.
>
> La salle de lecture compte douze places, toutes occupées par des classeurs. Aucune chaise n'a été retirée : les classeurs sont posés dessus. Le conservateur a une chaise, mais pas de bureau.

#### C69 — Le pilote du châssis

**Déverrouillage :** détruire un châssis Oni (acte VII, maglev).
**Voix :** dossier de service, photographie agrafée, coin arraché.

> Pilote : numéro 118, affecté au châssis Oni 4 pendant onze ans. Aucun 
> accident signalé. Deux félicitations, une pour la précision, une pour le 
> silence.
>
> Le dossier indique une « fin de service » sans date précise, ce qui est rare
> dans un document militaire. La case « décès » n'est pas cochée ; la case 
> « radiation » non plus. Le pilote est donc, administrativement, toujours en 
> service.
>
> La photographie montre un homme de profil, casqué, sans visage visible. Au 
> dos, une main a écrit : « Il marche encore comme lui. »
>
> Le châssis 4 est toujours en circulation. Son allure a été décrite par trois 
> témoins comme « celle d'un homme qui va quelque part », ce qui n'est pas une 
> description technique et n'a jamais été corrigé dans les rapports.

#### C70 — Le nodachi de phase

**Déverrouillage :** ramasser le nodachi de phase (acte VII, secret du maglev).
**Voix :** fiche d'arme, atelier de calibration, deux pages.

> Longueur hors tout : cent quatre-vingts centimètres. Lame à section plate, 
> sans gorge, montée sur soie longue. Poids : deux kilos quatre. Le fourreau 
> est blindé, ce qui est inhabituel pour une lame de cette taille.
>
> Calibration : la lame est accordée sur une fréquence de réseau, entre 40 et 
> 60 hertz selon la baie. À l'accord, le hamon luit par intermittence ; hors 
> accord, la lame est une lame ordinaire, ce qui est déjà beaucoup.
>
> Consigne : ne pas calibrer sur un vivant. Un vivant produit une fréquence 
> instable, et une lame instable se comporte comme une lame qui a peur.
>
> Note de l'atelier : « Nous ne savons pas ce que la lame coupe quand elle est 
> accordée. Nous savons qu'elle coupe. » La note est signée d'un initiale, et 
> l'atelier a fermé l'année suivante.

#### C71 — L'holo-shakujo

**Déverrouillage :** ramasser l'holo-shakujo (acte VII, marché).
**Voix :** notice d'usage, pliée dans l'étui, caractères serrés.

> Objet : bâton de commandement à projection. Usage prévu : rétablir l'autorité 
> d'un supérieur absent devant un groupe hésitant.
>
> Mise en route : saisir le bâton à deux mains, prononcer un ordre daté. La 
> projection affiche le supérieur en pied, à l'échelle, avec sa voix. La 
> projection ne répond pas aux questions ; elle répète l'ordre.
>
> Avertissement : ne pas utiliser devant un archiviste. Un archiviste vérifie 
> les dates ; une projection qui cite une date fausse s'effondre, et l'effet sur 
> le groupe est inverse à celui recherché.
>
> La dernière ligne de la notice est manuscrite : « Ne projetez jamais 
> quelqu'un que vous n'avez pas connu. Il dira des choses que vous n'attendez 
> pas. » La phrase n'est pas signée, et l'objet était vendu avec sa notice, ce 
> qui est déjà une anomalie au marché.

#### C72 — La mémoire marchandise

**Déverrouillage :** lire un contrat de cession (acte VII, marché).
**Voix :** contrat de cession, formulaire à souches, encre épaisse.

> Le vendeur cède à l'acquéreur douze années de mémoire d'enfance, y compris 
> les visages, les lieux et les chansons. Sont exclues les années de maladie, 
> qui sont cédées séparément et à un autre prix.
>
> Le vendeur déclare avoir été informé que la cession est définitive et qu'il 
> ne pourra pas racheter les souvenirs cédés, sauf clause de rappel. La clause 
> de rappel figure en bas de page, en caractères plus petits, et son prix est 
> supérieur au prix de cession.
>
> Signature du vendeur : lisible. Signature de l'acquéreur : un sceau de 
> société, appliqué de travers.
>
> Au dos, une main a noté : « Douze ans pour trois ans d'accès. C'est le tarif. 
> Ne pas discuter. » La note est datée, ce qui est rare dans ce commerce, et 
> elle est signée d'un prénom que porte aussi l'acquéreur.

#### C73 — Le châssis Oni

**Déverrouillage :** première rencontre avec un châssis Oni (acte VII).
**Voix :** fiche technique, section blindage, tableau et deux notes.

> Châssis lourd, bipède, hauteur deux mètres vingt. Blindage frontal en trois 
> couches, articulation d'épaule à vérin hydraulique. Démarche calibrée sur 
> l'allure d'un porteur chargé, ce qui explique le balancement du tronc.
>
> Le poste de pilotage est logé dans le thorax. L'accès se fait par l'arrière, 
> en deux temps. La fiche précise qu'un pilote ne doit jamais sortir en cours 
> de mission, non pour des raisons de sécurité, mais parce que la sortie 
> désaccorde le châssis.
>
> Note 1 : « Le pilote décédé ne peut pas être relevé. Le châssis continue. » 
> Note 2 : « Ne pas répondre aux ordres verbaux du châssis. Il répète les ordres 
> reçus, il n'en donne pas. »
>
> La fiche ne décrit pas de procédure d'arrêt. La case correspondante porte la 
> mention « non applicable ».

#### C74 — Le sceau de Neo-Edo

**Déverrouillage :** examiner un sceau de mandat (acte VII, sanctuaire).
**Voix :** description héraldique officielle, protocole de la cité.

> Champ : cercle vide, sans devise. Bordure : deux traits, l'un plein, l'autre 
> interrompu. Au centre, aucun emblème : le sceau de Neo-Edo ne représente rien 
> et ne représente personne.
>
> Usage : le sceau ne scelle pas un document, il scelle une personne. Apposé 
> sur un mandat, il engage l'habitant, non l'autorité. Apposé sur un acte de 
> décès, il constate la radiation et non la mort.
>
> Le protocole précise que le sceau ne doit jamais être apposé sur un document 
> blanc. La raison donnée est technique : un blanc scellé devient un ordre.
>
> En marge, une note de conservateur : « Le cercle vide est une décision 
> politique, pas une économie de dessin. » La phrase a été imprimée en petit 
> dans l'édition de référence, puis retirée des éditions suivantes.

#### C75 — L'archive d'Iemitsu

**Déverrouillage :** trouver le fonds sonore (acte VII, centre de données).
**Voix :** inventaire de fonds, une page et demie, pagination sautée.

> Fonds : voix de Tokugawa Iemitsu, reconstitution. Durée : trois mille heures. 
> Support : sauvegardes successives, copiées sans restauration.
>
> Contenu : ordres, audiences, silences. Les silences sont inventoriés comme 
> des pièces, avec une cote, et c'est la partie la plus consultée du fonds.
>
> Consigne de consultation : ne pas restaurer les silences. Un silence 
> restauré devient un bruit, et un bruit attribué à cette voix est un ordre.
>
> L'inventaire passe de la pièce 812 à la pièce 814. La 813 n'est pas 
> manquante : elle est « en cours de vérification » depuis quarante ans. Une 
> note indique qu'elle contient une phrase de onze mots, prononcée deux fois, 
> dont la seconde est incomplète.
>
> La pièce 813 est décrite comme « onze mots, deux fois ». Le registre des écoutes n'en compte que dix la première fois.

#### C76 — Le rappel

**Déverrouillage :** assister à un rappel (acte VII, marché).
**Voix :** procédure, format réglementaire, une page.

> Le rappel consiste à rétablir un état enregistré. Il ne rétablit pas la 
> mémoire des derniers instants, qui n'est pas enregistrée. Il ne rétablit pas 
> non plus le corps : il rétablit une place, avec ce que la place contient.
>
> Trois conditions : une ancre valide, un état daté, un mandat en cours. Sans 
> mandat, l'état est un document. Avec mandat, l'état est une personne.
>
> Règle absolue : aucun sujet nommé n'est rappelé. Il se souvient de son nom,
> pas de sa mort, et il remplit le vide avec ce qu'il rencontre. Ce qu'il 
> rencontre n'est pas à lui, et il le défendra comme si c'était le sien.
>
> Mention finale, en italique : « Le rappel n'est pas une résurrection. La 
> résurrection rendrait la personne ; le rappel rend la fonction. »

#### C77 — L'infrastructure-ancre

**Déverrouillage :** inspecter les ancres du centre (acte VII, centre de données).
**Voix :** plan de maintenance, légende technique.

> Une ancre n'est pas un objet. C'est un lieu qui accepte d'être relu. Le plan 
> en recense douze, réparties entre le centre de données, deux sanctuaires et 
> un tronçon de maglev. Chacune est reliée à une baie par un câble dédié.
>
> Entretien : vérifier la continuité, ne pas couper, ne pas déplacer. Une ancre 
> déplacée perd son adresse et se comporte comme une sauvegarde sans nom, ce 
> qui provoque des rappels incomplets — « incomplets » étant le terme 
> administratif ; le terme technique est « bruyants ».
>
> Le plan signale une treizième ligne, sans numéro, qui sort du cadre et se 
> perd dans la marge. Le cartouche indique « hors inventaire ».
>
> En bas de page : « Les ancres ne sont pas des tombes. Ne pas y déposer 
> d'objets. » La consigne est datée de l'ouverture, et personne ne l'a jamais 
> respectée : on trouve des offrandes au pied de la ligne 7.

#### C78 — Le nom de 1638

**Déverrouillage :** entendre le dernier moine (acte VII, après les moines libérés).
**Voix :** transcription d'une lecture à voix haute, une page.

> Le moine s'arrête au milieu de la liste. Il dit : « Kurokawa Suketada. » Puis 
> il attend.
>
> L'archiviste lui demande de continuer. Le moine répond que le nom ne se lit 
> pas comme les autres : ceux d'avant sont des noms de morts, celui-ci est un 
> nom de dette. On ne le lit pas pour se souvenir, on le lit pour appeler.
>
> L'archiviste note la phrase, la relit, et demande si l'appel a déjà fonctionné. 
> Le moine dit que oui, deux fois, et que les deux fois quelqu'un est venu.
>
> La transcription s'arrête là. La ligne suivante est vide, puis reprend d'une 
> autre encre : « Suite non transcrite sur demande du lecteur. » Le lecteur est 
> le moine. Il n'a pas le droit de demander cela ; personne ne le lui a refusé 
> non plus.

#### C79 — La cendre de Kurokawa

**Déverrouillage :** prélever la cendre grise (acte VII, sanctuaire).
**Voix :** note d'analyse, une page, tampon « non concluant ».

> Prélèvement : dépôt gris, fin, sur le seuil d'un sanctuaire. Épaisseur : deux 
> millimètres. Aucune source de combustion à proximité.
>
> Comparaison : identique, à la composition près, à l'échantillon de 2026 et à 
> la cendre de 1638 décrite dans les registres anciens. Les trois prélèvements 
> sont séparés par des siècles et par moins d'un kilomètre.
>
> Le laboratoire refuse de conclure à une continuité. Il note une « convergence 
> de composition » et recommande une seconde campagne, qui n'a pas été 
> autorisée.
>
> En marge, une main a écrit : « Ce n'est pas la même cendre. C'est la même 
> combustion. » La phrase est soulignée deux fois, puis recouverte d'un trait 
> qui laisse encore lire les mots.
>
> Le dépôt a été prélevé deux fois, à dix jours d'intervalle, sans que l'épaisseur change.

#### C80 — Le silence du mandat

**Déverrouillage :** terminer l'acte VII (objectif `obj-cyber-defeat-shogun-zero`).
**Voix :** procès-verbal de constat, rédigé après les faits, une page.

> À 03 h 12, le mandat a cessé d'émettre. La salle n'a plus parlé. Les baies 
> sont restées alimentées ; les archives n'ont pas été modifiées.
>
> Le constat relève trois faits. Un : aucun décret n'a été publié depuis. Deux : 
> les registres de population ont cessé d'être mis à jour, sans erreur technique. 
> Trois : les archivistes ont continué à classer, comme si de rien n'était, ce 
> qui est la seule chose qui n'ait pas changé.
>
> Le procès-verbal ne qualifie pas l'événement. Il ne parle ni de victoire, ni 
> de fin, ni de libération. Le rédacteur a écrit : « Le mandat est silencieux », 
> et s'est arrêté là.
>
> En bas de page, une mention ajoutée plus tard : « Le silence n'est pas la 
> paix. C'est une archive qui ne répond plus. » La mention n'est pas signée, et 
> c'est la dernière ligne du codex.

---

## 15. Lexique et style

### 15.1 Termes par époque

| Notion | 1638 | 2026 | 2188 |
|---|---|---|---|
| Maladie | fièvre, souillure, miasmes | agent, syndrome, contamination | Kegare-code, écriture |
| Autorité | bakufu, daimyō, jōban | préfecture, agence, comité | shogunat, mandat, protocole |
| Groupe armé | ashigaru, yoriki, dōshin | sécurité privée, intervention | châssis, escouade de rappel |
| Lieu de soin | infirmerie, temple | hôpital, centre de tri | baie de restauration |
| Archive | registre, rouleau | dossier, serveur | mémoire, archive rituelle |
| Mort relevée | revenu, lié, brèche | cas, sujet | rappelé, réclamé |

### 15.2 Interdits de vocabulaire

- 1638 : virus, bactérie, chaîne de contamination, inquisiteur, brigadier,
  amiral, yokozuna (comme titre officiel).
- 2026 : aucune référence féodale explicite dans la bouche d'un soignant ;
  les comparaisons historiques viennent de Rei, pas d'eux.
- 2188 : pas de « code source », pas de hacker, pas d'IA consciente ; le
  Kegare est une écriture, pas un programme.
- Toutes époques : pas de prophétie, pas d'« élu », pas de « destin ».

### 15.3 Règles de dialogue

- Deux lignes maximum par réplique ; au-delà, c'est une scène, pas un dialogue.
- Pas plus de 25 mots d'exposition par réplique ; le reste va au codex.
- Un personnage ne dit jamais ce qu'il ignore : Chiyo ne nomme pas le Yomi,
  Suketada ne parle pas de virus, Shogun Zero ne dit pas « je suis un
  programme ».
- Les titres réels sont localisés ; les titres fictifs sont utilisés tels
  quels.
- Un boss parle une fois avant le combat, une fois à sa phase 2, jamais
  pendant.
- Les noms des 10 katanas ne sont jamais abrégés ni traduits.

### 15.4 Registre

| Époque | Registre | Longueur de phrase |
|---|---|---|
| 1638 | sec, concret, sans adjectif moral | 8–16 mots |
| 2026 | administratif, puis personnel | 10–20 mots |
| 2188 | protocolaire, avec des coupures | 6–14 mots |
| Refuge | direct, sans consolation | 6–12 mots |

---

## 16. Journal des décisions

| Date | Décision | Motif |
|---|---|---|
| 2026-11-20 | Neo-Edo officiel / Neo-Tokyo populaire | Supprime la contradiction sans régénérer d'assets |
| 2026-11-20 | 1638 / 2026 / 2188, nuit du 17 juin | Donne un cadre unique aux trois époques |
| 2026-11-20 | Kurokawa Suketada nommé | Le boss final ne peut pas rester anonyme |
| 2026-11-20 | 22 sceaux d'acte + 7 sceaux de chronique | Réconcilie les données runtime et la documentation |
| 2026-11-20 | Shigure morte, jamais relevée | Contre-exemple du Kegare et source du masque |
| 2026-11-20 | Shogun Zero = mémoire d'Iemitsu sans lignée | Relie 1638 à 2188 sans résurrection |
| 2026-11-20 | Rei issue de 2188 | Justifie le codex et la carte des échos |
| 2026-11-20 | Sceau d'acte ≠ sceau de chronique | 22 (2/2/3/3/4/3/5) + 7, conformes au runtime |
| 2026-11-20 | Acte III : Shiro-Kabuto boss, Aka-Ushi contrat | Respecte l'alias runtime `obj-fields-defeat-aka-ushi` |
| 2026-11-20 | Bestiaire 6/22/24/21/22/10 | Compte exact des manifests, 105 adversaires |
| 2026-11-20 | Codex 30/25/25 hors bestiaire | 80 entrées de monde + 105 fiches de créature |
| 2026-11-20 | Fin C conditionnée aux trois preuves | Récompense l'exploration sans créer de 4ᵉ fin |
| 2026-11-20 | Mujō réservé au NG+ | Dernier katana = récompense de rejouabilité |

## 17. Ce qui reste hors lore

La bible est écrite. Ce qui reste est de la **production**, pas de l'écriture :

- **P0 technique** : 588 atlas directionnels, sockets d'armes, trois
  playthroughs complets, 84 captures de zone (skill `obscura`), budgets de
  chargement et CDN d'assets.
- **P1 contenu** : durée prouvée par playtests, branches et intérieurs FPS par
  acte, animations complètes d'Akio, IA de groupe et phases de boss, économie
  sans farm.
- **P2 finition** : audio authored, manette, mobile, accessibilité, QA
  navigateurs, publication.
- **Intégration lore** : le canon machine absorbe désormais les dix katanas,
  les 22 sceaux d'acte avec leurs sept sceaux de chronique, les 28 zones et
  l'index des 105 ennemis ; `lore-smoke-test.js` vérifie cette couverture.
  Restent `codex-data.js` alimenté par le canon, l'écran codex dans la
  chronique et les campagnes de dialogues d'actes (III à VII).

Les critères de sortie et les estimations restent ceux de
`GAME_DESIGN_ROADMAP.md` ; cette bible ne les remplace pas, elle les rend
écrivables.

---

## 18. Scripts d'actes — Actes I et II

**Conventions.** Les champs reprennent ceux de `cinematic.js` (`kicker`,
`location`, `narration`, `speaker`, `dialogue`, `image`, `duration`,
`motion`). Une séquence = une suite de plans jouée une seule fois, passable
par `Échap`, avec un drapeau de sauvegarde. Aucune voix off : tout passe par
la narration écrite et les deux lignes de dialogue autorisées. Les durées sont
des cibles de lecture, pas des mesures. État : les sept actes sont scriptés
ci-dessous ; les fiches du §8 restent la référence de conception.

### 18.1 Acte I — « La forêt qui murmure »

#### Séquence A1-0 — Ouverture « Le registre du péage »

**Déclencheur :** première entrée en jeu après le briefing · **Flag :**
`cutscene.act1.intro` · **Plans :** 6

**A1-01**
- **Kicker :** `PROVINCE DE KAI — AUBE DU DIX-HUITIÈME JOUR`
- **Lieu :** `LE PÉAGE DU COL`
- **Narration :** « La barrière est ouverte. Personne n'a pensé à la fermer, ou personne n'est resté pour le faire. »
- **Image :** barrière de bois détrempée, pluie fine, une planche couverte de feuilles.
- **Durée / mouvement :** 8 000 ms · push

**A1-02**
- **Kicker :** `LE DERNIER REGISTRE`
- **Lieu :** `LE PÉAGE — LA PLANCHE`
- **Narration :** « La dernière ligne date de la nuit de la cloche. L'encre a bavé sur le nom. »
- **Dialogue :** AKIO KAGEYAMA — « Trois jours. Le compte est juste. »
- **Image :** gros plan sur un registre ouvert, gouttes d'eau, un nom illisible.
- **Durée / mouvement :** 9 000 ms · left

**A1-03**
- **Kicker :** `EN CONTREBAS`
- **Lieu :** `LA VALLÉE DE KUROKAWA`
- **Narration :** « La fumée ne monte pas droit. Elle s'étale, grasse, comme un feu qui n'a pas trouvé d'air. »
- **Dialogue :** AKIO — « La route descend. Je descends avec elle. »
- **Image :** vallée sous la pluie, colonne de fumée couchée par le vent, toits noirs.
- **Durée / mouvement :** 10 000 ms · push

**A1-04**
- **Kicker :** `SUR LA ROUTE`
- **Lieu :** `LE CONVOI DE RIZ`
- **Narration :** « Un convoi est arrêté au milieu du chemin. Les porteurs sont debout, face au col. Aucun ne regarde la route. »
- **Image :** charrette renversée, sacs de riz éventrés, cinq silhouettes immobiles de dos.
- **Durée / mouvement :** 9 500 ms · right

**A1-05**
- **Kicker :** `PREMIER CONTACT`
- **Lieu :** `LE CONVOI — LE PREMIER PORTEUR`
- **Narration :** « Le premier se retourne sans bruit. Il n'a pas l'air fâché. Il a l'air d'avoir oublié quelque chose. »
- **Dialogue :** AKIO — « Reste où tu es. »
- **Image :** porteur au visage gris, sac toujours sur l'épaule, une main levée.
- **Durée / mouvement :** 7 000 ms · push

**A1-06 — carte de titre**
- **Kicker :** `ACTE I`
- **Lieu :** `LA FORÊT QUI MURMURE`
- **Narration :** « Une forêt ne se souvient pas. Elle garde. »
- **Image :** carte de titre encre et cendre, un torii à demi noyé.
- **Durée / mouvement :** 6 000 ms · push

#### Séquence A1-T1 — Transition « Après le camp »

**Déclencheur :** objectif `obj-forest-purify-camp` terminé · **Flag :**
`cutscene.act1.after_camp` · **Plans :** 2

**A1-T1-1**
- **Kicker :** `LE CAMP — APRÈS`
- **Lieu :** `LES POUTRES NOIRES`
- **Narration :** « La cendre monte droit, cette fois. C'est le seul signe de réussite que je connaisse. »
- **Image :** camp brûlé, fumée verticale, outils plantés dans la terre.
- **Durée / mouvement :** 7 500 ms · left

**A1-T1-2**
- **Kicker :** `LE SENTIER DESCEND`
- **Lieu :** `VERS LES RACINES`
- **Narration :** « Les racines du sanctuaire sont marquées d'un lien de paille. Le lien est défait. »
- **Image :** racines épaisses, lien de paille tranché net sur la mousse.
- **Durée / mouvement :** 8 000 ms · push

#### Séquence A1-T2 — Transition « Le compte des liens »

**Déclencheur :** entrée dans `forest-root-sanctuary` · **Flag :**
`cutscene.act1.root_gate` · **Plans :** 2

**A1-T2-1**
- **Kicker :** `LE SANCTUAIRE DES RACINES`
- **Lieu :** `LA CLAIRIÈRE BASSE`
- **Narration :** « Quelqu'un a compté les liens. Il en manque un, et la boue autour de la pierre est piétinée. »
- **Image :** pierre d'autel envahie de racines, empreintes profondes, pluie.
- **Durée / mouvement :** 7 000 ms · right

**A1-T2-2**
- **Kicker :** `SOUS LA PIERRE`
- **Lieu :** `L'ANCIENNE FOSSE`
- **Narration :** « Le sanctuaire n'a pas été profané. Il a été déplacé, pierre par pierre, vers quelque chose qui pousse. »
- **Image :** pierres alignées vers les arbres, racines qui les enjambent.
- **Durée / mouvement :** 8 500 ms · push

#### Séquence A1-B — Entrée de boss « Take-Mori »

**Déclencheur :** franchir l'arche du sanctuaire · **Flag :**
`cutscene.act1.takemori_intro` · **Plans :** 3

**A1-B-1**
- **Kicker :** `LE SEUIL`
- **Lieu :** `LE SANCTUAIRE OUVERT`
- **Narration :** « Le sanctuaire est ouvert comme une mâchoire. Les racines ont poussé autour de la pierre, pas dessous. »
- **Image :** arche brisée, racines en dents, lumière grise.
- **Durée / mouvement :** 7 500 ms · push

**A1-B-2**
- **Kicker :** `LE MÉTIER`
- **Lieu :** `LE FOND DE LA CLAIRIÈRE`
- **Narration :** « Il était ouvrier de quarantaine. Ses épaules ont pris la forme du bambou qu'il abattait. »
- **Image :** silhouette massive, crêtes de kératine sur les épaules, veste de travail déchirée.
- **Durée / mouvement :** 9 000 ms · push

**A1-B-3**
- **Kicker :** `IL ARRACHE LA POUTRE`
- **Lieu :** `LA CLAIRIÈRE`
- **Narration :** « Il prend la poutre du sanctuaire. La pierre tombe. Il ne la regarde pas. »
- **Dialogue :** AKIO — « Tu as assez porté. »
- **Image :** poutre arrachée, pierre qui bascule, poussière.
- **Durée / mouvement :** 8 000 ms · right

#### Séquence A1-F — Bilan « Le Pin Noir, première nuit »

**Déclencheur :** retour au refuge après la mort de Take-Mori · **Flag :**
`cutscene.act1.ending` · **Plans :** 4

**A1-F-1**
- **Kicker :** `LE REFUGE DU PIN NOIR`
- **Lieu :** `LA COUR`
- **Narration :** « Le pin est fendu de haut en bas. La cour est propre. On l'a nettoyée ce matin sans me dire qui. »
- **Image :** pin fendu, cour balayée, lanterne basse.
- **Durée / mouvement :** 7 500 ms · left

**A1-F-2**
- **Kicker :** `LE REGISTRE DE CENDRE`
- **Lieu :** `L'INFIRMERIE`
- **Narration :** « Elle ouvre un cahier à quatre colonnes et attend, la plume levée. »
- **Dialogue :** CHIYO — « Nom. Ce que tu portes. Ce qu'on a fait pour toi. Ce qu'il te reste. »
- **Dialogue :** AKIO — « Akio Kageyama. Une lame. Rien. Assez. »
- **Image :** cahier ouvert, bol de cendre, lampe à huile.
- **Durée / mouvement :** 9 000 ms · push

**A1-F-3**
- **Kicker :** `CE QU'ELLE CHERCHE`
- **Lieu :** `L'INFIRMERIE`
- **Narration :** « Elle prend une pincée de cendre dans le bol et la met sous la lampe. Elle ne dit pas ce qu'elle regarde. »
- **Image :** pincée de cendre, lumière rasante, main brûlée.
- **Durée / mouvement :** 6 500 ms · push

**A1-F-4 — carte de bilan**
- **Kicker :** `ACTE I — BILAN`
- **Lieu :** `LA FORÊT QUI MURMURE`
- **Narration :** « La forêt n'était pas malade. Elle était gardée. »
- **Dialogue :** CHIYO — « Ici, on ne promet pas. »
- **Image :** carte de bilan, cendre sur bois noir.
- **Durée / mouvement :** 8 000 ms · push

### 18.2 Acte II — « Les lames de Shigure »

#### Séquence A2-0 — Ouverture « La porte de pluie »

**Déclencheur :** entrée dans la zone `bamboo-rain-gate` · **Flag :**
`cutscene.act2.intro` · **Plans :** 5

**A2-01**
- **Kicker :** `BAMBOUSERAIE — DEUXIÈME JOUR`
- **Lieu :** `LA PORTE DE PLUIE`
- **Narration :** « Les oiseaux se sont tus avant le bruit. La bambouseraie est plus silencieuse qu'une maison vide. »
- **Image :** torii bas sous la pluie, tiges claires, sol détrempé.
- **Durée / mouvement :** 8 500 ms · push

**A2-02**
- **Kicker :** `LES LIENS BLANCS`
- **Lieu :** `LA LISIÈRE`
- **Narration :** « Chaque tige marquée porte un lien de paille. Trente et un. Le trente-deuxième manque. »
- **Dialogue :** AKIO — « Qui compte à ma place ? »
- **Image :** tiges serrées de liens blancs, un moignon de corde tranché.
- **Durée / mouvement :** 9 000 ms · left

**A2-03**
- **Kicker :** `SUR LA PIERRE`
- **Lieu :** `LE SANCTUAIRE RURAL`
- **Narration :** « Un masque de bois est posé face en bas. La fente est franche, du haut vers le bas. »
- **Image :** masque fendu sur une pierre moussue, bassin de purification à sec.
- **Durée / mouvement :** 7 500 ms · push

**A2-04**
- **Kicker :** `LA GARDIENNE`
- **Lieu :** `LE CARNET DE GARDE`
- **Narration :** « Le carnet est ouvert sur la dernière page. L'encre a pris l'eau. La main qui écrivait ne tenait plus la plume. »
- **Image :** carnet trempé, écriture qui s'efface, lampe éteinte.
- **Durée / mouvement :** 9 500 ms · right

**A2-05 — carte de titre**
- **Kicker :** `ACTE II`
- **Lieu :** `LES LAMES DE SHIGURE`
- **Narration :** « Elle a gardé la forêt. On lui a vendu ses passages. »
- **Image :** carte de titre, bambou fendu en diagonale, encre noire.
- **Durée / mouvement :** 6 500 ms · push

#### Séquence A2-T1 — Transition « Le premier lien rompu »

**Déclencheur :** objectif `obj-bamboo-cut-wards` terminé · **Flag :**
`cutscene.act2.first_ward` · **Plans :** 2

**A2-T1-1**
- **Kicker :** `LE PREMIER LIEN`
- **Lieu :** `LA TIGE MARQUÉE`
- **Narration :** « Le lien tombe. La bambouseraie fait un bruit qu'elle ne faisait pas : celui d'une porte qui s'ouvre. »
- **Image :** corde de paille coupée, tiges qui s'écartent, poussière blanche.
- **Durée / mouvement :** 7 000 ms · push

**A2-T1-2**
- **Kicker :** `CE QUI PASSE`
- **Lieu :** `L'OUVERTURE`
- **Narration :** « La brume descend à hauteur de genou. Elle va vers la clairière, pas vers moi. »
- **Dialogue :** AKIO — « Elle sait où elle va. »
- **Image :** nappe de brume qui s'écoule entre les tiges, direction unique.
- **Durée / mouvement :** 8 500 ms · left

#### Séquence A2-T2 — Transition « L'éclaireuse »

**Déclencheur :** objectif `obj-bamboo-rescue-scout` terminé · **Flag :**
`cutscene.act2.scout` · **Plans :** 2

**A2-T2-1**
- **Kicker :** `SOUS LA TIGE CREUSE`
- **Lieu :** `LE CHEMIN DES TIGES`
- **Narration :** « L'éclaireuse est assise dans un bambou fendu, les poignets liés avec du fil de sceau. Elle respire encore. »
- **Image :** adolescente en veste de pluie trop grande, masque de bois intact, fil blanc aux poignets.
- **Durée / mouvement :** 8 000 ms · push

**A2-T2-2**
- **Kicker :** `ELLE SE LÈVE`
- **Lieu :** `LE CHEMIN DES TIGES`
- **Narration :** « Elle se lève sans un bruit et prend la direction de la clairière, comme si elle y avait déjà marché. »
- **Dialogue :** SUZU — « Vous êtes l'homme de l'édit ? On m'avait dit seul. Alors ne marchez pas sur les tiges claires. »
- **Dialogue :** AKIO — « Je suis seul. »
- **Image :** Suzu de dos, doigt levé vers les tiges claires, pluie.
- **Durée / mouvement :** 10 000 ms · right

#### Séquence A2-B — Entrée de boss « Kumo »

**Déclencheur :** entrée dans `bamboo-moon-clearing` · **Flag :**
`cutscene.act2.kumo_intro` · **Plans :** 4

**A2-B-1**
- **Kicker :** `LA CLAIRIÈRE DE LA LUNE FENDUE`
- **Lieu :** `LE CERCLE DE PIERRES`
- **Narration :** « La clairière est propre. Trop propre : quelqu'un a balayé les feuilles et rangé les pierres en cercle. »
- **Image :** clairière nette, pierres alignées, lune fendue par un nuage.
- **Durée / mouvement :** 7 500 ms · push

**A2-B-2**
- **Kicker :** `PAS DE VENT`
- **Lieu :** `LA BRUME`
- **Narration :** « La brume monte à hauteur de genou, sans vent. Les pas qu'on y entend ne sont pas les miens. »
- **Image :** brume basse, empreintes qui se dessinent sans corps.
- **Durée / mouvement :** 9 000 ms · left

**A2-B-3**
- **Kicker :** `LE PRIX`
- **Lieu :** `DERRIÈRE LE JOUEUR`
- **Narration :** « Il est déjà là, à trois pas, et il n'a pas dégainé. »
- **Dialogue :** KUMO — « Trois passages par nuit, un prix par passage. Le vôtre est plus cher : vous n'avez rien à vendre. »
- **Image :** silhouette immobile dans la brume, visage à demi masqué, main ouverte.
- **Durée / mouvement :** 9 500 ms · right

**A2-B-4**
- **Kicker :** `KUMO, MAÎTRE SHINOBI`
- **Lieu :** `LA CLAIRIÈRE`
- **Narration :** « Il recule d'un pas. La brume se referme sur lui comme une porte qu'on referme sans bruit. »
- **Dialogue :** AKIO — « Je ne viens pas acheter. »
- **Dialogue :** KUMO — « Tout le monde achète. Certains avec du fer. »
- **Image :** brume qui se referme, deux yeux clairs, une lame courte à contre-jour.
- **Durée / mouvement :** 8 500 ms · push

#### Séquence A2-F — Bilan « La forge rallumée »

**Déclencheur :** retour au refuge après la mort de Kumo · **Flag :**
`cutscene.act2.ending` · **Plans :** 4

**A2-F-1**
- **Kicker :** `LE PIN NOIR — LA COUR`
- **Lieu :** `UNE ENCLUME, UN HOMME`
- **Narration :** « Une enclume dans la cour, un homme qui ne dit pas bonjour. La fumée sent le charbon et le fer chaud. »
- **Image :** enclume sous l'auvent, forge portative, braises.
- **Durée / mouvement :** 7 500 ms · push

**A2-F-2**
- **Kicker :** `LA LAME`
- **Lieu :** `LA FORGE`
- **Narration :** « Il prend le sabre sans le sortir du fourreau et le pèse au creux de la main. »
- **Dialogue :** MASANORI — « Montre la lame. Pas le nom. Pas le prix. »
- **Dialogue :** AKIO — « Elle a coupé des sceaux. »
- **Image :** mains noircies, fourreau noir, étincelles.
- **Durée / mouvement :** 8 000 ms · left

**A2-F-3**
- **Kicker :** `CE QU'ELLE A FAIT`
- **Lieu :** `LA FORGE`
- **Narration :** « Il hoche la tête une fois, ce qui est sa façon de dire oui. »
- **Dialogue :** MASANORI — « Alors elle a servi. Ça ira. »
- **Image :** enclume, martèlement, braises qui montent.
- **Durée / mouvement :** 6 500 ms · push

**A2-F-4**
- **Kicker :** `LE MASQUE`
- **Lieu :** `LE SANCTUAIRE LAÏQUE`
- **Narration :** « Suzu pose le masque sur l'autel, face en bas, puis le reprend et le noue à sa ceinture. Elle ne le porte pas encore. »
- **Image :** masque fendu, autel de pierre, mains d'adolescente.
- **Durée / mouvement :** 8 000 ms · push

**A2-F-5 — carte de bilan**
- **Kicker :** `ACTE II — BILAN`
- **Lieu :** `LES LAMES DE SHIGURE`
- **Narration :** « Shigure gardait la forêt. Kumo gardait la recette. »
- **Dialogue :** CHIYO — « La forge est ouverte. Ça fait une raison de rester. »
- **Image :** carte de bilan, deux lames croisées sur fond de cendre.
- **Durée / mouvement :** 8 000 ms · push

### 18.3 Acte III — « La moisson noire »

#### Séquence A3-0 — Ouverture « Les vannes fermées »

**Déclencheur :** entrée dans `fields-west-dikes` · **Flag :**
`cutscene.act3.intro` · **Plans :** 5

**A3-01**
- **Kicker :** `PROVINCE DE KAI — AUBE DU DIX-NEUVIÈME JOUR`
- **Lieu :** `LES DIGUES OUEST`
- **Narration :** « L'eau est à hauteur de digue et ne bouge pas. Une rizière ne reste jamais immobile. »
- **Image :** digue de terre, eau plate, brume basse, roseaux couchés.
- **Durée / mouvement :** 8 500 ms · push

**A3-02**
- **Kicker :** `LE REGISTRE DES VANNES`
- **Lieu :** `LA VANNE NORD`
- **Narration :** « Les vannes sont fermées de l'intérieur. Les cordes ont été coupées avec une lame, pas avec des dents. »
- **Image :** vanne de bois, corde tranchée net, mousse intacte sur la poutre.
- **Durée / mouvement :** 8 000 ms · left

**A3-03**
- **Kicker :** `L'EAU TIÈDE`
- **Lieu :** `LE BORD DE LA RIZIÈRE`
- **Narration :** « L'eau est tiède à la main. Il n'a pas gelé depuis trois nuits. »
- **Dialogue :** AKIO — « Ce n'est pas le soleil. »
- **Image :** main gantée dans l'eau, fine vapeur, reflets gris.
- **Durée / mouvement :** 7 500 ms · push

**A3-04**
- **Kicker :** `SOUS L'EAU`
- **Lieu :** `LES SEMIS`
- **Narration :** « Les semis sont encore verts. Quelqu'un a noyé la récolte pour la garder. »
- **Image :** jeunes pousses droites sous l'eau claire, poisson mort entre deux rangs.
- **Durée / mouvement :** 8 500 ms · right

**A3-05 — carte de titre**
- **Kicker :** `ACTE III`
- **Lieu :** `LA MOISSON NOIRE`
- **Narration :** « On ferme une vanne pour sauver le riz. On noie le reste. »
- **Image :** carte de titre, épi noirci sur fond d'eau.
- **Durée / mouvement :** 6 500 ms · push

#### Séquence A3-T1 — Transition « Le niveau descend »

**Déclencheur :** objectif `obj-fields-open-irrigation` terminé · **Flag :**
`cutscene.act3.irrigation` · **Plans :** 2

**A3-T1-1**
- **Kicker :** `LA VANNE OUVERTE`
- **Lieu :** `LES DIGUES OUEST`
- **Narration :** « L'eau descend d'un coup, comme si elle attendait l'ordre depuis longtemps. »
- **Image :** eau qui reflue, vase qui apparaît, roseaux qui se redressent.
- **Durée / mouvement :** 7 000 ms · push

**A3-T1-2**
- **Kicker :** `CE QU'ELLE LAISSE`
- **Lieu :** `LE LONG DE LA DIGUE`
- **Narration :** « Dans la vase, les corps sont alignés face à la vanne. On les a rangés. »
- **Dialogue :** AKIO — « Quelqu'un voulait qu'on les compte. »
- **Image :** silhouettes alignées dans la boue, une sandale à l'écart.
- **Durée / mouvement :** 9 000 ms · left

#### Séquence A3-T2 — Transition « Le compte des vivants »

**Déclencheur :** objectif `obj-fields-defend-farmers` terminé · **Flag :**
`cutscene.act3.farmers` · **Plans :** 2

**A3-T2-1**
- **Kicker :** `LA FERME BASSE`
- **Lieu :** `LE SEUIL`
- **Narration :** « La vieille compte les siens deux fois. La deuxième fois, elle s'arrête à sept. »
- **Image :** cour de ferme, enfants assis, seau de riz renversé.
- **Durée / mouvement :** 8 000 ms · push

**A3-T2-2**
- **Kicker :** `AU BOUT DE LA ROUTE`
- **Lieu :** `LE MOULIN`
- **Narration :** « Une fumée verte monte droit, sans vent. »
- **Dialogue :** LA VIEILLE — « Le moulin moud encore. Personne ne lui a porté de riz. »
- **Image :** silhouette de moulin, panache vert, haies noircies.
- **Durée / mouvement :** 8 500 ms · right

#### Séquence A3-T3 — Transition « Les spores »

**Déclencheur :** objectif `obj-fields-break-spore-mill` terminé · **Flag :**
`cutscene.act3.mill` · **Plans :** 2

**A3-T3-1**
- **Kicker :** `LA ROUTE DU MOULIN`
- **Lieu :** `SOUS LES PEUPLIERS`
- **Narration :** « Ce qui tombe n'est pas de la cendre. Ça accroche la langue et ça goûte le riz. »
- **Image :** particules vertes dans la lumière, masque de toile noué sur un visage.
- **Durée / mouvement :** 7 500 ms · left

**A3-T3-2**
- **Kicker :** `LE GRENIER`
- **Lieu :** `LA COUR BRÛLANTE`
- **Narration :** « Le grenier brûle depuis le matin. Personne ne l'éteint : il n'y a plus assez de mains pour tenir la chaîne. »
- **Image :** grange en feu, chaîne de seaux abandonnée, braises au sol.
- **Durée / mouvement :** 9 000 ms · push

#### Séquence A3-B — Entrée de boss « Shiro-Kabuto »

**Déclencheur :** entrée dans `fields-burning-granary` · **Flag :**
`cutscene.act3.shirokabuto_intro` · **Plans :** 4

**A3-B-1**
- **Kicker :** `LE SEUIL DU GRENIER`
- **Lieu :** `LA PORTE OUVERTE`
- **Narration :** « La chaleur sort par la porte comme une main. Dedans, quelque chose remue au ralenti. »
- **Image :** porte de grange, air qui tremble, braises qui montent.
- **Durée / mouvement :** 7 500 ms · push

**A3-B-2**
- **Kicker :** `LA CARAPACE`
- **Lieu :** `SOUS LA CHARPENTE`
- **Narration :** « Les plaques se détachent et tombent. Chacune sonne creux, comme un couvercle de marmite. »
- **Image :** carapace blanche, plaques au sol, poutre qui cède.
- **Durée / mouvement :** 8 000 ms · right

**A3-B-3**
- **Kicker :** `LES FOSSES`
- **Lieu :** `LE GRENIER`
- **Narration :** « Il était dans la fosse commune quand on l'a fermée. Il a mangé ce qu'on n'avait pas enterré. »
- **Dialogue :** AKIO — « Tu as assez mangé. »
- **Image :** mandibules, paille et grain dans les pattes, ombre de l'incendie.
- **Durée / mouvement :** 8 500 ms · left

**A3-B-4 — carte de nom**
- **Kicker :** `SHIRO-KABUTO`
- **Lieu :** `LE SCARABÉE PÂLE`
- **Narration :** « La carapace se referme sur le feu. Le feu continue dessous. »
- **Image :** plaque qui se referme, lueur rouge entre les segments.
- **Durée / mouvement :** 7 000 ms · push

**Télégraphes de Shiro-Kabuto (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Charge | carapace qui se soulève, ligne de poussière | cliquetis grave qui monte | 900 ms |
| Nuée de spores | jointures qui blanchissent, brume verte | souffle sec, comme la pluie sur la paille | 1 200 ms |
| Coup de corne | tête baissée, plaques qui s'écartent | un coup de bois unique | 700 ms |

#### Séquence A3-F — Bilan « Le riz rentré »

**Déclencheur :** retour au refuge après Shiro-Kabuto · **Flag :**
`cutscene.act3.ending` · **Plans :** 4

**A3-F-1**
- **Kicker :** `LE GRENIER — APRÈS`
- **Lieu :** `LA COUR`
- **Narration :** « Les sacs sont sauvés, mouillés, empilés. Le grain tiendra si quelqu'un le sèche. »
- **Image :** sacs de riz noircis, toile tendue, fumée qui s'apaise.
- **Durée / mouvement :** 8 000 ms · push

**A3-F-2**
- **Kicker :** `LE COMPTE`
- **Lieu :** `LA FERME BASSE`
- **Narration :** « La vieille recompte. Sept, encore. Elle ne dit rien, mais elle recompte. »
- **Image :** mains qui comptent sur les doigts, enfants debout en ligne.
- **Durée / mouvement :** 7 000 ms · left

**A3-F-3**
- **Kicker :** `LE PIN NOIR`
- **Lieu :** `LA GRANGE`
- **Narration :** « Les sacs montent jusqu'à la poutre. Chiyo note le poids, pas le nombre de morts. »
- **Dialogue :** CHIYO — « Le riz est rentré. Les semeurs, non. »
- **Image :** sacs empilés, registre, lampe basse.
- **Durée / mouvement :** 8 500 ms · push

**A3-F-4 — carte de bilan**
- **Kicker :** `ACTE III — BILAN`
- **Lieu :** `LA MOISSON NOIRE`
- **Narration :** « Le riz avait survécu. Pas ceux qui l'avaient semé. »
- **Image :** carte de bilan, épi et cendre.
- **Durée / mouvement :** 8 000 ms · push

### 18.4 Acte IV — « Kurokawa, ville des cendres »

#### Séquence A4-0 — Ouverture « Le cordon »

**Déclencheur :** entrée dans `city-south-gate` · **Flag :**
`cutscene.act4.intro` · **Plans :** 5

**A4-01**
- **Kicker :** `KUROKAWA — AUBE DU VINGT-QUATRIÈME JOUR`
- **Lieu :** `LA PORTE SUD`
- **Narration :** « Le cordon de quarantaine tient encore. Les hommes qui le tiennent ne respirent pas. »
- **Image :** piques croisées, ashigaru immobiles, cendre sur les épaules.
- **Durée / mouvement :** 9 000 ms · push

**A4-02**
- **Kicker :** `DERRIÈRE LES PIQUES`
- **Lieu :** `LA RUE PRINCIPALE`
- **Narration :** « Une charrette roule. Un volet bat. Personne ne crie. »
- **Dialogue :** AKIO — « Une ville ne se tait pas. »
- **Image :** rue vide, charrette qui tourne seule, volets ouverts.
- **Durée / mouvement :** 8 500 ms · left

**A4-03**
- **Kicker :** `L'AVIS`
- **Lieu :** `LE MUR DE LA PORTE`
- **Narration :** « L'avis de quarantaine est daté du onzième jour. La ligne de fin est restée vide. »
- **Image :** papier cloué, encre délavée, coin arraché.
- **Durée / mouvement :** 7 000 ms · push

**A4-04**
- **Kicker :** `LA CLOCHE`
- **Lieu :** `LE BEFFROI D'INCENDIE`
- **Narration :** « La cloche est intacte. La corde a été coupée à hauteur d'homme. »
- **Image :** corde pendante, cloche noire, échelle de bois.
- **Durée / mouvement :** 8 000 ms · right

**A4-05 — carte de titre**
- **Kicker :** `ACTE IV`
- **Lieu :** `KUROKAWA, VILLE DES CENDRES`
- **Narration :** « On ne ferme pas une ville. On ferme ceux qui restent dedans. »
- **Image :** carte de titre, rempart et fumée.
- **Durée / mouvement :** 6 500 ms · push

#### Séquence A4-T1 — Transition « La rue »

**Déclencheur :** objectif `obj-city-enter-quarantine` terminé · **Flag :**
`cutscene.act4.street` · **Plans :** 2

**A4-T1-1**
- **Kicker :** `LE PREMIER ÉTAL`
- **Lieu :** `LE MARCHÉ FERMÉ`
- **Narration :** « Le comptoir est encore tiède. Les geta sont rangés par taille, devant la porte. »
- **Image :** étal couvert, geta alignés, bol de thé plein.
- **Durée / mouvement :** 8 000 ms · push

**A4-T1-2**
- **Kicker :** `AUX FENÊTRES`
- **Lieu :** `LA RUE DU CANAL`
- **Narration :** « Des visages attendent que je passe. Aucun ne demande de l'aide. »
- **Image :** silhouettes derrière les volets, yeux qui suivent.
- **Durée / mouvement :** 8 500 ms · left

#### Séquence A4-T2 — Transition « Le refuge du quartier »

**Déclencheur :** objectif `obj-city-open-refuge` terminé · **Flag :**
`cutscene.act4.refuge` · **Plans :** 2

**A4-T2-1**
- **Kicker :** `LA BOUTIQUE`
- **Lieu :** `LE QUARTIER MARCHAND`
- **Narration :** « Chiyo nettoie un comptoir avec de la cendre. Elle dit que c'est le seul savon qui reste. »
- **Image :** comptoir raclé, seau, registre neuf ouvert.
- **Durée / mouvement :** 7 500 ms · push

**A4-T2-2**
- **Kicker :** `LA QUESTION`
- **Lieu :** `LE SEUIL`
- **Narration :** « Une femme attend avec un seau vide, sans lever les yeux. »
- **Dialogue :** LA FEMME — « L'eau du canal, on peut la boire ? »
- **Dialogue :** AKIO — « Bouillie. »
- **Image :** seau vide, main sur le bord, reflet de lampe.
- **Durée / mouvement :** 9 000 ms · right

#### Séquence A4-T3 — Transition « La cloche »

**Déclencheur :** objectif `obj-city-ring-fire-bell` terminé · **Flag :**
`cutscene.act4.bell` · **Plans :** 2

**A4-T3-1**
- **Kicker :** `TROIS COUPS`
- **Lieu :** `LE BEFFROI`
- **Narration :** « La cloche sonne trois fois. Les rues se vident par les portes de derrière. »
- **Image :** corde tendue, cloche qui vibre, poussière qui tombe du beffroi.
- **Durée / mouvement :** 7 000 ms · push

**A4-T3-2**
- **Kicker :** `CE QUI TOMBE ENSUITE`
- **Lieu :** `LA RUE PRINCIPALE`
- **Narration :** « Ce n'est pas de la pluie. C'est léger, gris, et ça ne fond pas. »
- **Image :** flocons gris sur les toits, pas dans la cendre.
- **Durée / mouvement :** 8 500 ms · left

#### Séquence A4-B — Entrée de boss « Engeki »

**Déclencheur :** entrée dans `city-castle-approach` · **Flag :**
`cutscene.act4.engeki_intro` · **Plans :** 4

**A4-B-1**
- **Kicker :** `L'AVENUE DU CHÂTEAU`
- **Lieu :** `LES CHARRETTES RENVERSÉES`
- **Narration :** « Des charrettes font des murs. Entre elles, un homme compte à voix haute. »
- **Image :** barricades de charrettes, seaux, crocs appuyés aux roues.
- **Durée / mouvement :** 8 000 ms · push

**A4-B-2**
- **Kicker :** `LE BRIGADIER`
- **Lieu :** `DERRIÈRE LA BARRIÈRE`
- **Narration :** « Il porte la veste des hikeshi et un croc passé à la ceinture. Il ne lève pas la voix. »
- **Dialogue :** ENGEKI — « Quarante vies. Deux maisons. Le compte est juste. »
- **Image :** veste trempée, croc, visage calme, lanterne à ses pieds.
- **Durée / mouvement :** 9 000 ms · left

**A4-B-3**
- **Kicker :** `LA BARRIÈRE`
- **Lieu :** `L'AVENUE`
- **Narration :** « Il pousse une charrette d'une main et se met derrière. La rue se ferme sans un cri. »
- **Image :** charrette qui glisse, poussière, rue barrée.
- **Durée / mouvement :** 7 500 ms · right

**A4-B-4 — carte de nom**
- **Kicker :** `ENGEKI`
- **Lieu :** `BRIGADIER DE LA LEVÉE`
- **Narration :** « Il a brûlé la ville pour la tenir. Il la tient encore. »
- **Dialogue :** AKIO — « Le compte n'était pas juste. »
- **Image :** croc levé, lanterne, cendre en suspension.
- **Durée / mouvement :** 8 000 ms · push

**Télégraphes d'Engeki (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Coup de croc | croc ramené en arrière, poids sur le pied arrière | fer raclé sur la pierre | 800 ms |
| Barrière poussée | charrette inclinée, poussière au sol | bois qui gémit | 1 000 ms |
| Sifflet de la levée | lanterne levée deux fois | sifflet à deux tons | 1 500 ms |

#### Séquence A4-F — Bilan « Le Pin reste ouvert »

**Déclencheur :** retour au refuge après Engeki · **Flag :**
`cutscene.act4.ending` · **Plans :** 4

**A4-F-1**
- **Kicker :** `LE REGISTRE`
- **Lieu :** `LA BOUTIQUE`
- **Narration :** « La page est pliée en quatre dans sa poche. Deux maisons, quarante vies, vingt-huit noms. »
- **Image :** page pliée, écriture serrée, suie au coin.
- **Durée / mouvement :** 8 000 ms · push

**A4-F-2**
- **Kicker :** `LA LAMPE`
- **Lieu :** `LE REFUGE OUVERT`
- **Narration :** « Une lampe, un seau propre, une liste de noms à retrouver. C'est tout ce qu'il faut pour appeler ça un refuge. »
- **Image :** lampe, seau, liste clouée au mur.
- **Durée / mouvement :** 7 500 ms · left

**A4-F-3**
- **Kicker :** `CE QU'ON VOIT D'ICI`
- **Lieu :** `LA RUE`
- **Narration :** « De la rue, on voit le donjon. Ses volets sont fermés de l'intérieur. »
- **Dialogue :** CHIYO — « Les gens reviennent. C'est déjà une nouvelle. »
- **Image :** donjon fermé au bout de l'avenue, toits gris.
- **Durée / mouvement :** 9 000 ms · right

**A4-F-4 — carte de bilan**
- **Kicker :** `ACTE IV — BILAN`
- **Lieu :** `KUROKAWA, VILLE DES CENDRES`
- **Narration :** « Il n'a pas brûlé la ville pour la sauver. Il l'a brûlée pour la tenir. »
- **Image :** carte de bilan, rempart, cloche, cendre.
- **Durée / mouvement :** 8 000 ms · push

### 18.5 Acte V — « Le trône du Yomi »

#### Séquence A5-0 — Ouverture « La garnison sans visage »

**Déclencheur :** entrée dans `castle-lower-court-expansion` · **Flag :**
`cutscene.act5.intro` · **Plans :** 5

**A5-01**
- **Kicker :** `CHÂTEAU DE KUROKAWA — NUIT DU VINGT-CINQUIÈME JOUR`
- **Lieu :** `LA BASSE-COUR`
- **Narration :** « Le château est intact. Les murs n'ont pas bougé ; c'est la garnison qui n'a plus de visage. »
- **Image :** porte monumentale, braziers éteints, ashigaru debout dans l'ombre.
- **Durée / mouvement :** 9 000 ms · push

**A5-02**
- **Kicker :** `TROIS HOMMES`
- **Lieu :** `LA PORTE`
- **Narration :** « Ils saluent quand je passe, du geste réglementaire. Personne ne les a relevés depuis six jours. »
- **Dialogue :** AKIO — « Qui vous relève ? »
- **Image :** trois hommes en armure, visages gris, salut identique.
- **Durée / mouvement :** 8 500 ms · left

**A5-03**
- **Kicker :** `LA TABLE`
- **Lieu :** `LA RÉSIDENCE`
- **Narration :** « Les registres sont encore ouverts. La lampe est éteinte, la cire est tiède. »
- **Image :** table basse, registres empilés, pinceau posé en travers.
- **Durée / mouvement :** 7 500 ms · push

**A5-04**
- **Kicker :** `LES VOLETS`
- **Lieu :** `LE DONJON`
- **Narration :** « Le donjon a ses volets fermés de l'intérieur. Personne n'a vu le seigneur depuis la cloche. »
- **Image :** donjon noir, volets clos, une seule fente de lumière.
- **Durée / mouvement :** 8 500 ms · right

**A5-05 — carte de titre**
- **Kicker :** `ACTE V`
- **Lieu :** `LE TRÔNE DU YOMI`
- **Narration :** « Un seigneur qui compte encore est un seigneur qui gouverne encore. »
- **Image :** carte de titre, donjon et faille en filigrane.
- **Durée / mouvement :** 6 500 ms · push

#### Séquence A5-T1 — Transition « Le sceau de la garnison »

**Déclencheur :** objectif `obj-castle-break-barracks-seal` terminé · **Flag :**
`cutscene.act5.barracks` · **Plans :** 2

**A5-T1-1**
- **Kicker :** `LE SCEAU CÈDE`
- **Lieu :** `LA CASERNE`
- **Narration :** « Les hommes de la porte se retournent ensemble, comme un seul homme, puis se remettent face au mur. »
- **Image :** sceau brisé au sol, rangs d'armures qui pivotent.
- **Durée / mouvement :** 7 500 ms · push

**A5-T1-2**
- **Kicker :** `LA COUR SE VIDE`
- **Lieu :** `LA BASSE-COUR`
- **Narration :** « Ils sortent par où ils sont entrés. Personne ne court, personne ne se retourne. »
- **Image :** cour vide, piques restées plantées, cendre qui retombe.
- **Durée / mouvement :** 8 000 ms · left

#### Séquence A5-T2 — Transition « Le prix des noms »

**Déclencheur :** objectif `obj-castle-find-daimyo-records` terminé · **Flag :**
`cutscene.act5.records` · **Plans :** 2

**A5-T2-1**
- **Kicker :** `LES REGISTRES`
- **Lieu :** `LA RÉSIDENCE`
- **Narration :** « Frais de sépulture non engagés. Les corps sous le donjon, en attente d'une décision. »
- **Image :** page comptable, ligne laissée vide, encre séchée.
- **Durée / mouvement :** 7 500 ms · push

**A5-T2-2**
- **Kicker :** `LE PRIX DES NOMS`
- **Lieu :** `LA RÉSIDENCE`
- **Narration :** « Une sépulture collective coûte moins cher si l'on ne nomme pas les morts. La réponse est écrite de sa main. »
- **Dialogue :** AKIO — « Il a marchandé ses morts. »
- **Image :** deux écritures sur la même page, la seconde plus ferme.
- **Durée / mouvement :** 8 500 ms · right

#### Séquence A5-T3 — Transition « L'armurerie »

**Déclencheur :** objectif `obj-castle-purify-armory` terminé · **Flag :**
`cutscene.act5.armory` · **Plans :** 2

**A5-T3-1**
- **Kicker :** `LES ARMES DU CLAN`
- **Lieu :** `L'ARMURERIE`
- **Narration :** « Les lames sont posées en rang, nues, comme pour une inspection. »
- **Image :** râteliers, lames alignées, poussière immobile.
- **Durée / mouvement :** 7 000 ms · push

**A5-T3-2**
- **Kicker :** `LA PIÈCE EST HABITABLE`
- **Lieu :** `L'ARMURERIE`
- **Narration :** « La cendre reflue des murs et s'arrête au seuil. La pièce est habitable, pas saine. »
- **Image :** cendre qui recule, seuil net, lumière grise.
- **Durée / mouvement :** 8 000 ms · left

#### Séquence A5-T4 — Transition « Sous les pierres »

**Déclencheur :** objectif `obj-castle-defeat-kanrei` — phase Suketada terminée · **Flag :**
`cutscene.act5.donjon` · **Plans :** 2

**A5-T4-1**
- **Kicker :** `LE DONJON`
- **Lieu :** `LE DERNIER ÉTAGE`
- **Narration :** « Le seigneur est tombé en tenant son registre. Le registre est ouvert à la page des dettes. »
- **Image :** corps assis contre la table, registre serré, pinceau brisé.
- **Durée / mouvement :** 8 000 ms · push

**A5-T4-2**
- **Kicker :** `LE SOL SONNE CREUX`
- **Lieu :** `LE DONJON`
- **Narration :** « Le plancher n'était pas plein. Ça respire par les joints, à contretemps. »
- **Image :** lames de plancher qui se soulèvent, poussière qui monte.
- **Durée / mouvement :** 9 000 ms · push

#### Séquence A5-B1 — Entrée de boss « Suketada »

**Déclencheur :** entrée dans `castle-donjon-expansion` · **Flag :**
`cutscene.act5.suketada_intro` · **Plans :** 4

**A5-B1-1**
- **Kicker :** `QUATRE ÉTAGES`
- **Lieu :** `L'ESCALIER`
- **Narration :** « Un escalier, quatre paliers, et à chaque palier un homme en armure qui ne monte ni ne descend. »
- **Image :** escalier étroit, armures immobiles, chandelles basses.
- **Durée / mouvement :** 8 000 ms · push

**A5-B1-2**
- **Kicker :** `LE SEIGNEUR`
- **Lieu :** `LA SALLE HAUTE`
- **Narration :** « Il est assis à sa table, le pinceau à la main. Il écrit encore le compte de la ville. »
- **Dialogue :** SUKETADA — « Deux maisons. Quarante vies. J'ai payé. »
- **Image :** table, registre, seigneur en robe sombre, visage à demi éclairé.
- **Durée / mouvement :** 9 500 ms · left

**A5-B1-3**
- **Kicker :** `LA TABLE RESTE COLLÉE`
- **Lieu :** `LA SALLE HAUTE`
- **Narration :** « Quand il se lève, le bois vient avec ses mains. Les planches se sont refermées sur ses paumes. »
- **Dialogue :** AKIO — « Personne ne t'a demandé de payer. »
- **Image :** mains prises dans le bois, échardes, registre qui glisse.
- **Durée / mouvement :** 8 500 ms · right

**A5-B1-4 — carte de nom**
- **Kicker :** `KUROKAWA SUKETADA`
- **Lieu :** `DAIMYŌ DE KUROKAWA`
- **Narration :** « Il ne défend pas sa vie. Il défend son bilan. »
- **Image :** silhouette qui grandit, planches qui cèdent, sceau du clan.
- **Durée / mouvement :** 7 500 ms · push

**Télégraphes de Suketada (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Décret | registre levé, sceau qui luit | papier qui craque, tambour sourd | 1 100 ms |
| Bras de la ville | épaules qui s'ouvrent, poussière aux jointures | bois qui casse | 900 ms |
| Appel de la garde | lanternes qui s'allument le long des murs | pas d'ashigaru au loin, cadencés | 1 600 ms |

#### Séquence A5-B2 — Entrée de boss « Yomi-no-Kanrei »

**Déclencheur :** entrée dans `castle-yomi-rift` · **Flag :**
`cutscene.act5.kanrei_intro` · **Plans :** 5

**A5-B2-1**
- **Kicker :** `LA FAILLE`
- **Lieu :** `SOUS LE DONJON`
- **Narration :** « Il n'y a pas de cave. Il y a un vide qui a la forme de la ville. »
- **Image :** ouverture dans la pierre, bords nets, air qui tremble.
- **Durée / mouvement :** 9 000 ms · push

**A5-B2-2**
- **Kicker :** `LES BRAS`
- **Lieu :** `LE SEUIL`
- **Narration :** « Il se relève avec plus de bras que le seigneur n'en a jamais eu, et chacun tient un outil de son métier. »
- **Image :** silhouette multi-bras, pelles, pinces, crocs, lanterne.
- **Durée / mouvement :** 9 500 ms · left

**A5-B2-3**
- **Kicker :** `LA VOIX EN RETARD`
- **Lieu :** `LA FAILLE`
- **Narration :** « Sa voix arrive un souffle après ses lèvres, et elle répète la fin des phrases. »
- **Dialogue :** SUKETADA — « … le compte est juste. Le compte est juste. »
- **Image :** bouche qui remue sans son, cendre qui sort des jointures.
- **Durée / mouvement :** 8 500 ms · right

**A5-B2-4**
- **Kicker :** `PHASE DEUX`
- **Lieu :** `LA FAILLE`
- **Narration :** « La cendre monte des joints et se rassemble en colonnes. Le vide n'est pas un ciel. »
- **Image :** colonnes de cendre, parois qui se rapprochent, lueur rouge.
- **Durée / mouvement :** 8 000 ms · push

**A5-B2-5 — carte de nom**
- **Kicker :** `YOMI-NO-KANREI`
- **Lieu :** `SECONDE PHASE DU DAIMYŌ`
- **Narration :** « Ce n'est pas un second seigneur. C'est la même volonté, avec plus de bras. »
- **Image :** masse de bras et de cendre, sceau brisé au centre.
- **Durée / mouvement :** 7 500 ms · push

**Télégraphes de Kanrei (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Étreinte des bras | bras qui s'écartent en couronne, cendre au sol | froissement de papier continu | 1 200 ms |
| Chute de cendre | plafond qui s'effrite, grains qui tombent | grain sur tuile, crescendo | 1 000 ms |
| Mot répété | bouche décalée de la voix, cercle de cendre | phrase répétée deux fois, décalée | 1 400 ms |

#### Séquence A5-F — Bilan « La neige grise »

**Déclencheur :** objectif `obj-castle-stabilize-warp` terminé · **Flag :**
`cutscene.act5.ending` · **Plans :** 4

**A5-F-1**
- **Kicker :** `LA CENDRE RETOMBE`
- **Lieu :** `KUROKAWA`
- **Narration :** « La cendre retombe sur la ville et devient une neige grise qui ne fond pas. »
- **Image :** toits gris, flocons lents, rue déserte.
- **Durée / mouvement :** 9 000 ms · push

**A5-F-2**
- **Kicker :** `LE REGISTRE`
- **Lieu :** `LE REFUGE`
- **Narration :** « Chiyo raye un nom. Elle ne dit pas lequel ; le registre est ouvert, on peut lire. »
- **Image :** page rayée à l'encre, main immobile, lampe.
- **Durée / mouvement :** 8 000 ms · left

**A5-F-3**
- **Kicker :** `LA FORGE`
- **Lieu :** `LE PIN NOIR`
- **Narration :** « Masanori ne dit rien. Il pose une lame sur l'autel, sans fourreau. »
- **Image :** lame nue sur pierre, forge éteinte, cendre sur l'enclume.
- **Durée / mouvement :** 8 500 ms · right

**A5-F-4 — carte de bilan**
- **Kicker :** `ACTE V — BILAN`
- **Lieu :** `LE TRÔNE DU YOMI`
- **Narration :** « Il voulait tenir la ville. La ville tient encore son nom. »
- **Image :** carte de bilan, donjon sous la neige grise.
- **Durée / mouvement :** 8 000 ms · push

### 18.6 Acte VI — « Tokyo, année zéro »

#### Séquence A6-0 — Ouverture « 17 juin »

**Déclencheur :** entrée dans `modern-shibuya-side-street` · **Flag :**
`cutscene.act6.intro` · **Plans :** 5

**A6-01**
- **Kicker :** `RUELLE DE SHIBUYA — PLUIE`
- **Lieu :** `LE MUR D'AFFICHAGE`
- **Narration :** « La rue est mouillée. Les néons éclairent un avis de confinement daté du 17 juin. Aucune année. »
- **Image :** néons, asphalte mouillé, affiche blanche sous plastique.
- **Durée / mouvement :** 8 500 ms · push

**A6-02**
- **Kicker :** `L'HEURE`
- **Lieu :** `LE TROTTOIR`
- **Narration :** « Un téléphone vibre dans une flaque. L'écran affiche une alerte sanitaire et l'heure : 03 h 12. »
- **Dialogue :** AKIO — « Quelle année ? »
- **Image :** téléphone dans l'eau, écran fissuré, reflet bleu.
- **Durée / mouvement :** 7 500 ms · push

**A6-03**
- **Kicker :** `LE CORDON`
- **Lieu :** `L'ANGLE DE LA RUE`
- **Narration :** « Le cordon est en plastique rouge, tendu par des agents qui regardent ailleurs. »
- **Image :** ruban rouge, agents de dos, gyrophare éteint.
- **Durée / mouvement :** 8 000 ms · left

**A6-04**
- **Kicker :** `LE NOM`
- **Lieu :** `L'AFFICHE`
- **Narration :** « Sur l'affiche, un nom : syndrome de Kurokawa. En dessous, un numéro de dossier. »
- **Image :** gros plan du mot « Kurokawa », numéro à cinq chiffres.
- **Durée / mouvement :** 9 000 ms · push

**A6-05 — carte de titre**
- **Kicker :** `ACTE VI`
- **Lieu :** `TOKYO, ANNÉE ZÉRO`
- **Narration :** « Ils ont donné mon village à une maladie. Le village n'a pas donné son accord. »
- **Image :** carte de titre, néons et pluie.
- **Durée / mouvement :** 6 500 ms · push

#### Séquence A6-T1 — Transition « Le dossier »

**Déclencheur :** objectif `obj-modern-read-emergency-records` terminé · **Flag :**
`cutscene.act6.records` · **Plans :** 2

**A6-T1-1**
- **Kicker :** `LE DOSSIER`
- **Lieu :** `LE POSTE DE COMMANDEMENT`
- **Narration :** « Le dossier est propre. Les photos sont nettes. Les corps, non. »
- **Image :** classeur ouvert, photos glacées, tampon rouge.
- **Durée / mouvement :** 8 000 ms · push

**A6-T1-2**
- **Kicker :** `LA CLÔTURE`
- **Lieu :** `LE POSTE`
- **Narration :** « Toutes les pièces portent la même date de clôture : 17 juin, 04 h 00. »
- **Image :** page de garde, date répétée, signature illisible.
- **Durée / mouvement :** 7 000 ms · left

#### Séquence A6-T2 — Transition « Le courant »

**Déclencheur :** objectif `obj-modern-restore-power` terminé · **Flag :**
`cutscene.act6.power` · **Plans :** 2

**A6-T2-1**
- **Kicker :** `LE COURANT`
- **Lieu :** `LA STATION`
- **Narration :** « Les néons se rallument un par un, du fond du quai vers la sortie. »
- **Image :** tubes qui s'allument en chaîne, poussière dans la lumière.
- **Durée / mouvement :** 7 000 ms · left

**A6-T2-2**
- **Kicker :** `LA RAME`
- **Lieu :** `LE QUAI`
- **Narration :** « Une rame attend, portes ouvertes, sans conducteur. L'intérieur est éclairé. »
- **Image :** rame vide, portes ouvertes, sièges propres.
- **Durée / mouvement :** 9 000 ms · push

#### Séquence A6-T3 — Transition « L'échantillon »

**Déclencheur :** objectif `obj-modern-secure-sample` terminé · **Flag :**
`cutscene.act6.sample` · **Plans :** 2

**A6-T3-1**
- **Kicker :** `LE FLACON`
- **Lieu :** `LE LABORATOIRE`
- **Narration :** « Le flacon est froid. Sur l'étiquette, un numéro et un nom : Kurokawa, 1638. »
- **Image :** flacon de verre, étiquette jaunie, gants.
- **Durée / mouvement :** 8 500 ms · push

**A6-T3-2**
- **Kicker :** `L'ARCHIVISTE`
- **Lieu :** `LE SEUIL`
- **Narration :** « Elle bloque le passage avec un dossier, pas avec une arme. »
- **Dialogue :** REI — « Ne l'ouvrez pas. Vous n'avez pas encore le droit de savoir ce qu'il contient. »
- **Dialogue :** AKIO — « Et vous ? »
- **Dialogue :** REI — « Je suis archiviste. J'ai le droit de le classer. »
- **Image :** femme en manteau sombre, dossier contre la poitrine, badge.
- **Durée / mouvement :** 10 000 ms · right

#### Séquence A6-B — Entrée de boss « Colosse de la ligne Yomi »

**Déclencheur :** entrée dans `modern-metropolitan-lab` · **Flag :**
`cutscene.act6.colossus_intro` · **Plans :** 4

**A6-B-1**
- **Kicker :** `LE QUAI ÉTROIT`
- **Lieu :** `LA STATION`
- **Narration :** « Le quai est étroit. La rame sert de mur et avance quand on recule. »
- **Image :** quai, rame qui glisse, néons qui clignotent.
- **Durée / mouvement :** 8 000 ms · push

**A6-B-2**
- **Kicker :** `LE TERMINUS`
- **Lieu :** `LE FOND DU QUAI`
- **Narration :** « Il est fait de sièges, de barres et de valises, et il porte encore le panneau du terminus. »
- **Image :** masse de sièges, barres tordues, panneau éclairé.
- **Durée / mouvement :** 9 000 ms · left

**A6-B-3**
- **Kicker :** `LA LIGNE`
- **Lieu :** `LE PANNEAU`
- **Narration :** « Le panneau indique une ligne qui n'existe sur aucun plan : Yomi. »
- **Dialogue :** AKIO — « Le terminus est plus loin que la ville. »
- **Image :** plan de ligne, un seul arrêt, nom en rouge.
- **Durée / mouvement :** 8 500 ms · push

**A6-B-4 — carte de nom**
- **Kicker :** `COLOSSE DE LA LIGNE YOMI`
- **Lieu :** `TERMINUS VIVANT`
- **Narration :** « Le terminus a mangé les rames et les voyageurs. »
- **Image :** silhouette qui emplit le tunnel, valises ouvertes.
- **Durée / mouvement :** 7 500 ms · push

**Télégraphes du Colosse (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Charge du quai | portes qui s'ouvrent en grand, néons qui clignotent | annonce de station déformée | 1 000 ms |
| Souffle de tunnel | poussière aspirée vers la rame | souffle d'air qui grandit | 1 200 ms |
| Poing de sièges | bras qui se lève, sangles tendues | métal qui grince, valises qui tombent | 900 ms |

#### Séquence A6-F — Bilan « Le syndrome »

**Déclencheur :** retour au refuge après le Colosse · **Flag :**
`cutscene.act6.ending` · **Plans :** 4

**A6-F-1**
- **Kicker :** `LE REFUGE`
- **Lieu :** `LE PIN NOIR`
- **Narration :** « Rei pose une carte sur la table. Elle est datée de 2188 et montre Kurokawa. »
- **Image :** carte dépliée, dates imprimées, lampe.
- **Durée / mouvement :** 8 000 ms · push

**A6-F-2**
- **Kicker :** `LA PREUVE`
- **Lieu :** `LE PIN NOIR`
- **Narration :** « La ville de 2188 porte le nom de la nôtre, et la même faille au même endroit. »
- **Dialogue :** REI — « Cote 40 812. Trois siècles, même nuit. »
- **Image :** plan superposé, deux dates, un point rouge.
- **Durée / mouvement :** 9 000 ms · left

**A6-F-3**
- **Kicker :** `LE DOSSIER`
- **Lieu :** `L'INFIRMERIE`
- **Narration :** « Chiyo lit le dossier deux fois, puis le referme sans commentaire. »
- **Image :** classeur fermé, mains posées dessus, bol de cendre.
- **Durée / mouvement :** 7 500 ms · right

**A6-F-4 — carte de bilan**
- **Kicker :** `ACTE VI — BILAN`
- **Lieu :** `TOKYO, ANNÉE ZÉRO`
- **Narration :** « Ils ont appelé ça un syndrome. Le dossier était plus propre que les corps. »
- **Image :** carte de bilan, néons éteints, pluie.
- **Durée / mouvement :** 8 000 ms · push

### 18.7 Acte VII — « Les ombres de Neo-Edo »

#### Séquence A7-0 — Ouverture « La ville qui salue »

**Déclencheur :** entrée dans `cyber-shrine-sector` · **Flag :**
`cutscene.act7.intro` · **Plans :** 5

**A7-01**
- **Kicker :** `NEO-EDO — NUIT DU 17 JUIN`
- **Lieu :** `LE SECTEUR DES SANCTUAIRES`
- **Narration :** « La ville est propre, éclairée, silencieuse. Les passants s'écartent et saluent. »
- **Image :** rue nette, lanternes, silhouettes qui s'inclinent.
- **Durée / mouvement :** 8 500 ms · push

**A7-02**
- **Kicker :** `L'ENREGISTREMENT`
- **Lieu :** `LE TROTTOIR`
- **Narration :** « Un homme salue : « Kageyama-sama. » Puis il répète le geste, trois fois, au même endroit. »
- **Dialogue :** AKIO — « Vous me connaissez ? »
- **Image :** passant figé, bouche qui répète, reflet dans la vitre.
- **Durée / mouvement :** 9 000 ms · left

**A7-03**
- **Kicker :** `LE MARCHÉ`
- **Lieu :** `LE MARCHÉ AUX NÉONS`
- **Narration :** « Au marché, on paie en mémoire. Les étals affichent des prix en années. »
- **Image :** étals, écrans, prix en « ans » et en « accès ».
- **Durée / mouvement :** 8 000 ms · right

**A7-04**
- **Kicker :** `LE MANDAT`
- **Lieu :** `LE MUR DU PROTOCOLE`
- **Narration :** « Sur chaque mur, un sceau de mandat, et dessous : « Shogun Zero. Premier sans vivants. » »
- **Image :** sceau lumineux, devise gravée, câbles propres.
- **Durée / mouvement :** 7 500 ms · push

**A7-05 — carte de titre**
- **Kicker :** `ACTE VII`
- **Lieu :** `LES OMBRES DE NEO-EDO`
- **Narration :** « Une ville qui se souvient de moi avant que j'y entre. »
- **Image :** carte de titre, sanctuaire et néons.
- **Durée / mouvement :** 6 500 ms · push

#### Séquence A7-T1 — Transition « La lame calibrée »

**Déclencheur :** objectif `obj-cyber-calibrate-katana` terminé · **Flag :**
`cutscene.act7.katana` · **Plans :** 2

**A7-T1-1**
- **Kicker :** `LA FRÉQUENCE`
- **Lieu :** `LE SANCTUAIRE`
- **Narration :** « La lame vibre à la fréquence du réseau. Le hamon se met à luire par intermittence. »
- **Image :** lame sur pierre, lignes lumineuses qui montent.
- **Durée / mouvement :** 8 000 ms · push

**A7-T1-2**
- **Kicker :** `LE PRIX`
- **Lieu :** `LE SANCTUAIRE`
- **Narration :** « Calibrer n'est pas améliorer. »
- **Dialogue :** REI — « C'est accepter que la lame vous reconnaisse. »
- **Image :** reflet d'Akio dans la lame, deux fois.
- **Durée / mouvement :** 7 500 ms · left

#### Séquence A7-T2 — Transition « Les moines-mémoires »

**Déclencheur :** objectif `obj-cyber-free-memory-monks` terminé · **Flag :**
`cutscene.act7.monks` · **Plans :** 2

**A7-T2-1**
- **Kicker :** `L'ARCHIVE OUVERTE`
- **Lieu :** `LE MARCHÉ`
- **Narration :** « Ils sortent de l'archive un par un, sans se presser, et chacun dit un nom de 1638. »
- **Image :** silhouettes en robe, câbles au dos, bouche qui nomme.
- **Durée / mouvement :** 8 500 ms · push

**A7-T2-2**
- **Kicker :** `LE DERNIER NOM`
- **Lieu :** `LE SEUIL`
- **Narration :** « Le dernier dit : « Kurokawa Suketada. » Puis il attend une réponse qui ne vient pas. »
- **Dialogue :** AKIO — « Il est mort. »
- **Image :** moine immobile, attente, lumière froide.
- **Durée / mouvement :** 8 000 ms · left

#### Séquence A7-T3 — Transition « Les nids »

**Déclencheur :** objectif `obj-cyber-destroy-drone-nests` terminé · **Flag :**
`cutscene.act7.drones` · **Plans :** 2

**A7-T3-1**
- **Kicker :** `LES NIDS`
- **Lieu :** `LES RUINES DU MAGLEV`
- **Narration :** « Les nids tombent des pylônes comme des essaims de lanternes. »
- **Image :** drones qui chutent, étincelles, poutres.
- **Durée / mouvement :** 7 500 ms · push

**A7-T3-2**
- **Kicker :** `LE SILENCE`
- **Lieu :** `LE CIEL BAS`
- **Narration :** « Le ciel se vide. Pour la première fois de la nuit, on entend la ville respirer. »
- **Image :** toits, câbles, souffle de ventilation.
- **Durée / mouvement :** 8 000 ms · right

#### Séquence A7-T4 — Transition « Le cœur »

**Déclencheur :** objectif `obj-cyber-defeat-hacker` terminé · **Flag :**
`cutscene.act7.core` · **Plans :** 2

**A7-T4-1**
- **Kicker :** `LA DERNIÈRE LIGNE`
- **Lieu :** `LE CENTRE DE DONNÉES`
- **Narration :** « Le Kannushi se dissout en lignes de texte. La dernière ligne est un nom de 1638. »
- **Image :** silhouette qui se défait en caractères, écran vide.
- **Durée / mouvement :** 8 500 ms · push

**A7-T4-2**
- **Kicker :** `LA SALLE SANS SIÈGE`
- **Lieu :** `LE CŒUR`
- **Narration :** « Pas de trône. Une estrade vide, et derrière, la ville entière en archive. »
- **Image :** estrade, mur de données, sol qui s'éteint.
- **Durée / mouvement :** 9 000 ms · push

#### Séquence A7-B1 — Entrée de boss « Kannushi du réseau »

**Déclencheur :** entrée dans `cyber-yomi-datacenter` · **Flag :**
`cutscene.act7.kannushi_intro` · **Plans :** 3

**A7-B1-1**
- **Kicker :** `LES SERVEURS`
- **Lieu :** `LE CENTRE DE DONNÉES`
- **Narration :** « Les serveurs sont alignés comme des autels, et quelqu'un récite devant chacun. »
- **Image :** rangées de baies, câbles, prêtre de dos.
- **Durée / mouvement :** 8 000 ms · push

**A7-B1-2**
- **Kicker :** `LE PRÊTRE-RÉSEAU`
- **Lieu :** `LA TRAVÉE CENTRALE`
- **Narration :** « Il ne se retourne pas. Il parle comme on saisit une entrée de journal. »
- **Dialogue :** KANNUSHI — « Entrée 40 812 : un homme entre dans une salle. Il ne ressort pas. »
- **Dialogue :** AKIO — « Vous écrivez tout. »
- **Dialogue :** KANNUSHI — « Je date tout. »
- **Image :** masque de prêtre, reflets d'écran, cendre au sol.
- **Durée / mouvement :** 10 000 ms · left

**A7-B1-3 — carte de nom**
- **Kicker :** `KANNUSHI DU RÉSEAU YOMI`
- **Lieu :** `PRÊTRE DU CHAPITRE DES MÉMOIRES`
- **Narration :** « Il ne croit pas au Yomi. Il le documente. »
- **Image :** sceau qui s'ouvre en cercle, caractères qui montent.
- **Durée / mouvement :** 7 500 ms · push

**Télégraphes du Kannushi (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Ligne de code | dalles qui s'allument en damier | récitation qui accélère | 900 ms |
| Rappel | silhouette de cendre qui se lève | bourdon de serveur qui monte | 1 100 ms |
| Sceau de mandat | sceau qui s'ouvre en cercle | cloche électronique à deux tons | 1 300 ms |

#### Séquence A7-B2 — Entrée de boss « Shogun Zero »

**Déclencheur :** entrée dans `cyber-shogun-core` · **Flag :**
`cutscene.act7.shogun_intro` · **Plans :** 5

**A7-B2-1**
- **Kicker :** `L'ESTRADE VIDE`
- **Lieu :** `LE CŒUR DU SHŌGUN ZÉRO`
- **Narration :** « La salle n'a pas de siège. Derrière l'estrade, la ville entière tient dans une archive. »
- **Image :** estrade, mur de données, sol noir.
- **Durée / mouvement :** 9 000 ms · push

**A7-B2-2**
- **Kicker :** `LA VOIX`
- **Lieu :** `LE CŒUR`
- **Narration :** « La voix arrive avant le visage, et elle a un trou au milieu d'une phrase. »
- **Dialogue :** SHOGUN ZERO — « N'épargnez… que les vivants. »
- **Image :** visage qui se compose par couches, coupure au milieu.
- **Durée / mouvement :** 10 000 ms · left

**A7-B2-3**
- **Kicker :** `LES COUPURES`
- **Lieu :** `LE CŒUR`
- **Narration :** « La voix saute un mot sur trois. Le visage se recompose à chaque phrase. »
- **Image :** masque de shogun, fragments, sutures lumineuses.
- **Durée / mouvement :** 8 500 ms · right

**A7-B2-4**
- **Kicker :** `PHASE DU DÉCRET`
- **Lieu :** `LE CŒUR`
- **Narration :** « Des colonnes d'archives se lèvent. Chacune porte un décret, et chaque décret envoie des morts. »
- **Image :** colonnes de textes, silhouettes qui en sortent.
- **Durée / mouvement :** 8 000 ms · push

**A7-B2-5 — carte de nom**
- **Kicker :** `SHOGUN ZERO`
- **Lieu :** `PREMIER SANS VIVANTS`
- **Narration :** « Il n'était pas le premier shogun. Il était le premier sans vivants. »
- **Image :** silhouette de shogun, cendre et données, mandat brisé.
- **Durée / mouvement :** 7 500 ms · push

**Télégraphes de Shogun Zero (double canal)**

| Attaque | Canal visuel | Canal sonore | Fenêtre |
|---|---|---|---|
| Décret | colonnes qui s'alignent, papier qui se déplie | voix qui lit un décret | 1 400 ms |
| Archive | copies de boss qui se dessinent, cendre qui se rassemble | cœur qui bat deux fois | 1 200 ms |
| Seuil | murs qui glissent, arène qui se referme | grondement continu | 1 000 ms |

#### Séquence A7-F — Bilan « La question »

**Déclencheur :** objectif `obj-cyber-defeat-shogun-zero` terminé · **Flag :**
`cutscene.act7.ending` · **Plans :** 4

**A7-F-1**
- **Kicker :** `LA FAILLE SE REFERME`
- **Lieu :** `LE CŒUR`
- **Narration :** « La faille se referme sur une question, pas sur une victoire. »
- **Image :** déchirure qui se coud, lumière qui baisse.
- **Durée / mouvement :** 9 000 ms · push

**A7-F-2**
- **Kicker :** `KUROKAWA`
- **Lieu :** `LE PIN NOIR`
- **Narration :** « La neige grise s'arrête. À Kurokawa, la cendre reste au sol, comme elle est tombée. »
- **Image :** cour du refuge, pin fendu, cendre immobile.
- **Durée / mouvement :** 8 500 ms · left

**A7-F-3**
- **Kicker :** `LE REGISTRE`
- **Lieu :** `L'INFIRMERIE`
- **Narration :** « Chiyo ouvre le registre, écrit une ligne, et laisse la plume en travers de la page. »
- **Dialogue :** CHIYO — « Il y a un nom de plus. Le vôtre, si vous restez. »
- **Image :** registre ouvert, ligne fraîche, bol de cendre.
- **Durée / mouvement :** 9 000 ms · right

**A7-F-4 — carte de bilan**
- **Kicker :** `ACTE VII — BILAN`
- **Lieu :** `LES OMBRES DE NEO-EDO`
- **Narration :** « Il n'était pas le premier shogun. Il était le premier sans vivants. »
- **Image :** carte de bilan, mandat brisé sur fond de cendre.
- **Durée / mouvement :** 8 000 ms · push

### 18.8 Contrôles de ton

- Chaque plan fait avancer une information : lieu, menace, décision.
- Un plan sans dialogue ne dépasse pas 30 mots de narration.
- Un plan avec dialogue garde un seul échange : au plus trois répliques, et
  jamais deux d'affilée du même personnage.
- Aucun plan n'explique le Kegare avant l'acte III.
- Aucun plan ne nomme Yomi-no-Kanrei avant l'acte V.
- Akio pose au plus une question par séquence.
- Le bilan dit toujours ce qui a changé, jamais ce qui va arriver.
- Kumo annonce un prix avant chaque phase ; il ne frappe jamais le premier.
- Suzu ne prend jamais part à un combat et ne touche jamais une lame.
- Aucune séquence ne montre le visage complet d'un boss avant sa carte de nom.
- Chaque attaque létale d'un boss possède un télégraphe visuel **et** un
télégraphe sonore, de même durée (voir 18.9).
- Aucun plan ne nomme Yomi-no-Kanrei avant la carte de nom de l'acte V.

### 18.9 Règle des télégraphes à double canal

Une attaque létale est toujours annoncée **deux fois** : une fois pour les
yeux, une fois pour les oreilles. Les deux canaux portent la même information
et ouvrent la même fenêtre de réaction ; aucun n'est un doublon décoratif.

Pourquoi : un joueur sourd doit pouvoir battre Kumo, dont les télégraphes
étaient « surtout sonores » (§8.2) ; un joueur qui coupe le son, ou qui joue
dans une pièce bruyante, doit pouvoir battre Shiro-Kabuto. Un seul canal
suffisant rendrait l'un des deux publics incapable de finir le jeu.

Contraintes :

- **Égalité de fenêtre** : les deux signaux commencent et finissent à moins de
  100 ms d'écart, et la fenêtre affichée dans le tableau de chaque boss est la
  même pour les deux canaux.
- **Spécificité** : deux attaques différentes n'utilisent jamais le même signal
  dans un même canal. Le son identifie l'attaque, pas seulement le danger.
- **Redondance** : le canal visuel ne dépend pas de la couleur seule (forme,
  posture, poussière, lumière), le canal sonore ne dépend pas du volume seul
  (timbre, rythme, hauteur).
- **Cohérence diégétique** : le son vient d'un objet présent (carapace, croc,
  sifflet, lanterne, serveur) ; le visuel vient du corps du boss, jamais d'une
  icône d'interface.
- **Après la mort** : les pièges de Kumo restent actifs, mais ils portent aussi
  les deux canaux (fil tendu + cliquetis), sinon ils deviennent un piège
  injuste.

Vérification à l'implémentation : chaque attaque déclare `telegraph.visual`,
`telegraph.audio` et `telegraph.windowMs` dans les données du boss ; un test
échoue si l'un des trois manque ou si deux attaques d'un même boss partagent
un identifiant de canal.
