// Indian States and Union Territories with 2-digit GST State Codes
export const GST_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory / Special Economic Zone" },
  { code: "99", name: "Centre Jurisdiction / Export" }
];

// Popular SAC Codes (Services Accounting Code) & HSN Codes
export const COMMON_SAC_HSN_CODES = [
  { code: "998311", type: "SAC", desc: "Management consulting and management services", defaultGst: 18 },
  { code: "998313", type: "SAC", desc: "Information technology (IT) design and development services", defaultGst: 18 },
  { code: "998314", type: "SAC", desc: "Information technology (IT) infrastructure and network management", defaultGst: 18 },
  { code: "998315", type: "SAC", desc: "Hosting and information technology (IT) infrastructure provisioning", defaultGst: 18 },
  { code: "998319", type: "SAC", desc: "Other information technology services n.e.c.", defaultGst: 18 },
  { code: "998211", type: "SAC", desc: "Legal advisory and representation services concerning criminal/civil/corporate law", defaultGst: 18 },
  { code: "998222", type: "SAC", desc: "Accounting, auditing and bookkeeping services", defaultGst: 18 },
  { code: "998231", type: "SAC", desc: "Tax advisory and tax compliance services", defaultGst: 18 },
  { code: "998361", type: "SAC", desc: "Advertising and creative marketing campaign services", defaultGst: 18 },
  { code: "998399", type: "SAC", desc: "Other professional, scientific and technical services n.e.c.", defaultGst: 18 },
  { code: "998713", type: "SAC", desc: "Maintenance and repair of computers and peripheral equipment", defaultGst: 18 },
  { code: "999293", type: "SAC", desc: "Commercial training and coaching services", defaultGst: 18 },
  { code: "847130", type: "HSN", desc: "Laptops, computers and portable automatic data processing machines", defaultGst: 18 },
  { code: "852352", type: "HSN", desc: "Smart cards, proximity cards and cryptographic security tokens", defaultGst: 18 },
  { code: "490110", type: "HSN", desc: "Printed books, brochures, leaflets and similar printed matter", defaultGst: 5 }
];

// Common Units of Measurement
export const UNITS_OF_MEASURE = [
  "Nos",
  "Hours",
  "Days",
  "Months",
  "Units",
  "Project",
  "Retainer",
  "Pcs",
  "Sets",
  "Sessions",
  "Words"
];

// GST Rates
export const GST_RATES = [
  { label: "0% (Exempt / Nil Rated)", value: 0 },
  { label: "5%", value: 5 },
  { label: "12%", value: 12 },
  { label: "18% (Standard Services)", value: 18 },
  { label: "28% (Luxury / High Slab)", value: 28 }
];

// TDS Sections under Income Tax Act (India)
export const TDS_SECTIONS = [
  { id: "NONE", label: "No TDS applicable (0%)", rate: 0, description: "Client pays full invoice amount" },
  { id: "194J_10", label: "Section 194J — Professional Fees (10%)", rate: 10, description: "Legal, CA, Management Consulting, Advisory" },
  { id: "194J_2", label: "Section 194J — Technical Services / Call Centre (2%)", rate: 2, description: "Software Dev, IT support, Technical testing" },
  { id: "194C_1", label: "Section 194C — Contractor / Individual / HUF (1%)", rate: 1, description: "Works contract, advertisement, supply of labour" },
  { id: "194C_2", label: "Section 194C — Contractor / Company / Firm (2%)", rate: 2, description: "Corporate contracts, agencies" },
  { id: "194Q", label: "Section 194Q — Purchase of Goods (0.1%)", rate: 0.1, description: "TDS on purchase of goods over 50 Lakhs" },
  { id: "CUSTOM", label: "Custom TDS Rate", rate: 0, description: "User specified TDS percentage" }
];

// Engagement Pricing Models
export const PRICING_MODELS = [
  { id: "FIXED", label: "Fixed Project Fee" },
  { id: "MONTHLY_RETAINER", label: "Monthly Retainer" },
  { id: "QUARTERLY_RETAINER", label: "Quarterly Retainer" },
  { id: "HOURLY", label: "Hourly Rate" },
  { id: "DAILY", label: "Daily Rate" },
  { id: "MILESTONE", label: "Milestone-Based" },
  { id: "SUCCESS_FEE", label: "Success / Contingency Fee" }
];

// Convert Number to Indian Rupees in Words
export function numberToWordsIndian(num) {
  if (num === null || num === undefined || isNaN(num)) return "";
  const n = Math.round(Number(num));
  if (n === 0) return "Zero Rupees Only";
  if (n < 0) return "Minus " + numberToWordsIndian(-n);

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(val) {
    if (val === 0) return "";
    if (val < 20) return units[val];
    const t = Math.floor(val / 10);
    const u = val % 10;
    return tens[t] + (u > 0 ? " " + units[u] : "");
  }

  function convertThreeDigits(val) {
    const h = Math.floor(val / 100);
    const r = val % 100;
    let str = "";
    if (h > 0) {
      str += units[h] + " Hundred";
      if (r > 0) str += " and ";
    }
    if (r > 0) {
      str += convertTwoDigits(r);
    }
    return str;
  }

  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundredPart = remainder % 1000;

  let words = [];
  if (crore > 0) {
    words.push(convertThreeDigits(crore) + " Crore");
  }
  if (lakh > 0) {
    words.push(convertThreeDigits(lakh) + " Lakh");
  }
  if (thousand > 0) {
    words.push(convertThreeDigits(thousand) + " Thousand");
  }
  if (hundredPart > 0) {
    words.push(convertThreeDigits(hundredPart));
  }

  return "Rupees " + words.join(" ") + " Only";
}

// Format Currency in Indian Format (₹ 1,50,000.00)
export function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(val);
}

// Extract State Code from GSTIN (first 2 digits)
export function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.substring(0, 2);
  return GST_STATES.find(s => s.code === code) || null;
}

// Validate Indian GSTIN (15 chars alphanumeric)
export function validateGSTIN(gstin) {
  if (!gstin) return { valid: false, message: "GSTIN is required" };
  const cleaned = gstin.trim().toUpperCase();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (cleaned.length !== 15) {
    return { valid: false, message: "GSTIN must be exactly 15 alphanumeric characters" };
  }
  if (!gstRegex.test(cleaned)) {
    return { valid: false, message: "Invalid GSTIN format (e.g. 36AAAFC1234D1Z5)" };
  }
  const stateCode = cleaned.substring(0, 2);
  const stateObj = GST_STATES.find(s => s.code === stateCode);
  if (!stateObj) {
    return { valid: false, message: `Invalid State Code prefix (${stateCode})` };
  }
  return { valid: true, state: stateObj };
}
