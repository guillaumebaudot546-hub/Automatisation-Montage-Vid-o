#!/usr/bin/env python3
"""Transcrit un rush en cues.json — l'entree du portail doctrine et de la REGLE 0.

Pourquoi ce script plutot qu'un appel whisper direct :

1. **L'amorce de vocabulaire.** Sans elle, « laser Er-Yag » devient « RR Biomyag »
   et « Baudot » devient « Bodo » — teste le 30/07/2026 sur les modeles base,
   small et medium. Aucun modele generaliste ne devine ce vocabulaire. L'amorce
   (`initial_prompt`) le corrige sur TOUS les modeles, y compris les plus petits.
2. **Le format de sortie.** Le portail doctrine attend `{s, e, t}` par phrase.
   Les frontieres de ces segments sont ce sur quoi la REGLE 0 autorise a couper :
   une transcription mal segmentee produit des coupes en plein milieu de phrase.
3. **La transcription reste locale.** Ce sont des donnees de sante : l'audio ne
   part sur aucune API tierce. C'est aussi la raison du VPS en Allemagne (RGPD).

Usage :
    python3 scripts/transcrire.py <audio|video> [-o cues.json] [-m small] [--srt]

Sortie : cues.json (et optionnellement un .srt pour lecture humaine).
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

# --- Trouver l'interpreteur qui porte faster_whisper -------------------------
#
# POURQUOI (audit du 09/08/2026). faster_whisper est lourd : sur le VPS il vit
# dans un environnement dedie (.venv-whisper), pas dans le python systeme. Or ce
# script commence par « #!/usr/bin/env python3 » et l'agent l'appelle
# « python3 scripts/transcrire.py » — donc avec le python systeme, qui ne le
# trouve pas. La RÈGLE 1 de la doctrine (« transcris et LIS avant de monter »)
# etait litteralement inexecutable, sans que rien ne le signale : l'agent voyait
# une erreur d'import et passait a autre chose.
#
# Le script se relance donc lui-meme dans le bon interpreteur. Il marche appele
# de n'importe quelle facon, sur n'importe quelle machine.
def _reexec_si_besoin():
    try:
        import faster_whisper  # noqa: F401
        return
    except ImportError:
        pass
    if os.environ.get("IMCP_TRANSCRIRE_REEXEC"):
        print(
            "erreur : faster_whisper introuvable, et aucun environnement dedie.\n"
            "  Installer :  uv venv .venv-whisper && "
            "uv pip install --python .venv-whisper/bin/python faster-whisper",
            file=sys.stderr,
        )
        raise SystemExit(1)
    racine = Path(__file__).resolve().parent.parent
    for candidat in (racine / ".venv-whisper" / "bin" / "python",
                     racine / ".venv" / "bin" / "python",
                     racine / ".venv-whisper" / "Scripts" / "python.exe"):
        if candidat.exists():
            os.environ["IMCP_TRANSCRIRE_REEXEC"] = "1"
            os.execv(str(candidat), [str(candidat), __file__, *sys.argv[1:]])
    print(
        "erreur : faster_whisper introuvable et aucun .venv-whisper a la racine.\n"
        "  Installer :  uv venv .venv-whisper && "
        "uv pip install --python .venv-whisper/bin/python faster-whisper",
        file=sys.stderr,
    )
    raise SystemExit(1)

# Le vocabulaire que les modeles generalistes ecorchent systematiquement.
# Ajouter ici tout terme mal transcrit revu dans une correction du praticien.
AMORCE = (
    "Consultation du Dr Fabrice Baudot, IMCP, Institut de Microchirurgie "
    "Parodontale. Sujets : laser Er-Yag, laser erbium YAG, microchirurgie "
    "parodontale, gencive, muqueuse, sutures, lambeau, parodontite, "
    "cicatrisation, implant, greffe gingivale."
)


# Whisper HALLUCINE sur les silences, en francais surtout : il comble le vide
# avec des mentions de sous-titrage ou d'abonnement qui n'ont jamais ete
# prononcees. Ce n'est pas theorique — la capsule-3204 a recolte
# « Sous-titrage Societe Radio-Canada » a 65,97 s, sur le silence de fin ; il a
# fallu couper a 66,3 s pour l'exclure (voir son BRIEF.md). Un cue fantome est
# doublement nuisible : il ment sur le contenu, et il offre au portail une
# « frontiere de phrase » qui n'existe pas.
HALLUCINATIONS = re.compile(
    r"sous[- ]?titrage|sous[- ]?titres? (?:par|realises)|amara\.org|soustitreur"
    r"|merci d'avoir regarde|abonnez[- ]?vous|a bientot pour une nouvelle video"
    r"|radio[- ]?canada|^\s*merci\s*\.?\s*$|^\s*\.\.\.\s*$",
    re.IGNORECASE,
)


def est_hallucination(texte: str) -> bool:
    return bool(HALLUCINATIONS.search(texte.strip()))


def horodatage_srt(secondes: float) -> str:
    h, reste = divmod(secondes, 3600)
    m, s = divmod(reste, 60)
    ms = int((s - int(s)) * 1000)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{ms:03d}"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source", help="fichier audio ou video")
    p.add_argument("-o", "--sortie", default="cues.json")
    p.add_argument("-m", "--modele", default="small",
                   help="tiny|base|small|medium|large-v3 (defaut: small)")
    p.add_argument("--srt", action="store_true", help="ecrire aussi un .srt")
    p.add_argument("--langue", default="fr",
                   help="langue parlee (fr, en, ...) — forcee, car la detection "
                        "automatique se trompe sur les rushs courts")
    p.add_argument("--amorce", default=AMORCE,
                   help="amorce de vocabulaire (defaut: vocabulaire IMCP)")
    args = p.parse_args()

    if not Path(args.source).exists():
        print(f"erreur : fichier introuvable — {args.source}", file=sys.stderr)
        return 1

    _reexec_si_besoin()
    from faster_whisper import WhisperModel

    modele = WhisperModel(args.modele, device="cpu", compute_type="int8")
    segments, info = modele.transcribe(
        args.source,
        language=args.langue,
        vad_filter=True,          # coupe les silences : evite des cues fantomes
        # L amorce porte le vocabulaire IMCP francais : elle ne peut que nuire
        # a une transcription dans une autre langue.
        initial_prompt=args.amorce if args.langue.startswith("fr") else None,
    )

    # `segments` est un generateur paresseux : la transcription se fait ici.
    bruts = [
        {"s": round(seg.start, 2), "e": round(seg.end, 2), "t": seg.text.strip()}
        for seg in segments
    ]
    cues = [c for c in bruts if not est_hallucination(c["t"])]
    ecartes = [c for c in bruts if est_hallucination(c["t"])]

    Path(args.sortie).write_text(
        json.dumps(cues, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    if args.srt:
        chemin_srt = Path(args.sortie).with_suffix(".srt")
        lignes = [
            f"{i}\n{horodatage_srt(c['s'])} --> {horodatage_srt(c['e'])}\n{c['t']}\n"
            for i, c in enumerate(cues, 1)
        ]
        chemin_srt.write_text("\n".join(lignes), encoding="utf-8")

    duree = info.duration
    print(f"{len(cues)} phrases · {duree:.0f}s d'audio · modele {args.modele}")
    print(f"-> {args.sortie}" + (f" + {Path(args.sortie).with_suffix('.srt')}" if args.srt else ""))

    if ecartes:
        print(f"\n{len(ecartes)} cue(s) ecarte(s) — hallucination de Whisper sur du silence :")
        for c in ecartes:
            print(f"   [{c['s']:.2f} -> {c['e']:.2f}] « {c['t']} »")
        print("   Ces phrases n'ont pas ete prononcees. Ne PAS monter dessus, et ne pas")
        print("   les traiter comme des frontieres de phrase.")
    print("\nRappel doctrine : LIRE la transcription en entier avant de choisir "
          "des timestamps (REGLE 1). Les coupes ne sont permises qu'aux "
          "frontieres ci-dessus (REGLE 0).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
