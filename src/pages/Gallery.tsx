import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EducationalImage } from '@/types/database';
import { Search, Download, Bookmark, BookmarkCheck, Eye, Filter, Share2, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CADViewer from '@/components/CADViewer';

export default function Gallery() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  console.log("Gallery component render:", { user, isAdmin, authLoading });

  const [images, setImages] = useState<EducationalImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<EducationalImage[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState<EducationalImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    console.log("useEffect in Gallery:", { user, authLoading });
    if (user) {
      fetchImages();
      fetchBookmarks();
    }
  }, [user]);

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, subjectFilter, typeFilter, semesterFilter]);

  const fetchImages = async () => {
    console.log("fetchImages called");
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Images fetched:", data);
      setImages(data || []);
      setSelectedImages([]);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error loading images",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      console.log("fetchImages finally block reached");
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('image_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setBookmarks(data?.map(b => b.image_id) || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const filterImages = () => {
    let filtered = [...images];

    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(img => img.subject === subjectFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(img => img.type === typeFilter);
    }

    if (semesterFilter !== 'all') {
      filtered = filtered.filter(img => img.semester === parseInt(semesterFilter));
    }

    setFilteredImages(filtered);
  };

  const toggleBookmark = async (imageId: string) => {
    if (!user) return;

    const isBookmarked = bookmarks.includes(imageId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('image_id', imageId);

        if (error) throw error;
        setBookmarks(bookmarks.filter(id => id !== imageId));
        toast({ title: "Bookmark removed" });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, image_id: imageId });

        if (error) throw error;
        setBookmarks([...bookmarks, imageId]);
        toast({ title: "Bookmark added" });
      }
    } catch (error) {
      toast({
        title: "Error updating bookmark",
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
  };

  const deleteImage = async (image: EducationalImage) => {
    console.log('Delete attempt:', { user, isAdmin });

    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only administrators can delete images.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add a confirmation step for extra safety
      const isConfirmed = window.confirm(`Are you sure you want to delete "${image.title}"? This action cannot be undone.`);
      if (!isConfirmed) {
        toast({
          title: "Deletion cancelled",
          description: "The image was not deleted.",
        });
        return;
      }

      // Delete from storage
      const filePath = image.image_url.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('educational-images')
          .remove([`cad-images/${filePath}`]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      // Update local state
      setImages(images.filter(img => img.id !== image.id));
      toast({
        title: "Image deleted successfully",
        description: `"${image.title}" has been removed.`
      });
      // Also remove from selectedImages if it was selected
      setSelectedImages(selectedImages.filter(id => id !== image.id));
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const toggleSelectImage = (imageId: string) => {
    setSelectedImages(prevSelected =>
      prevSelected.includes(imageId)
        ? prevSelected.filter(id => id !== imageId)
        : [...prevSelected, imageId]
    );
  };

  const deleteAllImages = async () => {
    if (!isAdmin || images.length === 0) return;

    if (window.confirm(`Are you sure you want to delete all ${images.length} images? This action cannot be undone.`)) {
      setLoading(true);
      try {
        // Fetch all image file paths to delete from storage
        const { data: imageData, error: fetchError } = await supabase
          .from('images')
          .select('image_url, preview_image_url')
          .eq('uploaded_by', user!.id); // Only allow admin to delete their own uploads for safety

        if (fetchError) {
          console.error("Error fetching images for deletion:", fetchError);
          toast({
            title: "Deletion failed",
            description: fetchError.message || "An unexpected error occurred while fetching data.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Explicitly type imageData as an array of objects with image_url and preview_image_url
        const imagesToDelete = imageData as unknown as { image_url: string, preview_image_url: string | null }[] || [];

        const storagePaths = imagesToDelete
          .map(img => img.image_url.split('/').pop())
          .filter(Boolean)
          .map(filePath => `educational-images/${filePath}`) as string[];

        const previewStoragePaths = imagesToDelete
          .map(img => img.preview_image_url?.split('/').pop())
          .filter(Boolean)
          .map(filePath => `educational-images/${filePath}`) as string[];

        const allStoragePathsToDelete = [...storagePaths, ...previewStoragePaths];

        if (allStoragePathsToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('educational-images')
            .remove(allStoragePathsToDelete);

          // Log storage error but continue with database deletion
          if (storageError) {
            console.error("Error deleting files from storage:", storageError);
          }
        }

        // Delete all images from database
        const { error: dbError } = await supabase
          .from('images')
          .delete()
          .eq('uploaded_by', user!.id); // Only delete admin's own uploads

        if (dbError) throw dbError;

        setImages([]);
        setFilteredImages([]);
        setSelectedImages([]);
        toast({ title: "All images removed" });
      } catch (error: any) {
        toast({
          title: "Error removing all images",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteSelectedImages = async () => {
    if (!isAdmin || selectedImages.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedImages.length} selected images? This action cannot be undone.`)) {
      setLoading(true);
      try {
        // Fetch the image data for selected images to get file paths
        const { data: selectedImageData, error: fetchError } = await supabase
          .from('images')
          .select('id, image_url, preview_image_url')
          .in('id', selectedImages);

        if (fetchError) {
           console.error("Error fetching selected images for deletion:", fetchError);
           toast({
             title: "Deletion failed",
             description: fetchError.message || "An unexpected error occurred while fetching data.",
             variant: "destructive"
           });
           setLoading(false);
           return;
        }

        // Explicitly type selectedImageData as an array of objects with id, image_url, and preview_image_url
        const imagesToDelete = selectedImageData as unknown as { id: string, image_url: string, preview_image_url: string | null }[] || [];

        // Collect storage paths for selected images
        const storagePathsToDelete = imagesToDelete
          .map(img => img.image_url.split('/').pop()).filter(Boolean).map(filePath => `educational-images/${filePath}`) as string[] || [];

         const previewStoragePathsToDelete = imagesToDelete
           .map(img => img.preview_image_url?.split('/').pop()).filter(Boolean).map(filePath => `educational-images/${filePath}`) as string[] || [];

        const allStoragePathsToDelete = [...storagePathsToDelete, ...previewStoragePathsToDelete];

        // Delete selected files from storage
        if (allStoragePathsToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('educational-images')
            .remove(allStoragePathsToDelete);

          // Log storage error but continue with database deletion
          if (storageError) {
            console.error("Error deleting selected files from storage:", storageError);
          }
        }

        // Delete selected images from database
        const { error: dbError } = await supabase
          .from('images')
          .delete()
          .in('id', selectedImages);

        if (dbError) throw dbError;

        // Update the local state to remove the deleted items
        setImages(images.filter(img => !selectedImages.includes(img.id)));
        setFilteredImages(filteredImages.filter(img => !selectedImages.includes(img.id))); // Also update filtered images
        setSelectedImages([]);
        toast({ title: `${selectedImages.length} images removed` });
      } catch (error: any) {
        toast({
          title: "Error removing selected images",
          description: error.message || "Please try again",
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CAD Gallery</h1>
          <p className="text-gray-600">Browse and download engineering resources</p>
          <div className="mt-4 text-sm text-gray-500">
            {filteredImages.length} resources available
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search CAD images, descriptions, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Toggle for Mobile */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filters */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 ${showFilters ? 'block' : 'hidden lg:grid'}`}>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Engineering Drawing">Engineering Drawing</SelectItem>
                <SelectItem value="Thermodynamics">Thermodynamics</SelectItem>
                <SelectItem value="Mechanics">Mechanics</SelectItem>
                <SelectItem value="Materials Science">Materials Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Diagrams">Diagrams</SelectItem>
                <SelectItem value="Notes">Notes</SelectItem>
                <SelectItem value="Charts">Charts</SelectItem>
                <SelectItem value="Formulas">Formulas</SelectItem>
                <SelectItem value="Examples">Examples</SelectItem>
                <SelectItem value="Reference">Reference</SelectItem>
              </SelectContent>
            </Select>

            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm('');
                setSubjectFilter('all');
                setTypeFilter('all');
                setSemesterFilter('all');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading images...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <Card key={image.id} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white border rounded-lg overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-square relative group cursor-pointer overflow-hidden rounded-t-lg"
                       onClick={() => openPreview(image)}>
                    {/* Conditionally render image or file icon */}
                    {image.preview_image_url ? (
                      <img
                        src={image.preview_image_url}
                        alt={`Preview of ${image.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : image.image_url.match(/\.(jpeg|jpg|png|gif|svg|webp)$/i) ? (
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-200 text-gray-600">
                        <FileText className="w-16 h-16 mb-2" />
                        <p className="text-sm font-semibold text-center px-2 line-clamp-2">{image.title}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {/* Bookmark button overlay */}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(image.id);
                      }}
                    >
                      {bookmarks.includes(image.id) ? 
                        <BookmarkCheck className="h-4 w-4 text-blue-600" /> : 
                        <Bookmark className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">{image.title}</h3>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="default" className="bg-blue-600">{image.subject}</Badge>
                      <Badge variant="outline">{image.type}</Badge>
                      <Badge variant="outline">Sem {image.semester}</Badge>
                    </div>

                    {image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {image.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {image.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{image.tags.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500 font-medium">
                        {image.download_count} downloads
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center flex-wrap justify-end gap-2">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(image);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => downloadImage(image)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredImages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}

        {/* Add buttons for delete selected and delete all above the grid, only for admins */}
        {isAdmin && filteredImages.length > 0 && (
          <div className="mb-4 flex justify-end gap-2">
            {selectedImages.length > 0 && (
              <Button variant="destructive" onClick={deleteSelectedImages} disabled={loading}>
                Delete Selected ({selectedImages.length})
              </Button>
            )}
            <Button variant="outline" onClick={deleteAllImages} disabled={loading}>
              Delete All
            </Button>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-6 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{selectedImage?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedImage && (
            <div className="flex flex-col h-full min-h-0">
              {/* Scrollable content wrapper */}
              <div className="space-y-4 overflow-y-auto flex-grow">
                {/* Fixed Info Section (content moves here) */}
                <div className="space-y-4 mb-6 pb-6 border-b">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <p><strong className="text-gray-700">Subject:</strong> {selectedImage.subject}</p>
                      <p><strong className="text-700">Type:</strong> {selectedImage.type}</p>
                      <p><strong className="text-gray-700">Semester:</strong> {selectedImage.semester}</p>
                    </div>
                    <div className="text-right">
                      <p><strong className="text-gray-700">Downloads:</strong> {selectedImage.download_count}</p>
                      <p><strong className="text-gray-700">Uploaded:</strong> {new Date(selectedImage.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedImage.description && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-gray-700 mb-2"><strong>Description:</strong></p>
                      <p className="text-gray-600 text-sm leading-relaxed">{selectedImage.description}</p>
                    </div>
                  )}

                  {selectedImage.tags.length > 0 && (
                    <div className={`${selectedImage.description ? '' : 'mt-4 pt-4 border-t'}`}>
                      <p className="text-gray-700 mb-2"><strong>Tags:</strong></p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedImage.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Constrained Resource Preview Area (content moves here) */}
                <div className="flex-1 min-h-0 bg-gray-100 rounded-lg overflow-hidden flex justify-center items-center mb-6 relative">
                  {/* File Preview */}
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
                   ) : ( // Handle other non-image files and unsupported 3D formats
                    <div className="flex flex-col items-center justify-center text-gray-600 w-full h-full">
                      <FileText className="w-16 h-16 mb-4" />
                      <p className="text-lg font-semibold mb-2">File Preview Not Available</p>
                      <p className="text-sm text-gray-500 text-center mb-4">This file type cannot be previewed directly. Please download to view or the format is not supported for direct preview.</p>
                    </div>
                   )}
                </div>
              </div>

              {/* Fixed Action Buttons (remains here) */}
              <div className="flex-shrink-0 flex justify-end items-center space-x-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => toggleBookmark(selectedImage.id)}
                >
                  {bookmarks.includes(selectedImage.id) ? 
                    <><BookmarkCheck className="h-4 w-4 mr-2" /> Bookmarked</> : 
                    <><Bookmark className="h-4 w-4 mr-2" /> Bookmark</>
                  }
                </Button>
                <Button onClick={() => downloadImage(selectedImage)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => shareImage(selectedImage)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteImage(selectedImage);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}