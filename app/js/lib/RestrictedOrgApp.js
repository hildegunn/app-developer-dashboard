define(function(require, exports, module) {

	"use strict";

	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		Pane = require('./controllers/Pane'),

		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		utils = require('./utils'),
		rawconfig = require('text!../../etc/config.js'),
		$ = require('jquery');

	var template = require('text!templates/restrictedPersonalOrgApp.html');

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

	var RestrictedOrgApp = Pane.extend({

		"init": function(feideconnect, app, usercontext, publicClientPool, publicapis, role) {
			var that = this;

			this.feideconnect = feideconnect;
			this.app = app;
			this.usercontext = usercontext;

			this.template = new TemplateEngine(template, this.app.dict);

			this._super();

			this.initLoad();

		},

		"initLoad": function() {
			return this.draw()
				.then(this.proxy("_initLoaded"));
		},

		"getBCItem": function() {
			var title = 'Main overview personal';
			if (this.orgid !== '_') {
				title = 'Main overview ' + this.orgid;
			}
			var item = {
				"href": "#!/" + this.orgid,
				"title": title,
				"active": false
			};
			return item;
		},

		"editClient": function(clientid, tabid) {
			throw new Error('Cannot edit item with restricted OrgApp');
		},

		"editAPIGK": function(apigkid, tabid) {
			throw new Error('Cannot edit item with restricted OrgApp');
		},

		"actMainlisting": function() {
			// No operation...
		},

		"getOrgInfo": function() {
			// console.error("Looking up getOrgInfo for " + this.orgid); //, this.app.orgRoleSelector.getOrgInfo(this.orgid));
			return this.usercontext.getOrgInfo(this.orgid);
		},

		/**
		 * A draw function that draws the header and footer template.
		 * Supports promises
		 * @return {[type]} [description]
		 */
		"draw": function() {
			var view = {};

			var user = this.app.feideconnect.getUser();
			var _config = this.app.feideconnect.getConfig();
			user.profile = _config.apis.core + '/userinfo/v1/user/media/' + user.profilephoto;

			view.userinfo = user;

			// console.error("VIEW is ", view);
			this.el.children().detach();
			return this.template.render(this.el, view);
		},


	});


	return RestrictedOrgApp;
});