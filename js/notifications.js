window.FNAdminNotifications = window.FNAdminNotifications || {};

window.FNAdminNotifications.getRows = function() {
  return window.FNAdmin.state.notifications.map((item) => [
    item.title,
    item.message,
    item.target,
    item.date,
    window.FNAdminComponents.getStatusBadge(item.status),
    '<div class="action-group"><button class="icon-button" title="Send"><i class="fa-solid fa-paper-plane"></i></button></div>'
  ]);
};

window.FNAdminNotifications.render = function() {
  const headers = ['Title', 'Message', 'Target', 'Date', 'Status', 'Actions'];
  const rows = this.getRows();
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'notificationsTableContainer', emptyMessage: 'No notifications scheduled.' });
};

window.FNAdminNotifications.init = function() {
  this.render();
};
