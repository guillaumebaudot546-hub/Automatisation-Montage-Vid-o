# Sous-agents — déléguer sans polluer

> Index : quand et comment déporter une tâche vers un sous-agent. À lire dès qu'une tâche est bruyante (beaucoup de lecture/recherche) ou doit être vérifiée par un regard neuf.

## Pourquoi
Un sous-agent tourne dans son propre contexte : il peut explorer largement sans jamais faire grossir la conversation principale, et ne renvoie qu'un résumé condensé. C'est la séparation entre chercher et décider : le sous-agent cherche, la session principale synthétise.

## Quand déléguer
- **Recherche / exploration** — « comment le pipeline gère X » → sous-agent d'investigation, tu ne récupères que la réponse.
- **Vérification / second regard** — voir `verification.md`, niveau 4.
- **Tâches en volume** — traiter N fichiers un par un : un sous-agent par fichier plutôt qu'un fil unique qui accumule tout dans son contexte.
- **Analyse média lourde** — vision sur des dizaines d'images, transcription : toujours en sous-agent (précédent : le spike segments a brûlé ~170k tokens isolés du fil principal).

## Les sous-agents de ce projet (`.claude/agents/`)
| Agent | Rôle | Renvoie |
|---|---|---|
| `segment-spike` | Sélection de segments sur un rush (vision + audio), boucle K=3 | taux de correspondance + timestamps |
| `relecteur-adversarial` | Compare un diff/résultat à la demande d'origine (SPEC.md ou consigne) | écarts qui cassent la correction ou le périmètre — rien d'autre |

Invocation explicite : « utilise le sous-agent relecteur-adversarial pour vérifier ce diff par rapport à SPEC.md ».

## Garde-fou
Un sous-agent chargé de trouver des problèmes en trouvera presque toujours, même quand le travail est solide — c'est ce qu'on lui a demandé de faire. Ne corrige que ce qui touche à la correction ou au périmètre demandé ; le reste est optionnel, sous peine d'ajouter de la complexité qui n'a rien demandé.
