package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Radio
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.RadioStation
import com.example.data.model.ReciterDirectory
import com.example.data.model.ReciterProfile
import com.example.data.model.StationCategory
import com.example.ui.components.AboutDialog
import com.example.ui.components.HeroPlayerContent
import com.example.ui.components.MiniPlayerBar
import com.example.ui.components.ReciterBioDialog
import com.example.ui.components.SleepTimerDialog
import com.example.ui.components.StationCard
import com.example.ui.theme.GoldPrimary
import com.example.ui.viewmodel.RadioViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RadioScreen(
    viewModel: RadioViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val selectedCategory by viewModel.selectedCategory.collectAsStateWithLifecycle()
    val filteredStations by viewModel.filteredStations.collectAsStateWithLifecycle()
    val allStations by viewModel.allStations.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val playerState by viewModel.playerState.collectAsStateWithLifecycle()
    val currentStation by viewModel.currentStation.collectAsStateWithLifecycle()
    val isHeroPlayerExpanded by viewModel.isHeroPlayerExpanded.collectAsStateWithLifecycle()
    val sleepTimerSeconds by viewModel.sleepTimerSeconds.collectAsStateWithLifecycle()
    val volume by viewModel.volume.collectAsStateWithLifecycle()

    var showSleepTimerDialog by remember { mutableStateOf(false) }
    var showAboutDialog by remember { mutableStateOf(false) }
    var selectedReciterProfile by remember { mutableStateOf<ReciterProfile?>(null) }
    val isAr = language == "ar"

    BackHandler(enabled = isHeroPlayerExpanded) {
        viewModel.setHeroPlayerExpanded(false)
    }

    if (showSleepTimerDialog) {
        SleepTimerDialog(
            currentMinutesRemaining = sleepTimerSeconds,
            language = language,
            onSelectMinutes = { mins -> viewModel.setSleepTimer(mins) },
            onDismiss = { showSleepTimerDialog = false }
        )
    }

    if (showAboutDialog) {
        AboutDialog(
            language = language,
            onDismiss = { showAboutDialog = false }
        )
    }

    selectedReciterProfile?.let { profile ->
        ReciterBioDialog(
            profile = profile,
            language = language,
            onDismiss = { selectedReciterProfile = null }
        )
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets.safeDrawing,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            modifier = Modifier.size(38.dp),
                            shape = CircleShape,
                            color = GoldPrimary.copy(alpha = 0.2f),
                            border = BorderStroke(1.dp, GoldPrimary.copy(alpha = 0.4f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Radio,
                                contentDescription = null,
                                tint = GoldPrimary,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = if (isAr) "إذاعة القرآن الكريم" else "MP3Quran Live Radio",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = GoldPrimary
                            )
                            Text(
                                text = if (isAr) "صدقة جارية لـ ( عبدالرحيم معبد ) • Mabed" else "Sadaqah Jariyah for Abdulrahim Mabed • Mabed",
                                style = MaterialTheme.typography.labelSmall,
                                color = GoldPrimary.copy(alpha = 0.95f),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = { showAboutDialog = true },
                        modifier = Modifier.testTag("about_app_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "About Developer",
                            tint = GoldPrimary
                        )
                    }

                    OutlinedButton(
                        onClick = {
                            viewModel.setLanguage(if (isAr) "eng" else "ar")
                        },
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, GoldPrimary),
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .testTag("language_toggle_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = "Language",
                            tint = GoldPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isAr) "English" else "العربية",
                            color = GoldPrimary,
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        }
    ) { innerPadding ->
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            val isDualPane = maxWidth >= 650.dp

            if (isDualPane) {
                Row(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier
                            .weight(1.2f)
                            .fillMaxHeight()
                            .padding(horizontal = 16.dp)
                    ) {
                        SearchAndCategoriesSection(
                            searchQuery = searchQuery,
                            onQueryChange = { viewModel.setSearchQuery(it) },
                            selectedCategory = selectedCategory,
                            onCategorySelect = { viewModel.selectCategory(it) },
                            filteredCount = filteredStations.size,
                            totalCount = allStations.size,
                            language = language
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        StationListSection(
                            isLoading = isLoading,
                            stations = filteredStations,
                            playerState = playerState,
                            language = language,
                            onPlayStation = { viewModel.playStation(it) },
                            onToggleFavorite = { viewModel.toggleFavorite(it) },
                            onInfoClick = { station ->
                                selectedReciterProfile = ReciterDirectory.findForStation(station.name)
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .fillMaxHeight()
                            .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                    )

                    Surface(
                        modifier = Modifier
                            .weight(1.0f)
                            .fillMaxHeight(),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        HeroPlayerContent(
                            station = currentStation,
                            playerState = playerState,
                            language = language,
                            volume = volume,
                            sleepTimerSeconds = sleepTimerSeconds,
                            onTogglePlayPause = { viewModel.togglePlayPause() },
                            onPreviousClick = { viewModel.playPreviousStation() },
                            onNextClick = { viewModel.playNextStation() },
                            onFavoriteToggle = { currentStation?.let { viewModel.toggleFavorite(it) } },
                            onVolumeChange = { viewModel.setVolume(it) },
                            onOpenSleepTimer = { showSleepTimerDialog = true }
                        )
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 14.dp)
                    ) {
                        SearchAndCategoriesSection(
                            searchQuery = searchQuery,
                            onQueryChange = { viewModel.setSearchQuery(it) },
                            selectedCategory = selectedCategory,
                            onCategorySelect = { viewModel.selectCategory(it) },
                            filteredCount = filteredStations.size,
                            totalCount = allStations.size,
                            language = language
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        StationListSection(
                            isLoading = isLoading,
                            stations = filteredStations,
                            playerState = playerState,
                            language = language,
                            onPlayStation = { viewModel.playStation(it) },
                            onToggleFavorite = { viewModel.toggleFavorite(it) },
                            onInfoClick = { station ->
                                selectedReciterProfile = ReciterDirectory.findForStation(station.name)
                            },
                            bottomPadding = if (currentStation != null) 110.dp else 24.dp,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    if (currentStation != null) {
                        MiniPlayerBar(
                            station = currentStation!!,
                            playerState = playerState,
                            language = language,
                            onBarClick = { viewModel.setHeroPlayerExpanded(true) },
                            onTogglePlayPause = { viewModel.togglePlayPause() },
                            onFavoriteToggle = { viewModel.toggleFavorite(currentStation!!) },
                            modifier = Modifier.align(Alignment.BottomCenter)
                        )
                    }

                    AnimatedVisibility(
                        visible = isHeroPlayerExpanded && currentStation != null,
                        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
                        exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Surface(
                            modifier = Modifier
                                .fillMaxSize()
                                .statusBarsPadding()
                                .windowInsetsPadding(WindowInsets.navigationBars),
                            color = MaterialTheme.colorScheme.background
                        ) {
                            Column(modifier = Modifier.fillMaxSize()) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    IconButton(
                                        onClick = { viewModel.setHeroPlayerExpanded(false) },
                                        modifier = Modifier.testTag("collapse_hero_player_btn")
                                    ) {
                                        Icon(
                                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                            contentDescription = "Collapse",
                                            tint = GoldPrimary
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = if (isAr) "مشغل البث المباشر" else "Live Audio Player",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = GoldPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                HeroPlayerContent(
                                    station = currentStation,
                                    playerState = playerState,
                                    language = language,
                                    volume = volume,
                                    sleepTimerSeconds = sleepTimerSeconds,
                                    onTogglePlayPause = { viewModel.togglePlayPause() },
                                    onPreviousClick = { viewModel.playPreviousStation() },
                                    onNextClick = { viewModel.playNextStation() },
                                    onFavoriteToggle = { currentStation?.let { viewModel.toggleFavorite(it) } },
                                    onVolumeChange = { viewModel.setVolume(it) },
                                    onOpenSleepTimer = { showSleepTimerDialog = true },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchAndCategoriesSection(
    searchQuery: String,
    onQueryChange: (String) -> Unit,
    selectedCategory: StationCategory,
    onCategorySelect: (StationCategory) -> Unit,
    filteredCount: Int,
    totalCount: Int,
    language: String
) {
    val isAr = language == "ar"

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onQueryChange,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("search_station_input"),
            placeholder = {
                Text(
                    text = if (isAr) "ابحث عن قارئ أو إذاعة..." else "Search reciter or station..."
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search",
                    tint = GoldPrimary
                )
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(
                        onClick = { onQueryChange("") },
                        modifier = Modifier.testTag("clear_search_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "Clear search"
                        )
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = GoldPrimary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline
            )
        )

        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = GoldPrimary.copy(alpha = 0.12f),
                border = BorderStroke(1.dp, GoldPrimary.copy(alpha = 0.25f))
            ) {
                Text(
                    text = if (isAr) "عرض $filteredCount من $totalCount إذاعة" else "Showing $filteredCount of $totalCount stations",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldPrimary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(StationCategory.entries) { category ->
                val isSelected = category == selectedCategory
                FilterChip(
                    selected = isSelected,
                    onClick = { onCategorySelect(category) },
                    label = {
                        Text(text = category.getTitle(language))
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = GoldPrimary,
                        selectedLabelColor = MaterialTheme.colorScheme.background,
                        containerColor = MaterialTheme.colorScheme.surfaceVariant,
                        labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.testTag("category_chip_${category.name}")
                )
            }
        }
    }
}

@Composable
private fun StationListSection(
    isLoading: Boolean,
    stations: List<RadioStation>,
    playerState: com.example.player.PlayerState,
    language: String,
    onPlayStation: (RadioStation) -> Unit,
    onToggleFavorite: (RadioStation) -> Unit,
    onInfoClick: (RadioStation) -> Unit,
    modifier: Modifier = Modifier,
    bottomPadding: androidx.compose.ui.unit.Dp = 16.dp
) {
    val isAr = language == "ar"

    if (isLoading && stations.isEmpty()) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = GoldPrimary)
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = if (isAr) "جاري تحميل محطات القرآن الكريم..." else "Loading Holy Quran stations...",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    } else if (stations.isEmpty()) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Radio,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(56.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = if (isAr) "لا توجد إذاعات مطابقة للبحث" else "No stations found matching your search",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center
                )
            }
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = bottomPadding),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            itemsIndexed(
                items = stations,
                key = { _, item -> item.id }
            ) { index, station ->
                StationCard(
                    station = station,
                    playerState = playerState,
                    language = language,
                    index = index,
                    onPlayClick = { onPlayStation(station) },
                    onFavoriteClick = { onToggleFavorite(station) },
                    onInfoClick = { onInfoClick(station) }
                )
            }
        }
    }
}
