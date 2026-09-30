# Activer DeepL pour le traducteur du Comptoir

Par défaut, le traducteur vocal utilise Google Traduction (gratuit, sans réglage).
DeepL donne des traductions plus naturelles et, en allemand, **vouvoie le client** (« Sie »).

DeepL interdit l'appel direct depuis une page web : il faut un petit **relais** qui garde la clé secrète.
Tout est gratuit. Compte environ 10 minutes, une seule fois.

## 1. La clé DeepL
1. Crée un compte **DeepL API Free** sur deepl.com/pro-api (500 000 caractères par mois, gratuit ;
   une carte bancaire est demandée pour vérifier l'identité, rien n'est débité).
2. Dans *Compte → Clé d'authentification*, copie la clé (elle finit par `:fx`).

## 2. Le relais (Cloudflare Workers, gratuit)
1. Crée un compte sur dash.cloudflare.com → **Workers & Pages → Créer → Worker**.
2. Remplace le code par le contenu de `docs/deepl-worker.js`, puis **Déployer**.
3. Dans *Paramètres → Variables et secrets* du Worker, ajoute :
   - `DEEPL_KEY` (type **Secret**) : la clé DeepL ;
   - `ALLOWED_ORIGIN` : l'adresse de l'application, sans « / » final
     (ex. `https://dreamnuage6-collab.github.io` ou `https://deutsch.lesmediterranees.com`).
4. Copie l'adresse du Worker (du type `https://deepl-bgd.<ton-nom>.workers.dev`).

## 3. Brancher l'application
Dans `config.js`, colle cette adresse : `deeplProxy: 'https://deepl-bgd.<ton-nom>.workers.dev'`.

C'est tout : le traducteur passe par DeepL. Si DeepL ne répond pas (quota atteint, coupure),
l'application bascule automatiquement sur Google Traduction, sans rien afficher d'anormal.
