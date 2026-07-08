import { useState, useEffect, FormEvent } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  ShieldAlert, 
  Clock, 
  Save, 
  AlertTriangle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { User, AuditLog } from "../types.js";

interface ProfileViewProps {
  user: User | null;
  token: string;
  onProfileUpdate: (email: string, password?: string) => Promise<void>;
}

export function ProfileView({ user, token, onProfileUpdate }: ProfileViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  // Fetch or mock security trace logs for the current user
  const fetchUserAuditLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    try {
      setUserLogs([
        {
          id: "fake-1",
          user_id: user.id,
          event_type: "Patient Active Session",
          description: "Patient session authenticated securely from browser client",
          created_at: new Date().toISOString()
        },
        {
          id: "fake-2",
          user_id: user.id,
          event_type: "Profile Registration",
          description: "PsoriCare account credentials established",
          created_at: user.createdAt
        }
      ]);
    } catch (e) {
      console.error("Failed to load patient security log trail", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUserAuditLogs();
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Email address is required.");
      return;
    }

    if (password) {
      if (password.length < 6) {
        setErrorMsg("New password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify password confirmation.");
        return;
      }
    }

    setUpdating(true);
    try {
      await onProfileUpdate(email, password || undefined);
      setSuccessMsg("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
      fetchUserAuditLogs(); 
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
          Patient Settings & Security
        </h1>
        <p className="text-sm text-gray-500">
          Update your account parameters, secure password, and review security audits.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Change Credentials Form */}
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2 md:col-span-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800 border border-teal-100">
              <UserIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-gray-900">Security Credentials</h3>
              <p className="text-[10px] text-gray-400">Keep your login details secure</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="profile-edit-form">
            {successMsg && (
              <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700 font-semibold flex items-center gap-2" id="profile-success-alert">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-semibold" id="profile-error-alert">
                {errorMsg}
              </div>
            )}

            {/* Username disabled */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Username (Locked)
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full rounded-lg border border-teal-50 bg-teal-50/20 px-3.5 py-2.5 font-mono text-xs text-teal-400 cursor-not-allowed"
              />
              <span className="block text-[10px] text-gray-400 mt-1 leading-normal">
                Usernames cannot be changed for tracking and history integrity.
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg bg-teal-50/20 border border-teal-50 focus-within:border-teal-500 transition">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-transparent py-2.5 pl-10 pr-3.5 font-sans text-xs text-gray-800 focus:outline-none"
                  required
                  id="profile-email-input"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative rounded-lg bg-teal-50/20 border border-teal-50 focus-within:border-teal-500 transition">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-transparent py-2.5 pl-10 pr-3.5 font-sans text-xs text-gray-800 focus:outline-none"
                  id="profile-password-input"
                />
              </div>
            </div>

            {/* Confirm Password */}
            {password && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative rounded-lg bg-teal-50/20 border border-teal-50 focus-within:border-teal-500 transition">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
                  <input
                    type="password"
                    placeholder="Verify new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg bg-transparent py-2.5 pl-10 pr-3.5 font-sans text-xs text-gray-800 focus:outline-none"
                    required
                    id="profile-confirm-password-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-teal-700 active:scale-98 transition disabled:opacity-50"
              id="btn-profile-submit"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving updates...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Profile Details
                </>
              )}
            </button>
          </form>
        </div>

        {/* User security trace and audits */}
        <div className="rounded-3xl border border-teal-50 bg-white p-6 shadow-xs shadow-teal-950/2 md:col-span-7">
          <div className="flex items-center gap-2 border-b border-teal-50/60 pb-4 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-gray-900">Security Access Logs</h3>
              <p className="text-[10px] text-gray-400">Personal patient auditing trail</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1" id="user-audit-stream">
            {loadingLogs ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : userLogs.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                No security access logs found.
              </div>
            ) : (
              userLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 rounded-xl border border-teal-50/50 bg-teal-50/10 p-3 hover:bg-teal-50/20 transition"
                >
                  <Clock className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 uppercase tracking-wide">
                        {log.event_type}
                      </span>
                      <span className="font-mono text-[9px] text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-sans break-words leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-2xl bg-teal-50 border border-teal-100 p-4 mt-5 flex items-start gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider">Device Safety & Data Privacy</span>
              <p className="text-[10px] text-teal-800/80 mt-0.5 leading-relaxed font-sans">
                PsoriCare secures all uploaded skin photos and clinical history with simulated cloud-encrypted vaults. Under no circumstances is patient data distributed to unauthorized external entities or utilized for unsolicited ad-targeting engines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
