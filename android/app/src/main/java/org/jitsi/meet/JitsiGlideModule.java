package org.jitsi.meet;

import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.module.AppGlideModule;

/**
 * An AppGlideModule needs to be present for image loading events to work in
 * react-native-fast-image. However, if this is defined by the SDK it will cause trouble with
 * apps which are using Glide themselves.
 *
 * In order to avoid the problem, define a Jitsi Glide module here, so applications already using
 * it are not in trouble.
 */
@GlideModule
public final class JitsiGlideModule extends AppGlideModule {
}
