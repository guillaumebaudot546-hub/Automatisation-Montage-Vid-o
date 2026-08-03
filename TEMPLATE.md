# TEMPLATE vidéo Dr Baudot — mode d'emploi

Gabarit d'habillage réutilisable pour **toute** vidéo du Dr Baudot
(cas cliniques, démonstrations, présentations). Première application :
« Approfondissement vestibulaire » et « Retrait d'implant au laser ».

## Ce que le template applique automatiquement

| Élément | Détail |
|---|---|
| **Sting logo** | Animation logo IMCP, 4,5 s, recadrée au moment fort |
| **Carton-titre** | Eyebrow champagne + titre Cormorant ivoire + sous-titre Manrope + filet animé |
| **Contenu intégral** | Vidéo source plein cadre, **Ken Burns léger** (push-in 3,5 %), fondus entrée/sortie |
| **Watermark** | Logo IMCP haut-droit, 50 % d'opacité |
| **Lower-third** | Titre + « Dr Fabrice Baudot — IMCP », 8 premières secondes |
| **Générique de fin** | Logo, nom, spécialités, crédit musique — 6 s |
| **Transitions** | Fondu + flash discret aux 3 frontières |
| **Musique** | Saint-Preux *Concerto Pour Une Voix* : fondus propres, discrète sous le geste, **duckée** si la source a du son |
| **SFX** | Riser cinématique vers le carton, swooshs aux cuts |

## DA (source de vérité : `IMCP/DESIGN.md` → `src/theme/client-01.ts`)

- **Couleurs** : navy `#0A1A2F/#0E2238/#16314B` · ivoire `#F4EFE6` · crème `#E7E0D3` · slate `#A9B6C4` · **champagne `#C6A668` (accent unique)**
- **Typo** : Cormorant (display) · Manrope (corps)
- Changer la DA = éditer `src/theme/client-01.ts` uniquement.

## Ajouter une nouvelle vidéo (5 minutes)

1. Copier le fichier dans `public/clinical/ma-video.mp4`
2. Durée source en secondes × 30 = `contentFrames`
3. Dans `src/Root.tsx`, dupliquer un bloc `<Composition>` :

```tsx
<Composition
  id="ClinicalMaVideo"
  component={ClinicalWrap}
  durationInFrames={wrapDuration(CONTENT_FRAMES)}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{
    src: "clinical/ma-video.mp4",
    contentFrames: CONTENT_FRAMES,
    eyebrow: "Cas clinique · Spécialité",
    title: "Titre de la vidéo",
    subtitle: "Sous-titre optionnel",
    hasAudio: false,          // true si la source a une piste son
  }}
/>
```

4. Vérifier : `npm run test` puis aperçu `npm run dev`
5. Rendu : `npx remotion render ClinicalMaVideo out/ma-video.mp4 --codec=h264 --crf=18`

## Fichiers du template

- `src/clinical/ClinicalWrap.tsx` — assemblage (structure, timings, mix)
- `src/clinical/ClientChrome.tsx` — carton-titre, lower-third, watermark, générique
- `src/theme/client-01.ts` — tokens DA (couleurs, typo)
- `public/music/concerto.mp3` — musique de fond
- `public/intro-imcp.mp4`, `public/logo-mark.png` — marque

## ⚠️ Droits musicaux

*Concerto Pour Une Voix* (Saint-Preux) est une œuvre protégée. **Avant toute
diffusion publique** (site, réseaux, présentation commerciale) : licence
SACEM ou autorisation de l'ayant droit. L'usage en montage local ne vaut
pas droit de diffusion.
