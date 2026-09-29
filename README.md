# Beach Garden Deutsch 🎧

Application web pour **parler allemand à la réception** du camping Beach Garden
(Les Méditerranées, Marseillan-Plage). Inspirée de Duolingo : leçons courtes,
XP, série de jours, objectif quotidien, et **vraie voix allemande** pour chaque phrase.

## Les quatre espaces de l'application
| Espace | À quoi ça sert |
|---|---|
| **Apprendre** | Parcours de 13 unités (accueil, politesse, nombres, réservation…). Chaque leçon mélange quatre types d'exercices : compréhension orale, vocabulaire, construction de phrase et association de paires. XP, série, objectif du jour, révision des erreurs. |
| **Situations** | Cinq scénarios de comptoir pas à pas (client de passage, départ, bruit, panne, réservation par téléphone) présentés comme une conversation : ce que tu dis, ce que le client peut répondre, avec l'audio des deux côtés. |
| **Phrases** | Le guide de conversation complet : thèmes, bases, favoris, recherche (français ou allemand, sans tenir compte des accents) et guide de prononciation. |
| **Profil** | Prénom, statistiques, objectif quotidien, réglages (affichage de la prononciation, effets sonores), test du son. |

La progression est enregistrée **sur l'appareil** (navigateur), sans compte ni serveur.

## 📁 Contenu du dossier
- `index.html` : l'application (contenu, design et logique).
- `audio/` : un MP3 par phrase allemande (voix native).
- `audio_map.js` : relie chaque phrase allemande à son MP3 (généré automatiquement).
- `generate_audio.ps1` : (re)génère les MP3 si tu ajoutes ou modifies des phrases.

## 🌐 Mise en ligne (GitHub Pages)
Settings → Pages → *Branch* : **main** → **Save**. Après une ou deux minutes, l'app est en ligne sur
`https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

> 💡 Sur téléphone : « Ajouter à l'écran d'accueil » pour l'utiliser comme une vraie application.

## ✏️ Modifier ou ajouter des phrases
1. Dans `index.html`, modifie le tableau `P` (phrases) ou `FLOWS` (situations).
   Chaque phrase a trois champs : `fr` (français), `de` (allemand) et `ph` (prononciation).
2. ⚠️ Le texte `de:"…"` sert de clé au fichier audio : si tu le modifies, relance
   `generate_audio.ps1` (clic droit → **Exécuter avec PowerShell**) pour régénérer la voix.
   Sinon, l'app utilise automatiquement la synthèse vocale du navigateur pour cette phrase.
3. Le français, la prononciation et les libellés peuvent être modifiés librement.
