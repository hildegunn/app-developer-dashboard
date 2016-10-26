define(function(require, exports, module) {

	"use strict";

	var
		OrgApp = require('./OrgApp'),

		OrgAdminPane = require('./controllers/orgadmin/OrgAdminPane'),
		OrgAdminAPIAuthorizationPane = require('./controllers/orgadmin/OrgAdminAPIAuthorizationPane'),
		HostOrgMain = require('./controllers/mainpage/HostOrgMain'),
		OrgAdminClients = require('./models/OrgAdminClients'),
		OrgAdminAPIs = require('./models/OrgAdminAPIs'),

		ClientPool = require('./models/ClientPool');


	var HostOrgApp = OrgApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, org) {
			var that = this;
			var clientPool = new ClientPool(feideconnect, org.id);

			this._super(feideconnect, app, usercontext, publicClientPool, publicapis, org, clientPool);


			this.orgAdminClients = new OrgAdminClients(feideconnect, this.org.id);
			this.orgAdminClients.initLoad();

			this.orgAdminView = new OrgAdminPane(feideconnect, this, publicClientPool, this.orgAdminClients);
			this.orgAdminView.initLoad();
			this.pc.add(this.orgAdminView);

			this.orgAdminAPIs = new OrgAdminAPIs(feideconnect, this.org.id);
			this.orgAdminAPIs.initLoad();

			this.orgAdminAPIAuthorization = new OrgAdminAPIAuthorizationPane(feideconnect, this, this.orgAdminAPIs, publicapis);
			this.orgAdminAPIAuthorization.initLoad();
			this.pc.add(this.orgAdminAPIAuthorization);

			this.mainpage = new HostOrgMain(this.mainlisting, feideconnect, this.orgAdminClients, this.orgAdminAPIs, usercontext, org.id);
			this.pc.add(this.mainpage);

			this.mainpage.on("manageMandatory", function() {
				that.actMandatory();
			});

			this.mainpage.on("manageAPIAuth", function() {
				that.actAPIAuth();
			});

			this.setupRoute(/^\/mandatory$/, "actMandatory");
			this.setupRoute(/^\/apiauthorization$/, "actAPIAuth");
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
		}

	});

	return HostOrgApp;
});
