export interface JobDetail {
  id: string;
  title: string;
  role: string;
  overview: string;
  stack: string[];
  location: string;
  type: string;
  applyUrl: string;
  responsibilities: string[];
  requirements: string[];
  // Not every position has curated "desirable skills" copy — omit rather than invent.
  desirable?: string[];
}

export const JOB_DETAILS: Record<string, JobDetail> = {
  "Quantitative Researcher": {
    id: "quant-researcher",
    title: "Quantitative Researcher",
    role: "Hunt for signal in petabytes of market noise with advanced machine learning and statistics",
    overview:
      "In this role, you will apply mathematical and statistical techniques and engineering software to develop, analyze, and implement models to produce financial trading signals. The team is mainly focused on Data Science projects, analyzing large datasets from diverse sources of data.",
    stack: ["Python", "Deep Learning", "Statistics", "Big Data", "Machine Learning", "Git"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Analyze and implement academic research and practitioner literature to create and refine investment strategies",
      "Explore datasets and implement Machine Learning algorithms to produce signals for profitable trading opportunities",
      "Work closely with our hedge fund partner, Quantbot Technologies, to conduct modeling experiments on complex datasets",
      "Develop internal quantitative tools used for research and signal backtesting",
      "Work independently and autonomously to drive high-level investment research",
    ],
    requirements: [
      "Strong quantitative abilities — must possess a degree in a quantitative field (Math, Physics, CS, Engineering, Stats)",
      "Ability to complete high-level, investment-related research",
      "Understanding of and ability to implement Machine Learning algorithms (supervised & unsupervised)",
      "Proficiency in developing data-related software in Python",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Experience with Deep Learning algorithms and neural network architectures",
      "Familiarity with investment products (equities & derivatives) and portfolio construction analytics",
      "Proficiency in source control tools and collaborative development (Git)",
      "Knowledge of Python software engineering tools (unit testing, documentation frameworks)",
      "Capability to design and implement research software from scratch",
    ],
  },
  "Software Engineer": {
    id: "software-engineer",
    title: "Software Engineer",
    role: "Build the ultra-low latency backbone of global trading systems, where microseconds decide outcomes",
    overview:
      "You will engage in the development of infrastructure that makes modern data-driven applications in financial services possible. You will enable ingestion, processing, storage, and analytics of virtually unlimited amounts of financial data, harnessing cloud supercomputing for algorithmic trading.",
    stack: ["C++", "Rust", "Go", "Python", "Linux", "Performance", "FPGA"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Implement core system functionality according to agreed high-performance software architecture",
      "Write production quality code: correct, ultra-performant, maintainable, with high unit test coverage",
      "Participate in rigorous peer code reviews and architectural discussions",
      "Support and optimize deployed high-frequency systems and market data pipelines",
    ],
    requirements: [
      "Experience in writing and debugging high performance systems applications",
      "Experience writing production code in systems development languages (C++, Java, Python, Rust, Go)",
      "Knowledgeable in measuring code performance, latency profiling, and memory management",
      "Must be comfortable working in a Linux terminal environment",
      "Good verbal and written communication skills and commitment to deadlines",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Prior experience writing production code in C++, Rust, or Go",
      "Experience programming hardware accelerators or FPGAs",
      "Works effectively with a team, speaks mind, and contributes to design choices",
      "Enjoys creating ultra-low latency engineering products",
      "Experience acting on client feedback to continuously refine software",
    ],
  },
  "Full Stack Developer": {
    id: "full-stack-developer",
    title: "Full Stack Developer",
    role: "Architect our SaaS platforms and the interfaces that sit on top of them",
    overview:
      "The primary responsibility of this role is to build and maintain production-level software applications, including responsive user interfaces, reliable backend API services, and high-performance database architectures.",
    stack: ["TypeScript", "React", "GraphQL", "NestJS", "PostgreSQL", "MongoDB", "CI/CD"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Understand business needs and translate them into technical specifications",
      "Build and maintain web applications across the front end and the back end",
      "Make key architectural decisions on project tech stacks and design patterns",
      "Design user interfaces that hold to established UX principles",
      "Configure CI/CD automation pipelines for continuous production delivery",
      "Collaborate with cross-functional agile teams",
    ],
    requirements: [
      "Ability to design software with production-ready software engineering standards",
      "Proficiency in JavaScript and TypeScript",
      "Strong skills in JS frameworks, specifically ReactJS, ExpressJS, Apollo, and NestJS",
      "Knowledge of standard API methodologies such as REST and GraphQL",
      "Working knowledge with PostgreSQL and MongoDB databases",
      "Ability to navigate in a Linux environment and familiarity with CI/CD",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Proficiency in Python and Docker containerization",
      "Hands-on experience working with event-driven architectures",
      "Ability to navigate the AWS cloud ecosystem",
      "Ability to architect full-stack greenfield projects from scratch",
      "Knowledge of mitigating cloud security vulnerabilities",
    ],
  },
  "Data Scientist": {
    id: "data-scientist",
    title: "Data Scientist",
    role: "Design the ETL pipelines and data lakes that become new products for researchers and traders",
    overview:
      "In this role, you will use problem-solving skills and software engineering practices to design, develop, and deploy data pipelines and data products for researchers and quantitative traders. You will gain exposure to global market data and automated exchange trading.",
    stack: ["Python", "ETL", "AWS", "Docker", "SQL / NoSQL", "Linux", "Data Integrity"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Build and optimize ETL environments supporting quantitative research and automated trading",
      "Implement automated data quality and validation checks for data integrity",
      "Collaborate with the research team to formulate and deliver valuable financial datasets",
      "Handle application deployment, data extraction pipelines, and operational support",
    ],
    requirements: [
      "Prior experience in designing, building, and deploying software solutions",
      "Proficiency in developing data-related software in Python",
      "Keen eye for data quality to ensure correct dataset delivery",
      "Knowledge of Linux, AWS, relational & NoSQL databases, and Docker",
      "Willingness to learn new technologies and financial market domains",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Strong knowledge in object-oriented concepts, data structures, and algorithms",
      "Hands-on experience building complex data pipelines and ETL solutions",
      "Existing experience working in high-performing team environments",
    ],
  },
  "DevOps Engineer": {
    id: "devops-engineer",
    title: "DevOps Engineer",
    role: "Keep high-frequency systems and cloud platforms alive around the clock, across every market session",
    overview:
      "You will have opportunities in coding, building, testing, releasing, configuring, administering, and monitoring cloud and on-premise infrastructure. You will utilize automation, CI/CD pipelines, and Prometheus/Grafana monitoring to ensure global financial stability.",
    stack: ["Kubernetes", "CI/CD", "Prometheus", "Grafana", "AWS / GCP / Azure", "Linux"],
    location: "BGC Office (24x7 Shift Environment)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Operations and support for High-Frequency Trading systems and Financial Market Data Pipelines across AWS/GCP/Azure",
      "Work with the Development, Data, and Research teams to improve IT operations",
      "Maintain application services using automation tools and CI/CD pipelines",
      "Ensure stability and support for all in-scope applications, executing BAU requests and runbook procedures",
      "Maintain monitoring dashboards using Prometheus, Grafana, and cloud native tools",
      "Handle incidents affecting application services up to problem management resolution",
    ],
    requirements: [
      "1-2 years experience supporting Linux environments with strong command line skills",
      "Fundamental UNIX/Linux knowledge and detail-oriented personality",
      "Positive attitude and strong willingness to learn complex global systems",
      "Good verbal and written communication skills",
      "Willingness to work in the BGC office in a 24x7 shift environment",
    ],
    desirable: [
      "Work experience in a global financial institution or tech start-up",
      "Work experience using cloud providers, preferably AWS",
      "Experience in Shell scripting and Python programming",
      "Root cause analysis skills and ability to suggest software improvements",
    ],
  },
  // Sourced from CAREER_POSITIONS["technical-graduate-program"] in careersData.ts.
  // That entry has no "desirable skills" list (only benefits/compensation, which
  // isn't the same thing) — desirable is left unset rather than invented.
  "Technical Graduate Program": {
    id: "technical-graduate-program",
    title: "Technical Graduate Program",
    role: "Our premier 12-month paid fellowship for outstanding computer science, engineering, and mathematics graduates",
    overview:
      "The Phitopolis Technical Graduate Program is designed to transition exceptional university graduates into software engineers and quantitative researchers. Through hands-on production engineering, 1-on-1 mentorship, and deep architectural exposure, fellows gain experience shipped directly into enterprise platforms globally.",
    stack: ["C++", "Python", "TypeScript", "Linux", "Docker", "AWS"],
    location: "BGC Office, Manila (Hybrid Schedule)",
    type: "Full-Time Fellowship",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Design, implement, and maintain high-performance software modules and quantitative data pipelines",
      "Collaborate directly with principal staff engineers on C++, Rust, Python, and TypeScript production stacks",
      "Participate in daily code reviews, technical architecture spikes, and automated testing rigor",
      "Deploy cloud infrastructure and event-driven microservices on AWS and GCP",
    ],
    requirements: [
      "Recent graduate or final-year student in Computer Science, Computer Engineering, Mathematics, Physics, or related STEM fields",
      "Solid proficiency in at least one modern language: C++, Python, TypeScript, Rust, or Go",
      "Strong grasp of data structures, algorithms, object-oriented design, and memory management",
      "Passionate about quantitative finance, distributed systems, or artificial intelligence",
    ],
  },
  "R&D Internship Program": {
    id: "rd-internship-program",
    title: "R&D Internship Program",
    role: "Immersive paid engineering internship for top undergraduate students, working directly on production systems with senior mentorship",
    overview:
      "Our R&D Internship Program gives high-achieving undergraduate students early exposure to enterprise software development. Interns do not work on mock exercises — every intern is integrated into live engineering squads building real financial tools, web applications, and data pipelines.",
    stack: ["React", "TypeScript", "Node.js", "Python", "Git"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Paid Internship",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Build production features for web portals, analytics dashboards, and automated test suites",
      "Write clean, well-tested code in React, Node.js, Python, or Go under senior guidance",
      "Present technical findings and completed project deliverables to engineering leadership",
      "Participate in hackathons, team tech talks, and engineering workshops",
    ],
    requirements: [
      "Currently enrolled undergraduate student in Computer Science, IT, Engineering, or relevant technical discipline",
      "Demonstrated programming capability through coursework, personal projects, or open-source contributions",
      "Curious mindset, strong communication skills, and willingness to learn complex technical concepts",
      "Available for a 3 to 6-month internship period (full-time or part-time hybrid)",
    ],
    desirable: [
      "Familiarity with containerization tools (Docker) and basic Linux command line",
      "Experience with relational databases (SQL) and Git version control",
      "Existing open-source project contributions or participation in programming competitions",
    ],
  },
};
