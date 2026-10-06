# Arquitectura objetivo

```text
                    ┌───────────────────────┐
                    │      codezero.app     │
                    │      Next.js web      │
                    └───────────┬───────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
          Supabase Auth                 Next.js Server
          JWT / sessions                API / server actions
                 │                             │
                 └──────────────┬──────────────┘
                                │
                         PostgreSQL + RLS
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
          Usuarios            Progreso          Cuotas
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                             Stripe
                    suscripciones / webhooks
```

## Principio de seguridad

El navegador nunca decide:

- qué plan tiene el usuario
- cuánto ha consumido
- si una acción está permitida
- si una suscripción está activa
- si un usuario es administrador

Esos datos deben validarse en backend/database.

Supabase RLS protege las filas y permite combinar autenticación con autorización. Las claves secretas permanecen exclusivamente en el servidor.

## Modelo comercial

Los planes son datos, no lógica fija del frontend:

`plans -> entitlements -> usage_monthly -> consume_quota()`

Esto permite cambiar precios y límites sin redistribuir la aplicación.

## Escalabilidad futura

La siguiente capa será multi-tenant:

`organizations -> memberships -> subscriptions -> seats -> usage`

Esto permitirá vender:

- B2C individual
- equipos
- academias
- empresas
- planes Enterprise
- SSO
