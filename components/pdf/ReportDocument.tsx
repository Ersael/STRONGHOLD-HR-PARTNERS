import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportJson } from "@/types/database";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottom: "2 solid #1f2937",
    paddingBottom: 10,
  },
  logoBox: {
    width: 46,
    height: 46,
    backgroundColor: "#4338ca",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  titleBlock: {
    marginLeft: 12,
    flexGrow: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  reportSubtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  candidateBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  candidateRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  candidateLabel: {
    width: 90,
    fontFamily: "Helvetica-Bold",
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    color: "#312e81",
  },
  paragraph: {
    lineHeight: 1.5,
    marginBottom: 4,
  },
  chartWrapper: {
    marginTop: 6,
    marginBottom: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  barLabel: {
    width: 150,
    fontSize: 8,
  },
  barTrack: {
    flexGrow: 1,
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    flexDirection: "row",
  },
  barValueText: {
    width: 30,
    fontSize: 8,
    textAlign: "right",
    marginLeft: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTop: "1 solid #d1d5db",
    paddingTop: 6,
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 36,
    fontSize: 7,
    color: "#9ca3af",
  },
});

function levelColor(level: "alto" | "medio" | "bajo"): string {
  if (level === "alto") return "#16a34a";
  if (level === "medio") return "#d97706";
  return "#dc2626";
}

export function ReportDocument({ report }: { report: ReportJson }) {
  return (
    <Document title={`Reporte psicométrico - ${report.candidate.full_name}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow} fixed>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>PE</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>Reporte de Evaluación Psicométrica</Text>
            <Text style={styles.reportSubtitle}>
              Generado el {new Date(report.generated_at).toLocaleString("es-MX")}
            </Text>
          </View>
        </View>

        <View style={styles.candidateBox}>
          <View style={styles.candidateRow}>
            <Text style={styles.candidateLabel}>Candidato:</Text>
            <Text>{report.candidate.full_name}</Text>
          </View>
          <View style={styles.candidateRow}>
            <Text style={styles.candidateLabel}>Correo:</Text>
            <Text>{report.candidate.email}</Text>
          </View>
          <View style={styles.candidateRow}>
            <Text style={styles.candidateLabel}>Puesto aplicado:</Text>
            <Text>{report.candidate.position_applied ?? "No especificado"}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Resumen de Puntajes por Dimensión</Text>
        <View style={styles.chartWrapper}>
          {report.dimension_scores.map((d) => (
            <View key={`${d.assessment_code}-${d.dimension}`} style={styles.barRow}>
              <Text style={styles.barLabel}>{d.dimension_label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={{
                    width: `${Math.max(2, Math.min(100, d.normalized_score))}%`,
                    height: "100%",
                    backgroundColor: levelColor(d.level),
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text style={styles.barValueText}>{Math.round(d.normalized_score)}</Text>
            </View>
          ))}
          {report.dimension_scores.length === 0 && (
            <Text style={styles.paragraph}>Aún no hay puntajes calculados para este candidato.</Text>
          )}
        </View>

        {report.sections.map((section) => (
          <View key={section.id} wrap={false}>
            <Text style={styles.sectionHeading}>
              {section.id}. {section.title}
            </Text>
            {section.content.split("\n").map((line, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {line}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          {report.ethical_notice}
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
