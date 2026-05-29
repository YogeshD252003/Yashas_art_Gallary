import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { WishlistProvider, useWishlist, ArtPiece } from './WishlistContext';
import { CartProvider, useCart } from './CartContext';
import { LogOut, User as UserIcon, Heart, ShoppingBag, MapPin, Phone, Mail, ChevronRight, Lock, Eye, EyeOff, Loader2, ShieldCheck, Clock, History, Palette, Sun, Moon, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { FEATURED_ARTWORKS } from './constants/artPieces';
import AdminDashboard from './AdminDashboard';
import { UserOrdersPanel } from './components/UserOrdersPanel';
import { PlaceOrderModal, OrderItemInput, parsePriceValue } from './components/PlaceOrderModal';
import { ProductCard } from './components/ProductCard';
import { OrderProcessGuide } from './components/OrderProcessGuide';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

// --- Theme Context ---

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'light';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// --- Components ---

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { wishlist } = useWishlist();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ivory/90 dark:bg-dark-bg/90 backdrop-blur-md transition-colors duration-300">
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold-dark/30 to-transparent dark:via-gold/30" />
      <div className="px-4 sm:px-6 py-3 flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="text-lg sm:text-2xl font-serif font-bold text-charcoal dark:text-white tracking-wider" onClick={() => setMenuOpen(false)}>
          YASHAS <span className="text-gold-dark">ART GALLERY</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-charcoal dark:text-white/80 font-medium hover:text-gold-dark transition-colors">Home</Link>
          <Link to="/cart" className="relative text-charcoal dark:text-white/80 hover:text-gold-dark transition-colors">
            <ShoppingBag size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold-dark text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{itemCount}</span>
            )}
          </Link>
          <Link to="/wishlist" className="relative text-charcoal dark:text-white/80 hover:text-gold-dark transition-colors">
            <Heart size={22} className={wishlist.length > 0 ? "fill-gold-dark text-gold-dark" : ""} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{wishlist.length}</span>
            )}
          </Link>
          <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-gold/10 dark:bg-white/5 flex items-center justify-center text-gold-dark dark:text-white hover:bg-gold/20 transition-all" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold-dark transition-colors">
                <UserIcon size={20} />
                <span className="font-medium">{(user.full_name || user.fullName || "Admin").split(' ')[0]}</span>
              </Link>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-charcoal/80 dark:text-white/60 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="text-charcoal dark:text-white font-medium hover:text-gold-dark transition-colors">Login</Link>
              <Link to="/register" className="btn-gold py-1.5 px-4 text-sm">Join Now</Link>
            </div>
          )}
        </div>

        {/* Mobile: icons + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <Link to="/cart" className="relative text-charcoal dark:text-white/80">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold-dark text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{itemCount}</span>
            )}
          </Link>
          <Link to="/wishlist" className="relative text-charcoal dark:text-white/80">
            <Heart size={20} className={wishlist.length > 0 ? "fill-gold-dark text-gold-dark" : ""} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{wishlist.length}</span>
            )}
          </Link>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold-dark" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 flex flex-col justify-center items-center gap-1.5" aria-label="Menu">
            <span className={`block w-5 h-0.5 bg-charcoal dark:bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-charcoal dark:bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-charcoal dark:bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-ivory/95 dark:bg-dark-bg/95 backdrop-blur-md border-t border-gold/20 dark:border-white/10 px-6 py-4 flex flex-col gap-4">
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-charcoal dark:text-white font-medium hover:text-gold-dark transition-colors py-2 border-b border-gold/10">Home</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)} className="text-charcoal dark:text-white font-medium hover:text-gold-dark py-2 border-b border-gold/10">Cart ({itemCount})</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-charcoal dark:text-white font-medium hover:text-gold-dark py-2 border-b border-gold/10">
                <UserIcon size={18} /> {user.full_name || user.fullName || "Admin"}
              </Link>
              <button onClick={() => { logout(); navigate('/login'); setMenuOpen(false); }} className="text-red-500 font-medium text-left py-2 flex items-center gap-2">
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-charcoal dark:text-white font-medium hover:text-gold-dark transition-colors py-2">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-gold text-center py-2.5">Join Now</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Pages ---

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalogProducts, setCatalogProducts] = React.useState<any[]>([]);
  const [orderItem, setOrderItem] = React.useState<OrderItemInput | null>(null);
  const [orderModalOpen, setOrderModalOpen] = React.useState(false);
  const [orderSuccess, setOrderSuccess] = React.useState('');

  React.useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then(setCatalogProducts)
      .catch(() => setCatalogProducts([]));
  }, []);

  const handleBuyNow = (item: OrderItemInput) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setOrderItem(item);
    setOrderModalOpen(true);
  };

  const galleryItems = catalogProducts.length > 0
    ? catalogProducts.map((p) => ({
        id: p.id,
        title: p.name,
        artist: p.category || 'Gallery',
        price: `₹${Number(p.price).toLocaleString('en-IN')}`,
        numericPrice: Number(p.price),
        image: p.images?.[0] || '',
        category: p.category,
        description: p.description,
        stock: p.stock,
        productId: p.id,
      }))
    : FEATURED_ARTWORKS.map((a) => ({
        ...a,
        numericPrice: parsePriceValue(a.price),
        productId: undefined as string | undefined,
        description: 'Handcrafted gallery piece',
        stock: 5,
      }));
  
  return (
    <div className="pt-24 sm:pt-32 px-4 sm:px-6 min-h-screen pb-20 relative overflow-hidden">
      {/* Ambient Backdrop Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10 opacity-40 dark:opacity-30">
        <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] rounded-full bg-gold-200/50 dark:bg-gold-900/10 blur-[130px]" />
        <div className="absolute top-[15%] right-[10%] w-[450px] h-[450px] rounded-full bg-amber-200/40 dark:bg-gold-800/5 blur-[160px]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto text-center"
      >
        <h1 className="text-4xl sm:text-6xl md:text-8xl mb-4 sm:mb-6 dark:text-white text-charcoal font-bold leading-tight font-serif tracking-tight">
          Experience Art with <span className="text-gradient-gold">Intelligence</span>
        </h1>
        <p className="text-base sm:text-xl text-charcoal/80 dark:text-white/80 mb-8 sm:mb-12 font-sans max-w-2xl mx-auto font-medium px-2 leading-relaxed">
          Handcrafted treasures, personalized for your most precious moments. 
          Step into a world where every masterpiece tells a beautiful story.
        </p>

        {orderSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-medium max-w-xl mx-auto">
            {orderSuccess} <Link to="/dashboard" className="underline font-bold ml-1">View orders</Link>
          </div>
        )}
        
        {user ? (
          <div className="flex justify-center gap-4">
            <Link to="/dashboard" className="btn-gold text-sm sm:text-base">Go to Your Gallery Dashboard</Link>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-gold text-sm sm:text-base">Create Exclusive Account</Link>
          </div>
        )}

        {/* Featured Artworks */}
        <div className="mt-16 sm:mt-32 text-left">
          <h2 className="text-3xl sm:text-5xl mb-8 sm:mb-12 flex items-center gap-4 font-serif font-bold text-charcoal dark:text-white tracking-tight">
            <span className="w-8 sm:w-12 h-[2px] bg-gradient-to-r from-gold-600 to-transparent dark:from-gold block"></span>
            Featured <span className="text-gradient-gold">Artworks</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {galleryItems.map((artwork) => (
              <ProductCard
                key={artwork.id}
                product={artwork}
                onBuyNow={() =>
                  handleBuyNow({
                    productId: artwork.productId,
                    name: artwork.title,
                    price: artwork.numericPrice,
                    image: artwork.image,
                  })
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-12 sm:mt-32 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {[
            { title: "Personalized", icon: <ShoppingBag />, desc: "Custom photo frames & crafts" },
            { title: "Home Decor", icon: <Heart />, desc: "Artistic ornaments & lamps" },
            { title: "Smart Discovery", icon: <UserIcon />, desc: "AI-powered gift assistance" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl"
            >
              <div className="w-12 h-12 bg-gold/30 rounded-2xl flex items-center justify-center mb-4 text-gold-dark mx-auto">
                {item.icon}
              </div>
              <h3 className="text-xl mb-2 dark:text-white font-bold text-charcoal">{item.title}</h3>
              <p className="text-sm text-charcoal/85 dark:text-white/65 font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <PlaceOrderModal
        open={orderModalOpen}
        onClose={() => { setOrderModalOpen(false); setOrderItem(null); }}
        item={orderItem}
        onSuccess={(orderNumber) => {
          setOrderSuccess(`Order ${orderNumber} placed successfully!`);
          setTimeout(() => setOrderSuccess(''), 8000);
        }}
      />
    </div>
  );
};

const LoginPage = () => {
  const [activeTab, setActiveTab] = React.useState<'email' | 'mobile'>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [devOtp, setDevOtp] = React.useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const decodeToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (e) {
      return null;
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.userId);
        const decoded = decodeToken(data.token);
        const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER'];
        if (decoded?.role && adminRoles.includes(decoded.role)) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setDevOtp(data.dev_otp);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.userId);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 sm:pt-32 px-4 sm:px-6 flex justify-center pb-16">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem]"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl mb-2 font-serif font-bold text-charcoal dark:text-white tracking-tight">
              Welcome <span className="text-gradient-gold">Back</span>
            </h2>
            <p className="text-sm text-charcoal/60 dark:text-white/60 font-medium">Choose your preferred credentials to enter the gallery</p>
          </div>

          <div className="flex mb-8 p-1 bg-gold/10 dark:bg-white/5 rounded-xl">
            <button 
              onClick={() => { setActiveTab('email'); setIsOtpSent(false); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${activeTab === 'email' ? 'bg-white dark:bg-white/10 shadow-sm text-charcoal dark:text-white' : 'text-charcoal/70 dark:text-white/55'}`}
            >
              Email
            </button>
            <button 
              onClick={() => { setActiveTab('mobile'); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${activeTab === 'mobile' ? 'bg-white dark:bg-white/10 shadow-sm text-charcoal dark:text-white' : 'text-charcoal/70 dark:text-white/55'}`}
            >
              Mobile
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">{error}</div>}

          {activeTab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-medium">Password</label>
                  <Link to="/forgot-password" size="sm" className="text-xs text-gold-dark hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-field pr-10" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/65 dark:text-white/55"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-gold/30 text-gold-dark focus:ring-gold"
                />
                <label htmlFor="remember" className="text-sm text-charcoal/80 dark:text-white/75">Remember me for 30 days</label>
              </div>
              <button disabled={loading} className="w-full btn-gold py-3 mt-4 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Login to Gallery"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMobileLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Mobile Number</label>
                <div className="flex gap-2">
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="+91 00000 00000"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    disabled={isOtpSent}
                    required
                  />
                  {!isOtpSent && (
                    <button 
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || !mobileNumber}
                      className="px-5 py-[0.625rem] border-2 border-transparent bg-gold/20 hover:bg-gold/40 dark:bg-white/10 dark:hover:bg-white/20 text-gold-dark dark:text-gold text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center justify-center"
                    >
                      {loading ? "..." : "Send OTP"}
                    </button>
                  )}
                </div>
              </div>
              
              {isOtpSent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Verification Code</label>
                    <input 
                      type="text" 
                      className="input-field text-center tracking-[1em] font-bold text-xl" 
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      required
                    />
                    {devOtp && <p className="text-[10px] text-gold-dark text-center">Dev Environment OTP: {devOtp}</p>}
                  </div>
                  <button disabled={loading} className="w-full btn-gold py-3 mt-4 flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Login"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsOtpSent(false)}
                    className="w-full text-center text-xs text-charcoal/65 dark:text-white/55 hover:text-charcoal dark:hover:text-white transition-colors underline"
                  >
                    Change mobile number
                  </button>
                </motion.div>
              )}
            </form>
          )}

          <p className="mt-8 text-center text-charcoal dark:text-white/80 font-medium">
            Don't have an exclusive account? <Link to="/register" className="text-gold-dark font-bold hover:underline">Register now</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const [formData, setFormData] = React.useState({
    full_name: '',
    email: '',
    password: '',
    mobile_number: '',
    age: '',
    location: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        login(data.token, data.userId);
        navigate('/dashboard');
      } else {
        setError(data.error || `Registration failed (${res.status}). Make sure the server is running with: npm run dev`);
      }
    } catch (err) {
      setError('Cannot reach the API server. Stop other dev servers, then run: npm run dev');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 sm:pt-32 px-4 sm:px-6 flex justify-center pb-20">
      <div className="w-full max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem]"
        >
          <h2 className="text-3xl sm:text-4xl mb-2 font-serif font-bold text-charcoal dark:text-white tracking-tight">
            Join the <span className="text-gradient-gold">Gallery</span>
          </h2>
          <p className="text-sm text-charcoal/60 dark:text-white/60 mb-6 sm:mb-8 font-sans font-medium">Create an exclusive account to unlock personalized art experiences</p>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">Full Name</label>
              <input 
                id="full_name"
                name="full_name"
                type="text" 
                className="input-field" 
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                required
                autoComplete="name"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <input 
                id="email"
                name="email"
                type="email" 
                className="input-field" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="mobile_number" className="text-sm font-medium">Mobile Number</label>
              <input 
                id="mobile_number"
                name="mobile_number"
                type="tel" 
                className="input-field"
                value={formData.mobile_number}
                onChange={e => setFormData({...formData, mobile_number: e.target.value})}
                required
                autoComplete="tel"
                placeholder="+91 00000 00000"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="age" className="text-sm font-medium">Age</label>
              <input 
                id="age"
                name="age"
                type="number" 
                className="input-field" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <input 
                id="location"
                name="location"
                type="text" 
                className="input-field" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                className="input-field" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="col-span-full pt-4">
              <button disabled={loading} className="w-full btn-gold py-4 text-lg">
                {loading ? "Processing..." : "Create Account"}
              </button>
            </div>
          </form>


          <p className="mt-8 text-center text-charcoal/80 dark:text-white/70">
            Already have an account? <Link to="/login" className="text-gold-dark font-medium hover:underline">Login here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const WishlistPage = () => {
    const { wishlist, removeFromWishlist } = useWishlist();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orderItem, setOrderItem] = React.useState<OrderItemInput | null>(null);
    const [orderModalOpen, setOrderModalOpen] = React.useState(false);

    const handleBuyNow = (artwork: ArtPiece) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setOrderItem({
            name: artwork.title,
            price: parsePriceValue(artwork.price),
            image: artwork.image,
        });
        setOrderModalOpen(true);
    };

    return (
        <div className="pt-32 px-6 flex justify-center pb-20">
            <div className="w-full max-w-6xl">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h2 className="text-5xl italic mb-2 dark:text-white font-bold text-charcoal">Your Wishlist</h2>
                        <p className="text-charcoal/80 dark:text-white/65 font-medium">Items you've fallen in love with</p>
                    </div>
                    <Link to="/" className="text-gold-dark font-bold hover:underline">Explore More Art</Link>
                </header>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {wishlist.map((artwork) => (
                                <motion.div 
                                    key={artwork.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass group rounded-[2rem] overflow-hidden"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden">
                                        <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                            <div>
                                                <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">{artwork.category}</span>
                                                <h4 className="text-xl text-white font-serif italic">{artwork.title}</h4>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeFromWishlist(artwork.id)}
                                            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-red-500 transition-all backdrop-blur-md"
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-charcoal/75 dark:text-white/60 lowercase italic">Artist</p>
                                            <p className="font-bold text-sm dark:text-white/80">{artwork.artist}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5">
                                            <p className="text-sm font-serif font-bold text-gold-dark">{artwork.price}</p>
                                            <button
                                                type="button"
                                                onClick={() => handleBuyNow(artwork)}
                                                className="text-[10px] uppercase font-bold tracking-widest bg-gold-dark/10 hover:bg-gold-dark text-gold-dark hover:text-white px-3 py-1.5 rounded-full transition-all"
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-24 glass rounded-[3rem] border border-gold-300/20 dark:border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-gold-100/5 to-transparent dark:from-white/[0.01] dark:to-transparent pointer-events-none" />
                        <div className="w-24 h-24 bg-gradient-to-br from-gold-100 to-gold-50 dark:from-white/5 dark:to-white/10 rounded-3xl flex items-center justify-center text-gold-700 dark:text-gold mx-auto mb-6 shadow-inner relative group hover:scale-110 transition-transform duration-300">
                            <Heart size={44} className="fill-gold-400/20 dark:fill-gold/10 text-gold-500 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-charcoal dark:text-white mb-4">Your wishlist is empty</h3>
                        <p className="text-sm text-charcoal/60 dark:text-white/60 mb-8 max-w-sm mx-auto leading-relaxed">Discover unique art pieces and handcrafted treasures to fill your private collection.</p>
                        <Link to="/" className="btn-gold py-3 px-10 inline-block">Start Discovering</Link>
                    </div>
                )}
            </div>

            <PlaceOrderModal
                open={orderModalOpen}
                onClose={() => { setOrderModalOpen(false); setOrderItem(null); }}
                item={orderItem}
                onSuccess={() => navigate('/dashboard')}
            />
        </div>
    );
};

