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
  const maxCharacters = 1948;

  const form = useForm<SeriesFormData>({
    defaultValues: {
      language: 'english',
      title: '',
      readingOrder: 'unordered',
      description: ''
    }
  });

  const onSubmit = (data: SeriesFormData) => {
    console.log('Series data:', data);
    toast({
      title: "Series saved",
      description: "Your series has been saved successfully.",
    });
    setLocation('/manage-series');
  };

  const saveDraft = () => {
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
                <div className="flex items-center space-x-2 p-2 bg-gray-50 border rounded">
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    <strong>B</strong>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    <em>I</em>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    <u>U</u>
                  </Button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    ≡
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    ≡≡
                  </Button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Select defaultValue="format">
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="format">Format</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="heading">Heading</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    🔗
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
                    Ω
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">(Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter the exciting world of online commerce with the 'From Zero to Hero' book series. Whether you're a novice looking to launch your first online business or an experienced entrepreneur seeking to hone your skills, this comprehensive training series will guide you step by step to succeed in the field of e-commerce..."
                    className="min-h-[200px] resize-none"
                    value={form.watch('description')}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    maxLength={maxCharacters}
                  />
                  <div className="flex justify-end">
                    <span className="text-sm text-gray-500">
                      <strong>{characterCount}</strong> remaining characters
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