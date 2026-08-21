import { useState, useMemo, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useInView,
} from "framer-motion";
import {
  ShoppingBag,
  Heart,
  X,
  Minus,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Filter,
  Search,
  Moon,
  Sun,
  Sparkles,
  ArrowUpRight,
  Package,
  Truck,
  Shield,
} from "lucide-react";
import { PRODUCTS, CATEGORIES } from "./data";

const formatPrice = (n) => `$${n.toFixed(0)}`;

const ease = [0.22, 1, 0.36, 1];

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease },
};

// ── Safe 3D Tilt ──
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 220, damping: 22 });
  const mouseY = useSpring(y, { stiffness: 220, damping: 22 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [9, -9]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-9, 9]);

  function handleMouse(e) {
    try {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    } catch (_) {}
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Scroll reveal wrapper ──
function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    categories: [],
    priceMin: 0,
    priceMax: 600,
    rating: 0,
    inStockOnly: false,
  });
  const [sortBy, setSortBy] = useState("newest");
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [accordion, setAccordion] = useState(null);
  const [shipping, setShipping] = useState({
    firstName: "", lastName: "", email: "", address: "", city: "", zip: "",
  });
  const [payment, setPayment] = useState({
    cardNumber: "", expiry: "", cvc: "", name: "",
  });

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const addToCart = (product, colorIdx = 0, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.colorIdx === colorIdx);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.colorIdx === colorIdx ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, {
        id: product.id, name: product.name, price: product.price,
        image: product.images[0], colorIdx, colorName: product.colorNames[colorIdx], qty,
      }];
    });
    showToast(`${product.name} added to cart`);
  };

  const updateQty = (id, colorIdx, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id && i.colorIdx === colorIdx ? { ...i, qty: Math.max(0, i.qty + delta) } : i
      ).filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id, colorIdx) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.colorIdx === colorIdx)));
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) => prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]);
  };

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (filters.categories.length > 0) list = list.filter((p) => filters.categories.includes(p.category));
    list = list.filter((p) => p.price >= filters.priceMin && p.price <= filters.priceMax);
    if (filters.rating > 0) list = list.filter((p) => p.rating >= filters.rating);
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);
    switch (sortBy) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      default: list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }
    return list;
  }, [filters, sortBy, searchQuery]);

  const goHome = () => { setView("home"); window.scrollTo(0, 0); };
  const goShop = (category = null) => {
    setFilters((f) => ({ ...f, categories: category ? [category] : [] }));
    setView("shop"); window.scrollTo(0, 0);
  };
  const goProduct = (product) => {
    setSelectedProduct(product); setSelectedColor(0); setQuantity(1);
    setMainImageIdx(0); setAccordion(null); setView("product"); window.scrollTo(0, 0);
  };
  const goCheckout = () => {
    setCartOpen(false); setCheckoutStep(1); setOrderComplete(false);
    setView("checkout"); window.scrollTo(0, 0);
  };

  const handleAddFromDetail = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, selectedColor, quantity);
    setAddedFeedback(true);
    setTimeout(() => { setAddedFeedback(false); setCartOpen(true); }, 1400);
  };

  const placeOrder = () => {
    setOrderNumber(`NV-${Math.floor(100000 + Math.random() * 900000)}`);
    setOrderComplete(true); setCart([]);
  };

  const toggleDark = () => {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  // ── Navbar ──
  const Navbar = () => (
    <header className="sticky top-0 z-40 bg-cream/80 dark:bg-[#111113]/80 backdrop-blur-xl border-b border-ink/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={goHome} className="font-display text-2xl tracking-tight hover:opacity-70 transition-opacity">
          Nova
        </button>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          {["Home", "Shop"].map((label) => (
            <button
              key={label}
              onClick={label === "Home" ? goHome : () => goShop()}
              className={`transition-colors ${
                (label === "Home" && view === "home") || (label === "Shop" && view === "shop")
                  ? "text-terracotta" : "text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          {CATEGORIES.slice(0, 3).map((c) => (
            <button key={c} onClick={() => goShop(c)} className="text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors">
              {c}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-md hover:bg-ink/5 dark:hover:bg-white/5" aria-label="Search">
            <Search size={18} strokeWidth={1.5} />
          </button>
          <button onClick={toggleDark} className="p-2 rounded-md hover:bg-ink/5 dark:hover:bg-white/5" aria-label="Theme">
            {darkMode ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
          <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-md hover:bg-ink/5 dark:hover:bg-white/5" aria-label="Cart">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-terracotta text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </header>
  );

  // ── Search ──
  const SearchOverlay = () => (
    <AnimatePresence>
      {searchOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)} className="fixed inset-0 bg-ink/40 z-50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className="fixed top-0 inset-x-0 z-50 bg-cream dark:bg-[#161618] border-b border-ink/8 dark:border-white/8 shadow-lg">
            <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
              <Search size={20} className="text-ink/40 dark:text-white/40 flex-shrink-0" />
              <input autoFocus value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSearchOpen(false); goShop(); } }}
                placeholder="Search products, categories..."
                className="flex-1 bg-transparent text-base outline-none placeholder:text-ink/30 dark:placeholder:text-white/30" />
              <button onClick={() => { setSearchOpen(false); if (searchQuery) goShop(); }} className="text-sm font-medium text-terracotta">Search</button>
              <button onClick={() => setSearchOpen(false)}><X size={18} /></button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const Toast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium rounded-md shadow-lg flex items-center gap-2">
          <Check size={16} className="text-terracotta" /> {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Cart Drawer ──
  const CartDrawer = () => (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)} className="fixed inset-0 bg-ink/30 z-50" />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-cream dark:bg-[#161618] z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink/8 dark:border-white/8">
              <h2 className="font-display text-xl">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-white/5"><X size={20} strokeWidth={1.5} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <ShoppingBag size={48} strokeWidth={1} className="text-ink/20 dark:text-white/20" />
                  <p className="text-ink/50 dark:text-white/40 text-sm">Your cart is empty</p>
                  <button onClick={() => { setCartOpen(false); goShop(); }} className="text-sm font-medium text-terracotta hover:underline">Continue Shopping</button>
                </div>
              ) : (
                <ul className="space-y-5">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.li key={`${item.id}-${item.colorIdx}`} layout
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex gap-4">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md bg-ink/5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2">
                            <h3 className="text-sm font-medium truncate">{item.name}</h3>
                            <button onClick={() => removeFromCart(item.id, item.colorIdx)} className="text-ink/40 hover:text-ink dark:hover:text-white"><X size={14} /></button>
                          </div>
                          <p className="text-xs text-ink/50 dark:text-white/40 mt-0.5">{item.colorName}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-ink/10 dark:border-white/10 rounded-md">
                              <button onClick={() => updateQty(item.id, item.colorIdx, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-ink/5 dark:hover:bg-white/5"><Minus size={12} /></button>
                              <span className="w-7 text-center text-xs font-medium">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, item.colorIdx, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-ink/5 dark:hover:bg-white/5"><Plus size={12} /></button>
                            </div>
                            <span className="text-sm font-medium">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-ink/8 dark:border-white/8 px-6 py-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60 dark:text-white/50">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartSubtotal)}</span>
                </div>
                <button onClick={goCheckout} className="w-full py-3.5 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium tracking-wide rounded-md hover:opacity-90 transition-opacity">Checkout</button>
                <button onClick={() => setCartOpen(false)} className="w-full text-center text-sm text-ink/50 dark:text-white/40 hover:text-ink dark:hover:text-white">Continue Shopping</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // ── Product Card ──
  const ProductCard = ({ product, index = 0 }) => {
    const isWishlisted = wishlist.includes(product.id);
    return (
      <TiltCard>
        <motion.article
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: index * 0.06, ease }}
          className="group relative"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink/5 dark:bg-white/5 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
            <img src={product.images[0]} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06] cursor-pointer"
              onClick={() => goProduct(product)} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            {!product.inStock && (
              <span className="absolute top-3 left-3 bg-ink/80 text-cream text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm">Sold Out</span>
            )}
            {product.isNew && product.inStock && (
              <span className="absolute top-3 left-3 bg-terracotta text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm flex items-center gap-1">
                <Sparkles size={10} /> New
              </span>
            )}
            <button onClick={() => toggleWishlist(product.id)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-cream/90 dark:bg-[#161618]/90 backdrop-blur-sm">
              <motion.div whileTap={{ scale: 1.3 }}>
                <Heart size={16} strokeWidth={1.5}
                  className={isWishlisted ? "fill-terracotta text-terracotta" : "text-ink dark:text-white"} />
              </motion.div>
            </button>
            <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-out">
              <button disabled={!product.inStock}
                onClick={() => { addToCart(product); setCartOpen(true); }}
                className="w-full py-2.5 bg-ink dark:bg-white text-cream dark:text-ink text-xs font-medium tracking-wide rounded-md hover:opacity-90 disabled:opacity-40">
                Add to Cart
              </button>
            </div>
          </div>
          <div className="mt-3.5 space-y-1">
            <h3 onClick={() => goProduct(product)}
              className="text-sm font-medium cursor-pointer hover:text-terracotta transition-colors">{product.name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-terracotta font-medium">{formatPrice(product.price)}</span>
              <div className="flex items-center gap-1 text-xs text-ink/50 dark:text-white/40">
                <Star size={11} className="fill-current" /> {product.rating}
              </div>
            </div>
          </div>
        </motion.article>
      </TiltCard>
    );
  };

  // ══════════════════════════════════════
  // HOME — longer, editorial, portfolio-ready
  // ══════════════════════════════════════
  const HomeView = () => (
    <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="color-grade">

      {/* 1. HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F2EC] via-cream to-[#EDE6DC] dark:from-[#161618] dark:via-[#111113] dark:to-[#0c0c0e]" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] right-[10%] w-36 h-36 rounded-full bg-gradient-to-br from-terracotta/25 to-terracotta/5 blur-2xl animate-float glow-terracotta" />
          <div className="absolute top-[42%] right-[26%] w-24 h-24 rounded-lg rotate-12 bg-forest/10 blur-xl animate-float-slow" />
          <div className="absolute bottom-[18%] right-[6%] w-48 h-48 rounded-full bg-sand/30 dark:bg-white/5 blur-3xl animate-float-delayed" />
          <div className="absolute top-[28%] right-[16%] w-28 h-28 border border-terracotta/20 rounded-full animate-float-slow" />
          <div className="absolute bottom-[32%] right-[20%] w-14 h-14 border border-forest/20 rotate-45 animate-float" />
        </div>
        <div className="absolute right-0 top-0 w-[50%] h-full hidden lg:block">
          <motion.img
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 0.92, scale: 1 }}
            transition={{ duration: 1.2, ease }}
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&q=80"
            alt="Featured" className="w-full h-full object-cover dark:opacity-65" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/55 to-transparent dark:from-[#111113] dark:via-[#111113]/65 dark:to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 z-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease }} className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-terracotta mb-5 flex items-center gap-2">
              <Sparkles size={12} /> Autumn 2026 Collection
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.5rem] leading-[1.02] tracking-tight mb-6">
              Objects of<br />quiet intention
            </h1>
            <p className="text-ink/55 dark:text-white/45 text-base sm:text-lg leading-relaxed mb-10 max-w-md">
              Tech accessories designed to disappear into daily life — until the moment you need them most.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => goShop()}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-terracotta text-white text-sm font-medium tracking-wide rounded-md hover:bg-terracotta/90 transition-colors glow-terracotta">
                Explore Collection <ChevronRight size={16} />
              </button>
              <button onClick={() => goShop("Watches")}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-ink/12 dark:border-white/12 text-sm font-medium rounded-md hover:bg-ink/5 dark:hover:bg-white/5 transition-colors">
                View Watches
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS STRIP */}
      <section className="border-y border-ink/6 dark:border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: "16+", l: "Curated products" },
            { n: "4.8", l: "Average rating" },
            { n: "2yr", l: "Warranty" },
            { n: "30d", l: "Free returns" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 0.08} className="text-center md:text-left">
              <p className="font-display text-3xl sm:text-4xl text-terracotta mb-1">{s.n}</p>
              <p className="text-xs uppercase tracking-wider text-ink/45 dark:text-white/35">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. FEATURED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Reveal className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta mb-2">Selection</p>
            <h2 className="font-display text-3xl sm:text-4xl">Featured pieces</h2>
          </div>
          <button onClick={() => goShop()} className="hidden sm:flex items-center gap-1 text-sm text-ink/50 dark:text-white/40 hover:text-terracotta transition-colors">
            View all <ArrowUpRight size={14} />
          </button>
        </Reveal>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
          {PRODUCTS.filter((p) => p.isNew || p.rating >= 4.7).slice(0, 6).map((p, i) => (
            <div key={p.id} className="min-w-[260px] sm:min-w-[290px]">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. EDITORIAL SPLIT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <div className="aspect-[4/5] overflow-hidden rounded-md relative">
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80"
                alt="Craft" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta mb-4">Philosophy</p>
            <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-6">
              Designed to be used,<br />not displayed
            </h2>
            <p className="text-ink/55 dark:text-white/45 leading-relaxed mb-6">
              Every Nova product starts with a single question: what can we remove without losing the soul of the object? The result is a collection that feels inevitable — quiet forms, honest materials, and interfaces that respect your attention.
            </p>
            <p className="text-ink/55 dark:text-white/45 leading-relaxed mb-8">
              We work with small workshops and tested materials. No seasonal noise. Just pieces that age with you.
            </p>
            <button onClick={() => goShop()}
              className="inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:gap-3 transition-all">
              Discover the collection <ChevronRight size={16} />
            </button>
          </Reveal>
        </div>
      </section>

      <div className="editorial-line max-w-7xl mx-auto" />

      {/* 5. CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Reveal className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-terracotta mb-2">Categories</p>
          <h2 className="font-display text-3xl sm:text-4xl">Shop by type</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { cat: "Headphones", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" },
            { cat: "Watches", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80" },
            { cat: "Bags", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80" },
            { cat: "Accessories", img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80" },
          ].map((item, i) => (
            <Reveal key={item.cat} delay={i * 0.07}>
              <button onClick={() => goShop(item.cat)}
                className="group relative aspect-[3/4] overflow-hidden rounded-md w-full text-left">
                <img src={item.img} alt={item.cat}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-ink/30 group-hover:bg-ink/45 transition-colors duration-400" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <span className="font-display text-2xl text-white">{item.cat}</span>
                  <p className="text-white/60 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Explore →</p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. VALUES */}
      <section className="bg-ink/[0.02] dark:bg-white/[0.02] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta mb-2">Why Nova</p>
            <h2 className="font-display text-3xl sm:text-4xl">Built differently</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Package, t: "Material honesty", d: "Aluminum, full-grain leather, and textile that age with character — never plastic that pretends." },
              { icon: Truck, t: "Thoughtful delivery", d: "Carbon-offset shipping, recycled packaging, and free returns within 30 days. No surprises." },
              { icon: Shield, t: "Two-year promise", d: "Every product is covered. If something fails under normal use, we repair or replace it." },
            ].map((v, i) => (
              <Reveal key={v.t} delay={i * 0.1} className="text-center md:text-left">
                <div className="inline-flex p-3 rounded-md bg-terracotta/10 text-terracotta mb-5">
                  <v.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl mb-3">{v.t}</h3>
                <p className="text-sm text-ink/55 dark:text-white/45 leading-relaxed">{v.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. LOOKBOOK GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Reveal className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta mb-2">Lookbook</p>
            <h2 className="font-display text-3xl sm:text-4xl">In the wild</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&q=80",
            "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=700&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=80",
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&q=80",
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&q=80",
            "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=700&q=80",
          ].map((src, i) => (
            <Reveal key={i} delay={i * 0.05}
              className={`overflow-hidden rounded-md ${i === 0 || i === 5 ? "row-span-1 aspect-square" : "aspect-[4/5]"}`}>
              <motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }}
                src={src} alt="" className="w-full h-full object-cover" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 8. TESTIMONIAL */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-terracotta mb-8">From customers</p>
          <blockquote className="font-display text-2xl sm:text-3xl leading-snug mb-8">
            “The Aura headphones disappeared into my routine within a week. I forget I’m wearing them — until someone asks what they are.”
          </blockquote>
          <p className="text-sm text-ink/45 dark:text-white/35">— Maya R., Product Designer</p>
        </Reveal>
      </section>

      <div className="editorial-line max-w-7xl mx-auto" />

      {/* 9. NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Reveal className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl mb-4">Stay in the quiet</h2>
          <p className="text-sm text-ink/50 dark:text-white/40 mb-8">
            New drops, material notes, and the occasional essay. No noise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="email" placeholder="Your email"
              className="flex-1 px-4 py-3.5 bg-white dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-md text-sm focus:outline-none focus:border-terracotta transition-colors" />
            <button className="px-7 py-3.5 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium rounded-md hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </div>
        </Reveal>
      </section>
    </motion.div>
  );

  // ── Filters ──
  const FilterSidebar = ({ mobile = false }) => (
    <div className={`space-y-8 ${mobile ? "p-6" : ""}`}>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-ink/50 dark:text-white/40 mb-4">Category</h3>
        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={filters.categories.includes(cat)}
                onChange={() => setFilters((f) => ({
                  ...f,
                  categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat],
                }))}
                className="w-3.5 h-3.5 rounded-sm border-ink/20 text-terracotta focus:ring-terracotta/30" />
              <span className="text-sm text-ink/70 dark:text-white/60 group-hover:text-ink dark:group-hover:text-white">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-ink/50 dark:text-white/40 mb-4">
          Price · {formatPrice(filters.priceMin)} – {formatPrice(filters.priceMax)}
        </h3>
        <input type="range" min="0" max="600" step="10" value={filters.priceMax}
          onChange={(e) => setFilters((f) => ({ ...f, priceMax: Number(e.target.value) }))} className="w-full" />
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-ink/50 dark:text-white/40 mb-4">Minimum Rating</h3>
        <div className="flex gap-1 flex-wrap">
          {[0, 3, 4, 4.5].map((r) => (
            <button key={r} onClick={() => setFilters((f) => ({ ...f, rating: r }))}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                filters.rating === r ? "border-terracotta text-terracotta bg-terracotta/5" : "border-ink/10 dark:border-white/10 text-ink/60 dark:text-white/50"
              }`}>{r === 0 ? "Any" : `${r}+`}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={filters.inStockOnly}
            onChange={() => setFilters((f) => ({ ...f, inStockOnly: !f.inStockOnly }))}
            className="w-3.5 h-3.5 rounded-sm border-ink/20 text-terracotta focus:ring-terracotta/30" />
          <span className="text-sm text-ink/70 dark:text-white/60">In stock only</span>
        </label>
      </div>
      <button onClick={() => setFilters({ categories: [], priceMin: 0, priceMax: 600, rating: 0, inStockOnly: false })}
        className="text-xs text-ink/40 dark:text-white/30 hover:text-terracotta">Clear all filters</button>
    </div>
  );

  // ── SHOP ──
  const ShopView = () => (
    <motion.div key="shop" variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 color-grade">
      <div className="mb-10">
        <h1 className="font-display text-4xl mb-2">Shop</h1>
        <p className="text-sm text-ink/50 dark:text-white/40">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          {searchQuery && ` for “${searchQuery}”`}
        </p>
      </div>
      <div className="flex gap-10">
        <aside className="hidden lg:block w-56 flex-shrink-0"><FilterSidebar /></aside>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8 gap-4">
            <button onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 text-sm border border-ink/10 dark:border-white/10 px-3 py-2 rounded-md">
              <Filter size={14} /> Filters
            </button>
            <div className="flex-1" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-ink/10 dark:border-white/10 rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-terracotta">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center text-ink/40 dark:text-white/30 text-sm">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
              {filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)} className="fixed inset-0 bg-ink/30 z-50 lg:hidden" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 max-h-[80vh] overflow-y-auto bg-cream dark:bg-[#161618] rounded-t-2xl z-50 lg:hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8 dark:border-white/8">
                <h3 className="font-medium">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}><X size={18} /></button>
              </div>
              <FilterSidebar mobile />
              <div className="p-6 pt-0">
                <button onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium rounded-md">
                  Show {filteredProducts.length} results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ── PRODUCT ──
  const ProductView = () => {
    if (!selectedProduct) return null;
    const p = selectedProduct;
    return (
      <motion.div key="product" variants={pageVariants} initial="initial" animate="animate" exit="exit"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 color-grade">
        <button onClick={() => goShop()} className="flex items-center gap-1 text-sm text-ink/50 dark:text-white/40 hover:text-ink dark:hover:text-white mb-10">
          <ChevronLeft size={14} /> Back to Shop
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="aspect-square overflow-hidden rounded-md bg-ink/5 dark:bg-white/5 mb-3">
              <AnimatePresence mode="wait">
                <motion.img key={mainImageIdx} src={p.images[mainImageIdx]} alt={p.name}
                  initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }} className="w-full h-full object-cover" />
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {p.images.map((img, i) => (
                <button key={i} onClick={() => setMainImageIdx(i)}
                  className={`aspect-square overflow-hidden rounded-md border-2 transition-colors ${mainImageIdx === i ? "border-terracotta" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink/40 dark:text-white/30 mb-2">{p.category}</p>
            <h1 className="font-display text-3xl sm:text-4xl mb-4">{p.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl font-medium text-terracotta">{formatPrice(p.price)}</span>
              <div className="flex items-center gap-1 text-sm text-ink/50 dark:text-white/40">
                <Star size={13} className="fill-current" /> {p.rating} · {p.reviews} reviews
              </div>
            </div>
            <p className="text-sm text-ink/60 dark:text-white/50 leading-relaxed mb-8">{p.description}</p>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-ink/40 dark:text-white/30 mb-3">Color · {p.colorNames[selectedColor]}</p>
              <div className="flex gap-2.5">
                {p.colors.map((c, i) => (
                  <button key={i} onClick={() => setSelectedColor(i)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === i ? "border-terracotta scale-110" : "border-transparent hover:scale-105"}`}
                    style={{ backgroundColor: c }} aria-label={p.colorNames[i]} />
                ))}
              </div>
            </div>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wider text-ink/40 dark:text-white/30 mb-3">Quantity</p>
              <div className="inline-flex items-center border border-ink/10 dark:border-white/10 rounded-md">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-ink/5 dark:hover:bg-white/5"><Minus size={14} /></button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-ink/5 dark:hover:bg-white/5"><Plus size={14} /></button>
              </div>
            </div>
            <button disabled={!p.inStock || addedFeedback} onClick={handleAddFromDetail}
              className="w-full py-4 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium tracking-wide rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              <AnimatePresence mode="wait">
                {addedFeedback ? (
                  <motion.span key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <Check size={16} /> Added!
                  </motion.span>
                ) : (
                  <motion.span key="b" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {p.inStock ? "Add to Cart" : "Sold Out"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <div className="mt-10 border-t border-ink/8 dark:border-white/8">
              {["Details", "Shipping", "Reviews"].map((title) => (
                <div key={title} className="border-b border-ink/8 dark:border-white/8">
                  <button onClick={() => setAccordion(accordion === title ? null : title)}
                    className="w-full flex items-center justify-between py-4 text-sm font-medium">
                    {title}
                    <motion.span animate={{ rotate: accordion === title ? 45 : 0 }}><Plus size={16} strokeWidth={1.5} /></motion.span>
                  </button>
                  <AnimatePresence>
                    {accordion === title && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="pb-4 text-sm text-ink/55 dark:text-white/45 leading-relaxed">
                          {title === "Details" && "Premium materials, precision engineering, and a 2-year limited warranty."}
                          {title === "Shipping" && "Free standard shipping on orders over $75. Returns within 30 days."}
                          {title === "Reviews" && `Rated ${p.rating}/5 from ${p.reviews} verified reviews.`}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── CHECKOUT ──
  const CheckoutView = () => {
    if (orderComplete) {
      return (
        <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto px-4 py-28 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-terracotta flex items-center justify-center glow-terracotta">
            <Check size={28} className="text-terracotta" strokeWidth={2} />
          </div>
          <h1 className="font-display text-3xl mb-3">Order Confirmed</h1>
          <p className="text-sm text-ink/50 dark:text-white/40 mb-2">Thank you for your purchase.</p>
          <p className="text-sm font-medium mb-8">Order number: <span className="text-terracotta">{orderNumber}</span></p>
          <button onClick={goHome} className="px-6 py-3 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium rounded-md">Continue Shopping</button>
        </motion.div>
      );
    }
    const steps = ["Shipping", "Payment", "Confirm"];
    return (
      <motion.div key="checkout" variants={pageVariants} initial="initial" animate="animate" exit="exit"
        className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <h1 className="font-display text-3xl mb-12 text-center">Checkout</h1>
        <div className="flex items-center justify-center mb-14">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                checkoutStep > i + 1 ? "bg-terracotta text-white" :
                checkoutStep === i + 1 ? "bg-ink dark:bg-white text-cream dark:text-ink" : "bg-ink/10 dark:bg-white/10 text-ink/40"
              }`}>{checkoutStep > i + 1 ? <Check size={14} /> : i + 1}</div>
              <span className={`ml-2 text-xs hidden sm:block ${checkoutStep === i + 1 ? "" : "text-ink/40 dark:text-white/30"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-12 sm:w-20 h-px mx-3 ${checkoutStep > i + 1 ? "bg-terracotta" : "bg-ink/10 dark:bg-white/10"}`} />}
            </div>
          ))}
        </div>
        {checkoutStep === 1 && (
          <div className="space-y-5 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">First name</label>
                <input value={shipping.firstName} onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">Last name</label>
                <input value={shipping.lastName} onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">Email</label>
              <input type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
            </div>
            <div>
              <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">Address</label>
              <input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">City</label>
                <input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">ZIP</label>
                <input value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                  className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
              </div>
            </div>
            <button onClick={() => setCheckoutStep(2)}
              className="w-full py-3.5 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium rounded-md mt-4">Continue to Payment</button>
          </div>
        )}
        {checkoutStep === 2 && (
          <div className="space-y-5 max-w-md mx-auto">
            <div>
              <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">Card number</label>
              <input value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                placeholder="4242 4242 4242 4242"
                className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">Expiry</label>
                <input value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} placeholder="MM/YY"
                  className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">CVC</label>
                <input value={payment.cvc} onChange={(e) => setPayment({ ...payment, cvc: e.target.value })} placeholder="123"
                  className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 dark:text-white/40 mb-1.5 block">Name on card</label>
              <input value={payment.name} onChange={(e) => setPayment({ ...payment, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-ink/10 dark:border-white/10 rounded-md text-sm bg-transparent focus:outline-none focus:border-terracotta" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setCheckoutStep(1)} className="flex-1 py-3.5 border border-ink/15 dark:border-white/15 text-sm font-medium rounded-md">Back</button>
              <button onClick={() => setCheckoutStep(3)} className="flex-1 py-3.5 bg-ink dark:bg-white text-cream dark:text-ink text-sm font-medium rounded-md">Review Order</button>
            </div>
          </div>
        )}
        {checkoutStep === 3 && (
          <div className="max-w-md mx-auto">
            <div className="border border-ink/10 dark:border-white/10 rounded-md p-6 mb-6 space-y-4">
              <h3 className="text-sm font-medium mb-3">Order Summary</h3>
              {cart.length === 0 ? <p className="text-sm text-ink/40">No items</p> : cart.map((item) => (
                <div key={`${item.id}-${item.colorIdx}`} className="flex justify-between text-sm">
                  <span className="text-ink/70 dark:text-white/60">{item.name} × {item.qty}</span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t border-ink/8 dark:border-white/8 pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span className="text-terracotta">{formatPrice(cartSubtotal)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCheckoutStep(2)} className="flex-1 py-3.5 border border-ink/15 dark:border-white/15 text-sm font-medium rounded-md">Back</button>
              <button onClick={placeOrder} disabled={cart.length === 0}
                className="flex-1 py-3.5 bg-terracotta text-white text-sm font-medium rounded-md disabled:opacity-40">Place Order</button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const Footer = () => (
    <footer className="border-t border-ink/8 dark:border-white/8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl">Nova</span>
          <p className="text-xs text-ink/40 dark:text-white/30">© {new Date().getFullYear()} Nova Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-[#111113] text-ink dark:text-[#F5F3EF] transition-colors duration-300">
      <Navbar />
      <SearchOverlay />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === "home" && <HomeView />}
          {view === "shop" && <ShopView />}
          {view === "product" && <ProductView />}
          {view === "checkout" && <CheckoutView />}
        </AnimatePresence>
      </main>
      {view !== "checkout" && <Footer />}
      <CartDrawer />
      <Toast />
    </div>
  );
}
