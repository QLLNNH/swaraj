'use strict';

exports.info = (info) => {
    if (typeof info === 'string') console.log(`${new Date().toISOString()} => ${info}`);
    else console.log(JSON.stringify(info));
}

exports.error = (error) => {
    if (typeof error === 'string') console.error(`${new Date().toISOString()} => ${error}`);
    else console.error(JSON.stringify(error));
}