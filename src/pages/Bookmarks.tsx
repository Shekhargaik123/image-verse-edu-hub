import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EducationalImage } from '@/types/database';
import { Download, BookmarkCheck, Eye, Trash2, Share2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import CADViewer from '@/components/CADViewer';

export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [bookmarkedImages, setBookmarkedImages] = useState<EducationalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<EducationalImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);

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
      setSelectedBookmarks(selectedBookmarks.filter(id => id !== imageId));
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

      // Fetch the original file as a blob
      const response = await fetch(image.image_url, { mode: 'cors' });
      const blob = await response.blob();

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get the original file extension from the URL
      const originalExtension = image.image_url.split('.').pop()?.toLowerCase();
      
      // Map of supported CAD formats
      const cadFormats = {
        'stp': 'stp',
        'step': 'step',
        'stl': 'stl',
        'catpart': 'CATPart',
        'sldprt': 'SLDPRT',
        'prt': 'PRT',
        'dwg': 'DWG',
        'obj': 'OBJ'
      };

      // Use the original extension if it's a CAD format, otherwise use the type to determine extension
      const fileExtension = cadFormats[originalExtension] || 
        (image.type.toLowerCase() === 'diagrams' ? 'step' : originalExtension);
      
      link.download = `${image.title}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Download started" });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const shareImage = async (image) => {
    const url = image.image_url;
    const title = image.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        toast({ title: 'Link shared!' });
      } catch (e) {
        toast({ title: 'Share cancelled', variant: 'destructive' });
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    } else {
      toast({ title: 'Clipboard not supported', variant: 'destructive' });
    }
  };

  const openPreview = (image: EducationalImage) => {
    setSelectedImage(image);
    setShowPreview(true);
    console.log('Opening preview for:', image);
  };

  const toggleSelectBookmark = (imageId: string) => {
    setSelectedBookmarks(prevSelected =>
      prevSelected.includes(imageId)
        ? prevSelected.filter(id => id !== imageId)
        : [...prevSelected, imageId]
    );
  };

  const deleteAllBookmarks = async () => {
    if (!user || bookmarkedImages.length === 0) return;

    if (window.confirm(`Are you sure you want to delete all ${bookmarkedImages.length} bookmarks? This action cannot be undone.`)) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        setBookmarkedImages([]);
        setSelectedBookmarks([]);
        toast({ title: "All bookmarks removed" });
      } catch (error) {
        toast({
          title: "Error removing all bookmarks",
          description: "Please try again",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteSelectedBookmarks = async () => {
    if (selectedBookmarks.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedBookmarks.length} selected bookmarks? This action cannot be undone.`)) {
      setLoading(true);
      try {
        // Supabase supports deleting multiple rows with 'in'
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .in('image_id', selectedBookmarks);

        if (error) throw error;

        // Update the local state to remove the deleted items
        setBookmarkedImages(bookmarkedImages.filter(img => !selectedBookmarks.includes(img.id)));
        setSelectedBookmarks([]);
        toast({ title: `${selectedBookmarks.length} bookmarks removed` });
      } catch (error) {
        toast({
          title: "Error removing selected bookmarks",
          description: "Please try again",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
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
              <Card key={image.id} className="hover:shadow-lg transition-shadow border rounded-lg overflow-hidden shadow-sm">
                <CardContent className="p-4">
                  <div className="aspect-square mb-3 relative group cursor-pointer"
                       onClick={() => openPreview(image)}>
                    {/* Thumbnail preview - show image or file icon */}
                    {image.preview_image_url ? (
                      <img
                        src={image.preview_image_url}
                        alt={`Preview of ${image.title}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : image.image_url.match(/\.(jpeg|jpg|png|gif|svg|webp)$/i) ? (
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-200 text-gray-600 rounded-lg">
                         <FileText className="w-12 h-12 mb-2" />
                         <p className="text-sm font-semibold text-center px-2 line-clamp-1">{image.title}</p>
                         <p className="text-xs text-gray-500 mt-1">{image.type || 'File'}</p>
                      </div>
                    )}
                    
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
                        onClick={(e) => { e.stopPropagation(); removeBookmark(image.id); }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); downloadImage(image); }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); shareImage(image); }}
                        className="ml-2"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Checkbox for selection */}
                  <input
                    type="checkbox"
                    checked={selectedBookmarks.includes(image.id)}
                    onChange={() => toggleSelectBookmark(image.id)}
                    className="absolute top-2 left-2 z-10 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when clicking checkbox
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add buttons for delete selected and delete all above the grid */}
        <div className="mb-4 flex justify-end gap-2">
          {selectedBookmarks.length > 0 && (
            <Button variant="destructive" onClick={deleteSelectedBookmarks} disabled={loading}>
              Delete Selected ({selectedBookmarks.length})
            </Button>
          )}
          {bookmarkedImages.length > 0 && (
             <Button variant="outline" onClick={deleteAllBookmarks} disabled={loading}>
               Delete All
             </Button>
          )}
        </div>

        {/* Image Preview Dialog */}
        <Drawer open={showPreview} onOpenChange={setShowPreview} direction="right">
          <DrawerContent className="w-[600px] p-6 flex flex-col max-h-[95vh]">
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>{selectedImage?.title}</DrawerTitle>
            </DrawerHeader>
            
            {selectedImage && (
              <div className="space-y-4 overflow-y-auto flex-grow">
                {/* File Preview */}
                <div className="flex-1 min-h-0 bg-gray-100 rounded-lg overflow-hidden flex justify-center items-center mb-6 relative">
                  {selectedImage.preview_image_url ? (
                    <img
                      src={selectedImage.preview_image_url}
                      alt={`Preview of ${selectedImage.title}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : selectedImage.type === '3D Model' && (selectedImage.image_url.toLowerCase().endsWith('.stl') || selectedImage.image_url.toLowerCase().endsWith('.glb')) ? (
                    // Render CADViewer for STL/GLB files
                    <CADViewer modelPath={selectedImage.image_url} width="100%" height="100%" />
                  ) : selectedImage.image_url.match(/\.(jpeg|jpg|png|gif|svg|webp)$/i) ? (
                    <img
                      src={selectedImage.image_url}
                      alt={selectedImage.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : ( // Handle other CAD files
                    <div className="flex flex-col items-center justify-center text-gray-600 w-full h-full">
                      <FileText className="w-16 h-16 mb-4" />
                      <p className="text-lg font-semibold mb-2">CAD File Preview</p>
                      <p className="text-sm text-gray-500 text-center mb-4">
                        This CAD file format cannot be previewed directly. Please download the file to view it in your CAD software.
                      </p>
                      <Button
                        onClick={() => downloadImage(selectedImage)}
                        className="mt-4"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download CAD File
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-4 pb-4 border-b">
                  <div>
                    <p><strong className="text-gray-700">Subject:</strong> {selectedImage.subject}</p>
                    <p><strong className="text-gray-700">Type:</strong> {selectedImage.type}</p>
                    <p><strong className="text-gray-700">Semester:</strong> {selectedImage.semester}</p>
                  </div>
                  <div className="text-right">
                    <p><strong className="text-gray-700">Downloads:</strong> {selectedImage.download_count}</p>
                    <p><strong className="text-gray-700">Uploaded:</strong> {new Date(selectedImage.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedImage.description && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-gray-700 mb-2"><strong>Description:</strong></p>
                    <p className="text-gray-600 text-sm leading-relaxed">{selectedImage.description}</p>
                  </div>
                )}

                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-gray-700 mb-2"><strong>Tags:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedImage.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedImage && (
              <div className="flex justify-end space-x-2 mt-4 flex-shrink-0">
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
                <Button variant="outline" onClick={() => shareImage(selectedImage)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
