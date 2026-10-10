/** Localized case-specific written practice; generated with each role curriculum. */
export const ROLE_WRITTEN_GUIDES = {
  "onboarding": {
    "es": "un plan de incorporación con hitos, dependencias, traspaso y primer valor",
    "en": "an onboarding plan with milestones, dependencies, handoff and time-to-first-value",
    "pt": "um plano de implantação com marcos, dependências, passagem e primeiro valor",
    "fr": "un plan de déploiement avec jalons, dépendances, transfert et première valeur"
  },
  "account_manager": {
    "es": "un plan de cuenta con seguimiento comercial, renovación y próximos compromisos",
    "en": "an account plan covering commercial follow-up, renewal and next commitments",
    "pt": "um plano de conta com acompanhamento comercial, renovação e próximos compromissos",
    "fr": "un plan de compte avec suivi commercial, renouvellement et engagements"
  },
  "customer_support": {
    "es": "una respuesta de soporte y una nota interna de clasificación, escalación y cierre",
    "en": "a support response and an internal note covering classification, escalation and closure",
    "pt": "uma resposta de suporte e uma nota interna de classificação, escalonamento e encerramento",
    "fr": "une réponse de support et une note interne sur la qualification, l'escalade et la clôture"
  },
  "tech_support_l3": {
    "es": "un diagnóstico reproducible con hipótesis, registros, pasos técnicos y escalación",
    "en": "a reproducible technical diagnosis with hypotheses, logs, steps and escalation",
    "pt": "um diagnóstico técnico reproduzível com hipóteses, registros, etapas e escalonamento",
    "fr": "un diagnostic technique reproductible avec hypothèses, journaux, étapes et escalade"
  },
  "key_account_manager": {
    "es": "una recomendación ejecutiva para una cuenta estratégica con actores, riesgos y valor",
    "en": "an executive recommendation for a strategic account with stakeholders, risks and value",
    "pt": "uma recomendação executiva para conta estratégica com partes interessadas, riscos e valor",
    "fr": "une recommandation exécutive pour un compte stratégique avec parties prenantes, risques et valeur"
  },
  "product_specialist": {
    "es": "una demostración o especificación funcional centrada en el caso de uso y límites del producto",
    "en": "a product demo or functional specification grounded in the use case and product limits",
    "pt": "uma demonstração ou especificação funcional baseada no caso de uso e nos limites do produto",
    "fr": "une démonstration ou spécification fonctionnelle ancrée dans le cas d'usage et les limites produit"
  },
  "project_manager": {
    "es": "un artefacto de gestión de proyecto con alcance, hitos, riesgos, responsables y control de cambios",
    "en": "a project-management deliverable with scope, milestones, risks, owners and change control",
    "pt": "um artefato de gestão de projetos com escopo, marcos, riscos, responsáveis e controle de mudanças",
    "fr": "un livrable de gestion de projet avec périmètre, jalons, risques, responsables et suivi des changements"
  },
  "manager_team_lead": {
    "es": "una decisión de liderazgo respaldada por métricas, conversación de coaching y plan de seguimiento",
    "en": "a leadership decision supported by metrics, a coaching conversation and a follow-up plan",
    "pt": "uma decisão de liderança baseada em métricas, conversa de coaching e plano de acompanhamento",
    "fr": "une décision de management fondée sur des indicateurs, un entretien de coaching et un plan de suivi"
  }
};
export function writtenPrompt(role, locale, title, caseText, objective) {
 const guide = ROLE_WRITTEN_GUIDES[role]?.[locale];
 if (!guide) throw Error('UNKNOWN_ROLE_OR_LOCALE:'+role+':'+locale);
 switch(locale) {
 case 'es': return `Caso: ${caseText} Actividad «${title}»: prepara ${guide}. Objetivo: ${objective} Justifica tu decisión con hechos y alternativas; añade evidencia verificable, responsables, plazo, riesgos, criterio de aceptación e indicador de resultado.`;
 case 'en': return `Case: ${caseText} Task "${title}": prepare ${guide}. Objective: ${objective} Justify your decision with facts and alternatives; include verifiable evidence, owners, dates, risks, an acceptance criterion and a measurable outcome.`;
 case 'pt': return `Caso: ${caseText} Atividade «${title}»: prepare ${guide}. Objetivo: ${objective} Justifique sua decisão com fatos e alternativas; inclua evidências verificáveis, responsáveis, prazo, riscos, critério de aceitação e indicador de resultado.`;
 case 'fr': return `Cas : ${caseText} Activité «${title}» : préparez ${guide}. Objectif : ${objective} Justifiez votre décision par des faits et des alternatives ; fournissez preuves vérifiables, responsables, délais, risques, critère d'acceptation et indicateur de résultat.`;
 default: throw Error('UNKNOWN_LOCALE:'+locale);
 }
}
