# -*- coding: utf-8 -*-
"""
Generador de contenido Fase 2 - parte 1: behavioral + cognitive.
Se ejecuta como módulo importado por build_seed.py
"""

# ---------------------------------------------------------------------------
# BEHAVIORAL: 28 bloques forced_choice_quad, uno por escenario, 4 frases
# (D, I, S, C) cada uno. Formato de cada tupla: (scenario_label, D, I, S, C)
# ---------------------------------------------------------------------------
BEHAVIORAL_BLOCKS = [
    ("Toma de decisiones",
     "Decido rápido y asumo la responsabilidad de mis decisiones.",
     "Prefiero discutir la decisión en grupo antes de definirla.",
     "Tomo decisiones con calma, después de pensarlas bien.",
     "Baso mis decisiones en datos y procedimientos establecidos."),
    ("Trabajo en equipo",
     "Me gusta liderar al equipo hacia el objetivo.",
     "Animo al equipo y mantengo el ambiente positivo.",
     "Apoyo a mis compañeros de forma constante y confiable.",
     "Me aseguro de que el equipo siga los procesos correctos."),
    ("Manejo de conflicto",
     "Enfrento el conflicto de forma directa y sin rodeos.",
     "Busco resolver el conflicto conversando y buscando puntos en común.",
     "Prefiero calmar los ánimos antes de abordar el conflicto.",
     "Analizo los hechos objetivamente antes de opinar sobre el conflicto."),
    ("Ritmo de trabajo",
     "Trabajo a un ritmo acelerado y exijo lo mismo a otros.",
     "Mi ritmo varía según el entusiasmo que me genere la tarea.",
     "Mantengo un ritmo constante y predecible durante todo el día.",
     "Avanzo con cuidado, verificando cada paso antes de continuar."),
    ("Relación con las reglas",
     "Cuestiono las reglas si creo que frenan los resultados.",
     "Sigo las reglas, pero prefiero un ambiente flexible.",
     "Respeto las reglas porque dan estabilidad al equipo.",
     "Sigo las normas y procedimientos al pie de la letra."),
    ("Manejo de la presión",
     "Bajo presión, tomo el mando y actúo con determinación.",
     "Bajo presión, busco apoyo y ánimo en las personas cercanas.",
     "Bajo presión, mantengo la calma y no me altero fácilmente.",
     "Bajo presión, me enfoco en no cometer errores."),
    ("Comunicación",
     "Voy directo al punto cuando comunico algo importante.",
     "Disfruto contar historias y persuadir con entusiasmo.",
     "Escucho con paciencia antes de responder.",
     "Comunico con precisión, cuidando cada detalle."),
    ("Iniciativa",
     "Tomo la iniciativa sin esperar que otros me lo pidan.",
     "Propongo ideas nuevas con entusiasmo contagioso.",
     "Prefiero esperar instrucciones claras antes de actuar.",
     "Actúo solo después de analizar toda la información disponible."),
    ("Retroalimentación",
     "Doy retroalimentación directa, aunque sea incómoda.",
     "Doy retroalimentación de forma motivadora y positiva.",
     "Doy retroalimentación con tacto, cuidando la relación.",
     "Doy retroalimentación basada en hechos concretos y medibles."),
    ("Cambio e incertidumbre",
     "Impulso el cambio aunque genere resistencia.",
     "Me adapto al cambio con optimismo y facilidad.",
     "Prefiero cambios graduales, no bruscos.",
     "Analizo el impacto del cambio antes de aceptarlo."),
    ("Relaciones y networking",
     "Construyo relaciones útiles para alcanzar mis objetivos.",
     "Disfruto conocer gente nueva y ampliar mi red de contactos.",
     "Prefiero mantener pocas relaciones, pero profundas y leales.",
     "Formalizo mis relaciones profesionales con cuidado y discreción."),
    ("Manejo de multitarea",
     "Manejo varias prioridades urgentes al mismo tiempo con firmeza.",
     "Salto entre tareas siguiendo mi entusiasmo del momento.",
     "Prefiero enfocarme en una tarea a la vez, sin apuros.",
     "Organizo mis tareas en listas detalladas para no perder el control."),
    ("Delegación",
     "Delego tareas y espero resultados concretos y rápidos.",
     "Delego motivando a la otra persona a dar su mejor esfuerzo.",
     "Delego solo cuando confío plenamente en la otra persona.",
     "Delego dando instrucciones muy detalladas y por escrito."),
    ("Reconocimiento",
     "Busco el reconocimiento por resultados, no por esfuerzo.",
     "Disfruto ser el centro de atención cuando logro algo.",
     "Prefiero el reconocimiento discreto de mi jefe directo.",
     "Valoro que reconozcan la calidad y precisión de mi trabajo."),
    ("Estilo de aprendizaje",
     "Aprendo rápido lo esencial y avanzo a la acción.",
     "Aprendo mejor conversando e intercambiando ideas con otros.",
     "Aprendo de forma pausada, repasando con calma.",
     "Aprendo estudiando a fondo manuales y procedimientos."),
    ("Relación con la rutina",
     "Me aburro con la rutina; busco constantemente nuevos retos.",
     "Prefiero variedad en mis días, no me gusta lo repetitivo.",
     "Me siento cómodo con una rutina estable y conocida.",
     "Sigo una rutina ordenada que me da consistencia."),
    ("Autonomía y supervisión",
     "Prefiero trabajar sin supervisión y con total autonomía.",
     "Trabajo bien tanto solo como acompañado, no me afecta.",
     "Prefiero tener claridad sobre lo que se espera de mí.",
     "Prefiero supervisión que confirme que sigo el proceso correcto."),
    ("Competencia y colaboración",
     "Me motiva competir y estar por encima de los demás.",
     "Prefiero colaborar antes que competir con mis compañeros.",
     "No me interesa competir, prefiero la armonía del grupo.",
     "Mido mi progreso comparándolo con estándares de calidad."),
    ("Manejo de errores",
     "Reconozco un error rápido y paso a corregirlo sin drama.",
     "Cuando me equivoco, uso el humor para aliviar la tensión.",
     "Cuando cometo un error, me toma tiempo procesarlo con calma.",
     "Cuando cometo un error, reviso a fondo qué falló en el proceso."),
    ("Participación en reuniones",
     "En las reuniones, impulso que se tomen decisiones rápido.",
     "En las reuniones, aporto energía y participo activamente.",
     "En las reuniones, escucho más de lo que hablo.",
     "En las reuniones, tomo notas detalladas y sigo la agenda."),
    ("Manejo de clientes",
     "Con los clientes, soy directo sobre lo que podemos ofrecer.",
     "Con los clientes, genero simpatía y cercanía rápidamente.",
     "Con los clientes, soy paciente y atento a sus necesidades.",
     "Con los clientes, soy meticuloso al explicar términos y condiciones."),
    ("Planeación",
     "Planeo lo mínimo necesario y ajusto sobre la marcha.",
     "Planeo de forma flexible, dejando espacio a la improvisación.",
     "Planeo con anticipación para evitar sorpresas.",
     "Planeo cada detalle antes de comenzar cualquier proyecto."),
    ("Tolerancia al riesgo",
     "Tomo riesgos calculados si el beneficio potencial es alto.",
     "Me entusiasma probar cosas nuevas aunque el resultado sea incierto.",
     "Prefiero opciones seguras y evitar riesgos innecesarios.",
     "Evalúo minuciosamente los riesgos antes de decidir algo."),
    ("Manejo de crisis",
     "En una crisis, tomo el control y doy instrucciones claras.",
     "En una crisis, mantengo al equipo motivado y unido.",
     "En una crisis, transmito calma y estabilidad a los demás.",
     "En una crisis, sigo el protocolo establecido paso a paso."),
    ("Presentaciones",
     "Al presentar, voy directo a las conclusiones y resultados.",
     "Al presentar, uso historias y ejemplos para conectar con la audiencia.",
     "Al presentar, prefiero un tono tranquilo y constante.",
     "Al presentar, cuido cada dato y cifra que incluyo."),
    ("Negociación",
     "Negocio buscando ganar la mejor condición posible.",
     "Negocio construyendo una relación de confianza primero.",
     "Negocio buscando que ambas partes queden conformes.",
     "Negocio apoyándome en datos y argumentos objetivos."),
    ("Creatividad e innovación",
     "Impulso ideas nuevas aunque rompan con lo establecido.",
     "Genero ideas originales y me gusta compartirlas con entusiasmo.",
     "Prefiero mejorar lo existente antes que innovar radicalmente.",
     "Innovo dentro de un marco ordenado y probado."),
    ("Cierre de proyectos",
     "Al cerrar un proyecto, me enfoco en los resultados obtenidos.",
     "Al cerrar un proyecto, celebro los logros con el equipo.",
     "Al cerrar un proyecto, agradezco el esfuerzo constante de todos.",
     "Al cerrar un proyecto, reviso que toda la documentación esté completa."),
]

