define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		// ClientCreate = require('../createwidgets/ClientCreate'),
		// APIGKCreate = require('../createwidgets/APIGKCreate'),
		EventEmitter = require('../../EventEmitter'),
		// OrgRoleSelector = require('./OrgRoleSelector'),
		TemplateEngine = require('./TemplateEngine'),
		utils = require('../../utils'),
		$ = require('jquery')
		;

	var 
		template = require('text!templates/OrgAdminPane.html')
		;

	/*
	 * This controller controls 
	 */
	var OrgAdminPane = Pane.extend({
		"init": function(feideconnect) {

			var that = this;
			this.feideconnect = feideconnect;

			this._super();

			this.dict = new Dictionary();

			// this.ebind("click", ".clientEntry", "selectedClient");
			// this.ebind("click", ".apigkEntry", "selectedAPIGK");

		},

		"initLoad": function() {

			this.orgRoleSelector.onLoaded()
				.then(this.proxy("draw", true))
				.then(this.proxy("_initLoaded"));
				
		},

		
		"draw": function(act) {
			var that = this;

			return new Promise(function(resolve, reject) {

				var view = {
					"_": that.dict.get(),
					"showHeader": false
				};
				dust.render("mainlisting", view, function(err, out) {

					// that.el.children().detach();
					// that.el.append(out);
					// that.el.find('#listingClients').append(that.elClients);
					// that.el.find('#listingAPIGKs').append(that.elAPIGKs);
					// that.el.find('#orgSelector').append(that.elOrgSelector);

					// that.elClientsAttached = true;
					// that.elAPIGKsAttached = true;
					// that.templateLoaded = true;

				});
		
				if (act) {
					that.activate();
				}

			});

		}
	}).extend(EventEmitter);

	return OrgAdminPane;

});
