package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.local.RadioDatabase
import com.example.data.model.RadioStation
import com.example.data.model.StationCategory
import com.example.data.remote.NetworkClient
import com.example.data.repository.RadioRepository
import com.example.player.AudioPlayerManager
import com.example.player.PlayerState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class RadioViewModel(
    application: Application,
    private val repository: RadioRepository,
    val playerManager: AudioPlayerManager
) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // Restore the last chosen language (Arabic by default)
    private val _language = MutableStateFlow(prefs.getString(KEY_LANGUAGE, null) ?: "ar")
    val language: StateFlow<String> = _language.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow(StationCategory.ALL)
    val selectedCategory: StateFlow<StationCategory> = _selectedCategory.asStateFlow()

    private val _allStations = MutableStateFlow<List<RadioStation>>(emptyList())
    val allStations: StateFlow<List<RadioStation>> = _allStations.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isHeroPlayerExpanded = MutableStateFlow(false)
    val isHeroPlayerExpanded: StateFlow<Boolean> = _isHeroPlayerExpanded.asStateFlow()

    val playerState: StateFlow<PlayerState> = playerManager.playerState
    val currentStation: StateFlow<RadioStation?> = playerManager.currentStation
    val sleepTimerSeconds: StateFlow<Long?> = playerManager.sleepTimerSeconds
    val volume: StateFlow<Float> = playerManager.volume

    val filteredStations: StateFlow<List<RadioStation>> = combine(
        _allStations,
        _searchQuery,
        _selectedCategory
    ) { stations, query, category ->
        stations.filter { station ->
            val matchesCategory = when (category) {
                StationCategory.ALL -> true
                StationCategory.FAVORITES -> station.isFavorite
                else -> station.category == category
            }
            val matchesQuery = query.isBlank() ||
                station.name.contains(query.trim(), ignoreCase = true)

            matchesCategory && matchesQuery
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        observeStations()
    }

    fun setLanguage(lang: String) {
        if (_language.value != lang) {
            _language.value = lang
            prefs.edit().putString(KEY_LANGUAGE, lang).apply()
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun selectCategory(category: StationCategory) {
        _selectedCategory.value = category
    }

    fun setHeroPlayerExpanded(expanded: Boolean) {
        _isHeroPlayerExpanded.value = expanded
    }

    fun playStation(station: RadioStation) {
        playerManager.play(station)
    }

    fun togglePlayPause() {
        playerManager.togglePlayPause()
    }

    fun playNextStation() {
        val current = currentStation.value ?: return
        val list = filteredStations.value.ifEmpty { allStations.value }
        if (list.isEmpty()) return

        val currentIndex = list.indexOfFirst { it.id == current.id }
        val nextIndex = if (currentIndex != -1 && currentIndex < list.size - 1) {
            currentIndex + 1
        } else {
            0
        }
        playStation(list[nextIndex])
    }

    fun playPreviousStation() {
        val current = currentStation.value ?: return
        val list = filteredStations.value.ifEmpty { allStations.value }
        if (list.isEmpty()) return

        val currentIndex = list.indexOfFirst { it.id == current.id }
        val prevIndex = if (currentIndex > 0) {
            currentIndex - 1
        } else {
            list.size - 1
        }
        playStation(list[prevIndex])
    }

    fun toggleFavorite(station: RadioStation) {
        viewModelScope.launch {
            repository.toggleFavorite(station)
        }
    }

    fun setVolume(vol: Float) {
        playerManager.setVolume(vol)
    }

    fun setSleepTimer(minutes: Int?) {
        playerManager.setSleepTimer(minutes)
    }

    // flatMapLatest drops the previous language's collection, so a slow response can't overwrite a newer one
    @OptIn(ExperimentalCoroutinesApi::class)
    private fun observeStations() {
        viewModelScope.launch {
            _language
                .onEach { _isLoading.value = true }
                .flatMapLatest { lang -> repository.getStations(lang) }
                .collect { stations ->
                    _allStations.value = stations
                    _isLoading.value = false
                }
        }
    }

    override fun onCleared() {
        super.onCleared()
        playerManager.release()
    }

    companion object {
        private const val PREFS_NAME = "radio_prefs"
        private const val KEY_LANGUAGE = "language"

        fun provideFactory(application: Application): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    val db = RadioDatabase.getInstance(application)
                    val repo = RadioRepository(NetworkClient.api, db.favoriteDao())
                    val player = AudioPlayerManager(application)
                    return RadioViewModel(application, repo, player) as T
                }
            }
        }
    }
}
