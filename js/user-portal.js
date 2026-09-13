window.FNUserPortal = window.FNUserPortal || {};

window.FNUserPortal.getUserBookings = function() {
  const user = window.FNAdminAuth.user;
  if (!user) return [];
  return window.FNAdmin.state.bookings.filter((booking) => booking.userEmail === user.email || booking.user === user.name);
};

window.FNUserPortal.renderNotifications = function() {
  const list = document.getElementById('userNotificationsList');
  if (!list) return;
  const user = window.FNAdminAuth.user;
  const notifications = (window.FNAdmin.state.notifications || []).filter((item) => ['All', 'Users'].includes(item.target) && (!item.targetUserId || (user && item.targetUserId === user.uid)));
  list.innerHTML = notifications.length ? notifications.map((item) => '<article class="user-notification"><strong>' + item.title + '</strong><p>' + item.message + '</p><small>' + new Date(item.date).toLocaleString() + '</small></article>').join('') : '<p class="muted">No new notifications.</p>';
};

window.FNUserPortal.renderProfile = function() {
  const identity = document.getElementById('userProfileIdentity');
  const details = document.getElementById('userProfileDetails');
  const user = window.FNAdminAuth.user || {};
  if (!identity || !details) return;
  const profile = (window.FNAdmin.state.users || []).find((item) => item.id === user.uid || item.email === user.email) || user;
  const fallbackName = user.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ') : 'player';
  const name = profile.name && profile.name !== profile.email ? profile.name : (user.name && user.name !== user.email ? user.name : fallbackName);
  const initials = name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  const upcomingBookings = this.getUserBookings().filter((booking) => booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Rejected').length;
  const imageUrl = profile.photoURL || profile.photoUrl || (typeof profile.avatar === 'string' && profile.avatar.startsWith('http') ? profile.avatar : '');
  const identityImage = imageUrl ? '<img class="user-profile-image" src="' + imageUrl + '" alt="' + name + ' profile" />' : '<div class="owner-profile-avatar">' + initials + '</div>';
  identity.innerHTML = identityImage + '<div><strong>' + name + '</strong><span>Player account</span></div>';
  details.innerHTML = '<div><span>Name</span><strong>' + name + '</strong></div><div><span>Age</span><strong>' + (profile.age || 'Not added') + '</strong></div><div><span>Contact</span><strong>' + (profile.phone || profile.contactNumber || 'Not added') + '</strong></div><div><span>Email address</span><strong>' + (profile.email || user.email || 'Not available') + '</strong></div><div><span>Account type</span><strong>' + (user.role || profile.role || 'User') + '</strong></div><div><span>Upcoming bookings</span><strong>' + upcomingBookings + '</strong></div>';
  const profileForm = document.getElementById('userProfileForm');
  if (profileForm && profileForm.dataset.profilePopulated !== 'true') {
    profileForm.elements.name.value = name;
    profileForm.elements.age.value = profile.age || '';
    profileForm.elements.phone.value = profile.phone || profile.contactNumber || '';
    profileForm.elements.location.value = profile.location || '';
    profileForm.elements.photoURL.value = imageUrl;
    profileForm.dataset.profilePopulated = 'true';
  }
};

window.FNUserPortal.updateDashboard = function() {
  const userName = document.getElementById('userDisplayName');
  const venueCount = document.getElementById('userVenueCount');
  const teamCount = document.getElementById('userTeamCount');
  const user = window.FNAdminAuth.user;
  this.renderProfile();
  if (userName && user) {
    const fallbackName = user.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ') : 'player';
    userName.textContent = user.name && user.name !== user.email ? user.name : fallbackName;
  }
  if (venueCount) venueCount.textContent = window.FNAdmin.state.courts.filter((court) => court.status === 'active').length + ' venues';
  if (teamCount) teamCount.textContent = (window.FNAdmin.state.teams || []).length + ' teams';
};

window.FNUserPortal.formatDate = function(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

window.FNUserPortal.updateTimeSlots = function() {
  const courtSelect = document.getElementById('userBookingCourt');
  const timeSelect = document.getElementById('userBookingTime');
  if (!courtSelect || !timeSelect) return;

  const openingMinutes = this.toMinutes('06:00');
  const closingMinutes = this.toMinutes('22:00');
  timeSelect.innerHTML = '';
  for (let start = openingMinutes; start + 60 <= closingMinutes; start += 60) {
    const end = start + 60;
    const startTime = this.toTime(start);
    const endTime = this.toTime(end);
    const option = document.createElement('option');
    option.value = startTime + '|' + endTime;
    option.textContent = this.toTimeLabel(startTime) + ' - ' + this.toTimeLabel(endTime);
    timeSelect.appendChild(option);
  }
};

window.FNUserPortal.toMinutes = function(time) {
  const parts = String(time || '08:00').split(':').map(Number);
  return (parts[0] * 60) + parts[1];
};

window.FNUserPortal.toTime = function(minutes) {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
};

window.FNUserPortal.toTimeLabel = function(time) {
  const parts = time.split(':').map(Number);
  const hour = parts[0] % 12 || 12;
  const period = parts[0] < 12 ? 'AM' : 'PM';
  return String(hour).padStart(2, '0') + ':' + String(parts[1]).padStart(2, '0') + ' ' + period;
};

window.FNUserPortal.updateAmount = function() {
  const courtSelect = document.getElementById('userBookingCourt');
  const amount = document.getElementById('userBookingAmount');
  const location = document.getElementById('userCourtLocation');
  const address = document.getElementById('userCourtAddress');
  const availability = document.getElementById('userCourtAvailability');
  const mapLink = document.getElementById('userCourtMapLink');
  if (!courtSelect || !amount) return;
  const court = window.FNAdmin.state.courts.find((item) => item.id === courtSelect.value);
  amount.textContent = court ? 'NPR ' + Number(court.pricePerHour || 0).toLocaleString() : 'NPR 0';
  if (location && mapLink) {
    address.textContent = court ? court.address + ', ' + court.city : 'Select a futsal to see its location.';
    mapLink.href = court ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(court.address + ', ' + court.city + ', Nepal') : '#';
    mapLink.classList.toggle('hidden', !court);
    if (availability) {
      const date = document.getElementById('userBookingDate').value;
      const timeSlot = document.getElementById('userBookingTime').value.split('|');
      const startTime = timeSlot[0];
      const conflict = court && window.FNAdmin.state.bookings.some((booking) => (booking.courtId === court.id || booking.court === court.name) && booking.date === date && booking.startTime === startTime && booking.bookingStatus !== 'Cancelled');
      availability.textContent = court ? (conflict ? 'Not available for this time' : 'Available for this time') : '';
      availability.classList.toggle('unavailable', !!conflict);
    }
  }
};

window.FNUserPortal.renderBookings = function() {
  const list = document.getElementById('userBookingsList');
  const count = document.getElementById('userBookingCount');
  const next = document.getElementById('userNextBooking');
  if (!list || !count || !next) return;

  const bookings = this.getUserBookings().sort((first, second) => (first.date + first.startTime).localeCompare(second.date + second.startTime));
  const upcoming = bookings.filter((booking) => booking.bookingStatus !== 'Cancelled');
  this.updateDashboard();
  count.textContent = upcoming.length + ' upcoming booking' + (upcoming.length === 1 ? '' : 's');
  next.textContent = upcoming[0] ? upcoming[0].court + ' • ' + this.formatDate(upcoming[0].date) + ' at ' + upcoming[0].startTime : 'Book a court to see your next match here.';

  list.innerHTML = bookings.length ? bookings.map((booking) => '<div class="user-booking-item"><div><strong>' + booking.court + '</strong><small>' + this.formatDate(booking.date) + ' • ' + booking.startTime + ' - ' + booking.endTime + '</small><small>' + booking.bookingStatus + ' • ' + booking.paymentMethod + '</small></div><div><span class="booking-price">NPR ' + Number(booking.amount || 0).toLocaleString() + '</span>' + (booking.bookingStatus === 'Pending' || booking.bookingStatus === 'Confirmed' ? '<button class="booking-cancel" type="button" data-booking-id="' + booking.id + '">Cancel</button>' : '') + '</div></div>').join('') : '<p class="muted">You have no bookings yet.</p>';
  list.querySelectorAll('[data-booking-id]').forEach((button) => button.addEventListener('click', () => {
    const booking = window.FNAdmin.state.bookings.find((item) => item.id === button.dataset.bookingId);
    if (!booking) return;
    booking.bookingStatus = 'Cancelled';
    window.FNAdmin.syncBookings(booking).then(() => window.FNAdminComponents.showToast('Booking cancelled.', 'success')).catch(() => window.FNAdminComponents.showToast('Unable to sync the cancellation.', 'error'));
    this.renderBookings();
  }));
};

window.FNUserPortal.renderCourtDirectory = function(searchTerm) {
  const directory = document.getElementById('userCourtDirectory');
  const count = document.getElementById('userCourtDirectoryCount');
  if (!directory || !count) return;

  const query = String(searchTerm || '').trim().toLowerCase();
  const courts = window.FNAdmin.state.courts.filter((court) => !query || [court.name, court.address, court.city, court.district, court.province].filter(Boolean).join(' ').toLowerCase().includes(query));
  count.textContent = courts.length + ' venues';
  directory.innerHTML = courts.length ? courts.map((court) => {
    const location = [court.address, court.city, court.district, court.province, 'Nepal'].filter(Boolean).join(', ');
    const mapLocation = [court.name, location].filter(Boolean).join(', ');
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapLocation);
    const mapEmbedUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(mapLocation) + '&output=embed';
    const imageUrl = (court.images && court.images[0]) || 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=640&q=80';
    const bookingAction = court.status === 'active' ? '<button class="btn btn-primary user-court-book" data-court-id="' + court.id + '" type="button">Book now</button>' : '<span class="court-status inactive">Currently unavailable</span>';
    const amenities = [['parking', 'Parking'], ['washroom', 'Washroom'], ['changingRoom', 'Changing room'], ['shower', 'Shower'], ['lighting', 'Lights']].filter(([key]) => court[key]).map(([, label]) => '<span>' + label + '</span>').join('');
    const contact = court.contactNumber ? '<a href="tel:' + court.contactNumber + '"><i class="fa-solid fa-phone"></i> ' + court.contactNumber + '</a>' : '<span>Contact not available</span>';
    return '<article class="user-court-card"><img class="court-card-image" src="' + imageUrl + '" alt="' + court.name + '" /><h4>' + court.name + '</h4><p class="user-court-address"><i class="fa-solid fa-location-dot"></i> ' + location + '</p><div class="court-meta"><span class="court-price">NPR ' + Number(court.pricePerHour || 0).toLocaleString() + '/hr</span><span>' + (court.openingTime || '08:00') + ' - ' + (court.closingTime || '22:00') + '</span></div><div class="user-court-specs"><span><strong>Type</strong>' + (court.type || 'Indoor') + '</span><span><strong>Turf</strong>' + (court.turfType || 'Artificial') + '</span></div><div class="user-court-map"><div class="user-court-map-heading"><strong>' + court.name + '</strong><span>Live location</span></div><iframe src="' + mapEmbedUrl + '" title="Live map for ' + court.name + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div><div class="user-court-contact">' + contact + '</div>' + (amenities ? '<div class="user-court-amenities">' + amenities + '</div>' : '') + (court.description ? '<p class="user-court-description">' + court.description + '</p>' : '') + '<div class="court-actions">' + bookingAction + '<a class="court-map-link" href="' + mapUrl + '" target="_blank" rel="noopener"><i class="fa-solid fa-map-location-dot"></i> Open ' + court.name + ' map</a></div></article>';
  }).join('') : '<div class="empty-state user-venue-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>No venues found</h3><p>Try a different futsal name or location.</p></div>';

  directory.querySelectorAll('.user-court-book').forEach((button) => {
    button.addEventListener('click', () => {
      const courtSelect = document.getElementById('userBookingCourt');
      const bookingForm = document.getElementById('userBookingForm');
      const bookingPanel = document.getElementById('userBookingPanel');
      if (bookingPanel) bookingPanel.classList.remove('hidden');
      courtSelect.value = button.getAttribute('data-court-id');
      this.updateTimeSlots();
      this.updateAmount();
      bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

window.FNUserPortal.init = function() {
  const courtSelect = document.getElementById('userBookingCourt');
  const form = document.getElementById('userBookingForm');
  const courtSearch = document.getElementById('userCourtSearch');
  const venueSearch = document.getElementById('userVenueSearch');
  const dateInput = document.getElementById('userBookingDate');
  const timeSelect = document.getElementById('userBookingTime');
  if (!courtSelect || !form || !dateInput || !timeSelect) return;

  const userMain = document.getElementById('userDashboardTop');
  const userSidebar = document.querySelector('.user-sidebar');
  const userMobileMenu = document.getElementById('userMobileMenuBtn');
  if (userMobileMenu && userSidebar && userMobileMenu.dataset.fnInitialized !== 'true') {
    userMobileMenu.addEventListener('click', () => {
      const isOpen = userSidebar.classList.toggle('open');
      userMobileMenu.setAttribute('aria-expanded', String(isOpen));
      userMobileMenu.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      userMobileMenu.innerHTML = '<i class="fa-solid fa-' + (isOpen ? 'xmark' : 'bars') + '"></i>';
    });
    userMobileMenu.dataset.fnInitialized = 'true';
  }
  const userNotificationsPanel = document.getElementById('userNotificationsPanel');
  const userHeader = userMain && userMain.querySelector('.user-header');
  if (userMain && userNotificationsPanel && userHeader) userMain.insertBefore(userNotificationsPanel, userHeader.nextSibling);

  if (venueSearch && venueSearch.dataset.fnInitialized !== 'true') {
    venueSearch.addEventListener('input', () => this.renderCourtDirectory(venueSearch.value));
    venueSearch.dataset.fnInitialized = 'true';
  }

  const profileForm = document.getElementById('userProfileForm');
  const profileEditButton = document.getElementById('userProfileEditBtn');
  if (profileEditButton && profileForm && profileEditButton.dataset.fnInitialized !== 'true') {
    profileEditButton.addEventListener('click', () => {
      const isEditing = profileForm.classList.toggle('hidden');
      profileEditButton.setAttribute('aria-label', isEditing ? 'Edit profile' : 'Close profile editor');
      profileEditButton.setAttribute('title', isEditing ? 'Edit profile' : 'Close profile editor');
      profileEditButton.innerHTML = '<i class="fa-solid fa-' + (isEditing ? 'pen' : 'xmark') + '"></i>';
    });
    profileEditButton.dataset.fnInitialized = 'true';
  }
  if (profileForm && profileForm.dataset.fnInitialized !== 'true') {
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const user = window.FNAdminAuth.user;
      if (!user || !user.uid) {
        window.FNAdminComponents.showToast('Please sign in again to update your profile.', 'error');
        return;
      }
      const data = new FormData(profileForm);
      const profile = { id: user.uid, name: data.get('name').trim(), email: user.email || '', role: user.role || 'User', age: data.get('age') ? Number(data.get('age')) : '', phone: data.get('phone').trim(), location: data.get('location').trim(), photoURL: data.get('photoURL').trim(), updatedAt: new Date().toISOString() };
      const save = window.FNAdminData.isLive()
        ? window.FNAdminData.save('users', user.uid, profile)
        : Promise.resolve((window.FNAdmin.state.users = [...(window.FNAdmin.state.users || []).filter((item) => item.id !== user.uid), profile]));
      save.then(() => {
        window.FNAdminAuth.user.name = profile.name;
        window.FNAdmin.state.users = [...(window.FNAdmin.state.users || []).filter((item) => item.id !== user.uid), profile];
        profileForm.dataset.profilePopulated = 'true';
        profileForm.classList.add('hidden');
        if (profileEditButton) {
          profileEditButton.setAttribute('aria-label', 'Edit profile');
          profileEditButton.setAttribute('title', 'Edit profile');
          profileEditButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
        }
        this.updateDashboard();
        window.FNAdminComponents.showToast('Profile updated successfully.', 'success');
      }).catch((error) => {
        console.error('Unable to update profile:', error);
        window.FNAdminComponents.showToast('Profile could not be updated: ' + (error.message || 'permission denied.'), 'error');
      });
    });
    profileForm.dataset.fnInitialized = 'true';
  }

  const findCourtButton = document.getElementById('findCourtBtn');
  const courtDirectory = document.getElementById('userCourtDirectory');
  if (findCourtButton && findCourtButton.dataset.fnInitialized !== 'true') {
    findCourtButton.addEventListener('click', () => courtDirectory && courtDirectory.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    findCourtButton.dataset.fnInitialized = 'true';
  }
  const viewBookingsButton = document.getElementById('viewBookingsBtn');
  const bookingsPanel = document.getElementById('userBookingsPanel');
  if (viewBookingsButton && viewBookingsButton.dataset.fnInitialized !== 'true') {
    viewBookingsButton.addEventListener('click', () => bookingsPanel && bookingsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    viewBookingsButton.dataset.fnInitialized = 'true';
  }
  document.querySelectorAll('[data-user-scroll]').forEach((button) => {
    if (button.dataset.fnInitialized === 'true') return;
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.userScroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('[data-user-scroll]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      if (userSidebar) userSidebar.classList.remove('open');
      if (userMobileMenu) {
        userMobileMenu.setAttribute('aria-expanded', 'false');
        userMobileMenu.setAttribute('aria-label', 'Open navigation');
        userMobileMenu.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });
    button.dataset.fnInitialized = 'true';
  });
  const userNavSelect = document.getElementById('userNavSelect');
  if (userNavSelect && userNavSelect.dataset.fnInitialized !== 'true') {
    userNavSelect.addEventListener('change', () => {
      const target = document.getElementById(userNavSelect.value);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('[data-user-scroll]').forEach((item) => item.classList.toggle('active', item.dataset.userScroll === userNavSelect.value));
    });
    userNavSelect.dataset.fnInitialized = 'true';
  }

  courtSelect.innerHTML = '';
  window.FNAdmin.state.courts.filter((court) => court.status === 'active').forEach((court) => {
    const option = document.createElement('option');
    option.value = court.id;
    option.textContent = court.name + ' - NPR ' + Number(court.pricePerHour).toLocaleString() + '/hour';
    courtSelect.appendChild(option);
  });

  if (courtSelect.dataset.fnInitialized === 'true') {
    this.updateTimeSlots();
    this.updateAmount();
    this.updateDashboard();
    this.renderNotifications();
    this.renderCourtDirectory();
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;
  dateInput.value = today;
  this.updateTimeSlots();
  courtSelect.addEventListener('change', () => {
    this.updateTimeSlots();
    this.updateAmount();
  });
  dateInput.addEventListener('change', () => this.updateAmount());
  timeSelect.addEventListener('change', () => this.updateAmount());
  courtSearch.addEventListener('input', () => {
    const query = courtSearch.value.trim().toLowerCase();
    const currentCourt = courtSelect.value;
    courtSelect.innerHTML = '';
    window.FNAdmin.state.courts.filter((court) => court.status === 'active' && court.name.toLowerCase().includes(query)).forEach((court) => {
      const option = document.createElement('option');
      option.value = court.id;
      option.textContent = court.name + ' - NPR ' + Number(court.pricePerHour).toLocaleString() + '/hour';
      option.selected = court.id === currentCourt;
      courtSelect.appendChild(option);
    });
    if (!courtSelect.value && courtSelect.options.length) courtSelect.selectedIndex = 0;
    this.updateTimeSlots();
    this.updateAmount();
  });
  this.updateAmount();
  this.renderCourtDirectory();
  this.renderNotifications();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = window.FNAdminAuth.user;
    const court = window.FNAdmin.state.courts.find((item) => item.id === courtSelect.value);
    const submitButton = form.querySelector('button[type="submit"]');
    if (!user || !court || !timeSelect.value) {
      window.FNAdminComponents.showToast('Select a court and time slot before confirming.', 'error');
      return;
    }

    const date = dateInput.value;
    const timeSlot = timeSelect.value.split('|');
    const startTime = timeSlot[0];
    const endTime = timeSlot[1];
    const firebaseUser = window.firebase && firebase.auth && firebase.auth().currentUser;
    const userId = (firebaseUser && firebaseUser.uid) || user.uid;
    if (!userId) {
      window.FNAdminComponents.showToast('Your Firebase login session has expired. Please log in again.', 'error');
      return;
    }
    const bookingId = 'BK-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const newBooking = {
      id: bookingId,
      courtId: court.id,
      userId,
      user: user.name,
      userEmail: user.email,
      phone: document.getElementById('userBookingPhone').value.trim(),
      court: court.name,
      date,
      startTime,
      endTime,
      duration: 60,
      amount: court.pricePerHour,
      paymentMethod: document.getElementById('userBookingPayment').value,
      paymentStatus: 'Pending',
      bookingStatus: 'Pending',
      createdAt: today
    };
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving booking...';
    }
    Promise.resolve().then(() => window.FNAdmin.createBooking(newBooking)).then(() => {
      this.renderBookings();
      window.FNAdminComponents.showToast('Booking request submitted. The venue will confirm it shortly.', 'success');
      form.reset();
      dateInput.min = today;
      dateInput.value = today;
      courtSelect.value = court.id;
      this.updateTimeSlots();
      this.updateAmount();
    }).catch((error) => {
      console.error('Unable to create booking:', error);
      const message = error && error.code === 'already-booked'
        ? 'Already booked. Please choose another time.'
        : error && error.code === 'permission-denied'
        ? 'Permission denied. Deploy firebase/firestore.rules and make sure the signed-in user is authenticated.'
        : error && error.code
          ? '(' + error.code + ') ' + (error.message || 'Booking could not be saved.')
          : (error.message || 'Booking could not be saved.');
      window.FNAdminComponents.showToast(message, 'error');
    }).finally(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-regular fa-calendar-check"></i> Confirm booking';
      }
    });
  });

  courtSelect.dataset.fnInitialized = 'true';
  this.renderBookings();
};
