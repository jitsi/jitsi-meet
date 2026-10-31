#import <CoreVideo/CoreVideo.h>
#import <XCTest/XCTest.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCVideoFrame.h>
#import <stdlib.h>
#import <string.h>

#import "../src/JitsiBackgroundEffects+Private.h"
#import "../src/JMBackgroundFrameProcessor.h"

@interface BackgroundFrameRecorder : NSObject
@property(nonatomic, strong) NSMutableArray<RTCVideoFrame *> *frames;
@end

@implementation BackgroundFrameRecorder
- (instancetype)init {
    self = [super init];
    if (self) _frames = [NSMutableArray array];
    return self;
}
- (void)capturer:(RTCVideoCapturer *)capturer didCaptureVideoFrame:(RTCVideoFrame *)frame {
    [self.frames addObject:frame];
}
@end

@interface FixedBackgroundMask : NSObject <JMBackgroundMaskGenerator>
@property(nonatomic, strong) CIImage *image;
@property(nonatomic, copy) void (^onRequest)(void);
@end

@implementation FixedBackgroundMask
- (CIImage *)maskForImage:(CIImage *)image {
    if (self.onRequest) self.onRequest();
    return self.image;
}
@end

@interface FailingRenderProcessor : JMBackgroundFrameProcessor
@end

@implementation FailingRenderProcessor
- (BOOL)renderImage:(CIImage *)image toBuffer:(CVPixelBufferRef)buffer {
    return NO;
}
@end

@interface JitsiBackgroundEffectsTests : XCTestCase
@end

@implementation JitsiBackgroundEffectsTests

- (void)setUp { [super setUp]; [JitsiBackgroundEffects reset]; }
- (void)tearDown { [JitsiBackgroundEffects reset]; [super tearDown]; }

- (CVPixelBufferRef)pixelBufferWithWidth:(size_t)width height:(size_t)height {
    CVPixelBufferRef buffer = NULL;
    NSDictionary *attributes = @{ (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
                                  (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES };
    CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA,
                                          (__bridge CFDictionaryRef)attributes, &buffer);
    XCTAssertEqual(status, kCVReturnSuccess);
    return buffer;
}

- (void)paintBuffer:(CVPixelBufferRef)buffer color:(const uint8_t [4])color {
    CVPixelBufferLockBaseAddress(buffer, 0);
    uint8_t *base = CVPixelBufferGetBaseAddress(buffer);
    for (size_t y = 0; y < CVPixelBufferGetHeight(buffer); y++) {
        for (size_t x = 0; x < CVPixelBufferGetWidth(buffer); x++) {
            memcpy(base + y * CVPixelBufferGetBytesPerRow(buffer) + x * 4, color, 4);
        }
    }
    CVPixelBufferUnlockBaseAddress(buffer, 0);
}

- (void)paintColumn:(size_t)column inBuffer:(CVPixelBufferRef)buffer color:(const uint8_t [4])color {
    CVPixelBufferLockBaseAddress(buffer, 0);
    uint8_t *base = CVPixelBufferGetBaseAddress(buffer);
    for (size_t y = 0; y < CVPixelBufferGetHeight(buffer); y++) {
        memcpy(base + y * CVPixelBufferGetBytesPerRow(buffer) + column * 4, color, 4);
    }
    CVPixelBufferUnlockBaseAddress(buffer, 0);
}

- (RTCVideoFrame *)frameFromBuffer:(CVPixelBufferRef)buffer rotation:(RTCVideoRotation)rotation {
    RTCCVPixelBuffer *rtcBuffer = [[RTCCVPixelBuffer alloc] initWithPixelBuffer:buffer];
    RTCVideoFrame *frame = [[RTCVideoFrame alloc] initWithBuffer:rtcBuffer rotation:rotation timeStampNs:123456789];
    frame.timeStamp = 9876;
    return frame;
}

- (void)captureFrame:(RTCVideoFrame *)frame withProcessor:(JMBackgroundFrameProcessor *)processor {
    RTCVideoCapturer *capturer = [[RTCVideoCapturer alloc] initWithDelegate:processor];
    [processor capturer:capturer didCaptureVideoFrame:frame];
}

- (JMBackgroundFrameProcessor *)processorWithRecorder:(BackgroundFrameRecorder *)recorder
                                               mask:(FixedBackgroundMask *)mask {
    return [[JMBackgroundFrameProcessor alloc] initWithVideoSource:(RTCVideoSource *)(id)recorder
                                                     maskGenerator:mask
                                                      sessionEpoch:[JitsiBackgroundEffects settingsSnapshot].sessionEpoch];
}

- (FixedBackgroundMask *)maskWithValues:(NSArray<NSNumber *> *)values {
    CVPixelBufferRef buffer = NULL;
    CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault, values.count, 1,
                                          kCVPixelFormatType_OneComponent8, NULL, &buffer);
    XCTAssertEqual(status, kCVReturnSuccess);
    CVPixelBufferLockBaseAddress(buffer, 0);
    uint8_t *base = CVPixelBufferGetBaseAddress(buffer);
    for (NSUInteger x = 0; x < values.count; x++) {
        base[x] = values[x].unsignedCharValue;
    }
    CVPixelBufferUnlockBaseAddress(buffer, 0);
    FixedBackgroundMask *mask = [FixedBackgroundMask new];
    mask.image = [CIImage imageWithCVPixelBuffer:buffer options:@{ kCIImageColorSpace: [NSNull null] }];
    CVPixelBufferRelease(buffer);
    return mask;
}

