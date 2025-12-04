import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import {
  NavbarWrapper,
  MenuButton,
  NavLogo,
  NavUser,
  NavBalance,
  BalanceValue,
  BalanceIcon,
  UserButton,
  UserAvatar,
  AvatarImage,
  DropdownOverlay,
  UserDropdown,
  DropdownHeader,
  DropdownAvatar,
  DropdownAvatarImage,
  DropdownUsername,
  DropdownDivider,
  DropdownItem,
} from '../styles/Navbar.styles';

interface NavbarProps {
  balance: number;
  username: string;
  playerId: string | null;
  onMenuToggle: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  balance,
  username,
  playerId,
  onMenuToggle,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [balanceAnimate, setBalanceAnimate] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [dropdownAvatarError, setDropdownAvatarError] = useState(false);
  const prevBalanceRef = useRef(balance);

  const avatarUrl = playerId ? `${API_BASE_URL}/api/players/${playerId}/avatar` : null;

  // Animacja przy zmianie balansu
  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      setBalanceAnimate(true);
      const timeout = setTimeout(() => setBalanceAnimate(false), 600);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timeout);
    }
  }, [balance]);

  // Reset avatar error when playerId changes
  useEffect(() => {
    setAvatarError(false);
    setDropdownAvatarError(false);
  }, [playerId]);

  return (
    <NavbarWrapper>
      <MenuButton onClick={onMenuToggle} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </MenuButton>

      <NavLogo>GRAND WAGER</NavLogo>

      <NavUser>
        <NavBalance $animate={balanceAnimate}>
          <BalanceValue>{balance.toFixed(0)}</BalanceValue>
          <BalanceIcon>$</BalanceIcon>
        </NavBalance>
        
        <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
          <UserAvatar>
            {avatarUrl && !avatarError && (
              <AvatarImage 
                src={avatarUrl} 
                alt={username}
                onError={() => setAvatarError(true)}
              />
            )}
            {(!avatarUrl || avatarError) && username.charAt(0).toUpperCase()}
          </UserAvatar>
        </UserButton>

        {showUserMenu && (
          <>
            <DropdownOverlay onClick={() => setShowUserMenu(false)} />
            <UserDropdown>
              <DropdownHeader>
                <DropdownAvatar>
                  {avatarUrl && !dropdownAvatarError && (
                    <DropdownAvatarImage 
                      src={avatarUrl} 
                      alt={username}
                      onError={() => setDropdownAvatarError(true)}
                    />
                  )}
                  {(!avatarUrl || dropdownAvatarError) && username.charAt(0).toUpperCase()}
                </DropdownAvatar>
                <DropdownUsername>{username}</DropdownUsername>
              </DropdownHeader>
              <DropdownDivider />
              <DropdownItem onClick={onLogout}>
                Wyloguj
              </DropdownItem>
            </UserDropdown>
          </>
        )}
      </NavUser>
    </NavbarWrapper>
  );
};

export default Navbar;
