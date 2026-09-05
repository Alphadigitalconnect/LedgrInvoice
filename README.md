# LEDGR — Multi-Entity Invoicing & Entity Portal

A professional, minimal, and GST-compliant Multi-Entity Tax Invoicing web application designed for consultants, agencies, chartered accountants, and enterprises.

---

## Key Features

- **Multi-Entity Architecture**: Manage multiple supplier companies, firms, and proprietorships under a single portal with dedicated GSTIN, PAN, bank accounts, UPI IDs, invoice numbering series, and official logos.
- **Statutory GST & TDS Compliance**:
  - Auto-detection of Intra-State (CGST + SGST) vs Inter-State (IGST) supply from 2-digit GST state codes.
  - SAC/HSN code presets and customizable tax rates (0%, 5%, 12%, 18%, 28%).
  - Reverse Charge Mechanism (RCM) & B2B / B2C tax flags.
  - Section 194J / 194C TDS estimation and net receivable calculation.
  - Auto-conversion of grand totals to Indian Rupees in words.
- **Entity Logo Branding**:
  - Upload custom PNG/JPEG/SVG business logos per entity.
  - Automatic rendering on the official Tax Invoice copies, print sheets, and vector-crisp PDF downloads.
- **Mobile-Optimized Responsive Experience**:
  - Slide-out mobile drawer navigation with hamburger trigger.
  - Fixed bottom navigation bar for effortless thumb reach on mobile devices.
  - Horizontal scrolling tables and stacked input cards tailored for small screens.
- **1-Tap Instant Invoice Sharing**:
  - **WhatsApp & SMS**: Pre-formatted billing summary with payment links and 1-tap WhatsApp redirect.
  - **Email**: Pre-filled invoice subject and detailed body message with `mailto:` link.
  - **Direct Mobile Share**: Web Share API (`navigator.share`) for sharing directly to any mobile app (WhatsApp, Telegram, Gmail, Messages, AirDrop).
  - **Customizable Pre-Defined Templates**: Edit WhatsApp and Email message formats with dynamic placeholders in Settings.
- **Quotes & Proposals Pipeline**: Track service proposals, scopes, and retainers that convert into tax invoices in 1 click.
- **Offline & Local Storage**: 100% private and persistent data storage via browser localStorage with JSON Backup Export & Import capabilities.
- **Admin Password Gate**: Simple security layer to protect admin sessions.

---

## Tech Stack

- **Framework**: React 18, Vite
- **Styling**: TailwindCSS & Vanilla CSS
- **Icons**: Lucide React
- **PDF Generation**: html2pdf.js

---

## Getting Started Locally

```bash
# Clone repository
git clone <your-repo-url>
cd client-invoice-hub

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

---

## License
MIT
