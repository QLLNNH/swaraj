'use strict';
const Koa = require('koa');
const swaraj = require('../index')();
const app = new Koa();
const routes = {
    app1: null
};

const server = require('http').createServer(app.callback()).listen(0, '0.0.0.0', () => {
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
    swaraj.init_registry({ port: server.address().port, routes });
    swaraj.init_distributer();
    swaraj.init();
});

app.on('error', (err, ctx) => console.error(err.message || err));