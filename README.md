# Beach Garden Deutsch 🎧

Application web pour **parler allemand à la réception** du camping Beach Garden
(Les Méditerranées, Marseillan-Plage). Direction artistique blanc et bordeaux aux couleurs de l'établissement. Leçons courtes,
XP, série de jours, objectif quotidien, et **vraie voix allemande** pour chaque phrase.

## Les cinq espaces de l'application
| Espace | À quoi ça sert |
|---|---|
| **Apprendre** | Parcours de 14 unités (accueil, politesse, comprendre les clients, nombres, réservation…). Chaque leçon mélange cinq types d'exercices : compréhension orale, vocabulaire, construction de phrase, association de paires et prononciation à voix haute (si le téléphone le permet). XP, série, objectif du jour, révision des erreurs. |
| **Comptoir** | **Traducteur vocal en direct** (toi et le client parlez, l'app affiche et lit la traduction français ↔ allemand ; internet requis) et phrases du quotidien en un geste, affichées en grand pour le client. |
| **Situations** | Onze scénarios de comptoir pas à pas (arrivée avec réservation, client de passage, visiteur, départ, bruit, panne, ménage, animations, spa, restaurant, réservation par téléphone) présentés comme une conversation : ce que tu dis, ce que le client peut répondre, avec l'audio des deux côtés. |
| **Phrases** | Le guide de conversation complet : thèmes, bases, **mémo règlement** (règlement intérieur, FAQ et CGV de lesmediterranees.com), favoris, recherche (français ou allemand, sans tenir compte des accents) et guide de prononciation. |
| **Profil** | Prénom, statistiques, objectif quotidien, réglages (affichage de la prononciation, effets sonores), test du son. |

La progression est enregistrée **sur l'appareil** (navigateur), sans compte ni serveur.

## 📲 Installer l'application sur les téléphones de l'équipe
Aucune boutique d'applications, aucun compte à créer :
1. Dans l'app (sur l'ordinateur de la réception) : **Profil → Partager avec un collègue → Imprimer l'affiche**.
2. Le collègue vise le QR code de l'affiche avec **l'appareil photo** de son téléphone et touche le lien.
3. L'application s'ouvre et lui montre quoi faire :
   - **Android** : un bouton **« Installer »**, un seul geste ;
   - **iPhone** : deux gestes (Partager → « Sur l'écran d'accueil »), avec une flèche qui montre où toucher.

L'icône des Méditerranées apparaît ensuite sur l'écran d'accueil. L'app s'ouvre en plein écran,
fonctionne **sans internet** (voix comprises) et se **met à jour toute seule** à chaque nouvelle version.

## 🔔 Rappel quotidien (facultatif)
Les notifications passent par OneSignal (gratuit) :
1. Crée un compte sur onesignal.com, puis une application **Web** avec l'adresse GitHub Pages de l'app.
2. Copie l'**App ID** dans `config.js` (`onesignalAppId: '…'`).
3. Dans OneSignal, programme le message « C'est l'heure de ta leçon du jour ! ».

Tant que l'App ID est vide, les notifications restent désactivées. Sur iPhone, elles ne fonctionnent
qu'une fois l'app installée sur l'écran d'accueil (iOS 16.4 ou plus récent).

## 📁 Contenu du dossier
- `index.html` : l'application (contenu, design et logique).
- `audio/` + `audio_map.js` : une voix allemande native (MP3) par phrase.
- `generate_audio.ps1` : (re)génère les MP3 si tu ajoutes ou modifies des phrases.
- `manifest.webmanifest`, `sw.js`, `icons/` : ce qui rend l'app installable et utilisable hors connexion.
- `brand/logo.png` : logo des Méditerranées · `vendor/qrcode.js` : générateur de QR code (licence MIT).
- `config.js` : réglage des notifications.
- `fonts/` : polices intégrées (aucun appel à Google Fonts : plus rapide, hors connexion, conforme RGPD).
- `docs/` : demande de nom de domaine pour le service informatique.

## 🌐 Mise en ligne (GitHub Pages)
Pour une adresse du type `deutsch.lesmediterranees.com`, la demande à transmettre au service informatique est prête : `docs/demande-nom-de-domaine.md`.

Settings → Pages → *Branch* : **main** → **Save**. Chaque modification fusionnée dans `main`
est en ligne une à deux minutes plus tard, et les téléphones la récupèrent automatiquement.

## ✏️ Modifier ou ajouter des phrases
1. Dans `index.html`, modifie le tableau `P` (phrases) ou `FLOWS` (situations).
   Chaque phrase a trois champs : `fr` (français), `de` (allemand) et `ph` (prononciation).
2. ⚠️ Le texte `de:"…"` sert de clé au fichier audio : si tu le modifies, relance
   `generate_audio.ps1` (clic droit → **Exécuter avec PowerShell**) pour régénérer la voix.
   Sinon, l'app utilise automatiquement la synthèse vocale du navigateur pour cette phrase.
3. Le français, la prononciation et les libellés peuvent être modifiés librement.
