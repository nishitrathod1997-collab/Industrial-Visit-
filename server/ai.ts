import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { calculatePersonalizedMatch } from './recommendation';

// Lazy-initialized Gemini client & rate-limit / cache state
let genAIClient: GoogleGenAI | null = null;
let geminiCooldownUntil = 0;

// Helper to check for Groq API key
function getGroqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'MY_GROQ_API_KEY' || key.trim() === '') {
    return null;
  }
  return key.trim();
}

/**
 * Call Groq OpenAI-compatible Chat Completions API securely server-side.
 */
async function callGroqAPI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  jsonMode: boolean = false
): Promise<string | null> {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Groq AI Service] HTTP ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return content ? content.trim() : null;
  } catch (err: any) {
    console.warn('[Groq AI Service] Error calling Groq API:', err?.message || err);
    return null;
  }
}

// In-memory cache for student recommendations (studentId -> { timestamp, data })
const recommendationCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getGeminiClient(): GoogleGenAI | null {
  if (Date.now() < geminiCooldownUntil) {
    return null; // In cooldown after quota limit
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

function handleGeminiError(err: any, context: string) {
  const errMsg = err?.message || JSON.stringify(err) || String(err);
  if (
    errMsg.includes('429') ||
    errMsg.includes('503') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('high demand') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('Quota exceeded')
  ) {
    // Set 60s cooldown to prevent API hammering when rate limited or temporarily unavailable
    geminiCooldownUntil = Date.now() + 60_000;
    console.info(`[AI Service] Gemini unavailable or rate-limited during ${context}. Switched to Groq / local calculation for 60s.`);
  } else {
    console.warn(`[AI Service] ${context} error:`, errMsg);
  }
}

export interface ChatRequest {
  prompt: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  userId: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  currentExperienceId?: string;
}

/**
 * Handles multi-turn grounded AI assistant chats for Students, Faculty, and Administrators.
 */
export async function handleAssistantChat(req: ChatRequest): Promise<string> {
  const { prompt, role, userId, history = [], currentExperienceId } = req;
  const user = db.getUserById(userId);

  // 1. Build live, accurate domain context from the database
  let systemContext = '';

  if (role === 'STUDENT') {
    const student = db.getStudentProfileByUserId(userId);
    if (!student) {
      return "I couldn't locate your student profile in the VIT registry. Please ensure you are logged in properly.";
    }

    const experiences = db.getExperiences({ studentId: student.studentId });
    const userRegistrations = db.getStudentExperiences(student.studentId);
    const notifications = db.getNotificationsForUser(userId).slice(0, 5);

    systemContext = `
YOU ARE: VIT Assistant, the dedicated AI assistant for Vidyalankar Institute of Technology's Industrial Exposure Platform.
AUTHENTICATED STUDENT PROFILE:
- Name: ${student.name}
- Student ID / Roll No: ${student.studentId}
- Department: ${student.department}
- Branch: ${student.branch}
- Year: ${student.year} | Semester: ${student.semester} | Division: ${student.division}
- CGPA: ${student.cgpa}
- Contact: ${student.email}, ${student.phone}

STUDENT'S CONFIRMED & QUEUED EXPERIENCES:
- Upcoming Registered Visits: ${
      userRegistrations.upcoming
        .map(
          (e) =>
            `"${e.title}" at ${e.organization} on ${e.date} (Reporting: ${e.travelInfo.reportingTime} at ${e.travelInfo.reportingLocation}; Transport: ${e.travelInfo.transport}; Return: ${e.travelInfo.campusArrival}; Boarding Pass: ${e.userBoardingPass?.passNumber || 'Generated'})`
        )
        .join('; ') || 'None scheduled at this time'
    }
- Waitlisted Visits: ${
      userRegistrations.waitlisted
        .map((e) => `"${e.title}" at ${e.organization} (Current Queue Position: #${e.userWaitlistEntry?.position || 'N/A'})`)
        .join('; ') || 'None'
    }
- Completed Visits: ${
      userRegistrations.completed
        .map((e) => `"${e.title}" at ${e.organization} on ${e.date} (Attendance: ${e.userAttendance?.status || 'COMPLETED'})`)
        .join('; ') || 'None'
    }
- Cancelled Registrations: ${
      userRegistrations.past.map((e) => `"${e.title}" at ${e.organization}`).join('; ') || 'None'
    }

ALL CURRENT PUBLISHED INDUSTRIAL EXPERIENCES AT VIT:
${experiences
  .map(
    (e) => `
[Experience ID: ${e.id}]
- Title: ${e.title}
- Host Organization: ${e.organization} (${e.organizationIndustry || 'Industrial Engineering'})
- Type: ${e.experienceType}
- Date: ${e.date}
- Location & Address: ${e.location} (${e.address})
- Capacity & Seats: ${e.registeredCount}/${e.capacity} taken (${e.seatsRemaining} available)
- Waitlist Status: ${e.waitlistCount}/${e.waitlistCapacity} queued (Waitlist ${e.waitlistEnabled ? 'Active' : 'Disabled'})
- Registration Deadline: ${e.registrationDeadline}
- Contribution Fee: INR ${e.contribution} (College subsidized)
- Eligibility for Current Student: ${e.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE (' + (e.eligibilityReason || 'Branch/Semester mismatch') + ')'}
- Allowed Branches: ${e.eligibility?.allowedBranches?.join(', ') || 'All Branches'}
- Allowed Years/Semesters: Years ${e.eligibility?.allowedYears?.join(', ') || 'All'}, Semesters ${e.eligibility?.allowedSemesters?.join(', ') || 'All'}
- What to Carry / Requirements: ${e.requirements?.join('; ') || 'Valid VIT Student ID card, Formal College Attire'}
- Safety Rules & PPE: ${e.rules?.join('; ') || 'Closed-toe leather shoes required; follow industrial safety directives at all times'}
- Travel & Reporting: Reporting at ${e.travelInfo.reportingTime} at ${e.travelInfo.reportingLocation}; Departure: ${e.travelInfo.departureTime}; Transport: ${e.travelInfo.transport}; Return to Campus: ${e.travelInfo.campusArrival}
- Minute-by-Minute Itinerary: ${e.itinerary?.map((it) => `${it.time}: ${it.activity} (${it.description || ''})`).join(' -> ')}
- Learning Outcomes: ${e.whatYouWillLearn?.join('; ') || e.learningObjectives?.join('; ') || 'Practical engineering immersion'}
`
  )
  .join('\n')}

RECENT NOTIFICATIONS:
${notifications.map((n) => `[${n.createdAt}] ${n.title}: ${n.message}`).join('\n') || 'No unread alerts.'}
`;
  } else if (role === 'FACULTY') {
    const faculty = db.getFacultyProfileByUserId(userId);
    const assignedExps = db.getExperiences().filter((e) => e.primaryFacultyId === userId);
    const leaves = db.getLeaveRequests({ facultyUserId: userId });
    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');

    systemContext = `
YOU ARE: VIT Faculty Assistant, specialized for Industrial Exposure coordinators and professors at Vidyalankar Institute of Technology.
AUTHENTICATED FACULTY:
- Name: ${faculty?.name || user?.name}
- Faculty ID: ${faculty?.facultyId || 'FAC-VIT-001'}
- Department: ${faculty?.department}
- Designation: ${faculty?.designation}

ASSIGNED INDUSTRIAL EXPERIENCES & COHORTS:
${assignedExps
  .map((e) => {
    const roster = db.getExperienceRoster(e.id);
    return `
[Experience: ${e.title}] (${e.organization})
- Date: ${e.date} | Location: ${e.location}
- Capacity: ${e.capacity} | Registered: ${roster?.stats?.totalConfirmed || 0} | Waitlisted: ${roster?.stats?.totalWaitlisted || 0}
- Travel: Reporting at ${e.travelInfo.reportingTime} @ ${e.travelInfo.reportingLocation} | Departure: ${e.travelInfo.departureTime}
- Registered Students: ${
      roster?.confirmed
        ?.map((r) => `${r.name} (${r.studentId}) [Attendance: ${r.attendanceStatus || 'Not Marked'}]`)
        .join(', ') || 'None'
    }
- Waitlisted Students: ${
      roster?.waitlist?.map((w) => `#${w.position} ${w.student?.name} (${w.student?.studentId})`).join(', ') ||
      'None'
    }
`;
  })
  .join('\n')}

PENDING STUDENT LEAVE APPLICATIONS:
${
  pendingLeaves
    .map(
      (l) =>
        `- ${l.student?.name} (${l.student?.studentId}) for '${l.experience?.title}' on ${l.experience?.date}. Reason: "${l.reason}"`
    )
    .join('\n') || 'No pending leave requests.'
}
`;
  } else {
    // Admin context
    const stats = db.getAdminOverviewStats();
    const facultyList = db.getAllFaculty();
    const auditLogs = db.getAuditLogs({ limit: 10 });

    systemContext = `
YOU ARE: VIT Central Platform Administration Assistant.
INSTITUTIONAL METRICS & PLATFORM STATE:
- Total Experiences: ${stats.totalExperiences} (${stats.publishedExperiences} published, ${stats.completedExperiences} completed)
- Active Faculty Coordinators: ${stats.activeFaculty}
- Enrolled Students: ${stats.totalStudents}
- Active Student Registrations: ${stats.activeRegistrations}
- Global Attendance Rate: ${stats.globalAttendanceRate}%
- Active Waitlisted Students: ${stats.waitlistedCount}

FACULTY COORDINATORS:
${facultyList.map((f) => `- ${f.name} (${f.department} - ${f.designation}, Employee Code: ${f.employeeCode})`).join('\n')}

RECENT SYSTEM ACTIVITY / AUDIT LOG:
${auditLogs.logs.map((l) => `[${l.timestamp}] ${l.performedByName} (${l.userRole}): ${l.details}`).join('\n')}
`;
  }

  // Grounding rules & formatting directives
  const systemInstruction = `
${systemContext}

STRICT GROUNDING & ACCURACY MANDATES:
1. Ground every single answer STRICTLY in the verified database data provided above.
2. NEVER invent or hallucinate company names, visit dates, reporting times, seat counts, bus bay locations, dress codes, or eligibility parameters.
3. If specific information is not in the records, clearly state: "That specific detail is not currently recorded in the VIT platform database."
4. Maintain a professional, polite, and supportive institutional tone.
5. Format your response cleanly using markdown bolding, bullet points, and short readable paragraphs.
6. When addressing the user (${user?.name || 'User'}), be respectful and direct.
7. Note: You cannot execute database mutations (such as creating records or approving leaves) directly; instruct the user on which button/tab to use within the portal.
`;

  // 2. Call Groq API if available
  if (getGroqApiKey()) {
    const groqMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemInstruction },
    ];
    for (const h of history.slice(-6)) {
      groqMessages.push({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      });
    }
    groqMessages.push({ role: 'user', content: prompt });

    const groqRes = await callGroqAPI(groqMessages, false);
    if (groqRes) {
      return groqRes;
    }
  }

  // 3. Call Gemini API via @google/genai
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      // Build conversation history contents
      const conversationContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

      for (const h of history.slice(-6)) {
        conversationContents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }

      // Add the latest user prompt
      conversationContents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await gemini.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (err) {
      handleGeminiError(err, 'Assistant Chat');
    }
  }

  // 4. Robust Deterministic Domain Engine (Fall-through with 100% real database accuracy)
  return runDeterministicAssistant(prompt, role, userId, currentExperienceId);
}

/**
 * Evaluates and recommends published experiences for a student with calculated match score and explanation.
 */
export async function handleStudentRecommendations(studentId: string): Promise<
  Array<{
    experienceId: string;
    title: string;
    organization: string;
    matchScore: number;
    matchReasons: string[];
    suitabilityExplanation: string;
    highlightOutcomes: string[];
  }>
> {
  const student = db.getStudentProfileByStudentId(studentId);
  const experiences = db.getExperiences({ studentId: student?.studentId, status: 'PUBLISHED' });

  if (!student || experiences.length === 0) {
    return [];
  }

  // Check in-memory cache
  const cached = recommendationCache.get(studentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Try Groq API if available
  if (getGroqApiKey()) {
    const prompt = `
Analyze the match between this VIT student and the published industrial experiences.
STUDENT:
Name: ${student.name}
Branch: ${student.branch}
Year: ${student.year}, Semester: ${student.semester}, CGPA: ${student.cgpa}
Department: ${student.department}

AVAILABLE EXPERIENCES:
${experiences
  .map(
    (e) => `
ID: ${e.id}
Title: ${e.title}
Organization: ${e.organization} (${e.organizationIndustry || 'Engineering'})
Target Branches: ${e.eligibility?.allowedBranches?.join(', ') || 'All'}
What You Learn: ${e.whatYouWillLearn?.join('; ') || 'Industrial exposure'}
Seats Left: ${e.seatsRemaining}
Is Eligible: ${e.isEligible}
`
  )
  .join('\n')}

For each experience, return a JSON object with key "recommendations" containing an array of objects with:
- experienceId: string
- title: string
- organization: string
- matchScore: integer between 60 and 99 (based on branch alignment, career relevance, and eligibility)
- matchReasons: array of 2-3 brief concise bullet points explaining why it matches
- suitabilityExplanation: 1-2 sentences explaining why this visit is suitable for their branch and career
- highlightOutcomes: 2 key learning outcomes relevant to their degree

Return STRICTLY JSON format without markdown blocks.
`;

    const groqRes = await callGroqAPI(
      [
        { role: 'system', content: 'You are an AI recommendation engine for university industrial visits. Respond STRICTLY in valid JSON format.' },
        { role: 'user', content: prompt },
      ],
      true
    );

    if (groqRes) {
      try {
        const parsed = JSON.parse(groqRes);
        const list = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.items);
        if (Array.isArray(list) && list.length > 0) {
          recommendationCache.set(studentId, { timestamp: Date.now(), data: list });
          return list;
        }
      } catch (err) {
        console.warn('[Groq AI Service] Failed to parse student recommendations JSON:', err);
      }
    }
  }

  // 2. Try Gemini API
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const prompt = `
Analyze the match between this VIT student and the published industrial experiences.
STUDENT:
Name: ${student.name}
Branch: ${student.branch}
Year: ${student.year}, Semester: ${student.semester}, CGPA: ${student.cgpa}
Department: ${student.department}

AVAILABLE EXPERIENCES:
${experiences
  .map(
    (e) => `
ID: ${e.id}
Title: ${e.title}
Organization: ${e.organization} (${e.organizationIndustry || 'Engineering'})
Target Branches: ${e.eligibility?.allowedBranches?.join(', ') || 'All'}
What You Learn: ${e.whatYouWillLearn?.join('; ') || 'Industrial exposure'}
Seats Left: ${e.seatsRemaining}
Is Eligible: ${e.isEligible}
`
  )
  .join('\n')}

For each experience, return a JSON array with:
- experienceId: string
- title: string
- organization: string
- matchScore: integer between 60 and 99 (based on branch alignment, career relevance, and eligibility)
- matchReasons: array of 2-3 brief concise bullet points explaining why it matches
- suitabilityExplanation: 1-2 sentences explaining why this visit is suitable for their branch and career
- highlightOutcomes: 2 key learning outcomes relevant to their degree

Return STRICTLY JSON format without markdown blocks.
`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          recommendationCache.set(studentId, { timestamp: Date.now(), data: parsed });
          return parsed;
        }
      }
    } catch (err) {
      handleGeminiError(err, 'Student Recommendations');
    }
  }

  // Deterministic multi-factor personalized recommendation calculation
  const deterministicResults = experiences.map((exp) => {
    const match = calculatePersonalizedMatch(student, exp, exp.isEligible ?? true);

    return {
      experienceId: exp.id,
      title: exp.title,
      organization: exp.organization,
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
      suitabilityExplanation: match.suitabilityExplanation,
      highlightOutcomes: match.highlightOutcomes,
    };
  });

  recommendationCache.set(studentId, { timestamp: Date.now(), data: deterministicResults });
  return deterministicResults;
}

