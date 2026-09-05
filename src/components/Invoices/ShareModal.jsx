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
  ExternalLink
} from 'lucide-react';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, 
  DEFAULT_EMAIL_SUBJECT_TEMPLATE, 
  DEFAULT_EMAIL_BODY_TEMPLATE, 
  renderTemplate 
} from '../../utils/templateHelper';

export default function ShareModal({ invoice, entity, client, onClose, onNavigateToSettings }) {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(client?.whatsapp || client?.phone || '');
  const [customEmail, setCustomEmail] = useState(client?.email || '');

  // Pre-rendered message content from entity templates
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
  const [sharedSuccess, setSharedSuccess] = useState(false);

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

  // Native Web Share API for Mobile devices
  const handleNativeMobileShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tax Invoice ${invoice.invoiceNumber}`,
          text: activeTab === 'email' ? `${emailSubject}\n\n${emailBody}` : whatsappMessage,
        });
        setSharedSuccess(true);
        setTimeout(() => setSharedSuccess(false), 3000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyText(whatsappMessage);
        }
      }
    } else {
      handleCopyText(whatsappMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-white px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Share Invoice</h2>
              <p className="text-[11px] text-slate-500 font-mono">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={14} />
            <span>WhatsApp / SMS</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail size={14} />
            <span>Email</span>
          </button>
          {typeof navigator !== 'undefined' && !!navigator.share && (
            <button
              onClick={() => setActiveTab('native')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'native'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Smartphone size={14} />
              <span>Mobile Share</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 text-xs bg-white">
          {/* WhatsApp / SMS Tab */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Recipient Phone Number (with country code)</label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="919876543210"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 block">Message Content (Pre-defined template)</label>
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
                  rows={8}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsappMessage)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {typeof navigator !== 'undefined' && !!navigator.share && (
                    <button
                      type="button"
                      onClick={handleNativeMobileShare}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition cursor-pointer"
                    >
                      <Smartphone size={14} />
                      <span>App Share</span>
                    </button>
                  )}

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition cursor-pointer shadow-2xs"
                  >
                    <Send size={13} />
                    <span>Send via WhatsApp</span>
                  </a>
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
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 block">Email Body</label>
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
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(`${emailSubject}\n\n${emailBody}`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Email Text'}</span>
                </button>

                <a
                  href={mailtoUrl}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition cursor-pointer shadow-2xs"
                >
                  <Mail size={13} />
                  <span>Open Mail App</span>
                </a>
              </div>
            </div>
          )}

          {/* Native Mobile Share Tab */}
          {activeTab === 'native' && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Mobile Share Sheet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tap below to open your phone's native share drawer to share invoice summary directly via WhatsApp, Telegram, Gmail, SMS, or AirDrop.
                </p>
              </div>

              <button
                type="button"
                onClick={handleNativeMobileShare}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <Share2 size={15} />
                <span>Open Device Share Menu</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
