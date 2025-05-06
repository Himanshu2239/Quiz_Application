import { FC } from "react";
import { HelpCircle, Users, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "questions" | "students" | "results";

interface AdminTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const AdminTabs: FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-neutral-900 p-1 inline-flex rounded-md">
      <button
        className={cn(
          "flex items-center px-4 py-2 rounded-md",
          activeTab === "questions" 
            ? "text-white bg-neutral-800" 
            : "text-neutral-400 hover:text-neutral-300"
        )}
        onClick={() => onTabChange("questions")}
      >
        <HelpCircle className="h-5 w-5 mr-2" />
        Questions
      </button>
      <button
        className={cn(
          "flex items-center px-4 py-2 rounded-md",
          activeTab === "students" 
            ? "text-white bg-neutral-800" 
            : "text-neutral-400 hover:text-neutral-300"
        )}
        onClick={() => onTabChange("students")}
      >
        <Users className="h-5 w-5 mr-2" />
        Students
      </button>
      <button
        className={cn(
          "flex items-center px-4 py-2 rounded-md",
          activeTab === "results" 
            ? "text-white bg-neutral-800" 
            : "text-neutral-400 hover:text-neutral-300"
        )}
        onClick={() => onTabChange("results")}
      >
        <BarChart className="h-5 w-5 mr-2" />
        Results
      </button>
    </div>
  );
};

export default AdminTabs;
