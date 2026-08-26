export interface NavSectionItem {
  to: string;
  label: string;
  sub: string;
  preview: string;
  tag: string;
}

export const MEGA_NAV_ITEMS: NavSectionItem[] = [
  {
    to: "/",
    label: "Home",
    sub: "Signal Core & High-Performance Platforms",
    preview: "/images/software-engineer-banner.webp",
    tag: "01",
  },
  {
    to: "/about",
    label: "About",
    sub: "Who We Are, Principles & Manila R&D Firm",
    preview: "/images/AboutPageHero.webp",
    tag: "02",
  },
  {
    to: "/services",
    label: "Services",
    sub: "Full-Stack, Quant Research, Data & SRE Ops",
    preview: "/images/quant-research-banner.webp",
    tag: "03",
  },
  {
    to: "/careers",
    label: "Careers",
    sub: "Graduate Fellowships & Paid R&D Internships",
    preview: "/images/grads/FocusedProgramming.webp",
    tag: "04",
  },
  {
    to: "/blog",
    label: "Blog",
    sub: "Engineering Research & Tech Articles",
    preview: "/images/ops-support-banner.webp",
    tag: "05",
  },
  {
    to: "/contact",
    label: "Contact",
    sub: "BGC Manila R&D Office",
    preview: "/images/bgc-2.webp",
    tag: "06",
  },
];
