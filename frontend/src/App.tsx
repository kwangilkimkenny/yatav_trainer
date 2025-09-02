import React, { useState, useRef, useCallback, createContext, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { NotionCharacter } from './components/NotionCharacter';
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  BookOpen, 
  AlertTriangle, 
  Target,
  Play,
  User,
  Globe,
  Award,
  Star,
  Clock,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Home,
  Shield,
  Heart,
  Zap,
  Sparkles,
  TrendingUp
} from 'lucide-react';

// Import hooks
import { useAuth, useCharacters, useSessionManager, useHealthCheck, useWebSocket } from './hooks/useApi';

// Context for app state
interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedProgram: string | null;
  setSelectedProgram: (program: string | null) => void;
  selectedCharacter: any;
  setSelectedCharacter: (character: any) => void;
  language: string;
  setLanguage: (language: string) => void;
  // API-related state
  auth: ReturnType<typeof useAuth>;
  characters: ReturnType<typeof useCharacters>;
  sessionManager: ReturnType<typeof useSessionManager>;
  healthCheck: ReturnType<typeof useHealthCheck>;
}

const AppContext = createContext<AppContextType | null>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Mock data
const trainingPrograms = [
  {
    id: 'basic',
    title: '기본 상담 훈련',
    titleEn: 'Basic Counseling Training',
    description: '5개 핵심 모듈로 구성된 기본 상담 기술 훈련',
    modules: ['경청 기술', '공감 표현', '개방형 질문', '감정 반영', '요약 기술'],
    difficulty: '초급-중급',
    duration: '2-3시간',
    icon: BookOpen
  },
  {
    id: 'crisis',
    title: '위기 개입 훈련',
    titleEn: 'Crisis Intervention Training',
    description: '5가지 위기 시나리오를 통한 실전 위기 대응 훈련',
    modules: ['자살 위기', '가정폭력', '급성 불안', '청소년 자해', '물질 중독'],
    difficulty: '고급',
    duration: '3-4시간',
    icon: AlertTriangle
  },
  {
    id: 'techniques',
    title: '특정 기법 훈련',
    titleEn: 'Specific Techniques Training',
    description: '6가지 전문 치료 기법의 심화 학습',
    modules: ['CBT', '마음챙김 명상', '해결중심치료', '게슈탈트', 'EMDR', 'ACT'],
    difficulty: '전문가',
    duration: '4-6시간',
    icon: Target
  }
];

// const virtualCharacters = [
//   {
//     id: 1,
//     name: '김미영 (27세)',
//     issue: '불안장애',
//     difficulty: 3,
//     background: '직장에서의 스트레스로 인한 불안증상',
//     personality: '내향적, 완벽주의',
//     characterType: 'female-young'
//   },
//   {
//     id: 2,
//     name: '박준호 (34세)',
//     issue: '우울증',
//     difficulty: 5,
//     background: '최근 이혼 후 우울감과 무기력증',
//     personality: '외향적이었으나 현재 위축됨',
//     characterType: 'male-adult'
//   },
//   {
//     id: 3,
//     name: '이소영 (19세)',
//     issue: '대인관계 문제',
//     difficulty: 2,
//     background: '대학 새내기, 친구 관계에서의 어려움',
//     personality: '수줍음, 민감함',
//     characterType: 'female-teen'
//   },
//   {
//     id: 4,
//     name: '최영수 (45세)',
//     issue: '중년의 위기',
//     difficulty: 7,
//     background: '사업 실패와 가정 문제로 인한 혼란',
//     personality: '성취지향적, 스트레스에 민감',
//     characterType: 'male-middle'
//   },
//   {
//     id: 5,
//     name: '정하린 (16세)',
//     issue: '자해 행동',
//     difficulty: 9,
//     background: '학업 스트레스와 가정 내 갈등',
//     personality: '감정기복이 심함, 충동적',
//     characterType: 'female-teen-2'
//   },
//   {
//     id: 6,
//     name: '강민석 (29세)',
//     issue: '알코올 의존',
//     difficulty: 8,
//     background: '회사 업무 스트레스로 시작된 음주 문제',
//     personality: '부정적 사고, 회피적',
//     characterType: 'male-stressed'
//   }
// ];

