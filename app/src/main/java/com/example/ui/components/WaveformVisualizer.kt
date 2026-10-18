package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.ui.theme.GoldPrimary
import com.example.ui.theme.MintAccent

@Composable
fun WaveformVisualizer(
    isPlaying: Boolean,
    isBuffering: Boolean,
    modifier: Modifier = Modifier,
    barCount: Int = 7,
    width: Dp = 64.dp,
    height: Dp = 32.dp,
    activeColor: Color = GoldPrimary,
    accentColor: Color = MintAccent
) {
    val transition = rememberInfiniteTransition(label = "waveform_anim")

    val phase1 by transition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 650, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "phase1"
    )

    val phase2 by transition.animateFloat(
        initialValue = 0.85f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 850, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "phase2"
    )

    val phase3 by transition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "phase3"
    )

    Canvas(
        modifier = modifier
            .width(width)
            .height(height)
    ) {
        val totalWidth = size.width
        val canvasHeight = size.height
        val barWidth = totalWidth / (barCount * 1.6f)
        val gap = (totalWidth - (barWidth * barCount)) / (barCount - 1).coerceAtLeast(1)

        val factors = floatArrayOf(
            phase1 * 0.7f + 0.3f,
            phase2 * 0.9f + 0.1f,
            phase3,
            phase1 * 0.8f + 0.2f,
            phase2,
            phase3 * 0.6f + 0.4f,
            phase1
        )

        for (i in 0 until barCount) {
            val factor = when {
                isPlaying -> factors[i % factors.size].coerceIn(0.15f, 1.0f)
                isBuffering -> 0.3f + 0.2f * kotlin.math.sin((i + phase1 * 5).toDouble()).toFloat()
                else -> 0.15f
            }

            val barHeight = (canvasHeight * factor).coerceAtLeast(4.dp.toPx())
            val x = i * (barWidth + gap)
            val y = (canvasHeight - barHeight) / 2f

            drawRoundRect(
                brush = Brush.verticalGradient(
                    colors = listOf(activeColor, accentColor)
                ),
                topLeft = Offset(x, y),
                size = Size(barWidth, barHeight),
                cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
            )
        }
    }
}
