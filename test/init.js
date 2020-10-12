const swaraj = require('../index');
const MONGODB = {
    url: 'mongodb://localhost:27001',
    opt: {
        user: 'wr_all',
        pass: 'XqEjFivhYNT6eo9ROKV9w',
        autoIndex: true,
        replicaSet: 'iot-rs-1',
        authSource: 'admin',
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    }


};
swaraj.init_mongo(Object.assign({}, MONGODB, { db_name: 'iot' }));
swaraj.init_registry({ port: 50000, routes: { test: null }, watched: [] });
swaraj.init_distributer();
swaraj.init();