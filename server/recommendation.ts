import { StudentProfile, Experience } from '../src/types';

export interface MatchResult {
  matchScore: number;
  matchReasons: string[];
  suitabilityExplanation: string;
  highlightOutcomes: string[];
}

// Domain affinity mappings: defines base relevance score (0-30) between engineering branch and specific industry/domains
const INDUSTRY_BRANCH_AFFINITY: Record<string, Record<string, number>> = {
  cse: {
    'cloud computing & artificial intelligence': 30,
    'telecommunications & data centers': 28,
    'enterprise software & cloud platforms': 29,
    'industrial automation & iot': 25,
    'defense technology & autonomous systems': 24,
    'aerospace & space technology': 22,
    'automotive electronics & embedded systems': 21,
    'ports, logistics & renewable energy': 16,
    'automobile & electric vehicles': 15,
    'automobile & ev engineering': 14,
    'heavy engineering & advanced robotics': 15,
    'nuclear engineering & instrumentation': 13,
    'aerospace & precision manufacturing': 12,
    'power systems & high-voltage equipment': 10,
  },
  it: {
    'cloud computing & artificial intelligence': 30,
    'enterprise software & cloud platforms': 30,
    'telecommunications & data centers': 29,
    'industrial automation & iot': 24,
    'defense technology & autonomous systems': 23,
    'aerospace & space technology': 21,
    'automotive electronics & embedded systems': 20,
    'ports, logistics & renewable energy': 16,
    'automobile & electric vehicles': 14,
    'automobile & ev engineering': 13,
    'heavy engineering & advanced robotics': 14,
    'nuclear engineering & instrumentation': 12,
    'aerospace & precision manufacturing': 11,
    'power systems & high-voltage equipment': 9,
  },
  ece: {
    'automotive electronics & embedded systems': 30,
    'telecommunications & data centers': 29,
    'industrial automation & iot': 28,
    'defense technology & autonomous systems': 27,
    'aerospace & space technology': 26,
    'nuclear engineering & instrumentation': 25,
    'power systems & high-voltage equipment': 22,
    'cloud computing & artificial intelligence': 20,
    'automobile & electric vehicles': 21,
    'automobile & ev engineering': 21,
    'heavy engineering & advanced robotics': 22,
    'aerospace & precision manufacturing': 20,
    'enterprise software & cloud platforms': 18,
    'ports, logistics & renewable energy': 16,
  },
  mech: {
    'automobile & electric vehicles': 30,
    'automobile & ev engineering': 30,
    'heavy engineering & advanced robotics': 29,
    'aerospace & precision manufacturing': 29,
    'aerospace & space technology': 28,
    'industrial automation & iot': 24,
    'power systems & high-voltage equipment': 23,
    'ports, logistics & renewable energy': 22,
    'automotive electronics & embedded systems': 21,
    'defense technology & autonomous systems': 22,
    'nuclear engineering & instrumentation': 18,
    'telecommunications & data centers': 12,
    'cloud computing & artificial intelligence': 10,
    'enterprise software & cloud platforms': 9,
  },
  eee: {
    'power systems & high-voltage equipment': 30,
    'nuclear engineering & instrumentation': 29,
    'industrial automation & iot': 28,
    'ports, logistics & renewable energy': 27,
    'automotive electronics & embedded systems': 26,
    'automobile & electric vehicles': 25,
    'automobile & ev engineering': 25,
    'heavy engineering & advanced robotics': 24,
    'aerospace & space technology': 22,
    'telecommunications & data centers': 20,
    'defense technology & autonomous systems': 21,
    'aerospace & precision manufacturing': 19,
    'cloud computing & artificial intelligence': 15,
    'enterprise software & cloud platforms': 12,
  },
  civil: {
    'ports, logistics & renewable energy': 30,
    'heavy engineering & advanced robotics': 25,
    'power systems & high-voltage equipment': 22,
    'aerospace & precision manufacturing': 18,
    'industrial automation & iot': 17,
    'automobile & electric vehicles': 14,
    'aerospace & space technology': 15,
    'defense technology & autonomous systems': 14,
    'telecommunications & data centers': 12,
    'nuclear engineering & instrumentation': 14,
    'cloud computing & artificial intelligence': 10,
    'enterprise software & cloud platforms': 8,
  },
  biomed: {
    'nuclear engineering & instrumentation': 30,
    'automotive electronics & embedded systems': 24,
    'industrial automation & iot': 22,
    'defense technology & autonomous systems': 21,
    'cloud computing & artificial intelligence': 20,
    'aerospace & space technology': 18,
    'enterprise software & cloud platforms': 16,
    'telecommunications & data centers': 14,
    'ports, logistics & renewable energy': 12,
    'power systems & high-voltage equipment': 10,
  },
};

