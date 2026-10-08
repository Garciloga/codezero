export const NOTICE_TYPES={assignment:'Asignaciones',review:'Revisiones',weekly:'Casos semanales',invitation:'Invitaciones',ticket:'Respuestas de soporte',message:'Mensajes de compañía',mentoring:'Mentorías',news:'Novedades'} as const;
export type NoticeType=keyof typeof NOTICE_TYPES;
export type Notice={id:string;type:NoticeType;title:string;href:string;at:string;read:boolean};
