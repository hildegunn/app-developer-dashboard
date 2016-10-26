define(function(require, exports, module) {

	"use strict";

	var
		BaseApp = require('./BaseApp'),

		ClientPool = require('./models/ClientPool');


	var OrgApp = BaseApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, org, clientPool) {
			var that = this;
			this.org = org;

			this.clientpool = clientPool;
			if (!this.clientpool) {
				this.clientpool = new ClientPool(feideconnect, this.org.id);
			}

			this._super(feideconnect, app, usercontext, publicClientPool, publicapis);

		},

		"getOrgInfo": function() {
			return {
				"id": this.org.id,
				"displayName": this.org.name,
				"logoURL": this.feideconnect.orgLogoURL(this.org.id)
			};
		},

		"getClientRequests": function() {
			return this.feideconnect.apigkClientRequestsByOrg(this.org.id);
		},

		"isOrgType": function(type) {
			return this.org.matchType(type);
		},

		"getSelectorIcon": function() {
			if (this.isOrgType("home_organization")) {
				return 'fa fa-home';
			} else if (this.isOrgType("service_provider")) {
				return 'fa fa-suitcase';
			} else {
				return 'fa fa-circle-o';
			}
		},

		"getID": function() {
			return this.org.id;
		},

		"getTitle": function() {
			return this.org.name;
		}

	});

	return OrgApp;
});
