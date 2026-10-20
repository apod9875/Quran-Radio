package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
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
import com.example.ui.theme.isNarrowScreen

@Composable
fun StationCard(
    station: RadioStation,
    playerState: PlayerState,
    language: String,
    index: Int,
    onPlayClick: () -> Unit,
    onTogglePlayPause: () -> Unit,
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

    // Compact sizes for narrow phones (< 360dp)
    val isNarrow = isNarrowScreen()
    val avatarSize = if (isNarrow) 36.dp else 44.dp
    val actionButtonSize = if (isNarrow) 34.dp else 38.dp
    val playButtonSize = if (isNarrow) 34.dp else 40.dp

    val borderColor by animateColorAsState(
        targetValue = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
        label = "card_border_anim"
    )

    Card(
        onClick = onPlayClick,
        modifier = modifier
            .fillMaxWidth()
            .testTag("station_card_${station.id}"),
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
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Golden Ordinal Index Badge
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (isCurrentStation) GoldPrimary else GoldPrimary.copy(alpha = 0.15f),
                border = BorderStroke(1.dp, GoldPrimary.copy(alpha = 0.4f)),
                modifier = Modifier.padding(end = 10.dp)
            ) {
                Text(
                    text = "#%02d".format(index + 1),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (isCurrentStation) Color(0xFF1D1400) else GoldPrimary,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)
                )
            }

            // Reciter Avatar Thumbnail
            Surface(
                modifier = Modifier.size(avatarSize),
                shape = CircleShape,
                color = if (isCurrentStation) {
                    GoldPrimary.copy(alpha = 0.2f)
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                },
                border = BorderStroke(1.dp, if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Reciter",
                    tint = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(if (isNarrow) 8.dp else 10.dp)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = station.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (isCurrentStation) FontWeight.Bold else FontWeight.Medium,
                    color = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(3.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.6f),
                        // Let the label shrink so the waveform is never squeezed out
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Text(
                            text = station.category.getTitle(language),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    if (isPlaying) {
                        WaveformVisualizer(
                            isPlaying = true,
                            isBuffering = false,
                            width = 34.dp,
                            height = 14.dp,
                            activeColor = GoldPrimary,
                            accentColor = MintAccent
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Favorite Button
            IconButton(
                onClick = onFavoriteClick,
                modifier = Modifier
                    .size(actionButtonSize)
                    .testTag("fav_btn_${station.id}")
            ) {
                Icon(
                    imageVector = if (station.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = if (station.isFavorite) "Remove from favorites" else "Add to favorites",
                    tint = if (station.isFavorite) Color(0xFFEF5350) else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(22.dp)
                )
            }

            // Play / Pause Button: pauses the live station, otherwise starts this one
            FilledIconButton(
                onClick = if (isPlaying || isBuffering) onTogglePlayPause else onPlayClick,
                modifier = Modifier
                    .size(playButtonSize)
                    .testTag("play_btn_${station.id}"),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = if (isCurrentStation) GoldPrimary else MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (isCurrentStation) Color(0xFF1D1400) else MaterialTheme.colorScheme.onSurface
                )
            ) {
                if (isBuffering) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp,
                        color = if (isCurrentStation) Color(0xFF1D1400) else GoldPrimary
                    )
                } else if (isPlaying) {
                    Icon(
                        imageVector = Icons.Outlined.Pause,
                        contentDescription = "Pause",
                        modifier = Modifier.size(20.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Play",
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
