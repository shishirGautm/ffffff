window.FNOwnerPortal = window.FNOwnerPortal || {};

window.FNOwnerPortal.getCourts = function() {
  const owner = window.FNAdminAuth.user;
  return owner ? window.FNAdmin.state.courts.filter((court) => court.ownerId === owner.uid || court.owner === owner.name) : [];
};

window.FNOwnerPortal.renderNotifications = function() {
  const list = document.getElementById('ownerNotificationsList');
  if (!list) return;
  const notifications = (window.FNAdmin.state.notifications || []).filter((item) => ['All', 'Owners'].includes(item.target));
  list.innerHTML = notifications.length ? notifications.map((item) => '<article class="user-notification"><strong>' + item.title + '</strong><p>' + item.message + '</p><small>' + new Date(item.date).toLocaleString() + '</small></article>').join('') : '<p class="muted">No new notifications.</p>';
};

window.FNOwnerPortal.renderProfile = function(courts) {
  const identity = document.getElementById('ownerProfileIdentity');
  const details = document.getElementById('ownerProfileDetails');
  const owner = window.FNAdminAuth.user || {};
  if (!details) return;
  const ownerName = owner.name || 'Court owner';
  const initials = ownerName.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  if (identity) identity.innerHTML = '<div class="owner-profile-avatar">' + initials + '</div><div><strong>' + ownerName + '</strong><span>Venue account</span></div>';
  details.innerHTML = '<div><span>Email address</span><strong>' + (owner.email || 'Not available') + '</strong></div>' +
    '<div><span>Account type</span><strong>' + (owner.role || 'Owner') + '</strong></div>' +
    '<div><span>Assigned courts</span><strong>' + courts.length + '</strong></div>';
};

window.FNOwnerPortal.render = function() {
  const panel = document.getElementById('ownerCourtPanel');
  const bookingsList = document.getElementById('ownerBookingsList');
  if (!panel || !bookingsList) return;
  const ownerSection = document.getElementById('ownerSection');
  const ownerNotificationsPanel = ownerSection && ownerSection.querySelector('.user-notifications-panel');
  if (ownerSection && ownerNotificationsPanel && panel) ownerSection.insertBefore(ownerNotificationsPanel, panel);
  this.renderNotifications();

  const courts = this.getCourts();
  this.renderProfile(courts);
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

  const courtIds = courts.map((court) => court.id);
  const courtNames = courts.map((court) => court.name);
  const bookings = (window.FNAdmin.state.bookings || []).filter((booking) => courtIds.includes(booking.courtId) || courtNames.includes(booking.court));
  bookingsList.innerHTML = bookings.length ? bookings.map((booking) => '<div class="owner-booking-row"><div><strong>' + booking.court + ' • ' + booking.user + '</strong><small>' + booking.date + ' • ' + booking.startTime + ' - ' + booking.endTime + ' • ' + booking.paymentMethod + ' (' + booking.paymentStatus + ')</small></div><div class="owner-booking-actions">' + window.FNAdminComponents.getStatusBadge(booking.bookingStatus) + (booking.bookingStatus === 'Pending' ? '<button type="button" data-owner-booking-action="confirm" data-booking-id="' + booking.id + '">Confirm</button>' : '') + (booking.bookingStatus === 'Cancelled' ? '<button class="icon-button danger" type="button" data-owner-booking-action="delete" data-booking-id="' + booking.id + '" title="Delete cancelled reservation" aria-label="Delete cancelled reservation"><i class="fa-solid fa-trash"></i></button>' : (!['Rejected', 'Completed'].includes(booking.bookingStatus) ? '<button class="icon-button danger" type="button" data-owner-booking-action="cancel" data-booking-id="' + booking.id + '" title="Cancel reservation" aria-label="Cancel reservation"><i class="fa-solid fa-trash"></i></button>' : '')) + '</div></div>').join('') : '<p class="muted">No bookings for your courts yet.</p>';

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
  window.addEventListener('fn:bookings-changed', () => {
    if (window.FNAdminAuth.getRole() === 'Owner') this.render();
  });
};
