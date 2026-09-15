-- ============================================================================
-- FASE 2: CONTENIDO COMPLETO DE LAS 7 BATERIAS
-- ============================================================================
-- Generado programáticamente (scripts/_gen/build_seed.py) a partir de listas de
-- contenido curado a mano en español. Este script:
--   1) Elimina las preguntas de EJEMPLO de la Fase 1 para las baterías cuyas
--      dimensiones cambian (behavioral, cognitive, personality, competencies,
--      values, leadership), ya que la Fase 2 introduce una taxonomía de
--      dimensiones distinta y más completa que la de los ejemplos iniciales.
--   2) Actualiza `config_json.dimensions` (o `config_json.roles[].dimensions`
--      para role_specific) de cada `assessment_definitions` para que coincida
--      con las dimensiones reales de las preguntas nuevas (mismos ids/codes de
--      assessment_definitions, no se tocan).
--   3) Inserta el contenido completo de cada batería.
--   NO se modifican las preguntas de ejemplo de role_specific (sales/director);
--   se agregan preguntas nuevas a continuación de las existentes (order_index
--   continúa desde 4) y preguntas para los 5 roles restantes desde 1.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Limpieza de preguntas de ejemplo (Fase 1) para las 6 baterías que cambian de
-- taxonomía de dimensiones. role_specific NO se toca aquí (se conservan sales/
-- director de ejemplo y se agregan las nuevas más abajo).
-- ----------------------------------------------------------------------------
delete from public.questions where assessment_definition_id = (select id from public.assessment_definitions where code = 'behavioral');
delete from public.questions where assessment_definition_id = (select id from public.assessment_definitions where code = 'cognitive');
delete from public.questions where assessment_definition_id = (select id from public.assessment_definitions where code = 'personality');
delete from public.questions where assessment_definition_id = (select id from public.assessment_definitions where code = 'competencies');
delete from public.questions where assessment_definition_id = (select id from public.assessment_definitions where code = 'values');
delete from public.questions where assessment_definition_id = (select id from public.assessment_definitions where code = 'leadership');

-- ----------------------------------------------------------------------------
-- Actualización de config_json.dimensions para reflejar las dimensiones reales
-- de las preguntas de la Fase 2 (mismos id/code/name/description de la fila;
-- solo cambia el arreglo de dimensiones dentro de config_json).
-- ----------------------------------------------------------------------------
update public.assessment_definitions set config_json = '{"question_type": "forced_choice_quad", "dimensions": [{"code": "D", "label": "Dominancia"}, {"code": "I", "label": "Influencia"}, {"code": "S", "label": "Estabilidad"}, {"code": "C", "label": "Cumplimiento"}]}'::jsonb where code = 'behavioral';
update public.assessment_definitions set config_json = '{"question_type": "multiple_choice", "dimensions": [{"code": "razonamiento_abstracto", "label": "Razonamiento Abstracto"}, {"code": "razonamiento_analitico", "label": "Razonamiento Analítico"}, {"code": "reconocimiento_patrones", "label": "Reconocimiento de Patrones"}, {"code": "concentracion", "label": "Concentración"}, {"code": "juicio", "label": "Juicio"}, {"code": "organizacion", "label": "Organización"}, {"code": "planeacion", "label": "Planeación"}]}'::jsonb where code = 'cognitive';
update public.assessment_definitions set config_json = '{"question_type": "likert5", "dimensions": [{"code": "liderazgo", "label": "Liderazgo"}, {"code": "iniciativa", "label": "Iniciativa"}, {"code": "persistencia", "label": "Persistencia"}, {"code": "orientacion_logro", "label": "Orientación al Logro"}, {"code": "necesidad_supervision", "label": "Necesidad de Supervisión"}, {"code": "sociabilidad", "label": "Sociabilidad"}, {"code": "estabilidad_emocional", "label": "Estabilidad Emocional"}, {"code": "comunicacion", "label": "Comunicación"}, {"code": "adaptabilidad", "label": "Adaptabilidad"}, {"code": "apego_normas", "label": "Apego a Normas"}, {"code": "responsabilidad", "label": "Responsabilidad"}, {"code": "independencia", "label": "Independencia"}, {"code": "orientacion_equipo", "label": "Orientación al Trabajo en Equipo"}]}'::jsonb where code = 'personality';
update public.assessment_definitions set config_json = '{"question_type": "likert5", "dimensions": [{"code": "liderazgo", "label": "Liderazgo"}, {"code": "delegacion", "label": "Delegación"}, {"code": "inteligencia_emocional", "label": "Inteligencia Emocional"}, {"code": "comunicacion", "label": "Comunicación"}, {"code": "trabajo_equipo", "label": "Trabajo en Equipo"}, {"code": "toma_decisiones", "label": "Toma de Decisiones"}, {"code": "planeacion", "label": "Planeación"}, {"code": "organizacion", "label": "Organización"}, {"code": "orientacion_servicio", "label": "Orientación al Servicio"}, {"code": "seguimiento_control", "label": "Seguimiento y Control"}, {"code": "tolerancia_presion", "label": "Tolerancia a la Presión"}, {"code": "orientacion_resultados", "label": "Orientación a Resultados"}, {"code": "resolucion_problemas", "label": "Resolución de Problemas"}, {"code": "desarrollo_colaboradores", "label": "Desarrollo de Colaboradores"}]}'::jsonb where code = 'competencies';
update public.assessment_definitions set config_json = '{"question_type": "likert5", "dimensions": [{"code": "honestidad", "label": "Honestidad"}, {"code": "etica", "label": "Ética"}, {"code": "responsabilidad", "label": "Responsabilidad"}, {"code": "respeto", "label": "Respeto"}, {"code": "justicia", "label": "Justicia"}, {"code": "lealtad", "label": "Lealtad"}, {"code": "consistencia", "label": "Consistencia"}, {"code": "confiabilidad", "label": "Confiabilidad"}]}'::jsonb where code = 'values';
update public.assessment_definitions set config_json = '{"question_type": "likert5", "dimensions": [{"code": "comunicacion", "label": "Comunicación"}, {"code": "delegacion", "label": "Delegación"}, {"code": "negociacion", "label": "Negociación"}, {"code": "pensamiento_estrategico", "label": "Pensamiento Estratégico"}, {"code": "desarrollo_equipos", "label": "Desarrollo de Equipos"}, {"code": "coaching", "label": "Coaching"}, {"code": "manejo_conflictos", "label": "Manejo de Conflictos"}, {"code": "toma_decisiones", "label": "Toma de Decisiones"}, {"code": "gestion_cambio", "label": "Gestión del Cambio"}, {"code": "innovacion", "label": "Innovación"}, {"code": "responsabilidad", "label": "Responsabilidad (Accountability)"}]}'::jsonb where code = 'leadership';

update public.assessment_definitions set config_json = '{"question_type": "likert5", "roles": [{"code": "sales", "label": "Ventas", "dimensions": [{"code": "prospeccion", "label": "Prospección"}, {"code": "cierre", "label": "Cierre de Ventas"}, {"code": "relacion_cliente", "label": "Relación con el Cliente"}, {"code": "manejo_objeciones", "label": "Manejo de Objeciones"}, {"code": "resiliencia_rechazo", "label": "Resiliencia ante el Rechazo"}, {"code": "orientacion_comercial", "label": "Orientación Comercial"}]}, {"code": "commercial_manager", "label": "Gerente Comercial", "dimensions": [{"code": "gestion_equipo_comercial", "label": "Gestión de Equipo Comercial"}, {"code": "planeacion_estrategica", "label": "Planeación Estratégica"}, {"code": "negociacion", "label": "Negociación"}, {"code": "gestion_cartera", "label": "Gestión de Cartera"}, {"code": "forecasting", "label": "Forecasting"}, {"code": "negociacion_clientes_clave", "label": "Negociación con Clientes Clave"}]}, {"code": "director", "label": "Director", "dimensions": [{"code": "vision_negocio", "label": "Visión de Negocio"}, {"code": "toma_decisiones", "label": "Toma de Decisiones"}, {"code": "gestion_stakeholders", "label": "Gestión de Stakeholders"}, {"code": "gobierno_corporativo", "label": "Gobierno Corporativo"}, {"code": "decisiones_alto_impacto", "label": "Decisiones de Alto Impacto"}]}, {"code": "consultant", "label": "Consultor", "dimensions": [{"code": "analisis_problemas", "label": "Análisis de Problemas"}, {"code": "comunicacion_cliente", "label": "Comunicación con el Cliente"}, {"code": "adaptabilidad_proyectos", "label": "Adaptabilidad a Proyectos"}, {"code": "entregables_evidencia", "label": "Entregables Basados en Evidencia"}]}, {"code": "analyst", "label": "Analista", "dimensions": [{"code": "precision_datos", "label": "Precisión con Datos"}, {"code": "pensamiento_critico", "label": "Pensamiento Crítico"}, {"code": "documentacion", "label": "Documentación"}, {"code": "atencion_detalle", "label": "Atención al Detalle"}, {"code": "rigor_metodologico", "label": "Rigor Metodológico"}]}, {"code": "operations", "label": "Operaciones", "dimensions": [{"code": "eficiencia_procesos", "label": "Eficiencia de Procesos"}, {"code": "gestion_calidad", "label": "Gestión de Calidad"}, {"code": "resolucion_incidentes", "label": "Resolución de Incidentes"}, {"code": "gestion_proveedores_logistica", "label": "Gestión de Proveedores y Logística"}, {"code": "mejora_continua", "label": "Mejora Continua"}]}, {"code": "hr", "label": "RRHH", "dimensions": [{"code": "gestion_talento", "label": "Gestión de Talento"}, {"code": "relaciones_laborales", "label": "Relaciones Laborales"}, {"code": "comunicacion_organizacional", "label": "Comunicación Organizacional"}, {"code": "sensibilidad_interpersonal", "label": "Sensibilidad Interpersonal"}, {"code": "confidencialidad", "label": "Confidencialidad"}]}]}'::jsonb where code = 'role_specific';

