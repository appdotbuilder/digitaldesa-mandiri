
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { User, ServiceTemplate, CreateApplicationInput, ServiceType, DocumentType } from '../../../server/src/schema';

interface ServiceCatalogProps {
  user: User;
}

interface FormFieldConfig {
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export function ServiceCatalog({ user }: ServiceCatalogProps) {
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load service templates
  const loadServiceTemplates = useCallback(async () => {
    try {
      const result = await trpc.getServiceTemplates.query();
      setServiceTemplates(result);
    } catch (error) {
      console.error('Failed to load service templates:', error);
      // Using stub data since backend handlers are not implemented
      setServiceTemplates([
        {
          id: 1,
          name: 'Surat Keterangan Domisili',
          service_type: 'domicile_letter',
          description: 'Surat keterangan tempat tinggal untuk keperluan administratif seperti melamar kerja, membuka rekening bank, dan lain-lain.',
          required_documents: ['ktp', 'kk'],
          form_fields: {
            purpose: { type: 'text', label: 'Keperluan', required: true },
            full_name: { type: 'text', label: 'Nama Lengkap', required: true },
            address: { type: 'textarea', label: 'Alamat Lengkap', required: true }
          },
          template_content: 'Template surat keterangan domisili...',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Surat Keterangan Usaha (SKU)',
          service_type: 'business_letter',
          description: 'Surat keterangan untuk usaha/bisnis yang diperlukan untuk izin usaha, bantuan modal, dan keperluan bisnis lainnya.',
          required_documents: ['ktp', 'kk'],
          form_fields: {
            business_name: { type: 'text', label: 'Nama Usaha', required: true },
            business_type: { type: 'text', label: 'Jenis Usaha', required: true },
            business_address: { type: 'textarea', label: 'Alamat Usaha', required: true },
            established_year: { type: 'number', label: 'Tahun Berdiri', required: true }
          },
          template_content: 'Template surat keterangan usaha...',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Surat Keterangan Tidak Mampu (SKTM)',
          service_type: 'poor_certificate',
          description: 'Surat keterangan untuk kondisi ekonomi tidak mampu, diperlukan untuk bantuan sosial, beasiswa, dan keringanan biaya.',
          required_documents: ['ktp', 'kk', 'other'],
          form_fields: {
            income: { type: 'select', label: 'Penghasilan per Bulan', options: ['< 500.000', '500.000 - 1.000.000', '1.000.000 - 2.000.000'], required: true },
            dependents: { type: 'number', label: 'Jumlah Tanggungan', required: true },
            occupation: { type: 'text', label: 'Pekerjaan', required: true },
            purpose: { type: 'text', label: 'Keperluan SKTM', required: true }
          },
          template_content: 'Template surat keterangan tidak mampu...',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          name: 'Surat Keterangan Kelahiran',
          service_type: 'birth_certificate',
          description: 'Surat keterangan kelahiran untuk pengurusan akta kelahiran di Disdukcapil.',
          required_documents: ['ktp', 'kk', 'marriage_certificate'],
          form_fields: {
            child_name: { type: 'text', label: 'Nama Anak', required: true },
            birth_date: { type: 'date', label: 'Tanggal Lahir', required: true },
            birth_place: { type: 'text', label: 'Tempat Lahir', required: true },
            father_name: { type: 'text', label: 'Nama Ayah', required: true },
            mother_name: { type: 'text', label: 'Nama Ibu', required: true }
          },
          template_content: 'Template surat keterangan kelahiran...',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadServiceTemplates();
  }, [loadServiceTemplates]);

  const filteredServices = serviceTemplates.filter((service: ServiceTemplate) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📋</span>
            <span>Katalog Layanan</span>
          </h2>
          <p className="text-gray-600">Pilih layanan administrasi yang Anda perlukan</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Cari layanan..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-500">Tidak ada layanan yang ditemukan</p>
          </div>
        ) : (
          filteredServices.map((service: ServiceTemplate) => (
            <ServiceCard key={service.id} service={service} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({ service, user }: { service: ServiceTemplate; user: User }) {
  const serviceIcon = getServiceTypeIcon(service.service_type);

  return (
    <Card className="transition-all hover:shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start space-x-3">
          <div className="text-3xl">{serviceIcon}</div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-800 mb-2">
              {service.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {service.service_type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {service.description}
        </p>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📎 Dokumen yang diperlukan:</p>
          <div className="flex flex-wrap gap-1">
            {service.required_documents.map((doc: DocumentType) => (
              <Badge key={doc} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {getDocumentTypeLabel(doc)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <ServiceApplicationDialog service={service} user={user} />
        </div>
      </CardContent>
    </Card>
  );
}

// Service Application Dialog
function ServiceApplicationDialog({ service, user }: { service: ServiceTemplate; user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const applicationData: CreateApplicationInput = {
        citizen_id: user.id,
        service_template_id: service.id,
        form_data: formData,
        submitted_documents: selectedDocuments
      };
      
      await trpc.createApplication.mutate(applicationData);
      setIsOpen(false);
      setFormData({});
      setSelectedDocuments([]);
      // Show success message or redirect
    } catch (error) {
      console.error('Failed to create application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormField = (fieldKey: string, fieldConfig: FormFieldConfig) => {
    const { type, label, required, options } = fieldConfig;

    switch (type) {
      case 'text':
        return (
          <Input
            key={fieldKey}
            placeholder={label}
            value={String(formData[fieldKey] || '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: Record<string, string | number>) => ({ ...prev, [fieldKey]: e.target.value }))
            }
            required={required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            key={fieldKey}
            placeholder={label}
            value={String(formData[fieldKey] || '')}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: Record<string, string | number>) => ({ ...prev, [fieldKey]: e.target.value }))
            }
            required={required}
            rows={3}
          />
        );
      
      case 'number':
        return (
          <Input
            key={fieldKey}
            type="number"
            placeholder={label}
            value={String(formData[fieldKey] || '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: Record<string, string | number>) => ({ ...prev, [fieldKey]: parseInt(e.target.value) || 0 }))
            }
            required={required}
          />
        );
      
      case 'date':
        return (
          <Input
            key={fieldKey}
            type="date"
            placeholder={label}
            value={String(formData[fieldKey] || '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: Record<string, string | number>) => ({ ...prev, [fieldKey]: e.target.value }))
            }
            required={required}
          />
        );
      
      case 'select':
        return (
          <Select
            key={fieldKey}
            value={String(formData[fieldKey] || '')}
            onValueChange={(value: string) =>
              setFormData((prev: Record<string, string | number>) => ({ ...prev, [fieldKey]: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  const isFormFieldConfig = (value: unknown): value is FormFieldConfig => {
    return typeof value === 'object' && value !== null && 'type' in value && 'label' in value && 'required' in value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <span className="mr-2">📝</span>
          Ajukan Permohonan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{getServiceTypeIcon(service.service_type)}</span>
            <span>{service.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">📋 Informasi Layanan</p>
            <p className="text-sm text-blue-600">{service.description}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-3">📝 Formulir Permohonan</h3>
            <div className="space-y-3">
              {Object.entries(service.form_fields).map(([fieldKey, fieldConfig]) => {
                if (!isFormFieldConfig(fieldConfig)) return null;
                return (
                  <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {fieldConfig.label}
                      {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFormField(fieldKey, fieldConfig)}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-3">📎 Dokumen Persyaratan</h3>
            <div className="bg-yellow-50 p-4 rounded-lg mb-3">
              <p className="text-sm text-yellow-700">
                <strong>⚠️ Catatan:</strong> Pastikan Anda telah mengunggah dokumen-dokumen berikut di bagian profil sebelum mengajukan permohonan.
              </p>
            </div>
            <div className="space-y-2">
              {service.required_documents.map((doc: DocumentType) => (
                <div key={doc} className="flex items-center space-x-2">
                  <Checkbox 
                    id={doc}
                    checked={selectedDocuments.includes(1)} // Stub document ID
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedDocuments([...selectedDocuments, 1]); // Stub document ID
                      } else {
                        setSelectedDocuments(selectedDocuments.filter(id => id !== 1));
                      }
                    }}
                  />
                  <label htmlFor={doc} className="text-sm text-gray-700">
                    {getDocumentTypeLabel(doc)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>📋 Proses Selanjutnya:</strong>
            </p>
            <ol className="text-sm text-gray-600 mt-2 list-decimal list-inside space-y-1">
              <li>Permohonan akan direview oleh RT/RW</li>
              <li>Jika disetujui, akan diproses oleh staff kelurahan</li>
              <li>Dokumen final akan ditandatangani oleh kepala desa</li>
              <li>Anda akan mendapat notifikasi ketika dokumen siap diambil</li>
            </ol>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Mengajukan...' : 'Ajukan Permohonan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions (moved outside components)
function getServiceTypeIcon(type: ServiceType) {
  const icons = {
    domicile_letter: '🏠',
    business_letter: '💼',
    poor_certificate: '💰',
    birth_certificate: '👶',
    other: '📄'
  };
  return icons[type] || '📄';
}

function getDocumentTypeLabel(type: DocumentType) {
  const labels = {
    ktp: 'KTP',
    kk: 'Kartu Keluarga', 
    birth_certificate: 'Akta Kelahiran',
    marriage_certificate: 'Akta Nikah',
    other: 'Dokumen Lainnya'
  };
  return labels[type] || type;
}
