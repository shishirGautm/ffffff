window.FNOwnerPortal = window.FNOwnerPortal || {};

window.FNOwnerPortal.getCourts = function() {
  const owner = window.FNAdminAuth.user;
  return owner ? window.FNAdmin.state.courts.filter((court) => court.ownerId === owner.uid || court.owner === owner.name) : [];
};

window.FNOwnerPortal.readImageFile = function(file) {
  if (!file) return Promise.resolve('');
  if (!['image/jpeg', 'image/png'].includes(file.type)) return Promise.reject(new Error('Please choose a JPG or PNG image.'));
  if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('Profile image must be 5 MB or smaller.'));
  if (window.FNAdminData.isLive()) return window.FNAdminData.uploadAsset(file, 'profiles/owner-' + Date.now() + '-' + file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
};

window.FNOwnerPortal.renderNotifications = function() {
  const list = document.getElementById('ownerNotificationsList');
  if (!list) return;
  const owner = window.FNAdminAuth.user || {};
  const ownerCourts = (window.FNAdmin.state.courts || []).filter((court) => court.ownerId === owner.uid || court.owner === owner.name);
  const expiryLimit = Date.now() - (3 * 24 * 60 * 60 * 1000);
  const notifications = (window.FNAdmin.state.notifications || []).filter((item) => new Date(item.date || 0).getTime() >= expiryLimit && (() => {
    if (item.target === 'All' || item.target === 'Owners') return true;
    return item.target === 'Staff' && item.type === 'booking' && ownerCourts.some((court) => court.id === item.courtId || court.name === item.court);
  })());
  const notificationMarkup = notifications.length ? notifications.map((item) => '<article class="user-notification"><div class="notification-item-heading"><strong>' + item.title + '</strong><button class="notification-delete-button" type="button" data-owner-notification-delete="' + item.id + '" title="Delete notification" aria-label="Delete notification"><i class="fa-solid fa-trash"></i></button></div><p>' + item.message + '</p><small>' + new Date(item.date).toLocaleString() + '</small></article>').join('') : '<p class="muted">No new notifications.</p>';
  list.innerHTML = notificationMarkup;
  list.querySelectorAll('[data-owner-notification-delete]').forEach((button) => button.addEventListener('click', () => window.FNAdmin.deleteNotification(button.dataset.ownerNotificationDelete, () => this.renderNotifications())));
  const preview = document.getElementById('ownerNotificationPreview');
  const summary = document.getElementById('ownerNotificationSummary');
  if (preview) preview.innerHTML = notifications.length ? notifications.slice(0, 5).map((item) => '<article class="owner-notification-preview-item"><strong>' + item.title + '</strong><p>' + item.message + '</p><small>' + new Date(item.date).toLocaleString() + '</small></article>').join('') : '<p class="owner-notification-empty">No notifications yet.</p>';
  if (summary) summary.textContent = notifications.length + ' updates';
  window.FNAdmin.cleanupExpiredNotifications().catch((error) => console.error('Unable to remove expired notifications:', error));
};

window.FNOwnerPortal.renderProfile = function(courts) {
  const identity = document.getElementById('ownerProfileIdentity');
  const details = document.getElementById('ownerProfileDetails');
  const owner = window.FNAdminAuth.user || {};
  if (!details) return;
  const ownerName = owner.name || 'Court owner';
  const initials = ownerName.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  const imageUrl = owner.photoURL || owner.photoUrl || '';
  if (identity) identity.innerHTML = (imageUrl ? '<img class="user-profile-image" src="' + imageUrl + '" alt="' + ownerName + ' profile" />' : '<div class="owner-profile-avatar">' + initials + '</div>') + '<div><strong>' + ownerName + '</strong><span>Venue account</span></div>';
  details.innerHTML = '<div><span>Email address</span><strong>' + (owner.email || 'Not available') + '</strong></div>' +
    '<div><span>Account type</span><strong>' + (owner.role || 'Owner') + '</strong></div>' +
    '<div><span>Assigned courts</span><strong>' + courts.length + '</strong></div>';
  const form = document.getElementById('ownerProfileForm');
  if (form && form.dataset.profilePopulated !== 'true') {
    form.elements.name.value = owner.name || '';
    form.dataset.profilePopulated = 'true';
  }
};

