import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { insertBookSchema, type InsertBook } from "@shared/schema";
import { z } from "zod";
import Layout from "@/components/Layout";

interface Contributor {
  id: string;
  role: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

const bookFormSchema = insertBookSchema.extend({
  projectId: z.string().optional(),
};

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

export default function CreateBook() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get projectId from URL if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preSelectedProjectId = urlParams.get('projectId');

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
      projectId: preSelectedProjectId || "",
      categories: [],
      keywords: [],
    },
  });

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  };

  // Load existing authors
  const { data: authors = [], isLoading: loadingAuthors } = useQuery<any[]>({
    queryKey: ["/api/authors"],
  };

  const createBook = useMutation({
    mutationFn: async (data: BookFormData) => {
      const bookData = {
        ...data,
        categories,
        keywords,
      };
      
      console.log('Creating book data:', bookData);
      const book = await apiRequest("/api/books", { method: "POST", body: JSON.stringify(bookData)});
      console.log('Received book response:', book);
      
      // Create contributors if any
      if (contributors.length > 0) {
        for (const contributor of contributors) {
          await apiRequest("/api/contributors", { method: "POST", body: JSON.stringify({ bookId: book.id,
            name: `${contributor.firstName)} ${contributor.lastName}`.trim(),
            role: contributor.role,
          }});
        }
      }
      
      return book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"])};
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] };
      toast({
        title: "Book Created",
        description: "Your book has been created successfully.",
      };
      setLocation("/projects");
    },
    onError: (error) => {
      console.error('Book creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create book"
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
      c.id === id ? { ...c, [field]: value)} : c
    ));
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  // Function to handle author selection from dropdown
  const handleAuthorSelection = (authorId: string) => {
    if (authorId) {
      const selectedAuthor = authors.find(author => author.id === authorId);
      if (selectedAuthor) {
        // Populate form fields with selected author data
        form.setValue("authorPrefix", selectedAuthor.prefix || "");
        form.setValue("authorFirstName", selectedAuthor.firstName || "");
        form.setValue("authorMiddleName", selectedAuthor.middleName || "");
        form.setValue("authorLastName", selectedAuthor.lastName || "");
        form.setValue("authorSuffix", selectedAuthor.suffix || "");
        setSelectedAuthorId(authorId);
      }
    }
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

  return (
    <Layout>
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={ () => setLocation("/projects")} className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Create New Book</h1>
                  <p className="text-muted-foreground">
                    Create a KDP book with all necessary details
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
              <div className="p-6">
                <form onSubmit={ form.handleSubmit((data) => createBook.mutate(data)}>
                  <div className="space-y-6">
                    {/* Project Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Assignment</CardTitle>
                        <CardDescription>
                          Select the project to assign this book to
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Select 
                          value={form.watch("projectId") || ""} 
                          onValueChange={ (value) => form.setValue("projectId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {(projects as any[]).map((project: any) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    
                    {/* Format Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Book Format</CardTitle>
                        <CardDescription>
                          Choose the publication format
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={form.watch("format") || "ebook"}
                          onValueChange={ (value) => form.setValue("format", value as "ebook" | "paperback" | "hardcover")}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ebook" id="ebook" />
                            <Label htmlFor="ebook">eBook (Kindle)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="paperback" id="paperback" />
                            <Label htmlFor="paperback">Paperback</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hardcover" id="hardcover" />
                            <Label htmlFor="hardcover">Hardcover</Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

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
                          <Select value={form.watch("language") ?? ""} onValueChange={ (value) => form.setValue("language", value)}>
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
                            { ...form.register("title")}
                            placeholder="From Zero to Hero with Google Analytics"
                            className="mt-1"
                          />
                          {form.formState.errors.title && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message)}</p>
                          )}
                        </div>

                        {/* Subtitle */}
                        <div>
                          <Label htmlFor="subtitle">Sous-titre (Optionnel)</Label>
                          <Input
                            { ...form.register("subtitle")}
                            placeholder="Turn statistics into winning strategies"
                            className="mt-1"
                          />
                        </div>

                        {/* Series */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="seriesTitle">Titre de Série (Optionnel)</Label>
                            <Input
                              { ...form.register("seriesTitle")}
                              placeholder="From Zero to Hero"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="seriesNumber">Numéro de Série</Label>
                            <Input
                              {...form.register("seriesNumber", { valueAsNumber: true)}}
                              type="number"
                              placeholder="1"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Edition Number */}
                        <div>
                          <Label htmlFor="editionNumber">Numéro d'Édition (Optionnel)</Label>
                          <Input
                            { ...form.register("editionNumber")}
                            placeholder="1"
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Primary Author */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Auteur Principal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label className="font-medium text-[14px]">Sélectionner un auteur existant</Label>
                          <div className="flex gap-3 mt-2">
                            <Select value={selectedAuthorId} onValueChange={handleAuthorSelection}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Choisir un auteur..." />
                              </SelectTrigger>
                              <SelectContent>
                                {authors.map((author) => (
                                  <SelectItem key={author.id} value={author.id}>
                                    {author.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={ () => setLocation('/authors/create' )}
                            >
                              Créer un Auteur
                            </Button>
                          </div>
                        </div>




                      </CardContent>
                    </Card>

                    {/* Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Description</CardTitle>
                        <CardDescription>
                          Résumez votre livre. Ceci sera votre description produit sur Amazon.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          { ...form.register("description")
                          placeholder="Dans le monde du marketing digital, comprendre les données est essentiel..."
                          rows={6}
                          className="resize-none"
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          {form.watch("description")?.length || 0} caractères
                        </div>
                      </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Catégories</CardTitle>
                        <CardDescription>
                          Choisissez jusqu'à trois catégories qui décrivent votre livre.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <Badge key={category} variant="secondary" className="flex items-center gap-1">
                              {category}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={ () => removeCategory(category )}
                              />
                            </Badge>
                          ))}
                        </div>
                        {categories.length < 3 && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Entrez une catégorie"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCategory(e.currentTarget.value);
                                  e.currentTarget.value = "";)}
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Keywords */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Mots-clés</CardTitle>
                        <CardDescription>
                          Choisissez jusqu'à 7 mots-clés qui mettent en valeur les caractéristiques uniques de votre livre.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                              {keyword}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={ () => removeKeyword(keyword )}
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
                                  e.currentTarget.value = "";)}
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
                          {7 - keywords.length} mots-clés restants
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t mt-6">
                    <Button type="button" variant="outline" onClick={ ()} => setLocation("/projects")>
                      Annuler
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          const formData = form.getValues();
                          createBook.mutate({ ...formData, status: 'draft' )};
                        }}
                        disabled={createBook.isPending}
                      >
                        {createBook.isPending ? "Sauvegarde..." : "Sauvegarder Brouillon"}
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createBook.isPending}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        { createBook.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Création...
                          </>
                        ) : (
                          "Créer le Livre")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
    </Layout>
  );
}