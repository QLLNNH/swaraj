'use strict';
const Events = require('events');

module.exports = class Watcher extends Events {

    constructor(model) {
        super();
        this.model = model;
        this.handle_change();
    }

    handle_change() {
        this.model
            .watch([
                { $match: { 'operationType': { $in: ['insert', 'delete'] } } }
                , { $project: { _id: 1, id: '$documentKey._id', opt: '$operationType', doc: '$fullDocument' } }
            ])
            .on('change', (change) => this.emit('change', change));
    }
}