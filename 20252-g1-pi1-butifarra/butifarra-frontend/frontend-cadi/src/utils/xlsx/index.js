const XML_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>";

function book_new() {
  return {
    SheetNames: [],
    Sheets: {},
    _meta: {
      createdAt: new Date(),
    },
  };
}

function sanitizeSheetName(name) {
  const forbidden = /[\u0000-\u001F\u007F\\/?*\[\]]/g;
  let safe = String(name ?? "").replace(forbidden, "").trim();
  if (!safe) {
    safe = "Sheet";
  }
  if (safe.length > 31) {
    safe = safe.slice(0, 31);
  }
  return safe;
}

function book_append_sheet(workbook, worksheet, name) {
  if (!worksheet || !Array.isArray(worksheet.__rows) || worksheet.__rows.length === 0) {
    return;
  }
  const safeName = sanitizeSheetName(name || `Sheet${workbook.SheetNames.length + 1}`);
  if (workbook.SheetNames.includes(safeName)) {
    let counter = 1;
    let candidate = `${safeName}_${counter}`;
    while (workbook.SheetNames.includes(candidate)) {
      counter += 1;
      candidate = `${safeName}_${counter}`;
    }
    workbook.SheetNames.push(candidate);
    workbook.Sheets[candidate] = worksheet;
    return;
  }
  workbook.SheetNames.push(safeName);
  workbook.Sheets[safeName] = worksheet;
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return { type: "s", value: "" };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { type: "n", value };
  }
  if (value instanceof Date) {
    return { type: "s", value: value.toISOString() };
  }
  if (typeof value === "boolean") {
    return { type: "n", value: value ? 1 : 0 };
  }
  return { type: "s", value: String(value) };
}

function json_to_sheet(data = []) {
  if (!Array.isArray(data) || data.length === 0) {
    return { __rows: [], __headers: [], "!ref": "A1" };
  }

  const headers = [];
  data.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }
    Object.keys(item).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
  });

  if (headers.length === 0) {
    return { __rows: [], __headers: [], "!ref": "A1" };
  }

  const rows = [];
  rows.push(headers.map((header) => ({ type: "s", value: header })));

  data.forEach((item) => {
    const row = headers.map((header) => normalizeCellValue(item?.[header]));
    rows.push(row);
  });

  const ref = computeRange(rows.length, headers.length);
  return { __rows: rows, __headers: headers, "!ref": ref };
}

function computeRange(rowCount, columnCount) {
  if (rowCount === 0 || columnCount === 0) {
    return "A1";
  }
  const endColumn = columnIndexToLetter(columnCount);
  return `A1:${endColumn}${rowCount}`;
}

function columnIndexToLetter(index) {
  let dividend = index;
  let columnName = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return columnName;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sheetToXml(worksheet) {
  const rows = worksheet.__rows || [];
  const sheetData = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => {
          const ref = `${columnIndexToLetter(cellIndex + 1)}${rowIndex + 1}`;
          if (cell.type === "n") {
            return `<c r=\"${ref}\"><v>${cell.value}</v></c>`;
          }
          const text = escapeXml(cell.value);
          return `<c r=\"${ref}\" t=\"inlineStr\"><is><t>${text}</t></is></c>`;
        })
        .join("");
      return `<row r=\"${rowIndex + 1}\">${cells}</row>`;
    })
    .join("");

  return `${XML_HEADER}<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>${sheetData}</sheetData></worksheet>`;
}

function generateWorkbookXml(sheetNames) {
  const sheetsXml = sheetNames
    .map((name, index) => `<sheet name=\"${escapeXml(name)}\" sheetId=\"${index + 1}\" r:id=\"rId${index + 1}\"/>`)
    .join("");
  return `${XML_HEADER}<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><fileVersion appName=\"SheetJS\"/><workbookPr showInkAnnotation=\"0\" autoCompressPictures=\"0\"/><bookViews><workbookView/></bookViews><sheets>${sheetsXml}</sheets></workbook>`;
}

function generateWorkbookRels(sheetNames) {
  const relationships = sheetNames
    .map((_, index) => `<Relationship Id=\"rId${index + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet${index + 1}.xml\"/>`)
    .join("");
  const stylesRelId = sheetNames.length + 1;
  const stylesRel = `<Relationship Id=\"rId${stylesRelId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>`;
  return `${XML_HEADER}<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">${relationships}${stylesRel}</Relationships>`;
}

function generateContentTypes(sheetNames) {
  const sheetOverrides = sheetNames
    .map((_, index) => `<Override PartName=\"/xl/worksheets/sheet${index + 1}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>`)
    .join("");
  return `${XML_HEADER}<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/><Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>${sheetOverrides}</Types>`;
}

function generateRootRels() {
  return `${XML_HEADER}<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/></Relationships>`;
}

function generateStylesXml() {
  return `${XML_HEADER}<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><fonts count=\"1\"><font><sz val=\"11\"/><color theme=\"1\"/><name val=\"Calibri\"/><family val=\"2\"/><scheme val=\"minor\"/></font></fonts><fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills><borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/></cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles></styleSheet>`;
}