-- ============================================================================
-- BEHAVIORAL: 28 bloques forced_choice_quad (estilo DISC/Cleaver)
-- ============================================================================
insert into public.questions
  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'forced_choice_quad', 'DISC', v.prompt_text, v.options_json::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'Bloque 1 — Toma de decisiones. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Decido rápido y asumo la responsabilidad de mis decisiones.", "dimension": "D"}, {"text": "Prefiero discutir la decisión en grupo antes de definirla.", "dimension": "I"}, {"text": "Tomo decisiones con calma, después de pensarlas bien.", "dimension": "S"}, {"text": "Baso mis decisiones en datos y procedimientos establecidos.", "dimension": "C"}]}'::jsonb),
  (2, 'Bloque 2 — Trabajo en equipo. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Me gusta liderar al equipo hacia el objetivo.", "dimension": "D"}, {"text": "Animo al equipo y mantengo el ambiente positivo.", "dimension": "I"}, {"text": "Apoyo a mis compañeros de forma constante y confiable.", "dimension": "S"}, {"text": "Me aseguro de que el equipo siga los procesos correctos.", "dimension": "C"}]}'::jsonb),
  (3, 'Bloque 3 — Manejo de conflicto. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Enfrento el conflicto de forma directa y sin rodeos.", "dimension": "D"}, {"text": "Busco resolver el conflicto conversando y buscando puntos en común.", "dimension": "I"}, {"text": "Prefiero calmar los ánimos antes de abordar el conflicto.", "dimension": "S"}, {"text": "Analizo los hechos objetivamente antes de opinar sobre el conflicto.", "dimension": "C"}]}'::jsonb),
  (4, 'Bloque 4 — Ritmo de trabajo. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Trabajo a un ritmo acelerado y exijo lo mismo a otros.", "dimension": "D"}, {"text": "Mi ritmo varía según el entusiasmo que me genere la tarea.", "dimension": "I"}, {"text": "Mantengo un ritmo constante y predecible durante todo el día.", "dimension": "S"}, {"text": "Avanzo con cuidado, verificando cada paso antes de continuar.", "dimension": "C"}]}'::jsonb),
  (5, 'Bloque 5 — Relación con las reglas. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Cuestiono las reglas si creo que frenan los resultados.", "dimension": "D"}, {"text": "Sigo las reglas, pero prefiero un ambiente flexible.", "dimension": "I"}, {"text": "Respeto las reglas porque dan estabilidad al equipo.", "dimension": "S"}, {"text": "Sigo las normas y procedimientos al pie de la letra.", "dimension": "C"}]}'::jsonb),
  (6, 'Bloque 6 — Manejo de la presión. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Bajo presión, tomo el mando y actúo con determinación.", "dimension": "D"}, {"text": "Bajo presión, busco apoyo y ánimo en las personas cercanas.", "dimension": "I"}, {"text": "Bajo presión, mantengo la calma y no me altero fácilmente.", "dimension": "S"}, {"text": "Bajo presión, me enfoco en no cometer errores.", "dimension": "C"}]}'::jsonb),
  (7, 'Bloque 7 — Comunicación. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Voy directo al punto cuando comunico algo importante.", "dimension": "D"}, {"text": "Disfruto contar historias y persuadir con entusiasmo.", "dimension": "I"}, {"text": "Escucho con paciencia antes de responder.", "dimension": "S"}, {"text": "Comunico con precisión, cuidando cada detalle.", "dimension": "C"}]}'::jsonb),
  (8, 'Bloque 8 — Iniciativa. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Tomo la iniciativa sin esperar que otros me lo pidan.", "dimension": "D"}, {"text": "Propongo ideas nuevas con entusiasmo contagioso.", "dimension": "I"}, {"text": "Prefiero esperar instrucciones claras antes de actuar.", "dimension": "S"}, {"text": "Actúo solo después de analizar toda la información disponible.", "dimension": "C"}]}'::jsonb),
  (9, 'Bloque 9 — Retroalimentación. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Doy retroalimentación directa, aunque sea incómoda.", "dimension": "D"}, {"text": "Doy retroalimentación de forma motivadora y positiva.", "dimension": "I"}, {"text": "Doy retroalimentación con tacto, cuidando la relación.", "dimension": "S"}, {"text": "Doy retroalimentación basada en hechos concretos y medibles.", "dimension": "C"}]}'::jsonb),
  (10, 'Bloque 10 — Cambio e incertidumbre. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Impulso el cambio aunque genere resistencia.", "dimension": "D"}, {"text": "Me adapto al cambio con optimismo y facilidad.", "dimension": "I"}, {"text": "Prefiero cambios graduales, no bruscos.", "dimension": "S"}, {"text": "Analizo el impacto del cambio antes de aceptarlo.", "dimension": "C"}]}'::jsonb),
  (11, 'Bloque 11 — Relaciones y networking. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Construyo relaciones útiles para alcanzar mis objetivos.", "dimension": "D"}, {"text": "Disfruto conocer gente nueva y ampliar mi red de contactos.", "dimension": "I"}, {"text": "Prefiero mantener pocas relaciones, pero profundas y leales.", "dimension": "S"}, {"text": "Formalizo mis relaciones profesionales con cuidado y discreción.", "dimension": "C"}]}'::jsonb),
  (12, 'Bloque 12 — Manejo de multitarea. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Manejo varias prioridades urgentes al mismo tiempo con firmeza.", "dimension": "D"}, {"text": "Salto entre tareas siguiendo mi entusiasmo del momento.", "dimension": "I"}, {"text": "Prefiero enfocarme en una tarea a la vez, sin apuros.", "dimension": "S"}, {"text": "Organizo mis tareas en listas detalladas para no perder el control.", "dimension": "C"}]}'::jsonb),
  (13, 'Bloque 13 — Delegación. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Delego tareas y espero resultados concretos y rápidos.", "dimension": "D"}, {"text": "Delego motivando a la otra persona a dar su mejor esfuerzo.", "dimension": "I"}, {"text": "Delego solo cuando confío plenamente en la otra persona.", "dimension": "S"}, {"text": "Delego dando instrucciones muy detalladas y por escrito.", "dimension": "C"}]}'::jsonb),
  (14, 'Bloque 14 — Reconocimiento. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Busco el reconocimiento por resultados, no por esfuerzo.", "dimension": "D"}, {"text": "Disfruto ser el centro de atención cuando logro algo.", "dimension": "I"}, {"text": "Prefiero el reconocimiento discreto de mi jefe directo.", "dimension": "S"}, {"text": "Valoro que reconozcan la calidad y precisión de mi trabajo.", "dimension": "C"}]}'::jsonb),
  (15, 'Bloque 15 — Estilo de aprendizaje. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Aprendo rápido lo esencial y avanzo a la acción.", "dimension": "D"}, {"text": "Aprendo mejor conversando e intercambiando ideas con otros.", "dimension": "I"}, {"text": "Aprendo de forma pausada, repasando con calma.", "dimension": "S"}, {"text": "Aprendo estudiando a fondo manuales y procedimientos.", "dimension": "C"}]}'::jsonb),
  (16, 'Bloque 16 — Relación con la rutina. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Me aburro con la rutina; busco constantemente nuevos retos.", "dimension": "D"}, {"text": "Prefiero variedad en mis días, no me gusta lo repetitivo.", "dimension": "I"}, {"text": "Me siento cómodo con una rutina estable y conocida.", "dimension": "S"}, {"text": "Sigo una rutina ordenada que me da consistencia.", "dimension": "C"}]}'::jsonb),
  (17, 'Bloque 17 — Autonomía y supervisión. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Prefiero trabajar sin supervisión y con total autonomía.", "dimension": "D"}, {"text": "Trabajo bien tanto solo como acompañado, no me afecta.", "dimension": "I"}, {"text": "Prefiero tener claridad sobre lo que se espera de mí.", "dimension": "S"}, {"text": "Prefiero supervisión que confirme que sigo el proceso correcto.", "dimension": "C"}]}'::jsonb),
  (18, 'Bloque 18 — Competencia y colaboración. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Me motiva competir y estar por encima de los demás.", "dimension": "D"}, {"text": "Prefiero colaborar antes que competir con mis compañeros.", "dimension": "I"}, {"text": "No me interesa competir, prefiero la armonía del grupo.", "dimension": "S"}, {"text": "Mido mi progreso comparándolo con estándares de calidad.", "dimension": "C"}]}'::jsonb),
  (19, 'Bloque 19 — Manejo de errores. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Reconozco un error rápido y paso a corregirlo sin drama.", "dimension": "D"}, {"text": "Cuando me equivoco, uso el humor para aliviar la tensión.", "dimension": "I"}, {"text": "Cuando cometo un error, me toma tiempo procesarlo con calma.", "dimension": "S"}, {"text": "Cuando cometo un error, reviso a fondo qué falló en el proceso.", "dimension": "C"}]}'::jsonb),
  (20, 'Bloque 20 — Participación en reuniones. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "En las reuniones, impulso que se tomen decisiones rápido.", "dimension": "D"}, {"text": "En las reuniones, aporto energía y participo activamente.", "dimension": "I"}, {"text": "En las reuniones, escucho más de lo que hablo.", "dimension": "S"}, {"text": "En las reuniones, tomo notas detalladas y sigo la agenda.", "dimension": "C"}]}'::jsonb),
  (21, 'Bloque 21 — Manejo de clientes. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Con los clientes, soy directo sobre lo que podemos ofrecer.", "dimension": "D"}, {"text": "Con los clientes, genero simpatía y cercanía rápidamente.", "dimension": "I"}, {"text": "Con los clientes, soy paciente y atento a sus necesidades.", "dimension": "S"}, {"text": "Con los clientes, soy meticuloso al explicar términos y condiciones.", "dimension": "C"}]}'::jsonb),
  (22, 'Bloque 22 — Planeación. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Planeo lo mínimo necesario y ajusto sobre la marcha.", "dimension": "D"}, {"text": "Planeo de forma flexible, dejando espacio a la improvisación.", "dimension": "I"}, {"text": "Planeo con anticipación para evitar sorpresas.", "dimension": "S"}, {"text": "Planeo cada detalle antes de comenzar cualquier proyecto.", "dimension": "C"}]}'::jsonb),
  (23, 'Bloque 23 — Tolerancia al riesgo. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Tomo riesgos calculados si el beneficio potencial es alto.", "dimension": "D"}, {"text": "Me entusiasma probar cosas nuevas aunque el resultado sea incierto.", "dimension": "I"}, {"text": "Prefiero opciones seguras y evitar riesgos innecesarios.", "dimension": "S"}, {"text": "Evalúo minuciosamente los riesgos antes de decidir algo.", "dimension": "C"}]}'::jsonb),
  (24, 'Bloque 24 — Manejo de crisis. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "En una crisis, tomo el control y doy instrucciones claras.", "dimension": "D"}, {"text": "En una crisis, mantengo al equipo motivado y unido.", "dimension": "I"}, {"text": "En una crisis, transmito calma y estabilidad a los demás.", "dimension": "S"}, {"text": "En una crisis, sigo el protocolo establecido paso a paso.", "dimension": "C"}]}'::jsonb),
  (25, 'Bloque 25 — Presentaciones. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Al presentar, voy directo a las conclusiones y resultados.", "dimension": "D"}, {"text": "Al presentar, uso historias y ejemplos para conectar con la audiencia.", "dimension": "I"}, {"text": "Al presentar, prefiero un tono tranquilo y constante.", "dimension": "S"}, {"text": "Al presentar, cuido cada dato y cifra que incluyo.", "dimension": "C"}]}'::jsonb),
  (26, 'Bloque 26 — Negociación. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Negocio buscando ganar la mejor condición posible.", "dimension": "D"}, {"text": "Negocio construyendo una relación de confianza primero.", "dimension": "I"}, {"text": "Negocio buscando que ambas partes queden conformes.", "dimension": "S"}, {"text": "Negocio apoyándome en datos y argumentos objetivos.", "dimension": "C"}]}'::jsonb),
  (27, 'Bloque 27 — Creatividad e innovación. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Impulso ideas nuevas aunque rompan con lo establecido.", "dimension": "D"}, {"text": "Genero ideas originales y me gusta compartirlas con entusiasmo.", "dimension": "I"}, {"text": "Prefiero mejorar lo existente antes que innovar radicalmente.", "dimension": "S"}, {"text": "Innovo dentro de un marco ordenado y probado.", "dimension": "C"}]}'::jsonb),
  (28, 'Bloque 28 — Cierre de proyectos. Elige la frase que MÁS y la que MENOS te describe en el trabajo.', '{"options": [{"text": "Al cerrar un proyecto, me enfoco en los resultados obtenidos.", "dimension": "D"}, {"text": "Al cerrar un proyecto, celebro los logros con el equipo.", "dimension": "I"}, {"text": "Al cerrar un proyecto, agradezco el esfuerzo constante de todos.", "dimension": "S"}, {"text": "Al cerrar un proyecto, reviso que toda la documentación esté completa.", "dimension": "C"}]}'::jsonb)
) as v(order_index, prompt_text, options_json)
where ad.code = 'behavioral'
on conflict do nothing;

