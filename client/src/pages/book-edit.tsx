import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, CheckCircle, ArrowLeft, BookOpen, Loader2, Link2, Lightbulb } from "lucide-react";
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
import { insertBookSchema, type Book, type MarketplaceCategory } from "@shared/schema";
import { z } from "zod";
import Layout from "@/components/Layout";
import ContentRecommendationSidebar from "@/components/ContentRecommendationSidebar";

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
  "Amazon.com",
  "Amazon.co.uk", 
  "Amazon.de",
  "Amazon.fr",
  "Amazon.es",
  "Amazon.it",
  "Amazon.nl",
  "Amazon.pl",
  "Amazon.se",
  "Amazon.co.jp",
  "Amazon.ca",
  "Amazon.com.au"
];

const readingAges = [
  "Baby-2 years", "3-5 years", "6-8 years", "9-12 years", "13-17 years", "18+ years"
];

const contributorRoles = [
  "Author", "Editor", "Foreword", "Illustrator", "Introduction", "Narrator", "Photographer", "Preface", "Translator", "Contributions by"
];

const trimSizes = {
  mostPopular: [
    { id: "5x8", label: "5 x 8 in", metric: "12.7 x 20.32 cm" },
    { id: "5.25x8", label: "5.25 x 8 in", metric: "13.34 x 20.32 cm" },
    { id: "5.5x8.5", label: "5.5 x 8.5 in", metric: "13.97 x 21.59 cm" },
    { id: "6x9", label: "6 x 9 in", metric: "15.24 x 22.86 cm" }
  ],
  moreStandard: [
    { id: "5.06x7.81", label: "5.06 x 7.81 in", metric: "12.85 x 19.84 cm" },
    { id: "6.14x9.21", label: "6.14 x 9.21 in", metric: "15.6 x 23.39 cm" },
    { id: "6.69x9.61", label: "6.69 x 9.61 in", metric: "16.99 x 24.4 cm" },
    { id: "7x10", label: "7 x 10 in", metric: "17.78 x 25.4 cm" },
    { id: "7.44x9.69", label: "7.44 x 9.69 in", metric: "18.9 x 24.61 cm" },
    { id: "7.5x9.25", label: "7.5 x 9.25 in", metric: "19.05 x 23.5 cm" },
    { id: "8x10", label: "8 x 10 in", metric: "20.32 x 25.4 cm" },
    { id: "8.5x11", label: "8.5 x 11 in", metric: "21.59 x 27.94 cm" }
  ],
  nonStandard: [
    { id: "8.27x11.69", label: "8.27 x 11.69 in", metric: "21 x 29.7 cm" },
    { id: "8.25x6", label: "8.25 x 6 in", metric: "20.96 x 15.24 cm" },
    { id: "8.25x8.25", label: "8.25 x 8.25 in", metric: "20.96 x 20.96 cm" },
    { id: "8.5x8.5", label: "8.5 x 8.5 in", metric: "21.59 x 21.59 cm" }
  ]
};



// Categories interface for API data
interface MarketplaceCategory {
  id: string;
  marketplace: string;
  categoryPath: string;
  parentPath: string | null;
  level: number;
  displayName: string;
  isSelectable: boolean;
  sortOrder: number;
  isActive: boolean;
}

// Categories structure matching Amazon KDP - fallback data
const fallbackCategories = [
  {
    path: "Books › Computers & Technology › Business Technology",
    subcategories: [
      "Content Management",
      "User Experience & Usability", 
      "User Generated Content"
    ]
  },
  {
    path: "Books › Computers & Technology › Internet & Social Media",
    subcategories: [
      "Web Marketing",
      "Web Services",
      "Website Analytics",
      "Search Engine Optimization"
    ]
  },
  {
    path: "Books › Computers & Technology › Web Development & Design",
    subcategories: [
      "Content Management",
      "User Experience & Usability",
      "User Generated Content",
      "Web Marketing",
      "Web Services", 
      "Website Analytics"
    ]
  }
];

