/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var intervalsMap = {};
var uuidMap = {};

/**
 * Return a function that can run the array of actions
 *
 * @method  getIntervalRunner
 *
 * @param  {FluxibleActionContext} context The fluxible component context (with executeAction)
 *
 * @param  {Array.<Function>} actions The actions to run
 *
 * @return {Function} Function to run the actions array
 */
function getIntervalRunner (context, actions) {
    return function itervalRunner () {
        var i = 0;
        var len = actions.length;
        var actionData = null;

        for (; i < len; i += 1) {
            actionData = actions[i];
            context.executeAction(actionData.action, actionData.params);
        }
    };
}

module.exports = {
    contextTypes: {
        executeAction: function (props, propName) {
            if (typeof props[propName] !== 'function') {
                return new Error('Validation failed, function expected!');
            }
        }
    },
    /**
     * Start running an action periodically
     *
     * @method  startPeriodicAction
     *
     * @param  {string} uuid A globally unique identifier
     *
     * @param  {Function} action The action to run
     *
     * @param  {(Object|Array|string|number|boolean)} [params=undefined] The parameters to pass to the action
     *
     * @param  {number} [interval=100] The amount of time to wait between action executions
     *
     * @return {boolean} True if adding the periodic action succeeded, false otherwise
     */
    startPeriodicAction: function (uuid, action, params, interval) {
        var actions = null;

        if (typeof uuid !== 'string' ||
            typeof action !== 'function') {
            return false;
        }

        if (interval === undefined) {
            if (typeof params === 'number') {
                interval = params;
                params = null;
            } else {
                interval = 100;
            }
        }

        if (uuidMap[uuid]) {
            return false;
        }

        if (!intervalsMap[interval]) {
            actions = [];
            intervalsMap[interval] = {
                id: setInterval(getIntervalRunner(this.context, actions), interval),
                interval: interval,
                actions: actions
            };
        }

        intervalsMap[interval].actions.push({
            uuid: uuid,
            action: action,
            params: params
        });
        uuidMap[uuid] = intervalsMap[interval];

        if (!this._periodicActionUUIDs) {
            this._periodicActionUUIDs = [];
        }

        this._periodicActionUUIDs.push(uuid);
        return true;
    },
    /**
     * Check statics for periodic actions, if found add them all
     *
     * @method  startPeriodicActions
     *
     * @return {void}
     */
    startPeriodicActions: function () {
        var i = 0;
        var len = 0;
        var actionData = null;

        if (!(this.constructor.periodicActions instanceof Array)) {
            return;
        }

        len = this.constructor.periodicActions.length;

        for (; i < len; i += 1) {
            actionData = this.constructor.periodicActions[i];
            this.startPeriodicAction(actionData.uuid, actionData.action, actionData.params, actionData.interval);
        }
    },
    /**
     * Stop running an action periodically
     *
     * @method  stopPeriodicAction
     *
     * @param  {string} uuid A globally unique identifier
     *
     * @return {boolean} True if stopping the periodic action succeeded, false otherwise
     */
    stopPeriodicAction: function (uuid) {
        var intervalData = null;
        var i = 0;
        var len = 0;
        var actionData = null;

        if (typeof uuid !== 'string') {
            return false;
        }

        intervalData = uuidMap[uuid];

        if (!intervalData) {
            return false;
        }

        uuidMap[uuid] = null;

        len = intervalData.actions.length;

        for (; i < len; i += 1) {
            actionData = intervalData.actions[i];
            if (actionData.uuid === uuid) {
                intervalData.actions.splice(i, 1);
                break;
            }
        }

        if (intervalData.actions.length === 0) {
            clearInterval(intervalData.id);
            intervalsMap[intervalData.interval] = null;
        }

        return true;
    },
    /**
     * Stop all periodic actions registered on this component
     *
     * @method  stopPeriodicActions
     *
     * @return {void}
     */
    stopPeriodicActions: function () {
        var i = 0;
        var len = 0;
        var uuid = '';

        if (!this._periodicActionUUIDs) {
            return;
        }

        len = this._periodicActionUUIDs.length;

        for (; i < len; i += 1) {
            uuid = this._periodicActionUUIDs[i];
            this.stopPeriodicAction(uuid);
        }
    },
    /**
     * Provide hook to #startPeriodicActions
     *
     * @method  componentDidMount
     *
     * @return {void}
     */
    componentDidMount: function () {
        this.startPeriodicActions();
    },
    /**
     * Provide hook to #stopPeriodicActions
     *
     * @method  componentWillUnmount
     *
     * @return {void}
     */
    componentWillUnmount: function () {
        this.stopPeriodicActions();
    }
};
