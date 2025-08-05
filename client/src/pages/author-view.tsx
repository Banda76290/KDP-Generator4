import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit3, Save, BookOpen, FolderOpen, Trash2, User } from "lucide-react";
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

export default function AuthorViewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { authorId } = useParams<{ authorId: string }>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [biography, setBiography] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [authorForm, setAuthorForm] = useState({
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: ""
  });

  // Fetch author details
  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ["/api/authors", authorId],
    queryFn: () => apiRequest(`/api/authors/${authorId}`, { method: "GET" }),
    enabled: !!authorId,
  });

  // Fetch biography for selected language
  const { data: biographyData, isLoading: biographyLoading } = useQuery({
    queryKey: ["/api/authors", authorId, "biography", selectedLanguage],
    queryFn: () => apiRequest(`/api/authors/${authorId}/biography/${selectedLanguage}`, { method: "GET" }),
    enabled: !!authorId,
  });

  // Fetch author projects
  const { data: authorProjects = [] } = useQuery({
    queryKey: ["/api/authors", authorId, "projects"],
    queryFn: () => apiRequest(`/api/authors/${authorId}/projects`, { method: "GET" }),
    enabled: !!authorId,
  });

  // Fetch author books  
  const { data: authorBooks = [] } = useQuery({
    queryKey: ["/api/authors", authorId, "books"],
    queryFn: () => apiRequest(`/api/authors/${authorId}/books`, { method: "GET" }),
    enabled: !!authorId,
  });

  // Biography WYSIWYG functions (matching Book Description editor)
  const applyBiographyFormatting = (command: string, value?: string) => {
    try {
      const editor = document.getElementById('biography-editor') as HTMLDivElement;
      if (!editor) {
        console.error('Biography editor not found');
        return;
      }

      editor.focus();
      
      if (typeof document.execCommand !== 'function') {
        console.error('execCommand is not supported in this browser');
        toast({ title: "Erreur", description: "Cette fonctionnalité n'est pas supportée dans votre navigateur", variant: "destructive" });
        return;
      }

      const success = document.execCommand(command, false, value);
      if (!success) {
        console.warn(`execCommand failed for command: ${command}`);
      }
      
      updateBiographyFromHTML();
    } catch (error) {
      console.error('Error applying biography formatting:', error);
      toast({ title: "Erreur", description: "Erreur lors de l'application du formatage", variant: "destructive" });
    }
  };

  const handleBiographyFormatChange = (value: string) => {
    switch (value) {
      case "normal":
        applyBiographyFormatting("formatBlock", "div");
        break;
      case "heading4":
        applyBiographyFormatting("formatBlock", "h4");
        break;
      case "heading5":
        applyBiographyFormatting("formatBlock", "h5");
        break;
      case "heading6":
        applyBiographyFormatting("formatBlock", "h6");
        break;
    }
  };

  const updateBiographyFromHTML = () => {
    const editor = document.getElementById('biography-editor') as HTMLDivElement;
    if (editor) {
      setBiography(editor.innerHTML);
    }
  };

  // Function to clean HTML content securely
  const cleanHTML = (html: string): string => {
    if (!html) return '';
    
    // Use DOMParser to safely parse HTML without executing scripts
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove dangerous elements
    const scripts = doc.querySelectorAll('script, iframe, object, embed');
    scripts.forEach(script => script.remove());
    
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(element => {
      const safeAttributes = ['href', 'title', 'alt', 'class'];
      const attributesToRemove: string[] = [];
      
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (!safeAttributes.includes(attr.name) && !attr.name.startsWith('data-')) {
          attributesToRemove.push(attr.name);
        }
      }
      
      attributesToRemove.forEach(attrName => {
        element.removeAttribute(attrName);
      });
      
      if (element.getAttribute('href')?.startsWith('javascript:')) {
        element.removeAttribute('href');
      }
    });
    
    return doc.body.innerHTML;
  };

  // Add CSS for the biography editor
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #biography-editor:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
      }
      #biography-editor h4 { font-size: 1.25rem; font-weight: bold; margin: 0.5rem 0; }
      #biography-editor h5 { font-size: 1.125rem; font-weight: bold; margin: 0.5rem 0; }
      #biography-editor h6 { font-size: 1rem; font-weight: bold; margin: 0.5rem 0; }
      #biography-editor ul { list-style-type: disc; margin-left: 1.5rem; }
      #biography-editor ol { list-style-type: decimal; margin-left: 1.5rem; }
      #biography-editor li { margin: 0.25rem 0; }
      #biography-editor a { color: #3b82f6; text-decoration: underline; }
      #biography-editor p { margin: 0.5rem 0; }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Update author form when author data loads
  React.useEffect(() => {
    if (author) {
      setAuthorForm({
        prefix: author.prefix || "",
        firstName: author.firstName || "",
        middleName: author.middleName || "",
        lastName: author.lastName || "",
        suffix: author.suffix || ""
      });
    }
  }, [author]);

  // Auto-activate editing mode if coming from book edit page
  React.useEffect(() => {
    const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
    if (returnToBookEdit && author) {
      // Automatically enter edit mode when coming from book editing
      setIsEditingAuthor(true);
    }
  }, [author]);

  // Update biography state when data changes
  React.useEffect(() => {
    if (biographyData?.biography !== undefined) {
      setBiography(biographyData.biography || "");
    }
  }, [biographyData]);

  // Load biography content into editor when data changes
  React.useEffect(() => {
    if (author && biographyData !== undefined) {
      const editor = document.getElementById('biography-editor') as HTMLDivElement;
      if (editor) {
        while (editor.firstChild) {
          editor.removeChild(editor.firstChild);
        }
        
        if (biographyData?.biography) {
          const cleanedContent = cleanHTML(biographyData.biography);
          const safeParser = new DOMParser();
          const safeDoc = safeParser.parseFromString(cleanedContent, 'text/html');
          
          for (let child of Array.from(safeDoc.body.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              editor.appendChild(document.createTextNode(child.textContent || ''));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const elem = child as Element;
              const allowedTags = ['P', 'BR', 'STRONG', 'EM', 'U', 'H4', 'H5', 'H6', 'DIV', 'SPAN'];
              if (allowedTags.includes(elem.tagName)) {
                const newElem = document.createElement(elem.tagName.toLowerCase());
                newElem.textContent = elem.textContent;
                editor.appendChild(newElem);
              }
            }
          }
        }
      }
    }
  }, [author, biographyData, selectedLanguage]);

  // Update biography mutation
  const updateBiographyMutation = useMutation({
    mutationFn: ({ biography }: { biography: string }) =>
      apiRequest(`/api/authors/${authorId}/biography/${selectedLanguage}`, { method: "PUT", body: JSON.stringify({ biography }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors", authorId, "biography", selectedLanguage] });
      setIsEditing(false);
      toast({ title: "Biography saved successfully" });
      
      // Check if we need to return to book edit page (like in series-edit.tsx)
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      if (returnToBookEdit) {
        // Clear the flag and return to book edit page
        sessionStorage.removeItem('returnToBookEdit');
        if (returnToBookEdit === 'new') {
          setLocation('/books/create');
        } else {
          setLocation(`/books/edit/${returnToBookEdit}`);
        }
      }
    },
    onError: () => {
      toast({ title: "Failed to save biography", variant: "destructive" });
    },
  });

  // Update author mutation
  const updateAuthorMutation = useMutation({
    mutationFn: (authorData: typeof authorForm) =>
      apiRequest(`/api/authors/${authorId}`, { method: "PUT", body: JSON.stringify(authorData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors", authorId] });
      setIsEditingAuthor(false);
      toast({ title: "Author updated successfully" });
      
      // Check if we need to return to book edit page (like in series-edit.tsx)
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      if (returnToBookEdit) {
        // Clear the flag and return to book edit page
        sessionStorage.removeItem('returnToBookEdit');
        if (returnToBookEdit === 'new') {
          setLocation('/books/create');
        } else {
          setLocation(`/books/edit/${returnToBookEdit}`);
        }
      }
    },
    onError: () => {
      toast({ title: "Failed to update author", variant: "destructive" });
    },
  });

  // Delete author mutation
  const deleteAuthorMutation = useMutation({
    mutationFn: () => apiRequest(`/api/authors/${authorId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      toast({ title: "Author deleted successfully" });
      setLocation("/authors");
    },
    onError: () => {
      toast({ title: "Failed to delete author", variant: "destructive" });
    },
  });

  const handleSaveBiography = () => {
    updateBiographyMutation.mutate({ biography });
  };

  const handleSaveAuthor = () => {
    updateAuthorMutation.mutate(authorForm);
  };

  const handleAuthorFormChange = (field: keyof typeof authorForm, value: string) => {
    setAuthorForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setIsEditing(false);
  };

  if (authorLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading author...</div>
        </div>
      </Layout>
    );
  }

  if (!author) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Author not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                // Check if we need to return to book edit page
                const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
                if (returnToBookEdit) {
                  // Clear the flag and return to book edit page
                  sessionStorage.removeItem('returnToBookEdit');
                  if (returnToBookEdit === 'new') {
                    setLocation('/books/create');
                  } else {
                    setLocation(`/books/edit/${returnToBookEdit}`);
                  }
                } else {
                  setLocation("/authors");
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {sessionStorage.getItem('returnToBookEdit') ? 'Back to Book' : 'Back to Authors'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{author.fullName}</h1>
              <p className="text-gray-600 dark:text-gray-400">Author profile and multilingual biographies</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Author
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Author</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{author.fullName}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={ () => deleteAuthorMutation.mutate( }
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Author Details & Biography */}
          <div className="space-y-6">
            {/* Author Details Editor */}
            <Card className="border-2" style={{ borderColor: 'var(--kdp-primary-blue)', backgroundColor: '#f0f8ff' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Author Information
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={ () => setIsEditingAuthor(!isEditingAuthor }
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    {isEditingAuthor ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingAuthor ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="author-prefix">Prefix (Optional)</Label>
                        <Input
                          id="author-prefix"
                          placeholder="Dr., Prof., etc."
                          value={authorForm.prefix}
                          onChange={ (e) => handleAuthorFormChange('prefix', e.target.value }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author-suffix">Suffix (Optional)</Label>
                        <Input
                          id="author-suffix"
                          placeholder="Jr., Sr., PhD, etc."
                          value={authorForm.suffix}
                          onChange={ (e) => handleAuthorFormChange('suffix', e.target.value }
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="author-firstname">First Name *</Label>
                        <Input
                          id="author-firstname"
                          placeholder="John"
                          value={authorForm.firstName}
                          onChange={ (e) => handleAuthorFormChange('firstName', e.target.value }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author-middlename">Middle Name (Optional)</Label>
                        <Input
                          id="author-middlename"
                          placeholder="Michael"
                          value={authorForm.middleName}
                          onChange={ (e) => handleAuthorFormChange('middleName', e.target.value }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author-lastname">Last Name *</Label>
                        <Input
                          id="author-lastname"
                          placeholder="Doe"
                          value={authorForm.lastName}
                          onChange={ (e) => handleAuthorFormChange('lastName', e.target.value }
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleSaveAuthor} 
                        disabled={updateAuthorMutation.isPending || !authorForm.firstName || !authorForm.lastName}
                        className="kdp-btn-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateAuthorMutation.isPending ? "Saving..." : "Save Author Info"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="text-lg font-medium">
                      { [authorForm.prefix, authorForm.firstName, authorForm.middleName, authorForm.lastName, authorForm.suffix]
                        .filter(Boolean)
                        .join(' ' }
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click Edit to modify author information
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Biography Editor */}
            <Card className="border-2" style={{ borderColor: 'var(--kdp-secondary-orange)', backgroundColor: '#fff9f0' }}>
              <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">Biography - {author.fullName}</h3>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-48">
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

              {biographyLoading ? (
                <div className="text-center py-8">Loading biography...</div>
              ) : (
                <div className="space-y-4">
                  {/* Formatting Toolbar (exact copy from Book Description) */}
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                    <Select onValueChange={handleBiographyFormatChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="heading4">Heading 4</SelectItem>
                        <SelectItem value="heading5">Heading 5</SelectItem>
                        <SelectItem value="heading6">Heading 6</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={ () => applyBiographyFormatting('bold' }
                    >
                      <strong>B</strong>
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={ () => applyBiographyFormatting('italic' }
                    >
                      <em>I</em>
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={ () => applyBiographyFormatting('underline' }
                    >
                      <u>U</u>
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={ () => applyBiographyFormatting('insertUnorderedList' }
                    >
                      • List
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={ () => applyBiographyFormatting('insertOrderedList' }
                    >
                      1. List
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={ () => applyBiographyFormatting('createLink', prompt('Enter URL:') || undefined }
                    >
                      🔗 Link
                    </Button>
                  </div>

                  {/* Rich Text Editor (exact copy from Book Description) */}
                  <div className="space-y-2">
                    <div
                      id="biography-editor"
                      contentEditable
                      className="min-h-[200px] p-3 border border-gray-300 rounded-md resize-y overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      style={{ 
                        minHeight: '200px',
                        maxHeight: '500px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        direction: 'ltr'
                      }}
                      onInput={updateBiographyFromHTML}
                      onBlur={updateBiographyFromHTML}
                      data-placeholder={`Enter ${author.fullName}'s biography in ${selectedLanguage}...`}
                      suppressContentEditableWarning={true}
                    />
                    <div className="flex justify-end">
                      <span className="text-sm text-gray-500">
                        {biography?.length || 0} characters
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveBiography} 
                      disabled={updateBiographyMutation.isPending}
                      className="kdp-btn-primary"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateBiographyMutation.isPending ? "Saving..." : "Save Biography"}
                    </Button>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Projects & Books */}
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
        </div>
      </div>
    </Layout>
  );
}