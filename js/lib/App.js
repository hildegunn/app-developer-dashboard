
define(function (require, exports, module) {

	"use strict";

	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		AppController = require('./controllers/AppController'),
		ClientEditor = require('./controllers/editpage/ClientEditor'),
		APIGKEditor = require('./controllers/editpage/APIGKEditor'),
		MainListing = require('./controllers/mainpage/MainListing'),
		PublicAPIPool = require('./models/PublicAPIPool'),
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

	require('../../bower_components/bootstrap/dist/js/bootstrap.min.js');

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


			// dust.loadSource(dust.compile(tmpHeader, "header"));
			// dust.loadSource(dust.compile(tmpFooter, "footer"));

			// Call contructor of the AppController(). Takes no parameters.
			this._super();

			this.pc = new PaneController(this.el.find('#panecontainer'));
			this.mainlisting = new MainListing(this.feideconnect);
			this.pc.add(this.mainlisting);


			this.setupRoute(/^\/$/, "routeMainlisting");
			this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditClient");
			this.setupRoute(/^\/apigk\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditAPIGK");
			// this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)$/, "viewclient");
			// this.setupRoute(/^\/new$/, "newGroup");


			this.publicapis = new PublicAPIPool(this.feideconnect);


			this.clientpool = new ClientPool(this.feideconnect);
			this.clientpool.on('clientChange', function(clients) {
				that.mainlisting.updateClients(clients);
			});

			this.clientpool.on('apigkChange', function(apigks) {
				that.mainlisting.updateAPIGKs(apigks);
			});


			this.mainlisting.orgRoleSelector.onLoaded()
				.then(function() {
					var orgid = that.mainlisting.orgRoleSelector.getOrg();
					that.clientpool.initLoad(orgid);
				});

			this.mainlisting.orgRoleSelector.on("orgRoleSelected", function(orgid) {
				that.clientpool.load(orgid)
					.catch(function(err) {
						that.setErrorMessage("Error loading client and apigk data from an organization", "danger", err);
					});
			});

			// TODO Add listener to orgselector when user change role.


			this.clienteditor = new ClientEditor(this, this.feideconnect, this.publicapis);
			this.pc.add(this.clienteditor);
			this.clienteditor.on("saved", function(client) {
				console.log("Client is saved, updatge client pool and mainlisting");
				that.clientpool.setClient(client);
			});
			this.clienteditor.on("deleted", function(id) {
				console.log("Client is removed, update client pool and mainlisting");
				that.clientpool.removeClient(id);
				that.mainlisting.activate();
				that.setHash('/');
			});


			


			this.apigkeditor = new APIGKEditor(this, this.feideconnect);
			this.pc.add(this.apigkeditor);
			this.apigkeditor.on("saved", function(apigk) {
				console.log("APIGK is saved, updatge client pool and mainlisting");
				that.clientpool.setAPIGK(apigk);
			});
			this.apigkeditor.on("deleted", function(id) {
				console.log("APIGK is removed, update client pool and mainlisting");
				that.clientpool.removeAPIGK(id);
				that.mainlisting.activate();
				that.setHash('/');
			});


			this.mainlisting.on('clientSelected', function(clientid) {
				var client = that.clientpool.getClient(clientid);
				that.clienteditor.edit(client, 'tabBasic');
				that.setHash('/clients/' + clientid + '/edit/tabBasic');
			});
			this.mainlisting.on('apigkSelected', function(apigkid) {
				var apigk = that.clientpool.getAPIGK(apigkid);
				that.apigkeditor.edit(apigk, 'tabBasic');
				that.setHash('/apigk/' + apigkid + '/edit/tabBasic');
			});

			

			this.mainlisting.on("clientCreate", function(obj) {
				that.feideconnect.clientsRegister(obj)
					.then(function(data) {
						var client = new Client(data);
						that.clientpool.setClient(client);
						that.clienteditor.edit(client, 'tabBasic');
						that.setHash('/clients/' + client.id + '/edit/tabBasic');
					})
					.then(function() {
						that.setErrorMessage("Successfully created new client", "success");
					})
					.catch(function(err) {
						that.setErrorMessage("Error creating new client", "danger", err);
					});
			});
			this.mainlisting.on("apigkCreate", function(obj) {
				that.feideconnect.apigkRegister(obj)
					.then(function(data) {
						var apigk = new APIGK(data);
						that.clientpool.setAPIGK(apigk);
						that.apigkeditor.edit(apigk, 'tabBasic');
						that.setHash('/apigk/' + apigk.id + '/edit/tabBasic');
					})
					.then(function() {
						that.setErrorMessage("Successfully created new API Gatekeeper", "success");
					})
					.catch(function(err) {
						that.setErrorMessage("Error creating new API Gatekeeper", "danger", err);
					});
			});

			this.pc.debug();
			this.route();


			this.initLoad();	

			this.el.on("click", ".login", function() {
				that.feideconnect.authenticate();
			});
			this.el.on("click", "#logout", function() {
				that.feideconnect.logout();
				setTimeout(function() {

					var c = that.feideconnect.getConfig();
					var url = c.apis.auth + '/logout';
					console.error("Redirect to " + url);
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

			return this.draw()
				.then(this.proxy("_initLoaded"));
				
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
			]);


			// 	new Promise(function(resolve, reject) {
			// 		dust.render("header", view, function(err, out) {
			// 			if (err) { return reject(err); }
			// 			that.el.find("#header").append(out);
			// 			resolve();
			// 		});
			// 	}),
			// 	new Promise(function(resolve, reject) {
			// 		dust.render("footer", view, function(err, out) {
			// 			if (err) { return reject(err); }
			// 			that.el.find("#footer").append(out);
			// 			resolve();
			// 		});
			// 	})
			// ]).then(function() {
			// 	that.loaded = true;
			// 	if (that._onloadedCallback && typeof that._onloadedCallback === 'function') {
			// 		that._onloadedCallback();
			// 	}
			// });
		},



		// "onLoaded": function() {
		// 	var that = this;
		// 	return new Promise(function(resolve, reject) {
		// 		if (that.loaded) {
		// 			resolve();
		// 		} else {
		// 			that._onloadedCallback = resolve;
		// 		}
		// 	});
		// },





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


		"routeEditClient": function(clientid, tabid) {
			var that = this;
			console.log("Route edit client", clientid);

			this.feideconnect.authenticated()
				.then(function() {
					return that.clientpool.onLoaded()
				})
				.then(function() {
					var client = that.clientpool.getClient(clientid);
					that.clienteditor.edit(client, tabid);
				});

		},
		"routeEditAPIGK": function(apigkid, tabid) {
			var that = this;
			console.log("Route edit apigkid", apigkid);

			this.feideconnect.authenticated()
				.then(function() {
					return that.clientpool.onLoaded()
				})
				.then(function() {
					var apigk = that.clientpool.getAPIGK(apigkid);
					that.apigkeditor.edit(apigk, tabid);
				});

		},
		"routeMainlisting": function() {
			console.log("ABOUT");
			this.setHash('/');
			this.mainlisting.initLoad();
		}



	});


	return App;
});