- (NSArray<NSNumber *> *)pixelAtX:(size_t)x y:(size_t)y frame:(RTCVideoFrame *)frame {
    RTCCVPixelBuffer *rtcBuffer = (RTCCVPixelBuffer *)frame.buffer;
    CVPixelBufferRef buffer = rtcBuffer.pixelBuffer;
    CVPixelBufferLockBaseAddress(buffer, kCVPixelBufferLock_ReadOnly);
    uint8_t *pixel = (uint8_t *)CVPixelBufferGetBaseAddress(buffer)
        + y * CVPixelBufferGetBytesPerRow(buffer) + x * 4;
    NSArray<NSNumber *> *result = @[ @(pixel[0]), @(pixel[1]), @(pixel[2]), @(pixel[3]) ];
    CVPixelBufferUnlockBaseAddress(buffer, kCVPixelBufferLock_ReadOnly);
    return result;
}

- (void)assertPixel:(NSArray<NSNumber *> *)actual near:(NSArray<NSNumber *> *)expected tolerance:(int)tolerance {
    for (NSUInteger index = 0; index < 4; index++) {
        XCTAssertLessThanOrEqual(abs(actual[index].intValue - expected[index].intValue), tolerance,
                                 @"channel=%lu actual=%@ expected=%@", (unsigned long)index, actual, expected);
    }
}

- (void)testNoneForwardsIdenticalFrameAndTimestamps {
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:[self maskWithValues:@[ @255 ]]];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:2 height:2];
    RTCVideoFrame *frame = [self frameFromBuffer:buffer rotation:RTCVideoRotation_90];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    XCTAssertTrue(recorder.frames.firstObject == frame);
    XCTAssertEqual(recorder.frames.firstObject.timeStampNs, 123456789);
    XCTAssertEqual(recorder.frames.firstObject.timeStamp, 9876);
    CVPixelBufferRelease(buffer);
}

- (void)testInvalidImageSelectionDoesNotChangeCurrentMode {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    NSUInteger generation = [JitsiBackgroundEffects settingsSnapshot].generation;
    XCTAssertFalse([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeImage backgroundImage:nil]);
    XCTAssertFalse([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeImage backgroundImage:[UIImage new]]);
    XCTAssertFalse([JitsiBackgroundEffects setMode:(JitsiBackgroundEffectMode)99 backgroundImage:nil]);
    XCTAssertEqual([JitsiBackgroundEffects mode], JitsiBackgroundEffectModeSolid);
    XCTAssertEqual([JitsiBackgroundEffects settingsSnapshot].generation, generation);
}

- (void)testSolidCompositesBlackWhiteAndHalfMasks {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    FixedBackgroundMask *mask = [self maskWithValues:@[ @0, @255, @128 ]];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:mask];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:3 height:1];
    const uint8_t foreground[4] = { 200, 100, 50, 255 };
    [self paintBuffer:buffer color:foreground];
    [self captureFrame:[self frameFromBuffer:buffer rotation:RTCVideoRotation_0] withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    RTCVideoFrame *output = recorder.frames.firstObject;
    [self assertPixel:[self pixelAtX:0 y:0 frame:output] near:@[ @51, @33, @23, @255 ] tolerance:2];
    [self assertPixel:[self pixelAtX:1 y:0 frame:output] near:@[ @200, @100, @50, @255 ] tolerance:2];
    [self assertPixel:[self pixelAtX:2 y:0 frame:output] near:@[ @150, @75, @39, @255 ] tolerance:3];
    XCTAssertEqual(output.timeStampNs, 123456789);
    XCTAssertEqual(output.timeStamp, 9876);
    CVPixelBufferRelease(buffer);
}

