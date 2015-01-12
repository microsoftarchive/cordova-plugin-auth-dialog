/*  
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

using io.cordova.hellocordova.Plugins.com.msopentech.authdialogs;

using Microsoft.Phone.Controls;
using System.Diagnostics;
using System.Windows;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class AuthDialogs : BaseCommand
    {
        public override void OnInit()
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        CordovaView cView = page.FindName("CordovaView") as CordovaView;
                        if (cView != null)
                        {
                            WebBrowser br = cView.Browser;
                            br.NavigationFailed += defaultHttpAuthHandler;
                        }
                    }

                }
            });
        }

        async void defaultHttpAuthHandler(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            var exception = e.Exception as WebBrowserNavigationException;
            if (exception != null && exception.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Debug.WriteLine("Got 401 while navigating to " + e.Uri.ToString());
                var handler = new HttpAuthRequestHandler();
                e.Handled = await handler.handle(sender as WebBrowser, e.Uri);
                if (e.Handled)
                {
                    ((WebBrowser)sender).Navigate(e.Uri);
                }
            }
        }

        public void requestCredentials(string jsonArgs)
        {
            var args = JSON.JsonHelper.Deserialize<string[]>(jsonArgs);
            var uri = new System.Uri(args[0]);

            Deployment.Current.Dispatcher.BeginInvoke(async () =>
            {
                var handler = new HttpAuthRequestHandler();
                var credentials = await handler.requestCredentials(uri);
                var creds = JSON.JsonHelper.Serialize(credentials);

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, creds));
            });
        }
    }
}
