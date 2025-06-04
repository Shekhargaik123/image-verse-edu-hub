import React from 'react';

export default function ConversionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Convert Your CAD Files</h1>
          <p className="text-gray-700 mb-6">
            Currently, our application supports viewing 3D models in .STL and .GLB formats.
            To view your .STEP or .STP files, you need to convert them to one of the supported formats first.
          </p>
          <p className="text-gray-700 mb-6">
            You can use a free online converter for this purpose. We suggest using a tool like this one:
          </p>
          <div className="text-center">
            <a 
              href="https://products.aspose.app/cad/conversion/stp-to-glb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 transition-colors"
            >
              Go to Online STP/STEP to GLB Converter
            </a>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            (Note: This is a third-party service. Please review their terms and privacy policy before use.)
          </p>
          <p className="text-gray-700 mt-6">
            Once your file is converted to .GLB or .STL, you can upload it to the gallery, and you will be able to view it directly in the application.
          </p>
        </div>
      </div>
    </div>
  );
} 