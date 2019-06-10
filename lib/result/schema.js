'use strict';

module.exports = {
    // 成功
    100: ({ front = 'done', back = 'done', data = null }) => {
        return {
            code: 100,
            grade: 'INFO',
            message: front,
            result: { code: 100, message: back, data }
        };
    },

    // 服务类
    201: () => {
        return {
            code: 201,
            grade: 'FATAL',
            message: 'service not found',
            result: { code: 201, message: 'service not found', data: null }
        };
    },
    202: () => {
        return {
            code: 202,
            grade: 'FATAL',
            message: 'method not found',
            result: { code: 202, message: 'method not found', data: null }
        };
    },
    203: () => {
        return {
            code: 203,
            grade: 'FATAL',
            message: 'path not found',
            result: { code: 203, message: 'path not found', data: null }
        };
    },

    // 令牌类
    211: () => {
        return {
            code: 211,
            grade: 'FATAL',
            message: 'token not found',
            result: { code: 211, message: 'token not found', data: null }
        };
    },
    212: () => {
        return {
            code: 212,
            grade: 'FATAL',
            message: 'token mistake',
            result: { code: 212, message: 'token mistake', data: null }
        };
    },
    213: () => {
        return {
            code: 213,
            grade: 'INFO',
            message: 'token overdue',
            result: { code: 213, message: 'token overdue', data: null }
        };
    },

    // 参数类
    301: ({ front = 'not found params', back = 'not found params' }) => {
        return {
            code: 301,
            grade: 'FATAL',
            message: back,
            result: { code: 301, message: front, data: null }
        };
    },
    302: ({ front = 'params mistake', back = 'params mistake' }) => {
        return {
            code: 302,
            grade: 'FATAL',
            message: back,
            result: { code: 302, message: front, data: null }
        };
    },
    303: () => {
        return {
            code: 303,
            grade: 'FATAL',
            message: 'http body mistake',
            result: { code: 303, message: 'http body mistake', data: null }
        };
    },

    // HTTP
    404: () => {
        return {
            code: 404,
            grade: 'INFO',
            message: 'not found router',
            result: { code: 404, message: 'not found router', data: null }
        };
    },
    418: () => {
        return {
            code: 418,
            grade: 'FATAL',
            message: `I'm a Teapot`,
            result: { code: 418, message: `I'm a Teapot`, data: null }
        };
    },

    // DB操作类
    500: ({ front = 'storage mistake', back = 'storage mistake' }) => {
        return {
            code: 500,
            grade: 'FATAL',
            message: back,
            result: { code: 500, message: front, data: null }
        };
    },

    // 上游类
    801: ({ origin = 'internal upstream' }) => {
        return {
            code: 801,
            grade: 'FATAL',
            message: `${origin} timeout`,
            result: { code: 801, message: `${origin} timeout`, data: null }
        };
    },
    802: ({ origin = 'internal upstream' }) => {
        return {
            code: 802,
            grade: 'FATAL',
            message: `${origin} refused`,
            result: { code: 802, message: `${origin} refused`, data: null }
        };
    },
    803: ({ origin = 'internal upstream' }) => {
        return {
            code: 803,
            grade: 'FATAL',
            message: `${origin} mistake`,
            result: { code: 803, message: `${origin} mistake`, data: null }
        };
    },
    804: ({ origin = 'internal upstream', data = 500 }) => {
        return {
            code: 804,
            grade: 'FATAL',
            message: `${origin} return ${data}`,
            result: { code: 804, message: `${origin} return ${data}`, data: null }
        };
    },

    999: () => {
        return {
            code: 999,
            grade: 'FATAL',
            message: 'Result Class Error',
            result: { code: 999, message: 'Result Class Error', data: null }
        };
    },

    // 自定义
    custom: (code, { grade = 'INFO', front = 'done', back = 'done', data = null }) => {
        return {
            code,
            grade,
            message: back,
            result: { code, message: front, data }
        };
    }
};