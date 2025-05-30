
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EducationalImage } from '@/types/database';
import { Download, BookmarkCheck, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [bookmarkedImages, setBookmarkedImages] = useState<EducationalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<EducationalImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          image_id,
          images (*)
        `)
        .eq('user_id', user!.id);

      if (error) throw error;
      
      const images = data?.map(bookmark => bookmark.images).filter(Boolean) || [];
      setBookmarkedImages(images as EducationalImage[]);
    } catch (error) {
      toast({
        title: "Error loading bookmarks",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user!.id)
        .eq('image_id', imageId);

      if (error) throw error;
      
      setBookmarkedImages(bookmarkedImages.filter(img => img.id !== imageId));
      toast({ title: "Bookmark removed" });
    } catch (error) {
      toast({
        title: "Error removing bookmark",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const downloadImage = async (image: EducationalImage) => {
    try {
      // Increment download count
      await supabase.rpc('increment_download_count', { image_id: image.id });
      
      // Download the image
      const link = document.createElement('a');
      link.href = image.image_url;
      link.download = `${image.title}.jpg`;
      link.click();

      toast({ title: "Download started" });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const openPreview = (image: EducationalImage) => {
    setSelectedImage(image);
    setShowPreview(true);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
          <p className="text-gray-600">Your saved CAD images and engineering resources</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading bookmarks...</div>
        ) : bookmarkedImages.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
            <p className="text-gray-600 mb-4">Start bookmarking your favorite resources from the gallery</p>
            <Button onClick={() => window.location.href = '/gallery'}>
              Browse Gallery
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bookmarkedImages.map((image) => (
              <Card key={image.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square mb-3 relative group cursor-pointer"
                       onClick={() => openPreview(image)}>
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{image.title}</h3>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary">{image.subject}</Badge>
                    <Badge variant="outline">{image.type}</Badge>
                    <Badge variant="outline">Sem {image.semester}</Badge>
                  </div>

                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {image.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {image.download_count} downloads
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBookmark(image.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => downloadImage(image)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedImage?.title}</DialogTitle>
            </DialogHeader>
            
            {selectedImage && (
              <div className="space-y-4">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Subject:</strong> {selectedImage.subject}</p>
                    <p><strong>Type:</strong> {selectedImage.type}</p>
                    <p><strong>Semester:</strong> {selectedImage.semester}</p>
                  </div>
                  <div>
                    <p><strong>Downloads:</strong> {selectedImage.download_count}</p>
                    <p><strong>Uploaded:</strong> {new Date(selectedImage.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedImage.description && (
                  <div>
                    <p><strong>Description:</strong></p>
                    <p className="text-gray-600">{selectedImage.description}</p>
                  </div>
                )}

                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div>
                    <p><strong>Tags:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedImage.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => removeBookmark(selectedImage.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Bookmark
                  </Button>
                  
                  <Button onClick={() => downloadImage(selectedImage)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