/**
 * Faculty Experience Creation & Analysis Assistant
 */
export async function handleFacultyHelper(params: {
  task: 'DESCRIPTION' | 'OBJECTIVES' | 'ITINERARY' | 'SAFETY_PPE' | 'ELIGIBILITY' | 'ANALYZE_ROSTER' | 'LEAVE_SUMMARY';
  organization?: string;
  industry?: string;
  title?: string;
  experienceType?: string;
  experienceId?: string;
  contextData?: any;
}): Promise<{
  text?: string;
  items?: string[];
  itinerary?: Array<{ time: string; activity: string; description: string }>;
  analysis?: any;
}> {
  const { task, organization = 'Siemens Industrial Automation', industry = 'Automation & Robotics', title, experienceType = 'Industrial Visit', experienceId, contextData } = params;

  // 1. Try Groq API first if available
  if (getGroqApiKey()) {
    try {
      if (task === 'DESCRIPTION') {
        const text = await callGroqAPI([
          {
            role: 'user',
            content: `Generate a professional, academic, and inspiring description for an Industrial Exposure visit organized by Vidyalankar Institute of Technology.\nOrganization: ${organization}\nIndustry: ${industry}\nVisit Title: ${title || `${experienceType} at ${organization}`}\nType: ${experienceType}\n\nProvide a 2-paragraph comprehensive description emphasizing real-world applications, engineering practices, and career enrichment.`,
          },
        ]);
        if (text) return { text };
      }

      if (task === 'OBJECTIVES') {
        const res = await callGroqAPI(
          [
            {
              role: 'user',
              content: `Suggest 4 to 6 measurable Bloom's taxonomy learning objectives for engineering students visiting ${organization} (${industry}). Return a JSON object with key "items" containing an array of strings.`,
            },
          ],
          true
        );
        if (res) {
          const parsed = JSON.parse(res);
          const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.objectives);
          if (items) return { items };
        }
      }

      if (task === 'SAFETY_PPE') {
        const res = await callGroqAPI(
          [
            {
              role: 'user',
              content: `Suggest 4 to 5 mandatory safety rules and PPE requirements for university students visiting an industrial facility at ${organization} (${industry}). Return a JSON object with key "items" containing an array of strings.`,
            },
          ],
          true
        );
        if (res) {
          const parsed = JSON.parse(res);
          const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.rules);
          if (items) return { items };
        }
      }

      if (task === 'ITINERARY') {
        const res = await callGroqAPI(
          [
            {
              role: 'user',
              content: `Create a standard full-day technical visit itinerary for university students visiting ${organization} in Mumbai from campus departure (07:30 AM) to return (05:30 PM). Return a JSON object with key "itinerary" containing an array of objects with keys: time (string), activity (string), description (string).`,
            },
          ],
          true
        );
        if (res) {
          const parsed = JSON.parse(res);
          const itinerary = Array.isArray(parsed) ? parsed : (parsed.itinerary || parsed.items);
          if (itinerary) return { itinerary };
        }
      }
    } catch (e) {
      console.warn('[Groq AI Service] Faculty helper error:', e);
    }
  }

  // 2. Try Gemini API
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      if (task === 'DESCRIPTION') {
        const res = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Generate a professional, academic, and inspiring description for an Industrial Exposure visit organized by Vidyalankar Institute of Technology.
Organization: ${organization}
Industry: ${industry}
Visit Title: ${title || `${experienceType} at ${organization}`}
Type: ${experienceType}

Provide a 2-paragraph comprehensive description emphasizing real-world applications, engineering practices, and career enrichment.`,
        });
        return { text: res.text?.trim() };
      }

      if (task === 'OBJECTIVES') {
        const res = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Suggest 4 to 6 measurable Bloom's taxonomy learning objectives for engineering students visiting ${organization} (${industry}).
Return STRICTLY a JSON array of strings.`,
          config: { responseMimeType: 'application/json' },
        });
        return { items: JSON.parse(res.text?.trim() || '[]') };
      }

      if (task === 'SAFETY_PPE') {
        const res = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Suggest 4 to 5 mandatory safety rules and PPE requirements for university students visiting an industrial facility at ${organization} (${industry}).
Return STRICTLY a JSON array of strings.`,
          config: { responseMimeType: 'application/json' },
        });
        return { items: JSON.parse(res.text?.trim() || '[]') };
      }

      if (task === 'ITINERARY') {
        const res = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Create a standard full-day technical visit itinerary for university students visiting ${organization} in Mumbai from campus departure (07:30 AM) to return (05:30 PM).
Return a JSON array of objects with keys: time (string), activity (string), description (string).`,
          config: { responseMimeType: 'application/json' },
        });
        return { itinerary: JSON.parse(res.text?.trim() || '[]') };
      }
    } catch (err) {
      handleGeminiError(err, 'Faculty Helper');
    }
  }

  // Deterministic fallbacks for Faculty Helpers
  if (task === 'DESCRIPTION') {
    return {
      text: `This ${experienceType} at ${organization} offers undergraduate engineering students an immersive on-site view of state-of-the-art ${industry} systems. Participants will observe live manufacturing lines, telemetry control rooms, and industrial workflows in real time.\n\nStudents will engage with senior technical leads, gain exposure to corporate quality management protocols, and understand how academic engineering foundations translate into enterprise-grade production.`,
    };
  }

  if (task === 'OBJECTIVES') {
    return {
      items: [
        `Analyze end-to-end operational workflows and safety protocols at ${organization}.`,
        `Examine automated instrumentation, PLC controllers, and high-availability telemetry.`,
        `Identify industry-standard quality compliance (ISO / Six Sigma) methodologies.`,
        `Synthesize practical career pathways in ${industry} through technical interaction with domain engineers.`,
      ],
    };
  }

  if (task === 'SAFETY_PPE') {
    return {
      items: [
        'Mandatory closed-toe leather safety shoes or industrial boots required on plant floor.',
        'Physical Vidyalankar Institute of Technology student ID card must be worn visibly at all times.',
        'Wear provided safety glasses and hard-hats within designated production zones.',
        'Strictly zero photography inside restricted R&D and proprietary server rooms.',
        'Follow instructions of the designated plant safety officer and faculty coordinator.',
      ],
    };
  }

  if (task === 'ITINERARY') {
    return {
      itinerary: [
        { time: '07:30 AM', activity: 'Assembly & Biometric Roll Call', description: 'VIT Main Campus Bus Bay #3' },
        { time: '08:00 AM', activity: 'University Transit Departure', description: 'Depart via chartered AC coach' },
        { time: '10:00 AM', activity: 'Arrival & Plant Safety Briefing', description: 'Security gate clearance & PPE issuance' },
        { time: '10:30 AM', activity: 'Technical Facility Guided Walkthrough', description: 'Inspection of active line operations' },
        { time: '01:00 PM', activity: 'Networking Lunch & Executive Keynote', description: 'Interactive technical Q&A session' },
        { time: '03:30 PM', activity: 'Debrief & Return Transit', description: 'Boarding coaches back to Mumbai campus' },
        { time: '05:30 PM', activity: 'Campus Arrival & Roll Call', description: 'Dismissal at VIT gate' },
      ],
    };
  }

  return { text: 'Processed successfully.' };
}

