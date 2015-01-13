Apache Cordova Auth Dialog
=============================
Adds support for authentication dialogs into Apache Cordova.

####Supported Platforms####

- Android
- iOS
- Windows (includes Windows Phone 8.1)
- Windows Phone 8.0

####Supported Authentication Methods####

- Basic
- Digest
- NTLM
 
##Platform quirks##

####Android####

No additional set up is required. Implementation is based on providing custom handler for [WebViewClient.onReceivedHttpAuthRequest](http://developer.android.com/reference/android/webkit/WebViewClient.html#onReceivedHttpAuthRequest(android.webkit.WebView, android.webkit.HttpAuthHandler, java.lang.String, java.lang.String)) which is automatically triggered when it is necessary during navigation or sending XmlHttpRequests.

Cridentials are NOT persisted between app sessions so you need to enter them once per application start.

InAppBrowser plugin is NOT currently supported.

####iOS####

Requires manually executing the following method before accessing protected space (navigation or XmlHttpRequests).

```authDialog.authenticate(uri, /*optional*/ successCallback, /*optional*/ errorCallback,  /*optional*/ userName,  /*optional*/ password,  /*optional*/ maxAttempts)```

Cridentials are automatically cached by UIWebView so you do NOT need to enter them every app start. In this case ```authDialog.authenticate``` is executed w/o showing any cridentials pop-up dialog.

After authentication is you can do XmlHttpRequests or display protected space via ```window.location = 'some protected uri' ``` or using InAppBrowser plugin.

####Windows####

On Windows Tablet/PC (Windows 8.0 and Windows 8.1) native authentication dialog works out of the box so this functionality is not required (skipped).

On Windows Phone 8.1 authentication dialog is automatically showed for XmlHttpRequests only, InAppBrowser plugin is NOT currently supported.

Plugin overrides default XmlHttpRequest via custom wrapper based on original one to automatically show cridentials dialog when it is necessary. Cridentials dialog is html based and does not support hardware back button.

Cridentials are NOT persisted between app sessions so you need to enter them once per application start.

####Window Phone 8.0####

Plugins supports XmlHttpRequests and opening protected space in Cordova View. InAppBrowser plugin is NOT currently supported.

Plugin overrides default XmlHttpRequest via custom wrapper based on original one to automatically show cridentials dialog when it is necessary. Cridentials dialog is XAML-based (native) and correctly supports hardware back button.

Cridentials are NOT persisted between app sessions so you need to enter them once per application start.

## Copyrights ##
Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
