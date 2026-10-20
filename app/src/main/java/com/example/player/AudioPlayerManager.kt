package com.example.player

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.PowerManager
import android.util.Log
import com.example.data.model.RadioStation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
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

    // Bumped every time a player is released; listeners of older players compare against it and bail out
    private var playerGeneration = 0

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
        AudioCacheManager.cancelRecording()
        _currentStation.value = station
        currentPlayingUrl = station.url
        _playerState.value = PlayerState.Buffering(station)

        // Network first: always play the live stream; the cached clip is only an offline fallback
        if (isOnline()) {
            startPlayer(station, station.url, isFallback = false)
            // Record a short offline clip once per station (no-op if one already exists)
            AudioCacheManager.startRecordingIfMissing(context, station.id, station.url)
        } else {
            playCachedFallback(station, "No internet connection")
        }
    }

    /**
     * Creates and prepares a MediaPlayer on the main thread. prepareAsync() keeps the network work
     * off the main thread, and every listener ignores callbacks from players released since.
     */
    private fun startPlayer(station: RadioStation, source: String, isFallback: Boolean) {
        val generation = playerGeneration
        try {
            val player = MediaPlayer()
            mediaPlayer = player
            player.apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setWakeMode(context.applicationContext, PowerManager.PARTIAL_WAKE_LOCK)
                setDataSource(source)
                val vol = _volume.value
                setVolume(vol, vol)

                setOnPreparedListener { mp ->
                    if (generation != playerGeneration) return@setOnPreparedListener
                    try {
                        mp.start()
                        _playerState.value = PlayerState.Playing(station)
                    } catch (e: Exception) {
                        _playerState.value = PlayerState.Error(station, e.localizedMessage ?: "Playback error")
                    }
                }

                setOnErrorListener { _, what, extra ->
                    if (generation != playerGeneration) return@setOnErrorListener true
                    Log.e(tag, "MediaPlayer error: what=$what, extra=$extra")
                    if (isFallback) {
                        _playerState.value = PlayerState.Error(station, "Playback error ($what)")
                    } else {
                        // Live stream failed: try the offline clip before giving up
                        releasePlayer()
                        AudioCacheManager.cancelRecording()
                        playCachedFallback(station, "Streaming connection error ($what)")
                    }
                    true
                }

                setOnCompletionListener {
                    if (generation != playerGeneration) return@setOnCompletionListener
                    _playerState.value = PlayerState.Idle
                }
            }
            player.prepareAsync()
        } catch (e: Exception) {
            Log.e(tag, "Failed to initialize player for $source", e)
            releasePlayer()
            val message = e.localizedMessage ?: "Failed to load audio stream"
            if (isFallback) {
                _playerState.value = PlayerState.Error(station, message)
            } else {
                playCachedFallback(station, message)
            }
        }
    }

    /** Plays the station's cached clip if there is one, otherwise reports [errorMessage]. */
    private fun playCachedFallback(station: RadioStation, errorMessage: String) {
        val cachedFile = AudioCacheManager.getCachedAudioFile(context, station.id)
        if (cachedFile != null) {
            _playerState.value = PlayerState.Buffering(station)
            startPlayer(station, cachedFile.absolutePath, isFallback = true)
        } else {
            _playerState.value = PlayerState.Error(station, errorMessage)
        }
    }

    private fun isOnline(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return true
        val capabilities = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
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
                val player = mediaPlayer
                val resumed = player != null && try {
                    player.start()
                    true
                } catch (e: IllegalStateException) {
                    Log.e(tag, "Failed to resume playback", e)
                    false
                }
                if (resumed) {
                    _playerState.value = PlayerState.Playing(station)
                } else {
                    // Player was released (e.g. by the sleep timer) or is unusable: reconnect
                    releasePlayer()
                    play(station)
                }
            }
            is PlayerState.Idle, is PlayerState.Error -> {
                play(station)
            }
            is PlayerState.Buffering -> {}
        }
    }

    fun stop() {
        releasePlayer()
        AudioCacheManager.cancelRecording()
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
        playerGeneration++
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
        AudioCacheManager.cancelRecording()
        scope.cancel()
        _playerState.value = PlayerState.Idle
    }
}