assert len(BEHAVIORAL_BLOCKS) == 28, len(BEHAVIORAL_BLOCKS)

# ---------------------------------------------------------------------------
# COGNITIVE: 40 multiple_choice, 7 dimensiones
# tupla: (dimension, prompt_text, choices[4], correct_index)
# ---------------------------------------------------------------------------
COGNITIVE_ABSTRACTO = [
    ("razonamiento_abstracto", "¿Qué número sigue en la secuencia: 2, 6, 12, 20, 30, ___?",
     ["36", "40", "42", "44"], 2),
    ("razonamiento_abstracto", "¿Qué número sigue en la secuencia: 1, 1, 2, 3, 5, 8, ___?",
     ["11", "12", "13", "15"], 2),
    ("razonamiento_abstracto", "¿Qué número sigue en la secuencia: 3, 9, 27, 81, ___?",
     ["162", "216", "243", "324"], 2),
    ("razonamiento_abstracto", "¿Qué número sigue en la secuencia: 100, 90, 81, 73, 66, ___?",
     ["58", "59", "60", "61"], 2),
    ("razonamiento_abstracto", "¿Qué letra sigue en la secuencia: A, C, F, J, O, ___?",
     ["T", "U", "V", "S"], 1),
    ("razonamiento_abstracto", "Complete la analogía: Libro es a Biblioteca como Cuadro es a ___.",
     ["Museo", "Pintor", "Marco", "Lienzo"], 0),
]

