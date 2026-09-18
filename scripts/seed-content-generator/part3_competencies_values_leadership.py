# -*- coding: utf-8 -*-
"""Generador Fase 2 - parte 3: competencies (60), values (40), leadership (50)."""

# ---------------------------------------------------------------------------
# COMPETENCIES: 14 competencias, 60 items (likert5, sin reverse)
# ---------------------------------------------------------------------------
COMPETENCIES_DIMENSIONS = [
    ("liderazgo", "Liderazgo", [
        "Guío a mi equipo hacia objetivos claros y compartidos.",
        "Inspiro confianza en las personas con las que trabajo.",
        "Tomo el mando cuando la situación lo requiere, sin esperar a que otros lo hagan.",
        "Reconozco los logros de mi equipo de forma oportuna.",
        "Adapto mi estilo de liderazgo según la persona y la situación.",
    ]),
    ("delegacion", "Delegación", [
        "Asigno tareas considerando las fortalezas de cada persona del equipo.",
        "Delego con instrucciones claras sobre el resultado esperado.",
        "Confío en que las personas a quienes delego pueden hacer bien su trabajo.",
        "Doy seguimiento a lo delegado sin caer en el microgerenciamiento.",
    ]),
    ("inteligencia_emocional", "Inteligencia Emocional", [
        "Reconozco mis propias emociones antes de que afecten mi trabajo.",
        "Entiendo cómo se sienten los demás incluso cuando no lo dicen abiertamente.",
        "Manejo mis reacciones ante situaciones difíciles con las personas.",
        "Ayudo a calmar tensiones cuando percibo que un compañero está alterado.",
    ]),
    ("comunicacion", "Comunicación", [
        "Explico mis ideas de forma clara y fácil de entender.",
        "Adapto mi mensaje según quién me esté escuchando.",
        "Escucho con atención antes de responder en una conversación de trabajo.",
        "Doy retroalimentación de forma directa y respetuosa.",
        "Me aseguro de confirmar que el mensaje fue comprendido correctamente.",
    ]),
    ("trabajo_equipo", "Trabajo en Equipo", [
        "Colaboro con otras áreas para lograr objetivos comunes.",
        "Comparto información útil con mis compañeros sin que me la pidan.",
        "Apoyo a mi equipo incluso cuando la tarea no es responsabilidad mía directa.",
        "Contribuyo a mantener un buen ambiente de trabajo dentro del equipo.",
    ]),
    ("toma_decisiones", "Toma de Decisiones", [
        "Analizo la información disponible antes de decidir.",
        "Tomo decisiones oportunas incluso con información incompleta.",
        "Considero las consecuencias de mis decisiones antes de actuar.",
        "Asumo la responsabilidad de las decisiones que tomo, sean acertadas o no.",
        "Pido opiniones relevantes antes de decisiones que afectan a otros.",
    ]),
    ("planeacion", "Planeación", [
        "Defino objetivos claros antes de iniciar un proyecto.",
        "Anticipo los recursos necesarios para completar mis tareas a tiempo.",
        "Establezco plazos realistas para mis actividades.",
        "Ajusto mis planes cuando surgen imprevistos importantes.",
    ]),
    ("organizacion", "Organización", [
        "Mantengo mis tareas y prioridades claramente ordenadas.",
        "Utilizo herramientas o listas para dar seguimiento a mis pendientes.",
        "Encuentro rápido la información que necesito para trabajar.",
        "Organizo mi tiempo de forma que pueda cumplir con múltiples compromisos.",
    ]),
    ("orientacion_servicio", "Orientación al Servicio", [
        "Atiendo las necesidades de mis clientes internos o externos con prontitud.",
        "Busco activamente formas de mejorar la experiencia de quien recibe mi trabajo.",
        "Mantengo una actitud amable incluso ante clientes exigentes o molestos.",
        "Doy seguimiento a las solicitudes hasta confirmar que quedaron resueltas.",
    ]),
    ("seguimiento_control", "Seguimiento y Control", [
        "Doy seguimiento constante a los compromisos de mi equipo hasta verlos concluidos.",
        "Verifico que las tareas se completen conforme a lo acordado.",
        "Detecto desviaciones en un proceso antes de que se conviertan en un problema mayor.",
        "Llevo un control claro del avance de mis proyectos.",
    ]),
    ("tolerancia_presion", "Tolerancia a la Presión", [
        "Mantengo un buen desempeño incluso cuando tengo múltiples tareas urgentes.",
        "Trabajo con calma aun cuando los plazos son muy ajustados.",
        "No dejo que el estrés afecte la calidad de mi trabajo.",
        "Sigo tomando buenas decisiones incluso en momentos de alta exigencia.",
    ]),
    ("orientacion_resultados", "Orientación a Resultados", [
        "Me enfoco en lograr los objetivos establecidos, no solo en cumplir tareas.",
        "Busco constantemente formas de mejorar mis resultados.",
        "Persisto en un objetivo aunque encuentre obstáculos en el camino.",
        "Mido mi desempeño en función de resultados concretos.",
        "Ajusto mi estrategia cuando veo que no estoy logrando el resultado esperado.",
    ]),
    ("resolucion_problemas", "Resolución de Problemas", [
        "Identifico la causa raíz de un problema antes de actuar.",
        "Propongo soluciones prácticas ante los obstáculos que se presentan.",
        "Analizo distintas alternativas antes de elegir cómo resolver un problema.",
        "Resuelvo problemas de forma metódica en lugar de improvisar sin rumbo.",
    ]),
    ("desarrollo_colaboradores", "Desarrollo de Colaboradores", [
        "Invierto tiempo en enseñar y guiar a las personas de mi equipo.",
        "Doy retroalimentación que ayuda a otros a mejorar su desempeño.",
        "Identifico el potencial de cada colaborador y busco desarrollarlo.",
        "Celebro y reconozco el crecimiento profesional de mis compañeros.",
    ]),
]
COMPETENCIES_TOTAL = sum(len(v[2]) for v in COMPETENCIES_DIMENSIONS)
assert COMPETENCIES_TOTAL == 60, COMPETENCIES_TOTAL

