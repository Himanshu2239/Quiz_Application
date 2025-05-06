import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import QuestionRenderer from "@/components/QuestionRenderer";
import useTimer from "@/hooks/useTimer";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Question, Answer } from "@shared/schema";
import BackButton from "@/components/BackButton";

interface AssessmentResponse {
  assessmentId: string; // Updated to string for MongoDB compatibility
  questions?: Question[];
  isComplete?: boolean;
  timeRemaining?: number;
  isRestricted?: boolean; // New field to indicate if student is restricted from taking assessment
  waitTime?: {
    hours: number;
    minutes: number;
  };
  message?: string; // Server response message
}

interface StudentAssessmentProps {
  onLogout: () => Promise<void>;
}

export default function Assessment({ onLogout }: StudentAssessmentProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Start/resume assessment query
  const { 
    data: assessmentData,
    isLoading: isStartingAssessment,
    isError: startError,
    error: startErrorDetails,
    refetch: refetchAssessment
  } = useQuery<AssessmentResponse>({
    queryKey: ['/api/assessments/start'],
    queryFn: async (): Promise<AssessmentResponse> => {
      const response = await fetch('/api/assessments/start', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to start assessment: ' + await response.text());
      }
      return response.json();
    },
    enabled: true,
    retry: 1,
    staleTime: Infinity
  });

  // Set up timer with persistence
  const handleTimerUpdate = useCallback((seconds: number) => {
    if (assessmentId && !isCompleted) {
      // Persist timer to server
      fetch(`/api/assessments/${assessmentId}/update-timer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          timeRemaining: seconds
        })
      })
      .then(response => {
        // If we get a 403 Not authorized error, the ID might be wrong - we need to refresh
        if (response.status === 403) {
          console.warn("Assessment ID might be incorrect, consider refreshing");
          
          // We don't want to interrupt the user constantly, so just log a warning for now
          // If they try to submit an answer, they'll get the refresh button
        }
        return response;
      })
      .catch(error => {
        console.error("Failed to persist timer:", error);
      });
    }
  }, [assessmentId, isCompleted]);

  const { 
    seconds: timeRemaining, 
    isRunning, 
    startTimer, 
    pauseTimer,
    updateTime
  } = useTimer(7200, handleTimerUpdate); // Default 2 hours with auto-persist callback

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize assessment data
  useEffect(() => {
    if (assessmentData) {
      // Check if user is restricted from taking assessment
      if (assessmentData.isRestricted) {
        // This will be handled in the render method
        return;
      }
      
      setAssessmentId(assessmentData.assessmentId);
      setQuestions(assessmentData.questions || []);
      setIsCompleted(assessmentData.isComplete || false);
      
      // Initialize user answers from existing studentAnswers in the questions
      const initialAnswers = new Map<string, string>();
      if (assessmentData.questions) {
        assessmentData.questions.forEach(question => {
          if (question.studentAnswer) {
            // In MongoDB, question.id is always a string
            initialAnswers.set(question.id, question.studentAnswer);
          }
        });
      }
      setUserAnswers(initialAnswers);
      
      // Initialize the timer with remaining time from the server
      if (assessmentData.timeRemaining !== undefined) {
        console.log("Setting timer to", assessmentData.timeRemaining, "seconds");
        updateTime(assessmentData.timeRemaining);
        
        // Only start if it's not already complete
        if (!assessmentData.isComplete) {
          // Short delay to ensure the time is set before starting
          setTimeout(() => {
            startTimer();
            console.log("Timer started with", assessmentData.timeRemaining, "seconds");
          }, 100);
        }
      } else {
        console.warn("No time remaining data received from server");
      }
    }
  }, [assessmentData, startTimer, updateTime]);

  // Update check for assessment completion status
  useEffect(() => {
    if (!assessmentId || !isRunning || isCompleted) return;
    
    // This effect now just checks if the assessment is marked as complete on the server
    // Timer updates are handled by the handleTimerUpdate callback
    const checkCompletionStatus = async () => {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const assessment = await response.json();
          if (assessment.isComplete) {
            setIsCompleted(true);
            pauseTimer();
            if (assessment.score !== undefined) {
              setScore(assessment.score);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check assessment status:", error);
      }
    };
    
    // Check once when component mounts
    checkCompletionStatus();
    
  }, [assessmentId, isRunning, isCompleted, pauseTimer]);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string | number, answer: string }) => {
      if (!assessmentId) {
        throw new Error('No active assessment');
      }
      
      // Convert questionId to string for MongoDB compatibility
      const questionIdStr = typeof questionId === 'number' ? questionId.toString() : questionId;
      
      const response = await fetch(`/api/assessments/${assessmentId}/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          assessmentId,
          questionId: questionIdStr,
          answer
        })
      });
      
      if (!response.ok) {
        // Parse the error response
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Unknown error occurred';
        } catch (e) {
          // If we can't parse the JSON, just use the response text
          errorMessage = await response.text();
        }
        
        // Check if this is an authorization error and handle it gracefully
        if (response.status === 403 && errorMessage.includes('Not authorized')) {
          // Refetch the assessment to get the current user's own assessment ID
          throw new Error('Authorization error. Please refresh the page to continue with your assessment.');
        } else {
          throw new Error(`Failed to submit answer: ${errorMessage}`);
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Answer submitted",
        description: `${data.answeredQuestions} of ${data.totalQuestions} questions answered`,
      });

      if (data.score !== undefined) {
        setIsCompleted(true);
        setScore(data.score);
        pauseTimer();
        toast({
          title: "Assessment completed!",
          description: `Your score: ${data.score}%`,
        });
      }
    },
    onError: (error) => {
      // If error suggests refreshing, offer a button to do so
      if (error instanceof Error && error.message.includes('refresh the page')) {
        toast({
          title: "Assessment needs refresh",
          description: (
            <div className="flex flex-col gap-2">
              <span>{error.message}</span>
              <Button 
                variant="outline" 
                onClick={() => refetchAssessment()}
                className="mt-2"
              >
                Refresh Assessment
              </Button>
            </div>
          ),
          variant: "destructive",
          duration: 10000, // Extra time to read and click
        });
      } else {
        toast({
          title: "Failed to submit answer",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    }
  });

  // Complete assessment (when time runs out or manually submitted)
  const completeAssessmentMutation = useMutation<any, Error, boolean>({
    mutationFn: async (isManual) => {
      if (!assessmentId) {
        throw new Error('No active assessment');
      }
      
      const response = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          timeRemaining: isManual ? timeRemaining : 0
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to complete assessment: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      const isManual = variables; // The variable we passed in
      setIsCompleted(true);
      setScore(data.score);
      
      toast({
        title: isManual ? "Assessment Completed!" : "Time's up!",
        description: isManual 
          ? `Your score: ${data.score}%. Results have been recorded.` 
          : "Your assessment has been submitted",
        variant: isManual ? "default" : "destructive",
      });
    }
  });

  // Handle time up
  useEffect(() => {
    if (timeRemaining <= 0 && !isCompleted) {
      pauseTimer();
      completeAssessmentMutation.mutate(false);
    }
  }, [timeRemaining, isCompleted, pauseTimer, completeAssessmentMutation]);
  
  // Handle manual assessment submission
  const handleSubmitAssessment = async () => {
    if (assessmentId && !isCompleted) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to submit your assessment? You have answered ${userAnswers.size} out of ${questions.length} questions.`
      );
      
      if (confirmed) {
        pauseTimer();
        completeAssessmentMutation.mutate(true);
      }
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string | number, answer: string) => {
    // Convert questionId to string for MongoDB compatibility
    const questionIdStr = typeof questionId === 'number' ? questionId.toString() : questionId;
    
    setUserAnswers(prev => {
      const updated = new Map(prev);
      updated.set(questionIdStr, answer);
      return updated;
    });

    submitAnswerMutation.mutate({ questionId: questionIdStr, answer });
  };
  
  // Handle clearing an answer
  const handleClearAnswer = (questionId: string | number) => {
    // Convert questionId to string for MongoDB compatibility
    const questionIdStr = typeof questionId === 'number' ? questionId.toString() : questionId;
    
    setUserAnswers(prev => {
      const updated = new Map(prev);
      updated.delete(questionIdStr);
      return updated;
    });
    
    // Submit empty string to clear the answer on the server
    submitAnswerMutation.mutate({ questionId: questionIdStr, answer: "" });
    
    toast({
      title: "Response Cleared",
      description: "Your answer has been cleared",
    });
  };

  // Navigation handlers
  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1));
  };

  // Calculate progress
  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round((userAnswers.size / questions.length) * 100);
  };

  const handleLogout = async () => {
    if (assessmentId && !isCompleted) {
      // Save current timer before logging out
      try {
        const response = await fetch(`/api/assessments/${assessmentId}/update-timer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            timeRemaining
          })
        });
        
        if (!response.ok) {
          // Just log the error but don't block logout
          // If it's a 403, it might be because we're trying to update someone else's assessment
          try {
            const errorData = await response.json();
            console.error('Failed to update timer before logout:', errorData);
            // If we can't save the timer, it's not critical - the user is logging out anyway
          } catch (e) {
            const errorText = await response.text();
            console.error('Failed to update timer before logout:', errorText);
          }
        }
      } catch (error) {
        console.error('Error saving timer before logout:', error);
      }
    }
    
    // Proceed with logout regardless of timer update success
    await onLogout();
  };

  // Show loading state
  if (isStartingAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (startError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-6">
            {startErrorDetails instanceof Error ? startErrorDetails.message : "Failed to load the assessment. Please try again."}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Restricted assessment state (when student has already completed an assessment recently)
  if (assessmentData?.isRestricted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <h1 className="text-xl font-semibold text-neutral-800">Assessment Restricted</h1>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </header>
        
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">
              You've recently completed an assessment
            </h2>
            
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-flex items-center flex-col">
              <Clock className="h-12 w-12 text-yellow-600 mb-4" />
              <p className="text-yellow-800 text-lg font-medium mb-2">
                Please wait before starting a new assessment
              </p>
              <p className="text-yellow-700">
                {assessmentData.message || "You need to wait before taking another assessment"}
              </p>
              {assessmentData.waitTime && (
                <div className="mt-4 bg-white rounded-full px-6 py-3 border border-yellow-200">
                  <span className="font-bold">
                    {assessmentData.waitTime.hours} hours and {assessmentData.waitTime.minutes} minutes remaining
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-neutral-600 mb-6">
              This restriction is in place to maintain the integrity of the assessment process.
            </p>
            
            <Button onClick={handleLogout} className="px-8">
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment completed state
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <h1 className="text-xl font-semibold text-neutral-800">Assessment Complete</h1>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">
              You have completed the assessment!
            </h2>
            
            {score !== null && (
              <div className="mb-6">
                <div className="text-5xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-neutral-600">Your final score</p>
              </div>
            )}
            
            <p className="text-neutral-600 mb-8">
              Thank you for completing the Computer Science assessment. Your results have been recorded.
            </p>
            
            <Button onClick={handleLogout}>
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular assessment view
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton to="/" />
          <h1 className="text-xl font-semibold text-neutral-800">Computer Science Assessment</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const confirmed = window.confirm("This will refresh your assessment. Any unsaved progress may be lost. Continue?");
              if (confirmed) {
                refetchAssessment();
              }
            }}
            className="text-xs"
          >
            Refresh Assessment
          </Button>
        </div>
        <div className="flex items-center">
          <div className="mr-6 bg-yellow-100 text-yellow-800 py-1 px-3 rounded-md flex items-center">
            <Clock className="h-5 w-5 mr-1" />
            <span className="font-medium">{formatTime(timeRemaining)}</span>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {currentQuestion ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                <p className="text-neutral-600 mt-1">
                  Category: {currentQuestion.category}
                </p>
              </div>
              <div className="bg-neutral-100 rounded-full px-3 py-1">
                <span className="text-neutral-600 text-sm font-medium">
                  {calculateProgress()}% Complete
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <QuestionRenderer
                question={currentQuestion}
                selectedAnswer={userAnswers.get(currentQuestion.id)}
                onSelectAnswer={(answer) => handleAnswerSelect(currentQuestion.id, answer)}
                onClearAnswer={() => handleClearAnswer(currentQuestion.id)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
              
              {userAnswers.size >= 3 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="default" 
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                    onClick={handleSubmitAssessment}
                  >
                    Submit Assessment
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-neutral-800 mb-4">No questions available</h3>
            <p className="text-neutral-600 mb-6">
              There are no questions available for this assessment.
            </p>
            <Button onClick={handleLogout}>
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}