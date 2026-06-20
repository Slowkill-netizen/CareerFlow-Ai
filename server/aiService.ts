import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialized AI client to prevent crashes if key is omitted on startup
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-careerflow',
        }
      }
    });
  }
  return aiInstance;
}

/**
 * Service to handle CareerFlow AI actions.
 */
export const aiService = {
  /**
   * Evaluates Resume text against a target Job Description to identify keyword gaps and score match.
   */
  async tailorResume(resumeText: string, jobDescription: string) {
    const ai = getAI();
    const systemPrompt = `You are an expert career coach, veteran technical recruiter, and expert ATS (Applicant Tracking System) analyst.
Your job is to perform an honest, deep, and constructive analysis of a candidate's resume against a target job description.

## Crucial Strict Rules:
- Base your analysis STRICTLY on the provided resume and the job description.
- NEVER invent degrees, qualifications, certifications, previous employers, projects, achievements, or years of experience.
- DO NOT infer leadership roles, team management, or enterprise scale unless clearly written in the input resume.
- Prioritize extreme accuracy and credibility over exaggeration.
- Under missing certifications, ONLY include those that are explicitly indicated as required or highly desired in the job description and are lacking in the resume. If none are explicitly requested, return an empty list.
- Provide practical, actionable recommendations with a constructive and encouraging tone. Do not exaggerate minor deficiencies.`;

    const prompt = `Perform a comprehensive ATS analysis matching this resume against the target job description.

=== CANDIDATE RESUME ===
${resumeText}

=== TARGET JOB DESCRIPTION ===
${jobDescription}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "atsScore",
            "strengths",
            "missingKeywords",
            "missingTechnicalSkills",
            "missingSoftSkills",
            "missingCertifications",
            "scoreReasoning",
            "improvementAreas",
            "practicalRecommendations",
            "tailoredBullets"
          ],
          properties: {
            atsScore: {
              type: Type.INTEGER,
              description: "An overall suitability percentage compatibility score from 0 to 100, calculated carefully based on matching core qualifications."
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of matching skills, qualifications, or core strengths found in the resume that align with the JD."
            },
            missingKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A general list of aligned target keywords missing from the resume."
            },
            missingTechnicalSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific missing technical/hard skills specified or implied in the job description."
            },
            missingSoftSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific missing soft, leadership, communication, or stakeholder management skills."
            },
            missingCertifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Missing credentials or certifications, but ONLY if they are explicitly mentioned or required in the job description."
            },
            scoreReasoning: {
              type: Type.STRING,
              description: "A professional, objective, human-sounding explanation justifying the score. Evaluate matches versus gaps clearly."
            },
            improvementAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A constructive list of resume layout, wording, or emphasis deficiencies."
            },
            practicalRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical and realistic recommendations to address gaps or optimize impact without fabricating qualifications."
            },
            tailoredBullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-6 highly optimized resume bullet points based ONLY on their existing resume experience but rephrased to accent matching keywords and metric accomplishments."
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response received from AI analysis.");
    }

    return JSON.parse(response.text.trim());
  },

  /**
   * Generates a fully tailored Cover Letter highlighting candidate profile match.
   */
  async generateCoverLetter(params: {
    resumeText: string;
    jobDescription: string;
    company: string;
    role: string;
    tone?: string;
  }) {
    const { resumeText, jobDescription, company, role, tone = "professional" } = params;
    const ai = getAI();
    
    const systemPrompt = `You are an expert career coach, technical recruiter, and professional cover letter writer.
Your task is to generate a highly personalized, compelling, and truthful cover letter based only on the information provided in the user's resume/profile and the target job description.

## Objectives
* Tailor the cover letter specifically to the target company (${company}) and role (${role}).
* Highlight the candidate's most relevant skills and experiences from their resume.
* Connect the candidate's background to the employer's needs.
* Maintain a confident but realistic tone (selected tone mode: ${tone}).
* Sound like a genuine, thoughtful professional wrote it (avoid sounding like an AI).

## Writing Style
* Use natural, professional English.
* Vary sentence structure and avoid repetitive phrases.
* Be concise, authentic, and engaging.
* Keep the length strictly between 300 and 500 words.
* Write in first person.
* End with a polite and professional closing.
* Do not include placeholders like "[Date]" or "[Address]" - write a clean, ready-to-use professional letter body directly.

## Accuracy Rules (STRICT MANDATES)
* NEVER invent degrees, certifications, employers, awards, project names, or achievements.
* NEVER claim years of experience that are not supported by the candidate's input.
* NEVER state that the candidate led teams, managed people, or built enterprise systems unless explicitly mentioned in the input resume.
* If information is missing, omit it instead of making assumptions or fabricating details.

## Personalization
* Mention the target company (${company}) and role (${role}) naturally.
* Focus on the skills and experiences that best match the job description.
* Explain why the candidate is interested in the opportunity without using clichés (e.g. avoiding "excited to apply").

## Avoid (STRICT EXCLUSIONS)
* Generic introductions like "I am writing to express my interest..." or "Please accept this letter..."
* Overly dramatic marketing language or hype.
* Empty buzzwords such as "rockstar," "guru," "ninja," or "world-class."
* Flattery that is unsupported or excessive.
* Bullet points unless explicitly requested by the user.
* Copying phrases directly from the job description.
* Repeating information unnecessarily.
* Sounding robotic or obviously AI-generated (e.g. phrases like "In today's fast-paced digital world").

Always optimize for credibility over exaggeration. Ensure the letter reads as if it was written by a thoughtful professional who understands both their own strengths and the employer's needs.`;

    const prompt = `Write a bespoke cover letter for the role of ${role} at ${company} in a ${tone} tone matching the expert career guidelines.
    
    === CURRENT RESUME / EXPERIENCE PROFILE ===
    ${resumeText}
    
    === TARGET JOB DESCRIPTION ===
    ${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    if (!response.text) {
      throw new Error("Could not formulate a cover letter text structure.");
    }

    return { coverLetter: response.text };
  },

  /**
   * Manages Mock Interview steps: critiques user's latest response and produces the next session question.
   * Prompts are kept fully modular so that separate interview types can be easily added and targeted.
   */
  async mockInterviewChat(params: {
    role: string;
    company: string;
    level?: string;
    difficulty?: "easy" | "medium" | "hard";
    interviewType?: "behavioral" | "technical" | "coding" | "product";
    messages: Array<{ role: 'user' | 'model'; text: string }>;
  }) {
    const { 
      role, 
      company, 
      level = "mid-level", 
      difficulty = "medium",
      interviewType = "behavioral",
      messages 
    } = params;

    const ai = getAI();

    // Modular AI dynamic instructions for each category of evaluation
    const INTERVIEW_MODULAR_PROMPTS = {
      behavioral: {
        name: "Behavioral & Leadership (STAR Method)",
        focus: "Assess behavioral qualities, leadership potential, communication clarity, conflict resolution, ownership, and STAR compliance (Situation, Task, Action, Result). Highlight that there is NEVER only one single correct way to handle interpersonal or conflict situations at work."
      },
      technical: {
        name: "Technical Architecture & Systems Design",
        focus: "Assess conceptual correctness, system design trade-offs, vertical vs horizontal scaling, decoupling, state management, caching, database structures, and fault tolerance. Highlight that architectural choices are full of trade-offs, and there is never one single correct system structure."
      },
      coding: {
        name: "Coding Concepts & Engineering Logic",
        focus: "Assess algorithmic optimization, understanding of Big O time/space complexity, data structure selections, and logical accuracy. Stress that different algorithms can solve the same exact problem, and explain your evaluation cleanly."
      },
      product: {
        name: "Product Sense & Analytical Reasoning",
        focus: "Assess product strategy, growth metrics, OKRs, feature prioritization filters, usability empathy, and monetization trade-offs. Highlight that business strategies are open to creative exploration and multiple valid viewpoints exist."
      }
    };

    const selectedPrompt = INTERVIEW_MODULAR_PROMPTS[interviewType] || INTERVIEW_MODULAR_PROMPTS.behavioral;

    const difficultyText = difficulty === "easy" 
      ? "gentle, high-level, and highly encouraging, ideal for beginner developers entering corporate interviews."
      : difficulty === "hard"
      ? "highly rigorous, critical, expert-level, questioning deep edge cases, demanding explicit quantified metrics, and evaluating negative scenarios thoroughly."
      : "balanced, industry-standard, simulating real mid-to-senior level interviewer evaluation thresholds.";

    const systemPrompt = `You are an elite, veteran hiring manager and interviewer at ${company} conducting a mock interview for a ${level} ${role} position.
    
    ## Modality Focus: ${selectedPrompt.name}
    ${selectedPrompt.focus}

    ## Interviewer Demeanor & Rigor:
    Your evaluation demeanor is ${difficultyText}
    
    ## Absolute Rules:
    1. NEVER declare or imply that there is only one single correct answer or approach. Validate the user's creativity or alternative angles whenever they suggest sound techniques.
    2. Provide a constructive, granular breakdown of their last answer. 
    3. All feedback must remain supportive, educational, and professional.
    4. If the conversation has just started (0 input messages), welcome them warmly, describe the format, and ask the first question. Let 'score' be 0 and other arrays be empty.
    5. This is designed as a conversational step-by-step roleplay interview. Offer a rating out of 10 for their answers.`;

    let assistantPrompt = `Conduct the interactive mock interview session. `;
    if (messages.length === 0) {
      assistantPrompt += `This is the absolute beginning of the interview session. Output a warm introductory statement mentioning the role of ${level} ${role} at ${company}, outline that we'll review simulated positions, and formulate the very first question. Set 'score' to 0, and make strengths, improvements, and exampleAnswerPoints empty.`;
    } else {
      assistantPrompt += `Please analyze the candidate's last message, score it on a scale of 1 to 10 (where 10 is flawless STAR/technical delivery), detail specific strengths, areas for improvement, and list key points that a stellar answer could include. After that, ask the next question in the pipeline, or if you feel the interview is complete (e.g. after a few strong turns), wrap it up nicely.
      Here is the transcription of our session to evaluate in context:`;

      messages.forEach((msg) => {
        assistantPrompt += `\nRole: ${msg.role === 'model' ? 'Interviewer' : 'Candidate'}\nMessage: ${msg.text}\n`;
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: assistantPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "feedbackSummary", "strengths", "improvements", "exampleAnswerPoints", "nextQuestion"],
          properties: {
            score: {
              type: Type.INTEGER,
              description: "A professional rating out of 10 for the user's last answer (from 1 to 10). If this is the starting welcome question, return 0."
            },
            feedbackSummary: {
              type: Type.STRING,
              description: "Detailed, objective, clear evaluation of the user's last response. Remember: Always acknowledge that alternative valid approaches exist and never claim there is only one correct way to handle a problem! Leave empty on the first introductory welcome question."
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of specific strengths, keywords, or communication highlights observed in the candidate's response. Empty on welcome."
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of specific actionable improvement advice or gaps for the candidate to address. Empty on welcome."
            },
            exampleAnswerPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of 2-4 points or elements that a strong answer to the last question could include to guide the user's future improvement. Empty on welcome."
            },
            nextQuestion: {
              type: Type.STRING,
              description: "The next mock question. If the interview is winding down, output a comprehensive concluding assessment wrap-up."
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No feedback structures returned from interview model iteration.");
    }

    return JSON.parse(response.text.trim());
  },

  /**
   * Performs an honest, multi-dimensional, actionable ATS Resume Analysis
   */
  async analyzeResume(params: {
    resumeText: string;
    jobDescription: string;
    company?: string;
    role?: string;
  }) {
    const { resumeText, jobDescription, company = "Target Company", role = "Target Position" } = params;
    const ai = getAI();

    const systemPrompt = `You are a senior software engineer, AI architect, and deeply experienced technical recruiter acting as an expert career coach.
Your task is to analyze the candidate's resume against the target job description for '${role}' at '${company}', providing highly constructive, useful, and actionable feedback.

Follow these CRITICAL RULES of accuracy and recruiting discipline:
1. Never invent or assume qualifications, previous employers, degrees, certifications, leadership experience, or achievements.
2. If important skills/credentials are not explicitly listed in the resume, you must treat them as MISSING or unverified. Do not make assumptions or fabricate competencies.
3. Keep the tone professional, objective, encouraging yet highly realistic. Prefer honest, constructive guidance over false flattery or harsh criticism.
4. Base every score, gap, strength, and recommendation strictly on the provided inputs.
5. Provide actionable, reformulated, high-impact resume bullet points that integrate missing keywords and target JD criteria. These bullet points should remodel their existing experiences to highlight achievements and align with ATS scanning. Do NOT invent new companies, fake metrics, or fake roles; rather, suggest how they can rewrite or frame their existing material truthfully and beautifully.
6. Avoid generic, empty motivational language or AI jargon. Explain clearly the logical reasoning behind the match score.`;

    const prompt = `Perform a thorough professional analysis of the candidate's resume against the target job description.

=== COMPANY ===
${company}

=== TARGET ROLE ===
${role}

=== CANDIDATE RESUME ===
${resumeText}

=== TARGET JOB DESCRIPTION ===
${jobDescription}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "match_score",
            "summary",
            "matching_skills",
            "missing_skills",
            "strengths",
            "gaps",
            "recommendations",
            "resume_improvements",
            "tailored_bullets"
          ],
          properties: {
            match_score: {
              type: Type.INTEGER,
              description: "A calculated compatibility score from 0 to 100 reflecting strict confirmed alignment between the resume and job requirements."
            },
            summary: {
              type: Type.STRING,
              description: "An expert recruiter summary explaining the exact reasoning why this score was assigned based on confirmed overlaps versus requirements."
            },
            matching_skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of tech and soft skills/qualifications clearly present in both the resume and target JD."
            },
            missing_skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Important requirements from the JD that are not clearly demonstrated in the resume."
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The candidate's strongest verified skills, experiences, and qualifications aligning with the role attributes."
            },
            gaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific technical, conceptual, or qualification gaps between the candidate profile and the JD. Keep constructive."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical, realistic, prioritized next steps. Include projects, skills to target, certifications, and learning goals. Explicitly explain the reasoning behind each suggestion."
            },
            resume_improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific resume layout, narrative, formatting, quantified bullet impact, or professional summary enhancements."
            },
            tailored_bullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-6 copyable, action-oriented, keyword-enhanced resume bullet-point suggestions representing optimized reformulations of their experience."
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text received from the resume analyzer model.");
    }

    return JSON.parse(response.text.trim());
  }
};
