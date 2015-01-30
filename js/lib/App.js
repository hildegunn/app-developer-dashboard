

define(function(require, exports, module) {

	var
		FeideConnect = require('./FeideConnect').FeideConnect,

		AppController = require('./controllers/AppController'),

		ClientEditor = require('./controllers/editpage/ClientEditor'),
		APIGKEditor = require('./controllers/editpage/APIGKEditor'),

		MainListing = require('./controllers/mainpage/MainListing'),

		ClientPool = require('./models/ClientPool'),
		Client = require('./models/Client'),
		APIGK = require('./models/APIGK'),

		PaneController = require('./controllers/PaneController'),


		config = require('../../etc/config');

	var 
		JSO = require('bower/jso/src/jso');
		


	require('../../bower_components/bootstrap/dist/js/bootstrap.min.js');

	JSO.enablejQuery($);



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

			this.feideconnect = new FeideConnect(config);


			// Call contructor of the AppController(). Takes no parameters.
			this._super();

			this.pc = new PaneController(this.el.find('#panecontainer'));
			this.mainlisting = new MainListing(this.feideconnect);
			this.pc.add(this.mainlisting);



			this.setupRoute(/^\/$/, "routeMainlisting");
			this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditClient");
			this.setupRoute(/^\/apigk\/([a-zA-Z0-9_\-:]+)\/edit\/([a-zA-Z]+)$/, "routeEditAPIGK");
			// this.setupRoute(/^\/clients\/([a-zA-Z0-9_\-:]+)$/, "viewclient");
			this.setupRoute(/^\/new$/, "newGroup");




			this.clientpool = new ClientPool(this.feideconnect);
			this.clientpool.on('clientChange', function(clients) {
				that.mainlisting.updateClients(clients);
			});

			this.clientpool.on('apigkChange', function(apigks) {
				that.mainlisting.updateAPIGKs(apigks);
			});



			this.clienteditor = new ClientEditor(this, this.feideconnect);
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
				that.feideconnect.clientsRegister(obj, function(data) {
					console.log("Client successfully registerd", data);

					var client = new Client(data);
					that.clientpool.setClient(client);
					that.clienteditor.edit(client, 'tabBasic');
					that.setHash('/clients/' + client.id + '/edit/tabBasic');
				});
			});
			this.mainlisting.on("apigkCreate", function(obj) {
				that.feideconnect.apigkRegister(obj, function(data) {
					console.log("Client successfully registerd", data);

					var apigk = new APIGK(data);
					that.clientpool.setAPIGK(apigk);
					that.apigkeditor.edit(apigk, 'tabBasic');
					that.setHash('/apigk/' + apigk.id + '/edit/tabBasic');
				});
			});

			this.pc.debug();
			this.route();


			

			$(".login").on('click', function() {

				that.feideconnect.authenticate();

			});


			$("#logout").on('click', function() {

				that.feideconnect.logout();

			});

			this.feideconnect.onStateChange(function(authenticated, user) {

				if (authenticated) {

					$("#username").empty().text(user.name);
					$("#profilephoto").html('<img style="margin-top: -28px; max-height: 48px; max-width: 48px; border: 0px solid #b6b6b6; border-radius: 32px; box-shadow: 1px 1px 4px #aaa;" src="https://auth.dev.feideconnect.no/user/media/' + user.profilephoto + '" alt="Profile photo" />');

					$(".loader-hideOnLoad").hide();
					$(".loader-showOnLoad").show();

					$(".showLoggedIn").show();
					$(".showLoggedOut").hide();

				} else {

					$(".loader-hideOnLoad").show();
					$(".loader-showOnLoad").hide();

					$(".showLoggedIn").hide();
					$(".showLoggedOut").show();
				}

			});

	
			

		},
		"routeEditClient": function(clientid, tabid) {
			var that = this;
			console.log("Route edit client", clientid);
			this.clientpool.ready(function() {
				var client = that.clientpool.getClient(clientid);
				that.clienteditor.edit(client, tabid);
			});


		},
		"routeEditAPIGK": function(apigkid, tabid) {
			var that = this;
			console.log("Route edit apigkid", apigkid);
			this.clientpool.ready(function() {
				var apigk = that.clientpool.getAPIGK(apigkid);
				that.apigkeditor.edit(apigk, tabid);
			});


		},
		"routeMainlisting": function() {
			console.log("ABOUT");
			this.setHash('/');
			this.mainlisting.load();
		}



	});


	return App;
});
