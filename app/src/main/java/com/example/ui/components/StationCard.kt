package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Radio
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.RadioStation
import com.example.player.PlayerState
import com.example.ui.theme.GoldPrimary
import com.example.ui.theme.MintAccent

@Composable
fun StationCard(
    station: RadioStation,
    playerState: PlayerState,
    language: String,
    onPlayClick: () -> Unit,
    onFavoriteClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isCurrentStation = when (playerState) {
        is PlayerState.Playing -> playerState.station.id == station.id
        is PlayerState.Buffering -> playerState.station.id == station.id
        is PlayerState.Paused -> playerState.station.id == station.id
        is PlayerState.Error -> playerState.station.id == station.id
        PlayerState.Idle -> false
    }

    val isPlaying = playerState is PlayerState.Playing && playerState.station.id == station.id
    val isBuffering = playerState is PlayerState.Buffering && playerState.station.id == station.id

    val borderColor by animateColorAsState(
        targetValue = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
        label = "card_border_anim"
    )

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("station_card_${station.id}")
            .clickable(onClick = onPlayClick),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(if (isCurrentStation) 2.dp else 1.dp, borderColor),
        colors = CardDefaults.cardColors(
            containerColor = if (isCurrentStation) {
                MaterialTheme.colorScheme.surfaceVariant
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isCurrentStation) 4.dp else 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = CircleShape,
                color = if (isCurrentStation) {
                    GoldPrimary.copy(alpha = 0.2f)
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                }
            ) {
                Icon(
                    imageVector = Icons.Default.Radio,
                    contentDescription = null,
                    tint = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(12.dp)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = station.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (isCurrentStation) FontWeight.Bold else FontWeight.Medium,
                    color = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.6f)
                    ) {
                        Text(
                            text = station.category.getTitle(language),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    if (isPlaying) {
                        WaveformVisualizer(
                            isPlaying = true,
                            isBuffering = false,
                            width = 36.dp,
                            height = 16.dp,
                            activeColor = GoldPrimary,
                            accentColor = MintAccent
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            IconButton(
                onClick = onFavoriteClick,
                modifier = Modifier
                    .size(44.dp)
                    .testTag("fav_btn_${station.id}")
            ) {
                Icon(
                    imageVector = if (station.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = if (station.isFavorite) "Remove from favorites" else "Add to favorites",
                    tint = if (station.isFavorite) Color(0xFFEF5350) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            FilledIconButton(
                onClick = onPlayClick,
                modifier = Modifier
                    .size(44.dp)
                    .testTag("play_btn_${station.id}"),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (isCurrentStation) Color(0xFF1D1400) else MaterialTheme.colorScheme.onSurface
                )
            ) {
                if (isBuffering) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.5.dp,
                        color = if (isCurrentStation) Color(0xFF1D1400) else GoldPrimary
                    )
                } else if (isPlaying) {
                    Icon(
                        imageVector = Icons.Outlined.Pause,
                        contentDescription = "Pause"
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Play"
                    )
                }
            }
        }
    }
}
