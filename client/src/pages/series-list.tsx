import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, Search, Plus, MoreVertical, Edit3, Trash2, Book } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BookData {
  id: string;
  title: string;
  seriesNumber: number | null;
  status: string;
  format: string;
}

interface SeriesData {
  id: string;
  title: string;
  description: string;
  language: string;
  readingOrder: string;
  createdAt: string;
  updatedAt: string;
  books: BookData[];
}

// Fetch series data from API
function useSeriesData() {
  return useQuery({
    queryKey: ['/api/series'],
    queryFn: async () => {
      const response = await fetch('/api/series', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data to see updated series with books
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export default function SeriesListPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: series = [], isLoading, error } = useSeriesData();

  // Filter and sort series
  const filteredSeries = series
    .filter((seriesItem: SeriesData) => {
      const matchesSearch = seriesItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (seriesItem.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a: SeriesData, b: SeriesData) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title-az":
          return a.title.localeCompare(b.title);
        case "title-za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const handleDeleteSeries = (seriesId: string) => {
    // TODO: Implement series deletion
    console.log("Deleting series:", seriesId);
  };

  const handleCreateSeries = () => {
    setLocation('/series-setup');
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Series</h1>
            <p className="text-gray-600 mt-2">Manage your book series and organize your content</p>
          </div>
          <Button 
            onClick={handleCreateSeries}
            style={{ backgroundColor: '#38b6ff' }} 
            className="hover:opacity-90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Series
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title-az">Title A-Z</SelectItem>
                <SelectItem value="title-za">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading series...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600">Failed to load series. Please try again.</div>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && (
          <div className="text-sm text-gray-600">
            {filteredSeries.length} series found
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredSeries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No series found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "Try adjusting your search terms" : "Create your first series to get started"}
            </p>
            <Button 
              onClick={() => setLocation('/series-setup')}
              style={{ backgroundColor: '#38b6ff' }} 
              className="hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Series
            </Button>
          </div>
        )}

        {/* Series Grid */}
        {!isLoading && !error && filteredSeries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map((seriesItem: SeriesData) => (
              <Card key={seriesItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{seriesItem.title}</CardTitle>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {seriesItem.language}
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          {seriesItem.readingOrder}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/series-setup/${seriesItem.id}`} className="flex items-center">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Series Setup
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/series-edit/${seriesItem.id}`} className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Manage Series
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Series
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the series "{seriesItem.title}"? 
                                This action cannot be undone and will remove all book links to this series.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteSeries(seriesItem.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Series
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Description */}
                    <div 
                      className="text-sm text-gray-600 line-clamp-3 series-description"
                      dangerouslySetInnerHTML={{ 
                        __html: seriesItem.description || "No description provided" 
                      }}
                    />

                    {/* Books in Series */}
                    {seriesItem.books && seriesItem.books.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-800 flex items-center">
                          <Book className="w-4 h-4 mr-1" />
                          Books in this series ({seriesItem.books.length})
                        </h4>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {seriesItem.books
                            .sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0))
                            .map((book) => (
                              <div key={book.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  {book.seriesNumber && (
                                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">
                                      #{book.seriesNumber}
                                    </span>
                                  )}
                                  <span className="font-medium truncate max-w-[120px]">{book.title}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {book.format}
                                  </Badge>
                                  <Badge 
                                    variant={book.status === 'published' ? 'default' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {book.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* No Books Message */}
                    {(!seriesItem.books || seriesItem.books.length === 0) && (
                      <div className="text-xs text-gray-500 italic flex items-center">
                        <Book className="w-3 h-3 mr-1" />
                        No books in this series yet
                      </div>
                    )}

                    {/* Creation Date */}
                    <div className="text-xs text-gray-500">
                      Created: {new Date(seriesItem.createdAt).toLocaleDateString()}
                    </div>


                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}