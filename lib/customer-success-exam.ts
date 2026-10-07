import 'server-only';
export const CS_EXAM = [
 {prompt:'Una integración fue prometida sin evidencia. ¿Qué haces?',options:['Confirmarla para mantener el calendario','Registrar el vacío y asignar validación de alcance','Cerrar el handoff sin cambios'],correct:1},
 {prompt:'¿Qué métrica comprueba el objetivo de preparar un reporte más rápido?',options:['Número de logins','Asistencia a capacitación','Días desde cierre de datos hasta aprobación, con control de exactitud'],correct:2},
 {prompt:'¿Cuándo se comprueba primer valor?',options:['Al demostrar el flujo acordado con evidencia y aceptación','Al enviar un manual','Al terminar una reunión'],correct:0},
 {prompt:'La adopción se estancó. ¿Qué siguiente paso aporta evidencia?',options:['Enviar más recordatorios sin diagnóstico','Investigar el obstáculo del flujo y medir una prueba acotada','Asegurar que el cliente no tiene interés'],correct:1},
 {prompt:'Cambió el sponsor. ¿Qué conclusión es apropiada?',options:['La cancelación es segura','La meta anterior se conserva por defecto','Hay que confirmar objetivos y decisor antes de concluir'],correct:2},
 {prompt:'El reporte bajó de 5 a 3 días y la meta es 2. ¿Cómo lo comunicas?',options:['Hay mejora, la meta aún no se cumple y falta revisar la brecha','La meta ya se cumplió','No hubo mejora'],correct:0},
 {prompt:'Una renovación depende de una función futura. ¿Qué debes hacer?',options:['Prometer una fecha no validada','Explicar alcance disponible y registrar la dependencia','Omitir la dependencia'],correct:1},
 {prompt:'¿Qué registro de voz del cliente es accionable?',options:['Una lista de funciones sin contexto','Una opinión atribuida a toda la cartera','Problema, tarea, frecuencia, impacto y evidencia sin datos personales'],correct:2},
] as const;
export function gradeCustomerSuccessExam(answers:unknown){
 if(!Array.isArray(answers)||answers.length!==CS_EXAM.length||answers.some(x=>!Number.isInteger(x)||x<0||x>2))throw Error('INVALID_ANSWERS');
 const score=Math.round(100*answers.filter((x,i)=>x===CS_EXAM[i].correct).length/CS_EXAM.length);
 return {score,passed:score>=75};
}
