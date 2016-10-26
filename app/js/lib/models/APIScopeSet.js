define(function(require, exports, module) {
	"use strict";


	var
	// $ = require('jquery'),
		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),
		Client = require('./Client'),
		Scope = require('./Scope');


	var APIScopeSet = Controller.extend({
		"init": function(feideconnect, orgAdminAPIclients, publicapis) {
			var that = this;
			this.clients = null;
			this.feideconnect = feideconnect;
			this.orgAdminAPIclients = orgAdminAPIclients;
			this.publicapis = publicapis;
			this._super(undefined, true);
		},

		"initLoad": function() {
			var that = this;
			return Promise.all([
					this.orgAdminAPIclients.onLoaded(),
					this.publicapis.onLoaded()
				])
				.then(this.proxy("process"))
				.then(this.proxy("_initLoaded")).catch(function(err) {
					console.error("Error loading object", err, that);
				});
		},

		"getClients": function() {
			return this.clients;
		},

		"updateOrgAdminAPIclients": function(orgAdminAPIclients) {
			this.orgAdminAPIclients = orgAdminAPIclients;
			this.process();
		},

		"getClientView": function() {
			var clientview = [];
			if (this.clients === null) {
				throw new Error("Clients not yet loaded.");
			}
			for (var i = 0; i < this.clients.length; i++) {
				var c = this.clients[i];
				// console.error("Client", c)
				var vco = {};

				vco.client = c.client.getView();
				vco.apis = [];



				for (var key in c.apis) {
					if (c.apis[key].api === null) {
						console.error("Unable to get information about a requested API because it is not public or accessible.",key);
							// JSON.stringify(c.apis[key], undefined, 2));
						continue;
					}

					vco.apis.push(c.apis[key].api.getOrgAdminView(c.apis[key].scopes));
				}

				clientview.push(vco);
			}
			return clientview;
		},

		"process": function() {

			this.clients = [];

			for (var i = 0; i < this.orgAdminAPIclients.clients.length; i++) {

				var cliententry = {};
				cliententry.client = this.orgAdminAPIclients.clients[i];

				var aset = this.orgAdminAPIclients.clients[i].scopeauthorizations;
				var apis = {};

				for (var scopetext in aset) {

					var scope = new Scope({
						"scope": scopetext
					});
					if (scope.apigk) {
						if (!apis[scope.apigk]) {
							apis[scope.apigk] = {
								"scopes": []
							};
							apis[scope.apigk].api = this.publicapis.getAPIGK(scope.apigk);
						}
						apis[scope.apigk].scopes.push({
							"scope": scope,
							"authorized": aset[scopetext]
						});
					}
				}
				cliententry.apis = apis;
				this.clients.push(cliententry);

				// console.error("Processing client " + this.orgAdminAPIclients.clients[i].name, apis);
			}

		}



	}).extend(EventEmitter);

	return APIScopeSet;



});
