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
		dp = require('bower/bootstrap-datepicker/dist/js/bootstrap-datepicker'),
		moment = require('bower/momentjs/moment'),

		$ = require('jquery');

	var template = require('text!templates/platformadmin.html');

	var pclients = require('text!templates/partials/PlatformAdminClients.html');
	var papis = require('text!templates/partials/PlatformAdminAPIGKs.html');
	var porgs = require('text!templates/partials/PlatformAdminOrgs.html');
	var pstatistics = require('text!templates/partials/PlatformAdminStatistics.html');


	require('selectize');

	var PlatformAdminController = Pane.extend({
		"init": function(id, app) {

			var that = this;
			this.id = id;
			this.app = app;
			this.feideconnect = this.app.feideconnect;

			this.template = new TemplateEngine(template, this.app.dict);
			TemplateEngine.prototype.loadPartial("PlatformAdminClients", pclients);
			TemplateEngine.prototype.loadPartial("PlatformAdminAPIGKs", papis);
			TemplateEngine.prototype.loadPartial("PlatformAdminOrgs", porgs);
			TemplateEngine.prototype.loadPartial("PlatformAdminStatistics", pstatistics);

			this._super();

			this.setupRoute(/^\/statistics\/(\d{4}-\d{2}-\d{2})$/, "actStatistics");
			this.setupRoute(/^\/(clients|apigks|organizationsh|organizationss|statistics)$/, "actTab");
			this.activeTab = "#clients";

			this.orgPool = new OrganizationPool(this.feideconnect);

			this.selectedOrg = null;

			this.ebind("click", ".orgEntry", "actSelectOrgAdmin");
			this.ebind("click", ".clientEntry", "actClient");
			this.ebind("click", ".apigkEntry", "actAPIGK");

			this.ebind("change keyup", ".isearch", "actSearch");
			this.ebind("shown.bs.tab", "", "tabChanged");

			this.searchWaiter = new Waiter(function(x) {
				that.actSearch(x);
			});

		},

		"setStatisticsDate": function(moment) {
			this.statisticsDate = moment.format('YYYY-MM-DD');
			this.app.setHash('/_platformadmin/statistics/' + this.statisticsDate);

			return this.loadStatistics();
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
					var match = key.match(/^(.*)_(\d+)$/);
					var name = '';
					if (match) {
						var template = that.app.dict.getItem("stats_" + match[1]) || key;
						name = template.replace("NUM", match[2]);
					} else {
						name = that.app.dict.getItem("stats_" + key) || key;
					}
					stats.push({
						'name': name,
						'value': data[key]
					});
				}
				stats.sort(function(a, b) {
					var re = /^([^\d]+)(\d+)([^\d]*)$/;
					var m1 = a.name.match(re);
					var m2 = b.name.match(re);
					if (m1 && m2 && m1[1] === m2[1] && m1[3] === m2[3]) {
						return parseInt(m1[2]) - parseInt(m2[2]);
					}
					return a.name.localeCompare(b.name);
				});
				that.statistics = stats;
			});
			return promise;
		},

		"initLoad": function() {
			var that = this;
			if (!this.statisticsDate) {
				var date = moment();
				date.subtract(1, 'days');
				this.statisticsDate = date.format('YYYY-MM-DD');
			}
			return Promise.all([
					this.app.publicClientPool.onLoaded(),
					this.app.publicapis.onLoaded(),
					this.orgPool.onLoaded(),
					this.loadStatistics()
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

		"actMain": function() {
			this.app.setHash('/_platformadmin');
			this.app.appSelector.show();
		},

		"actStatistics": function(date) {
			this.statisticsDate = date;
			this.activeTab = '#statistics';
			this.app.appSelector.show();
		},

		"actTab": function(tab) {
			this.activeTab = '#' + tab;
			this.app.appSelector.show();
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
					return that.app.getApp('_');
				})
				.then(function(app) {

					app.clienteditor.edit(client);
					app.activate();
					that.app.appSelector.hide();

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
					return that.app.getApp('_');
				})
				.then(function(app) {

					app.apigkeditor.edit(apigk);
					app.activate();
					that.app.appSelector.hide();

				});


		},

		"tabChanged": function(e) {
			this.activeTab = e.target.hash;
			this.app.setHash('/_platformadmin/' + this.activeTab.substring(1));
		},

		"activate": function() {
			this.initLoad();
			this._super();

			this.app.bccontroller.hide();
		},

		"draw": function() {
			var that = this;
			var view = {
			};

			view.activeTabClass = {};
			view.activeTabClass[this.activeTab.substring(1)] = "active";

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
				"sps": view.orgs.services.orgs.length
			};
			view.statistics = this.statistics;
			view.statsDate = this.statisticsDate;

			// console.error("Platform admin view is ", view);
			this.el.children().detach();
			return this.template.render(this.el, view).then(function() {
				$('.date').datepicker({
					format: 'yyyy-mm-dd',
					autoclose: true
				}).on('changeDate', function(e) {
					that.setStatisticsDate(moment(e.date)).then(function() {that.draw();});
				});
			});
		},

		"getSelectorIcon": function() {
			return 'fa fa-asterisk';
		},

		"getTitle": function() {
			return "Platform admin"; // TODO translate!
		},

		"getID": function() {
			return this.id;
		}

	});

	return PlatformAdminController;

});
