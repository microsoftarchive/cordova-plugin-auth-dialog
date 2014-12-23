package com.msopentech.windowsauth;

import android.webkit.HttpAuthHandler;
import android.webkit.WebView;
import org.apache.cordova.*;

public class WindowsAuth extends CordovaPlugin {
    @Override
    public void initialize(final CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        CordovaWebViewClient webViewClient = webView.getWebViewClient();
        webViewClient.setHttpAuthRequestHandler(new HttpAuthRequestHandler() {
            @Override
            public void handle(WebView view, final HttpAuthHandler handler, String host, String realm) {

                HttpAuthenticationDialog dialog = new HttpAuthenticationDialog(cordova.getActivity(), host, realm);

                dialog.setOkListener(new HttpAuthenticationDialog.OkListener() {
                    public void onOk(String host, String realm, String username, String password) {
                        handler.proceed(username, password);
                    }
                });

                dialog.setCancelListener(new HttpAuthenticationDialog.CancelListener() {
                    public void onCancel() {
                        handler.cancel();
                    }
                });

                dialog.show();
            }
        });
    }
}