#import <ImageIO/ImageIO.h>
#import <CoreImage/CIRenderDestination.h>
#import <Vision/Vision.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCVideoFrame.h>
#import <string.h>

#import "JitsiBackgroundEffects+Private.h"
#import "JMBackgroundFrameProcessor.h"

@interface JMVisionBackgroundMaskGenerator : NSObject <JMBackgroundMaskGenerator>

@property(nonatomic, strong) VNGeneratePersonSegmentationRequest *request;

@end

@implementation JMVisionBackgroundMaskGenerator

- (instancetype)init {
    self = [super init];
    if (self) {
        _request = [[VNGeneratePersonSegmentationRequest alloc] init];
        _request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelBalanced;
        _request.outputPixelFormat = kCVPixelFormatType_OneComponent8;
    }
    return self;
}

- (CIImage *)maskForImage:(CIImage *)image {
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:image options:@{}];
    NSError *error = nil;
    if (![handler performRequests:@[ self.request ] error:&error]) {
        return nil;
    }
    VNPixelBufferObservation *observation = self.request.results.firstObject;
    return observation ? [CIImage imageWithCVPixelBuffer:observation.pixelBuffer
                                             options:@{ kCIImageColorSpace: [NSNull null] }] : nil;
}

@end

@interface JMBackgroundFrameProcessor ()

@property(nonatomic, strong) RTCVideoSource *videoSource;
@property(nonatomic, copy) NSString *owner;
@property(nonatomic, strong) id<JMBackgroundMaskGenerator> maskGenerator;
@property(nonatomic, strong) CIContext *context;
@property(nonatomic, strong) NSLock *processingLock;
@property(nonatomic, assign) NSUInteger sessionEpoch;
@property(nonatomic, assign) BOOL usesDefaultMaskGenerator;
@property(nonatomic, assign) CVPixelBufferPoolRef outputPool;
@property(nonatomic, assign) size_t outputWidth;
@property(nonatomic, assign) size_t outputHeight;

- (BOOL)renderImage:(CIImage *)image toBuffer:(CVPixelBufferRef)buffer;

@end

@implementation JMBackgroundFrameProcessor

- (instancetype)initWithVideoSource:(RTCVideoSource *)videoSource
                     maskGenerator:(id<JMBackgroundMaskGenerator>)maskGenerator
                      sessionEpoch:(NSUInteger)sessionEpoch {
    self = [super init];
    if (self) {
        _videoSource = videoSource;
        _owner = [JitsiBackgroundEffects ownerSnapshot];
        _usesDefaultMaskGenerator = maskGenerator == nil;
        _maskGenerator = maskGenerator ?: [[JMVisionBackgroundMaskGenerator alloc] init];
        _context = [CIContext contextWithOptions:@{ kCIContextUseSoftwareRenderer: @NO }];
        _processingLock = [[NSLock alloc] init];
        _sessionEpoch = sessionEpoch;
    }
    return self;
}

- (void)dealloc {
    if (_outputPool) {
        CVPixelBufferPoolRelease(_outputPool);
    }
}

- (void)capturer:(RTCVideoCapturer *)capturer didCaptureVideoFrame:(RTCVideoFrame *)frame {
    JMBackgroundSettings *settings = [JitsiBackgroundEffects settingsSnapshot];
    if (![JitsiBackgroundEffects isOwnerCurrent:self.owner]
            || ![JitsiBackgroundEffects isCurrentSettings:settings]) {
        return;
    }
    if (settings.mode == JitsiBackgroundEffectModeNone) {
        [JitsiBackgroundEffects forwardFrame:frame capturer:capturer videoSource:self.videoSource
                                   settings:settings];
        return;
    }
    if (![self.processingLock tryLock]) {
        return;
    }

    if (self.sessionEpoch != settings.sessionEpoch) {
        self.sessionEpoch = settings.sessionEpoch;
        if (self.usesDefaultMaskGenerator) {
            self.maskGenerator = [[JMVisionBackgroundMaskGenerator alloc] init];
        }
    }
    BOOL didComposite = NO;
    RTCVideoFrame *processedFrame = [self processedFrame:frame settings:settings didComposite:&didComposite];
    if (!processedFrame) {
        [JitsiBackgroundEffects reportUnavailableForGeneration:settings.generation];
    } else {
        if (didComposite) {
            [JitsiBackgroundEffects reportProcessingForGeneration:settings.generation];
        }
        [JitsiBackgroundEffects forwardFrame:processedFrame capturer:capturer videoSource:self.videoSource
                                   settings:settings];
    }
    [self.processingLock unlock];
}

