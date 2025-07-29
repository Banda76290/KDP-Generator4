import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  BookOpen, 
  Edit, 
  Copy, 
  MoreVertical, 
  AlertTriangle,
  Plus
} from "lucide-react";
import type { Book, Project } from "@shared/schema";

type SortOption = "title-asc" | "title-desc" | "date-asc" | "date-desc" | "status-asc" | "status-desc";

export default function BooksPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 md:ml-64">
          <BooksContent />
        </main>
      </div>
    </div>
  );
}

function BooksContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterAssignment, setFilterAssignment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all books
  const { data: books = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Fetch all projects for assignment dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Mutation for assigning book to project
  const assignBookMutation = useMutation({
    mutationFn: async ({ bookId, projectId }: { bookId: string; projectId: string }) => {
      return apiRequest("PATCH", `/api/books/${bookId}`, { projectId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book assigned to project successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for duplicating book
  const duplicateBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      return apiRequest("POST", `/api/books/${bookId}/duplicate`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort books
  const filteredAndSortedBooks = books
    .filter((book: Book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.authorFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.authorLastName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || book.status === filterStatus;
      const matchesFormat = filterFormat === "all" || book.format === filterFormat;
      const matchesAssignment = filterAssignment === "all" ||
                               (filterAssignment === "assigned" && book.projectId) ||
                               (filterAssignment === "unassigned" && !book.projectId);
      
      return matchesSearch && matchesStatus && matchesFormat && matchesAssignment;
    })
    .sort((a: Book, b: Book) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "date-desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "status-asc":
          return (a.status || '').localeCompare(b.status || '');
        case "status-desc":
          return (b.status || '').localeCompare(a.status || '');
        default:
          return 0;
      }
    });

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "review":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "ebook":
        return "📱";
      case "paperback":
        return "📖";
      case "hardcover":
        return "📚";
      case "audiobook":
        return "🎧";
      default:
        return "📄";
    }
  };

  const unassignedBooksCount = books.filter((book: Book) => !book.projectId).length;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground">
            Manage all your books and their project assignments
          </p>
          {unassignedBooksCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">
                {unassignedBooksCount} book{unassignedBooksCount !== 1 ? 's' : ''} not assigned to any project
              </span>
            </div>
          )}
        </div>
        <Link href="/books/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterFormat} onValueChange={setFilterFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="ebook">eBook</SelectItem>
            <SelectItem value="paperback">Paperback</SelectItem>
            <SelectItem value="hardcover">Hardcover</SelectItem>
            <SelectItem value="audiobook">Audiobook</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignment} onValueChange={setFilterAssignment}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            <SelectItem value="assigned">Assigned to Project</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title-asc">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Title A-Z
              </div>
            </SelectItem>
            <SelectItem value="title-desc">
              <div className="flex items-center gap-2">
                <SortDesc className="h-4 w-4" />
                Title Z-A
              </div>
            </SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="status-asc">Status A-Z</SelectItem>
            <SelectItem value="status-desc">Status Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      {booksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedBooks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== "all" || filterFormat !== "all" || filterAssignment !== "all"
                ? "Try adjusting your filters or search term"
                : "Create your first book to get started"}
            </p>
            <Link href="/books/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBooks.map((book: Book) => (
            <Card key={book.id} className={`relative ${!book.projectId ? 'border-amber-200 bg-amber-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{book.title}</CardTitle>
                    {book.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{book.subtitle}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/books/edit/${book.id}`} className="flex items-center">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => duplicateBookMutation.mutate(book.id)}
                        disabled={duplicateBookMutation.isPending}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Author */}
                  {(book.authorFirstName || book.authorLastName) && (
                    <p className="text-sm text-muted-foreground">
                      by {[book.authorFirstName, book.authorLastName].filter(Boolean).join(' ')}
                    </p>
                  )}

                  {/* Status and Format */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusBadgeVariant(book.status)}>
                      {book.status}
                    </Badge>
                    <Badge variant="outline">
                      {getFormatIcon(book.format)} {book.format}
                    </Badge>
                  </div>

                  {/* Project Assignment */}
                  <div className="space-y-2">
                    {book.projectId ? (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Project: </span>
                        <span className="font-medium">{getProjectName(book.projectId)}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Not assigned to any project</span>
                        </div>
                        <Select
                          onValueChange={(projectId) => 
                            assignBookMutation.mutate({ bookId: book.id, projectId })
                          }
                          disabled={assignBookMutation.isPending}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Assign to project..." />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project: Project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Revenue */}
                  {book.totalRevenue && parseFloat(book.totalRevenue) > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Revenue: </span>
                      <span className="font-medium">${book.totalRevenue}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}