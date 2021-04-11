# Virtual Background on stream effects

> Inspired from https://ai.googleblog.com/2020/10/background-features-in-google-meet.html and https://github.com/Volcomix/virtual-background.git

#### Canvas 2D + CPU

This rendering pipeline is pretty much the same as for BodyPix. It relies on Canvas compositing properties to blend rendering layers according to the segmentation mask.

Interactions with TFLite inference tool are executed on CPU to convert from UInt8 to Float32 for the model input and to apply softmax on the model output.

The framerate is higher and the quality looks better than BodyPix

#### SIMD and non-SIMD

How to test on SIMD:
1. Go to chrome://flags/
2. Search for SIMD flag
3. Enable WebAssembly SIMD support(Enables support for the WebAssembly SIMD proposal).
4. Reopen Google Chrome

More details:
- [WebAssembly](https://webassembly.org/)
- [WebAssembly SIMD](https://github.com/WebAssembly/simd)
- [TFLite](https://blog.tensorflow.org/2020/07/accelerating-tensorflow-lite-xnnpack-integration.html)

## LICENSE

The mdoels vendored here were downloaded early January (they were available as early as the 4th), before Google switched the license away from Apache 2. Thus we understand they are not covered by the new license which according to the [model card](https://drive.google.com/file/d/1lnP1bRi9CSqQQXUHa13159vLELYDgDu0/view) dates from the 21st of January.

We are not lawyers so do get legal advise if in doubt.

References:

- Model license discussion: https://github.com/tensorflow/tfjs/issues/4177
- Current vendored model is discovered: https://github.com/tensorflow/tfjs/issues/4177#issuecomment-753934631
- License change is noticed: https://github.com/tensorflow/tfjs/issues/4177#issuecomment-771536641