// Branch technical domain keyword vocabulary for semantic syllabus matching
const BRANCH_DOMAIN_KEYWORDS: Record<string, string[]> = {
  cse: [
    'computer',
    'software',
    'cloud',
    'artificial intelligence',
    'ai',
    'data',
    'analytics',
    'telecom',
    '5g',
    'iot',
    'internet of things',
    'cyber',
    'security',
    'network',
    'distributed',
    'algorithm',
    'autonomous',
    'embedded',
    'machine learning',
    'deep learning',
    'microservices',
    'devops',
  ],
  it: [
    'information technology',
    'software',
    'cloud',
    'data',
    'database',
    'telecom',
    '5g',
    'web',
    'enterprise',
    'network',
    'security',
    'analytics',
    'infrastructure',
    'application',
    'it services',
  ],
  ece: [
    'electronics',
    'communication',
    'telecom',
    '5g',
    'embedded',
    'vlsi',
    'iot',
    'signal',
    'sensor',
    'circuit',
    'radar',
    'hardware',
    'semiconductor',
    'instrumentation',
    'robotics',
    'automation',
    'microcontroller',
    'rf',
    'antenna',
    'dsp',
    'fpga',
  ],
  mech: [
    'mechanical',
    'automobile',
    'vehicle',
    'ev',
    'electric vehicle',
    'powertrain',
    'manufacturing',
    'robotics',
    'heavy',
    'precision',
    'aerospace',
    'engine',
    'thermal',
    'cad',
    'cam',
    'automation',
    'hydraulics',
    'assembly',
    'machining',
    'structural',
    'chassis',
    'aerodynamics',
  ],
  eee: [
    'electrical',
    'power',
    'high-voltage',
    'grid',
    'transformer',
    'energy',
    'transmission',
    'generator',
    'substation',
    'nuclear',
    'renewable',
    'battery',
    'switchgear',
    'motor',
    'drives',
    'instrumentation',
    'solar',
  ],
  civil: [
    'civil',
    'structural',
    'construction',
    'infrastructure',
    'port',
    'terminal',
    'geotechnical',
    'environmental',
    'surveying',
    'logistics',
    'transportation',
    'concrete',
    'urban',
    'coastal',
  ],
  biomed: [
    'biomedical',
    'biotechnology',
    'healthcare',
    'medical',
    'instrumentation',
    'radiation',
    'imaging',
    'sensor',
    'diagnostic',
    'nuclear',
    'biological',
    'bioinformatics',
    'radioisotopes',
  ],
};

/**
 * Deterministic string hash utility to produce a stable, 100% mathematical seed
 */
function getDeterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Identifies the normalized branch key from student branch string
 */
function normalizeBranchKey(branch: string): string {
  const b = (branch || '').toLowerCase();
  if (b.includes('computer') || b.includes('cse') || b.includes('comp')) return 'cse';
  if (b.includes('information') || b.includes(' it') || b.startsWith('it')) return 'it';
  if (b.includes('electronics') || b.includes('communication') || b.includes('extc') || b.includes('ece')) return 'ece';
  if (b.includes('mechanical') || b.includes('mech')) return 'mech';
  if (b.includes('electrical') || b.includes('eee')) return 'eee';
  if (b.includes('civil')) return 'civil';
  if (b.includes('biomed') || b.includes('biotech')) return 'biomed';
  return 'cse';
}

/**
 * Calculates a personalized, deterministic, multi-factor recommendation score (0-100%)
 * for a specific student profile and specific trip.
 * 
 * Evaluation factors:
 * 1. Branch & Department Alignment (35% weight)
 * 2. Industry Domain Affinity (25% weight)
 * 3. Syllabus & Learning Outcomes Keyword Density (20% weight)
 * 4. Academic Year & CGPA Merit (10% weight)
 * 5. Experience Type Fit (10% weight)
 */
