window.FNUserPortal = window.FNUserPortal || {};

window.FNUserPortal.getUserBookings = function() {
  const user = window.FNAdminAuth.user;
  if (!user) return [];
  return window.FNAdmin.state.bookings.filter((booking) => booking.userEmail === user.email || booking.user === user.name);
};

window.FNUserPortal.formatDate = function(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
      const startTime = document.getElementById('userBookingStart').value;
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

window.FNUserPortal.renderCourtDirectory = function() {
  const directory = document.getElementById('userCourtDirectory');
  const count = document.getElementById('userCourtDirectoryCount');
  if (!directory || !count) return;

  const courts = window.FNAdmin.state.courts;
  count.textContent = courts.length + ' venues';
  directory.innerHTML = courts.map((court) => {
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(court.address + ', ' + court.city + ', Nepal');
    const bookingAction = court.status === 'active' ? '<button class="btn btn-primary user-court-book" data-court-id="' + court.id + '" type="button">Book now</button>' : '<span class="court-status inactive">Currently unavailable</span>';
    return '<article class="user-court-card"><h4>' + court.name + '</h4><p>' + court.address + ', ' + court.city + '</p><div class="court-meta"><span class="court-price">NPR ' + Number(court.pricePerHour).toLocaleString() + '/hr</span><span class="court-status active">' + court.status + '</span></div><div class="court-actions">' + bookingAction + '<a class="court-map-link" href="' + mapUrl + '" target="_blank" rel="noopener"><i class="fa-solid fa-location-dot"></i> Map</a></div></article>';
  }).join('');

  directory.querySelectorAll('.user-court-book').forEach((button) => {
    button.addEventListener('click', () => {
      const courtSelect = document.getElementById('userBookingCourt');
      const bookingForm = document.getElementById('userBookingForm');
      courtSelect.value = button.getAttribute('data-court-id');
      this.updateAmount();
      bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

window.FNUserPortal.init = function() {
  const courtSelect = document.getElementById('userBookingCourt');
  const form = document.getElementById('userBookingForm');
  const courtSearch = document.getElementById('userCourtSearch');
  const dateInput = document.getElementById('userBookingDate');
  const startInput = document.getElementById('userBookingStart');
  if (!courtSelect || !form || !dateInput || !startInput) return;

  window.FNAdmin.state.courts.filter((court) => court.status === 'active').forEach((court) => {
    const option = document.createElement('option');
    option.value = court.id;
    option.textContent = court.name + ' - NPR ' + Number(court.pricePerHour).toLocaleString() + '/hour';
    courtSelect.appendChild(option);
  });

  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;
  dateInput.value = today;
  startInput.value = '18:00';
  courtSelect.addEventListener('change', () => this.updateAmount());
  dateInput.addEventListener('change', () => this.updateAmount());
  startInput.addEventListener('change', () => this.updateAmount());
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
    this.updateAmount();
  });
  this.updateAmount();
  this.renderCourtDirectory();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = window.FNAdminAuth.user;
    const court = window.FNAdmin.state.courts.find((item) => item.id === courtSelect.value);
    if (!user || !court) return;

    const date = dateInput.value;
    const startTime = startInput.value;
    const start = new Date(date + 'T' + startTime);
    const end = new Date(start.getTime() + 90 * 60000);
    const endTime = end.toTimeString().slice(0, 5);
    const newBooking = {
      id: 'BK-' + String(Date.now()).slice(-6),
      courtId: court.id,
      userId: user.uid || user.email,
      user: user.name,
      userEmail: user.email,
      phone: document.getElementById('userBookingPhone').value.trim(),
      court: court.name,
      date,
      startTime,
      endTime,
      duration: 90,
      amount: court.pricePerHour,
      paymentMethod: document.getElementById('userBookingPayment').value,
      paymentStatus: 'Pending',
      bookingStatus: 'Pending',
      createdAt: today
    };
    window.FNAdmin.createBooking(newBooking).then(() => {
      this.renderBookings();
      window.FNAdminComponents.showToast('Booking request submitted. The venue will confirm it shortly.', 'success');
    }).catch((error) => window.FNAdminComponents.showToast(error.message || 'Unable to create booking.', 'error'));
    form.reset();
    dateInput.min = today;
    dateInput.value = today;
    startInput.value = '18:00';
    courtSelect.value = court.id;
    this.updateAmount();
  });

  this.renderBookings();
};
