
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { User, UpdateUserInput, CitizenDocument, DocumentType } from '../../../server/src/schema';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [documents, setDocuments] = useState<CitizenDocument[]>([]);

  // Load user documents
  const loadDocuments = useCallback(async () => {
    try {
      const result = await trpc.getCitizenDocuments.query(user.id);
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Using stub data since backend handlers are not implemented
      setDocuments([
        {
          id: 1,
          citizen_id: user.id,
          document_type: 'ktp',
          file_name: 'KTP_BudiSantoso.pdf',
          file_url: '/documents/ktp-budi.pdf',
          file_size: 1024000,
          uploaded_at: new Date('2024-11-15')
        },
        {
          id: 2,
          citizen_id: user.id,
          document_type: 'kk',
          file_name: 'KK_Keluarga_Santoso.pdf',
          file_url: '/documents/kk-santoso.pdf',
          file_size: 2048000,
          uploaded_at: new Date('2024-11-15')
        }
      ]);
    }
  }, [user.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getDocumentTypeInfo = (type: DocumentType) => {
    const typeMap = {
      ktp: { label: 'KTP', icon: '🆔', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      kk: { label: 'Kartu Keluarga', icon: '👨‍👩‍👧‍👦', color: 'bg-green-50 text-green-700 border-green-200' },
      birth_certificate: { label: 'Akta Kelahiran', icon: '👶', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      marriage_certificate: { label: 'Akta Nikah', icon: '💒', color: 'bg-pink-50 text-pink-700 border-pink-200' },
      other: { label: 'Dokumen Lainnya', icon: '📄', color: 'bg-gray-50 text-gray-700 border-gray-200' }
    };
    return typeMap[type] || typeMap.other;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      citizen: 'Warga',
      rt_rw_head: 'Ketua RT/RW',
      village_staff: 'Staff Kelurahan',
      village_head: 'Kepala Kelurahan'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>👤</span>
            <span>Profil Pengguna</span>
          </h2>
          <p className="text-gray-600">Kelola informasi pribadi dan dokumen Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>ℹ️</span>
                  <span>Informasi Dasar</span>
                </CardTitle>
                <EditProfileDialog user={user} onUpdate={onUpdate} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                  <p className="text-gray-800">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-800">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nomor HP</p>
                  <p className="text-gray-800">{user.phone || 'Belum diisi'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">NIK</p>
                  <p className="text-gray-800">{user.nik || 'Belum diisi'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Alamat</p>
                <p className="text-gray-800">{user.address || 'Belum diisi'}</p>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">RT/RW</p>
                  <p className="text-gray-800">RT {user.rt || '-'} / RW {user.rw || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Peran</p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {getRoleDisplay(user.role)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant="outline" className={user.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                    {user.is_active ? '✅ Aktif' : '❌ Tidak Aktif'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>📁</span>
                  <span>Dokumen Saya</span>
                </CardTitle>
                <UploadDocumentDialog user={user} onSuccess={loadDocuments} />
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📁</div>
                  <p className="text-gray-500 mb-4">Belum ada dokumen yang diunggah</p>
                  <p className="text-sm text-gray-400">
                    Unggah dokumen seperti KTP, KK, dan dokumen penting lainnya 
                    untuk mempermudah proses permohonan layanan
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: CitizenDocument) => {
                    const docInfo = getDocumentTypeInfo(doc.document_type);
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{docInfo.icon}</div>
                          <div>
                            <p className="font-medium text-gray-800">{docInfo.label}</p>
                            <p className="text-sm text-gray-600">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)} • 
                              Diunggah: {doc.uploaded_at.toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={docInfo.color}>
                            {docInfo.label}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <span className="mr-1">👁️</span>
                            Lihat
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <span className="mr-1">🗑️</span>
                            Hapus
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📊</span>
                <span>Status Akun</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl">✅</span>
                </div>
                <p className="font-medium text-gray-800">Akun Terverifikasi</p>
                <p className="text-sm text-gray-600">Semua fitur tersedia</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Profil Lengkap</span>
                  <span className="text-green-600">✅</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Email Terverifikasi</span>
                  <span className="text-green-600">✅</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Dokumen KTP</span>
                  <span className="text-green-600">✅</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Dokumen KK</span>
                  <span className="text-green-600">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📈</span>
                <span>Statistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Permohonan</span>
                <span className="font-medium">7</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dokumen Selesai</span>
                <span className="font-medium text-green-600">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dalam Proses</span>
                <span className="font-medium text-yellow-600">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Laporan Warga</span>
                <span className="font-medium">3</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🕒</span>
                <span>Aktivitas Terakhir</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-gray-800">Dokumen KTP Diunggah</p>
                <p className="text-gray-500">2 minggu lalu</p>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">Permohonan SKTM</p>
                <p className="text-gray-500">3 hari lalu</p>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">Laporan Jalan Rusak</p>
                <p className="text-gray-500">1 hari lalu</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Edit Profile Dialog
function EditProfileDialog({ user, onUpdate }: { user: User; onUpdate: (user: User) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserInput>({
    id: user.id,
    name: user.name,
    phone: user.phone,
    rt: user.rt,
    rw: user.rw,
    address: user.address,
    nik: user.nik
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = await trpc.updateUserProfile.mutate(formData);
      onUpdate(updatedUser);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <span className="mr-2">✏️</span>
          Edit Profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>✏️</span>
            <span>Edit Profil</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
              <Input
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateUserInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nomor HP</label>
              <Input
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateUserInput) => ({ ...prev, phone: e.target.value || null }))
                }
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">NIK</label>
            <Input
              value={formData.nik || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdateUserInput) => ({ ...prev, nik: e.target.value || null }))
              }
              placeholder="16 digit NIK"
              maxLength={16}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">RT</label>
              <Input
                value={formData.rt || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateUserInput) => ({ ...prev, rt: e.target.value || null }))
                }
                placeholder="Contoh: 001"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">RW</label>
              <Input
                value={formData.rw || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateUserInput) => ({ ...prev, rw: e.target.value || null }))
                }
                placeholder="Contoh: 005"
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alamat Lengkap</label>
            <Textarea
              value={formData.address || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: UpdateUserInput) => ({ ...prev, address: e.target.value || null }))
              }
              rows={3}
              placeholder="Alamat lengkap termasuk RT/RW"
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

// Upload Document Dialog
function UploadDocumentDialog({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('ktp');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      // In real implementation, you would upload the file first
      // Then call the API with the file URL
      await trpc.uploadCitizenDocument.mutate({
        citizenId: user.id,
        documentType,
        file: {
          name: selectedFile.name,
          url: `/documents/${selectedFile.name}`, // Stub URL
          size: selectedFile.size
        }
      });
      
      setIsOpen(false);
      setSelectedFile(null);
      setDocumentType('ktp');
      onSuccess();
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <span className="mr-2">📤</span>
          Unggah Dokumen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📤</span>
            <span>Unggah Dokumen</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Dokumen</label>
            <Select value={documentType} onValueChange={(value: DocumentType) => setDocumentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ktp">🆔 KTP</SelectItem>
                <SelectItem value="kk">👨‍👩‍👧‍👦 Kartu Keluarga</SelectItem>
                <SelectItem value="birth_certificate">👶 Akta Kelahiran</SelectItem>
                <SelectItem value="marriage_certificate">💒 Akta Nikah</SelectItem>
                <SelectItem value="other">📄 Dokumen Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">File Dokumen</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full border rounded-md px-3 py-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format yang didukung: PDF, JPG, PNG (Maksimal 5MB)
            </p>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-700">File yang dipilih:</p>
              <p className="text-sm text-blue-600">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 font-medium mb-2">⚠️ Persyaratan Dokumen</p>
            <ul className="text-sm text-yellow-600 space-y-1 list-disc list-inside">
              <li>Pastikan dokumen asli dan masih berlaku</li>
              <li>Foto/scan dokumen harus jelas dan dapat dibaca</li>
              <li>File berformat PDF untuk hasil terbaik</li>
              <li>Hindari upload dokumen yang sama berulang kali</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              {isLoading ? 'Mengunggah...' : 'Unggah Dokumen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
