/** Site copy, sourced from sourceoftruthv2.md (Phitsite workspace root).
 *  Voice: cinematic but precise. One register: confident, declarative,
 *  quant-noir. Service and use-case ids are lookup keys for ServiceDrawer
 *  and UseCasesNarrative diagrams; never change them without updating both.
 *
 *  THREE-LAYER CONTENT CONTRACT (home page). Every home section delivers:
 *    L0 `gunshot` — one claim, <=12 words, carries a number or a named
 *       specific. Set at display size. The only thing a scrolling reader is
 *       guaranteed to consume.
 *    L1 `tracer`  — 25-40 words naming the mechanism or the evidence that
 *       makes L0 survivable.
 *    L2 the existing `details` / drawer copy — never rendered on first pass.
 *  `gunshot`/`tracer` are ADDITIVE: /services and /about still read `summary`
 *  and `details`, so their copy is unaffected by home-page edits. */
export const CONTENT = {
  hero: {
    tagline: "Making tomorrow's technology available today",
    description:
      "At Phitopolis, we view global markets as the ultimate intellectual puzzle. As a R&D firm, we create technology and solutions driven by deep insights, modern engineering, and latest trends in Artificial Intelligence.",
    salesPitch: {
      heroLine: {
        title: "THE QUANTITATIVE R&D PARTNER FOR GLOBAL MARKETS",
        subheading:
          "Engineering cloud systems, machine learning, and AI for quantitative finance and financial technology.",
      },
      execSummary:
        "At Phitopolis, we view global markets as the ultimate intellectual puzzle. Operating as a specialized R&D firm, we build cloud-native systems, data science engines, and artificial intelligence solutions for international clients operating in high-complexity environments.",
      capabilities: [
        {
          title: "QUANTITATIVE RESEARCH & AI",
          desc: "Statistical modeling, machine learning, and AI applied to large, noisy, complex financial datasets.",
        },
        {
          title: "PRODUCT & CLOUD ENGINEERING",
          desc: "High-performance systems that run in public and private cloud environments.",
        },
        {
          title: "TECHNICAL SUPPORT & OPERATIONS",
          desc: "Smart, efficient, communicative technical talent operating alongside client teams globally.",
        },
      ],
      pillars: [
        {
          id: "01",
          name: "Research Pillar",
          detail: "Data Science, Machine Learning, AI & High-Dimensional Statistics",
        },
        {
          id: "02",
          name: "Development Pillar",
          detail: "Public & Private Cloud Architecture, Big Data Systems & Software",
        },
        {
          id: "03",
          name: "Support & Delivery Pillar",
          detail: "Dedicated Technical Staff with Superior Communication & Global Operations",
        },
      ],
      positioning: {
        target: "Quantitative Finance, Data Providers & Fintech Leaders",
      },
      differentiators: [
        {
          heading: "Technical Talent",
          body: "Smart, efficient engineers and data scientists with exceptional English communication skills.",
        },
        {
          heading: "International Backing",
          body: "Financed by institutional investors across the United States, Europe, and Hong Kong.",
        },
        {
          heading: "Wall St. & Banking Leadership",
          body: "Led by executives with senior tenure at Morgan Stanley, Merrill Lynch, JPMorgan, Deutsche Bank, and Macquarie Bank.",
        }
      ],
      /**
       * The mission beat's single primary action.
       *
       * `leadershipNote` and the deck's original `cta` lived here for the deck's
       * fourth beat ("Leadership credibility & consultative executive CTA"),
       * which was cut — at which point conversion on this beat was carried only
       * by the navbar Contact button and the footer, i.e. by chrome at the very
       * top and the very bottom of a page whose sales pitch is in the middle.
       * The beat states the claim, so the beat carries the ask.
       *
       * The Wall St. pedigree still lives in `differentiators[2]`, framed as a
       * market advantage rather than a bio.
       */
      cta: { label: "Start a conversation", to: "/contact" },
    },
  },
  /** Home-page section ledes (L0/L1). Chapters 0-2 address the institutional
   *  client; chapter 3 addresses the engineering recruit. `dailyLife` is the
   *  handover between the two voices. */
  ledes: {
    mission: {
      gunshot: "Engineered for high performance and reliability.",
      tracer:
        "We build resilient software and cloud infrastructure designed for complex, high-demand environments.",
    },
    services: {
      gunshot: "Four disciplines. One delivery contract.",
      tracer:
        "Research, platforms, pipelines, and operational support: click any discipline to explore capabilities.",
    },
    reach: {
      gunshot: "Established International Presence",
      tracer: "Arcs denote clients and investors.",
    },
    dailyLife: {
      gunshot: "That is the work. These are the people who do it.",
      tracer:
        "Our culture, our R&D floor, and the ordinary days that produce the things above.",
    },
    careers: {
      gunshot: "Six open roles. One intake a year.",
      tracer:
        "The Technical Graduate Program takes engineers straight into production systems: not a rotation, not a shadowing track.",
    },
    blog: {
      gunshot: "What the team actually did last quarter.",
      tracer:
        "Community work, onboarding weeks, and the occasional office tournament, written by the people who were there.",
    },
  },
  /** Above-the-fold trust signals — investor backing and named partners. */
  trust: {
    backing: "Backed by investors across the USA · Europe · Hong Kong",
    partnersLabel: "In partnership with",
    partners: ["Quantbot Technologies", "CodeWilling"],
  },
  about: {
    title: "About Us",
    body: "The architectural backbone of modern quantitative engineering",
    // "elite investors" → the geography IS the claim. Naming three continents is
    // checkable; "elite" is not, and it dilutes the fact standing next to it.
    sub: "Born where mathematics and modern engineering meet, backed by investors across the USA, Europe, and Hong Kong.",
    /** /about page header — the full company narrative. */
    overline: "Who We Are",
    heading: "An R&D firm, built in Manila for global markets",
    lead: "Built in Manila from international technical expertise, we deliver R&D engineering for demanding global markets.",
  },
  /** The four values Phitopolis is rooted in. */
  principles: {
    values: [
      {
        label: "Integrity",
        definition:
          "We operate with unwavering honesty and transparency in every interaction. Our word is our bond",
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
          "Fewer errors, higher efficiency, and a final product that exceeds expectations, maximizing return on every engagement",
      },
    ],
  },
  /** Proven-impact figures — credibility through outcomes. */
  impact: [
    { value: 100, suffix: "x", label: "Latency improvement", caption: "High-performance pipeline optimization" },
    { value: 8, suffix: "x", label: "Analyst throughput", caption: "Data processing & analytics" },
    { value: 99.4, suffix: "%", label: "Detection accuracy", caption: "Automated QA & monitoring" },
    { value: 10, suffix: "M+", label: "Documents indexed", caption: "Search & knowledge base" },
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
    note: "Our engineers hold professional certifications spanning every cloud and the standards that govern them. The upskilling never stops",
    groups: [
      {
        provider: "Amazon Web Services",
        count: 14,
        items: [
          { name: "Solutions Architect - Professional", logo: "/logos/certs/aws-certs/solutions-architect-pro.webp" },
          { name: "Machine Learning - Specialty", logo: "/logos/certs/aws-certs/machine-learning.webp" },
          { name: "Security - Specialty", logo: "/logos/certs/aws-certs/security.webp" },
          { name: "Data Engineer - Associate", logo: "/logos/certs/aws-certs/data-engineer.webp" },
          { name: "DevOps Engineer - Professional", logo: "/logos/certs/aws-certs/dev-ops-engineer-pro.webp" },
        ],
      },
      {
        provider: "Google Cloud",
        count: 3,
        items: [
          { name: "Cloud Architect - Professional", logo: "/logos/certs/more-certs/google-cloud-architect.webp" },
          { name: "Cloud Engineer - Associate", logo: "/logos/certs/more-certs/google-cloud-engineer.webp" },
          { name: "Generative AI Leader", logo: "/logos/certs/more-certs/google-generative-ai-leader.webp" }
        ],
      },
      {
        provider: "Microsoft Azure",
        count: 4,
        items: [
          { name: "Solutions Architect - Expert", logo: "/logos/certs/more-certs/ms-azure-solutions-architect.webp" },
          { name: "Cybersecurity Architect - Expert", logo: "/logos/certs/more-certs/ms-cybersecurity-architect.webp" },
          { name: "Network Engineer - Associate", logo: "/logos/certs/more-certs/ms-azure-network-engineer.webp" },
        ],
      },
      {
        provider: "Standards & Governance",
        count: 5,
        items: [
          { name: "ISO 27001 Lead Implementer & Auditor", logo: "/logos/certs/iso27001.webp" },
          { name: "PMP - Project Management", logo: "/logos/certs/pmp.webp" },
          { name: "ITIL - Foundation & Practitioner", logo: "/logos/certs/itil.webp" },
          { name: "Red Hat RHCSA", logo: "/logos/certs/redhat.webp" },
          { name: "CFA / CPA", logo: "/logos/certs/cpa.webp" },
        ],
      },
    ],
  },
  services: [
    {
      id: "development",
      title: "Software Engineering",
      gunshot: "High-performance web applications and cloud portals.",
      tracer:
        "We build secure web platforms and real-time dashboards that process large-scale data smoothly and reliably.",
      summary: "Cloud-native web applications and real-time dashboards designed for speed and reliability",
      details:
        "We architect secure web platforms using modern stacks, engineered for enterprise reliability and high availability. Our applications enable teams to visualize complex data and manage operations in real time.",
      techStack: ["TypeScript", "ReactJS", "NodeJS", "GraphQL", "Linux", "Docker", "AWS", "CI/CD"]
    },
    {
      id: "quant-research",
      title: "Quantitative Research",
      gunshot: "Data science, statistical modeling, and machine learning.",
      tracer:
        "We analyze complex datasets and build predictive models using statistical methods and artificial intelligence.",
      summary: "Data analytics and machine learning models built to process large datasets",
      details:
        "Our team processes complex datasets into actionable insights. We build data pipelines and machine learning models that analyze historical trends and real-time inputs with statistical precision.",
      techStack: ["Python", "Machine Learning", "Deep Learning", "Data Analytics"]
    },
    {
      id: "data-science",
      title: "Data Science",
      gunshot: "Automated data pipelines and data architectures.",
      tracer:
        "We design data systems with quality checks at every stage, ensuring engineering and analytics teams work with clean data.",
      summary: "Data pipelines and storage engineered for analytics",
      details:
        "We design automated ETL pipelines and data storage solutions with validation at every step, ensuring all downstream applications receive clean, reliable data.",
      techStack: ["Python", "AWS", "NoSQL", "Postgres", "Docker", "ETL"]
    },
    {
      id: "support",
      title: "Ops Support",
      gunshot: "24/7 technical operations and system monitoring.",
      tracer:
        "Our global engineering teams provide continuous system monitoring and operational support to maintain high uptime.",
      summary: "24/7 global operational continuity and site reliability",
      details:
        "Our global engineering teams monitor and support cloud platforms, data pipelines, and core infrastructure around the clock, proactively resolving issues to ensure continuous uptime.",
      techStack: ["Linux", "UNIX Shell", "Prometheus", "Grafana", "AWS/GCP/Azure"]
    }
  ],
  partnerships: [
    {
      name: "Quantbot Technologies",
      // Was: "elite infrastructure, data science pipelines, and cutting-edge software
      // engineering, so math-driven strategies deploy seamlessly". Strip the three
      // adjectives and the residue was "we give them infrastructure, pipelines and
      // software" — true of every vendor. What is actually specific is WHO they are
      // and WHO inside the firm we build for, so the sentence keeps only that.
      // [VERIFY] A number would make this land — scale of the data, or deploy frequency.
      description:
        "A global quantitative investment adviser. We build the infrastructure, data pipelines, and software their researchers and portfolio managers use to deploy math-driven strategies across global markets"
    },
    {
      name: "CodeWilling",
      // Was: "supercharge our quant pipelines … maximum efficiency and minimal friction",
      // which says the partner's computers make our computers faster. Kept the one
      // concrete thing: what they provide and what it runs.
      // [VERIFY] Scale of the data lakes would replace the deleted adjectives.
      description:
        "Specialists in financial data management and high-performance computing. Their data lakes and compute environments run our quant pipelines over complex financial datasets"
    }
  ],
  /**
   * Rendered on /about as five labelled cards under "Core Competencies".
   *
   * The intensifiers are gone — "Bold", "Proactive", "Seamless". No company would
   * claim the opposite ("Timid Innovation", "Reactive Communication"), so a word
   * nobody would disclaim carries no information and only makes the line read as
   * filler. What is left is at least honest about being a category label.
   *
   * [VERIFY — needs your call, not mine] These are still five abstractions, and
   * stripping adjectives cannot fix that. Each one becomes real only when it names
   * a practice a candidate could observe. The file already asserts one such
   * practice — 24/7 follow-the-sun continuity (see `services` gunshot ":288" and
   * the reach line ":457") — which is the honest replacement for "Teamwork". The
   * others need a fact I do not have, so I have not invented one.
   */
  coreCompetencies: {
    headline: "Core Competencies",
    bridge: "Our principles dictate our behavior. Our competencies define our output. Here is how our values translate into measurable business impact.",
    items: [
      {
        label: "Architectural Foresight",
        rootedIn: "Forward Thinking",
        businessValue: "We engineer cloud infrastructure designed for future scale, ensuring platforms handle massive data loads without breaking."
      },
      {
        label: "Algorithmic Precision",
        rootedIn: "Excellence",
        businessValue: "We convert noisy, high-dimensional datasets into structured models, providing research teams with reliable signals."
      },
      {
        label: "Direct Integration",
        rootedIn: "Integrity",
        businessValue: "Our engineers embed directly with your internal teams, maintaining tight context and velocity on complex deployments."
      },
      {
        label: "High-Performance Engineering",
        rootedIn: "Excellence",
        businessValue: "We ship highly optimized code that satisfies extreme latency requirements, delivering faster execution for critical systems."
      },
      {
        label: "Operational Continuity",
        rootedIn: "Accountability",
        businessValue: "A distributed operational matrix monitors and supports infrastructure around the clock, guaranteeing constant availability."
      }
    ]
  },
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
      role: "Architect our SaaS platforms and the interfaces that sit on top of them",
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
    },
    {
      title: "R&D Internship Program",
      role: "Immersive paid engineering internship for top undergraduate students, working directly on production systems with senior mentorship",
      stack: ["React", "TypeScript", "Node.js", "Python", "Git"]
    }
  ],
  process: [
    { number: "00", label: "Ideas", caption: "The raw potential waiting to be materialized" },
    { number: "01", label: "Discover", caption: "Frame the problem with our partners" },
    { number: "02", label: "Research", caption: "Prototype models against real data" },
    { number: "03", label: "Build", caption: "Engineer production-grade systems" },
    { number: "04", label: "Operate", caption: "Run and support them around the clock" },
    { number: "05", label: "Products", caption: "Materialized ideas shaping the market" }
  ],
  stats: [
    { value: 1, label: "R&D offices" },
    { value: 2, label: "Client regions" },
    { value: 4, label: "Core disciplines" },
    { value: 6, label: "Open roles" }
  ],
  contact: {
    address: "27/F Ecotower Building, 32nd St. cor. 9th Avenue, Bonifacio Global City, Taguig, Philippines, 1634",
    offices: ["Bonifacio Global City, PH"],
    clients: ["United States", "United Kingdom"],
    careersEmail: "jobs@phitopolis.com",
    generalInquiries: "info@phitopolis.com"
  },
  story: {
    title: "Born from the ultimate intellectual puzzle",
    body:
      "Phitopolis began where deep mathematics met modern engineering and cloud. We chose finance not as a legacy sector but as the hardest problem available, and we have been solving it ever since",
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
      blurb: "After office hours, a few colleagues managed to run together around BGC, something we had been planning since our company's Wellness Week"
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
      line: "Deep learning over petabytes of ticks and alternative data, distilled into trading signals for global funds",
      stats: ["US HEDGE FUNDS", "DEEP LEARNING"]
    },
    {
      id: "uc-2",
      title: "Cloud-Native Infrastructure",
      tag: "Full-Stack & Data",
      line: "Event-driven ingestion and processing architectures for petabyte-scale systems",
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
  /**
   * The closing section — rendered by `features/home/components/ClosingShelf`.
   *
   * `statement` used to be the hero tagline verbatim, which meant a reader who made
   * it to the bottom was told the same thing they were told at the top. A close has
   * to resolve the opening, not repeat it: the hero promises tomorrow's technology
   * *today*, and this answers where it is and where it runs.
   *
   * [VERIFY — the number was changed] The brief said "four time zones". The reach map
   * has Manila (HQ), Hong Kong, London, New York and Miami — but Manila and Hong Kong
   * are both UTC+8, and New York and Miami are both US Eastern, so those five cities
   * span THREE zones, not four. Say "four markets" or name the cities if you want a
   * four in the line; "four time zones" is checkable and wrong.
   */
  closing: {
    statement: "A Competitive R&D Firm Always Striving for Excellence",
    farewell: "Join Our Team",
    /** Frames on the shelf, largest first. Order is the render order. */
    shelf: [
      {
        id: "capabilities",
        label: "What we build",
        line: "Four disciplines, one delivery contract: research, engineering, data, and 24/7 operations.",
        href: "/services",
        cta: "See the capabilities",
      },
      {
        id: "journey",
        label: "How we got here",
        line: "Founded in Manila in 2019. Eight chapters from a first small team to the partner clients came back to.",
        href: "/about",
        cta: "Read the journey",
      },
      {
        id: "people",
        label: "Who does the work",
        line: "Engineers and researchers in Manila, working alongside client teams across global markets.",
        href: "/careers",
        cta: "See open roles",
      },
      {
        id: "writing",
        label: "What we published",
        line: "Logs from the team: engineering, platforms, operations, written by the people doing the work.",
        href: "/blog",
        cta: "Read the feed",
      },
    ],
  }
};
