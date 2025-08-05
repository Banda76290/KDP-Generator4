import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { z } from "zod";
import Layout from "@/components/Layout";

const projectFormSchema = insertProjectSchema.pick({ name: true, description: true });

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function EditProject() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract project ID from URL
  const projectId = location.split('/').pop();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Populate form when project data is loaded
  useEffect(() => {
    if (project) {
      form.reset({
        name: (project as any).name || "",
        description: (project as any).description || "",
      });
    }
  }, [project, form]);

  const updateProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      console.log('Updating project:', projectId, data);
      
      const updatedProject = await apiRequest(`/api/projects/${projectId}`, { method: "PUT", body: JSON.stringify({ name: data.name,
        description: data.description, })});
      
      console.log('Project updated:', updatedProject);
      return updatedProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast.success({
        title: "Project Updated",
        description: "Your project has been updated successfully.",
      });
      setLocation("/projects");
    },
    onError: (error) => {
      console.error('Project update error:', error);
      toast.error({
        title: "Error",
        description: error.message || "Failed to update project",
      });
    },
  });

  if (projectLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!project) { return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <Button onClick={() => setLocation("/projects")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <ArrowLeft 
                className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" 
                onClick={ () => setLocation("/projects") 
              />
              <Folder className="w-6 h-6 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
                <p className="text-gray-600">Update your project details</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
              <div className="p-6">
                <form onSubmit={ form.handleSubmit((data) => updateProject.mutate(data )}>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Information</CardTitle>
                        <CardDescription>
                          Basic details about your project
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="name">Project Name</Label>
                          <Input
                            id="name"
                            { ...form.register("name" }
                            placeholder="Enter project name..."
                            className="mt-1"
                          />
                          {form.formState.errors.name && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            { ...form.register("description" }
                            placeholder="Describe your project..."
                            rows={4}
                            className="mt-1"
                          />
                          {form.formState.errors.description && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.description.message}
                            </p>
                          )}
                        </div>


                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t mt-6">
                    <Button type="button" variant="outline" onClick={ ()} => setLocation("/projects")>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProject.isPending}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      { updateProject.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Project"
                       }
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
    </Layout>
  );
}