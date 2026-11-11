import { Platform } from 'react-native';

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  // Títulos editoriais, como no site (Georgia / Times New Roman).
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
};
