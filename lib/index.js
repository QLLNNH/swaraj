'use strict';
let swaraj;
const MS_Mongo = require('./ms_mongo');
const MS_Registry = require('./ms_registry');
const MS_Distributer = require('./ms_distributer');
const validator = require('./tools/validator');
const ip_collector = require('./tools/ip_collector');
const p2s = Object.prototype.toString;
const object = '[object Object]';
const regexp = '[object RegExp]';

class Swaraj {

    constructor() {
        this.is_init = false;
    }

    init() {
        if (
            this.mongo instanceof MS_Mongo
            && this.registry instanceof MS_Registry
            && this.distributer instanceof MS_Distributer
        ) this.is_init = true;

        else throw new Error({ message: 'swaraj need initialization' });
    }

    init_mongo(config) {
        if (p2s.call(config) === object && p2s.call(config.opt) === object) this.mongo = new MS_Mongo(config);
        else throw new Error({ message: 'init mongo mistake' });
    }

    init_registry({ host, port, routes, watched }) {
        if (p2s.call(routes) !== object)
            throw new Error({ message: 'init registry mistake -> instance.routes' });

        if ((port >>> 0) === 0)
            throw new Error({ message: 'init registry mistake -> instance.port' });

        if (typeof host !== 'string' || host.split('.').length !== 4)
            host = ip_collector.get_inner_ip()[0];

        Object.keys(routes).forEach((service) => {

            if (p2s.call(routes[service]) !== object || Object.keys(routes[service]).length === 0) {
                routes[service] = null;
                return;
            }

            Object.keys(routes[service]).forEach((method) => {

                if (! Array.isArray(routes[service][method])) {
                    routes[service][method] = [];
                    return;
                }

                routes[service][method].forEach((item) => {
                    if (p2s.call(item) !== object || p2s.call(item.path) !== regexp || typeof item.is_verify !== 'boolean')
                        throw new Error({ message: 'init registry mistake -> instance.route' });
                });
            });
        });

        this.registry = new MS_Registry(this.mongo.model, { host, port, routes, watched, services: Object.keys(routes) });
    }

    init_distributer(jws_config = null, algorithm) {
        if (jws_config) {
            if (
                p2s.call(jws_config) !== object
                || typeof jws_config.secret !== 'string'
                || typeof jws_config.algorithm !== 'string'
            ) throw new Error({ message: 'init distributer mistake -> jws' });
        }

        this.distributer = new MS_Distributer(this.registry, jws_config, algorithm);
    }

    async rpc(bank) {
        if (this.is_init) {
            const route = this.distributer.check_tetrad(bank);

            if (route.is_restrict) {
                const permission_bank = { service: 'org', method: 'GET', path: '/permission', jws: bank.jws };
                const permission_ret = await this.distributer.rpc_on_http(permission_bank);

                if (permission_ret.status !== 100) return permission_ret;
                else validator.check(bank.method, bank.path, route.pattern, permission_ret.data);
            }

            return await this.distributer.rpc_on_http(bank);
        }
        else {
            return Promise.reject({ message: 'Swaraj need init' });
        }
    }
}

module.exports = () => {
    if (swaraj instanceof Swaraj) return swaraj;
    swaraj = new Swaraj();
    return swaraj;
};