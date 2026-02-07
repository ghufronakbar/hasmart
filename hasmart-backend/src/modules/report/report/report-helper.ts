import { Roboto } from "pdfmake/fonts/Roboto";

export class ReportHelper {
  static getFonts() {
    return {
      Roboto,
    };
  }

  static getStyles() {
    return {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subHeader: { fontSize: 14, bold: true, color: "#444" },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: "black",
        fillColor: "#eeeeee",
      },
    };
  }

  static formatCurrency(value: number): string {
    return value.toLocaleString("id-ID");
  }

  static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("id-ID");
  }
}
