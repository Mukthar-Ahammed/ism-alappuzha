export type DhikrCategory =
  | "All"
  | "Morning & Evening"
  | "After Salah"
  | "Sleep"
  | "Travel"
  | "Food"
  | "Forgiveness"
  | "Protection";

export const dhikrCategories: DhikrCategory[] = [
  "All",
  "Morning & Evening",
  "After Salah",
  "Sleep",
  "Travel",
  "Food",
  "Forgiveness",
  "Protection",
];

export interface DhikrItem {
  id: string;
  category: Exclude<DhikrCategory, "All">;
  arabic: string;
  transliteration: string;
  malayalam: string;
  source: string;
  repeat?: number;
  audioUrl?: string;
}

export const dhikrScholarNote =
  "TODO: Content reviewed by [Scholar Name] — Do not publish live until a scholar has checked the Arabic text, transliteration, Malayalam meaning, and every source reference.";

export const dhikrData: DhikrItem[] = [
  // --- Morning & Evening ---
  {
    id: "me-1",
    category: "Morning & Evening",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la shareeka lah",
    malayalam: "TODO: ഞങ്ങളും അല്ലാഹുവിന്റെ ആധിപത്യവും പ്രഭാതത്തിലേക്ക് പ്രവേശിച്ചിരിക്കുന്നു.",
    source: "Sahih Muslim 2723",
    repeat: 1,
  },
  {
    id: "me-2",
    category: "Morning & Evening",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur",
    malayalam: "TODO: അല്ലാഹുവേ, നിന്നാൽ ഞങ്ങൾ പ്രഭാതത്തിലേക്കും സന്ധ്യയിലേക്കും പ്രവേശിക്കുന്നു.",
    source: "Sunan At-Tirmidhi 3391",
    repeat: 1,
  },
  {
    id: "me-3",
    category: "Morning & Evening",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Subhanallahi wa bihamdih",
    malayalam: "TODO: അല്ലാഹുവിനെ സ്തുതിച്ചും പുകഴ്ത്തിയും ഞാൻ പരിശുദ്ധനാക്കുന്നു.",
    source: "Sahih Bukhari 6405",
    repeat: 100,
  },

  // --- After Salah ---
  {
    id: "as-1",
    category: "After Salah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
    malayalam: "TODO: ഞാൻ അല്ലാഹുവോട് പാപമോചനം തേടുന്നു.",
    source: "Sahih Muslim 591",
    repeat: 3,
  },
  {
    id: "as-2",
    category: "After Salah",
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration: "Allahumma antas-Salamu wa minkas-Salam tabarakta ya dhal-Jalali wal-Ikram",
    malayalam: "TODO: അല്ലാഹുവേ, നീ സമാധാനമാണ്, നിന്നിൽ നിന്നാണ് സമാധാനം.",
    source: "Sahih Muslim 592",
    repeat: 1,
  },
  {
    id: "as-3",
    category: "After Salah",
    arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَاللَّهُ أَكْبَرُ",
    transliteration: "Subhanallah wal-hamdu lillah wallahu Akbar",
    malayalam: "TODO: അല്ലാഹു പരിശുദ്ധൻ, സർവ്വസ്തുതിയും അല്ലാഹുവിന്, അല്ലാഹു ഏറ്റവും മഹാൻ.",
    source: "Sahih Muslim 595",
    repeat: 33,
  },

  // --- Sleep ---
  {
    id: "sl-1",
    category: "Sleep",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    malayalam: "TODO: അല്ലാഹുവേ, നിന്റെ നാമത്തിൽ ഞാൻ മരിക്കുകയും ജീവിക്കുകയും ചെയ്യുന്നു.",
    source: "Sahih Bukhari 6312",
    repeat: 1,
  },
  {
    id: "sl-2",
    category: "Sleep",
    arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
    transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
    malayalam: "TODO: അല്ലാഹുവേ, നിന്റെ അടിമകളെ ഉയിർത്തെഴുന്നേൽപ്പിക്കുന്ന ദിവസം നിന്റെ ശിക്ഷയിൽ നിന്ന് എന്നെ കാക്കേണമേ.",
    source: "Sunan Abu Dawud 5045",
    repeat: 1,
  },

  // --- Travel ---
  {
    id: "tr-1",
    category: "Travel",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrineen wa inna ila Rabbina lamunqalibun",
    malayalam: "TODO: ഇതിനെ നമുക്ക് കീഴ്‌പ്പെടുത്തിത്തന്ന അല്ലാഹു പരിശുദ്ധൻ.",
    source: "Sunan At-Tirmidhi 3446 (Surah Az-Zukhruf 43:13-14)",
    repeat: 1,
  },
  {
    id: "tr-2",
    category: "Travel",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى",
    transliteration: "Allahumma inni as'aluka fi safari hadhal-birra wat-taqwa wa minal-'amali ma tarda",
    malayalam: "TODO: അല്ലാഹുവേ, ഈ യാത്രയിൽ നന്മയും ഭക്തിയും നിനക്ക് തൃപ്തികരമായ കർമ്മവും ഞാൻ ചോദിക്കുന്നു.",
    source: "Sahih Muslim 1342",
    repeat: 1,
  },

  // --- Food ---
  {
    id: "fd-1",
    category: "Food",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    malayalam: "TODO: അല്ലാഹുവിന്റെ നാമത്തിൽ.",
    source: "Sahih Bukhari 5376",
    repeat: 1,
  },
  {
    id: "fd-2",
    category: "Food",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    malayalam: "TODO: എനിക്ക് ഇത് ഭക്ഷിപ്പിക്കുകയും എന്റെ ഭാഗത്ത് നിന്ന് ശക്തിയോ കഴിവോ ഇല്ലാതെ ഉപജീവനം നൽകുകയും ചെയ്ത അല്ലാഹുവിന് സ്തുതി.",
    source: "Sunan At-Tirmidhi 3458",
    repeat: 1,
  },

  // --- Forgiveness ---
  {
    id: "fg-1",
    category: "Forgiveness",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullahal-'Azeemal-ladhi la ilaha illa Huwal-Hayyul-Qayyumu wa atubu ilayh",
    malayalam: "TODO: ജീവനുള്ളവനും നിലനിൽക്കുന്നവനുമായ അല്ലാഹുവോട് ഞാൻ പാപമോചനം തേടുന്നു.",
    source: "Sunan Abu Dawud 1517",
    repeat: 3,
  },
  {
    id: "fg-2",
    category: "Forgiveness",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    transliteration: "Rabbighfir li wa tub 'alayya innaka antat-Tawwabur-Raheem",
    malayalam: "TODO: എന്റെ രക്ഷിതാവേ, എനിക്ക് പൊറുത്തുതരേണമേ. നീ തൗബ സ്വീകരിക്കുന്നവനും കരുണാമയനുമാണ്.",
    source: "Sunan At-Tirmidhi 3434",
    repeat: 1,
  },

  // --- Protection ---
  {
    id: "pr-1",
    category: "Protection",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimati-llahit-tammati min sharri ma khalaq",
    malayalam: "TODO: അല്ലാഹുവിന്റെ പൂർണ്ണമായ വചനങ്ങൾ കൊണ്ട് അവൻ സൃഷ്ടിച്ചതിന്റെ തിന്മയിൽ നിന്ന് ഞാൻ ശരണം തേടുന്നു.",
    source: "Sahih Muslim 2708",
    repeat: 3,
  },
  {
    id: "pr-2",
    category: "Protection",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa huwas-Sami'ul-'Aleem",
    malayalam: "TODO: അല്ലാഹുവിന്റെ നാമത്തിൽ, അവന്റെ നാമത്തോടൊപ്പം ഭൂമിയിലോ ആകാശത്തിലോ ഒന്നും ദോഷം ചെയ്യില്ല.",
    source: "Sunan Abu Dawud 5088",
    repeat: 3,
  },
];