- (void)testImageAspectFillUsesCenteredColumnsAndOpaqueOutput {
    CVPixelBufferRef imageBuffer = [self pixelBufferWithWidth:4 height:2];
    const uint8_t black[4] = { 0, 0, 0, 255 };
    const uint8_t green[4] = { 0, 255, 0, 255 };
    const uint8_t red[4] = { 0, 0, 255, 255 };
    [self paintBuffer:imageBuffer color:black];
    [self paintColumn:1 inBuffer:imageBuffer color:green];
    [self paintColumn:2 inBuffer:imageBuffer color:red];
    CIContext *context = [CIContext context];
    CGImageRef cgImage = [context createCGImage:[CIImage imageWithCVPixelBuffer:imageBuffer]
                                     fromRect:CGRectMake(0, 0, 4, 2)];
    UIImage *image = [UIImage imageWithCGImage:cgImage];
    CGImageRelease(cgImage);
    CVPixelBufferRelease(imageBuffer);
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeImage backgroundImage:image]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:[self maskWithValues:@[ @0 ]]];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:2 height:2];
    [self paintBuffer:buffer color:black];
    [self captureFrame:[self frameFromBuffer:buffer rotation:RTCVideoRotation_0] withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    [self assertPixel:[self pixelAtX:0 y:0 frame:recorder.frames.firstObject]
                 near:@[ @0, @255, @0, @255 ] tolerance:3];
    [self assertPixel:[self pixelAtX:1 y:1 frame:recorder.frames.firstObject]
                 near:@[ @0, @0, @255, @255 ] tolerance:3];
    CVPixelBufferRelease(buffer);
}

- (void)testTransparentBackgroundImageProducesOpaqueVideo {
    UIGraphicsBeginImageContextWithOptions(CGSizeMake(2, 2), NO, 1);
    UIImage *transparent = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeImage backgroundImage:transparent]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder
                                                                   mask:[self maskWithValues:@[ @0 ]]];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:2 height:2];
    const uint8_t foreground[4] = { 100, 100, 100, 255 };
    [self paintBuffer:buffer color:foreground];
    [self captureFrame:[self frameFromBuffer:buffer rotation:RTCVideoRotation_0] withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    NSArray<NSNumber *> *pixel = [self pixelAtX:0 y:0 frame:recorder.frames.firstObject];
    XCTAssertEqual(pixel[3].intValue, 255);
    CVPixelBufferRelease(buffer);
}

- (void)testBlurChangesBackgroundAndPreservesForeground {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeBlur backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder
                                                                   mask:[self maskWithValues:@[ @0, @255 ]]];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:2 height:1];
    const uint8_t black[4] = { 0, 0, 0, 255 };
    const uint8_t white[4] = { 255, 255, 255, 255 };
    [self paintBuffer:buffer color:black];
    [self paintColumn:1 inBuffer:buffer color:white];
    [self captureFrame:[self frameFromBuffer:buffer rotation:RTCVideoRotation_0] withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    NSArray<NSNumber *> *background = [self pixelAtX:0 y:0 frame:recorder.frames.firstObject];
    XCTAssertGreaterThan(background[0].intValue, 0);
    XCTAssertLessThan(background[0].intValue, 255);
    [self assertPixel:[self pixelAtX:1 y:0 frame:recorder.frames.firstObject]
                 near:@[ @255, @255, @255, @255 ] tolerance:2];
    CVPixelBufferRelease(buffer);
}

