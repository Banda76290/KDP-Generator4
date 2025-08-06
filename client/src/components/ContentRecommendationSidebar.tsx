import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Lightbulb, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight,
  Star,
  Target,
  TrendingUp,
  FileText,
  DollarSign,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ContentRecommendation } from "@shared/schema";

interface ContentRecommendationSidebarProps {
  bookId: string;
  isVisible: boolean;
  onToggle: () => void;
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case "keywords":
      return <Tags className="w-4 h-4" />;
    case "categories":
      return <Target className="w-4 h-4" />;
    case "title":
      return <FileText className="w-4 h-4" />;
    case "description":
      return <FileText className="w-4 h-4" />;
    case "marketing":
      return <TrendingUp className="w-4 h-4" />;
    case "pricing":
      return <DollarSign className="w-4 h-4" />;
    default:
      return <Lightbulb className="w-4 h-4" />;
  }
});

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return "text-green-600 border-green-200 bg-green-50";
  if (confidence >= 0.6) return "text-yellow-600 border-yellow-200 bg-yellow-50";
  return "text-red-600 border-red-200 bg-red-50";
});

export default function ContentRecommendationSidebar({ 
  bookId, 
  isVisible, 
  onToggle 
}: ContentRecommendationSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading, error } = useQuery({
    queryKey: ['/api/books', bookId, 'recommendations'],
    enabled: !!bookId && isVisible,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/books/${bookId}/recommendations/generate`),
    onSuccess: (newRecommendations) => {
      queryClient.setQueryData(['/api/books', bookId, 'recommendations'], newRecommendations);
      toast({
        title: "Recommendations Generated",
        description: `Generated ${newRecommendations.length} new recommendations using AI.`,
      });
    });
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive"
      });
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ recommendationId, isUseful, isApplied}: { 
      recommendationId: string; 
      isUseful: boolean; 
      isApplied?: boolean; 
    } => 
      apiRequest('PUT', `/api/recommendations/${recommendationId}/feedback`, { isUseful, isApplied });
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/books', bookId, 'recommendations']});
    });
    onError: (error: any) => {
      toast({
        title: "Feedback Failed",
        description: error.message || "Failed to submit feedback",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (recommendationId: string) => 
      apiRequest('DELETE', `/api/recommendations/${recommendationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/books', bookId, 'recommendations']});
      toast({
        title: "Recommendation Removed",
        description: "Recommendation deleted successfully.",
      });
    });
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete recommendation",
        variant: "destructive"
      });
    }
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);} else {
        newSet.add(id);
      }
      return newSet;
    });
  });

  const handleFeedback = (recommendation: ContentRecommendation, isUseful: boolean) => {
    feedbackMutation.mutate({
      recommendationId: recommendation.id,
      isUseful,
      isApplied: recommendation.isApplied ?? false});
  });

  const handleApply = (recommendation: ContentRecommendation) => {
    feedbackMutation.mutate({
      recommendationId: recommendation.id,
      isUseful: recommendation.isUseful ?? true,
      isApplied: true});
  });

  if (!isVisible) return null;

  return (
    <div className="w-80 border-l bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Get intelligent suggestions to improve your book's success
        </p>
        <Button
          onClick={ () => generateMutation.mutate( }
          disabled={generateMutation.isPending}
          className="w-full"
          size="sm"
        >
          { generateMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Recommendations
            </>}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        { isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>}

        { error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">
                Failed to load recommendations. Try generating new ones.
              </p>
            </CardContent>
          </Card>}

        { (recommendations as ContentRecommendation[]).length === 0 && !isLoading && !error && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Lightbulb className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium mb-1">
                No recommendations yet
              </p>
              <p className="text-xs text-blue-600">
                Generate AI recommendations to get intelligent suggestions for improving your book.
              </p>
            </CardContent>
          </Card>}

        {(recommendations as ContentRecommendation[]).map((recommendation: ContentRecommendation) => (
          <Card key={recommendation.id} className="border-gray-200">
            <Collapsible
              open={ expandedItems.has(recommendation.id}
              onOpenChange={ () => toggleExpanded(recommendation.id}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      { getRecommendationIcon(recommendation.recommendationType}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-900 truncate">
                          {recommendation.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 ml-2">
                          <Badge 
                            variant="outline" 
                            className={ `text-xs ${getConfidenceColor(Number(recommendation.confidence) || 0.7}`}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            { Math.round((Number(recommendation.confidence) || 0.7) * 100}%
                          </Badge>
                          { expandedItems.has(recommendation.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {recommendation.suggestion}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="p-3 pt-0">
                  <Separator className="mb-3" />
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">
                        Suggestion
                      </h4>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {recommendation.suggestion}
                      </p>
                    </div>

                    {recommendation.reasoning && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">
                          Reasoning
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {recommendation.reasoning}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        { recommendation.isApplied && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            <Check className="w-3 h-3 mr-1" />
                            Applied
                          </Badge>}
                        { recommendation.isUseful === true && (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Helpful
                          </Badge>}
                        { recommendation.isUseful === false && (
                          <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Not helpful
                          </Badge>}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        { !recommendation.isApplied && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApply(recommendation )}
                            disabled={feedbackMutation.isPending}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        )}
                        
                        { recommendation.isUseful === undefined && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(recommendation, true )}
                              disabled={feedbackMutation.isPending}
                              className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={ () => handleFeedback(recommendation, false }
                              disabled={feedbackMutation.isPending}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={ () => deleteMutation.mutate(recommendation.id }
                          disabled={deleteMutation.isPending}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}