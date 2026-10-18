package com.example.data.repository

import android.util.Log
import com.example.data.local.FavoriteDao
import com.example.data.local.FavoriteEntity
import com.example.data.model.RadioDto
import com.example.data.model.RadioStation
import com.example.data.model.StationCategory
import com.example.data.remote.FallbackStations
import com.example.data.remote.Mp3QuranApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

class RadioRepository(
    private val api: Mp3QuranApi,
    private val favoriteDao: FavoriteDao
) {
    private val tag = "RadioRepository"

    fun getStations(language: String): Flow<List<RadioStation>> {
        return flow {
            val remoteDtos = try {
                val response = api.getRadios(language)
                val list = response.radios
                if (!list.isNullOrEmpty()) {
                    list
                } else {
                    getFallbackDtos(language)
                }
            } catch (e: Exception) {
                Log.w(tag, "Failed to load radios from API for lang=$language, using fallback", e)
                getFallbackDtos(language)
            }
            emit(remoteDtos)
        }.combine(favoriteDao.getAllFavorites()) { dtos, favorites ->
            val favIds = favorites.map { it.id }.toSet()
            val favUrls = favorites.map { it.url }.toSet()

            dtos.map { dto ->
                val isFav = favIds.contains(dto.id) || favUrls.contains(dto.url)
                val category = categorizeStation(dto.name)
                RadioStation(
                    id = dto.id,
                    name = dto.name.trim(),
                    url = dto.url.trim(),
                    category = category,
                    isFavorite = isFav
                )
            }
        }.flowOn(Dispatchers.IO)
    }

    suspend fun toggleFavorite(station: RadioStation) {
        withContext(Dispatchers.IO) {
            val isFav = favoriteDao.isFavorite(station.id)
            if (isFav) {
                favoriteDao.deleteFavorite(station.id)
            } else {
                favoriteDao.insertFavorite(
                    FavoriteEntity(
                        id = station.id,
                        name = station.name,
                        url = station.url
                    )
                )
            }
        }
    }

    private fun getFallbackDtos(language: String): List<RadioDto> {
        return if (language == "ar") {
            FallbackStations.ARABIC_STATIONS
        } else {
            FallbackStations.ENGLISH_STATIONS
        }
    }

    private fun categorizeStation(name: String): StationCategory {
        val lower = name.lowercase()
        return when {
            lower.contains("translation") || lower.contains("ترجمة") ||
                lower.contains("french") || lower.contains("english") ||
                lower.contains("urdu") || lower.contains("spanish") ||
                lower.contains("german") || lower.contains("chinese") ||
                lower.contains("indonesian") || lower.contains("bengali") ||
                lower.contains("russian") || lower.contains("turkish") -> StationCategory.TRANSLATIONS

            lower.contains("تفسير") || lower.contains("فتاو") ||
                lower.contains("tafseer") || lower.contains("fatwa") ||
                lower.contains("نور على الدرب") || lower.contains("رقية") ||
                lower.contains("roqiah") || lower.contains("سكينة") ||
                lower.contains("sakeenah") || lower.contains("أذكار") ||
                lower.contains("adhkar") -> StationCategory.TAFSEER

            lower.contains("ورش") || lower.contains("قالون") ||
                lower.contains("الدوري") || lower.contains("شعبة") ||
                lower.contains("السوسي") || lower.contains("warsh") ||
                lower.contains("qaloon") || lower.contains("riwayah") ||
                lower.contains("رواية") -> StationCategory.RIWAYAT

            else -> StationCategory.POPULAR
        }
    }
}
