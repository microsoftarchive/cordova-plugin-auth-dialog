
/*jshint -W030 */
/*global WinJS, cordova*/

/**
 * Shows UI for entering credentials and calls callback with credentials supplied.
 * @param uri        Uri that will be shown in credentials dialog
 * @param successCB  Success callback
 * @param errorCB    Error callback
 */
function requestCredentials(uri, successCB, errorCB) {
    
    // In case of Windows phone 8 reuse native authentication dialog
    if (cordova.platformId === 'windowsphone') {
        var exec = cordova.require('cordova/exec');
        exec(successCB, errorCB, 'AuthDialogs', 'requestCredentials', [uri]);
        return;
    }

    var authDialog = document.createElement('div');
    authDialog.style.cssText = "position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: black; color: white; text-transform: none; font-family: Segoe; overflow: hidden;";

    authDialog.innerHTML = "" + 
        '<div style="padding: 0px 12px;">' +
            '<h1 style="font-size: 28pt; font-weight: 300; letter-spacing: 0; line-height: 1.1429; text-align: left;">Sign in</h1>' +
        '</div>';

    authDialog.innerHTML +=
        '<div style="font-size: 15pt; font-weight: 500; line-height: 1.3636; padding: 0px 12px;">' +
            '<p>Website</br>' + uri + '</p>' +
            '<span style="font-size: 10pt; font-weight: 300; line-height: 1.3636;">Username:</span></br>' +
            '<input type="text" id="username" style="-ms-user-select: element; min-height:  38px; border-width:  3px; border-style: solid; width: 100%;"></br>' +
            '<span style="font-size: 10pt; font-weight: 300; line-height: 1.3636;">Password:</span></br>' +
            '<input type="text" id="password" style="-ms-user-select: element; min-height:  38px; border-width:  3px; border-style: solid; width: 100%;"></br>' +
            '<div style="text-align: right; margin: auto;">' + 
                '<button id="login" style="color: white; min-height: 39px; min-width:  108px; padding:  0px 6px; border: white solid 2.25px; background-clip: padding-box; max-width: 100%; margin: 12px; font-size: 14pt; font-weight: 600; background-color: black;">Login</button>' +
                '<button id="cancel" style="color: white; min-height: 39px; min-width:  108px; padding:  0px 6px; border: white solid 2.25px; background-clip: padding-box; max-width: 100%; margin: 12px; font-size: 14pt; font-weight: 600; background-color: black;">Cancel</button>' +
            '</div>' + 
        '</div>';

    document.body.appendChild(authDialog);

    var loginButton = document.getElementById('login');
    var cancelButton = document.getElementById('cancel');
    var usernameField = document.getElementById('username');
    var passwordField = document.getElementById('password');

    // TODO: Doesn't work for WP8.1, need to find workaround
    cancelButton.addEventListener('click', function () {
        document.body.removeChild(authDialog);
        errorCB && errorCB("Login cancelled");
    });

    loginButton.addEventListener('click', function () {
        document.body.removeChild(authDialog);
        successCB && successCB({ username: usernameField.value, password: passwordField.value });
    });
}

/**
 * Bootstarapper for wrapping XHR object
 * Adds transparent https authentication support for all XHRs
 * @param win  Object to bootstrap
 */
