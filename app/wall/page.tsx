'use client';
import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PostCard } from '@/components/cards/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, FileText, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const TABS = [
  { label: 'All Posts', value: 'all' },
  { label: 'Student Post', value: 'intern' },
  { label: 'Company Post', value: 'internship' },
];

const VALID_TYPES = ['intern', 'internship'];

const TIME_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

function getDateFrom(period: string): string | null {
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.toISOString();
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString();
  }
  return null;
}

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
  const [hasContact, setHasContact] = useState(false);
  const [timePeriod, setTimePeriod] = useState('all');
  const [timeOpen, setTimeOpen] = useState(false);
  const timeRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) setTimeOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      if (hasContact) params.set('hasContact', 'true');
      const dateFrom = getDateFrom(timePeriod);
      if (dateFrom) params.set('dateFrom', dateFrom);
      const res = await fetch(`/api/wall?${params}`);
      const data = await res.json();
      if (data.success) { setPosts(data.data); setTotal(data.meta.total); }
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, hasContact, timePeriod, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
        <div className="w-full overflow-x-auto pb-1 md:w-auto md:flex-1">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={(v) => {
            setActiveTab(v);
            setPage(1);
            const params = new URLSearchParams(searchParams.toString());
            if (v === 'all') params.delete('type'); else params.set('type', v);
            router.push(`/wall?${params}`);
          }} />
        </div>
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, skills, location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
          />
        </div>
        {/* Time Period Dropdown */}
        <div className="relative w-full md:w-auto" ref={timeRef}>
          <button
            onClick={() => setTimeOpen(o => !o)}
            className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-[10px] transition-colors md:w-auto md:justify-start ${
              timePeriod !== 'all'
                ? 'border-[#0F6E56] bg-[#E8F5F1] text-[#0F6E56] font-medium'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <span>{TIME_OPTIONS.find(o => o.value === timePeriod)?.label ?? 'All Time'}</span>
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${timeOpen ? 'rotate-180' : ''}`} />
          </button>
          {timeOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden md:left-auto md:right-0 md:w-40">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setTimePeriod(opt.value); setPage(1); setTimeOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    timePeriod === opt.value
                      ? 'bg-[#E8F5F1] text-[#0F6E56] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative w-full md:w-auto" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(o => !o)}
            className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-[10px] transition-colors md:w-auto md:justify-start ${
              hasContact
                ? 'border-[#0F6E56] bg-[#E8F5F1] text-[#0F6E56] font-medium'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasContact && <span className="bg-[#0F6E56] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">1</span>}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 w-full min-w-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-3 md:left-auto md:right-0 md:w-56">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
                {hasContact && (
                  <button
                    onClick={() => { setHasContact(false); setPage(1); setFilterOpen(false); }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <button
                onClick={() => { setHasContact(v => !v); setPage(1); }}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  hasContact ? 'bg-[#E8F5F1]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm text-gray-700 font-medium">Has Contact</p>
                  <p className="text-xs text-gray-400">Email or phone available</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  hasContact ? 'bg-[#0F6E56]' : 'bg-gray-200'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${
                    hasContact ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </div>
              </button>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500 md:ml-auto">{total} posts</span>
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
            <h3 className="font-semibold text-gray-900 mb-2">Are you a school?</h3>
            <p className="text-sm text-gray-500 mb-4">Register your school to verify your students and boost their credibility.</p>
            <Link href="/register?type=university" className="block border border-[#0F6E56] text-[#0F6E56] text-sm font-semibold text-center py-2.5 rounded-[10px] hover:bg-[#E8F5F1] transition-colors">Register School</Link>
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