'use strict';
const net = require('net');

exports.create_connection = (host_port) => net.createConnection(host_port);