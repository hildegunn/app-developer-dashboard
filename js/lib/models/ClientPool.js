define(function(require, exports, module) {
	"use strict";	


	var 
		// $ = require('jquery'),
		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client'),
		APIGK = require('./APIGK')

		;


	var ClientPool = Controller.extend({
		"init": function(feideconnect) {

			var that = this;

			this.feideconnect = feideconnect;
			this.filterOutOrgEntries = true;

			this.apigks = {};
			this.clients = {};

			this._super();

		},

		"initLoad": function(orgid) {

			return this.load(orgid)
				.then(this.proxy("_initLoaded"));

		},

		"load": function(orgid) {
			var that = this;

			// console.error("ABOUT TO LOAD client pool with org ", orgid);

			return Promise.all([
				that.loadClients(orgid),
				that.loadAPIGKs(orgid),
			]);
		},

		"loadClients": function(orgid) {
			var that = this;
			return this.feideconnect.clientsByOrg(orgid)
				.then(function(clients) {
					that.clients = {};
					for (var i = 0; i < clients.length; i++) {

						if (that.filterOutOrgEntries && clients[i].organization !== null && orgid === null) {
							continue;
						}
						that.clients[clients[i].id] = new Client(clients[i]);
					}
					that.emit("clientChange", that.clients);
				});
		},

		"loadAPIGKs": function(orgid) {
			var that = this;
			return this.feideconnect.apigkListByOrg(orgid)
				.then(function(apigks) {
					that.apigks = {};
					for (var i = 0; i < apigks.length; i++) {
						that.apigks[apigks[i].id] = new APIGK(apigks[i]);
					}
					that.emit("apigkChange", that.apigks);
				});
		},

		"setClient": function(client) {
			this.clients[client.id] = client;
			this.emit("clientChange", this.clients);
		},
		"setAPIGK": function(apigk) {
			this.apigks[apigk.id] = apigk;
			this.emit("apigkChange", this.apigks);
		},
		"removeClient": function(id) {
			delete this.clients[id];
			this.emit("clientChange", this.clients);
		},
		"getClient": function(id) {
			if (this.clients.hasOwnProperty(id)) {return this.clients[id];}
			return null;
		},
		"getAPIGK": function(id) {
			if (this.apigks.hasOwnProperty(id)) {return this.apigks[id];}
			return null;
		},
		"removeAPIGK": function(id) {
			delete this.apigks[id];
			// console.error("DELETE APIGK", id);
			this.emit("apigkChange", this.apigks);
		}

	}).extend(EventEmitter);

	return ClientPool;




});