export function calculatePersonalizedMatch(
  student: StudentProfile,
  exp: Experience,
  isEligible: boolean
): MatchResult {
  const branchKey = normalizeBranchKey(student.branch);
  const keywords = BRANCH_DOMAIN_KEYWORDS[branchKey] || BRANCH_DOMAIN_KEYWORDS.cse;
  const reasons: string[] = [];

  // 1. Branch & Department Alignment (Max 35 pts)
  let branchScore = 0;
  const allowedBranches = exp.eligibility?.allowedBranches || [];

  const isExactBranchListed = allowedBranches.some((b) =>
    b.toLowerCase().includes(student.branch.toLowerCase()) ||
    student.branch.toLowerCase().includes(b.toLowerCase())
  );
  const isPrimaryBranch =
    allowedBranches.length > 0 &&
    (allowedBranches[0].toLowerCase().includes(student.branch.toLowerCase()) ||
      student.branch.toLowerCase().includes(allowedBranches[0].toLowerCase()));

  if (isExactBranchListed) {
    if (isPrimaryBranch) {
      branchScore = 35;
      reasons.push(`Core curriculum priority for ${student.branch}`);
    } else {
      branchScore = 29;
      reasons.push(`Approved target specialization for ${student.branch}`);
    }
  } else if (allowedBranches.length === 0 || allowedBranches.some((b) => b.toLowerCase().includes('all'))) {
    branchScore = 24;
    reasons.push(`Interdisciplinary industrial exposure`);
  } else {
    branchScore = 10;
    reasons.push(`Cross-departmental engineering immersion`);
  }

  // 2. Industry Domain Affinity (Max 25 pts)
  const industryKey = (exp.organizationIndustry || '').toLowerCase().trim();
  const branchAffinities = INDUSTRY_BRANCH_AFFINITY[branchKey] || INDUSTRY_BRANCH_AFFINITY.cse;
  let industryScore = 18; // default moderate affinity

  if (branchAffinities[industryKey] !== undefined) {
    // scale 30 max to 25 max
    industryScore = Math.round((branchAffinities[industryKey] / 30) * 25);
  } else {
    // Partial match in industry text
    for (const [ind, score] of Object.entries(branchAffinities)) {
      if (industryKey.includes(ind) || ind.includes(industryKey)) {
        industryScore = Math.round((score / 30) * 25);
        break;
      }
    }
  }

  // 3. Syllabus & Learning Outcomes Keyword Synergy (Max 20 pts)
  const fullText = [
    exp.title,
    exp.organization,
    exp.organizationIndustry,
    exp.shortDescription,
    exp.detailedDescription,
    ...(exp.whatYouWillLearn || []),
    ...(exp.learningObjectives || []),
  ]
    .join(' ')
    .toLowerCase();

  let matchedKeywordCount = 0;
  const matchedKeywordsList: string[] = [];
  keywords.forEach((kw) => {
    if (fullText.includes(kw.toLowerCase())) {
      matchedKeywordCount++;
      if (matchedKeywordsList.length < 3) {
        matchedKeywordsList.push(kw);
      }
    }
  });

  // Calculate syllabus keyword points (proportional up to 20 pts)
  const syllabusScore = Math.min(20, Math.round((matchedKeywordCount / 5) * 20));
  if (matchedKeywordsList.length > 0) {
    reasons.push(`Strong syllabus overlap in ${matchedKeywordsList.slice(0, 2).map(k => k.toUpperCase()).join(' & ')}`);
  }

  // 4. Academic Standing & Year/Semester Alignment (Max 10 pts)
  let academicScore = 0;
  const allowedYears = exp.eligibility?.allowedYears || [];
  if (allowedYears.length === 0 || allowedYears.includes(student.year)) {
    academicScore += 5;
  }
  if (student.year >= 3) {
    academicScore += 2; // Pre-final/final year readiness
  }
  if (student.cgpa >= 8.5) {
    academicScore += 3;
    reasons.push(`Academic honors standing (${student.cgpa} CGPA)`);
  } else if (student.cgpa >= 7.5) {
    academicScore += 2;
  } else {
    academicScore += 1;
  }

  // 5. Experience Type & Pedagogical Level Fit (Max 10 pts)
  let typeScore = 7;
  if (student.year >= 3) {
    if (exp.experienceType === 'Technical Tours') typeScore = 10;
    else if (exp.experienceType === 'Field Research') typeScore = 9;
    else typeScore = 8;
  } else {
    if (exp.experienceType === 'Industrial Visits') typeScore = 10;
    else if (exp.experienceType === 'Technical Tours') typeScore = 8;
    else typeScore = 7;
  }

  // Sum raw weighted points
  const rawSum = branchScore + industryScore + syllabusScore + academicScore + typeScore;

  // 6. Calculate Final Calibrated Score
  let finalScore: number;
  if (!isEligible) {
    // Ineligible trips get realistic cross-disciplinary scores capped between 35% and 58%
    finalScore = Math.min(58, Math.max(35, Math.round(rawSum * 0.55)));
  } else {
    // Eligible trips get customized, distinct scores calibrated between 62% and 96%
    finalScore = Math.min(96, Math.max(62, rawSum));
  }

  // Generate clear, individualized suitability explanations
  const outcomes = (exp.whatYouWillLearn && exp.whatYouWillLearn.length > 0)
    ? exp.whatYouWillLearn.slice(0, 2)
    : (exp.learningObjectives && exp.learningObjectives.length > 0)
    ? exp.learningObjectives.slice(0, 2)
    : ['Industrial quality and process workflows', 'Enterprise safety standards and operational protocol'];

  const suitability = isEligible
    ? `Tailored for ${student.branch} (Year ${student.year}): Direct exposure to ${exp.organization}'s ${exp.organizationIndustry || 'engineering operations'}, reinforcing Semester ${student.semester} curriculum.`
    : `Cross-disciplinary visit to ${exp.organization} for foundational engineering insights.`;

  return {
    matchScore: finalScore,
    matchReasons: reasons.slice(0, 3),
    suitabilityExplanation: suitability,
    highlightOutcomes: outcomes,
  };
}
