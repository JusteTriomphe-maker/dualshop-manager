# DualShop Mobile

## Connexion au backend local

Demarrer d'abord l'API depuis le dossier `backend` :

```powershell
npm run dev
```

Au demarrage, le backend affiche une ligne du type :

```text
Adresse pour telephone physique: http://192.168.1.15:3001
```

Utilise cette adresse pour lancer l'app sur un telephone Android physique :

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.15:3001/api/v1
```

Pour l'emulateur Android officiel, l'adresse par defaut reste :

```text
http://10.0.2.2:3001/api/v1
```

Tu peux aussi modifier l'URL depuis l'ecran de connexion avec l'icone de configuration.

## Test rapide

Depuis le navigateur du telephone ou de l'emulateur, ouvre :

```text
http://ADRESSE_DU_BACKEND:3001/api/v1/ping
```

Si le ping ne repond pas, l'app ne pourra pas se connecter non plus. Verifie alors que le backend est lance, que le telephone est sur le meme reseau Wi-Fi que le PC, et que le pare-feu Windows autorise Node.js.
