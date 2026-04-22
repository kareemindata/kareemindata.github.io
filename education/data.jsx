// data.jsx — content + design tokens for the Education / Journey section.
// Exposed as window.EduData and window.EduTokens.

const TOKENS = {
  bg:         "#0b1120",
  bgDeep:     "#070b16",
  panel:      "rgba(15, 23, 42, 0.72)",
  panelSolid: "#0f172a",
  border:     "rgba(148, 163, 184, 0.12)",
  borderHot:  "rgba(96, 165, 250, 0.55)",
  text:       "#e2e8f0",
  textDim:    "#94a3b8",
  textMuted:  "#64748b",
  accent:     "#60a5fa",
  accentSoft: "#93c5fd",
  accentGlow: "rgba(96, 165, 250, 0.18)",
  accentTint: "rgba(96, 165, 250, 0.07)",
  serif:      `"Fraunces", Georgia, serif`,
  sans:       `"Inter", "Helvetica Neue", system-ui, sans-serif`,
  mono:       `"JetBrains Mono", "SF Mono", Menlo, monospace`,
  radius:     "16px",
  radiusSm:   "10px",
};

const ENTRIES = [
  {
    id: "ottawa",
    index: 1,
    flag: "🇨🇦",
    code: "CA",
    country: "Canada",
    city: "Ottawa",
    lat: 45.4215,
    lng: -75.6972,
    dateRange: "Jan 2022 — Jun 2023",
    program: "M.Eng",
    degree: "M.Eng Data Science & AI",
    institution: "University of Ottawa",
    standing: "A+ · GPA 4.0 / 4.0",
    advisors: "Dr. M. Bolic, Dr. R. Goubran",
    thesis: {
      title: "Production Spoken Language Identification at Scale",
      abstract:
        "A streaming LID system that classifies 96 languages from 3-second audio chunks at 90%+ accuracy with <120ms latency. Deployed to a downstream ASR routing layer serving 40M monthly calls. Contributions: a contrastive pre-training curriculum for low-resource languages, and a calibration head that tempers confidence under code-switching.",
    },
    honors: [
      "Full DEBI Scholarship — Ministry of ICT + Univ. of Ottawa",
      "Top 5% cohort",
    ],
    coursebook: [
      "Deep Learning",
      "NLP & Speech Processing",
      "Probabilistic ML",
      "Reinforcement Learning",
      "Distributed Systems",
      "MLOps & Production ML",
      "Computer Vision",
      "Responsible AI",
    ],
    skills: [
      { name: "PyTorch",                       level: 95 },
      { name: "Speech / Audio ML",             level: 92 },
      { name: "MLOps (Docker, K8s, Triton)",   level: 85 },
      { name: "Distributed training",          level: 80 },
      { name: "Model serving & evals",         level: 80 },
    ],
    takeaway:
      "Built my strongest foundation in ML, deployment, and real-world language systems.",
  },
  {
    id: "cairo",
    index: 2,
    flag: "🇪🇬",
    code: "EG",
    country: "Egypt",
    city: "Cairo",
    lat: 30.0444,
    lng: 31.2357,
    dateRange: "Sep 2016 — Jul 2020",
    program: "B.Sc.",
    degree: "B.Sc. Computer Science & Mathematics",
    institution: "Helwan University",
    standing: "2nd in Class · GPA 3.85 / 4.0",
    advisors: "Dr. A. Hassanien, Dr. S. Tolba",
    thesis: {
      title: "Graph Neural Networks for Citation Recommendation",
      abstract:
        "Designed a heterogeneous graph attention model that recommends citations from a 2.4M-paper corpus using author, venue, and topic edges. Outperformed BM25 and metapath2vec baselines by 18% MRR on a held-out year, with an ablation isolating the contribution of venue-aware attention.",
    },
    honors: [
      "Faculty Excellence Award — three consecutive semesters",
      "Top 2% nationwide CS placement",
    ],
    coursebook: [
      "Linear Algebra & Optimization",
      "Discrete Mathematics",
      "Probability & Statistics",
      "Algorithms & Complexity",
      "Operating Systems",
      "Database Systems",
      "Numerical Methods",
      "Machine Learning Foundations",
      "Compilers",
    ],
    skills: [
      { name: "Mathematical foundations", level: 95 },
      { name: "Algorithm design",         level: 90 },
      { name: "C++ / Systems",            level: 82 },
      { name: "SQL & data modeling",      level: 80 },
    ],
    takeaway:
      "Built the mathematical and computational foundation behind every model I've shipped since.",
  },
  {
    id: "zurich",
    index: 3,
    flag: "🇨🇭",
    code: "CH",
    country: "Switzerland",
    city: "Zurich",
    lat: 47.3769,
    lng: 8.5417,
    dateRange: "Jul — Aug 2023",
    program: "Summer School",
    degree: "Summer School Deep Dive into Blockchain",
    institution: "University of Zurich",
    standing: "Completed with Distinction",
    advisors: "Prof. C. Tessone, Dr. T. Bocek",
    thesis: {
      title: "Trustworthy Federated Learning over Blockchain Coordination",
      abstract:
        "A protocol prototype where federated learning rounds are coordinated by a permissioned chain that attests model updates and slashes free-riders. Evaluated on a 12-node testbed with non-IID medical imaging data, showing convergence within 8% of centralized training.",
    },
    honors: [
      "Distinction — top 10% of cohort",
      "Best Capstone Demo, Decentralized Systems track",
    ],
    coursebook: [
      "Distributed Consensus",
      "Cryptographic Primitives",
      "Smart Contract Engineering",
      "Decentralized Identity",
      "Tokenomics & Mechanism Design",
      "Privacy-Preserving ML",
      "Zero-Knowledge Proofs",
    ],
    skills: [
      { name: "Federated learning",          level: 82 },
      { name: "Decentralized systems",       level: 78 },
      { name: "Cryptography fundamentals",   level: 75 },
      { name: "Solidity & EVM",              level: 70 },
    ],
    takeaway:
      "Expanded my perspective on secure, scalable, cross-domain AI applications.",
  },
];

Object.assign(window, { EduTokens: TOKENS, EduEntries: ENTRIES });
