package com.example.data.model

enum class StationCategory(val arabicTitle: String, val englishTitle: String) {
    ALL("الكل", "All"),
    POPULAR("مشاهير القراء", "Top Reciters"),
    RIWAYAT("الروايات", "Recitations"),
    TAFSEER("تفسير وفتاوى", "Tafseer & Fatwa"),
    TRANSLATIONS("ترجمات المعاني", "Translations"),
    FAVORITES("المفضلة", "Favorites");

    fun getTitle(language: String): String = if (language == "ar") arabicTitle else englishTitle
}

data class RadioStation(
    val id: Int,
    val name: String,
    val url: String,
    val category: StationCategory = StationCategory.ALL,
    val isFavorite: Boolean = false
)
