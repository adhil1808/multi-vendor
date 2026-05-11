import React, { useState, useEffect } from 'react';
import { firebaseDBService } from '../services/firebaseDB';
import { useAuth } from '../AuthContext';
import { Truck, Check, Package } from 'lucide-react';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const readyOrders = await firebaseDBService.getOrdersByStatus('READY_FOR_PICKUP');
      setAvailableOrders(readyOrders);
      
      const myActive = await firebaseDBService.getOrdersByDeliveryBoy(user.id, 'IN_TRANSIT');
      setMyDeliveries(myActive);

      const allMerchants = await firebaseDBService.getAllMerchants();
      setMerchants(allMerchants);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [user.id]);

  const acceptOrder = async (orderId) => {
    try {
      await firebaseDBService.assignOrderToDeliveryBoy(orderId, user.id);
      // Refresh local state immediately
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      const order = availableOrders.find(o => o.id === orderId);
      if(order) setMyDeliveries(prev => [...prev, { ...order, status: 'IN_TRANSIT', deliveryBoyId: user.id }]);
    } catch(err) {
      alert("Failed to accept order");
    }
  };

  const completeDelivery = async (orderId) => {
    try {
      await firebaseDBService.updateOrderStatus(orderId, 'DELIVERED');
      setMyDeliveries(prev => prev.filter(o => o.id !== orderId));
    } catch(err) {
      alert("Failed to complete delivery");
    }
  };
  const getUpiQrUrl = (merchantId, amount) => {
    const merchant = merchants.find(m => m.userId === merchantId);
    if (!merchant || !merchant.upiId) return null;
    
    // UPI URI: upi://pay?pa=upiid@bank&pn=MerchantName&am=Amount&cu=INR
    const upiUri = `upi://pay?pa=${merchant.upiId}&pn=${encodeURIComponent(merchant.restaurantName)}&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  };
  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
      
      {/* Target pool */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <Package /> Available for Delivery ({availableOrders.length})
        </h3>
        
        {availableOrders.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No orders currently ready for pickup.</p> : null}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {availableOrders.map(order => (
            <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', background: 'var(--bg-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>Order #{order.id}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Deliver to: {order.deliveryAddress}</p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => acceptOrder(order.id)}>
                Accept Delivery
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active deliveries */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <Truck /> My Active Deliveries ({myDeliveries.length})
        </h3>

        {myDeliveries.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>You don't have any active deliveries.</p> : null}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myDeliveries.map(order => (
            <div key={order.id} style={{ border: '1px solid var(--primary-light)', borderRadius: '8px', padding: '16px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>Order #{order.id}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Deliver to: {order.deliveryAddress}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onClick={() => setSelectedQR(order)}
                >
                  Show QR Pay
                </button>
                <button className="btn" style={{ width: '100%', background: '#10B981', color: 'white' }} onClick={() => completeDelivery(order.id)}>
                  <Check size={16} /> Mark Delivered
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedQR(null)}
        >
          <div 
            className="card animate-scale-in" 
            style={{ maxWidth: '350px', width: '90%', textAlign: 'center', padding: '32px' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '8px' }}>Scan to Pay</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Amount: <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>₹{selectedQR.totalAmount.toFixed(2)}</span>
            </p>
            
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', display: 'inline-block' }}>
               {getUpiQrUrl(selectedQR.merchantId, selectedQR.totalAmount) ? (
                 <img 
                   src={getUpiQrUrl(selectedQR.merchantId, selectedQR.totalAmount)} 
                   alt="UPI QR Code" 
                   style={{ width: '200px', height: '200px' }}
                 />
               ) : (
                 <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red', fontSize: '14px' }}>
                   Merchant UPI ID not set.
                 </div>
               )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedQR(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
