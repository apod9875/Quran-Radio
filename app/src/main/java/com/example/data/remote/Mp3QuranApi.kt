package com.example.data.remote

import com.example.data.model.RadioResponse
import retrofit2.http.GET
import retrofit2.http.Query

interface Mp3QuranApi {
    @GET("api/v3/radios")
    suspend fun getRadios(
        @Query("language") language: String = "ar"
    ): RadioResponse
}
