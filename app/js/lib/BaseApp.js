define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./controllers/Pane'),
		ClientEditor = require('./controllers/editpage/ClientEditor'),
		APIGKEditor = require('./controllers/editpage/APIGKEditor'),
		MainListing = require('./controllers/mainpage/MainListing'),

		Client = require('./models/Client'),
		APIGK = require('./models/APIGK'),
		PaneController = require('./controllers/PaneController'),
		Dictionary = require('./Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		utils = require('./utils'),
		$ = require('jquery');


	var BaseApp = Pane.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis) {
			var that = this;

			this.publicClientPool = publicClientPool;
			this.publicapis = publicapis;
			this.feideconnect = feideconnect;
			this.app = app;
			this.usercontext = usercontext;

			this.dict = new Dictionary();

			this._super();

			this.setupRoute(/^\/?$/, "actMain");
			this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "editClient");
			this.setupRoute(/^\/apigk\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "editAPIGK");

			this.pc = new PaneController(this.el);

			this.mainlisting = new MainListing(this.feideconnect, this, this.orgAdminClients, this.orgAdminAPIs, this.usercontext);
			this.pc.add(this.mainlisting);

			this.clientpool.on('clientChange', function(clients) {
				that.mainlisting.updateClients(clients);
			});

			this.clientpool.on('apigkChange', function(apigks) {
				that.mainlisting.updateAPIGKs(apigks);
			});
			that.clientpool.initLoad();

			this.mainlisting.initLoad();

			this.mainlisting.on("clientCreate", function(obj) {
				that.feideconnect.clientsRegister(obj)
					.then(function(data) {
						var client = new Client(data);

						that.clientpool.setClient(client);

						that.clienteditor.edit(client, 'tabBasic');

						that.activate();
						that.app.appSelector.hide();
						that.app.setHash('/' + that.getID() + '/clients/' + client.id + '/edit/tabBasic');
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
						that.app.appSelector.hide();
						that.app.setHash('/' + that.getID() + '/apigk/' + apigk.id + '/edit/tabBasic');

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
				that.app.appSelector.show();
				that.app.setHash('/' + that.getID());
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
				that.app.appSelector.show();
				that.app.setHash('/' + that.getID());

				// When deleting a API GK, reload the list of available 3rd party APIs.
				that.app.publicapis.load();
			});


			this.mainlisting.on('clientSelected', function(clientid) {

				try {
					var client = that.clientpool.getClient(clientid);
					that.clienteditor.edit(client, 'tabOverview');
					that.app.appSelector.hide();
					that.app.setHash('/' + that.getID() + '/clients/' + clientid + '/edit/tabOverview');

				} catch (err) {
					console.error("ERROR", err);
					that.app.setErrorMessage(that.dict.get().error_opening_client, "danger", err);
				}
			});
			this.mainlisting.on('apigkSelected', function(apigkid) {

				try {
					var apigk = that.clientpool.getAPIGK(apigkid);
					that.apigkeditor.edit(apigk, 'tabBasic');
					that.app.appSelector.hide();
					that.app.setHash('/' + that.getID() + '/apigk/' + apigkid + '/edit/tabBasic');
				} catch (err) {
					that.app.setErrorMessage(that.dict.get().error_opening_apigk, "danger", err);
				}
			});

			this.initLoad();

		},

		"initLoad": function() {
			this._initLoaded();
		},

		"getBCItem": function() {
			var title = this.dict.getItem('mainoverviewpersonal');
			var groupname = 'na';
			if (this.org) {
				title = this.dict.getItem('mainoverview') + ' ' + this.org.name;
			}
			var item = {
				"href": "#!/" + this.getID(),
				"title": title,
				"active": false
			};
			return item;
		},

		"editClient": function(clientid, tabid) {
			this.app.appSelector.hide();
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
			this.app.appSelector.hide();
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
			this.app.setHash('/' + this.getID());
			this.app.bccontroller.hide();
			this.mainlisting.activate();
			this.app.appSelector.show();
		},

		"getSelectorIcon": function() {
			return 'fa fa-circle-o';
		}

	});

	return BaseApp;
});
