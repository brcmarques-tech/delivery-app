# Delivery App

App mobile (React Native/Expo) para clientes do delivery.

## Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go no celular ou emulador Android/iOS
- [delivery-api](https://gitlab.com/bcm-tech/delivery-api) rodando

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

## Rodando

```bash
npm start        # Abre o Expo Dev Server (escanear QR code com Expo Go)
npm run android  # Roda no emulador Android
npm run ios      # Roda no simulador iOS
npm run web      # Roda no navegador
```

## Estrutura

- `app/` - Rotas (Expo Router)
- `src/contexts/` - Context providers (Auth, Cart)
- `src/lib/` - Apollo Client e queries/mutations GraphQL
- `src/theme.ts` - Tema do app
