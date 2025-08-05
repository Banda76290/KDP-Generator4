import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, BookOpen, Eye, FolderOpen } from "lucide-react";
import type { AuthorWithRelations } from "@shared/schema";

export default function AuthorsListPage() {
  const [, setLocation] = useLocation();

  // Fetch authors
  const { data: authors = [], isLoading: authorsLoading } = useQuery({
    queryKey: ["/api/authors"],
    queryFn: () => apiRequest("GET", "/api/authors"),
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Authors</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your publishing authors</p>
          </div>
          <Button onClick={() => setLocation("/authors/create")} className="kdp-btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Author
          </Button>
        </div>

        {/* Authors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authorsLoading ? (
            <div className="col-span-full text-center py-8">Loading authors...</div>
          ) : authors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">No authors yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Get started by creating your first author
              </p>
              <Button onClick={() => setLocation("/authors/create")} className="kdp-btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create First Author
              </Button>
            </div>
          ) : (
            authors.map((author: AuthorWithRelations) => (
              <Card key={author.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-2" style={{ color: 'var(--kdp-primary-blue)' }} />
                      <span className="truncate">{author.fullName}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>0 books</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderOpen className="w-4 h-4" />
                        <span>0 projects</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setLocation(`/authors/${author.id}`)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}