- (RTCVideoFrame *)processedFrame:(RTCVideoFrame *)frame
                        settings:(JMBackgroundSettings *)settings
                    didComposite:(BOOL *)didComposite {
    CIImage *source = [self uprightImageForFrame:frame];
    size_t width = frame.width;
    size_t height = frame.height;
    if (frame.rotation == RTCVideoRotation_90 || frame.rotation == RTCVideoRotation_270) {
        width = frame.height;
        height = frame.width;
    }
    if (width == 0 || height == 0 || width > 4096 || height > 4096 || width * height > 4000000) {
        return nil;
    }

    CIImage *result = source ? [self compositeImage:source settings:settings] : nil;
    BOOL compositeSucceeded = result != nil;
    if (!result) {
        [JitsiBackgroundEffects reportUnavailableForGeneration:settings.generation];
        result = [[CIImage imageWithColor:[CIColor colorWithRed:0 green:0 blue:0 alpha:1]]
                  imageByCroppingToRect:CGRectMake(0, 0, width, height)];
    }
    CVPixelBufferRef pixelBuffer = [self outputBufferWithWidth:width height:height];
    if (!pixelBuffer) {
        return nil;
    }

    if (CVPixelBufferLockBaseAddress(pixelBuffer, 0) != kCVReturnSuccess) {
        CVPixelBufferRelease(pixelBuffer);
        return nil;
    }
    memset(CVPixelBufferGetBaseAddress(pixelBuffer), 0, CVPixelBufferGetDataSize(pixelBuffer));
    CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

    if (![self renderImage:[result imageByCroppingToRect:CGRectMake(0, 0, width, height)] toBuffer:pixelBuffer]) {
        CVPixelBufferRelease(pixelBuffer);
        return nil;
    }
    RTCCVPixelBuffer *rtcBuffer = [[RTCCVPixelBuffer alloc] initWithPixelBuffer:pixelBuffer];
    RTCVideoFrame *output = [[RTCVideoFrame alloc] initWithBuffer:rtcBuffer
                                                       rotation:RTCVideoRotation_0
                                                    timeStampNs:frame.timeStampNs];
    output.timeStamp = frame.timeStamp;
    *didComposite = compositeSucceeded;
    CVPixelBufferRelease(pixelBuffer);
    return output;
}

- (BOOL)renderImage:(CIImage *)image toBuffer:(CVPixelBufferRef)buffer {
    CIRenderDestination *destination = [[CIRenderDestination alloc] initWithPixelBuffer:buffer];
    if (!destination) {
        return NO;
    }
    NSError *error = nil;
    CIRenderTask *task = [self.context startTaskToRender:image toDestination:destination error:&error];
    if (!task || error) {
        return NO;
    }
    CIRenderInfo *info = [task waitUntilCompletedAndReturnError:&error];
    return info != nil && error == nil;
}

