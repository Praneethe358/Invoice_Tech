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
import { GST_STATES } from '@/lib/gstin-states';

const stepTitles = [
  'Basic Information',
  'Business Category',
  'Tax & Inventory Settings'
];

interface CatalogItemState {
  id: string;
  name: string;
  price: string;
  hsn_code: string;
  gst_rate: number;
  category?: string;
}

function CategoryIcon({ type, active }: { type: ShopType; active: boolean }) {
  const colorClass = active ? 'text-[#0050e8]' : 'text-slate-400 group-hover:text-slate-600 transition-colors';
  switch (type) {
    case 'clothing':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l1.08 5.4A2 2 0 005.3 13H9v7.5A1.5 1.5 0 0010.5 22h3a1.5 1.5 0 001.5-1.5V13h3.7a2 2 0 001.94-1.91l1.08-5.4a2 2 0 00-1.34-2.23z"/>
        </svg>
      );
    case 'footwear':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-2a3 3 0 00-3-3H5a2 2 0 00-2 2v4a2 2 0 002 2z"/>
        </svg>
      );
    case 'tailoring':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <line x1="9.8" y1="8.2" x2="20" y2="17"/>
          <line x1="9.8" y1="15.8" x2="20" y2="7"/>
        </svg>
      );
    case 'fertilizer':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V12M12 12c4 0 7-3 7-7 0 0-3 0-7 4M12 12C8 12 5 9 5 5c0 0 3 0 7 4"/>
        </svg>
      );
    case 'grocery':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
        </svg>
      );
    case 'pharmacy':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      );
    case 'hardware':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      );
    case 'food':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      );
    case 'electronics':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      );
    case 'salon':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2s1 .2 1.4.6c.4.4.6.9.6 1.4v18M11 22V4c0-.5.2-1 .6-1.4.4-.4.9-.6 1.4-.6s1 .2 1.4.6c.4.4.6.9.6 1.4v18M18 22V4c0-.5.2-1 .6-1.4C19 2.2 19.5 2 20 2s1 .2 1.4.6c.4.4.6.9.6 1.4v18"/>
        </svg>
      );
    case 'other':
    default:
      return (
        <svg className={`w-5 h-5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      );
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Redirect to dashboard if user already has a shop, or skip to step 2 if auth exists but no shop
  useEffect(() => {
    const checkExistingShopOrStaff = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if owner
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (shop) {
          router.push('/dashboard');
          return;
        }

        // Check if active staff
        const { data: staff } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (staff) {
          router.push('/dashboard');
          return;
        }

        // User is authenticated but has no shop — show step 1 without credentials
        setIsExistingUser(true);
        setEmail(user.email || '');
        setOwnerName(user.user_metadata?.owner_name || user.user_metadata?.full_name || '');
      }
    };
    checkExistingShopOrStaff();
  }, [router]);

  // Step 1: Basic Info
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      if (!isExistingUser) {
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
      handleSignupSubmit();
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
    setLoading(true);
    try {
      const supabase = createClient();

      // If user is already authenticated (returning from a failed shop creation), skip auth
      if (!isExistingUser) {
        // Step 1: Create auth user (or sign in if account already exists)
        let { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              owner_name: ownerName.trim(),
            },
          },
        });

        // If auth account already exists, try signing in instead
        if (authError && (authError.status === 422 || authError.message?.toLowerCase().includes('already'))) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInError) {
            showToast('An account with this email already exists. Please sign in or use a different email.', 'error');
            setLoading(false);
            return;
          }
          authData = signInData as typeof authData;
          authError = null;
        }

        if (authError) {
          showToast(authError.message, 'error');
          setLoading(false);
          return;
        }
        if (!authData?.user) {
          showToast('Signup failed.', 'error');
          setLoading(false);
          return;
        }
      }

      // Extract state code if GSTIN is registered
      let autoState = null;
      if (gstRegistered && gstin && gstin.trim().length >= 2) {
        const code = gstin.trim().slice(0, 2);
        const stateName = GST_STATES[code];
        if (stateName) {
          autoState = `${code} - ${stateName}`;
        }
      }

      const bType = getBusinessType(shopType);

      // Create shop via server-side API (bypasses RLS)
      const createShopRes = await fetch('/api/signup/create-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopName.trim(),
          phone: phone.trim(),
          shop_type: shopType,
          gst_registered: gstRegistered,
          gstin: gstRegistered ? gstin.trim().toUpperCase() : null,
          business_type: bType,
          inventory_enabled: isServiceOnly ? false : inventoryEnabled,
          state: autoState,
        }),
      });

      const shopResult = await createShopRes.json();

      if (!createShopRes.ok || !shopResult.id) {
        console.error('Shop creation failed:', shopResult);
        showToast(shopResult.error || 'Account created but shop setup failed.', 'error');
        setLoading(false);
        return;
      }

      const newShop = { id: shopResult.id };

      // Fire platform event for new signup
      try {
        await supabase.from('platform_events').insert({
          event_type: 'NEW_SIGNUP',
          business_id: newShop.id,
          business_name: shopName.trim(),
          city: 'Unknown',
          metadata: { plan: 'trial' },
        });
      } catch (e) {
        console.error('Failed to fire new signup event:', e);
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
                    <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">{isExistingUser ? 'Complete your shop setup' : "Let's create your account"}</h1>
                    <p className="text-xs text-[#6b7280]">{isExistingUser ? 'Your account is ready. Just fill in your shop details.' : 'Enter details about you and your business.'}</p>
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
                    {!isExistingUser && (
                      <>
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
                      </>
                    )}
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!shopName || !ownerName || !phone || (!isExistingUser && (!email || !password || !confirmPassword))}
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
                        { type: 'clothing', label: 'Clothing / Textiles' },
                        { type: 'footwear', label: 'Footwear Shop' },
                        { type: 'tailoring', label: 'Tailoring Shop' },
                        { type: 'fertilizer', label: 'Agri / Fertilizer' },
                        { type: 'grocery', label: 'Grocery / Kirana' },
                        { type: 'pharmacy', label: 'Medical / Pharmacy' },
                        { type: 'hardware', label: 'Hardware Store' },
                        { type: 'food', label: 'Food / Restaurant' },
                        { type: 'electronics', label: 'Mobile / Electronics' },
                        { type: 'salon', label: 'Salon / Beauty' },
                        { type: 'other', label: 'Other Business' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setShopType(opt.type)}
                          className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between h-20 sm:h-24 transition-all active:scale-[0.97] group cursor-pointer ${
                            shopType === opt.type
                              ? 'border-[#0050e8] bg-gradient-to-br from-blue-50/70 to-indigo-50/20 shadow-xs ring-1 ring-[#0050e8]/30'
                              : 'border-slate-150 bg-white hover:bg-[#f9fafb]'
                          }`}
                        >
                          <CategoryIcon type={opt.type} active={shopType === opt.type} />
                          <span className="text-[10px] sm:text-xs font-black text-slate-850 leading-tight">{opt.label}</span>
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
                        disabled={loading || (gstRegistered && (!gstin || !!gstinError))}
                        className="flex-1 bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white font-bold py-3 rounded-xl transition-all disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <>
                            <span>Create Account</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 5" />
                            </svg>
                          </>
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
        <div className="flex flex-col items-center text-center pt-5 pb-2 px-6 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-7 h-7 object-contain brightness-0 invert" />
            <span className="font-heading font-black text-xl tracking-tight text-white">
              TruBill
            </span>
          </div>
          <p className="text-blue-200/80 text-[11px] font-semibold max-w-[280px]">
            GST Invoicing made simple for Tamil Nadu retail.
          </p>
        </div>

        {/* Floating Card */}
        <div className="flex-1 flex flex-col px-4 pb-4 relative z-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-[400px] mx-auto my-auto"
          >
          <div className="bg-white rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] p-5 space-y-4">
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
                      <h1 className="text-xl font-black text-[#1a1d26] tracking-tight">{isExistingUser ? 'Complete your shop setup' : "Let's create your account"}</h1>
                      <p className="text-xs text-slate-400 font-medium">{isExistingUser ? 'Your account is ready. Just fill in your shop details.' : 'Enter details about you and your business.'}</p>
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
                    {!isExistingUser && (
                      <>
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
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min 8 characters"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                            >
                              {showPassword ? (
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                  <line x1="2" x2="22" y1="2" y2="22" />
                                </svg>
                              ) : (
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500">Confirm Password</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0050e8] focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                            >
                              {showConfirmPassword ? (
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                  <line x1="2" x2="22" y1="2" y2="22" />
                                </svg>
                              ) : (
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!shopName || !ownerName || !phone || (!isExistingUser && (!email || !password || !confirmPassword))}
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
                        { type: 'clothing', label: 'Clothing / Textiles' },
                        { type: 'footwear', label: 'Footwear Shop' },
                        { type: 'tailoring', label: 'Tailoring Shop' },
                        { type: 'fertilizer', label: 'Agri / Fertilizer' },
                        { type: 'grocery', label: 'Grocery / Kirana' },
                        { type: 'pharmacy', label: 'Medical / Pharmacy' },
                        { type: 'hardware', label: 'Hardware Store' },
                        { type: 'food', label: 'Food / Restaurant' },
                        { type: 'electronics', label: 'Mobile / Electronics' },
                        { type: 'salon', label: 'Salon / Beauty' },
                        { type: 'other', label: 'Other Business' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setShopType(opt.type)}
                          className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all active:scale-[0.97] group cursor-pointer ${
                            shopType === opt.type
                              ? 'border-[#0050e8] bg-gradient-to-br from-blue-50/70 to-indigo-50/20 ring-1 ring-[#0050e8]/30'
                              : 'border-slate-150 bg-white hover:bg-[#f9fafb]'
                          }`}
                        >
                          <CategoryIcon type={opt.type} active={shopType === opt.type} />
                          <span className="text-[10px] font-black text-slate-800 leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>



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
                        disabled={loading || (gstRegistered && (!gstin || !!gstinError))}
                        className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          'Registering...'
                        ) : (
                          <>
                            <span>Create Account</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 5" />
                            </svg>
                          </>
                        )}
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

