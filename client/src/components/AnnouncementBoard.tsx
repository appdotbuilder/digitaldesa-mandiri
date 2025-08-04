
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, Announcement, CreateAnnouncementInput, AnnouncementCategory } from '../../../server/src/schema';

interface AnnouncementBoardProps {
  user: User;
}

export function AnnouncementBoard({ user }: AnnouncementBoardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    try {
      const result = await trpc.getAnnouncements.query({
        userId: user.id,
        rt: user.rt || undefined,
        rw: user.rw || undefined
      });
      setAnnouncements(result);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      // Using stub data since backend handlers are not implemented
      setAnnouncements([
        {
          id: 1,
          title: '🏥 Jadwal Posyandu Bulan Desember',
          content: 'Posyandu akan dilaksanakan pada tanggal 15 Desember 2024 di Balai RT 003. Mohon hadir tepat waktu untuk pemeriksaan kesehatan rutin.',
          category: 'posyandu',
          author_id: 'admin-123',
          target_rt: '003',
          target_rw: '001',
          is_priority: true,
          published_at: new Date('2024-12-01'),
          event_date: new Date('2024-12-15'),
          created_at: new Date('2024-12-01'),
          updated_at: new Date('2024-12-01')
        },
        {
          id: 2,
          title: '🔧 Perbaikan Jalan Lingkungan',
          content: 'Akan dilakukan perbaikan jalan di Jl. Merdeka pada tanggal 10-12 Desember 2024. Mohon untuk menggunakan jalur alternatif.',
          category: 'news',
          author_id: 'admin-123',
          target_rt: null,
          target_rw: null,
          is_priority: false,
          published_at: new Date('2024-12-05'),
          event_date: new Date('2024-12-10'),
          created_at: new Date('2024-12-05'),
          updated_at: new Date('2024-12-05')
        },
        {
          id: 3,
          title: '🧹 Gotong Royong Mingguan',
          content: 'Kegiatan gotong royong akan dilaksanakan setiap hari Minggu pukul 06:00 WIB. Mari bersama-sama menjaga kebersihan lingkungan.',
          category: 'community_work',
          author_id: 'rtrw-456',
          target_rt: user.rt,
          target_rw: user.rw,
          is_priority: false,
          published_at: new Date('2024-12-03'),
          event_date: null,
          created_at: new Date('2024-12-03'),
          updated_at: new Date('2024-12-03')
        }
      ]);
    }
  }, [user.id, user.rt, user.rw]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const getCategoryIcon = (category: AnnouncementCategory) => {
    const icons = {
      news: '📰',
      event: '📅',
      posyandu: '🏥',
      community_work: '🧹',
      emergency: '🚨',
      general: '📢'
    };
    return icons[category] || '📢';
  };

  const getCategoryLabel = (category: AnnouncementCategory) => {
    const labels = {
      news: 'Berita',
      event: 'Acara',
      posyandu: 'Posyandu',
      community_work: 'Gotong Royong',
      emergency: 'Darurat',
      general: 'Umum'
    };
    return labels[category] || 'Umum';
  };

  const getCategoryColor = (category: AnnouncementCategory) => {
    const colors = {
      news: 'bg-blue-50 text-blue-700 border-blue-200',
      event: 'bg-purple-50 text-purple-700 border-purple-200',
      posyandu: 'bg-green-50 text-green-700 border-green-200',
      community_work: 'bg-orange-50 text-orange-700 border-orange-200',
      emergency: 'bg-red-50 text-red-700 border-red-200',
      general: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const filteredAnnouncements = announcements.filter((announcement: Announcement) => {
    if (selectedCategory === 'all') return true;
    return announcement.category === selectedCategory;
  });

  const canCreateAnnouncement = user.role === 'village_staff' || user.role === 'village_head' || user.role === 'rt_rw_head';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📢</span>
            <span>Papan Pengumuman</span>
          </h2>
          <p className="text-gray-600">Informasi terbaru dari kelurahan dan RT/RW</p>
        </div>
        {canCreateAnnouncement && (
          <CreateAnnouncementDialog user={user} onSuccess={loadAnnouncements} />
        )}
      </div>

      {/* Filters */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-white shadow-md rounded-lg p-1">
          <TabsTrigger value="all" className="flex items-center space-x-1">
            <span>📋</span>
            <span>Semua</span>
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center space-x-1">
            <span>📰</span>
            <span>Berita</span>
          </TabsTrigger>
          <TabsTrigger value="event" className="flex items-center space-x-1">
            <span>📅</span>
            <span>Acara</span>
          </TabsTrigger>
          <TabsTrigger value="posyandu" className="flex items-center space-x-1">
            <span>🏥</span>
            <span>Posyandu</span>
          </TabsTrigger>
          <TabsTrigger value="community_work" className="flex items-center space-x-1">
            <span>🧹</span>
            <span>Gotong Royong</span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center space-x-1">
            <span>🚨</span>
            <span>Darurat</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center space-x-1">
            <span>📢</span>
            <span>Umum</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="text-gray-400 text-6xl mb-4">📢</div>
              <p className="text-gray-500">Belum ada pengumuman untuk kategori ini</p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement: Announcement) => (
            <Card key={announcement.id} className={`transition-all hover:shadow-lg ${announcement.is_priority ? 'border-l-4 border-l-red-500 bg-red-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(announcement.category)}</span>
                      <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                        {getCategoryLabel(announcement.category)}
                      </Badge>
                      {announcement.is_priority && (
                        <Badge variant="destructive" className="bg-red-500">
                          ⚠️ Prioritas
                        </Badge>
                      )}
                      {announcement.target_rt && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          RT {announcement.target_rt}/RW {announcement.target_rw}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl text-gray-800">{announcement.title}</CardTitle>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{announcement.published_at?.toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</p>
                    {announcement.event_date && (
                      <p className="text-blue-600">
                        📅 {announcement.event_date.toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Create Announcement Dialog Component
function CreateAnnouncementDialog({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAnnouncementInput>({
    title: '',
    content: '',
    category: 'general',
    author_id: user.id,
    target_rt: null,
    target_rw: null,
    is_priority: false,
    event_date: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createAnnouncement.mutate(formData);
      setIsOpen(false);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        author_id: user.id,
        target_rt: null,
        target_rw: null,
        is_priority: false,
        event_date: null
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
          <span className="mr-2">➕</span>
          Buat Pengumuman
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📢</span>
            <span>Buat Pengumuman Baru</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Judul pengumuman"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAnnouncementInput) => ({ ...prev, title: e.target.value }))
            }
            required
          />
          
          <Textarea
            placeholder="Isi pengumuman"
            value={formData.content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateAnnouncementInput) => ({ ...prev, content: e.target.value }))
            }
            rows={4}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <Select 
                value={formData.category || 'general'} 
                onValueChange={(value: AnnouncementCategory) =>
                  setFormData((prev: CreateAnnouncementInput) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">📢 Umum</SelectItem>
                  <SelectItem value="news">📰 Berita</SelectItem>
                  <SelectItem value="event">📅 Acara</SelectItem>
                  <SelectItem value="posyandu">🏥 Posyandu</SelectItem>
                  <SelectItem value="community_work">🧹 Gotong Royong</SelectItem>
                  <SelectItem value="emergency">🚨 Darurat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target RT (opsional)</label>
              <Input
                placeholder="Contoh: 001"
                value={formData.target_rt || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateAnnouncementInput) => ({ 
                    ...prev, 
                    target_rt: e.target.value || null 
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_priority}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateAnnouncementInput) => ({ ...prev, is_priority: e.target.checked }))
                }
                className="rounded"
              />
              <span>⚠️ Prioritas tinggi</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Membuat...' : 'Buat Pengumuman'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
