define(function(require, exports, module) {

	"use strict";

	var
		OrgApp = require('./OrgApp'),
		ClientPool = require('./models/ClientPool'),
		ServiceProviderOrgMain = require('./controllers/mainpage/ServiceProviderOrgMain');

	var HostOrgApp = OrgApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, org) {
			var clientPool = new ClientPool(feideconnect, org.id);

			this._super(feideconnect, app, usercontext, publicClientPool, publicapis, org, clientPool);
			this.mainpage = new ServiceProviderOrgMain(this.mainlisting, org);
			this.pc.add(this.mainpage);

		}

	});

	return HostOrgApp;
});
