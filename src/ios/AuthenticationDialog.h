/*
 * Copyright (c) Microsoft Open Technologies, Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
 */

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface AuthenticationDialog: CDVPlugin <NSURLConnectionDataDelegate, NSURLSessionDelegate, NSURLSessionTaskDelegate, NSURLSessionDataDelegate>

@property NSString *uri;
@property NSString *userName;
@property NSString *password;
@property Boolean allowBypassAuth;

@property NSString *callbackId;

- (void)authenticate:(CDVInvokedUrlCommand*)command;

@end


typedef void (^CredentialsViewCallback)(NSString* userName, NSString* password, BOOL isCancelled);

@interface CredentialsViewController : UIViewController<UIAlertViewDelegate>

@property (copy) CredentialsViewCallback onResult;

- (void) requestUserCredentials: (NSString*) uri;

@end
