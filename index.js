'use strict';
let single_swaraj;
const MS_Mongo = require('./ms_mongo');
const MS_Registry = require('./ms_registry');
const MS_Distributer = require('./ms_distributer');
const ip_collector = require('./tools/ip_collector');

class Swaraj {

    constructor() {
        this.is_init = false;
    }

    init() {
        if (
            true
            && this.mongo instanceof MS_Mongo
            && this.registry instanceof MS_Registry
            && this.distributer instanceof MS_Distributer
        ) this.is_init = true;
        else {
            throw new Error({ message: 'Swaraj not found config to init' });
        }
    }

    init_mongo(config) {
        if (
            true
            && Object.prototype.toString.call(config) === '[object Object]'
            && typeof config.url === 'string'
            && typeof config.db_name === 'string'
            && Object.prototype.toString.call(config.opt) === '[object Object]'
            && typeof config.opt.user === 'string'
            && typeof config.opt.pass === 'string'
            && typeof config.opt.replicaSet === 'string'
            && typeof config.opt.authSource === 'string'
        ) this.mongo = new MS_Mongo(config);
        else {
            throw new Error({ message: 'error config for init_mongo' });
        }
    }

    init_registry(instance, watched) {
        if (
            Object.prototype.toString.call(instance) !== '[object Object]'
            || Object.prototype.toString.call(instance.services) !== '[object Array]'
            || (instance.port >>> 0) === 0
        ) throw new Error({ message: 'error config for init_registry' });

        if (typeof instance.host !== 'string' || instance.host.split('.').length !== 4)
            instance.host = ip_collector.get_inner_ip()[0];

        if (instance.route_map) {
            if (Object.prototype.toString.call(instance.route_map) !== '[object Object]') {
                throw new Error({ message: 'error config for init_registry' });
            }

            for (let service of instance.services) {
                if (
                    ! instance.route_map.hasOwnProperty(service)
                    || Object.prototype.toString.call(instance.route_map[service]) !== '[object Object]'
                    || Object.keys(instance.route_map[service]).length === 0
                ) {
                    throw new Error({ message: 'error config for init_registry' });
                }

                Object.keys(instance.route_map[service]).forEach((method) => {
                    if (
                        ! Array.isArray(instance.route_map[service][method])
                        || instance.route_map[service][method].length === 0
                    ) {
                        throw new Error({ message: 'error config for init_registry' });
                    }

                    instance.route_map[service][method].forEach((item) => {
                        if (
                            Object.prototype.toString.call(item) !== '[object Object]'
                            || Object.prototype.toString.call(item.path) !== '[object RegExp]'
                            || typeof item.is_verify !== 'boolean'
                        ) {
                            throw new Error({ message: 'error config for init_registry' });
                        }
                    });
                });
            }
        }
        else instance.route_map = null;

        this.registry = new MS_Registry(this.mongo.model, instance, watched);
        this.registry.on('log', (msg) => console.log(msg));
    }

    init_distributer(jws_config, algorithm) {
        if (jws_config) {
            if (
                Object.prototype.toString.call(jws_config) !== '[object Object]'
                || typeof jws_config.secret !== 'string'
                || typeof jws_config.algorithm !== 'string'
            ) {
                throw new Error({ message: 'error config for init_distributer' });
            }
        }
        else jws_config = null;

        this.distributer = new MS_Distributer(this.registry, jws_config, algorithm);
    }

    async rpc(bank) {
        if (! this.is_init) return Promise.reject({ message: 'Swaraj need init' });
        else {
            this.distributer.check_tetrad(bank);
            return await this.distributer.rpc_on_http(bank);
        }
    }
}

module.exports = () => {
    if (single_swaraj) return single_swaraj;
    else {
        single_swaraj = new Swaraj();
        return single_swaraj;
    }
}