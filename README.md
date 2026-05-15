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
