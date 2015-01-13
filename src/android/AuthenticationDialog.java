package com.msopentech.authDialog;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.res.Resources;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;
import android.widget.TextView.OnEditorActionListener;

/**
 * Implements authentication dialog.
 */
public class AuthenticationDialog {

    private final Context mContext;

    private final String mHost;
    private final String mRealm;

    private AlertDialog mDialog;
    private TextView mUsernameView;
    private TextView mPasswordView;

    private OkListener mOkListener;
    private CancelListener mCancelListener;

    /**
     * Creates an HTTP authentication dialog.
     */
    public AuthenticationDialog(Context context, String host, String realm) {
        mContext = context;
        mHost = host;
        mRealm = realm;
        createDialog();
    }

    private String getUsername() {
        return mUsernameView.getText().toString();
    }

    private String getPassword() {
        return mPasswordView.getText().toString();
    }

    /**
     * Sets the listener that will be notified when the user submits the credentials.
     */
    public void setOkListener(OkListener okListener) {
        mOkListener = okListener;
    }

    /**
     * Sets the listener that will be notified when the user cancels the authentication
     * dialog.
     */
    public void setCancelListener(CancelListener cancelListener) {
        mCancelListener = cancelListener;
    }

    /**
     * Shows the dialog.
     */
    public void show() {
        mDialog.show();
        mUsernameView.requestFocus();
    }

    /**
     * Hides, recreates, and shows the dialog. This can be used to handle configuration changes.
     */
    public void reshow() {
        String username = getUsername();
        String password = getPassword();
        int focusId = mDialog.getCurrentFocus().getId();
        mDialog.dismiss();
        createDialog();
        mDialog.show();
        if (username != null) {
            mUsernameView.setText(username);
        }
        if (password != null) {
            mPasswordView.setText(password);
        }
        if (focusId != 0) {
            mDialog.findViewById(focusId).requestFocus();
        } else {
            mUsernameView.requestFocus();
        }
    }

    private void createDialog() {
        LayoutInflater factory = LayoutInflater.from(mContext);
        Resources resources = mContext.getResources();
        int viewId = resources.getIdentifier("http_authentication", "layout", mContext.getPackageName());
        View v = factory.inflate(resources.getLayout(viewId), null);
        int userNameId = resources.getIdentifier("username_edit", "id", mContext.getPackageName());
        mUsernameView = (TextView) v.findViewById(userNameId);
        int passwordId = resources.getIdentifier("password_edit", "id", mContext.getPackageName());
        mPasswordView = (TextView) v.findViewById(passwordId);
        mPasswordView.setOnEditorActionListener(new OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    mDialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
                    return true;
                }
                return false;
            }
        });

        int titleStringId = resources.getIdentifier("sign_in_to", "string", mContext.getPackageName());
        String title = mContext.getText(titleStringId).toString().replace(
                "%s1", mHost).replace("%s2", mRealm);

        int actionStringId = resources.getIdentifier("action", "string", mContext.getPackageName());
        int cancelStringId = resources.getIdentifier("cancel", "string", mContext.getPackageName());
        mDialog = new AlertDialog.Builder(mContext)
                .setTitle(title)
                .setIconAttribute(android.R.attr.alertDialogIcon)
                .setView(v)
                .setPositiveButton(actionStringId, new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int whichButton) {
                        if (mOkListener != null) {
                            mOkListener.onOk(mHost, mRealm, getUsername(), getPassword());
                        }
                    }})
                .setNegativeButton(cancelStringId, new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int whichButton) {
                        if (mCancelListener != null) mCancelListener.onCancel();
                    }})
                .setOnCancelListener(new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface dialog) {
                        if (mCancelListener != null) mCancelListener.onCancel();
                    }})
                .create();

        // Make the IME appear when the dialog is displayed if applicable.
        mDialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
    }

    /**
     * Interface for listeners that are notified when the user submits the credentials.
     */
    public interface OkListener {
        void onOk(String host, String realm, String username, String password);
    }

    /**
     * Interface for listeners that are notified when the user cancels the dialog.
     */
    public interface CancelListener {
        void onCancel();
    }
}
