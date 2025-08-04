
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { User, Application, ApplicationStatus } from '../../../server/src/schema';

interface ApplicationTrackerProps {
  user: User;
}

export function ApplicationTracker({ user }: ApplicationTrackerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Load applications
  const loadApplications = useCallback(async () => {
    try {
      const result = await trpc.getApplications.query({
        userId: user.id,
        role: user.role
      });
      setApplications(result);
    } catch (error) {
      console.error('Failed to load applications:', error);
      // Using stub data since backend handlers are not implemented
      setApplications([
        {
          id: 1,
          citizen_id: user.id,
          service_template_id: 1,
          status: 'rt_rw_review',
          form_data: { purpose: 'Untuk keperluan melamar kerja', full_name: 'Budi Santoso' },
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
          citizen_id: user.id,
          service_template_id: 2,
          status: 'completed',
          form_data: { business_name: 'Toko Berkah', business_type: 'Retail' },
          submitted_documents: [3, 4],
          rt_rw_reviewer_id: 'rtrw-123',
          rt_rw_review_notes: 'Disetujui',
          rt_rw_reviewed_at: new Date('2024-12-05'),
          village_staff_id: 'staff-456',
          village_processing_notes: 'Dokumen telah dibuat',
          village_processed_at: new Date('2024-12-06'),
          village_head_id: 'head-789',
          village_head_notes: 'Disetujui',
          village_head_reviewed_at: new Date('2024-12-07'),
          document_number: 'SKU/001/XII/2024',
          generated_document_url: '/documents/sku-001.pdf',
          created_at: new Date('2024-12-04'),
          updated_at: new Date('2024-12-07')
        },
        {
          id: 3,
          citizen_id: user.id,
          service_template_id: 3,
          status: 'village_processing',
          form_data: { income: '< 1.000.000', dependents: '3' },
          submitted_documents: [5, 6, 7],
          rt_rw_reviewer_id: 'rtrw-123',
          rt_rw_review_notes: 'Disetujui dengan catatan untuk verifikasi pendapatan',
          rt_rw_reviewed_at: new Date('2024-12-06'),
          village_staff_id: 'staff-456',
          village_processing_notes: 'Sedang verifikasi dokumen pendukung',
          village_processed_at: null,
          village_head_id: null,
          village_head_notes: null,
          village_head_reviewed_at: null,
          document_number: null,
          generated_document_url: null,
          created_at: new Date('2024-12-05'),
          updated_at: new Date('2024-12-08')
        }
      ]);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const getStatusInfo = (status: ApplicationStatus) => {
    const statusMap = {
      submitted: { 
        label: 'Diajukan', 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        progress: 10,
        icon: '📝'
      },
      rt_rw_review: { 
        label: 'Review RT/RW', 
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
        progress: 25,
        icon: '👀'
      },
      rt_rw_approved: { 
        label: 'Disetujui RT/RW', 
        color: 'bg-green-50 text-green-700 border-green-200', 
        progress: 40,
        icon: '✅'
      },
      rt_rw_rejected: { 
        label: 'Ditolak RT/RW', 
        color: 'bg-red-50 text-red-700 border-red-200', 
        progress: 25,
        icon: '❌'
      },
      village_processing: { 
        label: 'Diproses Kelurahan', 
        color: 'bg-purple-50 text-purple-700 border-purple-200', 
        progress: 60,
        icon: '⚙️'
      },
      village_head_review: { 
        label: 'Review Kades', 
        color: 'bg-orange-50 text-orange-700 border-orange-200', 
        progress: 80,
        icon: '👔'
      },
      completed: { 
        label: 'Selesai', 
        color: 'bg-green-50 text-green-700 border-green-200', 
        progress: 100,
        icon: '🎉'
      },
      rejected: { 
        label: 'Ditolak', 
        color: 'bg-red-50 text-red-700 border-red-200', 
        progress: 0,
        icon: '❌'
      }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getServiceName = (templateId: number) => {
    const services = {
      1: 'Surat Keterangan Domisili',
      2: 'Surat Keterangan Usaha',
      3: 'Surat Keterangan Tidak Mampu',
      4: 'Surat Keterangan Kelahiran',
      5: 'Surat Keterangan Kematian'
    };
    return services[templateId as keyof typeof services] || 'Layanan Lainnya';
  };

  const filteredApplications = applications.filter((app: Application) => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'active') return !['completed', 'rejected'].includes(app.status);
    if (selectedStatus === 'completed') return app.status === 'completed';
    return app.status === selectedStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📄</span>
            <span>Tracking Permohonan</span>
          </h2>
          <p className="text-gray-600">Pantau status permohonan layanan Anda</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-md rounded-lg p-1">
          <TabsTrigger value="all" className="flex items-center space-x-1">
            <span>📋</span>
            <span>Semua</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center space-x-1">
            <span>⏳</span>
            <span>Aktif</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-1">
            <span>✅</span>
            <span>Selesai</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center space-x-1">
            <span>❌</span>
            <span>Ditolak</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <p className="text-gray-500">Belum ada permohonan untuk kategori ini</p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application: Application) => (
            <ApplicationCard key={application.id} application={application} getServiceName={getServiceName} getStatusInfo={getStatusInfo} />
          ))
        )}
      </div>
    </div>
  );
}

