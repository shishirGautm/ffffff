window.FNAdminData = window.FNAdminData || {};

window.FNAdminData.collections = ['courts', 'users', 'teams', 'matches', 'tournaments', 'payments', 'reviews', 'notifications', 'reports', 'admins', 'activityLogs'];
window.FNAdminData.unsubscribers = [];

window.FNAdminData.isLive = function() {
  return !!(window.firebase && firebase.firestore && firebase.auth && !window.FNAdmin.demoMode);
};

window.FNAdminData.getDb = function() {
  if (!this.isLive()) throw new Error('Firebase is not configured.');
  return firebase.firestore();
};

window.FNAdminData.getCollection = function(name) {
  return this.getDb().collection(name);
};

window.FNAdminData.ensureCollectionState = function(collectionName, item) {
  window.FNAdmin.state = window.FNAdmin.state || {};
  if (!Array.isArray(window.FNAdmin.state[collectionName])) {
    window.FNAdmin.state[collectionName] = [];
  }
  if (item && !window.FNAdmin.state[collectionName].some((entry) => entry.id === item.id)) {
    window.FNAdmin.state[collectionName].push(item);
  }
};

window.FNAdminData.logActivity = function(action, collectionName, documentId, details) {
  if (!this.isLive() || !firebase.auth().currentUser) return Promise.resolve();
  const actor = firebase.auth().currentUser;
  return this.getCollection('activityLogs').add({
    action,
    collection: collectionName,
    documentId: documentId || null,
    actorId: actor.uid,
    actorEmail: actor.email || null,
    details: details || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch((error) => {
    console.error('Unable to record activity:', error.message);
  });
};

window.FNAdminData.loadState = function(role) {
  if (!this.isLive()) return Promise.resolve(false);
  const allowedCollections = role === 'Admin'
    ? this.collections
    : role === 'Owner'
      ? ['courts', 'bookings', 'notifications']
      : ['courts', 'users', 'teams', 'matches', 'tournaments', 'reviews', 'notifications'];

  return Promise.all(allowedCollections.map((name) => this.getCollection(name).get().then((snapshot) => {
    window.FNAdmin.state[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }).catch((error) => {
    if (error && (error.code === 'permission-denied' || error.code === 'failed-precondition')) {
      console.warn('Skipping live load for ' + name + ' due to Firebase permissions/configuration.');
      window.FNAdmin.state[name] = Array.isArray(window.FNAdmin.state[name]) ? window.FNAdmin.state[name] : [];
      return;
    }
    throw error;
  }))).then(() => true).catch((error) => {
    if (error && (error.code === 'permission-denied' || error.code === 'failed-precondition')) {
      allowedCollections.forEach((name) => {
        window.FNAdmin.state[name] = Array.isArray(window.FNAdmin.state[name]) ? window.FNAdmin.state[name] : [];
      });
      return true;
    }
    throw error;
  });
};

window.FNAdminData.save = function(collectionName, documentId, data) {
  if (!this.isLive()) {
    window.FNAdmin.state = window.FNAdmin.state || {};
    window.FNAdmin.state[collectionName] = window.FNAdmin.state[collectionName] || [];
    const existingIndex = window.FNAdmin.state[collectionName].findIndex((item) => item.id === documentId);
    if (existingIndex >= 0) {
      window.FNAdmin.state[collectionName][existingIndex] = { ...window.FNAdmin.state[collectionName][existingIndex], ...data, id: documentId };
    } else {
      window.FNAdmin.state[collectionName].push({ ...data, id: documentId });
    }
    return Promise.resolve({ id: documentId, ...data });
  }
  return this.getCollection(collectionName).doc(documentId).set(data, { merge: true }).then(() => this.logActivity('save', collectionName, documentId));
};

window.FNAdminData.remove = function(collectionName, documentId) {
  if (!this.isLive()) {
    window.FNAdmin.state = window.FNAdmin.state || {};
    const collection = window.FNAdmin.state[collectionName] || [];
    window.FNAdmin.state[collectionName] = collection.filter((item) => item.id !== documentId);
    return Promise.resolve();
  }
  return this.getCollection(collectionName).doc(documentId).delete().then(() => this.logActivity('delete', collectionName, documentId));
};

window.FNAdminData.uploadAsset = function(file, path) {
  if (!window.firebase || !window.firebase.storage || !firebase.storage || window.FNAdmin.demoMode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read the selected file.'));
      if (file) reader.readAsDataURL(file);
      else resolve('');
    });
  }
  return firebase.storage().ref(path).put(file).then((snapshot) => snapshot.ref.getDownloadURL()).catch(() => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read the selected file.'));
      if (file) reader.readAsDataURL(file);
      else resolve('');
    });
  });
};

window.FNAdminData.subscribeState = function(role) {
  if (!this.isLive()) return;
  this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  this.unsubscribers = [];
  const allowedCollections = role === 'Admin' ? this.collections : role === 'User' ? ['courts', 'users', 'teams', 'matches', 'tournaments', 'reviews', 'notifications'] : ['courts', 'bookings', 'notifications'];
  allowedCollections.forEach((name) => {
    const unsubscribe = this.getCollection(name).onSnapshot((snapshot) => {
      window.FNAdmin.state[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      window.dispatchEvent(new CustomEvent('fn:collection-changed', { detail: { collection: name } }));
    }, (error) => {
      console.error('Unable to load ' + name + ':', error.message);
      window.dispatchEvent(new CustomEvent('fn:collection-error', { detail: { collection: name, error } }));
    });
    this.unsubscribers.push(unsubscribe);
  });
};

window.FNAdminData.stopSubscriptions = function() {
  this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  this.unsubscribers = [];
};
