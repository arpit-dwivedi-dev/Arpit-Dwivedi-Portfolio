export const NAV_LINKS = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Experience', href: '#experience' },
  { name: 'Projects', href: '#projects' },
  { name: 'Contact', href: '#contact' },
];

export const TECH_STACK = {
  frontend: ['Angular', 'RxJS', 'NgRx', 'Angular Material', 'TypeScript', 'React', 'Tailwind CSS'],
  backend: ['Node.js', 'Express.js', 'REST APIs', 'Microservices', 'Socket.io'],
  database: ['MongoDB', 'MySQL', 'Redis', 'PostgreSQL'],
  devops: ['Docker', 'CI/CD', 'GitHub Actions', 'VPS', 'Nginx', 'AWS'],
  testing: ['Jest', 'Puppeteer', 'Lighthouse', 'TDD'],
};

export const EXPERIENCE = [
  {
    company: 'Altos Global Services',
    role: 'Full-stack Developer',
    period: '2023 – Present',
    description: 'Leading full-stack development and AI integration. Architecting scalable API solutions and managing a team of developers.',
    highlights: ['AI integration (OpenAI, LLaMA Parse)', 'Team leadership', 'API architecture'],
  },
  {
    company: 'Appinventiv',
    role: 'Angular Specialist',
    period: '2022 – 2023',
    description: 'Focused on Angular specialization, UI/UX improvements, and robust testing using Jest and TDD principles.',
    highlights: ['Angular performance tuning', 'UI/UX optimization', 'Unit testing (Jest)'],
  },
  {
    company: 'Freelancer',
    role: 'Web Developer',
    period: '2021',
    description: 'Delivered high-quality client projects, focusing on static websites and responsive design.',
    highlights: ['Client-based delivery', 'Responsive design', 'SEO optimization'],
  },
];

export const PROJECTS = [
  {
    title: 'ROR Document System',
    subtitle: 'Healthcare AI Platform',
    description: 'A flagship AI-powered document management system for healthcare, handling massive PDF datasets with extreme efficiency.',
    metrics: [
      { label: 'PDF Pages', value: '20,000+' },
      { label: 'Performance', value: '99.9% ↑' },
      { label: 'Automation', value: '95%' },
    ],
    tags: ['Angular', 'Node.js', 'OCR', 'AI', 'Performance'],
    featured: true,
  },
  {
    title: 'QME Panel',
    description: 'Healthcare analytics dashboard providing deep insights into medical evaluations and panel management.',
    tags: ['Angular', 'Node.js', 'D3.js', 'MongoDB'],
    metrics: [{ label: 'Modules', value: '10+' }],
  },
  {
    title: 'HRMS System',
    description: 'Comprehensive Human Resource Management System with over 25 integrated modules for enterprise use.',
    tags: ['MEAN Stack', 'Microservices', 'Redis'],
    metrics: [{ label: 'Modules', value: '25+' }],
  },
  {
    title: 'NGO Website',
    description: 'Highly responsive and SEO-friendly platform for a non-profit organization to boost their digital presence.',
    tags: ['React', 'Tailwind', 'SEO'],
    metrics: [{ label: 'SEO Score', value: '100' }],
  },
];

export const IMPACT_METRICS = [
  { label: 'PDF Load Optimization', value: '99.9%' },
  { label: 'AI Automation', value: '95%' },
  { label: 'Modules Delivered', value: '15+' },
  { label: 'Team Leadership', value: '3 Members' },
  { label: 'Cost Savings', value: '₹10–15L' },
];