-- ============================================================================
-- COGNITIVE: 40 preguntas multiple_choice
-- ============================================================================
insert into public.questions
  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'multiple_choice', v.dimension, v.prompt_text, v.options_json::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'razonamiento_abstracto', '¿Qué número sigue en la secuencia: 2, 6, 12, 20, 30, ___?', '{"choices": ["36", "40", "42", "44"], "correct_index": 2}'::jsonb),
  (2, 'razonamiento_abstracto', '¿Qué número sigue en la secuencia: 1, 1, 2, 3, 5, 8, ___?', '{"choices": ["11", "12", "13", "15"], "correct_index": 2}'::jsonb),
  (3, 'razonamiento_abstracto', '¿Qué número sigue en la secuencia: 3, 9, 27, 81, ___?', '{"choices": ["162", "216", "243", "324"], "correct_index": 2}'::jsonb),
  (4, 'razonamiento_abstracto', '¿Qué número sigue en la secuencia: 100, 90, 81, 73, 66, ___?', '{"choices": ["58", "59", "60", "61"], "correct_index": 2}'::jsonb),
  (5, 'razonamiento_abstracto', '¿Qué letra sigue en la secuencia: A, C, F, J, O, ___?', '{"choices": ["T", "U", "V", "S"], "correct_index": 1}'::jsonb),
  (6, 'razonamiento_abstracto', 'Complete la analogía: Libro es a Biblioteca como Cuadro es a ___.', '{"choices": ["Museo", "Pintor", "Marco", "Lienzo"], "correct_index": 0}'::jsonb),
  (7, 'razonamiento_analitico', 'Si todos los gerentes son líderes, y algunos líderes son innovadores, entonces:', '{"choices": ["Todos los gerentes son innovadores", "Algunos gerentes podrían ser innovadores", "Ningún gerente es innovador", "Todos los innovadores son gerentes"], "correct_index": 1}'::jsonb),
  (8, 'razonamiento_analitico', 'Ana es más alta que Beatriz. Beatriz es más alta que Carla. ¿Quién es la más baja?', '{"choices": ["Ana", "Beatriz", "Carla", "No se puede determinar"], "correct_index": 2}'::jsonb),
  (9, 'razonamiento_analitico', 'Un tren sale de la ciudad A a 60 km/h y otro de la ciudad B (a 300 km de distancia) a 40 km/h, al mismo tiempo, uno hacia el otro. ¿En cuántas horas se encuentran?', '{"choices": ["2", "2.5", "3", "3.5"], "correct_index": 2}'::jsonb),
  (10, 'razonamiento_analitico', 'Si el doble de un número, menos 5, es igual a 15, ¿cuál es el número?', '{"choices": ["5", "8", "10", "12"], "correct_index": 2}'::jsonb),
  (11, 'razonamiento_analitico', 'En una empresa, el 40% de los empleados son mujeres. Si hay 60 hombres, ¿cuántos empleados hay en total?', '{"choices": ["80", "100", "120", "150"], "correct_index": 1}'::jsonb),
  (12, 'razonamiento_analitico', 'Tres socios reparten $900 de utilidades en partes proporcionales a 2:3:4. ¿Cuánto recibe el socio con la mayor parte?', '{"choices": ["300", "350", "400", "450"], "correct_index": 2}'::jsonb),
  (13, 'reconocimiento_patrones', '¿Qué palabra no pertenece al grupo: Manzana, Plátano, Zanahoria, Naranja?', '{"choices": ["Manzana", "Plátano", "Zanahoria", "Naranja"], "correct_index": 2}'::jsonb),
  (14, 'reconocimiento_patrones', '¿Qué número no pertenece a la serie: 4, 9, 16, 20, 25?', '{"choices": ["4", "9", "20", "25"], "correct_index": 2}'::jsonb),
  (15, 'reconocimiento_patrones', 'Encuentra el patrón y complétalo: AB, BC, CD, DE, ___', '{"choices": ["EF", "DF", "FG", "EG"], "correct_index": 0}'::jsonb),
  (16, 'reconocimiento_patrones', '¿Qué figura no pertenece al grupo: Triángulo, Cuadrado, Círculo, Cubo?', '{"choices": ["Triángulo", "Cuadrado", "Círculo", "Cubo"], "correct_index": 3}'::jsonb),
  (17, 'reconocimiento_patrones', 'Identifica el elemento que no pertenece al grupo: Martillo, Destornillador, Llave inglesa, Manzana.', '{"choices": ["Martillo", "Destornillador", "Llave inglesa", "Manzana"], "correct_index": 3}'::jsonb),
  (18, 'reconocimiento_patrones', 'Completa el patrón numérico: 5, 10, 9, 18, 17, 34, ___ (la regla alterna: multiplicar por 2, luego restar 1)', '{"choices": ["33", "35", "36", "32"], "correct_index": 0}'::jsonb),
  (19, 'concentracion', 'Cuenta cuántas veces aparece la letra "r" (sin importar mayúscula/minúscula) en la frase: "El director revisará el reporte trimestral con responsabilidad y rigor".', '{"choices": ["9", "10", "11", "13"], "correct_index": 2}'::jsonb),
  (20, 'concentracion', 'Cuenta cuántas veces aparece la letra "e" (sin importar mayúscula/minúscula) en la frase: "La organización necesita mejorar la comunicación entre departamentos para operar mejor".', '{"choices": ["7", "8", "9", "10"], "correct_index": 2}'::jsonb),
  (21, 'concentracion', '¿Cuántos números pares hay en la siguiente lista: 12, 7, 8, 15, 20, 33, 6?', '{"choices": ["3", "4", "5", "6"], "correct_index": 1}'::jsonb),
  (22, 'concentracion', 'Observa la siguiente serie de códigos: 4471, 4471, 4471, 4417, 4471. ¿Cuál código es diferente a los demás?', '{"choices": ["4471 (primero)", "4471 (segundo)", "4417 (cuarto)", "4471 (quinto)"], "correct_index": 2}'::jsonb),
  (23, 'concentracion', 'Observa la siguiente serie de palabras: azul, azul, azul, azul, azúl. ¿Cuál palabra está escrita de forma diferente a las demás?', '{"choices": ["La primera (azul)", "La segunda (azul)", "La cuarta (azul)", "La quinta (azúl)"], "correct_index": 3}'::jsonb),
  (24, 'concentracion', 'Cuenta cuántas veces aparece la palabra "meta" en el siguiente texto: "Cada meta requiere un plan; sin una meta clara no hay meta alcanzable, y toda meta necesita seguimiento".', '{"choices": ["3", "4", "5", "6"], "correct_index": 1}'::jsonb),
  (25, 'juicio', 'Un colaborador de tu equipo comete un error que afecta a un cliente. ¿Cuál es la mejor acción?', '{"choices": ["Ignorar el error para no generar conflicto", "Culpar públicamente al colaborador frente al cliente", "Reconocer el error ante el cliente, corregirlo y dar retroalimentación privada al colaborador", "Esperar a que el cliente no se dé cuenta"], "correct_index": 2}'::jsonb),
  (26, 'juicio', 'Recibes instrucciones contradictorias de dos jefes distintos sobre la misma tarea. ¿Qué deberías hacer primero?', '{"choices": ["Elegir la instrucción del jefe de mayor jerarquía sin decir nada", "Aclarar directamente con ambos jefes para alinear la instrucción antes de actuar", "Ignorar ambas instrucciones y hacer lo que te parezca mejor", "Retrasar la tarea indefinidamente hasta que se resuelva solo"], "correct_index": 1}'::jsonb),
  (27, 'juicio', 'Un cliente importante solicita una excepción que viola una política interna clave. ¿Cuál es la mejor respuesta?', '{"choices": ["Aceptar la excepción sin consultar para no perder al cliente", "Explicar la política, buscar alternativas dentro de las reglas y escalar si es necesario", "Negarse rotundamente sin dar explicación", "Aceptar la excepción solo si nadie se entera"], "correct_index": 1}'::jsonb),
  (28, 'juicio', 'Detectas que un proveedor te cobró de más por error. ¿Qué deberías hacer?', '{"choices": ["Quedarte callado porque beneficia a tu empresa", "Informar el error al proveedor y solicitar el ajuste correspondiente", "Aprovechar el error en futuras negociaciones sin decir nada", "Reportarlo solo si el proveedor lo nota primero"], "correct_index": 1}'::jsonb),
  (29, 'juicio', 'Tienes que elegir entre cumplir una fecha límite entregando un trabajo con errores menores, o pedir un día extra para entregarlo sin errores. ¿Qué es más razonable?', '{"choices": ["Entregar siempre a tiempo sin importar la calidad", "Evaluar el impacto de los errores y el de la demora, y comunicar la situación con anticipación", "Entregar tarde sin avisar a nadie", "Pedir que otra persona entregue por ti"], "correct_index": 1}'::jsonb),
  (30, 'juicio', 'Un compañero te pide que cubras una falta suya sin justificación ante tu jefe. ¿Qué deberías hacer?', '{"choices": ["Mentir por él para mantener la relación", "Explicarle que no puedes mentir, pero ofrecerle ayuda para resolver la situación de forma honesta", "Reportarlo inmediatamente sin hablar con él primero", "Ignorar la petición sin decir nada"], "correct_index": 1}'::jsonb),
  (31, 'organizacion', 'Tienes 5 tareas con distintas fechas límite y complejidad. ¿Cuál es la mejor forma de organizarlas?', '{"choices": ["Hacer primero la más fácil sin importar la fecha límite", "Priorizar según urgencia e impacto, usando una lista o herramienta de seguimiento", "Hacer todas al mismo tiempo", "Esperar a que alguien te diga cuál hacer primero"], "correct_index": 1}'::jsonb),
  (32, 'organizacion', '¿Cuál es la mejor práctica para organizar el correo electrónico de trabajo?', '{"choices": ["Dejar todo en la bandeja de entrada sin clasificar", "Usar carpetas, etiquetas o reglas para clasificar y dar seguimiento", "Borrar los correos apenas se leen", "Responder solo los correos que llegan en la mañana"], "correct_index": 1}'::jsonb),
  (33, 'organizacion', 'Antes de iniciar un proyecto nuevo, ¿qué deberías organizar primero?', '{"choices": ["Los recursos, el alcance y los responsables de cada tarea", "La celebración del cierre del proyecto", "Solo la fecha de entrega final", "Nada, es mejor improvisar sobre la marcha"], "correct_index": 0}'::jsonb),
  (34, 'organizacion', 'Tu escritorio y archivos digitales están desordenados y te cuesta encontrar información. ¿Qué deberías hacer?', '{"choices": ["Aceptar que así es tu forma de trabajar y seguir igual", "Definir una estructura de carpetas y nomenclatura clara para archivos", "Pedirle a otra persona que siempre busque la información por ti", "Guardar todo con el mismo nombre para no pensar en categorías"], "correct_index": 1}'::jsonb),
  (35, 'organizacion', '¿Cuál es la mejor manera de dar seguimiento a los compromisos de un equipo?', '{"choices": ["Confiar en que cada quien recuerde sus tareas", "Llevar un tablero o lista compartida con responsables y fechas", "Preguntar solo cuando el proyecto ya está atrasado", "No dar seguimiento para no parecer controlador"], "correct_index": 1}'::jsonb),
  (36, 'planeacion', 'Al planear un proyecto de tres meses, ¿cuál es el primer paso recomendado?', '{"choices": ["Definir objetivos claros y los entregables esperados", "Empezar a ejecutar tareas de inmediato", "Elegir el nombre del proyecto", "Esperar a que surjan los problemas para planear"], "correct_index": 0}'::jsonb),
  (37, 'planeacion', '¿Qué se recomienda hacer cuando un plan enfrenta un imprevisto importante?', '{"choices": ["Abandonar el plan por completo", "Ajustar el plan evaluando el nuevo panorama y comunicando los cambios", "Ignorar el imprevisto y seguir igual", "Culpar a quien causó el imprevisto y detener todo"], "correct_index": 1}'::jsonb),
  (38, 'planeacion', '¿Cuál es una buena práctica al establecer metas de trabajo?', '{"choices": ["Que sean vagas para tener flexibilidad total", "Que sean específicas, medibles y con fecha límite", "Que dependan solo de la suerte", "Que nadie más las conozca"], "correct_index": 1}'::jsonb),
  (39, 'planeacion', 'Para planear la capacidad de un equipo en el próximo trimestre, ¿qué deberías considerar primero?', '{"choices": ["Solo el entusiasmo del equipo", "La carga de trabajo actual, las vacaciones y la disponibilidad real", "Ignorar la carga actual y asignar tareas parejo", "Planear sin consultar al equipo"], "correct_index": 1}'::jsonb),
  (40, 'planeacion', '¿Qué práctica ayuda más a anticipar riesgos en un proyecto?', '{"choices": ["No pensar en riesgos hasta que ocurran", "Hacer un análisis de riesgos al inicio y revisarlo periódicamente", "Delegar todos los riesgos a un solo responsable sin revisión", "Evitar hablar de riesgos para no generar preocupación"], "correct_index": 1}'::jsonb)
) as v(order_index, dimension, prompt_text, options_json)
where ad.code = 'cognitive'
on conflict do nothing;

