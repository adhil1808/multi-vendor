import React, { useState, useEffect } from 'react';
import { mockDB, dbService } from '../mockDB';
import { useAuth } from '../AuthContext';
import { ShoppingBag, ArrowLeft, Settings, Star, Clock, MapPin, Tag, ChevronRight } from 'lucide-react';
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

  const TopNav = () => (
    <div className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '-24px -24px 24px -24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivering to</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <MapPin size={16} color="var(--primary)" /> 
                {user.addresses?.[0] || 'Home'} <ChevronRight size={16} />
            </div>
        </div>
        <button className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: '12px' }} onClick={() => navigate('/customer/profile')}>
            <Settings size={18} /> <span className="mobile-hide">Profile</span>
        </button>
    </div>
  );

  if (selectedMerchant) {
    const merchantImage = selectedMerchant.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop';
    return (
      <div className="animate-fade-in">
        <TopNav />
        <div className="layout-cart" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '32px' }}>
          <div>
            <button className="btn btn-outline" style={{ marginBottom: '24px', borderRadius: 'var(--radius-full)' }} onClick={() => setSelectedMerchant(null)}>
              <ArrowLeft size={16} /> Back
            </button>
            
            <div className="animate-fade-in-up" style={{ height: '280px', borderRadius: 'var(--radius-xl)', backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%), url(${merchantImage})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '40px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
               <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-1px' }}>{selectedMerchant.restaurantName}</h2>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.9, fontSize: '15px' }}>
                 <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {selectedMerchant.address}</p>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                     <Star size={14} fill="currentColor" /> 4.8 Excellent
                 </div>
               </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Recommended</h3>
              {activeOffer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: '600', fontSize: '14px', background: '#D1FAE5', padding: '6px 14px', borderRadius: '20px' }}>
                    <Tag size={16} /> {activeOffer.discountText}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {menuItems.map((item, idx) => (
                <div key={item.id} className="card card-interactive animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s`, display: 'flex', flexDirection: 'column', height: '100%', opacity: item.isAvailable ? 1 : 0.6, padding: '16px' }}>
                  {item.imageUrl && (
                     <div style={{ height: '160px', width: '100%', backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }} />
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>{item.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.4' }}>{item.description}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px' }}>
                     <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-main)' }}>${item.price.toFixed(2)}</span>
                     {item.isAvailable ? (
                       <button className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }} onClick={() => addToCart(item)}>Add</button>
                     ) : (
                       <span style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '13px', padding: '6px 12px', background: '#FEE2E2', borderRadius: 'var(--radius-full)' }}>Unavailable</span>
                     )}
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>This merchant hasn't added any items yet.</p>}
            </div>
          </div>

          {/* Premium Cart Sidebar */}
          <div className="glass-panel animate-fade-in-up" style={{ alignSelf: 'start', position: 'sticky', top: '90px', padding: '24px' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
               <ShoppingBag size={24} color="var(--primary)" /> Your Order
             </h3>
             
             {cart.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                 <ShoppingBag size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                 <p style={{ fontSize: '15px' }}>Your cart is hungry.</p>
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }} className="hide-scrollbar">
                   {cart.map((c, i) => (
                     <div key={i} className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingBottom: '12px', borderBottom: '1px dashed var(--border)', marginBottom: '12px' }}>
                       <span style={{ fontWeight: '500' }}>1x {c.name}</span>
                       <span style={{ fontWeight: '600' }}>${c.price.toFixed(2)}</span>
                     </div>
                   ))}
                 </div>

                 <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                       <span>Subtotal</span>
                       <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>${subtotal.toFixed(2)}</span>
                     </div>
                     {activeOffer && discountAmount > 0 && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#10B981', fontWeight: '700' }}>
                       <span>Discount ({activeOffer.code})</span>
                       <span>-${discountAmount.toFixed(2)}</span>
                     </div>
                     )}
                     <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '22px' }}>
                       <span>Total</span>
                       <span style={{ color: 'var(--primary)' }}>${finalTotal.toFixed(2)}</span>
                     </div>
                 </div>
                 
                 {/* Address Selection with style enhancement */}
                 <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Delivery Location</label>
                    <select value={selectedAddress} onChange={e=>setSelectedAddress(e.target.value)} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                        {user.addresses?.map((addr, idx) => (
                            <option key={idx} value={addr}>{addr}</option>
                        ))}
                        <option value="custom">Enter new address...</option>
                    </select>
                    {selectedAddress === 'custom' && (
                        <input 
                           style={{ marginTop: '12px', background: 'var(--surface)' }} 
                           placeholder="Type full address..." 
                           value={customAddress} 
                           onChange={e=>setCustomAddress(e.target.value)} 
                        />
                    )}
                 </div>

                 <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '16px', fontSize: '16px' }} onClick={checkout}>
                    Confirm & Pay
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '0 8px' }}>
      <TopNav />

      {/* Hero Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px', marginTop: '20px' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1.1' }}>
            Craving something <span style={{ color: 'var(--primary)' }}>delicious?</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '400' }}>Get the best food from top restaurants delivered fast.</p>
      </div>

      {/* Promos Banner Carousel */}
      {systemBanners.length > 0 && (
         <div className="hide-scrollbar" style={{ marginBottom: '48px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '20px', display: 'flex', gap: '20px', scrollSnapType: 'x mandatory' }}>
           {systemBanners.map((banner, idx) => (
             <div key={banner.id} className="animate-fade-in-up" style={{ scrollSnapAlign: 'start', display: 'inline-block', width: 'clamp(280px, 80vw, 420px)', height: '220px', borderRadius: 'var(--radius-xl)', background: `url(${banner.imageUrl}) center/cover`, boxShadow: 'var(--shadow-md)', cursor: 'pointer', flexShrink: 0, position: 'relative', overflow: 'hidden', animationDelay: `${idx * 0.1}s` }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', transition: 'background 0.3s ease' }} className="hover-darken" />
             </div>
           ))}
         </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Top Restaurants near you</h3>
          <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>See All</span>
      </div>
      
      {/* Premium Restaurant Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
        {merchants.map((m, idx) => {
          const activeOffer = offers.find(o => o.merchantId === m.userId) || offers.find(o => o.merchantId === 'ALL');
          const fallbackImg = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop';
          const isClosed = m.openStatus === false;

          return (
          <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s`, cursor: isClosed ? 'not-allowed' : 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', opacity: isClosed ? 0.7 : 1 }} onClick={() => !isClosed && selectMerchant(m)} onMouseEnter={e => { if(!isClosed) e.currentTarget.style.transform = 'translateY(-4px)'}} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
             
             {/* Thumbnail Container */}
             <div style={{ height: '220px', background: `url(${m.imageUrl || fallbackImg}) center/cover`, borderRadius: 'var(--radius-xl)', marginBottom: '16px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                {/* Visual Gradient for text readability */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                
                {isClosed && (
                   <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '18px', letterSpacing: '2px', padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.9)', boxShadow: 'var(--shadow-lg)' }}>CURRENTLY CLOSED</span>
                   </div>
                )}

                {/* Offer Floating Tag */}
                {activeOffer && !isClosed && (
                   <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={14} /> {activeOffer.discountText}
                   </div>
                )}
             </div>

             {/* Restaurant Details Row */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                   <h4 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.restaurantName}</h4>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                     {m.address}
                   </p>
                </div>
                <div style={{ background: '#F3F4F6', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   4.5 <Star size={12} fill="#F59E0B" color="#F59E0B" />
                </div>
             </div>
             
             {/* Timings/Meta */}
             <div style={{ display: 'flex', gap: '16px', marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '20px' }}>
                  <Clock size={14} /> 25-30 mins
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>• &nbsp;Free Delivery</span>
             </div>
          </div>
        )})}
      </div>
    </div>
  );
}
