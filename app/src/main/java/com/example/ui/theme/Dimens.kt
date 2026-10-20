package com.example.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Shared layout dimensions so every screen edge lines up on narrow phones (320–411dp).
 */
object Dimens {
    val ScreenGutter = 12.dp
    val ScreenGutterNarrow = 10.dp

    /** Screens narrower than this get the compact layout (narrow gutter, smaller controls). */
    val NarrowScreenWidth = 360.dp

    fun gutterFor(availableWidth: Dp): Dp =
        if (availableWidth < NarrowScreenWidth) ScreenGutterNarrow else ScreenGutter
}

/** True when the current screen is narrower than [Dimens.NarrowScreenWidth]. */
@Composable
@ReadOnlyComposable
fun isNarrowScreen(): Boolean = LocalConfiguration.current.screenWidthDp.dp < Dimens.NarrowScreenWidth

/** Horizontal gutter for the current screen width. */
@Composable
@ReadOnlyComposable
fun screenGutter(): Dp = Dimens.gutterFor(LocalConfiguration.current.screenWidthDp.dp)
