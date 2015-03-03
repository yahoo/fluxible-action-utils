/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var DEFAULT_ERROR_PROPERTY = 'err';

/**
 * Wrap callback function so that it never calls back with an error.
 * @method continueOnError
 *
 * @param  {String}   [errProp='err'] The property on the data object passed to the
 *                                    callback that will contain an error in case
 *                                    the wrapped function is passed an error.
 *
 * @param  {Function} cb              The callback function to wrap.
 *                                    Method signature: function (err, data) {}
 *
 * @return {Function}                 A callback function that will never callback with error.
 */
module.exports = function continueOnError (errProp, cb) {
    if (!cb) {
        cb = errProp;
        errProp = DEFAULT_ERROR_PROPERTY;
    }

    return function (err, data) {
        data = data || {};
        if (err) {
            data[errProp] = err;
        }

        cb(null, data);
        return;
    };
};