// Application Card Component
function ApplicationCard({ 
  application, 
  getServiceName,
  getStatusInfo
}: { 
  application: Application; 
  getServiceName: (id: number) => string;
  getStatusInfo: (status: ApplicationStatus) => { label: string; color: string; progress: number; icon: string };
}) {
  const statusInfo = getStatusInfo(application.status);

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{statusInfo.icon}</span>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {application.document_number && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  No: {application.document_number}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl text-gray-800">
              {getServiceName(application.service_template_id)}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Diajukan: {application.created_at.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex space-x-2">
            <ApplicationDetailDialog application={application} getServiceName={getServiceName} getStatusInfo={getStatusInfo} />
            {application.generated_document_url && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <span className="mr-1">📥</span>
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{statusInfo.progress}%</span>
          </div>
          <Progress value={statusInfo.progress} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <TimelineStep 
            icon="📝" 
            title="Permohonan Diajukan" 
            date={application.created_at}
            isCompleted={true}
            isActive={application.status === 'submitted'}
          />
          <TimelineStep 
            icon="👀" 
            title="Review RT/RW" 
            date={application.rt_rw_reviewed_at}
            notes={application.rt_rw_review_notes}
            isCompleted={['rt_rw_approved', 'village_processing', 'village_head_review', 'completed'].includes(application.status)}
            isActive={application.status === 'rt_rw_review'}
            isRejected={application.status === 'rt_rw_rejected'}
          />
          <TimelineStep 
            icon="⚙️" 
            title="Proses Kelurahan" 
            date={application.village_processed_at}
            notes={application.village_processing_notes}
            isCompleted={['village_head_review', 'completed'].includes(application.status)}
            isActive={application.status === 'village_processing'}
          />
          <TimelineStep 
            icon="👔" 
            title="Persetujuan Kepala Desa" 
            date={application.village_head_reviewed_at}
            notes={application.village_head_notes}
            isCompleted={application.status === 'completed'}
            isActive={application.status === 'village_head_review'}
          />
          <TimelineStep 
            icon="🎉" 
            title="Dokumen Siap" 
            date={application.status === 'completed' ? application.updated_at : null}
            isCompleted={application.status === 'completed'}
            isActive={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Timeline Step Component
function TimelineStep({ 
  icon, 
  title, 
  date, 
  notes, 
  isCompleted, 
  isActive, 
  isRejected = false 
}: {
  icon: string;
  title: string;
  date: Date | null;
  notes?: string | null;
  isCompleted: boolean;
  isActive: boolean;
  isRejected?: boolean;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
        isRejected 
          ? 'bg-red-100 text-red-600'
          : isCompleted 
            ? 'bg-green-100 text-green-600' 
            : isActive 
              ? 'bg-blue-100 text-blue-600 animate-pulse' 
              : 'bg-gray-100 text-gray-400'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          isRejected 
            ? 'text-red-600'
            : isCompleted 
              ? 'text-green-600' 
              : isActive 
                ? 'text-blue-600' 
                : 'text-gray-400'
        }`}>
          {title}
        </p>
        {date && (
          <p className="text-xs text-gray-500">
            {date.toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
        {notes && (
          <p className="text-xs text-gray-600 mt-1 italic">"{notes}"</p>
        )}
      </div>
    </div>
  );
}

// Application Detail Dialog
function ApplicationDetailDialog({ 
  application, 
  getServiceName,
  getStatusInfo
}: { 
  application: Application; 
  getServiceName: (id: number) => string;
  getStatusInfo: (status: ApplicationStatus) => { label: string; color: string; progress: number; icon: string };
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <span className="mr-1">👁️</span>
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📄</span>
            <span>{getServiceName(application.service_template_id)}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant="outline" className={getStatusInfo(application.status).color}>
                {getStatusInfo(application.status).label}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nomor Dokumen</p>
              <p className="text-sm">{application.document_number || 'Belum ada'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Data Formulir</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(application.form_data, null, 2)}
              </pre>
            </div>
          </div>

          {application.rt_rw_review_notes && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Catatan RT/RW</p>
              <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">
                {application.rt_rw_review_notes}
              </p>
            </div>
          )}

          {application.village_processing_notes && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Catatan Kelurahan</p>
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                {application.village_processing_notes}
              </p>
            </div>
          )}

          {application.village_head_notes && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Catatan Kepala Desa</p>
              <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                {application.village_head_notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
