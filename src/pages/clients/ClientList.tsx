{
  // Update the import section and add Import button
  const updatedContent = content.replace(
    'import { Plus, Search, Eye, Edit, Trash2, AlertCircle } from \'lucide-react\';',
    'import { Plus, Search, Eye, Edit, Trash2, AlertCircle, Upload } from \'lucide-react\';'
  ).replace(
    '<div className="flex space-x-3 mt-4 sm:mt-0">',
    `<div className="flex space-x-3 mt-4 sm:mt-0">
          <Link
            to="/clients/import"
            className="btn btn-secondary flex items-center justify-center sm:justify-start"
          >
            <Upload size={20} className="mr-1" />
            Importer
          </Link>`
  );
  return updatedContent;
}