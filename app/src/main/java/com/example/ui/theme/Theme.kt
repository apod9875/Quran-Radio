package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = GoldPrimary,
    onPrimary = Color(0xFF1D1400),
    primaryContainer = Color(0xFF473600),
    onPrimaryContainer = GoldSecondary,
    secondary = MintAccent,
    onSecondary = Color(0xFF003822),
    secondaryContainer = EmeraldDarkSurfaceVariant,
    onSecondaryContainer = MintAccentLight,
    background = EmeraldDarkBg,
    onBackground = TextLight,
    surface = EmeraldDarkSurface,
    onSurface = TextLight,
    surfaceVariant = EmeraldDarkSurfaceVariant,
    onSurfaceVariant = TextMuted,
    outline = EmeraldDarkCardBorder,
    outlineVariant = Color(0xFF285447)
)

private val LightColorScheme = lightColorScheme(
    primary = EmeraldLightPrimary,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFA5F0D0),
    onPrimaryContainer = Color(0xFF002115),
    secondary = EmeraldLightSecondary,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFFDF9E),
    onSecondaryContainer = Color(0xFF281900),
    background = EmeraldLightBg,
    onBackground = TextDark,
    surface = EmeraldLightSurface,
    onSurface = TextDark,
    surfaceVariant = EmeraldLightSurfaceVariant,
    onSurfaceVariant = Color(0xFF3F4944),
    outline = Color(0xFFBCC7C1)
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
