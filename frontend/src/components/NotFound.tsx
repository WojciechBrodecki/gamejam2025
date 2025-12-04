import React from 'react';
import {
  NotFoundPage,
  ErrorCode,
  ErrorDescription,
  BackButton,
} from '../styles/App.styles';

interface NotFoundProps {
  gameName: string;
  onGoBack: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ gameName, onGoBack }) => {
  return (
    <NotFoundPage>
      <ErrorCode>404</ErrorCode>
      <h1>Strona nie znaleziona</h1>
      <ErrorDescription>
        Gra <strong>"{gameName}"</strong> jest jeszcze w przygotowaniu.
        Wróć wkrótce!
      </ErrorDescription>
      <BackButton onClick={onGoBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Wróć do GRAND WAGER
      </BackButton>
    </NotFoundPage>
  );
};

export default NotFound;
