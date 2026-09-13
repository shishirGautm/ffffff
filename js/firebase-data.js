window.FNAdminData = window.FNAdminData || {};

window.FNAdminData.collections = ['courts', 'users', 'teams', 'matches', 'tournaments', 'payments', 'reviews', 'notifications', 'reports', 'admins'];
window.FNAdminData.unsubscribers = [];

window.FNAdminData.isLive = function() {
  return !window.FNAdmin.demoMode && window.firebase && firebase.firestore;
};

window.FNAdminData.getDb = function() {
  if (!this.isLive()) throw new Error('Firebase is not configured.');
  return firebase.firestore();
};

window.FNAdminData.getCollection = function(name) {
  return this.getDb().collection(name);
};

window.FNAdminData.loadState = function(role) {
  if (!this.isLive()) return Promise.resolve(false);
  const allowedCollections = role === 'Admin'
    ? this.collections
    : role === 'Owner'
      ? ['courts', 'notifications']
      : ['courts', 'users', 'teams', 'matches', 'tournaments', 'reviews', 'notifications'];

  return Promise.all(allowedCollections.map((name) => this.getCollection(name).get().then((snapshot) => {
    window.FNAdmin.state[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }))).then(() => true);
};

window.FNAdminData.save = function(collectionName, documentId, data) {
  return this.getCollection(collectionName).doc(documentId).set(data, { merge: true });
};

window.FNAdminData.remove = function(collectionName, documentId) {
  return this.getCollection(collectionName).doc(documentId).delete();
};

window.FNAdminData.uploadAsset = function(file, path) {
  if (!this.isLive() || !window.firebase.storage) return Promise.reject(new Error('Firebase Storage is not configured.'));
  return firebase.storage().ref(path).put(file).then((snapshot) => snapshot.ref.getDownloadURL());
};

window.FNAdminData.subscribeState = function(role) {
  if (!this.isLive()) return;
  this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  this.unsubscribers = [];
  const allowedCollections = role === 'Admin' ? this.collections : role === 'User' ? ['courts', 'users', 'teams', 'matches', 'tournaments', 'reviews', 'notifications'] : ['courts', 'notifications'];
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
