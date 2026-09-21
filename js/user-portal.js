window.FNUserPortal = window.FNUserPortal || {};

window.FNUserPortal.getUserBookings = function() {
  const user = window.FNAdminAuth.user;
  if (!user) return [];
  return (window.FNAdmin.state.bookings || []).filter((booking) => booking.userId === user.uid || (!booking.userId && booking.userEmail === user.email) || (window.FNAdmin.demoMode && !booking.userId && booking.user === user.name));
};

window.FNUserPortal.deleteNotification = function(notificationId) {
  if (!notificationId) return Promise.resolve(false);
  const index = (window.FNAdmin.state.notifications || []).findIndex((item) => item.id === notificationId);
  if (index < 0) return Promise.resolve(false);
  if (!window.confirm('Delete this notification permanently?')) return Promise.resolve(false);
  const remove = window.FNAdminData.isLive() ? window.FNAdminData.remove('notifications', notificationId) : Promise.resolve();
  return remove.then(() => {
    window.FNAdmin.state.notifications.splice(index, 1);
    this.renderNotifications();
    window.FNAdminComponents.showToast('Notification deleted.', 'success');
    return true;
  }).catch((error) => {
    window.FNAdminComponents.showToast('Notification could not be deleted: ' + (error.message || 'permission denied.'), 'error');
    return false;
  });
};

window.FNUserPortal.renderNotifications = function() {
  const list = document.getElementById('userNotificationsList');
  if (!list) return;
  const user = window.FNAdminAuth.user;
  const expiryLimit = Date.now() - (3 * 24 * 60 * 60 * 1000);
  const notifications = (window.FNAdmin.state.notifications || []).filter((item) => {
    const target = String(item.target || '').toLowerCase();
    const belongsToUser = user && (item.userId === user.uid || item.targetUserId === user.uid || item.targetUserEmail === user.email);
    const userUpdate = item.type === 'booking' || item.type === 'tournament';
    return new Date(item.date || 0).getTime() >= expiryLimit && userUpdate && belongsToUser;
  });
  list.innerHTML = notifications.length ? notifications.map((item) => {
    const canDelete = user && (item.userId === user.uid || item.targetUserId === user.uid || item.targetUserEmail === user.email);
    return '<article class="user-notification"><div class="notification-item-heading"><strong>' + item.title + '</strong>' + (canDelete ? '<button class="notification-delete-button" type="button" data-user-notification-delete="' + item.id + '" title="Delete notification" aria-label="Delete notification"><i class="fa-solid fa-trash"></i></button>' : '') + '</div><p>' + item.message + '</p><small>' + new Date(item.date).toLocaleString() + '</small></article>';
  }).join('') : '<p class="muted">No new notifications.</p>';
  list.querySelectorAll('[data-user-notification-delete]').forEach((button) => button.addEventListener('click', () => this.deleteNotification(button.dataset.userNotificationDelete)));
  window.FNAdmin.cleanupExpiredNotifications().catch((error) => console.error('Unable to remove expired notifications:', error));
};

window.FNUserPortal.readImageFile = function(file) {
  if (!file) return Promise.resolve('');
  if (!['image/jpeg', 'image/png'].includes(file.type)) return Promise.reject(new Error('Please choose a JPG or PNG image.'));
  if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('Profile image must be 5 MB or smaller.'));
  if (window.FNAdminData.isLive()) return window.FNAdminData.uploadAsset(file, 'profiles/' + Date.now() + '-' + file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
};

