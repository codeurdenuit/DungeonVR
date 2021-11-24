# DungonVR

Ce projet est un jeu VR exécutable sur navigateur web.
Il est développé avec threeJS.
J'explique le développement sur https://youtu.be/6Gc-SJBmTzs


## Environnement 

- Node

Ce projet est un site statique, le répertoire **.dist** et **assets** peuvent être servis avec d'autres solutions. S3, PHP, etc

## Installation
```sh
$ npm install
$ npm run build
```

## Démarrer le serveur
```sh
$ npm start
```

## Jouer
Brancher votre casque VR et activer OculusLink si vous êtes sur Quest2
Aller sur l'url http://localhost:3000/ via Chrome ou Firefox
Le bouton **ENTER VR** doit s'afficher. Cliquer dessus et profiter de l'experience.


## Problèmes techniques 
Si votre navigateur n'est pas compatible ou que le casque n'est pas détecté, le bouton affiche **VR NOT SUPPORTED**
Si votre casque est en veille, l'appui sur **ENTER VR** ne va pas fonctionner.