-- ============================================================================
-- PERSONALITY: 120 preguntas likert5 (13 dimensiones)
-- ============================================================================
insert into public.questions
  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, v.is_reverse
from public.assessment_definitions ad,
(values
  (1, 'liderazgo', 'Me resulta natural asumir el rol de líder cuando un grupo lo necesita.', false),
  (2, 'liderazgo', 'Los demás suelen buscarme para que guíe decisiones importantes.', false),
  (3, 'liderazgo', 'Disfruto inspirar a otros para que den su mejor esfuerzo.', false),
  (4, 'liderazgo', 'Prefiero mantenerme al margen y dejar que otros lideren.', true),
  (5, 'liderazgo', 'Me siento cómodo marcando el rumbo cuando el equipo está indeciso.', false),
  (6, 'liderazgo', 'Evito tomar el liderazgo incluso cuando nadie más lo hace.', true),
  (7, 'liderazgo', 'Sé transmitir una visión clara que motiva a otros a seguirme.', false),
  (8, 'liderazgo', 'Tomo la responsabilidad de los resultados del grupo, buenos o malos.', false),
  (9, 'liderazgo', 'Me cuesta influir en las decisiones de un grupo.', true),
  (10, 'liderazgo', 'Cuando surge un problema en el equipo, propongo el camino a seguir.', false),
  (11, 'iniciativa', 'Propongo mejoras sin que nadie me lo pida.', false),
  (12, 'iniciativa', 'Actúo antes de que los problemas se vuelvan urgentes.', false),
  (13, 'iniciativa', 'Prefiero esperar a que me digan exactamente qué hacer.', true),
  (14, 'iniciativa', 'Busco oportunidades para aportar más allá de mis funciones.', false),
  (15, 'iniciativa', 'Suelo dejar pasar ideas porque no quiero tomar la delantera.', true),
  (16, 'iniciativa', 'Me adelanto a las necesidades antes de que surjan.', false),
  (17, 'iniciativa', 'Empiezo tareas nuevas por convicción propia, no por obligación.', false),
  (18, 'iniciativa', 'Cuando veo algo que se puede mejorar, actúo de inmediato.', false),
  (19, 'iniciativa', 'Rara vez propongo algo si no me lo piden explícitamente.', true),
  (20, 'persistencia', 'Sigo intentando aunque los primeros resultados no sean buenos.', false),
  (21, 'persistencia', 'Termino lo que empiezo, incluso cuando se vuelve difícil.', false),
  (22, 'persistencia', 'Me doy por vencido fácilmente ante los primeros obstáculos.', true),
  (23, 'persistencia', 'Mantengo el esfuerzo constante hasta lograr el objetivo.', false),
  (24, 'persistencia', 'Cuando un proyecto se complica, tiendo a abandonarlo.', true),
  (25, 'persistencia', 'Insisto en encontrar una solución aunque tome mucho tiempo.', false),
  (26, 'persistencia', 'No me rindo aunque el camino se vuelva largo y tedioso.', false),
  (27, 'persistencia', 'Prefiero cambiar de actividad en cuanto algo se pone cuesta arriba.', true),
  (28, 'persistencia', 'Vuelvo a intentarlo las veces que sea necesario hasta conseguirlo.', false),
  (29, 'orientacion_logro', 'Me fijo metas exigentes y trabajo para alcanzarlas.', false),
  (30, 'orientacion_logro', 'Me motiva superar mis propios resultados anteriores.', false),
  (31, 'orientacion_logro', 'Me conformo con hacer lo mínimo necesario.', true),
  (32, 'orientacion_logro', 'Disfruto medir mi progreso frente a objetivos concretos.', false),
  (33, 'orientacion_logro', 'No me importa mucho si mis resultados son sobresalientes o no.', true),
  (34, 'orientacion_logro', 'Busco constantemente formas de mejorar mi desempeño.', false),
  (35, 'orientacion_logro', 'Siento satisfacción genuina cuando logro una meta difícil.', false),
  (36, 'orientacion_logro', 'Prefiero metas fáciles de alcanzar antes que metas ambiciosas.', true),
  (37, 'orientacion_logro', 'Me esfuerzo más cuando el reto que enfrento es significativo.', false),
  (38, 'necesidad_supervision', 'Necesito que alguien revise mi trabajo con frecuencia para sentirme seguro.', false),
  (39, 'necesidad_supervision', 'Rindo mejor cuando tengo instrucciones detalladas paso a paso.', false),
  (40, 'necesidad_supervision', 'Trabajo igual de bien con o sin supervisión constante.', true),
  (41, 'necesidad_supervision', 'Prefiero que mi jefe apruebe cada decisión antes de avanzar.', false),
  (42, 'necesidad_supervision', 'Me siento cómodo tomando decisiones sin consultar a nadie.', true),
  (43, 'necesidad_supervision', 'Sin una guía clara, me cuesta avanzar en mis tareas.', false),
  (44, 'necesidad_supervision', 'Suelo pedir confirmación antes de continuar con un trabajo importante.', false),
  (45, 'necesidad_supervision', 'Puedo organizarme solo, sin que nadie esté verificando mi avance.', true),
  (46, 'necesidad_supervision', 'Me tranquiliza que alguien supervise de cerca lo que hago.', false),
  (47, 'sociabilidad', 'Disfruto conocer gente nueva en el trabajo.', false),
  (48, 'sociabilidad', 'Me energiza pasar tiempo conversando con mis colegas.', false),
  (49, 'sociabilidad', 'Prefiero trabajar en silencio y sin interactuar demasiado.', true),
  (50, 'sociabilidad', 'Participo activamente en actividades sociales de la empresa.', false),
  (51, 'sociabilidad', 'Me resulta agotador socializar durante la jornada laboral.', true),
  (52, 'sociabilidad', 'Entablo conversación fácilmente con personas que no conozco.', false),
  (53, 'sociabilidad', 'Busco oportunidades para relacionarme con distintas áreas de la organización.', false),
  (54, 'sociabilidad', 'Prefiero mantenerme alejado de las reuniones informales del equipo.', true),
  (55, 'sociabilidad', 'Me gusta ser parte de grupos y actividades colectivas.', false),
  (56, 'estabilidad_emocional', 'Mantengo la calma incluso en situaciones tensas.', false),
  (57, 'estabilidad_emocional', 'Puedo manejar las críticas sin que afecten mi estado de ánimo por mucho tiempo.', false),
  (58, 'estabilidad_emocional', 'Me altero con facilidad ante los imprevistos.', true),
  (59, 'estabilidad_emocional', 'Recupero mi equilibrio emocional rápido después de un mal momento.', false),
  (60, 'estabilidad_emocional', 'Los cambios inesperados me generan ansiedad considerable.', true),
  (61, 'estabilidad_emocional', 'Enfrento los problemas con serenidad, sin dramatizar.', false),
  (62, 'estabilidad_emocional', 'Las presiones del trabajo rara vez me hacen perder la compostura.', false),
  (63, 'estabilidad_emocional', 'Puedo tomar decisiones con la cabeza fría incluso bajo estrés.', false),
  (64, 'estabilidad_emocional', 'Suelo preocuparme en exceso por cosas que aún no han pasado.', true),
  (65, 'comunicacion', 'Expreso mis ideas de forma clara y ordenada.', false),
  (66, 'comunicacion', 'Me aseguro de que mi mensaje se entienda antes de terminar de hablar.', false),
  (67, 'comunicacion', 'Me cuesta poner en palabras lo que pienso.', true),
  (68, 'comunicacion', 'Adapto mi forma de comunicar según la persona que tengo enfrente.', false),
  (69, 'comunicacion', 'Suelo dar explicaciones confusas o desordenadas.', true),
  (70, 'comunicacion', 'Escucho activamente antes de responder en una conversación.', false),
  (71, 'comunicacion', 'Soy capaz de explicar temas complejos de forma sencilla.', false),
  (72, 'comunicacion', 'Prefiero evitar dar explicaciones y esperar que los demás entiendan solos.', true),
  (73, 'comunicacion', 'Me comunico con seguridad tanto en grupos pequeños como grandes.', false),
  (74, 'adaptabilidad', 'Me ajusto con facilidad a cambios repentinos en mis tareas.', false),
  (75, 'adaptabilidad', 'Encuentro nuevas formas de trabajar cuando las condiciones cambian.', false),
  (76, 'adaptabilidad', 'Me cuesta mucho salir de mi forma habitual de hacer las cosas.', true),
  (77, 'adaptabilidad', 'Me adapto bien a distintos estilos de trabajo y de personas.', false),
  (78, 'adaptabilidad', 'Los cambios de planes de último momento me desestabilizan por completo.', true),
  (79, 'adaptabilidad', 'Veo el cambio como una oportunidad más que como una amenaza.', false),
  (80, 'adaptabilidad', 'Puedo cambiar de estrategia rápido si la actual no está funcionando.', false),
  (81, 'adaptabilidad', 'Prefiero que todo se mantenga exactamente igual siempre.', true),
  (82, 'adaptabilidad', 'Me adapto con facilidad a nuevas herramientas o tecnologías.', false),
  (83, 'apego_normas', 'Sigo cuidadosamente las políticas y procedimientos de mi empresa.', false),
  (84, 'apego_normas', 'Considero importante respetar las reglas aunque no esté de acuerdo con todas.', false),
  (85, 'apego_normas', 'Suelo saltarme procedimientos si me parecen poco prácticos.', true),
  (86, 'apego_normas', 'Cumplo los lineamientos establecidos incluso cuando nadie los está revisando.', false),
  (87, 'apego_normas', 'Prefiero encontrar atajos aunque no sigan el proceso oficial.', true),
  (88, 'apego_normas', 'Me tomo en serio las normas de seguridad y calidad.', false),
  (89, 'apego_normas', 'Documento mi trabajo según los estándares definidos por la organización.', false),
  (90, 'apego_normas', 'Ajusto las reglas a mi conveniencia cuando creo que nadie se dará cuenta.', true),
  (91, 'apego_normas', 'Respeto los protocolos aunque impliquen invertir más tiempo de trabajo.', false),
  (92, 'responsabilidad', 'Cumplo mis compromisos laborales sin necesidad de recordatorios.', false),
  (93, 'responsabilidad', 'Me hago cargo de mis errores en lugar de buscar excusas.', false),
  (94, 'responsabilidad', 'A veces dejo tareas pendientes sin avisar a nadie.', true),
  (95, 'responsabilidad', 'Entrego mi trabajo en los tiempos acordados.', false),
  (96, 'responsabilidad', 'Suelo justificar mis fallas culpando a otros.', true),
  (97, 'responsabilidad', 'Cuido los recursos de la empresa como si fueran propios.', false),
  (98, 'responsabilidad', 'Asumo las consecuencias de mis decisiones, sean buenas o malas.', false),
  (99, 'responsabilidad', 'Con frecuencia llego tarde a mis compromisos laborales.', true),
  (100, 'responsabilidad', 'Cumplo mi palabra incluso cuando resulta incómodo.', false),
  (101, 'responsabilidad', 'Reviso mi propio trabajo para asegurarme de que cumple lo prometido.', false),
  (102, 'independencia', 'Prefiero resolver los problemas por mí mismo antes de pedir ayuda.', false),
  (103, 'independencia', 'Tomo decisiones basadas en mi propio criterio.', false),
  (104, 'independencia', 'Necesito la aprobación de otros para sentirme seguro de mis decisiones.', true),
  (105, 'independencia', 'Me organizo bien sin depender de instrucciones constantes.', false),
  (106, 'independencia', 'Sigo la opinión de la mayoría aunque no esté de acuerdo con ella.', true),
  (107, 'independencia', 'Confío en mi propio juicio para actuar en situaciones ambiguas.', false),
  (108, 'independencia', 'Defiendo mi punto de vista incluso si no es el más popular.', false),
  (109, 'independencia', 'Me cuesta actuar si no tengo el visto bueno de alguien más.', true),
  (110, 'independencia', 'Prefiero trazar mi propio camino en lugar de seguir el de otros.', false),
  (111, 'orientacion_equipo', 'Colaboro activamente para alcanzar los objetivos comunes del equipo.', false),
  (112, 'orientacion_equipo', 'Comparto información relevante con mis compañeros sin que me la pidan.', false),
  (113, 'orientacion_equipo', 'Prefiero trabajar solo aunque el proyecto requiera colaboración.', true),
  (114, 'orientacion_equipo', 'Celebro los logros del equipo tanto como los míos propios.', false),
  (115, 'orientacion_equipo', 'Me cuesta confiar en el trabajo que hacen otras personas.', true),
  (116, 'orientacion_equipo', 'Ayudo a mis compañeros aunque no sea parte directa de mi tarea.', false),
  (117, 'orientacion_equipo', 'Considero las ideas de otros aunque sean distintas a las mías.', false),
  (118, 'orientacion_equipo', 'Prefiero que el mérito de un logro grupal sea solo mío.', true),
  (119, 'orientacion_equipo', 'Me adapto a los roles que el equipo necesita en cada momento.', false),
  (120, 'orientacion_equipo', 'Busco activamente la opinión de mis compañeros antes de decidir algo que los afecta.', false)
) as v(order_index, dimension, prompt_text, is_reverse)
where ad.code = 'personality'
on conflict do nothing;

