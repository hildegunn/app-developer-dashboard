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
					TemplateEngine.prototype.loadPartial("trustblock", trustblock);
					TemplateEngine.prototype.loadPartial("trustinline", trustinline);

					that.providerdata = new ProviderData(that);

					that.usercontext = new UserContext(that.feideconnect, that);

					that.elOrgSelector = $("<div></div>");
					that.orgRoleSelector = new OrgRoleSelector(that.elOrgSelector, that.usercontext, that);
					that.orgRoleSelector.initLoad();


					that.newOrgController = new NewOrgController(that);
					that.platformadminController = new PlatformAdminController(that);

					that.bccontroller = new BCController($("#breadcrumb"));
					that.languageselector = new LanguageController(that);

					// console.log("COnfig", that.feideconnect.config);


					that.orgRoleSelector.on("orgRoleSelected", function(orgid) {
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
								that.setErrorMessage(that.dict.get().error_loading_client_and_apigk_data_from_an_organization, "danger", err);
							});
					});





					that.pc = new PaneController(that.el.find('#panecontainer'));
					that.pc.add(that.newOrgController);
					that.pc.add(that.platformadminController);

					that.orgApps = {};

					that.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)?$/, "routeMainlisting");
					that.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/mandatory$/, "routeMandatory");
					that.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/apiauthorization$/, "routeAPIAuthorization");
					that.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/clients\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditClient");
					that.setupRoute(/^\/([a-zA-Z0-9_\-:.]+)\/apigk\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditAPIGK");
					that.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)$/, "viewclient");
					that.setupRoute(/^\/new$/, "newGroup");


					that.publicapis = new PublicAPIPool(that.feideconnect);
					that.publicClientPool = new PublicClientPool(that.feideconnect);


					$("#header").on("click", ".navbar-brand", function(e) {
						e.preventDefault();

						that.feideconnect.onAuthenticated()
							.then(function() {
								return that.getOrgApp(that.orgRoleSelector.getOrg());
							})
							.then(function(orgApp) {
								orgApp.actMainlisting();
								orgApp.activate();
								that.orgRoleSelector.show();
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
							var profilephoto = that.feideconnect.profilePhotoURL(user.profilephoto);

							$("body").addClass("stateLoggedIn");
							$("body").removeClass("stateLoggedOut");

							$("#username").empty().text(user.name);
							$("#profilephoto").html('<img style="margin-top: -28px; max-height: 48px; max-width: 48px; border: 0px solid #b6b6b6; border-radius: 32px; box-shadow: 1px 1px 4px #aaa;" src="' + profilephoto + '" alt="Profile photo" />');

							$(".loader-hideOnLoad").hide();
							$(".loader-showOnLoad").show();

						});


					that.initLoad();






				});

		},

		"addOrgAdmin": function(orgid) {
			var that = this;

			return this.feideconnect.getOrg(orgid)
				.then(function(org) {

					that.orgRoleSelector.addOrg(org);

					that.orgApps[orgid] = new OrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole(orgid));
					that.pc.add(that.orgApps[orgid]);

					return that.orgApps[orgid];
				});

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
				if (that.usercontext.policy.register) {
					that.orgApps._ = new OrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole('_'));
					that.pc.add(that.orgApps._);
				} else {
					that.orgApps._ = new RestrictedOrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole('_'));
					that.pc.add(that.orgApps._);
				}

				that.usercontext.getOrgIdentifiers().map(function(orgid) {
					// console.error(" ››› Setting up a new orgapp for " + orgid);
					that.orgApps[orgid] = new OrgApp(that.feideconnect, that, that.usercontext, that.publicClientPool, that.publicapis, that.orgRoleSelector.getRole(orgid));
					that.pc.add(that.orgApps[orgid]);
				});

			})

			// Then activate one of them
			.then(function() {
					that.orgApps._.activate();
					// now route.
					that.route(true);

					// that.addOrgAdmin('fc:org:ntnu.no');
				})
				.then(this.proxy("_initLoaded"))
				.catch(function(err) {
					console.error("Error loading initLoad on app", err);
				});

		},

		// orgid = "_" means personal space
		"getOrgApp": function(orgid) {

			var that = this;
			return that.usercontext.onLoaded()
				.then(function() {

					if (!that.orgApps.hasOwnProperty(orgid)) {

						if (that.usercontext.isPlatformAdmin()) {
							console.log("Loading an platformadmin orgapp ", orgid);
							return that.addOrgAdmin(orgid);
						}


						throw new Error("Could not find org app for " + orgid);
					}

					var orgApp = that.orgApps[orgid];
					return orgApp.onLoaded();


				});



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
				' <button type="button" class="close" data-dismiss="alert" aria-label=' + that.dict.get().close + '><span aria-hidden="true">&times;</span></button>' +
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
					return that.usercontext.onLoaded();
				})
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
					that.setErrorMessage(that.dict.get().error_loading_client, "danger", err);
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
					that.setErrorMessage(that.dict.get().error_loading_api_gatekeeper, "danger", err);
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
					that.setErrorMessage(that.dict.get().error_loading_mandatory_view, "danger", err);
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
					that.setErrorMessage(that.dict.get().error_loading_mandatory_view, "danger", err);
				});
		},

		"routeMainlisting": function(orgid) {

			var that = this;

			return this.feideconnect.onAuthenticated()
				.then(that.orgRoleSelector.onLoaded())
				.then(function() {

					if (!orgid) {
						orgid = that.orgRoleSelector.getDefaultRole()
						that.setHash('/' + orgid);
					}
					that.orgRoleSelector.setOrg(orgid, false);
					that.orgRoleSelector.show();

					if (orgid === '_neworg') {
						return that.newOrgController.activate();
					}
					if (orgid === '_platformadmin') {
						return that.platformadminController.activate();
					}

					return that.getOrgApp(orgid)
						.then(function(orgApp) {
							orgApp.actMainlisting();
							orgApp.activate();
						});
				})

				.catch(function(err) {
					console.error("err", err);
					that.setErrorMessage(that.dict.get().error_loading_mainlisting, "danger", err);
				});
		}

	});


	return App;
});
