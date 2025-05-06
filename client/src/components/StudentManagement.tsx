import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2 } from "lucide-react";
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
import RegisterStudentForm from "./RegisterStudentForm";
import { format } from "date-fns";

export default function StudentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<User | null>(null);
  
  // Fetch students
  const { data: students = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/students'],
  });
  
  // Register student mutation
  const registerStudentMutation = useMutation<User, Error, any>({
    mutationFn: async (studentData: any) => {
      return apiRequest("POST", "/api/students/register", studentData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsRegisterDialogOpen(false);
      toast({
        title: "Student registered",
        description: "The student has been registered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to register student",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete student mutation
  const deleteStudentMutation = useMutation<{message: string}, Error, string>({
    mutationFn: async (studentId: string) => {
      return apiRequest("DELETE", `/api/students/${studentId}`).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDeleteDialogOpen(false);
      setCurrentStudent(null);
      toast({
        title: "Student removed",
        description: "The student has been removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove student",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const handleRegisterStudent = (studentData: any) => {
    registerStudentMutation.mutate(studentData);
  };
  
  const handleDeleteClick = (student: User) => {
    setCurrentStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">Student Management</h2>
          <Button onClick={() => setIsRegisterDialogOpen(true)}>
            <Plus className="h-5 w-5 mr-1" />
            Register Student
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Student ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Registration Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student: User, index: number) => (
                  <tr key={student.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{student.studentId || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{student.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{student.email || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {student.registrationDate ? format(new Date(student.registrationDate), "MMM d, yyyy") : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(student)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1">Remove</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                    No students registered yet. Register your first student to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Register Student Dialog */}
        <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
              <DialogDescription>
                Create a new student account for the assessment platform
              </DialogDescription>
            </DialogHeader>
            <RegisterStudentForm
              onSubmit={handleRegisterStudent}
              onCancel={() => setIsRegisterDialogOpen(false)}
              isSubmitting={registerStudentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the student
              {currentStudent ? ` ${currentStudent.username}` : ''} and all their assessment data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => currentStudent && deleteStudentMutation.mutate(currentStudent.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteStudentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remove Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
