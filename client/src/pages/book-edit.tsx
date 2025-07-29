import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, CheckCircle, ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBookSchema, type Book } from "@shared/schema";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

interface Contributor {
  id: string;
  role: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

const bookFormSchema = insertBookSchema;
type BookFormData = z.infer<typeof bookFormSchema>;

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

export default function EditBook() {
  const { bookId } = useParams();
  const [, setLocation] = useLocation();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing book data
  const { data: book, isLoading: bookLoading, error } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
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
      format: "ebook",
      status: "draft",
      projectId: "",
      categories: [],
      keywords: [],
    },
  });

  // Update form with fetched book data
  useEffect(() => {
    if (book) {
      form.reset({
        title: book.title || "",
        subtitle: book.subtitle || "",
        description: book.description || "",
        language: book.language || "English",
        authorFirstName: book.authorFirstName || "",
        authorLastName: book.authorLastName || "",
        publishingRights: book.publishingRights || "owned",
        hasExplicitContent: book.hasExplicitContent || false,
        primaryMarketplace: book.primaryMarketplace || "Amazon.com",
        isLowContentBook: book.isLowContentBook || false,
        isLargePrintBook: book.isLargePrintBook || false,
        previouslyPublished: book.previouslyPublished || false,
        releaseOption: book.releaseOption || "immediate",
        useAI: book.useAI || false,
        format: book.format || "ebook",
        status: book.status || "draft",
        projectId: book.projectId || "",
        categories: book.categories || [],
        keywords: book.keywords || [],
      });

      // Set separate state arrays
      if (typeof book.keywords === 'string') {
        setKeywords(book.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k));
      } else if (Array.isArray(book.keywords)) {
        setKeywords(book.keywords);
      }
      
      setCategories(Array.isArray(book.categories) ? book.categories : []);
      setContributors([]);
    }
  }, [book, form]);

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const updateBook = useMutation({
    mutationFn: async (data: { bookData: BookFormData; shouldNavigate?: boolean; nextTab?: string }) => {
      const formattedData = {
        ...data.bookData,
        categories,
        keywords,
      };
      
      console.log('Updating book data:', formattedData);
      const updatedBook = await apiRequest("PATCH", `/api/books/${bookId}`, formattedData);
      console.log('Received updated book response:', updatedBook);
      
      return { updatedBook, shouldNavigate: data.shouldNavigate, nextTab: data.nextTab };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      toast({
        title: "Book Updated",
        description: "Your book has been updated successfully.",
      });
      
      if (result.nextTab) {
        setActiveTab(result.nextTab);
      } else if (result.shouldNavigate) {
        setLocation("/projects");
      }
    },
    onError: (error) => {
      console.error('Book update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update book",
        variant: "destructive",
      });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/books/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Book Deleted",
        description: "Your book has been deleted successfully.",
      });
      setLocation("/projects");
    },
    onError: (error) => {
      console.error('Book deletion error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
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
    if (category.trim() && !categories.includes(category.trim()) && categories.length < 10) {
      setCategories([...categories, category.trim()]);
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const onSubmit = (data: BookFormData) => {
    updateBook.mutate({ bookData: data, shouldNavigate: true });
  };

  const handleSaveAsDraft = (data: BookFormData) => {
    const draftData = {
      ...data,
      status: "draft",
    };
    
    updateBook.mutate({ bookData: draftData });
  };

  const handleSaveAndContinue = (data: BookFormData) => {
    let nextTab = "";
    if (activeTab === "details") {
      nextTab = "content";
    } else if (activeTab === "content") {
      nextTab = "pricing";
    }
    
    updateBook.mutate({ bookData: data, nextTab });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
      deleteBook.mutate();
    }
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading book details...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
              <p className="text-gray-600 mb-4">The book you're looking for doesn't exist or you don't have permission to edit it.</p>
              <Button onClick={() => setLocation("/projects")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/projects")}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Book</h1>
                  <p className="text-gray-600">Update your book details and settings</p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteBook.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Book
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Paperback Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("content")}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "content"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Paperback Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pricing")}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "pricing"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Paperback Rights & Pricing
                  </button>
                </nav>
              </div>

              {/* Paperback Details Tab */}
              {activeTab === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Paperback Details</CardTitle>
                  <CardDescription>
                    Basic information about your book
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language">Language *</Label>
                    <Select 
                      value={form.watch("language")} 
                      onValueChange={(value) => form.setValue("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Book Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter your book title"
                      {...form.register("title", { required: "Title is required" })}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      placeholder="Enter subtitle (optional)"
                      {...form.register("subtitle")}
                    />
                  </div>

                  {/* Series Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seriesTitle">Series Title</Label>
                      <Input
                        id="seriesTitle"
                        placeholder="Enter series name (if applicable)"
                        {...form.register("seriesTitle")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seriesNumber">Volume Number</Label>
                      <Input
                        id="seriesNumber"
                        type="number"
                        min="1"
                        placeholder="1"
                        {...form.register("seriesNumber", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  {/* Edition Number */}
                  <div className="space-y-2">
                    <Label htmlFor="editionNumber">Edition Number</Label>
                    <Input
                      id="editionNumber"
                      type="number"
                      min="1"
                      placeholder="1"
                      {...form.register("editionNumber", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Author Information */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Author Information</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="authorFirstName">First Name *</Label>
                        <Input
                          id="authorFirstName"
                          placeholder="Author's first name"
                          {...form.register("authorFirstName", { required: "First name is required" })}
                        />
                        {form.formState.errors.authorFirstName && (
                          <p className="text-sm text-red-600">{form.formState.errors.authorFirstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="authorLastName">Last Name *</Label>
                        <Input
                          id="authorLastName"
                          placeholder="Author's last name"
                          {...form.register("authorLastName", { required: "Last name is required" })}
                        />
                        {form.formState.errors.authorLastName && (
                          <p className="text-sm text-red-600">{form.formState.errors.authorLastName.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contributors */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Contributors</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addContributor}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contributor
                      </Button>
                    </div>
                    {contributors.map((contributor) => (
                      <Card key={contributor.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Select 
                            value={contributor.role} 
                            onValueChange={(value) => updateContributor(contributor.id, 'role', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {contributorRoles.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="First Name"
                            value={contributor.firstName}
                            onChange={(e) => updateContributor(contributor.id, 'firstName', e.target.value)}
                          />
                          <Input
                            placeholder="Last Name"
                            value={contributor.lastName}
                            onChange={(e) => updateContributor(contributor.id, 'lastName', e.target.value)}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContributor(contributor.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter a compelling book description that will attract readers..."
                      className="min-h-[120px]"
                      {...form.register("description")}
                    />
                    <p className="text-sm text-gray-500">
                      Write a compelling description that will appear on your book's detail page.
                    </p>
                  </div>

                  {/* Publishing Rights */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Publishing Rights</Label>
                    <RadioGroup 
                      value={form.watch("publishingRights")} 
                      onValueChange={(value) => form.setValue("publishingRights", value as any)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="owned" id="owned" />
                        <Label htmlFor="owned">I own the copyright and hold publishing rights</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public-domain" id="public-domain" />
                        <Label htmlFor="public-domain">This is a public domain work</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Categories */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Categories</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {categories.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeCategory(category)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a category"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCategory(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value) {
                            addCategory(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">Add up to 10 categories that best describe your book.</p>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Keywords</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a keyword"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeyword(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value) {
                            addKeyword(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">Add up to 7 keywords to help readers discover your book.</p>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Additional Options</Label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasExplicitContent"
                          checked={form.watch("hasExplicitContent")}
                          onCheckedChange={(checked) => form.setValue("hasExplicitContent", checked as boolean)}
                        />
                        <Label htmlFor="hasExplicitContent">This book contains explicit content</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isLowContentBook"
                          checked={form.watch("isLowContentBook")}
                          onCheckedChange={(checked) => form.setValue("isLowContentBook", checked as boolean)}
                        />
                        <Label htmlFor="isLowContentBook">This is a low-content book (journals, planners, etc.)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isLargePrintBook"
                          checked={form.watch("isLargePrintBook")}
                          onCheckedChange={(checked) => form.setValue("isLargePrintBook", checked as boolean)}
                        />
                        <Label htmlFor="isLargePrintBook">This is a large print book</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="previouslyPublished"
                          checked={form.watch("previouslyPublished")}
                          onCheckedChange={(checked) => form.setValue("previouslyPublished", checked as boolean)}
                        />
                        <Label htmlFor="previouslyPublished">This book has been previously published</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="useAI"
                          checked={form.watch("useAI")}
                          onCheckedChange={(checked) => form.setValue("useAI", checked as boolean)}
                        />
                        <Label htmlFor="useAI">AI was used in creating this book</Label>
                      </div>
                    </div>
                  </div>

                  {/* Primary Marketplace */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryMarketplace">Primary Marketplace</Label>
                    <Select 
                      value={form.watch("primaryMarketplace")} 
                      onValueChange={(value) => form.setValue("primaryMarketplace", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces.map((marketplace) => (
                          <SelectItem key={marketplace} value={marketplace}>{marketplace}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Paperback Content Tab */}
              {activeTab === "content" && (
              <Card>
                <CardHeader>
                  <CardTitle>Paperback Content</CardTitle>
                  <CardDescription>
                    Upload your manuscript and configure content settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Manuscript</h3>
                    <p className="text-gray-600 mb-4">
                      Upload your completed manuscript in PDF format
                    </p>
                    <Button variant="outline">
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Print Options</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="bleedSettings" />
                        <Label htmlFor="bleedSettings">This book has bleed settings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="largeBook" />
                        <Label htmlFor="largeBook">This is a large book (over 828 pages)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="printLength">Print Length (pages)</Label>
                    <Input
                      id="printLength"
                      type="number"
                      min="24"
                      placeholder="100"
                      {...form.register("printLength", { valueAsNumber: true })}
                    />
                    <p className="text-sm text-gray-500">
                      Minimum 24 pages required for paperback printing
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Paperback Rights & Pricing Tab */}
              {activeTab === "pricing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Paperback Rights & Pricing</CardTitle>
                  <CardDescription>
                    Set your pricing and distribution preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Distribution Rights */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Territories</Label>
                    <p className="text-sm text-gray-600">
                      Select the territories where you have rights to sell this book.
                    </p>
                    <RadioGroup defaultValue="worldwide">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worldwide" id="worldwide" />
                        <Label htmlFor="worldwide">All territories (worldwide rights)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual">Individual territories</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Primary Marketplace */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryMarketplace">Primary Marketplace</Label>
                    <Select 
                      value={form.watch("primaryMarketplace")} 
                      onValueChange={(value) => form.setValue("primaryMarketplace", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces.map((marketplace) => (
                          <SelectItem key={marketplace} value={marketplace}>{marketplace}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Pricing, royalties, and distribution</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="listPrice">List Price (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="listPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="9.99"
                            {...form.register("listPrice")}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="printCost">Print Cost</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="printCost"
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="0.00"
                            {...form.register("printCost")}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="royaltyRate">Royalty Rate</Label>
                        <Select 
                          value={form.watch("royaltyRate")} 
                          onValueChange={(value) => form.setValue("royaltyRate", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select royalty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">60%</SelectItem>
                            <SelectItem value="70">70%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ISBN */}
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN (Optional)</Label>
                    <Input
                      id="isbn"
                      placeholder="Enter ISBN if you have one"
                      {...form.register("isbn")}
                    />
                    <p className="text-sm text-gray-500">
                      Leave blank to get a free Amazon ISBN
                    </p>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Terms & Conditions</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="acceptTerms" />
                      <Label htmlFor="acceptTerms" className="text-sm">
                        I confirm that I agree to and am in compliance with the KDP Terms and Conditions
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/projects")}
                >
                  Cancel
                </Button>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={form.handleSubmit(handleSaveAsDraft)}
                    disabled={updateBook.isPending}
                  >
                    {updateBook.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                  {activeTab !== "pricing" && (
                    <Button
                      type="button"
                      onClick={form.handleSubmit(handleSaveAndContinue)}
                      disabled={updateBook.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {updateBook.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save and Continue"
                      )}
                    </Button>
                  )}
                  {activeTab === "pricing" && (
                    <Button
                      type="submit"
                      disabled={updateBook.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {updateBook.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Update Book
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}