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

window.FNOwnerPortal.render = function() {
  const panel = document.getElementById('ownerCourtPanel');
  const bookingsList = document.getElementById('ownerBookingsList');
  if (!panel || !bookingsList) return;
  const ownerSection = document.getElementById('ownerSection');
  const ownerNotificationsPanel = ownerSection && ownerSection.querySelector('.user-notifications-panel');
  if (ownerSection && ownerNotificationsPanel && panel) ownerSection.insertBefore(ownerNotificationsPanel, panel);
  this.renderNotifications();

  const courts = this.getCourts();
  if (!courts.length) {
    panel.innerHTML = '<section class="user-panel"><div class="empty-state"><i class="fa-solid fa-futbol"></i><h3>No courts assigned</h3><p>Ask an administrator to assign a court to your owner account.</p></div></section>';
    bookingsList.innerHTML = '<p class="muted">No bookings available.</p>';
    return;
  }

  panel.innerHTML = courts.map((court) => '<article class="owner-court-card">' + ((court.images && court.images[0]) ? '<img class="court-card-image" src="' + court.images[0] + '" alt="' + court.name + '" />' : '') + '<h3>' + court.name + '</h3><p>' + court.address + ', ' + court.city + '</p><form class="owner-court-form" data-court-id="' + court.id + '"><label>Futsal name<input name="name" value="' + (court.name || '') + '" required /></label><label>Futsal photo<input name="photo" type="file" accept="image/*" /></label><label>Price per hour<input name="pricePerHour" type="number" min="0" value="' + court.pricePerHour + '" required /></label><label>Availability<select name="status"><option value="active" ' + (court.status === 'active' ? 'selected' : '') + '>Available</option><option value="inactive" ' + (court.status === 'inactive' ? 'selected' : '') + '>Unavailable</option></select></label><label>Opening time<input name="openingTime" type="time" value="' + (court.openingTime || '08:00') + '" required /></label><label>Closing time<input name="closingTime" type="time" value="' + (court.closingTime || '22:00') + '" required /></label><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save court settings</button></form></article>').join('');

  const courtIds = courts.map((court) => court.id);
  const courtNames = courts.map((court) => court.name);
  const bookings = (window.FNAdmin.state.bookings || []).filter((booking) => courtIds.includes(booking.courtId) || courtNames.includes(booking.court));
  bookingsList.innerHTML = bookings.length ? bookings.map((booking) => '<div class="owner-booking-row"><div><strong>' + booking.court + ' • ' + booking.user + '</strong><small>' + booking.date + ' • ' + booking.startTime + ' - ' + booking.endTime + ' • ' + booking.paymentMethod + ' (' + booking.paymentStatus + ')</small></div><div class="owner-booking-actions">' + window.FNAdminComponents.getStatusBadge(booking.bookingStatus) + (booking.bookingStatus === 'Pending' ? '<button type="button" data-owner-booking-action="confirm" data-booking-id="' + booking.id + '">Confirm</button>' : '') + '</div></div>').join('') : '<p class="muted">No bookings for your courts yet.</p>';

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
      pricePerHour: Number(data.get('pricePerHour')),
      status: data.get('status'),
      openingTime: data.get('openingTime'),
      closingTime: data.get('closingTime'),
      ownerId: court.ownerId || (owner && owner.uid)
    };
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }
    const upload = photo && photo.size
      ? window.FNAdminData.uploadAsset(photo, 'courts/' + court.id + '/' + Date.now() + '-' + photo.name)
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
    booking.bookingStatus = 'Confirmed';
    window.FNAdmin.syncBookings(booking);
    this.render();
    window.FNAdminComponents.showToast('Booking confirmed.', 'success');
  }));
};

window.FNOwnerPortal.init = function() {
  window.addEventListener('fn:bookings-changed', () => {
    if (window.FNAdminAuth.getRole() === 'Owner') this.render();
  });
};
