import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, User, BookOpen, FolderOpen, Search } from "lucide-react";
import type { AuthorWithRelations } from "@shared/schema";

export default function AuthorsListPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch authors with counts
  const { data: authors = [], isLoading: authorsLoading } = useQuery({
    queryKey: ["/api/authors", "withCounts"],
    queryFn: () => apiRequest("/api/authors?withCounts=true"),
  });

  // Filter authors based on search query
  const filteredAuthors = authors.filter((author: AuthorWithRelations & { bookCount: number; projectCount: number }) => 
    author.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Authors & Contributors</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your publishing authors and contributors</p>
          </div>
          <Button onClick={() => setLocation("/authors/create")} className="kdp-btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Contributor
          </Button>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search authors & contributors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {/* Authors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authorsLoading ? (
            <div className="col-span-full text-center py-8">Loading authors...</div>
          ) : authors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">No contributors yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Get started by creating your first author or contributor
              </p>
              <Button onClick={() => setLocation("/authors/create")} className="kdp-btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create First Contributor
              </Button>
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">No contributors found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No contributors match your search criteria "{searchQuery}"
              </p>
            </div>
          ) : (
            filteredAuthors.map((author: AuthorWithRelations & { bookCount: number; projectCount: number }) => (
              <Card key={author.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      {author.profileImageUrl ? (
                        <img 
                          src={author.profileImageUrl} 
                          alt={`${author.fullName}'s profile`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 mr-3 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 mr-3 flex-shrink-0">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button 
                        onClick={() => setLocation(`/authors/${author.id}`)}
                        className="truncate text-base font-semibold hover:!text-blue-600 transition-colors text-left cursor-pointer bg-transparent border-none p-0" 
                        title={author.fullName}
                      >
                        {author.fullName}
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{author.bookCount} {author.bookCount === 1 ? 'book' : 'books'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderOpen className="w-4 h-4" />
                        <span>{author.projectCount} {author.projectCount === 1 ? 'project' : 'projects'}</span>
                      </div>
                    </div>
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