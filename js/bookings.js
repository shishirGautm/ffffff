window.FNAdminBookings = window.FNAdminBookings || {};

window.FNAdminBookings.getRows = function(searchTerm, statusFilter) {
  const bookings = window.FNAdmin.state.bookings;
  const filtered = bookings.filter((booking) => {
    const matchesQuery = !searchTerm || [booking.id, booking.user, booking.court].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || String(booking.bookingStatus).toLowerCase() === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return filtered.map((booking) => [
    booking.id,
    '<div class="table-user"><div class="table-avatar">' + (booking.user || 'U').split(' ').map((word) => word[0]).slice(0, 2).join('') + '</div><div><strong>' + booking.user + '</strong><small>' + booking.phone + '</small></div></div>',
    booking.court,
    booking.date + '<br><small>' + booking.startTime + ' - ' + booking.endTime + '</small>',
    'NPR ' + Number(booking.amount || 0).toLocaleString(),
    booking.paymentMethod,
    window.FNAdminComponents.getStatusBadge(booking.bookingStatus),
    '<div class="action-group"><button class="icon-button" data-booking-action="view" data-booking-id="' + booking.id + '" title="View"><i class="fa-solid fa-eye"></i></button>' +
    (booking.bookingStatus === 'Pending' ? '<button class="icon-button" data-booking-action="confirm" data-booking-id="' + booking.id + '" title="Confirm booking"><i class="fa-solid fa-check"></i></button>' : '') +
    (booking.bookingStatus !== 'Cancelled' && booking.paymentStatus !== 'Paid' ? '<button class="icon-button" data-booking-action="verify-payment" data-booking-id="' + booking.id + '" title="Verify payment"><i class="fa-solid fa-receipt"></i></button>' : '') +
    (booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Completed' ? '<button class="icon-button danger" data-booking-action="cancel" data-booking-id="' + booking.id + '" title="Cancel booking"><i class="fa-solid fa-xmark"></i></button>' : '') +
    '<button class="icon-button danger" data-booking-action="delete" data-booking-id="' + booking.id + '" title="Delete booking"><i class="fa-solid fa-trash"></i></button></div>'
  ]);
};

window.FNAdminBookings.render = function() {
  const headers = ['Booking ID', 'User', 'Court', 'Date', 'Amount', 'Payment', 'Status', 'Actions'];
  const searchTerm = document.getElementById('bookingSearch') ? document.getElementById('bookingSearch').value : '';
  const statusFilter = document.getElementById('bookingStatusFilter') ? document.getElementById('bookingStatusFilter').value : 'all';
  const rows = this.getRows(searchTerm, statusFilter);
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'bookingsTableContainer', emptyMessage: 'No bookings match the current filter.' });
  const target = document.getElementById('bookingsTableContainer');
  if (target) {
    target.querySelectorAll('[data-booking-action]').forEach((button) => button.addEventListener('click', () => this.handleAction(button.dataset.bookingAction, button.dataset.bookingId)));
  }
};

window.FNAdminBookings.handleAction = function(action, bookingId) {
  const booking = window.FNAdmin.state.bookings.find((item) => item.id === bookingId);
  if (!booking) return;

  if (action === 'delete') {
    if (!window.confirm('Delete booking "' + booking.id + '" permanently?')) return;
    const index = window.FNAdmin.state.bookings.findIndex((item) => item.id === booking.id);
    const payment = (window.FNAdmin.state.payments || []).find((item) => item.bookingId === booking.id);
    const removeBooking = window.FNAdminData.isLive() ? window.FNAdminData.remove('bookings', booking.id) : Promise.resolve();
    const removePayment = payment && window.FNAdminData.isLive() ? window.FNAdminData.remove('payments', payment.id || 'TX-' + booking.id) : Promise.resolve();
    const notifyUser = window.FNAdmin.createBookingNotification(booking, 'Booking deleted', booking.court + ' booking on ' + booking.date + ' was deleted by the administrator.');
    Promise.all([removeBooking, removePayment, notifyUser]).then(() => {
      if (index >= 0) window.FNAdmin.state.bookings.splice(index, 1);
      if (payment) window.FNAdmin.state.payments = window.FNAdmin.state.payments.filter((item) => item.id !== payment.id);
      this.render();
      window.FNAdminComponents.showToast('Booking deleted successfully.', 'success');
    }).catch((error) => {
      console.error('Unable to delete booking:', error);
      window.FNAdminComponents.showToast('Booking could not be deleted: ' + (error.message || 'permission denied.'), 'error');
    });
    return;
  }

  if (action === 'view') {
    window.FNAdminComponents.openModal('<div class="panel__header"><div><p class="eyebrow">Booking details</p><h3>' + booking.id + '</h3></div><button class="icon-button" data-close-modal="true"><i class="fa-solid fa-xmark"></i></button></div><div class="detail-list"><div><span>User</span><strong>' + booking.user + '</strong></div><div><span>Court</span><strong>' + booking.court + '</strong></div><div><span>Schedule</span><strong>' + booking.date + ' • ' + booking.startTime + ' - ' + booking.endTime + '</strong></div><div><span>Payment</span><strong>' + booking.paymentMethod + ' • ' + booking.paymentStatus + '</strong></div></div>');
    document.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', window.FNAdminComponents.closeModal));
    return;
  }

  if (action === 'confirm') {
    if (window.FNAdmin.hasBookingConflict(booking, booking.id)) {
      booking.bookingStatus = 'Rejected';
      window.FNAdminComponents.showToast('Booking rejected: already booked. Please choose another time.', 'error');
      window.FNAdmin.createBookingNotification(booking, 'Booking rejected', booking.court + ' could not confirm your booking because the time slot is no longer available.');
      window.FNAdmin.syncBookings(booking);
      this.render();
      return;
    }
    booking.bookingStatus = 'Confirmed';
    window.FNAdmin.createBookingNotification(booking, 'Booking confirmed', booking.court + ' confirmed your booking for ' + booking.date + ' at ' + booking.startTime + '.');
    window.FNAdminComponents.showToast('Booking confirmed.', 'success');
  } else if (action === 'verify-payment') {
    booking.paymentStatus = 'Paid';
    const payment = window.FNAdmin.state.payments.find((item) => item.bookingId === booking.id);
    if (payment) payment.status = 'Paid';
    window.FNAdminComponents.showToast(booking.paymentMethod + ' payment verified.', 'success');
  } else if (action === 'cancel') {
    booking.bookingStatus = 'Cancelled';
    window.FNAdmin.createBookingNotification(booking, 'Booking cancelled', booking.court + ' booking on ' + booking.date + ' was cancelled by the administrator.');
    window.FNAdminComponents.showToast('Booking cancelled.', 'success');
  }

  window.FNAdmin.syncBookings(booking);
  this.render();
};

window.FNAdminBookings.init = function() {
  const search = document.getElementById('bookingSearch');
  if (search) search.addEventListener('input', () => this.render());

  const statusFilter = document.getElementById('bookingStatusFilter');
  if (statusFilter) {
    const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Refunded'];
    statuses.forEach((status) => {
      const option = document.createElement('option');
      option.value = status.toLowerCase();
      option.textContent = status;
      statusFilter.appendChild(option);
    });
    statusFilter.addEventListener('change', () => this.render());
  }

  const addBtn = document.getElementById('addBookingBtn');
  if (addBtn) addBtn.addEventListener('click', function() {
    window.FNAdminComponents.showToast('Booking form ready for integration with Firebase.', 'success');
  });

  this.render();
};
