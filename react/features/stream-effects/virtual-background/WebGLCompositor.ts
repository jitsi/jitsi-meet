import logger from '../../virtual-background/logger';

const VERTEX_SHADER_SOURCE = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

// GLSL ES 1.0 — compatible with both WebGL 1 and WebGL 2.
const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;

    uniform sampler2D u_camera;
    uniform sampler2D u_background;
    uniform sampler2D u_mask;
    uniform sampler2D u_prevMask;
    uniform float     u_temporalRatio;
    uniform float     u_edgeLow;
    uniform float     u_edgeHigh;
    uniform vec2      u_maskTexelSize;

    varying vec2 v_texCoord;

    // 3x3 Gaussian blur (sigma≈1) sampled in mask-texture space.
    // When u_maskTexelSize is (0,0) all taps collapse to tc — weights sum to 1.0, no blur.
    float sampleMaskBlurred(sampler2D tex, vec2 tc) {
        vec2 t = u_maskTexelSize;
        return
            texture2D(tex, tc + vec2(-t.x, -t.y)).r * 0.0625 +
            texture2D(tex, tc + vec2( 0.0, -t.y)).r * 0.125  +
            texture2D(tex, tc + vec2( t.x, -t.y)).r * 0.0625 +
            texture2D(tex, tc + vec2(-t.x,  0.0)).r * 0.125  +
            texture2D(tex, tc                    ).r * 0.25   +
            texture2D(tex, tc + vec2( t.x,  0.0)).r * 0.125  +
            texture2D(tex, tc + vec2(-t.x,  t.y)).r * 0.0625 +
            texture2D(tex, tc + vec2( 0.0,  t.y)).r * 0.125  +
            texture2D(tex, tc + vec2( t.x,  t.y)).r * 0.0625;
    }

    void main() {
        vec4  fg        = texture2D(u_camera,     v_texCoord);
        vec4  bg        = texture2D(u_background, v_texCoord);
        float curAlpha  = sampleMaskBlurred(u_mask,     v_texCoord);
        float prevAlpha = sampleMaskBlurred(u_prevMask, v_texCoord);

        float blended = mix(curAlpha, prevAlpha, u_temporalRatio);
        float alpha   = smoothstep(u_edgeLow, u_edgeHigh, blended);

        gl_FragColor = mix(bg, fg, alpha);
    }