window.FNUserPortal.renderProfile = function() {
  const identity = document.getElementById('userProfileIdentity');
  const details = document.getElementById('userProfileDetails');
  const heroProfile = document.getElementById('userHeroProfile');
  const user = window.FNAdminAuth.user || {};
  if (!identity && !details && !heroProfile) return;
  const profile = (window.FNAdmin.state.users || []).find((item) => item.id === user.uid || item.email === user.email) || user;
  const fallbackName = user.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ') : 'player';
  const name = profile.name && profile.name !== profile.email ? profile.name : (user.name && user.name !== user.email ? user.name : fallbackName);
  const initials = name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  const today = new Date().toISOString().slice(0, 10);
  const upcomingBookings = this.getUserBookings().filter((booking) => booking.date >= today && !['Cancelled', 'Rejected'].includes(booking.bookingStatus)).length;
  const imageUrl = profile.photoURL || profile.photoUrl || (typeof profile.avatar === 'string' && profile.avatar.startsWith('http') ? profile.avatar : '');
  const identityImage = imageUrl ? '<img class="user-profile-image" src="' + imageUrl + '" alt="' + name + ' profile" />' : '<div class="owner-profile-avatar">' + initials + '</div>';
  if (identity) identity.innerHTML = identityImage + '<div><strong>' + name + '</strong><span>Player account</span></div>';
  if (details) details.innerHTML = '<div><span>Name</span><strong>' + name + '</strong></div><div><span>Age</span><strong>' + (profile.age || 'Not added') + '</strong></div><div><span>Contact</span><strong>' + (profile.phone || profile.contactNumber || 'Not added') + '</strong></div><div><span>Email address</span><strong>' + (profile.email || user.email || 'Not available') + '</strong></div><div><span>Account type</span><strong>' + (user.role || profile.role || 'User') + '</strong></div><div><span>Upcoming bookings</span><strong>' + upcomingBookings + '</strong></div>';
  const heroName = document.getElementById('userHeroName');
  if (heroName) heroName.textContent = name;
  if (heroProfile) heroProfile.innerHTML = identityImage + '<div class="portal-hero__profile-details"><strong>' + name + '</strong><div class="portal-hero__profile-detail-list"><span><b>Email</b>' + (profile.email || user.email || 'Not available') + '</span><span><b>Age</b>' + (profile.age || 'Not added') + '</span><span><b>Contact</b>' + (profile.phone || profile.contactNumber || 'Not added') + '</span><span><b>Location</b>' + (profile.location || 'Not added') + '</span><span><b>Account type</b>' + (user.role || profile.role || 'User') + '</span><span><b>Bookings</b>' + upcomingBookings + ' upcoming</span></div></div>';
  const profileForm = document.getElementById('userProfileForm');
  if (profileForm && (profileForm.dataset.profilePopulated !== 'true' || profileForm.classList.contains('hidden'))) {
    profileForm.elements.name.value = name;
    profileForm.elements.age.value = profile.age || '';
    profileForm.elements.phone.value = profile.phone || profile.contactNumber || '';
    profileForm.elements.location.value = profile.location || '';
    profileForm.dataset.profilePopulated = 'true';
  }
};

