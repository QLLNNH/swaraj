'use strict';
const Events = require('events');
const mongoose = require('mongoose');
const logger = require('./tools/log');
const MS_Watcher = require('./ms_watcher');
const MS_Detector = require('./ms_detector');

module.exports = class MS_Registry extends Events {

    constructor(model, { watched, ...instance }) {
        super();

        this.model = model;
        this.watched = watched;
        this.instance = instance;

        this.routes = new Map();
        this.services = new Map();
        this.instances = new Map();

        this.init_update_instance_timer();
        if (Array.isArray(this.watched)) this.init_watcher();
        // this.init_task();
    }

    init_update_instance_timer() {
        this.timer = setInterval(async () => {
            try {
                for (let service of this.instance.services) {
                    const raw = await this.model.updateOne({ service, host: this.instance.host, port: this.instance.port }, { $set: { u_ts: new Date() } });
                    if (raw.n !== 1) await this.register_instance([service]);
                }
            }
            catch (err) {
                logger.info({ ts: new Date().toISOString(), grade: 'FATAL', message: err.message || err });
            }
        }, 30000);
    }

    init_watcher() {
        this.watcher = new MS_Watcher(this.model);

        this.watcher.on('insert', (doc) => {
            // 相同服务的事件 -> 不处理
            if (! this.instance.services.includes(doc.service)) {
                // 关注列表为空等于全关注 或者 关注列表包含关注项 -> 插入
                if (this.watched.length === 0 || this.watched.includes(doc.service)) this.insert(doc);
            }
        });
    }

    async init_task() {
        if (Array.isArray(this.watched)) await this.load_instances();
        await this.register_instance();
        this.check();
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
            logger.info({ ts: new Date().toISOString(), grade: 'FATAL', message: err.message || err });
        }
    }

    async register_instance(services = this.instance.services) {
        try {
            for (let service of services) {
                await this.model.updateOne(
                    { service: service, host: this.instance.host, port: this.instance.port },
                    {
                        $set: { routes: this.instance.routes ? this.instance.routes[service] : null, u_ts: new Date() },
                        $setOnInsert: { _id: mongoose.Types.ObjectId() }
                    },
                    { upsert: true }
                );
            }
        }
        catch (err) {
            logger.info({ ts: new Date().toISOString(), grade: 'FATAL', message: err.message || err });
        }
    }

    insert(instance) {
        const socket = new MS_Detector(instance);

        socket.on('connect', () => {
            instance._id = instance._id.toString();

            this.instances.set(instance._id, { _id: instance._id, service: instance.service, host: instance.host, port: instance.port });

            this.routes.set(instance.service, instance.routes);

            const k = `${instance.host}:${instance.port}`;
            const v = { host: instance.host, port: instance.port };
            if (this.services.has(instance.service)) this.services.get(instance.service).set(k, v);
            else this.services.set(instance.service, new Map([[k, v]]));

            logger.info({ ts: new Date().toISOString(), grade: 'INFO', message: `insert ${instance.service}:${instance.host}:${instance.port}` });
        });

        socket.on('close', (err) => this.delete(instance._id.toString()));
    }

    delete(id) {
        if (this.instances.has(id)) {
            const instance = this.instances.get(id);
            if (this.services.has(instance.service)) {
                const s_m = this.services.get(instance.service);
                s_m.delete(`${instance.host}:${instance.port}`);
                if (s_m.size === 0) {
                    this.routes.delete(instance.service);
                    this.services.delete(instance.service);
                }
            }
            this.instances.delete(id);
            logger.info({ ts: new Date().toISOString(), grade: 'INFO', message: `delete ${instance.service}:${instance.host}:${instance.port}` });
        }
    }

    check() {
        setInterval(() => {
            console.log(this.routes.keys());
            console.log(this.services.keys());
            console.log(this.instances.keys());
        }, 15 * 1000);
    }
}