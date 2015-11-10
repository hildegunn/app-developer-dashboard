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
	var templateldapstatus = require('text!templates/ldapstatus.html');



	var SimpleStatusController = Controller.extend({
		"init": function(feideconnect, orgid) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgid = orgid;

			this.elLDAP = $('<div></div>');

			this._super();

			this.tmp = new TemplateEngine(template);
			this.tmpLDAP = new TemplateEngine(templateldapstatus);
			this.ebind("click", ".actRepeat", "actRepeat");

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

					// that.loadLDAPstatus();
				})
				.then(this.proxy("draw"))
				.then(this.proxy("loadLDAPstatus"))
				.then(this.proxy("_initLoaded"));

		},

		"loadLDAPstatus": function() {
			var that = this;
			var path = '/orgs/' + that.orgid + '/ldap_status';
			that.feideconnect._request('core', path, null, ['orgadmin'])
				.then(function(ldapstatus) {

					that.ldapstatus = new LDAPStatus({
						"data": ldapstatus
					});
					var view = {
						"ldapstatus": that.ldapstatus
					};
					// console.error("Data fra ldapstatus", ldapstatus);
					return that.tmpLDAP.render(that.elLDAP.empty(), view);
					// return templateldapstatus.render($("body").empty(), view);
				});

		},

		"actRepeat": function() {
			this.elLDAP.empty();
			return this.loadLDAPstatus();
		},

		"draw": function() {

			// console.error("About to render", view);
			var that = this;
			var view = this.orgstatus.getView();
			// view.ldapstatus = this.ldapstatus.getView();

			// console.error("About to render", view);
			return this.tmp.render(this.el, view)
				.then(function() {
					that.el.find('#ldapstatuscontainer').append(that.elLDAP);
				});
		}



	}).extend(EventEmitter);


	return SimpleStatusController;
});