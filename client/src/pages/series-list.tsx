import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, Search, Plus, MoreVertical, Edit3, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SeriesData {
  id: string;
  title: string;
  description: string;
  status: string;
  booksCount: number;
  totalRevenue: string;
  createdAt: string;
  books: Array<{
    id: string;
    title: string;
    status: string;
    format: string;
  }>;
}

// Mock data pour l'instant
const mockSeries: SeriesData[] = [
  {
    id: "1",
    title: "Marketing Mastery",
    description: "Une série complète sur les stratégies de marketing digital et traditionnel pour entrepreneurs.",
    status: "Active",
    booksCount: 3,
    totalRevenue: "1,250.00",
    createdAt: "2024-01-15",
    books: [
      { id: "1", title: "Marketing Digital Avancé", status: "published", format: "ebook" },
      { id: "2", title: "Stratégies Publicitaires", status: "draft", format: "ebook" },
      { id: "3", title: "Analyse de Marché", status: "published", format: "paperback" }
    ]
  },
  {
    id: "2", 
    title: "Développement Personnel",
    description: "Guide complet pour l'amélioration personnelle et professionnelle.",
    status: "Draft",
    booksCount: 2,
    totalRevenue: "750.50",
    createdAt: "2024-02-20",
    books: [
      { id: "4", title: "Confiance en Soi", status: "published", format: "ebook" },
      { id: "5", title: "Leadership Efficace", status: "draft", format: "ebook" }
    ]
  },
  {
    id: "3",
    title: "Cuisine Française",
    description: "Collection de recettes traditionnelles françaises remises au goût du jour.",
    status: "Active",
    booksCount: 4,
    totalRevenue: "2,100.75",
    createdAt: "2023-11-10",
    books: [
      { id: "6", title: "Entrées Françaises", status: "published", format: "paperback" },
      { id: "7", title: "Plats Principaux", status: "published", format: "paperback" },
      { id: "8", title: "Desserts Traditionnels", status: "published", format: "ebook" },
      { id: "9", title: "Cuisine Régionale", status: "draft", format: "paperback" }
    ]
  }
];

export default function SeriesListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Filter and sort series
  const filteredSeries = mockSeries
    .filter(series => {
      const matchesSearch = series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || series.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title-az":
          return a.title.localeCompare(b.title);
        case "title-za":
          return b.title.localeCompare(a.title);
        case "most-books":
          return b.booksCount - a.booksCount;
        case "highest-revenue":
          return parseFloat(b.totalRevenue.replace(",", "")) - parseFloat(a.totalRevenue.replace(",", ""));
        default:
          return 0;
      }
    });

  const handleDeleteSeries = (seriesId: string) => {
    // TODO: Implement series deletion
    console.log("Deleting series:", seriesId);
  };

  const handleCreateSeries = () => {
    // TODO: Redirect to series creation page
    console.log("Creating new series");
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title-az">Title A-Z</SelectItem>
                <SelectItem value="title-za">Title Z-A</SelectItem>
                <SelectItem value="most-books">Most books</SelectItem>
                <SelectItem value="highest-revenue">Highest revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {filteredSeries.length} series found
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeries.map((series) => (
            <Card key={series.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{series.title}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={
                        series.status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {series.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href={`/series-edit/${series.id}`} className="flex items-center">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Series
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
                              Are you sure you want to delete the series "{series.title}"? 
                              This action cannot be undone and will remove all book links to this series.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSeries(series.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {series.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{series.booksCount} book{series.booksCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-green-600 font-medium">
                    €{series.totalRevenue}
                  </div>
                </div>

                {/* Books Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Books in this series:</h4>
                  <div className="space-y-1">
                    {series.books.slice(0, 2).map((book) => (
                      <div key={book.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1">{book.title}</span>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            book.status === "published" 
                              ? "border-green-200 text-green-700" 
                              : "border-gray-200 text-gray-600"
                          }`}
                        >
                          {book.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    ))}
                    {series.books.length > 2 && (
                      <div className="text-xs text-gray-400">
                        ... and {series.books.length - 2} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/series-edit/${series.id}`}>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    style={{ borderColor: '#38b6ff', color: '#38b6ff' }}
                  >
                    Manage Series
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSeries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all" ? "No series found" : "No series created"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search criteria"
                : "Create your first series to organize your books"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button 
                onClick={handleCreateSeries}
                style={{ backgroundColor: '#38b6ff' }} 
                className="hover:opacity-90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create My First Series
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}