'use strict';
const addresses = [];
const network_cards = require('os').networkInterfaces();

Object.keys(network_cards).forEach((card) => {
    // 过滤以太网卡
    if (/en|eth/i.test(card)) {
        network_cards[card].forEach((item) => {
            // 过滤IPv4和非回环地址
            if (item.family === 'IPv4' && item.address !== '127.0.0.1' && item.internal === false) {
                addresses.push(item.address);
            }
        });
    }
});

exports.get_inner_ip = () => addresses[0];