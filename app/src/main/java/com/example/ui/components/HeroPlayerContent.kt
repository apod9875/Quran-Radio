package com.example.ui.components

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Radio
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.VolumeDown
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.data.model.RadioStation
import com.example.player.PlayerState
import com.example.ui.theme.GoldPrimary
import com.example.ui.theme.MintAccent

@Composable
fun HeroPlayerContent(
    station: RadioStation?,
    playerState: PlayerState,
    language: String,
    volume: Float,
    sleepTimerSeconds: Long?,
    onTogglePlayPause: () -> Unit,
    onPreviousClick: () -> Unit,
    onNextClick: () -> Unit,
    onFavoriteToggle: () -> Unit,
    onVolumeChange: (Float) -> Unit,
    onOpenSleepTimer: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isAr = language == "ar"

    val isPlaying = playerState is PlayerState.Playing
    val isBuffering = playerState is PlayerState.Buffering

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (station == null) {
            Icon(
                imageVector = Icons.Default.Radio,
                contentDescription = null,
                tint = GoldPrimary.copy(alpha = 0.5f),
                modifier = Modifier.size(72.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (isAr) "اختر إذاعة لبدء الاستماع" else "Select a radio station to begin streaming",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            return
        }

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = if (isPlaying) Color(0xFFEF5350).copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (isPlaying) Color(0xFFEF5350) else GoldPrimary)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isBuffering) {
                        if (isAr) "جاري التحميل..." else "Buffering..."
                    } else if (isPlaying) {
                        if (isAr) "بث مباشر الآن" else "LIVE 24/7"
                    } else {
                        if (isAr) "متوقف مؤقتاً" else "PAUSED"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (isPlaying) Color(0xFFEF5350) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Text(
            text = station.name,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = GoldPrimary,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("hero_player_station_title")
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = station.category.getTitle(language),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(20.dp))

        WaveformVisualizer(
            isPlaying = isPlaying,
            isBuffering = isBuffering,
            barCount = 11,
            width = 160.dp,
            height = 48.dp,
            activeColor = GoldPrimary,
            accentColor = MintAccent
        )

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedIconButton(
                onClick = onPreviousClick,
                modifier = Modifier
                    .size(52.dp)
                    .testTag("hero_prev_btn")
            ) {
                Icon(
                    imageVector = Icons.Default.SkipPrevious,
                    contentDescription = "Previous Station",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }

            Spacer(modifier = Modifier.width(20.dp))

            FilledIconButton(
                onClick = onTogglePlayPause,
                modifier = Modifier
                    .size(72.dp)
                    .testTag("hero_play_pause_btn"),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = GoldPrimary,
                    contentColor = Color(0xFF1D1400)
                )
            ) {
                if (isBuffering) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(32.dp),
                        color = Color(0xFF1D1400),
                        strokeWidth = 3.dp
                    )
                } else if (isPlaying) {
                    Icon(
                        imageVector = Icons.Default.Pause,
                        contentDescription = "Pause",
                        modifier = Modifier.size(36.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Play",
                        modifier = Modifier.size(36.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(20.dp))

            OutlinedIconButton(
                onClick = onNextClick,
                modifier = Modifier
                    .size(52.dp)
                    .testTag("hero_next_btn")
            ) {
                Icon(
                    imageVector = Icons.Default.SkipNext,
                    contentDescription = "Next Station",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.VolumeDown,
                contentDescription = "Volume down",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Slider(
                value = volume,
                onValueChange = onVolumeChange,
                valueRange = 0f..1f,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 8.dp)
                    .testTag("volume_slider"),
                colors = SliderDefaults.colors(
                    thumbColor = GoldPrimary,
                    activeTrackColor = GoldPrimary,
                    inactiveTrackColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
            Icon(
                imageVector = Icons.Default.VolumeUp,
                contentDescription = "Volume up",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        AnimatedVisibility(visible = sleepTimerSeconds != null && sleepTimerSeconds > 0) {
            val mins = (sleepTimerSeconds ?: 0) / 60
            val secs = (sleepTimerSeconds ?: 0) % 60
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = GoldPrimary.copy(alpha = 0.15f),
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Bedtime,
                        contentDescription = null,
                        tint = GoldPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isAr) "مؤقت النوم: %02d:%02d".format(mins, secs) else "Sleep in: %02d:%02d".format(mins, secs),
                        style = MaterialTheme.typography.labelSmall,
                        color = GoldPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onOpenSleepTimer,
                modifier = Modifier.testTag("open_sleep_timer_btn")
            ) {
                Icon(
                    imageVector = Icons.Default.Bedtime,
                    contentDescription = "Sleep Timer",
                    tint = if (sleepTimerSeconds != null) GoldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            IconButton(
                onClick = onFavoriteToggle,
                modifier = Modifier.testTag("hero_fav_btn")
            ) {
                Icon(
                    imageVector = if (station.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = if (station.isFavorite) "Remove favorite" else "Add favorite",
                    tint = if (station.isFavorite) Color(0xFFEF5350) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            IconButton(
                onClick = {
                    val sendIntent = Intent().apply {
                        action = Intent.ACTION_SEND
                        putExtra(
                            Intent.EXTRA_TEXT,
                            "${station.name}\n${station.url}\n\nShared via MP3Quran Radio"
                        )
                        type = "text/plain"
                    }
                    context.startActivity(Intent.createChooser(sendIntent, "Share Radio Station"))
                },
                modifier = Modifier.testTag("share_station_btn")
            ) {
                Icon(
                    imageVector = Icons.Default.Share,
                    contentDescription = "Share",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier.testTag("hero_developer_attribution")
        ) {
            Text(
                text = if (isAr) "صدقة جارية لـ ( عبدالرحيم معبد ) • Mabed" else "Sadaqah Jariyah for Abdulrahim Mabed • Mabed",
                style = MaterialTheme.typography.labelSmall,
                color = GoldPrimary,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
            )
        }
    }
}
