import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { Input } from '../ui/input.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.tsx';
import { 
  MessageSquare, 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  Bookmark, 
  Send, 
  TrendingUp
} from 'lucide-react';
import { useArtica } from '../../context/ArticaContext';

interface SocialFeedProps {
  paperId: number;
  tokenSymbol: string;
  tokenContractId?: string;
}

interface Post {
  id: string;
  author: string;
  authorShort: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

const getRandomAvatar = (address: string) => {
  return `https://avatars.dicebear.com/api/identicon/${address}.svg`;
};

const formatTimestamp = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60 * 1000) {
    return 'Just now';
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}m ago`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const SocialFeed: React.FC<SocialFeedProps> = ({ paperId, tokenSymbol, tokenContractId }) => {
  const { walletAddress } = useArtica();
  const [activeTab, setActiveTab] = useState<'posts' | 'trending'>('posts');
  const [postInput, setPostInput] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  
  useEffect(() => {
    const mockPosts: Post[] = Array.from({ length: 5 }).map((_, i) => {
      const author = `G${Math.random().toString(36).slice(2, 38)}`;
      return {
        id: `post-${i}`,
        author,
        authorShort: shortenAddress(author),
        authorAvatar: getRandomAvatar(author),
        content: [
          `${tokenSymbol} is definitely a solid research token. The fundamentals look strong.`,
          `Just bought more ${tokenSymbol}! This is going to revolutionize the field.`,
          `I've been analyzing ${tokenSymbol} and the potential is huge.`,
        ][Math.floor(Math.random() * 3)],
        timestamp: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7,
        likes: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 10),
        isLiked: Math.random() > 0.7,
        isBookmarked: Math.random() > 0.8
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
    
    setPosts(mockPosts);
  }, [tokenSymbol]);
  
  const handleCreatePost = () => {
    if (!postInput.trim() || !walletAddress) return;
    
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: walletAddress,
      authorShort: shortenAddress(walletAddress),
      authorAvatar: getRandomAvatar(walletAddress),
      content: postInput.trim(),
      timestamp: Date.now(),
      likes: 0,
      comments: 0,
      isLiked: false,
      isBookmarked: false
    };
    
    setPosts([newPost, ...posts]);
    setPostInput('');
  };
  
  const handleToggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          } 
        : post
    ));
  };
  
  const handleToggleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked } 
        : post
    ));
  };
  
  const getTrendingPosts = () => {
    return [...posts].sort((a, b) => 
      (b.likes + b.comments * 2) - (a.likes + a.comments * 2)
    );
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'posts' | 'trending')}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="posts">
            <MessageCircle className="w-4 h-4 mr-2" />
            Latest
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
        </TabsList>
        
        {walletAddress && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={walletAddress ? getRandomAvatar(walletAddress) : undefined} />
                <AvatarFallback>{walletAddress ? walletAddress.slice(2, 4) : '--'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`Share your thoughts about ${tokenSymbol}...`}
                  value={postInput}
                  onChange={(e) => setPostInput(e.target.value)}
                  className="mb-2 min-h-24"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!postInput.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <TabsContent value="posts" className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={post.authorAvatar} />
                  <AvatarFallback>{post.author.slice(2, 4)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{post.authorShort}</div>
                  <div className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</div>
                </div>
              </div>
              
              <div className="mb-3 text-sm">{post.content}</div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleToggleLike(post.id)} 
                    className={`flex items-center gap-1 ${post.isLiked ? 'text-blue-600' : ''}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.likes}</span>
                  </button>
                  <button 
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} 
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button 
                  onClick={() => handleToggleBookmark(post.id)} 
                  className={`flex items-center gap-1 ${post.isBookmarked ? 'text-yellow-500' : ''}`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="trending" className="space-y-4">
          {getTrendingPosts().map(post => (
            <div key={post.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={post.authorAvatar} />
                  <AvatarFallback>{post.author.slice(2, 4)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{post.authorShort}</div>
                  <div className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</div>
                </div>
              </div>
              
              <div className="mb-3 text-sm">{post.content}</div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleToggleLike(post.id)} 
                    className={`flex items-center gap-1 ${post.isLiked ? 'text-blue-600' : ''}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.comments}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialFeed;

