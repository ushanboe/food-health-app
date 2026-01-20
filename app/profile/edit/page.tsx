"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Header, PageContainer, PageContent } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Save,
  Camera,
  Plus,
  X,
  Leaf,
  AlertTriangle,
  Target,
  Crown,
  Lock,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const dietaryOptions = [
  "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo", 
  "Gluten-Free", "Dairy-Free", "Low-Carb", "Mediterranean", "Halal", "Kosher"
];

const commonAllergies = [
  "Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", 
  "Soy", "Fish", "Shellfish", "Sesame"
];

const healthGoalOptions = [
  "Lose Weight", "Build Muscle", "Maintain Weight", "Eat Healthier",
  "Increase Energy", "Better Sleep", "Reduce Sugar", "More Protein"
];

export default function EditProfilePage() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setDietaryPreferences(userProfile.dietaryPreferences || []);
      setAllergies(userProfile.allergies || []);
      setHealthGoals(userProfile.healthGoals || []);
    }
  }, [userProfile]);

  useEffect(() => {
    const devPremium = localStorage.getItem("fitfork_dev_premium");
    if (devPremium === "true") setIsPremium(true);
  }, []);

  const handlePhotoClick = () => {
    if (isPremium) {
      fileInputRef.current?.click();
    } else {
      setShowPremiumModal(true);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 256;
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

  const handleSave = async () => {
    setSaving(true);
    try {
      updateUserProfile({
        name,
        dietaryPreferences,
        allergies,
        healthGoals,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy("");
    }
  };

  const ChipSelector = ({ 
    options, 
    selected, 
    onToggle,
    color = "emerald"
  }: { 
    options: string[]; 
    selected: string[]; 
    onToggle: (item: string) => void;
    color?: string;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isSelected
                ? `bg-${color}-100 text-${color}-700 border-2 border-${color}-500`
                : "bg-gray-100 text-gray-600 border-2 border-transparent"
            }`}
            style={isSelected ? {
              backgroundColor: color === "emerald" ? "#d1fae5" : color === "red" ? "#fee2e2" : "#dbeafe",
              color: color === "emerald" ? "#047857" : color === "red" ? "#b91c1c" : "#1d4ed8",
              borderColor: color === "emerald" ? "#10b981" : color === "red" ? "#ef4444" : "#3b82f6",
            } : {}}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <PageContainer>
      <Header title="Edit Profile" showBack />

      <PageContent>
        <motion.div initial="initial" animate="animate">
          {/* Avatar Section */}
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handlePhotoClick}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden relative group"
              >
                {userProfile.profilePhoto ? (
                  <img
                    src={userProfile.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-white" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <button 
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200"
              >
                {isPremium ? (
                  <Camera size={16} className="text-gray-600" />
                ) : (
                  <Lock size={16} className="text-gray-400" />
                )}
              </button>
              {!isPremium && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                  <Crown size={12} className="text-white" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Premium Modal */}
          {showPremiumModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-500 mb-6">Custom profile photos are available with FitFork Premium.</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowPremiumModal(false)}
                      className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold rounded-xl"
                    >
                      Upgrade to Premium
                    </button>
                    <button
                      onClick={() => setShowPremiumModal(false)}
                      className="w-full py-3 text-gray-500"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Name */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <User size={20} className="text-emerald-500" />
                <p className="font-medium text-gray-900">Display Name</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </Card>
          </motion.div>

          {/* Dietary Preferences */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Leaf size={20} className="text-green-500" />
                <p className="font-medium text-gray-900">Dietary Preferences</p>
              </div>
              <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
              <ChipSelector
                options={dietaryOptions}
                selected={dietaryPreferences}
                onToggle={(item) => toggleItem(item, dietaryPreferences, setDietaryPreferences)}
                color="emerald"
              />
            </Card>
          </motion.div>

          {/* Allergies */}
          <motion.div variants={fadeUp}>
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} className="text-red-500" />
                <p className="font-medium text-gray-900">Allergies & Intolerances</p>
              </div>
              <p className="text-sm text-gray-500 mb-3">We'll warn you about these ingredients</p>
              <ChipSelector
                options={commonAllergies}
                selected={allergies}
                onToggle={(item) => toggleItem(item, allergies, setAllergies)}
                color="red"
              />
              
              {/* Custom allergy input */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  placeholder="Add custom allergy..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
                />
                <button
                  onClick={addCustomAllergy}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-xl"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Show custom allergies */}
              {allergies.filter(a => !commonAllergies.includes(a)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {allergies.filter(a => !commonAllergies.includes(a)).map((allergy) => (
                    <Badge key={allergy} variant="error" className="flex items-center gap-1">
                      {allergy}
                      <button onClick={() => setAllergies(allergies.filter(a => a !== allergy))}>
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Health Goals */}
          <motion.div variants={fadeUp}>
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Target size={20} className="text-blue-500" />
                <p className="font-medium text-gray-900">Health Goals</p>
              </div>
              <p className="text-sm text-gray-500 mb-3">What are you working towards?</p>
              <ChipSelector
                options={healthGoalOptions}
                selected={healthGoals}
                onToggle={(item) => toggleItem(item, healthGoals, setHealthGoals)}
                color="blue"
              />
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div variants={fadeUp}>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save size={18} />
                  Save Profile
                </span>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageContainer>
  );
}
