define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./Pane'),

		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		$ = require('jquery');

	var template = require('text!templates/platformadmin.html');

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
			this.template = new TemplateEngine(template, this.app.dict);
			this._super();

			this.selectedOrg = null;

			// this.ebind('change', '#newselectorg', 'actSelectOrg');
			// this.ebind('click', '.actSubmit', 'actSubmit');
		},


		"initLoad": function() {
			var that = this;
			return this.draw()
				.then(that.proxy("_initLoaded"))
				.catch(function(err) {
					console.error("Error loading NewOrgController ", err);
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
				"orgs": this.orgs
			};

			var user = this.app.feideconnect.getUser();
			var _config = this.app.feideconnect.getConfig();
			user.profile = _config.apis.core + '/userinfo/v1/user/media/' + user.profilephoto;

			view.userinfo = user;

			// console.error("VIEW is ", view);
			this.el.children().detach();
			return this.template.render(this.el, view);
		}

	});

	return PlatformAdminController;

});