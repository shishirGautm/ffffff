window.FNAdminAuth = window.FNAdminAuth || {};

window.FNAdminAuth.user = null;

window.FNAdminAuth.isAuthenticated = function() {
  return !!this.user;
};

window.FNAdminAuth.getRole = function() {
  return this.user ? this.user.role : null;
};

window.FNAdminAuth.resolveFirebaseProfile = function(firebaseUser) {
  const uid = firebaseUser.uid;
  const fallbackName = firebaseUser.displayName || firebaseUser.email;
  return firebase.firestore().collection('admins').doc(uid).get().then((adminDoc) => {
    if (adminDoc.exists) return { role: 'Admin', name: adminDoc.data().name || fallbackName };
    return firebase.firestore().collection('users').doc(uid).get().then((userDoc) => {
      if (userDoc.exists && userDoc.data().role === 'Owner') return { role: 'Owner', name: userDoc.data().name || fallbackName };
      return userDoc.exists ? { role: 'User', name: userDoc.data().name || fallbackName } : null;
    }).then((profile) => {
      if (profile) return profile;
      return firebase.firestore().collection('courts').where('ownerId', '==', uid).limit(1).get().then((ownerCourts) => ownerCourts.empty ? { role: 'User', name: fallbackName } : { role: 'Owner', name: fallbackName });
    });
  });
};

window.FNAdminAuth.toggleAuthScreens = function(showAuth) {
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('app-shell');
  const userSection = document.getElementById('userSection');
  const ownerSection = document.getElementById('ownerSection');

  if (authScreen) authScreen.classList.toggle('hidden', !showAuth);
  if (appShell) appShell.classList.toggle('hidden', showAuth || ['User', 'Owner'].includes(this.getRole()));
  if (userSection) userSection.classList.toggle('hidden', showAuth || this.getRole() !== 'User');
  if (ownerSection) ownerSection.classList.toggle('hidden', showAuth || this.getRole() !== 'Owner');
};

window.FNAdminAuth.setUser = function(user) {
  this.user = user;
  const role = (user && user.role) || 'Admin';
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('app-shell');
  const userSection = document.getElementById('userSection');
  const ownerSection = document.getElementById('ownerSection');

  if (authScreen) authScreen.classList.add('hidden');
  if (appShell) appShell.classList.toggle('hidden', role === 'User' || role === 'Owner');
  if (userSection) userSection.classList.toggle('hidden', role !== 'User');
  if (ownerSection) ownerSection.classList.toggle('hidden', role !== 'Owner');
};

window.FNAdminAuth.login = function(email, password, role = 'admin') {
  const demoAccounts = {
    admin: { email: 'admin@futsalnepal.com', password: 'admin123', name: 'Admin Nepal', displayRole: 'Admin' },
    user: { email: 'user@futsalnepal.com', password: 'user123', name: 'Futsal Customer', displayRole: 'User' },
    owner: { email: 'owner@futsalnepal.com', password: 'owner123', name: 'Aarav Shrestha', displayRole: 'Owner' }
  };

  if (!window.FNAdmin.demoMode && window.firebase && firebase.auth) {
    return firebase.auth().signInWithEmailAndPassword(email, password).then((credential) => {
      const uid = credential.user.uid;
      this.user = { uid, email, name: email, role: 'User' };
      return this.resolveFirebaseProfile(credential.user).then((profile) => {
        this.setUser({ uid, email, name: profile.name, role: profile.role });
        window.FNAdmin.subscribeToBookings();
        const profileWrite = profile.role === 'User' ? window.FNAdminData.save('users', uid, { id: uid, email, name: profile.name, updatedAt: new Date().toISOString() }) : Promise.resolve();
        return profileWrite.then(() => window.FNAdminData.loadState(profile.role)).then(() => {
          window.FNAdminData.subscribeState(profile.role);
          window.FNAdmin.subscribeToBookings();
          window.FNAdminComponents.showToast('Welcome back, ' + profile.name + '.', 'success');
          return true;
        });
      });
    }).catch((error) => {
      const message = error.code === 'auth/invalid-credential'
        ? 'Incorrect Firebase email or password.'
        : error.code === 'auth/user-not-found'
          ? 'No Firebase account exists for this email.'
          : error.message || 'Unable to sign in.';
      window.FNAdminComponents.showToast(message, 'error');
      return false;
    });
  }

  const account = demoAccounts[role] || demoAccounts.admin;

  if (email === account.email && password === account.password) {
    this.setUser({ email, name: account.name, role: account.displayRole });
    window.FNAdminComponents.showToast('Welcome back, ' + account.name + '.', 'success');
    return Promise.resolve(true);
  }

  window.FNAdminComponents.showToast('Use the matching demo credentials for the selected role.', 'error');
  return Promise.resolve(false);
};

