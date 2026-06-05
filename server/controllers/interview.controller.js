import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { askAi } from "../services/openRouter.services.js";
import User from "../models/user.models.js";
import Interview from "../models/interview.model.js";

// Helper function to extract and parse JSON safely from LLM markdown wrappers
const parseLLMJson = (text) => {
  try {
    // Regex extracts anything between first '{' and last '}' to strip markdown safely
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON structure found in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`Failed to parse AI Response JSON: ${err.message}. Raw: ${text}`);
  }
};

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    const filepath = req.file.path;

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    
    let resumeText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `Extract structured data from resume. Return strictly JSON formatting:
        {
          "role": "string",
          "experience": "string",
          "projects": ["project1", "project2"],
          "skills": ["skill1", "skill2"]
        }`
      },
      {
        role: "user",
        content: resumeText
      }
    ];

    const aiResponse = await askAi(messages);
    
    // Clean and parse response safely using our new helper
    const parsed = parseLLMJson(aiResponse);

    // Clean up file after parsing successfully
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText
    });

  } catch (error) {
    console.error(error);

    // Always ensure cleanup of uploaded file if tracking errors mid-execution
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: error.message });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    let trimmedRole = role?.trim();
    let trimmedExperience = experience?.trim();
    let trimmedMode = mode?.trim();

    if (!trimmedRole || !trimmedExperience || !trimmedMode) {
      return res.status(400).json({
        message: "Role, Experience and Mode are required."
      });
    }

    const user = await User.findById(req.userId);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.credits < 50) {
      return res.status(400).json({
        message: "Not enough credits. Minimum 50 required."
      });
    }

    const projectText = Array.isArray(projects) && projects.length ? projects.join(", ") : "None";
    const skillsText = Array.isArray(skills) && skills.length ? skills.join(", ") : "None";
    const safeResume = resumeText?.trim() || "None";
    
    const userPrompt = `
    Role: ${role}
    Experience: ${experience}
    InterviewMode: ${mode}
    Projects: ${projectText}
    Skills: ${skillsText}
    Resume: ${safeResume}
    `;

    if (!userPrompt.trim()) {
      return res.status(400).json({ message: "Prompt content is empty." });
    }

    const messages = [
      {
        role: "system",
        content: `You are a real human interviewer conducting a professional interview.
        Speak in simple, natural English as if you are directly talking to the candidate.
        Generate exactly 5 interview questions.

        Strict Rules:
        - Each question must contain between 15 and 25 words.
        - Each question must be a single complete sentence.
        - Do NOT number them.
        - Do NOT add explanations.
        - Do NOT add extra text before or after.
        - One question per line only.
        - Keep language simple and conversational.

        Difficulty progression:
        Question 1 -> easy
        Question 2 -> easy
        Question 3 -> medium
        Question 4 -> medium
        Question 5 -> hard`
      },
      {
        role: "user",
        content: userPrompt
      }
    ];
       
    const aiResponse = await askAi(messages);

    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({ message: "AI returned empty response." });
    }

    const questionsArray = aiResponse
      .split("\n")
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .slice(0, 5);

    if (questionsArray.length === 0) {
      return res.status(500).json({ message: "AI failed to generate questions." });
    }
       
    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      }))
    });

    return res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions
    });
       
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    const interview = await Interview.findById(interviewId);
    const question = interview.questions[questionIndex];

    if (!answer) {
      question.score = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";
      await interview.save();
      return res.json({ feedback: question.feedback });
    }

    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;
      await interview.save();
      return res.json({ feedback: question.feedback });
    } 

    const messages = [
      {
        role: "system",
        content: `You are a professional human interviewer evaluating a candidate's answer.
        Score the answer in these areas (0 to 10): Confidence, Communication, Correctness.
        
        Calculate: finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).
        Feedback Rules: Write natural human feedback, 10 to 15 words only.
        
        Return ONLY valid JSON format:
        {
          "confidence": number,
          "communication": number,
          "correctness": number,
          "finalScore": number,
          "feedback": "short human feedback"
        }`
      },
      {
        role: "user",
        content: `Question: ${question.question}\nAnswer: ${answer}`
      }
    ];

    const aiResponse = await askAi(messages);
    
    // Using helper here too to protect against markdown strings crashing JSON.parse
    const parsed = parseLLMJson(aiResponse);

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;

    await interview.save();
      
    return res.status(200).json({ feedback: parsed.feedback });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Failed to submit answer: ${error.message}` });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(400).json({ message: "failed to find Interview" });
    }
    
    const totalQuestions = interview.questions.length;
    let totalScore = 0, totalConfidence = 0, totalCommunication = 0, totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
    const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
    const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";
    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
      
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");
    return res.status(200).json(interviews);
  } catch (error) {
    return res.status(500).json({ message: `failed to find currentUser Interview ${error.message}` });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;
    let totalConfidence = 0, totalCommunication = 0, totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
    const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
    const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

    return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions
    });
  } catch (error) {
    return res.status(500).json({ message: `failed to find currentUser Interview Report ${error.message}` });
  }
};