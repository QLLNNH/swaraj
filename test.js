'use strict';
const swaraj = require('./')();
const route_map = { test: { GET: [{ path: new RegExp('^/config/field$'), is_verify: false }] } };
const mongodb_config = {};

swaraj.init_mongo(mongodb_config);
swaraj.init_registry({ services: ['test'], port: 3000, route_map: route_map }, ['api']);
swaraj.init_distributer();
swaraj.init();

