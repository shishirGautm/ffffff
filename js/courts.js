window.FNAdminCourts = window.FNAdminCourts || {};

window.FNAdminCourts.getRows = function(searchTerm) {
  const courts = window.FNAdmin.state.courts;
  const query = (searchTerm || '').toLowerCase().trim();
  const filtered = !query ? courts : courts.filter((court) => [court.name, court.city, court.address].join(' ').toLowerCase().includes(query));

  return filtered.map((court) => [
    '<img class="court-thumb" src="https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=120&q=80" alt="' + court.name + '" />',
    '<div class="table-court"><div><strong>' + court.name + '</strong><small>' + court.owner + '</small></div></div>',
    court.city + '<br><small>' + court.address + '</small>',
    'NPR ' + court.pricePerHour.toLocaleString(),
    '<span>' + (court.rating || 4.5) + ' ★</span>',
    '<strong>' + (court.bookings || 0) + '</strong>',
    window.FNAdminComponents.getStatusBadge(court.status),
    '<div class="action-group"><button class="icon-button" title="View"><i class="fa-solid fa-eye"></i></button><button class="icon-button" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="icon-button danger" title="Delete"><i class="fa-solid fa-trash"></i></button></div>'
  ]);
};

window.FNAdminCourts.render = function() {
  const searchTerm = document.getElementById('courtSearch') ? document.getElementById('courtSearch').value : '';
  const target = document.getElementById('courtsTableContainer');
  if (!target) return;

  const headers = ['Image', 'Court', 'Location', 'Price', 'Rating', 'Bookings', 'Status', 'Actions'];
  const rows = this.getRows(searchTerm);
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'courtsTableContainer', emptyMessage: 'No courts match your search.' });

  const modalButtons = target.querySelectorAll('.icon-button');
  modalButtons.forEach((btn) => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      if (!row) return;
      window.FNAdminCourts.openForm();
    });
  });
};

window.FNAdminCourts.openForm = function(court = null) {
  const formHtml = `
    <div class="panel__header"><div><p class="eyebrow">Court</p><h3>${court ? 'Edit Court' : 'Add Court'}</h3></div><button class="icon-button" data-close-modal="true"><i class="fa-solid fa-xmark"></i></button></div>
    <form id="courtForm">
      <div class="field-grid">
        <label>Court Name<input name="name" value="${court ? court.name : ''}" required /></label>
        <label>Owner<input name="owner" value="${court ? court.owner : ''}" required /></label>
        <label>Address<input name="address" value="${court ? court.address : ''}" required /></label>
        <label>City<input name="city" value="${court ? court.city : ''}" required /></label>
        <label>District<input name="district" value="${court ? court.district : ''}" /></label>
        <label>Province<input name="province" value="${court ? court.province : ''}" /></label>
        <label>Contact Number<input name="contactNumber" value="${court ? court.contactNumber : ''}" /></label>
        <label>Price Per Hour<input name="pricePerHour" type="number" value="${court ? court.pricePerHour : 2200}" /></label>
        <label>Opening Time<input name="openingTime" value="${court ? court.openingTime : '08:00'}" /></label>
        <label>Closing Time<input name="closingTime" value="${court ? court.closingTime : '22:00'}" /></label>
        <label>Type<select name="type"><option ${court && court.type === 'Indoor' ? 'selected' : ''}>Indoor</option><option ${court && court.type === 'Outdoor' ? 'selected' : ''}>Outdoor</option></select></label>
        <label>Status<select name="status"><option ${court && court.status === 'active' ? 'selected' : ''} value="active">Active</option><option ${court && court.status === 'inactive' ? 'selected' : ''} value="inactive">Inactive</option></select></label>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" data-close-modal="true">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Court</button>
      </div>
    </form>
  `;

  window.FNAdminComponents.openModal(formHtml);
  const modal = document.getElementById('genericModal');
  if (modal) {
    modal.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', window.FNAdminComponents.closeModal));
  }
  const form = document.getElementById('courtForm');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      const formData = new FormData(form);
      const newCourt = {
        id: court ? court.id : 'court-' + Date.now(),
        name: formData.get('name'),
        owner: formData.get('owner'),
        address: formData.get('address'),
        city: formData.get('city'),
        district: formData.get('district') || 'Kathmandu',
        province: formData.get('province') || 'Bagmati',
        contactNumber: formData.get('contactNumber') || '+977-9800000000',
        pricePerHour: Number(formData.get('pricePerHour') || 2200),
        openingTime: formData.get('openingTime') || '08:00',
        closingTime: formData.get('closingTime') || '22:00',
        type: formData.get('type') || 'Indoor',
        status: formData.get('status') || 'active',
        bookingCount: 0,
        rating: 4.7
      };

      if (court) {
        const index = window.FNAdmin.state.courts.findIndex((item) => item.id === court.id);
        if (index >= 0) window.FNAdmin.state.courts[index] = { ...window.FNAdmin.state.courts[index], ...newCourt };
      } else {
        window.FNAdmin.state.courts.push(newCourt);
      }

      window.FNAdminComponents.closeModal();
      window.FNAdmin.syncCourt(newCourt).then(() => {
        window.FNAdminApp.renderAll();
        window.FNAdminComponents.showToast('Court saved successfully.', 'success');
      }).catch(() => window.FNAdminComponents.showToast('Court saved locally, but live sync failed.', 'error'));
    });
  }
};

window.FNAdminCourts.init = function() {
  const input = document.getElementById('courtSearch');
  if (input) input.addEventListener('input', () => this.render());

  const addButton = document.getElementById('addCourtBtn');
  if (addButton) addButton.addEventListener('click', () => this.openForm());

  const viewButton = document.getElementById('toggleCourtViewBtn');
  if (viewButton) {
    viewButton.addEventListener('click', () => {
      const current = viewButton.textContent.trim();
      viewButton.innerHTML = current.includes('Card') ? '<i class="fa-solid fa-table-cells"></i> Table View' : '<i class="fa-solid fa-table-cells"></i> Card View';
      window.FNAdminComponents.showToast('Court layout toggled.', 'success');
    });
  }

  this.render();
};
