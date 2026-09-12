package com.atlassfin.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Debe registrarse ANTES de super.onCreate().
        registerPlugin(NativeBarsPlugin.class);
        super.onCreate(savedInstanceState);

        // Estado inicial (claro); el tema se ajusta desde la web.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.WHITE));
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(true);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightNavigationBars(true);
    }
}
