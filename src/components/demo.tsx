// App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';

// Types
interface Friend {
  id: string;
  name: string;
  initial: string;
  streak: number;
  context?: string;
}

interface Glaze {
  id: string;
  text: string;
  friendId: string;
  friendName: string;
  intensity: IntensityLevel;
  style: GlazeStyle;
  timestamp: Date;
  isFavorite?: boolean;
}

type IntensityLevel = 'nice' | 'hype' | 'legendary' | 'unhinged';
type GlazeStyle = 'bestie' | 'poetic' | 'ceo' | 'chaos';

interface IntensityConfig {
  level: IntensityLevel;
  emoji: string;
  name: string;
  description: string;
  color: string;
}

// Constants
const INTENSITY_LEVELS: IntensityConfig[] = [
  { level: 'nice', emoji: '😊', name: 'Nice', description: 'Subtle', color: '#34C759' },
  { level: 'hype', emoji: '🚀', name: 'Hype', description: 'High energy', color: '#FF8C42' },
  { level: 'legendary', emoji: '👑', name: 'LEGENDARY', description: 'All caps', color: '#FFD700' },
  { level: 'unhinged', emoji: '🤪', name: 'UNHINGED', description: 'Chaos mode', color: '#FF2D55' }
];

const GLAZE_STYLES: { value: GlazeStyle; label: string; emoji: string }[] = [
  { value: 'bestie', label: 'Bestie', emoji: '👯' },
  { value: 'poetic', label: 'Poetic', emoji: '📜' },
  { value: 'ceo', label: 'CEO', emoji: '💼' },
  { value: 'chaos', label: 'Chaos', emoji: '🌪️' }
];

// Mock Data
const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Sarah', initial: 'S', streak: 5 },
  { id: '2', name: 'Mike', initial: 'M', streak: 2 }
];

// Components
const AmbientBackground: React.FC = () => (
  <div className="ambient-bg">
    <div className="ambient-orb orb-1"></div>
    <div className="ambient-orb orb-2"></div>
    <div className="ambient-orb orb-3"></div>
  </div>
);

const DynamicIsland: React.FC = () => (
  <div className="dynamic-island">
    <div className="island-camera"></div>
    <div className="island-speaker"></div>
  </div>
);

const iPhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="iphone-17">
    <div className="titanium-frame"></div>
    <div className="action-button"></div>
    <div className="camera-control"></div>
    <div className="volume-up"></div>
    <div className="volume-down"></div>
    <DynamicIsland />
    <div className="iphone-screen">{children}</div>
  </div>
);

const StatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-bar">
      <span>{currentTime}</span>
      <span className="status-time">{currentTime}</span>
      <span>5G 100%</span>
    </div>
  );
};

// Screen Components
const SplashScreen: React.FC = () => (
  <div className="app-content splash-screen">
    <StatusBar />
    <div className="splash-glow"></div>
    <div className="splash-logo">GlazeMe</div>
    <div className="splash-tagline">
      Make someone's day,
      <br />
      over the top
    </div>
    <div className="splash-loader">
      <div className="loader-ring"></div>
      <div className="loader-core"></div>
    </div>
  </div>
);