COGNITIVE_ANALITICO = [
    ("razonamiento_analitico",
     "Si todos los gerentes son líderes, y algunos líderes son innovadores, entonces:",
     ["Todos los gerentes son innovadores", "Algunos gerentes podrían ser innovadores",
      "Ningún gerente es innovador", "Todos los innovadores son gerentes"], 1),
    ("razonamiento_analitico",
     "Ana es más alta que Beatriz. Beatriz es más alta que Carla. ¿Quién es la más baja?",
     ["Ana", "Beatriz", "Carla", "No se puede determinar"], 2),
    ("razonamiento_analitico",
     "Un tren sale de la ciudad A a 60 km/h y otro de la ciudad B (a 300 km de distancia) "
     "a 40 km/h, al mismo tiempo, uno hacia el otro. ¿En cuántas horas se encuentran?",
     ["2", "2.5", "3", "3.5"], 2),
    ("razonamiento_analitico",
     "Si el doble de un número, menos 5, es igual a 15, ¿cuál es el número?",
     ["5", "8", "10", "12"], 2),
    ("razonamiento_analitico",
     "En una empresa, el 40% de los empleados son mujeres. Si hay 60 hombres, "
     "¿cuántos empleados hay en total?",
     ["80", "100", "120", "150"], 1),
    ("razonamiento_analitico",
     "Tres socios reparten $900 de utilidades en partes proporcionales a 2:3:4. "
     "¿Cuánto recibe el socio con la mayor parte?",
     ["300", "350", "400", "450"], 2),
]