window.FNAdminAuth.loginWithGoogle = function() {
  if (window.FNAdmin.demoMode || !window.firebase || !firebase.auth || !firebase.apps || !firebase.apps.length) {
    const reason = window.FNAdmin.firebaseError ? window.FNAdmin.firebaseError.message : 'Firebase Authentication is not initialized.';
    window.FNAdminComponents.showToast('Google sign-in is unavailable: ' + reason, 'error');
    return Promise.resolve(false);
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider).then((credential) => {
    const firebaseUser = credential.user;
    this.user = { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName || firebaseUser.email, role: 'User' };
    return this.resolveFirebaseProfile(firebaseUser).then((profile) => {
      this.setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: profile.name, role: profile.role });
      const profileWrite = profile.role === 'User' ? window.FNAdminData.save('users', firebaseUser.uid, { id: firebaseUser.uid, email: firebaseUser.email, name: profile.name, updatedAt: new Date().toISOString() }) : Promise.resolve();
      return profileWrite.then(() => window.FNAdminData.loadState(profile.role)).then(() => {
        window.FNAdminData.subscribeState(profile.role);
        window.FNAdmin.subscribeToBookings();
        window.FNAdminComponents.showToast('Welcome back, ' + profile.name + '.', 'success');
        window.FNAdminApp.renderAll();
        return true;
      });
    });
  }).catch((error) => {
  this.user = null;
    window.FNAdminComponents.showToast(error.message || 'Google sign-in failed.', 'error');
    return false;
  });
};

window.FNAdminAuth.registerWithGoogle = function(role) {
  if (role === 'Admin') {
    window.FNAdminComponents.showToast('Admin accounts must be created by an existing administrator.', 'error');
    return Promise.resolve(false);
  }
  if (window.FNAdmin.demoMode || !window.firebase || !firebase.auth || !firebase.apps || !firebase.apps.length) {
    window.FNAdminComponents.showToast('Google registration requires Firebase Authentication.', 'error');
    return Promise.resolve(false);
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider).then((credential) => {
    const firebaseUser = credential.user;
    const name = firebaseUser.displayName || firebaseUser.email;
    return window.FNAdminData.save('users', firebaseUser.uid, { id: firebaseUser.uid, name, email: firebaseUser.email, role, createdAt: new Date().toISOString() }).then(() => {
      window.FNAdminAuth.setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name, role });
      return window.FNAdminData.loadState(role).then(() => {
        window.FNAdminData.subscribeState(role);
        window.FNAdmin.subscribeToBookings();
        window.FNAdminApp.renderAll();
        window.FNAdminComponents.showToast('Account created with Google.', 'success');
        return true;
      });
    });
  }).catch((error) => {
    window.FNAdminComponents.showToast(error.message || 'Google registration failed.', 'error');
    return false;
  });
};

window.FNAdminAuth.register = function(name, email, password, role) {
  if (role === 'Admin') {
    window.FNAdminComponents.showToast('Admin accounts must be created by an existing administrator.', 'error');
    return Promise.resolve(false);
  }
  if (window.FNAdmin.demoMode || !window.firebase || !firebase.auth) {
    window.FNAdminComponents.showToast('Account creation requires Firebase Authentication.', 'error');
    return Promise.resolve(false);
  }
  return firebase.auth().createUserWithEmailAndPassword(email, password).then((credential) => {
    const user = credential.user;
    return window.FNAdminData.save('users', user.uid, { id: user.uid, name, email, role, createdAt: new Date().toISOString() }).then(() => {
      this.setUser({ uid: user.uid, email, name, role });
      return window.FNAdminData.loadState(role).then(() => {
        window.FNAdminData.subscribeState(role);
        window.FNAdminComponents.showToast('Account created successfully.', 'success');
        window.FNAdminApp.renderAll();
        return true;
      });
    });
  }).catch((error) => {
    window.FNAdminComponents.showToast(error.message || 'Unable to create account.', 'error');
    return false;
  });
};

window.FNAdminAuth.logout = function() {
  if (!window.FNAdmin.demoMode && window.firebase && firebase.auth) firebase.auth().signOut();
  if (window.FNAdmin.listeners) {
    window.FNAdmin.listeners.forEach((unsubscribe) => unsubscribe());
    window.FNAdmin.listeners = [];
  }
  if (window.FNAdminData) window.FNAdminData.stopSubscriptions();
  this.user = null;
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('app-shell');
  const userSection = document.getElementById('userSection');
  const ownerSection = document.getElementById('ownerSection');

  if (authScreen) authScreen.classList.remove('hidden');
  if (appShell) appShell.classList.add('hidden');
  if (userSection) userSection.classList.add('hidden');
  if (ownerSection) ownerSection.classList.add('hidden');
};

