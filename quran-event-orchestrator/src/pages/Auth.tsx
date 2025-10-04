import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import logo from '@/assets/logo.png';

export default function Auth() {
  const { user, signIn, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Redirect if already authenticated
  if (user && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: t.error,
        description: t.fillAllFields,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(loginForm.username, loginForm.password);
    
    if (error) {
      toast({
        title: t.signInFailed,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t.welcomeBack,
        description: "You have been signed in successfully.",
      });
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-accent-light p-4 mobile-safe-area">
      {/* Language Switch */}
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Ayat Events" className="h-16 w-16" />
          </div>
          
          {/* Title */}
          <CardTitle className="text-xl md:text-2xl font-bold mb-2">Ayat Events</CardTitle>
          <CardDescription className="text-sm md:text-base mb-4">Management System</CardDescription>
          
          {/* Login Text */}
          <div className="text-lg font-medium text-muted-foreground">
            {t.signIn}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">{t.username}</Label>
              <Input
                id="login-username"
                type="text"
                placeholder={t.username}
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t.password}</Label>
              <Input
                id="login-password"
                type="password"
                placeholder={t.password}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.signIn}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}