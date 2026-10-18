package com.example.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.TimerOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.ui.theme.GoldPrimary

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SleepTimerDialog(
    currentMinutesRemaining: Long?,
    language: String,
    onSelectMinutes: (Int?) -> Unit,
    onDismiss: () -> Unit
) {
    val isAr = language == "ar"
    val durations = listOf(15, 30, 45, 60, 90, 120)

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                imageVector = Icons.Default.Bedtime,
                contentDescription = null,
                tint = GoldPrimary
            )
        },
        title = {
            Text(
                text = if (isAr) "مؤقت النوم" else "Sleep Timer",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = if (isAr) {
                        "اختر المدة لإيقاف البث تلقائياً أثناء الاستماع:"
                    } else {
                        "Select a duration to automatically stop playback:"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    durations.forEach { minutes ->
                        FilterChip(
                            selected = false,
                            onClick = {
                                onSelectMinutes(minutes)
                                onDismiss()
                            },
                            label = {
                                Text(
                                    text = if (isAr) "$minutes دقيقة" else "$minutes min"
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.testTag("sleep_timer_${minutes}m")
                        )
                    }
                }

                if (currentMinutesRemaining != null && currentMinutesRemaining > 0) {
                    Spacer(modifier = Modifier.height(16.dp))
                    val mins = currentMinutesRemaining / 60
                    val secs = currentMinutesRemaining % 60
                    Text(
                        text = if (isAr) {
                            "المتبقي الآن: %02d:%02d".format(mins, secs)
                        } else {
                            "Currently remaining: %02d:%02d".format(mins, secs)
                        },
                        style = MaterialTheme.typography.labelLarge,
                        color = GoldPrimary
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = {
                            onSelectMinutes(null)
                            onDismiss()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("cancel_sleep_timer_btn"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.TimerOff, contentDescription = null)
                        Spacer(modifier = Modifier.padding(start = 8.dp))
                        Text(if (isAr) "إلغاء المؤقت" else "Turn Off Timer")
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("close_sleep_timer_dialog")
            ) {
                Text(if (isAr) "إغلاق" else "Close")
            }
        },
        shape = RoundedCornerShape(24.dp),
        containerColor = MaterialTheme.colorScheme.surface
    )
}