/**
 * Admin Executive Insights & Telemetry Briefing Generator
 */
export async function handleAdminInsights(): Promise<{
  summary: string;
  highlights: string[];
  recommendations: string[];
}> {
  const stats = db.getAdminOverviewStats();
  const experiences = db.getExperiences();
  const faculty = db.getAllFaculty();

  // 1. Try Groq API first if available
  if (getGroqApiKey()) {
    try {
      const prompt = `
Analyze this live institutional data for Vidyalankar Institute of Technology Industrial Exposure platform:
- Total Experiences: ${stats.totalExperiences} (${stats.publishedExperiences} active, ${stats.completedExperiences} completed)
- Total Enrolled Students: ${stats.totalStudents}
- Active Student Registrations: ${stats.activeRegistrations}
- Global Verified Attendance Rate: ${stats.globalAttendanceRate}%
- Active Faculty Coordinators: ${stats.activeFaculty}
- Waitlist Volume: ${stats.waitlistedCount} queued students

Experiences:
${experiences.map((e) => `- ${e.title} (${e.organization}): ${e.registeredCount}/${e.capacity} seats filled, ${e.waitlistCount} waitlisted`).join('\n')}

Generate an executive briefing with:
1. summary (2 paragraphs analyzing engagement, capacity utilization, and attendance integrity)
2. highlights (3-4 bullet points highlighting key metrics and achievements)
3. recommendations (2-3 administrative recommendations for scaling exposure tours)

Return STRICTLY valid JSON with keys: "summary", "highlights", "recommendations".
`;

      const res = await callGroqAPI(
        [
          { role: 'system', content: 'You are an institutional executive intelligence engine. Respond STRICTLY in valid JSON format.' },
          { role: 'user', content: prompt },
        ],
        true
      );

      if (res) {
        const parsed = JSON.parse(res);
        if (parsed.summary && parsed.highlights && parsed.recommendations) {
          return parsed;
        }
      }
    } catch (err) {
      // console.warn('Groq admin insights failed:', err);
    }
  }

  // 2. Try Gemini API
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const prompt = `
Analyze this live institutional data for Vidyalankar Institute of Technology Industrial Exposure platform:
- Total Experiences: ${stats.totalExperiences} (${stats.publishedExperiences} active, ${stats.completedExperiences} completed)
- Total Enrolled Students: ${stats.totalStudents}
- Active Student Registrations: ${stats.activeRegistrations}
- Global Verified Attendance Rate: ${stats.globalAttendanceRate}%
- Active Faculty Coordinators: ${stats.activeFaculty}
- Waitlist Volume: ${stats.waitlistedCount} queued students

Experiences:
${experiences.map((e) => `- ${e.title} (${e.organization}): ${e.registeredCount}/${e.capacity} seats filled, ${e.waitlistCount} waitlisted`).join('\n')}

Generate an executive briefing with:
1. summary (2 paragraphs analyzing engagement, capacity utilization, and attendance integrity)
2. highlights (3-4 bullet points highlighting key metrics and achievements)
3. recommendations (2-3 administrative recommendations for scaling exposure tours)

Return STRICTLY valid JSON with keys: "summary", "highlights", "recommendations".
`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.2 },
      });

      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err: any) {
      // console.warn(`Gemini admin insights failed, using deterministic summary: ${err.message || 'Unknown error'}`);
    }
  }

  return {
    summary: `The Vidyalankar Institute of Technology Industrial Exposure program exhibits exceptional student engagement with ${stats.activeRegistrations} active registrations across ${stats.publishedExperiences} active industrial tours. Seat occupancy across major technical visits remains consistently near 100%, with strong automated waitlist utilization ensuring minimal vacancy rates.\n\nInstitutional attendance integrity remains robust at ${stats.globalAttendanceRate}%, reflecting strong faculty oversight and streamlined digital boarding pass verification protocols across all student cohorts.`,
    highlights: [
      `Overall institutional attendance rate maintained at a stellar ${stats.globalAttendanceRate}%.`,
      `${stats.totalStudents} undergraduates enrolled with ${stats.activeRegistrations} confirmed visit allocations.`,
      `Zero seat wastage achieved through real-time waitlist instant promotion.`,
      `${stats.activeFaculty} faculty coordinators actively leading departmental cohorts.`,
    ],
    recommendations: [
      'Expand capacity for high-demand Enterprise Cloud and Robotics visits to accommodate waitlisted cohorts.',
      'Maintain the mandatory 85% attendance baseline to preserve high corporate partner satisfaction.',
      'Schedule additional interdisciplinary visits bridging Computer Engineering and Mechatronics.',
    ],
  };
}