- (void)testRotationsAndCropPreserveDimensionsAndTimestamps {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    for (NSNumber *rotationNumber in @[ @90, @180, @270 ]) {
        @autoreleasepool {
            BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
            JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder
                                                                           mask:[self maskWithValues:@[ @255 ]]];
            CVPixelBufferRef buffer = [self pixelBufferWithWidth:6 height:2];
            const uint8_t black[4] = { 0, 0, 0, 255 };
            const uint8_t white[4] = { 255, 255, 255, 255 };
            [self paintBuffer:buffer color:black];
            [self paintColumn:2 inBuffer:buffer color:white];
            [self paintColumn:3 inBuffer:buffer color:white];
            RTCCVPixelBuffer *cropped = [[RTCCVPixelBuffer alloc] initWithPixelBuffer:buffer
                                                                        adaptedWidth:2 adaptedHeight:1
                                                                           cropWidth:2 cropHeight:1 cropX:2 cropY:0];
            XCTAssertEqual(cropped.cropX, 2);
            XCTAssertEqual(cropped.cropY, 0);
            XCTAssertEqual(cropped.cropWidth, 2);
            XCTAssertEqual(cropped.cropHeight, 1);
            RTCVideoFrame *frame = [[RTCVideoFrame alloc] initWithBuffer:cropped
                                                                rotation:rotationNumber.intValue timeStampNs:123456789];
            frame.timeStamp = 9876;
            [self captureFrame:frame withProcessor:processor];
            XCTAssertEqual(recorder.frames.count, 1u);
            XCTAssertEqual(recorder.frames.firstObject.width, rotationNumber.intValue == 180 ? 2 : 1);
            XCTAssertEqual(recorder.frames.firstObject.height, rotationNumber.intValue == 180 ? 1 : 2);
            XCTAssertEqual(recorder.frames.firstObject.rotation, RTCVideoRotation_0);
            XCTAssertEqual(recorder.frames.firstObject.timeStampNs, 123456789);
            XCTAssertEqual(recorder.frames.firstObject.timeStamp, 9876);
            NSArray<NSNumber *> *actual = [self pixelAtX:0 y:0 frame:recorder.frames.firstObject];
            NSArray<NSNumber *> *expected = @[ @255, @255, @255, @255 ];
            for (NSUInteger channel = 0; channel < 4; channel++) {
                XCTAssertLessThanOrEqual(abs(actual[channel].intValue - expected[channel].intValue), 2,
                                         @"rotation=%@ channel=%lu actual=%@ expected=%@",
                                         rotationNumber, (unsigned long)channel, actual, expected);
            }
            CVPixelBufferRelease(buffer);
        }
    }
}

- (void)testRotationsPlaceAsymmetricPixelsInClockwiseOrder {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    const uint8_t colors[6][4] = {
        { 0, 0, 255, 255 }, { 0, 255, 0, 255 }, { 255, 0, 0, 255 },
        { 255, 255, 0, 255 }, { 255, 0, 255, 255 }, { 0, 255, 255, 255 }
    };
    NSArray<NSNumber *> *rotations = @[ @0, @90, @180, @270 ];
    NSArray<NSArray<NSNumber *> *> *expectedOrders = @[
        @[ @0, @1, @2, @3, @4, @5 ],
        @[ @3, @0, @4, @1, @5, @2 ],
        @[ @5, @4, @3, @2, @1, @0 ],
        @[ @2, @5, @1, @4, @0, @3 ]
    ];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:3 height:2];
    CVPixelBufferLockBaseAddress(buffer, 0);
    uint8_t *base = CVPixelBufferGetBaseAddress(buffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(buffer);
    for (size_t y = 0; y < 2; y++) {
        memcpy(base + y * bytesPerRow, colors[y * 3], 3 * 4);
    }
    CVPixelBufferUnlockBaseAddress(buffer, 0);
    for (NSUInteger index = 0; index < rotations.count; index++) {
        BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
        JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder
                                                                       mask:[self maskWithValues:@[ @255 ]]];
        RTCVideoRotation rotation = rotations[index].intValue;
        [self captureFrame:[self frameFromBuffer:buffer rotation:rotation] withProcessor:processor];
        XCTAssertEqual(recorder.frames.count, 1u);
        RTCVideoFrame *output = recorder.frames.firstObject;
        size_t width = index % 2 == 0 ? 3 : 2;
        size_t height = index % 2 == 0 ? 2 : 3;
        XCTAssertEqual(output.width, width);
        XCTAssertEqual(output.height, height);
        XCTAssertEqual(output.rotation, RTCVideoRotation_0);
        for (size_t pixel = 0; pixel < 6; pixel++) {
            const uint8_t *color = colors[expectedOrders[index][pixel].unsignedIntegerValue];
            NSArray<NSNumber *> *expected = @[ @(color[0]), @(color[1]), @(color[2]), @(color[3]) ];
            [self assertPixel:[self pixelAtX:pixel % width y:pixel / width frame:output]
                         near:expected tolerance:2];
        }
    }
    CVPixelBufferRelease(buffer);
}

