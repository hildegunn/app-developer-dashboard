define(function(require, exports, module) {
	"use strict";	

	var 
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		ClientCreate = require('../createwidgets/ClientCreate'),
		APIGKCreate = require('../createwidgets/APIGKCreate'),
		EventEmitter = require('../../EventEmitter'),

		SimpleOrgAdminController = require('../orgadmin/SimpleOrgAdminController'),
		SimpleOrgAdminAPIAuth = require('../orgadmin/SimpleOrgAdminAPIAuth'),
		SimpleStatusController = require('../orgadmin/SimpleStatusController'),

		Entity = require('../../models/Entity'),
		utils = require('../../utils'),
		$ = require('jquery')
		;

	var 
		template = require('text!templates/MainListing.html'),
		templateClients = require('text!templates/MainListingClients.html'),
		templateAPIGKs = require('text!templates/MainListingAPIGKs.html')
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
			this.template = new TemplateEngine(template, this.dict, true);
			this.templateClients = new TemplateEngine(templateClients, this.dict, true);
			this.templateAPIGKs = new TemplateEngine(templateAPIGKs, this.dict, true);

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

				this.orgAdminStatus = new SimpleStatusController(this.feideconnect, this.app.getID(), this.usercontext);
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

			clientlist.sort(Entity.sortAge);

			view = {
				"clients": clientlist,
				"random": utils.guid()
			};

			this.templateClients.render(this.elClients, view).then(function() {
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

			apigklist.sort(Entity.sortAge);

			view = {
				"apigks": apigklist,
				"random": utils.guid()
			};

			this.templateAPIGKs.render(this.elAPIGKs, view).then(function() {
				if (!that.elAPIGKsAttached && that.templateLoaded) {
					that.el.find('#listingAPIGKs').append(that.elAPIGKs);
					that.elAPIGKsAttached = true;
				}
			});
		},

		"initLoad": function() {

			this.draw(false)
				.then(this.proxy("_initLoaded"));
				
		},

		
		"draw": function(act) {
			var that = this;

			return new Promise(function(resolve, reject) {

				var view = {
					"personal": that.app.isPersonal(),
					"simpleOrgAdminStatus": (that.simpleOrgAdminView !== null),
					"simpleOrgAdminAPI": (that.simpleOrgAdminAPI !== null),
					"orgAdminStatus": (that.orgAdminStatus !== null)
				};
				that.template.render(that.el, view).then(function() {
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
