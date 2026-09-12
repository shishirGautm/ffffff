window.FNAdminReviews = window.FNAdminReviews || {};

window.FNAdminReviews.getRows = function() {
  return window.FNAdmin.state.reviews.map((review) => [
    review.user,
    review.court,
    '★ '.repeat(review.rating) + '☆ '.repeat(5 - review.rating),
    review.review,
    review.date,
    window.FNAdminComponents.getStatusBadge(review.status),
    '<div class="action-group"><button class="icon-button" title="Approve"><i class="fa-solid fa-check"></i></button><button class="icon-button danger" title="Delete"><i class="fa-solid fa-trash"></i></button></div>'
  ]);
};

window.FNAdminReviews.render = function() {
  const headers = ['User', 'Court', 'Rating', 'Review', 'Date', 'Status', 'Actions'];
  const rows = this.getRows();
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'reviewsTableContainer', emptyMessage: 'No reviews found.' });
};

window.FNAdminReviews.init = function() {
  this.render();
};
