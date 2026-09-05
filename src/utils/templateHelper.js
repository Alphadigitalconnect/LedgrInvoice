import { formatINR } from '../data/constants';

export const DEFAULT_WHATSAPP_TEMPLATE = `TAX INVOICE NOTICE
From: {entityName}
To: {clientName}

Dear Team,

Please find the tax invoice details for services rendered:

• Invoice No: {invoiceNumber}
• Invoice Date: {invoiceDate}
• Due Date: {dueDate}
• Taxable Value: {taxableAmount}
• GST Amount: {gstAmount}
• Total Amount Payable: {grandTotal}
{tdsClause}
Payment Remittance Details:
• Bank: {bankName}
• Account: {accountNumber}
• IFSC: {ifsc}
• UPI ID: {upiId}

Kindly process the payment and share the UTR reference. Thank you for your business.

Issued via LEDGR
{entityName}
{entityPhone}`;

export const DEFAULT_EMAIL_SUBJECT_TEMPLATE = `Tax Invoice: {invoiceNumber} | {entityName} — {clientName}`;

export const DEFAULT_EMAIL_BODY_TEMPLATE = `Dear {clientName} Team,

Greetings from {entityName}.

Please find the details for Tax Invoice #{invoiceNumber} dated {invoiceDate} for professional services rendered.

--------------------------------------------------
INVOICE SUMMARY:
--------------------------------------------------
Invoice Number: {invoiceNumber}
Invoice Date:   {invoiceDate}
Due Date:       {dueDate}
Taxable Amount: {taxableAmount}
Total Tax:      {gstAmount}
Grand Total:    {grandTotal}
{tdsClause}
--------------------------------------------------
BANK REMITTANCE DETAILS (RTGS / NEFT / IMPS / UPI):
--------------------------------------------------
Beneficiary:    {entityName}
Bank Name:      {bankName}
Account Number: {accountNumber}
IFSC Code:      {ifsc}
UPI ID:         {upiId}

Kindly remit payment on or before the due date ({dueDate}) and reply with transaction reference.

Warm regards,
Accounts & Billing Department
{entityName}
{signatoryName}
{entityPhone}`;

export const AVAILABLE_TEMPLATE_TAGS = [
  { tag: '{clientName}', desc: 'Client / Company Name' },
  { tag: '{invoiceNumber}', desc: 'Invoice Number (e.g. INV/24-25/101)' },
  { tag: '{invoiceDate}', desc: 'Invoice Date' },
  { tag: '{dueDate}', desc: 'Payment Due Date' },
  { tag: '{grandTotal}', desc: 'Total Amount Payable (INR)' },
  { tag: '{taxableAmount}', desc: 'Taxable Subtotal' },
  { tag: '{gstAmount}', desc: 'Total GST Amount' },
  { tag: '{entityName}', desc: 'Your Entity Name' },
  { tag: '{bankName}', desc: 'Bank Name' },
  { tag: '{accountNumber}', desc: 'Bank Account Number' },
  { tag: '{ifsc}', desc: 'Bank IFSC Code' },
  { tag: '{upiId}', desc: 'UPI ID' },
  { tag: '{signatoryName}', desc: 'Signatory Name' },
  { tag: '{entityPhone}', desc: 'Entity Phone' },
  { tag: '{poNumber}', desc: 'Client PO Number' }
];

export function renderTemplate(template, invoice, entity, client) {
  if (!template) return '';
  if (!invoice) return template;

  const safeEntity = entity || {
    name: invoice.entityName || 'Business Entity',
    phone: '',
    bankName: 'Bank',
    bankAccountNo: '',
    bankIfsc: '',
    upiId: ''
  };

  const clientName = invoice.clientName || client?.name || 'Valued Client';
  const invoiceNumber = invoice.invoiceNumber || 'INV/001';
  const invoiceDate = invoice.invoiceDate || '';
  const dueDate = invoice.dueDate || '';
  const grandTotal = formatINR(invoice.grandTotal || 0);
  const taxableAmount = formatINR(invoice.taxableTotal || 0);
  const gstAmount = formatINR(invoice.totalTaxAmount || 0);
  const entityName = safeEntity.tradeName || safeEntity.name || 'Business Entity';
  const bankName = safeEntity.bankName || 'Bank';
  const accountNumber = safeEntity.bankAccountNo || '';
  const ifsc = safeEntity.bankIfsc || '';
  const upiId = safeEntity.upiId || '';
  const signatoryName = invoice.signatoryName || safeEntity.signatory?.name || '';
  const entityPhone = safeEntity.phone ? `Phone: ${safeEntity.phone}` : '';
  const poNumber = invoice.poNumber ? `PO Ref: ${invoice.poNumber}` : '';

  let tdsClause = '';
  if (invoice.tdsRate > 0) {
    tdsClause = `• Estimated Net after TDS (${invoice.tdsRate}%): ${formatINR(invoice.netReceivable || invoice.grandTotal)}\n• Estimated TDS Amount: ${formatINR(invoice.tdsAmount || 0)}`;
  }

  let result = template;
  result = result.replace(/{clientName}/g, clientName);
  result = result.replace(/{invoiceNumber}/g, invoiceNumber);
  result = result.replace(/{invoiceDate}/g, invoiceDate);
  result = result.replace(/{dueDate}/g, dueDate);
  result = result.replace(/{grandTotal}/g, grandTotal);
  result = result.replace(/{taxableAmount}/g, taxableAmount);
  result = result.replace(/{gstAmount}/g, gstAmount);
  result = result.replace(/{entityName}/g, entityName);
  result = result.replace(/{bankName}/g, bankName);
  result = result.replace(/{accountNumber}/g, accountNumber);
  result = result.replace(/{ifsc}/g, ifsc);
  result = result.replace(/{upiId}/g, upiId);
  result = result.replace(/{signatoryName}/g, signatoryName);
  result = result.replace(/{entityPhone}/g, entityPhone);
  result = result.replace(/{poNumber}/g, poNumber);
  result = result.replace(/{tdsClause}/g, tdsClause);

  return result;
}