# ---------------------------------------------------------------------------
# VALUES: 8 dimensiones x 5 items (algunos reverse = deseabilidad social)
# tupla: (dimension_code, label, [(texto, is_reverse), ...])
# ---------------------------------------------------------------------------
VALUES_DIMENSIONS = [
    ("honestidad", "Honestidad", [
        ("Digo la verdad aunque me traiga consecuencias incómodas.", False),
        ("Actúo de forma honesta incluso cuando nadie más lo notaría.", False),
        ("Alguna vez he exagerado un logro para verme mejor ante mi jefe.", True),
        ("Reconozco abiertamente cuando no sé algo, en lugar de aparentar que sí.", False),
        ("Evito dar información engañosa aunque me convenga en el corto plazo.", False),
    ]),
    ("etica", "Ética", [
        ("Tomo decisiones basándome en lo correcto, no solo en lo conveniente.", False),
        ("Rechazo beneficios que impliquen actuar de forma incorrecta.", False),
        ("En alguna ocasión he mirado hacia otro lado ante una situación poco ética para evitar problemas.", True),
        ("Actúo con los mismos principios éticos estando solo o acompañado.", False),
        ("Cuestiono decisiones que me parecen éticamente incorrectas, aunque vengan de un superior.", False),
    ]),
    ("responsabilidad", "Responsabilidad", [
        ("Cumplo mis compromisos laborales incluso cuando nadie los está verificando.", False),
        ("Asumo las consecuencias de mis errores en lugar de evadirlas.", False),
        ("En ocasiones he dejado que otros carguen con la culpa de algo que hice yo.", True),
        ("Cuido los recursos de la empresa como si fueran propios.", False),
        ("Cumplo mi palabra aunque implique un esfuerzo extra.", False),
    ]),
    ("respeto", "Respeto", [
        ("Trato a todas las personas con respeto, sin importar su cargo.", False),
        ("Escucho opiniones distintas a la mía sin descalificarlas.", False),
        ("Evito comentarios que puedan herir u ofender a mis compañeros.", False),
        ("A veces he hablado mal de un compañero a sus espaldas.", True),
        ("Valoro la diversidad de opiniones y formas de trabajar de otras personas.", False),
    ]),
    ("justicia", "Justicia", [
        ("Trato a las personas de forma equitativa, sin favoritismos.", False),
        ("Reconozco los méritos de otros aunque no sean mis amigos cercanos.", False),
        ("Distribuyo el trabajo de forma justa entre los miembros de un equipo.", False),
        ("Alguna vez he favorecido a alguien cercano en una decisión laboral, aunque no fuera lo más justo.", True),
        ("Defiendo la equidad aunque eso implique ir contra la opinión de la mayoría.", False),
    ]),
    ("lealtad", "Lealtad", [
        ("Defiendo a mi equipo y a mi empresa incluso cuando enfrentan críticas externas.", False),
        ("Mantengo la confidencialidad de la información sensible de mi organización.", False),
        ("Represento bien a mi empresa incluso fuera del horario laboral.", False),
        ("He compartido información confidencial de mi trabajo sin autorización.", True),
        ("Permanezco comprometido con mi equipo incluso en momentos difíciles.", False),
    ]),
    ("consistencia", "Consistencia", [
        ("Actúo de la misma manera sin importar quién me esté observando.", False),
        ("Mis decisiones siguen los mismos principios en distintas situaciones.", False),
        ("Cambio mi forma de actuar dependiendo de quién esté presente.", True),
        ("Soy constante en la calidad de mi trabajo, día tras día.", False),
        ("Mantengo mis valores firmes incluso bajo presión.", False),
    ]),
    ("confiabilidad", "Confiabilidad", [
        ("Las personas pueden confiar en que cumpliré lo que prometo.", False),
        ("Soy puntual y cumplo los tiempos que acuerdo con otros.", False),
        ("En ocasiones prometo cosas que sé que no podré cumplir.", True),
        ("Mantengo la calidad de mi trabajo incluso cuando nadie lo supervisa de cerca.", False),
        ("Soy la persona a la que mi equipo recurre cuando necesita algo confiable.", False),
    ]),
]
VALUES_TOTAL = sum(len(v[2]) for v in VALUES_DIMENSIONS)
assert VALUES_TOTAL == 40, VALUES_TOTAL

