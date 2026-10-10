export interface LiveConfig {
  isLive: boolean; // Default false. Can be toggled in dev preview
  channelId: string;
  liveTitle: string;
  liveYoutubeId: string;
  featuredSpeech: {
    title: string;
    speaker: string;
    youtubeId: string;
    thumbnailUrl?: string;
  };
  nextProgram: {
    title: string;
    speaker: string;
    date: string;
    time: string;
    venue: string;
  };
}

export const liveData: LiveConfig = {
  isLive: false, // Default: false (set to true to simulate live streaming)
  channelId: "UC_ISM_ALAPPUZHA_CHANNEL_ID",
  liveTitle: "Annual District Youth Conference — Live from Alappuzha Town Hall",
  liveYoutubeId: "dQw4w9WgXcQ", // Placeholder YouTube live video ID
  featuredSpeech: {
    title: "Grounding Youth in Divine Wisdom & Modern Inquiry",
    speaker: "Dr. Tariq Al-Mansoor",
    youtubeId: "dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop",
  },
  nextProgram: {
    title: "Weekly Qur'an Study Circle (Tafseer Al-Hujurat)",
    speaker: "Dr. Tariq Al-Mansoor",
    date: "Sunday, Oct 4, 2026",
    time: "7:00 PM — 8:30 PM IST",
    venue: "ISM District Center, Alappuzha & YouTube Live",
  },
};
