package org.jitsi.meet.sdk;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.startup.Initializer;

import com.facebook.soloader.SoLoader;

import java.util.ArrayList;
import java.util.List;

public class JitsiInitializer implements Initializer<Void> {

    @NonNull
    @Override
    public Void create(@NonNull Context context) {
        SoLoader.init(context, /* native exopackage */ false);
        return null;
    }

    @NonNull
    @Override
    public List<Class<? extends Initializer<?>>> dependencies() {
        return new ArrayList<>();
    }
}