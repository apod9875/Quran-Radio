package com.example.data.model

data class ReciterProfile(
    val name: String,
    val englishName: String,
    val title: String,
    val origin: String,
    val era: String,
    val riwayah: String,
    val bio: String
)

object ReciterDirectory {
    val profiles = mapOf(
        "abdulbasit" to ReciterProfile(
            name = "الشيخ عبد الباسط عبد الصمد",
            englishName = "Sheikh Abdulbasit Abdussamad",
            title = "صوت مكة وصاحب الحنجرة الذهبية",
            origin = "مصر (قنا - أرمنت)",
            era = "1927 - 1988م",
            riwayah = "حفص عن عاصم (المجود والمرتل)، ورش",
            bio = "أحد أشهر قراء القرآن الكريم في العالم الإسلامي، تميز بجمال صوته وأسلوبه الفريد والنادر في تجويد وترتيل آيات الذكر الحكيم، لقب بـ 'صوت مكة' و'الحنجرة الذهبية'."
        ),
        "minshawi" to ReciterProfile(
            name = "الشيخ محمد صديق المنشاوي",
            englishName = "Sheikh Mohamed Siddiq El-Minshawi",
            title = "الصوت الباكي ذو النبرة الخاشعة",
            origin = "مصر (سوهاج)",
            era = "1920 - 1969م",
            riwayah = "حفص عن عاصم (المرتل والمجود)",
            bio = "أحد رواد التلاوة وأعلام الترتيل القرآني في العصر الحديث، اشتهر بجمال صوته العذب ونبرته الخاشعة الحزينة التي تهز القلوب."
        ),
        "hussary" to ReciterProfile(
            name = "الشيخ محمود خليل الحصري",
            englishName = "Sheikh Mahmoud Khalil Al-Husary",
            title = "شيخ عموم المقارئ المصرية وإمام التجويد",
            origin = "مصر (طنطا)",
            era = "1917 - 1980م",
            riwayah = "حفص عن عاصم، ورش، قالون، الدوري",
            bio = "شيخ عموم المقارئ المصرية وأحد أبرز قراء القرآن الكريم المتقنين لأحكام التلاوة والتجويد، كان أول من سجل المصحف المرتل بروايات متعددة."
        ),
        "alafasi" to ReciterProfile(
            name = "الشيخ مشاري راشد العفاسي",
            englishName = "Sheikh Mishary Rashid Alafasy",
            title = "إمام المسجد الكبير بدولة الكويت",
            origin = "دولة الكويت",
            era = "معاصر (مواليد 1976م)",
            riwayah = "حفص عن عاصم والقراءات العشر",
            bio = "قارئ ومنشد كويتي شهير تخرج من الجامعة الإسلامية بالمدينة المنورة وتخصص في القراءات العشر والتفسير، يتميز بصوت عذب ندي."
        ),
        "muaiqly" to ReciterProfile(
            name = "الشيخ ماهر بن حمد المعيقلي",
            englishName = "Sheikh Maher Al-Muaiqly",
            title = "إمام وخطيب المسجد الحرام بمكة المكرمة",
            origin = "المملكة العربية السعودية",
            era = "معاصر (مواليد 1969م)",
            riwayah = "حفص عن عاصم",
            bio = "إمام وخطيب المسجد الحرام، تخرج من كلية المعلمين بالمدينة وحصل على الدكتوراه في الشريعة، يمتلك خامة صوتية مؤثرة تجذب المصلين."
        ),
        "alghamdi" to ReciterProfile(
            name = "الشيخ سعد بن سعيد الغامدي",
            englishName = "Sheikh Saad Al-Ghamdi",
            title = "قارئ وإمام سعودي بارز",
            origin = "المملكة العربية السعودية",
            era = "معاصر (مواليد 1967م)",
            riwayah = "حفص عن عاصم",
            bio = "إمام وقارئ سعودي تخرج من كلية الشريعة، صلى إماماً مشاركاً في صلاة التراويح بالمسجد النبوي الشريف وصوته محبوب لدى الملايين."
        ),
        "alsudaes" to ReciterProfile(
            name = "الشيخ عبد الرحمن السديس",
            englishName = "Sheikh Abdul Rahman Al-Sudais",
            title = "إمام الحرم المكي الشريف",
            origin = "المملكة العربية السعودية",
            era = "معاصر (مواليد 1960م)",
            riwayah = "حفص عن عاصم",
            bio = "الرئيس العام لشؤون المسجد الحرام والمسجد النبوي وإمام وخطيب المسجد الحرام، تميزت تلاوته بالجهورية والنبرة الخاشعة."
        ),
        "shuraim" to ReciterProfile(
            name = "الشيخ سعود بن إبراهيم الشريم",
            englishName = "Sheikh Saud Al-Shuraim",
            title = "إمام وخطيب المسجد الحرام الأسبق",
            origin = "المملكة العربية السعودية",
            era = "معاصر (مواليد 1964م)",
            riwayah = "حفص عن عاصم",
            bio = "إمام وخطيب المسجد الحرام وعميد كلية الدراسات القضائية والأنظمة بجامعة أم القرى سابقاً، عرف بقراءته الرصينة السريعة النبرة."
        ),
        "dosari" to ReciterProfile(
            name = "الشيخ ياسر بن راشد الدوسري",
            englishName = "Sheikh Yasser Al-Dosari",
            title = "إمام وخطيب المسجد الحرام",
            origin = "المملكة العربية السعودية",
            era = "معاصر (مواليد 1980م)",
            riwayah = "حفص عن عاصم",
            bio = "إمام وخطيب المسجد الحرام وعضو هيئة التدريس بجامعة الملك سعود، يتميز بصوت رنان شجي وأداء مؤثر في التلاوة."
        )
    )

