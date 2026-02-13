import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BrandLogo } from '@components/BrandLogo';
import {
  useTheme,
  useThemeActions,
  BrandId,
  getAvailableBrands,
} from '@presentation/theme/theme';
import { useI18n } from '@presentation/i18n/I18nProvider';

type Props = {
  compact?: boolean;
};

export function BrandSelector({ compact = false }: Props) {
  const theme = useTheme();
  const { setBrand } = useThemeActions();
  const brands = useMemo(() => getAvailableBrands(), []);
  const { t } = useI18n();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center' },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surface,
        },
        chipActive: { borderColor: theme.colors.primary },
        chipText: {
          marginLeft: 8,
          color: theme.colors.text,
          fontFamily: theme.fonts.medium,
        },
        spacer: { width: 12 },
      }),
    [theme]
  );

  const getLabel = (brand: BrandId) => {
    if (brand === 'mindease') return 'MindEase';
    if (brand === 'neon') return 'Neon';
    return brand;
  };

  return (
    <View style={styles.row}>
      {brands.map((brand, idx) => (
        <React.Fragment key={brand}>
          <TouchableOpacity
            onPress={() => setBrand(brand)}
            style={[styles.chip, brand === theme.brand && styles.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={`${t('common.selectBrand')}: ${getLabel(brand)}`}
          >
            <BrandLogo size={compact ? 20 : 28} brand={brand} mode={theme.mode} />
            {!compact && <Text style={styles.chipText}>{getLabel(brand)}</Text>}
          </TouchableOpacity>
          {idx < brands.length - 1 && <View style={styles.spacer} />}
        </React.Fragment>
      ))}
    </View>
  );
}
