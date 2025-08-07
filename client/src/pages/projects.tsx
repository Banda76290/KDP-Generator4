import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Settings, Edit, Trash2, BarChart3, BookOpen, Globe, DollarSign, TrendingUp, ArrowUpDown, Copy, Languages } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProjectWithRelations } from "@shared/schema";

export default function Projects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt"); // Default sort by creation date
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithRelations | null>(null);
  const [deleteAssociatedBooks, setDeleteAssociatedBooks] = useState(false);
  const [bookToTranslate, setBookToTranslate] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Language options for translation
  const LANGUAGE_OPTIONS = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Polish", "Swedish", 
    "Norwegian", "Danish", "Finnish", "Czech", "Hungarian", "Romanian", "Bulgarian", "Croatian", "Serbian", 
    "Slovak", "Slovenian", "Lithuanian", "Latvian", "Estonian", "Greek", "Turkish", "Arabic", "Hebrew", 
    "Chinese (Simplified)", "Chinese (Traditional)", "Japanese", "Korean", "Thai", "Vietnamese", "Indonesian", 
    "Malay", "Filipino", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", 
    "Punjabi", "Urdu", "Swahili", "Hausa", "Yoruba", "Zulu", "Amharic"
  ];

  const { data: projects, isLoading: projectsLoading, error } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
    staleTime: 0, // Always refetch to get latest book changes including ISBN
  });

  // Duplication mutation
  const duplicateProject = useMutation({
    mutationFn: async (project: ProjectWithRelations) => {
      console.log("Starting duplication for project:", project.name);
      try {
        const result = await apiRequest(`/api/projects/${project.id}/duplicate`, { method: "POST" });
        console.log("Duplication successful:", result);
        return result;
      } catch (error) {
        console.error("Duplication failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("onSuccess called with:", data);
      toast.success({
        title: "Success",
        description: "Project and all books duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      console.error("onError called with:", error);
      toast.error({
        title: "Error",
        description: "Failed to duplicate project",
      });
    },
  });

  // Delete mutation
  const deleteProject = useMutation({
    mutationFn: async ({ projectId, deleteBooks }: { projectId: string; deleteBooks: boolean }) => {
      console.log("Deleting project:", projectId, "with deleteBooks:", deleteBooks);
      return await apiRequest(`/api/projects/${projectId}?deleteBooks=${deleteBooks}`, { method: "DELETE" });
    },
    onSuccess: (_, { deleteBooks }) => {
      toast.success({
        title: "Success",
        description: deleteBooks 
          ? "Project and associated books deleted successfully" 
          : "Project deleted successfully, books have been unlinked",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      toast.error({
        title: "Error",
        description: "Failed to delete project",
      });
    },
  });

  // Book duplication mutation
  const duplicateBook = useMutation({
    mutationFn: async (bookId: string) => {
      console.log("Duplicating book:", bookId);
      return await apiRequest(`/api/books/${bookId}/duplicate`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        description: "Book duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      console.error("Book duplication failed:", error);
      toast.error({
        title: "Error",
        description: "Failed to duplicate book",
      });
    },
  });

  // Book translation mutation
  const translateBookMutation = useMutation({
    mutationFn: async ({ bookId, targetLanguage }: { bookId: string; targetLanguage: string }) => {
      return await apiRequest(`/api/books/${bookId}/translate`, { method: "POST", body: { targetLanguage } });
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        description: "Book translated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setBookToTranslate(null);
      setSelectedLanguage("");
    },
    onError: (error) => {
      console.error("Book translation failed:", error);
      toast.error({
        title: "Error", 
        description: "Failed to translate book",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast.error({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Filter and sort projects
  const filteredProjects = Array.isArray(projects) ? projects
    .filter((project: any) => {
      const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      const getCurrentMonthRevenue = (project: any) => {
        if (!project.books || !Array.isArray(project.books)) return 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return project.books.reduce((total: number, book: any) => {
          // For now, we'll use monthlyRevenue field if available
          return total + (parseFloat(book.monthlyRevenue) || 0);
        }, 0);
      };

      const getLastModifiedDate = (project: any) => {
        if (!project.books || !Array.isArray(project.books)) return new Date(project.updatedAt);
        const dates = project.books.map((book: any) => new Date(book.updatedAt));
        dates.push(new Date(project.updatedAt));
        return new Date(Math.max(...dates.map((d: Date) => d.getTime())));
      };

      const getTotalRevenue = (project: any) => {
        return parseFloat(project.totalRevenue) || 0;
      };

      switch (sortBy) {
        case "alphabetical":
          return (a.name || "").localeCompare(b.name || "");
        case "alphabetical-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "createdAt-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "lastModified":
          return getLastModifiedDate(b).getTime() - getLastModifiedDate(a).getTime();
        case "monthlyRevenue":
          return getCurrentMonthRevenue(b) - getCurrentMonthRevenue(a);
        case "totalRevenue":
          return getTotalRevenue(b) - getTotalRevenue(a);
        case "status-asc":
          return (a.status || '').localeCompare(b.status || '');
        case "status-desc":
          return (b.status || '').localeCompare(a.status || '');
        default:
          return 0;
      }
    }) : [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "in_review": return "secondary";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "in_review": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const generateProjectInitials = (title: string) => {
    return title.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleEditProject = (project: ProjectWithRelations) => {
    setLocation(`/projects/edit/${project.id}`);
  };

  const handleDuplicateProject = (project: ProjectWithRelations) => {
    console.log("Duplicating project:", project);
    duplicateProject.mutate(project);
  };

  const handleDeleteProject = (project: ProjectWithRelations) => {
    setProjectToDelete(project);
    setDeleteAssociatedBooks(false); // Reset checkbox state
  };

  const handleDuplicateBook = (bookId: string) => {
    duplicateBook.mutate(bookId);
  };

  const handleTranslateBook = (book: any) => {
    setBookToTranslate(book);
    setSelectedLanguage("");
  };

  const handleConfirmTranslation = () => {
    if (bookToTranslate && selectedLanguage) {
      translateBookMutation.mutate({
        bookId: bookToTranslate.id,
        targetLanguage: selectedLanguage
      });
    }
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      <TooltipProvider>
          {/* Projects Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <p className="text-gray-600 mt-1">Manage your book projects and track their progress.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setLocation("/project-create-simple")} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
                <Button onClick={() => setLocation("/books/create")} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Book
                </Button>
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[220px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                  <SelectItem value="alphabetical-desc">Alphabetical (Z-A)</SelectItem>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="lastModified">Last Modified</SelectItem>
                  <SelectItem value="status-asc">Status A-Z</SelectItem>
                  <SelectItem value="status-desc">Status Z-A</SelectItem>
                  <SelectItem value="monthlyRevenue">Most Profitable This Month</SelectItem>
                  <SelectItem value="totalRevenue">Highest Total Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters or search terms." 
                  : "Get started by creating your first book project."}
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setLocation("/project-create-simple")} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                  <Button onClick={() => setLocation("/books/create")} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Book
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project: ProjectWithRelations) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 gradient-blue-purple rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {generateProjectInitials(project.name || 'Project')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CardTitle className="text-base font-medium text-gray-900 leading-tight mb-1 cursor-help">
                                {project.name}
                              </CardTitle>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{project.name}</p>
                            </TooltipContent>
                          </Tooltip>
                          {project.description && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-gray-600 leading-relaxed break-words cursor-help">
                                  {project.description}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{project.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-blue-50">
                            <Settings className="w-4 h-4 text-[#38b6ff]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProject(project)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Books List */}
                      {project.books && project.books.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <BookOpen className="w-4 h-4" />
                            Books ({project.books.length})
                          </div>
                          {project.books
                            .slice(0, expandedProjects.has(project.id) ? project.books.length : 3)
                            .map((book: any) => (
                            <div key={book.id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <h4 
                                        className="text-sm font-medium text-gray-900 leading-tight break-words cursor-pointer hover:!text-blue-600 transition-colors"
                                        onClick={() => setLocation(`/books/edit/${book.id}`)}
                                      >
                                        {book.title}
                                      </h4>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{book.title}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {book.format}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                      <Globe className="w-3 h-3" />
                                      {book.language || 'English'}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                      <span className="font-medium">ISBN:</span>
                                      {book.isbn ? (
                                        <span className="font-medium text-gray-700">{book.isbn}</span>
                                      ) : book.isbnPlaceholder ? (
                                        <span className="text-amber-600">{book.isbnPlaceholder}</span>
                                      ) : (
                                        <span>No ISBN</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <Badge className={getStatusColor(book.status || 'draft')}>
                                    {(book.status || 'draft').replace('_', ' ')}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-50">
                                        <Settings className="w-3 h-3 text-[#38b6ff]" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setLocation(`/books/edit/${book.id}`)}>
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateBook(book.id)}>
                                        <Copy className="w-3 h-3 mr-2" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleTranslateBook(book)}>
                                        <Languages className="w-3 h-3 mr-2" />
                                        Create Translated Copy
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              
                              {/* Book Revenue Stats */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                                    <TrendingUp className="w-3 h-3" />
                                    This Month
                                  </div>
                                  <div className="font-medium">${parseFloat(book.monthlyRevenue || '0').toFixed(2)}</div>
                                  <div className="text-gray-500">{book.monthlySales || 0} sales</div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                                    <DollarSign className="w-3 h-3" />
                                    Total
                                  </div>
                                  <div className="font-medium">${parseFloat(book.totalRevenue || '0').toFixed(2)}</div>
                                  <div className="text-gray-500">{book.totalSales || 0} sales</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* See More / Show Less Button */}
                          {project.books.length > 3 && (
                            <div className="text-center pt-2">
                              <button
                                onClick={() => toggleProjectExpansion(project.id)}
                                className="text-sm text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                {expandedProjects.has(project.id) ? 'Show Less' : 'See More'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No books in this project</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setLocation(`/books/create?projectId=${project.id}`)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Book
                          </Button>
                        </div>
                      )}

                      {/* Project Revenue Summary */}
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-gray-500 mb-1">
                              <TrendingUp className="w-4 h-4" />
                              Monthly Revenue
                            </div>
                            <div className="font-semibold text-green-600">
                              ${project.books?.reduce((sum, book) => sum + parseFloat(book.monthlyRevenue || '0'), 0).toFixed(2) || '0.00'}
                            </div>
                            <div className="text-xs text-gray-500">{project.books?.reduce((sum, book) => sum + (book.totalSales || 0), 0) || 0} sales this month</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-gray-500 mb-1">
                              <DollarSign className="w-4 h-4" />
                              Total Revenue  
                            </div>
                            <div className="font-semibold text-blue-600">
                              ${parseFloat(project.totalRevenue || '0').toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">{project.totalSales || 0} sales</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => {
        setProjectToDelete(null);
        setDeleteAssociatedBooks(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              {projectToDelete?.books && projectToDelete.books.length > 0 && (
                <span className="block mt-2 text-sm">
                  This project has {projectToDelete.books.length} associated book(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Checkbox for deleting associated books */}
          {projectToDelete?.books && projectToDelete.books.length > 0 && (
            <div className="px-6 pb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-books"
                  checked={deleteAssociatedBooks}
                  onCheckedChange={(checked) => setDeleteAssociatedBooks(checked as boolean)}
                />
                <label
                  htmlFor="delete-books"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Also delete all books associated with this project?
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {deleteAssociatedBooks 
                  ? "Books will be permanently deleted."
                  : "Books will be unlinked from the project but kept in your library."
                }
              </p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (projectToDelete) {
                  deleteProject.mutate({ 
                    projectId: projectToDelete.id, 
                    deleteBooks: deleteAssociatedBooks 
                  });
                  setProjectToDelete(null);
                  setDeleteAssociatedBooks(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Translation Dialog */}
      <Dialog open={!!bookToTranslate} onOpenChange={() => {
        setBookToTranslate(null);
        setSelectedLanguage("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Translate Book</DialogTitle>
            <DialogDescription>
              Create a translated version of "{bookToTranslate?.title}" in another language.
              This will create a new book with translated content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Language:</label>
              <p className="text-sm text-muted-foreground">{bookToTranslate?.language || 'English'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Translate to:</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {LANGUAGE_OPTIONS
                    .filter(lang => lang !== bookToTranslate?.language)
                    .map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBookToTranslate(null);
                setSelectedLanguage("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmTranslation}
              disabled={!selectedLanguage || translateBookMutation.isPending}
            >
              {translateBookMutation.isPending ? "Translating..." : "Create Translation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TooltipProvider>
    </Layout>
  );
}
