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
 * converts a Touchdown Flux "action"
 * into a task used by the "async" package.
 *
 * @method toAsyncTask
 *
 * @param  {FluxAction}     action             The touchdown action to convert
 * @param  {FluxContext}    context            The touchdown flux context
 * @param  {any}            params             Any parameters to pass to the action
 * @param  {Boolean}        [isCritical=false] Whether the action is critical or not
 *                                             critical actions will allow the action being executed
 *                                             to pass an error to the "done" callback passed into them.
 *                                             This will usually short-circuit all async tasks being executed in the same
 *                                             block. By default, errors passed by the action are passed as valid "data" under
 *                                             an "err" property
 *
 * @return {void}
 */
function toAsyncTask(action, context, params, isCritical, taskName) {
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
 * @param  {FluxContext}    context             The touchdown flux context
 * @param  {object}         actions             The actions to convert
 * @param  {Boolean}        isAlwaysCritical    True if every action is critical, else false
 * @return {Object}                             An object of valid async.auto tasks.
 */
function getTasksForAsync(context, actions, isAlwaysCritical) {
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
     * @param  {FluxContext} context                               The touchdown flux context
     *
     * @param  {Object}      actions                               The actions to execute
     *
     * @param  {FluxAction}  actions.{taskName}                    this is a non-critical action that doesn't take any
     *                                                             params.
     *
     * @param  {Object}      actions.{taskName}                    this is an action Object
     * @param  {FluxAction}  actions.{taskName}.action             an action to execute
     * @param  {Boolean}     [actions.{taskName}.isCritical=false] if the action is critical or not. If true, all other
     *                                                             actions will not execute if this action fails.
     * @param  {Any}         [actions.{taskName}.params]           passed to the action as params
     *
     * @param {Array}        actions.{taskName}                    contains the actions that need to run first before
     *                                                             running the current task (defined as strings). The
     *                                                             last entry in the array should either be a
     *                                                             {FluxAction} or an action object as defined above.
     *
     * @param  {Function}    [done]                                done(err, results) An optional callback which is
     *                                                             called when all the actions have been completed. It
     *                                                             receives the err argument if any critical actions
     *                                                             pass
     *                                                             an error to their callback. Results are always
     *                                                             returned; however, if an error occurs, no further
     *                                                             actions will be performed, and the results object
     *                                                             will
     *                                                             only contain partial results. For each non-critical
     *                                                             task that errors, the err object will contain the
     *                                                             error under err.taskName
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
                if (results[taskName]) {
                    var taskErr = results[taskName].err;
                    // result for task is actually an error
                    if (taskErr) {
                        err = err || {};    // safety first
                        err[taskName] = taskErr; // aggregate under err instead of results
                        results[taskName] = null; // clear results[taskName];
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
     * @method executeMultiple
     *
     * @param  {FluxContext} context                               The touchdown flux context
     *
     * @param  {Object}      actions                               The actions to execute
     *
     * @param  {FluxAction}  actions.{taskName}                    this is a non-critical action that doesn't take any
     *                                                             params.
     *
     * @param  {Object}      actions.{taskName}                    this is an action Object
     * @param  {FluxAction}  actions.{taskName}.action             an action to execute
     * @param  {Any}         [actions.{taskName}.params]           passed to the action as params
     *
     * @param {Array}        actions.{taskName}                    contains the actions that need to run first before
     *                                                             running the current task (defined as strings). The
     *                                                             last entry in the array should either be a
     *                                                             {FluxAction} or an action object as defined above.
     *
     * @param  {Function}    [done]                                done(err, results) An optional callback which is
     *                                                             called when all the actions have been completed. It
     *                                                             receives the err argument if any critical actions
     *                                                             pass
     *                                                             an error to their callback. Results are always
     *                                                             returned; however, if an error occurs, no further
     *                                                             actions will be performed, and the results object
     *                                                             will
     *                                                             only contain partial results. For each non-critical
     *                                                             task that errors, the err object will contain the
     *                                                             error under err.taskName
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
