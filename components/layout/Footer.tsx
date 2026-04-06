import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex flex-col gap-3 mb-3">
              <Image src="/Logo/OJT Connect Ph logo.jpg" alt="OJT Connect PH" width={100} height={44} className="h-11 w-auto object-contain" />
              <Image src="/Logo/Work24-PH-Logo-Transparent.png" alt="Work24 PH" width={100} height={44} className="h-11 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The free internship platform connecting Filipino students with companies and schools across the Philippines.
            </p>
          </div>

          {/* For Students */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">For Students</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/register?type=student" className="hover:text-white transition-colors">Create Profile</Link></li>
              <li><Link href="/wall?type=internship" className="hover:text-white transition-colors">Find Internships</Link></li>
              <li><Link href="/student/verification" className="hover:text-white transition-colors">Get Verified</Link></li>
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">For Companies</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/register?type=company" className="hover:text-white transition-colors">Post Internship</Link></li>
              <li><Link href="/wall?type=intern" className="hover:text-white transition-colors">Search Interns</Link></li>
              <li><Link href="/company/connections" className="hover:text-white transition-colors">Manage Connections</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Platform</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/wall" className="hover:text-white transition-colors">Internship Wall</Link></li>
              <li><Link href="/register?type=university" className="hover:text-white transition-colors">Register School</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2026 OJT Connect PH. All rights reserved.</p>
          <p className="text-xs text-gray-500">Free for all Filipino students and schools.</p>
        </div>
      </div>
    </footer>
  );
}
