import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle } from "lucide-react";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export default function Login({ onLogin }: LoginProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    const success = await onLogin(data.username, data.password);
    setIsLoading(false);
    
    if (success) {
      // Login successful, will be redirected by the parent component
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Section (Dark) */}
      <div className="w-full md:w-1/2 bg-neutral-900 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register" disabled className="text-neutral-400">
                Register Student
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                  <p className="text-neutral-400 mb-6">
                    Enter your credentials to access the assessment platform.
                  </p>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-300">Username / Student ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your username or ID"
                                {...field}
                                className="bg-neutral-800 border-neutral-700 text-white focus:ring-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-300">Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                {...field}
                                className="bg-neutral-800 border-neutral-700 text-white focus:ring-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-secondary"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Section (Blue) */}
      <div className="hidden md:block md:w-1/2 bg-primary">
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-md text-white">
            <h1 className="text-3xl font-bold mb-4">
              Computer Science Assessment Platform
            </h1>
            <p className="text-blue-100 mb-8">
              Welcome to the CS placement test platform. This assessment consists of 40
              medium-difficulty computer science questions and has a time limit of 2 hours.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <p>
                  Multiple-choice and coding questions covering algorithms, data structures,
                  and more
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <p>Real-time progress tracking and automatic scoring</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <p>Strict 2-hour time limit with warnings as time runs low</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
