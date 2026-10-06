# CodeZero SaaS — base de producción

Esta es la primera base de CodeZero como SaaS multiusuario. Sustituye el prototipo localStorage por:

- Supabase Auth
- PostgreSQL
- Row Level Security
- roles owner/admin/user
- planes y límites mensuales
- consumo de cuotas en servidor/base de datos
- Stripe webhook
- panel administrativo inicial
- progreso persistente por usuario

## Stack

Next.js + React + TypeScript + Supabase + Stripe.

## Arranque

1. Instala Node.js LTS.
2. Crea un proyecto en Supabase.
3. Ejecuta `supabase/migrations/001_initial.sql` en el SQL Editor.
4. Copia `.env.example` a `.env.local` y completa las variables.
5. Ejecuta:

```bash
npm install
npm run dev
```

6. Abre `http://localhost:3000`.

## Primer administrador

Después de crear tu cuenta, cambia manualmente tu `role` a `owner` en Supabase:

```sql
update public.profiles
set role='owner'
where email='TU_EMAIL';
```

No pongas la `SUPABASE_SECRET_KEY` en el navegador. Esa clave solo debe existir en el backend. Supabase indica que las claves secret/service role pueden saltarse RLS y nunca deben exponerse al frontend.

## Stripe

Crea un Price por plan y configura un Checkout Session en el backend. El webhook de ejemplo ya procesa:

- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted

Para producción se debe completar el endpoint de checkout, portal de facturación, idempotencia de eventos y conciliación de estados.

## Cuotas

El RPC `consume_quota()` es deliberadamente server-side y transaccional. La aplicación no debe confiar en un contador enviado por el navegador.

`-1` significa ilimitado.

## Siguiente implementación

1. Migrar los 15 niveles de CodeZero 3.0 a tablas de cursos.
2. Editor de código y ejecución aislada.
3. Motor de ejercicios/exámenes.
4. Checkout Stripe + portal de cliente.
5. Panel admin completo: búsqueda, filtros, suspender, cambiar plan, resetear cuota, métricas.
6. Organizaciones y equipos.
7. IA tutor.
8. Observabilidad, backups, logs y pruebas automatizadas.


## Sitio público

La aplicación incluye una landing pública en `/`, `/about`, `/pricing`, `/login` y el dashboard autenticado.

Para la primera etapa comercial recomendamos desplegar gratuitamente en Vercel. Vercel asignará una URL pública `*.vercel.app`, suficiente para validar CodeZero y configurar Stripe en modo prueba.

Consulta `DEPLOY_VERCEL_SUPABASE.md` para el procedimiento completo. El dominio propio `codezero.app` puede conectarse después, sin cambiar la arquitectura.

## Texto breve para Stripe / presentación comercial

> CodeZero es una plataforma educativa online por suscripción que enseña programación, desarrollo web, APIs, automatización e integraciones SaaS mediante rutas progresivas, ejercicios, evaluaciones y proyectos prácticos. Está dirigida a personas que buscan desarrollar habilidades técnicas aplicables a entornos SaaS y empresariales.

## Checklist antes de aceptar pagos reales

- [ ] Dominio propio
- [ ] HTTPS
- [ ] Política de privacidad
- [ ] Términos y condiciones
- [ ] Política de cancelación/reembolsos
- [ ] Aviso de contacto/soporte
- [ ] Supabase production project
- [ ] Stripe en live mode
- [ ] Stripe Price IDs live
- [ ] Stripe webhook live
- [ ] SMTP/email de producción
- [ ] Backups y logs
- [ ] Pruebas de autorización/RLS
- [ ] Pruebas de límites
- [ ] Pruebas de pago/cancelación/fallo
- [ ] Migración completa de los 15 niveles
