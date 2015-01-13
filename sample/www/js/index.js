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

        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    onDeviceReady: function() {
        document.getElementById('navigate').addEventListener('click', function () {
            app.log('Navigating to ' + SECURED_PAGE);
            window.location = SECURED_PAGE;
        });

        document.getElementById('xhr').addEventListener('click', function () {
            app.log('Making XHR to ' + SECURED_PAGE);
            app.makeXHR(SECURED_PAGE);
        })
    },
    makeXHR: function (host) {
        var req = new XMLHttpRequest();
        req.open('GET', host);
        req.onload = function (e) {
            var message = 'Got onload.\nreadyState: ' + e.target.readyState + ', HTTP status: ' + e.target.status;
            app.log(message);

            if (e.target.readyState == 4 && e.target.status == 200) {// success
                app.log(e.target.responseText);
            }

        };
        req.onerror = function (e) {
            var message = 'Got onerror.\nreadyState: ' + e.target.readyState + ', HTTP status: ' + e.target.status;
            app.log(message);
        };
        req.onreadystatechange = function (e) {
            var message = 'Got onreadystatechange.\nreadyState: ' + e.target.readyState + ', HTTP status: ' + e.target.status;
            app.log(message);
        };
        req.send();
    },
    log: function () {

        console.log(arguments);

        var args = Array.prototype.slice.call(arguments);
        var data = args.map(function (arg) {
            return arg.toString();
        }).join(' ');

        var log = document.querySelector('.log #log');
        log.textContent += (data + '\n\n');
    }
};

app.initialize();