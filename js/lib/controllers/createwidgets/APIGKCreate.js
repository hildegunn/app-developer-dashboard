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

	var template = require('text!templates/newAPIGK.html');



	var APIGKCreate = Controller.extend({
		"init": function(feideconnect, main) {

			this._super();

			this.feideconnect = feideconnect;
			this.main = main;
			this.dict = new Dictionary();
			this.template = new TemplateEngine(template);
			this.orgid = null;

			this.verifiedidentifier = null;
			this.verified = false;
			this.verifytimer = null;

			this.ebind('keyup change', '#newAPIid', "checkIfReady");
			this.ebind('keyup change', '#newAPIendpoint', "checkIfReady");
			this.ebind('click', '.createNewBtn', "submit");

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



		"checkEndpoint": function() {
			var str = $(this.el).find("#newAPIendpoint").val();
			if (str.match(/^http[s]?:\/\/([^\/]+)$/)) {
				this.el.find(".endpointFormatDescr").addClass("endpointValidOK");
				this.el.find(".endpointFormatDescr").removeClass("endpointValidBad");
				return true;
			} else {
				this.el.find(".endpointFormatDescr").removeClass("endpointValidOK");
				this.el.find(".endpointFormatDescr").addClass("endpointValidBad");
				return false;
			}
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
			var that = this;
			$(this.el).find(".modal").modal('show');
			setTimeout(function() {
				$(that.el).find("#newAPIid").focus();
			}, 600);
		},		


		"submit": function() {

			/*
			CREATE TABLE feideconnect.apigk (
			    id text PRIMARY KEY,
			    created timestamp,
			    descr text,
			    endpoints list<text>,
			    expose text,
			    httpscertpinned text,
			    logo blob,
			    name text,
			    owner uuid,
			    requireuser boolean,
			    scopedef text,
			    status set<text>,
			    trust text,
			    updated timestamp
			 */

			var obj = {};

			obj.id = $(this.el).find("#newAPIid").val();
			obj.name = $(this.el).find("#newAPIname").val();
			obj.descr = $(this.el).find("#newAPIdescr").val();
			obj.endpoints = [$(this.el).find("#newAPIendpoint").val()];

			obj.expose = {
				"userid": true,
				"scopes": true,
				"clientid": true,
				"userid-sec": ["feide", "uuid"]
			};
			obj.requireuser = true;
			obj.trust = {
				"type": "basic",
				"username": "feideconnect",
				"password": utils.guid()
			};
			obj.scopedef =  {
				"title": "Basic access",
				"policy": {
					"auto": false
				}
			};

			if (typeof this.callback === 'function') {
				this.emit("submit", obj);
				$(this.el).find(".modal").modal("hide");
			}

		},

		"setStatus": function(ok, text) {

			if (ok === null) {

				$(this.el).find('.inputStateIDok').hide();
				$(this.el).find('.inputStateIDwaiting').css('display', 'table-cell');
				$(this.el).find('.inputStateIDwarning').hide();

			} else if (ok) {
				$(this.el).find('.inputStateIDok').hide();
				$(this.el).find('.inputStateIDwaiting').hide();
				$(this.el).find('.inputStateIDwarning').css('display', 'table-cell');
			} else {
				$(this.el).find('.inputStateIDok').css('display', 'table-cell');
				$(this.el).find('.inputStateIDwaiting').hide();
				$(this.el).find('.inputStateIDwarning').hide();
				$(this.el).find('span.inputStateIDwarningText').empty().append(text);
			}

		},

		"checkPing": function(str) {


			var that = this;
			if(!this.checkCounter) {
				this.checkCounter = 0;
			}
			++this.checkCounter;

			// console.log("Check ping " + this.checkCounter);

			setTimeout(function() {
				if (--that.checkCounter <= 0) {
					that.checkCounter = 0;


					that.lastChecked = str;

					that.feideconnect.apigkCheck(str, function(exists) {
						if (!exists) {
							that.setStatus(true);
							that.checkContinue(true);
						} else {
							that.setStatus(false, 'Already taken');
							that.checkContinue(false);
						}
					});

				}
			}, 400);

		},

		"checkContinue": function(ready) {

			

			var identifier = $(this.el).find("#newAPIid").val();
			var name = $(this.el).find("#newAPIname").val(); 
			var endpoint = $(this.el).find("#newAPIendpoint").val();

			if (!identifier.match(/^[a-z0-9\-_]+$/)) {
				ready = false;
			}

			if (!endpoint || endpoint === '') {
				ready = false;
			}


			if (ready) {
				$(this.el).find(".createNewBtn").removeAttr("disabled");
			} else {
				$(this.el).find(".createNewBtn").attr("disabled", "disabled");
			}


		},

		"checkIfReady": function() {

			var that = this;
			var identifier = $(this.el).find("#newAPIid").val();
			var ready = true;

			var endp = this.checkEndpoint();

			if (!endp) {
				ready = false;
			}

			if (!identifier) {
				ready = false;
				this.setStatus(false, 'Required');
				that.lastChecked = null;
			} else if  (identifier === '') {
				ready = false;
				this.setStatus(false, 'Required');
				that.lastChecked = null;
			} else if (!identifier.match(/^[a-z0-9\-_]+$/)) {
				ready = false;
				this.setStatus(false, 'Invalid characters');
				that.lastChecked = null;
			} else {

				if (identifier !== that.lastChecked) {
					this.checkPing(identifier);
					this.setStatus(null);		
				}
				
			}
			this.checkContinue(ready);

		}


	}).extend(EventEmitter);


	return APIGKCreate;

});