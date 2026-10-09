"use client";
import BrandLogo from "./brand-logo";
import {LATEST_RELEASE} from "../../lib/release-notes";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ORGANIZATION_ROLES,
  type OrganizationRole,
} from "../../lib/organization-metrics";
import LineIcon from "./line-icon";
import LocalizedContent from "./localization/client";
import ProfileAvatar from "./profile-avatar";
import NotificationBell from './notification-bell';
import PageMotion from './page-motion';
import LanguageSelector from "./localization/language-selector";
const publicHeaderPaths = ["/", "/about", "/pricing", "/roadmap", "/login", "/terms", "/privacy", "/refunds", "/contact", "/experience-preview", "/practice-preview", "/modular-preview", "/companies", "/help", "/news"];
type Organization = {
  organization_id: string;
  name: string;
  role: OrganizationRole;
  job_title: string | null;
  can_invite?: boolean;can_view_teams?:boolean;logo_version?:string|null;cover_version?:string|null;
};
const publicPaths = [
  "/",
  "/pricing",
  "/roadmap",
  "/login",
  "/terms",
  "/privacy",
  "/refunds",
  "/contact",
  "/faq",
  "/news",
  "/about",
  "/reset-password",
  "/experience-preview",
  "/practice-preview",
  "/modular-preview",
  "/companies",
  "/verify",
];
export default function VivoShell({
  children,
  newsRead=null,
  name,
  plan,
  organizations,
  selected,
  authenticated,
  roleTrainingActive=false,
  avatarVersion,
  userId,
  operatorRole,
}: {
  children: ReactNode;
  newsRead?:string|null;
  name: string;
  plan: string;
  organizations: Organization[];
  selected: string | null;
  authenticated: boolean;
  roleTrainingActive?:boolean;
  avatarVersion?:string|null;
  userId?:string;
  operatorRole?:string;
}) {
  const path = usePathname();
  const [read,setRead]=useState(newsRead);
  useEffect(()=>setRead(newsRead),[userId,newsRead]);
  useEffect(()=>{if(path==='/news'&&read!==LATEST_RELEASE){fetch('/api/news/read',{method:'POST'}).then(r=>{if(r.ok)setRead(LATEST_RELEASE);}).catch(()=>{});}},[path,read]);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const media = matchMedia("(max-width:900px)");
    const apply = () => {
      if (menu.current) menu.current.open = !media.matches;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [path]);
  if (
    publicPaths.some(
      (p) => path === p || (p === "/verify" && path.startsWith("/verify/")),
    ) ||
    path.startsWith("/auth/") || path.startsWith('/portfolio/share/') || !authenticated
  )
    return (
      <div id="main-content" tabIndex={-1}>
        {!publicHeaderPaths.includes(path) && <div className="vivo-toolbar"><NotificationBell/><LanguageSelector /></div>}
        <PageMotion>{children}</PageMotion>
      </div>
    );
  const requested = path.match(/^\/teams\/([0-9a-f-]{36})(?:\/|$)/)?.[1];
  const org =
    organizations.find((o) => o.organization_id === (requested ?? selected)) ??
    organizations[0];
  const role = org?.role;
  const base = org ? "/teams/" + org.organization_id : "";
  const team = role && (role !== "learner" || org?.can_view_teams),
    company = role === "owner" || role === "admin";
  const home = team ? base + "/people" : "/dashboard";
  const groups = [
    ...(['owner','admin'].includes(operatorRole??'') ? [{title:'PLATAFORMA',items:[['Panel de control','/admin','settings'],...(operatorRole==='owner'?[['Uso por persona','/admin/usage','learning']]:[])]}] : []),
    {
      title: "YO APRENDO",
      items: [
        ["Inicio", "/dashboard", "home"],
        ["Mi ruta", roleTrainingActive?"/positions"+(org?"?organization_id="+org.organization_id:""):"/dashboard?view=learning#my-learning-path", "learning"],
        ...(org ? [["Mis tareas", base + "/tasks", "task"]] : []),
        ["Mis competencias", "/competencies", "learning"],
        ...(roleTrainingActive?[["Mapa de carrera", "/role-training/career-map"+(org?"?organization_id="+org.organization_id:""), "learning"],["Formación por puesto", "/role-training"+(org?"?organization_id="+org.organization_id:""), "learning"],...(org?[["Revisar proyectos", "/role-training/review?organization_id="+org.organization_id, "task"]]:[])]:[]),
        ["Mis certificados", "/certificates", "certificate"],
        ["Comunidad", "/community", "people"],
        ["Mentorías", "/mentoring", "people"],
      ],
    },
    ...(team
      ? [
          {
            title: "MI EQUIPO",
            items: [
              ["Personas", base + "/people", "people"],
              ["Organigrama", base + "/organization", "people"],
              ["Avance", base + "/progress", "learning"],
              ["Fortalezas y áreas de mejora", base + "/skills", "learning"],
              ["Asignar aprendizaje", base + "/assign", "task"],
              ...(roleTrainingActive?[["Aprobación de proyectos", "/role-training/approval-flow?organization_id="+org.organization_id, "task"]]:[]),
            ],
          },
        ]
      : []),
    ...(company
      ? [
          {
            title: "MI EMPRESA",
            items: [
              ["Invitar personas", base + "/invite", "people"],
              ["Puestos y permisos", base + "/permissions", "people"],
              ["Módulos", base + "/modules", "learning"],
              ["Historial de cambios", base + "/history", "task"],
              ...(role === "owner"
                ? [["Facturación", base + "/billing", "settings"]]
                : []),
            ],
          },
        ]
      : []),
    {
      title: "AYUDA",
      items: [
        ...(org?[["Compañía y equipos",base+"/settings","settings"],["Comunicador",base+"/messages","people"],...(!company&&org.can_invite?[["Invitar personas",base+"/invite","people"]]:[])]:[]),
        ["Novedades", "/news", "help"],
        ["Soporte", "/help", "help"],
        ["Ajustes", "/profile", "settings"],
      ],
    },
  ];
  const scopes = {
    owner: "Ves toda la organización, incluida la facturación.",
    admin: "Ves toda la organización. Sin acceso a facturación.",
    manager: "Ves tu rama completa: reportes directos e indirectos.",
    supervisor: "Ves solo a tus reportes directos.",
    learner: "Ves solo tu propio avance y tus competencias.",
  };
  return (
    <div className="vivo-shell">
      <LocalizedContent>
        <aside className="vivo-sidebar">
          <Link prefetch={false} className="vivo-logo" href={home} aria-label="Garciloga"><BrandLogo/></Link>
          {org?.logo_version&&<img decoding="async" alt={org.name} width={64} height={64} style={{objectFit:"contain"}} src={`/api/company/${org.organization_id}/brand?kind=logo&v=${org.logo_version}`}/>}
          {org?.cover_version&&<img loading="lazy" decoding="async" alt="Imagen de compañía" width={220} height={80} style={{objectFit:"cover",maxWidth:"100%"}} src={`/api/company/${org.organization_id}/brand?kind=cover&v=${org.cover_version}`}/>}
          {org && <section className="vivo-position">
            {org ? (
              <>
                <small>
                  Tu puesto en <span translate="no">{org.name}</span>
                </small>
                <strong>
                  {org.job_title ? (
                    <span translate="no">{org.job_title}</span>
                  ) : (
                    ORGANIZATION_ROLES[org.role]
                  )}
                </strong>
                <p>{scopes[org.role]}</p>
              </>
            ) : null}
          </section>}
          <details
            ref={menu}
            open
            className="vivo-mobile-navigation"
            onKeyDown={(event) => {
              if (
                event.key === "Escape" &&
                menu.current &&
                matchMedia("(max-width:900px)").matches
              ) {
                menu.current.open = false;
                menu.current.querySelector("summary")?.focus();
              }
            }}
          >
            <summary>Menú de Garciloga</summary>
            <nav aria-label="Navegación de Garciloga">
              {groups.map((g) => (
                <section key={g.title}>
                  <h2>{g.title}</h2>
                  {g.items.map(([label, href, icon]) => {
                    // A sub-page keeps its section highlighted unless another menu entry matches the address more closely.
                    const nested = (h: string) => !h.includes("#") && h !== "/" && path.startsWith(h + "/");
                    const active = !href.includes("#") && (path === href || (nested(href) && !groups.some(group => group.items.some(([, other]) => other !== href && (other === path || (nested(other) && other.length > href.length))))));
                    return (
                      <Link
                        prefetch={false}
                        key={label}
                        href={href}
                        aria-current={active ? "page" : undefined}
                      >
                        <LineIcon kind={icon} />
                        <span>{label}</span>{href==="/news"&&read!==LATEST_RELEASE&&<span className="news-dot" aria-label="Hay novedades">●</span>}
                      </Link>
                    );
                  })}
                </section>
              ))}
            </nav>
          </details>
          <div className="vivo-account">
            <ProfileAvatar name={name} version={avatarVersion} userId={userId}/>
            <div>
              <strong translate="no">{name}</strong>
              <small>{plan.charAt(0).toUpperCase() + plan.slice(1)}</small>
            </div>
          </div>
        </aside>
      </LocalizedContent>
      <div className="vivo-content" id="main-content" tabIndex={-1}>
        <div className="vivo-toolbar"><NotificationBell/><LanguageSelector /></div>
        <PageMotion>{children}</PageMotion>
      </div>
    </div>
  );
}


