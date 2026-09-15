# -*- coding: utf-8 -*-
"""
Ensambla supabase/seed_full_content.sql (Fase 2) a partir de los módulos de
contenido. Sigue exactamente el patrón usado en supabase/schema.sql:
  insert into public.questions (...)
  select ad.id, v.col1, ... from public.assessment_definitions ad,
  (values (...), (...)) as v(col1, ...)
  where ad.code = '<code>'
  on conflict do nothing;
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
import part1_behavioral_cognitive as p1
import part2_personality as p2
import part3_competencies_values_leadership as p3
import part4_role_specific as p4

def esc(s: str) -> str:
    """Escapa comillas simples para un literal SQL."""
    return s.replace("'", "''")


def sql_str(s: str) -> str:
    return "'" + esc(s) + "'"


def jsonb_lit(obj) -> str:
    """Serializa a JSON compacto y lo envuelve como literal ::jsonb, escapando comillas simples."""
    txt = json.dumps(obj, ensure_ascii=False)
    return sql_str(txt) + "::jsonb"


# IMPORTANTE: debe quedar como literal SQL entre comillas simples (vía sql_str),
# nunca interpolado "en crudo" en una sentencia SQL.
LIKERT_SCALE_LABELS_JSON = sql_str(
    '{"scale_labels":["Totalmente en desacuerdo","En desacuerdo","Neutral",'
    '"De acuerdo","Totalmente de acuerdo"]}'
)


out = []


def emit(s=""):
    out.append(s)


emit("-- ============================================================================")
emit("-- FASE 2: CONTENIDO COMPLETO DE LAS 7 BATERIAS")
emit("-- ============================================================================")
emit("-- Generado programáticamente (scripts/_gen/build_seed.py) a partir de listas de")
emit("-- contenido curado a mano en español. Este script:")
emit("--   1) Elimina las preguntas de EJEMPLO de la Fase 1 para las baterías cuyas")
emit("--      dimensiones cambian (behavioral, cognitive, personality, competencies,")
emit("--      values, leadership), ya que la Fase 2 introduce una taxonomía de")
emit("--      dimensiones distinta y más completa que la de los ejemplos iniciales.")
emit("--   2) Actualiza `config_json.dimensions` (o `config_json.roles[].dimensions`")
emit("--      para role_specific) de cada `assessment_definitions` para que coincida")
emit("--      con las dimensiones reales de las preguntas nuevas (mismos ids/codes de")
emit("--      assessment_definitions, no se tocan).")
emit("--   3) Inserta el contenido completo de cada batería.")
emit("--   NO se modifican las preguntas de ejemplo de role_specific (sales/director);")
emit("--   se agregan preguntas nuevas a continuación de las existentes (order_index")
emit("--   continúa desde 4) y preguntas para los 5 roles restantes desde 1.")
emit("-- ============================================================================")
emit()

# ---------------------------------------------------------------------------
# 1) DELETE de preguntas de ejemplo de Fase 1 (excepto role_specific)
# ---------------------------------------------------------------------------
emit("-- ----------------------------------------------------------------------------")
emit("-- Limpieza de preguntas de ejemplo (Fase 1) para las 6 baterías que cambian de")
emit("-- taxonomía de dimensiones. role_specific NO se toca aquí (se conservan sales/")
emit("-- director de ejemplo y se agregan las nuevas más abajo).")
emit("-- ----------------------------------------------------------------------------")
for code in ["behavioral", "cognitive", "personality", "competencies", "values", "leadership"]:
    emit(
        f"delete from public.questions where assessment_definition_id = "
        f"(select id from public.assessment_definitions where code = '{code}');"
    )
emit()

# ---------------------------------------------------------------------------
# 2) UPDATE config_json.dimensions para las baterías cuya taxonomía cambió
# ---------------------------------------------------------------------------
emit("-- ----------------------------------------------------------------------------")
emit("-- Actualización de config_json.dimensions para reflejar las dimensiones reales")
emit("-- de las preguntas de la Fase 2 (mismos id/code/name/description de la fila;")
emit("-- solo cambia el arreglo de dimensiones dentro de config_json).")
emit("-- ----------------------------------------------------------------------------")


def update_dimensions(code, question_type, dims):
    payload = {
        "question_type": question_type,
        "dimensions": [{"code": c, "label": l} for c, l in dims],
    }
    emit(
        f"update public.assessment_definitions set config_json = {jsonb_lit(payload)} "
        f"where code = '{code}';"
    )


update_dimensions("behavioral", "forced_choice_quad", [
    ("D", "Dominancia"), ("I", "Influencia"), ("S", "Estabilidad"), ("C", "Cumplimiento"),
])

cognitive_dims = [
    ("razonamiento_abstracto", "Razonamiento Abstracto"),
    ("razonamiento_analitico", "Razonamiento Analítico"),
    ("reconocimiento_patrones", "Reconocimiento de Patrones"),
    ("concentracion", "Concentración"),
    ("juicio", "Juicio"),
    ("organizacion", "Organización"),
    ("planeacion", "Planeación"),
]
update_dimensions("cognitive", "multiple_choice", cognitive_dims)

personality_dims = [(code, label) for code, label, _ in p2.PERSONALITY_DIMENSIONS]
update_dimensions("personality", "likert5", personality_dims)

competencies_dims = [(code, label) for code, label, _ in p3.COMPETENCIES_DIMENSIONS]
update_dimensions("competencies", "likert5", competencies_dims)

values_dims = [(code, label) for code, label, _ in p3.VALUES_DIMENSIONS]
update_dimensions("values", "likert5", values_dims)

leadership_dims = [(code, label) for code, label, _ in p3.LEADERSHIP_DIMENSIONS]
update_dimensions("leadership", "likert5", leadership_dims)
emit()

# role_specific: mantenemos roles/orden, agregamos las dimensiones nuevas a cada rol
ROLE_SPECIFIC_ORIGINAL = [
    ("sales", "Ventas", [
        ("prospeccion", "Prospección"), ("cierre", "Cierre de Ventas"),
        ("relacion_cliente", "Relación con el Cliente"),
    ]),
    ("commercial_manager", "Gerente Comercial", [
        ("gestion_equipo_comercial", "Gestión de Equipo Comercial"),
        ("planeacion_estrategica", "Planeación Estratégica"),
        ("negociacion", "Negociación"),
    ]),
    ("director", "Director", [
        ("vision_negocio", "Visión de Negocio"), ("toma_decisiones", "Toma de Decisiones"),
        ("gestion_stakeholders", "Gestión de Stakeholders"),
    ]),
    ("consultant", "Consultor", [
        ("analisis_problemas", "Análisis de Problemas"),
        ("comunicacion_cliente", "Comunicación con el Cliente"),
        ("adaptabilidad_proyectos", "Adaptabilidad a Proyectos"),
    ]),
    ("analyst", "Analista", [
        ("precision_datos", "Precisión con Datos"), ("pensamiento_critico", "Pensamiento Crítico"),
        ("documentacion", "Documentación"),
    ]),
    ("operations", "Operaciones", [
        ("eficiencia_procesos", "Eficiencia de Procesos"), ("gestion_calidad", "Gestión de Calidad"),
        ("resolucion_incidentes", "Resolución de Incidentes"),
    ]),
    ("hr", "RRHH", [
        ("gestion_talento", "Gestión de Talento"), ("relaciones_laborales", "Relaciones Laborales"),
        ("comunicacion_organizacional", "Comunicación Organizacional"),
    ]),
]

role_payload = {"question_type": "likert5", "roles": []}
for role_code, role_label, base_dims in ROLE_SPECIFIC_ORIGINAL:
    dims = list(base_dims) + list(p4.ROLE_SPECIFIC_NEW[role_code]["new_dims"])
    role_payload["roles"].append({
        "code": role_code, "label": role_label,
        "dimensions": [{"code": c, "label": l} for c, l in dims],
    })

emit(
    f"update public.assessment_definitions set config_json = {jsonb_lit(role_payload)} "
    f"where code = 'role_specific';"
)
emit()

# ---------------------------------------------------------------------------
# 3) BEHAVIORAL: 28 bloques forced_choice_quad
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- BEHAVIORAL: 28 bloques forced_choice_quad (estilo DISC/Cleaver)")
emit("-- ============================================================================")
emit("insert into public.questions")
emit("  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
emit("select ad.id, v.order_index, 'forced_choice_quad', 'DISC', v.prompt_text, v.options_json::jsonb, false")
emit("from public.assessment_definitions ad,")
emit("(values")
rows = []
for i, (scenario, d_text, i_text, s_text, c_text) in enumerate(p1.BEHAVIORAL_BLOCKS, start=1):
    prompt = f"Bloque {i} — {scenario}. Elige la frase que MÁS y la que MENOS te describe en el trabajo."
    options = {
        "options": [
            {"text": d_text, "dimension": "D"},
            {"text": i_text, "dimension": "I"},
            {"text": s_text, "dimension": "S"},
            {"text": c_text, "dimension": "C"},
        ]
    }
    rows.append(f"  ({i}, {sql_str(prompt)}, {jsonb_lit(options)})")
emit(",\n".join(rows))
emit(") as v(order_index, prompt_text, options_json)")
emit("where ad.code = 'behavioral'")
emit("on conflict do nothing;")
emit()

# ---------------------------------------------------------------------------
# 4) COGNITIVE: 40 multiple_choice
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- COGNITIVE: 40 preguntas multiple_choice")
emit("-- ============================================================================")
emit("insert into public.questions")
emit("  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
emit("select ad.id, v.order_index, 'multiple_choice', v.dimension, v.prompt_text, v.options_json::jsonb, false")
emit("from public.assessment_definitions ad,")
emit("(values")
rows = []
for i, (dim, prompt, choices, correct_idx) in enumerate(p1.COGNITIVE_ALL, start=1):
    options = {"choices": choices, "correct_index": correct_idx}
    rows.append(f"  ({i}, {sql_str(dim)}, {sql_str(prompt)}, {jsonb_lit(options)})")
emit(",\n".join(rows))
emit(") as v(order_index, dimension, prompt_text, options_json)")
emit("where ad.code = 'cognitive'")
emit("on conflict do nothing;")
emit()

# ---------------------------------------------------------------------------
# 5) PERSONALITY: 120 likert5
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- PERSONALITY: 120 preguntas likert5 (13 dimensiones)")
emit("-- ============================================================================")
emit("insert into public.questions")
emit("  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
emit(f"select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, {LIKERT_SCALE_LABELS_JSON}::jsonb, v.is_reverse")
emit("from public.assessment_definitions ad,")
emit("(values")
rows = []
idx = 1
for code, label, items in p2.PERSONALITY_DIMENSIONS:
    for text, is_reverse in items:
        rows.append(f"  ({idx}, {sql_str(code)}, {sql_str(text)}, {str(is_reverse).lower()})")
        idx += 1
emit(",\n".join(rows))
emit(") as v(order_index, dimension, prompt_text, is_reverse)")
emit("where ad.code = 'personality'")
emit("on conflict do nothing;")
emit()

# ---------------------------------------------------------------------------
# 6) COMPETENCIES: 60 likert5
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- COMPETENCIES: 60 preguntas likert5 (14 competencias)")
emit("-- ============================================================================")
emit("insert into public.questions")
emit("  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
emit(f"select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, {LIKERT_SCALE_LABELS_JSON}::jsonb, false")
emit("from public.assessment_definitions ad,")
emit("(values")
rows = []
idx = 1
for code, label, items in p3.COMPETENCIES_DIMENSIONS:
    for text in items:
        rows.append(f"  ({idx}, {sql_str(code)}, {sql_str(text)})")
        idx += 1
emit(",\n".join(rows))
emit(") as v(order_index, dimension, prompt_text)")
emit("where ad.code = 'competencies'")
emit("on conflict do nothing;")
emit()

# ---------------------------------------------------------------------------
# 7) VALUES: 40 likert5
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- VALUES: 40 preguntas likert5 (8 dimensiones, incluye deseabilidad social inversa)")
emit("-- ============================================================================")
emit("insert into public.questions")
emit("  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
emit(f"select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, {LIKERT_SCALE_LABELS_JSON}::jsonb, v.is_reverse")
emit("from public.assessment_definitions ad,")
emit("(values")
rows = []
idx = 1
for code, label, items in p3.VALUES_DIMENSIONS:
    for text, is_reverse in items:
        rows.append(f"  ({idx}, {sql_str(code)}, {sql_str(text)}, {str(is_reverse).lower()})")
        idx += 1
emit(",\n".join(rows))
emit(") as v(order_index, dimension, prompt_text, is_reverse)")
emit("where ad.code = 'values'")
emit("on conflict do nothing;")
emit()

# ---------------------------------------------------------------------------
# 8) LEADERSHIP: 50 likert5
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- LEADERSHIP: 50 preguntas likert5 (11 dimensiones)")
emit("-- ============================================================================")
emit("insert into public.questions")
emit("  (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
emit(f"select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, {LIKERT_SCALE_LABELS_JSON}::jsonb, false")
emit("from public.assessment_definitions ad,")
emit("(values")
rows = []
idx = 1
for code, label, items in p3.LEADERSHIP_DIMENSIONS:
    for text in items:
        rows.append(f"  ({idx}, {sql_str(code)}, {sql_str(text)})")
        idx += 1
emit(",\n".join(rows))
emit(") as v(order_index, dimension, prompt_text)")
emit("where ad.code = 'leadership'")
emit("on conflict do nothing;")
emit()

# ---------------------------------------------------------------------------
# 9) ROLE_SPECIFIC: 13 items nuevos x 7 roles (91 total), conservando 6 de ejemplo
# ---------------------------------------------------------------------------
emit("-- ============================================================================")
emit("-- ROLE_SPECIFIC: preguntas adicionales por rol (13 por rol, 91 en total).")
emit("-- Los ejemplos de Fase 1 (3 para 'sales', 3 para 'director') se conservan.")
emit("-- ============================================================================")
ROLE_ORDER = ["sales", "commercial_manager", "director", "consultant", "analyst", "operations", "hr"]
for role_code in ROLE_ORDER:
    data = p4.ROLE_SPECIFIC_NEW[role_code]
    start = data["order_start"]
    emit(f"-- Rol: {role_code}")
    emit("insert into public.questions")
    emit("  (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)")
    emit(
        f"select ad.id, '{role_code}'::role_variant_code, v.order_index, 'likert5', v.dimension, "
        f"v.prompt_text, {LIKERT_SCALE_LABELS_JSON}::jsonb, false"
    )
    emit("from public.assessment_definitions ad,")
    emit("(values")
    rows = []
    for offset, (dim, text) in enumerate(data["items"]):
        order_index = start + offset
        rows.append(f"  ({order_index}, {sql_str(dim)}, {sql_str(text)})")
    emit(",\n".join(rows))
    emit(") as v(order_index, dimension, prompt_text)")
    emit("where ad.code = 'role_specific'")
    emit("on conflict do nothing;")
    emit()

emit("-- ============================================================================")
emit("-- FIN DEL SCRIPT DE CONTENIDO FASE 2")
emit("-- ============================================================================")

final_sql = "\n".join(out) + "\n"

output_path = os.path.join(
    os.path.dirname(__file__), "..", "..", "supabase", "seed_full_content.sql"
)
with open(output_path, "w", encoding="utf-8") as f:
    f.write(final_sql)

print(f"Escrito: {os.path.abspath(output_path)} ({len(final_sql)} bytes, {final_sql.count(chr(10))} líneas)")
