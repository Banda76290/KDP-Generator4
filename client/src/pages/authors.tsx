import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit3, Save, X, User, BookOpen, FolderOpen, Trash2 } from "lucide-react";
import type { AuthorWithRelations, ProjectWithRelations, Book } from "@shared/schema";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
  { value: "French", label: "French" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Japanese", label: "Japanese" },
];

// Safe WYSIWYG Editor Component
const WysiwygEditor = ({ 
  value, 
  onChange, 
  placeholder = "Enter biography...", 
  className = "" 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string; 
  className?: string; 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    const editor = editorRef.current;
    if (editor) {
      onChange(editor.innerHTML);
    }
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (editor) {
      onChange(editor.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => formatText('bold')}
          className="h-8 px-2"
        >
          <strong>B</strong>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => formatText('italic')}
          className="h-8 px-2"
        >
          <em>I</em>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => formatText('underline')}
          className="h-8 px-2"
        >
          <u>U</u>
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => formatText('insertUnorderedList')}
          className="h-8 px-2"
        >
          • List
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => formatText('insertOrderedList')}
          className="h-8 px-2"
        >
          1. List
        </Button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        className={`min-h-[150px] p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        style={{ whiteSpace: 'pre-wrap' }}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
      
      {!value && !isEditing && (
        <div className="absolute inset-0 p-3 text-gray-400 pointer-events-none top-[60px]">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default function AuthorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorWithRelations | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [biography, setBiography] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newAuthor, setNewAuthor] = useState({
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
  });

  // Fetch authors
  const { data: authors = [], isLoading: authorsLoading } = useQuery({
    queryKey: ["/api/authors"],
    queryFn: () => apiRequest("GET", "/api/authors"),
  });

  // Fetch biography for selected author and language
  const { data: biographyData, isLoading: biographyLoading } = useQuery({
    queryKey: ["/api/authors", selectedAuthor?.id, "biography", selectedLanguage],
    queryFn: () => apiRequest("GET", `/api/authors/${selectedAuthor?.id}/biography/${selectedLanguage}`),
    enabled: !!selectedAuthor?.id,
  });

  // Fetch author projects
  const { data: authorProjects = [] } = useQuery({
    queryKey: ["/api/authors", selectedAuthor?.id, "projects"],
    queryFn: () => apiRequest("GET", `/api/authors/${selectedAuthor?.id}/projects`),
    enabled: !!selectedAuthor?.id,
  });

  // Fetch author books  
  const { data: authorBooks = [] } = useQuery({
    queryKey: ["/api/authors", selectedAuthor?.id, "books"],
    queryFn: () => apiRequest("GET", `/api/authors/${selectedAuthor?.id}/books`),
    enabled: !!selectedAuthor?.id,
  });

  // Update biography when data changes
  React.useEffect(() => {
    if (biographyData?.biography !== undefined) {
      setBiography(biographyData.biography || "");
    }
  }, [biographyData]);

  // Create author mutation
  const createAuthorMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/authors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setIsCreating(false);
      setNewAuthor({ prefix: "", firstName: "", middleName: "", lastName: "", suffix: "" });
      toast({ title: "Author created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create author", variant: "destructive" });
    },
  });

  // Update biography mutation
  const updateBiographyMutation = useMutation({
    mutationFn: ({ authorId, language, biography }: { authorId: string; language: string; biography: string }) =>
      apiRequest("PUT", `/api/authors/${authorId}/biography/${language}`, { biography }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthor?.id, "biography", selectedLanguage] });
      setIsEditing(false);
      toast({ title: "Biography saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save biography", variant: "destructive" });
    },
  });

  // Delete author mutation
  const deleteAuthorMutation = useMutation({
    mutationFn: (authorId: string) => apiRequest("DELETE", `/api/authors/${authorId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setSelectedAuthor(null);
      toast({ title: "Author deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete author", variant: "destructive" });
    },
  });

  const handleCreateAuthor = () => {
    if (!newAuthor.firstName || !newAuthor.lastName) {
      toast({ title: "First name and last name are required", variant: "destructive" });
      return;
    }
    createAuthorMutation.mutate(newAuthor);
  };

  const handleSaveBiography = () => {
    if (!selectedAuthor) return;
    updateBiographyMutation.mutate({
      authorId: selectedAuthor.id,
      language: selectedLanguage,
      biography,
    });
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setIsEditing(false);
  };

  const handleAuthorChange = (authorId: string) => {
    const author = authors.find((a: AuthorWithRelations) => a.id === authorId);
    setSelectedAuthor(author || null);
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Authors</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your authors and their multilingual biographies</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Author
          </Button>
        </div>

      {/* Author Creation Dialog */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Create New Author
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  placeholder="Dr., Prof., etc."
                  value={newAuthor.prefix}
                  onChange={(e) => setNewAuthor({ ...newAuthor, prefix: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={newAuthor.firstName}
                  onChange={(e) => setNewAuthor({ ...newAuthor, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  placeholder="Michael"
                  value={newAuthor.middleName}
                  onChange={(e) => setNewAuthor({ ...newAuthor, middleName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={newAuthor.lastName}
                  onChange={(e) => setNewAuthor({ ...newAuthor, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  placeholder="Jr., Sr., III"
                  value={newAuthor.suffix}
                  onChange={(e) => setNewAuthor({ ...newAuthor, suffix: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCreateAuthor} disabled={createAuthorMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createAuthorMutation.isPending ? "Creating..." : "Create Author"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Author Selection & Biography */}
        <div className="space-y-6">
          {/* Author Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Author</CardTitle>
            </CardHeader>
            <CardContent>
              {authorsLoading ? (
                <div className="text-center py-4">Loading authors...</div>
              ) : authors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No authors created yet. Create your first author to get started.
                </div>
              ) : (
                <Select value={selectedAuthor?.id || ""} onValueChange={handleAuthorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an author..." />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((author: AuthorWithRelations) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Biography Editor */}
          {selectedAuthor && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Edit3 className="w-5 h-5 mr-2" />
                    Biography - {selectedAuthor.fullName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Author
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Author</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{selectedAuthor.fullName}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAuthorMutation.mutate(selectedAuthor.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selection */}
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Biography Editor */}
                <div>
                  <Label>Biography</Label>
                  {biographyLoading ? (
                    <div className="text-center py-8">Loading biography...</div>
                  ) : (
                    <div className="relative">
                      <WysiwygEditor
                        value={biography}
                        onChange={setBiography}
                        placeholder={`Enter ${selectedAuthor.fullName}'s biography in ${selectedLanguage}...`}
                      />
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={handleSaveBiography} 
                    disabled={updateBiographyMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateBiographyMutation.isPending ? "Saving..." : "Save Biography"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Author's Projects & Books */}
        {selectedAuthor && (
          <div className="space-y-6">
            {/* Author Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Projects ({authorProjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authorProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No projects found for this author.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {authorProjects.map((project: ProjectWithRelations) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{project.title}</h4>
                            {project.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.subtitle}</p>
                            )}
                            {project.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="secondary">{project.status}</Badge>
                              <Badge variant="outline">{project.books.length} book{project.books.length !== 1 ? 's' : ''}</Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Books in this project */}
                        {project.books.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="text-sm font-medium mb-2">Books in this project:</h5>
                            <div className="grid gap-2">
                              {project.books.map((book: Book) => (
                                <div key={book.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <span className="text-sm">{book.title}</span>
                                  <div className="flex gap-1">
                                    <Badge variant="outline" className="text-xs">{book.format}</Badge>
                                    <Badge variant="secondary" className="text-xs">{book.status}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Author Books */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  All Books ({authorBooks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authorBooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No books found for this author.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {authorBooks.map((book: Book) => (
                      <div key={book.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{book.title}</h4>
                            {book.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{book.subtitle}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="secondary">{book.status}</Badge>
                              <Badge variant="outline">{book.format}</Badge>
                              <Badge variant="outline">{book.language}</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>Sales: {book.totalSales}</span>
                              <span>Revenue: ${book.totalRevenue}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}