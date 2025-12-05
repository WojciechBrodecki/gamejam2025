import React from 'react';
import {
  BetPanelWrapper,
  BetPanelTitle,
  BetControls,
  BetControlsRow,
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
  minBet?: number;
  maxBet?: number;
}

const BetPanel: React.FC<BetPanelProps> = ({
  betAmount,
  onBetAmountChange,
  onPlaceBet,
  playerBalance,
  playerTotalBet,
  playerChance,
  isDisabled,
  minBet = 1,
  maxBet = 10000,
}) => {
  const currentBet = parseFloat(betAmount) || 0;
  const effectiveMaxBet = Math.min(maxBet, playerBalance);
  
  // Calculate step values as powers of 10 based on the bet range
  // Find the order of magnitude of the range
  const range = effectiveMaxBet - minBet;
  const magnitude = Math.floor(Math.log10(Math.max(range, 10)));
  const smallStep = Math.pow(10, Math.max(0, magnitude - 1)); // e.g., 10 for range 100-1000
  const largeStep = Math.pow(10, Math.max(1, magnitude)); // e.g., 100 for range 100-1000

  const modifyBet = (operation: 'half' | 'minusLarge' | 'minusSmall' | 'plusSmall' | 'plusLarge' | 'double' | 'min' | 'max') => {
    let newValue = currentBet;

    switch (operation) {
      case 'min':
        newValue = minBet;
        break;
      case 'half':
        newValue = Math.max(minBet, Math.floor(currentBet / 2));
        break;
      case 'minusLarge':
        newValue = Math.max(minBet, currentBet - largeStep);
        break;
      case 'minusSmall':
        newValue = Math.max(minBet, currentBet - smallStep);
        break;
      case 'plusSmall':
        newValue = Math.min(effectiveMaxBet, currentBet + smallStep);
        break;
      case 'plusLarge':
        newValue = Math.min(effectiveMaxBet, currentBet + largeStep);
        break;
      case 'double':
        newValue = Math.min(effectiveMaxBet, currentBet * 2);
        break;
      case 'max':
        newValue = effectiveMaxBet;
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

  // Format step display
  const formatStep = (step: number): string => {
    if (step >= 1000) return `${Math.round(step / 1000)}k`;
    return step.toString();
  };

  return (
    <BetPanelWrapper>
      <BetPanelTitle>Postaw zakład (${minBet} - ${effectiveMaxBet})</BetPanelTitle>
      
      <BetControls>
        {/* Górny rząd - przyciski zwiększające */}
        <BetControlsRow>
          <BetModifierButton
            onClick={() => modifyBet('double')}
            disabled={currentBet * 2 > effectiveMaxBet || currentBet === 0}
            $variant="success"
          >
            x2
          </BetModifierButton>
          
          <BetModifierButton
            onClick={() => modifyBet('plusLarge')}
            disabled={currentBet >= effectiveMaxBet}
          >
            +{formatStep(largeStep)}
          </BetModifierButton>
          
          <BetModifierButton
            onClick={() => modifyBet('plusSmall')}
            disabled={currentBet >= effectiveMaxBet}
          >
            +{formatStep(smallStep)}
          </BetModifierButton>
          
          <BetModifierButton
            onClick={() => modifyBet('max')}
            disabled={currentBet >= effectiveMaxBet}
            $variant="success"
          >
            MAX
          </BetModifierButton>
        </BetControlsRow>

        {/* Środkowy rząd - input */}
        <BetInputWrapper>
          <BetInput
            type="text"
            value={betAmount}
            onChange={handleInputChange}
            placeholder={minBet.toString()}
          />
        </BetInputWrapper>

        {/* Dolny rząd - przyciski zmniejszające */}
        <BetControlsRow>
          <BetModifierButton
            onClick={() => modifyBet('half')}
            disabled={currentBet <= minBet}
            $variant="danger"
          >
            /2
          </BetModifierButton>
          
          <BetModifierButton
            onClick={() => modifyBet('minusLarge')}
            disabled={currentBet <= minBet}
          >
            -{formatStep(largeStep)}
          </BetModifierButton>
          
          <BetModifierButton
            onClick={() => modifyBet('minusSmall')}
            disabled={currentBet <= minBet}
          >
            -{formatStep(smallStep)}
          </BetModifierButton>
          
          <BetModifierButton
            onClick={() => modifyBet('min')}
            disabled={currentBet <= minBet}
            $variant="danger"
          >
            MIN
          </BetModifierButton>
        </BetControlsRow>
      </BetControls>

      <PlaceBetButton
        onClick={onPlaceBet}
        disabled={isDisabled || currentBet < minBet || currentBet > effectiveMaxBet}
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
