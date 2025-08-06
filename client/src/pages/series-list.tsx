import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, Search, Plus, MoreVertical, Edit3, Trash2, Book, X, DollarSign, TrendingUp, SortAsc, SortDesc, Globe } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BookData {
  id: string;
  title: string;
  seriesNumber: number | null;
  status: string;
  format: string;
  totalRevenue: string;
  monthlyRevenue: string;
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
        credentials: 'include' // Include cookies for authentication});
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      return response.json();
    });
    staleTime: 0,
  });

  // Filter and sort series
  const filteredSeries = series
    .filter((seriesItem: SeriesData) => {
      const matchesSearch = seriesItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (seriesItem.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }
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
        case "lastModified":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "language-az":
          return a.language.localeCompare(b.language);
        case "language-za":
          return b.language.localeCompare(a.language);
        case "mostBooks":
          return (b.books?.length || 0) - (a.books?.length || 0);
        case "highestRevenue":
          const revenueA = calculateSeriesRevenue(a.books || []);
          const revenueB = calculateSeriesRevenue(b.books || []);
          return parseFloat(revenueB.totalRevenue) - parseFloat(revenueA.totalRevenue);
        default:
          return 0;
      }
    });

  const handleDeleteSeries = (seriesId: string) => {
    console.log("Deleting series:", seriesId);
    deleteSeries.mutate(seriesId);
  });

  const handleCreateSeries = () => {
    setLocation('/series-setup');
  });

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
                onChange={ (e) => setSearchTerm(e.target.value }
                className="pl-10 w-full sm:w-80"
              />
            </div>
            
            <Select value={sortBy} onValueChange={ (value) => setSortBy(value as typeof sortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title-az">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Title A-Z
                  </div>
                </SelectItem>
                <SelectItem value="title-za">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Title Z-A
                  </div>
                </SelectItem>
                <SelectItem value="lastModified">Last Modified</SelectItem>
                <SelectItem value="language-az">Language A-Z</SelectItem>
                <SelectItem value="language-za">Language Z-A</SelectItem>
                <SelectItem value="mostBooks">Most Books</SelectItem>
                <SelectItem value="highestRevenue">Highest Total Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading and Error States */}
        { isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading series...</div>
          </div>}

        { error && (
          <div className="text-center py-8">
            <div className="text-red-600">Failed to load series. Please try again.</div>
          </div>}

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
              onClick={ () => setLocation('/series-setup' }
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
                              onSelect={ (e) => e.preventDefault(}
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
                                onClick={ () => handleDeleteSeries(seriesItem.id }
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
                          Books in this series ({seriesItem.books.length}
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {seriesItem.books
                            .sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0))
                            .map((book) => (
                              <div key={book.id} className="text-xs p-3 bg-gray-50 rounded space-y-2">
                                {/* First row: Series number and title with remove button */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    {book.seriesNumber && (
                                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0">
                                        #{book.seriesNumber}
                                      </span>
                                    )}
                                    <span className="font-medium truncate">{book.title}</span>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0 ml-2"
                                        title="Remove book from series"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Book from Series</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove "{book.title}" from this series? 
                                          The book will remain in your library but will no longer be part of "{seriesItem.title}".
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={ () => removeBookFromSeries.mutate(book.id }
                                          disabled={removeBookFromSeries.isPending}
                                        >
                                          {removeBookFromSeries.isPending ? "Removing..." : "Remove from Series"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                
                                {/* Second row: Format and status badges */}
                                <div className="flex items-center space-x-2">
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
                    { (!seriesItem.books || seriesItem.books.length === 0) && (
                      <div className="text-xs text-gray-500 italic flex items-center">
                        <Book className="w-3 h-3 mr-1" />
                        No books in this series yet
                      </div>}

                    {/* Revenue Statistics */}
                    {seriesItem.books && seriesItem.books.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-green-100 rounded">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">This Month</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ${calculateSeriesRevenue(seriesItem.books).monthlyRevenue}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-blue-100 rounded">
                            <DollarSign className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Revenue</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ${calculateSeriesRevenue(seriesItem.books).totalRevenue}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Creation Date */}
                    <div className="text-xs text-gray-500 pt-2">
                      Created: { new Date(seriesItem.createdAt).toLocaleDateString(}
                    </div>


                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
}