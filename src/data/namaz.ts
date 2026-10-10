export interface PrayerStep {
  id: string;
  stepNumber: number;
  name: string;
  whatToDo: string;
  arabic: string;
  transliteration: string;
  malayalam: string;
  dos: string[];
  donts: string[];
  postureSvgKey: string;
  isRepeatNode?: boolean;
}

export interface RakahInfo {
  name: string;
  rakahs: number;
  description: string;
  details: string;
}

export const rakahData: RakahInfo[] = [
  {
    name: "Fajr",
    rakahs: 2,
    description: "2 Rakahs (Dawn Prayer)",
    details: "Recite aloud in both rakahs. Final Tashahhud and Salam fall after the 2nd Rakah.",
  },
  {
    name: "Zuhr",
    rakahs: 4,
    description: "4 Rakahs (Noon Prayer)",
    details: "Recite silently in all 4 rakahs. First Tashahhud after 2nd Rakah; final Tashahhud after 4th Rakah.",
  },
  {
    name: "Asr",
    rakahs: 4,
    description: "4 Rakahs (Afternoon Prayer)",
    details: "Recite silently in all 4 rakahs. First Tashahhud after 2nd Rakah; final Tashahhud after 4th Rakah.",
  },
  {
    name: "Maghrib",
    rakahs: 3,
    description: "3 Rakahs (Sunset Prayer)",
    details: "Recite aloud in first 2 rakahs, silently in 3rd. First Tashahhud after 2nd Rakah; final Tashahhud after 3rd Rakah.",
  },
  {
    name: "Isha",
    rakahs: 4,
    description: "4 Rakahs (Night Prayer)",
    details: "Recite aloud in first 2 rakahs, silently in last 2. First Tashahhud after 2nd Rakah; final Tashahhud after 4th Rakah.",
  },
];

export const scholarNote =
  "TODO: Content reviewed by [Scholar Name] — Do not publish live until a scholar has checked the Arabic text, Malayalam translation, and step order.";

