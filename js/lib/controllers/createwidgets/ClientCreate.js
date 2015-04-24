define(function(require, exports, module) {
	"use strict";	


	var
		dust = require('dust'),
		utils = require('../../utils'),
		Dictionary = require('../../Dictionary'),
		Controller = require('../Controller'),
		TemplateEngine = require('../../TemplateEngine'),
		EventEmitter = require('../../EventEmitter'),

		$ = require('jquery')

		;

	var template = require('text!templates/newClient.html');


	var ClientCreate = Controller.extend({
		"init": function(main) {

			this._super();

			this.main = main;
			this.dict = new Dictionary();
			this.template = new TemplateEngine(template);
			this.orgid = null;

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
				"_": this.dict.get(),
				"orgInfo": this.main.orgRoleSelector.getOrgInfo()
			};
			this.el.children().detach();
			return this.template.render(this.el, view);
		},


		"setOrg": function(orgid) {

			this.orgid = orgid;
			return this.reload();

		},

		"activate": function() {
			$(this.el).find(".modal").modal('show');
			$(this.el).find("#newClientName").focus();

		},		


		"submit": function() {

			var obj = {};

			// obj.id = $(this.element).find("#newClientIdentifier").val();
			obj.name = $(this.el).find("#newClientName").val();
			obj.descr = $(this.el).find("#newClientDescr").val();
			obj.redirect_uri = [$(this.el).find("#newClientRedirectURI").val()];
			obj.scopes_requested = ["userinfo"];
			obj.client_secret = utils.guid();

			if (this.orgid !== null) {
				obj.organization = this.orgid;	
			}
			
			this.emit("submit", obj);
			$(this.el).find(".modal").modal("hide");

		},

		"checkIfReady": function() {
			var name = this.el.find("#newClientName").val();
			if (name.length > 1) {
				$(this.el).find(".createNewBtn").removeClass("disabled");
			} else {
				$(this.el).find(".createNewBtn").addClass("disabled");
			}
		}

	}).extend(EventEmitter);


	return ClientCreate;

});