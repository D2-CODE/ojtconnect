'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PostCard } from '@/components/cards/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, FileText } from 'lucide-react';
import Link from 'next/link';

const TABS = [
  { label: 'All Posts', value: 'all' },
  { label: 'Seeking OJT', value: 'intern' },
  { label: 'Offering Internship', value: 'internship' },
];

const VALID_TYPES = ['intern', 'internship'];

function PostListingWidget() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (session?.user) {
    const wallUrl = session.user.roleName === 'student' ? '/student/wall' : '/company/wall';
    return (
      <div className="bg-[#E8F5F1] rounded-2xl p-5">
        <h3 className="font-semibold text-[#0F6E56] mb-2">Post Your Listing</h3>
        <p className="text-sm text-gray-600 mb-4">Manage your OJT listings and reach the right people.</p>
        <Link href={wallUrl} className="block bg-[#0F6E56] text-white text-sm font-semibold text-center py-2.5 rounded-[10px] hover:bg-[#0A5A45] transition-colors">Go to My Listings</Link>
      </div>
    );
  }
  return (
    <div className="bg-[#E8F5F1] rounded-2xl p-5">
      <h3 className="font-semibold text-[#0F6E56] mb-2">Post Your Listing</h3>
      <p className="text-sm text-gray-600 mb-4">Create an account to post your OJT or internship listing.</p>
      <Link href="/register" className="block bg-[#0F6E56] text-white text-sm font-semibold text-center py-2.5 rounded-[10px] hover:bg-[#0A5A45] transition-colors">Get Started Free</Link>
    </div>
  );
}

function WallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type') ?? 'all';
  const initialTab = VALID_TYPES.includes(typeParam) ? typeParam : 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = searchParams.get('type') ?? 'all';
    setActiveTab(VALID_TYPES.includes(t) ? t : 'all');
    setPage(1);
  }, [searchParams]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (activeTab !== 'all') params.set('type', activeTab);
      if (search) params.set('search', search);
      const res = await fetch(`/api/wall?${params}`);
      const data = await res.json();
      if (data.success) { setPosts(data.data); setTotal(data.meta.total); }
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={(v) => {
          setActiveTab(v);
          setPage(1);
          const params = new URLSearchParams(searchParams.toString());
          if (v === 'all') params.delete('type'); else params.set('type', v);
          router.push(`/wall?${params}`);
        }} />
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, skills, location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
          />
        </div>
        <span className="text-sm text-gray-500">{total} posts</span>
      </div>

      <div className="flex gap-8">
        {/* Main grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : posts.length === 0 ? (
            <EmptyState title="No posts found" description="Try adjusting your search or filters." icon={FileText} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {posts.map((post: any) => <PostCard key={post._id} post={post} />)}
              </div>
              <div className="flex justify-center">
                <Pagination total={total} page={page} limit={12} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0">
          <PostListingWidget />
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Are you a university?</h3>
            <p className="text-sm text-gray-500 mb-4">Register your university to verify your students and boost their credibility.</p>
            <Link href="/register?type=university" className="block border border-[#0F6E56] text-[#0F6E56] text-sm font-semibold text-center py-2.5 rounded-[10px] hover:bg-[#E8F5F1] transition-colors">Register University</Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function WallPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-5 lg:px-20 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OJT Opportunity Wall</h1>
          <p className="text-gray-500 mt-1">Browse internship opportunities and students seeking OJT</p>
        </div>
        <Suspense fallback={<div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>}>
          <WallContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
