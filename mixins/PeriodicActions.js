'use strict';

var React = require('react');
var intervalsMap = {};
var uuidMap = {};

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
        executeAction: React.PropTypes.func
    },
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
    componentDidMount: function () {
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
    componentWillUnmount: function () {
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
    }
};
