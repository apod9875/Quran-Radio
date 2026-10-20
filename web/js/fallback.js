/**
 * Built-in station list used only when the mp3quran API cannot be reached.
 * IDs and URLs match the live API, so favorites and offline samples stay valid across both.
 */
window.FALLBACK_STATIONS = {
  ar: [
    { id: 79, name: "مشاري العفاسي", url: "https://backup.qurango.net/radio/mishary_alafasi" },
    { id: 30, name: "عبدالباسط عبدالصمد", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad" },
    { id: 32, name: "عبدالباسط عبدالصمد", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad" },
    { id: 74, name: "محمود خليل الحصري", url: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary" },
    { id: 69, name: "محمد صديق المنشاوي", url: "https://backup.qurango.net/radio/mohammed_siddiq_alminshawi" },
    { id: 33, name: "عبدالرحمن السديس", url: "https://backup.qurango.net/radio/abdulrahman_alsudaes" },
    { id: 63, name: "ماهر المعيقلي", url: "https://backup.qurango.net/radio/maher" },
    { id: 17, name: "سعد الغامدي", url: "https://backup.qurango.net/radio/saad_alghamdi" },
    { id: 18, name: "سعود الشريم", url: "https://backup.qurango.net/radio/saud_alshuraim" },
    { id: 2, name: "شيخ أبو بكر الشاطري", url: "https://backup.qurango.net/radio/shaik_abu_bakr_al_shatri" },
    { id: 3, name: "أحمد العجمي", url: "https://backup.qurango.net/radio/ahmad_alajmy" },
    { id: 58, name: "ياسر الدوسري", url: "https://backup.qurango.net/radio/yasser_aldosari" },
    { id: 53, name: "ناصر القطامي", url: "https://backup.qurango.net/radio/nasser_alqatami" },
    { id: 48, name: "علي جابر", url: "https://backup.qurango.net/radio/ali_jaber" },
    { id: 10902, name: "آيات السكينة", url: "https://backup.qurango.net/radio/sakeenah" },
    { id: 10906, name: "أذكار الصباح", url: "https://backup.qurango.net/radio/athkar_sabah" },
    { id: 10907, name: "أذكار المساء", url: "https://backup.qurango.net/radio/athkar_masa" },
    { id: 114, name: "الرقية الشرعية", url: "https://backup.qurango.net/radio/roqiah" },
    { id: 116, name: "تفسير القران الكريم--", url: "https://backup.qurango.net/radio/tafseer" },
    { id: 113, name: "الفتاوى العامة", url: "https://backup.qurango.net/radio/fatwa" },
    { id: 31, name: "عبدالباسط عبدالصمد", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_warsh" },
    { id: 109046, name: "ترجمة معاني القرآن باللغة الإنجليزية", url: "https://backup.qurango.net/radio/translation_quran_english_basit" },
    { id: 109055, name: "ترجمة معاني القرآن باللغة الفرنسية", url: "https://backup.qurango.net/radio/translation_quran_french" }
  ],
  eng: [
    { id: 79, name: "Radio Mishary Alafasi", url: "https://backup.qurango.net/radio/mishary_alafasi" },
    { id: 30, name: "Radio Abdulbasit Abdulsamad", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad" },
    { id: 32, name: "Radio Abdulbasit Abdulsamad", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad" },
    { id: 74, name: "Radio Mahmoud Khalil Al-Hussary", url: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary" },
    { id: 69, name: "Radio Mohammed Siddiq Al-Minshawi", url: "https://backup.qurango.net/radio/mohammed_siddiq_alminshawi" },
    { id: 33, name: "Radio Abdulrahman Alsudaes", url: "https://backup.qurango.net/radio/abdulrahman_alsudaes" },
    { id: 63, name: "Radio Maher Al Meaqli", url: "https://backup.qurango.net/radio/maher" },
    { id: 17, name: "Radio Saad Al-Ghamdi", url: "https://backup.qurango.net/radio/saad_alghamdi" },
    { id: 18, name: "Radio Saud Al-Shuraim", url: "https://backup.qurango.net/radio/saud_alshuraim" },
    { id: 2, name: "Radio Shaik Abu Bakr Al Shatri", url: "https://backup.qurango.net/radio/shaik_abu_bakr_al_shatri" },
    { id: 3, name: "Radio Ahmad Al-Ajmy", url: "https://backup.qurango.net/radio/ahmad_alajmy" },
    { id: 58, name: "Radio Yasser Al-Dosari", url: "https://backup.qurango.net/radio/yasser_aldosari" },
    { id: 53, name: "Radio Nasser Alqatami", url: "https://backup.qurango.net/radio/nasser_alqatami" },
    { id: 48, name: "Radio Ali Jaber", url: "https://backup.qurango.net/radio/ali_jaber" },
    { id: 10902, name: "Verses of serenity", url: "https://backup.qurango.net/radio/sakeenah" },
    { id: 10906, name: "Words of remembrance for morning", url: "https://backup.qurango.net/radio/athkar_sabah" },
    { id: 10907, name: "Words of remembrance for evening", url: "https://backup.qurango.net/radio/athkar_masa" },
    { id: 114, name: "Sharia ruqyah", url: "https://backup.qurango.net/radio/roqiah" },
    { id: 116, name: "--Quran Tafseer--", url: "https://backup.qurango.net/radio/tafseer" },
    { id: 113, name: "General Fatwa Radio", url: "https://backup.qurango.net/radio/fatwa" },
    { id: 31, name: "Radio Abdulbasit Abdulsamad", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_warsh" },
    { id: 109046, name: "Quran translation into English - AbdulBasit Abdul Samad", url: "https://backup.qurango.net/radio/translation_quran_english_basit" },
    { id: 109055, name: "Quran translation into French", url: "https://backup.qurango.net/radio/translation_quran_french" }
  ]
};
