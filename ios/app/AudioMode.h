#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"


@interface AudioMode : NSObject<RCTBridgeModule>

@property (nonatomic, readonly) AVAudioSession *session;
@property (nonatomic, readonly) NSString *category;
@property (nonatomic, readonly) NSString *mode;
@property (nonatomic, readonly) BOOL initialized;

@end
