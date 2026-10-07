import { CS_CASE_STAGES, CS_CASE_METRICS } from './customer-success-practical-case.ts';
export const CS_COURSE_VERSION = 'cs-faro-v1';
export const CS_COURSE_KEY = 'route_customer_success';
export const CS_COURSE_UNITS = CS_CASE_STAGES;
export const CS_COURSE_DATA = CS_CASE_METRICS;
export function hasCustomerSuccessCourse(profile: {status?: string;role?:string;plan_name?:string}|null){
 return profile?.status==='active' && (['owner','admin'].includes(profile.role??'') || ['pro','enterprise'].includes(profile.plan_name??''));
}
export const CS_LESSONS = [
 'Un handoff separa compromisos comerciales, capacidades confirmadas y supuestos. Registra para cada vacío una pregunta, un responsable y una fecha. El kickoff puede avanzar sin prometer automatización no validada. Evidencia: alcance firmado o confirmación del responsable; una conversación sin registro no es aceptación.',
 'Un plan de éxito conecta objetivo de negocio, señal de adopción y criterio de primer valor. Define fórmula, línea base, meta, ventana y responsable. En Faro, más accesos no prueban reducción de esfuerzo: mide el tiempo desde cierre de datos hasta aprobación del reporte y concilia su exactitud. La meta de dos días requiere confirmación del sponsor.',
 'El onboarding termina cuando el usuario demuestra una tarea útil con datos y aceptación, no por asistir a capacitación. Ordena permisos, importación, conciliación y validación. Si el CSV es una alternativa permitida, documenta esfuerzo y límites; conserva pendiente la integración automática. Evita introducir datos reales en ejercicios.',
 'La adopción mide repetición de un flujo que produce valor. Distingue usuarios habilitados, usuarios activos y usuarios que entregan el reporte correcto. Una meseta no demuestra desinterés: entrevista a la persona que ejecuta el flujo, busca el obstáculo y define una prueba pequeña con una ventana de medición.',
 'El riesgo combina señales y contexto. No conviertas una señal aislada en certeza de cancelación. Registra impacto, evidencia, hipótesis, responsable y próxima comprobación. Un sponsor nuevo puede cambiar prioridades; confirma el resultado buscado y prepara una alternativa con costo y alcance explícitos.',
 'Una revisión de resultados muestra comparación con la línea base, evidencia y brecha. Reporta con honestidad que el tiempo bajó de cinco a tres días, pero aún no cumple dos. Presenta lo conseguido y lo pendiente con decisiones solicitadas. El reporte debe permitir a otra persona reconstruir el cálculo.',
 'La renovación requiere confirmar valor, alcance, decisor, proceso de compra y fechas. Evita prometer funciones futuras para cerrar. Separa la continuidad del servicio de una expansión opcional y registra objeciones. Un descuento no sustituye resolver una brecha de resultado ni la aprobación del decisor.',
 'La voz del cliente convierte observaciones en propuestas trazables: quién enfrenta el problema, en qué tarea, frecuencia, impacto y evidencia. Separa una solicitud de función del problema subyacente. Cierra el ciclo informando lo revisado y la decisión, sin inventar una fecha de producto. Usa datos ficticios y elimina identificadores personales.',
] as const;
export const CS_CAPSTONE_RUBRIC = [
 'Diagnóstico (25): objetivo, línea base, brecha y riesgos sustentados por el dataset.',
 'Plan (25): responsables, fechas relativas, alcance y alternativas sin promesas no confirmadas.',
 'Verificación (25): fórmulas reproducibles, controles de datos y criterios de aceptación.',
 'Comunicación (25): reporte claro para sponsor, privacidad y decisiones solicitadas.',
] as const;
