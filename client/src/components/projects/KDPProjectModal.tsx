import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { z } from "zod";

interface KDPProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Contributor {
  id: string;
  role: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

const kdpFormSchema = insertProjectSchema.extend({
  formats: z.array(z.enum(["ebook", "paperback", "hardcover"])).optional(),
}).partial();

type KDPFormData = z.infer<typeof kdpFormSchema>;

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Chinese (Simplified)", 
  "Chinese (Traditional)", "Korean", "Arabic", "Hindi", "Russian", "Dutch", "Swedish", "Norwegian"
];

const marketplaces = [
  "Amazon.com", "Amazon.co.uk", "Amazon.de", "Amazon.fr", "Amazon.es", "Amazon.it", 
  "Amazon.co.jp", "Amazon.ca", "Amazon.com.au", "Amazon.in", "Amazon.com.br", "Amazon.com.mx"
];

const readingAges = [
  "Baby-2 years", "3-5 years", "6-8 years", "9-12 years", "13-17 years", "18+ years"
];

const contributorRoles = [
  "Author", "Co-author", "Editor", "Illustrator", "Translator", "Photographer", "Designer"
];

export function KDPProjectModal({ isOpen, onClose }: KDPProjectModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<KDPFormData>({
    resolver: zodResolver(kdpFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      language: "English",
      authorFirstName: "",
      authorLastName: "",
      publishingRights: "owned",
      hasExplicitContent: false,
      primaryMarketplace: "Amazon.com",
      isLowContentBook: false,
      isLargePrintBook: false,
      previouslyPublished: false,
      releaseOption: "immediate",
      useAI: false,
      formats: [],
      categories: [],
      keywords: [],
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: KDPFormData) => {
      const projectData = {
        ...data,
        categories,
        keywords,
      };
      
      console.log('Sending project data:', projectData);
      const project = await apiRequest("POST", "/api/projects", projectData);
      console.log('Received project response:', project);
      
      // Create contributors if any
      if (contributors.length > 0) {
        for (const contributor of contributors) {
          await apiRequest("POST", "/api/contributors", {
            projectId: project.id,
            name: `${contributor.firstName} ${contributor.lastName}`.trim(),
            role: contributor.role,
          });
        }
      }
      
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "Your KDP project has been created successfully.",
      });
      onClose();
      form.reset();
      setContributors([]);
      setKeywords([]);
      setCategories([]);
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

  const addContributor = () => {
    const newContributor: Contributor = {
      id: Date.now().toString(),
      role: "Author",
      prefix: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
    };
    setContributors([...contributors, newContributor]);
  };

  const updateContributor = (id: string, field: keyof Contributor, value: string) => {
    setContributors(contributors.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !keywords.includes(keyword.trim()) && keywords.length < 7) {
      setKeywords([...keywords, keyword.trim()]);
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addCategory = (category: string) => {
    if (category.trim() && !categories.includes(category.trim()) && categories.length < 3) {
      setCategories([...categories, category.trim()]);
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Create KDP Project</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={form.handleSubmit((data) => createProject.mutate({ ...data, status: 'in_review' }))}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="author">Author & Rights</TabsTrigger>
                <TabsTrigger value="audience">Audience & Market</TabsTrigger>
                <TabsTrigger value="publishing">Publishing</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Basic Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Language */}
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={form.watch("language") ?? ""} onValueChange={(value) => form.setValue("language", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Book Title */}
                    <div>
                      <Label htmlFor="title">Book Title</Label>
                      <Input
                        {...form.register("title")}
                        placeholder="From Zero to Hero with Google Analytics"
                        className="mt-1"
                      />
                      {form.formState.errors.title && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    {/* Subtitle */}
                    <div>
                      <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                      <Input
                        {...form.register("subtitle")}
                        placeholder="Turn statistics into winning strategies"
                        className="mt-1"
                      />
                    </div>

                    {/* Series */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="seriesTitle">Series Title (Optional)</Label>
                        <Input
                          {...form.register("seriesTitle")}
                          placeholder="From Zero to Hero"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="seriesNumber">Series Number</Label>
                        <Input
                          {...form.register("seriesNumber", { valueAsNumber: true })}
                          type="number"
                          placeholder="1"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Edition Number */}
                    <div>
                      <Label htmlFor="editionNumber">Edition Number (Optional)</Label>
                      <Input
                        {...form.register("editionNumber")}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="author" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Primary Author</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <Label>Prefix</Label>
                        <Input
                          {...form.register("authorPrefix")}
                          placeholder="Dr."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>First Name</Label>
                        <Input
                          {...form.register("authorFirstName")}
                          placeholder="Sébastien"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Middle Name</Label>
                        <Input
                          {...form.register("authorMiddleName")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          {...form.register("authorLastName")}
                          placeholder="JULLIARD-BESSON"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Suffix</Label>
                        <Input
                          {...form.register("authorSuffix")}
                          placeholder="PhD"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contributors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contributors</CardTitle>
                    <CardDescription>
                      Add up to 9 contributors. They'll display on Amazon using the order you enter below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contributors.map((contributor) => (
                      <div key={contributor.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <Select 
                          value={contributor.role} 
                          onValueChange={(value) => updateContributor(contributor.id, "role", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {contributorRoles.map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Prefix"
                          value={contributor.prefix}
                          onChange={(e) => updateContributor(contributor.id, "prefix", e.target.value)}
                          className="w-20"
                        />
                        <Input
                          placeholder="First Name"
                          value={contributor.firstName}
                          onChange={(e) => updateContributor(contributor.id, "firstName", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Middle Name"
                          value={contributor.middleName}
                          onChange={(e) => updateContributor(contributor.id, "middleName", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Last Name"
                          value={contributor.lastName}
                          onChange={(e) => updateContributor(contributor.id, "lastName", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Suffix"
                          value={contributor.suffix}
                          onChange={(e) => updateContributor(contributor.id, "suffix", e.target.value)}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeContributor(contributor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {contributors.length < 9 && (
                      <Button type="button" variant="outline" onClick={addContributor} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                    <CardDescription>
                      Summarize your book. This will be your product description on Amazon.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      {...form.register("description")}
                      placeholder="In the world of digital marketing, understanding data is essential to making informed decisions..."
                      rows={6}
                      className="resize-none"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {form.watch("description")?.length || 0} characters
                    </div>
                  </CardContent>
                </Card>

                {/* Publishing Rights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Rights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={form.watch("publishingRights") ?? "owned"}
                      onValueChange={(value) => form.setValue("publishingRights", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="owned" id="owned" />
                        <Label htmlFor="owned">I own the copyright and I hold necessary publishing rights</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public_domain" id="public_domain" />
                        <Label htmlFor="public_domain">This is a public domain work</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audience" className="space-y-6">
                {/* Primary Audience */}
                <Card>
                  <CardHeader>
                    <CardTitle>Primary Audience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Sexually Explicit Images or Title</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Does the book's cover or interior contain sexually explicit images, or does the book's title contain sexually explicit language?
                      </p>
                      <RadioGroup
                        value={form.watch("hasExplicitContent") ? "yes" : "no"}
                        onValueChange={(value) => form.setValue("hasExplicitContent", value === "yes")}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="explicit-yes" />
                          <Label htmlFor="explicit-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="explicit-no" />
                          <Label htmlFor="explicit-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-base font-medium">Reading age (Optional)</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Choose the youngest and oldest ages at which a person could enjoy this book.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Minimum</Label>
                          <Select value={form.watch("readingAgeMin") ?? ""} onValueChange={(value) => form.setValue("readingAgeMin", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select one" />
                            </SelectTrigger>
                            <SelectContent>
                              {readingAges.map((age) => (
                                <SelectItem key={age} value={age}>{age}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Maximum</Label>
                          <Select value={form.watch("readingAgeMax") ?? ""} onValueChange={(value) => form.setValue("readingAgeMax", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select one" />
                            </SelectTrigger>
                            <SelectContent>
                              {readingAges.map((age) => (
                                <SelectItem key={age} value={age}>{age}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Marketplace */}
                <Card>
                  <CardHeader>
                    <CardTitle>Primary marketplace</CardTitle>
                    <CardDescription>
                      Choose the location where you expect the majority of your book sales.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={form.watch("primaryMarketplace") ?? ""} onValueChange={(value) => form.setValue("primaryMarketplace", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces.map((marketplace) => (
                          <SelectItem key={marketplace} value={marketplace}>{marketplace}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                      Choose up to three categories that describe your book.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeCategory(category)}
                          />
                        </Badge>
                      ))}
                    </div>
                    {categories.length < 3 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter category (e.g., Business Technology, Web Marketing)"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCategory(e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Button type="button" variant="outline">Edit categories</Button>
                      </div>
                    )}

                    {/* Content Classification */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="low-content"
                          checked={form.watch("isLowContentBook") ?? false}
                          onCheckedChange={(checked) => form.setValue("isLowContentBook", !!checked)}
                        />
                        <Label htmlFor="low-content">Low-content book (content is 16-point font size or greater)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="large-print"
                          checked={form.watch("isLargePrintBook") ?? false}
                          onCheckedChange={(checked) => form.setValue("isLargePrintBook", !!checked)}
                        />
                        <Label htmlFor="large-print">Large-print book (content is 16-point font size or greater)</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle>Keywords</CardTitle>
                    <CardDescription>
                      Choose up to 7 keywords highlighting your book's unique traits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                    {keywords.length < 7 && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Google Analytics"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKeyword(e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Input
                          placeholder="GA4"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKeyword(e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {7 - keywords.length} keywords remaining
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="publishing" className="space-y-6">
                {/* Publication Date */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publication Date</CardTitle>
                    <CardDescription>
                      The publication date tells readers when the book was originally published.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={form.watch("previouslyPublished") ? "previously" : "same"}
                      onValueChange={(value) => form.setValue("previouslyPublished", value === "previously")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="same" id="same-date" />
                        <Label htmlFor="same-date">Publication date and release date are the same</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="previously" id="previously" />
                        <Label htmlFor="previously">My book was previously published</Label>
                      </div>
                    </RadioGroup>

                    {form.watch("previouslyPublished") && (
                      <div>
                        <Label htmlFor="previousPublicationDate">Previous Publication Date</Label>
                        <Input
                          {...form.register("previousPublicationDate")}
                          type="date"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Release Date */}
                <Card>
                  <CardHeader>
                    <CardTitle>Release Date</CardTitle>
                    <CardDescription>
                      Choose when to make your book available on Amazon.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={form.watch("releaseOption") ?? "immediate"}
                      onValueChange={(value) => form.setValue("releaseOption", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <Label htmlFor="immediate">Release my book for sale now</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="scheduled" id="scheduled" />
                        <Label htmlFor="scheduled">Schedule my book's release</Label>
                      </div>
                    </RadioGroup>

                    {form.watch("releaseOption") === "scheduled" && (
                      <div>
                        <Label htmlFor="scheduledReleaseDate">Scheduled Release Date</Label>
                        <Input
                          {...form.register("scheduledReleaseDate")}
                          type="date"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Formats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publication Formats</CardTitle>
                    <CardDescription>
                      Choose which formats you want to publish.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(["ebook", "paperback", "hardcover"] as const).map((format) => (
                        <div key={format} className="flex items-center space-x-2">
                          <Checkbox
                            id={format}
                            checked={form.watch("formats")?.includes(format)}
                            onCheckedChange={(checked) => {
                              const currentFormats = form.watch("formats") || [];
                              if (checked) {
                                form.setValue("formats", [...currentFormats, format]);
                              } else {
                                form.setValue("formats", currentFormats.filter(f => f !== format));
                              }
                            }}
                          />
                          <Label htmlFor={format} className="capitalize">{format}</Label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.formats && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.formats.message}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    console.log('Draft button clicked');
                    console.log('Form values:', form.getValues());
                    console.log('Form errors:', form.formState.errors);
                    
                    const formData = form.getValues();
                    console.log('Bypassing form validation, sending data directly:', formData);
                    createProject.mutate({ ...formData, status: 'draft' });
                  }}
                  disabled={createProject.isPending}
                >
                  {createProject.isPending ? "Saving..." : "Save as Draft"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProject.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {createProject.isPending ? "Creating..." : "Save and Continue"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}