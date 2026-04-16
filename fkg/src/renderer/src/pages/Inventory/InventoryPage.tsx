import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, ArrowUpDown, ImagePlus, Sparkles } from 'lucide-react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { StatusBadge } from '../../components/common/StatusBadge'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, normalizeImageSource } from '../../lib/utils'

interface Product {
  id: string; sku: string; name: string; categoryId: string | null
  stockQty: number; reservedQty: number; lowStockThreshold: number
  costPrice: number; sellPrice: number; status: string; description?: string
  primaryImagePath?: string | null
}

interface Category { id: string; name: string }

const SAMPLE_PRODUCT = {
  sku: 'DEMO-LHG-010',
  name: 'Noor Bridal Lehenga',
  costPrice: '28000',
  sellPrice: '64000',
  stockQty: '1',
  lowStockThreshold: '1',
  description: 'Signature bridal lehenga with layered cancan, adda motifs, and contrast dupatta.',
  imagePath:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#fff6f1" />
            <stop offset="100%" stop-color="#f8e2d6" />
          </linearGradient>
          <linearGradient id="dress" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#8b2338" />
            <stop offset="100%" stop-color="#4d1622" />
          </linearGradient>
        </defs>
        <rect width="720" height="960" rx="48" fill="url(#bg)" />
        <circle cx="550" cy="180" r="120" fill="#b47b43" opacity="0.14" />
        <path d="M305 210c0-30 24-54 55-54s55 24 55 54v64l80 66-46 84-43-25-16 335H280l-16-335-43 25-46-84 80-66z" fill="url(#dress)" />
        <path d="M300 280h120l52 344H248z" fill="none" stroke="#fff6f1" stroke-width="10" stroke-dasharray="16 18" opacity="0.85" />
        <rect x="70" y="70" width="310" height="130" rx="28" fill="#ffffff" opacity="0.92" />
        <text x="100" y="118" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#7a2d1d">Noor Bridal Lehenga</text>
        <text x="100" y="154" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">Sample design image</text>
      </svg>
    `)
}

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showStockModal, setShowStockModal] = useState<Product | null>(null)
  const [form, setForm] = useState({
    sku: '',
    name: '',
    costPrice: '',
    sellPrice: '',
    stockQty: '',
    categoryId: '',
    description: '',
    lowStockThreshold: '5',
    status: 'active',
    imagePath: ''
  })
  const [stockForm, setStockForm] = useState({ type: 'IN', qty: '', note: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([
        invoke<Product[]>('inventory:listProducts', {}),
        invoke<Category[]>('inventory:listCategories')
      ])
      setProducts(prods)
      setCategories(cats)
    } finally { setLoading(false) }
  }

  const filtered = products.filter((p) => {
    const s = search.toLowerCase()
    const matchSearch = !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
    const matchCat = !filterCat || p.categoryId === filterCat
    return matchSearch && matchCat
  })

  const resetForm = () => {
    setForm({
      sku: '',
      name: '',
      costPrice: '',
      sellPrice: '',
      stockQty: '',
      categoryId: '',
      description: '',
      lowStockThreshold: '5',
      status: 'active',
      imagePath: ''
    })
  }

  const applySampleProduct = () => {
    setForm((current) => ({
      ...current,
      ...SAMPLE_PRODUCT,
      categoryId: current.categoryId
    }))
  }

  const handleSave = async () => {
    try {
      const payload = {
        sku: form.sku, name: form.name,
        costPrice: parseFloat(form.costPrice) || 0,
        sellPrice: parseFloat(form.sellPrice) || 0,
        stockQty: editItem ? undefined : parseInt(form.stockQty) || 0,
        categoryId: form.categoryId || null,
        description: form.description || null,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        status: form.status,
        imagePath: form.imagePath || null
      }
      if (editItem) {
        await invoke('inventory:updateProduct', { id: editItem.id, updates: payload })
      } else {
        await invoke('inventory:createProduct', payload)
      }
      setShowForm(false)
      setEditItem(null)
      resetForm()
      loadAll()
    } catch (e: any) { alert(e.message) }
  }

  const handleEdit = (p: Product) => {
    setEditItem(p)
    setForm({
      sku: p.sku,
      name: p.name,
      costPrice: String(p.costPrice),
      sellPrice: String(p.sellPrice),
      stockQty: String(p.stockQty),
      categoryId: p.categoryId ?? '',
      description: p.description ?? '',
      lowStockThreshold: String(p.lowStockThreshold),
      status: p.status,
      imagePath: p.primaryImagePath ?? ''
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await invoke('inventory:deleteProduct', { id: deleteId })
    setDeleteId(null)
    loadAll()
  }

  const handleStockAdjust = async () => {
    if (!showStockModal) return
    try {
      await invoke('inventory:recordStockMovement', {
        productId: showStockModal.id,
        type: stockForm.type,
        qtyChange: parseInt(stockForm.qty) || 0,
        note: stockForm.note
      })
      setShowStockModal(null)
      setStockForm({ type: 'IN', qty: '', note: '' })
      loadAll()
    } catch (e: any) { alert(e.message) }
  }

  const columns: Column<Product>[] = [
    {
      key: 'image',
      header: 'Design',
      render: (p) => {
        const imageSrc = normalizeImageSource(p.primaryImagePath)

        return imageSrc ? (
          <img
            src={imageSrc}
            alt={p.name}
            className="h-14 w-14 rounded-2xl object-cover border border-app-border bg-surface"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-app-border bg-surface text-dark/35">
            <ImagePlus size={16} />
          </div>
        )
      }
    },
    { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">{p.sku}</span> },
    { key: 'name', header: 'Product', render: (p) => <div><div className="font-medium">{p.name}</div><div className="text-xs text-dark/40">{categories.find(c => c.id === p.categoryId)?.name}</div></div> },
    { key: 'stock', header: 'Stock', render: (p) => {
      const avail = p.stockQty - p.reservedQty
      return <span className={avail <= p.lowStockThreshold ? 'text-red-600 font-semibold' : ''}>{avail} avail ({p.stockQty} total)</span>
    }},
    { key: 'costPrice', header: 'Cost', render: (p) => formatCurrency(p.costPrice) },
    { key: 'sellPrice', header: 'Price', render: (p) => formatCurrency(p.sellPrice) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'actions', header: '', render: (p) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowStockModal(p)} className="p-1.5 hover:bg-surface rounded" title="Adjust Stock"><ArrowUpDown size={14} /></button>
        <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-surface rounded"><Edit size={14} /></button>
        <button onClick={() => setDeleteId(p.id)} className="p-1.5 hover:bg-surface rounded text-red-500"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-3 py-2 border border-app-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} keyExtractor={(p) => p.id} emptyMessage="No products found" />

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setEditItem(null); resetForm() }} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-dark mb-4">{editItem ? 'Edit Product' : 'Add Product'}</h3>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#f2d6c8] bg-[#fff5ee] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a2f25]">Sample Product Inputs</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Drop in a polished lehenga sample with image, pricing, and description for demo mode.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applySampleProduct}
                      className="inline-flex items-center justify-center rounded-2xl bg-[#7f2f21] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#662419]"
                    >
                      <Sparkles size={15} className="mr-2" /> Fill Sample Product
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-dark/60 mb-1 block">SKU *</label>
                    <input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  </div>
                  <div>
                    <label className="text-sm text-dark/60 mb-1 block">Category</label>
                    <select value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                      <option value="">None</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-dark/60 mb-1 block">Cost Price</label>
                    <input type="number" value={form.costPrice} onChange={(e) => setForm({...form, costPrice: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  </div>
                  <div>
                    <label className="text-sm text-dark/60 mb-1 block">Sell Price</label>
                    <input type="number" value={form.sellPrice} onChange={(e) => setForm({...form, sellPrice: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {!editItem && (
                    <div>
                      <label className="text-sm text-dark/60 mb-1 block">Initial Stock</label>
                      <input type="number" value={form.stockQty} onChange={(e) => setForm({...form, stockQty: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                    </div>
                  )}
                  <div className={editItem ? 'col-span-2' : ''}>
                    <label className="text-sm text-dark/60 mb-1 block">Low Stock Threshold</label>
                    <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({...form, lowStockThreshold: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" rows={3} />
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Image URL or Local File Path</label>
                  <input
                    value={form.imagePath}
                    onChange={(e) => setForm({...form, imagePath: e.target.value})}
                    placeholder="Paste a data URI, https URL, or /Users/.../lehenga.jpg path"
                    className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <p className="mt-1 text-xs text-dark/40">
                    Tip: local files work if you paste the full path. Demo seed also creates sample design images automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-app-border bg-surface/70 p-4">
                  <p className="text-sm font-semibold text-dark">Design Preview</p>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-app-border bg-white">
                    {normalizeImageSource(form.imagePath) ? (
                      <img
                        src={normalizeImageSource(form.imagePath)!}
                        alt={form.name || 'Product preview'}
                        className="h-72 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-72 flex-col items-center justify-center gap-3 text-dark/40">
                        <ImagePlus size={22} />
                        <p className="text-sm">Add an image path to preview the design here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditItem(null); resetForm() }} className="flex-1 border border-app-border rounded-lg py-2 text-sm hover:bg-surface">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium hover:bg-brand/90">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowStockModal(null)} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-dark mb-1">Adjust Stock</h3>
            <p className="text-sm text-dark/50 mb-4">{showStockModal.name}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Type</label>
                <select value={stockForm.type} onChange={(e) => setStockForm({...stockForm, type: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Quantity</label>
                <input type="number" value={stockForm.qty} onChange={(e) => setStockForm({...stockForm, qty: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Note</label>
                <input value={stockForm.note} onChange={(e) => setStockForm({...stockForm, note: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowStockModal(null)} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleStockAdjust} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Product"
        description="This will soft-delete the product. Stock movements will be preserved."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
