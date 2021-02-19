package org.jitsi.meet;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.analytics.FirebaseAnalytics;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import timber.log.Timber;

public class FirebaseTree extends Timber.Tree {

    private Context context;

    FirebaseTree(Context context) {
        this.context = context;
    }

    @Override
    protected void log(int priority, @Nullable String tag, @NotNull String message, @Nullable Throwable t) {
        Bundle bundle = new Bundle();

        tag = tag != null ? tag : "";

        message = message != null ? message : "";
        bundle.putString(FirebaseAnalytics.Param.ITEM_CATEGORY, tag);
        bundle.putString(FirebaseAnalytics.Param.ITEM_NAME, message);
        bundle.putInt(FirebaseAnalytics.Param.CONTENT_TYPE, priority);
        FirebaseAnalytics.getInstance(context).logEvent("JitsiMeetLog", bundle);
    }
}
