export interface JobPosition {
  id: string;
  title: string;
  type: string; // "Full-Time Fellowship" | "Paid Internship" | "Full-Time"
  category: "Graduate Program" | "Internships" | "Engineering & Quant" | "Cloud & Infrastructure";
  department: string;
  location: string;
  badge: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  stack: string[];
}

export const CAREER_POSITIONS: JobPosition[] = [
  {
    id: "technical-graduate-program",
    title: "Technical Graduate Program",
    type: "Full-Time Fellowship",
    category: "Graduate Program",
    department: "Engineering & Quant R&D",
    location: "BGC Office, Manila (Hybrid Schedule)",
    badge: "GRADUATE FELLOWSHIP",
    summary: "Our premier 12-month paid fellowship for outstanding computer science, engineering, and mathematics graduates. Build distributed financial systems, machine learning pipelines, and low-latency engines alongside senior staff.",
    description: "The Phitopolis Technical Graduate Program is designed to transition exceptional university graduates into software engineers and quantitative researchers. Through hands-on production engineering, 1-on-1 mentorship, and deep architectural exposure, fellows gain experience shipped directly into enterprise platforms globally.",
    responsibilities: [
      "Design, implement, and maintain high-performance software modules and quantitative data pipelines.",
      "Collaborate directly with principal staff engineers on C++, Rust, Python, and TypeScript production stacks.",
      "Participate in daily code reviews, technical architecture spikes, and automated testing rigor.",
      "Deploy cloud infrastructure and event-driven microservices on AWS and GCP.",
    ],
    requirements: [
      "Recent graduate or final-year student in Computer Science, Computer Engineering, Mathematics, Physics, or related STEM fields.",
      "Solid proficiency in at least one modern language: C++, Python, TypeScript, Rust, or Go.",
      "Strong grasp of data structures, algorithms, object-oriented design, and memory management.",
      "Passionate about quantitative finance, distributed systems, or artificial intelligence.",
    ],
    benefits: [
      "Competitive starting salary and annual performance bonuses.",
      "1-on-1 dedicated mentorship with principal staff engineers.",
      "Comprehensive HMO health insurance from Day 1.",
      "Continuous learning stipend for certifications, conferences, and technical books.",
    ],
    stack: ["C++", "Python", "TypeScript", "Linux", "Docker", "AWS"],
  },
  {
    id: "rd-internship-program",
    title: "R&D Internship Program",
    type: "Paid Internship",
    category: "Internships",
    department: "Software & Data Systems",
    location: "BGC Office, Manila (Hybrid Schedule)",
    badge: "PAID INTERNSHIP",
    summary: "Immersive 3 to 6-month paid engineering internship for top undergraduate students. Work directly on production code, receive senior staff mentorship, and earn a direct fast-track offer to our Graduate Program.",
    description: "Our R&D Internship Program gives high-achieving undergraduate students early exposure to enterprise software development. Interns do not work on mock exercises; every intern is integrated into live engineering squads building real financial tools, web applications, and data pipelines.",
    responsibilities: [
      "Build production features for web portals, analytics dashboards, and automated test suites.",
      "Write clean, well-tested code in React, Node.js, Python, or Go under senior guidance.",
      "Present technical findings and completed project deliverables to engineering leadership.",
      "Participate in hackathons, team tech talks, and engineering workshops.",
    ],
    requirements: [
      "Currently enrolled undergraduate student in Computer Science, IT, Engineering, or relevant technical discipline.",
      "Demonstrated programming capability through coursework, personal projects, or open-source contributions.",
      "Curious mindset, strong communication skills, and willingness to learn complex technical concepts.",
      "Available for a 3 to 6-month internship period (full-time or part-time hybrid).",
    ],
    benefits: [
      "Competitive paid internship allowance.",
      "Direct priority fast-track evaluation for our full-time Technical Graduate Program.",
      "1-on-1 mentorship and weekly technical feedback sessions.",
      "Flexible hybrid work environment and modern Manila R&D office access.",
    ],
    stack: ["React", "TypeScript", "Node.js", "Python", "Git"],
  },
  {
    id: "quant-researcher",
    title: "Quantitative Researcher",
    type: "Full-Time",
    category: "Engineering & Quant",
    department: "Quantitative Research",
    location: "BGC Office, Manila (Hybrid Schedule)",
    badge: "QUANT & AI",
    summary: "Hunt for tradeable signals in petabytes of financial market noise using advanced machine learning, deep learning, and statistical modeling.",
    description: "In this role, you will apply mathematical and statistical techniques and engineering software to develop, analyze, and implement models that produce financial trading signals. You will work closely with our hedge fund partner, Quantbot Technologies, analyzing large datasets from diverse global market sources.",
    responsibilities: [
      "Analyze and implement academic research literature to create and refine quantitative investment strategies.",
      "Explore datasets and implement Machine Learning algorithms to produce signals for profitable trading opportunities.",
      "Work closely with our hedge fund partner, Quantbot Technologies, to conduct modeling experiments on complex datasets.",
      "Develop internal quantitative tools used for research and signal backtesting.",
      "Work independently and autonomously to drive high-level investment research.",
    ],
    requirements: [
      "Strong quantitative abilities (degree in a quantitative field such as Math, Physics, CS, Engineering, Stats).",
      "Ability to complete high-level, investment-related research.",
      "Understanding of and ability to implement Machine Learning algorithms (supervised & unsupervised).",
      "Proficiency in developing data-related software in Python.",
      "Willingness to work in the BGC office as per schedule.",
    ],
    benefits: [
      "Competitive quantitative compensation and annual profit-sharing incentive.",
      "Direct exposure to global hedge fund strategies and petabyte-scale market data.",
      "Comprehensive HMO coverage from Day 1.",
      "Access to high-performance GPU clusters and cloud compute.",
    ],
    stack: ["Python", "Deep Learning", "Statistics", "Big Data", "Machine Learning", "Git"],
  },
  {
    id: "software-engineer",
    title: "Systems Software Engineer (C++ / Low Latency)",
    type: "Full-Time",
    category: "Engineering & Quant",
    department: "Core Systems R&D",
    location: "BGC Office, Manila (Hybrid Schedule)",
    badge: "LOW-LATENCY CORE",
    summary: "Build the ultra-low latency backbone of global trading systems, where microseconds decide trading outcomes across international exchanges.",
    description: "You will engage in the development of infrastructure that makes modern data-driven applications in financial services possible. You will enable ingestion, processing, storage, and analytics of financial data at scale, using cloud supercomputing for algorithmic trading.",
    responsibilities: [
      "Implement core system functionality according to agreed high-performance software architecture.",
      "Write production quality code: correct, ultra-performant, maintainable, with high unit test coverage.",
      "Participate in rigorous peer code reviews and architectural discussions.",
      "Support and optimize deployed high-frequency systems and market data pipelines.",
    ],
    requirements: [
      "Experience in writing and debugging high-performance systems applications.",
      "Experience writing production code in systems development languages (C++, Java, Python, Rust, Go).",
      "Knowledgeable in measuring code performance, latency profiling, and memory management.",
      "Must be comfortable working in a Linux terminal environment.",
    ],
    benefits: [
      "Market-leading salary package with performance bonuses.",
      "Hands-on exposure to microsecond-level C++/Rust trading engines.",
      "Full HMO health coverage for employee and dependents.",
      "Relocation and remote work flexibility options.",
    ],
    stack: ["C++", "Rust", "Go", "Python", "Linux", "Performance Profiling"],
  },
  {
    id: "full-stack-developer",
    title: "Full Stack Web Developer",
    type: "Full-Time",
    category: "Engineering & Quant",
    department: "Web & Enterprise SaaS",
    location: "BGC Office, Manila (Hybrid Schedule)",
    badge: "FULL-STACK SAAS",
    summary: "Architect our cloud-native SaaS platforms and responsive user interfaces that display billion-dollar investment portfolios in real time.",
    description: "The primary responsibility of this role is to build and maintain production-level software applications, including responsive user interfaces, reliable backend API services, and high-performance database architectures powering global financial portals.",
    responsibilities: [
      "Understand business needs and translate them into technical specifications.",
      "Build and maintain web applications across the front end and the back end.",
      "Make key architectural decisions on project tech stacks and design patterns.",
      "Design user interfaces that hold to established UX principles.",
      "Configure CI/CD automation pipelines for continuous production delivery.",
    ],
    requirements: [
      "Ability to design software with production-ready software engineering standards.",
      "Proficiency in JavaScript and TypeScript.",
      "Strong skills in JS frameworks, specifically ReactJS, ExpressJS, Apollo, and NestJS.",
      "Knowledge of standard API methodologies such as REST and GraphQL.",
      "Working knowledge with PostgreSQL and MongoDB databases.",
    ],
    benefits: [
      "Competitive salary package with annual appraisal and performance bonuses.",
      "Comprehensive HMO coverage for employee and dependents.",
      "Flexible hybrid working arrangements in BGC Manila.",
      "Company-funded cloud certifications (AWS, Azure, GCP).",
    ],
    stack: ["TypeScript", "React", "GraphQL", "NestJS", "PostgreSQL", "Docker", "CI/CD"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist & Pipeline Engineer",
    type: "Full-Time",
    category: "Engineering & Quant",
    department: "Data Engineering & Analytics",
    location: "BGC Office, Manila (Hybrid Schedule)",
    badge: "DATA LAKES & ETL",
    summary: "Design the ETL pipelines, quality gates, and data lakes that become new trading products for researchers and quantitative traders.",
    description: "In this role, you will use problem-solving skills and software engineering practices to design, develop, and deploy data pipelines and data products for researchers and quantitative traders. You will gain exposure to global market data and automated exchange trading.",
    responsibilities: [
      "Build and optimize ETL environments supporting quantitative research and automated trading.",
      "Implement automated data quality and validation checks for data integrity.",
      "Collaborate with the research team to formulate and deliver valuable financial datasets.",
      "Handle application deployment, data extraction pipelines, and operational support.",
    ],
    requirements: [
      "Prior experience in designing, building, and deploying software solutions.",
      "Proficiency in developing data-related software in Python.",
      "Keen eye for data quality to ensure correct dataset delivery.",
      "Knowledge of Linux, AWS, relational & NoSQL databases, and Docker.",
    ],
    benefits: [
      "Competitive compensation package with growth incentives.",
      "Hands-on experience processing petabytes of market tick data.",
      "Comprehensive medical and HMO benefits.",
      "Mentorship from veteran financial data architects.",
    ],
    stack: ["Python", "ETL", "AWS", "Docker", "SQL / NoSQL", "Linux"],
  },
  {
    id: "devops-engineer",
    title: "DevOps & Cloud SRE Engineer",
    type: "Full-Time",
    category: "Cloud & Infrastructure",
    department: "Site Reliability & Ops",
    location: "BGC Office, Manila (24x7 Shift Environment)",
    badge: "CLOUD & SRE",
    summary: "Keep high-frequency trading systems and cloud platforms running flawlessly around the clock across all global market trading sessions.",
    description: "You will have opportunities in coding, building, testing, releasing, configuring, administering, and monitoring cloud and on-premise infrastructure. You will utilize automation, CI/CD pipelines, and Prometheus/Grafana monitoring to ensure global financial stability.",
    responsibilities: [
      "Operations and support for High-Frequency Trading systems and Financial Market Data Pipelines across AWS/GCP/Azure.",
      "Work with the Development, Data, and Research teams to improve IT operations.",
      "Maintain application services using automation tools and CI/CD pipelines.",
      "Maintain monitoring dashboards using Prometheus, Grafana, and cloud native tools.",
      "Handle incidents affecting application services up to problem management resolution.",
    ],
    requirements: [
      "1-2 years experience supporting Linux environments with strong command line skills.",
      "Fundamental UNIX/Linux knowledge and detail-oriented personality.",
      "Positive attitude and strong willingness to learn complex global systems.",
      "Willingness to work in the BGC office in a 24x7 shift environment.",
    ],
    benefits: [
      "Shift allowance and competitive base salary package.",
      "Comprehensive HMO coverage for employee and family.",
      "Direct hands-on experience managing global AWS/GCP cloud clusters.",
      "Certification sponsorship for AWS, GCP, and Kubernetes.",
    ],
    stack: ["Kubernetes", "CI/CD", "Prometheus", "Grafana", "AWS / GCP", "Linux"],
  },
];
