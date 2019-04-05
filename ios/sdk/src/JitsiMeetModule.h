//
//  JitsiMeetModule.h
//  sdk
//
//  Created by Igor Ferreira on 05/04/2019.
//  Copyright © 2019 Jitsi. All rights reserved.
//

#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#ifndef JitsiMeetModule_h
#define JitsiMeetModule_h

FOUNDATION_EXPORT double JitsiMeetVersionNumber;
FOUNDATION_EXPORT const unsigned char JitsiMeetVersionString[];

#import "JitsiMeet.h"
#import "JitsiMeetView.h"
#import "JitsiMeetViewDelegate.h"
#import "JitsiMeetConferenceOptions.h"

#endif /* JitsiMeetModule_h */
