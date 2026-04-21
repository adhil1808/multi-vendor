import React, { useState, useEffect, useCallback } from 'react';
import { mockDB, dbService } from '../mockDB';
import { Plus, Trash2, TrendingUp, DollarSign, ShoppingBag, Activity, Tag, Image as ImageIcon, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '8px'
};

export default function SuperAdminDashboard() {
  const [merchants, setMerchants] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [orders, setOrders] = useState([]);
  const [globalBanners, setGlobalBanners] = useState([]);
  const [merchantOffers, setMerchantOffers] = useState([]);
  
  // Dashboard Tabs (overview | merchants | delivery | marketing)
  const [activeTab, setActiveTab] = useState('overview');

  // Merchant creation states
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newMerchantEmail, setNewMerchantEmail] = useState('');
  const [newMerchantPassword, setNewMerchantPassword] = useState('');
  const [newMerchantPhone, setNewMerchantPhone] = useState('');
  const [newMerchantFssai, setNewMerchantFssai] = useState('');
  const [newMerchantDetails, setNewMerchantDetails] = useState('');
  const [newMerchantLocation, setNewMerchantLocation] = useState({ lat: 28.7041, lng: 77.1025 });

  // Marketing states
  const [newBannerImg, setNewBannerImg] = useState('');
  const [newOfferMerchantId, setNewOfferMerchantId] = useState('');
  const [newOfferText, setNewOfferText] = useState('');

  // Delivery creation states
  const [newDeliveryName, setNewDeliveryName] = useState('');
  const [newDeliveryEmail, setNewDeliveryEmail] = useState('');
  const [newDeliveryPhone, setNewDeliveryPhone] = useState('');
  const [newDeliveryVehicle, setNewDeliveryVehicle] = useState('');

  // Analytics State
  const [stats, setStats] = useState({ totalRevenue: 0, aov: 0, totalOrders: 0 });
  const [merchantStats, setMerchantStats] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "" // intentionally left blank for prototype dev watermark
  });

  useEffect(() => {
    setMerchants(mockDB.users.filter(u => u.role === 'MERCHANT'));
    setDelivery(mockDB.users.filter(u => u.role === 'DELIVERY_BOY'));
    setGlobalBanners(mockDB.systemBanners);
    setMerchantOffers(mockDB.offers);
    
    dbService.getAllOrders().then(allOrders => {
        setOrders(allOrders);
        calculateAnalytics(allOrders);
    });
  }, []);

  const calculateAnalytics = (allOrders) => {
      let revenue = 0;
      let mStats = {};
      let datesMap = {};

      allOrders.forEach(order => {
          revenue += order.totalAmount;
          const mId = order.merchantId;
          const merchantObj = mockDB.merchants.find(m => m.userId === mId);
          const mName = merchantObj ? merchantObj.restaurantName : 'Unknown Merchant';
          
          if(!mStats[mId]) {
              mStats[mId] = { name: mName, orders: 0, revenue: 0 };
          }
          mStats[mId].orders += 1;
          mStats[mId].revenue += order.totalAmount;

          const dateOnly = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          datesMap[dateOnly] = (datesMap[dateOnly] || 0) + 1;
      });

      setStats({
          totalRevenue: revenue,
          aov: allOrders.length > 0 ? (revenue / allOrders.length) : 0,
          totalOrders: allOrders.length
      });

      setMerchantStats(Object.values(mStats).sort((a,b) => b.revenue - a.revenue));
      const sortedKeys = Object.keys(datesMap).sort((a, b) => new Date(a) - new Date(b));
      setChartData(sortedKeys.map(key => ({ date: key, orders: datesMap[key] })));
  };

  const handleAddMerchant = (e) => {
    e.preventDefault();
    const newRestaurantId = String(Math.floor(100000 + Math.random() * 900000));
    const newUser = { id: Date.now().toString(), name: newMerchantName, email: newMerchantEmail, role: 'MERCHANT', password: newMerchantPassword || 'password', restaurantName: newMerchantName };
    mockDB.users.push(newUser);
    mockDB.merchants.push({ 
      id: 'm' + newUser.id, 
      userId: newUser.id, 
      restaurantId: newRestaurantId,
      restaurantName: newMerchantName, 
      address: 'Unknown', 
      openStatus: true,
      phone: newMerchantPhone,
      fssai: newMerchantFssai,
      shopDetails: newMerchantDetails,
      location: newMerchantLocation
    });
    setMerchants([...merchants, newUser]);
    
    // Reset Form
    setNewMerchantName('');
    setNewMerchantEmail('');
    setNewMerchantPassword('');
    setNewMerchantPhone('');
    setNewMerchantFssai('');
    setNewMerchantDetails('');
    setShowMerchantModal(false);
  };

  const handleDeleteMerchant = (id) => {
    mockDB.users = mockDB.users.filter(u => u.id !== id);
    mockDB.merchants = mockDB.merchants.filter(m => m.userId !== id);
    setMerchants(merchants.filter(m => m.id !== id));
  };

  const handleAddDelivery = (e) => {
    e.preventDefault();
    const newUser = { 
      id: Date.now().toString(), 
      name: newDeliveryName, 
      email: newDeliveryEmail, 
      phone: newDeliveryPhone, 
      vehicleNumber: newDeliveryVehicle, 
      role: 'DELIVERY_BOY', 
      password: 'password' 
    };
    mockDB.users.push(newUser);
    setDelivery([...delivery, newUser]);
    setNewDeliveryName('');
    setNewDeliveryEmail('');
    setNewDeliveryPhone('');
    setNewDeliveryVehicle('');
  };

  const handleDeleteDelivery = (id) => {
    mockDB.users = mockDB.users.filter(u => u.id !== id);
    setDelivery(delivery.filter(d => d.id !== id));
  };

  const handleAddBanner = (e) => {
    e.preventDefault();
    const b = { id: 'b'+Date.now(), imageUrl: newBannerImg, link: '#', isActive: true };
    mockDB.systemBanners.push(b);
    setGlobalBanners([...globalBanners, b]);
    setNewBannerImg('');
  };

  const handleDeleteBanner = (id) => {
    mockDB.systemBanners = mockDB.systemBanners.filter(b => b.id !== id);
    setGlobalBanners(mockDB.systemBanners);
  }

  const handleAddOffer = (e) => {
    e.preventDefault();
    const o = { id: 'off'+Date.now(), merchantId: newOfferMerchantId, discountText: newOfferText, code: 'NEWOFFER' };
    mockDB.offers.push(o);
    setMerchantOffers([...merchantOffers, o]);
    setNewOfferText('');
  }

  const handleDeleteOffer = (id) => {
    mockDB.offers = mockDB.offers.filter(o => o.id !== id);
    setMerchantOffers(mockDB.offers);
  }

  const onMapClick = useCallback((e) => {
    setNewMerchantLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Super Admin Dashboard</h2>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-scrollable" style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {['overview', 'merchants', 'delivery', 'marketing'].map(tab => (
          <button 
            key={tab}
            className="btn hover-scale" 
            style={{ 
              background: activeTab === tab ? 'var(--primary)' : 'transparent', 
              color: activeTab === tab ? 'white' : 'var(--text-secondary)', 
              padding: '8px 16px', 
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize'
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('delivery', 'Delivery Personnel')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
      <div className="animate-fade-in card" style={{ background: '#FFF7F2' }}>
         <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity /> System Analytics
         </h3>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
             <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={16}/> Total Revenue</p>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${stats.totalRevenue.toFixed(2)}</div>
             </div>
             <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={16}/> Total Orders Processed</p>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalOrders}</div>
             </div>
             <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={16}/> Avg Order Value</p>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${stats.aov.toFixed(2)}</div>
             </div>
         </div>

         <div className="layout-dual-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
               <h4 style={{ marginBottom: '16px' }}>Order Volume (Timeline)</h4>
               <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 12}} />
                      <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#F3F4F6'}} />
                      <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
               <h4 style={{ marginBottom: '16px' }}>Restaurant Performance</h4>
               <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-color)' }}>
                      <th style={{ padding: '8px' }}>Restaurant</th>
                      <th style={{ padding: '8px' }}>Orders</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchantStats.map((ms, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px', fontWeight: '500' }}>{ms.name}</td>
                        <td style={{ padding: '8px' }}>{ms.orders}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>${ms.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
      )}

      {/* Merchants Tab */}
      {activeTab === 'merchants' && (
      <div className="animate-fade-in card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '20px' }}>Master Merchant List</h3>
          <button className="btn btn-primary" onClick={() => setShowMerchantModal(true)}>
            <Plus size={18} /> Add New Merchant
          </button>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)' }}>
              <th style={{ padding: '12px 8px' }}>Restaurant Name</th>
              <th style={{ padding: '12px 8px' }}>Email Contact</th>
              <th style={{ padding: '12px 8px' }}>Manage</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500' }}>{m.restaurantName}</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{m.email}</td>
                <td style={{ padding: '12px 8px' }}>
                  <button className="btn btn-outline hover-scale" style={{ padding: '6px 12px', color: 'red', borderColor: 'red' }} onClick={() => handleDeleteMerchant(m.id)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {merchants.length === 0 && <tr><td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No merchants found.</td></tr>}
          </tbody>
        </table>
      </div>
      )}

      {/* Delivery Personnel Tab */}
      {activeTab === 'delivery' && (
      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Add Delivery Personnel</h3>
          <form onSubmit={handleAddDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Full Name</label>
              <input placeholder="John Doe" value={newDeliveryName} onChange={e => setNewDeliveryName(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Email Address</label>
              <input type="email" placeholder="john@delivery.com" value={newDeliveryEmail} onChange={e => setNewDeliveryEmail(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Contact Number</label>
              <input type="tel" placeholder="+1 234 567 890" value={newDeliveryPhone} onChange={e => setNewDeliveryPhone(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Vehicle Registration Plate</label>
              <input placeholder="AB-12-CD-3456" value={newDeliveryVehicle} onChange={e => setNewDeliveryVehicle(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: '8px' }}><Plus size={18} /> Register Delivery Partner</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Active Fleet</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {delivery.map(d => (
              <li key={d.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{d.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{d.email} • {d.phone || 'No Phone'}</div>
                  <div style={{ fontSize: '12px', background: '#F3F4F6', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', marginTop: '6px' }}>Vehicle: {d.vehicleNumber || 'N/A'}</div>
                </div>
                <button className="btn btn-outline hover-scale" style={{ padding: '6px 12px', color: 'red', borderColor: 'red' }} onClick={() => handleDeleteDelivery(d.id)}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {delivery.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No delivery personnel available. Add one to build your fleet.</p>}
          </ul>
        </div>
      </div>
      )}

      {/* Marketing Tab */}
      {activeTab === 'marketing' && (
      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
        <div className="card">
           <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <ImageIcon /> Global App Banners
           </h3>
           <form onSubmit={handleAddBanner} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input placeholder="Image URL (Unsplash etc)" value={newBannerImg} onChange={e => setNewBannerImg(e.target.value)} required />
              <button className="btn btn-primary" type="submit"><Plus size={18} /></button>
           </form>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {globalBanners.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px' }}>
                   <div style={{ width: '60px', height: '40px', background: `url(${b.imageUrl}) center/cover`, borderRadius: '4px' }} />
                   <div style={{ flex: 1, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.imageUrl}</div>
                   <button className="btn btn-outline hover-scale" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => handleDeleteBanner(b.id)}><Trash2 size={16} /></button>
                </div>
              ))}
           </div>
        </div>

        <div className="card">
           <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <Tag /> Merchant Offers
           </h3>
           <form onSubmit={handleAddOffer} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select value={newOfferMerchantId} onChange={e => setNewOfferMerchantId(e.target.value)} style={{ flex: 1 }} required>
                 <option value="" disabled>Select Merchant...</option>
                 {merchants.map(m => <option key={m.id} value={m.id}>{m.restaurantName}</option>)}
              </select>
              <input placeholder="e.g. 50% OFF" value={newOfferText} onChange={e => setNewOfferText(e.target.value)} style={{ flex: 1 }} required />
              <button className="btn btn-primary" type="submit"><Plus size={18} /></button>
           </form>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {merchantOffers.map(o => {
                const targetMerchant = merchants.find(m => m.id === o.merchantId);
                return (
                 <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                   <div>
                      <div style={{ fontWeight: 'bold' }}>{o.discountText}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Applies to: {targetMerchant ? targetMerchant.restaurantName : 'Unknown'}</div>
                   </div>
                   <button className="btn btn-outline hover-scale" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => handleDeleteOffer(o.id)}><Trash2 size={16} /></button>
                 </div>
                )
              })}
           </div>
        </div>
      </div>
      )}

      {/* Add Merchant Modal */}
      {showMerchantModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '5vh 16px' }} onClick={() => setShowMerchantModal(false)}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '750px', backgroundColor: 'white', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Onboard New Merchant</h2>
              <button onClick={() => setShowMerchantModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>&times;</button>
            </div>

            <form onSubmit={handleAddMerchant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="layout-dual-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Restaurant Name *</label>
                  <input placeholder="E.g., Pizza Palace" value={newMerchantName} onChange={e => setNewMerchantName(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Login Email *</label>
                  <input type="email" placeholder="merchant@domain.com" value={newMerchantEmail} onChange={e => setNewMerchantEmail(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Initial Password *</label>
                  <input type="password" placeholder="Secure password" value={newMerchantPassword} onChange={e => setNewMerchantPassword(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Contact Number *</label>
                  <input type="tel" placeholder="+123 456 7890" value={newMerchantPhone} onChange={e => setNewMerchantPhone(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>FSSAI Registration *</label>
                  <input placeholder="12345678901234" value={newMerchantFssai} onChange={e => setNewMerchantFssai(e.target.value)} required style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Shop Details & Description</label>
                <textarea 
                  placeholder="Provide brief details about the restaurant, cuisine, or specialty." 
                  value={newMerchantDetails} 
                  onChange={e => setNewMerchantDetails(e.target.value)} 
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} 
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  <MapPin size={16} /> Pin Exact Location on Map
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Click on the map to drop a pin and capture GPS coordinates.</p>
                <div style={{ border: '2px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={newMerchantLocation}
                      zoom={14}
                      onClick={onMapClick}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                      <Marker position={newMerchantLocation} />
                    </GoogleMap>
                  ) : <div style={{ height: '250px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Google Maps...</div>}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Coordinates: {newMerchantLocation.lat.toFixed(4)}, {newMerchantLocation.lng.toFixed(4)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowMerchantModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ paddingLeft: '24px', paddingRight: '24px' }}>Onboard Merchant</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
