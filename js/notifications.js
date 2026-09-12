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
  this.render();
};
