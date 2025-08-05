import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface SeriesFormData {
  language: string;
  title: string;
  readingOrder: 'ordered' | 'unordered';
  description: string;
}

export default function SeriesEditPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 4000;
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [editorContent, setEditorContent] = useState('');

  const form = useForm<SeriesFormData>({
    defaultValues: {
      language: 'english',
      title: '',
      readingOrder: 'unordered',
      description: ''
    }
  });

  // Fetch existing series data
  const { data: existingSeries, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['/api/series', seriesId],
    queryFn: async () => {
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

  // Populate form with existing data
  useEffect(() => {
    if (existingSeries) {
      form.setValue('title', existingSeries.title || '');
      form.setValue('language', existingSeries.language || 'english');
      form.setValue('readingOrder', existingSeries.readingOrder || 'unordered');
      
      if (existingSeries.description) {
        setEditorContent(existingSeries.description);
        // Safely get text content length
        const parser = new DOMParser();
        const doc = parser.parseFromString(existingSeries.description, 'text/html');
        const textContent = doc.body.textContent || doc.body.innerText || '';
        setCharacterCount(textContent.length);
        
        // Set the editor content safely after a short delay
        setTimeout(() => {
          const editor = document.getElementById('description-editor') as HTMLDivElement;
          if (editor) {
            // Clear editor first
            while (editor.firstChild) {
              editor.removeChild(editor.firstChild);
            }
            
            // Use cleanHTML function to safely set content
            const cleanedContent = cleanHTML(existingSeries.description);
            const safeParser = new DOMParser();
            const safeDoc = safeParser.parseFromString(cleanedContent, 'text/html');
            
            // Copy safe nodes to editor
            for (let child of Array.from(safeDoc.body.childNodes)) {
              if (child.nodeType === Node.TEXT_NODE) {
                editor.appendChild(document.createTextNode(child.textContent || ''));
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const elem = child as Element;
                const allowedTags = ['P', 'BR', 'STRONG', 'EM', 'U', 'H4', 'H5', 'H6', 'DIV', 'SPAN'];
                if (allowedTags.includes(elem.tagName)) {
                  const newElem = document.createElement(elem.tagName.toLowerCase());
                  newElem.textContent = elem.textContent;
                  editor.appendChild(newElem);
                }
              }
            }
          }
        }, 100);
      }
    }
  }, [existingSeries, form]);

  const onSubmit = async (data: SeriesFormData) => {
    if (characterCount > maxCharacters) {
      toast({
        title: "Error",
        description: `Description exceeds ${maxCharacters} character limit.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      const formData = {
        title: data.title,
        language: data.language,
        readingOrder: data.readingOrder,
        description: editorContent
      };

      const response = await fetch(`/api/series/${seriesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to update series');
      }

      const responseData = await response.json();

      // Invalidate and refetch series data
      await queryClient.invalidateQueries({ queryKey: ['/api/series'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/series', seriesId] });
      
      toast({
        title: "Series updated",
        description: "Your series has been successfully updated.",
      });

      // Check if we need to return to book edit page
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      if (returnToBookEdit) {
        // Return to book edit page
        if (returnToBookEdit === 'new') {
          setLocation('/books/create');
        } else {
          setLocation(`/books/edit/${returnToBookEdit}`);
        }
      } else {
        setLocation('/manage-series');
      }
    } catch (error) {
      console.error('Error updating series:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update series. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Add CSS for the editor placeholder
    const style = document.createElement('style');
    style.textContent = `
      #description-editor:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
      }
      #description-editor h4 { font-size: 1.25rem; font-weight: bold; margin: 0.5rem 0; }
      #description-editor h5 { font-size: 1.125rem; font-weight: bold; margin: 0.5rem 0; }
      #description-editor h6 { font-size: 1rem; font-weight: bold; margin: 0.5rem 0; }
      #description-editor ul { list-style-type: disc; margin-left: 1.5rem; }
      #description-editor ol { list-style-type: decimal; margin-left: 1.5rem; }
      #description-editor li { margin: 0.25rem 0; }
      #description-editor a { color: #3b82f6; text-decoration: underline; }
      #description-editor p { margin: 0.5rem 0; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateDescriptionFromHTML();
  };

  // Function to clean HTML and remove unnecessary styles
  const cleanHTML = (html: string): string => {
    // Create a temporary div to parse the HTML safely
    const tempDiv = document.createElement('div');
    
    // Create a DOMParser for safe HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Only copy text nodes and safe elements
    const allowedTags = ['P', 'BR', 'STRONG', 'EM', 'U', 'H4', 'H5', 'H6', 'DIV', 'SPAN', 'A'];
    const copyNode = (source: Node, target: Element) => {
      if (source.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(source.textContent || ''));
      } else if (source.nodeType === Node.ELEMENT_NODE) {
        const element = source as Element;
        if (allowedTags.includes(element.tagName)) {
          const newElement = document.createElement(element.tagName.toLowerCase());
          
          // Copy only safe attributes
          if (element.tagName === 'A' && element.getAttribute('href')) {
            const href = element.getAttribute('href');
            if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
              newElement.setAttribute('href', href);
            }
          }
          
          target.appendChild(newElement);
          
          // Recursively copy child nodes
          for (let child of Array.from(source.childNodes)) {
            copyNode(child, newElement);
          }
        } else {
          // For disallowed tags, copy only their text content
          for (let child of Array.from(source.childNodes)) {
            copyNode(child, target);
          }
        }
      }
    };
    
    // Copy body content to tempDiv safely
    for (let child of Array.from(doc.body.childNodes)) {
      copyNode(child, tempDiv);
    }
    
    // Remove all style attributes that contain Tailwind CSS variables
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
      const styleAttr = element.getAttribute('style');
      if (styleAttr) {
        // Remove styles that contain CSS custom properties (--tw-* variables)
        if (styleAttr.includes('--tw-') || styleAttr.includes('--gradient') || styleAttr.includes('--ring') || styleAttr.includes('--shadow')) {
          element.removeAttribute('style');
        } else {
          // Keep only essential inline styles (color, font-weight, etc.)
          const cleanStyles = styleAttr
            .split(';')
            .filter(style => {
              const prop = style.trim().split(':')[0]?.trim();
              return ['color', 'font-weight', 'font-style', 'text-decoration'].includes(prop);
            })
            .join('; ');
          
          if (cleanStyles) {
            element.setAttribute('style', cleanStyles);
          } else {
            element.removeAttribute('style');
          }
        }
      }
      
      // Remove empty elements except for br tags
      if (element.tagName !== 'BR' && !element.textContent?.trim() && element.children.length === 0) {
        element.remove();
      }
    });
    
    return tempDiv.innerHTML;
  };

  const updateDescriptionFromHTML = () => {
    const editor = document.getElementById('description-editor') as HTMLDivElement;
    if (!editor) return;
    
    const rawHtmlContent = editor.innerHTML;
    const cleanedHtmlContent = cleanHTML(rawHtmlContent);
    const textContent = editor.innerText || editor.textContent || '';
    
    setCharacterCount(textContent.length);
    setEditorContent(cleanedHtmlContent);
    form.setValue('description', cleanedHtmlContent);
  };

  const handleFormatChange = (format: string) => {
    switch (format) {
      case 'heading4':
        applyFormatting('formatBlock', 'h4');
        break;
      case 'heading5':
        applyFormatting('formatBlock', 'h5');
        break;
      case 'heading6':
        applyFormatting('formatBlock', 'h6');
        break;
      case 'normal':
        applyFormatting('formatBlock', 'div');
        break;
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      applyFormatting('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  if (isLoadingSeries) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  // Check if we need to return to book edit page
                  const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
                  if (returnToBookEdit) {
                    // IMPORTANT: Ne PAS supprimer returnToBookEdit ici ! 
                    // Il sera supprimé automatiquement APRÈS la restauration dans book-edit.tsx
                    
                    if (returnToBookEdit === 'new') {
                      setLocation('/books/create');
                    } else {
                      setLocation(`/books/edit/${returnToBookEdit}`);
                    }
                  } else {
                    setLocation('/manage-series');
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Series Details</h1>
            </div>
          </div>

          <form onSubmit={ form.handleSubmit(onSubmit } className="space-y-8">
            {/* Language Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Language</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={ form.watch('language' }
                  onValueChange={ (value) => form.setValue('language', value }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="french">Français</SelectItem>
                    <SelectItem value="german">Deutsch</SelectItem>
                    <SelectItem value="italian">Italiano</SelectItem>
                    <SelectItem value="portuguese">Português</SelectItem>
                    <SelectItem value="dutch">Nederlands</SelectItem>
                    <SelectItem value="japanese">日本語</SelectItem>
                    <SelectItem value="chinese_simplified">中文(简体)</SelectItem>
                    <SelectItem value="chinese_traditional">中文(繁體)</SelectItem>
                    <SelectItem value="korean">한국어</SelectItem>
                    <SelectItem value="arabic">العربية</SelectItem>
                    <SelectItem value="hindi">हिन्दी</SelectItem>
                    <SelectItem value="russian">Русский</SelectItem>
                    <SelectItem value="turkish">Türkçe</SelectItem>
                    <SelectItem value="polish">Polski</SelectItem>
                    <SelectItem value="swedish">Svenska</SelectItem>
                    <SelectItem value="norwegian">Norsk</SelectItem>
                    <SelectItem value="danish">Dansk</SelectItem>
                    <SelectItem value="finnish">Suomi</SelectItem>
                    <SelectItem value="czech">Čeština</SelectItem>
                    <SelectItem value="hungarian">Magyar</SelectItem>
                    <SelectItem value="romanian">Română</SelectItem>
                    <SelectItem value="bulgarian">Български</SelectItem>
                    <SelectItem value="croatian">Hrvatski</SelectItem>
                    <SelectItem value="slovak">Slovenčina</SelectItem>
                    <SelectItem value="slovenian">Slovenščina</SelectItem>
                    <SelectItem value="estonian">Eesti</SelectItem>
                    <SelectItem value="latvian">Latviešu</SelectItem>
                    <SelectItem value="lithuanian">Lietuvių</SelectItem>
                    <SelectItem value="ukrainian">Українська</SelectItem>
                    <SelectItem value="greek">Ελληνικά</SelectItem>
                    <SelectItem value="hebrew">עברית</SelectItem>
                    <SelectItem value="thai">ไทย</SelectItem>
                    <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                    <SelectItem value="indonesian">Bahasa Indonesia</SelectItem>
                    <SelectItem value="malay">Bahasa Melayu</SelectItem>
                    <SelectItem value="filipino">Filipino</SelectItem>
                    <SelectItem value="catalan">Català</SelectItem>
                    <SelectItem value="basque">Euskera</SelectItem>
                    <SelectItem value="galician">Galego</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Series Title */}
            <Card>
              <CardHeader>
                <CardTitle>Series Title</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  {...form.register('title', { required: 'Series title is required' })}
                  placeholder="Enter your series title"
                  className="w-full"
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Reading Order */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Order</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={ form.watch('readingOrder' }
                  onValueChange={ (value: 'ordered' | 'unordered') => form.setValue('readingOrder', value }
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="unordered" id="unordered" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="unordered" className="font-medium">
                        Un-ordered series
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Readers can enjoy the books in any order. Each book stands alone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="ordered" id="ordered" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="ordered" className="font-medium">
                        Ordered series
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Books should be read in a specific order for the best experience.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Series Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Series Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center w-24 h-24 bg-gray-100 border rounded mx-auto">
                  <div className="grid grid-cols-3 gap-1 w-16 h-16">
                    <div className="bg-gray-300 rounded text-xs flex items-center justify-center font-bold">2</div>
                    <div style={{ backgroundColor: '#38b6ff' }} className="text-white rounded text-xs flex items-center justify-center font-bold">1</div>
                    <div className="bg-gray-300 rounded text-xs flex items-center justify-center font-bold">3</div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  Your series image will be created automatically using book covers
                </p>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <p className="text-sm text-gray-600">
                  Describe your series to help readers understand what to expect. Maximum { maxCharacters.toLocaleString( } characters.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                  <Select onValueChange={handleFormatChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="heading4">Heading 4</SelectItem>
                      <SelectItem value="heading5">Heading 5</SelectItem>
                      <SelectItem value="heading6">Heading 6</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button type="button" variant="outline" size="sm" onClick={ () => applyFormatting('bold' }>
                    <strong>B</strong>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={ () => applyFormatting('italic' }>
                    <em>I</em>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={ () => applyFormatting('underline' }>
                    <u>U</u>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={ () => applyFormatting('insertUnorderedList' }>
                    • List
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={ () => applyFormatting('insertOrderedList' }>
                    1. List
                  </Button>
                  
                  <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        🔗 Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter URL"
                          value={linkUrl}
                          onChange={ (e) => setLinkUrl(e.target.value }
                        />
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={ () => setShowLinkDialog(false }>
                            Cancel
                          </Button>
                          <Button onClick={insertLink} style={{ backgroundColor: '#38b6ff', borderColor: '#38b6ff' }}>
                            Insert
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Rich Text Editor */}
                <div
                  id="description-editor"
                  contentEditable
                  className="min-h-[200px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-placeholder="Describe your series here..."
                  onInput={updateDescriptionFromHTML}
                  style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    lineHeight: '1.5'
                  }}
                />

                {/* Character Counter */}
                <div className="flex justify-between items-center text-sm">
                  <span className={characterCount > maxCharacters ? 'text-red-500' : 'text-gray-600'}>
                    { characterCount.toLocaleString( } / { maxCharacters.toLocaleString( } characters
                  </span>
                  { characterCount > maxCharacters && (
                    <span className="text-red-500 font-medium">
                      Exceeds limit by {(characterCount - maxCharacters).toLocaleString( } characters
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Check if we need to return to book edit page
                  const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
                  if (returnToBookEdit) {
                    // IMPORTANT: Ne PAS supprimer returnToBookEdit ici ! 
                    // Il sera supprimé automatiquement APRÈS la restauration dans book-edit.tsx
                    
                    if (returnToBookEdit === 'new') {
                      setLocation('/books/create');
                    } else {
                      setLocation(`/books/edit/${returnToBookEdit}`);
                    }
                  } else {
                    setLocation('/manage-series');
                  }
                }}
              >
                Cancel
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={characterCount > maxCharacters}
                  style={{ backgroundColor: '#38b6ff', borderColor: '#38b6ff' }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}