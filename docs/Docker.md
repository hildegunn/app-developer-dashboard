# Build Docker


Prerequisites:

	git clone git@scm.uninett.no:feide-connect/dataporten-resources.git


Build



	docker build -t eu.gcr.io/turnkey-cocoa-720/dataporten-app-dashboard .

Run

	docker stop dashboard && docker rm dashboard
	docker run -p 8091:8091 -d --name dashboard --env-file=./ENV -t eu.gcr.io/turnkey-cocoa-720/dataporten-app-dashboard



## Environment variables


	VCAP_APP_PORT=8091
	OIC_CLIENTID=df34f687-ff1b-419e-9b5c-55b49e4babad--xxx
	OIC_REDIRECT_URI=http://dashboard.dataporten.no:8091/


Optional

	VCAP_APP_HOST=dashboard.dataporten.no




## run in non-docker mode



	grunt build
	VCAP_APP_PORT=8091 OIC_CLIENTID=df34f687-ff1b-419e-9b5c-55b49e4babad OIC_REDIRECT_URI=http://dashboard.dataporten.no:8091/ npm start
