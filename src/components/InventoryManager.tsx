import { useState, useMemo, type FormEvent } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  History, 
  Boxes,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import type { InventoryItem, InventoryLog, Language, MovementType } from '../types';
import { formatCurrency, formatNumber, formatRelativeDate } from '../utils/formatters';

interface InventoryManagerProps {
  items: InventoryItem[];
  logs: InventoryLog[];
  onAddItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onUpdateStock: (
    itemId: string,
    type: MovementType,
    quantity: number,
    unitPrice: number,
    reason: string,
    reference?: string,
    syncToLedger?: boolean
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onSyncSheets: () => void;
  language: Language;
}

export const InventoryManager = ({
  items,
  logs,
  onAddItem,
  onUpdateStock,
  onDeleteItem,
  onSyncSheets,
  language,
}: InventoryManagerProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'logs'>('items');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockMoveItem, setStockMoveItem] = useState<{
    item: InventoryItem;
    type: 'stock_in' | 'stock_out' | 'sale';
  } | null>(null);

  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null);

  // Stock Movement Form state
  const [moveQuantity, setMoveQuantity] = useState<number>(1);
  const [moveUnitPrice, setMoveUnitPrice] = useState<number>(0);
  const [moveReason, setMoveReason] = useState('');
  const [moveReference, setMoveReference] = useState('');
  const [syncToLedger, setSyncToLedger] = useState(true);

  // New Item Form state
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('মুদি পণ্য');
  const [newItemUnit, setNewItemUnit] = useState<InventoryItem['unit']>('pcs');
  const [newItemCost, setNewItemCost] = useState<number>(0);
  const [newItemSell, setNewItemSell] = useState<number>(0);
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemAlert, setNewItemAlert] = useState<number>(5);
  const [newItemSupplier, setNewItemSupplier] = useState('');

  const t = {
    title: language === 'bn' ? 'রিয়েল-টাইম ইনভেন্টরি ট্র্যাকিং' : 'Real-time Inventory Tracking',
    subtitle: language === 'bn' ? 'স্টক লেভেল, ক্রয়-বিক্রয় এবং স্বয়ংক্রিয় অ্যালার্ট' : 'Stock levels, restock/sales, and automated alerts',
    allItems: language === 'bn' ? 'পণ্য তালিকা' : 'Products List',
    stockLogs: language === 'bn' ? 'স্টক হিস্ট্রি ও লগ' : 'Movement Logs',
    addItem: language === 'bn' ? '+ নতুন পণ্য যুক্ত করুন' : '+ Add Product',
    search: language === 'bn' ? 'পণ্য বা এসকেইউ খুঁজুন...' : 'Search product or SKU...',
    totalValuation: language === 'bn' ? 'মোট ইনভেন্টরি মূল্য' : 'Total Valuation',
    totalItems: language === 'bn' ? 'মোট আইটেম' : 'Total Items',
    lowStock: language === 'bn' ? 'কম স্টক অ্যালার্ট' : 'Low Stock Alerts',
    outOfStock: language === 'bn' ? 'আউট অব স্টক' : 'Out of Stock',
    stockIn: language === 'bn' ? 'স্টক ইন (ক্রয়)' : 'Stock In (Restock)',
    stockOut: language === 'bn' ? 'স্টক আউট (বিক্রয়)' : 'Stock Out (Sale)',
    inStock: language === 'bn' ? 'মজুদ আছে' : 'In Stock',
    confirmDelete: language === 'bn' ? 'আপনি কি নিশ্চিত এই পণ্য মুছে ফেলতে চান?' : 'Are you sure you want to delete this product?',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    save: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ['all', ...Array.from(set)];
  }, [items]);

  // Inventory stats
  const stats = useMemo(() => {
    let totalVal = 0;
    let lowCount = 0;
    let outCount = 0;
    items.forEach((item) => {
      totalVal += item.quantity * item.costPrice;
      if (item.quantity <= 0) outCount++;
      else if (item.quantity <= item.minStockAlert) lowCount++;
    });
    return { totalVal, lowCount, outCount, totalCount: items.length };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items
      .filter((i) => {
        if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
        if (stockStatusFilter === 'low') return i.quantity > 0 && i.quantity <= i.minStockAlert;
        if (stockStatusFilter === 'out') return i.quantity <= 0;
        return true;
      })
      .filter((i) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
        );
      });
  }, [items, selectedCategory, stockStatusFilter, search]);

  const handleOpenStockMove = (item: InventoryItem, type: 'stock_in' | 'stock_out' | 'sale') => {
    setStockMoveItem({ item, type });
    setMoveQuantity(1);
    setMoveUnitPrice(type === 'stock_in' ? item.costPrice : item.sellingPrice);
    setMoveReason(
      type === 'stock_in'
        ? language === 'bn'
          ? 'নতুন স্টক ক্রয়'
          : 'Restock purchase'
        : language === 'bn'
        ? 'কাউন্টার বিক্রয়'
        : 'Counter sale'
    );
    setMoveReference('');
    setSyncToLedger(true);
  };

  const handleSaveStockMove = (e: FormEvent) => {
    e.preventDefault();
    if (!stockMoveItem) return;
    if (moveQuantity <= 0) return;

    onUpdateStock(
      stockMoveItem.item.id,
      stockMoveItem.type,
      moveQuantity,
      moveUnitPrice,
      moveReason,
      moveReference,
      syncToLedger
    );

    setStockMoveItem(null);
  };

  const handleCreateNewItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const sku = newItemSku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

    onAddItem({
      sku,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      costPrice: Number(newItemCost) || 0,
      sellingPrice: Number(newItemSell) || 0,
      quantity: Number(newItemQty) || 0,
      minStockAlert: Number(newItemAlert) || 5,
      supplier: newItemSupplier.trim() || undefined,
      syncedToSheets: false,
    });

    // Reset
    setNewItemSku('');
    setNewItemName('');
    setNewItemCost(0);
    setNewItemSell(0);
    setNewItemQty(10);
    setNewItemAlert(5);
    setNewItemSupplier('');
    setShowAddModal(false);
  };

  return (
    <section className="space-y-5 mb-8">
      {/* Header & Stats Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-500" />
              <span>{t.title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addItem}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">
              {t.totalValuation}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 block">
              {formatCurrency(stats.totalVal, language)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70">
            <span className="text-xs text-blue-700 font-medium block">
              {t.totalItems}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-blue-900 mt-0.5 block">
              {formatNumber(stats.totalCount, language)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {t.lowStock}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-900 mt-0.5 block">
              {formatNumber(stats.lowCount, language)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <span className="text-xs text-rose-700 font-medium block">
              {t.outOfStock}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-900 mt-0.5 block">
              {formatNumber(stats.outCount, language)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Products vs Logs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('items')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              activeSubTab === 'items'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.allItems} ({formatNumber(items.length, language)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('logs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              activeSubTab === 'logs'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.stockLogs} ({formatNumber(logs.length, language)})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ITEMS LIST */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700"
              >
                <option value="all">{language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
                {categories.filter((c) => c !== 'all').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status pills */}
              <button
                type="button"
                onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  stockStatusFilter === 'low'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                ⚠️ {t.lowStock}
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter(stockStatusFilter === 'out' ? 'all' : 'out')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  stockStatusFilter === 'out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                ❌ {t.outOfStock}
              </button>
            </div>
          </div>

          {/* Product Cards / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                কোন পণ্য মেলেনি (No products found)
              </div>
            ) : (
              filteredItems.map((item) => {
                const isOutOfStock = item.quantity <= 0;
                const isLowStock = !isOutOfStock && item.quantity <= item.minStockAlert;
                const valuation = item.quantity * item.costPrice;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: SKU and Status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.sku}
                        </span>

                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            {t.outOfStock}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {t.lowStock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.inStock}
                          </span>
                        )}
                      </div>

                      {/* Item Name */}
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.category} • {item.unit}
                      </p>

                      {/* Stock Quantity & Valuation */}
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            {language === 'bn' ? 'বর্তমান মজুদ' : 'In Stock'}:
                          </span>
                          <span className={`font-extrabold text-sm ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {formatNumber(item.quantity, language)} {item.unit}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-200/60">
                          <span className="text-slate-500">
                            {language === 'bn' ? 'ক্রয় / বিক্রয়' : 'Cost / Sell'}:
                          </span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(item.costPrice, language)} / {formatCurrency(item.sellingPrice, language)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stock In / Out Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <button
                          type="button"
                          onClick={() => handleOpenStockMove(item, 'stock_in')}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                          title={t.stockIn}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? '+ ক্রয়' : '+ Restock'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenStockMove(item, 'sale')}
                          disabled={item.quantity <= 0}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors disabled:opacity-40"
                          title={t.stockOut}
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? '- বিক্রয়' : '- Sell'}</span>
                        </button>
                      </div>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItemId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MOVEMENT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">
              {t.stockLogs}
            </h4>
            <span className="text-xs text-slate-400">
              {logs.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Movement</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total (৳)</th>
                  <th className="py-3 px-4">Reason / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      কোন লগ নেই (No movement logs)
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatRelativeDate(l.date, language)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{l.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{l.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        {l.type === 'stock_in' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3" />
                            Stock In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowDownRight className="w-3 h-3" />
                            Sale / Out
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {formatNumber(l.quantity, language)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(l.unitPrice, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(l.totalAmount, language)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.reason} {l.reference && <span className="text-slate-400">({l.reference})</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: STOCK IN / OUT ACTION */}
      {stockMoveItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-lg text-slate-900 mb-1">
              {stockMoveItem.type === 'stock_in'
                ? language === 'bn'
                  ? 'স্টক বৃদ্ধি (ক্রয় / রিস্টক)'
                  : 'Restock Product (Stock In)'
                : language === 'bn'
                ? 'স্টক বিক্রয় (কাউন্টার সেল)'
                : 'Record Sale (Stock Out)'}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              {stockMoveItem.item.name} ({stockMoveItem.item.sku})
            </p>

            <form onSubmit={handleSaveStockMove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'পরিমাণ' : 'Quantity'} ({stockMoveItem.item.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={stockMoveItem.type !== 'stock_in' ? stockMoveItem.item.quantity : 99999}
                  required
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {stockMoveItem.type === 'stock_in'
                    ? language === 'bn'
                      ? 'প্রতি একক ক্রয় মূল্য (৳)'
                      : 'Unit Cost Price (৳)'
                    : language === 'bn'
                    ? 'প্রতি একক বিক্রয় মূল্য (৳)'
                    : 'Unit Selling Price (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={moveUnitPrice}
                  onChange={(e) => setMoveUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'কারণ / বিবরণ' : 'Reason / Note'}
                </label>
                <input
                  type="text"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'রেফারেন্স / চালান নং' : 'Reference / Invoice #'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-902 or Memo #4"
                  value={moveReference}
                  onChange={(e) => setMoveReference(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Checkbox to auto-sync to Ledger */}
              <div className="flex items-center gap-2 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl">
                <input
                  type="checkbox"
                  id="syncLedgerCheck"
                  checked={syncToLedger}
                  onChange={(e) => setSyncToLedger(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="syncLedgerCheck" className="text-xs text-blue-900 font-medium">
                  {stockMoveItem.type === 'stock_in'
                    ? language === 'bn'
                      ? 'খাতাপত্রের ব্যালেন্সে স্বয়ংক্রিয় "খরচ" হিসেবে যুক্ত করুন'
                      : 'Automatically record as Expense in Ledger'
                    : language === 'bn'
                    ? 'খাতাপত্রের ব্যালেন্সে স্বয়ংক্রিয় "জমা" হিসেবে যুক্ত করুন'
                    : 'Automatically record as Income in Ledger'}
                </label>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold">
                <span>{language === 'bn' ? 'মোট লেনদেন মূল্য' : 'Total Transaction Value'}:</span>
                <span className="text-base text-slate-900">
                  {formatCurrency(moveQuantity * moveUnitPrice, language)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockMoveItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h4 className="font-bold text-lg text-slate-900 mb-1">
              {t.addItem}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'bn' ? 'পণ্যের তথ্য পূরণ করুন এবং রিয়েল-টাইমে গুগল শিটে সিঙ্ক হবে' : 'Fill product details; will sync live to Google Sheets'}
            </p>

            <form onSubmit={handleCreateNewItem} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'পণ্যের নাম *' : 'Item Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মিনিকেট চাল ২৫ কেজি"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: RIC-MIN-25"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="pcs">Pcs (পিস)</option>
                    <option value="kg">Kg (কেজি)</option>
                    <option value="liter">Liter (লিটার)</option>
                    <option value="box">Box (বাক্স)</option>
                    <option value="carton">Carton (কার্টন)</option>
                    <option value="bag">Bag (বস্তা)</option>
                    <option value="packet">Packet (প্যাকেট)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ক্রয় মূল্য (৳)' : 'Cost Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'বিক্রয় মূল্য (৳)' : 'Selling Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemSell}
                    onChange={(e) => setNewItemSell(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'প্রাথমিক মজুদ পরিমাণ' : 'Initial Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'কম স্টক অ্যালার্ট লেভেল' : 'Min Stock Alert Level'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemAlert}
                    onChange={(e) => setNewItemAlert(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'সাপ্লায়ার / উৎস' : 'Supplier / Source'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মেঘনা গ্রুপ বা স্থানীয় ডিলার"
                  value={newItemSupplier}
                  onChange={(e) => setNewItemSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Item (MANDATORY Safety Rule) */}
      {deleteConfirmItemId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-900 text-base mb-2">
              {t.confirmDelete}
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              {language === 'bn'
                ? 'এই পণ্য ও এর হিস্ট্রি মুছে ফেললে পরবর্তী সিঙ্কে গুগল শিট থেকেও মুছে যাবে।'
                : 'Deleting this item will remove it from the product list and update your Google Sheet on next sync.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItemId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteItem(deleteConfirmItemId);
                  setDeleteConfirmItemId(null);
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
