export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  iconName: string;
}

export interface LeadershipMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface ProgramItem {
  id: string;
  title: string;
  category: string;
  description: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  tag: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  title: string;
  chapter: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
