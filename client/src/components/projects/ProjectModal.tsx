import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertProjectSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from "lucide-react";
import DynamicFields from "@/components/forms/DynamicFields";
import type { ProjectWithRelations } from "@shared/schema";

const projectFormSchema = insertProjectSchema.extend({
  contributors: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
  })).optional(),
  formats: z.array(z.enum(["ebook", "paperback", "hardcover"])).min(1, "Select at least one format"),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectWithRelations | null;
}

export default function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [useAI, setUseAI] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      categories: [],
      keywords: [],
      useAI: false,
      aiPrompt: "",
      aiContentType: "",
      formats: [],
      contributors: [],
    },
  });

  // Reset form when project changes or modal opens
  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        subtitle: project.subtitle || "",
        description: project.description || "",
        categories: project.categories || [],
        keywords: project.keywords || [],
        useAI: project.useAI || false,
        aiPrompt: project.aiPrompt || "",
        aiContentType: project.aiContentType || "",
        formats: project.formats || [],
        contributors: project.contributors?.map(c => ({ name: c.name, role: c.role })) || [],
      });
      setUseAI(project.useAI || false);
    } else {
      form.reset({
        title: "",
        subtitle: "",
        description: "",
        categories: [],
        keywords: [],
        useAI: false,
        aiPrompt: "",
        aiContentType: "",
        formats: [],
        contributors: [],
      });
      setUseAI(false);
    }
  }, [project, form, isOpen]);

  const createMutation = useMutation({ mutationFn: async (data: ProjectFormData) => {
      return await apiRequest("/api/projects", { method: "POST", body: JSON.stringify(data });
    },
    onSuccess: async () => {
      toast({
        title: "Project Created",
        description: "Your project has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return await apiRequest(`/api/projects/${project?.id}`, { method: "PUT", body: JSON.stringify(data });
    },
    onSuccess: async () => {
      toast({
        title: "Project Updated",
        description: "Your project has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (project) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Temporarily allow AI access for all users for testing
  const isPremiumUser = true; // user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'pro';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={ form.handleSubmit(onSubmit } className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  { ...form.register("title" }
                  placeholder="Enter book title"
                  className="mt-1"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  { ...form.register("subtitle" }
                  placeholder="Enter subtitle"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                { ...form.register("description" }
                placeholder="Enter book description"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* AI Integration Toggle */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={useAI}
                  onCheckedChange={(checked) => {
                    setUseAI(checked);
                    form.setValue("useAI", checked);
                  }}
                  disabled={!isPremiumUser}
                />
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Use AI Assistant
                  </Label>
                  <p className="text-xs text-gray-600">
                    Enable AI-powered content generation for this project
                  </p>
                </div>
              </div>
              <Badge className="bg-secondary text-secondary-foreground">PRO</Badge>
            </div>
          </div>

          {/* AI Fields (Conditional) */}
          { useAI && isPremiumUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="aiContentType">AI Content Type</Label>
                <Select onValueChange={(value) => form.setValue("aiContentType", value }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="structure">Generate book structure</SelectItem>
                    <SelectItem value="description">Improve descriptions</SelectItem>
                    <SelectItem value="marketing">Create marketing copy</SelectItem>
                    <SelectItem value="chapters">Generate chapter outlines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="aiPrompt">AI Prompt</Label>
                <Textarea
                  id="aiPrompt"
                  { ...form.register("aiPrompt" }
                  placeholder="Describe what you want the AI to generate..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Contributors Section */}
          <DynamicFields
            label="Contributors"
            fields={form.watch("contributors") || []}
            onFieldsChange={ (fields) => form.setValue("contributors", fields }
            renderField={(field, index, updateField, removeField) => (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Input
                  value={field.name}
                  onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                  placeholder="Contributor name"
                  className="flex-1"
                />
                <Select
                  value={field.role}
                  onValueChange={(value) => updateField(index, { ...field, role: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="co-author">Co-author</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="illustrator">Illustrator</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={ () => removeField(index }
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            defaultField={{ name: "", role: "" }}
          />

          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Publication Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "ebook", label: "eBook", description: "Digital format" },
                { value: "paperback", label: "Paperback", description: "Print on demand" },
                { value: "hardcover", label: "Hardcover", description: "Premium format" }
              ].map((format) => (
                <div key={format.value} className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={form.watch("formats")?.includes(format.value as any) || false}
                    onCheckedChange={(checked) => {
                      const currentFormats = form.watch("formats") || [];
                      if (checked) {
                        form.setValue("formats", [...currentFormats, format.value as any]);
                      } else {
                        form.setValue("formats", currentFormats.filter(f => f !== format.value));
                      }
                    }}
                  />
                  <div>
                    <Label className="text-sm font-medium text-gray-900">
                      {format.label}
                    </Label>
                    <p className="text-xs text-gray-600">{format.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.formats && (
              <p className="text-sm text-red-600">
                {form.formState.errors.formats.message}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              { createMutation.isPending || updateMutation.isPending
                ? (project ? "Updating..." : "Creating...")
                : (project ? "Update Project" : "Create Project" }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
