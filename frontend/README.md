# F1 Manager 2026 - Application navigateur

Tout le jeu fonctionne localement dans le navigateur, sans backend ni compte
serveur. Les donnees de partie sont stockees par profil dans localStorage.

## Commandes

- `npm ci` : installer les dependances.
- `npm run dev` : lancer Vite pour le developpement.
- `npm test` : tester le moteur, l'economie et les sauvegardes.
- `npm run test:ui` : tester les parcours utilisateur et le rendu 3D.
- `npm run build` : compiler le site statique dans `dist`.
- `npm run preview` : servir le build localement.
- `npm run test:production` : tester le build au chemin GitHub Pages.

Les tests navigateur necessitent `npx playwright install chromium` ou
`PLAYWRIGHT_CHANNEL=chrome` pour un Chrome installe.

## Publication

Les pushes sur `main` declenchent le workflow GitHub Pages a la racine du depot.
Il n'y a plus de commande de deploiement manuelle vers `gh-pages`.
Voir le [README du projet](../README.md) pour le site public et la configuration.
