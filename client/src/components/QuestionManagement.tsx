import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, BookA } from "lucide-react";
import AddQuestionForm from "./AddQuestionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

export default function QuestionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  // Fetch questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/questions'],
  });
  
  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData: Omit<Question, 'id'>) => {
      return apiRequest("POST", "/api/questions", questionData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Question added",
        description: "The question has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add question",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Question> }) => {
      return apiRequest("PUT", `/api/questions/${id}`, data).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Question updated",
        description: "The question has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update question",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Question deleted",
        description: "The question has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete question",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Add CS questions mutation
  const addCSQuestionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/questions/add-cs-questions").then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({
        title: "CS Questions Added",
        description: `Successfully added ${data.count || 'multiple'} computer science questions to the database.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add CS questions",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleAddQuestion = (questionData: Omit<Question, 'id'>) => {
    addQuestionMutation.mutate(questionData);
  };
  
  const handleUpdateQuestion = (questionData: Partial<Question>) => {
    if (!currentQuestion) return;
    
    updateQuestionMutation.mutate({
      id: currentQuestion.id,
      data: questionData,
    });
  };
  
  const handleDeleteQuestion = () => {
    if (!currentQuestion) return;
    
    deleteQuestionMutation.mutate(currentQuestion.id);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Question Management</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => addCSQuestionsMutation.mutate()}
            disabled={addCSQuestionsMutation.isPending}
          >
            {addCSQuestionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <BookA className="h-5 w-5 mr-1" />
            )}
            Add CS Questions
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-5 w-5 mr-1" />
            Add Question
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Difficulty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : questions.length > 0 ? (
              questions.map((question: Question, index: number) => (
                <tr key={question.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {question.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {question.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      question.type === "multiple-choice" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {question.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {question.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      question.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : question.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentQuestion(question);
                        setIsEditDialogOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentQuestion(question);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                  No questions available. Add your first question to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Question Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question for the assessment
            </DialogDescription>
          </DialogHeader>
          <AddQuestionForm 
            onSubmit={handleAddQuestion} 
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={addQuestionMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update question details
            </DialogDescription>
          </DialogHeader>
          {currentQuestion && (
            <AddQuestionForm
              initialData={currentQuestion}
              onSubmit={handleUpdateQuestion}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={updateQuestionMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question
              "{currentQuestion?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteQuestionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
