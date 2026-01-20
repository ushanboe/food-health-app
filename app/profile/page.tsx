"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { ListItem, ListGroup } from "@/components/ui/ListItem";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  ChefHat,
  Target,
  Scale,
  TrendingUp,
  Settings,
  Cloud,
  Award,
  Calendar,
  ChevronRight,
  Flame,
  Zap,
  Camera,
  X,
  Crown,
  Lock,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, dailyGoals, getDailyTotals, updateUserProfile } = useAppStore();
  const { user, isConfigured } = useAuth();
  const [streak, setStreak] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyTotals = getDailyTotals(todayStr);

  // For now, premium is simulated - in production, check actual subscription
  const isPremium = false; // TODO: Connect to actual premium status

  useEffect(() => {
    // Calculate streak (simplified)
    const savedStreak = localStorage.getItem("fitfork_streak");
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  const isCloudConnected = user && isConfigured;

  const stats = [
    { label: "Current Streak", value: `${streak} days`, icon: Flame, color: "text-orange-500" },
    { label: "Calories Today", value: Math.round(dailyTotals.calories).toString(), icon: Zap, color: "text-emerald-500" },
    { label: "Goal Progress", value: `${Math.round((dailyTotals.calories / dailyGoals.calories) * 100)}%`, icon: Target, color: "text-blue-500" },
  ];

  const handlePhotoClick = () => {
    if (isPremium) {
      setShowUploadModal(true);
    } else {
      setShowPremiumModal(true);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        // Resize image to reduce storage size
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 256; // Max dimension
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          updateUserProfile({ profilePhoto: resizedBase64 });
          setIsUploading(false);
          setShowUploadModal(false);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    updateUserProfile({ profilePhoto: undefined });
    setShowUploadModal(false);
  };

  return (
    <PageContainer>
      {/* Profile Header */}
      <div className="bg-white">
        <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            {/* Profile Photo with Upload Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePhotoClick}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden relative group"
              >
                {userProfile.profilePhoto ? (
                  <img
                    src={userProfile.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-white" />
                )}
                
                {/* Camera overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isPremium ? (
                    <Camera size={20} className="text-white" />
                  ) : (
                    <Lock size={20} className="text-white" />
                  )}
                </div>
              </motion.button>
              
              {/* Premium badge */}
              {!isPremium && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                  <Crown size={12} className="text-white" />
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {userProfile.name || "Your Profile"}
              </h1>
              <p className="text-sm text-gray-500">
                {user?.email || "Set up your profile"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <PageContent>
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Stats Row */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="text-center py-4">
                    <Icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Cloud Status */}
          <motion.div variants={fadeUp} className="mb-6">
            <Card className={`flex items-center gap-3 ${isCloudConnected ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCloudConnected ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                <Cloud size={20} className={isCloudConnected ? 'text-emerald-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {isCloudConnected ? 'Cloud Sync Active' : 'Cloud Sync Disabled'}
                </p>
                <p className="text-xs text-gray-500">
                  {isCloudConnected ? 'Your data is backed up' : 'Enable in settings'}
                </p>
              </div>
              {isCloudConnected && (
                <Badge variant="success">Connected</Badge>
              )}
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Quick Actions
            </h2>
            <ListGroup>
              <ListItem
                icon={<User size={20} className="text-emerald-600" />}
                title="Edit Profile"
                subtitle="Update your personal info"
                onClick={() => router.push('/profile/edit')}
                showArrow
              />
              <ListItem
                icon={<Target size={20} className="text-emerald-600" />}
                title="Nutrition Goals"
                subtitle="Adjust your daily targets"
                onClick={() => router.push('/goals')}
                showArrow
              />
              <ListItem
                icon={<Scale size={20} className="text-emerald-600" />}
                title="Weight Tracking"
                subtitle="Log and view progress"
                onClick={() => router.push('/weight')}
                showArrow
              />
              <ListItem
                icon={<ChefHat size={20} className="text-emerald-600" />}
                title="Saved Recipes"
                subtitle="Your recipe collection"
                onClick={() => router.push('/recipes')}
                showArrow
              />
              <ListItem
                icon={<Settings size={20} className="text-emerald-600" />}
                title="Settings"
                subtitle="App preferences & API keys"
                onClick={() => router.push('/settings')}
                showArrow
              />
            </ListGroup>
          </motion.div>

          {/* Achievements Preview */}
          <motion.div variants={fadeUp} className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Achievements
            </h2>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <Award size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Keep Going!</p>
                <p className="text-sm text-gray-500">Log meals for 7 days to earn your first badge</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Card>
          </motion.div>
        </motion.div>
      </PageContent>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Camera size={20} />
                      Choose Photo
                    </>
                  )}
                </button>

                {userProfile.profilePhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-semibold"
                  >
                    Remove Photo
                  </button>
                )}

                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center">
                <Crown size={32} className="text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Premium Feature
              </h3>
              <p className="text-gray-500 mb-6">
                Custom profile photos are available with FitFork Premium. Upgrade to personalize your profile!
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    router.push('/settings'); // TODO: Link to premium upgrade page
                  }}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-2xl font-semibold"
                >
                  Upgrade to Premium
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </PageContainer>
  );
}
