export const assessmentPilotCopy = {
 es: {
  heading:"Evaluaciones 2.0 · piloto interno", subtitle:"Customer Success · un cliente que puede abandonar",
  description:"Cinco decisiones encadenadas: el contexto y las métricas cambian según tus acciones. Escenario ficticio; no modifica el progreso real ni concede certificados.",
  stage:"Reto",of:"de",reference:"Dificultad equivalente al nivel",select:"Selecciona una decisión",
  reason:"Justifica tu decisión con hechos, riesgos, alternativas y una forma de verificarla.",
  placeholder:"Explica qué datos usarías, por qué descartas otras alternativas y cómo comprobarías el resultado (mínimo 40 caracteres).",
  submit:"Confirmar decisión",continue:"Continuar al siguiente reto",restart:"Reiniciar simulación",
  consequence:"Consecuencia en el caso",outcome:"Resultado exploratorio",warning:"No es una certificación ni un diagnóstico de personalidad.",
  saved:"Simulación local: las respuestas se borran si sales o recargas la página.",
  feedback:"Retroalimentación del escenario",reasons:"Decisiones y justificaciones",skill:"Competencias observadas",
  focus:"Ruta sugerida de refuerzo",insufficient:"Evidencia insuficiente",provisional:"Indicio, no acreditación",
  decisionScore:"Calidad de decisiones simuladas",critical:"Decisiones con error crítico",
  decisionReady:"Resolución sólida de este caso ficticio",needsRevision:"Este caso necesita una segunda resolución con mejores evidencias",
  noCredits:"Los textos libres se recogen como justificación pero no reciben puntuación automática. Una futura evaluación real requiere rúbrica y revisión verificable.",
  readOnly:"Acceso exclusivo del propietario. Ninguna respuesta se envía al servidor ni se guarda en Supabase.",
  back:"Volver al inspector de cursos",inspect:"Inspeccionar cursos",
  metric:{adoption:"Adopción",trust:"Confianza",risk:"Riesgo",days:"Días para renovar"},
  skillNames:{communication:"Comunicación",diagnosis:"Diagnóstico",data:"Datos y métricas",planning:"Planeación",negotiation:"Negociación"},
  reinforce:{communication:"Responder una objeción de cliente con evidencia, límites y próxima actualización.",diagnosis:"Contrastar hipótesis de abandono con dos fuentes independientes.",data:"Calcular adopción, resultado y línea base sin confundir actividad con valor.",planning:"Rediseñar un plan 30/60/90 con responsables y criterios de aceptación.",negotiation:"Practicar renovación y concesiones condicionadas a valor verificable."},
  scenes:{
    diagnosis:{title:"Adopción en caída",context:"La cuenta Faro cayó de 80% a 42% de adopción. Renueva en 45 días. Compras pide un descuento del 20%. No sabes aún por qué bajó el uso.",question:"¿Qué harías primero?",choices:{
      discover:["Analizar uso, entrevistar a los responsables y confirmar resultados esperados","Separaste hipótesis de evidencia y recuperaste confianza antes de negociar."],
      discount:["Ofrecer el descuento para tranquilizar a Compras","La oferta no corrige el problema de adopción y reduce tu margen de negociación."],
      wait:["Esperar a que el cliente confirme si piensa cancelar","La falta de intervención incrementa la incertidumbre y el riesgo."]
    }},
    communication:{title:"Mensaje al cliente",context:"Debes informar al sponsor y a Compras sin inventar una causa ni una fecha de recuperación.",question:"¿Cómo formularías el compromiso?",choices:{
      frame:["Comunicar hechos, hipótesis, responsables y fecha de actualización","El sponsor comprende qué se sabe, qué se investigará y cuándo tendrá información."],
      promise:["Garantizar que mañana se habrá resuelto todo","Una promesa sin evidencia constituye un error crítico de integridad."],
      silent:["Evitar comunicación hasta tener una solución","La ausencia de seguimiento deteriora la confianza."]
    }},
    escalation:{title:"Escalación de renovación",context:"La confianza bajó y Compras amenaza con bloquear la renovación. Un directivo reclama una solución inmediata.",question:"¿Qué decisión tomarías?",choices:{
      recover:["Convocar a decisores, reconocer límites y proponer una recuperación verificable","Se reconstruye una vía de decisión basada en compromisos observables."],
      concession:["Dar una concesión sin condición ni plan","Sacrificas valor sin resolver la causa del riesgo."],
      conceal:["Ocultar que los objetivos no se cumplieron","Manipular el estado de la cuenta es un error crítico."]
    }},
    evidence:{title:"Demuestra valor",context:"El sponsor solicita una comparación reproducible del resultado de negocio, no solo número de accesos.",question:"¿Qué presentarías?",choices:{
      verify:["Medir línea base, tarea completada, precisión y resultado validado","Tus métricas permiten contrastar si el cliente obtiene valor real."],
      vanity:["Presentar accesos como prueba definitiva de retorno financiero","Confundir actividad con valor verificado es un error crítico."],
      defer:["Prometer métricas sin confirmar cómo se obtendrán","Las cifras ausentes debilitan la propuesta de continuidad."]
    }},
    planning:{title:"Recursos limitados",context:"Solo queda un mes aproximado. Ingeniería no confirma una integración automática; puedes habilitar un proceso manual acotado.",question:"¿Cómo organizarías el plan de acción?",choices:{
      phased:["Fases cortas, alternativa acotada, responsables, evidencias y revisión semanal","La solución reduce riesgo sin prometer capacidades no confirmadas."],
      shortcut:["Prometer la integración y lanzar cambios globales sin pruebas","Crear dependencias no verificadas produce un riesgo crítico."],
      freeze:["Posponer cualquier cambio hasta después de la renovación","Pierdes tiempo valioso para demostrar resultados."]
    }},
    transfer:{title:"Nueva evidencia contradice tu plan",context:"Antes de cerrar, una auditoría revela que parte de la adopción era actividad duplicada. Tu informe previo sobrestimó el avance.",question:"¿Cómo actúas ante la evidencia nueva?",choices:{
      revise:["Corregir la base, comunicar el impacto y rediseñar el criterio de éxito","Rectificas con evidencia y demuestras capacidad de revisión autónoma."],
      cherry:["Excluir los datos desfavorables para mantener el informe","La omisión intencional de evidencia adversa es un error crítico."],
      ignore:["Mantener el plan original sin revisar el impacto","Una conclusión que no cambia ante pruebas nuevas pierde validez."]
    }}
  }
 },
 en: {
  heading:"Assessments 2.0 · internal pilot",subtitle:"Customer Success · an account at risk",
  description:"Five connected decisions. Context and metrics change with your actions. Fictional scenario: no effect on actual learning progress or certificates.",
  stage:"Challenge",of:"of",reference:"Difficulty comparable to level",select:"Choose a decision",
  reason:"Justify your decision with evidence, risks, alternatives and a verification method.",
  placeholder:"Explain which evidence you would use, why you reject alternatives and how you would verify the outcome (at least 40 characters).",
  submit:"Confirm decision",continue:"Continue to next challenge",restart:"Restart simulation",
  consequence:"Scenario consequence",outcome:"Exploratory result",warning:"Not a certification or a personality assessment.",
  saved:"Local simulation: your answers disappear when you leave or reload.",
  feedback:"Scenario feedback",reasons:"Decisions and justifications",skill:"Competency signals",
  focus:"Suggested reinforcement path",insufficient:"Insufficient evidence",provisional:"Indicative only, not certified",
  decisionScore:"Quality of simulated decisions",critical:"Decisions with critical errors",
  decisionReady:"Strong resolution of this fictional case",needsRevision:"This case would benefit from a second attempt supported by stronger evidence",
  noCredits:"Free-text explanations are collected but not automatically graded. Real assessments would require auditable rubrics and verifiable review.",
  readOnly:"Owner-only access. Responses are neither sent to the server nor stored in Supabase.",
  back:"Back to course inspector",inspect:"Inspect courses",
  metric:{adoption:"Adoption",trust:"Trust",risk:"Risk",days:"Days to renewal"},
  skillNames:{communication:"Communication",diagnosis:"Diagnosis",data:"Data and metrics",planning:"Planning",negotiation:"Negotiation"},
  reinforce:{communication:"Respond to a customer objection with evidence, boundaries and a follow-up date.",diagnosis:"Test churn hypotheses with two independent sources.",data:"Calculate adoption and business outcomes using a proper baseline.",planning:"Redesign a 30/60/90-day plan with accountable owners and acceptance criteria.",negotiation:"Practice value-based renewal negotiations and conditional concessions."},
  scenes:{
   diagnosis:{title:"Falling adoption",context:"Faro's adoption fell from 80% to 42%. Renewal is in 45 days. Procurement wants a 20% discount. The cause of declining use is not known.",question:"What do you do first?",choices:{discover:["Analyze usage, interview stakeholders and verify expected outcomes","You distinguish hypotheses from evidence before negotiating."],discount:["Offer a discount to reassure Procurement","The discount fails to resolve the adoption problem and weakens your position."],wait:["Wait for the customer to announce a cancellation","Inaction increases risk and uncertainty."]}},
   communication:{title:"Customer update",context:"Update the sponsor and Procurement without inventing a cause or a recovery date.",question:"How do you frame the commitment?",choices:{frame:["Share facts, hypotheses, owners and the next update time","Stakeholders understand what is known and what comes next."],promise:["Guarantee full resolution by tomorrow","An unsupported commitment is a critical integrity error."],silent:["Say nothing until the full solution is ready","Silence damages trust."]}},
   escalation:{title:"Renewal escalation",context:"Trust is low and Procurement may block renewal. An executive demands an immediate fix.",question:"What do you do?",choices:{recover:["Bring decision makers together, state limits and agree on verifiable recovery","You reopen constructive, evidence-based decision making."],concession:["Grant an unconditional concession","You reduce value without addressing the root cause."],conceal:["Conceal unmet goals","Falsifying account status is a critical error."]}},
   evidence:{title:"Prove value",context:"The sponsor wants reproducible business outcomes rather than login counts.",question:"What do you present?",choices:{verify:["Baseline, completed workflow, accuracy and validated business result","Your metrics distinguish actual value from activity."],vanity:["Use logins as definitive proof of financial return","Misrepresenting activity as validated business value is critical."],defer:["Promise metrics without confirming how to collect them","Missing evidence weakens the renewal case."]}},
   planning:{title:"Limited resources",context:"Roughly one month remains. Engineering has not confirmed the automated integration; a bounded manual workaround is possible.",question:"How do you plan?",choices:{phased:["Phased delivery, bounded workaround, owners, evidence and weekly reviews","You reduce risk without claiming unsupported capabilities."],shortcut:["Promise integration and deploy untested global changes","Unverified dependencies create critical risk."],freeze:["Defer all work until after renewal","You lose the opportunity to prove value."]}},
   transfer:{title:"New evidence contradicts the plan",context:"An audit shows some adoption events were duplicated. The earlier report overstated progress.",question:"What do you do with the new evidence?",choices:{revise:["Correct the baseline, explain the impact and revise success criteria","You demonstrate independent review and transparency."],cherry:["Remove unfavorable evidence from the report","Deliberately concealing contrary evidence is critical."],ignore:["Continue the original plan unchanged","A conclusion that ignores new evidence is unreliable."]}}
  }
 },
 pt: {
  heading:"Avaliações 2.0 · piloto interno",subtitle:"Customer Success · cliente em risco",
  description:"Cinco decisões encadeadas. Contexto e indicadores mudam conforme suas escolhas. Cenário fictício, sem alterar progresso ou certificados.",
  stage:"Desafio",of:"de",reference:"Dificuldade equivalente ao nível",select:"Escolha uma decisão",
  reason:"Justifique sua decisão com fatos, riscos, alternativas e um método de verificação.",
  placeholder:"Explique quais dados usaria, por que descartaria alternativas e como verificaria o resultado (mínimo de 40 caracteres).",
  submit:"Confirmar decisão",continue:"Continuar para o próximo desafio",restart:"Reiniciar simulação",
  consequence:"Consequência no cenário",outcome:"Resultado exploratório",warning:"Não é certificação nem avaliação de personalidade.",
  saved:"Simulação local: as respostas desaparecem ao sair ou recarregar.",
  feedback:"Retorno do cenário",reasons:"Decisões e justificativas",skill:"Indícios de competência",
  focus:"Trilha de reforço sugerida",insufficient:"Evidência insuficiente",provisional:"Indício, não certificação",
  decisionScore:"Qualidade das decisões simuladas",critical:"Decisões com erros críticos",
  decisionReady:"Boa resolução deste caso fictício",needsRevision:"Este caso exige outra tentativa com evidências melhores",
  noCredits:"Justificativas abertas são coletadas, mas não recebem nota automática. Avaliações reais exigem rubricas auditáveis e revisão verificável.",
  readOnly:"Acesso exclusivo do proprietário. Nenhuma resposta é enviada ao servidor ou salva no Supabase.",
  back:"Voltar à inspeção dos cursos",inspect:"Inspecionar cursos",
  metric:{adoption:"Adoção",trust:"Confiança",risk:"Risco",days:"Dias até renovação"},
  skillNames:{communication:"Comunicação",diagnosis:"Diagnóstico",data:"Dados e métricas",planning:"Planejamento",negotiation:"Negociação"},
  reinforce:{communication:"Responder objeções com evidências, limites e data de acompanhamento.",diagnosis:"Testar hipóteses de cancelamento com fontes independentes.",data:"Calcular adoção e resultados usando linha de base confiável.",planning:"Redesenhar um plano 30/60/90 com responsáveis e critérios de aceite.",negotiation:"Praticar renovação baseada em valor e concessões condicionadas."},
  scenes:{
   diagnosis:{title:"Queda na adoção",context:"A adoção da Faro caiu de 80% para 42%. A renovação será em 45 dias. Compras quer 20% de desconto. A causa é desconhecida.",question:"O que faria primeiro?",choices:{discover:["Analisar uso, entrevistar responsáveis e validar resultados esperados","Você distingue hipóteses de evidências antes de negociar."],discount:["Oferecer desconto imediatamente","Isso não corrige a adoção e reduz seu poder de negociação."],wait:["Aguardar o cliente anunciar cancelamento","A inação aumenta o risco."]}},
   communication:{title:"Atualização ao cliente",context:"Informe o patrocinador e Compras sem inventar causas ou prazos.",question:"Como formular o compromisso?",choices:{frame:["Compartilhar fatos, hipóteses, responsáveis e próxima atualização","As partes compreendem o que se sabe e os próximos passos."],promise:["Garantir resolução total amanhã","Promessa sem evidências é um erro crítico."],silent:["Não dizer nada até resolver tudo","O silêncio prejudica a confiança."]}},
   escalation:{title:"Escalada da renovação",context:"A confiança caiu e Compras pode bloquear a renovação. Um diretor exige solução imediata.",question:"Qual decisão tomar?",choices:{recover:["Reunir decisores, esclarecer limites e propor recuperação verificável","Você restabelece decisões sustentadas por evidências."],concession:["Conceder desconto sem condições","Você reduz valor sem resolver a causa."],conceal:["Ocultar metas não cumpridas","Manipular o estado da conta é erro crítico."]}},
   evidence:{title:"Demonstrar valor",context:"O patrocinador pede resultados verificáveis, não só acessos.",question:"O que apresentaria?",choices:{verify:["Linha de base, fluxo concluído, precisão e resultado validado","A métrica comprova valor além da atividade."],vanity:["Usar acessos como prova definitiva de retorno","Confundir atividade com valor validado é erro crítico."],defer:["Prometer métricas ainda não verificadas","A ausência de dados enfraquece a renovação."]}},
   planning:{title:"Recursos limitados",context:"Resta cerca de um mês. Engenharia não confirmou a integração; há opção manual limitada.",question:"Como organizaria o plano?",choices:{phased:["Fases curtas, alternativa limitada, responsáveis e revisões","Você reduz risco sem promessas não confirmadas."],shortcut:["Prometer integração e fazer mudanças globais sem testes","Dependências não verificadas geram risco crítico."],freeze:["Adiar tudo para depois da renovação","Você perde tempo para demonstrar valor."]}},
   transfer:{title:"Nova evidência contraria o plano",context:"Uma auditoria revela registros de adoção duplicados. O relatório anterior superestimou resultados.",question:"Como reage?",choices:{revise:["Corrigir dados, comunicar impacto e revisar critérios","Você demonstra revisão independente e transparência."],cherry:["Excluir dados desfavoráveis do relatório","Ocultar evidências contrárias é erro crítico."],ignore:["Manter o plano original","Ignorar novas evidências compromete a conclusão."]}}
  }
 },
 fr: {
  heading:"Évaluations 2.0 · pilote interne",subtitle:"Customer Success · compte à risque",
  description:"Cinq décisions liées : le contexte et les indicateurs évoluent selon vos choix. Scénario fictif sans effet sur la progression ou les certificats.",
  stage:"Défi",of:"sur",reference:"Difficulté comparable au niveau",select:"Choisissez une décision",
  reason:"Justifiez votre choix par des faits, des risques, des alternatives et un moyen de vérification.",
  placeholder:"Expliquez les données utilisées, les alternatives écartées et la vérification prévue (40 caractères minimum).",
  submit:"Confirmer la décision",continue:"Continuer vers le défi suivant",restart:"Recommencer",
  consequence:"Conséquence dans le scénario",outcome:"Résultat exploratoire",warning:"Ni certification, ni évaluation de personnalité.",
  saved:"Simulation locale : les réponses disparaissent lorsque vous quittez ou rechargez la page.",
  feedback:"Retour sur le scénario",reasons:"Décisions et justifications",skill:"Indices de compétences",
  focus:"Parcours de renforcement suggéré",insufficient:"Preuves insuffisantes",provisional:"Indice non certifié",
  decisionScore:"Qualité des décisions simulées",critical:"Décisions comportant une erreur critique",
  decisionReady:"Résolution solide de ce cas fictif",needsRevision:"Ce cas nécessite une nouvelle tentative étayée par de meilleures preuves",
  noCredits:"Les justifications libres sont recueillies sans notation automatique. Une vraie évaluation exige une grille auditable et une révision vérifiable.",
  readOnly:"Accès réservé au propriétaire. Aucune réponse envoyée au serveur ni enregistrée dans Supabase.",
  back:"Retour à l’inspection des cours",inspect:"Inspecter les cours",
  metric:{adoption:"Adoption",trust:"Confiance",risk:"Risque",days:"Jours avant renouvellement"},
  skillNames:{communication:"Communication",diagnosis:"Diagnostic",data:"Données et indicateurs",planning:"Planification",negotiation:"Négociation"},
  reinforce:{communication:"Répondre aux objections avec des preuves, des limites et un prochain suivi.",diagnosis:"Vérifier les hypothèses de départ à l’aide de sources indépendantes.",data:"Calculer l’adoption et la valeur avec une base de référence fiable.",planning:"Revoir un plan 30/60/90 avec responsables et critères d’acceptation.",negotiation:"Négocier un renouvellement basé sur la valeur et les concessions conditionnelles."},
  scenes:{
   diagnosis:{title:"Baisse d’adoption",context:"L’adoption de Faro passe de 80 % à 42 %. Renouvellement dans 45 jours. Les Achats réclament 20 % de remise. La cause reste inconnue.",question:"Que faites-vous d’abord ?",choices:{discover:["Analyser l’usage, interroger les responsables et vérifier les résultats attendus","Vous distinguez hypothèses et faits avant de négocier."],discount:["Proposer immédiatement une remise","Cela ne résout pas le problème d’adoption."],wait:["Attendre l’annonce d’une résiliation","L’inaction accroît le risque."]}},
   communication:{title:"Informer le client",context:"Prévenez le sponsor et les Achats sans inventer de cause ni de date de résolution.",question:"Comment vous engagez-vous ?",choices:{frame:["Présenter faits, hypothèses, responsables et date du prochain point","Les parties comprennent la situation et la suite."],promise:["Garantir une résolution totale dès demain","Une promesse non fondée est une erreur critique."],silent:["Ne rien dire avant la résolution","Le silence détériore la confiance."]}},
   escalation:{title:"Escalade de renouvellement",context:"La confiance baisse. Les Achats pourraient bloquer le contrat. Un dirigeant demande une correction immédiate.",question:"Quelle décision ?",choices:{recover:["Réunir les décideurs, exposer les limites et convenir de résultats vérifiables","Vous rétablissez une décision fondée sur les faits."],concession:["Accorder une concession sans condition","Vous sacrifiez de la valeur sans résoudre la cause."],conceal:["Dissimuler les objectifs manqués","La falsification est une erreur critique."]}},
   evidence:{title:"Prouver la valeur",context:"Le sponsor exige des résultats commerciaux reproductibles, et non seulement des connexions.",question:"Que présentez-vous ?",choices:{verify:["Référence initiale, flux achevé, précision et résultat validé","Les indicateurs mesurent une valeur réelle."],vanity:["Présenter les connexions comme preuve définitive de rentabilité","Confondre activité et valeur vérifiée est critique."],defer:["Promettre des chiffres sans méthode confirmée","L’absence de preuves affaiblit le renouvellement."]}},
   planning:{title:"Ressources limitées",context:"Il reste environ un mois. L’intégration n’est pas confirmée, mais un processus manuel limité est possible.",question:"Comment planifiez-vous ?",choices:{phased:["Étapes courtes, alternative limitée, responsables et suivi hebdomadaire","Le risque diminue sans promesses non confirmées."],shortcut:["Promettre l’intégration et changer le système sans tests","Les dépendances non vérifiées créent un risque critique."],freeze:["Tout reporter après le renouvellement","Vous perdez la possibilité de prouver la valeur."]}},
   transfer:{title:"De nouvelles preuves contredisent votre plan",context:"Un audit trouve des activités dupliquées. Le rapport précédent surestimait les progrès.",question:"Que faites-vous ?",choices:{revise:["Corriger la base, informer des conséquences et revoir les critères","Vous démontrez autonomie et transparence."],cherry:["Supprimer les chiffres défavorables","Dissimuler les preuves contraires est critique."],ignore:["Conserver le plan inchangé","Une conclusion qui ignore les preuves est fragile."]}}
  }
 }
} as const;
export function copyForPilot(locale: string){
 return assessmentPilotCopy[(Object.hasOwn(assessmentPilotCopy,locale)?locale:"es") as keyof typeof assessmentPilotCopy];
}
