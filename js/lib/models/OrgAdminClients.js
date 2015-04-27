define(function(require, exports, module) {
	"use strict";	


	var 
		// $ = require('jquery'),
		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client'),
		APIGK = require('./APIGK')

		;


	var OrgAdminClients = Controller.extend({
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



	}).extend(EventEmitter);

	return OrgAdminClients;




});

