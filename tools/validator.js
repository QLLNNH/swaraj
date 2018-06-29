'use strict';

exports.check = (method, path, pattern, trees) => {

    const list = path.substring(1).split('/');

    for (let tree of trees) {

        for (let i = 0, len = list.length; i < len; i ++) {

            const item = list[i];

            if (pattern[i] === 'fixed' && tree.hasOwnProperty(item)) {
                if (i !== len - 1) {
                    if (tree[item].res) {
                        tree = tree[item].res;
                        continue;
                    }
                    else {
                        if (method === 'GET' && tree[item].next >= 4) return true;
                        else if (['POST', 'PUT', 'PATCH'].includes(method) && tree[item].next >= 6) return true;
                        else if (method === 'DELETE' && tree[item].next === 7) return true;
                        else break;
                    }
                }
                else {
                    if (method === 'GET' && tree[item].mod >= 4) return true;
                    else if (['POST', 'PUT', 'PATCH'].includes(method) && tree[item].mod >= 6) return true;
                    else if (method === 'DELETE' && tree[item].mod === 7) return true;
                    else break;
                }
            }

            else if (pattern[i] === 'regexp' && tree.reg instanceof RegExp && tree.reg.test(item)) {
                if (i !== len - 1) {
                    if (tree.res) {
                        tree = tree.res;
                        continue;
                    }
                    else {
                        if (method === 'GET' && tree.next >= 4) return true;
                        else if (['POST', 'PUT', 'PATCH'].includes(method) && tree.next >= 6) return true;
                        else if (method === 'DELETE' && tree.next === 7) return true;
                        else break;
                    }
                }
                else {
                    if (method === 'GET' && tree.mod >= 4) return true;
                    else if (['POST', 'PUT', 'PATCH'].includes(method) && tree.mod >= 6) return true;
                    else if (method === 'DELETE' && tree.mod === 7) return true;
                    else break;
                }
            }

            else break;
        }
    }

    throw({
        lv: 'ERROR'
        , message: 'impermissibility'
        , result: { status: 224, description: 'impermissibility', data: null }
    });
}