// Components
const Header = () => {
  const { currentView, setCurrentView, language, setLanguage, healthCheck } = useApp();

  return (
    <header className="glass-strong border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground mono-shadow-sm">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">YATAV</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">AI Counseling Training Platform v2.0</p>
                  {healthCheck.healthy === false && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Backend server offline" />
                  )}
                  {healthCheck.healthy === true && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Backend server online" />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('dashboard')}
              className="rounded-full px-4 py-2 h-auto transition-all duration-200 hover:scale-105"
            >
              <Home className="h-4 w-4 mr-2" />
              대시보드
            </Button>
            <Button 
              variant={currentView === 'training' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('training')}
              className="rounded-full px-4 py-2 h-auto transition-all duration-200 hover:scale-105"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              훈련
            </Button>
            <Button 
              variant={currentView === 'admin' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('admin')}
              className="rounded-full px-4 py-2 h-auto transition-all duration-200 hover:scale-105"
            >
              <Settings className="h-4 w-4 mr-2" />
              관리자
            </Button>
          </nav>

          <div className="flex items-center gap-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-auto border-none bg-secondary/50 rounded-full px-3 py-1.5 h-auto">
                <Globe className="h-4 w-4 mr-1" />
              </SelectTrigger>
              <SelectContent className="glass rounded-2xl border-border/50">
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
            
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground">
                관
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

const Dashboard = () => {
  const { setCurrentView, setSelectedProgram } = useApp();

  const handleStartTraining = (programId) => {
    setSelectedProgram(programId);
    setCurrentView('character-select');
  };

  return (
    <div className="min-h-screen gradient-mono">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI 기반 차세대 상담 훈련
          </div>
          
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            AI 상담 훈련 플랫폼
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            500개 이상의 가상 내담자와 함께하는 실전 상담 훈련으로<br />
            전문성을 한 단계 높여보세요
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Users, value: '500+', label: '가상 내담자' },
              { icon: Brain, value: '25', label: '상담 이슈 카테고리' },
              { icon: Globe, value: '4', label: '지원 언어' },
              { icon: Award, value: '10', label: '평가 차원' }
            ].map((stat, index) => (
              <div key={index} className="mono-card p-8 text-center group">
                <stat.icon className="h-10 w-10 mx-auto mb-4 text-foreground transition-transform duration-300 group-hover:scale-110" />
                <p className="text-3xl font-bold mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Training Programs */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">전문 훈련 프로그램</h2>
            <p className="text-lg text-muted-foreground">
              체계적이고 실전적인 상담 기술 훈련을 경험해보세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trainingPrograms.map((program) => {
              const IconComponent = program.icon;
              return (
                <div key={program.id} className="mono-card overflow-hidden group">
                  <div className="h-2 bg-primary" />
                  
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-primary text-primary-foreground mono-shadow-sm">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{program.title}</h3>
                        <p className="text-sm text-muted-foreground">{program.titleEn}</p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">{program.description}</p>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">난이도</span>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {program.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">소요시간</span>
                        <span className="text-sm text-muted-foreground font-medium">{program.duration}</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <p className="text-sm font-medium mb-3">훈련 모듈</p>
                      <div className="flex flex-wrap gap-2">
                        {program.modules.slice(0, 3).map((module, index) => (
                          <Badge key={index} variant="outline" className="rounded-full text-xs px-3 py-1">
                            {module}
                          </Badge>
                        ))}
                        {program.modules.length > 3 && (
                          <Badge variant="outline" className="rounded-full text-xs px-3 py-1">
                            +{program.modules.length - 3}개
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full mono-button rounded-2xl py-3 h-auto font-medium"
                      onClick={() => handleStartTraining(program.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      훈련 시작하기
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="mono-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">AI 기술 통합</h3>
            </div>
            <ul className="space-y-4">
              {[
                'GPT-4, Claude 3 다중 LLM 지원',
                '14가지 감정 카테고리 실시간 분석',
                '10차원 대화 품질 자동 평가',
                '다국어 최적화 지원'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mono-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">엔터프라이즈 기능</h3>
            </div>
            <ul className="space-y-4">
              {[
                'JWT, OAuth 2.0, 2FA 보안 인증',
                'MongoDB + Redis 확장 가능한 아키텍처',
                '실시간 WebSocket 통신',
                '관리자 대시보드 및 모니터링'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const CharacterSelect = () => {
  const { selectedProgram, setCurrentView, setSelectedCharacter, characters, sessionManager } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const program = trainingPrograms.find(p => p.id === selectedProgram);

  // Use API characters if available, fallback to mock data
  const availableCharacters = characters.loading 
  ? [] 
  : characters.error 
    ? [] 
    : characters.data || [];

  const filteredCharacters = availableCharacters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         character.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || 
                             (selectedDifficulty === 'easy' && character.difficulty <= 3) ||
                             (selectedDifficulty === 'medium' && character.difficulty >= 4 && character.difficulty <= 6) ||
                             (selectedDifficulty === 'hard' && character.difficulty >= 7);
    return matchesSearch && matchesDifficulty;
  });

  const handleSelectCharacter = async (character: any) => {
    try {
      // Create a new training session using sessionManager from useApp
      const session = await sessionManager.createSession(selectedProgram || 'basic', character.id);
      
      setSelectedCharacter(character);
      setCurrentView('session');
    } catch (error) {
      console.error('Failed to create session:', error);
      // For now, continue without creating session (fallback to mock behavior)
      setSelectedCharacter(character);
      setCurrentView('session');
    }
  };

  return (
    <div className="min-h-screen gradient-mono">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('dashboard')}
            className="mb-6 rounded-full px-6 py-2 h-auto hover:scale-105 transition-all duration-200"
          >
            ← 돌아가기
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            가상 내담자 선택
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            <span className="font-medium text-primary">{program?.title}</span> 훈련을 위한 가상 내담자를 선택해주세요.
          </p>
        </div>

        {/* Filters */}
        <div className="mono-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="이름이나 이슈로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-2xl border-none bg-muted/50 px-4 py-3 h-auto"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-48 rounded-2xl border-none bg-muted/50 px-4 py-3 h-auto">
                <SelectValue placeholder="난이도 선택" />
              </SelectTrigger>
              <SelectContent className="glass rounded-2xl border-border/50">
                <SelectItem value="all">모든 난이도</SelectItem>
                <SelectItem value="easy">초급 (1-3)</SelectItem>
                <SelectItem value="medium">중급 (4-6)</SelectItem>
                <SelectItem value="hard">고급 (7-10)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {characters.loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">캐릭터 목록을 불러오는 중...</p>
              </div>
            </div>
          ) : characters.error ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-center text-red-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>캐릭터 목록을 불러오는데 실패했습니다.</p>
                <p className="text-sm text-muted-foreground mt-1">{characters.error}</p>
              </div>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">조건에 맞는 캐릭터가 없습니다.</p>
            </div>
          ) : (
            filteredCharacters.map((character) => (
              <div key={character.id} className="mono-card overflow-hidden group cursor-pointer">
                <div className="h-24 bg-muted/30 relative flex items-center justify-center">
                  <NotionCharacter 
                    type={character.characterType} 
                    size={60}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{character.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{character.issue}</p>
                      <Badge 
                        variant={character.difficulty <= 3 ? 'secondary' : 
                                character.difficulty <= 6 ? 'default' : 'destructive'}
                        className="rounded-full px-3 py-1"
                      >
                        난이도 {character.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm font-medium mb-1">배경 상황</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{character.background}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">성격 특성</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{character.personality}</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mono-button rounded-2xl py-3 h-auto font-medium"
                    onClick={() => handleSelectCharacter(character)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    상담 시작하기
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredCharacters.length === 0 && (
          <div className="text-center py-16">
            <div className="mono-card p-12 max-w-md mx-auto">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">조건에 맞는 가상 내담자가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">다른 검색 조건을 시도해보세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TrainingSession = () => {
  const { selectedCharacter, selectedProgram, setCurrentView, sessionManager } = useApp();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'character',
      content: `안녕하세요... 상담사님. 제가 여기 온 것도 사실 쉽지 않았어요. ${selectedCharacter?.background || ''} 요즘 정말 힘들어서요.`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    messagesCount: 1,
    empathyScore: 0,
    listeningScore: 0,
    overallScore: 0
  });
  const [isTyping, setIsTyping] = useState(false);

  const program = trainingPrograms.find(p => p.id === selectedProgram);

  // Create session on component mount
  useEffect(() => {
    const initSession = async () => {
      if (selectedProgram && selectedCharacter && !sessionId) {
        try {
          const session = await sessionManager.createSession(selectedProgram, selectedCharacter.id);
          setSessionId(session.id);
        } catch (error) {
          console.error('Failed to create session:', error);
        }
      }
    };
    initSession();
  }, []); // Only run once on mount

  // Use WebSocket for real-time communication
  const { connected, messages: wsMessages, sendMessage: sendWsMessage } = useWebSocket(sessionId);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const lastMessage = wsMessages[wsMessages.length - 1];
      if (lastMessage.type === 'ai_response') {
        setIsTyping(false);
        const aiResponse = {
          id: messages.length + 1,
          sender: 'character',
          content: lastMessage.content,
          timestamp: new Date(lastMessage.timestamp)
        };
        setMessages((prev: any[]) => [...prev, aiResponse]);
        
        // Update session stats
        setSessionStats(prev => ({
          ...prev,
          messagesCount: prev.messagesCount + 1,
          empathyScore: Math.min(100, prev.empathyScore + Math.random() * 10),
          listeningScore: Math.min(100, prev.listeningScore + Math.random() * 8),
          overallScore: Math.min(100, prev.overallScore + Math.random() * 5)
        }));
      }
    }
  }, [wsMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMsg = {
      id: messages.length + 1,
      sender: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages((prev: any[]) => [...prev, userMsg]);
    setNewMessage('');
    setIsTyping(true);

    // Send message via WebSocket
    if (connected && selectedCharacter) {
      sendWsMessage({
        type: 'user_message',
        character_id: selectedCharacter.id,
        content: newMessage,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleEndSession = () => {
    setCurrentView('character-select');
  };

  return (
    <div className="h-screen flex flex-col gradient-mono">
      {/* Session Header */}
      <div className="glass-strong border-b border-border/50 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleEndSession}
              className="rounded-full px-4 py-2 h-auto hover:scale-105 transition-all duration-200"
            >
              ← 세션 종료
            </Button>
            <div className="flex items-center gap-4">
              <NotionCharacter 
                type={selectedCharacter?.characterType || 'female-young'} 
                size={48}
              />
              <div>
                <p className="font-semibold">{selectedCharacter?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCharacter?.issue}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            {[
              { label: '공감 점수', value: sessionStats.empathyScore },
              { label: '경청 점수', value: sessionStats.listeningScore },
              { label: '전체 점수', value: sessionStats.overallScore }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{Math.round(stat.value)}/100</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-6 py-4 rounded-3xl mono-shadow-sm transition-all duration-200 hover:scale-[1.02] ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'glass mr-12'
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass px-6 py-4 rounded-3xl mr-12">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="glass-strong border-t border-border/50 p-6">
            <div className="max-w-4xl mx-auto flex gap-4">
              <Textarea
                placeholder="메시지를 입력하세요..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="resize-none rounded-2xl border-none bg-muted/50 px-4 py-3"
                rows={2}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim()}
                className="mono-button rounded-2xl px-6 py-3 h-auto"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Session Info Sidebar */}
        <div className="w-80 glass-strong border-l border-border/50 p-6">
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                세션 정보
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">훈련 프로그램</span>
                  <span className="font-medium">{program?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">소요 시간</span>
                  <span className="font-medium">{Math.floor(sessionStats.duration / 60)}분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">대화 횟수</span>
                  <span className="font-medium">{sessionStats.messagesCount}회</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                실시간 평가
              </h3>
              <div className="space-y-4">
                {[
                  { label: '공감 능력', value: sessionStats.empathyScore },
                  { label: '적극적 경청', value: sessionStats.listeningScore },
                  { label: '전체 점수', value: sessionStats.overallScore }
                ].map((metric, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{metric.label}</span>
                      <span className="text-muted-foreground">{Math.round(metric.value)}%</span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI 피드백
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <Heart className="h-4 w-4 text-foreground mb-2" />
                  <p className="text-sm font-medium">
                    공감적 반응을 잘 보여주고 있습니다.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <Zap className="h-4 w-4 text-foreground mb-2" />
                  <p className="text-sm font-medium">
                    개방형 질문을 효과적으로 사용하고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { setCurrentView } = useApp();

  const stats = {
    totalUsers: 1247,
    activeSessions: 23,
    completedTrainings: 8934,
    tokenUsage: 125000,
    monthlyCost: 2340,
    averageScore: 87
  };

  return (
    <div className="min-h-screen gradient-mono">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            관리자 대시보드
          </h1>
          <p className="text-lg text-muted-foreground">
            YATAV 플랫폼의 전체 현황을 모니터링하고 관리합니다.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { title: '총 사용자', value: stats.totalUsers.toLocaleString(), change: '+12%', icon: Users },
            { title: '활성 세션', value: stats.activeSessions, change: '현재 진행 중', icon: MessageSquare },
            { title: '완료된 훈련', value: stats.completedTrainings.toLocaleString(), change: '+8.2%', icon: BookOpen },
            { title: '토큰 사용량', value: stats.tokenUsage.toLocaleString(), change: '이번 달 총합', icon: Zap },
            { title: '월간 비용', value: `$${stats.monthlyCost.toLocaleString()}`, change: 'AI API 포함', icon: BarChart3 },
            { title: '평균 점수', value: `${stats.averageScore}%`, change: '전체 훈련 평균', icon: Star }
          ].map((stat, index) => (
            <div key={index} className="mono-card p-6 group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <stat.icon className="h-5 w-5 text-foreground transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Management Tabs */}
        <div className="mono-card p-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass rounded-2xl p-1 w-full justify-start">
              <TabsTrigger value="overview" className="rounded-xl px-4 py-2">개요</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl px-4 py-2">사용자 관리</TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-xl px-4 py-2">세션 모니터링</TabsTrigger>
              <TabsTrigger value="characters" className="rounded-xl px-4 py-2">캐릭터 관리</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl px-4 py-2">시스템 설정</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  시스템 상태
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'API 서버', status: 'normal' },
                    { name: '데이터베이스', status: 'normal' },
                    { name: 'AI 서비스', status: 'normal' },
                    { name: '캐시 서버', status: 'warning' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge className={`${service.status === 'normal' ? 'bg-foreground' : 'bg-muted-foreground'} text-background border-none rounded-full px-2 py-1`}>
                        {service.status === 'normal' ? '정상' : '주의'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2">사용자 관리</h3>
                <p className="text-muted-foreground mb-6">
                  등록된 사용자들을 관리하고 권한을 설정합니다.
                </p>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">사용자 관리 기능이 여기에 표시됩니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sessions">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2">세션 모니터링</h3>
                <p className="text-muted-foreground mb-6">
                  현재 진행 중인 훈련 세션들을 실시간으로 모니터링합니다.
                </p>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">세션 모니터링 기능이 여기에 표시됩니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="characters">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2">가상 캐릭터 관리</h3>
                <p className="text-muted-foreground mb-6">
                  500개 이상의 가상 내담자 캐릭터를 관리합니다.
                </p>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">캐릭터 관리 기능이 여기에 표시됩니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2">시스템 설정</h3>
                <p className="text-muted-foreground mb-6">
                  YATAV 플랫폼의 전반적인 설정을 관리합니다.
                </p>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">시스템 설정 기능이 여기에 표시됩니다.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [language, setLanguage] = useState('ko');

  // Initialize API hooks
  const auth = useAuth();
  const characters = useCharacters();
  const sessionManager = useSessionManager();
  const healthCheck = useHealthCheck();

  // Check authentication on app start
  useEffect(() => {
    if (!auth.isAuthenticated && currentView !== 'login' && currentView !== 'register') {
      // For demo purposes, we'll continue without authentication
      // In production, you'd redirect to login
      console.log('User not authenticated, but continuing for demo');
    }
  }, [auth.isAuthenticated, currentView]);

  // Show connection status
  useEffect(() => {
    if (healthCheck.healthy === false) {
      console.warn('Backend server is not responding. Some features may not work.');
    } else if (healthCheck.healthy === true) {
      console.log('✅ Connected to backend server');
    }
  }, [healthCheck.healthy]);

  const contextValue: AppContextType = {
    currentView,
    setCurrentView,
    selectedProgram,
    setSelectedProgram,
    selectedCharacter,
    setSelectedCharacter,
    language,
    setLanguage,
    // API hooks
    auth,
    characters,
    sessionManager,
    healthCheck
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'character-select':
        return <CharacterSelect />;
      case 'session':
        return <TrainingSession />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background">
        <Header />
        {renderView()}
      </div>
    </AppContext.Provider>
  );
}