define(function(require, exports, module) {
	"use strict";	

	var 
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		EventEmitter = require('../../EventEmitter'),

		SimpleOrgAdminAPIAuth = require('../orgadmin/SimpleOrgAdminAPIAuth'),
		SimpleOrgAdminController = require('../orgadmin/SimpleOrgAdminController'),
		SimpleStatusController = require('../orgadmin/SimpleStatusController'),

	$ = require('jquery')
		;

	var 
		template = require('text!templates/HostOrgMain.html');

	var HostOrgMain = Pane.extend({
		"init": function(mainlisting, feideconnect, orgAdminClients, orgAdminAPIs, usercontext, orgid) {
			var that = this;
			this._super();

			this.mainListing = mainlisting;

			this.dict = new Dictionary();
			this.template = new TemplateEngine(template, this.dict, true);

			this.simpleOrgAdminView = new SimpleOrgAdminController(feideconnect, orgAdminClients, usercontext);
			this.simpleOrgAdminView.initLoad();

			this.simpleOrgAdminView.on("manageMandatory", function() {
				that.emit("manageMandatory");
			});

			this.orgAdminStatus = new SimpleStatusController(feideconnect, orgid, usercontext);
			this.orgAdminStatus.initLoad();

			this.simpleOrgAdminAPI = new SimpleOrgAdminAPIAuth(feideconnect, orgAdminAPIs);
			this.simpleOrgAdminAPI.initLoad();
			this.simpleOrgAdminAPI.on("manageAPIAuth", function() {
				that.emit("manageAPIAuth");
			});

			this.initLoad();
		},

		"initLoad": function() {
			this.draw(false)
				.then(this.proxy("_initLoaded"));
		},
		
		"draw": function() {
			var that = this;

			var view = {};

			return that.template.render(that.el, view).then(function() {
				that.el.find('.mainlisting').append(that.mainListing.el);
				that.el.find(".simpleOrgAdminView").show().append(that.simpleOrgAdminView.el);
				that.el.find(".simpleOrgAdminAPI").show().append(that.simpleOrgAdminAPI.el);
				that.el.find(".simpleOrgAdminStatus").show().append(that.orgAdminStatus.el);
			});
		}

	}).extend(EventEmitter);

	return HostOrgMain;

});
