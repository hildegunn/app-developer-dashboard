define(function(require, exports, module) {

	var 
		JSO = require('bower/jso/src/jso');
		

	JSO.enablejQuery($);


	var FeideConnect = function(config) {

		var fcDev = {
			providerId: "feideconnect-dev",
			authorization: "https://auth.dev.feideconnect.no/oauth/authorization",
			token: "https://auth.dev.feideconnect.no/oauth/token",
			apis: {
				"auth": "https://auth.dev.feideconnect.no",
				"core": "http://api.dev.feideconnect.no:6543"
			}
		};
		var fcPilot = {
			providerId: "feideconnect-pilot",
			authorization: "https://auth.feideconnect.no/oauth/authorization",
			token: "https://auth.dev.feideconnect.no/oauth/token",
			apis: {
				"auth": "https://auth.feideconnect.no",
				"core": "http://api.dev.feideconnect.no:6543"
			}
		};
		var fcDevRunscope = {
			providerId: "feideconnect-dev",
			authorization: "https://auth.dev.feideconnect.no/oauth/authorization",
			apis: {
				"auth": "https://auth.dev.feideconnect.no",
				"core": "http://api.dev.feideconnect.no:6543"
			}
		};

		var defaults = {
			"autologin": false
		};


		var selectedConfig = {};
		if (config.instance && config.instance === 'dev') {
			selectedConfig = fcDev;
		}
		if (config.instance && config.instance === 'pilot') {
			selectedConfig = fcPilot;
		}



		this.config = $.extend({}, selectedConfig, defaults, config);

		this.jso = new JSO(this.config);
		console.log("JSO LOAded", this.jso);
		this.jso.callback();


		this.callbacks = {
			"onStateChange": null
		};

		this.authState = null;
		this.userinfo = null;

		if (this.config.autologin) {
			this.authenticate();

		} else {
			this.check();
		}	


	};

	FeideConnect.prototype.getConfig = function() {

		return this.config;

	};


	FeideConnect.prototype.logout = function() {

		this.jso.wipeTokens();
		this.userinfo = null;
		this.setAuthState(false);

	};

	FeideConnect.prototype.authenticate = function() {

		var that = this;
		this._request('auth', '/userinfo', null, ['userinfo'], function(res) {

			if  (res.audience !== that.config.client_id) {
				throw 'Wrong audience for this token.';
			}
			that.userinfo = res.user;
			that.setAuthState(true);

		});		

	};


	FeideConnect.prototype.psOrgs = function(callback) {
		var path = "peoplesearch/orgs";
		this._request('core', '/peoplesearch/orgs', null, ['peoplesearch'], callback);		
	};

	FeideConnect.prototype.psSearch = function(realm, query, callback) {
		var path = "/peoplesearch/search/" + realm + "/" + encodeURI(query);
		this._request('core', path, null, ['peoplesearch'], callback);		
	};

	
	FeideConnect.prototype.clientsList = function(callback) {
		var path = "/clientadm/clients/";
		this._request('core', path, null, ['clientadmin'], callback);		
	};

	FeideConnect.prototype.clientsRegister = function(obj, callback) {
		var path = "/clientadm/clients/";
		this._requestObj('POST', 'core', path, null, ['clientadmin'], obj, callback);
	};

	FeideConnect.prototype.clientsUpdate = function(obj, callback) {
		var path = "/clientadm/clients/" + obj.id;
		this._requestObj('PATCH', 'core', path, null, ['clientadmin'], obj, callback);
	};
	FeideConnect.prototype.clientsDelete = function(clientid, callback) {
		var path = "/clientadm/clients/" + clientid;
		this._requestObj('DELETE', 'core', path, null, ['clientadmin'], null, callback);
	};

	

	FeideConnect.prototype.clientsUpdateLogo = function(id, obj, callback) {
		var path = "/clientadm/clients/" + id + "/logo";
		var contenttype = obj.contenttype;
		console.log("File content type: " + contenttype);
		contenttype = "image/jpeg";
		this._requestBinary('POST', 'core', path, null, ['clientadmin'], obj, contenttype, callback);

	};


	FeideConnect.prototype.apigkList = function(callback) {
		var path = "/apigkadm/apigks/";
		this._request('core', path, null, ['apigkadmin'], callback);			
	};
	FeideConnect.prototype.apigkRegister = function(obj, callback) {
		var path = "/apigkadm/apigks/";
		this._requestObj('POST', 'core', path, null, ['apigkadmin'], obj, callback);
	};
	FeideConnect.prototype.apigkUpdate = function(obj, callback) {
		var path = "/apigkadm/apigks/" + obj.id;
		// delete obj.id;
		// var x = {name: obj.name};
		this._requestObj('PATCH', 'core', path, null, ['apigkadmin'], obj, callback);	
	};
	FeideConnect.prototype.apigkDelete = function(id, callback) {
		var path = "/apigkadm/apigks/" + id;
		this._requestObj('DELETE', 'core', path, null, ['apigkadmin'], null, callback);
	};
	FeideConnect.prototype.apigkUpdateLogo = function(id, obj, callback) {
		var path = "/apigkadm/apigks/" + id + "/logo";
		var contenttype = obj.contenttype;
		console.log("File content type: " + contenttype);
		contenttype = "image/jpeg";
		this._requestBinary('POST', 'core', path, null, ['apigkadmin'], obj, contenttype, callback);
	};
	FeideConnect.prototype.apigkCheck = function(id, callback) {
		var path = "/apigkadm/apigks/" + id + "/exists";
		this._request('core', path, null, ['apigkadmin'], callback);	
	};




	FeideConnect.prototype.setAuthState = function(ns) {

		if (this.authState === ns) return;

		this.authState = ns;
		if (typeof this.callbacks.onStateChange === 'function') {
			this.callbacks.onStateChange(this.authState, this.userinfo);
		}

	};

	FeideConnect.prototype.onStateChange = function(callback) {
		this.callbacks.onStateChange = callback;
	};

	// FeideConnect.prototype._requestBinary2 = function(method, instance, endpoint, request, require, data, contentType, callback) {


	// 	var form = new FormData();
	// 	form.append("file", new Blob([data], {type: 'image/png'}));

	// 	var url = this.config.apis[instance] + endpoint;
	// 	url = 'http://andreas.uninettlabs.no/upload/index2.php';
	// 	console.log("About to perform a JSO OAuth request to " + instance + " [" + url + "]");

	// 	this.jso.ajax({
	// 		url: url,
	// 		type: method,
	// 		data: data,
	// 		contentType: "multipart/form-data",
	// 		oauth: {
	// 			scopes: {
	// 				request: request,
	// 				require: require
	// 			}
	// 		},
	// 		dataType: 'json',
	// 		success: function(data) {
	// 			callback(data);
	// 		}
	// 	});


	// };


	FeideConnect.prototype._requestBinary = function(method, instance, endpoint, request, require, data, contentType, callback) {


		var url = this.config.apis[instance] + endpoint;
		// url = 'http://andreas.uninettlabs.no/upload/';
		// url = "http://api-dev-feideconnect-no-nk2qnlpqohtb.runscope.net/";
		console.log("About to perform a JSO OAuth request to " + instance + " [" + url + "]");

		var headers = {
			// "Runscope-Request-Port": "6543"
		};

		this.jso.ajax({
			url: url,
			type: method,
			data: data,
			contentType: contentType,
			processData: false,
			headers: headers,
			oauth: {
				scopes: {
					request: request,
					require: require
				}
			},
			success: function(data) {
				callback(data);
			}
		});


	};


	FeideConnect.prototype._requestObj = function(method, instance, endpoint, request, require, data, callback) {


		var url = this.config.apis[instance] + endpoint;

		console.log("About to perform a JSO OAuth request to " + instance + " [" + url + "]");

		this.jso.ajax({
			url: url,
			type: method,
			data: JSON.stringify(data, undefined, 2),
			contentType: 'application/json; charset=UTF-8',
			oauth: {
				scopes: {
					request: request,
					require: require
				}
			},
			dataType: 'json',
			success: function(data) {
				callback(data);
			}
		});
	};

	FeideConnect.prototype._request = function(instance, endpoint, request, require, callback) {


		var url = this.config.apis[instance] + endpoint;

		console.log("About to perform a JSO OAuth request to " + instance + " [" + url + "]");

		this.jso.ajax({
			url: url,
			oauth: {
				scopes: {
					request: request,
					require: require
				}
			},
			dataType: 'json',
			success: function(data) {
				callback(data);
			}
		});


	};


	FeideConnect.prototype.check = function() {

		console.log("JSO LOAded", this.jso);
		var token = this.jso.checkToken({
			"scopes": {
				"require": ["userinfo"]
			}
		});

		if (token) {
			console.log("Check for token YES");
			this.authenticate();
		} else {
			console.log("Check for token NO");
		}


	};


	exports.FeideConnect = FeideConnect;

});