'use strict';
const log = require('./tools/log');
const Events = require('events');
const mongoose = require('mongoose');

module.exports = class MS_Mongo extends Events {

    constructor(config) {
        super();
        this.init_connection(config);
        this.config_schema(config);
        this.create_model();
    }

    init_connection(config) {
        this.connection = mongoose.createConnection(`${config.url}/${config.db_name}`, config.opt);

        this.connection.on('error', (err) => log.info({ ts: new Date().toISOString(), lv: 'SERIOUS', msg: err.message || err }));

        this.connection.on('connected', () => log.info({ ts: new Date().toISOString(), lv: 'INFO', msg: `swaraj has already connected to mongodb.${config.db_name}` }));

        this.connection.on('disconnected', () => log.info({ ts: new Date().toISOString(), lv: 'SERIOUS', msg: `swaraj has already disconnected from mongodb.${config.db_name}` }));
    }

    config_schema(config) {
        this.schema = require('./schemas/ms.instance');
        this.schema.set('autoIndex', config.auto_index || false);
    }

    create_model() {
        this.model = this.connection.model(this.schema.get('collection'), this.schema);
    }
}

// TODO
// 数据库断开后的处理