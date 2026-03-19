import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="text-center max-w-md">
          <div className="text-8xl font-extrabold text-[#0F6E56] mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/"><Button variant="primary">Go Home</Button></Link>
            <Link href="/wall"><Button variant="outline">Browse Wall</Button></Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
