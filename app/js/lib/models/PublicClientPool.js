define(function(require, exports, module) {

	"use strict";	

	var 

		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client');


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

		"getClients": function() {
			return this.clients;
		}

	}).extend(EventEmitter);


	return PublicClientPool;

});

