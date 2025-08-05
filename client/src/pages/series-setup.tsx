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

export default function SeriesSetupPage() {
  const { seriesId } = useParams<{ seriesId?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 4000;
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isEditing] = useState(!!seriesId);

  const form = useForm<SeriesFormData>({
    defaultValues: {
      language: 'english',
      title: '',
      readingOrder: 'unordered',
      description: ''
    }
  });

  // Fetch existing series data if editing
  const { data: existingSeries, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['/api/series', seriesId],
    queryFn: async () => {
      if (!seriesId) return null;
      const response = await fetch(`/api/series/${seriesId)}`, {
        credentials: 'include'
      };
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
      form.setValue('title', existingSeries.title || '');
      form.setValue('language', existingSeries.language || 'english');
      form.setValue('readingOrder', existingSeries.readingOrder || 'unordered');
      
      if (existingSeries.description) {
        setEditorContent(existingSeries.description);
        // Safely get text content length without XSS risk
        const tempDiv = document.createElement('div');
        tempDiv.textContent = existingSeries.description;
        const escapedContent = tempDiv.innerHTML;
        tempDiv.textContent = '';
        
        // Parse safely to get text length
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
              editor.removeChild(editor.firstChild);)}
            
            // Use the cleanHTML function to safely set content
            const cleanedContent = cleanHTML(existingSeries.description);
            const fragment = document.createDocumentFragment();
            const wrapper = document.createElement('div');
            
            // Parse the cleaned HTML safely
            const cleanParser = new DOMParser();
            const cleanDoc = cleanParser.parseFromString(cleanedContent, 'text/html');
            
            // Copy safe nodes to editor
            for (let child of Array.from(cleanDoc.body.childNodes)) {
              if (child.nodeType === Node.TEXT_NODE) {
                fragment.appendChild(document.createTextNode(child.textContent || ''));
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const elem = child as Element;
                const allowedTags = ['P', 'BR', 'STRONG', 'EM', 'U', 'H4', 'H5', 'H6', 'DIV', 'SPAN'];
                if (allowedTags.includes(elem.tagName)) {
                  const newElem = document.createElement(elem.tagName.toLowerCase());
                  newElem.textContent = elem.textContent;
                  fragment.appendChild(newElem);
                }
              }
            }
            
            editor.appendChild(fragment);
          }
        }, 100);
      }
    }
  }, [existingSeries, isEditing, form]);

  const onSubmit = async (data: SeriesFormData) => {
    if (characterCount > maxCharacters) {
      toast({
        title: "Error",
        description: `Description exceeds ${maxCharacters)} character limit.`,
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

      const url = isEditing ? `/api/series/${seriesId}` : '/api/series';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error')});
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} series`);
      }

      // Invalidate and refetch series data
      await queryClient.invalidateQueries({ queryKey: ['/api/series'] };
      
      const responseData = await response.json();
      
      toast({
        title: `Series ${isEditing ? 'updated' : 'saved'}`,
        description: `Your series has been successfully ${isEditing ? 'updated' : 'created'}.`,
      });

      // Check if we need to return to book edit page
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      if (returnToBookEdit && !isEditing) {
        // Store newly created series data for book association
        sessionStorage.setItem('newlyCreatedSeries', JSON.stringify(responseData));
        
        // Return to book edit page
        if (returnToBookEdit === 'new') {
          setLocation('/books/create');
        } else {
          setLocation(`/books/edit/${returnToBookEdit)}`);
        }
      } else {
        setLocation('/manage-series');
      }
    } catch (error) {
      console.error('Error saving series:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create')} series. Please try again.`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Add CSS for the editor placeholder and formatting
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
              return ['color', 'font-weight', 'font-style', 'text-decoration'].includes(prop);)}
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

  const handleLinkInsert = () => {
    if (linkUrl) {
      const editor = document.getElementById('description-editor') as HTMLDivElement;
      if (editor) {
        editor.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          
          // Create link element
          const link = document.createElement('a');
          link.href = linkUrl;
          link.textContent = selectedText || linkUrl;
          link.style.color = '#3b82f6';
          link.style.textDecoration = 'underline';
          
          // Replace selection with link
          range.deleteContents();
          range.insertNode(link);
          
          // Clear selection and update
          selection.removeAllRanges();
          updateDescriptionFromHTML();
        }
      }
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const insertSpecialCharacter = () => {
    const specialChars = ['©', '®', '™', '§', '¶', '†', '‡', '•', '…', '–', '—'];
    const char = specialChars[Math.floor(Math.random() * specialChars.length)];
    applyFormatting('insertText', char);
  };

  const supportedLanguages = [
    { value: 'english', label: 'English' },
    { value: 'afrikaans', label: 'Afrikaans' },
    { value: 'arabic', label: 'Arabic (Beta)' },
    { value: 'basque', label: 'Basque' },
    { value: 'breton', label: 'Breton' },
    { value: 'bulgarian', label: 'Bulgarian' },
    { value: 'catalan', label: 'Catalan' },
    { value: 'chinese_traditional', label: 'Chinese (Traditional) (Beta)' },
    { value: 'cornish', label: 'Cornish' },
    { value: 'corsican', label: 'Corsican' },
    { value: 'croatian', label: 'Croatian' },
    { value: 'czech', label: 'Czech' },
    { value: 'danish', label: 'Danish' },
    { value: 'dutch', label: 'Dutch' },
    { value: 'eastern_frisian', label: 'Eastern Frisian' },
    { value: 'estonian', label: 'Estonian' },
    { value: 'finnish', label: 'Finnish' },
    { value: 'french', label: 'French' },
    { value: 'frisian', label: 'Frisian' },
    { value: 'galician', label: 'Galician' },
    { value: 'german', label: 'German' },
    { value: 'greek', label: 'Greek' },
    { value: 'gujarati', label: 'Gujarati' },
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
    { value: 'luxembourgish', label: 'Luxembourgish' },
    { value: 'malay', label: 'Malay' },
    { value: 'malayalam', label: 'Malayalam' },
    { value: 'manx', label: 'Manx' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'northern_frisian', label: 'Northern Frisian' },
    { value: 'norwegian', label: 'Norwegian' },
    { value: 'nynorsk_norwegian', label: 'Nynorsk Norwegian' },
    { value: 'polish', label: 'Polish' },
    { value: 'portuguese_brazil', label: 'Portuguese (Brazil)' },
    { value: 'portuguese_portugal', label: 'Portuguese (Portugal)' },
    { value: 'romanian', label: 'Romanian' },
    { value: 'russian', label: 'Russian' },
    { value: 'scots', label: 'Scots' },
    { value: 'scottish_gaelic', label: 'Scottish Gaelic' },
    { value: 'slovak', label: 'Slovak' },
    { value: 'slovenian', label: 'Slovenian' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'swedish', label: 'Swedish' },
    { value: 'tamil', label: 'Tamil' },
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
                  )} else {
                    setLocation(`/books/edit/${returnToBookEdit)}`);
                  }
                } else {
                  setLocation('/manage-series');
                }
              }}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Series Setup' : 'Series Setup'}
          </h1>
        </div>

        <form onSubmit={ form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Language Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Choose the primary language for this series.
                </p>
                <Select 
                  value={ form.watch('language')} 
                  onValueChange={ (value) => form.setValue('language', value)}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.value)} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Series Title Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Series title</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Enter your series title as you'd like it to appear on the series detail page.
                </p>
                <Label htmlFor="title" className="text-sm font-medium">Series title</Label>
                <Input
                  id="title"
                  placeholder="Enter your series name"
                  {...form.register('title', { required: 'Series title is required')}}
                  className="w-full"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message)}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reading Order Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Reading order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Choose how you want to display titles in your series.
                </p>
                <RadioGroup 
                  value={ form.watch('readingOrder')} 
                  onValueChange={ (value: 'ordered' | 'unordered') => form.setValue('readingOrder', value)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="ordered" id="ordered" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="ordered" className="font-medium">Ordered:</Label>
                        <p className="text-sm text-gray-600">
                          Display numbers with the titles to indicate that books should be read in sequence. Example: The Lord of the Rings series.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="unordered" id="unordered" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="unordered" className="font-medium">Un-ordered:</Label>
                        <p className="text-sm text-gray-600">
                          Do not display numbers with the titles, as the books can be read in any order. Titles will be displayed in the order they appear. Example: The Sherlock Holmes series.
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Series Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Series image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your series detail page image will be automatically created using up to the first three book covers in your series.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-20 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-lg font-bold text-gray-600">
                    2
                  </div>
                  <div className="w-16 h-20 bg-white border-2 border-blue-500 rounded flex items-center justify-center text-lg font-bold text-blue-600">
                    1
                  </div>
                  <div className="w-16 h-20 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-lg font-bold text-gray-600">
                    3
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter a description for your series. If left blank, Amazon will display the description from the first book in the series.
                </p>
                
                {/* Formatting Toolbar */}
                <div className="flex items-center space-x-1 p-2 bg-gray-50 border rounded">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={ () => applyFormatting('bold' )}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={ () => applyFormatting('italic' )}
                    title="Italic"
                  >
                    <em>I</em>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={ () => applyFormatting('underline' )}
                    title="Underline"
                  >
                    <u>U</u>
                  </Button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={ () => applyFormatting('insertUnorderedList' )}
                    title="Bullet List"
                  >
                    •
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={ () => applyFormatting('insertOrderedList' )}
                    title="Numbered List"
                  >
                    1.
                  </Button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Select defaultValue="normal" onValueChange={ (value) => handleFormatChange(value)}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="heading4">Heading 4</SelectItem>
                      <SelectItem value="heading5">Heading 5</SelectItem>
                      <SelectItem value="heading6">Heading 6</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 hover:bg-gray-200"
                        title="Insert Link"
                      >
                        🔗
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" aria-describedby="insert-link-description">
                      <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-2" id="insert-link-description">
                        <div className="space-y-2">
                          <Label htmlFor="link-url" className="text-sm font-medium">
                            URL
                          </Label>
                          <Input
                            id="link-url"
                            type="url"
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={ (e) => setLinkUrl(e.target.value )}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleLinkInsert();
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setLinkUrl('');
                              setShowLinkDialog(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            style={{ backgroundColor: '#38b6ff', borderColor: '#38b6ff' }}
                            onClick={handleLinkInsert}
                          >
                            Insert Link
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={insertSpecialCharacter}
                    title="Insert Special Character"
                  >
                    ©
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description-editor" className="text-sm font-medium">(Optional)</Label>
                  <div
                    id="description-editor"
                    contentEditable
                    className="min-h-[200px] p-3 border border-gray-300 rounded-md resize-y overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ 
                      minHeight: '200px',
                      maxHeight: '500px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                    onInput={updateDescriptionFromHTML}
                    onBlur={updateDescriptionFromHTML}
                    data-placeholder="Enter your series description..."
                    suppressContentEditableWarning={true}
                  />
                  <input
                    type="hidden"
                    { ...form.register('description')}
                  />
                  <div className="flex justify-end">
                    <span className={`text-sm ${characterCount > maxCharacters ? 'text-red-600' : 'text-green-600'}`}>
                      <strong>{characterCount}</strong> / {maxCharacters}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
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
                  )} else {
                    setLocation(`/books/edit/${returnToBookEdit)}`);
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
                {isEditing ? 'Save Changes' : 'Create Series'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}