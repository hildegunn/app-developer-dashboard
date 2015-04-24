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
			this.clientRequests = [];

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
				that.loadRequests(orgid)
			]).then(function() {
				return that.processClientRequests()
			}).then(function() {
				that.emit("clientChange", that.clients);
				that.emit("apigkChange", that.apigks);
			});
		},



		"getClientRequests": function(orgid) {
			if  (orgid === null) {
				return this.feideconnect.apigkClientRequests();
			}
			return this.feideconnect.apigkClientRequestsByOrg(orgid);
		},


		"loadRequests": function(orgid) {

			var that = this;
			return this.getClientRequests(orgid).
				then(function(clients) {
					console.log("DATA CLIENT REQUESTS...", clients);

					var i, nc, cv;
					var reqClientsReq = [];

					for (i = 0; i < clients.length; i++) {
						nc = new Client(clients[i]);
						that.clientRequests.push(nc);


					}

				});

		},

		// Separate function because clientrequests and apigks are fetched in parallell, 
		// this will need to wait for both to be completed.
		"processClientRequests": function() {

			var i, k;

			for(var apigkid in this.apigks) {

				// var api = new APIGK(this.apigks[apigkid]);


				for (i = 0; i < this.clientRequests.length; i++) {
					var x = this.clientRequests[i];
					var cv = x.getAPIGKview(this.apigks[apigkid]);
					
					// console.error("Processing API GK View", cv);	

					if (cv.sd.req) {
						// if (!this.clientRequestsStructured.hasOwnProperty(apigkid)) {
						// 	this.clientRequestsStructured[apigkid] = 0;
						// }
						// this.clientRequestsStructured[apigkid]++;

						this.apigks[apigkid].increaseClientRequestCounter();
						
						console.error("Processing API GK View", cv);	
						// view.clientsReq.push($.extend({}, cv));
					}


				}

			}


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

