define(function(require, exports, module) {


	var
		dust = require('dust')
		;

	var template = require('text!templates/newClient.html');






	var ClientCreate = function() {

		var that = this;

		// this.container = container;
		this.callback = null;
		
		this.verifiedidentifier = null;
		this.verified = false;
		this.verifytimer = null;

		console.log("Loaded dust ", dust);

		that.element = null;

		var x = dust.compile(template, "newclient");
		dust.loadSource(x);
		dust.render("newclient", {}, function(err, out) {
			console.log(out);

			that.element = $(out);
			$("div#modalContainer").append(that.element);

			that.element.on('keyup change', '#newClientName', $.proxy(that.checkIfReady, that));
			that.element.on('click', '.createNewBtn', $.proxy(that.submit, that));

			console.log("thid element", that.elemet);

			that.checkIfReady();
		});

	};

	ClientCreate.prototype.onSubmit = function(callback) {

		this.callback = callback;

	};	


	ClientCreate.prototype.submit = function() {

		var obj = {};

		// obj.id = $(this.element).find("#newClientIdentifier").val();
		obj.name = $(this.element).find("#newClientName").val();
		obj.descr = $(this.element).find("#newClientDescr").val();
		obj.redirect_uri = [$(this.element).find("#newClientRedirectURI").val()];
		obj.scopes_requested = ["userinfo"];
		// obj.type = 'client';


		if (typeof this.callback === 'function') {
			console.log("Create new object", obj);
			this.callback(obj);
			$(this.element).modal("hide");
		}

		// $(this.element).remove();
	};



	ClientCreate.prototype.checkIfReady = function() {
		console.log("check if ready");
		var name = this.element.find("#newClientName").val();
		if (name.length > 1) {
			console.log("READY");
			// $(this.element).find(".createNewBtn").attr("disabled", "disabled");
			$(this.element).find(".createNewBtn").removeClass("disabled");
		} else {
			console.log("NOT READY");
			// $(this.element).find(".createNewBtn").removeAttr("disabled");
			
			$(this.element).find(".createNewBtn").addClass("disabled");
		}
	};



	ClientCreate.prototype.activate = function() {
		$(this.element).modal('show');
		$(this.element).find("#newClientName").focus();
	};


	return ClientCreate;

});