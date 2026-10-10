export interface Issue {
  id: string;
  title: string;
  month: string;
  year: number;
  summary: string;
  coverImage?: string;
  pdfUrl: string;
  isFeatured?: boolean;
}

export const issuesData: Issue[] = [
  {
    id: "issue-sept-2026",
    title: "Voice of Truth — Youth & Campus Special Edition",
    month: "September",
    year: 2026,
    summary:
      "A comprehensive feature on grounding campus youth in timeless Islamic ethics, intellectual rigor, and active community service in Alappuzha.",
    coverImage: "/images/issues/latest-issue.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isFeatured: true,
  },
  {
    id: "issue-aug-2026",
    title: "TODO: Pillars of Faith & Character",
    month: "August",
    year: 2026,
    summary: "Exploring moral fortitude, academic excellence, and student brotherhood.",
    coverImage: "/images/past issue/p1.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: "issue-jul-2026",
    title: "TODO: Ethical Leadership in the Modern Era",
    month: "July",
    year: 2026,
    summary: "Guidelines for youth organizers and campus leaders across Kerala.",
    coverImage: "/images/past issue/p2.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: "issue-jun-2026",
    title: "TODO: The Quest for Authentic Knowledge",
    month: "June",
    year: 2026,
    summary: "Reflections on Qur'anic worldview, classical texts, and contemporary science.",
    coverImage: "/images/past issue/p3.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: "issue-may-2026",
    title: "TODO: Community Service & Environmental Ethics",
    month: "May",
    year: 2026,
    summary: "ISM Alappuzha district relief initiatives and green campus campaigns.",
    coverImage: "/images/past issue/p5.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: "issue-apr-2026",
    title: "TODO: Ramadan Reflection & Spiritual Renewal",
    month: "April",
    year: 2026,
    summary: "Special issue dedicated to fasting, night prayers, and internal purification.",
    coverImage: "/images/past issue/p6.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: "issue-mar-2026",
    title: "TODO: Heritage & History of Kerala Muslims",
    month: "March",
    year: 2026,
    summary: "Historical essay series on early Islamic trade and scholarly traditions in Alappuzha.",
    coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
];
