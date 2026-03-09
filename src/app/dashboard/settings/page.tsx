"use client";

// ============================================
// Settings Page — Profile, Theme, Account
// Glassmorphism cards, smooth animations
// ============================================

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Shield,
  Loader2,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const themeOptions = [
  { value: "light", label: "Light", icon: Sun, description: "Clean, bright interface" },
  { value: "dark", label: "Dark", icon: Moon, description: "Symphix signature sci-fi look" },
  { value: "system", label: "System", icon: Monitor, description: "Match your OS preference" },
] as const;

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarInitial, setAvatarInitial] = useState("U");

  useEffect(() => {
    setMounted(true);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
      setFullName(name);
      setOriginalName(name);
      setAvatarInitial(name.charAt(0).toUpperCase());
    }
  };

  const handleUpdateProfile = async () => {
    if (fullName === originalName) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw error;
      setOriginalName(fullName);
      setAvatarInitial(fullName.charAt(0).toUpperCase());
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const hasNameChanged = fullName !== originalName && fullName.trim().length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Page header */}
      <motion.div variants={cardVariants}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, appearance, and account.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>

        {/* Avatar + name display */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {avatarInitial}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{fullName || "User"}</p>
            <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Display Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="h-10 opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed from this page.
            </p>
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={saving || !hasNameChanged}
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      {/* Appearance Card */}
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Sun className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Choose how Symphix looks. Select a theme or let it follow your system preference.
        </p>

        {mounted && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const isActive = theme === option.value;
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(option.value)}
                  className={`relative rounded-xl p-4 text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary/10 border-2 border-primary"
                      : "glass hover:bg-muted/50 border-2 border-transparent"
                  }`}
                >
                  <option.icon
                    className={`h-5 w-5 mb-2 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                  {isActive && (
                    <motion.div
                      layoutId="activeTheme"
                      className="absolute top-3 right-3"
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Account Card */}
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>

        {/* Plan info */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Free Plan</p>
              <p className="text-xs text-muted-foreground">
                Unlimited orchestrations during beta
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Beta
          </span>
        </div>

        {/* Sign out */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Sign out of your Symphix account on this device.
          </p>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {signingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