window.FNOwnerPortal.initProfileForm = function() {
  const form = document.getElementById('ownerProfileForm');
  const editButton = document.getElementById('ownerProfileEditBtn');
  if (!form || form.dataset.fnInitialized === 'true') return;
  if (editButton) editButton.addEventListener('click', () => {
    const isHidden = form.classList.toggle('hidden');
    editButton.innerHTML = '<i class="fa-solid fa-' + (isHidden ? 'pen' : 'xmark') + '"></i>';
    editButton.setAttribute('aria-label', isHidden ? 'Edit profile' : 'Close profile editor');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const owner = window.FNAdminAuth.user;
    if (!owner) return;
    const data = new FormData(form);
    const file = data.get('photoFile');
    this.readImageFile(file && file.size ? file : null).then((uploadedImage) => {
      const profile = { id: owner.uid || 'demo-owner', name: data.get('name').trim(), email: owner.email || '', role: 'Owner', photoURL: uploadedImage || owner.photoURL || owner.photoUrl || '', updatedAt: new Date().toISOString() };
      const save = window.FNAdminData.isLive() && owner.uid ? window.FNAdminData.save('users', owner.uid, profile) : Promise.resolve();
      return save.then(() => profile);
    }).then((profile) => {
      Object.assign(owner, profile);
      form.dataset.profilePopulated = 'true';
      form.classList.add('hidden');
      this.renderProfile(this.getCourts());
      window.FNAdminComponents.showToast('Profile updated successfully.', 'success');
    }).catch((error) => window.FNAdminComponents.showToast(error.message || 'Profile could not be updated.', 'error'));
  });
  form.dataset.fnInitialized = 'true';
};

window.FNOwnerPortal.getBookings = function(courts) {
  const courtIds = courts.map((court) => court.id);
  const courtNames = courts.map((court) => court.name);
  return (window.FNAdmin.state.bookings || []).filter((booking) => courtIds.includes(booking.courtId) || courtNames.includes(booking.court));
};

window.FNOwnerPortal.renderHeaderActions = function(bookings) {
  const pendingCount = bookings.filter((booking) => String(booking.bookingStatus || '').toLowerCase() === 'pending').length;
  const owner = window.FNAdminAuth.user || {};
  const ownerCourts = (window.FNAdmin.state.courts || []).filter((court) => court.ownerId === owner.uid || court.owner === owner.name);
  const notifications = (window.FNAdmin.state.notifications || []).filter((item) => ['All', 'Owners'].includes(item.target) || (item.target === 'Staff' && item.type === 'booking' && ownerCourts.some((court) => court.id === item.courtId || court.name === item.court)));
  const bookingCount = document.getElementById('ownerBookingRequestsCount');
  const notificationCount = document.getElementById('ownerNotificationsCount');
  if (bookingCount) bookingCount.textContent = pendingCount > 99 ? '99+' : String(pendingCount);
  if (notificationCount) notificationCount.textContent = notifications.length > 99 ? '99+' : String(notifications.length);
};

