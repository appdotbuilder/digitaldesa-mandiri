
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, Application, Complaint, ServiceTemplate, CreateServiceTemplateInput, UpdateApplicationStatusInput, UpdateComplaintStatusInput, ApplicationStatus, ComplaintStatus, ServiceType } from '../../../server/src/schema';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [ap, comp, services] = await Promise.all([
        trpc.getApplications.query({ userId: user.id, role: user.role }),
        trpc.getComplaints.query({ userId: user.id, role: user.role }),
        trpc.getServiceTemplates.query()
      ]);
      
      setApplications(ap);
      setComplaints(comp);
      setServiceTemplates(services);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Using stub data since backend handlers are not implemented
      setApplications([
        {
          id: 1,
          citizen_id: 'citizen-123',
          service_template_id: 1,
          status: 'rt_rw_review',
          form_data: { purpose: 'Melamar kerja', full_name: 'Budi Santoso' },
          submitted_documents: [1, 2],
          rt_rw_reviewer_id: null,
          rt_rw_review_notes: null,
          rt_rw_reviewed_at: null,
          village_staff_id: null,
          village_processing_notes: null,
          village_processed_at: null,
          village_head_id: null,
          village_head_notes: null,
          village_head_reviewed_at: null,
          document_number: null,
          generated_document_url: null,
          created_at: new Date('2024-12-08'),
          updated_at: new Date('2024-12-08')
        },
        {
          id: 2,
          citizen_id: 'citizen-456',
          service_template_id: 2,
          status: 'village_processing',
          form_data: { business_name: 'Warung Berkah', business_type: 'Makanan' },
          submitted_documents: [3, 4],
          rt_rw_reviewer_id: 'rtrw-123',
          rt_rw_review_notes: 'Disetujui',
          rt_rw_reviewed_at: new Date('2024-12-07'),
          village_staff_id: user.id,
          village_processing_notes: 'Sedang memproses dokumen',
          village_processed_at: null,
          village_head_id: null,
          village_head_notes: null,
          village_head_reviewed_at: null,
          document_number: null,
          generated_document_url: null,
          created_at: new Date('2024-12-06'),
          updated_at: new Date('2024-12-08')
        }
      ]);
      
      setComplaints([
        {
          id: 1,
          citizen_id: 'citizen-123',
          title: 'Jalan Rusak di RT 003',
          description: 'Jalan berlubang dan berbahaya',
          location: 'Jl. Merdeka RT 003',
          is_anonymous: false,
          status: 'received',
          assigned_staff_id: null,
          resolution_notes: null,
          resolved_at: null,
          created_at: new Date('2024-12-08'),
          updated_at: new Date('2024-12-08')
        }
      ]);

      setServiceTemplates([
        {
          id: 1,
          name: 'Surat Keterangan Domisili',
          service_type: 'domicile_letter',
          description: 'Surat keterangan tempat tinggal',
          required_documents: ['ktp', 'kk'],
          form_fields: {
            purpose: { type: 'text', label: 'Keperluan', required: true },
            full_name: { type: 'text', label: 'Nama Lengkap', required: true }
          },
          template_content: 'Template surat...',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getApplicationStatusCounts = () => {
    const counts = {
      rt_rw_review: 0,
      village_processing: 0,
      village_head_review: 0,
      completed: 0,
      total: applications.length
    };

    applications.forEach((app: Application) => {
      if (Object.prototype.hasOwnProperty.call(counts, app.status)) {
        (counts as Record<string, number>)[app.status]++;
      }
    });

    return counts;
  };

  const getComplaintStatusCounts = () => {
    const counts = {
      received: 0,
      under_review: 0,
      resolved: 0,
      total: complaints.length
    };

    complaints.forEach((complaint: Complaint) => {
      if (Object.prototype.hasOwnProperty.call(counts, complaint.status)) {
        (counts as Record<string, number>)[complaint.status]++;
      }
    });

    return counts;
  };

  const statusCounts = getApplicationStatusCounts();
  const complaintCounts = getComplaintStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>⚙️</span>
            <span>Dashboard Admin</span>
          </h2>
          <p className="text-gray-600">
            {user.role === 'village_head' ? 'Panel Kepala Desa' : 'Panel Staff Kelurahan'}
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📋</span>
                <span>Total Permohonan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statusCounts.total}</div>
              <p className="opacity-90">permohonan</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⏳</span>
                <span>Butuh Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statusCounts.rt_rw_review + statusCounts.village_processing + statusCounts.village_head_review}
              </div>
              <p className="opacity-90">menunggu tindakan</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>✅</span>
                <span>Selesai</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statusCounts.completed}</div>
              <p className="opacity-90">dokumen selesai</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📝</span>
                <span>Laporan Warga</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{complaintCounts.total}</div>
              <p className="opacity-90">laporan masuk</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-md rounded-lg p-1">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <span>📊</span>
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center space-x-2">
            <span>📋</span>
            <span>Permohonan</span>
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center space-x-2">
            <span>📝</span>
            <span>Laporan</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center space-x-2">
            <span>⚙️</span>
            <span>Layanan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewContent applications={applications} complaints={complaints} />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsManagement 
            applications={applications} 
            user={user}
            onUpdate={loadDashboardData}
          />
        </TabsContent>

        <TabsContent value="complaints">
          <ComplaintsManagement 
            complaints={complaints} 
            user={user}
            onUpdate={loadDashboardData}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServicesManagement 
            serviceTemplates={serviceTemplates}
            onUpdate={loadDashboardData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Content Component
function OverviewContent({ 
  applications, 
  complaints 
}: { 
  applications: Application[]; 
  complaints: Complaint[];
}) {
  const recentApplications = applications
    .sort((a: Application, b: Application) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, 5);

  const recentComplaints = complaints
    .sort((a: Complaint, b: Complaint) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>Permohonan Terbaru</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Tidak ada permohonan</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app: Application) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Permohonan #{app.id}</p>
                    <p className="text-sm text-gray-600">
                      {app.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Complaints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📝</span>
            <span>Laporan Terbaru</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentComplaints.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Tidak ada laporan</p>
          ) : (
            <div className="space-y-3">
              {recentComplaints.map((complaint: Complaint) => (
                <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{complaint.title}</p>
                    <p className="text-sm text-gray-600">
                      {complaint.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Badge variant="outline" className={getComplaintStatusColor(complaint.status)}>
                    {getComplaintStatusLabel(complaint.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Applications Management Component
function ApplicationsManagement({ 
  applications, 
  user, 
  onUpdate 
}: { 
  applications: Application[]; 
  user: User; 
  onUpdate: () => void;
}) {
  const handleStatusUpdate = async (application: Application, newStatus: ApplicationStatus, notes?: string) => {
    try {
      const updateData: UpdateApplicationStatusInput = {
        id: application.id,
        status: newStatus,
        reviewer_id: user.id,
        notes
      };
      
      await trpc.updateApplicationStatus.mutate(updateData);
      onUpdate();
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kelola Permohonan</h3>
      </div>

      {applications.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-500">Tidak ada permohonan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app: Application) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Permohonan #{app.id}</h4>
                    <p className="text-sm text-gray-600">
                      {app.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <pre className="text-sm text-gray-700">
                      {JSON.stringify(app.form_data, null, 2)}
                    </pre>
                  </div>
                  <div className="flex space-x-2">
                    {canProcessApplication(app.status, user.role) && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleStatusUpdate(app, getNextRejectedStatus(), 'Ditolak')}
                        >
                          Tolak
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleStatusUpdate(app, getNextApprovedStatus(app.status), 'Disetujui')}
                        >
                          Setujui
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Complaints Management Component
function ComplaintsManagement({ 
  complaints, 
  user, 
  onUpdate 
}: { 
  complaints: Complaint[]; 
  user: User; 
  onUpdate: () => void;
}) {
  const handleStatusUpdate = async (complaint: Complaint, newStatus: ComplaintStatus, notes?: string) => {
    try {
      const updateData: UpdateComplaintStatusInput = {
        id: complaint.id,
        status: newStatus,
        assigned_staff_id: user.id,
        resolution_notes: notes || null
      };
      
      await trpc.updateComplaintStatus.mutate(updateData);
      onUpdate();
    } catch (error) {
      console.error('Failed to update complaint status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kelola Laporan Warga</h3>
      </div>

      {complaints.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500">Tidak ada laporan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint: Complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{complaint.title}</h4>
                    <p className="text-sm text-gray-600">
                      {complaint.created_at.toLocaleDateString('id-ID')} • {complaint.location || 'Lokasi tidak disebutkan'}
                    </p>
                  </div>
                  <Badge variant="outline" className={getComplaintStatusColor(complaint.status)}>
                    {getComplaintStatusLabel(complaint.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{complaint.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    {complaint.is_anonymous ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        🕵️ Anonim
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Pelapor: ID {complaint.citizen_id}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {complaint.status === 'received' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusUpdate(complaint, 'under_review', 'Sedang ditinjau')}
                      >
                        Mulai Tinjau
                      </Button>
                    )}
                    {complaint.status === 'under_review' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusUpdate(complaint, 'resolved', 'Masalah telah diselesaikan')}
                      >
                        Tandai Selesai
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Services Management Component
function ServicesManagement({ 
  serviceTemplates, 
  onUpdate 
}: { 
  serviceTemplates: ServiceTemplate[]; 
  onUpdate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kelola Template Layanan</h3>
        <CreateServiceTemplateDialog onSuccess={onUpdate} />
      </div>

      {serviceTemplates.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">⚙️</div>
            <p className="text-gray-500">Tidak ada template layanan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviceTemplates.map((template: ServiceTemplate) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="outline" className={template.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}>
                    {template.is_active ? '✅ Aktif' : '❌ Nonaktif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      Jenis: {template.service_type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      ✏️ Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={template.is_active ? 'text-red-600' : 'text-green-600'}
                    >
                      {template.is_active ? '❌ Nonaktifkan' : '✅ Aktifkan'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Create Service Template Dialog
function CreateServiceTemplateDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateServiceTemplateInput>({
    name: '',
    service_type: 'domicile_letter',
    description: '',
    required_documents: [],
    form_fields: {},
    template_content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createServiceTemplate.mutate(formData);
      setIsOpen(false);
      setFormData({
        name: '',
        service_type: 'domicile_letter',
        description: '',
        required_documents: [],
        form_fields: {},
        template_content: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create service template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-green-600">
          <span className="mr-2">➕</span>
          Buat Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Template Layanan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nama layanan"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateServiceTemplateInput) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          
          <Select 
            value={formData.service_type || 'domicile_letter'} 
            onValueChange={(value: ServiceType) =>
              setFormData((prev: CreateServiceTemplateInput) => ({ ...prev, service_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="domicile_letter">Surat Domisili</SelectItem>
              <SelectItem value="business_letter">Surat Usaha</SelectItem>
              <SelectItem value="poor_certificate">SKTM</SelectItem>
              <SelectItem value="birth_certificate">Akta Kelahiran</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Deskripsi layanan"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateServiceTemplateInput) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            required
          />

          <Textarea
            placeholder="Template konten dokumen"
            value={formData.template_content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateServiceTemplateInput) => ({ ...prev, template_content: e.target.value }))
            }
            rows={5}
            required
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Membuat...' : 'Buat Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function getStatusColor(status: string) {
  const colors = {
    submitted: 'bg-blue-50 text-blue-700',
    rt_rw_review: 'bg-yellow-50 text-yellow-700',
    rt_rw_approved: 'bg-green-50 text-green-700',
    village_processing: 'bg-purple-50 text-purple-700',
    village_head_review: 'bg-orange-50 text-orange-700',
    completed: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700';
}

function getStatusLabel(status: string) {
  const labels = {
    submitted: 'Diajukan',
    rt_rw_review: 'Review RT/RW',
    rt_rw_approved: 'Disetujui RT/RW',
    village_processing: 'Proses Kelurahan',
    village_head_review: 'Review Kades',
    completed: 'Selesai',
    rejected: 'Ditolak'
  };
  return labels[status as keyof typeof labels] || status;
}

function getComplaintStatusColor(status: string) {
  const colors = {
    received: 'bg-blue-50 text-blue-700',
    under_review: 'bg-yellow-50 text-yellow-700',
    resolved: 'bg-green-50 text-green-700',
    closed: 'bg-gray-50 text-gray-700'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700';
}

function getComplaintStatusLabel(status: string) {
  const labels = {
    received: 'Diterima',
    under_review: 'Ditinjau',
    resolved: 'Selesai',
    closed: 'Ditutup'
  };
  return labels[status as keyof typeof labels] || status;
}

function canProcessApplication(status: string, userRole: string) {
  if (userRole === 'village_staff') {
    return ['rt_rw_approved', 'village_processing'].includes(status);
  }
  if (userRole === 'village_head') {
    return status === 'village_head_review';
  }
  return false;
}

function getNextApprovedStatus(currentStatus: string): ApplicationStatus {
  const statusFlow: Record<string, ApplicationStatus> = {
    rt_rw_review: 'rt_rw_approved',
    rt_rw_approved: 'village_processing',
    village_processing: 'village_head_review',
    village_head_review: 'completed'
  };
  return statusFlow[currentStatus] || currentStatus as ApplicationStatus;
}

function getNextRejectedStatus(): ApplicationStatus {
  return 'rejected';
}
