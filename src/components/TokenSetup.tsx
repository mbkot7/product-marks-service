import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Github, Key, Eye, EyeOff } from 'lucide-react';
import { setGitHubToken, clearGitHubToken } from '../lib/urlState';

export const TokenSetup: React.FC = () => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('github_token');
    setIsConfigured(!!storedToken);
  }, []);

  const handleSaveToken = () => {
    if (token.trim()) {
      setGitHubToken(token.trim());
      setIsConfigured(true);
      setToken('');
    }
  };

  const handleClearToken = () => {
    clearGitHubToken();
    setIsConfigured(false);
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Github className="h-5 w-5" />
          GitHub Token Setup
        </CardTitle>
        <CardDescription className="text-green-600">
          Configure GitHub token for enhanced Gist functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-gray-600" />
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="Enter your GitHub token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSaveToken} disabled={!token.trim()}>
              Save Token
            </Button>
            <p className="text-xs text-gray-600">
              Token will be stored locally in your browser. Get your token from{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub Settings
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <Key className="h-4 w-4" />
              <span className="font-medium">Token configured ✓</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• High rate limits (5000 requests/hour)</p>
              <p>• Authenticated Gist creation</p>
              <p>• Better API reliability</p>
            </div>
            <Button variant="outline" onClick={handleClearToken} className="text-red-600">
              Clear Token
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
