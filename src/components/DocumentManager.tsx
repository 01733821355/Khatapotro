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
  X
} from 'lucide-react';
import type { CloudDocument, DocumentCategory, Language } from '../types';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';

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
    subtitle: language === 'bn' ? 'গুগল ড্রাইভে সুরক্ষিত আপলোড ও গুগল শিটে হিসাব সংরক্ষণ' : 'Securely stored in Google Drive & logged in Google Sheets',
    uploadBtn: language === 'bn' ? '+ নতুন ডকুমেন্ট আপলোড' : '+ Upload Document',
    search: language === 'bn' ? 'ডকুমেন্ট বা ভাউচার খুঁজুন...' : 'Search documents or vouchers...',
    allCategories: language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories',
    noDocs: language === 'bn' ? 'কোন ডকুমেন্ট পাওয়া যায়নি' : 'No documents found',
    dragDropText: language === 'bn' ? 'ফাইল টেনে এনে এখানে ছাড়ুন অথবা ক্লিক করে বেছে নিন' : 'Drag and drop file here, or click to browse',
    formatsAllowed: language === 'bn' ? 'পিডিএফ, ছবি (JPG, PNG) অনুমোদিত' : 'PDF, Images (JPG, PNG, WEBP) supported',
    openDrive: language === 'bn' ? 'গুগল ড্রাইভে দেখুন' : 'Open in Google Drive',
    confirmDelete: language === 'bn' ? 'আপনি কি নিশ্চিত এই ডকুমেন্ট মুছে ফেলতে চান?' : 'Are you sure you want to delete this document?',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
    uploading: language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...',
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
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
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
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
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

                {/* Title & Icon */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {getDocIcon(doc.docCategory)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                      {doc.fileName}
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

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {doc.driveViewLink ? (
                    <a
                      href={doc.driveViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.openDrive}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'প্রিভিউ দেখুন' : 'Preview'}</span>
                    </button>
                  )}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'ডকুমেন্টের শিরোনাম *' : 'Document Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মেঘনা গ্রুপ সেপ্টেম্বর মেমো"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'সংযুক্ত টাকার পরিমাণ (যদি থাকে)' : 'Associated Amount (৳) (Optional)'}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="যেমন: ৭৪১০"
                  value={docAmount || ''}
                  onChange={(e) => setDocAmount(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'অতিরিক্ত বিবরণ' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  placeholder="নোট বা চালান নম্বর..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-base text-slate-900 truncate">
                {previewDoc.title}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 mb-4">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-800">{previewDoc.fileName}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(previewDoc.fileSize / 1024).toFixed(1)} KB • {previewDoc.docCategory}
              </p>
            </div>

            {previewDoc.driveViewLink && (
              <a
                href={previewDoc.driveViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{t.openDrive}</span>
              </a>
            )}
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
