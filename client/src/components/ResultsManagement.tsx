import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Assessment } from "@shared/schema";
import { Loader2, FileDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface EnhancedAssessment extends Assessment {
  student?: {
    id: number;
    username: string;
    studentId?: string;
  };
  answeredQuestions: number;
  correctAnswers: number;
}

export default function ResultsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch assessment results
  const { data: assessments = [], isLoading } = useQuery<EnhancedAssessment[]>({
    queryKey: ['/api/assessments']
  });
  
  // Clear all results mutation
  const clearResultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/assessments").then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Results cleared",
        description: "All assessment results have been cleared successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear results",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Filter to only completed assessments
  const completedAssessments = assessments.filter((assessment: EnhancedAssessment) => assessment.isComplete);
  
  // Format time spent (in seconds) to HH:MM:SS
  const formatTimeSpent = (startTime: string | Date, endTime: string | Date) => {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    const diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Assessment Results</h2>
            <p className="text-neutral-600 mt-1">View student performance and assessment results</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                // Export to CSV
                const csv = [
                  // Headers
                  ['Student', 'Score', 'Questions', 'Time Spent', 'Completion Date'].join(','),
                  // Data
                  ...completedAssessments.map((assessment: EnhancedAssessment) => [
                    `"${assessment.student?.username || 'Unknown'}${assessment.student?.studentId ? ` (${assessment.student.studentId})` : ''}"`,
                    `${assessment.score || 0}%`,
                    `${assessment.correctAnswers || 0}/${assessment.answeredQuestions || 0}`,
                    `${assessment.startTime && assessment.endTime ? formatTimeSpent(assessment.startTime, assessment.endTime) : 'N/A'}`,
                    `${assessment.endTime ? format(new Date(assessment.endTime), 'MMM d, yyyy HH:mm') : 'N/A'}`
                  ].join(','))
                ].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `assessment-results-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <FileDown className="h-5 w-5 mr-1" />
              Export to CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={completedAssessments.length === 0}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-5 w-5 mr-1" />
              Clear Results
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Questions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Time Spent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Completion Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : completedAssessments.length > 0 ? (
                completedAssessments.map((assessment: EnhancedAssessment, index: number) => (
                  <tr key={assessment.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.student?.username || "Unknown"} 
                      {assessment.student?.studentId ? ` (${assessment.student.studentId})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (assessment.score || 0) >= 80
                          ? "bg-green-100 text-green-800"
                          : (assessment.score || 0) >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {assessment.score || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.correctAnswers || 0}/{assessment.answeredQuestions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.startTime && assessment.endTime 
                        ? formatTimeSpent(assessment.startTime, assessment.endTime)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.endTime 
                        ? format(new Date(assessment.endTime), "MMM d, yyyy HH:mm")
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                    No assessment results available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all assessment results from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearResultsMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {clearResultsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Clear Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
