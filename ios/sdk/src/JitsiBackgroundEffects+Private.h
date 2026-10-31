#import <CoreImage/CoreImage.h>
#import <WebRTC/RTCVideoCapturer.h>
#import <WebRTC/RTCVideoSource.h>

#import "JitsiBackgroundEffects.h"

NS_ASSUME_NONNULL_BEGIN

/** Immutable snapshot identified by its settings generation and session epoch. */
@interface JMBackgroundSettings : NSObject

@property(nonatomic, readonly) JitsiBackgroundEffectMode mode;
@property(nonatomic, readonly, nullable) CIImage *backgroundImage;
@property(nonatomic, readonly) NSUInteger generation;
@property(nonatomic, readonly) NSUInteger sessionEpoch;

/** Creates a snapshot of the effect mode, image, generation, and session epoch. */
- (instancetype)initWithMode:(JitsiBackgroundEffectMode)mode
             backgroundImage:(nullable CIImage *)backgroundImage
                  generation:(NSUInteger)generation
                sessionEpoch:(NSUInteger)sessionEpoch;

@end

/** Internal session, owner, and frame coordination for the native bridge. */
@interface JitsiBackgroundEffects (Private)

/** Starts an active session with no effect and returns its epoch. */
+ (NSUInteger)beginSession;
/** Applies a mode to the current session; invalid images or inactive sessions are rejected. */
+ (BOOL)setMode:(JitsiBackgroundEffectMode)mode backgroundImage:(nullable UIImage *)image;
/** Applies a mode only if the supplied session epoch is active and current. */
+ (BOOL)setMode:(JitsiBackgroundEffectMode)mode
  backgroundImage:(nullable UIImage *)image
          session:(NSUInteger)session;
/** Ends the matching nonzero session; stale epochs have no effect. */
+ (void)endSession:(NSUInteger)session;
/** Starts a new session with default effect settings. */
+ (void)reset;
/** Returns the mode in the current settings snapshot. */
+ (JitsiBackgroundEffectMode)mode;
/** Returns the current processing status. */
+ (JitsiBackgroundEffectStatus)status;

/** Claims an owner, ending the previous owner session if the owner changes. Returns the revision. */
+ (NSUInteger)claimOwner:(NSString *)owner;
/** Freezes a matching owner and advances its revision; returns the current revision. */
+ (NSUInteger)advanceOwner:(NSString *)owner;
/** Returns the current owner, or an empty string when no owner is claimed. */
+ (NSString *)ownerSnapshot;
/** Checks whether the owner matches the current owner snapshot. */
+ (BOOL)isOwnerCurrent:(NSString *)owner;
/** Checks the current owner and its revision together. */
+ (BOOL)isOwnerCurrent:(NSString *)owner revision:(NSUInteger)revision;
/** Ends the matching owner session while retaining ownership. */
+ (void)freezeOwner:(NSString *)owner;
/** Freezes and releases a matching owner, advancing its revision. */
+ (void)releaseOwner:(NSString *)owner;
/** Starts a session for the current owner and revision; returns zero if they are stale. */
+ (NSUInteger)beginSessionForOwner:(NSString *)owner revision:(NSUInteger)revision;
/** Freezes the owner only when both owner and revision match. */
+ (void)freezeOwner:(NSString *)owner revision:(NSUInteger)revision;
/** Ends the session only when owner, revision, and session epoch match. */
+ (void)endSession:(NSUInteger)session owner:(NSString *)owner revision:(NSUInteger)revision;
/** Checks whether a snapshot belongs to the active session and current generation. */
+ (BOOL)isCurrentSettings:(JMBackgroundSettings *)settings;
/** Returns the current immutable settings snapshot. */
+ (JMBackgroundSettings *)settingsSnapshot;
/** Returns the active session ID, selected choice, and processing status. */
+ (NSDictionary *)curatedState;
/** Selects a choice for the active session; returns NO for stale sessions or invalid input. */
+ (BOOL)selectMode:(JitsiBackgroundEffectMode)mode
   backgroundImage:(nullable UIImage *)image
            choice:(NSString *)choice
           session:(NSUInteger)session;
/** Reports a processing failure only for the current non-none generation. */
+ (void)reportUnavailableForGeneration:(NSUInteger)generation;
/** Reports successful processing only for the current non-none generation. */
+ (void)reportProcessingForGeneration:(NSUInteger)generation;
/** Creates a frame processor using the current session epoch. */
+ (id<RTCVideoCapturerDelegate>)makeProcessorWithVideoSource:(RTCVideoSource *)videoSource;
/** Forwards a frame only while its snapshot is current and the session remains active. */
+ (void)forwardFrame:(RTCVideoFrame *)frame
            capturer:(RTCVideoCapturer *)capturer
         videoSource:(RTCVideoSource *)videoSource
            settings:(JMBackgroundSettings *)settings;

@end

NS_ASSUME_NONNULL_END
