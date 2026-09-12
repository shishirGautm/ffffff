window.FNAdmin = window.FNAdmin || {};

window.FNAdmin.config = {
 apiKey: "AIzaSyBvE18p7p_C-YrsjkZJC7BDh6GEVPmM_ms",
  authDomain: "footshal.firebaseapp.com",
  projectId: "footshal",
  storageBucket: "footshal.firebasestorage.app",
  messagingSenderId: "405370974979",
  appId: "1:405370974979:web:e716542b75250ce34daf36",
  measurementId: "G-Z0E0STK2HQ"
};

window.FNAdmin.demoMode = Object.values(window.FNAdmin.config).some((value) => typeof value === 'string' && value.includes('YOUR_'));
window.FNAdmin.state = {
  courts: [
    { id: 'court-1', name: 'Anveshan Futsal', owner: 'Aarav Shrestha', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati', address: 'Tinkune, Kathmandu', pricePerHour: 2200, rating: 4.8, bookings: 68, status: 'active', images: ['https://images.unsplash.com/...'], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: true, shower: true, lighting: true, openingTime: '08:00', closingTime: '22:00', contactNumber: '+977-9800000001', description: 'Premium indoor futsal court with a modern synthetic turf.' },
    { id: 'court-2', name: 'GoalZone Futsal', owner: 'Sujan Gurung', city: 'Lalitpur', district: 'Lalitpur', province: 'Bagmati', address: 'Jawalakhel, Lalitpur', pricePerHour: 2500, rating: 4.7, bookings: 52, status: 'active', images: ['https://images.unsplash.com/...'], type: 'Indoor', turfType: 'Hybrid', parking: true, washroom: true, changingRoom: true, shower: true, lighting: true, openingTime: '09:00', closingTime: '23:00', contactNumber: '+977-9800000002', description: 'Convenient and family-friendly futsal venue.' },
    { id: 'court-3', name: 'The Futsal Hub', owner: 'Niraj KC', city: 'Bhaktapur', district: 'Bhaktapur', province: 'Bagmati', address: 'Suryabinayak, Bhaktapur', pricePerHour: 2100, rating: 4.5, bookings: 44, status: 'active', images: ['https://images.unsplash.com/...'], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: true, shower: true, lighting: true, openingTime: '08:30', closingTime: '21:30', contactNumber: '+977-9800000003', description: 'Fast-paced community venue for evening matches.' },
    { id: 'court-4', name: 'PlayArena', owner: 'Rajesh Ghimire', city: 'Pokhara', district: 'Kaski', province: 'Gandaki', address: 'Lakeside, Pokhara', pricePerHour: 2700, rating: 4.9, bookings: 84, status: 'active', images: ['https://images.unsplash.com/...'], type: 'Indoor', turfType: 'Synthetic', parking: true, washroom: true, changingRoom: true, shower: true, lighting: true, openingTime: '08:00', closingTime: '22:00', contactNumber: '+977-9800000004', description: 'Top-rated venue with premium lights and excellent turf quality.' },
    { id: 'court-5', name: 'GamePoint Futsal', owner: 'Manish Thapa', city: 'Biratnagar', district: 'Morang', province: 'Koshi', address: 'Central Bus Park, Biratnagar', pricePerHour: 2300, rating: 4.6, bookings: 38, status: 'inactive', images: ['https://images.unsplash.com/...'], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: true, shower: true, lighting: true, openingTime: '10:00', closingTime: '21:00', contactNumber: '+977-9800000005', description: 'Ideal for weekend tournments and team practice.' },
    { id: 'court-6', name: 'Kathmandu Kickers Arena', owner: 'Venue Owner 6', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati', address: 'Baneshwor, Kathmandu', pricePerHour: 2400, rating: 4.4, bookings: 0, status: 'active', images: [], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: false, shower: false, lighting: true, openingTime: '07:00', closingTime: '22:00', contactNumber: '+977-9800000006', description: 'Editable starter venue listing.' },
    { id: 'court-7', name: 'Lalitpur Soccer Zone', owner: 'Venue Owner 7', city: 'Lalitpur', district: 'Lalitpur', province: 'Bagmati', address: 'Satdobato, Lalitpur', pricePerHour: 2300, rating: 4.4, bookings: 0, status: 'active', images: [], type: 'Indoor', turfType: 'Synthetic', parking: true, washroom: true, changingRoom: true, shower: false, lighting: true, openingTime: '06:00', closingTime: '22:00', contactNumber: '+977-9800000007', description: 'Editable starter venue listing.' },
    { id: 'court-8', name: 'Bhaktapur Goal Station', owner: 'Venue Owner 8', city: 'Bhaktapur', district: 'Bhaktapur', province: 'Bagmati', address: 'Kamalbinayak, Bhaktapur', pricePerHour: 2000, rating: 4.3, bookings: 0, status: 'active', images: [], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: false, shower: false, lighting: true, openingTime: '08:00', closingTime: '21:00', contactNumber: '+977-9800000008', description: 'Editable starter venue listing.' },
    { id: 'court-9', name: 'Pokhara Futsal Point', owner: 'Venue Owner 9', city: 'Pokhara', district: 'Kaski', province: 'Gandaki', address: 'New Road, Pokhara', pricePerHour: 2400, rating: 4.3, bookings: 0, status: 'active', images: [], type: 'Indoor', turfType: 'Hybrid', parking: true, washroom: true, changingRoom: true, shower: false, lighting: true, openingTime: '07:00', closingTime: '22:00', contactNumber: '+977-9800000009', description: 'Editable starter venue listing.' },
    { id: 'court-10', name: 'Chitwan Futsal Center', owner: 'Venue Owner 10', city: 'Bharatpur', district: 'Chitwan', province: 'Bagmati', address: 'Bharatpur, Chitwan', pricePerHour: 1900, rating: 4.2, bookings: 0, status: 'active', images: [], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: false, shower: false, lighting: true, openingTime: '08:00', closingTime: '21:00', contactNumber: '+977-9800000010', description: 'Editable starter venue listing.' },
    { id: 'court-11', name: 'Dharan Football Hub', owner: 'Venue Owner 11', city: 'Dharan', district: 'Sunsari', province: 'Koshi', address: 'Bhanu Chowk, Dharan', pricePerHour: 1800, rating: 4.2, bookings: 0, status: 'active', images: [], type: 'Outdoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: false, shower: false, lighting: true, openingTime: '09:00', closingTime: '21:00', contactNumber: '+977-9800000011', description: 'Editable starter venue listing.' },
    { id: 'court-12', name: 'Butwal Futsal Arena', owner: 'Venue Owner 12', city: 'Butwal', district: 'Rupandehi', province: 'Lumbini', address: 'Traffic Chowk, Butwal', pricePerHour: 1900, rating: 4.1, bookings: 0, status: 'active', images: [], type: 'Indoor', turfType: 'Artificial', parking: true, washroom: true, changingRoom: false, shower: false, lighting: true, openingTime: '08:00', closingTime: '21:00', contactNumber: '+977-9800000012', description: 'Editable starter venue listing.' }
  ],
  bookings: [
    { id: 'BK-1001', user: 'Ritesh Tamang', phone: '+977-9801111111', court: 'Anveshan Futsal', date: '2026-09-12', startTime: '18:00', endTime: '19:30', duration: 90, amount: 4400, paymentMethod: 'eSewa', paymentStatus: 'Paid', bookingStatus: 'Confirmed', createdAt: '2026-09-10' },
    { id: 'BK-1002', user: 'Biraj Karki', phone: '+977-9801111112', court: 'GoalZone Futsal', date: '2026-09-13', startTime: '19:00', endTime: '20:30', duration: 90, amount: 5000, paymentMethod: 'Khalti', paymentStatus: 'Pending', bookingStatus: 'Pending', createdAt: '2026-09-11' },
    { id: 'BK-1003', user: 'Anish Rai', phone: '+977-9801111113', court: 'PlayArena', date: '2026-09-12', startTime: '17:00', endTime: '18:30', duration: 90, amount: 5400, paymentMethod: 'Card', paymentStatus: 'Paid', bookingStatus: 'Completed', createdAt: '2026-09-08' },
    { id: 'BK-1004', user: 'Nischal Thapa', phone: '+977-9801111114', court: 'The Futsal Hub', date: '2026-09-14', startTime: '20:00', endTime: '21:30', duration: 90, amount: 4200, paymentMethod: 'Cash', paymentStatus: 'Paid', bookingStatus: 'Cancelled', createdAt: '2026-09-09' }
  ],
  users: [
    { id: 'user-1', name: 'Ritesh Tamang', email: 'ritesh@example.com', phone: '+977-9801111111', location: 'Kathmandu', bookings: 12, joined: '2024-02-12', status: 'active', avatar: 'RT' },
    { id: 'user-2', name: 'Biraj Karki', email: 'biraj@example.com', phone: '+977-9801111112', location: 'Lalitpur', bookings: 9, joined: '2023-11-20', status: 'active', avatar: 'BK' },
    { id: 'user-3', name: 'Anish Rai', email: 'anish@example.com', phone: '+977-9801111113', location: 'Pokhara', bookings: 15, joined: '2024-01-16', status: 'active', avatar: 'AR' },
    { id: 'user-4', name: 'Nischal Thapa', email: 'nischal@example.com', phone: '+977-9801111114', location: 'Bhaktapur', bookings: 5, joined: '2025-05-10', status: 'disabled', avatar: 'NT' }
  ],
  teams: [
    { id: 'team-1', name: 'Green Warriors', captain: 'Ritesh Tamang', members: 7, location: 'Kathmandu', matchesPlayed: 18, wins: 12, losses: 6, status: 'approved' },
    { id: 'team-2', name: 'City Strikers', captain: 'Biraj Karki', members: 8, location: 'Lalitpur', matchesPlayed: 15, wins: 9, losses: 6, status: 'pending' }
  ],
  matches: [
    { id: 'match-1', teamA: 'Green Warriors', teamB: 'City Strikers', court: 'Anveshan Futsal', date: '2026-09-20', time: '18:00', duration: 60, referee: 'Amit Shah', score: '2 - 1', status: 'Upcoming' },
    { id: 'match-2', teamA: 'Lions FC', teamB: 'Mile High', court: 'GoalZone Futsal', date: '2026-09-18', time: '19:30', duration: 90, referee: 'Shambhu Rai', score: '1 - 1', status: 'Live' }
  ],
  tournaments: [
    { id: 'tournament-1', name: 'Kathmandu Futsal League', location: 'Kathmandu', startDate: '2026-10-01', endDate: '2026-10-14', fee: 2500, prize: 50000, maxTeams: 12, status: 'Open' },
    { id: 'tournament-2', name: 'Pokhara Community Cup', location: 'Pokhara', startDate: '2026-10-10', endDate: '2026-10-18', fee: 2000, prize: 35000, maxTeams: 10, status: 'Closed' }
  ],
  payments: [
    { id: 'txn-1', bookingId: 'BK-1001', user: 'Ritesh Tamang', amount: 4400, method: 'eSewa', paymentDate: '2026-09-10', status: 'Paid' },
    { id: 'txn-2', bookingId: 'BK-1002', user: 'Biraj Karki', amount: 5000, method: 'Khalti', paymentDate: '2026-09-11', status: 'Pending' },
    { id: 'txn-3', bookingId: 'BK-1003', user: 'Anish Rai', amount: 5400, method: 'Card', paymentDate: '2026-09-08', status: 'Paid' }
  ],
  reviews: [
    { id: 'review-1', user: 'Ritesh Tamang', court: 'Anveshan Futsal', rating: 5, review: 'Excellent turf and smooth booking experience.', date: '2026-09-11', status: 'Approved' },
    { id: 'review-2', user: 'Biraj Karki', court: 'GoalZone Futsal', rating: 4, review: 'Good lights and helpful staff.', date: '2026-09-09', status: 'Pending' }
  ],
  notifications: [
    { id: 'notify-1', title: 'New booking received', message: 'A new booking was confirmed for Anveshan Futsal.', target: 'All users', date: '2026-09-12', status: 'Sent' },
    { id: 'notify-2', title: 'Tournament reminder', message: 'Registration window ends in 48 hours.', target: 'Tournament participants', date: '2026-09-11', status: 'Scheduled' }
  ],
  reports: [
    { name: 'Booking report', details: '120 bookings in the last 30 days' },
    { name: 'Revenue report', details: 'NPR 1.3M generated' },
    { name: 'Court performance', details: 'Anveshan and PlayArena are leading' }
  ],
  admins: [
    { id: 'admin-1', name: 'Admin Nepal', email: 'admin@futsalnepal.com', role: 'Super Admin', permissions: ['Dashboard', 'Courts', 'Bookings', 'Users', 'Payments'], status: 'active' },
    { id: 'admin-2', name: 'Manager Team', email: 'manager@futsalnepal.com', role: 'Manager', permissions: ['Courts', 'Bookings', 'Reports'], status: 'active' }
  ]
};

window.FNAdmin.listeners = window.FNAdmin.listeners || [];

window.FNAdmin.syncBookings = function(booking) {
  if (this.demoMode) {
    window.dispatchEvent(new CustomEvent('fn:bookings-changed', { detail: booking || null }));
    return Promise.resolve();
  }

  if (!window.firebase || !firebase.firestore) return Promise.reject(new Error('Firebase is not available.'));
  return firebase.firestore().collection('bookings').doc(booking.id).set(booking, { merge: true });
};

window.FNAdmin.createBooking = function(booking) {
  const hasConflict = this.state.bookings.some((item) => (item.courtId === booking.courtId || item.court === booking.court) && item.date === booking.date && item.startTime === booking.startTime && item.bookingStatus !== 'Cancelled');
  if (hasConflict) return Promise.reject(new Error('That court and time are already booked.'));

  if (this.demoMode) {
    this.state.bookings.push(booking);
    this.state.payments.push({ id: 'TX-' + booking.id, bookingId: booking.id, user: booking.user, userId: booking.userId, courtId: booking.courtId, amount: booking.amount, method: booking.paymentMethod, paymentDate: booking.createdAt, status: 'Pending' });
    window.dispatchEvent(new CustomEvent('fn:bookings-changed', { detail: booking }));
    return Promise.resolve(booking);
  }

  if (!window.firebase || !firebase.firestore) return Promise.reject(new Error('Firebase is not available.'));
  const database = firebase.firestore();
  const bookingRef = database.collection('bookings').doc(booking.id);
  const paymentRef = database.collection('payments').doc('TX-' + booking.id);
  const conflictQuery = database.collection('bookings')
    .where('courtId', '==', booking.courtId)
    .where('date', '==', booking.date)
    .where('startTime', '==', booking.startTime);
  return database.runTransaction((transaction) => transaction.get(conflictQuery).then((snapshot) => {
    const activeConflict = snapshot.docs.some((doc) => doc.data().bookingStatus !== 'Cancelled');
    if (activeConflict) throw new Error('That court and time are already booked.');
    transaction.set(bookingRef, booking);
    transaction.set(paymentRef, { id: 'TX-' + booking.id, bookingId: booking.id, userId: booking.userId, courtId: booking.courtId, user: booking.user, amount: booking.amount, method: booking.paymentMethod, paymentDate: booking.createdAt, status: 'Pending' });
    return booking;
  }));
};

window.FNAdmin.syncCourt = function(court) {
  if (this.demoMode) {
    window.dispatchEvent(new CustomEvent('fn:courts-changed', { detail: court || null }));
    return Promise.resolve();
  }

  if (!window.firebase || !firebase.firestore) return Promise.reject(new Error('Firebase is not available.'));
  return firebase.firestore().collection('courts').doc(court.id).set(court, { merge: true });
};

window.FNAdmin.subscribeToBookings = function() {
  if (this.demoMode || !window.firebase || !firebase.firestore) return;
  if (window.FNAdminAuth && window.FNAdminAuth.getRole() === 'Owner') return;
  this.listeners.forEach((unsubscribe) => unsubscribe());
  this.listeners = [];
  let query = firebase.firestore().collection('bookings');
  if (window.FNAdminAuth && window.FNAdminAuth.getRole() === 'User' && window.FNAdminAuth.user) {
    query = query.where('userId', '==', window.FNAdminAuth.user.uid);
  }
  const unsubscribe = query.onSnapshot((snapshot) => {
    this.state.bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    window.dispatchEvent(new CustomEvent('fn:bookings-changed'));
  }, (error) => {
    console.error('Unable to subscribe to booking updates:', error.message);
    window.dispatchEvent(new CustomEvent('fn:bookings-error', { detail: error }));
  });
  this.listeners.push(unsubscribe);
};

window.FNAdmin.ensureFirebase = function() {
  if (window.FNAdmin.demoMode) {
    console.info('Firebase is in demo mode. Replace the config values in js/firebase-config.js with your Firebase project settings to enable live backend access.');
    return false;
  }

  if (!window.firebase) {
    console.warn('Firebase SDK is not available yet. Check the CDN script tags in index.html.');
    return false;
  }

  if (firebase.apps && firebase.apps.length === 0) {
    try {
      firebase.initializeApp(window.FNAdmin.config);
    } catch (error) {
      console.warn('Firebase initialization failed:', error.message);
      window.FNAdmin.firebaseError = error;
      return false;
    }
  }

  return !!(firebase.apps && firebase.apps.length > 0);
};
