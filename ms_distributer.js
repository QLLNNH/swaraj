'use strict';
const jws = require('jws');
const http = require('http');
const querystring = require('querystring');
const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const rpc_timeout = 20 * 1000;

module.exports = class MS_Distributer {

    constructor(registry, jws_config, algorithm = 'random') {
        this.registry = registry;
        this.jws_config = jws_config;
    }

    is_valid_sign(token) {
        try {
            return jws.verify(token, this.jws_config.algorithm, this.jws_config.secret);
        }
        catch (err) {
            return false;
        }
    }

    is_valid_exp(exp) {
        return Date.now() < exp;
    }

    decode_token(token) {
        try {
            return JSON.parse(jws.decode(token).payload);
        }
        catch (err) {
            return {};
        }
    }

    check_tetrad(bank) {
        const route_map = this.registry.route_map.get(bank.service);

        if (! route_map) throw({
            lv: 'ERROR'
            , message: 'unknow service'
            , result: { status: 221, description: 'unknow service', data: null }
        });

        if (! route_map[bank.method]) throw({
            lv: 'ERROR'
            , message: 'unknow method'
            , result: { status: 222, description: 'unknow method', data: null }
        });

        const route = route_map[bank.method].find((item) => {
            if (bank.path.search(item.path) === 0) return true;
        });

        if (! route) throw({
            lv: 'ERROR'
            , message: 'unknow path'
            , result: { status: 223, description: 'unknow path', data: null }
        });

        if (route.is_verify) {
            if (! this.jws_config) throw({
                lv: 'ERROR'
                , message: 'need crypto config'
                , result: { status: 204, description: 'need crypto config', data: null }
            });

            if (! bank.token) throw({
                lv: 'ERROR'
                , message: 'missing token'
                , result: { status: 201, description: 'missing token', data: null }
            });

            if (! this.is_valid_sign(bank.token)) throw({
                lv: 'ERROR'
                , message: 'token error'
                , result: { status: 202, description: 'token error', data: null }
            });

            bank.jws = this.decode_token(bank.token);

            if (! this.is_valid_exp(bank.jws.exp)) throw({
                lv: 'ERROR'
                , message: 'token over exp'
                , result: { status: 203, description: 'token over exp', data: null }
            });
        }
    }

    rpc_on_http(bank) {
        return new Promise((resolve, reject) => {
            const instance_map = this.registry.service_map.get(bank.service);

            if (! instance_map) throw({
                lv: 'ERROR'
                , message: 'unknow service'
                , result: { status: 221, description: 'unknow service', data: null }
            });

            const target_service = instance_map.get([...instance_map.keys()][Math.floor(Math.random() * instance_map.size)]);

            const opt = {
                agent: agent
                , host: target_service.host
                , port: target_service.port
                , path: bank.path
                , method: bank.method
                , headers: { 'x-auth-token': bank.token || '' }
            };

            if (bank.method !== 'GET' && bank.method !== 'DELETE') opt.headers['content-type'] = 'application/json';
            else opt.path += `?data=${encodeURIComponent(JSON.stringify(bank.data || {}))}&jws=${encodeURIComponent(JSON.stringify(bank.jws || {}))}&geo=${encodeURIComponent(JSON.stringify(bank.geo || {}))}&extra=${encodeURIComponent(JSON.stringify(bank.extra || {}))}`;

            const request = http.request(opt);

            request.setTimeout(rpc_timeout, () => {
                request.abort();
                return reject({
                    lv: 'ERROR'
                    , message: 'rpc timeout'
                    , result: { status: 801, description: 'rpc timeout', data: null }
                });
            });

            request.on('error', (err) => reject({
                lv: 'ERROR'
                , message: err.message || err
                , result: { status: 802, description: 'rpc error', data: null }
            }));

            request.on('response', (res) => {
                if (res.statusCode !== 200) return reject({
                    lv: 'ERROR'
                    , message: `rpc response unlawful ${res.statusCode}`
                    , result: { status: 803, description: `rpc response unlawful ${res.statusCode}`, data: null }
                });

                let count = 0, chunks = [];
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                    count += chunk.length;
                });

                res.on('end', () => {
                    try {
                        return resolve(JSON.parse(Buffer.concat(chunks, count)));
                    }
                    catch (err) {
                        return reject({
                            lv: 'ERROR'
                            , message: 'rpc response format error'
                            , result: { status: 804, description: 'rpc result format error', data: null }
                        });
                    }
                });
            });

            if (bank.method === 'GET' || bank.method === 'DELETE') request.end();
            else request.end(JSON.stringify({ data: bank.data, jws: bank.jws, geo: bank.jws, extra: bank.extra }));
        });
    }

    rpc_on_http_with_xml(bank) {
        return new Promise((resolve, reject) => {
            const instance_map = this.registry.service_map.get(bank.service);

            if (! instance_map) throw({
                lv: 'ERROR'
                , message: 'unknow service'
                , result: { status: 221, description: 'unknow service', data: null }
            });

            const target_service = instance_map.get([...instance_map.keys()][Math.floor(Math.random() * instance_map.size)]);

            const request = http.request({
                agent: agent
                , host: target_service.host
                , port: target_service.port
                , path: bank.path
                , method: bank.method
                , headers: { 'content-type': 'application/xml' }
            });

            request.setTimeout(rpc_timeout, () => {
                request.abort();
                return reject({
                    lv: 'ERROR'
                    , message: 'downstream timeout'
                    , result: { status: 801, description: 'downstream timeout', data: null }
                });
            });

            request.on('error', (err) => reject({
                lv: 'ERROR'
                , message: err.message || err
                , result: { status: 802, description: 'http emit error', data: null }
            }));

            request.on('response', (res) => {
                if (res.statusCode !== 200) return reject({
                    lv: 'ERROR'
                    , message: `rpc response unlawful ${res.statusCode}`
                    , result: { status: 803, description: `rpc response unlawful ${res.statusCode}`, data: null }
                });

                let count = 0, chunks = [];
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                    count += chunk.length;
                });

                res.on('end', () => resolve(Buffer.concat(chunks, count)));
            });

            request.end(bank.xml);
        });
    }
}