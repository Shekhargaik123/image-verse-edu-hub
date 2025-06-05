import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import CADViewer from '@/components/CADViewer';
import { Link } from 'react-router-dom';

export default function AdminUpload() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [needsConversion, setNeedsConversion] = useState(false);
  const [unsupportedType, setUnsupportedType] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'Engineering Drawing',
    type: 'Diagrams',
    semester: 1,
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

  // Define CAD formats that require preview images
  const cadFormats: { [key: string]: boolean } = {
    'stp': true,
    'step': true,
    'stl': true,
    'catpart': true,
    'sldprt': true,
    'prt': true,
    'dwg': true,
    'obj': true
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(null);
    setPreview(null);
    setNeedsConversion(false);
    setUnsupportedType(false);
    setPreviewImage(null);
    setPreviewImageUrl(null);

    if (selectedFile) {
      setFile(selectedFile);
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else if (fileExtension && cadFormats[fileExtension]) {
        setNeedsConversion(true);
      } else {
        setUnsupportedType(true);
      }
    }
  };

  const handlePreviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setPreviewImage(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    if (needsConversion && !previewImage) {
      toast({
        title: "Preview Required",
        description: "Please either convert the file or provide a preview image",
        variant: "destructive"
      });
      return;
    }

    if (unsupportedType) {
      toast({
        title: "Unsupported File Type",
        description: "This file type cannot be uploaded directly.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileExt === 'stl' || fileExt === 'glb' ? `cad-models/${fileName}` : `educational-images/${fileName}`;

      // Upload the main file
      const { error: uploadError } = await supabase.storage
        .from('educational-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('educational-images')
        .getPublicUrl(filePath);

      // If there's a preview image, upload it
      let previewImageUrl = null;
      if (previewImage) {
        const previewExt = previewImage.name.split('.').pop();
        const previewFileName = `${Date.now()}-preview-${Math.random().toString(36).substring(2)}.${previewExt}`;
        const previewPath = `preview-images/${previewFileName}`;

        const { error: previewUploadError } = await supabase.storage
          .from('educational-images')
          .upload(previewPath, previewImage);

        if (previewUploadError) throw previewUploadError;

        const { data: previewUrlData } = supabase.storage
          .from('educational-images')
          .getPublicUrl(previewPath);

        previewImageUrl = previewUrlData.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('images')
        .insert({
          title: formData.title,
          description: formData.description,
          image_url: urlData.publicUrl,
          preview_image_url: previewImageUrl,
          subject: formData.subject,
          type: fileExt && cadFormats[fileExt] ? 'Diagrams' : formData.type,
          semester: formData.semester,
          tags: formData.tags,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Resource uploaded successfully"
      });

      setFormData({
        title: '',
        description: '',
        subject: 'Engineering Drawing',
        type: 'Diagrams',
        semester: 1,
        tags: []
      });
      setFile(null);
      setPreview(null);
      setPreviewImage(null);
      setPreviewImageUrl(null);
      setNeedsConversion(false);
      setUnsupportedType(false);
      setTagInput('');

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!file) return (
       <div className="flex flex-col items-center justify-center pt-5 pb-6">
         <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
         <p className="mb-2 text-sm text-gray-500">
           <span className="font-semibold">Click to upload</span> or drag and drop
         </p>
         <p className="text-xs text-gray-500">Supported: Images (.jpg, .png, etc.)</p>
         <p className="text-xs text-gray-500">For CAD files (.stp, .step, .stl, .catpart, .sldprt, .prt, .dwg, .obj), a preview image is required.</p>
       </div>
    );

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (preview && file.type.startsWith('image/')) {
      return (
         <img
           src={preview}
           alt="Preview"
           className="w-full h-full object-contain rounded-lg"
         />
      );
    } else if (preview && (fileExtension === 'stl' || fileExtension === 'glb')) {
      return (
         <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
           <FileText className="w-12 h-12 text-gray-400" />
         </div>
      );
    } else if (needsConversion) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full text-gray-600 p-4 text-center">
          <FileText className="w-16 h-16 mb-4" />
          <p className="text-lg font-semibold mb-2">Preview Image Required</p>
          <p className="text-sm text-gray-500 mb-4">
            This CAD file format requires a preview image for better visualization.
            Please upload a preview image (JPG, PNG) of your CAD model.
          </p>
          <div className="mt-4">
            <Label htmlFor="preview-image" className="block text-sm font-medium text-gray-700 mb-2">
              Upload a preview image:
            </Label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> preview image
                    </p>
                  </div>
                )}
                <input
                  id="preview-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePreviewImageChange}
                />
              </label>
            </div>
          </div>
        </div>
      );
    } else if (unsupportedType) {
       return (
        <div className="flex flex-col items-center justify-center w-full h-full text-gray-600 p-4 text-center">
          <FileText className="w-16 h-16 mb-4" />
          <p className="text-lg font-semibold mb-2">File Type Not Supported</p>
          <p className="text-sm text-gray-500">This file type cannot be previewed or uploaded directly.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload CAD Images</h1>
          <p className="text-gray-600">Add new engineering resources for students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Resource
            </CardTitle>
            <CardDescription>
              Upload supported file types (Images, STL, GLB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="file">File Upload</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
                      {renderPreview()}
                      {file && (
                         <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => {
                              setFile(null);
                              setPreview(null);
                              setNeedsConversion(false);
                              setUnsupportedType(false);
                              setPreviewImage(null);
                              setPreviewImageUrl(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                      )}
                       {!file && (
                         <input
                            id="file"
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.gif,.svg,.webp,.stl,.glb,.step,.stp,.catpart,.sldprt,.prt,.dwg,.obj"
                            onChange={handleFileChange}
                          />
                       )}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter resource title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the resource"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="Diagrams">Diagrams</SelectItem>
                       <SelectItem value="Notes">Notes</SelectItem>
                       <SelectItem value="Charts">Charts</SelectItem>
                       <SelectItem value="Formulas">Formulas</SelectItem>
                       <SelectItem value="Examples">Examples</SelectItem>
                       <SelectItem value="Reference">Reference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

               <div>
                 <Label htmlFor="semester">Semester</Label>
                 <Select value={formData.semester.toString()} onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       {[1,2,3,4,5,6,7,8].map(sem => (
                         <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
               </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags (e.g., gear, engine)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>Add Tag</Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || (needsConversion && !previewImage) || unsupportedType}>
                {loading ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
