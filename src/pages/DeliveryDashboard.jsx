import React, { useState, useEffect } from 'react';
import { mockDB } from '../mockDB';
import { useAuth } from '../AuthContext';
import { Truck, Check, Package } from 'lucide-react';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);

  useEffect(() => {
    // Simply poll internal state every second for simplicity in the mock
    const interval = setInterval(() => {
      setAvailableOrders(mockDB.orders.filter(o => o.status === 'READY_FOR_PICKUP'));
      setMyDeliveries(mockDB.orders.filter(o => o.deliveryBoyId === user.id && o.status === 'IN_TRANSIT'));
    }, 1000);
    return () => clearInterval(interval);
  }, [user.id]);

  const acceptOrder = (orderId) => {
    const dbOrder = mockDB.orders.find(o => o.id === orderId);
    if(dbOrder) {
      dbOrder.status = 'IN_TRANSIT';
      dbOrder.deliveryBoyId = user.id;
    }
  };

  const completeDelivery = (orderId) => {
    const dbOrder = mockDB.orders.find(o => o.id === orderId);
    if(dbOrder) {
      dbOrder.status = 'DELIVERED';
    }
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
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${order.totalAmount.toFixed(2)}</span>
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
              </div>
              <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Deliver to: {order.deliveryAddress}</p>
              <button className="btn" style={{ width: '100%', background: '#10B981', color: 'white' }} onClick={() => completeDelivery(order.id)}>
                <Check size={16} /> Mark Delivered
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
