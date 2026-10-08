import LocalizedContent from "./localization/server";
import Link from 'next/link';
import LineIcon from './line-icon';
export default function LearningNavigation({teamsEnabled=false,practiceEnabled=false}:{teamsEnabled?:boolean;practiceEnabled?:boolean}){
 const items=[{href:'/leadership',title:'Liderazgo y procesos',detail:'Practica de colaborador a directivo'},{href:'#my-learning-path',title:'Continuar mi camino',detail:'Niveles, práctica y diplomas'},{href:'/profile',title:'Mi espacio',detail:'Apariencia y preferencias de cuenta'},...(practiceEnabled?[{href:'/practice',title:'Explorar decisiones',detail:'Casos, decisiones y próximos pasos'}]:[]),...(practiceEnabled?[{href:'/certificates',title:'Mis certificados',detail:'Documentos incluidos al aprobar'}]:[]),...(practiceEnabled?[{href:'/customer-success',title:'Customer Success',detail:'Curso práctico incluido en Pro y Enterprise'}]:[]),...(practiceEnabled?[{href:'/modules',title:'Módulos',detail:'Catálogo y listas de espera'}]:[]),...(teamsEnabled?[{href:'/teams',title:'Mis equipos',detail:'Organizaciones y avance autorizado'}]:[])];
 return <LocalizedContent><nav className="learning-navigation" aria-label="Accesos a mi aprendizaje">{items.map(x=><Link prefetch={false} href={x.href} key={x.href}><LineIcon kind={x.href==="/teams"?"people":"learning"}/><div><strong>{x.title}</strong><small>{x.detail}</small></div></Link>)}</nav></LocalizedContent>;
}


