import {
  NavLink,
  SocialLink,
  LeadershipMember,
  ProgramItem,
  EventItem,
  TestimonialItem,
  FAQItem,
} from "@/lib/types";

export const SITE_CONFIG = {
  name: "Ithihadu Shubbanil Mujahideen",
  shortName: "ISM",
  tagline: "Intellectual Vitality & Spiritual Guidance for the Next Generation",
  description:
    "An editorial movement uniting students across campuses in pursuit of truth, academic excellence, ethical fortitude, and societal transformation.",
  contactEmail: "contact@ism.org.in",
  copyrightYear: 2026,
};

export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Leadership", href: "#leadership" },
  { label: "Events", href: "#events" },
  { label: "Media Feed", href: "#media" },
  { label: "FAQ", href: "#faq" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: "Twitter / X", url: "https://x.com/ism_movement", iconName: "twitter" },
  { platform: "Instagram", url: "https://instagram.com/ism_official", iconName: "instagram" },
  { platform: "YouTube", url: "https://youtube.com/@ism_media", iconName: "youtube" },
  { platform: "LinkedIn", url: "https://linkedin.com/company/ism-movement", iconName: "linkedin" },
];

export const HERO_COPY = {
  eyebrow: "Ithihadu Shubbanil Mujahideen",
  title: "Empowering Minds. Elevating Character.",
  subtitle:
    "An editorial movement grounding campus youth in timeless divine wisdom, critical inquiry, and courageous leadership.",
  ctaPrimary: "Explore Our Vision",
  ctaSecondary: "Join the Movement",
};

export const LEADERSHIP_MEMBERS: LeadershipMember[] = [
  {
    id: "pres",
    name: "Dr. Tariq Al-Mansoor",
    role: "President & Senior Fellow",
    bio: "Focuses on Islamic epistemologies and student engagement across universities.",
    image: "/images/leadership/tariq.jpg",
  },
  {
    id: "gen-sec",
    name: "Aisha Rahmani",
    role: "General Secretary",
    bio: "Leads organizational strategy, campus initiatives, and youth leadership forums.",
    image: "/images/leadership/aisha.jpg",
  },
  {
    id: "edu-dir",
    name: "Bilal Siddiqui",
    role: "Director of Educational Affairs",
    bio: "Curates seminars, research publications, and scholarly exchange programs.",
    image: "/images/leadership/bilal.jpg",
  },
];

export const PROGRAMS: ProgramItem[] = [
  {
    id: "p1",
    title: "Campus Intellectual Circles",
    category: "Academic & Thought",
    description:
      "Weekly reading circles addressing philosophy, ethical dilemmas, and modern Islamic discourse.",
  },
  {
    id: "p2",
    title: "Youth Leadership Academy",
    category: "Mentorship",
    description:
      "Intensive seasonal retreats fostering public speaking, organizational governance, and civic responsibility.",
  },
  {
    id: "p3",
    title: "Community Action & Outreach",
    category: "Social Impact",
    description:
      "Student-driven social equity projects, literacy campaigns, and humanitarian relief efforts.",
  },
];

export const EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Annual Student Leadership Summit 2026",
    date: "October 14-16, 2026",
    location: "Main Auditorium, Central Campus",
    tag: "Conference",
  },
  {
    id: "e2",
    title: "Symposium on Faith & Modern Science",
    date: "November 5, 2026",
    location: "Online / Hybrid",
    tag: "Symposium",
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t1",
    quote:
      "ISM provided the intellectual grounding and spiritual clarity I needed during my university years. It shaped not just my career, but my worldview.",
    author: "Zayd Hashmi",
    title: "Alumnus & Research Scholar",
    chapter: "Oxford Chapter",
  },
  {
    id: "t2",
    quote:
      "A rare space where academic rigor meets uncompromised faith. ISM encourages students to think deeply and act courageously.",
    author: "Fatima Noor",
    title: "Student Lead",
    chapter: "State Chapter",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "f1",
    question: "What is the core mission of the Ithihadu Shubbanil Mujahideen?",
    answer:
      "ISM aims to cultivate an intellectually vibrant, morally grounded generation of student leaders who excel academically while actively serving their communities with Islamic principles.",
  },
  {
    id: "f2",
    question: "Who can join ISM?",
    answer:
      "ISM is open to all university and high school students who resonate with our mission of academic excellence, ethical development, and community leadership.",
  },
  {
    id: "f3",
    question: "How does ISM support campus chapters?",
    answer:
      "We provide starter toolkits, speaker grants, educational syllabi, leadership training, and national networking opportunities for student organizers.",
  },
];
