define(function(require, exports, module) {
	"use strict";

	var
		Controller = require('../controllers/Controller'),
		Organiation = require('../models/Organization'),
		Group = require('../models/Group'),
		EventEmitter = require('../EventEmitter');


	var UserContext = Controller.extend({

		"init": function(feideconnect, app) {
			this.feideconnect = feideconnect;
			this.app = app;
			this.user = null;

			this.policy = null;
			this.groups = {};
			this.orgAdminFor = {};
			this.platformadmin = null;


			this.orgcache = {};

			this._super(null, true);

		},

		"setUser": function(user) {
			this.user = user;
		},

		"initLoad": function() {
			var that = this;
			return Promise.all([
					this.loadGroups(),
					this.loadPolicy()
				])
				.then(that.proxy("_initLoaded"));
		},

		"loadGroups": function() {
			var that = this;
			return this.feideconnect.vootGroupsList()
				.then(function(groups) {

					for (var i = 0; i < groups.length; i++) {

						var g = new Group(groups[i]);
						that.groups[g.id] = g;

						if (g.id === 'fc:platformadmin:admins') {
							that.platformadmin = g;
							continue;
						}

						// Only use group memberships where a user is admin in an orgadmin group.
						if (!g.isType("fc:orgadmin")) {
							continue;
						}
						if (!g.isMemberType("admin")) {
							continue;
						}
						that.orgAdminFor[g.org] = g;
					}
				});
		},


		"loadPolicy": function() {
			var that = this;
			return this.feideconnect.getClientPolicy()
				.then(function(policy) {
					that.policy = policy;
				});
		},

		"isClientAuthorizedToIDporten": function(client) {
			var that = this;
			if (!client.organization) {
				return Promise.resolve(false);
			}
			return that.isOrgAuthorizedToIDporten(client.organization);
		},

		"isPlatformAdmin": function() {
			return this.platformadmin !== null;
		},

		"isOrgAuthorizedToIDporten": function(orgid) {
			return this.getOrg(orgid)
				.then(function(org) {
					if (org.services) {
						for (var i = 0; i < org.services.length; i++) {
							if (org.services[i] === 'idporten') {
								return true;
							}
						}
					}
					return false;
				});
		},

		"getOrg": function(orgid) {
			var that = this;
			if (that.orgcache.hasOwnProperty(orgid)) {
				return Promise.resolve(that.orgcache[orgid]);
			}
			return that.feideconnect.getOrg(orgid)
				.then(function(org) {
					var orgModel = new Organiation(org);
					that.orgcache[orgid] = orgModel;
					return orgModel;
				});
		},

		"getOrgIdentifiers": function() {

			var keys = [];
			for (var key in this.orgAdminFor) {
				keys.push(key);
			}
			return keys;
		}



	}).extend(EventEmitter);


	return UserContext;
});
