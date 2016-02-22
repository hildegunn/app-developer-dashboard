define(function(require, exports, module) {

	"use strict";

	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		AppController = require('./controllers/AppController'),

		UserContext = require('./data/UserContext'),

		OrgRoleSelector = require('./controllers/OrgRoleSelector'),
		NewOrgController = require('./controllers/NewOrgController'),
		PlatformAdminController = require('./controllers/PlatformAdminController'),

		BCController = require('./controllers/BCController'),
		LanguageController = require('./controllers/LanguageController'),

		RestrictedOrgApp = require('./RestrictedOrgApp'),
		OrgApp = require('./OrgApp'),

		PublicAPIPool = require('./models/PublicAPIPool'),
		PublicClientPool = require('./models/PublicClientPool'),
		ClientPool = require('./models/ClientPool'),

		ProviderData = require('./controllers/ProviderData'),

		Client = require('./models/Client'),
		APIGK = require('./models/APIGK'),
		PaneController = require('./controllers/PaneController'),
		Dictionary = require('./Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		utils = require('./utils'),
		rawconfig = require('text!../../etc/config.js'),
		$ = require('jquery');

	var tmpHeader = require('text!templates/header.html');
	var tmpFooter = require('text!templates/footer.html');

	require("bootstrap");
	require('es6-promise').polyfill();

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

			this.config = JSON.parse(rawconfig);
			this.feideconnect = new FeideConnect(this.config);

			this.dict = new Dictionary();

			this.tmpHeader = new TemplateEngine(tmpHeader);
			this.tmpFooter = new TemplateEngine(tmpFooter);

			this.providerdata = new ProviderData(this);

			this.usercontext = new UserContext(this.feideconnect, this);

			this.elOrgSelector = $("<div></div>");
			this.orgRoleSelector = new OrgRoleSelector(this.elOrgSelector, this.usercontext, this);
			this.orgRoleSelector.initLoad();


			this.newOrgController = new NewOrgController(this);
			this.platformadminController = new PlatformAdminController(this);

			this.bccontroller = new BCController($("#breadcrumb"));
			this.languageselector = new LanguageController(this);

			// console.log("COnfig", this.feideconnect.config);


			this.orgRoleSelector.on("orgRoleSelected", function(orgid) {
				that.onLoaded()
					.then(function() {
						// console.log("orgRoleSelected");

						if (orgid === '_new') {
							that.newOrgController.activate();

						} else if (orgid === '_platformadmin') {
							that.platformadminController.activate();

						} else if (that.orgApps[orgid]) {
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
			this._super(undefined, false);



			this.pc = new PaneController(this.el.find('#panecontainer'));
			that.pc.add(this.newOrgController);
			this.pc.add(this.platformadminController);

			this.orgApps = {};

			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)?$/, "routeMainlisting");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/mandatory$/, "routeMandatory");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/apiauthorization$/, "routeAPIAuthorization");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/clients\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditClient");
			this.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/apigk\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditAPIGK");
			this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)$/, "viewclient");
			this.setupRoute(/^\/new$/, "newGroup");


			this.publicapis = new PublicAPIPool(this.feideconnect);
			this.publicClientPool = new PublicClientPool(this.feideconnect);


			$("#header").on("click", ".navbar-brand", function(e) {
				e.preventDefault();

				that.feideconnect.onAuthenticated()
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

				var c = that.feideconnect.getConfig();
				var url = c.apis.auth + '/logout';
				window.location = url;

			});


			this.feideconnect.onAuthenticated()
				.then(that.proxy("onLoaded"))
				.then(function() {
					var user = that.feideconnect.getUser();
					var _config = that.feideconnect.getConfig();
					var profilephoto = _config.apis.core + '/userinfo/v1/user/media/' + user.profilephoto;

					$("body").addClass("stateLoggedIn");
					$("body").removeClass("stateLoggedOut");

					$("#username").empty().text(user.name);
					$("#profilephoto").html('<img style="margin-top: -28px; max-height: 48px; max-width: 48px; border: 0px solid #b6b6b6; border-radius: 32px; box-shadow: 1px 1px 4px #aaa;" src="' + profilephoto + '" alt="Profile photo" />');

					$(".loader-hideOnLoad").hide();
					$(".loader-showOnLoad").show();

				});


			this.initLoad();


		},



		"initLoad": function() {
			var that = this;

			return Promise.all([
				this.draw(),
				that.feideconnect.onAuthenticated(),
				that.usercontext.onLoaded(),
				that.orgRoleSelector.onLoaded()
			])


			// Then setup all the orgApps.
			.then(function() {
				console.log(" orgRoleSelector is loaded");

				if (that.usercontext.policy.register) {
					that.orgApps._ = new OrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole('_'));
					that.pc.add(that.orgApps._);
				} else {
					that.orgApps._ = new RestrictedOrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole('_'));
					that.pc.add(that.orgApps._);
				}

				that.usercontext.getOrgIdentifiers().map(function(orgid) {
					console.error(" ››› Setting up a new orgapp for " + orgid);
					that.orgApps[orgid] = new OrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole(orgid));
					that.pc.add(that.orgApps[orgid]);
				});

			})

			// Then activate one of them
			.then(function() {
					console.error("Is loaded 2");
					that.orgApps._.activate();
					// now route.
					that.route(true);
				})
				.then(this.proxy("_initLoaded"))
				.catch(function(err) {
					console.error("Error loading initLoad on app", err);
				});

		},

		// orgid = "_" means personal space
		"getOrgApp": function(orgid) {

			if (!this.orgApps.hasOwnProperty(orgid)) {
				throw new Error("Could not find org app for " + orgid);
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
				"_": that.dict.get(),
				"_config": that.feideconnect.getConfig()
			};

			return Promise.all([
				that.tmpHeader.render(that.el.find("#header"), view),
				that.tmpFooter.render(that.el.find("#footer"), view)
			]).then(function() {
				that.el.find("#navcontainer").append(that.languageselector.el);
				that.el.find('#orgSelector').append(that.elOrgSelector);
			});


		},



		"setErrorMessage": function(title, type, msg) {

			var that = this;
			type = (type ? type : "danger");

			// console.error("Error: ", msg.stack);

			var pmsg = '';
			if (typeof msg === 'object' && msg.hasOwnProperty("message")) {
				pmsg = '<p>' + utils.escape(msg.message, false).replace("\n", "<br />") + '</p>';
			} else if (typeof msg === 'string') {
				pmsg = '<p>' + utils.escape(msg, false).replace("\n", "<br />") + '</p>';
			}

			var str = '<div class="alert alert-' + type + ' alert-dismissible" role="alert">' +
				' <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
				(title ? '<strong>' + utils.escape(title, false).replace("\n", "<br />") + '</strong>' : '') +
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
			this.feideconnect.onAuthenticated()
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
			this.feideconnect.onAuthenticated()
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
			this.orgRoleSelector.setOrg(orgid, false);

			this.feideconnect.onAuthenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					orgApp.actMandatory();
					orgApp.activate();
					that.orgRoleSelector.hide();
				})
				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage("Error loading Mandatory view", "danger", err);
				});

		},

		"routeAPIAuthorization": function(orgid) {
			var that = this;
			this.orgRoleSelector.setOrg(orgid, false);

			this.feideconnect.onAuthenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					orgApp.actAPIAuth();
					orgApp.activate();
					that.orgRoleSelector.hide();
				})
				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage("Error loading Mandatory view", "danger", err);
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

			if (orgid === '_neworg') {
				return this.newOrgController.activate();
			}
			if (orgid === '_platformadmin') {
				return this.platformadminController.activate();
			}

			return this.feideconnect.onAuthenticated()
				.then(function() {
					return that.getOrgApp(orgid)
				})
				.then(function(orgApp) {
					orgApp.actMainlisting();
					orgApp.activate();
				})
				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage("Error loading Mainlisting", "danger", err);
				});
		}

	});


	return App;
});