package com.msopentech.authDialog;

import org.apache.cordova.*;

public class AuthRequestHandler extends CordovaPlugin {
 
    public boolean onReceivedHttpAuthRequest(CordovaWebView view, final ICordovaHttpAuthHandler handler, String host, String realm) {
        AuthenticationDialog dialog = new AuthenticationDialog(cordova.getActivity(), host, realm);

        dialog.setOkListener(new AuthenticationDialog.OkListener() {
            public void onOk(String host, String realm, String username, String password) {
                handler.proceed(username, password);
            }
        });

        dialog.setCancelListener(new AuthenticationDialog.CancelListener() {
            public void onCancel() {
                handler.cancel();
            }
        });

        dialog.show();
        
        return true;
    }
}