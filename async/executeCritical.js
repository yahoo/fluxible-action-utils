/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var auto = require('run-auto');
var getTasksForAsync = require('./../internals/getTasksForAsync');

/**
 * execute multiple actions that are deemed "critical" to the page.
 * This method uses a Task interface similar
 * to "async.auto" but expects actions (or action "objects") instead of
 * async tasks.  Once each action is complete(without error), the "FLUSH" event is dispatched.
 *
 * @see https://github.com/caolan/async#autotasks-callback
 *
 * @method executeCritical
 *
 * @param  {FluxibleActionContext} context The fluxible action context
 *
 * @param  {Object.<string, FluxAction>|Object.<string, Object>|Object.<string, Array>} actions The actions to
 *                                                                                              execute
 *
 * @param  {FluxibleAction} actions.$TASKNAME This is a non-critical action that doesn't take any params.
 *
 * @param  {Object}   actions.$TASKNAME    This is an action Object
 *
 * @param  {FluxibleAction} actions.$TASKNAME.action An action to execute
 *
 * @param  {Boolean} [actions.$TASKNAME.isCritical=false] if the action is critical or not. If true, all other
 *                                                        actions will not execute if this action fails.
 *
 * @param  {*} [actions.$TASKNAME.params] Passed to the action as params
 *
 * @param  {Array<String|FluxAction>} actions.$TASKNAME Contains the actions that need to run first before running
 *                                                     the current task (defined as strings). The last entry in
 *                                                     the array should either be a {FluxAction} or an action
 *                                                     object as defined above.
 *
 * @param  {Function} [done]                           done(err, results) An optional callback which is called
 *                                                     when all the actions have been completed. It receives the
 *                                                     err argument if any critical actions pass an error to their
 *                                                     callback. Results are always returned; however, if an error
 *                                                     occurs, no further actions will be performed, and the
 *                                                     results object will only contain partial results. For each
 *                                                     non-critical task that errors, the err object will contain
 *                                                     the error under err.taskName
 *
 * @return {void}
 */
module.exports = function executeCritical (context, actions, done) {
    var tasks = getTasksForAsync(context, actions, true);

    if (!done) {
        auto(tasks);
        return;
    }

    auto(tasks, done);
};