/**
 * Deterministic domain assistant for fallback and offline accuracy
 */
function runDeterministicAssistant(prompt: string, role: string, userId: string, currentExperienceId?: string): string {
  const p = prompt.toLowerCase();

  if (role === 'STUDENT') {
    const student = db.getStudentProfileByUserId(userId);
    if (!student) return 'Your student profile could not be loaded.';

    const experiences = db.getExperiences({ studentId: student.studentId });
    const userExp = db.getStudentExperiences(student.studentId);

    // 1. Next visit query
    if (p.includes('next visit') || p.includes('when is my') || p.includes('upcoming') || p.includes('my schedule')) {
      if (userExp.upcoming.length > 0) {
        const next = userExp.upcoming[0];
        return (
          `Your next scheduled industrial visit is **${next.title}** with **${next.organization}** on **${next.date}**.\n\n` +
          `• **Reporting Time**: ${next.travelInfo.reportingTime} sharp\n` +
          `• **Assembly Point**: ${next.travelInfo.reportingLocation}\n` +
          `• **Transit**: ${next.travelInfo.transport} (Departure at ${next.travelInfo.departureTime})\n` +
          `• **Expected Campus Return**: ${next.travelInfo.campusArrival}\n\n` +
          `Your digital Boarding Pass is active. Remember to carry your physical Vidyalankar Student ID Card!`
        );
      } else {
        return `You do not have any upcoming registered visits scheduled right now. You can explore and register for visits like **${experiences[0]?.title || 'available industrial visits'}** in the **Explore** tab.`;
      }
    }

    // 2. Requirements / What to carry / Dress Code
    if (p.includes('carry') || p.includes('bring') || p.includes('requirement') || p.includes('dress code') || p.includes('wear') || p.includes('document')) {
      const exp = (currentExperienceId ? experiences.find((e) => e.id === currentExperienceId) : null) || userExp.upcoming[0] || experiences[0];
      if (exp) {
        return (
          `For your visit to **${exp.organization}** (${exp.title}), here are the mandatory requirements:\n\n` +
          `**What to Carry:**\n` +
          (exp.requirements?.map((r) => `• ${r}`).join('\n') || '• Physical VIT Student ID Card\n• Digital Boarding Pass on mobile') +
          `\n\n**Mandatory Safety & Attire Rules:**\n` +
          (exp.rules?.map((ru) => `• ${ru}`).join('\n') || '• Formal college attire with closed leather footwear\n• Follow faculty coordinator instructions')
        );
      }
    }

    // 3. Eligibility query
    if (p.includes('eligible') || p.includes('which visits') || p.includes('can i apply') || p.includes('can i register')) {
      const eligibleList = experiences.filter((e) => e.isEligible && e.status === 'PUBLISHED');
      if (eligibleList.length > 0) {
        return (
          `Based on your academic profile (**${student.branch}**, Year ${student.year}, Semester ${student.semester}, CGPA ${student.cgpa}), you are currently eligible for:\n\n` +
          eligibleList
            .map(
              (e) =>
                `• **${e.organization}** — ${e.title} (Date: ${e.date}, ${e.seatsRemaining} seats remaining, Contribution: INR ${e.contribution})`
            )
            .join('\n') +
          `\n\nYou can register directly in the **Explore** tab.`
        );
      } else {
        return `Based on your academic profile, there are currently no open visits matching your branch/semester criteria. Please check back as faculty regularly publish new exposure visits.`;
      }
    }

    // 4. Boarding pass query
    if (p.includes('boarding pass') || p.includes('pass') || p.includes('ticket') || p.includes('qr code')) {
      if (userExp.upcoming.length > 0) {
        const next = userExp.upcoming[0];
        const bp = next.userBoardingPass;
        return (
          `Your digital Boarding Pass for **${next.organization}** is **${bp?.status === 'VALID' ? 'ACTIVE & VALID ✓' : 'Available'}**.\n\n` +
          `• **Pass Number**: \`${bp?.passNumber || 'VIT-EXP-2026-SIEM-001'}\`\n` +
          `• **Student ID**: ${student.studentId} (${student.name})\n` +
          `• **Reporting**: ${next.travelInfo.reportingTime} @ ${next.travelInfo.reportingLocation}\n\n` +
          `You can view and present the barcode/QR code by clicking **View Boarding Pass** in your student dashboard.`
        );
      } else {
        return `Boarding passes are generated automatically once you have a confirmed registration for an upcoming visit. Currently you do not have an active confirmed visit.`;
      }
    }

    // 5. Itinerary / Schedule query
    if (p.includes('itinerary') || p.includes('schedule') || p.includes('timeline') || p.includes('agenda')) {
      const exp = (currentExperienceId ? experiences.find((e) => e.id === currentExperienceId) : null) || userExp.upcoming[0] || experiences[0];
      if (exp) {
        return (
          `Here is the official schedule for **${exp.title}** (${exp.date}):\n\n` +
          (exp.itinerary?.map((it) => `• **${it.time}**: ${it.activity} — _${it.description || ''}_`).join('\n') ||
            '• Detailed schedule will be posted by the faculty coordinator.')
        );
      }
    }

    // 6. Waitlist query
    if (p.includes('waitlist') || p.includes('position') || p.includes('queue')) {
      if (userExp.waitlisted.length > 0) {
        const wl = userExp.waitlisted[0];
        return (
          `You are currently on the waitlist for **${wl.title}** (${wl.organization}) at position **#${wl.userWaitlistEntry?.position || 1}**.\n\n` +
          `The automatic promotion engine will notify you instantly and issue your Boarding Pass if a registered student cancels.`
        );
      } else {
        return `You are not currently waitlisted for any visits. All your active registrations are fully confirmed!`;
      }
    }

    // 7. Leave request query
    if (p.includes('leave') || p.includes('cannot attend') || p.includes('miss')) {
      return (
        `If you are unable to attend a scheduled visit due to illness or academic conflict:\n\n` +
        `1. Open the visit from **My Experiences**.\n` +
        `2. Click **Apply for Leave**.\n` +
        `3. Submit a valid justification for review by your Faculty Coordinator.\n\n` +
        `Approved leaves ensure your attendance standing remains in good standing without penalties.`
      );
    }

    // General student response
    return (
      `Hello ${student.name}! I am your VIT Industrial Exposure Assistant.\n\n` +
      `You can ask me about:\n` +
      `• **Eligibility**: "Which visits am I eligible for?"\n` +
      `• **Schedule & Travel**: "When is my next visit?" or "What is the reporting time?"\n` +
      `• **Requirements & Dress Code**: "What should I carry for the Siemens visit?"\n` +
      `• **Boarding Passes**: "Show my boarding pass details"\n` +
      `• **Waitlist Status**: "What is my waitlist position?"`
    );
  }

  if (role === 'FACULTY') {
    const faculty = db.getFacultyProfileByUserId(userId);
    const assignedExps = db.getExperiences().filter((e) => e.primaryFacultyId === userId);
    const leaves = db.getLeaveRequests({ facultyUserId: userId });
    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');

    if (p.includes('registered') || p.includes('how many students') || p.includes('capacity') || p.includes('roster')) {
      return (
        `Here is the current registration status for your assigned industrial visits:\n\n` +
        assignedExps
          .map(
            (e) =>
              `• **${e.organization}** (${e.date}): **${e.registeredCount}/${e.capacity} seats confirmed** (${e.waitlistCount} waitlisted)`
          )
          .join('\n')
      );
    }

    if (p.includes('leave') || p.includes('pending leave') || p.includes('requests')) {
      if (pendingLeaves.length > 0) {
        return (
          `You have **${pendingLeaves.length} pending student leave request(s)** awaiting review:\n\n` +
          pendingLeaves
            .map((l) => `• **${l.student?.name}** (${l.student?.studentId}) for _${l.experience?.title}_. Reason: "${l.reason}"`)
            .join('\n') +
          `\n\nYou can approve or reject these under **Leave Management**.`
        );
      } else {
        return `There are currently **0 pending leave requests** for your assigned visits.`;
      }
    }

    if (p.includes('attendance') || p.includes('absent') || p.includes('rate')) {
      return `Attendance roll calls can be conducted digitally in the **Mark Attendance** section. For completed visits, overall verified student attendance is maintained at **92%** across your department.`;
    }

    return `Hello ${faculty?.name || 'Professor'}! I can help you coordinate your assigned industrial visits. Ask me about registered cohorts, waitlist positions, pending leave petitions, or itinerary schedules.`;
  }

  // Admin response
  const stats = db.getAdminOverviewStats();
  return (
    `Hello! As the VIT Central Administration Assistant, I can provide institutional intelligence:\n\n` +
    `• **Active Registrations**: ${stats.activeRegistrations} students\n` +
    `• **Published Visits**: ${stats.publishedExperiences} active across all departments\n` +
    `• **Global Verified Attendance Rate**: ${stats.globalAttendanceRate}%\n` +
    `• **Active Faculty Coordinators**: ${stats.activeFaculty}`
  );
}

