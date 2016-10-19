define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./controllers/Pane'),
		ClientEditor = require('./controllers/editpage/ClientEditor'),
		APIGKEditor = require('./controllers/editpage/APIGKEditor'),
		MainListing = require('./controllers/mainpage/MainListing'),

		OrgAdminPane = require('./controllers/orgadmin/OrgAdminPane'),
		OrgAdminAPIAuthorizationPane = require('./controllers/orgadmin/OrgAdminAPIAuthorizationPane'),
		SimpleStatusController = require('./controllers/orgadmin/SimpleStatusController'),
		OrgAdminClients = require('./models/OrgAdminClients'),
		OrgAdminAPIs = require('./models/OrgAdminAPIs'),

		ClientPool = require('./models/ClientPool'),
		Client = require('./models/Client'),
		APIGK = require('./models/APIGK'),
		PaneController = require('./controllers/PaneController'),
		Dictionary = require('./Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		utils = require('./utils'),
		$ = require('jquery');


	var OrgApp = Pane.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, role) {
			var that = this;

			this.publicClientPool = publicClientPool;
			this.publicapis = publicapis;
			this.feideconnect = feideconnect;
			this.app = app;
			this.usercontext = usercontext;
			this.role = role;

			this.dict = new Dictionary();

			this._super();


			this.orgid = this.role.getID();
			var orgid2 = (this.role.getID() === '_' ? null : this.role.getID());

			this.clientpool = new ClientPool(this.feideconnect, orgid2);


			this.orgAdminClients = null;
			this.orgAdminView = null;
			this.orgAdminAPIs = null;
			this.orgAdminAPIAuthorization = null;

			if (this.role.isOrgType("home_organization")) {

				this.orgAdminClients = new OrgAdminClients(this.feideconnect, orgid2);
				this.orgAdminClients.initLoad();

				this.orgAdminView = new OrgAdminPane(this.feideconnect, this, this.publicClientPool, this.orgAdminClients);
				this.orgAdminView.initLoad();

				this.orgAdminAPIs = new OrgAdminAPIs(this.feideconnect, orgid2);
				this.orgAdminAPIs.initLoad();

				this.orgAdminAPIAuthorization = new OrgAdminAPIAuthorizationPane(this.feideconnect, this, this.orgAdminAPIs, this.publicapis);
				this.orgAdminAPIAuthorization.initLoad();

			}

			this.pc = new PaneController(this.el);
			this.mainlisting = new MainListing(this.feideconnect, this, this.orgAdminClients, this.orgAdminAPIs, this.usercontext);
			this.pc.add(this.mainlisting);

			if (this.orgAdminView !== null) {
				this.pc.add(this.orgAdminView);
			}
			if (this.orgAdminAPIAuthorization !== null) {
				this.pc.add(this.orgAdminAPIAuthorization);
			}



			this.clientpool.on('clientChange', function(clients) {
				that.mainlisting.updateClients(clients);
			});

			this.clientpool.on('apigkChange', function(apigks) {
				that.mainlisting.updateAPIGKs(apigks);
			});
			that.clientpool.initLoad();



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

			this.mainlisting.initLoad();



			this.mainlisting.on("clientCreate", function(obj) {
				that.feideconnect.clientsRegister(obj)
					.then(function(data) {
						var client = new Client(data);

						that.clientpool.setClient(client);

						that.clienteditor.edit(client, 'tabBasic');

						that.activate();
						that.app.orgRoleSelector.hide();
						that.app.setHash('/' + that.orgid + '/clients/' + client.id + '/edit/tabBasic');
					})
					.then(function() {
						that.app.setErrorMessage(that.dict.get().successfully_created_new_client, "success");
					})
					.catch(function(err) {
						that.app.setErrorMessage(that.dict.get().error_creating_new_client, "danger", err);
					});
			});

			this.mainlisting.on("apigkCreate", function(obj) {
				that.feideconnect.apigkRegister(obj)
					.then(function(data) {
						var apigk = new APIGK(data);
						that.clientpool.setAPIGK(apigk);

						that.apigkeditor.edit(apigk, 'tabBasic');
						that.activate();
						that.app.orgRoleSelector.hide();
						that.app.setHash('/' + that.orgid + '/apigk/' + apigk.id + '/edit/tabBasic');

						// When creating a new API GK, reload the list of available 3rd party APIs.
						that.app.publicapis.load();
					})
					.then(function() {
						that.app.setErrorMessage(that.dict.get().successfully_created_new_api_gatekeeper, "success");
					})
					.catch(function(err) {
						that.app.setErrorMessage(that.dict.get().error_creating_new_api_gatekeeper, "danger", err);
					});
			});


			this.clienteditor = new ClientEditor(this, this.feideconnect, this.publicapis, this.clientpool, this.usercontext);
			this.pc.add(this.clienteditor);
			this.clienteditor.on("saved", function(client) {
				// console.log("Client is saved, update client pool and mainlisting");
				that.clientpool.setClient(client);
				that.publicClientPool.load();
			});
			this.clienteditor.on("deleted", function(id) {
				// console.log("Client is removed, update client pool and mainlisting");
				that.clientpool.removeClient(id);
				that.mainlisting.activate();
				that.app.orgRoleSelector.show();
				that.app.setHash('/' + that.orgid);
			});



			this.apigkeditor = new APIGKEditor(this, this.feideconnect, this.usercontext);
			this.pc.add(this.apigkeditor);
			this.apigkeditor.on("saved", function(apigk) {
				// console.log("APIGK is saved, updatge client pool and mainlisting");
				that.clientpool.setAPIGK(apigk);

				// When saving changes to a new API GK, reload the list of available 3rd party APIs.
				that.app.publicapis.load();
			});
			this.apigkeditor.on("deleted", function(id) {
				// console.log("APIGK is removed, update apigk pool and mainlisting");
				that.clientpool.removeAPIGK(id);
				that.mainlisting.activate();
				that.app.orgRoleSelector.show();
				that.app.setHash('/' + that.orgid);

				// When deleting a API GK, reload the list of available 3rd party APIs.
				that.app.publicapis.load();
			});


			this.mainlisting.on('clientSelected', function(clientid) {

				try {
					var client = that.clientpool.getClient(clientid);
					that.clienteditor.edit(client, 'tabOverview');
					that.app.orgRoleSelector.hide();
					that.app.setHash('/' + that.orgid + '/clients/' + clientid + '/edit/tabOverview');

				} catch (err) {
					console.error("ERROR", err);
					that.app.setErrorMessage(that.dict.get().error_opening_client, "danger", err);
				}
			});
			this.mainlisting.on('apigkSelected', function(apigkid) {

				try {
					var apigk = that.clientpool.getAPIGK(apigkid);
					that.apigkeditor.edit(apigk, 'tabBasic');
					that.app.orgRoleSelector.hide();
					that.app.setHash('/' + that.orgid + '/apigk/' + apigkid + '/edit/tabBasic');
				} catch (err) {
					that.app.setErrorMessage(that.dict.get().error_opening_apigk, "danger", err);
				}
			});

			this.initLoad();

		},

		"initLoad": function() {
			this._initLoaded();
		},

		"isPersonal": function() {
			return (this.orgid === '_');
		},

		"getBCItem": function() {
			var title = this.dict.getItem('mainoverviewpersonal');
			var groupname = 'na';
			if (this.orgid !== '_') {
				if (this.role && this.role.group && this.role.group.orgName ) {
					groupname = this.role.group.orgName;
				}
				title = this.dict.getItem('mainoverview') + ' ' + groupname;
			}
			var item = {
				"href": "#!/" + this.orgid,
				"title": title,
				"active": false
			};
			return item;
		},

		"editClient": function(clientid, tabid) {

			var that = this;
			this.clientpool.onLoaded()
				.then(function() {
					var client = that.clientpool.getClient(clientid);

					if (client === null) {
						return that.feideconnect.getClient(clientid)
							.then(function(data) {
								return new Client(data);
							});
					}

					return client;

				})
				.then(function(client) {
					// console.error("About to edit ", clientid, "on tab ", tabid, client);
					that.clienteditor.edit(client, tabid);
				});
		},

		"editAPIGK": function(apigkid, tabid) {

			var that = this;
			this.clientpool.onLoaded()
				.then(function() {
					var apigk = that.clientpool.getAPIGK(apigkid);


					if (apigk === null) {
						return that.feideconnect.getAPIGK(apigkid)
							.then(function(data) {
								return new APIGK(data);
							});
					}
					return apigk;
				})
				.then(function(apigk) {
					// console.error("About to edit ", apigkid, "on tab ", tabid, apigk);
					return that.apigkeditor.edit(apigk, tabid);
				});
		},

		"actMain": function() {
			this.app.setHash('/' + this.orgid);
			this.app.bccontroller.hide();
			this.mainlisting.activate();
		},

		"actMandatory": function() {
			this.app.setHash('/' + this.orgid + '/mandatory');
			this.orgAdminView.activate();
			this.app.orgRoleSelector.hide();
		},

		"actAPIAuth": function() {
			this.app.setHash('/' + this.orgid + '/apiauthorization');
			this.orgAdminAPIAuthorization.activate();
			this.app.orgRoleSelector.hide();
		},

		"getOrgInfo": function() {
			// console.error("Looking up getOrgInfo for " + this.orgid); //, this.app.orgRoleSelector.getOrgInfo(this.orgid));
			return this.usercontext.getOrgInfo(this.orgid);

		},

		"getClientRequests": function() {

			if (this.orgid === "_") {
				return this.feideconnect.apigkClientRequests();
			}
			return this.feideconnect.apigkClientRequestsByOrg(this.orgid);
		}

	});

	return OrgApp;
});
