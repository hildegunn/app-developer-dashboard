define(function(require, exports, module) {

	"use strict";

	var
		BaseApp = require('./BaseApp'),

		ClientPool = require('./models/ClientPool'),
		PersonalMain = require('./controllers/mainpage/PersonalMain');

	var PersonalApp = BaseApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis) {
			this.clientpool = new ClientPool(feideconnect, null);

			this._super(feideconnect, app, usercontext, publicClientPool, publicapis);
			this.mainpage = new PersonalMain(this.mainlisting);
			this.pc.add(this.mainpage);

		},

		"getClientRequests": function() {
			return this.feideconnect.apigkClientRequests();
		},

		"getSelectorIcon": function() {
			return 'fa fa-user';
		},

		"getOrgInfo": function() {
			return null;
		},

		"getID": function() {
			return '_';
		},

		"getTitle": function() {
			return this.dict.get().personal;
		}

	});

	return PersonalApp;
});
