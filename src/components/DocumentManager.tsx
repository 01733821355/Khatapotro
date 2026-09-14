import { useState, useRef, type DragEvent, type ChangeEvent, type FormEvent } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  ExternalLink, 
  Trash2, 
  Eye, 
  Filter, 
  Paperclip,
  CheckCircle2,
  FileCheck,
  Building,
  CreditCard,
  FileCode,
  Calendar,
  X,
  Download,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import type { CloudDocument, DocumentCategory, Language } from '../types';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { VoiceInputButton } from './VoiceInputButton';

interface DocumentManagerProps {
  documents: CloudDocument[];
  onUploadDocument: (
    file: File,
    title: string,
    category: DocumentCategory,
    amount?: number,
    notes?: string
  ) => Promise<void>;
  onDeleteDocument: (docId: string) => void;
  isUploading: boolean;
  language: Language;
}

const CATEGORIES: DocumentCategory[] = [
  'Receipt',
  'Voucher',
  'Invoice',
  'Memo',
  'Trade License',
  'Bank Statement',
  'Tax/TIN',
  'Contract',
  'Other',
];

export const DocumentManager = ({
  documents,
  onUploadDocument,
  onDeleteDocument,
  isUploading,
  language,
}: DocumentManagerProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<CloudDocument | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [shareDoc, setShareDoc] = useState<CloudDocument | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('Receipt');
  const [docAmount, setDocAmount] = useState<number | undefined>(undefined);
  const [docNotes, setDocNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    title: language === 'bn' ? 'ক্লাউড ডকুমেন্ট ম্যানেজমেন্ট ও ভল্ট' : 'Cloud Document Management & Vault',
    subtitle: language === 'bn' ? 'রিসিপ্ট, ভাউচার ফাইল ডাউনলোড, প্রিভিউ, সেন্ড ও গুগল ড্রাইভে সুরক্ষিত হিসাব' : 'Receipts & vouchers preview, download, send & cloud sync',
    uploadBtn: language === 'bn' ? '+ নতুন ডকুমেন্ট আপলোড' : '+ Upload Document',
    search: language === 'bn' ? 'ডকুমেন্ট বা ভাউচার খুঁজুন...' : 'Search documents or vouchers...',
    allCategories: language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories',
    noDocs: language === 'bn' ? 'কোন ডকুমেন্ট পাওয়া যায়নি' : 'No documents found',
    dragDropText: language === 'bn' ? 'ফাইল টেনে এনে এখানে ছাড়ুন অথবা ক্লিক করে বেছে নিন' : 'Drag and drop file here, or click to browse',
    formatsAllowed: language === 'bn' ? 'পিডিএফ, ছবি (JPG, PNG, WEBP) অনুমোদিত' : 'PDF, Images (JPG, PNG, WEBP) supported',
    openDrive: language === 'bn' ? 'গুগল ড্রাইভে দেখুন' : 'Open in Google Drive',
    confirmDelete: language === 'bn' ? 'আপনি কি নিশ্চিত এই ডকুমেন্ট মুছে ফেলতে চান?' : 'Are you sure you want to delete this document?',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
    uploading: language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...',
    download: language === 'bn' ? 'ডাউনলোড' : 'Download',
    send: language === 'bn' ? 'সেন্ড / শেয়ার' : 'Send / Share',
    preview: language === 'bn' ? 'প্রিভিউ' : 'Preview',
    sendViaWhatsApp: language === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send via WhatsApp',
    deviceShare: language === 'bn' ? 'অন্য অ্যাপে শেয়ার করুন' : 'Share to apps',
    copyInfo: language === 'bn' ? 'তথ্য ও লিংক কপি' : 'Copy info & link',
    copied: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmitUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    await onUploadDocument(
      selectedFile,
      docTitle || selectedFile.name,
      docCategory,
      docAmount,
      docNotes
    );

    // Reset form
    setSelectedFile(null);
    setDocTitle('');
    setDocCategory('Receipt');
    setDocAmount(undefined);
    setDocNotes('');
    setShowUploadModal(false);
  };

  // Direct Download Handler
  const handleDownload = (doc: CloudDocument) => {
    if (doc.fileDataUrl) {
      const a = document.createElement('a');
      a.href = doc.fileDataUrl;
      a.download = doc.fileName || `${doc.title || 'document'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (doc.driveDownloadLink) {
      window.open(doc.driveDownloadLink, '_blank');
      return;
    }
    if (doc.driveViewLink) {
      window.open(doc.driveViewLink, '_blank');
      return;
    }
    alert(language === 'bn' ? 'ডাউনলোড লিংক পাওয়া যায়নি' : 'Download link not found');
  };

  // WhatsApp Send
  const handleSendWhatsApp = (doc: CloudDocument) => {
    const text = `📄 *${doc.title}* (${doc.docCategory})\n` +
      (doc.amount ? `💰 টাকার পরিমাণ: ৳${doc.amount}\n` : '') +
      `📅 তারিখ: ${new Date(doc.uploadDate).toLocaleDateString()}\n` +
      `📎 ফাইল: ${doc.fileName}\n` +
      (doc.notes ? `📝 নোট: ${doc.notes}\n` : '') +
      (doc.driveViewLink ? `🔗 ড্রাইভ লিংক: ${doc.driveViewLink}\n` : '') +
      `— খাতাপত্র ক্লাউড ভল্ট`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Native Device Share
  const handleDeviceShare = async (doc: CloudDocument) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.title,
          text: `📄 ${doc.title} (${doc.docCategory})${doc.amount ? ` - ৳${doc.amount}` : ''}\n${doc.notes || ''}`,
          url: doc.driveViewLink || window.location.href,
        });
      } catch {
        // Dismissed
      }
    } else {
      handleCopyInfo(doc);
    }
  };

  // Copy Info
  const handleCopyInfo = (doc: CloudDocument) => {
    const text = `📄 ${doc.title} (${doc.docCategory})\n` +
      (doc.amount ? `টাকার পরিমাণ: ৳${doc.amount}\n` : '') +
      `ফাইল: ${doc.fileName}\n` +
      (doc.notes ? `নোট: ${doc.notes}\n` : '') +
      (doc.driveViewLink ? `লিংক: ${doc.driveViewLink}` : '');
    
    navigator.clipboard.writeText(text);
    setCopiedDocId(doc.id);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  const isImageDoc = (doc: CloudDocument) => {
    return (
      doc.fileType?.startsWith('image/') ||
      doc.fileDataUrl?.startsWith('data:image') ||
      Boolean(doc.fileName?.match(/\.(jpe?g|png|webp|gif|svg)$/i))
    );
  };

  const isPdfDoc = (doc: CloudDocument) => {
    return doc.fileType === 'application/pdf' || Boolean(doc.fileName?.match(/\.pdf$/i));
  };

  const filteredDocs = documents
    .filter((doc) => {
      if (selectedCategory !== 'all' && doc.docCategory !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.docCategory.toLowerCase().includes(q) ||
        (doc.notes && doc.notes.toLowerCase().includes(q))
      );
    });

  const getDocIcon = (category: DocumentCategory) => {
    switch (category) {
      case 'Trade License':
      case 'Contract':
        return <Building className="w-5 h-5 text-indigo-600" />;
      case 'Invoice':
      case 'Memo':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'Bank Statement':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'Tax/TIN':
        return <FileCode className="w-5 h-5 text-amber-600" />;
      case 'Receipt':
      case 'Voucher':
      default:
        return <FileText className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <section className="space-y-5 mb-8">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>{t.title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t.uploadBtn}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceInputButton
              inputType="search"
              contextLabel="ডকুমেন্ট অনুসন্ধান"
              onTranscript={(val) => setSearch(val)}
              size="xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
          >
            <option value="all">{t.allCategories}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            {t.noDocs}
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Category Badge & Date */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.docCategory}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatRelativeDate(doc.uploadDate, language)}
                  </span>
                </div>

                {/* Title & Icon / Thumbnail */}
                <div className="flex items-start gap-3">
                  {isImageDoc(doc) && (doc.fileDataUrl || doc.driveFileId) ? (
                    <div
                      onClick={() => setPreviewDoc(doc)}
                      className="w-13 h-13 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative group/thumb shadow-xs bg-slate-100"
                      title={t.preview}
                    >
                      <img
                        src={doc.fileDataUrl || `https://drive.google.com/thumbnail?id=${doc.driveFileId}&sz=w200`}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreviewDoc(doc)}
                      className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-100 transition-colors"
                      title={t.preview}
                    >
                      {getDocIcon(doc.docCategory)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => setPreviewDoc(doc)}
                      className="font-bold text-sm text-slate-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                      {doc.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                      {doc.driveFileId ? (
                        <span className="ml-1.5 text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Drive
                        </span>
                      ) : (
                        <span className="ml-1.5 text-blue-600 font-semibold">Vault</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Amount / Notes if present */}
                {doc.amount ? (
                  <div className="mt-3 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium">
                      {language === 'bn' ? 'সংযুক্ত পরিমাণ' : 'Associated Amount'}:
                    </span>
                    <span className="font-bold text-emerald-900">
                      {formatCurrency(doc.amount, language)}
                    </span>
                  </div>
                ) : null}

                {doc.notes && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                    {doc.notes}
                  </p>
                )}
              </div>

              {/* Action Toolbar with Preview, Download, Send, Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title={t.preview}
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t.preview}</span>
                  </button>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title={t.download}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.download}</span>
                  </button>

                  {/* Send / Share Button */}
                  <button
                    type="button"
                    onClick={() => setShareDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    title={t.send}
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.send}</span>
                  </button>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => setDeleteDocId(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg text-slate-900">
                {t.uploadBtn}
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[240px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-9 h-9 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {t.dragDropText}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {t.formatsAllowed}
                    </p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'bn' ? 'ডকুমেন্টের শিরোনাম *' : 'Document Title *'}
                  </label>
                  <VoiceInputButton
                    inputType="text"
                    contextLabel="ডকুমেন্টের শিরোনাম"
                    onTranscript={(val) => setDocTitle(val)}
                    size="xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মেঘনা গ্রুপ সেপ্টেম্বর মেমো"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInputButton
                      inputType="text"
                      contextLabel="শিরোনাম"
                      onTranscript={(val) => setDocTitle(val)}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Associated Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'bn' ? 'সংযুক্ত টাকার পরিমাণ (যদি থাকে)' : 'Associated Amount (৳) (Optional)'}
                  </label>
                  <VoiceInputButton
                    inputType="currency"
                    contextLabel="টাকার পরিমাণ"
                    onTranscript={(val) => {
                      const num = parseFloat(val);
                      if (!isNaN(num)) setDocAmount(num);
                    }}
                    size="xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="যেমন: ৭৪১০"
                    value={docAmount || ''}
                    onChange={(e) => setDocAmount(parseFloat(e.target.value) || undefined)}
                    className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInputButton
                      inputType="currency"
                      contextLabel="টাকার পরিমাণ"
                      onTranscript={(val) => {
                        const num = parseFloat(val);
                        if (!isNaN(num)) setDocAmount(num);
                      }}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'bn' ? 'অতিরিক্ত বিবরণ' : 'Notes'}
                  </label>
                  <VoiceInputButton
                    inputType="text"
                    contextLabel="অতিরিক্ত বিবরণ ও মন্তব্য"
                    currentValue={docNotes}
                    appendMode={true}
                    onTranscript={(val) => setDocNotes(val)}
                    size="xs"
                  />
                </div>
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="নোট বা চালান নম্বর..."
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-3">
                    <VoiceInputButton
                      inputType="text"
                      contextLabel="বিবরণ"
                      currentValue={docNotes}
                      appendMode={true}
                      onTranscript={(val) => setDocNotes(val)}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isUploading ? t.uploading : t.uploadBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                    {previewDoc.docCategory}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(previewDoc.uploadDate).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-base sm:text-lg text-slate-900 truncate mt-1">
                  {previewDoc.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content Viewport */}
            <div className="flex-1 overflow-y-auto py-4">
              {isImageDoc(previewDoc) && (previewDoc.fileDataUrl || previewDoc.driveFileId || previewDoc.driveViewLink) ? (
                <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 flex items-center justify-center min-h-[240px] max-h-[48vh] overflow-hidden">
                  <img
                    src={
                      previewDoc.fileDataUrl ||
                      (previewDoc.driveFileId ? `https://drive.google.com/thumbnail?id=${previewDoc.driveFileId}&sz=w1000` : previewDoc.driveViewLink)
                    }
                    alt={previewDoc.title}
                    className="max-h-[46vh] w-auto object-contain rounded-xl shadow-xs"
                    onError={(e) => {
                      // Fallback if drive thumbnail blocked
                      if (previewDoc.driveViewLink && e.currentTarget.src !== previewDoc.driveViewLink) {
                        e.currentTarget.src = previewDoc.driveViewLink;
                      }
                    }}
                  />
                </div>
              ) : isPdfDoc(previewDoc) && (previewDoc.fileDataUrl || previewDoc.driveViewLink) ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden h-[46vh]">
                  <iframe
                    src={
                      previewDoc.fileDataUrl ||
                      (previewDoc.driveViewLink ? previewDoc.driveViewLink.replace(/\/view.*$/, '/preview') : '')
                    }
                    title={previewDoc.title}
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl text-center border border-slate-200">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-slate-800">{previewDoc.fileName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(previewDoc.fileSize / 1024).toFixed(1)} KB • {previewDoc.docCategory}
                  </p>
                </div>
              )}

              {/* Metadata Details */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ফাইল নাম</span>
                  <span className="font-medium text-slate-700 truncate block mt-0.5" title={previewDoc.fileName}>
                    {previewDoc.fileName}
                  </span>
                </div>
                {previewDoc.amount ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-emerald-600 block text-[10px] uppercase font-bold">টাকার পরিমাণ</span>
                    <span className="font-bold text-emerald-800 block mt-0.5">
                      {formatCurrency(previewDoc.amount, language)}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">ফাইল সাইজ</span>
                    <span className="font-medium text-slate-700 block mt-0.5">
                      {(previewDoc.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">স্টোরেজ অবস্থান</span>
                  <span className="font-medium text-slate-700 block mt-0.5">
                    {previewDoc.driveFileId ? 'গুগল ড্রাইভ ও ভল্ট' : 'লোকাল ভল্ট'}
                  </span>
                </div>
              </div>

              {previewDoc.notes && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                  <span className="font-bold block text-[11px] mb-0.5">নোট:</span>
                  {previewDoc.notes}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Download */}
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.download}</span>
                </button>

                {/* Send / WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.sendViaWhatsApp}</span>
                </button>

                {/* Device Share */}
                <button
                  type="button"
                  onClick={() => handleDeviceShare(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t.deviceShare}</span>
                </button>
              </div>

              {previewDoc.driveViewLink && (
                <a
                  href={previewDoc.driveViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t.openDrive}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHARE / SEND MODAL */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>{t.send}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShareDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 font-semibold">
              {shareDoc.title}
            </p>
            <p className="text-[11px] text-slate-400 mb-4">
              {shareDoc.fileName} • {shareDoc.docCategory}
            </p>

            <div className="space-y-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsApp(shareDoc);
                  setShareDoc(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">{t.sendViaWhatsApp}</span>
                  <span className="text-[10px] text-emerald-700 font-normal">হোয়াটসঅ্যাপে বিবরণসহ পাঠান</span>
                </div>
              </button>

              {/* Download directly */}
              <button
                type="button"
                onClick={() => {
                  handleDownload(shareDoc);
                  setShareDoc(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">{t.download}</span>
                  <span className="text-[10px] text-blue-700 font-normal">ডিভাইসে ফাইল সরাসরি সেভ করুন</span>
                </div>
              </button>

              {/* Device Share */}
              <button
                type="button"
                onClick={() => {
                  handleDeviceShare(shareDoc);
                  setShareDoc(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">{t.deviceShare}</span>
                  <span className="text-[10px] text-slate-500 font-normal">অন্যান্য অ্যাপ ও শেয়ারিং অপশন</span>
                </div>
              </button>

              {/* Copy Info */}
              <button
                type="button"
                onClick={() => handleCopyInfo(shareDoc)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  {copiedDocId === shareDoc.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="block">
                    {copiedDocId === shareDoc.id ? t.copied : t.copyInfo}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">ক্লিপবোর্ডে তথ্য কপি করুন</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR DELETING DOCUMENT (MANDATORY Safety Rule) */}
      {deleteDocId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-900 text-base mb-2">
              {t.confirmDelete}
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              {language === 'bn'
                ? 'এই ডকুমেন্ট মুছে ফেললে পরবর্তী সিঙ্কে গুগল শিটের রেকর্ড থেকেও সরানো হবে।'
                : 'Deleting this document removes it locally and logs the change to Google Sheets on the next sync.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteDocId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(deleteDocId);
                  setDeleteDocId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
