define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./controllers/Pane'),

		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine');

	var template = require('text!templates/restrictedPersonalOrgApp.html');

	var RestrictedOrgApp = Pane.extend({

		"init": function(id, app) {
			this.id = id;
			this.app = app;
			this.template = new TemplateEngine(template, app.dict);
			this._super();
			this.initLoad();

		},

		"initLoad": function() {
			return this.draw()
				.then(this.proxy("_initLoaded"));
		},

		"getBCItem": function() {
			throw new Error('Not available with restricted OrgApp');
		},

		"editClient": function(clientid, tabid) {
			throw new Error('Cannot edit item with restricted OrgApp');
		},

		"editAPIGK": function(apigkid, tabid) {
			throw new Error('Cannot edit item with restricted OrgApp');
		},

		"actMain": function() {
			// No operation...
		},

		"getOrgInfo": function() {
			throw new Error('Not available with restricted OrgApp');
		},

		"draw": function() {
			var view = {};

			this.el.children().detach();
			return this.template.render(this.el, view);
		},

		"getSelectorIcon": function() {
			return 'fa fa-user';
		},

		"getID": function() {
			return this.id;
		},

		"getTitle": function() {
			return this.app.dict.get().personal;
		}

	});


	return RestrictedOrgApp;
});
