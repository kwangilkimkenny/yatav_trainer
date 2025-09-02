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
import { useAuth, useCharacters, useCharactersByProgram, useSessionManager, useHealthCheck, useWebSocket, useAdminStats, useSystemHealth, useApiUsage, useApiEndpoints, useSystemSettings, useSystemLogs } from './hooks/useApi';
import { apiService } from './services/api';

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

  // Get program-specific characters
  const programCharacters = useCharactersByProgram(selectedProgram || 'basic');
  
  // Use program-specific characters if available, otherwise use all characters
  const availableCharacters = programCharacters.loading 
    ? (characters.loading ? [] : characters.data || [])
    : programCharacters.error 
      ? (characters.data || [])
      : programCharacters.data || [];

  // Filter characters based on program availability and user preferences
  const filteredCharacters = availableCharacters.filter(character => {
    // Program-specific filtering
    if (selectedProgram && character.training_programs) {
      const programConfig = character.training_programs[selectedProgram as keyof typeof character.training_programs];
      if (!programConfig?.available) {
        return false;
      }
    }

    // Search filtering
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         character.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (character.primary_issue && character.primary_issue.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Difficulty filtering
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
                    
                    {/* Program-specific information */}
                    {selectedProgram && character.training_programs && (() => {
                      const programConfig = character.training_programs[selectedProgram as keyof typeof character.training_programs];
                      if (!programConfig) return null;
                      
                      return (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium mb-2 text-primary">
                            {selectedProgram === 'basic' && '🔰 기본 상담 훈련'}
                            {selectedProgram === 'crisis' && '🚨 위기 개입 훈련'}
                            {selectedProgram === 'techniques' && '🎯 특정 기법 훈련'}
                          </p>
                          
                          {programConfig.session_type && (
                            <p className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium">세션:</span> {programConfig.session_type}
                            </p>
                          )}
                          
                          {programConfig.urgency_level && (
                            <p className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium">긴급도:</span> {programConfig.urgency_level}
                            </p>
                          )}
                          
                          {programConfig.complexity_level && (
                            <p className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium">복잡도:</span> {programConfig.complexity_level}
                            </p>
                          )}
                          
                          {programConfig.recommended_techniques && programConfig.recommended_techniques.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">기법:</span> {programConfig.recommended_techniques.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })()}
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
  
  // Fetch real-time admin data
  const adminStats = useAdminStats();
  const systemHealth = useSystemHealth();
  const apiUsage = useApiUsage();
  const apiEndpoints = useApiEndpoints();
  const systemSettings = useSystemSettings();
  const systemLogs = useSystemLogs(50);

  // State for API configuration
  const [apiConfig, setApiConfig] = useState({
    baseUrl: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4',
    anthropicApiKey: '',
    anthropicModel: 'claude-3-sonnet-20240229',
    mongodbUrl: ''
  });

  const [configUpdateResult, setConfigUpdateResult] = useState<any>(null);

  // State for system settings
  const [settingsConfig, setSettingsConfig] = useState({
    platform_name: "YATAV AI Counseling Training Platform",
    platform_description: "AI 기반 심리상담 훈련 플랫폼",
    max_concurrent_sessions: 100,
    session_timeout_minutes: 60,
    auto_save_interval_seconds: 30,
    enable_analytics: true,
    enable_logging: true,
    log_level: "INFO",
    maintenance_mode: false,
    maintenance_message: "시스템 점검 중입니다. 잠시 후 다시 시도해주세요.",
    default_language: "ko",
    timezone: "Asia/Seoul",
    backup_enabled: true,
    backup_interval_hours: 24,
    data_retention_days: 365,
    ai_response_timeout_seconds: 30,
    max_message_length: 2000,
    enable_character_filtering: true,
    enable_program_differentiation: true,
    demo_mode: false
  });

  const [settingsUpdateResult, setSettingsUpdateResult] = useState<any>(null);
  const [backupResult, setBackupResult] = useState<any>(null);
  const [logClearResult, setLogClearResult] = useState<any>(null);

  // Initialize base URL from current API service
  useEffect(() => {
    setApiConfig(prev => ({
      ...prev,
      baseUrl: apiService.getCurrentBaseUrl()
    }));
  }, []);

  // Initialize system settings from API
  useEffect(() => {
    if (systemSettings.data && !systemSettings.loading) {
      setSettingsConfig(systemSettings.data);
    }
  }, [systemSettings.data, systemSettings.loading]);

  const handleUpdateApiConfig = async () => {
    try {
      const config = {
        openai_api_key: apiConfig.openaiApiKey || undefined,
        openai_model: apiConfig.openaiModel || undefined,
        anthropic_api_key: apiConfig.anthropicApiKey || undefined,
        anthropic_model: apiConfig.anthropicModel || undefined,
        mongodb_url: apiConfig.mongodbUrl || undefined,
        base_api_url: apiConfig.baseUrl || undefined
      };

      const result = await apiService.updateApiConfig(config);
      setConfigUpdateResult(result);
      
      // Update base URL if changed
      if (apiConfig.baseUrl && apiConfig.baseUrl !== apiService.getCurrentBaseUrl()) {
        apiService.updateBaseUrl(apiConfig.baseUrl);
      }
    } catch (error) {
      setConfigUpdateResult({
        error: true,
        message: 'API 설정 업데이트 중 오류가 발생했습니다.'
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/health`);
      if (response.ok) {
        setConfigUpdateResult({
          message: '연결 테스트 성공!',
          test_result: true
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setConfigUpdateResult({
        error: true,
        message: `연결 테스트 실패: ${error}`,
        test_result: false
      });
    }
  };

  const handleUpdateSystemSettings = async () => {
    try {
      const result = await apiService.updateSystemSettings(settingsConfig);
      setSettingsUpdateResult(result);
    } catch (error) {
      setSettingsUpdateResult({
        error: true,
        message: '시스템 설정 업데이트 중 오류가 발생했습니다.'
      });
    }
  };

  const handleCreateBackup = async () => {
    try {
      const result = await apiService.createSystemBackup();
      setBackupResult(result);
    } catch (error) {
      setBackupResult({
        error: true,
        message: '백업 생성 중 오류가 발생했습니다.'
      });
    }
  };

  const handleClearLogs = async () => {
    try {
      const result = await apiService.clearSystemLogs();
      setLogClearResult(result);
      // Refresh logs after clearing
      window.location.reload();
    } catch (error) {
      setLogClearResult({
        error: true,
        message: '로그 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  // Fallback to mock data if API is unavailable
  const stats = adminStats.loading ? {
    totalUsers: '로딩 중...',
    activeSessions: '로딩 중...',
    completedTrainings: '로딩 중...',
    totalCharacters: '로딩 중...'
  } : adminStats.error ? {
    totalUsers: '오류',
    activeSessions: '오류',
    completedTrainings: '오류',
    totalCharacters: '오류'
  } : {
    totalUsers: adminStats.data?.users?.total || 0,
    activeSessions: adminStats.data?.sessions?.active || 0,
    completedTrainings: adminStats.data?.sessions?.completed || 0,
    totalCharacters: adminStats.data?.characters?.total || 0,
    programDistribution: adminStats.data?.characters?.by_program || {}
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
            { title: '총 사용자', value: typeof stats.totalUsers === 'number' ? stats.totalUsers.toLocaleString() : stats.totalUsers, change: '등록된 사용자', icon: Users },
            { title: '활성 세션', value: stats.activeSessions, change: '현재 진행 중', icon: MessageSquare },
            { title: '완료된 훈련', value: typeof stats.completedTrainings === 'number' ? stats.completedTrainings.toLocaleString() : stats.completedTrainings, change: '총 완료 세션', icon: BookOpen },
            { title: '총 캐릭터', value: typeof stats.totalCharacters === 'number' ? stats.totalCharacters.toLocaleString() : stats.totalCharacters, change: '활성 캐릭터', icon: Target },
            { title: '기본 훈련', value: stats.programDistribution?.basic || 0, change: '기본 상담 캐릭터', icon: Heart },
            { title: '위기 개입', value: stats.programDistribution?.crisis || 0, change: '위기 상황 캐릭터', icon: AlertTriangle }
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
              <TabsTrigger value="api" className="rounded-xl px-4 py-2">API 관리</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl px-4 py-2">시스템 설정</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  시스템 상태
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {systemHealth.loading ? (
                    <div className="col-span-full text-center text-muted-foreground">
                      시스템 상태를 확인하는 중...
                    </div>
                  ) : systemHealth.error ? (
                    <div className="col-span-full text-center text-red-500">
                      시스템 상태를 가져올 수 없습니다
                    </div>
                  ) : (
                    [
                      { name: 'API 서버', status: systemHealth.data?.api_server?.status || 'unknown' },
                      { name: '데이터베이스', status: systemHealth.data?.database?.status || 'unknown' },
                      { name: 'AI 서비스', status: systemHealth.data?.ai_service?.status || 'unknown' }
                    ].map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                        <span className="text-sm font-medium">{service.name}</span>
                        <Badge className={`${
                          service.status === 'healthy' ? 'bg-green-600 text-white' :
                          service.status === 'available' ? 'bg-green-600 text-white' :
                          service.status === 'warning' ? 'bg-yellow-600 text-white' :
                          service.status === 'unhealthy' ? 'bg-red-600 text-white' :
                          service.status === 'unavailable' ? 'bg-red-600 text-white' :
                          'bg-gray-500 text-white'
                        } border-none rounded-full px-2 py-1`}>
                          {
                            service.status === 'healthy' ? '정상' :
                            service.status === 'available' ? '정상' :
                            service.status === 'warning' ? '주의' :
                            service.status === 'unhealthy' ? '오류' :
                            service.status === 'unavailable' ? '사용불가' :
                            '알 수 없음'
                          }
                        </Badge>
                      </div>
                    ))
                  )}
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
                  {adminStats.loading ? '로딩 중...' : 
                   adminStats.error ? '데이터를 가져올 수 없습니다' :
                   `${stats.totalCharacters}개의 가상 내담자 캐릭터를 관리합니다.`}
                </p>
                
                {adminStats.data?.characters?.by_program && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">기본 상담 훈련</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {adminStats.data.characters.by_program.basic || 0}명
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">위기 개입 훈련</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        {adminStats.data.characters.by_program.crisis || 0}명
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">특정 기법 훈련</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {adminStats.data.characters.by_program.techniques || 0}명
                      </p>
                    </div>
                  </div>
                )}
                
                {adminStats.data?.characters?.by_issue && adminStats.data.characters.by_issue.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-3">문제 유형별 분포</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {adminStats.data.characters.by_issue.slice(0, 8).map((issue: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">{issue._id}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              {issue.count}명
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              난이도 {issue.avg_difficulty?.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Configuration */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    API 설정
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Base API URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={apiConfig.baseUrl}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                          placeholder="http://127.0.0.1:8008"
                          className="flex-1"
                        />
                        <Button onClick={handleTestConnection} variant="outline" size="sm">
                          테스트
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <label className="text-sm font-medium mb-2 block">OpenAI API Key</label>
                      <Input
                        type="password"
                        value={apiConfig.openaiApiKey}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                        placeholder="sk-..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">OpenAI Model</label>
                      <Select value={apiConfig.openaiModel} onValueChange={(value) => 
                        setApiConfig(prev => ({ ...prev, openaiModel: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Anthropic API Key</label>
                      <Input
                        type="password"
                        value={apiConfig.anthropicApiKey}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
                        placeholder="sk-ant-..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Anthropic Model</label>
                      <Select value={apiConfig.anthropicModel} onValueChange={(value) => 
                        setApiConfig(prev => ({ ...prev, anthropicModel: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">MongoDB URL</label>
                      <Input
                        value={apiConfig.mongodbUrl}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, mongodbUrl: e.target.value }))}
                        placeholder="mongodb://localhost:27017"
                      />
                    </div>

                    <Button onClick={handleUpdateApiConfig} className="w-full">
                      설정 업데이트
                    </Button>

                    {configUpdateResult && (
                      <div className={`p-3 rounded-lg ${
                        configUpdateResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          configUpdateResult.error ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {configUpdateResult.message}
                        </p>
                        {configUpdateResult.restart_required && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ 일부 변경사항은 서버 재시작이 필요합니다.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* API Usage Statistics */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    API 사용 현황
                  </h3>

                  {apiUsage.loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      API 사용 현황을 불러오는 중...
                    </div>
                  ) : apiUsage.error ? (
                    <div className="text-center py-8 text-red-500">
                      API 사용 현황을 가져올 수 없습니다
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* AI Service Status */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">AI 서비스</span>
                          <Badge className={`${
                            apiUsage.data?.ai_service?.status === 'available' ? 'bg-green-600' : 'bg-red-600'
                          } text-white`}>
                            {apiUsage.data?.ai_service?.status === 'available' ? '사용 가능' : '사용 불가'}
                          </Badge>
                        </div>
                        {apiUsage.data?.ai_service?.providers?.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <p>사용 가능한 프로바이더: {apiUsage.data.ai_service.providers.join(', ')}</p>
                            <p>기본 프로바이더: {apiUsage.data.ai_service.default_provider}</p>
                          </div>
                        )}
                      </div>

                      {/* Database Status */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">데이터베이스</span>
                          <Badge className={`${
                            apiUsage.data?.database?.status === 'connected' ? 'bg-green-600' : 'bg-red-600'
                          } text-white`}>
                            {apiUsage.data?.database?.status === 'connected' ? '연결됨' : '연결 안됨'}
                          </Badge>
                        </div>
                        {apiUsage.data?.database && (
                          <div className="text-sm text-muted-foreground">
                            <p>DB: {apiUsage.data.database.database_name}</p>
                          </div>
                        )}
                      </div>

                      {/* External APIs */}
                      <div className="space-y-2">
                        <h4 className="font-medium">외부 API 설정</h4>
                        {apiUsage.data?.external_apis && Object.entries(apiUsage.data.external_apis).map(([key, api]: [string, any]) => (
                          <div key={key} className="p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between">
                              <span className="capitalize font-medium">{key}</span>
                              <Badge variant={api.configured ? 'default' : 'secondary'}>
                                {api.configured ? '설정됨' : '미설정'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p>모델: {api.model}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* API Endpoints */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  사용 가능한 API 엔드포인트
                </h3>

                {apiEndpoints.loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    API 엔드포인트를 불러오는 중...
                  </div>
                ) : apiEndpoints.error ? (
                  <div className="text-center py-8 text-red-500">
                    API 엔드포인트를 가져올 수 없습니다
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        총 {apiEndpoints.data?.total_endpoints || 0}개의 엔드포인트
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Base URL: {apiEndpoints.data?.base_url}
                      </p>
                    </div>

                    {apiEndpoints.data?.grouped_endpoints && Object.entries(apiEndpoints.data.grouped_endpoints).map(([category, endpoints]: [string, any[]]) => (
                      endpoints.length > 0 && (
                        <div key={category} className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 px-4 py-2 border-b">
                            <h4 className="font-medium capitalize">{category} ({endpoints.length})</h4>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {endpoints.map((endpoint, index) => (
                              <div key={index} className="px-4 py-2 border-b last:border-b-0 hover:bg-muted/25">
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    endpoint.method === 'GET' ? 'secondary' :
                                    endpoint.method === 'POST' ? 'default' :
                                    endpoint.method === 'PUT' ? 'outline' :
                                    endpoint.method === 'DELETE' ? 'destructive' :
                                    'secondary'
                                  } className="text-xs">
                                    {endpoint.method}
                                  </Badge>
                                  <code className="text-sm font-mono">{endpoint.path}</code>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Settings */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    플랫폼 설정
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">플랫폼 이름</label>
                      <Input
                        value={settingsConfig.platform_name}
                        onChange={(e) => setSettingsConfig(prev => ({ ...prev, platform_name: e.target.value }))}
                        placeholder="YATAV AI Counseling Training Platform"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">플랫폼 설명</label>
                      <Textarea
                        value={settingsConfig.platform_description}
                        onChange={(e) => setSettingsConfig(prev => ({ ...prev, platform_description: e.target.value }))}
                        placeholder="AI 기반 심리상담 훈련 플랫폼"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">최대 동시 세션</label>
                        <Input
                          type="number"
                          value={settingsConfig.max_concurrent_sessions}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, max_concurrent_sessions: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">세션 타임아웃 (분)</label>
                        <Input
                          type="number"
                          value={settingsConfig.session_timeout_minutes}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">기본 언어</label>
                        <Select value={settingsConfig.default_language} onValueChange={(value) => 
                          setSettingsConfig(prev => ({ ...prev, default_language: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ko">한국어</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ja">日本語</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">시간대</label>
                        <Select value={settingsConfig.timezone} onValueChange={(value) => 
                          setSettingsConfig(prev => ({ ...prev, timezone: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">분석 기능 활성화</label>
                        <input
                          type="checkbox"
                          checked={settingsConfig.enable_analytics}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, enable_analytics: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">로깅 활성화</label>
                        <input
                          type="checkbox"
                          checked={settingsConfig.enable_logging}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, enable_logging: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">캐릭터 필터링 활성화</label>
                        <input
                          type="checkbox"
                          checked={settingsConfig.enable_character_filtering}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, enable_character_filtering: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">프로그램 차별화 활성화</label>
                        <input
                          type="checkbox"
                          checked={settingsConfig.enable_program_differentiation}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, enable_program_differentiation: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">데모 모드</label>
                        <input
                          type="checkbox"
                          checked={settingsConfig.demo_mode}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, demo_mode: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                    </div>

                    <Button onClick={handleUpdateSystemSettings} className="w-full">
                      설정 저장
                    </Button>

                    {settingsUpdateResult && (
                      <div className={`p-3 rounded-lg ${
                        settingsUpdateResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          settingsUpdateResult.error ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {settingsUpdateResult.message}
                        </p>
                        {settingsUpdateResult.updated_fields && (
                          <p className="text-xs text-muted-foreground mt-1">
                            업데이트된 필드: {settingsUpdateResult.updated_fields.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* System Maintenance */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    시스템 유지보수
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <span className="font-medium">유지보수 모드</span>
                        <p className="text-xs text-muted-foreground">시스템을 일시적으로 중단합니다</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsConfig.maintenance_mode}
                        onChange={(e) => setSettingsConfig(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                        className="rounded"
                      />
                    </div>

                    {settingsConfig.maintenance_mode && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">유지보수 메시지</label>
                        <Textarea
                          value={settingsConfig.maintenance_message}
                          onChange={(e) => setSettingsConfig(prev => ({ ...prev, maintenance_message: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">백업 관리</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">자동 백업 활성화</span>
                          <input
                            type="checkbox"
                            checked={settingsConfig.backup_enabled}
                            onChange={(e) => setSettingsConfig(prev => ({ ...prev, backup_enabled: e.target.checked }))}
                            className="rounded"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">백업 주기 (시간)</label>
                            <Input
                              type="number"
                              value={settingsConfig.backup_interval_hours}
                              onChange={(e) => setSettingsConfig(prev => ({ ...prev, backup_interval_hours: parseInt(e.target.value) }))}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">데이터 보관 (일)</label>
                            <Input
                              type="number"
                              value={settingsConfig.data_retention_days}
                              onChange={(e) => setSettingsConfig(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) }))}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button onClick={handleCreateBackup} variant="outline" className="w-full">
                          수동 백업 생성
                        </Button>
                        {backupResult && (
                          <div className={`p-3 rounded-lg ${
                            backupResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                          }`}>
                            <p className={`text-sm font-medium ${
                              backupResult.error ? 'text-red-800' : 'text-green-800'
                            }`}>
                              {backupResult.message}
                            </p>
                            {backupResult.total_records && (
                              <p className="text-xs text-muted-foreground mt-1">
                                총 {backupResult.total_records}개 레코드 백업 완료
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Logs */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    시스템 로그
                  </h3>
                  <Button onClick={handleClearLogs} variant="destructive" size="sm">
                    로그 삭제
                  </Button>
                </div>

                {logClearResult && (
                  <div className={`p-3 rounded-lg mb-4 ${
                    logClearResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      logClearResult.error ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {logClearResult.message}
                    </p>
                  </div>
                )}

                {systemLogs.loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    시스템 로그를 불러오는 중...
                  </div>
                ) : systemLogs.error ? (
                  <div className="text-center py-8 text-red-500">
                    시스템 로그를 가져올 수 없습니다
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-3">
                      총 {systemLogs.data?.total_lines || 0}줄 중 최근 {systemLogs.data?.showing_lines || 0}줄 표시
                    </div>
                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
                      {systemLogs.data?.logs?.length > 0 ? (
                        systemLogs.data.logs.map((log: any, index: number) => (
                          <div key={index} className={`mb-1 ${
                            log.level === 'ERROR' ? 'text-red-400' :
                            log.level === 'WARNING' ? 'text-yellow-400' :
                            log.level === 'DEBUG' ? 'text-blue-400' :
                            'text-green-400'
                          }`}>
                            <span className="text-gray-500">{log.timestamp}</span> 
                            <span className="text-cyan-400"> {log.source}</span> - 
                            <span> {log.message}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">로그가 없습니다.</div>
                      )}
                    </div>
                  </div>
                )}
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