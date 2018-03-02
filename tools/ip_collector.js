'use strict';
const network_cards = require('os').networkInterfaces();
const inner_address = [];
const outer_address = [];

Object.keys(network_cards).forEach((card) => {
    // 过滤以太网卡
    if (/en|eth/i.test(card)) {
        network_cards[card].forEach((item) => {
            // 过滤IPv4
            if (item.family === 'IPv4' && item.mac !== '00:00:00:00:00:00') {
                // 分离内外网
                if (/^(10.|192.168.|172.(1[6-9]|2[0-9]|3[0-1]]).)/.test(item.address)) inner_address.push(item.address);
                else outer_address.push(item.address);
            }
        });
    }
});

exports.get_inner_ip = () => inner_address;
exports.get_outer_ip = () => outer_address;