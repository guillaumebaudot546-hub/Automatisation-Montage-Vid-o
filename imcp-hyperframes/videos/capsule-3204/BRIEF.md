---
workflow: talking-head-recut
flow: automation
storyboard: no
message: "La microchirurgie orale n'est pas élitiste — elle est accessible, et elle change les résultats"
destination: instagram
aspect: 1080x1920
language: fr
audience: "Chirurgiens-dentistes et chirurgiens oraux, praticiens confirmés"
length: 66s
---

# Capsule 3204 — Microchirurgie orale (9:16)

Recut d'un talking-head : les rushes restent intacts, on ajoute des cartons d'information et des sous-titres.

## Intent

Le discours du Dr Baudot porte déjà sa structure — sept beats nets, du « mes chers amis » à l'URL. Le montage suit cette structure au lieu de la réinventer : chaque carton se cale sur ce qui est dit au moment où c'est dit.

Le pivot du discours est le beat 4 : l'objection (« complexe, élitiste, du show business ») retournée en « c'est tout à fait l'inverse ». C'est le moment le plus fort du rush, il mérite le traitement graphique le plus marqué.

## Customizations

- **Sous-titres français incrustés**, générés depuis 148 mots horodatés (`faster-whisper large-v3`). Indispensables : Instagram et LinkedIn se lisent sans son.
- **Motion design par défaut** (doctrine de session) : caméra multi-phase à sens alterné, zoom punch-in à courbes variées, aura cyan sur les panneaux, révélation typewriter sur l'URL.
- **Parole continue** (-31,8 dB constants, aucune zone morte) → les cartons se calent sur les fins de phrase. Contrairement à la capsule `publication`, aucun réordonnancement n'est possible sans casser le sens.

## Notes

Trois corrections apportées à la sortie brute de la transcription :

1. **Hallucination exclue.** Le dernier segment, « Sous-titrage Société Radio-Canada » à 65,97 s, n'est pas prononcé — Whisper fabrique des crédits de sous-titrage sur le silence de fin. La capsule est coupée à 66,3 s.
2. **Tokenisation recollée.** Whisper coupe sur les apostrophes (« J », « 'ai ») ; recollage sans espace.
3. **URL en forme écrite.** Il l'énonce (« imcp-formation, au pluriel, point fr ») ; les sous-titres portent `imcpformations.fr`, la seule forme utilisable par le spectateur. Cette prononciation confirme au passage l'adresse déjà utilisée dans la capsule `sutures`.

Source : `C:\Users\Guillaume\Desktop\my-video-IMCP\IMG_3204.mov` (3840×2160, rotation -90°, 67,4 s).
