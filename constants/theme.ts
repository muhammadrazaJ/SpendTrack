/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F8F9FA',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Expense app semantic colors
    card: '#fff',
    cardBorder: '#E8E8E8',
    secondaryText: '#555',
    mutedText: '#888',
    inputBg: '#FAFAFA',
    inputBorder: '#E0E0E0',
    primary: '#4CAF50',
    primaryDark: '#45a049',
    danger: '#EF5350',
    dangerBg: '#FFEBEE',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0D0D0D',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Expense app semantic colors
    card: '#1C1C1E',
    cardBorder: '#2C2C2E',
    secondaryText: '#A1A1A6',
    mutedText: '#6C6C70',
    inputBg: '#2C2C2E',
    inputBorder: '#3A3A3C',
    primary: '#4CAF50',
    primaryDark: '#45a049',
    danger: '#EF5350',
    dangerBg: '#3D2020',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
