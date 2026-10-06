# CodeZero — despliegue gratuito inicial

Objetivo: publicar CodeZero en Vercel usando Supabase como backend/base de datos. El sitio inicial tendrá una URL gratuita tipo `https://codezero-xxx.vercel.app`.

## 1. Crear Supabase

1. Entra a Supabase y crea un proyecto nuevo.
2. Abre **SQL Editor**.
3. Ejecuta completo `supabase/migrations/001_initial.sql`.
4. En **Project Settings → API** copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Secret key → `SUPABASE_SECRET_KEY`
5. Configura el correo de autenticación de Supabase para pruebas. Para producción conviene configurar SMTP propio.

## 2. Subir CodeZero a GitHub

Desde esta carpeta:

```bash
git init
git add .
git commit -m "CodeZero commercial starter"
git branch -M main
git remote add origin TU_REPOSITORIO
 git push -u origin main
```

Nunca subas `.env.local` ni claves secretas.

## 3. Crear el proyecto en Vercel

1. Importa el repositorio desde GitHub.
2. Framework: Next.js.
3. Build command: `next build`.
4. Deploy.
5. Vercel asignará una URL `vercel.app`.

## 4. Variables de entorno en Vercel

Configura estas variables en **Project Settings → Environment Variables**:

```text
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICABLE
SUPABASE_SECRET_KEY=TU_CLAVE_SECRETA
NEXT_PUBLIC_APP_URL=https://TU-PROYECTO.vercel.app

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=
ADMIN_EMAIL=TU_EMAIL
```

Las variables que empiezan por `NEXT_PUBLIC_` pueden llegar al navegador. **Nunca** pongas una clave secreta de Stripe ni `SUPABASE_SECRET_KEY` con ese prefijo.

## 5. Configurar Supabase Auth

En Supabase, configura la URL principal del sitio con la URL de Vercel y añade las URLs de redirección que use la aplicación.

Cuando posteriormente tengamos dominio propio, cambiaremos la URL principal a:

```text
https://codezero.app
```

## 6. Crear el primer propietario

Después de registrar tu cuenta en CodeZero, ejecuta en Supabase:

```sql
update public.profiles
set role = 'owner'
where email = 'TU_EMAIL';
```

Después entra en `/admin`.

## 7. Stripe

No necesitas conectar Stripe para publicar primero el sitio.

Para pruebas, crea los Prices de Starter, Pro y Enterprise y añade sus IDs a las variables de entorno. Después configura el webhook de Stripe apuntando a:

```text
https://TU-PROYECTO.vercel.app/api/stripe/webhook
```

Para producción usa Stripe Live Mode y las claves Live correspondientes.

## 8. URL final

Primera etapa:

```text
https://TU-PROYECTO.vercel.app
```

Etapa comercial posterior:

```text
https://codezero.app
```

El dominio propio no es necesario para validar el producto, pero sí es recomendable antes de una campaña comercial importante.

## 9. Qué queda pendiente antes de cobrar de forma real

- completar portal de cliente Stripe;
- idempotencia y reconciliación de webhooks;
- políticas legales y reembolsos;
- SMTP de producción;
- migración completa de los 15 niveles;
- motor real de ejercicios/exámenes;
- ejecución aislada de código;
- pruebas RLS y autorización;
- backups, logs y observabilidad;
- pruebas de pagos, cancelaciones y fallos.
