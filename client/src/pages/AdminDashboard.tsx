import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminTabs from "@/components/AdminTabs";
import QuestionManagement from "@/components/QuestionManagement";
import StudentManagement from "@/components/StudentManagement";
import ResultsManagement from "@/components/ResultsManagement";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

type TabType = "questions" | "students" | "results";

interface AdminDashboardProps {
  onLogout: () => Promise<void>;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("questions");

  const handleLogout = async () => {
    await onLogout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <BackButton to="/" />
          <h1 className="text-xl font-semibold text-neutral-800">Admin Dashboard</h1>
        </div>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      {/* Admin Tabs */}
      <div className="p-6">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "questions" && <QuestionManagement />}
          {activeTab === "students" && <StudentManagement />}
          {activeTab === "results" && <ResultsManagement />}
        </div>
      </div>
    </div>
  );
}