const DashboardPage = () => {
    const { user, token, logout, loading: authLoading } = useAuth();
    const { wishlist } = useWishlist();
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const orderPlaced = (routerLocation.state as { orderPlaced?: string } | null)?.orderPlaced;
    const [loginHistory, setLoginHistory] = React.useState<any[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        full_name: '',
        location: '',
        age: ''
    });
    const [updateLoading, setUpdateLoading] = React.useState(false);
    const [orderCount, setOrderCount] = React.useState(0);

    React.useEffect(() => {
        if (user) {
            setEditForm({
                full_name: user.full_name || user.fullName || '',
                location: user.location || '',
                age: user.age?.toString() || ''
            });
        }
    }, [user]);

    React.useEffect(() => {
        const fetchOrderCount = async () => {
            if (!token) return;
            try {
                const res = await fetch('/api/user/orders', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrderCount(data.length);
                }
            } catch {
                /* ignore */
            }
        };
        fetchOrderCount();
    }, [token]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setUpdateLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                // We need to refresh the profile in AuthContext
                // For now, let's just reload or trigger a re-fetch
                window.location.reload(); // Simplest way to refresh AuthContext
            }
        } catch (err) {
            console.error("Update failed");
        } finally {
            setUpdateLoading(false);
            setIsEditModalOpen(false);
        }
    };

    React.useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            try {
                const res = await fetch('/api/user/login-history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLoginHistory(data);
                }
            } catch (err) {
                console.error("Failed to fetch history");
            }
        };
        fetchHistory();
    }, [token]);

    if (authLoading) {
        return (
            <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-gold-dark mb-4" size={48} />
                <p className="text-charcoal/60 italic">Personalizing your gallery dashboard...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    return (
        <div className="pt-32 px-6 flex justify-center pb-20">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* User Stats/Profile Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="glass overflow-hidden rounded-[2.5rem] p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-gold-300 to-gold-600 dark:from-gold-dark dark:to-gold-700 rounded-3xl shadow-lg flex items-center justify-center text-white mb-4">
                                <UserIcon size={48} />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-charcoal dark:text-white mb-1">{user.full_name || user.fullName || "Admin"}</h2>
                            <p className="text-xs text-charcoal/50 dark:text-white/50 mb-6 font-semibold uppercase tracking-wider">{user.email}</p>
                            <span className="px-4 py-1.5 bg-gold-100/40 dark:bg-gold-dark/20 text-gold-700 dark:text-gold rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-gold-300/30 dark:border-white/10 shadow-sm">
                                Platinum Member
                            </span>
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="mt-4 text-xs text-gold-dark font-bold hover:underline"
                            >
                                Edit Profile
                            </button>
                        </div>

                        <div className="mt-10 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-gold/10">
                                <div className="text-gold-dark"><Phone size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-charcoal/77 dark:text-white/50 uppercase font-bold">Mobile</p>
                                    <p className="font-bold text-sm dark:text-white/80 text-charcoal">{user.mobile_number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-gold/10">
                                <div className="text-gold-dark"><MapPin size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-charcoal/77 dark:text-white/50 uppercase font-bold">Location</p>
                                    <p className="font-bold text-sm dark:text-white/80 text-charcoal">{user.location || "Earth"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-gold/10">
                                <div className="text-gold-dark"><Clock size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-charcoal/77 dark:text-white/50 uppercase font-bold">Age</p>
                                    <p className="font-bold text-sm dark:text-white/80 text-charcoal">{user.age || "Unknown"}</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => { logout(); navigate('/'); }} className="w-full mt-8 py-3 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-colors flex items-center justify-center gap-2">
                             <LogOut size={18} /> Logout session
                        </button>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem]">
                        <h3 className="text-xl italic mb-4 flex items-center gap-2 dark:text-white/90">
                            <Palette size={20} className="text-gold-dark" /> Preferences
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {["Custom Frames", "Abstract Art", "Resin Crafts", "Antique Style"].map(pref => (
                                <span key={pref} className="px-3 py-1 bg-white/50 dark:bg-white/10 border border-gold/15 rounded-lg text-xs text-charcoal/80 dark:text-white/70">
                                    {pref}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dashboard Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {orderPlaced && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                            Order <strong>{orderPlaced}</strong> confirmed! Track progress below.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-charcoal dark:text-white font-medium">
                        <div className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-white/40 to-gold/10 dark:from-white/5 dark:to-white/10 border border-gold-300/20 dark:border-white/5">
                            <h4 className="text-charcoal/60 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Package size={12} /> My Orders
                            </h4>
                            <p className="text-4xl font-serif dark:text-white font-bold text-charcoal">
                                {orderCount.toString().padStart(2, '0')}{' '}
                                <span className="text-sm text-charcoal/60 dark:text-white/50 lowercase italic">Total</span>
                            </p>
                        </div>
                        <Link to="/cart" className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-white/40 to-gold/10 dark:from-white/5 dark:to-white/10 block hover:scale-[1.02] transition-transform border border-gold-300/20 dark:border-white/5">
                            <h4 className="text-charcoal/60 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <ShoppingBag size={12} /> Cart
                            </h4>
                            <p className="text-4xl font-serif dark:text-white font-bold text-charcoal">
                                {itemCount.toString().padStart(2, '0')}{' '}
                                <span className="text-sm text-charcoal/60 dark:text-white/50 lowercase italic">Items</span>
                            </p>
                        </Link>
                        <Link to="/wishlist" className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-white/40 to-gold/10 dark:from-white/5 dark:to-white/10 block hover:scale-[1.02] transition-transform border border-gold-300/20 dark:border-white/5">
                            <h4 className="text-charcoal/60 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">My Wishlist</h4>
                            <p className="text-4xl font-serif dark:text-white font-bold text-charcoal">{wishlist.length.toString().padStart(2, '0')} <span className="text-sm text-charcoal/60 dark:text-white/50 lowercase italic">Saved</span></p>
                        </Link>
                    </div>

                    <OrderProcessGuide />

                    <UserOrdersPanel token={token} />

                    {wishlist.length > 0 && (
                        <div className="glass p-8 rounded-[2.5rem]">
                            <h3 className="text-xl italic mb-6 dark:text-white font-bold">Wishlist Preview</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {wishlist.slice(0, 4).map(item => (
                                    <div key={item.id} className="min-w-[120px] max-w-[120px] group relative">
                                        <div className="aspect-square rounded-2xl overflow-hidden mb-2">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] font-bold truncate dark:text-white/80">{item.title}</p>
                                    </div>
                                ))}
                                {wishlist.length > 4 && (
                                    <Link to="/wishlist" className="min-w-[120px] flex flex-col items-center justify-center bg-gold/10 dark:bg-white/5 rounded-2xl border border-dashed border-gold/30">
                                        <span className="text-gold-dark font-bold">+{wishlist.length - 4} More</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="glass p-8 rounded-[2.5rem]">
                        <h3 className="text-2xl italic mb-6 flex items-center gap-2 dark:text-white/90">
                            <History size={24} className="text-gold-dark" /> Recent Intelligence Syncs
                        </h3>
                        <div className="space-y-4">
                            {loginHistory.length > 0 ? loginHistory.map((login, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-gold/5 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gold/10 dark:bg-white/10 rounded-xl flex items-center justify-center text-gold-dark">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm dark:text-white/80">{login.method}</p>
                                            <p className="text-xs text-charcoal/65 dark:text-white/55">{new Date(login.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded uppercase font-bold">Success</span>
                                </div>
                            )) : (
                                <p className="text-charcoal/65 dark:text-white/55 text-sm italic">No recent activity found.</p>
                            )}
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem]">
                        <h3 className="text-2xl italic mb-4 dark:text-white">Your Intelligence Assistant</h3>
                        <div className="p-6 bg-gradient-to-br from-gold-600 to-gold-800 dark:from-gold-dark dark:to-gold-700 text-white rounded-3xl shadow-lg shadow-gold-600/10 dark:shadow-black/20 border border-gold-500/20">
                            <p className="italic mb-4 text-white/95 leading-relaxed font-serif text-base">"Based on your location in {user.location || 'your area'}, we recommend exploring our 'Desert Sands' collection for your next home decor upgrade."</p>
                            <Link to="/" className="text-xs uppercase font-extrabold tracking-widest flex items-center gap-1.5 hover:gap-2.5 transition-all text-white hover:underline">
                                Explore Recommendations <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-dark-bg rounded-[2.5rem] p-10 shadow-2xl border border-gold/20 dark:border-white/10"
                        >
                            <h3 className="text-3xl italic mb-6 font-bold dark:text-white">Edit Your Profile</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        value={editForm.full_name}
                                        onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Location</label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        value={editForm.location}
                                        onChange={e => setEditForm({...editForm, location: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Age</label>
                                    <input 
                                        type="number" 
                                        className="input-field" 
                                        value={editForm.age}
                                        onChange={e => setEditForm({...editForm, age: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-charcoal dark:text-white/80 font-bold transition-all hover:bg-gray-200 dark:hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={updateLoading}
                                        className="flex-1 btn-gold py-3 flex justify-center items-center gap-2"
                                    >
                                        {updateLoading ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
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

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
          <ThemeProvider>
            <div className="min-h-screen font-sans">
              <Toaster position="top-center" toastOptions={{ className: 'text-sm font-medium' }} />
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<LoginPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/admin-login" element={<Navigate to="/login" replace />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              
              <footer className="py-12 px-6 border-t border-gold/20 dark:border-white/10 text-center bg-white/50 dark:bg-black/20 transition-colors duration-300">
                 <Link to="/" className="text-xl font-serif font-bold text-charcoal dark:text-white tracking-wider mb-4 block">
                    YASHAS <span className="text-gold-dark font-serif">ART GALLERY</span>
                  </Link>
                  <p className="text-sm text-charcoal/65 dark:text-white/55 mb-6">Handmade with love & Intelligence. © 2024 Yashas Art Gallery.</p>
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-600 dark:text-gold hover:text-gold-700 dark:hover:text-white border border-gold-300/50 dark:border-white/15 px-4 py-1.5 rounded-full transition-all bg-gold-100/10 hover:bg-gold-100/25 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 active:scale-95 uppercase tracking-wider text-[10px]">
                    <Lock size={12} className="text-gold-600 dark:text-gold" />
                    <span>Portal Access</span>
                  </Link>
              </footer>
            </div>
          </ThemeProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
