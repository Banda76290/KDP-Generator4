import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Save, BookOpen, FolderOpen } from "lucide-react";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
  { value: "French", label: "French" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Japanese", label: "Japanese" },
];

export default function AuthorCreateNewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [authorForm, setAuthorForm] = useState({
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: ""
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [biography, setBiography] = useState<string>("");

  // Create author mutation
  const createAuthorMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/authors", {
      method: "POST",
      body: data
    }),
    onSuccess: (author) => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      toast({ title: "Author created successfully", variant: "success" });
      
      // If biography is provided, save it after creating the author
      if (biography.trim()) {
        createBiographyMutation.mutate({ 
          authorId: author.id, 
          biography: biography.trim(),
          language: selectedLanguage 
        });
      } else {
        // Check if we need to return to book edit page
        const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
        if (returnToBookEdit) {
          sessionStorage.removeItem('returnToBookEdit');
          if (returnToBookEdit === 'new') {
            setLocation('/books/create');
          } else {
            setLocation(`/books/edit/${returnToBookEdit}`);
          }
        } else {
          setLocation(`/authors/${author.id}`);
        }
      }
    },
    onError: () => {
      toast({ title: "Failed to create author", variant: "destructive" });
    },
  });

  // Create biography mutation
  const createBiographyMutation = useMutation({
    mutationFn: ({ authorId, biography, language }: { authorId: string; biography: string; language: string }) =>
      apiRequest(`/api/authors/${authorId}/biography/${language}`, {
        method: "PUT",
        body: JSON.stringify({ biography }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({ title: "Biography saved successfully", variant: "success" });
      
      // Check if we need to return to book edit page
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      if (returnToBookEdit) {
        sessionStorage.removeItem('returnToBookEdit');
        if (returnToBookEdit === 'new') {
          setLocation('/books/create');
        } else {
          setLocation(`/books/edit/${returnToBookEdit}`);
        }
      } else {
        setLocation("/authors");
      }
    },
    onError: () => {
      toast({ title: "Failed to save biography", variant: "destructive" });
    },
  });

  const handleAuthorFormChange = (field: keyof typeof authorForm, value: string) => {
    setAuthorForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!authorForm.firstName.trim() || !authorForm.lastName.trim()) {
      toast({ title: "First name and last name are required", variant: "destructive" });
      return;
    }
    createAuthorMutation.mutate(authorForm);
  };

  // WYSIWYG functions for biography
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
        toast({ title: "Error", description: "This feature is not supported in your browser", variant: "destructive" });
        return;
      }

      document.execCommand(command, false, value);
      
      // Update state with new content
      setBiography(editor.innerHTML);
    } catch (error) {
      console.error('Error applying formatting:', error);
      toast({ title: "Error", description: "Failed to apply formatting", variant: "destructive" });
    }
  };

  const cleanHTML = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const scripts = tempDiv.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      scripts[i].remove();
    }
    
    return tempDiv.innerHTML;
  };

  const handleBiographyChange = () => {
    const editor = document.getElementById('biography-editor') as HTMLDivElement;
    if (editor) {
      setBiography(editor.innerHTML);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
                if (returnToBookEdit) {
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
              <h1 className="text-3xl font-bold">Create New Author</h1>
              <p className="text-gray-600">Author profile and multilingual biographies</p>
            </div>
          </div>
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
                    onClick={() => {}} // Always in edit mode for creation
                    disabled
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author-prefix">Prefix (Optional)</Label>
                    <Input
                      id="author-prefix"
                      placeholder="Dr., Prof., etc."
                      value={authorForm.prefix}
                      onChange={(e) => handleAuthorFormChange('prefix', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author-suffix">Suffix (Optional)</Label>
                    <Input
                      id="author-suffix"
                      placeholder="Jr., Sr., PhD, etc."
                      value={authorForm.suffix}
                      onChange={(e) => handleAuthorFormChange('suffix', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author-firstName">First Name *</Label>
                    <Input
                      id="author-firstName"
                      placeholder="First name"
                      value={authorForm.firstName}
                      onChange={(e) => handleAuthorFormChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author-middleName">Middle Name (Optional)</Label>
                    <Input
                      id="author-middleName"
                      placeholder="Middle name"
                      value={authorForm.middleName}
                      onChange={(e) => handleAuthorFormChange('middleName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author-lastName">Last Name *</Label>
                    <Input
                      id="author-lastName"
                      placeholder="Last name"
                      value={authorForm.lastName}
                      onChange={(e) => handleAuthorFormChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={createAuthorMutation.isPending}
                  className="w-full"
                  style={{ backgroundColor: 'var(--kdp-primary-blue)' }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createAuthorMutation.isPending ? 'Saving...' : 'Save Author Info'}
                </Button>
              </CardContent>
            </Card>

            {/* Biography Editor */}
            <Card className="border-2 border-orange-300" style={{ backgroundColor: '#fff8f0' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Biography - {authorForm.firstName} {authorForm.lastName || 'New Author'}
                  </CardTitle>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* WYSIWYG Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyBiographyFormatting('bold')}
                    className="text-xs px-2 py-1"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyBiographyFormatting('italic')}
                    className="text-xs px-2 py-1"
                  >
                    <em>I</em>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyBiographyFormatting('underline')}
                    className="text-xs px-2 py-1"
                  >
                    <u>U</u>
                  </Button>
                  <div className="border-l border-gray-300 mx-1"></div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyBiographyFormatting('formatBlock', 'h4')}
                    className="text-xs px-2 py-1"
                  >
                    H4
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyBiographyFormatting('formatBlock', 'p')}
                    className="text-xs px-2 py-1"
                  >
                    P
                  </Button>
                </div>

                {/* Biography Editor */}
                <div
                  id="biography-editor"
                  contentEditable
                  className="min-h-32 p-3 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minHeight: '120px' }}
                  onInput={handleBiographyChange}
                  suppressContentEditableWarning={true}
                />

                <p className="text-sm text-gray-500">
                  Optional: Add a biography in {selectedLanguage}. You can add more languages after creating the author.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Placeholder for Projects & Books */}
          <div className="space-y-6">
            {/* Projects Section (Empty for new author) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Projects (0)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No projects yet</p>
                  <p className="text-sm">Projects will appear here after creating the author</p>
                </div>
              </CardContent>
            </Card>

            {/* All Books Section (Empty for new author) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  All Books (0)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No books yet</p>
                  <p className="text-sm">Books will appear here after creating the author</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}