import React, { useState, useEffect } from 'react';
import { MultiImageUploader } from './components/MultiImageUploader';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggleButton from './components/ThemeToggleButton';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  Trash2, 
  Plus, 
  Loader2, 
  Sparkles, 
  Upload, 
  X, 
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Box,
  Image as ImageIcon,
  Bell,
  MapPin,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product3DViewer } from './3d/Product3DViewer';
import { compressImage, generateThumbnail, fileToBase64, validateFileSize } from './utils/fileHelpers';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER'];

// --- Shared UI Components ---

const DashboardNavLink: React.FC<{
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}> = ({ to, label, icon, active }) => {
  return (
    <Link to={to} className="block">
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-wider ${
          active 
            ? 'bg-gradient-to-r from-gold-600 to-gold-dark text-white shadow-lg shadow-gold-600/25 border border-gold-400/20' 
            : 'text-charcoal/80 dark:text-white/70 hover:bg-gold-500/10 dark:hover:bg-white/5 hover:text-gold-700 dark:hover:text-gold'
        }`}
      >
        <span className={active ? 'text-white' : 'text-gold-600 dark:text-gold-400'}>
          {icon}
        </span>
        {label}
      </motion.div>
    </Link>
  );
};

const DashboardInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  isTextArea?: boolean;
  isSelect?: boolean;
  options?: { value: string; label: string }[];
}> = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  isTextArea = false,
  isSelect = false,
  options = []
}) => {
  const classes = "w-full px-4 py-3 bg-white/70 dark:bg-white/3 border border-gold-300/40 dark:border-white/10 rounded-2xl focus:outline-none focus:border-gold-600 dark:focus:border-gold-400 text-charcoal dark:text-white transition-all text-sm shadow-inner focus:bg-white focus:ring-4 focus:ring-gold-500/10 dark:focus:ring-gold-400/10";
  
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase block ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      
      {isTextArea ? (
        <textarea
          rows={4}
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          required={required}
          className={classes}
        />
      ) : isSelect ? (
        <select
          value={value}
          onChange={onChange as any}
          required={required}
          className={classes}
        >
          <option value="" disabled>{placeholder || 'Select option'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-dark-surface text-charcoal dark:text-white">
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={classes}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
}> = ({ title, value, trend, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[32px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] border border-gold-300/20 dark:border-white/5 hover:border-gold-dark/40 dark:hover:border-gold/40 shadow-sm hover:shadow-lg transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold-100/5 via-transparent to-transparent dark:from-white/[0.01] dark:via-transparent dark:to-transparent pointer-events-none" />
      <div className="flex justify-between items-start relative z-10">
        <span className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">
          {title}
        </span>
        <div className="p-3 bg-gradient-to-br from-gold-100 to-gold-50 dark:from-white/5 dark:to-white/10 rounded-2xl text-gold-700 dark:text-gold group-hover:scale-115 transition-transform duration-300 shadow-inner">
          {icon}
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline justify-between relative z-10">
        <h3 className="text-3xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
          {value}
        </h3>
        {trend && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
            <TrendingUp size={10} />
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// --- Sub-Pages ---

// 1. Overview Page
const OverviewPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
          System <span className="text-gradient-gold">Overview</span>
        </h1>
        <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium">Real-time gallery health and operational metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats?.productCount || 0} 
          trend="+4 new"
          icon={<Package size={20} />} 
        />
        <StatCard 
          title="Revenue" 
          value={`₹${(stats?.revenue || 0).toLocaleString()}`} 
          trend="+18.2%"
          icon={<BarChart3 size={20} />} 
        />
        <StatCard 
          title="Total Orders" 
          value={stats?.totalOrders || 0} 
          trend="Growth"
          icon={<MessageSquare size={20} />} 
        />
        <StatCard 
          title="Active Customers" 
          value={stats?.customers || 0} 
          trend="Verified"
          icon={<User size={20} />} 
        />
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-white">Store Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-[32px] p-6 space-y-4 border border-gold-300/20 dark:border-white/5">
            <span className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Inventory Multiplier</span>
            <div className="flex justify-between items-baseline">
              <h4 className="text-2xl font-serif font-bold dark:text-white">2.4x</h4>
              <span className="text-[10px] text-stone-500 dark:text-white/50 font-bold uppercase tracking-wider">Target: 3.0x</span>
            </div>
            <div className="w-full h-2 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden p-[1px]">
              <div className="h-full bg-gradient-to-r from-gold-500 to-gold-700 dark:from-gold-300 dark:to-gold-500 rounded-full shadow-sm" style={{ width: '80%' }}></div>
            </div>
          </div>

          <div className="glass rounded-[32px] p-6 space-y-4 border border-gold-300/20 dark:border-white/5">
            <span className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Customer Retention</span>
            <div className="flex justify-between items-baseline">
              <h4 className="text-2xl font-serif font-bold dark:text-white">84%</h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Excellent</span>
            </div>
            <div className="w-full h-2 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden p-[1px]">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-sm" style={{ width: '84%' }}></div>
            </div>
          </div>

          <div className="glass rounded-[32px] p-6 space-y-4 border border-gold-300/20 dark:border-white/5">
            <span className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Vibe Check</span>
            <div className="flex justify-between items-baseline">
              <h4 className="text-2xl font-serif font-bold dark:text-white">Artistic</h4>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Satisfied</span>
            </div>
            <div className="w-full h-2 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden p-[1px]">
              <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full shadow-sm" style={{ width: '95%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Add Product Page
const AddProductPage = () => {
  const [productType, setProductType] = useState<"IMAGE" | "3D">("IMAGE");
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [aiLoading, setAiLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleModelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!validateFileSize(file, 30)) {
        setErrorMsg('3D model size exceeds 30MB limit.');
        return;
      }
      setModelFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (productType === '3D') {
      handleModelSelect(e);
      return;
    }
    setErrorMsg('');
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!validateFileSize(file, 5)) {
      setErrorMsg('Image size exceeds 5MB limit.');
      return;
    }
    setImageFiles([file]);
    try {
      setImagePreview(await compressImage(file));
    } catch {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAiInfuse = async () => {
    if (!imagePreview) return;
    setAiLoading(true);
    setSuccessMsg('');
    try {
      const base64Content = imagePreview.split(',')[1];
      const mime = imagePreview.split(';')[0].split(':')[1];
      
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data: base64Content, mimeType: mime })
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        if (data.tags) {
          setTags(data.tags.join(', '));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      let finalProductType = productType;

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          price,
          category,
          description,
          stock,
          tags: tagsArray,
          images: productType === 'IMAGE' ? imageFiles.map(f => URL.createObjectURL(f)) : [], 
          type: finalProductType,
          modelUrl: productType === '3D' && modelFile ? URL.createObjectURL(modelFile) : undefined,
          published: true, 
        })
      });

      if (res.ok) {
        setSuccessMsg("Product published successfully!");
        setName('');
        setPrice('');
        setCategory('');
        setStock('10');
        setDescription('');
        setTags('');
        setImageFiles([]);
        setImagePreview('');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to publish product");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
          Publish <span className="text-gradient-gold">Masterpiece</span>
        </h1>
        <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium">Expose a new curated art product to the gallery catalog</p>
      </div>

      {errorMsg && (
         <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm font-medium">
           <AlertCircle size={18} />
           {errorMsg}
         </div>
      )}

      <div className="flex gap-2 p-1 bg-white/50 dark:bg-white/5 rounded-2xl w-max border border-gold-300/30 dark:border-white/10 shadow-inner">
        <button
          type="button"
          onClick={() => { setProductType("IMAGE"); setImageFiles([]); setImagePreview(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${productType === "IMAGE" ? "bg-white dark:bg-white/10 text-charcoal dark:text-white shadow-sm border border-black/5 dark:border-white/5" : "text-charcoal/60 dark:text-white/50 hover:text-charcoal dark:hover:text-white"}`}
        >
          <ImageIcon size={16} /> 2D Image
        </button>
        <button
          type="button"
          onClick={() => { setProductType("3D"); setImageFiles([]); setImagePreview(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${productType === "3D" ? "bg-white dark:bg-white/10 text-charcoal dark:text-white shadow-sm border border-black/5 dark:border-white/5" : "text-charcoal/60 dark:text-white/50 hover:text-charcoal dark:hover:text-white"}`}
        >
          <Box size={16} /> 3D Model
        </button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium"
          >
            <CheckCircle size={18} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Side: Upload Column */}
        <div className="md:col-span-5 space-y-5">
          <span className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase block ml-1">
            {productType === "IMAGE" ? "Artwork Image" : "3D Model Asset"}
          </span>
          <div className="border-2 border-dashed border-gold-300/40 dark:border-white/15 rounded-[32px] p-4 flex flex-col justify-center items-center aspect-square relative bg-white/40 dark:bg-white/3 hover:bg-white/60 dark:hover:bg-white/5 transition-all shadow-inner overflow-hidden">
            {imagePreview ? (
              <div className="w-full h-full relative rounded-[20px] overflow-hidden group border border-gold-300/30 bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {productType === 'IMAGE' ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <Box size={48} className="text-gold-500 mb-4 animate-bounce" />
                    <p className="text-sm font-bold text-charcoal dark:text-white text-center break-all">{imageFiles[0]?.name || 'Image'}</p>
                    <p className="text-xs text-charcoal/60 dark:text-white/50 mt-1">Ready for 3D processing</p>
                    <button 
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold-dark rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all"
                    >
                      Inspect in 3D Viewer
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => { setImageFiles([]); setImagePreview(''); }} className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all cursor-pointer shadow z-20">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-6 text-center z-10">
                <div className="p-4 bg-gold-100/50 dark:bg-white/5 text-gold-700 dark:text-gold rounded-2xl mb-3 shadow-inner">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-semibold">{productType === "IMAGE" ? "Select Artwork Image" : "Select .GLB/.GLTF Model"}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                  {productType === "IMAGE" ? "PNG, JPG up to 5MB" : "GLB, GLTF up to 30MB"}
                </p>
                <input type="file" accept={productType === 'IMAGE' ? "image/png, image/jpeg, image/webp" : ".glb,.gltf"} onChange={handleFileSelect} className="hidden" />
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleAiInfuse}
            disabled={!imagePreview || aiLoading}
            className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold flex justify-center items-center gap-2 border transition-all duration-300 ${
              imagePreview 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/25 border-transparent cursor-pointer active:scale-95' 
                : 'bg-stone-100 dark:bg-white/5 text-stone-400 border-stone-200 dark:border-white/5 cursor-not-allowed'
            }`}
          >
            {aiLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Analyzing Artwork...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                AI Infuse Details
              </>
            )}
          </button>
        </div>

        {/* Right Side: Form details */}
        <div className="md:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <DashboardInput
                label="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Whispering Blossom"
                required
              />
            </div>
            
            <DashboardInput
              label="Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              required
            />

            <DashboardInput
              label="Category"
              value={category}
              isSelect
              options={[
                { value: 'Soft Toys', label: 'Soft Toys' },
                { value: 'Handmade Crafts', label: 'Handmade Crafts' },
                { value: 'Personalized Gifts', label: 'Personalized Gifts' },
                { value: 'Home Decor', label: 'Home Decor' },
                { value: 'Festival Gifts', label: 'Festival Gifts' }
              ]}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select Category"
              required
            />

            <div className="sm:col-span-2">
              <DashboardInput
                label="Initial Stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <DashboardInput
                label="Artwork Description"
                isTextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the craftsmanship, emotion, and aesthetic details..."
                required
              />
            </div>

            <div className="sm:col-span-2">
              <DashboardInput
                label="Search Tags (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. handmade, clay, golden, home-decor"
              />
            </div>
          </div>

          <div className="flex pt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full sm:w-auto px-10 py-3.5 btn-gold font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 rounded-2xl"
            >
              {submitLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Publish Masterpiece"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// 3. Inventory Page
const InventoryPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
            Artwork <span className="text-gradient-gold">Inventory</span>
          </h1>
          <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium">Manage and review your collection catalog</p>
        </div>
        <Link to="/admin/add-product">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            className="flex items-center gap-2 btn-gold py-2.5 px-5 font-bold cursor-pointer text-xs uppercase tracking-wider"
          >
            <Plus size={14} /> Add Product
          </motion.button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="glass rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px] border border-gold-300/20">
          <div className="p-4 bg-gold-50 dark:bg-white/5 rounded-full text-gold-600 mb-4 shadow-inner">
            <Package size={36} />
          </div>
          <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white">Inventory is currently empty.</h3>
          <p className="text-sm text-stone-500 mt-2 max-w-sm">Bring your storefront to life by publishing your first art creations.</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/admin/add-product')}
            className="mt-6 px-6 py-2.5 btn-gold text-xs font-bold cursor-pointer"
          >
            Add First Product
          </motion.button>
        </div>
      ) : (
        <div className="glass rounded-[32px] overflow-hidden border border-gold-300/20 dark:border-white/5 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold-200 dark:border-white/10 bg-gold-50/40 dark:bg-white/2">
                  <th className="py-4 px-6 text-[10px] font-extrabold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Thumbnail</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Artwork Title</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Category</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Stock Level</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Price (₹)</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold tracking-widest text-charcoal/60 dark:text-white/50 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/20 dark:divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gold-50/10 dark:hover:bg-white/2 transition-colors">
                    <td className="py-4 px-6">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gold-200/50 shadow-inner">
                        <img 
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=60'} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-charcoal dark:text-white text-sm">{product.name}</td>
                    <td className="py-4 px-6 text-sm">{product.category}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        product.stock <= 2 
                          ? 'bg-red-500/10 text-rose-600' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {product.stock} left
                      </span>
                    </td>
                    <td className="py-4 px-6 font-serif font-bold text-sm text-gold-700 dark:text-gold-300">₹{product.price.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-2">
                        {/* Decorative Edit Icon */}
                        <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white/80 transition-colors cursor-not-allowed">
                          <PlusCircle size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(product)}
                          className="p-2 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass max-w-sm w-full p-8 rounded-[32px] space-y-6 border border-rose-500/30"
            >
              <div className="text-center space-y-2">
                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full w-fit mx-auto mb-2 shadow-inner">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-serif font-bold dark:text-white">Remove Artwork?</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-charcoal dark:text-white">"{deleteTarget.name}"</span>? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-white/80 font-bold text-xs rounded-xl hover:bg-stone-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer border border-stone-200/50 dark:border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold text-xs rounded-xl hover:from-rose-700 hover:to-red-800 transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/10"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={14} /> : "Remove"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 4. Orders Page
const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const buildWhatsAppLink = (order: any) => {
    const ship = order.shippingAddress || {};
    const items = (order.items || [])
      .map((i: any) => `• ${i.name} × ${i.quantity || 1}`)
      .join('\n');
    const msg = [
      '🛒 New Order — Yashas Art Gallery',
      `Order: ${order.orderNumber}`,
      `Customer: ${ship.full_name}`,
      `Phone: ${ship.mobile_number}`,
      `Place: ${ship.city || ship.location}`,
      `Address: ${ship.location}`,
      items,
      `Total: ₹${Number(order.total).toLocaleString('en-IN')}`,
    ].join('\n');
    const phone = String((import.meta as { env?: { VITE_ADMIN_WHATSAPP?: string } }).env?.VITE_ADMIN_WHATSAPP || '919900910536').replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const newOrders = orders.filter((o) => o.adminSeen === false && o.status === 'PLACED');

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">Orders & Alerts</h1>
        <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium">New orders appear instantly — accept, process, and deliver</p>
      </div>

      {newOrders.length > 0 && (
        <div className="rounded-[2rem] border-2 border-amber-400/50 bg-amber-50/80 dark:bg-amber-500/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <Bell size={20} className="animate-pulse" />
            {newOrders.length} new order{newOrders.length > 1 ? 's' : ''} need your attention
          </div>
          {newOrders.map((order) => {
            const ship = order.shippingAddress || {};
            return (
              <div key={order.id} className="glass rounded-2xl p-5 border border-amber-300/30">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">New order alert</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-lg dark:text-white">{ship.full_name}</p>
                    <p className="text-sm flex items-center gap-1 mt-1"><Phone size={14} /> {ship.mobile_number}</p>
                    <p className="text-sm flex items-center gap-1 mt-1"><MapPin size={14} /> {ship.city || '—'} · {ship.location}</p>
                    <p className="text-xs text-stone-500 mt-2">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(order.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="text-center">
                        {item.image && (
                          <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto" />
                        )}
                        <p className="text-[10px] mt-1 max-w-[72px] truncate">{item.name}</p>
                        <p className="text-[10px] font-bold">×{item.quantity || 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button type="button" onClick={() => updateStatus(order.id, 'CONFIRMED')} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold">Accept order</button>
                  <button type="button" onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold">Reject</button>
                  <button type="button" onClick={() => updateStatus(order.id, 'PROCESSING')} className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-bold">Mark processing</button>
                  <a href={buildWhatsAppLink(order)} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-bold flex items-center gap-1">
                    WhatsApp <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass rounded-[40px] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="p-4 bg-gold-50 dark:bg-white/5 rounded-full text-gold-600 mb-4">
            <MessageSquare size={36} />
          </div>
          <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white">No orders yet</h3>
          <p className="text-sm text-stone-500 mt-2 max-w-sm">Customer purchases will appear here with images and delivery details.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const ship = order.shippingAddress || {};
            const isNew = order.adminSeen === false && order.status === 'PLACED';
            return (
              <div key={order.id} className={`glass rounded-[24px] p-5 border ${isNew ? 'border-amber-400/60 ring-2 ring-amber-400/20' : 'border-gold/10'}`}>
                <div className="flex flex-wrap justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-charcoal dark:text-white">{order.orderNumber}</p>
                      {isNew && <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full uppercase">New</span>}
                    </div>
                    <p className="text-xs text-stone-500">{ship.full_name} · {ship.mobile_number}</p>
                    <p className="text-xs text-stone-500">{order.userEmail} · {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <p className="font-serif font-bold text-gold-dark">₹{Number(order.total).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-3 flex-wrap mb-3">
                  {(order.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center bg-white/40 dark:bg-white/5 rounded-xl p-2">
                      {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                      <div>
                        <p className="text-sm font-medium dark:text-white">{item.name}</p>
                        <p className="text-xs text-stone-500">Qty {item.quantity || 1} · ₹{Number(item.price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-charcoal/60 dark:text-white/50 mb-3 flex items-start gap-1">
                  <MapPin size={14} className="shrink-0 mt-0.5" /> {ship.location}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateStatus(order.id, 'CONFIRMED')} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white">Accept</button>
                  <button type="button" onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-red-500 text-white">Reject</button>
                  <button type="button" onClick={() => updateStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-amber-600 text-white">Processing</button>
                  <button type="button" onClick={() => updateStatus(order.id, 'DELIVERED')} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-gold-dark text-white">Delivered</button>
                  <a href={buildWhatsAppLink(order)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-green-600 text-white flex items-center gap-1">
                    WhatsApp
                  </a>
                </div>
                <p className="text-[10px] mt-3 uppercase tracking-wider text-charcoal/40">Status: <strong>{order.status}</strong></p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 5. Customers Page
const CustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">Gallery Patrons</h1>
        <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium font-serif italic">Registered art collectors and patrons</p>
      </div>

      {customers.length === 0 ? (
        <div className="glass rounded-[40px] p-12 text-center">
          <User className="text-stone-300 mx-auto mb-3" size={36} />
          <h3 className="text-lg font-bold">No patrons found</h3>
          <p className="text-sm text-stone-400 mt-1">Collectors signing up via mobile OTP will appear here.</p>
        </div>
      ) : (
        <div className="glass rounded-[40px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold-200 dark:border-white/10 bg-gold-50/50 dark:bg-white/2">
                  <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Customer</th>
                  <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Communication</th>
                  <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Engagement</th>
                  <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/20 dark:divide-white/5">
                {customers.map((cust) => {
                  const name = cust.full_name || cust.fullName || "Patron";
                  const phone = cust.mobile_number || cust.phone || cust.mobileNumber || "No Phone";
                  return (
                    <tr key={cust.id} className="hover:bg-gold-50/10 dark:hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-white/5 dark:to-white/10 text-gold-700 dark:text-gold rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                            {name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal dark:text-white text-sm">{name}</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">{phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium">{cust.email}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-stone-500 dark:text-white/55 uppercase">1 Order</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// 6. Manage Admins Page
const ManageAdminsPage = () => {
  const [stewards, setStewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchStewards = async () => {
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStewards(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStewards();
  }, []);

  const handleAddSteward = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetch('/api/admin/add-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role,
          password: tempPassword
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setRole('');
        setTempPassword('');
        fetchStewards();
      } else {
        const errData = await res.json();
        setModalError(errData.error || 'Failed to add admin.');
      }
    } catch (err) {
      setModalError('Connection failed.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">Gallery Stewards</h1>
          <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium font-serif italic">Administrator roles and security permissions</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 btn-gold py-2.5 px-5 font-bold cursor-pointer text-sm"
        >
          <Plus size={16} /> Add Steward
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stewards.map((steward) => {
          const isSuper = steward.role === 'SUPER_ADMIN';
          return (
            <motion.div
              key={steward.email}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[32px] p-6 relative flex flex-col justify-between min-h-[190px]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-gold-200 dark:bg-white/10 text-gold-700 dark:text-gold rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                    {steward.fullName?.[0] || 'A'}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    isSuper 
                      ? 'bg-rose-500/10 text-rose-600' 
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {steward.role}
                  </span>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-lg text-charcoal dark:text-white">{steward.fullName}</h4>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">{steward.email}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/30 dark:border-white/5 flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Online
                </span>
                <span className="text-gold-600 dark:text-gold font-bold uppercase tracking-wider text-[9px] hover:underline cursor-not-allowed">
                  Advanced Settings
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass max-w-lg w-full p-8 rounded-[40px] relative space-y-6"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="text-2xl font-serif font-bold">Appoint Steward</h3>
                <p className="text-xs text-stone-500 mt-1">Issue administrative credentials with curated authorization roles.</p>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleAddSteward} className="space-y-5">
                <DashboardInput 
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Yogesh Kumar"
                  required
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DashboardInput 
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yogesh@gallery.com"
                    required
                  />
                  <DashboardInput 
                    label="Mobile Number (WhatsApp orders)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9900910536"
                    required
                  />
                </div>
                <p className="text-xs text-stone-500 -mt-2">Each admin with a valid mobile number receives automatic WhatsApp alerts on new orders.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DashboardInput 
                    label="Steward Role"
                    value={role}
                    isSelect
                    options={[
                      { value: 'SUPER_ADMIN', label: 'Super Admin' },
                      { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
                      { value: 'ORDER_MANAGER', label: 'Order Manager' }
                    ]}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Choose Role"
                    required
                  />
                  <DashboardInput 
                    label="Temporary Password"
                    type="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Default: Admin@123"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-white/80 font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-white/10 transition-all cursor-pointer text-xs border border-stone-200/50 dark:border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 btn-gold font-bold rounded-xl transition-all cursor-pointer text-xs flex justify-center items-center shadow-lg"
                  >
                    {modalLoading ? <Loader2 className="animate-spin" size={16} /> : "Appoint Admin"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 7. Analytics Page (Fixed animated Bar Chart)
const AnalyticsPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const sales = stats?.monthlySales || [1200, 1900, 1500, 4500, 3200, 5000];
  const maxSales = Math.max(...sales);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-white tracking-tight">Store Insights</h1>
        <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1 font-medium font-serif italic">Operational growth charts and sales analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Growth Rate" value="+18.2%" trend="Active" icon={<TrendingUp size={20} />} />
        <StatCard title="Revenue Growth" value={`₹${(stats?.revenue || 0).toLocaleString()}`} icon={<BarChart3 size={20} />} />
        <StatCard title="Avg. Ticket Size" value="₹1,240" trend="Stable" icon={<User size={20} />} />
      </div>

      {/* Bar Chart Section */}
      <div className="glass rounded-[32px] p-8 space-y-6 border border-gold-300/20 dark:border-white/5 shadow-md">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-widest text-charcoal/60 dark:text-white/50 uppercase">Monthly Sales Volume (H1)</span>
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider text-[10px]">Growth Trend</span>
        </div>

        <div className="flex justify-between items-end h-64 pt-8 border-b border-stone-200/50 dark:border-white/10 px-4">
          {sales.map((val: number, idx: number) => {
            // Percent height logic
            const heightPercent = maxSales > 0 ? (val / maxSales) * 100 : 0;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                <div className="relative w-full flex flex-col justify-end h-48">
                  {/* Tooltip */}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-charcoal dark:bg-white text-white dark:text-black font-extrabold text-[9px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-gold-400/20 pointer-events-none whitespace-nowrap">
                    ₹{val.toLocaleString()}
                  </span>
                  {/* Animated Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.1 }}
                    className="w-full bg-gradient-to-t from-gold-600 to-amber-500 dark:from-gold-dark dark:to-gold-300 rounded-t-xl group-hover:from-gold-500 group-hover:to-amber-400 transition-colors shadow-lg shadow-gold-600/10 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-stone-500 dark:text-white/60 font-extrabold uppercase tracking-wider">{months[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-[40px] p-6 text-center italic text-stone-500 text-xs font-serif leading-relaxed max-w-lg mx-auto">
        “We've observed a substantial 12% rise in Personalized Gifts demands this month. Collectors are increasingly seeking artisan expressions that resonate with custom identity.”
      </div>
    </div>
  );
};

// --- Main Dashboard Layout ---

const checkAuthSync = (): { authenticating: boolean; authorized: boolean } => {
  if (typeof window === 'undefined') {
    return { authenticating: true, authorized: false };
  }
  const token = localStorage.getItem('token');
  if (!token) {
    return { authenticating: true, authorized: false };
  }
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload && ADMIN_ROLES.includes(payload.role)) {
        return { authenticating: false, authorized: true };
      }
    }
  } catch (e) {
    console.error("JWT Decode failed sync", e);
  }
  return { authenticating: true, authorized: false };
};

const AdminDashboard = () => {
  const initialAuth = checkAuthSync();
  const [authenticating, setAuthenticating] = useState(initialAuth.authenticating);
  const [authorized, setAuthorized] = useState(initialAuth.authorized);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && ADMIN_ROLES.includes(payload.role)) {
          setAuthorized(true);
        } else {
          console.warn("Invalid role claim:", payload.role);
          navigate('/');
        }
      } else {
        navigate('/auth');
      }
    } catch (e) {
      console.error("JWT Decode failed", e);
      navigate('/auth');
    } finally {
      setAuthenticating(false);
    }
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  if (authenticating) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#fffdfa] text-center">
        <p className="text-2xl font-serif text-stone-400 italic animate-pulse">Authenticating access...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5EFE4] to-[#EBE2D0] text-charcoal dark:from-[#121212] dark:via-[#181818] dark:to-[#0f0f0f] dark:text-white flex flex-col md:flex-row pt-16 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white/70 dark:bg-[#161616]/75 border-r border-gold-300/30 dark:border-white/5 sticky top-16 h-[calc(100vh-64px)] p-6 backdrop-blur-xl z-20">
        <div className="space-y-6">
          <div className="px-2">
            <span className="text-[10px] font-bold tracking-widest text-gold-600 dark:text-gold-400 uppercase">Yashas Gallery</span>
            <h2 className="text-2xl font-serif font-bold text-charcoal dark:text-white mt-1 leading-tight">Admin <span className="text-gradient-gold">Panel</span></h2>
          </div>
          
          <nav className="space-y-2">
            <DashboardNavLink to="/admin" label="Overview" icon={<LayoutDashboard size={16} />} active={location.pathname === '/admin'} />
            <DashboardNavLink to="/admin/add-product" label="Add Product" icon={<PlusCircle size={16} />} active={location.pathname === '/admin/add-product'} />
            <DashboardNavLink to="/admin/manage-products" label="Inventory" icon={<Package size={16} />} active={location.pathname === '/admin/manage-products'} />
            <DashboardNavLink to="/admin/orders" label="Orders" icon={<MessageSquare size={16} />} active={location.pathname === '/admin/orders'} />
            <DashboardNavLink to="/admin/customers" label="Customers" icon={<User size={16} />} active={location.pathname === '/admin/customers'} />
            <DashboardNavLink to="/admin/admins" label="Manage Admins" icon={<ShieldCheck size={16} />} active={location.pathname === '/admin/admins'} />
            <DashboardNavLink to="/admin/analytics" label="Analytics" icon={<BarChart3 size={16} />} active={location.pathname === '/admin/analytics'} />
          </nav>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 font-semibold rounded-2xl hover:bg-rose-500/10 transition-all text-xs uppercase tracking-wider cursor-pointer border border-transparent hover:border-rose-500/10"
        >
          <LogOut size={16} />
          Sign Out
        </motion.button>
      </aside>

      {/* Mobile Toggle & Menu */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-[#161616] border-b border-stone-200 dark:border-white/10 text-charcoal dark:text-white z-30">
        <h2 className="text-xl font-serif font-bold">Admin <span className="text-gradient-gold">Panel</span></h2>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-stone-200 dark:border-white/10 rounded-xl bg-stone-50 dark:bg-white/5 text-charcoal dark:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white/95 dark:bg-[#161616]/95 backdrop-blur-md px-6 py-4 border-b border-stone-200 dark:border-white/10 space-y-2 absolute top-[116px] left-0 right-0 z-40 shadow-xl"
          >
            <DashboardNavLink to="/admin" label="Overview" icon={<LayoutDashboard size={16} />} active={location.pathname === '/admin'} />
            <DashboardNavLink to="/admin/add-product" label="Add Product" icon={<PlusCircle size={16} />} active={location.pathname === '/admin/add-product'} />
            <DashboardNavLink to="/admin/manage-products" label="Inventory" icon={<Package size={16} />} active={location.pathname === '/admin/manage-products'} />
            <DashboardNavLink to="/admin/orders" label="Orders" icon={<MessageSquare size={16} />} active={location.pathname === '/admin/orders'} />
            <DashboardNavLink to="/admin/customers" label="Customers" icon={<User size={16} />} active={location.pathname === '/admin/customers'} />
            <DashboardNavLink to="/admin/admins" label="Manage Admins" icon={<ShieldCheck size={16} />} active={location.pathname === '/admin/admins'} />
            <DashboardNavLink to="/admin/analytics" label="Analytics" icon={<BarChart3 size={16} />} active={location.pathname === '/admin/analytics'} />
            <button 
              onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 font-semibold rounded-2xl hover:bg-rose-500/10 transition-all text-xs uppercase tracking-wider text-left"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto w-full min-h-[calc(100vh-64px)] z-10">
  <Routes>
    <Route path="" element={<OverviewPage />} />
    <Route path="add-product" element={<AddProductPage />} />
    <Route path="manage-products" element={<InventoryPage />} />
    <Route path="orders" element={<OrdersPage />} />
    <Route path="customers" element={<CustomersPage />} />
    <Route path="admins" element={<ManageAdminsPage />} />
    <Route path="analytics" element={<AnalyticsPage />} />
  </Routes>
</main>
    </div>
  );
};

export default AdminDashboard;