- (CIImage *)uprightImageForFrame:(RTCVideoFrame *)frame {
    if (![frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
        return nil;
    }
    RTCCVPixelBuffer *rtcBuffer = (RTCCVPixelBuffer *)frame.buffer;
    CVPixelBufferRef pixelBuffer = rtcBuffer.pixelBuffer;
    size_t bufferWidth = CVPixelBufferGetWidth(pixelBuffer);
    size_t bufferHeight = CVPixelBufferGetHeight(pixelBuffer);
    CGRect crop = CGRectMake(rtcBuffer.cropX, bufferHeight - rtcBuffer.cropY - rtcBuffer.cropHeight,
                             rtcBuffer.cropWidth, rtcBuffer.cropHeight);
    if (crop.origin.x < 0 || crop.origin.y < 0 || crop.size.width <= 0 || crop.size.height <= 0
            || CGRectGetMaxX(crop) > bufferWidth || CGRectGetMaxY(crop) > bufferHeight) {
        return nil;
    }

    CIImage *image = [[CIImage imageWithCVPixelBuffer:pixelBuffer] imageByCroppingToRect:crop];
    image = [image imageByApplyingTransform:CGAffineTransformMakeTranslation(-crop.origin.x, -crop.origin.y)];
    image = [image imageByApplyingTransform:CGAffineTransformMakeScale(frame.width / crop.size.width,
                                                                       frame.height / crop.size.height)];
    CGImagePropertyOrientation orientation = kCGImagePropertyOrientationUp;
    switch (frame.rotation) {
        case RTCVideoRotation_90: orientation = kCGImagePropertyOrientationRight; break;
        case RTCVideoRotation_180: orientation = kCGImagePropertyOrientationDown; break;
        case RTCVideoRotation_270: orientation = kCGImagePropertyOrientationLeft; break;
        default: break;
    }
    image = [image imageByApplyingOrientation:orientation];
    CGRect extent = image.extent;
    return [image imageByApplyingTransform:CGAffineTransformMakeTranslation(-extent.origin.x, -extent.origin.y)];
}

- (CIImage *)compositeImage:(CIImage *)image settings:(JMBackgroundSettings *)settings {
    CGRect extent = image.extent;
    CIImage *background = nil;
    if (settings.mode == JitsiBackgroundEffectModeBlur
            || settings.mode == JitsiBackgroundEffectModeBlurLight) {
        CIImage *clamped = [image imageByClampingToExtent];
        background = [[clamped imageByApplyingFilter:@"CIGaussianBlur"
                                    withInputParameters:@{ kCIInputRadiusKey:
                                        settings.mode == JitsiBackgroundEffectModeBlurLight ? @8 : @18 }]
                      imageByCroppingToRect:extent];
    } else if (settings.mode == JitsiBackgroundEffectModeSolid) {
        background = [[CIImage imageWithColor:[CIColor colorWithRed:0.09 green:0.13 blue:0.2 alpha:1]]
                      imageByCroppingToRect:extent];
    } else if (settings.mode == JitsiBackgroundEffectModeImage && settings.backgroundImage) {
        background = [self aspectFillImage:settings.backgroundImage toExtent:extent];
    }
    CIImage *mask = [self.maskGenerator maskForImage:image];
    if (!background || !mask || mask.extent.size.width <= 0 || mask.extent.size.height <= 0) {
        return nil;
    }
    CGRect maskExtent = mask.extent;
    mask = [mask imageByApplyingTransform:CGAffineTransformMakeTranslation(-maskExtent.origin.x, -maskExtent.origin.y)];
    mask = [mask imageByApplyingTransform:CGAffineTransformMakeScale(extent.size.width / maskExtent.size.width,
                                                                     extent.size.height / maskExtent.size.height)];
    CIFilter *blend = [CIFilter filterWithName:@"CIBlendWithMask"];
    [blend setValue:image forKey:kCIInputImageKey];
    [blend setValue:background forKey:kCIInputBackgroundImageKey];
    [blend setValue:mask forKey:kCIInputMaskImageKey];
    return blend.outputImage;
}

- (CIImage *)aspectFillImage:(CIImage *)image toExtent:(CGRect)extent {
    CGRect sourceExtent = image.extent;
    if (sourceExtent.size.width <= 0 || sourceExtent.size.height <= 0) {
        return nil;
    }
    CGFloat scale = MAX(extent.size.width / sourceExtent.size.width,
                        extent.size.height / sourceExtent.size.height);
    CIImage *normalized = [image imageByApplyingTransform:CGAffineTransformMakeTranslation(-sourceExtent.origin.x,
                                                                                            -sourceExtent.origin.y)];
    CIImage *scaled = [normalized imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];
    CGFloat x = (extent.size.width - scaled.extent.size.width) / 2;
    CGFloat y = (extent.size.height - scaled.extent.size.height) / 2;
    return [[scaled imageByApplyingTransform:CGAffineTransformMakeTranslation(x, y)] imageByCroppingToRect:extent];
}

- (CVPixelBufferRef)outputBufferWithWidth:(size_t)width height:(size_t)height {
    if (![[RTCCVPixelBuffer supportedPixelFormats] containsObject:@(kCVPixelFormatType_32BGRA)]) {
        return nil;
    }
    if (!_outputPool || _outputWidth != width || _outputHeight != height) {
        if (_outputPool) {
            CVPixelBufferPoolRelease(_outputPool);
            _outputPool = nil;
        }
        NSDictionary *attributes = @{
            (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
            (NSString *)kCVPixelBufferWidthKey: @(width),
            (NSString *)kCVPixelBufferHeightKey: @(height),
            (NSString *)kCVPixelBufferIOSurfacePropertiesKey: @{},
            (NSString *)kCVPixelBufferMetalCompatibilityKey: @YES
        };
        NSDictionary *poolAttributes = @{ (NSString *)kCVPixelBufferPoolMinimumBufferCountKey: @3 };
        if (CVPixelBufferPoolCreate(kCFAllocatorDefault, (__bridge CFDictionaryRef)poolAttributes,
                                    (__bridge CFDictionaryRef)attributes, &_outputPool) != kCVReturnSuccess) {
            return nil;
        }
        _outputWidth = width;
        _outputHeight = height;
    }
    CVPixelBufferRef output = nil;
    NSDictionary *limit = @{ (NSString *)kCVPixelBufferPoolAllocationThresholdKey: @4 };
    if (CVPixelBufferPoolCreatePixelBufferWithAuxAttributes(kCFAllocatorDefault, _outputPool,
                                                            (__bridge CFDictionaryRef)limit, &output) != kCVReturnSuccess) {
        return nil;
    }
    return output;
}

@end
