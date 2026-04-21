import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { User, MapPin, Plus, Trash2 } from 'lucide-react';

export default function CustomerProfile() {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobileNumber || '');
  const [addresses, setAddresses] = useState(user.addresses || []);
  const [newAddress, setNewAddress] = useState('');

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

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <User /> My Profile
      </h2>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Info</h3>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Mobile Number</label>
            <input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="(555) 000-0000" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Details</button>
        </form>
      </div>

      <div className="card">
         <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} /> Saved Addresses
         </h3>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
             {addresses.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No addresses saved yet.</p>}
             {addresses.map((addr, idx) => (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                  <span>{addr}</span>
                  <button className="btn btn-outline" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => handleRemoveAddress(idx)}>
                    <Trash2 size={16} />
                  </button>
               </div>
             ))}
         </div>

         <form onSubmit={handleAddAddress} style={{ display: 'flex', gap: '8px' }}>
            <input value={newAddress} onChange={e=>setNewAddress(e.target.value)} placeholder="e.g. Work: 123 Office Park" required />
            <button className="btn btn-primary" type="submit"><Plus size={18} /> Add</button>
         </form>
      </div>

    </div>
  );
}
