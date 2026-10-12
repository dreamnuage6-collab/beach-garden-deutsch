# Beach Garden Deutsch 🎧

Application web pour **parler allemand à la réception** du camping Beach Garden
(Les Méditerranées, Marseillan-Plage). Direction artistique blanc et prune aux couleurs de l'établissement. Leçons courtes,
XP, série de jours, objectif quotidien, et **vraie voix allemande** pour chaque phrase.

## Deux onglets
| Onglet | À quoi ça sert |
|---|---|
| **Parcours** | Apprendre à se débrouiller en allemand, **à l'oral uniquement** (écouter le client, puis parler). Cinq **diplômes** à débloquer dans l'ordre : **Check-in client** (10 niveaux), Check-out, Infos camping, Problèmes, Téléphone. Chaque niveau réussi ouvre le suivant (un test court permet de sauter un niveau déjà maîtrisé). Un **examen final** (8 bonnes réponses sur 10) donne le **badge** du diplôme, de ★ Hôte d'accueil à ★★★★★ Ambassadeur·rice Beach Garden. L'exercice « Dis-le en allemand » est corrigé au micro quand le navigateur le permet (internet nécessaire) ; sinon, la personne le dit à voix haute et vérifie elle-même. |
| **Comptoir** | Pour un client devant soi. **Traducteur vocal en direct** (français ↔ allemand, internet requis ; Google Traduction par défaut, **DeepL** en option : voir `docs/deepl.md`), avec un mode **« Face au client »** et les conversations du jour gardées jusqu'au lendemain. Quand la phrase dite correspond à une **phrase validée**, elle est reprise telle quelle et lue aussitôt ; sinon la traduction est marquée **« à vérifier »**. **Prix, heures et dates** en allemand (hors connexion). **Phrases express** en un geste. Lien **« Toutes les phrases et le mémo »** : situations pas à pas, phrases par thème, mémo règlement, prononciation, recherche. |

Le profil (initiale en haut à droite) montre **Mes badges**, le titre obtenu et les réglages.

Sur un **ordinateur** (écran d'au moins 1 200 px), l'app devient un poste de travail :
- **Comptoir** : traducteur, prix/heures/dates et phrases rangées par situation (Arrivée, Paiement, Départ, Infos et Wi-Fi, Problème, Bruit, Se comprendre, Au revoir, Favoris), avec un filtre Emplacement / Mobil-home. Une phrase choisie s'affiche d'abord en **aperçu** (rien ne se lit tout seul), puis Écouter, Lent ou **Montrer au client** (plein écran, texte à l'endroit, taille réglable). Cartes guidées pour une **intervention** (technicien ou ménage, autorisation d'entrer obligatoire) et pour le **bruit** (sécurité et voisins). **Phrases à compléter** (numéro d'emplacement, tarif, acompte, créneau au spa, table, spectacle) : le modèle allemand est validé, seule la valeur saisie est calculée. Recherche avec liste de résultats au clavier, bouton **Nouveau client**. Sur les écrans d'au moins 1 600 px, tout tient en trois colonnes.
- **Parcours** : le diplôme en cours et ses niveaux à gauche, les badges à droite.

Raccourcis (jamais pendant une saisie) : <kbd>/</kbd> rechercher, <kbd>Alt</kbd>+<kbd>T</kbd> traducteur, <kbd>Alt</kbd>+<kbd>P</kbd> prix, heures et dates, <kbd>Alt</kbd>+<kbd>L</kbd> écouter la phrase choisie, <kbd>Échap</kbd> fermer. Aucun raccourci n'active le micro.

La progression (niveaux et badges) est enregistrée **sur l'appareil** (navigateur), sans compte ni serveur.

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
- `audio/` + `audio_map.js` : une voix allemande (MP3, voix de synthèse) par phrase. L'état réel des voix disponibles hors connexion s'affiche dans Profil.
- `generate_audio.ps1` : (re)génère les MP3 si tu ajoutes ou modifies des phrases (`-Nettoyer` retire les MP3 devenus inutiles).
- `tools/verifier.js` : contrôle avant publication (`node tools/verifier.js`) : chaque phrase allemande a sa voix, les clés des phrases sont uniques, chaque phrase du Comptoir existe dans le corpus validé, le code est valide.
- `manifest.webmanifest`, `sw.js`, `icons/` : ce qui rend l'app installable et utilisable hors connexion.
- `brand/logo.png` : logo des Méditerranées · `vendor/qrcode.js` : générateur de QR code (licence MIT).
- `config.js` : réglage des notifications et du traducteur DeepL.
- `fonts/` : polices intégrées (aucun appel à Google Fonts : plus rapide, hors connexion, conforme RGPD).
- `docs/` : demande de nom de domaine pour le service informatique, activation de DeepL (`deepl.md` + `deepl-worker.js`).

## 🌐 Mise en ligne (GitHub Pages)
Pour une adresse du type `deutsch.lesmediterranees.com`, la demande à transmettre au service informatique est prête : `docs/demande-nom-de-domaine.md`.

Settings → Pages → *Branch* : **main** → **Save**. Chaque modification fusionnée dans `main`
est en ligne une à deux minutes plus tard, et les téléphones la récupèrent automatiquement.

## ✏️ Modifier ou ajouter des phrases
1. Dans `index.html`, modifie le tableau `P` (phrases), `PV` (phrases courtes du parcours), `FLOWS` (situations) ou `DIPLOMAS` (niveaux et examens, qui désignent les phrases par leur texte allemand).
   Chaque phrase a trois champs : `fr` (français), `de` (allemand) et `ph` (prononciation).
2. ⚠️ Le texte `de:"…"` sert de clé au fichier audio : si tu le modifies, relance
   `generate_audio.ps1` (clic droit → **Exécuter avec PowerShell**) pour régénérer la voix.
   Sinon, l'app utilise automatiquement la synthèse vocale du navigateur pour cette phrase.
3. Le français, la prononciation et les libellés peuvent être modifiés librement.
4. Chaque phrase a aussi une **clé** (`k:"p12"`, `k:"fcheckin.1.5"`…) qui ne change jamais : favoris et erreurs à revoir en dépendent.
   Une nouvelle phrase s'ajoute **à la fin** du tableau `P`, avec la clé suivante.
5. Avant de publier, lance `node tools/verifier.js` : il signale toute voix manquante, clé en double ou phrase du Comptoir introuvable.
