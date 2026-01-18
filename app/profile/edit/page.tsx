"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setDietaryPreferences(userProfile.dietaryPreferences || []);
      setAllergies(userProfile.allergies || []);
      setHealthGoals(userProfile.healthGoals || []);
    }
  }, [userProfile]);

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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <User size={40} className="text-white" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                <Camera size={16} className="text-gray-600" />
              </button>
            </div>
          </motion.div>

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
