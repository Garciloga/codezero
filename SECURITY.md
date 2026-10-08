# Security Policy

## Reportar una vulnerabilidad

Para reportar de forma responsable un posible problema de seguridad en CodeZero, escribe a:

**codescerooficial@gmail.com**

Incluye, cuando sea posible:

- área o URL afectada;
- pasos reproducibles;
- impacto observado;
- evidencia sin incluir contraseñas, tokens, datos bancarios ni datos personales de terceros.

No publiques credenciales ni datos sensibles en issues, commits o repositorios.

## Alcance

Se consideran especialmente relevantes los problemas relacionados con autenticación, autorización, exposición de soluciones privadas, acceso entre cuentas, manipulación de cuotas, datos personales y facturación.

## Respuesta

CodeZero intentará confirmar recepción, evaluar impacto, contener el problema y desplegar una corrección de acuerdo con la severidad. Este documento no constituye un programa formal de recompensas.

## Controles de CI para el repositorio privado

La sustitución de CodeQL automático fue autorizada por el propietario el 6 de octubre de 2026 para conservar el repositorio privado sin contratar GitHub Code Security. El workflow `CodeZero Security` se ejecuta en PRs a main, pushes a main, manualmente y cada semana. Falla ante hallazgos o errores de las herramientas; no usa `continue-on-error`.

- Semgrep CE 1.179.0, seis reglas locales para ejecución dinámica, ejecución shell, HTML sin revisión de sanitización, TLS deshabilitado, secretos en variables públicas y verificación JWT deshabilitada. Examina `app/` y `lib/`, con modo estricto y pruebas de reglas con ejemplos seguros e inseguros. No sustituye análisis interarchivo, revisión manual de autorización ni pruebas reales de RLS.
- detect-secrets 1.5.0 examina los archivos actuales, no el historial Git. No consulta proveedores para verificar claves ni imprime valores. Excluye dependencias instaladas, salida de compilación, metadatos Git, entornos virtuales, integridad del lockfile y hashes generados de TypeScript. Solo dos placeholders CI concretos están exentos; no hay baseline que acepte hallazgos existentes automáticamente.
- `npm audit --audit-level=low` revisa dependencias de producción y desarrollo y bloquea cualquier severidad conocida. La instalación usa `--ignore-scripts` en el job de seguridad.

No se usa una cuenta Semgrep, reglas remotas, publicación SARIF ni tokens de escaneo. Métricas y consulta de nueva versión están desactivadas. El registro npm recibe los metadatos de dependencias necesarios para auditoría; no recibe el código. GitHub Actions consume los minutos incluidos en el plan; no se contratan servicios ni se autoriza gasto adicional.

CodeQL se conserva como workflow manual, pendiente de una licencia disponible. Un job CodeQL no ejecutado o fallido no se reportará como aprobado. La aprobación del sustituto requiere `Security checks` y `build` exitosos en el commit vigente, además de revisión humana de hallazgos y validación funcional. Si existen branch rules que requieren el nombre antiguo de CodeQL, el administrador debe sustituir ese requisito por `Security checks`; no se desactivan reglas de protección para integrar.

La revisión de paridad del 7 de octubre de 2026 detectó que estos controles habían quedado en la rama histórica aunque el laboratorio educativo ya estaba integrado. Se recuperan sobre la versión productiva actual, conservando el scanner de secretos actualizado y su lista exacta de textos editoriales revisados. Los fixtures inseguros `.security/` se excluyen del compilador, sin relajar el chequeo del código de aplicación. El resultado remoto de cada ejecución debe consultarse; una publicación READY no demuestra que este workflow haya pasado.
