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
import androidx.compose.foundation.layout.consumeWindowInsets
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
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.RadioStation
import com.example.data.model.StationCategory
import com.example.ui.components.AboutDialog
import com.example.ui.components.HeroPlayerContent
import com.example.ui.components.MiniPlayerBar
import com.example.ui.components.SleepTimerDialog
import com.example.ui.components.StationCard
import com.example.ui.theme.Dimens
import com.example.ui.theme.GoldPrimary
import com.example.ui.theme.isNarrowScreen
import com.example.ui.viewmodel.RadioViewModel

@Composable
fun RadioScreen(
    viewModel: RadioViewModel,
    modifier: Modifier = Modifier
) {
    val language by viewModel.language.collectAsStateWithLifecycle()
    // Arabic UI is laid out right-to-left, English left-to-right
    val layoutDirection = if (language == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr

    CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
        RadioScreenContent(viewModel = viewModel, modifier = modifier)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RadioScreenContent(
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
    val isAr = language == "ar"
    val isNarrow = isNarrowScreen()
    val topBarGutter = if (isNarrow) Dimens.ScreenGutterNarrow else Dimens.ScreenGutter

    // Read the favourite flag from the live station list; currentStation is a snapshot taken when playback started
    val isCurrentFavorite = currentStation?.let { current ->
        allStations.firstOrNull { it.id == current.id }?.isFavorite ?: current.isFavorite
    } ?: false

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
                                text = if (isAr) "إذاعة القرآن الكريم" else "Quran Radio",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = GoldPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            // Subtitle is dropped on narrow phones to leave room for the title
                            if (!isNarrow) {
                                Text(
                                    text = if (isAr) "صدقة جارية لـ ( عبدالرحيم معبد ) • Mabed" else "Sadaqah Jariyah for Abdulrahim Mabed • Mabed",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GoldPrimary.copy(alpha = 0.95f),
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
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
                        contentPadding = PaddingValues(horizontal = 10.dp),
                        // TopAppBar already insets its actions by 4dp; together they match the screen gutter
                        modifier = Modifier
                            .padding(end = topBarGutter - 4.dp)
                            .testTag("language_toggle_btn")
                    ) {
                        if (!isNarrow) {
                            Icon(
                                imageVector = Icons.Default.Language,
                                contentDescription = null,
                                tint = GoldPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                        }
                        // Short label of the language the button switches to
                        Text(
                            text = if (isAr) "EN" else "ع",
                            color = GoldPrimary,
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.semantics {
                                contentDescription = if (isAr) "Switch to English" else "التبديل إلى العربية"
                            }
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
                // Mark the Scaffold insets as handled so nested *BarsPadding modifiers don't pad twice
                .consumeWindowInsets(innerPadding)
        ) {
            val isDualPane = maxWidth >= 650.dp
            val gutter = Dimens.gutterFor(maxWidth)

            if (isDualPane) {
                Row(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier
                            .weight(1.2f)
                            .fillMaxHeight()
                    ) {
                        SearchAndCategoriesSection(
                            searchQuery = searchQuery,
                            onQueryChange = { viewModel.setSearchQuery(it) },
                            selectedCategory = selectedCategory,
                            onCategorySelect = { viewModel.selectCategory(it) },
                            filteredCount = filteredStations.size,
                            totalCount = allStations.size,
                            language = language,
                            gutter = DualPaneGutter
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        StationListSection(
                            isLoading = isLoading,
                            stations = filteredStations,
                            playerState = playerState,
                            language = language,
                            onPlayStation = { viewModel.playStation(it) },
                            onTogglePlayPause = { viewModel.togglePlayPause() },
                            onToggleFavorite = { viewModel.toggleFavorite(it) },
                            horizontalPadding = DualPaneGutter,
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
                            isFavorite = isCurrentFavorite,
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
                    Column(modifier = Modifier.fillMaxSize()) {
                        SearchAndCategoriesSection(
                            searchQuery = searchQuery,
                            onQueryChange = { viewModel.setSearchQuery(it) },
                            selectedCategory = selectedCategory,
                            onCategorySelect = { viewModel.selectCategory(it) },
                            filteredCount = filteredStations.size,
                            totalCount = allStations.size,
                            language = language,
                            gutter = gutter
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        StationListSection(
                            isLoading = isLoading,
                            stations = filteredStations,
                            playerState = playerState,
                            language = language,
                            onPlayStation = { viewModel.playStation(it) },
                            onTogglePlayPause = { viewModel.togglePlayPause() },
                            onToggleFavorite = { viewModel.toggleFavorite(it) },
                            horizontalPadding = gutter,
                            bottomPadding = if (currentStation != null) 110.dp else 24.dp,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    if (currentStation != null) {
                        MiniPlayerBar(
                            station = currentStation!!,
                            playerState = playerState,
                            language = language,
                            isFavorite = isCurrentFavorite,
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
                                    isFavorite = isCurrentFavorite,
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

/** Side gutter of the station pane in the tablet / landscape dual-pane layout. */
private val DualPaneGutter = 16.dp

@Composable
private fun SearchAndCategoriesSection(
    searchQuery: String,
    onQueryChange: (String) -> Unit,
    selectedCategory: StationCategory,
    onCategorySelect: (StationCategory) -> Unit,
    filteredCount: Int,
    totalCount: Int,
    language: String,
    gutter: Dp
) {
    val isAr = language == "ar"

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onQueryChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = gutter)
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
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = gutter),
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

        // Gutter as content padding so the chips scroll all the way to the screen edge
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = gutter),
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
    onTogglePlayPause: () -> Unit,
    onToggleFavorite: (RadioStation) -> Unit,
    horizontalPadding: Dp,
    modifier: Modifier = Modifier,
    bottomPadding: Dp = 16.dp
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
            contentPadding = PaddingValues(
                start = horizontalPadding,
                end = horizontalPadding,
                bottom = bottomPadding
            ),
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
                    onTogglePlayPause = onTogglePlayPause,
                    onFavoriteClick = { onToggleFavorite(station) }
                )
            }
        }
    }
}