const HomeScreen: React.FC<{
  friends: Friend[];
  dailyLimit: number;
  usedToday: number;
  onAddFriend: () => void;
  onSelectFriend: (friend: Friend) => void;
}> = ({ friends, dailyLimit, usedToday, onAddFriend, onSelectFriend }) => {
  const remaining = dailyLimit - usedToday;

  return (
    <div className="app-content">
      <StatusBar />
      <div className="home-header">
        <div className="home-title">GlazeMe 🔥</div>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Keyboard">
            ⌨️
          </button>
          <button className="icon-btn" aria-label="Settings">
            ⚙️
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="limit-header">
          <div className="limit-title">
            🌟 <span className="limit-number">{remaining}</span>/{dailyLimit} left
          </div>
          <div className="limit-badge">Daily</div>
        </div>
        <div className="limit-bar-bg">
          <div
            className="limit-bar-fill"
            style={{ width: `${(usedToday / dailyLimit) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Who deserves love?</div>
        <button className="section-action" onClick={onAddFriend}>
          + Add
        </button>
      </div>

      <div className="friends-grid">
        {friends.map((friend) => (
          <button
            key={friend.id}
            className="friend-card"
            onClick={() => onSelectFriend(friend)}
          >
            <div className="friend-avatar">{friend.initial}</div>
            <div className="friend-name">{friend.name}</div>
            <div className="friend-streak">🔥 {friend.streak}</div>
          </button>
        ))}
        <button className="friend-card add-friend-card" onClick={onAddFriend}>
          <div className="friend-avatar">+</div>
          <div className="friend-name">Add</div>
        </button>
      </div>

      <RecentGlazes />
      <KeyboardPromo />
    </div>
  );
};

const RecentGlazes: React.FC = () => {
  const recentGlazes = [
    { text: "You're absolutely legendary...", friend: 'Sarah', time: '2m ago' },
    { text: 'Main character energy fr fr...', friend: 'Mike', time: '1h ago' }
  ];

  return (
    <div className="recent-container">
      <div className="recent-header">
        <div className="recent-title">Recent Glazes</div>
        <button className="text-button">See All →</button>
      </div>
      <div className="recent-list">
        {recentGlazes.map((glaze, index) => (
          <div key={index} className="recent-item">
            <div className="recent-icon">💬</div>
            <div className="recent-content">
              <div className="recent-text">{glaze.text}</div>
              <div className="recent-meta">
                {glaze.friend} • {glaze.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KeyboardPromo: React.FC = () => (
  <div className="promo-card">
    <div className="promo-icon">⌨️</div>
    <div className="promo-content">
      <div className="promo-title">Add to Keyboard</div>
      <div className="promo-desc">Glaze anywhere, anytime</div>
    </div>
    <div className="promo-arrow">→</div>
  </div>
);

const AddFriendModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, context: string) => void;
}> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [context, setContext] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), context.trim());
      setName('');
      setContext('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>
        <h2 className="modal-title">Add Friend</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Friend's Name</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g., Jessica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group">
            <label className="input-label">What makes them awesome?</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g., Always supportive"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <button type="submit" className="modal-submit">
            💛 Add Friend
          </button>
        </form>
      </div>
    </div>
  );
};

const GeneratorScreen: React.FC<{
  friend: Friend;
  onBack: () => void;
  onGenerate: (intensity: IntensityLevel, style: GlazeStyle, context: string) => void;
}> = ({ friend, onBack, onGenerate }) => {
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>('legendary');
  const [selectedStyle, setSelectedStyle] = useState<GlazeStyle>('bestie');
  const [context, setContext] = useState('');

  return (
    <div className="app-content">
      <StatusBar />
      <div className="nav-header">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          ←
        </button>
        <div className="nav-title">New Glaze</div>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} aria-label="Info">
          ℹ️
        </button>
      </div>

      <div className="generator-content">
        <div className="target-card">
          <div className="target-label">Glazing Target</div>
          <div className="target-name">{friend.name} 💛</div>
        </div>

        <div className="control-card">
          <div className="control-label">🔥 How "over the top"?</div>
          <div className="intensity-grid">
            {INTENSITY_LEVELS.map((intensity) => (
              <button
                key={intensity.level}
                className={`intensity-btn ${selectedIntensity === intensity.level ? 'active' : ''} ${
                  intensity.level === 'unhinged' ? 'wild' : ''
                }`}
                onClick={() => setSelectedIntensity(intensity.level)}
              >
                <span className="intensity-emoji">{intensity.emoji}</span>
                <span className="intensity-name">{intensity.name}</span>
                <span className="intensity-desc">{intensity.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-card">
          <div className="control-label">🎨 Meme Vibe</div>
          <div className="style-scroll">
            {GLAZE_STYLES.map((style) => (
              <button
                key={style.value}
                className={`style-btn ${selectedStyle === style.value ? 'active' : ''}`}
                onClick={() => setSelectedStyle(style.value)}
              >
                <span>{style.emoji}</span> {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-card">
          <div className="control-label">📝 Context</div>
          <textarea
            className="context-input"
            rows={2}
            placeholder="Why are you glazing them?"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <button
          className="generate-btn"
          onClick={() => onGenerate(selectedIntensity, selectedStyle, context)}
        >
          ✨ GENERATE GLAZE
        </button>
      </div>
    </div>
  );
};

const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Creating your glaze...' }) => (
  <div className="app-content loading-screen">
    <StatusBar />
    <div className="loading-sparkle">✨🔥✨</div>
    <div className="loading-title">{message}</div>
    <div className="loading-subtitle">AI is cooking up something legendary</div>
    <div className="loading-dots">
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  </div>
);

const ResultScreen: React.FC<{
  glaze: string;
  intensity: IntensityLevel;
  style: GlazeStyle;
  onBack: () => void;
  onShare: () => void;
  onNew: () => void;
  onSave: () => void;
}> = ({ glaze, intensity, style, onBack, onShare, onNew, onSave }) => {
  const intensityLabel = INTENSITY_LEVELS.find((i) => i.level === intensity)?.name || intensity;
  const styleLabel = GLAZE_STYLES.find((s) => s.value === style)?.label || style;

  return (
    <div className="app-content">
      <StatusBar />
      <div className="nav-header">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          ←
        </button>
        <div className="nav-title">Your Glaze</div>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onShare} aria-label="Share">
          📤
        </button>
      </div>

      <div className="preview-content">
        <div className="result-card">
          <div className="result-badge">✨ THE GLAZE ✨</div>
          <div className="glaze-result">{glaze}</div>
          <div className="result-meta">
            <div className="meta-tag">🔥 {intensityLabel}</div>
            <div className="meta-tag">👯 {styleLabel}</div>
            <div className="meta-tag">🤖 AI</div>
          </div>
          <div className="action-grid">
            <button className="action-btn action-secondary" onClick={onNew}>
              🔄 New
            </button>
            <button className="action-btn action-secondary" onClick={onSave}>
              ⭐ Save
            </button>
            <button className="action-btn share-main" onClick={onShare}>
              📤 SHARE TO MAKE THEM SMILE
            </button>
          </div>
        </div>

        <div className="keyboard-demo">
          <div className="keyboard-tabs">
            <button className="keyboard-tab active">Recent</button>
            <button className="keyboard-tab">⭐ Fav</button>
            <button className="keyboard-tab">⚡ Quick</button>
          </div>
          <div className="daily-counter">🌟 8 of 9 left today</div>
          <div className="keyboard-item">
            <div className="keyboard-item-text">{glaze.slice(0, 30)}...</div>
            <div className="keyboard-item-meta">Available in keyboard extension</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onShare: (platform: string) => void;
}> = ({ isOpen, onClose, onShare }) => {
  if (!isOpen) return null;

  const shareApps = [
    { id: 'imessage', icon: '💬', label: 'iMessage', color: '#34C759' },
    { id: 'whatsapp', icon: '📱', label: 'WhatsApp', color: '#25D366' },
    { id: 'instagram', icon: '📸', label: 'Instagram', color: '#E4405F' },
    { id: 'twitter', icon: '𝕏', label: 'Twitter', color: '#000' },
    { id: 'linkedin', icon: '💼', label: 'LinkedIn', color: '#0A66C2' },
    { id: 'email', icon: '📧', label: 'Email', color: '#FF4500' },
    { id: 'copy', icon: '📋', label: 'Copy', color: '#636E72' },
    { id: 'more', icon: '⋯', label: 'More', color: '#636E72' }
  ];

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="share-title">Share Glaze</h3>
        <div className="share-grid">
          {shareApps.map((app) => (
            <button key={app.id} className="share-app" onClick={() => onShare(app.id)}>
              <div className="share-icon" style={{ background: app.color }}>
                {app.icon}
              </div>
              <span className="share-label">{app.label}</span>
            </button>
          ))}
        </div>
        <button className="share-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<
    'splash' | 'home' | 'generator' | 'loading' | 'result'
  >('splash');
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [generatedGlaze, setGeneratedGlaze] = useState<{
    text: string;
    intensity: IntensityLevel;
    style: GlazeStyle;
  } | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const DAILY_LIMIT = 9;

  useEffect(() => {
    // Simulate splash screen
    const timer = setTimeout(() => {
      setCurrentScreen('home');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddFriend = (name: string, context: string) => {
    const newFriend: Friend = {
      id: Date.now().toString(),
      name,
      initial: name.charAt(0).toUpperCase(),
      streak: 0,
      context
    };
    setFriends((prev) => [...prev, newFriend]);
  };

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setCurrentScreen('generator');
  };

  const handleGenerate = (intensity: IntensityLevel, style: GlazeStyle, context: string) => {
    if (dailyUsed >= DAILY_LIMIT) {
      alert('Daily limit reached! Upgrade to premium for unlimited glazes.');
      return;
    }

    setCurrentScreen('loading');

    // Simulate AI generation
    setTimeout(() => {
      const mockGlazes: Record<IntensityLevel, string[]> = {
        nice: [
          "You're pretty great, you know that?",
          "Thanks for being you!",
          "You make the world a little brighter."
        ],
        hype: [
          "ABSOLUTELY KILLING IT TODAY!! 🔥",
          "YOU'RE ON FIRE!! CAN'T STOP WON'T STOP!!",
          "EVERYONE NEEDS TO KNOW HOW AMAZING YOU ARE!!"
        ],
        legendary: [
          `${selectedFriend?.name} YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥 The way you just exist is absolutely ICONIC!! NO ONE is doing it like you!! MAIN CHARACTER ENERGY FR FR!! 💅✨`,
          `LEGENDARY STATUS: ${selectedFriend?.name} is literally the main character of life!! No debate!! Everyone else is just living in their world!! 🌟👑`,
          `FACT: ${selectedFriend?.name} didn't just wake up and choose violence, they woke up and chose GREATNESS!! Absolutely unmatched energy!! 🔥💫`
        ],
        unhinged: [
          `⚠️⚠️⚠️ EMERGENCY ALERT ⚠️⚠️⚠️ ${selectedFriend?.name} just broke the scale of being awesome!! SEND HELP!! CAN'T HANDLE THIS MUCH COOLNESS!! 🚨🚨🚨`,
          `💀💀💀 I'm deceased!! ${selectedFriend?.name} just ended the whole game!! No one else even needs to try!! This is the peak of existence right here!! 💀💀💀`,
          `THE UNIVERSE LITERALLY REARRANGED ITSELF TO CREATE ${selectedFriend?.name?.toUpperCase()}!! This is actual perfection we're witnessing!! Pinch me I'm dreaming!! 🌌✨`
        ]
      };

      const styleModifiers: Record<GlazeStyle, string> = {
        bestie: "bestie vibes only!! 💅",
        poetic: "like a symphony of greatness.",
        ceo: "ceo of being absolutely iconic.",
        chaos: "chaos ensues but make it legendary."
      };

      const intensityGlazes = mockGlazes[intensity];
      const baseGlaze = intensityGlazes[Math.floor(Math.random() * intensityGlazes.length)];
      const finalGlaze = `${baseGlaze} ${styleModifiers[style]}`;

      setGeneratedGlaze({
        text: finalGlaze,
        intensity,
        style
      });
      setDailyUsed((prev) => prev + 1);
      setCurrentScreen('result');
    }, 2500);
  };

  const handleBack = () => {
    setCurrentScreen('home');
    setSelectedFriend(null);
  };

  const handleShare = () => {
    setIsShareSheetOpen(true);
  };

  const handleShareToPlatform = (platform: string) => {
    console.log(`Sharing to ${platform}:`, generatedGlaze?.text);
    setIsShareSheetOpen(false);
    // Implement actual sharing logic here
  };

  const handleSaveGlaze = () => {
    if (generatedGlaze) {
      console.log('Saving glaze:', generatedGlaze);
      // Implement save logic here
    }
  };

  return (
    <div className="app">
      <AmbientBackground />

      <header className="demo-header">
        <div className="badge">
          <div className="badge-dot"></div>
          <span>Client Preview Ready</span>
        </div>
        <h1 className="demo-title">GlazeMe Premium</h1>
        <p className="demo-subtitle">
          The ultimate "over the top" compliment experience. Designed for iPhone 17 Pro with
          titanium finish, Dynamic Island integration, and pro-grade animations.
        </p>

        <div className="demo-stats">
          <div className="stat-item">
            <span className="stat-number">10</span>
            <div className="stat-label">Screens</div>
          </div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <div className="stat-label">Features</div>
          </div>
          <div className="stat-item">
            <span className="stat-number">4</span>
            <div className="stat-label">Intensity Levels</div>
          </div>
          <div className="stat-item">
            <span className="stat-number">0s</span>
            <div className="stat-label">Load Time</div>
          </div>
        </div>
      </header>

      <div className="showcase-container">
        <div className="iphone-grid">
          <div className="iphone-wrapper">
            <div className="screen-number">
              {currentScreen === 'splash'
                ? 1
                : currentScreen === 'home'
                ? 2
                : currentScreen === 'generator'
                ? 4
                : currentScreen === 'loading'
                ? 5
                : 6}
            </div>
            <iPhoneFrame>
              {currentScreen === 'splash' && <SplashScreen />}
              {currentScreen === 'home' && (
                <HomeScreen
                  friends={friends}
                  dailyLimit={DAILY_LIMIT}
                  usedToday={dailyUsed}
                  onAddFriend={() => setIsAddFriendModalOpen(true)}
                  onSelectFriend={handleSelectFriend}
                />
              )}
              {currentScreen === 'generator' && selectedFriend && (
                <GeneratorScreen
                  friend={selectedFriend}
                  onBack={handleBack}
                  onGenerate={handleGenerate}
                />
              )}
              {currentScreen === 'loading' && <LoadingScreen />}
              {currentScreen === 'result' && generatedGlaze && (
                <ResultScreen
                  glaze={generatedGlaze.text}
                  intensity={generatedGlaze.intensity}
                  style={generatedGlaze.style}
                  onBack={handleBack}
                  onShare={handleShare}
                  onNew={() => setCurrentScreen('generator')}
                  onSave={handleSaveGlaze}
                />
              )}
            </iPhoneFrame>
            <div className="screen-info">
              <div className="screen-name">
                {currentScreen === 'splash' && 'Splash Screen'}
                {currentScreen === 'home' && 'Home Dashboard'}
                {currentScreen === 'generator' && 'AI Generator'}
                {currentScreen === 'loading' && 'AI Processing'}
                {currentScreen === 'result' && 'Result Preview'}
              </div>
              <div className="screen-desc">
                {currentScreen === 'splash' && '3-second branded entry with physics-based loader'}
                {currentScreen === 'home' && 'Glass-morphism UI with friend management'}
                {currentScreen === 'generator' && '4 intensity levels + meme styles'}
                {currentScreen === 'loading' && '2-3 second generation with haptics'}
                {currentScreen === 'result' && 'Share, save, or regenerate with one tap'}
              </div>
              <div className="feature-tags">
                {currentScreen === 'splash' && (
                  <>
                    <span className="feature-tag">Animation</span>
                    <span className="feature-tag">Branding</span>
                  </>
                )}
                {currentScreen === 'home' && (
                  <>
                    <span className="feature-tag">Glass UI</span>
                    <span className="feature-tag">Streaks</span>
                    <span className="feature-tag">Limit System</span>
                  </>
                )}
                {currentScreen === 'generator' && (
                  <>
                    <span className="feature-tag">AI Engine</span>
                    <span className="feature-tag">4 Levels</span>
                    <span className="feature-tag">Meme Styles</span>
                  </>
                )}
                {currentScreen === 'loading' && (
                  <>
                    <span className="feature-tag">Loading UI</span>
                    <span className="feature-tag">Haptics</span>
                  </>
                )}
                {currentScreen === 'result' && (
                  <>
                    <span className="feature-tag">Share Sheet</span>
                    <span className="feature-tag">Favorites</span>
                    <span className="feature-tag">Keyboard</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onAdd={handleAddFriend}
      />

      <ShareSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        onShare={handleShareToPlatform}
      />

      <FeaturesSection />
      <CTASection />
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '🎨',
      title: 'Titanium Glass UI',
      description:
        'Premium glass-morphism design with iPhone 17 Pro titanium finish. Dynamic Island integration and fluid animations throughout.'
    },
    {
      icon: '🤖',
      title: 'GPT-4 AI Engine',
      description:
        'Advanced AI generates personalized compliments based on intensity, style, and context. From subtle to absolutely unhinged.'
    },
    {
      icon: '⌨️',
      title: 'Universal Keyboard',
      description:
        'iOS keyboard extension works in Messages, WhatsApp, Instagram, Twitter, and any app with a text field. Full access anywhere.'
    },
    {
      icon: '🔥',
      title: '4-Tier Intensity',
      description:
        'Nice, Hype, Legendary, and Unhinged modes. Each with distinct personality from gentle encouragement to chaotic energy.'
    },
    {
      icon: '💎',
      title: 'Daily Limit System',
      description:
        '9 free generations per day with beautiful progress tracking. Resets at midnight. Premium upgrade for unlimited access.'
    },
    {
      icon: '⚡',
      title: 'Zero Sign-In',
      description:
        'No authentication barriers. Open app and start glazing immediately. Local storage with optional iCloud sync.'
    },
    {
      icon: '📤',
      title: 'Native iOS Share',
      description:
        'Full iOS share sheet integration. Send to Messages, WhatsApp, Instagram, Twitter, LinkedIn, Email, or copy to clipboard.'
    },
    {
      icon: '👥',
      title: 'Friend Context AI',
      description:
        'Add friends with custom context. AI remembers what makes them special and personalizes every compliment.'
    },
    {
      icon: '💾',
      title: 'Smart History',
      description:
        'Automatic history tracking with favorites. Reuse your best glazes with one tap from keyboard or app.'
    }
  ];

  return (
    <section className="features-section">
      <div className="features-header">
        <h2 className="features-title">Premium Features</h2>
        <p className="features-subtitle">
          Every detail crafted for the ultimate compliment experience. From AI generation to keyboard
          integration.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="tech-specs">
        <h3 className="tech-title">Technical Specifications</h3>
        <div className="specs-grid">
          <div className="spec-item">
            <div className="spec-label">Platform</div>
            <div className="spec-value">iOS 17+</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Device</div>
            <div className="spec-value">iPhone 17 Pro</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">AI Model</div>
            <div className="spec-value">GPT-4 Turbo</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Storage</div>
            <div className="spec-value">iCloud Sync</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Security</div>
            <div className="spec-value">End-to-End</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Languages</div>
            <div className="spec-value">English</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection: React.FC = () => (
  <section className="cta-section">
    <h2 className="cta-title">Ready to Glaze?</h2>
    <button className="cta-button">
      <span>🚀</span>
      <span>Start Development</span>
    </button>
  </section>
);

export default App;