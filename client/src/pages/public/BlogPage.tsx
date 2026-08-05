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
    <div className="bg-white">
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
            <p className="text-lg text-gray-600">
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
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Newspaper className="w-10 h-10 text-white/70" />
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <p className="flex items-center text-sm text-gray-500 mb-3">
          <CalendarDays className="w-4 h-4 mr-1.5" />
          {formatDate(post.date)}
        </p>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{excerpt}</p>
        <span className="mt-auto inline-flex items-center text-sm font-medium text-indigo-600">
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
          className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse"
        >
          <div className="aspect-video bg-gray-200" />
          <div className="p-6 space-y-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-indigo-100 rounded" />
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
      <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t load the blog</h3>
      <p className="text-gray-600 mb-6">
        We couldn&apos;t reach our blog right now. Please try again in a moment.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
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
      <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
        <Newspaper className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
      <p className="text-gray-600">Check back soon for new articles and updates.</p>
    </div>
  );
}