window.FNOwnerPortal.initHeaderActions = function() {
  const actions = [
    ['ownerBookingRequestsBtn', 'ownerReservationsPanel'],
    ['ownerNotificationsBtn', 'ownerNotificationsList']
  ];
  actions.forEach(([buttonId, targetId]) => {
    const button = document.getElementById(buttonId);
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  });
  const notificationButton = document.getElementById('ownerNotificationsBtn');
  const notificationDropdown = document.getElementById('ownerNotificationDropdown');
  const viewAll = document.getElementById('viewOwnerNotificationsBtn');
  if (notificationButton && notificationDropdown && notificationButton.dataset.dropdownBound !== 'true') {
    notificationButton.dataset.dropdownBound = 'true';
    notificationButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = notificationDropdown.classList.toggle('is-hidden');
      notificationButton.setAttribute('aria-expanded', String(!isHidden));
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.owner-notification-menu')) {
        notificationDropdown.classList.add('is-hidden');
        notificationButton.setAttribute('aria-expanded', 'false');
      }
    });
  }
  if (viewAll && viewAll.dataset.bound !== 'true') {
    viewAll.dataset.bound = 'true';
    viewAll.addEventListener('click', () => document.getElementById('ownerNotificationsList')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
};

window.FNOwnerPortal.renderSummary = function(courts, bookings) {
  const holder = document.getElementById('ownerDashboardSummary');
  if (!holder) return;
  const today = new Date().toISOString().slice(0, 10);
  const active = (booking) => !['cancelled', 'rejected'].includes(String(booking.bookingStatus || '').toLowerCase());
  const todayBookings = bookings.filter((booking) => booking.date === today && active(booking));
  const upcoming = bookings.filter((booking) => booking.date >= today && active(booking));
  const revenue = todayBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const blockedToday = courts.reduce((sum, court) => sum + (court.blockedSlots || []).filter((slot) => slot.indexOf(today + ' | ') === 0).length, 0);
  const totalSlots = courts.reduce((sum, court) => {
    const start = Number(String(court.openingTime || '08:00').split(':')[0]) * 60 + Number(String(court.openingTime || '08:00').split(':')[1] || 0);
    const end = Number(String(court.closingTime || '22:00').split(':')[0]) * 60 + Number(String(court.closingTime || '22:00').split(':')[1] || 0);
    return sum + Math.max(0, Math.floor((end - start) / Number(court.slotDuration || 90)));
  }, 0);
  const stats = [
    ['Today\'s bookings', todayBookings.length.toLocaleString(), 'fa-regular fa-calendar-check'],
    ['Today\'s revenue', 'NPR ' + revenue.toLocaleString(), 'fa-solid fa-wallet'],
    ['Available slots', Math.max(0, totalSlots - todayBookings.length - blockedToday).toLocaleString(), 'fa-regular fa-clock'],
    ['Upcoming bookings', upcoming.length.toLocaleString(), 'fa-solid fa-arrow-trend-up']
  ];
  holder.innerHTML = stats.map((stat) => '<article class="owner-summary-card"><i class="' + stat[2] + '"></i><span>' + stat[0] + '</span><strong>' + stat[1] + '</strong></article>').join('');
  const periodHolder = document.getElementById('ownerPeriodStats');
  if (periodHolder) {
    const now = new Date(today + 'T00:00:00');
    const countInPeriod = (days) => bookings.filter((booking) => {
      const date = new Date(String(booking.date || '') + 'T00:00:00');
      return active(booking) && !Number.isNaN(date.valueOf()) && date >= new Date(now.valueOf() - (days - 1) * 86400000) && date <= now;
    }).length;
    periodHolder.innerHTML = [['Daily', 1], ['Weekly', 7], ['Monthly', 30]].map((period) => '<div><span>' + period[0] + '</span><strong>' + countInPeriod(period[1]).toLocaleString() + '</strong><small>bookings</small></div>').join('');
  }
};

window.FNOwnerPortal.render = function() {
  const ownerGreeting = document.getElementById('ownerGreetingText');
  if (ownerGreeting) ownerGreeting.textContent = window.FNAdminComponents.getTimeGreeting();

  const panel = document.getElementById('ownerCourtPanel');
  const bookingsList = document.getElementById('ownerBookingsList');
  if (!panel || !bookingsList) return;
  const ownerSection = document.getElementById('ownerSection');
  const ownerReservationsPanel = document.getElementById('ownerReservationsPanel');
  const ownerNotificationsPanel = ownerSection && ownerSection.querySelector('.user-notifications-panel');
  if (ownerSection && panel && ownerReservationsPanel) {
    ownerSection.insertBefore(ownerReservationsPanel, panel.nextSibling);
    if (ownerNotificationsPanel) ownerSection.appendChild(ownerNotificationsPanel);
  }
  this.renderNotifications();
  this.initProfileForm();

  const courts = this.getCourts();
  const bookings = this.getBookings(courts);
  this.renderHeaderActions(bookings);
  this.initHeaderActions();
  this.renderProfile(courts);
  this.renderSummary(courts, bookings);
  if (!courts.length) {
    panel.innerHTML = '<section class="user-panel"><div class="empty-state"><i class="fa-solid fa-futbol"></i><h3>No courts assigned</h3><p>Ask an administrator to assign a court to your owner account.</p></div></section>';
    bookingsList.innerHTML = '<p class="muted">No bookings available.</p>';
    return;
  }

  panel.innerHTML = courts.map((court) => {
    const location = [court.address, court.city, court.district, court.province, 'Nepal'].filter(Boolean).join(', ');
    const mapLocation = [court.name, location].filter(Boolean).join(', ');
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapLocation);
    const mapEmbedUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(mapLocation) + '&output=embed';
    return '<article class="owner-court-card">' + ((court.images && court.images[0]) ? '<button class="court-image-button" type="button" data-court-image="' + court.images[0] + '" data-court-name="' + court.name + '" aria-label="View ' + court.name + ' image"><img class="court-card-image" src="' + court.images[0] + '" alt="' + court.name + '" /><span><i class="fa-solid fa-expand"></i> View image</span></button>' : '') + '<h3>' + court.name + '</h3><p>' + location + '</p><div class="owner-court-map"><div class="owner-court-map-heading"><strong>' + court.name + '</strong><span>Live location</span></div><iframe src="' + mapEmbedUrl + '" title="Live map for ' + court.name + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a href="' + mapUrl + '" target="_blank" rel="noopener"><i class="fa-solid fa-map-location-dot"></i> Open ' + court.name + ' map</a></div><form class="owner-court-form" data-court-id="' + court.id + '"><label>Futsal name<input name="name" value="' + (court.name || '') + '" required /></label><label>Futsal photo<input name="photo" type="file" accept="image/*" /></label><label>Address<input name="address" value="' + (court.address || '') + '" required /></label><label>City<input name="city" value="' + (court.city || '') + '" required /></label><label>District<input name="district" value="' + (court.district || '') + '" /></label><label>Province<input name="province" value="' + (court.province || '') + '" /></label><label>Contact number<input name="contactNumber" value="' + (court.contactNumber || '') + '" /></label><label>Price per hour<input name="pricePerHour" type="number" min="0" value="' + court.pricePerHour + '" required /></label><label>Court type<select name="type"><option value="Indoor" ' + (court.type === 'Indoor' ? 'selected' : '') + '>Indoor</option><option value="Outdoor" ' + (court.type === 'Outdoor' ? 'selected' : '') + '>Outdoor</option></select></label><label>Turf type<select name="turfType"><option value="Artificial" ' + (court.turfType === 'Artificial' ? 'selected' : '') + '>Artificial</option><option value="Synthetic" ' + (court.turfType === 'Synthetic' ? 'selected' : '') + '>Synthetic</option><option value="Hybrid" ' + (court.turfType === 'Hybrid' ? 'selected' : '') + '>Hybrid</option></select></label><label>Availability<select name="status"><option value="active" ' + (court.status === 'active' ? 'selected' : '') + '>Available</option><option value="inactive" ' + (court.status === 'inactive' ? 'selected' : '') + '>Unavailable</option></select></label><label>Opening time<input name="openingTime" type="time" value="' + (court.openingTime || '08:00') + '" required /></label><label>Closing time<input name="closingTime" type="time" value="' + (court.closingTime || '22:00') + '" required /></label><label class="owner-field-wide">Description<textarea name="description" rows="3">' + (court.description || '') + '</textarea></label><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save court settings</button></form></article>';
  }).join('');

  panel.querySelectorAll('[data-court-image]').forEach((button) => button.addEventListener('click', () => {
    const imageUrl = button.dataset.courtImage;
    const courtName = button.dataset.courtName || 'Futsal court';
    window.FNAdminComponents.openModal('<div class="panel__header"><div><p class="eyebrow text-green">Court image</p><h3>' + courtName + '</h3></div><button class="icon-button" data-close-modal="true" aria-label="Close image preview"><i class="fa-solid fa-xmark"></i></button></div><div class="court-image-preview"><img src="' + imageUrl + '" alt="' + courtName + '" /></div>');
    document.querySelectorAll('[data-close-modal="true"]').forEach((closeButton) => closeButton.addEventListener('click', window.FNAdminComponents.closeModal));
  }));

  bookingsList.innerHTML = bookings.length ? bookings.sort((first, second) => (first.date + first.startTime).localeCompare(second.date + second.startTime)).map((booking) => '<div class="owner-booking-row"><div><strong>' + booking.court + ' • ' + booking.user + '</strong><small>' + booking.date + ' • ' + booking.startTime + ' - ' + booking.endTime + ' • ' + booking.phone + ' • ' + booking.paymentMethod + ' (' + booking.paymentStatus + ')</small></div><div class="owner-booking-actions">' + window.FNAdminComponents.getStatusBadge(booking.bookingStatus) + (booking.bookingStatus === 'Pending' ? '<button type="button" data-owner-booking-action="confirm" data-booking-id="' + booking.id + '">Confirm</button><button type="button" data-owner-booking-action="reject" data-booking-id="' + booking.id + '">Reject</button>' : '') + (booking.bookingStatus === 'Cancelled' ? '<button class="icon-button danger" type="button" data-owner-booking-action="delete" data-booking-id="' + booking.id + '" title="Delete cancelled reservation" aria-label="Delete cancelled reservation"><i class="fa-solid fa-trash"></i></button>' : (!['Rejected', 'Completed'].includes(booking.bookingStatus) ? '<button class="icon-button danger" type="button" data-owner-booking-action="cancel" data-booking-id="' + booking.id + '" title="Delete reservation" aria-label="Delete reservation"><i class="fa-solid fa-trash"></i></button>' : '')) + '</div></div>').join('') : '<p class="muted">No bookings for your courts yet.</p>';

  panel.querySelectorAll('.owner-court-form').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const court = window.FNAdmin.state.courts.find((item) => item.id === form.dataset.courtId);
    if (!court) return;
    const data = new FormData(form);
    const saveButton = form.querySelector('button[type="submit"]');
    const photo = data.get('photo');
    const owner = window.FNAdminAuth.user;
    const updatedCourt = { ...court,
      name: data.get('name'),
      address: data.get('address'),
      city: data.get('city'),
      district: data.get('district'),
      province: data.get('province'),
      contactNumber: data.get('contactNumber'),
      pricePerHour: Number(data.get('pricePerHour')),
      type: data.get('type'),
      turfType: data.get('turfType'),
      status: data.get('status'),
      openingTime: data.get('openingTime'),
      closingTime: data.get('closingTime'),
      description: data.get('description'),
      ownerId: court.ownerId || (owner && owner.uid)
    };
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }
    const withTimeout = (promise, message) => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(message)), 15000);
      promise.then(resolve, reject).finally(() => clearTimeout(timeout));
    });
    const upload = photo && photo.size
      ? withTimeout(window.FNAdminData.uploadAsset(photo, 'courts/' + court.id + '/' + Date.now() + '-' + photo.name), 'Firebase Storage is not ready. Open the Firebase Console for the footshal project, select Storage, and click Get started.')
      : Promise.resolve('');
    upload.then((imageUrl) => {
      if (imageUrl) updatedCourt.images = [imageUrl];
      Object.assign(court, updatedCourt);
      return window.FNAdmin.syncCourt(updatedCourt);
    }).then(() => {
      window.FNAdminComponents.showToast('Court profile saved.', 'success');
      this.render();
    }).catch((error) => {
      console.error('Unable to save owner court:', error);
      window.FNAdminComponents.showToast('Court could not be saved: ' + (error.message || 'permission denied.'), 'error');
    }).finally(() => {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save court settings';
      }
    });
  }));

  bookingsList.querySelectorAll('[data-owner-booking-action]').forEach((button) => button.addEventListener('click', () => {
    const booking = window.FNAdmin.state.bookings.find((item) => item.id === button.dataset.bookingId);
    if (!booking) return;
    if (button.dataset.ownerBookingAction === 'delete') {
      if (!window.confirm('Delete this cancelled reservation permanently?')) return;
      window.FNAdmin.deleteBooking(booking).then(() => {
        this.render();
        window.FNAdminComponents.showToast('Cancelled reservation deleted.', 'success');
      }).catch((error) => {
        console.error('Unable to delete cancelled reservation:', error);
        window.FNAdminComponents.showToast('Reservation could not be deleted: ' + (error.message || 'permission denied.'), 'error');
      });
      return;
    }
    if (button.dataset.ownerBookingAction === 'cancel') {
      if (!window.confirm('Delete this reservation? It will be cancelled and the time will become available.')) return;
      booking.bookingStatus = 'Cancelled';
      window.FNAdmin.syncBookings(booking).then(() => {
        this.render();
        window.FNAdminComponents.showToast('Reservation deleted and time released.', 'success');
      }).catch((error) => {
        console.error('Unable to delete owner reservation:', error);
        window.FNAdminComponents.showToast('Reservation could not be deleted: ' + (error.message || 'permission denied.'), 'error');
      });
      return;
    }
    if (button.dataset.ownerBookingAction === 'reject') {
      booking.bookingStatus = 'Rejected';
      window.FNAdmin.syncBookings(booking).then(() => {
        this.render();
        window.FNAdminComponents.showToast('Booking rejected.', 'success');
      }).catch((error) => window.FNAdminComponents.showToast('Booking could not be rejected: ' + (error.message || 'permission denied.'), 'error'));
      return;
    }
    if (window.FNAdmin.hasBookingConflict(booking, booking.id)) {
      booking.bookingStatus = 'Rejected';
      window.FNAdmin.syncBookings(booking).then(() => {
        this.render();
        window.FNAdminComponents.showToast('Booking rejected: already booked for this date and time.', 'error');
      }).catch((error) => {
        console.error('Unable to reject conflicting booking:', error);
        window.FNAdminComponents.showToast('Booking could not be rejected: ' + (error.message || 'permission denied.'), 'error');
      });
      return;
    }
    booking.bookingStatus = 'Confirmed';
    window.FNAdmin.syncBookings(booking).then(() => {
      this.render();
      window.FNAdminComponents.showToast('Booking confirmed.', 'success');
    }).catch((error) => {
      console.error('Unable to confirm booking:', error);
      window.FNAdminComponents.showToast('Booking could not be confirmed: ' + (error.message || 'permission denied.'), 'error');
    });
  }));
};

window.FNOwnerPortal.init = function() {
  this.initHeaderActions();
  window.addEventListener('fn:bookings-changed', () => {
    if (window.FNAdminAuth.getRole() === 'Owner') this.render();
  });
};
