import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, CheckCircle, ArrowLeft, BookOpen, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBookSchema, type Book } from "@shared/schema";
import { z } from "zod";
import Layout from "@/components/Layout";

interface Contributor {
  id: string;
  role: string;
  prefix?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

const bookFormSchema = insertBookSchema.extend({
  projectId: z.string().min(1, "Project selection is required"),
});
type BookFormData = z.infer<typeof bookFormSchema>;

const languages = [
  "English", 
  "German", 
  "French", 
  "Spanish", 
  "Italian", 
  "Portuguese", 
  "Dutch", 
  "Japanese", 
  "Afrikaans", 
  "Arabic (Beta)", 
  "Basque", 
  "Breton", 
  "Catalan", 
  "Chinese (Traditional) (Beta)", 
  "Cornish", 
  "Corsican", 
  "Danish", 
  "Eastern Frisian", 
  "Finnish", 
  "Frisian", 
  "Galician", 
  "Gujarati", 
  "Hindi", 
  "Icelandic", 
  "Irish", 
  "Luxembourgish", 
  "Malayalam", 
  "Manx", 
  "Marathi", 
  "Northern Frisian", 
  "Norwegian", 
  "Nynorsk Norwegian", 
  "Romanian", 
  "Scots", 
  "Scottish Gaelic", 
  "Swedish", 
  "Tamil", 
  "Welsh"
];

const marketplaces = [
  "Amazon.com", "Amazon.co.uk", "Amazon.de", "Amazon.fr", "Amazon.es", "Amazon.it", 
  "Amazon.co.jp", "Amazon.ca", "Amazon.com.au", "Amazon.in", "Amazon.com.br", "Amazon.com.mx"
];

const readingAges = [
  "Baby-2 years", "3-5 years", "6-8 years", "9-12 years", "13-17 years", "18+ years"
];

const contributorRoles = [
  "Author", "Editor", "Foreword", "Illustrator", "Introduction", "Narrator", "Photographer", "Preface", "Translator", "Contributions by"
];

export default function EditBook() {
  const { bookId } = useParams();
  const [location, setLocation] = useLocation();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPartOfSeries, setIsPartOfSeries] = useState(false);
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  // Store original series data to restore when checkbox is checked again
  const [originalSeriesData, setOriginalSeriesData] = useState<{
    seriesTitle: string;
    seriesNumber: number | null;
  } | null>(null);
  
  // WYSIWYG Editor states for Description
  const [descriptionCharacterCount, setDescriptionCharacterCount] = useState(0);
  const maxDescriptionCharacters = 4000;
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [descriptionEditorContent, setDescriptionEditorContent] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if this is creation mode
  const isCreating = !bookId;
  
  // WYSIWYG Editor functions for Description
  const applyDescriptionFormatting = (command: string, value?: string) => {
    try {
      const editor = document.getElementById('description-editor') as HTMLDivElement;
      if (!editor) {
        console.error('Description editor not found');
        return;
      }

      // Focus the editor before applying command
      editor.focus();
      
      // Check if execCommand is supported
      if (typeof document.execCommand !== 'function') {
        console.error('execCommand is not supported in this browser');
        toast({ title: "Erreur", description: "Cette fonctionnalité n'est pas supportée dans votre navigateur", variant: "destructive" });
        return;
      }

      // Apply the formatting command
      const success = document.execCommand(command, false, value);
      if (!success) {
        console.warn(`execCommand failed for command: ${command}`);
      }
      
      updateDescriptionFromHTML();
    } catch (error) {
      console.error('Error applying description formatting:', error);
      toast({ title: "Erreur", description: "Erreur lors de l'application du formatage", variant: "destructive" });
    }
  };

  // Function to clean HTML and remove unnecessary styles
  const cleanHTML = (html: string): string => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
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
    