- (void)testMissingMaskOutputsBlackAndReportsUnavailable {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:[FixedBackgroundMask new]];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:2 height:2];
    const uint8_t white[4] = { 255, 255, 255, 255 };
    [self paintBuffer:buffer color:white];
    RTCVideoFrame *input = [self frameFromBuffer:buffer rotation:RTCVideoRotation_0];
    [self captureFrame:input withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    XCTAssertFalse(recorder.frames.firstObject == input);
    [self assertPixel:[self pixelAtX:0 y:0 frame:recorder.frames.firstObject]
                 near:@[ @0, @0, @0, @255 ] tolerance:1];
    XCTAssertEqual([JitsiBackgroundEffects status], JitsiBackgroundEffectStatusUnavailable);
    CVPixelBufferRelease(buffer);
}

- (void)testRenderFailureDoesNotForwardFrameAndReportsUnavailable {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    FailingRenderProcessor *processor = [[FailingRenderProcessor alloc]
        initWithVideoSource:(RTCVideoSource *)(id)recorder
        maskGenerator:[self maskWithValues:@[ @255 ]]
        sessionEpoch:[JitsiBackgroundEffects settingsSnapshot].sessionEpoch];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    RTCVideoFrame *frame = [self frameFromBuffer:buffer rotation:RTCVideoRotation_0];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 0u);
    XCTAssertEqual([JitsiBackgroundEffects status], JitsiBackgroundEffectStatusUnavailable);
    CVPixelBufferRelease(buffer);
}

- (void)testValidFrameRestoresProcessingAfterUnavailable {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    FixedBackgroundMask *mask = [FixedBackgroundMask new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:mask];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    RTCVideoFrame *frame = [self frameFromBuffer:buffer rotation:RTCVideoRotation_0];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual([JitsiBackgroundEffects status], JitsiBackgroundEffectStatusUnavailable);
    mask.image = [self maskWithValues:@[ @255 ]].image;
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 2u);
    XCTAssertEqual([JitsiBackgroundEffects status], JitsiBackgroundEffectStatusProcessing);
    CVPixelBufferRelease(buffer);
}

- (void)testResetReusesWarmProcessorForTheNewScope {
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *oldProcessor = [self processorWithRecorder:recorder
                                                                      mask:[self maskWithValues:@[ @255 ]]];
    [JitsiBackgroundEffects reset];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    [self captureFrame:[self frameFromBuffer:buffer rotation:RTCVideoRotation_0] withProcessor:oldProcessor];
    XCTAssertEqual(recorder.frames.count, 1u);
    CVPixelBufferRelease(buffer);
}

- (void)testReconfigurationDuringSegmentationDropsStaleResult {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    FixedBackgroundMask *mask = [self maskWithValues:@[ @0 ]];
    mask.onRequest = ^{ [JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeNone backgroundImage:nil]; };
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:mask];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    RTCVideoFrame *frame = [self frameFromBuffer:buffer rotation:RTCVideoRotation_0];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 0u);
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    XCTAssertTrue(recorder.frames.firstObject == frame);
    CVPixelBufferRelease(buffer);
}

- (void)testOldSessionCannotChangeOrEndNewSession {
    NSUInteger oldSession = [JitsiBackgroundEffects beginSession];
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid
                                 backgroundImage:nil session:oldSession]);
    NSUInteger newSession = [JitsiBackgroundEffects beginSession];
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeBlur
                                 backgroundImage:nil session:newSession]);
    XCTAssertFalse([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeNone
                                  backgroundImage:nil session:oldSession]);
    [JitsiBackgroundEffects endSession:oldSession];
    XCTAssertEqual([JitsiBackgroundEffects mode], JitsiBackgroundEffectModeBlur);
    XCTAssertEqual([JitsiBackgroundEffects status], JitsiBackgroundEffectStatusProcessing);
    [JitsiBackgroundEffects endSession:newSession];
    XCTAssertEqual([JitsiBackgroundEffects mode], JitsiBackgroundEffectModeNone);
}

- (void)testRepeatedOwnerClaimPreservesTheActiveChoice {
    NSString *owner = [NSUUID UUID].UUIDString;
    NSUInteger revision = [JitsiBackgroundEffects claimOwner:owner];
    NSUInteger session = [JitsiBackgroundEffects beginSessionForOwner:owner revision:revision];
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil session:session]);
    XCTAssertEqual([JitsiBackgroundEffects claimOwner:owner], revision);
    XCTAssertEqualObjects([JitsiBackgroundEffects curatedState][@"sessionId"], @(session));
    XCTAssertEqual([JitsiBackgroundEffects mode], JitsiBackgroundEffectModeSolid);
    [JitsiBackgroundEffects releaseOwner:owner];
}

