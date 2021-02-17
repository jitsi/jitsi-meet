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