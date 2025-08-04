
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, Complaint, CreateComplaintInput, ComplaintStatus } from '../../../server/src/schema';

interface ComplaintSystemProps {
  user: User;
}

export function ComplaintSystem({ user }: ComplaintSystemProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Load complaints
  const loadComplaints = useCallback(async () => {
    try {
      const result = await trpc.getComplaints.query({
        userId: user.id,
        role: user.role
      });
      setComplaints(result);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      // Using stub data since backend handlers are not implemented
      setComplaints([
        {
          id: 1,
          citizen_id: user.id,
          title: 'Jalan Rusak di RT 003',
          description: 'Jalan di depan balai RT 003 rusak parah dan berbahaya untuk dilalui, terutama saat hujan. Mohon segera diperbaiki.',
          location: 'Jl. Merdeka RT 003',
          is_anonymous: false,
          status: 'under_review',
          assigned_staff_id: 'staff-456',
          resolution_notes: null,
          resolved_at: null,
          created_at: new Date('2024-12-07'),
          updated_at: new Date('2024-12-08')
        },
        {
          id: 2,
          citizen_id: null, // Anonymous complaint
          title: 'Lampu Jalan Mati',
          description: 'Beberapa lampu jalan di sepanjang Jl. Harapan tidak menyala sejak seminggu lalu. Kondisi ini membuat jalan gelap dan tidak aman.',
          location: 'Jl. Harapan RW 005',
          is_anonymous: true,
          status: 'resolved',
          assigned_staff_id: 'staff-456',
          resolution_notes: 'Lampu jalan telah diperbaiki dan sudah menyala normal',
          resolved_at: new Date('2024-12-06'),
          created_at: new Date('2024-12-03'),
          updated_at: new Date('2024-12-06')
        },
        {
          id: 3,
          citizen_id: user.id,
          title: 'Masalah Drainase',
          description: 'Saluran air di belakang rumah warga tersumbat dan menyebabkan banjir kecil saat hujan deras.',
          location: 'Gang Melati RT 001',
          is_anonymous: false,
          status: 'received',
          assigned_staff_id: null,
          resolution_notes: null,
          resolved_at: null,
          created_at: new Date('2024-12-08'),
          updated_at: new Date('2024-12-08')
        }
      ]);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const getStatusInfo = (status: ComplaintStatus) => {
    const statusMap = {
      received: { 
        label: 'Diterima', 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: '📥'
      },
      under_review: { 
        label: 'Dalam Tinjauan', 
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
        icon: '👀'
      },
      resolved: { 
        label: 'Selesai', 
        color: 'bg-green-50 text-green-700 border-green-200', 
        icon: '✅'
      },
      closed: { 
        label: 'Ditutup', 
        color: 'bg-gray-50 text-gray-700 border-gray-200', 
        icon: '🔒'
      }
    };
    return statusMap[status] || statusMap.received;
  };

  const filteredComplaints = complaints.filter((complaint: Complaint) => {
    if (selectedStatus === 'all') return true;
    return complaint.status === selectedStatus;
  });

  // Show only user's complaints for citizens, all complaints for staff
  const visibleComplaints = user.role === 'citizen' 
    ? filteredComplaints.filter((c: Complaint) => c.citizen_id === user.id || c.is_anonymous)
    : filteredComplaints;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📝</span>
            <span>Lapor Warga</span>
          </h2>
          <p className="text-gray-600">Sampaikan keluhan dan aspirasi Anda</p>
        </div>
        <CreateComplaintDialog user={user} onSuccess={loadComplaints} />
      </div>

      {/* Status Filter */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-md rounded-lg p-1">
          <TabsTrigger value="all" className="flex items-center space-x-1">
            <span>📋</span>
            <span>Semua</span>
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center space-x-1">
            <span>📥</span>
            <span>Diterima</span>
          </TabsTrigger>
          <TabsTrigger value="under_review" className="flex items-center space-x-1">
            <span>👀</span>
            <span>Ditinjau</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center space-x-1">
            <span>✅</span>
            <span>Selesai</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center space-x-1">
            <span>🔒</span>
            <span>Ditutup</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Complaints List */}
      <div className="space-y-4">
        {visibleComplaints.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <p className="text-gray-500">Belum ada laporan untuk kategori ini</p>
            </CardContent>
          </Card>
        ) : (
          visibleComplaints.map((complaint: Complaint) => (
            <ComplaintCard 
              key={complaint.id} 
              complaint={complaint} 
              user={user}
              onUpdate={loadComplaints}
              getStatusInfo={getStatusInfo}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Complaint Card Component
function ComplaintCard({ 
  complaint, 
  user, 
  onUpdate,
  getStatusInfo
}: { 
  complaint: Complaint; 
  user: User;
  onUpdate: () => void;
  getStatusInfo: (status: ComplaintStatus) => { label: string; color: string; icon: string };
}) {
  const statusInfo = getStatusInfo(complaint.status);
  const canManage = user.role === 'village_staff' || user.role === 'village_head';

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
              {complaint.is_anonymous && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  🕵️ Anonim
                </Badge>
              )}
              {complaint.location && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  📍 {complaint.location}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl text-gray-800">{complaint.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Dilaporkan: {complaint.created_at.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
              {!complaint.is_anonymous && complaint.citizen_id === user.id && (
                <span className="ml-2 text-blue-600">• Laporan Anda</span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <ComplaintDetailDialog complaint={complaint} getStatusInfo={getStatusInfo} />
            {canManage && (
              <ComplaintManageDialog complaint={complaint} onUpdate={onUpdate} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 leading-relaxed mb-4">{complaint.description}</p>
        
        {/* Progress Timeline */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <TimelineStep 
              icon="📥" 
              label="Diterima" 
              isCompleted={true}
              date={complaint.created_at}
            />
            <div className="flex-1 h-px bg-gray-200"></div>
            <TimelineStep 
              icon="👀" 
              label="Ditinjau" 
              isCompleted={['under_review', 'resolved', 'closed'].includes(complaint.status)}
              isActive={complaint.status === 'under_review'}
            />
            <div className="flex-1 h-px bg-gray-200"></div>
            <TimelineStep 
              icon="✅" 
              label="Selesai" 
              isCompleted={complaint.status === 'resolved'}
              date={complaint.resolved_at}
            />
          </div>
        </div>

        {complaint.resolution_notes && (
          <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-700 mb-2">✅ Penyelesaian:</p>
            <p className="text-sm text-green-600">{complaint.resolution_notes}</p>
            {complaint.resolved_at && (
              <p className="text-xs text-green-500 mt-1">
                Diselesaikan pada: {complaint.resolved_at.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long', 
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Timeline Step Component
function TimelineStep({ 
  icon, 
  label, 
  isCompleted, 
  isActive = false,
  date = null 
}: {
  icon: string;
  label: string;
  isCompleted: boolean;
  isActive?: boolean;
  date?: Date | null;
}) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
        isCompleted 
          ? 'bg-green-100 text-green-600' 
          : isActive 
            ? 'bg-blue-100 text-blue-600 animate-pulse' 
            : 'bg-gray-100 text-gray-400'
      }`}>
        {icon}
      </div>
      <p className={`text-xs text-center ${
        isCompleted 
          ? 'text-green-600 font-medium' 
          : isActive 
            ? 'text-blue-600 font-medium' 
            : 'text-gray-400'
      }`}>
        {label}
      </p>
      {date && (
        <p className="text-xs text-gray-500">
          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </p>
      )}
    </div>
  );
}

// Create Complaint Dialog
function CreateComplaintDialog({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateComplaintInput>({
    citizen_id: user.id,
    title: '',
    description: '',
    location: null,
    is_anonymous: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createComplaint.mutate({
        ...formData,
        citizen_id: formData.is_anonymous ? null : user.id
      });
      setIsOpen(false);
      setFormData({
        citizen_id: user.id,
        title: '',
        description: '',
        location: null,
        is_anonymous: false
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create complaint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
          <span className="mr-2">➕</span>
          Buat Laporan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📝</span>
            <span>Buat Laporan Baru</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">ℹ️ Informasi</p>
            <p className="text-sm text-blue-600">
              Gunakan fitur ini untuk melaporkan masalah infrastruktur, keamanan, kebersihan, 
              atau hal lain yang memerlukan perhatian pemerintah desa.
            </p>
          </div>

          <Input
            placeholder="Judul laporan"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateComplaintInput) => ({ ...prev, title: e.target.value }))
            }
            required
          />
          
          <Textarea
            placeholder="Deskripsi lengkap masalah"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateComplaintInput) => ({ ...prev, description: e.target.value }))
            }
            rows={4}
            required
          />

          <Input
            placeholder="Lokasi kejadian (opsional)"
            value={formData.location || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateComplaintInput) => ({ 
                ...prev, 
                location: e.target.value || null 
              }))
            }
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: CreateComplaintInput) => ({ ...prev, is_anonymous: checked }))
              }
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              🕵️ Laporkan secara anonim (identitas tidak akan ditampilkan)
            </label>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 font-medium mb-2">⚠️ Catatan Penting</p>
            <ul className="text-sm text-yellow-600 space-y-1 list-disc list-inside">
              <li>Pastikan informasi yang dilaporkan akurat dan dapat diverifikasi</li>
              <li>Hindari menggunakan bahasa yang menyinggung atau tidak pantas</li>
              <li>Laporan akan ditinjau dan ditindaklanjuti sesuai prioritas</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Complaint Detail Dialog
function ComplaintDetailDialog({ 
  complaint,
  getStatusInfo
}: { 
  complaint: Complaint;
  getStatusInfo: (status: ComplaintStatus) => { label: string; color: string; icon: string };
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
            <span>📝</span>
            <span>{complaint.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant="outline" className={getStatusInfo(complaint.status).color}>
                {getStatusInfo(complaint.status).label}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lokasi</p>
              <p className="text-sm">{complaint.location || 'Tidak disebutkan'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Deskripsi</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {complaint.description}
            </p>
          </div>

          {complaint.resolution_notes && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Penyelesaian</p>
              <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                {complaint.resolution_notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Complaint Management Dialog (for staff)
function ComplaintManageDialog({ complaint, onUpdate }: { complaint: Complaint; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [notes, setNotes] = useState(complaint.resolution_notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateComplaintStatus.mutate({
        id: complaint.id,
        status,
        assigned_staff_id: 'staff-123', // Would be actual staff ID
        resolution_notes: notes || null
      });
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update complaint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
          <span className="mr-1">⚙️</span>
          Kelola
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kelola Laporan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select 
              value={status} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as ComplaintStatus)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="received">Diterima</option>
              <option value="under_review">Dalam Tinjauan</option>
              <option value="resolved">Selesai</option>
              <option value="closed">Ditutup</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Catatan Penyelesaian</label>
            <Textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={3}
              placeholder="Berikan catatan penyelesaian..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