window.FNAdminAuth.init = function() {
  const authLoginForm = document.getElementById('authLoginForm');

  const accessButtons = document.querySelectorAll('.access-btn');
  const hiddenRoleInput = document.getElementById('authLoginRole');
  if (accessButtons.length && hiddenRoleInput) {
    accessButtons.forEach((button) => {
      button.addEventListener('click', function() {
        const role = this.getAttribute('data-role');
        hiddenRoleInput.value = role;
        document.getElementById('authLoginEmail').value = role === 'user' ? 'user@futsalnepal.com' : role === 'owner' ? 'owner@futsalnepal.com' : 'admin@futsalnepal.com';
        document.getElementById('authLoginPassword').value = role === 'user' ? 'user123' : role === 'owner' ? 'owner123' : 'admin123';
        accessButtons.forEach((btn) => btn.classList.toggle('active', btn === this));
      });
    });
  }

  if (authLoginForm) {
    authLoginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('authLoginEmail').value.trim();
      const password = document.getElementById('authLoginPassword').value.trim();
      const role = hiddenRoleInput ? hiddenRoleInput.value : 'admin';
      window.FNAdminAuth.login(email, password, role).then((result) => {
        if (result) {
          window.FNAdminApp.renderAll();
        }
      });
    });
  }

  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => window.FNAdminAuth.loginWithGoogle());
  const googleRegisterBtn = document.getElementById('googleRegisterBtn');
  if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', () => window.FNAdminAuth.registerWithGoogle(document.getElementById('registerRole').value));

  const loginForm = document.getElementById('authLoginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const showLoginBtn = document.getElementById('showLoginBtn');
  const toggleRegistration = (showRegistration) => {
    if (loginForm) {
      loginForm.classList.toggle('hidden', showRegistration);
      loginForm.hidden = showRegistration;
    }
    if (registerForm) {
      registerForm.classList.toggle('hidden', !showRegistration);
      registerForm.hidden = !showRegistration;
    }
    if (showRegisterBtn) {
      showRegisterBtn.classList.toggle('hidden', showRegistration);
      showRegisterBtn.hidden = showRegistration;
    }
  };
  toggleRegistration(false);
  if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => toggleRegistration(true));
  if (showLoginBtn) showLoginBtn.addEventListener('click', () => toggleRegistration(false));
  if (registerForm) registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    window.FNAdminAuth.register(
      document.getElementById('registerName').value.trim(),
      document.getElementById('registerEmail').value.trim(),
      document.getElementById('registerPassword').value,
      document.getElementById('registerRole').value
    );
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => window.FNAdminAuth.logout());
  }

  const userLogoutBtn = document.getElementById('userLogoutBtn');
  if (userLogoutBtn) {
    userLogoutBtn.addEventListener('click', () => window.FNAdminAuth.logout());
  }

  const ownerLogoutBtn = document.getElementById('ownerLogoutBtn');
  if (ownerLogoutBtn) ownerLogoutBtn.addEventListener('click', () => window.FNAdminAuth.logout());

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const icon = this.querySelector('i');
      icon.className = document.body.classList.contains('dark-mode') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  }

  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  navLinks.forEach((link) => {
    link.addEventListener('click', function() {
      navLinks.forEach((item) => item.classList.remove('active'));
      this.classList.add('active');
      const view = this.getAttribute('data-view');
      document.querySelectorAll('.page-section').forEach((section) => {
        section.classList.toggle('active', section.getAttribute('data-page') === view);
      });
      document.getElementById('pageTitle').textContent = this.textContent.trim();
      if (sidebar) sidebar.classList.remove('open');
    });
  });

  this.toggleAuthScreens(true);

  if (!window.FNAdmin.demoMode && window.firebase && firebase.auth) {
    firebase.auth().onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) return;
      if (this.user && this.user.uid === firebaseUser.uid) return;
      this.resolveFirebaseProfile(firebaseUser).then((profile) => {
        this.setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: profile.name, role: profile.role });
        return window.FNAdminData.loadState(profile.role).then(() => {
          window.FNAdminData.subscribeState(profile.role);
          window.FNAdmin.subscribeToBookings();
          window.FNAdminApp.renderAll();
        });
      }).catch((error) => window.FNAdminComponents.showToast('Unable to load your Firebase profile: ' + error.message, 'error'));
    });
  }
};
