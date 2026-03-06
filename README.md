# Delivery App

App mobile (React Native/Expo) para clientes do delivery.

## Pré-requisitos

- Node.js 18+
- Yarn (`npm install -g yarn`)
- Expo Go no celular ou emulador Android/iOS
- [delivery-api](https://gitlab.com/bcm-tech/delivery-api) rodando

## Instalação

```bash
yarn
```

## Variáveis de ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

## Rodando

```bash
yarn start        # Abre o Expo Dev Server (escanear QR code com Expo Go)
yarn android      # Roda no emulador Android
yarn ios          # Roda no simulador iOS
yarn web          # Roda no navegador
```

## Estrutura

- `app/` - Rotas (Expo Router)
- `src/contexts/` - Context providers (Auth, Cart)
- `src/lib/` - Apollo Client e queries/mutations GraphQL
- `src/theme.ts` - Tema do app
