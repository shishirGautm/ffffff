window.FNAdminTournaments = window.FNAdminTournaments || {};

window.FNAdminTournaments.getRows = function() {
  return window.FNAdmin.state.tournaments.map((tournament) => [
    tournament.name,
    tournament.location,
    tournament.startDate + ' - ' + tournament.endDate,
    'NPR ' + tournament.fee.toLocaleString(),
    'NPR ' + tournament.prize.toLocaleString(),
    tournament.maxTeams,
    window.FNAdminComponents.getStatusBadge(tournament.status),
    '<div class="action-group"><button class="icon-button" title="View"><i class="fa-solid fa-eye"></i></button><button class="icon-button" title="Edit"><i class="fa-solid fa-pen"></i></button></div>'
  ]);
};

window.FNAdminTournaments.render = function() {
  const headers = ['Tournament', 'Location', 'Date', 'Fee', 'Prize', 'Teams', 'Status', 'Actions'];
  const rows = this.getRows();
  window.FNAdminComponents.renderTable({ headers, rows, targetId: 'tournamentsTableContainer', emptyMessage: 'No tournaments available.' });
};

window.FNAdminTournaments.init = function() {
  this.render();
};
