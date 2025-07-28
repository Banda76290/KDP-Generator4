import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, X, Zap, BookOpen, Bot, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "forever",
    description: "Perfect for getting started with basic features",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Manual KDP report upload",
      "Community support"
    ],
    limitations: [
      "No AI content generation",
      "Limited export options",
      "Basic reporting only"
    ],
    current: true,
    buttonText: "Current Plan",
    buttonVariant: "secondary" as const
  },
  {
    name: "Pro",
    price: "19€",
    period: "month",
    description: "Everything you need to scale your publishing business",
    features: [
      "Unlimited projects",
      "Advanced analytics & insights",
      "AI content generation",
      "Automated KDP parsing",
      "Priority support",
      "Advanced export options",
      "Revenue forecasting"
    ],
    limitations: [],
    current: false,
    buttonText: "Upgrade to Pro",
    buttonVariant: "default" as const,
    popular: true
  },
  {
    name: "Enterprise",
    price: "49€",
    period: "month",
    description: "For serious authors and publishing teams",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "Custom reporting",
      "API access"
    ],
    limitations: [],
    current: false,
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const
  }
];

export default function Subscription() {
  const { user } = useAuth();

  const handleUpgrade = (planName: string) => {
    if (planName === "Pro") {
      // Redirect to Stripe checkout
      window.location.href = "/api/create-subscription";
    } else if (planName === "Enterprise") {
      // Handle contact form or redirect
      window.open("mailto:support@kdpgenerator.com?subject=Enterprise Plan Inquiry", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Choose Your Publishing Plan
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Unlock powerful features to grow your publishing business. Start free and upgrade as you scale.
              </p>
            </div>

            {/* Current Usage */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  You are currently on the <strong>Free Plan</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">3</div>
                    <div className="text-sm text-muted-foreground">Projects Created</div>
                    <div className="text-xs text-muted-foreground">Limit: 3</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">0</div>
                    <div className="text-sm text-muted-foreground">AI Generations Used</div>
                    <div className="text-xs text-muted-foreground">Upgrade for unlimited</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">5</div>
                    <div className="text-sm text-muted-foreground">Reports Analyzed</div>
                    <div className="text-xs text-muted-foreground">Unlimited</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${plan.current ? 'border-secondary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  {plan.current && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-secondary text-secondary-foreground">
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price}
                      {plan.period !== "forever" && (
                        <span className="text-sm text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {plan.limitations.map((limitation) => (
                        <div key={limitation} className="flex items-center gap-2">
                          <X className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant={plan.buttonVariant}
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={plan.current}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Comparison</CardTitle>
                <CardDescription>
                  Compare all features across our plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Feature</th>
                        <th className="text-center py-2">Free</th>
                        <th className="text-center py-2">Pro</th>
                        <th className="text-center py-2">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Project Management
                        </td>
                        <td className="text-center py-2">3 projects</td>
                        <td className="text-center py-2">Unlimited</td>
                        <td className="text-center py-2">Unlimited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          AI Content Generation
                        </td>
                        <td className="text-center py-2"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                        <td className="text-center py-2"><Check className="h-4 w-4 text-success mx-auto" /></td>
                        <td className="text-center py-2"><Check className="h-4 w-4 text-success mx-auto" /></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Advanced Analytics
                        </td>
                        <td className="text-center py-2">Basic</td>
                        <td className="text-center py-2">Advanced</td>
                        <td className="text-center py-2">Custom</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Priority Support
                        </td>
                        <td className="text-center py-2">Community</td>
                        <td className="text-center py-2"><Check className="h-4 w-4 text-success mx-auto" /></td>
                        <td className="text-center py-2">Dedicated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}