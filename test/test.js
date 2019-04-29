'use strict';
const swaraj = require('../')();
const routes = { api: null };

swaraj.init_mongo({
    url: 'mongodb://localhost:27001'
    , db_name: 'dqy'
    , opt: {
        user: 'nodejs'
        , pass: 'KjoQrnGepdvox7ziw1O6DY3DpdT'
        , replicaSet: 'iot-rs-1'
        , authSource: 'admin'
        , useCreateIndex: true
        , useNewUrlParser: true
        , useFindAndModify: false
        , autoReconnect: true
    }
    , auto_index: true
});
swaraj.init_registry({ port: 3000, routes: routes, watched: [] });
swaraj.init_distributer();
swaraj.init();

setTimeout(async () => {
    try {
        const route = swaraj.get_route({ service: 'app1', method: 'GET', path: '/gym' });
        await swaraj.rpc({ service: 'app1', method: 'GET', path: '/gym' });
    }
    catch (err) {
        console.error(err);
    }
}, 1000);
