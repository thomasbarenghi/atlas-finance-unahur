package com.atlassfin.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.Window;
import androidx.core.view.WindowCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeBars")
public class NativeBarsPlugin extends Plugin {

    @PluginMethod
    public void setTheme(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark"));
        getActivity().runOnUiThread(() -> applyBars(dark));
        call.resolve();
    }

    private void applyBars(boolean dark) {
        Window window = getActivity().getWindow();
        int bg = dark ? Color.BLACK : Color.WHITE;

        // Las barras ocupan lugar (el contenido no pasa por debajo).
        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.setBackgroundDrawable(new ColorDrawable(bg));
        window.setStatusBarColor(bg);
        window.setNavigationBarColor(Color.TRANSPARENT);

        WindowCompat.getInsetsController(window, window.getDecorView())
            .setAppearanceLightStatusBars(!dark);
        WindowCompat.getInsetsController(window, window.getDecorView())
            .setAppearanceLightNavigationBars(!dark);
    }
}
