'use strict';
const Events = require('events');
const logger = require('./tools/log');

module.exports = class Watcher extends Events {

    constructor(model) {
        super();
        this.model = model;
        this.handle_change();
    }

    handle_change() {
        this.model
            .watch([{ $match: { 'operationType': { $in: ['insert'] } } }, {
                $project: {
                    _id: 1,
                    id: '$documentKey._id',
                    opt: '$operationType',
                    doc: '$fullDocument',
                }
            }])
            .on('error', (err) => logger.info({ ts: new Date().toISOString(), grade: 'FATAL', message: err.message || err }))
            .on('change', ({ doc }) => this.emit('insert', doc));
    }
}