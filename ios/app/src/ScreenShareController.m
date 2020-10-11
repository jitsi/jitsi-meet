//
//  ScreenShareController.m
//  jitsi-meet
//
//  Created by Varun Bansal on 08/08/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTConvert.h>
#import "ScreenShareController.h"
#import "Digitales_Klassenzimmer-Swift.h"


@implementation ScreenShareController

RCT_EXPORT_MODULE();

+ (id)allocWithZone:(NSZone *)zone {
    static ScreenShareController *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [super allocWithZone:zone];
    });
    return sharedInstance;
}

+ (ScreenShareController*) getSingleton {
  return [ScreenShareController allocWithZone:nil];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"ScreenRecState"];
}

-(void) recStarted
{
  NSLog(@"starting recording");
  [self sendEventWithName:@"ScreenRecState" body:@{@"name": @"recStarted"}];
}

-(void) recStopped
{
  NSLog(@"stopping recording");
  [self sendEventWithName:@"ScreenRecState" body:@{@"name": @"recStopped"}];
}

//stopRecording
RCT_EXPORT_METHOD(stopRecording)
{
  RCTLogInfo(@"stopping recording - from react native");
  [SocketShim closeSocket];
}

@end
