
define(function (require, exports, module) {

	"use strict";

	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		AppController = require('./controllers/AppController'),
		// ClientEditor = require('./controllers/editpage/ClientEditor'),
		// APIGKEditor = require('./controllers/editpage/APIGKEditor'),
		OrgRoleSelector = require('./controllers/OrgRoleSelector'),

		OrgApp = require('./OrgApp'),

		PublicAPIPool = require('./models/PublicAPIPool'),
		PublicClientPool = require('./models/PublicClientPool'),
		ClientPool = require('./models/ClientPool'),

		Client = require('./models/Client'),
		APIGK = require('./models/APIGK'),
		PaneController = require('./controllers/PaneController'),
		Dictionary = require('./Dictionary'),
		TemplateEngine = require('./TemplateEngine'),
		utils  = require('./utils'),
		rawconfig = require('text!../../etc/config.js'),
		$ = require('jquery');

	var tmpHeader = require('text!templates/header.html');
	var tmpFooter = require('text!templates/footer.html');

	// require('../../bower_components/bootstrap/dist/js/bootstrap.min.js');
	require("bootstrap");

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

	var App = AppController.extend({
		
		"init": function() {
			var that = this;

			var config = JSON.parse(rawconfig);
			this.feideconnect = new FeideConnect(config);

			this.dict = new Dictionary();

			this.tmpHeader = new TemplateEngine(tmpHeader);
			this.tmpFooter = new TemplateEngine(tmpFooter);


			this.elOrgSelector = $("<div></div>");
			this.orgRoleSelector = new OrgRoleSelector(this.elOrgSelector, this.feideconnect);
			this.orgRoleSelector.initLoad();

			this.orgRoleSelector.on("orgRoleSelected", function(orgid) {
				that.onLoaded()
					.then(function() {
						if (that.orgApps[orgid]) {
							that.orgApps[orgid].actMainlisting();
							that.orgApps[orgid].activate();
							that.setHash('/' + that.orgRoleSelector.getOrg());	

						}
						
					})
					.catch(function(err) {
						that.setErrorMessage("Error loading client and apigk data from an organization", "danger", err);
					});
			});

			// Call contructor of the AppController(). Takes no parameters.
			this._super();

			this.pc = new PaneController(this.el.find('#panecontainer'));

			this.orgApps = {};

			this.initLoad();	

			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)?$/, "routeMainlisting");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/mandatory$/, "routeMandatory");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/clients\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditClient");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/apigk\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditAPIGK");
			this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)$/, "viewclient");
			this.setupRoute(/^\/new$/, "newGroup");


			this.publicapis = new PublicAPIPool(this.feideconnect);
			this.publicClientPool = new PublicClientPool(this.feideconnect);


			$("#header").on("click", ".navbar-brand", function(e) {
				e.preventDefault();

				that.feideconnect.authenticated()
					.then(function() {
						return that.getOrgApp(that.orgRoleSelector.getOrg())
					})
					.then(function(orgApp) {
						orgApp.actMainlisting();
						orgApp.activate();
						that.orgRoleSelector.show();
					})
					.catch(function(err) {
						console.error("err", err);
						that.setErrorMessage("Error loading front dashboard", "danger", err);
					});

			});

			this.el.on("click", ".login", function() {
				that.feideconnect.authenticate();
			});
			this.el.on("click", "#logout", function(e) {
				e.preventDefault();
				that.feideconnect.logout();
				setTimeout(function() {

					var c = that.feideconnect.getConfig();
					var url = c.apis.auth + '/logout';
					// console.error("Redirect to " + url);
					window.location = url;

				}, 200);
			});



			this.feideconnect.onStateChange(function(authenticated, user) {

				that.onLoaded()
					.then(function() {

						if (authenticated) {

							$("body").addClass("stateLoggedIn");
							$("body").removeClass("stateLoggedOut");

							$("#username").empty().text(user.name);
							$("#profilephoto").html('<img style="margin-top: -28px; max-height: 48px; max-width: 48px; border: 0px solid #b6b6b6; border-radius: 32px; box-shadow: 1px 1px 4px #aaa;" src="https://auth.dev.feideconnect.no/user/media/' + user.profilephoto + '" alt="Profile photo" />');

							$(".loader-hideOnLoad").hide();
							$(".loader-showOnLoad").show();

						} else {

							$("body").removeClass("stateLoggedIn");
							$("body").addClass("stateLoggedOut");

							$(".loader-hideOnLoad").show();
							$(".loader-showOnLoad").hide();

						}


					});

			});


		},



		"initLoad": function() {
			var that = this;

			// Draw template..
			return this.draw()

				// Wait for orgRoleSelector to be loaded.
				.then(function() {
					return that.orgRoleSelector.onLoaded()
				})

				// Then setup all the orgApps.
				.then(function() {


					return Promise.all(
						that.orgRoleSelector.getOrgIdentifiers().map(function(orgid) {

							// console.log("Setting up a new orgapp for " + orgid);
							that.orgApps[orgid] = new OrgApp(that.feideconnect, that, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole(orgid));
							that.pc.add(that.orgApps[orgid]);
						})
					);
				})

				// Then activate one of them
				.then(function() {
					that.orgApps._.activate();

					// now route.
					that.route();
				})
				.then(this.proxy("_initLoaded"));
				
		},

		// orgid = "_" means personal space
		"getOrgApp": function(orgid) {

			if (!this.orgApps.hasOwnProperty(orgid)) {
				return new Error("Could not find org app for " + orgid);
			}

			var orgApp = this.orgApps[orgid];
			return orgApp.onLoaded();
		},


		"getOrg": function() {
			return this.orgRoleSelector.getOrg();
		},

		/**
		 * A draw function that draws the header and footer template.
		 * Supports promises
		 * @return {[type]} [description]
		 */
		"draw": function() {
			var that = this;

			var view = {
				"_": that.dict.get()
			};

			return Promise.all([
				that.tmpHeader.render(that.el.find("#header"), view),
				that.tmpFooter.render(that.el.find("#footer"), view)
			]).then(function() {
				that.el.find('#orgSelector').append(that.elOrgSelector);
			});


		},




		"setErrorMessage": function(title, type, msg) {

			var that = this;
			type = (type ? type : "danger");

			// console.error("Error ", title, type, typeof msg, msg);

			var pmsg = '';
			if (typeof msg === 'object' && msg.hasOwnProperty("message")) {
				pmsg = '<p>' + utils.escape(msg.message, false).replace("\n", "<br />") + '</p>';
			} else if (typeof msg === 'string') {
				pmsg = '<p>' + utils.escape(msg, false).replace("\n", "<br />") + '</p>';
			}

			var str = '<div class="alert alert-' + type + ' alert-dismissible" role="alert">' +  
				' <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
				(title ? '<strong>' + utils.escape(title, false).replace("\n", "<br />")  + '</strong>' : '') +
				pmsg + 
				'</div>';

			if (this.hasOwnProperty("errorClearCallback")) {
				clearTimeout(this.errorClearCallback);
			}

			this.errorClearCallback = setTimeout(function() {
				$("#errorcontainer").empty();
			}, 10000);

			$("#errorcontainer").empty().append(str);

		},


		"routeEditClient": function(orgid, clientid, tabid) {
			var that = this;
			this.feideconnect.authenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					that.orgRoleSelector.setOrg(orgid, false);
					that.orgRoleSelector.hide();
					orgApp.editClient(clientid, tabid);
					orgApp.activate();
				})
				.catch(function(err) {
					that.setErrorMessage("Error loading client", "danger", err);
				});

		},
		"routeEditAPIGK": function(orgid, apigkid, tabid) {
			var that = this;
			this.feideconnect.authenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					that.orgRoleSelector.setOrg(orgid, false);
					that.orgRoleSelector.hide();
					orgApp.editAPIGK(apigkid, tabid);
					orgApp.activate();
				})
				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage("Error loading API Gatekeeper", "danger", err);
				});

		},

		"routeMandatory": function(orgid) {

			var that = this;
			// console.error("Setting org to be ", orgid);
			this.orgRoleSelector.setOrg(orgid, false);
			this.orgRoleSelector.show();

			this.feideconnect.authenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					orgApp.actMandatory();
					orgApp.activate();
				})
				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage("Error loading API Gatekeeper", "danger", err);
				});

		},

		"routeMainlisting": function(orgid) {

			var that = this;
			if (!orgid) {
				orgid = '_';
				this.setHash('/' + orgid);
			}
			this.orgRoleSelector.setOrg(orgid, false);
			this.orgRoleSelector.show();

			this.feideconnect.authenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					orgApp.actMainlisting();
					orgApp.activate();
				})
				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage("Error loading API Gatekeeper", "danger", err);
				});

		}



	});


	return App;
});
