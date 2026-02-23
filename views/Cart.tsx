import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, CreditCard, QrCode, CheckCircle, Truck, Store, ArrowLeft } from 'lucide-react';
import { Card, Button, Input, SectionHeader } from '../components/UI';
import { storageService } from '../services/storage';
import { INVENTORY } from '../constants';

interface CartProps {
  onBack: () => void;
}

export const Cart: React.FC<CartProps> = ({ onBack }) => {
  const [cartItems, setCartItems] = useState(storageService.getCart());
  const [view, setView] = useState<'list' | 'checkout' | 'success'>('list');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');

  const getShoe = (id: string) => INVENTORY.find(s => s.id === id);

  const subtotal = cartItems.reduce((sum, item) => {
    const shoe = getShoe(item.shoeId);
    return sum + (shoe ? shoe.price * item.quantity : 0);
  }, 0);
  
  const total = subtotal + (deliveryMethod === 'delivery' ? 5.00 : 0);

  const handleRemove = (id: string, size: number) => {
    storageService.removeFromCart(id, size);
    setCartItems(storageService.getCart());
  };

  const handleCheckout = () => {
    // Simulate API call
    setTimeout(() => {
        storageService.clearCart();
        setCartItems([]);
        setView('success');
    }, 1500);
  };

  if (view === 'success') {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Order Confirmed</h2>
            <p className="text-[#A0AEC0] mb-8">
                {deliveryMethod === 'pickup' 
                    ? "Show this code at Second Sole Medina counter to pickup." 
                    : "Your local delivery is being prepared. Check your email for tracking."}
            </p>
            
            {deliveryMethod === 'pickup' && (
                <div className="bg-white p-4 rounded-2xl mb-8">
                    <QrCode size={180} className="text-black" />
                </div>
            )}
            
            <Button fullWidth onClick={onBack}>Back to Shop</Button>
        </div>
    );
  }

  if (view === 'checkout') {
      return (
          <div className="space-y-6 pb-40">
              <div className="flex items-center gap-4 mb-6">
                  <button 
                      onClick={() => setView('list')}
                      className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                  >
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Secure Checkout</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${deliveryMethod === 'pickup' ? 'bg-white/10 border-white text-white' : 'bg-[#111111] border-white/10 text-[#A0AEC0]'}`}
                  >
                      <Store size={24} />
                      <span className="text-xs font-bold">Store Pickup</span>
                  </button>
                   <button 
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${deliveryMethod === 'delivery' ? 'bg-[#e43928]/10 border-[#e43928] text-[#e43928]' : 'bg-[#111111] border-white/10 text-[#A0AEC0]'}`}
                  >
                      <Truck size={24} />
                      <span className="text-xs font-bold">Local Delivery</span>
                  </button>
              </div>

              {deliveryMethod === 'pickup' ? (
                  <Card>
                      <h3 className="font-bold mb-4">Pickup Location</h3>
                      <div className="text-sm text-[#A0AEC0]">
                          <p className="text-white font-medium">Second Sole Medina</p>
                          <p>122 Public Square</p>
                          <p>Medina, OH 44256</p>
                      </div>
                  </Card>
              ) : (
                  <div className="space-y-4">
                      <h3 className="font-bold text-white">Delivery Address</h3>
                      <Input placeholder="Street Address" />
                      <div className="grid grid-cols-2 gap-4">
                          <Input placeholder="City" defaultValue="Medina" />
                          <Input placeholder="Zip" />
                      </div>
                  </div>
              )}

              <div className="space-y-4">
                  <h3 className="font-bold text-white">Payment Method</h3>
                  <Input placeholder="Card Number" defaultValue="4242 4242 4242 4242" />
                  <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM/YY" defaultValue="12/25" />
                      <Input placeholder="CVV" defaultValue="123" />
                  </div>
              </div>

              <div className="pt-4">
                  <div className="flex justify-between mb-2 text-sm">
                      <span className="text-[#A0AEC0]">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryMethod === 'delivery' && (
                    <div className="flex justify-between mb-2 text-sm">
                        <span className="text-[#A0AEC0]">Delivery Fee</span>
                        <span>$5.00</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-6 text-xl font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                  </div>
                  <Button fullWidth size="lg" onClick={handleCheckout}>Pay & {deliveryMethod === 'pickup' ? 'Reserve' : 'Order'}</Button>
              </div>
          </div>
      );
  }

  if (cartItems.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="text-[#A0AEC0]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Cart is Empty</h2>
              <p className="text-[#A0AEC0] mb-8">Your next PB is waiting in the shop.</p>
              <Button onClick={onBack}>Start Shopping</Button>
          </div>
      );
  }

  // Moved to bottom-36 (approx 144px) to clear the menu bar significantly
  const CheckoutFooter = createPortal(
    <div className="fixed bottom-36 left-0 right-0 px-4 pointer-events-none z-[60]">
        <div className="max-w-md mx-auto pointer-events-auto">
            <Button fullWidth size="lg" onClick={() => setView('checkout')}>
                Checkout • ${subtotal.toFixed(2)}
            </Button>
        </div>
    </div>,
    document.body
  );

  return (
    <div className="space-y-6 pb-40">
      <div className="flex items-center gap-4 mb-6">
          <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
              <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Your Bag</h2>
              <p className="text-[#A0AEC0] text-sm mt-1">{cartItems.length} items</p>
          </div>
      </div>
      
      <div className="space-y-4">
        {cartItems.map((item, idx) => {
            const shoe = getShoe(item.shoeId);
            if (!shoe) return null;
            return (
                <Card key={`${item.shoeId}-${idx}`} className="flex gap-4 p-4">
                    <img src={shoe.image} alt={shoe.name} referrerPolicy="no-referrer" className="w-20 h-20 rounded-xl object-contain p-2 bg-[#000]" />
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-white">{shoe.name}</h3>
                            <p className="text-xs text-[#A0AEC0]">Size: {item.size} • {shoe.brand}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-medium">${shoe.price}</span>
                            <button 
                                onClick={() => handleRemove(item.shoeId, item.size)}
                                className="text-red-400 hover:text-red-300 p-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </Card>
            );
        })}
      </div>

      {CheckoutFooter}
    </div>
  );
};