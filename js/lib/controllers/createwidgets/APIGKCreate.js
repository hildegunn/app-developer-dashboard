define(function(require, exports, module) {


	var
		dust = require('dust')
		;

	var template = require('text!templates/newAPIGK.html');






	var APIGKCreate = function() {

		var that = this;

		// this.container = container;
		this.callback = null;
		
		this.verifiedidentifier = null;
		this.verified = false;
		this.verifytimer = null;

		console.log("Loaded dust ", dust);

		that.element = null;

		var x = dust.compile(template, "newapi");
		dust.loadSource(x);
		dust.render("newapi", {}, function(err, out) {
			console.log(out);

			that.element = $(out);
			$("div#modalContainer").append(that.element);

			that.element.on('keyup change', '#newAPIid', $.proxy(that.checkIfReady, that));
			that.element.on('click', '.createNewBtn', $.proxy(that.submit, that));

			console.log("third element", that.element);

			that.checkIfReady();
		});

	};

	APIGKCreate.prototype.onSubmit = function(callback) {

		this.callback = callback;

	};	


	APIGKCreate.prototype.submit = function() {

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

		obj.id = $(this.element).find("#newAPIid").val();
		obj.name = $(this.element).find("#newAPIname").val();
		obj.descr = $(this.element).find("#newAPIdescr").val();
		obj.endpoints = [$(this.element).find("#newAPIendpoint").val()];
		obj.expose = {
			"userid": true,
			"scopes": true,
			"clientid": true
		};
		obj.requireuser = true;
		// obj.scopedef =  {
		// 	"policy": {
		// 		"auto": false
		// 	}
		// };



		if (typeof this.callback === 'function') {
			console.log("Create new object", obj);
			this.callback(obj);
			$(this.element).modal("hide");
		}

		// $(this.element).remove();
	};



	APIGKCreate.prototype.checkIfReady = function() {
		console.log("check if ready");
		var name = this.element.find("#newAPIid").val();
		if (name && name.length && name.length > 1) {
			console.log("READY");
			// $(this.element).find(".createNewBtn").attr("disabled", "disabled");
			$(this.element).find(".createNewBtn").removeClass("disabled");
		} else {
			console.log("NOT READY");
			// $(this.element).find(".createNewBtn").removeAttr("disabled");
			
			$(this.element).find(".createNewBtn").addClass("disabled");
		}
	};



	APIGKCreate.prototype.activate = function() {
		var that =this;
		$(this.element).modal('show');
		setTimeout(function() {
			$(that.element).find("#newAPIid").focus();
		}, 600);
		
	};


	return APIGKCreate;

});