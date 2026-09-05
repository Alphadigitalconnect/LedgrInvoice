import ExcelJS from 'exceljs';
import { GST_STATES, GST_RATES } from '../data/constants';

/**
 * Generate and download the Invoices Excel Template
 * - Auto-Flow for Invoice Number (e.g. INV/2026/001)
 * - Automatic Due Date calculation: Invoice Date + 45 days
 * - Dropdown for Existing Clients (if added in the system)
 * - Dropdown for Issuing Entities (from created entity profiles)
 * - Dropdown for States (all 36 States/UTs)
 * - Dropdown for GST Tax Rates (0%, 5%, 12%, 18%, 28%)
 * - Dropdown for Status (PAID, PENDING, DRAFT)
 * - Automatic Excel formulas for GST Amount and Total Invoice Amount
 */
export async function downloadInvoicesTemplate(entities = [], clients = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LEDGR Multi-Entity Invoicing Portal';
  workbook.created = new Date();

  // 1. Reference Data Sheet (for Dropdowns)
  const refSheet = workbook.addWorksheet('Dropdown_Lists', { state: 'visible' });
  refSheet.columns = [
    { header: 'Issuing Entities', key: 'entities', width: 30 },
    { header: 'Indian States', key: 'states', width: 30 },
    { header: 'GST Rates %', key: 'gstRates', width: 15 },
    { header: 'Invoice Status', key: 'status', width: 18 },
    { header: 'Existing Clients', key: 'clients', width: 32 }
  ];

  // Populate Reference Lists
  const entityNames = entities.length > 0 
    ? entities.map(e => (e.tradeName || e.name || '').trim()).filter(Boolean)
    : ['SC & Associates'];
  
  const stateNames = GST_STATES.map(s => s.name);
  const gstRateValues = [0, 5, 12, 18, 28];
  const statusValues = ['PAID', 'PENDING', 'DRAFT'];
  
  // Clean client names
  const clientNames = clients.length > 0
    ? Array.from(new Set(clients.map(c => (c.name || c.businessName || '').trim()).filter(Boolean)))
    : [];

  const maxRows = Math.max(
    entityNames.length, 
    stateNames.length, 
    gstRateValues.length, 
    statusValues.length,
    clientNames.length
  );

  for (let i = 0; i < maxRows; i++) {
    refSheet.addRow({
      entities: entityNames[i] || '',
      states: stateNames[i] || '',
      gstRates: gstRateValues[i] !== undefined ? gstRateValues[i] : '',
      status: statusValues[i] || '',
      clients: clientNames[i] || ''
    });
  }

  // Style Ref Sheet Header
  refSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  refSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate 800
  };

  // 2. Main Invoices Data Sheet
  const ws = workbook.addWorksheet('Invoices_Data', {
    views: [{ showGridLines: true }]
  });

  ws.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 22 },
    { header: 'Invoice Date (YYYY-MM-DD)', key: 'invoiceDate', width: 24 },
    { header: 'Due Date (YYYY-MM-DD)', key: 'dueDate', width: 24 },
    { header: 'Issuing Entity Name *', key: 'entityName', width: 30 },
    { header: 'Client Name *', key: 'clientName', width: 32 },
    { header: 'Client GSTIN', key: 'clientGstin', width: 22 },
    { header: 'Client State / Place of Supply *', key: 'clientState', width: 30 },
    { header: 'Billing Address', key: 'address', width: 32 },
    { header: 'City', key: 'city', width: 18 },
    { header: 'PIN Code', key: 'pinCode', width: 14 },
    { header: 'Description of Services *', key: 'description', width: 36 },
    { header: 'HSN / SAC Code', key: 'sacCode', width: 16 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Taxable Amount (₹) *', key: 'taxableAmount', width: 20 },
    { header: 'GST Rate % *', key: 'gstRate', width: 15 },
    { header: 'GST Amount (Auto) ₹', key: 'gstAmount', width: 22 },
    { header: 'Total Invoice Amount (Auto) ₹', key: 'totalAmount', width: 26 },
    { header: 'Status *', key: 'status', width: 16 },
    { header: 'Amount Paid (₹)', key: 'amountPaid', width: 18 }
  ];

  // Header Row Styling
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate 900
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Setup 100 blank rows with Data Validations & Excel Formulas
  const totalTemplateRows = 100;
  for (let r = 2; r <= totalTemplateRows + 1; r++) {
    // 1. Invoice Number Auto-Flow Formula (Column A)
    // Formula: IF(D{r}<>"","INV/"&TEXT(IF(B{r}<>"",B{r},TODAY()),"YYYY")&"/"&TEXT(ROW()-1,"000"),"")
    ws.getCell(`A${r}`).value = {
      formula: `IF(D${r}<>"","INV/"&TEXT(IF(B${r}<>"",B${r},TODAY()),"YYYY")&"/"&TEXT(ROW()-1,"000"),"")`
    };

    // 2. Automatic Due Date: 45 Days from Invoice Date (Column C)
    // Formula: IF(B{r}<>"", B{r}+45, "")
    ws.getCell(`C${r}`).value = {
      formula: `IF(B${r}<>"", B${r}+45, "")`
    };
    ws.getCell(`C${r}`).numFmt = 'YYYY-MM-DD';
    ws.getCell(`B${r}`).numFmt = 'YYYY-MM-DD';

    // 3. Issuing Entity Name Dropdown (Column D)
    ws.getCell(`D${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Dropdown_Lists'!$A$2:$A$${entityNames.length + 1}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Entity',
      error: 'Please select an Issuing Entity registered in your Entity Profiles.'
    };

    // 4. Client Name Dropdown (Column E) - If clients exist in the system
    if (clientNames.length > 0) {
      ws.getCell(`E${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'Dropdown_Lists'!$E$2:$E$${clientNames.length + 1}`],
        showErrorMessage: false, // allow dropdown pick OR custom entry
        showInputMessage: true,
        promptTitle: 'Client Selection',
        prompt: 'Select an existing registered client from the dropdown or type a new client name.'
      };
    }

    // 5. Client State Dropdown (Column G)
    ws.getCell(`G${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Dropdown_Lists'!$B$2:$B$${stateNames.length + 1}`],
      showErrorMessage: true,
      errorTitle: 'Invalid State',
      error: 'Please select a valid Indian State or Union Territory.'
    };

    // 6. GST Rate % Dropdown (Column O)
    ws.getCell(`O${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Dropdown_Lists'!$C$2:$C$${gstRateValues.length + 1}`],
      showErrorMessage: true,
      errorTitle: 'Invalid GST Rate',
      error: 'Please select a standard GST Rate (0, 5, 12, 18, 28).'
    };

    // 7. Automatic GST Amount Calculation Formula (Column P)
    // Formula: IF(Taxable > 0, ROUND(Taxable * (Rate / 100), 2), "")
    ws.getCell(`P${r}`).value = {
      formula: `IF(N${r}>0, ROUND(N${r}*(IF(O${r}="",18,O${r})/100), 2), "")`
    };
    ws.getCell(`P${r}`).numFmt = '₹#,##0.00';

    // 8. Automatic Total Amount Calculation Formula (Column Q)
    // Formula: IF(Taxable > 0, ROUND(Taxable + GST_Amount, 2), "")
    ws.getCell(`Q${r}`).value = {
      formula: `IF(N${r}>0, ROUND(N${r}+P${r}, 2), "")`
    };
    ws.getCell(`Q${r}`).numFmt = '₹#,##0.00';

    // 9. Status Dropdown (Column R)
    ws.getCell(`R${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Dropdown_Lists'!$D$2:$D$${statusValues.length + 1}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Status',
      error: 'Please select PAID, PENDING, or DRAFT.'
    };

    // Number formats
    ws.getCell(`N${r}`).numFmt = '₹#,##0.00';
    ws.getCell(`S${r}`).numFmt = '₹#,##0.00';
  }

  // Generate and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `Invoices_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Generate and download the Clean Clients Excel Template
 * - Dropdown for States (all 36 States/UTs)
 * - Complete columns including Address, City, State, PIN Code, GSTIN, PAN
 */
export async function downloadClientsTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LEDGR Multi-Entity Invoicing Portal';
  workbook.created = new Date();

  // 1. Reference Data Sheet (for State Dropdowns)
  const refSheet = workbook.addWorksheet('State_List', { state: 'visible' });
  refSheet.columns = [
    { header: 'State Code', key: 'code', width: 14 },
    { header: 'State / Union Territory Name', key: 'name', width: 34 }
  ];

  GST_STATES.forEach(s => {
    refSheet.addRow({ code: s.code, name: s.name });
  });

  refSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  refSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };

  // 2. Main Clients Data Sheet
  const ws = workbook.addWorksheet('Clients_Data', {
    views: [{ showGridLines: true }]
  });

  ws.columns = [
    { header: 'Business Name / Client Name *', key: 'businessName', width: 32 },
    { header: 'Contact Person', key: 'contactPerson', width: 24 },
    { header: 'Email ID', key: 'email', width: 28 },
    { header: 'Phone / Mobile', key: 'phone', width: 20 },
    { header: 'GSTIN (15 Digits)', key: 'gstin', width: 22 },
    { header: 'PAN (10 Digits)', key: 'pan', width: 18 },
    { header: 'Billing Address *', key: 'address', width: 36 },
    { header: 'City *', key: 'city', width: 20 },
    { header: 'State Name / Place of Supply *', key: 'stateName', width: 30 },
    { header: 'PIN Code', key: 'pinCode', width: 14 }
  ];

  // Header Styling
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Setup 100 blank rows with State Dropdown Validations
  const totalTemplateRows = 100;
  for (let r = 2; r <= totalTemplateRows + 1; r++) {
    // State Dropdown (Column I)
    ws.getCell(`I${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'State_List'!$B$2:$B$${GST_STATES.length + 1}`],
      showErrorMessage: true,
      errorTitle: 'Invalid State',
      error: 'Please select a valid Indian State or Union Territory from the dropdown.'
    };
  }

  // Generate and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `Clients_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}
