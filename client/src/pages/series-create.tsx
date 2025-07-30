import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface SeriesFormData {
  language: string;
  title: string;
  readingOrder: 'ordered' | 'unordered';
  description: string;
}

export default function SeriesCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 4000;
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const form = useForm<SeriesFormData>({
    defaultValues: {
      language: 'english',
      title: '',
      readingOrder: 'unordered',
      description: ''
    }
  });

  const onSubmit = (data: SeriesFormData) => {
    if (characterCount > maxCharacters) {
      toast({
        title: "Error",
        description: `Description exceeds ${maxCharacters} character limit.`,
        variant: "destructive"
      });
      return;
    }
    
    console.log('Series data:', data);
    toast({
      title: "Series saved",
      description: "Your series has been saved successfully.",
    });
    setLocation('/manage-series');
  };

  const saveDraft = () => {
    if (characterCount > maxCharacters) {
      toast({
        title: "Error",
        description: `Description exceeds ${maxCharacters} character limit.`,
        variant: "destructive"
      });
      return;
    }
    
    const data = form.getValues();
    console.log('Saving draft:', data);
    toast({
      title: "Draft saved",
      description: "Your series has been saved as draft.",
    });
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

  const updateDescriptionFromHTML = () => {
    const editor = document.getElementById('description-editor') as HTMLDivElement;
    if (!editor) return;
    
    const htmlContent = editor.innerHTML;
    const textContent = editor.innerText || editor.textContent || '';
    setCharacterCount(textContent.length);
    form.setValue('description', htmlContent);
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
      applyFormatting('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const insertSpecialCharacter = () => {
    const specialChars = ['©', '®', '™', '§', '¶', '†', '‡', '•', '…', '–', '—'];
    const char = specialChars[Math.floor(Math.random() * specialChars.length)];
    applyFormatting('insertText', char);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Series Setup</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  value={form.watch('language')} 
                  onValueChange={(value) => form.setValue('language', value)}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="portuguese">Portuguese</SelectItem>
                    <SelectItem value="dutch">Dutch</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="afrikaans">Afrikaans</SelectItem>
                    <SelectItem value="arabic">Arabic (Beta)</SelectItem>
                    <SelectItem value="basque">Basque</SelectItem>
                    <SelectItem value="breton">Breton</SelectItem>
                    <SelectItem value="catalan">Catalan</SelectItem>
                    <SelectItem value="chinese_traditional">Chinese (Traditional) (Beta)</SelectItem>
                    <SelectItem value="cornish">Cornish</SelectItem>
                    <SelectItem value="corsican">Corsican</SelectItem>
                    <SelectItem value="danish">Danish</SelectItem>
                    <SelectItem value="eastern_frisian">Eastern Frisian</SelectItem>
                    <SelectItem value="finnish">Finnish</SelectItem>
                    <SelectItem value="frisian">Frisian</SelectItem>
                    <SelectItem value="galician">Galician</SelectItem>
                    <SelectItem value="gujarati">Gujarati</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="icelandic">Icelandic</SelectItem>
                    <SelectItem value="irish">Irish</SelectItem>
                    <SelectItem value="luxembourgish">Luxembourgish</SelectItem>
                    <SelectItem value="malayalam">Malayalam</SelectItem>
                    <SelectItem value="manx">Manx</SelectItem>
                    <SelectItem value="marathi">Marathi</SelectItem>
                    <SelectItem value="northern_frisian">Northern Frisian</SelectItem>
                    <SelectItem value="norwegian">Norwegian</SelectItem>
                    <SelectItem value="nynorsk_norwegian">Nynorsk Norwegian</SelectItem>
                    <SelectItem value="romanian">Romanian</SelectItem>
                    <SelectItem value="scots">Scots</SelectItem>
                    <SelectItem value="scottish_gaelic">Scottish Gaelic</SelectItem>
                    <SelectItem value="swedish">Swedish</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                    <SelectItem value="welsh">Welsh</SelectItem>
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
                  {...form.register('title', { required: 'Series title is required' })}
                  className="w-full"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
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
                  value={form.watch('readingOrder')} 
                  onValueChange={(value: 'ordered' | 'unordered') => form.setValue('readingOrder', value)}
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
                    onClick={() => applyFormatting('bold')}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => applyFormatting('italic')}
                    title="Italic"
                  >
                    <em>I</em>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => applyFormatting('underline')}
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
                    onClick={() => applyFormatting('insertUnorderedList')}
                    title="Bullet List"
                  >
                    •
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => applyFormatting('insertOrderedList')}
                    title="Numbered List"
                  >
                    1.
                  </Button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Select defaultValue="normal" onValueChange={(value) => handleFormatChange(value)}>
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
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="link-url" className="text-sm font-medium">
                            URL
                          </label>
                          <Input
                            id="link-url"
                            type="url"
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleLinkInsert();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
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
                            style={{ backgroundColor: 'var(--kdp-primary-blue)' }}
                            className="text-white hover:opacity-90"
                            onClick={handleLinkInsert}
                            disabled={!linkUrl}
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
                    title="Special Characters"
                  >
                    Ω
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
                    {...form.register('description')}
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
          <div className="flex items-center justify-end space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={saveDraft}
              className="px-8"
            >
              Save as draft
            </Button>
            <Button 
              type="submit"
              style={{ backgroundColor: '#ff9900' }}
              className="hover:opacity-90 text-white px-8"
            >
              Submit updates
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}