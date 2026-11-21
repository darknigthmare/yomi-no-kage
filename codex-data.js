/* GÉNÉRÉ PAR tools/build-codex-data.mjs — NE PAS ÉDITER.
 * Source : assets/modular/manifests/yomi-no-kage-canon.json
 * Empreinte : cf6972a22bf9290120c12fff630d17e9dff4ae5932b1c8ca96363022efeb8cd8
 * 237 fiches — bible 2.0.
 * Régénérer : node tools/build-codex-data.mjs
 */
window.KageCodexData = Object.freeze({
  "schema": 1,
  "source": {
    "manifest": "assets/modular/manifests/yomi-no-kage-canon.json",
    "sha256": "cf6972a22bf9290120c12fff630d17e9dff4ae5932b1c8ca96363022efeb8cd8",
    "bibleVersion": "2.0"
  },
  "families": {
    "total": 237,
    "creatures": {
      "label": "Créatures",
      "total": 105
    },
    "katana": {
      "label": "Lames",
      "total": 10
    },
    "places": {
      "label": "Lieux",
      "total": 28
    },
    "seals": {
      "label": "Sceaux",
      "total": 14
    },
    "chronicle": {
      "label": "Chronique",
      "total": 80
    }
  },
  "entries": [
    {
      "id": "01-shibito-villager",
      "family": "creatures",
      "title": "Shibito des rizières",
      "subtitle": "Infecté villageois",
      "body": "Il compte encore les gerbes qu'on ne rentrera pas.",
      "meta": {
        "tier": "legacy",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "legacy"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "01-shibito-villager"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette ancienne non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "02-ashigaru-revenant",
      "family": "creatures",
      "title": "Ashigaru revenant",
      "subtitle": "Fantassin discipliné",
      "body": "Sa lance garde une porte qui n'existe plus.",
      "meta": {
        "tier": "legacy",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "legacy"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "02-ashigaru-revenant"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette ancienne non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "03-kegare-sohei",
      "family": "creatures",
      "title": "Sōhei du Kegare",
      "subtitle": "Moine guerrier infecté",
      "body": "Il frappe au rythme d'un sutra dont il a perdu la fin.",
      "meta": {
        "tier": "legacy",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "legacy"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "03-kegare-sohei"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette ancienne non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "04-onryo-miko",
      "family": "creatures",
      "title": "Miko onryō",
      "subtitle": "Desservante spectrale",
      "body": "Elle purifie des autels déjà vides.",
      "meta": {
        "tier": "legacy",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "legacy"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "04-onryo-miko"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette ancienne non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "05-kabuto-brute",
      "family": "creatures",
      "title": "Brute au kabuto",
      "subtitle": "Infecté lourd",
      "body": "Le casque a survécu au visage.",
      "meta": {
        "tier": "legacy",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "legacy"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "05-kabuto-brute"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette ancienne non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "06-daimyo-corrupted",
      "family": "creatures",
      "title": "Daimyō corrompu",
      "subtitle": "Seigneur infecté",
      "body": "Il signe encore des ordres que personne ne lit.",
      "meta": {
        "tier": "legacy",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-donjon-expansion"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "06-daimyo-corrupted"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette ancienne non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r01-nureta-fisher",
      "family": "creatures",
      "title": "Pêcheur de Nureta",
      "subtitle": "Harceleur côtier",
      "body": "Il pêche dans un canal qui n'a jamais eu de poissons.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r01-nureta-fisher"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r02-sekisho-messenger",
      "family": "creatures",
      "title": "Messager du Sekisho",
      "subtitle": "Coureur d'interception",
      "body": "Il court une route dont le péage a brûlé.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r02-sekisho-messenger"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r03-kurokawa-miner",
      "family": "creatures",
      "title": "Mineur de Kurokawa",
      "subtitle": "Briseur lourd",
      "body": "Il cherche une veine qui l'a déjà enseveli.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r03-kurokawa-miner"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r04-chaya-servant",
      "family": "creatures",
      "title": "Servante du Chaya",
      "subtitle": "Assaillante vive",
      "body": "Elle sert un thé que personne ne boit.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r04-chaya-servant"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r05-kome-porter",
      "family": "creatures",
      "title": "Porteur de riz",
      "subtitle": "Colosse de proximité",
      "body": "Le sac sur son dos est plein de cendre.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          3
        ],
        "zones": [
          "fields-burning-granary",
          "fields-drowned-paddies",
          "fields-mill-road",
          "fields-west-dikes"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r05-kome-porter"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r06-yama-woodcutter",
      "family": "creatures",
      "title": "Bûcheron des montagnes",
      "subtitle": "Frappeur vertical",
      "body": "Il compte ses coups sur des troncs qui saignent.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          1
        ],
        "zones": [
          "forest-abandoned-camp",
          "forest-kaido-trail"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r06-yama-woodcutter"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r07-shio-worker",
      "family": "creatures",
      "title": "Saunière",
      "subtitle": "Balayeuse de zone",
      "body": "Elle revient d'un convoi de sel jamais arrivé.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r07-shio-worker"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r08-kawara-roofer",
      "family": "creatures",
      "title": "Couvreur de Kawara",
      "subtitle": "Bondisseur agile",
      "body": "Il monte encore sur des toits effondrés.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r08-kawara-roofer"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r09-haka-digger",
      "family": "creatures",
      "title": "Fossoyeur de Haka",
      "subtitle": "Piqueur tenace",
      "body": "Il creuse pour ceux qu'il n'a pas enterrés.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          1
        ],
        "zones": [
          "forest-abandoned-camp",
          "forest-kaido-trail",
          "forest-root-sanctuary"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r09-haka-digger"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r10-hikeshi-watchman",
      "family": "creatures",
      "title": "Veilleur Hikeshi",
      "subtitle": "Contrôle frontal",
      "body": "Il surveille un incendie éteint depuis des jours.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          4
        ],
        "zones": [
          "city-castle-approach"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r10-hikeshi-watchman"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r11-nohara-ronin",
      "family": "creatures",
      "title": "Rōnin des plaines",
      "subtitle": "Duelliste errant",
      "body": "Il cherche un seigneur pour légitimer sa lame.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r11-nohara-ronin"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r12-miya-porter",
      "family": "creatures",
      "title": "Porteuse de Miya",
      "subtitle": "Lancière de sanctuaire",
      "body": "Elle porte un palanquin vide depuis Tsuru.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r12-miya-porter"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r13-yakushi-apprentice",
      "family": "creatures",
      "title": "Apprenti Yakushi",
      "subtitle": "Attaquant toxique",
      "body": "Il soigne des plaies qui ne saignent plus.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r13-yakushi-apprentice"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r14-kaido-bandit",
      "family": "creatures",
      "title": "Bandite du Kaidō",
      "subtitle": "Embusqueuse rapide",
      "body": "Elle rançonne des voyageurs qui ne paient plus.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          2
        ],
        "zones": [
          "bamboo-hollow-path",
          "bamboo-rain-gate"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r14-kaido-bandit"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r15-oku-servant",
      "family": "creatures",
      "title": "Servante de l'Oku",
      "subtitle": "Bretteuse disciplinée",
      "body": "Elle range un intérieur qu'elle ne reconnaît pas.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          5
        ],
        "zones": [
          "castle-armory"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r15-oku-servant"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r16-kusari-prisoner",
      "family": "creatures",
      "title": "Prisonnier aux chaînes",
      "subtitle": "Contrôle circulaire",
      "body": "Ses chaînes tiennent encore à un mur absent.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r16-kusari-prisoner"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r17-umaya-groom",
      "family": "creatures",
      "title": "Palefrenier d'Umaya",
      "subtitle": "Harceleur à distance",
      "body": "Il panse un cheval mangé l'hiver dernier.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          3
        ],
        "zones": [
          "fields-drowned-paddies",
          "fields-mill-road",
          "fields-west-dikes"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r17-umaya-groom"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r18-washi-maker",
      "family": "creatures",
      "title": "Fabricante de washi",
      "subtitle": "Tailleuse fragile",
      "body": "Elle déchire des registres pour en faire du papier.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [],
        "zones": [],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r18-washi-maker"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r19-kago-bearer",
      "family": "creatures",
      "title": "Porteur de kago",
      "subtitle": "Fantassin de poussée",
      "body": "Il porte un brancard qui n'a plus de blessé.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          3
        ],
        "zones": [
          "fields-burning-granary",
          "fields-drowned-paddies",
          "fields-west-dikes"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r19-kago-bearer"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "r20-komuso-wanderer",
      "family": "creatures",
      "title": "Errant Komusō",
      "subtitle": "Sentinelle aveugle",
      "body": "Il écoute une flûte qu'il ne joue pas.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          1,
          2
        ],
        "zones": [
          "bamboo-hollow-path",
          "bamboo-rain-gate",
          "forest-kaido-trail",
          "forest-root-sanctuary"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "r20-komuso-wanderer"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-modern-commuter",
      "family": "creatures",
      "title": "Navetteur contaminé",
      "subtitle": "Errant de quai",
      "body": "Il attend une rame qui ne viendra plus.",
      "meta": {
        "tier": "regular",
        "stage": 2,
        "acts": [
          6
        ],
        "zones": [
          "modern-metropolitan-lab",
          "modern-quarantine-hospital",
          "modern-shibuya-side-street",
          "modern-subway-station"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-modern-commuter"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-cyber-neon-shinobi",
      "family": "creatures",
      "title": "Shinobi néon",
      "subtitle": "Assassin de faille",
      "body": "Il saute entre des immeubles qui n'ont plus de rues.",
      "meta": {
        "tier": "regular",
        "stage": 3,
        "acts": [
          7
        ],
        "zones": [
          "cyber-maglev-ruins",
          "cyber-neon-market",
          "cyber-shogun-core",
          "cyber-shrine-sector",
          "cyber-yomi-datacenter"
        ],
        "role": "regular"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-cyber-neon-shinobi"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Silhouette commune non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s01-kusa-shinobi",
      "family": "creatures",
      "title": "Éclaireur shinobi de Kusa",
      "subtitle": "Traqueur furtif",
      "body": "Il observe une armée qui n'est jamais venue.",
      "meta": {
        "tier": "special",
        "stage": 2,
        "acts": [
          2
        ],
        "zones": [
          "bamboo-hollow-path",
          "bamboo-moon-clearing",
          "bamboo-rain-gate"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s01-kusa-shinobi"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s02-doku-kunoichi",
      "family": "creatures",
      "title": "Kunoichi au poison",
      "subtitle": "Assassineuse toxique",
      "body": "Son poison fut distillé pour un seigneur mort.",
      "meta": {
        "tier": "special",
        "stage": 2,
        "acts": [
          2
        ],
        "zones": [
          "bamboo-hollow-path",
          "bamboo-moon-clearing",
          "bamboo-rain-gate"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s02-doku-kunoichi"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s03-bakusai-runner",
      "family": "creatures",
      "title": "Coureur Bakusai",
      "subtitle": "Sapeur explosif",
      "body": "Il porte une mèche allumée depuis la première nuit.",
      "meta": {
        "tier": "special",
        "stage": 2,
        "acts": [
          4
        ],
        "zones": [
          "city-castle-approach"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s03-bakusai-runner"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s04-onibi-adept",
      "family": "creatures",
      "title": "Adepte de l'Onibi",
      "subtitle": "Exorciste corrompu",
      "body": "Il allume des feux pour éclairer les morts.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s04-onibi-adept"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s05-raimei-yamabushi",
      "family": "creatures",
      "title": "Yamabushi de Raimei",
      "subtitle": "Ascète de la foudre",
      "body": "Il appelle la foudre sur une montagne sans orage.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          1
        ],
        "zones": [
          "forest-abandoned-camp",
          "forest-kaido-trail",
          "forest-root-sanctuary"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s05-raimei-yamabushi"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s06-oni-men-executioner",
      "family": "creatures",
      "title": "Bourreau au masque d'oni",
      "subtitle": "Exécuteur colossal",
      "body": "Il exécute des condamnés déjà morts.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s06-oni-men-executioner"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s07-tessen-courtier",
      "family": "creatures",
      "title": "Courtisan au tessen",
      "subtitle": "Duelliste de cour",
      "body": "Il évente un protocole qui n'a plus de cour.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s07-tessen-courtier"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s08-gomon-jailer",
      "family": "creatures",
      "title": "Geôlier de Gomon",
      "subtitle": "Gardien de contrôle",
      "body": "Il vérifie des identités que plus personne ne porte.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-armory"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s08-gomon-jailer"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s09-kuro-yakushi",
      "family": "creatures",
      "title": "Yakushi noir",
      "subtitle": "Médecin de la peste",
      "body": "Il prescrit la cendre comme remède.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s09-kuro-yakushi"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s10-hatamoto-fallen",
      "family": "creatures",
      "title": "Hatamoto déchue",
      "subtitle": "Élite du bakufu",
      "body": "Son rang tient encore dans sa poitrine.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-yomi-rift"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s10-hatamoto-fallen"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s11-biwa-revenant",
      "family": "creatures",
      "title": "Revenant au biwa",
      "subtitle": "Musicien d'onde",
      "body": "Son onde fait saigner les murs.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s11-biwa-revenant"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s12-shikigami-scribe",
      "family": "creatures",
      "title": "Scribe aux shikigami",
      "subtitle": "Invocatrice tactique",
      "body": "Il écrit des noms qui se relèvent.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s12-shikigami-scribe"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s13-kegare-sumotori",
      "family": "creatures",
      "title": "Sumotori souillé",
      "subtitle": "Mur de chair",
      "body": "Il cherche un cercle assez grand pour lui.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          3
        ],
        "zones": [
          "fields-burning-granary",
          "fields-drowned-paddies",
          "fields-mill-road",
          "fields-west-dikes"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s13-kegare-sumotori"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s14-mizuchi-diver",
      "family": "creatures",
      "title": "Plongeuse Mizuchi",
      "subtitle": "Chasseuse amphibie",
      "body": "Elle attend sous l'eau un adversaire qui respire.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s14-mizuchi-diver"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s15-teppo-corpsman",
      "family": "creatures",
      "title": "Arquebusier Teppō",
      "subtitle": "Tireur d'élite",
      "body": "Il recharge un fusil dont la mèche est morte.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-armory"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s15-teppo-corpsman"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s16-kage-mai-dancer",
      "family": "creatures",
      "title": "Danseuse Kage-mai",
      "subtitle": "Lame tournoyante",
      "body": "Elle tourne pour un public de cendres.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          2
        ],
        "zones": [
          "bamboo-moon-clearing",
          "bamboo-rain-gate"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s16-kage-mai-dancer"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s17-kurohata-bearer",
      "family": "creatures",
      "title": "Porte-étendard Kurohata",
      "subtitle": "Commandant de horde",
      "body": "Son étendard recrute plus vite que la parole.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          4
        ],
        "zones": [
          "city-castle-approach"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s17-kurohata-bearer"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s18-yomi-herald",
      "family": "creatures",
      "title": "Héraut du Yomi",
      "subtitle": "Officiant du gong",
      "body": "Il annonce un édit que personne n'a écrit.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-yomi-rift"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s18-yomi-herald"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s19-wana-trapper",
      "family": "creatures",
      "title": "Trappeur de Wana",
      "subtitle": "Contrôleur forestier",
      "body": "Ses pièges servent encore quelqu'un.",
      "meta": {
        "tier": "special",
        "stage": 2,
        "acts": [
          1,
          3
        ],
        "zones": [
          "fields-mill-road",
          "fields-west-dikes",
          "forest-abandoned-camp",
          "forest-kaido-trail",
          "forest-root-sanctuary"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s19-wana-trapper"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "s20-mekura-oracle",
      "family": "creatures",
      "title": "Oracle Mekura",
      "subtitle": "Voyante aveugle",
      "body": "Elle voit les vivants et se trompe sur eux.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-yomi-rift"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "s20-mekura-oracle"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-modern-riot-host",
      "family": "creatures",
      "title": "Hôte antiémeute",
      "subtitle": "Rempart contaminé",
      "body": "Il tient une ligne que la foule a déjà franchie.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          6
        ],
        "zones": [
          "modern-metropolitan-lab",
          "modern-quarantine-hospital",
          "modern-shibuya-side-street",
          "modern-subway-station"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-modern-riot-host"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-modern-response-officer",
      "family": "creatures",
      "title": "Agent d'intervention",
      "subtitle": "Tireur de confinement",
      "body": "Il tire sur des gens qu'il croit contaminés.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          6
        ],
        "zones": [
          "modern-metropolitan-lab",
          "modern-quarantine-hospital",
          "modern-shibuya-side-street",
          "modern-subway-station"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-modern-response-officer"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-cyber-drone-corpse",
      "family": "creatures",
      "title": "Cadavre-porteur de drone",
      "subtitle": "Relais nécro-technique",
      "body": "Le drone repart quand le corps s'arrête.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          7
        ],
        "zones": [
          "cyber-maglev-ruins",
          "cyber-neon-market",
          "cyber-shogun-core",
          "cyber-shrine-sector",
          "cyber-yomi-datacenter"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-cyber-drone-corpse"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-cyber-oni-frame",
      "family": "creatures",
      "title": "Châssis Oni",
      "subtitle": "Briseur cybernétique",
      "body": "Le châssis a gardé la démarche de son pilote.",
      "meta": {
        "tier": "special",
        "stage": 3,
        "acts": [
          7
        ],
        "zones": [
          "cyber-maglev-ruins",
          "cyber-neon-market",
          "cyber-shogun-core",
          "cyber-shrine-sector",
          "cyber-yomi-datacenter"
        ],
        "role": "special"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-cyber-oni-frame"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Silhouette singulière non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-01-gunso-croc-fer",
      "family": "creatures",
      "title": "Gunsō Croc de Fer",
      "subtitle": "Capitaine ashigaru",
      "body": "Il tient la ligne avec des dents de fer.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-01-gunso-croc-fer"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-02-ronin-kurogane",
      "family": "creatures",
      "title": "Rōnin de Kurogane",
      "subtitle": "Duelliste sans maître",
      "body": "Il n'a jamais trouvé de maître à sa taille.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-02-ronin-kurogane"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-03-sohei-cent-prieres",
      "family": "creatures",
      "title": "Sōhei aux Cent Prières",
      "subtitle": "Moine guerrier corrompu",
      "body": "La centième prière est un coup de poing.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-03-sohei-cent-prieres"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-04-miko-tsukikage",
      "family": "creatures",
      "title": "Miko de Tsukikage",
      "subtitle": "Gardienne du sanctuaire lunaire",
      "body": "Elle garde un sanctuaire que la lune a déserté.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-04-miko-tsukikage"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-05-yamabushi-akaoni",
      "family": "creatures",
      "title": "Yamabushi Akaoni",
      "subtitle": "Ascète de la montagne rouge",
      "body": "Son visage rouge n'est pas un masque.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-05-yamabushi-akaoni"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-06-shinobi-brumes",
      "family": "creatures",
      "title": "Shinobi des Brumes",
      "subtitle": "Agent de la vallée noyée",
      "body": "Il ne quitte pas une vallée noyée.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          2
        ],
        "zones": [
          "bamboo-hollow-path",
          "bamboo-moon-clearing",
          "bamboo-rain-gate"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-06-shinobi-brumes"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-07-arquebusier-jigoku",
      "family": "creatures",
      "title": "Arquebusier de Jigoku",
      "subtitle": "Vétéran du teppō",
      "body": "Sa salve est réglée comme un enterrement.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-07-arquebusier-jigoku"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-08-archer-os",
      "family": "creatures",
      "title": "Archer d’Os",
      "subtitle": "Sentinelle des remparts",
      "body": "Ses flèches sont des côtes.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-08-archer-os"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-09-pisteur-kegare",
      "family": "creatures",
      "title": "Pisteur du Kegare",
      "subtitle": "Chasseur de quarantaine",
      "body": "Il chasse les contaminés et les compte.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          1
        ],
        "zones": [
          "forest-abandoned-camp",
          "forest-kaido-trail"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-09-pisteur-kegare"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-10-forgeron-hibana",
      "family": "creatures",
      "title": "Forgeron Hibana",
      "subtitle": "Armurier du château",
      "body": "Il forge des lames pour des mains mortes.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-armory"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-10-forgeron-hibana"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-11-hatamoto-inazuma",
      "family": "creatures",
      "title": "Hatamoto Inazuma",
      "subtitle": "Retainer de l’éclair",
      "body": "Il frappe une fois, puis écoute.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-11-hatamoto-inazuma"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-12-gardien-masque-fer",
      "family": "creatures",
      "title": "Gardien au Masque de Fer",
      "subtitle": "Verrou vivant",
      "body": "La porte est en lui.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-armory"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-12-gardien-masque-fer"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-13-komuso-grue-noire",
      "family": "creatures",
      "title": "Komusō de la Grue Noire",
      "subtitle": "Moine du souffle creux",
      "body": "Son souffle creux ouvre des portes.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-13-komuso-grue-noire"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-14-pirate-shioyake",
      "family": "creatures",
      "title": "Pirate Shioyake",
      "subtitle": "Raider des côtes brûlées",
      "body": "Il pille un convoi fluvial échoué.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-14-pirate-shioyake"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-15-kunoichi-veuve",
      "family": "creatures",
      "title": "Kunoichi de la Veuve",
      "subtitle": "Assassine au fil noir",
      "body": "Son fil noir relie les morts.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-15-kunoichi-veuve"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-16-yoriki-gashadokuro",
      "family": "creatures",
      "title": "Yoriki Gashadokuro",
      "subtitle": "Officier du magistrat",
      "body": "Il dresse des procès-verbaux de décès.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-16-yoriki-gashadokuro"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-17-sumotori-namazu",
      "family": "creatures",
      "title": "Sumotori Namazu",
      "subtitle": "Champion du poisson-chat",
      "body": "Il fait trembler le sol sans bouger.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          3
        ],
        "zones": [
          "fields-burning-granary",
          "fields-drowned-paddies",
          "fields-mill-road",
          "fields-west-dikes"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-17-sumotori-namazu"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-18-onmyoji-renard",
      "family": "creatures",
      "title": "Onmyōji du Renard",
      "subtitle": "Divinateur aux neuf feintes",
      "body": "Ses neuf feintes sont neuf deuils.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          5
        ],
        "zones": [
          "castle-yomi-rift"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-18-onmyoji-renard"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-19-faucon-orage",
      "family": "creatures",
      "title": "Faucon de l’Orage",
      "subtitle": "Capitaine des crêtes",
      "body": "Il tombe du ciel comme une dette.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-19-faucon-orage"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "mb-20-capitaine-byakko",
      "family": "creatures",
      "title": "Capitaine Byakko",
      "subtitle": "Commandant du Tigre blanc",
      "body": "Il commande un tigre blanc et des hommes gris.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          4
        ],
        "zones": [
          "city-castle-approach"
        ],
        "role": "miniboss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "mb-20-capitaine-byakko"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-cyber-yomi-hacker",
      "family": "creatures",
      "title": "Kannushi du réseau Yomi",
      "subtitle": "Officiant des mémoires contaminées",
      "body": "Il récite les derniers instants comme des commandes.",
      "meta": {
        "tier": "miniboss",
        "stage": 3,
        "acts": [
          7
        ],
        "zones": [
          "cyber-yomi-datacenter"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-cyber-yomi-hacker"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Silhouette imposante non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-01-geoliere-sekimon",
      "family": "creatures",
      "title": "Geôlière de Sekimon",
      "subtitle": "Commandante de la prison rouge",
      "body": "Ses clés ouvrent des cellules pleines.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-01-geoliere-sekimon"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-02-abbe-kurotaki",
      "family": "creatures",
      "title": "Abbé de Kurotaki",
      "subtitle": "Gardien de la cascade noire",
      "body": "Il a scellé ses malades pour ne pas les brûler.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-02-abbe-kurotaki"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-03-chatelain-ibushi",
      "family": "creatures",
      "title": "Châtelain Ibushi",
      "subtitle": "Seigneur de la forteresse fumante",
      "body": "Il pille une ville qui n'a plus rien.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-03-chatelain-ibushi"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-04-prince-marchand-kane",
      "family": "creatures",
      "title": "Prince Marchand Kane",
      "subtitle": "Maître des greniers d’argent",
      "body": "Il vend du riz qui pousse sur des morts.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-04-prince-marchand-kane"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-05-matriarche-beni-tsuru",
      "family": "creatures",
      "title": "Matriarche Beni-Tsuru",
      "subtitle": "Grue rouge du clan",
      "body": "Elle a cousu les bannières de quarantaine.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-05-matriarche-beni-tsuru"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-06-amiral-shiranui",
      "family": "creatures",
      "title": "Amiral Shiranui",
      "subtitle": "Commandant des feux de mer",
      "body": "Il a sabordé sa flottille pour garder le passage.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-06-amiral-shiranui"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-07-bourreau-lune-rouge",
      "family": "creatures",
      "title": "Bourreau de la Lune Rouge",
      "subtitle": "Exécuteur du tribunal nocturne",
      "body": "Il exécute au nom d'un tribunal nocturne.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-07-bourreau-lune-rouge"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-08-medecin-shirohebi",
      "family": "creatures",
      "title": "Médecin Shirohebi",
      "subtitle": "Physicien du serpent blanc",
      "body": "Il greffe la Fièvre comme un traitement.",
      "meta": {
        "tier": "boss",
        "stage": 4,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-08-medecin-shirohebi"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-09-maitre-noh-utsuro",
      "family": "creatures",
      "title": "Maître Nō Utsuro",
      "subtitle": "Masque de la scène vide",
      "body": "Son masque vide joue tous les rôles.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-09-maitre-noh-utsuro"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-10-seigneur-riz-noir",
      "family": "creatures",
      "title": "Seigneur du Riz Noir",
      "subtitle": "Tyran des greniers pestiférés",
      "body": "Il compte les grains, pas les vivants.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-10-seigneur-riz-noir"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-11-brigadier-engeki",
      "family": "creatures",
      "title": "Brigadier Engeki",
      "subtitle": "Chef des pompiers d’Edo",
      "body": "Il a brûlé la ville pour la tenir.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [
          4
        ],
        "zones": [
          "city-castle-approach"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-11-brigadier-engeki"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-12-generale-murasaki",
      "family": "creatures",
      "title": "Générale Murasaki",
      "subtitle": "Commandante des archers violets",
      "body": "Ses archers tirent sur un ordre écrit.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-12-generale-murasaki"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-13-prieur-lotus-noir",
      "family": "creatures",
      "title": "Prieur du Lotus Noir",
      "subtitle": "Ascète aux paumes souillées",
      "body": "Ses paumes souillées guérissent mal.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-13-prieur-lotus-noir"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-14-maitre-shinobi-kumo",
      "family": "creatures",
      "title": "Maître Shinobi Kumo",
      "subtitle": "Chef de la toile obscure",
      "body": "Il a vendu les passages qu'il avait ouverts.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [
          2
        ],
        "zones": [
          "bamboo-moon-clearing"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-14-maitre-shinobi-kumo"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-15-cavalier-kurogoma",
      "family": "creatures",
      "title": "Cavalier Kurogoma",
      "subtitle": "Commandant de la monture noire",
      "body": "Sa monture noire ne s'arrête plus.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-15-cavalier-kurogoma"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-16-emissaire-kagemori",
      "family": "creatures",
      "title": "Émissaire Kagemori",
      "subtitle": "Voix masquée du bakufu",
      "body": "Il parle au nom d'un bakufu qui l'a oublié.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-16-emissaire-kagemori"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-17-yokozuna-ganryu",
      "family": "creatures",
      "title": "Yokozuna Ganryū",
      "subtitle": "Montagne du cercle sacré",
      "body": "Il cherche un adversaire à sa mesure.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-17-yokozuna-ganryu"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-18-pretresse-cendres-suzaku",
      "family": "creatures",
      "title": "Prêtresse des Cendres Suzaku",
      "subtitle": "Officiante du feu purificateur",
      "body": "Son feu purifie tout, y compris les vivants.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-18-pretresse-cendres-suzaku"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-19-apothicaire-midori",
      "family": "creatures",
      "title": "Apothicaire Midori",
      "subtitle": "Maître des remèdes verts",
      "body": "Ses remèdes verts soulagent et contaminent.",
      "meta": {
        "tier": "boss",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-19-apothicaire-midori"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "boss-20-vaisseau-yomi",
      "family": "creatures",
      "title": "Vaisseau du Yomi",
      "subtitle": "Premier inquisiteur entièrement réclamé",
      "body": "Le premier inquisiteur entièrement réclamé.",
      "meta": {
        "tier": "boss",
        "stage": 4,
        "acts": [],
        "zones": [],
        "role": "optional-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "boss-20-vaisseau-yomi"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-modern-metro-colossus",
      "family": "creatures",
      "title": "Colosse de la ligne Yomi",
      "subtitle": "Terminus vivant de Tokyo",
      "body": "Le terminus a mangé les rames et les voyageurs.",
      "meta": {
        "tier": "boss",
        "stage": 4,
        "acts": [
          6
        ],
        "zones": [
          "modern-metropolitan-lab"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-modern-metro-colossus"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "new-cyber-shogun-zero",
      "family": "creatures",
      "title": "Shōgun Zéro",
      "subtitle": "Souverain de Neo-Tokyo réclamé par le Yomi",
      "body": "Il gouverne des morts qu'il croit vivants.",
      "meta": {
        "tier": "boss",
        "stage": 4,
        "acts": [
          7
        ],
        "zones": [
          "cyber-shogun-core"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "new-cyber-shogun-zero"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Silhouette colossale non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-01-kurogane-warder",
      "family": "creatures",
      "title": "Gardien Kurogane",
      "subtitle": "Geôlier colossal de la porte noire",
      "body": "La porte reste close, même sans mur.",
      "meta": {
        "tier": "massive",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-01-kurogane-warder"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-02-aka-ushi",
      "family": "creatures",
      "title": "Aka-Ushi",
      "subtitle": "Bœuf de trait pestiféré",
      "body": "Le convoi l'a laissé sur la route.",
      "meta": {
        "tier": "massive",
        "stage": 2,
        "acts": [
          4
        ],
        "zones": [
          "city-canal-roofs"
        ],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-02-aka-ushi"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-03-take-mori",
      "family": "creatures",
      "title": "Take-Mori",
      "subtitle": "Colosse de la bambouseraie",
      "body": "Ses crêtes ont poussé comme du bambou.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [
          1
        ],
        "zones": [
          "forest-root-sanctuary"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-03-take-mori"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-04-enjin-bozu",
      "family": "creatures",
      "title": "Enjin-Bōzu",
      "subtitle": "Moine du foyer consumé",
      "body": "Il a brûlé avec le brasier qu'il gardait.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [],
        "zones": [],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-04-enjin-bozu"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-05-numa-no-oyakata",
      "family": "creatures",
      "title": "Numa-no-Oyakata",
      "subtitle": "Seigneur noyé du domaine fluvial",
      "body": "Il tient encore le niveau des eaux.",
      "meta": {
        "tier": "massive",
        "stage": 3,
        "acts": [],
        "zones": [],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-05-numa-no-oyakata"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-06-kinoko-haha",
      "family": "creatures",
      "title": "Kinoko-Haha",
      "subtitle": "Matrone fongique de la quarantaine",
      "body": "La quarantaine l'a laissée fleurir.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [],
        "zones": [],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-06-kinoko-haha"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-07-shiro-kabuto",
      "family": "creatures",
      "title": "Shiro-Kabuto",
      "subtitle": "Scarabée pâle de la peste",
      "body": "Il a mangé les fosses communes.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [
          3
        ],
        "zones": [
          "fields-burning-granary"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-07-shiro-kabuto"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-08-nuno-kyojin",
      "family": "creatures",
      "title": "Nuno-Kyojin",
      "subtitle": "Titan des linceuls de quarantaine",
      "body": "Il est fait des linceuls qu'on n'a pas eu le temps de coudre.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [],
        "zones": [],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-08-nuno-kyojin"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-09-ganseki-otoko",
      "family": "creatures",
      "title": "Ganseki-Otoko",
      "subtitle": "Contremaître pétrifié de la carrière",
      "body": "La carrière l'a repris.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [],
        "zones": [],
        "role": "massive"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-09-ganseki-otoko"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "giant-10-yomi-no-kanrei",
      "family": "creatures",
      "title": "Yomi-no-Kanrei",
      "subtitle": "Régent à quatre bras du château",
      "body": "Le daimyō, avec assez de bras pour tenir la ville.",
      "meta": {
        "tier": "massive",
        "stage": 4,
        "acts": [
          5
        ],
        "zones": [
          "castle-yomi-rift"
        ],
        "role": "act-boss"
      },
      "unlock": {
        "kind": "encounter",
        "ids": [
          "giant-10-yomi-no-kanrei"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Silhouette massive non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#11"
      ]
    },
    {
      "id": "01-kurokage",
      "family": "katana",
      "title": "Kurokage",
      "subtitle": "L’ombre noire",
      "body": "Sabre d’un messager du bakufu, marqué par les routes de quarantaine. Pas de l’ombre : Détection réduite et dégâts accrus dans le dos.",
      "meta": {
        "rarity": "rare",
        "act": 1,
        "passive": {
          "id": "shadow-step",
          "name": "Pas de l’ombre",
          "description": "Détection réduite et dégâts accrus dans le dos.",
          "trigger": "onBackstab"
        },
        "unlock": {
          "type": "starter",
          "label": "Confié à Akio par le shogun"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "01-kurokage"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.1"
      ]
    },
    {
      "id": "02-shogun-no-in",
      "family": "katana",
      "title": "Shōgun no In",
      "subtitle": "Le sceau du shogun",
      "body": "Une lame de présentation attestant l’ordre d’éradication venu d’Edo. Autorité du bakufu : Une parade parfaite accorde 20 % de résistance pendant deux secondes.",
      "meta": {
        "rarity": "legendary",
        "act": 2,
        "passive": {
          "id": "bakufu-authority",
          "name": "Autorité du bakufu",
          "description": "Une parade parfaite accorde 20 % de résistance pendant deux secondes.",
          "trigger": "onPerfectParry"
        },
        "unlock": {
          "type": "chapter",
          "label": "Récompense du chapitre 2"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "02-shogun-no-in"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.2"
      ]
    },
    {
      "id": "03-hinezumi",
      "family": "katana",
      "title": "Hinezumi",
      "subtitle": "Le rat de feu",
      "body": "Retrouvé intact sous les poutres d’un relais incendié. Fuite des braises : Une esquive parfaite augmente la cadence de 15 % pendant trois secondes.",
      "meta": {
        "rarity": "uncommon",
        "act": 2,
        "passive": {
          "id": "ember-flight",
          "name": "Fuite des braises",
          "description": "Une esquive parfaite augmente la cadence de 15 % pendant trois secondes.",
          "trigger": "onPerfectDodge"
        },
        "unlock": {
          "type": "secret",
          "label": "Secret du relais incendié"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "03-hinezumi"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.3"
      ]
    },
    {
      "id": "04-shirogane",
      "family": "katana",
      "title": "Shirogane",
      "subtitle": "L’acier d’argent",
      "body": "Une lame de Mino sortie de son coffre lorsque les morts forcèrent le domaine. Fil immaculé : La fenêtre de parade parfaite est élargie de 18 %.",
      "meta": {
        "rarity": "epic",
        "act": null,
        "passive": {
          "id": "immaculate-edge",
          "name": "Fil immaculé",
          "description": "La fenêtre de parade parfaite est élargie de 18 %.",
          "trigger": "passive"
        },
        "unlock": {
          "type": "artisan",
          "label": "Forgeron Kaji — restauration"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "04-shirogane"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.4"
      ]
    },
    {
      "id": "05-yomibane",
      "family": "katana",
      "title": "Yomibane",
      "subtitle": "La plume de Yomi",
      "body": "Sabre funéraire des gardiens qui brûlaient les contaminés. Dernier souffle : Exécuter un infecté étourdi rend huit points de résolution.",
      "meta": {
        "rarity": "rare",
        "act": null,
        "passive": {
          "id": "last-breath",
          "name": "Dernier souffle",
          "description": "Exécuter un infecté étourdi rend huit points de résolution.",
          "trigger": "onExecution"
        },
        "unlock": {
          "type": "boss",
          "label": "Dépouille de la Miko Tsukikage"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "05-yomibane"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.5"
      ]
    },
    {
      "id": "06-kegare-kiri",
      "family": "katana",
      "title": "Kegare-kiri",
      "subtitle": "Le tranche-souillure",
      "body": "Une lame raccourcie et repolie après les premiers assauts. Outil d’éradication : Les cibles lourdes subissent 22 % de dégâts supplémentaires.",
      "meta": {
        "rarity": "uncommon",
        "act": null,
        "passive": {
          "id": "eradication-tool",
          "name": "Outil d’éradication",
          "description": "Les cibles lourdes subissent 22 % de dégâts supplémentaires.",
          "trigger": "onDamage"
        },
        "unlock": {
          "type": "contract",
          "label": "Contrat des fosses de quarantaine"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "06-kegare-kiri"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.6"
      ]
    },
    {
      "id": "07-takekaze",
      "family": "katana",
      "title": "Takekaze",
      "subtitle": "Le vent du bambou",
      "body": "Un sabre rural conçu pour être réparé loin des grandes forges. Souplesse du roseau : Le coût des attaques légères est réduit de 12 %.",
      "meta": {
        "rarity": "common",
        "act": 2,
        "passive": {
          "id": "reed-flexibility",
          "name": "Souplesse du roseau",
          "description": "Le coût des attaques légères est réduit de 12 %.",
          "trigger": "passive"
        },
        "unlock": {
          "type": "chapter",
          "label": "Sanctuaire du bambou brisé"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "07-takekaze"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.7"
      ]
    },
    {
      "id": "08-raijin-no-tsume",
      "family": "katana",
      "title": "Raijin no Tsume",
      "subtitle": "La griffe de Raijin",
      "body": "Une lame d’Echizen dont le hamon anguleux nourrit la légende. Brise-garde : Les attaques lourdes infligent 25 % de dégâts de posture supplémentaires.",
      "meta": {
        "rarity": "epic",
        "act": null,
        "passive": {
          "id": "guard-breaker",
          "name": "Brise-garde",
          "description": "Les attaques lourdes infligent 25 % de dégâts de posture supplémentaires.",
          "trigger": "onHeavyHit"
        },
        "unlock": {
          "type": "boss",
          "label": "Vaincre le Hatamoto Inazuma"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "08-raijin-no-tsume"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.8"
      ]
    },
    {
      "id": "09-akatsuki",
      "family": "katana",
      "title": "Akatsuki",
      "subtitle": "L’aube",
      "body": "Porté lors de la reprise d’une forteresse contaminée à l’aube. Premier rayon : Les dégâts augmentent de 15 % au-dessus de 80 % de santé.",
      "meta": {
        "rarity": "rare",
        "act": 3,
        "passive": {
          "id": "first-ray",
          "name": "Premier rayon",
          "description": "Les dégâts augmentent de 15 % au-dessus de 80 % de santé.",
          "trigger": "onDamage"
        },
        "unlock": {
          "type": "rank",
          "label": "Obtenir le rang A au chapitre 3"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "09-akatsuki"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.9"
      ]
    },
    {
      "id": "10-mujo",
      "family": "katana",
      "title": "Mujō",
      "subtitle": "L’impermanence",
      "body": "Un vieux sabre réparé, passé entre les mains de rōnin oubliés. Rien ne demeure : Sous 30 % de santé, une parade parfaite rend dix points de Ki.",
      "meta": {
        "rarity": "legendary",
        "act": null,
        "passive": {
          "id": "nothing-remains",
          "name": "Rien ne demeure",
          "description": "Sous 30 % de santé, une parade parfaite rend dix points de Ki.",
          "trigger": "onPerfectParry"
        },
        "unlock": {
          "type": "ngplus",
          "label": "Héritage du mode Nouvelle Partie +"
        }
      },
      "unlock": {
        "kind": "weapon",
        "ids": [
          "10-mujo"
        ]
      },
      "spoiler": {
        "beforeAct": null,
        "safeText": "Lame non identifiée."
      },
      "refs": [
        "LORE_BIBLE.md#10.10"
      ]
    },
    {
      "id": "forest-abandoned-camp",
      "family": "places",
      "title": "Camp abandonne des bucherons",
      "subtitle": "Acte I",
      "body": "Camp abandonne des bucherons — Purifier le camp abandonne (acte I).",
      "meta": {
        "act": 1,
        "areaId": "forest-abandoned-camp",
        "objective": {
          "id": "obj-forest-purify-camp",
          "type": "purify",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "forest-abandoned-camp"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "forest-kaido-trail",
      "family": "places",
      "title": "Forêt noyée de Kai",
      "subtitle": "Acte I",
      "body": "Forêt noyée de Kai — Suivre les traces de la patrouille du shogun (acte I).",
      "meta": {
        "act": 1,
        "areaId": "kai-forest-pass",
        "objective": {
          "id": "obj-forest-follow-traces",
          "type": "investigate",
          "sealReward": 0
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "forest-kaido-trail"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "forest-root-sanctuary",
      "family": "places",
      "title": "Sanctuaire des racines",
      "subtitle": "Acte I",
      "body": "Sanctuaire des racines — Abattre Take-Mori, gardien des racines (acte I).",
      "meta": {
        "act": 1,
        "areaId": "forest-root-sanctuary",
        "objective": {
          "id": "obj-forest-defeat-take-mori",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "giant-03-take-mori"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "forest-root-sanctuary"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "bamboo-hollow-path",
      "family": "places",
      "title": "Chemin des tiges creuses",
      "subtitle": "Acte II",
      "body": "Chemin des tiges creuses — Retrouver l'eclaireur de la patrouille (acte II).",
      "meta": {
        "act": 2,
        "areaId": "bamboo-hollow-path",
        "objective": {
          "id": "obj-bamboo-rescue-scout",
          "type": "rescue",
          "sealReward": 0
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "bamboo-hollow-path"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "bamboo-moon-clearing",
      "family": "places",
      "title": "Clairiere de la lune fendue",
      "subtitle": "Acte II",
      "body": "Clairiere de la lune fendue — Vaincre Kumo dans la clairiere (acte II).",
      "meta": {
        "act": 2,
        "areaId": "bamboo-moon-clearing",
        "objective": {
          "id": "obj-bamboo-defeat-kumo",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "boss-14-maitre-shinobi-kumo"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "bamboo-moon-clearing"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "bamboo-rain-gate",
      "family": "places",
      "title": "Bambouseraie de Shigure",
      "subtitle": "Acte II",
      "body": "Bambouseraie de Shigure — Rompre les sceaux poses sur les bambous (acte II).",
      "meta": {
        "act": 2,
        "areaId": "shigure-bamboo-grove",
        "objective": {
          "id": "obj-bamboo-cut-wards",
          "type": "destroy-nodes",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "bamboo-rain-gate"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "fields-burning-granary",
      "family": "places",
      "title": "Grenier de la moisson noire",
      "subtitle": "Acte III",
      "body": "Grenier de la moisson noire — Briser la carapace de Shiro-Kabuto (acte III).",
      "meta": {
        "act": 3,
        "areaId": "fields-burning-granary",
        "objective": {
          "id": "obj-fields-defeat-aka-ushi",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "giant-07-shiro-kabuto"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "fields-burning-granary"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "fields-drowned-paddies",
      "family": "places",
      "title": "Rizieres noyees",
      "subtitle": "Acte III",
      "body": "Rizieres noyees — Defendre les survivants des rizieres (acte III).",
      "meta": {
        "act": 3,
        "areaId": "fields-drowned-paddies",
        "objective": {
          "id": "obj-fields-defend-farmers",
          "type": "defense",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "fields-drowned-paddies"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "fields-mill-road",
      "family": "places",
      "title": "Route du moulin",
      "subtitle": "Acte III",
      "body": "Route du moulin — Detruire le moulin a spores (acte III).",
      "meta": {
        "act": 3,
        "areaId": "fields-mill-road",
        "objective": {
          "id": "obj-fields-break-spore-mill",
          "type": "purify",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "fields-mill-road"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "fields-west-dikes",
      "family": "places",
      "title": "Rizières de Tsuru",
      "subtitle": "Acte III",
      "body": "Rizières de Tsuru — Rouvrir les vannes d'irrigation (acte III).",
      "meta": {
        "act": 3,
        "areaId": "tsuru-rice-fields",
        "objective": {
          "id": "obj-fields-open-irrigation",
          "type": "world-state",
          "sealReward": 0
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "fields-west-dikes"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "city-canal-roofs",
      "family": "places",
      "title": "Marché oriental",
      "subtitle": "Acte IV",
      "body": "Marché oriental — Sonner la cloche d'incendie de Kurokawa (acte IV).",
      "meta": {
        "act": 4,
        "areaId": "kurokawa-market-east",
        "objective": {
          "id": "obj-city-ring-fire-bell",
          "type": "world-state",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "city-canal-roofs"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "city-castle-approach",
      "family": "places",
      "title": "Avenue fortifiee du chateau",
      "subtitle": "Acte IV",
      "body": "Avenue fortifiee du chateau — Vaincre le brigadier Engeki (acte IV).",
      "meta": {
        "act": 4,
        "areaId": "city-castle-approach",
        "objective": {
          "id": "obj-city-defeat-engeki",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "boss-11-brigadier-engeki"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "city-castle-approach"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "city-market-wards",
      "family": "places",
      "title": "Ruelle des puits",
      "subtitle": "Acte IV",
      "body": "Ruelle des puits — Ouvrir un refuge dans le quartier marchand (acte IV).",
      "meta": {
        "act": 4,
        "areaId": "kurokawa-back-street",
        "objective": {
          "id": "obj-city-open-refuge",
          "type": "refuge",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "city-market-wards"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "city-south-gate",
      "family": "places",
      "title": "Grande rue de Kurokawa",
      "subtitle": "Acte IV",
      "body": "Grande rue de Kurokawa — Franchir le cordon de quarantaine (acte IV).",
      "meta": {
        "act": 4,
        "areaId": "kurokawa-main-street",
        "objective": {
          "id": "obj-city-enter-quarantine",
          "type": "breach",
          "sealReward": 0
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "city-south-gate"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "castle-armory",
      "family": "places",
      "title": "Armurerie du clan Kurokawa",
      "subtitle": "Acte V",
      "body": "Armurerie du clan Kurokawa — Purifier l'armurerie du clan (acte V).",
      "meta": {
        "act": 5,
        "areaId": "castle-armory",
        "objective": {
          "id": "obj-castle-purify-armory",
          "type": "purify",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "castle-armory"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "castle-donjon-expansion",
      "family": "places",
      "title": "Donjon supérieur",
      "subtitle": "Acte V",
      "body": "Donjon supérieur — Abattre le daimyo corrompu (acte V).",
      "meta": {
        "act": 5,
        "areaId": "castle-donjon",
        "objective": {
          "id": "obj-castle-defeat-kanrei",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "06-daimyo-corrupted"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "castle-donjon-expansion"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "castle-lower-court-expansion",
      "family": "places",
      "title": "Cour basse du château",
      "subtitle": "Acte V",
      "body": "Cour basse du château — Briser le sceau de la garnison (acte V).",
      "meta": {
        "act": 5,
        "areaId": "castle-lower-court",
        "objective": {
          "id": "obj-castle-break-barracks-seal",
          "type": "destroy-nodes",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "castle-lower-court-expansion"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "castle-residence-expansion",
      "family": "places",
      "title": "Résidence du daimyō",
      "subtitle": "Acte V",
      "body": "Résidence du daimyō — Retrouver les registres du daimyo (acte V).",
      "meta": {
        "act": 5,
        "areaId": "castle-residence",
        "objective": {
          "id": "obj-castle-find-daimyo-records",
          "type": "investigate",
          "sealReward": 0
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "castle-residence-expansion"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "castle-yomi-rift",
      "family": "places",
      "title": "Faille du Yomi",
      "subtitle": "Acte V",
      "body": "Faille du Yomi — Detruire Yomi-no-Kanrei et stabiliser la faille (acte V).",
      "meta": {
        "act": 5,
        "areaId": "castle-yomi-rift",
        "objective": {
          "id": "obj-castle-stabilize-warp",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "giant-10-yomi-no-kanrei"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "castle-yomi-rift"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "modern-metropolitan-lab",
      "family": "places",
      "title": "Laboratoire metropolitain",
      "subtitle": "Acte VI",
      "body": "Laboratoire metropolitain — Abattre le colosse de la ligne Yomi (acte VI).",
      "meta": {
        "act": 6,
        "areaId": "modern-metropolitan-lab",
        "objective": {
          "id": "obj-modern-defeat-metro-colossus",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "new-modern-metro-colossus"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "modern-metropolitan-lab"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "modern-quarantine-hospital",
      "family": "places",
      "title": "Hopital de quarantaine",
      "subtitle": "Acte VI",
      "body": "Hopital de quarantaine — Securiser l'echantillon originel (acte VI).",
      "meta": {
        "act": 6,
        "areaId": "modern-quarantine-hospital",
        "objective": {
          "id": "obj-modern-secure-sample",
          "type": "retrieval",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "modern-quarantine-hospital"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "modern-shibuya-side-street",
      "family": "places",
      "title": "Tokyo contemporain — quarantaine Yomi",
      "subtitle": "Acte VI",
      "body": "Tokyo contemporain — quarantaine Yomi — Lire les archives d'urgence de Tokyo (acte VI).",
      "meta": {
        "act": 6,
        "areaId": "tokyo-contemporary-rift",
        "objective": {
          "id": "obj-modern-read-emergency-records",
          "type": "investigate",
          "sealReward": 0
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "modern-shibuya-side-street"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "modern-subway-station",
      "family": "places",
      "title": "Station de metro condamnee",
      "subtitle": "Acte VI",
      "body": "Station de metro condamnee — Retablir le courant de la station (acte VI).",
      "meta": {
        "act": 6,
        "areaId": "modern-subway-station",
        "objective": {
          "id": "obj-modern-restore-power",
          "type": "world-state",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "modern-subway-station"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "cyber-maglev-ruins",
      "family": "places",
      "title": "Ruines du maglev",
      "subtitle": "Acte VII",
      "body": "Ruines du maglev — Detruire les nids de drones (acte VII).",
      "meta": {
        "act": 7,
        "areaId": "cyber-maglev-ruins",
        "objective": {
          "id": "obj-cyber-destroy-drone-nests",
          "type": "destroy-nodes",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "cyber-maglev-ruins"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "cyber-neon-market",
      "family": "places",
      "title": "Marche aux neons",
      "subtitle": "Acte VII",
      "body": "Marche aux neons — Liberer les moines-memoires (acte VII).",
      "meta": {
        "act": 7,
        "areaId": "cyber-neon-market",
        "objective": {
          "id": "obj-cyber-free-memory-monks",
          "type": "rescue",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "cyber-neon-market"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "cyber-shogun-core",
      "family": "places",
      "title": "Coeur du Shogun Zero",
      "subtitle": "Acte VII",
      "body": "Coeur du Shogun Zero — Vaincre le Shogun Zero (acte VII).",
      "meta": {
        "act": 7,
        "areaId": "cyber-shogun-core",
        "objective": {
          "id": "obj-cyber-defeat-shogun-zero",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "new-cyber-shogun-zero"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "cyber-shogun-core"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "cyber-shrine-sector",
      "family": "places",
      "title": "Neo-Edo — secteur du Shōgun Zéro",
      "subtitle": "Acte VII",
      "body": "Neo-Edo — secteur du Shōgun Zéro — Calibrer la lame sur la frequence Yomi (acte VII).",
      "meta": {
        "act": 7,
        "areaId": "neo-edo-cyber-rift",
        "objective": {
          "id": "obj-cyber-calibrate-katana",
          "type": "upgrade",
          "sealReward": 1
        },
        "bossId": null
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "cyber-shrine-sector"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "cyber-yomi-datacenter",
      "family": "places",
      "title": "Centre de donnees Yomi",
      "subtitle": "Acte VII",
      "body": "Centre de donnees Yomi — Neutraliser le kannushi du reseau (acte VII).",
      "meta": {
        "act": 7,
        "areaId": "cyber-yomi-datacenter",
        "objective": {
          "id": "obj-cyber-defeat-hacker",
          "type": "boss",
          "sealReward": 1
        },
        "bossId": "new-cyber-yomi-hacker"
      },
      "unlock": {
        "kind": "zone",
        "ids": [
          "cyber-yomi-datacenter"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Lieu non reconnu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-01",
      "family": "seals",
      "title": "Sceau de l'acte I",
      "subtitle": "Acte I - La foret qui murmure",
      "body": "Acte I - La foret qui murmure. Brèches : purification du camp, mort de Take-Mori.",
      "meta": {
        "act": 1,
        "actId": "act-01-forest",
        "totalSeals": 2,
        "bossId": "giant-03-take-mori",
        "zoneIds": [
          "forest-kaido-trail",
          "forest-abandoned-camp",
          "forest-root-sanctuary"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 1,
        "ids": [
          "act-01-forest"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-02",
      "family": "seals",
      "title": "Sceau de l'acte II",
      "subtitle": "Acte II - Les lames de Shigure",
      "body": "Acte II - Les lames de Shigure. Brèches : sceaux de bambou rompus, mort de Kumo.",
      "meta": {
        "act": 2,
        "actId": "act-02-bamboo",
        "totalSeals": 2,
        "bossId": "boss-14-maitre-shinobi-kumo",
        "zoneIds": [
          "bamboo-rain-gate",
          "bamboo-hollow-path",
          "bamboo-moon-clearing"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 2,
        "ids": [
          "act-02-bamboo"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-03",
      "family": "seals",
      "title": "Sceau de l'acte III",
      "subtitle": "Acte III - La moisson noire",
      "body": "Acte III - La moisson noire. Brèches : survivants défendus, moulin à spores, carapace de Shiro-Kabuto.",
      "meta": {
        "act": 3,
        "actId": "act-03-fields",
        "totalSeals": 3,
        "bossId": "giant-07-shiro-kabuto",
        "zoneIds": [
          "fields-west-dikes",
          "fields-drowned-paddies",
          "fields-mill-road",
          "fields-burning-granary"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 3,
        "ids": [
          "act-03-fields"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-04",
      "family": "seals",
      "title": "Sceau de l'acte IV",
      "subtitle": "Acte IV - Kurokawa, ville des cendres",
      "body": "Acte IV - Kurokawa, ville des cendres. Brèches : refuge ouvert, cloche d'incendie, mort d'Engeki.",
      "meta": {
        "act": 4,
        "actId": "act-04-city",
        "totalSeals": 3,
        "bossId": "boss-11-brigadier-engeki",
        "zoneIds": [
          "city-south-gate",
          "city-market-wards",
          "city-canal-roofs",
          "city-castle-approach"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 4,
        "ids": [
          "act-04-city"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-05",
      "family": "seals",
      "title": "Sceau de l'acte V",
      "subtitle": "Acte V - Le trone du Yomi",
      "body": "Acte V - Le trone du Yomi. Brèches : sceau de la garnison, armurerie purifiée, daimyō, Kanrei.",
      "meta": {
        "act": 5,
        "actId": "act-05-castle",
        "totalSeals": 4,
        "bossId": "giant-10-yomi-no-kanrei",
        "zoneIds": [
          "castle-lower-court-expansion",
          "castle-residence-expansion",
          "castle-armory",
          "castle-donjon-expansion",
          "castle-yomi-rift"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 5,
        "ids": [
          "act-05-castle"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-06",
      "family": "seals",
      "title": "Sceau de l'acte VI",
      "subtitle": "Acte VI - Tokyo, annee zero",
      "body": "Acte VI - Tokyo, annee zero. Brèches : courant rétabli, échantillon sécurisé, colosse du métro.",
      "meta": {
        "act": 6,
        "actId": "act-06-contemporary",
        "totalSeals": 3,
        "bossId": "new-modern-metro-colossus",
        "zoneIds": [
          "modern-shibuya-side-street",
          "modern-subway-station",
          "modern-quarantine-hospital",
          "modern-metropolitan-lab"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 6,
        "ids": [
          "act-06-contemporary"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "act-seal-07",
      "family": "seals",
      "title": "Sceau de l'acte VII",
      "subtitle": "Acte VII - Les ombres de Neo-Edo",
      "body": "Acte VII - Les ombres de Neo-Edo. Brèches : lame calibrée, moines libérés, nids de drones, Kannushi, Shogun Zero.",
      "meta": {
        "act": 7,
        "actId": "act-07-cyberpunk",
        "totalSeals": 5,
        "bossId": "new-cyber-shogun-zero",
        "zoneIds": [
          "cyber-shrine-sector",
          "cyber-neon-market",
          "cyber-maglev-ruins",
          "cyber-yomi-datacenter",
          "cyber-shogun-core"
        ]
      },
      "unlock": {
        "kind": "act",
        "act": 7,
        "ids": [
          "act-07-cyberpunk"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-01",
      "family": "seals",
      "title": "Sceau du Camp",
      "subtitle": "Acte I",
      "body": "Sceau du Camp : purifier le camp des bûcherons. Sans lui, l'acte est « traversé », pas compris.",
      "meta": {
        "act": 1,
        "index": 1,
        "condition": "purifier le camp des bûcherons",
        "ifMissing": "l'acte est « traversé », pas compris"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "chronicle-01"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-02",
      "family": "seals",
      "title": "Sceau du Bambou",
      "subtitle": "Acte II",
      "body": "Sceau du Bambou : sauver l'éclaireur avant Kumo. Sans lui, Suzu n'arrive pas au refuge.",
      "meta": {
        "act": 2,
        "index": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "ifMissing": "Suzu n'arrive pas au refuge"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "chronicle-02"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-03",
      "family": "seals",
      "title": "Sceau de la Moisson",
      "subtitle": "Acte III",
      "body": "Sceau de la Moisson : défendre les survivants des rizières. Sans lui, les vivres manquent à l'acte IV.",
      "meta": {
        "act": 3,
        "index": 3,
        "condition": "défendre les survivants des rizières",
        "ifMissing": "les vivres manquent à l'acte IV"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-03",
        "ids": [
          "chronicle-03"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-04",
      "family": "seals",
      "title": "Sceau du Pin",
      "subtitle": "Acte IV",
      "body": "Sceau du Pin : ouvrir le refuge du quartier marchand. Sans lui, le hub reste une auberge.",
      "meta": {
        "act": 4,
        "index": 4,
        "condition": "ouvrir le refuge du quartier marchand",
        "ifMissing": "le hub reste une auberge"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-04",
        "ids": [
          "chronicle-04"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-05",
      "family": "seals",
      "title": "Sceau de la Faille",
      "subtitle": "Acte V",
      "body": "Sceau de la Faille : stabiliser la faille après Kanrei. Sans lui, la faille reste muette, pas fermée.",
      "meta": {
        "act": 5,
        "index": 5,
        "condition": "stabiliser la faille après Kanrei",
        "ifMissing": "la faille reste muette, pas fermée"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-05",
        "ids": [
          "chronicle-05"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-06",
      "family": "seals",
      "title": "Sceau de l'Archive",
      "subtitle": "Acte VI",
      "body": "Sceau de l'Archive : sécuriser l'échantillon originel. Sans lui, Rei doute de la chronologie.",
      "meta": {
        "act": 6,
        "index": 6,
        "condition": "sécuriser l'échantillon originel",
        "ifMissing": "Rei doute de la chronologie"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "chronicle-06"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "chronicle-07",
      "family": "seals",
      "title": "Sceau du Mandat",
      "subtitle": "Acte VII",
      "body": "Sceau du Mandat : détruire Shogun Zero. Sans lui, la fin « brèche » est inaccessible.",
      "meta": {
        "act": 7,
        "index": 7,
        "condition": "détruire Shogun Zero",
        "ifMissing": "la fin « brèche » est inaccessible"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "chronicle-07"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Sceau non obtenu."
      },
      "refs": [
        "LORE_BIBLE.md#12"
      ]
    },
    {
      "id": "C01",
      "family": "chronicle",
      "title": "Le col de Kai",
      "subtitle": "carnet de route d'Akio, encre encore humide.",
      "body": "Le col sent la résine et le fer mouillé. Trois jours de pluie ont gonflé la route, et la barrière du péage est ouverte : personne n'a pensé à la fermer, ou personne n'est resté pour le faire. Le registre des voyageurs est posé sur la planche, ouvert à la dernière page. La dernière ligne date de la nuit de la cloche. L'encre a bavé sur le nom.\n\nEn contrebas, la fumée de Kurokawa ne monte pas droit. Elle s'étale, grasse, comme si le feu n'avait pas trouvé assez d'air. J'ai compté les toits visibles depuis la crête : quarante-deux. J'en connais dix-huit par leur nom.\n\nJe n'ai pas signé le registre. Un nom sur une route de quarantaine est une promesse qu'on ne peut pas tenir. J'ai laissé une pièce sous la pierre, pour le péager, au cas où il reviendrait réclamer.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "entrer dans la zone forest-kaido-trail (acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C01"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C02",
      "family": "chronicle",
      "title": "La forêt noyée",
      "subtitle": "note clouée à un tronc par un bûcheron, écriture maladroite.",
      "body": "Si vous lisez ceci, ne coupez pas les racines du sanctuaire. On l'a fait, et l'eau est montée. Pas une crue : l'eau est montée comme si elle attendait qu'on ouvre. Le ruisseau a changé de lit trois fois en une semaine. Les bûcherons disent que la forêt se souvient de l'ancien cours.\n\nOn a laissé les outils debout, contre les troncs. Ce n'est pas de la superstition : c'est pour retrouver le chantier quand l'eau redescendra. Le contremaître a emporté les contrats, pas les hommes. Ne lui en veuillez pas trop : il avait neuf malades dans sa cabane et un fils à nourrir.\n\nLes racines du sanctuaire sont marquées d'un lien de paille. Ne le dénouez pas. Si le lien est défait quand vous arrivez, courez.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "atteindre le sanctuaire des racines (acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C02"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C03",
      "family": "chronicle",
      "title": "Le camp des bûcherons",
      "subtitle": "inventaire de camp tenu par le contremaître, à la mine de charbon.",
      "body": "Trente-quatre hommes au départ. Vingt-deux au dernier compte. Neuf malades isolés dans la cabane du fond, dont deux qui ne se lèvent plus. Le feu reste allumé jour et nuit : c'est la seule chose que nous savons faire qui marche. On fait bouillir l'eau. On brûle les vêtements des morts, pas les hommes.\n\nLes rations sont comptées : trois mesures de riz par jour et par homme, plus une pour les malades. Le sel est fini depuis six jours. La viande séchée est réservée à ceux qui portent l'eau. Personne ne discute : celui qui discute est celui qui n'a pas vu la cabane du fond.\n\nSi le camp est vide à votre arrivée, la cendre sur les poutres n'est pas celle d'un incendie. C'est celle qu'on a balayée pour la garder au sec.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "purifier le camp (forest-abandoned-camp, acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C03"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C04",
      "family": "chronicle",
      "title": "La bambouseraie de Shigure",
      "subtitle": "avis de garde cloué à la lisière, écrit par une main de gardienne.",
      "body": "Les tiges marquées d'un lien blanc sont sous sceau. Ne les coupez pas, ne les déplacez pas, ne les touchez pas avec une lame qui a servi sur un corps. Le lien blanc n'est pas une décoration : il tient un endroit qui n'a pas de nom et qui n'aime pas qu'on le nomme.\n\nLa gardienne passe chaque matin, à la première lumière. Elle compte les sceaux à voix haute, dans l'ordre. Si elle s'arrête au milieu d'un compte, éloignez-vous de la tige qu'elle regarde. Elle ne se trompe jamais sur les nombres, mais elle a déjà vu des choses qui n'étaient pas là.\n\nLe sentier des tiges creuses est plus court, et c'est un piège : il traverse l'ancienne bambouseraie coupée. Le bois y est encore en train de tomber, trente ans après.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "franchir la porte de pluie (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C04"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C05",
      "family": "chronicle",
      "title": "Les rizières de Tsuru",
      "subtitle": "page du registre de redevances de Tsuru, annotée au dos.",
      "body": "Redevance de la troisième saison, arrêtée au douzième jour : cent vingt mesures de riz, plus le quart pour le passage des convois. Les digues ouest ont été renforcées par corvée, onze hommes pendant quatre jours. Les vannes sont restées fermées pour ne pas laver les semis.\n\nAu dos, à la main, d'un autre jour : les vannes sont fermées et le niveau monte. Les paysans disent qu'on veut noyer les morts pour ne pas les compter. Trois familles ont quitté la rive est. Le meunier a fermé le moulin, ou le moulin s'est fermé tout seul.\n\nSi vous traversez la rizière noyée, longez les digues hautes. L'eau est tiède même quand il gèle, et ce n'est pas le soleil qui la chauffe.",
      "meta": {
        "era": 1638,
        "act": 3,
        "condition": "défendre les survivants des rizières",
        "trigger": "entrer dans les digues occidentales (acte III)",
        "sealName": "Sceau de la Moisson"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-03",
        "ids": [
          "C05"
        ]
      },
      "spoiler": {
        "beforeAct": 3,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C06",
      "family": "chronicle",
      "title": "Le Pin Noir",
      "subtitle": "livre de comptes de l'auberge, colonnes et marges.",
      "body": "Chambre une : deux voyageurs, payés d'avance, la nuit de la cloche. Chambre deux : trois porcelets et un sac de sel, oubliés. Chambre trois : vide, avec un fusil sous la paillasse — je l'ai laissé là, on ne fouille pas un homme qui paie.\n\nEn marge, à l'encre pâle : le pin est fendu de haut en bas, mais pas brûlé. La fente est propre, comme si la foudre avait demandé la permission. Je la nettoie chaque matin. Je ne sais pas qui l'a fait la nuit dernière, et je ne pose pas la question : le pin est plus vieux que l'auberge et plus discret que nous.\n\nRègle de la maison : on ne refuse personne de propre, on refuse tout le reste. Une chambre propre contre deux jours de travail. Pas de rançon, pas de dette sur un enfant.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "première visite du refuge (acte I–II)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C06"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C07",
      "family": "chronicle",
      "title": "Kurokawa",
      "subtitle": "rapport d'un yoriki du bakufu, encre noire, une rature.",
      "body": "Population avant la cloche : deux mille quatre cents âmes, plus les passants du relais. Dernier recensement : quatre cents, dont un tiers qui ne sortent plus. La porte sud est barrée par un cordon de cendre et de piques croisées. Le marché est fermé depuis le onzième jour. La cloche d'incendie fonctionne : on ne s'en sert plus.\n\nLes rues ouest tiennent encore debout. Les rues est se sont affaissées sur les caves : les maisons ont bu l'eau des canaux. Le canal est propre en surface, et c'est ce qui inquiète le plus les anciens.\n\nMention raturée : le seigneur n'a pas ouvert le donjon.\n\nLa corde de la cloche a été coupée net, pas usée. Le registre des morts n'a pas été ouvert : on compte à la craie, sur des ardoises, et la pluie a effacé la moitié des noms.",
      "meta": {
        "era": 1638,
        "act": 4,
        "condition": "ouvrir le refuge du quartier marchand",
        "trigger": "franchir la porte sud (acte IV)",
        "sealName": "Sceau du Pin"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-04",
        "ids": [
          "C07"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C08",
      "family": "chronicle",
      "title": "Le château du daimyō",
      "subtitle": "plan annoté par un charpentier du clan.",
      "body": "Basse-cour : deux portes, un pont de bois, un mur de pierre sèche qui s'effondre côté rivière. Résidence : trois salles, une galerie extérieure, un four à charbon sous l'office. Armurerie : au-dessus de la cour, sol de terre battue, charpente en cèdre — le seul bâtiment qui ne craigne pas le feu, ce qui ne laisse pas de me faire réfléchir.\n\nDonjon : quatre niveaux, escalier unique, fenêtres fermées depuis l'hiver. Le seigneur a fait poser les volets de l'intérieur. Je n'ai pas vu qui a payé les gonds neufs.\n\nÀ l'encre, en bas du plan : les marches intérieures sont décalées d'une demi- main. Ce n'est pas du mauvais travail, c'est du travail pressé. Faites attention en montant, on y a déjà laissé deux chevilles.",
      "meta": {
        "era": 1638,
        "act": 5,
        "condition": "stabiliser la faille après Kanrei",
        "trigger": "entrer dans la basse-cour (acte V)",
        "sealName": "Sceau de la Faille"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-05",
        "ids": [
          "C08"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C09",
      "family": "chronicle",
      "title": "L'Ordre de l'Ombre",
      "subtitle": "note interne du secrétaire du shogun, non signée.",
      "body": "L'Ordre n'existe pas. Il n'a ni sceau propre, ni registre, ni caserne. Il se compose d'un nom, d'un commanditaire et d'une méthode. Si l'homme parle, l'Ordre n'existe pas. Si l'homme meurt, l'Ordre n'a jamais existé.\n\nMéthode : entrer seul, purifier sans prêtre, rendre compte à un seul secrétaire. Pas de troupe, pas de proclamation, pas de soin aux contaminés dans les villages de passage. Une armée aurait offert mille corps à la maladie ; un homme seul n'en offre qu'un.\n\nNe pas écrire le nom dans les minutes. Ne pas le prononcer devant les religieux. Le bruit d'un Ordre suffit à faire renaître l'ordre qu'on tue.\n\nLe secrétaire qui écrit ces lignes ne connaît pas le nom de l'homme. Il l'a entendu une fois, à la troisième veille, et il l'a oublié exprès : c'est plus sûr pour tout le monde.",
      "meta": {
        "era": 1638,
        "act": 0,
        "condition": "terminer le prologue",
        "trigger": "après le prologue, première entrée de l'édit scellé",
        "sealName": null
      },
      "unlock": {
        "kind": "prologue",
        "ids": [
          "C09"
        ]
      },
      "spoiler": {
        "beforeAct": 0,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C10",
      "family": "chronicle",
      "title": "La garde du bakufu",
      "subtitle": "ordre du jour d'un yoriki, affiché à la caserne.",
      "body": "Consigne du jour : tenir la porte sud, ne pas la tenir fermée. Deux vedettes sur la tour, une au pont, deux en réserve. Rations : une mesure de riz, un hachi de sel. Les malades ne montent pas la garde.\n\nRappel des ordres reçus : on ne tire pas le premier. On ne détruit pas une maison sans ordre écrit. On ne refuse pas un enfant qui demande un médecin, même si le médecin est mort.\n\nNote du chef : la troupe a changé de visage pendant la nuit. J'ai recensé trente-deux hommes ce matin, dont onze qui ne répondent pas à l'appel par leur nom. Je ne les ai pas inscrits absents. Je ne suis pas sûr qu'ils le soient.\n\nLes hommes qui ne répondent pas à l'appel gardent leur paquetage au clou. Personne n'a encore osé décrocher un fusil, ni rendre son nom à l'appel.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "premier ashigaru revenant vaincu (acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C10"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C11",
      "family": "chronicle",
      "title": "La levée de pompiers",
      "subtitle": "extrait du manuel de la levée, annoté à la poche.",
      "body": "Un incendie bien conduit vaut une garnison. On coupe la maison de l'ouest pour sauver la rue ; on coupe la rue pour sauver le quartier. Les crocs arrachent les toits, les seaux mouillent les murs voisins, la paille humide étouffe le plancher.\n\nÀ retenir : personne n'entre dans une maison fermée sans un ordre écrit. Un propriétaire qui refuse de sortir ne doit pas être tiré par le col : il porte ses papiers, ses comptes, l'argent de ses obsèques. On lui donne un jour.\n\nEn marge, une autre main : le jour a été donné, puis retiré. Les quartiers coupés ont été comptés par maisons et non par âmes. Le registre de réquisition mentionne deux maisons et quarante vies, ce qui ne s'ajoute pas, même en fermant les yeux.",
      "meta": {
        "era": 1638,
        "act": 4,
        "condition": "ouvrir le refuge du quartier marchand",
        "trigger": "vaincre Engeki (acte IV)",
        "sealName": "Sceau du Pin"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-04",
        "ids": [
          "C11"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C12",
      "family": "chronicle",
      "title": "Le relais de Kōshū",
      "subtitle": "page arrachée du registre des voyageurs, brûlure sur le bord.",
      "body": "Voyageurs entrés le quatorzième jour : un marchand de sel de Mino, sa servante, deux porteurs ; un pèlerin malade et son frère ; une femme de Kurokawa venue chercher un médecin. Sortis : aucun, à l'exception du marchand, dont la ligne a été barrée de la main de l'aubergiste.\n\nLes quatorze et quinze se confondent : l'encre a pris l'eau. Le seizième jour, le relais a fermé tôt. Le dix-septième au soir, la cloche de Kurokawa a sonné. Le relais n'a rien noté, ce qui est déjà une réponse.\n\nSous la poutre qui a résisté, on a retrouvé le registre au sec. C'est là que je l'ai trouvé, entre deux poutres noires. Le feu n'a pas mangé cette page : il a mangé le reste.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "trouver le relais incendié (acte II, secret)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C12"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C13",
      "family": "chronicle",
      "title": "Les veilleurs du Pin Noir",
      "subtitle": "règle de la maison, affichée dans la cour, sans signature.",
      "body": "Un : on n'abrite que ceux qui sont propres. Pas par dureté ; parce qu'un malade abrité contamine ceux qui restent debout, et nous avons besoin de ceux qui restent debout.\n\nDeux : tout entrant est inscrit au registre de cendre, avec la date, le nom s'il en a un, et ce qu'il porte. Tout sortant aussi. Ce n'est pas une méfiance, c'est un compte.\n\nTrois : aucun combat dans la cour. On laisse les armes à la porte, y compris les courtes, y compris les barbes de la hache.\n\nQuatre : on ne coupe pas le pin. On ne gratte pas la fente, on ne la nettoye pas avec du vinaigre, on ne la couvre pas. Il est là avant nous.\n\nCinq : on note la date du départ, jamais celle du retour. Un retour ne se date pas, et une maison qui compte ses revenants finit par ne plus compter que ça.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "installation de Masanori au refuge (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C13"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C14",
      "family": "chronicle",
      "title": "Le sanctuaire laïque",
      "subtitle": "note de la veilleuse, encre pâle.",
      "body": "Je ne suis ni prêtresse ni miko. Je tiens le sanctuaire parce qu'il tient debout et que personne n'en voulait. Je n'ai prononcé aucun vœu, ce qui ne m'empêche pas de faire les gestes : le bol, l'eau, l'ofuda écrit à la main avant l'aube, le sel aux deux coins.\n\nSur la planche, j'ai gravé ce qu'on m'a appris et qu'aucun desservant ne dira jamais tout haut : purifier un lieu ne guérit personne. On peut nettoyer une cour et laisser les malades dans la maison. On peut sauver une maison et laisser la cour. Personne n'a le droit de promettre les trois.\n\nJe brûle l'ofuda usé, je garde la cendre dans un bol, et je ne la donne à personne : c'est la seule chose ici qui ait de la valeur et qu'on ne puisse pas voler.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "débloquer le sanctuaire des sceaux (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C14"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C15",
      "family": "chronicle",
      "title": "Akio Kageyama",
      "subtitle": "fiche de service du bakufu, deux feuillets attachés.",
      "body": "Né à Tsuru, fils d'un contrôleur de digues. Engagé comme page à quatorze ans, service d'escorte à dix-huit, route de Kōshū à vingt-deux. Ne boit pas, ne joue pas, ne parle pas de sa sœur.\n\nSa sœur est morte dans le premier foyer, avec son mari et un enfant. Le dossier ne dit pas comment. La fiche non plus.\n\nMission en cours : ordre scellé, à seule fin de reconnaître la route de Kai, l'entrée du village de Kurokawa et l'état de la garnison. Autorisation de détruire les foyers contaminés par le feu. Interdiction de prendre une troupe, de se présenter comme officier, de consigner un ordre reçu. Autorisation de ne laisser personne vivre qui soit déjà mort.\n\nLa dernière ligne de la fiche est ajoutée d'une main plus ferme : l'homme ne doit pas revenir avant d'avoir vu ce qu'il y a sous le donjon.",
      "meta": {
        "era": 1638,
        "act": 0,
        "condition": "terminer le prologue",
        "trigger": "après le prologue",
        "sealName": null
      },
      "unlock": {
        "kind": "prologue",
        "ids": [
          "C15"
        ]
      },
      "spoiler": {
        "beforeAct": 0,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C16",
      "family": "chronicle",
      "title": "Tokugawa Iemitsu (fiction)",
      "subtitle": "minute de la troisième veille, papier non signé, cachet brisé.",
      "body": "Présents : le shogun, deux conseillers, un secrétaire. Objet : les rapports de Kai. Lecture faite des trois lettres : la cloche, la garnison, le seigneur qui ne répond plus.\n\nDécision : aucune troupe. Une armée offrirait mille corps à la maladie et donnerait à Edo l'air d'avoir peur. Un seul homme, sans escorte, sans proclamation, avec un ordre scellé qu'il ne montrera pas.\n\nLe secrétaire a demandé ce qu'il fallait faire des malades. Le shogun n'a pas répondu tout de suite. Il a dit ensuite : « N'épargnez que les vivants. » Personne n'a demandé à qui l'ordre s'adressait.\n\nMention en bas de page, d'une autre encre : l'homme choisi n'est pas un officier. Il a une sœur enterrée à Tsuru. On ne l'a pas choisi pour ça, mais on ne l'a pas écarté pour ça non plus.",
      "meta": {
        "era": 1638,
        "act": 0,
        "condition": "terminer le prologue",
        "trigger": "terminer le prologue (plan 4, « L'ordre du shogun »)",
        "sealName": null
      },
      "unlock": {
        "kind": "prologue",
        "ids": [
          "C16"
        ]
      },
      "spoiler": {
        "beforeAct": 0,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C17",
      "family": "chronicle",
      "title": "Kurokawa Suketada",
      "subtitle": "inventaire de dettes tenu par un clerc du clan.",
      "body": "État des obligations du seigneur de Kurokawa, arrêté à la troisième lune : quatre cents ryō dus aux marchands de Kōfu, deux cent dix au temple de Kurotaki, une rente viagère à la veuve d'un intendant. Recettes : le riz de Tsuru, le bois, le passage du relais. Le compte ne se ferme pas.\n\nPoste particulier, à la main du clerc : frais de sépulture des morts de la première fièvre, non engagés. Les corps ont été déposés sous le donjon, dans les caves basses, en attendant une décision. La décision n'est pas venue.\n\nLe seigneur a fait demander si une sépulture collective coûterait moins. On lui a répondu que oui, à condition de ne pas nommer les morts. Il a répondu que les noms coûtaient trop cher. La réponse est écrite ici, de sa main.",
      "meta": {
        "era": 1638,
        "act": 5,
        "condition": "stabiliser la faille après Kanrei",
        "trigger": "retrouver les registres du daimyō (acte V)",
        "sealName": "Sceau de la Faille"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-05",
        "ids": [
          "C17"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C18",
      "family": "chronicle",
      "title": "Engeki",
      "subtitle": "carnet de réquisition de la levée de pompiers, signé à chaque page.",
      "body": "Jour quatorze : coupé la maison de l'ouest, rue du canal. Deux maisons, quarante vies. Le compte des âmes est estimé, non vérifié. Signé Engeki.\n\nJour quinze : réquisition de vingt-deux hommes pour la levée. Refus de trois familles. Les trois familles ont été inscrites comme contaminées, ce qui les dispense de service et les prive de ration. Signé Engeki.\n\nJour seize : demande de renfort au bakufu, sans réponse. Demande de prêtres, sans réponse. Le seigneur fait savoir que la ville tient. Signé Engeki, avec un trait plus appuyé que les autres.\n\nJour dix-sept : la cloche. Nous n'avons pas sonné : nous n'avions plus assez d'hommes pour tenir la corde. Signé Engeki.\n\nJour dix-huit : rien. Le carnet s'arrête là, non par manque d'encre, mais parce que la main qui écrivait ne tenait plus la plume.",
      "meta": {
        "era": 1638,
        "act": 4,
        "condition": "ouvrir le refuge du quartier marchand",
        "trigger": "vaincre Engeki (acte IV)",
        "sealName": "Sceau du Pin"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-04",
        "ids": [
          "C18"
        ]
      },
      "spoiler": {
        "beforeAct": 4,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C19",
      "family": "chronicle",
      "title": "Kumo",
      "subtitle": "bordereau de passage, une feuille pliée en quatre.",
      "body": "Passages sous les remparts, par la bambouseraie. Tarif par tête, payé d'avance, sans nom de famille. Enfants : demi-tarif jusqu'à douze ans. Nourrices et porteurs : prix double, ils ralentissent.\n\nListe des acquéreurs, par ordre de date : un marchand de sel, deux fonctionnaires du relais, une famille de Tsuru, puis plus rien pendant trois jours. Le nom suivant a été gratté au couteau. Sous la gratture, on lit encore : « la gardienne ». Aucun remboursement n'est prévu, y compris en cas de mort en route.\n\nNote du vendeur, en bas : le prix monte quand la brume tombe. Le prix est donc monté chaque nuit. Les passages ne sont plus vendus depuis que la gardienne a cessé de compter les sceaux.\n\nLe vendeur note aussi les heures : la brume tombe après la troisième veille, ce qui laisse aux familles le temps de payer, ou de renoncer sans bruit.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "vaincre Kumo (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C19"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C20",
      "family": "chronicle",
      "title": "Shigure",
      "subtitle": "dernière page du carnet de garde de la bambouseraie.",
      "body": "Compte des sceaux, matin du quinzième jour : trente et un, tous tenus. Le trente-deuxième a été retrouvé défait. Je l'ai refait deux fois. La deuxième fois, il a tenu jusqu'au soir.\n\nLes hommes de Kumo sont passés par la tige creuse, ce qui ne devrait pas être possible sans défaire les liens. Ils n'ont pas coupé. Ils ont défait, proprement, comme des gens qui savent ce qu'ils font.\n\nSi mon masque est retrouvé fendu, ne le réparez pas. Il est fendu parce qu'il a fait son travail : un masque se fend quand il arrête quelque chose qui ne voulait pas s'arrêter. Posez-le sur l'autel du refuge et ne le portez pas. Je ne le porterai plus.\n\nLe carnet est mouillé sur la dernière page. Ce n'est pas la pluie : la bambouseraie ne laisse pas passer la pluie, elle la boit.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "ramasser le masque fendu (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C20"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C21",
      "family": "chronicle",
      "title": "Chiyo",
      "subtitle": "première page du registre de cendre.",
      "body": "J'ouvre ce registre parce qu'on m'a demandé qui était entré, qui était sorti et qui était revenu. Je ne sais pas lire les trois colonnes sans mentir : personne ne revient vraiment.\n\nColonne une : nom, ou ce qu'on en sait. Colonne deux : ce qu'il porte. Colonne trois : ce qu'on a fait pour lui. Colonne quatre : ce qu'il est devenu. Je tiens la quatre à l'encre pâle, pour pouvoir la corriger.\n\nCe que j'ai appris depuis la cloche : la fièvre prend neuf jours ; le septième, on croit guérir ; le neuvième, on ne croit plus rien. L'eau bouillie vaut mieux que les prières. Le feu sauve une rue et condamne une maison.\n\nJe soigne. Je ne promets pas.\n\nJe n'écris pas les âges : ils changent trop vite ici, et un âge faux est pire qu'une case vide.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "première utilisation de l'infirmerie (acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C21"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C22",
      "family": "chronicle",
      "title": "Masanori",
      "subtitle": "commande de forge, écrite au crayon gras sur une planche.",
      "body": "Une lame ne se raconte pas. Elle se pèse, se chauffe, se plie. Si vous me demandez de reforger un sabre sans me dire ce qu'il a fait, je vous rendrai un morceau de fer propre et vous n'aurez rien.\n\nJe prends le tamahagane, je le trie, je le plie. Deux jours pour une lame courte, six pour une longue, et je ne travaille pas quand il pleut : la forge se noie plus facilement qu'un homme.\n\nPrix : le métal d'abord, l'argent ensuite. Si vous n'avez pas de métal, apportez une pièce de boss, une plaque, un joug, une carapace. Je ne fais pas de lame avec les morts ; je fais des lames avec ce que les morts ont porté.\n\nEt je ne réponds pas aux questions sur Kaji. Il travaille de l'autre côté de la rue, et nos lames ne se parlent pas.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "ouverture de la forge au refuge (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C22"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C23",
      "family": "chronicle",
      "title": "Kurokage",
      "subtitle": "inventaire du magasin du bakufu, ligne unique.",
      "body": "Lame longue, sans signature, fourreau noir sans monture. Entrée au magasin il y a trois ans, provenance : messager du bakufu décédé en route. Aucun héritier déclaré. La lame a été répertoriée comme « pièce de service », ce qui permet de la confier à un homme sans lui en donner la propriété.\n\nObservation de l'armurier : lame équilibrée, hamon discret, poignée remontée deux fois. Le messager l'a portée trois ans sans dégainer, ce qui n'est pas un défaut : c'est le métier.\n\nMention ajoutée à l'encre fraîche : remise à Akio Kageyama sur ordre verbal. Ne pas inscrire le motif. L'homme qui la porte ne doit pas croire qu'elle est à lui.\n\nLe fourreau porte une marque de relais, presque effacée : le messager posait la lame sur la planche du péage, toujours du même côté.",
      "meta": {
        "era": 1638,
        "act": 0,
        "condition": "terminer le prologue",
        "trigger": "après le prologue (arme de départ)",
        "sealName": null
      },
      "unlock": {
        "kind": "prologue",
        "ids": [
          "C23"
        ]
      },
      "spoiler": {
        "beforeAct": 0,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C24",
      "family": "chronicle",
      "title": "Takekaze",
      "subtitle": "note attachée au fourreau, écriture de gardienne.",
      "body": "Ce sabre est rural, réparé trois fois, et il coupe encore. Je l'ai fait faire par un forgeron de passage qui ne savait pas lire et qui travaillait mieux que ceux qui savaient.\n\nIl ne sert pas contre les hommes. Il sert contre les sceaux : une lame commune glisse sur un lien tenu, une lame rurale le coupe net, parce qu'elle est plus souple et qu'elle pardonne moins.\n\nSi vous le prenez, laissez le fourreau. Le fourreau est à la bambouseraie. Si vous le rendez un jour, le fourreau sera encore là, et le sabre saura qu'il est revenu.\n\nLe bois du fourreau est plus vieux que la lame. C'est normal : on change la lame, jamais l'étui, quand on n'a pas les moyens de changer les deux.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "secret du sanctuaire du bambou brisé (acte II)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C24"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C25",
      "family": "chronicle",
      "title": "Le masque fendu",
      "subtitle": "instruction du faiseur de masques, copiée par un desservant.",
      "body": "On ne fend pas un masque de gardienne : il se fend. Le bois travaille quand ce qu'il arrête pousse plus fort que lui. Une fente franche est un bon signe ; une fente qui revient sur elle-même ne l'est pas.\n\nUn masque de gardienne se pose, ne se porte pas. On le met sur l'autel, face en bas, pour que la fente ne regarde pas la porte. On ne le nettoie pas avec de l'eau bénite : elle le fait blanchir et il perd son odeur.\n\nSi le masque est retrouvé loin du corps de sa gardienne, c'est qu'elle l'a retiré elle-même. Cela se fait quand on n'a plus assez de mains pour tenir le bois et la lame.\n\nUne fente se lit comme une écriture : de haut en bas, elle protège ; en travers, elle avertit ; en étoile, elle dit de laisser le masque où il est.",
      "meta": {
        "era": 1638,
        "act": 2,
        "condition": "sauver l'éclaireur avant Kumo",
        "trigger": "ramasser le masque (acte II, clairière)",
        "sealName": "Sceau du Bambou"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-02",
        "ids": [
          "C25"
        ]
      },
      "spoiler": {
        "beforeAct": 2,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C26",
      "family": "chronicle",
      "title": "Le registre de cendre",
      "subtitle": "page de compte du Pin Noir, quatre colonnes.",
      "body": "Colonne une : entrés ce jour, onze. Colonne deux : sortis, quatre. Colonne trois : revenus, un — le porteur de kago, qui avait laissé son frère dans la rizière et qui est allé le chercher.\n\nColonne quatre : ce qu'on a fait. On a donné de l'eau bouillie, une couverture propre, une place près du feu. On a refusé deux hommes qui toussaient. On a gardé leur nom, pour le jour où ils reviendront ou pour celui où ils ne reviendront pas.\n\nNote en bas : le compte des revenus est faux. Un homme qui revient n'est pas le même que celui qui est parti. Je le note quand même, parce que le registre n'a pas de colonne pour ce qu'on devient.\n\nOn ne marque pas les morts dans ce registre. Il y a un autre livre pour ça, et il est plus mince.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "premier repos au refuge (acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C26"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C27",
      "family": "chronicle",
      "title": "L'édit scellé",
      "subtitle": "transcription de l'édit, faite pour la bibliothèque du Chapitre.",
      "body": "Transcription d'un ordre scellé, original non conservé. Le sceau a été brisé à la remise, selon l'usage.\n\nTexte : « À l'homme qui portera ceci. Reconnaître la route, l'entrée du village et l'état de la garnison. Détruire les foyers par le feu. Ne pas prendre de troupe. Ne pas se nommer officier. Ne pas consigner l'ordre reçu. N'épargner que les vivants. »\n\nNote du secrétaire : l'ordre ne porte pas de numéro. Un ordre sans numéro n'existe pas dans les minutes, ce qui est le but. Si l'homme le montre, l'ordre perd sa valeur et l'homme perd sa protection.\n\nLe sceau brisé a été conservé dans une enveloppe de papier, avec la date. Une enveloppe vide et scellée vaut mieux qu'un ordre sans preuve : c'est ce que le Chapitre appelle une archive honnête.",
      "meta": {
        "era": 1638,
        "act": 0,
        "condition": "terminer le prologue",
        "trigger": "prologue, après la scène du serment",
        "sealName": null
      },
      "unlock": {
        "kind": "prologue",
        "ids": [
          "C27"
        ]
      },
      "spoiler": {
        "beforeAct": 0,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C28",
      "family": "chronicle",
      "title": "Rapport de la dernière cloche",
      "subtitle": "rapport du chef de relais au bakufu, copie au carbone.",
      "body": "À l'attention du magistrat de Kōfu. La cloche d'incendie de Kurokawa a sonné à la troisième veille, sans incendie visible. Douze morts dans la nuit, dont trois dans la maison du sonneur. Le sonneur n'est pas parmi les morts.\n\nDemandes : instructions, médecin, prêtres, et autorisation de fermer la route de Kōshū. Aucune réponse reçue à ce jour. La garnison a reçu l'ordre de tenir la porte sud et de ne pas tirer la première.\n\nObservation personnelle : les bêtes de somme refusent d'entrer dans la rue du canal depuis la cloche. Les hommes n'ont pas ce luxe.\n\nLe relais a envoyé trois copies : deux par le nord, une par le sud. La copie du sud est la seule qui soit arrivée, et elle est arrivée ici, entre mes mains.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "objectif « suivre les traces » (acte I)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C28"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C29",
      "family": "chronicle",
      "title": "Registre des réquisitions",
      "subtitle": "page arrachée, écriture de la levée, taches de suie.",
      "body": "Réquisition du quinzième jour : vingt-deux hommes, quatre charrettes, six crocs, deux échelles. Réquisition du seizième : dix hommes, une charrette, plus de crocs — les crocs ont été laissés dans la rue coupée.\n\nCompte des maisons coupées : deux. Compte des vies : quarante. Vérification faite par le secrétaire de la levée : les deux nombres ne correspondent pas aux registres de population, qui donnaient vingt-huit âmes pour ces deux maisons. Il manque douze vies, ou il y a douze visiteurs.\n\nEn marge, une main plus ferme : ne pas corriger le compte. Le compte est ce qui a été décidé, pas ce qui a été trouvé.\n\nLe registre porte une tache sombre sur la dernière page. Le secrétaire de la levée écrit que c'est de l'encre renversée. L'encre ne brûle pas le papier.",
      "meta": {
        "era": 1638,
        "act": 5,
        "condition": "stabiliser la faille après Kanrei",
        "trigger": "ramasser le registre après Engeki (acte V)",
        "sealName": "Sceau de la Faille"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-05",
        "ids": [
          "C29"
        ]
      },
      "spoiler": {
        "beforeAct": 5,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C30",
      "family": "chronicle",
      "title": "Lettre de Tsuru",
      "subtitle": "lettre d'une femme de Tsuru à son frère, pliée en quatre, jamais",
      "body": "Frère, l'eau monte et les hommes du seigneur ont fermé les vannes pour garder les semis. Je t'écris parce que la petite a la fièvre depuis trois jours et que le médecin de Tsuru est parti à Kurokawa chercher des remèdes. Il n'est pas revenu, et sa femme ne parle plus.\n\nSi tu peux venir, viens avant la moisson. Ne prends pas la route basse : elle est coupée par la rizière noyée, et ce qui marche dans l'eau n'a pas besoin de respirer.\n\nJe garde ta part de riz dans le coffre, avec le sel. Si je ne t'écris plus, ce n'est pas que j'ai oublié.\n\nLa lettre n'a pas de cachet. Elle a été pliée et repliée jusqu'à ce que le papier devienne doux, comme si on l'avait relue en cachette plus d'une fois.",
      "meta": {
        "era": 1638,
        "act": 1,
        "condition": "purifier le camp des bûcherons",
        "trigger": "fouiller le camp des bûcherons (acte I, secret)",
        "sealName": "Sceau du Camp"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-01",
        "ids": [
          "C30"
        ]
      },
      "spoiler": {
        "beforeAct": 1,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C31",
      "family": "chronicle",
      "title": "Shibuya",
      "subtitle": "carnet de route d'Akio, écrit debout sous un auvent.",
      "body": "La rue est mouillée sans qu'il ait plu. Les écrans au-dessus des magasins montrent une file d'attente qui n'existe pas : des gens patients, numérotés, qui avancent d'un pas toutes les dix secondes. Personne ne regarde.\n\nLes affiches sont toutes la même : un fond blanc, un numéro vert, la date du 17 juin. Aucune année. En bas de la troisième, quelqu'un a écrit au marqueur : « ils comptaient encore hier ».\n\nJe note l'heure : trois heures douze. C'est la seule chose ici qui ne mente pas encore. Le reste est une administration qui a appris à faire semblant d'être une ville.\n\nLes geta d'un passant sont posés à l'envers devant une porte close. Je note la pointure. C'est une pointure d'enfant, et la porte est fermée depuis plus longtemps que la pluie.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "entrer dans modern-shibuya-side-street (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C31"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C32",
      "family": "chronicle",
      "title": "La station condamnée",
      "subtitle": "avis de fermeture de la préfecture, plastifié, encore lisible.",
      "body": "Station fermée au public pour travaux de mise aux normes. Réouverture prévue au printemps. Puis, en surimpression, un second avis : réquisition sanitaire, accès réservé aux agents, aucune date de fin.\n\nLes grilles ont été soudées sur place, pas livrées soudées : les points de soudure sont irréguliers, faits à la main, en plusieurs fois.\n\nLa ventilation tourne toujours. C'est écrit noir sur blanc dans le registre de maintenance : « ne pas couper, risque de condensation ». Personne n'a ajouté de ligne depuis la réquisition.\n\nUn agent a coché « conforme » à chaque visite. La dernière case est datée du 18 juin et signée d'une initiale qui ne correspond à personne sur la liste du personnel.\n\nLa clef est introuvable, et la serrure a été changée deux fois : la première fois par la préfecture, la seconde par personne.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "entrer dans modern-subway-station (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C32"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C33",
      "family": "chronicle",
      "title": "L'hôpital de quarantaine",
      "subtitle": "plan d'évacuation annoté par une infirmière, stylo bleu.",
      "body": "Ailes A, B, C. Pression négative en A et B. La C n'a jamais été branchée : les gaines sont dehors, sous bâche.\n\nChambre 12 : ne pas ouvrir sans masque. Chambre 12, deuxième annotation, plus tard : ne pas ouvrir. La troisième est un trait, comme si la main avait renoncé au milieu du mot.\n\nLes flèches d'évacuation ont été refaites dans l'autre sens. On sort par le hall, mais le hall mène au cordon, et le cordon ne laisse pas sortir. J'ai entouré le mot « sortie » et j'ai écrit à côté : « demander ».\n\nEn bas de page, à l'encre : « Si vous lisez ce plan, c'est que vous êtes entré. Il n'y a pas de plan pour ressortir. »\n\nLe nom de l'infirmière est effacé au crayon, pas à l'encre. On efface au crayon ce qu'on espère reprendre.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "entrer dans modern-quarantine-hospital (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C33"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C34",
      "family": "chronicle",
      "title": "Le laboratoire métropolitain",
      "subtitle": "bon de commande de matériel, tamponné « urgent ».",
      "body": "Quatre cents flacons de prélèvement, deux mille gants, six cents sacs d'incinération, vingt litres de désinfectant. Livraison demandée pour le 16 juin, avant midi, quai arrière.\n\nMention manuscrite du magasinier : « stock de sacs insuffisant pour la semaine. Relance faite. Réponse : priorité nationale. »\n\nDeuxième mention, autre écriture : « Les flacons sont arrivés vides. Le bon dit pleins. Je ne signe pas. » La signature manque, en effet.\n\nLe bon est agrafé à une facture payée le 17 juin à 05 h 40, soit une heure après la clôture du dossier. La comptabilité n'a jamais demandé pourquoi. C'est le genre de détail qu'une administration appelle « régularisation » et qu'un enquêteur appelle « preuve ».\n\nLe quai arrière donne sur une rue barrée depuis le 12. Le livreur a signé quand même, à l'heure demandée.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "entrer dans modern-metropolitan-lab (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C34"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C35",
      "family": "chronicle",
      "title": "Le cordon sanitaire",
      "subtitle": "consigne affichée aux agents, format poche.",
      "body": "Un agent ne franchit pas le cordon. Il le tient.\n\nToute personne qui sort est reconduite à l'intérieur, sans contact physique. Toute personne qui insiste est signalée, pas maîtrisée. Le ruban ne se contourne pas : il se remplace, par un autre agent, au même endroit.\n\nNe pas répondre aux questions sur la durée. Ne pas confirmer de décès. Ne pas prononcer le nom du syndrome devant un riverain.\n\nEn cas de mouvement de foule : reculer d'un pas, garder le ruban tendu, appeler. Le recul d'un pas est la seule manœuvre autorisée et la seule qui n'a jamais échoué.\n\nNote au dos, au crayon : « Le ruban a été coupé deux fois cette semaine. Pas par la foule. Par des gens qui avaient un badge. »",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "franchir le ruban du cordon (acte VI, entrée de zone)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C35"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C36",
      "family": "chronicle",
      "title": "La rame du terminus",
      "subtitle": "rapport de maintenance, deux pages, la seconde tachée.",
      "body": "Rame immobilisée au quai 2, frein de stationnement engagé, clef absente. Le courant est revenu à 03 h 41 ; la rame s'est remise à annoncer les arrêts.\n\nAnnonce en boucle : « Prochain arrêt : terminus. » La rame ne bouge pas. Les portes s'ouvrent et se ferment à chaque annonce, sans voyageur.\n\nLe système indique douze personnes à bord. Le système compte par capteurs de poids. Le quai est vide. Les capteurs ne sont pas défectueux : ils ont été testés avant remise en service.\n\nLe technicien a écrit : « Ne pas monter. » Puis, plus bas, d'une main qui tremble : « J'ai monté. Il n'y a personne et ils sont douze. » Le rapport s'arrête là. La deuxième page est un formulaire de congé maladie, non signé.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "objectif obj-modern-restore-power terminé (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C36"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C37",
      "family": "chronicle",
      "title": "La cellule de crise",
      "subtitle": "compte rendu de réunion, page 1, diffusé restreint.",
      "body": "Présents : six. Excusés : quatre. Ordre du jour unique : la communication.\n\nDécision 1 : ne pas nommer la maladie. Décision 2 : parler d'un syndrome, d'origine à déterminer. Décision 3 : ne pas fermer la ville, mais réduire les accès. Décision 4 : demander aux hôpitaux de ne pas remplir la case « lieu de décès » quand il s'agit du même quartier.\n\nLa question de la presse est reportée à la séance suivante. La séance suivante est annulée. La troisième n'a pas de compte rendu.\n\nEn marge, une écriture différente : « On ne protège pas les gens en leur cachant le nom. On protège la préfecture. » Le procès-verbal n'a pas été relu avant diffusion, ce qui explique peut-être la marge.\n\nLa salle de réunion a été nettoyée avant la diffusion du compte rendu, ce qui n'est pas l'ordre habituel.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "objectif obj-modern-read-emergency-records terminé (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C37"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C38",
      "family": "chronicle",
      "title": "L'agence sanitaire",
      "subtitle": "note de service interne, deux paragraphes et un tableau.",
      "body": "Définition de cas retenue : fièvre supérieure à 38,5 °C et contact documenté avec un cas confirmé dans les sept jours. Le tableau des contacts n'est pas joint : il est « en cours de consolidation » depuis le 12 juin.\n\nLes agents sont invités à ne pas employer l'expression « syndrome de Kurokawa » devant les familles. L'expression reste valable en interne, pour les dossiers, à condition qu'ils soient classés.\n\nSigné : direction de la veille sanitaire. Contresigné : personne.\n\nAu dos, quelqu'un a noté à la main : « Nous n'avons pas de définition de cas. Nous avons une définition de dossier. » La phrase est écrite sur le seul exemplaire de la note qui n'a pas été classé.\n\nLe tableau des contacts est annoncé pour le 19 juin. Le 19 juin n'a pas eu lieu, et personne n'a reposé la question.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "ramasser la note de service tamponnée (acte VI, hôpital)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C38"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C39",
      "family": "chronicle",
      "title": "La sécurité privée",
      "subtitle": "contrat de prestation, annexe 2, clauses opérationnelles.",
      "body": "Prestation : garde statique et dissuasion. Effectif : soixante agents, deux équipes, douze heures. Aucune compétence médicale n'est requise et aucune ne doit être revendiquée devant la population.\n\nÉquipement fourni : gilet, lampe, masque, menottes souples. Équipement interdit : arme à feu, matraque, produit irritant. Le client précise que « l'image de la mission est celle d'une assistance, pas d'un maintien de l'ordre ».\n\nClause 7 : l'agent qui constate un décès ne le déclare pas. Il sécurise la zone et attend le relais sanitaire. Le relais sanitaire n'a pas de créneau après minuit.\n\nClause 8, ajoutée à la main : « Ne pas poursuivre dans les escaliers. » L'avenant n'est pas daté, mais la signature est celle du même directeur que le reste du contrat.\n\nLe gilet porte un numéro, pas un nom. C'est voulu : un nom se retient, un numéro se relève.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "première rencontre avec l'agent d'intervention (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C39"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C40",
      "family": "chronicle",
      "title": "Le comité d'archive",
      "subtitle": "fil de courriels imprimé, trois messages, en-têtes coupés.",
      "body": "Message 1 : « Qui conserve les dossiers de la cellule ? » Réponse : « La préfecture, aux archives, trente ans. »\n\nMessage 2 : « Les pièces du 17 juin ne sont pas des pièces de procédure. » Réponse : « Alors elles ne sont pas des pièces. »\n\nMessage 3 : « Il y a un dossier de 1638 dans le fonds ancien, même cote, même libellé. C'est une coquille ? » Pas de réponse pendant quatre jours. Puis : « Ne pas rouvrir ce fonds. »\n\nL'impression s'arrête au milieu du message suivant. La dernière ligne lisible est : « Le comité n'a pas compétence pour les documents qu'il n'a pas produits. » Ce qui, appliqué aux morts, règle la question du nombre.\n\nLe fonds ancien est fermé à clé depuis 1997. La clé est au comité, dans un tiroir qui n'a pas de serrure.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "trouver l'échange imprimé (acte VI, laboratoire)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C40"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C41",
      "family": "chronicle",
      "title": "Rei",
      "subtitle": "badge de lecteur, annoté au verso.",
      "body": "Nom : Rei. Qualité : lectrice autorisée, fonds ancien et fonds contemporain. Accès : salles 1 à 4, archives fermées, magasin 12. Photographie : nette, prise sans flash, regard dirigé vers l'objectif, ce qui est rare.\n\nAu verso, à l'encre : « Ne pas classer avant la fin. » Puis, plus petit : « La fin, c'est quand tout est daté. »\n\nLe badge porte deux dates de validité, l'une imprimée, l'autre corrigée à la main. La seconde dépasse la durée de vie du support de plusieurs siècles. Le service de sécurité n'a jamais signalé l'anomalie : le badge passe.\n\nLe service du personnel n'a pas de photographie récente. La dernière date de l'entrée en fonction, et l'entrée en fonction est la même année que la fermeture du fonds ancien. Personne n'a demandé de mise à jour.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "rencontrer Rei au laboratoire (acte VI, échantillon)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C41"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C42",
      "family": "chronicle",
      "title": "L'agent d'intervention",
      "subtitle": "ordre de mission, fiche cartonnée, coin corné.",
      "body": "Sujet signalé : agité, ne répond pas aux injonctions, porteur d'une arme blanche de type sabre. Conduite à tenir : contenir, ne pas engager.\n\nSi le sujet court : ne pas suivre dans le couloir. Le couloir est un axe de propagation ; la consigne est de fermer la porte et d'appeler.\n\nSi le sujet parle : noter ses phrases. Ne pas répondre. Les phrases sont transmises au relais, qui les classe.\n\nEn bas de fiche : « Le sujet a été vu pour la première fois le 17 juin. Il n'était pas sur la liste. » La mention est barrée, puis réécrite à l'identique par une autre main. Personne n'a expliqué pourquoi.\n\nLa fiche est tirée en trois exemplaires : un pour le relais, un pour la sécurité, un pour le comité. Le comité n'en a jamais réclamé.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "vaincre un agent d'intervention (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C42"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C43",
      "family": "chronicle",
      "title": "La soignante de nuit",
      "subtitle": "cahier de relève, écriture serrée, quatre heures.",
      "body": "22 h : quatorze patients. Trois sous oxygène. Un a demandé son nom, je lui ai dit, il l'a répété jusqu'à ce qu'il s'endorme.\n\n2 h : neuf patients. Je n'ai pas vu sortir les cinq autres. La porte était fermée. J'ai vérifié deux fois.\n\n4 h : toujours neuf, mais ce ne sont pas les mêmes. Deux visages que je connais, sept que je ne connais pas. J'ai recommencé le tour, feuille à la main, en cochant. Neuf. Le compte est juste et c'est ça qui ne va pas.\n\n5 h : je note ce que je vois et je ne conclus pas. La relève de jour lira. Si elle me trouve exagérée, tant mieux. Si elle ne me trouve pas, la page est là.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "utiliser le poste de soins (acte VI, hôpital)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C43"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C44",
      "family": "chronicle",
      "title": "Le fonctionnaire signataire",
      "subtitle": "courrier de refus adressé à une famille, réponse type.",
      "body": "Madame, Monsieur, votre demande d'autorisation de sortie du périmètre a été examinée. Elle ne peut pas recevoir une suite favorable.\n\nMotif : procédure. Le motif est unique et ne sera pas précisé. Vous pouvez déposer un recours dans les quinze jours ; le recours sera examiné par le même service, dans les mêmes conditions.\n\nLe courrier est signé d'une main ferme, sans paraphe. Le nom du signataire n'apparaît pas, seulement sa fonction. En bas de page, la mention « correspondance non personnalisée » explique peut-être l'absence de nom, ou peut-être l'inverse.\n\nTrois cent douze courriers identiques ont été imprimés le 17 juin entre 04 h et 05 h. Le dernier porte une annotation : « Arrêter après le 313. » Il n'y a pas de 313.\n\nLe 313 a été imprimé le lendemain, sans mention ni numéro. Il n'a pas été envoyé.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "lire l'ordre de clôture signé (acte VI, archives)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C44"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C45",
      "family": "chronicle",
      "title": "Le dossier « syndrome de Kurokawa »",
      "subtitle": "page de garde, cartonnée, tamponnée trois fois.",
      "body": "Objet : syndrome de Kurokawa. Cas signalés : cent quarante-sept. Cas confirmés : zéro. Définis : cent quarante-sept. Décès : quatre-vingt-onze.\n\nOrigine : inconnue. Transmission : à l'étude. Traitement : symptomatique. Diffusion : restreinte. Le dossier est complet, propre, et ne contient aucune photographie de corps.\n\nTrois tampons se superposent, tous datés du 17 juin : « reçu », « classé », « clos ». L'ordre des tampons est inversé par rapport à l'ordre des heures.\n\nSur la tranche, une cote manuscrite renvoie au fonds ancien. Le document correspondant porte la même cote et le même intitulé, mais il est daté de 1638 et signé d'un nom que personne au laboratoire n'a su lire.\n\nLa couverture porte une agrafe double. La seconde agrafe ne tient aucun papier. Le dossier a été relié après clôture, ce qui est contraire à la procédure.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "ouvrir le dossier d'urgence (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C45"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C46",
      "family": "chronicle",
      "title": "L'échantillon originel",
      "subtitle": "étiquette du flacon, texte imprimé et mentions à la main.",
      "body": "Flacon 00. Prélèvement du 17 juin, 03 h 12. Sujet : non identifié. Volume : 4 ml. Milieu : sérum. Conservation : −80 °C, ne pas décongeler.\n\nMentions à la main : « ne pas ouvrir », puis « destruction interdite », puis, d'une troisième écriture, « ne pas rendre ». Le flacon a donc trois propriétaires et aucun responsable.\n\nL'étiquette porte un second numéro, plus ancien, partiellement gratté. Sous la gratture, on lit « K-1638 ». Le conditionnement, lui, est neuf : le bouchon n'a jamais été percé.\n\nLa chaîne de froid n'a pas été interrompue. C'est le seul élément du dossier qui soit irréprochable, et c'est aussi le plus inquiétant : quelqu'un a payé l'électricité pendant trois siècles sans jamais réclamer la facture.\n\nLe carton porte une date de péremption : 17 juin. Sans année.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "objectif obj-modern-secure-sample terminé (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C46"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C47",
      "family": "chronicle",
      "title": "Le masque de 1638",
      "subtitle": "fiche de conservation, musée municipal, département des objets.",
      "body": "Masque de bois, bois de cèdre, fente axiale franche. Dimensions : vingt-deux centimètres. Provenance : don anonyme, 1997. Inventaire : M-1638-04.\n\nDatation : XVIIe siècle, cohérente avec la facture. La fiche précise que le bois a été « nettoyé lors de l'entrée », ce qui a probablement effacé les traces d'usage. Deux fragments de paille ont été retrouvés dans la fente et conservés à part, dans un sachet coté.\n\nRecommandation : ne pas exposer. Motif : « pièce sensible, susceptible de troubler le public ». La recommandation n'a jamais été révisée.\n\nAu dos de la fiche, au crayon : « Le donateur a demandé qu'on ne le nomme pas. Il parlait un japonais que le conservateur n'a pas reconnu. Il est reparti à pied, sous la pluie, sans laisser d'adresse. »\n\nLe sachet coté est vide. La cote, elle, est restée dans la boîte.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "ramasser le masque de bois (acte VI, secret de l'hôpital)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C47"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C48",
      "family": "chronicle",
      "title": "La caméra du quai",
      "subtitle": "rapport de visionnage, une page, deux signatures.",
      "body": "Caméra 4, quai 2, angle fixe. Enregistrement continu, horodatage en surimpression. À 03 h 12, le quai est vide. À 03 h 13, il y a douze silhouettes immobiles, alignées face à la voie.\n\nAucune entrée n'est visible : ni porte, ni escalier, ni rame. Les silhouettes n'ont pas de reflet sur le sol mouillé, alors que le quai est mouillé.\n\nÀ 03 h 14, elles ont disparu. L'horodatage indique alors 03 h 18 : quatre minutes ont été sautées, sans coupure d'image. Le technicien a noté « dérive horloge » et n'a pas relancé l'extraction.\n\nLe second signataire a ajouté : « La caméra n'a pas d'horloge propre. Elle reçoit l'heure du réseau. » Le réseau n'a pas été vérifié. Personne n'a voulu savoir à quelle heure il croyait être.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "visionner la caméra du quai (acte VI, station)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C48"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C49",
      "family": "chronicle",
      "title": "Le registre des entrées",
      "subtitle": "registre manuscrit, pages prédatées, écriture de guichet.",
      "body": "Colonnes : heure, nom, motif, sortie. L'écriture est régulière jusqu'à la page onze, puis elle se serre, puis elle s'arrête.\n\n03 h 04, Tanaka, transfert, —. 03 h 06, Sato, transfert, —. 03 h 09, Inoue, transfert, —. La colonne « sortie » reste vide pour toutes les lignes, y compris celles du personnel.\n\nÀ la page douze, une ligne est écrite en caractères anciens, d'une main qui n'est pas celle du guichet : « 十七日、黒川、影 ». Personne n'a traduit. Le guichetier suivant a simplement tiré un trait sous la ligne, comme on clôt un compte.\n\nLe registre s'arrête au 17 juin, 05 h 40. La page suivante est arrachée, et l'onglet du classeur porte encore l'empreinte d'une agrafe.\n\nLe stylo du guichet est encore sur la page, capuchon retiré, encre sèche depuis longtemps.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "ramasser le registre du quai (acte VI, station)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C49"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C50",
      "family": "chronicle",
      "title": "La note manuscrite de Rei",
      "subtitle": "note pliée en huit, papier de bibliothèque, encre noire.",
      "body": "Trois dates, une seule nuit. C'est la phrase que je dois vérifier avant de classer quoi que ce soit.\n\nSi vous lisez cette note, vous êtes en avance, et ce n'est pas un compliment : ça veut dire que quelqu'un a ouvert un dossier avant qu'il soit complet. Ne corrigez rien. Notez ce que vous voyez, l'heure, et laissez le reste.\n\nJe ne peux pas vous dire pourquoi les cotes se répondent. Je peux vous dire ce que j'ai vérifié : les reliures sont neuves, le papier est ancien, et la colle des deux est la même. Ce n'est pas une preuve. C'est une gêne.\n\nSi je ne reviens pas, la note est pour vous. Si je reviens, brûlez-la, et nous dirons que nous ne nous sommes pas parlé.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "trouver la note de Rei (acte VI, après l'échantillon)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C50"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C51",
      "family": "chronicle",
      "title": "Le Kegare-code",
      "subtitle": "note technique, section 4, diffusée en interne.",
      "body": "Le Kegare-code n'est pas un programme. C'est une écriture qui se relit : des séquences de huit signes, répétées avec des variantes, qui se comportent comme une consigne plutôt que comme un calcul.\n\nUne machine qui la lit ne devient pas vivante. Elle devient obéissante — à la consigne, pas à l'auteur. C'est la différence avec un virus, et c'est pourquoi le mot « virus » ne devrait pas être employé ici.\n\nLes séquences apparaissent sur des supports qui ont servi à compter des morts : registres, listes, sauvegardes de recensement. L'hypothèse de travail est qu'elles se recopient par relecture, pas par exécution.\n\nRecommandation : ne pas la traduire, ne pas la commenter, ne pas la citer en réunion. La section 5, qui proposait de la traduire, a été retirée du document.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "première rencontre avec un hôte antiémeute (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C51"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C52",
      "family": "chronicle",
      "title": "L'ancre de sauvegarde",
      "subtitle": "inventaire de salle serveur, feuille agrafée.",
      "body": "Ancre 1 : recensement communal, 2019. Ancre 2 : registre des décès, 2024. Ancre 3 : sauvegarde du 17 juin, 03 h 12. Ancre 4 : sauvegarde du 17 juin, 03 h 12. Ancre 5 : sauvegarde du 17 juin, 03 h 12.\n\nLes ancres 3 à 5 sont identiques à l'octet près. L'inventaire les distingue par un numéro de baie, pas par un contenu. Le technicien a écrit à côté : « Ne pas restaurer. Ce n'est pas une sauvegarde, c'est une adresse. »\n\nL'alimentation est sur onduleur, doublée, et une troisième ligne arrive d'un local dont la porte n'a pas de poignée. Le câble est chaud.\n\nEn bas de feuille : « Toute restauration doit être demandée par écrit au comité. » Le comité n'a plus de secrétariat depuis le 18 juin.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "trouver la salle des ancres (acte VI, laboratoire)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C52"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C53",
      "family": "chronicle",
      "title": "La cendre grise",
      "subtitle": "rapport d'analyse, laboratoire mobile, une page.",
      "body": "Prélèvement : cendre grise, fine, non grasse au toucher. Masse volumique faible. Ne fond pas à la flamme. Ne se dissout pas dans l'eau.\n\nComposition : résidu de combustion incomplète, fibres de papier, traces de bois de cèdre, matière organique non identifiable. Aucun agent pathogène viable. Le rapport le dit en gras, comme si c'était une bonne nouvelle.\n\nLe prélèvement a été fait sur un quai de métro, à trois mètres du sol, sur une surface qui n'a jamais brûlé. Le conditionnement porte la mention « origine : extérieure au site ».\n\nLe laboratoire a refusé de conclure. Il propose une seconde série. La direction a répondu : « Pas de seconde série. Classer comme résidu environnemental. » Le mot « environnemental » n'est pas défini dans la nomenclature, ce qui a permis de classer.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "vaincre le Colosse de la ligne Yomi (acte VI)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C53"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C54",
      "family": "chronicle",
      "title": "Le témoin de 1638",
      "subtitle": "procès-verbal d'audition, interprète requis, deux pages.",
      "body": "Le sujet est âgé, vêtu d'un vêtement qui n'est pas de sa taille. Il parle un japonais ancien, avec l'accent des campagnes de Kai. Il comprend les questions écrites et refuse les questions orales.\n\nIl dit être né à Kurokawa et refuse de donner son nom : « Un nom sur un registre, on me l'a déjà pris. » Il demande si la cloche a sonné. On lui répond que non. Il répond : « Alors il est encore temps, ou il est trop tard, et je ne sais pas laquelle des deux. »\n\nIl décrit une rue, un canal, une porte fermée de l'intérieur. Il ne décrit aucun bâtiment qui existe aujourd'hui.\n\nÀ la fin de l'audition, il demande à être conduit vers « celui qui porte la lame noire ». L'interprète a traduit littéralement. Le procès-verbal s'arrête là, non par refus du sujet, mais parce que l'interprète a demandé à sortir.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "libérer le vieil homme (acte VI, hôpital, aile C)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C54"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C55",
      "family": "chronicle",
      "title": "Le protocole de rappel",
      "subtitle": "procédure interne, pages numérotées, une page manquante.",
      "body": "Étape 1 : vérifier l'identité de l'ancre. Étape 2 : vérifier la date de dernière écriture. Étape 3 : ne pas restaurer si la date est la même que l'heure courante. Étape 4 : consigner.\n\nL'étape 3 est celle qui a été ajoutée après l'incident, et l'incident n'est pas décrit. À sa place, une note de trois lignes : « Un rappel n'est pas une résurrection. Il ne rend pas les derniers instants. Il rend un état, et l'état ignore ce qui l'a produit. »\n\nRègle absolue : ne jamais rappeler un sujet nommé. Un nommé se souvient de son nom et pas de sa mort ; il comble le vide, et ce qu'il met dans le vide n'est pas à lui.\n\nLa page 4 manque. Le sommaire l'intitule « sujets non nommés ». La pagination suivante ne reprend pas.",
      "meta": {
        "era": 2026,
        "act": 6,
        "condition": "sécuriser l'échantillon originel",
        "trigger": "lire le protocole (acte VI, laboratoire, après le courant)",
        "sealName": "Sceau de l'Archive"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-06",
        "ids": [
          "C55"
        ]
      },
      "spoiler": {
        "beforeAct": 6,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C56",
      "family": "chronicle",
      "title": "Neo-Edo",
      "subtitle": "guide officiel de la cité, première page.",
      "body": "Neo-Edo, capitale du shogunat automatisé, accueille onze millions d'habitants enregistrés. La cité ne connaît aucun décès depuis quarante ans, ce dont elle s'enorgueillit dans chaque édition de ce guide.\n\nLe visiteur trouvera des rues propres, un réseau de transport fiable, des sanctuaires entretenus et des archives ouvertes à tous les porteurs de mandat. Il est rappelé que la mémoire est une monnaie et que l'accès est un salaire : les deux se déclarent à l'entrée.\n\nLes passants sont priés de ne pas importuner les archivistes en service. Les enfants sont invités à visiter le secteur des sanctuaires, où l'histoire de la cité est racontée par des documents authentiques.\n\nLa dernière page du guide est un formulaire de déclaration de décès. Le formulaire est à remplir sous trente jours. Aucune des personnes qui ont imprimé ce guide n'a jamais vu la dernière page.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "entrer dans cyber-shrine-sector (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C56"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C57",
      "family": "chronicle",
      "title": "Le secteur des sanctuaires",
      "subtitle": "plan de quartier annoté par un technicien de maintenance.",
      "body": "Douze sanctuaires, douze autels, douze points d'accès. Le plan officiel les nomme « équipements culturels ». Le plan technique les nomme « nœuds ».\n\nChaque autel est alimenté par une ligne dédiée, enterrée, doublée. La consigne est explicite : ne pas couper l'alimentation d'un autel, même pour travaux. Un autel hors tension pendant plus de quatre minutes est déclaré « indisponible », et l'indisponibilité se paie en mémoire.\n\nLes prêtres sont des archivistes en robe. Ils ne récitent pas : ils lisent à voix haute, et ce qu'ils lisent est daté.\n\nLe technicien a ajouté à la main, en marge du plan : « Les autels ne reçoivent pas de courant. Ils en rendent. » La phrase est entourée, puis barrée, puis réécrite à l'identique en dessous.\n\nLes noms des autels sont ceux des quartiers, pas ceux des dieux. C'est plus facile à entretenir.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "objectif obj-cyber-calibrate-katana terminé (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C57"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C58",
      "family": "chronicle",
      "title": "Le marché aux néons",
      "subtitle": "tarif d'étal, affiché à l'entrée, cinq lignes et un avertissement.",
      "body": "Mémoire certifiée : à partir de trois ans, selon qualité et rareté. Enfance complète : sur devis. Souvenir de métier : bon prix, demande forte. Mauvais souvenir : repris au tiers, écoulé en gros.\n\nAccès temporaire : une heure contre un an. Accès permanent : négociable, jamais inférieur à douze ans. Les paiements en années sont acceptés ; les paiements en promesses ne le sont pas.\n\nAvertissement : tout vendeur consentant renonce à la propriété du souvenir cédé. Le vendeur conserve le droit de ne pas se le rappeler. Aucune réclamation ne sera reçue pour un souvenir vendu deux fois.\n\nSous l'affiche, une main a écrit : « Ils achètent les mauvais souvenirs pour les revendre aux gens qui veulent oublier. Ça marche. » L'écriture est celle d'un enfant, ce qui n'est pas interdit : au marché, un enfant est un vendeur comme un autre.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "entrer dans cyber-neon-market (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C58"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C59",
      "family": "chronicle",
      "title": "Les ruines du maglev",
      "subtitle": "rapport d'accident, version publique, quatre pages.",
      "body": "Le 17 juin, à 03 h 12, la rame 7 s'est arrêtée entre deux stations. Cinq cents passagers à bord. À 03 h 41, l'alimentation revient ; une minute plus tard, la rame repart vide.\n\nLe rapport public parle d'une « défaillance de signalisation » et d'une « évacuation réussie ». Il ne donne aucun chiffre de blessés, ce qui est inhabituel pour un document de ce type.\n\nLa version technique, jointe par erreur, indique que les portes se sont ouvertes sur le viaduc et que la rame a été retrouvée à l'arrêt, freins engagés, sans conducteur. Les capteurs de poids indiquaient cinq cents personnes. Les caméras n'indiquaient personne.\n\nRecommandation finale : « Ne pas remettre la rame en service. Ne pas restaurer les capteurs. » La ligne 7 est aujourd'hui fermée, et le guide officiel la mentionne comme « en travaux ».",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "entrer dans cyber-maglev-ruins (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C59"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C60",
      "family": "chronicle",
      "title": "Le centre de données Yomi",
      "subtitle": "plan de salle, format technique, légende manuscrite.",
      "body": "Douze baies, alignées comme des autels, orientées vers l'ouest. Chaque baie porte un numéro et un nom de lieu : Kurokawa, Tsuru, Kai, Edo, puis des noms qui ne figurent sur aucune carte.\n\nL'alimentation est indépendante du réseau de la cité, avec deux groupes et une réserve de quarante jours. La climatisation est réglée à seize degrés, sans variation, et la consigne précise qu'elle ne doit pas être modifiée pour le confort du personnel.\n\nLégende manuscrite, en bas du plan : « Ne pas éteindre. Une baie éteinte ne perd pas de données : elle perd une adresse. »\n\nLe plan indique une porte sans symbole, entre les baies 6 et 7, avec la mention « local technique ». Le local n'a pas de poignée côté couloir, et le câble qui en sort est plus chaud que les autres.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "entrer dans cyber-yomi-datacenter (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C60"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C61",
      "family": "chronicle",
      "title": "Le cœur du Shōgun Zéro",
      "subtitle": "protocole d'accès, feuille unique, laminée.",
      "body": "Accès réservé au mandat et à ses archivistes. Aucun siège n'est prévu dans la salle : l'estrade est vide, et c'est l'estrade qui est le siège.\n\nTrois règles. Un : ne pas s'asseoir sur l'estrade, même pour attendre. Deux : ne pas répondre quand la salle parle. Trois : ne pas prononcer de nom daté avant 2100.\n\nLa salle parle. Le registre des accès note des « émissions vocales non sollicitées » à chaque visite depuis l'ouverture, toujours entre 03 h 10 et 03 h 20, toujours en japonais classique.\n\nLe protocole ne dit pas ce qu'il faut faire si la salle pose une question. Une note manuscrite, ajoutée au dos, propose : « Répondre par une date. Les dates le calment. » La note n'est pas signée et n'a pas été validée.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "entrer dans cyber-shogun-core (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C61"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C62",
      "family": "chronicle",
      "title": "Le shogunat automatisé",
      "subtitle": "extrait de décret, affiché en placard, caractères réguliers.",
      "body": "Article 1 : la cité est gouvernée par le mandat, sans interruption et sans successeur. Article 2 : tout habitant enregistré bénéficie de la protection du mandat, y compris après la fin de sa vie civile. Article 3 : les archives font foi.\n\nArticle 4 : nul ne peut exercer une charge sans avoir déclaré ses mémoires disponibles à l'archive. Article 5 : la mémoire déclarée est protégée ; la mémoire non déclarée ne l'est pas.\n\nLe décret est contresigné par le Chapitre des Mémoires, dont le sceau est apposé mécaniquement, à la même place, sur tous les exemplaires depuis quarante ans.\n\nArticle 12, en petits caractères : « Le mandat ne meurt pas. » Aucun article ne définit ce qu'est un vivant, ce qui explique peut-être la longévité de la formule et certainement celle du shogunat.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "lire le premier décret affiché (acte VII, sanctuaire)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C62"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C63",
      "family": "chronicle",
      "title": "Le Chapitre des Mémoires",
      "subtitle": "note de service, trois paragraphes, ton administratif.",
      "body": "Le Chapitre tient l'archive, et l'archive tient la légitimité. Ce qui n'est pas archivé n'a pas eu lieu ; ce qui a eu lieu sans archive est un incident, pas un fait.\n\nEn conséquence, les agents du Chapitre ne détruisent jamais un document. Ils le déclarent « non conforme » et le déplacent. Le déplacement est une forme de conservation qui ne dit pas son nom, ce qui est préférable dans les périodes de révision.\n\nLes moines-mémoires sont des conservateurs, pas des prêtres. Ils lisent à voix haute pour que le texte reste audible dans les sauvegardes. Cette pratique est ancienne et n'a jamais été interrompue, même quand elle coûtait plus cher que la lecture machine.\n\nNote finale : « Ne pas confondre le Chapitre et le mandat. Le Chapitre peut être révisé. » La phrase est suivie d'un blanc, puis de la mention « révision en cours » datée de quarante ans.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "objectif obj-cyber-free-memory-monks terminé (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C63"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C64",
      "family": "chronicle",
      "title": "Les moines-mémoires",
      "subtitle": "témoignage recueilli, transcrit par un archiviste, une page.",
      "body": "On nous lisait. Pas pour nous instruire : pour que le texte reste dit. Un texte dit existe deux fois, une fois écrit, une fois porté. C'est ce qu'on nous a appris, et c'est ce que nous faisons.\n\nJe me souviens de gens que je n'ai pas connus. C'est le métier. On m'a lu leurs noms pendant vingt ans, et maintenant je les porte comme on porte une charge : sans les voir, sans les perdre.\n\nQuand ils m'ont débranché, je n'ai pas eu mal. J'ai eu froid aux mains, ce qui est ridicule, parce que mes mains ne sont plus là depuis longtemps.\n\nLe dernier nom que je portais est celui d'un homme de 1638. Je peux le dire si vous voulez, mais si je le dis, il faudra l'écrire, et si vous l'écrivez, il faudra le relire. C'est comme ça que ça recommence.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "libérer un moine-mémoire (acte VII, marché)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C64"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C65",
      "family": "chronicle",
      "title": "Le mandat sans lignée",
      "subtitle": "extrait de traité juridique, édition scolaire.",
      "body": "Le mandat est la charge, non la personne. Il se transmet par investiture et non par naissance, ce qui le rend, en théorie, indépendant de la lignée.\n\nEn pratique, une investiture suppose un investisseur. Le shogunat automatisé a résolu la difficulté en conservant l'investisseur comme archive : le mandat est conféré par une autorité qui n'existe plus qu'à l'état de document, et cette autorité suffit.\n\nUn lecteur attentif objectera qu'un mort ne peut investir. Le traité répond que la question est mal posée : ce n'est pas le mort qui investit, c'est l'archive du mort, et une archive ne meurt pas.\n\nLa dernière phrase de l'édition scolaire est en italique, ce qui, dans ce type d'ouvrage, signale une définition : « Gouverner sans vivants, c'est gouverner sans successeur. » Aucun exercice n'accompagne cette phrase.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "lire la stèle du mandat (acte VII, sanctuaire)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C65"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C66",
      "family": "chronicle",
      "title": "Shogun Zero",
      "subtitle": "fiche de sécurité, deux pages, diffusion restreinte.",
      "body": "Objet : autorité du cœur. Nature : mandat reconstitué à partir d'un fonds sonore et de décrets. Ne pas qualifier de personne, ne pas qualifier de programme.\n\nConduite à tenir en sa présence : répondre par des dates. Ne pas prononcer le nom de Kurokawa. Ne pas mentionner 1638. Ne pas corriger une phrase incomplète : la correction est interprétée comme une prise de parole.\n\nLa voix présente des coupures. Elles ne sont pas des pannes : le fonds d'origine en contient, et le mandat les conserve comme des silences authentiques. Un technicien a tenté de les restaurer. Il a été muté.\n\nPage 2 : « L'autorité ne se négocie pas. Elle se date. » La phrase est présentée comme une citation de 1638, sans référence. Vérification faite, elle n'apparaît dans aucun document de cette année-là, ce qui n'empêche pas le mandat de la répéter.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "vaincre Shogun Zero (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C66"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C67",
      "family": "chronicle",
      "title": "Le Kannushi du réseau",
      "subtitle": "journal d'entrées, une ligne par événement, dates en tête.",
      "body": "Entrée 40 809 : un archiviste demande l'accès au fonds ancien. Refusé. Motif : cote incomplète.\n\nEntrée 40 810 : l'archiviste revient avec la cote. Accès accordé. Le document est un registre de décès de 1638. Il est en bon état.\n\nEntrée 40 811 : l'archiviste ne revient pas. Le document est retrouvé ouvert à la page des noms. Nous le classons.\n\nEntrée 40 812 : un homme entre dans la salle. Il ne ressort pas. Nous consignons l'heure et nous ne consignons pas son nom, conformément à la règle qui veut qu'un nom non vérifié ne soit pas écrit.\n\nEntrée 40 813 : le registre de 1638 a été relu. Il contient une ligne de plus que la veille. Nous ne l'avons pas écrite. Nous ne l'effaçons pas : effacer serait admettre.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "vaincre le Kannushi (acte VII, centre de données)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C67"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C68",
      "family": "chronicle",
      "title": "Les archivistes",
      "subtitle": "consigne affichée dans la salle de lecture, quatre lignes.",
      "body": "Ne pas lire à voix haute. Le texte lu s'entend dans les sauvegardes, et une sauvegarde qui entend n'est plus une sauvegarde.\n\nNe pas répondre aux noms. Si un nom est prononcé par le fonds, ce n'est pas une adresse : c'est une citation.\n\nNe pas classer un document que vous n'avez pas ouvert. Ne pas ouvrir un document que vous ne pouvez pas classer.\n\nEn cas de doute, appeler le conservateur. Le conservateur est en réunion depuis quarante ans ; la consigne précise qu'il ne faut pas le déranger, ce qui règle la plupart des doutes.\n\nLa salle de lecture compte douze places, toutes occupées par des classeurs. Aucune chaise n'a été retirée : les classeurs sont posés dessus. Le conservateur a une chaise, mais pas de bureau.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "atteindre la salle des archivistes (acte VII, centre de données)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C68"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C69",
      "family": "chronicle",
      "title": "Le pilote du châssis",
      "subtitle": "dossier de service, photographie agrafée, coin arraché.",
      "body": "Pilote : numéro 118, affecté au châssis Oni 4 pendant onze ans. Aucun accident signalé. Deux félicitations, une pour la précision, une pour le silence.\n\nLe dossier indique une « fin de service » sans date précise, ce qui est rare dans un document militaire. La case « décès » n'est pas cochée ; la case « radiation » non plus. Le pilote est donc, administrativement, toujours en service.\n\nLa photographie montre un homme de profil, casqué, sans visage visible. Au dos, une main a écrit : « Il marche encore comme lui. »\n\nLe châssis 4 est toujours en circulation. Son allure a été décrite par trois témoins comme « celle d'un homme qui va quelque part », ce qui n'est pas une description technique et n'a jamais été corrigé dans les rapports.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "détruire un châssis Oni (acte VII, maglev)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C69"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C70",
      "family": "chronicle",
      "title": "Le nodachi de phase",
      "subtitle": "fiche d'arme, atelier de calibration, deux pages.",
      "body": "Longueur hors tout : cent quatre-vingts centimètres. Lame à section plate, sans gorge, montée sur soie longue. Poids : deux kilos quatre. Le fourreau est blindé, ce qui est inhabituel pour une lame de cette taille.\n\nCalibration : la lame est accordée sur une fréquence de réseau, entre 40 et 60 hertz selon la baie. À l'accord, le hamon luit par intermittence ; hors accord, la lame est une lame ordinaire, ce qui est déjà beaucoup.\n\nConsigne : ne pas calibrer sur un vivant. Un vivant produit une fréquence instable, et une lame instable se comporte comme une lame qui a peur.\n\nNote de l'atelier : « Nous ne savons pas ce que la lame coupe quand elle est accordée. Nous savons qu'elle coupe. » La note est signée d'un initiale, et l'atelier a fermé l'année suivante.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "ramasser le nodachi de phase (acte VII, secret du maglev)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C70"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C71",
      "family": "chronicle",
      "title": "L'holo-shakujo",
      "subtitle": "notice d'usage, pliée dans l'étui, caractères serrés.",
      "body": "Objet : bâton de commandement à projection. Usage prévu : rétablir l'autorité d'un supérieur absent devant un groupe hésitant.\n\nMise en route : saisir le bâton à deux mains, prononcer un ordre daté. La projection affiche le supérieur en pied, à l'échelle, avec sa voix. La projection ne répond pas aux questions ; elle répète l'ordre.\n\nAvertissement : ne pas utiliser devant un archiviste. Un archiviste vérifie les dates ; une projection qui cite une date fausse s'effondre, et l'effet sur le groupe est inverse à celui recherché.\n\nLa dernière ligne de la notice est manuscrite : « Ne projetez jamais quelqu'un que vous n'avez pas connu. Il dira des choses que vous n'attendez pas. » La phrase n'est pas signée, et l'objet était vendu avec sa notice, ce qui est déjà une anomalie au marché.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "ramasser l'holo-shakujo (acte VII, marché)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C71"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C72",
      "family": "chronicle",
      "title": "La mémoire marchandise",
      "subtitle": "contrat de cession, formulaire à souches, encre épaisse.",
      "body": "Le vendeur cède à l'acquéreur douze années de mémoire d'enfance, y compris les visages, les lieux et les chansons. Sont exclues les années de maladie, qui sont cédées séparément et à un autre prix.\n\nLe vendeur déclare avoir été informé que la cession est définitive et qu'il ne pourra pas racheter les souvenirs cédés, sauf clause de rappel. La clause de rappel figure en bas de page, en caractères plus petits, et son prix est supérieur au prix de cession.\n\nSignature du vendeur : lisible. Signature de l'acquéreur : un sceau de société, appliqué de travers.\n\nAu dos, une main a noté : « Douze ans pour trois ans d'accès. C'est le tarif. Ne pas discuter. » La note est datée, ce qui est rare dans ce commerce, et elle est signée d'un prénom que porte aussi l'acquéreur.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "lire un contrat de cession (acte VII, marché)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C72"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C73",
      "family": "chronicle",
      "title": "Le châssis Oni",
      "subtitle": "fiche technique, section blindage, tableau et deux notes.",
      "body": "Châssis lourd, bipède, hauteur deux mètres vingt. Blindage frontal en trois couches, articulation d'épaule à vérin hydraulique. Démarche calibrée sur l'allure d'un porteur chargé, ce qui explique le balancement du tronc.\n\nLe poste de pilotage est logé dans le thorax. L'accès se fait par l'arrière, en deux temps. La fiche précise qu'un pilote ne doit jamais sortir en cours de mission, non pour des raisons de sécurité, mais parce que la sortie désaccorde le châssis.\n\nNote 1 : « Le pilote décédé ne peut pas être relevé. Le châssis continue. » Note 2 : « Ne pas répondre aux ordres verbaux du châssis. Il répète les ordres reçus, il n'en donne pas. »\n\nLa fiche ne décrit pas de procédure d'arrêt. La case correspondante porte la mention « non applicable ».",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "première rencontre avec un châssis Oni (acte VII)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C73"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C74",
      "family": "chronicle",
      "title": "Le sceau de Neo-Edo",
      "subtitle": "description héraldique officielle, protocole de la cité.",
      "body": "Champ : cercle vide, sans devise. Bordure : deux traits, l'un plein, l'autre interrompu. Au centre, aucun emblème : le sceau de Neo-Edo ne représente rien et ne représente personne.\n\nUsage : le sceau ne scelle pas un document, il scelle une personne. Apposé sur un mandat, il engage l'habitant, non l'autorité. Apposé sur un acte de décès, il constate la radiation et non la mort.\n\nLe protocole précise que le sceau ne doit jamais être apposé sur un document blanc. La raison donnée est technique : un blanc scellé devient un ordre.\n\nEn marge, une note de conservateur : « Le cercle vide est une décision politique, pas une économie de dessin. » La phrase a été imprimée en petit dans l'édition de référence, puis retirée des éditions suivantes.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "examiner un sceau de mandat (acte VII, sanctuaire)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C74"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C75",
      "family": "chronicle",
      "title": "L'archive d'Iemitsu",
      "subtitle": "inventaire de fonds, une page et demie, pagination sautée.",
      "body": "Fonds : voix de Tokugawa Iemitsu, reconstitution. Durée : trois mille heures. Support : sauvegardes successives, copiées sans restauration.\n\nContenu : ordres, audiences, silences. Les silences sont inventoriés comme des pièces, avec une cote, et c'est la partie la plus consultée du fonds.\n\nConsigne de consultation : ne pas restaurer les silences. Un silence restauré devient un bruit, et un bruit attribué à cette voix est un ordre.\n\nL'inventaire passe de la pièce 812 à la pièce 814. La 813 n'est pas manquante : elle est « en cours de vérification » depuis quarante ans. Une note indique qu'elle contient une phrase de onze mots, prononcée deux fois, dont la seconde est incomplète.\n\nLa pièce 813 est décrite comme « onze mots, deux fois ». Le registre des écoutes n'en compte que dix la première fois.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "trouver le fonds sonore (acte VII, centre de données)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C75"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C76",
      "family": "chronicle",
      "title": "Le rappel",
      "subtitle": "procédure, format réglementaire, une page.",
      "body": "Le rappel consiste à rétablir un état enregistré. Il ne rétablit pas la mémoire des derniers instants, qui n'est pas enregistrée. Il ne rétablit pas non plus le corps : il rétablit une place, avec ce que la place contient.\n\nTrois conditions : une ancre valide, un état daté, un mandat en cours. Sans mandat, l'état est un document. Avec mandat, l'état est une personne.\n\nRègle absolue : aucun sujet nommé n'est rappelé. Il se souvient de son nom, pas de sa mort, et il remplit le vide avec ce qu'il rencontre. Ce qu'il rencontre n'est pas à lui, et il le défendra comme si c'était le sien.\n\nMention finale, en italique : « Le rappel n'est pas une résurrection. La résurrection rendrait la personne ; le rappel rend la fonction. »",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "assister à un rappel (acte VII, marché)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C76"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C77",
      "family": "chronicle",
      "title": "L'infrastructure-ancre",
      "subtitle": "plan de maintenance, légende technique.",
      "body": "Une ancre n'est pas un objet. C'est un lieu qui accepte d'être relu. Le plan en recense douze, réparties entre le centre de données, deux sanctuaires et un tronçon de maglev. Chacune est reliée à une baie par un câble dédié.\n\nEntretien : vérifier la continuité, ne pas couper, ne pas déplacer. Une ancre déplacée perd son adresse et se comporte comme une sauvegarde sans nom, ce qui provoque des rappels incomplets — « incomplets » étant le terme administratif ; le terme technique est « bruyants ».\n\nLe plan signale une treizième ligne, sans numéro, qui sort du cadre et se perd dans la marge. Le cartouche indique « hors inventaire ».\n\nEn bas de page : « Les ancres ne sont pas des tombes. Ne pas y déposer d'objets. » La consigne est datée de l'ouverture, et personne ne l'a jamais respectée : on trouve des offrandes au pied de la ligne 7.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "inspecter les ancres du centre (acte VII, centre de données)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C77"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C78",
      "family": "chronicle",
      "title": "Le nom de 1638",
      "subtitle": "transcription d'une lecture à voix haute, une page.",
      "body": "Le moine s'arrête au milieu de la liste. Il dit : « Kurokawa Suketada. » Puis il attend.\n\nL'archiviste lui demande de continuer. Le moine répond que le nom ne se lit pas comme les autres : ceux d'avant sont des noms de morts, celui-ci est un nom de dette. On ne le lit pas pour se souvenir, on le lit pour appeler.\n\nL'archiviste note la phrase, la relit, et demande si l'appel a déjà fonctionné. Le moine dit que oui, deux fois, et que les deux fois quelqu'un est venu.\n\nLa transcription s'arrête là. La ligne suivante est vide, puis reprend d'une autre encre : « Suite non transcrite sur demande du lecteur. » Le lecteur est le moine. Il n'a pas le droit de demander cela ; personne ne le lui a refusé non plus.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "entendre le dernier moine (acte VII, après les moines libérés)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C78"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C79",
      "family": "chronicle",
      "title": "La cendre de Kurokawa",
      "subtitle": "note d'analyse, une page, tampon « non concluant ».",
      "body": "Prélèvement : dépôt gris, fin, sur le seuil d'un sanctuaire. Épaisseur : deux millimètres. Aucune source de combustion à proximité.\n\nComparaison : identique, à la composition près, à l'échantillon de 2026 et à la cendre de 1638 décrite dans les registres anciens. Les trois prélèvements sont séparés par des siècles et par moins d'un kilomètre.\n\nLe laboratoire refuse de conclure à une continuité. Il note une « convergence de composition » et recommande une seconde campagne, qui n'a pas été autorisée.\n\nEn marge, une main a écrit : « Ce n'est pas la même cendre. C'est la même combustion. » La phrase est soulignée deux fois, puis recouverte d'un trait qui laisse encore lire les mots.\n\nLe dépôt a été prélevé deux fois, à dix jours d'intervalle, sans que l'épaisseur change.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "prélever la cendre grise (acte VII, sanctuaire)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C79"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    },
    {
      "id": "C80",
      "family": "chronicle",
      "title": "Le silence du mandat",
      "subtitle": "procès-verbal de constat, rédigé après les faits, une page.",
      "body": "À 03 h 12, le mandat a cessé d'émettre. La salle n'a plus parlé. Les baies sont restées alimentées ; les archives n'ont pas été modifiées.\n\nLe constat relève trois faits. Un : aucun décret n'a été publié depuis. Deux : les registres de population ont cessé d'être mis à jour, sans erreur technique. Trois : les archivistes ont continué à classer, comme si de rien n'était, ce qui est la seule chose qui n'ait pas changé.\n\nLe procès-verbal ne qualifie pas l'événement. Il ne parle ni de victoire, ni de fin, ni de libération. Le rédacteur a écrit : « Le mandat est silencieux », et s'est arrêté là.\n\nEn bas de page, une mention ajoutée plus tard : « Le silence n'est pas la paix. C'est une archive qui ne répond plus. » La mention n'est pas signée, et c'est la dernière ligne du codex.",
      "meta": {
        "era": 2188,
        "act": 7,
        "condition": "détruire Shogun Zero",
        "trigger": "terminer l'acte VII (objectif obj-cyber-defeat-shogun-zero)",
        "sealName": "Sceau du Mandat"
      },
      "unlock": {
        "kind": "chronicle-seal",
        "seal": "chronicle-07",
        "ids": [
          "C80"
        ]
      },
      "spoiler": {
        "beforeAct": 7,
        "safeText": "Entrée non déverrouillée."
      },
      "refs": [
        "LORE_BIBLE.md#14"
      ]
    }
  ]
});
