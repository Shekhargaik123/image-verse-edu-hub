
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
import { Search, Download, Bookmark, BookmarkCheck, Eye, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Gallery() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
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

  useEffect(() => {
    if (user) {
      fetchImages();
      fetchBookmarks();
    }
  }, [user]);

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, subjectFilter, typeFilter, semesterFilter]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      toast({
        title: "Error loading images",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
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
              <Card key={image.id} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white border-0 shadow-md">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-square relative group cursor-pointer overflow-hidden rounded-t-lg"
                       onClick={() => openPreview(image)}>
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
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

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-gray-500 font-medium">
                        {image.download_count} downloads
                      </span>
                      
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
      </div>

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

              {selectedImage.tags.length > 0 && (
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
