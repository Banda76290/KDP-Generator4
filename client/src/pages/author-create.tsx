import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Save } from "lucide-react";

export default function AuthorCreatePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [newAuthor, setNewAuthor] = useState({
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
  });

  // Create author mutation
  const createAuthorMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/authors", data),
    onSuccess: (author) => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      toast({ title: "Author created successfully" });
      setLocation(`/authors/${author.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create author", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.firstName || !newAuthor.lastName) {
      toast({ title: "First name and last name are required", variant: "destructive" });
      return;
    }
    createAuthorMutation.mutate(newAuthor);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/authors")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Authors
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Author</h1>
            <p className="text-gray-600 dark:text-gray-400">Add a new author to your publishing portfolio</p>
          </div>
        </div>

        {/* Author Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Author Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    placeholder="Dr., Prof., etc."
                    value={newAuthor.prefix}
                    onChange={(e) => setNewAuthor({ ...newAuthor, prefix: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newAuthor.firstName}
                    onChange={(e) => setNewAuthor({ ...newAuthor, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Michael"
                    value={newAuthor.middleName}
                    onChange={(e) => setNewAuthor({ ...newAuthor, middleName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={newAuthor.lastName}
                    onChange={(e) => setNewAuthor({ ...newAuthor, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    placeholder="Jr., Sr., III"
                    value={newAuthor.suffix}
                    onChange={(e) => setNewAuthor({ ...newAuthor, suffix: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/authors")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAuthorMutation.isPending}
                  className="kdp-btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createAuthorMutation.isPending ? "Creating..." : "Create Author"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}