- (void)testWarmProcessorDropsFrozenFramesAndResumesInANewScope {
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:[self maskWithValues:@[ @255 ]]];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    RTCVideoFrame *frame = [self frameFromBuffer:buffer rotation:RTCVideoRotation_0];
    NSUInteger oldSession = [JitsiBackgroundEffects settingsSnapshot].sessionEpoch;
    [JitsiBackgroundEffects endSession:oldSession];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 0u);
    NSUInteger newSession = [JitsiBackgroundEffects beginSession];
    [JitsiBackgroundEffects endSession:oldSession];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    XCTAssertTrue(recorder.frames.firstObject == frame);
    XCTAssertEqualObjects([JitsiBackgroundEffects curatedState][@"sessionId"], @(newSession));
    CVPixelBufferRelease(buffer);
}

- (void)testNativeLeaveInvalidatesPendingBridgeCallsWithoutReplacingTheOwner {
    NSString *owner = [NSUUID UUID].UUIDString;
    NSUInteger oldRevision = [JitsiBackgroundEffects claimOwner:owner];
    [JitsiBackgroundEffects beginSessionForOwner:owner revision:oldRevision];
    NSUInteger newRevision = [JitsiBackgroundEffects advanceOwner:owner];
    XCTAssertNotEqual(oldRevision, newRevision);
    XCTAssertEqual([JitsiBackgroundEffects beginSessionForOwner:owner revision:oldRevision], 0u);
    NSUInteger session = [JitsiBackgroundEffects beginSessionForOwner:owner revision:newRevision];
    XCTAssertNotEqual(session, 0u);
    [JitsiBackgroundEffects freezeOwner:owner revision:oldRevision];
    [JitsiBackgroundEffects endSession:session owner:owner revision:oldRevision];
    XCTAssertEqualObjects([JitsiBackgroundEffects curatedState][@"sessionId"], @(session));
    [JitsiBackgroundEffects releaseOwner:owner];
    XCTAssertEqual([JitsiBackgroundEffects beginSessionForOwner:owner revision:newRevision], 0u);
}

- (void)testProcessorCannotAdoptAnotherViewsSession {
    NSString *oldOwner = [NSUUID UUID].UUIDString;
    NSUInteger oldRevision = [JitsiBackgroundEffects claimOwner:oldOwner];
    [JitsiBackgroundEffects beginSessionForOwner:oldOwner revision:oldRevision];
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:[self maskWithValues:@[ @255 ]]];
    NSString *newOwner = [NSUUID UUID].UUIDString;
    NSUInteger newRevision = [JitsiBackgroundEffects claimOwner:newOwner];
    NSUInteger session = [JitsiBackgroundEffects beginSessionForOwner:newOwner revision:newRevision];
    [JitsiBackgroundEffects releaseOwner:oldOwner];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    [self captureFrame:[self frameFromBuffer:buffer rotation:RTCVideoRotation_0] withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 0u);
    XCTAssertEqualObjects([JitsiBackgroundEffects curatedState][@"sessionId"], @(session));
    CVPixelBufferRelease(buffer);
    [JitsiBackgroundEffects releaseOwner:newOwner];
}

- (void)testSessionChangeDuringSegmentationDropsTheOldFrameAndReusesTheProcessor {
    XCTAssertTrue([JitsiBackgroundEffects setMode:JitsiBackgroundEffectModeSolid backgroundImage:nil]);
    BackgroundFrameRecorder *recorder = [BackgroundFrameRecorder new];
    FixedBackgroundMask *mask = [self maskWithValues:@[ @0 ]];
    mask.onRequest = ^{ [JitsiBackgroundEffects beginSession]; };
    JMBackgroundFrameProcessor *processor = [self processorWithRecorder:recorder mask:mask];
    CVPixelBufferRef buffer = [self pixelBufferWithWidth:1 height:1];
    RTCVideoFrame *frame = [self frameFromBuffer:buffer rotation:RTCVideoRotation_0];
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 0u);
    [self captureFrame:frame withProcessor:processor];
    XCTAssertEqual(recorder.frames.count, 1u);
    XCTAssertTrue(recorder.frames.firstObject == frame);
    CVPixelBufferRelease(buffer);
}

@end
