define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('../Controller'),
		EventEmitter = require('../../EventEmitter'),
		TemplateEngine = require('../../TemplateEngine'),
		OrgStatus = require('../../models/OrgStatus'),
		LDAPStatus = require('../../models/LDAPStatus')

		;

	var template = require('text!templates/SimpleStatus.html');



	var SimpleStatusController = Controller.extend({
		"init": function(feideconnect, orgid) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgid = orgid;

			this._super();

			this.tmp = new TemplateEngine(template);
			// this.ebind("click", ".actManageAPIAuth", "actManageAPIAuth");

		},



		// "actManageAPIAuth": function(e) {
		// 	e.preventDefault();
		// 	this.emit("manageAPIAuth");
		// },

		"initLoad": function() {
			// console.error("ORG LOAD ...");
			var that = this;
			return this.feideconnect._requestPublic('core', '/orgs/' + this.orgid)
				.then(function(orgstatus) {
					// console.error("ORGSTATUS", orgstatus)
					that.orgstatus = new OrgStatus(orgstatus);
				})
			        .then(function() {
                                    var path = '/orgs/' + that.orgid + '/ldap_status';
                                    return that.feideconnect._request('core', path, null, ['orgadmin']);
				})
			        .catch(function(err) {
				    // No ldap endpoints if ldap_status fails
				    return new Object();
				})
				.then(function(ldapstatus) {
				    console.error("Data fra ldapstatus", ldapstatus);
					that.ldapstatus = new LDAPStatus({"data": ldapstatus});
				})
				.then(this.proxy("draw"))
				.then(this.proxy("_initLoaded"));

		},


		"draw": function() {

			var that = this;
			var view = this.orgstatus.getView();
			view.ldapstatus = this.ldapstatus.getView();

			// console.error("About to render", view);
			return this.tmp.render(this.el, view);
		}



	}).extend(EventEmitter);


	return SimpleStatusController;
});
