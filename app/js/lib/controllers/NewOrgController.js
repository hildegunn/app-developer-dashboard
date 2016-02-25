	define(function(require, exports, module) {

	"use strict";

	var
		Pane = require('./Pane'),

		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		$ = require('jquery');

	var template = require('text!templates/neworg.html');
	var orginfotemplate = require('text!templates/orginfo.html');

	require('selectize');


	var sf = function(a, b) {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		return 0;
	};

	var NewOrgController = Pane.extend({
		"init": function(app) {
			this.app = app;
			this.template = new TemplateEngine(template, this.app.dict);
			this.orginfotemplate = new TemplateEngine(orginfotemplate, this.app.dict);
			this._super();

			this.selectedOrg = null;

			this.ebind('change', '#newselectorg', 'actSelectOrg');
			this.ebind('click', '.actSubmit', 'actSubmit');
		},

		"actSubmit": function(e) {
			e.preventDefault(); e.stopPropagation();

			if (this.selectedOrg === null) {
				var org = {};
				org.name = this.el.find('#newOrgName').val();
				org.orgnumber = this.el.find('#newOrgNumber').val();
				org.email = this.el.find('#email').val();
				org.message = this.el.find('#message').val();
				// console.error("New org registered", org);

			} else {
				// console.error("About to request role at ", this.selectedOrg);
			}

			
			
			alert("Not yet implemented!");
		},

		"actSelectOrg": function(e) {
			var orgid = $(e.currentTarget).val();
			var org = this.getOrg(orgid);
			console.log("ORG IS ", org, "[" + orgid + "]");
			this.selectedOrg = org;

			if (org === null) {
				if (orgid !== '') {
					this.showNewOrg(orgid);
				}
			} else {
				this.showOrg(org);
			}
			
		},

		"showNewOrg": function(name) {
			this.el.find('#neworgregister').show();
			this.el.find('#newOrgName').val(name).focus();
			this.el.find('#newOrgNumber').focus();
			this.el.find('#orgresult').empty();
		},
		"showOrg": function(org) {
			var _config = this.app.feideconnect.getConfig();
			var view = {
				"_config": _config,
				"org": org
			};
			this.el.find('#neworgregister').hide();
			return this.orginfotemplate.render(this.el.find('#orgresult').empty(), view);
		},

		"getOrg": function(orgid) {
			for(var i = 0; i < this.orgs.length; i++) {
				if (this.orgs[i].id === orgid) {
					return this.orgs[i];
				}
			}
			return null;
		},


		"initLoad": function() {
			var that = this;
			return this.loadOrgs()
				.then(that.proxy("draw"))
				.then(that.proxy("setupUI"))
				.then(that.proxy("_initLoaded"))
				.catch(function(err) {
					console.error("Error loading NewOrgController ", err);
				});
		},

		"loadOrgs": function() {
			var that = this;
			return this.app.feideconnect.getOrgs()
				.then(function(orgs) {
					that.orgs = orgs.sort(sf);
				});
		},

		"activate": function() {
			this.initLoad();
			this._super();

			this.app.setHash('/_neworg');
			this.app.bccontroller.hide();
		},

		"draw": function() {
			var view = {
				"orgs": this.orgs
			};

			var user = this.app.feideconnect.getUser();
			var _config = this.app.feideconnect.getConfig();
			user.profile = _config.apis.core + '/userinfo/v1/user/media/' + user.profilephoto;

			view.userinfo = user;

			// console.error("VIEW is ", view);
			this.el.children().detach();
			return this.template.render(this.el, view);
		},

		"setupUI": function() {
			$('#newselectorg').selectize({
				create: true,
				sortField: 'text'
			});
		}

	});

	return NewOrgController;

});