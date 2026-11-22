# Harmonisation des skills d'agents IA

Ajouts facultatifs, sans modification du code, du moteur, du CI ou des dépendances runtime. Les compétences existantes restent prioritaires.

- GameDev Agent Skills (Apache-2.0) : sous-module complet épinglé à `c6ca6c41c839b68319ffc08430b99ab768debc32`, dans `.ai-tools/gamedev-skills/upstream/`. Le catalogue inclut les références des skills moteurs et disciplines.
- 3Dviz Pro Max (MIT) : version source `d077e0e68915c25be8e71d74684d3144fd1c2aca`. Soit la copie complète déjà intégrée au dépôt, soit un sous-module optionnel dans `.ai-tools/3dviz-pro-max/upstream/`.
- Spec Kit : ce guide ne remplace pas les installations existantes et n'exécute pas de commandes lorsque `.specify/` est absent.
- Obscura, CodeGraph et Sand3D : aucune modification ; leurs PR distinctes restent indépendantes.

Initialiser uniquement les sous-modules effectivement présents et nécessaires avec `git submodule update --init <chemin>`.
Un sous-module non initialisé ne constitue pas un skill chargé. Aucun test visuel ni exécution des scripts n'a été réalisé lors de cette PR.
