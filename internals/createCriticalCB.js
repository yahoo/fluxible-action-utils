/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

/**
 * wraps critical tasks errors
 * with the taskname
 *
 * @method createCriticalCB
 *
 * @param  {Function}       cb         callback(err, data) function called at the end of the action
 * @param  {String}         [taskName] The name of the task to wrap the error under
 *
 * @return {Function} returns the wrapped callback
 */
module.exports = function createCriticalCB (cb, taskName) {
    return function (err, data) {
        var wrapper = null;

        // if taskname was provided and we actually had an error
        // passed in, wrap the error with the taskName
        if (taskName && err) {
            wrapper = {};
            wrapper[taskName] = err;
        }

        cb(wrapper || err, data);
    };
};
