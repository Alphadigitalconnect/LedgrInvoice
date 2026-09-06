import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit2, 
  Check, 
  Trash2, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Search,
  FolderTree,
  TrendingUp
} from 'lucide-react';
import { DEFAULT_SERVICE_CATEGORIES, formatINR } from '../../data/constants';

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories = [],
  invoices = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) {
  const [newCatName, setNewCatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCat, setEditingCat] = useState(null); // original category name string being edited
  const [editingValue, setEditingValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Compute revenue and usage statistics per category
  const categoryUsageMap = {};
  categories.forEach(cat => {
    categoryUsageMap[cat] = { revenue: 0, count: 0 };
  });

  invoices.forEach(inv => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    items.forEach(it => {
      const cat = it.category || inv.category || 'Uncategorized';
      if (!categoryUsageMap[cat]) {
        categoryUsageMap[cat] = { revenue: 0, count: 0 };
      }
      categoryUsageMap[cat].revenue += (Number(it.lineTotal) || Number(it.taxableAmount) || 0);
      categoryUsageMap[cat].count += 1;
    });
  });

  const handleAddNew = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }

    const alreadyExists = categories.some(
      c => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setErrorMsg(`Category "${trimmed}" already exists.`);
      return;
    }

    onAddCategory(trimmed);
    setNewCatName('');
    setErrorMsg('');
    setSuccessMsg(`Category "${trimmed}" added successfully!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStartEdit = (cat) => {
    setEditingCat(cat);
    setEditingValue(cat);
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setEditingCat(null);
    setEditingValue('');
    setErrorMsg('');
  };

  const handleSaveEdit = (originalCat) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }

    if (trimmed.toLowerCase() !== originalCat.toLowerCase()) {
      const alreadyExists = categories.some(
        c => c.toLowerCase() === trimmed.toLowerCase()
      );
      if (alreadyExists) {
        setErrorMsg(`A category named "${trimmed}" already exists.`);
        return;
      }
    }

    onUpdateCategory(originalCat, trimmed);
    setEditingCat(null);
    setEditingValue('');
    setErrorMsg('');
    setSuccessMsg(`Category updated to "${trimmed}"! Invoices updated.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (cat) => {
    const usage = categoryUsageMap[cat];
    let confirmMsg = `Are you sure you want to delete category "${cat}"?`;
    if (usage && usage.count > 0) {
      confirmMsg += `\nNote: ${usage.count} invoice item(s) are currently categorized under "${cat}".`;
    }

    if (window.confirm(confirmMsg)) {
      onDeleteCategory(cat);
      if (editingCat === cat) {
        setEditingCat(null);
      }
      setSuccessMsg(`Category "${cat}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const missingDefaults = DEFAULT_SERVICE_CATEGORIES.filter(
    def => !categories.some(c => c.toLowerCase() === def.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700">
              <FolderTree size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                Manage Service Categories
              </h2>
              <p className="text-[11px] text-slate-400">
                Add, edit, or customize categories to divide services & track revenue streams
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add New Category Box */}
          <form onSubmit={handleAddNew} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
              Add New Service Category
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Digital Marketing, Web Development, Auditing..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <Tag size={13} className="absolute left-2.5 top-3 text-slate-400" />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* Search / Filter & Categories List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Categories ({categories.length})
                </h3>
              </div>

              {categories.length > 5 && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter categories..."
                    className="pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-44"
                  />
                  <Search size={12} className="absolute left-2 top-2 text-slate-400" />
                </div>
              )}
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Tag size={24} className="mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">No categories created yet</p>
                <p className="text-[11px] text-slate-500">Create your first category above to organize your invoice services.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white shadow-2xs">
                {filteredCategories.map((cat) => {
                  const isBeingEdited = editingCat === cat;
                  const usage = categoryUsageMap[cat] || { revenue: 0, count: 0 };

                  return (
                    <div 
                      key={cat}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 transition"
                    >
                      {isBeingEdited ? (
                        /* Inline Edit Form */
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(cat);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-900 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none ring-2 ring-slate-900/10"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            title="Save Changes"
                            className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            title="Cancel"
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        /* Normal View */
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
                              <Tag size={13} />
                            </span>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-slate-900 block truncate">
                                {cat}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span className="font-mono text-slate-700 font-medium">
                                  {formatINR(usage.revenue)}
                                </span>
                                <span>•</span>
                                <span>{usage.count} {usage.count === 1 ? 'line item' : 'line items'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              title="Edit Category"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                            >
                              <Edit2 size={13} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              title="Delete Category"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Missing Preset Quick Add Badges */}
          {missingDefaults.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Sparkles size={13} className="text-slate-500" />
                <span>Suggested Standard Service Categories (Click to add):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingDefaults.map(def => (
                  <button
                    key={def}
                    type="button"
                    onClick={() => {
                      onAddCategory(def);
                      setSuccessMsg(`Added standard category "${def}"`);
                      setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 text-[11px] font-medium rounded-lg border border-slate-300 transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={11} className="text-slate-500" />
                    <span>{def}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-500">
            Note: Category names are kept strictly internal for tracking and never displayed on statutory invoices.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
