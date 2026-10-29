package org.jitsi.meet.sdk.background;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Loads and validates the bundled background presets and their images. */
final class BackgroundCatalog {
    private static final String TAG = "JitsiBackgroundCatalog";
    private static final long MAX_BACKGROUND_IMAGE_PIXELS = 5_000_000;
    private final Context context;
    private final Map<String, String> files = new HashMap<>();
    private final List<String[]> presets = new ArrayList<>();

    BackgroundCatalog(Context context) {
        this.context = context.getApplicationContext();
        try (InputStream stream = this.context.getAssets().open("virtual-backgrounds.json")) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int count;
            while ((count = stream.read(chunk)) != -1) {
                bytes.write(chunk, 0, count);
            }
            JSONArray entries = new JSONArray(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
            for (int i = 0; i < entries.length(); i++) {
                JSONObject entry = entries.getJSONObject(i);
                String id = entry.getString("id");
                String file = entry.getString("file");
                if (!validName(id) || !validName(file) || files.containsKey(id)
                        || id.equals("none") || id.equals("blur") || id.equals("blur-light")) {
                    continue;
                }
                files.put(id, file);
                presets.add(new String[] { id, entry.getString("title"), file });
            }
        } catch (Exception e) {
            files.clear();
            presets.clear();
            Log.e(TAG, "Bundled background catalog is unavailable", e);
        }
    }

    private boolean validName(String value) {
        return value.matches("[A-Za-z0-9][A-Za-z0-9._-]*") && !value.contains("..");
    }

    boolean contains(String id) {
        return files.containsKey(id);
    }

    WritableArray getPresets() {
        WritableArray result = Arguments.createArray();
        for (String[] entry : presets) {
            WritableMap preset = Arguments.createMap();
            preset.putString("id", entry[0]);
            preset.putString("title", entry[1]);
            preset.putString("uri", "asset:/" + entry[2]);
            result.pushMap(preset);
        }
        return result;
    }

    Bitmap load(String id) throws IOException {
        String file = files.get(id);
        if (file == null) {
            throw new IOException("Unknown background preset");
        }
        try (InputStream stream = context.getAssets().open(file)) {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            BitmapFactory.decodeStream(stream, null, options);
            if (options.outWidth < 1 || options.outHeight < 1
                    || (long) options.outWidth * options.outHeight > MAX_BACKGROUND_IMAGE_PIXELS) {
                throw new IOException("Invalid background image size");
            }
        }
        try (InputStream stream = context.getAssets().open(file)) {
            Bitmap bitmap = BitmapFactory.decodeStream(stream);
            if (bitmap == null) {
                throw new IOException("Background image could not be decoded");
            }
            return bitmap;
        }
    }
}
