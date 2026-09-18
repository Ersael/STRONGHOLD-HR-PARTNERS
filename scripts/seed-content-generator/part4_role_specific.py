# -*- coding: utf-8 -*-
"""Generador Fase 2 - parte 4: role_specific, 13 items nuevos x 7 roles = 91.

Cada rol: (role_code, order_index_start, [(dimension_code, dimension_label, texto), ...])
order_index_start es 4 para sales/director (ya existen 3 de ejemplo) y 1 para el resto.
También se listan las dimensiones NUEVAS a agregar al config_json de cada rol
(las dimensiones originales de ejemplo se conservan).
"""

ROLE_SPECIFIC_NEW = {
    "sales": {
        "order_start": 4,
        "new_dims": [
            ("manejo_objeciones", "Manejo de Objeciones"),
            ("resiliencia_rechazo", "Resiliencia ante el Rechazo"),
            ("orientacion_comercial", "Orientación Comercial"),
        ],
        "items": [
            ("prospeccion", "Genero constantemente nuevas oportunidades de negocio a través de distintos canales."),
            ("prospeccion", "Investigo a fondo a un prospecto antes de contactarlo por primera vez."),
            ("cierre", "Reconozco las señales de compra y actúo en el momento adecuado para cerrar."),
            ("cierre", "Utilizo técnicas de cierre adaptadas a cada tipo de cliente."),
            ("relacion_cliente", "Doy seguimiento post-venta para asegurar la satisfacción del cliente."),
            ("manejo_objeciones", "Escucho las objeciones del cliente sin ponerme a la defensiva."),
            ("manejo_objeciones", "Respondo a las objeciones con argumentos claros basados en el valor de mi producto."),
            ("manejo_objeciones", "Anticipo las objeciones más comunes y preparo respuestas antes de la reunión de venta."),
            ("resiliencia_rechazo", "Un \"no\" de un cliente no afecta mi motivación para seguir prospectando."),
            ("resiliencia_rechazo", "Aprendo de las ventas perdidas para mejorar mi siguiente intento."),
            ("resiliencia_rechazo", "Mantengo una actitud positiva incluso después de una racha de rechazos."),
            ("orientacion_comercial", "Identifico oportunidades de venta cruzada o adicional con clientes actuales."),
            ("orientacion_comercial", "Me mantengo enfocado en cumplir y superar mis metas comerciales."),
        ],
    },
    "commercial_manager": {
        "order_start": 1,
        "new_dims": [
            ("gestion_cartera", "Gestión de Cartera"),
            ("forecasting", "Forecasting"),
            ("negociacion_clientes_clave", "Negociación con Clientes Clave"),
        ],
        "items": [
            ("gestion_equipo_comercial", "Motivo a mi equipo comercial para alcanzar y superar sus cuotas de venta."),
            ("gestion_equipo_comercial", "Doy seguimiento individual al desempeño de cada vendedor de mi equipo."),
            ("planeacion_estrategica", "Defino la estrategia comercial del área alineada a los objetivos del negocio."),
            ("planeacion_estrategica", "Anticipo cambios del mercado para ajustar la estrategia comercial a tiempo."),
            ("negociacion", "Negocio condiciones comerciales que protegen la rentabilidad del negocio."),
            ("negociacion", "Encuentro puntos de equilibrio en negociaciones complejas con distribuidores o socios."),
            ("gestion_cartera", "Segmento mi cartera de clientes según su potencial y nivel de riesgo."),
            ("gestion_cartera", "Superviso la salud de la cartera para anticipar la pérdida de clientes clave."),
            ("gestion_cartera", "Balanceo la atención entre clientes actuales y la búsqueda de clientes nuevos."),
            ("forecasting", "Elaboro pronósticos de venta basados en datos históricos y tendencias del mercado."),
            ("forecasting", "Ajusto mis proyecciones comerciales cuando detecto desviaciones importantes."),
            ("negociacion_clientes_clave", "Construyo relaciones de largo plazo con las cuentas más importantes de la empresa."),
            ("negociacion_clientes_clave", "Negocio directamente con clientes clave las condiciones comerciales estratégicas."),
        ],
    },
    "director": {
        "order_start": 4,
        "new_dims": [
            ("gobierno_corporativo", "Gobierno Corporativo"),
            ("decisiones_alto_impacto", "Decisiones de Alto Impacto"),
        ],
        "items": [
            ("vision_negocio", "Defino el rumbo estratégico de la organización a mediano y largo plazo."),
            ("vision_negocio", "Identifico oportunidades de negocio antes de que se vuelvan evidentes para el mercado."),
            ("toma_decisiones", "Tomo decisiones de alto impacto asumiendo la responsabilidad total sobre ellas."),
            ("toma_decisiones", "Sopeso el riesgo financiero y reputacional antes de decisiones estratégicas."),
            ("gestion_stakeholders", "Gestiono efectivamente expectativas de accionistas, clientes y colaboradores."),
            ("gestion_stakeholders", "Mantengo relaciones de confianza con actores externos clave para la organización."),
            ("gobierno_corporativo", "Aseguro que las decisiones de la organización cumplan con los principios de buen gobierno corporativo."),
            ("gobierno_corporativo", "Rindo cuentas de forma transparente ante el consejo directivo o los accionistas."),
            ("gobierno_corporativo", "Promuevo prácticas éticas y de cumplimiento normativo en toda la organización."),
            ("gobierno_corporativo", "Superviso que los riesgos relevantes del negocio estén identificados y controlados."),
            ("decisiones_alto_impacto", "Tomo decisiones estructurales (fusiones, reestructuras, inversiones grandes) con base en análisis riguroso."),
            ("decisiones_alto_impacto", "Actúo con decisión en momentos de crisis que afectan a toda la organización."),
            ("decisiones_alto_impacto", "Equilibro el corto y el largo plazo al tomar decisiones que afectan a la empresa completa."),
        ],
    },
    "consultant": {
        "order_start": 1,
        "new_dims": [
            ("entregables_evidencia", "Entregables Basados en Evidencia"),
        ],
        "items": [
            ("analisis_problemas", "Diagnostico con precisión la causa raíz de los problemas de un cliente."),
            ("analisis_problemas", "Estructuro los problemas complejos en partes manejables antes de analizarlos."),
            ("analisis_problemas", "Utilizo marcos de análisis reconocidos para diagnosticar situaciones de negocio."),
            ("comunicacion_cliente", "Comunico hallazgos complejos de forma clara para audiencias no técnicas."),
            ("comunicacion_cliente", "Genero confianza con el cliente desde las primeras interacciones del proyecto."),
            ("comunicacion_cliente", "Gestiono las expectativas del cliente sobre alcance, tiempos y resultados."),
            ("adaptabilidad_proyectos", "Me adapto rápidamente a distintas industrias y culturas organizacionales."),
            ("adaptabilidad_proyectos", "Ajusto mi enfoque de trabajo según las particularidades de cada cliente."),
            ("adaptabilidad_proyectos", "Trabajo con eficacia en proyectos con alcances y plazos cambiantes."),
            ("entregables_evidencia", "Fundamento mis recomendaciones en datos y evidencia, no solo en opiniones."),
            ("entregables_evidencia", "Documento mis hallazgos y conclusiones de forma rigurosa y trazable."),
            ("entregables_evidencia", "Valido mis hipótesis con información real antes de presentarlas al cliente."),
            ("entregables_evidencia", "Construyo entregables que el cliente puede implementar sin ambigüedad."),
        ],
    },
    "analyst": {
        "order_start": 1,
        "new_dims": [
            ("atencion_detalle", "Atención al Detalle"),
            ("rigor_metodologico", "Rigor Metodológico"),
        ],
        "items": [
            ("precision_datos", "Verifico dos veces mis cálculos antes de compartir un resultado."),
            ("precision_datos", "Detecto inconsistencias en los datos antes de que se conviertan en un error mayor."),
            ("precision_datos", "Manejo grandes volúmenes de información sin perder precisión."),
            ("pensamiento_critico", "Cuestiono los supuestos detrás de un análisis antes de aceptarlo como válido."),
            ("pensamiento_critico", "Distingo entre correlación y causalidad al interpretar datos."),
            ("pensamiento_critico", "Evalúo la calidad de una fuente de información antes de utilizarla."),
            ("documentacion", "Documento mi metodología para que otros puedan replicar mi análisis."),
            ("documentacion", "Mantengo registros claros y organizados de cada proyecto de análisis."),
            ("atencion_detalle", "Reviso minuciosamente cada cifra antes de entregar un reporte."),
            ("atencion_detalle", "Detecto errores pequeños que otros suelen pasar por alto."),
            ("atencion_detalle", "Cuido el formato y la consistencia de mis reportes hasta en los detalles menores."),
            ("rigor_metodologico", "Sigo una metodología clara y consistente en cada análisis que realizo."),
            ("rigor_metodologico", "Justifico cada paso de mi metodología cuando se me pregunta al respecto."),
        ],
    },
    "operations": {
        "order_start": 1,
        "new_dims": [
            ("gestion_proveedores_logistica", "Gestión de Proveedores y Logística"),
            ("mejora_continua", "Mejora Continua"),
        ],
        "items": [
            ("eficiencia_procesos", "Identifico cuellos de botella en los procesos operativos y propongo soluciones."),
            ("eficiencia_procesos", "Optimizo el uso de recursos para reducir tiempos y costos operativos."),
            ("eficiencia_procesos", "Estandarizo procesos para que sean más eficientes y repetibles."),
            ("gestion_calidad", "Verifico que los procesos cumplan con los estándares de calidad establecidos."),
            ("gestion_calidad", "Implemento controles que previenen defectos antes de que ocurran."),
            ("gestion_calidad", "Analizo indicadores de calidad para detectar áreas de mejora."),
            ("resolucion_incidentes", "Reacciono con rapidez y calma ante incidentes operativos inesperados."),
            ("resolucion_incidentes", "Identifico la causa raíz de un incidente para evitar que se repita."),
            ("gestion_proveedores_logistica", "Evalúo el desempeño de proveedores de forma objetiva y periódica."),
            ("gestion_proveedores_logistica", "Coordino la logística para asegurar entregas a tiempo y sin contratiempos."),
            ("gestion_proveedores_logistica", "Negocio condiciones favorables con proveedores sin sacrificar la calidad del servicio."),
            ("mejora_continua", "Busco constantemente oportunidades de mejora en los procesos que manejo."),
            ("mejora_continua", "Implemento cambios pequeños y consistentes que generan mejoras acumulativas."),
        ],
    },
    "hr": {
        "order_start": 1,
        "new_dims": [
            ("sensibilidad_interpersonal", "Sensibilidad Interpersonal"),
            ("confidencialidad", "Confidencialidad"),
        ],
        "items": [
            ("gestion_talento", "Identifico el potencial de los colaboradores para planes de desarrollo o sucesión."),
            ("gestion_talento", "Diseño procesos de selección que identifican bien el talento adecuado para cada puesto."),
            ("gestion_talento", "Doy seguimiento a los planes de desarrollo del personal de la organización."),
            ("relaciones_laborales", "Medio conflictos laborales buscando soluciones justas para ambas partes."),
            ("relaciones_laborales", "Aplico las políticas laborales de forma consistente y equitativa."),
            ("relaciones_laborales", "Mantengo canales abiertos de diálogo entre colaboradores y la organización."),
            ("comunicacion_organizacional", "Comunico políticas y cambios organizacionales de forma clara a todo el personal."),
            ("comunicacion_organizacional", "Adapto los mensajes internos según la audiencia (operativo, mandos medios, dirección)."),
            ("sensibilidad_interpersonal", "Percibo cuando un colaborador está pasando por una dificultad personal que afecta su trabajo."),
            ("sensibilidad_interpersonal", "Trato temas delicados de personal con empatía y respeto."),
            ("sensibilidad_interpersonal", "Escucho las inquietudes del personal sin emitir juicios apresurados."),
            ("confidencialidad", "Mantengo la confidencialidad absoluta de la información sensible de los colaboradores."),
            ("confidencialidad", "Manejo con discreción los casos disciplinarios o de conflicto interno."),
        ],
    },
}

ROLE_SPECIFIC_TOTAL_NEW = sum(len(v["items"]) for v in ROLE_SPECIFIC_NEW.values())
assert ROLE_SPECIFIC_TOTAL_NEW == 91, ROLE_SPECIFIC_TOTAL_NEW
assert set(ROLE_SPECIFIC_NEW.keys()) == {
    "sales", "commercial_manager", "director", "consultant", "analyst", "operations", "hr"
}
for role, data in ROLE_SPECIFIC_NEW.items():
    assert 12 <= len(data["items"]) <= 15, (role, len(data["items"]))
