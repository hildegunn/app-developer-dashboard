define(function(require) {
	"use strict";

	var
		Client = require('../../models/Client'),
		Editor = require('./Editor'),
		utils = require('../../utils'),
		StringSet = require('../../StringSet'),
		Dictionary = require('../../Dictionary'),
		Waiter = require('../../Waiter'),

		Statistics = require('../../data/Statistics'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		AuthProviderSelector = require('../AuthProviderSelector'),

		$ = require('jquery');

		require('flot');


	var clientTemplate = require('text!templates/ClientEditor.html');
	var apilistingTemplate = require('text!templates/partials/APIListing.html');
	var availableAPIsListingTemplate = require('text!templates/partials/AvailableAPIsListing.html');

	var ClientEditor = Editor.extend({
		"init": function(app, feideconnect, publicapis, clientpool, usercontext) {

			var that = this;

			this.editor = "clients";
			this.publicapis = publicapis;
			this.clientpool = clientpool;
			this.feideconnect = feideconnect;
			this.usercontext = usercontext;

			this._super(app, feideconnect);

			this.dict = new Dictionary();
			this.template = new TemplateEngine(clientTemplate, this.dict);
			TemplateEngine.prototype.loadPartial("APIListing", apilistingTemplate);

			this.availableapistemplate = new TemplateEngine(availableAPIsListingTemplate, this.dict);

			this.ebind("click", ".actAPIadd", "actAPIadd");
			this.ebind("click", ".actAPIScopeUpdate", "actAPIScopeUpdate");
			this.ebind("click", ".actRemoveRedirectURI", "actRemoveRedirectURI");
			this.ebind("click", ".actAddRedirectURI", "actAddRedirectURI");
			this.ebind("click", ".apiEntry", "actScopeUpdate");

			this.searchWaiter = new Waiter(function(x) {
				that.doSearch(x);
			});

			that.searchTerm = '';
			this.el.on("propertychange change click keyup input paste", '#apisearch', function() {
				var st = utils.normalizeST($("#apisearch").val());

				if (st !== that.searchTerm) {
					that.searchTerm = st;
					if (st === null) {
						that.searchWaiter.ping();
					} else if (utils.stok(st)) {
						that.searchWaiter.ping();
					}
				}
			});

			/*
			 * Disable provider filters until implemented.
			 */
			this.el.on('click', "#apilistfilterprovider a", function(e) {
				// e.preventDefault();
			});


			/*
			 * Handle the accordion view of available APIs.
			 */
			this.el.on('click', '#apilisttabcontent .apiEntry', function(e) {

				var itemx = $(e.target);
				// console.error("X", itemx);

				if (itemx.closest("div.extendedinfo").length !== 0) {
					// console.error("Ignore");
					return;
				}


				// e.preventDefault();
				var item = $(e.currentTarget);

				var wasOpen = item.hasClass("opened");

				that.el.find('#apilisttabcontent .apiEntry').removeClass("opened");
				if (!wasOpen) {
					item.addClass("opened");
				}

			});



			/*
			 * Handle tabs under 3rd party APIs.
			 */
			this.el.on('click', '#apilisttabs a', function(e) {
				e.preventDefault();
				var x = $(e.currentTarget);
				var href = x.attr("href");

				that.el.find("#apilisttabs > li").removeClass("active");
				x.addClass("active");

				that.el.find("#apilisttabcontent > div").hide();
				that.el.find(href).show();

				if (href === '#apilistavailable') {
					setTimeout(function() {
						$("#apisearch").focus();
					}, 100);
				}

			});

			this.initLoad();
		},



		"initLoad": function() {


			return Promise.all([
					this.loadScopeDef(),
					this.publicapis.onLoaded()
				])
				.then(this.proxy("_initLoaded"));



		},


		"setTabHashFragment": function(tabid) {
			var orgid = this.app.getID();
			this.app.app.setHash('/' + orgid + '/clients/' + this.current.id + '/edit/' + tabid);
		},

		"loadScopeDef": function() {
			var that = this;

			return this.feideconnect.getScopeDef().then(function(scopePolicy) {
				that.scopePolicy = scopePolicy;
			});
		},


		"actRemoveRedirectURI": function(e) {
			e.preventDefault();
			$(e.currentTarget).closest(".redircontainer").remove();
		},

		"actAddRedirectURI": function(e) {
			e.preventDefault();
			var tmp = this.el.find("#redirtemplate").clone().css("display", "block");
			this.el.find("#rediroutercontainer").append(tmp);
		},

		"logoUploaded": function(data) {
			var that = this;
			// console.log("About to upload image", this.current.id, data);
			that.feideconnect.clientsUpdateLogo(this.current.id, data)
				.then(function() {
					var url = that.feideconnect.clientLogoURL(that.current.id) + "?r=" + utils.guid();
					that.el.find('.itemlogo').attr("src", url);
				})
				.catch(function(err) {
					// console.error(err);
					that.app.app.setErrorMessage(that.dict.get().error_uploading_logo, "danger", err);
				});
		},


		"edit": function(item, setTab) {

			var that = this;
			this.current = item;

			var view = {
				"client": item.getView(this.feideconnect),
				"groups": []
			};
			view.client.entityType = this.dict.get()[view.client.entityType];
			if (view.client.trustOrg) {
				this.usercontext.getOrg(view.client.organization).then(function(org) {
					view.client.ownerName = org.name;
				});
			} else {
				view.client.ownerName = this.usercontext.user.name;
			}

			for (var g in this.usercontext.groups) {
				if ($.inArray(g, this.current.admins) < 0) {
					view.groups.push(this.usercontext.groups[g].getView());
				}
			}

			var stats = new Statistics(this.app.feideconnect, item.id);

			stats.onLoaded()
				.catch(function(err) {
					console.error("Error loading statistics for this client ", err);
				});

			var includeHidden = this.usercontext.isPlatformAdmin();
			var scopes = item.getScopes(this.scopePolicy, includeHidden);

			if (that.feideconnect) {
				var _config = that.feideconnect.getConfig();
				$.extend(view, {
					"authorization_endpoint": _config.authorization,
					"token_endpoint": _config.token,
					"openid_connect_configuration_endpoint": _config.apis.auth + "/.well-known/openid-configuration",
					"scopelist": scopes
				});
			}

			var apiids = item.getAPIscopes();
			var clientAPIkeys = new StringSet(apiids);
			var publicapis = this.publicapis.apigks;
			var ownapis = this.clientpool.apigks;

			this.app.app.bccontroller.draw([
				this.app.getBCItem(), {
					"title": 'Client ' + item.name,
					"active": true
				}
			]);

			/*
			 * From the list of API GK oriented scopes, such as gk_preferanse_foo
			 * it will obtain a list of API model objects from the referring APIs
			 * into the list myapis.
			 */
			var myapis = [],
				api, i;
			for (i = 0; i < apiids.length; i++) {
				api = this.getAPI(apiids[i], true);
				if (api !== null) {
					myapis.push(api);
				}
			}


			/*
			 * Now we want to sort all APIs into those accepted, requested and 3rd party (potential)
			 */
			var aapiview;
			view.authorizedAPIs = [];
			view.requestedAPIs = [];


			// console.error("Publicapis", publicapis);
			// console.error("Own apis", ownapis);
			// console.error("clientAPIkeys", clientAPIkeys);

			view.apis = [];
			var key;
			for (key in publicapis) {
				if (publicapis.hasOwnProperty(key)) {
					// console.log("About to process (public) ", publicapis[key].name, clientAPIkeys.has(publicapis[key].id));
					if (clientAPIkeys.has(publicapis[key].id)) {
						continue;
					}
					view.apis.push(publicapis[key].getView());
				}
			}
			for (key in ownapis) {
				if (ownapis.hasOwnProperty(key)) {
					// console.log("About to process (own) ", ownapis[key].name, clientAPIkeys.has(ownapis[key].id));
					if (clientAPIkeys.has(ownapis[key].id)) {
						continue;
					}
					view.apis.push(ownapis[key].getView());
				}
			}



			for (i = 0; i < myapis.length; i++) {

				aapiview = myapis[i].getClientView(that.current);
				// console.error("Get client view is ", JSON.stringify(aapiview, undefined, 2));
				if (aapiview.sd.status.accepted) {
					view.authorizedAPIs.push(aapiview);
				}
				if (aapiview.sd.status.requested) {
					view.requestedAPIs.push(aapiview);
				}

			}

			view.hasEnabledTestUsers = item.hasEnabledTestUsers();


			// console.error("Client view..", view);



			this.el.children().detach();
			return this.template.render(this.el, view)
				.then(this.proxy("drawAPIs"))
				.then(this.proxy("drawOwnAPIs"))
				.then(function() {

					// console.log(" ===> INIT LOAD ClientEditor")

					var tab = that.currentTab;
					if (setTab) {
						tab = setTab;
					}
					that.selectTab(tab);


					that.el.find('#stats').empty().append(stats.el);


					// console.error("Load AuthProviderSelector()", that.current.organization);

					return that.app.usercontext.isClientAuthorizedToIDporten(that.current)
						.then(function(isAuthorized) {
							that.aps = new AuthProviderSelector(that.el.find('.authproviders'), that.feideconnect, that.app.app.providerdata, that.current.authproviders, isAuthorized, that.dict);
							that.aps.on('save', function(providers) {
								that.actUpdateAuthProviders(providers);
							});

							that.activate();


						});


					})
					.catch(function(err) {
						that.app.app.setErrorMessage(that.dict.get().error_loading_client_editor, "danger", err);
					});


		},

		"doSearch": function(term) {

			return this.drawAPIs();
		},

		"_drawAPIs": function(own) {
			var view = {
				"apis": []
			};
			var apis;

			if (!own) {
				apis = this.publicapis.apigks;
			} else {
				apis = this.clientpool.apigks;
				view.canadd = true;
				view.own = true;
			}
			var apiids = this.current.getAPIscopes();
			var clientAPIkeys = new StringSet(apiids);

			for (var key in apis) {
				if (apis.hasOwnProperty(key)) {
					// console.log("About to process ", apis[key].name, clientAPIkeys.has(apis[key].id));
					if (clientAPIkeys.has(apis[key].id)) {
						continue;
					}

					if (this.searchTerm !== null) {
						if (!apis[key].searchMatch(this.searchTerm)) {
							continue;
						}
					}
					var apiview = apis[key].getView();
					if (apiview.scopedef.policy.auto) {
						apiview.canadd = true;
					}
					view.apis.push(apiview);
				}
			}
			return view;
		},

		"drawAPIs": function() {
			var view = this._drawAPIs(false);
			return this.availableapistemplate.render(this.el.find("#publicapicontainer").empty(), view);
		},

		"drawOwnAPIs": function() {
			var view = this._drawAPIs(true);
			return this.availableapistemplate.render(this.el.find("#apicontainerown").empty(), view);
		},


		"actUpdateAuthProviders": function(providers) {

			var that = this;
			var obj = this.current.getStorable(['id']);
			obj.authproviders = providers;


			this._save(obj)
				.then(function(savedClient) {
					that.app.app.setErrorMessage(that.dict.get().successfully_updated_list_of_authentication_providers, "success");
				})
				.catch(function(err) {
					that.app.app.setErrorMessage(that.dict.get().error_updating_auth_providers, "danger", err);
				});

		},


		"getAPI": function(id, acceptempty) {

			var api;
			api = this.publicapis.getAPIGK(id);
			if (api !== null) {
				return api;
			}

			api = this.clientpool.getAPIGK(id);
			if (api !== null) {
				return api;
			}

			if (typeof acceptempty !== 'undefined' && acceptempty === true) {
				return null;
			}
			throw new Error("Could not look up API " + id + " from neigther public pool or your own apis.");
		},


		"actAPIadd": function(e) {

			e.preventDefault();

			var that = this;
			var newscopes = [];

			var container = $(e.currentTarget).closest(".apiEntry");
			var apigkid = container.data('apigkid');
			var apigk = this.getAPI(apigkid);

			newscopes.push(apigk.getBasicScope());
			container.find("input.subScopeSelection").each(function(i, item) {

				if ($(item).prop("checked")) {
					newscopes.push($(item).attr("name"));
				}

			});

			this.current.addScopes(newscopes);

			var obj = this.current.getStorable(['id', 'scopes_requested']);

			this._save(obj).catch(function(err) {
				that.app.app.setErrorMessage(that.dict.get().error_adding_third_party_api, "danger", err);
			});

		},

		"actAPIScopeUpdate": function(e) {

			e.preventDefault();

			var that = this;
			var container = $(e.currentTarget).closest(".apiEntry");

			var scopes = {};
			$(container).find("input.authscope").each(function(i, item) {
				// console.log("Auth z input element", item);
				var scope = $(item).data("scopemoderate");
				var enabled = $(item).prop("checked");
				scopes[scope] = enabled;
			});

			for (var scope in scopes) {
				if (scopes[scope]) {
					this.current.addScope(scope);
				} else {
					this.current.removeScope(scope);
				}
			}

			var obj = this.current.getStorable(['id', 'scopes_requested']);

			this._save(obj).catch(function(err) {
				that.app.app.setErrorMessage(that.dict.get().error_third_party_api_scope_update, "danger", err);
			});



		},


		"autoadjustScopes": function(container, type, set) {
			container.find("input:checkbox").each(function(i, item) {
				var itemtype = $(item).data("scopetype");
				if (itemtype === type) {
					$(item).prop("checked", set);
				}
			});
		},


		"actScopeUpdate": function(e) {
			var container = $(e.currentTarget);
			var input = $(e.target);
			var isChecked = input.prop("checked");
			var type = input.data("scopetype");

			if (type === "main" && !isChecked) {
				// console.error("Scope update autoadjust 1");
				this.autoadjustScopes(container, "sub", false);
			} else if (type === "sub" && isChecked) {
				// console.error("Scope update autoadjust 2");
				this.autoadjustScopes(container, "main", true);
			}

		},

		"_save": function(obj) {
			var that = this;
			return this.feideconnect.clientsUpdate(obj)
				.then(function(savedClient) {
					var x = new Client(savedClient);
					that.edit(x);
					that.emit("saved", x);
				});
		},

		"save": function(properties) {
			var that = this;
			var obj = this.current.getStorable(properties);
			return this._save(obj).catch(function(err) {
				that.app.app.setErrorMessage(that.dict.get().error_adding_scope, "danger", err);
			});
		},



		"actSaveChanges": function(e) {
			e.preventDefault();

			var that = this;
			var redirectURIs;
			var obj;

			this.current.setName(this.el.find("#name").val());
			this.current.setDescr(this.el.find("#descr").val());
			this.current.systemdescr = this.el.find("#systemdescr").val();
			if (this.current.systemdescr === '') {
				this.current.systemdescr = null;
			}
			this.current.privacypolicyurl = this.el.find('#privacypolicyurl').val();
			if (this.current.privacypolicyurl === '') {
				this.current.privacypolicyurl = null;
			}
			this.current.homepageurl = this.el.find('#homepageurl').val();
			if (this.current.homepageurl === '') {
				this.current.homepageurl = null;
			}
			this.current.loginurl = this.el.find('#loginurl').val();
			if (this.current.loginurl === '') {
				this.current.loginurl = null;
			}
			this.current.supporturl = this.el.find('#supporturl').val();
			if (this.current.supporturl === '') {
				this.current.supporturl = null;
			}

			this.current.authoptions = {};

			redirectURIs = [];
			this.el.find("input.redirect_uri").each(function(i, item) {
				var x = $(item).val();
				if (x !== '') {
					redirectURIs.push(x);
				}
			});

			this.current.redirect_uri = redirectURIs;

			obj = this.current.getStorable(["id", "name", "descr", "systemdescr",
				"privacypolicyurl", "homepageurl", "loginurl", "supporturl",
				"redirect_uri"
			]);

			this._save(obj).catch(function(err) {
				that.app.app.setErrorMessage(that.dict.get().error_updating_client, "danger", err);
			});

		},

		"actDelete": function(e) {
			e.preventDefault();
			var that = this;
			this.feideconnect.clientsDelete(this.current.id)
				.then(function() {
					that.emit("deleted", that.current.id);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage(that.dict.get().error_deleting_client, "danger", err);
				});
		}

	});

	return ClientEditor;


});
