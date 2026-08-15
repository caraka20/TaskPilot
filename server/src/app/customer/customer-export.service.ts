import ExcelJS, {
  type Alignment,
  type Border,
  type Fill,
  type Font,
  type Worksheet,
} from "exceljs"
import {
  CustomerExportRepository,
  type CustomerExportRow,
} from "./customer-export.repository"

const COLORS = {
  navy: "172554",
  indigo: "4F46E5",
  sky: "0284C7",
  slate: "334155",
  muted: "64748B",
  border: "CBD5E1",
  soft: "F8FAFC",
  softBlue: "EEF2FF",
  green: "15803D",
  softGreen: "DCFCE7",
  amber: "B45309",
  softAmber: "FEF3C7",
  red: "B91C1C",
  softRed: "FEE2E2",
  white: "FFFFFF",
} as const

const thinBorder: Partial<Border> = {
  style: "thin",
  color: { argb: COLORS.border },
}

const tableBorder = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
}

const currencyFormat = '[$Rp-421] #,##0;[Red]-[$Rp-421] #,##0'
const dateFormat = "dd/mm/yyyy hh:mm"

function solidFill(color: string): Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: color } }
}

function sheetLink(sheetName: string, cell = "A1") {
  return `#'${sheetName.replace(/'/g, "''")}'!${cell}`
}

