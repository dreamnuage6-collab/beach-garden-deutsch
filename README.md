# Beach Garden — Sprechen Deutsch 🎧

Application web pour **parler allemand** à la réception du camping Beach Garden
(Les Méditerranées, Marseillan-Plage). Oral uniquement : français + prononciation
« à la française » + **vraie voix allemande pré-enregistrée**.

## 📁 Contenu du dossier
- `index.html` — l'application (tout le contenu + la logique).
- `audio/` — 145 fichiers MP3 (une vraie voix allemande par phrase).
- `audio_map.js` — relie chaque phrase allemande à son MP3 (généré automatiquement).
- `generate_audio.ps1` — (re)génère les MP3 si tu ajoutes/modifies des phrases.

## ▶️ Tester rapidement
Double-clique sur `index.html` : l'app s'ouvre dans ton navigateur.
> ⚠️ En local (double-clic), selon le navigateur l'audio MP3 peut ne pas se charger.
> **L'audio est garanti une fois l'app en ligne** (étapes ci-dessous). Teste donc le son
> sur le lien GitHub Pages.

## 🌐 Mettre en ligne pour avoir TON lien (GitHub Pages)
1. Va sur https://github.com → connecte-toi → **New repository**.
2. Nom : `beach-garden` · coche **Public** · clique **Create repository**.
3. Clique **uploading an existing file**.
4. Fais glisser **tout le contenu de ce dossier** : `index.html`, `audio_map.js`,
   **et le dossier `audio/` entier** (tu peux glisser le dossier directement).
5. En bas, clique **Commit changes**.
6. Onglet **Settings** → **Pages** (menu de gauche) → *Branch* : **main** → **Save**.
7. Patiente 1–2 min : ton app est en ligne sur
   `https://TON-PSEUDO.github.io/beach-garden/`
8. Ouvre ce lien sur PC ou téléphone, clique **🔊 Tester l'audio** : tu dois entendre
   un vrai accent allemand. 🎉

> 💡 Astuce : sur le téléphone, « Ajouter à l'écran d'accueil » pour l'avoir comme une vraie app.

## ✏️ Modifier / ajouter des phrases
1. Ouvre `index.html`, trouve le tableau `P` (phrases) ou `FLOWS` (parcours).
2. Ajoute/modifie une entrée en respectant le format (garde bien `de:"..."` = l'allemand).
3. Régénère les voix : clic droit sur `generate_audio.ps1` → **Exécuter avec PowerShell**
   (ou dans un terminal : `powershell -ExecutionPolicy Bypass -File generate_audio.ps1`).
   Le script lit les phrases du HTML, télécharge les MP3 manquants et met à jour `audio_map.js`.
4. Ré-upload `index.html`, `audio_map.js` et `audio/` sur GitHub.

## 🔊 Comment marche l'audio
Chaque phrase a son MP3 (voix allemande). L'app lit le fichier → **accent allemand correct
partout, sans rien installer**, même hors-ligne une fois la page chargée. Si un MP3 venait à
manquer, l'app se rabat automatiquement sur la synthèse vocale du navigateur.
Le bouton **🐢 Lent** rejoue la phrase au ralenti pour s'entraîner à répéter.
