# CodeZero · cierre comercial sin Tutor IA

## Alcance autorizado

Isaac pidió avanzar en todos los pendientes excepto Tutor IA, eliminar costos separados de certificados y exámenes, incorporarlos a los planes y presentar una propuesta. Se conservan los importes actuales; no se crean cargos ni clientes de prueba en Live.

## Implementación de esta entrega

- Política y catálogo: certificados a costo adicional cero; se retira el paquete de exámenes extra y el kit como compra separada.
- Pricing, catálogo, términos, reembolsos y FAQ comunican beneficios y requisitos, conservando cuotas y comprobaciones académicas.
- Customer Success incluido en Pro/Enterprise: ocho explicaciones, casos ficticios, borradores privados, decisiones y feedback, examen, proyecto humano y emisión idempotente del certificado.
- Examen/proyecto comparten cuotas del plan con la formación actual. Duplicados no descuentan otro uso; operaciones y emisión son transaccionales.
- Panel de revisión con cuatro criterios de 25 puntos, feedback y auditoría. Enviar una actividad no acredita dominio por sí solo.
- Mis certificados mantiene acceso a documentos ya emitidos al bajar de plan y publicación por consentimiento.
- Exportación incluye borradores, decisiones, intentos y revisiones propios. Nuevas tablas con RLS, clientes sin escritura y RPCs solo para servicio verificado.
- Python Nivel 2 y SQL Nivel 6 incluyen un caso numérico por intento. Respuesta privada en snapshot del servidor, sin afirmar prevención absoluta de IA externa.
- Kit incluido: CV, STAR, portafolio, candidaturas y presentación con plantillas, ejemplos y revisión de evidencia.

## Soporte operativo

Canal principal: /help y /help/tickets. Owner/admin atienden y asignan las solicitudes desde administración. Se conserva contacto existente; no se envían correos externos en esta entrega. Propuesta interna: revisar la cola en cada jornada y priorizar pagos/acceso generalizado. No publicar una garantía de respuesta en horas hasta contar con cobertura real. Los tickets requieren seguimiento humano; el FAQ cubre preguntas repetidas sin consumo de IA.

## Dominio y correo: propuesta preparada, no comprada

No hay dominio propio en la cuenta Vercel. En la consulta del 7 de octubre:

- aprendecodezero.com: disponible, registro 11.25 USD por 1 año y renovación 11.25 USD por año; no premium.
- codezero.mx: disponible, registro y renovación 49.99 USD por 1 año; no premium.
- codezerolab.com: disponibilidad no confirmada.

Recomendación: aprendecodezero.com por costo. Precios y disponibilidad cambian. Falta elegir dominio, autorizar precio/renovación y proporcionar datos reales de registrante. No asumir que el pedido general autoriza cualquier compra o gasto recurrente.

Una vez registrado: conectar web sin cambiar el correo actual hasta verificar; preparar subdominio de envío, obtener de Resend los registros DKIM/SPF, agregar DMARC con monitoreo inicial, verificar dominio, configurar SMTP seguro en Supabase y probar confirmación/recuperación con cuentas designadas. No inventar registros DNS ni publicar credenciales. Resend ofrece envío transaccional, no se declara un buzón recibido operativo.

Los dos dominios compartidos existentes en Resend permanecen no verificados. No sustituirlos por un remitente falsificado ni enviar como verificado.

## Fiscal y legal: preparación y límites

Revisadas fuentes primarias de SAT, PROFECO y ley vigente de privacidad. Se mejoran páginas públicas de beneficios, certificados, cancelación, ARCO, enlaces públicos y acceso de revisores. Pendientes imprescindibles de datos: domicilio del responsable, RFC/régimen, tratamiento fiscal y proveedor de CFDI. No se inventan ni se declaran registros hechos ante autoridades.

El artículo 15 de la ley de privacidad requiere identidad y domicilio del responsable; mencionar CDMX no resuelve por sí solo el domicilio completo. Falta completar ese dato antes de considerar el aviso integral cerrado. El procedimiento ARCO contempla respuesta de 20 días hábiles y ejecución procedente en 15 posteriores, con excepciones de ley. La comercialización debe conservar derechos irrenunciables del consumidor.

Fuentes:
- https://wwwmat.sat.gob.mx/articulo/67548/articulo-15
- https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo125102.html
- https://www.profeco.gob.mx/tiendasvirtuales/index.html

## Bloqueos comprobados y trabajo que no se declara terminado

- Vercel denegó crear codezero-practice-engine (403); CLI sin autenticación independiente. Python/SQLite público no se habilita sin motor aislado y pruebas reales.
- El conector Stripe solo expone Live. No sustituir un sandbox por cobros Live de prueba. Facturación general de complementos sigue pendiente de entorno de pruebas, desarrollo y validación de lifecycle.
- CodeQL requiere habilitar escaneo en GitHub; la integración no administra esa opción. Auditoría de dependencias sigue activa.
- Recorridos Auth reales y entrega de correo dependen de cuentas/canales verificables. Pruebas de políticas y base de datos no equivalen a prueba con usuario real.
- Simulador generativo, diagnóstico profundo, mentoría, paquetes y ocho rutas futuras no son cursos/servicios terminados por publicar una lista. Continúan indisponibles; no venderlos sin desarrollo, contenido y validación. Tutor IA queda fuera del trabajo autorizado actual.

## Recuperación

Migración aditiva: no elimina datos ni certificados. Volver al commit previo si falla la aplicación, conservando tablas privadas. No revertir mediante borrado de datos de alumnos. Los documentos emitidos no se revocan por cancelación del plan.