COGNITIVE_PATRONES = [
    ("reconocimiento_patrones", "¿Qué palabra no pertenece al grupo: Manzana, Plátano, Zanahoria, Naranja?",
     ["Manzana", "Plátano", "Zanahoria", "Naranja"], 2),
    ("reconocimiento_patrones", "¿Qué número no pertenece a la serie: 4, 9, 16, 20, 25?",
     ["4", "9", "20", "25"], 2),
    ("reconocimiento_patrones", "Encuentra el patrón y complétalo: AB, BC, CD, DE, ___",
     ["EF", "DF", "FG", "EG"], 0),
    ("reconocimiento_patrones", "¿Qué figura no pertenece al grupo: Triángulo, Cuadrado, Círculo, Cubo?",
     ["Triángulo", "Cuadrado", "Círculo", "Cubo"], 3),
    ("reconocimiento_patrones", "Identifica el elemento que no pertenece al grupo: "
     "Martillo, Destornillador, Llave inglesa, Manzana.",
     ["Martillo", "Destornillador", "Llave inglesa", "Manzana"], 3),
    ("reconocimiento_patrones",
     "Completa el patrón numérico: 5, 10, 9, 18, 17, 34, ___ (la regla alterna: "
     "multiplicar por 2, luego restar 1)",
     ["33", "35", "36", "32"], 0),
]

# ---------------------------------------------------------------------------
# CONCENTRACION: 6 preguntas. Los conteos se calculan programáticamente sobre
# el texto/lista embebidos para garantizar que la respuesta correcta sea
# objetivamente verificable (no se calculan "a mano").
# ---------------------------------------------------------------------------
def _build_concentracion():
    items = []

    t1 = "El director revisará el reporte trimestral con responsabilidad y rigor"
    c1 = t1.lower().count("r")
    choices1 = sorted({c1 - 2, c1 - 1, c1, c1 + 2})
    while len(choices1) < 4:
        choices1.append(max(choices1) + 1)
    choices1 = sorted(choices1)[:4]
    items.append(("concentracion",
                   f'Cuenta cuántas veces aparece la letra "r" (sin importar mayúscula/minúscula) '
                   f'en la frase: "{t1}".',
                   [str(x) for x in choices1], choices1.index(c1)))

    t2 = "La organización necesita mejorar la comunicación entre departamentos para operar mejor"
    c2 = t2.lower().count("e")
    choices2 = sorted({c2 - 2, c2 - 1, c2, c2 + 1})
    while len(choices2) < 4:
        choices2.append(max(choices2) + 1)
    choices2 = sorted(choices2)[:4]
    items.append(("concentracion",
                   f'Cuenta cuántas veces aparece la letra "e" (sin importar mayúscula/minúscula) '
                   f'en la frase: "{t2}".',
                   [str(x) for x in choices2], choices2.index(c2)))

    lst3 = [12, 7, 8, 15, 20, 33, 6]
    c3 = sum(1 for n in lst3 if n % 2 == 0)
    choices3 = sorted({c3 - 1, c3, c3 + 1, c3 + 2})
    items.append(("concentracion",
                   f"¿Cuántos números pares hay en la siguiente lista: {', '.join(map(str, lst3))}?",
                   [str(x) for x in choices3], choices3.index(c3)))

    items.append(("concentracion",
                   "Observa la siguiente serie de códigos: 4471, 4471, 4471, 4417, 4471. "
                   "¿Cuál código es diferente a los demás?",
                   ["4471 (primero)", "4471 (segundo)", "4417 (cuarto)", "4471 (quinto)"], 2))

    items.append(("concentracion",
                   "Observa la siguiente serie de palabras: azul, azul, azul, azul, azúl. "
                   "¿Cuál palabra está escrita de forma diferente a las demás?",
                   ["La primera (azul)", "La segunda (azul)", "La cuarta (azul)", "La quinta (azúl)"], 3))

    t6 = ("Cada meta requiere un plan; sin una meta clara no hay meta alcanzable, "
          "y toda meta necesita seguimiento")
    import re as _re
    c6 = len(_re.findall(r"\bmeta\b", t6.lower()))
    choices6 = sorted({c6 - 1, c6, c6 + 1, c6 + 2})
    items.append(("concentracion",
                   f'Cuenta cuántas veces aparece la palabra "meta" en el siguiente texto: "{t6}".',
                   [str(x) for x in choices6], choices6.index(c6)))

    assert len(items) == 6
    return items


