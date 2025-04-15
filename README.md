# BisousBisous - Plateforme de services à domicile

BisousBisous est une plateforme qui connecte les professionnels du bien-être avec leurs clients pour des services à domicile.

## Fonctionnalités

- Inscription et connexion pour les professionnels et les clients
- Tableau de bord professionnel avec gestion des demandes de service
- Formulaire de demande de service pour les clients
- Interface en français

## Technologies utilisées

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- NextAuth.js
- Prisma

## Prérequis

- Node.js 18.17 ou supérieur
- npm ou yarn

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/bisousbisous.git
cd bisousbisous
```

2. Installez les dépendances :
```bash
npm install
# ou
yarn install
```

3. Configurez les variables d'environnement :
Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :
```env
DATABASE_URL="votre-url-de-base-de-données"
NEXTAUTH_SECRET="votre-secret-nextauth"
NEXTAUTH_URL="http://localhost:3000"
```

4. Lancez le serveur de développement :
```bash
npm run dev
# ou
yarn dev
```

Le site sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
bisousbisous/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── professional/
│   │   └── service-request/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .env.local
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

MIT 