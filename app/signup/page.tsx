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
  'Tax & Inventory Settings',
  'Catalog Setup'
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

  // Clear/initialize starter catalog empty for all shops
  useEffect(() => {
    setCatalogItems([]);
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
      if (shopType === 'footwear') {
        handleSignupSubmit();
      } else {
        setStep(4);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
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

  const handleSignupSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (shopType !== 'footwear' && step !== 4) return;

    // Validate prices on submit (only if NOT footwear shop)
    if (shopType !== 'footwear') {
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
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt,
        })
        .select('id')
        .single();

      if (shopError || !newShop) {
        console.error(shopError);
        showToast('Account created but shop setup failed.', 'error');
        setLoading(false);
        return;
      }

      // Send welcome WhatsApp message (non-blocking)
      try {
        await fetch('/api/signup/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerName: ownerName.trim(),
            shopName: shopName.trim(),
            phone: phone.trim(),
          }),
        });
      } catch (e) {
        console.error('Welcome WhatsApp send trigger failed:', e);
      }

      // Step 3: Insert starter catalog products
      if (shopType === 'footwear') {
        // Purged starter data seeding for footwear shops as requested
      } else if (catalogItems.length > 0) {
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
            <span className="font-heading font-black text-xl">
              <span className="text-white">Tru</span>
              <span style={{ color: '#93c5fd' }}>Bill</span>
            </span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Start invoicing<br />in <span className="bg-gradient-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent">2 minutes</span>.
          </h2>
          <p className="text-[#e6efff]/80 text-base leading-relaxed">
            Quick, Professional WhatsApp invoice delivery platform for shops in Tamil Nadu. GST details auto-breakdown, PDF generator, and contact saved catalogs.
          </p>


        </div>
      </div>

      {/* Right — Form (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-4 py-8 bg-[#f8fafc] bg-[radial-gradient(circle_at_top_right,rgba(0,80,232,0.06),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(0,80,232,0.04),transparent_45%)] relative overflow-y-auto overflow-x-hidden">
        {/* Glow backdrop for glassmorphism */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-[#0050e8]/15 to-blue-500/10 blur-[70px] pointer-events-none" />

        {/* Mobile Header / Navigation */}
        <div className="lg:hidden w-full max-w-[460px] flex items-center justify-start mb-4 z-20">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-805 font-extrabold text-xs transition-colors group"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Home
          </Link>
        </div>

        <div className="w-full max-w-[460px] my-auto relative z-10">
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] rounded-[30px] p-6 sm:p-8">
            {/* Logo inside signup section */}
            <div className="flex items-center justify-start gap-2.5 mb-6">
              <img src="/trubill-logo.png" alt="TruBill Logo" className="w-7 h-7 object-contain shrink-0" />
              <span className="font-heading font-black text-lg tracking-tight">
                <span className="text-[#001048]">Tru</span>
                <span className="text-[#0050e8]">Bill</span>
              </span>
            </div>

             {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-[#0050e8] h-full transition-all duration-300"
                  style={{ width: `${(step / stepTitles.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-[#0050e8] uppercase tracking-wider">
                Step {step} of {stepTitles.length} — {stepTitles[step - 1]}
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
                      className="w-full bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white font-bold py-3 rounded-xl transition-all disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4 min-h-[44px]"
                    >
                      <span>Continue</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 5" />
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
                        { type: 'footwear', label: 'Footwear Shop', emoji: '👟' },
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
                          className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between h-20 sm:h-24 transition-all active:scale-[0.97] ${
                            shopType === opt.type
                              ? 'border-[#0050e8] bg-gradient-to-br from-blue-50/70 to-indigo-50/20 shadow-xs ring-1 ring-[#0050e8]/30'
                              : 'border-slate-150 bg-white hover:bg-[#f9fafb]'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                          <span className="text-[10px] sm:text-xs font-black text-slate-850 leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {shopType === 'footwear' && (
                      <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-2xl text-[10px] font-semibold text-[#0050e8] flex items-start gap-2.5 shadow-2xs">
                        <span className="text-sm shrink-0">💡</span>
                        <div>
                          <p className="font-extrabold text-blue-900 uppercase tracking-wide">Footwear Shop Selected</p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">
                            Footwear shops skip the manual catalog pricing wizard. We will pre-load 10 products with size (5-12) & color variant matrix configurations automatically.
                          </p>
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
                        onClick={nextStep}
                        className="flex-1 bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Tax & Inventory settings</h1>
                    <p className="text-xs text-[#6b7280]">Configure tax handling and stock tracking rules for your shop.</p>

                    <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/5 rounded-2xl border border-slate-150 flex items-center justify-between shadow-3xs">
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
                        <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
                          Tamil Nadu state code is 33. Format: State code (2 digits) + PAN (10 chars) + Entity identifier (3 chars).
                        </p>
                      </motion.div>
                    )}

                    {!isServiceOnly && (
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/5 rounded-2xl border border-slate-150 flex items-center justify-between shadow-3xs">
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
                        className="flex-1 bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white font-bold py-3 rounded-xl transition-all disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Set starter catalog prices</h1>
                    <p className="text-xs text-[#6b7280]">
                      Provide default unit prices (₹) for these items. Delete any items you don't sell.
                    </p>

                    <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {catalogItems.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                          No items in catalog. Add a custom item below.
                        </div>
                      ) : (
                        catalogItems.map((item, idx) => {
                          const colors = [
                            'from-blue-500/10 to-indigo-500/10 text-blue-600',
                            'from-emerald-500/10 to-teal-500/10 text-emerald-600',
                            'from-violet-500/10 to-purple-500/10 text-violet-600',
                            'from-amber-500/10 to-orange-500/10 text-amber-600',
                            'from-pink-500/10 to-rose-500/10 text-pink-600',
                          ];
                          const colorClass = colors[idx % colors.length];

                          return (
                            <div
                              key={item.id}
                              className="group flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-slate-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] rounded-2xl transition-all duration-200"
                            >
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${colorClass} flex items-center justify-center shrink-0 font-bold text-sm tracking-wide`}>
                                {item.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {item.hsn_code && (
                                    <span className="bg-slate-100/80 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200/30">
                                      HSN {item.hsn_code}
                                    </span>
                                  )}
                                  <span className="bg-blue-50/80 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-blue-100/30">
                                    GST {item.gst_rate}%
                                  </span>
                                </div>
                              </div>

                              <div className="w-24 shrink-0 flex items-center bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus-within:border-[#0050e8] focus-within:ring-2 focus-within:ring-[#0050e8]/10 rounded-xl px-2.5 transition-all duration-200 min-h-[38px]">
                                <span className="text-xs text-slate-400 mr-1 font-bold">₹</span>
                                <input
                                  type="text"
                                  value={item.price}
                                  onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                                  placeholder="0"
                                  className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="w-8 h-8 rounded-xl bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 flex items-center justify-center shrink-0 transition-colors opacity-80 hover:opacity-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Custom Item form inline toggler */}
                    {!showAddForm ? (
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-3 border border-dashed border-slate-200 hover:border-[#0050e8] hover:bg-[#0050e8]/5 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#0050e8] transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add custom product to catalog
                      </button>
                    ) : (
                      <div className="p-4 border border-dashed border-[#0050e8]/30 rounded-2xl space-y-3 bg-gradient-to-br from-blue-50/40 to-indigo-50/5 relative overflow-hidden">
                        <p className="text-[10px] font-extrabold text-[#0050e8] uppercase tracking-wider">New Custom Catalog Item</p>
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
                              className="w-full bg-white border border-slate-200 focus:border-[#0050e8] rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                            >
                              <option value="0">0% GST</option>
                              <option value="5">5% GST</option>
                              <option value="12">12% GST</option>
                              <option value="18">18% GST</option>
                              <option value="28">28% GST</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCatalogItem}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 transition-all active:scale-[0.98]"
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
                        className="flex-1 bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
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

            <p className="text-center text-sm text-[#6b7280] mt-8 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-[#0050e8] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Bottom Security Badges */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8a99ad] mt-6 font-bold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-[#aebecf]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>Secured by TruBill • SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE LAYOUT ==================== */}
      <div className="lg:hidden w-full min-h-screen flex flex-col bg-gradient-to-b from-[#0050e8] via-[#003bb5] to-[#001c66] relative overflow-hidden">
        {/* Decorative blurred orbs */}
        <div className="absolute top-[-15%] right-[-20%] w-80 h-80 rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-15%] w-64 h-64 rounded-full bg-indigo-500/15 blur-[80px] pointer-events-none" />

        {/* Top Branding */}
        <div className="flex flex-col items-center text-center pt-12 pb-5 px-6 relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-9 h-9 object-contain brightness-0 invert" />
            <span className="font-heading font-black text-[26px] tracking-tight text-white">
              TruBill
            </span>
          </div>
          <p className="text-blue-200/80 text-[13px] font-semibold max-w-[280px] leading-relaxed">
            GST Invoicing made simple for Tamil Nadu retail.
          </p>
        </div>

        {/* Floating Card */}
        <div className="flex-1 flex flex-col px-5 pb-6 relative z-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-[430px] mx-auto"
          >
          <div className="bg-white rounded-[26px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 space-y-5">
            {/* Back Home Link */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-[#0050e8] hover:text-[#0043c4] font-bold text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Home
            </Link>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-[#0050e8] h-full transition-all duration-300"
                  style={{ width: `${(step / stepTitles.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-[#0050e8] uppercase tracking-wider">
                Step {step} of {stepTitles.length} — {stepTitles[step - 1]}
              </p>
            </div>

            {/* Dynamic Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Let's create your account</h1>
                      <p className="text-xs text-slate-400 font-medium">Enter details about you and your business.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Shop Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sri Lakshmi Stores"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Owner Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Kumar Murugan"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">WhatsApp Mobile Number</label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-sm font-bold text-slate-500">+91</span>
                        <input
                          type="text"
                          placeholder="9876543210"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full rounded-r-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Email Address</label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!shopName || !ownerName || !phone || !email || !password || !confirmPassword}
                      className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-500/20"
                    >
                      <span>Continue</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 5" />
                      </svg>
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Select shop category</h1>
                      <p className="text-xs text-slate-400 font-medium">Starter catalog & standard GST codes will load automatically.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {([
                        { type: 'clothing', label: 'Clothing / Textiles', emoji: '👗' },
                        { type: 'footwear', label: 'Footwear Shop', emoji: '👟' },
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
                          className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all active:scale-[0.97] cursor-pointer ${
                            shopType === opt.type
                              ? 'border-[#0050e8] bg-gradient-to-br from-blue-50/70 to-indigo-50/20 ring-1 ring-[#0050e8]/30'
                              : 'border-slate-150 bg-white hover:bg-[#f9fafb]'
                          }`}
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          <span className="text-[10px] font-black text-slate-800 leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {shopType === 'footwear' && (
                      <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-[10px] font-semibold text-[#0050e8] flex items-start gap-2.5 shadow-2xs">
                        <span className="text-sm shrink-0">💡</span>
                        <div>
                          <p className="font-extrabold text-blue-900 uppercase tracking-wide">Footwear Shop Selected</p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">
                            Footwear shops skip manual pricing wizard. We will pre-load 10 products with size & color variant matrices automatically.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Tax & Inventory settings</h1>
                      <p className="text-xs text-slate-400 font-medium">Configure tax handling and stock tracking rules for your shop.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between shadow-3xs">
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
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500">Shop GSTIN (15-character)</label>
                          <input
                            type="text"
                            placeholder="e.g. 33AAAAA1111A1Z1"
                            maxLength={15}
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            required
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                          />
                        </div>
                        {gstinError && <p className="text-[10px] text-red-500 font-semibold">{gstinError}</p>}
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Tamil Nadu state code is 33. state code (2 digits) + PAN (10 chars) + Entity identifier (3 chars).
                        </p>
                      </motion.div>
                    )}

                    {!isServiceOnly && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between shadow-3xs">
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
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={gstRegistered && (!gstin || !!gstinError)}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Continue</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">Set starter catalog prices</h1>
                      <p className="text-xs text-slate-400 font-medium">Provide default unit prices (₹). Delete any items you don't sell.</p>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {catalogItems.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                          No items in catalog. Add a custom item below.
                        </div>
                      ) : (
                        catalogItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl transition-all"
                          >
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0050e8] flex items-center justify-center shrink-0 font-bold text-xs">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-805 truncate">{item.name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">GST {item.gst_rate}%</p>
                            </div>
                            <div className="w-20 shrink-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 min-h-[34px]">
                              <span className="text-xs text-slate-400 mr-0.5 font-bold">₹</span>
                              <input
                                type="text"
                                value={item.price}
                                onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                                className="w-full text-xs font-bold text-slate-808 bg-transparent focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {!showAddForm ? (
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-2.5 border border-dashed border-slate-200 hover:border-[#0050e8] hover:bg-[#0050e8]/5 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-[#0050e8] transition-all cursor-pointer"
                      >
                        Add custom product to catalog
                      </button>
                    ) : (
                      <div className="p-3 border border-dashed border-[#0050e8]/30 rounded-xl space-y-2 bg-slate-50">
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none bg-white"
                          />
                          <select
                            value={newItemGst}
                            onChange={(e) => setNewItemGst(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none"
                          >
                            <option value="0">0% GST</option>
                            <option value="5">5% GST</option>
                            <option value="12">12% GST</option>
                            <option value="18">18% GST</option>
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-750 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCatalogItem}
                            className="px-2.5 py-1 bg-[#0050e8] text-white rounded text-[10px] font-bold cursor-pointer"
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
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSignupSubmit}
                        disabled={loading}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? 'Registering...' : 'Finish & Register'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Bottom text */}
            <p className="text-center text-[11px] text-slate-500 font-semibold pt-1">
              Already have an account?{' '}
              <Link href="/login" className="text-[#0050e8] font-black hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          </motion.div>

          {/* Footer Security badge */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-blue-200/50 mt-6 font-bold uppercase tracking-wider">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured by TruBill • SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

