import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function NotFound() {
  return (
    <>
      <SEOHead
        title="Page Not Found - KDP Generator"
        description="The page you're looking for doesn't exist. Return to KDP Generator to manage your publishing projects and track your book sales."
        noIndex={true}
      />
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
