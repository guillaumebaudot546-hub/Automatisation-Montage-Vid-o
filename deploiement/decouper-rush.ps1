# Decoupe un rush trop lourd en morceaux envoyables par Telegram (< 2 Go).
#
# Pourquoi : Telegram plafonne a 2 Go par fichier (4 Go avec Premium). Un cours
# de 20 min en qualite d'origine depasse ce seuil. Ce script coupe SANS
# REENCODER : la qualite d'origine est preservee a l'octet pres, ce qui est
# exigE par la doctrine (la recompression est la cause n°1 de rejet du praticien).
#
# Hermes recolle ensuite les morceaux tout seul, egalement sans reencodage.
#
# Usage :
#   .\decouper-rush.ps1 -Source "C:\chemin\cours.mp4"
#   .\decouper-rush.ps1 -Source "C:\chemin\cours.mp4" -TailleMaxGo 1.8
#
# Prerequis : ffmpeg installe et accessible dans le PATH.

param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    # 1,8 Go et non 2 : Telegram compte l'enveloppe du transfert, pas seulement
    # les octets du fichier. Une marge evite un rejet en fin d'envoi.
    [double]$TailleMaxGo = 1.8
)

if (-not (Test-Path $Source)) {
    Write-Host "Fichier introuvable : $Source" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "ffmpeg est introuvable. Installe-le puis relance." -ForegroundColor Red
    Write-Host "  winget install Gyan.FFmpeg" -ForegroundColor Yellow
    exit 1
}

$fichier = Get-Item $Source
$tailleGo = [math]::Round($fichier.Length / 1GB, 2)
Write-Host "Source : $($fichier.Name) — $tailleGo Go"

if ($fichier.Length -lt ($TailleMaxGo * 1GB)) {
    Write-Host "Ce fichier passe deja sous la limite. Aucun decoupage necessaire." -ForegroundColor Green
    exit 0
}

# Duree totale, pour deduire la duree de chaque morceau a partir du debit moyen.
$dureeStr = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Source
$duree = [double]$dureeStr
$nbMorceaux = [math]::Ceiling($fichier.Length / ($TailleMaxGo * 1GB))
$dureeMorceau = [math]::Ceiling($duree / $nbMorceaux)

Write-Host "Duree : $([math]::Round($duree)) s -> $nbMorceaux morceaux d'environ $dureeMorceau s"
Write-Host "Decoupage sans reencodage (qualite d'origine preservee)..." -ForegroundColor Cyan

$dossier = $fichier.DirectoryName
$base = [System.IO.Path]::GetFileNameWithoutExtension($fichier.Name)
$ext = $fichier.Extension
$motif = Join-Path $dossier "$base-partie-%02d$ext"

# -c copy : aucun reencodage. -reset_timestamps 1 : chaque morceau repart a 0,
# sinon le recollage cote serveur produit des horodatages incoherents.
& ffmpeg -hide_banner -loglevel error -i $Source `
    -c copy -map 0 -segment_time $dureeMorceau -f segment -reset_timestamps 1 `
    $motif

if ($LASTEXITCODE -ne 0) {
    Write-Host "Le decoupage a echoue." -ForegroundColor Red
    exit 1
}

Write-Host "`nMorceaux crees :" -ForegroundColor Green
Get-ChildItem -Path $dossier -Filter "$base-partie-*$ext" | ForEach-Object {
    "  {0}  ({1} Go)" -f $_.Name, [math]::Round($_.Length / 1GB, 2)
}

Write-Host "`nEnvoie-les au bot DANS L'ORDRE, en piece jointe (Fichier, pas Galerie)." -ForegroundColor Yellow
Write-Host "Precise au bot qu'il s'agit d'un rush en plusieurs parties : il les recollera." -ForegroundColor Yellow
