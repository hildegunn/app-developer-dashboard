define(function(require, exports, module) {
	"use strict";	


	var 
		Controller = require('../controllers/Controller'),
		DelegatedEntitySubPool = require('./DelegatedEntitySubPool'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client'),
		APIGK = require('./APIGK')

		;


	var DelegatedEntityPool = Controller.extend({
		"init": function(feideconnect) {

			var that = this;

			this.feideconnect = feideconnect;

			this.organizations = {};
			this.users = {};
			this._super();
			this.initLoad();
		},

		"_get": function(orgid, list) {
			if (list.hasOwnProperty(orgid)) {
				return list[orgid];
			}
			var entry = {
				apigks: {},
				clients: {},
				clientRequests: {}
			};
			list[orgid] = entry;
			return entry;
		},

		"initLoad": function() {
			return this.load()
				.then(this.proxy("_initLoaded"));
		},


		"load": function() {
			var that = this;

			return Promise.all([
				that.loadClients(),
				that.loadAPIGKs(),
			]).then(function() {
				that.emit("orgsChange", that.organizations);
				that.emit("usersChange", that.users);
			});
		},

		"_set": function(entity, type) {
			var pool;
			if (entity.organization) {
				pool = this._get(entity.organization, this.organizations);
			} else {
				pool = this._get(entity.owner, this.users);
			}
			pool[type][entity.id] = entity;
		},

		"loadClients": function() {
			var that = this;
			return this.feideconnect.clientsList({'delegated': 'true'})
				.then(function(clients) {
					for (var i = 0; i < clients.length; i++) {
						that._set(new Client(clients[i]), 'clients');
					}
					
				});
		},

		"loadAPIGKs": function() {
			var that = this;
			return this.feideconnect.apigkList({'delegated': 'true'})
				.then(function(apigks) {
					for (var i = 0; i < apigks.length; i++) {
						that._set(new APIGK(apigks[i]), 'apigks');
					}
				});
		},

		"getOrganizations": function() {
			var result = {};
			for (var orgid in this.organizations) {
				result[orgid] = new DelegatedEntitySubPool(this.organizations[orgid]);
			}
			return result;
		},

		"getUsers": function() {
			var result = {};
			for (var userid in this.users) {
				result[userid] = new DelegatedEntitySubPool(this.users[userid]);
			}
			return result;
		}

	}).extend(EventEmitter);

	return DelegatedEntityPool;

});
