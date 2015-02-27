/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var async = require('async');
var continueOnError = require('./continueOnError');
var createCriticalCB = require('./createCriticalCB');

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
function toAsyncTask (action, context, params, isCritical, taskName) {
    return function (cb) {
        if (!isCritical) {
            cb = continueOnError(cb);
        } else {
            cb = createCriticalCB(cb, taskName);
        }

        context.executeAction(action, params, cb);
    };
}

/**
 * Converts a list of action objects to a format accepted by async.auto.
 *
 * @method  getTasksForAsync
 *
 * @param  {FluxibleActionContext} context The fluxible action context
 *
 * @param  {Object} actions The actions to convert
 *
 * @param  {Boolean} isAlwaysCritical True if every action is critical, else false
 *
 * @return {Object<String, tasks>} An object of valid async.auto tasks.
 */
function getTasksForAsync (context, actions, isAlwaysCritical) {
    var tasks = {};
    // iterate over the actions
    Object.keys(actions).forEach(function (taskName) {
        var task = actions[taskName];

        var actualTask = null;

        tasks[taskName] = [].concat(actions[taskName]);
        task = tasks[taskName];

        // task value is an array, the last element will contain the actual action object
        actualTask = task[task.length - 1];

        // the last task was an action instead of an object
        if (!actualTask.action) {
            actualTask.action = actualTask;
        }

        tasks[taskName][task.length - 1] = toAsyncTask(actualTask.action,
            context, actualTask.params, isAlwaysCritical || actualTask.isCritical, taskName);
    });
    return tasks;
}

/**
 * fluxible-action-utils
 * @class fluxible-action-utils
 */
module.exports = {
    /**
     * execute multiple actions.
     * This method uses a Task interface similar
     * to "async.auto" but expects actions (or action "objects") instead of
     * async tasks.
     *
     * @see https://github.com/caolan/async#autotasks-callback
     *
     * @method executeMultiple
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
    executeMultiple: function (context, actions, done) {
        var tasks = getTasksForAsync(context, actions, false);

        if (!done) {
            async.auto(tasks);
            return;
        }

        async.auto(tasks, function (err, results) {
            Object.keys(results).forEach(function (taskName) {
                var taskErr = null;
                if (results[taskName]) {
                    taskErr = results[taskName].err;
                    // result for task is actually an error
                    if (taskErr) {
                        // safety first
                        err = err || {};

                        // aggregate under err instead of results
                        err[taskName] = taskErr;

                        // clear results[taskName];
                        results[taskName] = null;
                    }
                }
            });

            done(err, results);
        });
    },

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
    executeCritical: function (context, actions, done) {
        var tasks = getTasksForAsync(context, actions, true);

        if (!done) {
            async.auto(tasks);
            return;
        }

        async.auto(tasks, done);
    },
    toAsyncTask: toAsyncTask
};
