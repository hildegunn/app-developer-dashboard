define(function() {


	return {
		"userinfo": {
			"title": "Brukerinfo",
			"descr": "Basisinformasjon om brukere. BrukerID, navn og profilbilde.",
			"public": true,
			"policy": {
				"auto": true
			}
		},
		"userinfo-mail": {
			"title": "E-post",
			"descr": "Brukerens e-postadresse",
			"public": true,
			"policy": {
				"auto": false
			}
		},
		"userinfo-feide": {
			"title": "Feide-navn",
			"descr": "Brukerens identifikator i Feide. Tilsvarende eduPersonPrincipalName.",
			"public": true,
			"policy": {
				"auto": true
			}
		},
		"openid": {
			"title": "OpenID Connect",
			"descr": "Kilenten vil få utstedt en id_token og kunne bruke OpenID Connect for autentisering.",
			"public": true,
			"policy": {
				"auto": true
			}
		},
		"longterm": {
			"title": "Longterm",
			"descr": "Langvarig tilgang. Tilgang inntil brukeren trekker rettighetene tilbake.",
			"public": true,
		},
		"clientadm": {	
			"title": "Klient Admin",
			"descr": "Adminsitrer klienter",
			"public": false,
			"policy": {
				"auto": false
			}
		},
		"apigkadm": {	
			"title": "API Gatekeeper Admin",
			"descr": "Administrer API Gatekeeper instanser.",
			"public": false,
			"policy": {
				"auto": false
			}
		},
		"groups": {	
			"title": "Grupper",
			"descr": "Tilgang til basis gruppeinfo",
			"public": false,
			"policy": {
				"auto": false
			}
		}
	};

});