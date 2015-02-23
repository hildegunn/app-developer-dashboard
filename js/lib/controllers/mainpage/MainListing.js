define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),


		ClientCreate = require('../createwidgets/ClientCreate'),
		APIGKCreate = require('../createwidgets/APIGKCreate'),
		EventEmitter = require('../../EventEmitter'),
		utils = require('../../utils'),
		$ = require('jquery')
		;
	var template = require('text!templates/MainListing.html');



	/*
	 * This controller controls 
	 */
	var MainListing = Pane.extend({
		"init": function(feideconnect) {

			console.log("initiator (MainListing)");

			var that = this;
			this.feideconnect = feideconnect;


			this._super();

			var x = dust.compile(template, "mainlisting");
			dust.loadSource(x);

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
			var key;
			var that = this;
			this.elClients.empty();

			for (key in clients) {

				that.elClients.append(

					'<a href="#" data-clientid="' + clients[key].id + '" class="list-group-item media clientEntry">' +
						'<div class="media-left">' + 
							'<img style="max-width: 48px; max-height: 48px" class="media-object" src="http://api.dev.feideconnect.no:6543/clientadm/clients/' + clients[key].id + '/logo?t=' + utils.guid() + '" alt="...">' +
						'</div>' + 
						'<div class="media-body">' + 
							'<h4 class="list-group-item-heading">' + utils.escape(clients[key].name) + '</h4>' +
							'<p class="list-group-item-text" style="font-size: 80%" ><i class="glyphicon glyphicon-chevron-right"></i> ' + (clients[key].id ) + '</p>' + 
							'<p class="list-group-item-text">' + (clients[key].descr ? utils.escape(clients[key].descr) : '') + '</p>' + 
						'</div>' +
					'</a>'
				);

			}
			if (!that.elClientsAttached && that.templateLoaded) {
				that.el.find('#listingClients').append(this.elClients);
				that.elClientsAttached = true;
			}
		},
		"updateAPIGKs": function(apigks) {


			var key;
			var that = this;
			this.elAPIGKs.empty();
			for (key in apigks) {

				that.elAPIGKs.append(

					'<a href="#" data-apigkid="' + apigks[key].id + '" class="list-group-item media apigkEntry">' +
						'<div class="media-left">' + 
							'<img style="max-width: 48px; max-height: 48px" class="media-object" src="http://api.dev.feideconnect.no:6543/apigkadm/apigks/' + apigks[key].id + '/logo?t=' + utils.guid() + '" alt="...">' +
						'</div>' + 
						'<div class="media-body">' + 
							'<h4 class="list-group-item-heading">' + utils.escape(apigks[key].name) + '</h4>' +
							'<p class="list-group-item-text" style="font-size: 80%" ><i class="glyphicon glyphicon-chevron-right"></i> ' + (apigks[key].id ) + '</p>' + 
							'<p class="list-group-item-text">' + (apigks[key].descr ? utils.escape(apigks[key].descr) : '') + '</p>' + 
						'</div>' +
					'</a>'
				);

			}
			if (!that.elAPIGKsAttached && that.templateLoaded) {
				that.el.find('#listingAPIGKs').append(this.elAPIGKs);
				that.elAPIGKsAttached = true;
			}

		},

		"load": function() {
			this.draw(true);
		},
		
		"draw": function(act) {
			var that = this;

			dust.render("mainlisting", {}, function(err, out) {
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
