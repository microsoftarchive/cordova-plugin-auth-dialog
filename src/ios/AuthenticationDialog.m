/*
 * Copyright (c) Microsoft Open Technologies, Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
 */

#import "AuthenticationDialog.h"

@implementation AuthenticationDialog {}

- (void)authenticate:(CDVInvokedUrlCommand*)command
{
    self.uri = [command.arguments objectAtIndex:0];
    self.userName = [command.arguments objectAtIndex:1];
    self.password = [command.arguments objectAtIndex:2];
    self.allowBypassAuth = [[command.arguments objectAtIndex:3] boolValue];

    self.callbackId = command.callbackId;

    NSLog(@"AuthDialog: authenticate %@", self.uri);

    // large timout is used so that we have enough time to request user name and password
    NSMutableURLRequest* request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:self.uri]
                                             cachePolicy:NSURLRequestUseProtocolCachePolicy
                                         timeoutInterval:60000.0];

    // use HEAD since it is faster than actial data retrieving (GET)
    // this does not work due to WebView issue: http://stackoverflow.com/questions/25755555/stream-is-sending-an-event-before-being-opened
    //[request setHTTPMethod:@"HEAD"];

    [request setHTTPMethod:@"GET"];

    [NSURLConnection  connectionWithRequest:request delegate:self];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    CDVPluginResult* errorResult;
    if (error.code == NSURLErrorUserCancelledAuthentication) {
        errorResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString: @"cancelled"];
    } else {
        errorResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[error localizedDescription]];
    }

    [self.commandDelegate sendPluginResult:errorResult callbackId:self.callbackId];
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
    CDVPluginResult* pluginResult;
    
    NSInteger statusCode = [((NSHTTPURLResponse *)response) statusCode];
    
    // 405 means 'Mehod not allowed' which is totally ok to understand
    // we have successfully passed authentication
    if (statusCode == 200 || statusCode == 405) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:
                        [NSHTTPURLResponse localizedStringForStatusCode: statusCode]];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
}

- (BOOL) isSupportedAuthMethod:(NSString*)authenticationMethod {
    // TODO extend to others
    return [authenticationMethod isEqualToString:NSURLAuthenticationMethodNTLM] ||
        [authenticationMethod isEqualToString:NSURLAuthenticationMethodHTTPBasic] ||
        [authenticationMethod isEqualToString:NSURLAuthenticationMethodHTTPDigest];

}

CredentialsViewController * credentialsViewController;

- (void)connection:(NSURLConnection *)connection willSendRequestForAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
{
    NSLog(@"AuthDialog: willSendRequestForAuthenticationChallenge %@", challenge.protectionSpace);
 
    // if no cridentials are passed during first authentication attempt then
    // try to pass challenge automatically (using cached cridentials)
    // this makes it possible to avoid passing cridentials every app start
    if ([challenge previousFailureCount] == 0 && self.allowBypassAuth) {
        [[challenge sender] continueWithoutCredentialForAuthenticationChallenge:challenge];
        return;
    }
    
    if ([challenge previousFailureCount] == 0 && [self isSupportedAuthMethod: challenge.protectionSpace.authenticationMethod])
    {

        // use predefined cridentials if provided
        if (![self.userName isEqual:[NSNull null]] && ![self.password isEqual:[NSNull null]]) {
                
            [[challenge sender] useCredential:[NSURLCredential credentialWithUser:self.userName
                                                                             password:self.password
                                                                      persistence:NSURLCredentialPersistencePermanent]
                       forAuthenticationChallenge:challenge];
        } else { // request cridentials
            credentialsViewController = [[CredentialsViewController alloc] init];
                
            credentialsViewController.onResult = ^(NSString * userName, NSString* password, BOOL isCancelled)  {
                    
                credentialsViewController = NULL;
                    
                if (isCancelled) {
                    [[challenge sender] cancelAuthenticationChallenge:challenge];
                } else {
                    [[challenge sender] useCredential:[NSURLCredential credentialWithUser:userName
                                                                                     password:password
                                                                                  persistence:NSURLCredentialPersistencePermanent]
                            forAuthenticationChallenge:challenge];
                }
            };
                
            [credentialsViewController requestUserCridentials:self.uri];
        }
    }
    else
    {
        [[challenge sender] rejectProtectionSpaceAndContinueWithChallenge:challenge];
    }
}

@end

@implementation CredentialsViewController {}

- (void) requestUserCridentials: (NSString*) uri
{
    
    // TODO consider using UIAlertController (available starting from iOS 8.0)
    UIAlertView* view = [[UIAlertView alloc] initWithTitle:@"Authentication Required"
                       message: uri
                      delegate: self
             cancelButtonTitle:@"Cancel"
             otherButtonTitles:nil];
    
    view.alertViewStyle = UIAlertViewStyleLoginAndPasswordInput;
    
    [view addButtonWithTitle:@"Log In"];
    
    [view show];
}

- (void)alertView:(UIAlertView *)alertView didDismissWithButtonIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 0) // cancelled
    {
        self.onResult(NULL, NULL, true);
        return;
    }
    
    UITextField *username = [alertView textFieldAtIndex:0];
    UITextField *password = [alertView textFieldAtIndex:1];

    self.onResult(username.text, password.text, false);
}

@end
