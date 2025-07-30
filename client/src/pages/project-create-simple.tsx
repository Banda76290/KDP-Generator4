import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Folder, Plus, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const projectFormSchema = insertProjectSchema.pick({ name: true, description: true }).extend({
  attachExistingBook: z.boolean().optional(),
  selectedBookId: z.string().optional(),
  createNewBook: z.boolean().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function CreateProject() {
  const [, setLocation] = useLocation();
  const [showBookOptions, setShowBookOptions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      attachExistingBook: false,
      createNewBook: false,
    },
  });

  // Fetch existing books for attachment option
  const { data: existingBooks = [] } = useQuery({
    queryKey: ["/api/books"],
    enabled: showBookOptions,
  });

  // Separate available and attached books
  const sortedBooks = (existingBooks as any[]).sort((a, b) => {
    // Put available books first, then attached books
    const aAttached = a.projectId ? 1 : 0;
    const bAttached = b.projectId ? 1 : 0;
    if (aAttached !== bAttached) {
      return aAttached - bAttached;
    }
    // Then sort alphabetically within each group
    return a.title.localeCompare(b.title);
  });

  const createProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      console.log('Creating project:', data);
      
      // Create the project first
      const project = await apiRequest("POST", "/api/projects", {
        name: data.name,
        description: data.description,
      });
      
      console.log('Project created:', project);
      
      // Handle book attachment/creation
      if (data.attachExistingBook && data.selectedBookId) {
        // Check if book is already attached to a project
        const selectedBook = existingBooks.find((book: any) => book.id === data.selectedBookId);
        if (selectedBook?.projectId) {
          throw new Error("This book is already attached to another project. Please select a different book.");
        }
        
        // Attach existing book to project
        await apiRequest("PATCH", `/api/books/${data.selectedBookId}`, {
          projectId: project.id,
        });
      } else if (data.createNewBook) {
        // Redirect to book creation with project pre-selected
        setLocation(`/books/create?projectId=${project.id}`);
        return project;
      }
      
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "Your project has been created successfully.",
      });
      
      // Only redirect to projects if we're not going to book creation
      if (!form.getValues("createNewBook")) {
        setLocation("/projects");
      }
    },
    onError: (error) => {
      console.error('Project creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    // Show book options once name is entered
    if (value.trim() && !showBookOptions) {
      setShowBookOptions(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setLocation("/projects")}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
              <div className="flex items-center space-x-3">
                <Folder className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Create New Project</h1>
                  <p className="text-muted-foreground">
                    Create a project to organize your KDP books
                  </p>
                </div>
              </div>
            </div>

            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>
                  A project allows you to group multiple books (ebook, paperback, audiobook) under the same theme or series.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit((data) => createProject.mutate(data))} className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      {...form.register("name")}
                      placeholder="Ex: Google Analytics Guide, Fantasy Romance Series..."
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="mt-1"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  {/* Project Description */}
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      {...form.register("description")}
                      placeholder="Briefly describe your project..."
                      rows={3}
                      className="resize-none mt-1"
                    />
                  </div>

                  {/* Book Options - Only show after name is entered */}
                  {showBookOptions && (
                    <Card className="border-dashed">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Project Books
                        </CardTitle>
                        <CardDescription>
                          You can attach an existing book or create a new book for this project.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Attach Existing Book */}
                        {Array.isArray(existingBooks) && existingBooks.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="attachExisting"
                                checked={form.watch("attachExistingBook")}
                                onCheckedChange={(checked) => {
                                  form.setValue("attachExistingBook", !!checked);
                                  if (checked) {
                                    form.setValue("createNewBook", false);
                                  }
                                }}
                              />
                              <Label htmlFor="attachExisting">Attach an existing book</Label>
                            </div>
                            
                            {form.watch("attachExistingBook") && (
                              <Select 
                                value={form.watch("selectedBookId") || ""} 
                                onValueChange={(value) => form.setValue("selectedBookId", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a book" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sortedBooks.map((book: any) => {
                                    const isAttached = !!book.projectId;
                                    const displayText = isAttached 
                                      ? `${book.title} (Already attached to a project)` 
                                      : `${book.title} (${book.format})`;
                                    
                                    return (
                                      <SelectItem 
                                        key={book.id} 
                                        value={book.id}
                                        disabled={isAttached}
                                        className={isAttached ? "opacity-50 cursor-not-allowed" : ""}
                                      >
                                        {displayText}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        {/* Create New Book */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="createNew"
                            checked={form.watch("createNewBook")}
                            onCheckedChange={(checked) => {
                              form.setValue("createNewBook", !!checked);
                              if (checked) {
                                form.setValue("attachExistingBook", false);
                                form.setValue("selectedBookId", "");
                              }
                            }}
                          />
                          <Label htmlFor="createNew">Create a new book for this project</Label>
                        </div>

                        {!form.watch("attachExistingBook") && !form.watch("createNewBook") && (
                          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                            💡 You can add books later from the project page
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/projects")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProject.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {createProject.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          {form.watch("createNewBook") ? "Create and Add Book" : "Create Project"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}