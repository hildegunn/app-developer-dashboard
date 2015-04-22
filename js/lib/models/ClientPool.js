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

			this.apigks = {};
			this.clients = {};

			this.apigksLoaded = false;
			this.clientsLoaded = false;


			this.filterOutOrgEntries = true;


			this._super();

			// this.feideconnect.apigkList(function(apigks) {

			// 	console.log("APIgks", apigks);
			// 	var i;
			// 	for (i = 0; i < apigks.length; i++) {
			// 		that.apigks[apigks[i].id] = new APIGK(apigks[i]);
			// 	}
			// 	that.emit('apigkChange', that.apigks);
			// 	that.apigksLoaded = true;
			// 	if (that.clientsLoaded) {that.emit('ready');}


			// });

			// this.feideconnect.clientsList(function(clients) {

			// 	console.log("clients", clients);
			// 	var i;
			// 	for (i = 0; i < clients.length; i++) {
			// 		that.clients[clients[i].id] = new Client(clients[i]);
			// 	}
			// 	that.emit('clientChange', that.clients);
			// 	that.clientsLoaded = true;
			// 	if (that.apigksLoaded) {that.emit('ready');}

			// });

		},

		"initLoad": function(orgid) {

			return this.load(orgid);

		},

		"load": function(orgid) {
			var that = this;

			console.error("ABOUT TO LOAD client pool with org ", orgid);

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
			console.error("DELETE APIGK", id);
			this.emit("apigkChange", this.apigks);
		}

	}).extend(EventEmitter);

	return ClientPool;




});

