import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { firebaseDBService } from '../services/firebaseDB';
import { firebaseDBService } from '../services/firebaseDB';
import { Plus, Trash2, TrendingUp, DollarSign, ShoppingBag, Activity, Tag, Image as ImageIcon, MapPin, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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
  const [newMerchantUpi, setNewMerchantUpi] = useState('');

  // Marketing states
  const [newBannerImg, setNewBannerImg] = useState('');
  const [newOfferMerchantId, setNewOfferMerchantId] = useState('ALL');
  const [newOfferType, setNewOfferType] = useState('PERCENTAGE');
  const [newOfferAmount, setNewOfferAmount] = useState('');
  const [newOfferCode, setNewOfferCode] = useState('');

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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = (autoC) => setAutocomplete(autoC);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setNewMerchantLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  useEffect(() => {
    firebaseDBService.getUsersByRole('MERCHANT').then(setMerchants);
    firebaseDBService.getUsersByRole('DELIVERY_BOY').then(setDelivery);
    firebaseDBService.getBanners().then(setGlobalBanners);
    firebaseDBService.getOffers().then(setMerchantOffers);
    
    Promise.all([
      firebaseDBService.getAllMerchants(),
      firebaseDBService.getAllOrders()
    ]).then(([mList, oList]) => {
      setOrders(oList);
      calculateAnalytics(oList, mList);
    });
  }, []);

  const calculateAnalytics = (allOrders, allMerchants) => {
      let revenue = 0;
      let mStats = {};
      let datesMap = {};

      allOrders.forEach(order => {
          revenue += order.totalAmount;
          const mId = order.merchantId;
          const merchantObj = allMerchants.find(m => m.userId === mId);
          const mName = merchantObj ? merchantObj.restaurantName : 'Unknown Merchant';
          
          if(!mStats[mId]) {
              mStats[mId] = { name: mName, orders: 0, revenue: 0 };
          }
          mStats[mId].orders += 1;
          mStats[mId].revenue += order.totalAmount;

          const dateOnly = new Date(order.createdAt?.toMillis ? order.createdAt.toMillis() : Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const handleAddMerchant = async (e) => {
    e.preventDefault();
    const newRestaurantId = String(Math.floor(100000 + Math.random() * 900000));
    
    const userData = { name: newMerchantName, email: newMerchantEmail, role: 'MERCHANT', password: newMerchantPassword || 'password', restaurantName: newMerchantName };
    const merchantData = { 
      restaurantId: newRestaurantId,
      restaurantName: newMerchantName, 
      address: 'Unknown', 
      openStatus: true,
      phone: newMerchantPhone,
      fssai: newMerchantFssai,
      shopDetails: newMerchantDetails,
      location: newMerchantLocation,
      upiId: newMerchantUpi
    };

    try {
      const res = await firebaseDBService.addMerchantUser(userData, merchantData);
      setMerchants([...merchants, res.user]);
      
      // Reset Form
      setNewMerchantName('');
      setNewMerchantEmail('');
      setNewMerchantPassword('');
      setNewMerchantPhone('');
      setNewMerchantFssai('');
      setNewMerchantDetails('');
      setNewMerchantUpi('');
      setShowMerchantModal(false);
    } catch(err) {
      alert("Error adding merchant: " + err.message);
    }
  };

  const handleDeleteMerchant = async (id) => {
    try {
      await firebaseDBService.deleteUser(id);
      setMerchants(merchants.filter(m => m.id !== id));
    } catch(err) {
      alert("Error deleting merchant: " + err.message);
    }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault();
    const userData = { 
      name: newDeliveryName, 
      email: newDeliveryEmail, 
      phone: newDeliveryPhone, 
      vehicleNumber: newDeliveryVehicle, 
      role: 'DELIVERY_BOY', 
      password: 'password' 
    };
    try {
      const added = await firebaseDBService.addDeliveryBoy(userData);
      setDelivery([...delivery, added]);
      setNewDeliveryName('');
      setNewDeliveryEmail('');
      setNewDeliveryPhone('');
      setNewDeliveryVehicle('');
    } catch(err) {
      alert("Error adding delivery boy: " + err.message);
    }
  };

  const handleDeleteDelivery = async (id) => {
    try {
      await firebaseDBService.deleteUser(id);
      setDelivery(delivery.filter(d => d.id !== id));
    } catch(err) {
      alert("Error deleting delivery boy: " + err.message);
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    const b = { imageUrl: newBannerImg, link: '#', isActive: true };
    try {
      const addedBanner = await firebaseDBService.addBanner(b);
      setGlobalBanners([...globalBanners, addedBanner]);
      setNewBannerImg('');
    } catch (error) {
      alert('Failed to add banner');
    }
  };

  const handleDeleteBanner = async (id) => {
    try {
      await firebaseDBService.deleteBanner(id);
      setGlobalBanners(globalBanners.filter(b => b.id !== id));
    } catch (error) {
      alert('Failed to delete banner');
    }
  }

  const handleAddOffer = async (e) => {
    e.preventDefault();
    const discountText = newOfferType === 'PERCENTAGE' ? `${newOfferAmount}% OFF` : `₹${newOfferAmount} OFF`;
    const o = { 
      merchantId: newOfferMerchantId, 
      type: newOfferType,
      amount: Number(newOfferAmount),
      discountText: discountText, 
      code: newOfferCode 
    };
    try {
      const added = await firebaseDBService.addOffer(o);
      setMerchantOffers([...merchantOffers, added]);
      setNewOfferAmount('');
      setNewOfferCode('');
    } catch(err) {
      alert("Error adding offer: " + err.message);
    }
  }

  const handleDeleteOffer = async (id) => {
    try {
      await firebaseDBService.deleteOffer(id);
      setMerchantOffers(merchantOffers.filter(o => o.id !== id));
    } catch(err) {
      alert("Error deleting offer: " + err.message);
    }
  }

  const onMapClick = useCallback((e) => {
    setNewMerchantLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  return (
    <>
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
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₹{stats.totalRevenue.toFixed(2)}</div>
             </div>
             <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={16}/> Total Orders Processed</p>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalOrders}</div>
             </div>
             <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={16}/> Avg Order Value</p>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₹{stats.aov.toFixed(2)}</div>
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
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹{ms.revenue.toFixed(2)}</td>
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
           <form onSubmit={handleAddOffer} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select value={newOfferMerchantId} onChange={e => setNewOfferMerchantId(e.target.value)} style={{ flex: '1 1 200px' }} required>
                 <option value="ALL">All Restaurants (Global)</option>
                 <optgroup label="Specific Merchants">
                    {merchants.map(m => <option key={m.id} value={m.id}>{m.restaurantName}</option>)}
                 </optgroup>
              </select>
              <select value={newOfferType} onChange={e => setNewOfferType(e.target.value)} style={{ width: '130px' }}>
                 <option value="PERCENTAGE">% Percentage</option>
                 <option value="FLAT">₹ Flat Rate</option>
              </select>
              <input type="number" placeholder="Amount" value={newOfferAmount} onChange={e => setNewOfferAmount(e.target.value)} style={{ width: '100px' }} min="1" required />
              <input placeholder="Promo Code (e.g. SAVE20)" value={newOfferCode} onChange={e => setNewOfferCode(e.target.value)} style={{ flex: '1 1 150px' }} required />
              <button className="btn btn-primary" type="submit"><Plus size={18} /></button>
           </form>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {merchantOffers.map(o => {
                const targetMerchant = merchants.find(m => m.id === o.merchantId);
                const targetName = o.merchantId === 'ALL' ? 'Global App Offer (All Restaurants)' : (targetMerchant ? targetMerchant.restaurantName : 'Unknown');
                return (
                 <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                   <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{o.discountText} <span style={{fontSize:'12px', background: '#F3F4F6', marginLeft: '8px', padding: '2px 8px', borderRadius: '4px'}}>Code: {o.code}</span></div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Applies to: {targetName}</div>
                   </div>
                   <button className="btn btn-outline hover-scale" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => handleDeleteOffer(o.id)}><Trash2 size={16} /></button>
                 </div>
                )
              })}
           </div>
        </div>
      </div>
      )}

    </div>

      {/* Add Merchant Modal */}
      {showMerchantModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px', boxSizing: 'border-box' }} onClick={() => setShowMerchantModal(false)}>
          <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', padding: 0, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
                  <Store size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Onboard New Merchant</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Fill in the details to register a new restaurant partner.</p>
                </div>
              </div>
              <button onClick={() => setShowMerchantModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: 'var(--text-secondary)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}>&times;</button>
            </div>

            <div className="hide-scrollbar" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleAddMerchant} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Restaurant Name *</label>
                    <input placeholder="E.g., Pizza Palace" value={newMerchantName} onChange={e => setNewMerchantName(e.target.value)} required style={{ width: '100%', padding: '14px 16px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Login Email *</label>
                    <input type="email" placeholder="merchant@domain.com" value={newMerchantEmail} onChange={e => setNewMerchantEmail(e.target.value)} required style={{ width: '100%', padding: '14px 16px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Initial Password *</label>
                    <input type="password" placeholder="Secure password" value={newMerchantPassword} onChange={e => setNewMerchantPassword(e.target.value)} required style={{ width: '100%', padding: '14px 16px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Contact Number *</label>
                    <input type="tel" placeholder="+123 456 7890" value={newMerchantPhone} onChange={e => setNewMerchantPhone(e.target.value)} required style={{ width: '100%', padding: '14px 16px' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>FSSAI Registration *</label>
                    <input placeholder="12345678901234" value={newMerchantFssai} onChange={e => setNewMerchantFssai(e.target.value)} required style={{ width: '100%', padding: '14px 16px' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>UPI ID for Payments (e.g., merchant@upi)</label>
                    <input placeholder="merchant@upi" value={newMerchantUpi} onChange={e => setNewMerchantUpi(e.target.value)} style={{ width: '100%', padding: '14px 16px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Shop Details & Description</label>
                  <textarea 
                    placeholder="Provide brief details about the restaurant, cuisine, or specialty..." 
                    value={newMerchantDetails} 
                    onChange={e => setNewMerchantDetails(e.target.value)} 
                    rows={3}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', backgroundColor: '#FAFAFA' }} 
                  />
                </div>

                <div style={{ background: '#FAFAFA', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                      <MapPin size={18} color="var(--primary)" /> Pin Exact Location on Map
                    </label>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      Lat: {newMerchantLocation.lat.toFixed(4)}, Lng: {newMerchantLocation.lng.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                    {!GOOGLE_MAPS_API_KEY ? (
                      <div style={{ height: '250px', background: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>
                         <MapPin size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                         <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>Google Maps is disabled</p>
                         <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Please add your Google Maps API Key to a <code>.env</code> file <br/>as <code>VITE_GOOGLE_MAPS_API_KEY</code> to enable Search.</p>
                      </div>
                    ) : isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '250px' }}
                        center={newMerchantLocation}
                        zoom={14}
                        onClick={onMapClick}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                      >
                        <Autocomplete
                          onLoad={onLoad}
                          onPlaceChanged={onPlaceChanged}
                        >
                          <input
                            type="text"
                            placeholder="Search for a restaurant or place..."
                            style={{
                              boxSizing: 'border-box',
                              border: '1px solid transparent',
                              width: '240px',
                              height: '40px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                              fontSize: '14px',
                              outline: 'none',
                              textOverflow: 'ellipses',
                              position: 'absolute',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              top: '10px'
                            }}
                          />
                        </Autocomplete>
                        <Marker position={newMerchantLocation} />
                      </GoogleMap>
                    ) : <div style={{ height: '250px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Map...</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-outline" style={{ padding: '12px 24px', borderRadius: 'var(--radius-md)' }} onClick={() => setShowMerchantModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 'var(--radius-md)', fontSize: '16px' }}>Complete Onboarding</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
