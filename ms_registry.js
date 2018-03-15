'use strict';
const log = require('./tools/log');
const Events = require('events');
const mongoose = require('mongoose');
const detector = require('./tools/detector');
const MS_Watcher = require('./ms_watcher');

module.exports = class MS_Registry extends Events {

    constructor(model, instance, watched) {
        super();

        this.model = model;
        this.watched = watched;
        this.instance = instance;

        this.route_map = new Map();
        this.service_map = new Map();
        this.instance_map = new Map();

        this.init_update_instance_timer();
        if (Array.isArray(this.watched)) this.init_watcher();
        this.init_task();
    }

    async init_task() {
        if (Array.isArray(this.watched)) await this.load_instances();
        await this.register_instance();
    }

    init_watcher() {
        this.watcher = new MS_Watcher(this.model);

        this.watcher.on('change', (change) => {
            if (change.opt === 'insert') {
                if (! this.instance.services.includes(change.doc.service)) {
                    if (this.watched.length === 0) this.insert(change.doc);
                    else if (this.watched.includes(change.doc.service)) this.insert(change.doc);
                }
            }
            else if (change.opt === 'delete') this.delete(change.id);
        });
    }

    init_update_instance_timer() {
        this.timer = setInterval(async () => {
            try {
                for (let service of this.instance.services) {
                    const raw = await this.model.update({ service: service, host: this.instance.host, port: this.instance.port }, { $set: { u_ts: new Date() } });
                    if (raw.n !== 1) await this.register_instance([service]);
                }
            }
            catch (err) {
                this.emit('log', { lv: 'SERIOUS', message: err.message || err });
            }
        }, 30000);
    }

    async load_instances() {
        try {
            const instances = await this.model.find({}, { u_ts: 0 }, { lean: true });
            for (let instance of instances) {
                if (! this.instance.services.includes(instance.service)) {
                    if (this.watched.length === 0) this.insert(instance);
                    else if (this.watched.includes(instance.service)) this.insert(instance);
                }
            }
        }
        catch (err) {
            this.emit('log', { lv: 'SERIOUS', message: err.message || err });
        }
    }

    async register_instance(services = this.instance.services) {
        try {
            for (let service of services) {
                await this.model.update(
                    { service: service, host: this.instance.host, port: this.instance.port }
                    , {
                        $set: { route_map: this.instance.route_map ? this.instance.route_map[service] : null, u_ts: new Date() }
                        , $setOnInsert: { _id: mongoose.Types.ObjectId() }
                    }
                    , { upsert: true }
                );
            }
        }
        catch (err) {
            this.emit('log', { lv: 'SERIOUS', message: err.message || err });
        }
    }

    insert(instance) {
        const socket = detector.create_connection(instance);

        socket.on('connect', () => {
            instance._id = instance._id.toString();

            this.instance_map.set(instance._id, { _id: instance._id, service: instance.service, host: instance.host, port: instance.port });

            this.route_map.set(instance.service, instance.route_map);

            const k = `${instance.host}:${instance.port}`;
            const v = { host: instance.host, port: instance.port };
            if (this.service_map.has(instance.service)) this.service_map.get(instance.service).set(k, v);
            else this.service_map.set(instance.service, new Map([[k, v]]));

            log.info({ ts: new Date().toISOString(), lv: 'INFO', msg: `insert ${instance.service}:${instance.host}:${instance.port}` });
        });

        socket.on('error', (err) => this.emit('log', { lv: 'INFO', message: err.message || err }));

        socket.on('close', (err) => this.delete(instance._id));
    }

    delete(id) {
        id = id.toString();
        if (this.instance_map.has(id)) {
            const instance = this.instance_map.get(id);
            if (this.service_map.has(instance.service)) {
                const s_m = this.service_map.get(instance.service);
                s_m.delete(`${instance.host}:${instance.port}`);
                if (s_m.size === 0) {
                    this.route_map.delete(instance.service);
                    this.service_map.delete(instance.service);
                }
            }
            this.instance_map.delete(id);
            log.info({ ts: new Date().toISOString(), lv: 'INFO', msg: `delete ${instance.service}:${instance.host}:${instance.port}` });
        }
    }
}