define(function(require, exports, module) {

	"use strict";

	var
		BaseApp = require('./BaseApp'),

		ClientPool = require('./models/ClientPool'),
		$ = require('jquery');

	var PersonalApp = BaseApp.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis) {
			var that = this;

			this.clientpool = new ClientPool(feideconnect, null);

			this.orgAdminClients = null;
			this.orgAdminAPIs = null;
			this._super(feideconnect, app, usercontext, publicClientPool, publicapis);
		},

		"isPersonal": function() {
			return true;
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
