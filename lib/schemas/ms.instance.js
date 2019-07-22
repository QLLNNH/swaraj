'use strict';
const { Schema } = require('mongoose');

const schema = new Schema({
    _id: Schema.Types.ObjectId,
    service: String,
    host: String,
    port: Number,
    routes: Schema.Types.Mixed,
    u_ts: Date
});

schema.set('read', 'sp');
schema.set('versionKey', false);
schema.set('collection', 'ms.instance');
schema.index({ u_ts: 1 }, { expireAfterSeconds: 120 });
schema.index({ service: 1, host: 1, port: 1 }, { unique: true });

module.exports = schema;