'use strict';
const http = require('http');
const querystring = require('querystring');
const Result = require('dqy-result');
const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const UPSTREAM_TIMEOUT = 20 * 1000;

module.exports = class MS_Distributer {

    constructor(registry, algorithm = 'random') {
        this.registry = registry;
    }

    yield_opt(params) {
        const instances = this.registry.services.get(params.service);

        if (! instances) throw(Result.of(201, { service: params.service }));

        const { host, port } = instances.get([...instances.keys()][Math.floor(Math.random() * instances.size)]);

        const opt = {
            agent: agent
            , host
            , port
            , path: params.path
            , method: params.method
            , headers: params.headers
            , timeout: UPSTREAM_TIMEOUT
        };

        if (! ['GET', 'DELETE'].includes(params.method)) opt.headers['content-type'] = 'application/json';
        else opt.path += `?data=${ encodeURIComponent(JSON.stringify(params.data || {})) }&jws=${ encodeURIComponent(JSON.stringify(params.jws || {})) }&geo=${ encodeURIComponent(JSON.stringify(params.geo || {})) }&extra=${ encodeURIComponent(JSON.stringify(params.extra || {})) }`;

        return opt;
    }

    rpc_on_http(params) {
        return new Promise((resolve, reject) => {
            const request = http.request(this.yield_opt(params));

            request.on('error', (err) => {
                if (err.code === 'ECONNRESET') return reject(Result.of(801));
                else if (err.code === 'ECONNREFUSED') return reject(Result.of(802));
                else return reject(Result.of(803));
            });

            request.on('timeout', (err) => request.abort());

            request.on('response', async (res) => {
                if (res.statusCode !== 200) return reject(Result.of(804, { data: res.statusCode }));

                let count = 0, chunks = [];
                for await (let chunk of res) {
                    chunks.push(chunk);
                    count += chunk.length;
                }

                return resolve(Buffer.concat(chunks, count));
            });

            if (['GET', 'DELETE'].includes(params.method)) request.end();
            else request.end(JSON.stringify({ data: params.data, jws: params.jws, geo: params.geo, extra: params.extra }));
        });
    }
};