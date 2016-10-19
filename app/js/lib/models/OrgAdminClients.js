define(function(require, exports, module) {
	"use strict";	


	var 
		// $ = require('jquery'),
		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client')

		;


	var OrgAdminClients = Controller.extend({
		"init": function(feideconnect, orgid) {

			var that = this;

			this.feideconnect = feideconnect;
			this.orgid = orgid;

			this.clients = [];
			
			this._super();

		},

		"initLoad": function() {
			return this.load()
				.then(this.proxy("_initLoaded"));

		},

		"getClients": function() {
			return this.clients;
		},

		"load": function() {
			var that = this;
			return this.feideconnect.getMandatoryClients(this.orgid)
				.then(function(clients) {

					that.clients = [];
					for (var i = 0; i < clients.length; i++) {
						that.clients.push(new Client(clients[i]));
					}
					that.emit('clientsChange');
				});
		}



	}).extend(EventEmitter);
	OrgAdminClients._CLASSNAME = 'OrgAdminClients';
	return OrgAdminClients;




});