# ---------------------------------------------------------------------------
# LEADERSHIP: 11 dimensiones, 50 items (likert5, sin reverse)
# ---------------------------------------------------------------------------
LEADERSHIP_DIMENSIONS = [
    ("comunicacion", "Comunicación", [
        "Comunico la visión y los objetivos de forma que todos los entiendan.",
        "Adapto mi mensaje según la audiencia (equipo, dirección, clientes).",
        "Escucho activamente las inquietudes de mi equipo antes de responder.",
        "Transmito malas noticias con claridad y empatía cuando es necesario.",
        "Mantengo informado a mi equipo sobre decisiones que los afectan.",
    ]),
    ("delegacion", "Delegación", [
        "Delego responsabilidades importantes, no solo tareas operativas.",
        "Confío en las capacidades de mi equipo al delegar.",
        "Doy la autoridad necesaria junto con la responsabilidad que delego.",
        "Superviso lo delegado sin caer en el control excesivo.",
    ]),
    ("negociacion", "Negociación", [
        "Negocio buscando acuerdos donde ambas partes salgan beneficiadas.",
        "Me preparo a fondo antes de una negociación importante.",
        "Identifico los intereses reales detrás de la posición de la otra parte.",
        "Mantengo la calma y la firmeza al negociar bajo presión.",
    ]),
    ("pensamiento_estrategico", "Pensamiento Estratégico", [
        "Anticipo tendencias del mercado antes de que afecten a mi organización.",
        "Conecto las metas de mi equipo con los objetivos generales del negocio.",
        "Evalúo escenarios de largo plazo antes de definir un curso de acción.",
        "Identifico oportunidades de crecimiento que otros no ven fácilmente.",
        "Priorizo iniciativas según su impacto estratégico, no solo su urgencia.",
    ]),
    ("desarrollo_equipos", "Desarrollo de Equipos", [
        "Invierto tiempo en identificar y potenciar el talento de mi equipo.",
        "Creo oportunidades de crecimiento para las personas que lidero.",
        "Doy retroalimentación que ayuda a mi equipo a desarrollarse profesionalmente.",
        "Construyo planes de sucesión para los roles clave de mi equipo.",
        "Fomento un ambiente donde las personas se sienten seguras para aprender de sus errores.",
    ]),
    ("coaching", "Coaching", [
        "Hago preguntas que ayudan a otros a encontrar sus propias soluciones.",
        "Acompaño el desarrollo de mi equipo con retroalimentación continua.",
        "Ayudo a las personas a identificar sus propias áreas de mejora.",
        "Dedico tiempo regular a conversaciones de desarrollo con mi equipo.",
    ]),
    ("manejo_conflictos", "Manejo de Conflictos", [
        "Abordo los conflictos del equipo de forma directa y oportuna.",
        "Facilito que las partes en conflicto encuentren una solución en común.",
        "Mantengo la objetividad al mediar en desacuerdos entre colaboradores.",
        "Evito que los conflictos personales afecten el desempeño del equipo.",
        "Transformo los desacuerdos en oportunidades de mejora para el equipo.",
    ]),
    ("toma_decisiones", "Toma de Decisiones", [
        "Tomo decisiones difíciles con información incompleta cuando es necesario.",
        "Involucro a las personas correctas antes de decisiones importantes.",
        "Sopeso el impacto de mis decisiones en las distintas áreas del negocio.",
        "Actúo con decisión incluso cuando la situación es ambigua.",
        "Reviso los resultados de mis decisiones para aprender de ellos.",
    ]),
    ("gestion_cambio", "Gestión del Cambio", [
        "Lidero procesos de cambio comunicando el porqué detrás de ellos.",
        "Ayudo a mi equipo a adaptarse a nuevas formas de trabajo.",
        "Anticipo la resistencia al cambio y la gestiono proactivamente.",
        "Mantengo la motivación del equipo durante periodos de transición.",
        "Ajusto mi plan de cambio cuando la realidad lo requiere.",
    ]),
    ("innovacion", "Innovación", [
        "Fomento que mi equipo proponga ideas nuevas sin miedo a equivocarse.",
        "Cuestiono formas de trabajo establecidas cuando ya no son eficientes.",
        "Impulso proyectos que introducen mejoras significativas.",
        "Doy espacio para experimentar con nuevas soluciones antes de descartarlas.",
    ]),
    ("responsabilidad", "Responsabilidad (Accountability)", [
        "Asumo la responsabilidad de los resultados de mi equipo, incluso los negativos.",
        "Cumplo los compromisos que hago con mi equipo y con la organización.",
        "Reconozco públicamente mis propios errores como líder.",
        "Exijo a mi equipo el mismo nivel de compromiso que exijo de mí mismo.",
    ]),
]
LEADERSHIP_TOTAL = sum(len(v[2]) for v in LEADERSHIP_DIMENSIONS)
assert LEADERSHIP_TOTAL == 50, LEADERSHIP_TOTAL
