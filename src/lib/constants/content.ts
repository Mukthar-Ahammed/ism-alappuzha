export interface SectionContent {
  id: string;
  heading: string;
  subtitle?: string;
  placeholderText: string;
}

export const navContent = {
  brand: "ISM",
  links: [
    { label: "About", href: "#about" },
    { label: "Leadership", href: "#leadership" },
    { label: "FAQ", href: "#faq" },
    { label: "Media", href: "#media" },
    { label: "Programs", href: "#programs" },
    { label: "Events", href: "#events" },
    { label: "Contact", href: "#footer" },
  ],
  ctaLabel: "Join Us",
  ctaHref: "#join",
};

export const heroContent: SectionContent = {
  id: "hero",
  heading: "Empowering Minds. Elevating Character.",
  subtitle: "An editorial movement grounding campus youth in timeless divine wisdom, critical inquiry, and courageous leadership.",
  placeholderText: "3D scroll-driven Quran & Rehal scene hero canvas.",
};

export const leadershipContent: SectionContent = {
  id: "leadership",
  heading: "Our Leadership",
  subtitle: "Scholarly fellows, directors, and student leaders guiding our movement across campuses.",
  placeholderText: "Leader bio cards and faculty advisor profiles will be displayed here.",
};

export const faqContent: SectionContent = {
  id: "faq",
  heading: "Frequently Asked Questions",
  subtitle: "Answers regarding our membership, governance, campus chapters, and educational mission.",
  placeholderText: "Interactive FAQ accordion items will be loaded here.",
};

export const mediaFeedContent: SectionContent = {
  id: "media",
  heading: "Latest From Us",
  subtitle: "Recent journal publications, video keynotes, and essay series.",
  placeholderText: "Media feed grid with article previews and publication filters.",
};

export const aboutContent: SectionContent = {
  id: "about",
  heading: "About ISM",
  subtitle: "Uniting campus youth in pursuit of truth, academic rigor, and societal transformation.",
  placeholderText: "Foundational story, mission statements, and core philosophical pillars.",
};

export const programsContent: SectionContent = {
  id: "programs",
  heading: "Programs & Initiatives",
  subtitle: "Weekly study circles, leadership academies, and community outreach projects.",
  placeholderText: "Program directory cards with enrollment details and chapter links.",
};

export const eventsContent: SectionContent = {
  id: "events",
  heading: "Upcoming Events",
  subtitle: "Annual leadership summits, regional symposiums, and virtual panel discussions.",
  placeholderText: "Chronological event schedule with RSVP CTAs.",
};

export const testimonialsContent: SectionContent = {
  id: "testimonials",
  heading: "Student Voices",
  subtitle: "Reflections from chapter leads, research fellows, and alumni.",
  placeholderText: "Testimonial quote carousel and chapter spotlight cards.",
};

export const joinCtaContent: SectionContent = {
  id: "join",
  heading: "Be Part of the Revival",
  subtitle: "Start an ISM chapter at your university, join local reading circles, or contribute to our journal.",
  placeholderText: "Membership application form trigger and campus organizer directory.",
};

export const footerContent = {
  id: "footer",
  heading: "Ithihadu Shubbanil Mujahideen",
  description: "An editorial movement uniting students across campuses in pursuit of truth, academic excellence, ethical fortitude, and societal transformation.",
  copyright: "© 2026 Ithihadu Shubbanil Mujahideen. All rights reserved.",
};
