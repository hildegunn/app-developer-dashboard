#!/usr/bin/env bash
set -e # halt script on error
#app=$(jq -r .name nova.config.json)
app=dataporten_dashboard
hostnameapp=dashboard
oldapp="${app}-old"
domain="dataporten.no"

echo "Ready to deploy updated version of ${domain}"

. ~/cf-login.sh
cf target -o system -s prod

cp app/etc/config.template.js app/etc/config.js

npm install
node_modules/grunt-cli/bin/grunt build
#npm prepublish

if cf app "${app}" |egrep -q '#.*running'
then
    first='n'
    if cf app "${oldapp}"
    then
        cf delete -f "${oldapp}"
    fi
    cf rename "${app}" "${oldapp}"
else
    first='y'
fi
cf push "${app}" -k 384M -m 128M -i 2
cf map-route "${app}" "${domain}" -n "${hostnameapp}"

if [ "${first}" = 'n' ]
then
    cf unmap-route "${oldapp}" "${domain}"
    cf stop "${oldapp}"
fi

echo "Done."
