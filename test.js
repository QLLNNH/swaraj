'use strict';
const swaraj = require('./')();
const route_map = { test: { GET: [{ path: new RegExp('^/config/field$'), is_verify: false }] } };
const mongodb_config = {
    url: 'mongodb://localhost:27001'
    , db_name: 'dqy'
    , opt: {
        user: 'nodejs'
        , pass: 'KjoQrnGepdvox7ziw1O6DY3DpdT'
        , replicaSet: 'iot-rs-1'
        , authSource: 'admin'
        , useNewUrlParser: true
    }
    , auto_index: true
};

swaraj.init_mongo(mongodb_config);
swaraj.init_registry({ services: ['test'], port: 3000, route_map: route_map }, ['auth']);
swaraj.init_distributer();
swaraj.init();