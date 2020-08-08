//
//  ScreenShareController.h
//  app
//
//  Created by Varun Bansal on 08/08/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#ifndef ScreenShareController_h
#define ScreenShareController_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface ScreenShareController : RCTEventEmitter <RCTBridgeModule>
- (void) recStarted;
- (void) recStopped;

+ (ScreenShareController*) getSingleton;

@end

#endif /* ScreenShareController_h */
