define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('../controllers/Controller'),
		Model = require('../models/Model'),
		Group = require('../models/Group'),
		EventEmitter = require('../EventEmitter');


	var UserContext = Controller.extend({

		"init": function(feideconnect, app) {

			var that = this;
			this.feideconnect = feideconnect;
			this.app = app;

			this.policy = null;
			this.groups = {};
			this.platformadmin = null;

			this._super(null, true);

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
						that.groups[g.org] = g;
					}
				});
		},


		"loadPolicy": function() {
			var that = this;
			return new Promise(function(resolve, reject) {

				that.policy = {
					"register": false
				};
				return resolve();

			});
		},

		"getOrgIdentifiers": function() {

			var keys = [];
			for (var key in this.groups) {
				keys.push(key);
			}
			return keys;
		},


		"getOrgInfo": function(orgid) {
			if (orgid === '_') {
				return null;
			}

			var c = this.feideconnect.getConfig();
			// console.error("Config was", c);

			console.log("Getting orginfo for " + orgid, this.roles);
			var orgInfo = {
				"id": orgid,
				"displayName": this.groups[orgid].getTitle(),
				"logoURL": c.apis.core + '/orgs/' + orgid + '/logo'
			};

			return orgInfo;
		}



	}).extend(EventEmitter);


	return UserContext;
});