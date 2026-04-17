const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// Zod schema — used only for final validation
const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, including key points and approach")
    })).describe("Technical questions that can be asked in the interview along with their intention and answers"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, including key points and approach")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and answers"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan"),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day")
    })).describe("A day-wise preparation plan for the candidate to follow")
});

// Native Gemini schema — used for responseSchema in the API call
const geminiResponseSchema = {
    type: "object",
    properties: {
        matchScore: { type: "number" },
        technicalQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question:  { type: "string" },
                    intention: { type: "string" },
                    answer:    { type: "string" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question:  { type: "string" },
                    intention: { type: "string" },
                    answer:    { type: "string" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    skill:    { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    day:   { type: "number" },
                    focus: { type: "string" },
                    tasks: { type: "array", items: { type: "string" } }
                },
                required: ["day", "focus", "tasks"]
            }
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
};

/**
 * Recursively parse any string that looks like JSON inside an object or array.
 * Fixes the "stringified JSON" issue.
 */
function deepParseJSON(obj) {
    if (typeof obj === 'string') {
        try {
            const parsed = JSON.parse(obj);
            return deepParseJSON(parsed);
        } catch {
            return obj;
        }
    } else if (Array.isArray(obj)) {
        return obj.map(item => deepParseJSON(item));
    } else if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            newObj[key] = deepParseJSON(value);
        }
        return newObj;
    }
    return obj;
}

/**
 * Fix arrays that have been flattened into alternating keys and values.
 */
function fixFlattenedKeyValueArrays(obj) {
    if (Array.isArray(obj)) {
        const hasObject = obj.some(item => typeof item === 'object' && item !== null);
        const isEven = obj.length % 2 === 0;
        const firstElementIsKey = obj.length > 0 && typeof obj[0] === 'string' &&
            ['question', 'intention', 'answer', 'skill', 'severity', 'day', 'focus', 'tasks'].includes(obj[0]);

        if (!hasObject && isEven && firstElementIsKey) {
            const reconstructed = [];
            for (let i = 0; i < obj.length; i += 2) {
                const key = obj[i];
                const value = obj[i + 1];
                if (['question', 'skill', 'day'].includes(key)) {
                    const newObj = { [key]: value };
                    let j = i + 2;
                    while (j < obj.length && typeof obj[j] === 'string' && !['question', 'skill', 'day'].includes(obj[j])) {
                        newObj[obj[j]] = obj[j + 1];
                        j += 2;
                    }
                    reconstructed.push(newObj);
                    i = j - 2;
                } else {
                    reconstructed.push({ [key]: value });
                }
            }
            return reconstructed;
        }
        return obj.map(item => fixFlattenedKeyValueArrays(item));
    } else if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            newObj[key] = fixFlattenedKeyValueArrays(value);
        }
        return newObj;
    }
    return obj;
}

/**
 * Combined fix for all known Gemini malformations.
 */
function sanitizeGeminiResponse(rawParsed) {
    let fixed = deepParseJSON(rawParsed);
    fixed = fixFlattenedKeyValueArrays(fixed);
    return fixed;
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `
You are an expert career coach and technical interviewer.
Analyze the candidate information against the job description and output ONLY valid JSON.

CRITICAL FORMAT RULES:
- Output must be directly parseable JSON. No markdown, no extra text, no code blocks.
- Use the exact structure shown in the example below.
- Each element inside "technicalQuestions", "behavioralQuestions", "skillGaps", and "preparationPlan" MUST be a JSON object.
  - DO NOT wrap objects in quotes or escape them.
  - DO NOT flatten objects into alternating key-value arrays.
  - Correct: { "question": "...", "intention": "...", "answer": "..." }
  - Incorrect: "{\\"question\\":\\"...\\"}"
  - Incorrect: ["question", "...", "intention", "...", "answer", "..."]
- "severity" must be exactly "low", "medium", or "high".
- "tasks" must be an array of strings.
- "day" numbers must start at 1 and be consecutive.

EXAMPLE OUTPUT (follow exactly):
{
  "matchScore": 78,
  "technicalQuestions": [
    {
      "question": "Explain the difference between REST and GraphQL.",
      "intention": "Assess understanding of API design paradigms.",
      "answer": "REST uses multiple endpoints and HTTP methods; GraphQL uses a single endpoint with queries. Discuss trade-offs: over-fetching, versioning, caching."
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Tell me about a time you resolved a conflict in a team.",
      "intention": "Evaluate communication and conflict resolution skills.",
      "answer": "Use the STAR method: Situation, Task, Action, Result. Focus on listening, empathy, and collaborative solution."
    }
  ],
  "skillGaps": [
    {
      "skill": "Docker",
      "severity": "medium"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "System Design Fundamentals",
      "tasks": ["Read about load balancing", "Practice designing a URL shortener"]
    }
  ]
}

Now, generate the report for the following inputs:

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: geminiResponseSchema,  // ✅ native schema instead of zodToJsonSchema
                    temperature: 0
                }
            });

            const rawText = response.text;

            // Parse outer JSON
            let parsed = JSON.parse(rawText);

            // Apply all sanitization fixes
            parsed = sanitizeGeminiResponse(parsed);

            // Validate final structure with Zod
            const validated = interviewReportSchema.parse(parsed);

            console.log('Successfully generated and validated report');
            return validated;

        } catch (error) {
            // Don't retry on quota errors — it won't help
            if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
                throw new Error("Gemini API quota exceeded. Please try again later or upgrade your plan.");
            }

            lastError = error;
            console.warn(`Attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                console.error('All retries exhausted.');
                throw new Error(`Failed to generate valid report after ${maxRetries} attempts: ${lastError.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

module.exports = generateInterviewReport;