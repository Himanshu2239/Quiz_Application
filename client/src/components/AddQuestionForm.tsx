import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Extend the schema for the form
const questionFormSchema = insertQuestionSchema.extend({
  options: z.array(z.string()).optional(), // Keep options optional for the form
  option1: z.string().min(1, "Option 1 is required").optional(),
  option2: z.string().min(1, "Option 2 is required").optional(),
  option3: z.string().min(1, "Option 3 is required").optional(),
  option4: z.string().min(1, "Option 4 is required").optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface AddQuestionFormProps {
  initialData?: QuestionFormData;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function AddQuestionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddQuestionFormProps) {
  // Parse initial options if provided
  const defaultValues: Partial<QuestionFormData> = {
    title: "",
    content: "",
    type: "multiple-choice",
    category: "Algorithms",
    difficulty: "medium",
    correctAnswer: "",
    ...initialData,
  };

  // Add individual options to form if they exist
  if (initialData?.options?.length) {
    defaultValues.option1 = initialData.options[0] || "";
    defaultValues.option2 = initialData.options[1] || "";
    defaultValues.option3 = initialData.options[2] || "";
    defaultValues.option4 = initialData.options[3] || "";
  }

  // Form setup
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues,
  });

  const questionType = form.watch("type");

  // Handle form submission
  const handleSubmit = (data: QuestionFormData) => {
    const formattedData: any = { ...data };
    
    // Format options array for multiple choice questions
    if (data.type === "multiple-choice") {
      formattedData.options = [
        data.option1,
        data.option2,
        data.option3,
        data.option4,
      ].filter(Boolean);
      
      // Clean up form-specific fields
      delete formattedData.option1;
      delete formattedData.option2;
      delete formattedData.option3;
      delete formattedData.option4;
    } else {
      // For code questions, we don't need options
      formattedData.options = [];
    }
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter question title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the question text"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Algorithms">Algorithms</SelectItem>
                    <SelectItem value="Data Structures">Data Structures</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Databases">Databases</SelectItem>
                    <SelectItem value="Networking">Networking</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {questionType === "multiple-choice" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option1") || ""} id="option1" />
                        <FormField
                          control={form.control}
                          name="option1"
                          render={({ field }) => (
                            <FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option2") || ""} id="option2" />
                        <FormField
                          control={form.control}
                          name="option2"
                          render={({ field }) => (
                            <FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 2" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option3") || ""} id="option3" />
                        <FormField
                          control={form.control}
                          name="option3"
                          render={({ field }) => (
                            <FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 3" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option4") || ""} id="option4" />
                        <FormField
                          control={form.control}
                          name="option4"
                          render={({ field }) => (
                            <FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 4" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {questionType === "code" && (
          <FormField
            control={form.control}
            name="correctAnswer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer (Code Solution)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the correct code solution"
                    rows={8}
                    className="font-mono"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update" : "Save"} Question
          </Button>
        </div>
      </form>
    </Form>
  );
}
