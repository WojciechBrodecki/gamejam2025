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
  ConnectionIndicator,
  StatusDot,
} from '../styles/LoginScreen.styles';

interface LoginScreenProps {
  isConnected: boolean;
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ isConnected, onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
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
        <FloatingChip $variant={1}>●</FloatingChip>
        <FloatingChip $variant={2}>●</FloatingChip>
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
            />
          </InputGroup>

          <LoginButton type="submit" disabled={!isConnected || !username.trim()}>
            {isConnected ? (
              <>
                <span>Wejdź do kasyna</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </>
            ) : (
              <span>Łączenie z serwerem...</span>
            )}
          </LoginButton>
        </LoginForm>

        <ConnectionIndicator $connected={isConnected}>
          <StatusDot $connected={isConnected} />
          <span>{isConnected ? 'Połączono z serwerem' : 'Łączenie...'}</span>
        </ConnectionIndicator>
      </LoginContainer>
    </LoginPage>
  );
};

export default LoginScreen;
