import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { dbService, mockDB } from '../mockDB';
import { User, MapPin, Plus, Trash2, ArrowLeft, LogOut, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerProfile() {
  const { user, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobileNumber || '');
  const [addresses, setAddresses] = useState(user.addresses || []);
  const [newAddress, setNewAddress] = useState('');
  
  const [pastOrders, setPastOrders] = useState([]);

  useEffect(() => {
    dbService.getOrdersForCustomer(user.id).then(setPastOrders);
  }, [user.id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile({ name, mobileNumber: mobile });
    alert('Profile saved!');
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if(!newAddress) return;
    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    await updateUserProfile({ addresses: updatedAddresses });
    setNewAddress('');
  };

  const handleRemoveAddress = async (index) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(updatedAddresses);
    await updateUserProfile({ addresses: updatedAddresses });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 8px' }}>
      
      {/* Header and Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <button className="btn btn-outline hover-scale" style={{ borderRadius: 'var(--radius-full)', padding: '8px 12px' }} onClick={() => navigate('/customer')}>
               <ArrowLeft size={16} /> Back
           </button>
           <div>
             <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1.2 }}>Hi, {user.name}</h2>
             <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your profile and orders</span>
           </div>
         </div>
         <button className="btn hover-scale" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
         </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Personal Details */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20}/> Personal Info</h3>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Full Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Mobile Number</label>
              <input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="(555) 000-0000" style={{ width: '100%' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 24px' }}>Save Details</button>
          </form>
        </div>

        {/* Saved Addresses */}
        <div className="card">
           <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} /> Saved Addresses
           </h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '160px', overflowY: 'auto' }} className="hide-scrollbar">
               {addresses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No addresses saved yet.</p>}
               {addresses.map((addr, idx) => (
                 <div key={idx} className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', background: 'var(--surface)' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>{addr}</span>
                    <button type="button" className="btn btn-outline" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => handleRemoveAddress(idx)}>
                      <Trash2 size={16} />
                    </button>
                 </div>
               ))}
           </div>

           <form onSubmit={handleAddAddress} style={{ display: 'flex', gap: '8px' }}>
              <input value={newAddress} onChange={e=>setNewAddress(e.target.value)} placeholder="e.g. Work: 123 Office Park" required style={{ flex: 1 }} />
              <button className="btn btn-primary" type="submit"><Plus size={18} /></button>
           </form>
        </div>
      </div>

      {/* Order History */}
      <div className="card">
         <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Order History</h3>
         
          {pastOrders.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)' }}>
               <Package size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
               <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No orders yet</h3>
               <p style={{ color: 'var(--text-secondary)' }}>Looks like you haven't placed any orders. Discover restaurants near you!</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pastOrders.map((order, idx) => {
                 const merchant = mockDB.merchants.find(m => m.userId === order.merchantId) || { restaurantName: 'Unknown Restaurant' };
                 return (
                 <div key={order.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s`, display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', background: 'white', boxShadow: 'var(--shadow-sm)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{merchant.restaurantName}</h3>
                       <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
                     </div>
                     <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '16px', background: order.status === 'PENDING' ? '#FEF3C7' : order.status === 'DELIVERED' || order.status === 'COMPLETED' ? '#D1FAE5' : '#DBEAFE', color: order.status === 'PENDING' ? '#92400E' : order.status === 'DELIVERED' || order.status === 'COMPLETED' ? '#065F46' : '#1E40AF' }}>
                       {order.status}
                     </span>
                   </div>
                   <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px', fontSize: '14px' }}>
                     {order.items.map((i, idx) => (
                       <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx !== order.items.length - 1 ? '8px' : 0 }}>
                         <span style={{ fontWeight: '500' }}>1x {i.name}</span>
                       </div>
                     ))}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                     <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Total Paid</span>
                     <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--primary)' }}>₹{order.totalAmount?.toFixed(2)}</span>
                   </div>
                 </div>
                 )
              })}
            </div>
          )}
      </div>

    </div>
  );
}
