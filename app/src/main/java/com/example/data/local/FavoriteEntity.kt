package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val url: String,
    val addedAt: Long = System.currentTimeMillis()
)
