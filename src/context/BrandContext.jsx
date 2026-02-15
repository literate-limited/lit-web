/**
 * Brand Context
 *
 * Provides brand information throughout the application.
 * Reads brand from VITE_BRAND environment variable set at build time.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { getCurrentBrand, hasFeature as checkFeature } from '../config/brands';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const brand = useMemo(() => getCurrentBrand(), []);

  const value = useMemo(() => ({
    brand,
    code: brand.code,
    name: brand.name,
    fullName: brand.fullName,
    theme: brand.theme,
    logo: brand.logo,
    logoMark: brand.logoMark,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    defaultLanguage: brand.defaultLanguage,
    features: brand.features,
    meta: brand.meta,
    hasFeature: (feature) => checkFeature(feature)
  }), [brand]);

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

/**
 * Hook to access brand context
 * @returns {object} Brand context value
 */
export function useBrand() {
  const context = useContext(BrandContext);

  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }

  return context;
}

export default BrandContext;
