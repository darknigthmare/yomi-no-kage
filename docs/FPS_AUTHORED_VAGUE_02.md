# Yomi no Kage — atlas authored, vague 02 (20 novembre 2026)

## Baseline vérifiée
Le dépôt contient 105 ennemis avec huit directions techniques (dont certaines projetées). La conversion des six directions non latérales demande 105 × 6 = **630** atlas individuels de 6 colonnes × 5 lignes. L'état de main documenté est **42/630** (sept personnages, six vues chacun), soit **588 vues authored manquantes**.

Les 36 atlas/1 080 poses évoqués dans la session précédente ne figurent pas dans `main` et n'étaient pas disponibles en fichiers pour cette PR. **Aucun PNG n'est donc déclaré intégré par anticipation.** Cette vague fournit le suivi, six manifestes d'accueil, puis des contrôles de provenance avant import.

## Priorité immédiate — six personnages / 36 atlas / 1 080 poses
| Mission FPS | Personnage | Identifiant | Contrôle artistique |
|---|---|---|---|
| Forêt racinaire | Fossoyeur | `r09-haka-digger` | Pelle et silhouette dissociées |
| Forêt racinaire | Pisteur du Kegare | `mb-09-pisteur-kegare` | Pose de traque, masque, arme démontable |
| Sanctuaire lunaire | Danseuse Kage-mai | `s16-kage-mai-dancer` | Vérification latérale préalable, phases synchrones |
| Sanctuaire lunaire | Shinobi des Brumes | `mb-06-shinobi-brumes` | Télégraphe et pied au sol |
| Grenier des rizières | Palefrenier d'Umaya | `r17-umaya-groom` | Chigiriki : poignée, chaîne, pivot et occlusion |
| Grenier des rizières | Sumotori Namazu | `mb-17-sumotori-namazu` | Échelle, volume et contact sol |

Le contrat canonique est `assets/modular/manifests/fps-authored-wave-02.json`. Les `import-input.json` ajoutés **ne sont pas des sprites** et ne prouvent pas leur existence.

## Contrat graphique strict
Un atlas source PNG indépendant pour chaque vue `front`, `front-left`, `back-left`, `back`, `back-right`, `front-right`. Grille 6 colonnes (phases 00–05) × 5 lignes (`idle, move, attack, hurt, death`). Corps unique complet, identité 1:1 (palette, costume, proportions, mains, silhouette), ligne de sol identique, pixel-art 16 bits net, fond chroma uniforme `#ff00ff` ou alpha. Aucun décor, texte, arme tenue, fourreau ou objet combat fusionné au corps. **Pas de miroir, projection, assemblage de moitiés, interpolation, phase synthétique ni duplication de pose.** Les vues gauche/droite préexistantes restent inchangées.

Les vrais originaux doivent être déposés dans :
`assets/modular/fps/characters/<catégorie>/<id>/sources-authored-six-way-v1/<direction>-imagegen-raw.png`.

Les prompts existants sont dans `assets/modular/manifests/directional-authoring-prompts.json`. Ne pas utiliser la présence d'un prompt comme preuve d'artwork.

## Intégration et contrôle
1. Chaque atlas : inspecter à 100 % les 30 cellules (silhouette unique, aucune fusion, mains vides), comparer les phases à la vue latérale pristine, conserver l'original.
2. Importer **d'abord sans `--apply`** : `python tools/import-authored-fps-directions.py --manifest assets/modular/fps/characters/<catégorie>/<id>/sources-authored-six-way-v1/import-input.json`.
3. Après prévalidation, refaire avec `--apply`. Contrôler les PNG exports, `sprite.json`, les hashes SHA256 et `import-manifest.json`.
4. Vérifier physiquement les sockets d'armes dans les huit directions FPS, notamment le chigiriki du Palefrenier, et revoir la pose latérale de la Danseuse.
5. Exécuter : `node tools/audit-fps-authored-coverage.mjs --check`, `node tools/audit-fps-authored-coverage-smoke-test.mjs`, `python tools/validate-fps-authored-directions.py`, `python tools/validate-fps-enemies.py`, `node fps-directional-runtime-smoke-test.js`, `node campaign-fps-smoke-test.js`. Le navigateur reste requis pour la validation visuelle.

Vague suivante après ces 36 atlas : compléments des trois premières missions, puis les sous-boss/boss récurrents et les autres ennemis du roster jusqu'à **630/630** originaux réellement importés.