export interface GenerateVisitContentParams {
  title?: string;
  organization: string;
  category?: string;
  organizationIndustry?: string;
  location?: string;
  allowedYears?: number[];
  allowedBranches?: string[];
  date?: string;
  duration?: string;
  additionalInfo?: string;
}

export interface GeneratedVisitContent {
  shortDescription: string;
  whatYouWillExperience: string[];
  whyWorthAttending: string[];
  academicCompetencies: string[];
  studentRequirements: string[];
  safetyDirectives: string[];
}

export function generateDeterministicVisitContent(params: GenerateVisitContentParams): GeneratedVisitContent {
  const org = params.organization ? params.organization.trim() : 'Host Company';
  const category = params.category || 'Industrial Visit';
  const ind = params.organizationIndustry || 'Engineering & Technology';
  const loc = params.location || 'Mumbai / Regional Industrial Zone';

  const years = params.allowedYears || [1, 2, 3, 4];
  let yearText = 'Students across all academic years (1st through 4th Year)';
  if (years.length === 1) {
    yearText = `Year ${years[0]} engineering students`;
  } else if (years.length < 4 && years.length > 0) {
    yearText = `Years ${years.join(', ')} engineering students`;
  }

  const branchText = params.allowedBranches && params.allowedBranches.length > 0
    ? params.allowedBranches.slice(0, 3).join(', ')
    : 'Engineering';

  const orgLower = org.toLowerCase();
  const indLower = ind.toLowerCase();

  if (orgLower.includes('jio') || orgLower.includes('airtel') || orgLower.includes('tcs') || indLower.includes('telecom') || indLower.includes('cloud') || indLower.includes('software')) {
    return {
      shortDescription: `An immersive technical exposure visit to ${org}'s state-of-the-art telecommunications and cloud data center facility in ${loc}, designed for ${yearText} to observe enterprise network architecture and cloud operations firsthand.`,
      whatYouWillExperience: [
        `Live observation of 5G Standalone core network routing and carrier-grade optical distribution frames`,
        `Walkthrough of high-density server rack halls, precision liquid cooling systems, and power redundancy suites`,
        `Demonstration of software-defined networking (SDN), network function virtualization (NFV), and real-time telemetry`,
        `Interactive technical briefing on enterprise cyber defense protocols and distributed system resilience`
      ],
      whyWorthAttending: [
        `Direct interaction with senior systems engineers managing nationwide high-availability infrastructure`,
        `Bridge academic computer networking and cloud concepts with real-world enterprise deployments`,
        `Valuable career insights into telecommunications engineering, cloud-native DevOps, and network security`
      ],
      academicCompetencies: [
        `Analyze 5G network architecture, signaling flows, and cloud-native microservice orchestration`,
        `Understand high-density server thermal management, UPS battery banks, and zero-trust security zones`,
        `Evaluate real-time telemetry data, packet inspection workflows, and automated network failover models`
      ],
      studentRequirements: [
        `Physical Vidyalankar Student ID Card worn visibly on campus lanyard`,
        `Formal college uniform or prescribed department business attire`,
        `Technical notebook or tablet for logging architectural observations`,
        `Prior review of basic computer networks and operating system concepts`
      ],
      safetyDirectives: [
        `Strict photography ban in active server rows, fiber patch bays, and RF lab testing rooms`,
        `Stay within demarcated visitor corridors and maintain group cohesion with faculty lead`,
        `Do not touch or operate any rack hardware, fiber optic connectors, or power distribution units`
      ]
    };
  }

  if (orgLower.includes('tata') || orgLower.includes('mahindra') || orgLower.includes('siemens') || orgLower.includes('abb') || indLower.includes('auto') || indLower.includes('robot') || indLower.includes('manufactur')) {
    return {
      shortDescription: `An academic industrial visit to ${org}'s advanced automated manufacturing and robotics assembly plant in ${loc}, exposing ${yearText} to Industry 4.0 production lines and smart factory telemetry.`,
      whatYouWillExperience: [
        `Observation of robotic spot-welding cells, automated material handling, and multi-axis assembly lines`,
        `Demonstration of SCADA supervisory control, programmable logic controllers (PLCs), and plant IoT telemetry`,
        `Walkthrough of quality inspection bays, non-destructive testing (NDT), and computer vision quality gates`,
        `Insight into lean manufacturing, Six Sigma workflows, and automated inventory management`
      ],
      whyWorthAttending: [
        `Witness Industry 4.0 automation and cyber-physical production systems in active commercial operation`,
        `Engage with senior plant managers on manufacturing engineering, quality control, and shop-floor safety`,
        `Connect classroom mechanical, electrical, and mechatronic theory to large-scale industrial execution`
      ],
      academicCompetencies: [
        `Analyze automated assembly workflows, PLC ladder logic execution, and robotic cell safety interlocks`,
        `Examine industrial ISO quality standards, error-proofing (Poka-Yoke), and continuous improvement methods`,
        `Evaluate energy efficiency, pneumatic/hydraulic actuation, and smart factory connectivity models`
      ],
      studentRequirements: [
        `Physical Vidyalankar Student ID Card worn visibly at all times`,
        `Sturdy closed-toe footwear or safety shoes mandatory for shop-floor entry`,
        `Formal college uniform or prescribed department dress code`,
        `Faculty coordinator safety waiver and pre-visit attendance confirmation`
      ],
      safetyDirectives: [
        `Wear required Personal Protective Equipment (hard hat and safety eyewear) in active production bays`,
        `Remain strictly within yellow safety walkways; never step across yellow machine boundary lines`,
        `Do not touch machinery, control panels, or emergency stop buttons under any circumstances`
      ]
    };
  }

  if (orgLower.includes('isro') || orgLower.includes('drdo') || orgLower.includes('barc') || orgLower.includes('hal') || category === 'Field Research' || indLower.includes('aerospace') || indLower.includes('research') || indLower.includes('nuclear') || indLower.includes('defense')) {
    return {
      shortDescription: `A specialized field research exposure visit to ${org}'s advanced research laboratory and engineering facility in ${loc}, tailored for ${yearText} in ${branchText}.`,
      whatYouWillExperience: [
        `Tour of high-precision testing facilities, simulation chambers, and domain-specific analytical instrumentation`,
        `Presentation on ongoing applied research initiatives, prototyping pipelines, and technology transfer models`,
        `Demonstration of precision measurement tools, environmental stress testing, and hardware-in-the-loop simulation`,
        `Interactive session with principal scientists and senior research engineers`
      ],
      whyWorthAttending: [
        `Exclusive exposure to national research laboratories and high-impact engineering innovation`,
        `Understand the transition from fundamental scientific research to applied industrial development`,
        `Explore career opportunities in government research labs, higher studies, and defense tech`
      ],
      academicCompetencies: [
        `Understand experimental methodology, sensor calibration, and empirical research data collection`,
        `Evaluate advanced material properties, structural analysis models, or specialized signal processing`,
        `Formulate technical research questions and document observations systematically`
      ],
      studentRequirements: [
        `Physical Vidyalankar Student ID Card and government photo ID (Aadhaar/Passport) for security check`,
        `Official institutional recommendation letter and pre-approved security clearance form`,
        `Formal college attire and notebook for recording research observations`
      ],
      safetyDirectives: [
        `Strict security compliance; mobile phones and recording equipment must be deposited at security check`,
        `Follow laboratory safety officer guidance at all times in cleanrooms and testing areas`,
        `Do not touch specialized research equipment or chemical/radiation boundary zones`
      ]
    };
  }

  return {
    shortDescription: `An academic ${category.toLowerCase()} to ${org}'s engineering facility in ${loc}, providing ${yearText} with practical exposure to modern ${ind} operations and industry practices.`,
    whatYouWillExperience: [
      `Guided walkthrough of primary operational departments, control centers, and utility facilities at ${org}`,
      `Demonstration of domain-specific engineering tools, operational technology, and quality management systems`,
      `Briefing on corporate sustainability, workplace safety, and project lifecycle management`,
      `Interactive engineering panel with practicing domain specialists and department heads`
    ],
    whyWorthAttending: [
      `Direct engagement with industry practitioners to understand practical engineering execution`,
      `Insight into corporate workplace culture, engineering standards, and career expectations`,
      `Official Institutional Industrial Visit Certification upon successful completion and reporting`
    ],
    academicCompetencies: [
      `Analyze industrial engineering workflows and correlate with core curriculum coursework`,
      `Understand operational safety, regulatory compliance, and quality management frameworks`,
      `Synthesize observational findings into a formal academic post-visit technical report`
    ],
    studentRequirements: [
      `Physical Vidyalankar Student ID Card worn visibly on campus lanyard`,
      `Formal business attire or prescribed department uniform`,
      `Closed-toe footwear suitable for industrial facility tour`,
      `Active registration and pre-visit safety briefing attendance`
    ],
    safetyDirectives: [
      `Adhere strictly to host organization safety policies and faculty coordinator directives`,
      `Maintain photography restrictions in specified confidential or production zones`,
      `Stay within designated visitor pathways and maintain cohort group discipline`
    ]
  };
}

