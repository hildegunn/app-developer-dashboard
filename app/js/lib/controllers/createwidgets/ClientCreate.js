define(function(require, exports, module) {
	"use strict";	


	var
		utils = require('../../utils'),
		Dictionary = require('../../Dictionary'),
		Controller = require('../Controller'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		EventEmitter = require('../../EventEmitter'),

		$ = require('jquery')

		;

	var template = require('text!templates/newClient.html');


	var ClientCreate = Controller.extend({
		"init": function(app) {

			this._super();

			this.app = app;
			this.dict = new Dictionary();
			this.template = new TemplateEngine(template, this.dict);

			this.ebind("change", "#newClientTOU", "checkIfReady");
			this.ebind("keyup change", "#newClientName", "checkIfReady");
			this.ebind("click", ".createNewBtn", "submit");

		},

		"initLoad": function() {
			var that = this;
			return this.draw()
				.then(function() {
					$("div#modalContainer").append(that.el);
					that.checkIfReady();
				})
				.then(this.proxy("_initLoaded"));
		},

		"reload": function() {
			return this.draw();
		},

		"draw": function() {
			var view = {
				// "_": this.dict.get(),
				"orgInfo": this.app.getOrgInfo()
			};
			this.el.children().detach();

			// console.error("Draw clientcreate", view);
			return this.template.render(this.el, view);
		},

		"activate": function() {
			$(this.el).find(".modal").modal('show');
			$(this.el).find("#newClientName").focus();
		},

		"submit": function(e) {

			e.preventDefault();

			var obj = {};

			// obj.id = $(this.element).find("#newClientIdentifier").val();
			obj.name = $(this.el).find("#newClientName").val();
			obj.descr = $(this.el).find("#newClientDescr").val();
			obj.redirect_uri = [$(this.el).find("#newClientRedirectURI").val()];
			obj.scopes_requested = ["userid", "profile"];
			obj.client_secret = utils.guid();
			obj.authproviders = ['feide|all', 'other|feidetest', 'other|idporten', 'other|openidp', 'social|all'];

			if (this.app.orgid !== "_") {
				obj.organization = this.app.orgid;	
			}
			
			this.emit("submit", obj);
			$(this.el).find(".modal").modal("hide");

		},

		"checkIfReady": function() {

			var isReady = true;
			var name = this.el.find("#newClientName").val();
			var tou = this.el.find("#newClientTOU").prop("checked");


			if (name.length < 1) {
				isReady = false;
			}

			if (!tou) {
				isReady = false;
			}


			if (isReady) {
				$(this.el).find(".createNewBtn").removeClass("disabled");
			} else {
				$(this.el).find(".createNewBtn").addClass("disabled");
			}
		}

	}).extend(EventEmitter);


	return ClientCreate;

});