function bootstrapXHR(win) {

    var aliasXHR = win.XMLHttpRequest;

    var XHRShim = function () { };
    win.XMLHttpRequest = XHRShim;
    XHRShim.noConflict = aliasXHR;
    XHRShim.UNSENT = 0;
    XHRShim.OPENED = 1;
    XHRShim.HEADERS_RECEIVED = 2;
    XHRShim.LOADING = 3;
    XHRShim.DONE = 4;
    XHRShim.prototype = {
        isAsync: true,
        onreadystatechange: null,
        readyState: 0,
        _url: '',
        timeout: 0,
        withCredentials: false,
        _requestHeaders: null,
        statusText: '',
        responseText: '',
        responseXML: '',
        status: 404,
        open: function (reqType, uri, isAsync, user, password) {
            this._reqType = reqType;
            this._url = uri;
            this.isAsync = isAsync === false ? false : true;
            this.wrappedXHR = new aliasXHR();
            var self = this;
            if (this.timeout > 0) {
                this.wrappedXHR.timeout = this.timeout;
            }
            Object.defineProperty(this, 'timeout', {
                set: function (val) {
                    this.wrappedXHR.timeout = val;
                },
                get: function () {
                    return this.wrappedXHR.timeout;
                }
            });
            if (this.withCredentials) {
                this.wrappedXHR.withCredentials = this.withCredentials;
            }
            Object.defineProperty(this, 'withCredentials', {
                set: function (val) {
                    this.wrappedXHR.withCredentials = val;
                },
                get: function () {
                    return this.wrappedXHR.withCredentials;
                }
            });
            Object.defineProperty(this, 'status', {
                get: function () {
                    return this.wrappedXHR.status;
                }
            });
            Object.defineProperty(this, 'responseText', {
                get: function () {
                    return this.wrappedXHR.responseText;
                }
            });
            Object.defineProperty(this, 'statusText', {
                get: function () {
                    return this.wrappedXHR.statusText;
                }
            });
            Object.defineProperty(this, 'responseXML', {
                get: function () {
                    return this.wrappedXHR.responseXML;
                }
            });
            Object.defineProperty(this, 'response', {
                get: function () {
                    return this.wrappedXHR.response;
                }
            });
            Object.defineProperty(this, 'responseType', {
                set: function (val) {
                    return (this.wrappedXHR.responseType = val);
                }
            });
            this.getResponseHeader = function (header) {
                return this.wrappedXHR.getResponseHeader(header);
            };
            this.getAllResponseHeaders = function () {
                return this.wrappedXHR.getAllResponseHeaders();
            };
            this.wrappedXHR.onreadystatechange = function onreadystatechangeListener(e) {
                // Magic is here :)
                // Try to catch HTTP 401 code and resend an authorized request then
                if (e.target.status && e.target.status === 401) {
                    // Got 401? First remove an existing onreadystatechange event handler from stale XHR
                    self.wrappedXHR.onreadystatechange = null;
                    // Then ask for credentials and do magic
                    requestCredentials(self._url, function (creds) {
                        // Create an authorization request and wrap new XHR with credentials supplied
                        self.wrappedXHR = new aliasXHR();
                        self.wrappedXHR.open(self._reqType, self._url, self.isAsync, creds.username, creds.password);
                        // and bind onreadystatechange event handler to new XHR
                        self.wrappedXHR.onreadystatechange = onreadystatechangeListener;
                        self.wrappedXHR.send(self._data);
                    });
                } else {
                    self.changeReadyState(e.target.readyState);
                }

            };
            return this.wrappedXHR.open(reqType, uri, isAsync, user, password);
        },
        changeReadyState: function (newState) {
            var evt;
            this.readyState = newState;
            if (this.onreadystatechange) {
                // mimic simple 'readystatechange' event which should be passed as per spec
                evt = { type: 'readystatechange', target: this, timeStamp: new Date().getTime() };
                this.onreadystatechange(evt);
            }
            if (this.readyState === XHRShim.DONE) {
                if (this.status !== 0) {
                    evt = { type: 'load', target: this, timeStamp: new Date().getTime() };
                    this.onload && this.onload(evt);
                } else {
                    evt = { type: 'error', target: this, timeStamp: new Date().getTime() };
                    this.onerror && this.onerror(evt);
                }
            }
        },
        addEventListener: function (type, listener, useCapture) {
            this.wrappedXHR.addEventListener(type, listener, useCapture);
        },
        removeEventListener: function (type, listener, useCapture) {
            this.wrappedXHR.removeEventListener(type, listener, useCapture);
        },
        setRequestHeader: function (header, value) {
            this.wrappedXHR.setRequestHeader(header, value);
        },
        getResponseHeader: function (header) {
            return this.wrappedXHR.getResponseHeader(header);
        },
        getAllResponseHeaders: function () {
            this.wrappedXHR.getAllResponseHeaders();
        },
        overrideMimeType: function (mimetype) {
            return this.wrappedXHR.overrideMimeType(mimetype);
        },
        abort: function () {
            return this.wrappedXHR.abort();
        },
        send: function (data) {
            this._data = data;
            return this.wrappedXHR.send(data);
        }
    };
}

var isWindowsPhone = ((cordova.platformId === 'windows') && WinJS.Utilities.isPhone) || cordova.platformId === 'windowsphone';

if (isWindowsPhone) {
    bootstrapXHR(window);
}

