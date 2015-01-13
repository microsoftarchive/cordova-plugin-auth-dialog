using Microsoft.Phone.Controls;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace com.msopentech.authdialog
{
    /// <summary>
    /// Class for http auth support via XHR
    /// </summary>
    public class HttpAuthRequestHandler
    {
        private Grid layoutRoot;
        private PhoneApplicationPage layoutPage;
        private AuthenticationDialog authDialog;
        private TaskCompletionSource<Credentials> requestCredentialsTaskCompletionSource;

        public HttpAuthRequestHandler()
        {
            layoutRoot = getLayoutRoot();
            if (layoutRoot == null)
            {
                throw new Exception("Unable to get current layout root. Is this a Cordova App?");
            }

            layoutPage = getApplicationPage();
            authDialog = new AuthenticationDialog();
            requestCredentialsTaskCompletionSource = new TaskCompletionSource<Credentials>();
        }

        public async Task<bool> handle(WebBrowser browser, Uri uri)
        {
            Credentials creds;
            try
            {
                creds = await requestCredentials(uri);
            }
            catch (TaskCanceledException)
            {
                return false;
            }

            string authScript = "(function() {var xhr = new XMLHttpRequest();xhr.open('HEAD', '{0}', false, '{1}', '{2}');xhr.send();})()";

            authScript = authScript.Replace("{0}", uri.ToString());
            authScript = authScript.Replace("{1}", creds.username.Replace("\\", "\\\\"));
            authScript = authScript.Replace("{2}", creds.password);

            Debug.WriteLine("Injecting script: {0}", authScript);

            try
            {
                browser.InvokeScript("eval", new string[] { authScript });
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public Task<Credentials> requestCredentials(Uri uri)
        {
            authDialog.SubTitle.Text = string.Format("Host {0} requests credentials", uri);

            authDialog.Login.Click += this.loginHandler;
            layoutPage.BackKeyPress += this.cancelHandler;

            layoutRoot.Children.Add(authDialog);

            return requestCredentialsTaskCompletionSource.Task;
        }

        private void cancelHandler(object sender, CancelEventArgs e)
        {
            requestCredentialsTaskCompletionSource.TrySetCanceled();

            Deployment.Current.Dispatcher.BeginInvoke(() => layoutRoot.Children.Remove(authDialog));
            e.Cancel = true;

            authDialog.Login.Click -= this.loginHandler;
            layoutPage.BackKeyPress -= this.cancelHandler;
        }

        private void loginHandler(object sender, RoutedEventArgs e)
        {
            var creds = new Credentials
            {
                username = authDialog.Username.Text,
                password = authDialog.Password.Password
            };
            requestCredentialsTaskCompletionSource.SetResult(creds);

            Deployment.Current.Dispatcher.BeginInvoke(() => layoutRoot.Children.Remove(authDialog));

            authDialog.Login.Click -= this.loginHandler;
            layoutPage.BackKeyPress -= this.cancelHandler;
        }

        private Grid getLayoutRoot()
        {
            PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
            if (frame != null)
            {
                PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                if (page != null)
                {
                    Grid grid = page.FindName("LayoutRoot") as Grid;
                    if (grid != null)
                    {
                        return grid;
                    };
                }
            }
            return null;
        }

        private PhoneApplicationPage getApplicationPage ()
        {
            PhoneApplicationPage page = null;
            PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
            if (frame != null)
            {
                page = frame.Content as PhoneApplicationPage;
            }
            return page;
        }
    }

    public struct Credentials
    {
        public string username;
        public string password;
    }
}
