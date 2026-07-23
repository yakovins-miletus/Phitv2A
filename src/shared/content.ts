/** Site copy, sourced from sourceoftruthv2.md (Phitsite workspace root).
 *  Voice: cinematic but precise. One register: confident, declarative,
 *  quant-noir. Service and use-case ids are lookup keys for ServiceDrawer
 *  and UseCasesNarrative diagrams; never change them without updating both. */
export const CONTENT = {
  hero: {
    tagline: "Making tomorrow's technology available today",
    description:
      "At Phitopolis, we view global markets as the ultimate intellectual puzzle. As a R&D firm, we create technology and solutions driven by deep insights, modern engineering, and the latest in AI trends"
  },
  /** Above-the-fold trust signals — investor backing and named partners. */
  trust: {
    backing: "Backed by investors across the USA · Europe · Hong Kong",
    partnersLabel: "In partnership with",
    partners: ["Quantbot Technologies", "CodeWilling"],
  },
  about: {
    title: "About Us",
    body: "The architectural backbone of modern quantitative finance",
    sub: "Born where deep mathematics and modern engineering meet, backed by elite investors across the USA, Europe, and Hong Kong, we bridge raw human ingenuity and the explosive potential of the AI era",
    /** /about page header — the full company narrative. */
    overline: "Who We Are",
    heading: "A top-tier R&D firm, built in Manila for global markets",
    lead: "Born from Wall Street expertise and built by Manila's elite technology talent, we deliver high-performance R&D engineering for demanding global markets.",
  },
  /** The four values Phitopolis is rooted in. */
  principles: {
    values: [
      {
        label: "Integrity",
        definition:
          "We operate with unwavering honesty and transparency in every interaction — our word is our bond",
        valueToClient:
          "A foundation of trust and predictability: truthful reporting and ethical decisions that reduce risk and keep partnerships stable for the long run",
      },
      {
        label: "Accountability",
        definition:
          "We take full ownership of our commitments and results, standing behind the quality of our output without excuses",
        valueToClient:
          "Reliability and peace of mind: by owning both wins and setbacks, we manage outcomes proactively to hit every milestone",
      },
      {
        label: "Forward Thinking",
        definition:
          "We don't just solve today's problems; we anticipate tomorrow's through innovation and deliberate strategy",
        valueToClient:
          "A competitive edge: a proactive read on technology and market shifts keeps your business resilient and ready to scale",
      },
      {
        label: "Excellence",
        definition:
          "We set the highest standard for performance and continuously refine our process to deliver superior quality",
        valueToClient:
          "Fewer errors, higher efficiency, and a final product that exceeds expectations — maximizing return on every engagement",
      },
    ],
  },
  /** Proven-impact figures — credibility through outcomes. */
  impact: [
    { value: 100, suffix: "x", label: "Latency improvement", caption: "HFT pipeline · 2ms → 18µs" },
    { value: 8, suffix: "x", label: "Analyst throughput", caption: "AI research synthesis" },
    { value: 99.4, suffix: "%", label: "Detection accuracy", caption: "Computer-vision QA" },
    { value: 10, suffix: "M+", label: "Documents indexed", caption: "RAG knowledge base" },
  ],
  /** Where our people come from — education and disciplines, as insight. */
  talent: {
    highlights: [
      { value: 37, suffix: "%", label: "QS Top 1000 educated" },
      { value: 15, suffix: "%", label: "Advanced or international degree" },
      { value: 100, suffix: "%", label: "Equal-opportunity employer" },
    ],
    disciplines: [
      { label: "Computer Science", pct: 45 },
      { label: "Sciences", pct: 12 },
      { label: "Mathematics & Statistics", pct: 10 },
      { label: "Engineering", pct: 10 },
      { label: "Business & Management", pct: 8 },
      { label: "Finance & Economics", pct: 5 },
      { label: "Accountancy", pct: 5 },
    ],
    schools: [
      { name: "U. of the Philippines", abbr: "UP", logo: "/logos/schools/up.png" },
      { name: "Ateneo de Manila", abbr: "ADMU", logo: "/logos/schools/admu.png" },
      { name: "De La Salle", abbr: "DLSU", logo: "/logos/schools/dlsu.png" },
      { name: "Mapúa", abbr: "Mapúa", logo: "/logos/schools/mapua.webp" },
      { name: "U. of Santo Tomas", abbr: "UST", logo: "/logos/schools/ust.webp" },
      { name: "Polytechnic U. of the Philippines", abbr: "PUP", logo: "/logos/schools/pup.webp" },
      { name: "Adamson", abbr: "Adamson", logo: "/logos/schools/adamson.webp" },
      { name: "U. of Mindanao", abbr: "UMind", logo: "/logos/schools/mindanao.webp" },
      { name: "AIM", abbr: "AIM", logo: "/logos/schools/aim.webp" },
      { name: "Brunel", abbr: "Brunel", logo: "/logos/schools/brunel.webp" },
      { name: "Sophia", abbr: "Sophia", logo: "/logos/schools/sophia.webp" },
    ],
  },
  /** Professional certifications, grouped by provider — insight, not a badge wall. */
  certifications: {
    headline: "Certified across the stack",
    note: "Our engineers hold professional certifications spanning every cloud and the standards that govern them — and the upskilling never stops",
    groups: [
      {
        provider: "Amazon Web Services",
        count: 14,
        items: [
          { name: "Solutions Architect — Professional", logo: "/logos/certs/aws-certs/solutions-architect-pro.png" },
          { name: "Machine Learning — Specialty", logo: "/logos/certs/aws-certs/machine-learning.png" },
          { name: "Security — Specialty", logo: "/logos/certs/aws-certs/security.png" },
          { name: "Data Engineer — Associate", logo: "/logos/certs/aws-certs/data-engineer.png" },
          { name: "DevOps Engineer — Professional", logo: "/logos/certs/aws-certs/dev-ops-engineer-pro.png" },
        ],
      },
      {
        provider: "Google Cloud",
        count: 3,
        items: [
          { name: "Cloud Architect — Professional", logo: "/logos/certs/more-certs/google-cloud-architect.webp" },
          { name: "Cloud Engineer — Associate", logo: "/logos/certs/more-certs/google-cloud-engineer.webp" },
          { name: "Generative AI Leader", logo: "/logos/certs/more-certs/google-generative-ai-leader.webp" }
        ],
      },
      {
        provider: "Microsoft Azure",
        count: 4,
        items: [
          { name: "Solutions Architect — Expert", logo: "/logos/certs/more-certs/ms-azure-solutions-architect.webp" },
          { name: "Cybersecurity Architect — Expert", logo: "/logos/certs/more-certs/ms-cybersecurity-architect.webp" },
          { name: "Network Engineer — Associate", logo: "/logos/certs/more-certs/ms-azure-network-engineer.webp" },
        ],
      },
      {
        provider: "Standards & Governance",
        count: 5,
        items: [
          { name: "ISO 27001 Lead Implementer & Auditor", logo: "/logos/certs/iso27001.webp" },
          { name: "PMP — Project Management", logo: "/logos/certs/pmp.webp" },
          { name: "ITIL — Foundation & Practitioner", logo: "/logos/certs/itil.webp" },
          { name: "Red Hat RHCSA", logo: "/logos/certs/redhat.webp" },
          { name: "CFA / CPA", logo: "/logos/certs/cpa.webp" },
        ],
      },
    ],
  },
  services: [
    {
      id: "development",
      title: "Full-Stack Development",
      summary: "Cloud-native platforms that make petabyte-scale systems feel invisible, intuitive, and effortlessly fast",
      details:
        "We architect secure, event-driven SaaS platforms with modern stacks, engineered for enterprise-grade scale and relentless uptime. Flagship work like the OmniDashboard portal lets institutional investors watch billion-dollar portfolios move in real time",
      techStack: ["TypeScript", "ReactJS", "NodeJS", "GraphQL", "Linux", "Docker", "AWS", "CI/CD"]
    },
    {
      id: "quant-research",
      title: "Quantitative Research",
      summary: "Market analysis treated as a strict science: statistics, machine learning, and AI over massive datasets",
      details:
        "Our researchers turn raw, noisy market data into actionable intelligence and trading signals. Pipelines like Project Clairvoyant digest petabytes of historical ticks and alternative data, from satellite imagery to sentiment, to call short-term moves with statistical confidence",
      techStack: ["Python", "Machine Learning", "Deep Learning", "Data Analytics"]
    },
    {
      id: "data-science",
      title: "Data Science",
      summary: "The pipelines and data lakes that fuel financial sciences at petabyte scale",
      details:
        "We design the ETL backbones and data products that researchers and quantitative traders live on, with rigorous quality gates at every stage so that each downstream signal stands on data that can be trusted",
      techStack: ["Python", "AWS", "NoSQL", "Postgres", "Docker", "ETL"]
    },
    {
      id: "support",
      title: "Ops Support",
      summary: "24/7 global operational continuity for high-frequency systems that demand mission-critical uptime",
      details:
        "Our global engineering teams keep high-frequency trading platforms, market-data pipelines, and cloud infrastructure running flawlessly around the clock. An automated SRE matrix with AI-driven anomaly detection catches bottlenecks before clients ever feel them",
      techStack: ["Linux", "UNIX Shell", "Prometheus", "Grafana", "AWS/GCP/Azure"]
    }
  ],
  partnerships: [
    {
      name: "Quantbot Technologies",
      description:
        "A premier global quantitative investment adviser. We arm their researchers and portfolio managers with elite infrastructure, data science pipelines, and cutting-edge software engineering, so math-driven strategies deploy seamlessly across global markets"
    },
    {
      name: "CodeWilling",
      description:
        "Experts in financial data management and high-performance computing. Their specialized data lakes and computing environments supercharge our quant pipelines, processing complex financial datasets with maximum efficiency and minimal friction"
    }
  ],
  culture: [
    "Critical Thinking",
    "Bold Innovation",
    "Proactive Communication",
    "Technical Excellence",
    "Seamless Teamwork"
  ],
  targetCandidates: {
    line: "For talents that outgrow large institutions",
    sub: "Academic rigor. Global stakes",
    description: "We are seeking highly talented individuals who find themselves restricted when working for large institutions and are interested in joining a fast-paced, internationally backed, dynamic team.",
    brochureUrl: "https://phitopolis.com/pdfs/2026%20Technical%20Graduate%20Program.pdf",
  },
  careers: [
    {
      title: "Quantitative Researcher",
      role: "Hunt for signal in petabytes of market noise with advanced machine learning and statistics",
      stack: ["Python", "Deep Learning", "Statistics", "Big Data"]
    },
    {
      title: "Software Engineer",
      role: "Build the ultra-low latency backbone of global trading systems, where microseconds decide outcomes",
      stack: ["C++", "Rust", "Go", "Python", "Linux", "Performance"]
    },
    {
      title: "Full Stack Developer",
      role: "Architect our SaaS platforms and the breathtaking interfaces that sit on top of them",
      stack: ["TypeScript", "React", "GraphQL", "Three.js", "CI/CD"]
    },
    {
      title: "Data Scientist",
      role: "Design the ETL pipelines and data lakes that become new products for researchers and traders",
      stack: ["Python", "ETL", "AWS", "Docker", "SQL / NoSQL"]
    },
    {
      title: "DevOps Engineer",
      role: "Keep high-frequency systems and cloud platforms alive around the clock, across every market session",
      stack: ["Kubernetes", "CI/CD", "Prometheus", "AWS / GCP / Azure"]
    }
  ],
  process: [
    { number: "01", label: "Discover", caption: "Frame the problem with our partners" },
    { number: "02", label: "Research", caption: "Prototype models against real data" },
    { number: "03", label: "Build", caption: "Engineer production-grade systems" },
    { number: "04", label: "Operate", caption: "Run and support them around the clock" }
  ],
  stats: [
    { value: 2, label: "R&D offices" },
    { value: 2, label: "Client regions" },
    { value: 4, label: "Core disciplines" },
    { value: 6, label: "Open roles" }
  ],
  contact: {
    address: "27/F Ecotower Building, 32nd St. cor. 9th Avenue, Bonifacio Global City, Taguig, Philippines, 1634",
    offices: ["Bonifacio Global City, PH", "Clark, PH"],
    clients: ["United States", "United Kingdom"],
    careersEmail: "jobs@phitopolis.com",
    generalInquiries: "info@phitopolis.com"
  },
  story: {
    title: "Born from the ultimate intellectual puzzle",
    body:
      "Phitopolis began where deep mathematics met modern engineering and bleeding-edge cloud. We chose finance not as a legacy sector but as the hardest problem available, and we have been solving it ever since. Our philosophy is continuous reinvention, because in the AI era, standing still is the only losing move",
  },
  /** Insight teasers drawn from the flagship projects in the source of truth. */
  blog: [
    {
      category: "Community & CSR",
      title: "LikhaPolis: Pagbibigay Kulay at Saya",
      blurb: "For the latest CSR day, we, the new interns, were given the responsibility to organize the event, and from that, Project LikhaPolis was born"
    },
    {
      category: "People",
      title: "Ready, Set, School: Brigada Eskwela at Pembo Elementary School",
      blurb: "Our team had the privilege of joining the Brigada Eskwela initiative at Pembo Elementary School, DepEd's annual school maintenance program"
    },
    {
      category: "People",
      title: "2026 Technical Graduate Batch 1 Onboarding Week",
      blurb: "We met our batchmates and future mentors, hyped each other up with group cheers, and then got handed a pile of LEGO bricks with a deceptively tricky challenge"
    },
    {
      category: "People",
      title: "AI Day 2.0: Smarter Systems, Faster Teams",
      blurb: "AI Day 2.0 kicked off the best way possible, with popcorn, juice, and a room full of curious minds ready to explore how AI is shaping the way we work"
    },
    {
      category: "People",
      title: "Sunshine, Stories, and School Kits: A CSR Day to Remember",
      blurb: "There's something truly special about a room full of kindergartners buzzing with excitement! For our latest CSR Day, we got to be right in the middle of it all"
    },
    {
      category: "People",
      title: "Out of Office: Phitopolis Summer 2026",
      blurb: "If summer had a personality, ours would definitely be that one friend who is loud, game for anything, always hungry, and somehow still full of energy"
    },
    {
      category: "People",
      title: "2026 Wellness Week",
      blurb: "After office hours, a few colleagues managed to run together around BGC — something we had been planning since our company's Wellness Week"
    },
    {
      category: "People",
      title: "2024 Technical Graduates Batch 1: Two Years, Milestones of Growth",
      blurb: "It started with iced tea, appetizers, and familiar faces walking in, then quickly turned into a night no one will forget"
    },
    {
      category: "People",
      title: "Game On: Boomerang Fu Brings the Heat (and the Chaos)",
      blurb: "What happens when you take a group of professionals fresh out of a monthly spotlight meeting and arm them with virtual boomerangs? Pure, glorious chaos"
    }
  ],
  useCases: [
    {
      id: "uc-1",
      title: "Algorithmic Signal Generation",
      tag: "Quantitative Finance",
      line: "Deep learning over petabytes of ticks and alternative data, distilled into robust trading signals for global funds",
      stats: ["US HEDGE FUNDS", "DEEP LEARNING"]
    },
    {
      id: "uc-2",
      title: "Cloud-Native Infrastructure",
      tag: "Full-Stack & Data",
      line: "Event-driven ingestion and processing architectures that make petabyte-scale systems feel effortless",
      stats: ["UK CLIENTS", "RAPID ANALYTICS"]
    },
    {
      id: "uc-3",
      title: "High-Frequency Trading Support",
      tag: "DevOps & Support",
      line: "Continuous 24/7 global operational matrix maintains zero-downtime performance across every major trading session",
      stats: ["24/7 GLOBAL CONTINUITY", "ZERO DOWNTIME"]
    }
  ],
  closing: {
    statement: "Making tomorrow's technology available today",
    farewell: "Join Our Team",
  }
};
