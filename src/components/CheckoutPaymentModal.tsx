import React, { useState, useEffect } from 'react';
import { CartItem, Currency, CustomerDetails, PaymentMethod, OrderConfirmationData, UserAccount } from '../types';
import { formatPrice } from '../utils/currency';
import { resolveImage } from '../shop/schema';
import { SafeImage } from './SafeImage';
import {
  FREE_SHIPPING_THRESHOLD_USD,
  EXPRESS_SHIPPING_FEE_USD,
} from '../data/products';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Truck,
  Printer,
  Sparkles,
  Loader2,
  User,
} from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface CheckoutPaymentModalProps {
  isOpen: boolean;
  items: CartItem[];
  currency: Currency;
  appliedCoupon: string;
  giftWrap: boolean;
  currentUser?: UserAccount | null;
  onClose: () => void;
  onOrderCompleted: (order: OrderConfirmationData) => void;
  onOpenAuth?: () => void;
}

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  isOpen,
  items,
  currency,
  appliedCoupon,
  giftWrap,
  currentUser,
  onClose,
  onOrderCompleted,
  onOpenAuth,
}) => {
  // Checkout Steps: 1 = Shipping & Customer, 2 = Payment Gateway, 3 = Processing, 4 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Customer & Shipping State
  const [customer, setCustomer] = useState<CustomerDetails>(() => {
    if (currentUser?.addresses && currentUser.addresses.length > 0) {
      return currentUser.addresses[0];
    }
    return {
      fullName: currentUser?.fullName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
    };
  });

  // Keep customer in sync if user logs in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.addresses && currentUser.addresses.length > 0) {
        setCustomer(currentUser.addresses[0]);
      } else {
        setCustomer((prev) => ({
          ...prev,
          fullName: currentUser.fullName,
          email: currentUser.email,
          phone: currentUser.phone || prev.phone,
        }));
      }
    }
  }, [currentUser]);

  // Selected Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // UPI details
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes

  // Confirmation data
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmationData | null>(null);

  // Error validation
  const [formError, setFormError] = useState('');

  // Calculations
  const rawSubtotalUSD = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const giftWrapCostUSD = giftWrap ? 5 : 0;
  let discountUSD = 0;
  if (appliedCoupon === 'RAMBAGH10') discountUSD = rawSubtotalUSD * 0.1;
  if (appliedCoupon === 'WELCOME15') discountUSD = rawSubtotalUSD * 0.15;
  const isFreeShipping = rawSubtotalUSD >= FREE_SHIPPING_THRESHOLD_USD;
  const shippingUSD =
    rawSubtotalUSD === 0 || isFreeShipping ? 0 : EXPRESS_SHIPPING_FEE_USD;
  const totalUSD = Math.max(0, rawSubtotalUSD - discountUSD + giftWrapCostUSD + shippingUSD);

  // Quick Demo Autofill
  const handleFillDemoAddress = () => {
    const inIndia = currency === 'INR';
    setCustomer(
      inIndia
        ? {
            fullName: 'Tara Sharma',
            email: 'tara.sharma@example.com',
            phone: '+91 98200 41135',
            street: '425 Artisanal Way, Apt 3B',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          }
        : {
            fullName: 'Tara Sharma',
            email: 'tara.sharma@example.com',
            phone: '+1 (555) 382-9104',
            street: '425 Artisanal Way, Apt 3B',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94107',
            country: 'United States',
          }
    );
    setFormError('');
  };

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Step 1 to Step 2 validation
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.fullName || !customer.email || !customer.phone || !customer.street || !customer.city || !customer.postalCode) {
      setFormError('Please fill in all required shipping fields.');
      return;
    }
    setFormError('');
    setStep(2);
  };

  // Execute Payment Simulation
  const handleExecutePayment = () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardHolder) {
        setFormError('Please complete all card payment fields.');
        return;
      }
    }
    setFormError('');
    setStep(3); // Show Processing State

    // Staged delay so the demo reads like a gateway round-trip; no request is made.
    setTimeout(() => {
      const orderId = `CTX-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderData: OrderConfirmationData = {
        orderId,
        customer,
        items,
        subtotal: rawSubtotalUSD,
        discount: discountUSD,
        shipping: shippingUSD,
        total: totalUSD,
        paymentMethod,
        currency,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      };
      setConfirmedOrder(orderData);
      onOrderCompleted(orderData);
      setStep(4);
    }, 1800);
  };

  // QR Code Timer countdown
  useEffect(() => {
    if (step === 2 && paymentMethod === 'upi') {
      const interval = setInterval(() => {
        setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, paymentMethod]);

  // Start every checkout session fresh: this modal stays mounted while closed,
  // so without this a reopened checkout would show the previous order's receipt.
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setConfirmedOrder(null);
    setFormError('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder('');
    setUpiId('');
    setUpiVerified(false);
    setQrTimer(300);
  }, [isOpen]);

  useOverlayBehavior(isOpen, onClose);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Secure checkout"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-4xl bg-[#FDFBF7] border border-[#EDE6DC] shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EDE6DC] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl tracking-[0.2em] font-medium text-[#1E1B18]">RAMBAGH</span>
            <span className="text-[#C5BDB3]">|</span>
            <span className="text-xs uppercase tracking-wider text-[#7A6B5D] font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2F6F4E]" />
              Demo gateway &mdash; nothing is charged
            </span>
          </div>

          {step !== 3 && step !== 4 && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        {step !== 4 && (
          <div className="bg-[#FAF7F2] px-6 py-2.5 border-b border-[#EDE6DC] flex items-center justify-center gap-8 text-xs font-medium">
            <span className={`flex items-center gap-2 ${step >= 1 ? 'text-[#1E1B18]' : 'text-[#A89C8F]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-[#1E1B18] text-white' : 'bg-[#E8DDD1]'}`}>1</span>
              <span>Delivery Details</span>
            </span>
            <span className="text-[#D5C9B9]">——</span>
            <span className={`flex items-center gap-2 ${step >= 2 ? 'text-[#1E1B18]' : 'text-[#A89C8F]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-[#1E1B18] text-white' : 'bg-[#E8DDD1]'}`}>2</span>
              <span>Payment Gateway</span>
            </span>
          </div>
        )}

        <div className="p-6 sm:p-8">
          
          {/* STEP 1: Customer & Shipping Details */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left: Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-medium text-[#1E1B18]">Shipping Address</h3>
                  <button
                    type="button"
                    onClick={handleFillDemoAddress}
                    className="text-xs text-[#A8523C] hover:underline font-medium"
                  >
                    + Fill Demo Address
                  </button>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleProceedToPayment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.fullName}
                        onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                        placeholder="e.g. Tara Sharma"
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="tara@example.com"
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        Country *
                      </label>
                      <select
                        value={customer.country}
                        onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      >
                        <option value="United States">United States</option>
                        <option value="India">India</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                      Street Address & Apt/Suite *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer.street}
                      onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
                      placeholder="Street address, apartment, suite, etc."
                      className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.city}
                        onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        State / Province *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.state}
                        onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                        placeholder="State"
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.postalCode}
                        onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                        placeholder="ZIP / PIN"
                        className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Continue to Payment Method</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Right: Order Summary Sidebar */}
              <div className="lg:col-span-5 bg-[#F7F3ED] border border-[#EDE6DC] p-5 space-y-4">
                <h4 className="font-serif text-lg font-medium text-[#1E1B18] pb-2 border-b border-[#E8DDD1]">
                  Order Summary ({items.reduce((acc, i) => acc + i.quantity, 0)})
                </h4>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs bg-white p-2.5 border border-[#EDE6DC]">
                      <SafeImage
                        src={resolveImage(item.product.image)}
                        alt={item.product.title}
                        category={item.product.category}
                        fallbackLabel={item.product.title}
                        className="w-12 h-16 object-cover bg-[#EDE6DC] shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-serif font-medium text-[#1E1B18] line-clamp-1">{item.product.title}</p>
                          <p className="text-[#7A6B5D] text-[11px]">
                            Qty: {item.quantity} · Size: {item.selectedSize}
                          </p>
                        </div>
                        <p className="font-semibold text-[#1E1B18] tabular-nums">
                          {formatPrice(item.product.price * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs text-[#5C5349] border-t border-[#E8DDD1] pt-3 tabular-nums">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(rawSubtotalUSD, currency)}</span>
                  </div>
                  {discountUSD > 0 && (
                    <div className="flex justify-between text-[#2F6F4E] font-medium">
                      <span>Artisan Promo ({appliedCoupon})</span>
                      <span>-{formatPrice(discountUSD, currency)}</span>
                    </div>
                  )}
                  {giftWrap && (
                    <div className="flex justify-between">
                      <span>Gift Packaging</span>
                      <span>{formatPrice(giftWrapCostUSD, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{isFreeShipping ? 'FREE' : formatPrice(shippingUSD, currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#1E1B18] pt-2 border-t border-[#EDE6DC]">
                    <span>Total Due</span>
                    <span>{formatPrice(totalUSD, currency)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#EDE6DC] text-[11px] text-[#7A6B5D] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C6934B] shrink-0" />
                  <span>Dispatched via FedEx / DHL Express with live tracking.</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Payment Gateway Selection */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Payment Methods */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-xs text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Address</span>
                  </button>
                  <span className="text-xs text-[#7A6B5D]">
                    Shipping to: <strong>{customer.city}, {customer.country}</strong>
                  </span>
                </div>

                <h3 className="font-serif text-xl font-medium text-[#1E1B18]">Select Payment Gateway</h3>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                    {formError}
                  </div>
                )}

                {/* Gateway Options Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border text-left transition-all flex flex-col justify-between h-20 ${
                      paymentMethod === 'card'
                        ? 'border-[#1E1B18] bg-[#F4EFEA] font-medium'
                        : 'border-[#EDE6DC] bg-white hover:border-[#D5C9B9]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#1E1B18]" />
                    <span className="text-xs uppercase tracking-wider text-[#1E1B18]">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 border text-left transition-all flex flex-col justify-between h-20 ${
                      paymentMethod === 'upi'
                        ? 'border-[#1E1B18] bg-[#F4EFEA] font-medium'
                        : 'border-[#EDE6DC] bg-white hover:border-[#D5C9B9]'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#1E1B18]" />
                    <span className="text-xs uppercase tracking-wider text-[#1E1B18]">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('applepay')}
                    className={`p-3 border text-left transition-all flex flex-col justify-between h-20 ${
                      paymentMethod === 'applepay'
                        ? 'border-[#1E1B18] bg-[#F4EFEA] font-medium'
                        : 'border-[#EDE6DC] bg-white hover:border-[#D5C9B9]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#1E1B18]" />
                    <span className="text-xs uppercase tracking-wider text-[#1E1B18]">1-Tap Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 border text-left transition-all flex flex-col justify-between h-20 ${
                      paymentMethod === 'cod'
                        ? 'border-[#1E1B18] bg-[#F4EFEA] font-medium'
                        : 'border-[#EDE6DC] bg-white hover:border-[#D5C9B9]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-[#1E1B18]" />
                    <span className="text-xs uppercase tracking-wider text-[#1E1B18]">COD</span>
                  </button>
                </div>

                {/* Sub-form based on selected gateway */}
                <div className="p-5 bg-white border border-[#EDE6DC] space-y-4">
                  
                  {/* CARD GATEWAY */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE3]">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                          Debit or Credit Card
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7A6B5D]">
                          <span>Visa</span>
                          <span>·</span>
                          <span>Mastercard</span>
                          <span>·</span>
                          <span>Amex</span>
                          <span>·</span>
                          <span>RuPay</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Name as printed on card"
                          className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#1E1B18]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                          Card Number *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4532 •••• •••• 8891"
                            maxLength={19}
                            className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#1E1B18] font-mono"
                          />
                          <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#A89C8F]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                            Expires (MM/YY) *
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#1E1B18] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                            Security Code (CVV) *
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                            placeholder="3 or 4 digits"
                            maxLength={4}
                            className="w-full px-3 py-2 text-xs border border-[#D5C9B9] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#1E1B18] font-mono"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-[#5C5349] cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="rounded text-[#1E1B18]"
                        />
                        <span>Tick to see the saved-card step (nothing is actually stored)</span>
                      </label>
                    </div>
                  )}

                  {/* UPI / QR GATEWAY */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE3]">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                          Instant UPI & QR Gateway
                        </span>
                        <span className="text-xs text-[#A8523C] font-mono font-medium">
                          Expires in {formatTimer(qrTimer)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        {/* Dynamic QR */}
                        <div className="p-4 bg-[#F7F3ED] border border-[#E8DDD1] flex flex-col items-center justify-center space-y-2">
                          <div className="w-36 h-36 bg-white p-2 border border-[#D5C9B9] flex flex-col items-center justify-center relative shadow-sm">
                            {/* Stylized QR Code Graphic */}
                            <div className="grid grid-cols-6 gap-1 w-full h-full p-1">
                              {Array.from({ length: 36 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`rounded-[1px] ${
                                    (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30
                                      ? 'bg-[#1E1B18]'
                                      : 'bg-[#EDE6DC]'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-[#1E1B18] bg-white px-1 absolute">
                              RAMBAGH UPI
                            </span>
                          </div>
                          <p className="text-[11px] text-center text-[#7A6B5D]">
                            Scan with GPay, PhonePe, Paytm or BHIM
                          </p>
                        </div>

                        {/* UPI ID input */}
                        <div className="space-y-3">
                          <p className="text-xs text-[#5C5349]">
                            Or enter your Virtual Payment Address (VPA):
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="e.g. mobile@okhdfcbank"
                              className="flex-1 px-3 py-2 text-xs border border-[#D5C9B9] bg-[#FAF7F2] focus:bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setUpiVerified(true)}
                              className="px-3 py-2 bg-[#1E1B18] text-white text-xs uppercase font-medium"
                            >
                              Verify
                            </button>
                          </div>
                          {upiVerified && (
                            <p className="text-[11px] text-[#2F6F4E] flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>UPI ID verified. Proceed to pay.</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1-TAP / APPLE PAY */}
                  {paymentMethod === 'applepay' && (
                    <div className="space-y-4 py-4 text-center animate-in fade-in">
                      <Smartphone className="w-10 h-10 mx-auto text-[#1E1B18]" />
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg font-medium text-[#1E1B18]">Apple Pay / Google Pay</h4>
                        <p className="text-xs text-[#7A6B5D] max-w-sm mx-auto">
                          Click below to authorize instantaneous payment using your saved biometrics and default shipping card.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CASH ON DELIVERY */}
                  {paymentMethod === 'cod' && (
                    <div className="space-y-3 py-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                        <Banknote className="w-4 h-4 text-[#C6934B]" />
                        <span>Cash On Delivery with Verification</span>
                      </div>
                      <p className="text-xs text-[#5C5349] leading-relaxed">
                        Pay cash or card upon delivery directly to the courier. Live checkout would send an SMS verification code to <strong>{customer.phone}</strong> — this prototype sends nothing.
                      </p>
                      <div className="p-3 bg-[#FAF7F2] border border-[#E8DDD1] text-[11px] text-[#7A6B5D]">
                        {isFreeShipping
                          ? 'Complimentary express delivery applies. Exact cash requested upon parcel arrival.'
                          : `A ${formatPrice(shippingUSD, currency)} courier fee applies to this order. Exact cash requested upon parcel arrival.`}
                      </div>
                    </div>
                  )}

                </div>

                {/* Confirm Pay Button */}
                <button
                  type="button"
                  onClick={handleExecutePayment}
                  className="w-full py-4 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Lock className="w-3.5 h-3.5 text-[#C6934B]" />
                  <span>Authorize & Pay {formatPrice(totalUSD, currency)}</span>
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-[#7A6B5D]">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2F6F4E]" />
                    Demo order &mdash; no payment taken
                  </span>
                  <span>·</span>
                  <span>Receipt is shown here, never sent</span>
                </div>
              </div>

              {/* Order Summary on side */}
              <div className="lg:col-span-5 bg-[#F7F3ED] border border-[#EDE6DC] p-5 space-y-4">
                <h4 className="font-serif text-lg font-medium text-[#1E1B18] pb-2 border-b border-[#E8DDD1]">
                  Payment Breakdown
                </h4>

                <div className="space-y-2 text-xs text-[#5C5349] tabular-nums">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span>{formatPrice(rawSubtotalUSD, currency)}</span>
                  </div>
                  {discountUSD > 0 && (
                    <div className="flex justify-between text-[#2F6F4E] font-medium">
                      <span>Discount ({appliedCoupon})</span>
                      <span>-{formatPrice(discountUSD, currency)}</span>
                    </div>
                  )}
                  {giftWrap && (
                    <div className="flex justify-between">
                      <span>Artisanal Gift Packaging</span>
                      <span>{formatPrice(giftWrapCostUSD, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Express Courier</span>
                    <span>{isFreeShipping ? 'FREE' : formatPrice(shippingUSD, currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#1E1B18] pt-3 border-t border-[#EDE6DC]">
                    <span>Grand Total</span>
                    <span>{formatPrice(totalUSD, currency)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#EDE6DC] space-y-1 text-xs">
                  <p className="font-medium text-[#1E1B18]">Shipment Recipient:</p>
                  <p className="text-[#5C5349]">{customer.fullName}</p>
                  <p className="text-[#7A6B5D] text-[11px]">{customer.street}, {customer.city}, {customer.postalCode}</p>
                  <p className="text-[#7A6B5D] text-[11px]">{customer.email} · {customer.phone}</p>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Processing State */}
          {step === 3 && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[#1E1B18] animate-spin" />
                <Lock className="w-4 h-4 text-[#C6934B] absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-medium text-[#1E1B18]">Processing Payment</h3>
                <p className="text-xs text-[#7A6B5D]">
                  Demo gateway is working through the steps... Please do not refresh.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#2F6F4E] pt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>No card network is contacted and no payment is taken</span>
              </div>
            </div>
          )}

          {/* STEP 4: Order Confirmation & Receipt */}
          {step === 4 && confirmedOrder && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Success Banner */}
              <div className="text-center space-y-2 pb-6 border-b border-[#EDE6DC]">
                <div className="w-14 h-14 rounded-full bg-[#E8F3EC] text-[#2F6F4E] flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">Payment Successful</p>
                <h2 className="font-serif text-3xl font-normal text-[#1E1B18]">
                  Thank You for Supporting Master Craftsmanship
                </h2>
                <p className="text-xs text-[#5C5349] max-w-md mx-auto">
                  Your order <strong className="font-mono text-[#1E1B18]">{confirmedOrder.orderId}</strong> has been confirmed for <strong>{confirmedOrder.customer.email}</strong>.
                </p>
                <p className="text-[11px] uppercase tracking-wider text-[#A8523C] font-medium">
                  Demo order — no payment was taken and no email was sent
                </p>
              </div>

              {/* Order Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-[#EDE6DC] p-6">
                
                {/* Meta details */}
                <div className="space-y-3 text-xs">
                  <h4 className="font-serif text-base font-medium text-[#1E1B18]">Order Information</h4>
                  <div className="space-y-1.5 text-[#5C5349]">
                    <p><strong>Order ID:</strong> <span className="font-mono">{confirmedOrder.orderId}</span></p>
                    <p><strong>Order Date:</strong> {confirmedOrder.date}</p>
                    <p><strong>Estimated Delivery:</strong> <span className="text-[#2F6F4E] font-medium">{confirmedOrder.estimatedDelivery}</span></p>
                    <p><strong>Payment Method:</strong> {confirmedOrder.paymentMethod.toUpperCase()} (Paid in full)</p>
                  </div>
                </div>

                {/* Delivery summary */}
                <div className="space-y-3 text-xs">
                  <h4 className="font-serif text-base font-medium text-[#1E1B18]">Delivery Destination</h4>
                  <div className="space-y-1 text-[#5C5349]">
                    <p className="font-medium text-[#1E1B18]">{confirmedOrder.customer.fullName}</p>
                    <p>{confirmedOrder.customer.street}</p>
                    <p>{confirmedOrder.customer.city}, {confirmedOrder.customer.state} {confirmedOrder.customer.postalCode}</p>
                    <p>{confirmedOrder.customer.country}</p>
                    <p className="text-[#7A6B5D] text-[11px] pt-1">Phone: {confirmedOrder.customer.phone}</p>
                  </div>
                </div>

              </div>

              {/* Items Purchased */}
              <div className="border border-[#EDE6DC] bg-white divide-y divide-[#EDE6DC]">
                <div className="p-4 bg-[#FAF7F2] text-xs uppercase tracking-wider font-semibold text-[#1E1B18]">
                  Purchased Silhouettes
                </div>
                {confirmedOrder.items.map((it, i) => (
                  <div key={i} className="p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={resolveImage(it.product.image)}
                        alt={it.product.title}
                        category={it.product.category}
                        fallbackLabel={it.product.title}
                        className="w-12 h-16 object-cover bg-[#EDE6DC]"
                      />
                      <div>
                        <p className="font-serif font-medium text-sm text-[#1E1B18]">{it.product.title}</p>
                        <p className="text-[#7A6B5D] text-[11px]">
                          Size: {it.selectedSize} · Color: {it.selectedColor.name} · Qty: {it.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm tabular-nums text-[#1E1B18]">
                      {formatPrice(it.product.price * it.quantity, confirmedOrder.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Paid */}
              <div className="p-4 bg-[#F7F3ED] border border-[#EDE6DC] flex items-center justify-between text-sm">
                <span className="font-medium text-[#1E1B18]">Order total (demo)</span>
                <span className="font-bold text-lg text-[#1E1B18] tabular-nums">
                  {formatPrice(confirmedOrder.total, confirmedOrder.currency)}
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-3 border border-[#3C352D] text-[#1E1B18] text-xs uppercase tracking-wider font-medium hover:bg-[#EDE6DC] transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all"
                >
                  <span>Continue Exploring</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
