# Demande au service informatique : adresse personnalisée pour l'application

**Objet :** création d'un sous-domaine pour l'application « Beach Garden Deutsch »

Bonjour,

L'application d'apprentissage de l'allemand destinée à l'équipe de la réception est actuellement
publiée gratuitement sur GitHub Pages, à l'adresse :

    https://dreamnuage6-collab.github.io/beach-garden-deutsch/

Afin de disposer d'une adresse plus professionnelle, pourriez-vous créer le sous-domaine suivant
(ou un autre nom de votre choix) :

    deutsch.lesmediterranees.com

## Réglage à effectuer dans la zone DNS de lesmediterranees.com

| Type  | Nom (hôte) | Valeur                         | TTL  |
|-------|------------|--------------------------------|------|
| CNAME | deutsch    | dreamnuage6-collab.github.io.  | 3600 |

Aucune autre modification n'est nécessaire : pas d'hébergement, pas de serveur, pas de coût.
Le certificat HTTPS est fourni automatiquement et gratuitement par GitHub.

## Étapes de notre côté, une fois le réglage fait
1. Dans le dépôt GitHub : **Settings → Pages → Custom domain** → saisir `deutsch.lesmediterranees.com` → **Save**.
2. Cocher **Enforce HTTPS** dès que l'option devient disponible (quelques minutes à quelques heures).
3. Réimprimer l'affiche QR code depuis l'application (**Profil → Partager avec un collègue**) :
   elle utilisera automatiquement la nouvelle adresse.

Merci d'avance,
