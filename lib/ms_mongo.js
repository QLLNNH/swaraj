'use strict';
const Events = require('events');
const mongoose = require('mongoose');
const logger = require('./tools/log');

module.exports = class MS_Mongo extends Events {

    constructor(config) {
        super();
        this.config = config;
        this.init_connection();
        this.config_schema();
        this.create_model();
    }

    init_connection() {
        this.connection = mongoose.createConnection(`${ this.config.url }/${ this.config.db_name }`, this.config.opt);

        this.connection.on('error', (err) => logger.info({
            ts: new Date().toISOString(),
            grade: 'FATAL',
            message: err.message || err
        }));

        this.connection.on('connected', () => logger.info({
            ts: new Date().toISOString(),
            grade: 'INFO',
            message: `swaraj connected mongodb.${ this.config.db_name }`
        }));

        this.connection.on('disconnected', () => logger.info({
            ts: new Date().toISOString(),
            grade: 'FATAL',
            message: `swaraj disconnected mongodb.${ this.config.db_name }`
        }));
    }

    config_schema() {
        this.schema = require('./schemas/ms.instance');
        this.schema.set('autoIndex', this.config.auto_index || false);
    }

    create_model() {
        this.model = this.connection.model(this.schema.get('collection'), this.schema);
    }
};