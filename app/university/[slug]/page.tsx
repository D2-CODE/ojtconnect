import { redirect } from 'next/navigation';

export default async function UniversityRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/university/home/${slug}`);
}
