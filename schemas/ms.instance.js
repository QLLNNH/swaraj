'use strict';
const { Schema } = require('mongoose');

const schema = new Schema({
    _id: Schema.Types.ObjectId
    , service: String
    , host: String
    , port: Number
    , route_map: Schema.Types.Mixed
    , u_ts: Date
});

schema.set('read', 'sp');
schema.set('autoIndex', false);
schema.set('versionKey', false);
schema.set('collection', 'ms.instance');
schema.index({ service: 1, host: 1, port: 1 }, { unique: true });
schema.index({ u_ts: 1 }, { expireAfterSeconds: 60 });

module.exports = schema;