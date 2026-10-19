package com.example.player

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * AudioCacheManager for Android
 * Aggressively caches radio audio up to 10 GB and provides LRU refresh / eviction
 * for unused audio to enable offline playback.
 * 
 * صدقة جارية لـ (عبدالرحيم معبد) • Mabed
 */
object AudioCacheManager {
    private const val TAG = "AudioCacheManager"
    const val MAX_CACHE_BYTES = 10L * 1024L * 1024L * 1024L // 10 GB

    private fun getCacheDir(context: Context): File {
        val dir = File(context.cacheDir, "radio_audio")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    private fun getStationCacheFile(context: Context, stationId: Int): File {
        return File(getCacheDir(context), "station_${stationId}.mp3")
    }

    fun hasCachedAudio(context: Context, stationId: Int): Boolean {
        val file = getStationCacheFile(context, stationId)
        return file.exists() && file.length() > 500_000 // At least 500KB
    }

    fun getCachedAudioFile(context: Context, stationId: Int): File? {
        val file = getStationCacheFile(context, stationId)
        return if (file.exists() && file.length() > 500_000) {
            file.setLastModified(System.currentTimeMillis())
            file
        } else {
            null
        }
    }

    fun getUsedCacheBytes(context: Context): Long {
        val dir = getCacheDir(context)
        return dir.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
    }

    suspend fun refreshUnusedCache(context: Context, isFavoriteCheck: (Int) -> Boolean): Long = withContext(Dispatchers.IO) {
        val dir = getCacheDir(context)
        val files = dir.listFiles() ?: return@withContext 0L
        // Sort oldest modified first
        val sorted = files.sortedBy { it.lastModified() }
        var freedBytes = 0L

        val currentTotal = getUsedCacheBytes(context)
        val targetSize = (MAX_CACHE_BYTES * 0.85).toLong()

        for (file in sorted) {
            val stationId = file.name.substringAfter("station_").substringBefore(".mp3").toIntOrNull()
            val isFav = stationId != null && isFavoriteCheck(stationId)

            // If not favorite or if strictly over 10GB, delete file
            if (!isFav || (currentTotal - freedBytes) > MAX_CACHE_BYTES) {
                val len = file.length()
                if (file.delete()) {
                    freedBytes += len
                }
                if ((currentTotal - freedBytes) <= targetSize) {
                    break
                }
            }
        }
        Log.d(TAG, "Refreshed unused audio cache: freed $freedBytes bytes")
        freedBytes
    }

    suspend fun cacheStationAudio(context: Context, stationId: Int, streamUrl: String): Boolean = withContext(Dispatchers.IO) {
        val targetFile = getStationCacheFile(context, stationId)
        val tempFile = File(getCacheDir(context), "temp_${stationId}_${System.currentTimeMillis()}.tmp")

        try {
            val url = URL(streamUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000
                readTimeout = 15000
                setRequestProperty("User-Agent", "MP3QuranRadio/1.0 (Android)")
            }
            connection.connect()

            if (connection.responseCode in 200..299) {
                val input: InputStream = connection.inputStream
                val output = FileOutputStream(tempFile)
                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalRead = 0L
                val maxChunk = 8L * 1024L * 1024L // Cache up to 8MB per offline radio sample

                while (input.read(buffer).also { bytesRead = it } != -1 && totalRead < maxChunk) {
                    output.write(buffer, 0, bytesRead)
                    totalRead += bytesRead
                }
                output.flush()
                output.close()
                input.close()

                if (tempFile.exists() && tempFile.length() > 200_000) {
                    if (targetFile.exists()) targetFile.delete()
                    tempFile.renameTo(targetFile)
                    targetFile.setLastModified(System.currentTimeMillis())
                    Log.d(TAG, "Cached station $stationId (${targetFile.length()} bytes)")
                    return@withContext true
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed caching stream for station $stationId: ${e.message}")
        } finally {
            if (tempFile.exists()) tempFile.delete()
        }
        false
    }
}
