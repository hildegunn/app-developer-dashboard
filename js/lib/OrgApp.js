
define(function (require, exports, module) {

	"use strict";

	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		Pane = require('./controllers/Pane'),
		ClientEditor = require('./controllers/editpage/ClientEditor'),
		APIGKEditor = require('./controllers/editpage/APIGKEditor'),
		MainListing = require('./controllers/mainpage/MainListing'),

		ClientPool = require('./models/ClientPool'),
		Client = require('./models/Client'),
		APIGK = require('./models/APIGK'),
		PaneController = require('./controllers/PaneController'),
		Dictionary = require('./Dictionary'),
		TemplateEngine = require('./TemplateEngine'),
		utils  = require('./utils'),
		rawconfig = require('text!../../etc/config.js'),
		$ = require('jquery');


	/**
	 * Here is what happens when the page loads:
	 *
	 * Check for existing authentication.
	 * When authenticated setup clientpool.
	 * After that, check routing...
	 * Load frontpage
	 * 
	 * 
	 */

	var OrgApp = Pane.extend({
		
		"init": function(feideconnect, app, publicapis, orgid) {
			var that = this;

			this.publicapis = publicapis;
			this.feideconnect = feideconnect;
			this.app = app;
			this.orgid = orgid;

			this._super();

			this.pc = new PaneController(this.el);
			this.mainlisting = new MainListing(this.feideconnect, this);
			this.pc.add(this.mainlisting);

			this.mainlisting.initLoad();


			var orgid2 = (orgid === '_' ? null : orgid);

			this.clientpool = new ClientPool(this.feideconnect, orgid2);
			this.clientpool.on('clientChange', function(clients) {
				that.mainlisting.updateClients(clients);
			});

			this.clientpool.on('apigkChange', function(apigks) {
				that.mainlisting.updateAPIGKs(apigks);
			});
			that.clientpool.initLoad();








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
						that.app.setErrorMessage("Successfully created new client", "success");
					})
					.catch(function(err) {
						that.app.setErrorMessage("Error creating new client", "danger", err);
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
					})
					.then(function() {
						that.app.setErrorMessage("Successfully created new API Gatekeeper", "success");
					})
					.catch(function(err) {
						that.app.setErrorMessage("Error creating new API Gatekeeper", "danger", err);
					});
			});




			this.clienteditor = new ClientEditor(this, this.feideconnect, this.publicapis);
			this.pc.add(this.clienteditor);
			this.clienteditor.on("saved", function(client) {
				// console.log("Client is saved, updatge client pool and mainlisting");
				that.clientpool.setClient(client);
			});
			this.clienteditor.on("deleted", function(id) {
				// console.log("Client is removed, update client pool and mainlisting");
				that.clientpool.removeClient(id);
				that.mainlisting.activate();
				that.app.orgRoleSelector.show();
				that.app.setHash('/' + that.orgid);
			});


			


			this.apigkeditor = new APIGKEditor(this, this.feideconnect);
			this.pc.add(this.apigkeditor);
			this.apigkeditor.on("saved", function(apigk) {
				// console.log("APIGK is saved, updatge client pool and mainlisting");
				that.clientpool.setAPIGK(apigk);
			});
			this.apigkeditor.on("deleted", function(id) {
				// console.log("APIGK is removed, update client pool and mainlisting");
				that.clientpool.removeAPIGK(id);
				that.mainlisting.activate();
				that.app.orgRoleSelector.show();
				that.app.setHash('/' + that.orgid);
			});


			this.mainlisting.on('clientSelected', function(clientid) {
				var client = that.clientpool.getClient(clientid);
				that.clienteditor.edit(client, 'tabBasic');
				that.app.orgRoleSelector.hide();
				that.app.setHash('/' + that.orgid + '/clients/' + clientid + '/edit/tabBasic');
			});
			this.mainlisting.on('apigkSelected', function(apigkid) {
				var apigk = that.clientpool.getAPIGK(apigkid);
				that.apigkeditor.edit(apigk, 'tabBasic');
				that.app.orgRoleSelector.hide();
				that.app.setHash('/' + that.orgid + '/apigk/' + apigkid + '/edit/tabBasic');
			});


			this.initLoad();	

		},

		"initLoad": function() {

			return this.draw()
				.then(this.proxy("_initLoaded"));
				
		},

		"editClient": function(clientid, tabid) {

			var that = this;
			this.clientpool.onLoaded()
				.then(function() {
					var client = that.clientpool.getClient(clientid);
					// console.error("About to edit ", clientid, "on tab ", tabid, client);
					that.clienteditor.edit(client, tabid);
				});
		},

		"editAPIGK": function(apigkid, tabid) {

			var that = this;
			this.clientpool.onLoaded()
				.then(function() {
					var apigk = that.clientpool.getAPIGK(apigkid);
					// console.error("About to edit ", apigkid, "on tab ", tabid, apigk);
					that.apigkeditor.edit(apigk, tabid);
				});
		},

		"actMainlisting": function() {
			this.app.setHash('/' + this.orgid);
			this.mainlisting.activate();
		},


		"getOrgInfo": function() {
			// console.error("Looking up getOrgInfo for " + this.orgid);
			return this.app.orgRoleSelector.getOrgInfo(this.orgid);

		},

		"getClientRequests": function() {

			if (this.orgid === "_") {
				return this.feideconnect.apigkClientRequests();
			}
			return this.feideconnect.apigkClientRequestsByOrg(this.orgid);
		},



		/**
		 * A draw function that draws the header and footer template.
		 * Supports promises
		 * @return {[type]} [description]
		 */
		"draw": function() {
			var that = this;

			return new Promise(function(resolve) {
				// that.el.append('<div> This is the pane of orgapp ' + that.orgid);
				resolve();
			});


		},




	});


	return OrgApp;
});
