# Garciloga — validación exclusiva de Stripe Test (sin cobros reales)

Autorización: utilizar **solo modo de pruebas**. No se autoriza una transacción real ni un reembolso real.

## Estado verificado en esta sesión
La integración de Stripe devuelve únicamente una cuenta con `livemode: true`. **No tenemos una conexión Test autorizada**, así que no se han realizado cargos ni simulaciones contra la API Test de Stripe. Los productos de Programación continúan inactivos.

## Configuración previa, fuera de producción
Usar una cuenta/sesión de Stripe con `livemode: false`, nunca la llave de producción. Ejecutar la app solo en un entorno aislado con secretos privados `STRIPE_TEST_SECRET_KEY` (`sk_test_`), `STRIPE_TEST_WEBHOOK_SECRET` (`whsec_`), precios mensuales de **prueba** `STRIPE_TEST_STARTER_PRICE_ID`, `STRIPE_TEST_PRO_PRICE_ID`, y `STRIPE_TEST_APP_URL`. Nunca colocar esas credenciales en Notion ni GitHub. `stripeTestReadiness` falla si faltan o se detecta `sk_live_`. Esta función verifica **configuración sintáctica**, no autenticación remota.

## Casos de aceptación E2E pendientes (Stripe Test)
1. Seleccionar Starter o Pro con mínimo de cinco asientos, compañía ficticia y autorización explícita; precio MXN correcto, cuota sin alteraciones.
2. Completar Checkout con tarjeta de pruebas y simular evento firmado; verificar solo después del pago que existe **una** organización y exactamente los asientos contratados.
3. Reenviar el mismo webhook; comprobar idempotencia, sin duplicar empresa, asientos ni cobros.
4. Agregar un asiento con actualización pendiente y factura sin pagar; los permisos no deben incrementarse antes de invoice.paid.
5. Intentar reducir por debajo de los asientos usados; rechazarlo. Retirar asientos libres y comprobar sincronización.
6. Simular invoice.payment_failed, pago atrasado, cancelación y webhook fuera de orden; revocar/suspender correctamente, conservar historial y recuperabilidad del evento.
7. Desconectar el webhook y volverlo a procesar; verificar que la organización no aparece pagada por error ni queda una suscripción pagada sin organización recuperable.
8. Ejecutar pruebas de autorización entre distintas empresas, quotas, aislamiento y verificación de logs sin PII.
9. Documentar resultados reales, eventos Stripe Test anonimizados y los ajustes en el roadmap. Solo tras los nueve casos aprobados considerar activación comercial real en una decisión separada.

**No confundir** las pruebas unitarias de precios/reglas o el build con evidencia de un pago de prueba real. El checkout actual de producción no se utiliza para estos escenarios.
