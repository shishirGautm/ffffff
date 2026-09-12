window.FNAdminPayments = window.FNAdminPayments || {};

window.FNAdminPayments.getRows = function() {
  return window.FNAdmin.state.payments.map((payment) => [
    payment.id,
    payment.bookingId,
    payment.user,
    'NPR ' + Number(payment.amount).toLocaleString(),
    payment.method,
    payment.paymentDate,
    window.FNAdminComponents.getStatusBadge(payment.status),
    '<div class="action-group"><button class="icon-button" data-payment-id="' + payment.id + '" title="Verify payment"><i class="fa-solid fa-shield-check"></i></button></div>'
  ]);
};

window.FNAdminPayments.render = function() {
  const headers = ['Transaction ID', 'Booking ID', 'User', 'Amount', 'Payment Method', 'Payment Date', 'Status', 'Actions'];
  const rows = this.getRows();
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'paymentsTableContainer', emptyMessage: 'No payment records available.' });
  const target = document.getElementById('paymentsTableContainer');
  if (target) target.querySelectorAll('[data-payment-id]').forEach((button) => button.addEventListener('click', () => this.verify(button.dataset.paymentId)));
};

window.FNAdminPayments.verify = function(paymentId) {
  const payment = window.FNAdmin.state.payments.find((item) => item.id === paymentId);
  if (!payment) return;
  payment.status = 'Paid';
  const save = window.FNAdminData.isLive() ? window.FNAdminData.save('payments', payment.id, payment) : Promise.resolve();
  save.then(() => {
    this.render();
    window.FNAdminComponents.showToast(payment.method + ' payment verified.', 'success');
  }).catch(() => window.FNAdminComponents.showToast('Payment updated locally, but live sync failed.', 'error'));
};

window.FNAdminPayments.init = function() {
  this.render();
};