COGNITIVE_CONCENTRACION = _build_concentracion()

COGNITIVE_JUICIO = [
    ("juicio",
     "Un colaborador de tu equipo comete un error que afecta a un cliente. "
     "¿Cuál es la mejor acción?",
     ["Ignorar el error para no generar conflicto",
      "Culpar públicamente al colaborador frente al cliente",
      "Reconocer el error ante el cliente, corregirlo y dar retroalimentación privada al colaborador",
      "Esperar a que el cliente no se dé cuenta"], 2),
    ("juicio",
     "Recibes instrucciones contradictorias de dos jefes distintos sobre la misma tarea. "
     "¿Qué deberías hacer primero?",
     ["Elegir la instrucción del jefe de mayor jerarquía sin decir nada",
      "Aclarar directamente con ambos jefes para alinear la instrucción antes de actuar",
      "Ignorar ambas instrucciones y hacer lo que te parezca mejor",
      "Retrasar la tarea indefinidamente hasta que se resuelva solo"], 1),
    ("juicio",
     "Un cliente importante solicita una excepción que viola una política interna clave. "
     "¿Cuál es la mejor respuesta?",
     ["Aceptar la excepción sin consultar para no perder al cliente",
      "Explicar la política, buscar alternativas dentro de las reglas y escalar si es necesario",
      "Negarse rotundamente sin dar explicación",
      "Aceptar la excepción solo si nadie se entera"], 1),
    ("juicio",
     "Detectas que un proveedor te cobró de más por error. ¿Qué deberías hacer?",
     ["Quedarte callado porque beneficia a tu empresa",
      "Informar el error al proveedor y solicitar el ajuste correspondiente",
      "Aprovechar el error en futuras negociaciones sin decir nada",
      "Reportarlo solo si el proveedor lo nota primero"], 1),
    ("juicio",
     "Tienes que elegir entre cumplir una fecha límite entregando un trabajo con errores menores, "
     "o pedir un día extra para entregarlo sin errores. ¿Qué es más razonable?",
     ["Entregar siempre a tiempo sin importar la calidad",
      "Evaluar el impacto de los errores y el de la demora, y comunicar la situación con anticipación",
      "Entregar tarde sin avisar a nadie",
      "Pedir que otra persona entregue por ti"], 1),
    ("juicio",
     "Un compañero te pide que cubras una falta suya sin justificación ante tu jefe. "
     "¿Qué deberías hacer?",
     ["Mentir por él para mantener la relación",
      "Explicarle que no puedes mentir, pero ofrecerle ayuda para resolver la situación de forma honesta",
      "Reportarlo inmediatamente sin hablar con él primero",
      "Ignorar la petición sin decir nada"], 1),
]

