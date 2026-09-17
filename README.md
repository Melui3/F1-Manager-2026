# F1 Manager 2026

Application web de simulation et de gestion inspirée de l’univers de la Formule 1.  
Le projet permet de choisir une écurie, sélectionner un pilote, lancer une saison 2026, simuler les sessions de Grand Prix et suivre l’évolution du classement, du budget et des performances.

## Aperçu

F1 Manager 2026 est pensé comme un jeu de management léger autour d’une saison fictive 2026.

L’utilisateur peut :

- créer ou utiliser un profil ;
- choisir une écurie ;
- sélectionner un pilote ;
- lancer une saison complète ;
- simuler les essais libres, qualifications, sprints et Grands Prix ;
- suivre le classement pilotes ;
- consulter les résultats de session ;
- observer l’évolution des statistiques du pilote ;
- gérer un budget lié aux performances en course.

Le projet inclut également un mode démo permettant de tester l’application sans backend.

## Stack technique

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- React Router DOM
- Lucide React
- Three.js pour les garages et presentations 3D
- gh-pages pour le déploiement

### Données et état

- Context API React
- localStorage pour la persistance utilisateur et partie
- API centralisée via un service `apiFetch`
- Mock API côté client pour le mode démo

## Fonctionnalités principales

### Authentification

L’application prévoit un système de connexion et d’inscription avec gestion de tokens.

Les tokens sont stockés localement et utilisés automatiquement pour les appels API.  
Un mécanisme de refresh token est prévu en cas de réponse `401`.

### Mode démo

Le mode démo permet d’utiliser l’application sans compte réel et sans backend.

Il simule :

- les pilotes ;
- les équipes ;
- le calendrier 2026 ;
- les sessions ;
- les résultats ;
- le budget ;
- l’évolution des statistiques.

Pour l’activer :

```env
VITE_DEMO_MODE=true
VITE_API_BASE=
```

En production, le projet est configure pour tourner en mode client-only par defaut.
Toute la partie jeu est stockee dans `localStorage` :

- profils managers multiples et avatars ;
- choix de l'ecurie et du pilote ;
- calendrier, resultats et historique des sessions ;
- budget, entrainement pilote et R&D ecurie ;
- export/import de sauvegarde depuis la page `Mon Equipe`.

L'ecran d'accueil sert de hub de sessions locales : creer un manager, reprendre
une session, rafraichir la liste, remettre une partie a zero ou supprimer une
sauvegarde. Il n'y a plus de connexion obligatoire en mode client-only.

Pour rebrancher un backend plus tard :

```env
VITE_DEMO_MODE=false
VITE_API_BASE=https://ton-api.example.com
```

### Garage 3D

La page de choix d'ecurie presente une monoplace 3D originale,
avec une livree stylisee par ecurie. Les modeles sont
generes localement : aucun service 3D ni telechargement de modele externe.
La camera propose trois vues, une rotation automatique, une pause et une
manipulation a la souris ou au toucher. Une courte traversee precede la
selection, avec un bouton pour la passer et la touche Echap.

Le choix du pilote dispose d'un showroom distinct : figurine casquee en 3D,
combinaison aux couleurs de l'ecurie, numero personnel et rotation libre ou
au clavier. Le mode Portrait affiche la vraie photo. Choisir une carte pilote
est immediat, sans rejouer la traversee de voiture. La figurine est une creation
procedurale stylisee, pas un scan du pilote. Pour un rendu fidele du visage,
il faudrait un modele 3D texture adapte (par exemple GLB) et ses droits d'usage.

Les logos couleur sont stockes dans `frontend/public/teams`, avec provenance
dans `SOURCES.md`. Certaines marques ont un logo naturellement monochrome.
Les visuels des 24 week-ends sont locaux, avec leurs URLs sources dans
`frontend/public/circuits/sources.json`. Ces fichiers ne conferent pas de
licence de redistribution ou d'utilisation commerciale.

La preference systeme de reduction des animations est respectee. En l'absence
de WebGL, les logos prennent le relais et la selection reste disponible.
Le moteur 3D est charge a la demande et suspend son rendu hors ecran.

Tests de navigation, de rendu 3D et d'accessibilite :

```bash
cd frontend
npx playwright install chromium
npm run test:ui
```

Pour utiliser un Chrome deja installe, definir `PLAYWRIGHT_CHANNEL=chrome`.
Les tests utilisent des sessions temporaires de navigateur, sans toucher aux
sauvegardes existantes.

### Mini-GP jouable

Depuis `/#/calendar`, choisir `Simuler` sur la manche actuelle pour ouvrir
`/#/race/:sessionIndex`, puis `Prendre le depart`. Une course interrompue
affiche `Reprendre`. Les resultats termines sont places au-dessus de la manche
actuelle et les week-ends a venir en dessous. Les anciens liens `start-season`
et `race-live` restent compatibles. Les manches futures ne peuvent pas etre
jouees hors ordre par un lien direct. Le mode client-only n'expose plus de
bouton de simulation rapide concurrent. Le mode backend conserve son ancien
calendrier. Le pit wall propose une course de 8, 10 ou 12 tours avec :

- une piste 3D animee, une vue d'ensemble manipulable et une camera de suivi ;
- une grille issue des qualifications, preparees automatiquement si necessaire ;
- trois rythmes de conduite, quatre gommes, l'usure et les degats ;
- des averses, une prevision d'humidite et des interventions de Safety Car ;
- des arrets aux stands qui coutent du temps et 90 000 de budget ;
- la radio ingenieur, un classement et un bilan tour par tour ;
- les commandes pause, reprise, vitesse x1/x2/x4 et avance d'un tour en pause.

Chaque tour et chaque consigne sont sauvegardes dans le profil local. Une
reouverture reprend la course en pause, au dernier tour termine. L'arrivee
enregistre les points, la progression, la prime et les frais en une seule
operation. Les requetes repetees ne doublent ni le tour ni la recompense.
Les navigateurs compatibles Web Locks serialisent aussi les actions entre
onglets. En cas d'echec de sauvegarde, le tour n'est pas consomme.

Une course en cours bloque la simulation rapide, les transferts et les
ameliorations. Le reset complet du profil efface aussi cette course. Les
exports/imports contiennent sa progression. Aucun backend n'est necessaire.

Les traces 3D sont fictifs et les regles volontairement simplifiees : ce mode
est un mini-jeu de strategie, pas une reproduction officielle des circuits
ou du reglement sportif. Sans WebGL, le chronometrage et les commandes
restent jouables. La reduction des animations desactive les mouvements 3D
et les feux animes, sans empecher l'avancement de la course.

`npm test` couvre le moteur, les comptes, l'economie et les sauvegardes.
`npm run test:ui` couvre aussi le mini-GP, son rendu desktop/mobile, la reprise,
les commandes et le mode sans WebGL.
