define(function(require, exports, module) {
	"use strict";	

	var 
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		EventEmitter = require('../../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		$ = require('jquery')
		;

	var 
		template = require('text!templates/OrgAdmin.html')
		;


	var clientsort = function(a,b) {
		if (a.madatory === b.mandatory) {return 0;}
		if (a.mandatory) { return -1;}
		if (b.mandatory) { return 1;}
	};

	/*
	 * This controller controls 
	 */
	var OrgAdminPane = Pane.extend({
		"init": function(feideconnect, orgapp, publicClientPool, orgAdminClients) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgapp = orgapp;
			this.publicClientPool = publicClientPool;
			this.publicClientPool.on('clientsChange', function(clients) {that.process();that.draw();});
			this.orgAdminClients = orgAdminClients;

			this._super();

			this.dict = new Dictionary();
			this.tmp = new TemplateEngine(template, this.dict);

			this.ebind("click", ".actSetMandatory", "actSetMandatory");
			this.ebind("click", ".actRemoveMandatory", "actRemoveMandatory");

		},


		"process": function() {


			var mand = this.orgAdminClients.getClients();
			var mandIndex = {};
			for(var i = 0; i < mand.length; i++) {
				mandIndex[mand[i].id] = true;
			}


			this.clients = this.publicClientPool.getClients();
			for(var key in this.clients) {
				this.clients[key].mandatory = mandIndex.hasOwnProperty(key);
			}

		},

		"actSetMandatory": function(e) {
			e.preventDefault();
			var that = this;
			var clientid = $(e.currentTarget).closest(".clientEntry").data("clientid");
			return this.feideconnect.setMandatoryClient(this.orgapp.getID(), clientid)
				.then(function() {
					return that.orgAdminClients.load();
				})
				.then(this.proxy("process"))
				.then(this.proxy("draw"));

		},
		"actRemoveMandatory": function(e) {
			e.preventDefault();
			var that = this;
			var clientid = $(e.currentTarget).closest(".clientEntry").data("clientid");
			return this.feideconnect.removeMandatoryClient(this.orgapp.getID(), clientid)
				.then(function() {
					return that.orgAdminClients.load();
				})
				.then(this.proxy("process"))
				.then(this.proxy("draw"));
		},

		"initLoad": function() {

			var that = this;

			return Promise.all([
				that.publicClientPool.onLoaded(),
				that.orgAdminClients.onLoaded()
			])
				.then(this.proxy("process"))
				.then(function() {
					return that.draw();
				})
				.then(this.proxy("_initLoaded"));


		},

		"draw": function() {
			var clientview = [];
			for(var key in this.clients) {
				var x = this.clients[key].getView();
				x.mandatory = !!this.clients[key].mandatory;
				clientview.push(x);
			}

			clientview.sort(clientsort);


			var view = {
				"clients": clientview
			};
			// console.error("View is", view);
			this.el.children().detach();
			return this.tmp.render(this.el, view);

		},
		"activate": function() {
			this.orgapp.app.bccontroller.draw([
				this.orgapp.getBCItem(),
				{
					"title": 'Manage mandatory applications',
					"active": true
				}
			]);
			return this._super();
		}
	}).extend(EventEmitter);

	return OrgAdminPane;

});
