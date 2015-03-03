# fluxible-action-utils

[![npm version](https://badge.fury.io/js/fluxible-action-utils.svg)](http://badge.fury.io/js/fluxible-action-utils)
[![Build Status](https://travis-ci.org/yahoo/fluxible-action-utils.svg?branch=master)](https://travis-ci.org/yahoo/fluxible-action-utils)
[![Dependency Status](https://david-dm.org/yahoo/fluxible-action-utils.svg)](https://david-dm.org/yahoo/fluxible-action-utils)
[![devDependency Status](https://david-dm.org/yahoo/fluxible-action-utils/dev-status.svg)](https://david-dm.org/yahoo/fluxible-action-utils#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/yahoo/fluxible-action-utils/badge.svg)](https://coveralls.io/r/yahoo/fluxible-action-utils)

[![Join the chat at https://gitter.im/yahoo/fluxible-action-utils](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/yahoo/fluxible-action-utils?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

utility methods to aid in writing [actions](http://fluxible.io/api/fluxible-context.html#executeaction-action-payload-callback-) for [fluxible](http://fluxible.io) based applications.

## Modularized Builds/Requires
The utility library provides modularized methods, and method categories to aid in providing smaller [browserify](http://browserify.org/) and [webpack](http://webpack.github.io/) builds.

```js
var actionUtils = require('fluxible-action-utils');
```

Will require the entire library, including **all** available methods grouped under their respective method categories.

For example, the following are equivalent (but will result in varying sized [webpack](http://webpack.github.io/) builds)

### Full Library (results in **largest** build)
```js
var executeMultiple = require('fluxible-action-utils').async.executeMultiple;
```

### Category
```js
var executeMultiple = require('fluxible-action-utils/async').executeMultiple;
```

### Method (results in smallest build)
```js
var executeMultiple = require('fluxible-action-utils/async/executeMultiple');
```

:rotating_light: **WARNING** :rotating_light:

Methods inside the `internals` directory/category are not explicitely exported and are considered unstable. 

require externally at your own risk as breaking changes inside `internals` will not be considered `breaking` for the library.

===

## API
* [`async`](#async)
    - [`executeMultiple`](#executemultiple-context-actions-done)
    - [`exectueCritical`](#executecritical-context-actions-done)

===

### async
*available as of v0.2.0*

```js
var asyncActionUtils = require('fluxible-action-utils/async');
```

Methods grouped under the `async` category are concerned with providing methods that aid in managing the asynchronous control flow of [`fluxible`](http://fluxible.io) actions. 

[async.auto](https://github.com/caolan/async#autotasks-callback) is used under the hood to do the actual heavy lifting (thanks to [@caolan](https://github.com/caolan))

#### executeMultiple (context, actions, [done])
*available as of v0.2.0*

```js
var executeMultiple = require('fluxible-action-utils/async/executeMultiple');
```

Utility method used to execute multiple actions in parallel where possible. Each key in `actions` represents a `task` to be executed (and should be unique). 

`actions[task]` can be one of the following

1. {FluxAction} an action to be executed, **cannot** be critical **nor** require params
2. {Object} an action "object" with the follwing properties
    1. `action` {FluxAction} the action to execute
    1. `[isCritical=false]` {Boolean} whether the action is **critical**
    2. `[params]` {Any} parameters to pass to the action when executing it
3. {Array} {String, String, ..., FluxAction|Object} array which defines the tasks/actions that need to be executed before executing the action of type *1.* or *2.* found at the end of the array.

The `done` {Function} parameter is optional, but if provided, will be called when all tasks complete (either with success or failure).
Signature `function (err, results)`

For each task that fails, the error returned will be aggregated under `err[task]`.

**Example**

```js
// initHome.js
// 
var executeMultiple = require('fluxible-action-utils/async/executeMultiple');
var UserStore = require('app/stores/UserStore');

module.exports = function initHome(context, params, done) {
    executeMultiple(context, {
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

#### executeCritical (context, actions, [done])
*available as of v0.2.0*

```js
var executeCritical = require('fluxible-action-utils/async/executeCritical');
```

`executeCritical` allows you to execute a group of actions that are **ALL** deemed critical.  This is a simple shorthand for `executeMultiple` when a group of actions are all critical.

## Thanks
* [@mridgway](https://github.com/mridgway) 
* [@akshayp](https://github.com/akshayp)
* [@redonkulus](https://github.com/redonkulus)

## License
This software is free to use under the Yahoo Inc. BSD license. See the [LICENSE file](https://github.com/yahoo/fluxible-action-utils/blob/master/LICENSE.md) for license text and copyright information.
