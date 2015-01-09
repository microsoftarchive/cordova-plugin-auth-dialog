
function requestCredentials(uri, callback) {

    var username, password;

    
    var authDialog = document.createElement('div');
    authDialog.style.cssText = "position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: black; text-align: left; color: white";

    authDialog.innerHTML  = "<h1>Authorization</h1></br>";
    authDialog.innerHTML += "<h2>Host " + uri + " requests credentials</h2></br>";
    authDialog.innerHTML += '<input type="text" id="username"></br>';
    authDialog.innerHTML += '<input type="text" id="password"></br>';
    authDialog.innerHTML += '<button id="login">Login</button>';

    document.body.appendChild(authDialog);

    var loginButton = document.getElementById('login');
    var usernameField = document.getElementById('username');
    var passwordField = document.getElementById('password');

    // TODO: Doesn't work for WP8.1, need to find workaround
    document.addEventListener('backbutton', function () {
        document.removeEventListener('backbutton', this);
        callback && callback({ username: username, password: password });
    });

    loginButton.addEventListener('click', function () {
        username = usernameField.value;
        password = passwordField.value;
        document.body.removeChild(authDialog);
        callback && callback({ username: username, password: password });
    });

}

(function (win) {

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
        isAsync: false,
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
            this.isAsync = isAsync;
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
                    return this.wrappedXHR.responseType = val;
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

                console.log('INTERNAL: ' + e.target.readyState + ' : ' + e.target.status);
                if (e.target.status && e.target.status === 401) {

                    // Got 401?
                    // First remove an existing onreadystatechange event handler from stale XHR
                    self.wrappedXHR.onreadystatechange = null;
                    // Then ask for credentials
                    requestCredentials(self._url, function (creds) {

                        // TODO: check if credentials is not null
                        // Then create an authorization request and wrap new XHR with credentials supplied
                        self.wrappedXHR = new aliasXHR();
                        self.wrappedXHR.open(self._reqType, self._url, self.isAsync, creds.username, creds.password);
                        self.wrappedXHR.send(self._data);
                    
                        // and bind onreadystatechange event handler to new XHR
                        self.wrappedXHR.onreadystatechange = onreadystatechangeListener;
                    });

                } else {
                    self.changeReadyState(e.target.readyState);
                }

            };
            return this.wrappedXHR.open(reqType, uri, isAsync, user, password);
        },
        changeReadyState: function (newState) {
            this.readyState = newState;
            var evt;
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

})(window);
