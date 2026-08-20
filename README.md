# Campaign File Portal

Portal Next.js para administrar clientes, campañas, usuarios y cargas CSV. En
producción, Amplify consume una API publicada con API Gateway y Lambda; solo la
Lambda y el worker acceden a MySQL.

La guía de construcción, permisos, VPC sin NAT, API Gateway y despliegue está en
[`lambda/README.md`](lambda/README.md).

## Desarrollo local

Copiar `.env.example` como `.env.local`, completar las variables y ejecutar:

```bash
npm ci
npm run dev
```

## Validación

```bash
npm run lint
npm run build
npm run build:lambda
```
