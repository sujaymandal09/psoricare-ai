import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  User, 
  UserSession, 
  SkinAnalysis, 
  PasiScore, 
  SymptomLog, 
  ChatMessage 
} from "./src/types.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "psoriasis-assessment-super-secret-key-2026";
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  users: User[];
  sessions: UserSession[];
  analyses: SkinAnalysis[];
  pasiScores: PasiScore[];
  symptomLogs: SymptomLog[];
}

// Lazy load Gemini API client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const GROK_API_URL = "https://api.grok.ai/v1/completions";

async function callGrokCompletion(prompt: string): Promise<any> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY environment variable is required to use Grok.");
  }

  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "grok-1",
      prompt,
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Grok API request failed (${response.status}): ${body}`);
  }

  return response.json();
}

// Ensure database file exists with elegant seeded data
function initDb(): DbSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content) as DbSchema;
      
      let changed = false;
      if (!db.users) { db.users = []; changed = true; }
      if (!db.sessions) { db.sessions = []; changed = true; }
      if (!db.analyses) { db.analyses = []; changed = true; }
      if (!db.pasiScores) { db.pasiScores = []; changed = true; }
      if (!db.symptomLogs) { db.symptomLogs = []; changed = true; }
      
      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      }
      return db;
    } catch (e) {
      console.error("Failed to parse db.json, resetting database", e);
    }
  }

  console.log("Seeding clinical database with initial demonstration records...");
  const salt = bcrypt.genSaltSync(10);
  const johnPasswordHash = bcrypt.hashSync("john123", salt);
  const janePasswordHash = bcrypt.hashSync("jane123", salt);

  const users: User[] = [
    {
      id: "usr-john",
      username: "john_doe",
      email: "john.doe@example.com",
      passwordHash: johnPasswordHash,
      isAdmin: false,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "usr-jane",
      username: "jane_smith",
      email: "jane.smith@example.com",
      passwordHash: janePasswordHash,
      isAdmin: false,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Helper to generate dates relative to now
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  // Seed skin analyses
  const analyses: SkinAnalysis[] = [
    {
      id: "anl-1",
      userId: "usr-john",
      imageUrl: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=600&q=80", // dermatologist representation
      status: "completed",
      result: {
        diagnosis: "Plaque Psoriasis",
        confidence: 88,
        severity: "moderate",
        erythema: 3,
        induration: 2,
        desquamation: 3,
        description: "The image shows a well-defined erythematous plaque on the extensor surface of the elbow with prominent silvery-white scaling and moderate induration (thickening).",
        recommendations: [
          "Apply heavy emollient moisturizers twice daily to reduce scaling.",
          "Consider consulting a dermatologist regarding topical corticosteroids or Vitamin D analogues.",
          "Avoid picking or scratching scales to prevent the Koebner phenomenon.",
          "Keep logs of potential triggers such as high stress levels or cold weather."
        ],
        disclaimer: "This is an AI-assisted automated screening. It is intended for educational purposes and does not constitute official medical advice or a formal diagnosis."
      },
      createdAt: daysAgo(45)
    },
    {
      id: "anl-2",
      userId: "usr-john",
      imageUrl: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=600&q=80",
      status: "completed",
      result: {
        diagnosis: "Plaque Psoriasis - Improving",
        confidence: 91,
        severity: "mild",
        erythema: 1,
        induration: 1,
        desquamation: 1,
        description: "A previously assessed lesion area showing substantial clearance. Redness (erythema) is minimal, plaques have flattened out (induration 1), and scaling has resolved almost entirely.",
        recommendations: [
          "Maintain daily moisturizing routine with ceramide-based creams.",
          "Continue prescribed maintenance therapy as guided by your dermatologist.",
          "Protect skin from extreme cold and mechanical irritation."
        ],
        disclaimer: "This is an AI-assisted automated screening. It is intended for educational purposes and does not constitute official medical advice or a formal diagnosis."
      },
      createdAt: daysAgo(10)
    }
  ];

  // Seed PASI scores over time to demonstrate positive clinical tracking
  const pasiScores: PasiScore[] = [
    {
      id: "pasi-1",
      userId: "usr-john",
      score: 16.8, // Moderate-Severe
      calcData: {
        head: { area: 2, erythema: 2, induration: 2, desquamation: 2 },
        arms: { area: 3, erythema: 3, induration: 2, desquamation: 3 },
        trunk: { area: 2, erythema: 2, induration: 2, desquamation: 2 },
        legs: { area: 4, erythema: 3, induration: 3, desquamation: 3 }
      },
      createdAt: daysAgo(60)
    },
    {
      id: "pasi-2",
      userId: "usr-john",
      score: 11.2, // Improving
      calcData: {
        head: { area: 1, erythema: 1, induration: 1, desquamation: 1 },
        arms: { area: 2, erythema: 2, induration: 2, desquamation: 2 },
        trunk: { area: 2, erythema: 1, induration: 1, desquamation: 1 },
        legs: { area: 3, erythema: 2, induration: 2, desquamation: 2 }
      },
      createdAt: daysAgo(30)
    },
    {
      id: "pasi-3",
      userId: "usr-john",
      score: 4.6, // Mild
      calcData: {
        head: { area: 1, erythema: 1, induration: 0, desquamation: 0 },
        arms: { area: 1, erythema: 1, induration: 1, desquamation: 1 },
        trunk: { area: 1, erythema: 0, induration: 0, desquamation: 0 },
        legs: { area: 2, erythema: 1, induration: 1, desquamation: 1 }
      },
      createdAt: daysAgo(5)
    }
  ];

  // Seed symptom logs over past month to show tracking
  const symptomLogs: SymptomLog[] = [
    {
      id: "log-1",
      userId: "usr-john",
      date: daysAgo(25).split("T")[0],
      itchiness: 7,
      pain: 4,
      scaling: 6,
      redness: 8,
      sleepQuality: 5,
      triggers: ["stress", "dry weather"],
      notes: "Severe itchiness on my elbows and back today. Hard to sleep because of the irritation.",
      createdAt: daysAgo(25)
    },
    {
      id: "log-2",
      userId: "usr-john",
      date: daysAgo(20).split("T")[0],
      itchiness: 6,
      pain: 3,
      scaling: 5,
      redness: 7,
      sleepQuality: 6,
      triggers: ["stress"],
      notes: "Applied the emollient ointment. Itchiness calmed down slightly after application.",
      createdAt: daysAgo(20)
    },
    {
      id: "log-3",
      userId: "usr-john",
      date: daysAgo(15).split("T")[0],
      itchiness: 4,
      pain: 2,
      scaling: 4,
      redness: 5,
      sleepQuality: 7,
      triggers: [],
      notes: "Scaling seems to be reducing. Itching is much more manageable today.",
      createdAt: daysAgo(15)
    },
    {
      id: "log-4",
      userId: "usr-john",
      date: daysAgo(10).split("T")[0],
      itchiness: 3,
      pain: 1,
      scaling: 2,
      redness: 3,
      sleepQuality: 8,
      triggers: [],
      notes: "Skin feels much better. Continuing hydration routine with ceramide cream.",
      createdAt: daysAgo(10)
    },
    {
      id: "log-5",
      userId: "usr-john",
      date: daysAgo(5).split("T")[0],
      itchiness: 2,
      pain: 0,
      scaling: 2,
      redness: 2,
      sleepQuality: 9,
      triggers: ["diet"],
      notes: "Very minimal flaring today. Slight redness on shins but otherwise feeling great.",
      createdAt: daysAgo(5)
    }
  ];

  const db: DbSchema = {
    users,
    sessions: [],
    analyses,
    pasiScores,
    symptomLogs
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  return db;
}

function getDb(): DbSchema {
  return initDb();
}

function saveDb(db: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Auth Middleware
interface CustomRequest extends Request {
  user?: User;
  token?: string;
}

function authenticateToken(req: CustomRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired access token" });
      return;
    }
    
    const db = getDb();
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  });
}

async function startServer() {
  initDb();

  const app = express();
  app.use(express.json({ limit: "15mb" })); // Support base64 image payloads

  // Auth Endpoints
  app.post("/api/auth/register", (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: "Username, email, and password are required" });
        return;
      }

      const db = getDb();
      const existingUser = db.users.find(
        u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        res.status(400).json({ error: "Username or email is already registered" });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const newUser: User = {
        id: "usr-" + Math.floor(Math.random() * 1000000),
        username,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveDb(db);

      res.status(201).json({ 
        message: "Registration successful", 
        user: { id: newUser.id, username: newUser.username, email: newUser.email } 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      const db = getDb();
      const user = db.users.find(
        u => u.username.toLowerCase() === username.toLowerCase()
      );

      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      const accessToken = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const newSession: UserSession = {
        id: "sess-" + Math.floor(Math.random() * 1000000),
        user_id: user.id,
        access_token: accessToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      };

      db.sessions.push(newSession);
      saveDb(db);

      res.json({
        access_token: accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const db = getDb();
      if (req.user && req.token) {
        db.sessions = db.sessions.filter(s => s.access_token !== req.token);
        saveDb(db);
      }
      res.json({ message: "Logout successful" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: CustomRequest, res: Response) => {
    if (req.user) {
      res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/update-profile", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      const db = getDb();
      const userIdx = db.users.findIndex(u => u.id === req.user?.id);

      if (userIdx === -1) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const updatedUser = db.users[userIdx];

      if (email && email.toLowerCase() !== updatedUser.email.toLowerCase()) {
        const emailExists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== updatedUser.id);
        if (emailExists) {
          res.status(400).json({ error: "Email already in use" });
          return;
        }
        updatedUser.email = email;
      }

      if (password) {
        if (password.length < 6) {
          res.status(400).json({ error: "Password must be at least 6 characters long" });
          return;
        }
        const salt = bcrypt.genSaltSync(10);
        updatedUser.passwordHash = bcrypt.hashSync(password, salt);
      }

      updatedUser.updatedAt = new Date().toISOString();
      db.users[userIdx] = updatedUser;
      saveDb(db);

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Skin Analysis API
  app.post("/api/analysis/create", authenticateToken, async (req: CustomRequest, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: "Image payload is required for assessment." });
        return;
      }

      const hasGemini = Boolean(process.env.GEMINI_API_KEY);
      const hasGrok = Boolean(process.env.GROK_API_KEY);

      if (!hasGemini) {
        if (hasGrok) {
          res.status(503).json({
            error: "Dermatological image assessment requires GEMINI_API_KEY because this endpoint currently performs image-based analysis through Gemini. Grok is available for chat and text guidance, but image screening is not supported by Grok in this app yet."
          });
          return;
        }

        res.status(503).json({ 
          error: "Dermatological AI assessment is currently unavailable because no Gemini or Grok API key is configured on the server. Add GEMINI_API_KEY for image analysis or GROK_API_KEY for chat/text guidance." 
        });
        return;
      }

      // Extract raw base64 data and mine type
      let mimeType = "image/jpeg";
      let base64Data = imageBase64;
      if (imageBase64.startsWith("data:")) {
        const parts = imageBase64.split(",");
        const meta = parts[0];
        base64Data = parts[1];
        const mimeMatch = meta.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      // Initialize Gemini Client
      const ai = getGeminiClient();

      // Query Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          "Perform a comprehensive visual screening of this skin lesion. Formulate clinical indicators of psoriasis or other diseases and fill out the response schema."
        ],
        config: {
          systemInstruction: "You are an expert dermatological AI screening assistant specializing in psoriasis classification, visual inspection, and severity scoring. Analyze the provided image of a skin lesion. Grade the severity of three primary physical signs: Erythema (redness), Induration (plaque thickness), and Desquamation (scaling) each on a scale of 0 (none) to 4 (very severe). Classify the lesion as Psoriasis (specifying type such as plaque, guttate, inverse, erythrodermic, pustular, or scalp, if clear), or other common look-alikes like Eczema, Dermatitis, Dry Skin, or Healthy Skin. Write a professional visual description and provide practical skin-care suggestions. Always output a strict medical disclaimer explaining that this is an automated clinical tool, not a certified diagnosis.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: { type: Type.STRING, description: "Classification of skin condition, e.g. Plaque Psoriasis, Guttate Psoriasis, Eczema, Dermatitis, Dry Skin, Healthy Skin." },
              confidence: { type: Type.NUMBER, description: "Confidence probability between 0 and 100." },
              severity: { type: Type.STRING, description: "Overall visual severity classification: none, mild, moderate, severe." },
              erythema: { type: Type.NUMBER, description: "Redness severity rating from 0 (none) to 4 (very severe)." },
              induration: { type: Type.NUMBER, description: "Plaque thickness/height rating from 0 (none) to 4 (very severe)." },
              desquamation: { type: Type.NUMBER, description: "Scaling/flaking rating from 0 (none) to 4 (very severe)." },
              description: { type: Type.STRING, description: "Detailed clinical visual explanation of the lesion." },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key practical skin management steps."
              },
              disclaimer: { type: Type.STRING, description: "Crucial medical disclaimer." }
            },
            required: ["diagnosis", "confidence", "severity", "erythema", "induration", "desquamation", "description", "recommendations", "disclaimer"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response returned from the AI model.");
      }

      const parsedResult = JSON.parse(resultText.trim());

      const db = getDb();
      const newAnalysis: SkinAnalysis = {
        id: "anl-" + Math.floor(Math.random() * 1000000),
        userId: req.user!.id,
        imageUrl: imageBase64.substring(0, 500000) || "", // store raw data (clipped slightly if too long for db file, but 500kb holds standard compressed web images fine)
        status: "completed",
        result: parsedResult,
        createdAt: new Date().toISOString()
      };

      db.analyses.unshift(newAnalysis);
      saveDb(db);

      res.status(201).json(newAnalysis);
    } catch (error: any) {
      console.error("AI Analysis failed", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during skin image processing." });
    }
  });

  app.get("/api/analysis/history", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const db = getDb();
      const userAnalyses = db.analyses.filter(anl => anl.userId === req.user!.id);
      res.json(userAnalyses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analysis/:id", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDb();
      const analysis = db.analyses.find(anl => anl.id === id);

      if (!analysis) {
        res.status(404).json({ error: "Analysis record not found" });
        return;
      }

      if (analysis.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PASI Calculator API
  app.post("/api/pasi/create", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const { head, arms, trunk, legs } = req.body;

      if (!head || !arms || !trunk || !legs) {
        res.status(400).json({ error: "Clinical regional assessments for head, arms, trunk, and legs are required." });
        return;
      }

      // Let's calculate PASI score according to dermatological formula
      // PASI = 0.1 * (Eh + Ih + Dh) * Ah + 0.2 * (Eu + Iu + Du) * Au + 0.3 * (Et + It + Dt) * At + 0.4 * (El + Il + Dl) * Al
      // where regions are Head (h), Upper limbs (u), Trunk (t), Lower limbs (l)
      // Area score multipliers (converting area score 0-6 to clinical weights)
      // Score 0: 0%
      // Score 1: <10%
      // Score 2: 10-29%
      // Score 3: 30-49%
      // Score 4: 50-69%
      // Score 5: 70-89%
      // Score 6: 90-100%
      // Area values used in PASI calculation correspond directly to the area score (0 to 6)
      
      const headScore = 0.1 * (head.erythema + head.induration + head.desquamation) * head.area;
      const armsScore = 0.2 * (arms.erythema + arms.induration + arms.desquamation) * arms.area;
      const trunkScore = 0.3 * (trunk.erythema + trunk.induration + trunk.desquamation) * trunk.area;
      const legsScore = 0.4 * (legs.erythema + legs.induration + legs.desquamation) * legs.area;

      const totalPasi = parseFloat((headScore + armsScore + trunkScore + legsScore).toFixed(1));

      const db = getDb();
      const newPasiRecord: PasiScore = {
        id: "pasi-" + Math.floor(Math.random() * 1000000),
        userId: req.user!.id,
        score: totalPasi,
        calcData: { head, arms, trunk, legs },
        createdAt: new Date().toISOString()
      };

      db.pasiScores.unshift(newPasiRecord);
      saveDb(db);

      res.status(201).json(newPasiRecord);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pasi/history", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const db = getDb();
      const userPasi = db.pasiScores.filter(score => score.userId === req.user!.id);
      res.json(userPasi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Symptom Tracker API
  app.post("/api/symptoms/log", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const { date, itchiness, pain, scaling, redness, sleepQuality, triggers, notes } = req.body;

      if (!date || itchiness === undefined || pain === undefined || scaling === undefined || redness === undefined) {
        res.status(400).json({ error: "Symptom grades and date are required." });
        return;
      }

      const db = getDb();
      
      // Check if a log already exists for this date, if so, replace it
      const existingIdx = db.symptomLogs.findIndex(log => log.userId === req.user!.id && log.date === date);

      const symptomLogEntry: SymptomLog = {
        id: "log-" + Math.floor(Math.random() * 1000000),
        userId: req.user!.id,
        date,
        itchiness: Number(itchiness),
        pain: Number(pain),
        scaling: Number(scaling),
        redness: Number(redness),
        sleepQuality: Number(sleepQuality || 5),
        triggers: triggers || [],
        notes: notes || "",
        createdAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        db.symptomLogs[existingIdx] = symptomLogEntry;
      } else {
        db.symptomLogs.unshift(symptomLogEntry);
      }
      
      saveDb(db);
      res.status(201).json(symptomLogEntry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/symptoms/history", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
      const db = getDb();
      const userLogs = db.symptomLogs.filter(log => log.userId === req.user!.id);
      res.json(userLogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat/Consultation API
  app.post("/api/chat/ask", authenticateToken, async (req: CustomRequest, res: Response) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "A history of messages is required." });
        return;
      }

      const hasGemini = Boolean(process.env.GEMINI_API_KEY);
      const hasGrok = Boolean(process.env.GROK_API_KEY);

      const lastMessageObj = messages[messages.length - 1];
      const chatHistory = messages.slice(0, messages.length - 1).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }]
      }));

      if (hasGemini) {
        const ai = getGeminiClient();

        const chat = ai.chats.create({
          model: "gemini-3.5-flash",
          history: chatHistory,
          config: {
            systemInstruction: "You are 'PsoriCare Assistant', a friendly, compassionate, and highly knowledgeable AI chat assistant specializing in psoriasis education, skin-care tips, trigger management, and emotional support. You offer helpful, evidence-based dermatological information. Under no circumstances do you claim to make official medical diagnoses, prescribe medications, or propose treatment modifications. Always suggest consulting a board-certified dermatologist for personalized medical therapy. Keep your responses highly structured, warm, and extremely easy for a skin patient to scan (using bullet points and bold headers). Keep responses concise."
          }
        });

        const chatResponse = await chat.sendMessage({
          message: lastMessageObj.content
        });

        res.json({ response: chatResponse.text });
        return;
      }

      if (hasGrok) {
        const promptLines = messages.map((msg: any) => {
          const role = msg.role === "assistant" ? "Assistant" : "User";
          return `${role}: ${msg.content}`;
        });
        const prompt = promptLines.join("\n") + "\nAssistant:";

        const grokResult = await callGrokCompletion(prompt);
        const grokText = grokResult?.output?.[0]?.content?.[0]?.text || grokResult?.output_text || grokResult?.text || JSON.stringify(grokResult);

        res.json({ response: grokText });
        return;
      }

      res.json({
        response: "Hello! I am PsoriCare AI, your skin-care companion. I’m currently unable to access an AI model because neither GEMINI_API_KEY nor GROK_API_KEY is configured on the server. Please configure one of them in your .env file or Secrets settings."
      });
      return;
    } catch (error: any) {
      console.error("AI Chat failed", error);
      res.status(500).json({ error: error.message || "An error occurred during AI message generation." });
    }
  });

  // Serve static assets in production or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Server] Psoriasis Detection & Assessment Platform backend listening on http://localhost:${PORT}`);
  });
}

startServer();
