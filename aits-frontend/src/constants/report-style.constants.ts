/**
 * PDF Styling and Layout Design Tokens for AITS Reports
 */

export const PDF_COLORS = {
  primary: '#10A37F', // OpenAI Emerald / AITS Primary Green
  primaryRgb: [16, 163, 127] as [number, number, number],
  primaryDark: '#0E8C6D',
  secondary: '#0EA5E9',
  secondaryRgb: [14, 165, 233] as [number, number, number],
  textDark: '#0D0D0D',
  textDarkRgb: [13, 13, 13] as [number, number, number],
  textMuted: '#5D5D5D',
  textMutedRgb: [93, 93, 93] as [number, number, number],
  textLight: '#8E8E8E',
  textLightRgb: [142, 142, 142] as [number, number, number],
  border: '#E5E5E5',
  borderRgb: [229, 229, 229] as [number, number, number],
  cardBg: '#F9F9F9',
  cardBgRgb: [249, 249, 249] as [number, number, number],
  rowAltBg: '#F8FAFC',
  rowAltBgRgb: [248, 250, 252] as [number, number, number],
  tableHeaderBg: '#10A37F',
  tableHeaderBgRgb: [16, 163, 127] as [number, number, number],
  tableHeaderText: '#FFFFFF',
  tableHeaderTextColor: [255, 255, 255] as [number, number, number],
  white: '#FFFFFF',
  whiteRgb: [255, 255, 255] as [number, number, number],
  danger: '#EF4444',
  success: '#10A37F',
  warning: '#F59E0B',
};

export const PDF_DIMENSIONS = {
  portrait: {
    width: 210, // A4 Width in mm
    height: 297, // A4 Height in mm
  },
  landscape: {
    width: 297,
    height: 210,
  },
  margin: {
    top: 15,
    bottom: 15,
    left: 14,
    right: 14,
  },
  headerHeight: 28,
  footerHeight: 12,
  logoWidth: 32,
  logoHeight: 12,
};

export const PDF_FONTS = {
  family: 'helvetica',
  size: {
    title: 16,
    subtitle: 10,
    sectionHeader: 11,
    body: 8.5,
    tableHeader: 8,
    tableCell: 8,
    cardLabel: 7.5,
    cardValue: 11,
    footer: 7.5,
    small: 7,
  },
};
