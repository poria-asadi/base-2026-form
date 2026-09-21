export type RegistrationExportRow = {
  id: string;
  full_name: string;
  age: number;
  city: string;
  field: string;
  education: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  base_amount: number;
  discount_code: string | null;
  discount_percent: number;
  final_amount: number;
  identifier_code: string | null;
  payment_reference: string | null;
  created_at: string;
  paid_at: string | null;
};

const escapeXml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const textCell = (value: unknown, style = "Text") => `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
const numberCell = (value: number, style = "Number") => `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number.isFinite(value) ? value : 0}</Data></Cell>`;
const dateCell = (value: string | null) => value ? `<Cell ss:StyleID="Date"><Data ss:Type="DateTime">${escapeXml(value)}</Data></Cell>` : textCell("");

export function createRegistrationsExcel(rows: RegistrationExportRow[]) {
  const headers = ["ردیف", "نام و نام خانوادگی", "سن", "شهر", "رشته یا حوزه کاری", "مقطع تحصیلی", "شماره تماس", "ایمیل", "نحوه آشنایی", "وضعیت", "هزینه پایه (تومان)", "کد تخفیف", "درصد تخفیف", "مبلغ نهایی (تومان)", "کد شناسایی", "مرجع پرداخت", "تاریخ ثبت", "تاریخ پرداخت"];
  const headerRow = `<Row ss:Height="30">${headers.map((header) => textCell(header, "Header")).join("")}</Row>`;
  const dataRows = rows.map((row, index) => `<Row>${[
    numberCell(index + 1), textCell(row.full_name), numberCell(row.age), textCell(row.city), textCell(row.field), textCell(row.education), textCell(row.phone), textCell(row.email), textCell(row.source), textCell(row.status === "paid" ? "قطعی / پرداخت‌شده" : "در انتظار پرداخت"), numberCell(row.base_amount, "Money"), textCell(row.discount_code), numberCell(row.discount_percent), numberCell(row.final_amount, "Money"), textCell(row.identifier_code), textCell(row.payment_reference), dateCell(row.created_at), dateCell(row.paid_at),
  ].join("")}</Row>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Center" ss:Horizontal="Right"/></Style>
  <Style ss:ID="Number"><Alignment ss:Vertical="Center" ss:Horizontal="Right"/><NumberFormat ss:Format="0"/></Style>
  <Style ss:ID="Money"><Alignment ss:Vertical="Center" ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style>
  <Style ss:ID="Date"><Alignment ss:Vertical="Center" ss:Horizontal="Right"/><NumberFormat ss:Format="yyyy-mm-dd hh:mm"/></Style>
  <Style ss:ID="Header"><Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0A2238" ss:Pattern="Solid"/></Style>
</Styles>
<Worksheet ss:Name="ثبت‌نام‌ها"><Table ss:DefaultRowHeight="22">
  <Column ss:Width="45"/><Column ss:Width="145"/><Column ss:Width="45"/><Column ss:Width="80"/><Column ss:Width="135"/><Column ss:Width="125"/><Column ss:Width="95"/><Column ss:Width="155"/><Column ss:Width="110"/><Column ss:Width="105"/><Column ss:Width="105"/><Column ss:Width="90"/><Column ss:Width="75"/><Column ss:Width="110"/><Column ss:Width="85"/><Column ss:Width="120"/><Column ss:Width="125"/><Column ss:Width="125"/>
  ${headerRow}${dataRows}
</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions><AutoFilter x:Range="R1C1:R${Math.max(rows.length + 1, 1)}C18" xmlns="urn:schemas-microsoft-com:office:excel"/></Worksheet>
</Workbook>`;
}
