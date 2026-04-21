import React, { useState, useEffect } from 'react';
import { mockDB, dbService } from '../mockDB';
import { useAuth } from '../AuthContext';
import { ShoppingBag, ArrowLeft, Settings, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [systemBanners, setSystemBanners] = useState([]);
  const [offers, setOffers] = useState([]);
  
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  
  const [selectedAddress, setSelectedAddress] = useState(user.addresses?.[0] || '');
  const [customAddress, setCustomAddress] = useState('');

  useEffect(() => {
    setMerchants(mockDB.merchants);
    setSystemBanners(mockDB.systemBanners.filter(b => b.isActive));
    setOffers(mockDB.offers);
  }, []);

  const selectMerchant = (m) => {
    setSelectedMerchant(m);
    setMenuItems(mockDB.menu_items.filter(i => i.merchantId === m.userId));
    setCart([]); 
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const activeOffer = selectedMerchant ? (offers.find(o => o.merchantId === selectedMerchant.userId) || offers.find(o => o.merchantId === 'ALL')) : null;
  
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  let discountAmount = 0;
  if (activeOffer && cart.length > 0) {
      if (activeOffer.type === 'PERCENTAGE') {
          discountAmount = subtotal * (activeOffer.amount / 100);
      } else if (activeOffer.type === 'FLAT') {
          discountAmount = activeOffer.amount;
      }
      if (discountAmount > subtotal) discountAmount = subtotal;
  }
  const finalTotal = subtotal - discountAmount;

  const checkout = async () => {
    if(cart.length === 0) return;
    
    const finalAddress = selectedAddress === 'custom' ? customAddress : selectedAddress;
    if(!finalAddress) {
        alert("Please provide a delivery address.");
        return;
    }

    const orderData = {
      customerId: user.id,
      merchantId: selectedMerchant.userId,
      items: cart,
      totalAmount: finalTotal,
      deliveryAddress: finalAddress
    };
    
    await dbService.placeOrder(orderData);
    setCart([]);
    setCartOpen(false);
    alert('Order placed successfully! The merchant has been notified.');
    setSelectedMerchant(null); 
  };

  if (selectedMerchant) {
    const merchantImage = selectedMerchant.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop';
    return (
      <div className="animate-fade-in layout-cart" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px' }}>
        <div>
          <button className="btn btn-outline" style={{ marginBottom: '16px' }} onClick={() => setSelectedMerchant(null)}>
            <ArrowLeft size={16} /> Back to Restaurants
          </button>
          
          <div style={{ height: '200px', borderRadius: '16px', backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(${merchantImage})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '32px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
             <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedMerchant.restaurantName}</h2>
             <p style={{ opacity: 0.9, fontSize: '15px' }}>{selectedMerchant.address}</p>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Recommended</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {menuItems.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', opacity: item.isAvailable ? 1 : 0.6 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>{item.name}</h4>
                  {item.imageUrl && (
                     <div style={{ height: '140px', width: '100%', backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  )}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{item.description}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '18px' }}>${item.price.toFixed(2)}</span>
                   {item.isAvailable ? (
                     <button className="btn btn-primary" onClick={() => addToCart(item)}>Add</button>
                   ) : (
                     <span style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '14px', padding: '6px 12px', background: '#FEE2E2', borderRadius: '8px' }}>Not Available</span>
                   )}
                </div>
              </div>
            ))}
            {menuItems.length === 0 && <p>This merchant hasn't added any items yet.</p>}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: '90px' }}>
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
             <ShoppingBag size={20} /> Your Cart ({cart.length})
           </h3>
           
           {cart.length === 0 ? (
             <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cart is empty.</p>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {cart.map((c, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                   <span>{c.name}</span>
                   <span>${c.price.toFixed(2)}</span>
                 </div>
               ))}
               <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                 <span>Subtotal</span>
                 <span>${subtotal.toFixed(2)}</span>
               </div>
               {activeOffer && discountAmount > 0 && (
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#10B981', marginBottom: '8px', fontWeight: 'bold' }}>
                 <span>Discount ({activeOffer.code})</span>
                 <span>-${discountAmount.toFixed(2)}</span>
               </div>
               )}
               <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
               <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '16px', fontSize: '18px' }}>
                 <span>Total</span>
                 <span>${finalTotal.toFixed(2)}</span>
               </div>
               
               {/* Address Selection */}
               <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Delivery Address</label>
                  <select value={selectedAddress} onChange={e=>setSelectedAddress(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
                      {user.addresses?.map((addr, idx) => (
                          <option key={idx} value={addr}>{addr}</option>
                      ))}
                      <option value="custom">Enter new address...</option>
                  </select>
                  {selectedAddress === 'custom' && (
                      <input 
                         style={{ marginTop: '8px', padding: '8px', fontSize: '13px' }} 
                         placeholder="Type address..." 
                         value={customAddress} 
                         onChange={e=>setCustomAddress(e.target.value)} 
                      />
                  )}
               </div>

               <button className="btn btn-primary" style={{ width: '100%' }} onClick={checkout}>Confirm & Pay</button>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Top Nav Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Delicious food,</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>delivered to your door fast.</p>
          </div>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => navigate('/customer/profile')}>
              <Settings size={18} /> Profile
          </button>
      </div>

      {/* Promos Banner Carousel */}
      {systemBanners.length > 0 && (
         <div style={{ marginBottom: '40px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '16px', display: 'flex', gap: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
           {systemBanners.map(banner => (
             <div key={banner.id} style={{ display: 'inline-block', width: '380px', height: '180px', borderRadius: '16px', background: `url(${banner.imageUrl}) center/cover`, boxShadow: 'var(--shadow-md)', cursor: 'pointer', flexShrink: 0 }} />
           ))}
         </div>
      )}
      
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Top Restaurants near you</h3>
      
      {/* Zomato/Swiggy Style Restaurant Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {merchants.map(m => {
          // Check for promotional offers dynamically
          const activeOffer = offers.find(o => o.merchantId === m.userId) || offers.find(o => o.merchantId === 'ALL');
          const fallbackImg = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop';

          const isClosed = m.openStatus === false;

          return (
          <div key={m.id} style={{ cursor: isClosed ? 'not-allowed' : 'pointer', transition: 'transform 0.2s ease', position: 'relative', opacity: isClosed ? 0.7 : 1 }} onClick={() => !isClosed && selectMerchant(m)} onMouseEnter={e => { if(!isClosed) e.currentTarget.style.transform = 'scale(1.02)'}} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
             
             {/* Thumbnail Container */}
             <div style={{ height: '180px', background: `url(${m.imageUrl || fallbackImg}) center/cover`, borderRadius: '16px', marginBottom: '12px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                {/* Visual Gradient for text readability if needed */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                
                {isClosed && (
                   <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px', letterSpacing: '2px', padding: '8px 16px', border: '2px solid white', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>CLOSED</span>
                   </div>
                )}

                {/* Offer Floating Tag */}
                {activeOffer && !isClosed && (
                   <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#3B82F6', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {activeOffer.discountText}
                   </div>
                )}
             </div>

             {/* Restaurant Details Row */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                   <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{m.restaurantName}</h4>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     {m.address}
                   </p>
                </div>
                <div style={{ background: '#10B981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                   4.5 <Star size={10} fill="currentColor" />
                </div>
             </div>
             
             {/* Timings/Meta */}
             <div style={{ display: 'flex', gap: '16px', marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> 25-30 mins</span>
                <span>•  Free Delivery</span>
             </div>
          </div>
        )})}
      </div>
    </div>
  );
}
