import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { JapaneseDictionaryWidget } from './components/JapaneseDictionaryWidget';
import { ThemeTransitionOverlay } from './components/ThemeTransitionOverlay';
import { Suspense, lazy, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';

const Homepage = lazy(() => import('./pages/Homepage'));
const CourseList = lazy(() => import('./pages/CourseList'));
const CourseExplore = lazy(() => import('./pages/CourseExplore'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Certification = lazy(() => import('./pages/Certification'));
const Profile = lazy(() => import('./pages/Profile'));
const Lesson = lazy(() => import('./pages/Lesson'));
const QuizFocus = lazy(() => import('./pages/QuizFocus'));
const Flashcard = lazy(() => import('./pages/Flashcard'));
const FlashcardDetail = lazy(() => import('./pages/FlashcardDetail'));
const Notes = lazy(() => import('./pages/Notes'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const TestList = lazy(() => import('./pages/TestList'));
const JlptTest = lazy(() => import('./pages/JlptTest'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

function PageMotion({
  children,
  direction: _direction = 'up',
  preset: _preset = 'lift',
}: {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' | 'none';
  preset?: 'soft' | 'hero' | 'lift' | 'sweep' | 'pop';
}) {
  return <>{children}</>;
}

function RouteScrollReset() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <RouteScrollReset />
            <ThemeTransitionOverlay />
            <ToastContainer />
            <JapaneseDictionaryWidget />
            <Suspense fallback={
              <div className="min-h-screen flex flex-col bg-background">
                <div className="mx-auto my-20 text-center">
                  <p className="text-on-surface-variant">Loading...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/courses" element={<CourseList />} />
                <Route path="/explore" element={<PageMotion direction="up-left"><CourseExplore /></PageMotion>} />
                <Route path="/courses/:id" element={<PageMotion direction="right" preset="sweep"><CourseDetail /></PageMotion>} />
                <Route path="/courses/:id/certificate" element={<PageMotion direction="up" preset="pop"><Certification /></PageMotion>} />
                <Route path="/courses/:id/lessons/:lessonId" element={<PageMotion direction="left" preset="soft"><Lesson /></PageMotion>} />
                <Route path="/courses/:id/lessons/:lessonId/quiz" element={<QuizFocus />} />
                <Route path="/courses/:id/final-test" element={<QuizFocus />} />
                <Route path="/profile" element={<PageMotion direction="down-right"><Profile /></PageMotion>} />
                <Route path="/flashcards" element={<PageMotion direction="up-left"><Flashcard /></PageMotion>} />
                <Route path="/flashcards/:id" element={<PageMotion direction="right" preset="sweep"><FlashcardDetail /></PageMotion>} />
                <Route path="/notes" element={<PageMotion direction="down-left" preset="pop"><Notes /></PageMotion>} />
                <Route path="/tests" element={<PageMotion direction="up-right"><TestList /></PageMotion>} />
                <Route path="/tests/:examId" element={<JlptTest />} />
                <Route path="/admin" element={<PageMotion direction="up" preset="soft"><AdminDashboard /></PageMotion>} />
                <Route path="/blog" element={<PageMotion direction="up-left"><BlogList /></PageMotion>} />
                <Route path="/blog/:id" element={<PageMotion direction="right" preset="sweep"><BlogDetail /></PageMotion>} />
                <Route path="/login" element={<PageMotion direction="down" preset="hero"><Login /></PageMotion>} />
                <Route path="/signup" element={<PageMotion direction="down-right" preset="hero"><Signup /></PageMotion>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
