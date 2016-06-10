define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./Pane'),

		Client = require('../models/Client'),
		APIGK = require('../models/APIGK'),

		OrganizationPool = require('../models/OrganizationPool'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		$ = require('jquery');

	var template = require('text!templates/platformadmin.html');

	var pclients = require('text!templates/partials/PClients.html');
	var papis = require('text!templates/partials/PAPIs.html');
	var porgs = require('text!templates/partials/POrgs.html');


	require('selectize');


	var sf = function(a, b) {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		return 0;
	};

	var PlatformAdminController = Pane.extend({
		"init": function(app) {

			this.app = app;
			this.feideconnect = this.app.feideconnect;

			this.template = new TemplateEngine(template, this.app.dict);
			this.template.loadPartial("pclients", pclients);
			this.template.loadPartial("papis", papis);
			this.template.loadPartial("porgs", porgs);

			this._super();

			this.orgPool = new OrganizationPool(this.feideconnect);

			this.selectedOrg = null;

			this.ebind("click", ".orgEntry", "actSelectOrgAdmin");
			this.ebind("click", ".clientEntry", "actClient");
			this.ebind("click", ".apigkEntry", "actAPIGK");

		},


		"initLoad": function() {
			var that = this;
			return Promise.all([
					this.app.publicClientPool.onLoaded(),
					this.app.publicapis.onLoaded(),
					this.orgPool.onLoaded()
				])
				.then(that.proxy("draw"))
				.then(that.proxy("_initLoaded"))
				.then(function() {
					console.log("Loaded Platformadmin. Should only be the case if it is selected...");
				})
				.catch(function(err) {
					console.error("Error loading PlatformADminController ", err);
				});
		},



		"actSelectOrgAdmin": function(e) {
			e.preventDefault();
			e.stopPropagation();

			var orgid = $(e.currentTarget).data('orgid');

			this.app.addOrgAdmin(orgid);
			// console.error("act admin", orgid);

		},

		"actClient": function(e) {
			e.preventDefault();
			e.stopPropagation();
			var that = this;
			var clientid = $(e.currentTarget).data('clientid');
			// console.error("Opening client ", client.getView());


			var client;

			this.feideconnect.getClient(clientid)
				.then(function(data) {
					client = new Client(data);
					console.error("CLIENT IS ", client.getView());
					return that.app.getOrgApp('_');
				})
				.then(function(app) {

					app.clienteditor.edit(client);
					app.activate();
					that.app.orgRoleSelector.hide();

				});

		},

		"actAPIGK": function(e) {
			e.preventDefault();
			e.stopPropagation();
			var that = this;
			var apigkid = $(e.currentTarget).data('apigkid');

			var apigk;

			this.feideconnect.getAPIGK(apigkid)
				.then(function(data) {
					apigk = new APIGK(data);
					console.error("APIGK IS ", apigk.getView());
					return that.app.getOrgApp('_');
				})
				.then(function(app) {

					app.apigkeditor.edit(apigk);
					app.activate();
					that.app.orgRoleSelector.hide();

				});


		},

		"activate": function() {
			this.initLoad();
			this._super();

			this.app.setHash('/_platformadmin');
			this.app.bccontroller.hide();
		},

		"draw": function() {
			var view = {
				"_": this.app.dict.get(),
				"_config": this.feideconnect.getConfig()
			};

			var user = this.feideconnect.getUser();
			var _config = this.feideconnect.getConfig();
			user.profile = _config.apis.core + '/userinfo/v1/user/media/' + user.profilephoto;

			view.userinfo = user;

			view.orgs = {
				"home": {
					"orgs": this.orgPool.getView({"type": "home_organization", "service": "avtale"})
				},
				"services": {
					"orgs": this.orgPool.getView({"type": "service_provider"})	
				}
			};
			view.clients = this.app.publicClientPool.getView();
			view.apigks = this.app.publicapis.getView();
			view.counts = {
				"clients": view.clients.length,
				"apigks": view.apigks.length,
				"orgs": view.orgs.home.orgs.length
			};
			// view.orgs = this.orgPool.getView();

			// console.error("Platform admin view is ", view);
			this.el.children().detach();
			return this.template.render(this.el, view);
		}

	});

	return PlatformAdminController;

});