// Category Selector Component
const CategorySelector = ({ marketplaceCategories, selectedCategories, tempUISelections, setTempUISelections, onCategorySelect, onCategoryRemove, resetTrigger, instanceId }: {
  marketplaceCategories: MarketplaceCategory[];
  selectedCategories: string[];
  tempUISelections: string[];
  setTempUISelections: (selections: string[]) => void;
  onCategorySelect: (categoryPath: string) => void;
  onCategoryRemove?: (categoryPath: string) => void;
  resetTrigger?: number;
  instanceId?: string;
}) => {
  // Calculate maximum depth dynamically from marketplace categories
  const maxDepth = useMemo(() => {
    if (marketplaceCategories.length === 0) return 3; // Default fallback
    
    const minLevel = Math.min(...marketplaceCategories.map(cat => cat.level));
    
    // For deep-level categories (4+), we build a virtual hierarchy starting from level 2
    if (minLevel >= 4) {
      // Count unique path depth levels by analyzing category paths
      const pathDepths = new Set<number>();
      marketplaceCategories.forEach(cat => {
        const cleanPath = cat.categoryPath.replace(/^Books > /, '').replace(/kindle_ebook > |print_kdp_paperback > /, '');
        const segments = cleanPath.split(' > ');
        for (let i = 1; i <= segments.length; i++) {
          pathDepths.add(i + 1); // +1 because we start from level 2 (after Books > discriminant)
        }
      });
      return Math.max(...pathDepths) - 1; // Convert to dropdown count
    }
    
    // Original logic for normal categories
    const maxLevel = Math.max(...marketplaceCategories.map(cat => cat.level));
    return Math.max(maxLevel - minLevel, 1);
  }, [marketplaceCategories]);

  // Dynamic state for navigation levels
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  
  // Store a snapshot of the current category for this instance
  const [localCategorySnapshot, setLocalCategorySnapshot] = useState<string>("");
  
  // Track manual navigation to prevent automatic synchronization conflicts
  const [isManualNavigation, setIsManualNavigation] = useState(false);

  // Initialize selectedLevels when maxDepth changes
  useEffect(() => {
    setSelectedLevels(new Array(maxDepth).fill(""));
  }, [maxDepth]);

  // Reset selections when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setSelectedLevels(new Array(maxDepth).fill(""));
    }
  }, [resetTrigger, maxDepth]);

  // Enhanced state restoration with proper stability checks
  useEffect(() => {
    if (marketplaceCategories.length === 0 || isManualNavigation) {
      return; // Wait for marketplace categories to load or skip during manual navigation
    }

    // Find which category belongs to this instance based on instanceId
    const instanceIndex = instanceId ? parseInt(instanceId.split('-')[1]) : 0;
    // Use tempUISelections if available, otherwise fall back to selectedCategories
    const thisInstanceCategory = tempUISelections[instanceIndex] || selectedCategories[instanceIndex];
    
    // Only trigger reconstruction if the category assigned to this instance has actually changed
    if (localCategorySnapshot === thisInstanceCategory) {
      return; // No change, preserve current state
    }
    
    // Update local snapshot
    setLocalCategorySnapshot(thisInstanceCategory || "");
    
    if (!thisInstanceCategory) {
      // Clear selections if no category is assigned, but only if they're not already empty
      if (selectedLevels.some(level => level !== "")) {
        setSelectedLevels(new Array(maxDepth).fill(""));
      }
      return;
    }

    // Find this instance's category in the marketplace categories
    const categoryData = marketplaceCategories.find(cat => cat.categoryPath === thisInstanceCategory);
    
    if (categoryData) {
      // Check if the current dropdown state already reflects this category
      const currentDeepestPath = selectedLevels.filter(level => level !== "").pop() || "";
      if (currentDeepestPath === thisInstanceCategory) {
        return; // Already correctly set, don't reconstruct
      }
      
      // Reconstruct the hierarchy using compatible logic for virtual hierarchy
      setTimeout(() => {
        const pathParts = categoryData.categoryPath.split(' > ');
        const newLevels = new Array(maxDepth).fill("");
        
        // Check if we're using virtual hierarchy (minLevel >= 4)
        const minLevel = Math.min(...marketplaceCategories.map(cat => cat.level));
        const isVirtualHierarchy = minLevel >= 4;
        
        if (isVirtualHierarchy) {
          // For virtual hierarchy, start from level 2 (Books > discriminant > ...)
          // Skip "Books" and discriminant, start from actual categories
          const cleanPath = categoryData.categoryPath.replace(/^Books > /, '').replace(/kindle_ebook > |print_kdp_paperback > /, '');
          const cleanSegments = cleanPath.split(' > ');
          
          // Build progressive paths starting from level 2
          for (let i = 0; i < Math.min(cleanSegments.length, maxDepth); i++) {
            const discriminant = categoryData.categoryPath.includes('kindle_ebook') ? 'kindle_ebook' : 'print_kdp_paperback';
            const levelPath = 'Books > ' + discriminant + ' > ' + cleanSegments.slice(0, i + 1).join(' > ');
            newLevels[i] = levelPath;
          }
        } else {
          // Original logic for normal level-based categories
          for (let i = 0; i < Math.min(pathParts.length - 1, maxDepth); i++) {
            const levelPath = pathParts.slice(0, i + 2).join(' > ');
            newLevels[i] = levelPath;
          }
        }
        
        // Only update if there are actual changes
        if (JSON.stringify(newLevels) !== JSON.stringify(selectedLevels)) {
          setSelectedLevels(newLevels);
        }
      }, 10); // Small delay to ensure proper state updates
    }
  }, [selectedCategories, marketplaceCategories, instanceId, localCategorySnapshot, isManualNavigation, tempUISelections]);

  // Get categories by level and parent (dynamic)
  const getCategoriesForLevel = (level: number, parentPath?: string) => {
    console.log(`getCategoriesForLevel called with level=${level}, parentPath=${parentPath}`);
    console.log(`marketplaceCategories length: ${marketplaceCategories.length}`);
    
    // For marketplace categories that are all deep-level (4+), we need to build a virtual hierarchy
    // from the category paths instead of relying on level-based filtering
    
    const minLevel = marketplaceCategories.length > 0 ? Math.min(...marketplaceCategories.map(cat => cat.level)) : 3;
    console.log(`minLevel: ${minLevel}`);
    
    // If all our categories are deep-level (4+), we need special handling
    if (minLevel >= 4) {
      console.log('Using virtual hierarchy for deep-level categories');
      // Extract unique path segments to build a virtual hierarchy
      const pathSegments = new Set<string>();
      
      marketplaceCategories.forEach(cat => {
        const cleanPath = cat.categoryPath.replace(/^Books > /, '').replace(/kindle_ebook > |print_kdp_paperback > /, '');
        const segments = cleanPath.split(' > ');
        
        // Add each progressive path segment
        for (let i = 1; i <= segments.length; i++) {
          const partialPath = 'Books > ' + (cat.categoryPath.includes('kindle_ebook') ? 'kindle_ebook > ' : 'print_kdp_paperback > ') + segments.slice(0, i).join(' > ');
          pathSegments.add(partialPath);
        }
      });
      
      console.log(`Generated ${pathSegments.size} virtual path segments:`, Array.from(pathSegments));
      
      // Convert to array and filter by the requested level and parent
      const allVirtualCategories = Array.from(pathSegments).map(path => {
        const segments = path.split(' > ');
        const displayName = segments[segments.length - 1];
        const parentPath = segments.slice(0, -1).join(' > ');
        
        return {
          id: path,
          categoryPath: path,
          displayName: displayName,
          level: segments.length - 1,
          parentPath: parentPath,
          isSelectable: marketplaceCategories.some(cat => cat.categoryPath === path),
          sortOrder: 0
        };
      });
      
      console.log(`Generated ${allVirtualCategories.length} virtual categories`);
      
      // Filter by level and parent
      if (level === 2) { // Root level for virtual hierarchy
        const result = allVirtualCategories
          .filter(cat => cat.level === 2)
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
        console.log(`Returning ${result.length} categories for level 2:`, result);
        return result;
      } else {
        const result = allVirtualCategories
          .filter(cat => cat.level === level && cat.parentPath === parentPath)
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
        console.log(`Returning ${result.length} categories for level ${level} with parent "${parentPath}":`, result);
        return result;
      }
    }
    
    // Original logic for normal level-based categories
    if (level === minLevel) {
      return marketplaceCategories
        .filter(cat => cat.level === minLevel)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    return marketplaceCategories
      .filter(cat => cat.level === level && cat.parentPath === parentPath)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getSelectableCategories = (parentPath: string) => {
    return marketplaceCategories
      .filter(cat => cat.parentPath === parentPath && cat.isSelectable)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Get leaf categories (final/deepest categories) that are descendants of the current navigation path
  const getLeafCategoriesForCurrentPath = () => {
    // Determine the current deepest selected path from dynamic levels
    const currentPath = selectedLevels.filter(level => level !== "").pop() || "";
    
    // If no path is selected, return empty array (Placement should be empty)
    if (!currentPath) {
      return [];
    }
    
    // Find all categories that are descendants of the current path and have no children
    const leafCategories = marketplaceCategories.filter(category => {
      // Must be a descendant of the current path (category path should start with current path)
      const isDescendant = category.categoryPath.startsWith(currentPath + ' > ') || category.categoryPath === currentPath;
      
      if (!isDescendant || !category.isSelectable) {
        return false;
      }
      
      // A category is a leaf if no other category has it as a parent
      const hasChildren = marketplaceCategories.some(otherCat => 
        otherCat.parentPath === category.categoryPath
      );
      
      return !hasChildren;
    });
    
    // Debug logging (removed for production)
    
    return leafCategories.sort((a, b) => {
      // Sort by level first (deeper categories first), then by display name
      if (a.level !== b.level) {
        return b.level - a.level; // Higher levels (deeper) first
      }
      return a.displayName.localeCompare(b.displayName);
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 min-w-[600px]">
      {/* Left side: Dynamic Category dropdowns */}
      <div className="space-y-4">
        {/* Generate dropdowns dynamically based on maxDepth */}
        {Array.from({ length: maxDepth }, (_, index) => {
          // Calculate the actual level based on whether we're using virtual hierarchy or real levels
          const minLevel = marketplaceCategories.length > 0 ? Math.min(...marketplaceCategories.map(cat => cat.level)) : 3;
          const level = minLevel >= 4 ? index + 2 : index + minLevel; // Start from level 2 for virtual hierarchy, or minLevel for real
          const parentPath = index === 0 ? undefined : selectedLevels[index - 1];
          const shouldShow = index === 0 || (parentPath && parentPath !== "");
          
          if (!shouldShow) return null;
          
          const categories = getCategoriesForLevel(level, parentPath);
          
          // Don't show dropdown if no categories available
          if (categories.length === 0) return null;
          
          return (
            <div key={`level-${level}`} className="space-y-2">
              <Label className="text-sm font-medium">
                {index === 0 ? "Category" : "Subcategory"}
              </Label>
              <Select 
                value={selectedLevels[index] || ""} 
                onValueChange={(value) => {
                  const newLevels = [...selectedLevels];
                  newLevels[index] = value;
                  // Clear all subsequent levels when a parent changes
                  for (let i = index + 1; i < maxDepth; i++) {
                    newLevels[i] = "";
                  }
                  setSelectedLevels(newLevels);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={index === 0 ? "Select category" : "Select subcategory"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.categoryPath}>
                      <span className="text-left">{category.displayName}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
      {/* Right side: Placement section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Placement</Label>
        <div className="bg-gray-50 rounded border p-4 h-fit">
          <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
            {/* Display leaf categories for current path only */}
            {getLeafCategoriesForCurrentPath().map((category) => {
              // Find this instance's category in the tempUISelections
              const instanceIndex = instanceId ? parseInt(instanceId.split('-')[1]) : 0;
              const thisInstanceCategory = tempUISelections[instanceIndex];
              
              return (
                <div key={category.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`leaf-category-${category.id}`}
                    checked={thisInstanceCategory === category.categoryPath}
                    onCheckedChange={(checked) => {
                    console.log('Placement checkbox clicked:', { checked, categoryPath: category.categoryPath, tempUISelections });
                    
                    const instanceIndex = instanceId ? parseInt(instanceId.split('-')[1]) : 0;
                    
                    if (checked) {
                      // Set this category for this specific instance
                      const newSelections = [...tempUISelections];
                      newSelections[instanceIndex] = category.categoryPath;
                      setTempUISelections(newSelections);
                      console.log('Added to temp selections:', category.categoryPath);
                      
                      // Populate the navigation dropdowns to show the path to this category
                      const categoryData = marketplaceCategories.find(cat => cat.categoryPath === category.categoryPath);
                      console.log('Found category data:', categoryData);
                      
                      if (categoryData) {
                        // Mark as manual navigation to prevent sync conflicts
                        setIsManualNavigation(true);
                        
                        // Reconstruct the navigation hierarchy using compatible logic for virtual hierarchy
                        setTimeout(() => {
                          console.log('Reconstructing navigation for level:', categoryData.level);
                          
                          const pathParts = categoryData.categoryPath.split(' > ');
                          console.log('Category path parts:', pathParts);
                          
                          const newLevels = new Array(maxDepth).fill("");
                          
                          // Check if we're using virtual hierarchy (minLevel >= 4)
                          const minLevel = Math.min(...marketplaceCategories.map(cat => cat.level));
                          const isVirtualHierarchy = minLevel >= 4;
                          
                          if (isVirtualHierarchy) {
                            // For virtual hierarchy, start from level 2 (Books > discriminant > ...)
                            const cleanPath = categoryData.categoryPath.replace(/^Books > /, '').replace(/kindle_ebook > |print_kdp_paperback > /, '');
                            const cleanSegments = cleanPath.split(' > ');
                            
                            // Build progressive paths starting from level 2
                            for (let i = 0; i < Math.min(cleanSegments.length, maxDepth); i++) {
                              const discriminant = categoryData.categoryPath.includes('kindle_ebook') ? 'kindle_ebook' : 'print_kdp_paperback';
                              const levelPath = 'Books > ' + discriminant + ' > ' + cleanSegments.slice(0, i + 1).join(' > ');
                              newLevels[i] = levelPath;
                              console.log(`Virtual hierarchy level ${i + 2}:`, levelPath);
                            }
                          } else {
                            // Original logic for normal level-based categories
                            for (let i = 0; i < Math.min(pathParts.length - 1, maxDepth); i++) {
                              const levelPath = pathParts.slice(0, i + 2).join(' > ');
                              newLevels[i] = levelPath;
                              console.log(`Setting level ${i + 2}:`, levelPath);
                            }
                          }
                          
                          setSelectedLevels(newLevels);
                          
                          // Reset manual navigation flag after a longer delay to prevent conflicts
                          setTimeout(() => setIsManualNavigation(false), 500);
                        }, 50);
                      }
                    } else {
                      // Handle unchecking - remove from this specific instance
                      console.log('Unchecking category from temp selections:', category.categoryPath);
                      const newSelections = [...tempUISelections];
                      newSelections[instanceIndex] = undefined;
                      setTempUISelections(newSelections.filter(Boolean));
                    }
                  }}
                  className="mt-0.5"
                />
                  <Label 
                    htmlFor={`leaf-category-${category.id}`} 
                    className="text-sm cursor-pointer leading-5"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{category.displayName}</span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {category.categoryPath.replace(/^Books > /, '').replace(/kindle_ebook > |print_kdp_paperback > /, '')}
                      </span>
                    </div>
                  </Label>
                </div>
              );
            })}
            
            {/* Show message if no leaf categories available */}
            {getLeafCategoriesForCurrentPath().length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                {selectedLevels.some(level => level !== "") 
                  ? "No final categories available in this branch."
                  : "Navigate through categories to see placement options."
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EditBook() {
  const { bookId } = useParams();
  const [location, setLocation] = useLocation();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Temporary UI selections that don't trigger validation until modal save
  const [tempUISelections, setTempUISelections] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isPartOfSeries, setIsPartOfSeries] = useState(false);
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const [authorExplicitlyRemoved, setAuthorExplicitlyRemoved] = useState<boolean>(false);
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [resetTriggers, setResetTriggers] = useState<{ [key: number]: number }>({});
  const [showMarketplaceConflictDialog, setShowMarketplaceConflictDialog] = useState(false);
  const [pendingMarketplace, setPendingMarketplace] = useState<string>("");
  const [incompatibleCategories, setIncompatibleCategories] = useState<string[]>([]);
  const [trimSizeModalOpen, setTrimSizeModalOpen] = useState(false);
  const [selectedTrimSize, setSelectedTrimSize] = useState("6x9");
  // Store original series data to restore when checkbox is checked again
  const [originalSeriesData, setOriginalSeriesData] = useState<{
    seriesTitle: string;
    seriesNumber: number | null;
  } | null>(null);

  
  // ISBN Apply functionality states
  const [officialIsbnContentValue, setOfficialIsbnContentValue] = useState("");
  const [isbnValidationError, setIsbnValidationError] = useState("");
  const [isCheckingIsbn, setIsCheckingIsbn] = useState(false);
  const [showIsbnContentApplyDialog, setShowIsbnContentApplyDialog] = useState(false);
  
  // WYSIWYG Editor states for Description
  const [descriptionCharacterCount, setDescriptionCharacterCount] = useState(0);
  const maxDescriptionCharacters = 4000;
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [descriptionEditorContent, setDescriptionEditorContent] = useState('');
  
  // AI Recommendation Sidebar state
  const [showAISidebar, setShowAISidebar] = useState(false);
  
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
    // Create a temporary div to parse the HTML safely
    const tempDiv = document.createElement('div');
    // Use textContent first to prevent XSS, then parse as DOM
    tempDiv.textContent = html;
    const escapedHtml = tempDiv.innerHTML;
    tempDiv.innerHTML = '';
    
    // Create a DOMParser for safe HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Clear tempDiv and safely append parsed content
    while (tempDiv.firstChild) {
      tempDiv.removeChild(tempDiv.firstChild);
    }
    
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
      isPartOfSeries,
      selectedAuthorId
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
  }, [form, keywords, categories, contributors, isPartOfSeries, selectedAuthorId, bookId]);

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
        const { keywords: savedKeywords, categories: savedCategories, contributors: savedContributors, isPartOfSeries: savedIsPartOfSeries, selectedAuthorId: savedSelectedAuthorId, ...formFields } = formData;
        
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
        if (savedSelectedAuthorId) {
          setSelectedAuthorId(savedSelectedAuthorId);
        }

        
        // Restore description in WYSIWYG editor safely
        if (formFields.description) {
          setDescriptionEditorContent(formFields.description);
          // Safely get text content length
          const parser = new DOMParser();
          const doc = parser.parseFromString(formFields.description, 'text/html');
          const textContent = doc.body.textContent || doc.body.innerText || '';
          setDescriptionCharacterCount(textContent.length);
          
          // Set the editor content safely after a short delay
          setTimeout(() => {
            const editor = document.getElementById('description-editor') as HTMLDivElement;
            if (editor) {
              // Clear editor first
              while (editor.firstChild) {
                editor.removeChild(editor.firstChild);
              }
              
              // Use cleanHTML function to safely set content
              const cleanedContent = cleanHTML(formFields.description);
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
      // Load description into WYSIWYG editor safely
      if (book.description) {
        setDescriptionEditorContent(book.description);
        // Safely get text content length
        const parser = new DOMParser();
        const doc = parser.parseFromString(book.description, 'text/html');
        const textContent = doc.body.textContent || doc.body.innerText || '';
        setDescriptionCharacterCount(textContent.length);
        
        // Set the editor content safely after a short delay
        setTimeout(() => {
          const editor = document.getElementById('description-editor') as HTMLDivElement;
          if (editor) {
            // Clear editor first
            while (editor.firstChild) {
              editor.removeChild(editor.firstChild);
            }
            
            // Use cleanHTML function to safely set content
            const cleanedContent = cleanHTML(book.description);
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
        previousPublicationDate: book.previousPublicationDate || null,
        publicationDate: book.publicationDate || null,
        scheduledReleaseDate: book.scheduledReleaseDate || null,
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
        readingAgeMin: book.readingAgeMin ? book.readingAgeMin.toString() : null,
        readingAgeMax: book.readingAgeMax ? book.readingAgeMax.toString() : null,
      });

      // Set series checkbox state and store original series data
      setIsPartOfSeries(!!book.seriesTitle);
      if (book.seriesTitle) {
        setOriginalSeriesData({
          seriesTitle: book.seriesTitle,
          seriesNumber: book.seriesNumber || null
        });
      }

      // Auto-detect matching author and set states accordingly
      if (book.authorFirstName || book.authorLastName) {
        const authorName = `${book.authorPrefix || ""} ${book.authorFirstName || ""} ${book.authorMiddleName || ""} ${book.authorLastName || ""} ${book.authorSuffix || ""}`.trim();
        const matchingAuthor = authors.find(author => 
          author.fullName === authorName ||
          (author.firstName === (book.authorFirstName || "") && 
           author.lastName === (book.authorLastName || "") &&
           (author.prefix || "") === (book.authorPrefix || "") &&
           (author.middleName || "") === (book.authorMiddleName || "") &&
           (author.suffix || "") === (book.authorSuffix || ""))
        );
        
        if (matchingAuthor) {
          setSelectedAuthorId(matchingAuthor.id);
          console.log('Auto-detected matching author:', matchingAuthor);
        } else {
          setSelectedAuthorId("");
          console.log('No matching author found, keeping form fields');
        }
      } else {
        setSelectedAuthorId("");
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

  // Manage Reading Age dropdowns based on explicit content setting
  useEffect(() => {
    const hasExplicitContent = form.watch("hasExplicitContent");
    
    if (hasExplicitContent) {
      // If explicit content is selected, force both reading ages to 18+
      form.setValue("readingAgeMin", "18");
      form.setValue("readingAgeMax", "18");
    }
  }, [form.watch("hasExplicitContent")]);

  // Ensure Maximum age is always >= Minimum age when explicit content is false
  useEffect(() => {
    const hasExplicitContent = form.watch("hasExplicitContent");
    const minAge = form.watch("readingAgeMin");
    const maxAge = form.watch("readingAgeMax");
    
    if (!hasExplicitContent && minAge && maxAge && parseInt(maxAge) < parseInt(minAge)) {
      // If maximum age is less than minimum age, set maximum to minimum
      form.setValue("readingAgeMax", minAge);
    }
  }, [form.watch("readingAgeMin"), form.watch("readingAgeMax"), form.watch("hasExplicitContent")]);

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch series for selection
  const { data: userSeries = [] } = useQuery<any[]>({
    queryKey: ["/api/series"],
  });

  // Load existing authors
  const { data: authors = [], isLoading: loadingAuthors } = useQuery<any[]>({
    queryKey: ["/api/authors"],
  });

  // Auto-detect author from book data when authors and book are loaded
  useEffect(() => {
    if (authors.length > 0 && book && !hasRestoredFromStorage && !selectedAuthorId && !authorExplicitlyRemoved) {
      // Try to find matching author based on book's author fields
      const bookAuthorName = `${book.authorPrefix || ''} ${book.authorFirstName || ''} ${book.authorMiddleName || ''} ${book.authorLastName || ''} ${book.authorSuffix || ''}`.trim();
      
      if (bookAuthorName && bookAuthorName !== '') {
        const matchingAuthor = authors.find(author => {
          const authorFullName = `${author.prefix || ''} ${author.firstName || ''} ${author.middleName || ''} ${author.lastName || ''} ${author.suffix || ''}`.trim();
          return authorFullName === bookAuthorName;
        });
        
        if (matchingAuthor) {
          console.log('Auto-detected matching author:', matchingAuthor);
          setSelectedAuthorId(matchingAuthor.id);
        } else {
          console.log('No matching author found, keeping form fields');
        }
      }
    }
  }, [authors, book, hasRestoredFromStorage, selectedAuthorId, authorExplicitlyRemoved]);

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
        const createdBook = await apiRequest(`/api/books`, { method: "POST", body: formattedData });
        console.log('Received created book response:', createdBook);
        
        // Save contributors after book creation
        if (contributors.length > 0) {
          for (const contributor of contributors) {
            await apiRequest("/api/contributors", {
              method: "POST",
              body: {
                bookId: createdBook.id,
                projectId: formattedData.projectId, // Add projectId for database compatibility
                name: `${contributor.firstName} ${contributor.lastName}`.trim(), // Add name field for database compatibility
                role: contributor.role,
                prefix: contributor.prefix || null,
                firstName: contributor.firstName,
                middleName: contributor.middleName || null,
                lastName: contributor.lastName,
                suffix: contributor.suffix || null,
              }
            });
          }
        }
        
        return { book: createdBook, shouldNavigate: data.shouldNavigate, nextTab: data.nextTab };
      } else {
        const updatedBook = await apiRequest(`/api/books/${bookId}`, { method: "PATCH", body: formattedData });
        console.log('Received updated book response:', updatedBook);
        
        // Update contributors - first delete existing ones, then add new ones
        if (bookId) {
          // Get existing contributors to delete them
          try {
            const existingContributors = await apiRequest(`/api/contributors/book/${bookId}`, { method: "GET" });
            if (existingContributors && existingContributors.length > 0) {
              for (const contrib of existingContributors) {
                await apiRequest(`/api/contributors/${contrib.id}/${bookId}`, { method: "DELETE" });
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
              await apiRequest("/api/contributors", { method: "POST", body: contributorData });
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
      return await apiRequest(`/api/books/${bookId}`, { method: "DELETE" });
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

  // Function to handle author selection from dropdown
  const handleAuthorSelection = (authorId: string) => {
    if (authorId) {
      const selectedAuthor = authors.find(author => author.id === authorId);
      if (selectedAuthor) {
        // Reset the explicitly removed flag to allow future auto-detection
        setAuthorExplicitlyRemoved(false);
        // Populate form fields with selected author data
        form.setValue("authorPrefix", selectedAuthor.prefix || "");
        form.setValue("authorFirstName", selectedAuthor.firstName || "");
        form.setValue("authorMiddleName", selectedAuthor.middleName || "");
        form.setValue("authorLastName", selectedAuthor.lastName || "");
        form.setValue("authorSuffix", selectedAuthor.suffix || "");
        setSelectedAuthorId(authorId);
      }
    }
  };

  // ISBN validation function
  const checkIsbnUniqueness = async (isbn: string) => {
    if (!isbn.trim()) {
      setIsbnValidationError("");
      return;
    }

    setIsCheckingIsbn(true);
    try {
      // Only exclude current book if it doesn't already have this ISBN
      // If the current book already has this ISBN, we don't exclude it to allow proper duplicate detection
      const shouldExclude = book?.isbn !== isbn.trim();
      const url = shouldExclude 
        ? `/api/books/check-isbn/${encodeURIComponent(isbn.trim())}?excludeBookId=${bookId}`
        : `/api/books/check-isbn/${encodeURIComponent(isbn.trim())}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setIsbnValidationError("This ISBN/ASIN is already in use by another book. Please enter a unique ISBN/ASIN.");
        } else {
          setIsbnValidationError("");
        }
      } else {
        setIsbnValidationError("Unable to validate ISBN/ASIN. Please try again.");
      }
    } catch (error) {
      console.error('Error checking ISBN:', error);
      setIsbnValidationError("Unable to validate ISBN/ASIN. Please try again.");
    } finally {
      setIsCheckingIsbn(false);
    }
  };

  // Debounced ISBN validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (officialIsbnContentValue.trim()) {
        checkIsbnUniqueness(officialIsbnContentValue);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [officialIsbnContentValue, bookId, book?.isbn]);

  // ISBN Apply functionality
  const handleApplyIsbn = async () => {
    if (!officialIsbnContentValue.trim()) {
      return;
    }

    // Check for validation errors before applying
    if (isbnValidationError) {
      toast.error({
        title: "Cannot apply ISBN/ASIN",
        description: "Please resolve the validation error first."
      });
      return;
    }

    try {
      const response = await apiRequest(`/api/books/${bookId}`, {
        method: "PATCH",
        body: {
          isbn: officialIsbnContentValue.trim()
        }
      });

      if (response) {
        toast.success({
          title: "ISBN/ASIN Applied Successfully",
          description: "The Official ISBN/ASIN has been permanently applied to this book."
        });
        // Reset the input value and close dialog
        setOfficialIsbnContentValue("");
        setShowIsbnContentApplyDialog(false);
        setIsbnValidationError("");
        // Invalidate and refetch book data
        queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      }
    } catch (error) {
      console.error('Error applying ISBN:', error);
      toast.error({
        title: "Error",
        description: "Failed to apply ISBN/ASIN. Please try again."
      });
    }
  };

  const cancelIsbnApply = () => {
    setOfficialIsbnContentValue("");
    setShowIsbnContentApplyDialog(false);
  };

  // Force "immediate" release when book was previously published
  useEffect(() => {
    const previouslyPublished = form.watch("previouslyPublished");
    const currentReleaseOption = form.watch("releaseOption");
    
    if (previouslyPublished && currentReleaseOption === "scheduled") {
      form.setValue("releaseOption", "immediate");
      form.setValue("scheduledReleaseDate", null);
    }
  }, [form.watch("previouslyPublished")]);

  // Reload categories when format changes
  useEffect(() => {
    const currentMarketplace = form.watch("primaryMarketplace");
    if (currentMarketplace) {
      loadMarketplaceCategories(currentMarketplace);
    }
  }, [form.watch("format")]);

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

  // Function to determine format from book properties
  const deriveBookFormat = () => {
    const format = form.watch("format");
    const isLargePrintBook = form.watch("isLargePrintBook");
    const isLowContentBook = form.watch("isLowContentBook");
    
    console.log('Format derivation inputs:', { format, isLargePrintBook, isLowContentBook });
    
    // If format is explicitly set, use it
    if (format) {
      console.log('Using explicit format:', format);
      return format;
    }
    
    // Derive format from boolean flags - large print and low content are typically paperback
    if (isLargePrintBook || isLowContentBook) {
      console.log('Deriving paperback from flags:', { isLargePrintBook, isLowContentBook });
      return "paperback";
    }
    
    // Default to ebook if no clear indicators
    console.log('Defaulting to ebook');
    return "ebook";
  };

  // Function to load categories for a specific marketplace
  const loadMarketplaceCategories = async (marketplace: string) => {
    if (!marketplace) return;
    
    console.log('Loading categories for marketplace:', marketplace);
    
    setLoadingCategories(true);
    try {
      const derivedFormat = deriveBookFormat();
      console.log('Derived format:', derivedFormat);
      
      const formatParam = derivedFormat ? `?format=${encodeURIComponent(derivedFormat)}` : '';
      const response = await apiRequest(`/api/marketplace-categories/${encodeURIComponent(marketplace)}${formatParam}`, { method: "GET" });
      setMarketplaceCategories(response || []);
    } catch (error) {
      console.error("Error loading marketplace categories:", error);
      // Fallback to empty array if error
      setMarketplaceCategories([]);
      toast({
        title: "Error",
        description: "Failed to load categories for selected marketplace",
        variant: "destructive"
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Function to check if categories are compatible with marketplace
  const checkCategoryCompatibility = async (newMarketplace: string, currentCategories: string[]) => {
    if (currentCategories.length === 0) return [];
    
    try {
      const derivedFormat = deriveBookFormat();
      const formatParam = derivedFormat ? `?format=${encodeURIComponent(derivedFormat)}` : '';
      const response = await apiRequest(`/api/marketplace-categories/${encodeURIComponent(newMarketplace)}${formatParam}`, { method: "GET" });
      const newMarketplaceCategories: MarketplaceCategory[] = response || [];
      const validCategoryPaths = newMarketplaceCategories.map(cat => cat.categoryPath);
      
      return currentCategories.filter(category => !validCategoryPaths.includes(category));
    } catch (error) {
      console.error("Error checking category compatibility:", error);
      return currentCategories; // Assume all incompatible on error
    }
  };

  // Handle marketplace change with compatibility check
  const handleMarketplaceChange = async (newMarketplace: string) => {
    // Check both form categories and local categories state
    const formCategories = form.getValues("categories") || [];
    const localCategories = categories || [];
    const allCurrentCategories = Array.from(new Set([...formCategories, ...localCategories])); // Combine and deduplicate
    
    console.log("Marketplace change check:", { 
      newMarketplace, 
      formCategories, 
      localCategories, 
      allCurrentCategories 
    });
    
    if (allCurrentCategories.length > 0) {
      const incompatible = await checkCategoryCompatibility(newMarketplace, allCurrentCategories);
      
      console.log("Compatibility check result:", { incompatible });
      
      if (incompatible.length > 0) {
        setPendingMarketplace(newMarketplace);
        setIncompatibleCategories(incompatible);
        setShowMarketplaceConflictDialog(true);
        return; // Don't change marketplace yet
      }
    }
    
    // No conflicts, proceed with change
    form.setValue("primaryMarketplace", newMarketplace);
    loadMarketplaceCategories(newMarketplace);
  };

  // Handle conflict dialog actions
  const proceedWithMarketplaceChange = () => {
    // Store values before clearing state
    const marketplaceName = pendingMarketplace;
    const removedCount = incompatibleCategories.length;
    
    // Remove incompatible categories from both form and local state
    const formCategories = form.getValues("categories") || [];
    const localCategories = categories || [];
    
    const compatibleFormCategories = formCategories.filter(cat => !incompatibleCategories.includes(cat));
    const compatibleLocalCategories = localCategories.filter(cat => !incompatibleCategories.includes(cat));
    
    form.setValue("categories", compatibleFormCategories);
    setCategories(compatibleLocalCategories);
    form.setValue("primaryMarketplace", pendingMarketplace);
    loadMarketplaceCategories(pendingMarketplace);
    
    setShowMarketplaceConflictDialog(false);
    setPendingMarketplace("");
    setIncompatibleCategories([]);
    
    toast.success({
      title: "Marketplace Changed",
      description: `Marketplace changed to ${marketplaceName} and ${removedCount} incompatible categories removed`
    });
  };

  const cancelMarketplaceChange = () => {
    setShowMarketplaceConflictDialog(false);
    setPendingMarketplace("");
    setIncompatibleCategories([]);
  };

  // Function to build category tree structure from flat database records
  const buildCategoryTree = (categories: MarketplaceCategory[]) => {
    const tree: any[] = [];
    const categoryMap = new Map();

    console.log("Building category tree from categories:", categories);

    // Sort by level and sort order
    const sortedCategories = [...categories].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.sortOrder - b.sortOrder;
    });

    // Build the tree structure
    sortedCategories.forEach(category => {
      const item = {
        path: category.categoryPath,
        displayName: category.displayName,
        level: category.level,
        isSelectable: category.isSelectable,
        parentPath: category.parentPath,
        subcategories: []
      };

      if (category.level === 2) { // Main categories start at level 2 (Books is level 1)
        tree.push(item);
        categoryMap.set(category.categoryPath, item);
      } else if (category.parentPath) {
        const parent = categoryMap.get(category.parentPath);
        if (parent) {
          parent.subcategories.push(item);
          categoryMap.set(category.categoryPath, item);
        }
      }
    });

    console.log("Built category tree:", tree);
    return tree;
  };

  // Categories modal handlers
  const openCategoriesModal = async () => {
    setSelectedCategories([...categories]);
    setTempUISelections([...categories]); // Initialize temp selections with current categories
    
    // Load categories for current marketplace
    const currentMarketplace = form.watch("primaryMarketplace") || "Amazon.com";
    console.log("Loading categories for marketplace:", currentMarketplace);
    await loadMarketplaceCategories(currentMarketplace);
    
    setShowCategoriesModal(true);
  };

  const saveCategoriesChanges = () => {
    // Use temporary UI selections for final validation
    setCategories([...tempUISelections]);
    setSelectedCategories([...tempUISelections]);
    setShowCategoriesModal(false);
  };

  const cancelCategoriesChanges = () => {
    setSelectedCategories([]);
    setTempUISelections([]); // Reset temporary selections
    setShowCategoriesModal(false);
  };

  const toggleCategorySelection = (categoryPath: string) => {
    const isSelected = tempUISelections.includes(categoryPath);
    if (isSelected) {
      setTempUISelections(tempUISelections.filter(c => c !== categoryPath));
    } else if (tempUISelections.length < 3) {
      setTempUISelections([...tempUISelections, categoryPath]);
    }
  };

  const removeCategoryFromModal = (categoryPath: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== categoryPath));
    // Also remove from temporary selections
    setTempUISelections(tempUISelections.filter(c => c !== categoryPath));
  };

  const onSubmit = (data: BookFormData) => {
    const processedData = {
      ...data,
      readingAgeMin: data.readingAgeMin ? String(data.readingAgeMin) : null,
      readingAgeMax: data.readingAgeMax ? String(data.readingAgeMax) : null,
    };
    saveBook.mutate({ bookData: processedData, shouldNavigate: true });
  };

  const handleSaveAsDraft = (data: BookFormData) => {
    const draftData = {
      ...data,
      status: "draft" as const,
      readingAgeMin: data.readingAgeMin ? String(data.readingAgeMin) : null,
      readingAgeMax: data.readingAgeMax ? String(data.readingAgeMax) : null,
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
    
    const processedData = {
      ...data,
      readingAgeMin: data.readingAgeMin ? String(data.readingAgeMin) : null,
      readingAgeMax: data.readingAgeMax ? String(data.readingAgeMax) : null,
    };
    
    saveBook.mutate({ bookData: processedData, nextTab });
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
      <div className="flex w-full h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className={`${showAISidebar ? 'flex-1' : 'w-full'} overflow-y-auto`}>
          <div className="max-w-4xl mx-auto w-full p-4">
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
              
              {/* AI Recommendations Toggle */}
              {!isCreating && bookId && (
                <Button
                  variant={showAISidebar ? "default" : "outline"}
                  onClick={() => setShowAISidebar(!showAISidebar)}
                  className="flex items-center space-x-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>AI Recommendations</span>
                </Button>
              )}
            </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-0">
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
                        // Clear editor first
                        while (editor.firstChild) {
                          editor.removeChild(editor.firstChild);
                        }
                        
                        // Use cleanHTML function to safely set content
                        const cleanedContent = cleanHTML(descriptionEditorContent);
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
                    }, 50);
                  }
                }}
                className={`relative px-6 py-2 font-semibold text-base transition-all duration-200 ease-in-out ${
                  activeTab === "details"
                    ? "text-white bg-[#38b6ff] rounded-t-lg shadow-lg border-b-3 border-[#38b6ff]"
                    : "text-gray-600 hover:text-[#146eb4] hover:bg-gray-50 rounded-t-lg border-b-2 border-transparent hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Book Details
                </span>
              </button>
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
                className={`relative px-6 py-2 font-semibold text-base transition-all duration-200 ease-in-out ${
                  activeTab === "content"
                    ? "text-white bg-[#38b6ff] rounded-t-lg shadow-lg border-b-3 border-[#38b6ff]"
                    : "text-gray-600 hover:text-[#146eb4] hover:bg-gray-50 rounded-t-lg border-b-2 border-transparent hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Book Content
                </span>
              </button>
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
                className={`relative px-6 py-2 font-semibold text-base transition-all duration-200 ease-in-out ${
                  activeTab === "pricing"
                    ? "text-white bg-[#38b6ff] rounded-t-lg shadow-lg border-b-3 border-[#38b6ff]"
                    : "text-gray-600 hover:text-[#146eb4] hover:bg-gray-50 rounded-t-lg border-b-2 border-transparent hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Book Rights & Pricing
                </span>
              </button>
            </nav>
          </div>

          {/* Book Information Header - Always Visible */}
          <div className="bg-gray-50 border-l-4 border-[#38b6ff] p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {form.watch("title") || "Untitled Book"}
                  </h2>
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                    <span className="flex items-center">
                      <strong>ISBN/ASIN:</strong> 
                      <span className="ml-1">
                        {book?.isbn ? (
                          <span className="font-semibold">{book.isbn}</span>
                        ) : book?.isbnPlaceholder ? (
                          <span className="text-amber-600">{book.isbnPlaceholder}</span>
                        ) : (
                          <span className="text-gray-400">No ISBN/ASIN</span>
                        )}
                      </span>
                    </span>
                    {form.watch("language") && (
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        <span>{form.watch("language")}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {form.watch("status") || "Draft"}
              </div>
            </div>
          </div>

          {/* Paperback Details Tab */}
          {activeTab === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>Basic information about your book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Project Selection Section */}
              <div className="bg-gray-50 rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Association</h3>
                <div className="space-y-2">
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
              </div>

              {/* Basic Book Information Section */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Book Information</h3>
                <div className="space-y-6">
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
                </div>
              </div>

              {/* Series & Edition Section */}
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Series & Edition Information</h3>
                <div className="space-y-6">
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
                    <Label htmlFor="isPartOfSeries" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium text-[14px]">
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
                              const seriesResponse = await apiRequest("/api/series", { method: "GET" });
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
                      type="text"
                      placeholder="1"
                      {...form.register("editionNumber")}
                    />
                  </div>
                </div>
              </div>

              {/* Authors & Contributors Section */}
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Authors & Contributors</h3>
                <div className="space-y-6">
                  {/* Author Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium text-[16px]">Author</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Enter the primary author or contributor. Pen names are allowed. Note: before continuing, check your spelling since this field cannot be updated after publication.
                      </p>
                    </div>

                    {/* Author selection or display */}
                    {selectedAuthorId ? (
                      // Show selected author with edit/remove buttons (like Series)
                      (<div className="p-4 rounded-md border border-green-200 bg-[#f9fafb]">
                        <div className="space-y-3">
                          <Label className="font-medium text-[16px] text-gray-700">Author</Label>
                          <div className="text-lg font-medium text-gray-900">
                            {authors.find(a => a.id === selectedAuthorId)?.fullName || "Unknown Author"}
                          </div>
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const selectedAuthor = authors.find(a => a.id === selectedAuthorId);
                                if (selectedAuthor) {
                                  sessionStorage.setItem('returnToBookEdit', bookId || 'new');
                                  saveFormDataToSession();
                                  setLocation(`/authors/${selectedAuthor.id}`);
                                }
                              }}
                            >
                              Edit author details
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                >
                                  Remove from author
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove author from book</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this author from the book? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      // Mark that the author was explicitly removed to prevent auto-detection
                                      setAuthorExplicitlyRemoved(true);
                                      // Clear author selection and form fields to return to selection interface
                                      setSelectedAuthorId("");
                                      form.setValue("authorPrefix", "");
                                      form.setValue("authorFirstName", "");
                                      form.setValue("authorMiddleName", "");
                                      form.setValue("authorLastName", "");
                                      form.setValue("authorSuffix", "");
                                      // This will automatically switch back to the author selection interface
                                      // because selectedAuthorId is now empty, triggering the conditional rendering
                                    }}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove from author
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>)
                    ) : (
                      // Show author selection dropdown (when no author selected)
                      (<div className="space-y-4">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="font-medium text-[16px]">Select existing author</Label>
                            <Select 
                              value={selectedAuthorId} 
                              onValueChange={handleAuthorSelection}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Choose an author..." />
                              </SelectTrigger>
                              <SelectContent>
                                {authors.length > 0 ? (
                                  authors.map((author) => (
                                    <SelectItem key={author.id} value={author.id}>
                                      {author.fullName}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-author" disabled>
                                    No authors available - Create one first
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
                                sessionStorage.setItem('returnToBookEdit', bookId || 'new');
                                saveFormDataToSession();
                                window.location.href = '/authors/create';
                              }}
                            >
                              Create author
                            </Button>
                          </div>
                        </div>
                      </div>)
                    )}
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
                </div>
              </div>

              {/* Book Description Section */}
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Description</h3>
                <div className="space-y-4">
                  <div>
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
                    className="min-h-[200px] p-3 border border-gray-300 rounded-md resize-y overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              </div>

              {/* Publishing Rights & Content Options Section */}
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Rights</h3>
                <div className="space-y-6">
                  {/* Publishing Rights */}
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Choose the option that applies to your book. Choosing the wrong option may result in your content being blocked.
                    </p>
                    <RadioGroup 
                      value={form.watch("publishingRights") || ""} 
                      onValueChange={(value) => form.setValue("publishingRights", value as any)}
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="owned" id="owned" className="mt-1 bg-[#ffffff]" />
                        <div className="flex-1">
                          <Label htmlFor="owned" className="text-sm font-medium">I own the copyright and hold publishing rights</Label>
                          <p className="text-sm text-gray-600 mt-1">You wrote the book yourself, bought the rights from someone else, or work for the publisher that holds the rights.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="public-domain" id="public-domain" className="mt-1 bg-[#ffffff]" />
                        <div className="flex-1">
                          <Label htmlFor="public-domain" className="text-sm font-medium">This is a public domain work</Label>
                          <p className="text-sm text-gray-600 mt-1">The content is in the public domain and you have the right to publish it.</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Primary Audience Section */}
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Audience</h3>
                <div className="space-y-6">
                  {/* Sexually Explicit Content */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Sexually Explicit Images or Title</Label>
                    <p className="text-sm text-gray-600">
                      Does the book's cover or interior contain sexually explicit images, or does the book's title contain sexually explicit language?
                    </p>
                    <RadioGroup 
                      value={form.watch("hasExplicitContent") ? "yes" : "no"} 
                      onValueChange={(value) => form.setValue("hasExplicitContent", value === "yes")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="explicit-yes" className="bg-[#ffffff]" />
                        <Label htmlFor="explicit-yes" className="text-sm font-medium">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="explicit-no" className="bg-[#ffffff]" />
                        <Label htmlFor="explicit-no" className="text-sm font-medium">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Reading Age */}
                  <div className="space-y-4">
                    <Label className="font-medium text-[16px]">Reading age <span className="text-gray-500">(Optional)</span></Label>
                    <p className="text-sm text-gray-600">
                      Choose the youngest and oldest ages at which a person could enjoy this book.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="readingAgeMin" className="text-sm font-medium">Minimum</Label>
                        <Select 
                          value={form.watch("readingAgeMin") || ""} 
                          onValueChange={(value) => form.setValue("readingAgeMin", value || null)}
                          disabled={form.watch("hasExplicitContent") || false}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select one" />
                          </SelectTrigger>
                          <SelectContent>
                            {form.watch("hasExplicitContent") ? (
                              <SelectItem value="18">18+</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="0">Baby</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="7">7</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                                <SelectItem value="9">9</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="11">11</SelectItem>
                                <SelectItem value="12">12</SelectItem>
                                <SelectItem value="13">13</SelectItem>
                                <SelectItem value="14">14</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="16">16</SelectItem>
                                <SelectItem value="17">17</SelectItem>
                                <SelectItem value="18">18+</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="readingAgeMax" className="text-sm font-medium">Maximum</Label>
                        <Select 
                          value={form.watch("readingAgeMax") || ""} 
                          onValueChange={(value) => form.setValue("readingAgeMax", value || null)}
                          disabled={form.watch("hasExplicitContent") || false}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select one" />
                          </SelectTrigger>
                          <SelectContent>
                            {form.watch("hasExplicitContent") ? (
                              <SelectItem value="18">18+</SelectItem>
                            ) : (
                              <>
                                {/* Only show ages >= minimum selected age */}
                                {(() => {
                                  const minAge = form.watch("readingAgeMin");
                                  const ageOptions = [
                                    { value: "0", label: "Baby" },
                                    { value: "1", label: "1" },
                                    { value: "2", label: "2" },
                                    { value: "3", label: "3" },
                                    { value: "4", label: "4" },
                                    { value: "5", label: "5" },
                                    { value: "6", label: "6" },
                                    { value: "7", label: "7" },
                                    { value: "8", label: "8" },
                                    { value: "9", label: "9" },
                                    { value: "10", label: "10" },
                                    { value: "11", label: "11" },
                                    { value: "12", label: "12" },
                                    { value: "13", label: "13" },
                                    { value: "14", label: "14" },
                                    { value: "15", label: "15" },
                                    { value: "16", label: "16" },
                                    { value: "17", label: "17" },
                                    { value: "18", label: "18+" }
                                  ];
                                  
                                  return ageOptions
                                    .filter(option => minAge == null || parseInt(option.value) >= parseInt(minAge))
                                    .map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ));
                                })()}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketplace Settings Section */}
              <div className="bg-teal-50 rounded-lg border border-teal-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Marketplace</h3>
                <div className="space-y-2">
                  <Select 
                    value={form.watch("primaryMarketplace") || ""} 
                    onValueChange={handleMarketplaceChange}
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
              </div>

              {/* Categories Section */}
              <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-6">
                  {/* Header Text */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      Choose up to three categories that describe your book. Note: You must select your primary marketplace and audience first.
                    </p>
                  </div>

                  {/* Current Categories Display */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Your title's current categories</h4>
                    <div className="space-y-2">
                      {categories.length > 0 ? (
                        categories.map((category, index) => (
                          <div key={index} className="text-sm text-gray-700 flex items-center">
                            <span className="text-gray-500">Books › </span>
                            <span className="text-gray-700">{category}</span>
                            <button 
                              type="button"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              onClick={() => removeCategory(category)}
                            >
                              ✏
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No categories selected</p>
                      )}
                    </div>
                    
                    {/* Edit Categories Button */}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                      onClick={openCategoriesModal}
                    >
                      Edit categories
                    </Button>
                  </div>

                  {/* Book Classification Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Does your book classify as any of these types? Choose all that apply.</h4>
                    
                    {/* Low-content book */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="isLowContentBook"
                          checked={form.watch("isLowContentBook") || false}
                          onCheckedChange={(checked) => form.setValue("isLowContentBook", checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="isLowContentBook" className="text-sm font-normal">
                            Low-content book (e.g. journals, notebooks, and planners)
                          </Label>
                        </div>
                      </div>
                      
                      {/* Info Alert for Low-content */}
                      {form.watch("isLowContentBook") && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#ff9500]">
                              <span className="text-white text-xs font-bold">i</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-blue-800">
                              Low-content selection can't be changed after you've published your book.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Large-print book */}
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="isLargePrintBook"
                        checked={form.watch("isLargePrintBook") || false}
                        onCheckedChange={(checked) => form.setValue("isLargePrintBook", checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="isLargePrintBook" className="text-sm font-normal">
                          Large-print book (content is 16-point font size or greater)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keywords Section */}
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Keywords</h3>
                <div className="space-y-4">
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
              </div>

              {/* Publication Date Section */}
              <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication Date</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    The publication date tells readers when the book was originally published. If your book has not been published before, select the first option.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Radio Button 1: Same date */}
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center mt-1">
                        <input
                          type="radio"
                          id="sameDateOption"
                          name="publicationDateOption"
                          checked={!form.watch("previouslyPublished")}
                          onChange={() => {
                            form.setValue("previouslyPublished", false);
                            form.setValue("previousPublicationDate", null);
                          }}
                          className="w-4 h-4 text-[#38b6ff] border-gray-300 focus:ring-[#38b6ff]"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="sameDateOption" className="text-sm font-medium text-gray-900">
                          Publication date and release date are the same
                        </Label>
                      </div>
                    </div>

                    {/* Radio Button 2: Previously published */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center mt-1">
                          <input
                            type="radio"
                            id="previouslyPublishedOption"
                            name="publicationDateOption"
                            checked={form.watch("previouslyPublished") || false}
                            onChange={() => form.setValue("previouslyPublished", true)}
                            className="w-4 h-4 text-[#38b6ff] border-gray-300 focus:ring-[#38b6ff]"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="previouslyPublishedOption" className="text-sm font-medium text-gray-900">
                            My book was previously published
                          </Label>
                        </div>
                      </div>

                      {/* Conditional content for previously published */}
                      {form.watch("previouslyPublished") && (
                        <div className="ml-7 space-y-3 bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-700">
                            Enter the date your book was previously published. One example of why a book might have a previous publish date is if you 
                            purchased the rights for your book from another publisher. This will not affect your Amazon release date.
                          </p>
                          
                          <Input
                            type="date"
                            value={form.watch("previousPublicationDate") || ""}
                            onChange={(e) => form.setValue("previousPublicationDate", e.target.value || null)}
                            max={new Date().toISOString().split('T')[0]}
                            className="max-w-xs"
                            placeholder="MM/DD/YYYY"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Release Date Section */}
              <div className="bg-cyan-50 rounded-lg border border-cyan-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Release Date</h3>
                
                {/* Not Eligible Info Box - Only show if user selects Schedule AND book was previously published */}
                {form.watch("releaseOption") === "scheduled" && form.watch("previouslyPublished") && (
                  <div className="bg-cyan-100 border border-cyan-300 rounded-md p-4 mb-4 flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-[#38b6ff]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Not eligible</h4>
                      <p className="text-sm text-gray-700">
                        Scheduled release is not available for some titles such as previously published titles.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 mb-4">
                    Choose when to make your book available on Amazon.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Release now option */}
                    <div className="bg-white border border-gray-200 rounded-md p-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id="releaseNow"
                          name="releaseOption"
                          value="immediate"
                          checked={form.watch("releaseOption") === "immediate"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              form.setValue("releaseOption", "immediate");
                              form.setValue("scheduledReleaseDate", null);
                            }
                          }}
                          className="w-4 h-4 text-[#38b6ff] mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="releaseNow" className="font-medium text-gray-900 cursor-pointer">
                            Release my book for sale now
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            After you submit for publication, it can take up to 72 hours to go live. During this time, edits cannot be made to your book.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Schedule release option */}
                    <div className={`bg-white border border-gray-200 rounded-md p-4 ${form.watch("previouslyPublished") ? "opacity-50" : ""}`}>
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id="scheduleRelease"
                          name="releaseOption"
                          value="scheduled"
                          checked={form.watch("releaseOption") === "scheduled"}
                          disabled={!!form.watch("previouslyPublished")}
                          onChange={(e) => {
                            if (e.target.checked && !form.watch("previouslyPublished")) {
                              form.setValue("releaseOption", "scheduled");
                            }
                          }}
                          className={`w-4 h-4 mt-1 ${form.watch("previouslyPublished") ? "text-gray-400 cursor-not-allowed" : "text-[#38b6ff]"}`}
                        />
                        <div className="flex-1">
                          <Label htmlFor="scheduleRelease" className={`font-medium ${form.watch("previouslyPublished") ? "text-gray-500 cursor-not-allowed" : "text-gray-900 cursor-pointer"}`}>
                            Schedule my book's release
                          </Label>
                          
                          {form.watch("releaseOption") === "scheduled" && (
                            <div className="mt-3">
                              <Input
                                type="date"
                                value={form.watch("scheduledReleaseDate") || ""}
                                onChange={(e) => form.setValue("scheduledReleaseDate", e.target.value || null)}
                                min={new Date().toISOString().split('T')[0]}
                                disabled={!!form.watch("previouslyPublished")}
                                className={`max-w-xs ${form.watch("previouslyPublished") ? "opacity-50 cursor-not-allowed" : ""}`}
                                placeholder="Select release date"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {form.watch("previouslyPublished") 
                                  ? "Scheduled release not available for previously published titles"
                                  : "Release date must be today or later"
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>
          )}

          {/* Paperback Content Tab */}
          {activeTab === "content" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload your manuscript and configure content settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* ISBN Section */}
              <div className="bg-teal-50 rounded-lg border border-teal-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ISBN/ASIN</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {book?.isbn 
                      ? "Your book has an official ISBN/ASIN assigned. This ISBN/ASIN is now being used for all system functionality."
                      : "You can get a free KDP ISBN/ASIN or use your own. KDP Generator automatically creates a \"placeholder\" ISBN/ASIN for your book because it is necessary for the site to function properly until you replace it with a \"real\" one. Certain features (automatic import of your books, advertising management, income calculations, etc.) will only work fully automatically once you have replaced the placeholder ISBN/ASIN with your book's real ISBN/ASIN."
                    }
                  </p>
                  {book?.isbn ? (
                    // Show only Official ISBN field in read-only mode when applied
                    (<div className="space-y-2">
                      <Label htmlFor="officialIsbnContentApplied" className="text-sm font-medium">Official ISBN/ASIN</Label>
                      <Input
                        id="officialIsbnContentApplied"
                        value={book.isbn}
                        disabled
                        className="bg-green-50 border-green-200 text-green-800 font-medium"
                      />
                      <p className="text-sm text-green-600">
                        ✓ Official ISBN/ASIN applied successfully. This ISBN/ASIN is now active for your book.
                      </p>
                    </div>)
                  ) : (
                    // Show both fields when no official ISBN is applied
                    (<div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="isbnPlaceholderContent" className="text-sm font-medium">ISBN/ASIN Placeholder</Label>
                        <Input
                          id="isbnPlaceholderContent"
                          placeholder="PlaceHolder ISBN/ASIN will be auto-generated"
                          value={book?.isbnPlaceholder || ""}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-sm text-gray-500">
                          This unique placeholder ISBN/ASIN is automatically generated for system functionality
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="officialIsbnContent" className="text-sm font-medium">Official ISBN/ASIN</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              id="officialIsbnContent"
                              placeholder="Enter your own ISBN/ASIN if you have one"
                              value={officialIsbnContentValue}
                              onChange={(e) => {
                                setOfficialIsbnContentValue(e.target.value);
                                // Clear any existing error when user starts typing
                                if (isbnValidationError) {
                                  setIsbnValidationError("");
                                }
                              }}
                              className={`${isbnValidationError ? 'border-red-500 focus:border-red-500' : ''}`}
                            />
                            {isCheckingIsbn && (
                              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                                <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full"></span>
                                Checking ISBN/ASIN availability...
                              </p>
                            )}
                            {isbnValidationError && (
                              <p className="text-sm text-red-600 mt-1">{isbnValidationError}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => setShowIsbnContentApplyDialog(true)}
                            className="bg-[#ef4444] hover:bg-red-600 text-white flex-shrink-0"
                            disabled={!officialIsbnContentValue?.trim() || !!isbnValidationError || isCheckingIsbn}
                          >
                            Apply
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500">Enter your own ISBN/ASIN number if you have purchased one or get one from Amazon</p>
                      </div>
                    </div>)
                  )}
                </div>
              </div>

              {/* Print Options Section */}
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Print Options</h3>
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Choose how you'd like to print your book. We've pre-selected the most common settings to get you started. <a href="#" className="text-blue-600 underline">How will printing cost be calculated?</a>
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Settings */}
                    <div className="space-y-6">
                      {/* Ink and Paper Type */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Ink and Paper Type</h4>
                        <p className="text-sm text-gray-600">
                          Pick which ink and paper type you'd like to print your manuscript with. <a href="#" className="text-blue-600 underline">↗</a>
                        </p>
                        <div className="space-y-2">
                          <button className="w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Black & white interior<br />
                            <span className="text-gray-500">with cream paper</span>
                          </button>
                          <button className="w-full p-3 text-left border-2 border-teal-500 bg-teal-50 rounded-md text-sm font-medium">
                            Black & white interior<br />
                            <span className="text-gray-700">with white paper</span>
                          </button>
                          <button className="w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Standard color interior<br />
                            <span className="text-gray-500">with white paper</span>
                          </button>
                          <button className="w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Premium color interior<br />
                            <span className="text-gray-500">with white paper</span>
                          </button>
                        </div>
                      </div>

                      {/* Trim Size */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Trim Size</h4>
                        <p className="text-sm text-gray-600">
                          Select the height and width you want your book to be.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="p-3 text-left border-2 border-teal-500 bg-teal-50 rounded-md text-sm font-medium">
                            6 x 9 in<br />
                            <span className="text-gray-700">15.24 x 22.86 cm</span>
                          </button>
                          <button 
                            className="p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            onClick={() => setTrimSizeModalOpen(true)}
                          >
                            Select a different size
                          </button>
                        </div>
                      </div>

                      {/* Bleed Settings */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Bleed Settings</h4>
                        <p className="text-sm text-gray-600">
                          Choose "Bleed" if you have images or illustrations extending to the page's edge in your manuscript. Otherwise, use "No Bleed." <a href="#" className="text-blue-600 underline">↗</a>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="p-3 text-center border-2 border-teal-500 bg-teal-50 rounded-md text-sm font-medium">
                            No Bleed
                          </button>
                          <button className="p-3 text-center border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Bleed (PDF only)
                          </button>
                        </div>
                      </div>

                      {/* Paperback cover finish */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Paperback cover finish</h4>
                        <p className="text-sm text-gray-600">
                          Choose how you'd like to laminate your book cover. <a href="#" className="text-blue-600 underline">↗</a>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="p-3 text-center border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Matte
                          </button>
                          <button className="p-3 text-center border-2 border-teal-500 bg-teal-50 rounded-md text-sm font-medium">
                            Glossy
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="flex flex-col items-center justify-start space-y-4">
                      <div className="w-48 h-64 bg-white border-2 border-gray-300 rounded-lg shadow-lg flex items-center justify-center relative">
                        <div className="w-40 h-56 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                          <div className="text-center">
                            <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>CHAPTER 1.</div>
                              <div className="text-[10px]">Down the Rabbit-Hole</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="font-medium text-sm">Black & white interior with white paper</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>• Typical for nonfiction</div>
                          <div>• Paper weight: 50-61 pound, 74-90 grams per square meter</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manuscript Upload Section */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Manuscript</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload your book interior. Please review our <a href="#" className="text-blue-600 underline">content guidelines</a> and <a href="#" className="text-blue-600 underline">quality standards</a> to help ensure 
                    your submission process goes smoothly. The file must be a single PDF.
                  </p>
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Upload a PDF file</p>
                    <Button variant="outline" size="sm">
                      Upload a different file
                    </Button>
                  </div>
                </div>
              </div>

              {/* Launch Preview Section */}
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Launch Preview</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Preview and approve your book before publishing.
                  </p>
                  <div className="bg-blue-100 border border-blue-200 rounded-md p-4 flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800">
                        <strong>Download</strong> the Zine & Maker erez Google Analytics or G2 pdf* uploaded
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Cover Section */}
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Cover</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Create a cover using Cover Creator or upload a PDF cover. Cover Creator is the easy option, 
                    which takes care of technical requirements and creates cover files for you.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="coverCreator"
                        name="coverOption"
                        defaultChecked
                        className="w-4 h-4 text-[#38b6ff] border-gray-300 focus:ring-[#38b6ff]"
                      />
                      <Label htmlFor="coverCreator" className="text-sm font-medium">Upload a cover you already have (PDF only)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="uploadCover"
                        name="coverOption"
                        className="w-4 h-4 text-[#38b6ff] border-gray-300 focus:ring-[#38b6ff]"
                      />
                      <Label htmlFor="uploadCover" className="text-sm font-medium">Cover Creator (recommended)</Label>
                    </div>
                  </div>
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Upload a PDF file</p>
                    <Button variant="outline" size="sm">
                      Cover uploaded successfully!
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI-Generated Content Section */}
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Content</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Guidance for AI-based content: We prohibit content that violates our content policies. However, we allow books that 
                    have been authored or co-authored by humans and include or incorporate AI-generated text, imagery, and/or translations if you abide by our guidelines.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="aiContentYes"
                        name="aiContent"
                        className="w-4 h-4 text-[#38b6ff] border-gray-300 focus:ring-[#38b6ff]"
                      />
                      <Label htmlFor="aiContentYes" className="text-sm font-medium">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="aiContentNo"
                        name="aiContent"
                        defaultChecked
                        className="w-4 h-4 text-[#38b6ff] border-gray-300 focus:ring-[#38b6ff]"
                      />
                      <Label htmlFor="aiContentNo" className="text-sm font-medium">No</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md text-sm"
                      rows={3}
                      placeholder="Provide details about the AI-generated content in your book..."
                    />
                  </div>
                </div>
              </div>

              {/* Book Preview Section */}
              <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Preview</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Preview your book to see how it will look when published.
                  </p>
                  <Button 
                    variant="outline" 
                    className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                  >
                    Launch Previewer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Paperback Rights & Pricing Tab */}
          {activeTab === "pricing" && (
          <Card>
            <CardHeader>
              <CardTitle>Set your pricing and distribution preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Distribution Rights Section */}
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Territories</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select the territories where you have rights to sell this book.
                  </p>
                  <RadioGroup defaultValue="worldwide">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="worldwide" id="worldwide" className="bg-[#ffffff]" />
                      <Label htmlFor="worldwide" className="text-sm font-medium">All territories (worldwide rights)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" className="bg-[#ffffff]" />
                      <Label htmlFor="individual" className="text-sm font-medium">Individual territories</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Primary Marketplace Section */}
              <div className="bg-teal-50 rounded-lg border border-teal-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Marketplace</h3>
                <div className="space-y-2">
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
              </div>

              {/* Pricing Section */}
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing, Royalties, and Distribution</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="listPriceTemp" className="text-sm font-medium">List Price (USD)</Label>
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
                      <Label htmlFor="printCostTemp" className="text-sm font-medium">Print Cost</Label>
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
                      <Label htmlFor="royaltyRateTemp" className="text-sm font-medium">Royalty Rate</Label>
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
              </div>

              

              {/* Terms & Conditions Section */}
              <div className="bg-pink-50 rounded-lg border border-pink-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="acceptTerms" />
                    <Label htmlFor="acceptTerms" className="text-sm font-medium">
                      I confirm that I agree to and am in compliance with the KDP Terms and Conditions
                    </Label>
                  </div>
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
                  className="bg-[#ff9500] hover:bg-orange-700"
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
                  className="bg-[#ff9500] hover:bg-orange-700"
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
        </div>
        
        {/* AI Recommendations Sidebar */}
        {!isCreating && bookId && (
          <ContentRecommendationSidebar
            bookId={bookId}
            isVisible={showAISidebar}
            onToggle={() => setShowAISidebar(!showAISidebar)}
          />
        )}
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
      {/* Categories Edit Modal */}
      <Dialog open={showCategoriesModal} onOpenChange={setShowCategoriesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">Categories</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 pr-2 min-h-0">
            <div className="space-y-6">
              {/* Header Text */}
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Select categories and subcategories in the drop-down menus below to find up to 3 category placements that most accurately describe your book's subject matter. Your book will appear in these locations in the Amazon Store.
                </p>
              </div>

              {/* Loading State */}
              {loadingCategories && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading categories...</span>
                </div>
              )}



              {/* Debug Information */}
              {!loadingCategories && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <div className="font-medium text-yellow-800 mb-2">Debug Info:</div>
                  <div className="text-yellow-700">
                    <div>Marketplace categories: {marketplaceCategories.length}</div>
                    <div>Selected categories: {selectedCategories.length}</div>
                    <div>Temp UI selections: {tempUISelections.length}</div>
                    <div>Current marketplace: {form.watch("primaryMarketplace")}</div>
                    {marketplaceCategories.length > 0 && (
                      <div className="mt-2">
                        <div>Sample category: {JSON.stringify(marketplaceCategories[0], null, 2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Category Selection Interface */}
              {!loadingCategories && marketplaceCategories.length > 0 && (
                <div className="space-y-4">
                  {/* Multiple Category Selectors */}
                  {Array.from({ length: Math.max(1, tempUISelections.length + (tempUISelections.length < 3 ? 1 : 0)) }, (_, index) => (
                    <div key={index} className="border border-gray-200 rounded">
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => setExpandedCategory(expandedCategory === `selector-${index}` ? null : `selector-${index}`)}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 flex items-center justify-center">
                            {expandedCategory === `selector-${index}` ? '▼' : '▶'}
                          </div>
                          <span className="font-medium">
                            Category {index + 1} 
                            {tempUISelections[index] && ` - ${tempUISelections[index].split(' › ').pop()}`}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {tempUISelections[index] && (
                            <>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-gray-600 hover:text-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Reset the category selector for this index
                                  setResetTriggers(prev => ({
                                    ...prev,
                                    [index]: (prev[index] || 0) + 1
                                  }));
                                  // Remove the category from temp UI selections
                                  const newCategories = tempUISelections.filter((_, i) => i !== index);
                                  setTempUISelections(newCategories);
                                  // Open the section to show the reset interface
                                  setExpandedCategory(`selector-${index}`);
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-red-600 hover:text-red-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newCategories = tempUISelections.filter((_, i) => i !== index);
                                  setTempUISelections(newCategories);
                                }}
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {expandedCategory === `selector-${index}` && (
                        <div className="p-4 border-t border-gray-200">
                          <CategorySelector 
                            marketplaceCategories={marketplaceCategories}
                            selectedCategories={selectedCategories}
                            tempUISelections={tempUISelections}
                            setTempUISelections={setTempUISelections}
                            resetTrigger={resetTriggers[index]}
                            instanceId={`category-${index}`}
                            onCategorySelect={(categoryPath) => {
                              if (!tempUISelections.includes(categoryPath)) {
                                const newCategories = [...tempUISelections];
                                newCategories[index] = categoryPath;
                                setTempUISelections(newCategories.filter(Boolean));
                              }
                            }}
                            onCategoryRemove={removeCategoryFromModal}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  
                </div>
              )}

              {/* No Categories Available Message */}
              {!loadingCategories && marketplaceCategories.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No categories available for the selected marketplace.</p>
                  <p className="text-sm text-gray-500 mt-2">Try selecting a different Primary Marketplace.</p>

                </div>
              )}

              {/* Selected Categories Summary */}
              <div className="space-y-4 bg-gray-50 rounded p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {tempUISelections.length} out of 3 category placements selected
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {tempUISelections.map((categoryPath, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{categoryPath}</span>
                      <button 
                        type="button"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setTempUISelections(tempUISelections.filter(c => c !== categoryPath));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-between items-center border-t pt-4 flex-shrink-0 bg-white">
            <Button 
              variant="outline" 
              onClick={cancelCategoriesChanges}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveCategoriesChanges}
              className="bg-[#ff9500] hover:bg-yellow-600 text-black"
            >
              Save categories
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Marketplace Conflict Dialog */}
      <AlertDialog open={showMarketplaceConflictDialog} onOpenChange={setShowMarketplaceConflictDialog}>
        <AlertDialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Marketplace Change Warning
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p className="text-gray-700">
                  The new marketplace <strong className="text-gray-900">{pendingMarketplace}</strong> is incompatible with some of your selected categories.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-red-800 mb-2">Incompatible categories:</p>
                  <ul className="space-y-1 text-red-700">
                    {incompatibleCategories.map((category, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2 mt-0.5">•</span>
                        <span className="break-words">{category}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <p className="text-gray-700">
                  You can proceed with the marketplace change, but the incompatible categories will be removed, 
                  or cancel to keep your current categories and marketplace.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-center sm:justify-center">
            <AlertDialogCancel 
              onClick={cancelMarketplaceChange}
              className="w-full sm:w-auto"
            >
              Cancel - Keep current marketplace
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={proceedWithMarketplaceChange}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              Change marketplace and remove categories
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Trim Size Modal */}
      <Dialog open={trimSizeModalOpen} onOpenChange={setTrimSizeModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>Trim Size</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Most Popular Standard Trim Sizes */}
            <div>
              <h3 className="font-semibold text-base mb-3">Most Popular Standard Trim Sizes:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trimSizes.mostPopular.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedTrimSize(size.id)}
                    className={`p-3 text-center border rounded-md text-sm transition-colors ${
                      selectedTrimSize === size.id
                        ? 'border-2 border-teal-500 bg-teal-50 font-medium'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{size.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{size.metric}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* More Standard Trim Sizes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-base">More Standard Trim Sizes:</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trimSizes.moreStandard.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedTrimSize(size.id)}
                    className={`p-3 text-center border rounded-md text-sm transition-colors ${
                      selectedTrimSize === size.id
                        ? 'border-2 border-teal-500 bg-teal-50 font-medium'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{size.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{size.metric}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Non Standard Trim Sizes */}
            <div>
              <h3 className="font-semibold text-base mb-2">Non Standard Trim Sizes:</h3>
              <p className="text-sm text-gray-600 mb-3">
                These sizes have limited distribution options.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trimSizes.nonStandard.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedTrimSize(size.id)}
                    className={`p-3 text-center border rounded-md text-sm transition-colors ${
                      selectedTrimSize === size.id
                        ? 'border-2 border-teal-500 bg-teal-50 font-medium'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{size.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{size.metric}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Self Define Trim Size */}
            <div>
              <h3 className="font-semibold text-base mb-2">Self Define Trim Size:</h3>
              <p className="text-sm text-gray-600 mb-3">Set up your book with your own trim size.</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="customWidth" className="text-sm">Width:</Label>
                  <Input
                    id="customWidth"
                    type="text"
                    placeholder="Width"
                    className="w-20 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="customHeight" className="text-sm">Height:</Label>
                  <Input
                    id="customHeight"
                    type="text"
                    placeholder="Height"
                    className="w-20 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="in">
                    <SelectTrigger className="w-16 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                  Select
                </Button>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setTrimSizeModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Here you would update the trim size in the form
                setTrimSizeModalOpen(false);
              }}
              className="bg-[#ff9500] hover:bg-orange-700 text-white"
            >
              Select Size
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ISBN Apply Confirmation Dialog */}
      <AlertDialog open={showIsbnContentApplyDialog} onOpenChange={setShowIsbnContentApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Official ISBN/ASIN</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply this Official ISBN/ASIN? This action is irreversible and the ISBN/ASIN cannot be changed once applied to this book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelIsbnApply}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplyIsbn}
              className="bg-[#ef4444] hover:bg-red-600 text-white"
            >
              Apply ISBN/ASIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}