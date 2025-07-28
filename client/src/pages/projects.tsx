import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProjectModal from "@/components/projects/ProjectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, BarChart3 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ProjectWithRelations } from "@shared/schema";

export default function Projects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);

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

  // Filter projects based on search and status
  const filteredProjects = projects?.filter((project: ProjectWithRelations) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

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
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleCloseModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {/* Projects Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <p className="text-gray-600 mt-1">Manage your book projects and track their progress.</p>
              </div>
              <Button onClick={() => setShowProjectModal(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>

            {/* Filters */}
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
            </div>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Button onClick={() => setShowProjectModal(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: ProjectWithRelations) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 gradient-blue-purple rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {generateProjectInitials(project.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium text-gray-900 truncate">
                            {project.title}
                          </CardTitle>
                          {project.subtitle && (
                            <p className="text-sm text-gray-600 truncate mt-1">{project.subtitle}</p>
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
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        {project.useAI && (
                          <Badge variant="secondary" className="text-xs">
                            AI Enhanced
                          </Badge>
                        )}
                      </div>
                      
                      {project.formats && project.formats.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Formats:</p>
                          <div className="flex flex-wrap gap-1">
                            {project.formats.map((format) => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Sales</p>
                          <p className="font-medium">{project.totalSales || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-medium">${project.totalRevenue || '0.00'}</p>
                        </div>
                      </div>

                      {project.contributors && project.contributors.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Contributors:</p>
                          <div className="flex flex-wrap gap-1">
                            {project.contributors.slice(0, 2).map((contributor) => (
                              <Badge key={contributor.id} variant="outline" className="text-xs">
                                {contributor.name}
                              </Badge>
                            ))}
                            {project.contributors.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.contributors.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal 
          isOpen={showProjectModal} 
          onClose={handleCloseModal}
          project={editingProject}
        />
      )}
    </div>
  );
}
