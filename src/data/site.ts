export interface SiteConfig {
  name: string;
  organization: string;
  tagline: string;
  description: string;
  district: string;
  state: string;
  logo: string;
  contact: {
    address: string;
    phone: string;
    email: string;
  };
  socials: {
    youtube: string;
    instagram: string;
    facebook: string;
    whatsapp: string;
  };
  navLinks: Array<{ label: string; href: string }>;
  weekStartsOn?: "Sunday" | "Monday";
}

export const siteData: SiteConfig = {
  name: "ISM Alappuzha",
  organization: "Islamic Students Movement — Alappuzha District Committee",
  tagline: "Learn. Practise. Serve.",
  description:
    "Grounding youth across Alappuzha district in authentic Islamic knowledge, ethical practice, and courageous community leadership.",
  district: "Alappuzha",
  state: "Kerala",
  logo: "/images/logo/ism-logo.png",
  contact: {
    address: "ISM District Center, Near Zilla Court Bridge, Alappuzha, Kerala 688001",
    phone: "+91 98470 00000",
    email: "info@ismalappuzha.org",
  },
  socials: {
    youtube: "https://youtube.com/@ismalappuzha",
    instagram: "https://instagram.com/ism_alappuzha",
    facebook: "https://facebook.com/ismalappuzha",
    whatsapp: "https://whatsapp.com/channel/ismalappuzha",
  },
  navLinks: [
    { label: "Videos", href: "/#videos" },
    { label: "Issue", href: "/#issue" },
    { label: "Namaz", href: "/#namaz" },
    { label: "Dhikr & Dua", href: "/#dhikr" },
    { label: "Q&A", href: "/#qna" },
    { label: "Leaders", href: "/#leaders" },
  ],
  weekStartsOn: "Sunday",
};
