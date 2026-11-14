#import <CoreImage/CoreImage.h>
#import <WebRTC/RTCVideoCapturer.h>
#import <WebRTC/RTCVideoSource.h>

NS_ASSUME_NONNULL_BEGIN

/** Generates a foreground mask for an upright video image. */
@protocol JMBackgroundMaskGenerator <NSObject>

/** Returns a mask, or nil when segmentation is unavailable. */
- (nullable CIImage *)maskForImage:(CIImage *)image;

@end

/**
 * Processes frames for the owner captured at initialization. Stale settings and
 * concurrent effect-processing frames are dropped. If compositing fails, a black frame is used
 * when possible; allocation or rendering failures drop the frame.
 */
@interface JMBackgroundFrameProcessor : NSObject <RTCVideoCapturerDelegate>

/**
 * Creates a processor that retains its video source and mask generator.
 * A nil generator selects Vision segmentation; the session epoch tracks when
 * the default generator must be recreated for a later active session.
 */
- (instancetype)initWithVideoSource:(RTCVideoSource *)videoSource
                     maskGenerator:(nullable id<JMBackgroundMaskGenerator>)maskGenerator
                      sessionEpoch:(NSUInteger)sessionEpoch;

@end

NS_ASSUME_NONNULL_END
