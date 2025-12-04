import React, { useState } from 'react';
import {
  LoginPage,
  LoginBackground,
  FloatingCard,
  FloatingChip,
  GlowOrb,
  LoginContainer,
  LoginHeader,
  CasinoLogo,
  CasinoTagline,
  LoginForm,
  InputGroup,
  LoginButton,
} from '../styles/LoginScreen.styles';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && !isLoading) {
      setIsLoading(true);
      await onLogin(username.trim());
      setIsLoading(false);
    }
  };

  return (
    <LoginPage>
      <LoginBackground>
        <GlowOrb $position="top" />
        <GlowOrb $position="bottom" />
        <FloatingCard $variant={1}>A</FloatingCard>
        <FloatingCard $variant={2}>K</FloatingCard>
        <FloatingCard $variant={3}>Q</FloatingCard>
        <FloatingCard $variant={4}>J</FloatingCard>
      </LoginBackground>

      <LoginContainer>
        <LoginHeader>
          <CasinoLogo>GRAND WAGER</CasinoLogo>
          <CasinoTagline>Szczęście sprzyja odważnym</CasinoTagline>
        </LoginHeader>

        <LoginForm onSubmit={handleSubmit}>
          <h2>Dołącz do gry</h2>
          
          <InputGroup>
            <label htmlFor="username">Nazwa gracza</label>
            <input
              id="username"
              type="text"
              placeholder="Wprowadź swoją nazwę"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              maxLength={20}
              disabled={isLoading}
            />
          </InputGroup>

          <LoginButton type="submit" disabled={!username.trim() || isLoading}>
            {isLoading ? (
              <span>Logowanie...</span>
            ) : (
              <>
                <span>Wejdź do kasyna</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </>
            )}
          </LoginButton>
        </LoginForm>
      </LoginContainer>
    </LoginPage>
  );
};

export default LoginScreen;
