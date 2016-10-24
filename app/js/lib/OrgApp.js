define(function(require, exports, module) {

	"use strict";

	var
		BaseApp = require('./BaseApp'),

		OrgAdminPane = require('./controllers/orgadmin/OrgAdminPane'),
		OrgAdminAPIAuthorizationPane = require('./controllers/orgadmin/OrgAdminAPIAuthorizationPane'),
		SimpleStatusController = require('./controllers/orgadmin/SimpleStatusController'),
		OrgAdminClients = require('./models/OrgAdminClients'),
		OrgAdminAPIs = require('./models/OrgAdminAPIs'),

		ClientPool = require('./models/ClientPool'),
		$ = require('jquery');


	var OrgApp = BaseApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, org) {
			var that = this;
			this.org = org;

			this.clientpool = new ClientPool(feideconnect, this.org.id);

			this.orgAdminClients = null;
			this.orgAdminView = null;
			this.orgAdminAPIs = null;
			this.orgAdminAPIAuthorization = null;

			if (this.isOrgType("home_organization")) {

				this.orgAdminClients = new OrgAdminClients(feideconnect, this.org.id);
				this.orgAdminClients.initLoad();

				this.orgAdminView = new OrgAdminPane(feideconnect, this, publicClientPool, this.orgAdminClients);
				this.orgAdminView.initLoad();

				this.orgAdminAPIs = new OrgAdminAPIs(feideconnect, this.org.id);
				this.orgAdminAPIs.initLoad();

				this.orgAdminAPIAuthorization = new OrgAdminAPIAuthorizationPane(feideconnect, this, this.orgAdminAPIs, publicapis);
				this.orgAdminAPIAuthorization.initLoad();

			}

			this._super(feideconnect, app, usercontext, publicClientPool, publicapis);

			if (this.isOrgType("home_organization")) {
				this.pc.add(this.orgAdminView);
				this.pc.add(this.orgAdminAPIAuthorization);
			}

			this.setupRoute(/^\/mandatory$/, "actMandatory");
			this.setupRoute(/^\/apiauthorization$/, "actAPIAuth");

			this.mainlisting.on("manageMandatory", function() {
				if (that.orgAdminView !== null) {
					that.actMandatory();
				}
			});

			this.mainlisting.on("manageAPIAuth", function() {
				if (that.orgAdminAPIAuthorization !== null) {
					that.actAPIAuth();
				}
			});
		},

		"isPersonal": function() {
			return false;
		},

		"actMandatory": function() {
			this.app.setHash('/' + this.org.id + '/mandatory');
			this.orgAdminView.activate();
			this.app.appSelector.hide();
		},

		"actAPIAuth": function() {
			this.app.setHash('/' + this.org.id + '/apiauthorization');
			this.orgAdminAPIAuthorization.activate();
			this.app.appSelector.hide();
		},

		"getOrgInfo": function() {
			if (!this.org) {
				return null;
			}
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
