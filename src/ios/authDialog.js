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

var authDialog  = {};

function authenticateOnce (uri, successCallback, errorCallback, userName, password, allowBypassAuth) {
    cordova.exec(successCallback, errorCallback, 'AuthDialog', 'authenticate', [uri, userName, password, allowBypassAuth]);
}

authDialog.authenticate = function (uri, successCallback, /*optional*/ errorCallback,  /*optional*/ userName,  /*optional*/ password,  /*optional*/ maxAttempts) {
    
    if (!uri) {
        throw new Error('Uri is not specified');
    }
    
    userName = userName || null;
    password = password || null;
    maxAttempts = maxAttempts || 5;
    
    errorCallback = errorCallback || function() {};
    successCallback = successCallback || function() {};
    
    var onError = function (err) {
        
        if (maxAttempts-- <= 0 || err == "cancelled") {
            errorCallback(err);
            return;
        }
        
        // if first attemp has failed then user name and password are invalid
        // so we should ask user to provide another cridentials so we don't pass user/password
        setTimeout(function() {
             authenticateOnce (uri, successCallback, onError, null, null, false);
        })
    }
    
    // allowBypass specifies whether app should try to resolve authentication challenge automatically
    // first (cahched cridentials). This should be done only if no user and password are provided;
    // this makes it possible to avoid passing cridentials every app start
    authenticateOnce (uri, successCallback, onError, userName, password, !(userName || password));
};

module.exports = authDialog;