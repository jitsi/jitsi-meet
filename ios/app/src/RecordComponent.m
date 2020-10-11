//
//  RecordComponent.m
//  jitsi-meet
//
//  Created by Varun Bansal on 05/06/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RecordComponent, RCTViewManager)

RCT_EXTERN_METHOD(destroy)

// to tell RN that broadcast has stopeed
RCT_EXPORT_VIEW_PROPERTY(onEnd, RCTDirectEventBlock)

// to tell RN that broadcast will begin
RCT_EXPORT_VIEW_PROPERTY(onStart, RCTDirectEventBlock)

RCT_EXPORT_VIEW_PROPERTY(title, NSString)

@end
