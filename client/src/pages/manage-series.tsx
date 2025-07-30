import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { 
  MoreVertical, 
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Eye
} from "lucide-react";
interface SeriesBook {
  id: string;
  title: string;
  authorFirstName: string;
  authorLastName: string;
  status: string;
  format: string;
  seriesNumber: number;
}

interface SeriesData {
  title: string;
  status: string;
  books: SeriesBook[];
  totalBooks: number;
  publishedBooks: number;
  description?: string;
}

export default function ManageSeriesPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
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
    <Layout>
      <ManageSeriesContent />
    </Layout>
  );
}

function ManageSeriesContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSeries, setSelectedSeries] = useState<string>("From Zero to Hero");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "From Zero to Hero",
    description: "Enter the exciting world of online commerce with the 'From Zero to Hero' book series. Whether you're a novice looking to launch your first online business or an experienced entrepreneur seeking to hone your skills, this comprehensive training series will guide you step by step to succeed in the field of e-commerce.",
    status: "LIVE"
  });

  // Mock data for demonstration - replace with real API calls
  const seriesData: SeriesData = {
    title: "From Zero to Hero",
    status: "LIVE",
    description: "Enter the exciting world of online commerce with the 'From Zero to Hero' book series. Whether you're a novice looking to launch your first online business or an experienced entrepreneur seeking to hone your skills, this comprehensive training series will guide you step by step to succeed in the field of e-commerce.",
    books: [
      {
        id: "1",
        title: "from zero to hero in dropshipping with shopify",
        authorFirstName: "Sébastien",
        authorLastName: "JULLIARD-BESSON",
        status: "published",
        format: "2 Live",
        seriesNumber: 1
      },
      {
        id: "2", 
        title: "from zero to hero with google analytics",
        authorFirstName: "Sébastien",
        authorLastName: "JULLIARD-BESSON",
        status: "published",
        format: "2 Live",
        seriesNumber: 2
      },
      {
        id: "3",
        title: "from zero to hero with google analytics",
        authorFirstName: "Sébastien", 
        authorLastName: "JULLIARD-BESSON",
        status: "blocked",
        format: "1 Blocked",
        seriesNumber: 3
      }
    ],
    totalBooks: 3,
    publishedBooks: 2
  };

  const handleSaveDetails = () => {
    toast.success({
      title: "Série mise à jour",
      description: "Les détails de la série ont été sauvegardés avec succès.",
    });
    setIsEditing(false);
  };

  const handleAddExistingTitle = () => {
    toast.success({
      title: "Titre ajouté",
      description: "Le titre existant a été ajouté à la série.",
    });
  };

  const handleCreateNewTitle = () => {
    toast.success({
      title: "Nouveau titre créé",
      description: "Un nouveau titre a été créé et ajouté à la série.",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600 mb-6">
          <span className="mx-2">›</span>
          <span className="kdp-text-primary">Manage Series</span>
        </div>

      {/* Series Header */}
      <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {/* Series Icon */}
              <div className="flex items-center justify-center w-20 h-20 bg-gray-100 border rounded">
                <div className="grid grid-cols-3 gap-1 w-12 h-12">
                  <div className="bg-gray-300 rounded text-xs flex items-center justify-center font-bold">2</div>
                  <div style={{ backgroundColor: '#38b6ff' }} className="text-white rounded text-xs flex items-center justify-center font-bold">1</div>
                  <div className="bg-gray-300 rounded text-xs flex items-center justify-center font-bold">3</div>
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{editData.title}</h1>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Series Status:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      {editData.status}
                    </Badge>
            <button style={{ color: '#38b6ff' }} className="text-sm underline">View on Amazon</button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Display reading order: <strong>No</strong></span>
                </div>
              </div>
            </div>

            {/* Series Description */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Series description:</label>
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter series description..."
                />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{editData.description}</p>
              )}
            </div>

            <button className="kdp-text-primary text-sm underline mb-6">See more</button>
          </div>

          <div className="flex flex-col gap-2 ml-6">
            {isEditing ? (
              <>
                <Button onClick={handleSaveDetails} style={{ backgroundColor: '#38b6ff' }} className="hover:opacity-90 text-white">
                  Save series details
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} style={{ backgroundColor: '#38b6ff' }} className="hover:opacity-90 text-white">
                Edit series details
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Manage series
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Edit series details</DropdownMenuItem>
                <DropdownMenuItem>View series on Amazon</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete series</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      {/* Main Content Section */}
      <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Main content</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAddExistingTitle}>
                  + Add existing title
                </Button>
                <Button onClick={handleCreateNewTitle} style={{ backgroundColor: '#146eb4' }} className="hover:opacity-90 text-white">
                  + Create new title
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {seriesData.books.map((book, index) => (
              <div key={book.id} className="flex items-center p-4 border-b last:border-b-0">
                {/* Book Cover Placeholder */}
                <div className="w-16 h-20 bg-gray-200 rounded mr-4 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>

                {/* Book Details */}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    By {book.authorFirstName} {book.authorLastName}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Formats:</span>
                    <Badge 
                      variant={book.status === "published" ? "secondary" : "destructive"}
                      className={book.status === "published" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {book.format}
                    </Badge>
                    {book.status === "blocked" && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        1 Draft
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Series actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit book details</DropdownMenuItem>
                      <DropdownMenuItem>Move up in series</DropdownMenuItem>
                      <DropdownMenuItem>Move down in series</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Remove from series</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    Edit book order
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
    </div>
  );
}