'use strict';
const net = require('net');

exports.connect = async (hp_obj) => {
    return new Promise((fulfill, reject) => {
        const client = net.createConnection(hp_obj);
        client.on('connect', () => {
            client.end();
            fulfill();
        });
        client.on('error', (err) => reject(err.message));
    });
}