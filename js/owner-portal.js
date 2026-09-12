window.FNOwnerPortal = window.FNOwnerPortal || {};

window.FNOwnerPortal.getCourts = function() {
  const owner = window.FNAdminAuth.user;
  return owner ? window.FNAdmin.state.courts.filter((court) => court.owner === owner.name) : [];
};

window.FNOwnerPortal.render = function() {
  const panel = document.getElementById('ownerCourtPanel');
  const bookingsList = document.getElementById('ownerBookingsList');
  if (!panel || !bookingsList) return;

  const courts = this.getCourts();
  if (!courts.length) {
    panel.innerHTML = '<section class="user-panel"><div class="empty-state"><i class="fa-solid fa-futbol"></i><h3>No courts assigned</h3><p>Ask an administrator to assign a court to your owner account.</p></div></section>';
    bookingsList.innerHTML = '<p class="muted">No bookings available.</p>';
    return;
  }

  panel.innerHTML = courts.map((court) => '<article class="owner-court-card"><h3>' + court.name + '</h3><p>' + court.address + ', ' + court.city + '</p><form class="owner-court-form" data-court-id="' + court.id + '"><label>Price per hour<input name="pricePerHour" type="number" min="0" value="' + court.pricePerHour + '" required /></label><label>Availability<select name="status"><option value="active" ' + (court.status === 'active' ? 'selected' : '') + '>Available</option><option value="inactive" ' + (court.status === 'inactive' ? 'selected' : '') + '>Unavailable</option></select></label><label>Opening time<input name="openingTime" type="time" value="' + court.openingTime + '" required /></label><label>Closing time<input name="closingTime" type="time" value="' + court.closingTime + '" required /></label><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save court settings</button></form></article>').join('');

  const courtNames = courts.map((court) => court.name);
  const bookings = window.FNAdmin.state.bookings.filter((booking) => courtNames.includes(booking.court));
  bookingsList.innerHTML = bookings.length ? bookings.map((booking) => '<div class="owner-booking-row"><div><strong>' + booking.court + ' • ' + booking.user + '</strong><small>' + booking.date + ' • ' + booking.startTime + ' - ' + booking.endTime + ' • ' + booking.paymentMethod + ' (' + booking.paymentStatus + ')</small></div><div class="owner-booking-actions">' + window.FNAdminComponents.getStatusBadge(booking.bookingStatus) + (booking.bookingStatus === 'Pending' ? '<button type="button" data-owner-booking-action="confirm" data-booking-id="' + booking.id + '">Confirm</button>' : '') + '</div></div>').join('') : '<p class="muted">No bookings for your courts yet.</p>';

  panel.querySelectorAll('.owner-court-form').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const court = window.FNAdmin.state.courts.find((item) => item.id === form.dataset.courtId);
    if (!court) return;
    const data = new FormData(form);
    court.pricePerHour = Number(data.get('pricePerHour'));
    court.status = data.get('status');
    court.openingTime = data.get('openingTime');
    court.closingTime = data.get('closingTime');
    window.FNAdmin.syncCourt(court).then(() => window.FNAdminComponents.showToast('Court settings saved.', 'success')).catch(() => window.FNAdminComponents.showToast('Saved locally, but live sync failed.', 'error'));
    this.render();
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
