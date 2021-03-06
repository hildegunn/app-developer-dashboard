define(function(require, exports, module) {

	"use strict";

	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		AppController = require('./controllers/AppController'),

		UserContext = require('./data/UserContext'),

		AppSelector = require('./controllers/AppSelector'),
		NewOrgController = require('./controllers/NewOrgController'),
		PlatformAdminController = require('./controllers/PlatformAdminController'),

		BCController = require('./controllers/BCController'),
		LanguageController = require('./controllers/LanguageController'),

		RestrictedOrgApp = require('./RestrictedOrgApp'),
		PersonalApp = require('./PersonalApp'),
		HostOrgApp = require('./HostOrgApp'),
		ServiceProviderOrgApp = require('./ServiceProviderOrgApp'),
		DelegatedOrgApp = require('./DelegatedOrgApp'),
		DelegatedPersonalApp = require('./DelegatedPersonalApp'),

		PublicAPIPool = require('./models/PublicAPIPool'),
		PublicClientPool = require('./models/PublicClientPool'),
		DelegatedEntityPool = require('./models/DelegatedEntityPool'),

		ProviderData = require('./controllers/ProviderData'),

		PaneController = require('./controllers/PaneController'),
		Dictionary = require('./Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		dust = require('dust'),
		dust_helpers = require('dustjs-helpers'),
		DustIntl = require('DustIntl'),
		DustIntlData = require('DustIntlData'),
		// rawconfig = require('text!../../etc/config.js'),
		$ = require('jquery');

	var tmpHeader = require('text!templates/header.html');
	var tmpFooter = require('text!templates/footer.html');
	var trustblock = require('text!templates/partials/TrustBlock.html');
	var trustinline = require('text!templates/partials/TrustInline.html');
	var TimeInfo = require('text!templates/partials/TimeInfo.html');
	var apigkinfo = require('text!templates/partials/APIGKInfo.html');
	var sdpolicyinfo = require('text!templates/partials/ScopeDefPolicyInfo.html');
	var sdstatus = require('text!templates/partials/ScopeDefStatus.html');
	var scopeListing = require('text!templates/partials/ScopeListing.html');
	var adminsTemplate = require('text!templates/partials/Admins.html');
	var orgadminscopematrix = require('text!templates/partials/OrgAdminScopeMatrix.html');
	var errorMessageTemplate = require('text!templates/ErrorMessage.html');

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


		"loadConfig": function() {
			DustIntl.registerWith(dust);
//			dust.debugLevel = "DEBUG";
			var that = this;
			return new Promise(function(resolve, reject) {
				$.getJSON('/config', function(data) {
					// console.error("got data", data);
					that.config = data;
					return resolve(data);
				});
			});
		},


		"init": function() {
			var that = this;
			this.defaultApp = '_';

			dust.helpers.blockTrans = function(chunk, context, bodies, params) {
				var template = context.get('_')[params.key];
				var subContext = {};
				for (var key in bodies) {
					subContext[key] = "";
				}
				var tap = function(data) {
					subContext[key] += data;
					return "";
				};
				for (key in bodies) {
					chunk.tap(tap).render(bodies[key], context).untap();
				}
				for (key in bodies) {
					template = template.replace('{' + key + '}', subContext[key]);
				}
				chunk.write(template);
				return chunk;
			};

			that._super(undefined, false);

			this.loadConfig()
				.then(function() {

					that.feideconnect = new FeideConnect(that.config);
					var feideconnect = that.feideconnect;
					dust.helpers.profilePhotoURL = function(chunk, context, bodies, params) {
						var userid = dust.helpers.tap(params.userid, chunk, context);
						var url = feideconnect.profilePhotoURL(userid);
						chunk.write(url);
						return chunk;
					};
					dust.helpers.orgLogoURL = function(chunk, context, bodies, params) {
						var id = dust.helpers.tap(params.id, chunk, context);
						var url = feideconnect.orgLogoURL(id);
						chunk.write(url);
						return chunk;
					};
					dust.helpers.clientLogoURL = function(chunk, context, bodies, params) {
						var id = dust.helpers.tap(params.id, chunk, context);
						var url = feideconnect.clientLogoURL(id);
						chunk.write(url);
						return chunk;
					};
					dust.helpers.apigkLogoURL = function(chunk, context, bodies, params) {
						var id = dust.helpers.tap(params.id, chunk, context);
						var url = feideconnect.apigkLogoURL(id);
						chunk.write(url);
						return chunk;
					};

					that.dict = new Dictionary();

					that.tmpHeader = new TemplateEngine(tmpHeader);
					that.tmpFooter = new TemplateEngine(tmpFooter);
					that.errorMessageTemplate = new TemplateEngine(errorMessageTemplate, that.dict);

					TemplateEngine.prototype.loadPartial("TrustBlock", trustblock);
					TemplateEngine.prototype.loadPartial("TrustInline", trustinline);
					TemplateEngine.prototype.loadPartial("TimeInfo", TimeInfo);
					TemplateEngine.prototype.loadPartial("APIGKInfo", apigkinfo);
					TemplateEngine.prototype.loadPartial("ScopeDefPolicyInfo", sdpolicyinfo);
					TemplateEngine.prototype.loadPartial("ScopeDefStatus", sdstatus);
					TemplateEngine.prototype.loadPartial("OrgAdminScopeMatrix", orgadminscopematrix);
					TemplateEngine.prototype.loadPartial("ScopeListing", scopeListing);
					TemplateEngine.prototype.loadPartial("Admins", adminsTemplate);

					that.providerdata = new ProviderData(that);

					that.usercontext = new UserContext(that.feideconnect, that);

					that.elOrgSelector = $("<div></div>");
					that.appSelector = new AppSelector(that.elOrgSelector);
					that.appSelector.initLoad();


					that.pc = new PaneController(that.el.find('#panecontainer'));
					that.apps = {};

					that.bccontroller = new BCController($("#breadcrumb"));
					that.languageselector = new LanguageController(that);

					// console.log("COnfig", that.feideconnect.config);


					that.appSelector.on("appSelected", function(appid) {
						that.onLoaded()
							.then(function() {
								that.selectApp(appid);
							})
							.catch(function(err) {
								that.setErrorMessage(that.dict.get().error_loading_client_and_apigk_data_from_an_organization, "danger", err);
							});
					});

					that.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)((\/(.*))?)$/, "routeApp");
					that.setupRoute(/^[^/].*$/, "routeDefault");
					that.setupRoute(/^\/$/, "routeDefault");

					that.publicapis = new PublicAPIPool(that.feideconnect);
					that.publicClientPool = new PublicClientPool(that.feideconnect);
					that.delegatedEntityPool = new DelegatedEntityPool(that.feideconnect);

					$("#header").on("click", ".navbar-brand", function(e) {
						e.preventDefault();

						that.onLoaded()
							.then(function() {
								that.selectApp(that.appSelector.getCurrentApp());
							})
							.catch(function(err) {
								console.error("err", err);
								that.setErrorMessage(that.dict.get().error_loading_front_dashboard, "danger", err);
							});

					});

					that.el.on("click", ".login", function() {
						that.feideconnect.authenticate();
					});
					that.el.on("click", "#logout", function(e) {
						e.preventDefault();
						that.feideconnect.logout();

						var c = that.feideconnect.getConfig();
						var url = c.apis.auth + '/logout';
						window.location = url;

					});


					that.feideconnect.onAuthenticated()
						.then(that.proxy("onLoaded"))
						.then(function() {
							var user = that.feideconnect.getUser();
							that.usercontext.setUser(user);
							var profilephoto = that.feideconnect.profilePhotoURL(user.profilephoto);

							$("body").addClass("stateLoggedIn");
							$("body").removeClass("stateLoggedOut");

							$("#username").empty().text(user.name);
							$("#profilephoto").html('<img src="' + profilephoto + '" alt="Profile photo" />');

							$(".loader-hideOnLoad").hide();
							$(".loader-showOnLoad").show();

						});

					that.initLoad();

				});

		},

		"addApp": function(app) {
			this.apps[app.getID()] = app;
			this.pc.add(app);
			this.appSelector.addApp(app);
		},

		"addOrgAdmin": function(orgid) {
			var that = this;

			return this.usercontext.getOrg(orgid)
				.then(function(org) {
					var app;
					if (org.matchType('home_organization')) {
						app = new HostOrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, org);
					} else if (org.matchType('service_provider')) {
						app = new ServiceProviderOrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, org);
					}
					that.addApp(app);
					return app;
				});

		},

		"addDelegatedOrg": function(orgid, entityPool) {
			var that = this;

			return this.usercontext.getOrg(orgid)
				.then(function(org) {
					var app = new DelegatedOrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, org, entityPool);
					that.addApp(app);
					return app;
				});
		},

		"addDelegatedUser": function(userid, entityPool) {
			var owner = {
				id: userid,
				name: this.delegatedEntityPool.getUsersName(userid)
			};
			var app = new DelegatedPersonalApp(this.feideconnect, this, this.usercontext, this.publicClientPool, this.publicapis, owner, entityPool);
			this.addApp(app);
			return app;
		},

		"initLoad": function() {
			var that = this;

			return Promise.all([
				this.draw(),
				that.feideconnect.onAuthenticated(),
				that.usercontext.onLoaded(),
				that.appSelector.onLoaded(),
				that.delegatedEntityPool.onLoaded()
			])


			// Then setup all the orgApps.
			.then(function() {
				if (that.usercontext.policy.register) {
					that.addApp(new PersonalApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis));
				} else {
					that.addApp(new RestrictedOrgApp('_', that));
				}

				var promises = [];
				that.usercontext.getOrgIdentifiers().map(function(orgid) {
					promises.push(that.addOrgAdmin(orgid));
					that.defaultApp = orgid;
				});

				return Promise.all(promises).then(function() {
					var promises = [];
					var delOrgs = that.delegatedEntityPool.getOrganizations();
					for (var orgid in delOrgs) {
						if (!that.apps.hasOwnProperty(orgid)) {
							promises.push(that.addDelegatedOrg(orgid, delOrgs[orgid]));
						}
					}
					var delUsers = that.delegatedEntityPool.getUsers();
					for (var userid in delUsers) {
						that.addDelegatedUser(userid, delUsers[userid]);
					}
					return Promise.all(promises).then(function() {
						if (that.usercontext.isPlatformAdmin()) {
							that.addApp(new PlatformAdminController('_platformadmin', that));
						}
						that.addApp(new NewOrgController('_neworg', that));
					});
				});

			})

			// Then activate one of them
			.then(function() {
					that.apps._.activate();
					// now route.
					that.loadRoute(true);
				})
				.then(this.proxy("_initLoaded"))
				.catch(function(err) {
					console.error("Error loading initLoad on app", err);
				});

		},

		// appid = "_" means personal space
		"getApp": function(appid) {

			var that = this;
			return that.onLoaded()
				.then(function() {

					if (!that.apps.hasOwnProperty(appid)) {

						if (that.usercontext.isPlatformAdmin() && appid[0] !== '_') {
							console.log("Loading an platformadmin orgapp ", appid);
							return that.addOrgAdmin(appid);
						}

						throw new Error("Could not find app for " + appid);
					}

					var app = that.apps[appid];
					return app;
				});
		},

		"selectApp": function(appid) {
			console.log("App " + appid + " selected");
			var app = this.apps[appid];
			app.actMain();
			app.activate();
			this.setHash('/' + appid);
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
				that.el.find("#navcontainer").append(that.languageselector.el);
				that.el.find('#orgSelector').append(that.elOrgSelector);
			});


		},

		"setErrorMessage": function(title, type, msg) {
			type = (type ? type : "danger");
			var logMessage = '';
			var view = {
				type: type
			};
			if (title) {
				view.title = title;
				logMessage = title + ': ';
			}

			if (typeof msg === 'object' && msg.hasOwnProperty("message")) {
				view.message = msg.message;
			} else if (typeof msg === 'string') {
				view.message = msg;
			}
			logMessage = logMessage + view.message;
			console.error(logMessage);

			if (this.hasOwnProperty("errorClearCallback")) {
				clearTimeout(this.errorClearCallback);
			}

			this.errorClearCallback = setTimeout(function() {
				$("#errorcontainer").empty();
			}, 10000);

			this.errorMessageTemplate.render($("#errorcontainer"), view);

		},

		"routeApp": function(appid, subpath) {
			var that = this;
			this.onLoaded()
				.then(function() {
					that.appSelector.setApp(appid, false);
					that.getApp(appid).then(function(app) {
						app.activate();
						app.route(subpath);
					});
				}).catch(function(err) {
					console.error("err", err);
					that.setErrorMessage(that.dict.get().error_loading_mainlisting, "danger", err);

				});

		},

		"routeDefault": function() {
			var that = this;
			this.onLoaded()
				.then(function() {
					var appid = that.defaultApp;
					that.setHash('/' + appid);
					that.routeApp(appid, '/');
				});
		}
	});


	return App;
});
