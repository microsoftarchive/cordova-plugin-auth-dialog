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
    
    // large timeout is used so that we have enough time to request user name and password
    NSMutableURLRequest* request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:self.uri]
                                                           cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                       timeoutInterval:60000.0];
    
    // use HEAD since it is faster than actual data retrieving (GET)
    // this does not work due to WebView issue: http://stackoverflow.com/questions/25755555/stream-is-sending-an-event-before-being-opened
    //[request setHTTPMethod:@"HEAD"];
    
    [request setHTTPMethod:@"GET"];
    
    NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration] delegate:self delegateQueue:[NSOperationQueue currentQueue]];
    NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request];
    [dataTask resume];
}

- (void) URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler
{
    NSLog(@"task: didReceiveChallenge %@", challenge.protectionSpace);
    NSLog(@"auth method: %@", challenge.protectionSpace.authenticationMethod);
    
    // if no credentials are passed during first authentication attempt then
    // try to pass challenge automatically (using cached credentials)
    // this makes it possible to avoid passing credentials every app start
    if ([challenge previousFailureCount] == 0 && self.allowBypassAuth) {
        //        [[challenge sender] continueWithoutCredentialForAuthenticationChallenge:challenge];
        NSLog(@"allowBypassAuth");
        completionHandler(NSURLSessionAuthChallengeUseCredential, [NSURLCredential credentialForTrust: challenge.protectionSpace.serverTrust]);
        return;
    }
    
    if ([challenge previousFailureCount] == 0 && [self isSupportedAuthMethod: challenge.protectionSpace.authenticationMethod])
    {
        
        // use predefined credentials if provided
        if (![self.userName isEqual:[NSNull null]] && ![self.password isEqual:[NSNull null]]) {
            NSLog(@"Use username and password from args");
            completionHandler(NSURLSessionAuthChallengeUseCredential, [NSURLCredential credentialWithUser:self.userName password:self.password persistence:NSURLCredentialPersistenceForSession]);
        } else { // request credentials
            credentialsViewController = [[CredentialsViewController alloc] init];
            
            credentialsViewController.onResult = ^(NSString * userName, NSString* password, BOOL isCancelled)  {
                
                credentialsViewController = NULL;
                
                if (isCancelled) {
                    NSLog(@"Cancel auth challenge");
                    completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
                } else {
                    NSLog(@"Use username and password from view controller");
                    completionHandler(NSURLSessionAuthChallengeUseCredential, [NSURLCredential credentialWithUser:userName password:password persistence:NSURLCredentialPersistenceForSession]);
                }
            };
            
            [credentialsViewController requestUserCredentials:self.uri];
        }
    }
    else
    {
        NSLog(@"Reject protection space");
        completionHandler(NSURLSessionAuthChallengeRejectProtectionSpace, nil);
    }
}
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
    NSLog(@"didCompleteWithError: %@", error);
    CDVPluginResult* errorResult;
    if (error.code == NSURLErrorUserCancelledAuthentication) {
        errorResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString: @"cancelled"];
    } else {
        errorResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[error localizedDescription]];
    }
    
    [self.commandDelegate sendPluginResult:errorResult callbackId:self.callbackId];
}

-(void) URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveResponse:(NSURLResponse *)response completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
    NSLog(@"didReceiveResponse: %@", response);
    CDVPluginResult* pluginResult;
    
    NSInteger statusCode = [((NSHTTPURLResponse *)response) statusCode];
    
    // 405 means 'Method not allowed' which is totally ok to understand
    // we have successfully passed authentication
    if (statusCode == 200 || statusCode == 405) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:
                        [NSHTTPURLResponse localizedStringForStatusCode: statusCode]];
    }
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    completionHandler(NSURLSessionResponseAllow);
}

- (BOOL) isSupportedAuthMethod:(NSString*)authenticationMethod {
    // TODO extend to others
    return [authenticationMethod isEqualToString:NSURLAuthenticationMethodNTLM] ||
    [authenticationMethod isEqualToString:NSURLAuthenticationMethodHTTPBasic] ||
    [authenticationMethod isEqualToString:NSURLAuthenticationMethodHTTPDigest];
    
}

CredentialsViewController * credentialsViewController;

@end

@implementation CredentialsViewController {}

- (void) requestUserCredentials: (NSString*) uri
{
    // UIAlertController
    UIAlertController *alertController = [UIAlertController
                                          alertControllerWithTitle:@"Authentication Required"
                                          message:uri
                                          preferredStyle:UIAlertControllerStyleAlert];
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField){
        textField.placeholder = NSLocalizedString(@"LoginPlaceholder", @"Username");
    }];
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField){
        textField.placeholder = NSLocalizedString(@"PasswordPlaceholder", @"Password");
        textField.secureTextEntry = YES;
    }];
    UIAlertAction *cancelAction = [UIAlertAction
                                   actionWithTitle:NSLocalizedString(@"Cancel", @"Cancel action")
                                   style:UIAlertActionStyleCancel
                                   handler:^(UIAlertAction *action)
                                   {
                                       self.onResult(NULL, NULL, true);
                                       return;
                                   }];
    
    UIAlertAction *okAction = [UIAlertAction
                               actionWithTitle:NSLocalizedString(@"OK", @"OK action")
                               style:UIAlertActionStyleDefault
                               handler:^(UIAlertAction *action)
                               {
                                   UITextField *username = alertController.textFields.firstObject;
                                   UITextField *password = alertController.textFields.lastObject;
                                   
                                   self.onResult(username.text, password.text, false);
                                   
                               }];
    
    [alertController addAction:cancelAction];
    [alertController addAction:okAction];
    [self presentViewController:alertController animated:YES completion:nil];
}

@end
