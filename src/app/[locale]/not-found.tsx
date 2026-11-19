import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-serif text-sumi-dark dark:text-sumi-light mb-4">404 - Sanctuary Not Found</h1>
      <p className="text-stone-500 mb-8">The tranquil space you are looking for does not exist.</p>
      <Link href="/" className="px-5 py-2.5 rounded-full bg-sumi-dark text-washi-paper dark:bg-sumi-light dark:text-sumi-dark transition-colors">
        Return to Tranquility
      </Link>
    </div>
  );
}
