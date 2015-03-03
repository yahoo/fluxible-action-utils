/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var toAsyncTask = require('./../async/toAsyncTask');

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
module.exports = function getTasksForAsync (context, actions, isAlwaysCritical) {
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
            context, actualTask.params, isAlwaysCritical || actualTask.isCritical || false, taskName);
    });
    return tasks;
};
