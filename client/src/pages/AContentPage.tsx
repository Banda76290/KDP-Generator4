import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit3, Save, Trash2, Eye, FileText, Image, Layout as LayoutIcon, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AContent {
  id: string;
  title: string;
  asin: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function AContentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContent, setSelectedContent] = useState<AContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    asin: "",
    content: "",
  });

  // Fetch A+ Content entries
  const { data: aContentList = [], isLoading } = useQuery({
    queryKey: ["/api/a-content"],
    queryFn: () => apiRequest("/api/a-content"),
  });

  // Filter content based on search
  const filteredContent = aContentList.filter((content: AContent) =>
    content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    content.asin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create A+ Content mutation
  const createContentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/a-content", {
      method: "POST",
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/a-content"] });
      toast({ title: "A+ Content created successfully", variant: "success" });
      setIsCreating(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create A+ Content", variant: "destructive" });
    },
  });

  // Update A+ Content mutation
  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/a-content/${id}`, {
      method: "PUT",
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/a-content"] });
      toast({ title: "A+ Content updated successfully", variant: "success" });
      setIsEditing(false);
      setSelectedContent(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update A+ Content", variant: "destructive" });
    },
  });

  // Delete A+ Content mutation
  const deleteContentMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/a-content/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/a-content"] });
      toast({ title: "A+ Content deleted successfully", variant: "success" });
      setSelectedContent(null);
    },
    onError: () => {
      toast({ title: "Failed to delete A+ Content", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", asin: "", content: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.asin) {
      toast({ title: "Title and ASIN are required", variant: "destructive" });
      return;
    }

    if (isEditing && selectedContent) {
      updateContentMutation.mutate({ id: selectedContent.id, data: formData });
    } else if (isCreating) {
      createContentMutation.mutate(formData);
    }
  };

  const startEdit = (content: AContent) => {
    setSelectedContent(content);
    setFormData({
      title: content.title,
      asin: content.asin,
      content: content.content,
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedContent(null);
    resetForm();
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedContent(null);
    resetForm();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">A+ Content</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your Amazon A+ Content for enhanced product pages</p>
          </div>
          <Button onClick={startCreate} className="kdp-btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create A+ Content
          </Button>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by title or ASIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Content List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">A+ Content Library</h2>
            
            {isLoading ? (
              <div className="text-center py-8">Loading A+ Content...</div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">
                  {aContentList.length === 0 ? "No A+ Content yet" : "No content found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {aContentList.length === 0 
                    ? "Create your first A+ Content to enhance your product pages"
                    : `No A+ Content matches "${searchQuery}"`
                  }
                </p>
                {aContentList.length === 0 && (
                  <Button onClick={startCreate} className="kdp-btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First A+ Content
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContent.map((content: AContent) => (
                  <Card 
                    key={content.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedContent?.id === content.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedContent(content)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{content.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">ASIN: {content.asin}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(content.status)}>
                              {content.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(content.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(content);
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete A+ Content</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{content.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteContentMutation.mutate(content.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Editor/Preview */}
          <div className="space-y-4">
            {(isCreating || isEditing) ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LayoutIcon className="w-5 h-5 mr-2" />
                    {isCreating ? "Create A+ Content" : "Edit A+ Content"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Content Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter A+ Content title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="asin">ASIN *</Label>
                      <Input
                        id="asin"
                        value={formData.asin}
                        onChange={(e) => setFormData(prev => ({ ...prev, asin: e.target.value }))}
                        placeholder="B0XXXXXXXXX"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content Description</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Describe your A+ Content modules and layout..."
                        rows={8}
                        className="min-h-[200px]"
                      />
                      <p className="text-xs text-gray-500">
                        Describe the content, modules, and layout you want to create for this A+ Content.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createContentMutation.isPending || updateContentMutation.isPending}
                        className="kdp-btn-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isCreating ? "Create Content" : "Update Content"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : selectedContent ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      A+ Content Preview
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startEdit(selectedContent)}
                      className="kdp-btn-primary"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedContent.title}</h3>
                      <p className="text-gray-600">ASIN: {selectedContent.asin}</p>
                      <Badge className={getStatusColor(selectedContent.status)}>
                        {selectedContent.status}
                      </Badge>
                    </div>

                    {selectedContent.content && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Content Description:</h4>
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm whitespace-pre-wrap">{selectedContent.content}</p>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {new Date(selectedContent.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(selectedContent.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <LayoutIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select A+ Content</h3>
                  <p className="text-gray-500">
                    Choose an A+ Content from the list to view or edit, or create a new one.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              About A+ Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>A+ Content</strong> allows you to enhance your product detail pages with rich media content including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>High-quality images and comparison charts</li>
                <li>Enhanced product descriptions and features</li>
                <li>Brand storytelling and cross-sell opportunities</li>
                <li>Better conversion rates and reduced returns</li>
              </ul>
              <p className="pt-2">
                <strong>Note:</strong> A+ Content is available for brand registered sellers and vendors on Amazon.
                Content must be approved by Amazon before it goes live on your product pages.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}