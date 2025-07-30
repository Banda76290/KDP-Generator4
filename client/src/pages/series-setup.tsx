import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload } from "lucide-react";

interface SeriesFormData {
  title: string;
  language: string;
  readingOrder: 'ordered' | 'unordered';
  description: string;
}

export default function SeriesSetupPage() {
  const { seriesId } = useParams<{ seriesId?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [characterCount, setCharacterCount] = useState(0);
  const [isEditing] = useState(!!seriesId);

  // Form state
  const [formData, setFormData] = useState<SeriesFormData>({
    title: '',
    language: '',
    readingOrder: 'ordered',
    description: ''
  });

  // Fetch existing series data if editing
  const { data: existingSeries, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['/api/series', seriesId],
    queryFn: async () => {
      if (!seriesId) return null;
      const response = await fetch(`/api/series/${seriesId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      return response.json();
    },
    enabled: !!seriesId
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingSeries && isEditing) {
      setFormData({
        title: existingSeries.title || '',
        language: existingSeries.language || '',
        readingOrder: existingSeries.readingOrder || 'ordered',
        description: existingSeries.description || ''
      });
      setCharacterCount(existingSeries.description?.length || 0);
    }
  }, [existingSeries, isEditing]);

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
    setCharacterCount(content.length);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing ? `/api/series/${seriesId}` : '/api/series';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          language: formData.language,
          readingOrder: formData.readingOrder,
          description: formData.description
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} series`);
      }

      // Invalidate and refetch series data
      await queryClient.invalidateQueries({ queryKey: ['/api/series'] });
      
      toast({
        title: `Series ${isEditing ? 'updated' : 'saved'}`,
        description: `Your series has been successfully ${isEditing ? 'updated' : 'created'}.`,
      });
      setLocation('/manage-series');
    } catch (error) {
      console.error('Error saving series:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} series. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const supportedLanguages = [
    { value: 'english', label: 'English' },
    { value: 'afrikaans', label: 'Afrikaans' },
    { value: 'arabic', label: 'Arabic (Beta)' },
    { value: 'basque', label: 'Basque' },
    { value: 'bulgarian', label: 'Bulgarian' },
    { value: 'catalan', label: 'Catalan' },
    { value: 'chinese-simplified', label: 'Chinese (Simplified)' },
    { value: 'chinese-traditional', label: 'Chinese (Traditional)' },
    { value: 'croatian', label: 'Croatian' },
    { value: 'czech', label: 'Czech' },
    { value: 'danish', label: 'Danish' },
    { value: 'dutch', label: 'Dutch' },
    { value: 'estonian', label: 'Estonian' },
    { value: 'finnish', label: 'Finnish' },
    { value: 'french', label: 'French' },
    { value: 'galician', label: 'Galician' },
    { value: 'german', label: 'German' },
    { value: 'greek', label: 'Greek' },
    { value: 'hebrew', label: 'Hebrew' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'hungarian', label: 'Hungarian' },
    { value: 'icelandic', label: 'Icelandic' },
    { value: 'irish', label: 'Irish' },
    { value: 'italian', label: 'Italian' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'korean', label: 'Korean' },
    { value: 'latvian', label: 'Latvian' },
    { value: 'lithuanian', label: 'Lithuanian' },
    { value: 'malay', label: 'Malay' },
    { value: 'norwegian', label: 'Norwegian' },
    { value: 'polish', label: 'Polish' },
    { value: 'portuguese-brazil', label: 'Portuguese (Brazil)' },
    { value: 'portuguese-portugal', label: 'Portuguese (Portugal)' },
    { value: 'romanian', label: 'Romanian' },
    { value: 'russian', label: 'Russian' },
    { value: 'slovak', label: 'Slovak' },
    { value: 'slovenian', label: 'Slovenian' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'swedish', label: 'Swedish' },
    { value: 'thai', label: 'Thai' },
    { value: 'turkish', label: 'Turkish' },
    { value: 'ukrainian', label: 'Ukrainian' },
    { value: 'welsh', label: 'Welsh' }
  ];

  if (isEditing && isLoadingSeries) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading series data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/manage-series')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Manage Series</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Series Setup' : 'Series Setup'}
          </h1>
        </div>

        {/* Main Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Series Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">
                  Primary language of your series *
                </Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Series Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Series title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your series title"
                  required
                />
              </div>

              {/* Reading Order */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Reading order</Label>
                <RadioGroup
                  value={formData.readingOrder}
                  onValueChange={(value: 'ordered' | 'unordered') => 
                    setFormData(prev => ({ ...prev, readingOrder: value }))
                  }
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="ordered" id="ordered" className="mt-1" />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="ordered" className="font-medium cursor-pointer">
                        Ordered
                      </Label>
                      <p className="text-sm text-gray-600">
                        Books in this series should be read in a specific order to be understood. 
                        Your books will be numbered on their detail pages.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="unordered" id="unordered" className="mt-1" />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="unordered" className="font-medium cursor-pointer">
                        Un-ordered
                      </Label>
                      <p className="text-sm text-gray-600">
                        Books in this series can be read in any order and will be understood. 
                        Your books will not be numbered on their detail pages.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Series Images Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Series image</Label>
                <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-center space-y-2">
                    <div className="flex space-x-1 justify-center">
                      <div className="w-12 h-16 bg-gray-300 rounded border flex items-center justify-center text-xs">1</div>
                      <div className="w-12 h-16 bg-gray-300 rounded border flex items-center justify-center text-xs">2</div>
                      <div className="w-12 h-16 bg-gray-300 rounded border flex items-center justify-center text-xs">3</div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Series image will be automatically created from your book covers
                    </p>
                  </div>
                </div>
              </div>

              {/* Series Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Series description
                  </Label>
                  <span className="text-xs text-gray-500">
                    {characterCount}/1948 characters
                  </span>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  {/* Simple Toolbar */}
                  <div className="border-b bg-gray-50 p-2 flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded text-sm font-bold"
                      onClick={() => {
                        const selection = window.getSelection();
                        if (selection && !selection.isCollapsed) {
                          document.execCommand('bold');
                        }
                      }}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded text-sm italic"
                      onClick={() => {
                        const selection = window.getSelection();
                        if (selection && !selection.isCollapsed) {
                          document.execCommand('italic');
                        }
                      }}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded text-sm"
                      onClick={() => document.execCommand('insertUnorderedList')}
                    >
                      • List
                    </button>
                  </div>
                  
                  {/* Content Editable Area */}
                  <div
                    contentEditable
                    className="p-4 min-h-[200px] focus:outline-none"
                    onInput={(e) => {
                      const content = e.currentTarget.innerHTML;
                      handleDescriptionChange(content);
                    }}
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                    style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      lineHeight: '1.6'
                    }}
                  />
                </div>
                
                <p className="text-xs text-gray-500">
                  Describe your series to help readers understand what to expect. You can use the toolbar to format your text.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/manage-series')}
            >
              Cancel
            </Button>
            
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="kdp-btn-primary"
                style={{ 
                  backgroundColor: '#38b6ff',
                  borderColor: '#38b6ff'
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Create Series'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}