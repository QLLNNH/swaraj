'use strict';
const log = require('./tools/log');
const net = require('net');
const Events = require('events');

module.exports = class MS_Detector extends Events {

    constructor(instance) {
        super();

        this.interval = 1000;
        this.instance = instance;
        this.retry_amount = 3;

        this.create_socket();
    }

    create_socket() {
        if (-- this.retry_amount < 0) this.emit('close');
        else {
            const socket = net.createConnection(this.instance);

            socket.on('connect', () => {
                this.retry_amount = 3;
                this.emit('connect');
            });

            socket.on('close', (err) => setTimeout(this.create_socket.bind(this), this.interval));

            socket.on('error', (err) => log.info({ ts: new Date().toISOString(), lv: 'ERROR', msg: err.message || err }));
        }
    }


}