`;

// Full-screen quad: two triangles covering clip space [-1,1].
const QUAD_VERTICES = new Float32Array([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    1, 1, 1, 0
]);

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);

    if (!shader) {
        throw new Error('[VirtualBackground] WebGLCompositor: createShader returned null');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);
        throw new Error(`[VirtualBackground] WebGLCompositor: shader compile error — ${info}`);
    }

    return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    const program = gl.createProgram();

    if (!program) {
        throw new Error('[VirtualBackground] WebGLCompositor: createProgram returned null');
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);

        gl.deleteProgram(program);
        throw new Error(`[VirtualBackground] WebGLCompositor: program link error — ${info}`);
    }
    gl.deleteShader(vert);
    gl.deleteShader(frag);

    return program;
}

function createTexture(gl: WebGLRenderingContext): WebGLTexture {
    const tex = gl.createTexture();

    if (!tex) {
        throw new Error('[VirtualBackground] WebGLCompositor: createTexture returned null');
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return tex;
}

/**
 * WebGL-based compositor that blends camera, background, and segmentation mask
 * using a fragment shader with temporal smoothing and edge feathering (smoothstep).
 *
 * Falls back gracefully when context creation fails — callers should check
 * {@link WebGLCompositor#isAvailable} before use.
 */
export default class WebGLCompositor {
    _canvas: HTMLCanvasElement;
    _gl: WebGLRenderingContext | null = null;

    // Bound event handlers — stored so they can be removed in dispose().
    _onContextLostBound: (() => void) | null = null;
    _onContextRestoredBound: (() => void) | null = null;

    _program: WebGLProgram | null = null;
    _quadBuffer: WebGLBuffer | null = null;
    _texBackground: WebGLTexture | null = null;
    _texCamera: WebGLTexture | null = null;
    _texMask: WebGLTexture | null = null;
    _texMaskB: WebGLTexture | null = null;

    // Attribute locations — resolved once after program link, reused every frame.
    // When sharing a GL context with TF.js the vertex attribute state (buffer
    // binding + vertexAttribPointer) is global and gets overwritten by TF.js
    // inference. Re-binding before drawArrays restores our state without the
    // overhead of re-querying locations each frame.
    _aPosition = -1;
    _aTexCoord = -1;

    // Uniform locations — resolved once after program link.
    _uBackground: WebGLUniformLocation | null = null;
    _uCamera: WebGLUniformLocation | null = null;
    _uEdgeHigh: WebGLUniformLocation | null = null;
    _uEdgeLow: WebGLUniformLocation | null = null;
    _uMask: WebGLUniformLocation | null = null;
    _uMaskTexelSize: WebGLUniformLocation | null = null;
    _uPrevMask: WebGLUniformLocation | null = null;
    _uTemporalRatio: WebGLUniformLocation | null = null;

    /**
     * Creates a WebGLCompositor targeting the given canvas.
     *
     * @param {HTMLCanvasElement} canvas - Output canvas element.
     */
    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this._init();

        this._onContextLostBound = this._onContextLost.bind(this);
        this._onContextRestoredBound = this._onContextRestored.bind(this);
        canvas.addEventListener('webglcontextlost', this._onContextLostBound, false);
        canvas.addEventListener('webglcontextrestored', this._onContextRestoredBound, false);
    }

    /**
     * Returns true if a WebGL context is active and ready.
     *
     * @returns {boolean}
     */
    get isAvailable(): boolean {
        return this._gl !== null && !this._gl.isContextLost();
    }

    /**
     * Composites using raw {@code ImageData} for the segmentation mask.
     *
     * Identical to {@link compositeWithSource} in every way except the mask is
     * uploaded via the {@code Uint8Array} form of {@code texImage2D} rather than
     * via the {@code CanvasImageSource} form. This is critical when the mask data
     * comes from {@code Mask.toImageData()} because the {@code CanvasImageSource}
     * upload path reads from the browser's internal canvas storage which uses
     * <em>premultiplied alpha</em>: for this model the R and A channels are both
     * equal to the segmentation confidence, so the canvas stores
     * {@code R = confidence²} instead of {@code confidence}. The raw upload path
     * bypasses this distortion entirely.
     *
     * Temporal ping-pong is still managed GPU-side via {@code _texMask} /
     * {@code _texMaskB} — no CPU-side mask copy is needed.
     *
     * @param {TexImageSource} cameraSource - Live camera frame (HTMLVideoElement, ImageBitmap, VideoFrame, etc.).
     * @param {HTMLCanvasElement} backgroundSource - Pre-rendered background canvas.
     * @param {ImageData} maskData - Current-frame segmentation mask (raw bytes).
     * @param {number} temporalRatio - Blend weight toward previous mask.
     * @param {number} edgeLow - Smoothstep lower threshold.
     * @param {number} edgeHigh - Smoothstep upper threshold.
     * @param {boolean} isFirstFrame - When true, seeds the previous-mask texture
     * from the current mask so the first frame blends against itself.
     * @param {number} maskBlurRadius - Gaussian blur radius in mask-texture pixels (0 = no blur).
     * Pass 4 for TF.js body-segmentation (near-binary output needs softening); 0 for ORT/TFLite.
     * @returns {void}
     */
    compositeFromImageData(
            cameraSource: TexImageSource,
            backgroundSource: HTMLCanvasElement,
            maskData: ImageData,
            temporalRatio: number,
            edgeLow: number,
            edgeHigh: number,
            isFirstFrame: boolean,
            maskBlurRadius = 0
    ): void {
        const gl = this._gl;

        if (!gl || !this._program) {
            return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        gl.useProgram(this._program);

        // Camera texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._texCamera);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cameraSource);
        gl.uniform1i(this._uCamera, 0);

        // Background texture
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._texBackground);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundSource);
        gl.uniform1i(this._uBackground, 1);

        // Current mask — raw Uint8Array upload bypasses browser premultiplied-alpha
        // conversion that would corrupt the R channel when uploading via canvas.
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this._texMask);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, maskData.width, maskData.height,
            0, gl.RGBA, gl.UNSIGNED_BYTE, maskData.data);
        gl.uniform1i(this._uMask, 2);

        // Previous mask — GPU ping-pong via _texMaskB.
        // On the first frame, seed from the current mask so the blend starts
        // with a consistent state.
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this._texMaskB);
        if (isFirstFrame) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, maskData.width, maskData.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, maskData.data);
        }
        gl.uniform1i(this._uPrevMask, 3);

        gl.uniform1f(this._uTemporalRatio, temporalRatio);
        gl.uniform1f(this._uEdgeLow, edgeLow);
        gl.uniform1f(this._uEdgeHigh, edgeHigh);
        gl.uniform2f(this._uMaskTexelSize, maskBlurRadius / maskData.width, maskBlurRadius / maskData.height);

        this._bindQuadState(gl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // GPU ping-pong: swap _texMask ↔ _texMaskB.
        const tmp = this._texMask;

        this._texMask = this._texMaskB;
        this._texMaskB = tmp;
    }

    /**
     * Releases all WebGL resources.
     *
     * @returns {void}
     */
    dispose(): void {
        // Remove event listeners first so the canvas no longer holds a reference
        // to this compositor via the bound handler closures.
        if (this._onContextLostBound) {
            this._canvas.removeEventListener('webglcontextlost', this._onContextLostBound);
            this._onContextLostBound = null;
        }
        if (this._onContextRestoredBound) {
            this._canvas.removeEventListener('webglcontextrestored', this._onContextRestoredBound);
            this._onContextRestoredBound = null;
        }

        const gl = this._gl;

        if (!gl) {
            return;
        }
        gl.deleteTexture(this._texCamera);
        gl.deleteTexture(this._texBackground);
        gl.deleteTexture(this._texMask);
        gl.deleteTexture(this._texMaskB);
        gl.deleteBuffer(this._quadBuffer);
        gl.deleteProgram(this._program);

        this._texCamera = null;
        this._texBackground = null;
        this._texMask = null;
        this._texMaskB = null;
        this._quadBuffer = null;
        this._program = null;
        this._gl = null;
    }

    /**
     * Initialises (or re-initialises) the WebGL context, shaders, and textures.
     *
     * @private
     * @returns {void}
     */
    _init(): void {
        const gl = (this._canvas.getContext('webgl2')
            ?? this._canvas.getContext('webgl')) as WebGLRenderingContext | null;

        if (!gl) {
            logger.warn('[VirtualBackground] WebGLCompositor: no WebGL context available — falling back to Canvas 2D');

            return;
        }
        this._gl = gl;

        try {
            this._program = createProgram(gl);
        } catch (err) {
            logger.error('[VirtualBackground] WebGLCompositor: shader build failed', err);
            this._gl = null;

            return;
        }

        // Vertex buffer — shared position + texCoord interleaved
        this._quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);

        this._aPosition = gl.getAttribLocation(this._program, 'a_position');
        this._aTexCoord = gl.getAttribLocation(this._program, 'a_texCoord');

        // Initial attribute setup — _bindQuadState() repeats this before every
        // draw call so TF.js cannot permanently corrupt our attribute state.
        this._bindQuadState(gl);

        // Resolve uniform locations
        gl.useProgram(this._program);
        this._uCamera = gl.getUniformLocation(this._program, 'u_camera');
        this._uBackground = gl.getUniformLocation(this._program, 'u_background');
        this._uMask = gl.getUniformLocation(this._program, 'u_mask');
        this._uMaskTexelSize = gl.getUniformLocation(this._program, 'u_maskTexelSize');
        this._uPrevMask = gl.getUniformLocation(this._program, 'u_prevMask');
        this._uTemporalRatio = gl.getUniformLocation(this._program, 'u_temporalRatio');
        this._uEdgeLow = gl.getUniformLocation(this._program, 'u_edgeLow');
        this._uEdgeHigh = gl.getUniformLocation(this._program, 'u_edgeHigh');

        // Allocate textures
        this._texCamera = createTexture(gl);
        this._texBackground = createTexture(gl);
        this._texMask = createTexture(gl);
        this._texMaskB = createTexture(gl);

        logger.info('[VirtualBackground] WebGLCompositor: initialised');
    }

    /**
     * Handles WebGL context loss.
     *
     * @private
     * @returns {void}
     */
    _onContextLost(): void {
        logger.warn('[VirtualBackground] WebGLCompositor: context lost');
        // The browser automatically destroys all GL objects on context loss.
        // Null the JS references so the GC can collect the wrapper objects.
        this._gl = null;
        this._program = null;
        this._quadBuffer = null;
        this._texCamera = null;
        this._texBackground = null;
        this._texMask = null;
        this._texMaskB = null;
    }

    /**
     * Handles WebGL context restoration.
     *
     * @private
     * @returns {void}
     */
    _onContextRestored(): void {
        logger.info('[VirtualBackground] WebGLCompositor: context restored — reinitialising');
        this._init();
    }

    /**
     * Re-binds the quad vertex buffer and re-specifies vertex attribute pointers.
     *
     * When the GL context is shared with TF.js, TF.js inference overwrites the
     * global vertex attribute state (bound ARRAY_BUFFER + vertexAttribPointer
     * descriptors). Calling this before every drawArrays() restores our state
     * without re-querying attribute locations.
     *
     * @private
     * @param {WebGLRenderingContext} gl - Active GL context.
     * @returns {void}
     */
    _bindQuadState(gl: WebGLRenderingContext): void {
        const stride = 4 * Float32Array.BYTES_PER_ELEMENT;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.enableVertexAttribArray(this._aPosition);
        gl.vertexAttribPointer(this._aPosition, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(this._aTexCoord);
        gl.vertexAttribPointer(this._aTexCoord, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    }
}
