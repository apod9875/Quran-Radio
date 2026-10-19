package com.example.player

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.PowerManager
import android.util.Log
import com.example.data.model.RadioStation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

sealed interface PlayerState {
    data object Idle : PlayerState
    data class Buffering(val station: RadioStation) : PlayerState
    data class Playing(val station: RadioStation) : PlayerState
    data class Paused(val station: RadioStation) : PlayerState
    data class Error(val station: RadioStation, val message: String) : PlayerState
}

class AudioPlayerManager(private val context: Context) {
    private val tag = "AudioPlayerManager"
    private var mediaPlayer: MediaPlayer? = null
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    private val _playerState = MutableStateFlow<PlayerState>(PlayerState.Idle)
    val playerState: StateFlow<PlayerState> = _playerState.asStateFlow()

    private val _currentStation = MutableStateFlow<RadioStation?>(null)
    val currentStation: StateFlow<RadioStation?> = _currentStation.asStateFlow()

    private val _sleepTimerSeconds = MutableStateFlow<Long?>(null)
    val sleepTimerSeconds: StateFlow<Long?> = _sleepTimerSeconds.asStateFlow()

    private val _volume = MutableStateFlow(1.0f)
    val volume: StateFlow<Float> = _volume.asStateFlow()

    private var sleepTimerJob: Job? = null
    private var currentPlayingUrl: String? = null

    fun play(station: RadioStation) {
        val currentState = _playerState.value
        if (currentPlayingUrl == station.url && (currentState is PlayerState.Playing || currentState is PlayerState.Buffering)) {
            return
        }

        if (currentPlayingUrl == station.url && currentState is PlayerState.Paused) {
            mediaPlayer?.let {
                try {
                    it.start()
                    _playerState.value = PlayerState.Playing(station)
                    return
                } catch (e: Exception) {
                    Log.e(tag, "Failed to resume playback", e)
                }
            }
        }

        releasePlayer()
        _currentStation.value = station
        currentPlayingUrl = station.url
        _playerState.value = PlayerState.Buffering(station)

        scope.launch(Dispatchers.IO) {
            try {
                val player = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
                    )
                    setWakeMode(context.applicationContext, PowerManager.PARTIAL_WAKE_LOCK)
                    setDataSource(station.url)
                    val vol = _volume.value
                    setVolume(vol, vol)

                    setOnPreparedListener { mp ->
                        scope.launch(Dispatchers.Main) {
                            try {
                                mp.start()
                                _playerState.value = PlayerState.Playing(station)
                            } catch (e: Exception) {
                                _playerState.value = PlayerState.Error(station, e.localizedMessage ?: "Playback error")
                            }
                        }
                    }

                    setOnErrorListener { _, what, extra ->
                        Log.e(tag, "MediaPlayer error: what=$what, extra=$extra")
                        scope.launch(Dispatchers.Main) {
                            _playerState.value = PlayerState.Error(station, "Streaming connection error ($what)")
                        }
                        true
                    }

                    setOnCompletionListener {
                        scope.launch(Dispatchers.Main) {
                            _playerState.value = PlayerState.Idle
                        }
                    }
                }

                mediaPlayer = player
                player.prepareAsync()
            } catch (e: Exception) {
                Log.e(tag, "Failed to initialize player for ${station.url}", e)
                scope.launch(Dispatchers.Main) {
                    _playerState.value = PlayerState.Error(station, e.localizedMessage ?: "Failed to load audio stream")
                }
            }
        }
    }

    fun togglePlayPause() {
        val state = _playerState.value
        val station = _currentStation.value ?: return

        when (state) {
            is PlayerState.Playing -> {
                mediaPlayer?.pause()
                _playerState.value = PlayerState.Paused(station)
            }
            is PlayerState.Paused -> {
                mediaPlayer?.start()
                _playerState.value = PlayerState.Playing(station)
            }
            is PlayerState.Idle, is PlayerState.Error -> {
                play(station)
            }
            is PlayerState.Buffering -> {}
        }
    }

    fun stop() {
        releasePlayer()
        _currentStation.value?.let { station ->
            _playerState.value = PlayerState.Paused(station)
        } ?: run {
            _playerState.value = PlayerState.Idle
        }
    }

    fun setVolume(vol: Float) {
        val clamped = vol.coerceIn(0f, 1f)
        _volume.value = clamped
        mediaPlayer?.setVolume(clamped, clamped)
    }

    fun setSleepTimer(minutes: Int?) {
        sleepTimerJob?.cancel()
        sleepTimerJob = null

        if (minutes == null || minutes <= 0) {
            _sleepTimerSeconds.value = null
            return
        }

        val totalSeconds = minutes * 60L
        _sleepTimerSeconds.value = totalSeconds

        sleepTimerJob = scope.launch {
            var remaining = totalSeconds
            while (isActive && remaining > 0) {
                delay(1000)
                remaining--
                _sleepTimerSeconds.value = remaining
            }

            if (remaining <= 0) {
                stop()
                _sleepTimerSeconds.value = null
            }
        }
    }

    private fun releasePlayer() {
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                reset()
                release()
            }
        } catch (e: Exception) {
            Log.e(tag, "Error releasing media player", e)
        } finally {
            mediaPlayer = null
        }
    }

    fun release() {
        sleepTimerJob?.cancel()
        releasePlayer()
        _playerState.value = PlayerState.Idle
    }
}