COGNITIVE_ORGANIZACION = [
    ("organizacion",
     "Tienes 5 tareas con distintas fechas límite y complejidad. ¿Cuál es la mejor forma de organizarlas?",
     ["Hacer primero la más fácil sin importar la fecha límite",
      "Priorizar según urgencia e impacto, usando una lista o herramienta de seguimiento",
      "Hacer todas al mismo tiempo",
      "Esperar a que alguien te diga cuál hacer primero"], 1),
    ("organizacion",
     "¿Cuál es la mejor práctica para organizar el correo electrónico de trabajo?",
     ["Dejar todo en la bandeja de entrada sin clasificar",
      "Usar carpetas, etiquetas o reglas para clasificar y dar seguimiento",
      "Borrar los correos apenas se leen",
      "Responder solo los correos que llegan en la mañana"], 1),
    ("organizacion",
     "Antes de iniciar un proyecto nuevo, ¿qué deberías organizar primero?",
     ["Los recursos, el alcance y los responsables de cada tarea",
      "La celebración del cierre del proyecto",
      "Solo la fecha de entrega final",
      "Nada, es mejor improvisar sobre la marcha"], 0),
    ("organizacion",
     "Tu escritorio y archivos digitales están desordenados y te cuesta encontrar información. "
     "¿Qué deberías hacer?",
     ["Aceptar que así es tu forma de trabajar y seguir igual",
      "Definir una estructura de carpetas y nomenclatura clara para archivos",
      "Pedirle a otra persona que siempre busque la información por ti",
      "Guardar todo con el mismo nombre para no pensar en categorías"], 1),
    ("organizacion",
     "¿Cuál es la mejor manera de dar seguimiento a los compromisos de un equipo?",
     ["Confiar en que cada quien recuerde sus tareas",
      "Llevar un tablero o lista compartida con responsables y fechas",
      "Preguntar solo cuando el proyecto ya está atrasado",
      "No dar seguimiento para no parecer controlador"], 1),
]

COGNITIVE_PLANEACION = [
    ("planeacion",
     "Al planear un proyecto de tres meses, ¿cuál es el primer paso recomendado?",
     ["Definir objetivos claros y los entregables esperados",
      "Empezar a ejecutar tareas de inmediato",
      "Elegir el nombre del proyecto",
      "Esperar a que surjan los problemas para planear"], 0),
    ("planeacion",
     "¿Qué se recomienda hacer cuando un plan enfrenta un imprevisto importante?",
     ["Abandonar el plan por completo",
      "Ajustar el plan evaluando el nuevo panorama y comunicando los cambios",
      "Ignorar el imprevisto y seguir igual",
      "Culpar a quien causó el imprevisto y detener todo"], 1),
    ("planeacion",
     "¿Cuál es una buena práctica al establecer metas de trabajo?",
     ["Que sean vagas para tener flexibilidad total",
      "Que sean específicas, medibles y con fecha límite",
      "Que dependan solo de la suerte",
      "Que nadie más las conozca"], 1),
    ("planeacion",
     "Para planear la capacidad de un equipo en el próximo trimestre, ¿qué deberías considerar primero?",
     ["Solo el entusiasmo del equipo",
      "La carga de trabajo actual, las vacaciones y la disponibilidad real",
      "Ignorar la carga actual y asignar tareas parejo",
      "Planear sin consultar al equipo"], 1),
    ("planeacion",
     "¿Qué práctica ayuda más a anticipar riesgos en un proyecto?",
     ["No pensar en riesgos hasta que ocurran",
      "Hacer un análisis de riesgos al inicio y revisarlo periódicamente",
      "Delegar todos los riesgos a un solo responsable sin revisión",
      "Evitar hablar de riesgos para no generar preocupación"], 1),
]

COGNITIVE_ALL = (COGNITIVE_ABSTRACTO + COGNITIVE_ANALITICO + COGNITIVE_PATRONES +
                  COGNITIVE_CONCENTRACION + COGNITIVE_JUICIO + COGNITIVE_ORGANIZACION +
                  COGNITIVE_PLANEACION)
assert len(COGNITIVE_ALL) == 40, len(COGNITIVE_ALL)
