define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('../Controller'),
		EventEmitter = require('../../EventEmitter'),
		Dictionary = require('../../Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		OrgStatus = require('../../models/OrgStatus'),
		LDAPStatus = require('../../models/LDAPStatus'),
		utils = require('../../utils')

	;

	var template = require('text!templates/SimpleStatus.html');
	var templateldapstatus = require('text!templates/ldapstatus.html');
	var porgoperations = require('text!templates/partials/POrgOperations.html');



	var SimpleStatusController = Controller.extend({
		"init": function(feideconnect, orgid, usercontext) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgid = orgid;
			this.usercontext = usercontext;

			this.elLDAP = $('<div></div>');

			this._super();

			this.dict = new Dictionary();
			this.tmp = new TemplateEngine(template, this.dict);
			this.tmp.loadPartial("porgoperations", porgoperations);
			this.tmpLDAP = new TemplateEngine(templateldapstatus, this.dict);
			
			this.ebind("click", ".actRepeat", "actRepeat");

			this.ebind("click", ".actAvtale0", "actAvtale");
			this.ebind("click", ".actAvtale1", "actAvtaleOff");
			this.ebind("click", ".actSok0", "actSok");
			this.ebind("click", ".actSok1", "actSokOff");
			this.ebind("click", ".actGrupper0", "actGroups");
			this.ebind("click", ".actGrupper1", "actGroupsOff");
			this.ebind("click", ".actGeo", "actGeo");
			this.ebind("click", ".actSaveGeo", "actSaveGeo");
			this.ebind("click", ".actCancelGeo", "actCancelGeo");
			

			this.el.on("dragover", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			});
			this.el.on("dragenter", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			});
			this.el.on("drop", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }

				// console.log("Drop event object", e);

				var files = e.originalEvent.dataTransfer.files;
				for (var i=0; i<files.length; i++) {
					var file = files[i];

					that.logoUploaded(file);


				}
				return false;
			});

		},



		"logoUploaded": function(data) {
			var that = this;
			// console.log("About to upload image", this.current.id, data);
			that.feideconnect.orgUpdateLogo(this.orgid, data)
				.then(function() {
					var _config = that.feideconnect.getConfig();
					var url = _config.apis.core + "/orgs/" + that.orgid + "/logo?r=" + utils.guid();
					that.el.find('.itemlogo').attr("src", url);
				})
				.catch(function(err) {
					// console.error(err);
					that.app.app.setErrorMessage("Error uploading logo", "danger", err);
				});
		},




		"actGeo": function(e) {
			e.preventDefault(); 
			this.el.find("#geoeditorcontainer").show();


			this.el.find("#geoeditor").text(this.orgstatus.getGeoTxt() );
		},



		"actCancelGeo": function(e) {
			this.el.find("#geoeditorcontainer").hide();	
		},
		"actSaveGeo": function(e) {
			

			try {
				var geotxt = this.el.find("#geoeditor").val();
				console.log("Got text", geotxt);
				var geo = JSON.parse(geotxt);


				var uiinfo = this.orgstatus.uiinfo || {};
				uiinfo.geo = geo;

				console.log("GEO is", geo);
				this.feideconnect.updateOrg(this.orgid, {
					"uiinfo": uiinfo
				})
					.then(this.proxy("loadOrg"))
					.then(this.proxy("draw"));

				this.el.find("#geoeditorcontainer").hide();
			} catch (err) {
				console.error("err", err);
				alert("Invalid syntax.", err.message)
			}
			

		},

		"serviceMod": function(service, add) {
			var that = this;


			if (add) {
				return this.feideconnect.orgServiceAdd(this.orgid, service)
					.then(this.proxy("loadOrg"))
					.then(this.proxy("draw"));
			} else {
				return this.feideconnect.orgServiceRemove(this.orgid, service)
					.then(this.proxy("loadOrg"))
					.then(this.proxy("draw"));
			}


		},

		"actAvtale": function(e) {
			e.preventDefault(); 
			this.serviceMod("avtale", true);
		},

		"actAvtaleOff": function(e) {
			e.preventDefault(); 
			this.serviceMod("avtale", false);
		},

		"actSok": function(e) {
			e.preventDefault();

			this.feideconnect.updateOrg(this.orgid, {
				"has_peoplesearch": true
			})
				.then(this.proxy("loadOrg"))
				.then(this.proxy("draw"));
		},

		"actSokOff": function(e) {
			e.preventDefault(); 
			this.feideconnect.updateOrg(this.orgid, {
				"has_peoplesearch": false
			})
				.then(this.proxy("loadOrg"))
				.then(this.proxy("draw"));
		},

		"actGroups": function(e) {
			e.preventDefault(); 
			this.serviceMod("fsgroups", true);
		},

		"actGroupsOff": function(e) {
			e.preventDefault(); 
			this.serviceMod("fsgroups", false);
		},




		"initLoad": function() {
			// console.error("ORG LOAD ...");
			var that = this;
			this.loadOrg()
				.then(this.proxy("draw"))
				.then(this.proxy("loadLDAPstatus"))
				.then(this.proxy("_initLoaded"));

		},

		"loadOrg": function() {
			var that = this;
			return this.feideconnect._requestPublic('core', '/orgs/' + this.orgid)
				.then(function(orgstatus) {
					// console.error("ORGSTATUS", orgstatus)
					that.orgstatus = new OrgStatus(orgstatus);

				});
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

			view._config = this.feideconnect.config;
			view.isPlatformAdmin = this.usercontext.isPlatformAdmin();
			// console.error("About to render", view);
			this.el.children().detach();
			return this.tmp.render(this.el, view)
				.then(function() {
					that.el.find('#ldapstatuscontainer').append(that.elLDAP);
				});
		}



	}).extend(EventEmitter);


	return SimpleStatusController;
});