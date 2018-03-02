'use strict';
const log = require('./tools/log');
const Events = require('events');
const mongoose = require('mongoose');

module.exports = class MS_Mongo extends Events {

    constructor(config) {
        super();
        this.config = config;
        this.init_connection();
        this.config_schema();
        this.create_model();
    }

    init_connection() {
        this.connection = mongoose.createConnection(`${this.config.url}/${this.config.db_name}`, this.config.opt);

        this.connection.on('error', (err) => log.info({ ts: new Date().toISOString(), lv: 'SERIOUS', msg: err.message || err }));

        this.connection.on('connected', () => log.info({ ts: new Date().toISOString(), lv: 'INFO', msg: `swaraj has already connected to mongodb.${this.config.db_name}` }));

        this.connection.on('disconnected', () => log.info({ ts: new Date().toISOString(), lv: 'SERIOUS', msg: `swaraj has already disconnected from mongodb.${this.config.db_name}` }));
    }

    config_schema() {
        this.schema = require('./schemas/ms.instance');
        this.schema.set('autoIndex', this.config.auto_index || false);
    }

    create_model() {
        this.model = this.connection.model(this.schema.get('collection'), this.schema);
    }
}

