define(function(require, exports, module) {


	var
		dust = require('dust'),
		utils = require('../../utils'),
		Dictionary = require('../../Dictionary'),
		$ = require('jquery')
		;

	var template = require('text!templates/newAPIGK.html');






	var APIGKCreate = function(feideconnect) {

		var that = this;
		this.feideconnect = feideconnect;

		this.dict = new Dictionary();

		this.callback = null;
		
		this.verifiedidentifier = null;
		this.verified = false;
		this.verifytimer = null;

		console.log("Loaded dust ", dust);

		that.element = null;

		var x = dust.compile(template, "newapi");
		dust.loadSource(x);

		var view = {
			"_": that.dict.get()
		};
		dust.render("newapi", view, function(err, out) {
			console.log(out);

			that.element = $(out);
			$("div#modalContainer").append(that.element);

			that.element.on('keyup change', '#newAPIid', $.proxy(that.checkIfReady, that));
			that.element.on('keyup change', '#newAPIname', $.proxy(that.checkIfReady, that));
			that.element.on('keyup change', '#newAPIendpoint', $.proxy(that.checkIfReady, that));
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
			console.log("Create new object", obj);
			this.callback(obj);
			$(this.element).modal("hide");
		}

		// $(this.element).remove();
	};


	APIGKCreate.prototype.setStatus = function(ok, text) {

		if (ok === null) {

			$(this.element).find('.inputStateIDok').hide();
			$(this.element).find('.inputStateIDwaiting').css('display', 'table-cell');
			$(this.element).find('.inputStateIDwarning').hide();

		} else if (ok) {
			$(this.element).find('.inputStateIDok').hide();
			$(this.element).find('.inputStateIDwaiting').hide();
			$(this.element).find('.inputStateIDwarning').css('display', 'table-cell');
		} else {
			$(this.element).find('.inputStateIDok').css('display', 'table-cell');
			$(this.element).find('.inputStateIDwaiting').hide();
			$(this.element).find('.inputStateIDwarning').hide();
			$(this.element).find('span.inputStateIDwarningText').empty().append(text);
		}

	};


	APIGKCreate.prototype.checkPing = function(str) {


		var that = this;
		if(!this.checkCounter) this.checkCounter = 0;
		++this.checkCounter;

		console.log("Check ping " + this.checkCounter);

		setTimeout(function() {
			if (--that.checkCounter <= 0) {
				that.checkCounter = 0;

				console.error("Perform validation of ID " + str);

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



	};



	APIGKCreate.prototype.checkContinue = function(ready) {

		

		var identifier = $(this.element).find("#newAPIid").val();
		var name = $(this.element).find("#newAPIname").val(); 
		var endpoint = $(this.element).find("#newAPIendpoint").val();

		if (!identifier.match(/^[a-z0-9\-_]+$/)) {
			ready = false;
		}

		if (!endpoint || endpoint === '') {
			ready = false;
		}


		if (ready) {
			$(this.element).find(".createNewBtn").removeAttr("disabled");
		} else {
			$(this.element).find(".createNewBtn").attr("disabled", "disabled");
		}


	};


	APIGKCreate.prototype.checkIfReady = function() {

		console.log("check if ready");
		var that = this;
		var identifier = $(this.element).find("#newAPIid").val();



		if (!identifier) {
			ready = false;
			this.setStatus(false, 'Required');
			that.lastChecked = null;
			this.checkContinue(false);
		} else if  (identifier === '') {
			ready = false;
			this.setStatus(false, 'Required');
			that.lastChecked = null;
			this.checkContinue(false);
		} else if (!identifier.match(/^[a-z0-9\-_]+$/)) {
			ready = false;
			this.setStatus(false, 'Invalid characters');
			that.lastChecked = null;
			this.checkContinue(false);
		} else {

			if (identifier !== that.lastChecked) {
				this.checkPing(identifier);
				this.setStatus(null);		
			} else {
				this.checkContinue(true);	
			}
			

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