# F1 Manager 2026

Jeu de management F1 dans le navigateur : profils locaux, choix de l'ecurie et
du pilote, calendrier, courses 3D, classements et gestion du budget.

**Jouer : https://melui3.github.io/F1-Manager-2026/**

## Application locale, hebergement statique

Le jeu fonctionne uniquement cote navigateur. Il n'y a plus de backend Django,
de base de donnees distante, d'authentification serveur ni de token requis.
Le moteur de simulation et les sauvegardes font partie de l'application React.
Les anciennes variables `VITE_API_BASE` et `VITE_DEMO_MODE` ne sont plus utilisees.

Chaque manager possede sa propre sauvegarde dans le stockage local du navigateur.
Les sauvegardes existantes restent compatibles. Export/import JSON, changement
de profil et remise a zero complete sont disponibles dans Mon Equipe.
Changer de navigateur ou d'origine (localhost / GitHub Pages) ne transfere pas
automatiquement les parties : utiliser l'export/import pour les retrouver.

L'ancien backend est retire du depot ; son code reste dans l'historique Git.
Aucun hebergement de serveur Python n'est necessaire.

## Developpement

Node.js 22.12+ ou 24 LTS et npm :

```bash
cd frontend
npm ci
npm run dev
```

Ouvrir l'adresse affichee par Vite. Aucun fichier `.env` n'est requis.

```bash
npm test
npx playwright install chromium
npm run test:ui
npm run build
npm run test:production
```

Le test de production sert le build avec le sous-chemin GitHub Pages et verifie
les assets, la sauvegarde, le reset et le parcours calendrier vers course 3D
sans aucune requete backend. Pour utiliser Chrome installe, definir
`PLAYWRIGHT_CHANNEL=chrome`.

## Publication GitHub Pages

Le workflow `.github/workflows/pages.yml` compile et teste le jeu a chaque push
sur `main`, puis publie l'artefact `frontend/dist` avec GitHub Actions.
GitHub Pages doit utiliser la source **GitHub Actions**, pas la branche
historique `gh-pages`. Le workflow est aussi declenchable manuellement depuis
l'onglet Actions du depot.

Un push n'est publie qu'apres le succes du job Deploy. L'URL publique ne change
pas. Le fichier `/F1-Manager-2026/version.json` indique le commit et la date du
build effectivement servi. Les anciens liens `#/start-season` redirigent vers
`#/calendar`. Les assets sont versionnes par Vite ; aucun service worker ne
conserve une ancienne application.

Pour verifier le site public avec le meme test, definir
`PLAYWRIGHT_BASE_URL=https://melui3.github.io/F1-Manager-2026/` avant
`npm run test:production`. Ce test utilise une session de navigateur isolee.

## Stack

React 19, Vite, Tailwind CSS 4, React Router, Lucide et Three.js.
Context API et localStorage pour les profils ; commandes de jeu locales
centralisees dans `frontend/src/services/api.js`. Le nom historique
`mockApi.js` designe le moteur local, pas un service distant.

## Jeu

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
jouees hors ordre par un lien direct. Le pit wall propose une course de
8, 10 ou 12 tours avec :

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
