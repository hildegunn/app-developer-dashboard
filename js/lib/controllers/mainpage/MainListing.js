define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		ClientCreate = require('../createwidgets/ClientCreate'),
		APIGKCreate = require('../createwidgets/APIGKCreate'),
		EventEmitter = require('../../EventEmitter'),
		utils = require('../../utils'),
		$ = require('jquery')
		;
	var 
		template = require('text!templates/MainListing.html'),
		templateC = require('text!templates/MainListingClients.html'),
		templateA = require('text!templates/MainListingAPIGKs.html')
		;




	/*
	 * This controller controls 
	 */
	var MainListing = Pane.extend({
		"init": function(feideconnect) {

			console.log("initiator (MainListing)");

			var that = this;
			this.feideconnect = feideconnect;


			this._super();

			this.dict = new Dictionary();


			dust.loadSource(dust.compile(template, "mainlisting"));
			dust.loadSource(dust.compile(templateC, "mainlistingC"));
			dust.loadSource(dust.compile(templateA, "mainlistingA"));


			this.elClients = $("<div></div>");
			this.elAPIGKs = $("<div></div>");

			this.templateLoaded = false;
			this.elClientsAttached = false;
			this.elAPIGKsAttached = false;


			this.clientcreate = new ClientCreate();
			this.clientcreate.onSubmit(function(obj) {
				console.log("Create new obj", obj);
				that.emit("clientCreate", obj);
			});


			this.apigkcreate = new APIGKCreate(this.feideconnect);
			this.apigkcreate.onSubmit(function(obj) {
				console.log("Create new obj", obj);
				that.emit("apigkCreate", obj);
			});

			this.el.on("click", "#registerNewClient", function() {
				that.clientcreate.activate();
			});
			this.el.on("click", "#registerNewAPIGK", function() {
				that.apigkcreate.activate();
			});


			this.ebind("click", ".clientEntry", "selectedClient");
			this.ebind("click", ".apigkEntry", "selectedAPIGK");



			setTimeout(function() {
				// TODO: This API fails. Should be fixed. 
				// that.feideconnect.apigkClientRequests().
				// 	then(function(data) {
				// 		console.log("DATA CLIENT REQUESTS...", data);
				// 	});

			}, 1000);




		},
		"selectedClient": function(e) {
			e.preventDefault(); // e.stopPropgate();
			var clientid = $(e.currentTarget).data('clientid');
			this.emit('clientSelected', clientid);
		},

		"selectedAPIGK": function(e) {
			e.preventDefault(); // e.stopPropgate();
			var apigkid = $(e.currentTarget).data('apigkid');
			this.emit('apigkSelected', apigkid);
		},

		"updateClients": function(clients) {

			var 
				that = this,
				key,
				clientlist = [],
				view;

			for (key in clients) {
				if (clients.hasOwnProperty(key)) {
					clientlist.push(clients[key].getView());
				}
			}

			clientlist.sort(function(a, b) {
				if (a.updated < b.updated) {
					return 1;
				}
				if (a.updated > b.updated) {
					return -1;
				}
				return 0;
			});

			view = {
				"clients": clientlist,
				"random": utils.guid(),
				"_config": that.feideconnect.getConfig(),
				"_": that.dict.get()
			};

			dust.render("mainlistingC", view, function(err, out) {
				that.elClients.empty().append(out);
				if (!that.elClientsAttached && that.templateLoaded) {
					that.el.find('#listingClients').append(that.elClients);
					that.elClientsAttached = true;
				}
			});


		},

		"updateAPIGKs": function(apigks) {

			var 
				that = this,
				key,
				apigklist = [],
				view;

			for (key in apigks) {
				if (apigks.hasOwnProperty(key)) {
					apigklist.push(apigks[key].getView());
				}
			}

			apigklist.sort(function(a, b) {
				if (a.updated < b.updated) {
					return 1;
				}
				if (a.updated > b.updated) {
					return -1;
				}
				return 0;
			});

			view = {
				"apigks": apigklist,
				"random": utils.guid(),
				"_config": that.feideconnect.getConfig(),
				"_": that.dict.get()
			};

			dust.render("mainlistingA", view, function(err, out) {
				that.elAPIGKs.empty().append(out);
				if (!that.elAPIGKsAttached && that.templateLoaded) {
					that.el.find('#listingAPIGKs').append(that.elAPIGKs);
					that.elAPIGKsAttached = true;
				}
			});
		},

		"load": function() {
			this.draw(true);
		},
		
		"draw": function(act) {
			var that = this;

			view = {
				"_": that.dict.get()
			};

			dust.render("mainlisting", view, function(err, out) {
				that.el.empty().append(out);
				that.el.find('#listingClients').append(that.elClients);
				that.el.find('#listingAPIGKs').append(that.elAPIGKs);

				that.elClientsAttached = true;
				that.elAPIGKsAttached = true;
				that.templateLoaded = true;

			});
	
			if (act) {
				this.activate();
			}

		}
	}).extend(EventEmitter);

	return MainListing;

});
