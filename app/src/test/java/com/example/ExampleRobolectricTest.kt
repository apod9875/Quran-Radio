package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.remote.FallbackStations
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("MP3Quran Radio", appName)
    }

    @Test
    fun `verify fallback stations are available`() {
        val arabicStations = FallbackStations.ARABIC_STATIONS
        val englishStations = FallbackStations.ENGLISH_STATIONS

        assertTrue("Arabic stations should not be empty", arabicStations.isNotEmpty())
        assertTrue("English stations should not be empty", englishStations.isNotEmpty())
        assertEquals(arabicStations.size, englishStations.size)
        assertTrue(arabicStations.first().url.startsWith("https://"))
    }
}
