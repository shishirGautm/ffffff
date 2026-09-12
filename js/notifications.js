window.FNAdminNotifications = window.FNAdminNotifications || {};

window.FNAdminNotifications.getRows = function() {
  return window.FNAdmin.state.notifications.map((item) => [
    item.title,
    item.message,
    item.target,
    item.date,
    window.FNAdminComponents.getStatusBadge(item.status),
    '<div class="action-group"><button class="icon-button danger" data-notification-action="delete" data-notification-id="' + item.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button></div>'
  ]);
};

window.FNAdminNotifications.render = function() {
  const headers = ['Title', 'Message', 'Target', 'Date', 'Status', 'Actions'];
  const rows = this.getRows();
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'notificationsTableContainer', emptyMessage: 'No notifications scheduled.' });
  const target = document.getElementById('notificationsTableContainer');
  if (target) target.querySelectorAll('[data-notification-action="delete"]').forEach((button) => button.addEventListener('click', () => this.delete(button.dataset.notificationId)));
  this.renderBell();
};

window.FNAdminNotifications.renderBell = function() {
  const badge = document.getElementById('adminNotificationBadge');
  const count = document.getElementById('adminNotificationCount');
  const preview = document.getElementById('adminNotificationPreview');
  if (!badge || !count || !preview) return;
  const notifications = (window.FNAdmin.state.notifications || []).slice().sort((first, second) => String(second.date || '').localeCompare(String(first.date || '')));
  badge.textContent = notifications.length > 99 ? '99+' : String(notifications.length);
  count.textContent = notifications.length + ' new';
  preview.innerHTML = notifications.length ? notifications.slice(0, 5).map((item) => '<article class="notification-preview-item"><strong>' + item.title + '</strong><p>' + item.message + '</p><small>' + new Date(item.date).toLocaleString() + '</small></article>').join('') : '<p class="notification-empty">No notifications yet.</p>';
};

window.FNAdminNotifications.initBell = function() {
  const bell = document.getElementById('adminNotificationBell');
  const dropdown = document.getElementById('adminNotificationDropdown');
  const viewAll = document.getElementById('viewAllNotificationsBtn');
  if (!bell || !dropdown || bell.dataset.fnInitialized === 'true') return;
  bell.addEventListener('click', () => {
    const isOpen = !dropdown.classList.contains('is-hidden');
    dropdown.classList.toggle('is-hidden', isOpen);
    bell.setAttribute('aria-expanded', String(!isOpen));
  });
  if (viewAll) viewAll.addEventListener('click', () => {
    dropdown.classList.add('is-hidden');
    const link = document.querySelector('.nav-link[data-view="notifications"]');
    if (link) link.click();
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.notification-menu')) {
      dropdown.classList.add('is-hidden');
      bell.setAttribute('aria-expanded', 'false');
    }
  });
  bell.dataset.fnInitialized = 'true';
};

window.FNAdminNotifications.delete = function(notificationId) {
  if (!window.confirm('Delete this notification permanently?')) return;
  const index = window.FNAdmin.state.notifications.findIndex((item) => item.id === notificationId);
  const remove = window.FNAdminData.isLive() ? window.FNAdminData.remove('notifications', notificationId) : Promise.resolve();
  remove.then(() => {
    if (index >= 0) window.FNAdmin.state.notifications.splice(index, 1);
    this.render();
    window.FNAdminComponents.showToast('Notification deleted.', 'success');
  }).catch((error) => window.FNAdminComponents.showToast('Notification could not be deleted: ' + error.message, 'error'));
};

window.FNAdminNotifications.openForm = function() {
  window.FNAdminComponents.openModal('<div class="panel__header"><div><p class="eyebrow">Admin</p><h3>Send notification</h3></div><button class="icon-button" data-close-modal="true"><i class="fa-solid fa-xmark"></i></button></div><form id="notificationForm"><label>Title<input name="title" required /></label><label>Message<textarea name="message" rows="4" required></textarea></label><label>Audience<select name="target"><option value="All">Everyone</option><option value="Users">Users</option><option value="Owners">Court owners</option></select></label><div class="form-actions"><button type="button" class="btn btn-secondary" data-close-modal="true">Cancel</button><button type="submit" class="btn btn-primary">Send notification</button></div></form>');
  document.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', window.FNAdminComponents.closeModal));
  const form = document.getElementById('notificationForm');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const notification = { id: 'notification-' + Date.now(), title: data.get('title'), message: data.get('message'), target: data.get('target'), date: new Date().toISOString(), status: 'Sent' };
    const save = window.FNAdminData.isLive() ? window.FNAdminData.save('notifications', notification.id, notification) : Promise.resolve();
    save.then(() => {
      window.FNAdmin.state.notifications.push(notification);
      window.FNAdminComponents.closeModal();
      this.render();
      window.FNAdminComponents.showToast('Notification sent successfully.', 'success');
    }).catch((error) => window.FNAdminComponents.showToast('Notification could not be sent: ' + error.message, 'error'));
  });
};

window.FNAdminNotifications.init = function() {
  const button = document.getElementById('addNotificationBtn');
  if (button) button.addEventListener('click', () => this.openForm());
  this.initBell();
  this.render();
};
