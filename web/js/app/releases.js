/**
 * Release notes shown to users after an update ("What's new"), newest first.
 * Every release that users can notice adds an entry here, with the same `version` as CACHE_STATIC in
 * sw/config.js (testing/web/unit/releases_test.mjs checks both, and that `ar` and `eng` match).
 * Write short lines about what the user gets, not about code.
 */
window.QR_RELEASES = [
  {
    version: '3.7.1',
    date: '2026-10-20',
    ar: [
      'هذا التحديث من م. أسامة الحلفاوي'
    ],
    eng: [
      'This update is from Eng. Osama Alhalafawi'
    ]
  },
  {
    version: '3.7.0',
    date: '2026-10-20',
    ar: [
      'إذاعة القرآن الكريم من مكة المكرمة، والبث المباشر من المسجد الحرام والمسجد النبوي',
      'إذاعة القاهرة أسرع: يختار التطبيق أسرع مصدر على جهازك وينتقل لغيره تلقائياً عند التوقف',
      'الإذاعات المفضلة تظهر أعلى القائمة',
      'نافذة تأكيد قبل التحميل تعرض حجم السورة، ودون أي حد للمساحة سوى مساحة جهازك',
      'تحديث الصفحة لا يوقف الاستماع: يستكمل التطبيق ما كنت تسمعه',
      'أيقونة جديدة للتطبيق، ورسالة عند توفر إصدار جديد'
    ],
    eng: [
      'Holy Quran Radio from Makkah, and live broadcasts from Masjid al-Haram and Masjid an-Nabawi',
      'Faster Cairo radio: the app picks the fastest source on your device and switches automatically if one stalls',
      'Favorite stations appear at the top of the list',
      'A confirmation window before downloading shows the surah size, with no storage limit but your device',
      'Refreshing the page no longer stops listening: the app continues what you were playing',
      'A new app icon, and a message when a new version is available'
    ]
  }
];
