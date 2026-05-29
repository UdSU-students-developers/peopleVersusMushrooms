export type HeaderTheme = 'auth' | 'lobby' | 'hud';

export type HeaderScale = 'S' | 'SM' | 'M' | 'ML' | 'L';

export interface HeaderProps {
  theme: HeaderTheme;
  scale?: HeaderScale;

  title?: string;
  nickname?: string;

  showNickname?: boolean;
  showMenuButton?: boolean;

  isMenuOpen?: boolean;

  onMenuClick?: () => void;
}