function generateAppXml(sheetNames) {
  const totalSheets = sheetNames.length;
  const titles = sheetNames.map((name) => `<vt:lpstr>${escapeXml(name)}</vt:lpstr>`).join("");
  return `${XML_HEADER}<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\"><Application>SheetJS</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${totalSheets}</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size=\"${totalSheets}\" baseType=\"lpstr\">${titles}</vt:vector></TitlesOfParts></Properties>`;
}

function generateCoreXml(createdAt) {
  const now = createdAt instanceof Date ? createdAt : new Date();
  const iso = now.toISOString();
  return `${XML_HEADER}<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><dc:creator>Dashboard Exporter</dc:creator><cp:lastModifiedBy>Dashboard Exporter</cp:lastModifiedBy><dcterms:created xsi:type=\"dcterms:W3CDTF\">${iso}</dcterms:created><dcterms:modified xsi:type=\"dcterms:W3CDTF\">${iso}</dcterms:modified></cp:coreProperties>`;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const fileEntries = [];
  const localChunks = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(contentBytes);
    const size = contentBytes.length;
    const header = new Uint8Array(30 + nameBytes.length);
    writeUint32(header, 0, 0x04034b50);
    writeUint16(header, 4, 20);
    writeUint16(header, 6, 0);
    writeUint16(header, 8, 0);
    writeUint16(header, 10, 0);
    writeUint16(header, 12, 0);
    writeUint32(header, 14, crc);
    writeUint32(header, 18, size);
    writeUint32(header, 22, size);
    writeUint16(header, 26, nameBytes.length);
    writeUint16(header, 28, 0);
    header.set(nameBytes, 30);

    localChunks.push(header, contentBytes);

    fileEntries.push({
      nameBytes,
      contentBytes,
      crc,
      size,
      offset,
    });

    offset += header.length + contentBytes.length;
  });

  const centralChunks = [];
  let centralSize = 0;

  fileEntries.forEach((entry, index) => {
    const central = new Uint8Array(46 + entry.nameBytes.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0);
    writeUint16(central, 10, 0);
    writeUint16(central, 12, 0);
    writeUint16(central, 14, 0);
    writeUint32(central, 16, entry.crc);
    writeUint32(central, 20, entry.size);
    writeUint32(central, 24, entry.size);
    writeUint16(central, 28, entry.nameBytes.length);
    writeUint16(central, 30, 0);
    writeUint16(central, 32, 0);
    writeUint16(central, 34, 0);
    writeUint16(central, 36, 0);
    writeUint32(central, 38, 0);
    writeUint32(central, 42, entry.offset);
    central.set(entry.nameBytes, 46);

    centralChunks.push(central);
    centralSize += central.length;
  });

  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 4, 0);
  writeUint16(end, 6, 0);
  writeUint16(end, 8, fileEntries.length);
  writeUint16(end, 10, fileEntries.length);
  writeUint32(end, 12, centralSize);
  writeUint32(end, 16, offset);
  writeUint16(end, 20, 0);

  const totalSize = offset + centralSize + end.length;
  const output = new Uint8Array(totalSize);
  let pointer = 0;

  localChunks.forEach((chunk) => {
    output.set(chunk, pointer);
    pointer += chunk.length;
  });

  centralChunks.forEach((chunk) => {
    output.set(chunk, pointer);
    pointer += chunk.length;
  });

  output.set(end, pointer);

  return output;
}

function writeUint16(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c >>>= 1;
      }
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    const index = (crc ^ byte) & 0xff;
    crc = (CRC_TABLE[index] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildWorkbookFiles(workbook) {
  const sheetNames = workbook.SheetNames;
  const files = [];

  files.push({ path: "[Content_Types].xml", content: generateContentTypes(sheetNames) });
  files.push({ path: "_rels/.rels", content: generateRootRels() });
  files.push({ path: "docProps/app.xml", content: generateAppXml(sheetNames) });
  files.push({ path: "docProps/core.xml", content: generateCoreXml(workbook._meta?.createdAt) });
  files.push({ path: "xl/workbook.xml", content: generateWorkbookXml(sheetNames) });
  files.push({ path: "xl/_rels/workbook.xml.rels", content: generateWorkbookRels(sheetNames) });
  files.push({ path: "xl/styles.xml", content: generateStylesXml() });

  sheetNames.forEach((name, index) => {
    const worksheet = workbook.Sheets[name];
    const sheetXml = sheetToXml(worksheet);
    files.push({ path: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml });
  });

  return files;
}

function writeFile(workbook, filename) {
  if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
    throw new Error("El libro de trabajo no contiene hojas para exportar.");
  }

  const files = buildWorkbookFiles(workbook);
  const archive = createZip(files);
  const blob = new Blob([archive], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  if (typeof window !== "undefined" && window.document) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 0);
    return;
  }

  throw new Error("XLSX.writeFile solo está disponible en entornos de navegador.");
}

const XLSX = {
  utils: {
    book_new,
    book_append_sheet,
    json_to_sheet,
  },
  writeFile,
};

export default XLSX;
export const utils = XLSX.utils;
export { writeFile, book_new, book_append_sheet, json_to_sheet };
