"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ORGANIZATION_ROLES,
  type OrganizationRole,
} from "../../lib/organization-metrics";
import LineIcon from "./line-icon";
import LocalizedContent from "./localization/client";
import ProfileAvatar from "./profile-avatar";
import LanguageSelector from "./localization/language-selector";
const publicHeaderPaths = ["/", "/pricing", "/roadmap", "/login", "/terms", "/privacy", "/refunds", "/contact", "/experience-preview", "/practice-preview", "/modular-preview"];
type Organization = {
  organization_id: string;
  name: string;
  role: OrganizationRole;
  job_title: string | null;
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
  "/about",
  "/reset-password",
  "/experience-preview",
  "/practice-preview",
  "/modular-preview",
  "/verify",
];
export default function VivoShell({
  children,
  name,
  plan,
  organizations,
  selected,
  authenticated,
  roleTrainingActive=false,
  avatarVersion,
  userId,
}: {
  children: ReactNode;
  name: string;
  plan: string;
  organizations: Organization[];
  selected: string | null;
  authenticated: boolean;
  roleTrainingActive?:boolean;
  avatarVersion?:string|null;
  userId?:string;
}) {
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const media = matchMedia("(max-width:700px)");
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
    path.startsWith("/auth/") || !authenticated
  )
    return (
      <div id="main-content" tabIndex={-1}>
        {!publicHeaderPaths.includes(path) && <div className="vivo-toolbar"><LanguageSelector /></div>}
        {children}
      </div>
    );
  const requested = path.match(/^\/teams\/([0-9a-f-]{36})(?:\/|$)/)?.[1];
  const org =
    organizations.find((o) => o.organization_id === (requested ?? selected)) ??
    organizations[0];
  const role = org?.role;
  const base = org ? "/teams/" + org.organization_id : "";
  const team = role && role !== "learner",
    company = role === "owner" || role === "admin";
  const home = team ? base + "/people" : "/dashboard";
  const groups = [
    {
      title: "YO APRENDO",
      items: [
        ["Inicio", "/dashboard", "home"],
        ["Mi ruta", "/dashboard?view=learning#my-learning-path", "learning"],
        ...(org ? [["Mis tareas", base + "/tasks", "task"]] : []),
        ["Mis competencias", "/competencies", "learning"],
        ...(roleTrainingActive?[["Formación por puesto", "/role-training"+(org?"?organization_id="+org.organization_id:""), "learning"],...(org?[["Revisar proyectos", "/role-training/review?organization_id="+org.organization_id, "task"]]:[])]:[]),
        ["Mis certificados", "/certificates", "certificate"],
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
          <Link prefetch={false} className="vivo-logo" href={home}>
            Garciloga
          </Link>
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
                matchMedia("(max-width:700px)").matches
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
                    const active = !href.includes("#") && path === href;
                    return (
                      <Link
                        prefetch={false}
                        key={label}
                        href={href}
                        aria-current={active ? "page" : undefined}
                      >
                        <LineIcon kind={icon} />
                        <span>{label}</span>
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
        <div className="vivo-toolbar"><LanguageSelector /></div>
        {children}
      </div>
    </div>
  );
}
