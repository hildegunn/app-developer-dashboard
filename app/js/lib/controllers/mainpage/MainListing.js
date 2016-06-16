define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		ClientCreate = require('../createwidgets/ClientCreate'),
		APIGKCreate = require('../createwidgets/APIGKCreate'),
		EventEmitter = require('../../EventEmitter'),

		SimpleOrgAdminController = require('../orgadmin/SimpleOrgAdminController'),
		SimpleOrgAdminAPIAuth = require('../orgadmin/SimpleOrgAdminAPIAuth'),
		SimpleStatusController = require('../orgadmin/SimpleStatusController'),

		utils = require('../../utils'),
		$ = require('jquery')
		;

	var 
		template = require('text!templates/MainListing.html'),
		templateC = require('text!templates/MainListingClients.html'),
		templateA = require('text!templates/MainListingAPIGKs.html')
		;


	/*
	 * This controller controls 
	 */
	var MainListing = Pane.extend({
		"init": function(feideconnect, app, orgAdminClients, orgAdminAPIs, usercontext) {

			var that = this;
			this.feideconnect = feideconnect;
			this.app = app;
			this.orgAdminClients = orgAdminClients;
			this.orgAdminAPIs = orgAdminAPIs;
			this.usercontext = usercontext;

			this._super();

			this.dict = new Dictionary();

			dust.loadSource(dust.compile(template, "mainlisting"));
			dust.loadSource(dust.compile(templateC, "mainlistingC"));
			dust.loadSource(dust.compile(templateA, "mainlistingA"));

			this.elClients = $("<div></div>");
			this.elAPIGKs = $("<div></div>");

			this.templateLoaded = false;
			this.elClientsAttached = false;
			this.elAPIGKsAttached = false;

			this.simpleOrgAdminView = null;
			this.simpleOrgAdminAPI = null;
			this.orgAdminStatus = null;

			if (orgAdminClients !== null) {

				this.simpleOrgAdminView = new SimpleOrgAdminController(this.feideconnect, this.orgAdminClients, this.usercontext);
				this.simpleOrgAdminView.initLoad();

				this.simpleOrgAdminView.on("manageMandatory", function() {
					that.emit("manageMandatory");
				});

				this.orgAdminStatus = new SimpleStatusController(this.feideconnect, this.app.orgid, this.usercontext);
				this.orgAdminStatus.initLoad();

				this.orgAdminStatus.on("manageStatus", function() {
					that.emit("manageStatus");
				});

			}

			if (orgAdminAPIs !== null) {
				this.simpleOrgAdminAPI = new SimpleOrgAdminAPIAuth(this.feideconnect, this.orgAdminAPIs);
				this.simpleOrgAdminAPI.initLoad();

				this.simpleOrgAdminAPI.on("manageAPIAuth", function() {
					that.emit("manageAPIAuth");
				});

			}


			this.clientcreate = new ClientCreate(this.app);
			this.clientcreate.on("submit", function(obj) {
				that.emit("clientCreate", obj);
			});
			this.clientcreate.initLoad();

			this.apigkcreate = new APIGKCreate(this.feideconnect, this.app);
			this.apigkcreate.on("submit", function(obj) {
				that.emit("apigkCreate", obj);
			});
			this.apigkcreate.initLoad();

			this.el.on("click", ".registerNewClient", function() {
				that.clientcreate.activate();
			});
			this.el.on("click", ".registerNewAPIGK", function() {
				that.apigkcreate.activate();
			});


			this.ebind("click", ".clientEntry", "selectedClient");
			this.ebind("click", ".apigkEntry", "selectedAPIGK");


		},
		"selectedClient": function(e) {
			e.preventDefault(); // e.stopPropgate();
			var clientid = $(e.currentTarget).data('clientid');
			this.emit('clientSelected', clientid);
		},

		"selectedAPIGK": function(e) {
			e.preventDefault(); // e.stopPropgate();
			var apigkid = $(e.currentTarget).data('apigkid');
			this.emit('apigkSelected', apigkid);
		},

		"updateClients": function(clients) {

			var 
				that = this,
				key,
				clientlist = [],
				view;

			for (key in clients) {
				if (clients.hasOwnProperty(key)) {
					clientlist.push(clients[key].getView());
				}
			}

			clientlist.sort(function(a, b) {
				if (a.updated < b.updated) {
					return 1;
				}
				if (a.updated > b.updated) {
					return -1;
				}
				return 0;
			});

			view = {
				"clients": clientlist,
				"random": utils.guid(),
				"_config": that.feideconnect.getConfig(),
				"_": that.dict.get()
			};

			dust.render("mainlistingC", view, function(err, out) {
				that.elClients.empty().append(out);
				if (!that.elClientsAttached && that.templateLoaded) {
					that.el.find('#listingClients').append(that.elClients);
					that.elClientsAttached = true;
				}
			});


		},

		"updateAPIGKs": function(apigks) {

			var 
				that = this,
				key,
				apigklist = [],
				view;

			for (key in apigks) {
				if (apigks.hasOwnProperty(key)) {
					apigklist.push(apigks[key].getView());
				}
			}

			apigklist.sort(function(a, b) {
				if (a.updated < b.updated) {
					return 1;
				}
				if (a.updated > b.updated) {
					return -1;
				}
				return 0;
			});

			view = {
				"apigks": apigklist,
				"random": utils.guid(),
				"_config": that.feideconnect.getConfig(),
				"_": that.dict.get()
			};

			dust.render("mainlistingA", view, function(err, out) {
				that.elAPIGKs.empty().append(out);
				if (!that.elAPIGKsAttached && that.templateLoaded) {
					that.el.find('#listingAPIGKs').append(that.elAPIGKs);
					that.elAPIGKsAttached = true;
				}
			});
		},

		"initLoad": function() {

			this.draw(true)
				.then(this.proxy("_initLoaded"));
				
		},

		
		"draw": function(act) {
			var that = this;

			return new Promise(function(resolve, reject) {

				var view = {
					"_": that.dict.get(),
					"personal": that.app.isPersonal(),
					"simpleOrgAdminStatus": (that.simpleOrgAdminView !== null),
					"simpleOrgAdminAPI": (that.simpleOrgAdminAPI !== null),
					"orgAdminStatus": (that.orgAdminStatus !== null)
				};
				dust.render("mainlisting", view, function(err, out) {

					that.el.children().detach();
					that.el.append(out);
					that.el.find('#listingClients').append(that.elClients);
					that.el.find('#listingAPIGKs').append(that.elAPIGKs);

					if (that.simpleOrgAdminView !== null) {
						that.el.find(".simpleOrgAdminView").show().append(that.simpleOrgAdminView.el);
					}
					if  (that.simpleOrgAdminAPI !== null) {
						that.el.find(".simpleOrgAdminAPI").show().append(that.simpleOrgAdminAPI.el);
					}
					if  (that.orgAdminStatus !== null) {
						that.el.find(".simpleOrgAdminStatus").show().append(that.orgAdminStatus.el);
					}

					that.elClientsAttached = true;
					that.elAPIGKsAttached = true;
					that.templateLoaded = true;

				});
		
				if (act) {
					that.activate();
				}

			});

		}
	}).extend(EventEmitter);

	return MainListing;

});
