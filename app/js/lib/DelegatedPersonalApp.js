define(function(require, exports, module) {

	"use strict";

	var
		BaseApp = require('./BaseApp'),
		DelegatedMain = require('./controllers/mainpage/DelegatedMain');

	var DelegatedOrgApp = BaseApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, owner, clientPool) {
			this.owner = owner;

			this.clientpool = clientPool;
			this._super(feideconnect, app, usercontext, publicClientPool, publicapis);
			this.mainpage = new DelegatedMain(this.mainlisting);
			this.pc.add(this.mainpage);
		},

		"getSelectorIcon": function() {
			return 'fa fa-user';
		},

		"getOrgInfo": function() {
			return null;
		},

		"getID": function() {
			return this.owner.id;
		},

		"getTitle": function() {
			return this.owner.name;
		}
	});

	return DelegatedOrgApp;
});
