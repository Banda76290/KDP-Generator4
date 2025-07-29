import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, BarChart3, BookOpen, Globe, DollarSign, TrendingUp, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ProjectWithRelations } from "@shared/schema";

export default function Projects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt"); // Default sort by creation date

  const { data: projects, isLoading: projectsLoading, error } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
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
        return new Date(Math.max(...dates.map(d => d.getTime())));
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
        case "lastModified":
          return getLastModifiedDate(b).getTime() - getLastModifiedDate(a).getTime();
        case "monthlyRevenue":
          return getCurrentMonthRevenue(b) - getCurrentMonthRevenue(a);
        case "totalRevenue":
          return getTotalRevenue(b) - getTotalRevenue(a);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 md:ml-64">
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
                  <SelectItem value="createdAt">Creation Date</SelectItem>
                  <SelectItem value="lastModified">Last Modified</SelectItem>
                  <SelectItem value="monthlyRevenue">Most Profitable This Month</SelectItem>
                  <SelectItem value="totalRevenue">Most Profitable All Time</SelectItem>
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
                          <CardTitle className="text-base font-medium text-gray-900 leading-tight mb-1">
                            {project.name}
                          </CardTitle>
                          {project.description && (
                            <p className="text-sm text-gray-600 leading-relaxed break-words">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
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
                          {project.books.map((book: any) => (
                            <div key={book.id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 leading-tight break-words">{book.title}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {book.format}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                      <Globe className="w-3 h-3" />
                                      {book.language || 'English'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <Badge className={getStatusColor(book.status || 'draft')} size="sm">
                                    {(book.status || 'draft').replace('_', ' ')}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setLocation(`/books/edit/${book.id}`)}
                                    title="Edit book"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
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
                              ${parseFloat(project.monthlyRevenue || '0').toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">{project.monthlySales || 0} sales</div>
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
        </main>
      </div>

    </div>
  );
}
