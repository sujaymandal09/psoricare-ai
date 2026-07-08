import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { AuthView } from "./components/AuthView";
import { DashboardView } from "./components/DashboardView";
import { SkinAnalysisView } from "./components/SkinAnalysisView";
import { PasiCalculatorView } from "./components/PasiCalculatorView";
import { SymptomTrackerView } from "./components/SymptomTrackerView";
import { AiConsultView } from "./components/AiConsultView";
import { ProfileView } from "./components/ProfileView";
import { User, SkinAnalysis, PasiScore, SymptomLog, ChatMessage } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [appLoading, setAppLoading] = useState(true);

  // Clinical records states
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [pasiScores, setPasiScores] = useState<PasiScore[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Synchronize session on load
  useEffect(() => {
    const savedToken = localStorage.getItem("psoricare_auth_token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setAppLoading(false);
    }
  }, []);

  // Sync datasets when logged in
  useEffect(() => {
    if (user && token) {
      syncClinicalDatasets();
    }
  }, [user, token]);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error("Refresh auth failed", e);
      handleLogout();
    } finally {
      setAppLoading(false);
    }
  };

  const syncClinicalDatasets = async () => {
    if (!token) return;
    try {
      // 1. Get skin analyses
      const analysisRes = await fetch("/api/analysis/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalyses(data || []);
      }

      // 2. Get PASI calculations
      const pasiRes = await fetch("/api/pasi/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (pasiRes.ok) {
        const data = await pasiRes.json();
        setPasiScores(data || []);
      }

      // 3. Get Symptom Logs
      const symptomRes = await fetch("/api/symptoms/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (symptomRes.ok) {
        const data = await symptomRes.json();
        setSymptomLogs(data || []);
      }
    } catch (e) {
      console.error("Clinical dataset synchronization failed", e);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    localStorage.setItem("psoricare_auth_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setCurrentView("dashboard");
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Logout request error", e);
      }
    }
    localStorage.removeItem("psoricare_auth_token");
    setToken(null);
    setUser(null);
    setAnalyses([]);
    setPasiScores([]);
    setSymptomLogs([]);
    setChatHistory([]);
    setCurrentView("dashboard");
  };

  // Profile Update handler
  const handleProfileUpdate = async (email: string, password?: string) => {
    if (!token) return;
    const res = await fetch("/api/auth/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Profile update failed");
    }

    setUser(data.user);
  };

  // Submit Skin Analysis
  const handleAnalysisSubmit = async (imageBase64: string): Promise<SkinAnalysis> => {
    if (!token) throw new Error("Auth token is missing");

    const res = await fetch("/api/analysis/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ imageBase64 })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "AI Skin assessment failed");
    }

    // Prepend to current list
    setAnalyses(prev => [data, ...prev]);
    return data;
  };

  // Submit PASI Calculation
  const handleCalculateSubmit = async (score: number, breakdown: any): Promise<PasiScore> => {
    if (!token) throw new Error("Auth token is missing");

    const res = await fetch("/api/pasi/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(breakdown)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit PASI calculation");
    }

    // Prepend to list
    setPasiScores(prev => [data, ...prev]);
    return data;
  };

  // Submit Symptom Log
  const handleSymptomSubmit = async (symptomData: Omit<SymptomLog, "id" | "userId" | "createdAt">): Promise<SymptomLog> => {
    if (!token) throw new Error("Auth token is missing");

    const res = await fetch("/api/symptoms/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(symptomData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit daily symptom log");
    }

    // Refresh history
    setSymptomLogs(prev => {
      const idx = prev.findIndex(item => item.date === symptomData.date);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = data;
        return copy;
      } else {
        return [data, ...prev];
      }
    });
    return data;
  };

  // Send message to AI consult chat
  const handleSendMessage = async (question: string): Promise<ChatMessage> => {
    if (!token) throw new Error("Auth token is missing");

    const newUserMessage: ChatMessage = {
      id: "msg-" + Math.floor(Math.random() * 1000000),
      role: "user",
      content: question,
      createdAt: new Date().toISOString()
    };

    // Optimistically update chat history
    setChatHistory(prev => [...prev, newUserMessage]);

    // Format chat logs correctly
    const messagesToSend = [...chatHistory, newUserMessage].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const res = await fetch("/api/chat/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ messages: messagesToSend })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate model response");
    }

    const newAssistantMessage: ChatMessage = {
      id: "msg-" + Math.floor(Math.random() * 1000000),
      role: "assistant",
      content: data.response,
      createdAt: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, newAssistantMessage]);
    return newAssistantMessage;
  };

  if (appLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-teal-50/20 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        <p className="font-mono text-xs font-bold text-teal-600 uppercase tracking-widest">
          Synchronizing PsoriCare AI Workspace...
        </p>
      </div>
    );
  }

  // Not authenticated -> Login card
  if (!user || !token) {
    return (
      <AuthView 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-teal-50/10 flex flex-col font-sans" id="app-viewport">
      {/* Top Navbar */}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={setCurrentView} 
      />

      {/* Main Clinical tools environment */}
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Nav sidebar */}
        <Sidebar 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          user={user} 
        />

        {/* Dynamic page viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8" id="stage-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="max-w-6xl mx-auto"
            >
              {currentView === "dashboard" && (
                <DashboardView 
                  analyses={analyses}
                  pasiScores={pasiScores}
                  symptomLogs={symptomLogs}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === "analysis" && (
                <SkinAnalysisView 
                  analyses={analyses}
                  onAnalysisSubmit={handleAnalysisSubmit}
                  token={token}
                />
              )}

              {currentView === "pasi" && (
                <PasiCalculatorView 
                  pasiScores={pasiScores}
                  onCalculateSubmit={handleCalculateSubmit}
                  token={token}
                />
              )}

              {currentView === "symptoms" && (
                <SymptomTrackerView 
                  symptomLogs={symptomLogs}
                  onSymptomSubmit={handleSymptomSubmit}
                  token={token}
                />
              )}

              {currentView === "chat" && (
                <AiConsultView 
                  chatHistory={chatHistory}
                  onSendMessage={handleSendMessage}
                  token={token}
                />
              )}

              {currentView === "profile" && (
                <ProfileView 
                  user={user} 
                  token={token} 
                  onProfileUpdate={handleProfileUpdate} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
