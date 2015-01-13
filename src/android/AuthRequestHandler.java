package com.msopentech.authDialog;

import android.webkit.HttpAuthHandler;
import android.webkit.WebView;
import org.apache.cordova.*;

public class AuthRequestHandler extends CordovaPlugin {
    @Override
    public void initialize(final CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        
        if (!(cordova instanceof CordovaActivity)) return;
        
        ((CordovaActivity)cordova).setHttpAuthRequestHandler(new HttpAuthRequestHandler() {
            @Override
            public void handle(WebView view, final HttpAuthHandler handler, String host, String realm) {

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
            }
        });
    }
}