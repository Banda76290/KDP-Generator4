import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Bot, Upload, BarChart3, Zap, BookOpen } from "lucide-react";
import logoImage from "@assets/image_1753719885932.png";
import SEOHead from "@/components/SEOHead";

export default function Landing() {
  return (
    <>
      <SEOHead
        title="KDP Generator - Complete Author Publishing Management Platform"
        description="Professional tools for independent authors and publishers. Manage Amazon KDP projects, track sales analytics, generate content with AI, and optimize your publishing workflow. Start free today!"
        keywords="KDP, Kindle Direct Publishing, author tools, book publishing, self publishing, sales analytics, AI content generation, Amazon KDP dashboard, publishing management"
        canonicalUrl="https://kdpgenerator.com"
        ogType="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src={logoImage} 
              alt="KDP Generator" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            The Complete Author Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Publishing Empire with{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI-Powered Tools
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From project creation to sales analytics, KDP Generator provides everything you need 
            to succeed as an independent author. Track your Amazon KDP performance, generate content 
            with AI, and manage your entire publishing workflow in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            >
              Start Publishing Today
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-3"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional tools designed specifically for independent authors and publishers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>
                Organize your books with detailed metadata, contributors, and publication formats
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>
                Upload KDP reports and get powerful insights into your sales performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>AI Content Generation</CardTitle>
              <CardDescription>
                Generate book structures, descriptions, and marketing copy with advanced AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>KDP Report Parsing</CardTitle>
              <CardDescription>
                Automatically parse and analyze your Amazon KDP sales reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Revenue Tracking</CardTitle>
              <CardDescription>
                Monitor your publishing revenue with detailed charts and metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-error" />
              </div>
              <CardTitle>Dynamic Forms</CardTitle>
              <CardDescription>
                Smart forms that adapt based on your project type and preferences
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600">
            Start free, upgrade when you're ready to scale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="text-3xl font-bold">$0</div>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm">✓ Up to 3 projects</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ Basic analytics</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ KDP report upload</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/api/login'}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl border-primary/20 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-3xl font-bold">$29</div>
              <CardDescription>For serious authors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm">✓ Unlimited projects</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ Advanced analytics</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ AI content generation</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ Priority support</span>
                </div>
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Pro Trial
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="text-3xl font-bold">$99</div>
              <CardDescription>For publishing businesses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm">✓ Everything in Pro</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ Team collaboration</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ API access</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">✓ Custom integrations</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/api/login'}
              >
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Publishing Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of successful authors who trust KDP Generator to manage their publishing empire
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90 text-lg px-12 py-4"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">KDP Generator</span>
          </div>
          <p className="text-center text-gray-400">
            © 2024 KDP Generator. All rights reserved.
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}