    fun findForStation(stationName: String): ReciterProfile {
        val lower = stationName.lowercase()
        return when {
            lower.contains("عبد الباسط") || lower.contains("abdulbasit") || lower.contains("عبدالباسط") -> profiles["abdulbasit"] ?: defaultProfile(stationName)
            lower.contains("منشاوي") || lower.contains("minshawi") -> profiles["minshawi"] ?: defaultProfile(stationName)
            lower.contains("حصري") || lower.contains("hussary") || lower.contains("alhussary") -> profiles["hussary"] ?: defaultProfile(stationName)
            lower.contains("عفاسي") || lower.contains("alafasi") || lower.contains("alafasy") -> profiles["alafasi"] ?: defaultProfile(stationName)
            lower.contains("معيقلي") || lower.contains("muaiqly") -> profiles["muaiqly"] ?: defaultProfile(stationName)
            lower.contains("غامدي") || lower.contains("ghamdi") -> profiles["alghamdi"] ?: defaultProfile(stationName)
            lower.contains("سديس") || lower.contains("sudaes") -> profiles["alsudaes"] ?: defaultProfile(stationName)
            lower.contains("شريم") || lower.contains("shuraim") -> profiles["shuraim"] ?: defaultProfile(stationName)
            lower.contains("دوسري") || lower.contains("dosari") -> profiles["dosari"] ?: defaultProfile(stationName)
            else -> defaultProfile(stationName)
        }
    }

    private fun defaultProfile(stationName: String): ReciterProfile {
        return ReciterProfile(
            name = stationName,
            englishName = stationName,
            title = "إذاعة قرآنية متخصصة بث مباشر 24/7",
            origin = "شبكة MP3Quran العالمية",
            era = "بث متواصل على مدار الساعة",
            riwayah = "تلاوات مباركة وتفاسير معتمدة",
            bio = "محطة إذاعية تبث آيات القرآن الكريم وتفاسيره وترجمات معانيه على مدار الساعة بجودة صوتية عالية من شبكة MP3Quran."
        )
    }
}
