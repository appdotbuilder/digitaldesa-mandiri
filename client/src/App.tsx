
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementBoard } from '@/components/AnnouncementBoard';
import { ApplicationTracker } from '@/components/ApplicationTracker';
import { ServiceCatalog } from '@/components/ServiceCatalog';
import { ComplaintSystem } from '@/components/ComplaintSystem';
import { UserProfile } from '@/components/UserProfile';
import { AdminDashboard } from '@/components/AdminDashboard';
import type { User } from '../../server/src/schema';

// User data from authentication system
const initialUser: User = {
  id: 'user-123',
  email: 'citizen@example.com',
  name: 'Budi Santoso',
  phone: '081234567890',
  role: 'citizen',
  rt: '001',
  rw: '005',
  address: 'Jl. Merdeka No. 123',
  nik: '3201234567890001',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

function App() {
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState('dashboard');

  const getDashboardContent = () => {
    switch (user.role) {
      case 'citizen':
        return <CitizenDashboard />;
      case 'rt_rw_head':
        return <RTRWDashboard />;
      case 'village_staff':
      case 'village_head':
        return <AdminDashboard user={user} />;
      default:
        return <CitizenDashboard />;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-green-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">🏛️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">DigitalDesa Mandiri</h1>
                <p className="text-sm text-gray-600">Platform Digital Administrasi Kelurahan</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {getRoleDisplay(user.role)}
              </Badge>
              <div className="text-right">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-600">RT {user.rt}/RW {user.rw}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-md rounded-lg p-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <span>🏠</span>
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <span>📋</span>
              <span>Layanan</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center space-x-2">
              <span>📄</span>
              <span>Permohonan</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center space-x-2">
              <span>📢</span>
              <span>Pengumuman</span>
            </TabsTrigger>
            <TabsTrigger value="complaints" className="flex items-center space-x-2">
              <span>📝</span>
              <span>Lapor Warga</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <span>👤</span>
              <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {getDashboardContent()}
          </TabsContent>

          <TabsContent value="services">
            <ServiceCatalog user={user} />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationTracker user={user} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementBoard user={user} />
          </TabsContent>

          <TabsContent value="complaints">
            <ComplaintSystem user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile user={user} onUpdate={setUser} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Citizen Dashboard Component
function CitizenDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>Permohonan Aktif</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">2</div>
          <p className="opacity-90">sedang diproses</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>✅</span>
            <span>Dokumen Selesai</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">5</div>
          <p className="opacity-90">siap diambil</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📝</span>
            <span>Laporan Warga</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1</div>
          <p className="opacity-90">dalam penanganan</p>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🕒</span>
            <span>Aktivitas Terbaru</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Surat Keterangan Domisili</p>
                <p className="text-sm text-gray-600">Sedang ditinjau RT/RW • 2 jam lalu</p>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                RT/RW Review
              </Badge>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Surat Keterangan Usaha</p>
                <p className="text-sm text-gray-600">Dokumen siap diambil • 1 hari lalu</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Selesai
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>Aksi Cepat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <span className="text-xl">📋</span>
              <span>Ajukan Layanan</span>
            </Button>
            <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
              <span className="text-xl">📄</span>
              <span>Cek Status</span>
            </Button>
            <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
              <span className="text-xl">📝</span>
              <span>Lapor Warga</span>
            </Button>
            <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <span className="text-xl">📢</span>
              <span>Pengumuman</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// RT/RW Dashboard Component
function RTRWDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Pending Reviews */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⏳</span>
            <span>Menunggu Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">4</div>
          <p className="opacity-90">permohonan baru</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>✅</span>
            <span>Disetujui Bulan Ini</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">23</div>
          <p className="opacity-90">permohonan</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>👥</span>
            <span>Warga RT 001</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">156</div>
          <p className="opacity-90">total warga</p>
        </CardContent>
      </Card>

      {/* Pending Applications */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>Permohonan Menunggu Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <p className="font-medium">Surat Keterangan Domisili</p>
                <p className="text-sm text-gray-600">Andi Wijaya • Diajukan 3 jam lalu</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                  Tolak
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Setujui
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <p className="font-medium">Surat Keterangan Tidak Mampu</p>
                <p className="text-sm text-gray-600">Siti Rahma • Diajukan 5 jam lalu</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                  Tolak
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Setujui
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
