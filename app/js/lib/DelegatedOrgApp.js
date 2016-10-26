define(function(require, exports, module) {

	"use strict";

	var
		OrgApp = require('./OrgApp'),
		DelegatedMain = require('./controllers/mainpage/DelegatedMain');

	var DelegatedOrgApp = OrgApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, org, clientPool) {
			var that = this;

			this._super(feideconnect, app, usercontext, publicClientPool, publicapis, org, clientPool);
			this.mainpage = new DelegatedMain(this.mainlisting);
			this.pc.add(this.mainpage);
		}

	});

	return DelegatedOrgApp;
});
