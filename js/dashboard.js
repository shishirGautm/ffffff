window.FNAdminDashboard = window.FNAdminDashboard || {};

window.FNAdminDashboard.getStats = function() {
  const courts = window.FNAdmin.state.courts;
  const bookings = window.FNAdmin.state.bookings;
  const users = window.FNAdmin.state.users;
  const teams = window.FNAdmin.state.teams;
  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);

  return [
    { label: 'Total Users', value: users.length, change: '+12.4%', comparison: 'vs last month', icon: 'fa-solid fa-users', trend: 'up' },
    { label: 'Total Courts', value: courts.length, change: '+5.1%', comparison: 'vs last month', icon: 'fa-solid fa-futbol', trend: 'up' },
    { label: 'Total Bookings', value: bookings.length + 12458, change: '+18.4%', comparison: 'vs last month', icon: 'fa-regular fa-calendar-check', trend: 'up' },
    { label: "Today's Bookings", value: 48, change: '+9.2%', comparison: 'vs yesterday', icon: 'fa-regular fa-clock', trend: 'up' },
    { label: 'Total Revenue', value: 'NPR ' + (totalRevenue * 10).toLocaleString(), change: '+22.6%', comparison: 'vs last month', icon: 'fa-solid fa-wallet', trend: 'up' },
    { label: 'Active Matches', value: 16, change: '+4.8%', comparison: 'this week', icon: 'fa-solid fa-trophy', trend: 'up' },
    { label: 'Pending Bookings', value: 12, change: '-3.1%', comparison: 'vs yesterday', icon: 'fa-solid fa-hourglass-half', trend: 'down' },
    { label: 'Registered Teams', value: teams.length + 38, change: '+11.2%', comparison: 'vs last month', icon: 'fa-solid fa-people-group', trend: 'up' }
  ];
};

window.FNAdminDashboard.renderStats = function() {
  const stats = this.getStats();
  const holder = document.getElementById('statsGrid');
  if (!holder) return;

  holder.innerHTML = stats.map((stat) => `
    <article class="stat-card">
      <div class="stat-card__top">
        <div class="stat-icon"><i class="${stat.icon}"></i></div>
        <span class="change-pill ${stat.trend === 'down' ? 'negative' : ''}">${stat.change}</span>
      </div>
      <h3>${stat.label}</h3>
      <strong>${stat.value}</strong>
      <div class="stat-meta">
        <span>${stat.comparison}</span>
      </div>
    </article>
  `).join('');
};

window.FNAdminDashboard.setupCharts = function() {
  const bookingCtx = document.getElementById('bookingChart');
  const revenueCtx = document.getElementById('revenueChart');
  const userGrowthCtx = document.getElementById('userGrowthChart');
  const bookingStatusCtx = document.getElementById('bookingStatusChart');

  if (!bookingCtx || !revenueCtx || !userGrowthCtx || !bookingStatusCtx) return;

  if (window.FNAdmin.dashboardCharts) {
    Object.values(window.FNAdmin.dashboardCharts).forEach((chart) => chart.destroy());
  }

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const bookingChart = new Chart(bookingCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Bookings',
        data: [22, 28, 26, 33, 38, 44, 49],
        borderColor: '#00B95A',
        backgroundColor: 'rgba(0, 185, 90, 0.12)',
        fill: true,
        tension: 0.3,
        borderWidth: 3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  const revenueChart = new Chart(revenueCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: [45, 51, 49, 62, 70, 76, 83],
        backgroundColor: ['#00B95A', '#00C853', '#34d399', '#00B95A', '#00C853', '#0ea5e9', '#34d399'],
        borderRadius: 10
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  const userGrowthChart = new Chart(userGrowthCtx, {
    type: 'doughnut',
    data: {
      labels: ['New users', 'Active users', 'Returning users'],
      datasets: [{
        data: [34, 52, 14],
        backgroundColor: ['#00B95A', '#004D35', '#00C853']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });

  const bookingStatusChart = new Chart(bookingStatusCtx, {
    type: 'polarArea',
    data: {
      labels: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
      datasets: [{
        data: [46, 20, 12, 22],
        backgroundColor: ['#00B95A', '#FF9800', '#E53935', '#2196F3']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });

  const popularCourtsList = document.getElementById('popularCourtsList');
  if (popularCourtsList) {
    const items = [
      { name: 'Anveshan Futsal', bookings: 148, revenue: 'NPR 480K' },
      { name: 'PlayArena', bookings: 126, revenue: 'NPR 440K' },
      { name: 'GoalZone Futsal', bookings: 109, revenue: 'NPR 390K' },
      { name: 'The Futsal Hub', bookings: 96, revenue: 'NPR 310K' }
    ];

    popularCourtsList.innerHTML = items.map((court, index) => `
      <div class="rank-item">
        <span class="rank-number">${index + 1}</span>
        <div>
          <strong>${court.name}</strong>
          <small>${court.bookings} bookings</small>
        </div>
        <strong>${court.revenue}</strong>
      </div>
    `).join('');
  }

  window.FNAdmin.dashboardCharts = { bookingChart, revenueChart, userGrowthChart, bookingStatusChart };
};

window.FNAdminDashboard.init = function() {
  this.renderStats();
  this.setupCharts();
};
