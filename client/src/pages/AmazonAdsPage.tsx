import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Eye, 
  MousePointer, 
  ShoppingCart,
  Target,
  Play,
  Pause,
  Archive,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Types
interface AmazonAdsCampaign {
  id: string;
  campaignId?: string;
  name: string;
  campaignType: "sponsored_products" | "sponsored_brands" | "sponsored_display";
  targetingType: "auto" | "manual";
  status: "enabled" | "paused" | "archived";
  bidStrategy: "legacy_for_sales" | "auto_for_sales" | "manual";
  defaultBid?: string;
  budget?: string;
  budgetType: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface AmazonAdsKeyword {
  id: string;
  campaignId: string;
  keywordId?: string;
  keywordText: string;
  matchType: "exact" | "phrase" | "broad";
  status: "enabled" | "paused" | "archived";
  bid?: string;
  createdAt: string;
}

interface AmazonAdsPerformance {
  id: string;
  campaignId: string;
  reportDate: string;
  impressions: number;
  clicks: number;
  spend: string;
  sales: string;
  orders: number;
  units: number;
  conversionRate: string;
  acos: string;
  roas: string;
  ctr: string;
  cpc: string;
}

// Form schemas
const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  campaignType: z.enum(["sponsored_products", "sponsored_brands", "sponsored_display"]),
  targetingType: z.enum(["auto", "manual"]).default("auto"),
  bidStrategy: z.enum(["legacy_for_sales", "auto_for_sales", "manual"]).default("legacy_for_sales"),
  defaultBid: z.string().optional(),
  budget: z.string().min(1, "Budget is required"),
  budgetType: z.enum(["daily", "lifetime"]).default("daily"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const keywordFormSchema = z.object({
  keywordText: z.string().min(1, "Keyword is required"),
  matchType: z.enum(["exact", "phrase", "broad"]),
  bid: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;
type KeywordFormValues = z.infer<typeof keywordFormSchema>;

const campaignTypeLabels = {
  sponsored_products: "Sponsored Products",
  sponsored_brands: "Sponsored Brands", 
  sponsored_display: "Sponsored Display"
};

const statusLabels = {
  enabled: "Active",
  paused: "Paused",
  archived: "Archived"
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "enabled": return "bg-green-100 text-green-800";
    case "paused": return "bg-yellow-100 text-yellow-800";
    case "archived": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function AmazonAdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<AmazonAdsCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isNewKeywordOpen, setIsNewKeywordOpen] = useState(false);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<AmazonAdsCampaign[]>({
    queryKey: ["/api/amazon-ads/campaigns"],
  });

  // Fetch keywords for selected campaign
  const { data: keywords = [] } = useQuery<AmazonAdsKeyword[]>({
    queryKey: ["/api/amazon-ads/campaigns", selectedCampaign?.id, "keywords"],
    enabled: !!selectedCampaign,
  });

  // Fetch performance data for selected campaign
  const { data: performance = [] } = useQuery<AmazonAdsPerformance[]>({
    queryKey: ["/api/amazon-ads/campaigns", selectedCampaign?.id, "performance"],
    enabled: !!selectedCampaign,
  });

  // Campaign form
  const campaignForm = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      campaignType: "sponsored_products",
      targetingType: "auto",
      bidStrategy: "legacy_for_sales",
      budgetType: "daily",
    },
  });

