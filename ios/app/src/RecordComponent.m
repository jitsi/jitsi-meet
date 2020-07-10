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

RCT_EXTERN_METHOD(getFrame)

RCT_EXPORT_VIEW_PROPERTY(onUpdate, RCTDirectEventBlock)


@end
