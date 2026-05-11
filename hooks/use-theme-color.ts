/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FlatColorKey = keyof Omit<typeof Colors, 'dark'>;
type DarkColorKey = keyof typeof Colors.dark;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: FlatColorKey
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = theme === 'light' ? props.light : props.dark;

  if (colorFromProps) {
    return colorFromProps;
  }

  if (theme === 'dark' && (colorName as string) in Colors.dark) {
    return Colors.dark[colorName as DarkColorKey];
  }

  return Colors[colorName];
}
