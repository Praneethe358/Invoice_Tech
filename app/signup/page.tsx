'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { validateEmail, validatePhone, validateGSTIN } from '@/lib/validators';
import { STARTER_CATALOGS, ShopType } from '@/lib/starter-catalogs';

const stepTitles = [
  'Basic Information',
  'Business Category',
  'Tax Registration',
  'Inventory Settings',
  'Starter Catalog'
];

interface CatalogItemState {
  id: string;
  name: string;
  price: string;
  hsn_code: string;
  gst_rate: number;
  category?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if user is logged in and already has a shop
  useEffect(() => {
    const checkExistingShop = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        if (shop) {
          router.push('/dashboard');
        }
      }
    };
    checkExistingShop();
  }, [router]);

  // Step 1: Basic Info
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Shop Type
  const [shopType, setShopType] = useState<ShopType>('clothing');

  // Step 3: GST
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [gstinError, setGstinError] = useState('');

  // Step 4: Inventory
  const [inventoryEnabled, setInventoryEnabled] = useState(false);

  // Step 5: Catalog Setup
  const [catalogItems, setCatalogItems] = useState<CatalogItemState[]>([]);

  // Add Item to Catalog states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemHsn, setNewItemHsn] = useState('');
  const [newItemGst, setNewItemGst] = useState('0');

  // Load starter catalog when shopType changes
  useEffect(() => {
    const starter = STARTER_CATALOGS[shopType] || [];
    setCatalogItems(
      starter.map((item, idx) => ({
        id: `starter-${idx}`,
        name: item.name,
        price: '',
        hsn_code: item.hsn_code,
        gst_rate: item.gst_rate,
        category: item.category,
      }))
    );
  }, [shopType]);

  // GSTIN Validator real-time message
  useEffect(() => {
    if (gstRegistered && gstin) {
      if (!validateGSTIN(gstin)) {
        setGstinError('Invalid GSTIN format (e.g. 33AAAAA1111A1Z1)');
      } else {
        setGstinError('');
      }
    } else {
      setGstinError('');
    }
  }, [gstin, gstRegistered]);

  // Business Type Helper
  const getBusinessType = (type: ShopType): 'products' | 'services' | 'both' => {
    if (type === 'tailoring' || type === 'salon') return 'services';
    if (type === 'food' || type === 'other') return 'both';
    return 'products';
  };

  const isServiceOnly = shopType === 'tailoring' || shopType === 'salon';

  // Navigation handlers
  const nextStep = () => {
    if (step === 1) {
      if (!shopName.trim() || shopName.trim().length < 2) {
        showToast('Shop name must be at least 2 characters', 'error');
        return;
      }
      if (!ownerName.trim() || ownerName.trim().length < 2) {
        showToast('Owner name must be at least 2 characters', 'error');
        return;
      }
      if (!validatePhone(phone)) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
      }
      if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (gstRegistered) {
        if (!gstin.trim()) {
          showToast('GSTIN is required if GST registered', 'error');
          return;
        }
        if (!validateGSTIN(gstin)) {
          showToast('Please enter a valid GSTIN format', 'error');
          return;
        }
      }
      if (isServiceOnly) {
        // Skip inventory for services, directly to Step 5
        setStep(5);
      } else {
        setStep(4);
      }
    } else if (step === 4) {
      setStep(5);
    }
  };

  const prevStep = () => {
    if (step === 5) {
      if (isServiceOnly) {
        setStep(3);
      } else {
        setStep(4);
      }
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Catalog item handlers
  const handleUpdatePrice = (id: string, priceStr: string) => {
    const cleanVal = priceStr.replace(/[^0-9.]/g, '');
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: cleanVal } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setCatalogItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCatalogItem = () => {
    if (!newItemName.trim()) {
      showToast('Item name is required', 'error');
      return;
    }
    if (!newItemPrice || parseFloat(newItemPrice) <= 0) {
      showToast('Please set a valid price', 'error');
      return;
    }
    const newItem: CatalogItemState = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      price: newItemPrice,
      hsn_code: newItemHsn.trim(),
      gst_rate: parseFloat(newItemGst) || 0,
    };
    setCatalogItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemHsn('');
    setNewItemGst('0');
    setShowAddForm(false);
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== 5) return;

    // Validate prices on submit
    const invalidItems = catalogItems.filter(
      (item) => !item.price || parseFloat(item.price) <= 0
    );
    if (invalidItems.length > 0) {
      showToast(
        'Please enter a valid price for all remaining products or delete them.',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            owner_name: ownerName.trim(),
          },
        },
      });

      if (authError) {
        showToast(authError.message, 'error');
        setLoading(false);
        return;
      }
      if (!authData.user) {
        showToast('Signup failed.', 'error');
        setLoading(false);
        return;
      }

      // Step 2: Create Shop row
      const bType = getBusinessType(shopType);
      const { data: newShop, error: shopError } = await supabase
        .from('shops')
        .insert({
          auth_user_id: authData.user.id,
          name: shopName.trim(),
          phone: phone.trim(),
          shop_type: shopType,
          gst_registered: gstRegistered,
          gstin: gstRegistered ? gstin.trim().toUpperCase() : null,
          business_type: bType,
          inventory_enabled: isServiceOnly ? false : inventoryEnabled,
          onboarding_completed: true,
        })
        .select('id')
        .single();

      if (shopError || !newShop) {
        console.error(shopError);
        showToast('Account created but shop setup failed.', 'error');
        setLoading(false);
        return;
      }

      // Step 3: Insert starter catalog products
      if (catalogItems.length > 0) {
        const productsToInsert = catalogItems.map((item) => ({
          shop_id: newShop.id,
          name: item.name,
          price: parseFloat(item.price),
          hsn_code: item.hsn_code || null,
          gst_rate: item.gst_rate || 0,
          category: item.category || null,
        }));
        const { error: productsError } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (productsError) {
          console.error('Failed to pre-populate starter catalog:', productsError);
          // Non-fatal, user is already signed up and shop is created
        }
      }

      showToast('Welcome to TruBill Invoice!', 'success');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Signup failed', 'error');
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero gradient-hero-mesh relative items-center justify-center p-12 overflow-hidden">
        <Link
          href="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm transition-colors group z-20"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </Link>

        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-10 h-10 object-contain brightness-0 invert" />
            <span className="font-heading font-black text-xl text-white">TruBill</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Start invoicing<br />in <span className="bg-gradient-to-r from-blue-300 to-[#0050e8] bg-clip-text text-transparent">2 minutes</span>.
          </h2>
          <p className="text-[#e6efff]/80 text-base leading-relaxed">
            Quick, Professional WhatsApp invoice delivery platform for shops in Tamil Nadu. GST details auto-breakdown, PDF generator, and contact saved catalogs.
          </p>

          <motion.div
            initial={{ y: 20, opacity: 0, rotate: 2 }}
            animate={{ y: [0, 10, 0], opacity: 1, rotate: [2, 1, 2] }}
            transition={{
              opacity: { duration: 0.6 },
              y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 9, ease: 'easeInOut' }
            }}
            className="mt-10 p-5 rounded-2xl glass-card border border-white/10 shadow-2xl relative max-w-sm mx-auto lg:mx-0 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[11.5px] font-bold text-white leading-none">Shop Registered!</p>
              <p className="text-[9.5px] text-blue-300 font-semibold mt-1">Free plan activated instantly</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 bg-[#f8fafc] relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none lg:hidden" />

        <div className="w-full max-w-[460px] my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-8 h-8 object-contain shrink-0" />
            <span className="font-heading font-black text-xl text-[#1a1d26] tracking-tight">TruBill</span>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:p-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-[#0050e8] h-full transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-[#0050e8] uppercase tracking-wider">
                Step {step} of 5 — {stepTitles[step - 1]}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Let's create your account</h1>
                    <p className="text-xs text-[#6b7280]">Enter details about you and your business.</p>
                    <Input
                      label="Shop Name"
                      placeholder="e.g. Sri Lakshmi Stores"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                    />
                    <Input
                      label="Owner Name"
                      placeholder="e.g. Kumar Murugan"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                    <Input
                      label="WhatsApp Mobile Number"
                      placeholder="9876543210"
                      prefix="+91"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!shopName || !ownerName || !phone || !email || !password || !confirmPassword}
                      className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 min-h-[44px]"
                    >
                      <span>Continue</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Select shop category</h1>
                    <p className="text-xs text-[#6b7280]">This will load starter inventory catalogs & standard GST codes.</p>
                    
                    <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {([
                        { type: 'clothing', label: 'Clothing / Textiles', emoji: '👗' },
                        { type: 'tailoring', label: 'Tailoring Shop', emoji: '🪡' },
                        { type: 'fertilizer', label: 'Agri / Fertilizer', emoji: '🌱' },
                        { type: 'grocery', label: 'Grocery / Kirana', emoji: '🛒' },
                        { type: 'pharmacy', label: 'Medical / Pharmacy', emoji: '💊' },
                        { type: 'hardware', label: 'Hardware Store', emoji: '🔨' },
                        { type: 'food', label: 'Food / Restaurant', emoji: '🍳' },
                        { type: 'electronics', label: 'Mobile / Electronics', emoji: '⚡' },
                        { type: 'salon', label: 'Salon / Beauty', emoji: '💈' },
                        { type: 'other', label: 'Other Business', emoji: '📦' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setShopType(opt.type)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all ${
                            shopType === opt.type
                              ? 'border-[#0050e8] bg-[#0050e8]/5 shadow-sm'
                              : 'border-slate-250 bg-white hover:bg-[#f9fafb]'
                          }`}
                        >
                          <span className="text-2xl">{opt.emoji}</span>
                          <span className="text-xs font-bold text-slate-800 leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Tax settings</h1>
                    <p className="text-xs text-[#6b7280]">Enable tax handling if your business is registered for GST.</p>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">GST Registration</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Handle tax components on invoices</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGstRegistered(!gstRegistered)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          gstRegistered ? 'bg-[#0050e8]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            gstRegistered ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {gstRegistered && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <Input
                          label="Shop GSTIN (15-character)"
                          placeholder="e.g. 33AAAAA1111A1Z1"
                          maxLength={15}
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value.toUpperCase())}
                          error={gstinError}
                          required
                        />
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Tamil Nadu state code is 33. Format: State code (2 digits) + PAN (10 chars) + Entity identifier (3 chars).
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={gstRegistered && (!gstin || !!gstinError)}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Inventory settings</h1>
                    <p className="text-xs text-[#6b7280]">Enable inventory tracking for products to monitor stock quantities.</p>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Enable Inventory Tracking</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Alerts when items run low</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInventoryEnabled(!inventoryEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          inventoryEnabled ? 'bg-[#0050e8]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            inventoryEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Set starter catalog prices</h1>
                    <p className="text-xs text-[#6b7280]">
                      Provide default unit prices (₹) for these items. Delete any items you don't sell.
                    </p>

                    <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                      {catalogItems.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                          No items in catalog. Add a custom item below.
                        </div>
                      ) : (
                        catalogItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                HSN: {item.hsn_code || '—'} {item.gst_rate > 0 ? `• GST: ${item.gst_rate}%` : ''}
                              </p>
                            </div>
                            <div className="w-24 shrink-0 flex items-center bg-white border border-slate-250 rounded-xl px-2 min-h-[38px]">
                              <span className="text-xs text-slate-400 mr-1 font-bold">₹</span>
                              <input
                                type="text"
                                value={item.price}
                                onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                                placeholder="0"
                                className="w-full text-xs font-bold text-slate-800 focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Custom Item form inline toggler */}
                    {!showAddForm ? (
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="text-xs font-bold text-[#0050e8] hover:underline"
                      >
                        + Add custom product to catalog
                      </button>
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-2xl space-y-3 bg-[#fbfcfb]">
                        <p className="text-[10px] font-bold text-[#0050e8] uppercase tracking-wider">New Custom Catalog Item</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Product Name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                          />
                          <Input
                            placeholder="Price (₹)"
                            type="number"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="HSN Code (optional)"
                            value={newItemHsn}
                            onChange={(e) => setNewItemHsn(e.target.value)}
                          />
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">GST Rate (%)</label>
                            <select
                              value={newItemGst}
                              onChange={(e) => setNewItemGst(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
                            >
                              <option value="0">0% GST</option>
                              <option value="5">5% GST</option>
                              <option value="12">12% GST</option>
                              <option value="18">18% GST</option>
                              <option value="28">28% GST</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCatalogItem}
                            className="px-3 py-1.5 bg-[#0050e8] hover:bg-[#0043c4] text-white rounded-lg text-xs font-semibold"
                          >
                            Add Item
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSignupSubmit}
                        disabled={loading}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <span>Finish & Register</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-sm text-[#6b7280] mt-8">
              Already have an account?{' '}
              <Link href="/login" className="text-[#0050e8] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-8 font-semibold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>Secured by TruBill • SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