  // Keyword form
  const keywordForm = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordFormSchema),
    defaultValues: {
      matchType: "broad",
    },
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: CampaignFormValues) => apiRequest("/api/amazon-ads/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amazon-ads/campaigns"] });
      setIsNewCampaignOpen(false);
      campaignForm.reset();
      toast({
        title: "Success",
        description: "Campaign created successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  // Create keyword mutation
  const createKeywordMutation = useMutation({
    mutationFn: (data: KeywordFormValues & { campaignId: string }) => 
      apiRequest(`/api/amazon-ads/campaigns/${data.campaignId}/keywords`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/amazon-ads/campaigns", selectedCampaign?.id, "keywords"] 
      });
      setIsNewKeywordOpen(false);
      keywordForm.reset();
      toast({
        title: "Success",
        description: "Keyword added successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to add keyword",
        variant: "destructive",
      });
    },
  });

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: ({ campaignId, status }: { campaignId: string; status: string }) =>
      apiRequest(`/api/amazon-ads/campaigns/${campaignId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amazon-ads/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign status updated",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign status",
        variant: "destructive",
      });
    },
  });

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCampaignSubmit = (data: CampaignFormValues) => {
    createCampaignMutation.mutate(data);
  };

  const handleKeywordSubmit = (data: KeywordFormValues) => {
    if (!selectedCampaign) return;
    createKeywordMutation.mutate({ ...data, campaignId: selectedCampaign.id });
  };

  const handleStatusChange = (campaign: AmazonAdsCampaign, newStatus: string) => {
    updateCampaignStatusMutation.mutate({
      campaignId: campaign.id,
      status: newStatus,
    });
  };

  // Calculate totals for performance metrics
  const performanceTotals = performance.reduce((acc, perf) => ({
    impressions: acc.impressions + perf.impressions,
    clicks: acc.clicks + perf.clicks,
    spend: acc.spend + parseFloat(perf.spend || "0"),
    sales: acc.sales + parseFloat(perf.sales || "0"),
    orders: acc.orders + perf.orders,
    units: acc.units + perf.units,
  }), { impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0, units: 0 });

  const avgCtr = performanceTotals.impressions > 0 ? (performanceTotals.clicks / performanceTotals.impressions * 100) : 0;
  const avgAcos = performanceTotals.sales > 0 ? (performanceTotals.spend / performanceTotals.sales * 100) : 0;
  const avgRoas = performanceTotals.spend > 0 ? (performanceTotals.sales / performanceTotals.spend) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Amazon Ads</h1>
          <p className="text-gray-600 mt-1">Manage your Amazon advertising campaigns</p>
        </div>
        <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create a new Amazon advertising campaign
              </DialogDescription>
            </DialogHeader>
            <Form {...campaignForm}>
              <form onSubmit={campaignForm.handleSubmit(handleCampaignSubmit)} className="space-y-4">
                <FormField
                  control={campaignForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={campaignForm.control}
                  name="campaignType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sponsored_products">Sponsored Products</SelectItem>
                          <SelectItem value="sponsored_brands">Sponsored Brands</SelectItem>
                          <SelectItem value="sponsored_display">Sponsored Display</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={campaignForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={campaignForm.control}
                    name="budgetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="lifetime">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={campaignForm.control}
                  name="targetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Targeting Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createCampaignMutation.isPending}>
                    {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaignsLoading ? (
                <div className="col-span-full text-center py-8">Loading campaigns...</div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 mb-4">No campaigns found</p>
                  <Button onClick={() => setIsNewCampaignOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>
                            {campaignTypeLabels[campaign.campaignType]}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>
                          {statusLabels[campaign.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {campaign.budget ? `$${campaign.budget}` : "Not set"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Targeting:</span>
                          <span className="font-medium capitalize">
                            {campaign.targetingType}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {campaign.status === "enabled" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(campaign, "paused")}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        ) : campaign.status === "paused" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(campaign, "enabled")}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          {selectedCampaign ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Performance: {selectedCampaign.name}
                </h2>
                <div className="flex gap-2">
                  <Dialog open={isNewKeywordOpen} onOpenChange={setIsNewKeywordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Keyword
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Keyword</DialogTitle>
                        <DialogDescription>
                          Add a new keyword to {selectedCampaign.name}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...keywordForm}>
                        <form onSubmit={keywordForm.handleSubmit(handleKeywordSubmit)} className="space-y-4">
                          <FormField
                            control={keywordForm.control}
                            name="keywordText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Keyword</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter keyword" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={keywordForm.control}
                            name="matchType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Match Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="exact">Exact</SelectItem>
                                    <SelectItem value="phrase">Phrase</SelectItem>
                                    <SelectItem value="broad">Broad</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={keywordForm.control}
                            name="bid"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bid ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="1.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button type="submit" disabled={createKeywordMutation.isPending}>
                              {createKeywordMutation.isPending ? "Adding..." : "Add Keyword"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(performanceTotals.spend)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ACOS: {avgAcos.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(performanceTotals.sales)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ROAS: {avgRoas.toFixed(2)}x
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceTotals.impressions.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CTR: {avgCtr.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceTotals.clicks.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceTotals.orders} orders
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Keywords Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Keywords ({keywords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {keywords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No keywords found</p>
                      <Button variant="outline" onClick={() => setIsNewKeywordOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Keyword
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {keywords.map((keyword) => (
                        <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{keyword.keywordText}</div>
                            <div className="text-sm text-gray-500">
                              {keyword.matchType} match • {keyword.status}
                            </div>
                          </div>
                          {keyword.bid && (
                            <div className="text-right">
                              <div className="font-medium">${keyword.bid}</div>
                              <div className="text-sm text-gray-500">Bid</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No campaign selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a campaign from the Campaigns tab to view performance data
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Campaign Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Campaigns:</span>
                      <span className="font-medium">{campaigns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-medium text-green-600">
                        {campaigns.filter(c => c.status === "enabled").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paused:</span>
                      <span className="font-medium text-yellow-600">
                        {campaigns.filter(c => c.status === "paused").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Campaign Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sponsored Products:</span>
                      <span className="font-medium">
                        {campaigns.filter(c => c.campaignType === "sponsored_products").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sponsored Brands:</span>
                      <span className="font-medium">
                        {campaigns.filter(c => c.campaignType === "sponsored_brands").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sponsored Display:</span>
                      <span className="font-medium">
                        {campaigns.filter(c => c.campaignType === "sponsored_display").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="h-5 w-5 mr-2" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      Performance trends will appear here when you have performance data
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}