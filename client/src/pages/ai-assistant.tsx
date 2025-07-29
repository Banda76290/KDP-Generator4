import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Copy, Download } from "lucide-react";

export default function AIAssistant() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  
  // Temporarily allow AI for all users for testing
  const isPremiumUser = true;

  const { data: generations } = useQuery({
    queryKey: ["/api/ai/generations"],
    enabled: isAuthenticated,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { type: string; prompt: string; title?: string }) => {
      return await apiRequest("POST", "/api/ai/generate", data);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      setGeneratedContent(result.content);
      toast({
        title: "Content Generated",
        description: `Used ${result.tokensUsed} tokens`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    },
  });

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

  const handleGenerate = () => {
    if (!selectedType || !prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a content type and enter a prompt",
        variant: "destructive",
      });
      return;
    }

    // Temporarily allow AI access for all users for testing
    // if (user?.subscriptionTier === 'free') {
    //   toast({
    //     title: "Premium Feature",
    //     description: "AI content generation requires a premium subscription",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    generateMutation.mutate({
      type: selectedType,
      prompt,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

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

  // Temporarily allow AI access for all users for testing
  // const isPremiumUser = true; // user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'pro';

  return (
    <Layout>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Bot className="w-6 h-6 mr-2" />
                  AI Assistant
                  <Badge className="ml-2 bg-secondary text-secondary-foreground">PRO</Badge>
                </h1>
                <p className="text-gray-600 mt-1">Generate content for your books using advanced AI.</p>
              </div>
            </div>
          </div>

          {!isPremiumUser ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upgrade to Premium</h3>
                <p className="text-gray-600 mb-4">
                  AI content generation is available for premium subscribers only.
                </p>
                <Button className="bg-secondary hover:bg-secondary/90">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content Type
                    </label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="structure">Book Structure</SelectItem>
                        <SelectItem value="description">Book Description</SelectItem>
                        <SelectItem value="marketing">Marketing Copy</SelectItem>
                        <SelectItem value="chapters">Chapter Outlines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want the AI to generate..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !selectedType || !prompt.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedContent ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={copyToClipboard} variant="outline" size="sm">
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Generated content will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Generations */}
          {isPremiumUser && Array.isArray(generations) && generations.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(generations as any[]).slice(0, 5).map((generation: any) => (
                    <div key={generation.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{generation.type}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(generation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{generation.prompt}</p>
                      <div className="bg-gray-50 p-3 rounded text-xs">
                        {generation.response.substring(0, 200)}...
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
    </Layout>
  );
}
