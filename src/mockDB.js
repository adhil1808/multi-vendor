// Basic In-Memory Data Store replicating a document DB
export const mockDB = {
  users: [
    { id: '1', name: 'Super Admin', role: 'SUPER_ADMIN', email: 'admin@app.com', password: 'password' },
    { id: '2', name: 'John Doe', role: 'CUSTOMER', email: 'customer@app.com', password: 'password', mobileNumber: '555-1234', addresses: ['Home: 123 Main St.', 'Work: 456 Office Ave.'] },
    { id: '3', name: 'Bob Delivery', role: 'DELIVERY_BOY', email: 'bob@app.com', password: 'password', phone: '+1 234 567 890', vehicleNumber: 'AB-12-CD-3456' },
    { id: '4', name: 'Pizza Palace', role: 'MERCHANT', email: 'pizza@app.com', password: 'password', restaurantName: 'Pizza Palace' },
    { id: '5', name: 'Burger Haven', role: 'MERCHANT', email: 'burger@app.com', password: 'password', restaurantName: 'Burger Haven' }
  ],
  merchants: [
    { id: 'm1', userId: '4', restaurantName: 'Pizza Palace', restaurantId: '492810', address: '123 Main St', openStatus: true, imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=600&auto=format&fit=crop', phone: '+123 456 7890', fssai: '12345678901234', shopDetails: 'Specialty pizzas.', location: { lat: 28.7041, lng: 77.1025 } },
    { id: 'm2', userId: '5', restaurantName: 'Burger Haven', restaurantId: '109348', address: '789 Grill Road', openStatus: true, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop', phone: '+123 456 7890', fssai: '98765432109876', shopDetails: 'Classic burgers.', location: { lat: 28.7041, lng: 77.1025 } }
  ],
  merchant_categories: [
    { id: 'c1', merchantId: '4', name: 'Pizzas' },
    { id: 'c2', merchantId: '5', name: 'Burgers' },
    { id: 'c3', merchantId: '4', name: 'Beverages' }
  ],
  menu_items: [
    { id: 'i1', merchantId: '4', categoryId: 'c1', name: 'Margherita Pizza', description: 'Classic cheese and tomato', price: 12.99, imageUrl: '', isAvailable: true },
    { id: 'i2', merchantId: '4', categoryId: 'c1', name: 'Pepperoni Pizza', description: 'Spicy pepperoni slices', price: 14.99, imageUrl: '', isAvailable: true },
    { id: 'i3', merchantId: '5', categoryId: 'c2', name: 'Classic Cheeseburger', description: 'Beef patty with cheddar', price: 9.99, imageUrl: '', isAvailable: true }
  ],
  systemBanners: [
      { id: 'b1', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop', link: '#', isActive: true },
      { id: 'b2', imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop', link: '#', isActive: true }
  ],
  offers: [
      { id: 'off1', merchantId: '4', type: 'FLAT', amount: 5, discountText: '$5 OFF YOUR FIRST ORDER', code: 'PIZZA5' },
      { id: 'off2', merchantId: 'ALL', type: 'PERCENTAGE', amount: 10, discountText: '10% OFF MONDAY MADNESS', code: 'MONDAY10' }
  ],
  orders: []
};

// Seed historical orders for Analytics over the past 7 days
const seedHistoricalOrders = () => {
    const today = new Date();
    const statuses = ['DELIVERED', 'COMPLETED'];
    for(let i=0; i<30; i++) { // Generate 30 random past orders
        const daysAgo = Math.floor(Math.random() * 7); // 0 to 6 days ago
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - daysAgo);
        
        const isPizza = Math.random() > 0.4; // 60% pizza orders
        
        mockDB.orders.push({
            id: 'ok_past_' + i,
            customerId: '2',
            merchantId: isPizza ? '4' : '5',
            items: isPizza ? [{name: 'Historical Pizza', price: 13.99}] : [{name: 'Historical Burger', price: 9.99}],
            totalAmount: isPizza ? (13.99 * (Math.floor(Math.random()*3)+1)) : (9.99 * (Math.floor(Math.random()*3)+1)),
            status: statuses[Math.floor(Math.random()*statuses.length)],
            createdAt: pastDate.toISOString(),
            deliveryAddress: 'Home: 123 Main St.',
            deliveryBoyId: '3'
        });
    }
};

seedHistoricalOrders();

// Simulation delays (ms)
const SIMULATED_LATENCY = 300;

export const authService = {
  login: async (identifier, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Standard Email Lookup
        let user = mockDB.users.find(u => u.email === identifier && u.password === password);
        
        // Fallback: Restaurant ID Lookup
        if (!user) {
           const merchantRecord = mockDB.merchants.find(m => m.restaurantId === identifier);
           if (merchantRecord) {
              user = mockDB.users.find(u => u.id === merchantRecord.userId && u.password === password);
           }
        }

        if (user) resolve(user);
        else reject(new Error('Invalid credentials'));
      }, SIMULATED_LATENCY);
    });
  },
  updateProfile: async (userId, data) => {
    return new Promise(resolve => {
        setTimeout(() => {
            const userIndex = mockDB.users.findIndex(u => u.id === userId);
            if (userIndex > -1) {
                mockDB.users[userIndex] = { ...mockDB.users[userIndex], ...data };
                resolve(mockDB.users[userIndex]);
            }
        }, SIMULATED_LATENCY);
    });
  }
};

export const dbService = {
  getOrdersForMerchant: async (merchantId) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockDB.orders.filter(o => o.merchantId === merchantId));
      }, SIMULATED_LATENCY);
    });
  },
  getAllOrders: async () => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockDB.orders);
        }, SIMULATED_LATENCY);
    });
  },
  placeOrder: async (orderData) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const newOrder = { ...orderData, id: 'o' + Date.now(), status: 'PENDING', createdAt: new Date().toISOString() };
        mockDB.orders.push(newOrder);
        
        // Dispatch Custom Event for Real-Time Mock
        const event = new CustomEvent('order-placed', { detail: newOrder });
        window.dispatchEvent(event);
        
        resolve(newOrder);
      }, SIMULATED_LATENCY);
    });
  },
  // Real-time listener mock
  listenToOrders: (merchantId, callback) => {
    const listener = (event) => {
      if(event.detail.merchantId === merchantId) {
        callback(event.detail);
      }
    };
    window.addEventListener('order-placed', listener);
    return () => window.removeEventListener('order-placed', listener); // Unsubscribe
  }
};
