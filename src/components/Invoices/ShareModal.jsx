import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  Send,
  Smartphone,
  Sliders,
  Download,
  FileText,
  Paperclip
} from 'lucide-react';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, 
  DEFAULT_EMAIL_SUBJECT_TEMPLATE, 
  DEFAULT_EMAIL_BODY_TEMPLATE, 
  renderTemplate 
} from '../../utils/templateHelper';
import html2pdf from 'html2pdf.js';

export default function ShareModal({ invoice, entity, client, onClose, onNavigateToSettings }) {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(client?.whatsapp || client?.phone || '');
  const [customEmail, setCustomEmail] = useState(client?.email || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  // Pre-rendered message content
  const initialWhatsappMsg = renderTemplate(
    entity?.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE,
    invoice,
    entity,
    client
  );

  const initialEmailSubject = renderTemplate(
    entity?.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE,
    invoice,
    entity,
    client
  );

  const initialEmailBody = renderTemplate(
    entity?.emailBodyTemplate || DEFAULT_EMAIL_BODY_TEMPLATE,
    invoice,
    entity,
    client
  );

  const [whatsappMessage, setWhatsappMessage] = useState(initialWhatsappMsg);
  const [emailSubject, setEmailSubject] = useState(initialEmailSubject);
  const [emailBody, setEmailBody] = useState(initialEmailBody);

  useEffect(() => {
    setWhatsappMessage(renderTemplate(entity?.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE, invoice, entity, client));
    setEmailSubject(renderTemplate(entity?.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE, invoice, entity, client));
    setEmailBody(renderTemplate(entity?.emailBodyTemplate || DEFAULT_EMAIL_BODY_TEMPLATE, invoice, entity, client));
  }, [invoice, entity, client]);

  if (!invoice) return null;

  const cleanPhone = customPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?${cleanPhone ? `phone=${cleanPhone}&` : ''}text=${encodeURIComponent(whatsappMessage)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(customEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper to trigger invoice PDF download
  const handleDownloadInvoicePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Find printable area in DOM if available
      const element = document.getElementById('invoice-printable-area');
      const sanitizedNumber = (invoice.invoiceNumber || 'INV').replace(/[\/\\?%*:|"<>]/g, '_');
      
      if (element) {
        const opt = {
          margin: [5, 5, 5, 5],
          filename: `${sanitizedNumber}_Tax_Invoice.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (e) {
      console.error('PDF error:', e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Native Mobile / Browser Share with PDF File Attachment
  const handleShareWithPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const sanitizedNumber = (invoice.invoiceNumber || 'INV').replace(/[\/\\?%*:|"<>]/g, '_');
      const element = document.getElementById('invoice-printable-area');

      if (element && navigator.share) {
        const opt = {
          margin: [5, 5, 5, 5],
          filename: `${sanitizedNumber}_Tax_Invoice.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const pdfFile = new File([pdfBlob], `${sanitizedNumber}_Tax_Invoice.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: `Tax Invoice ${invoice.invoiceNumber}`,
            text: activeTab === 'email' ? `${emailSubject}\n\n${emailBody}` : whatsappMessage,
            files: [pdfFile]
          });
          setSharedSuccess(true);
          setTimeout(() => setSharedSuccess(false), 3000);
          setIsGeneratingPdf(false);
          return;
        }
      }

      // Fallback: download PDF & trigger app URL
      await handleDownloadInvoicePdf();
      if (activeTab === 'whatsapp') {
        window.open(whatsappUrl, '_blank');
      } else {
        window.location.href = mailtoUrl;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleDownloadInvoicePdf();
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-white px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
              <Share2 size={16} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-900">Share Invoice & PDF Copy</h2>
              <p className="text-[11px] text-slate-500 font-mono">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* PDF Attachment Notice Banner */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2 text-xs text-slate-800">
            <FileText size={16} className="text-slate-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Official Invoice PDF Copy</span>
              <p className="text-[10px] text-slate-500">Ready to share or attach directly with your message</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadInvoicePdf}
            disabled={isGeneratingPdf}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1.5 flex-shrink-0"
          >
            {isGeneratingPdf ? (
              <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : pdfDownloaded ? (
              <>
                <Check size={13} className="text-emerald-700" />
                <span className="text-emerald-700">PDF Saved</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Save PDF Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare size={14} />
            <span>WhatsApp / SMS</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Mail size={14} />
            <span>Email</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 text-xs bg-white text-left">
          {/* WhatsApp / SMS Tab */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Recipient Phone Number (with Country Code)</label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 block">Message Content (Pre-filled with DD-MM-YYYY dates)</label>
                  {onNavigateToSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToSettings();
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders size={11} />
                      <span>Edit template in Settings</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={7}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsappMessage)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareWithPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>Share PDF & Open WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Recipient Email Address</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 block">Email Body Content</label>
                  {onNavigateToSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToSettings();
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders size={11} />
                      <span>Edit default template in Settings</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={7}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(`${emailSubject}\n\n${emailBody}`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Email Body'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareWithPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-2xs"
                  >
                    <Send size={13} />
                    <span>Share PDF & Open Email</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
