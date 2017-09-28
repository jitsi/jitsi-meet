/*
 * Copyright @ 2017-present Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "JitsiMeetViewDelegate.h"

@interface JitsiMeetView : UIView

@property (nonatomic, nullable, weak) id<JitsiMeetViewDelegate> delegate;

@property (copy, nonatomic, nullable) NSURL *defaultURL;

@property (nonatomic) BOOL welcomePageEnabled;

+             (BOOL)application:(UIApplication *_Nonnull)application
  didFinishLaunchingWithOptions:(NSDictionary *_Nonnull)launchOptions;

+    (BOOL)application:(UIApplication * _Nonnull)application
  continueUserActivity:(NSUserActivity * _Nonnull)userActivity
    restorationHandler:(void (^ _Nullable)(NSArray * _Nullable))restorationHandler;

+ (BOOL)application:(UIApplication * _Nonnull)application
            openURL:(NSURL * _Nonnull)URL
  sourceApplication:(NSString * _Nullable)sourceApplication
         annotation:(id _Nullable)annotation;

- (void)loadURL:(NSURL * _Nullable)url;

- (void)loadURLObject:(NSDictionary * _Nullable)urlObject;

- (void)loadURLString:(NSString * _Nullable)urlString;

@end
