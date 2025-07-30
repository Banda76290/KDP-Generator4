import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  const handleDescriptionChange = (value: string) => {
    setCharacterCount(value.length);
    form.setValue('description', value);
  };

  const insertFormatting = (startTag: string, endTag: string) => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.watch('description');
    const selectedText = currentValue.substring(start, end);
    
    const newValue = currentValue.substring(0, start) + startTag + selectedText + endTag + currentValue.substring(end);
    handleDescriptionChange(newValue);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 0);
  };

  const handleFormatChange = (format: string) => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.watch('description');
    const selectedText = currentValue.substring(start, end);
    
    let formattedText = selectedText;
    switch (format) {
      case 'heading1':
        formattedText = `# ${selectedText}`;
        break;
      case 'heading2':
        formattedText = `## ${selectedText}`;
        break;
      case 'heading3':
        formattedText = `### ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
    handleDescriptionChange(newValue);
  };

  const insertSpecialCharacter = () => {
    const specialChars = ['©', '®', '™', '§', '¶', '†', '‡', '•', '…', '–', '—'];
    const char = specialChars[Math.floor(Math.random() * specialChars.length)];
    
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentValue = form.watch('description');
    const newValue = currentValue.substring(0, start) + char + currentValue.substring(start);
    handleDescriptionChange(newValue);
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
                  placeholder="From Zero to Hero"
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
                    onClick={() => insertFormatting('**', '**')}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => insertFormatting('*', '*')}
                    title="Italic"
                  >
                    <em>I</em>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => insertFormatting('<u>', '</u>')}
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
                    onClick={() => insertFormatting('\n• ', '')}
                    title="Bullet List"
                  >
                    •
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => insertFormatting('\n1. ', '')}
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
                      <SelectItem value="heading1">Heading 1</SelectItem>
                      <SelectItem value="heading2">Heading 2</SelectItem>
                      <SelectItem value="heading3">Heading 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-gray-200"
                    onClick={() => insertFormatting('<a href="">', '</a>')}
                    title="Insert Link"
                  >
                    🔗
                  </Button>
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
                  <Label htmlFor="description" className="text-sm font-medium">(Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder=""
                    className="min-h-[200px] resize-y"
                    value={form.watch('description')}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
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