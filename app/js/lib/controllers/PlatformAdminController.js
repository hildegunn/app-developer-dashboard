define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./Pane'),

		Client = require('../models/Client'),
		APIGK = require('../models/APIGK'),
		Organization = require('../models/Organization'),

		OrganizationPool = require('../models/OrganizationPool'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		Waiter = require('../Waiter'),

		$ = require('jquery');

	var template = require('text!templates/platformadmin.html');

	var pclients = require('text!templates/partials/PClients.html');
	var papis = require('text!templates/partials/PAPIs.html');
	var porgs = require('text!templates/partials/POrgs.html');
	var pstatistics = require('text!templates/partials/PStatistics.html');


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

			var that = this;

			this.app = app;
			this.feideconnect = this.app.feideconnect;

			this.template = new TemplateEngine(template, this.app.dict);
			this.template.loadPartial("pclients", pclients);
			this.template.loadPartial("papis", papis);
			this.template.loadPartial("porgs", porgs);
			this.template.loadPartial("pstatistics", pstatistics);

			this._super();

			this.orgPool = new OrganizationPool(this.feideconnect);
			var date = new Date();
			date.setDate(date.getDate() - 1);
			this.statisticsDate = date.toISOString().substring(0, 10);
			this.statsPromise = this.loadStatistics();

			this.selectedOrg = null;

			this.ebind("click", ".orgEntry", "actSelectOrgAdmin");
			this.ebind("click", ".clientEntry", "actClient");
			this.ebind("click", ".apigkEntry", "actAPIGK");

			this.ebind("change keyup", ".isearch", "actSearch");

			this.searchWaiter = new Waiter(function(x) {
				that.actSearch(x);
			});

		},

		"loadStatistics": function() {
			console.log('loading statistics');
			var that = this;
			var _config = this.feideconnect.getConfig();
			var url = _config.apis.core + '/statistics/' + this.statisticsDate + '/';
			var promise = that.feideconnect.jso.ajax({
				url: url
			});
			promise.then(function(data) {
				var stats = [];
				for(var key in data) {
					stats.push({
						'name': key,
						'value': data[key]
					});
				}
				that.statistics = stats;
			});
			return promise;
		},

		"initLoad": function() {
			var that = this;
			return Promise.all([
					this.app.publicClientPool.onLoaded(),
					this.app.publicapis.onLoaded(),
					this.orgPool.onLoaded(),
					this.statsPromise
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


		"pingSearch": function(e) {
			this.searchWaiter.ping(e);
		},

		"actSearch": function(e) {

			var c = $(e.currentTarget).closest(".tab-pane");
			var term = $(e.currentTarget).val();
			console.log("Search for ", term, c);

			c.find(".list-group-item").each(function(i,item) {
				if (term === '' || $(item).data("searchable").toLowerCase().indexOf(term.toLowerCase()) > -1 ) {
					$(item).show();
				} else {
					$(item).hide();
				}
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
					"orgs": this.orgPool.getView({"type": "home_organization"})
				},
				"services": {
					"orgs": this.orgPool.getView({"type": "service_provider"})	
				}
			};

			view.orgs.home.orgs.sort(Organization.sortScore);
			view.orgs.services.orgs.sort(Organization.sortScore);

			view.clients = this.app.publicClientPool.getView();
			view.apigks = this.app.publicapis.getView();
			view.counts = {
				"clients": view.clients.length,
				"apigks": view.apigks.length,
				"orgs": view.orgs.home.orgs.length,
				"sps": view.orgs.services.orgs.length,
			};
			view.statistics = this.statistics;
			// view.orgs = this.orgPool.getView();

			// console.error("Platform admin view is ", view);
			this.el.children().detach();
			return this.template.render(this.el, view);
		}

	});

	return PlatformAdminController;

});