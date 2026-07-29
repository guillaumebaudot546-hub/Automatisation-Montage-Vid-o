---
workflow: faceless-explainer
flow: automation
storyboard: yes
message: "Installer Hermes Agent sur un VPS Hetzner, simplement et en sécurité"
destination: youtube
aspect: 1920x1080
language: fr
audience: "Praticien non-technicien qui veut un agent IA autonome, sans compétence sysadmin"
length: 65s
angle: how-to
---

# Tuto — Installer Hermes Agent sur Hetzner (16:9)

Format maître de trois déclinaisons : 16:9 (YouTube), 9:16 (Shorts/Reels/TikTok), 1:1 (feed LinkedIn/Instagram).

## Intent

Trois étapes seulement à l'écran — un VPS, une commande, une messagerie — plus un avertissement de sécurité qui n'est pas négociable. Le détail complet (durcissement SSH, pare-feu, sauvegardes) reste dans `hermes-vps-runbook.md`, renvoyé en carton final.

## Customizations

- **Muet, tout le texte à l'écran.** HeyGen non connecté ; Kokoro supporte le français (préfixe `f`) mais la phonémisation non-anglaise exige `espeak-ng` en installation système — dépendance écartée pour ce build. Les trois destinations se lisent sans son.
- **Motion design par défaut** (doctrine de session) : caméra multi-phase à sens alterné, zoom punch-in sur les beats clés avec courbes variées, aura cyan sur les panneaux, révélation typewriter sur la commande.
- **Sans marque IMCP** — c'est un tutoriel technique, pas du contenu de cabinet dentaire. Carton final neutre.
- **Bascule sémantique de couleur** sur le beat sécurité : ambre au lieu de cyan. L'avertissement ne doit pas se lire comme une étape de plus.

## Notes

Source : `C:\Users\Guillaume\Desktop\LP MedStream DCA\hermes-vps-runbook.md` et `prompt-deploiement-hermes.md`.

Contrainte de lisibilité assumée : la commande d'installation complète n'est affichée littéralement qu'en 16:9. En 9:16 et 1:1 elle est abrégée — une ligne bash entière ne tient pas lisiblement dans ces ratios.