window.FNUserPortal.updateDashboard = function() {
  const userName = document.getElementById('userDisplayName');
  const greeting = document.getElementById('userGreetingText');
  const venueCount = document.getElementById('userVenueCount');
  const teamCount = document.getElementById('userTeamCount');
  const user = window.FNAdminAuth.user;
  this.renderProfile();
  if (greeting) greeting.textContent = window.FNAdminComponents.getTimeGreeting();
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

  const selectedCourt = (window.FNAdmin.state.courts || []).find((court) => court.id === courtSelect.value);
  const openingMinutes = this.toMinutes(selectedCourt?.openingTime || '06:00');
  const closingMinutes = this.toMinutes(selectedCourt?.closingTime || '22:00');
  const slotDuration = Number(selectedCourt?.slotDuration || 60);
  const date = document.getElementById('userBookingDate') ? document.getElementById('userBookingDate').value : '';
  const blockedSlots = selectedCourt && Array.isArray(selectedCourt.blockedSlots) ? selectedCourt.blockedSlots : [];
  timeSelect.innerHTML = '';
  for (let start = openingMinutes; start + slotDuration <= closingMinutes; start += slotDuration) {
    const end = start + slotDuration;
    const startTime = this.toTime(start);
    const endTime = this.toTime(end);
    const option = document.createElement('option');
    const slotKey = date + ' | ' + startTime + ' - ' + endTime;
    const matchingBooking = (window.FNAdmin.state.bookings || []).find((item) => window.FNAdmin.isBookingActive(item)
      && item.date === date
      && ((item.courtId && item.courtId === (selectedCourt && selectedCourt.id)) || item.court === (selectedCourt && selectedCourt.name))
      && this.toMinutes(startTime) < this.toMinutes(item.endTime)
      && this.toMinutes(item.startTime) < this.toMinutes(endTime));
    const booked = !!matchingBooking;
    const blocked = blockedSlots.includes(slotKey);
    option.value = startTime + '|' + endTime;
    const bookingStatus = matchingBooking ? String(matchingBooking.bookingStatus || '') : '';
    const slotLabel = blocked ? 'Unavailable' : bookingStatus || 'Available';
    option.textContent = this.toTimeLabel(startTime) + ' - ' + this.toTimeLabel(endTime) + ' - ' + slotLabel;
    option.dataset.availability = blocked ? 'unavailable' : bookingStatus.toLowerCase() || 'available';
    option.disabled = booked || blocked;
    timeSelect.appendChild(option);
  }
  const firstAvailable = Array.from(timeSelect.options).find((option) => !option.disabled);
  if (firstAvailable) timeSelect.value = firstAvailable.value;
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

window.FNUserPortal.getCourtReviews = function(courtName) {
  const currentUserId = window.FNAdminAuth.user?.uid || '';
  return (window.FNAdmin.state.reviews || []).filter((review) => review.court === courtName && (review.status === 'Approved' || (review.status === 'Pending' && currentUserId && review.userId === currentUserId)));
};

window.FNUserPortal.escapeHtml = function(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
};

window.FNUserPortal.openCourtReviews = function(court) {
  const reviews = this.getCourtReviews(court.name);
  const content = reviews.length
    ? reviews.map((review) => '<article class="court-review-item"><div class="court-review-heading"><strong>' + this.escapeHtml(review.user) + '</strong><span>' + Number(review.rating || 0) + '/5 <i class="fa-solid fa-star"></i></span></div><p>' + this.escapeHtml(review.review) + '</p><small>' + this.escapeHtml(this.formatDate(review.date)) + (review.status === 'Pending' ? ' · Awaiting approval' : '') + '</small></article>').join('')
    : '<div class="empty-state"><i class="fa-regular fa-star"></i><h3>No reviews yet</h3><p>Reviews will appear after players complete a booking.</p></div>';
  window.FNAdminComponents.openModal('<div class="panel__header"><div><p class="eyebrow text-green">Player feedback</p><h3>' + this.escapeHtml(court.name) + '</h3></div><button class="icon-button" data-close-modal="true" aria-label="Close reviews"><i class="fa-solid fa-xmark"></i></button></div><div class="court-review-list">' + content + '</div>');
  document.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', window.FNAdminComponents.closeModal));
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
      const conflict = court && window.FNAdmin.hasBookingConflict({ courtId: court.id, court: court.name, date, startTime, endTime: timeSlot[1] });
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
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((booking) => booking.date >= today && ['Pending', 'Confirmed'].includes(booking.bookingStatus));
  const groupedBookings = [
    { label: 'Upcoming', items: upcoming },
    { label: 'Completed', items: bookings.filter((booking) => booking.bookingStatus === 'Completed' || (booking.date < today && !['Cancelled', 'Rejected'].includes(booking.bookingStatus))) },
    { label: 'Cancelled', items: bookings.filter((booking) => booking.bookingStatus === 'Cancelled') },
    { label: 'Rejected', items: bookings.filter((booking) => booking.bookingStatus === 'Rejected') }
  ];
  this.updateDashboard();
  count.textContent = upcoming.length + ' upcoming booking' + (upcoming.length === 1 ? '' : 's');
  next.textContent = upcoming[0] ? upcoming[0].court + ' • ' + this.formatDate(upcoming[0].date) + ' at ' + upcoming[0].startTime : 'Book a court to see your next match here.';

  const renderBooking = (booking) => {
    const existingReview = (window.FNAdmin.state.reviews || []).find((review) => review.bookingId === booking.id || (review.user === booking.user && review.court === booking.court));
    const canReview = ['Confirmed', 'Completed'].includes(booking.bookingStatus) || booking.paymentStatus === 'Paid';
    const bookingStart = new Date(booking.date + 'T' + booking.startTime);
    const canCancel = ['Pending', 'Confirmed'].includes(booking.bookingStatus) && Number.isFinite(bookingStart.getTime()) && bookingStart.getTime() - Date.now() > 60 * 60 * 1000;
    const rescheduleAction = canCancel ? '<button class="booking-reschedule" type="button" data-reschedule-booking-id="' + booking.id + '">Change time</button>' : '';
    const reviewAction = canReview && !existingReview
      ? '<button class="booking-review" type="button" data-review-booking-id="' + booking.id + '">Rate & review</button>'
      : (existingReview ? '<span class="review-status">Reviewed</span>' : '');
    return '<div class="user-booking-item"><div><strong>' + this.escapeHtml(booking.court) + '</strong><small>' + this.formatDate(booking.date) + ' • ' + this.toTimeLabel(booking.startTime) + ' - ' + this.toTimeLabel(booking.endTime) + '</small><small>Booking ID: ' + this.escapeHtml(booking.id) + ' • ' + booking.bookingStatus + ' • Payment: ' + this.escapeHtml(booking.paymentStatus) + '</small></div><div><span class="booking-price">NPR ' + Number(booking.amount || 0).toLocaleString() + '</span>' + rescheduleAction + (canCancel ? '<button class="booking-cancel" type="button" data-booking-id="' + booking.id + '">Cancel</button>' : '') + reviewAction + '</div></div>';
  };
  list.innerHTML = bookings.length ? groupedBookings.filter((group) => group.items.length).map((group) => '<section class="booking-history-group"><h4>' + group.label + '</h4>' + group.items.map(renderBooking).join('') + '</section>').join('') : '<p class="muted">You have no bookings yet.</p>';

  list.querySelectorAll('[data-booking-id]').forEach((button) => button.addEventListener('click', () => {
    const booking = window.FNAdmin.state.bookings.find((item) => item.id === button.dataset.bookingId);
    if (!booking) return;
    const bookingStart = new Date(booking.date + 'T' + booking.startTime);
    if (!['Pending', 'Confirmed'].includes(booking.bookingStatus) || !Number.isFinite(bookingStart.getTime()) || bookingStart.getTime() - Date.now() <= 60 * 60 * 1000) {
      this.renderBookings();
      return;
    }
    const proceed = window.confirm('Cancel booking for ' + booking.court + ' on ' + booking.date + '?');
    if (!proceed) return;
    window.FNAdmin.setBookingStatus(booking, 'Cancelled');
    window.FNAdmin.createBookingNotification(booking, 'Booking cancelled', 'Your booking at ' + booking.court + ' on ' + booking.date + ' has been cancelled.');
    window.FNAdmin.syncBookings(booking)
      .then(() => {
        window.FNAdminComponents.showToast('Booking cancelled.', 'success');
        this.renderBookings();
      })
      .catch(() => window.FNAdminComponents.showToast('Unable to sync the cancellation.', 'error'));
  }));

  list.querySelectorAll('[data-review-booking-id]').forEach((button) => button.addEventListener('click', () => {
    const booking = window.FNAdmin.state.bookings.find((item) => item.id === button.dataset.reviewBookingId);
    if (!booking) return;
    window.FNAdminReviews.openReviewModal(booking);
  }));
  list.querySelectorAll('[data-reschedule-booking-id]').forEach((button) => button.addEventListener('click', () => {
    const booking = window.FNAdmin.state.bookings.find((item) => item.id === button.dataset.rescheduleBookingId);
    const bookingPanel = document.getElementById('userBookingPanel');
    const courtSelect = document.getElementById('userBookingCourt');
    const dateInput = document.getElementById('userBookingDate');
    const bookingForm = document.getElementById('userBookingForm');
    if (!booking || !bookingPanel || !courtSelect || !dateInput || !bookingForm) return;
    bookingPanel.classList.remove('hidden');
    courtSelect.value = booking.courtId;
    dateInput.value = booking.date;
    this.updateTimeSlots();
    const timeSelect = document.getElementById('userBookingTime');
    timeSelect.value = booking.startTime + '|' + booking.endTime;
    bookingForm.dataset.rescheduleBookingId = booking.id;
    bookingPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
};

window.FNUserPortal.getTournamentCourt = function(tournament) {
  const courts = window.FNAdmin.state.courts || [];
  return courts.find((court) => String(court.id) === String(tournament.courtId)) || null;
};

window.FNUserPortal.renderTournaments = function() {
  const list = document.getElementById('userTournamentsList');
  if (!list) return;

  const user = window.FNAdminAuth.user || {};
  const userId = user.uid || (user.email ? 'email:' + user.email : 'guest');
  const tournaments = (window.FNAdmin.state.tournaments || []).filter((tournament) => tournament.courtId && (!tournament.status || tournament.status !== 'Draft'));

  if (!tournaments.length) {
    list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-trophy"></i><h3>No tournaments</h3><p>There are no active tournaments available right now.</p></div>';
    return;
  }

  list.innerHTML = tournaments.map((tournament) => {
    const selectedCourt = this.getTournamentCourt(tournament);
    const courtName = selectedCourt ? selectedCourt.name : (tournament.courtName || 'Selected ground unavailable');
    const courtLocation = selectedCourt
      ? [selectedCourt.address, selectedCourt.city, selectedCourt.district, selectedCourt.province].filter(Boolean).join(', ')
      : (tournament.location || 'Location unavailable');
    const participants = (Array.isArray(tournament.participants) ? tournament.participants : []).filter((participant) => !['Cancelled', 'Rejected'].includes(participant.registrationStatus));
    const joinedParticipant = participants.find((participant) => (participant.userId && participant.userId === userId) || (participant.email && participant.email === user.email));
    const isJoined = !!joinedParticipant;
    const remainingSlots = Math.max((Number(tournament.maxTeams || 0) || 0) - participants.length, 0);
    const joinLabel = isJoined ? ((joinedParticipant.registrationStatus || 'Confirmed') === 'Confirmed' ? 'Confirmed' : 'Pending approval') : remainingSlots > 0 ? 'Join tournament' : 'Waitlist full';
    const joinDisabled = isJoined || remainingSlots <= 0 ? 'disabled' : '';
    return '<article class="user-tournament-card">' +
      '<div class="user-tournament-header">' +
      '<div><p class="eyebrow text-green">Tournament</p><h4>' + this.escapeHtml(tournament.name || 'Untitled tournament') + '</h4></div>' +
      '<span class="status-badge ' + String(tournament.status || 'Open').toLowerCase() + '">' + (tournament.status || 'Open') + '</span>' +
      '</div>' +
      '<p class="user-tournament-description">' + this.escapeHtml(tournament.description || 'A competitive futsal tournament for local players and community teams.') + '</p>' +
      '<div class="user-tournament-meta"><span><i class="fa-solid fa-futbol"></i> ' + this.escapeHtml(courtName) + '</span><span><i class="fa-solid fa-location-dot"></i> ' + this.escapeHtml(courtLocation) + '</span><span><i class="fa-regular fa-calendar"></i> ' + this.escapeHtml(tournament.startDate || 'TBA') + ' - ' + this.escapeHtml(tournament.endDate || 'TBA') + '</span></div>' +
      '<div class="user-tournament-stats"><div><small>Fee</small><strong>NPR ' + Number(tournament.fee || 0).toLocaleString() + '</strong></div><div><small>Prize</small><strong>NPR ' + Number(tournament.prize || 0).toLocaleString() + '</strong></div><div><small>Slots</small><strong>' + remainingSlots + ' left</strong></div></div>' +
      '<div class="user-tournament-footer"><small>' + participants.length + ' players joined</small><button class="btn btn-primary user-tournament-join" type="button" data-tournament-id="' + tournament.id + '" ' + joinDisabled + '>' + joinLabel + '</button></div>' +
      '</article>';
  }).join('');

  list.querySelectorAll('.user-tournament-join').forEach((button) => {
    button.addEventListener('click', () => {
      const tournament = (window.FNAdmin.state.tournaments || []).find((item) => item.id === button.dataset.tournamentId);
      if (!tournament) return;
      this.joinTournament(tournament);
    });
  });
};

window.FNUserPortal.renderMyTournaments = function() {
  const list = document.getElementById('userMyTournamentsList');
  if (!list) return;

  const user = window.FNAdminAuth.user || {};
  const userId = user.uid || (user.email ? 'email:' + user.email : 'guest');
  const joinedTournaments = (window.FNAdmin.state.tournaments || []).filter((tournament) => {
    if (!tournament.courtId) return false;
    const participants = Array.isArray(tournament.participants) ? tournament.participants : [];
    return participants.some((participant) => ['Confirmed', 'Pending', undefined].includes(participant.registrationStatus) && ((participant.userId && participant.userId === userId) || (participant.email && participant.email === user.email)));
  });

  if (!joinedTournaments.length) {
    list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-list-check"></i><h3>No joined tournaments</h3><p>You have not registered for any tournament yet.</p></div>';
    return;
  }

  list.innerHTML = joinedTournaments.map((tournament) => {
    const selectedCourt = this.getTournamentCourt(tournament);
    const courtName = selectedCourt ? selectedCourt.name : (tournament.courtName || 'Selected ground unavailable');
    const courtLocation = selectedCourt
      ? [selectedCourt.address, selectedCourt.city, selectedCourt.district, selectedCourt.province].filter(Boolean).join(', ')
      : (tournament.location || 'Location unavailable');
    const participants = (Array.isArray(tournament.participants) ? tournament.participants : []).filter((participant) => !['Cancelled', 'Rejected'].includes(participant.registrationStatus));
    const currentParticipant = participants.find((participant) => (participant.userId && participant.userId === userId) || (participant.email && participant.email === user.email)) || {};
    const registrationStatus = currentParticipant.registrationStatus || 'Confirmed';
    const participantCount = participants.length;
    return '<article class="user-my-tournament-card">' +
      '<div class="user-my-tournament-header"><div><p class="eyebrow text-green">' + this.escapeHtml(registrationStatus) + '</p><h4>' + this.escapeHtml(tournament.name || 'Untitled tournament') + '</h4></div><span class="status-badge ' + String(tournament.status || 'Open').toLowerCase() + '">' + (tournament.status || 'Open') + '</span></div>' +
      '<div class="user-my-tournament-info"><span><i class="fa-solid fa-futbol"></i> ' + this.escapeHtml(courtName) + '</span><span><i class="fa-solid fa-location-dot"></i> ' + this.escapeHtml(courtLocation) + '</span><span><i class="fa-regular fa-calendar"></i> ' + this.escapeHtml(tournament.startDate || 'TBA') + ' - ' + this.escapeHtml(tournament.endDate || 'TBA') + '</span></div>' +
      '<div class="user-my-tournament-stats"><div><small>Entry</small><strong>NPR ' + Number(tournament.fee || 0).toLocaleString() + '</strong></div><div><small>Prize</small><strong>NPR ' + Number(tournament.prize || 0).toLocaleString() + '</strong></div><div><small>Players</small><strong>' + participantCount + '</strong></div></div>' +
      '<p class="user-my-tournament-description">' + this.escapeHtml(tournament.description || 'You are registered for this tournament.') + '</p>' +
      (registrationStatus === 'Pending' ? '<div class="user-my-tournament-actions"><button class="btn btn-secondary user-tournament-cancel" type="button" data-tournament-id="' + tournament.id + '"><i class="fa-solid fa-xmark"></i> Cancel registration</button></div>' : '') +
      '</article>';
  }).join('');

  list.querySelectorAll('.user-tournament-cancel').forEach((button) => {
    button.addEventListener('click', () => {
      const tournament = (window.FNAdmin.state.tournaments || []).find((item) => item.id === button.dataset.tournamentId);
      if (tournament) this.cancelTournament(tournament);
    });
  });
};

window.FNUserPortal.cancelTournament = function(tournament) {
  const user = window.FNAdminAuth.user || {};
  const userId = user.uid || (user.email ? 'email:' + user.email : 'guest');
  const participants = (Array.isArray(tournament.participants) ? tournament.participants : []).filter((participant) => !['Cancelled', 'Rejected'].includes(participant.registrationStatus));
  const participantIndex = participants.findIndex((participant) => (participant.userId && participant.userId === userId) || (participant.email && participant.email === user.email));
  if (participantIndex < 0) return;
  if (!window.confirm('Cancel your registration for "' + (tournament.name || 'this tournament') + '"?')) return;

  const updatedTournament = {
    ...tournament,
    participants: participants.filter((_, index) => index !== participantIndex)
  };
  const savePromise = window.FNAdminData.isLive() ? window.FNAdminData.save('tournaments', tournament.id, updatedTournament) : Promise.resolve(updatedTournament);
  savePromise.then(() => {
    const index = (window.FNAdmin.state.tournaments || []).findIndex((item) => item.id === tournament.id);
    if (index >= 0) window.FNAdmin.state.tournaments[index] = updatedTournament;
    this.renderTournaments();
    this.renderMyTournaments();
    window.FNAdminComponents.showToast('Tournament registration cancelled.', 'success');
  }).catch((error) => {
    console.error('Unable to cancel tournament registration:', error);
    window.FNAdminComponents.showToast('Unable to cancel this registration right now.', 'error');
  });
};

window.FNUserPortal.joinTournament = function(tournament) {
  const user = window.FNAdminAuth.user || {};
  if (!user.email) {
    window.FNAdminComponents.showToast('Please sign in to participate in a tournament.', 'error');
    return;
  }

  const participants = Array.isArray(tournament.participants) ? tournament.participants : [];
  const userId = user.uid || ('email:' + user.email);
  const alreadyJoined = participants.some((participant) => ((participant.userId && participant.userId === userId) || (participant.email && participant.email === user.email)));
  if (alreadyJoined) {
    window.FNAdminComponents.showToast('You are already registered for this tournament.', 'success');
    return;
  }

  const remainingSlots = Math.max((Number(tournament.maxTeams || 0) || 0) - participants.length, 0);
  if (remainingSlots <= 0) {
    window.FNAdminComponents.showToast('This tournament is already full.', 'error');
    return;
  }

  const formHtml = '<div class="panel__header"><div><p class="eyebrow text-green">Tournament registration</p><h3>Join ' + this.escapeHtml(tournament.name || 'Tournament') + '</h3></div><button class="icon-button" type="button" data-close-modal="true" aria-label="Close registration"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<form id="tournamentJoinForm"><p class="muted">Enter your team information to register for this tournament.</p><div class="field-grid">' +
    '<label>Team name<input name="teamName" type="text" required placeholder="e.g. Brothers FC" /></label>' +
    '<label>Captain name<input name="captainName" type="text" required value="' + this.escapeHtml(user.name || user.email.split('@')[0]) + '" /></label>' +
    '<label>Contact number<input name="contactNumber" type="tel" required placeholder="+977-98XXXXXXXX" /></label>' +
    '<label>Squad size<input name="squadSize" type="number" min="1" max="30" required value="5" /></label>' +
    '<label style="grid-column: 1 / -1;">Team notes<textarea name="teamNotes" placeholder="Add jersey color, player names, or other details..."></textarea></label>' +
    '</div><div class="form-actions"><button type="button" class="btn btn-secondary" data-close-modal="true">Cancel</button><button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Confirm registration</button></div></form>';

  window.FNAdminComponents.openModal(formHtml);
  document.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', window.FNAdminComponents.closeModal));
  const joinForm = document.getElementById('tournamentJoinForm');
  if (!joinForm) return;

  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(joinForm);
    const teamName = String(formData.get('teamName') || '').trim();
    const captainName = String(formData.get('captainName') || '').trim();
    const contactNumber = String(formData.get('contactNumber') || '').trim();
    const squadSize = Number(formData.get('squadSize') || 0);
    if (!teamName || !captainName || !contactNumber || squadSize < 1) {
      window.FNAdminComponents.showToast('Please complete your team information.', 'error');
      return;
    }

    const updatedTournament = {
      ...tournament,
      participants: [
        ...participants.filter((participant) => !((participant.userId && participant.userId === userId) || (participant.email && participant.email === user.email))),
        {
          userId,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          teamName,
          captainName,
          contactNumber,
          squadSize,
          teamNotes: String(formData.get('teamNotes') || '').trim(),
          registrationStatus: 'Pending',
          joinedAt: new Date().toISOString()
        }
      ]
    };

    const savePromise = window.FNAdminData.isLive() ? window.FNAdminData.save('tournaments', tournament.id, updatedTournament) : Promise.resolve(updatedTournament);

    savePromise.then(() => {
      const index = (window.FNAdmin.state.tournaments || []).findIndex((item) => item.id === tournament.id);
      if (index >= 0) window.FNAdmin.state.tournaments[index] = updatedTournament;
      window.FNAdminComponents.closeModal();
      this.renderTournaments();
      this.renderMyTournaments();
      window.FNAdminComponents.showToast('You joined the tournament successfully.', 'success');
    }).catch((error) => {
      console.error('Unable to join tournament:', error);
      window.FNAdminComponents.showToast('Unable to join this tournament right now.', 'error');
    });
  });
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
    const reviews = this.getCourtReviews(court.name);
    const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : Number(court.rating || 0);
    const ratingDisplay = averageRating ? '<span class="court-rating"><i class="fa-solid fa-star"></i> ' + averageRating.toFixed(1) + '</span><span class="court-review-count">' + reviews.length + ' review' + (reviews.length === 1 ? '' : 's') + '</span>' : '<span class="court-review-count">No reviews yet</span>';
    const bookingAction = court.status === 'active' ? '<button class="btn btn-primary user-court-book" data-court-id="' + court.id + '" type="button">Book now</button>' : '<span class="court-status inactive">Currently unavailable</span>';
    const amenities = [['parking', 'Parking'], ['washroom', 'Washroom'], ['changingRoom', 'Changing room'], ['shower', 'Shower'], ['lighting', 'Lights']].filter(([key]) => court[key]).map(([, label]) => '<span>' + label + '</span>').join('');
    const contact = court.contactNumber ? '<a href="tel:' + court.contactNumber + '"><i class="fa-solid fa-phone"></i> ' + court.contactNumber + '</a>' : '<span>Contact not available</span>';
    return '<article class="user-court-card"><img class="court-card-image" src="' + imageUrl + '" alt="' + court.name + '" /><div class="court-card-title"><h4>' + court.name + '</h4><div class="court-rating-summary">' + ratingDisplay + '</div></div><p class="user-court-address"><i class="fa-solid fa-location-dot"></i> ' + location + '</p><div class="court-meta"><span class="court-price">NPR ' + Number(court.pricePerHour || 0).toLocaleString() + '/hr</span><span>' + (court.openingTime || '08:00') + ' - ' + (court.closingTime || '22:00') + '</span></div><div class="user-court-specs"><span><strong>Type</strong>' + (court.type || 'Indoor') + '</span><span><strong>Turf</strong>' + (court.turfType || 'Artificial') + '</span></div><div class="user-court-map"><div class="user-court-map-heading"><strong>' + court.name + '</strong><span>Live location</span></div><iframe src="' + mapEmbedUrl + '" title="Live map for ' + court.name + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div><div class="user-court-contact">' + contact + '</div>' + (amenities ? '<div class="user-court-amenities">' + amenities + '</div>' : '') + (court.description ? '<p class="user-court-description">' + court.description + '</p>' : '') + '<div class="court-actions">' + bookingAction + '<button class="court-reviews-link" type="button" data-court-reviews="' + court.id + '"><i class="fa-regular fa-star"></i> View reviews</button><a class="court-map-link" href="' + mapUrl + '" target="_blank" rel="noopener"><i class="fa-solid fa-map-location-dot"></i> Open ' + court.name + ' map</a></div></article>';
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
  directory.querySelectorAll('[data-court-reviews]').forEach((button) => {
    button.addEventListener('click', () => {
      const court = window.FNAdmin.state.courts.find((item) => item.id === button.dataset.courtReviews);
      if (court) this.openCourtReviews(court);
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
  const backToTopButton = document.getElementById('userBackToTop');
  if (backToTopButton && backToTopButton.dataset.fnInitialized !== 'true') {
    const updateBackToTopVisibility = () => backToTopButton.classList.toggle('is-visible', window.scrollY > 360);
    backToTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    updateBackToTopVisibility();
    backToTopButton.dataset.fnInitialized = 'true';
  }
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
  const userHero = userMain && userMain.querySelector('.portal-hero');
  if (userMain && userNotificationsPanel && userHero) userMain.insertBefore(userNotificationsPanel, userHero.nextSibling);

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
      const photoFile = data.get('photoFile');
      const existingProfile = (window.FNAdmin.state.users || []).find((item) => item.id === user.uid || item.email === user.email) || user;
      const profileImageUrl = existingProfile.photoURL || existingProfile.photoUrl || '';
      this.readImageFile(photoFile && photoFile.size ? photoFile : null).then((uploadedImage) => {
        const profile = { id: user.uid, name: data.get('name').trim(), email: user.email || '', role: user.role || 'User', age: data.get('age') ? Number(data.get('age')) : '', phone: data.get('phone').trim(), location: data.get('location').trim(), photoURL: uploadedImage || profileImageUrl, updatedAt: new Date().toISOString() };
        const save = window.FNAdminData.isLive()
          ? window.FNAdminData.save('users', user.uid, profile)
          : Promise.resolve((window.FNAdmin.state.users = [...(window.FNAdmin.state.users || []).filter((item) => item.id !== user.uid), profile]));
        return save.then(() => profile);
      }).then((profile) => {
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
  document.querySelectorAll('[data-user-action="close-nav"]').forEach((button) => {
    if (button.dataset.fnInitialized === 'true') return;
    button.addEventListener('click', () => {
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
    this.renderTournaments();
    this.renderMyTournaments();
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
  dateInput.addEventListener('change', () => {
    this.updateTimeSlots();
    this.updateAmount();
  });
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
  this.renderTournaments();
  this.renderMyTournaments();
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
    const firebaseUser = !window.FNAdmin.demoMode && window.firebase && firebase.apps && firebase.apps.length && firebase.auth ? firebase.auth().currentUser : null;
    const userId = (firebaseUser && firebaseUser.uid) || user.uid;
    if (!userId) {
      window.FNAdminComponents.showToast('Your Firebase login session has expired. Please log in again.', 'error');
      return;
    }
    const rescheduleId = form.dataset.rescheduleBookingId;
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
      duration: this.toMinutes(endTime) - this.toMinutes(startTime),
      amount: Math.round(Number(court.pricePerHour || 0) * (this.toMinutes(endTime) - this.toMinutes(startTime)) / 60),
      paymentMethod: document.getElementById('userBookingPayment').value,
      paymentStatus: 'Pending',
      bookingStatus: 'Pending',
      expiresAt: Date.now() + (10 * 60 * 1000),
      createdAt: today
    };
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving booking...';
    }
    if (rescheduleId && window.FNAdmin.hasBookingConflict(newBooking, rescheduleId)) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-regular fa-calendar-check"></i> Confirm booking';
      }
      window.FNAdminComponents.showToast('That new time is already pending or booked. Choose another slot.', 'error');
      return;
    }
    Promise.resolve().then(() => {
      if (!rescheduleId) return;
      const previousBooking = window.FNAdmin.state.bookings.find((item) => item.id === rescheduleId);
      if (!previousBooking) return;
      window.FNAdmin.setBookingStatus(previousBooking, 'Cancelled');
      return window.FNAdmin.syncBookings(previousBooking);
    }).then(() => window.FNAdmin.createBooking(newBooking)).then(() => {
      delete form.dataset.rescheduleBookingId;
      this.renderBookings();
      if (rescheduleId) window.FNAdmin.createBookingNotification(newBooking, 'Booking rescheduled', 'Booking ID ' + newBooking.id + ' is pending for ' + newBooking.court + ' on ' + this.formatDate(newBooking.date) + ', ' + this.toTimeLabel(newBooking.startTime) + ' - ' + this.toTimeLabel(newBooking.endTime) + '.');
      window.FNAdminComponents.showToast(rescheduleId ? 'Booking rescheduled successfully.' : 'Booking request submitted. The venue will confirm it shortly.', 'success');
      form.reset();
      dateInput.min = today;
      dateInput.value = today;
      courtSelect.value = court.id;
      this.updateTimeSlots();
      this.updateAmount();
    }).catch((error) => {
      console.error('Unable to create booking:', error);
      const message = error && error.code === 'already-booked'
        ? 'This time slot is ' + (error.slotStatus === 'Pending' ? 'temporarily held' : 'already booked') + '. Please choose another time.'
        : error && error.code === 'permission-denied'
        ? 'Permission denied. Deploy firebase/firestore.rules and make sure the signed-in user is authenticated.'
        : error && error.code === 'resource-exhausted'
        ? 'Booking could not be saved because the Firebase Firestore quota is exhausted. Check Firebase usage/billing and try again after the quota resets.'
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