    setDescriptionCharacterCount(textContent.length);
    setDescriptionEditorContent(cleanedHtmlContent);
    form.setValue('description', cleanedHtmlContent);
  };

  const handleDescriptionFormatChange = (format: string) => {
    try {
      console.log('Applying description format:', format);
      switch (format) {
        case 'heading4':
          applyDescriptionFormatting('formatBlock', 'h4');
          break;
        case 'heading5':
          applyDescriptionFormatting('formatBlock', 'h5');
          break;
        case 'heading6':
          applyDescriptionFormatting('formatBlock', 'h6');
          break;
        case 'normal':
          applyDescriptionFormatting('formatBlock', 'div');
          break;
        default:
          console.warn('Unknown format type:', format);
      }
    } catch (error) {
      console.error('Error in handleDescriptionFormatChange:', error);
      toast({ title: "Erreur", description: "Erreur lors du changement de format", variant: "destructive" });
    }
  };

  const insertDescriptionLink = () => {
    if (linkUrl) {
      applyDescriptionFormatting('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };
  
  // Get projectId from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedProjectId = urlParams.get('projectId');
  
  console.log('BookEdit Debug:', { 
    bookId, 
    isCreating, 
    location, 
    preSelectedProjectId,
    fullUrl: window.location.href,
    search: window.location.search
  });

  // Fetch existing book data (only if editing)
  const { data: book, isLoading: bookLoading, error } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !isCreating, // Only fetch if we're not creating (i.e., if we have a bookId)
    refetchOnMount: true, // Force refresh on mount
    refetchOnWindowFocus: true, // Force refresh when window gets focus
    staleTime: 0, // Always consider data stale for immediate updates
  });
  
  console.log('Query State:', { book, bookLoading, error, isCreating });

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      language: "English",
      authorPrefix: "",
      authorFirstName: "",
      authorMiddleName: "",
      authorLastName: "",
      authorSuffix: "",
      publishingRights: "owned",
      hasExplicitContent: false,
      primaryMarketplace: "Amazon.com",
      isLowContentBook: false,
      isLargePrintBook: false,
      previouslyPublished: false,
      releaseOption: "immediate",
      useAI: false,
      format: "ebook",
      status: "draft",
      projectId: preSelectedProjectId || "",
      categories: [],
      keywords: [],
    },
  });

  // Add CSS for the description editor
  useEffect(() => {
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

  // Save current form state to session storage (for navigation to series creation only)
  const saveFormDataToSession = () => {
    const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
    console.log('saveFormDataToSession called:', { returnToBookEdit, bookId: bookId || 'new', shouldSave: returnToBookEdit === (bookId || 'new') });
    
    const watchedFormData = form.watch();
    const currentFormData = {
      ...watchedFormData,
      description: descriptionEditorContent, // Save the rich HTML content
      keywords,
      categories,
      contributors,
      isPartOfSeries
    };
    
    const storageKey = `bookFormData_${bookId || 'new'}`;
    console.log('Saving form data to sessionStorage:', { storageKey, data: currentFormData });
    sessionStorage.setItem(storageKey, JSON.stringify(currentFormData));
  };

  // Real-time auto-save: Save form data automatically when any field changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const autoSave = () => {
      // Only auto-save if we are about to navigate to series creation
      const returnToBookEdit = sessionStorage.getItem('returnToBookEdit');
      console.log('Auto-save check:', { returnToBookEdit, currentBookId: bookId || 'new', shouldSave: returnToBookEdit === (bookId || 'new') });
      if (returnToBookEdit === (bookId || 'new')) {
        saveFormDataToSession();
        console.log('Auto-saved form data to sessionStorage');
      }
    };

    // Debounced auto-save every 500ms when form data changes
    const subscription = form.watch(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(autoSave, 500);
    });

    // Also save when state arrays change
    timeoutId = setTimeout(autoSave, 500);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form, keywords, categories, contributors, isPartOfSeries, bookId]);

  // Clean up auto-saved data when leaving the page normally (not via series creation)
  useEffect(() => {
    const storageKey = `bookFormData_${bookId || 'new'}`;
    
    const handleBeforeUnload = () => {
      // Only clear if we're not going to series creation
      if (!sessionStorage.getItem('returnToBookEdit')) {
        sessionStorage.removeItem(storageKey);
      }
    };
    
    const handlePopState = () => {
      // Clear when navigating back/forward unless going to series creation
      if (!sessionStorage.getItem('returnToBookEdit')) {
        sessionStorage.removeItem(storageKey);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [bookId]);

  // Update form with fetched book data or restored data
  useEffect(() => {
    // Check for saved form data from series creation first
    const storageKey = `bookFormData_${bookId || 'new'}`;
    const savedFormData = sessionStorage.getItem(storageKey);
    const returnFromSeries = sessionStorage.getItem('returnToBookEdit');
    const newlyCreatedSeries = sessionStorage.getItem('newlyCreatedSeries');
    
    console.log('Restoration check:', { returnFromSeries, bookId: bookId || 'new', hasStorageData: !!savedFormData, shouldRestore: savedFormData && returnFromSeries === (bookId || 'new') });
    
    if (savedFormData && returnFromSeries === (bookId || 'new')) {
      console.log('Restoring form data from sessionStorage');
      try {
        const formData = JSON.parse(savedFormData);
        
        // If we have a newly created series, associate it
        if (newlyCreatedSeries) {
          const seriesData = JSON.parse(newlyCreatedSeries);
          console.log('Associating newly created series:', seriesData);
          formData.seriesTitle = seriesData.title;
          formData.seriesNumber = 1;
        }
        
        console.log('Form data being restored:', formData);
        
        // Restore all form fields automatically (future-proof)
        const { keywords: savedKeywords, categories: savedCategories, contributors: savedContributors, isPartOfSeries: savedIsPartOfSeries, ...formFields } = formData;
        
        // Store series data as original if it exists
        if (formFields.seriesTitle) {
          setOriginalSeriesData({
            seriesTitle: formFields.seriesTitle,
            seriesNumber: formFields.seriesNumber || null
          });
        }
        
        // Immediate form reset - same as buttons "Create series" and "Edit series details"
        form.reset(formFields);
        
        // Restore separate state arrays immediately
        if (savedKeywords && Array.isArray(savedKeywords)) {
          setKeywords(savedKeywords);
        }
        if (savedCategories && Array.isArray(savedCategories)) {
          setCategories(savedCategories);
        }
        if (savedContributors && Array.isArray(savedContributors)) {
          setContributors(savedContributors);
        }
        if (typeof savedIsPartOfSeries === 'boolean') {
          setIsPartOfSeries(savedIsPartOfSeries);
        }
        
        // Restore description in WYSIWYG editor
        if (formFields.description) {
          setDescriptionEditorContent(formFields.description);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = formFields.description;
          const textContent = tempDiv.innerText || tempDiv.textContent || '';
          setDescriptionCharacterCount(textContent.length);
          
          // Set the editor content after a short delay to ensure the editor is rendered
          setTimeout(() => {
            const editor = document.getElementById('description-editor') as HTMLDivElement;
            if (editor) {
              editor.innerHTML = formFields.description || '';
            }
          }, 200);
        }
        
        console.log('UI restoration complete');
        
        // Clear saved data
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem('returnToBookEdit');
        sessionStorage.removeItem('newlyCreatedSeries');
        
        console.log('Form restoration complete');
        setHasRestoredFromStorage(true);
        return; // Exit early to prevent book data from overriding restored data
      } catch (error) {
        console.error('Error restoring form data:', error);
        sessionStorage.removeItem(storageKey);
      }
    }
    
    // Only load book data if we didn't restore from sessionStorage
    console.log('Book loading check:', { book: !!book, hasRestoredFromStorage, shouldLoadBook: book && !hasRestoredFromStorage });
    if (book && !hasRestoredFromStorage) {
      // Load description into WYSIWYG editor
      if (book.description) {
        setDescriptionEditorContent(book.description);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = book.description;
        const textContent = tempDiv.innerText || tempDiv.textContent || '';
        setDescriptionCharacterCount(textContent.length);
        
        // Set the editor content after a short delay to ensure the editor is rendered
        setTimeout(() => {
          const editor = document.getElementById('description-editor') as HTMLDivElement;
          if (editor) {
            editor.innerHTML = book.description || '';
          }
        }, 100);
      }
      form.reset({
        title: book.title || "",
        subtitle: book.subtitle || "",
        description: book.description || "",
        language: book.language || "English",
        authorPrefix: book.authorPrefix || "",
        authorFirstName: book.authorFirstName || "",
        authorMiddleName: book.authorMiddleName || "",
        authorLastName: book.authorLastName || "",
        authorSuffix: book.authorSuffix || "",
        publishingRights: book.publishingRights || "owned",
        hasExplicitContent: book.hasExplicitContent || false,
        primaryMarketplace: book.primaryMarketplace || "Amazon.com",
        isLowContentBook: book.isLowContentBook || false,
        isLargePrintBook: book.isLargePrintBook || false,
        previouslyPublished: book.previouslyPublished || false,
        releaseOption: book.releaseOption || "immediate",
        useAI: book.useAI || false,
        format: book.format || "ebook",
        status: book.status || "draft",
        projectId: book.projectId || "",
        categories: book.categories || [],
        keywords: book.keywords || [],
        seriesTitle: book.seriesTitle || "",
        seriesNumber: book.seriesNumber || null,
        editionNumber: book.editionNumber || null,
      });

      // Set series checkbox state and store original series data
      setIsPartOfSeries(!!book.seriesTitle);
      if (book.seriesTitle) {
        setOriginalSeriesData({
          seriesTitle: book.seriesTitle,
          seriesNumber: book.seriesNumber || null
        });
      }

      // Set separate state arrays
      if (book.keywords) {
        if (typeof book.keywords === 'string') {
          setKeywords((book.keywords as string).split(',').map((k: string) => k.trim()).filter((k: string) => k));
        } else if (Array.isArray(book.keywords)) {
          setKeywords(book.keywords as string[]);
        } else {
          setKeywords([]);
        }
      } else {
        setKeywords([]);
      }
      
      setCategories(Array.isArray(book.categories) ? book.categories : []);
      
      // Load contributors from database
      if ((book as any).contributors && Array.isArray((book as any).contributors)) {
        const loadedContributors = (book as any).contributors.map((contrib: any) => ({
          id: contrib.id,
          role: contrib.role,
          prefix: contrib.prefix || "",
          firstName: contrib.firstName,
          middleName: contrib.middleName || "",
          lastName: contrib.lastName,
          suffix: contrib.suffix || "",
        }));
        setContributors(loadedContributors);
      } else {
        setContributors([]);
      }
    }
  }, [book, bookId, hasRestoredFromStorage]); // Removed form from dependencies to prevent loops

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch series for selection
  const { data: userSeries = [] } = useQuery<any[]>({
    queryKey: ["/api/series"],
  });

  const saveBook = useMutation({
    mutationFn: async (data: { bookData: BookFormData; shouldNavigate?: boolean; nextTab?: string }) => {
      const formattedData = {
        ...data.bookData,
        categories,
        keywords,
        // Convert numeric fields to proper types as expected by schema
        editionNumber: data.bookData.editionNumber ? String(data.bookData.editionNumber) : null,
        seriesNumber: data.bookData.seriesNumber ? Number(data.bookData.seriesNumber) : null,
      };
      
      console.log(isCreating ? 'Creating book data:' : 'Updating book data:', formattedData);
      console.log('ProjectId being sent:', formattedData.projectId);
      
      if (isCreating) {
        const createdBook = await apiRequest("POST", `/api/books`, formattedData);
        console.log('Received created book response:', createdBook);
        
        // Save contributors after book creation
        if (contributors.length > 0) {
          for (const contributor of contributors) {
            await apiRequest("POST", "/api/contributors", {
              bookId: createdBook.id,
              projectId: formattedData.projectId, // Add projectId for database compatibility
              name: `${contributor.firstName} ${contributor.lastName}`.trim(), // Add name field for database compatibility
              role: contributor.role,
              prefix: contributor.prefix || null,
              firstName: contributor.firstName,
              middleName: contributor.middleName || null,
              lastName: contributor.lastName,
              suffix: contributor.suffix || null,
            });
          }
        }
        
        return { book: createdBook, shouldNavigate: data.shouldNavigate, nextTab: data.nextTab };
      } else {
        const updatedBook = await apiRequest("PATCH", `/api/books/${bookId}`, formattedData);
        console.log('Received updated book response:', updatedBook);
        
        // Update contributors - first delete existing ones, then add new ones
        if (bookId) {
          // Get existing contributors to delete them
          try {
            const existingContributors = await apiRequest("GET", `/api/contributors/book/${bookId}`);
            if (existingContributors && existingContributors.length > 0) {
              for (const contrib of existingContributors) {
                await apiRequest("DELETE", `/api/contributors/${contrib.id}/${bookId}`);
              }
            }
          } catch (error) {
            console.log('No existing contributors or error deleting:', error);
          }
          
          // Add new contributors
          if (contributors.length > 0) {
            console.log('Adding contributors:', contributors);
            console.log('Project ID for contributors:', formattedData.projectId);
            for (const contributor of contributors) {
              const contributorData = {
                bookId: bookId,
                projectId: formattedData.projectId, // Add projectId for database compatibility
                name: `${contributor.firstName} ${contributor.lastName}`.trim(), // Add name field for database compatibility
                role: contributor.role,
                prefix: contributor.prefix || null,
                firstName: contributor.firstName,
                middleName: contributor.middleName || null,
                lastName: contributor.lastName,
                suffix: contributor.suffix || null,
              };
              console.log('Sending contributor data:', contributorData);
              await apiRequest("POST", "/api/contributors", contributorData);
            }
          }
        }
        
        return { book: updatedBook, shouldNavigate: data.shouldNavigate, nextTab: data.nextTab };
      }
    },
    onSuccess: (result) => {
      // Update the current book query cache with the latest data
      if (result.book && !isCreating) {
        queryClient.setQueryData([`/api/books/${bookId}`], result.book);
      }
      
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (!isCreating) {
        queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      }
      
      toast.success({
        title: isCreating ? "Book Created" : "Book Updated",
        description: `Your book has been ${isCreating ? 'created' : 'updated'} successfully.`,
      });
      
      if (isCreating && result.book) {
        // After creation, redirect to edit mode with the new book ID
        if (result.nextTab) {
          setLocation(`/books/edit/${result.book.id}?tab=${result.nextTab}`);
        } else if (result.shouldNavigate) {
          setLocation("/projects");
        } else {
          setLocation(`/books/edit/${result.book.id}`);
        }
      } else {
        if (result.nextTab) {
          setActiveTab(result.nextTab);
        } else if (result.shouldNavigate) {
          setLocation("/projects");
        }
      }
    },
    onError: (error) => {
      console.error(isCreating ? 'Book creation error:' : 'Book update error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isCreating ? 'create' : 'update'} book`,
        variant: "destructive",
      });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/books/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Book Deleted",
        description: "Your book has been deleted successfully.",
      });
      setLocation("/projects");
    },
    onError: (error) => {
      console.error('Book deletion error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
        variant: "destructive",
      });
    },
  });

  const addContributor = () => {
    const newContributor: Contributor = {
      id: Date.now().toString(),
      role: "Author",
      prefix: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
    };
    setContributors([...contributors, newContributor]);
  };

  const updateContributor = (id: string, field: keyof Contributor, value: string) => {
    setContributors(contributors.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !keywords.includes(keyword.trim()) && keywords.length < 7) {
      setKeywords([...keywords, keyword.trim()]);
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addCategory = (category: string) => {
    if (category.trim() && !categories.includes(category.trim()) && categories.length < 10) {
      setCategories([...categories, category.trim()]);
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const onSubmit = (data: BookFormData) => {
    saveBook.mutate({ bookData: data, shouldNavigate: true });
  };

  const handleSaveAsDraft = (data: BookFormData) => {
    const draftData = {
      ...data,
      status: "draft" as const,
    };
    
    saveBook.mutate({ bookData: draftData });
  };

  const handleSaveAndContinue = (data: BookFormData) => {
    let nextTab = "";
    if (activeTab === "details") {
      nextTab = "content";
    } else if (activeTab === "content") {
      nextTab = "pricing";
    }
    
    saveBook.mutate({ bookData: data, nextTab });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  if (bookLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading book details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isCreating && (error || !book)) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
          <p className="text-gray-600 mb-4">The book you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => setLocation("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/projects")}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{isCreating ? 'Create Book' : 'Edit Book'}</h1>
                  <p className="text-gray-600">{isCreating ? 'Set up your new book with all the details' : 'Update your book details and settings'}</p>
                </div>
              </div>
              {!isCreating && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteBook.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Book
                </Button>
              )}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => {
                      // Sauvegarder le contenu de l'éditeur avant de changer d'onglet
                      if (activeTab === "details") {
                        const editor = document.getElementById('description-editor') as HTMLDivElement;
                        if (editor) {
                          const rawHtmlContent = editor.innerHTML;
                          const cleanedHtmlContent = cleanHTML(rawHtmlContent);
                          form.setValue('description', cleanedHtmlContent);
                          setDescriptionEditorContent(cleanedHtmlContent);
                        }
                      }
                      setActiveTab("details");
                      // Restaurer le contenu de l'éditeur si on revient sur l'onglet details
                      if ("details" !== activeTab) {
                        setTimeout(() => {
                          const editor = document.getElementById('description-editor') as HTMLDivElement;
                          if (editor && descriptionEditorContent) {
                            editor.innerHTML = descriptionEditorContent;
                          }
                        }, 50);
                      }
                    }}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >Book Details</button>
                  <button
                    type="button"
                    onClick={() => {
                      // Sauvegarder le contenu de l'éditeur avant de changer d'onglet
                      if (activeTab === "details") {
                        const editor = document.getElementById('description-editor') as HTMLDivElement;
                        if (editor) {
                          const rawHtmlContent = editor.innerHTML;
                          const cleanedHtmlContent = cleanHTML(rawHtmlContent);
                          form.setValue('description', cleanedHtmlContent);
                          setDescriptionEditorContent(cleanedHtmlContent);
                        }
                      }
                      setActiveTab("content");
                    }}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "content"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >Book Content</button>
                  <button
                    type="button"
                    onClick={() => {
                      // Sauvegarder le contenu de l'éditeur avant de changer d'onglet
                      if (activeTab === "details") {
                        const editor = document.getElementById('description-editor') as HTMLDivElement;
                        if (editor) {
                          const rawHtmlContent = editor.innerHTML;
                          const cleanedHtmlContent = cleanHTML(rawHtmlContent);
                          form.setValue('description', cleanedHtmlContent);
                          setDescriptionEditorContent(cleanedHtmlContent);
                        }
                      }
                      setActiveTab("pricing");
                    }}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "pricing"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >Book Rights & Pricing</button>
                </nav>
              </div>

              {/* Paperback Details Tab */}
              {activeTab === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic information about your book</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="projectId" className="font-medium text-[16px]">Project *</Label>
                    <p className="text-sm text-gray-600">
                      Select the project this book belongs to.
                    </p>
                    <Select 
                      value={form.watch("projectId") || ""} 
                      onValueChange={(value) => form.setValue("projectId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {(projects as any[]).map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.projectId && (
                      <p className="text-sm text-red-600">{form.formState.errors.projectId.message}</p>
                    )}
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language" className="font-medium text-[16px]">Language *</Label>
                    <p className="text-sm text-gray-600">
                      What language is your book written in?
                    </p>
                    <Select 
                      value={form.watch("language") || ""} 
                      onValueChange={(value) => form.setValue("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Book Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-medium text-[16px]">Book Title *</Label>
                    <p className="text-sm text-gray-600">
                      Enter your title as it should appear on the book cover and in the catalog. Some
                      customers use long titles to help with keyword searches.
                    </p>
                    <Input
                      id="title"
                      placeholder="Enter your book title"
                      {...form.register("title", { required: "Title is required" })}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="font-medium text-[16px]">Subtitle</Label>
                    <p className="text-sm text-gray-600">Optional subtitle for your book</p>
                    <Input
                      id="subtitle"
                      placeholder="Enter subtitle (optional)"
                      {...form.register("subtitle")}
                    />
                  </div>

                  {/* Series (optional) */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Series (optional)</Label>
                    <p className="text-sm text-gray-600">
                      This title is part of a series. You can edit details or remove the title from the series. (Optional)
                    </p>
                    
                    {/* Checkbox to enable series */}
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="isPartOfSeries"
                        checked={!!form.watch("seriesTitle") || isPartOfSeries}
                        onCheckedChange={(checked) => {
                          setIsPartOfSeries(!!checked);
                          if (!checked) {
                            // Store current series data before clearing
                            const currentSeriesTitle = form.watch("seriesTitle");
                            const currentSeriesNumber = form.watch("seriesNumber");
                            if (currentSeriesTitle) {
                              setOriginalSeriesData({
                                seriesTitle: currentSeriesTitle,
                                seriesNumber: currentSeriesNumber || null
                              });
                            }
                            form.setValue("seriesTitle", "");
                            form.setValue("seriesNumber", null);
                          } else {
                            // Restore original series data if available
                            if (originalSeriesData) {
                              form.setValue("seriesTitle", originalSeriesData.seriesTitle);
                              form.setValue("seriesNumber", originalSeriesData.seriesNumber);
                            }
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="isPartOfSeries" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium text-[16px]">
                          This book is part of a series
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Check this if your book belongs to a series
                        </p>
                      </div>
                    </div>

                    {/* Series details - shown when checkbox is checked */}
                    {form.watch("seriesTitle") && (
                      <div className="bg-gray-50 p-4 rounded-md border space-y-4">
                        <div className="space-y-2">
                          <Label className="font-medium text-[16px] text-gray-700">Series Title</Label>
                          <p className="text-sm font-medium">{form.watch("seriesTitle")}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              // Sauvegarder les données du formulaire dans sessionStorage
                              saveFormDataToSession();
                              sessionStorage.setItem('returnToBookEdit', bookId || 'new');
                              
                              // Trouver l'ID de la série actuelle basé sur le titre
                              const currentSeriesTitle = form.watch("seriesTitle");
                              if (currentSeriesTitle) {
                                try {
                                  // Récupérer toutes les séries pour trouver l'ID correspondant
                                  const seriesResponse = await apiRequest("GET", "/api/series");
                                  const currentSeries = seriesResponse.find((s: any) => s.title === currentSeriesTitle);
                                  
                                  if (currentSeries) {
                                    // Rediriger vers la page d'édition de la série spécifique
                                    window.location.href = `/series-edit/${currentSeries.id}`;
                                  } else {
                                    // Fallback vers la liste des séries
                                    window.location.href = '/manage-series';
                                  }
                                } catch (error) {
                                  console.error('Error finding series:', error);
                                  // Fallback vers la liste des séries
                                  window.location.href = '/manage-series';
                                }
                              } else {
                                window.location.href = '/manage-series';
                              }
                            }}
                          >
                            Edit series details
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm">
                                Remove from series
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove title from series</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this book from the series? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => {
                                    form.setValue("seriesTitle", "");
                                    form.setValue("seriesNumber", null);
                                    toast.success({
                                      title: "Livre retiré de la série",
                                      description: "Le livre a été retiré de la série avec succès.",
                                    });
                                  }}
                                >
                                  Remove from series
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}

                    {/* Series selection - shown when checkbox is checked but no series selected yet */}
                    {!form.watch("seriesTitle") && isPartOfSeries && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="font-medium text-[16px]">Select existing series</Label>
                            <Select 
                              value={form.watch("seriesTitle") || ""} 
                              onValueChange={(value) => {
                                form.setValue("seriesTitle", value);
                                form.setValue("seriesNumber", 1);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Choose a series..." />
                              </SelectTrigger>
                              <SelectContent>
                                {userSeries.length > 0 ? (
                                  userSeries.map((series: any) => (
                                    <SelectItem key={series.id} value={series.title}>
                                      {series.title}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-series" disabled>
                                    No series available - Create one first
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="pt-6">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const seriesTitle = form.watch("seriesTitle");
                                if (seriesTitle) {
                                  // Si le livre a un seriesTitle, on redirige vers l'édition de cette série
                                  const matchingSeries = userSeries.find((s: any) => s.title === seriesTitle);
                                  if (matchingSeries) {
                                    // ORDRE IMPORTANT: Définir le marqueur AVANT la sauvegarde pour "Edit series details"
                                    sessionStorage.setItem('returnToBookEdit', bookId || 'new');
                                    saveFormDataToSession();
                                    window.location.href = `/series-edit/${matchingSeries.id}`;
                                  } else {
                                    window.location.href = '/manage-series';
                                  }
                                } else {
                                  // Aucune série sélectionnée - créer une nouvelle série
                                  // ORDRE IMPORTANT: Définir le marqueur AVANT la sauvegarde
                                  sessionStorage.setItem('returnToBookEdit', bookId || 'new');
                                  // Sauvegarder les données SEULEMENT dans sessionStorage (pas en base de données)
                                  saveFormDataToSession();
                                  
                                  // Rediriger vers la création de série
                                  window.location.href = '/series-setup';
                                }
                              }}
                            >
                              {form.watch("seriesTitle") ? "Edit series" : "Create series"}
                            </Button>
                          </div>
                        </div>
                        
                        {form.watch("seriesTitle") && (
                          <div className="space-y-2">
                            <Label htmlFor="seriesNumber" className="font-medium text-[16px]">Volume Number</Label>
                            <Input
                              id="seriesNumber"
                              type="number"
                              min="1"
                              placeholder="1"
                              {...form.register("seriesNumber", { valueAsNumber: true })}
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edition Number */}
                  <div className="space-y-2">
                    <Label htmlFor="editionNumber" className="font-medium text-[16px]">Edition Number</Label>
                    <p className="text-sm text-gray-600">
                      The edition number tells readers whether the book is an original or updated version. Note: This cannot be changed after the book is published.
                    </p>
                    <Input
                      id="editionNumber"
                      type="number"
                      min="1"
                      placeholder="1"
                      {...form.register("editionNumber", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Author Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium text-[16px]">Author</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Enter the primary author or contributor. Pen names are allowed. Note: before continuing, check your spelling since this field cannot be updated after publication.
                      </p>
                    </div>
                    
                    <div>
                      <Label className="font-medium text-[14px]">Primary Author or Contributor</Label>
                      <div className="grid grid-cols-5 gap-3 mt-2">
                        <Input
                          placeholder="Prefix"
                          {...form.register("authorPrefix")}
                        />
                        <Input
                          placeholder="First name"
                          {...form.register("authorFirstName", { required: "First name is required" })}
                        />
                        <Input
                          placeholder="Middle name"
                          {...form.register("authorMiddleName")}
                        />
                        <Input
                          placeholder="Last name"
                          {...form.register("authorLastName", { required: "Last name is required" })}
                        />
                        <Input
                          placeholder="Suffix"
                          {...form.register("authorSuffix")}
                        />
                      </div>
                      {(form.formState.errors.authorFirstName || form.formState.errors.authorLastName) && (
                        <p className="text-sm text-red-600 mt-1">First name and last name are required</p>
                      )}
                    </div>
                  </div>

                  {/* Contributors Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium text-[16px]">Contributors</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Add up to 9 contributors. They'll display on Amazon using the order you enter below.
                      </p>
                    </div>
                    
                    <div>
                      <Label className="font-medium text-[14px]">Contributors <span className="text-sm font-normal text-gray-500">(Optional)</span></Label>
                      
                      {contributors.map((contributor, index) => (
                        <div key={contributor.id} className="grid grid-cols-7 gap-3 mt-2 items-center">
                          <Select 
                            value={contributor.role} 
                            onValueChange={(value) => updateContributor(contributor.id, 'role', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Author">Author</SelectItem>
                              <SelectItem value="Editor">Editor</SelectItem>
                              <SelectItem value="Foreword">Foreword</SelectItem>
                              <SelectItem value="Illustrator">Illustrator</SelectItem>
                              <SelectItem value="Introduction">Introduction</SelectItem>
                              <SelectItem value="Narrator">Narrator</SelectItem>
                              <SelectItem value="Photographer">Photographer</SelectItem>
                              <SelectItem value="Preface">Preface</SelectItem>
                              <SelectItem value="Translator">Translator</SelectItem>
                              <SelectItem value="Contributions by">Contributions by</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Prefix"
                            value={contributor.prefix || ""}
                            onChange={(e) => updateContributor(contributor.id, 'prefix', e.target.value)}
                          />
                          <Input
                            placeholder="First name"
                            value={contributor.firstName}
                            onChange={(e) => updateContributor(contributor.id, 'firstName', e.target.value)}
                          />
                          <Input
                            placeholder="Middle name"
                            value={contributor.middleName || ""}
                            onChange={(e) => updateContributor(contributor.id, 'middleName', e.target.value)}
                          />
                          <Input
                            placeholder="Last name"
                            value={contributor.lastName}
                            onChange={(e) => updateContributor(contributor.id, 'lastName', e.target.value)}
                          />
                          <Input
                            placeholder="Suffix"
                            value={contributor.suffix || ""}
                            onChange={(e) => updateContributor(contributor.id, 'suffix', e.target.value)}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContributor(contributor.id)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      {contributors.length < 9 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addContributor}
                          className="mt-3"
                        >
                          Add Another
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description-editor" className="font-medium text-[16px]">Description</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Provide a description that will entice readers to buy your book. What is your book about? What makes it interesting? What should readers expect? This can be copied from the back cover of your book. Maximum {maxDescriptionCharacters.toLocaleString()} characters.
                      </p>
                    </div>
                    
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                      <Select onValueChange={handleDescriptionFormatChange}>
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
                      
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDescriptionFormatting('bold')}>
                        <strong>B</strong>
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDescriptionFormatting('italic')}>
                        <em>I</em>
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDescriptionFormatting('underline')}>
                        <u>U</u>
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDescriptionFormatting('insertUnorderedList')}>
                        • List
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDescriptionFormatting('insertOrderedList')}>
                        1. List
                      </Button>
                      
                      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Link2 className="w-4 h-4" />
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
                              onChange={(e) => setLinkUrl(e.target.value)}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                                Cancel
                              </Button>
                              <Button 
                                style={{ backgroundColor: 'var(--kdp-primary-blue)', color: 'white' }}
                                onClick={insertDescriptionLink}
                              >
                                Insert
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="space-y-2">
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
                        data-placeholder="Enter a compelling book description that will attract readers..."
                        suppressContentEditableWarning={true}
                      />
                      <input
                        type="hidden"
                        {...form.register('description')}
                      />
                      <div className="flex justify-end">
                        <span className={`text-sm ${descriptionCharacterCount > maxDescriptionCharacters ? 'text-red-600' : 'text-green-600'}`}>
                          <strong>{descriptionCharacterCount}</strong> / {maxDescriptionCharacters}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Publishing Rights */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Publishing Rights</Label>
                    <p className="text-sm text-gray-600">
                      Choose the option that applies to your book. Choosing the wrong option may result in your content being blocked.
                    </p>
                    <RadioGroup 
                      value={form.watch("publishingRights") || ""} 
                      onValueChange={(value) => form.setValue("publishingRights", value as any)}
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="owned" id="owned" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="owned" className="text-sm font-medium">I own the copyright and hold publishing rights</Label>
                          <p className="text-sm text-gray-600 mt-1">You wrote the book yourself, bought the rights from someone else, or work for the publisher that holds the rights.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="public-domain" id="public-domain" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="public-domain" className="text-sm font-medium">This is a public domain work</Label>
                          <p className="text-sm text-gray-600 mt-1">The content is in the public domain and you have the right to publish it.</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Categories */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Categories</Label>
                    <p className="text-sm text-gray-600">
                      Choose up to 2 categories that best describe your book. This will help customers find your book. You can search by keyword, see all categories, or browse by subject.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {categories.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeCategory(category)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a category"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCategory(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value) {
                            addCategory(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">Add up to 10 categories that best describe your book.</p>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Keywords</Label>
                    <p className="text-sm text-gray-600">
                      Enter up to 7 keywords or short phrases that describe the content, topic, theme or type of your book. Separate keywords with commas.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a keyword"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeyword(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value) {
                            addKeyword(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Examples: vampires, romance, cooking, gardening, mystery, young adult</p>
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Additional Options</Label>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="hasExplicitContent"
                          checked={form.watch("hasExplicitContent") || false}
                          onCheckedChange={(checked) => form.setValue("hasExplicitContent", checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="hasExplicitContent" className="text-sm font-medium">Adult content</Label>
                          <p className="text-sm text-gray-600 mt-1">Check this box if your book contains content unsuitable for minors under 18</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="useAI"
                          checked={form.watch("useAI") || false}
                          onCheckedChange={(checked) => form.setValue("useAI", checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="useAI" className="text-sm font-medium">AI-generated content</Label>
                          <p className="text-sm text-gray-600 mt-1">Check this box if this content has been generated using AI tools. When you check this box, you must also acknowledge that your use of AI-generated content follows all applicable guidelines. <span className="text-blue-600 underline cursor-pointer">Learn more</span></p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="previouslyPublished"
                          checked={form.watch("previouslyPublished") || false}
                          onCheckedChange={(checked) => form.setValue("previouslyPublished", checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="previouslyPublished" className="font-medium text-[16px]">Previously published content</Label>
                          <p className="text-sm text-gray-600 mt-1">Check this box if your content is at least 10% different from a version that has been previously published or sold on Amazon or elsewhere, or if the content is new to Amazon</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="isLowContentBook"
                          checked={form.watch("isLowContentBook") || false}
                          onCheckedChange={(checked) => form.setValue("isLowContentBook", checked as boolean)}
                          className="mt-1"
                        />
                        <Label htmlFor="useAI" className="font-medium text-[16px]">AI was used in creating this book</Label>
                      </div>
                    </div>
                  </div>

                  {/* Primary Marketplace */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryMarketplace" className="font-medium text-[16px]">Primary Marketplace</Label>
                    <Select 
                      value={form.watch("primaryMarketplace") || ""} 
                      onValueChange={(value) => form.setValue("primaryMarketplace", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces.map((marketplace) => (
                          <SelectItem key={marketplace} value={marketplace}>{marketplace}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Paperback Content Tab */}
              {activeTab === "content" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload your manuscript and configure content settings
</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Manuscript</h3>
                    <p className="text-gray-600 mb-4">
                      Upload your completed manuscript in PDF format
                    </p>
                    <Button variant="outline">
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Print Options</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="bleedSettings" />
                        <Label htmlFor="bleedSettings" className="font-medium text-[16px]">This book has bleed settings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="largeBook" />
                        <Label htmlFor="largeBook" className="font-medium text-[16px]">This is a large book (over 828 pages)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="printLengthTemp" className="font-medium text-[16px]">Print Length (pages)</Label>
                    <Input
                      id="printLengthTemp"
                      type="number"
                      min="24"
                      placeholder="100"
                      defaultValue="100"
                    />
                    <p className="text-sm text-gray-500">
                      Minimum 24 pages required for paperback printing
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Paperback Rights & Pricing Tab */}
              {activeTab === "pricing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Set your pricing and distribution preferences
</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Distribution Rights */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Territories</Label>
                    <p className="text-sm text-gray-600">
                      Select the territories where you have rights to sell this book.
                    </p>
                    <RadioGroup defaultValue="worldwide">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worldwide" id="worldwide" />
                        <Label htmlFor="worldwide" className="font-medium text-[16px]">All territories (worldwide rights)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="font-medium text-[16px]">Individual territories</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Primary Marketplace */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryMarketplace" className="font-medium text-[16px]">Primary Marketplace</Label>
                    <Select 
                      value={form.watch("primaryMarketplace") || ""} 
                      onValueChange={(value) => form.setValue("primaryMarketplace", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces.map((marketplace) => (
                          <SelectItem key={marketplace} value={marketplace}>{marketplace}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Pricing, royalties, and distribution</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="listPriceTemp" className="font-medium text-[16px]">List Price (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="listPriceTemp"
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="9.99"
                            defaultValue="9.99"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="printCostTemp" className="font-medium text-[16px]">Print Cost</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="printCostTemp"
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="0.00"
                            defaultValue="2.50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="royaltyRateTemp" className="font-medium text-[16px]">Royalty Rate</Label>
                        <Select defaultValue="60">
                          <SelectTrigger>
                            <SelectValue placeholder="Select royalty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">60%</SelectItem>
                            <SelectItem value="70">70%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ISBN */}
                  <div className="space-y-2">
                    <Label htmlFor="isbnTemp" className="font-medium text-[16px]">ISBN (Optional)</Label>
                    <Input
                      id="isbnTemp"
                      placeholder="Enter ISBN if you have one"
                      defaultValue=""
                    />
                    <p className="text-sm text-gray-500">
                      Leave blank to get a free Amazon ISBN
                    </p>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Terms & Conditions</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="acceptTerms" />
                      <Label htmlFor="acceptTerms" className="font-medium text-[16px]">
                        I confirm that I agree to and am in compliance with the KDP Terms and Conditions
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/projects")}
                >
                  Cancel
                </Button>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const formData = form.getValues();
                      handleSaveAsDraft(formData);
                    }}
                    disabled={saveBook.isPending || descriptionCharacterCount > maxDescriptionCharacters}
                  >
                    {saveBook.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                  {activeTab !== "pricing" && (
                    <Button
                      type="button"
                      onClick={() => {
                        const formData = form.getValues();
                        handleSaveAndContinue(formData);
                      }}
                      disabled={saveBook.isPending || descriptionCharacterCount > maxDescriptionCharacters}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {saveBook.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save and Continue"
                      )}
                    </Button>
                  )}
                  {activeTab === "pricing" && (
                    <Button
                      type="submit"
                      disabled={saveBook.isPending || descriptionCharacterCount > maxDescriptionCharacters}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {saveBook.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isCreating ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {isCreating ? 'Create Book' : 'Update Book'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this book? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteBook.mutate();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}