function safeSheetName(value: string, used: Set<string>) {
  const normalized = value
    .replace(/[\\/*?:[\]]/g, " ")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Customer"

  const base = normalized.slice(0, 31)
  let result = base
  let counter = 2

  while (used.has(result.toLowerCase())) {
    const suffix = ` (${counter})`
    result = `${base.slice(0, 31 - suffix.length)}${suffix}`
    counter += 1
  }

  used.add(result.toLowerCase())
  return result
}

function styleTitle(sheet: Worksheet, lastColumn: string, title: string, subtitle: string) {
  sheet.mergeCells(`A1:${lastColumn}1`)
  sheet.getCell("A1").value = title
  sheet.getCell("A1").font = {
    name: "Arial",
    size: 20,
    bold: true,
    color: { argb: COLORS.white },
  }
  sheet.getCell("A1").fill = solidFill(COLORS.navy)
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" }
  sheet.getRow(1).height = 36

  sheet.mergeCells(`A2:${lastColumn}2`)
  sheet.getCell("A2").value = subtitle
  sheet.getCell("A2").font = {
    name: "Arial",
    size: 10,
    color: { argb: COLORS.muted },
  }
  sheet.getCell("A2").alignment = { vertical: "middle", wrapText: true }
  sheet.getRow(2).height = 30
}

function styleSection(sheet: Worksheet, rowNumber: number, title: string) {
  sheet.mergeCells(rowNumber, 1, rowNumber, 8)
  const cell = sheet.getCell(rowNumber, 1)
  cell.value = title
  cell.font = { name: "Arial", size: 12, bold: true, color: { argb: COLORS.white } }
  cell.fill = solidFill(COLORS.indigo)
  cell.alignment = { vertical: "middle", horizontal: "left" }
  sheet.getRow(rowNumber).height = 24
}

function styleTableHeader(sheet: Worksheet, rowNumber: number, columnCount: number) {
  const row = sheet.getRow(rowNumber)
  for (let column = 1; column <= columnCount; column += 1) {
    const cell = row.getCell(column)
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.white } }
    cell.fill = solidFill(COLORS.slate)
    cell.border = tableBorder
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
  }
  row.height = 24
}

function styleDataRows(
  sheet: Worksheet,
  fromRow: number,
  toRow: number,
  columnCount: number,
) {
  for (let rowNumber = fromRow; rowNumber <= toRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    for (let column = 1; column <= columnCount; column += 1) {
      const cell = row.getCell(column)
      cell.font = { name: "Arial", size: 10, color: { argb: COLORS.slate } }
      cell.border = tableBorder
      cell.alignment = { vertical: "top", wrapText: true }
      if ((rowNumber - fromRow) % 2 === 1) cell.fill = solidFill(COLORS.soft)
    }
  }
}

function addEmptyState(sheet: Worksheet, rowNumber: number, message: string) {
  sheet.mergeCells(rowNumber, 1, rowNumber, 8)
  const cell = sheet.getCell(rowNumber, 1)
  cell.value = message
  cell.font = { name: "Arial", size: 10, italic: true, color: { argb: COLORS.muted } }
  cell.fill = solidFill(COLORS.soft)
  cell.border = tableBorder
  cell.alignment = { vertical: "middle", horizontal: "center" }
  sheet.getRow(rowNumber).height = 28
}

function addKeyValue(
  sheet: Worksheet,
  rowNumber: number,
  left: [string, ExcelJS.CellValue],
  right: [string, ExcelJS.CellValue],
) {
  sheet.getCell(rowNumber, 1).value = left[0]
  sheet.mergeCells(rowNumber, 2, rowNumber, 4)
  sheet.getCell(rowNumber, 2).value = left[1]
  sheet.getCell(rowNumber, 5).value = right[0]
  sheet.mergeCells(rowNumber, 6, rowNumber, 8)
  sheet.getCell(rowNumber, 6).value = right[1]

  for (const column of [1, 5]) {
    const cell = sheet.getCell(rowNumber, column)
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.slate } }
    cell.fill = solidFill(COLORS.softBlue)
    cell.border = tableBorder
    cell.alignment = { vertical: "middle" }
  }

  for (const column of [2, 6]) {
    const cell = sheet.getCell(rowNumber, column)
    cell.font = { name: "Arial", size: 10, color: { argb: COLORS.slate } }
    cell.border = tableBorder
    cell.alignment = { vertical: "middle", wrapText: true }
  }
  sheet.getRow(rowNumber).height = 23
}

function paymentStatus(customer: CustomerExportRow) {
  if (customer.sisaBayar <= 0) return "LUNAS"
  if (customer.sudahBayar > 0) return "SEBAGIAN"
  return "BELUM DIBAYAR"
}

function styleStatusCell(cell: ExcelJS.Cell, status: string) {
  if (status === "LUNAS" || status === "SELESAI") {
    cell.fill = solidFill(COLORS.softGreen)
    cell.font = { bold: true, color: { argb: COLORS.green } }
    return
  }
  if (status === "SEBAGIAN") {
    cell.fill = solidFill(COLORS.softAmber)
    cell.font = { bold: true, color: { argb: COLORS.amber } }
    return
  }
  cell.fill = solidFill(COLORS.softRed)
  cell.font = { bold: true, color: { argb: COLORS.red } }
}

function customerServices(customer: CustomerExportRow) {
  const services: string[] = []
  if (customer.layananTuton) services.push("Tuton")
  if (customer.layananKaril) services.push("Karya Ilmiah")
  if (customer.layananMetodePenelitian) services.push("Metode Penelitian")
  if (services.length === 0) {
    return customer.jenis === "KARIL" ? "Karya Ilmiah" : "Tuton"
  }
  return services.join(", ")
}

function addProjectDetail(
  sheet: Worksheet,
  rowNumber: number,
  title: string,
  detail: CustomerExportRow["karil"] | CustomerExportRow["metodePenelitian"],
  tableName: string,
) {
  styleSection(sheet, rowNumber, title)
  let row = rowNumber + 1
  if (!detail) {
    addEmptyState(sheet, row, `Customer tidak memiliki detail ${title}.`)
    return row
  }

  addKeyValue(sheet, row, ["Judul", detail.judul], ["Keterangan", detail.keterangan || "—"])
  row += 1
  const taskHeaderRow = row
  const taskRows = [detail.tugas1, detail.tugas2, detail.tugas3, detail.tugas4].map(
    (done, index) => [`Tugas ${index + 1}`, done ? "Selesai" : "Belum"],
  )
  sheet.addTable({
    name: tableName,
    ref: `A${taskHeaderRow}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: [{ name: "Tahapan" }, { name: "Status" }],
    rows: taskRows,
  })
  styleTableHeader(sheet, taskHeaderRow, 2)
  styleDataRows(sheet, taskHeaderRow + 1, taskHeaderRow + taskRows.length, 2)
  taskRows.forEach((task, index) => {
    styleStatusCell(sheet.getCell(taskHeaderRow + index + 1, 2), String(task[1]))
  })
  row = taskHeaderRow + taskRows.length + 1
  addKeyValue(sheet, row, ["Dibuat", detail.createdAt], ["Diperbarui", detail.updatedAt])
  sheet.getCell(row, 2).numFmt = dateFormat
  sheet.getCell(row, 6).numFmt = dateFormat
  return row
}

function createCustomerSheet(
  workbook: ExcelJS.Workbook,
  customer: CustomerExportRow,
  sheetName: string,
  indexSheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 20 },
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  })

  sheet.columns = [
    { width: 19 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 19 },
    { width: 18 },
    { width: 18 },
    { width: 30 },
  ]
  sheet.views = [{ state: "frozen", ySplit: 3, showGridLines: false }]
  sheet.headerFooter.oddFooter = "TaskPilot • &F • Halaman &P dari &N"

  styleTitle(
    sheet,
    "H",
    customer.namaCustomer,
    `Detail customer • NIM ${customer.nim} • Diekspor ${new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date())}`,
  )

  sheet.mergeCells("A3:H3")
  sheet.getCell("A3").value = {
    text: "← Kembali ke Daftar Customer",
    hyperlink: sheetLink(indexSheetName, "A1"),
  }
  sheet.getCell("A3").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.sky }, underline: true }
  sheet.getCell("A3").alignment = { vertical: "middle" }

  let row = 5
  styleSection(sheet, row, "PROFIL CUSTOMER")
  row += 1
  addKeyValue(sheet, row, ["ID Customer", customer.id], ["Layanan", customerServices(customer)])
  row += 1
  addKeyValue(sheet, row, ["Nama", customer.namaCustomer], ["NIM", customer.nim])
  row += 1
  addKeyValue(sheet, row, ["No. WhatsApp", customer.noWa], ["Jurusan", customer.jurusan])
  row += 1
  addKeyValue(sheet, row, ["Dibuat", customer.createdAt], ["Diperbarui", customer.updatedAt])
  sheet.getCell(row, 2).numFmt = dateFormat
  sheet.getCell(row, 6).numFmt = dateFormat

  row += 2
  styleSection(sheet, row, "RINGKASAN TAGIHAN")
  row += 1
  sheet.getRow(row).values = ["Total Tagihan", "Sudah Dibayar", "Sisa Tagihan", "Status"]
  styleTableHeader(sheet, row, 4)
  row += 1
  sheet.getRow(row).values = [
    customer.totalBayar,
    customer.sudahBayar,
    customer.sisaBayar,
    paymentStatus(customer),
  ]
  styleDataRows(sheet, row, row, 4)
  for (const column of [1, 2, 3]) sheet.getCell(row, column).numFmt = currencyFormat
  styleStatusCell(sheet.getCell(row, 4), paymentStatus(customer))

  row += 2
  styleSection(sheet, row, `RIWAYAT PEMBAYARAN (${customer.payments.length})`)
  row += 1
  if (customer.payments.length === 0) {
    addEmptyState(sheet, row, "Belum ada pembayaran yang tercatat.")
    row += 1
  } else {
    const paymentHeaderRow = row
    sheet.getRow(row).values = ["No.", "Tanggal", "Jumlah", "Catatan", "Dicatat pada"]
    styleTableHeader(sheet, row, 5)
    const firstPaymentRow = row + 1
    customer.payments.forEach((payment, index) => {
      row += 1
      sheet.getRow(row).values = [
        index + 1,
        payment.tanggalBayar,
        payment.amount,
        payment.catatan || "—",
        payment.createdAt,
      ]
      sheet.getCell(row, 2).numFmt = dateFormat
      sheet.getCell(row, 3).numFmt = currencyFormat
      sheet.getCell(row, 5).numFmt = dateFormat
    })
    styleDataRows(sheet, firstPaymentRow, row, 5)
    sheet.addTable({
      name: `Payments_${customer.id}`,
      ref: `A${paymentHeaderRow}`,
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: ["No.", "Tanggal", "Jumlah", "Catatan", "Dicatat pada"].map((name) => ({ name })),
      rows: customer.payments.map((payment, index) => [
        index + 1,
        payment.tanggalBayar,
        payment.amount,
        payment.catatan || "—",
        payment.createdAt,
      ]),
    })
    row += 1
  }

  row += 1
  styleSection(sheet, row, `TUTON (${customer.tutonCourses.length} MATA KULIAH)`)
  row += 1
  if (customer.tutonCourses.length === 0) {
    addEmptyState(sheet, row, "Customer belum memiliki mata kuliah Tuton.")
    row += 1
  } else {
    const courseHeaderRow = row
    sheet.getRow(row).values = ["No.", "Mata Kuliah", "Total Item", "Selesai", "Progress", "Diperbarui"]
    styleTableHeader(sheet, row, 6)
    const firstCourseRow = row + 1
    customer.tutonCourses.forEach((course, index) => {
      const total = course.totalItems || course.items.length
      const completed = course.completedItems
      row += 1
      sheet.getRow(row).values = [
        index + 1,
        course.matkul,
        total,
        completed,
        total > 0 ? completed / total : 0,
        course.updatedAt,
      ]
      sheet.getCell(row, 5).numFmt = "0%"
      sheet.getCell(row, 6).numFmt = dateFormat
    })
    styleDataRows(sheet, firstCourseRow, row, 6)
    sheet.addTable({
      name: `Courses_${customer.id}`,
      ref: `A${courseHeaderRow}`,
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: ["No.", "Mata Kuliah", "Total Item", "Selesai", "Progress", "Diperbarui"].map((name) => ({ name })),
      rows: customer.tutonCourses.map((course, index) => {
        const total = course.totalItems || course.items.length
        return [index + 1, course.matkul, total, course.completedItems, total > 0 ? course.completedItems / total : 0, course.updatedAt]
      }),
    })
    row += 2

    const itemHeaderRow = row
    sheet.getRow(row).values = [
      "Mata Kuliah",
      "Layanan",
      "Sesi",
      "Status",
      "Nilai",
      "Penanggung Jawab",
      "Copas Soal",
      "Deskripsi / Selesai",
    ]
    styleTableHeader(sheet, row, 8)
    const firstItemRow = row + 1
    for (const course of customer.tutonCourses) {
      for (const item of course.items) {
        row += 1
        const detail = [
          item.deskripsi?.trim() || "—",
          item.selesaiAt
            ? `Selesai: ${new Intl.DateTimeFormat("id-ID", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "Asia/Jakarta",
              }).format(item.selesaiAt)}`
            : null,
        ].filter(Boolean).join("\n")

        sheet.getRow(row).values = [
          course.matkul,
          item.jenis,
          item.sesi,
          item.status,
          item.nilai ?? "—",
          item.username || "—",
          item.copasSoal ? "Ya" : "Tidak",
          detail,
        ]
      }
    }
    if (row >= firstItemRow) {
      styleDataRows(sheet, firstItemRow, row, 8)
      for (let itemRow = firstItemRow; itemRow <= row; itemRow += 1) {
        styleStatusCell(sheet.getCell(itemRow, 4), String(sheet.getCell(itemRow, 4).value))
      }
      const itemRows = customer.tutonCourses.flatMap((course) =>
        course.items.map((item) => [
          course.matkul,
          item.jenis,
          item.sesi,
          item.status,
          item.nilai ?? "—",
          item.username || "—",
          item.copasSoal ? "Ya" : "Tidak",
          [
            item.deskripsi?.trim() || "—",
            item.selesaiAt
              ? `Selesai: ${new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Asia/Jakarta",
                }).format(item.selesaiAt)}`
              : null,
          ].filter(Boolean).join("\n"),
        ]),
      )
      sheet.addTable({
        name: `TutonItems_${customer.id}`,
        ref: `A${itemHeaderRow}`,
        headerRow: true,
        totalsRow: false,
        style: { theme: "TableStyleMedium2", showRowStripes: true },
        columns: ["Mata Kuliah", "Jenis", "Sesi", "Status", "Nilai", "Penanggung Jawab", "Copas Soal", "Deskripsi / Selesai"].map((name) => ({ name })),
        rows: itemRows,
      })
    }
    if (row < firstItemRow) {
      addEmptyState(sheet, row + 1, "Mata kuliah tersedia, tetapi belum memiliki item Tuton.")
      row += 1
    }
  }

  row += 2
  row = addProjectDetail(sheet, row, "DETAIL KARYA ILMIAH", customer.karil, `KarilTasks_${customer.id}`)
  row += 2
  addProjectDetail(
    sheet,
    row,
    "DETAIL METODE PENELITIAN",
    customer.metodePenelitian,
    `ResearchTasks_${customer.id}`,
  )

  sheet.autoFilter = undefined
  return sheet
}

export class CustomerExportService {
  static async createExcel() {
    const customers = await CustomerExportRepository.findAllWithDetails()
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "TaskPilot"
    workbook.lastModifiedBy = "TaskPilot"
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.subject = "Data customer dan detail customer TaskPilot"
    workbook.title = "Export Customer TaskPilot"
    workbook.company = "TaskPilot"
    workbook.calcProperties.fullCalcOnLoad = true

    const indexSheetName = "Daftar Customer"
    const indexSheet = workbook.addWorksheet(indexSheetName, {
      properties: { defaultRowHeight: 20 },
      pageSetup: {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      },
    })

    indexSheet.columns = [
      { width: 7 },
      { width: 28 },
      { width: 20 },
      { width: 18 },
      { width: 28 },
      { width: 12 },
      { width: 19 },
      { width: 19 },
      { width: 19 },
      { width: 14 },
      { width: 14 },
      { width: 20 },
      { width: 18 },
    ]
    indexSheet.views = [{ state: "frozen", ySplit: 4, showGridLines: false }]
    indexSheet.headerFooter.oddFooter = "TaskPilot • &F • Halaman &P dari &N"

    styleTitle(
      indexSheet,
      "M",
      "Daftar Customer TaskPilot",
      `Ringkasan ${customers.length} customer • Klik nama customer untuk membuka tab detail • Password dan token tidak disertakan`,
    )

    indexSheet.mergeCells("A3:M3")
    indexSheet.getCell("A3").value = `Dibuat pada ${new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date())}`
    indexSheet.getCell("A3").font = { name: "Arial", size: 10, italic: true, color: { argb: COLORS.muted } }

    const headerRow = 4
    indexSheet.getRow(headerRow).values = [
      "No.",
      "Nama Customer",
      "NIM",
      "No. WhatsApp",
      "Jurusan",
      "Jenis",
      "Total Tagihan",
      "Sudah Dibayar",
      "Sisa Tagihan",
      "Status Bayar",
      "Jumlah Tuton",
      "Diperbarui",
      "Buka Detail",
    ]
    styleTableHeader(indexSheet, headerRow, 13)

    const usedSheetNames = new Set<string>([indexSheetName.toLowerCase()])
    const sheetNames = customers.map((customer, index) =>
      safeSheetName(`${String(index + 1).padStart(2, "0")} - ${customer.namaCustomer}`, usedSheetNames),
    )

    const firstDataRow = headerRow + 1
    customers.forEach((customer, index) => {
      const rowNumber = firstDataRow + index
      const status = paymentStatus(customer)
      const targetSheet = sheetNames[index]
      const row = indexSheet.getRow(rowNumber)
      row.values = [
        index + 1,
        { text: customer.namaCustomer, hyperlink: sheetLink(targetSheet) },
        customer.nim,
        customer.noWa,
        customer.jurusan,
        customerServices(customer),
        customer.totalBayar,
        customer.sudahBayar,
        customer.sisaBayar,
        status,
        customer.tutonCourses.length,
        customer.updatedAt,
        { text: "Buka tab →", hyperlink: sheetLink(targetSheet) },
      ]
      for (const column of [7, 8, 9]) row.getCell(column).numFmt = currencyFormat
      row.getCell(12).numFmt = dateFormat
      for (const column of [2, 13]) {
        row.getCell(column).font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.sky }, underline: true }
      }
    })

    if (customers.length > 0) {
      const lastDataRow = firstDataRow + customers.length - 1
      indexSheet.addTable({
        name: "CustomerIndex",
        ref: `A${headerRow}`,
        headerRow: true,
        totalsRow: false,
        style: { theme: "TableStyleMedium2", showRowStripes: true },
        columns: [
          "No.", "Nama Customer", "NIM", "No. WhatsApp", "Jurusan", "Layanan",
          "Total Tagihan", "Sudah Dibayar", "Sisa Tagihan", "Status Bayar",
          "Jumlah Tuton", "Diperbarui", "Buka Detail",
        ].map((name) => ({ name })),
        rows: customers.map((customer, index) => {
          const targetSheet = sheetNames[index]
          return [
            index + 1,
            { text: customer.namaCustomer, hyperlink: sheetLink(targetSheet) },
            customer.nim,
            customer.noWa,
            customer.jurusan,
            customerServices(customer),
            customer.totalBayar,
            customer.sudahBayar,
            customer.sisaBayar,
            paymentStatus(customer),
            customer.tutonCourses.length,
            customer.updatedAt,
            { text: "Buka tab →", hyperlink: sheetLink(targetSheet) },
          ]
        }),
      })
      styleDataRows(indexSheet, firstDataRow, lastDataRow, 13)
      for (let rowNumber = firstDataRow; rowNumber <= lastDataRow; rowNumber += 1) {
        styleStatusCell(
          indexSheet.getCell(rowNumber, 10),
          String(indexSheet.getCell(rowNumber, 10).value),
        )
      }
    } else {
      indexSheet.mergeCells("A5:M5")
      indexSheet.getCell("A5").value = "Belum ada customer di database."
      indexSheet.getCell("A5").alignment = { horizontal: "center", vertical: "middle" }
      indexSheet.getCell("A5").font = { italic: true, color: { argb: COLORS.muted } }
      indexSheet.getCell("A5").fill = solidFill(COLORS.soft)
      indexSheet.getRow(5).height = 30
    }

    customers.forEach((customer, index) => {
      createCustomerSheet(workbook, customer, sheetNames[index], indexSheetName)
    })

    const rawBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(rawBuffer)
    const stamp = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date()).replace(/[\s:]/g, "-")

    return {
      buffer,
      filename: `taskpilot-customer-${stamp}.xlsx`,
      totalCustomers: customers.length,
    }
  }
}
