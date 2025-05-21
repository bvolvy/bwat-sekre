import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, FileDown } from 'lucide-react';
import { toast } from 'react-toastify';

interface CSVImportProps {
  onImport: (data: any[]) => void;
  template: Record<string, string>;
  validateRow?: (row: any) => boolean;
}

const CSVImport: React.FC<CSVImportProps> = ({ onImport, template, validateRow }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;

    if (file.type !== 'text/csv') {
      setError('Veuillez sélectionner un fichier CSV valide');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, errors } = results;

        if (errors.length > 0) {
          setError('Le fichier CSV contient des erreurs');
          return;
        }

        // Validate required columns
        const headers = Object.keys(results.data[0] || {});
        const requiredColumns = Object.keys(template);
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setError(`Colonnes manquantes: ${missingColumns.join(', ')}`);
          return;
        }

        // Validate each row if validator provided
        if (validateRow) {
          const invalidRows = data.filter(row => !validateRow(row));
          if (invalidRows.length > 0) {
            setError(`${invalidRows.length} ligne(s) contiennent des données invalides`);
            return;
          }
        }

        onImport(data);
        toast.success('Importation réussie!');
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        setError(`Erreur lors de l'analyse du fichier: ${error.message}`);
      }
    });
  };

  const downloadTemplate = () => {
    const headers = Object.keys(template);
    const csvContent = [
      headers.join(','), // Header row
      headers.map(() => '').join(',') // Empty row for example
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={downloadTemplate}
          className="btn btn-secondary flex items-center text-sm"
        >
          <FileDown size={16} className="mr-2" />
          Télécharger le modèle
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv"
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          <Upload size={32} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">
            Cliquez pour sélectionner un fichier CSV
          </span>
          <span className="text-xs text-gray-500 mt-1">
            ou glissez-déposez le fichier ici
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-error-50 text-error-700 p-4 rounded-md flex items-start">
          <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Format requis:</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          {Object.entries(template).map(([column, description]) => (
            <li key={column}>
              <span className="font-medium">{column}</span>: {description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CSVImport;