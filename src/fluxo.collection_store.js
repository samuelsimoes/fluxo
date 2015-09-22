/** @namespace Fluxo */
/**
 * Fluxo.CollectionStore is a convenient wrapper to your literal objects arrays.
 */
Fluxo.CollectionStore = Fluxo.ObjectStore.create({
/** @lends Fluxo.CollectionStore */
  setup: function() {
    var previousStores = this.stores || [];

    this.stores = [];

    this.setStores(previousStores);

    Fluxo.ObjectStore.setup.apply(this);
  },

  store: {},

  storesOnChangeCancelers: {},

  /**
   * @param {Object[]} stores data
   * @returns {null}
   */
  addStores: function(stores) {
    for (var i = 0, l = stores.length; i < l; i++) {
      var store = stores[i];
      this.addStore(store);
    }
  },

  /**
   * @param {Object[]} stores data
   * @returns {null}
   */
  reset: function(stores) {
    this.removeAll();
    this.addStores(stores);
  },

  /**
   * @returns {null}
   * @instance
   */
  removeAll: function() {
    for (var i = (this.stores.length - 1), l = 0; i >= l; i--) {
      var store = this.stores[i];
      this.removeListenersOn(store);
    }

    this.stores = [];

    this.triggerEvents(["remove", "change"]);
  },

  /**
   * This methods add the missing objects and updates the existing stores.
   *
   * @param {Object[]} stores data
   * @returns undefined
   * @instance
   */
  setStores: function(data) {
    for (var i = 0, l = data.length; i < l; i++) {
      var storeData = data[i],
          alreadyAddedStore = this.find(storeData.id || storeData.cid);

      if (alreadyAddedStore) {
        alreadyAddedStore.set(storeData);
      } else {
        this.addStore(storeData);
      }
    }
  },

  /**
   * @param {Object} store data
   * @returns {Object}
   * @instance
   */
  addStore: function(store) {
    if (store._fluxo !== true) {
      store = Fluxo.ObjectStore.create(this.store, { data: store });
    }

    var alreadyAddedStore = this.find(store.data.id);

    if (alreadyAddedStore) { return alreadyAddedStore; }

    this.stores.push(store);

    var onStoreEvent = function(eventName) {
      var args = Array.prototype.slice.call(arguments, 1);

      args.unshift("stores:" + eventName);

      this.triggerEvent.apply(this, args);
    };

    this.storesOnChangeCancelers[store.cid] =
      store.on(["*"], onStoreEvent.bind(this));

    if (this.sort) {
      this.stores.sort(this.sort);
    }

    this.triggerEvents(["add", "change"]);

    return store;
  },

  /**
   * @param {number} storeID
   * @returns {Object|undefined} - the found flux store or undefined
   * @instance
   */
  find: function (storeID) {
    var foundStore;

    if (storeID) {
      foundStore = this.findWhere({ id: storeID });

      if (!foundStore) {
        this.stores.some(function(store) {
          if (store.cid === storeID) {
            foundStore = store;

            return true;
          }
        });
      }
    }

    return foundStore;
  },

  /**
   * @param {Object} criteria
   * @returns {Object|undefined} - the found flux store or undefined
   * @instance
   */
  findWhere: function(criteria) {
    return this.where(criteria, true)[0];
  },

  /**
   * @param {Object} criteria
   * @returns {Fluxo.ObjectStore[]} - the found flux stores or empty array
   * @instance
   */
  where: function(criteria, stopOnFirstMatch) {
    var foundStores = [];

    if (!criteria) { return []; }

    for (var i = 0, l = this.stores.length; i < l; i++) {
      var comparedStore = this.stores[i],
          matchAllCriteria = true;

      for (var key in criteria) {
        if (comparedStore.data[key] !== criteria[key]) {
          matchAllCriteria = false;
          break;
        }
      }

      if (matchAllCriteria) {
        foundStores.push(comparedStore);

        if (stopOnFirstMatch) {
          break;
        }
      }
    }

    return foundStores;
  },

  /**
   * @returns {null}
   * @instance
   */
  removeListenersOn: function(store) {
    this.storesOnChangeCancelers[store.cid].call();
    delete this.storesOnChangeCancelers[store.cid];
  },

  /**
   * @param {Fluxo.ObjectStore} store - the store to remove
   * @returns {null}
   * @instance
   */
  remove: function(store) {
    this.removeListenersOn(store);

    this.stores.splice(this.stores.indexOf(store), 1);

    this.triggerEvents(["remove", "change"]);
  },

  /**
   * It returns an array with the result of toJSON method invoked
   * on each stores.
   *
   * @returns {Object}
   *
   * @instance
   */
  storesToJSON: function() {
    var collectionData = [];

    for (var i = 0, l = this.stores.length; i < l; i++) {
      var store = this.stores[i];
      collectionData.push(store.toJSON());
    }

    return collectionData;
  },

  /**
   * It returns a JSON with two keys. The first, "data", is the
   * store attributes setted using the setAttribute method and the second key,
   * stores, is the result of storesToJSON method.
   *
   * e.g {
   *   data: { count: 20 },
   *   stores: [{ name: "Samuel }]
   * }
   *
   * @returns {Object}
   *
   * @instance
   */
  toJSON: function() {
    var data = JSON.parse(JSON.stringify(this.data));
    data.cid = this.cid;

    return {
      data: data,
      stores: this.storesToJSON()
    };
  }
});
