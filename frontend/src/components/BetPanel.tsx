import React from 'react';
import {
  BetPanelWrapper,
  BetPanelTitle,
  BetControls,
  BetModifierButton,
  BetInputWrapper,
  BetInput,
  PlaceBetButton,
  BetInfo,
  BetInfoItem,
  BetInfoLabel,
  BetInfoValue,
} from '../styles/BetPanel.styles';

interface BetPanelProps {
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  playerBalance: number;
  playerTotalBet: number;
  playerChance: string;
  isDisabled: boolean;
}

const BetPanel: React.FC<BetPanelProps> = ({
  betAmount,
  onBetAmountChange,
  onPlaceBet,
  playerBalance,
  playerTotalBet,
  playerChance,
  isDisabled,
}) => {
  const currentBet = parseFloat(betAmount) || 0;

  const modifyBet = (operation: 'half' | 'minus10' | 'minus1' | 'plus1' | 'plus10' | 'double') => {
    let newValue = currentBet;

    switch (operation) {
      case 'half':
        newValue = Math.floor(currentBet / 2);
        break;
      case 'minus10':
        newValue = Math.max(0, currentBet - 10);
        break;
      case 'minus1':
        newValue = Math.max(0, currentBet - 1);
        break;
      case 'plus1':
        newValue = Math.min(playerBalance, currentBet + 1);
        break;
      case 'plus10':
        newValue = Math.min(playerBalance, currentBet + 10);
        break;
      case 'double':
        newValue = Math.min(playerBalance, currentBet * 2);
        break;
    }

    onBetAmountChange(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Pozwól tylko na liczby
    if (value === '' || /^\d+$/.test(value)) {
      onBetAmountChange(value);
    }
  };

  return (
    <BetPanelWrapper>
      <BetPanelTitle>Postaw zakład</BetPanelTitle>
      
      <BetControls>
        <BetModifierButton
          onClick={() => modifyBet('half')}
          disabled={currentBet < 2}
          $variant="danger"
        >
          /2
        </BetModifierButton>
        
        <BetModifierButton
          onClick={() => modifyBet('minus10')}
          disabled={currentBet < 10}
        >
          -10
        </BetModifierButton>
        
        <BetModifierButton
          onClick={() => modifyBet('minus1')}
          disabled={currentBet < 1}
        >
          -1
        </BetModifierButton>
        
        <BetInputWrapper>
          <BetInput
            type="text"
            value={betAmount}
            onChange={handleInputChange}
            placeholder="0"
          />
        </BetInputWrapper>
        
        <BetModifierButton
          onClick={() => modifyBet('plus1')}
          disabled={currentBet >= playerBalance}
        >
          +1
        </BetModifierButton>
        
        <BetModifierButton
          onClick={() => modifyBet('plus10')}
          disabled={currentBet + 10 > playerBalance}
        >
          +10
        </BetModifierButton>
        
        <BetModifierButton
          onClick={() => modifyBet('double')}
          disabled={currentBet * 2 > playerBalance || currentBet === 0}
          $variant="success"
        >
          x2
        </BetModifierButton>
      </BetControls>

      <PlaceBetButton
        onClick={onPlaceBet}
        disabled={isDisabled || currentBet <= 0 || (playerBalance > 0 && currentBet > playerBalance)}
      >
        Postaw zakład
      </PlaceBetButton>

      <BetInfo>
        <BetInfoItem>
          <BetInfoLabel>Twój balans</BetInfoLabel>
          <BetInfoValue>${playerBalance.toFixed(0)}</BetInfoValue>
        </BetInfoItem>
        <BetInfoItem>
          <BetInfoLabel>W puli</BetInfoLabel>
          <BetInfoValue $highlight>{playerTotalBet > 0 ? `$${playerTotalBet}` : '-'}</BetInfoValue>
        </BetInfoItem>
        <BetInfoItem>
          <BetInfoLabel>Szansa</BetInfoLabel>
          <BetInfoValue $highlight>{playerChance}</BetInfoValue>
        </BetInfoItem>
      </BetInfo>
    </BetPanelWrapper>
  );
};

export default BetPanel;
