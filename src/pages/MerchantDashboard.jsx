import React, { useState, useEffect } from 'react';
import { mockDB, dbService } from '../mockDB';
import { useAuth } from '../AuthContext';
import { Plus, BellRing, CheckCircle, Image as ImageIcon, Power, TrendingUp } from 'lucide-react';

export default function MerchantDashboard() {
  const { user } = useAuth();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'business'
  const [ordersTab, setOrdersTab] = useState('active'); // 'active', 'ready', 'past'

  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modal State for Orders
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: '', imageUrl: '' });
  const [newCategoryName, setNewCategoryName] = useState('');

  const currentMerchant = mockDB.merchants ? mockDB.merchants.find(m => m.userId === user.id) : null;
  const [merchantOpen, setMerchantOpen] = useState(currentMerchant ? currentMerchant.openStatus !== false : true);

  const toggleMerchantStatus = () => {
    const newStatus = !merchantOpen;
    setMerchantOpen(newStatus);
    const dbMerchant = mockDB.merchants.find(m => m.userId === user.id);
    if(dbMerchant) dbMerchant.openStatus = newStatus;
  };

  useEffect(() => {
    // Load categories
    const cats = mockDB.merchant_categories ? mockDB.merchant_categories.filter(c => c.merchantId === user.id) : [];
    setCategories(cats);

    // Loat menu items
    const items = mockDB.menu_items.filter(i => i.merchantId === user.id);
    setMenuItems(items);

    // Initial Orders load
    dbService.getOrdersForMerchant(user.id).then(setOrders);

    // Real-time listener for new orders
    const unsubscribe = dbService.listenToOrders(user.id, (newOrder) => {
      setOrders(prev => [...prev, newOrder]);
      setNotifications(prev => [...prev, `New order received (#${newOrder.id})! Placed at ${new Date().toLocaleTimeString()}`]);
    });

    return unsubscribe;
  }, [user.id]);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if(!newCategoryName.trim()) return;
    const cat = { id: 'c' + Date.now(), merchantId: user.id, name: newCategoryName };
    if(!mockDB.merchant_categories) mockDB.merchant_categories = [];
    mockDB.merchant_categories.push(cat);
    setCategories([...categories, cat]);
    setNewCategoryName('');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if(!newItem.categoryId) {
      alert("Please select or create a category first.");
      return;
    }
    const item = { 
      id: 'i' + Date.now(), 
      merchantId: user.id, 
      categoryId: newItem.categoryId,
      name: newItem.name, 
      price: Number(newItem.price), 
      imageUrl: newItem.imageUrl,
      isAvailable: true 
    };
    mockDB.menu_items.push(item);
    setMenuItems([...menuItems, item]);
    setNewItem({ name: '', price: '', categoryId: newItem.categoryId, imageUrl: '' });
  };

  const toggleAvailability = (itemId) => {
    setMenuItems(menuItems.map(item => {
      if(item.id === itemId) {
        const updated = { ...item, isAvailable: !item.isAvailable };
        const dbItem = mockDB.menu_items.find(i => i.id === itemId);
        if(dbItem) dbItem.isAvailable = updated.isAvailable;
        return updated;
      }
      return item;
    }));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    const dbOrder = mockDB.orders.find(o => o.id === orderId);
    if(dbOrder) dbOrder.status = newStatus;
  };

  // Computations
  const filteredOrders = orders.filter(o => {
    if(ordersTab === 'active') return o.status === 'PENDING';
    if(ordersTab === 'ready') return o.status === 'READY_FOR_PICKUP';
    if(ordersTab === 'past') return ['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status);
    return true;
  });

  const todayStr = new Date().toLocaleDateString();
  const dailySales = orders
    .filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status) && new Date(o.createdAt).toLocaleDateString() === todayStr)
    .reduce((sum, o) => sum + (o.totalAmount ? o.totalAmount : o.items.reduce((s,i)=>s+(i.price||0), 0)), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Main Dashboard Navigation */}
      <div className="form-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', gap: '16px' }}>
        <div className="tabs-scrollable" style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn hover-scale" 
            style={{ background: activeTab === 'orders' ? 'var(--primary)' : 'transparent', color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)', padding: '8px 24px', fontWeight: activeTab === 'orders' ? 'bold' : 'normal' }}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button 
            className="btn hover-scale" 
            style={{ background: activeTab === 'menu' ? 'var(--primary)' : 'transparent', color: activeTab === 'menu' ? 'white' : 'var(--text-secondary)', padding: '8px 24px', fontWeight: activeTab === 'menu' ? 'bold' : 'normal' }}
            onClick={() => setActiveTab('menu')}
          >
            Menu
          </button>
          <button 
            className="btn hover-scale" 
            style={{ background: activeTab === 'business' ? 'var(--primary)' : 'transparent', color: activeTab === 'business' ? 'white' : 'var(--text-secondary)', padding: '8px 24px', fontWeight: activeTab === 'business' ? 'bold' : 'normal' }}
            onClick={() => setActiveTab('business')}
          >
            Business
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{user.restaurantName} Dashboard</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, marginTop: '4px' }}>Restaurant ID: <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{currentMerchant ? currentMerchant.restaurantId : 'N/A'}</span></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: merchantOpen ? '#D1FAE5' : '#FEE2E2', padding: '6px 12px', borderRadius: '16px' }}>
             <span style={{ fontSize: '13px', fontWeight: 'bold', color: merchantOpen ? '#065F46' : '#991B1B' }}>{merchantOpen ? 'Accepting Orders' : 'Currently Closed'}</span>
             <div 
                onClick={toggleMerchantStatus}
                style={{ width: '40px', height: '22px', borderRadius: '11px', background: merchantOpen ? '#10B981' : '#EF4444', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
             >
                <div style={{ position: 'absolute', top: '2px', left: merchantOpen ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
             </div>
          </div>
        </div>
      </div>

      {/* --- BUSINESS TAB --- */}
      {activeTab === 'business' && (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Daily Sales Overview */}
        <div className="card" style={{ background: '#FFF7F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div>
             <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Daily Total Sale</h3>
             <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>${dailySales.toFixed(2)}</div>
           </div>
           <div style={{ padding: '16px', background: 'white', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
             <TrendingUp size={32} color="var(--primary)" />
           </div>
        </div>
      </div>
      )}

      {/* --- MENU TAB --- */}
      {activeTab === 'menu' && (
      <div className="animate-fade-in layout-dual-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '24px' }}>
          
          {/* Categories Management Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Create Category</h3>
              <form className="form-stack" onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="e.g. Starters, Beverages" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} required style={{ flex: 1 }} />
                <button className="btn btn-primary" type="submit"><Plus size={18} /></button>
              </form>
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map(c => (
                  <span key={c.id} style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '16px', fontSize: '14px' }}>{c.name}</span>
                ))}
                {categories.length === 0 && <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No categories yet.</span>}
              </div>
            </div>
          </div>

          {/* Menu Items Management Column */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Add Menu Item</h3>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
               <div className="form-stack" style={{ display: 'flex', gap: '8px' }}>
                 <select value={newItem.categoryId} onChange={e=>setNewItem({...newItem, categoryId: e.target.value})} required style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <input placeholder="Item Name" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} required style={{ flex: 2 }} />
                 <input type="number" placeholder="Price ($)" value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} required style={{ width: '100px' }} />
               </div>
               <div className="form-stack" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <ImageIcon size={20} color="var(--text-secondary)" />
                 <input placeholder="Image URL (Optional)" value={newItem.imageUrl} onChange={e=>setNewItem({...newItem, imageUrl: e.target.value})} style={{ flex: 1 }} />
                 <button className="btn btn-primary" type="submit"><Plus size={18} /> Add Item</button>
               </div>
            </form>

            <h3 style={{ marginBottom: '16px' }}>Current Menu Inventory</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {menuItems.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', opacity: item.isAvailable ? 1 : 0.6, background: item.isAvailable ? 'white' : '#f9fafb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {item.imageUrl ? (
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} color="var(--text-secondary)" />
                        </div>
                      )}
                      <div>
                        <strong style={{ display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>{cat ? cat.name : 'Uncategorized'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '16px' }}>${item.price.toFixed(2)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: item.isAvailable ? '#065F46' : 'var(--text-secondary)' }}>
                           {item.isAvailable ? 'Available' : 'Turned Off'}
                        </span>
                        <div 
                           onClick={() => toggleAvailability(item.id)}
                           style={{ width: '44px', height: '24px', borderRadius: '12px', background: item.isAvailable ? '#10B981' : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
                        >
                           <div style={{ position: 'absolute', top: '2px', left: item.isAvailable ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {menuItems.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>No items in inventory. Add some!</p>}
            </div>
          </div>
        </div>
      )}


      {/* --- ORDERS TAB --- */}
      {activeTab === 'orders' && (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Real-time Order Notifications */}
        {notifications.length > 0 && (
          <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BellRing size={20} /> Alerts ({notifications.length})
            </h3>
            <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
              {notifications.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
            <button className="btn" style={{ background: 'white', color: 'var(--primary)', marginTop: '12px', padding: '4px 12px' }} onClick={() => setNotifications([])}>Clear Alerts</button>
          </div>
        )}

        {/* Orders Sub-navigation */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)' }}>
          {['active', 'ready', 'past'].map(status => (
            <button 
              key={status}
              style={{ 
                padding: '12px 24px', 
                background: 'transparent', 
                border: 'none', 
                borderBottom: ordersTab === status ? '3px solid var(--primary)' : '3px solid transparent',
                color: ordersTab === status ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: ordersTab === status ? 'bold' : 'normal',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
              onClick={() => setOrdersTab(status)}
            >
              {status === 'active' ? 'Active Orders' : status === 'ready' ? 'Ready for Pickup' : 'Past Orders'}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filteredOrders.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '14px', gridColumn: '1 / -1', padding: '24px', textAlign: 'center', background: 'white', borderRadius: '8px', border: '1px dashed var(--border)' }}>No {ordersTab} orders found.</p> : null}
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="hover-scale"
              style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onClick={() => setSelectedOrder(order)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px' }}>#{order.id.slice(-6)}</strong>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', background: order.status === 'PENDING' ? '#FEF3C7' : order.status === 'READY_FOR_PICKUP' ? '#DBEAFE' : '#D1FAE5', color: order.status === 'PENDING' ? '#92400E' : order.status === 'READY_FOR_PICKUP' ? '#1E40AF' : '#065F46' }}>{order.status}</span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ fontWeight: 'bold', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--primary)' }}>${order.totalAmount ? order.totalAmount.toFixed(2) : order.items.reduce((s, i) => s + (i.price || 0), 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      
      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedOrder(null)}>
          <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Order #{selectedOrder.id}</h2>
              <button className="hover-scale" onClick={() => setSelectedOrder(null)} style={{ background: '#f3f4f6', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ padding: '4px 10px', borderRadius: '12px', background: selectedOrder.status === 'PENDING' ? '#FEF3C7' : selectedOrder.status === 'READY_FOR_PICKUP' ? '#DBEAFE' : '#D1FAE5', color: selectedOrder.status === 'PENDING' ? '#92400E' : selectedOrder.status === 'READY_FOR_PICKUP' ? '#1E40AF' : '#065F46', fontSize: '12px', fontWeight: 'bold' }}>{selectedOrder.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                <span style={{ fontWeight: '500' }}>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              {selectedOrder.deliveryAddress && (
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Delivery Address:</span>
                  <span style={{ fontWeight: '500', background: '#f3f4f6', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>{selectedOrder.deliveryAddress}</span>
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-secondary)' }}>Items Summary</h3>
              <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '12px' }}>
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx !== selectedOrder.items.length - 1 ? '12px' : '0', paddingBottom: idx !== selectedOrder.items.length - 1 ? '12px' : '0', borderBottom: idx !== selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontWeight: '500' }}>1x {i.name}</span>
                    <span style={{ fontWeight: 'bold' }}>${i.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Amount:</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>${selectedOrder.totalAmount ? selectedOrder.totalAmount.toFixed(2) : selectedOrder.items.reduce((s, i) => s + (i.price || 0), 0).toFixed(2)}</span>
            </div>

            {selectedOrder.status === 'PENDING' && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }} 
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, 'READY_FOR_PICKUP');
                  setSelectedOrder({ ...selectedOrder, status: 'READY_FOR_PICKUP' });
                }}
              >
                <CheckCircle size={20} /> Mark Ready for Delivery
              </button>
            )}
            {selectedOrder.status === 'READY_FOR_PICKUP' && (
              <button 
                className="btn" 
                style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '8px', background: '#1E40AF', color: 'white', border: 'none', borderRadius: '8px' }} 
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, 'DELIVERED');
                  setSelectedOrder({ ...selectedOrder, status: 'DELIVERED' });
                }}
              >
                <CheckCircle size={20} /> Mark as Delivered
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