-- ============================================================================
-- COMPETENCIES: 60 preguntas likert5 (14 competencias)
-- ============================================================================
insert into public.questions
  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'liderazgo', 'Guío a mi equipo hacia objetivos claros y compartidos.'),
  (2, 'liderazgo', 'Inspiro confianza en las personas con las que trabajo.'),
  (3, 'liderazgo', 'Tomo el mando cuando la situación lo requiere, sin esperar a que otros lo hagan.'),
  (4, 'liderazgo', 'Reconozco los logros de mi equipo de forma oportuna.'),
  (5, 'liderazgo', 'Adapto mi estilo de liderazgo según la persona y la situación.'),
  (6, 'delegacion', 'Asigno tareas considerando las fortalezas de cada persona del equipo.'),
  (7, 'delegacion', 'Delego con instrucciones claras sobre el resultado esperado.'),
  (8, 'delegacion', 'Confío en que las personas a quienes delego pueden hacer bien su trabajo.'),
  (9, 'delegacion', 'Doy seguimiento a lo delegado sin caer en el microgerenciamiento.'),
  (10, 'inteligencia_emocional', 'Reconozco mis propias emociones antes de que afecten mi trabajo.'),
  (11, 'inteligencia_emocional', 'Entiendo cómo se sienten los demás incluso cuando no lo dicen abiertamente.'),
  (12, 'inteligencia_emocional', 'Manejo mis reacciones ante situaciones difíciles con las personas.'),
  (13, 'inteligencia_emocional', 'Ayudo a calmar tensiones cuando percibo que un compañero está alterado.'),
  (14, 'comunicacion', 'Explico mis ideas de forma clara y fácil de entender.'),
  (15, 'comunicacion', 'Adapto mi mensaje según quién me esté escuchando.'),
  (16, 'comunicacion', 'Escucho con atención antes de responder en una conversación de trabajo.'),
  (17, 'comunicacion', 'Doy retroalimentación de forma directa y respetuosa.'),
  (18, 'comunicacion', 'Me aseguro de confirmar que el mensaje fue comprendido correctamente.'),
  (19, 'trabajo_equipo', 'Colaboro con otras áreas para lograr objetivos comunes.'),
  (20, 'trabajo_equipo', 'Comparto información útil con mis compañeros sin que me la pidan.'),
  (21, 'trabajo_equipo', 'Apoyo a mi equipo incluso cuando la tarea no es responsabilidad mía directa.'),
  (22, 'trabajo_equipo', 'Contribuyo a mantener un buen ambiente de trabajo dentro del equipo.'),
  (23, 'toma_decisiones', 'Analizo la información disponible antes de decidir.'),
  (24, 'toma_decisiones', 'Tomo decisiones oportunas incluso con información incompleta.'),
  (25, 'toma_decisiones', 'Considero las consecuencias de mis decisiones antes de actuar.'),
  (26, 'toma_decisiones', 'Asumo la responsabilidad de las decisiones que tomo, sean acertadas o no.'),
  (27, 'toma_decisiones', 'Pido opiniones relevantes antes de decisiones que afectan a otros.'),
  (28, 'planeacion', 'Defino objetivos claros antes de iniciar un proyecto.'),
  (29, 'planeacion', 'Anticipo los recursos necesarios para completar mis tareas a tiempo.'),
  (30, 'planeacion', 'Establezco plazos realistas para mis actividades.'),
  (31, 'planeacion', 'Ajusto mis planes cuando surgen imprevistos importantes.'),
  (32, 'organizacion', 'Mantengo mis tareas y prioridades claramente ordenadas.'),
  (33, 'organizacion', 'Utilizo herramientas o listas para dar seguimiento a mis pendientes.'),
  (34, 'organizacion', 'Encuentro rápido la información que necesito para trabajar.'),
  (35, 'organizacion', 'Organizo mi tiempo de forma que pueda cumplir con múltiples compromisos.'),
  (36, 'orientacion_servicio', 'Atiendo las necesidades de mis clientes internos o externos con prontitud.'),
  (37, 'orientacion_servicio', 'Busco activamente formas de mejorar la experiencia de quien recibe mi trabajo.'),
  (38, 'orientacion_servicio', 'Mantengo una actitud amable incluso ante clientes exigentes o molestos.'),
  (39, 'orientacion_servicio', 'Doy seguimiento a las solicitudes hasta confirmar que quedaron resueltas.'),
  (40, 'seguimiento_control', 'Doy seguimiento constante a los compromisos de mi equipo hasta verlos concluidos.'),
  (41, 'seguimiento_control', 'Verifico que las tareas se completen conforme a lo acordado.'),
  (42, 'seguimiento_control', 'Detecto desviaciones en un proceso antes de que se conviertan en un problema mayor.'),
  (43, 'seguimiento_control', 'Llevo un control claro del avance de mis proyectos.'),
  (44, 'tolerancia_presion', 'Mantengo un buen desempeño incluso cuando tengo múltiples tareas urgentes.'),
  (45, 'tolerancia_presion', 'Trabajo con calma aun cuando los plazos son muy ajustados.'),
  (46, 'tolerancia_presion', 'No dejo que el estrés afecte la calidad de mi trabajo.'),
  (47, 'tolerancia_presion', 'Sigo tomando buenas decisiones incluso en momentos de alta exigencia.'),
  (48, 'orientacion_resultados', 'Me enfoco en lograr los objetivos establecidos, no solo en cumplir tareas.'),
  (49, 'orientacion_resultados', 'Busco constantemente formas de mejorar mis resultados.'),
  (50, 'orientacion_resultados', 'Persisto en un objetivo aunque encuentre obstáculos en el camino.'),
  (51, 'orientacion_resultados', 'Mido mi desempeño en función de resultados concretos.'),
  (52, 'orientacion_resultados', 'Ajusto mi estrategia cuando veo que no estoy logrando el resultado esperado.'),
  (53, 'resolucion_problemas', 'Identifico la causa raíz de un problema antes de actuar.'),
  (54, 'resolucion_problemas', 'Propongo soluciones prácticas ante los obstáculos que se presentan.'),
  (55, 'resolucion_problemas', 'Analizo distintas alternativas antes de elegir cómo resolver un problema.'),
  (56, 'resolucion_problemas', 'Resuelvo problemas de forma metódica en lugar de improvisar sin rumbo.'),
  (57, 'desarrollo_colaboradores', 'Invierto tiempo en enseñar y guiar a las personas de mi equipo.'),
  (58, 'desarrollo_colaboradores', 'Doy retroalimentación que ayuda a otros a mejorar su desempeño.'),
  (59, 'desarrollo_colaboradores', 'Identifico el potencial de cada colaborador y busco desarrollarlo.'),
  (60, 'desarrollo_colaboradores', 'Celebro y reconozco el crecimiento profesional de mis compañeros.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'competencies'
on conflict do nothing;

-- ============================================================================
-- VALUES: 40 preguntas likert5 (8 dimensiones, incluye deseabilidad social inversa)
-- ============================================================================
insert into public.questions
  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, v.is_reverse
from public.assessment_definitions ad,
(values
  (1, 'honestidad', 'Digo la verdad aunque me traiga consecuencias incómodas.', false),
  (2, 'honestidad', 'Actúo de forma honesta incluso cuando nadie más lo notaría.', false),
  (3, 'honestidad', 'Alguna vez he exagerado un logro para verme mejor ante mi jefe.', true),
  (4, 'honestidad', 'Reconozco abiertamente cuando no sé algo, en lugar de aparentar que sí.', false),
  (5, 'honestidad', 'Evito dar información engañosa aunque me convenga en el corto plazo.', false),
  (6, 'etica', 'Tomo decisiones basándome en lo correcto, no solo en lo conveniente.', false),
  (7, 'etica', 'Rechazo beneficios que impliquen actuar de forma incorrecta.', false),
  (8, 'etica', 'En alguna ocasión he mirado hacia otro lado ante una situación poco ética para evitar problemas.', true),
  (9, 'etica', 'Actúo con los mismos principios éticos estando solo o acompañado.', false),
  (10, 'etica', 'Cuestiono decisiones que me parecen éticamente incorrectas, aunque vengan de un superior.', false),
  (11, 'responsabilidad', 'Cumplo mis compromisos laborales incluso cuando nadie los está verificando.', false),
  (12, 'responsabilidad', 'Asumo las consecuencias de mis errores en lugar de evadirlas.', false),
  (13, 'responsabilidad', 'En ocasiones he dejado que otros carguen con la culpa de algo que hice yo.', true),
  (14, 'responsabilidad', 'Cuido los recursos de la empresa como si fueran propios.', false),
  (15, 'responsabilidad', 'Cumplo mi palabra aunque implique un esfuerzo extra.', false),
  (16, 'respeto', 'Trato a todas las personas con respeto, sin importar su cargo.', false),
  (17, 'respeto', 'Escucho opiniones distintas a la mía sin descalificarlas.', false),
  (18, 'respeto', 'Evito comentarios que puedan herir u ofender a mis compañeros.', false),
  (19, 'respeto', 'A veces he hablado mal de un compañero a sus espaldas.', true),
  (20, 'respeto', 'Valoro la diversidad de opiniones y formas de trabajar de otras personas.', false),
  (21, 'justicia', 'Trato a las personas de forma equitativa, sin favoritismos.', false),
  (22, 'justicia', 'Reconozco los méritos de otros aunque no sean mis amigos cercanos.', false),
  (23, 'justicia', 'Distribuyo el trabajo de forma justa entre los miembros de un equipo.', false),
  (24, 'justicia', 'Alguna vez he favorecido a alguien cercano en una decisión laboral, aunque no fuera lo más justo.', true),
  (25, 'justicia', 'Defiendo la equidad aunque eso implique ir contra la opinión de la mayoría.', false),
  (26, 'lealtad', 'Defiendo a mi equipo y a mi empresa incluso cuando enfrentan críticas externas.', false),
  (27, 'lealtad', 'Mantengo la confidencialidad de la información sensible de mi organización.', false),
  (28, 'lealtad', 'Represento bien a mi empresa incluso fuera del horario laboral.', false),
  (29, 'lealtad', 'He compartido información confidencial de mi trabajo sin autorización.', true),
  (30, 'lealtad', 'Permanezco comprometido con mi equipo incluso en momentos difíciles.', false),
  (31, 'consistencia', 'Actúo de la misma manera sin importar quién me esté observando.', false),
  (32, 'consistencia', 'Mis decisiones siguen los mismos principios en distintas situaciones.', false),
  (33, 'consistencia', 'Cambio mi forma de actuar dependiendo de quién esté presente.', true),
  (34, 'consistencia', 'Soy constante en la calidad de mi trabajo, día tras día.', false),
  (35, 'consistencia', 'Mantengo mis valores firmes incluso bajo presión.', false),
  (36, 'confiabilidad', 'Las personas pueden confiar en que cumpliré lo que prometo.', false),
  (37, 'confiabilidad', 'Soy puntual y cumplo los tiempos que acuerdo con otros.', false),
  (38, 'confiabilidad', 'En ocasiones prometo cosas que sé que no podré cumplir.', true),
  (39, 'confiabilidad', 'Mantengo la calidad de mi trabajo incluso cuando nadie lo supervisa de cerca.', false),
  (40, 'confiabilidad', 'Soy la persona a la que mi equipo recurre cuando necesita algo confiable.', false)
) as v(order_index, dimension, prompt_text, is_reverse)
where ad.code = 'values'
on conflict do nothing;

-- ============================================================================
-- LEADERSHIP: 50 preguntas likert5 (11 dimensiones)
-- ============================================================================
insert into public.questions
  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'comunicacion', 'Comunico la visión y los objetivos de forma que todos los entiendan.'),
  (2, 'comunicacion', 'Adapto mi mensaje según la audiencia (equipo, dirección, clientes).'),
  (3, 'comunicacion', 'Escucho activamente las inquietudes de mi equipo antes de responder.'),
  (4, 'comunicacion', 'Transmito malas noticias con claridad y empatía cuando es necesario.'),
  (5, 'comunicacion', 'Mantengo informado a mi equipo sobre decisiones que los afectan.'),
  (6, 'delegacion', 'Delego responsabilidades importantes, no solo tareas operativas.'),
  (7, 'delegacion', 'Confío en las capacidades de mi equipo al delegar.'),
  (8, 'delegacion', 'Doy la autoridad necesaria junto con la responsabilidad que delego.'),
  (9, 'delegacion', 'Superviso lo delegado sin caer en el control excesivo.'),
  (10, 'negociacion', 'Negocio buscando acuerdos donde ambas partes salgan beneficiadas.'),
  (11, 'negociacion', 'Me preparo a fondo antes de una negociación importante.'),
  (12, 'negociacion', 'Identifico los intereses reales detrás de la posición de la otra parte.'),
  (13, 'negociacion', 'Mantengo la calma y la firmeza al negociar bajo presión.'),
  (14, 'pensamiento_estrategico', 'Anticipo tendencias del mercado antes de que afecten a mi organización.'),
  (15, 'pensamiento_estrategico', 'Conecto las metas de mi equipo con los objetivos generales del negocio.'),
  (16, 'pensamiento_estrategico', 'Evalúo escenarios de largo plazo antes de definir un curso de acción.'),
  (17, 'pensamiento_estrategico', 'Identifico oportunidades de crecimiento que otros no ven fácilmente.'),
  (18, 'pensamiento_estrategico', 'Priorizo iniciativas según su impacto estratégico, no solo su urgencia.'),
  (19, 'desarrollo_equipos', 'Invierto tiempo en identificar y potenciar el talento de mi equipo.'),
  (20, 'desarrollo_equipos', 'Creo oportunidades de crecimiento para las personas que lidero.'),
  (21, 'desarrollo_equipos', 'Doy retroalimentación que ayuda a mi equipo a desarrollarse profesionalmente.'),
  (22, 'desarrollo_equipos', 'Construyo planes de sucesión para los roles clave de mi equipo.'),
  (23, 'desarrollo_equipos', 'Fomento un ambiente donde las personas se sienten seguras para aprender de sus errores.'),
  (24, 'coaching', 'Hago preguntas que ayudan a otros a encontrar sus propias soluciones.'),
  (25, 'coaching', 'Acompaño el desarrollo de mi equipo con retroalimentación continua.'),
  (26, 'coaching', 'Ayudo a las personas a identificar sus propias áreas de mejora.'),
  (27, 'coaching', 'Dedico tiempo regular a conversaciones de desarrollo con mi equipo.'),
  (28, 'manejo_conflictos', 'Abordo los conflictos del equipo de forma directa y oportuna.'),
  (29, 'manejo_conflictos', 'Facilito que las partes en conflicto encuentren una solución en común.'),
  (30, 'manejo_conflictos', 'Mantengo la objetividad al mediar en desacuerdos entre colaboradores.'),
  (31, 'manejo_conflictos', 'Evito que los conflictos personales afecten el desempeño del equipo.'),
  (32, 'manejo_conflictos', 'Transformo los desacuerdos en oportunidades de mejora para el equipo.'),
  (33, 'toma_decisiones', 'Tomo decisiones difíciles con información incompleta cuando es necesario.'),
  (34, 'toma_decisiones', 'Involucro a las personas correctas antes de decisiones importantes.'),
  (35, 'toma_decisiones', 'Sopeso el impacto de mis decisiones en las distintas áreas del negocio.'),
  (36, 'toma_decisiones', 'Actúo con decisión incluso cuando la situación es ambigua.'),
  (37, 'toma_decisiones', 'Reviso los resultados de mis decisiones para aprender de ellos.'),
  (38, 'gestion_cambio', 'Lidero procesos de cambio comunicando el porqué detrás de ellos.'),
  (39, 'gestion_cambio', 'Ayudo a mi equipo a adaptarse a nuevas formas de trabajo.'),
  (40, 'gestion_cambio', 'Anticipo la resistencia al cambio y la gestiono proactivamente.'),
  (41, 'gestion_cambio', 'Mantengo la motivación del equipo durante periodos de transición.'),
  (42, 'gestion_cambio', 'Ajusto mi plan de cambio cuando la realidad lo requiere.'),
  (43, 'innovacion', 'Fomento que mi equipo proponga ideas nuevas sin miedo a equivocarse.'),
  (44, 'innovacion', 'Cuestiono formas de trabajo establecidas cuando ya no son eficientes.'),
  (45, 'innovacion', 'Impulso proyectos que introducen mejoras significativas.'),
  (46, 'innovacion', 'Doy espacio para experimentar con nuevas soluciones antes de descartarlas.'),
  (47, 'responsabilidad', 'Asumo la responsabilidad de los resultados de mi equipo, incluso los negativos.'),
  (48, 'responsabilidad', 'Cumplo los compromisos que hago con mi equipo y con la organización.'),
  (49, 'responsabilidad', 'Reconozco públicamente mis propios errores como líder.'),
  (50, 'responsabilidad', 'Exijo a mi equipo el mismo nivel de compromiso que exijo de mí mismo.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'leadership'
on conflict do nothing;

-- ============================================================================
-- ROLE_SPECIFIC: preguntas adicionales por rol (13 por rol, 91 en total).
-- Los ejemplos de Fase 1 (3 para 'sales', 3 para 'director') se conservan.
-- ============================================================================
-- Rol: sales
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'sales'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (4, 'prospeccion', 'Genero constantemente nuevas oportunidades de negocio a través de distintos canales.'),
  (5, 'prospeccion', 'Investigo a fondo a un prospecto antes de contactarlo por primera vez.'),
  (6, 'cierre', 'Reconozco las señales de compra y actúo en el momento adecuado para cerrar.'),
  (7, 'cierre', 'Utilizo técnicas de cierre adaptadas a cada tipo de cliente.'),
  (8, 'relacion_cliente', 'Doy seguimiento post-venta para asegurar la satisfacción del cliente.'),
  (9, 'manejo_objeciones', 'Escucho las objeciones del cliente sin ponerme a la defensiva.'),
  (10, 'manejo_objeciones', 'Respondo a las objeciones con argumentos claros basados en el valor de mi producto.'),
  (11, 'manejo_objeciones', 'Anticipo las objeciones más comunes y preparo respuestas antes de la reunión de venta.'),
  (12, 'resiliencia_rechazo', 'Un "no" de un cliente no afecta mi motivación para seguir prospectando.'),
  (13, 'resiliencia_rechazo', 'Aprendo de las ventas perdidas para mejorar mi siguiente intento.'),
  (14, 'resiliencia_rechazo', 'Mantengo una actitud positiva incluso después de una racha de rechazos.'),
  (15, 'orientacion_comercial', 'Identifico oportunidades de venta cruzada o adicional con clientes actuales.'),
  (16, 'orientacion_comercial', 'Me mantengo enfocado en cumplir y superar mis metas comerciales.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- Rol: commercial_manager
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'commercial_manager'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'gestion_equipo_comercial', 'Motivo a mi equipo comercial para alcanzar y superar sus cuotas de venta.'),
  (2, 'gestion_equipo_comercial', 'Doy seguimiento individual al desempeño de cada vendedor de mi equipo.'),
  (3, 'planeacion_estrategica', 'Defino la estrategia comercial del área alineada a los objetivos del negocio.'),
  (4, 'planeacion_estrategica', 'Anticipo cambios del mercado para ajustar la estrategia comercial a tiempo.'),
  (5, 'negociacion', 'Negocio condiciones comerciales que protegen la rentabilidad del negocio.'),
  (6, 'negociacion', 'Encuentro puntos de equilibrio en negociaciones complejas con distribuidores o socios.'),
  (7, 'gestion_cartera', 'Segmento mi cartera de clientes según su potencial y nivel de riesgo.'),
  (8, 'gestion_cartera', 'Superviso la salud de la cartera para anticipar la pérdida de clientes clave.'),
  (9, 'gestion_cartera', 'Balanceo la atención entre clientes actuales y la búsqueda de clientes nuevos.'),
  (10, 'forecasting', 'Elaboro pronósticos de venta basados en datos históricos y tendencias del mercado.'),
  (11, 'forecasting', 'Ajusto mis proyecciones comerciales cuando detecto desviaciones importantes.'),
  (12, 'negociacion_clientes_clave', 'Construyo relaciones de largo plazo con las cuentas más importantes de la empresa.'),
  (13, 'negociacion_clientes_clave', 'Negocio directamente con clientes clave las condiciones comerciales estratégicas.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- Rol: director
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'director'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (4, 'vision_negocio', 'Defino el rumbo estratégico de la organización a mediano y largo plazo.'),
  (5, 'vision_negocio', 'Identifico oportunidades de negocio antes de que se vuelvan evidentes para el mercado.'),
  (6, 'toma_decisiones', 'Tomo decisiones de alto impacto asumiendo la responsabilidad total sobre ellas.'),
  (7, 'toma_decisiones', 'Sopeso el riesgo financiero y reputacional antes de decisiones estratégicas.'),
  (8, 'gestion_stakeholders', 'Gestiono efectivamente expectativas de accionistas, clientes y colaboradores.'),
  (9, 'gestion_stakeholders', 'Mantengo relaciones de confianza con actores externos clave para la organización.'),
  (10, 'gobierno_corporativo', 'Aseguro que las decisiones de la organización cumplan con los principios de buen gobierno corporativo.'),
  (11, 'gobierno_corporativo', 'Rindo cuentas de forma transparente ante el consejo directivo o los accionistas.'),
  (12, 'gobierno_corporativo', 'Promuevo prácticas éticas y de cumplimiento normativo en toda la organización.'),
  (13, 'gobierno_corporativo', 'Superviso que los riesgos relevantes del negocio estén identificados y controlados.'),
  (14, 'decisiones_alto_impacto', 'Tomo decisiones estructurales (fusiones, reestructuras, inversiones grandes) con base en análisis riguroso.'),
  (15, 'decisiones_alto_impacto', 'Actúo con decisión en momentos de crisis que afectan a toda la organización.'),
  (16, 'decisiones_alto_impacto', 'Equilibro el corto y el largo plazo al tomar decisiones que afectan a la empresa completa.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- Rol: consultant
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'consultant'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'analisis_problemas', 'Diagnostico con precisión la causa raíz de los problemas de un cliente.'),
  (2, 'analisis_problemas', 'Estructuro los problemas complejos en partes manejables antes de analizarlos.'),
  (3, 'analisis_problemas', 'Utilizo marcos de análisis reconocidos para diagnosticar situaciones de negocio.'),
  (4, 'comunicacion_cliente', 'Comunico hallazgos complejos de forma clara para audiencias no técnicas.'),
  (5, 'comunicacion_cliente', 'Genero confianza con el cliente desde las primeras interacciones del proyecto.'),
  (6, 'comunicacion_cliente', 'Gestiono las expectativas del cliente sobre alcance, tiempos y resultados.'),
  (7, 'adaptabilidad_proyectos', 'Me adapto rápidamente a distintas industrias y culturas organizacionales.'),
  (8, 'adaptabilidad_proyectos', 'Ajusto mi enfoque de trabajo según las particularidades de cada cliente.'),
  (9, 'adaptabilidad_proyectos', 'Trabajo con eficacia en proyectos con alcances y plazos cambiantes.'),
  (10, 'entregables_evidencia', 'Fundamento mis recomendaciones en datos y evidencia, no solo en opiniones.'),
  (11, 'entregables_evidencia', 'Documento mis hallazgos y conclusiones de forma rigurosa y trazable.'),
  (12, 'entregables_evidencia', 'Valido mis hipótesis con información real antes de presentarlas al cliente.'),
  (13, 'entregables_evidencia', 'Construyo entregables que el cliente puede implementar sin ambigüedad.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- Rol: analyst
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'analyst'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'precision_datos', 'Verifico dos veces mis cálculos antes de compartir un resultado.'),
  (2, 'precision_datos', 'Detecto inconsistencias en los datos antes de que se conviertan en un error mayor.'),
  (3, 'precision_datos', 'Manejo grandes volúmenes de información sin perder precisión.'),
  (4, 'pensamiento_critico', 'Cuestiono los supuestos detrás de un análisis antes de aceptarlo como válido.'),
  (5, 'pensamiento_critico', 'Distingo entre correlación y causalidad al interpretar datos.'),
  (6, 'pensamiento_critico', 'Evalúo la calidad de una fuente de información antes de utilizarla.'),
  (7, 'documentacion', 'Documento mi metodología para que otros puedan replicar mi análisis.'),
  (8, 'documentacion', 'Mantengo registros claros y organizados de cada proyecto de análisis.'),
  (9, 'atencion_detalle', 'Reviso minuciosamente cada cifra antes de entregar un reporte.'),
  (10, 'atencion_detalle', 'Detecto errores pequeños que otros suelen pasar por alto.'),
  (11, 'atencion_detalle', 'Cuido el formato y la consistencia de mis reportes hasta en los detalles menores.'),
  (12, 'rigor_metodologico', 'Sigo una metodología clara y consistente en cada análisis que realizo.'),
  (13, 'rigor_metodologico', 'Justifico cada paso de mi metodología cuando se me pregunta al respecto.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- Rol: operations
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'operations'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'eficiencia_procesos', 'Identifico cuellos de botella en los procesos operativos y propongo soluciones.'),
  (2, 'eficiencia_procesos', 'Optimizo el uso de recursos para reducir tiempos y costos operativos.'),
  (3, 'eficiencia_procesos', 'Estandarizo procesos para que sean más eficientes y repetibles.'),
  (4, 'gestion_calidad', 'Verifico que los procesos cumplan con los estándares de calidad establecidos.'),
  (5, 'gestion_calidad', 'Implemento controles que previenen defectos antes de que ocurran.'),
  (6, 'gestion_calidad', 'Analizo indicadores de calidad para detectar áreas de mejora.'),
  (7, 'resolucion_incidentes', 'Reacciono con rapidez y calma ante incidentes operativos inesperados.'),
  (8, 'resolucion_incidentes', 'Identifico la causa raíz de un incidente para evitar que se repita.'),
  (9, 'gestion_proveedores_logistica', 'Evalúo el desempeño de proveedores de forma objetiva y periódica.'),
  (10, 'gestion_proveedores_logistica', 'Coordino la logística para asegurar entregas a tiempo y sin contratiempos.'),
  (11, 'gestion_proveedores_logistica', 'Negocio condiciones favorables con proveedores sin sacrificar la calidad del servicio.'),
  (12, 'mejora_continua', 'Busco constantemente oportunidades de mejora en los procesos que manejo.'),
  (13, 'mejora_continua', 'Implemento cambios pequeños y consistentes que generan mejoras acumulativas.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- Rol: hr
insert into public.questions
  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'hr'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'gestion_talento', 'Identifico el potencial de los colaboradores para planes de desarrollo o sucesión.'),
  (2, 'gestion_talento', 'Diseño procesos de selección que identifican bien el talento adecuado para cada puesto.'),
  (3, 'gestion_talento', 'Doy seguimiento a los planes de desarrollo del personal de la organización.'),
  (4, 'relaciones_laborales', 'Medio conflictos laborales buscando soluciones justas para ambas partes.'),
  (5, 'relaciones_laborales', 'Aplico las políticas laborales de forma consistente y equitativa.'),
  (6, 'relaciones_laborales', 'Mantengo canales abiertos de diálogo entre colaboradores y la organización.'),
  (7, 'comunicacion_organizacional', 'Comunico políticas y cambios organizacionales de forma clara a todo el personal.'),
  (8, 'comunicacion_organizacional', 'Adapto los mensajes internos según la audiencia (operativo, mandos medios, dirección).'),
  (9, 'sensibilidad_interpersonal', 'Percibo cuando un colaborador está pasando por una dificultad personal que afecta su trabajo.'),
  (10, 'sensibilidad_interpersonal', 'Trato temas delicados de personal con empatía y respeto.'),
  (11, 'sensibilidad_interpersonal', 'Escucho las inquietudes del personal sin emitir juicios apresurados.'),
  (12, 'confidencialidad', 'Mantengo la confidencialidad absoluta de la información sensible de los colaboradores.'),
  (13, 'confidencialidad', 'Manejo con discreción los casos disciplinarios o de conflicto interno.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- ============================================================================
-- FIN DEL SCRIPT DE CONTENIDO FASE 2
-- ============================================================================
