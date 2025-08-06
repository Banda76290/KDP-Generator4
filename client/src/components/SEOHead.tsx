import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  keywords?: string;
  noIndex?: boolean;
}

export default function SEOHead({ 
  title, 
  description, 
  canonicalUrl,
  ogImage = '/og-default.jpg',
  ogType = 'website',
  keywords,
  noIndex = false
}: SEOHeadProps) {
  
  useEffect(() => {
    // Set title
    document.title = title;
    
    // Helper function to update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    });

    // Basic meta tags
    updateMeta('description', description);
    if (keywords) {
      updateMeta('keywords', keywords);
    }
    
    // Robots
    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow');
    }

    // Open Graph tags
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage, true);
    
    if (canonicalUrl) {
      updateMeta('og:url', canonicalUrl, true);
      
      // Canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Clean up function to remove tags when component unmounts
    return () => {
      // We don't actually remove meta tags on cleanup as they should persist
      // This prevents flashing of content when navigating between pages
    });
  }, [title, description, canonicalUrl, ogImage, ogType, keywords, noIndex]);

  return null; // This component doesn't render anything visual
}