/*
 * Copyright @ 2021-present 8x8, Inc.
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

#import "DarwinNotificationCenter.h"

NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

@implementation DarwinNotificationCenter {
  CFNotificationCenterRef _notificationCenter;
}

+ (instancetype)sharedInstance {
  static DarwinNotificationCenter *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
      sharedInstance = [[self alloc] init];
  });
  
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
  }
  
  return self;
}

- (void)postNotificationWithName:(NSString*)name {
  CFNotificationCenterPostNotification(_notificationCenter, (__bridge CFStringRef)name, NULL, NULL, true);
}

@end

