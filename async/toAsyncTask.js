/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var continueOnError = require('./../internals/continueOnError');
var createCriticalCB = require('./../internals/createCriticalCB');

/**
 * converts a fluxible action into a task that can be passed to the "async" library.
 *
 * @method toAsyncTask
 *
 * @param  {FluxibleAction} action The action to convert
 *
 * @param  {FluxibleActionContext} context The fluxible action context
 *
 * @param  {*} params Parameters passed to the fluxible action when calling it
 *
 * @param  {Boolean} [isCritical=false] Whether the action is critical or not.
 *                                      critical actions will allow the action being executed to pass an error to the
 *                                      "done" callback passed into them. This will usually short-circuit all async
 *                                      tasks being executed in the same block. By default, errors passed by the
 *                                      action are passed as valid "data" under an "err" property.
 *
 * @param  {String} taskName The name of the task
 *
 * @return {void}
 */
module.exports = function toAsyncTask (action, context, params, isCritical, taskName) {
    return function (cb) {
        if (!isCritical) {
            cb = continueOnError(cb);
        } else {
            cb = createCriticalCB(cb, taskName);
        }

        context.executeAction(action, params, cb);
    };
};