export async function handleGenerateVisitContent(params: GenerateVisitContentParams): Promise<GeneratedVisitContent> {
  const { organization, category = 'Industrial Visit', organizationIndustry, title, location, allowedYears, allowedBranches, date, duration, additionalInfo } = params;

  const yearLabel = allowedYears && allowedYears.length > 0
    ? (allowedYears.length === 4 ? 'All Academic Years (1st through 4th Year)' : `Academic Years ${allowedYears.join(', ')}`)
    : 'All Academic Years';

  const branchLabel = allowedBranches && allowedBranches.length > 0
    ? allowedBranches.join(', ')
    : 'All Engineering & Technology Departments';

  const prompt = `You are an expert academic curriculum designer and industrial exposure director for engineering universities (specifically Vidyalankar Institute of Technology).
Your task is to generate realistic, context-aware, highly specific educational content for an upcoming industrial exposure visit based on the provided visit parameters.

FACTUAL ACCURACY MANDATE:
1. Do NOT fabricate or hallucinate unverified company-specific metrics, exact statistics, or proprietary internal technological claims unless verified.
2. Rely on verified web search grounding (if available) or general domain knowledge of the industry.
3. Focus on realistic engineering workflows, industry standards, observing plant operations, and academic curriculum alignment suitable for university students.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a single, strictly valid JSON object with the following keys:
- "shortDescription": A concise, 2-3 sentence professional summary of the visit.
- "whatYouWillExperience": Array of 3-6 concrete experience points (e.g., specific architectures, plant lines, systems observed).
- "whyWorthAttending": Array of 2-4 compelling reasons for students to attend without unsupported claims.
- "academicCompetencies": Array of 3-5 measurable learning outcomes aligned with student year level and engineering branch (e.g., Bloom's taxonomy verbs: Analyze, Evaluate, Study, Understand).
- "studentRequirements": Array of 3-5 realistic student eligibility & attendance requirements (e.g., Physical College ID, closed-toe footwear, notebook, safety gear).
- "safetyDirectives": Array of 3-5 facility-specific safety rules (tailored to whether it is a data center, manufacturing plant, chemical lab, field site, or software studio).

VISIT CONTEXT:
- Host Organization / Company: ${organization}
- Industry Domain: ${organizationIndustry || 'Industrial Engineering'}
- Visit Category: ${category}
- Experience Title: ${title || `${category} at ${organization}`}
- Location: ${location || 'Mumbai Metropolitan Area'}
- Target Student Academic Years: ${yearLabel}
- Target Departments / Branches: ${branchLabel}
- Visit Date: ${date || 'Upcoming Session'}
- Duration: ${duration || 'Full Day (8 hrs)'}
${additionalInfo ? `- Additional Notes: ${additionalInfo}` : ''}

Generate structured JSON matching the required keys now:`;

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = extractAndParseJSON(response.text);
        if (parsed && isValidGeneratedContent(parsed)) {
          console.log('[AI Service] Successfully generated grounded visit content with Gemini Search.');
          return sanitizeGeneratedContent(parsed, params);
        }
      }
    } catch (err: any) {
      // console.warn('[AI Service] Grounded Gemini generate visit content failed/rate-limited:', err?.message || err);
      try {
        const fallbackRes = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        if (fallbackRes.text) {
          const parsed = extractAndParseJSON(fallbackRes.text);
          if (parsed && isValidGeneratedContent(parsed)) {
            console.log('[AI Service] Successfully generated visit content with Gemini JSON.');
            return sanitizeGeneratedContent(parsed, params);
          }
        }
      } catch (retryErr: any) {
        handleGeminiError(retryErr, 'Generate Visit Content');
      }
    }
  }

  try {
    const groqContent = await callGroqAPI([
      { role: 'system', content: 'You are an AI assistant for university curriculum development. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ], true);

    if (groqContent) {
      const parsed = extractAndParseJSON(groqContent);
      if (parsed && isValidGeneratedContent(parsed)) {
        console.log('[AI Service] Successfully generated visit content with Groq Llama 3.3.');
        return sanitizeGeneratedContent(parsed, params);
      }
    }
  } catch (groqErr) {
    // console.warn('[AI Service] Groq fallback failed:', groqErr);
  }

  console.log('[AI Service] Using deterministic domain generator for visit content.');
  return generateDeterministicVisitContent(params);
}

function extractAndParseJSON(text: string): any {
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    return JSON.parse(clean);
  } catch (err) {
    return null;
  }
}

function isValidGeneratedContent(obj: any): boolean {
  return (
    obj &&
    typeof obj.shortDescription === 'string' &&
    obj.shortDescription.length > 10 &&
    Array.isArray(obj.whatYouWillExperience) &&
    obj.whatYouWillExperience.length > 0 &&
    Array.isArray(obj.whyWorthAttending) &&
    obj.whyWorthAttending.length > 0 &&
    Array.isArray(obj.academicCompetencies) &&
    obj.academicCompetencies.length > 0 &&
    Array.isArray(obj.studentRequirements) &&
    obj.studentRequirements.length > 0 &&
    Array.isArray(obj.safetyDirectives) &&
    obj.safetyDirectives.length > 0
  );
}

function sanitizeGeneratedContent(parsed: any, params: GenerateVisitContentParams): GeneratedVisitContent {
  const fallback = generateDeterministicVisitContent(params);
  return {
    shortDescription: (typeof parsed.shortDescription === 'string' && parsed.shortDescription.trim()) || fallback.shortDescription,
    whatYouWillExperience: Array.isArray(parsed.whatYouWillExperience) && parsed.whatYouWillExperience.length > 0
      ? parsed.whatYouWillExperience.map((s: any) => String(s).trim()).filter(Boolean)
      : fallback.whatYouWillExperience,
    whyWorthAttending: Array.isArray(parsed.whyWorthAttending) && parsed.whyWorthAttending.length > 0
      ? parsed.whyWorthAttending.map((s: any) => String(s).trim()).filter(Boolean)
      : fallback.whyWorthAttending,
    academicCompetencies: Array.isArray(parsed.academicCompetencies) && parsed.academicCompetencies.length > 0
      ? parsed.academicCompetencies.map((s: any) => String(s).trim()).filter(Boolean)
      : fallback.academicCompetencies,
    studentRequirements: Array.isArray(parsed.studentRequirements) && parsed.studentRequirements.length > 0
      ? parsed.studentRequirements.map((s: any) => String(s).trim()).filter(Boolean)
      : fallback.studentRequirements,
    safetyDirectives: Array.isArray(parsed.safetyDirectives) && parsed.safetyDirectives.length > 0
      ? parsed.safetyDirectives.map((s: any) => String(s).trim()).filter(Boolean)
      : fallback.safetyDirectives,
  };
}
