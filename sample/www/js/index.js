/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var SECURED_PAGE = 'https://sps2013.akvelon.net:8443';

var app = {
    // Application Constructor
    initialize: function () {

        var securedHost = document.querySelector('.secured-link input');
        securedHost.value = SECURED_PAGE;
        securedHost.addEventListener('change', function (e) {
            SECURED_PAGE = e.target.value;
        }, false);

        // Wrap console.log
        var origConsoleLog = console.log;
        console.log = function () {
            origConsoleLog.apply(null, arguments);
            app.log.apply(app, arguments);
        }

        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        document.getElementById('navigate').addEventListener('click', function () {
            console.log('Navigating to ' + SECURED_PAGE);
            window.location = SECURED_PAGE;
        });

        document.getElementById('xhr').addEventListener('click', function () {
            console.log('Making XHR to ' + SECURED_PAGE);
            app.makeXHR(SECURED_PAGE);
        })
    },
    makeXHR: function (host) {
        var req = new XMLHttpRequest();
        req.open('GET', host);
        req.onload = function (e) {
            console.log('Got onload.\nreadyState: ' + e.target.readyState + ', HTTP status: ' + e.target.status);
        };
        req.onerror = function (e) {
            console.log('Got onerror.\nreadyState: ' + e.target.readyState + ', HTTP status: ' + e.target.status);
        };
        req.onreadystatechange = function (e) {
            console.log('Got onreadystatechange.\nreadyState: ' + e.target.readyState + ', HTTP status: ' + e.target.status);
        };
        req.send();
    },
    log: function () {
        var args = Array.prototype.slice.call(arguments);
        var data = args.map(function (arg) {
            return arg.toString();
        }).join(' ');

        var log = document.querySelector('.log #log');
        log.textContent += (data + '\n\n');
    }
};

app.initialize();