export const namazSteps: PrayerStep[] = [
  {
    id: "niyyah",
    stepNumber: 1,
    name: "Niyyah (Intention)",
    whatToDo: "Stand facing the Qiblah with a clear, sincere intention in your heart for the specific prayer.",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى",
    transliteration: "Nawaytu an usalliya lillahi ta'ala",
    malayalam: "TODO: മലയാളം വിശദീകരണം — പണ്ഡിത പരിശോധനക്കായി മാറ്റിവെച്ചിരിക്കുന്നു.",
    dos: ["Face the Qiblah squarely", "Keep intention quiet in the heart"],
    donts: ["Do not utter loud verbal intentions that distract others"],
    postureSvgKey: "niyyah",
  },
  {
    id: "takbeer",
    stepNumber: 2,
    name: "Takbeer al-Ihram",
    whatToDo: "Raise hands to shoulders or earlobes and utter 'Allahu Akbar' to enter the sacred state of prayer.",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    malayalam: "TODO: മലയാളം വിശദീകരണം — അല്ലാഹു ഏറ്റവും വലിയവൻ എന്ന പ്രഖ്യാപനത്തോടെ കൈകൾ ഉയർത്തുക.",
    dos: ["Palms facing the Qiblah", "Raise hands to ears or shoulder level"],
    donts: ["Do not swing hands excessively or bow before Takbeer"],
    postureSvgKey: "takbeer",
  },
  {
    id: "qiyam",
    stepNumber: 3,
    name: "Qiyam & Recitation",
    whatToDo: "Place right hand over left over the chest, recite opening supplication, Surah Al-Fatiha, and a portion of Qur'an.",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    transliteration: "Bismillahir-Rahmanir-Raheem. Al-hamdu lillahi Rabbil-'Alameen...",
    malayalam: "TODO: മലയാളം വിശദീകരണം — നിൽക്കുന്ന അവസ്ഥയിൽ സൂറത്തുൽ ഫാത്തിഹയും മറ്റൊരു സൂറത്തും ഓതുക.",
    dos: ["Look down toward the spot of prostration", "Recite Al-Fatiha attentively"],
    donts: ["Do not look around or look up at the ceiling"],
    postureSvgKey: "qiyam",
  },
  {
    id: "ruku",
    stepNumber: 4,
    name: "Ruku (Bowing)",
    whatToDo: "Say 'Allahu Akbar', bow flat from the waist with hands grasping knees, and recite praises of Allah.",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ",
    transliteration: "Subhana Rabbiyal-'Azeemi wa bihamdih (3x)",
    malayalam: "TODO: മലയാളം വിശദീകരണം — മുതുക് സമമാക്കി കുനിഞ്ഞ് തസ്ബീഹ് ചൊല്ലുക.",
    dos: ["Keep back flat like a tabletop", "Grasp knees with fingers spread"],
    donts: ["Do not arch or arch shoulders downward excessiveiy"],
    postureSvgKey: "ruku",
  },
  {
    id: "itidal",
    stepNumber: 5,
    name: "I'tidal (Rising from Ruku)",
    whatToDo: "Rise back to a full standing posture saying 'Sami'allahu liman hamidah', then recite praises.",
    arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ • رَبَّنَا وَلَكَ الْحَمْدُ",
    transliteration: "Sami'allahu liman hamidah. Rabbana wa lakal-hamd",
    malayalam: "TODO: മലയാളം വിശദീകരണം — റുകൂഇൽ നിന്ന് നേരെ നിവർന്ന് പ്രശംസ ചൊല്ലുക.",
    dos: ["Stand upright until every vertebra settles", "Maintain calm stillness"],
    donts: ["Do not rush directly into Sujood without standing upright"],
    postureSvgKey: "itidal",
  },
  {
    id: "sujood-1",
    stepNumber: 6,
    name: "Sujood (First Prostration)",
    whatToDo: "Prostrate with forehead, nose, palms, knees, and toes touching the ground firmly.",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ",
    transliteration: "Subhana Rabbiyal-A'la wa bihamdih (3x)",
    malayalam: "TODO: മലയാളം വിശദീകരണം — ഏഴ് അവയവങ്ങൾ നിലത്തുറപ്പിച്ച് സുജൂദ് ചെയ്യുക.",
    dos: ["Ensure 7 limbs touch ground", "Keep elbows away from ribs"],
    donts: ["Do not lay forearms flat on the ground like an animal"],
    postureSvgKey: "sujood",
  },
  {
    id: "jalsa",
    stepNumber: 7,
    name: "Jalsa (Sitting Between Sujoods)",
    whatToDo: "Rise from prostration to sit upright on left foot with right foot erect, and pray for forgiveness.",
    arabic: "رَبِّ اغْفِرْ لِي ، رَبِّ اغْفِرْ لِي",
    transliteration: "Rabbighfir li, Rabbighfir li",
    malayalam: "TODO: മലയാളം വിശദീകരണം — രണ്ട് സുജൂദുകൾക്കിടയിൽ ഇരുന്ന് പാപമോചനം തേടുക.",
    dos: ["Sit upright calmly", "Hands rested gently on knees"],
    donts: ["Do not bounce up and down rapidly"],
    postureSvgKey: "jalsa",
  },
  {
    id: "sujood-2",
    stepNumber: 8,
    name: "Sujood (Second Prostration)",
    whatToDo: "Perform the second prostration exactly as the first, praising the Supreme Sustainer.",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ",
    transliteration: "Subhana Rabbiyal-A'la wa bihamdih (3x)",
    malayalam: "TODO: മലയാളം വിശദീകരണം — രണ്ടാമത്തെ സുജൂദ് നിർവ്വഹിക്കുക.",
    dos: ["Focus deeply on humility before Allah", "Recite tasbeeh 3 times"],
    donts: ["Do not lift feet or toes off the floor"],
    postureSvgKey: "sujood",
  },
  {
    id: "second-rakah",
    stepNumber: 9,
    name: "Second Rakah (Repeat Cycle)",
    whatToDo: "Stand back up for the 2nd Rakah and repeat steps 3 through 8 (Qiyam, Ruku, I'tidal, Sujoods).",
    arabic: "اللَّهُ أَكْبَرُ (الرَّكْعَةُ الثَّانِيَةُ)",
    transliteration: "Allahu Akbar (Second Rakah Cycle)",
    malayalam: "TODO: മലയാളം വിശദീകരണം — രണ്ടാമത്തെ റക്അത്തിനായി എഴുന്നേറ്റ് ആവർത്തിക്കുക.",
    dos: ["Rise smoothly using legs", "Begin Al-Fatiha for 2nd Rakah"],
    donts: ["Do not repeat opening supplication (Thana) in 2nd Rakah"],
    postureSvgKey: "qiyam",
    isRepeatNode: true,
  },
  {
    id: "tashahhud",
    stepNumber: 10,
    name: "Tashahhud (Sitting Testimony)",
    whatToDo: "Sit after the 2nd Rakah (and final Rakah) to recite the testimonial of faith and praise Allah.",
    arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ",
    transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat...",
    malayalam: "TODO: മലയാളം വിശദീകരണം — അത്തഹിയ്യാത്ത് ഇരിപ്പും സാക്ഷ്യപ്രഖ്യാപനവും.",
    dos: ["Raise and point right index finger during Shahadah", "Maintain tranquil posture"],
    donts: ["Do not move left leg erratically"],
    postureSvgKey: "tashahhud",
  },
  {
    id: "salawat",
    stepNumber: 11,
    name: "Salawat & Closing Supplication",
    whatToDo: "In the final sitting, send blessings upon Prophet Muhammad (PBUH) and Prophet Ibrahim, followed by personal dua.",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ...",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad...",
    malayalam: "TODO: മലയാളം വിശദീകരണം — പ്രവാചകന്റെ മേലുള്ള സ്വലാത്തും സമാപന ദുആയും.",
    dos: ["Recite Ibrahimic Salawat thoughtfully", "Seek protection from trial of grave"],
    donts: ["Do not skip Salawat in the final Sitting"],
    postureSvgKey: "tashahhud",
  },
  {
    id: "salam",
    stepNumber: 12,
    name: "Tasleem (Salam)",
    whatToDo: "Turn face to the right, then to the left, uttering 'As-salamu alaykum wa rahmatullah' to conclude prayer.",
    arabic: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
    transliteration: "As-salamu alaykum wa rahmatullah (Right & Left)",
    malayalam: "TODO: മലയാളം വിശദീകരണം — വലത്തോട്ടും ഇടത്തോട്ടും സലാം വീട്ടുക.",
    dos: ["Turn head until right cheek is visible from behind", "Wish peace upon angels and believers"],
    donts: ["Do not turn shoulders away from Qiblah during Salam"],
    postureSvgKey: "salam",
  },
];
