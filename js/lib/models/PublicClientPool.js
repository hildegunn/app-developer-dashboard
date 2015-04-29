define(function(require, exports, module) {

	"use strict";	

	var 

		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client'),
		APIGK = require('./APIGK')
		;


	var PublicClientPool = Controller.extend({
		"init": function(feideconnect) {

			var that = this;
			this.feideconnect = feideconnect;

			this.clients = {};

			this._super();

			this.initLoad();

		},

		"initLoad": function() {
			this.load()
				.then(this.proxy("_initLoaded"));

		},

		"load": function() {
			var that = this;
			return this.feideconnect.clientsPublicList()
				.then(function(clients) {
					var i;
					that.clients = {};
					for (i = 0; i < clients.length; i++) {
						that.clients[clients[i].id] = new Client(clients[i]);
					}
					that.emit('clientsChange', that.clients);
				});

		},

		"getView": function() {

			var items = [];
			for(var key in this.clients) {
				var x = this.clients[key];
				x.id = key;
				items.push(x.getView());
			}
			return items;

		},

		"setClient": function(apigk) {
			this.apigks[apigk.id] = apigk;
			this.emit("clientsChange", this.apigks);
		},
		"getClients": function() {
			return this.clients;
		},
		"getClient": function(id) {
			if (this.apigks.hasOwnProperty(id)) { return this.apigks[id]; }
			return null;
		},
		"removeClient": function(id) {
			delete this.clients[id];
			// console.error("DELETE APIGK", id);
			this.emit("clientsChange", this.apigks);
		}

	}).extend(EventEmitter);


	return PublicClientPool;

});

