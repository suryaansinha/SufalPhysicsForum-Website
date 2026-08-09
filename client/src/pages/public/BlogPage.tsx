import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CalendarDays, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';

const WORDPRESS_API_URL =
  'https://public-api.wordpress.com/wp/v2/sites/sufalphysicsforum.wordpress.com/posts?_embed';

interface WpMediaSize {
  width: number;
  height: number;
  file: string;
  source_url: string;
}

interface WpFeaturedMedia {
  id: number;
  source_url: string;
  media_details?: {
    width: number;
    height: number;
    sizes?: Record<string, WpMediaSize>;
  };
}

interface WpEmbedded {
  'wp:featuredmedia'?: WpFeaturedMedia[];
}

interface WordPressPost {
  id: number;
  date: string;
  link: string;
  slug: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
    protected?: boolean;
  };
  _embedded?: WpEmbedded;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFeaturedImage(post: WordPressPost): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPosts = () => {
    setLoading(true);
    setError(false);
    axios
      .get<WordPressPost[]>(WORDPRESS_API_URL)
      .then((response) => setPosts(response.data))
      .catch((err) => {
        console.error('Failed to fetch blog posts:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="bg-transparent">
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-100 mb-4">Blog</h1>
            <p className="text-lg text-slate-400">
              Insights, notes and updates from Sufal Physics Forum.
            </p>
          </div>

          {loading && <PostGridSkeleton />}
          {!loading && error && <ErrorFallback onRetry={loadPosts} />}
          {!loading && !error && posts.length === 0 && <EmptyState />}
          {!loading && !error && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface PostCardProps {
  post: WordPressPost;
}

function PostCard({ post }: PostCardProps) {
  const title = stripHtml(post.title.rendered) || 'Untitled';
  const excerpt = truncate(stripHtml(post.excerpt.rendered), 160);
  const featuredImage = getFeaturedImage(post);

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1 overflow-hidden"
    >
      <div className="aspect-video w-full overflow-hidden bg-slate-800">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-yellow-500 flex items-center justify-center">
            <Newspaper className="w-10 h-10 text-white/70" />
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <p className="flex items-center text-sm text-slate-500 mb-3">
          <CalendarDays className="w-4 h-4 mr-1.5" />
          {formatDate(post.date)}
        </p>
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-yellow-400 transition-colors mb-3 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">{excerpt}</p>
        <span className="mt-auto inline-flex items-center text-sm font-medium text-yellow-400">
          Read More
          <ExternalLink className="w-4 h-4 ml-1.5" />
        </span>
      </div>
    </a>
  );
}

function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-700/50 bg-slate-900/40 shadow-sm overflow-hidden animate-pulse"
        >
          <div className="aspect-video bg-slate-800" />
          <div className="p-6 space-y-3">
            <div className="h-3 w-24 bg-slate-700 rounded" />
            <div className="h-5 w-3/4 bg-slate-700 rounded" />
            <div className="h-4 w-full bg-slate-800 rounded" />
            <div className="h-4 w-5/6 bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-blue-500/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ErrorFallbackProps {
  onRetry: () => void;
}

function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">Couldn&apos;t load the blog</h3>
      <p className="text-slate-400 mb-6">
        We couldn&apos;t reach our blog right now. Please try again in a moment.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-slate-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 mx-auto bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
        <Newspaper className="w-8 h-8 text-blue-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">No posts yet</h3>
      <p className="text-slate-400">Check back soon for new articles and updates.</p>
    </div>
  );
}
