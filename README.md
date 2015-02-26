# fluxible-action-utils

[![npm version](https://badge.fury.io/js/fluxible-action-utils.svg)](http://badge.fury.io/js/fluxible-action-utils)
[![Build Status](https://travis-ci.org/yahoo/fluxible-action-utils.svg?branch=master)](https://travis-ci.org/yahoo/fluxible-action-utils)
[![Dependency Status](https://david-dm.org/yahoo/fluxible-action-utils.svg)](https://david-dm.org/yahoo/fluxible-action-utils)
[![devDependency Status](https://david-dm.org/yahoo/fluxible-action-utils/dev-status.svg)](https://david-dm.org/yahoo/fluxible-action-utils#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/yahoo/fluxible-action-utils/badge.svg)](https://coveralls.io/r/yahoo/fluxible-action-utils)

[![Join the chat at https://gitter.im/yahoo/fluxible-action-utils](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/yahoo/fluxible-action-utils?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

utility methods to aid in writing [actions](http://fluxible.io/api/fluxible-context.html#executeaction-action-payload-callback-) for [fluxible](http://fluxible.io) based applications.

## Links
* [async.auto](https://github.com/caolan/async#autotasks-callback)
    - used under the hood to actually handle task/action depedency management. (thanks to [@caolan](https://github.com/caolan))

## Usage
### executeMultiple(context, actions, [done])
*available as of v0.1.0*

Utility method used to execute multiple actions in parallel where possible. Each key in `actions` represents a `task` to be executed (and should be unique). 

`actions[task]` can be one of the following

1. {FluxAction} an action to be executed
2. {Object} an action "object" with the follwing properties
    1. `action` {FluxAction} the action to execute, **cannot** be critical **nor** require params
    1. `[isCritical=false]` {Boolean} whether the action is **critical**
    2. `[params]` {Any} parameters to pass to the action when executing it
3. {Array} {String, String, ..., FluxAction|Object} array which defines the tasks/actions that need to be executed before executing the action of type *1.* or *2.* found at the end of the array.

The `done` {Function} parameter is optional, but if provided, will be called when all tasks complete (either with success or failure).
Signature `function (err, results)`

For each task that fails, the error returned will be aggregated under `err[task]`.

Example

```js
// initHome.js

var actionUtils = require('fluxible-action-utils');
var UserStore = require('app/stores/UserStore');

module.exports = function initHome(context, params, done) {
    actionUtils.executeMultiple(context, {
        loadUH: require('UH').actions.load,
        loadUser: {
            action: require('app/actions/loadUser'),
            isCritical: true
        },
        loadStuffForUser: [
            'loadUser', 
            {
                // will be executed after 'loadUser' task completes successfully
                action: require('../../actions/loadStuffForUser'),
                params: context.getStore(UserStore).getGUID()
            }
        ],
        populateUserNotifications: [
            'loadUH', 
            'loadStuffForUser', 

            // will be executed after the 'loadUH' and 'loadStuffForUser' tasks complete successfully
            require('../../actions/populateUserNotifications')
        ]
    }, function (err, results) {
        // there was at least one error, handle them
        if (err) {
            if (err.loadUser) {
                context.dispatch('CATASTROPHE', err.loadUser);
            }

            if(err.loadStuffForUser) {
                context.dispatch('RECOVERABLE', err.loadStuffForUser);
            }

            return;
        }
        // Yay! no errors
    });
};
```
### executeCritical(context, actions, [done])
*available as of v0.1.0*

executeCritical allows you to execute a group of actions that are ALL deemed critical.  This is a simple shorthand for executeMultiple when a group of actions are all critical.

## Thanks
* [@mridgway](https://github.com/mridgway) 
* [@akshayp](https://github.com/akshayp)
* [@redonkulus](https://github.com/redonkulus)

## License
This software is free to use under the Yahoo Inc. BSD license. See the [LICENSE file](https://github.com/yahoo/fluxible-action-utils/blob/master/LICENSE.md) for license text and copyright information.
