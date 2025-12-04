import React, { useState } from 'react';
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

  const avatarUrl = playerId ? `${API_BASE_URL}/api/players/${playerId}/avatar` : null;

  return (
    <NavbarWrapper>
      <MenuButton onClick={onMenuToggle} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </MenuButton>

      <NavLogo>GRAND WAGER</NavLogo>

      <NavUser>
        <NavBalance>
          <BalanceValue>{balance.toFixed(0)}</BalanceValue>
          <BalanceIcon>$</BalanceIcon>
        </NavBalance>
        
        <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
          <UserAvatar>
            {avatarUrl ? (
              <AvatarImage 
                src={avatarUrl} 
                alt={username}
                onError={(e) => {
                  // If avatar fails to load, hide the img and show fallback
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            {!avatarUrl && username.charAt(0).toUpperCase()}
          </UserAvatar>
        </UserButton>

        {showUserMenu && (
          <>
            <DropdownOverlay onClick={() => setShowUserMenu(false)} />
            <UserDropdown>
              <DropdownHeader>
                <DropdownAvatar>
                  {avatarUrl ? (
                    <DropdownAvatarImage 
                      src={avatarUrl} 
                      alt={username}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!avatarUrl && username.charAt(0).toUpperCase()}
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
