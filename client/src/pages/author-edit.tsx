import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Save } from "lucide-react";

interface AuthorFormData {
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

export default function AuthorEditPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<AuthorFormData>({
    defaultValues: {
      prefix: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
    }
  });

  // Fetch existing author data
  const { data: existingAuthor, isLoading: isLoadingAuthor } = useQuery({
    queryKey: ['/api/authors', authorId],
    queryFn: async () => {
      const response = await fetch(`/api/authors/${authorId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch author');
      }
      return response.json();
    },
    enabled: !!authorId
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingAuthor) {
      form.setValue('prefix', existingAuthor.prefix || '');
      form.setValue('firstName', existingAuthor.firstName || '');
      form.setValue('middleName', existingAuthor.middleName || '');
      form.setValue('lastName', existingAuthor.lastName || '');
      form.setValue('suffix', existingAuthor.suffix || '');
    }
  }, [existingAuthor, form]);

  const onSubmit = async (data: AuthorFormData) => {
    if (!data.firstName || !data.lastName) {
      toast({ title: "First name and last name are required", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/authors/${authorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to update author');
      }

      // Invalidate and refetch author data
      await queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/authors', authorId] });
      
      toast({
        title: "Author updated",
        description: "Author information has been successfully updated.",
      });

      // Check if we need to return to book edit page
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      if (returnToBookEdit) {
        // Clear the flag and return to book edit page
        sessionStorage.removeItem('returnToBookEdit');
        if (returnToBookEdit === 'new') {
          setLocation('/books/create');
        } else {
          setLocation(`/books/edit/${returnToBookEdit}`);
        }
      } else {
        setLocation('/authors');
      }
    } catch (error) {
      console.error('Error updating author:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update author. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // Check if we need to return to book edit page
    const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
    if (returnToBookEdit) {
      // Clear the flag and return to book edit page
      sessionStorage.removeItem('returnToBookEdit');
      if (returnToBookEdit === 'new') {
        setLocation('/books/create');
      } else {
        setLocation(`/books/edit/${returnToBookEdit}`);
      }
    } else {
      setLocation('/authors');
    }
  };

  if (isLoadingAuthor) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading author information...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!existingAuthor) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-red-600">Author not found</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Author</h1>
            <p className="text-gray-600 dark:text-gray-400">Update author information</p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    placeholder="Dr., Prof., etc."
                    {...form.register("prefix")}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...form.register("firstName", { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Michael"
                    {...form.register("middleName")}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...form.register("lastName", { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    placeholder="Jr., Sr., III"
                    {...form.register("suffix")}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}