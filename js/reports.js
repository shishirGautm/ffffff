window.FNAdminReports = window.FNAdminReports || {};

window.FNAdminReports.getRows = function() {
  return window.FNAdmin.state.reports.map((report) => [
    report.name,
    report.details,
    '<button class="btn btn-secondary"><i class="fa-solid fa-download"></i> Export</button>',
    '<button class="btn btn-primary"><i class="fa-solid fa-print"></i> Print</button>'
  ]);
};

window.FNAdminReports.render = function() {
  const headers = ['Report', 'Summary', 'Export', 'Print'];
  const rows = this.getRows();
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'reportsTableContainer', emptyMessage: 'No reports available.' });
};

window.FNAdminReports.init = function() {
  this.render();
};
